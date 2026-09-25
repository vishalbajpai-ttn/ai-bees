import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Browser } from 'playwright'
import type {
  AuditJob,
  AuditRecommendation,
  AuditWorker,
  PhaseId,
} from '../shared/audit.ts'

interface ScreenshotAssets {
  desktop?: Buffer
  mobile?: Buffer
}

interface ReportRecommendation extends AuditRecommendation {
  phase: string
  phaseId: PhaseId
}

const screenshots = new Map<string, ScreenshotAssets>()
const screenshotCaptures = new Map<string, Promise<ScreenshotAssets>>()
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const browserDirectory = path.join(projectRoot, '.playwright-browsers')

const phaseDescriptions: Partial<Record<PhaseId, string>> = {
  'ui-ux':
    'Can visitors understand the page and complete its main task without friction?',
  seo: 'Can search engines find, understand, and rank the page — and will AI answers cite it?',
  'content-freshness':
    "Is the page's content still true and current with recent developments?",
  security: 'Is the page protected against common attacks and data exposure?',
  accessibility:
    'Can people with disabilities perceive and operate the page?',
  performance: 'Does the page load fast and stay responsive on real devices?',
  'privacy-legal':
    'Is visitor consent handled lawfully before tracking happens?',
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function phaseName(worker: AuditWorker) {
  return worker.phase.id === 'seo' ? 'Search visibility' : worker.phase.name
}

function scoreColor(score: number) {
  return score >= 85 ? '#1b7f4b' : score >= 60 ? '#b7791f' : '#b3261e'
}

function verdictStyle(verdict: string) {
  if (verdict === 'PASS') return ['#1b7f4b', '#e6f4ec']
  if (verdict === 'FAIL') return ['#b3261e', '#fbe9e7']
  return ['#b7791f', '#fdf3e0']
}

function dataUri(image?: Buffer) {
  return image ? `data:image/jpeg;base64,${image.toString('base64')}` : undefined
}

async function getChromium() {
  process.env.PLAYWRIGHT_BROWSERS_PATH = browserDirectory
  return (await import('playwright')).chromium
}

async function launchBrowser() {
  const chromium = await getChromium()
  const expectedPath = chromium.executablePath()
  const nativeApplePath = expectedPath.replace(
    'chrome-mac-x64',
    'chrome-mac-arm64',
  )
  const runningThroughRosetta =
    process.platform === 'darwin' &&
    process.arch === 'x64' &&
    existsSync(nativeApplePath)

  return chromium.launch({
    headless: true,
    timeout: 20_000,
    ...(runningThroughRosetta ? { executablePath: nativeApplePath } : {}),
  })
}

async function captureViewport(
  browser: Browser,
  url: string,
  viewport: { width: number; height: number },
) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce',
  })
  try {
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForTimeout(1_500)
    return await page.screenshot({
      type: 'jpeg',
      quality: 82,
      fullPage: false,
      animations: 'disabled',
    })
  } finally {
    await context.close()
  }
}

async function captureAuditScreenshots(job: AuditJob) {
  const browser = await launchBrowser()
  try {
    const [desktop, mobile] = await Promise.all([
      captureViewport(browser, job.url, { width: 1440, height: 900 }),
      captureViewport(browser, job.url, { width: 390, height: 844 }),
    ])
    return { desktop: Buffer.from(desktop), mobile: Buffer.from(mobile) }
  } finally {
    await browser.close()
  }
}

async function getOrCaptureScreenshots(job: AuditJob) {
  const cached = screenshots.get(job.id)
  if (cached) return cached

  const pending =
    screenshotCaptures.get(job.id) ??
    captureAuditScreenshots(job)
      .catch((error) => {
        console.warn('Screenshot capture failed', error)
        return {} as ScreenshotAssets
      })
      .then((assets) => {
        screenshots.set(job.id, assets)
        screenshotCaptures.delete(job.id)
        return assets
      })
  screenshotCaptures.set(job.id, pending)
  return pending
}

export async function getAuditScreenshot(
  job: AuditJob,
  viewport: 'desktop' | 'mobile',
) {
  return (await getOrCaptureScreenshots(job))[viewport]
}

function scoreRing(score: number) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  return `<svg width="140" height="140" viewBox="0 0 140 140" aria-label="${score} out of 100">
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e8edf2" stroke-width="14"/>
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${scoreColor(score)}" stroke-width="14"
      stroke-linecap="round" stroke-dasharray="${circumference.toFixed(1)}"
      stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 70 70)"/>
    <text x="70" y="66" text-anchor="middle" font-size="30" font-weight="700" fill="#1a2b4a">${score}</text>
    <text x="70" y="88" text-anchor="middle" font-size="12" fill="#5b6b7f">/ 100</text>
  </svg>`
}

function collectRecommendations(workers: AuditWorker[]) {
  const seen = new Set<string>()
  const order = { Now: 0, Next: 1, Later: 2 }
  return workers
    .flatMap((worker) =>
      (worker.result?.recommendations ?? []).map((recommendation) => ({
        ...recommendation,
        phase: phaseName(worker),
        phaseId: worker.phase.id,
      })),
    )
    .filter((recommendation) => {
      const key = recommendation.title.toLowerCase().replace(/\W/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((left, right) => order[left.priority] - order[right.priority])
    .slice(0, 12)
}

function executiveSummary(
  job: AuditJob,
  workers: AuditWorker[],
  recommendations: ReportRecommendation[],
) {
  const ranked = [...workers]
    .filter((worker) => worker.result)
    .sort((left, right) => right.result!.score - left.result!.score)
  const strongest = ranked[0]
  const weakest = ranked.at(-1)
  const urgent = recommendations
    .filter((recommendation) => recommendation.priority === 'Now')
    .slice(0, 2)
    .map((recommendation) => recommendation.title)
  const priorities = urgent.length
    ? `The most urgent actions are ${urgent.join(' and ')}.`
    : 'No immediate blocking action was recorded, but planned improvements remain.'

  return `This report evaluates ${job.url} across seven specialist phases. The page received an overall score of ${job.summary!.score} out of 100 and a verdict of ${job.summary!.verdict}. ${
    strongest
      ? `${phaseName(strongest)} is the strongest area at ${strongest.result!.score}, while ${phaseName(weakest!)} is the weakest at ${weakest!.result!.score}.`
      : ''
  } ${priorities} Addressing the prioritized recommendations will reduce risk and make the page more effective for its intended visitors.`
}

function screenshotFor(
  recommendation: ReportRecommendation,
  assets: ScreenshotAssets,
) {
  if (recommendation.phaseId === 'security') return undefined
  const useMobile =
    recommendation.phaseId === 'accessibility' ||
    recommendation.phaseId === 'performance' ||
    recommendation.phaseId === 'privacy-legal'
  return dataUri(useMobile ? assets.mobile : assets.desktop)
}

function recommendationCard(
  recommendation: ReportRecommendation,
  image?: string,
) {
  const screenshot = image
    ? `<figure class="shot">
        <div class="shot-label"><strong>Visual evidence</strong><span>${escapeHtml(recommendation.evidence)}</span></div>
        <img src="${image}" alt="Captured ${escapeHtml(recommendation.phase)} audit viewport"/>
        <figcaption>Point-in-time ${recommendation.phase} evidence captured from the audited page.</figcaption>
      </figure>`
    : `<div class="evidence"><strong>Evidence</strong><p>${escapeHtml(recommendation.evidence)}</p></div>`

  return `<article class="rec-card">
    <div class="rec-head">
      <div><span class="severity severity-${recommendation.severity.toLowerCase()}">${escapeHtml(recommendation.severity)}</span>
      <span class="rec-title">${escapeHtml(recommendation.title)}</span></div>
      <span class="effort">Effort: ${escapeHtml(recommendation.effort)}</span>
    </div>
    <div class="explain"><div class="explain-label">Understanding the issue</div>
      <p>${escapeHtml(recommendation.explanation)}</p></div>
    ${screenshot}
    <div class="impact-grid">
      <div><strong>Business impact</strong><p>${escapeHtml(recommendation.businessImpact)}</p></div>
      <div><strong>Recommended fix</strong><p>${escapeHtml(recommendation.action)}</p></div>
    </div>
    <p class="rec-phase">Source: ${escapeHtml(recommendation.phase)} audit</p>
  </article>`
}

export function renderAuditReportHtml(
  job: AuditJob,
  assets: ScreenshotAssets = {},
) {
  if (!job.summary) throw new Error('The audit is not complete yet.')

  const workers = job.workers.filter((worker) => worker.result)
  const recommendations = collectRecommendations(workers)
  const caveats = [...new Set(workers.flatMap((worker) => worker.result!.caveats))]
  const [verdictColor, verdictBackground] = verdictStyle(job.summary.verdict)
  let screenshotsUsed = 0
  const phasesWithScreenshot = new Set<PhaseId>()

  const phaseRows = workers
    .map(
      (worker) => `<tr>
        <td><strong>${escapeHtml(phaseName(worker))}</strong><div class="phase-desc">${escapeHtml(phaseDescriptions[worker.phase.id])}</div></td>
        <td><div class="bar"><div style="width:${worker.result!.score}%;background:${scoreColor(worker.result!.score)}"></div></div></td>
        <td class="num"><strong>${worker.result!.score}</strong></td>
        <td><span class="pill">${worker.result!.confidence.level}</span> <span class="muted">${worker.result!.confidence.percentage}%</span></td>
        <td class="num">${worker.result!.blockers}</td>
      </tr>`,
    )
    .join('')

  const recommendationSections = (['Now', 'Next', 'Later'] as const)
    .map((priority) => {
      const items = recommendations.filter((item) => item.priority === priority)
      if (!items.length) return ''
      const cards = items
        .map((recommendation) => {
          const canShowScreenshot =
            screenshotsUsed < 4 &&
            !phasesWithScreenshot.has(recommendation.phaseId) &&
            Boolean(screenshotFor(recommendation, assets))
          if (canShowScreenshot) {
            screenshotsUsed += 1
            phasesWithScreenshot.add(recommendation.phaseId)
          }
          return recommendationCard(
            recommendation,
            canShowScreenshot
              ? screenshotFor(recommendation, assets)
              : undefined,
          )
        })
        .join('')
      const label =
        priority === 'Now'
          ? 'act immediately'
          : priority === 'Next'
            ? 'plan this quarter'
            : 'longer-term improvements'
      return `<h3 class="priority priority-${priority.toLowerCase()}">${priority}<span>— ${label}</span></h3>${cards}`
    })
    .join('')

  const appendix = workers
    .map((worker) => {
      const result = worker.result!
      const findings = Object.entries(result.findings)
        .map(([name, count]) => `${name}: ${count}`)
        .join(' / ')
      const fixes = result.recommendations
        .map(
          (fix) => `<li><span class="severity severity-${fix.severity.toLowerCase()}">${fix.severity}</span>
            <strong>${escapeHtml(fix.title)}</strong><p>${escapeHtml(fix.explanation)}</p>
            <div class="technical-evidence"><strong>Evidence:</strong> ${escapeHtml(fix.evidence)}</div></li>`,
        )
        .join('')
      const limitations = result.caveats
        .map((caveat) => `<li>${escapeHtml(caveat)}</li>`)
        .join('')
      return `<section class="phase-detail">
        <div class="phase-detail-head"><div><span>Phase detail</span><h3>${escapeHtml(phaseName(worker))}</h3></div>
          <strong>${result.score}<small>/100</small></strong></div>
        <p class="phase-summary">${escapeHtml(result.summary)}</p>
        <div class="phase-facts"><span>Confidence <strong>${result.confidence.level} (${result.confidence.percentage}%)</strong></span>
          <span>Blockers <strong>${result.blockers}</strong></span></div>
        <p class="muted">${escapeHtml(result.confidence.reason)}</p>
        <p><strong>Findings:</strong> ${escapeHtml(findings)}</p>
        <h4>Top fixes</h4><ul class="fixes">${fixes || '<li>None recorded.</li>'}</ul>
        ${limitations ? `<h4>Could not verify</h4><ul>${limitations}</ul>` : ''}
      </section>`
    })
    .join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Website Audit Report — ${escapeHtml(job.url)}</title>
<style>
  @page { size: A4; margin: 16mm 15mm 20mm; }
  * { box-sizing: border-box; }
  body { margin:0; color:#1a2b4a; font:13px/1.55 Arial,Helvetica,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .cover { min-height:250mm; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; page-break-after:always; }
  .kicker { color:#8a97a8; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; }
  .cover h1 { margin:12px 0 6px; font:700 34px/1.2 Georgia,serif; }
  .url { max-width:620px; color:#3d5a80; word-break:break-all; }
  .verdict { margin:25px 0 16px; padding:8px 30px; border:2px solid ${verdictColor}; border-radius:999px; background:${verdictBackground}; color:${verdictColor}; font-size:19px; font-weight:700; }
  .confidence { max-width:580px; color:#5b6b7f; font-size:12px; }
  .cover-meta { margin-top:16px; color:#8a97a8; font-size:11px; }
  h2 { margin:34px 0 13px; padding-bottom:6px; border-bottom:3px solid #1a2b4a; font:700 21px/1.3 Georgia,serif; break-after:avoid; }
  h3,h4 { break-after:avoid; } p { orphans:3; widows:3; }
  .summary-box { padding:18px 20px; border-left:4px solid #1a2b4a; background:#f7f9fc; font-size:13.5px; }
  .legend { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:16px 18px; border-radius:8px; background:#f7f9fc; font-size:12px; }
  .legend strong { color:#1a2b4a; }
  table { width:100%; margin-top:12px; border-collapse:collapse; }
  th { padding:9px 10px; background:#f1f4f8; color:#5b6b7f; font-size:10px; letter-spacing:.5px; text-align:left; text-transform:uppercase; }
  td { padding:10px; border-bottom:1px solid #e8edf2; vertical-align:middle; }
  .phase-desc { max-width:245px; margin-top:2px; color:#5b6b7f; font-size:10px; }
  .num { text-align:right; font-variant-numeric:tabular-nums; }
  .bar { min-width:110px; height:9px; overflow:hidden; border-radius:8px; background:#e8edf2; }
  .bar div { height:100%; border-radius:8px; }
  .pill { display:inline-block; padding:2px 9px; border-radius:999px; background:#eef2f7; font-size:11px; font-weight:700; }
  .muted { color:#718096; font-size:11px; }
  .method { color:#5b6b7f; font-size:11px; }
  .priority { padding:8px 13px; border-radius:6px; color:#fff; }
  .priority span { margin-left:8px; color:rgba(255,255,255,.85); font-size:11px; font-weight:400; }
  .priority-now { background:#b3261e; }.priority-next { background:#b7791f; }.priority-later { background:#3d5a80; }
  .rec-card { margin:12px 0 18px; padding:15px 18px; border:1px solid #dfe6ee; border-radius:9px; box-shadow:0 2px 8px rgba(26,43,74,.06); break-inside:avoid; }
  .rec-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .rec-head>div { display:flex; align-items:center; gap:8px; }.rec-title { font-size:14px; font-weight:700; }
  .effort,.rec-phase { color:#718096; font-size:10px; white-space:nowrap; }
  .severity { display:inline-block; padding:2px 7px; border-radius:4px; color:#fff; font-size:9px; font-weight:700; text-transform:uppercase; }
  .severity-critical { background:#b3261e; }.severity-high { background:#c2410c; }.severity-medium { background:#b7791f; }.severity-low,.severity-info { background:#5b6b7f; }
  .explain { margin:12px 0; padding:10px 14px; border-left:4px solid #3d5a80; border-radius:0 6px 6px 0; background:#f0f6ff; }
  .explain-label { color:#3d5a80; font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }.explain p { margin:3px 0; }
  .evidence { padding:9px 12px; border:1px solid #e8edf2; border-radius:6px; background:#fbfcfe; }.evidence strong { font-size:10px; text-transform:uppercase; }.evidence p { margin:3px 0; }
  .shot { margin:14px 0; break-inside:avoid; }.shot-label { display:flex; gap:8px; padding:9px 12px; border-radius:7px 7px 0 0; background:#b3261e; color:#fff; font-size:10px; }
  .shot-label strong { flex:0 0 auto; text-transform:uppercase; }.shot-label span { opacity:.92; }
  .shot img { display:block; width:100%; max-height:275px; border:2px solid #b3261e; border-top:0; object-fit:cover; object-position:top; }
  .shot figcaption { margin-top:5px; color:#718096; font-size:10px; text-align:center; }
  .impact-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:12px; }.impact-grid>div { padding:10px 12px; border-radius:6px; background:#f7f9fc; }.impact-grid strong { font-size:10px; text-transform:uppercase; }.impact-grid p { margin:4px 0; }
  .scope { padding:14px 18px; border:1px solid #f0dfae; border-radius:8px; background:#fff8e6; }
  .appendix-title { page-break-before:always; }
  .phase-detail { margin:16px 0; padding:15px 18px; border:1px solid #e0e6ee; border-radius:9px; break-inside:avoid; }
  .phase-detail-head { display:flex; align-items:center; justify-content:space-between; }.phase-detail-head span { color:#8a97a8; font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .phase-detail-head h3 { margin:2px 0; font:700 18px Georgia,serif; }.phase-detail-head>strong { font-size:25px; }.phase-detail-head small { color:#718096; font-size:10px; }
  .phase-summary { padding:10px 12px; border-left:3px solid #3d5a80; background:#f7f9fc; }.phase-facts { display:flex; gap:24px; color:#718096; font-size:11px; }
  .fixes { padding-left:0; list-style:none; }.fixes li { margin:10px 0; }.fixes p { margin:3px 0 3px 0; }.technical-evidence { margin-left:0; color:#5b6b7f; font-size:11px; }
</style></head><body>
  <section class="cover">
    <div class="kicker">Website Audit Report</div>
    <h1>${escapeHtml(new URL(job.url).hostname)}</h1><div class="url">${escapeHtml(job.url)}</div>
    <div class="verdict">${job.summary.verdict}</div>${scoreRing(job.summary.score)}
    <p class="confidence">Overall confidence: <strong>${job.summary.confidenceLevel}</strong> (${job.summary.confidence}%) — based on the evidence each specialist could verify.</p>
    <p class="cover-meta">Audited ${escapeHtml(new Date(job.updatedAt).toLocaleDateString('en-GB', { dateStyle: 'long' }))} · Strict 7-phase evaluation<br/>Security 20 · SEO 18 · UI/UX 15 · Accessibility 15 · Performance 12 · Content 10 · Privacy 10</p>
  </section>
  <h2>Executive Summary</h2><div class="summary-box">${escapeHtml(executiveSummary(job, workers, recommendations))}</div>
  <h2>How to Read This Report</h2>
  <div class="legend"><div><strong>Scores</strong> are 0–100 per phase; 85+ is strong, 60–84 needs work, below 60 is failing.</div>
    <div><strong>Confidence</strong> describes how thoroughly each phase was verified, not the quality score.</div>
    <div><strong>Priority:</strong> Now = act immediately · Next = plan this quarter · Later = longer-term.</div>
    <div>Recommendations include plain-language context, direct evidence, business impact, and an assignable fix.</div></div>
  <h2>Score Overview</h2>
  <table><thead><tr><th>Phase</th><th>Score</th><th class="num">/100</th><th>Confidence</th><th class="num">Blockers</th></tr></thead><tbody>${phaseRows}</tbody></table>
  <p class="method">Overall score is the weighted mean of completed phases. Any blocker forces an overall FAIL. Coverage: ${job.summary.completedWeight}%.</p>
  <h2>Recommended Actions</h2><p>Prioritized by business impact. Visual evidence is included where a viewport capture helps explain the recommendation.</p>
  ${recommendationSections || '<p>No recommendations were recorded.</p>'}
  <h2>Scope &amp; Limitations</h2><div class="scope"><p>This is a single-page, external assessment of ${escapeHtml(job.url)}. It is not a penetration test or legal advice.</p>
    ${caveats.length ? `<p><strong>Not verified in this audit:</strong></p><ul>${caveats.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
    <p class="muted">This is a point-in-time assessment. Scores can change with site updates, traffic shifts, and evolving standards.</p></div>
  <h2 class="appendix-title">Appendix — Phase Detail</h2><p class="muted">Technical evidence for the teams implementing fixes. Executives can stop here.</p>
  ${appendix}
</body></html>`
}

export async function generateAuditPdf(
  job: AuditJob,
  suppliedAssets?: ScreenshotAssets | null,
) {
  if (!job.summary) throw new Error('The audit is not complete yet.')
  const assets =
    suppliedAssets === null
      ? {}
      : suppliedAssets ?? (await getOrCaptureScreenshots(job))
  const html = renderAuditReportHtml(job, assets)
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.emulateMedia({ media: 'screen' })
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="width:100%;font:9px Arial;color:#8a97a8;text-align:center">Website Audit Report&nbsp; • &nbsp;Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      margin: { top: '16mm', right: '15mm', bottom: '20mm', left: '15mm' },
    })
  } finally {
    await browser.close()
  }
}

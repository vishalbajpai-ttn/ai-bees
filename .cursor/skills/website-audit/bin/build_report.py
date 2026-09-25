#!/usr/bin/env python3
"""
build_report.py — Render an executive-level website audit report as PDF.

Reads a JSON results file (see ../references/report-schema.md) and produces a
polished, print-ready report. Pure standard library for the HTML rendering;
PDF conversion tries, in order:
  1. weasyprint (pip install weasyprint) — best fidelity
  2. headless Chromium/Chrome --print-to-pdf (if a browser binary exists)
  3. falls back to saving the styled HTML (open in a browser -> Print -> Save as PDF)

Usage:
    python3 build_report.py results.json [-o report.pdf]

The report is designed to be shown to executive-level managers:
  - Cover page with verdict + overall score
  - One-page executive summary in plain business language (no jargon)
  - Phase score overview with confidence levels
  - Prioritized recommendations roadmap (Now / Next / Later) with business impact
  - Technical detail kept in a clearly-marked appendix
"""

import html
import json
import mimetypes
import shutil
import subprocess
import sys
from base64 import b64encode
from datetime import date
from pathlib import Path

VERDICT_STYLE = {
    "PASS": ("#1b7f4b", "#e6f4ec"),
    "NEEDS WORK": ("#b7791f", "#fdf3e0"),
    "FAIL": ("#b3261e", "#fbe9e7"),
}

SEV_COLOR = {
    "Blocker": "#b3261e", "Critical": "#b3261e", "High": "#c2410c",
    "Serious": "#c2410c", "Medium": "#b7791f", "Moderate": "#b7791f",
    "Low": "#5b6b7f", "Minor": "#5b6b7f", "Info": "#5b6b7f",
}

PRIORITY_ORDER = {"Now": 0, "Next": 1, "Later": 2}


def esc(v):
    return html.escape(str(v if v is not None else ""))


def embed_image(ref):
    """Turn a screenshot reference into an <img> tag.

    ref may be {"path": "/local/file.png", "caption": "..."} or
    {"url": "https://...", "caption": "..."}. Local files are embedded as
    base64 data URIs so the PDF stays self-contained. Missing files render
    as a graceful placeholder note instead of breaking the report.
    """
    if not isinstance(ref, dict):
        return ""
    caption = esc(ref.get("caption", ""))
    src = None
    if ref.get("path"):
        p = Path(ref["path"]).expanduser()
        if p.is_file():
            mime, _ = mimetypes.guess_type(str(p))
            mime = mime or "image/png"
            try:
                data = b64encode(p.read_bytes()).decode("ascii")
                src = f"data:{mime};base64,{data}"
            except Exception:
                src = None
        if src is None:
            return (f"<figure class='shot missing'><div class='shot-missing-note'>"
                    f"Screenshot not available: {esc(ref['path'])}</div>"
                    + (f"<figcaption>{caption}</figcaption>" if caption else "")
                    + "</figure>")
    elif ref.get("url"):
        src = esc(ref["url"],)
    if not src:
        return ""
    return (f"<figure class='shot'><img src='{src}' alt='{caption or 'Audit screenshot'}'/>"
            + (f"<figcaption>{caption}</figcaption>" if caption else "")
            + "</figure>")


def esc_url(v):
    return html.escape(str(v), quote=True)


def score_bar(score):
    color = "#1b7f4b" if score >= 85 else "#b7791f" if score >= 60 else "#b3261e"
    return (
        f'<div class="bar"><div class="fill" style="width:{score}%;'
        f'background:{color}"></div></div>'
    )


def score_ring(score):
    # SVG progress ring, 120px
    color = "#1b7f4b" if score >= 85 else "#b7791f" if score >= 60 else "#b3261e"
    r = 52
    circ = 2 * 3.14159 * r
    off = circ * (1 - score / 100)
    return (
        f'<svg width="140" height="140" viewBox="0 0 140 140">'
        f'<circle cx="70" cy="70" r="{r}" fill="none" stroke="#e8edf2" stroke-width="14"/>'
        f'<circle cx="70" cy="70" r="{r}" fill="none" stroke="{color}" stroke-width="14" '
        f'stroke-linecap="round" stroke-dasharray="{circ:.1f}" '
        f'stroke-dashoffset="{off:.1f}" transform="rotate(-90 70 70)"/>'
        f'<text x="70" y="66" text-anchor="middle" font-size="30" font-weight="700" '
        f'fill="#1a2b4a">{score}</text>'
        f'<text x="70" y="88" text-anchor="middle" font-size="12" fill="#5b6b7f">/ 100</text>'
        f'</svg>'
    )


PHASE_DESCRIPTIONS = {
    "UI/UX": "Can visitors understand the page and complete its main task without friction?",
    "SEO": "Can search engines find, understand, and rank the page — and will AI answers cite it?",
    "Content freshness": "Is the page's content still true and current with the latest industry developments?",
    "Security": "Is the page protected against common attacks and data exposure?",
    "Accessibility": "Can people with disabilities perceive and operate the page?",
    "Performance": "Does the page load fast and stay responsive on real devices?",
    "Privacy & legal": "Is visitor consent handled lawfully before any tracking happens?",
}


def render(data):
    verdict = data.get("verdict", "NEEDS WORK")
    vcolor, vbg = VERDICT_STYLE.get(verdict, VERDICT_STYLE["NEEDS WORK"])
    rep_date = data.get("date") or date.today().isoformat()
    phases = data.get("phases", [])
    recs = sorted(data.get("recommendations", []),
                   key=lambda r: PRIORITY_ORDER.get(r.get("priority", "Later"), 2))

    # --- phase overview rows ---
    phase_rows = []
    for p in phases:
        conf = p.get("confidence", {})
        desc = PHASE_DESCRIPTIONS.get(p.get("name"), "")
        phase_rows.append(
            f"<tr><td><strong>{esc(p.get('name'))}</strong>"
            + (f"<div class='phase-desc'>{esc(desc)}</div>" if desc else "") + "</td>"
            f"<td>{score_bar(p.get('score', 0))}</td>"
            f"<td class='num'>{esc(p.get('score', 0))}</td>"
            f"<td><span class='pill'>{esc(conf.get('level', '—'))}</span> "
            f"<span class='muted'>{esc(conf.get('pct', ''))}%</span></td>"
            f"<td class='num'>{esc(p.get('blockers', 0))}</td></tr>"
        )

    # --- recommendations grouped by priority ---
    rec_sections = []
    for prio in ("Now", "Next", "Later"):
        items = [r for r in recs if r.get("priority") == prio]
        if not items:
            continue
        cards = []
        for r in items:
            explanation = r.get("explanation", "")
            shot = embed_image(r.get("screenshot")) if r.get("screenshot") else ""
            cards.append(
                f"<div class='rec-card'><div class='rec-head'>"
                f"<span class='rec-title'>{esc(r.get('title'))}</span>"
                f"<span class='effort'>Effort: {esc(r.get('effort', '—'))}</span></div>"
                + (f"<div class='explain'><div class='explain-label'>Understanding the issue</div>"
                   f"<p>{esc(explanation)}</p></div>" if explanation else "")
                + shot
                + (f"<p class='rec-impact'><strong>Business impact:</strong> "
                   f"{esc(r.get('business_impact'))}</p>" if r.get("business_impact") else "")
                + (f"<p class='rec-action'><strong>Recommended fix:</strong> "
                   f"{esc(r.get('action'))}</p>" if r.get("action") else "")
                + f"<p class='rec-phase muted'>Source: {esc(r.get('phase', ''))} audit</p>"
                f"</div>"
            )
        rec_sections.append(
            f"<h3 class='prio prio-{prio.lower()}'>{prio} "
            f"<span class='muted'>— {'act immediately' if prio == 'Now' else 'plan this quarter' if prio == 'Next' else 'longer-term improvements'}</span></h3>"
            + "\n".join(cards)
        )

    # --- phase detail appendix ---
    phase_details = []
    for p in phases:
        conf = p.get("confidence", {})
        findings = p.get("findings", {})
        counts = " / ".join(f"{esc(k)}: {esc(v)}" for k, v in findings.items()) or "None recorded"
        fixes = ""
        for f in p.get("top_fixes", []):
            why = f.get("explanation", "")
            fixes += (
                f"<li><span class='sev' style='background:{SEV_COLOR.get(f.get('severity', ''), '#5b6b7f')}'>"
                f"{esc(f.get('severity', ''))}</span> <strong>{esc(f.get('fix'))}</strong>"
                + (f"<div class='fix-why'>{esc(why)}</div>" if why else "")
                + "</li>"
            )
        caveats = "".join(f"<li>{esc(c)}</li>" for c in p.get("caveats", []))
        phase_details.append(
            f"<div class='phase-detail'><h3>{esc(p.get('name'))} "
            f"<span class='muted'>— score {esc(p.get('score'))}/100, "
            f"confidence {esc(conf.get('level'))} ({esc(conf.get('pct'))}%)</span></h3>"
            f"<p><strong>Findings:</strong> {counts}</p>"
            f"<p><strong>Top fixes:</strong></p><ul class='fixes'>{fixes or '<li>None</li>'}</ul>"
            + (f"<p><strong>Could not verify:</strong></p><ul>{caveats}</ul>" if caveats else "")
            + "</div>"
        )

    not_verified = "".join(f"<li>{esc(x)}</li>" for x in data.get("not_verified", []))

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Website Audit Report — {esc(data.get('page', ''))}</title>
<style>
  @page {{ size: A4; margin: 18mm 16mm 20mm 16mm;
           @bottom-center {{ content: "Website Audit Report  •  Page " counter(page) " of " counter(pages);
                             font-size: 9px; color: #8a97a8; font-family: sans-serif; }} }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
          color: #1a2b4a; line-height: 1.55; font-size: 13px; margin: 0; }}
  .cover {{ text-align: center; padding: 70px 20px 40px; page-break-after: always; }}
  .cover .kicker {{ text-transform: uppercase; letter-spacing: 3px; font-size: 12px; color: #8a97a8; }}
  .cover h1 {{ font-size: 34px; margin: 12px 0 6px; }}
  .cover .url {{ font-size: 15px; color: #3d5a80; word-break: break-all; }}
  .verdict {{ display: inline-block; margin: 26px 0 18px; padding: 10px 34px; border-radius: 999px;
              font-size: 20px; font-weight: 700; color: {vcolor}; background: {vbg};
              border: 2px solid {vcolor}; }}
  .meta {{ color: #5b6b7f; font-size: 12px; margin-top: 14px; }}
  h2 {{ font-size: 20px; color: #1a2b4a; border-bottom: 3px solid #1a2b4a;
        padding-bottom: 6px; margin-top: 38px; }}
  h3 {{ font-size: 15px; margin-top: 24px; }}
  .muted {{ color: #8a97a8; font-size: 12px; }}
  .num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }}
  th {{ text-align: left; background: #f1f4f8; padding: 9px 10px; font-size: 12px;
       text-transform: uppercase; letter-spacing: .5px; color: #5b6b7f; }}
  td {{ padding: 9px 10px; border-bottom: 1px solid #e8edf2; vertical-align: middle; }}
  .bar {{ height: 10px; background: #e8edf2; border-radius: 5px; min-width: 120px; }}
  .bar .fill {{ height: 10px; border-radius: 5px; }}
  .pill {{ display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 12px;
           font-weight: 600; background: #eef2f7; color: #1a2b4a; }}
  .summary-box {{ background: #f7f9fc; border-left: 4px solid #1a2b4a; padding: 16px 20px;
                  margin-top: 14px; font-size: 13.5px; }}
  .prio {{ padding: 8px 14px; border-radius: 6px; color: #fff; }}
  .prio-now {{ background: #b3261e; }} .prio-next {{ background: #b7791f; }}
  .prio-later {{ background: #3d5a80; }}
  .prio .muted {{ color: rgba(255,255,255,.85); }}
  .rec-card {{ border: 1px solid #e0e6ee; border-radius: 8px; padding: 14px 18px; margin: 12px 0;
               page-break-inside: avoid; }}
  .rec-head {{ display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }}
  .rec-title {{ font-weight: 700; font-size: 14px; }}
  .effort {{ font-size: 12px; color: #5b6b7f; white-space: nowrap; }}
  .rec-impact {{ margin: 8px 0 4px; }} .rec-action {{ margin: 4px 0; color: #33475f; }}
  .rec-phase {{ margin: 6px 0 0; }}
  .phase-detail {{ page-break-inside: avoid; border: 1px solid #e8edf2; border-radius: 8px;
                   padding: 4px 18px 12px; margin: 14px 0; }}
  .fixes {{ list-style: none; padding: 0; }}
  .fixes li {{ margin: 6px 0; }}
  .sev {{ display: inline-block; color: #fff; font-size: 11px; font-weight: 700; border-radius: 4px;
          padding: 1px 8px; margin-right: 8px; }}
  .scope {{ background: #fff8e6; border: 1px solid #f0dfae; border-radius: 8px; padding: 14px 18px; }}
  .conf-note {{ font-size: 12px; color: #5b6b7f; }}
  .weights {{ font-size: 12px; color: #5b6b7f; }}
  .phase-desc {{ font-size: 11.5px; color: #5b6b7f; margin-top: 2px; max-width: 260px; }}
  .explain {{ background: #f0f6ff; border-left: 4px solid #3d5a80; border-radius: 0 6px 6px 0;
              padding: 10px 16px; margin: 12px 0; }}
  .explain-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
                    color: #3d5a80; font-weight: 700; margin-bottom: 4px; }}
  .explain p {{ margin: 4px 0; }}
  .fix-why {{ font-size: 12.5px; color: #33475f; margin: 4px 0 8px 0; padding-left: 2px; }}
  figure.shot {{ margin: 14px 0; page-break-inside: avoid; }}
  figure.shot img {{ max-width: 100%; border: 1px solid #d7dee8; border-radius: 8px;
                     box-shadow: 0 2px 8px rgba(26,43,74,.12); }}
  figure.shot figcaption {{ font-size: 12px; color: #5b6b7f; margin-top: 6px; text-align: center; }}
  figure.shot.missing .shot-missing-note {{ border: 1px dashed #b9c4d4; border-radius: 8px;
                     padding: 18px; text-align: center; color: #8a97a8; font-size: 12px; }}
  .legend {{ display: flex; flex-wrap: wrap; gap: 10px 22px; background: #f7f9fc;
             border-radius: 8px; padding: 14px 18px; margin-top: 12px; font-size: 12.5px; }}
  .legend .k {{ font-weight: 700; }}
  .dot {{ display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 5px; }}
</style></head><body>

<div class="cover">
  <div class="kicker">Website Audit Report</div>
  <h1>{esc(data.get('page', 'Untitled page'))}</h1>
  <div class="url">{esc(data.get('page', ''))}</div>
  <div><span class="verdict">{esc(verdict)}</span></div>
  <div>{score_ring(data.get('overall_score', 0))}</div>
  <p class="conf-note">Overall confidence: <strong>{esc(data.get('overall_confidence', {}).get('level', '—'))}</strong>
  ({esc(data.get('overall_confidence', {}).get('pct', '—'))}%) — {esc(data.get('overall_confidence', {}).get('reason', ''))}</p>
  <p class="meta">Audited {esc(rep_date)} &nbsp;•&nbsp; Strict 7-phase evaluation &nbsp;•&nbsp;
  Scores weighted: Security 20 · SEO 18 · UI/UX 15 · Accessibility 15 · Performance 12 · Content 10 · Privacy 10</p>
</div>

<h2>Executive Summary</h2>
<div class="summary-box">{esc(data.get('executive_summary', 'No summary provided.'))}</div>

<h2>How to Read This Report</h2>
<div class="legend">
  <div><span class="k">Scores</span> are 0–100 per phase; 85+ is strong, 60–84 needs work, below 60 is failing.</div>
  <div><span class="k">Confidence</span> tells you how thoroughly each phase was verified — High means direct measurement, Medium means partial evidence, Low means limited evidence.</div>
  <div><span class="k">Severity:</span>
    <span class="dot" style="background:#b3261e"></span>Critical/Blocker — fix before anything else
    <span class="dot" style="background:#c2410c"></span>High/Serious — important, fix soon
    <span class="dot" style="background:#b7791f"></span>Medium — fix as planned
    <span class="dot" style="background:#5b6b7f"></span>Low/Minor — polish when time allows</div>
  <div><span class="k">Priorities:</span> <strong>Now</strong> = act immediately (blocking or risky) ·
  <strong>Next</strong> = plan this quarter · <strong>Later</strong> = longer-term improvements.</div>
  <div>Each recommendation includes <span class="k">“Understanding the issue”</span> — a plain-language explanation of what’s wrong, why it happens, and how the fix resolves it — plus screenshots where they help.</div>
</div>

<h2>Score Overview</h2>
<table><tr><th>Phase</th><th>Score</th><th class="num">/100</th><th>Confidence</th><th class="num">Blockers</th></tr>
{"".join(phase_rows)}
</table>
<p class="weights">Overall score is the weighted mean of phase scores (weights on the cover page).
Overall confidence is the weighted mean of phase confidences, capped at Medium if any phase is Low.
Any blocker in any phase forces an overall FAIL.</p>

<h2>Recommended Actions</h2>
<p>Prioritized by business impact. <strong>Now</strong> items should be treated as blocking for launch or continued operation.</p>
{"".join(rec_sections) if rec_sections else "<p>No recommendations recorded.</p>"}

<h2>Scope &amp; Limitations</h2>
<div class="scope">
<p>{esc(data.get('scope', 'Single-page audit based on the evidence available at audit time.'))}</p>
{"<p><strong>Not verified in this audit:</strong></p><ul>" + not_verified + "</ul>" if not_verified else ""}
<p class="conf-note">This report is a point-in-time assessment. Scores can change with site updates, traffic shifts, and evolving standards.</p>
</div>

<h2 style="page-break-before: always;">Appendix — Phase Detail</h2>
<p class="muted">Technical detail for the teams implementing the fixes. Executives can stop here.</p>
{"".join(phase_details)}

</body></html>"""


def to_pdf(html_text, out_pdf):
    """Try PDF backends in order; return path of produced file."""
    # 1. weasyprint
    try:
        from weasyprint import HTML
        HTML(string=html_text).write_pdf(str(out_pdf))
        return out_pdf, "weasyprint"
    except Exception:
        pass
    # 2. headless chromium
    for binary in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable"):
        exe = shutil.which(binary)
        if exe:
            tmp_html = out_pdf.with_suffix(".html")
            tmp_html.write_text(html_text, encoding="utf-8")
            try:
                subprocess.run(
                    [exe, "--headless", "--disable-gpu", "--no-sandbox",
                     f"--print-to-pdf={out_pdf}", str(tmp_html)],
                    check=True, capture_output=True, timeout=120)
                return out_pdf, binary
            except Exception:
                continue
    # 3. fall back to HTML
    out_html = out_pdf.with_suffix(".html")
    out_html.write_text(html_text, encoding="utf-8")
    return out_html, "html-fallback (open in a browser and Print -> Save as PDF)"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = Path(sys.argv[1])
    data = json.loads(src.read_text(encoding="utf-8"))
    out = Path(sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == "-o" else
               (sys.argv[2] if len(sys.argv) > 2 else "audit-report.pdf"))
    if out.suffix != ".pdf":
        out = out.with_suffix(".pdf")
    produced, backend = to_pdf(render(data), out)
    print(f"Report written: {produced}  (via {backend})")


if __name__ == "__main__":
    main()

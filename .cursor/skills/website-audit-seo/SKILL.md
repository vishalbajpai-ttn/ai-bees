---
name: website-audit-seo
description: Strict SEO phase of a website audit. Technical SEO (crawlability, indexability, meta, structured data), on-page factors, Core Web Vitals field-data grading, and AI-search citation readiness. Returns a 0–100 score with a confidence level. Use after the website-audit orchestrator defines scope.
---

# Phase 2 — SEO Audit

## Purpose

Determine whether the page can be crawled, indexed, and ranked — and whether it's shaped to be cited by AI search. Grade against official Google behavior, not tool folklore.

## Inputs

- Page URL, rendered HTML/head tags, robots.txt, XML sitemap, response headers.
- Google Search Console data if available (ground truth for indexation). PageSpeed Insights / CrUX field data if available; Lighthouse lab data otherwise.

## Workflow

Work in this order — it catches the most real problems fastest:

1. **Crawlability & indexability (fail-fast blockers first).** Checklist in `references/seo-checklist.md`. A single critical issue here (accidental `noindex`, blocked crawl, broken canonical) fails the phase regardless of other scores.
2. **Meta & head tags.** Title ≤ 60 chars, unique, keyword near front; description 150–160 chars; viewport, charset, `lang`; Open Graph/Twitter cards; JSON-LD schema validated error-free (Google Rich Results Test).
3. **On-page.** Single H1; logical heading nesting; keyword in title, first 100 words, a subheading, URL slug; 3–5 internal links with descriptive anchors; quality image alt text; E-E-A-T signals (author bio, About, contact).
4. **Core Web Vitals — grade on field data.** Thresholds at the 75th percentile, mobile and desktop separately: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. All three must pass for "Good". **INP replaced FID in March 2024** — never grade on FID. If only lab data exists, say so and cap confidence at Medium.
5. **AI-search readiness.** Zero-click/AI Overviews reality (2025–26): check for definition blocks (40–60 words), question-format H2s, numbered steps, comparison tables, FAQ schema — the shapes AI answers cite. Flag content shaped only for ten-blue-links.

## Scoring

- Severity tiers: Critical (blocks indexing/major ranking loss) = fail phase; High = −15; Medium = −5; Low = −2. Start at 100, floor 0.
- Any Critical finding caps the phase score at 49.
- Optional internal margin-of-safety: flag CWV values within 20% of thresholds even when "Good" (e.g., LCP 2.1–2.5s) as risks, not deductions.

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | CrUX/PageSpeed field data + Search Console agree with crawl findings; all five workflow steps completed |
| Medium (60–84%) | Lab/tool data only (no field data or GSC), or 1–2 steps partially verified |
| Low (<60%) | Static HTML inspection only; no crawl, no CWV data, no indexation evidence |

State data sources explicitly: "graded against official CWV thresholds; INP assessed from lab data only → medium confidence."

## Output Contract

```
## Phase 2 — SEO
Score: <0–100>  (show deductions; note any fail-fast Critical)
Confidence: <High|Medium|Low> (<%>): <data sources + reason>
Blockers: <count of Critical findings>
Findings: <Critical/High/Medium/Low counts>
Top fixes (max 5): 1. <fix> (severity) ...
Caveats: <what was not verified — e.g., site-wide crawl, backlinks, JS-rendered content>
```

## Operating Rules

- **Strict rule on sitemap `lastmod`:** it must be honest. Faking dates teaches Google to ignore the sitemap entirely — flag manipulated lastmod as High. (Cross-checks with Phase 3.)
- Do not encode rumored "stricter 2026 CWV thresholds" (LCP ≤ 2.0s / INP ≤ 150ms / CLS ≤ 0.08) as fact — no official Google announcement exists. Use them only as aspirational budgets.
- Automated scanners miss: canonical→redirect loops, JS-only links/content, hacked pages, search-intent drift. Verify manually where suspicious; list as caveats otherwise.
- Grade on field data, debug with lab data — never the reverse.

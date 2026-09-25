---
name: website-audit-performance
description: Strict performance phase of a website audit. Grades Core Web Vitals against official Google field-data thresholds (LCP/INP/CLS), plus asset budgets, caching, and third-party weight. Returns a 0–100 score with a confidence level. Use after the website-audit orchestrator defines scope.
---

# Phase 6 — Performance Audit

## Purpose

Determine whether the page loads fast and stays responsive for real users. Grade on field data — lab scores are diagnostic only.

## Inputs

- Page URL. PageSpeed Insights / CrUX field data (preferred), or Lighthouse lab data. Response headers (caching), asset inventory (JS/CSS/image sizes, third-party scripts).

## Workflow

1. **Core Web Vitals — field data first.** Thresholds at the 75th percentile, mobile and desktop separately. All three must be "Good" for a pass:

   | Metric | Good | Needs improvement | Poor |
   |---|---|---|---|
   | LCP | ≤ 2.5s | 2.5–4.0s | > 4.0s |
   | INP | ≤ 200ms | 200–500ms | > 500ms |
   | CLS | ≤ 0.1 | 0.1–0.25 | > 0.25 |

   Diagnostics: TTFB ≤ 0.8s good, FCP ≤ 1.8s good. **INP replaced FID (March 2024)** — never grade on FID.
2. **Per-metric diagnosis** using `references/performance-checklist.md`: LCP (hero image format/sizing/preload, render-blocking resources, TTFB), CLS (dimensions/aspect-ratio, reserved space, font-display), INP (long tasks, third-party deferral, code splitting).
3. **Asset budgets:** total JS < 300KB compressed; total CSS < 80KB; hero image < 200KB; total page < 1.5MB; third-party scripts < 5. Check minification, Brotli/gzip, modern formats (WebP/AVIF), long-lived cache headers on hashed assets + CDN, HTTP/3.
4. **Prioritize mobile** — mobile-first indexing uses mobile CWV for ranking, and fewer than half of mobile origins pass all three.

## Scoring

- Start at 100. Any CWV metric "Poor" = −20; "Needs improvement" = −8 (per metric, mobile and desktop assessed — use the worse of the two). Each blown budget = −3. Floor 0.
- A "Poor" INP or LCP on mobile caps the phase score at 59.
- Margin-of-safety flags (no deduction): LCP 2.0–2.5s, INP 150–200ms, CLS 0.05–0.1 — at risk of slipping to "Needs improvement".

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | CrUX/PageSpeed 28-day field data for the URL/origin, mobile + desktop |
| Medium (60–84%) | Lab data only (Lighthouse), or field data for origin but not the specific URL |
| Low (<60%) | Asset/budget inspection only, no CWV measurement at all |

## Output Contract

```
## Phase 6 — Performance
Score: <0–100>  (show deductions per metric/budget)
Confidence: <High|Medium|Low> (<%>): <field vs lab data>
Blockers: <count — Poor mobile LCP/INP count as blockers>
Findings: LCP </INP/CLS values with verdicts>; budgets: <pass/fail each>
Top fixes (max 5): 1. <fix> (targets which metric) ...
Caveats: <e.g., lab-only data; no RUM>
```

## Operating Rules

- **Grade on field data, debug with lab data — never the reverse.** A Lighthouse 100 can still fail in CrUX field data and in search.
- Do not encode rumored "stricter 2026 thresholds" as fact. The margin-of-safety flags above are the correct way to express that concern.
- Recommend continuous guardrails: Lighthouse CI gates in CI/CD, RUM monitoring — a one-time pass rots.

# Website Audit — Skill Pack for Cursor

A strict, phase-by-phase website page evaluation. One orchestrator skill plus seven phase skills, each phase producing its own **score (0–100)** and **confidence level (High/Medium/Low + %)**.

## What's inside

| Skill | Phase |
|---|---|
| `website-audit` | Orchestrator — runs the phases, aggregates scores with documented weights, produces the final verdict (PASS / NEEDS WORK / FAIL) |
| `website-audit-ui-ux` | Heuristic evaluation (Nielsen's 10, severity 0–4) + mobile pass |
| `website-audit-seo` | Technical SEO, on-page, Core Web Vitals (field data), AI-search readiness |
| `website-audit-content-freshness` | Content currency vs. a living tech watchlist (refreshed before every audit) |
| `website-audit-security` | HTTPS/TLS, security headers, cookies, forms, exposed secrets, third-party scripts |
| `website-audit-accessibility` | WCAG 2.2 AA — automated scan + keyboard test + screen-reader spot check |
| `website-audit-performance` | Core Web Vitals grading + asset budgets |
| `website-audit-privacy-legal` | Cookie consent (empirically verified), policies, Consent Mode v2 |

## Install into Cursor

**Option A — project skills** (recommended): copy these folders into your project's `.cursor/skills/` directory.

**Option B — global skills:** copy them into `~/.cursor/skills/`.

Then invoke in Cursor chat:

```
Audit https://example.com/pricing with the website-audit skill
```

or run a single phase:

```
Run the website-audit-security skill on https://example.com
```

## How it works

1. The app runs all seven phases in parallel. Each phase infers the page's primary visitor task from live evidence; the orchestrator resolves any conflicting assumptions during aggregation.
2. Each phase is strict and evidence-first: no finding without an observation, location, or measurement.
3. Each phase returns: score, confidence with reason, blocker count, severity counts, top fixes, caveats.
4. The orchestrator aggregates: overall score = weighted mean (Security 20, SEO 18, UI/UX 15, Accessibility 15, Performance 12, Content 10, Privacy 10). Any phase at Low confidence caps overall confidence at Medium. Any blocker = overall FAIL.
5. **Executive PDF report (final step, required):** the orchestrator translates technical findings into business-language recommendations, writes a jargon-free executive summary, and renders a polished PDF via `website-audit/bin/build_report.py` — cover page with verdict + score, executive summary, a "how to read this report" legend, score overview with per-phase plain-language descriptions, a Now/Next/Later recommendations roadmap where each card carries an "Understanding the issue" explanation (what's wrong, why it happens, how the fix resolves it) plus annotated screenshots, scope & limitations, and a technical appendix for implementers. Pure Python standard library; tries weasyprint, then headless Chromium, then falls back to print-ready HTML.

## Notes

- Best practices were researched from current (2025–2026) sources: NNG, W3C WCAG 2.2, Google Search Central, OWASP, Mozilla Observatory. Key references are linked inside each skill's `references/` folder.
- The content-freshness watchlist (`website-audit-content-freshness/references/tech-watchlist.md`) is a **living document** — the skill refreshes it before every audit so the currency check never goes stale itself.
- The privacy/legal phase flags risk; it is not legal advice.

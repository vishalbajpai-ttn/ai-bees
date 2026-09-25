---
name: website-audit-content-freshness
description: Strict content-currency phase of a website audit. Checks whether page content is factually current and up to date with the latest industry/technology developments, graded against a living watchlist of recent changes. Returns a 0–100 score with a confidence level. Use after the website-audit orchestrator defines scope.
---

# Phase 3 — Content Freshness & Industry Currency

## Purpose

Determine whether the page's content is still true and current. Outdated technical guidance is not a cosmetic issue — actionable claims against deprecated technology can cause real user harm, so this phase grades harshly.

## Inputs

- Page content (text, screenshots, code samples, version numbers, dates, statistics, linked tools/products).
- The watchlist in `references/tech-watchlist.md` — **refresh it before every audit** (see below).

## Workflow

1. **Refresh the watchlist first.** The watchlist goes stale itself. Before auditing, search for major changes in the page's industry in the last 12–18 months (deprecations, version releases, regulation changes, renamed products). Update `references/tech-watchlist.md` with dated entries. Never audit against a watchlist older than 6 months.
2. **Check temporal markers:** stale years in titles ("2023 guide" untouched in 2026), old or missing "last updated" dates, outdated screenshots/UI, expired offers or pricing.
3. **Check factual decay:** statistics older than 18–24 months on fast-moving topics; discontinued products/tools; renamed features or companies; dead or redirected references.
4. **Check deprecated technology** against the watchlist — the highest-value check. Any recommendation of something the industry has moved off is a High or Critical finding.
5. **Check search-intent drift:** what does the 2026 SERP expect for this query (comparisons, pricing, AI capabilities, pros/cons) vs. what the page offers? Check People Also Ask and competitor headings.
6. **Check internal consistency:** visible "last updated" date vs. sitemap `lastmod` vs. schema `dateModified` must agree. Disagreement = maintenance failure (High).

## Scoring

Weighted dimensions (0–100 per dimension, then weighted):

| Dimension | Weight |
|---|---|
| Factual accuracy (stats current, claims verifiable, no discontinued products) | 40 |
| Technology currency (no deprecated frameworks/APIs/standards; current major versions) | 25 |
| Temporal signals (visible last-updated date; honest lastmod + dateModified) | 15 |
| References & links (live, current, not superseded) | 10 |
| Intent match (matches what the 2026 SERP expects) | 10 |

Verdict tiers: **Current** (90–100), **Refresh recommended** (70–89), **Outdated** (40–69), **Archive/remove** (<40).
- Refresh: update ≥3 concrete items (examples, screenshots, tools, steps, stats); add a "what changed" section.
- Outdated: needs substantive rewrite. Archive/remove: redirect or delete — archiving stale content users won't read is healthy (per Google).

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | Watchlist refreshed this audit (dated); page claims individually spot-checked against primary sources; SERP intent checked |
| Medium (60–84%) | Watchlist current but claims checked against secondary sources only, or SERP intent not checked |
| Low (<60%) | Watchlist older than 6 months, or currency judged from page text alone without external verification |

## Output Contract

```
## Phase 3 — Content freshness
Score: <0–100>  (show weighted dimension scores)
Confidence: <High|Medium|Low> (<%>): <watchlist date + verification method>
Verdict: <Current | Refresh recommended | Outdated | Archive/remove>
Watchlist refreshed: <date>
Blockers: <count of Critical findings — e.g., dangerous deprecated guidance>
Findings: <Critical/High/Medium/Low counts>
Top fixes (max 5): 1. <fix> (severity) ...
Caveats: <claims that could not be verified>
```

## Operating Rules

- Content making *actionable technical claims* against deprecated tech (framework APIs, security settings, analytics setups) is graded one severity higher than the same staleness in evergreen content.
- The watchlist is shared: Phase 2 (SEO) and Phase 4 (Security) must use this same watchlist rather than maintaining their own deprecated-tech lists.
- Never fake freshness: recommend honest dates only. Flag any "updated" date that doesn't correspond to a real content change as a High finding (it trains Google to distrust the site).
- Date every watchlist change. An undated watchlist entry is treated as absent.

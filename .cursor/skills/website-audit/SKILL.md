---
name: website-audit
description: Run a strict, phase-by-phase audit of a website page — UI/UX, SEO, content freshness, security, accessibility, performance, privacy/legal — each phase producing its own scored result with a confidence level, then aggregate into one overall verdict. Trigger on "audit this page/site", "strict website review", "evaluate this website".
---

# Website Audit (Orchestrator)

## Purpose

Run a strict multi-phase evaluation of a website page. Each phase is its own skill with its own checklist, scoring rubric, and confidence rules. The orchestrator runs the phases, collects per-phase results, and produces the final verdict.

## Phase Registry

| # | Phase | Skill | Weight |
|---|-------|-------|--------|
| 1 | UI/UX | `website-audit-ui-ux` | 15 |
| 2 | SEO | `website-audit-seo` | 18 |
| 3 | Content freshness & industry currency | `website-audit-content-freshness` | 10 |
| 4 | Security | `website-audit-security` | 20 |
| 5 | Accessibility | `website-audit-accessibility` | 15 |
| 6 | Performance | `website-audit-performance` | 12 |
| 7 | Privacy & legal | `website-audit-privacy-legal` | 10 |

## Workflow

1. **Gather inputs.** URL(s) to audit (one page = strict page audit; whole site = note scope limits). Collect whatever evidence you can: rendered page or screenshots, page HTML, response headers (`curl -sI`), Lighthouse/PageSpeed results, Search Console data if available, stated purpose of the page.
2. **Run all seven phases in parallel.** Each phase independently infers the page's primary visitor task from the live page, states that assumption when relevant, and does not wait for another phase. This keeps the app responsive while preserving phase independence.
3. **Collect the seven phase results.** Each phase skill returns its result block in its Output Contract format. Resolve conflicting primary-task assumptions during aggregation, using the clearest evidence from the rendered page.
4. **Aggregate.** Compute the overall score and confidence, then write the final report.
5. **Generate the executive PDF report.** This is a required final step, not optional:
   a. Translate each phase's technical top fixes into business-language recommendations (severity, outcome-oriented title, plain-language explanation, direct evidence, business impact, concrete action, effort, priority Now/Next/Later) — see `references/report-schema.md` for the rules. Every recommendation gets an "Understanding the issue" explanation: what the problem is, why it happens, how the fix resolves it — no jargon. Merge duplicates across phases; cap at ~12 recommendations.
   b. Capture desktop and mobile screenshots for the key findings. Pair each included screenshot with a short evidence label so the issue is understandable in under 3 seconds. Never claim that a screenshot proves an observation it does not show.
   c. Write the executive summary in plain language: what the page is, whether it's fit for purpose, the 2–3 things that matter most, and what happens if they're ignored. No jargon.
   d. Compile everything into the JSON schema in `references/report-schema.md`.
   e. Run `python3 bin/build_report.py results.json -o audit-report.pdf` from this skill's directory. Deliver the PDF to the user.
6. **Optional growth follow-up.** If the user wants ideas for improving the page (not just fixing it), run the `website-audit-growth-highlights` skill after the audit. It produces numbered highlights for visibility, freshness, and new-client acquisition, plus a latest-developments gap list.

## Output Contract

Each phase skill must return:

```
## Phase N — <Name>
Score: <0–100>
Confidence: <High | Medium | Low> (<0–100>%): <one-line reason>
Blockers: <count of Critical/Blocker findings>
Findings: <Critical/High/Medium/Low/Info counts>
Top fixes (max 5): <ordered by severity>
Caveats: <what could NOT be verified>
```

### Overall aggregation

- **Overall score** = Σ (phase score × phase weight) ÷ 100. Show the math.
- **Overall confidence** = Σ (phase confidence % × phase weight) ÷ 100, then apply caps:
  - If any phase confidence is **Low**, overall confidence caps at **Medium (70%)**.
  - If a blocker exists in any phase, overall verdict is **Fail** regardless of score.
- **Overall verdict**:
  - `PASS` — score ≥ 85 and no blockers.
  - `NEEDS WORK` — score 60–84 and no blockers.
  - `FAIL` — score < 60, or any blocker.

### Final report structure

1. Cover dashboard: page audited, date, verdict, score, confidence, recommendation counts, and seven phase scores.
2. Executive summary and a plain-language guide to scores, confidence, severity, and priorities.
3. Score overview with all seven phases, confidence levels, and blocker counts.
4. Recommended actions grouped by `Now`, `Next`, and `Later`. Every action shows severity, effort, "Understanding the issue", direct evidence, business impact, recommended fix, and source phase. Include labeled visual evidence for the most important findings when a viewport capture can support them.
5. Scope and limitations with one consolidated "Not verified" list.
6. Technical appendix with exact per-phase score, confidence reason, finding counts, recommendations, evidence, and caveats.

## Operating Rules

- **Strict means evidence-first.** A phase result with no evidence is rejected — send it back. No finding without an observation, location, or measurement.
- Do not silently average scores; show weights and the calculation.
- If a phase cannot run (no access, blocked by login, site down), mark it `NOT EVALUATED`, exclude its weight from the aggregation, note the exclusion, and cap overall confidence at Medium.
- Conflicts between phases are resolved by severity: the strictest applicable finding wins.
- Keep the final report scannable: verdict and blockers up top, detail below.

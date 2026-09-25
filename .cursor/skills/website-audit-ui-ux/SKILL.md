---
name: website-audit-ui-ux
description: Strict UI/UX phase of a website audit. Expert heuristic evaluation against Nielsen's 10 usability heuristics with 0–4 severity ratings, visual hierarchy and mobile checks. Returns a 0–100 score with a confidence level. Use after the website-audit orchestrator defines scope.
---

# Phase 1 — UI/UX Audit

## Purpose

Judge whether the page is genuinely usable: can a user understand it and complete its primary task without friction? This is a manual, expert-judgment phase — there is no credible automation for it.

## Inputs

- The page's **primary task** ("job to be done") — define this before inspecting. If the orchestrator hasn't defined it, define it yourself from the page content and state your assumption.
- Rendered page (screenshots at desktop + one mobile viewport, or live inspection). Screenshots of key states (empty, loading, error) if available.

## Workflow

1. **One focused pass per heuristic** (Nielsen Norman Group procedure — passing once with all ten in mind finds a fraction of what ten focused passes find). Use the checklist in `references/heuristics.md`.
2. **Per finding record:** heuristic ID, what you observed and where (element/section), severity 0–4, concrete recommendation. Every finding must tie to the primary task.
3. **Roll up per heuristic at max severity** (one heuristic can yield findings at several severities — report the worst).
4. **Surface severity 3s and 4s first.** Prefer fewer, sharper findings over a laundry list of 1s. A catastrophic (4) finding gates the phase result.
5. **Mobile viewport pass:** tap targets ≥ 48px, no intrusive interstitials, readable without zooming, content reflows correctly.

## Scoring

- Canonical Nielsen severity scale: 0 = not a problem (do not report), 1 = cosmetic, 2 = minor, 3 = major, 4 = catastrophe. Severity = frequency × impact × persistence.
- **Phase score:** start at 100. Deduct 25 per catastrophe, 10 per major, 3 per minor, 1 per cosmetic (count the max-severity finding per heuristic once, plus any additional severity-4 findings). Floor 0.
- A single severity-4 finding caps the phase score at 59 regardless of deductions.

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | One focused pass per heuristic on the rendered, interactive page covering the primary task end-to-end; severity set by frequency × impact × persistence |
| Medium (60–84%) | Heuristic pass on static screenshots only (no interaction), or key states/flows not inspected |
| Low (<60%) | Partial pass (subset of heuristics) or inferred from code/markup without rendering |

State which you did. Note Nielsen's caveat: a single evaluator's ratings are noisy — say so at Medium or below.

## Output Contract

Return exactly:

```
## Phase 1 — UI/UX
Score: <0–100>  (show deductions)
Confidence: <High|Medium|Low> (<%>): <reason>
Primary task: <the job you evaluated against>
Blockers: <count of severity-4 findings>
Findings: <# sev-4> / <# sev-3> / <# sev-2> / <# sev-1>
Top fixes (max 5): 1. <fix> (H#, sev) ...
Caveats: <what was not inspected>
```

## Operating Rules

- Never report a heuristic you did not actually do a focused pass on — mark it "not evaluated" instead.
- No automated tool output counts as a UX finding; tools (Lighthouse, CWV) are evidence for *visual* proxies only.
- Be strict: if a user cannot tell in 5 seconds what the page offers, who it's for, and what to do next, that is a major finding (H2/H8), not a nit.
- Cite the reference: Nielsen Norman Group, "10 Usability Heuristics" and "Severity Ratings for Usability Problems".

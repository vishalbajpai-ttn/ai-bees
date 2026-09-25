---
name: website-audit-accessibility
description: Strict accessibility phase of a website audit. Three-stage methodology (automated scan + keyboard test + screen-reader spot check) against WCAG 2.2 Level AA, with axe impact severity ladder. Returns a 0–100 score with a confidence level. Use after the website-audit orchestrator defines scope.
---

# Phase 5 — Accessibility Audit

## Purpose

Determine whether the page is usable by people with disabilities, graded against WCAG 2.2 Level AA (the legal/industry conformance target: all 32 Level A + 24 Level AA criteria). Conformance is pass/fail per criterion — severity only orders the fix queue.

## Inputs

- Rendered page. Automated scan output (axe DevTools / Lighthouse / WAVE) if available. Ability to keyboard-navigate the page. A screen reader for the spot check where possible.

## Workflow — three stages, in order

1. **Automated scan.** Run axe/Lighthouse/WAVE. Record per violation: rule ID, impact, WCAG success criterion, selector, failing snippet. Surface axe `incomplete` items as "needs manual verification" — never flatten them to pass. Checklist of highest-value criteria in `references/wcag-checklist.md`.
2. **Manual keyboard test** (no mouse, ~5 min minimum): Tab/Shift+Tab logical order; Enter/Space activation; arrow keys in composite widgets; Escape closes overlays; focus always visible and never obscured; focus trap in modals with return-to-trigger on close; skip-nav link present, visible on focus, functional; `prefers-reduced-motion` honored; 320px reflow and 200% zoom usable.
3. **Screen-reader spot check** (at least one): unique descriptive `<title>`; one `<h1>` with logical heading nesting; meaningful link text (no "click here"); form labels announced; errors announced live; dynamic content via live regions; `<html lang>` declared.

## Scoring

- Severity ladder (orders the fix queue): **Blocker** (prevents access to core functionality) > **Critical** (key parts unusable for some) > **Serious** (major barriers, some access remains) > **Moderate** (reduced quality) > **Minor** (annoying).
- Score: start at 100. Deduct 25 per Blocker/Critical, 10 per Serious, 3 per Moderate, 1 per Minor. Floor 0. Any Blocker caps the phase score at 49.
- Report convention: every finding carries its WCAG SC reference (e.g., 1.4.3, 2.1.1) + severity. Summary = counts by severity.

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | Full 3-stage: automated scan + keyboard traversal + screen-reader spot check; all 56 A/AA criteria dispositioned |
| Medium (60–84%) | Automated scan + keyboard test, no screen-reader pass — or scan + spot check without full keyboard traversal |
| Low (<60%) | Automated scan only — explicitly "insufficient for conformance claims" (~30–40% of issues caught by tools alone) |

## Output Contract

```
## Phase 5 — Accessibility
Score: <0–100>  (show deductions)
Confidence: <High|Medium|Low> (<%>): <which stages were completed>
Blockers: <count of Blocker findings>
Findings: <Blocker/Critical/Serious/Moderate/Minor counts>
Top fixes (max 5): 1. <fix> (WCAG SC, severity) ...
Caveats: <incomplete items needing verification; stages not performed>
```

## Operating Rules

- **Never ship on a green axe scan alone.** Industry consensus: automated tools catch ~30–40% of issues. A scan-only result is Low confidence by definition.
- WCAG has no severity axis — do not invent one. Conformance is pass/fail per criterion; the ladder only orders repairs.
- Manual-only checks (keyboard traps, focus visibility, target size ≥ 24×24 CSS px per 2.5.8, alt-text *quality* vs. presence, live-region behavior) must be attempted before claiming Medium or higher.
- Note: axe auto-check for target size (2.5.8) was removed (exception complexity) — target size is manual-audit only.

---
name: website-audit-privacy-legal
description: Strict privacy & legal phase of a website audit. Cookie consent behavior (verified empirically, not just banner presence), privacy/cookie policy completeness, Google Consent Mode v2, tracker gating. Returns a 0–100 score with a confidence level. Use after the website-audit orchestrator defines scope.
---

# Phase 7 — Privacy & Legal Audit

## Purpose

Determine whether the page handles consent and user data lawfully (GDPR / UK GDPR / CCPA/CPRA / DPDP Act basics). Consent failures are legal exposure, not cosmetic issues — grade accordingly.

## Inputs

- Rendered page (to interact with the consent banner). Ability to observe outbound network requests and cookies/`localStorage` before and after consent choices. Footer/legal page links.

## Workflow

1. **Consent banner behavior — verify empirically, not by presence.**
   - Banner present with **equally prominent Accept and Reject** options.
   - Granular choices offered; withdrawing/changing consent is easy to find.
   - **Non-essential trackers/scripts blocked before consent:** log outbound requests and cookies/`localStorage` before interacting, then after Accept, then after Reject. Trackers firing before any choice, or after Reject = Critical.
   - Banner must not obstruct content; keyboard-accessible and screen-reader compatible (cross-checks Phase 5).
2. **Policy completeness.** Privacy policy linked in the footer on every page, covering: data controller, purposes, legal bases, recipients, international transfers, user rights. Cookie policy present. Terms present.
3. **Third-party transparency.** Named third-party recipients with transfer basis; Google Consent Mode v2 properly implemented where GA4 is used.
4. **Data minimization signals.** Forms collect only what they need; no pre-ticked non-essential checkboxes.

## Scoring

- Start at 100. Trackers firing before consent or after Reject = **Critical** (−25 each, caps phase score at 49). Missing/ineffective banner = High (−15). Unequal Accept/Reject prominence = High (−15). Missing privacy policy link = High (−15). Incomplete policy sections = Medium (−5 each). No withdraw mechanism = Medium (−5).
- Any Critical finding fails the phase for legal-exposure purposes regardless of score.

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | Empirical request/cookie observation across all three states (pre-choice, Accept, Reject) + policy pages read in full |
| Medium (60–84%) | Banner interaction tested but tracker gating not empirically verified, or policies skimmed |
| Low (<60%) | Banner presence checked only, no interaction or network observation |

## Output Contract

```
## Phase 7 — Privacy & legal
Score: <0–100>  (show deductions)
Confidence: <High|Medium|Low> (<%>): <what was empirically verified>
Blockers: <count of Critical findings>
Findings: <Critical/High/Medium/Low counts>
Top fixes (max 5): 1. <fix> (severity) ...
Caveats: <jurisdictions not assessed; note this is not legal advice>
```

## Operating Rules

- **This is not legal advice.** State that in every report. Findings are risk signals for a qualified lawyer to confirm.
- Banner presence ≠ compliance. A banner that loads trackers before consent is worse than no banner — it evidences awareness without compliance.
- Jurisdiction matters: note which regimes you checked against (GDPR, CCPA/CPRA, DPDP Act) and don't claim others.
- Cross-check with Phase 4 (Security): consent records and cookie flags (`Secure`, `SameSite`) overlap — dedupe in the orchestrator's final report.

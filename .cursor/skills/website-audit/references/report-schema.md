# Executive Report — Input Schema & Build Instructions

The orchestrator's final step compiles all phase results into one JSON file and
renders the executive PDF with `bin/build_report.py` (standard library only).

## JSON schema

```json
{
  "page": "https://example.com/pricing",
  "date": "2026-09-22",
  "verdict": "PASS | NEEDS WORK | FAIL",
  "overall_score": 72,
  "overall_confidence": {
    "level": "High | Medium | Low",
    "pct": 78,
    "reason": "one-line reason, e.g. field data + headers verified; no screen-reader pass"
  },
  "executive_summary": "3-6 sentences in plain business language. No jargon. Say what the page is, whether it is fit for purpose, the 2-3 things that matter most, and what happens if they are ignored. An executive who reads nothing else should understand the situation.",
  "phases": [
    {
      "name": "UI/UX",
      "score": 81,
      "confidence": { "level": "Medium", "pct": 70, "reason": "screenshot-based pass, no interaction" },
      "blockers": 0,
      "findings": { "Major": 2, "Minor": 3, "Cosmetic": 1 },
      "top_fixes": [ { "severity": "Major", "fix": "Primary CTA is below the fold on mobile...", "explanation": "Optional 1-2 sentence plain-language note on why this matters and how the fix helps. Shown in the appendix." } ],
      "caveats": [ "Checkout flow not inspected" ]
    }
  ],
  "recommendations": [
    {
      "severity": "Critical | High | Medium | Low | Info",
      "title": "Fix the mobile checkout CTA",
      "explanation": "Plain-language explanation of the issue AND the fix, 2-4 sentences. Say what the problem is, why it happens, and how the proposed fix resolves it. Explain any technical term the first time it appears. Write for a smart non-technical reader — no jargon, no acronyms without expansion.",
      "evidence": "The exact observation, measurement, selector, response header, or page location that supports this recommendation.",
      "business_impact": "An estimated X% of mobile visitors cannot see the buy button without scrolling; this directly suppresses conversion.",
      "action": "Move the primary CTA above the fold on viewports under 768px; A/B test placement.",
      "effort": "Low | Medium | High",
      "priority": "Now | Next | Later",
      "phase": "UI/UX",
      "screenshot": {
        "path": "/absolute/path/to/annotated-screenshot.png",
        "caption": "The buy button sits below the fold on a 390px viewport (highlighted in red)"
      }
    }
  ],
  "not_verified": [ "Server-side code vulnerabilities (requires a pentest)", "..." ],
  "scope": "Single-page audit of the pricing page based on evidence available at audit time."
}
```

## Writing recommendations for executives

Translate each phase's technical "top fixes" into business language:

- **Severity:** use the phase's own severity ladder; never inflate severity to make a recommendation sound urgent.
- **Title:** outcome-oriented, not technical ("Fix the mobile checkout CTA", not "H8 violation: CTA below fold").
- **Evidence:** the exact observation and location that proves the issue. No recommendation is valid without evidence.
- **Business impact:** what it costs or risks — lost conversions, legal exposure, ranking loss, brand damage, accessibility lawsuits. Quantify with a measured number where you have one; otherwise state the mechanism plainly ("visitors cannot...").
- **Action:** concrete next step an owner can assign.
- **Priority:** `Now` = blocking (legal exposure, security critical, conversion-breaking); `Next` = plan this quarter; `Later` = longer-term improvement.
- **Effort:** Low = hours–days, Medium = days–weeks, High = weeks+ or cross-team.

Order in the report: all `Now` first, then `Next`, then `Later`. Cap at ~12 recommendations; merge duplicates across phases.

## Required report presentation

The app PDF and the in-app phase detail view must use the same information hierarchy:

1. Cover/dashboard with verdict, overall score, blockers, confidence, recommendation counts, and phase scores.
2. Executive summary and "How to read this report".
3. Score overview.
4. Recommendations grouped by Now / Next / Later. Show severity, effort, Understanding the issue, Evidence, Business impact, Recommended fix, and source phase.
5. Scope and limitations / Not verified.
6. Technical appendix with one section per phase.

## Screenshots

Attach a screenshot to a recommendation whenever a visual makes the issue or fix
clearer — UI problems, layout breaks, contrast failures, missing elements, confusing
flows. Aim for at least one screenshot per `Now`-priority recommendation.

- Capture the screenshot during the audit (browser screenshot tooling) at the
  relevant viewport, and **annotate it**: outline or arrow the problem area so a
  reader sees it in under 3 seconds.
- `"path"` must be an absolute local path; the script embeds it as base64 so the
  PDF is self-contained. `"url"` is also accepted for hosted images.
- Always write a `"caption"` describing what the reader is looking at and what the
  annotation marks. If a screenshot can't be captured, omit the field — the report
  renders cleanly without it.

## Writing explanations (the "Understanding the issue" block)

Every recommendation needs an `explanation` that lets an executive *understand*,
not just *obey*. Structure it as: (1) what the problem is in plain terms,
(2) why it happens / why it matters, (3) how the proposed fix resolves it.
2–4 sentences. No jargon; expand every acronym on first use
("CSP (Content Security Policy), a browser safeguard that...").
If the issue is invisible in a screenshot (headers, code, config), say what the
reader would see if it went wrong instead.

## Build commands

```bash
# 1. Write results.json following the schema above
# 2. Render the PDF (tries weasyprint, then headless Chromium, then falls back to styled HTML)
python3 bin/build_report.py results.json -o audit-report.pdf
```

Run from the `website-audit` skill directory. If only HTML is produced, open it in a
browser and use Print → Save as PDF — the print CSS (A4, page breaks, footers) is built in.

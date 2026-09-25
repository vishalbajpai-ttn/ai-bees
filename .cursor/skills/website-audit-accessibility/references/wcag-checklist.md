# WCAG 2.2 Level AA — Highest-Value Criteria (check these first)

Conformance target: all 32 Level A + 24 Level AA criteria. Below are the most-failed / highest-value ones.

| SC | Name | Level | Strict check |
|---|---|---|---|
| 1.1.1 | Non-text Content | A | Every `<img>` has meaningful alt; decorative uses `alt=""` |
| 1.3.1 | Info and Relationships | A | Headings, lists, tables, forms use semantic elements |
| 1.3.2 | Meaningful Sequence | A | DOM/reading order matches visual order |
| 1.4.1 | Use of Color | A | Never color alone — status, errors, charts need text/icons too |
| 1.4.3 | Contrast (Minimum) | AA | Body text ≥ 4.5:1; large text (≥24px, or ≥18.66px bold) ≥ 3:1 |
| 1.4.10 | Reflow | AA | Reflows to 320px width with no horizontal scroll |
| 1.4.11 | Non-text Contrast | AA | UI components, icons, focus indicators ≥ 3:1 vs adjacent colors |
| 1.4.13 | Content on Hover/Focus | AA | Tooltips dismissible, hoverable, persistent |
| 2.1.1 | Keyboard | A | All functionality reachable/operable by keyboard; no traps |
| 2.4.3 | Focus Order | A | Tab order follows visual reading order |
| 2.4.7 | Focus Visible | AA | Visible focus indicator on every interactive element |
| 2.4.11 | Focus Not Obscured (Min) | AA | Focused element not hidden behind sticky headers/modals |
| 2.5.7 | Dragging Movements | AA | Single-pointer alternative for any drag |
| 2.5.8 | Target Size (Min) | AA | Targets ≥ 24×24 CSS px — manual audit only |
| 3.2.6 | Consistent Help | AA | Help mechanisms in same relative order across pages |
| 3.3.1 | Error Identification | A | Errors described in text |
| 3.3.2 | Labels or Instructions | A | Every input has a visible, programmatically associated label |
| 3.3.7 | Redundant Entry | AA | Don't make users re-enter previously provided info |
| 3.3.8 | Accessible Authentication | AA | No cognitive-function tests for login (test with a password manager) |
| 4.1.2 | Name, Role, Value | A | All interactive elements expose name/role/state to assistive tech |
| 4.1.3 | Status Messages | AA | Dynamic updates announced via `aria-live` |

## References

- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- axe-core rules: https://github.com/dequelabs/axe-core/tree/develop/lib/rules
- Deque — after the audit, next steps (impact ladder): https://www.deque.com/blog/ive-received-the-results-of-my-accessibility-audit-now-what/

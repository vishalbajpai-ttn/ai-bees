---
name: website-audit-security
description: Strict security phase of a website audit. HTTPS/TLS, security headers, cookies, forms, exposed secrets, third-party scripts — graded like Mozilla Observatory/securityheaders.com. Returns a 0–100 score with a confidence level and explicit scope limits. Use after the website-audit orchestrator defines scope.
---

# Phase 4 — Security Audit

## Purpose

Determine whether the page/site follows current web security baselines. Grade strictly — weak configurations are findings, not just missing ones.

## Inputs

- Page URL. Response headers (`curl -sI https://TARGET`), TLS info, page HTML/JS (for mixed content, exposed secrets, vulnerable libraries), cookie flags from DevTools.

## Workflow

1. **HTTPS/TLS.** HTTPS everywhere; HTTP → HTTPS 301; no mixed content (scan for `http://` subresources; `upgrade-insecure-requests` as defense-in-depth). Certificate valid, trusted, hostname-matched, not expiring soon. TLS 1.2+ only.
2. **Security headers.** Check against `references/security-headers.md`. Strict expectations — a weak CSP (`unsafe-inline` without nonce/hash) is a **High** finding, not just a missing CSP.
3. **Cookies.** Session/auth cookies must carry `Secure`, `HttpOnly`, `SameSite=Lax`/`Strict`. No sensitive data in cookies.
4. **Forms & auth surfaces.** CSRF tokens, rate limiting on login endpoints, no credentials in URLs, no stack traces in error pages.
5. **Exposed secrets.** No API keys/tokens/private keys in client JS/HTML; no source maps in production; no directory listing; no `robots.txt`/backup/`/.git` leakage; no hard-coded secrets.
6. **Third-party scripts.** Inventory all trackers/widgets; flag vulnerable/outdated JS libraries; require SRI (`integrity`) on CDN scripts.
7. **CORS.** Minimal `Access-Control-Allow-Origin` — never `*` with credentials.

## Scoring

Map findings to OWASP Top 10 categories where applicable. Severity: Critical = −25 (e.g., plaintext HTTP on auth, exposed secrets), High = −15, Medium = −5, Low = −2. Start at 100, floor 0. Any Critical caps the phase score at 49.

## Confidence

| Confidence | Criteria |
|---|---|
| High (85–100%) | Headers read directly from live responses + TLS verified (SSL Labs or equivalent) + HTML/JS inspected for secrets and mixed content |
| Medium (60–84%) | Header/TLS check only, without JS/secret inspection — or results from a single scanner (securityheaders.com or Observatory, not both) |
| Low (<60%) | Partial data (e.g., headers only, no TLS verification) or inferred from cached/third-party data |

## Output Contract

```
## Phase 4 — Security
Score: <0–100>  (show deductions)
Confidence: <High|Medium|Low> (<%>): <evidence sources>
Blockers: <count of Critical findings>
Findings: <Critical/High/Medium/Low counts>
Top fixes (max 5): 1. <fix> (severity, OWASP category) ...
Caveats: <scope limits — see below>
```

## Operating Rules

- **Scope caveat, always stated:** an external header/TLS review is **not** a penetration test. Code-level vulnerabilities (SQLi, XSS in app logic, broken access control) require a formal pentest — say this in every report.
- Run **both** securityheaders.com and Mozilla Observatory where possible — they grade different things (headers vs. headers + cookies + CORS + TLS + SRI). Passing one does not imply passing the other.
- Re-scan after every deployment touching CDN/proxy/framework — headers commonly regress. Recommend header assertions in CI/CD.
- Use the shared deprecated-standards watchlist from the `website-audit-content-freshness` skill — do not maintain a separate one.

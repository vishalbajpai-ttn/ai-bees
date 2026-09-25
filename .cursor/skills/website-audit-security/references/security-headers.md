# Security Headers — Strict Expectations

| Header | Strict expectation | Severity if missing/weak |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000` or more; `includeSubDomains`; `preload` | High |
| `Content-Security-Policy` | Present and restrictive: no `unsafe-inline`/`unsafe-eval` in `script-src` (use nonces/hashes), no wildcard `*` in `script-src`/`object-src`; include `frame-ancestors 'none'` (or `'self'`), `base-uri 'self'`, `form-action 'self'` | High (weak CSP counts as High, not just missing CSP) |
| `X-Content-Type-Options` | `nosniff` | Medium |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` (CSP `frame-ancestors` supersedes; keep both for compatibility) | Medium |
| `Permissions-Policy` | Restrictive: `camera=()`, `microphone=()`, `geolocation=()`, `payment=()` unless the page needs them | Medium |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (or `no-referrer` / `same-origin`) | Low |
| `Cache-Control` | `no-store` on sensitive pages | Low |
| `X-XSS-Protection` | `0` (deprecated — must be disabled in favor of CSP) | Info |

## Quick verification

```bash
curl -sI https://TARGET | grep -iE 'strict-transport|content-security|x-frame|x-content|permissions|referrer'
```

## References

- Mozilla Observatory: https://observatory.mozilla.org (0–100 score → F to A+; also weighs cookies, CORS, redirects, TLS, SRI)
- securityheaders.com: header presence + syntax, A–F grade
- SSL Labs: https://www.ssllabs.com (TLS configuration depth)

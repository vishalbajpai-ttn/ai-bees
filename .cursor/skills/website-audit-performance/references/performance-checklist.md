# Performance Diagnosis Checklist

## LCP (loading — main content visible)

- Hero image in WebP/AVIF, properly sized (`srcset`); `<link rel="preload" as="image" fetchpriority="high">`.
- **Never lazy-load the LCP element.**
- Remove render-blocking CSS/JS; inline critical CSS.
- TTFB < 800ms; CDN in use; server-side render the hero (client-rendered LCP costs 1–3s).

## CLS (visual stability)

- Explicit `width`/`height` or CSS `aspect-ratio` on every image/video/iframe.
- Reserve space for ads/embeds (`min-height`); `font-display: swap` with size-matched fallback fonts.
- Never inject content above existing content after load.

## INP (responsiveness — hardest metric, ~43% of sites fail)

- Break up long tasks > 50ms (`scheduler.yield()` / `setTimeout(0)`).
- Defer third-party scripts (analytics, chat widgets); code-split bundles (chunks ≤ 200KB).
- No synchronous network calls in input handlers; remove jQuery if present.

## Asset & delivery budgets

| Budget | Target |
|---|---|
| Total JS (compressed) | < 300 KB |
| Total CSS (compressed) | < 80 KB |
| Hero image | < 200 KB |
| Total page weight | < 1.5 MB (sub-3s on 4G mobile) |
| Third-party scripts | < 5 |

- Minification + Brotli/gzip; long-lived `Cache-Control` on hashed assets + CDN; HTTP/3; speculation rules API for prerendering where appropriate.

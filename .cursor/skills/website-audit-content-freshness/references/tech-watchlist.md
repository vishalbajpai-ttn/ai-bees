# Technology Watchlist — Living Document

> Refresh before every audit. Add dated entries for major changes in the last 12–18 months relevant to the audited page's industry. Delete or strike through entries older than 24 months. Last refreshed: 2026-09-22.

## AI & search

- **2024-05:** Google AI Overviews launched publicly; expanded through 2025 (~13–21% of queries by late 2025). Content ignoring zero-click reality or calling SGE "experimental" is stale.
- **2025:** Google AI Mode launched (fully conversational search). Zero-click searches ~58–60% of queries.
- AI-generated content era: Google rewards first-hand experience and original data; generic listicles underperform.

## Frameworks & web platform

- **2024-12:** React 19 stable. Content on class components or React 17/18-era patterns without migration notes is dated.
- Next.js 15: async request APIs (`params`/`headers`/`cookies` are Promises); fetch **uncached by default** (breaking change from 13/14).
- React Server Components mainstream; React Native 0.80 (2025-06, React 19.1; Legacy Architecture frozen).
- Testing: Playwright overtaking Cypress; Vitest catching Jest.
- **2024-03:** INP replaced FID as the responsiveness metric; FID removed from field tools 2024-09. Any "optimize FID" guidance without INP is outdated.

## Browser & privacy

- **2025-04:** Google **reversed** Chrome third-party-cookie deprecation — Chrome keeps a user-choice model; Safari/Firefox still block. Content promising cookie deprecation "by 2025" is wrong.
- **2025-10:** Google **deprecated all Privacy Sandbox APIs** (Topics, Protected Audience, Attribution Reporting). Content recommending them as the future is stale.
- Consent/cookie enforcement tightening (2025–26 EU/US state laws; 20+ US state privacy laws). India's DPDP Act enforcement ramp-up.

## Analytics

- Universal Analytics sunset (2023–24). Any UA setup guidance is obsolete — GA4 is the reference.
- Server-side tracking / first-party data strategies replacing cookie-dependent measurement.

## Security standards

- TLS 1.3 as baseline; TLS 1.0/1.1 deprecated; SHA-1 long dead. Content recommending outdated cipher guidance or HTTP fallbacks is a fail.
- Google's FAQ/HowTo rich-result restrictions (FAQ visibility reduced 2023) — content promising FAQ rich results everywhere is outdated.

## Runtimes / Node.js

- **2026-09-16:** Node.js 26.9.0 (Current): FFI enabled by default, first-class Web Workers in thread contexts, experimental DTLS API, generic MAC crypto API. node:bench landed then moved behind `--experimental-bench`. Node 26 enters Active LTS 2026-10-28.
- **2026-09-08:** Node.js 24.21.0 'Krypton' entered Active LTS (V8 13.6; Explicit Resource Management `using`/`await using`; stable require(esm)). Node 22 'Jod' in Maintenance LTS until 2027-04-30.
- **2026-06-01 / 2026-04-30:** Node.js 25 (odd line) EOL; Node.js 20 reached EOL. Content recommending Node 20/18 as current is stale.
- **2026-10:** Node 27 expected; annual release cycle from Node 27 (every major intended to enter LTS).

## How to refresh this file

1. Search for: "<industry> major changes <current year>", "<framework> deprecated <current year>", "what's new <technology> <current year>".
2. Add dated bullet entries. Verify against primary sources (official blogs, W3C, Google Search Central).
3. Update the "Last refreshed" date above.

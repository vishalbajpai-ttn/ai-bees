# SEO Technical Checklist — Strict Review

## 1. Crawlability & indexability (check first — fail-fast)

- `robots.txt` present; verify actual disallows don't block important pages/resources.
- XML sitemap exists, contains only canonical / indexable / 200-OK URLs; submitted to Search Console.
- `<lastmod>` honest — Google verifies it against actual page changes; manipulated dates teach Google to ignore the sitemap (flag as High).
- No accidental `noindex` on important pages; no `nofollow` on internal links by default.
- Self-referencing canonical on every unique page; canonical must not point at a redirect target (check for canonical→redirect loops manually).
- No duplicate content from URL parameters or protocol variants; redirect chains collapsed to single 301s.
- HTTPS forced cleanly; no mixed content.
- Orphan check: every important page reachable ≤ 3 clicks from homepage with 2+ internal links.
- Hreflang validated (proper return links, x-default) for multilingual sites.

## 2. Meta & head

- Unique `<title>` per page, ≤ 60 chars, primary keyword near front, no template duplication.
- Meta description 150–160 chars, unique, aligned with current-year intent.
- `<meta name="viewport">`, charset, `<html lang>` present.
- Open Graph + Twitter card tags.
- JSON-LD schema.org, validated error-free (Google Rich Results Test). FAQ, Article/BlogPosting with honest `datePublished`/`dateModified`, Product, Breadcrumb, Organization as applicable.

## 3. On-page

- Single H1 reflecting the primary topic; H2 sections; H3 subsections.
- Primary keyword in title, first 100 words, ≥1 subheading, URL slug; related terms for depth — no stuffing.
- 3–5 internal body links with descriptive anchor text; page linked *from* other pages.
- Descriptive image alt text (check quality, not just presence).
- Short, keyword-bearing URL slug; no parameters.
- E-E-A-T signals: author bio, About page, visible contact info.
- External links to authoritative sources where relevant.

## 4. Cross-page / crawl checks (carry most of the value)

- Duplicate titles/descriptions across the crawl; redirect chains and loops; broken internal/external links; orphan pages.

## 5. AI-search readiness (2025–26)

- Definition blocks (40–60 words), question-format H2s, numbered steps, comparison tables, FAQ schema.
- Content shaped to be cited by AI Overviews / AI Mode, not just ten blue links.

## References

- Search Engine Land — technical SEO issues auditors miss: https://searchengineland.com/technical-seo-issues-auditing-tools-385471
- Google on sitemap lastmod (John Mueller): https://www.searchenginejournal.com/googles-john-mueller-updating-xml-sitemap-dates-doesnt-help-seo/545547/

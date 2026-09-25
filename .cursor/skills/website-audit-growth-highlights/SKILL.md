---
name: website-audit-growth-highlights
description: Build an annotated growth proposal for a website page — numbered highlights on a simplified mockup showing what to add or change to improve visibility, freshness, and new-client acquisition. Verifies the page shows the latest industry developments and lists what is missing. Trigger on "growth highlighter", "improve visibility", "what to add to the page", "page growth suggestions", "make the page attract more clients".
---

# Growth Highlights

## Purpose

Turn a website page into a growth proposal: a set of numbered highlights pinned on a simplified mockup of the page, each one a concrete suggestion to add or change something so the page gets found more easily, looks current, and wins new clients. Works on its own (given a page address) or as a follow-up to a website audit.

## The three goals

Every highlight must serve at least one of these. Say which one on each card.

1. **Visibility** — more people find the page, understand it in seconds, and trust it.
2. **Freshness** — the page shows the newest versions, features, and news, and nothing on it looks out of date.
3. **New clients** — a first-time visitor is convinced to try, sign up, download, or contact.

## Workflow

1. **Learn the page.** Open the page (or reuse audit results if this follows an audit). Write down in one line: what the page offers, who it is for, and what the visitor is supposed to do next.
2. **Check the latest developments.** Refresh the technology watchlist (`../website-audit-content-freshness/references/tech-watchlist.md`) for the page's industry: what changed in the last 12 months (new versions, new features, discontinued products, new rules). Compare against the page and make the **latest-stuff gap list**: each recent development, whether the page shows it, and which highlight fixes it.
3. **Find the gaps.** Walk the page top to bottom and ask, for each section:
   - Visibility: would a stranger understand the offer in 5 seconds? Is there proof (numbers, customer stories, reviews)? Is there anything worth sharing or linking to?
   - Freshness: are versions, dates, screenshots, and examples current? Is the newest release easy to spot?
   - New clients: is the next step obvious? Can someone try before committing? Is there a way to stay in touch (email signup)? Is there a reason to choose this over alternatives?
   - Collect at most 12 highlights. Fewer, sharper highlights beat a long list.
4. **Write each highlight** with: number, short title, the goal it serves, what to add or change (concrete), why it helps (one or two plain sentences), effort (low / medium / high), when to ship (now / next / later), and suggested wording the page owner can copy.
5. **Build the output page** (see Output Contract). Deliver the file to the user.

## Output Contract

One self-contained page file (no outside dependencies), following the proven structure:

1. **Header** — title, one-line purpose, a color legend for the three goals, and a note that figures, quotes, and company names marked with a star still need verifying.
2. **Mockup** — a simplified recreation of the page (clearly labeled as a mockup, not the real site). Numbered pins on the areas each highlight touches; clicking a pin jumps to its card. Proposed new sections are shown as dashed blocks so they are easy to tell apart from what exists today.
3. **Suggestion cards** — one card per highlight: number, title, goal tags, effort, ship timing, what to change, why it helps, and suggested wording in a quote box.
4. **Priority map** — a table of all highlights with goal, effort, and ship timing, ordered now first.
5. **Latest-stuff gap list** — a table: recent development, whether the page shows it today, which highlight covers it.
6. **Footer** — date prepared, and the warning that starred items are placeholders, not verified facts.

## Operating Rules

- **Plain language everywhere.** No abbreviations in the output. Write "search engines" not "SEO", "call to action" becomes "next step button" or is described in words, "end of life" instead of "EOL". If a technical term has no plain equivalent, explain it the first time you use it.
- **Never invent numbers.** Downloads, revenue, customer counts, quotes, and company names must come from a real source or be clearly marked with a star as placeholders to verify.
- **Concrete beats clever.** Each highlight names the exact section, the exact change, and copy-paste wording. "Improve the hero section" is not a highlight; "add a one-line announcement bar above the menu with the newest version and a link to what changed" is.
- **Cap at 12 highlights**, ordered by impact. If more ideas appear, keep the best 12.
- Keep the page scannable: mockup and pins up top, detail below.

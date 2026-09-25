# AI Bees

AI Bees is a React and Node.js website-intelligence app powered by the Cursor
Agent SDK. It launches seven specialist website-audit workers in parallel,
streams their progress to the browser, combines their weighted results, and
creates a styled PDF report with desktop and mobile screenshots.

## What runs where

- **Frontend:** React 19 and Vite.
- **Backend:** Node.js, TypeScript, and Express.
- **Audit workers:** seven local Cursor SDK agents using project audit skills.
- **Live progress:** Server-Sent Events (SSE).
- **Screenshots and PDF:** Playwright with headless Chromium.
- **Storage:** audit jobs are currently held in server memory. Restarting the
  server clears them; persistent audit history is not implemented yet.

The seven phases are UI/UX, SEO, content freshness, security, accessibility,
performance, and privacy/legal. They start in parallel and return evidence,
scores, confidence, blockers, and prioritized recommendations.

## Prerequisites

- Node.js 22.13 or newer
- npm
- A Cursor API key from
  [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations)
- Internet access for the Cursor workers and public pages being audited
- Chromium installed through Playwright for screenshots and PDF creation

Only public HTTP/HTTPS pages are accepted. Localhost, private IP addresses, and
private network hostnames are rejected.

## First-time setup

```bash
npm install
cp .env.example .env
npm run dev
```

`npm install` automatically downloads Chromium into the stable,
project-local `.playwright-browsers` directory. That directory is ignored by
Git. On Linux CI or a minimal Linux server, also install Chromium's
operating-system libraries with:

```bash
npx playwright install-deps chromium
```

Edit `.env` before starting the app:

```dotenv
CURSOR_API_KEY=your_cursor_api_key
CURSOR_MODEL=composer-2.5
PORT=5173
```

Never commit `.env` or expose `CURSOR_API_KEY` in frontend code. The key is read
only by the Node server.

Open <http://localhost:5173>. Confirm the backend configuration at
<http://localhost:5173/api/health>; it reports whether Cursor is configured and
which model is selected, but never returns the key.

## Cursor model configuration

`CURSOR_MODEL` defaults to `composer-2.5`. Set it to a model ID available to the
Cursor account associated with `CURSOR_API_KEY`. Model availability changes by
account and over time; use the Cursor SDK model-list API or the current Cursor
SDK documentation instead of assuming that every account supports the same
IDs.

Restart the Node server after changing `.env`.

## Audit skills

The complete skill pack is committed under `.cursor/skills`, so a fresh clone
does not need the original Downloads folder. The backend intentionally uses:

```ts
local: {
  cwd: process.cwd(),
  settingSources: ['project'],
}
```

This allows each worker to load the matching project skill while avoiding
ambient user settings. Keep these directories when copying or deploying the
project:

```text
.cursor/skills/website-audit/
.cursor/skills/website-audit-ui-ux/
.cursor/skills/website-audit-seo/
.cursor/skills/website-audit-content-freshness/
.cursor/skills/website-audit-security/
.cursor/skills/website-audit-accessibility/
.cursor/skills/website-audit-performance/
.cursor/skills/website-audit-privacy-legal/
```

If replacing the skill pack, copy its contents into `.cursor/skills`, preserve
the app-specific parallel workflow and structured recommendation contract, and
restart the server.

## MCP configuration

No MCP server is required for the current app. The Cursor workers use the
Cursor SDK's built-in `webFetch`, `webSearch`, `shell`, `read`, and `glob`
tools. Playwright is a normal server dependency used directly by the report
service; it is not the Playwright MCP server.

MCP is optional if you later want workers to access another system such as a
CMS, analytics platform, or issue tracker. Cursor SDK agents support HTTP and
stdio MCP servers passed inline to `Agent.create` or `agent.send`. Do not add
tokens to source control or `.cursor` files. Keep MCP credentials in environment
variables or an approved secret manager. See:

- [Cursor SDK TypeScript documentation](https://cursor.com/docs/sdk/typescript)
- [Cursor MCP documentation](https://cursor.com/docs/mcp)

If MCP servers are added in the future, document their names, transport,
required environment variables, and authentication steps here. Inline MCP
configuration must also be supplied again when resuming an agent because it is
not persisted.

## Development commands

```bash
npm run dev          # Express API and Vite development middleware
npm run dev:server   # Same Node development entry point
npm run dev:client   # Standalone Vite client (API must run separately)
npm run check        # TypeScript and lint checks
npm run lint         # Lint only
npm test             # Unit tests
npm run build        # Type-check and build the production client
npm run preview      # Serve the production build through Express
```

## Production run

```bash
npm ci
npm run build
npm run preview
```

Set `CURSOR_API_KEY`, `CURSOR_MODEL`, `PORT`, and `NODE_ENV=production` in the
deployment environment. Deploy the `.cursor/skills` directory along with the
application. The service needs writable temporary storage for Playwright browser
profiles and enough memory to run seven Cursor workers plus Chromium.

The current job store is process-local. Use a shared database or durable job
store before running multiple replicas or promising persistent history.

## API overview

- `GET /api/health` — configuration health and selected model
- `POST /api/audits` — validate a public URL and start an audit
- `GET /api/audits/:jobId` — current job snapshot
- `GET /api/audits/:jobId/events` — SSE progress stream
- `GET /api/audits/:jobId/screenshots/:viewport` — captured `desktop` or
  `mobile` evidence
- `GET /api/audits/:jobId/report.pdf` — styled report after completion

Audit creation is rate-limited to five starts per minute per client IP.

## Troubleshooting

### The audit fails immediately

- Confirm `CURSOR_API_KEY` is set in `.env`.
- Confirm `CURSOR_MODEL` is available to that Cursor account.
- Restart the app after changing environment values.
- Check `/api/health`.
- Confirm the machine can reach Cursor and the public target page.

### PDF creation or screenshots fail

Install the matching browser and restart the app:

```bash
npm run install:browsers
```

On Linux, also run `npx playwright install-deps chromium`. Ensure the runtime
user can launch child processes and write temporary browser-profile files.

### The port is already in use

Stop the existing process using `PORT`, or select another port in `.env`, for
example `PORT=5174`, then restart the app.

### Audit history disappeared

This is expected after a restart in the current version because audit jobs are
stored in memory. The disabled “Audit history” navigation item is a planned
feature, not persistent storage.

## Validation

Before deploying changes, run:

```bash
npm test
npm run check
npm run build
```

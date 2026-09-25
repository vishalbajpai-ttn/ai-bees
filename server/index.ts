import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import { createAudit, getAudit, subscribe } from './audit-service.ts'
import { getCursorModel } from './config.ts'
import { generateAuditPdf, getAuditScreenshot } from './report-service.ts'
import { parsePublicUrl } from './url.ts'

const app = express()
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDirectory, '..')
const envPath = path.join(projectRoot, '.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)

const port = Number(process.env.PORT || 5173)
const production = process.env.NODE_ENV === 'production'
const requestWindows = new Map<string, { count: number; resetAt: number }>()

app.disable('x-powered-by')
app.use(express.json({ limit: '4kb' }))
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  )
  next()
})

function auditRateLimit(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const key = request.ip || 'unknown'
  const timestamp = Date.now()
  const current = requestWindows.get(key)

  if (!current || current.resetAt <= timestamp) {
    requestWindows.set(key, { count: 1, resetAt: timestamp + 60_000 })
    next()
    return
  }

  if (current.count >= 5) {
    response.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many audits started. Try again in a minute.',
      },
    })
    return
  }

  current.count += 1
  next()
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    cursorConfigured: Boolean(process.env.CURSOR_API_KEY),
    model: getCursorModel(),
  })
})

app.post('/api/audits', auditRateLimit, (request, response) => {
  try {
    const url = parsePublicUrl(request.body?.url)
    const job = createAudit(url)
    response.status(202).json({ job })
  } catch (error) {
    response.status(400).json({
      error: {
        code: 'INVALID_URL',
        message: error instanceof Error ? error.message : 'Invalid request.',
      },
    })
  }
})

app.get('/api/audits/:jobId', (request, response) => {
  const job = getAudit(request.params.jobId)
  if (!job) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Audit not found.' },
    })
    return
  }
  response.json({ job })
})

app.get('/api/audits/:jobId/report.pdf', async (request, response) => {
  const job = getAudit(request.params.jobId)
  if (!job) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Audit not found.' },
    })
    return
  }
  if (!job.summary) {
    response.status(409).json({
      error: {
        code: 'AUDIT_INCOMPLETE',
        message: 'The PDF is available after the audit completes.',
      },
    })
    return
  }

  try {
    const pdf = await generateAuditPdf(job)
    const hostname = new URL(job.url).hostname.replace(/[^a-z0-9.-]/gi, '-')
    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${hostname}-audit.pdf"`,
    )
    response.setHeader('Cache-Control', 'no-store')
    response.send(Buffer.from(pdf))
  } catch (error) {
    console.error('PDF generation failed', error)
    response.status(500).json({
      error: {
        code: 'REPORT_FAILED',
        message: 'The PDF report could not be created.',
      },
    })
  }
})

app.get(
  '/api/audits/:jobId/screenshots/:viewport',
  async (request, response) => {
    const job = getAudit(request.params.jobId)
    const viewport = request.params.viewport
    if (!job) {
      response.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Audit not found.' },
      })
      return
    }
    if (viewport !== 'desktop' && viewport !== 'mobile') {
      response.status(400).json({
        error: { code: 'INVALID_VIEWPORT', message: 'Invalid screenshot size.' },
      })
      return
    }

    const image = await getAuditScreenshot(job, viewport)
    if (!image) {
      response.status(503).json({
        error: {
          code: 'SCREENSHOT_UNAVAILABLE',
          message: 'The page screenshot could not be captured.',
        },
      })
      return
    }
    response.setHeader('Content-Type', 'image/jpeg')
    response.setHeader('Cache-Control', 'private, max-age=3600')
    response.send(image)
  },
)

app.get('/api/audits/:jobId/events', (request, response) => {
  const job = getAudit(request.params.jobId)
  if (!job) {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Audit not found.' },
    })
    return
  }

  response.setHeader('Content-Type', 'text/event-stream')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('Connection', 'keep-alive')
  response.flushHeaders()

  const send = (event: unknown) => {
    response.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  send({ type: 'snapshot', job })
  const unsubscribe = subscribe(job.id, send)
  const heartbeat = setInterval(() => response.write(': heartbeat\n\n'), 15_000)

  request.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})

if (production) {
  const dist = path.join(projectRoot, 'dist')
  app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true }))
  app.get('*path', (_request, response) => {
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    )
    response.sendFile(path.join(dist, 'index.html'))
  })
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    root: projectRoot,
    server: { middlewareMode: true },
    appType: 'spa',
  })
  app.use(vite.middlewares)
}

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error)
    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The server could not complete this request.',
      },
    })
  },
)

const server = app.listen(port, () => {
  console.log(`AI Bees is running at http://localhost:${port}`)
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

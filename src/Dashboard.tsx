import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  PHASES,
  type AuditEvent,
  type AuditJob,
  type AuditWorker,
} from '../shared/audit.ts'
import { stripUrlProtocol, toHttpsUrl } from '../shared/url.ts'
import {
  ArrowIcon,
  DownloadIcon,
  HistoryIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
} from './components/Icons.tsx'
import { ScoreSummary } from './components/ScoreSummary.tsx'
import { WorkerCard } from './components/WorkerCard.tsx'
import './App.css'

const idleWorkers: AuditWorker[] = PHASES.map((phase) => ({
  phase,
  status: 'queued',
  activity: 'Runs in parallel',
}))

export default function Dashboard() {
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<AuditJob>()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [creatingPdf, setCreatingPdf] = useState(false)
  const [model, setModel] = useState('')
  const eventSource = useRef<EventSource | null>(null)

  useEffect(() => () => eventSource.current?.close(), [])

  useEffect(() => {
    void fetch('/api/health')
      .then((response) => response.json())
      .then((payload: { model?: string }) => {
        if (typeof payload.model === 'string' && payload.model) {
          setModel(payload.model)
        }
      })
      .catch(() => {})
  }, [])

  function resetAudit() {
    eventSource.current?.close()
    eventSource.current = null
    setJob(undefined)
    setError('')
    setUrl('')
  }

  function connectToAudit(jobId: string) {
    eventSource.current?.close()
    const source = new EventSource(`/api/audits/${jobId}/events`)
    eventSource.current = source

    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as AuditEvent
      if (event.type === 'snapshot' || event.type === 'complete') {
        setJob(event.job)
        if (event.type === 'complete') source.close()
      } else if (event.type === 'worker') {
        setJob((current) => {
          if (!current) return current
          return {
            ...current,
            updatedAt: new Date().toISOString(),
            workers: current.workers.map((worker) =>
              worker.phase.id === event.worker.phase.id ? event.worker : worker,
            ),
          }
        })
      } else if (event.type === 'error') {
        setError(event.message)
      }
    }

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) return
      setError('Live updates were interrupted. Refresh to check the audit.')
      source.close()
    }
  }

  async function startAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const auditUrl = toHttpsUrl(url)

    try {
      const response = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: auditUrl }),
      })
      const payload = (await response.json()) as {
        job?: AuditJob
        error?: { message?: string }
      }

      if (!response.ok || !payload.job) {
        throw new Error(payload.error?.message || 'The audit could not start.')
      }

      setJob(payload.job)
      connectToAudit(payload.job.id)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The audit could not start.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadPdf() {
    if (!job?.summary) return

    setError('')
    setCreatingPdf(true)
    try {
      const response = await fetch(`/api/audits/${job.id}/report.pdf`)
      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { message?: string }
        }
        throw new Error(payload.error?.message || 'The PDF could not be created.')
      }

      const blobUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${new URL(job.url).hostname}-audit.pdf`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : 'The PDF could not be created.',
      )
    } finally {
      setCreatingPdf(false)
    }
  }

  const workers = job?.workers ?? idleWorkers
  const completeCount = workers.filter(
    (worker) => worker.status === 'complete',
  ).length
  const running = job?.status === 'running'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="AI Bees home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>AI BEES</strong>
            <small>Bees intelligence</small>
          </span>
        </a>

        <nav aria-label="Main navigation">
          <button className="nav-item nav-item--active" type="button">
            <PlusIcon />
            New audit
          </button>
          <button className="nav-item" type="button" disabled>
            <HistoryIcon />
            Audit history
            <span className="soon-pill">Soon</span>
          </button>
        </nav>

        <div className="sidebar__bottom">
          <div className="secure-note">
            <ShieldIcon />
            <div>
              <strong>Server-side by design</strong>
              <span>Your Cursor key never reaches the browser.</span>
            </div>
          </div>
          <button className="settings-button" type="button" disabled>
            <SettingsIcon />
            Settings
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            <strong>AI BEES</strong>
          </div>
          <div className="topbar__status">
            <span className="online-dot" />
            App workers ready
          </div>
        </header>

        <div className="workspace">
          <section className="intro">
            <div>
              <span className="section-kicker">Bees intelligence</span>
              <h1>
                The hive that guards
                <br />
                <em> your website</em>
              </h1>
              <p>
                Get one clear verdict.
              </p>
            </div>
            {job && (
              <button
                className="new-audit-button"
                type="button"
                onClick={resetAudit}
              >
                <PlusIcon />
                New audit
              </button>
            )}
          </section>

          <form className="audit-form" onSubmit={startAudit}>
            <label htmlFor="website-url">Website URL</label>
            <div className="url-field">
              <span>https://</span>
              <input
                id="website-url"
                type="text"
                inputMode="url"
                value={url}
                onChange={(event) =>
                  setUrl(stripUrlProtocol(event.target.value))
                }
                placeholder="yourwebsite.com"
                autoComplete="url"
                disabled={running || submitting}
                required
              />
              <button disabled={running || submitting}>
                {submitting
                  ? 'Starting…'
                  : running
                    ? 'Audit running'
                    : 'Run audit'}
                <ArrowIcon />
              </button>
            </div>
            <div className="form-meta">
              <span>Public pages only</span>
              <span>•</span>
              <span>Usually 5–10 minutes</span>
              <span>•</span>
              <span>Evidence-first analysis</span>
              {model && (
                <>
                  <span>•</span>
                  <span>{model}</span>
                </>
              )}
            </div>
          </form>

          {error && (
            <div className="error-banner" role="alert">
              <strong>Something needs attention.</strong>
              <span>{error}</span>
            </div>
          )}

          {job && (
            <div className="audit-target">
              <div>
                <span>Auditing</span>
                <strong>{job.url}</strong>
              </div>
              <span className={`job-state job-state--${job.status}`}>
                {job.status === 'running'
                  ? `${completeCount} of ${workers.length} complete`
                  : job.status}
              </span>
            </div>
          )}

          {job && <ScoreSummary job={job} />}

          <section className="workers-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">The specialist hive</span>
                <h2>Audit workers</h2>
              </div>
              <button
                className="pdf-button"
                type="button"
                disabled={!job?.summary || creatingPdf}
                title={
                  job?.summary
                    ? 'Create and download the audit PDF'
                    : 'Complete an audit to create the PDF'
                }
                onClick={downloadPdf}
              >
                <DownloadIcon />
                {creatingPdf ? 'Creating Report…' : 'Create Report'}
              </button>
            </div>
            <div className="worker-grid">
              {workers.map((worker) => (
                <WorkerCard key={worker.phase.id} worker={worker} />
              ))}
            </div>
          </section>

          <footer>
            <span>Powered by Cursor Agent SDK</span>
            <span>Strict audit skills · Weighted scoring · Honest caveats</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

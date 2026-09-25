import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuditWorker } from '../../shared/audit.ts'

interface PhaseDetailsDialogProps {
  worker: AuditWorker
  onClose: () => void
}

function overview(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
  return sentences.slice(0, 4).join(' ')
}

export function PhaseDetailsDialog({
  worker,
  onClose,
}: PhaseDetailsDialogProps) {
  const result = worker.result
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const closeButton = useRef<HTMLButtonElement>(null)

  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(onClose, 180)
  }, [closing, onClose])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [requestClose])

  useEffect(() => {
    document.body.classList.add('dialog-open')
    closeButton.current?.focus({ preventScroll: true })
    return () => {
      document.body.classList.remove('dialog-open')
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  if (!result) return null

  const fixes = result.recommendations.slice(0, 5)

  return (
    <div
      className={`phase-dialog__backdrop ${
        closing ? 'phase-dialog__backdrop--closing' : ''
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <section
        className="phase-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`phase-dialog-${worker.phase.id}`}
      >
        <header className="phase-dialog__header">
          <div>
            <span className="section-kicker">Phase overview</span>
            <h2 id={`phase-dialog-${worker.phase.id}`}>
              {worker.phase.name}
            </h2>
          </div>
          <div className="phase-dialog__score">
            <strong>{result.score}</strong>
            <span>/ 100</span>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={requestClose}
            aria-label="Close phase overview"
          >
            ×
          </button>
        </header>

        <div className="phase-dialog__summary">
          <p>{overview(result.summary)}</p>
        </div>

        <section className="phase-dialog__section">
          <div className="phase-dialog__section-title">
            <span className="section-kicker">Recommended actions</span>
            <h3>Top fixes</h3>
          </div>
          {fixes.length ? (
            <ol className="top-fixes">
              {fixes.map((recommendation, index) => (
                <li key={`${recommendation.title}-${index}`}>
                  <span
                    className={`priority priority--${recommendation.priority.toLowerCase()}`}
                  >
                    {recommendation.priority}
                  </span>
                  <span>{recommendation.title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-detail">No recommendations were recorded.</p>
          )}
        </section>
      </section>
    </div>
  )
}

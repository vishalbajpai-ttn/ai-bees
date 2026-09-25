import { useState } from 'react'
import type { AuditWorker } from '../../shared/audit.ts'
import { CheckIcon, ChevronIcon } from './Icons.tsx'
import { PhaseDetailsDialog } from './PhaseDetailsDialog.tsx'

interface WorkerCardProps {
  worker: AuditWorker
}

const phaseMarks: Record<string, string> = {
  'ui-ux': '✦',
  seo: '⌁',
  'content-freshness': '◫',
  security: '◇',
  accessibility: 'A',
  performance: '↗',
  'privacy-legal': '§',
}

export function WorkerCard({ worker }: WorkerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { phase, result, status } = worker
  const findingTotal = result
    ? Object.values(result.findings).reduce((total, count) => total + count, 0)
    : 0

  return (
    <article
      className={`worker-card worker-card--${status}`}
      style={{ '--phase-color': phase.color } as React.CSSProperties}
    >
      <div className="worker-card__top">
        <div className="worker-avatar">
          <span>{phaseMarks[phase.id]}</span>
        </div>
        <div className="worker-card__identity">
          <span className="worker-card__eyebrow">Worker {phase.weight}%</span>
          <h3>{phase.name}</h3>
        </div>
        {status === 'working' && <span className="status-orbit" />}
        {status === 'complete' && (
          <span className="status-check">
            <CheckIcon />
          </span>
        )}
        {status === 'failed' && <span className="status-failed">!</span>}
      </div>

      <div className="worker-card__status">
        <span className="status-dot" />
        <span>{worker.error || worker.activity}</span>
      </div>

      {status === 'working' && (
        <div className="worker-progress" aria-label="Worker in progress">
          <span />
        </div>
      )}

      {result && (
        <>
          <div className="worker-result">
            <div>
              <strong>{result.score}</strong>
              <span>score</span>
            </div>
            <div>
              <strong>{result.confidence.percentage}%</strong>
              <span>confidence</span>
            </div>
            <div>
              <strong>{findingTotal}</strong>
              <span>findings</span>
            </div>
          </div>
          <button
            className="worker-details"
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            View details
            <ChevronIcon />
          </button>
          {expanded && (
            <PhaseDetailsDialog
              worker={worker}
              onClose={() => setExpanded(false)}
            />
          )}
        </>
      )}
    </article>
  )
}

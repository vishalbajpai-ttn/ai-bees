import type { AuditJob } from '../../shared/audit.ts'

interface ScoreSummaryProps {
  job: AuditJob
}

export function ScoreSummary({ job }: ScoreSummaryProps) {
  const summary = job.summary
  if (!summary) return null

  const tone =
    summary.verdict === 'PASS'
      ? 'positive'
      : summary.verdict === 'FAIL'
        ? 'negative'
        : 'warning'

  return (
    <section className={`score-summary score-summary--${tone}`}>
      <div
        className="score-ring"
        style={{
          background: `conic-gradient(var(--score-color) ${summary.score * 3.6}deg, #eceae4 0deg)`,
        }}
      >
        <div>
          <strong>{summary.score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <div className="score-summary__copy">
        <span className="section-kicker">Overall verdict</span>
        <h2>{summary.verdict}</h2>
        <p>
          Weighted across {job.workers.filter((worker) => worker.result).length}{' '}
          audit phases with {summary.confidence}% overall confidence.
        </p>
      </div>
      <div className="score-summary__facts">
        <div>
          <strong>{summary.blockers}</strong>
          <span>blockers</span>
        </div>
        <div>
          <strong>{summary.completedWeight}%</strong>
          <span>coverage</span>
        </div>
        <div>
          <strong>{summary.confidenceLevel}</strong>
          <span>confidence</span>
        </div>
      </div>
    </section>
  )
}

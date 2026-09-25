import { describe, expect, it } from 'vitest'
import { PHASES, type AuditJob, type AuditPhaseResult } from '../shared/audit.ts'
import { summarizeAudit } from './audit-service.ts'

function result(
  phaseId: AuditPhaseResult['phaseId'],
  score: number,
  level: AuditPhaseResult['confidence']['level'] = 'High',
  blockers = 0,
): AuditPhaseResult {
  return {
    phaseId,
    score,
    confidence: { level, percentage: 100, reason: 'Test evidence' },
    blockers,
    findings: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    recommendations: [],
    caveats: [],
    summary: 'Test result',
  }
}

describe('summarizeAudit', () => {
  it('uses phase weights and caps confidence when a phase is low confidence', () => {
    const job: AuditJob = {
      id: 'test',
      url: 'https://example.com/',
      status: 'running',
      createdAt: '',
      updatedAt: '',
      workers: [
        {
          phase: PHASES[0],
          status: 'complete',
          activity: 'Done',
          result: result('ui-ux', 80),
        },
        {
          phase: PHASES[1],
          status: 'complete',
          activity: 'Done',
          result: result('seo', 60, 'Low'),
        },
      ],
    }

    expect(summarizeAudit(job)).toMatchObject({
      score: 69,
      confidence: 70,
      confidenceLevel: 'Medium',
      verdict: 'NEEDS WORK',
      completedWeight: 33,
    })
  })

  it('fails the overall verdict when any worker reports a blocker', () => {
    const job: AuditJob = {
      id: 'test',
      url: 'https://example.com/',
      status: 'running',
      createdAt: '',
      updatedAt: '',
      workers: [
        {
          phase: PHASES[0],
          status: 'complete',
          activity: 'Done',
          result: result('ui-ux', 95, 'High', 1),
        },
      ],
    }

    expect(summarizeAudit(job)?.verdict).toBe('FAIL')
  })
})

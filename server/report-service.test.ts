import { describe, expect, it, vi } from 'vitest'
import { PHASES, type AuditJob } from '../shared/audit.ts'
import {
  generateAuditPdf,
  renderAuditReportHtml,
} from './report-service.ts'

vi.mock('playwright', () => ({
  chromium: {
    executablePath: () => '/mock/chromium',
    launch: async () => ({
      newPage: async () => ({
        setContent: async () => undefined,
        emulateMedia: async () => undefined,
        pdf: async () => {
          const bytes = Buffer.alloc(12_000)
          bytes.write('%PDF-')
          return bytes
        },
      }),
      close: async () => undefined,
    }),
  },
}))

describe('generateAuditPdf', () => {
  it('creates a cover and phase detail page', async () => {
    const job: AuditJob = {
      id: 'audit-1',
      url: 'https://example.com/',
      status: 'complete',
      createdAt: '2026-09-24T00:00:00.000Z',
      updatedAt: '2026-09-24T00:05:00.000Z',
      summary: {
        score: 78,
        confidence: 80,
        confidenceLevel: 'Medium',
        verdict: 'NEEDS WORK',
        blockers: 0,
        completedWeight: 15,
      },
      workers: [
        {
          phase: PHASES[0],
          status: 'complete',
          activity: 'Audit complete',
          result: {
            phaseId: 'ui-ux',
            score: 78,
            confidence: {
              level: 'Medium',
              percentage: 80,
              reason: 'Interactive page inspected.',
            },
            blockers: 0,
            findings: {
              critical: 0,
              high: 1,
              medium: 2,
              low: 0,
              info: 0,
            },
            recommendations: [
              {
                severity: 'High',
                title: 'Make the primary action easier to find',
                explanation:
                  'The main action blends into nearby content. Giving it stronger placement helps visitors move forward.',
                evidence: 'The primary action appears below the introductory copy.',
                businessImpact:
                  'Visitors may leave without starting the intended journey.',
                action: 'Move the primary action above the fold.',
                effort: 'Low',
                priority: 'Now',
              },
            ],
            caveats: ['Checkout was not inspected.'],
            summary: 'The page is usable but its primary action needs emphasis.',
          },
        },
      ],
    }

    const html = renderAuditReportHtml(job, {
      desktop: Buffer.from('captured-image'),
    })
    expect(html).toContain('Executive Summary')
    expect(html).toContain('Visual evidence')
    expect(html).toContain('data:image/jpeg;base64,')
    expect(html).toContain('Appendix — Phase Detail')

    const bytes = await generateAuditPdf(job, null)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
    expect(bytes.byteLength).toBeGreaterThan(10_000)
  }, 20_000)
})

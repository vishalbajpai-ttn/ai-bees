export type PhaseId =
  | 'ui-ux'
  | 'seo'
  | 'content-freshness'
  | 'security'
  | 'accessibility'
  | 'performance'
  | 'privacy-legal'

export type WorkerStatus = 'queued' | 'working' | 'complete' | 'failed'

export interface PhaseDefinition {
  id: PhaseId
  name: string
  skill: string
  weight: number
  color: string
}

export interface FindingCounts {
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

export interface AuditRecommendation {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
  title: string
  explanation: string
  evidence: string
  businessImpact: string
  action: string
  effort: 'Low' | 'Medium' | 'High'
  priority: 'Now' | 'Next' | 'Later'
}

export interface AuditPhaseResult {
  phaseId: PhaseId
  score: number
  confidence: {
    level: 'High' | 'Medium' | 'Low'
    percentage: number
    reason: string
  }
  blockers: number
  findings: FindingCounts
  recommendations: AuditRecommendation[]
  caveats: string[]
  summary: string
  primaryTask?: string
}

export interface AuditWorker {
  phase: PhaseDefinition
  status: WorkerStatus
  activity: string
  result?: AuditPhaseResult
  error?: string
  agentId?: string
  runId?: string
}

export interface AuditSummary {
  score: number
  confidence: number
  confidenceLevel: 'High' | 'Medium' | 'Low'
  verdict: 'PASS' | 'NEEDS WORK' | 'FAIL'
  blockers: number
  completedWeight: number
}

export interface AuditJob {
  id: string
  url: string
  status: 'running' | 'complete' | 'failed'
  createdAt: string
  updatedAt: string
  workers: AuditWorker[]
  summary?: AuditSummary
  error?: string
}

export type AuditEvent =
  | { type: 'snapshot'; job: AuditJob }
  | { type: 'worker'; worker: AuditWorker }
  | { type: 'complete'; job: AuditJob }
  | { type: 'error'; message: string }

export const PHASES: PhaseDefinition[] = [
  {
    id: 'ui-ux',
    name: 'UI / UX',
    skill: 'website-audit-ui-ux',
    weight: 15,
    color: '#f5b73b',
  },
  {
    id: 'seo',
    name: 'SEO',
    skill: 'website-audit-seo',
    weight: 18,
    color: '#ff7a59',
  },
  {
    id: 'content-freshness',
    name: 'Content freshness',
    skill: 'website-audit-content-freshness',
    weight: 10,
    color: '#8b7cf6',
  },
  {
    id: 'security',
    name: 'Security',
    skill: 'website-audit-security',
    weight: 20,
    color: '#ec5f7a',
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    skill: 'website-audit-accessibility',
    weight: 15,
    color: '#4d9bf5',
  },
  {
    id: 'performance',
    name: 'Performance',
    skill: 'website-audit-performance',
    weight: 12,
    color: '#38bfa1',
  },
  {
    id: 'privacy-legal',
    name: 'Privacy & legal',
    skill: 'website-audit-privacy-legal',
    weight: 10,
    color: '#75b85a',
  },
]

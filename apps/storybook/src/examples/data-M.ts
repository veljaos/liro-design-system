/*
 * Group M's example data (P5.26, Diagrams): Kvadrat Gradnja's approval of an incoming invoice,
 * "Odobravanje ulazne fakture" (the active version 3 and a draft of version 4 with two problems),
 * and the orchestrator's nightly bank-statement import of 6 October 2026, stopped at a failed step.
 * Fictitious; the thresholds, banks and times are illustrative. The checks of the draft and the
 * run's states are the application's work, played here; the diagram only shows them. Not part of
 * the package. No classes here.
 */
import { RotateCw, SkipForward } from 'lucide-react'
import type {
  DiagramConnection,
  DiagramLane,
  DiagramModel,
  DiagramProblem,
  DiagramRun,
  DiagramStep,
} from '../../../../packages/ui/src/diagram'
import { stepOrder } from '../../../../packages/ui/src/diagram'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const M_ROUTES = {
  /** The active approval workflow, read only. */
  approval: '/settings/workflows/incoming-invoice-approval',
  /** Its draft of version 4, being edited, with two problems. */
  approvalEdit: '/settings/workflows/incoming-invoice-approval/edit',
  /** The nightly import of 6 October 2026, stopped at Banca Intesa's statement. */
  importRun: '/automation/runs/bank-import-2026-10-06',
} as const

// ── The approval of an incoming invoice ───────────────────────────────────────────────────────

export const WORKFLOW = {
  name: 'Odobravanje ulazne fakture',
  version: 3,
  activeSince: '2026-09-01',
  /** The amount above which the director approves (illustrative). */
  threshold: '500000.00',
  waiting: 4,
} as const

export const APPROVAL_LANES: DiagramLane[] = [
  { id: 'accounting', label: 'Accounting' },
  { id: 'management', label: 'Management' },
  { id: 'finance', label: 'Finance' },
]

export const APPROVAL_STEPS: DiagramStep[] = [
  { id: 'received', kind: 'message', label: 'Invoice received from SEF', lane: 'accounting' },
  {
    id: 'check',
    kind: 'user-task',
    label: 'Check against the order and delivery',
    lane: 'accounting',
  },
  { id: 'correct', kind: 'exclusive', label: 'Matches?', lane: 'accounting' },
  { id: 'amount', kind: 'exclusive', label: 'Amount', lane: 'accounting' },
  { id: 'manager', kind: 'user-task', label: 'Site manager approves', lane: 'management' },
  { id: 'director', kind: 'user-task', label: 'Director approves', lane: 'management' },
  { id: 'post', kind: 'service-task', label: 'Post to the ledger', lane: 'accounting' },
  { id: 'pay', kind: 'task', label: 'Pay in the next payment run', lane: 'finance' },
  { id: 'paid', kind: 'end', label: 'Paid', lane: 'finance' },
  { id: 'reject', kind: 'message', label: 'Reject in SEF with the reason', lane: 'accounting' },
  { id: 'rejected', kind: 'end', label: 'Rejected', lane: 'accounting' },
]

/** The conditions as the application writes them, the amount through the tenant's format. */
export function approvalConnections(thresholdText: string): DiagramConnection[] {
  return [
    { id: 'a1', from: 'received', to: 'check' },
    { id: 'a2', from: 'check', to: 'correct' },
    { id: 'a3', from: 'correct', to: 'amount', label: 'Yes', isDefault: true },
    { id: 'a4', from: 'correct', to: 'reject', label: 'No' },
    { id: 'a5', from: 'amount', to: 'manager', label: `Up to ${thresholdText}`, isDefault: true },
    { id: 'a6', from: 'amount', to: 'director', label: `Above ${thresholdText}` },
    { id: 'a7', from: 'manager', to: 'post' },
    { id: 'a8', from: 'director', to: 'post' },
    { id: 'a9', from: 'post', to: 'pay' },
    { id: 'a10', from: 'pay', to: 'paid' },
    { id: 'a11', from: 'reject', to: 'rejected' },
  ]
}

/**
 * The draft of version 4: a legal review for invoices above the threshold, added after the
 * director's approval but not yet connected onwards, and a second decision ("Contract?") whose
 * two ways out have no default. The application's check finds both.
 */
export function approvalDraft(thresholdText: string): DiagramModel {
  const connections = approvalConnections(thresholdText).filter((each) => each.id !== 'a8')
  return {
    steps: [
      ...APPROVAL_STEPS.filter((step) => step.id !== 'pay' && step.id !== 'paid'),
      { id: 'contract', kind: 'exclusive', label: 'Under a contract?', lane: 'management' },
      { id: 'legal', kind: 'user-task', label: 'Legal reviews the terms', lane: 'management' },
      { id: 'pay', kind: 'task', label: 'Pay in the next payment run', lane: 'finance' },
      { id: 'paid', kind: 'end', label: 'Paid', lane: 'finance' },
    ],
    connections: [
      ...connections,
      { id: 'a12', from: 'director', to: 'contract' },
      { id: 'a13', from: 'contract', to: 'post', label: 'Yes' },
      { id: 'a14', from: 'contract', to: 'legal', label: 'No' },
    ],
  }
}

/**
 * The application's check of a workflow, run again after every change: every step but an end
 * has a way out, a decision with several ways out has a default one, every step can be reached
 * from the start.
 */
export function checkWorkflow(model: DiagramModel): DiagramProblem[] {
  const problems: DiagramProblem[] = []
  const reached = new Set<string>()
  const queue = model.steps.filter((step) => step.id === 'received').map((step) => step.id)
  while (queue.length > 0) {
    const id = queue.shift()
    if (id === undefined || reached.has(id)) continue
    reached.add(id)
    for (const each of model.connections) if (each.from === id) queue.push(each.to)
  }
  for (const id of stepOrder(model)) {
    const step = model.steps.find((each) => each.id === id)
    if (step === undefined) continue
    const out = model.connections.filter((each) => each.from === id)
    if (step.kind !== 'end' && out.length === 0) {
      problems.push({
        id: `out-${id}`,
        stepId: id,
        message: 'Has no way out: connect it to the next step.',
      })
    }
    if (
      step.kind === 'exclusive' &&
      out.length > 1 &&
      !out.some((each) => each.isDefault === true)
    ) {
      problems.push({
        id: `default-${id}`,
        stepId: id,
        message: 'A decision needs a default way out, for when no condition holds.',
      })
    }
    if (!reached.has(id)) {
      problems.push({ id: `reach-${id}`, stepId: id, message: 'Nothing leads to this step.' })
    }
  }
  return problems
}

/** A run's status tone, from the examples' one status-to-tone map (example-shell.tsx). */
export type DiagramRunTone = NonNullable<DiagramRun['status']>['tone']

// ── The nightly bank-statement import ─────────────────────────────────────────────────────────

export const IMPORT = {
  name: 'Nightly bank-statement import',
  date: '2026-10-06',
  started: '2026-10-06T02:00:00+02:00',
  stopped: '2026-10-06T02:01:12+02:00',
} as const

export const IMPORT_STEPS: DiagramStep[] = [
  { id: 'night', kind: 'timer', label: 'Every night at 02:00' },
  { id: 'fetch', kind: 'service-task', label: 'Fetch the statements from the banks' },
  { id: 'banks', kind: 'parallel', label: 'Each bank' },
  { id: 'intesa', kind: 'service-task', label: 'Import Banca Intesa 160-0000000412-77' },
  { id: 'raiffeisen', kind: 'service-task', label: 'Import Raiffeisen 265-0000000098-12' },
  { id: 'imported', kind: 'parallel', label: 'All imported' },
  { id: 'match', kind: 'service-task', label: 'Match payments to open invoices' },
  { id: 'review', kind: 'user-task', label: 'Review what did not match' },
  { id: 'report', kind: 'message', label: 'Send the morning report' },
  { id: 'done', kind: 'end', label: 'Done' },
]

export const IMPORT_CONNECTIONS: DiagramConnection[] = [
  { id: 'i1', from: 'night', to: 'fetch' },
  { id: 'i2', from: 'fetch', to: 'banks' },
  { id: 'i3', from: 'banks', to: 'intesa' },
  { id: 'i4', from: 'banks', to: 'raiffeisen' },
  { id: 'i5', from: 'intesa', to: 'imported' },
  { id: 'i6', from: 'raiffeisen', to: 'imported' },
  { id: 'i7', from: 'imported', to: 'match' },
  { id: 'i8', from: 'match', to: 'review' },
  { id: 'i9', from: 'review', to: 'report' },
  { id: 'i10', from: 'report', to: 'done' },
]

/** The run as the orchestrator reports it: Banca Intesa's statement failed, the rest waits. */
export function importRun(times: {
  night: string
  summary: string
  failedTone: DiagramRunTone
}): DiagramRun {
  return {
    status: { label: 'Failed', tone: times.failedTone },
    summary: times.summary,
    path: ['i1', 'i2', 'i3', 'i4', 'i6'],
    steps: {
      night: { state: 'done', note: times.night },
      fetch: { state: 'done', note: '2 statements' },
      banks: { state: 'done' },
      raiffeisen: { state: 'done', note: 'Statement 188, 37 lines' },
      intesa: {
        state: 'failed',
        reason: 'Banca Intesa did not answer within 30 s (timeout). Attempt 1 of 3.',
        actions: [
          { key: 'skip', label: 'Skip this bank', icon: SkipForward },
          { key: 'retry', label: 'Retry', icon: RotateCw, family: 'primary' },
        ],
      },
    },
  }
}

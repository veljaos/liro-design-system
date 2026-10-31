import { RotateCw, SkipForward } from 'lucide-react'
import { expect, waitFor } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { DiagramConnection, DiagramLane, DiagramProblem, DiagramStep } from './diagram-logic'
import type { DiagramRun } from './diagram-parts'

/*
 * The Diagram stories' data (fictitious processes). Not part of the package: nothing in
 * src/diagram/index.ts imports this file. No classes here.
 */

/**
 * Waits until every diagram in the story has laid itself out and fitted the view (its
 * `data-ready`): React Flow measures the steps after they are drawn, the layout runs again with
 * the measured sizes, then the view is fitted. Only checks; it never acts.
 */
export async function diagramReady(canvasElement: HTMLElement): Promise<void> {
  // Inside waitFor, so what React Flow measures meanwhile is not taken for an update outside
  // the test's act() (Storybook turns act's warnings off only in waitFor).
  await waitFor(
    async () => {
      await settle()
      const diagrams = canvasElement.querySelectorAll('[data-slot="diagram"]')
      await expect(diagrams.length).toBeGreaterThan(0)
      for (const diagram of diagrams) {
        await expect(diagram).toHaveAttribute('data-ready', 'true')
      }
      await settle()
    },
    { timeout: 8000 },
  )
}

/**
 * Lets animations and React Flow's measuring finish with act()'s warnings off (inside waitFor),
 * after a dialog or a menu opens or closes. Only waits.
 */
export async function quiet(): Promise<void> {
  await waitFor(async () => {
    await settle()
  })
}

// ── An approval (view, lanes, top to bottom) ──────────────────────────────────────────────────

export const APPROVAL_LANES: DiagramLane[] = [
  { id: 'accounting', label: 'Accounting' },
  { id: 'management', label: 'Management' },
  { id: 'finance', label: 'Finance' },
]

export const APPROVAL_STEPS: DiagramStep[] = [
  { id: 'received', kind: 'start', label: 'Invoice received', lane: 'accounting' },
  { id: 'check', kind: 'user-task', label: 'Check the invoice', lane: 'accounting' },
  { id: 'correct', kind: 'exclusive', label: 'Correct?', lane: 'accounting' },
  { id: 'amount', kind: 'exclusive', label: 'Amount', lane: 'accounting' },
  { id: 'manager', kind: 'user-task', label: 'Manager approves', lane: 'management' },
  { id: 'director', kind: 'user-task', label: 'Director approves', lane: 'management' },
  { id: 'post', kind: 'service-task', label: 'Post the invoice', lane: 'accounting' },
  { id: 'pay', kind: 'task', label: 'Pay the supplier', lane: 'finance' },
  { id: 'paid', kind: 'end', label: 'Paid', lane: 'finance' },
  { id: 'return', kind: 'message', label: 'Return to the supplier', lane: 'accounting' },
  { id: 'rejected', kind: 'end', label: 'Rejected', lane: 'accounting' },
]

export const APPROVAL_CONNECTIONS: DiagramConnection[] = [
  { id: 'c1', from: 'received', to: 'check' },
  { id: 'c2', from: 'check', to: 'correct' },
  { id: 'c3', from: 'correct', to: 'amount', label: 'Yes', isDefault: true },
  { id: 'c4', from: 'correct', to: 'return', label: 'No' },
  { id: 'c5', from: 'amount', to: 'manager', label: 'Up to 100.000,00 RSD', isDefault: true },
  { id: 'c6', from: 'amount', to: 'director', label: 'Above 100.000,00 RSD' },
  { id: 'c7', from: 'manager', to: 'post' },
  { id: 'c8', from: 'director', to: 'post' },
  { id: 'c9', from: 'post', to: 'pay' },
  { id: 'c10', from: 'pay', to: 'paid' },
  { id: 'c11', from: 'return', to: 'rejected' },
]

/** The same process without lanes. */
export const APPROVAL_STEPS_PLAIN: DiagramStep[] = APPROVAL_STEPS.map((step) => ({
  id: step.id,
  kind: step.kind,
  label: step.label,
}))

// ── A nightly job (run) ───────────────────────────────────────────────────────────────────────

export const NIGHTLY_STEPS: DiagramStep[] = [
  { id: 'night', kind: 'timer', label: 'Every night at 02:00' },
  { id: 'fetch', kind: 'service-task', label: 'Fetch the statements' },
  { id: 'files', kind: 'service-task', label: 'Check the files' },
  { id: 'split', kind: 'parallel', label: 'Each account' },
  { id: 'main', kind: 'service-task', label: 'Import the main account' },
  { id: 'savings', kind: 'service-task', label: 'Import the savings account' },
  { id: 'join', kind: 'parallel', label: 'All imported' },
  { id: 'match', kind: 'service-task', label: 'Match the payments' },
  { id: 'review', kind: 'user-task', label: 'Review what did not match' },
  { id: 'report', kind: 'message', label: 'Send the report' },
  { id: 'done', kind: 'end', label: 'Done' },
]

export const NIGHTLY_CONNECTIONS: DiagramConnection[] = [
  { id: 'n1', from: 'night', to: 'fetch' },
  { id: 'n2', from: 'fetch', to: 'files' },
  { id: 'n3', from: 'files', to: 'split' },
  { id: 'n4', from: 'split', to: 'main' },
  { id: 'n5', from: 'split', to: 'savings' },
  { id: 'n6', from: 'main', to: 'join' },
  { id: 'n7', from: 'savings', to: 'join' },
  { id: 'n8', from: 'join', to: 'match' },
  { id: 'n9', from: 'match', to: 'review' },
  { id: 'n10', from: 'review', to: 'report' },
  { id: 'n11', from: 'report', to: 'done' },
]

/** The savings account's import failed: the run waits on Retry or Skip. */
export const NIGHTLY_FAILED: DiagramRun = {
  status: { label: 'Failed', tone: 'danger' },
  summary: 'Started 02:00, stopped 02:01',
  path: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'],
  steps: {
    night: { state: 'done', note: '02:00' },
    fetch: { state: 'done', note: '12 s' },
    files: { state: 'done', note: '2 files' },
    split: { state: 'done' },
    main: { state: 'done', note: '214 lines' },
    savings: {
      state: 'failed',
      reason: 'The bank did not answer in 30 s.',
      // The step's log, shown on request as a small CodeBlock.
      log: [
        '02:01:02 GET /statements?account=savings&date=2026-10-05',
        '02:01:32 No answer within 30 s (timeout)',
        '02:01:32 Run stopped: waiting for Retry or Skip',
      ].join('\n'),
      logLanguage: 'text',
      actions: [
        { key: 'skip', label: 'Skip', icon: SkipForward },
        { key: 'retry', label: 'Retry', icon: RotateCw, family: 'primary' },
      ],
    },
  },
}

/** Running: matching, the review waiting for a person after it. */
export const NIGHTLY_RUNNING: DiagramRun = {
  status: { label: 'Running', tone: 'neutral' },
  summary: 'Started 02:00',
  path: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'],
  steps: {
    night: { state: 'done', note: '02:00' },
    fetch: { state: 'done', note: '12 s' },
    files: { state: 'done', note: '2 files' },
    split: { state: 'done' },
    main: { state: 'done', note: '214 lines' },
    savings: { state: 'done', note: '9 lines' },
    join: { state: 'done' },
    match: { state: 'running', note: '180 of 223 lines' },
  },
}

/** Finished: the review was skipped (nothing to review), the report sent. */
export const NIGHTLY_DONE: DiagramRun = {
  status: { label: 'Completed', tone: 'success' },
  summary: 'Started 02:00, finished 02:04',
  path: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'n11'],
  steps: {
    night: { state: 'done', note: '02:00' },
    fetch: { state: 'done', note: '12 s' },
    files: { state: 'done', note: '2 files' },
    split: { state: 'done' },
    main: { state: 'done', note: '214 lines' },
    savings: { state: 'done', note: '9 lines' },
    join: { state: 'done' },
    match: { state: 'done', note: '223 of 223 lines' },
    review: { state: 'skipped', reason: 'Everything matched.' },
    report: { state: 'done' },
    done: { state: 'done', note: '02:04' },
  },
}

/** Waiting for a person: the review of the lines that did not match. */
export const NIGHTLY_WAITING: DiagramRun = {
  status: { label: 'Waiting', tone: 'warning' },
  summary: 'Started 02:00',
  path: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9'],
  steps: {
    ...NIGHTLY_RUNNING.steps,
    match: { state: 'done', note: '214 of 223 lines' },
    review: { state: 'waiting', note: 'Ana Petrović, 9 lines' },
  },
}

// ── A workflow being edited, with problems ────────────────────────────────────────────────────

export const LEAVE_STEPS: DiagramStep[] = [
  { id: 'asked', kind: 'start', label: 'Leave requested' },
  { id: 'approve', kind: 'user-task', label: 'Manager decides' },
  { id: 'decision', kind: 'exclusive', label: 'Approved?' },
  { id: 'record', kind: 'service-task', label: 'Record the leave' },
  { id: 'notify', kind: 'message', label: 'Tell the employee' },
  { id: 'end', kind: 'end', label: 'Done' },
  { id: 'archive', kind: 'task', label: 'Archive the request' },
]

export const LEAVE_CONNECTIONS: DiagramConnection[] = [
  { id: 'l1', from: 'asked', to: 'approve' },
  { id: 'l2', from: 'approve', to: 'decision' },
  { id: 'l3', from: 'decision', to: 'record', label: 'Yes' },
  { id: 'l4', from: 'decision', to: 'notify', label: 'No' },
  { id: 'l5', from: 'record', to: 'end' },
]

/** What the application's check says about the leave workflow. */
export const LEAVE_PROBLEMS: DiagramProblem[] = [
  { id: 'p1', stepId: 'notify', message: 'Has no way out: connect it to an end.' },
  { id: 'p2', stepId: 'archive', message: 'Nothing leads to this step.' },
  { id: 'p3', connectionId: 'l3', message: 'A decision needs a default path.' },
]

// ── Long labels ───────────────────────────────────────────────────────────────────────────────

export const LONG_STEPS: DiagramStep[] = [
  { id: 's', kind: 'start', label: 'A purchase request arrives from any department' },
  {
    id: 'a',
    kind: 'user-task',
    label:
      'The head of the department checks that the purchase is in this year’s budget and that the supplier is on the approved list',
  },
  { id: 'g', kind: 'exclusive', label: 'Within the budget and from an approved supplier?' },
  {
    id: 'b',
    kind: 'service-task',
    label: 'Create the purchase order and send it to the supplier by e-mail with the terms',
  },
  { id: 'c', kind: 'sub-process', label: 'Ask the board for an exception to the budget' },
  { id: 'e', kind: 'end', label: 'The purchase request is closed and archived' },
]

export const LONG_CONNECTIONS: DiagramConnection[] = [
  { id: 'x1', from: 's', to: 'a' },
  { id: 'x2', from: 'a', to: 'g' },
  {
    id: 'x3',
    from: 'g',
    to: 'b',
    label: 'Yes, within the budget and the supplier is approved',
    isDefault: true,
  },
  { id: 'x4', from: 'g', to: 'c', label: 'No, or the supplier is new' },
  { id: 'x5', from: 'b', to: 'e' },
  { id: 'x6', from: 'c', to: 'e' },
]

// ── Arabic and Japanese ───────────────────────────────────────────────────────────────────────

export const ARABIC_STEPS: DiagramStep[] = [
  { id: 'received', kind: 'start', label: 'استلام الفاتورة' },
  { id: 'check', kind: 'user-task', label: 'مراجعة الفاتورة' },
  { id: 'amount', kind: 'exclusive', label: 'المبلغ' },
  { id: 'manager', kind: 'user-task', label: 'موافقة المدير' },
  { id: 'director', kind: 'user-task', label: 'موافقة المدير العام' },
  { id: 'post', kind: 'service-task', label: 'ترحيل الفاتورة' },
  { id: 'paid', kind: 'end', label: 'تم الدفع' },
]

export const ARABIC_CONNECTIONS: DiagramConnection[] = [
  { id: 'c1', from: 'received', to: 'check' },
  { id: 'c2', from: 'check', to: 'amount' },
  { id: 'c3', from: 'amount', to: 'manager', label: 'حتى 100.000 دينار', isDefault: true },
  { id: 'c4', from: 'amount', to: 'director', label: 'أكثر من 100.000 دينار' },
  { id: 'c5', from: 'manager', to: 'post' },
  { id: 'c6', from: 'director', to: 'post' },
  { id: 'c7', from: 'post', to: 'paid' },
]

export const JAPANESE_STEPS: DiagramStep[] = [
  { id: 'received', kind: 'start', label: '請求書受領' },
  { id: 'check', kind: 'user-task', label: '請求書の確認' },
  { id: 'amount', kind: 'exclusive', label: '金額' },
  { id: 'manager', kind: 'user-task', label: '課長の承認' },
  { id: 'director', kind: 'user-task', label: '部長の承認' },
  { id: 'post', kind: 'service-task', label: '仕訳の計上' },
  { id: 'paid', kind: 'end', label: '支払済み' },
]

export const JAPANESE_CONNECTIONS: DiagramConnection[] = [
  { id: 'c1', from: 'received', to: 'check' },
  { id: 'c2', from: 'check', to: 'amount' },
  { id: 'c3', from: 'amount', to: 'manager', label: '10万円以下', isDefault: true },
  { id: 'c4', from: 'amount', to: 'director', label: '10万円超' },
  { id: 'c5', from: 'manager', to: 'post' },
  { id: 'c6', from: 'director', to: 'post' },
  { id: 'c7', from: 'post', to: 'paid' },
]

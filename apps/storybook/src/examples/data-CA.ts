/*
 * Group CA's example data (P5.86, case management): the AML cases of Knjigovodstvo Jelić on
 * 14 October 2026 — what each case is about, the client, who investigates, the alerts and the
 * screening matches linked to it, its documents, tasks, notes and history, and its decision (no
 * suspicion, or a report to the illustrative financial intelligence unit) with the four-eyes
 * approval: one person proposes, another approves, never the same. The states, the steps, the
 * reasons the application accepts and the totals are the application's; the screens and the
 * library decide nothing. Adria Commodities d.o.o.'s case grows out of the undecided sanctions
 * match SH-2026-0413 (data-BY) and alert TM-2026-0218 (data-BZ). Every person, case and figure
 * is invented. Not part of the package. No classes here.
 */
import type { Attachment, ConfirmReason, HistoryEntry, Tone } from '@veljaos/ui'
import { amlAt, AML_DEPUTY, AML_OFFICER } from './data-aml'
import type { MonitoringAlert } from './data-BZ'

export const CA_ROUTES = {
  /** The cases (ListPage). */
  cases: '/aml/cases',
  /** The list on its "Closed" view. */
  casesClosed: '/aml/cases?view=closed',
  /** One case (DocumentPage). */
  case: (id: string) => `/aml/cases/${id}`,
  /** A case with a decision asked (the proposal's dialog open). */
  caseDecide: (id: string, outcome: 'no-suspicion' | 'report') =>
    `/aml/cases/${id}?decide=${outcome}`,
} as const

export type CaseState =
  'Under investigation' | 'Decision proposed' | 'Approved' | 'Closed' | 'Reported'

export const CASE_TONES: Record<CaseState, Tone> = {
  'Under investigation': 'warning',
  'Decision proposed': 'info',
  Approved: 'info',
  Closed: 'neutral',
  Reported: 'danger',
}

export type CaseOutcome = 'No suspicion' | 'Report to the authority'

/** One task of the investigation, in the application's words. */
export interface CaseTask {
  id: string
  title: string
  description?: string
  state: 'done' | 'todo' | 'blocked'
  owner: string
  /** Why a blocked task waits. */
  blockedReason?: string
  /** A done task's note: who and when. */
  doneNote?: string
}

export interface CaseNote {
  key: string
  author: string
  /** An ISO instant in the tenant's offset. */
  at: string
  text: string
}

/** The decision as proposed and, after the four eyes, approved or declined. */
export interface CaseDecision {
  outcome: CaseOutcome
  reason: string
  details: string
  proposedBy: string
  proposedAt: string
  /** The second pair of eyes: who approves (never the proposer), from the application. */
  approver: string
  approvedAt?: string
  /** Declined back to the investigation, with the reason. */
  declinedAt?: string
  declineReason?: string
}

export interface AmlCase {
  id: string
  clientId: string
  title: string
  /** When and by whom the case was opened. */
  opened: string
  openedBy: string
  /** Who investigates. */
  assignee: string
  state: CaseState
  /** What the case is about, in the application's words. */
  summary: string
  /** The alerts escalated into the case (data-BZ). */
  alertIds: readonly string[]
  /** The screening matches reviewed with it (data-BY). */
  hitIds: readonly string[]
  /** The total of the transactions under review, as the application gives it. */
  transactionsTotal: { amount: string; currency: string }
  documents: readonly Attachment[]
  tasks: readonly CaseTask[]
  notes: readonly CaseNote[]
  history: readonly HistoryEntry[]
  /** When the case reached each of its states: an ISO instant, or undefined. */
  reached: Partial<Record<CaseState | 'Opened', string>>
  decision?: CaseDecision
  /** The report made from the case (data-CB). */
  reportId?: string
}

/** The case's states in order, for the timeline and the lifecycle bar. */
export const CASE_STEPS: readonly { key: CaseState | 'Opened'; label: string }[] = [
  { key: 'Opened', label: 'Opened' },
  { key: 'Under investigation', label: 'Under investigation' },
  { key: 'Decision proposed', label: 'Decision proposed' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Closed', label: 'Closed' },
]

/** The index of the case's current step; a closed or reported case is at the last. */
export function caseStep(state: CaseState): number {
  if (state === 'Closed' || state === 'Reported') return CASE_STEPS.length - 1
  return CASE_STEPS.findIndex((step) => step.key === state)
}

/** The last step's name by the outcome, in the application's words. */
export function lastStepLabel(decision: CaseDecision | undefined, state: CaseState): string {
  if (state === 'Reported') return 'Reported'
  if (decision?.outcome === 'Report to the authority') return 'Reported'
  if (state === 'Closed') return 'Closed, no suspicion'
  return 'Closed'
}

/** The four-eyes rule, in the application's words. */
export const FOUR_EYES =
  'Four-eyes rule: one person proposes the decision and another approves it. The person who proposed cannot approve.'

/** The reasons the application accepts for each outcome. */
export const NO_SUSPICION_REASONS: readonly ConfirmReason[] = [
  { value: 'business', label: 'Explained by the client’s business and documented' },
  { value: 'funds', label: 'Source of funds documented' },
  { value: 'match', label: 'The screening match was a false positive' },
  { value: 'other', label: 'Another reason, in the details' },
]

export const REPORT_REASONS: readonly ConfirmReason[] = [
  { value: 'pattern', label: 'Pattern of transactions not explained' },
  { value: 'listed', label: 'Link to a listed entity not ruled out' },
  { value: 'owners', label: 'Beneficial owners not disclosed' },
  { value: 'documents', label: 'The client did not give the documents asked for' },
  { value: 'other', label: 'Another reason, in the details' },
]

/** The reasons the application accepts for declining a proposed decision. */
export const DECLINE_REASONS: readonly ConfirmReason[] = [
  { value: 'more', label: 'More investigation needed' },
  { value: 'reasoning', label: 'The reasoning does not support the outcome' },
  { value: 'other', label: 'Another reason, in the details' },
]

function entry(
  id: string,
  at: string,
  actor: string,
  text: string,
  changes?: HistoryEntry['changes'],
): HistoryEntry {
  return {
    id,
    at,
    actor: actor === 'Liro' ? { name: 'Liro', kind: 'system' } : { name: actor },
    text,
    ...(changes === undefined ? {} : { changes }),
  }
}

function file(
  id: string,
  name: string,
  sizeText: string,
  detail: string,
  flag?: string,
): Attachment {
  return {
    id,
    name,
    sizeText,
    state: 'available',
    detail,
    ...(flag === undefined ? {} : { flag: { label: flag, tone: 'neutral' } }),
  }
}

export const AML_CASES: readonly AmlCase[] = [
  {
    id: 'CM-2026-0007',
    clientId: 'adria',
    title: 'Owner’s possible sanctions match and round payments to a new counterparty',
    opened: amlAt('2026-10-14', '08:30'),
    openedBy: AML_OFFICER.name,
    assignee: AML_DEPUTY.name,
    state: 'Approved',
    summary:
      'The client’s owner, Meridian Trade Holdings Ltd, is a potential match on the Illustrative sanctions list (score 82, SH-2026-0413) while the client pays round amounts to Balkan Scrap Trade d.o.o., a counterparty first paid two weeks earlier, for deliveries the books do not show.',
    alertIds: ['TM-2026-0218'],
    hitIds: ['SH-2026-0413'],
    transactionsTotal: { amount: '9800000.00', currency: 'RSD' },
    documents: [
      file(
        'cm7-d1',
        'Bank statements 09-2026.pdf',
        '1,2 MB',
        'Added by Marko Jelić, 14.10.2026 08:50',
        'From the client’s books',
      ),
      file(
        'cm7-d2',
        'Bank statements 10-2026 to 13.10.pdf',
        '640 KB',
        'Added by Marko Jelić, 14.10.2026 08:52',
        'From the client’s books',
      ),
      file(
        'cm7-d3',
        'Contract 14-2026 Balkan Scrap Trade.pdf',
        '410 KB',
        'Added by Marko Jelić, 14.10.2026 09:05',
        'From the client’s books',
      ),
      file(
        'cm7-d4',
        'Screening match SH-2026-0413.pdf',
        '96 KB',
        'Made by Liro on 14.10.2026 08:31',
      ),
    ],
    tasks: [
      {
        id: 'cm7-t1',
        title: 'Attach the screening match and alert TM-2026-0218',
        state: 'done',
        owner: AML_OFFICER.name,
        doneNote: 'Snežana Jelić, 14.10.2026 08:31',
      },
      {
        id: 'cm7-t2',
        title: 'Collect the bank statements for September and October',
        state: 'done',
        owner: AML_DEPUTY.name,
        doneNote: 'Marko Jelić, 14.10.2026 08:52',
      },
      {
        id: 'cm7-t3',
        title: 'Match the payments to Balkan Scrap Trade d.o.o. with deliveries in the books',
        description:
          'Contract 14/2026 names 120 t of scrap; no delivery note or stock receipt was booked.',
        state: 'done',
        owner: AML_DEPUTY.name,
        doneNote: 'Marko Jelić, 14.10.2026 09:15',
      },
      {
        id: 'cm7-t4',
        title: 'Ask Meridian Trade Holdings Ltd for the statement on its owners',
        state: 'blocked',
        owner: AML_OFFICER.name,
        blockedReason: 'Waits for the report: asking the holding now could tell the client.',
      },
    ],
    notes: [
      {
        key: 'cm7-n2',
        author: AML_DEPUTY.name,
        at: amlAt('2026-10-14', '09:20'),
        text: 'Proposed: report. The owner’s match is not ruled out, and the 9.800.000,00 RSD paid to Balkan Scrap Trade d.o.o. match no delivery in the books.',
      },
      {
        key: 'cm7-n1',
        author: AML_OFFICER.name,
        at: amlAt('2026-10-14', '08:35'),
        text: 'Opened from the screening match SH-2026-0413 and alert TM-2026-0218. Marko investigates; I approve.',
      },
    ],
    history: [
      entry(
        'cm7-h4',
        amlAt('2026-10-14', '09:35'),
        AML_OFFICER.name,
        'Decision approved: report to the illustrative financial intelligence unit. Report STR-2026-0003 opened as a draft.',
        [{ field: 'State', from: 'Decision proposed', to: 'Approved' }],
      ),
      entry(
        'cm7-h3',
        amlAt('2026-10-14', '09:20'),
        AML_DEPUTY.name,
        'Decision proposed: report to the authority (link to a listed entity not ruled out).',
        [{ field: 'State', from: 'Under investigation', to: 'Decision proposed' }],
      ),
      entry(
        'cm7-h2',
        amlAt('2026-10-14', '08:31'),
        AML_OFFICER.name,
        'Linked alert TM-2026-0218 and screening match SH-2026-0413.',
      ),
      entry(
        'cm7-h1',
        amlAt('2026-10-14', '08:30'),
        AML_OFFICER.name,
        'Case opened; assigned to Marko Jelić.',
        [{ field: 'State', to: 'Under investigation' }],
      ),
    ],
    reached: {
      Opened: amlAt('2026-10-14', '08:30'),
      'Under investigation': amlAt('2026-10-14', '08:30'),
      'Decision proposed': amlAt('2026-10-14', '09:20'),
      Approved: amlAt('2026-10-14', '09:35'),
    },
    decision: {
      outcome: 'Report to the authority',
      reason: 'Link to a listed entity not ruled out',
      details:
        'The owner’s name, country and line of business match the listed entity; the registration number differs, which a front company would arrange. The payments to Balkan Scrap Trade d.o.o. have no delivery behind them.',
      proposedBy: AML_DEPUTY.name,
      proposedAt: amlAt('2026-10-14', '09:20'),
      approver: AML_OFFICER.name,
      approvedAt: amlAt('2026-10-14', '09:35'),
    },
    reportId: 'STR-2026-0003',
  },
  {
    id: 'CM-2026-0006',
    clientId: 'drina',
    title: 'Funds received and paid on within two days',
    opened: amlAt('2026-10-08', '14:30'),
    openedBy: AML_DEPUTY.name,
    assignee: AML_DEPUTY.name,
    state: 'Decision proposed',
    summary:
      '3.200.000,00 RSD received from Trans Balkan Logistik d.o.o. on 05.10.2026 and 3.150.000,00 RSD paid to Autoprevoz Ilić the next day (alert TM-2026-0224).',
    alertIds: ['TM-2026-0224'],
    hitIds: [],
    transactionsTotal: { amount: '3200000.00', currency: 'RSD' },
    documents: [
      file(
        'cm6-d1',
        'Transport contract Trans Balkan Logistik 2026-07.pdf',
        '380 KB',
        'Added by Marko Jelić, 12.10.2026 10:20',
        'From the client’s books',
      ),
      file(
        'cm6-d2',
        'Subcontract Autoprevoz Ilić 2026-07.pdf',
        '290 KB',
        'Added by Marko Jelić, 12.10.2026 10:22',
        'From the client’s books',
      ),
      file(
        'cm6-d3',
        'CMR consignment notes, September.pdf',
        '2,1 MB',
        'Added by Marko Jelić, 13.10.2026 15:40',
        'From the client’s books',
      ),
    ],
    tasks: [
      {
        id: 'cm6-t1',
        title: 'Collect the contracts behind both invoices',
        state: 'done',
        owner: AML_DEPUTY.name,
        doneNote: 'Marko Jelić, 12.10.2026 10:22',
      },
      {
        id: 'cm6-t2',
        title: 'Check that the transports were carried out',
        description: 'The CMR notes name the goods, the route and the carrier.',
        state: 'done',
        owner: AML_DEPUTY.name,
        doneNote: 'Marko Jelić, 13.10.2026 15:40',
      },
      {
        id: 'cm6-t3',
        title: 'Approve or decline the proposed decision',
        state: 'todo',
        owner: AML_OFFICER.name,
      },
    ],
    notes: [
      {
        key: 'cm6-n1',
        author: AML_DEPUTY.name,
        at: amlAt('2026-10-13', '16:40'),
        text: 'Proposed: no suspicion. Trans Balkan Logistik d.o.o. ordered 14 transports that Drina Prevoz subcontracted to Autoprevoz Ilić; both contracts and the CMR notes are in the books, and the margin matches the earlier months.',
      },
    ],
    history: [
      entry(
        'cm6-h3',
        amlAt('2026-10-13', '16:40'),
        AML_DEPUTY.name,
        'Decision proposed: no suspicion (explained by the client’s business and documented).',
        [{ field: 'State', from: 'Under investigation', to: 'Decision proposed' }],
      ),
      entry(
        'cm6-h2',
        amlAt('2026-10-12', '10:22'),
        AML_DEPUTY.name,
        'Both contracts added from the client’s books.',
      ),
      entry(
        'cm6-h1',
        amlAt('2026-10-08', '14:30'),
        AML_DEPUTY.name,
        'Case opened from alert TM-2026-0224.',
        [{ field: 'State', to: 'Under investigation' }],
      ),
    ],
    reached: {
      Opened: amlAt('2026-10-08', '14:30'),
      'Under investigation': amlAt('2026-10-08', '14:30'),
      'Decision proposed': amlAt('2026-10-13', '16:40'),
    },
    decision: {
      outcome: 'No suspicion',
      reason: 'Explained by the client’s business and documented',
      details:
        'Fourteen transports ordered by Trans Balkan Logistik d.o.o. and subcontracted to Autoprevoz Ilić; contracts and CMR notes in the books.',
      proposedBy: AML_DEPUTY.name,
      proposedAt: amlAt('2026-10-13', '16:40'),
      approver: AML_OFFICER.name,
    },
  },
  {
    id: 'CM-2026-0005',
    clientId: 'fruska',
    title: 'Cash deposits just below the threshold',
    opened: amlAt('2026-08-26', '09:10'),
    openedBy: AML_OFFICER.name,
    assignee: AML_OFFICER.name,
    state: 'Closed',
    summary:
      'Five cash deposits between 470.000,00 and 495.000,00 RSD in three days of August (alert TM-2026-0197).',
    alertIds: ['TM-2026-0197'],
    hitIds: [],
    transactionsTotal: { amount: '2415000.00', currency: 'RSD' },
    documents: [
      file(
        'cm5-d1',
        'Daily takings reports, August.pdf',
        '1,8 MB',
        'Added by Snežana Jelić, 02.09.2026 11:00',
        'From the client’s books',
      ),
      file(
        'cm5-d2',
        'Fiscal journal 15–17.08.2026.pdf',
        '920 KB',
        'Added by Snežana Jelić, 02.09.2026 11:05',
        'From the client’s books',
      ),
    ],
    tasks: [
      {
        id: 'cm5-t1',
        title: 'Compare the deposits with the restaurant’s fiscal journal',
        state: 'done',
        owner: AML_OFFICER.name,
        doneNote: 'Snežana Jelić, 02.09.2026 11:30',
      },
    ],
    notes: [
      {
        key: 'cm5-n1',
        author: AML_OFFICER.name,
        at: amlAt('2026-09-29', '13:15'),
        text: 'Proposed: no suspicion. The deposits are the weekend takings of the hotel’s restaurant during the wine festival; the fiscal journal shows the same amounts.',
      },
    ],
    history: [
      entry(
        'cm5-h3',
        amlAt('2026-09-30', '09:05'),
        AML_DEPUTY.name,
        'Decision approved: no suspicion. Case closed.',
        [{ field: 'State', from: 'Decision proposed', to: 'Closed' }],
      ),
      entry(
        'cm5-h2',
        amlAt('2026-09-29', '13:15'),
        AML_OFFICER.name,
        'Decision proposed: no suspicion (explained by the client’s business and documented).',
        [{ field: 'State', from: 'Under investigation', to: 'Decision proposed' }],
      ),
      entry(
        'cm5-h1',
        amlAt('2026-08-26', '09:10'),
        AML_OFFICER.name,
        'Case opened from alert TM-2026-0197.',
        [{ field: 'State', to: 'Under investigation' }],
      ),
    ],
    reached: {
      Opened: amlAt('2026-08-26', '09:10'),
      'Under investigation': amlAt('2026-08-26', '09:10'),
      'Decision proposed': amlAt('2026-09-29', '13:15'),
      Approved: amlAt('2026-09-30', '09:05'),
      Closed: amlAt('2026-09-30', '09:05'),
    },
    decision: {
      outcome: 'No suspicion',
      reason: 'Explained by the client’s business and documented',
      details:
        'Weekend takings of the restaurant during the wine festival, matched to the fiscal journal.',
      proposedBy: AML_OFFICER.name,
      proposedAt: amlAt('2026-09-29', '13:15'),
      approver: AML_DEPUTY.name,
      approvedAt: amlAt('2026-09-30', '09:05'),
    },
  },
]

export function amlCase(id: string): AmlCase {
  const found = AML_CASES.find((each) => each.id === id)
  if (found === undefined) throw new Error(`No case ${id}`)
  return found
}

/** The number of the next case the application opens (after the ones it holds). */
export function nextCaseId(cases: readonly AmlCase[]): string {
  const last = cases
    .map((each) => Number(each.id.slice('CM-2026-'.length)))
    .reduce((max, each) => Math.max(max, each), 0)
  return `CM-2026-${String(last + 1).padStart(4, '0')}`
}

/** The case the application opens when an alert is escalated into a new one. */
export function caseFromAlert(
  alert: MonitoringAlert,
  spec: { id: string; title: string; at: string; by: string; reason: string; details: string },
): AmlCase {
  return {
    id: spec.id,
    clientId: alert.clientId,
    title: spec.title,
    opened: spec.at,
    openedBy: spec.by,
    assignee: spec.by,
    state: 'Under investigation',
    summary: `${alert.summary} Escalated from alert ${alert.id}: ${spec.reason.toLocaleLowerCase('en')}.${spec.details === '' ? '' : ` ${spec.details}`}`,
    alertIds: [alert.id],
    hitIds: [],
    transactionsTotal: { amount: alert.amount, currency: alert.currency },
    documents: [],
    tasks: [
      {
        id: `${spec.id}-t1`,
        title: 'Collect the bank statements of the period',
        state: 'todo',
        owner: spec.by,
      },
      {
        id: `${spec.id}-t2`,
        title: 'Match the transactions with the documents in the books',
        state: 'todo',
        owner: spec.by,
      },
    ],
    notes: [],
    history: [
      entry(
        `${spec.id}-h1`,
        spec.at,
        spec.by,
        `Case opened from alert ${alert.id} (${spec.reason.toLocaleLowerCase('en')}).`,
        [{ field: 'State', to: 'Under investigation' }],
      ),
    ],
    reached: { Opened: spec.at, 'Under investigation': spec.at },
  }
}

/** An open case with an alert added to it. */
export function withAlert(found: AmlCase, alert: MonitoringAlert, at: string, by: string): AmlCase {
  return {
    ...found,
    alertIds: [...found.alertIds, alert.id],
    history: [
      entry(`${found.id}-alert-${alert.id}`, at, by, `Alert ${alert.id} added to the case.`),
      ...found.history,
    ],
  }
}

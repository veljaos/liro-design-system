/*
 * Group CC's example data (P5.88, the AML overview and obligations): what Knjigovodstvo Jelić's
 * compliance officer sees first on 14 October 2026 — the figures over all 214 clients (by risk,
 * reviews due, open alerts and cases, ageing) as the application counts them, the compliance
 * officer and deputy with their appointments, the staff's training records, the internal
 * procedures as documents with their review dates, the retention of records and the audit trail
 * of the module. Every figure, state, period and entry is the application's; the screens and the
 * library count and judge nothing. Everything is invented and labelled illustrative where it
 * imitates a real obligation. Not part of the package. No classes here.
 */
import type { Attachment, HistoryEntry, SetupStep, Tone } from '@veljaos/ui'
import type { ChartCategory, ChartValues, PieSlice } from '../../../../packages/ui/src/charts'
import { amlAt, AML_DEPUTY, AML_OFFICER, AML_STAFF, type AmlRisk } from './data-aml'

export const CC_ROUTES = {
  /** The overview (DashboardPage). */
  overview: '/aml/overview',
  /** The overview while the application still loads the figures. */
  overviewLoading: '/aml/overview?loading=1',
  /** The obligations: officer and deputy, training, procedures, retention, the audit trail. */
  obligations: '/aml/obligations',
} as const

// ── Figures over all clients, as the application counts them ──────────────────────────────────

export const OVERVIEW_FIGURES = {
  clients: '214',
  byRisk: { High: '9', Medium: '61', Low: '144' } satisfies Record<AmlRisk, string>,
  reviewsDue: '17',
  reviewsOverdue: '12',
  /** Alerts and cases older than seven days, as the application counts them. */
  alertsOver7Days: '2',
  reportsThisYear: '3',
  reportsLastYear: '1',
}

/** The clients by risk, for the donut: the state's tone, never colour alone (the legend names it). */
export const RISK_SLICES: readonly PieSlice[] = [
  {
    key: 'high',
    label: 'High risk',
    value: OVERVIEW_FIGURES.byRisk.High,
    share: '4,2 %',
    tone: 'danger',
  },
  {
    key: 'medium',
    label: 'Medium risk',
    value: OVERVIEW_FIGURES.byRisk.Medium,
    share: '28,5 %',
    tone: 'warning',
  },
  {
    key: 'low',
    label: 'Low risk',
    value: OVERVIEW_FIGURES.byRisk.Low,
    share: '67,3 %',
    tone: 'success',
  },
]

/** Reviews due by month, the overdue ones first. */
export const REVIEWS_DUE: { categories: readonly ChartCategory[]; values: ChartValues } = {
  categories: [
    { key: 'overdue', label: 'Overdue' },
    { key: 'oct', label: 'Oct' },
    { key: 'nov', label: 'Nov' },
    { key: 'dec', label: 'Dec' },
    { key: 'jan', label: 'Jan' },
    { key: 'feb', label: 'Feb' },
    { key: 'mar', label: 'Mar' },
  ],
  values: {
    reviews: { overdue: '12', oct: '5', nov: '8', dec: '3', jan: '6', feb: '4', mar: '9' },
  },
}

/** Open alerts and cases by age. */
export const AGEING: { categories: readonly ChartCategory[]; values: ChartValues } = {
  categories: [
    { key: 'd7', label: '0–7 days' },
    { key: 'd30', label: '8–30 days' },
    { key: 'd90', label: '31–90 days' },
    { key: 'd90plus', label: 'Over 90 days' },
  ],
  values: {
    alerts: { d7: '4', d30: '1', d90: '0', d90plus: '0' },
    cases: { d7: '2', d30: '0', d90: '0', d90plus: '0' },
  },
}

/** Alerts raised and closed in the last six months. */
export const ALERTS_BY_MONTH: { categories: readonly ChartCategory[]; values: ChartValues } = {
  categories: [
    { key: 'may', label: 'May' },
    { key: 'jun', label: 'Jun' },
    { key: 'jul', label: 'Jul' },
    { key: 'aug', label: 'Aug' },
    { key: 'sep', label: 'Sep' },
    { key: 'oct', label: 'Oct' },
  ],
  values: {
    raised: { may: '14', jun: '11', jul: '9', aug: '16', sep: '13', oct: '8' },
    closed: { may: '13', jun: '12', jul: '9', aug: '14', sep: '12', oct: '3' },
  },
}

// ── The compliance officer and deputy ─────────────────────────────────────────────────────────

export const APPOINTMENTS = {
  officer: {
    ...AML_OFFICER,
    appointed: '2021-04-01',
    decision: 'Decision 03/2021 of the firm’s director',
    registered: '2021-04-09',
  },
  deputy: {
    ...AML_DEPUTY,
    appointed: '2023-09-01',
    decision: 'Decision 07/2023 of the firm’s director',
    registered: '2023-09-12',
  },
  /** Who the firm told about the appointments, in the application's words. */
  registeredWith: 'Reported to the illustrative financial intelligence unit',
}

// ── Training ──────────────────────────────────────────────────────────────────────────────────

export type TrainingState = 'Done' | 'Due' | 'Overdue'

export const TRAINING_TONES: Record<TrainingState, Tone> = {
  Done: 'success',
  Due: 'warning',
  Overdue: 'danger',
}

export interface TrainingRecord {
  id: string
  person: string
  role: string
  /** The last training, YYYY-MM-DD; null when none. */
  last: string | null
  topic: string
  /** When the next one is due, YYYY-MM-DD. */
  nextDue: string
  state: TrainingState
  /** The certificate or attendance record. */
  record: string
}

/** The accountant of AML_STAFF (data-aml) whose training is overdue. */
const ACCOUNTANT = AML_STAFF.find((each) => each.id === 'ivana') ?? AML_DEPUTY

export const TRAINING: readonly TrainingRecord[] = [
  {
    id: 'tr-1',
    person: AML_OFFICER.name,
    role: AML_OFFICER.role,
    last: '2026-02-12',
    topic: 'Annual AML training for compliance officers (illustrative chamber)',
    nextDue: '2027-02-12',
    state: 'Done',
    record: 'Certificate 2026/118',
  },
  {
    id: 'tr-2',
    person: AML_DEPUTY.name,
    role: AML_DEPUTY.role,
    last: '2026-02-12',
    topic: 'Annual AML training for compliance officers (illustrative chamber)',
    nextDue: '2027-02-12',
    state: 'Done',
    record: 'Certificate 2026/119',
  },
  {
    id: 'tr-3',
    person: ACCOUNTANT.name,
    role: ACCOUNTANT.role,
    last: '2025-09-30',
    topic: 'Recognising unusual transactions (internal)',
    nextDue: '2026-09-30',
    state: 'Overdue',
    record: 'Attendance list 2025-09',
  },
  {
    id: 'tr-4',
    person: 'Jelena Radić',
    role: 'Accountant (joined 01.09.2026)',
    last: null,
    topic: 'Introduction to the firm’s AML procedure (internal)',
    nextDue: '2026-11-30',
    state: 'Due',
    record: '—',
  },
]

// ── Procedures ────────────────────────────────────────────────────────────────────────────────

export const PROCEDURES: readonly Attachment[] = [
  {
    id: 'procedure-1',
    name: 'AML procedure of Knjigovodstvo Jelić, version 2026-01.pdf',
    sizeText: '640 KB',
    state: 'available',
    detail: 'Adopted 15.01.2026 · next review 15.01.2027',
  },
  {
    id: 'procedure-2',
    name: 'Illustrative risk matrix, version 2026-01.pdf',
    sizeText: '210 KB',
    state: 'available',
    detail: 'Adopted 15.01.2026 · next review 15.01.2027',
  },
  {
    id: 'procedure-3',
    name: 'Client acceptance policy, version 2024-02.pdf',
    sizeText: '180 KB',
    state: 'available',
    detail: 'Adopted 20.11.2024 · review was due 20.11.2025',
    flag: { label: 'Review due', tone: 'warning' },
  },
  {
    id: 'procedure-4',
    name: 'Record keeping and retention rules, version 2025-01.pdf',
    sizeText: '150 KB',
    state: 'available',
    detail: 'Adopted 10.03.2025 · next review 10.03.2027',
  },
  {
    id: 'procedure-5',
    name: 'Internal audit report 2025.pdf',
    sizeText: '920 KB',
    state: 'available',
    detail: 'Made 20.12.2025 by Marko Jelić; two findings closed',
  },
]

// ── Retention ─────────────────────────────────────────────────────────────────────────────────

export interface RetentionRule {
  id: string
  /** What is kept. */
  records: string
  /** How long, in the application's words. */
  period: string
  /** From when the period runs. */
  from: string
}

export const RETENTION: readonly RetentionRule[] = [
  {
    id: 'rt-1',
    records: 'Client files: identification, documents, beneficial owners, risk assessments',
    period: '10 years',
    from: 'The end of the business relationship',
  },
  {
    id: 'rt-2',
    records: 'Transaction records and monitoring alerts',
    period: '10 years',
    from: 'The transaction',
  },
  {
    id: 'rt-3',
    records: 'Cases and reports to the authority',
    period: '10 years',
    from: 'The report, or the case’s closing',
  },
  {
    id: 'rt-4',
    records: 'Training records',
    period: '5 years',
    from: 'The training',
  },
]

/** Records whose retention period ends, as the application finds them. */
export interface RetentionDue {
  id: string
  records: string
  /** The former client. */
  client: string
  /** When the period ends, YYYY-MM-DD. */
  until: string
  /** The application's word: what happens then. */
  then: string
}

export const RETENTION_DUE: readonly RetentionDue[] = [
  {
    id: 'rd-1',
    records: 'Client file',
    client: 'Beograd Print d.o.o. (relationship ended 30.11.2016)',
    until: '2026-11-30',
    then: 'Proposed for disposal; the compliance officer confirms',
  },
  {
    id: 'rd-2',
    records: 'Client file',
    client: 'Vuković Trans SZR (relationship ended 31.01.2017)',
    until: '2027-01-31',
    then: 'Proposed for disposal in January 2027',
  },
]

// ── Obligations this year ─────────────────────────────────────────────────────────────────────

export const OBLIGATIONS: readonly SetupStep[] = [
  {
    id: 'ob-1',
    title: 'Review the AML procedure and the risk matrix',
    state: 'done',
    doneNote: 'Done 15.01.2026 by Snežana Jelić · version 2026-01 adopted',
  },
  {
    id: 'ob-2',
    title: 'Annual training of the compliance officer and deputy',
    state: 'done',
    doneNote: 'Done 12.02.2026 · certificates 2026/118 and 2026/119',
  },
  {
    id: 'ob-3',
    title: 'Train every accountant who works with clients',
    description: '2 of 4 trained this year.',
    state: 'todo',
    action: { label: 'Training records', href: '#/aml/obligations' },
  },
  {
    id: 'ob-4',
    title: 'Review the client acceptance policy',
    state: 'blocked',
    blockedReason: 'Review was due 20.11.2025; waits for the new illustrative guidance.',
  },
  {
    id: 'ob-5',
    title: 'Internal audit of the AML system for 2026',
    description: 'Due by 31.12.2026.',
    state: 'todo',
    action: { label: 'Open the 2025 report', href: '#/aml/obligations' },
  },
]

// ── The audit trail ───────────────────────────────────────────────────────────────────────────

function audit(id: string, at: string, actor: string, text: string, system = false): HistoryEntry {
  return {
    id,
    at,
    actor: system ? { name: actor, kind: 'system' } : { name: actor },
    text,
  }
}

/** The module's audit trail, newest first: every change and every reading of a sensitive value. */
export const AUDIT_TRAIL: readonly HistoryEntry[] = [
  audit(
    'au-01',
    amlAt('2026-10-14', '09:36'),
    'Marko Jelić',
    'Report STR-2026-0003 opened as a draft from case CM-2026-0007.',
  ),
  audit(
    'au-02',
    amlAt('2026-10-14', '09:35'),
    'Snežana Jelić',
    'Case CM-2026-0007: decision approved (report to the authority).',
  ),
  audit(
    'au-03',
    amlAt('2026-10-14', '09:20'),
    'Marko Jelić',
    'Case CM-2026-0007: decision proposed (report to the authority).',
  ),
  audit(
    'au-04',
    amlAt('2026-10-14', '09:05'),
    'Marko Jelić',
    'Case CM-2026-0007: document “Contract 14-2026 Balkan Scrap Trade.pdf” added.',
  ),
  audit(
    'au-05',
    amlAt('2026-10-14', '08:52'),
    'Marko Jelić',
    'Case CM-2026-0007: bank statements for September and October added.',
  ),
  audit(
    'au-06',
    amlAt('2026-10-14', '08:30'),
    'Snežana Jelić',
    'Case CM-2026-0007 opened from screening match SH-2026-0413 and alert TM-2026-0218.',
  ),
  audit(
    'au-07',
    amlAt('2026-10-14', '08:12'),
    'Snežana Jelić',
    'Client file Kvadrat Gradnja d.o.o.: national ID number of Nenad Kovačević shown (periodic review of the client file).',
  ),
  audit(
    'au-08',
    amlAt('2026-10-14', '06:10'),
    'Liro monitoring',
    'Alert TM-2026-0231 raised (Adria Commodities d.o.o., payments to a country outside the client’s profile).',
    true,
  ),
  audit(
    'au-09',
    amlAt('2026-10-14', '06:00'),
    'Liro screening',
    'All clients screened after the Illustrative sanctions list update 2026/41: 3 potential matches.',
    true,
  ),
  audit(
    'au-10',
    amlAt('2026-10-13', '16:40'),
    'Marko Jelić',
    'Case CM-2026-0006: decision proposed (no suspicion).',
  ),
  audit(
    'au-11',
    amlAt('2026-10-13', '22:00'),
    'Liro',
    'Illustrative sanctions list update 2026/41 and Illustrative watch list update 2026/41 loaded.',
    true,
  ),
  audit(
    'au-12',
    amlAt('2026-10-12', '08:45'),
    'Snežana Jelić',
    'Alert TM-2026-0231 assigned to Snežana Jelić.',
  ),
  audit(
    'au-13',
    amlAt('2026-10-09', '11:25'),
    'Marko Jelić',
    'Screening match SH-2026-0410 decided: false positive (different date of birth).',
  ),
  audit(
    'au-14',
    amlAt('2026-10-09', '09:00'),
    'Snežana Jelić',
    'Alert TM-2026-0228 assigned to Marko Jelić.',
  ),
  audit(
    'au-15',
    amlAt('2026-10-08', '14:30'),
    'Marko Jelić',
    'Alert TM-2026-0224 escalated to case CM-2026-0006.',
  ),
  audit(
    'au-16',
    amlAt('2026-10-08', '11:20'),
    'Marko Jelić',
    'Alert TM-2026-0215 closed (explained by the client’s business).',
  ),
  audit(
    'au-17',
    amlAt('2026-10-03', '10:05'),
    'Snežana Jelić',
    'Alert TM-2026-0210 closed (source of funds documented); the profile of Medic Lab Niš d.o.o. updated.',
  ),
  audit(
    'au-18',
    amlAt('2026-09-30', '16:10'),
    'Snežana Jelić',
    'Client Adria Commodities d.o.o.: risk overridden Medium → High (ownership not fully known).',
  ),
  audit(
    'au-19',
    amlAt('2026-09-30', '15:40'),
    'Marko Jelić',
    'Client Adria Commodities d.o.o.: first risk assessment, Medium (55 points).',
  ),
  audit(
    'au-20',
    amlAt('2026-09-30', '09:05'),
    'Marko Jelić',
    'Case CM-2026-0005: decision approved (no suspicion); case closed.',
  ),
]

/** Older entries the application pages in after "Show more". */
export const AUDIT_TRAIL_OLDER: readonly HistoryEntry[] = [
  audit(
    'au-21',
    amlAt('2026-09-29', '13:15'),
    'Snežana Jelić',
    'Case CM-2026-0005: decision proposed (no suspicion).',
  ),
  audit(
    'au-22',
    amlAt('2026-09-28', '09:15'),
    'Snežana Jelić',
    'Alert TM-2026-0218 assigned to Snežana Jelić.',
  ),
  audit(
    'au-23',
    amlAt('2026-09-26', '06:05'),
    'Liro monitoring',
    'Alert TM-2026-0215 raised (Stanić Elektro STR, transaction out of line with the expected activity).',
    true,
  ),
  audit(
    'au-24',
    amlAt('2026-09-06', '06:00'),
    'Liro',
    'Client file Stanić Elektro STR: the ID card of Milan Stanić expired; the file needs a valid document.',
    true,
  ),
  audit(
    'au-25',
    amlAt('2026-08-26', '09:10'),
    'Snežana Jelić',
    'Case CM-2026-0005 opened from alert TM-2026-0197.',
  ),
  audit(
    'au-26',
    amlAt('2026-08-25', '13:15'),
    'Marko Jelić',
    'Client Adria Commodities d.o.o. taken on; the director identified by video.',
  ),
]

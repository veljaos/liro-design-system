/*
 * Group CB's example data (P5.87, the suspicious transaction report): the reports Knjigovodstvo
 * Jelić makes to the illustrative financial intelligence unit, and the form the authority asks
 * for, kept by the application as field definitions (JSON) and drawn by DefinedForm (P5.66). The
 * form's sections, fields, options, indicator codes and conditions are the application's, as
 * invented here and labelled illustrative; the design system draws the form and the states
 * around it (draft, in review, approved, submitted, acknowledged) and the record of what was
 * sent and when. STR-2026-0003 grows out of case CM-2026-0007 (data-CA) on Adria Commodities
 * d.o.o.; the two earlier reports concern former clients. Nothing here decides or sends anything.
 * Every person, reference and figure is invented. Not part of the package. No classes here.
 */
import type { DefinedSection, DefinedValues, HistoryEntry, Tone } from '@veljaos/ui'
import { amlAt, amlClient, AML_AUTHORITY, AML_DEPUTY, AML_FIRM, AML_OFFICER } from './data-aml'
import type { AmlCase } from './data-CA'

export const CB_ROUTES = {
  /** The reports (ListPage). */
  reports: '/aml/reports',
  /** One report: the form and its states. */
  report: (id: string) => `/aml/reports/${id}`,
  /** A report opened in a later state (the examples' starting points). */
  reportAt: (id: string, state: 'review' | 'approved' | 'submitted' | 'missing') =>
    `/aml/reports/${id}?state=${state}`,
} as const

export type ReportState = 'Draft' | 'In review' | 'Approved' | 'Submitted' | 'Acknowledged'

export const REPORT_TONES: Record<ReportState, Tone> = {
  Draft: 'neutral',
  'In review': 'info',
  Approved: 'info',
  Submitted: 'warning',
  Acknowledged: 'success',
}

/** The report's states in order. */
export const REPORT_STEPS: readonly { key: ReportState; label: string }[] = [
  { key: 'Draft', label: 'Draft' },
  { key: 'In review', label: 'In review' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Acknowledged', label: 'Acknowledged' },
]

export function reportStep(state: ReportState): number {
  return REPORT_STEPS.findIndex((step) => step.key === state)
}

/** What the application recorded when the report was sent. */
export interface ReportSubmission {
  at: string
  by: string
  /** How it went: the authority's channel, in the application's words. */
  channel: string
  /** The reference the channel returned. */
  reference: string
  acknowledgedAt?: string
  /** The authority's own reference, when it acknowledged. */
  acknowledgement?: string
  /** What was sent, as kept. */
  files: readonly { id: string; name: string; sizeText: string }[]
}

export interface AmlReport {
  id: string
  caseId: string
  /** The AML client, when it still is one; else the former client's name. */
  clientId?: string
  clientName: string
  state: ReportState
  created: string
  createdBy: string
  /** Who reviews and approves (never the one who prepared it). */
  reviewer: string
  values: DefinedValues
  /** When the report reached each state. */
  reached: Partial<Record<ReportState, string>>
  submission?: ReportSubmission
  history: readonly HistoryEntry[]
}

// ── The authority's form, as the application keeps it ────────────────────────────────────────

const COUNTRIES = [
  { value: 'RS', label: 'Serbia' },
  { value: 'ME', label: 'Montenegro' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'DE', label: 'Germany' },
  { value: 'other', label: 'Another country' },
]

/** The indicators of suspicion the illustrative authority lists, with their codes. */
export const INDICATORS = [
  { value: 'I-01', label: 'I-01 Transactions with a party on a sanctions list' },
  { value: 'I-04', label: 'I-04 Payments to a country outside the client’s profile' },
  { value: 'I-07', label: 'I-07 Round amounts to a new counterparty' },
  { value: 'I-09', label: 'I-09 Beneficial owners not disclosed' },
  { value: 'I-12', label: 'I-12 Cash deposits structured below the threshold' },
  { value: 'I-15', label: 'I-15 Funds received and paid on within two days' },
  { value: 'I-21', label: 'I-21 Documents asked for were not given' },
]

/**
 * The suspicious transaction report form of the illustrative financial intelligence unit, as the
 * application's field definitions (JSON). Illustrative throughout; the real form is the
 * authority's.
 */
export const REPORT_FORM: readonly DefinedSection[] = [
  {
    id: 'entity',
    title: 'Reporting entity',
    description: 'Filled in by the application from the firm’s record.',
    fields: [
      { id: 'entityName', type: 'text', label: 'Name', readOnly: true },
      { id: 'entityTaxId', type: 'text', label: 'Tax number', readOnly: true, direction: 'ltr' },
      { id: 'entityOfficer', type: 'text', label: 'Compliance officer', readOnly: true },
      { id: 'entityEmail', type: 'email', label: 'E-mail for the authority', readOnly: true },
    ],
  },
  {
    id: 'subject',
    title: 'Person reported',
    fields: [
      {
        id: 'subjectKind',
        type: 'radio',
        label: 'Kind of person',
        required: true,
        options: [
          { value: 'legal', label: 'Legal person' },
          { value: 'natural', label: 'Natural person' },
        ],
      },
      { id: 'subjectName', type: 'text', label: 'Name', required: true },
      {
        id: 'subjectTaxId',
        type: 'text',
        label: 'Tax number',
        required: true,
        direction: 'ltr',
        visibleWhen: { field: 'subjectKind', equals: 'legal' },
      },
      {
        id: 'subjectRegistration',
        type: 'text',
        label: 'Registration number',
        direction: 'ltr',
        visibleWhen: { field: 'subjectKind', equals: 'legal' },
      },
      {
        id: 'subjectBirth',
        type: 'date',
        label: 'Date of birth',
        required: true,
        visibleWhen: { field: 'subjectKind', equals: 'natural' },
      },
      {
        id: 'subjectNationalId',
        type: 'text',
        label: 'National ID number',
        direction: 'ltr',
        visibleWhen: { field: 'subjectKind', equals: 'natural' },
      },
      {
        id: 'subjectAddress',
        type: 'textarea',
        label: 'Address',
        rows: 2,
        required: true,
        fullWidth: true,
      },
      {
        id: 'subjectCountry',
        type: 'select',
        label: 'Country',
        required: true,
        options: COUNTRIES,
      },
      { id: 'subjectActivity', type: 'text', label: 'Activity' },
      {
        id: 'subjectRepresentative',
        type: 'text',
        label: 'Representative',
        visibleWhen: { field: 'subjectKind', equals: 'legal' },
      },
      {
        id: 'subjectOwners',
        type: 'textarea',
        label: 'Beneficial owners known to the reporting entity',
        rows: 3,
        fullWidth: true,
        visibleWhen: { field: 'subjectKind', equals: 'legal' },
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Transactions',
    fields: [
      { id: 'periodFrom', type: 'date', label: 'From', required: true },
      { id: 'periodTo', type: 'date', label: 'To', required: true },
      { id: 'transactionCount', type: 'number', label: 'Number of transactions', required: true },
      {
        id: 'transactionTotal',
        type: 'money',
        label: 'Total amount',
        required: true,
        currency: 'RSD',
      },
      {
        id: 'accounts',
        type: 'textarea',
        label: 'Accounts involved',
        rows: 2,
        fullWidth: true,
        description: 'Account numbers as the bank writes them; one per line.',
      },
      {
        id: 'transactionsDescription',
        type: 'textarea',
        label: 'Description of the transactions',
        rows: 4,
        required: true,
        fullWidth: true,
      },
    ],
  },
  {
    id: 'grounds',
    title: 'Grounds for suspicion',
    fields: [
      {
        id: 'indicators',
        type: 'multiselect',
        label: 'Indicators',
        required: true,
        fullWidth: true,
        description: 'The authority’s list of indicators (illustrative).',
        options: INDICATORS,
      },
      {
        id: 'narrative',
        type: 'textarea',
        label: 'Reasons for suspicion',
        rows: 6,
        required: true,
        fullWidth: true,
        description:
          'What was found, in what order, and why it cannot be explained by the client’s business.',
      },
      {
        id: 'stopped',
        type: 'radio',
        label: 'Were the funds or the transaction stopped?',
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'stoppedUntil',
        type: 'date',
        label: 'Stopped until',
        required: true,
        visibleWhen: { field: 'stopped', equals: 'yes' },
      },
      {
        id: 'urgent',
        type: 'switch',
        label: 'Urgent: a transaction is about to be carried out',
      },
    ],
  },
  {
    id: 'confidentiality',
    title: 'Confidentiality and attachments',
    columns: 1,
    fields: [
      {
        id: 'attachments',
        type: 'textarea',
        label: 'Attachments sent with the report',
        rows: 3,
        description: 'The documents of the case, one per line.',
      },
      {
        id: 'notInformed',
        type: 'checkbox',
        label:
          'The person reported has not been and will not be informed of this report, nor of the case behind it.',
        required: true,
      },
    ],
  },
]

/** The values the application fills in from the firm's record and the case. */
export function draftReportValues(found: AmlCase): DefinedValues {
  const client = amlClient(found.clientId)
  return {
    entityName: AML_FIRM.name,
    entityTaxId: AML_FIRM.taxId,
    entityOfficer: AML_OFFICER.name,
    entityEmail: AML_OFFICER.email,
    subjectKind: 'legal',
    subjectName: client.name,
    subjectTaxId: client.taxId,
    subjectRegistration: client.registration,
    subjectAddress: client.address,
    subjectCountry: 'RS',
    subjectActivity: client.activity,
    subjectRepresentative: `${client.representative.name}, ${client.representative.role.toLocaleLowerCase('en')}`,
    subjectOwners: client.owners
      .map(
        (owner) =>
          `${owner.name}, ${owner.share}${owner.detail === '' ? '' : ` (${owner.detail})`}`,
      )
      .join('\n'),
    transactionTotal: found.transactionsTotal.amount,
    attachments: found.documents.map((document) => document.name).join('\n'),
    stopped: 'no',
    urgent: false,
    notInformed: false,
  }
}

/** A new draft the application opens when a case's decision to report is approved. */
export function draftReportFor(found: AmlCase, id: string, at: string, by: string): AmlReport {
  return {
    id,
    caseId: found.id,
    clientId: found.clientId,
    clientName: amlClient(found.clientId).name,
    state: 'Draft',
    created: at,
    createdBy: by,
    reviewer: by === AML_OFFICER.name ? AML_DEPUTY.name : AML_OFFICER.name,
    values: draftReportValues(found),
    reached: { Draft: at },
    history: [
      {
        id: `${id}-created`,
        at,
        actor: { name: by },
        text: `Draft opened from case ${found.id}; the application filled in the firm, the client and the transactions’ total.`,
      },
    ],
  }
}

function entry(id: string, at: string, actor: string, text: string): HistoryEntry {
  return {
    id,
    at,
    actor: actor === 'Liro' ? { name: 'Liro', kind: 'system' } : { name: actor },
    text,
  }
}

/** A submitted and acknowledged report on a former client, written briefly. */
function formerClientReport(spec: {
  id: string
  caseId: string
  clientName: string
  created: string
  review: string
  approved: string
  submitted: string
  acknowledged: string
  reference: string
  acknowledgement: string
  by: string
  reviewer: string
  values: DefinedValues
}): AmlReport {
  return {
    id: spec.id,
    caseId: spec.caseId,
    clientName: spec.clientName,
    state: 'Acknowledged',
    created: spec.created,
    createdBy: spec.by,
    reviewer: spec.reviewer,
    values: {
      entityName: AML_FIRM.name,
      entityTaxId: AML_FIRM.taxId,
      entityOfficer: AML_OFFICER.name,
      entityEmail: AML_OFFICER.email,
      ...spec.values,
    },
    reached: {
      Draft: spec.created,
      'In review': spec.review,
      Approved: spec.approved,
      Submitted: spec.submitted,
      Acknowledged: spec.acknowledged,
    },
    submission: {
      at: spec.submitted,
      by: spec.reviewer,
      channel: `Portal of ${AML_AUTHORITY} (illustrative)`,
      reference: spec.reference,
      acknowledgedAt: spec.acknowledged,
      acknowledgement: spec.acknowledgement,
      files: [
        { id: `${spec.id}-xml`, name: `${spec.id}.xml`, sizeText: '24 KB' },
        { id: `${spec.id}-pdf`, name: `${spec.id}.pdf`, sizeText: '318 KB' },
      ],
    },
    history: [
      entry(
        `${spec.id}-h5`,
        spec.acknowledged,
        'Liro',
        `Acknowledged by ${AML_AUTHORITY}: ${spec.acknowledgement}.`,
      ),
      entry(
        `${spec.id}-h4`,
        spec.submitted,
        spec.reviewer,
        `Submitted; reference ${spec.reference}.`,
      ),
      entry(`${spec.id}-h3`, spec.approved, spec.reviewer, 'Approved for submission.'),
      entry(`${spec.id}-h2`, spec.review, spec.by, 'Sent for review.'),
      entry(`${spec.id}-h1`, spec.created, spec.by, `Draft opened from case ${spec.caseId}.`),
    ],
  }
}

export const AML_REPORTS: readonly AmlReport[] = [
  {
    id: 'STR-2026-0003',
    caseId: 'CM-2026-0007',
    clientId: 'adria',
    clientName: 'Adria Commodities d.o.o.',
    state: 'Draft',
    created: amlAt('2026-10-14', '09:36'),
    createdBy: AML_DEPUTY.name,
    reviewer: AML_OFFICER.name,
    values: {
      entityName: AML_FIRM.name,
      entityTaxId: AML_FIRM.taxId,
      entityOfficer: AML_OFFICER.name,
      entityEmail: AML_OFFICER.email,
      subjectKind: 'legal',
      subjectName: 'Adria Commodities d.o.o.',
      subjectTaxId: '113582046',
      subjectRegistration: '21893617',
      subjectAddress: 'Gospodar Jevremova 47, 11000 Beograd',
      subjectCountry: 'RS',
      subjectActivity: '46.72 Wholesale of metals and metal ores',
      subjectRepresentative: 'Ognjen Rakočević, director',
      subjectOwners:
        'Meridian Trade Holdings Ltd, 100% (registered in Cyprus)\nOgnjen Rakočević, 40% of the holding (Montenegro)\nOwners of 60% of the holding not disclosed',
      periodFrom: '2026-09-24',
      periodTo: '2026-09-26',
      transactionCount: '2',
      transactionTotal: '9800000.00',
      accounts:
        '265-0000001187654-32 (the client, illustrative)\n160-0000005512398-77 (Balkan Scrap Trade d.o.o., illustrative)',
      transactionsDescription:
        'Two payments of 4.900.000,00 RSD to Balkan Scrap Trade d.o.o. on 24.09.2026 and 26.09.2026, described as advances under contract 14/2026 for 120 t of scrap metal. No delivery note or stock receipt was booked.',
      indicators: ['I-01', 'I-07', 'I-09'],
      narrative: '',
      stopped: 'no',
      urgent: false,
      attachments:
        'Bank statements 09-2026.pdf\nBank statements 10-2026 to 13.10.pdf\nContract 14-2026 Balkan Scrap Trade.pdf\nScreening match SH-2026-0413.pdf',
      notInformed: false,
    },
    reached: { Draft: amlAt('2026-10-14', '09:36') },
    history: [
      entry(
        'STR-2026-0003-h1',
        amlAt('2026-10-14', '09:36'),
        AML_DEPUTY.name,
        'Draft opened from case CM-2026-0007; the application filled in the firm, the client and the transactions.',
      ),
    ],
  },
  formerClientReport({
    id: 'STR-2026-0002',
    caseId: 'CM-2026-0004',
    clientName: 'Delta Trade SZR (former client)',
    created: amlAt('2026-06-24', '10:10'),
    review: amlAt('2026-06-25', '15:30'),
    approved: amlAt('2026-06-26', '09:00'),
    submitted: amlAt('2026-06-26', '09:20'),
    acknowledged: amlAt('2026-06-29', '08:05'),
    reference: 'ILL-FIU-2026-01742',
    acknowledgement: 'Acknowledgement 2026/01742-A',
    by: AML_DEPUTY.name,
    reviewer: AML_OFFICER.name,
    values: {
      subjectKind: 'natural',
      subjectName: 'Delta Trade SZR, Zoran Delić',
      subjectBirth: '1971-04-02',
      subjectAddress: 'Temerinska 88, 21000 Novi Sad',
      subjectCountry: 'RS',
      subjectActivity: '47.19 Other retail sale in non-specialised stores',
      periodFrom: '2026-05-04',
      periodTo: '2026-06-12',
      transactionCount: '23',
      transactionTotal: '11240000.00',
      transactionsDescription:
        'Twenty-three cash deposits between 450.000,00 and 499.000,00 RSD over six weeks, out of line with the shop’s fiscal takings.',
      indicators: ['I-12', 'I-21'],
      narrative:
        'The deposits exceed the shop’s recorded takings threefold; the client did not give the purchase records asked for and ended the relationship on 20.06.2026.',
      stopped: 'no',
      urgent: false,
      attachments:
        'Bank statements 05-2026.pdf\nBank statements 06-2026.pdf\nFiscal journal 05–06.2026.pdf',
      notInformed: true,
    },
  }),
  formerClientReport({
    id: 'STR-2026-0001',
    caseId: 'CM-2026-0002',
    clientName: 'Sava Logistika d.o.o. (former client)',
    created: amlAt('2026-03-09', '11:40'),
    review: amlAt('2026-03-10', '16:00'),
    approved: amlAt('2026-03-12', '09:50'),
    submitted: amlAt('2026-03-12', '10:15'),
    acknowledged: amlAt('2026-03-13', '12:30'),
    reference: 'ILL-FIU-2026-00318',
    acknowledgement: 'Acknowledgement 2026/00318-A',
    by: AML_OFFICER.name,
    reviewer: AML_DEPUTY.name,
    values: {
      subjectKind: 'legal',
      subjectName: 'Sava Logistika d.o.o.',
      subjectTaxId: '109334871',
      subjectRegistration: '21077430',
      subjectAddress: 'Sentandrejski put 165, 21000 Novi Sad',
      subjectCountry: 'RS',
      subjectActivity: '52.29 Other transportation support activities',
      subjectRepresentative: 'Goran Savić, director',
      subjectOwners: 'Goran Savić, 100%',
      periodFrom: '2026-01-12',
      periodTo: '2026-02-27',
      transactionCount: '9',
      transactionTotal: '27600000.00',
      transactionsDescription:
        'Nine receipts from three companies registered in the same month, each paid on within a day to a company abroad.',
      indicators: ['I-04', 'I-15'],
      narrative:
        'Funds passed through the account within a day each time; the companies paying had no business with the client before January and the client could not name the service invoiced.',
      stopped: 'yes',
      stoppedUntil: '2026-03-14',
      urgent: true,
      attachments:
        'Bank statements 01-2026.pdf\nBank statements 02-2026.pdf\nInvoices received Q1.pdf',
      notInformed: true,
    },
  }),
]

export function amlReport(id: string): AmlReport {
  const found = AML_REPORTS.find((each) => each.id === id)
  if (found === undefined) throw new Error(`No report ${id}`)
  return found
}

/** The number of the next report the application opens. */
export function nextReportId(reports: readonly AmlReport[]): string {
  const last = reports
    .map((each) => Number(each.id.slice('STR-2026-'.length)))
    .reduce((max, each) => Math.max(max, each), 0)
  return `STR-2026-${String(last + 1).padStart(4, '0')}`
}

/** What the application writes when a report is submitted (the channel's answer, invented). */
export function submissionOf(report: AmlReport, at: string, by: string): ReportSubmission {
  return {
    at,
    by,
    channel: `Portal of ${AML_AUTHORITY} (illustrative)`,
    reference: `ILL-FIU-2026-0${report.id.slice(-4)}`,
    files: [
      { id: `${report.id}-xml`, name: `${report.id}.xml`, sizeText: '26 KB' },
      { id: `${report.id}-pdf`, name: `${report.id}.pdf`, sizeText: '342 KB' },
    ],
  }
}

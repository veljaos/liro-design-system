import type { RuleActionType, RuleDraft, RuleField, RuleOperator, RuleTrigger } from '@veljaos/ui'
import { U_ROUTES } from './data-U'

/*
 * Group BS's data (P5.78, automation rules): Kvadrat Gradnja d.o.o.'s rules on 14 October 2026 at
 * 09:40, as Milica Petrović sees them. Everything here is the application's: the triggers, the
 * fields each one offers, the tests, the actions and their parameters, the rules, their runs and
 * the figures about them, the rule in words and the checks of an edited rule. Invented.
 */

export const BS_TODAY = '2026-10-14'

const RULE_PATH = (id: string) => `/settings/automation/rules/${id}`

export const BS_ROUTES = {
  rules: '/settings/automation',
  log: '/settings/automation/runs',
  /** The run log, failed runs only. */
  logFailed: '/settings/automation/runs?view=failed',
  rule: RULE_PATH,
  /** "Large incoming invoice", the rule shown. */
  large: RULE_PATH('r1'),
  /** "Supplier invoices to the accountant": its last run failed. */
  inbox: RULE_PATH('r2'),
  /** The large-invoice rule edited: a condition added. */
  largeEdit: `${RULE_PATH('r1')}?edit`,
  /** The large-invoice rule edited and saved with problems. */
  largeProblems: `${RULE_PATH('r1')}?edit=problems`,
  /** The large-invoice rule edited, its test run shown. */
  largeTested: `${RULE_PATH('r1')}?edit=tested`,
  /** A new rule. */
  create: '/settings/automation/rules/new',
}

// ── The vocabulary: triggers, fields, tests, actions ──────────────────────────────────────────

export const BS_TRIGGERS: RuleTrigger[] = [
  { id: 'purchase-posted', label: 'An incoming invoice is posted', group: 'Purchasing' },
  {
    id: 'inbox-received',
    label: 'A document arrives in the document inbox',
    group: 'Document inbox',
  },
  { id: 'contract-ending', label: 'A contract is near its end', group: 'Contracts' },
  { id: 'sales-overdue', label: 'A sales invoice becomes overdue', group: 'Sales' },
  { id: 'stock-minimum', label: 'An item falls below its minimum', group: 'Inventory' },
]

export const BS_OPERATORS: RuleOperator[] = [
  { id: 'gt', label: 'is more than' },
  { id: 'lt', label: 'is less than' },
  { id: 'eq', label: 'is' },
  { id: 'ne', label: 'is not' },
  { id: 'contains', label: 'contains' },
  { id: 'before', label: 'is before' },
  { id: 'empty', label: 'is empty', noValue: true },
  { id: 'set', label: 'is filled in', noValue: true },
]

const SUPPLIERS = [
  { value: 'beton-mix', label: 'Beton Mix d.o.o.' },
  { value: 'elektro-sistem', label: 'Elektro Sistem d.o.o.' },
  { value: 'eps', label: 'EPS Snabdevanje' },
  { value: 'gradska-toplana', label: 'Gradska toplana Novi Sad' },
]

const PROJECTS = [
  { value: 'liman-4', label: 'Residential building Liman 4' },
  { value: 'office', label: 'Head office' },
]

const MONEY = ['gt', 'lt', 'eq']

/** The fields each trigger offers its conditions. */
export const BS_FIELDS: Record<string, RuleField[]> = {
  'purchase-posted': [
    { id: 'amount', label: 'Total', kind: 'money', currency: 'RSD', operators: MONEY },
    {
      id: 'supplier',
      label: 'Supplier',
      kind: 'choice',
      operators: ['eq', 'ne'],
      options: SUPPLIERS,
    },
    {
      id: 'project',
      label: 'Project',
      kind: 'choice',
      operators: ['eq', 'ne', 'empty'],
      options: PROJECTS,
    },
    { id: 'due', label: 'Due date', kind: 'date', operators: ['before', 'empty'] },
    {
      id: 'reference',
      label: 'Payment reference',
      kind: 'text',
      operators: ['contains', 'empty', 'set'],
    },
  ],
  'inbox-received': [
    {
      id: 'kind',
      label: 'Document kind',
      kind: 'choice',
      operators: ['eq', 'ne'],
      options: [
        { value: 'supplier-invoice', label: 'Supplier invoice' },
        { value: 'credit-note', label: 'Credit note' },
        { value: 'bank-statement', label: 'Bank statement' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'channel',
      label: 'Arrived through',
      kind: 'choice',
      operators: ['eq', 'ne'],
      options: [
        { value: 'sef', label: 'SEF' },
        { value: 'email', label: 'E-mail' },
        { value: 'upload', label: 'Upload' },
        { value: 'scan', label: 'Scan' },
      ],
    },
    {
      id: 'supplier',
      label: 'Supplier',
      kind: 'choice',
      operators: ['eq', 'ne', 'empty'],
      options: SUPPLIERS,
    },
    { id: 'amount', label: 'Total', kind: 'money', currency: 'RSD', operators: MONEY },
  ],
  'contract-ending': [
    { id: 'days', label: 'Days to its end', kind: 'number', operators: ['lt', 'eq'] },
    {
      id: 'type',
      label: 'Contract type',
      kind: 'choice',
      operators: ['eq', 'ne'],
      options: [
        { value: 'supply', label: 'Supply' },
        { value: 'service', label: 'Service and maintenance' },
        { value: 'lease', label: 'Lease' },
      ],
    },
    {
      id: 'renews',
      label: 'Renews by itself',
      kind: 'choice',
      operators: ['eq'],
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  'sales-overdue': [
    { id: 'amount', label: 'Open amount', kind: 'money', currency: 'RSD', operators: MONEY },
    { id: 'days', label: 'Days overdue', kind: 'number', operators: ['gt', 'lt'] },
  ],
  'stock-minimum': [
    {
      id: 'group',
      label: 'Item group',
      kind: 'choice',
      operators: ['eq', 'ne'],
      options: [
        { value: 'binders', label: 'Building materials · Binders' },
        { value: 'steel', label: 'Building materials · Steel' },
      ],
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      kind: 'choice',
      operators: ['eq'],
      options: [
        { value: 'central', label: 'Central warehouse' },
        { value: 'site', label: 'Site Liman 4' },
      ],
    },
  ],
}

/** The people an action can name: Kvadrat Gradnja's staff and its accountant. */
export const BS_PEOPLE = [
  { value: 'nenad', label: 'Nenad Kovačević', group: 'Kvadrat Gradnja d.o.o.' },
  { value: 'milica', label: 'Milica Petrović', group: 'Kvadrat Gradnja d.o.o.' },
  { value: 'ivana', label: 'Ivana Stojanović', group: 'Kvadrat Gradnja d.o.o.' },
  { value: 'marko-dj', label: 'Marko Đorđević', group: 'Kvadrat Gradnja d.o.o.' },
  { value: 'zoran', label: 'Zoran Bojović', group: 'Kvadrat Gradnja d.o.o.' },
  { value: 'snezana', label: 'Snežana Jelić', group: 'Knjigovodstvo Jelić' },
]

export const BS_ACTIONS: RuleActionType[] = [
  {
    id: 'notify',
    label: 'Notify a person',
    group: 'Messages',
    params: [
      { id: 'who', label: 'Who', kind: 'choice', options: BS_PEOPLE, required: true },
      {
        id: 'message',
        label: 'Message',
        kind: 'longText',
        description: 'Sent in Liro with a link to the record.',
      },
    ],
  },
  {
    id: 'email',
    label: 'Send an e-mail to the partner',
    group: 'Messages',
    params: [
      {
        id: 'template',
        label: 'Template',
        kind: 'choice',
        required: true,
        options: [
          { value: 'reminder-1', label: 'First payment reminder' },
          { value: 'reminder-2', label: 'Second payment reminder' },
        ],
      },
    ],
  },
  {
    id: 'assign',
    label: 'Assign for review',
    group: 'Work',
    params: [{ id: 'who', label: 'Reviewer', kind: 'choice', options: BS_PEOPLE, required: true }],
  },
  {
    id: 'task',
    label: 'Create a task',
    group: 'Work',
    params: [
      { id: 'title', label: 'Task', kind: 'text', required: true },
      { id: 'who', label: 'For', kind: 'choice', options: BS_PEOPLE, required: true },
      { id: 'due', label: 'Due in days', kind: 'number' },
    ],
  },
  {
    id: 'hold',
    label: 'Hold the payment',
    group: 'Payments',
    params: [{ id: 'reason', label: 'Reason', kind: 'text', required: true }],
  },
]

// ── The rules ─────────────────────────────────────────────────────────────────────────────────

export type BsRunResult = 'Done' | 'Failed' | 'Not met'

export interface BsRule {
  id: string
  name: string
  draft: RuleDraft
  on: boolean
  /** The application's figures: runs in the last 30 days and how many failed. */
  runs30: string
  failed30: string
  lastRun: string | null
  lastResult: BsRunResult | null
  /** Who changed it last, and when (the application's words). */
  changed: string
}

export const BS_RULES: BsRule[] = [
  {
    id: 'r1',
    name: 'Large incoming invoice',
    on: true,
    runs30: '23',
    failed30: '0',
    lastRun: '2026-10-14T08:12',
    lastResult: 'Done',
    changed: 'Changed 02.10.2026. by Milica Petrović',
    draft: {
      trigger: 'purchase-posted',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '500000' },
      ],
      actions: [
        {
          id: 'a1',
          type: 'notify',
          params: { who: 'nenad', message: 'A large invoice was posted. Please look at it today.' },
        },
      ],
    },
  },
  {
    id: 'r2',
    name: 'Supplier invoices to the accountant',
    on: true,
    runs30: '41',
    failed30: '1',
    lastRun: '2026-10-13T15:02',
    lastResult: 'Failed',
    changed: 'Changed 28.09.2026. by Milica Petrović',
    draft: {
      trigger: 'inbox-received',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c1', field: 'kind', operator: 'eq', value: 'supplier-invoice' },
        {
          kind: 'group',
          id: 'g1',
          join: 'any',
          items: [
            { kind: 'condition', id: 'c2', field: 'channel', operator: 'eq', value: 'sef' },
            { kind: 'condition', id: 'c3', field: 'amount', operator: 'gt', value: '100000' },
          ],
        },
      ],
      actions: [
        { id: 'a1', type: 'assign', params: { who: 'snezana' } },
        { id: 'a2', type: 'notify', params: { who: 'milica', message: null } },
      ],
    },
  },
  {
    id: 'r3',
    name: 'Contract expiry reminder',
    on: true,
    runs30: '2',
    failed30: '0',
    lastRun: '2026-10-01T07:00',
    lastResult: 'Done',
    changed: 'Changed 15.06.2026. by Milica Petrović',
    draft: {
      trigger: 'contract-ending',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c1', field: 'days', operator: 'lt', value: '31' },
        { kind: 'condition', id: 'c2', field: 'renews', operator: 'eq', value: 'no' },
      ],
      actions: [
        {
          id: 'a1',
          type: 'task',
          params: { title: 'Renew or end the contract', who: 'milica', due: '14' },
        },
      ],
    },
  },
  {
    id: 'r4',
    name: 'Payment reminder to customers',
    on: false,
    runs30: '0',
    failed30: '0',
    lastRun: '2026-09-30T07:00',
    lastResult: 'Done',
    changed: 'Turned off 01.10.2026. by Milica Petrović',
    draft: {
      trigger: 'sales-overdue',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '50000' },
        { kind: 'condition', id: 'c2', field: 'days', operator: 'gt', value: '7' },
      ],
      actions: [{ id: 'a1', type: 'email', params: { template: 'reminder-1' } }],
    },
  },
  {
    id: 'r5',
    name: 'Cement below its minimum',
    on: true,
    runs30: '3',
    failed30: '0',
    lastRun: '2026-10-09T11:30',
    lastResult: 'Done',
    changed: 'Changed 20.08.2026. by Marko Đorđević',
    draft: {
      trigger: 'stock-minimum',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c1', field: 'group', operator: 'eq', value: 'binders' },
      ],
      actions: [
        { id: 'a1', type: 'notify', params: { who: 'marko-dj', message: null } },
        { id: 'a2', type: 'notify', params: { who: 'zoran', message: null } },
      ],
    },
  },
]

/** The rules' views and the rules each holds (the application's). */
export const BS_VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
  { id: 'failing', label: 'Last run failed' },
] as const

// ── The run log ───────────────────────────────────────────────────────────────────────────────

export interface BsRun {
  id: string
  time: string
  rule: string
  /** The record that started it, with its address in the examples (or none). */
  record: string
  recordPath?: string
  result: BsRunResult
  /** The application's words: what was done, or why it failed. */
  message: string
}

export const BS_RUNS: BsRun[] = [
  {
    id: 'run-9',
    time: '2026-10-14T08:12',
    rule: 'r1',
    record: 'UF-2026-0219 · Elektro Sistem d.o.o.',
    result: 'Done',
    message: 'Notified Nenad Kovačević.',
  },
  {
    id: 'run-8',
    time: '2026-10-13T15:02',
    rule: 'r2',
    record: '2026-1187 · Beton Mix d.o.o.',
    recordPath: U_ROUTES.reviewOf('u1'),
    result: 'Failed',
    message:
      'Could not assign the invoice: Snežana Jelić has no access to the document inbox since 12.10.2026. Nothing else was done.',
  },
  {
    id: 'run-7',
    time: '2026-10-13T11:40',
    rule: 'r1',
    record: '2026-1187 · Beton Mix d.o.o.',
    recordPath: U_ROUTES.reviewOf('u1'),
    result: 'Not met',
    message: 'The total of 294.000,00 RSD is not more than 500.000,00 RSD.',
  },
  {
    id: 'run-6',
    time: '2026-10-12T14:06',
    rule: 'r2',
    record: 'ES-2026-0533 · Elektro Sistem d.o.o.',
    result: 'Done',
    message: 'Assigned to Snežana Jelić for review. Notified Milica Petrović.',
  },
  {
    id: 'run-5',
    time: '2026-10-09T11:30',
    rule: 'r5',
    record: 'Cement CEM II/A-M 42,5R, 25 kg · Site Liman 4',
    result: 'Done',
    message: 'Notified Marko Đorđević and Zoran Bojović.',
  },
  {
    id: 'run-4',
    time: '2026-10-08T09:15',
    rule: 'r1',
    record: 'UF-2026-0207 · Beton Mix d.o.o.',
    result: 'Done',
    message: 'Notified Nenad Kovačević.',
  },
  {
    id: 'run-3',
    time: '2026-10-01T07:00',
    rule: 'r3',
    record: 'UG-2025-014 · Gradska toplana Novi Sad, maintenance',
    result: 'Done',
    message: 'Created the task "Renew or end the contract" for Milica Petrović, due 15.10.2026.',
  },
  {
    id: 'run-2',
    time: '2026-09-30T07:00',
    rule: 'r4',
    record: 'F-2026-0398 · Stanogradnja Plus d.o.o.',
    result: 'Done',
    message: 'Sent "First payment reminder" to finance@stanogradnja.example.com.',
  },
  {
    id: 'run-1',
    time: '2026-09-29T16:20',
    rule: 'r2',
    record: 'Bank statement 186 · Banca Intesa',
    result: 'Not met',
    message: 'The document is a bank statement, not a supplier invoice.',
  },
]

export const BS_RUN_VIEWS = [
  { id: 'all', label: 'All runs' },
  { id: 'failed', label: 'Failed' },
] as const

/** The failed run's next step, in the application's words. */
export const BS_FAILED_HINT =
  'Give Snežana Jelić access to the document inbox again, or choose another reviewer in the rule.'

// ── The edited rule: a condition added, the application's checks and test run ────────────────

/** The large-invoice rule with a second condition added (Project is Residential building Liman 4). */
export const BS_EDITED: RuleDraft = {
  trigger: 'purchase-posted',
  join: 'all',
  conditions: [
    { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '500000' },
    { kind: 'condition', id: 'c2', field: 'project', operator: 'eq', value: 'liman-4' },
  ],
  actions: [
    {
      id: 'a1',
      type: 'notify',
      params: { who: 'nenad', message: 'A large invoice was posted. Please look at it today.' },
    },
    { id: 'a2', type: 'hold', params: { reason: null } },
  ],
}

/** The application's test of the edited rule on its two latest invoices. */
export const BS_TEST_RUN = [
  {
    id: 't1',
    record: 'UF-2026-0219 · Elektro Sistem d.o.o. · 612.000,00 RSD',
    result: 'Would run',
    detail:
      'The total is more than 500.000,00 RSD and the project is Residential building Liman 4: Nenad Kovačević would be notified and the payment held.',
  },
  {
    id: 't2',
    record: '2026-1187 · Beton Mix d.o.o. · 294.000,00 RSD',
    result: 'Would not run',
    detail: 'The total of 294.000,00 RSD is not more than 500.000,00 RSD.',
  },
] as const

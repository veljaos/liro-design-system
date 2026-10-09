/*
 * The data of group A's example screens (P5.1, P5.2): invoice F-2026-0410 to Medic Lab Niš d.o.o.
 * with its comments, history and who is viewing it, and the questions of the employment contract
 * of Stefan Nikolić (RU-2026-017). Kvadrat Gradnja d.o.o., Novi Sad, on 6 October 2026, as the
 * P4.8 dataset. Amounts are decimal strings, computed here in whole paras with BigInt (the
 * stories play the application; components never add). No classes here.
 */
import type {
  HistoryEntry,
  MentionCandidate,
  PresencePerson,
  QuestionDefinition,
  StatusTimelineStep,
  ThreadMessage,
} from '@veljaos/ui'
import { decimal, paras } from '../../../../packages/ui/src/components/amounts-story-data'
import { DECREASE, MEDIC_LINES } from './data-D2'
import { INVOICES, type ExampleInvoice } from './examples-story-data'

export { decimal, paras }

// ── Money in whole paras ──────────────────────────────────────────────────────────────────────

// ── F-2026-0410 ───────────────────────────────────────────────────────────────────────────────

const found = INVOICES.find((invoice) => invoice.number === 'F-2026-0410')
if (found === undefined) throw new Error('F-2026-0410 is missing from the dataset')
export const INVOICE_0410: ExampleInvoice = found

export interface LineA {
  id: string
  item: string
  quantity: string
  /** The unit's symbol; its code is in `unitCode` (a quantity and its unit are two values). */
  unit: string
  unitCode: string
  price: string
  vat: 'S 20%' | 'S 10%'
  amount: string
}

/** The UN/ECE codes of the units the lines use. */
const UNIT_CODES: Record<string, string> = { pc: 'H87', 'm²': 'MTK', lot: 'LO' }

/** The lines of F-2026-0410: group D2's (data-D2.ts), which its decrease KO-2026-0009 corrects. */
export const LINES_0410: LineA[] = MEDIC_LINES.map((line) => ({
  id: line.id,
  item: line.text,
  quantity: line.quantity ?? '0',
  unit: line.unit ?? '',
  unitCode: UNIT_CODES[line.unit ?? ''] ?? '',
  price: line.price ?? '0.00',
  vat: line.tax === 'S10' ? 'S 10%' : 'S 20%',
  amount: line.amount ?? '0.00',
}))

const base = (vat: LineA['vat']) =>
  LINES_0410.filter((line) => line.vat === vat).reduce((sum, line) => sum + paras(line.amount), 0n)

/** VAT of a base at a whole-percent rate; the base is chosen so it is exact in paras. */
function vatOf(amount: bigint, rate: bigint): bigint {
  if ((amount * rate) % 100n !== 0n) throw new Error('VAT would need rounding')
  return (amount * rate) / 100n
}

const BASE_20 = base('S 20%')
const BASE_10 = base('S 10%')
const VAT_20 = vatOf(BASE_20, 20n)
const VAT_10 = vatOf(BASE_10, 10n)
const TOTAL = BASE_20 + VAT_20 + BASE_10 + VAT_10
/** The payment booked from Banca Intesa statement 187 on 02.10.2026. */
const PAID = paras('100000.00')

/** Decrease KO-2026-0009 (group D2): damaged goods returned, issued on 06.10.2026. */
const DECREASED = paras(DECREASE.change)

/** The totals of F-2026-0410 as the application sends them. */
export const TOTALS_0410 = {
  base20: decimal(BASE_20),
  vat20: decimal(VAT_20),
  base10: decimal(BASE_10),
  vat10: decimal(VAT_10),
  total: decimal(TOTAL),
  decrease: decimal(DECREASED),
  corrected: decimal(TOTAL + DECREASED),
  paid: decimal(-PAID),
  due: decimal(TOTAL + DECREASED - PAID),
}

// The same figures as the dataset's list after the decrease: total 167.762,75, open 67.762,75.
if (TOTALS_0410.corrected !== INVOICE_0410.total || TOTALS_0410.due !== INVOICE_0410.open) {
  throw new Error('F-2026-0410: the lines do not add up to the dataset’s total')
}

/** An instant on a day, in the tenant's offset. */
export function at(day: string, time: string): string {
  return `${day}T${time}:00+02:00`
}

/** Who else has F-2026-0410 open. */
export const PRESENT_0410: PresencePerson[] = [
  { id: 'u-dragan', name: 'Dragan Ilić', description: 'Viewing' },
  { id: 'agent', name: 'Liro agent', agent: true, description: 'Preparing a payment reminder' },
]

/** The people of Kvadrat Gradnja who can be mentioned. */
export const PEOPLE_A: MentionCandidate[] = [
  { id: 'u-dragan', name: 'Dragan Ilić', description: 'Sales' },
  { id: 'u-ivana', name: 'Ivana Stojanović', description: 'Accountant' },
  { id: 'u-jelena', name: 'Jelena Marković', description: 'HR' },
  { id: 'u-marko', name: 'Marko Đorđević', description: 'Warehouse' },
  { id: 'u-nenad', name: 'Nenad Kovačević', description: 'Director' },
  { id: 'u-snezana', name: 'Snežana Popović', description: 'Site manager' },
  { id: 'agent', name: 'Liro agent', description: 'Agent', agent: true },
]

/** The comments on F-2026-0410 before the agent's question. */
export const COMMENTS_0410: ThreadMessage[] = [
  {
    id: 'c1',
    author: { id: 'u-dragan', name: 'Dragan Ilić' },
    at: at('2026-10-02', '09:20'),
    text: 'Medic Lab paid 100.000,00 RSD today. They will pay the rest in a second part.',
  },
  {
    id: 'c2',
    author: { id: 'u-ivana', name: 'Ivana Stojanović' },
    at: at('2026-10-02', '09:41'),
    text: 'Booked from statement 187. @Dragan Ilić do we know when the second part comes?',
    mentions: [{ id: 'u-dragan', name: 'Dragan Ilić' }],
  },
  {
    id: 'c3',
    author: { id: 'u-dragan', name: 'Dragan Ilić' },
    at: at('2026-10-05', '16:12'),
    text: 'Not yet. Their accountant is back on Wednesday.',
  },
]

/** The agent's question in the thread: when the rest will be paid. */
export const AGENT_QUESTION_AT = at('2026-10-06', '08:15')

/** F-2026-0410's delivery to SEF: delivered, the buyer's answer awaited until 10.10.2026. */
export const DELIVERY_0410: StatusTimelineStep[] = [
  { key: 'issued', label: 'Issued', at: at('2026-09-25', '10:02'), detail: 'by Dragan Ilić' },
  { key: 'sent', label: 'Sent to SEF', at: at('2026-09-25', '10:03') },
  { key: 'delivered', label: 'Delivered', at: at('2026-09-25', '10:04') },
  { key: 'accepted', label: 'Accepted by the buyer' },
]

/** The history of F-2026-0410, newest last (the list sorts it). */
export const HISTORY_0410: HistoryEntry[] = [
  {
    id: 'h2',
    at: at('2026-09-25', '10:02'),
    actor: { name: 'Dragan Ilić' },
    text: 'Issued the invoice',
    changes: [{ field: 'Status', from: 'Draft', to: 'Issued' }],
  },
  {
    id: 'h3',
    at: at('2026-09-25', '10:04'),
    actor: { name: 'SEF', kind: 'integration' },
    text: 'Delivered to the e-invoice system',
    changes: [{ field: 'SEF status', from: 'Sent', to: 'Delivered' }],
  },
  {
    id: 'h4',
    at: at('2026-10-02', '07:40'),
    actor: { name: 'Banca Intesa import', kind: 'integration' },
    text: 'Payment booked from bank statement 187',
    changes: [
      { field: 'Paid', from: '0,00 RSD', to: '100.000,00 RSD' },
      { field: 'Amount due', from: '186.420,35 RSD', to: '86.420,35 RSD' },
      { field: 'Status', from: 'Sent', to: 'Partially paid' },
    ],
  },
  {
    id: 'h5',
    at: at('2026-10-05', '18:00'),
    actor: { name: 'Liro', kind: 'system' },
    text: 'Payment reminder due: 86.420,35 RSD open, due on 25.10.2026.',
  },
  {
    id: 'h5b',
    at: at('2026-10-06', '07:50'),
    actor: { name: 'Milica Petrović' },
    text: 'Decreased by KO-2026-0009: damaged goods returned',
    changes: [
      { field: 'Invoice total', from: '186.420,35 RSD', to: '167.762,75 RSD' },
      { field: 'Amount due', from: '86.420,35 RSD', to: '67.762,75 RSD' },
    ],
  },
  {
    id: 'h6',
    at: at('2026-10-06', '08:14'),
    actor: { name: 'Liro agent', kind: 'agent' },
    onBehalfOf: 'Milica Petrović',
    text: 'Prepared a payment reminder for 67.762,75 RSD',
  },
  {
    id: 'h7',
    at: at('2026-10-06', '09:02'),
    actor: { name: 'Ivana Stojanović' },
    changes: [{ field: 'Payment reference', from: '97 2026-0410', to: '97 41-2026-0410' }],
  },
]

/** The first entries, loaded with "Show more". */
export const OLDER_HISTORY_0410: HistoryEntry[] = [
  {
    id: 'h1',
    at: at('2026-09-25', '09:12'),
    actor: { name: 'Dragan Ilić' },
    text: 'Created the invoice from order N-2026-0149',
  },
]

// ── Employment contract RU-2026-017 ───────────────────────────────────────────────────────────

/** The contract that "Generate contract" creates (group C's signing screen shows it). */
export const CONTRACT_NUMBER = 'RU-2026-017'

/**
 * The questions of an employment contract (the Core's; the texts and the minimum below are
 * illustrative). Branches: a fixed term asks for its end and reason; hybrid work for the office
 * days; probation for its months; part time for the hours.
 */
export const CONTRACT_QUESTIONS_A: QuestionDefinition[] = [
  {
    id: 'employee',
    title: 'Who is the contract for?',
    type: 'single',
    options: [
      {
        value: 'stefan',
        label: 'Stefan Nikolić',
        description: 'New employee, accepted the offer on 01.10.2026.',
      },
      { value: 'other', label: 'Someone else', other: true },
    ],
    otherLabel: 'Full name',
  },
  {
    id: 'position',
    title: 'Which position?',
    type: 'single',
    options: [
      { value: 'site-engineer', label: 'Site engineer' },
      { value: 'site-manager', label: 'Site manager' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'warehouse', label: 'Warehouse worker' },
      { value: 'other', label: 'Other position', other: true },
    ],
    otherLabel: 'Position',
  },
  {
    id: 'type',
    title: 'What type of contract?',
    type: 'single',
    options: [
      { value: 'indefinite', label: 'Indefinite term', next: 'start' },
      { value: 'fixed', label: 'Fixed term', description: 'Ends on a set date', next: 'end' },
    ],
  },
  { id: 'end', title: 'When does the contract end?', type: 'date' },
  {
    id: 'reason',
    title: 'Why a fixed term?',
    description: 'Written into the contract.',
    type: 'single',
    options: [
      { value: 'project', label: 'A project with an end date' },
      { value: 'replacement', label: 'Replacing an absent employee' },
      { value: 'seasonal', label: 'Seasonal work' },
      { value: 'other', label: 'Other reason', other: true },
    ],
    otherLabel: 'Reason',
  },
  { id: 'start', title: 'When does the employee start?', type: 'date' },
  {
    id: 'place',
    title: 'Where will the employee work?',
    type: 'single',
    next: 'probation',
    options: [
      { value: 'office', label: 'Office, Novi Sad', description: 'Bulevar oslobođenja 102' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid', description: 'Office in Novi Sad', next: 'days' },
    ],
  },
  {
    id: 'days',
    title: 'How many days a week in the office?',
    type: 'number',
    decimals: 0,
    fieldLabel: 'Office days per week',
  },
  {
    id: 'probation',
    title: 'Is there a probation period?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes', next: 'months' },
      { value: 'no', label: 'No', next: 'time' },
    ],
  },
  {
    id: 'months',
    title: 'How many months of probation?',
    type: 'number',
    decimals: 0,
    fieldLabel: 'Probation months',
  },
  {
    id: 'time',
    title: 'Working time',
    type: 'single',
    options: [
      { value: 'full', label: 'Full time', description: '40 hours a week', next: 'salary' },
      { value: 'part', label: 'Part time', next: 'hours' },
    ],
  },
  {
    id: 'hours',
    title: 'How many hours a week?',
    type: 'number',
    decimals: 0,
    fieldLabel: 'Hours per week',
  },
  {
    id: 'salary',
    title: 'Gross monthly salary',
    type: 'amount',
    currency: 'RSD',
  },
  {
    id: 'leave',
    title: 'Annual leave',
    description: 'Working days per year.',
    type: 'number',
    decimals: 0,
    fieldLabel: 'Annual leave days',
    next: null,
  },
]

/** The application's checks (illustrative): the start after today, leave at least 20 days. */
export function checkContractAnswer(id: string, value: string | null, today: string) {
  if (id === 'start' && value !== null && value <= today)
    return 'The start date must be after today.'
  if (id === 'end' && value !== null && value <= today) return 'The end date must be after today.'
  if (id === 'leave' && value !== null && paras(value) < paras('20')) {
    return 'Annual leave is at least 20 working days.'
  }
  return undefined
}

/*
 * Story data of the collaboration components (P5.1, P5.2): Kvadrat Gradnja d.o.o. on 6 October
 * 2026, invoice F-2026-0410 to Medic Lab Niš d.o.o. Not part of the package: nothing in
 * src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import type { HistoryEntry } from './history-list'
import type { MentionCandidate } from './mention-combobox'
import type { ThreadMessage } from './messages'
import type { PresencePerson } from './presence-avatars'
import type { QuestionDefinition } from './questionnaire-logic'

/** An instant on a day, in the tenant's offset (+02:00). */
export function at(day: string, time: string): string {
  return `${day}T${time}:00+02:00`
}

export const TODAY = '2026-10-06'
export const YESTERDAY = '2026-10-05'

export const PEOPLE: MentionCandidate[] = [
  { id: 'u-dragan', name: 'Dragan Ilić', description: 'Sales' },
  { id: 'u-ivana', name: 'Ivana Stojanović', description: 'Accountant' },
  { id: 'u-jelena', name: 'Jelena Marković', description: 'HR' },
  { id: 'u-marko', name: 'Marko Đorđević', description: 'Warehouse' },
  { id: 'u-nenad', name: 'Nenad Kovačević', description: 'Director' },
  { id: 'u-snezana', name: 'Snežana Popović', description: 'Site manager' },
  { id: 'agent', name: 'Liro agent', description: 'Agent', agent: true },
]

export const PRESENT: PresencePerson[] = [
  { id: 'u-dragan', name: 'Dragan Ilić', description: 'Viewing' },
  { id: 'agent', name: 'Liro agent', agent: true, description: 'Preparing a payment reminder' },
]

export const MANY_PRESENT: PresencePerson[] = [
  ...PRESENT,
  { id: 'u-ivana', name: 'Ivana Stojanović', description: 'Editing' },
  { id: 'u-nenad', name: 'Nenad Kovačević', description: 'Viewing' },
  { id: 'u-marko', name: 'Marko Đorđević', description: 'Viewing' },
  { id: 'u-snezana', name: 'Snežana Popović', description: 'Viewing' },
]

/** The history of F-2026-0410, newest last here (the list sorts it). */
export const HISTORY: HistoryEntry[] = [
  {
    id: 'h1',
    at: at('2026-09-25', '09:12'),
    actor: { name: 'Dragan Ilić' },
    text: 'Created the invoice from order N-2026-0149',
  },
  {
    id: 'h2',
    at: at('2026-09-25', '09:31'),
    actor: { name: 'Dragan Ilić' },
    text: 'Issued',
    changes: [{ field: 'Status', from: 'Draft', to: 'Issued' }],
  },
  {
    id: 'h3',
    at: at('2026-09-25', '09:33'),
    actor: { name: 'SEF', kind: 'integration' },
    text: 'Delivered to the e-invoice system',
    changes: [{ field: 'SEF status', from: 'Sent', to: 'Delivered' }],
  },
  {
    id: 'h4',
    at: at('2026-10-02', '07:40'),
    actor: { name: 'Banca Intesa import', kind: 'integration' },
    text: 'Payment of 100.000,00 RSD booked from bank statement 187',
    changes: [
      { field: 'Amount due', from: '186.420,35 RSD', to: '86.420,35 RSD' },
      { field: 'Status', from: 'Sent', to: 'Partially paid' },
    ],
  },
  {
    id: 'h5',
    at: at(YESTERDAY, '16:05'),
    actor: { name: 'Liro', kind: 'system' },
    text: 'Reminder due: the rest is due on 25.10.2026.',
  },
  {
    id: 'h6',
    at: at(TODAY, '08:15'),
    actor: { name: 'Liro agent', kind: 'agent' },
    onBehalfOf: 'Milica Petrović',
    text: 'Prepared a payment reminder for 86.420,35 RSD',
  },
  {
    id: 'h7',
    at: at(TODAY, '09:02'),
    actor: { name: 'Ivana Stojanović' },
    changes: [{ field: 'Payment reference', from: '97 2026-0410', to: '97 41-2026-0410' }],
  },
]

/** Older entries, loaded by "Show more". */
export const OLDER_HISTORY: HistoryEntry[] = [
  {
    id: 'h0',
    at: at('2026-09-24', '16:20'),
    actor: { name: 'Dragan Ilić' },
    text: 'Order N-2026-0149 confirmed by Medic Lab Niš d.o.o.',
  },
]

/** The comments on F-2026-0410. */
export const COMMENTS: ThreadMessage[] = [
  {
    id: 'c1',
    author: { id: 'u-dragan', name: 'Dragan Ilić' },
    at: at(YESTERDAY, '14:10'),
    text: 'Medic Lab asked to pay the rest in two parts. @Ivana Stojanović can we accept that?',
    mentions: [{ id: 'u-ivana', name: 'Ivana Stojanović' }],
  },
  {
    id: 'c2',
    author: { id: 'u-ivana', name: 'Ivana Stojanović' },
    at: at(YESTERDAY, '14:32'),
    text: 'Yes, if the second part arrives by 25.10.2026.',
  },
  {
    id: 'c3',
    author: { id: 'u-ivana', name: 'Ivana Stojanović' },
    at: at(YESTERDAY, '14:33'),
    text: 'I will note it on the invoice.',
  },
  {
    id: 'c4',
    author: { id: 'u-milica', name: 'Milica Petrović' },
    own: true,
    at: at(TODAY, '08:05'),
    text: 'Thanks. @Dragan Ilić please confirm the first part with them.',
    mentions: [{ id: 'u-dragan', name: 'Dragan Ilić' }],
  },
]

const DIARY = [
  'Concrete for hall B arrives at 7:30.',
  'The pump is booked for 8:00, two hours.',
  'Noted, I will tell the crew.',
  'Rebar Q188: 18 pieces still missing.',
  'Delivery note OTP-2026-0311 lists them as delivered.',
  'I will check the warehouse.',
]

/** A longer conversation for the scrolling stories. */
export const LONG_THREAD: ThreadMessage[] = Array.from({ length: 24 }, (_, index) => {
  const own = index % 3 === 2
  const hour = String(8 + Math.floor(index / 4)).padStart(2, '0')
  const minute = String((index % 4) * 12).padStart(2, '0')
  return {
    id: `l${String(index + 1)}`,
    author: own
      ? { id: 'u-milica', name: 'Milica Petrović' }
      : index % 2 === 0
        ? { id: 'u-snezana', name: 'Snežana Popović' }
        : { id: 'u-marko', name: 'Marko Đorđević' },
    own,
    at: at(index < 12 ? YESTERDAY : TODAY, `${hour}:${minute}`),
    text: DIARY[index % DIARY.length] ?? '',
  }
})

/** The employment contract questions (the example screen uses the full set). */
export const CONTRACT_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'type',
    title: 'What type of contract?',
    type: 'single',
    options: [
      { value: 'indefinite', label: 'Indefinite term', next: 'start' },
      { value: 'fixed', label: 'Fixed term', description: 'Ends on a set date', next: 'end' },
    ],
  },
  { id: 'end', title: 'When does it end?', type: 'date' },
  {
    id: 'reason',
    title: 'Why a fixed term?',
    description: 'Written into the contract.',
    type: 'single',
    options: [
      { value: 'project', label: 'A project with an end date' },
      { value: 'replacement', label: 'Replacing an absent employee' },
      { value: 'other', label: 'Other reason', other: true },
    ],
    otherLabel: 'Reason',
  },
  { id: 'start', title: 'When does the employee start?', type: 'date' },
  {
    id: 'place',
    title: 'Where will the employee work?',
    type: 'single',
    next: 'salary',
    options: [
      { value: 'office', label: 'Office, Novi Sad' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid', next: 'days' },
    ],
  },
  {
    id: 'days',
    title: 'How many office days per week?',
    type: 'number',
    decimals: 0,
    fieldLabel: 'Office days per week',
  },
  {
    id: 'salary',
    title: 'Gross monthly salary',
    type: 'amount',
    currency: 'RSD',
    next: null,
  },
]

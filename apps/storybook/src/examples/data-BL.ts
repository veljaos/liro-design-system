/*
 * Group BL's example data (P5.67, CRM): Kvadrat Gradnja d.o.o.'s sales on 14 October 2026 at
 * 09:40, seen by Milena Jović, sales engineer (data-AJ). The pipeline runs lead → opportunity →
 * quote → won / lost; the quotes are group AV's (PON-2026-0027 … 0034, `/sales/quotes/…`), and
 * the featured deal OPP-2026-038 "Precast stairs for building B" is the one whose quote
 * PON-2026-0031 Stanogradnja Plus d.o.o. accepted on 01.10.2026. Its contact is Vesna Ilić
 * (procurement, Stanogradnja Plus; she received delivery note OTP-2026-0058 in group AV). Every
 * value, probability, rule and count is the application's, written here as decimal strings and
 * words. Invented; e-mails at example.com; phone numbers illustrative. Not part of the package.
 */
import { AV_ROUTES } from './data-AV'

export const BL_TODAY = '2026-10-14'
export const BL_NOW = '09:40'

export const BL_ROUTES = {
  pipeline: '/crm/pipeline',
  /** OPP-2026-037 dropped on Lost: the application asks why first. */
  pipelineLost: '/crm/pipeline?lost=OPP-2026-037',
  deal: '/crm/deals/OPP-2026-038',
  contact: '/crm/contacts/vesna-ilic',
  /** A call being logged on Vesna Ilić's page. */
  contactLog: '/crm/contacts/vesna-ilic?log=open',
  activities: '/crm/activities',
  calendar: '/crm/activities/calendar',
} as const

export const SALES_ENGINEER = {
  name: 'Milena Jović',
  email: 'milena.jovic@kvadratgradnja.example.com',
}

// ── Deals ─────────────────────────────────────────────────────────────────────────────────────

export type DealStage = 'lead' | 'opportunity' | 'quote' | 'won' | 'lost'

export const DEAL_STAGES: { id: DealStage; title: string; word: string }[] = [
  { id: 'lead', title: 'Leads', word: 'Lead' },
  { id: 'opportunity', title: 'Opportunities', word: 'Opportunity' },
  { id: 'quote', title: 'Quotes', word: 'Quote' },
  { id: 'won', title: 'Won', word: 'Won' },
  { id: 'lost', title: 'Lost', word: 'Lost' },
]

export const DEAL_TONES = {
  Lead: 'neutral',
  Opportunity: 'info',
  Quote: 'warning',
  Won: 'success',
  Lost: 'danger',
} as const

export interface DealQuote {
  number: string
  state: string
  /** Its page in the sales chain (group AV): the quote itself, or the list of quotes. */
  path: string
}

export interface Deal {
  id: string
  title: string
  customer: string
  owner: string
  /** The value the application has, a decimal string; null when not estimated yet. */
  value: string | null
  /** The next activity, the application's words, and its date. */
  next?: { text: string; due: string }
  quote?: DealQuote
  /** A closed deal's line, the application's words. */
  closed?: string
}

const QUOTES_LIST = AV_ROUTES.quotes

export const DEALS: Deal[] = [
  {
    id: 'LEAD-2026-019',
    title: 'Warehouse hall, 1,200 m²',
    customer: 'Panonija Agro d.o.o.',
    owner: 'Dragan Ilić',
    value: '18500000.00',
    next: { text: 'Call', due: '2026-10-15' },
  },
  {
    id: 'LEAD-2026-020',
    title: 'Office refurbishment, second floor',
    customer: 'Medic Lab Niš d.o.o.',
    owner: 'Milena Jović',
    value: null,
    next: { text: 'Meeting', due: '2026-10-20' },
  },
  {
    id: 'LEAD-2026-021',
    title: 'Precast fence panels, 240 m',
    customer: 'Bojović i sinovi d.o.o.',
    owner: 'Petar Vuković',
    value: '640000.00',
  },
  {
    id: 'OPP-2026-040',
    title: 'Heat substation foundations, Detelinara',
    customer: 'Gradska toplana Novi Sad',
    owner: 'Petar Vuković',
    value: '1284000.00',
    next: { text: 'Site visit', due: '2026-10-16' },
    quote: { number: 'PON-2026-0034', state: 'Draft', path: QUOTES_LIST },
  },
  {
    id: 'OPP-2026-042',
    title: 'Silo foundations',
    customer: 'Vojvođanka Mlin a.d.',
    owner: 'Dragan Ilić',
    value: '7800000.00',
    next: { text: 'Call', due: '2026-10-14' },
  },
  {
    id: 'OPP-2026-038',
    title: 'Precast stairs for building B',
    customer: 'Stanogradnja Plus d.o.o.',
    owner: 'Milena Jović',
    value: '549120.00',
    next: { text: 'Call', due: '2026-10-14' },
    quote: { number: 'PON-2026-0031', state: 'Accepted', path: AV_ROUTES.quote },
  },
  {
    id: 'OPP-2026-039',
    title: 'Precast balcony slabs for building C',
    customer: 'Stanogradnja Plus d.o.o.',
    owner: 'Milena Jović',
    value: '688800.00',
    next: { text: 'Revised quote', due: '2026-10-13' },
    quote: { number: 'PON-2026-0032', state: 'Sent', path: QUOTES_LIST },
  },
  {
    id: 'OPP-2026-037',
    title: 'Formwork rental, 60 days',
    customer: 'Novi Dom Invest d.o.o.',
    owner: 'Petar Vuković',
    value: '342000.00',
    next: { text: 'Call', due: '2026-10-16' },
    quote: { number: 'PON-2026-0033', state: 'Sent', path: QUOTES_LIST },
  },
  {
    id: 'OPP-2026-033',
    title: 'Ready-mix concrete deliveries, September',
    customer: 'Stanogradnja Plus d.o.o.',
    owner: 'Milena Jović',
    value: '914400.00',
    quote: { number: 'PON-2026-0027', state: 'Ordered', path: QUOTES_LIST },
    closed: 'Won 03.09.2026',
  },
  {
    id: 'OPP-2026-035',
    title: 'Trench works, Bulevar Evrope',
    customer: 'Gradska toplana Novi Sad',
    owner: 'Petar Vuković',
    value: '2160000.00',
    quote: { number: 'PON-2026-0029', state: 'Declined', path: QUOTES_LIST },
    closed: 'Lost 30.09.2026 · Price',
  },
  {
    id: 'OPP-2026-034',
    title: 'Site office containers, 6 months',
    customer: 'Projektni biro Linija',
    owner: 'Milena Jović',
    value: '216000.00',
    quote: { number: 'PON-2026-0030', state: 'Expired', path: QUOTES_LIST },
    closed: 'Lost 08.10.2026 · No answer',
  },
]

export interface StageIds {
  id: DealStage
  title: string
  cards: { id: string }[]
}

export function initialPipeline(): StageIds[] {
  const ids: Record<DealStage, string[]> = {
    lead: ['LEAD-2026-019', 'LEAD-2026-020', 'LEAD-2026-021'],
    opportunity: ['OPP-2026-042', 'OPP-2026-040'],
    quote: ['OPP-2026-038', 'OPP-2026-039', 'OPP-2026-037'],
    won: ['OPP-2026-033'],
    lost: ['OPP-2026-034', 'OPP-2026-035'],
  }
  return DEAL_STAGES.map((stage) => ({
    id: stage.id,
    title: stage.title,
    cards: ids[stage.id].map((id) => ({ id })),
  }))
}

/** The application's rule: a deal is won when its quote is accepted or ordered. */
export const WINNING_QUOTE_STATES: readonly string[] = ['Accepted', 'Ordered']

export const LOST_REASONS = [
  { value: 'price', label: 'Price' },
  { value: 'timing', label: 'Timing' },
  { value: 'competitor', label: 'Chose a competitor' },
  { value: 'no-answer', label: 'No answer' },
]

export const FEATURED_DEAL = 'OPP-2026-038'

/** The featured deal's details, the application's. */
export const DEAL_DETAILS = {
  probability: '90%',
  expectedClose: '2026-10-15',
  source: 'Existing customer',
  created: '2026-09-15',
  contact: 'Vesna Ilić',
}

// ── Vesna Ilić ────────────────────────────────────────────────────────────────────────────────

export const CONTACT = {
  name: 'Vesna Ilić',
  position: 'Procurement manager',
  company: 'Stanogradnja Plus d.o.o.',
  email: 'vesna.ilic@stanogradnja.example.com',
  phone: '021 555 0177 (illustrative)',
  address: 'Narodnog fronta 73, 21000 Novi Sad',
  owner: 'Milena Jović',
  prefers: 'Phone in the morning, quotes by e-mail',
  /** The application's sums and dates. */
  openValue: '1237920.00',
  lastContact: '2026-10-13',
}

export const CONTACT_DEALS = ['OPP-2026-038', 'OPP-2026-039']

export const CONTACT_QUOTES = ['PON-2026-0032', 'PON-2026-0031', 'PON-2026-0027']

// ── Activities ────────────────────────────────────────────────────────────────────────────────

export type ActivityKind = 'Call' | 'Meeting' | 'E-mail' | 'Task'

export interface CrmActivity {
  id: string
  kind: ActivityKind
  subject: string
  /** The contact or company it is with; `contact` links Vesna Ilić's page. */
  with: string
  contact?: boolean
  deal?: string
  /** Timed: local start and end; a task: its due day. */
  start: string
  end?: string
  owner: string
  state: 'Planned' | 'Done'
}

export const ACTIVITIES: CrmActivity[] = [
  {
    id: 'a1',
    kind: 'Call',
    subject: 'Confirm the delivery date of the stairs',
    with: 'Vesna Ilić, Stanogradnja Plus d.o.o.',
    contact: true,
    deal: 'OPP-2026-038',
    start: '2026-10-14T11:00',
    end: '2026-10-14T11:15',
    owner: 'Milena Jović',
    state: 'Planned',
  },
  {
    id: 'a2',
    kind: 'Task',
    subject: 'Send the revised balcony quote',
    with: 'Vesna Ilić, Stanogradnja Plus d.o.o.',
    contact: true,
    deal: 'OPP-2026-039',
    start: '2026-10-13',
    owner: 'Milena Jović',
    state: 'Planned',
  },
  {
    id: 'a3',
    kind: 'Call',
    subject: 'Silo foundations: the soil report',
    with: 'Marija Horvat, Vojvođanka Mlin a.d.',
    deal: 'OPP-2026-042',
    start: '2026-10-14T14:00',
    end: '2026-10-14T14:30',
    owner: 'Dragan Ilić',
    state: 'Planned',
  },
  {
    id: 'a4',
    kind: 'Call',
    subject: 'Warehouse hall: first call',
    with: 'Siniša Babić, Panonija Agro d.o.o.',
    deal: 'LEAD-2026-019',
    start: '2026-10-15T10:00',
    end: '2026-10-15T10:30',
    owner: 'Dragan Ilić',
    state: 'Planned',
  },
  {
    id: 'a5',
    kind: 'Task',
    subject: 'Ask Beton Mix for precast lead times',
    with: 'Beton Mix d.o.o.',
    deal: 'OPP-2026-039',
    start: '2026-10-15',
    owner: 'Milena Jović',
    state: 'Planned',
  },
  {
    id: 'a6',
    kind: 'Meeting',
    subject: 'Site visit, Detelinara substation',
    with: 'Zoran Kovač, Gradska toplana Novi Sad',
    deal: 'OPP-2026-040',
    start: '2026-10-16T09:00',
    end: '2026-10-16T10:30',
    owner: 'Petar Vuković',
    state: 'Planned',
  },
  {
    id: 'a7',
    kind: 'Call',
    subject: 'Formwork rental: follow-up',
    with: 'Novi Dom Invest d.o.o.',
    deal: 'OPP-2026-037',
    start: '2026-10-16T11:00',
    end: '2026-10-16T11:15',
    owner: 'Petar Vuković',
    state: 'Planned',
  },
  {
    id: 'a8',
    kind: 'Meeting',
    subject: 'Walk-through of the second floor',
    with: 'Ana Stević, Medic Lab Niš d.o.o.',
    deal: 'LEAD-2026-020',
    start: '2026-10-20T13:00',
    end: '2026-10-20T14:00',
    owner: 'Milena Jović',
    state: 'Planned',
  },
  {
    id: 'a9',
    kind: 'Meeting',
    subject: 'Building C: the balconies on site',
    with: 'Vesna Ilić, Stanogradnja Plus d.o.o.',
    contact: true,
    deal: 'OPP-2026-039',
    start: '2026-10-13T09:00',
    end: '2026-10-13T10:00',
    owner: 'Milena Jović',
    state: 'Done',
  },
  {
    id: 'a10',
    kind: 'E-mail',
    subject: 'Quote PON-2026-0032 sent',
    with: 'Vesna Ilić, Stanogradnja Plus d.o.o.',
    contact: true,
    deal: 'OPP-2026-039',
    start: '2026-10-06T10:10',
    end: '2026-10-06T10:10',
    owner: 'Milena Jović',
    state: 'Done',
  },
  {
    id: 'a11',
    kind: 'Call',
    subject: 'After the acceptance: delivery on 12.10.',
    with: 'Vesna Ilić, Stanogradnja Plus d.o.o.',
    contact: true,
    deal: 'OPP-2026-038',
    start: '2026-10-01T13:30',
    end: '2026-10-01T13:45',
    owner: 'Milena Jović',
    state: 'Done',
  },
]

export const ACTIVITY_VIEWS = [
  { id: 'mine', label: 'My planned' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
] as const

export const ACTIVITY_KINDS = [
  { value: 'Call', label: 'Call' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Task', label: 'Task' },
]

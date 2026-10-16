/*
 * Group BF's example data (P5.68, the registry book — delovodnik): Kvadrat Gradnja d.o.o.'s
 * registry book for 2026 on 14 October 2026 at 09:40, kept by Ana Marić. Incoming, outgoing and
 * internal acts with their number from the book, the date entered, the sender or recipient, the
 * act's own number and date, the subject, who works on it, the due date and the state in the
 * application's words; each linked to its documents (group BE) and files. Entries are never
 * deleted: a wrong subject is corrected by a new entry that refers to it. Every name, number and
 * authority is invented and illustrative; e-mail addresses at example.com. No classes here.
 */
import type { Attachment, ActivityEntry } from '@veljaos/ui'
import { BE_ROUTES, LEAVE_NUMBER } from './data-BE'

export const BF_TODAY = '2026-10-14'

const BASE = '/records/registry'

export const BF_ROUTES = {
  /** The book for 2026. */
  book: BASE,
  /** Only the incoming acts that are not done. */
  open: `${BASE}?open`,
  /** An entry: the labour inspection's request, overdue. */
  entry: `${BASE}/405`,
  /** Any entry by its number. */
  entryOf: (number: string) => `${BASE}/${number}`,
  /** A new entry. */
  newEntry: `${BASE}/new`,
} as const

export type RegistryKind = 'Incoming' | 'Outgoing' | 'Internal'

/** The states and their tones: the application's words and map. */
export const REGISTRY_TONES = {
  'In progress': 'info',
  'Awaiting reply': 'warning',
  Overdue: 'danger',
  Answered: 'success',
  Sent: 'success',
  Filed: 'neutral',
  Corrected: 'neutral',
} as const

export type RegistryState = keyof typeof REGISTRY_TONES

export interface RegistryEntry {
  /** The number in the book ("405"). */
  number: string
  /** The date it was entered. */
  entered: string
  kind: RegistryKind
  /** The sender (incoming) or the recipient (outgoing); internal: the unit. */
  party: string
  /** The act's own number: the sender's, or ours ("01-412/2026"). */
  actNumber: string
  /** The act's own date. */
  actDate: string
  subject: string
  /** The classification mark of the archive's plan (group BG). */
  classification: string
  assignee: string
  /** When an answer or the work is due; null when none is. */
  due: string | null
  /** Done: the due date is settled. */
  done: boolean
  state: RegistryState
  /** The document this entry is (group BE) or that answers it. */
  document?: { label: string; href: string }
  /** How many files are filed with it. */
  files: number
  corrects?: string
  correctedBy?: string
}

const e = (entry: RegistryEntry) => entry

export const REGISTRY: RegistryEntry[] = [
  e({
    number: '398',
    entered: '2026-10-05',
    kind: 'Incoming',
    party: 'Gradska toplana Novi Sad',
    actNumber: 'GT-2026-3318',
    actDate: '2026-10-02',
    subject: 'Request for the heating connection schedule, Residential building Liman 4',
    classification: '04.2',
    assignee: 'Snežana Popović',
    due: '2026-10-16',
    done: false,
    state: 'In progress',
    files: 1,
  }),
  e({
    number: '399',
    entered: '2026-10-05',
    kind: 'Outgoing',
    party: 'Beton Mix d.o.o.',
    actNumber: '01-399/2026',
    actDate: '2026-10-05',
    subject: 'Complaint about delivery note OTP-7741, concrete class',
    classification: '05.1',
    assignee: 'Marko Đorđević',
    due: null,
    done: true,
    state: 'Sent',
    files: 2,
  }),
  e({
    number: '400',
    entered: '2026-10-06',
    kind: 'Internal',
    party: 'Human resources',
    actNumber: '01-400/2026',
    actDate: '2026-10-06',
    subject: 'Annual leave plan for the fourth quarter',
    classification: '02.3',
    assignee: 'Jelena Marković',
    due: null,
    done: true,
    state: 'Filed',
    files: 1,
  }),
  e({
    number: '401',
    entered: '2026-10-07',
    kind: 'Incoming',
    party: 'Stanogradnja Plus d.o.o.',
    actNumber: 'SP-114/26',
    actDate: '2026-10-06',
    subject: 'Offer for joint works on Bulevar Evrope 24',
    classification: '05.3',
    assignee: 'Dragan Ilić',
    due: '2026-10-21',
    done: false,
    state: 'In progress',
    files: 3,
  }),
  e({
    number: '402',
    entered: '2026-10-07',
    kind: 'Incoming',
    party: 'Tax administration, Novi Sad branch (illustrative)',
    actNumber: '47-00-1182/2026',
    actDate: '2026-10-05',
    subject: 'Notice of a field check of the VAT records for July and August',
    classification: '03.4',
    assignee: 'Milica Petrović',
    due: '2026-10-20',
    done: false,
    state: 'Awaiting reply',
    files: 1,
  }),
  e({
    number: '403',
    entered: '2026-10-08',
    kind: 'Outgoing',
    party: 'Supervisory board',
    actNumber: '01-403/2026',
    actDate: '2026-10-08',
    subject: 'Invitation to the 4th meeting of the supervisory board',
    classification: '01.2',
    assignee: 'Ana Marić',
    due: null,
    done: true,
    state: 'Sent',
    files: 4,
  }),
  e({
    number: '404',
    entered: '2026-10-08',
    kind: 'Incoming',
    party: 'Elektro Sistem d.o.o.',
    actNumber: 'ES-2026-0541',
    actDate: '2026-10-07',
    subject: 'Change of the delivery address for cable trays',
    classification: '05.1',
    assignee: 'Ivan Lukić',
    due: null,
    done: true,
    state: 'Answered',
    files: 1,
  }),
  e({
    number: '405',
    entered: '2026-10-09',
    kind: 'Incoming',
    party: 'Labour inspection, Novi Sad (illustrative)',
    actNumber: '114-02-388/2026-07',
    actDate: '2026-10-08',
    subject: 'Request for the site documentation of Residential building Liman 4',
    classification: '02.6',
    assignee: 'Jelena Marković',
    due: '2026-10-12',
    done: false,
    state: 'Overdue',
    document: { label: 'Reply, draft letter', href: `#${BE_ROUTES.draft('letter')}` },
    files: 2,
  }),
  e({
    number: '406',
    entered: '2026-10-09',
    kind: 'Internal',
    party: 'Finance',
    actNumber: '01-406/2026',
    actDate: '2026-10-09',
    subject: 'Report on the third quarter for the supervisory board',
    classification: '03.1',
    assignee: 'Milica Petrović',
    due: null,
    done: true,
    state: 'Filed',
    files: 1,
  }),
  e({
    number: '407',
    entered: '2026-10-12',
    kind: 'Incoming',
    party: 'Donau Bau GmbH',
    actNumber: 'DB-2026-118',
    actDate: '2026-10-08',
    subject: 'Enquiry for facade panels',
    classification: '05.3',
    assignee: 'Dragan Ilić',
    due: '2026-10-15',
    done: false,
    state: 'In progress',
    document: { label: 'Business letter, draft', href: `#${BE_ROUTES.businessLetter}` },
    files: 1,
  }),
  e({
    number: '408',
    entered: '2026-10-12',
    kind: 'Incoming',
    party: 'Knjigovodstvo Jelić',
    actNumber: 'KJ-REQ-2026-118',
    actDate: '2026-10-12',
    subject: 'Documents for the September close',
    classification: '03.1',
    assignee: 'Tamara Simić',
    due: '2026-10-13',
    done: false,
    state: 'Overdue',
    files: 0,
  }),
  e({
    number: '409',
    entered: '2026-10-13',
    kind: 'Outgoing',
    party: 'Gradska toplana Novi Sad',
    actNumber: '01-409/2026',
    actDate: '2026-10-13',
    subject: 'Heating connection schedule, Bulevar Evrope 24',
    classification: '04.2',
    assignee: 'Snežana Popović',
    due: null,
    done: true,
    state: 'Corrected',
    correctedBy: '411',
    files: 1,
  }),
  e({
    number: '410',
    entered: '2026-10-13',
    kind: 'Outgoing',
    party: 'Supervisory board',
    actNumber: '01-410/2026',
    actDate: '2026-10-13',
    subject: 'Minutes of the 4th meeting of the supervisory board',
    classification: '01.2',
    assignee: 'Ana Marić',
    due: null,
    done: false,
    state: 'In progress',
    files: 2,
  }),
  e({
    number: '411',
    entered: '2026-10-13',
    kind: 'Outgoing',
    party: 'Gradska toplana Novi Sad',
    actNumber: '01-409/2026',
    actDate: '2026-10-13',
    subject:
      'Heating connection schedule, Residential building Liman 4 (the subject of no. 409 entered wrongly)',
    classification: '04.2',
    assignee: 'Snežana Popović',
    due: null,
    done: true,
    state: 'Sent',
    corrects: '409',
    files: 1,
  }),
  e({
    number: '412',
    entered: '2026-10-14',
    kind: 'Outgoing',
    party: 'Nikola Marković',
    actNumber: LEAVE_NUMBER,
    actDate: '2026-10-14',
    subject: 'Decision on annual leave for 2026',
    classification: '02.3',
    assignee: 'Milica Petrović',
    due: null,
    done: false,
    state: 'In progress',
    document: { label: `Decision ${LEAVE_NUMBER}`, href: `#${BE_ROUTES.leaveSigning}` },
    files: 1,
  }),
]

export function registryEntry(number: string): RegistryEntry | undefined {
  return REGISTRY.find((entry) => entry.number === number)
}

/** What the book counts: entries in 2026 (the application's figure). */
export const REGISTRY_COUNT = 412

/** The next number the book gives (the application's). */
export const NEXT_REGISTRY_NUMBER = '415'

/** The labour inspection's request: its files and its history. */
export const ENTRY_405_FILES: Attachment[] = [
  {
    id: 'scan',
    name: 'Zahtev-inspekcija-114-02-388.pdf',
    sizeText: '412 KB',
    state: 'available',
  },
  {
    id: 'list',
    name: 'Spisak-trazene-dokumentacije.pdf',
    sizeText: '96 KB',
    state: 'available',
  },
]

export const ENTRY_405_ACTIVITY: ActivityEntry[] = [
  {
    key: 'a3',
    author: 'Jelena Marković',
    time: '13.10.2026. 15:20',
    text: 'Asked Snežana Popović for the site diary and the safety plan; the reply is drafted.',
  },
  {
    key: 'a2',
    author: 'Ana Marić',
    time: '09.10.2026. 10:05',
    text: 'Assigned to Jelena Marković, due 12.10.2026.',
  },
  {
    key: 'a1',
    author: 'Ana Marić',
    time: '09.10.2026. 09:58',
    text: 'Entered as no. 405 from registered post received 09.10.2026.',
  },
]

/** The application's choices for a new entry. */
export const CLASSIFICATIONS = [
  { value: '01.2', label: '01.2 Company bodies' },
  { value: '02.3', label: '02.3 Employment and leave' },
  { value: '02.6', label: '02.6 Safety at work' },
  { value: '03.1', label: '03.1 Accounting and reports' },
  { value: '03.4', label: '03.4 Taxes' },
  { value: '04.2', label: '04.2 Construction sites' },
  { value: '05.1', label: '05.1 Purchasing' },
  { value: '05.3', label: '05.3 Sales and offers' },
]

export const ASSIGNEES = [
  { value: 'ana', label: 'Ana Marić' },
  { value: 'milica', label: 'Milica Petrović' },
  { value: 'jelena', label: 'Jelena Marković' },
  { value: 'snezana', label: 'Snežana Popović' },
  { value: 'dragan', label: 'Dragan Ilić' },
  { value: 'marko', label: 'Marko Đorđević' },
]

export const RECEIVED_BY = [
  { value: 'post', label: 'Registered post' },
  { value: 'email', label: 'E-mail' },
  { value: 'hand', label: 'In person' },
  { value: 'courier', label: 'Courier' },
]

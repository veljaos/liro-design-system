/*
 * Group BH's example data (P5.70, meetings of company bodies): Kvadrat Gradnja d.o.o. on 14 October
 * 2026 at 09:40. Its bodies are the general assembly (the sole member, Kvadrat Holding d.o.o.,
 * represented by its director) and a supervisory board of five. The schedule, the 4th meeting of
 * the supervisory board (8 October: the invitation and its materials, who came, the quorum, the
 * votes on each item and the result in the application's words, the minutes and decisions to
 * sign) and the 5th (22 October: the invitation sent, the answers). Every count, quorum and result
 * is the application's; names are invented (the board members are not staff); the rules are
 * illustrative. No classes here.
 */
import type { Attachment, Signer } from '@veljaos/ui'
import { BE_ROUTES } from './data-BE'

export const BH_TODAY = '2026-10-14'

const BASE = '/records/meetings'

export const BH_ROUTES = {
  list: BASE,
  /** The 4th meeting of the supervisory board, held; the minutes being signed. */
  held: `${BASE}/SB-4-2026`,
  /** The same meeting while it ran: item 4 not yet voted on. */
  voting: `${BASE}/SB-4-2026?voting`,
  /** The same, the votes on item 4 being recorded. */
  recording: `${BASE}/SB-4-2026?voting&record=4`,
  /** The 5th meeting: the invitation sent, the members' answers. */
  invited: `${BASE}/SB-5-2026`,
} as const

export const MEETING_TONES = {
  'Invitation sent': 'info',
  'Invitation draft': 'neutral',
  'Minutes to sign': 'warning',
  'Minutes signed': 'success',
  'In session': 'info',
} as const

export type MeetingState = keyof typeof MEETING_TONES

export interface Meeting {
  id: string
  route?: string
  body: 'General assembly' | 'Supervisory board'
  title: string
  date: string
  time: string
  place: string
  state: MeetingState
  /** The application's line about attendance or answers. */
  attendance: string
}

export const MEETINGS: Meeting[] = [
  {
    id: 'GA-3-2026',
    body: 'General assembly',
    title: '3rd meeting of the general assembly',
    date: '2026-10-30',
    time: '12:00',
    place: 'Kvadrat Holding d.o.o., Novi Sad',
    state: 'Invitation draft',
    attendance: 'To be sent by 23.10.2026.',
  },
  {
    id: 'SB-5-2026',
    route: BH_ROUTES.invited,
    body: 'Supervisory board',
    title: '5th meeting of the supervisory board',
    date: '2026-10-22',
    time: '10:00',
    place: 'Meeting room, Bulevar oslobođenja 102',
    state: 'Invitation sent',
    attendance: '3 of 5 confirmed',
  },
  {
    id: 'SB-4-2026',
    route: BH_ROUTES.held,
    body: 'Supervisory board',
    title: '4th meeting of the supervisory board',
    date: '2026-10-08',
    time: '10:00',
    place: 'Meeting room, Bulevar oslobođenja 102',
    state: 'Minutes to sign',
    attendance: '4 of 5 present, quorum',
  },
  {
    id: 'SB-3-2026',
    body: 'Supervisory board',
    title: '3rd meeting of the supervisory board',
    date: '2026-07-15',
    time: '10:00',
    place: 'Meeting room, Bulevar oslobođenja 102',
    state: 'Minutes signed',
    attendance: '5 of 5 present, quorum',
  },
  {
    id: 'GA-2-2026',
    body: 'General assembly',
    title: '2nd meeting of the general assembly',
    date: '2026-06-29',
    time: '12:00',
    place: 'Kvadrat Holding d.o.o., Novi Sad',
    state: 'Minutes signed',
    attendance: 'The sole member represented, quorum',
  },
  {
    id: 'SB-2-2026',
    body: 'Supervisory board',
    title: '2nd meeting of the supervisory board',
    date: '2026-04-21',
    time: '10:00',
    place: 'Online, by video call',
    state: 'Minutes signed',
    attendance: '4 of 5 present, quorum',
  },
]

// ── The 4th meeting of the supervisory board ──────────────────────────────────────────────────

export const SB4 = {
  number: 'SB-4/2026',
  invitation: '01-403/2026',
  invitationSent: '2026-10-01',
  minutes: '01-410/2026',
  quorum: '4 of 5 members present: the board may decide (at least 3 members).',
  majority: 'A decision is adopted by a majority of the members present (illustrative rules).',
}

export type Attendance = 'Present' | 'Absent, excused' | 'Present by video'

export interface Member {
  id: string
  name: string
  role: string
  attendance: Attendance
  /** Their answer to the next meeting's invitation. */
  answer: 'Confirmed' | 'Not answered' | 'Apologised'
}

export const BOARD: Member[] = [
  {
    id: 'vesna',
    name: 'Vesna Radović',
    role: 'Chair',
    attendance: 'Present',
    answer: 'Confirmed',
  },
  {
    id: 'bojan',
    name: 'Bojan Kovač',
    role: 'Member',
    attendance: 'Present',
    answer: 'Confirmed',
  },
  {
    id: 'jasmina',
    name: 'Jasmina Lukić',
    role: 'Member',
    attendance: 'Present by video',
    answer: 'Not answered',
  },
  {
    id: 'djordje',
    name: 'Đorđe Pantić',
    role: 'Member',
    attendance: 'Present',
    answer: 'Confirmed',
  },
  {
    id: 'mirjana',
    name: 'Mirjana Tasić',
    role: 'Independent member',
    attendance: 'Absent, excused',
    answer: 'Apologised',
  },
]

export type Vote = 'For' | 'Against' | 'Abstain'

export interface AgendaItem {
  number: string
  title: string
  /** Who presents it. */
  presenter: string
  materials: Attachment[]
  /** The votes by member id; null: not voted on (yet), or nothing to vote on. */
  votes: Readonly<Record<string, Vote>> | null
  /** The counts, the application's. */
  counts: { for: string; against: string; abstain: string } | null
  /** The result in the application's words. */
  result: string | null
  resultTone: 'success' | 'danger' | 'neutral' | null
  /** The decision made under the item, a document of group BE. */
  decision?: { label: string; href: string }
}

const file = (id: string, name: string, sizeText: string): Attachment => ({
  id,
  name,
  sizeText,
  state: 'available',
})

const FOUR_FOR = { vesna: 'For', bojan: 'For', jasmina: 'For', djordje: 'For' } as const

export const AGENDA: AgendaItem[] = [
  {
    number: '1',
    title: 'Minutes of the 3rd meeting',
    presenter: 'Vesna Radović',
    materials: [file('m1', 'Zapisnik-NO-3-2026.pdf', '188 KB')],
    votes: FOUR_FOR,
    counts: { for: '4', against: '0', abstain: '0' },
    result: 'Adopted unanimously',
    resultTone: 'success',
  },
  {
    number: '2',
    title: 'Report on the third quarter',
    presenter: 'Milica Petrović',
    materials: [
      file('m2a', 'Izvestaj-Q3-2026.pdf', '1,2 MB'),
      file('m2b', 'Bilans-uspeha-Q3-2026.xlsx', '64 KB'),
    ],
    votes: null,
    counts: null,
    result: 'Noted, no vote',
    resultTone: 'neutral',
  },
  {
    number: '3',
    title: 'Residential building Liman 4: the facade contract with Novosadske fasade d.o.o.',
    presenter: 'Goran Medić',
    materials: [
      file('m3a', 'Ugovor-fasada-Liman4-nacrt.pdf', '540 KB'),
      file('m3b', 'Uporedne-ponude-fasada.pdf', '320 KB'),
    ],
    votes: { vesna: 'For', bojan: 'For', jasmina: 'Abstain', djordje: 'Against' },
    counts: { for: '2', against: '1', abstain: '1' },
    result: 'Not adopted: 2 of 4 present for, a majority needs 3',
    resultTone: 'danger',
  },
  {
    number: '4',
    title: 'Rulebook on business travel',
    presenter: 'Jelena Marković',
    materials: [file('m4', 'Pravilnik-sluzbena-putovanja-nacrt.pdf', '210 KB')],
    votes: { vesna: 'For', bojan: 'For', jasmina: 'For', djordje: 'Abstain' },
    counts: { for: '3', against: '0', abstain: '1' },
    result: 'Adopted: 3 of 4 present for',
    resultTone: 'success',
    decision: { label: 'Rulebook on business travel', href: `#${BE_ROUTES.draft('rulebook')}` },
  },
]

/** While the meeting ran: item 4 not yet voted on. */
export const AGENDA_VOTING: AgendaItem[] = AGENDA.map((item) =>
  item.number === '4'
    ? { ...item, votes: null, counts: null, result: null, resultTone: null }
    : item,
)

/** The application's answer to item 4's votes as the story records them. */
export const ITEM_4 = AGENDA.find((item) => item.number === '4')

export const MINUTES_SIGNERS: Signer[] = [
  {
    id: 'vesna',
    name: 'Vesna Radović',
    role: 'Chair',
    state: 'signed',
    at: '2026-10-13T16:40:00+02:00',
  },
  { id: 'ana', name: 'Ana Marić', role: 'Minutes taken by', state: 'waiting' },
]

/** The 5th meeting's agenda, as the invitation lists it. */
export const SB5_AGENDA = [
  'Minutes of the 4th meeting',
  'Residential building Liman 4: the facade contract, the amended draft',
  'The plan for 2027, first reading',
]

export const SB5_INVITATION = '01-417/2026'

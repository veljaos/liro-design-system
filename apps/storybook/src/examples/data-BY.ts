/*
 * Group BY's example data (P5.84, screening): the potential matches the application found when it
 * screened Knjigovodstvo Jelić's clients and their people against the Illustrative sanctions
 * list, the Illustrative PEP list and the Illustrative watch list, on 14 October 2026 at 06:00
 * and before. Each match holds the client's record and the listed entry side by side, as the
 * application lines them up and marks them, and the application's score; the decision (True
 * match / False positive) is the compliance officer's, with the reason the application requires.
 * Also each client's re-screening history. The library and the screens never match, score or
 * decide. Every person, entity, list entry and reason is invented; no real listed or political
 * person. Not part of the package. No classes here.
 */
import type { ConfirmReason, HistoryEntry, Tone } from '@veljaos/ui'
import { amlAt, type AmlList } from './data-aml'

export type HitState = 'To decide' | 'False positive' | 'True match'

export const HIT_TONES: Record<HitState, Tone> = {
  'To decide': 'warning',
  'False positive': 'neutral',
  'True match': 'danger',
}

/** One line of the side-by-side comparison, marked by the application. */
export interface HitLine {
  id: string
  label: string
  /** The client's record; null when the record has no such value. */
  client: string | null
  /** The listed entry; null when the list gives none. */
  listed: string | null
  /** The kind of value, so the screen writes it (a date through `format`). */
  kind?: 'date'
  /** The application says the two differ. */
  differs?: boolean
  /** The result in the application's words. */
  note?: string
}

export interface HitDecision {
  state: 'False positive' | 'True match'
  reason: string
  details: string
  by: string
  at: string
}

export interface ScreeningHit {
  id: string
  clientId: string
  /** The screened party: the client itself or one of its people. */
  party: { name: string; role: string }
  list: AmlList['id']
  /** The application's score of the match, out of 100. */
  score: string
  /** When the application raised it. */
  found: string
  /** The listed entry as the list gives it. */
  entry: {
    name: string
    reference: string
    kind: string
    listedSince: string
    /** Why the entry is listed, or the public function (PEP), in the list's words. */
    reason: string
  }
  lines: readonly HitLine[]
  /** The application's summary of the comparison. */
  summary: string
  /** What a true match means for the client, in the application's words. */
  consequence: string
  state: HitState
  decision?: HitDecision
}

/** The potential matches, newest first (the application's order). */
export const SCREENING_HITS: readonly ScreeningHit[] = [
  {
    id: 'SH-2026-0414',
    clientId: 'panonija',
    party: { name: 'Milorad Petković', role: 'Beneficial owner, 60%' },
    list: 'pep',
    score: '96',
    found: amlAt('2026-10-14', '06:00'),
    entry: {
      name: 'Milorad Petković',
      reference: 'IPL-0882',
      kind: 'Domestic politically exposed person',
      listedSince: '2024-07-01',
      reason: 'Deputy mayor of the Illustrative Municipality of Ravno Polje since 01.07.2024.',
    },
    lines: [
      {
        id: 'name',
        label: 'Name',
        client: 'Milorad Petković',
        listed: 'Milorad Petković',
        note: 'Same',
      },
      {
        id: 'birth',
        label: 'Date of birth',
        client: '1962-03-14',
        listed: '1962-03-14',
        kind: 'date',
        note: 'Same',
      },
      {
        id: 'residence',
        label: 'Place of residence',
        client: 'Kać, Serbia',
        listed: 'Kać, Serbia',
        note: 'Same',
      },
      {
        id: 'citizenship',
        label: 'Citizenship',
        client: 'Serbia',
        listed: 'Serbia',
        note: 'Same',
      },
    ],
    summary: 'Name, date of birth, residence and citizenship are the same.',
    consequence:
      'The owner becomes a politically exposed person: the client needs the source of wealth, enhanced monitoring and the director’s approval to go on, and a new risk assessment.',
    state: 'To decide',
  },
  {
    id: 'SH-2026-0413',
    clientId: 'adria',
    party: { name: 'Meridian Trade Holdings Ltd', role: 'Owner, 100%' },
    list: 'sanctions',
    score: '82',
    found: amlAt('2026-10-14', '06:00'),
    entry: {
      name: 'Meridian Trading Holdings Limited',
      reference: 'ISL-ENT-0219',
      kind: 'Entity',
      listedSince: '2024-02-12',
      reason: 'A front company of a listed group (illustrative).',
    },
    lines: [
      {
        id: 'name',
        label: 'Name',
        client: 'Meridian Trade Holdings Ltd',
        listed: 'Meridian Trading Holdings Limited',
        differs: true,
        note: 'Similar, not the same',
      },
      {
        id: 'country',
        label: 'Country of registration',
        client: 'Cyprus',
        listed: 'Cyprus',
        note: 'Same',
      },
      {
        id: 'number',
        label: 'Registration number',
        client: 'HE 412877',
        listed: 'HE 398120',
        differs: true,
        note: 'Different',
      },
      {
        id: 'founded',
        label: 'Incorporated',
        client: '2018-04-11',
        listed: '2017-09-02',
        kind: 'date',
        differs: true,
        note: 'Different',
      },
    ],
    summary: 'A similar name in the same country; the registration number and date differ.',
    consequence:
      'The client’s owner is a listed entity: the relationship and every transaction stop at once, and the authority is told.',
    state: 'To decide',
  },
  {
    id: 'SH-2026-0412',
    clientId: 'kvadrat',
    party: { name: 'Nenad Kovačević', role: 'Director and beneficial owner, 70%' },
    list: 'sanctions',
    score: '74',
    found: amlAt('2026-10-14', '06:00'),
    entry: {
      name: 'Nenad KOVACEVIC',
      reference: 'ISL-IND-0457',
      kind: 'Individual',
      listedSince: '2019-06-03',
      reason: 'Trade in arms with listed parties (illustrative).',
    },
    lines: [
      {
        id: 'name',
        label: 'Name',
        client: 'Nenad Kovačević',
        listed: 'Nenad KOVACEVIC',
        note: 'Same, without diacritics',
      },
      {
        id: 'birth',
        label: 'Date of birth',
        client: '1974-05-18',
        listed: '1961-11-02',
        kind: 'date',
        differs: true,
        note: 'Different',
      },
      {
        id: 'birthplace',
        label: 'Place of birth',
        client: 'Novi Sad',
        listed: 'Kraljevo',
        differs: true,
        note: 'Different',
      },
      {
        id: 'document',
        label: 'Identity document',
        client: 'ID card no. 009812345',
        listed: 'Passport no. 0083321',
        differs: true,
        note: 'Different',
      },
    ],
    summary: 'The same name; the date and place of birth and the document differ.',
    consequence:
      'The client’s director is a listed person: the relationship and every transaction stop at once, and the authority is told.',
    state: 'To decide',
  },
  {
    id: 'SH-2026-0411',
    clientId: 'stanic',
    party: { name: 'Milan Stanić', role: 'Entrepreneur, owner 100%' },
    list: 'watch',
    score: '61',
    found: amlAt('2026-10-13', '06:00'),
    entry: {
      name: 'Milan Stanic',
      reference: 'IWL-0031',
      kind: 'Individual',
      listedSince: '2026-10-12',
      reason: 'Named in news about a fraud in a road-works tender (illustrative).',
    },
    lines: [
      {
        id: 'name',
        label: 'Name',
        client: 'Milan Stanić',
        listed: 'Milan Stanic',
        note: 'Same, without diacritics',
      },
      {
        id: 'birth',
        label: 'Date of birth',
        client: '1969-09-05',
        listed: null,
        kind: 'date',
        note: 'Not on the list',
      },
      {
        id: 'city',
        label: 'City',
        client: 'Novi Sad',
        listed: 'Niš',
        differs: true,
        note: 'Different',
      },
      {
        id: 'activity',
        label: 'Activity',
        client: 'Electrical installation',
        listed: 'Road construction',
        differs: true,
        note: 'Different',
      },
    ],
    summary: 'The same name; the city and the activity differ; the list gives no date of birth.',
    consequence:
      'The client is named in adverse news: the application asks for a new risk assessment and enhanced monitoring.',
    state: 'To decide',
  },
  {
    id: 'SH-2026-0398',
    clientId: 'drina',
    party: { name: 'Nenad Ilić', role: 'Director and owner, 100%' },
    list: 'watch',
    score: '58',
    found: amlAt('2026-10-09', '06:00'),
    entry: {
      name: 'Nenad Ilic',
      reference: 'IWL-0027',
      kind: 'Individual',
      listedSince: '2026-10-08',
      reason: 'Named in news about smuggling fuel (illustrative).',
    },
    lines: [
      {
        id: 'name',
        label: 'Name',
        client: 'Nenad Ilić',
        listed: 'Nenad Ilic',
        note: 'Same, without diacritics',
      },
      {
        id: 'birth',
        label: 'Date of birth',
        client: '1977-03-12',
        listed: '1990-06-21',
        kind: 'date',
        differs: true,
        note: 'Different',
      },
      {
        id: 'city',
        label: 'City',
        client: 'Loznica',
        listed: 'Subotica',
        differs: true,
        note: 'Different',
      },
    ],
    summary: 'The same name; the date of birth and the city differ.',
    consequence:
      'The client is named in adverse news: the application asks for a new risk assessment and enhanced monitoring.',
    state: 'False positive',
    decision: {
      state: 'False positive',
      reason: 'Different date of birth',
      details: 'The listed person is 13 years younger and lives in Subotica.',
      by: 'Marko Jelić',
      at: amlAt('2026-10-09', '11:25'),
    },
  },
]

/** The reasons the application accepts for a false positive. */
export const FALSE_POSITIVE_REASONS: readonly ConfirmReason[] = [
  { value: 'birth', label: 'Different date of birth' },
  { value: 'document', label: 'Different identity document' },
  { value: 'registration', label: 'Different company registration' },
  { value: 'country', label: 'Different country or residence' },
  { value: 'other', label: 'Another reason, in the details' },
]

/** The reasons the application accepts for a true match. */
export const TRUE_MATCH_REASONS: readonly ConfirmReason[] = [
  { value: 'same', label: 'Same name, date of birth and residence' },
  { value: 'document', label: 'Confirmed with the identity document' },
  { value: 'public', label: 'Confirmed by a public source' },
  { value: 'other', label: 'Another reason, in the details' },
]

/** The two decisions of the examples, as the application records them. */
export const EXAMPLE_DECISIONS: Readonly<Record<string, HitDecision>> = {
  'SH-2026-0412': {
    state: 'False positive',
    reason: 'Different date of birth',
    details: 'Born 18.05.1974 in Novi Sad; the listed person was born 02.11.1961 in Kraljevo.',
    by: 'Snežana Jelić',
    at: amlAt('2026-10-14', '09:40'),
  },
  'SH-2026-0414': {
    state: 'True match',
    reason: 'Same name, date of birth and residence',
    details: 'Milorad Petković confirmed his office when asked about the source of his wealth.',
    by: 'Snežana Jelić',
    at: amlAt('2026-10-14', '09:40'),
  },
}

/** The hits after the examples' two decisions (the "decided" view's starting point). */
export function decidedHits(hits: readonly ScreeningHit[]): ScreeningHit[] {
  return hits.map((hit) => {
    const decision = EXAMPLE_DECISIONS[hit.id]
    return decision === undefined ? hit : { ...hit, state: decision.state, decision }
  })
}

/**
 * A client's earlier screenings, as the application logs them (newest first). The decisions on
 * its matches are added from the matches themselves (`decision`).
 */
export const RESCREENING: Readonly<Record<string, readonly HistoryEntry[]>> = {
  kvadrat: [
    {
      id: 'kv-s3',
      at: amlAt('2026-10-14', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened after the Illustrative sanctions list update 2026/41: 1 potential match (Nenad Kovačević, score 74).',
    },
    {
      id: 'kv-s2',
      at: amlAt('2026-10-07', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened against 3 lists: no potential matches.',
    },
    {
      id: 'kv-s1',
      at: amlAt('2026-09-30', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened against 3 lists: no potential matches.',
    },
  ],
  adria: [
    {
      id: 'ad-s2',
      at: amlAt('2026-10-14', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened after the Illustrative sanctions list update 2026/41: 1 potential match (Meridian Trade Holdings Ltd, score 82).',
    },
    {
      id: 'ad-s1',
      at: amlAt('2026-08-25', '13:20'),
      actor: { name: 'Marko Jelić' },
      text: 'Screened when taken on: no potential matches.',
    },
  ],
  panonija: [
    {
      id: 'pa-s2',
      at: amlAt('2026-10-14', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened after the Illustrative PEP list edition 14.10: 1 potential match (Milorad Petković, score 96).',
    },
    {
      id: 'pa-s1',
      at: amlAt('2026-10-07', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened against 3 lists: no potential matches.',
    },
  ],
  stanic: [
    {
      id: 'st-s1',
      at: amlAt('2026-10-13', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened after the Illustrative watch list update 2026/41: 1 potential match (Milan Stanić, score 61).',
    },
  ],
  drina: [
    {
      id: 'dr-s1',
      at: amlAt('2026-10-09', '06:00'),
      actor: { name: 'Liro screening', kind: 'system' },
      text: 'Screened after the Illustrative watch list update 2026/40: 1 potential match (Nenad Ilić, score 58).',
    },
  ],
}

/** The weekly screening every client has without a match. */
export function rescreening(clientId: string): readonly HistoryEntry[] {
  return (
    RESCREENING[clientId] ?? [
      {
        id: `${clientId}-s1`,
        at: amlAt('2026-10-14', '06:00'),
        actor: { name: 'Liro screening', kind: 'system' },
        text: 'Screened against 3 lists: no potential matches.',
      },
      {
        id: `${clientId}-s0`,
        at: amlAt('2026-10-07', '06:00'),
        actor: { name: 'Liro screening', kind: 'system' },
        text: 'Screened against 3 lists: no potential matches.',
      },
    ]
  )
}

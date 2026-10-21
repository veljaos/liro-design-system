/*
 * The AML compliance module's shared example data (P5.82–P5.88). Knjigovodstvo Jelić, an
 * accounting firm in Novi Sad, is the obligated entity: it knows its clients (identification,
 * documents, beneficial owners, politically exposed persons, the source of funds), assesses
 * each client's risk, screens the clients and their people against lists, and keeps the record.
 * Today is 14 October 2026, 09:40 in Belgrade; Snežana Jelić, the compliance officer, is signed
 * in (Marko Jelić is her deputy).
 *
 * What is here, for every AML screen (groups BW, BX, BY and the later P5.85–P5.88 screens):
 * - `AML_ROUTES`: every address of the module, under `/aml/…`. A later group adds its own routes
 *   in its own file and its tab in `AML_TABS` (aml-shared.tsx).
 * - `AML_FIRM`, `AML_OFFICER`, `AML_DEPUTY`, `AML_STAFF`, `AML_AUTHORITY`, `AML_LISTS`: who is
 *   obliged, who answers for it, the authority and the lists (all illustrative).
 * - `AML_CLIENTS` (and `amlClient(id)`): the clients as the application keeps them — the
 *   identification, the representative, the documents with their validity, the owners as a tree
 *   with their shares, PEP status, the source of funds and wealth, the risk in force with the
 *   assessment it came from (factors, points, score, band; an override with its reason), the
 *   next review, the review history and the last screening.
 * - The tones of the risk, the KYC state and the PEP status, in the application's words.
 *
 * Every risk, factor, point, score, band, share, state, date and match is the application's,
 * played here: the screens and the components never score, match, rank or decide. The clients
 * of data-V keep their names and tax numbers; Adria Commodities d.o.o. is invented for this
 * module. Every person, number, list and entry is invented; national ID numbers are
 * illustrative; e-mail addresses at example.com. Not part of the package. No classes here.
 */
import type { HierarchyNode, HistoryEntry, Tone } from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const AML_ROUTES = {
  /** The clients, as the compliance officer sees them (ListPage). */
  clients: '/aml/clients',
  /** The same list on its "Review due" view. */
  clientsReviewDue: '/aml/clients?view=review-due',
  /** A client's file (KYC). */
  client: (id: string) => `/aml/clients/${id}`,
  /** Kvadrat Gradnja d.o.o.'s file with the representative's national ID asked for. */
  clientReveal: '/aml/clients/kvadrat?reveal=ask',
  /** A client's risk assessment: the result in force. */
  risk: (id: string) => `/aml/clients/${id}/risk`,
  /** Kvadrat Gradnja d.o.o.'s assessment with "Override risk" asked, to High. */
  riskOverride: '/aml/clients/kvadrat/risk?override=High',
  /** A client's risk questionnaire (a new assessment or the periodic review). */
  review: (id: string) => `/aml/clients/${id}/risk/review`,
  /** Kvadrat Gradnja d.o.o.'s questionnaire on its summary, every answer given. */
  reviewSummary: '/aml/clients/kvadrat/risk/review?step=summary',
  /** A client's screening results and the re-screening history. */
  clientScreening: (id: string) => `/aml/clients/${id}/screening`,
  /** The potential matches to decide, one by one (WorklistPage). */
  screening: '/aml/screening',
  /** The queue with one potential match chosen. */
  screeningHit: (id: string) => `/aml/screening?hit=${id}`,
  /** The queue with a decision asked on a match. */
  screeningDecide: (id: string, decision: 'false-positive' | 'true-match') =>
    `/aml/screening?hit=${id}&decide=${decision}`,
  /** The queue after the two decisions of the examples (a false positive, a true match). */
  screeningDecided: '/aml/screening?view=decided',
} as const

// ── Now ───────────────────────────────────────────────────────────────────────────────────────

export const AML_TODAY = '2026-10-14'
export const AML_NOW = '2026-10-14T09:40:00+02:00'

/** An instant in Belgrade in 2026 (summer time until 25 October). */
export function amlAt(date: string, time: string): string {
  return `${date}T${time}:00+02:00`
}

// ── Who ───────────────────────────────────────────────────────────────────────────────────────

export const AML_FIRM = {
  name: 'Knjigovodstvo Jelić',
  taxId: '110583224',
  city: 'Novi Sad',
  clientCount: 214,
}

export interface AmlStaffMember {
  id: string
  name: string
  /** The person's role in the module, in the application's words. */
  role: string
  email: string
}

/** The compliance officer: the signed-in user of the examples. */
export const AML_OFFICER: AmlStaffMember = {
  id: 'snezana',
  name: 'Snežana Jelić',
  role: 'Compliance officer',
  email: 'snezana.jelic@example.com',
}

/** The compliance officer's deputy. */
export const AML_DEPUTY: AmlStaffMember = {
  id: 'marko',
  name: 'Marko Jelić',
  role: 'Deputy compliance officer',
  email: 'marko.jelic@example.com',
}

/** Everyone at the firm who works with clients (P5.88: their training records). */
export const AML_STAFF: readonly AmlStaffMember[] = [
  AML_OFFICER,
  AML_DEPUTY,
  {
    id: 'ivana',
    name: 'Ivana Simić',
    role: 'Accountant',
    email: 'ivana.simic@example.com',
  },
]

/** The authority reports go to (P5.87): always said as illustrative. */
export const AML_AUTHORITY = 'the illustrative financial intelligence unit'

export type AmlListKind = 'Sanctions' | 'PEP' | 'Watch list'

export interface AmlList {
  id: 'sanctions' | 'pep' | 'watch'
  name: string
  kind: AmlListKind
  /** When the application last loaded the list. */
  updated: string
  /** The list's version as the application names it. */
  version: string
}

/** The lists the application screens against (invented). */
export const AML_LISTS: readonly AmlList[] = [
  {
    id: 'sanctions',
    name: 'Illustrative sanctions list',
    kind: 'Sanctions',
    updated: amlAt('2026-10-13', '22:00'),
    version: 'Update 2026/41',
  },
  {
    id: 'pep',
    name: 'Illustrative PEP list',
    kind: 'PEP',
    updated: amlAt('2026-10-12', '22:00'),
    version: 'Edition 14.10',
  },
  {
    id: 'watch',
    name: 'Illustrative watch list',
    kind: 'Watch list',
    updated: amlAt('2026-10-13', '22:00'),
    version: 'Update 2026/41',
  },
]

export function amlList(id: AmlList['id']): AmlList {
  const list = AML_LISTS.find((each) => each.id === id)
  if (list === undefined) throw new Error(`No list ${id}`)
  return list
}

// ── Words and tones ───────────────────────────────────────────────────────────────────────────

export type AmlRisk = 'Low' | 'Medium' | 'High'

/** The risk in words and tone, never colour alone. */
export const AML_RISK_TONES: Record<AmlRisk, Tone> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
}

/** How often each risk is reviewed, in the application's words. */
export const AML_REVIEW_CYCLE: Record<AmlRisk, string> = {
  Low: 'Every 3 years',
  Medium: 'Every year',
  High: 'Every 6 months',
}

export type KycState = 'Complete' | 'Review due' | 'Documents expired' | 'Incomplete'

export const AML_KYC_TONES: Record<KycState, Tone> = {
  Complete: 'success',
  'Review due': 'warning',
  'Documents expired': 'danger',
  Incomplete: 'warning',
}

export type PepStatus = 'Not a PEP' | 'PEP' | 'Potential match'

export const AML_PEP_TONES: Record<PepStatus, Tone> = {
  'Not a PEP': 'neutral',
  PEP: 'warning',
  'Potential match': 'warning',
}

export type FactorEffect = 'Higher risk' | 'Standard' | 'Lower risk'

export const AML_FACTOR_TONES: Record<FactorEffect, Tone> = {
  'Higher risk': 'warning',
  Standard: 'neutral',
  'Lower risk': 'neutral',
}

export type DocumentState = 'Valid' | 'Expires soon' | 'Expired' | 'Older than 12 months'

export const AML_DOCUMENT_TONES: Record<DocumentState, Tone> = {
  Valid: 'neutral',
  'Expires soon': 'warning',
  Expired: 'danger',
  'Older than 12 months': 'warning',
}

// ── Clients ───────────────────────────────────────────────────────────────────────────────────

/** A natural person the firm identified (a representative, an owner). */
export interface AmlPerson {
  name: string
  /** The person's role at the client ("Director", "Owner"). */
  role: string
  /** YYYY-MM-DD; shown only after a reason (MaskedValue). */
  dateOfBirth: string
  /** The national ID number (JMBG, illustrative); shown only after a reason. */
  nationalId: string
  citizenship: string
  /** The identification document, in the application's words ("ID card no. 009812345"). */
  idDocument: string
  /** How and when the firm identified the person, in the application's words. */
  identified: string
}

/** A document of the client file, with its validity as the application judges it. */
export interface AmlDocument {
  id: string
  /** What it is ("ID card of Nenad Kovačević"). */
  title: string
  /** The file's name. */
  file: string
  sizeText: string
  /** When it was issued, YYYY-MM-DD. */
  issued: string
  /** Valid until (an identity document), YYYY-MM-DD; null when it does not expire. */
  validUntil: string | null
  /** The application's verdict. */
  state: DocumentState
}

/**
 * One factor of an assessment: the question, the client's answer, and what the application's
 * matrix made of it (its words and its points). Never computed by the screens.
 */
export interface AmlFactor {
  id: string
  factor: string
  answer: string
  effect: FactorEffect
  /** The application's points, as it writes them ("+20", "0"). */
  points: string
  /** Why, in the application's words. */
  note?: string
}

/** A risk set by a person over the assessment's, with the reason the application requires. */
export interface AmlOverride {
  level: AmlRisk
  reason: string
  details: string
  by: string
  on: string
}

/** One risk assessment, as the application returned it. */
export interface AmlAssessment {
  id: string
  /** When it was made, YYYY-MM-DD. */
  on: string
  by: string
  /** The risk the assessment gave. */
  level: AmlRisk
  /** The application's score and its scale. */
  score: string
  scale: string
  /** The band the score falls in, in the application's words ("Medium: 30–59 points"). */
  band: string
  /** The application's method ("Illustrative risk matrix, version 2026-01"). */
  method: string
  factors: readonly AmlFactor[]
  /** The next review the assessment set, YYYY-MM-DD. */
  nextReview: string
  override?: AmlOverride
}

/** The risk in force: an override's, else the assessment's. */
export function riskInForce(assessment: AmlAssessment): AmlRisk {
  return assessment.override?.level ?? assessment.level
}

/**
 * An owner in the client's ownership tree. The client itself is the top node; each owner hangs
 * under what it owns, with the share on the line (HierarchyChart's `lineLabel`).
 */
export interface AmlOwner {
  id: string
  /** What it owns: the client's id or another owner's. */
  owns: string
  kind: 'company' | 'person' | 'unknown'
  name: string
  /** The share of what it owns, as the register writes it ("70%"). */
  share: string
  /** A third line: the tax number, the country. */
  detail: string
  /** A beneficial owner by the application's rule, with the share in its words. */
  beneficial?: string
  pep?: PepStatus
  country?: string
}

export interface AmlClient {
  id: string
  name: string
  taxId: string
  registration: string
  legalForm: string
  address: string
  /** The activity code and its name. */
  activity: string
  clientSince: string
  /** The accountant who keeps the client. */
  accountant: string
  contact: string
  representative: AmlPerson
  /** The assessment in force (its override included). */
  assessment: AmlAssessment
  /** The earlier assessments and reviews, as history entries. */
  history: readonly HistoryEntry[]
  kyc: KycState
  /** Why the state is what it is, in the application's words. */
  kycNote?: string
  /** What the file lacks, in the application's words. */
  missing?: readonly string[]
  pep: { status: PepStatus; note: string }
  sourceOfFunds: string
  sourceOfWealth: string
  purpose: string
  expectedActivity: string
  documents: readonly AmlDocument[]
  owners: readonly AmlOwner[]
  /** The application's rule for beneficial owners, in its words. */
  ownersNote: string
  screening: {
    /** The last run over the client and its people. */
    lastRun: string
    /** Potential matches still to decide. */
    open: number
    /** The application's summary ("1 potential match to decide"). */
    note: string
  }
}

const METHOD = 'Illustrative risk matrix, version 2026-01'
const BAND: Record<AmlRisk, string> = {
  Low: 'Low: 0–29 points',
  Medium: 'Medium: 30–59 points',
  High: 'High: 60 points and more',
}
const OWNERS_RULE =
  'A beneficial owner holds 25% or more of the client, directly or through other companies, or controls it otherwise.'
const LAST_RUN = amlAt('2026-10-14', '06:00')

/** A factor, in the matrix's words. */
function factor(
  id: string,
  name: string,
  answer: string,
  effect: FactorEffect,
  points: string,
  note?: string,
): AmlFactor {
  return { id, factor: name, answer, effect, points, ...(note === undefined ? {} : { note }) }
}

function document(
  id: string,
  title: string,
  file: string,
  sizeText: string,
  issued: string,
  validUntil: string | null,
  state: DocumentState,
): AmlDocument {
  return { id, title, file, sizeText, issued, validUntil, state }
}

/** A history entry of the application's (screening, a scheduled review) or of a person. */
function event(
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

const KVADRAT_FACTORS: readonly AmlFactor[] = [
  factor('client-type', 'Client type', 'Limited liability company', 'Standard', '+5'),
  factor(
    'activity',
    'Activity',
    'Construction',
    'Higher risk',
    '+20',
    'Large payments to subcontractors; some suppliers paid in cash.',
  ),
  factor('country', 'Countries of business', 'Serbia only', 'Standard', '0'),
  factor(
    'ownership',
    'Ownership',
    'Through a company in Serbia; every owner known',
    'Standard',
    '+10',
  ),
  factor('products', 'Services used', 'Bookkeeping, payroll and tax returns', 'Standard', '+5'),
  factor('channel', 'How the client was taken on', 'In person', 'Lower risk', '0'),
]

/** Kvadrat Gradnja d.o.o.: medium risk, its yearly review due since 01.10.2026. */
const KVADRAT: AmlClient = {
  id: 'kvadrat',
  name: 'Kvadrat Gradnja d.o.o.',
  taxId: '108452317',
  registration: '21045873',
  legalForm: 'Limited liability company',
  address: 'Bulevar oslobođenja 102, 21000 Novi Sad',
  activity: '41.20 Construction of residential and non-residential buildings',
  clientSince: '2022-03-15',
  accountant: 'Snežana Jelić',
  contact: 'Milica Petrović',
  representative: {
    name: 'Nenad Kovačević',
    role: 'Director',
    dateOfBirth: '1974-05-18',
    nationalId: '1805974800017',
    citizenship: 'Serbia',
    idDocument: 'ID card no. 009812345',
    identified: 'In person at the firm, 15.03.2022, by Snežana Jelić',
  },
  assessment: {
    id: 'RA-2025-0187',
    on: '2025-10-01',
    by: 'Snežana Jelić',
    level: 'Medium',
    score: '40',
    scale: '100',
    band: BAND.Medium,
    method: 'Illustrative risk matrix, version 2025-01',
    factors: KVADRAT_FACTORS,
    nextReview: '2026-10-01',
  },
  history: [
    event(
      'kv-h3',
      amlAt('2025-10-01', '11:20'),
      'Snežana Jelić',
      'Yearly review: the risk stays Medium (40 points).',
    ),
    event(
      'kv-h2',
      amlAt('2024-09-27', '14:05'),
      'Snežana Jelić',
      'Yearly review: construction counts as higher risk in the 2024 matrix.',
      [{ field: 'Risk', from: 'Low', to: 'Medium' }],
    ),
    event(
      'kv-h1',
      amlAt('2022-03-15', '10:00'),
      'Snežana Jelić',
      'Client taken on: identified in person, risk Low (25 points).',
    ),
  ],
  kyc: 'Review due',
  kycNote: 'The yearly review was due on 01.10.2026.',
  pep: {
    status: 'Not a PEP',
    note: 'No owner, director or representative is on the Illustrative PEP list.',
  },
  sourceOfFunds:
    'Revenue from construction contracts with companies and public bodies; a bank loan for the Residential building Liman 4 project.',
  sourceOfWealth: 'The owners’ earnings from the company since 2009.',
  purpose: 'Bookkeeping, payroll and tax returns.',
  expectedActivity:
    'Monthly turnover about 25–40 million RSD, by bank transfer; cash only for small purchases.',
  documents: [
    document(
      'kv-d1',
      'Business register extract',
      'Business register extract 2026-09-20.pdf',
      '182 KB',
      '2026-09-20',
      null,
      'Valid',
    ),
    document(
      'kv-d2',
      'ID card of Nenad Kovačević',
      'ID card Nenad Kovacevic.pdf',
      '96 KB',
      '2021-03-04',
      '2031-03-04',
      'Valid',
    ),
    document(
      'kv-d3',
      'Beneficial owners register extract',
      'Beneficial owners 2026-09-20.pdf',
      '74 KB',
      '2026-09-20',
      null,
      'Valid',
    ),
    document(
      'kv-d4',
      'Business register extract of Kvadrat Holding d.o.o.',
      'Kvadrat Holding register extract 2025-09-29.pdf',
      '168 KB',
      '2025-09-29',
      null,
      'Older than 12 months',
    ),
    document(
      'kv-d5',
      'Statement on beneficial owners, signed',
      'Statement on beneficial owners 2025.pdf',
      '212 KB',
      '2025-10-01',
      null,
      'Valid',
    ),
  ],
  owners: [
    {
      id: 'kv-holding',
      owns: 'kvadrat',
      kind: 'company',
      name: 'Kvadrat Holding d.o.o.',
      share: '100%',
      detail: 'PIB 112640583 · Serbia',
      country: 'Serbia',
    },
    {
      id: 'kv-nenad',
      owns: 'kv-holding',
      kind: 'person',
      name: 'Nenad Kovačević',
      share: '70%',
      detail: 'Serbia',
      beneficial: 'Indirectly 70%',
      pep: 'Not a PEP',
      country: 'Serbia',
    },
    {
      id: 'kv-vesna',
      owns: 'kv-holding',
      kind: 'person',
      name: 'Vesna Kovačević',
      share: '30%',
      detail: 'Serbia',
      beneficial: 'Indirectly 30%',
      pep: 'Not a PEP',
      country: 'Serbia',
    },
  ],
  ownersNote: OWNERS_RULE,
  screening: { lastRun: LAST_RUN, open: 1, note: '1 potential match to decide' },
}

/** Pekara Zlatni klas d.o.o.: low risk, everything in order. */
const ZLATNI_KLAS: AmlClient = {
  id: 'zlatni-klas',
  name: 'Pekara Zlatni klas d.o.o.',
  taxId: '112374905',
  registration: '21376540',
  legalForm: 'Limited liability company',
  address: 'Bulevar oslobođenja 46, 21000 Novi Sad',
  activity: '10.71 Manufacture of bread and fresh pastry',
  clientSince: '2023-06-01',
  accountant: 'Snežana Jelić',
  contact: 'Jovana Marković',
  representative: {
    name: 'Jovana Marković',
    role: 'Director and owner',
    dateOfBirth: '1986-11-02',
    nationalId: '0211986805024',
    citizenship: 'Serbia',
    idDocument: 'ID card no. 011245780',
    identified: 'In person at the firm, 01.06.2023, by Snežana Jelić',
  },
  assessment: {
    id: 'RA-2026-0098',
    on: '2026-06-10',
    by: 'Snežana Jelić',
    level: 'Low',
    score: '15',
    scale: '100',
    band: BAND.Low,
    method: METHOD,
    factors: [
      factor('client-type', 'Client type', 'Limited liability company', 'Standard', '+5'),
      factor('activity', 'Activity', 'Bakery with its own shop', 'Standard', '+5'),
      factor('country', 'Countries of business', 'Serbia only', 'Standard', '0'),
      factor('ownership', 'Ownership', 'Natural persons in Serbia, directly', 'Lower risk', '0'),
      factor('products', 'Services used', 'Bookkeeping and payroll', 'Standard', '+5'),
      factor('channel', 'How the client was taken on', 'In person', 'Lower risk', '0'),
    ],
    nextReview: '2029-06-10',
  },
  history: [
    event(
      'zk-h2',
      amlAt('2026-06-10', '09:30'),
      'Snežana Jelić',
      'Review after the new matrix: the risk stays Low (15 points).',
    ),
    event(
      'zk-h1',
      amlAt('2023-06-01', '12:00'),
      'Snežana Jelić',
      'Client taken on: identified in person, risk Low (15 points).',
    ),
  ],
  kyc: 'Complete',
  pep: {
    status: 'Not a PEP',
    note: 'No owner, director or representative is on the Illustrative PEP list.',
  },
  sourceOfFunds: 'Sales of bread and pastry in its own shop and to shops and cafés.',
  sourceOfWealth: 'The owner’s savings and a start-up loan repaid in 2025.',
  purpose: 'Bookkeeping and payroll.',
  expectedActivity:
    'Monthly turnover about 3–4 million RSD; cash from the shop deposited daily at the bank.',
  documents: [
    document(
      'zk-d1',
      'Business register extract',
      'Business register extract 2026-06-02.pdf',
      '154 KB',
      '2026-06-02',
      null,
      'Valid',
    ),
    document(
      'zk-d2',
      'ID card of Jovana Marković',
      'ID card Jovana Markovic.pdf',
      '88 KB',
      '2022-02-14',
      '2032-02-14',
      'Valid',
    ),
    document(
      'zk-d3',
      'Statement on beneficial owners, signed',
      'Statement on beneficial owners 2026.pdf',
      '198 KB',
      '2026-06-10',
      null,
      'Valid',
    ),
  ],
  owners: [
    {
      id: 'zk-jovana',
      owns: 'zlatni-klas',
      kind: 'person',
      name: 'Jovana Marković',
      share: '100%',
      detail: 'Serbia',
      beneficial: 'Directly 100%',
      pep: 'Not a PEP',
      country: 'Serbia',
    },
  ],
  ownersNote: OWNERS_RULE,
  screening: { lastRun: LAST_RUN, open: 0, note: 'No potential matches' },
}

/**
 * Adria Commodities d.o.o. (invented): a trader in metals owned through a holding abroad whose
 * owners of 60% are not disclosed; the assessment gave Medium, the compliance officer set High.
 */
const ADRIA: AmlClient = {
  id: 'adria',
  name: 'Adria Commodities d.o.o.',
  taxId: '113582046',
  registration: '21893617',
  legalForm: 'Limited liability company',
  address: 'Gospodar Jevremova 47, 11000 Beograd',
  activity: '46.72 Wholesale of metals and metal ores',
  clientSince: '2026-08-25',
  accountant: 'Marko Jelić',
  contact: 'Ognjen Rakočević',
  representative: {
    name: 'Ognjen Rakočević',
    role: 'Director',
    dateOfBirth: '1981-02-09',
    nationalId: 'Not issued (a foreign citizen)',
    citizenship: 'Montenegro',
    idDocument: 'Passport no. 7701294',
    identified: 'By video identification, 25.08.2026, by Marko Jelić',
  },
  assessment: {
    id: 'RA-2026-0164',
    on: '2026-09-30',
    by: 'Marko Jelić',
    level: 'Medium',
    score: '55',
    scale: '100',
    band: BAND.Medium,
    method: METHOD,
    factors: [
      factor('client-type', 'Client type', 'Limited liability company', 'Standard', '+5'),
      factor(
        'activity',
        'Activity',
        'Wholesale and trade in goods',
        'Higher risk',
        '+15',
        'Trade in scrap metal, with buyers in several countries.',
      ),
      factor(
        'country',
        'Countries of business',
        'Serbia and neighbouring countries',
        'Standard',
        '+5',
      ),
      factor(
        'ownership',
        'Ownership',
        'Through a company abroad; not every owner known',
        'Higher risk',
        '+20',
        'The holding has not named the owners of 60% of its shares.',
      ),
      factor(
        'products',
        'Services used',
        'Bookkeeping and handling the client’s payments',
        'Standard',
        '+5',
      ),
      factor(
        'channel',
        'How the client was taken on',
        'Remotely, with video identification',
        'Higher risk',
        '+5',
      ),
    ],
    nextReview: '2027-03-31',
    override: {
      level: 'High',
      reason: 'Ownership not fully known',
      details:
        'Meridian Trade Holdings Ltd has not named the owners of 60% of its shares. Until it does, the client is high risk.',
      by: 'Snežana Jelić',
      on: '2026-09-30',
    },
  },
  history: [
    event(
      'ad-h2',
      amlAt('2026-09-30', '16:10'),
      'Snežana Jelić',
      'Risk overridden: ownership not fully known.',
      [{ field: 'Risk', from: 'Medium', to: 'High' }],
    ),
    event(
      'ad-h1',
      amlAt('2026-09-30', '15:40'),
      'Marko Jelić',
      'First assessment: Medium (55 points).',
    ),
    event(
      'ad-h0',
      amlAt('2026-08-25', '13:15'),
      'Marko Jelić',
      'Client taken on: the director identified by video.',
    ),
  ],
  kyc: 'Incomplete',
  kycNote: 'The owners of 60% of Meridian Trade Holdings Ltd are not known.',
  missing: ['Statement on beneficial owners of Meridian Trade Holdings Ltd'],
  pep: {
    status: 'Not a PEP',
    note: 'No known owner, director or representative is on the Illustrative PEP list.',
  },
  sourceOfFunds: 'Sales of scrap metal and ores to buyers in Serbia and the region.',
  sourceOfWealth: 'Not documented yet: asked of the holding on 30.09.2026.',
  purpose: 'Bookkeeping and handling payments to suppliers.',
  expectedActivity:
    'Monthly turnover about 60–90 million RSD, by bank transfer; payments abroad in euros.',
  documents: [
    document(
      'ad-d1',
      'Business register extract',
      'Business register extract 2026-08-21.pdf',
      '146 KB',
      '2026-08-21',
      null,
      'Valid',
    ),
    document(
      'ad-d2',
      'Passport of Ognjen Rakočević',
      'Passport Ognjen Rakocevic.pdf',
      '102 KB',
      '2016-11-30',
      '2026-11-30',
      'Expires soon',
    ),
    document(
      'ad-d3',
      'Certificate of incorporation of Meridian Trade Holdings Ltd, translated',
      'Meridian certificate translated.pdf',
      '330 KB',
      '2026-08-20',
      null,
      'Valid',
    ),
  ],
  owners: [
    {
      id: 'ad-meridian',
      owns: 'adria',
      kind: 'company',
      name: 'Meridian Trade Holdings Ltd',
      share: '100%',
      detail: 'Registered in Cyprus',
      country: 'Cyprus',
    },
    {
      id: 'ad-ognjen',
      owns: 'ad-meridian',
      kind: 'person',
      name: 'Ognjen Rakočević',
      share: '40%',
      detail: 'Montenegro',
      beneficial: 'Indirectly 40%',
      pep: 'Not a PEP',
      country: 'Montenegro',
    },
    {
      id: 'ad-unknown',
      owns: 'ad-meridian',
      kind: 'unknown',
      name: 'Owners not disclosed',
      share: '60%',
      detail: 'Asked of the holding on 30.09.2026',
    },
  ],
  ownersNote: OWNERS_RULE,
  screening: { lastRun: LAST_RUN, open: 1, note: '1 potential match to decide' },
}

/** Panonija Agro d.o.o.: an owner's potential match on the Illustrative PEP list. */
const PANONIJA: AmlClient = {
  id: 'panonija',
  name: 'Panonija Agro d.o.o.',
  taxId: '104987265',
  registration: '20945112',
  legalForm: 'Limited liability company',
  address: 'Novosadski put 14, 21241 Kać',
  activity: '01.11 Growing of cereals, leguminous crops and oil seeds',
  clientSince: '2019-02-01',
  accountant: 'Snežana Jelić',
  contact: 'Petar Vuković',
  representative: {
    name: 'Petar Vuković',
    role: 'Director',
    dateOfBirth: '1979-07-23',
    nationalId: '2307979800045',
    citizenship: 'Serbia',
    idDocument: 'ID card no. 008765432',
    identified: 'In person at the firm, 01.02.2019, by Snežana Jelić',
  },
  assessment: {
    id: 'RA-2026-0061',
    on: '2026-04-15',
    by: 'Snežana Jelić',
    level: 'Medium',
    score: '35',
    scale: '100',
    band: BAND.Medium,
    method: METHOD,
    factors: [
      factor('client-type', 'Client type', 'Limited liability company', 'Standard', '+5'),
      factor(
        'activity',
        'Activity',
        'Agriculture and food',
        'Standard',
        '+10',
        'Seasonal cash purchases from farmers.',
      ),
      factor('country', 'Countries of business', 'Serbia and EU countries', 'Standard', '+5'),
      factor('ownership', 'Ownership', 'Natural persons in Serbia, directly', 'Lower risk', '0'),
      factor(
        'products',
        'Services used',
        'Bookkeeping, payroll, tax returns and handling the client’s payments',
        'Higher risk',
        '+15',
      ),
      factor('channel', 'How the client was taken on', 'In person', 'Lower risk', '0'),
    ],
    nextReview: '2027-04-15',
  },
  history: [
    event(
      'pa-h2',
      amlAt('2026-04-15', '10:45'),
      'Snežana Jelić',
      'Yearly review: the risk stays Medium (35 points).',
    ),
    event(
      'pa-h1',
      amlAt('2019-02-01', '09:00'),
      'Snežana Jelić',
      'Client taken on: identified in person, risk Medium.',
    ),
  ],
  kyc: 'Complete',
  pep: {
    status: 'Potential match',
    note: 'Milorad Petković, an owner, is a potential match on the Illustrative PEP list (to decide).',
  },
  sourceOfFunds: 'Sales of grain and oil seeds to mills and traders; EU-funded subsidies.',
  sourceOfWealth: 'The owners’ farmland and earnings from the company since 2004.',
  purpose: 'Bookkeeping, payroll, tax returns and payments to farmers.',
  expectedActivity:
    'Monthly turnover 10–60 million RSD by season; some purchases from farmers in cash.',
  documents: [
    document(
      'pa-d1',
      'Business register extract',
      'Business register extract 2026-04-10.pdf',
      '161 KB',
      '2026-04-10',
      null,
      'Valid',
    ),
    document(
      'pa-d2',
      'ID card of Petar Vuković',
      'ID card Petar Vukovic.pdf',
      '91 KB',
      '2019-01-20',
      '2029-01-20',
      'Valid',
    ),
    document(
      'pa-d3',
      'ID card of Milorad Petković',
      'ID card Milorad Petkovic.pdf',
      '93 KB',
      '2020-05-11',
      '2030-05-11',
      'Valid',
    ),
  ],
  owners: [
    {
      id: 'pa-milorad',
      owns: 'panonija',
      kind: 'person',
      name: 'Milorad Petković',
      share: '60%',
      detail: 'Serbia',
      beneficial: 'Directly 60%',
      pep: 'Potential match',
      country: 'Serbia',
    },
    {
      id: 'pa-petar',
      owns: 'panonija',
      kind: 'person',
      name: 'Petar Vuković',
      share: '40%',
      detail: 'Serbia',
      beneficial: 'Directly 40%',
      pep: 'Not a PEP',
      country: 'Serbia',
    },
  ],
  ownersNote: OWNERS_RULE,
  screening: { lastRun: LAST_RUN, open: 1, note: '1 potential match to decide' },
}

/** Stanić Elektro STR: a sole trader whose ID card expired on 05.09.2026. */
const STANIC: AmlClient = {
  id: 'stanic',
  name: 'Stanić Elektro STR',
  taxId: '112048376',
  registration: '66123987',
  legalForm: 'Entrepreneur',
  address: 'Cara Dušana 112, 21000 Novi Sad',
  activity: '43.21 Electrical installation',
  clientSince: '2021-11-20',
  accountant: 'Marko Jelić',
  contact: 'Milan Stanić',
  representative: {
    name: 'Milan Stanić',
    role: 'Entrepreneur',
    dateOfBirth: '1969-09-05',
    nationalId: '0509969800031',
    citizenship: 'Serbia',
    idDocument: 'ID card no. 005432198 (expired)',
    identified: 'In person at the firm, 20.11.2021, by Marko Jelić',
  },
  assessment: {
    id: 'RA-2024-0203',
    on: '2024-11-20',
    by: 'Marko Jelić',
    level: 'Low',
    score: '20',
    scale: '100',
    band: BAND.Low,
    method: 'Illustrative risk matrix, version 2024-01',
    factors: [
      factor('client-type', 'Client type', 'Entrepreneur', 'Standard', '+5'),
      factor('activity', 'Activity', 'Construction', 'Standard', '+10'),
      factor('country', 'Countries of business', 'Serbia only', 'Standard', '0'),
      factor('ownership', 'Ownership', 'Natural persons in Serbia, directly', 'Lower risk', '0'),
      factor('products', 'Services used', 'Bookkeeping and tax returns', 'Standard', '+5'),
      factor('channel', 'How the client was taken on', 'In person', 'Lower risk', '0'),
    ],
    nextReview: '2027-11-20',
  },
  history: [
    event(
      'st-h2',
      amlAt('2026-09-06', '06:00'),
      'Liro',
      'The ID card of Milan Stanić expired on 05.09.2026: the file needs a valid document.',
      [{ field: 'Client file', from: 'Complete', to: 'Documents expired' }],
    ),
    event(
      'st-h1',
      amlAt('2024-11-20', '12:30'),
      'Marko Jelić',
      'Review: the risk stays Low (20 points).',
    ),
  ],
  kyc: 'Documents expired',
  kycNote: 'The ID card of Milan Stanić expired on 05.09.2026.',
  missing: ['A valid ID card or passport of Milan Stanić'],
  pep: {
    status: 'Not a PEP',
    note: 'The entrepreneur is not on the Illustrative PEP list.',
  },
  sourceOfFunds: 'Payments for electrical installation work from companies and households.',
  sourceOfWealth: 'The entrepreneur’s earnings since 2010.',
  purpose: 'Bookkeeping and tax returns.',
  expectedActivity: 'Monthly turnover about 1–2 million RSD, by bank transfer.',
  documents: [
    document(
      'st-d1',
      'ID card of Milan Stanić',
      'ID card Milan Stanic.pdf',
      '84 KB',
      '2016-09-05',
      '2026-09-05',
      'Expired',
    ),
    document(
      'st-d2',
      'Business register extract',
      'Business register extract 2024-11-18.pdf',
      '120 KB',
      '2024-11-18',
      null,
      'Older than 12 months',
    ),
  ],
  owners: [
    {
      id: 'st-milan',
      owns: 'stanic',
      kind: 'person',
      name: 'Milan Stanić',
      share: '100%',
      detail: 'Serbia',
      beneficial: 'Directly 100%',
      pep: 'Not a PEP',
      country: 'Serbia',
    },
  ],
  ownersNote: OWNERS_RULE,
  screening: { lastRun: LAST_RUN, open: 0, note: 'No potential matches' },
}

/**
 * A client of data-V written briefly: one owner who is also the representative, a register
 * extract and an ID card, an assessment of three standard factors and the activity's. The score
 * is the application's, given here with the activity's points that make it.
 */
function briefClient(spec: {
  id: string
  name: string
  taxId: string
  registration: string
  address: string
  activity: string
  activityAnswer: string
  activityEffect: FactorEffect
  activityPoints: string
  level: AmlRisk
  score: string
  assessed: string
  nextReview: string
  clientSince: string
  accountant: string
  person: string
  dateOfBirth: string
  nationalId: string
  kyc?: KycState
  kycNote?: string
}): AmlClient {
  const legalForm = spec.name.endsWith('SZR') ? 'Entrepreneur' : 'Limited liability company'
  return {
    id: spec.id,
    name: spec.name,
    taxId: spec.taxId,
    registration: spec.registration,
    legalForm,
    address: spec.address,
    activity: spec.activity,
    clientSince: spec.clientSince,
    accountant: spec.accountant,
    contact: spec.person,
    representative: {
      name: spec.person,
      role: legalForm === 'Entrepreneur' ? 'Entrepreneur' : 'Director and owner',
      dateOfBirth: spec.dateOfBirth,
      nationalId: spec.nationalId,
      citizenship: 'Serbia',
      idDocument: 'ID card',
      identified: `In person at the firm, by ${spec.accountant}`,
    },
    assessment: {
      id: `RA-${spec.assessed.slice(0, 4)}-${spec.id}`,
      on: spec.assessed,
      by: spec.accountant,
      level: spec.level,
      score: spec.score,
      scale: '100',
      band: BAND[spec.level],
      method: METHOD,
      factors: [
        factor('client-type', 'Client type', legalForm, 'Standard', '+5'),
        factor(
          'activity',
          'Activity',
          spec.activityAnswer,
          spec.activityEffect,
          spec.activityPoints,
        ),
        factor('country', 'Countries of business', 'Serbia only', 'Standard', '0'),
        factor('ownership', 'Ownership', 'Natural persons in Serbia, directly', 'Lower risk', '0'),
        factor('products', 'Services used', 'Bookkeeping and payroll', 'Standard', '+5'),
        factor('channel', 'How the client was taken on', 'In person', 'Lower risk', '0'),
      ],
      nextReview: spec.nextReview,
    },
    history: [
      event(
        `${spec.id}-h1`,
        amlAt(spec.assessed, '10:00'),
        spec.accountant,
        `Assessment: ${spec.level} (${spec.score} points).`,
      ),
    ],
    kyc: spec.kyc ?? 'Complete',
    ...(spec.kycNote === undefined ? {} : { kycNote: spec.kycNote }),
    pep: {
      status: 'Not a PEP',
      note: 'No owner, director or representative is on the Illustrative PEP list.',
    },
    sourceOfFunds: 'Revenue from the client’s own business.',
    sourceOfWealth: 'The owner’s earnings from the business.',
    purpose: 'Bookkeeping and payroll.',
    expectedActivity: 'By bank transfer, in line with the client’s business.',
    documents: [
      document(
        `${spec.id}-d1`,
        'Business register extract',
        'Business register extract.pdf',
        '140 KB',
        spec.assessed,
        null,
        'Valid',
      ),
      document(
        `${spec.id}-d2`,
        `ID card of ${spec.person}`,
        'ID card.pdf',
        '90 KB',
        '2022-01-10',
        '2032-01-10',
        'Valid',
      ),
    ],
    owners: [
      {
        id: `${spec.id}-owner`,
        owns: spec.id,
        kind: 'person',
        name: spec.person,
        share: '100%',
        detail: 'Serbia',
        beneficial: 'Directly 100%',
        pep: 'Not a PEP',
        country: 'Serbia',
      },
    ],
    ownersNote: OWNERS_RULE,
    screening: { lastRun: LAST_RUN, open: 0, note: 'No potential matches' },
  }
}

const BRIEF: AmlClient[] = [
  briefClient({
    id: 'drina',
    name: 'Drina Prevoz d.o.o.',
    taxId: '101665092',
    registration: '20112458',
    address: 'Karađorđeva 9, 15300 Loznica',
    activity: '49.41 Freight transport by road',
    activityAnswer: 'Transport',
    activityEffect: 'Higher risk',
    activityPoints: '+20',
    level: 'Medium',
    score: '30',
    assessed: '2025-10-24',
    nextReview: '2026-10-24',
    clientSince: '2020-10-24',
    accountant: 'Marko Jelić',
    person: 'Nenad Ilić',
    dateOfBirth: '1977-03-12',
    nationalId: '1203977770019',
    kyc: 'Review due',
    kycNote: 'The yearly review is due on 24.10.2026.',
  }),
  briefClient({
    id: 'fruska',
    name: 'Hotel Fruška d.o.o.',
    taxId: '106234519',
    registration: '20587341',
    address: 'Vrdnik bb, 22408 Vrdnik',
    activity: '55.10 Hotels and similar accommodation',
    activityAnswer: 'Retail and hospitality',
    activityEffect: 'Higher risk',
    activityPoints: '+20',
    level: 'Medium',
    score: '30',
    assessed: '2026-02-12',
    nextReview: '2027-02-12',
    clientSince: '2021-02-12',
    accountant: 'Snežana Jelić',
    person: 'Ana Marić',
    dateOfBirth: '1983-08-30',
    nationalId: '3008983805010',
  }),
  briefClient({
    id: 'rakic',
    name: 'Rakić Pekara SZR',
    taxId: '111296603',
    registration: '64457812',
    address: 'Žarka Zrenjanina 21, 21000 Novi Sad',
    activity: '10.71 Manufacture of bread and fresh pastry',
    activityAnswer: 'Bakery with its own shop',
    activityEffect: 'Standard',
    activityPoints: '+5',
    level: 'Low',
    score: '15',
    assessed: '2025-03-04',
    nextReview: '2028-03-04',
    clientSince: '2022-03-04',
    accountant: 'Snežana Jelić',
    person: 'Dragana Rakić',
    dateOfBirth: '1990-01-17',
    nationalId: '1701990805033',
  }),
  briefClient({
    id: 'medic',
    name: 'Medic Lab Niš d.o.o.',
    taxId: '107819450',
    registration: '20673219',
    address: 'Bulevar Nemanjića 25, 18000 Niš',
    activity: '86.90 Other human health activities',
    activityAnswer: 'Health care',
    activityEffect: 'Standard',
    activityPoints: '+5',
    level: 'Low',
    score: '15',
    assessed: '2024-12-02',
    nextReview: '2027-12-02',
    clientSince: '2021-12-02',
    accountant: 'Snežana Jelić',
    person: 'Jelena Stojković',
    dateOfBirth: '1984-04-05',
    nationalId: '0504984735012',
  }),
  briefClient({
    id: 'bojovic',
    name: 'Bojović i sinovi d.o.o.',
    taxId: '109773148',
    registration: '21004726',
    address: 'Industrijska 7, 21000 Novi Sad',
    activity: '16.10 Sawmilling and planing of wood',
    activityAnswer: 'Manufacturing',
    activityEffect: 'Standard',
    activityPoints: '+5',
    level: 'Low',
    score: '15',
    assessed: '2024-05-20',
    nextReview: '2027-05-20',
    clientSince: '2018-05-20',
    accountant: 'Marko Jelić',
    person: 'Zoran Bojović',
    dateOfBirth: '1965-10-28',
    nationalId: '2810965800026',
  }),
]

/** The clients, in the application's order: high risk, then what is due, then the rest. */
export const AML_CLIENTS: readonly AmlClient[] = [
  ADRIA,
  KVADRAT,
  STANIC,
  PANONIJA,
  ...BRIEF.filter((client) => client.assessment.level === 'Medium'),
  ZLATNI_KLAS,
  ...BRIEF.filter((client) => client.assessment.level === 'Low'),
]

export function amlClient(id: string): AmlClient {
  const client = AML_CLIENTS.find((each) => each.id === id)
  if (client === undefined) throw new Error(`No AML client ${id}`)
  return client
}

/**
 * The client's ownership as HierarchyChart's nodes: the client on top, each owner under what it
 * owns with its share on the line, beneficial owners and PEP status as badges in words, an
 * undisclosed owner as a vacant node.
 */
export function ownershipNodes(client: AmlClient): HierarchyNode[] {
  return [
    {
      id: client.id,
      parentId: null,
      title: client.name,
      subtitle: 'Client',
      detail: `PIB ${client.taxId}`,
    },
    ...client.owners.map((owner): HierarchyNode => ({
      id: owner.id,
      parentId: owner.owns,
      title: owner.name,
      ...(owner.kind === 'person'
        ? { subtitle: owner.beneficial === undefined ? 'Owner' : 'Beneficial owner' }
        : owner.kind === 'company'
          ? { subtitle: 'Company' }
          : {}),
      detail: owner.detail,
      lineLabel: owner.share,
      ...(owner.kind === 'unknown' ? { vacant: true } : {}),
      ...(owner.kind === 'person' ? { avatar: owner.name } : {}),
      ...(owner.pep === 'PEP' || owner.pep === 'Potential match'
        ? { badge: { label: owner.pep, tone: AML_PEP_TONES[owner.pep] } }
        : {}),
    })),
  ]
}

/** The people a client's screening covers: the client's own name, its owners and its representative. */
export function screenedParties(client: AmlClient): { id: string; name: string; role: string }[] {
  const people = client.owners
    .filter((owner) => owner.kind !== 'unknown')
    .map((owner) => ({
      id: owner.id,
      name: owner.name,
      role:
        owner.kind === 'company'
          ? `Owner, ${owner.share}`
          : owner.name === client.representative.name
            ? `${client.representative.role}, owner ${owner.share}`
            : owner.beneficial === undefined
              ? `Owner, ${owner.share}`
              : `Beneficial owner, ${owner.share}`,
    }))
  const representative = people.some((each) => each.name === client.representative.name)
    ? []
    : [
        {
          id: `${client.id}-representative`,
          name: client.representative.name,
          role: client.representative.role,
        },
      ]
  return [{ id: client.id, name: client.name, role: 'The client' }, ...people, ...representative]
}

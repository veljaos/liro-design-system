/*
 * Group BJ's example data (P5.64, recruitment): Kvadrat Gradnja d.o.o. on 14 October 2026 at
 * 09:40, seen by Jelena Marković, the HR manager (data-AJ). The open position of data-AJ's chart —
 * "Buyer, construction materials" in Procurement, open since 01.10.2026 under Marko Đorđević — is
 * job posting JOB-2026-007 with eleven candidates on the board (applied → interview → offer →
 * hired / rejected); Tijana Babić had her first interview on 13.10.2026 (two scorecards of three
 * in, Jelena's missing) and waits for a second one with the director; Katarina Mitrović has an
 * offer she has not answered yet. The HR assistant's maternity cover (JOB-2026-005) was filled by
 * Teodora Lazić, who starts on 19.10.2026 (her onboarding is group BK). Every count, rule and
 * free slot is the application's; the scorecard's criteria and scale are its data. Invented;
 * e-mail addresses at example.com. Not part of the package.
 */
import type { KanbanCard } from '@veljaos/ui'

export const BJ_TODAY = '2026-10-14'
export const BJ_NOW = '09:40'

export const BJ_ROUTES = {
  openings: '/hr/recruitment',
  posting: '/hr/recruitment/JOB-2026-007',
  /** The posting in edit mode (P4.9: one page, read and edited). */
  postingEdit: '/hr/recruitment/JOB-2026-007?mode=edit',
  candidates: '/hr/recruitment/JOB-2026-007/candidates',
  /** Luka Perić dropped on Rejected: the application asks why first. */
  candidatesReject: '/hr/recruitment/JOB-2026-007/candidates?reject=luka',
  candidate: '/hr/recruitment/candidates/tijana-babic',
  /** The second interview being scheduled. */
  schedule: '/hr/recruitment/candidates/tijana-babic?schedule=open',
  scorecard: '/hr/recruitment/candidates/tijana-babic/scorecard',
  /** The scorecard sent without every criterion rated: the application's errors. */
  scorecardErrors: '/hr/recruitment/candidates/tijana-babic/scorecard?check=missing',
} as const

/** The signed-in HR manager (data-AJ's Jelena Marković). */
export const RECRUITER = {
  name: 'Jelena Marković',
  email: 'jelena.markovic@kvadratgradnja.example.com',
  role: 'HR manager',
}

// ── The openings ──────────────────────────────────────────────────────────────────────────────

export type OpeningState = 'Published' | 'Filled' | 'Draft'

export interface Opening {
  id: string
  position: string
  unit: string
  /** The application's words ("1 opening"). */
  openings: string
  /** The application's words ("11 candidates"). */
  candidates: string
  published: string | null
  applyBy: string | null
  state: OpeningState
  /** Filled: who and from when, the application's words. */
  note?: string
}

export const OPENINGS: Opening[] = [
  {
    id: 'JOB-2026-008',
    position: 'Site engineer',
    unit: 'Construction',
    openings: '1 opening',
    candidates: 'Not published yet',
    published: null,
    applyBy: null,
    state: 'Draft',
  },
  {
    id: 'JOB-2026-007',
    position: 'Buyer, construction materials',
    unit: 'Procurement',
    openings: '1 opening',
    candidates: '11 candidates',
    published: '2026-10-01',
    applyBy: '2026-10-31',
    state: 'Published',
  },
  {
    id: 'JOB-2026-006',
    position: 'Mason',
    unit: 'Residential building Liman 4',
    openings: '2 openings',
    candidates: '6 candidates',
    published: '2026-09-21',
    applyBy: '2026-10-21',
    state: 'Published',
  },
  {
    id: 'JOB-2026-005',
    position: 'HR assistant, maternity cover',
    unit: 'Human resources',
    openings: '1 opening',
    candidates: '9 candidates',
    published: '2026-09-01',
    applyBy: '2026-09-20',
    state: 'Filled',
    note: 'Teodora Lazić starts on 19.10.2026.',
  },
  {
    id: 'JOB-2026-004',
    position: 'Crane operator',
    unit: 'Bulevar Evrope 24',
    openings: '1 opening',
    candidates: '3 candidates',
    published: '2026-08-15',
    applyBy: '2026-09-15',
    state: 'Filled',
    note: 'Goran Stevanović started on 01.10.2026.',
  },
]

export const OPENING_VIEWS: { id: string; label: string; states: readonly OpeningState[] }[] = [
  { id: 'open', label: 'Open', states: ['Published', 'Draft'] },
  { id: 'filled', label: 'Filled', states: ['Filled'] },
  { id: 'all', label: 'All', states: ['Published', 'Draft', 'Filled'] },
]

// ── Job posting JOB-2026-007 ──────────────────────────────────────────────────────────────────

export const POSTING = {
  id: 'JOB-2026-007',
  position: 'Buyer, construction materials',
  unit: 'Procurement',
  reportsTo: 'Marko Đorđević, Procurement and warehouse manager',
  location: 'Central warehouse, Novi Sad',
  employment: 'Full time, indefinite, 3 months probation',
  openings: '1',
  salaryFrom: '110000.00',
  salaryTo: '130000.00',
  published: '2026-10-01',
  applyBy: '2026-10-31',
  daysOpen: '14 days',
  summary:
    'You buy what our sites build with — concrete, reinforcement, blocks, formwork and installation material — from a list of about forty suppliers, for three sites in and around Novi Sad.',
  duties: [
    'Ask suppliers for offers, compare them and propose the best one to the site manager.',
    'Place purchase orders in Liro and follow them until the goods are received.',
    'Check supplier invoices against orders and goods receipts.',
    'Keep the price lists and the agreed conditions of our suppliers up to date.',
  ],
  requirements: [
    'At least two years in purchasing, preferably of construction materials.',
    'You read a bill of quantities and know the common materials and their units.',
    'You negotiate calmly and keep your word with suppliers.',
    'Driving licence, category B.',
  ],
  channels: [
    { key: 'site', label: 'Company careers page', state: 'Published 01.10.2026' },
    { key: 'board', label: 'Job board (illustrative)', state: 'Published 01.10.2026' },
    { key: 'service', label: 'Employment service (illustrative)', state: 'Published 02.10.2026' },
  ],
  team: [
    { name: 'Marko Đorđević', role: 'Hiring manager' },
    { name: 'Jelena Marković', role: 'Recruiter, HR' },
    { name: 'Ivan Lukić', role: 'Interviewer, buyer' },
  ],
}

export const UNITS = [
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Human resources', label: 'Human resources' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Construction', label: 'Construction' },
]

export const EMPLOYMENT_KINDS = [
  { value: 'indefinite', label: 'Full time, indefinite, 3 months probation' },
  { value: 'fixed', label: 'Full time, fixed term' },
  { value: 'part', label: 'Part time' },
]

// ── Candidates ────────────────────────────────────────────────────────────────────────────────

export type StageId = 'applied' | 'interview' | 'offer' | 'hired' | 'rejected'

export const STAGES: { id: StageId; title: string }[] = [
  { id: 'applied', title: 'Applied' },
  { id: 'interview', title: 'Interview' },
  { id: 'offer', title: 'Offer' },
  { id: 'hired', title: 'Hired' },
  { id: 'rejected', title: 'Rejected' },
]

/** A stage's word on a candidate's badge, and its tone (the application's map). */
export const STAGE_TONES = {
  Applied: 'neutral',
  Interview: 'info',
  Offer: 'warning',
  Hired: 'success',
  Rejected: 'danger',
} as const

/** The board's columns as the application sends them: the candidates in each stage, in order. */
export interface StageColumn {
  id: StageId
  title: string
  cards: KanbanCard[]
}

const card = (
  id: string,
  title: string,
  description: string,
  extra: Partial<KanbanCard> = {},
): KanbanCard => ({ id, title, description, ...extra })

export const FEATURED_CANDIDATE = 'tijana'

export function initialStages(): StageColumn[] {
  const cards: Record<StageId, KanbanCard[]> = {
    applied: [
      card('nemanja', 'Nemanja Filipović', 'Applied 12.10.2026 · Job board', {
        meta: 'CV and cover letter',
      }),
      card('sara', 'Sara Jovanović', 'Applied 11.10.2026 · Careers page', { meta: 'CV' }),
      card('luka', 'Luka Perić', 'Applied 09.10.2026 · Job board', { meta: 'CV' }),
      card('ivana', 'Ivana Tomić', 'Applied 08.10.2026 · Referred by Ivan Lukić', {
        meta: 'CV and cover letter',
      }),
      card('andrej', 'Andrej Savić', 'Applied 06.10.2026 · Employment service', { meta: 'CV' }),
    ],
    interview: [
      card('tijana', 'Tijana Babić', 'First interview done 13.10.2026', {
        href: `#${BJ_ROUTES.candidate}`,
        assignee: { name: 'Jelena Marković' },
        meta: '2 of 3 scorecards',
      }),
      card('milan', 'Milan Radovanović', 'Interview 16.10.2026 at 10:00', {
        assignee: { name: 'Marko Đorđević' },
        meta: 'Interview scheduled',
      }),
      card('djordje', 'Đorđe Stanković', 'Interview not scheduled yet', {
        assignee: { name: 'Jelena Marković' },
        due: '2026-10-15',
        meta: 'Schedule by 15.10.2026',
      }),
    ],
    offer: [
      card('katarina', 'Katarina Mitrović', 'Offer sent 13.10.2026', {
        assignee: { name: 'Marko Đorđević' },
        due: '2026-10-20',
        meta: 'Answer by 20.10.2026',
      }),
    ],
    hired: [],
    rejected: [
      card('bojan', 'Bojan Ristić', 'Rejected 10.10.2026 · Not enough experience'),
      card('vesna', 'Vesna Pavlović', 'Withdrew 09.10.2026 · Took another job'),
    ],
  }
  return STAGES.map((stage) => ({ ...stage, cards: cards[stage.id] }))
}

/** The application's rule for Hired: only a candidate who accepted an offer. */
export const ACCEPTED_OFFERS: readonly string[] = []

export const REJECT_REASONS = [
  { value: 'experience', label: 'Not enough experience' },
  { value: 'salary', label: 'Salary expectations too high' },
  { value: 'other-candidate', label: 'Another candidate was chosen' },
  { value: 'withdrew', label: 'The candidate withdrew' },
]

// ── Tijana Babić ──────────────────────────────────────────────────────────────────────────────

export const CANDIDATE = {
  id: 'tijana',
  name: 'Tijana Babić',
  email: 'tijana.babic@example.com',
  phone: '063 555 0182 (illustrative)',
  applied: '2026-10-03',
  source: 'Company careers page',
  current: 'Buyer at a building-materials wholesaler, Novi Sad (4 years)',
  notice: '30 days',
  expected: '125000.00',
  recommendation: 'Yes, 2 of 3 scorecards',
}

export const CV_FILES = [
  { id: 'cv', name: 'Tijana_Babic_CV.pdf', sizeText: '214 KB', detail: 'CV, uploaded 03.10.2026' },
  {
    id: 'letter',
    name: 'Cover_letter.pdf',
    sizeText: '88 KB',
    detail: 'Cover letter, uploaded 03.10.2026',
  },
  {
    id: 'certificate',
    name: 'Procurement_course_certificate.pdf',
    sizeText: '1,2 MB',
    detail: 'Certificate, uploaded 03.10.2026',
  },
]

export interface Interview {
  id: string
  title: string
  start: string
  end: string
  where: string
  interviewers: string
  state: 'Done' | 'Scheduled' | 'Not scheduled'
}

export const INTERVIEWS: Interview[] = [
  {
    id: 'first',
    title: 'First interview',
    start: '2026-10-13T10:00',
    end: '2026-10-13T11:00',
    where: 'In person, Central warehouse office',
    interviewers: 'Marko Đorđević, Ivan Lukić, Jelena Marković',
    state: 'Done',
  },
]

/** The second interview the application proposes: who, and the slots when all of them are free. */
export const SECOND_INTERVIEW = {
  title: 'Second interview',
  interviewers: 'Nenad Kovačević, Marko Đorđević',
  formats: [
    { value: 'office', label: 'In person, at the head office (Bulevar oslobođenja 102)' },
    { value: 'video', label: 'Video call' },
  ],
  slots: [
    { start: '2026-10-15T13:00', end: '2026-10-15T14:00' },
    { start: '2026-10-15T14:00', end: '2026-10-15T15:00' },
    { start: '2026-10-16T09:00', end: '2026-10-16T10:00' },
    { start: '2026-10-16T12:00', end: '2026-10-16T13:00' },
    { start: '2026-10-19T08:00', end: '2026-10-19T09:00' },
    { start: '2026-10-19T11:00', end: '2026-10-19T12:00' },
  ],
}

// ── Scorecards ────────────────────────────────────────────────────────────────────────────────

export interface Criterion {
  id: string
  label: string
  description: string
}

/** The posting's criteria, from the application. */
export const CRITERIA: Criterion[] = [
  {
    id: 'purchasing',
    label: 'Purchasing experience',
    description: 'Offers, orders and suppliers of construction materials.',
  },
  {
    id: 'materials',
    label: 'Knowledge of materials',
    description: 'Reads a bill of quantities; knows the common materials and their units.',
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    description: 'Prices, terms and deliveries, calmly and fairly.',
  },
  {
    id: 'teamwork',
    label: 'Communication and teamwork',
    description: 'With the sites, the warehouse and finance.',
  },
]

/** The company's rating scale, lowest first (the application's). */
export const SCALE: { value: string; label: string }[] = [
  { value: '1', label: '1 · Poor' },
  { value: '2', label: '2 · Below expectations' },
  { value: '3', label: '3 · Meets expectations' },
  { value: '4', label: '4 · Strong' },
]

export const RECOMMENDATIONS: { value: string; label: string }[] = [
  { value: 'strong-no', label: 'Strong no' },
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
  { value: 'strong-yes', label: 'Strong yes' },
]

export interface Scorecard {
  by: string
  role: string
  submitted: string | null
  ratings: Record<string, string>
  recommendation: string | null
  notes: string
}

export const SCORECARDS: Scorecard[] = [
  {
    by: 'Marko Đorđević',
    role: 'Hiring manager',
    submitted: '2026-10-13T12:05:00+02:00',
    ratings: { purchasing: '4', materials: '3', negotiation: '3', teamwork: '4' },
    recommendation: 'yes',
    notes: 'Knows our suppliers; would need a few weeks on reinforcement.',
  },
  {
    by: 'Ivan Lukić',
    role: 'Interviewer, buyer',
    submitted: '2026-10-13T15:30:00+02:00',
    ratings: { purchasing: '3', materials: '4', negotiation: '4', teamwork: '3' },
    recommendation: 'strong-yes',
    notes: 'Strong on materials and units; answered the formwork case best of all.',
  },
  {
    by: 'Jelena Marković',
    role: 'Recruiter, HR',
    submitted: null,
    ratings: {},
    recommendation: null,
    notes: '',
  },
]

/** The scorecard Jelena had started when she was interrupted (a draft, kept by the application). */
export const SCORECARD_DRAFT = {
  ratings: { purchasing: '3', materials: '3', teamwork: '4' } as Record<string, string>,
  recommendation: '',
  notes: 'Clear about her current suppliers; asked good questions about the sites.',
}

export const CANDIDATE_HISTORY = [
  {
    id: 'h6',
    at: '2026-10-13T15:30:00+02:00',
    actor: { name: 'Ivan Lukić' },
    text: 'Submitted a scorecard: Strong yes.',
  },
  {
    id: 'h5',
    at: '2026-10-13T12:05:00+02:00',
    actor: { name: 'Marko Đorđević' },
    text: 'Submitted a scorecard: Yes.',
  },
  {
    id: 'h4',
    at: '2026-10-13T11:00:00+02:00',
    actor: { name: 'Liro', kind: 'system' as const },
    text: 'First interview done.',
  },
  {
    id: 'h3',
    at: '2026-10-07T09:15:00+02:00',
    actor: { name: 'Jelena Marković' },
    text: 'Scheduled the first interview for 13.10.2026 at 10:00; the invitation was sent.',
  },
  {
    id: 'h2',
    at: '2026-10-07T09:12:00+02:00',
    actor: { name: 'Jelena Marković' },
    changes: [{ field: 'Stage', from: 'Applied', to: 'Interview' }],
  },
  {
    id: 'h1',
    at: '2026-10-03T21:48:00+02:00',
    actor: { name: 'Careers page', kind: 'integration' as const },
    text: 'Applied with a CV, a cover letter and a certificate.',
  },
]

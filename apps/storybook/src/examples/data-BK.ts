/*
 * Group BK's example data (P5.65, onboarding a new employee): Teodora Lazić, hired through
 * JOB-2026-005 (group BJ) as HR assistant for Dragana Rakić's maternity cover (data-AJ), starts at
 * Kvadrat Gradnja d.o.o. on Monday 19.10.2026. On 14.10.2026 at 09:40 HR sees her checklist —
 * equipment, accounts, training and documents to sign, each with its owner and due date — and
 * Teodora sees, on her phone in the employees' portal, what she does herself: her employment
 * contract RU-2026-019 and the confidentiality statement to sign, her salary account, the safety
 * training that opens on her first day. Every task, owner, due date and rule is the
 * application's. Invented; the legal wording is illustrative; e-mails at example.com. Not part of
 * the package.
 */
import type { Signer } from '@veljaos/ui'

export const BK_TODAY = '2026-10-14'

export const BK_ROUTES = {
  onboarding: '/hr/onboarding/teodora-lazic',
  portal: '/welcome',
  /** The salary-account dialog open on the portal's home. */
  portalAccount: '/welcome?account=open',
  documents: '/welcome/documents',
  contract: '/welcome/documents/RU-2026-019',
  confidentiality: '/welcome/documents/IZ-2026-031',
} as const

export const NEWCOMER = {
  name: 'Teodora Lazić',
  first: 'Teodora',
  role: 'HR assistant, maternity cover',
  unit: 'Human resources',
  start: '2026-10-19',
  email: 'teodora.lazic@kvadratgradnja.example.com',
  manager: 'Jelena Marković, HR manager',
  buddy: 'Tamara Simić, payroll and invoicing',
  opening: 'JOB-2026-005',
}

export const FIRST_DAY = {
  when: 'Monday, 19.10.2026, at 08:00',
  where: 'Head office, Bulevar oslobođenja 102, Novi Sad, second floor',
  askFor: 'Jelena Marković, HR manager, 021 555 0100 (illustrative)',
  bring: 'Your identity card and your bank card',
}

// ── HR's checklist ────────────────────────────────────────────────────────────────────────────

export type CategoryId = 'equipment' | 'accounts' | 'training' | 'documents'

export const CATEGORIES: { id: CategoryId; title: string; description: string }[] = [
  { id: 'equipment', title: 'Equipment', description: 'Ready on her desk on the first day.' },
  { id: 'accounts', title: 'Accounts', description: 'Access and registrations.' },
  { id: 'training', title: 'Training', description: 'In the first week.' },
  { id: 'documents', title: 'Documents to sign', description: 'Signed electronically.' },
]

/** A task's state, the application's: who must act next is in the words. */
export type TaskState = 'To do' | 'Done' | 'Waiting for Teodora' | 'Blocked'

export const TASK_TONES = {
  'To do': 'neutral',
  Done: 'success',
  'Waiting for Teodora': 'warning',
  Blocked: 'neutral',
} as const

export interface OnboardingTask {
  id: string
  category: CategoryId
  title: string
  owner: string
  ownerRole: string
  due: string
  state: TaskState
  /** Done: when and by whom, the application's words. */
  doneNote?: string
  /** Blocked: what it waits for, in words. */
  blockedBy?: string
}

const task = (
  id: string,
  category: CategoryId,
  title: string,
  owner: string,
  ownerRole: string,
  due: string,
  state: TaskState,
  extra: Partial<OnboardingTask> = {},
): OnboardingTask => ({ id, category, title, owner, ownerRole, due, state, ...extra })

export const TASKS: OnboardingTask[] = [
  task(
    'laptop',
    'equipment',
    'Laptop with e-mail and Liro',
    'Ana Marić',
    'Office',
    '2026-10-16',
    'To do',
  ),
  task(
    'phone',
    'equipment',
    'Mobile phone and SIM card',
    'Ana Marić',
    'Office',
    '2026-10-16',
    'Done',
    {
      doneNote: 'Done 13.10.2026 by Ana Marić',
    },
  ),
  task(
    'card',
    'equipment',
    'Access card for the head office',
    'Ana Marić',
    'Office',
    '2026-10-19',
    'To do',
  ),
  task(
    'desk',
    'equipment',
    'Desk in the HR office',
    'Jelena Marković',
    'HR',
    '2026-10-16',
    'Done',
    {
      doneNote: 'Done 12.10.2026 by Jelena Marković',
    },
  ),
  task(
    'email',
    'accounts',
    'E-mail address teodora.lazic@kvadratgradnja.example.com',
    'Ana Marić',
    'Office',
    '2026-10-13',
    'To do',
  ),
  task(
    'liro',
    'accounts',
    'Liro user with the HR assistant role',
    'Milica Petrović',
    'Company settings',
    '2026-10-16',
    'To do',
  ),
  task(
    'insurance',
    'accounts',
    'Registration for social insurance (form M, illustrative)',
    'Tamara Simić',
    'Payroll',
    '2026-10-19',
    'To do',
  ),
  task(
    'bank',
    'accounts',
    'Salary account',
    'Teodora Lazić',
    'The new employee',
    '2026-10-16',
    'Waiting for Teodora',
  ),
  task('file', 'accounts', 'Personnel file', 'Jelena Marković', 'HR', '2026-10-12', 'Done', {
    doneNote: 'Done 12.10.2026 by Jelena Marković',
  }),
  task(
    'safety',
    'training',
    'Safety at work, introductory training',
    'Teodora Lazić',
    'The new employee',
    '2026-10-19',
    'Blocked',
    { blockedBy: 'Opens on her first day.' },
  ),
  task(
    'fire',
    'training',
    'Fire safety instructions',
    'Goran Medić',
    'Head of construction',
    '2026-10-20',
    'To do',
  ),
  task(
    'hr-module',
    'training',
    'Liro HR module, first steps',
    'Jelena Marković',
    'HR',
    '2026-10-21',
    'To do',
  ),
  task(
    'team',
    'training',
    'Meet Finance, Procurement and the site managers',
    'Jelena Marković',
    'HR',
    '2026-10-23',
    'To do',
  ),
  task(
    'contract',
    'documents',
    'Employment contract RU-2026-019',
    'Teodora Lazić',
    'The new employee',
    '2026-10-16',
    'Waiting for Teodora',
  ),
  task(
    'confidentiality',
    'documents',
    'Confidentiality statement IZ-2026-031',
    'Teodora Lazić',
    'The new employee',
    '2026-10-16',
    'Waiting for Teodora',
  ),
  task(
    'safety-statement',
    'documents',
    'Safety at work statement',
    'Teodora Lazić',
    'The new employee',
    '2026-10-19',
    'Blocked',
    { blockedBy: 'After the safety training.' },
  ),
]

// ── Teodora's documents ───────────────────────────────────────────────────────────────────────

export interface SignDocument {
  id: string
  kind: string
  title: string
  due: string
  path: string
  /** The task on HR's checklist the signature completes. */
  task: string
  /** Who signed before Teodora (the director), as the application sends it. */
  before: Signer[]
  parties: string
  articles: { heading: string; text: string }[]
}

export const SIGN_DOCUMENTS: SignDocument[] = [
  {
    id: 'RU-2026-019',
    kind: 'Employment contract',
    title: 'Employment contract RU-2026-019',
    due: '2026-10-16',
    path: BK_ROUTES.contract,
    task: 'contract',
    before: [
      {
        id: 'director',
        name: 'Nenad Kovačević',
        role: 'Director',
        state: 'signed',
        at: '2026-10-13T14:05:00+02:00',
      },
    ],
    parties:
      'Kvadrat Gradnja d.o.o., Novi Sad (the employer), represented by director Nenad Kovačević, and Teodora Lazić (the employee).',
    articles: [
      {
        heading: 'Article 1',
        text: 'The employee works as HR assistant in Human resources from 19 October 2026, for a fixed term while the HR assistant Dragana Rakić is on maternity leave.',
      },
      {
        heading: 'Article 2',
        text: 'Working hours are 40 hours a week, Monday to Friday, from 08:00 to 16:00, at the head office in Novi Sad.',
      },
      {
        heading: 'Article 3',
        text: 'The gross salary and its parts are set in the annex on pay. All other rights follow the Work Rulebook of the employer. Illustrative text.',
      },
    ],
  },
  {
    id: 'IZ-2026-031',
    kind: 'Statement',
    title: 'Confidentiality statement IZ-2026-031',
    due: '2026-10-16',
    path: BK_ROUTES.confidentiality,
    task: 'confidentiality',
    before: [],
    parties: 'Teodora Lazić, HR assistant at Kvadrat Gradnja d.o.o., Novi Sad.',
    articles: [
      {
        heading: 'Statement',
        text: 'I will keep the personal data of employees and candidates I see at work confidential, during my employment and after it, and use them only for my work. Illustrative text.',
      },
    ],
  },
]

export const DECLINE_REASONS = [
  { value: 'terms', label: 'The terms differ from what was agreed' },
  { value: 'data', label: 'My personal data are wrong' },
  { value: 'questions', label: 'I have questions first' },
]

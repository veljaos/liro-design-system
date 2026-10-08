/*
 * Story data of the P5.6, P5.7 and P5.21 building blocks (fictitious, about Kvadrat Gradnja
 * d.o.o. on 6 October 2026). Not part of the package: nothing in src/index.ts imports this file.
 * No classes here: Storybook compiles classes only from *.stories.tsx files.
 */
import type { KanbanColumn } from './kanban-board'
import type { PermissionAction, PermissionArea } from './permission-matrix'
import type { SessionItem } from './session-list'
import type { SetupStep } from './setup-checklist'
import type { Signer } from './signer-list'
import type { SignInProvider } from './sign-in'

/**
 * The providers' official marks, as `@veljaos/tokens/brand/providers/` ships them; Storybook
 * serves the brand folder under /brand (main.ts), so the stories pass these addresses as an
 * application passes its copy of the files (D18: no component contains a logo).
 */
export const PROVIDER_MARKS = {
  microsoft: 'brand/providers/microsoft.svg',
  google: 'brand/providers/google.svg',
} as const

/**
 * The two providers of the owner's brief, with the labels an application passes (English by
 * default; a story in another language passes its own).
 */
export function providers(
  labels: readonly [string, string] = ['Continue with Microsoft', 'Continue with Google'],
  onClick: (id: string) => void = () => undefined,
): SignInProvider[] {
  return [
    {
      id: 'microsoft',
      label: labels[0],
      mark: PROVIDER_MARKS.microsoft,
      onClick: () => {
        onClick('microsoft')
      },
    },
    {
      id: 'google',
      label: labels[1],
      mark: PROVIDER_MARKS.google,
      onClick: () => {
        onClick('google')
      },
    },
  ]
}

/** Waits until every image in the page has loaded, so a picture never has a missing mark. */
export async function imagesReady(): Promise<void> {
  await Promise.all(
    Array.from(document.images).map((image) => image.decode().catch(() => undefined)),
  )
}

/** Milica's recovery codes (made up; the Core makes real ones). */
export const RECOVERY_CODES = [
  'k7qm-3rtd',
  'p2xv-9cfh',
  'w8ne-4jzb',
  'a5ty-6gkm',
  'h3ds-2pvx',
  'r9bw-7qne',
  'm4cz-8tfj',
  'f6vh-5xra',
  'z2gp-3wme',
  't8kq-4dny',
]

/** Milica's devices on 6 October 2026. */
export const SESSIONS: SessionItem[] = [
  {
    id: 's1',
    device: 'Chrome on Windows',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '93.87.142.18',
    lastActive: '2026-10-06T10:42:00+02:00',
    current: true,
  },
  {
    id: 's2',
    device: 'Safari on iPhone',
    kind: 'phone',
    place: 'Novi Sad, Serbia',
    address: '178.221.40.7',
    lastActive: '2026-10-06T08:15:00+02:00',
  },
  {
    id: 's3',
    device: 'Edge on Windows',
    kind: 'desktop',
    place: 'Beograd, Serbia',
    address: '109.92.18.230',
    lastActive: '2026-10-02T16:47:00+02:00',
  },
  {
    id: 's4',
    device: 'Chrome on Android tablet',
    kind: 'tablet',
    place: 'Temerin, Serbia',
    address: '79.101.12.66',
    lastActive: '2026-09-28T07:31:00+02:00',
  },
]

/** The tasks of Kvadrat Gradnja, linked to the dataset's records. */
export const TASK_COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To do',
    cards: [
      {
        id: 't1',
        title: 'Send reminder for F-2026-0411',
        href: '#tasks/t1',
        description: 'Drina Prevoz d.o.o. has not paid 58.440,00 RSD due on 03.10.2026.',
        assignee: { name: 'Dragan Ilić' },
        due: '2026-10-07',
        record: {
          kind: 'Invoice',
          number: 'F-2026-0411',
          state: 'Overdue',
          href: '#invoices/F-2026-0411',
        },
        meta: '2 comments',
      },
      {
        id: 't2',
        title: 'Approve UF-2026-1187 from EPS Snabdevanje',
        href: '#tasks/t2',
        assignee: { name: 'Milica Petrović' },
        due: '2026-10-08',
        record: {
          kind: 'Supplier invoice',
          number: 'UF-2026-1187',
          state: 'To approve',
          href: '#approvals',
        },
      },
      {
        id: 't3',
        title: 'Prepare the VAT return for September 2026',
        href: '#tasks/t3',
        assignee: { name: 'Ivana Stojanović' },
        due: '2026-10-15',
      },
    ],
  },
  {
    id: 'progress',
    title: 'In progress',
    cards: [
      {
        id: 't4',
        title: 'Match bank statement 188',
        href: '#tasks/t4',
        description: 'Banca Intesa, 06.10.2026.: 14 lines, one payer unknown.',
        assignee: { name: 'Ivana Stojanović' },
        due: '2026-10-06',
      },
      {
        id: 't5',
        title: 'Collect the open amount of F-2026-0410',
        href: '#tasks/t5',
        assignee: { name: 'Dragan Ilić' },
        due: '2026-10-10',
        record: {
          kind: 'Invoice',
          number: 'F-2026-0410',
          state: 'Partially paid',
          href: '#invoices/F-2026-0410',
        },
        meta: '1 comment',
      },
    ],
  },
  {
    id: 'waiting',
    title: 'Waiting',
    cards: [
      {
        id: 't6',
        title: 'Signatures for employment contract RU-2026-017',
        href: '#tasks/t6',
        description: 'Stefan Nikolić, site engineer, starts on 02.11.2026.',
        assignee: { name: 'Jelena Marković' },
        due: '2026-10-30',
        record: {
          kind: 'Contract',
          number: 'RU-2026-017',
          state: 'Awaiting signatures',
          href: '#contracts/RU-2026-017',
        },
      },
    ],
  },
  { id: 'done', title: 'Done', cards: [] },
]

/** The areas and actions of Kvadrat Gradnja's roles (the Core's lists). */
export const AREAS: PermissionArea[] = [
  { id: 'sales', label: 'Sales invoices', description: 'Invoices, advances, credit notes' },
  { id: 'purchasing', label: 'Supplier invoices', description: 'Approval and booking' },
  { id: 'partners', label: 'Customers and suppliers' },
  { id: 'inventory', label: 'Items and warehouse' },
  { id: 'banking', label: 'Banking', description: 'Statements and payments' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Company settings' },
]

export const ACTIONS: PermissionAction[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
]

/** The custom role "Site manager". */
export const SITE_MANAGER = {
  sales: ['view'],
  purchasing: ['view', 'create', 'approve'],
  partners: ['view'],
  inventory: ['view', 'create', 'edit'],
  reports: ['view'],
}

/** Reports are only viewed; approving applies to invoices only. */
export function permissionApplies(area: string, action: string): boolean {
  if (area === 'reports') return action === 'view'
  if (action === 'approve') return area === 'sales' || area === 'purchasing'
  return true
}

/** The Core's rule: only the Administrator role changes company settings and banking. */
export function permissionUnavailable(area: string, action: string): string | undefined {
  if (area === 'settings' && action !== 'view') {
    return 'Only the Administrator role can change company settings.'
  }
  if (area === 'banking' && (action === 'delete' || action === 'approve')) {
    return 'Payments are approved in the bank, not in Liro.'
  }
  return undefined
}

/** Stanić Elektro STR's first-run steps: two of five done. */
export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'company',
    title: 'Company data',
    description: 'Name, address, tax number, bank account and logo on documents.',
    state: 'done',
    doneNote: 'Completed by Milica Petrović',
    action: { label: 'Change', href: '#setup/company' },
  },
  {
    id: 'sef',
    title: 'Connect to SEF',
    description: 'The e-invoice system: Liro sends and receives invoices for you.',
    state: 'done',
    doneNote: 'Connected with the API key of 05.10.2026.',
    action: { label: 'Change', href: '#setup/sef' },
  },
  {
    id: 'customers',
    title: 'Import customers',
    description: 'From a spreadsheet or your previous program.',
    state: 'todo',
    action: { label: 'Import customers', href: '#setup/customers' },
  },
  {
    id: 'bank',
    title: 'Connect bank statements',
    description: 'Banca Intesa sends the statements every morning.',
    state: 'blocked',
    blockedReason: 'Waiting for Banca Intesa to confirm the agreement.',
  },
  {
    id: 'invoice',
    title: 'Issue the first invoice',
    description: 'Check how it looks before it goes to SEF.',
    state: 'todo',
    action: { label: 'New invoice', href: '#setup/invoice' },
  },
]

/** RU-2026-017's signers in order (shared facts): the director has signed. */
export function contractSigners(current: 'stefan' | 'jelena' | 'none' = 'stefan'): Signer[] {
  return [
    {
      id: 'nenad',
      name: 'Nenad Kovačević',
      role: 'Director, Kvadrat Gradnja d.o.o.',
      state: 'signed',
      at: '2026-10-05T14:12:00+02:00',
    },
    {
      id: 'stefan',
      name: 'Stefan Nikolić',
      role: 'Employee',
      state: 'waiting',
      ...(current === 'stefan' ? { current: true } : {}),
    },
    {
      id: 'jelena',
      name: 'Jelena Marković',
      role: 'Human resources',
      state: 'waiting',
      ...(current === 'jelena' ? { current: true } : {}),
    },
  ]
}

/** The Core's reasons to decline a contract. */
export const DECLINE_REASONS = [
  { value: 'terms', label: 'The terms differ from what was agreed' },
  { value: 'data', label: 'My personal data are wrong' },
  { value: 'other', label: 'Another reason' },
]

/*
 * Group C's example data (P5.6, P5.7, P5.21): the users and roles of Kvadrat Gradnja d.o.o., the
 * first-run steps of Stanić Elektro STR, employment contract RU-2026-017 awaiting signatures and
 * the tasks board — all on 6 October 2026, linked to the records of the one dataset
 * (`examples-story-data.ts`). Not part of the package. No classes here.
 */
import type {
  KanbanColumn,
  PermissionAction,
  PermissionArea,
  PermissionValue,
  SetupStep,
  Signer,
  SignInProvider,
} from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const C_ROUTES = {
  users: '/settings/users',
  setup: '/setup',
  signing: '/hr/contracts/RU-2026-017/signing',
  /** The link in Stefan Nikolić's e-mail: the same contract, seen by the signer. */
  signerLink: '/sign/RU-2026-017',
  tasks: '/tasks',
} as const

// ── Sign-in providers ─────────────────────────────────────────────────────────────────────────

/** Microsoft's and Google's official marks are drawn by ProviderSignInButtons ('microsoft', 'google'). */
export function signInProviders(onClick: (id: string) => void): SignInProvider[] {
  return [
    {
      id: 'microsoft',
      label: 'Continue with Microsoft',
      mark: 'microsoft',
      onClick: () => {
        onClick('microsoft')
      },
    },
    {
      id: 'google',
      label: 'Continue with Google',
      mark: 'google',
      onClick: () => {
        onClick('google')
      },
    },
  ]
}

// ── Users and roles ───────────────────────────────────────────────────────────────────────────

export interface ExampleRole {
  id: string
  name: string
  builtIn: boolean
  description: string
}

/** The roles of Kvadrat Gradnja: five built in, one its own. */
export const ROLES: ExampleRole[] = [
  {
    id: 'administrator',
    name: 'Administrator',
    builtIn: true,
    description: 'Everything, including users, roles and company settings.',
  },
  {
    id: 'accountant',
    name: 'Accountant',
    builtIn: true,
    description: 'Bookkeeping, VAT, banking and every document.',
  },
  { id: 'sales', name: 'Sales', builtIn: true, description: 'Customers, quotes, sales invoices.' },
  {
    id: 'warehouse',
    name: 'Warehouse',
    builtIn: true,
    description: 'Items, receipts, deliveries and stock counts.',
  },
  {
    id: 'readonly',
    name: 'Read only',
    builtIn: true,
    description: 'Sees everything, changes nothing.',
  },
  {
    id: 'site-manager',
    name: 'Site manager',
    builtIn: false,
    description: 'Orders material for the sites and approves its supplier invoices.',
  },
]

export interface ExampleMember {
  id: string
  name: string
  email: string
  roles: string[]
  status: 'Active' | 'Deactivated'
  /** The last sign-in: an instant in the tenant's offset, or null. */
  lastSignIn: string | null
}

export const MEMBERS: ExampleMember[] = [
  {
    id: 'm1',
    name: 'Milica Petrović',
    email: 'milica.petrovic@kvadratgradnja.rs',
    roles: ['administrator', 'accountant'],
    status: 'Active',
    lastSignIn: '2026-10-06T07:58:00+02:00',
  },
  {
    id: 'm2',
    name: 'Nenad Kovačević',
    email: 'nenad.kovacevic@kvadratgradnja.rs',
    roles: ['administrator'],
    status: 'Active',
    lastSignIn: '2026-10-05T14:05:00+02:00',
  },
  {
    id: 'm3',
    name: 'Ivana Stojanović',
    email: 'ivana.stojanovic@kvadratgradnja.rs',
    roles: ['accountant'],
    status: 'Active',
    lastSignIn: '2026-10-06T08:31:00+02:00',
  },
  {
    id: 'm4',
    name: 'Dragan Ilić',
    email: 'dragan.ilic@kvadratgradnja.rs',
    roles: ['sales'],
    status: 'Active',
    lastSignIn: '2026-10-06T09:12:00+02:00',
  },
  {
    id: 'm5',
    name: 'Marko Đorđević',
    email: 'marko.djordjevic@kvadratgradnja.rs',
    roles: ['warehouse'],
    status: 'Active',
    lastSignIn: '2026-10-03T06:47:00+02:00',
  },
  {
    id: 'm6',
    name: 'Snežana Popović',
    email: 'snezana.popovic@kvadratgradnja.rs',
    roles: ['site-manager'],
    status: 'Active',
    lastSignIn: '2026-10-06T06:20:00+02:00',
  },
  {
    id: 'm7',
    name: 'Jelena Marković',
    email: 'jelena.markovic@kvadratgradnja.rs',
    roles: ['readonly'],
    status: 'Active',
    lastSignIn: '2026-10-05T09:31:00+02:00',
  },
  {
    id: 'm8',
    name: 'Zoran Lukić',
    email: 'zoran.lukic@kvadratgradnja.rs',
    roles: ['warehouse'],
    status: 'Deactivated',
    lastSignIn: '2026-06-30T15:02:00+02:00',
  },
]

export interface ExampleInvitation {
  id: string
  email: string
  role: string
  invitedBy: string
  sent: string
  /** Pending until it expires (7 days after it was sent). */
  expires: string
  state: 'Pending' | 'Expired'
}

/** Two pending invitations and one expired. */
export const INVITATIONS: ExampleInvitation[] = [
  {
    id: 'i1',
    email: 'stefan.nikolic@kvadratgradnja.rs',
    role: 'site-manager',
    invitedBy: 'Jelena Marković',
    sent: '2026-10-05',
    expires: '2026-10-12',
    state: 'Pending',
  },
  {
    id: 'i2',
    email: 'nikola.savic@kvadratgradnja.rs',
    role: 'sales',
    invitedBy: 'Milica Petrović',
    sent: '2026-10-02',
    expires: '2026-10-09',
    state: 'Pending',
  },
  {
    id: 'i3',
    email: 'biljana.ristic@ristic-racunovodstvo.rs',
    role: 'accountant',
    invitedBy: 'Milica Petrović',
    sent: '2026-09-21',
    expires: '2026-09-28',
    state: 'Expired',
  },
]

export function roleName(id: string): string {
  return ROLES.find((role) => role.id === id)?.name ?? id
}

/** The areas and actions of the permissions (the Core's lists). */
export const AREAS: PermissionArea[] = [
  { id: 'sales', label: 'Sales invoices', description: 'Invoices, advances, credit notes' },
  { id: 'purchasing', label: 'Supplier invoices', description: 'Approval and booking' },
  { id: 'partners', label: 'Customers and suppliers' },
  { id: 'inventory', label: 'Items and warehouse' },
  { id: 'banking', label: 'Banking', description: 'Statements and payments' },
  { id: 'accounting', label: 'Accounting', description: 'Journal, VAT, closing' },
  { id: 'hr', label: 'Employees and payroll' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Company settings', description: 'Users, roles, numbering, SEF' },
]

export const ACTIONS: PermissionAction[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
]

const ALL = ['view', 'create', 'edit', 'delete', 'approve']

/** What each role may do. */
export const PERMISSIONS: Record<string, PermissionValue> = {
  administrator: Object.fromEntries(AREAS.map((area) => [area.id, ALL])),
  accountant: {
    sales: ['view', 'create', 'edit'],
    purchasing: ['view', 'create', 'edit', 'approve'],
    partners: ['view', 'create', 'edit'],
    inventory: ['view'],
    banking: ['view', 'create', 'edit'],
    accounting: ['view', 'create', 'edit', 'delete', 'approve'],
    hr: ['view'],
    reports: ['view'],
    settings: ['view'],
  },
  sales: {
    sales: ['view', 'create', 'edit', 'delete'],
    partners: ['view', 'create', 'edit'],
    inventory: ['view'],
    reports: ['view'],
  },
  warehouse: {
    purchasing: ['view'],
    partners: ['view'],
    inventory: ['view', 'create', 'edit', 'delete'],
    reports: ['view'],
  },
  readonly: Object.fromEntries(AREAS.map((area) => [area.id, ['view']])),
  'site-manager': {
    sales: ['view'],
    purchasing: ['view', 'create', 'approve'],
    partners: ['view'],
    inventory: ['view', 'create', 'edit'],
    reports: ['view'],
  },
}

/** Reports are only viewed; approving applies to invoices and journal entries. */
export function permissionApplies(area: string, action: string): boolean {
  if (area === 'reports') return action === 'view'
  if (action === 'approve') return ['sales', 'purchasing', 'accounting'].includes(area)
  return true
}

/** The Core's rules for a custom role. */
export function permissionUnavailable(area: string, action: string): string | undefined {
  if (area === 'settings' && action !== 'view') {
    return 'Only the Administrator role can change company settings.'
  }
  if (area === 'hr' && action !== 'view') {
    return 'Payroll data are changed only by the Administrator and Accountant roles.'
  }
  return undefined
}

// ── First-run setup: Stanić Elektro STR ───────────────────────────────────────────────────────

export const STANIC = {
  id: 'stanic',
  name: 'Stanić Elektro STR',
  taxId: '112048376',
  address: 'Cara Dušana 112, 21000 Novi Sad',
}

/** Two of five steps done; the bank waits for Banca Intesa. */
export const STANIC_STEPS: SetupStep[] = [
  {
    id: 'company',
    title: 'Company data',
    description: 'Name, address, tax number, bank account, logo on documents.',
    state: 'done',
    doneNote: 'Completed by Milica Petrović',
    action: { label: 'Change', href: '#/setup/company' },
  },
  {
    id: 'sef',
    title: 'Connect to SEF',
    description: 'The e-invoice system: Liro sends and receives the invoices.',
    state: 'done',
    doneNote: 'Connected with the API key of 05.10.2026.',
    action: { label: 'Change', href: '#/setup/sef' },
  },
  {
    id: 'customers',
    title: 'Import customers',
    description: 'From a spreadsheet or the previous program.',
    state: 'todo',
    action: { label: 'Import customers', href: '#/sales/customers' },
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
    action: { label: 'New invoice', href: '#/sales/invoices/new' },
  },
]

// ── Employment contract RU-2026-017 ───────────────────────────────────────────────────────────

/** The signers in order (shared facts): the director signed on 05.10.2026. at 14:12. */
export function contractSigners(current: 'stefan' | 'none'): Signer[] {
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
    { id: 'jelena', name: 'Jelena Marković', role: 'Human resources', state: 'waiting' },
  ]
}

/** When Stefan signs in the example (Liro Bridge answers). */
export const STEFAN_SIGNS_AT = '2026-10-06T10:20:00+02:00'

export const DECLINE_REASONS = [
  { value: 'terms', label: 'The terms differ from what was agreed' },
  { value: 'data', label: 'My personal data are wrong' },
  { value: 'other', label: 'Another reason' },
]

export const CONTRACT_FILES = [
  { name: 'Job description, site engineer.pdf', size: '182 KB' },
  { name: 'Health and safety statement.pdf', size: '96 KB' },
]

// ── Tasks ─────────────────────────────────────────────────────────────────────────────────────

/** The board of Kvadrat Gradnja's tasks, each linked to a record of the dataset. */
export const TASKS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To do',
    cards: [
      {
        id: 't1',
        title: 'Send reminder for F-2026-0411',
        description: 'Drina Prevoz d.o.o. has not paid 58.440,00 RSD due on 03.10.2026.',
        assignee: { name: 'Dragan Ilić' },
        due: '2026-10-07',
        record: {
          kind: 'Invoice',
          number: 'F-2026-0411',
          state: 'Overdue',
          href: '#/sales/invoices',
        },
        meta: '2 comments',
      },
      {
        id: 't2',
        title: 'Approve UF-2026-1187 from EPS Snabdevanje',
        assignee: { name: 'Milica Petrović' },
        due: '2026-10-08',
        record: {
          kind: 'Supplier invoice',
          number: 'UF-2026-1187',
          state: 'To approve',
          href: '#/purchasing/approvals',
        },
      },
      {
        id: 't3',
        title: 'Submit the VAT return for September 2026',
        assignee: { name: 'Ivana Stojanović' },
        due: '2026-10-15',
        record: {
          kind: 'VAT return',
          number: '2026-09',
          state: 'Checked',
          href: '#/accounting/vat-return/2026-09',
        },
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
        description: 'Banca Intesa, 06.10.2026.: one payer is unknown.',
        assignee: { name: 'Ivana Stojanović' },
        due: '2026-10-06',
        record: {
          kind: 'Bank statement',
          number: '188',
          state: 'In progress',
          href: '#/banking/statements/188',
        },
      },
      {
        id: 't5',
        title: 'Collect the open amount of F-2026-0410',
        description: '67.762,75 RSD of 167.762,75 RSD is still open.',
        assignee: { name: 'Dragan Ilić' },
        due: '2026-10-25',
        record: {
          kind: 'Invoice',
          number: 'F-2026-0410',
          state: 'Partially paid',
          href: '#/sales/invoices/F-2026-0410',
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
        title: 'Signatures for the employment contract of Stefan Nikolić',
        description: 'Site engineer, starts on 02.11.2026.',
        assignee: { name: 'Jelena Marković' },
        due: '2026-10-30',
        record: {
          kind: 'Contract',
          number: 'RU-2026-017',
          state: 'Awaiting signatures',
          href: '#/hr/contracts/RU-2026-017/signing',
        },
      },
      {
        id: 't7',
        title: 'Confirm the delivery date with Panonija Agro',
        description: 'The customer asked for delivery on Friday.',
        assignee: { name: 'Dragan Ilić' },
        due: '2026-10-09',
        record: {
          kind: 'Invoice',
          number: 'F-2026-0412',
          state: 'Sent',
          href: '#/sales/invoices/F-2026-0412',
        },
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      {
        id: 't8',
        title: 'Book the payment from Medic Lab Niš',
        description: '100.000,00 RSD from the statement of 02.10.2026.',
        assignee: { name: 'Ivana Stojanović' },
        due: '2026-10-02',
        settled: true,
        record: {
          kind: 'Invoice',
          number: 'F-2026-0410',
          state: 'Partially paid',
          href: '#/sales/invoices/F-2026-0410',
        },
      },
    ],
  },
]

/*
 * Group Q's example data (P5.29 a and two views of b): Kvadrat Gradnja d.o.o.'s administration —
 * the overview, sign-in activity, the audit log, security and the integrations' health — and the
 * Liro team's platform: system status and network and infrastructure. Today is 14 October 2026,
 * now 09:40 in Belgrade. Everything is invented: people, devices, places, keys and figures; IP
 * addresses come only from the documentation ranges (192.0.2.0/24, 198.51.100.0/24,
 * 203.0.113.0/24, 2001:db8::/32) and e-mail addresses from example.com. Every count, state and
 * figure is the application's, played here. Not part of the package. No classes here.
 */
import type { ChartCategory } from '../../../../packages/ui/src/charts'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const Q_ROUTES = {
  /** The tenant's administration. */
  adminOverview: '/admin/overview',
  signIns: '/admin/sign-ins',
  /** Sign-in activity showing only the failed and blocked attempts. */
  signInsFailed: '/admin/sign-ins/failed',
  audit: '/admin/audit-log',
  /** The audit log narrowed to one user's changes to settings and roles. */
  auditFiltered: '/admin/audit-log/settings',
  security: '/admin/security',
  /** Security with the revocation of an API key asked. */
  securityRevoke: '/admin/security/revoke',
  integrations: '/admin/integrations',
  /** The Liro team's platform. */
  systemStatus: '/superadmin/status',
  systemStatusLoading: '/superadmin/status/loading',
  network: '/superadmin/network',
} as const

/** The examples' day and clock for these screens. */
export const Q_TODAY = '2026-10-14'
export const Q_NOW = '2026-10-14T09:40:00+02:00'

/** An instant in Belgrade on a day of October 2026 (summer time, +02:00). */
function at(day: string, time: string): string {
  return `2026-10-${day}T${time}:00+02:00`
}

// ── The tenant's users ────────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  /** The two-factor sign-in, as the Core reports it. */
  twoFactor: 'On' | 'Off' | 'Waiting for setup'
  /** The method when on. */
  method?: string
  lastSignIn: string | null
}

export const ADMIN_USERS: AdminUser[] = [
  {
    id: 'u1',
    name: 'Milica Petrović',
    email: 'milica.petrovic@example.com',
    role: 'Administrator',
    twoFactor: 'On',
    method: 'Authenticator app',
    lastSignIn: at('14', '07:58'),
  },
  {
    id: 'u2',
    name: 'Nenad Kovačević',
    email: 'nenad.kovacevic@example.com',
    role: 'Administrator',
    twoFactor: 'On',
    method: 'Authenticator app',
    lastSignIn: at('13', '14:05'),
  },
  {
    id: 'u3',
    name: 'Ivana Stojanović',
    email: 'ivana.stojanovic@example.com',
    role: 'Accountant',
    twoFactor: 'On',
    method: 'Authenticator app',
    lastSignIn: at('14', '08:31'),
  },
  {
    id: 'u4',
    name: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    role: 'Sales',
    twoFactor: 'Off',
    lastSignIn: at('14', '09:12'),
  },
  {
    id: 'u5',
    name: 'Marko Đorđević',
    email: 'marko.djordjevic@example.com',
    role: 'Warehouse',
    twoFactor: 'Off',
    lastSignIn: at('14', '06:47'),
  },
  {
    id: 'u6',
    name: 'Snežana Popović',
    email: 'snezana.popovic@example.com',
    role: 'Site manager',
    twoFactor: 'On',
    method: 'Text message',
    lastSignIn: at('14', '06:20'),
  },
  {
    id: 'u7',
    name: 'Jelena Marković',
    email: 'jelena.markovic@example.com',
    role: 'Read only',
    twoFactor: 'Waiting for setup',
    lastSignIn: at('12', '09:31'),
  },
  {
    id: 'u8',
    name: 'Stefan Nikolić',
    email: 'stefan.nikolic@example.com',
    role: 'Site manager',
    twoFactor: 'Off',
    lastSignIn: at('13', '17:44'),
  },
]

/** The overview's figures, as the Core reports them. */
export const ADMIN_FIGURES = {
  users: 24,
  invited: 2,
  activeSessions: 17,
  devices: 21,
  failedToday: 7,
  failedYesterday: 2,
  withoutTwoFactor: ADMIN_USERS.filter((user) => user.twoFactor !== 'On').length,
  integrationsWithErrors: 2,
  integrations: 7,
  seatsUsed: 24,
  seats: 30,
  plan: 'Business',
  renews: '2027-01-01',
} as const

/** Failed and blocked sign-ins per day, the last seven days (the Core's counts). */
export const FAILED_BY_DAY = {
  categories: [
    { key: '08', label: '08.10.' },
    { key: '09', label: '09.10.' },
    { key: '10', label: '10.10.' },
    { key: '11', label: '11.10.' },
    { key: '12', label: '12.10.' },
    { key: '13', label: '13.10.' },
    { key: '14', label: '14.10.' },
  ] satisfies ChartCategory[],
  values: {
    failed: { '08': '2', '09': '4', '10': '1', '11': '0', '12': '1', '13': '2', '14': '5' },
    blocked: { '08': '0', '09': '0', '10': '0', '11': '0', '12': '0', '13': '0', '14': '2' },
  },
}

// ── Sign-in activity ──────────────────────────────────────────────────────────────────────────

export type SignInResult = 'Success' | 'Failed' | 'Blocked'

export interface SignInEvent {
  id: string
  at: string
  userId: string
  user: string
  email: string
  result: SignInResult
  /** Why it failed or was blocked, in the Core's words. */
  reason?: string
  /** "Chrome 129 on Windows 11". */
  device: string
  kind: 'desktop' | 'phone' | 'tablet'
  /** Approximate, from the address. */
  place: string
  address: string
}

export const SIGN_INS: SignInEvent[] = [
  {
    id: 's1',
    at: at('14', '09:36'),
    userId: 'u4',
    user: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    result: 'Blocked',
    reason: 'Too many failed attempts; blocked for 15 minutes',
    device: 'Firefox 131 on Linux',
    kind: 'desktop',
    place: 'Amsterdam, Netherlands',
    address: '192.0.2.77',
  },
  {
    id: 's2',
    at: at('14', '09:35'),
    userId: 'u4',
    user: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    result: 'Blocked',
    reason: 'Too many failed attempts; blocked for 15 minutes',
    device: 'Firefox 131 on Linux',
    kind: 'desktop',
    place: 'Amsterdam, Netherlands',
    address: '192.0.2.77',
  },
  {
    id: 's3',
    at: at('14', '09:33'),
    userId: 'u4',
    user: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    result: 'Failed',
    reason: 'Wrong password',
    device: 'Firefox 131 on Linux',
    kind: 'desktop',
    place: 'Amsterdam, Netherlands',
    address: '192.0.2.77',
  },
  {
    id: 's4',
    at: at('14', '09:32'),
    userId: 'u4',
    user: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    result: 'Failed',
    reason: 'Wrong password',
    device: 'Firefox 131 on Linux',
    kind: 'desktop',
    place: 'Amsterdam, Netherlands',
    address: '192.0.2.77',
  },
  {
    id: 's5',
    at: at('14', '09:31'),
    userId: 'u4',
    user: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    result: 'Failed',
    reason: 'Wrong password',
    device: 'Firefox 131 on Linux',
    kind: 'desktop',
    place: 'Amsterdam, Netherlands',
    address: '192.0.2.77',
  },
  {
    id: 's6',
    at: at('14', '09:12'),
    userId: 'u4',
    user: 'Dragan Ilić',
    email: 'dragan.ilic@example.com',
    result: 'Success',
    device: 'Chrome 129 on Windows 11',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '203.0.113.24',
  },
  {
    id: 's7',
    at: at('14', '08:31'),
    userId: 'u3',
    user: 'Ivana Stojanović',
    email: 'ivana.stojanovic@example.com',
    result: 'Success',
    device: 'Edge 129 on Windows 11',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '203.0.113.31',
  },
  {
    id: 's8',
    at: at('14', '08:02'),
    userId: 'u7',
    user: 'Jelena Marković',
    email: 'jelena.markovic@example.com',
    result: 'Failed',
    reason: 'Two-factor code not accepted',
    device: 'Safari on iPhone',
    kind: 'phone',
    place: 'Belgrade, Serbia',
    address: '2001:db8:4a1c::17',
  },
  {
    id: 's9',
    at: at('14', '07:58'),
    userId: 'u1',
    user: 'Milica Petrović',
    email: 'milica.petrovic@example.com',
    result: 'Success',
    device: 'Chrome 129 on macOS',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '203.0.113.24',
  },
  {
    id: 's10',
    at: at('14', '06:47'),
    userId: 'u5',
    user: 'Marko Đorđević',
    email: 'marko.djordjevic@example.com',
    result: 'Success',
    device: 'Liro app on Android',
    kind: 'phone',
    place: 'Zrenjanin, Serbia',
    address: '198.51.100.140',
  },
  {
    id: 's11',
    at: at('14', '06:44'),
    userId: 'u5',
    user: 'Marko Đorđević',
    email: 'marko.djordjevic@example.com',
    result: 'Failed',
    reason: 'Wrong password',
    device: 'Liro app on Android',
    kind: 'phone',
    place: 'Zrenjanin, Serbia',
    address: '198.51.100.140',
  },
  {
    id: 's12',
    at: at('14', '06:20'),
    userId: 'u6',
    user: 'Snežana Popović',
    email: 'snezana.popovic@example.com',
    result: 'Success',
    device: 'Chrome on Android tablet',
    kind: 'tablet',
    place: 'Novi Sad, Serbia',
    address: '198.51.100.23',
  },
  {
    id: 's13',
    at: at('13', '17:44'),
    userId: 'u8',
    user: 'Stefan Nikolić',
    email: 'stefan.nikolic@example.com',
    result: 'Success',
    device: 'Safari 18 on macOS',
    kind: 'desktop',
    place: 'Sremska Mitrovica, Serbia',
    address: '198.51.100.62',
  },
  {
    id: 's14',
    at: at('13', '14:05'),
    userId: 'u2',
    user: 'Nenad Kovačević',
    email: 'nenad.kovacevic@example.com',
    result: 'Success',
    device: 'Chrome 129 on Windows 11',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '203.0.113.25',
  },
  {
    id: 's15',
    at: at('13', '11:20'),
    userId: 'u8',
    user: 'Stefan Nikolić',
    email: 'stefan.nikolic@example.com',
    result: 'Failed',
    reason: 'Unknown e-mail address',
    device: 'Safari 18 on macOS',
    kind: 'desktop',
    place: 'Sremska Mitrovica, Serbia',
    address: '198.51.100.62',
  },
  {
    id: 's16',
    at: at('13', '08:12'),
    userId: 'u3',
    user: 'Ivana Stojanović',
    email: 'ivana.stojanovic@example.com',
    result: 'Success',
    device: 'Edge 129 on Windows 11',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '203.0.113.31',
  },
  {
    id: 's17',
    at: at('13', '07:40'),
    userId: 'u6',
    user: 'Snežana Popović',
    email: 'snezana.popovic@example.com',
    result: 'Failed',
    reason: 'Two-factor code expired',
    device: 'Chrome on Android tablet',
    kind: 'tablet',
    place: 'Novi Sad, Serbia',
    address: '198.51.100.23',
  },
  {
    id: 's18',
    at: at('13', '07:41'),
    userId: 'u6',
    user: 'Snežana Popović',
    email: 'snezana.popovic@example.com',
    result: 'Success',
    device: 'Chrome on Android tablet',
    kind: 'tablet',
    place: 'Novi Sad, Serbia',
    address: '198.51.100.23',
  },
].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)) as SignInEvent[]

/** How many sign-ins the whole result holds (the Core's count; the page shows the first). */
export const SIGN_IN_COUNT = 1_412

/** Whether a sign-in did not succeed. */
export function unsuccessful(event: SignInEvent): boolean {
  return event.result !== 'Success'
}

/** The reasons the administrator may give for seeing an address (the Core's list). */
export const ADDRESS_REASONS = [
  { value: 'investigate', label: 'Investigating a failed or blocked sign-in' },
  { value: 'user', label: 'The user asked about a sign-in' },
  { value: 'block', label: 'Blocking an address' },
]

// ── Audit log ─────────────────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string
  at: string
  who: string
  /** What kind of record. */
  kind: 'Invoice' | 'Customer' | 'User' | 'Role' | 'Setting' | 'API key'
  /** The record, as the Core names it. */
  record: string
  field: string
  /** Before and after, written by the Core; null: empty. */
  old: string | null
  new: string | null
  address: string
  /** The Core's request id, for support. */
  request: string
}

export const AUDIT: AuditEntry[] = [
  {
    id: 'a1',
    at: at('14', '09:38'),
    who: 'Milica Petrović',
    kind: 'User',
    record: 'Dragan Ilić',
    field: 'Sign-in',
    old: 'Allowed',
    new: 'Locked until he resets his password',
    address: '203.0.113.24',
    request: 'req_7Q2M4P9X',
  },
  {
    id: 'a2',
    at: at('14', '09:20'),
    who: 'Ivana Stojanović',
    kind: 'Invoice',
    record: 'F-2026-0412',
    field: 'Due date',
    old: '05.10.2026.',
    new: '12.10.2026.',
    address: '203.0.113.31',
    request: 'req_7Q2M4P9W',
  },
  {
    id: 'a3',
    at: at('14', '08:54'),
    who: 'Ivana Stojanović',
    kind: 'Customer',
    record: 'Drina Prevoz d.o.o.',
    field: 'Payment terms',
    old: '15 days',
    new: '30 days',
    address: '203.0.113.31',
    request: 'req_7Q2M4P9V',
  },
  {
    id: 'a4',
    at: at('14', '08:10'),
    who: 'Milica Petrović',
    kind: 'Setting',
    record: 'Security policy',
    field: 'Two-factor sign-in',
    old: 'Optional',
    new: 'Required for administrators and accountants',
    address: '203.0.113.24',
    request: 'req_7Q2M4P9T',
  },
  {
    id: 'a5',
    at: at('14', '08:09'),
    who: 'Milica Petrović',
    kind: 'Setting',
    record: 'Security policy',
    field: 'Idle sign-out',
    old: '60 minutes',
    new: '30 minutes',
    address: '203.0.113.24',
    request: 'req_7Q2M4P9S',
  },
  {
    id: 'a6',
    at: at('13', '16:31'),
    who: 'Nenad Kovačević',
    kind: 'API key',
    record: 'Old e-shop sync',
    field: 'State',
    old: 'Active',
    new: 'Revoked',
    address: '203.0.113.25',
    request: 'req_7Q2M4P8Z',
  },
  {
    id: 'a7',
    at: at('13', '15:02'),
    who: 'Nenad Kovačević',
    kind: 'Role',
    record: 'Warehouse',
    field: 'Permissions: Stock',
    old: 'View',
    new: 'View, Count, Move',
    address: '203.0.113.25',
    request: 'req_7Q2M4P8Y',
  },
  {
    id: 'a8',
    at: at('13', '14:40'),
    who: 'Nenad Kovačević',
    kind: 'User',
    record: 'Stefan Nikolić',
    field: 'Roles',
    old: null,
    new: 'Site manager',
    address: '203.0.113.25',
    request: 'req_7Q2M4P8X',
  },
  {
    id: 'a9',
    at: at('13', '11:05'),
    who: 'Dragan Ilić',
    kind: 'Invoice',
    record: 'F-2026-0418',
    field: 'Note',
    old: null,
    new: 'Delivery on Friday, gate 2.',
    address: '203.0.113.24',
    request: 'req_7Q2M4P8W',
  },
  {
    id: 'a10',
    at: at('12', '10:15'),
    who: 'Milica Petrović',
    kind: 'User',
    record: 'Zoran Lukić',
    field: 'State',
    old: 'Active',
    new: 'Deactivated',
    address: '203.0.113.24',
    request: 'req_7Q2M4P8V',
  },
  {
    id: 'a11',
    at: at('12', '10:12'),
    who: 'Milica Petrović',
    kind: 'API key',
    record: 'Payroll export to the bank',
    field: 'Expires',
    old: '31.10.2026.',
    new: '30.04.2027.',
    address: '203.0.113.24',
    request: 'req_7Q2M4P8T',
  },
  {
    id: 'a12',
    at: at('10', '13:47'),
    who: 'Ivana Stojanović',
    kind: 'Customer',
    record: 'Medic Lab Niš d.o.o.',
    field: 'E-mail for invoices',
    old: 'racuni@medic-lab.example.com',
    new: 'finance@medic-lab.example.com',
    address: '203.0.113.31',
    request: 'req_7Q2M4P8S',
  },
]

/** How many entries the whole log holds (the Core's count). */
export const AUDIT_COUNT = 48_310

export const AUDIT_KINDS = ['Invoice', 'Customer', 'User', 'Role', 'Setting', 'API key'] as const

/** The people who changed something (the Core's list for the filter). */
export const AUDIT_PEOPLE = [...new Set(AUDIT.map((entry) => entry.who))].sort()

// ── Security ──────────────────────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string
  name: string
  /** The key's visible start; the rest is never shown again after creation. */
  prefix: string
  scopes: string
  created: string
  createdBy: string
  lastUsed: string | null
  expires: string | null
  state: 'Active' | 'Revoked' | 'Expires soon'
}

export const API_KEYS: ApiKey[] = [
  {
    id: 'k1',
    name: 'Liro Bridge, warehouse scales',
    prefix: 'lk_live_7Q2M',
    scopes: 'Stock: write',
    created: '2026-03-02',
    createdBy: 'Nenad Kovačević',
    lastUsed: at('14', '09:39'),
    expires: null,
    state: 'Active',
  },
  {
    id: 'k2',
    name: 'Payroll export to the bank',
    prefix: 'lk_live_4P9X',
    scopes: 'Payroll: read',
    created: '2025-10-30',
    createdBy: 'Milica Petrović',
    lastUsed: at('06', '07:12'),
    expires: '2027-04-30',
    state: 'Active',
  },
  {
    id: 'k3',
    name: 'Reports for the bank (read only)',
    prefix: 'lk_live_2W8K',
    scopes: 'Reports: read',
    created: '2025-11-03',
    createdBy: 'Milica Petrović',
    lastUsed: at('13', '23:00'),
    expires: '2026-10-23',
    state: 'Expires soon',
  },
  {
    id: 'k4',
    name: 'Old e-shop sync',
    prefix: 'lk_live_9T3B',
    scopes: 'Sales: write',
    created: '2024-05-14',
    createdBy: 'Nenad Kovačević',
    lastUsed: at('01', '18:22'),
    expires: null,
    state: 'Revoked',
  },
]

/** The devices signed in to one user's account, for the administrator. */
export const USER_SESSIONS: Record<
  string,
  {
    id: string
    device: string
    kind: 'desktop' | 'phone' | 'tablet'
    place: string
    address: string
    lastActive: string
  }[]
> = {
  u4: [
    {
      id: 'd1',
      device: 'Chrome 129 on Windows 11',
      kind: 'desktop',
      place: 'Novi Sad, Serbia',
      address: '203.0.113.24',
      lastActive: at('14', '09:30'),
    },
    {
      id: 'd2',
      device: 'Liro app on iPhone',
      kind: 'phone',
      place: 'Novi Sad, Serbia',
      address: '198.51.100.88',
      lastActive: at('13', '19:02'),
    },
    {
      id: 'd3',
      device: 'Firefox 131 on Linux',
      kind: 'desktop',
      place: 'Amsterdam, Netherlands',
      address: '192.0.2.77',
      lastActive: at('09', '22:14'),
    },
  ],
  u5: [
    {
      id: 'd4',
      device: 'Liro app on Android',
      kind: 'phone',
      place: 'Zrenjanin, Serbia',
      address: '198.51.100.140',
      lastActive: at('14', '09:05'),
    },
  ],
  u6: [
    {
      id: 'd5',
      device: 'Chrome on Android tablet',
      kind: 'tablet',
      place: 'Novi Sad, Serbia',
      address: '198.51.100.23',
      lastActive: at('14', '08:40'),
    },
    {
      id: 'd6',
      device: 'Chrome 129 on Windows 10',
      kind: 'desktop',
      place: 'Novi Sad, Serbia',
      address: '203.0.113.40',
      lastActive: at('10', '15:21'),
    },
  ],
}

/** The tenant's password and session policy, as the Core stores it. */
export const POLICY = [
  { key: 'length', label: 'Minimum password length', value: '12 characters' },
  { key: 'reuse', label: 'Earlier passwords not allowed', value: 'The last 5' },
  { key: 'lockout', label: 'Lock after failed attempts', value: '5 attempts, for 15 minutes' },
  {
    key: 'twoFactor',
    label: 'Two-factor sign-in',
    value: 'Required for administrators and accountants',
  },
  { key: 'idle', label: 'Sign out when idle', value: 'After 30 minutes' },
  { key: 'session', label: 'Longest session', value: '12 hours' },
  { key: 'devices', label: 'Devices per user', value: 'At most 5' },
  { key: 'places', label: 'Sign-in allowed from', value: 'Serbia and the European Union' },
]

// ── Integrations ──────────────────────────────────────────────────────────────────────────────

export interface Integration {
  id: string
  name: string
  detail: string
  state: 'Up' | 'Degraded' | 'Down' | 'In maintenance'
  note?: string
  metrics: { key: string; label: string; value: string }[]
  lastSuccess: string | null
  lastError?: { at: string; message: string }
  retry?: boolean
}

export const INTEGRATIONS: Integration[] = [
  {
    id: 'sef',
    name: 'SEF (e-invoicing)',
    detail: 'Sends and receives e-invoices · production',
    state: 'Down',
    note: 'Invoices wait and are sent when the connection works again.',
    metrics: [
      { key: 'waiting', label: 'Waiting to send', value: '14' },
      { key: 'today', label: 'Sent today', value: '0' },
    ],
    lastSuccess: at('14', '07:55'),
    lastError: {
      at: at('14', '09:31'),
      message: 'The service did not answer within 30 seconds (attempt 6 of 10).',
    },
    retry: true,
  },
  {
    id: 'intesa',
    name: 'Banca Intesa, statements',
    detail: 'Account 160-0000000412-77',
    state: 'Degraded',
    note: 'The bank reports a slow service; statements arrive late.',
    metrics: [{ key: 'statement', label: 'Last statement', value: '188' }],
    lastSuccess: at('14', '06:02'),
    lastError: { at: at('14', '02:01'), message: 'Timeout after 120 seconds.' },
    retry: true,
  },
  {
    id: 'raiffeisen',
    name: 'Raiffeisen, statements and payments',
    detail: 'Account 265-0000000033-12',
    state: 'Up',
    metrics: [
      { key: 'statement', label: 'Last statement', value: '92' },
      { key: 'orders', label: 'Payments sent today', value: '3' },
    ],
    lastSuccess: at('14', '09:15'),
  },
  {
    id: 'mail',
    name: 'Outgoing e-mail',
    detail: 'mail.example.com',
    state: 'Up',
    metrics: [
      { key: 'sent', label: 'Sent today', value: '231' },
      { key: 'bounced', label: 'Bounced', value: '2' },
    ],
    lastSuccess: at('14', '09:38'),
    lastError: {
      at: at('13', '16:12'),
      message: 'finance@drina.example.com: mailbox full (2 messages kept for a retry).',
    },
  },
  {
    id: 'bridge',
    name: 'Liro Bridge, warehouse scales',
    detail: 'Version 2.4.1 at the yard office',
    state: 'In maintenance',
    note: 'Updating to 2.5.0 until 10:00; weighings wait on the scale.',
    metrics: [{ key: 'weighings', label: 'Weighings today', value: '38' }],
    lastSuccess: at('14', '08:59'),
  },
  {
    id: 'eporezi',
    name: 'Tax administration (ePorezi)',
    detail: 'Tax returns and payroll filings',
    state: 'Up',
    metrics: [{ key: 'filed', label: 'Filed this month', value: '4' }],
    lastSuccess: at('10', '11:42'),
  },
  {
    id: 'nbs',
    name: 'NBS exchange rates',
    detail: 'Daily middle rates',
    state: 'Up',
    metrics: [{ key: 'rates', label: 'Rate list', value: '198/2026' }],
    lastSuccess: at('14', '08:01'),
  },
]

// ── System status (the Liro platform) ─────────────────────────────────────────────────────────

export interface PlatformThing {
  id: string
  name: string
  detail?: string
  state: 'Up' | 'Degraded' | 'Down' | 'In maintenance' | 'No report'
  note?: string
  metrics?: { key: string; label: string; value: string }[]
  lastSuccess?: string | null
  lastError?: { at: string; message: string }
}

export const PLATFORM_FIGURES = {
  servicesUp: 10,
  services: 12,
  uptime: '99.962',
  responseP95: '184',
  errorRate: '0.41',
  tenants: 1_284,
} as const

export const SERVICES: PlatformThing[] = [
  {
    id: 'web',
    name: 'Web application',
    detail: 'app.liro.example.com',
    state: 'Up',
    metrics: [
      { key: 'uptime', label: 'Uptime, 30 days', value: '99,99%' },
      { key: 'p95', label: 'Response, p95', value: '142 ms' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'api',
    name: 'Public API',
    detail: 'api.liro.example.com',
    state: 'Up',
    metrics: [
      { key: 'uptime', label: 'Uptime, 30 days', value: '99,98%' },
      { key: 'p95', label: 'Response, p95', value: '96 ms' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'auth',
    name: 'Sign-in service',
    detail: 'Passwords, two-factor codes, single sign-on',
    state: 'Degraded',
    note: 'Text messages with codes arrive late at one operator; apps and keys work.',
    metrics: [
      { key: 'uptime', label: 'Uptime, 30 days', value: '99,95%' },
      { key: 'p95', label: 'Code delivery, p95', value: '48 s' },
    ],
    lastSuccess: at('14', '09:40'),
    lastError: { at: at('14', '09:22'), message: 'SMS gateway: 31% of messages delayed.' },
  },
  {
    id: 'sef',
    name: 'E-invoicing gateway',
    detail: 'To and from SEF for every tenant',
    state: 'Down',
    note: 'SEF does not answer; invoices queue and are sent later. See the incident.',
    metrics: [
      { key: 'uptime', label: 'Uptime, 30 days', value: '99,71%' },
      { key: 'queue', label: 'Waiting', value: '3.418' },
    ],
    lastSuccess: at('14', '07:56'),
    lastError: { at: at('14', '09:39'), message: 'Upstream timeout after 30 s (SEF).' },
  },
  {
    id: 'docs',
    name: 'Documents and PDF',
    detail: 'Rendering and storage of documents',
    state: 'Up',
    metrics: [
      { key: 'uptime', label: 'Uptime, 30 days', value: '99,99%' },
      { key: 'p95', label: 'PDF, p95', value: '1,8 s' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'reports',
    name: 'Reports and exports',
    detail: 'Long reports run as jobs',
    state: 'In maintenance',
    note: 'Maintenance 09:30–10:00: exports wait and run after it.',
    metrics: [{ key: 'uptime', label: 'Uptime, 30 days', value: '99,96%' }],
    lastSuccess: at('14', '09:29'),
  },
]

export const QUEUES: PlatformThing[] = [
  {
    id: 'q-einvoice',
    name: 'E-invoices out',
    state: 'Degraded',
    note: 'Growing while SEF does not answer.',
    metrics: [
      { key: 'waiting', label: 'Waiting', value: '3.418' },
      { key: 'oldest', label: 'Oldest', value: '1 h 44 min' },
      { key: 'rate', label: 'Processed, per minute', value: '0' },
    ],
    lastSuccess: at('14', '07:56'),
    lastError: { at: at('14', '09:39'), message: 'Retries paused: upstream unavailable.' },
  },
  {
    id: 'q-mail',
    name: 'E-mail',
    state: 'Up',
    metrics: [
      { key: 'waiting', label: 'Waiting', value: '12' },
      { key: 'oldest', label: 'Oldest', value: '4 s' },
      { key: 'rate', label: 'Processed, per minute', value: '1.920' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'q-bank',
    name: 'Bank statements in',
    state: 'Up',
    metrics: [
      { key: 'waiting', label: 'Waiting', value: '0' },
      { key: 'oldest', label: 'Oldest', value: '—' },
      { key: 'rate', label: 'Processed, per minute', value: '41' },
    ],
    lastSuccess: at('14', '09:38'),
  },
]

export const DATA_STORES: PlatformThing[] = [
  {
    id: 'db-primary',
    name: 'Main database',
    detail: 'Primary, Frankfurt',
    state: 'Up',
    metrics: [
      { key: 'connections', label: 'Connections', value: '412 of 1.000' },
      { key: 'size', label: 'Size', value: '1,84 TB' },
      { key: 'lag', label: 'Replica lag', value: '0,4 s' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'db-replica',
    name: 'Main database, standby',
    detail: 'Replica, Belgrade',
    state: 'Up',
    metrics: [{ key: 'lag', label: 'Lag behind the primary', value: '0,9 s' }],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'storage',
    name: 'Document storage',
    detail: 'Object storage, two regions',
    state: 'Up',
    metrics: [
      { key: 'used', label: 'Used', value: '38,2 of 60 TB' },
      { key: 'growth', label: 'Growth, 30 days', value: '+1,6 TB' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'search',
    name: 'Search index',
    state: 'Up',
    metrics: [{ key: 'delay', label: 'Index delay', value: '3 s' }],
    lastSuccess: at('14', '09:40'),
  },
]

export const BACKUPS: PlatformThing[] = [
  {
    id: 'b-full',
    name: 'Nightly full backup',
    detail: 'Main database, kept 35 days',
    state: 'Up',
    metrics: [
      { key: 'size', label: 'Size', value: '1,79 TB' },
      { key: 'duration', label: 'Took', value: '41 min' },
    ],
    lastSuccess: at('14', '03:12'),
  },
  {
    id: 'b-incremental',
    name: 'Hourly incremental backup',
    detail: 'Main database and documents',
    state: 'Up',
    metrics: [{ key: 'size', label: 'Last size', value: '6,2 GB' }],
    lastSuccess: at('14', '09:02'),
  },
  {
    id: 'b-offsite',
    name: 'Copy to the second region',
    detail: 'Belgrade, encrypted',
    state: 'Degraded',
    note: 'Last night’s copy finished late; the next one runs at 03:30.',
    metrics: [{ key: 'behind', label: 'Behind the full backup', value: '1 night' }],
    lastSuccess: at('13', '05:40'),
    lastError: { at: at('14', '04:58'), message: 'Transfer slowed to 40 MB/s; stopped at 06:00.' },
  },
  {
    id: 'b-restore',
    name: 'Restore test, weekly',
    detail: 'The full backup restored on a clean server and checked',
    state: 'Up',
    note: 'Passed: restored in 52 minutes, 1.284 tenants checked.',
    lastSuccess: at('07', '04:40'),
  },
]

export interface Certificate {
  id: string
  name: string
  usedBy: string
  issuer: string
  expires: string
  state: 'Valid' | 'Expires soon'
  note: string
}

export const CERTIFICATES: Certificate[] = [
  {
    id: 'c1',
    name: 'app.liro.example.com',
    usedBy: 'Web application',
    issuer: 'Illustrative CA',
    expires: '2026-10-23',
    state: 'Expires soon',
    note: 'Renews by itself on 16.10.2026.',
  },
  {
    id: 'c2',
    name: 'SEF client certificate',
    usedBy: 'E-invoicing gateway',
    issuer: 'Illustrative CA',
    expires: '2026-11-05',
    state: 'Expires soon',
    note: 'Renewed by hand; owner: Platform team.',
  },
  {
    id: 'c3',
    name: 'api.liro.example.com',
    usedBy: 'Public API',
    issuer: 'Illustrative CA',
    expires: '2027-01-12',
    state: 'Valid',
    note: 'Renews by itself.',
  },
  {
    id: 'c4',
    name: 'Bank connections (mutual TLS)',
    usedBy: 'Bank statements and payments',
    issuer: 'Illustrative Bank CA',
    expires: '2027-06-30',
    state: 'Valid',
    note: 'Renewed by hand.',
  },
]

export interface Maintenance {
  id: string
  start: string
  end: string
  what: string
  affects: string
  state: 'In progress' | 'Scheduled'
}

export const MAINTENANCE: Maintenance[] = [
  {
    id: 'm1',
    start: at('14', '09:30'),
    end: at('14', '10:00'),
    what: 'Reports engine update',
    affects: 'Exports wait and run after it',
    state: 'In progress',
  },
  {
    id: 'm2',
    start: at('18', '02:00'),
    end: at('18', '03:00'),
    what: 'Main database upgrade',
    affects: 'Every tenant read only for up to 10 minutes',
    state: 'Scheduled',
  },
  {
    id: 'm3',
    // After the clocks go back on 25 October: winter time, +01:00.
    start: '2026-10-25T22:00:00+01:00',
    end: '2026-10-25T23:00:00+01:00',
    what: 'Network change in Frankfurt',
    affects: 'None expected',
    state: 'Scheduled',
  },
]

/** The last 24 hours, hour by hour, ending at 09:00 today. */
export const HOURS: ChartCategory[] = Array.from({ length: 24 }, (_, index) => {
  const hour = (10 + index) % 24
  const label = `${String(hour).padStart(2, '0')}:00`
  return { key: `h${String(index)}`, label }
})

function hourly(values: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((value, index) => [`h${String(index)}`, value]))
}

/** Response time, milliseconds: the median and the 95th percentile (the monitoring's figures). */
export const RESPONSE_TIME = {
  p50: hourly([
    '62',
    '64',
    '66',
    '63',
    '61',
    '60',
    '58',
    '55',
    '52',
    '49',
    '47',
    '45',
    '44',
    '44',
    '45',
    '46',
    '48',
    '52',
    '58',
    '63',
    '66',
    '67',
    '69',
    '71',
  ]),
  p95: hourly([
    '160',
    '171',
    '178',
    '166',
    '158',
    '152',
    '147',
    '139',
    '128',
    '121',
    '115',
    '112',
    '110',
    '111',
    '114',
    '118',
    '124',
    '136',
    '151',
    '166',
    '172',
    '176',
    '181',
    '184',
  ]),
}

/** Errors as a percentage of requests (the monitoring's figures). */
export const ERROR_RATE = {
  errors: hourly([
    '0.08',
    '0.07',
    '0.09',
    '0.08',
    '0.06',
    '0.05',
    '0.05',
    '0.04',
    '0.04',
    '0.03',
    '0.03',
    '0.03',
    '0.03',
    '0.04',
    '0.05',
    '0.06',
    '0.07',
    '0.08',
    '0.09',
    '0.12',
    '0.14',
    '0.38',
    '0.44',
    '0.41',
  ]),
}

// ── Network and infrastructure ────────────────────────────────────────────────────────────────

export const REGIONS: PlatformThing[] = [
  {
    id: 'fra',
    name: 'Frankfurt',
    detail: 'Primary region · 3 zones',
    state: 'Up',
    metrics: [
      { key: 'latency', label: 'Latency from Belgrade', value: '18 ms' },
      { key: 'nodes', label: 'Nodes', value: '24 of 24' },
      { key: 'alerts', label: 'Open alerts', value: '1' },
    ],
    lastSuccess: at('14', '09:40'),
  },
  {
    id: 'beg',
    name: 'Belgrade',
    detail: 'Second region · standby and backups',
    state: 'Degraded',
    note: 'One storage node is slow; copies take longer.',
    metrics: [
      { key: 'latency', label: 'Latency from Belgrade', value: '4 ms' },
      { key: 'nodes', label: 'Nodes', value: '9 of 10' },
      { key: 'alerts', label: 'Open alerts', value: '2' },
    ],
    lastSuccess: at('14', '09:40'),
    lastError: { at: at('14', '04:58'), message: 'stor-beg-3: disk latency above 200 ms.' },
  },
  {
    id: 'ams',
    name: 'Amsterdam',
    detail: 'Edge only · static files and the status page',
    state: 'Up',
    metrics: [
      { key: 'latency', label: 'Latency from Belgrade', value: '31 ms' },
      { key: 'nodes', label: 'Nodes', value: '4 of 4' },
      { key: 'alerts', label: 'Open alerts', value: '0' },
    ],
    lastSuccess: at('14', '09:40'),
  },
]

export interface InfraNode {
  id: string
  name: string
  role: 'Web' | 'API' | 'Worker' | 'Database' | 'Storage' | 'Edge'
  region: 'Frankfurt' | 'Belgrade' | 'Amsterdam'
  address: string
  state: 'Up' | 'Degraded' | 'Down' | 'In maintenance'
  cpu: string
  memory: string
  latency: string
  alerts: number
}

export const NODES: InfraNode[] = [
  {
    id: 'n1',
    name: 'web-fra-1',
    role: 'Web',
    region: 'Frankfurt',
    address: '198.51.100.11',
    state: 'Up',
    cpu: '38%',
    memory: '61%',
    latency: '12 ms',
    alerts: 0,
  },
  {
    id: 'n2',
    name: 'web-fra-2',
    role: 'Web',
    region: 'Frankfurt',
    address: '198.51.100.12',
    state: 'Up',
    cpu: '41%',
    memory: '59%',
    latency: '13 ms',
    alerts: 0,
  },
  {
    id: 'n3',
    name: 'api-fra-1',
    role: 'API',
    region: 'Frankfurt',
    address: '198.51.100.21',
    state: 'Up',
    cpu: '52%',
    memory: '64%',
    latency: '9 ms',
    alerts: 0,
  },
  {
    id: 'n4',
    name: 'api-fra-2',
    role: 'API',
    region: 'Frankfurt',
    address: '198.51.100.22',
    state: 'Up',
    cpu: '49%',
    memory: '66%',
    latency: '9 ms',
    alerts: 0,
  },
  {
    id: 'n5',
    name: 'worker-fra-1',
    role: 'Worker',
    region: 'Frankfurt',
    address: '198.51.100.31',
    state: 'Degraded',
    cpu: '93%',
    memory: '88%',
    latency: '15 ms',
    alerts: 1,
  },
  {
    id: 'n6',
    name: 'worker-fra-2',
    role: 'Worker',
    region: 'Frankfurt',
    address: '198.51.100.32',
    state: 'Up',
    cpu: '71%',
    memory: '70%',
    latency: '14 ms',
    alerts: 0,
  },
  {
    id: 'n7',
    name: 'db-fra-1',
    role: 'Database',
    region: 'Frankfurt',
    address: '198.51.100.41',
    state: 'Up',
    cpu: '44%',
    memory: '78%',
    latency: '2 ms',
    alerts: 0,
  },
  {
    id: 'n8',
    name: 'db-beg-1',
    role: 'Database',
    region: 'Belgrade',
    address: '203.0.113.41',
    state: 'Up',
    cpu: '21%',
    memory: '74%',
    latency: '3 ms',
    alerts: 0,
  },
  {
    id: 'n9',
    name: 'stor-beg-3',
    role: 'Storage',
    region: 'Belgrade',
    address: '203.0.113.53',
    state: 'Degraded',
    cpu: '18%',
    memory: '40%',
    latency: '212 ms',
    alerts: 2,
  },
  {
    id: 'n10',
    name: 'stor-beg-4',
    role: 'Storage',
    region: 'Belgrade',
    address: '203.0.113.54',
    state: 'In maintenance',
    cpu: '—',
    memory: '—',
    latency: '—',
    alerts: 0,
  },
  {
    id: 'n11',
    name: 'edge-ams-1',
    role: 'Edge',
    region: 'Amsterdam',
    address: '2001:db8:ac10::1',
    state: 'Up',
    cpu: '12%',
    memory: '33%',
    latency: '6 ms',
    alerts: 0,
  },
  {
    id: 'n12',
    name: 'edge-ams-2',
    role: 'Edge',
    region: 'Amsterdam',
    address: '2001:db8:ac10::2',
    state: 'Up',
    cpu: '11%',
    memory: '31%',
    latency: '6 ms',
    alerts: 0,
  },
]

/** The whole fleet's count (the Core's; the table shows the first page). */
export const NODE_COUNT = 38

export interface InfraAlert {
  id: string
  severity: 'Critical' | 'Warning'
  node: string
  text: string
  since: string
  acknowledgedBy?: string
}

export const ALERTS: InfraAlert[] = [
  {
    id: 'al1',
    severity: 'Critical',
    node: 'stor-beg-3',
    text: 'Disk latency above 200 ms for 15 minutes',
    since: at('14', '04:58'),
    acknowledgedBy: 'Vuk Stojanović',
  },
  {
    id: 'al2',
    severity: 'Warning',
    node: 'stor-beg-3',
    text: 'Copy to the second region behind by one night',
    since: at('14', '06:00'),
  },
  {
    id: 'al3',
    severity: 'Warning',
    node: 'worker-fra-1',
    text: 'CPU above 90% for 10 minutes',
    since: at('14', '09:24'),
  },
]

/** Round-trip latency between the regions, milliseconds, the last 24 hours. */
export const LATENCY = {
  fraBeg: hourly([
    '18',
    '18',
    '19',
    '18',
    '18',
    '17',
    '17',
    '17',
    '17',
    '17',
    '17',
    '17',
    '17',
    '17',
    '18',
    '18',
    '18',
    '19',
    '21',
    '24',
    '22',
    '19',
    '18',
    '18',
  ]),
  fraAms: hourly([
    '9',
    '9',
    '9',
    '9',
    '9',
    '9',
    '8',
    '8',
    '8',
    '8',
    '8',
    '8',
    '8',
    '8',
    '8',
    '9',
    '9',
    '9',
    '9',
    '9',
    '9',
    '9',
    '9',
    '9',
  ]),
}

// ── The Liro team ─────────────────────────────────────────────────────────────────────────────

export const OPERATOR = { name: 'Vuk Stojanović', email: 'vuk.stojanovic@example.com' } as const

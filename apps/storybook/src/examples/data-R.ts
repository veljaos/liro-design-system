/*
 * Group R's example data (P5.29 b, the Superadmin: the Liro team working across tenants):
 * incidents, security events, tenants and announcements on 14 October 2026 at 09:40 in
 * Belgrade. Everything is invented: the tenants are the examples' companies, the people are
 * invented, every IP address comes from the documentation ranges (192.0.2.0/24, 198.51.100.0/24,
 * 203.0.113.0/24, 2001:db8::/32) and every e-mail is at example.com. Every figure, state and text
 * is the application's; the screens (screens-R.tsx) filter, count and change it as the Core
 * would, the components only show and report. Not part of the package. No classes here.
 */
import type { ComboboxOption, FilterDefinition, SavedView, SelectOption } from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const R_ROUTES = {
  incidents: '/superadmin/incidents',
  incident: (id: string) => `/superadmin/incidents/${id}`,
  /** The open incident with "Post update" asked. */
  incidentUpdate: '/superadmin/incidents/INC-2026-042?update=open',
  /** The open incident with "Resolve" asked. */
  incidentResolve: '/superadmin/incidents/INC-2026-042?resolve=open',
  security: '/superadmin/security',
  /** The first event with "Close" asked (the action taken). */
  securityClose: '/superadmin/security?event=se-1&close=open',
  tenants: '/superadmin/tenants',
  /** "View as admin" asked for Kvadrat Gradnja d.o.o.: the reason first. */
  tenantsViewAs: '/superadmin/tenants?view-as=kvadrat',
  viewAs: (id: string) => `/superadmin/tenants/${id}/view-as`,
  announcements: '/superadmin/announcements',
  announcement: (id: string) => `/superadmin/announcements/${id}`,
  newAnnouncement: '/superadmin/announcements/new',
  /** The other helper's screens (P5.29 b): System status and Network. */
  status: '/superadmin/status',
  network: '/superadmin/network',
} as const

// ── Now ───────────────────────────────────────────────────────────────────────────────────────

/** The examples' day and time for the Superadmin (the helpdesk's too): 14.10.2026, 09:40. */
export const R_TODAY = '2026-10-14'
export const R_NOW = '2026-10-14T09:40:00+02:00'

/** Whole minutes from one instant to another (the application's arithmetic, not the library's). */
export function minutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 60_000)
}

/**
 * An instant in Belgrade from a day and a clock time: summer time (+02:00) until the last Sunday
 * of October 2026 at 03:00, then +01:00. The Core takes the offset from the tenant's time zone.
 */
export function belgradeInstant(date: string, time: string): string {
  const winter = `${date}T${time}` >= '2026-10-25T03:00'
  return `${date}T${time}:00${winter ? '+01:00' : '+02:00'}`
}

/** The day and the clock time of an instant, as it is written ("2026-10-20", "22:00"). */
export function instantParts(instant: string): { date: string; time: string } {
  return { date: instant.slice(0, 10), time: instant.slice(11, 16) }
}

/** The team member signed in: on call this week. */
export const OPERATOR = {
  name: 'Vuk Stojanović',
  email: 'vuk.stojanovic@example.com',
  team: 'Liro operations',
}

// ── Tenants ───────────────────────────────────────────────────────────────────────────────────

export type TenantPlan = 'Starter' | 'Business' | 'Enterprise' | 'Trial'
export type TenantHealth = 'Healthy' | 'Degraded' | 'Failing' | 'Suspended'

export interface SaTenant {
  id: string
  name: string
  taxId: string
  plan: TenantPlan
  users: number
  seats: number
  health: TenantHealth
  /** Why the health is not good, in the application's words. */
  healthNote?: string
  /** The last sign-in or change by anyone in the tenant (an instant). */
  lastActivity: string
}

export const TENANTS: SaTenant[] = [
  {
    id: 'kvadrat',
    name: 'Kvadrat Gradnja d.o.o.',
    taxId: '108452317',
    plan: 'Business',
    users: 42,
    seats: 50,
    health: 'Degraded',
    healthNote: '12 invoices waiting for SEF (INC-2026-042)',
    lastActivity: '2026-10-14T09:38:00+02:00',
  },
  {
    id: 'zlatni-klas',
    name: 'Pekara Zlatni klas',
    taxId: '112307845',
    plan: 'Starter',
    users: 9,
    seats: 10,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:36:00+02:00',
  },
  {
    id: 'dom-zdravlja',
    name: 'Dom zdravlja Novi Sad',
    taxId: '100725418',
    plan: 'Enterprise',
    users: 318,
    seats: 350,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:39:00+02:00',
  },
  {
    id: 'fruska',
    name: 'Hotel Fruška',
    taxId: '109918276',
    plan: 'Business',
    users: 57,
    seats: 60,
    health: 'Degraded',
    healthNote: '3 invoices waiting for SEF (INC-2026-042)',
    lastActivity: '2026-10-14T09:21:00+02:00',
  },
  {
    id: 'dunav',
    name: 'Bistro Dunav',
    taxId: '111540392',
    plan: 'Starter',
    users: 12,
    seats: 15,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:12:00+02:00',
  },
  {
    id: 'kod-mike',
    name: 'Kafić Kod Mike',
    taxId: '112893014',
    plan: 'Starter',
    users: 4,
    seats: 5,
    health: 'Healthy',
    lastActivity: '2026-10-13T23:48:00+02:00',
  },
  {
    id: 'jovan-popovic',
    name: 'OŠ „Jovan Popović“',
    taxId: '101632045',
    plan: 'Business',
    users: 86,
    seats: 100,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:02:00+02:00',
  },
  {
    id: 'bojovic',
    name: 'Bojović i sinovi d.o.o.',
    taxId: '109773148',
    plan: 'Business',
    users: 23,
    seats: 25,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:30:00+02:00',
  },
  {
    id: 'drina',
    name: 'Drina Prevoz d.o.o.',
    taxId: '101665092',
    plan: 'Business',
    users: 31,
    seats: 35,
    health: 'Failing',
    healthNote: 'Bank statements not imported since 13.10.2026. (INC-2026-041)',
    lastActivity: '2026-10-14T08:55:00+02:00',
  },
  {
    id: 'jelic',
    name: 'Knjigovodstvo Jelić',
    taxId: '110583224',
    plan: 'Business',
    users: 6,
    seats: 10,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:33:00+02:00',
  },
  {
    id: 'medic',
    name: 'Medic Lab Niš d.o.o.',
    taxId: '107819450',
    plan: 'Business',
    users: 27,
    seats: 30,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:25:00+02:00',
  },
  {
    id: 'panonija',
    name: 'Panonija Agro d.o.o.',
    taxId: '104987265',
    plan: 'Enterprise',
    users: 64,
    seats: 80,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:10:00+02:00',
  },
  {
    id: 'rakic',
    name: 'Rakić Pekara SZR',
    taxId: '111296603',
    plan: 'Starter',
    users: 3,
    seats: 5,
    health: 'Suspended',
    healthNote: 'Suspended for an unpaid subscription since 01.10.2026.',
    lastActivity: '2026-09-30T16:02:00+02:00',
  },
  {
    id: 'stanic',
    name: 'Stanić Elektro STR',
    taxId: '112048376',
    plan: 'Trial',
    users: 2,
    seats: 5,
    health: 'Healthy',
    lastActivity: '2026-10-13T18:20:00+02:00',
  },
  {
    id: 'vojvodjanka',
    name: 'Vojvođanka Mlin a.d.',
    taxId: '100421987',
    plan: 'Enterprise',
    users: 112,
    seats: 120,
    health: 'Healthy',
    lastActivity: '2026-10-14T09:37:00+02:00',
  },
]

export function tenantById(id: string): SaTenant | undefined {
  return TENANTS.find((tenant) => tenant.id === id)
}

/** A tenant's name by its id ("—" never: an unknown id is shown as it is). */
export function tenantName(id: string): string {
  return tenantById(id)?.name ?? id
}

/** The tenants' saved views; their counts are the application's. */
export const TENANT_VIEWS = [
  { id: 'all', label: 'All', count: TENANTS.length },
  {
    id: 'attention',
    label: 'Needs attention',
    count: TENANTS.filter((t) => t.health === 'Degraded' || t.health === 'Failing').length,
  },
  { id: 'trial', label: 'Trial', count: TENANTS.filter((t) => t.plan === 'Trial').length },
  {
    id: 'suspended',
    label: 'Suspended',
    count: TENANTS.filter((t) => t.health === 'Suspended').length,
  },
] satisfies SavedView[]

const PLANS: TenantPlan[] = ['Starter', 'Business', 'Enterprise', 'Trial']
const HEALTHS: TenantHealth[] = ['Healthy', 'Degraded', 'Failing', 'Suspended']

export const TENANT_FILTERS: FilterDefinition[] = [
  {
    id: 'plan',
    label: 'Plan',
    type: 'multiSelect',
    options: PLANS.map((plan) => ({ value: plan, label: plan })),
  },
  {
    id: 'health',
    label: 'Health',
    type: 'multiSelect',
    options: HEALTHS.map((health) => ({ value: health, label: health })),
  },
]

/** The application's filter: the view, the search (name or tax number) and the filters. */
export function filterTenants(
  view: string,
  search: string,
  values: Readonly<Record<string, unknown>>,
): SaTenant[] {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const plans = (values.plan as readonly string[] | undefined) ?? []
  const healths = (values.health as readonly string[] | undefined) ?? []
  return TENANTS.filter((tenant) => {
    if (view === 'attention' && tenant.health !== 'Degraded' && tenant.health !== 'Failing') {
      return false
    }
    if (view === 'trial' && tenant.plan !== 'Trial') return false
    if (view === 'suspended' && tenant.health !== 'Suspended') return false
    if (plans.length > 0 && !plans.includes(tenant.plan)) return false
    if (healths.length > 0 && !healths.includes(tenant.health)) return false
    if (query === '') return true
    return tenant.name.toLocaleLowerCase('sr-Latn').includes(query) || tenant.taxId.includes(query)
  })
}

/** The tenants as choices (announcements' audience). */
export const TENANT_OPTIONS: ComboboxOption[] = TENANTS.map((tenant) => ({
  value: tenant.id,
  label: tenant.name,
  description: `PIB ${tenant.taxId}`,
}))

/** Why a team member opens a tenant's admin view: the Core's list. */
export const VIEW_AS_REASONS = [
  { value: 'ticket', label: 'Support ticket' },
  { value: 'incident', label: 'Incident' },
  { value: 'request', label: 'The tenant’s own request' },
]

/** The reason the view-as page opens with (the support ticket of the helpdesk examples). */
export const VIEW_AS_DEFAULT_REASON = 'Support ticket 4821 — SEF invoice rejected'

/** What the tenant's administrator sees (read-only in the view as): Kvadrat Gradnja d.o.o. */
export const TENANT_ADMIN = {
  activeSessions: 17,
  failedSignInsToday: 2,
  withoutTwoFactor: 3,
  users: [
    {
      id: 'u1',
      name: 'Milica Petrović',
      email: 'milica.petrovic@example.com',
      role: 'Administrator',
      twoFactor: 'On',
      lastSignIn: '2026-10-14T08:02:00+02:00',
    },
    {
      id: 'u2',
      name: 'Dragan Ilić',
      email: 'dragan.ilic@example.com',
      role: 'Accountant',
      twoFactor: 'On',
      lastSignIn: '2026-10-14T07:48:00+02:00',
    },
    {
      id: 'u3',
      name: 'Jelena Marković',
      email: 'jelena.markovic@example.com',
      role: 'HR',
      twoFactor: 'Off',
      lastSignIn: '2026-10-13T15:31:00+02:00',
    },
    {
      id: 'u4',
      name: 'Nenad Savić',
      email: 'nenad.savic@example.com',
      role: 'Site manager',
      twoFactor: 'Off',
      lastSignIn: '2026-10-14T06:55:00+02:00',
    },
    {
      id: 'u5',
      name: 'Ivana Kostić',
      email: 'ivana.kostic@example.com',
      role: 'Sales',
      twoFactor: 'On',
      lastSignIn: '2026-10-12T11:04:00+02:00',
    },
    {
      id: 'u6',
      name: 'Bojan Tomić',
      email: 'bojan.tomic@example.com',
      role: 'Warehouse',
      twoFactor: 'Off',
      lastSignIn: '2026-10-14T09:15:00+02:00',
    },
  ],
  integrations: [
    {
      id: 'sef',
      name: 'SEF (e-invoices)',
      state: 'Degraded' as const,
      note: '12 invoices waiting; sent automatically when SEF answers again',
      lastSuccess: '2026-10-14T08:49:00+02:00',
    },
    {
      id: 'bank',
      name: 'Banca Intesa (bank statements)',
      state: 'Healthy' as const,
      note: 'Statement 188 imported',
      lastSuccess: '2026-10-14T07:35:00+02:00',
    },
    {
      id: 'mail',
      name: 'E-mail',
      state: 'Healthy' as const,
      note: 'Sending through Liro',
      lastSuccess: '2026-10-14T09:37:00+02:00',
    },
    {
      id: 'bridge',
      name: 'Liro Bridge (site office)',
      state: 'Healthy' as const,
      note: 'Connected from 192.0.2.17',
      lastSuccess: '2026-10-14T09:39:00+02:00',
    },
  ],
}

// ── Incidents ─────────────────────────────────────────────────────────────────────────────────

export type IncidentState = 'Open' | 'Monitoring' | 'Resolved'
export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3'

/** The stages an incident moves through: its lifecycle bar. */
export const INCIDENT_PHASES = [
  'Detected',
  'Investigating',
  'Identified',
  'Monitoring',
  'Resolved',
] as const
export type IncidentPhase = (typeof INCIDENT_PHASES)[number]

/** One entry of an incident's timeline: a stage reached, an acknowledgement, an update. */
export interface IncidentUpdate {
  id: string
  at: string
  /** The entry's name ("Investigating", "Acknowledged", "Update"). */
  label: string
  author: string
  text: string
  /** Posted to the status page too. */
  public: boolean
}

export interface SaIncident {
  id: string
  title: string
  state: IncidentState
  phase: IncidentPhase
  severity: Severity
  services: string[]
  /** The tenants affected, or every tenant. */
  tenants: string[] | 'all'
  /** What each affected tenant feels, in the application's words (tenant id → text). */
  impact?: Record<string, string>
  started: string
  resolvedAt?: string
  acknowledged?: { by: string; at: string }
  assignee?: string
  commander: string
  onCall: { primary: string; secondary: string }
  /** When the on-call engineers were paged (an unacknowledged incident). */
  paged?: string[]
  /** The message on the public status page now. */
  statusMessage?: { title: string; text: string; at: string; by: string }
  updates: IncidentUpdate[]
  /** The postmortem, as stored (HTML, sanitized when shown). */
  postmortem?: string
  /** When the postmortem of a resolved incident is due, while it is not written. */
  postmortemDue?: string
  related?: string[]
}

const COMMANDER = 'Tamara Nikolić'
const ON_CALL = { primary: OPERATOR.name, secondary: 'Ivana Popović' }

/** The open incident the examples show: paged, not yet acknowledged by the on-call engineer. */
export const OPEN_INCIDENT = 'INC-2026-042'
/** The resolved incident with its postmortem. */
export const RESOLVED_INCIDENT = 'INC-2026-040'

export const INCIDENTS: SaIncident[] = [
  {
    id: 'INC-2026-042',
    title: 'SEF submissions delayed',
    state: 'Open',
    phase: 'Investigating',
    severity: 'SEV-2',
    services: ['E-invoicing (SEF)'],
    tenants: ['kvadrat', 'fruska', 'panonija', 'vojvodjanka', 'medic', 'bojovic'],
    impact: {
      kvadrat: '12 invoices waiting',
      fruska: '3 invoices waiting',
      panonija: '7 invoices waiting',
      vojvodjanka: '21 invoices waiting',
      medic: '2 invoices waiting',
      bojovic: '4 invoices waiting',
    },
    started: '2026-10-14T08:52:00+02:00',
    commander: COMMANDER,
    onCall: ON_CALL,
    paged: ['2026-10-14T08:52:00+02:00', '2026-10-14T09:07:00+02:00'],
    statusMessage: {
      title: 'Invoices are taking longer to reach SEF',
      text: 'Some invoices are taking longer than usual to reach SEF. They are kept and sent automatically; nothing needs to be sent again.',
      at: '2026-10-14T08:58:00+02:00',
      by: COMMANDER,
    },
    updates: [
      {
        id: 'u1',
        at: '2026-10-14T08:52:00+02:00',
        label: 'Detected',
        author: 'Liro monitoring',
        text: 'Invoices have waited for SEF longer than 15 minutes in 6 tenants.',
        public: false,
      },
      {
        id: 'u2',
        at: '2026-10-14T08:58:00+02:00',
        label: 'Investigating',
        author: COMMANDER,
        text: 'Some invoices are taking longer than usual to reach SEF. They are kept and sent automatically; nothing needs to be sent again.',
        public: true,
      },
      {
        id: 'u3',
        at: '2026-10-14T09:24:00+02:00',
        label: 'Update',
        author: COMMANDER,
        text: 'SEF answers in 20 to 40 seconds instead of 2; our submissions retry every 5 minutes. 49 invoices are waiting.',
        public: false,
      },
    ],
    related: ['INC-2026-037'],
  },
  {
    id: 'INC-2026-041',
    title: 'Bank statements from one bank not imported',
    state: 'Monitoring',
    phase: 'Monitoring',
    severity: 'SEV-3',
    services: ['Bank import'],
    tenants: ['drina', 'bojovic'],
    impact: { drina: 'Statements of 13.10. missing', bojovic: 'Statement of 13.10. missing' },
    started: '2026-10-14T06:10:00+02:00',
    acknowledged: { by: 'Ivana Popović', at: '2026-10-14T06:14:00+02:00' },
    assignee: 'Ivana Popović',
    commander: COMMANDER,
    onCall: ON_CALL,
    statusMessage: {
      title: 'Bank statements from Banka Primer are late',
      text: 'The bank changed its file format overnight. Statements are imported again; yesterday’s arrive by noon.',
      at: '2026-10-14T08:30:00+02:00',
      by: 'Ivana Popović',
    },
    updates: [
      {
        id: 'u1',
        at: '2026-10-14T06:10:00+02:00',
        label: 'Detected',
        author: 'Liro monitoring',
        text: 'The nightly import failed for every account at Banka Primer.',
        public: false,
      },
      {
        id: 'u2',
        at: '2026-10-14T06:14:00+02:00',
        label: 'Acknowledged',
        author: 'Ivana Popović',
        text: 'Acknowledged.',
        public: false,
      },
      {
        id: 'u3',
        at: '2026-10-14T07:05:00+02:00',
        label: 'Identified',
        author: 'Ivana Popović',
        text: 'The bank changed its file format overnight.',
        public: true,
      },
      {
        id: 'u4',
        at: '2026-10-14T08:30:00+02:00',
        label: 'Monitoring',
        author: 'Ivana Popović',
        text: 'The bank changed its file format overnight. Statements are imported again; yesterday’s arrive by noon.',
        public: true,
      },
    ],
  },
  {
    id: 'INC-2026-040',
    title: 'Slow sign-in for some users',
    state: 'Resolved',
    phase: 'Resolved',
    severity: 'SEV-2',
    services: ['Sign-in'],
    tenants: 'all',
    started: '2026-10-09T10:05:00+02:00',
    resolvedAt: '2026-10-09T11:17:00+02:00',
    acknowledged: { by: OPERATOR.name, at: '2026-10-09T10:07:00+02:00' },
    assignee: OPERATOR.name,
    commander: COMMANDER,
    onCall: ON_CALL,
    statusMessage: {
      title: 'Sign-in works normally again',
      text: 'Sign-in took up to a minute for some users between 10:05 and 11:17. It works normally again.',
      at: '2026-10-09T11:17:00+02:00',
      by: COMMANDER,
    },
    updates: [
      {
        id: 'u1',
        at: '2026-10-09T10:05:00+02:00',
        label: 'Detected',
        author: 'Liro monitoring',
        text: 'Sign-in takes longer than 10 seconds for 8% of attempts.',
        public: false,
      },
      {
        id: 'u2',
        at: '2026-10-09T10:07:00+02:00',
        label: 'Acknowledged',
        author: OPERATOR.name,
        text: 'Acknowledged.',
        public: false,
      },
      {
        id: 'u3',
        at: '2026-10-09T10:12:00+02:00',
        label: 'Investigating',
        author: COMMANDER,
        text: 'Signing in is slower than usual for some users. We are looking into it.',
        public: true,
      },
      {
        id: 'u4',
        at: '2026-10-09T10:41:00+02:00',
        label: 'Identified',
        author: OPERATOR.name,
        text: 'A certificate check called an external list that answered slowly.',
        public: true,
      },
      {
        id: 'u5',
        at: '2026-10-09T10:55:00+02:00',
        label: 'Monitoring',
        author: OPERATOR.name,
        text: 'The list is now kept for one hour; sign-in times are back to normal.',
        public: true,
      },
      {
        id: 'u6',
        at: '2026-10-09T11:17:00+02:00',
        label: 'Resolved',
        author: COMMANDER,
        text: 'Sign-in took up to a minute for some users between 10:05 and 11:17. It works normally again.',
        public: true,
      },
    ],
    postmortem:
      '<h3>Summary</h3>' +
      '<p>Between 10:05 and 11:17 on 9 October, about one sign-in in twelve took between 10 and 60 seconds. No data was lost and no one was signed out.</p>' +
      '<h3>Cause</h3>' +
      '<p>Every sign-in with a certificate checked a revocation list on an external server. The server answered slowly, and our check waited for it each time instead of keeping the list.</p>' +
      '<h3>What we changed</h3>' +
      '<ul><li>The revocation list is kept for one hour and refreshed in the background.</li>' +
      '<li>An alert fires when sign-in takes longer than 5 seconds for 2% of attempts.</li>' +
      '<li>The status page message is posted within 10 minutes of an alert.</li></ul>' +
      '<h3>Follow-up</h3>' +
      '<p>Load test of sign-in with a slow revocation server: <strong>Vuk Stojanović</strong>, by 23 October.</p>',
  },
  ...(
    [
      [
        'INC-2026-039',
        'Payroll export times out',
        'SEV-3',
        ['Payroll'],
        ['dom-zdravlja', 'panonija', 'vojvodjanka'],
        '2026-10-07T14:20:00+02:00',
        '2026-10-07T15:05:00+02:00',
      ],
      [
        'INC-2026-038',
        'Notification e-mails delayed',
        'SEV-3',
        ['E-mail'],
        'all',
        '2026-10-03T08:40:00+02:00',
        '2026-10-03T10:45:00+02:00',
      ],
      [
        'INC-2026-037',
        'SEF submissions delayed',
        'SEV-2',
        ['E-invoicing (SEF)'],
        ['kvadrat', 'panonija', 'vojvodjanka', 'jelic'],
        '2026-09-28T13:10:00+02:00',
        '2026-09-28T14:50:00+02:00',
      ],
      [
        'INC-2026-036',
        'Liro Bridge disconnects',
        'SEV-3',
        ['Liro Bridge'],
        ['kvadrat', 'drina'],
        '2026-09-24T07:30:00+02:00',
        '2026-09-24T09:02:00+02:00',
      ],
      [
        'INC-2026-035',
        'Database failover',
        'SEV-1',
        ['All services'],
        'all',
        '2026-09-19T03:12:00+02:00',
        '2026-09-19T03:30:00+02:00',
      ],
      [
        'INC-2026-034',
        'Search shows old results',
        'SEV-3',
        ['Search'],
        'all',
        '2026-09-15T11:00:00+02:00',
        '2026-09-15T13:20:00+02:00',
      ],
      [
        'INC-2026-033',
        'File uploads fail',
        'SEV-2',
        ['Storage'],
        'all',
        '2026-09-10T16:44:00+02:00',
        '2026-09-10T17:18:00+02:00',
      ],
      [
        'INC-2026-032',
        'Fiscal receipts not sent',
        'SEV-2',
        ['Fiscal receipts'],
        ['zlatni-klas', 'dunav', 'kod-mike'],
        '2026-08-29T18:05:00+02:00',
        '2026-08-29T19:40:00+02:00',
      ],
      [
        'INC-2026-031',
        'API requests refused',
        'SEV-3',
        ['API'],
        ['bojovic', 'medic'],
        '2026-08-21T09:15:00+02:00',
        '2026-08-21T09:52:00+02:00',
      ],
    ] satisfies [string, string, Severity, string[], string[] | 'all', string, string][]
  ).map(([id, title, severity, services, tenants, started, resolvedAt]): SaIncident => ({
    id,
    title,
    state: 'Resolved',
    phase: 'Resolved',
    severity,
    services,
    tenants,
    started,
    resolvedAt,
    acknowledged: { by: ON_CALL.secondary, at: started },
    assignee: ON_CALL.secondary,
    commander: COMMANDER,
    onCall: ON_CALL,
    updates: [
      {
        id: 'u1',
        at: started,
        label: 'Detected',
        author: 'Liro monitoring',
        text: `${title}.`,
        public: false,
      },
      {
        id: 'u2',
        at: resolvedAt,
        label: 'Resolved',
        author: COMMANDER,
        text: 'Resolved.',
        public: true,
      },
    ],
  })),
]

/** How long the incident has lasted, in whole minutes: to its end, or to now while it is on. */
export function incidentMinutes(incident: SaIncident): number {
  return minutesBetween(incident.started, incident.resolvedAt ?? R_NOW)
}

/** The incidents' saved views. */
export function incidentViews(incidents: readonly SaIncident[]): SavedView[] {
  const count = (state: IncidentState) => incidents.filter((each) => each.state === state).length
  return [
    { id: 'all', label: 'All', count: incidents.length },
    { id: 'open', label: 'Open', count: count('Open') },
    { id: 'monitoring', label: 'Monitoring', count: count('Monitoring') },
    { id: 'resolved', label: 'Resolved', count: count('Resolved') },
  ]
}

const SERVICES = [
  'All services',
  'API',
  'Bank import',
  'E-invoicing (SEF)',
  'E-mail',
  'Fiscal receipts',
  'Liro Bridge',
  'Payroll',
  'Search',
  'Sign-in',
  'Storage',
]

export const INCIDENT_FILTERS: FilterDefinition[] = [
  {
    id: 'severity',
    label: 'Severity',
    type: 'multiSelect',
    options: (['SEV-1', 'SEV-2', 'SEV-3'] as const).map((value) => ({ value, label: value })),
  },
  {
    id: 'service',
    label: 'Service',
    type: 'multiSelect',
    options: SERVICES.map((service) => ({ value: service, label: service })),
  },
]

/** The application's filter of the incident list. */
export function filterIncidents(
  incidents: readonly SaIncident[],
  view: string,
  search: string,
  values: Readonly<Record<string, unknown>>,
): SaIncident[] {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const severities = (values.severity as readonly string[] | undefined) ?? []
  const services = (values.service as readonly string[] | undefined) ?? []
  return incidents.filter((incident) => {
    if (view !== 'all' && incident.state.toLowerCase() !== view) return false
    if (severities.length > 0 && !severities.includes(incident.severity)) return false
    if (services.length > 0 && !incident.services.some((service) => services.includes(service))) {
      return false
    }
    if (query === '') return true
    return (
      incident.id.toLowerCase().includes(query) ||
      incident.title.toLocaleLowerCase('sr-Latn').includes(query)
    )
  })
}

/** The states an update can set, in the Update dialog. */
export const UPDATE_PHASES: { value: IncidentPhase; label: string; description: string }[] = [
  {
    value: 'Investigating',
    label: 'Investigating',
    description: 'The cause is not known yet.',
  },
  {
    value: 'Identified',
    label: 'Identified',
    description: 'The cause is known; a fix is on its way.',
  },
  {
    value: 'Monitoring',
    label: 'Monitoring',
    description: 'A fix is in place; we are watching that it holds.',
  },
]

/** The incident after an update: its stage, the timeline, and the status page when public. */
export function postUpdate(
  incident: SaIncident,
  update: { phase: IncidentPhase; text: string; public: boolean; author: string; at: string },
): SaIncident {
  return {
    ...incident,
    phase: update.phase,
    state: update.phase === 'Monitoring' ? 'Monitoring' : 'Open',
    updates: [
      ...incident.updates,
      {
        id: `u${String(incident.updates.length + 1)}`,
        at: update.at,
        label: update.phase === incident.phase ? 'Update' : update.phase,
        author: update.author,
        text: update.text,
        public: update.public,
      },
    ],
    ...(update.public
      ? {
          statusMessage: {
            title: incident.statusMessage?.title ?? incident.title,
            text: update.text,
            at: update.at,
            by: update.author,
          },
        }
      : {}),
  }
}

/** The incident acknowledged by the person on call: assigned to them, paging stops. */
export function acknowledge(incident: SaIncident, by: string, at: string): SaIncident {
  const rest = { ...incident }
  delete rest.paged
  return {
    ...rest,
    acknowledged: { by, at },
    assignee: by,
    updates: [
      ...incident.updates,
      {
        id: `u${String(incident.updates.length + 1)}`,
        at,
        label: 'Acknowledged',
        author: by,
        text: 'Acknowledged; paging stopped.',
        public: false,
      },
    ],
  }
}

/** A postmortem is due a week after the incident (the application's rule). */
export const POSTMORTEM_DUE = '2026-10-21'

/** The incident resolved now; "Resolved" posted to the status page when chosen. */
export function resolveIncident(
  incident: SaIncident,
  by: string,
  at: string,
  toStatusPage: boolean,
): SaIncident {
  const text = 'Everything works normally again.'
  return {
    ...incident,
    state: 'Resolved',
    phase: 'Resolved',
    resolvedAt: at,
    postmortemDue: POSTMORTEM_DUE,
    updates: [
      ...incident.updates,
      {
        id: `u${String(incident.updates.length + 1)}`,
        at,
        label: 'Resolved',
        author: by,
        text,
        public: toStatusPage,
      },
    ],
    ...(toStatusPage
      ? {
          statusMessage: { title: `${incident.title}: resolved`, text, at, by },
        }
      : {}),
  }
}

// ── Security events ───────────────────────────────────────────────────────────────────────────

export type EventKind = 'burst' | 'ip' | 'blocked' | 'privilege' | 'mfa' | 'export'
export type EventState = 'New' | 'Investigating' | 'Closed'
export type EventSeverity = 'High' | 'Medium' | 'Low'

export const EVENT_KINDS: Record<EventKind, string> = {
  burst: 'Failed sign-in burst',
  ip: 'Suspicious IP address',
  blocked: 'Blocked attempt',
  privilege: 'Privilege change',
  mfa: 'Two-factor reset',
  export: 'Data export',
}

export interface SecurityEvent {
  id: string
  kind: EventKind
  /** The tenant, or several tenants (one range of addresses across them). */
  tenants: string[]
  summary: string
  severity: EventSeverity
  state: EventState
  firstSeen: string
  lastSeen?: string
  /** A documentation address or range only. */
  ip?: string
  location?: string
  accounts?: string[]
  attempts?: number
  /** What was done, in the application's words; null until something is done. */
  actionTaken: string | null
  history: { key: string; at: string; author: string; text: string }[]
}

export const SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'se-1',
    kind: 'burst',
    tenants: ['zlatni-klas'],
    summary: '214 failed sign-ins for 3 accounts in 10 minutes from one address.',
    severity: 'High',
    state: 'New',
    firstSeen: '2026-10-14T09:21:00+02:00',
    lastSeen: '2026-10-14T09:31:00+02:00',
    ip: '203.0.113.24',
    location: 'Unknown (an anonymising network)',
    accounts: ['jovana.markovic@example.com', 'kasa1@example.com', 'kasa2@example.com'],
    attempts: 214,
    actionTaken: 'Sign-ins from 203.0.113.24 slowed down automatically (rate limit).',
    history: [
      {
        key: 'h2',
        at: '2026-10-14T09:23:00+02:00',
        author: 'Liro monitoring',
        text: 'Rate limit applied to 203.0.113.24.',
      },
      {
        key: 'h1',
        at: '2026-10-14T09:21:00+02:00',
        author: 'Liro monitoring',
        text: 'More than 50 failed sign-ins in 5 minutes.',
      },
    ],
  },
  {
    id: 'se-2',
    kind: 'privilege',
    tenants: ['kvadrat'],
    summary: 'Milica Petrović made Nenad Savić an administrator.',
    severity: 'Medium',
    state: 'New',
    firstSeen: '2026-10-14T09:12:00+02:00',
    ip: '192.0.2.17',
    location: 'Novi Sad, Serbia (approximate)',
    accounts: ['nenad.savic@example.com'],
    actionTaken: null,
    history: [
      {
        key: 'h1',
        at: '2026-10-14T09:12:00+02:00',
        author: 'Liro monitoring',
        text: 'A role with every permission was given outside working hours of the user’s team.',
      },
    ],
  },
  {
    id: 'se-3',
    kind: 'export',
    tenants: ['dom-zdravlja'],
    summary: 'Dragan Lazić exported every payroll record of 2026 (4.812 rows).',
    severity: 'Medium',
    state: 'Investigating',
    firstSeen: '2026-10-14T08:44:00+02:00',
    ip: '198.51.100.12',
    location: 'Novi Sad, Serbia (approximate)',
    accounts: ['dragan.lazic@example.com'],
    actionTaken: 'The tenant’s administrator asked to confirm the export.',
    history: [
      {
        key: 'h2',
        at: '2026-10-14T08:59:00+02:00',
        author: 'Ivana Popović',
        text: 'Asked the tenant’s administrator to confirm the export.',
      },
      {
        key: 'h1',
        at: '2026-10-14T08:44:00+02:00',
        author: 'Liro monitoring',
        text: 'An export ten times larger than this user’s usual.',
      },
    ],
  },
  {
    id: 'se-4',
    kind: 'ip',
    tenants: ['fruska'],
    summary:
      'A sign-in from an address never seen for this account, 4 minutes after one from Novi Sad.',
    severity: 'High',
    state: 'Investigating',
    firstSeen: '2026-10-14T07:58:00+02:00',
    ip: '198.51.100.77',
    location: 'Unknown (a hosting provider)',
    accounts: ['recepcija@example.com'],
    actionTaken: 'Session revoked; the user must sign in again with two-factor sign-in.',
    history: [
      {
        key: 'h2',
        at: '2026-10-14T08:06:00+02:00',
        author: OPERATOR.name,
        text: 'Revoked the session.',
      },
      {
        key: 'h1',
        at: '2026-10-14T07:58:00+02:00',
        author: 'Liro monitoring',
        text: 'Impossible travel between two sign-ins.',
      },
    ],
  },
  {
    id: 'se-5',
    kind: 'mfa',
    tenants: ['drina'],
    summary: 'Two-factor sign-in reset for Petar Jovanović by Liro support.',
    severity: 'Low',
    state: 'New',
    firstSeen: '2026-10-14T08:20:00+02:00',
    accounts: ['petar.jovanovic@example.com'],
    actionTaken: null,
    history: [
      {
        key: 'h1',
        at: '2026-10-14T08:20:00+02:00',
        author: 'Ana Kovač',
        text: 'Reset after a video call that confirmed the person (support ticket 4817).',
      },
    ],
  },
  {
    id: 'se-6',
    kind: 'blocked',
    tenants: ['bojovic'],
    summary: 'An API key was used from an address outside the key’s allowed addresses.',
    severity: 'Medium',
    state: 'New',
    firstSeen: '2026-10-14T07:41:00+02:00',
    lastSeen: '2026-10-14T09:05:00+02:00',
    ip: '192.0.2.140',
    location: 'Belgrade, Serbia (approximate)',
    attempts: 18,
    actionTaken: 'Every request blocked automatically.',
    history: [
      {
        key: 'h1',
        at: '2026-10-14T07:41:00+02:00',
        author: 'Liro monitoring',
        text: 'Requests with key “Warehouse sync” refused: address not allowed.',
      },
    ],
  },
  {
    id: 'se-7',
    kind: 'blocked',
    tenants: ['jovan-popovic'],
    summary: 'Sign-ins to a parent’s account blocked after 10 wrong codes.',
    severity: 'Medium',
    state: 'Investigating',
    firstSeen: '2026-10-13T21:14:00+02:00',
    ip: '2001:db8:4a::17',
    location: 'Kragujevac, Serbia (approximate)',
    accounts: ['roditelj.4471@example.com'],
    attempts: 10,
    actionTaken: 'Account locked for 1 hour automatically.',
    history: [
      {
        key: 'h1',
        at: '2026-10-13T21:14:00+02:00',
        author: 'Liro monitoring',
        text: 'Ten wrong two-factor codes in a row.',
      },
    ],
  },
  {
    id: 'se-8',
    kind: 'burst',
    tenants: ['medic'],
    summary: '38 failed sign-ins for one account in 20 minutes.',
    severity: 'Low',
    state: 'Closed',
    firstSeen: '2026-10-13T16:02:00+02:00',
    ip: '198.51.100.30',
    location: 'Niš, Serbia (approximate)',
    accounts: ['laboratorija@example.com'],
    attempts: 38,
    actionTaken: 'No action needed: the owner had forgotten the new password.',
    history: [
      {
        key: 'h2',
        at: '2026-10-13T16:40:00+02:00',
        author: 'Ivana Popović',
        text: 'Closed: no action needed.',
      },
      {
        key: 'h1',
        at: '2026-10-13T16:02:00+02:00',
        author: 'Liro monitoring',
        text: 'More than 30 failed sign-ins in 30 minutes.',
      },
    ],
  },
  {
    id: 'se-9',
    kind: 'ip',
    tenants: ['kvadrat', 'zlatni-klas', 'dunav', 'jelic'],
    summary: 'Sign-in attempts across 4 tenants from one range of addresses.',
    severity: 'High',
    state: 'Closed',
    firstSeen: '2026-10-12T02:10:00+02:00',
    ip: '203.0.113.0/24',
    location: 'Unknown (a hosting provider)',
    attempts: 1460,
    actionTaken: 'The range was blocked for 7 days.',
    history: [
      {
        key: 'h2',
        at: '2026-10-12T02:31:00+02:00',
        author: ON_CALL.secondary,
        text: 'Closed: range blocked for 7 days.',
      },
      {
        key: 'h1',
        at: '2026-10-12T02:10:00+02:00',
        author: 'Liro monitoring',
        text: 'The same passwords tried against accounts of several tenants.',
      },
    ],
  },
  {
    id: 'se-10',
    kind: 'export',
    tenants: ['panonija'],
    summary: 'The yearly audit export of the general ledger (128.440 rows).',
    severity: 'Low',
    state: 'Closed',
    firstSeen: '2026-10-11T10:30:00+02:00',
    accounts: ['revizija@example.com'],
    actionTaken: 'No action needed: expected, confirmed by the tenant’s administrator.',
    history: [
      {
        key: 'h1',
        at: '2026-10-11T11:02:00+02:00',
        author: OPERATOR.name,
        text: 'Closed: confirmed by the tenant’s administrator.',
      },
    ],
  },
  {
    id: 'se-11',
    kind: 'privilege',
    tenants: ['vojvodjanka'],
    summary: 'Two users became payroll administrators.',
    severity: 'Low',
    state: 'Closed',
    firstSeen: '2026-10-10T09:00:00+02:00',
    accounts: ['plate1@example.com', 'plate2@example.com'],
    actionTaken: 'No action needed: the tenant’s administrator confirmed the change.',
    history: [
      {
        key: 'h1',
        at: '2026-10-10T09:45:00+02:00',
        author: ON_CALL.secondary,
        text: 'Closed after the administrator confirmed.',
      },
    ],
  },
  {
    id: 'se-12',
    kind: 'mfa',
    tenants: ['jelic'],
    summary: 'Two-factor sign-in reset by the tenant’s administrator.',
    severity: 'Low',
    state: 'Closed',
    firstSeen: '2026-10-09T13:22:00+02:00',
    accounts: ['milan.jelic@example.com'],
    actionTaken: 'No action needed.',
    history: [
      {
        key: 'h1',
        at: '2026-10-09T13:30:00+02:00',
        author: OPERATOR.name,
        text: 'Closed: no action needed.',
      },
    ],
  },
]

/** What a closed event says was done: the Core's list. */
export const CLOSE_ACTIONS = [
  { value: 'none', label: 'No action needed: expected activity' },
  { value: 'blocked', label: 'Address or range blocked' },
  { value: 'sessions', label: 'Sessions revoked' },
  { value: 'locked', label: 'Account locked, the tenant’s administrator told' },
  { value: 'reported', label: 'Reported to the tenant’s administrator' },
]

export const EVENT_FILTERS: FilterDefinition[] = [
  {
    id: 'state',
    label: 'State',
    type: 'multiSelect',
    options: (['New', 'Investigating', 'Closed'] as const).map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: 'severity',
    label: 'Severity',
    type: 'multiSelect',
    options: (['High', 'Medium', 'Low'] as const).map((value) => ({ value, label: value })),
  },
  {
    id: 'kind',
    label: 'Kind',
    type: 'multiSelect',
    options: (Object.keys(EVENT_KINDS) as EventKind[]).map((value) => ({
      value,
      label: EVENT_KINDS[value],
    })),
  },
]

/** The queue opens on what is not closed yet. */
export const EVENT_START_FILTERS = { state: ['New', 'Investigating'] }

const SEVERITY_ORDER: Record<EventSeverity, number> = { High: 0, Medium: 1, Low: 2 }

/**
 * The application's queue: the filters and the search, the most severe first, then the newest.
 */
export function filterEvents(
  events: readonly SecurityEvent[],
  search: string,
  values: Readonly<Record<string, unknown>>,
): SecurityEvent[] {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const states = (values.state as readonly string[] | undefined) ?? []
  const severities = (values.severity as readonly string[] | undefined) ?? []
  const kinds = (values.kind as readonly string[] | undefined) ?? []
  return events
    .filter((event) => {
      if (states.length > 0 && !states.includes(event.state)) return false
      if (severities.length > 0 && !severities.includes(event.severity)) return false
      if (kinds.length > 0 && !kinds.includes(event.kind)) return false
      if (query === '') return true
      return (
        event.summary.toLocaleLowerCase('sr-Latn').includes(query) ||
        (event.ip ?? '').includes(query) ||
        event.tenants.some((id) => tenantName(id).toLocaleLowerCase('sr-Latn').includes(query))
      )
    })
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        Date.parse(b.firstSeen) - Date.parse(a.firstSeen),
    )
}

/** The event closed with the action taken, as the Core records it. */
export function closeEvent(
  event: SecurityEvent,
  action: string,
  details: string,
  by: string,
  at: string,
): SecurityEvent {
  const taken = details.trim() === '' ? action : `${action}. ${details.trim()}`
  return {
    ...event,
    state: 'Closed',
    actionTaken: taken,
    history: [
      { key: `h${String(event.history.length + 1)}`, at, author: by, text: `Closed: ${taken}` },
      ...event.history,
    ],
  }
}

/** The event taken up by a team member. */
export function investigateEvent(event: SecurityEvent, by: string, at: string): SecurityEvent {
  return {
    ...event,
    state: 'Investigating',
    history: [
      {
        key: `h${String(event.history.length + 1)}`,
        at,
        author: by,
        text: 'Started investigating.',
      },
      ...event.history,
    ],
  }
}

// ── Announcements ─────────────────────────────────────────────────────────────────────────────

export type AnnouncementKind = 'banner' | 'status'
export type AnnouncementTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
export type AnnouncementState = 'Draft' | 'Scheduled' | 'Live' | 'Ended'

export interface Announcement {
  id: string
  title: string
  message: string
  kind: AnnouncementKind
  tone: AnnouncementTone
  audience: 'all' | string[]
  /** Instants; a draft may have none. No end: shown until it is ended. */
  start: string | null
  end: string | null
  state: AnnouncementState
}

export const KIND_LABELS: Record<AnnouncementKind, string> = {
  banner: 'Banner in the application',
  status: 'Status-page message',
}

export const TONE_OPTIONS: SelectOption[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'info', label: 'Information' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
]

export function toneLabel(tone: AnnouncementTone): string {
  return TONE_OPTIONS.find((option) => option.value === tone)?.label ?? tone
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'an-8',
    title: 'Fiscal receipts: new rules from 1 November',
    message:
      'From 1 November every refund must name the original receipt. Liro fills it in when you refund from the journal.',
    kind: 'banner',
    tone: 'warning',
    audience: ['zlatni-klas', 'dunav', 'kod-mike', 'rakic'],
    start: '2026-10-22T08:00:00+02:00',
    end: '2026-11-08T23:30:00+01:00',
    state: 'Scheduled',
  },
  {
    id: 'an-7',
    title: 'Planned maintenance on 20 October',
    message:
      'Liro is unavailable on Tuesday, 20 October, from 22:00 to 23:30 while we upgrade the database. Drafts are kept.',
    kind: 'banner',
    tone: 'info',
    audience: 'all',
    start: '2026-10-16T08:00:00+02:00',
    end: '2026-10-20T23:30:00+02:00',
    state: 'Scheduled',
  },
  {
    id: 'an-6',
    title: 'Invoices are taking longer to reach SEF',
    message:
      'Some invoices are taking longer than usual to reach SEF. They are kept and sent automatically; nothing needs to be sent again.',
    kind: 'status',
    tone: 'warning',
    audience: ['kvadrat', 'fruska', 'panonija', 'vojvodjanka', 'medic', 'bojovic'],
    start: '2026-10-14T08:58:00+02:00',
    end: null,
    state: 'Live',
  },
  {
    id: 'an-5',
    title: 'Payroll export to more banks',
    message: 'Payroll can now be exported for Banka Primer and Poštanska štedionica too.',
    kind: 'banner',
    tone: 'neutral',
    audience: 'all',
    start: '2026-10-01T08:00:00+02:00',
    end: '2026-10-15T23:30:00+02:00',
    state: 'Live',
  },
  {
    id: 'an-4',
    title: 'Year-end closing webinar',
    message: 'Join us on 3 December at 11:00 for a walk through the year-end closing in Liro.',
    kind: 'banner',
    tone: 'neutral',
    audience: 'all',
    start: null,
    end: null,
    state: 'Draft',
  },
  {
    id: 'an-3',
    title: 'Bank statements are imported again',
    message: 'Statements from Banka Primer were late on 13 October; all of them are imported.',
    kind: 'status',
    tone: 'success',
    audience: ['drina', 'bojovic'],
    start: '2026-10-12T09:00:00+02:00',
    end: '2026-10-13T09:00:00+02:00',
    state: 'Ended',
  },
  {
    id: 'an-2',
    title: 'Sign-in is slower than usual',
    message: 'Signing in may take up to a minute. We are working on it.',
    kind: 'status',
    tone: 'warning',
    audience: 'all',
    start: '2026-10-09T10:12:00+02:00',
    end: '2026-10-09T11:17:00+02:00',
    state: 'Ended',
  },
  {
    id: 'an-1',
    title: 'New: approvals on your phone',
    message: 'Supplier invoices can now be approved from the Liro app on your phone.',
    kind: 'banner',
    tone: 'success',
    audience: 'all',
    start: '2026-09-15T08:00:00+02:00',
    end: '2026-09-30T23:30:00+02:00',
    state: 'Ended',
  },
]

/** The ids an announcement can have in the examples: the stored ones and those the editor adds. */
export const ANNOUNCEMENT_IDS = Array.from({ length: 20 }, (_, index) => `an-${String(index + 1)}`)

export const ANNOUNCEMENT_FILTERS: FilterDefinition[] = [
  {
    id: 'kind',
    label: 'Kind',
    type: 'multiSelect',
    options: (Object.keys(KIND_LABELS) as AnnouncementKind[]).map((value) => ({
      value,
      label: KIND_LABELS[value],
    })),
  },
  { id: 'tone', label: 'Tone', type: 'multiSelect', options: TONE_OPTIONS },
]

/** The application's filter of the announcements. */
export function filterAnnouncements(
  list: readonly Announcement[],
  view: string,
  search: string,
  values: Readonly<Record<string, unknown>>,
): Announcement[] {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const kinds = (values.kind as readonly string[] | undefined) ?? []
  const tones = (values.tone as readonly string[] | undefined) ?? []
  return list.filter(
    (each) =>
      (view === 'all' || each.state.toLowerCase() === view) &&
      (kinds.length === 0 || kinds.includes(each.kind)) &&
      (tones.length === 0 || tones.includes(each.tone)) &&
      (query === '' || each.title.toLocaleLowerCase('sr-Latn').includes(query)),
  )
}

/** The announcement the editor's story opens: chosen tenants, scheduled. */
export const EDITED_ANNOUNCEMENT = 'an-8'

export function announcementViews(list: readonly Announcement[]): SavedView[] {
  const count = (state: AnnouncementState) => list.filter((each) => each.state === state).length
  return [
    { id: 'all', label: 'All', count: list.length },
    { id: 'draft', label: 'Draft', count: count('Draft') },
    { id: 'scheduled', label: 'Scheduled', count: count('Scheduled') },
    { id: 'live', label: 'Live', count: count('Live') },
    { id: 'ended', label: 'Ended', count: count('Ended') },
  ]
}

/** Every half hour of a day, as the editor's time choices (searchable: more than ten). */
export const TIME_OPTIONS: SelectOption[] = Array.from({ length: 48 }, (_, index) => {
  const time = `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`
  return { value: time, label: time }
})

/** What the editor holds while an announcement is written. */
export interface AnnouncementDraft {
  title: string
  message: string
  kind: AnnouncementKind
  tone: AnnouncementTone
  audience: 'all' | 'chosen'
  tenants: string[]
  startDate: string | null
  startTime: string
  endDate: string | null
  endTime: string
}

export function draftOf(announcement: Announcement | undefined): AnnouncementDraft {
  if (announcement === undefined) {
    return {
      title: '',
      message: '',
      kind: 'banner',
      tone: 'info',
      audience: 'all',
      tenants: [],
      startDate: null,
      startTime: '08:00',
      endDate: null,
      endTime: '23:30',
    }
  }
  const start = announcement.start === null ? null : instantParts(announcement.start)
  const end = announcement.end === null ? null : instantParts(announcement.end)
  return {
    title: announcement.title,
    message: announcement.message,
    kind: announcement.kind,
    tone: announcement.tone,
    audience: announcement.audience === 'all' ? 'all' : 'chosen',
    tenants: announcement.audience === 'all' ? [] : announcement.audience,
    startDate: start?.date ?? null,
    startTime: start?.time ?? '08:00',
    endDate: end?.date ?? null,
    endTime: end?.time ?? '23:30',
  }
}

/** The editor's checks before scheduling (a draft is saved without them, except the title). */
export function draftErrors(
  draft: AnnouncementDraft,
  scheduling: boolean,
): Partial<Record<'title' | 'message' | 'tenants' | 'start' | 'end', string>> {
  const errors: Partial<Record<'title' | 'message' | 'tenants' | 'start' | 'end', string>> = {}
  if (draft.title.trim() === '') errors.title = 'Write the announcement’s title.'
  if (!scheduling) return errors
  if (draft.message.trim() === '') errors.message = 'Write the message tenants will read.'
  if (draft.audience === 'chosen' && draft.tenants.length === 0) {
    errors.tenants = 'Choose at least one tenant.'
  }
  if (draft.startDate === null) errors.start = 'Choose when it starts.'
  if (
    draft.startDate !== null &&
    draft.endDate !== null &&
    `${draft.endDate}T${draft.endTime}` <= `${draft.startDate}T${draft.startTime}`
  ) {
    errors.end = 'The end must come after the start.'
  }
  return errors
}

/** The announcement saved from the editor: a draft, or scheduled (live at once when it has begun). */
export function saveDraft(id: string, draft: AnnouncementDraft, scheduling: boolean): Announcement {
  const start = draft.startDate === null ? null : belgradeInstant(draft.startDate, draft.startTime)
  const end = draft.endDate === null ? null : belgradeInstant(draft.endDate, draft.endTime)
  const live = start !== null && Date.parse(start) <= Date.parse(R_NOW)
  return {
    id,
    title: draft.title.trim(),
    message: draft.message.trim(),
    kind: draft.kind,
    tone: draft.tone,
    audience: draft.audience === 'all' ? 'all' : draft.tenants,
    start,
    end,
    state: scheduling ? (live ? 'Live' : 'Scheduled') : 'Draft',
  }
}

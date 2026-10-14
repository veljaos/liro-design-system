import { SuperadminShell } from './screens-R'
import {
  ArrowRight,
  BellOff,
  CircleCheck,
  KeyRound,
  LogOut,
  RotateCw,
  Send,
  ShieldOff,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Button,
  ConfirmDialog,
  DashboardPage,
  DataTable,
  Drawer,
  FilterBar,
  HealthList,
  instantText,
  KeyValueList,
  ListPage,
  MaskedValue,
  PageHeader,
  ProgressBar,
  SectionCard,
  SelectField,
  SessionList,
  useLiro,
  type DataTableColumn,
  type DataTableFilters,
  type DateRange,
  type FilterDefinition,
  type HealthItem,
  type HealthKind,
  type MenuEntry,
  type ModuleTab,
} from '@veljaos/ui'
import { BarChart, LineChart } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { Shell, statusBadge, toneOf, type ExampleAccount } from './example-shell'
import { C_ROUTES } from './data-C'
import {
  ADDRESS_REASONS,
  ADMIN_FIGURES,
  ADMIN_USERS,
  ALERTS,
  API_KEYS,
  AUDIT,
  AUDIT_COUNT,
  AUDIT_KINDS,
  AUDIT_PEOPLE,
  BACKUPS,
  CERTIFICATES,
  DATA_STORES,
  ERROR_RATE,
  FAILED_BY_DAY,
  HOURS,
  INTEGRATIONS,
  LATENCY,
  MAINTENANCE,
  NODE_COUNT,
  NODES,
  OPERATOR,
  PLATFORM_FIGURES,
  POLICY,
  Q_NOW,
  Q_ROUTES,
  Q_TODAY,
  QUEUES,
  R_PATHS,
  REGIONS,
  RESPONSE_TIME,
  SERVICES,
  SIGN_IN_COUNT,
  SIGN_INS,
  unsuccessful,
  USER_SESSIONS,
  type AdminUser,
  type ApiKey,
  type AuditEntry,
  type Certificate,
  type InfraAlert,
  type InfraNode,
  type Integration,
  type Maintenance,
  type PlatformThing,
  type SignInEvent,
} from './data-Q'
import { Frame, Tenant } from './screens-G'

/*
 * Group Q's example screens (P5.29 a, and System status and Network and infrastructure of P5.29
 * b). Kvadrat Gradnja d.o.o.'s administrator (Milica Petrović) sees her company only: the
 * overview, who signed in from where, who changed what, security and the integrations' health.
 * The Liro team (Vuk Stojanović, operations) sees the platform across every tenant: the system's
 * status and its network. Every screen plays the application: it filters its lists, answers
 * Retry, revokes a key and keeps what was revealed; the components only show and report.
 *
 * The administration's tabs and the platform's tabs (ADMIN_TABS, PLATFORM_TABS, AdminShell,
 * PlatformShell) are shared with group R (incidents, security events, tenants, announcements):
 * the lead joins the platform's routes (R_PATHS).
 */

export { Q_ROUTES }

// ── Shared: the administration's and the platform's shells ────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'signIns' | 'audit' | 'security' | 'integrations'

const ADMIN_TAB_LIST: { key: AdminTab; label: string; path: string }[] = [
  { key: 'overview', label: 'Overview', path: Q_ROUTES.adminOverview },
  { key: 'users', label: 'Users and roles', path: C_ROUTES.users },
  { key: 'signIns', label: 'Sign-in activity', path: Q_ROUTES.signIns },
  { key: 'audit', label: 'Audit log', path: Q_ROUTES.audit },
  { key: 'security', label: 'Security', path: Q_ROUTES.security },
  { key: 'integrations', label: 'Integrations', path: Q_ROUTES.integrations },
]

/** The administration's module tabs with `current` marked. */
export function adminTabs(current: AdminTab): ModuleTab[] {
  return ADMIN_TAB_LIST.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `#${tab.path}`,
    current: tab.key === current,
  }))
}

/** Milica's administration of Kvadrat Gradnja d.o.o., on 14 October 2026. */
export function AdminShell({
  phone,
  tab,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: AdminTab
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const label = ADMIN_TAB_LIST.find((each) => each.key === tab)?.label ?? ''
  return (
    <Tenant today={Q_TODAY}>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Administration', href: `#${Q_ROUTES.adminOverview}` }, { label }]}
        tabs={adminTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
      </Shell>
    </Tenant>
  )
}

export type PlatformTab =
  'status' | 'incidents' | 'securityEvents' | 'network' | 'tenants' | 'announcements'

const PLATFORM_TAB_LIST: { key: PlatformTab; label: string; path: string }[] = [
  { key: 'status', label: 'System status', path: Q_ROUTES.systemStatus },
  { key: 'incidents', label: 'Incidents', path: R_PATHS.incidents },
  { key: 'securityEvents', label: 'Security events', path: R_PATHS.securityEvents },
  { key: 'network', label: 'Network and infrastructure', path: Q_ROUTES.network },
  { key: 'tenants', label: 'Tenants', path: R_PATHS.tenants },
  { key: 'announcements', label: 'Announcements', path: R_PATHS.announcements },
]

/** The platform's module tabs with `current` marked. */
export function platformTabs(current: PlatformTab): ModuleTab[] {
  return PLATFORM_TAB_LIST.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `#${tab.path}`,
    current: tab.key === current,
  }))
}

/** The Liro team's account: the platform, not a tenant. */
export const OPERATOR_ACCOUNT: ExampleAccount = {
  name: OPERATOR.name,
  email: OPERATOR.email,
  companies: [{ id: 'liro-platform', name: 'Liro platform', description: 'Operations' }],
  links: PLATFORM_TAB_LIST.map((tab) => ({ label: tab.label, path: tab.path })),
}

/**
 * Vuk Stojanović's view of the platform, across every tenant, on 14 October 2026: the one
 * Superadmin shell of group R (its module tabs join System status and Network with the incidents,
 * security events, tenants and announcements).
 */
export function PlatformShell({
  phone,
  tab,
  children,
}: {
  phone: boolean
  tab: PlatformTab
  children: ReactNode
}) {
  return (
    <SuperadminShell phone={phone} tab={tab === 'securityEvents' ? 'security' : tab}>
      {children}
    </SuperadminShell>
  )
}

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

/** What a state means, for HealthList's icon; the words and tone are the application's map's. */
const KINDS: Record<PlatformThing['state'], HealthKind> = {
  Up: 'up',
  Degraded: 'degraded',
  Down: 'down',
  'In maintenance': 'maintenance',
  'No report': 'unknown',
}

/** A monitored thing of the dataset as HealthList shows it. */
function healthItem(
  thing: PlatformThing | Integration,
  actions?: HealthItem['actions'],
): HealthItem {
  return {
    id: thing.id,
    name: thing.name,
    ...(thing.detail === undefined ? {} : { detail: thing.detail }),
    state: { kind: KINDS[thing.state], label: thing.state, tone: toneOf(thing.state) },
    ...(thing.note === undefined ? {} : { note: thing.note }),
    ...(thing.metrics === undefined ? {} : { metrics: thing.metrics }),
    ...(thing.lastSuccess === undefined ? {} : { lastSuccess: thing.lastSuccess }),
    ...(thing.lastError === undefined ? {} : { lastError: thing.lastError }),
    ...(actions === undefined ? {} : { actions }),
  }
}

/** An instant as its date and clock, as the tenant writes them. */
function When({ at }: { at: string | null }) {
  const { format } = useLiro()
  if (at === null) return <span>Never</span>
  return (
    <time dateTime={at} dir="auto" className="whitespace-nowrap tabular-nums">
      {instantText(format, at)}
    </time>
  )
}

/** A figure written by the application: its own direction (D15), "10 of 12" never "12 of 10". */
function Figure({ children }: { children: ReactNode }) {
  return (
    <span dir="auto" className="bidi-isolate">
      {children}
    </span>
  )
}

/** A name with a second line (an e-mail, a reason, a kind). */
function TwoLines({ first, second }: { first: ReactNode; second?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="bidi-content">{first}</span>
      {second !== undefined && (
        <span className="bidi-content text-xs text-secondary">{second}</span>
      )}
    </span>
  )
}

/** A number of the dataset through the tenant's format. */
function useCount() {
  const { format } = useLiro()
  return (value: number) => format.number(String(value))
}

/** Whether an instant falls in a range of days (both ends included). */
function inPeriod(at: string, period: DateRange | undefined): boolean {
  if (period === undefined) return true
  const day = at.slice(0, 10)
  return (
    (period.start === null || day >= period.start) && (period.end === null || day <= period.end)
  )
}

function textValue(filters: DataTableFilters, id: string): string | undefined {
  const value = filters[id]
  return typeof value === 'string' && value !== '' ? value : undefined
}

function rangeValue(filters: DataTableFilters, id: string): DateRange | undefined {
  const value = filters[id]
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  return 'start' in value && 'end' in value ? (value as DateRange) : undefined
}

// ── a. Overview ───────────────────────────────────────────────────────────────────────────────

const WITHOUT_TWO_FACTOR = ADMIN_USERS.filter((user) => user.twoFactor !== 'On')

export function AdminOverview({ phone }: { phone: boolean }) {
  const { linkComponent: Link } = useLiro()
  const count = useCount()
  const integrationsWithErrors = INTEGRATIONS.filter(
    (each) => each.state === 'Down' || each.state === 'Degraded',
  )
  const twoFactorColumns: DataTableColumn<AdminUser>[] = [
    {
      id: 'user',
      header: 'User',
      cell: (user) => <TwoLines first={user.name} second={user.email} />,
    },
    { id: 'role', header: 'Role', cell: (user) => user.role },
    { id: 'twoFactor', header: 'Two-factor sign-in', cell: (user) => statusBadge(user.twoFactor) },
  ]
  return (
    <AdminShell phone={phone} tab="overview">
      <DashboardPage
        layout={phone ? 'phone' : 'desktop'}
        title="Administration"
        subtitle="Kvadrat Gradnja d.o.o. · today, 14.10.2026."
        stats={[
          {
            key: 'users',
            label: 'Users',
            value: <Figure>{count(ADMIN_FIGURES.users)}</Figure>,
            comparison: `${count(ADMIN_FIGURES.invited)} invitations pending`,
          },
          {
            key: 'sessions',
            label: 'Active sessions',
            value: <Figure>{count(ADMIN_FIGURES.activeSessions)}</Figure>,
            comparison: `On ${count(ADMIN_FIGURES.devices)} devices`,
          },
          {
            key: 'failed',
            label: 'Failed sign-ins today',
            value: <Figure>{count(ADMIN_FIGURES.failedToday)}</Figure>,
            comparison: `${count(ADMIN_FIGURES.failedYesterday)} yesterday`,
          },
          {
            key: 'twoFactor',
            label: 'Without two-factor sign-in',
            value: <Figure>{count(ADMIN_FIGURES.withoutTwoFactor)}</Figure>,
            comparison: `Of ${count(ADMIN_FIGURES.users)} users`,
          },
        ]}
      >
        <BarChart
          title="Failed sign-ins, last 7 days"
          description="Failed and blocked attempts per day"
          categories={FAILED_BY_DAY.categories}
          series={[
            { key: 'failed', label: 'Failed', tone: 'warning' },
            { key: 'blocked', label: 'Blocked', tone: 'danger' },
          ]}
          values={FAILED_BY_DAY.values}
          stack="stacked"
          layout={phone ? 'phone' : 'desktop'}
        />
        <SectionCard
          title="Licences"
          headingLevel={2}
          actions={
            <Link
              href={`#${C_ROUTES.users}`}
              className="text-sm text-link no-underline visited:text-link hover:underline"
            >
              Users and roles
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="bidi-content m-0 text-sm text-primary">
                {`${count(ADMIN_FIGURES.seatsUsed)} of ${count(ADMIN_FIGURES.seats)} seats used`}
              </p>
              <ProgressBar
                label="Seats used"
                value={ADMIN_FIGURES.seatsUsed}
                max={ADMIN_FIGURES.seats}
              />
            </div>
            <KeyValueList
              items={[
                { key: 'plan', label: 'Plan', value: ADMIN_FIGURES.plan },
                {
                  key: 'integrations',
                  label: 'Integrations',
                  value: `${count(ADMIN_FIGURES.integrations)} connected`,
                },
                { key: 'renews', label: 'Renews', value: <RenewalDate />, numeric: true },
              ]}
            />
          </div>
        </SectionCard>
        <HealthList
          className="col-span-full"
          label="Integrations with errors"
          title={`Integrations with errors: ${count(ADMIN_FIGURES.integrationsWithErrors)}`}
          layout={phone ? 'phone' : 'desktop'}
          items={integrationsWithErrors.map((each) => healthItem(each))}
          headerActions={
            <Link
              href={`#${Q_ROUTES.integrations}`}
              className="inline-flex items-center gap-1 text-sm text-link no-underline visited:text-link hover:underline"
            >
              <span className="bidi-content">All integrations</span>
              <ArrowRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
            </Link>
          }
        />
        <SectionCard
          title="Accounts without two-factor sign-in"
          headingLevel={2}
          flush
          className="col-span-full"
          actions={
            <Link
              href={`#${Q_ROUTES.security}`}
              className="text-sm text-link no-underline visited:text-link hover:underline"
            >
              Security
            </Link>
          }
        >
          <DataTable
            label="Accounts without two-factor sign-in"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={twoFactorColumns}
            rows={WITHOUT_TWO_FACTOR}
            getRowId={(user) => user.id}
            getRowLabel={(user) => user.name}
            mobile={{
              title: (user) => user.name,
              subtitle: (user) => user.role,
              badge: (user) => statusBadge(user.twoFactor),
              details: [],
            }}
          />
        </SectionCard>
      </DashboardPage>
    </AdminShell>
  )
}

function RenewalDate() {
  const { format } = useLiro()
  return <span dir="auto">{format.date(ADMIN_FIGURES.renews)}</span>
}

// ── a. Sign-in activity ───────────────────────────────────────────────────────────────────────

const RESULT_OPTIONS = [
  { value: 'Success', label: 'Success' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Blocked', label: 'Blocked' },
]

const SIGN_IN_FILTERS: FilterDefinition[] = [
  {
    id: 'user',
    label: 'User',
    type: 'select',
    options: ADMIN_USERS.map((user) => ({ value: user.id, label: user.name })),
  },
  { id: 'result', label: 'Result', type: 'select', options: RESULT_OPTIONS },
  { id: 'period', label: 'Period', type: 'dateRange' },
]

const SIGN_IN_VIEWS = [
  { id: 'all', label: 'All', count: SIGN_IN_COUNT },
  { id: 'unsuccessful', label: 'Failed and blocked', count: 38 },
  { id: 'today', label: 'Today', count: 214 },
]

/** The sign-ins the view and the filters leave (the application's query, played here). */
function signInRows(view: string, filters: DataTableFilters): SignInEvent[] {
  const user = textValue(filters, 'user')
  const result = textValue(filters, 'result')
  const period = rangeValue(filters, 'period')
  return SIGN_INS.filter(
    (event) =>
      (view !== 'unsuccessful' || unsuccessful(event)) &&
      (view !== 'today' || event.at.startsWith(Q_TODAY)) &&
      (user === undefined || event.userId === user) &&
      (result === undefined || event.result === result) &&
      inPeriod(event.at, period),
  )
}

/** The address of a sign-in: masked until the administrator says why (the access is logged). */
function SignInAddress({
  event,
  shown,
  onReveal,
  onHide,
}: {
  event: SignInEvent
  shown: boolean
  onReveal: () => void
  onHide: () => void
}) {
  const { format } = useLiro()
  return (
    <MaskedValue
      label="IP address"
      subject={`${event.user}, ${instantText(format, event.at)}`}
      reasons={ADDRESS_REASONS}
      allowOther
      logNote="Your name, the time and the reason are written to the audit log."
      {...(shown ? { value: <bdi dir="ltr">{event.address}</bdi> } : {})}
      onReveal={onReveal}
      onHide={onHide}
    />
  )
}

export function SignInActivity({
  phone,
  initialView = 'all',
}: {
  phone: boolean
  initialView?: string
}) {
  const [view, setView] = useState(initialView)
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [shown, setShown] = useState<readonly string[]>([])
  const rows = signInRows(view, filters)
  const columns: DataTableColumn<SignInEvent>[] = [
    { id: 'at', header: 'When', numeric: true, cell: (event) => <When at={event.at} /> },
    {
      id: 'user',
      header: 'User',
      cell: (event) => <TwoLines first={event.user} second={event.email} />,
    },
    { id: 'result', header: 'Result', cell: (event) => statusBadge(event.result) },
    {
      id: 'reason',
      header: 'Reason',
      minWidth: 180,
      cell: (event) => event.reason ?? '',
    },
    { id: 'device', header: 'Device', cell: (event) => event.device },
    { id: 'place', header: 'Approximate place', cell: (event) => event.place },
    {
      id: 'address',
      header: 'IP address',
      minWidth: 160,
      cell: (event) => (
        <SignInAddress
          event={event}
          shown={shown.includes(event.id)}
          onReveal={() => {
            setShown((list) => [...list, event.id])
          }}
          onHide={() => {
            setShown((list) => list.filter((each) => each !== event.id))
          }}
        />
      ),
    },
  ]
  return (
    <AdminShell phone={phone} tab="signIns">
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Sign-in activity"
        views={SIGN_IN_VIEWS}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={SIGN_IN_FILTERS}
            inline={3}
            values={filters}
            onValuesChange={setFilters}
            actions={<Button intent="export" label="Export" />}
            phoneMenu={[{ label: 'Export', icon: Send, onSelect: () => undefined }]}
          />
        }
      >
        <DataTable
          label="Sign-in activity"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(event) => event.id}
          getRowLabel={(event) => `${event.user}, ${event.at}`}
          filters={filters}
          onFiltersChange={setFilters}
          count={view === 'all' && Object.keys(filters).length === 0 ? SIGN_IN_COUNT : rows.length}
          hasPrevious={false}
          hasNext={view === 'all'}
          onPrevious={() => undefined}
          onNext={() => undefined}
          mobile={{
            title: (event) => event.user,
            subtitle: (event) => <When at={event.at} />,
            badge: (event) => statusBadge(event.result),
            details: ['reason', 'device', 'place', 'address'],
          }}
        />
      </ListPage>
    </AdminShell>
  )
}

// ── a. Audit log ──────────────────────────────────────────────────────────────────────────────

const ACCESS_KINDS: readonly string[] = ['Setting', 'User', 'Role', 'API key']

const AUDIT_FILTERS: FilterDefinition[] = [
  {
    id: 'who',
    label: 'Changed by',
    type: 'select',
    options: AUDIT_PEOPLE.map((name) => ({ value: name, label: name })),
  },
  {
    id: 'kind',
    label: 'Record',
    type: 'select',
    options: AUDIT_KINDS.map((kind) => ({ value: kind, label: kind })),
  },
  { id: 'period', label: 'Period', type: 'dateRange' },
]

const AUDIT_VIEWS = [
  { id: 'all', label: 'All', count: AUDIT_COUNT },
  { id: 'access', label: 'Access and settings', count: 1_904 },
  { id: 'documents', label: 'Documents and customers', count: 46_406 },
]

function auditRows(view: string, filters: DataTableFilters, search: string): AuditEntry[] {
  const who = textValue(filters, 'who')
  const kind = textValue(filters, 'kind')
  const period = rangeValue(filters, 'period')
  const words = search.trim().toLocaleLowerCase()
  return AUDIT.filter(
    (entry) =>
      (view !== 'access' || ACCESS_KINDS.includes(entry.kind)) &&
      (view !== 'documents' || !ACCESS_KINDS.includes(entry.kind)) &&
      (who === undefined || entry.who === who) &&
      (kind === undefined || entry.kind === kind) &&
      inPeriod(entry.at, period) &&
      (words === '' || `${entry.record} ${entry.field}`.toLocaleLowerCase().includes(words)),
  )
}

/** Old → new, the old struck through; "empty" for nothing. */
function Change({ entry }: { entry: AuditEntry }) {
  return (
    <span className="bidi-content flex flex-wrap items-baseline gap-x-1.5">
      <span className="sr-only">From</span>
      {entry.old === null ? (
        <span className="bidi-isolate text-tertiary italic">empty</span>
      ) : (
        <del className="bidi-isolate text-secondary">{entry.old}</del>
      )}
      <ArrowRight
        aria-hidden="true"
        className="size-3.5 shrink-0 self-center text-tertiary rtl:-scale-x-100"
      />
      <span className="sr-only">to</span>
      {entry.new === null ? (
        <span className="bidi-isolate text-tertiary italic">empty</span>
      ) : (
        <ins className="bidi-isolate text-primary no-underline">{entry.new}</ins>
      )}
    </span>
  )
}

export function AuditLog({
  phone,
  initialView = 'all',
  initialFilters = {},
}: {
  phone: boolean
  initialView?: string
  initialFilters?: DataTableFilters
}) {
  const [view, setView] = useState(initialView)
  const [filters, setFilters] = useState<DataTableFilters>(initialFilters)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<AuditEntry | null>(null)
  const rows = auditRows(view, filters, search)
  const narrowed = view !== 'all' || Object.keys(filters).length > 0 || search !== ''
  const columns: DataTableColumn<AuditEntry>[] = [
    { id: 'at', header: 'When', numeric: true, cell: (entry) => <When at={entry.at} /> },
    { id: 'who', header: 'Changed by', cell: (entry) => entry.who },
    {
      id: 'record',
      header: 'Record',
      cell: (entry) => <TwoLines first={entry.record} second={entry.kind} />,
    },
    { id: 'field', header: 'Field', cell: (entry) => entry.field },
    { id: 'change', header: 'Change', minWidth: 240, cell: (entry) => <Change entry={entry} /> },
  ]
  return (
    <AdminShell phone={phone} tab="audit">
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Audit log"
        views={AUDIT_VIEWS}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={AUDIT_FILTERS}
            inline={3}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search record or field"
            actions={<Button intent="export" label="Export" />}
            phoneMenu={[{ label: 'Export', icon: Send, onSelect: () => undefined }]}
          />
        }
      >
        <DataTable
          label="Audit log"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(entry) => entry.id}
          getRowLabel={(entry) => `${entry.record}, ${entry.field}`}
          filters={filters}
          onFiltersChange={setFilters}
          onRowClick={setOpen}
          count={narrowed ? rows.length : AUDIT_COUNT}
          hasPrevious={false}
          hasNext={!narrowed}
          onPrevious={() => undefined}
          onNext={() => undefined}
          rowLimitMessage="The audit log keeps every change for 10 years. Entries cannot be edited or deleted."
          mobile={{
            title: (entry) => `${entry.record} · ${entry.field}`,
            subtitle: (entry) => <When at={entry.at} />,
            details: ['who', 'change'],
          }}
        />
      </ListPage>
      {open !== null && (
        <AuditEntryDrawer
          entry={open}
          onClose={() => {
            setOpen(null)
          }}
        />
      )}
    </AdminShell>
  )
}

/** One entry, read only: everything the Core recorded about the change. */
function AuditEntryDrawer({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  return (
    <Drawer
      side="end"
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={`${entry.kind}: ${entry.record}`}
      description={entry.field}
    >
      <KeyValueList
        items={[
          { key: 'at', label: 'When', value: <When at={entry.at} />, numeric: true },
          { key: 'who', label: 'Changed by', value: entry.who },
          { key: 'field', label: 'Field', value: entry.field },
          { key: 'old', label: 'Before', value: entry.old ?? 'empty' },
          { key: 'new', label: 'After', value: entry.new ?? 'empty' },
          { key: 'address', label: 'IP address', value: <bdi dir="ltr">{entry.address}</bdi> },
          { key: 'request', label: 'Request', value: <bdi dir="ltr">{entry.request}</bdi> },
        ]}
      />
    </Drawer>
  )
}

// ── a. Security ───────────────────────────────────────────────────────────────────────────────

export function AdminSecurity({
  phone,
  initialRevoking,
}: {
  phone: boolean
  /** The key whose revocation is being asked when the page opens. */
  initialRevoking?: string
}) {
  const { format } = useLiro()
  const [keys, setKeys] = useState<ApiKey[]>(API_KEYS)
  const [revoking, setRevoking] = useState<ApiKey | null>(
    API_KEYS.find((key) => key.id === initialRevoking) ?? null,
  )
  const [resetting, setResetting] = useState<AdminUser | null>(null)
  const [deviceUser, setDeviceUser] = useState('u4')
  const [sessions, setSessions] = useState(USER_SESSIONS)
  const [signingOutAll, setSigningOutAll] = useState(false)
  const chosen = ADMIN_USERS.find((user) => user.id === deviceUser)
  const userSessions = sessions[deviceUser] ?? []

  const userColumns: DataTableColumn<AdminUser>[] = [
    {
      id: 'user',
      header: 'User',
      cell: (user) => <TwoLines first={user.name} second={user.email} />,
    },
    { id: 'role', header: 'Role', cell: (user) => user.role },
    {
      id: 'twoFactor',
      header: 'Two-factor sign-in',
      cell: (user) => <TwoLines first={statusBadge(user.twoFactor)} second={user.method} />,
    },
    {
      id: 'lastSignIn',
      header: 'Last sign-in',
      numeric: true,
      cell: (user) => <When at={user.lastSignIn} />,
    },
  ]
  const userActions = (user: AdminUser): MenuEntry[] =>
    user.twoFactor === 'On'
      ? [
          {
            label: 'Reset two-factor sign-in',
            icon: ShieldOff,
            destructive: true,
            onSelect: () => {
              setResetting(user)
            },
          },
        ]
      : [{ label: 'Send a reminder', icon: Send, onSelect: () => undefined }]

  const keyColumns: DataTableColumn<ApiKey>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (key) => <TwoLines first={key.name} second={<bdi dir="ltr">{`${key.prefix}…`}</bdi>} />,
    },
    { id: 'scopes', header: 'Access', cell: (key) => key.scopes },
    {
      id: 'created',
      header: 'Created',
      numeric: true,
      cell: (key) => (
        <TwoLines first={<bdi>{format.date(key.created)}</bdi>} second={`by ${key.createdBy}`} />
      ),
    },
    {
      id: 'lastUsed',
      header: 'Last used',
      numeric: true,
      cell: (key) => <When at={key.lastUsed} />,
    },
    {
      id: 'expires',
      header: 'Expires',
      numeric: true,
      cell: (key) => (key.expires === null ? 'Never' : <bdi>{format.date(key.expires)}</bdi>),
    },
    { id: 'state', header: 'State', cell: (key) => statusBadge(key.state) },
  ]

  return (
    <AdminShell phone={phone} tab="security">
      <Frame phone={phone}>
        <PageHeader
          title="Security"
          subtitle="Kvadrat Gradnja d.o.o. · two-factor sign-in, devices, keys and the policy"
          titleHidden
        />
        <SectionCard
          title="Two-factor sign-in"
          description="Required for administrators and accountants (the policy below)."
          headingLevel={2}
          flush
        >
          <DataTable
            label="Two-factor sign-in"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={userColumns}
            rows={ADMIN_USERS}
            getRowId={(user) => user.id}
            getRowLabel={(user) => user.name}
            rowActions={userActions}
            count={ADMIN_FIGURES.users}
            hasPrevious={false}
            hasNext
            onPrevious={() => undefined}
            onNext={() => undefined}
            mobile={{
              title: (user) => user.name,
              subtitle: (user) => user.role,
              badge: (user) => statusBadge(user.twoFactor),
              details: ['lastSignIn'],
            }}
          />
        </SectionCard>
        <SectionCard
          title="Signed-in devices"
          description="Sign a user out of one device, or of every device."
          headingLevel={2}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <SelectField
                label="User"
                className="w-72 max-w-full"
                options={ADMIN_USERS.map((user) => ({ value: user.id, label: user.name }))}
                value={deviceUser}
                onChange={(value) => {
                  if (value !== '') setDeviceUser(value)
                }}
              />
              {userSessions.length > 0 && (
                <Button
                  family="destructive"
                  icon={LogOut}
                  label="Sign out everywhere"
                  onClick={() => {
                    setSigningOutAll(true)
                  }}
                />
              )}
            </div>
            <SessionList
              label={`Devices of ${chosen?.name ?? ''}`}
              sessions={userSessions}
              onRevoke={(session) => {
                setSessions((all) => ({
                  ...all,
                  [deviceUser]: (all[deviceUser] ?? []).filter((each) => each.id !== session.id),
                }))
              }}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="API keys and tokens"
          description="Programs that use Liro on the company’s behalf. A key is shown once, when it is created."
          headingLevel={2}
          flush
          actions={<Button intent="create" label="Create API key" />}
        >
          <DataTable
            label="API keys and tokens"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={keyColumns}
            rows={keys}
            getRowId={(key) => key.id}
            getRowLabel={(key) => key.name}
            rowActions={(key) =>
              key.state === 'Revoked'
                ? []
                : [
                    {
                      label: 'Revoke',
                      icon: KeyRound,
                      destructive: true,
                      onSelect: () => {
                        setRevoking(key)
                      },
                    },
                  ]
            }
            mobile={{
              title: (key) => key.name,
              subtitle: (key) => key.scopes,
              badge: (key) => statusBadge(key.state),
              details: ['lastUsed', 'expires'],
            }}
          />
        </SectionCard>
        <SectionCard
          title="Password and session policy"
          headingLevel={2}
          actions={<Button intent="edit" label="Change policy" />}
        >
          <KeyValueList columns={phone ? 1 : 2} items={POLICY} />
        </SectionCard>
      </Frame>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRevoking(null)
        }}
        family="destructive"
        actionIcon={KeyRound}
        title="Revoke API key"
        subject={revoking?.name}
        message="Programs that use this key stop working at once. A revoked key cannot be used again; create a new one if it is still needed."
        confirmLabel="Revoke key"
        onConfirm={() => {
          const key = revoking
          if (key !== null) {
            setKeys((list) =>
              list.map((each) => (each.id === key.id ? { ...each, state: 'Revoked' } : each)),
            )
          }
          setRevoking(null)
        }}
      />
      <ConfirmDialog
        open={resetting !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setResetting(null)
        }}
        family="destructive"
        actionIcon={ShieldOff}
        title="Reset two-factor sign-in"
        subject={resetting?.name}
        message="The user signs in with the password only once, and must set up two-factor sign-in again right away."
        confirmLabel="Reset"
        onConfirm={() => {
          setResetting(null)
        }}
      />
      <ConfirmDialog
        open={signingOutAll}
        onOpenChange={setSigningOutAll}
        family="destructive"
        actionIcon={LogOut}
        title="Sign out everywhere"
        subject={chosen?.name}
        message="Every device of this user is signed out at once; unsaved work there is lost."
        confirmLabel="Sign out everywhere"
        onConfirm={() => {
          setSessions((all) => ({ ...all, [deviceUser]: [] }))
          setSigningOutAll(false)
        }}
      />
    </AdminShell>
  )
}

// ── a. Integrations health ────────────────────────────────────────────────────────────────────

/** The integration without its note on the state (the state it explained is over). */
function withoutNote(integration: Integration): Integration {
  return Object.fromEntries(
    Object.entries(integration).filter(([key]) => key !== 'note'),
  ) as unknown as Integration
}

/** How long the example's application takes to try a connection again. */
const RETRY_TIME = 600

export function AdminIntegrations({ phone }: { phone: boolean }) {
  const [list, setList] = useState<Integration[]>(INTEGRATIONS)
  const retry = (id: string) =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        // The application tried again and the connection answered.
        setList((all) =>
          all.map((each) =>
            each.id === id ? withoutNote({ ...each, state: 'Up', lastSuccess: Q_NOW }) : each,
          ),
        )
        resolve()
      }, RETRY_TIME)
    })
  return (
    <AdminShell phone={phone} tab="integrations">
      <Frame phone={phone}>
        <PageHeader
          title="Integrations"
          subtitle="Checked every minute · last check at 09:40"
          titleHidden
        />
        <HealthList
          label="Integrations"
          layout={phone ? 'phone' : 'desktop'}
          items={list.map((each) =>
            healthItem(
              each,
              each.retry === true && each.state !== 'Up'
                ? [
                    {
                      key: 'retry',
                      label: 'Retry',
                      icon: RotateCw,
                      onSelect: () => retry(each.id),
                    },
                  ]
                : undefined,
            ),
          )}
        />
      </Frame>
    </AdminShell>
  )
}

// ── b. System status ──────────────────────────────────────────────────────────────────────────

const CERTIFICATE_COLUMNS: DataTableColumn<Certificate>[] = [
  {
    id: 'name',
    header: 'Certificate',
    cell: (each) => <TwoLines first={<bdi>{each.name}</bdi>} second={each.usedBy} />,
  },
  { id: 'issuer', header: 'Issuer', cell: (each) => each.issuer },
  {
    id: 'expires',
    header: 'Expires',
    numeric: true,
    cell: (each) => <ExpiryDate value={each.expires} />,
  },
  { id: 'state', header: 'State', cell: (each) => statusBadge(each.state) },
  { id: 'note', header: 'Renewal', cell: (each) => each.note },
]

function ExpiryDate({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi>{format.date(value)}</bdi>
}

function MaintenanceTime({ item }: { item: Maintenance }) {
  const { format } = useLiro()
  return (
    <span dir="auto" className="whitespace-nowrap tabular-nums">
      {`${instantText(format, item.start)}–${format.time(item.end)}`}
    </span>
  )
}

const MAINTENANCE_COLUMNS: DataTableColumn<Maintenance>[] = [
  { id: 'when', header: 'When', numeric: true, cell: (item) => <MaintenanceTime item={item} /> },
  { id: 'what', header: 'What', cell: (item) => item.what },
  { id: 'affects', header: 'Effect on tenants', cell: (item) => item.affects },
  { id: 'state', header: 'State', cell: (item) => statusBadge(item.state) },
]

export function SystemStatus({ phone, loading = false }: { phone: boolean; loading?: boolean }) {
  const { format } = useLiro()
  const count = useCount()
  const layout = phone ? 'phone' : 'desktop'
  return (
    <PlatformShell phone={phone} tab="status">
      <DashboardPage
        layout={layout}
        title="System status"
        subtitle={`All ${count(PLATFORM_FIGURES.tenants)} tenants · 14.10.2026. at 09:40`}
        loading={loading}
        stats={[
          {
            key: 'services',
            label: 'Services up',
            value: (
              <Figure>{`${count(PLATFORM_FIGURES.servicesUp)} of ${count(PLATFORM_FIGURES.services)}`}</Figure>
            ),
            comparison: '1 degraded, 1 down',
          },
          {
            key: 'uptime',
            label: 'Uptime, 30 days',
            value: <Figure>{format.percent(PLATFORM_FIGURES.uptime)}</Figure>,
            comparison: `Target ${format.percent('99.9')}`,
          },
          {
            key: 'response',
            label: 'Response time, p95',
            value: <Figure>{`${format.number(PLATFORM_FIGURES.responseP95)} ms`}</Figure>,
            comparison: 'The last hour',
          },
          {
            key: 'errors',
            label: 'Error rate',
            value: <Figure>{format.percent(PLATFORM_FIGURES.errorRate)}</Figure>,
            comparison: 'The last hour',
          },
        ]}
      >
        <LineChart
          title="Response time, last 24 hours"
          description="Milliseconds, every request of every tenant"
          categories={HOURS}
          series={[
            { key: 'p95', label: '95th percentile' },
            { key: 'p50', label: 'Median', role: 'comparison' },
          ]}
          values={RESPONSE_TIME}
          layout={layout}
          {...(loading ? { loading: true } : {})}
        />
        <LineChart
          title="Error rate, last 24 hours"
          description="Percent of requests that failed"
          categories={HOURS}
          series={[{ key: 'errors', label: 'Errors' }]}
          values={ERROR_RATE}
          decimals={2}
          layout={layout}
          {...(loading ? { loading: true } : {})}
        />
        <HealthList
          className="col-span-full"
          label="Services"
          title="Services"
          layout={layout}
          loading={loading}
          items={SERVICES.map((each) => healthItem(each))}
        />
        <HealthList
          className="col-span-full"
          label="Queues"
          title="Queues"
          layout={layout}
          loading={loading}
          items={QUEUES.map((each) => healthItem(each))}
        />
        <HealthList
          className="col-span-full"
          label="Databases and storage"
          title="Databases and storage"
          layout={layout}
          loading={loading}
          items={DATA_STORES.map((each) => healthItem(each))}
        />
        <HealthList
          className="col-span-full"
          label="Backups"
          title="Backups"
          layout={layout}
          loading={loading}
          items={BACKUPS.map((each) => healthItem(each))}
          headerActions={
            <span className="bidi-content text-xs text-secondary">
              Last good backup 14.10.2026. 03:12 · restore tested 07.10.2026.
            </span>
          }
        />
        <SectionCard title="Certificates" headingLevel={2} flush className="col-span-full">
          <DataTable
            label="Certificates"
            layout={phone ? 'cards' : 'table'}
            inCard
            loading={loading}
            columns={CERTIFICATE_COLUMNS}
            rows={CERTIFICATES}
            getRowId={(each) => each.id}
            getRowLabel={(each) => each.name}
            mobile={{
              title: (each) => each.name,
              subtitle: (each) => each.usedBy,
              badge: (each) => statusBadge(each.state),
              details: ['expires', 'note'],
            }}
          />
        </SectionCard>
        <SectionCard title="Scheduled maintenance" headingLevel={2} flush className="col-span-full">
          <DataTable
            label="Scheduled maintenance"
            layout={phone ? 'cards' : 'table'}
            inCard
            loading={loading}
            columns={MAINTENANCE_COLUMNS}
            rows={MAINTENANCE}
            getRowId={(item) => item.id}
            getRowLabel={(item) => item.what}
            mobile={{
              title: (item) => item.what,
              subtitle: (item) => <MaintenanceTime item={item} />,
              badge: (item) => statusBadge(item.state),
              details: ['affects'],
            }}
          />
        </SectionCard>
      </DashboardPage>
    </PlatformShell>
  )
}

// ── b. Network and infrastructure ─────────────────────────────────────────────────────────────

const NODE_FILTERS: FilterDefinition[] = [
  {
    id: 'region',
    label: 'Region',
    type: 'select',
    options: ['Frankfurt', 'Belgrade', 'Amsterdam'].map((each) => ({ value: each, label: each })),
  },
  {
    id: 'role',
    label: 'Role',
    type: 'select',
    options: ['Web', 'API', 'Worker', 'Database', 'Storage', 'Edge'].map((each) => ({
      value: each,
      label: each,
    })),
  },
  {
    id: 'state',
    label: 'Health',
    type: 'select',
    options: ['Up', 'Degraded', 'Down', 'In maintenance'].map((each) => ({
      value: each,
      label: each,
    })),
  },
]

function nodeRows(filters: DataTableFilters): InfraNode[] {
  const region = textValue(filters, 'region')
  const role = textValue(filters, 'role')
  const state = textValue(filters, 'state')
  return NODES.filter(
    (node) =>
      (region === undefined || node.region === region) &&
      (role === undefined || node.role === role) &&
      (state === undefined || node.state === state),
  )
}

const NODE_COLUMNS: DataTableColumn<InfraNode>[] = [
  { id: 'name', header: 'Node', cell: (node) => <bdi className="font-medium">{node.name}</bdi> },
  { id: 'role', header: 'Role', cell: (node) => node.role },
  { id: 'region', header: 'Region', cell: (node) => node.region },
  { id: 'address', header: 'Address', cell: (node) => <bdi dir="ltr">{node.address}</bdi> },
  { id: 'state', header: 'Health', cell: (node) => statusBadge(node.state) },
  { id: 'cpu', header: 'CPU', align: 'end', numeric: true, cell: (node) => <bdi>{node.cpu}</bdi> },
  {
    id: 'memory',
    header: 'Memory',
    align: 'end',
    numeric: true,
    cell: (node) => <bdi>{node.memory}</bdi>,
  },
  {
    id: 'latency',
    header: 'Latency',
    align: 'end',
    numeric: true,
    cell: (node) => <bdi>{node.latency}</bdi>,
  },
  {
    id: 'alerts',
    header: 'Alerts',
    align: 'end',
    numeric: true,
    cell: (node) => <AlertCount value={node.alerts} />,
  },
]

function AlertCount({ value }: { value: number }) {
  const { format } = useLiro()
  return <bdi>{format.number(String(value))}</bdi>
}

export function NetworkInfrastructure({ phone }: { phone: boolean }) {
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [acknowledged, setAcknowledged] = useState<Record<string, string>>({})
  const layout = phone ? 'phone' : 'desktop'
  const rows = nodeRows(filters)
  const filtered = Object.keys(filters).length > 0
  const alertColumns: DataTableColumn<InfraAlert>[] = [
    { id: 'severity', header: 'Severity', cell: (alert) => statusBadge(alert.severity) },
    { id: 'node', header: 'Node', cell: (alert) => <bdi>{alert.node}</bdi> },
    { id: 'text', header: 'Alert', minWidth: 240, cell: (alert) => alert.text },
    { id: 'since', header: 'Since', numeric: true, cell: (alert) => <When at={alert.since} /> },
    {
      id: 'acknowledged',
      header: 'Acknowledged by',
      cell: (alert) => acknowledged[alert.id] ?? alert.acknowledgedBy ?? '',
    },
  ]
  return (
    <PlatformShell phone={phone} tab="network">
      <Frame phone={phone} wide={!phone}>
        <PageHeader
          title="Network and infrastructure"
          subtitle="3 regions · 38 nodes · checked every 30 seconds"
          titleHidden
        />
        <HealthList
          label="Regions"
          title="Regions"
          layout={layout}
          items={REGIONS.map((each) => healthItem(each))}
        />
        <LineChart
          title="Latency between regions, last 24 hours"
          description="Round trip, milliseconds"
          categories={HOURS}
          series={[
            { key: 'fraBeg', label: 'Frankfurt – Belgrade' },
            { key: 'fraAms', label: 'Frankfurt – Amsterdam', role: 'comparison' },
          ]}
          values={LATENCY}
          layout={layout}
        />
        <SectionCard title="Open alerts" headingLevel={2} flush>
          <DataTable
            label="Open alerts"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={alertColumns}
            rows={ALERTS}
            getRowId={(alert) => alert.id}
            getRowLabel={(alert) => `${alert.node}: ${alert.text}`}
            rowActions={(alert) =>
              alert.acknowledgedBy === undefined && acknowledged[alert.id] === undefined
                ? [
                    {
                      label: 'Acknowledge',
                      icon: BellOff,
                      onSelect: () => {
                        setAcknowledged((all) => ({ ...all, [alert.id]: OPERATOR.name }))
                      },
                    },
                  ]
                : [{ label: 'Resolved', icon: CircleCheck, onSelect: () => undefined }]
            }
            mobile={{
              title: (alert) => alert.text,
              subtitle: (alert) => <bdi>{alert.node}</bdi>,
              badge: (alert) => statusBadge(alert.severity),
              details: ['since', 'acknowledged'],
            }}
          />
        </SectionCard>
        <SectionCard title="Nodes" headingLevel={2} flush>
          <FilterBar
            inCard
            layout={layout}
            filters={NODE_FILTERS}
            inline={3}
            values={filters}
            onValuesChange={setFilters}
          />
          <DataTable
            label="Nodes"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={NODE_COLUMNS}
            rows={rows}
            getRowId={(node) => node.id}
            getRowLabel={(node) => node.name}
            filters={filters}
            onFiltersChange={setFilters}
            count={filtered ? rows.length : NODE_COUNT}
            hasPrevious={false}
            hasNext={!filtered}
            onPrevious={() => undefined}
            onNext={() => undefined}
            mobile={{
              title: (node) => node.name,
              subtitle: (node) => `${node.role} · ${node.region}`,
              badge: (node) => statusBadge(node.state),
              details: ['address', 'cpu', 'latency', 'alerts'],
            }}
          />
        </SectionCard>
      </Frame>
    </PlatformShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_Q_ROUTES: ExampleRoute[] = [
  { path: Q_ROUTES.adminOverview, render: (phone) => <AdminOverview phone={phone} /> },
  { path: Q_ROUTES.signIns, render: (phone) => <SignInActivity phone={phone} /> },
  {
    path: Q_ROUTES.signInsFailed,
    render: (phone) => <SignInActivity phone={phone} initialView="unsuccessful" />,
  },
  { path: Q_ROUTES.audit, render: (phone) => <AuditLog phone={phone} /> },
  {
    path: Q_ROUTES.auditFiltered,
    render: (phone) => (
      <AuditLog phone={phone} initialView="access" initialFilters={{ who: 'Milica Petrović' }} />
    ),
  },
  { path: Q_ROUTES.security, render: (phone) => <AdminSecurity phone={phone} /> },
  {
    path: Q_ROUTES.securityRevoke,
    render: (phone) => <AdminSecurity phone={phone} initialRevoking="k3" />,
  },
  { path: Q_ROUTES.integrations, render: (phone) => <AdminIntegrations phone={phone} /> },
  { path: Q_ROUTES.systemStatus, render: (phone) => <SystemStatus phone={phone} /> },
  {
    path: Q_ROUTES.systemStatusLoading,
    render: (phone) => <SystemStatus phone={phone} loading />,
  },
  { path: Q_ROUTES.network, render: (phone) => <NetworkInfrastructure phone={phone} /> },
]

import {
  ClipboardCheck,
  FileText,
  Inbox,
  Languages,
  LogOut,
  MessageSquarePlus,
  Plus,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useContext, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  AppShell,
  AttachmentList,
  Button,
  CalendarView,
  CheckboxField,
  CompactIconButton,
  DataTable,
  DateField,
  DateText,
  daysBetween,
  Drawer,
  DueDate,
  FileDropzone,
  FilterBar,
  KeyValueList,
  ListPage,
  notice,
  PageHeader,
  PortalShell,
  RadioGroupField,
  SectionCard,
  SelectField,
  SetupChecklist,
  StatusBadge,
  SwitchField,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  type CalendarEvent,
  type CommandItem,
  type DataTableColumn,
  type DataTableFilters,
  type FilterDefinition,
  type MenuEntry,
  type ModuleTab,
  type PortalSection,
  type SetupStep,
  type ShellCompanies,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { BRAND, Navigate, ROUTES } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import {
  ACCOUNTANTS,
  ASK_DEFAULTS,
  CLIENTS,
  clientById,
  closeSteps,
  DEADLINE_KINDS,
  DEADLINE_TONES,
  FIRM,
  HEALTH_TONES,
  KVADRAT,
  ME,
  nextOpenDeadline,
  PINNED,
  PORTAL_PERSON,
  PROBLEMS,
  RECENT,
  REQUEST_TONES,
  REQUESTS,
  SHARED_DOCUMENTS,
  SWITCHER_COMPANIES,
  V_NOW,
  V_ROUTES,
  V_TODAY,
  type AccountantId,
  type AccountingClient,
  type ClientDeadline,
  type ClientRequest,
  type DeadlineKind,
  type RequestItem,
  type RequestKind,
} from './data-V'

/*
 * Group V's example screens (P5.32, the accountant's workspace). Snežana Jelić of Knjigovodstvo
 * Jelić works for 214 client companies: the clients overview (deadlines, missing documents, open
 * tasks, last activity and health, in the application's order of urgency), the deadlines across
 * clients in a calendar, one client's month-end checklist, the company switcher at 214 clients,
 * and "Ask the client" — a request for documents or answers that Milica Petrović of Kvadrat
 * Gradnja d.o.o. sees and answers in the client portal. Every screen plays the application: it
 * filters, keeps the requests above the screens and answers Send; the components only show and
 * report. Built from the library alone: AppShell, ListPage, FilterBar, DataTable, CalendarView,
 * SetupChecklist, Drawer and the fields, PortalShell, FileDropzone and AttachmentList.
 */

export { V_ROUTES }

// ── Shared: the accountant's shell ────────────────────────────────────────────────────────────

type AccountantTab = 'clients' | 'deadlines'

const TABS: { key: AccountantTab; label: string; path: string }[] = [
  { key: 'clients', label: 'Clients', path: V_ROUTES.clients },
  { key: 'deadlines', label: 'Deadlines', path: V_ROUTES.deadlines },
]

const ME_PERSON = ACCOUNTANTS[ME]

/**
 * Snežana Jelić's shell: the firm's two module tabs, the company switcher with every client
 * (pinned, recent, all 214, searched by name or tax number), her user menu.
 */
function AccountantShell({
  phone,
  tab,
  company = 'jelic',
  crumbs,
  switcherOpen = false,
  children,
}: {
  phone: boolean
  tab?: AccountantTab
  /** The company being worked on; the firm's own on the overview. */
  company?: string
  crumbs: { label: string; href?: string }[]
  switcherOpen?: boolean
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const moduleTabs: ModuleTab[] = TABS.map((each) => ({
    key: each.key,
    label: each.label,
    href: `#${each.path}`,
    current: each.key === tab,
  }))
  const commands: CommandItem[] = TABS.map((each) => ({
    id: `go-${each.key}`,
    label: each.label,
    group: 'navigation' as const,
    onSelect: () => {
      navigate(each.path)
    },
  }))
  const companies: ShellCompanies = {
    items: SWITCHER_COMPANIES,
    current: company,
    pinned: PINNED,
    recent: RECENT,
    onSelect: (id) => {
      navigate(V_ROUTES.close(id))
    },
  }
  return (
    <Tenant today={V_TODAY}>
      <AppShell
        layout={phone ? 'phone' : 'desktop'}
        brand={BRAND}
        breadcrumbs={crumbs}
        commands={{ items: commands }}
        companies={companies}
        user={{
          name: ME_PERSON.name,
          email: ME_PERSON.email,
          entries: [
            { label: 'Profile', icon: UserRound, onSelect: () => undefined },
            { type: 'separator' },
            {
              label: 'Sign out',
              icon: LogOut,
              onSelect: () => {
                navigate(ROUTES.signIn)
              },
            },
          ],
        }}
        moduleTabs={moduleTabs}
        {...(switcherOpen ? { defaultOpenMenu: 'companies' as const } : {})}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </AppShell>
    </Tenant>
  )
}

/** The requests to the clients, as the application keeps them (both sides see the same). */
function useRequests() {
  return useExampleState<ClientRequest[]>('V.requests', () => REQUESTS)
}

function healthBadge(client: AccountingClient) {
  return <StatusBadge label={client.health} tone={HEALTH_TONES[client.health]} />
}

function count(format: ReturnType<typeof useLiro>['format'], value: number): string {
  return format.number(String(value))
}

/** "1 of 3 done": the items a client has given (a file or an answer). */
function itemsGiven(request: ClientRequest): number {
  return request.items.filter((item) => item.file !== undefined || (item.answer ?? '') !== '')
    .length
}

// ── "Ask the client" ──────────────────────────────────────────────────────────────────────────

interface AskDraft {
  kind: RequestKind
  items: string[]
  due: string | null
  message: string
  email: boolean
}

const KIND_OPTIONS = [
  { value: 'documents', label: 'Documents', description: 'The client uploads files.' },
  { value: 'answers', label: 'Answers', description: 'The client answers in words.' },
]

/**
 * The accountant's request to a client (D14: a short edit with the list still visible, so a
 * Drawer at the end): the kind, the items asked for, the due date, a message, and the e-mail as
 * an explicit choice (D24). The application checks it; Send adds it to the client's portal.
 */
function AskClientDrawer({
  client,
  open,
  onOpenChange,
  showErrors = false,
}: {
  client: AccountingClient
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Start as after a Send that the checks stopped (the errors' picture). */
  showErrors?: boolean
}) {
  const { format } = useLiro()
  const [, setRequests] = useRequests()
  const [draft, setDraft] = useState<AskDraft>(() =>
    showErrors
      ? { kind: 'answers', items: [''], due: null, message: '', email: true }
      : {
          kind: ASK_DEFAULTS.kind,
          items: client.id === KVADRAT.id ? [...ASK_DEFAULTS.items] : [''],
          due: ASK_DEFAULTS.due,
          message: client.id === KVADRAT.id ? ASK_DEFAULTS.message : '',
          email: true,
        },
  )
  const [checked, setChecked] = useState(showErrors)
  const filled = draft.items.filter((item) => item.trim() !== '')
  const errors = {
    items:
      filled.length === 0
        ? draft.kind === 'documents'
          ? 'Name at least one document.'
          : 'Write at least one question.'
        : undefined,
    due:
      draft.due === null
        ? 'Choose the day the answer is due.'
        : daysBetween(V_TODAY, draft.due) < 0
          ? 'The due date is in the past.'
          : undefined,
  }
  const invalid = errors.items !== undefined || errors.due !== undefined
  const noun = draft.kind === 'documents' ? 'Document' : 'Question'
  const send = () => {
    setChecked(true)
    if (invalid || draft.due === null) return
    const due = draft.due
    setRequests((list) => [
      {
        id: `REQ-2026-${String(120 + list.length - REQUESTS.length)}`,
        clientId: client.id,
        kind: draft.kind,
        title:
          draft.kind === 'documents'
            ? `Documents asked on ${format.date(V_TODAY)}`
            : `Questions asked on ${format.date(V_TODAY)}`,
        from: ME,
        sentAt: V_NOW,
        due,
        message: draft.message.trim(),
        items: filled.map((text, index) => ({
          id: `item-${String(index + 1)}`,
          text: text.trim(),
        })),
        status: 'Open',
      },
      ...list,
    ])
    notice.success(
      draft.email
        ? `Request sent to ${client.name}, with an e-mail to ${client.contact ?? 'the client'}.`
        : `Request sent to ${client.name}.`,
    )
    onOpenChange(false)
  }
  const setItem = (index: number, text: string) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, at) => (at === index ? text : item)),
    }))
  }
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      title="Ask the client"
      subject={client.name}
      description="The request appears in the client's portal, where they upload or answer."
      actions={
        <>
          <Button
            intent="cancel"
            label="Cancel"
            onClick={() => {
              onOpenChange(false)
            }}
          />
          <Button family="primary" icon={Send} label="Send request" onClick={send} />
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <RadioGroupField
          label="What do you need?"
          options={KIND_OPTIONS}
          value={draft.kind}
          onChange={(kind) => {
            setDraft((current) => ({ ...current, kind: kind as RequestKind }))
          }}
        />
        <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
          <legend className="bidi-content mb-2 p-0 text-sm font-medium text-primary">
            {draft.kind === 'documents' ? 'Documents asked for' : 'Questions'}
          </legend>
          {draft.items.map((item, index) => (
            <div key={index} className="flex min-w-0 items-end gap-2">
              {draft.kind === 'documents' ? (
                <TextField
                  className="min-w-0 flex-1"
                  label={`${noun} ${count(format, index + 1)}`}
                  value={item}
                  onChange={(text) => {
                    setItem(index, text)
                  }}
                  {...(checked && index === 0 && errors.items !== undefined
                    ? { error: errors.items }
                    : {})}
                />
              ) : (
                <TextAreaField
                  className="min-w-0 flex-1"
                  label={`${noun} ${count(format, index + 1)}`}
                  rows={2}
                  value={item}
                  onChange={(text) => {
                    setItem(index, text)
                  }}
                  {...(checked && index === 0 && errors.items !== undefined
                    ? { error: errors.items }
                    : {})}
                />
              )}
              {draft.items.length > 1 && (
                <div className="mb-1">
                  <CompactIconButton
                    family="neutral"
                    icon={Trash2}
                    label={`Remove ${noun.toLowerCase()} ${count(format, index + 1)}`}
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        items: current.items.filter((_, at) => at !== index),
                      }))
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          <div>
            <Button
              family="neutral"
              emphasis="secondary"
              icon={Plus}
              label={draft.kind === 'documents' ? 'Add a document' : 'Add a question'}
              onClick={() => {
                setDraft((current) => ({ ...current, items: [...current.items, ''] }))
              }}
            />
          </div>
        </fieldset>
        <DateField
          label="Due"
          required
          value={draft.due}
          onChange={(due) => {
            setDraft((current) => ({ ...current, due }))
          }}
          {...(checked && errors.due !== undefined ? { error: errors.due } : {})}
        />
        <TextAreaField
          label="Message"
          description="Shown above the items in the portal."
          rows={4}
          value={draft.message}
          onChange={(message) => {
            setDraft((current) => ({ ...current, message }))
          }}
        />
        <CheckboxField
          label={`Notify ${client.contact ?? 'the client'} by e-mail`}
          description="The e-mail links to the request; it never contains the documents."
          checked={draft.email}
          onChange={(email) => {
            setDraft((current) => ({ ...current, email }))
          }}
        />
      </div>
    </Drawer>
  )
}

// ── 1. The clients overview ───────────────────────────────────────────────────────────────────

type ViewId = 'mine' | 'attention' | 'all'

/** Clients a page. */
const PAGE_SIZE = 25

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'mine', label: 'My clients' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'all', label: 'All clients' },
]

function inView(client: AccountingClient, view: ViewId): boolean {
  if (view === 'mine') return client.accountant === ME
  if (view === 'attention')
    return client.health === 'At risk' || client.health === 'Needs attention'
  return true
}

type DeadlineWindow = 'overdue' | 'tomorrow' | 'week' | 'month'

const DEADLINE_WINDOWS: { value: DeadlineWindow; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'tomorrow', label: 'Due today or tomorrow' },
  { value: 'week', label: 'Due within 7 days' },
  { value: 'month', label: 'Due this month' },
]

/** Whether the client's next open deadline falls in the window (the application's reading). */
function inWindow(client: AccountingClient, window: DeadlineWindow): boolean {
  const next = nextOpenDeadline(client)
  if (next === undefined) return false
  const days = daysBetween(V_TODAY, next.due)
  if (window === 'overdue') return days < 0
  if (window === 'tomorrow') return days >= 0 && days <= 1
  if (window === 'week') return days >= 0 && days <= 7
  return days >= 0 && next.due.startsWith(V_TODAY.slice(0, 7))
}

const FILTERS: FilterDefinition[] = [
  {
    id: 'accountant',
    label: 'Accountant',
    type: 'select',
    options: Object.values(ACCOUNTANTS).map((each) => ({ value: each.id, label: each.name })),
  },
  { id: 'deadline', label: 'Deadline', type: 'select', options: DEADLINE_WINDOWS },
  {
    id: 'problem',
    label: 'Problem',
    type: 'multiSelect',
    options: PROBLEMS.map((problem) => ({ value: problem, label: problem })),
  },
]

function matches(client: AccountingClient, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    !client.name.toLocaleLowerCase('sr-Latn').includes(query) &&
    !client.taxId.includes(query.replace(/^pib\s*/, ''))
  ) {
    return false
  }
  const accountant = filters.accountant
  if (typeof accountant === 'string' && accountant !== '' && client.accountant !== accountant) {
    return false
  }
  const window = filters.deadline
  if (typeof window === 'string' && window !== '' && !inWindow(client, window as DeadlineWindow)) {
    return false
  }
  const problems = filters.problem
  if (Array.isArray(problems) && problems.length > 0) {
    return problems.some((problem) => client.problems.includes(problem as never))
  }
  return true
}

/** The next open deadline: its kind and day; "All submitted" when none is open. */
function NextDeadline({ client }: { client: AccountingClient }) {
  const { format } = useLiro()
  const open = client.deadlines.filter((deadline) => deadline.state !== 'Submitted')
  const next = open[0]
  if (next === undefined) return <span className="bidi-content text-tertiary">All submitted</span>
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-content">{DEADLINE_KINDS[next.kind]}</span>
      <span className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <DueDate value={next.due} warningDays={3} />
        {next.state === 'Prepared' && <span className="bidi-content text-secondary">Prepared</span>}
      </span>
      {open.length > 1 && (
        <span className="bidi-content text-xs text-secondary">
          {`${count(format, open.length - 1)} more open`}
        </span>
      )}
    </span>
  )
}

function useClientColumns(): DataTableColumn<AccountingClient>[] {
  const { format } = useLiro()
  return [
    {
      id: 'client',
      header: 'Client',
      minWidth: 220,
      cell: (client) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content font-medium">{client.name}</span>
          <span className="bidi-content text-xs text-secondary tabular-nums">{`PIB ${client.taxId}`}</span>
        </span>
      ),
    },
    {
      id: 'accountant',
      header: 'Accountant',
      cell: (client) => ACCOUNTANTS[client.accountant].name,
    },
    {
      id: 'deadline',
      header: 'Next deadline',
      minWidth: 200,
      cell: (client) => <NextDeadline client={client} />,
    },
    {
      id: 'missing',
      header: 'Missing documents',
      minWidth: 180,
      cell: (client) =>
        client.missing === 0 ? (
          <span className="bidi-content text-tertiary">None</span>
        ) : (
          <span className="flex flex-col gap-0.5">
            <span className="bidi-content font-medium">
              {`${count(format, client.missing)} ${client.missing === 1 ? 'document' : 'documents'}`}
            </span>
            {client.missingNote !== undefined && (
              <span className="bidi-content text-xs text-secondary">{client.missingNote}</span>
            )}
          </span>
        ),
    },
    {
      id: 'tasks',
      header: 'Open tasks',
      align: 'end',
      numeric: true,
      cell: (client) => <span className="bidi-isolate">{count(format, client.openTasks)}</span>,
    },
    {
      id: 'activity',
      header: 'Last activity',
      minWidth: 200,
      cell: (client) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content tabular-nums">{format.dateTime(client.lastActivity)}</span>
          <span className="bidi-content text-xs text-secondary">{client.lastActivityNote}</span>
        </span>
      ),
    },
    {
      id: 'health',
      header: 'Health',
      minWidth: 200,
      cell: (client) => (
        <span className="flex flex-col items-start gap-1">
          {healthBadge(client)}
          {client.healthReason !== undefined && (
            <span className="bidi-content text-xs text-secondary">{client.healthReason}</span>
          )}
        </span>
      ),
    },
  ]
}

interface OverviewStart {
  view: ViewId
  switcherOpen?: boolean
  /** The client whose "Ask the client" is open. */
  askFor?: string
  askErrors?: boolean
}

export function ClientsOverview({ phone, start }: { phone: boolean; start: OverviewStart }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const columns = useClientColumns()
  const [view, setView] = useState<ViewId>(start.view)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [asking, setAsking] = useState<AccountingClient | null>(
    start.askFor === undefined ? null : (clientById(start.askFor) ?? null),
  )
  // The application's order of urgency; the list never re-sorts it.
  const matching = useMemo(
    () => CLIENTS.filter((client) => inView(client, view) && matches(client, search, filters)),
    [view, search, filters],
  )
  // The application pages the list (keyset, 25 at a time), in its order of urgency.
  const [page, setPage] = useState(0)
  const rows = matching.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const actions = (client: AccountingClient): MenuEntry[] => [
    {
      label: 'Ask the client…',
      icon: MessageSquarePlus,
      onSelect: () => {
        setAsking(client)
      },
    },
    {
      label: 'Month-end checklist',
      icon: ClipboardCheck,
      onSelect: () => {
        navigate(V_ROUTES.close(client.id))
      },
    },
  ]
  return (
    <AccountantShell
      phone={phone}
      tab="clients"
      crumbs={[{ label: FIRM.name }, { label: 'Clients' }]}
      switcherOpen={start.switcherOpen === true}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Clients"
        views={VIEWS.map((each) => ({
          ...each,
          count: CLIENTS.filter((client) => inView(client, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as ViewId)
          setPage(0)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={FILTERS}
            inline={3}
            values={filters}
            onValuesChange={(values) => {
              setFilters(values)
              setPage(0)
            }}
            search={search}
            onSearchChange={(text) => {
              setSearch(text)
              setPage(0)
            }}
            searchPlaceholder="Name or tax number"
          />
        }
      >
        <DataTable
          label="Clients"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(client) => client.id}
          getRowLabel={(client) => client.name}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
            setPage(0)
          }}
          count={matching.length}
          hasPrevious={page > 0}
          hasNext={(page + 1) * PAGE_SIZE < matching.length}
          onPrevious={() => {
            setPage((current) => Math.max(0, current - 1))
          }}
          onNext={() => {
            setPage((current) => current + 1)
          }}
          onRowClick={(client) => {
            navigate(V_ROUTES.close(client.id))
          }}
          rowActions={actions}
          rowLimitMessage={`In order of urgency: at risk first, then the nearest deadline. ${count(format, CLIENTS.length)} clients in all.`}
          mobile={{
            title: (client) => client.name,
            subtitle: (client) => {
              const next = nextOpenDeadline(client)
              return next === undefined ? (
                <span className="bidi-content">All submitted</span>
              ) : (
                <span className="bidi-isolate">
                  {DEADLINE_KINDS[next.kind]} · <DateText value={next.due} />
                </span>
              )
            },
            badge: (client) => healthBadge(client),
            details: ['missing', 'tasks'],
          }}
        />
      </ListPage>
      {asking !== null && (
        <AskClientDrawer
          key={asking.id}
          client={asking}
          open
          onOpenChange={(open) => {
            if (!open) setAsking(null)
          }}
          showErrors={start.askErrors === true}
        />
      )}
    </AccountantShell>
  )
}

// ── 2. The deadlines calendar ─────────────────────────────────────────────────────────────────

/** Every deadline of every client as a calendar event: the kind and the client, the state in words. */
function deadlineEvents(
  clients: readonly AccountingClient[],
  accountant: AccountantId | 'all',
  kind: DeadlineKind | 'all',
  submitted: boolean,
): CalendarEvent[] {
  return clients
    .filter((client) => accountant === 'all' || client.accountant === accountant)
    .flatMap((client) =>
      client.deadlines
        .filter(
          (deadline: ClientDeadline) =>
            (kind === 'all' || deadline.kind === kind) &&
            (submitted || deadline.state !== 'Submitted'),
        )
        .map((deadline) => ({
          id: `${client.id}:${deadline.id}`,
          title: `${DEADLINE_KINDS[deadline.kind]} · ${client.name}`,
          start: deadline.due,
          tone: DEADLINE_TONES[deadline.state],
          description: `${deadline.label} · ${deadline.state}`,
        })),
    )
}

interface DeadlinesStart {
  view?: 'month' | 'agenda'
  openDay?: string
}

export function DeadlinesCalendar({ phone, start }: { phone: boolean; start: DeadlinesStart }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [accountant, setAccountant] = useState<AccountantId | 'all'>(ME)
  const [kind, setKind] = useState<DeadlineKind | 'all'>('all')
  const [submitted, setSubmitted] = useState(false)
  const events = useMemo(
    () => deadlineEvents(CLIENTS, accountant, kind, submitted),
    [accountant, kind, submitted],
  )
  const open = events.filter((event) => !event.description?.endsWith('Submitted')).length
  return (
    <AccountantShell
      phone={phone}
      tab="deadlines"
      crumbs={[{ label: FIRM.name }, { label: 'Deadlines' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader
          title="Deadlines"
          subtitle={`${count(format, open)} open in October across ${count(format, CLIENTS.length)} clients`}
        />
        <div className="flex flex-wrap items-end gap-4">
          <SelectField
            className="w-60 max-w-full"
            label="Accountant"
            options={[
              { value: 'all', label: 'Everyone' },
              ...Object.values(ACCOUNTANTS).map((each) => ({ value: each.id, label: each.name })),
            ]}
            value={accountant}
            onChange={(value) => {
              setAccountant(value as AccountantId | 'all')
            }}
          />
          <SelectField
            className="w-60 max-w-full"
            label="Kind"
            options={[
              { value: 'all', label: 'Every kind' },
              ...(Object.keys(DEADLINE_KINDS) as DeadlineKind[]).map((each) => ({
                value: each,
                label: DEADLINE_KINDS[each],
              })),
            ]}
            value={kind}
            onChange={(value) => {
              setKind(value as DeadlineKind | 'all')
            }}
          />
          <SwitchField
            className="pb-2"
            label="Show submitted"
            checked={submitted}
            onChange={setSubmitted}
          />
        </div>
        <CalendarView
          label="Deadlines"
          events={events}
          layout={phone ? 'phone' : 'desktop'}
          defaultView={start.view ?? (phone ? 'agenda' : 'month')}
          defaultDate={V_TODAY}
          {...(start.openDay === undefined ? {} : { defaultOpenDay: start.openDay })}
          onSelect={(event) => {
            navigate(V_ROUTES.close(event.id.split(':')[0] ?? ''))
          }}
        />
      </Frame>
    </AccountantShell>
  )
}

// ── 3. A client's month-end checklist ─────────────────────────────────────────────────────────

export function MonthClose({ phone, clientId }: { phone: boolean; clientId: string }) {
  const client = clientById(clientId) ?? KVADRAT
  const [requests] = useRequests()
  const [asking, setAsking] = useState(false)
  const mine = requests.filter((request) => request.clientId === client.id)
  const steps: SetupStep[] = closeSteps(client).map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    state: step.state,
    ...(step.doneNote === undefined ? {} : { doneNote: step.doneNote }),
    ...(step.blockedReason === undefined ? {} : { blockedReason: step.blockedReason }),
    ...(step.action === undefined || step.actionLabel === undefined
      ? {}
      : {
          action: {
            label: step.actionLabel,
            onClick: () => {
              if (step.action === 'ask') setAsking(true)
              else notice.info(`${step.actionLabel ?? ''} opens in the client's books.`)
            },
          },
        }),
  }))
  return (
    <AccountantShell
      phone={phone}
      tab="clients"
      company={client.id}
      crumbs={[{ label: 'Clients', href: `#${V_ROUTES.clients}` }, { label: client.name }]}
    >
      <Frame phone={phone}>
        <PageHeader
          title={`${client.name}: September 2026`}
          back={{ href: `#${V_ROUTES.clients}`, label: 'Clients' }}
          status={healthBadge(client)}
          subtitle={
            <span className="bidi-content">{`PIB ${client.taxId} · ${ACCOUNTANTS[client.accountant].name}`}</span>
          }
          actions={
            <Button
              family="neutral"
              emphasis="secondary"
              icon={MessageSquarePlus}
              label="Ask the client…"
              onClick={() => {
                setAsking(true)
              }}
            />
          }
        />
        <div
          className={
            phone ? 'flex flex-col gap-4' : 'grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6'
          }
        >
          <SetupChecklist
            title="Month-end checklist"
            description="Close September 2026 before the VAT return is filed."
            steps={steps}
          />
          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard title="Deadlines" headingLevel={2}>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {client.deadlines.map((deadline) => (
                  <li key={deadline.id} className="flex flex-col gap-1">
                    <span className="bidi-content text-sm text-primary">{deadline.label}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs">
                      <DueDate value={deadline.due} settled={deadline.state === 'Submitted'} />
                      <StatusBadge label={deadline.state} tone={DEADLINE_TONES[deadline.state]} />
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title="Requests to the client" headingLevel={2}>
              {mine.length === 0 ? (
                <p className="bidi-content m-0 text-sm text-secondary">No requests yet.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {mine.map((request) => (
                    <li key={request.id} className="flex flex-col gap-1">
                      <span className="bidi-content text-sm text-primary">{request.title}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-secondary">
                        <StatusBadge label={request.status} tone={REQUEST_TONES[request.status]} />
                        <span className="bidi-isolate">
                          Due <DateText value={request.due} />
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="Client" headingLevel={2}>
              <KeyValueList
                layout="stacked"
                items={[
                  { key: 'contact', label: 'Contact', value: client.contact ?? '—' },
                  {
                    key: 'missing',
                    label: 'Missing documents',
                    value: client.missingNote ?? 'None',
                  },
                  {
                    key: 'activity',
                    label: 'Last activity',
                    value: client.lastActivityNote,
                  },
                ]}
              />
            </SectionCard>
          </div>
        </div>
      </Frame>
      {asking && (
        <AskClientDrawer
          client={client}
          open
          onOpenChange={(open) => {
            if (!open) setAsking(false)
          }}
        />
      )}
    </AccountantShell>
  )
}

// ── 4. The client portal ──────────────────────────────────────────────────────────────────────

type PortalKey = 'requests' | 'documents'

const PORTAL_MENU = (navigate: (path: string) => void): MenuEntry[] => [
  { label: 'My details', icon: UserRound, onSelect: () => undefined },
  { label: 'Language: English', icon: Languages, onSelect: () => undefined },
  { type: 'separator' },
  {
    label: 'Sign out',
    icon: LogOut,
    onSelect: () => {
      navigate(ROUTES.signIn)
    },
  },
]

/** Kvadrat Gradnja's portal at its accounting firm: Milica Petrović signed in. */
function ClientPortal({
  phone,
  current,
  children,
}: {
  phone: boolean
  current: PortalKey
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const [requests] = useRequests()
  const open = requests.filter(
    (request) => request.clientId === KVADRAT.id && request.status === 'Open',
  ).length
  const sections: PortalSection[] = [
    {
      key: 'requests',
      label: 'Requests',
      href: `#${V_ROUTES.portal}`,
      icon: Inbox,
      ...(open > 0 ? { note: `${String(open)} open` } : {}),
    },
    { key: 'documents', label: 'Documents', href: `#${V_ROUTES.documents}`, icon: FileText },
  ]
  return (
    <Tenant today={V_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{ brandName: 'Liro', productName: 'Client portal', href: `#${V_ROUTES.portal}` }}
        participant={{ name: PORTAL_PERSON.name, detail: PORTAL_PERSON.company }}
        menu={PORTAL_MENU(navigate)}
        sections={sections.map((section) =>
          section.key === current ? { ...section, current: true } : section,
        )}
        footer={`${FIRM.name} · ${FIRM.city} · Illustrative data`}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

function PortalPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto box-border flex w-full max-w-4xl min-w-0 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {children}
    </div>
  )
}

function requestBadge(request: ClientRequest) {
  return <StatusBadge label={request.status} tone={REQUEST_TONES[request.status]} />
}

function useRequestColumns(): DataTableColumn<ClientRequest>[] {
  const { format } = useLiro()
  return [
    {
      id: 'title',
      header: 'Request',
      minWidth: 240,
      cell: (request) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content font-medium">{request.title}</span>
          <span className="bidi-content text-xs text-secondary">{`${request.id} · ${ACCOUNTANTS[request.from].name}`}</span>
        </span>
      ),
    },
    {
      id: 'sent',
      header: 'Sent',
      cell: (request) => (
        <span className="bidi-content tabular-nums">{format.dateTime(request.sentAt)}</span>
      ),
    },
    {
      id: 'due',
      header: 'Due',
      minWidth: 160,
      cell: (request) => <DueDate value={request.due} settled={request.status !== 'Open'} />,
    },
    {
      id: 'given',
      header: 'Given',
      cell: (request) => (
        <span className="bidi-content">{`${count(format, itemsGiven(request))} of ${count(format, request.items.length)}`}</span>
      ),
    },
    { id: 'status', header: 'Status', cell: (request) => requestBadge(request) },
  ]
}

export function PortalRequests({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [requests] = useRequests()
  const columns = useRequestColumns()
  const ours = requests.filter((request) => request.clientId === KVADRAT.id)
  const open = ours.filter((request) => request.status === 'Open')
  const earlier = ours.filter((request) => request.status !== 'Open')
  const table = (label: string, rows: ClientRequest[]) => (
    <DataTable
      label={label}
      layout={phone ? 'cards' : 'table'}
      columns={columns}
      rows={rows}
      getRowId={(request) => request.id}
      getRowLabel={(request) => request.title}
      onRowClick={(request) => {
        navigate(V_ROUTES.request(request.id))
      }}
      mobile={{
        title: (request) => request.title,
        subtitle: (request) => (
          <span className="bidi-isolate">
            Due <DateText value={request.due} />
          </span>
        ),
        badge: (request) => requestBadge(request),
        details: ['given'],
      }}
    />
  )
  return (
    <ClientPortal phone={phone} current="requests">
      <PortalPage>
        <PageHeader
          title="Requests from your accountant"
          subtitle={`${FIRM.name} · ${ACCOUNTANTS.snezana.name}`}
        />
        <SectionCard title="Open" headingLevel={2} flush={!phone}>
          {open.length === 0 ? (
            <p className="bidi-content m-0 text-sm text-secondary">
              Nothing to do: every request is answered.
            </p>
          ) : (
            table('Open requests', open)
          )}
        </SectionCard>
        <SectionCard title="Earlier" headingLevel={2} flush={!phone}>
          {table('Earlier requests', earlier)}
        </SectionCard>
      </PortalPage>
    </ClientPortal>
  )
}

/** A file's size as a person reads it ("214 KB", "1,2 MB"), the number through `format`. */
function sizeText(format: ReturnType<typeof useLiro>['format'], bytes: number): string {
  if (bytes < 1024 * 1024)
    return `${format.number(String(Math.max(1, Math.round(bytes / 1024))))} KB`
  return `${format.number((bytes / (1024 * 1024)).toFixed(1))} MB`
}

interface RequestStart {
  /** The first document already uploaded. */
  uploaded?: boolean
  /** The request answered and sent. */
  sent?: boolean
}

export function PortalRequest({
  phone,
  id,
  start = {},
}: {
  phone: boolean
  id: string
  start?: RequestStart
}) {
  const { format } = useLiro()
  const [requests, setRequests] = useRequests()
  const stored = requests.find((each) => each.id === id) ?? REQUESTS[0]
  if (stored === undefined) throw new Error('No request')
  // The route's starting state (a picture without clicks): one upload, or answers sent.
  const [request, setRequest] = useState<ClientRequest>(() => {
    if (start.uploaded === true) {
      return {
        ...stored,
        items: stored.items.map((item, index) =>
          index === 0
            ? { ...item, file: { name: 'beton-mix-2026-1187.pdf', sizeText: '238 KB' } }
            : item,
        ),
      }
    }
    if (start.sent === true) {
      return {
        ...stored,
        status: 'Answered',
        answeredAt: V_NOW,
        items: stored.items.map((item, index) => ({
          ...item,
          answer:
            index === 0
              ? 'Invoice F-2026-0402 for the Liman 4 foundations.'
              : 'Yes: a 5% discount for paying early, agreed by e-mail on 25.09.',
        })),
      }
    }
    return stored
  })
  const [error, setError] = useState(false)
  const editable = request.status === 'Open'
  const setItem = (itemId: string, change: Partial<RequestItem>) => {
    setError(false)
    setRequest((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? { ...item, ...change } : item)),
    }))
  }
  const send = () => {
    if (itemsGiven(request) === 0) {
      setError(true)
      return
    }
    const answered: ClientRequest = { ...request, status: 'Answered', answeredAt: V_NOW }
    setRequest(answered)
    setRequests((list) => list.map((each) => (each.id === answered.id ? answered : each)))
    notice.success(`Sent to ${ACCOUNTANTS[request.from].name}.`)
  }
  const accountant = ACCOUNTANTS[request.from].name
  return (
    <ClientPortal phone={phone} current="requests">
      <PortalPage>
        <PageHeader
          title={request.title}
          back={{ href: `#${V_ROUTES.portal}`, label: 'Requests' }}
          status={requestBadge(request)}
          subtitle={
            <span className="bidi-isolate">
              {`From ${accountant} · sent ${format.dateTime(request.sentAt)} · due `}
              <DateText value={request.due} />
            </span>
          }
        />
        {request.message !== '' && (
          <SectionCard title={`Message from ${accountant}`} headingLevel={2}>
            <p className="m-0 text-sm whitespace-pre-line text-primary" dir="auto">
              {request.message}
            </p>
          </SectionCard>
        )}
        <SectionCard
          title={request.kind === 'documents' ? 'Documents asked for' : 'Questions'}
          description={`${count(format, itemsGiven(request))} of ${count(format, request.items.length)} given`}
          headingLevel={2}
        >
          <div className="flex flex-col gap-6">
            {request.items.map((item) =>
              request.kind === 'documents' ? (
                <div key={item.id} className="flex flex-col gap-2">
                  {item.file === undefined ? (
                    editable ? (
                      <FileDropzone
                        label={item.text}
                        accept={['.pdf', '.xml', '.jpg', '.jpeg', '.png']}
                        acceptText="PDF, XML, JPG or PNG"
                        maxSize={10 * 1024 * 1024}
                        maxSizeText="up to 10 MB"
                        layout={phone ? 'phone' : 'desktop'}
                        camera
                        onFiles={(files) => {
                          const file = files[0]
                          if (file !== undefined) {
                            setItem(item.id, {
                              file: { name: file.name, sizeText: sizeText(format, file.size) },
                            })
                          }
                        }}
                      />
                    ) : (
                      <p className="bidi-content m-0 text-sm text-secondary">{`${item.text}: not sent`}</p>
                    )
                  ) : (
                    <AttachmentList
                      label={item.text}
                      files={[
                        {
                          id: `${item.id}-file`,
                          name: item.file.name,
                          sizeText: item.file.sizeText,
                          state: 'available',
                          detail: <span className="bidi-content">{item.text}</span>,
                        },
                      ]}
                      onDownload={() => undefined}
                      canRemove={() => editable}
                      onRemove={() => {
                        setRequest((current) => ({
                          ...current,
                          items: current.items.map((each) => {
                            if (each.id !== item.id) return each
                            return { id: each.id, text: each.text }
                          }),
                        }))
                      }}
                    />
                  )}
                </div>
              ) : editable ? (
                <TextAreaField
                  key={item.id}
                  label={item.text}
                  rows={3}
                  value={item.answer ?? ''}
                  onChange={(answer) => {
                    setItem(item.id, { answer })
                  }}
                />
              ) : (
                <div key={item.id} className="flex flex-col gap-1">
                  <p className="bidi-content m-0 text-sm font-medium text-primary">{item.text}</p>
                  <p className="m-0 text-sm text-secondary" dir="auto">
                    {item.answer ?? 'Not answered'}
                  </p>
                </div>
              ),
            )}
          </div>
        </SectionCard>
        {error && (
          <Alert tone="danger">
            {request.kind === 'documents'
              ? 'Upload at least one document before you send.'
              : 'Answer at least one question before you send.'}
          </Alert>
        )}
        {editable ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button family="primary" icon={Send} label={`Send to ${accountant}`} onClick={send} />
            <span className="bidi-content text-xs text-secondary">
              What you leave out stays on the request.
            </span>
          </div>
        ) : (
          request.answeredAt !== undefined && (
            <p className="bidi-content m-0 text-sm text-secondary">
              {`Sent to ${accountant} on ${format.dateTime(request.answeredAt)}.`}
            </p>
          )
        )}
      </PortalPage>
    </ClientPortal>
  )
}

export function PortalDocuments({ phone }: { phone: boolean }) {
  const [requests] = useRequests()
  const sent = requests
    .filter((request) => request.clientId === KVADRAT.id && request.status !== 'Open')
    .flatMap((request) =>
      request.items.flatMap((item) =>
        item.file === undefined ? [] : [{ id: `${request.id}-${item.id}`, ...item.file }],
      ),
    )
  const files = [
    ...sent.filter((file) => !SHARED_DOCUMENTS.some((each) => each.name === file.name)),
    ...SHARED_DOCUMENTS,
  ]
  return (
    <ClientPortal phone={phone} current="documents">
      <PortalPage>
        <PageHeader title="Documents" subtitle={`What you sent to ${FIRM.name}`} />
        <AttachmentList
          label="Documents sent"
          inCard
          files={files.map((file) => ({
            id: file.id,
            name: file.name,
            sizeText: file.sizeText,
            state: 'available' as const,
          }))}
          onDownload={() => undefined}
        />
      </PortalPage>
    </ClientPortal>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_V_ROUTES: ExampleRoute[] = [
  {
    path: V_ROUTES.clients,
    render: (phone) => <ClientsOverview phone={phone} start={{ view: 'mine' }} />,
  },
  {
    path: V_ROUTES.allClients,
    render: (phone) => <ClientsOverview phone={phone} start={{ view: 'all' }} />,
  },
  {
    path: V_ROUTES.attention,
    render: (phone) => <ClientsOverview phone={phone} start={{ view: 'attention' }} />,
  },
  {
    path: V_ROUTES.switcher,
    render: (phone) => (
      <ClientsOverview phone={phone} start={{ view: 'mine', switcherOpen: true }} />
    ),
  },
  {
    path: V_ROUTES.ask,
    render: (phone) => (
      <ClientsOverview phone={phone} start={{ view: 'mine', askFor: 'kvadrat' }} />
    ),
  },
  {
    path: V_ROUTES.askErrors,
    render: (phone) => (
      <ClientsOverview phone={phone} start={{ view: 'mine', askFor: 'kvadrat', askErrors: true }} />
    ),
  },
  { path: V_ROUTES.deadlines, render: (phone) => <DeadlinesCalendar phone={phone} start={{}} /> },
  {
    path: V_ROUTES.deadlinesAgenda,
    render: (phone) => <DeadlinesCalendar phone={phone} start={{ view: 'agenda' }} />,
  },
  {
    path: V_ROUTES.deadlinesDay,
    render: (phone) => <DeadlinesCalendar phone={phone} start={{ openDay: '2026-10-15' }} />,
  },
  ...CLIENTS.map((client) => ({
    path: V_ROUTES.close(client.id),
    render: (phone: boolean) => <MonthClose phone={phone} clientId={client.id} />,
  })),
  { path: V_ROUTES.portal, render: (phone) => <PortalRequests phone={phone} /> },
  {
    path: V_ROUTES.requestUploaded,
    render: (phone) => <PortalRequest phone={phone} id="REQ-2026-118" start={{ uploaded: true }} />,
  },
  {
    path: V_ROUTES.requestSent,
    render: (phone) => <PortalRequest phone={phone} id="REQ-2026-119" start={{ sent: true }} />,
  },
  ...REQUESTS.map((request) => ({
    path: V_ROUTES.request(request.id),
    render: (phone: boolean) => <PortalRequest phone={phone} id={request.id} />,
  })),
  // Requests sent from "Ask the client" in this session: any id under the portal's requests.
  ...Array.from({ length: 5 }, (_, index) => `REQ-2026-${String(120 + index)}`).map((id) => ({
    path: V_ROUTES.request(id),
    render: (phone: boolean) => <PortalRequest phone={phone} id={id} />,
  })),
  { path: V_ROUTES.documents, render: (phone) => <PortalDocuments phone={phone} /> },
]

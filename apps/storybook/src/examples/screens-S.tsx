import { ListChecks, PanelRight, UserPlus } from 'lucide-react'
import { useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ActivityList,
  AttachmentList,
  Button,
  DashboardPage,
  DataTable,
  DetailPage,
  Dialog,
  Drawer,
  durationText,
  FilterBar,
  KeyValueList,
  ListPage,
  LookupDialog,
  MessageList,
  RelatedDocuments,
  SectionCard,
  SelectField,
  SidePanels,
  SlaTimer,
  slaReading,
  slaUrgency,
  StatusBadge,
  toneFor,
  Toaster,
  notice,
  useLiro,
  type Attachment,
  type DataTableColumn,
  type DataTableFilters,
  type DataTableSort,
  type FilterDefinition,
  type ModuleTab,
  type SidePanel,
  type ThreadMessage,
} from '@veljaos/ui'
import { BarChart, DonutChart, LineChart } from '../../../../packages/ui/src/charts'
import {
  linkNodes,
  ReplyComposer,
  RichText,
  type ComposedReply,
  type ComposerLink,
  type ComposerMode,
  type RichTextFieldHandle,
} from '../../../../packages/ui/src/rich-text'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  ACTIVITY_4821,
  AGENTS,
  ARTICLES,
  DRAFT_4821,
  FIRST_RESPONSE_MINUTES,
  inView,
  isDone,
  isOverdue,
  MEDIANS,
  ME,
  NOW,
  OPENED_RESOLVED,
  PRIORITIES,
  RATINGS,
  REPLY_FIELDS,
  S_ROUTES,
  SAVED,
  SUPPORT_TODAY,
  TEAM_MENTIONS,
  TEAMS,
  threadOf,
  ticketOf,
  TICKET_STATUSES,
  TICKET_TONES,
  TICKET_TYPES,
  TICKETS,
  VIEWS,
  WEEK,
  type AgentId,
  type Article,
  type TeamId,
  type Ticket,
  type TicketActivity,
  type TicketMessage,
  type TicketStatus,
  type ViewId,
} from './data-S'

/*
 * Group S's example screens (P5.30 a–c, Helpdesk, the agent's side): Liro support on 14 October
 * 2026 at 09:40, seen by Nikola Ilić of the E-invoicing team.
 * - The inbox (ListPage): saved views My open, Unassigned, Overdue and All with their counts; a
 *   FilterBar; the tickets with subject, customer, status, priority, type, team, assignee and the
 *   two service levels (SlaTimer: first response and resolution, overdue in the danger tone and
 *   in words); rows checked for "Assign…" and "Change status…" (BulkActionBar); the keyboard
 *   moves between rows (ArrowDown / ArrowUp) and Enter opens the ticket.
 * - The ticket page (DetailPage): the conversation (MessageList, internal notes marked
 *   "Internal") and the ReplyComposer under it (reply or internal note, saved replies, files,
 *   "@" in notes, "Insert article" over the knowledge base in a LookupDialog); the side panels —
 *   properties changed in place, the service levels, the contact and company with their other
 *   tickets, the activity log. Phones: the conversation full width, the panels in a sheet
 *   ("Details"), the composer under the conversation.
 * - The dashboard (DashboardPage): open, unassigned, overdue, first-response and resolution time,
 *   satisfaction, and their charts.
 * Every rule (views, overdue, what a reply changes) is the application's, played in data-S.ts and
 * here; the components only show and report. The tickets live above the screens
 * (useExampleState), so a change on one screen is seen on the others.
 */

export { S_ROUTES }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

/** The ticket the examples feature (shared with the portal's examples). */
const FEATURED_TICKET = '4821'

const NIKOLA: ExampleAccount = {
  name: AGENTS[ME].name,
  email: AGENTS[ME].email,
  companies: [{ id: 'liro-support', name: 'Liro support', description: 'Help desk' }],
  links: [
    { label: 'Tickets', path: S_ROUTES.inbox },
    { label: 'Support overview', path: S_ROUTES.dashboard },
    {
      label: `Ticket #${FEATURED_TICKET}, SEF invoice rejected`,
      path: S_ROUTES.ticket(FEATURED_TICKET),
    },
  ],
}

function supportTabs(current: 'tickets' | 'dashboard'): ModuleTab[] {
  return [
    {
      key: 'tickets',
      label: 'Tickets',
      href: `#${S_ROUTES.inbox}`,
      current: current === 'tickets',
    },
    {
      key: 'dashboard',
      label: 'Overview',
      href: `#${S_ROUTES.dashboard}`,
      current: current === 'dashboard',
    },
  ]
}

/** Liro support's shell around every screen: Nikola signed in, the support module's tabs. */
function SupportShell({
  phone,
  tab,
  crumbs,
  children,
}: {
  phone: boolean
  tab: 'tickets' | 'dashboard'
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={SUPPORT_TODAY}>
      <Shell
        phone={phone}
        account={NIKOLA}
        company="liro-support"
        crumbs={crumbs}
        tabs={supportTabs(tab)}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function ticketBadge(status: TicketStatus) {
  return <StatusBadge label={status} tone={toneFor(status, TICKET_TONES)} />
}

/** The tickets as the application keeps them, above the screens. */
function useTickets() {
  return useExampleState<Ticket[]>('support.tickets', () => TICKETS)
}

/** Both service levels of a ticket: the first response and the resolution. */
function TicketSla({ ticket, showDue = false }: { ticket: Ticket; showDue?: boolean }) {
  return (
    <span className="flex flex-col gap-1">
      <SlaTimer
        label="First response"
        due={ticket.firstResponseDue}
        now={NOW}
        warnWithin={30}
        showDue={showDue}
        {...(ticket.firstResponseAt === undefined ? {} : { completedAt: ticket.firstResponseAt })}
      />
      <SlaTimer
        label="Resolution"
        due={ticket.resolutionDue}
        now={NOW}
        warnWithin={60}
        showDue={showDue}
        paused={ticket.status === 'Paused'}
        {...(ticket.resolvedAt === undefined ? {} : { completedAt: ticket.resolvedAt })}
      />
    </span>
  )
}

/** How urgent a ticket's service level is (the application's order for "SLA"). */
function urgency(ticket: Ticket): number {
  const first =
    ticket.firstResponseAt === undefined
      ? slaUrgency(slaReading(ticket.firstResponseDue, NOW))
      : Number.MAX_SAFE_INTEGER
  const resolution = slaUrgency(
    slaReading(ticket.resolutionDue, NOW, {
      paused: ticket.status === 'Paused',
      ...(ticket.resolvedAt === undefined ? {} : { completedAt: ticket.resolvedAt }),
    }),
  )
  return Math.min(first, resolution)
}

const PRIORITY_RANK: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 }

const AGENT_OPTIONS = Object.values(AGENTS).map((agent) => ({
  value: agent.id,
  label: agent.name,
}))
const STATUS_OPTIONS = TICKET_STATUSES.map((status) => ({ value: status, label: status }))
const PRIORITY_OPTIONS = PRIORITIES.map((priority) => ({ value: priority, label: priority }))
const TYPE_OPTIONS = TICKET_TYPES.map((type) => ({ value: type, label: type }))
const TEAM_OPTIONS = (Object.keys(TEAMS) as TeamId[]).map((team) => ({
  value: team,
  label: TEAMS[team],
}))

const FILTERS: FilterDefinition[] = [
  { id: 'status', label: 'Status', type: 'multiSelect', options: STATUS_OPTIONS },
  { id: 'priority', label: 'Priority', type: 'multiSelect', options: PRIORITY_OPTIONS },
  { id: 'team', label: 'Team', type: 'select', options: TEAM_OPTIONS },
  { id: 'type', label: 'Type', type: 'select', options: TYPE_OPTIONS },
]

function matches(ticket: Ticket, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![ticket.number, ticket.subject, ticket.customer, ticket.contact].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query.replace(/^#/, '')),
    )
  ) {
    return false
  }
  const listed = (id: string, value: string) => {
    const chosen = filters[id]
    if (Array.isArray(chosen)) return chosen.length === 0 || chosen.includes(value)
    return typeof chosen !== 'string' || chosen === '' || chosen === value
  }
  return (
    listed('status', ticket.status) &&
    listed('priority', ticket.priority) &&
    listed('team', ticket.team) &&
    listed('type', ticket.type)
  )
}

function sortTickets(tickets: readonly Ticket[], sort: DataTableSort): Ticket[] {
  const sign = sort?.direction === 'desc' ? -1 : 1
  const by = (ticket: Ticket) =>
    sort?.column === 'priority' ? (PRIORITY_RANK[ticket.priority] ?? 9) : urgency(ticket)
  return [...tickets].sort((a, b) => sign * (by(a) - by(b)) || Number(b.number) - Number(a.number))
}

// ── a) The inbox ──────────────────────────────────────────────────────────────────────────────

const COLUMNS: DataTableColumn<Ticket>[] = [
  {
    id: 'subject',
    header: 'Subject',
    minWidth: 240,
    cell: (ticket) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{ticket.subject}</span>
        <span className="bidi-content text-xs text-secondary tabular-nums">#{ticket.number}</span>
      </span>
    ),
  },
  {
    id: 'customer',
    header: 'Customer',
    minWidth: 180,
    cell: (ticket) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{ticket.customer}</span>
        <span className="bidi-content text-xs text-secondary">{ticket.contact}</span>
      </span>
    ),
  },
  { id: 'status', header: 'Status', cell: (ticket) => ticketBadge(ticket.status) },
  {
    id: 'priority',
    header: 'Priority',
    sortable: true,
    cell: (ticket) => (
      <span className={ticket.priority === 'Urgent' ? 'font-semibold' : undefined}>
        {ticket.priority}
      </span>
    ),
  },
  { id: 'type', header: 'Type', cell: (ticket) => ticket.type },
  { id: 'team', header: 'Team', cell: (ticket) => TEAMS[ticket.team] },
  {
    id: 'assignee',
    header: 'Assignee',
    cell: (ticket) =>
      ticket.assignee === null ? (
        <span className="text-tertiary">Unassigned</span>
      ) : (
        AGENTS[ticket.assignee].name
      ),
  },
  {
    id: 'sla',
    header: 'SLA',
    label: 'Service level',
    sortable: true,
    minWidth: 240,
    cell: (ticket) => <TicketSla ticket={ticket} />,
  },
]

/** The inbox's starting state from its route: the view, a selection, the assign dialog. */
interface InboxStart {
  view: ViewId
  selected?: number
  assignOpen?: boolean
}

export function SupportInbox({ phone, start }: { phone: boolean; start: InboxStart }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [tickets, setTickets] = useTickets()
  const [view, setView] = useState<ViewId>(start.view)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [sort, setSort] = useState<DataTableSort>({ column: 'sla', direction: 'asc' })

  const rows = useMemo(
    () =>
      sortTickets(
        tickets.filter((ticket) => inView(ticket, view) && matches(ticket, search, filters)),
        sort,
      ),
    [tickets, view, search, filters, sort],
  )
  const [selection, setSelection] = useState<string[]>(() =>
    rows.slice(0, start.selected ?? 0).map((ticket) => ticket.number),
  )
  const [asking, setAsking] = useState<'assign' | 'status' | null>(
    start.assignOpen === true ? 'assign' : null,
  )
  const [assignee, setAssignee] = useState<string>('ana')
  const [status, setStatus] = useState<string>('Resolved')

  const count = selection.length
  const countText = format.number(String(count))
  const noun = count === 1 ? 'ticket' : 'tickets'
  const apply = () => {
    setTickets((list) =>
      list.map((ticket) => {
        if (!selection.includes(ticket.number)) return ticket
        if (asking === 'assign') {
          const agent = AGENTS[assignee as AgentId]
          return { ...ticket, assignee: agent.id, team: agent.team }
        }
        const next = status as TicketStatus
        return {
          ...ticket,
          status: next,
          ...(next === 'Resolved' && ticket.resolvedAt === undefined ? { resolvedAt: NOW } : {}),
        }
      }),
    )
    notice.success(
      asking === 'assign'
        ? `${countText} ${noun} assigned to ${AGENTS[assignee as AgentId].name}.`
        : `${countText} ${noun} set to ${status}.`,
    )
    setSelection([])
    setAsking(null)
  }

  return (
    <SupportShell phone={phone} tab="tickets" crumbs={[{ label: 'Support' }, { label: 'Tickets' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Tickets"
        views={VIEWS.map((each) => ({
          ...each,
          count: tickets.filter((ticket) => inView(ticket, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as ViewId)
          setSelection([])
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Subject, number, customer or contact"
            sort={sort}
            sortColumns={[
              { id: 'sla', label: 'Service level' },
              { id: 'priority', label: 'Priority' },
            ]}
            onSortChange={setSort}
          />
        }
      >
        <DataTable
          label="Tickets"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={COLUMNS}
          rows={rows}
          getRowId={(ticket) => ticket.number}
          getRowLabel={(ticket) => `#${ticket.number} ${ticket.subject}`}
          sort={sort}
          onSortChange={setSort}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(ticket) => {
            navigate(S_ROUTES.ticket(ticket.number))
          }}
          selection={selection}
          onSelectionChange={setSelection}
          onSelectAll={() => {
            setSelection(rows.map((ticket) => ticket.number))
          }}
          bulkActions={[
            {
              key: 'status',
              family: 'neutral',
              icon: ListChecks,
              label: 'Change status…',
              onClick: () => {
                setAsking('status')
              },
            },
            {
              key: 'assign',
              family: 'neutral',
              icon: UserPlus,
              label: 'Assign…',
              onClick: () => {
                setAsking('assign')
              },
            },
          ]}
          mobile={{
            title: (ticket) => ticket.subject,
            subtitle: (ticket) => (
              <span className="bidi-isolate">
                #{ticket.number} · {ticket.customer}
              </span>
            ),
            badge: (ticket) => ticketBadge(ticket.status),
            details: ['sla', 'assignee'],
          }}
        />
      </ListPage>
      <Dialog
        open={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null)
        }}
        title={
          asking === 'assign'
            ? `Assign ${countText} ${noun}?`
            : `Change the status of ${countText} ${noun}?`
        }
        description={
          asking === 'assign'
            ? 'They move to the agent’s team as well.'
            : 'The customers see the new status in the portal.'
        }
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setAsking(null)
              }}
            />
            <Button
              intent="confirm"
              label={asking === 'assign' ? 'Assign' : 'Change status'}
              onClick={apply}
            />
          </>
        }
      >
        {asking === 'assign' ? (
          <SelectField
            label="Agent"
            options={AGENT_OPTIONS}
            value={assignee}
            onChange={setAssignee}
          />
        ) : (
          <SelectField
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        )}
      </Dialog>
    </SupportShell>
  )
}

// ── b) The ticket page ────────────────────────────────────────────────────────────────────────

/** The ticket page's starting state from its route. */
interface TicketStart {
  compose?: ComposerMode
  articleOpen?: boolean
  detailsOpen?: boolean
}

/** The ticket of a route; every route is made from TICKETS, so it is there. */
function requireTicket(tickets: readonly Ticket[], number: string): Ticket {
  const ticket = ticketOf(tickets, number) ?? ticketOf(TICKETS, number)
  if (ticket === undefined) throw new Error(`No ticket #${number}`)
  return ticket
}

function authorOf(message: TicketMessage, ticket: Ticket) {
  return message.author === 'customer'
    ? { id: 'customer', name: ticket.contact }
    : { id: message.author, name: AGENTS[message.author].name }
}

const ARTICLE_COLUMNS: DataTableColumn<Article>[] = [
  { id: 'title', header: 'Article', minWidth: 240, cell: (article) => article.title },
  { id: 'category', header: 'Category', cell: (article) => article.category },
]

export function SupportTicket({
  phone,
  number,
  start = {},
}: {
  phone: boolean
  number: string
  start?: TicketStart
}) {
  const { format } = useLiro()
  const [tickets, setTickets] = useTickets()
  const ticket = requireTicket(tickets, number)
  const [messages, setMessages] = useExampleState<TicketMessage[]>(`support.thread.${number}`, () =>
    threadOf(ticket),
  )
  const [sent, setSent] = useExampleState<Record<string, ComposedReply['value']>>(
    `support.sent.${number}`,
    () => ({}),
  )
  const [activity, setActivity] = useExampleState<TicketActivity[]>(
    `support.activity.${number}`,
    () =>
      number === '4821'
        ? ACTIVITY_4821
        : [
            {
              key: 'a1',
              author: 'Liro support',
              at: ticket.opened,
              text: 'Created from an e-mail',
            },
          ],
  )
  const [files, setFiles] = useState<Attachment[]>([])
  const [panels, setPanels] = useState<string[]>(['properties', 'sla', 'contact', 'other'])
  const [details, setDetails] = useState(start.detailsOpen === true)
  const [articleOpen, setArticleOpen] = useState(start.articleOpen === true)
  const [articleQuery, setArticleQuery] = useState('')
  const composer = useRef<RichTextFieldHandle | null>(null)
  const pending = useRef<((link: ComposerLink | null) => void) | null>(null)

  const log = (text: string) => {
    setActivity((list) => [
      ...list,
      { key: `a${String(list.length + 1)}`, author: AGENTS[ME].name, at: NOW, text },
    ])
  }
  const change = (patch: Partial<Ticket>, text: string) => {
    setTickets((list) =>
      list.map((each) => (each.number === ticket.number ? { ...each, ...patch } : each)),
    )
    log(text)
  }

  const send = ({ mode, value }: ComposedReply) => {
    const id = `new-${String(messages.length + 1)}`
    setSent((map) => ({ ...map, [id]: value }))
    setMessages((list) => [
      ...list,
      {
        id,
        author: ME,
        at: NOW,
        text: '',
        ...(mode === 'note' ? { internal: true } : {}),
        ...(files.length === 0
          ? {}
          : { files: files.map((file) => ({ name: file.name, size: file.sizeText ?? '' })) }),
      },
    ])
    setFiles([])
    if (mode === 'note') {
      log('Added an internal note')
      return
    }
    // The application's rule: a reply answers the first response and waits for the customer.
    setTickets((list) =>
      list.map((each) =>
        each.number === ticket.number
          ? {
              ...each,
              status: 'Replied',
              updated: NOW,
              ...(each.firstResponseAt === undefined ? { firstResponseAt: NOW } : {}),
            }
          : each,
      ),
    )
    log(`Replied to ${ticket.contact}`)
    notice.success(`Reply sent to ${ticket.contact}.`)
  }

  const insertArticle = useCallback(
    () =>
      new Promise<ComposerLink | null>((resolve) => {
        pending.current = resolve
        setArticleQuery('')
        setArticleOpen(true)
      }),
    [],
  )
  const closeArticles = (link: ComposerLink | null) => {
    const resolve = pending.current
    pending.current = null
    if (resolve !== null) resolve(link)
    else if (link !== null) {
      // Opened from its route: insert through the composer's handle.
      const nodes = linkNodes(link)
      if (nodes !== null) composer.current?.insert(nodes)
    }
    setArticleOpen(false)
  }

  const thread: ThreadMessage[] = messages.map((message) => {
    const value = sent[message.id]
    return {
      id: message.id,
      author: authorOf(message, ticket),
      own: message.author === ME,
      at: message.at,
      ...(message.internal === true ? { internal: true } : {}),
      ...(value === undefined
        ? { text: message.text, mentions: message.mentions ?? [] }
        : { content: <RichText value={value.json} mergeFields={REPLY_FIELDS} /> }),
      ...(message.files === undefined
        ? {}
        : {
            extra: (
              <AttachmentList
                label="Attachments"
                files={message.files.map((file, index) => ({
                  id: `${message.id}-${String(index)}`,
                  name: file.name,
                  sizeText: file.size,
                  state: 'available' as const,
                }))}
              />
            ),
          }),
    }
  })

  const others = tickets.filter(
    (each) => each.customer === ticket.customer && each.number !== ticket.number,
  )
  const sidePanels: SidePanel[] = [
    {
      key: 'properties',
      title: 'Properties',
      content: (
        <div className="flex flex-col gap-3">
          <SelectField
            label="Status"
            options={STATUS_OPTIONS}
            value={ticket.status}
            onChange={(next) => {
              if (next === '' || next === ticket.status) return
              change(
                {
                  status: next as TicketStatus,
                  ...(next === 'Resolved' && ticket.resolvedAt === undefined
                    ? { resolvedAt: NOW }
                    : {}),
                },
                `Status: ${ticket.status} → ${next}`,
              )
            }}
          />
          <SelectField
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={ticket.priority}
            onChange={(next) => {
              if (next === '' || next === ticket.priority) return
              change(
                { priority: next as Ticket['priority'] },
                `Priority: ${ticket.priority} → ${next}`,
              )
            }}
          />
          <SelectField
            label="Type"
            options={TYPE_OPTIONS}
            value={ticket.type}
            onChange={(next) => {
              if (next === '' || next === ticket.type) return
              change({ type: next as Ticket['type'] }, `Type: ${ticket.type} → ${next}`)
            }}
          />
          <SelectField
            label="Team"
            options={TEAM_OPTIONS}
            value={ticket.team}
            onChange={(next) => {
              if (next === '' || next === ticket.team) return
              change(
                { team: next as TeamId },
                `Team: ${TEAMS[ticket.team]} → ${TEAMS[next as TeamId]}`,
              )
            }}
          />
          <SelectField
            label="Agent"
            options={AGENT_OPTIONS}
            value={ticket.assignee ?? ''}
            placeholder="Unassigned"
            clearable
            onChange={(next) => {
              const agent = next === '' ? null : (next as AgentId)
              if (agent === ticket.assignee) return
              change(
                { assignee: agent },
                agent === null ? 'Unassigned' : `Assigned to ${AGENTS[agent].name}`,
              )
            }}
          />
        </div>
      ),
    },
    {
      key: 'sla',
      title: 'Service level',
      content: (
        <KeyValueList
          layout="stacked"
          items={[
            {
              key: 'first',
              label: 'First response',
              value: (
                <SlaTimer
                  due={ticket.firstResponseDue}
                  now={NOW}
                  warnWithin={60}
                  showDue
                  {...(ticket.firstResponseAt === undefined
                    ? {}
                    : { completedAt: ticket.firstResponseAt })}
                />
              ),
            },
            {
              key: 'resolution',
              label: 'Resolution',
              value: (
                <SlaTimer
                  due={ticket.resolutionDue}
                  now={NOW}
                  warnWithin={60}
                  showDue
                  paused={ticket.status === 'Paused'}
                  {...(ticket.resolvedAt === undefined ? {} : { completedAt: ticket.resolvedAt })}
                />
              ),
            },
            ...(ticket.status === 'Paused' && ticket.pausedReason !== undefined
              ? [{ key: 'paused', label: 'Paused', value: ticket.pausedReason }]
              : []),
          ]}
        />
      ),
    },
    {
      key: 'contact',
      title: 'Contact',
      content: (
        <KeyValueList
          layout="stacked"
          items={[
            { key: 'name', label: 'Name', value: ticket.contact },
            {
              key: 'email',
              label: 'E-mail',
              value: (
                <a href={`mailto:${ticket.email}`} className="text-link break-all">
                  {ticket.email}
                </a>
              ),
            },
            { key: 'company', label: 'Company', value: ticket.customer },
          ]}
        />
      ),
    },
    {
      key: 'other',
      title: 'Other tickets',
      count: others.length,
      content:
        others.length === 0 ? (
          <p className="bidi-content m-0 text-sm text-secondary">No other tickets.</p>
        ) : (
          <RelatedDocuments
            label={`Other tickets of ${ticket.customer}`}
            items={others.map((each) => ({
              key: each.number,
              type: each.subject,
              number: `#${each.number}`,
              href: `#${S_ROUTES.ticket(each.number)}`,
              status: ticketBadge(each.status),
            }))}
          />
        ),
    },
    {
      key: 'activity',
      title: 'Activity',
      count: activity.length,
      content: (
        <ActivityList
          label="Activity"
          limit={3}
          items={[...activity].reverse().map((entry) => ({
            key: entry.key,
            author: entry.author,
            time: <span className="bidi-isolate tabular-nums">{format.dateTime(entry.at)}</span>,
            text: entry.text,
          }))}
        />
      ),
    },
  ]
  const side = <SidePanels panels={sidePanels} open={panels} onOpenChange={setPanels} />
  const done = isDone(ticket)

  const conversation = (
    <div className="flex flex-col gap-4">
      <MessageList
        label={`Conversation on ticket #${ticket.number}`}
        messages={thread}
        className={phone ? 'h-[26rem]' : 'h-[30rem]'}
      />
      <ReplyComposer
        ref={composer}
        {...(start.compose === undefined ? {} : { defaultMode: start.compose })}
        placeholder={`Write a reply to ${ticket.contact}`}
        notePlaceholder="Write a note for the team; @ mentions a colleague"
        {...(number === '4821' ? { defaultValue: DRAFT_4821 } : {})}
        mentionCandidates={TEAM_MENTIONS.filter((person) => person.id !== ME)}
        mergeFields={REPLY_FIELDS}
        savedReplies={SAVED}
        accept={['.pdf', '.png', '.jpg', '.xml', '.txt']}
        onAttach={(added) => {
          setFiles((list) => [
            ...list,
            ...added.map((file, index) => ({
              id: `file-${String(list.length + index)}`,
              name: file.name,
              sizeText: `${format.number(String(Math.max(1, Math.round(file.size / 1024))))} KB`,
              state: 'available' as const,
            })),
          ])
        }}
        attachments={
          files.length === 0 ? undefined : (
            <AttachmentList
              label="Files of this message"
              files={files}
              canRemove={() => true}
              onRemove={(file) => {
                setFiles((list) => list.filter((each) => each.id !== file.id))
              }}
            />
          )
        }
        insertLinkLabel="Insert article"
        onInsertLink={insertArticle}
        onSend={send}
        {...(done
          ? { disabled: true, disabledReason: 'The ticket is resolved. Reopen it to reply.' }
          : {})}
      />
    </div>
  )

  const articles = ARTICLES.filter((article) =>
    `${article.title} ${article.category}`
      .toLocaleLowerCase('sr-Latn')
      .includes(articleQuery.trim().toLocaleLowerCase('sr-Latn')),
  )

  return (
    <SupportShell
      phone={phone}
      tab="tickets"
      crumbs={[
        { label: 'Support' },
        { label: 'Tickets', href: `#${S_ROUTES.inbox}` },
        { label: `#${ticket.number}` },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={ticket.subject}
        back={{ href: `#${S_ROUTES.inbox}`, label: 'Tickets' }}
        status={ticketBadge(ticket.status)}
        subtitle={
          <span className="bidi-content">
            #{ticket.number} · {ticket.customer} · {ticket.type} · opened{' '}
            {format.dateTime(ticket.opened)}
          </span>
        }
        {...(phone
          ? {
              actions: (
                <Button
                  family="neutral"
                  icon={PanelRight}
                  label="Details"
                  onClick={() => {
                    setDetails(true)
                  }}
                />
              ),
            }
          : { side })}
        sections={[{ id: 'conversation', label: 'Conversation', content: conversation }]}
      />
      {phone && (
        <Drawer
          open={details}
          onOpenChange={setDetails}
          side="end"
          title="Details"
          subject={`#${ticket.number} ${ticket.subject}`}
        >
          {side}
        </Drawer>
      )}
      <LookupDialog
        open={articleOpen}
        onOpenChange={(open) => {
          if (!open) closeArticles(null)
        }}
        title="Knowledge base"
        description="Choose an article; its link goes into the reply at the cursor."
        initialQuery={articleQuery}
        onSearch={setArticleQuery}
        searchPlaceholder="Title or category"
        columns={ARTICLE_COLUMNS}
        rows={articles}
        getRowId={(article) => article.id}
        getRowLabel={(article) => article.title}
        onChoose={(article) => {
          closeArticles({ text: article.title, href: article.href })
        }}
        hasNext={false}
        onNext={() => undefined}
        count={articles.length}
        mobile={{ subtitle: (article) => article.category }}
        layout={phone ? 'phone' : 'desktop'}
      />
    </SupportShell>
  )
}

// ── c) The dashboard ──────────────────────────────────────────────────────────────────────────

const OVERDUE_COLUMNS: DataTableColumn<Ticket>[] = [
  {
    id: 'subject',
    header: 'Ticket',
    minWidth: 220,
    cell: (ticket) => <TicketLink ticket={ticket} />,
  },
  { id: 'customer', header: 'Customer', cell: (ticket) => ticket.customer },
  {
    id: 'assignee',
    header: 'Assignee',
    cell: (ticket) =>
      ticket.assignee === null ? (
        <span className="text-tertiary">Unassigned</span>
      ) : (
        AGENTS[ticket.assignee].name
      ),
  },
  { id: 'sla', header: 'SLA', minWidth: 240, cell: (ticket) => <TicketSla ticket={ticket} /> },
]

function TicketLink({ ticket }: { ticket: Ticket }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link
      href={`#${S_ROUTES.ticket(ticket.number)}`}
      className="bidi-content text-link no-underline visited:text-link hover:underline"
    >
      #{ticket.number} {ticket.subject}
    </Link>
  )
}

export function SupportDashboard({ phone }: { phone: boolean }) {
  const { format, messages } = useLiro()
  const [tickets] = useTickets()
  const open = tickets.filter((ticket) => !isDone(ticket))
  const unassigned = open.filter((ticket) => ticket.assignee === null)
  const overdue = sortTickets(
    tickets.filter((ticket) => isOverdue(ticket)),
    { column: 'sla', direction: 'asc' },
  )
  const number = (value: number) => format.number(String(value))
  const byDay = (values: readonly string[]) =>
    Object.fromEntries(WEEK.map((day, index) => [day, values[index] ?? null]))
  const days = WEEK.map((day) => ({ key: day, label: format.date(day) }))
  const teams = Object.keys(TEAMS) as TeamId[]
  return (
    <SupportShell
      phone={phone}
      tab="dashboard"
      crumbs={[{ label: 'Support' }, { label: 'Overview' }]}
    >
      <DashboardPage
        layout={phone ? 'phone' : 'desktop'}
        title="Support overview"
        subtitle={<span className="bidi-content">Liro support · {format.date(SUPPORT_TODAY)}</span>}
        stats={[
          {
            key: 'open',
            label: 'Open tickets',
            value: number(open.length),
            change: { text: number(4), direction: 'up', sentiment: 'bad' },
            comparison: 'since yesterday',
          },
          {
            key: 'unassigned',
            label: 'Unassigned',
            value: number(unassigned.length),
            comparison: 'waiting for an agent',
          },
          {
            key: 'overdue',
            label: 'Overdue',
            value: number(overdue.length),
            comparison: 'a service level broken',
          },
          {
            key: 'first',
            label: 'First response, median',
            value: durationText(MEDIANS.firstResponse, messages, format),
            comparison: 'last 30 days',
            trend: FIRST_RESPONSE_MINUTES,
          },
          {
            key: 'resolution',
            label: 'Resolution, median',
            value: durationText(MEDIANS.resolution, messages, format),
            comparison: 'last 30 days',
          },
          {
            key: 'satisfaction',
            label: 'Satisfaction',
            value: format.percent(RATINGS.share),
            comparison: `${number(Number(RATINGS.good) + Number(RATINGS.okay) + Number(RATINGS.bad))} ratings, last 30 days`,
          },
        ]}
      >
        <BarChart
          title="Tickets opened and resolved"
          description="Last 7 days"
          categories={days}
          series={[
            { key: 'opened', label: 'Opened' },
            { key: 'resolved', label: 'Resolved', role: 'comparison' },
          ]}
          values={{
            opened: byDay(OPENED_RESOLVED.opened),
            resolved: byDay(OPENED_RESOLVED.resolved),
          }}
          layout={phone ? 'phone' : 'desktop'}
        />
        <LineChart
          title="First response time"
          description="Median per day, minutes"
          categories={days}
          series={[{ key: 'minutes', label: 'Minutes' }]}
          values={{ minutes: byDay(FIRST_RESPONSE_MINUTES) }}
          layout={phone ? 'phone' : 'desktop'}
        />
        <BarChart
          title="Open tickets by team"
          description="Now"
          orientation="horizontal"
          categories={teams.map((team) => ({ key: team, label: TEAMS[team] }))}
          series={[{ key: 'open', label: 'Open' }]}
          values={{
            open: Object.fromEntries(
              teams.map((team) => [
                team,
                String(open.filter((ticket) => ticket.team === team).length),
              ]),
            ),
          }}
          layout={phone ? 'phone' : 'desktop'}
        />
        <DonutChart
          title="Satisfaction"
          description="Ratings after resolution, last 30 days"
          slices={[
            { key: 'good', label: 'Good', value: RATINGS.good, tone: 'success' },
            { key: 'okay', label: 'Okay', value: RATINGS.okay },
            { key: 'bad', label: 'Bad', value: RATINGS.bad, tone: 'danger' },
          ]}
          centre={{ value: format.percent(RATINGS.share), label: 'good' }}
        />
        <SectionCard title="Overdue tickets" headingLevel={2} flush className="col-span-full">
          <DataTable
            label="Overdue tickets"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={OVERDUE_COLUMNS}
            rows={overdue}
            getRowId={(ticket) => ticket.number}
            getRowLabel={(ticket) => `#${ticket.number} ${ticket.subject}`}
            mobile={{
              title: (ticket) => <TicketLink ticket={ticket} />,
              subtitle: (ticket) => ticket.customer,
              details: ['sla'],
            }}
          />
        </SectionCard>
      </DashboardPage>
    </SupportShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_S_ROUTES: ExampleRoute[] = [
  {
    path: S_ROUTES.inbox,
    render: (phone) => <SupportInbox phone={phone} start={{ view: 'mine' }} />,
  },
  {
    path: S_ROUTES.unassigned,
    render: (phone) => <SupportInbox phone={phone} start={{ view: 'unassigned' }} />,
  },
  {
    path: S_ROUTES.overdue,
    render: (phone) => <SupportInbox phone={phone} start={{ view: 'overdue' }} />,
  },
  { path: S_ROUTES.all, render: (phone) => <SupportInbox phone={phone} start={{ view: 'all' }} /> },
  {
    path: S_ROUTES.selected,
    render: (phone) => <SupportInbox phone={phone} start={{ view: 'all', selected: 3 }} />,
  },
  {
    path: S_ROUTES.assign,
    render: (phone) => (
      <SupportInbox phone={phone} start={{ view: 'all', selected: 3, assignOpen: true }} />
    ),
  },
  {
    path: S_ROUTES.ticketNote,
    render: (phone) => <SupportTicket phone={phone} number="4821" start={{ compose: 'note' }} />,
  },
  {
    path: S_ROUTES.ticketArticle,
    render: (phone) => <SupportTicket phone={phone} number="4821" start={{ articleOpen: true }} />,
  },
  {
    path: S_ROUTES.ticketDetails,
    render: (phone) => <SupportTicket phone={phone} number="4821" start={{ detailsOpen: true }} />,
  },
  ...TICKETS.map((ticket) => ({
    path: S_ROUTES.ticket(ticket.number),
    render: (phone: boolean) => <SupportTicket phone={phone} number={ticket.number} />,
  })),
  { path: S_ROUTES.dashboard, render: (phone) => <SupportDashboard phone={phone} /> },
]

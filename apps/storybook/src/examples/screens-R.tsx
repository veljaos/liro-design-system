import {
  BellRing,
  CalendarClock,
  CircleCheck,
  CircleStop,
  Eye,
  LogOut,
  Megaphone,
  MessageSquarePlus,
  Search,
  Undo2,
  UserRound,
} from 'lucide-react'
import { useContext, useEffect, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  ActivityList,
  Alert,
  AppShell,
  Banner,
  BulkActionBar,
  Button,
  CheckboxField,
  ConfirmDialog,
  DataTable,
  DateField,
  DESCRIPTION_MIN_WIDTH,
  DetailPage,
  Dialog,
  DocumentPage,
  EmptyState,
  FilterBar,
  FormFullWidth,
  FormSection,
  ImpersonationBar,
  KeyFigures,
  KeyValueList,
  ListPage,
  MultiSelectField,
  notice,
  RadioGroupField,
  ReasonConfirmDialog,
  RecordFormPage,
  RelatedDocuments,
  SelectField,
  StatusTimeline,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  WorklistPage,
  type ActionItem,
  type CommandItem,
  type DataTableColumn,
  type LiroFormat,
  type ModuleTab,
  type SidePanel,
  type WorklistItem,
} from '@veljaos/ui'
import { RichText } from '../../../../packages/ui/src/rich-text'
import { BRAND as BUSINESS_BRAND, Navigate, ROUTES, statusBadge } from './example-shell'
import type { ExampleRoute } from './example-app'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  acknowledge,
  ANNOUNCEMENT_FILTERS,
  ANNOUNCEMENT_IDS,
  ANNOUNCEMENTS,
  announcementViews,
  CLOSE_ACTIONS,
  closeEvent,
  draftErrors,
  draftOf,
  EDITED_ANNOUNCEMENT,
  EVENT_FILTERS,
  EVENT_KINDS,
  EVENT_START_FILTERS,
  filterAnnouncements,
  filterEvents,
  filterIncidents,
  filterTenants,
  INCIDENT_FILTERS,
  INCIDENT_PHASES,
  incidentMinutes,
  incidentViews,
  INCIDENTS,
  investigateEvent,
  KIND_LABELS,
  OPEN_INCIDENT,
  OPERATOR,
  postUpdate,
  POSTMORTEM_DUE,
  R_NOW,
  R_ROUTES,
  R_TODAY,
  resolveIncident,
  saveDraft,
  SECURITY_EVENTS,
  TENANT_ADMIN,
  TENANT_FILTERS,
  TENANT_OPTIONS,
  TENANT_VIEWS,
  tenantById,
  tenantName,
  TENANTS,
  TIME_OPTIONS,
  TONE_OPTIONS,
  toneLabel,
  UPDATE_PHASES,
  VIEW_AS_DEFAULT_REASON,
  VIEW_AS_REASONS,
  type Announcement,
  type AnnouncementDraft,
  type IncidentPhase,
  type SaIncident,
  type SaTenant,
  type SecurityEvent,
} from './data-R'

/*
 * Group R's example screens (P5.29 b, the Superadmin): the Liro team working across tenants on
 * 14 October 2026 at 09:40 — the incidents (a list, and an incident page on DocumentPage that is
 * acknowledged, updated and resolved; phones see and acknowledge), the security events (a
 * WorklistPage: each event is decided one by one, closed with the action taken), the tenants
 * (with an audited, read-only "view as" of a tenant's administration under ImpersonationBar) and
 * the announcements (a list, and an editor on RecordFormPage with the Banner's preview). Each
 * screen plays the application: it filters, counts and changes its dataset (data-R.ts) and keeps
 * what must outlive a screen above them (useExampleState); the components only show and report.
 * Built only from the library's templates and components; nothing new was needed.
 */

export { R_ROUTES }

const SUPERADMIN_BRAND = {
  brandName: 'Liro',
  productName: 'Superadmin',
  href: '#/superadmin/incidents',
}

/** The module tabs: System status and Network are the other P5.29 b screens. */
const TABS: { key: string; label: string; path: string }[] = [
  { key: 'status', label: 'System status', path: R_ROUTES.status },
  { key: 'incidents', label: 'Incidents', path: R_ROUTES.incidents },
  { key: 'security', label: 'Security events', path: R_ROUTES.security },
  { key: 'network', label: 'Network', path: R_ROUTES.network },
  { key: 'tenants', label: 'Tenants', path: R_ROUTES.tenants },
  { key: 'announcements', label: 'Announcements', path: R_ROUTES.announcements },
]

/** An instant as the tenant writes it, isolated so it reads in order in right-to-left pages. */
function When({ at }: { at: string }) {
  const { format } = useLiro()
  return <bdi>{format.dateTime(at)}</bdi>
}

/** A duration in the application's words: "48 min", "1 h 12 min". */
function durationText(format: LiroFormat, minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${format.number(String(rest))} min`
  return `${format.number(String(hours))} h ${format.number(String(rest))} min`
}

/**
 * The Superadmin's shell: the Liro team's own product, the module tabs across the top, the
 * signed-in team member; the tenant's day and time zone (Belgrade, 14.10.2026).
 */
export function SuperadminShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: string
  crumbs?: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const moduleTabs: ModuleTab[] = TABS.map((each) => ({
    key: each.key,
    label: each.label,
    href: `#${each.path}`,
    current: each.key === tab,
  }))
  const commands: CommandItem[] = [
    ...TABS.map((each) => ({
      id: `go-${each.key}`,
      label: each.label,
      group: 'navigation' as const,
      onSelect: () => {
        navigate(each.path)
      },
    })),
    {
      id: 'new-announcement',
      label: 'New announcement',
      group: 'actions' as const,
      onSelect: () => {
        navigate(R_ROUTES.newAnnouncement)
      },
    },
  ]
  return (
    <Tenant today={R_TODAY}>
      <AppShell
        layout={phone ? 'phone' : 'desktop'}
        brand={SUPERADMIN_BRAND}
        {...(crumbs === undefined ? {} : { breadcrumbs: crumbs })}
        commands={{ items: commands }}
        user={{
          name: OPERATOR.name,
          email: OPERATOR.email,
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
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
      </AppShell>
    </Tenant>
  )
}

// ── 1. Incidents ──────────────────────────────────────────────────────────────────────────────

/** The incidents as the application keeps them: changed on a page, seen in the list. */
function useIncidents() {
  return useExampleState('R.incidents', () => INCIDENTS)
}

function tenantCount(incident: SaIncident, format: LiroFormat): string {
  return incident.tenants === 'all' ? 'All' : format.number(String(incident.tenants.length))
}

function incidentColumns(format: LiroFormat): DataTableColumn<SaIncident>[] {
  return [
    { id: 'number', header: 'Incident', cell: (row) => row.id },
    { id: 'title', header: 'Title', minWidth: DESCRIPTION_MIN_WIDTH, cell: (row) => row.title },
    { id: 'state', header: 'State', cell: (row) => statusBadge(row.state) },
    { id: 'severity', header: 'Severity', cell: (row) => statusBadge(row.severity) },
    { id: 'services', header: 'Services', cell: (row) => row.services.join(', ') },
    {
      id: 'tenants',
      header: 'Tenants',
      align: 'end',
      numeric: true,
      cell: (row) => tenantCount(row, format),
    },
    { id: 'started', header: 'Started', numeric: true, cell: (row) => <When at={row.started} /> },
    {
      id: 'duration',
      header: 'Duration',
      align: 'end',
      numeric: true,
      cell: (row) => durationText(format, incidentMinutes(row)),
    },
  ]
}

export function IncidentList({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [incidents] = useIncidents()
  const [view, setView] = useState('all')
  const [search, setSearch] = useState('')
  const [values, setValues] = useState<Record<string, unknown>>({})
  const rows = filterIncidents(incidents, view, search, values)
  const open = (row: SaIncident) => {
    navigate(R_ROUTES.incident(row.id))
  }
  return (
    <SuperadminShell phone={phone} tab="incidents">
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Incidents"
        views={incidentViews(incidents)}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={INCIDENT_FILTERS}
            inline={2}
            values={values}
            onValuesChange={setValues}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search number or title"
          />
        }
      >
        <DataTable
          label="Incidents"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={incidentColumns(format)}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${row.id} · ${row.title}`}
          filters={values}
          onRowClick={open}
          onRowOpen={open}
          count={rows.length}
          countIsExact
          mobile={{
            title: (row) => row.title,
            subtitle: (row) => row.id,
            badge: (row) => statusBadge(row.state),
            details: ['severity', 'tenants', 'started', 'duration'],
          }}
        />
      </ListPage>
    </SuperadminShell>
  )
}

/** The "Post update" dialog's values. */
interface UpdateDraft {
  phase: IncidentPhase
  text: string
  public: boolean
}

/** The update the "update asked" story opens with (the application's draft, as typed). */
const UPDATE_ASKED: UpdateDraft = {
  phase: 'Identified',
  text: 'SEF confirmed a slowdown on their side and expects a fix by 11:00. Invoices wait safely and are sent automatically.',
  public: true,
}

function PostUpdateDialog({
  open,
  onOpenChange,
  incident,
  initial,
  onPost,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: SaIncident
  initial: UpdateDraft
  onPost: (draft: UpdateDraft) => void
}) {
  const [draft, setDraft] = useState(initial)
  const [tried, setTried] = useState(false)
  const missing = draft.text.trim() === ''
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setDraft(initial)
          setTried(false)
        }
      }}
      title="Post update"
      subject={`${incident.id} · ${incident.title}`}
      description="The update joins the incident’s timeline; the team sees it at once."
      actions={
        <>
          <Button
            intent="cancel"
            label="Cancel"
            onClick={() => {
              onOpenChange(false)
            }}
          />
          <Button
            family="primary"
            icon={MessageSquarePlus}
            emphasis="primary"
            label="Post update"
            onClick={() => {
              setTried(true)
              if (missing) return
              onPost(draft)
              setDraft({ ...draft, text: '' })
              setTried(false)
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <RadioGroupField
          label="Stage"
          options={UPDATE_PHASES}
          value={draft.phase}
          onChange={(phase) => {
            const chosen = UPDATE_PHASES.find((each) => each.value === phase)
            if (chosen !== undefined) setDraft({ ...draft, phase: chosen.value })
          }}
        />
        <TextAreaField
          label="Message"
          required
          rows={4}
          value={draft.text}
          onChange={(text) => {
            setDraft({ ...draft, text })
          }}
          {...(tried && missing ? { error: 'Write what changed.' } : {})}
        />
        <CheckboxField
          label="Also post it to the status page"
          description="Tenants read it on the status page and in the banner of affected tenants."
          checked={draft.public}
          onChange={(checked) => {
            setDraft({ ...draft, public: checked })
          }}
        />
      </div>
    </Dialog>
  )
}

function incidentPanels(incident: SaIncident): SidePanel[] {
  return [
    {
      key: 'people',
      title: 'People',
      content: (
        <KeyValueList
          columns={1}
          items={[
            { label: 'Assignee', value: incident.assignee ?? 'Not assigned' },
            { label: 'Incident commander', value: incident.commander },
            { label: 'On call', value: incident.onCall.primary },
            { label: 'On call, second', value: incident.onCall.secondary },
          ]}
        />
      ),
    },
    {
      key: 'services',
      title: 'Affected services',
      count: incident.services.length,
      content: (
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-primary">
          {incident.services.map((service) => (
            <li key={service} className="bidi-content">
              {service}
            </li>
          ))}
        </ul>
      ),
    },
    ...(incident.related === undefined
      ? []
      : [
          {
            key: 'related',
            title: 'Related incidents',
            count: incident.related.length,
            content: (
              <RelatedDocuments
                label="Related incidents"
                items={incident.related.map((id) => ({
                  key: id,
                  type: INCIDENTS.find((each) => each.id === id)?.title ?? 'Incident',
                  number: id,
                  href: `#${R_ROUTES.incident(id)}`,
                  status: statusBadge(INCIDENTS.find((each) => each.id === id)?.state ?? 'Open'),
                }))}
              />
            ),
          },
        ]),
  ]
}

/** The page of one incident: what happens, who is on it, and the way to act. */
export function IncidentPage({
  phone,
  id,
  ask,
}: {
  phone: boolean
  id: string
  /** A dialog open on arrival (the stories of the asked states). */
  ask?: 'update' | 'resolve'
}) {
  const { format } = useLiro()
  const [incidents, setIncidents] = useIncidents()
  const [updating, setUpdating] = useState(ask === 'update')
  const [resolving, setResolving] = useState(ask === 'resolve')
  const [panelsOpen, setPanelsOpen] = useState<string[]>(['people', 'services', 'related'])
  const [panelsHidden, setPanelsHidden] = useState(false)
  const incident = incidents.find((each) => each.id === id)
  if (incident === undefined) return null
  const change = (next: SaIncident) => {
    setIncidents((list) => list.map((each) => (each.id === next.id ? next : each)))
  }
  const name = `${incident.id} · ${incident.title}`
  const resolved = incident.state === 'Resolved'
  const acknowledged = incident.acknowledged !== undefined
  const duration = durationText(format, incidentMinutes(incident))
  const doAcknowledge = () => {
    change(acknowledge(incident, OPERATOR.name, R_NOW))
    notice.success(`${incident.id} acknowledged.`)
  }
  const ackButton = (
    <Button
      family="primary"
      icon={BellRing}
      emphasis="primary"
      label="Acknowledge"
      onClick={doAcknowledge}
    />
  )
  const actions =
    phone || resolved ? undefined : (
      <>
        <Button
          family="positive"
          icon={CircleCheck}
          emphasis="secondary"
          label="Resolve…"
          onClick={() => {
            setResolving(true)
          }}
        />
        <Button
          family="primary"
          icon={MessageSquarePlus}
          emphasis={acknowledged ? 'primary' : 'secondary'}
          label="Post update…"
          onClick={() => {
            setUpdating(true)
          }}
        />
        {!acknowledged && ackButton}
      </>
    )
  const paged = incident.paged ?? []
  const steps = incident.updates.map((update) => ({
    key: update.id,
    label: update.label,
    at: update.at,
    detail: (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content text-primary">{update.text}</span>
        <span className="bidi-content text-tertiary">
          {update.public ? `${update.author} · on the status page` : update.author}
        </span>
      </span>
    ),
  }))
  const message = incident.statusMessage
  return (
    <SuperadminShell
      phone={phone}
      tab="incidents"
      crumbs={[{ label: 'Incidents', href: `#${R_ROUTES.incidents}` }, { label: incident.id }]}
      {...(phone && !acknowledged && !resolved
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{ackButton}</div> }
        : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={name}
        back={{ href: `#${R_ROUTES.incidents}`, label: 'Incidents' }}
        status={statusBadge(incident.state)}
        {...(actions === undefined ? {} : { actions })}
        lifecycle={{
          steps: INCIDENT_PHASES.map((phase) => ({ key: phase, label: phase })),
          current: INCIDENT_PHASES.indexOf(incident.phase),
          label: 'Incident stage',
        }}
        keyFigures={[
          { key: 'severity', label: 'Severity', value: statusBadge(incident.severity) },
          { key: 'started', label: 'Started', value: <When at={incident.started} /> },
          { key: 'duration', label: resolved ? 'Lasted' : 'Going on for', value: duration },
          {
            key: 'tenants',
            label: 'Tenants affected',
            value: tenantCount(incident, format),
          },
        ]}
        lines={null}
        sections={[
          {
            key: 'status-page',
            title: 'Status-page message',
            content:
              message === undefined ? (
                <p className="bidi-content m-0 text-sm text-secondary">
                  Nothing is posted on the status page.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Alert tone={resolved ? 'success' : 'warning'} title={message.title}>
                    {message.text}
                  </Alert>
                  <p className="m-0 text-xs text-secondary">
                    <span className="bidi-content inline">Posted by {message.by}, </span>
                    <When at={message.at} />
                  </p>
                </div>
              ),
          },
          {
            key: 'timeline',
            title: 'Timeline',
            content: (
              <StatusTimeline
                label="Timeline"
                steps={steps}
                current={steps.length - 1}
                {...(acknowledged || resolved
                  ? {}
                  : {
                      next: {
                        tone: 'warning' as const,
                        title: 'Not acknowledged',
                        description: `Paged ${incident.onCall.primary} at ${paged.map((at) => format.time(at)).join(' and again at ')}.`,
                      },
                    })}
              />
            ),
          },
          {
            key: 'tenants',
            title: 'Affected tenants',
            content:
              incident.tenants === 'all' ? (
                <p className="bidi-content m-0 text-sm text-primary">Every tenant.</p>
              ) : (
                <KeyValueList
                  columns={phone ? 1 : 2}
                  items={incident.tenants.map((tenant) => ({
                    key: tenant,
                    label: tenantName(tenant),
                    value: incident.impact?.[tenant] ?? 'Affected',
                  }))}
                />
              ),
          },
          {
            key: 'postmortem',
            title: 'Postmortem',
            content: (
              <RichText
                html={incident.postmortem ?? null}
                empty={
                  !resolved
                    ? 'Written after the incident is resolved.'
                    : incident.postmortemDue === undefined
                      ? 'No postmortem was written for this incident.'
                      : `Due by ${format.date(incident.postmortemDue)}`
                }
              />
            ),
          },
        ]}
        panels={incidentPanels(incident)}
        panelsOpen={panelsOpen}
        onPanelsOpenChange={setPanelsOpen}
        panelsHidden={panelsHidden}
        onPanelsHiddenChange={setPanelsHidden}
      />
      <PostUpdateDialog
        open={updating}
        onOpenChange={setUpdating}
        incident={incident}
        initial={
          ask === 'update'
            ? UPDATE_ASKED
            : {
                phase: incident.phase === 'Detected' ? 'Investigating' : incident.phase,
                text: '',
                public: true,
              }
        }
        onPost={(draft) => {
          change(postUpdate(incident, { ...draft, author: OPERATOR.name, at: R_NOW }))
          setUpdating(false)
          notice.success('Update posted.')
        }}
      />
      <ConfirmDialog
        open={resolving}
        onOpenChange={setResolving}
        family="positive"
        actionIcon={CircleCheck}
        title="Resolve incident"
        subject={name}
        message={`The incident ends now, after ${duration}. Its postmortem is due by ${format.date(POSTMORTEM_DUE)}`}
        notify={[
          {
            id: 'status-page',
            label: 'Post “Resolved” to the status page',
            description: 'Its banner goes away from the affected tenants.',
            defaultChecked: true,
          },
          {
            id: 'admins',
            label:
              incident.tenants === 'all'
                ? 'E-mail the administrators of every tenant'
                : `E-mail the administrators of ${format.number(String(incident.tenants.length))} affected tenants`,
          },
        ]}
        confirmLabel="Resolve"
        notifyConfirmLabel="Resolve and notify"
        onConfirm={({ notify }) => {
          change(resolveIncident(incident, OPERATOR.name, R_NOW, notify.includes('status-page')))
          notice.success(`${incident.id} resolved.`)
        }}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </SuperadminShell>
  )
}

// ── 2. Security events ────────────────────────────────────────────────────────────────────────

function eventTenants(event: SecurityEvent, format: LiroFormat): string {
  const [first] = event.tenants
  return event.tenants.length === 1 && first !== undefined
    ? tenantName(first)
    : `${format.number(String(event.tenants.length))} tenants`
}

function eventName(event: SecurityEvent, format: LiroFormat): string {
  return `${EVENT_KINDS[event.kind]} · ${eventTenants(event, format)}`
}

function EventDetail({ event, phone }: { event: SecurityEvent; phone: boolean }) {
  const { format } = useLiro()
  return (
    <div className={phone ? 'flex flex-col gap-4' : 'flex flex-col gap-6 p-6'}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="bidi-content m-0 text-h2 text-primary">{EVENT_KINDS[event.kind]}</h2>
        <p className="bidi-content m-0 text-sm text-secondary">{event.summary}</p>
      </div>
      <KeyValueList
        columns={phone ? 1 : 2}
        items={[
          { key: 'severity', label: 'Severity', value: statusBadge(event.severity) },
          { key: 'state', label: 'State', value: statusBadge(event.state) },
          {
            key: 'tenants',
            label: event.tenants.length === 1 ? 'Tenant' : 'Tenants',
            value: event.tenants.map(tenantName).join(', '),
          },
          ...(event.accounts === undefined
            ? []
            : [
                {
                  key: 'accounts',
                  label: 'Accounts',
                  value: <bdi>{event.accounts.join(', ')}</bdi>,
                },
              ]),
          ...(event.ip === undefined
            ? []
            : [{ key: 'ip', label: 'Address', value: <bdi>{event.ip}</bdi>, numeric: true }]),
          ...(event.location === undefined
            ? []
            : [{ key: 'location', label: 'Location', value: event.location }]),
          {
            key: 'first',
            label: event.lastSeen === undefined ? 'Seen' : 'First seen',
            value: <When at={event.firstSeen} />,
            numeric: true,
          },
          ...(event.lastSeen === undefined
            ? []
            : [
                {
                  key: 'last',
                  label: 'Last seen',
                  value: <When at={event.lastSeen} />,
                  numeric: true,
                },
              ]),
          ...(event.attempts === undefined
            ? []
            : [
                {
                  key: 'attempts',
                  label: 'Attempts',
                  value: <bdi>{format.number(String(event.attempts))}</bdi>,
                  numeric: true,
                },
              ]),
          {
            key: 'action',
            label: 'Action taken',
            value: event.actionTaken ?? 'Nothing yet.',
            fullWidth: true,
          },
        ]}
      />
      <section aria-labelledby={`${event.id}-history`} className="flex flex-col gap-2">
        <h3 id={`${event.id}-history`} className="m-0 text-h4 text-primary">
          History
        </h3>
        <ActivityList
          label="History"
          limit={3}
          items={event.history.map((entry) => ({
            key: entry.key,
            author: entry.author,
            time: <When at={entry.at} />,
            text: entry.text,
          }))}
        />
      </section>
    </div>
  )
}

/**
 * Security events, decided one by one (WorklistPage): the queue opens on what is not closed, the
 * most severe first; each event is taken up and closed with the action taken.
 */
export function SecurityEvents({
  phone,
  start,
}: {
  phone: boolean
  /** The event chosen on arrival, and whether "Close" is asked (the stories' states). */
  start?: { event: string; close: boolean }
}) {
  const { format } = useLiro()
  const [events, setEvents] = useExampleState('R.events', () => SECURITY_EVENTS)
  const [search, setSearch] = useState('')
  const [values, setValues] = useState<Record<string, unknown>>(EVENT_START_FILTERS)
  const rows = filterEvents(events, search, values)
  const [selected, setSelected] = useState<string | undefined>(
    start?.event ?? (phone ? undefined : rows[0]?.id),
  )
  const [checked, setChecked] = useState<string[]>([])
  const [closing, setClosing] = useState<{ ids: readonly string[]; open: boolean }>({
    ids: start?.close === true ? [start.event] : [],
    open: start?.close === true,
  })
  const event = rows.find((each) => each.id === selected)
  const index = rows.findIndex((each) => each.id === selected)

  const closeAsk = (ids: readonly string[]) => {
    setClosing({ ids, open: true })
  }
  /** After a decision the next event in the queue opens at the same place. */
  const replace = (changed: SecurityEvent[]) => {
    const next = events.map((each) => changed.find((one) => one.id === each.id) ?? each)
    setEvents(next)
    setChecked([])
    const after = filterEvents(next, search, values)
    if (!phone || selected !== undefined) {
      setSelected(
        after.some((each) => each.id === selected)
          ? selected
          : after[Math.min(Math.max(index, 0), after.length - 1)]?.id,
      )
    }
  }
  const items: WorklistItem[] = rows.map((each) => ({
    id: each.id,
    label: eventName(each, format),
    title: EVENT_KINDS[each.kind],
    subtitle: (
      <>
        <span className="bidi-content inline">{eventTenants(each, format)} · </span>
        <When at={each.firstSeen} />
      </>
    ),
    figure: statusBadge(each.severity),
    status: statusBadge(each.state),
  }))
  const decisions =
    event === undefined || event.state === 'Closed' ? undefined : (
      <>
        {event.state === 'New' && (
          <Button
            family="neutral"
            icon={Search}
            label="Start investigating"
            onClick={() => {
              replace([investigateEvent(event, OPERATOR.name, R_NOW)])
            }}
          />
        )}
        <Button
          intent="confirm"
          label="Close…"
          onClick={() => {
            closeAsk([event.id])
          }}
        />
      </>
    )
  const count = (state: string) => events.filter((each) => each.state === state).length
  const closingOne =
    closing.ids.length === 1 ? events.find((each) => each.id === closing.ids[0]) : undefined
  return (
    <SuperadminShell
      phone={phone}
      tab="security"
      {...(phone && decisions !== undefined && event !== undefined
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Security events"
        titleHidden
        label="Security events"
        summary={
          <KeyFigures
            layout={phone ? 'phone' : 'desktop'}
            items={[
              { key: 'new', label: 'New', value: format.number(String(count('New'))) },
              {
                key: 'investigating',
                label: 'Investigating',
                value: format.number(String(count('Investigating'))),
              },
              {
                key: 'high',
                label: 'High, not closed',
                value: format.number(
                  String(
                    events.filter((each) => each.severity === 'High' && each.state !== 'Closed')
                      .length,
                  ),
                ),
                tone: 'danger',
              },
              { key: 'closed', label: 'Closed', value: format.number(String(count('Closed'))) },
            ]}
          />
        }
        toolbar={
          <FilterBar
            layout={phone ? 'phone' : 'desktop'}
            filters={EVENT_FILTERS}
            // The list is 380px wide: every filter in the drawer, the chosen ones as pills.
            inline={0}
            values={values}
            onValuesChange={(next) => {
              setValues(next)
            }}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search tenant, address or text"
          />
        }
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        checked={checked}
        onCheckedChange={setChecked}
        bulkBar={
          <BulkActionBar
            count={checked.length}
            onClear={() => {
              setChecked([])
            }}
            actions={[
              {
                key: 'close',
                intent: 'confirm',
                label: 'Close…',
                onClick: () => {
                  closeAsk(checked)
                },
              },
            ]}
          />
        }
        empty={
          <EmptyState
            variant="no-results"
            title="No security events"
            description="Nothing matches the search and the filters."
          />
        }
        {...(event === undefined ? {} : { detail: <EventDetail event={event} phone={phone} /> })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          setSelected(rows[(index - 1 + rows.length) % rows.length]?.id)
        }}
        onNext={() => {
          setSelected(rows[(index + 1) % rows.length]?.id)
        }}
      />
      <ReasonConfirmDialog
        open={closing.open}
        onOpenChange={(open) => {
          setClosing((current) => ({ ...current, open }))
        }}
        intent="confirm"
        {...(closingOne === undefined
          ? {
              title: `Close ${format.number(String(closing.ids.length))} security events?`,
            }
          : { title: 'Close security event', subject: eventName(closingOne, format) })}
        message="The action taken is kept with the event; the team sees it in its history."
        reasonLabel="Action taken"
        reasons={CLOSE_ACTIONS}
        detailsLabel="Details (optional)"
        confirmLabel={closing.ids.length === 1 ? 'Close event' : 'Close events'}
        onConfirm={({ reason, text }) => {
          const action = CLOSE_ACTIONS.find((each) => each.value === reason)?.label ?? ''
          replace(
            events
              .filter((each) => closing.ids.includes(each.id))
              .map((each) => closeEvent(each, action, text, OPERATOR.name, R_NOW)),
          )
          notice.success(
            closing.ids.length === 1
              ? 'Security event closed.'
              : `${format.number(String(closing.ids.length))} security events closed.`,
          )
        }}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </SuperadminShell>
  )
}

// ── 3. Tenants ────────────────────────────────────────────────────────────────────────────────

function tenantColumns(format: LiroFormat): DataTableColumn<SaTenant>[] {
  return [
    {
      id: 'name',
      header: 'Tenant',
      minWidth: DESCRIPTION_MIN_WIDTH,
      cell: (row) => (
        <span className="flex flex-col">
          <span className="bidi-content">{row.name}</span>
          <span className="bidi-content text-xs text-secondary">PIB {row.taxId}</span>
        </span>
      ),
    },
    { id: 'plan', header: 'Plan', cell: (row) => row.plan },
    {
      id: 'users',
      header: 'Users',
      align: 'end',
      numeric: true,
      cell: (row) => format.number(String(row.users)),
    },
    {
      id: 'health',
      header: 'Health',
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          {statusBadge(row.health)}
          {row.healthNote !== undefined && (
            <span className="bidi-content text-xs text-secondary">{row.healthNote}</span>
          )}
        </span>
      ),
    },
    {
      id: 'activity',
      header: 'Last activity',
      numeric: true,
      cell: (row) => <When at={row.lastActivity} />,
    },
  ]
}

/** The reason a team member gives before the tenant's admin view opens; the Core logs it. */
function useViewAsReason() {
  return useExampleState('R.viewAsReason', () => VIEW_AS_DEFAULT_REASON)
}

export function Tenants({ phone, viewAs }: { phone: boolean; viewAs?: string }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [, setReason] = useViewAsReason()
  const [, setNewDraft] = useExampleState<AnnouncementDraft | null>('R.newDraft', () => null)
  const [view, setView] = useState('all')
  const [search, setSearch] = useState('')
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [asking, setAsking] = useState<SaTenant | undefined>(
    viewAs === undefined ? undefined : tenantById(viewAs),
  )
  const [askOpen, setAskOpen] = useState(viewAs !== undefined)
  const rows = filterTenants(view, search, values)
  const ask = (tenant: SaTenant) => {
    setAsking(tenant)
    setAskOpen(true)
  }
  return (
    <SuperadminShell phone={phone} tab="tenants">
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Tenants"
        views={TENANT_VIEWS}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={TENANT_FILTERS}
            inline={2}
            values={values}
            onValuesChange={setValues}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name or PIB"
          />
        }
      >
        <DataTable
          label="Tenants"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={tenantColumns(format)}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          filters={values}
          onRowClick={ask}
          onRowOpen={ask}
          rowActions={(row) => [
            {
              label: 'View as admin…',
              icon: Eye,
              onSelect: () => {
                ask(row)
              },
            },
            {
              label: 'Send an announcement…',
              icon: Megaphone,
              onSelect: () => {
                setNewDraft({ ...draftOf(undefined), audience: 'chosen', tenants: [row.id] })
                navigate(R_ROUTES.newAnnouncement)
              },
            },
          ]}
          count={rows.length}
          countIsExact
          mobile={{
            title: (row) => row.name,
            subtitle: (row) => `${row.plan} · PIB ${row.taxId}`,
            badge: (row) => statusBadge(row.health),
            details: ['users', 'activity'],
          }}
        />
      </ListPage>
      {asking !== undefined && (
        <ReasonConfirmDialog
          open={askOpen}
          onOpenChange={setAskOpen}
          family="caution"
          actionIcon={Eye}
          title="View as admin"
          subject={asking.name}
          message="The tenant’s administration opens read-only. Every page you open is recorded in the audit log, and the tenant’s administrators can see it."
          reasonLabel="Why"
          reasons={VIEW_AS_REASONS}
          detailsLabel="Ticket or incident number"
          confirmLabel="View as admin"
          onConfirm={({ reason, text }) => {
            const label = VIEW_AS_REASONS.find((each) => each.value === reason)?.label ?? ''
            setReason(text === '' ? label : `${label} ${text}`)
            navigate(R_ROUTES.viewAs(asking.id))
          }}
        />
      )}
    </SuperadminShell>
  )
}

/**
 * One tenant's administration as its administrator sees it, read-only, under the audited
 * ImpersonationBar. A simple page here: the full admin views are P5.29 a's.
 */
export function ViewAs({ phone, tenantId }: { phone: boolean; tenantId: string }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [reason] = useViewAsReason()
  const tenant = tenantById(tenantId)
  if (tenant === undefined) return null
  const exit = () => {
    navigate(R_ROUTES.tenants)
  }
  const detailed = tenant.id === 'kvadrat'
  return (
    <Tenant today={R_TODAY}>
      <AppShell
        layout={phone ? 'phone' : 'desktop'}
        brand={BUSINESS_BRAND}
        breadcrumbs={[{ label: 'Settings' }, { label: 'Administration' }]}
        companies={{
          items: [{ id: tenant.id, name: tenant.name, description: `PIB ${tenant.taxId}` }],
          current: tenant.id,
          onSelect: () => undefined,
        }}
        user={{
          name: OPERATOR.name,
          email: OPERATOR.email,
          entries: [{ label: 'Exit view', icon: LogOut, onSelect: exit }],
        }}
        impersonationBar={
          <ImpersonationBar
            layout={phone ? 'phone' : 'desktop'}
            person={`${tenant.name} administrator`}
            mode="Read-only"
            reason={reason}
            note="Every page you open is recorded in the audit log"
            exitLabel="Exit view"
            onExit={exit}
          />
        }
      >
        <DetailPage
          layout={phone ? 'phone' : 'desktop'}
          title="Administration"
          subtitle={`${tenant.name} · ${tenant.plan} plan`}
          status={statusBadge(tenant.health)}
          sections={[
            {
              id: 'overview',
              label: 'Users and sign-in',
              content: (
                <KeyValueList
                  columns={phone ? 1 : 2}
                  items={[
                    {
                      key: 'seats',
                      label: 'Users',
                      value: (
                        <bdi>{`${format.number(String(tenant.users))} of ${format.number(String(tenant.seats))} seats`}</bdi>
                      ),
                    },
                    ...(detailed
                      ? [
                          {
                            key: 'sessions',
                            label: 'Active sessions',
                            value: format.number(String(TENANT_ADMIN.activeSessions)),
                            numeric: true,
                          },
                          {
                            key: 'failed',
                            label: 'Failed sign-ins today',
                            value: format.number(String(TENANT_ADMIN.failedSignInsToday)),
                            numeric: true,
                          },
                          {
                            key: 'two-factor',
                            label: 'Without two-factor sign-in',
                            value: format.number(String(TENANT_ADMIN.withoutTwoFactor)),
                            numeric: true,
                          },
                        ]
                      : []),
                    {
                      key: 'activity',
                      label: 'Last activity',
                      value: <When at={tenant.lastActivity} />,
                      numeric: true,
                    },
                  ]}
                />
              ),
            },
            ...(detailed
              ? [
                  {
                    id: 'users',
                    label: 'Users',
                    flush: true,
                    content: (
                      <DataTable
                        label="Users"
                        layout={phone ? 'cards' : 'table'}
                        inCard
                        stickyHeader={false}
                        columns={[
                          { id: 'name', header: 'Name', cell: (row) => row.name },
                          {
                            id: 'email',
                            header: 'E-mail',
                            cell: (row) => <bdi>{row.email}</bdi>,
                          },
                          { id: 'role', header: 'Role', cell: (row) => row.role },
                          { id: 'two-factor', header: 'Two-factor', cell: (row) => row.twoFactor },
                          {
                            id: 'last',
                            header: 'Last sign-in',
                            numeric: true,
                            cell: (row) => <When at={row.lastSignIn} />,
                          },
                        ]}
                        rows={TENANT_ADMIN.users}
                        getRowId={(row) => row.id}
                        getRowLabel={(row) => row.name}
                        mobile={{
                          title: (row) => row.name,
                          subtitle: (row) => row.role,
                          details: ['two-factor', 'last'],
                        }}
                      />
                    ),
                  },
                  {
                    id: 'integrations',
                    label: 'Integrations',
                    content: (
                      <KeyValueList
                        columns={1}
                        items={TENANT_ADMIN.integrations.map((each) => ({
                          key: each.id,
                          label: each.name,
                          value: (
                            <span className="flex flex-col items-end gap-1">
                              {statusBadge(each.state)}
                              <span className="bidi-content text-xs text-secondary">
                                {each.note}
                              </span>
                            </span>
                          ),
                        }))}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </AppShell>
    </Tenant>
  )
}

// ── 4. Announcements ──────────────────────────────────────────────────────────────────────────

function useAnnouncements() {
  return useExampleState('R.announcements', () => ANNOUNCEMENTS)
}

function audienceText(announcement: Announcement, format: LiroFormat): string {
  if (announcement.audience === 'all') return 'All tenants'
  const [first] = announcement.audience
  return announcement.audience.length === 1 && first !== undefined
    ? tenantName(first)
    : `${format.number(String(announcement.audience.length))} tenants`
}

function announcementColumns(format: LiroFormat): DataTableColumn<Announcement>[] {
  return [
    { id: 'title', header: 'Title', minWidth: DESCRIPTION_MIN_WIDTH, cell: (row) => row.title },
    { id: 'kind', header: 'Kind', cell: (row) => KIND_LABELS[row.kind] },
    { id: 'audience', header: 'Audience', cell: (row) => audienceText(row, format) },
    { id: 'tone', header: 'Tone', cell: (row) => toneLabel(row.tone) },
    {
      id: 'start',
      header: 'Starts',
      numeric: true,
      cell: (row) => (row.start === null ? '—' : <When at={row.start} />),
    },
    {
      id: 'end',
      header: 'Ends',
      numeric: true,
      cell: (row) =>
        row.end === null ? row.start === null ? '—' : 'When ended' : <When at={row.end} />,
    },
    { id: 'state', header: 'State', cell: (row) => statusBadge(row.state) },
  ]
}

export function Announcements({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [list] = useAnnouncements()
  const [view, setView] = useState('all')
  const [search, setSearch] = useState('')
  const [values, setValues] = useState<Record<string, unknown>>({})
  const rows = filterAnnouncements(list, view, search, values)
  const open = (row: Announcement) => {
    navigate(R_ROUTES.announcement(row.id))
  }
  const create = (
    <Button
      intent="create"
      label="New announcement"
      onClick={() => {
        navigate(R_ROUTES.newAnnouncement)
      }}
    />
  )
  return (
    <SuperadminShell phone={phone} tab="announcements" {...(phone ? { bottomBar: create } : {})}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Announcements"
        {...(phone ? {} : { actions: create })}
        views={announcementViews(list)}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={ANNOUNCEMENT_FILTERS}
            inline={2}
            values={values}
            onValuesChange={setValues}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search title"
          />
        }
      >
        <DataTable
          label="Announcements"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={announcementColumns(format)}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.title}
          filters={values}
          onRowClick={open}
          onRowOpen={open}
          count={rows.length}
          countIsExact
          mobile={{
            title: (row) => row.title,
            subtitle: (row) => `${KIND_LABELS[row.kind]} · ${audienceText(row, format)}`,
            badge: (row) => statusBadge(row.state),
            details: ['start', 'end'],
          }}
        />
      </ListPage>
    </SuperadminShell>
  )
}

/** The announcement as tenants will see it: the Banner, or the status page's message. */
function AnnouncementPreview({ draft }: { draft: AnnouncementDraft }) {
  if (draft.title.trim() === '' && draft.message.trim() === '') {
    return (
      <p className="bidi-content m-0 text-sm text-secondary">
        The preview appears when the title or the message is written.
      </p>
    )
  }
  const title = draft.title.trim() === '' ? undefined : draft.title
  return draft.kind === 'banner' ? (
    <Banner tone={draft.tone} role="status" {...(title === undefined ? {} : { title })}>
      {draft.message}
    </Banner>
  ) : (
    <Alert tone={draft.tone} {...(title === undefined ? {} : { title })}>
      {draft.message}
    </Alert>
  )
}

/** The editor of one announcement (RecordFormPage): message, preview, audience, schedule. */
export function AnnouncementEditor({ phone, id }: { phone: boolean; id: string }) {
  const navigate = useContext(Navigate)
  const [list, setList] = useAnnouncements()
  const [newDraft, setNewDraft] = useExampleState<AnnouncementDraft | null>(
    'R.newDraft',
    () => null,
  )
  const existing = list.find((each) => each.id === id)
  const [initial] = useState<AnnouncementDraft>(() => newDraft ?? draftOf(existing))
  // A draft handed over (from a tenant's row, or "Duplicate as new") is used once.
  useEffect(() => {
    if (newDraft !== null) setNewDraft(null)
  }, [newDraft, setNewDraft])
  const [draft, setDraft] = useState(initial)
  const [tried, setTried] = useState<'draft' | 'schedule' | null>(null)
  const [ending, setEnding] = useState(false)
  const ended = existing?.state === 'Ended'
  const live = existing?.state === 'Live'
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  const errors = tried === null ? {} : draftErrors(draft, tried === 'schedule')
  const set = (patch: Partial<AnnouncementDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }
  const leave = () => {
    setNewDraft(null)
    navigate(R_ROUTES.announcements)
  }
  const save = (scheduling: boolean) => {
    setTried(scheduling ? 'schedule' : 'draft')
    if (Object.keys(draftErrors(draft, scheduling)).length > 0) return
    const saved = saveDraft(existing?.id ?? `an-${String(list.length + 1)}`, draft, scheduling)
    setList((current) =>
      existing === undefined
        ? [saved, ...current]
        : current.map((each) => (each.id === saved.id ? saved : each)),
    )
    leave()
  }
  const actions: ActionItem[] = ended
    ? [
        {
          key: 'duplicate',
          intent: 'duplicate',
          label: 'Duplicate as new',
          onClick: () => {
            setNewDraft({ ...initial, startDate: null, endDate: null })
            navigate(R_ROUTES.newAnnouncement)
          },
        },
      ]
    : [
        { key: 'cancel', intent: 'cancel', label: 'Cancel', onClick: leave },
        ...(live
          ? [
              {
                key: 'end',
                family: 'caution' as const,
                icon: CircleStop,
                label: 'End now…',
                onClick: () => {
                  setEnding(true)
                },
              },
            ]
          : [
              existing?.state === 'Scheduled'
                ? {
                    key: 'draft',
                    family: 'neutral' as const,
                    icon: Undo2,
                    label: 'Move to drafts',
                    onClick: () => {
                      save(false)
                    },
                  }
                : {
                    key: 'draft',
                    intent: 'save' as const,
                    emphasis: 'secondary' as const,
                    label: 'Save draft',
                    onClick: () => {
                      save(false)
                    },
                  },
            ]),
        existing === undefined || existing.state === 'Draft'
          ? {
              key: 'schedule',
              family: 'primary' as const,
              icon: CalendarClock,
              emphasis: 'primary' as const,
              label: 'Schedule',
              onClick: () => {
                save(true)
              },
            }
          : {
              key: 'save',
              intent: 'save' as const,
              label: 'Save changes',
              onClick: () => {
                save(true)
              },
            },
      ]
  const columns = phone ? 1 : 2
  const readOnly = ended ? { readOnly: true } : {}
  return (
    <SuperadminShell
      phone={phone}
      tab="announcements"
      crumbs={[
        { label: 'Announcements', href: `#${R_ROUTES.announcements}` },
        { label: existing?.title ?? 'New announcement' },
      ]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title={existing?.title ?? 'New announcement'}
        back={{ href: `#${R_ROUTES.announcements}`, label: 'Announcements' }}
        {...(existing === undefined ? {} : { status: statusBadge(existing.state) })}
        dirty={dirty}
        actions={<ActionGroup actions={actions} />}
      >
        <div className="flex flex-col gap-4">
          <FormSection title="Message" columns={columns}>
            <RadioGroupField
              label="Kind"
              {...readOnly}
              options={[
                {
                  value: 'banner',
                  label: KIND_LABELS.banner,
                  description: 'Under the application’s header, for every user of the tenant.',
                },
                {
                  value: 'status',
                  label: KIND_LABELS.status,
                  description: 'On Liro’s public status page.',
                },
              ]}
              value={draft.kind}
              onChange={(kind) => {
                set({ kind: kind === 'status' ? 'status' : 'banner' })
              }}
            />
            <SelectField
              label="Tone"
              {...readOnly}
              options={TONE_OPTIONS}
              value={draft.tone}
              onChange={(tone) => {
                const chosen = TONE_OPTIONS.find((each) => each.value === tone)
                if (chosen !== undefined) set({ tone: chosen.value as AnnouncementDraft['tone'] })
              }}
            />
            <FormFullWidth>
              <TextField
                label="Title"
                required
                {...readOnly}
                value={draft.title}
                onChange={(title) => {
                  set({ title })
                }}
                {...(errors.title === undefined ? {} : { error: errors.title })}
              />
            </FormFullWidth>
            <FormFullWidth>
              <TextAreaField
                label="Message"
                required
                {...readOnly}
                description="One or two sentences."
                rows={3}
                value={draft.message}
                onChange={(message) => {
                  set({ message })
                }}
                {...(errors.message === undefined ? {} : { error: errors.message })}
              />
            </FormFullWidth>
          </FormSection>
          <FormSection
            title="Preview"
            description={
              draft.kind === 'banner'
                ? 'As tenants will see it under the application’s header.'
                : 'As it will stand on the status page.'
            }
            columns={1}
          >
            <AnnouncementPreview draft={draft} />
          </FormSection>
          <FormSection title="Audience" columns={columns}>
            <RadioGroupField
              label="Who sees it"
              {...readOnly}
              options={[
                { value: 'all', label: `All tenants (${String(TENANTS.length)})` },
                { value: 'chosen', label: 'Chosen tenants' },
              ]}
              value={draft.audience}
              onChange={(audience) => {
                set({ audience: audience === 'chosen' ? 'chosen' : 'all' })
              }}
            />
            {draft.audience === 'chosen' && (
              <MultiSelectField
                label="Tenants"
                required
                {...readOnly}
                options={TENANT_OPTIONS}
                value={draft.tenants}
                onChange={(tenants) => {
                  set({ tenants })
                }}
                placeholder="Search tenants"
                {...(errors.tenants === undefined ? {} : { error: errors.tenants })}
              />
            )}
          </FormSection>
          <FormSection
            title="Schedule"
            description="Times in Belgrade. Without an end it stays until you end it."
            columns={columns}
          >
            <DateField
              label="Starts on"
              required
              {...readOnly}
              value={draft.startDate}
              onChange={(startDate) => {
                set({ startDate })
              }}
              {...(errors.start === undefined ? {} : { error: errors.start })}
            />
            <SelectField
              label="Start time"
              {...readOnly}
              options={TIME_OPTIONS}
              value={draft.startTime}
              onChange={(startTime) => {
                set({ startTime })
              }}
            />
            <DateField
              label="Ends on"
              {...readOnly}
              value={draft.endDate}
              onChange={(endDate) => {
                set({ endDate })
              }}
              {...(errors.end === undefined ? {} : { error: errors.end })}
            />
            <SelectField
              label="End time"
              {...readOnly}
              options={TIME_OPTIONS}
              value={draft.endTime}
              onChange={(endTime) => {
                set({ endTime })
              }}
            />
          </FormSection>
        </div>
      </RecordFormPage>
      {existing !== undefined && live && (
        <ConfirmDialog
          open={ending}
          onOpenChange={setEnding}
          family="caution"
          actionIcon={CircleStop}
          title="End announcement"
          subject={existing.title}
          message="Tenants stop seeing it now. It stays in the list as ended."
          confirmLabel="End now"
          onConfirm={() => {
            setList((current) =>
              current.map((each) =>
                each.id === existing.id ? { ...each, state: 'Ended', end: R_NOW } : each,
              ),
            )
            leave()
          }}
        />
      )}
    </SuperadminShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_R_ROUTES: ExampleRoute[] = [
  { path: R_ROUTES.incidents, render: (phone) => <IncidentList phone={phone} /> },
  ...INCIDENTS.map((incident) => ({
    path: R_ROUTES.incident(incident.id),
    render: (phone: boolean) => <IncidentPage phone={phone} id={incident.id} />,
  })),
  {
    path: R_ROUTES.incidentUpdate,
    render: (phone) => <IncidentPage phone={phone} id={OPEN_INCIDENT} ask="update" />,
  },
  {
    path: R_ROUTES.incidentResolve,
    render: (phone) => <IncidentPage phone={phone} id={OPEN_INCIDENT} ask="resolve" />,
  },
  { path: R_ROUTES.security, render: (phone) => <SecurityEvents phone={phone} /> },
  {
    path: R_ROUTES.securityClose,
    render: (phone) => <SecurityEvents phone={phone} start={{ event: 'se-1', close: true }} />,
  },
  { path: R_ROUTES.tenants, render: (phone) => <Tenants phone={phone} /> },
  { path: R_ROUTES.tenantsViewAs, render: (phone) => <Tenants phone={phone} viewAs="kvadrat" /> },
  ...TENANTS.map((tenant) => ({
    path: R_ROUTES.viewAs(tenant.id),
    render: (phone: boolean) => <ViewAs phone={phone} tenantId={tenant.id} />,
  })),
  { path: R_ROUTES.announcements, render: (phone) => <Announcements phone={phone} /> },
  {
    path: R_ROUTES.newAnnouncement,
    render: (phone) => <AnnouncementEditor phone={phone} id="new" />,
  },
  // The stored announcements and those the editor adds (the Core's ids: an-1, an-2 …).
  ...ANNOUNCEMENT_IDS.map((id) => ({
    path: R_ROUTES.announcement(id),
    render: (phone: boolean) => <AnnouncementEditor phone={phone} id={id} />,
  })),
]

/** The editor's story opens this announcement (chosen tenants, scheduled). */
export const EDITED_ROUTE = R_ROUTES.announcement(EDITED_ANNOUNCEMENT)

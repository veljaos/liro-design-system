import {
  CalendarDays,
  List,
  Mail,
  MessageSquareText,
  Phone,
  SquareCheckBig,
  ThumbsDown,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  CalendarView,
  ConfirmDialog,
  DataTable,
  DateField,
  DateText,
  DetailPage,
  Drawer,
  dueState,
  DueDate,
  FilterBar,
  HistoryList,
  KanbanBoard,
  KeyValueList,
  ListPage,
  MoneyText,
  moveCard,
  notice,
  PageHeader,
  PersonName,
  placeOf,
  RadioGroupField,
  ReasonConfirmDialog,
  RelatedDocuments,
  StatusBadge,
  TextAreaField,
  TextField,
  Toaster,
  toneFor,
  useLiro,
  type CalendarEvent,
  type DataTableColumn,
  type HistoryEntry,
  type KanbanCard,
  type KanbanMove,
  type ModuleTab,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { COMPANIES, Navigate, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import { AV_ROUTES } from './data-AV'
import {
  ACTIVITIES,
  ACTIVITY_KINDS,
  ACTIVITY_VIEWS,
  BL_NOW,
  BL_ROUTES,
  BL_TODAY,
  CONTACT,
  CONTACT_DEALS,
  CONTACT_QUOTES,
  DEAL_DETAILS,
  DEAL_STAGES,
  DEAL_TONES,
  DEALS,
  FEATURED_DEAL,
  initialPipeline,
  LOST_REASONS,
  SALES_ENGINEER,
  WINNING_QUOTE_STATES,
  type ActivityKind,
  type CrmActivity,
  type Deal,
  type StageIds,
} from './data-BL'

/*
 * Group BL's example screens (P5.67, CRM): Kvadrat Gradnja d.o.o.'s sales on 14.10.2026 at 09:40,
 * seen by Milena Jović. Built from the library alone:
 * - The pipeline (KanbanBoard): leads → opportunities → quotes → won / lost; each card the deal,
 *   its customer, owner, next activity (DueDate) and value (the application's, through `format`),
 *   its quote as a record link into the sales chain (group AV). A move is only reported; the
 *   screen plays the application: Lost asks why (ReasonConfirmDialog), Won asks first
 *   (ConfirmDialog) and only for a deal whose quote is accepted, Quotes only for a deal with a
 *   quote — a refused move says why in a toast.
 * - A deal, OPP-2026-038 (DetailPage): value, probability and expected close; the contact; the
 *   quote PON-2026-0031 (RelatedDocuments, into `/sales/quotes/…`); its activities; its history
 *   (HistoryList: stage and value changes). Mark as lost / Mark as won.
 * - A contact, Vesna Ilić (DetailPage): details, open deals, quotes, the timeline (HistoryList:
 *   calls, meetings, e-mails, the quote's acceptance, the delivery); "Log activity" in an end
 *   Drawer (D14, a short edit with the page in view).
 * - The activities: a list (ListPage + DataTable: calls, meetings, e-mails and tasks; views My
 *   planned / Overdue / Done / All) and the same activities on CalendarView (week, agenda on
 *   phones, the application's "now").
 * The pipeline and the logged activities are kept above the screens, as the application keeps
 * them.
 */

export { BL_ROUTES }

// ── Shared: the CRM shell ─────────────────────────────────────────────────────────────────────

const SALES_ACCOUNT: ExampleAccount = {
  name: SALES_ENGINEER.name,
  email: SALES_ENGINEER.email,
  companies: COMPANIES.filter((company) => company.id === 'kvadrat'),
  links: [
    { label: 'Pipeline', path: BL_ROUTES.pipeline },
    { label: 'Vesna Ilić', path: BL_ROUTES.contact },
    { label: 'Quotes', path: AV_ROUTES.quotes },
  ],
}

type CrmTab = 'pipeline' | 'contacts' | 'activities' | 'quotes'

function crmTabs(current: CrmTab): ModuleTab[] {
  return [
    { key: 'pipeline', label: 'Pipeline', href: `#${BL_ROUTES.pipeline}` },
    { key: 'contacts', label: 'Contacts', href: `#${BL_ROUTES.contact}` },
    { key: 'activities', label: 'Activities', href: `#${BL_ROUTES.activities}` },
    { key: 'quotes', label: 'Quotes', href: `#${AV_ROUTES.quotes}` },
  ].map((tab) => ({ ...tab, current: tab.key === current }))
}

function CrmShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: CrmTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={BL_TODAY}>
      <Shell
        phone={phone}
        account={SALES_ACCOUNT}
        tabs={crmTabs(tab)}
        crumbs={crumbs}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

const money = (value: string | null) => <MoneyText value={value} currency="RSD" />

const LINK = 'bidi-content rounded-sm text-link no-underline visited:text-link hover:underline'

function dealOf(id: string): Deal | undefined {
  return DEALS.find((each) => each.id === id)
}

function stageWord(columns: readonly StageIds[], id: string): string {
  const column = placeOf(columns, id)?.column
  return DEAL_STAGES.find((each) => each.id === column)?.word ?? ''
}

function stageBadge(word: string) {
  return <StatusBadge label={word} tone={toneFor(word, DEAL_TONES)} />
}

function usePipeline() {
  return useExampleState<StageIds[]>('BL.pipeline', initialPipeline)
}

/** A deal as a card: customer, owner, next activity, value, its quote. */
function useDealCard() {
  const { format } = useLiro()
  return (deal: Deal): KanbanCard => ({
    id: deal.id,
    title: deal.title,
    ...(deal.id === FEATURED_DEAL ? { href: `#${BL_ROUTES.deal}` } : {}),
    description: deal.closed === undefined ? deal.customer : `${deal.customer} · ${deal.closed}`,
    assignee: { name: deal.owner },
    ...(deal.next === undefined || deal.closed !== undefined ? {} : { due: deal.next.due }),
    meta: deal.value === null ? 'Value not estimated' : `Value ${format.money(deal.value, 'RSD')}`,
    ...(deal.quote === undefined
      ? {}
      : {
          record: {
            kind: 'Quote',
            number: deal.quote.number,
            state: deal.quote.state,
            href: `#${deal.quote.path}`,
          },
        }),
  })
}

/** The deal's move to Won or Lost, asked first. */
interface Closing {
  move: KanbanMove
  kind: 'won' | 'lost'
}

/** The application's answer to a move: apply it, ask first, or refuse with its reason. */
function judgeMove(move: KanbanMove): string {
  const deal = dealOf(move.cardId)
  if (deal === undefined) return 'apply'
  if (move.to.column === move.from.column) return 'apply'
  if (move.to.column === 'lost') return 'ask-lost'
  if (move.to.column === 'won') {
    return deal.quote !== undefined && WINNING_QUOTE_STATES.includes(deal.quote.state)
      ? 'ask-won'
      : `Not moved: a deal is won when its quote is accepted, and ${deal.title} has no accepted quote.`
  }
  if (move.to.column === 'quote' && deal.quote === undefined) {
    return `Not moved: ${deal.title} has no quote yet.`
  }
  return 'apply'
}

/** Lost and Won dialogs of one deal: both ask, the application then moves it. */
function ClosingDialogs({
  closing,
  onClose,
  onDone,
}: {
  closing: Closing | null
  onClose: () => void
  onDone: (closing: Closing, reason?: string) => void
}) {
  const deal = closing === null ? undefined : dealOf(closing.move.cardId)
  return (
    <>
      <ReasonConfirmDialog
        open={closing?.kind === 'lost'}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        family="destructive"
        actionIcon={ThumbsDown}
        title="Mark as lost"
        subject={deal?.title ?? ''}
        message="The deal leaves the open pipeline; its reason counts in the sales report."
        reasons={LOST_REASONS}
        confirmLabel="Mark as lost"
        onConfirm={(answer) => {
          if (closing === null) return
          onDone(closing, LOST_REASONS.find((each) => each.value === answer.reason)?.label)
        }}
      />
      <ConfirmDialog
        open={closing?.kind === 'won'}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        family="positive"
        actionIcon={Trophy}
        title="Mark as won"
        subject={deal?.title ?? ''}
        message={
          deal?.quote === undefined
            ? undefined
            : `Quote ${deal.quote.number} is ${deal.quote.state.toLocaleLowerCase()}. The deal leaves the open pipeline.`
        }
        confirmLabel="Mark as won"
        onConfirm={() => {
          if (closing !== null) onDone(closing)
        }}
      />
    </>
  )
}

function useClosing(initial: (columns: readonly StageIds[]) => Closing | null = () => null) {
  const [columns, setColumns] = usePipeline()
  const [closing, setClosing] = useState<Closing | null>(() => initial(columns))
  const done = (current: Closing, reason?: string) => {
    const deal = dealOf(current.move.cardId)
    setColumns((list) => moveCard(list, current.move.cardId, current.move.to))
    setClosing(null)
    if (deal !== undefined) {
      notice.success(
        current.kind === 'won'
          ? `${deal.title} is won.`
          : `${deal.title} is lost${reason === undefined ? '' : `: ${reason}`}.`,
      )
    }
  }
  return { columns, setColumns, closing, setClosing, done }
}

// ── The pipeline ──────────────────────────────────────────────────────────────────────────────

function dealCount(n: number) {
  return `${String(n)} ${n === 1 ? 'deal' : 'deals'}`
}

export function PipelineScreen({ phone, lost }: { phone: boolean; lost?: string }) {
  const toCard = useDealCard()
  const { columns, setColumns, closing, setClosing, done } = useClosing((current) => {
    // The pictured state: the deal dropped on Lost, its reason asked.
    if (lost === undefined) return null
    const from = placeOf(current, lost)
    return from === null
      ? null
      : { kind: 'lost', move: { cardId: lost, from, to: { column: 'lost', index: 0 } } }
  })
  const create = <Button intent="create" label="New lead" />
  return (
    <CrmShell
      phone={phone}
      tab="pipeline"
      crumbs={[{ label: 'CRM' }, { label: 'Pipeline' }]}
      {...(phone ? { bottomBar: create } : {})}
    >
      <Frame phone={phone} wide>
        <PageHeader title="Pipeline" {...(phone ? {} : { actions: create })} />
        <KanbanBoard
          label="Pipeline"
          layout={phone ? 'phone' : 'desktop'}
          columns={columns.map((column) => ({
            id: column.id,
            title: column.title,
            count: dealCount(column.cards.length),
            cards: column.cards.flatMap((each) => {
              const deal = dealOf(each.id)
              return deal === undefined ? [] : [toCard(deal)]
            }),
          }))}
          onMove={(move) => {
            const answer = judgeMove(move)
            if (answer === 'apply') setColumns((list) => moveCard(list, move.cardId, move.to))
            else if (answer === 'ask-won') setClosing({ kind: 'won', move })
            else if (answer === 'ask-lost') setClosing({ kind: 'lost', move })
            else notice.warning(answer)
          }}
        />
      </Frame>
      <ClosingDialogs
        closing={closing}
        onClose={() => {
          setClosing(null)
        }}
        onDone={done}
      />
    </CrmShell>
  )
}

// ── Activities, shared ────────────────────────────────────────────────────────────────────────

const KIND_ICONS: Record<ActivityKind, LucideIcon> = {
  Call: Phone,
  Meeting: Users,
  'E-mail': Mail,
  Task: SquareCheckBig,
}

function KindText({ kind }: { kind: ActivityKind }) {
  const Icon = KIND_ICONS[kind]
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-secondary" />
      {kind}
    </span>
  )
}

function useLoggedActivities() {
  return useExampleState<CrmActivity[]>('BL.logged', () => [])
}

function isOverdue(activity: CrmActivity) {
  return (
    activity.state === 'Planned' &&
    dueState(activity.start.slice(0, 10), BL_TODAY, false, 0).kind === 'overdue'
  )
}

function useActivityColumns(withDeal: boolean): DataTableColumn<CrmActivity>[] {
  const { format, linkComponent: Link } = useLiro()
  const link = LINK
  return [
    { id: 'kind', header: 'Kind', cell: (row) => <KindText kind={row.kind} /> },
    {
      id: 'subject',
      header: 'Subject',
      minWidth: 220,
      cell: (row) => <span className="bidi-content font-medium">{row.subject}</span>,
    },
    {
      id: 'with',
      header: 'With',
      minWidth: 180,
      cell: (row) =>
        row.contact === true ? (
          <Link href={`#${BL_ROUTES.contact}`} className={link}>
            {row.with}
          </Link>
        ) : (
          <span className="bidi-content">{row.with}</span>
        ),
    },
    ...(withDeal
      ? [
          {
            id: 'deal',
            header: 'Deal',
            cell: (row: CrmActivity) =>
              row.deal === FEATURED_DEAL ? (
                <Link href={`#${BL_ROUTES.deal}`} className={link}>
                  <bdi dir="ltr">{row.deal}</bdi>
                </Link>
              ) : (
                <bdi dir="ltr">{row.deal ?? '—'}</bdi>
              ),
          },
        ]
      : []),
    {
      id: 'when',
      header: 'When',
      numeric: true,
      cell: (row) =>
        row.end === undefined ? (
          row.state === 'Done' ? (
            <DateText value={row.start} />
          ) : (
            <DueDate value={row.start} />
          )
        ) : (
          `${format.dateTime(row.start)}${row.end === row.start ? '' : `–${format.time(row.end)}`}`
        ),
    },
    { id: 'owner', header: 'Owner', cell: (row) => <PersonName name={row.owner} /> },
    {
      id: 'state',
      header: 'State',
      cell: (row) => (
        <StatusBadge label={row.state} tone={row.state === 'Done' ? 'success' : 'neutral'} />
      ),
    },
  ]
}

function activityTable(
  label: string,
  rows: readonly CrmActivity[],
  columns: DataTableColumn<CrmActivity>[],
  phone: boolean,
  extra: { count?: number; search?: string; onClear?: () => void } = {},
) {
  return (
    <DataTable
      label={label}
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      getRowLabel={(row) => `${row.kind}: ${row.subject}`}
      {...(extra.count === undefined ? {} : { count: extra.count })}
      {...(extra.search === undefined
        ? {}
        : {
            filters: { search: extra.search },
            onFiltersChange: () => {
              extra.onClear?.()
            },
          })}
      mobile={{
        title: (row) => row.subject,
        subtitle: (row) => <KindText kind={row.kind} />,
        badge: (row) => (
          <StatusBadge label={row.state} tone={row.state === 'Done' ? 'success' : 'neutral'} />
        ),
        details: ['with', 'when', 'owner'],
      }}
    />
  )
}

// ── Deal OPP-2026-038 ─────────────────────────────────────────────────────────────────────────

export function DealScreen({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const { columns, closing, setClosing, done } = useClosing()
  const [logged] = useLoggedActivities()
  const activityColumns = useActivityColumns(false)
  const deal = dealOf(FEATURED_DEAL)
  if (deal === undefined) return null
  const word = stageWord(columns, deal.id)
  const from = placeOf(columns, deal.id)
  const open = word !== 'Won' && word !== 'Lost'
  const close = (kind: 'won' | 'lost') => {
    if (from !== null)
      setClosing({ kind, move: { cardId: deal.id, from, to: { column: kind, index: 0 } } })
  }
  const activities = [...logged, ...ACTIVITIES].filter((each) => each.deal === deal.id)
  const history: HistoryEntry[] = [
    {
      id: 'd4',
      at: '2026-10-01T13:15:00+02:00',
      actor: { name: 'Customer portal', kind: 'integration' },
      text: `Quote ${deal.quote?.number ?? ''} was accepted by Stanogradnja Plus d.o.o.`,
    },
    {
      id: 'd3',
      at: '2026-09-28T10:02:00+02:00',
      actor: { name: 'Milena Jović' },
      changes: [
        { field: 'Stage', from: 'Opportunity', to: 'Quote' },
        { field: 'Value', from: money('480000.00'), to: money('549120.00') },
      ],
    },
    {
      id: 'd2',
      at: '2026-09-22T11:40:00+02:00',
      actor: { name: 'Milena Jović' },
      changes: [{ field: 'Stage', from: 'Lead', to: 'Opportunity' }],
      text: 'Measured the stairwells of building B on site.',
    },
    {
      id: 'd1',
      at: '2026-09-15T08:55:00+02:00',
      actor: { name: 'Milena Jović' },
      text: 'Created after a call from Vesna Ilić.',
    },
  ]
  const actions = open ? (
    <>
      <Button
        family="destructive"
        emphasis="secondary"
        icon={ThumbsDown}
        label="Mark as lost"
        onClick={() => {
          close('lost')
        }}
      />
      <Button
        family="positive"
        emphasis="primary"
        icon={Trophy}
        label="Mark as won"
        onClick={() => {
          close('won')
        }}
      />
    </>
  ) : null
  return (
    <CrmShell
      phone={phone}
      tab="pipeline"
      crumbs={[{ label: 'Pipeline', href: `#${BL_ROUTES.pipeline}` }, { label: deal.id }]}
      {...(phone && actions !== null ? { bottomBar: actions } : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={deal.title}
        back={{ href: `#${BL_ROUTES.pipeline}`, label: 'Pipeline' }}
        status={stageBadge(word)}
        subtitle={
          <>
            <bdi dir="ltr">{deal.id}</bdi> · {deal.customer}
          </>
        }
        keyFigures={[
          { label: 'Value', value: money(deal.value) },
          { label: 'Probability', value: DEAL_DETAILS.probability },
          { label: 'Expected close', value: <DateText value={DEAL_DETAILS.expectedClose} /> },
        ]}
        {...(phone || actions === null ? {} : { actions })}
        sections={[
          {
            id: 'deal',
            label: 'Deal',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'Customer', value: deal.customer },
                  {
                    label: 'Contact',
                    value: (
                      <Link href={`#${BL_ROUTES.contact}`} className={LINK}>
                        {DEAL_DETAILS.contact}
                      </Link>
                    ),
                  },
                  { label: 'Owner', value: deal.owner },
                  { label: 'Source', value: DEAL_DETAILS.source },
                  {
                    label: 'Created',
                    value: format.date(DEAL_DETAILS.created),
                    numeric: true,
                  },
                  {
                    label: 'Next',
                    value:
                      deal.next === undefined
                        ? '—'
                        : `${deal.next.text}, ${format.date(deal.next.due)}`,
                  },
                ]}
              />
            ),
          },
          {
            id: 'quote',
            label: 'Quote',
            description: 'In the sales chain: order, delivery and invoice follow from it.',
            content:
              deal.quote === undefined ? (
                <p className="m-0 text-sm text-secondary">No quote yet.</p>
              ) : (
                <RelatedDocuments
                  label="Quote"
                  items={[
                    {
                      key: deal.quote.number,
                      type: 'Quote',
                      number: deal.quote.number,
                      href: `#${deal.quote.path}`,
                      status: (
                        <StatusBadge
                          label={deal.quote.state}
                          tone={deal.quote.state === 'Accepted' ? 'success' : 'neutral'}
                        />
                      ),
                    },
                  ]}
                />
              ),
          },
          {
            id: 'activities',
            label: 'Activities',
            flush: true,
            content: activityTable('Activities', activities, activityColumns, phone),
          },
          {
            id: 'history',
            label: 'History',
            content: <HistoryList label={`History of ${deal.id}`} entries={history} />,
          },
        ]}
      />
      <ClosingDialogs
        closing={closing}
        onClose={() => {
          setClosing(null)
        }}
        onDone={done}
      />
    </CrmShell>
  )
}

// ── Vesna Ilić ────────────────────────────────────────────────────────────────────────────────

const QUOTE_TONES = { Accepted: 'success', Ordered: 'success', Sent: 'neutral' } as const

function LogDrawer({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (activity: CrmActivity) => void
}) {
  const [kind, setKind] = useState<string>('Call')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState<string | null>(BL_TODAY)
  const [notes, setNotes] = useState('')
  const [missing, setMissing] = useState(false)
  return (
    <Drawer
      side="end"
      open={open}
      onOpenChange={onOpenChange}
      title="Log activity"
      subject={CONTACT.name}
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
            intent="save"
            label="Save"
            onClick={() => {
              if (subject.trim() === '') {
                setMissing(true)
                return
              }
              const found = ACTIVITY_KINDS.find((each) => each.value === kind)
              onSave({
                id: `logged-${subject}`,
                kind: (found?.value ?? 'Call') as ActivityKind,
                subject:
                  notes.trim() === '' ? subject.trim() : `${subject.trim()}. ${notes.trim()}`,
                with: `${CONTACT.name}, ${CONTACT.company}`,
                contact: true,
                deal: FEATURED_DEAL,
                start: `${date ?? BL_TODAY}T${BL_NOW}`,
                end: `${date ?? BL_TODAY}T${BL_NOW}`,
                owner: SALES_ENGINEER.name,
                state: 'Done',
              })
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <RadioGroupField label="Kind" options={ACTIVITY_KINDS} value={kind} onChange={setKind} />
        <TextField
          label="Subject"
          required
          value={subject}
          onChange={(next) => {
            setSubject(next)
            setMissing(false)
          }}
          {...(missing ? { error: 'Write what it was about.' } : {})}
        />
        <DateField label="Date" value={date} onChange={setDate} />
        <TextAreaField label="Notes" rows={4} value={notes} onChange={setNotes} />
      </div>
    </Drawer>
  )
}

export function ContactScreen({ phone, logging = false }: { phone: boolean; logging?: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [columns] = usePipeline()
  const [logged, setLogged] = useLoggedActivities()
  const [drawer, setDrawer] = useState(logging)
  const toCard = useDealCard()
  const deals = CONTACT_DEALS.flatMap((id) => {
    const deal = dealOf(id)
    return deal === undefined ? [] : [deal]
  })
  const dealColumns: DataTableColumn<Deal>[] = [
    {
      id: 'deal',
      header: 'Deal',
      minWidth: 220,
      cell: (row) =>
        row.id === FEATURED_DEAL ? (
          <Link href={`#${BL_ROUTES.deal}`} className={`${LINK} font-medium`}>
            {row.title}
          </Link>
        ) : (
          <span className="bidi-content font-medium">{row.title}</span>
        ),
    },
    { id: 'stage', header: 'Stage', cell: (row) => stageBadge(stageWord(columns, row.id)) },
    { id: 'value', header: 'Value', align: 'end', numeric: true, cell: (row) => money(row.value) },
    {
      id: 'next',
      header: 'Next',
      cell: (row) =>
        row.next === undefined ? (
          '—'
        ) : (
          <span className="inline-flex flex-wrap gap-x-1">
            <span>{row.next.text},</span>
            <DueDate value={row.next.due} />
          </span>
        ),
    },
  ]
  const quotes = CONTACT_QUOTES.flatMap((number) => {
    const deal = DEALS.find((each) => each.quote?.number === number)
    return deal?.quote === undefined ? [] : [deal.quote]
  })
  const timeline: HistoryEntry[] = [
    ...logged
      .filter((each) => each.contact === true)
      .map((each) => ({
        id: each.id,
        at: `${each.start}:00+02:00`,
        actor: { name: each.owner },
        text: `${each.kind}: ${each.subject}`,
      })),
    {
      id: 't7',
      at: '2026-10-13T10:05:00+02:00',
      actor: { name: 'Milena Jović' },
      text: 'Meeting: building C, the balconies on site. Vesna wants the slabs in two deliveries.',
    },
    {
      id: 't6',
      at: '2026-10-12T07:10:00+02:00',
      actor: { name: 'Liro', kind: 'system' },
      text: 'Delivery note OTP-2026-0058 delivered; received by Vesna Ilić.',
    },
    {
      id: 't5',
      at: '2026-10-06T10:10:00+02:00',
      actor: { name: 'Milena Jović' },
      text: 'E-mail: quote PON-2026-0032 sent.',
    },
    {
      id: 't4',
      at: '2026-10-01T13:30:00+02:00',
      actor: { name: 'Milena Jović' },
      text: 'Call: after the acceptance; delivery agreed for 12.10.',
    },
    {
      id: 't3',
      at: '2026-10-01T13:15:00+02:00',
      actor: { name: 'Customer portal', kind: 'integration' },
      text: 'Quote PON-2026-0031 accepted.',
    },
    {
      id: 't2',
      at: '2026-09-28T10:02:00+02:00',
      actor: { name: 'Milena Jović' },
      text: 'E-mail: quote PON-2026-0031 sent.',
    },
    {
      id: 't1',
      at: '2026-09-22T11:00:00+02:00',
      actor: { name: 'Milena Jović' },
      text: 'Meeting at Novo naselje: the stairwells of building B measured.',
    },
  ]
  const log = (
    <Button
      family="neutral"
      emphasis="secondary"
      icon={MessageSquareText}
      label="Log activity"
      onClick={() => {
        setDrawer(true)
      }}
    />
  )
  const create = <Button intent="create" label="New deal" />
  return (
    <CrmShell
      phone={phone}
      tab="contacts"
      crumbs={[{ label: 'Contacts' }, { label: CONTACT.name }]}
      {...(phone
        ? {
            bottomBar: (
              <>
                {log}
                {create}
              </>
            ),
          }
        : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={CONTACT.name}
        back={{ href: `#${BL_ROUTES.pipeline}`, label: 'Pipeline' }}
        subtitle={`${CONTACT.position} · ${CONTACT.company}`}
        keyFigures={[
          { label: 'Open deals', value: String(deals.length) },
          { label: 'Value of open deals', value: money(CONTACT.openValue) },
          { label: 'Last contact', value: <DateText value={CONTACT.lastContact} /> },
        ]}
        {...(phone
          ? {}
          : {
              actions: (
                <>
                  {log}
                  {create}
                </>
              ),
            })}
        sections={[
          {
            id: 'contact',
            label: 'Contact',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'E-mail', value: <bdi dir="ltr">{CONTACT.email}</bdi> },
                  { label: 'Phone', value: <bdi dir="ltr">{CONTACT.phone}</bdi> },
                  { label: 'Company', value: CONTACT.company },
                  { label: 'Address', value: CONTACT.address },
                  { label: 'Owner', value: CONTACT.owner },
                  { label: 'Prefers', value: CONTACT.prefers },
                ]}
              />
            ),
          },
          {
            id: 'deals',
            label: 'Open deals',
            flush: true,
            content: (
              <DataTable
                label="Open deals"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={dealColumns}
                rows={deals}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.title}
                mobile={{
                  badge: (row) => stageBadge(stageWord(columns, row.id)),
                  subtitle: (row) => toCard(row).meta,
                  details: ['next'],
                }}
              />
            ),
          },
          {
            id: 'quotes',
            label: 'Quotes',
            content: (
              <RelatedDocuments
                label="Quotes"
                items={quotes.map((quote) => ({
                  key: quote.number,
                  type: 'Quote',
                  number: quote.number,
                  href: `#${quote.path}`,
                  status: (
                    <StatusBadge label={quote.state} tone={toneFor(quote.state, QUOTE_TONES)} />
                  ),
                }))}
              />
            ),
          },
          {
            id: 'timeline',
            label: 'Timeline',
            description: `Calls, meetings, e-mails and documents with ${CONTACT.name}`,
            content: <HistoryList label={`Timeline of ${CONTACT.name}`} entries={timeline} />,
          },
        ]}
      />
      <LogDrawer
        open={drawer}
        onOpenChange={setDrawer}
        onSave={(activity) => {
          setLogged((list) => [activity, ...list])
          setDrawer(false)
          notice.success(
            `The ${activity.kind.toLocaleLowerCase()} is logged for ${format.date(activity.start.slice(0, 10))}.`,
          )
        }}
      />
    </CrmShell>
  )
}

// ── The activities ────────────────────────────────────────────────────────────────────────────

function inView(activity: CrmActivity, view: string) {
  if (view === 'mine') return activity.owner === SALES_ENGINEER.name && activity.state === 'Planned'
  if (view === 'overdue') return isOverdue(activity)
  if (view === 'done') return activity.state === 'Done'
  return true
}

function ShowAs({ calendar }: { calendar: boolean }) {
  const navigate = useContext(Navigate)
  return (
    <Button
      family="neutral"
      emphasis="secondary"
      icon={calendar ? List : CalendarDays}
      label={calendar ? 'Show as list' : 'Show as calendar'}
      onClick={() => {
        navigate(calendar ? BL_ROUTES.activities : BL_ROUTES.calendar)
      }}
    />
  )
}

export function ActivitiesScreen({ phone }: { phone: boolean }) {
  const [logged] = useLoggedActivities()
  const columns = useActivityColumns(true)
  const [view, setView] = useState('mine')
  const [search, setSearch] = useState('')
  const all = [...logged, ...ACTIVITIES]
  const needle = search.trim().toLocaleLowerCase()
  const rows = all.filter(
    (row) =>
      inView(row, view) &&
      (needle === '' || `${row.subject} ${row.with}`.toLocaleLowerCase().includes(needle)),
  )
  const create = <Button intent="create" label="New activity" />
  return (
    <CrmShell
      phone={phone}
      tab="activities"
      crumbs={[{ label: 'CRM' }, { label: 'Activities' }]}
      {...(phone ? { bottomBar: create } : {})}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Activities"
        actions={
          <>
            <ShowAs calendar={false} />
            {phone ? null : create}
          </>
        }
        views={ACTIVITY_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: all.filter((row) => inView(row, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={[]}
            values={{}}
            onValuesChange={() => undefined}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Subject or contact"
          />
        }
      >
        {activityTable('Activities', rows, columns, phone, {
          count: rows.length,
          search,
          onClear: () => {
            setSearch('')
          },
        })}
      </ListPage>
    </CrmShell>
  )
}

export function ActivityCalendarScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [logged] = useLoggedActivities()
  const all = [...logged, ...ACTIVITIES]
  const events: CalendarEvent[] = all.map((activity) => ({
    id: activity.id,
    title: `${activity.kind}: ${activity.subject}`,
    start: activity.start,
    ...(activity.end === undefined || activity.end === activity.start ? {} : { end: activity.end }),
    tone: activity.state === 'Done' ? 'success' : isOverdue(activity) ? 'danger' : 'neutral',
    description: `${activity.with} · ${activity.owner}${activity.state === 'Done' ? ' · Done' : isOverdue(activity) ? ' · Overdue' : ''}`,
  }))
  return (
    <CrmShell
      phone={phone}
      tab="activities"
      crumbs={[{ label: 'Activities', href: `#${BL_ROUTES.activities}` }, { label: 'Calendar' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader title="Activity calendar" actions={<ShowAs calendar />} />
        <CalendarView
          label="Activities"
          layout={phone ? 'phone' : 'desktop'}
          events={events}
          defaultView={phone ? 'agenda' : 'week'}
          defaultDate={BL_TODAY}
          now={BL_NOW}
          dayStart="08:00"
          dayEnd="17:00"
          onSelect={(event) => {
            const activity = all.find((each) => each.id === event.id)
            if (activity?.contact === true) navigate(BL_ROUTES.contact)
            else if (activity?.deal === FEATURED_DEAL) navigate(BL_ROUTES.deal)
            else notice.info(`${event.title} is not part of the examples.`)
          }}
        />
      </Frame>
    </CrmShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BL_ROUTES: ExampleRoute[] = [
  { path: BL_ROUTES.pipeline, render: (phone) => <PipelineScreen phone={phone} /> },
  {
    path: BL_ROUTES.pipelineLost,
    render: (phone) => <PipelineScreen phone={phone} lost="OPP-2026-037" />,
  },
  { path: BL_ROUTES.deal, render: (phone) => <DealScreen phone={phone} /> },
  { path: BL_ROUTES.contact, render: (phone) => <ContactScreen phone={phone} /> },
  { path: BL_ROUTES.contactLog, render: (phone) => <ContactScreen phone={phone} logging /> },
  { path: BL_ROUTES.activities, render: (phone) => <ActivitiesScreen phone={phone} /> },
  { path: BL_ROUTES.calendar, render: (phone) => <ActivityCalendarScreen phone={phone} /> },
]

import {
  BellRing,
  CircleCheck,
  Columns2,
  FileCheck2,
  FileText,
  Inbox,
  MessageSquareWarning,
  Send,
} from 'lucide-react'
import { useContext, useState } from 'react'
import {
  ActionGroup,
  Alert,
  AttachmentList,
  Button,
  ConfirmDialog,
  DataTable,
  DateField,
  DateText,
  Dialog,
  DocumentTotals,
  Drawer,
  FileDropzone,
  FilterBar,
  KeyFigures,
  KeyValueList,
  ListPage,
  MoneyField,
  MoneyText,
  PortalShell,
  PrintDocument,
  ProgressBar,
  RadioGroupField,
  SectionCard,
  SelectField,
  StatusBadge,
  TextAreaField,
  toneFor,
  Toaster,
  UnavailableAction,
  ValueComparison,
  WorklistPage,
  notice,
  useLiro,
  type Attachment,
  type ComparisonRow,
  type DataTableColumn,
  type DataTableFilters,
  type FilterDefinition,
  type PrintColumn,
  type WorklistItem,
} from '@veljaos/ui'
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import { SELLER } from './data-J'
import { U_ROUTES } from './data-U'
import {
  balanceOf,
  CUT_OFF,
  DISPUTED,
  inIosView,
  IOS_STATES,
  IOS_TONES,
  IOS_VIEWS,
  lineDifference,
  mayRemind,
  METHOD_TEXT,
  NEXT_NUMBER,
  partnerById,
  PARTNER_PERSON,
  PARTNERS,
  RECON_LINES,
  reconTotals,
  THEIR_FILE,
  W_ROUTES,
  W_TODAY,
  type IosItem,
  type IosPartner,
  type IosState,
  type IosView,
  type ReconLine,
  type SendMethod,
} from './data-W'
import { AccountingShell } from './screens-U'
import { Frame, Tenant } from './screens-G'

/*
 * Group W's example screens (P5.33, IOS — statements of open items): Kvadrat Gradnja d.o.o. at the
 * cut-off date 30.09.2026, on 14 October 2026 at 09:40.
 * - The partners (ListPage): each with its balance in our books and the statement's state (Not
 *   sent, Sent, Opened, Confirmed, Disputed, No answer) in words and tone, how it went, the answer
 *   date or the reminders; views by state. Checked partners are prepared together: the cut-off
 *   date, e-mail or a signed PDF through Liro Bridge (where the partner has it — the data says),
 *   a preview of each statement (PrintDocument), Send; reminders to those who have not answered.
 * - The partner's side (PortalShell, Liro's partner portal): Elektro Sistem d.o.o.'s accountant
 *   sees the statement, its items and the balance; Confirm, or Dispute with their balance, what
 *   differs and their own list of open items.
 * - The disputed statement, line by line (WorklistPage, the bank statement's pattern): our open
 *   items beside theirs (ValueComparison), the two differences marked — invoice ES-2026-0533 they
 *   have and we do not, and our payment of ES-2026-0498 booked on different dates — each resolved
 *   with the application's suggestion; the balances, what is explained and the progress above;
 *   "Send our answer" once nothing is left.
 * The screens play the application (data-W.ts): the partners live above the screens
 * (`useExampleState`); sums are whole paras; the components show and report.
 */

export { W_ROUTES }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

function usePartners() {
  return useExampleState<IosPartner[]>('W.partners', () => PARTNERS)
}

function stateBadge(state: IosState | 'Reconciled') {
  return <StatusBadge label={state} tone={toneFor(state, IOS_TONES)} />
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

/** The day after `days` days, as YYYY-MM-DD (a calendar date, no time zone). */
function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** How long a partner has to answer. */
const ANSWER_DAYS = 8

/** "Balance at 30.09.2026.": the cut-off date through the provider's format. */
function CutOffText({ prefix }: { prefix: string }) {
  const { format } = useLiro()
  return (
    <span className="bidi-isolate">
      {prefix} {format.date(CUT_OFF)}
    </span>
  )
}

// ── The statement as the partner receives it ─────────────────────────────────────────────────

const ITEM_COLUMNS: PrintColumn<IosItem>[] = [
  { key: 'document', header: 'Document', cell: (item) => <bdi>{item.document}</bdi> },
  { key: 'kind', header: 'Kind', cell: (item) => item.kind },
  { key: 'date', header: 'Date', cell: (item) => <DateText value={item.date} /> },
  { key: 'due', header: 'Due', cell: (item) => <DateText value={item.due} /> },
  { key: 'amount', header: 'Open amount', align: 'end', cell: (item) => money(item.amount) },
]

/** The statement on paper: who to whom, the open items, the balance, what to do. */
function StatementPrint({
  partner,
  number,
  cutOff,
  date,
}: {
  partner: IosPartner
  number: string
  cutOff: string
  date: string
}) {
  const { format } = useLiro()
  const answerBy = addDays(date, ANSWER_DAYS)
  return (
    <PrintDocument
      title="Statement of open items"
      number={number}
      footer={`${SELLER.name} · ${number} · Illustrative`}
      details={[
        { key: 'number', label: 'Number', value: <bdi>{number}</bdi>, numeric: true },
        { key: 'cutOff', label: 'Cut-off date', value: <DateText value={cutOff} />, numeric: true },
        { key: 'date', label: 'Date', value: <DateText value={date} />, numeric: true },
        {
          key: 'answerBy',
          label: 'Please answer by',
          value: <DateText value={answerBy} />,
          numeric: true,
        },
      ]}
      parties={[
        {
          key: 'from',
          label: 'From',
          name: SELLER.name,
          lines: [SELLER.address, SELLER.city],
          details: [{ key: 'pib', label: 'PIB', value: SELLER.taxId, numeric: true }],
        },
        {
          key: 'to',
          label: 'To',
          name: partner.name,
          details: [
            { key: 'pib', label: 'PIB', value: partner.taxId, numeric: true },
            { key: 'email', label: 'E-mail', value: partner.email },
          ],
        },
      ]}
      lines={{
        caption: 'Open items',
        columns: ITEM_COLUMNS,
        rows: partner.items,
        rowKey: (item) => item.document,
      }}
      totals={{
        label: 'Balance',
        rows: [],
        total: {
          key: 'balance',
          label: `Balance at ${format.date(cutOff)}`,
          value: balanceOf(partner),
          currency: 'RSD',
        },
      }}
      notes={[
        partner.side === 'Supplier'
          ? `According to our books we owe ${partner.name} the balance above.`
          : `According to our books ${partner.name} owes us the balance above.`,
        `Please confirm the balance, or tell us what differs, by ${format.date(answerBy)} in Liro’s partner portal or by replying to this e-mail.`,
      ]}
    />
  )
}

// ── The partners ──────────────────────────────────────────────────────────────────────────────

const IOS_FILTERS: FilterDefinition[] = [
  {
    id: 'state',
    label: 'State',
    type: 'multiSelect',
    options: IOS_STATES.map((state) => ({ value: state, label: state })),
  },
  {
    id: 'side',
    label: 'Partner',
    type: 'select',
    options: [
      { value: 'Supplier', label: 'Suppliers' },
      { value: 'Customer', label: 'Customers' },
    ],
  },
]

function matchesIos(partner: IosPartner, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![partner.name, partner.taxId, partner.number ?? ''].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const states = filters.state
  if (Array.isArray(states) && states.length > 0 && !states.includes(partner.state)) return false
  const side = filters.side
  return typeof side !== 'string' || side === '' || side === partner.side
}

/** What the state cell says under the badge: the answer date, the reminder, their balance. */
function StateNote({ partner }: { partner: IosPartner }) {
  const { format } = useLiro()
  const last = partner.reminders.at(-1)
  const text =
    partner.state === 'Disputed' && partner.theirBalance !== undefined
      ? `Their balance ${format.money(partner.theirBalance, 'RSD')}`
      : partner.state === 'Confirmed' && partner.answered !== undefined
        ? `Confirmed ${format.date(partner.answered.slice(0, 10))}`
        : last !== undefined
          ? `Reminded ${format.date(last)}`
          : partner.answerBy !== undefined
            ? `Answer by ${format.date(partner.answerBy)}`
            : null
  return text === null ? null : <span className="bidi-content text-xs text-secondary">{text}</span>
}

function SentNote({ partner }: { partner: IosPartner }) {
  const { format } = useLiro()
  if (partner.sent === undefined || partner.method === undefined) {
    return <span className="text-tertiary">—</span>
  }
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-isolate">{partner.number}</span>
      <span className="bidi-content text-xs text-secondary">
        {format.date(partner.sent)} · {partner.method === 'bridge' ? 'Liro Bridge' : 'E-mail'}
        {partner.opened === undefined ? '' : `, opened ${format.date(partner.opened)}`}
      </span>
    </span>
  )
}

const IOS_COLUMNS: DataTableColumn<IosPartner>[] = [
  {
    id: 'partner',
    header: 'Partner',
    minWidth: 220,
    cell: (partner) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{partner.name}</span>
        <span className="bidi-isolate text-xs text-secondary">PIB {partner.taxId}</span>
      </span>
    ),
  },
  { id: 'side', header: 'Kind', cell: (partner) => partner.side },
  {
    id: 'balance',
    header: <CutOffText prefix="Balance at" />,
    label: 'Balance at the cut-off',
    align: 'end',
    numeric: true,
    cell: (partner) => money(balanceOf(partner)),
  },
  {
    id: 'statement',
    header: 'Statement',
    minWidth: 200,
    cell: (partner) => <SentNote partner={partner} />,
  },
  {
    id: 'state',
    header: 'State',
    minWidth: 180,
    cell: (partner) => (
      <span className="flex flex-col items-start gap-1">
        {stateBadge(partner.state)}
        <StateNote partner={partner} />
      </span>
    ),
  },
]

/** The partners a statement goes to, and how. */
function goesTo(partner: IosPartner, method: SendMethod): string {
  return method === 'bridge' && partner.bridge ? 'Liro Bridge, signed' : partner.email
}

const CHOSEN_COLUMNS = (method: SendMethod): DataTableColumn<IosPartner>[] => [
  { id: 'partner', header: 'Partner', cell: (partner) => partner.name },
  {
    id: 'balance',
    header: 'Balance',
    align: 'end',
    numeric: true,
    cell: (partner) => money(balanceOf(partner)),
  },
  {
    id: 'to',
    header: 'Goes to',
    cell: (partner) => <span className="bidi-isolate">{goesTo(partner, method)}</span>,
  },
]

interface ListStart {
  view: IosView
  prepare?: 'choose' | 'preview'
  remind?: boolean
}

export function IosList({ phone, start }: { phone: boolean; start: ListStart }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [partners, setPartners] = usePartners()
  const [view, setView] = useState<IosView>(start.view)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const rows = partners.filter(
    (partner) => inIosView(partner, view) && matchesIos(partner, search, filters),
  )
  const [selection, setSelection] = useState<string[]>(() =>
    start.prepare !== undefined
      ? partners.filter((partner) => partner.state === 'Not sent').map((partner) => partner.id)
      : start.remind === true
        ? partners
            .filter(mayRemind)
            .slice(0, 3)
            .map((partner) => partner.id)
        : [],
  )
  const [step, setStep] = useState<'choose' | 'preview' | null>(start.prepare ?? null)
  const [reminding, setReminding] = useState(start.remind === true)
  const [cutOff, setCutOff] = useState<string | null>(CUT_OFF)
  const [method, setMethod] = useState<SendMethod>('bridge')
  const [previewed, setPreviewed] = useState(0)

  const checked = partners.filter((partner) => selection.includes(partner.id))
  // "Prepare statements…" takes the checked partners, or every partner not sent yet.
  const chosen = checked.length > 0 ? checked : partners.filter((p) => p.state === 'Not sent')
  const remindable = checked.filter(mayRemind)
  const count = (value: number, one: string, many: string) =>
    `${format.number(String(value))} ${value === 1 ? one : many}`
  const bridgeCount = chosen.filter((partner) => partner.bridge).length
  const answerBy = addDays(W_TODAY, ANSWER_DAYS)

  const send = () => {
    const numbers = new Map(
      chosen
        .filter((partner) => partner.number === undefined)
        .map((partner, at) => [
          partner.id,
          `IOS-2026-${String(NEXT_NUMBER + at).padStart(4, '0')}`,
        ]),
    )
    setPartners((list) =>
      list.map((partner) =>
        chosen.some((each) => each.id === partner.id)
          ? {
              ...partner,
              state: 'Sent',
              number: partner.number ?? numbers.get(partner.id) ?? '',
              method: method === 'bridge' && partner.bridge ? 'bridge' : 'email',
              sent: W_TODAY,
              answerBy,
              reminders: [],
            }
          : partner,
      ),
    )
    notice.success(`${count(chosen.length, 'statement', 'statements')} sent.`)
    setStep(null)
    setSelection([])
  }
  const remind = () => {
    setPartners((list) =>
      list.map((partner) =>
        remindable.some((each) => each.id === partner.id)
          ? { ...partner, reminders: [...partner.reminders, W_TODAY], answerBy }
          : partner,
      ),
    )
    notice.success(`${count(remindable.length, 'reminder', 'reminders')} sent.`)
    setSelection([])
  }
  const current = chosen[Math.min(previewed, chosen.length - 1)]

  return (
    <AccountingShell
      phone={phone}
      tab="ios"
      crumbs={[{ label: 'Accounting' }, { label: 'Statements of open items' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Statements of open items"
        actions={
          <Button
            family="primary"
            icon={FileCheck2}
            emphasis="primary"
            label="Prepare statements…"
            onClick={() => {
              setPreviewed(0)
              setStep('choose')
            }}
          />
        }
        views={IOS_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: partners.filter((partner) => inIosView(partner, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as IosView)
          setSelection([])
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={IOS_FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Partner, PIB or statement"
          />
        }
      >
        <DataTable
          label="Partners"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={IOS_COLUMNS}
          rows={rows}
          getRowId={(partner) => partner.id}
          getRowLabel={(partner) => partner.name}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(partner) => {
            if (partner.number === DISPUTED) {
              navigate(W_ROUTES.reconcile)
              return
            }
            setSelection([partner.id])
            setPreviewed(0)
            setStep('preview')
          }}
          selection={selection}
          onSelectionChange={setSelection}
          onSelectAll={() => {
            setSelection(rows.map((partner) => partner.id))
          }}
          bulkActions={[
            {
              key: 'remind',
              family: 'neutral',
              icon: BellRing,
              label: 'Send reminder…',
              ...(remindable.length > 0
                ? {}
                : { unavailableReason: 'None of the checked partners is waiting for an answer.' }),
              onClick: () => {
                setReminding(true)
              },
            },
            {
              key: 'prepare',
              family: 'neutral',
              icon: FileCheck2,
              label: 'Prepare statements…',
              onClick: () => {
                setPreviewed(0)
                setStep('choose')
              },
            },
          ]}
          mobile={{
            title: (partner) => partner.name,
            subtitle: (partner) => <span className="bidi-content">{partner.side}</span>,
            badge: (partner) => stateBadge(partner.state),
            details: ['balance', 'statement'],
          }}
        />
      </ListPage>
      <Dialog
        open={step !== null}
        onOpenChange={(open) => {
          if (!open) setStep(null)
        }}
        size="wide"
        title={
          step === 'preview' && chosen.length === 1
            ? 'Statement preview'
            : `Send ${count(chosen.length, 'statement', 'statements')}?`
        }
        {...(step === 'preview' && current !== undefined ? { subject: current.name } : {})}
        description={
          step === 'preview'
            ? 'As the partner receives it.'
            : 'Each partner gets its open items in our books at the cut-off date and is asked to confirm or dispute them.'
        }
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setStep(null)
              }}
            />
            {step === 'choose' ? (
              <Button
                intent="preview"
                label="Preview…"
                onClick={() => {
                  setStep('preview')
                }}
              />
            ) : (
              <Button
                intent="back"
                label="Back"
                emphasis="secondary"
                onClick={() => {
                  setStep('choose')
                }}
              />
            )}
            {cutOff === null ? (
              <UnavailableAction
                family="primary"
                icon={Send}
                emphasis="primary"
                label="Send"
                reason="Choose the cut-off date."
              />
            ) : (
              <Button
                family="primary"
                icon={Send}
                emphasis="primary"
                label={`Send ${count(chosen.length, 'statement', 'statements')}`}
                onClick={send}
              />
            )}
          </>
        }
      >
        {step === 'choose' ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField
                label="Cut-off date"
                value={cutOff}
                onChange={setCutOff}
                required
                {...(cutOff === null ? { error: 'Choose the cut-off date.' } : {})}
              />
              <RadioGroupField
                label="Send as"
                options={[
                  {
                    value: 'bridge',
                    label: METHOD_TEXT.bridge,
                    description: `${format.number(String(bridgeCount))} of ${format.number(String(chosen.length))} partners have Liro Bridge; the others get an e-mail.`,
                  },
                  { value: 'email', label: METHOD_TEXT.email, description: 'To every partner.' },
                ]}
                value={method}
                onChange={(value) => {
                  setMethod(value as SendMethod)
                }}
              />
            </div>
            <DataTable
              label="Statements to send"
              layout={phone ? 'cards' : 'table'}
              columns={CHOSEN_COLUMNS(method)}
              rows={chosen}
              getRowId={(partner) => partner.id}
              getRowLabel={(partner) => partner.name}
              stickyHeader={false}
              mobile={{
                title: (partner) => partner.name,
                subtitle: (partner) => (
                  <span className="bidi-isolate">{goesTo(partner, method)}</span>
                ),
                badge: (partner) => money(balanceOf(partner)),
              }}
            />
          </div>
        ) : current === undefined ? null : (
          <div className="flex flex-col gap-4">
            {chosen.length > 1 && (
              <SelectField
                label="Partner"
                options={chosen.map((partner, index) => ({
                  value: String(index),
                  label: partner.name,
                }))}
                value={String(Math.min(previewed, chosen.length - 1))}
                onChange={(value) => {
                  setPreviewed(Number(value))
                }}
              />
            )}
            <StatementPrint
              partner={current}
              number={current.number ?? `IOS-2026-${String(NEXT_NUMBER).padStart(4, '0')}`}
              cutOff={cutOff ?? CUT_OFF}
              date={W_TODAY}
            />
          </div>
        )}
      </Dialog>
      <ConfirmDialog
        open={reminding}
        onOpenChange={setReminding}
        family="neutral"
        actionIcon={BellRing}
        tone="info"
        icon={BellRing}
        title={`Send a reminder to ${count(remindable.length, 'partner', 'partners')}?`}
        message={`They get their statement again, asked to answer by ${format.date(answerBy)}.${
          checked.length > remindable.length
            ? ` ${count(checked.length - remindable.length, 'checked partner has', 'checked partners have')} answered or has no statement yet and gets none.`
            : ''
        }`}
        confirmLabel="Send reminders"
        onConfirm={remind}
      />
    </AccountingShell>
  )
}

// ── The disputed statement, line by line ─────────────────────────────────────────────────────

type LineState = 'match' | 'toResolve' | 'resolved'

const LINE_BADGE: Record<LineState, { label: string; tone: 'success' | 'warning' }> = {
  match: { label: 'Matches', tone: 'success' },
  toResolve: { label: 'To resolve', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'success' },
}

interface LineWork {
  choice: string
  note: string
  done: boolean
}

function startWork(stage: 'start' | 'resolved'): Record<string, LineWork> {
  return Object.fromEntries(
    RECON_LINES.filter((line) => line.options !== undefined).map((line) => [
      line.id,
      { choice: line.options?.[0]?.value ?? '', note: '', done: stage === 'resolved' },
    ]),
  )
}

function lineState(line: ReconLine, work: LineWork | undefined): LineState {
  if (line.kind === 'match') return 'match'
  return work?.done === true ? 'resolved' : 'toResolve'
}

/** The line's facts, ours beside theirs, the differences marked (the application found them). */
function lineRows(line: ReconLine): ComparisonRow[] {
  const open = (value: string | null, missing: string) => (value === null ? missing : money(value))
  return [
    {
      id: 'document',
      label: 'Document',
      values: [
        line.ours === null ? 'Not in our books' : <bdi key="ours">{line.document}</bdi>,
        line.theirs === null ? 'Not in their books' : <bdi key="theirs">{line.document}</bdi>,
      ],
      ...(line.ours === null || line.theirs === null
        ? { differs: true, note: line.ours === null ? 'Only in their statement' : 'Only in ours' }
        : {}),
    },
    {
      id: 'amount',
      label: 'Amount on the document',
      values: [line.ours === null ? null : money(line.amount), money(line.amount)],
      numeric: true,
    },
    {
      id: 'open',
      label: <CutOffText prefix="Open at" />,
      values: [open(line.ours, 'Not in our books'), open(line.theirs, 'Not in their books')],
      numeric: true,
      ...(line.ours === line.theirs ? {} : { differs: true }),
    },
    ...(line.oursNote === undefined && line.theirsNote === undefined
      ? []
      : [
          {
            id: 'booked',
            label: line.kind === 'timing' ? 'Payment' : 'Booking',
            values: [line.oursNote ?? null, line.theirsNote ?? null] as const,
            differs: true,
            ...(line.kind === 'timing' ? { note: 'Dates differ' } : {}),
          },
        ]),
  ]
}

function LineDetail({
  line,
  work,
  phone,
  onChange,
}: {
  line: ReconLine
  work: LineWork | undefined
  phone: boolean
  onChange: (patch: Partial<LineWork>) => void
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const state = lineState(line, work)
  const difference = lineDifference(line)
  const chosen = line.options?.find((option) => option.value === work?.choice)
  return (
    <div className={phone ? 'flex flex-col gap-6' : 'flex flex-col gap-6 p-6'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="bidi-content m-0 text-h2 text-primary">
            <bdi>{line.document}</bdi>
          </h2>
          <p className="bidi-content m-0 text-sm text-secondary">
            Supplier invoice of {format.date(line.date)}, due {format.date(line.due)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="bidi-isolate text-xs text-secondary">
            {difference === 0n ? 'No difference' : 'Difference'}
          </span>
          <bdi className="text-xl font-semibold whitespace-nowrap text-primary tabular-nums">
            {format.money(decimal(difference === 0n ? paras(line.amount) : difference), 'RSD')}
          </bdi>
          <StatusBadge label={LINE_BADGE[state].label} tone={LINE_BADGE[state].tone} />
        </div>
      </div>

      {state === 'match' && (
        <Alert tone="success" title="Matches">
          Both sides have {format.money(line.amount, 'RSD')} open at {format.date(CUT_OFF)}
        </Alert>
      )}
      {state === 'resolved' && chosen !== undefined && (
        <Alert tone="success" title="Resolved">
          {chosen.label}.{work?.note === '' || work === undefined ? '' : ` Note: ${work.note}`}
        </Alert>
      )}

      <section aria-label="Our books and theirs" className="flex flex-col gap-2">
        <h3 className="bidi-content m-0 text-h4 text-primary">Our books and theirs</h3>
        <ValueComparison
          label={`${line.document}: our books and their statement`}
          columns={['Our books', 'Their statement']}
          rows={lineRows(line)}
          layout={phone ? 'phone' : 'desktop'}
        />
      </section>

      {line.kind === 'missing' && (
        <Alert
          icon={Inbox}
          title="In the document inbox"
          actions={
            <Button
              family="neutral"
              icon={Inbox}
              label="Open in the document inbox"
              onClick={() => {
                navigate(U_ROUTES.reviewOf('u2'))
              }}
            />
          }
        >
          {line.suggestion} It is not posted yet, so it was not in our books at{' '}
          {format.date(CUT_OFF)}
        </Alert>
      )}

      {state === 'toResolve' && line.options !== undefined && work !== undefined && (
        <section aria-label="How is this difference resolved?" className="flex flex-col gap-4">
          <RadioGroupField
            label="How is this difference resolved?"
            {...(line.suggestion === undefined
              ? {}
              : { description: `Suggested: ${line.suggestion}` })}
            options={line.options}
            value={work.choice}
            onChange={(choice) => {
              onChange({ choice })
            }}
          />
          <TextAreaField
            label="Note to Elektro Sistem d.o.o. (optional)"
            value={work.note}
            onChange={(note) => {
              onChange({ note })
            }}
          />
        </section>
      )}
    </div>
  )
}

/** All items side by side, as the "All items" dialog shows them. */
function allRows(): ComparisonRow[] {
  return RECON_LINES.map((line) => ({
    id: line.id,
    label: <bdi>{line.document}</bdi>,
    values: [
      line.ours === null ? 'Not in our books' : money(line.ours),
      line.theirs === null ? 'Not in their books' : money(line.theirs),
    ],
    numeric: true,
    ...(line.kind === 'match'
      ? {}
      : {
          differs: true,
          note: line.kind === 'missing' ? 'Only in their statement' : 'Payment dates differ',
        }),
  }))
}

interface ReconcileStart {
  item?: string
  stage?: 'start' | 'resolved'
}

export function IosReconcile({ phone, start }: { phone: boolean; start: ReconcileStart }) {
  const { format } = useLiro()
  const [partners] = usePartners()
  const partner = partnerById('elektro-sistem')
  const listed = partners.find((each) => each.id === 'elektro-sistem') ?? partner
  const [work, setWork] = useState(() => startWork(start.stage ?? 'start'))
  const first = start.item ?? (phone ? undefined : 'r2')
  const [selected, setSelected] = useState<string | undefined>(first)
  const [allOpen, setAllOpen] = useState(false)
  const [answering, setAnswering] = useState(false)
  const [answered, setAnswered] = useState(false)

  const index = RECON_LINES.findIndex((line) => line.id === selected)
  const line = RECON_LINES[index]
  const lineWork = line === undefined ? undefined : work[line.id]
  const change = (id: string, patch: Partial<LineWork>) => {
    setWork((current) => {
      const before = current[id]
      return before === undefined ? current : { ...current, [id]: { ...before, ...patch } }
    })
  }
  const move = (step: number) => {
    const next = RECON_LINES[(index + step + RECON_LINES.length) % RECON_LINES.length]
    if (next !== undefined) setSelected(next.id)
  }
  const totals = reconTotals(RECON_LINES)
  const differences = RECON_LINES.filter((each) => each.kind !== 'match')
  const resolved = differences.filter((each) => work[each.id]?.done === true)
  const explained = decimal(sumUnits(resolved.map(lineDifference)))
  const left = decimal(paras(totals.difference) - paras(explained))
  const progress = `${format.number(String(resolved.length))} of ${format.number(String(differences.length))} differences resolved`
  const open = differences.length - resolved.length

  const resolve = () => {
    if (line === undefined) return
    const id = line.id
    change(id, { done: true })
    const next = differences.find((each) => each.id !== id && work[each.id]?.done !== true)
    if (next !== undefined) setSelected(next.id)
    notice.success(`${line.document} resolved.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          change(id, { done: false })
          setSelected(id)
        },
      },
    })
  }

  const decisions =
    line === undefined || lineWork === undefined || answered ? undefined : lineWork.done ? (
      <Button
        intent="edit"
        label="Change"
        onClick={() => {
          change(line.id, { done: false })
        }}
      />
    ) : (
      <Button
        family="primary"
        icon={CircleCheck}
        emphasis="primary"
        label="Resolve and next"
        onClick={resolve}
      />
    )
  const sendReason = answered
    ? 'Our answer is sent.'
    : open > 0
      ? `${format.number(String(open))} ${open === 1 ? 'difference is' : 'differences are'} not resolved yet.`
      : undefined
  const sendAnswer =
    sendReason === undefined ? (
      <Button
        family="primary"
        icon={Send}
        emphasis="primary"
        label="Send our answer"
        onClick={() => {
          setAnswering(true)
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={Send}
        emphasis="secondary"
        label="Send our answer"
        reason={sendReason}
      />
    )

  const items: WorklistItem[] = RECON_LINES.map((each) => {
    const state = lineState(each, work[each.id])
    const difference = lineDifference(each)
    return {
      id: each.id,
      label: each.document,
      title: <bdi>{each.document}</bdi>,
      subtitle: (
        <span className="bidi-content block">
          {each.kind === 'match'
            ? 'Same in both'
            : each.kind === 'missing'
              ? 'Only in their statement'
              : 'Payment booked on different dates'}
        </span>
      ),
      figure: (
        <bdi>
          {format.money(decimal(difference === 0n ? paras(each.amount) : difference), 'RSD')}
        </bdi>
      ),
      status: <StatusBadge label={LINE_BADGE[state].label} tone={LINE_BADGE[state].tone} />,
    }
  })

  return (
    <AccountingShell
      phone={phone}
      tab="ios"
      crumbs={[
        { label: 'Statements of open items', href: `#${W_ROUTES.list}` },
        { label: DISPUTED },
      ]}
      {...(phone
        ? {
            bottomBar:
              line !== undefined && decisions !== undefined ? (
                <div className="flex gap-2 [&>*]:flex-1">{decisions}</div>
              ) : line === undefined ? (
                sendAnswer
              ) : undefined,
          }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title={`${DISPUTED} · Elektro Sistem d.o.o.`}
        back={{ href: `#${W_ROUTES.list}`, label: 'Statements of open items' }}
        status={stateBadge(answered ? 'Reconciled' : 'Disputed')}
        subtitle={
          <>
            Cut-off <DateText value={CUT_OFF} /> · disputed{' '}
            {listed?.answered === undefined
              ? ''
              : `${format.date(listed.answered.slice(0, 10))} ${listed.answered.slice(11)}`}{' '}
            by {PARTNER_PERSON.name}
          </>
        }
        actions={
          <>
            <Button
              family="neutral"
              icon={Columns2}
              label="All items side by side"
              onClick={() => {
                setAllOpen(true)
              }}
            />
            {phone ? null : sendAnswer}
          </>
        }
        summary={
          <div
            className={
              phone
                ? 'flex flex-col gap-4'
                : 'flex flex-wrap items-end justify-between gap-x-8 gap-y-4'
            }
          >
            <KeyFigures
              layout={phone ? 'phone' : 'desktop'}
              items={[
                { key: 'ours', label: 'Our books', value: money(totals.ours) },
                { key: 'theirs', label: 'Their books', value: money(totals.theirs) },
                { key: 'difference', label: 'Difference', value: money(totals.difference) },
                {
                  key: 'left',
                  label: 'Not explained',
                  value: money(left),
                  ...(paras(left) === 0n ? {} : { tone: 'warning' as const }),
                },
              ]}
            />
            <div className="flex min-w-60 flex-col gap-2">
              <span className="bidi-content text-sm font-medium text-primary">{progress}</span>
              <ProgressBar label={progress} value={resolved.length} max={differences.length} />
            </div>
          </div>
        }
        label={`Items of ${DISPUTED}`}
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        {...(line === undefined
          ? {}
          : {
              detail: (
                <LineDetail
                  key={line.id}
                  line={line}
                  work={lineWork}
                  phone={phone}
                  onChange={(patch) => {
                    change(line.id, patch)
                  }}
                />
              ),
            })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          move(-1)
        }}
        onNext={() => {
          move(1)
        }}
      />
      <Dialog
        open={allOpen}
        onOpenChange={setAllOpen}
        size="wide"
        title="All items side by side"
        subject={`${DISPUTED} · Elektro Sistem d.o.o.`}
        description={`Open items at ${format.date(CUT_OFF)} in our books and in the statement they sent.`}
      >
        <ValueComparison
          label={`Open items at ${format.date(CUT_OFF)}`}
          columns={['Our books', 'Their statement']}
          rowHeader="Document"
          rows={allRows()}
          layout={phone ? 'phone' : 'desktop'}
        />
      </Dialog>
      <ConfirmDialog
        open={answering}
        onOpenChange={setAnswering}
        family="primary"
        actionIcon={Send}
        tone="info"
        icon={Send}
        size="wide"
        title="Send our answer"
        subject={`${DISPUTED} · Elektro Sistem d.o.o.`}
        message="Elektro Sistem d.o.o. receives it signed through Liro Bridge, with each difference and how it is resolved."
        preview={
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
            {differences.map((each) => {
              const option = each.options?.find((o) => o.value === work[each.id]?.choice)
              return (
                <li key={each.id} className="bidi-content text-primary">
                  <bdi className="font-medium">{each.document}</bdi>: {option?.label ?? ''}
                </li>
              )
            })}
          </ul>
        }
        confirmLabel="Send our answer"
        onConfirm={() => {
          setAnswered(true)
          notice.success('Our answer is sent to Elektro Sistem d.o.o.')
        }}
      />
    </AccountingShell>
  )
}

// ── The partner's side ────────────────────────────────────────────────────────────────────────

const PORTAL_ITEM_COLUMNS: DataTableColumn<IosItem>[] = [
  { id: 'document', header: 'Document', cell: (item) => <bdi>{item.document}</bdi> },
  { id: 'kind', header: 'Kind', cell: () => 'Invoice' },
  { id: 'date', header: 'Date', numeric: true, cell: (item) => <DateText value={item.date} /> },
  { id: 'due', header: 'Due', numeric: true, cell: (item) => <DateText value={item.due} /> },
  {
    id: 'amount',
    header: 'Open amount',
    align: 'end',
    numeric: true,
    cell: (item) => money(item.amount),
  },
]

interface PortalStart {
  ask?: 'dispute' | 'confirm'
  answer?: 'disputed'
}

interface DisputeDraft {
  balance: string | null
  note: string
  files: Attachment[]
}

const FILLED: DisputeDraft = {
  balance: '300000.00',
  note: 'Our books also show ES-2026-0498 (84.000,00) and ES-2026-0533 (36.000,00) as open. Our open items are attached.',
  files: [{ id: 'their-file', name: THEIR_FILE, sizeText: '84 KB', state: 'available' }],
}

export function PartnerStatement({ phone, start }: { phone: boolean; start: PortalStart }) {
  const { format } = useLiro()
  const partner = partnerById('elektro-sistem')
  const [asking, setAsking] = useState<'dispute' | 'confirm' | null>(start.ask ?? null)
  const [answer, setAnswer] = useState<'disputed' | 'confirmed' | null>(start.answer ?? null)
  const [draft, setDraft] = useState<DisputeDraft>(
    start.ask === 'dispute' || start.answer === 'disputed'
      ? FILLED
      : { balance: null, note: '', files: [] },
  )
  const [tried, setTried] = useState(false)
  if (partner === undefined) return null
  const balance = balanceOf(partner)
  const missing = draft.balance === null || draft.note.trim() === ''

  const actions =
    answer === null ? (
      <ActionGroup
        actions={[
          {
            key: 'pdf',
            intent: 'download',
            label: 'Signed PDF',
            onClick: () => {
              notice.info(`${DISPUTED}.pdf is downloaded.`)
            },
          },
          {
            key: 'dispute',
            family: 'caution',
            icon: MessageSquareWarning,
            label: 'Dispute…',
            onClick: () => {
              setAsking('dispute')
            },
          },
          {
            key: 'confirm',
            family: 'primary',
            icon: CircleCheck,
            emphasis: 'primary',
            label: 'Confirm',
            onClick: () => {
              setAsking('confirm')
            },
          },
        ]}
      />
    ) : null

  return (
    <Tenant today={W_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{ brandName: 'Liro', productName: 'Partners', href: `#${W_ROUTES.portal}` }}
        participant={{ name: PARTNER_PERSON.name, detail: PARTNER_PERSON.detail }}
        sections={[
          {
            key: 'statements',
            label: 'Statements',
            href: `#${W_ROUTES.portal}`,
            icon: FileCheck2,
            current: true,
          },
          {
            key: 'documents',
            label: 'Documents',
            href: `#${W_ROUTES.portal}`,
            icon: FileText,
          },
        ]}
        footer="Liro partner portal · documents between companies on Liro · Illustrative data"
      >
        <Frame phone={phone}>
          <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="bidi-content m-0 text-h1 text-primary">Statement of open items</h1>
                <p className="bidi-content m-0 text-sm text-secondary">
                  From Kvadrat Gradnja d.o.o. · at <DateText value={CUT_OFF} />
                </p>
              </div>
              {stateBadge(
                answer === 'disputed'
                  ? 'Disputed'
                  : answer === 'confirmed'
                    ? 'Confirmed'
                    : 'Opened',
              )}
            </div>
            {answer === null && (
              <Alert
                tone="info"
                title={`Please answer by ${format.date(partner.answerBy ?? W_TODAY)}`}
              >
                Confirm the balance if your books agree, or dispute it with your balance and what
                differs.
              </Alert>
            )}
            {answer === 'confirmed' && (
              <Alert tone="success" title="You confirmed the balance">
                Kvadrat Gradnja d.o.o. receives your confirmation, signed through Liro Bridge.
              </Alert>
            )}
            {answer === 'disputed' && (
              <Alert tone="warning" icon={MessageSquareWarning} title="You disputed this statement">
                Kvadrat Gradnja d.o.o. checks each difference and answers here.
              </Alert>
            )}
            <SectionCard title="Statement">
              <KeyValueList
                items={[
                  { label: 'Number', value: <bdi>{DISPUTED}</bdi>, numeric: true },
                  { label: 'Cut-off date', value: <DateText value={CUT_OFF} />, numeric: true },
                  {
                    label: 'Sent',
                    value: (
                      <span className="bidi-content">
                        <DateText value={partner.sent ?? W_TODAY} />, signed through Liro Bridge
                      </span>
                    ),
                  },
                  { label: 'To', value: `${partner.name}, PIB ${partner.taxId}` },
                ]}
              />
            </SectionCard>
            <SectionCard title="Open items in Kvadrat Gradnja d.o.o.’s books">
              <div className="flex flex-col gap-4">
                <DataTable
                  label="Open items"
                  layout={phone ? 'cards' : 'table'}
                  columns={PORTAL_ITEM_COLUMNS}
                  rows={partner.items}
                  getRowId={(item) => item.document}
                  getRowLabel={(item) => item.document}
                  stickyHeader={false}
                  mobile={{
                    title: (item) => <bdi>{item.document}</bdi>,
                    subtitle: (item) => (
                      <>
                        Invoice of <DateText value={item.date} />, due <DateText value={item.due} />
                      </>
                    ),
                    badge: (item) => money(item.amount),
                  }}
                />
                <DocumentTotals
                  label="Balance"
                  rows={[]}
                  total={{
                    key: 'balance',
                    label: 'Kvadrat Gradnja d.o.o. owes you',
                    value: balance,
                    currency: 'RSD',
                  }}
                />
              </div>
            </SectionCard>
            {answer === 'disputed' && (
              <SectionCard title="Your answer">
                <KeyValueList
                  items={[
                    {
                      label: 'Balance in your books',
                      value: money(draft.balance),
                      numeric: true,
                    },
                    { label: 'What differs', value: draft.note, fullWidth: true },
                    {
                      label: 'Your open items',
                      value: draft.files[0]?.name ?? '—',
                      fullWidth: true,
                    },
                  ]}
                />
              </SectionCard>
            )}
            {actions !== null && !phone && <div className="flex justify-end">{actions}</div>}
            {actions !== null && phone && <div className="flex flex-col gap-2">{actions}</div>}
          </div>
        </Frame>
        <Drawer
          open={asking === 'dispute'}
          onOpenChange={(open) => {
            setAsking(open ? 'dispute' : null)
          }}
          side="end"
          title="Dispute"
          subject={`${DISPUTED} · Kvadrat Gradnja d.o.o.`}
          description="Tell Kvadrat Gradnja d.o.o. what your books show. They answer each difference here."
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
                family="caution"
                icon={Send}
                emphasis="primary"
                label="Send dispute"
                onClick={() => {
                  if (missing) {
                    setTried(true)
                    return
                  }
                  setAnswer('disputed')
                  setAsking(null)
                  notice.success('Your dispute is sent to Kvadrat Gradnja d.o.o.')
                }}
              />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <MoneyField
              label={`Balance in your books at ${format.date(CUT_OFF)}`}
              description={`Kvadrat Gradnja d.o.o.’s books show ${format.money(balance, 'RSD')}.`}
              currency="RSD"
              required
              value={draft.balance}
              onChange={(value) => {
                setDraft((current) => ({ ...current, balance: value }))
              }}
              {...(tried && draft.balance === null ? { error: 'Enter your balance.' } : {})}
            />
            <TextAreaField
              label="What differs"
              description="The documents or payments that differ, as your books show them."
              required
              value={draft.note}
              onChange={(note) => {
                setDraft((current) => ({ ...current, note }))
              }}
              {...(tried && draft.note.trim() === '' ? { error: 'Say what differs.' } : {})}
            />
            <FileDropzone
              label="Your open items (optional)"
              accept={['.pdf', '.xlsx', '.csv']}
              acceptText="PDF, Excel or CSV"
              maxSize={10 * 1024 * 1024}
              maxSizeText="10 MB"
              multiple={false}
              maxFiles={1}
              existing={draft.files.length}
              layout={phone ? 'phone' : 'desktop'}
              onFiles={(files) => {
                setDraft((current) => ({
                  ...current,
                  files: files.map((file) => ({
                    id: file.name,
                    name: file.name,
                    state: 'available',
                  })),
                }))
              }}
            />
            {draft.files.length > 0 && (
              <AttachmentList
                label="Attached"
                files={draft.files}
                canRemove={() => true}
                onRemove={() => {
                  setDraft((current) => ({ ...current, files: [] }))
                }}
              />
            )}
          </div>
        </Drawer>
        <ConfirmDialog
          open={asking === 'confirm'}
          onOpenChange={(open) => {
            setAsking(open ? 'confirm' : null)
          }}
          family="primary"
          actionIcon={CircleCheck}
          tone="success"
          icon={CircleCheck}
          title="Confirm the balance"
          subject={`${DISPUTED} · ${format.money(balance, 'RSD')}`}
          message="Your confirmation goes to Kvadrat Gradnja d.o.o., signed through Liro Bridge. It cannot be taken back; a later difference is a new statement."
          confirmLabel="Confirm"
          onConfirm={() => {
            setAnswer('confirmed')
            notice.success('The balance is confirmed.')
          }}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

export const GROUP_W_ROUTES: ExampleRoute[] = [
  { path: W_ROUTES.list, render: (phone) => <IosList phone={phone} start={{ view: 'all' }} /> },
  {
    path: W_ROUTES.disputed,
    render: (phone) => <IosList phone={phone} start={{ view: 'disputed' }} />,
  },
  {
    path: W_ROUTES.prepare,
    render: (phone) => <IosList phone={phone} start={{ view: 'notSent', prepare: 'choose' }} />,
  },
  {
    path: W_ROUTES.preview,
    render: (phone) => <IosList phone={phone} start={{ view: 'notSent', prepare: 'preview' }} />,
  },
  {
    path: W_ROUTES.remind,
    render: (phone) => <IosList phone={phone} start={{ view: 'all', remind: true }} />,
  },
  { path: W_ROUTES.reconcile, render: (phone) => <IosReconcile phone={phone} start={{}} /> },
  ...RECON_LINES.map((line) => ({
    path: W_ROUTES.reconcileItem(line.id),
    render: (phone: boolean) => <IosReconcile phone={phone} start={{ item: line.id }} />,
  })),
  {
    path: W_ROUTES.resolved,
    render: (phone) => <IosReconcile phone={phone} start={{ stage: 'resolved' }} />,
  },
  { path: W_ROUTES.portal, render: (phone) => <PartnerStatement phone={phone} start={{}} /> },
  {
    path: W_ROUTES.portalDispute,
    render: (phone) => <PartnerStatement phone={phone} start={{ ask: 'dispute' }} />,
  },
  {
    path: W_ROUTES.portalDisputed,
    render: (phone) => <PartnerStatement phone={phone} start={{ answer: 'disputed' }} />,
  },
  {
    path: W_ROUTES.portalConfirm,
    render: (phone) => <PartnerStatement phone={phone} start={{ ask: 'confirm' }} />,
  },
]

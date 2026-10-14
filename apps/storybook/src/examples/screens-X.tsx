import { Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  AskPage,
  AssistantAnswer,
  AssistantPanel,
  DataTable,
  DateText,
  IconButton,
  KeyValueList,
  ListPage,
  MoneyText,
  PageHeader,
  ProposedAction,
  SectionCard,
  Toaster,
  useLiro,
  type AnswerBlock,
  type AnswerState,
  type AssistantTurn,
  type DataTableColumn,
  type ProposedActionState,
} from '@veljaos/ui'
import { BarChart } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { ROUTES, Shell, statusBadge } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  ASSISTANT,
  answerKeyOf,
  BETON_MIX,
  ERROR_TEXT,
  INTRO,
  NO_SALARIES,
  NOTE,
  OVERDUE_30,
  OVERDUE_30_TOTAL,
  QUESTIONS,
  RECEIVABLES,
  RECEIVABLES_OPEN,
  RECENT,
  REPORT_REASONS,
  REVENUE,
  SUGGESTED,
  X_NOW,
  X_ROUTES,
  X_TODAY,
  type AnswerKey,
  type Receivable,
} from './data-X'

/*
 * Group X (P5.34): the Liro Assistant at Kvadrat Gradnja d.o.o. on 14.10.2026 at 09:40. Milica
 * Petrović asks beside Receivables (AssistantPanel from AppShell's `agent` slot) or on the "Ask"
 * page (AskPage). Nothing calls a model: each answer is a fixed object (data-X.ts) chosen by its
 * question, its blocks built here with the provider's format; its links open the records it
 * names. Every action it proposes waits for Confirm.
 */

const LINK = 'text-link no-underline visited:text-link hover:underline'

// ── The answers ───────────────────────────────────────────────────────────────────────────────

/** One question and where its answer is. */
interface Turn {
  id: string
  question: string
  /** The answer's key; null for a question the examples cannot answer. */
  key: AnswerKey | null
  state: AnswerState
  action: ProposedActionState
  reported: boolean
}

function turn(key: AnswerKey, state?: AnswerState, id = key): Turn {
  return {
    id,
    question: QUESTIONS[key],
    key,
    state: state ?? (key === 'salaries' ? 'noAccess' : 'done'),
    action: 'proposed',
    reported: false,
  }
}

/** A link to one of the records the answers name, through the provider's link. */
function RecordLink({ id, children }: { id: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={`#${X_ROUTES.record(id)}`} className={LINK}>
      {children}
    </Link>
  )
}

/** The answers' blocks, written through the provider's format. */
function useAnswers(phone: boolean) {
  const { format } = useLiro()
  const money = (value: string) => format.money(value, 'RSD')
  const oldest = OVERDUE_30[0]
  const blocks = (key: AnswerKey | null, state: AnswerState): AnswerBlock[] => {
    if (key === 'overdue') {
      const lead: AnswerBlock = {
        kind: 'text',
        text: `Three invoices are overdue more than 30 days, ${money(OVERDUE_30_TOTAL)} together. The oldest, ${oldest?.id ?? ''} to ${oldest?.customer ?? ''}, is ${String(oldest?.daysLate ?? 0)} days late.`,
      }
      if (state === 'streaming' || state === 'stopped') {
        // The text written so far, as the application received it.
        return [
          {
            kind: 'text',
            text: `Three invoices are overdue more than 30 days, ${money(OVERDUE_30_TOTAL)} together. The oldest, ${oldest?.id ?? ''} to`,
          },
        ]
      }
      return [
        lead,
        {
          kind: 'table',
          caption: `Overdue more than 30 days on ${format.date(X_TODAY)}`,
          columns: [
            { key: 'invoice', label: 'Invoice' },
            { key: 'customer', label: 'Customer' },
            { key: 'due', label: 'Due', numeric: true },
            { key: 'late', label: 'Days late', numeric: true },
            { key: 'open', label: 'Open amount', numeric: true },
          ],
          rows: OVERDUE_30.map((each) => ({
            id: each.id,
            href: `#${X_ROUTES.record(each.id)}`,
            cells: {
              invoice: each.id,
              customer: each.customer,
              due: <DateText value={each.due} />,
              late: format.number(String(each.daysLate)),
              open: <MoneyText value={each.open} currency="RSD" />,
            },
          })),
          total: {
            invoice: 'Total',
            open: <MoneyText value={OVERDUE_30_TOTAL} currency="RSD" />,
          },
        },
        {
          kind: 'sources',
          items: [
            {
              id: 'receivables',
              label: 'Receivables, open items',
              href: `#${X_ROUTES.receivables}`,
              detail: `On ${format.date(X_TODAY)} at ${format.time(X_NOW)}`,
            },
            {
              id: 'statement',
              label: 'Bank statement 188',
              href: '#/banking/statements/188',
              detail: 'The last payments matched to invoices',
            },
          ],
        },
      ]
    }
    if (key === 'revenue') {
      return [
        { kind: 'heading', text: 'Revenue in the third quarter' },
        {
          kind: 'text',
          text: `Revenue from July to September was ${money(REVENUE.total)}, ${format.percent(REVENUE.change)} more than in the same quarter of 2025 (${money(REVENUE.lastTotal)}). September was the strongest month.`,
        },
        {
          kind: 'chart',
          chart: (
            <BarChart
              title="Revenue by month"
              description="Thousands of RSD, without VAT"
              categories={REVENUE.categories}
              series={[
                { key: 'this', label: '2026' },
                { key: 'last', label: '2025', role: 'comparison' },
              ]}
              values={REVENUE.values}
              height={200}
              layout={phone ? 'phone' : 'desktop'}
            />
          ),
        },
        {
          kind: 'list',
          items: [
            'Two new contracts with Gradska toplana Novi Sad started in September.',
            'August was lower: the sites closed for the collective holiday.',
          ],
        },
        {
          kind: 'sources',
          items: [
            {
              id: 'overview',
              label: 'Overview, revenue by month',
              href: `#${ROUTES.dashboard}`,
            },
            {
              id: 'receivables',
              label: 'Receivables, issued invoices',
              href: `#${X_ROUTES.receivables}`,
            },
          ],
        },
      ]
    }
    if (key === 'post') {
      return [
        {
          kind: 'text',
          text: `Invoice ${BETON_MIX.number} from ${BETON_MIX.supplier} arrived on ${format.date(BETON_MIX.date)}. It matches order ${BETON_MIX.order}, and its amounts agree: ${money(BETON_MIX.base)} plus VAT ${format.percent(BETON_MIX.vatRate)} ${money(BETON_MIX.vat)} is ${money(BETON_MIX.total)}.`,
        },
        {
          kind: 'sources',
          items: [
            {
              id: 'invoice',
              label: `Supplier invoice ${BETON_MIX.number}, ${BETON_MIX.supplier}`,
              href: `#${X_ROUTES.record(BETON_MIX.id)}`,
              detail: `Received ${format.date(BETON_MIX.date)}`,
            },
          ],
        },
      ]
    }
    if (key === 'salaries') return []
    return [
      {
        kind: 'text',
        text: 'I could not find that in Kvadrat Gradnja d.o.o.’s data. Try asking about invoices, payments, VAT or people.',
      },
    ]
  }
  const followUps = (key: AnswerKey | null): readonly string[] => {
    if (key === 'overdue') return [QUESTIONS.revenue, QUESTIONS.post]
    if (key === 'revenue') return [QUESTIONS.overdue]
    if (key === null) return SUGGESTED
    return []
  }
  return { blocks, followUps }
}

/** The proposed action of the "post" answer. */
function PostAction({
  state,
  onState,
}: {
  state: ProposedActionState
  onState: (state: ProposedActionState) => void
}) {
  const { format } = useLiro()
  return (
    <ProposedAction
      title={`Post invoice ${BETON_MIX.number} from ${BETON_MIX.supplier}`}
      description="It goes to the purchase ledger and waits for payment."
      details={[
        { label: 'Supplier', value: BETON_MIX.supplier },
        {
          label: 'Invoice',
          value: `${BETON_MIX.number} of ${format.date(BETON_MIX.date)}`,
          numeric: true,
        },
        { label: 'Due', value: <DateText value={BETON_MIX.due} />, numeric: true },
        {
          label: 'Base',
          value: <MoneyText value={BETON_MIX.base} currency="RSD" />,
          numeric: true,
        },
        {
          label: `VAT ${format.percent(BETON_MIX.vatRate)}`,
          value: <MoneyText value={BETON_MIX.vat} currency="RSD" />,
          numeric: true,
        },
        {
          label: 'Total',
          value: <MoneyText value={BETON_MIX.total} currency="RSD" />,
          numeric: true,
        },
        { label: 'Account', value: BETON_MIX.account },
      ]}
      confirmLabel="Post invoice"
      state={state}
      result={
        <>
          Posted on {format.date(X_TODAY)} as entry {BETON_MIX.entry}.{' '}
          <RecordLink id={BETON_MIX.id}>Open the invoice</RecordLink>
        </>
      }
      onConfirm={() => {
        onState('done')
      }}
      onDismiss={() => {
        onState('dismissed')
      }}
    />
  )
}

/** The conversation's state and the answers drawn from it. */
function useConversation(initial: () => Turn[], phone: boolean) {
  const [turns, setTurns] = useState<Turn[]>(initial)
  const answers = useAnswers(phone)
  const update = (id: string, change: Partial<Turn>) => {
    setTurns((list) => list.map((each) => (each.id === id ? { ...each, ...change } : each)))
  }
  const ask = (question: string) => {
    const key = answerKeyOf(question)
    setTurns((list) => [
      ...list,
      {
        id: `q${String(list.length + 1)}`,
        question,
        key,
        state: key === 'salaries' ? 'noAccess' : 'done',
        action: 'proposed',
        reported: false,
      },
    ])
  }
  const answer = (each: Turn, size: 'panel' | 'page') => (
    <AssistantAnswer
      author={ASSISTANT}
      size={size}
      layout={phone ? 'phone' : 'desktop'}
      state={each.state}
      blocks={answers.blocks(each.key, each.state)}
      question={each.question}
      {...(each.state === 'noAccess' ? { reason: NO_SALARIES } : {})}
      {...(each.state === 'error' ? { reason: ERROR_TEXT } : {})}
      followUps={answers.followUps(each.key)}
      onFollowUp={ask}
      onStop={() => {
        update(each.id, { state: 'stopped' })
      }}
      onRetry={() => {
        update(each.id, { state: 'done' })
      }}
      onReport={() => {
        update(each.id, { reported: true })
      }}
      reported={each.reported}
      reportReasons={REPORT_REASONS}
      {...(each.key === 'post' && each.state === 'done'
        ? {
            actions: (
              <PostAction
                state={each.action}
                onState={(action) => {
                  update(each.id, { action })
                }}
              />
            ),
          }
        : {})}
    />
  )
  const last = turns[turns.length - 1]
  const busy = last !== undefined && (last.state === 'thinking' || last.state === 'streaming')
  return {
    turns,
    ask,
    answer,
    busy,
    last,
    clear: () => {
      setTurns([])
    },
  }
}

// ── The panel beside every page ─────────────────────────────────────────────────────────────

/** The assistant's button in AppShell's `agent` slot, and its panel. */
function AssistantSide({
  phone,
  initial,
  open: startOpen,
}: {
  phone: boolean
  initial: () => Turn[]
  open: boolean
}) {
  const conversation = useConversation(initial, phone)
  const lastKey = conversation.last?.key ?? null
  const turns: AssistantTurn[] = conversation.turns.map((each) => ({
    id: each.id,
    question: each.question,
    answer: conversation.answer(each, 'panel'),
  }))
  return (
    <AssistantPanel
      title={ASSISTANT}
      defaultOpen={startOpen}
      layout={phone ? 'phone' : 'desktop'}
      trigger={<IconButton family="neutral" emphasis="menu" icon={Sparkles} label={ASSISTANT} />}
      turns={turns}
      intro={INTRO}
      suggestions={SUGGESTED}
      onAsk={conversation.ask}
      composer={{
        placeholder: 'Ask about invoices, payments, VAT or people',
        busy: conversation.busy,
      }}
      note={NOTE}
      onNewConversation={conversation.clear}
      pageHref={`#${lastKey === null ? X_ROUTES.ask : X_ROUTES.askAnswer(lastKey)}`}
    />
  )
}

function AssistantShell({
  phone,
  crumbs,
  agent,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  agent?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={X_TODAY}>
      <Shell phone={phone} crumbs={crumbs} {...(agent === undefined ? {} : { agent })}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── Receivables: the page under the panel ────────────────────────────────────────────────────

const RECEIVABLE_COLUMNS: DataTableColumn<Receivable>[] = [
  {
    id: 'invoice',
    header: 'Invoice',
    cell: (each) => (
      <RecordLink id={each.id}>
        <bdi>{each.id}</bdi>
      </RecordLink>
    ),
  },
  { id: 'customer', header: 'Customer', cell: (each) => each.customer },
  { id: 'due', header: 'Due', numeric: true, cell: (each) => <DateText value={each.due} /> },
  {
    id: 'open',
    header: 'Open amount',
    numeric: true,
    cell: (each) => <MoneyText value={each.open} currency="RSD" />,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (each) => statusBadge(each.daysLate > 0 ? 'Overdue' : 'Issued'),
  },
]

const VIEWS = [
  { id: 'open', label: 'Open', count: RECEIVABLES.length },
  {
    id: 'overdue',
    label: 'Overdue',
    count: RECEIVABLES.filter((each) => each.daysLate > 0).length,
  },
]

export function Receivables({
  phone,
  initial = () => [],
  open = false,
}: {
  phone: boolean
  initial?: () => Turn[]
  open?: boolean
}) {
  const { format } = useLiro()
  const [view, setView] = useState('open')
  const rows = view === 'overdue' ? RECEIVABLES.filter((each) => each.daysLate > 0) : RECEIVABLES
  return (
    <AssistantShell
      phone={phone}
      crumbs={[{ label: 'Finance' }, { label: 'Receivables' }]}
      agent={<AssistantSide phone={phone} initial={initial} open={open} />}
    >
      <Frame phone={phone}>
        <ListPage
          layout={phone ? 'phone' : 'desktop'}
          title="Receivables"
          titleHidden={false}
          views={VIEWS}
          view={view}
          onViewChange={setView}
        >
          <DataTable
            label="Receivables"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={RECEIVABLE_COLUMNS}
            rows={rows}
            getRowId={(each) => each.id}
            getRowLabel={(each) => `${each.id}, ${each.customer}`}
            count={rows.length}
            mobile={{
              title: (each) => each.id,
              subtitle: (each) => each.customer,
              badge: (each) => statusBadge(each.daysLate > 0 ? 'Overdue' : 'Issued'),
              details: ['due', 'open'],
            }}
          />
        </ListPage>
        <p className="bidi-content m-0 text-sm text-secondary">
          {`Open in total: ${format.money(RECEIVABLES_OPEN, 'RSD')}`}
        </p>
      </Frame>
    </AssistantShell>
  )
}

/** One record an answer links to: an issued invoice or the supplier invoice. */
export function RecordPage({ phone, id }: { phone: boolean; id: string }) {
  const { format } = useLiro()
  const receivable = RECEIVABLES.find((each) => each.id === id)
  const supplier = id === BETON_MIX.id
  const title = supplier ? `Supplier invoice ${BETON_MIX.number}` : `Invoice ${id}`
  return (
    <AssistantShell
      phone={phone}
      crumbs={[
        { label: 'Finance' },
        { label: 'Receivables', href: `#${X_ROUTES.receivables}` },
        { label: supplier ? BETON_MIX.number : id },
      ]}
      agent={<AssistantSide phone={phone} initial={() => []} open={false} />}
    >
      <Frame phone={phone}>
        <PageHeader
          title={title}
          back={{ label: 'Receivables', href: `#${X_ROUTES.receivables}` }}
          {...(receivable === undefined
            ? {}
            : { status: statusBadge(receivable.daysLate > 0 ? 'Overdue' : 'Issued') })}
          {...(receivable !== undefined && receivable.daysLate > 0
            ? { subtitle: `${format.number(String(receivable.daysLate))} days late` }
            : {})}
        />
        <SectionCard title="Details" headingLevel={2}>
          {receivable !== undefined ? (
            <KeyValueList
              items={[
                { label: 'Customer', value: receivable.customer },
                { label: 'Issued', value: <DateText value={receivable.issued} />, numeric: true },
                { label: 'Due', value: <DateText value={receivable.due} />, numeric: true },
                {
                  label: 'Total',
                  value: <MoneyText value={receivable.total} currency="RSD" />,
                  numeric: true,
                },
                {
                  label: 'Open amount',
                  value: <MoneyText value={receivable.open} currency="RSD" />,
                  numeric: true,
                },
              ]}
            />
          ) : (
            <KeyValueList
              items={[
                { label: 'Supplier', value: BETON_MIX.supplier },
                { label: 'Date', value: <DateText value={BETON_MIX.date} />, numeric: true },
                { label: 'Due', value: <DateText value={BETON_MIX.due} />, numeric: true },
                { label: 'Order', value: BETON_MIX.order },
                {
                  label: 'Base',
                  value: <MoneyText value={BETON_MIX.base} currency="RSD" />,
                  numeric: true,
                },
                {
                  label: `VAT ${format.percent(BETON_MIX.vatRate)}`,
                  value: <MoneyText value={BETON_MIX.vat} currency="RSD" />,
                  numeric: true,
                },
                {
                  label: 'Total',
                  value: <MoneyText value={BETON_MIX.total} currency="RSD" />,
                  numeric: true,
                },
              ]}
            />
          )}
        </SectionCard>
      </Frame>
    </AssistantShell>
  )
}

// ── The "Ask" page ──────────────────────────────────────────────────────────────────────────

export function AskScreen({ phone, start }: { phone: boolean; start?: AnswerKey }) {
  const conversation = useConversation(() => (start === undefined ? [] : [turn(start)]), phone)
  const last = conversation.last
  return (
    <AssistantShell phone={phone} crumbs={[{ label: ASSISTANT }]}>
      <AskPage
        layout={phone ? 'phone' : 'desktop'}
        title="What would you like to know?"
        description="Ask about Kvadrat Gradnja d.o.o. in your own words."
        onAsk={conversation.ask}
        suggestions={SUGGESTED}
        recent={RECENT}
        note={NOTE}
        composer={{
          placeholder: 'Ask about invoices, payments, VAT or people',
          busy: conversation.busy,
        }}
        {...(last === undefined
          ? {}
          : {
              question: last.question,
              answer: conversation.answer(last, 'page'),
              onNewQuestion: conversation.clear,
            })}
      />
    </AssistantShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_X_ROUTES: ExampleRoute[] = [
  { path: X_ROUTES.receivables, render: (phone) => <Receivables phone={phone} /> },
  { path: X_ROUTES.start, render: (phone) => <Receivables phone={phone} open /> },
  ...(['overdue', 'revenue', 'post', 'salaries'] as const).map((key) => ({
    path: X_ROUTES[key],
    render: (phone: boolean) => <Receivables phone={phone} open initial={() => [turn(key)]} />,
  })),
  {
    path: X_ROUTES.thinking,
    render: (phone) => (
      <Receivables
        phone={phone}
        open
        initial={() => [turn('overdue'), turn('revenue', 'thinking')]}
      />
    ),
  },
  {
    path: X_ROUTES.streaming,
    render: (phone) => (
      <Receivables phone={phone} open initial={() => [turn('overdue', 'streaming')]} />
    ),
  },
  {
    path: X_ROUTES.stopped,
    render: (phone) => (
      <Receivables phone={phone} open initial={() => [turn('overdue', 'stopped')]} />
    ),
  },
  {
    path: X_ROUTES.failed,
    render: (phone) => (
      <Receivables phone={phone} open initial={() => [turn('overdue', 'error')]} />
    ),
  },
  ...[...RECEIVABLES.map((each) => each.id), BETON_MIX.id].map((id) => ({
    path: X_ROUTES.record(id),
    render: (phone: boolean) => <RecordPage phone={phone} id={id} />,
  })),
  { path: X_ROUTES.ask, render: (phone) => <AskScreen phone={phone} /> },
  ...(['overdue', 'revenue', 'post', 'salaries'] as const).map((key) => ({
    path: X_ROUTES.askAnswer(key),
    render: (phone: boolean) => <AskScreen phone={phone} start={key} />,
  })),
]

import { FileSignature, Send } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  ActivityList,
  AgentQuestion,
  Button,
  DataTable,
  DateText,
  DocumentPage,
  HistoryList,
  KeyValueList,
  MessageThread,
  MoneyText,
  NumberText,
  PageHeader,
  PresenceAvatars,
  Questionnaire,
  RelatedDocuments,
  StatusBadge,
  useLiro,
  type DataTableColumn,
  type HistoryEntry,
  type LifecycleStep,
  type ModuleTab,
  type SidePanel,
  type ThreadMessage,
  type TotalsRow,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { HR_TABS, Navigate, SALES_TABS, Shell, statusBadge } from './example-shell'
import {
  AGENT_QUESTION_AT,
  at,
  checkContractAnswer,
  COMMENTS_0410,
  CONTRACT_NUMBER,
  CONTRACT_QUESTIONS_A,
  HISTORY_0410,
  INVOICE_0410,
  LINES_0410,
  OLDER_HISTORY_0410,
  PEOPLE_A,
  PRESENT_0410,
  TOTALS_0410,
  type LineA,
} from './data-A'

/*
 * Group A's example screens (P5.1, P5.2): invoice F-2026-0410 with who else is viewing it, its
 * comments (a MessageThread in which the Liro agent asks for the payment date with an
 * AgentQuestion) and its full history (HistoryList), the side panel keeping the compact
 * ActivityList; and the employment contract questionnaire for Stefan Nikolić, whose "Generate
 * contract" opens RU-2026-017 for signing (group C's screen). Only public entry points.
 */

export const ROUTES_A = {
  invoice: `/sales/invoices/${INVOICE_0410.number}`,
  contract: '/hr/contracts/new',
  signing: `/hr/contracts/${CONTRACT_NUMBER}/signing`,
}

// ── Invoice F-2026-0410: history, comments and presence ───────────────────────────────────────

const LINE_COLUMNS: DataTableColumn<LineA>[] = [
  { id: 'item', header: 'Item', cell: (line) => line.item },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.price} currency="RSD" />,
  },
  { id: 'vat', header: 'VAT', cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

const TOTAL_ROWS: TotalsRow[] = [
  { key: 'base20', label: 'Tax base S 20%', value: TOTALS_0410.base20, currency: 'RSD' },
  { key: 'vat20', label: 'VAT S 20%', value: TOTALS_0410.vat20, currency: 'RSD' },
  {
    key: 'base10',
    label: 'Tax base S 10%',
    value: TOTALS_0410.base10,
    currency: 'RSD',
    group: true,
  },
  { key: 'vat10', label: 'VAT S 10%', value: TOTALS_0410.vat10, currency: 'RSD' },
  {
    key: 'total',
    label: 'Invoice total',
    value: TOTALS_0410.total,
    currency: 'RSD',
    group: true,
  },
  { key: 'paid', label: 'Paid on 02.10.2026.', value: TOTALS_0410.paid, currency: 'RSD' },
]

const STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'sef', label: 'Sent to SEF' },
  { key: 'partly', label: 'Partially paid' },
  { key: 'paid', label: 'Paid' },
]

/** The agent's question in the thread, answered with a date. */
function PaymentDateQuestion({
  answer,
  onAnswer,
}: {
  answer: string | null
  onAnswer: (date: string) => void
}) {
  const { format } = useLiro()
  return (
    <AgentQuestion
      agent="Liro agent"
      at={AGENT_QUESTION_AT}
      question={`Medic Lab Niš d.o.o. paid 100.000,00 RSD on 02.10.2026. When will they pay the remaining 86.420,35 RSD? I will send the reminder only if the payment is late.`}
      {...(answer === null ? {} : { answer: `Payment expected on ${format.date(answer)}` })}
    >
      <Questionnaire
        label="Answer to Liro agent"
        summary={false}
        progress={false}
        submitLabel="Answer"
        questions={[
          {
            id: 'date',
            title: 'Expected payment date',
            type: 'date',
            next: null,
          },
        ]}
        validate={(_question, value) =>
          typeof value?.value === 'string' && value.value < '2026-10-06'
            ? 'The date cannot be in the past.'
            : undefined
        }
        onSubmit={(answers) => {
          const value = answers.date?.value
          if (typeof value === 'string') onAnswer(value)
        }}
      />
    </AgentQuestion>
  )
}

export function InvoiceActivity({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [open, setOpen] = useState<string[]>(['delivery', 'related', 'activity'])
  const [hidden, setHidden] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sent, setSent] = useState<ThreadMessage[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>(HISTORY_0410)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const thread: ThreadMessage[] = [
    ...COMMENTS_0410,
    {
      id: 'agent-question',
      author: { id: 'agent', name: 'Liro agent', agent: true },
      at: AGENT_QUESTION_AT,
      element: (
        <PaymentDateQuestion
          answer={answer}
          onAnswer={(date) => {
            setAnswer(date)
            setHistory((entries) => [
              ...entries,
              {
                id: 'h8',
                at: at('2026-10-06', '10:05'),
                actor: { name: 'Liro agent', kind: 'agent' },
                onBehalfOf: 'Milica Petrović',
                text: `Scheduled the payment reminder after ${format.date(date)}`,
              },
            ])
          }}
        />
      ),
    },
    ...(answer === null
      ? []
      : [
          {
            id: 'agent-thanks',
            author: { id: 'agent', name: 'Liro agent', agent: true },
            at: at('2026-10-06', '10:05'),
            text: `Thank you. I will check the payment on ${format.date(answer)} and send the reminder only if it has not arrived.`,
          },
        ]),
    ...sent,
  ]

  const panels: SidePanel[] = [
    {
      key: 'delivery',
      title: 'Delivery',
      content: (
        <KeyValueList
          columns={1}
          items={[
            { label: 'SEF', value: <StatusBadge label="Delivered" tone="success" /> },
            { label: 'Sent', value: <span dir="ltr">25.09.2026. 10:04</span>, numeric: true },
          ]}
        />
      ),
    },
    {
      key: 'related',
      title: 'Related documents',
      count: 2,
      content: (
        <RelatedDocuments
          label="Related documents"
          items={[
            {
              key: 'order',
              type: 'Order',
              number: 'N-2026-0149',
              href: '#/sales/orders/N-2026-0149',
              status: <StatusBadge label="Completed" tone="neutral" />,
            },
            {
              key: 'statement',
              type: 'Bank statement',
              number: '187',
              href: '#/banking/statements/187',
              status: <StatusBadge label="Booked" tone="success" />,
            },
          ]}
        />
      ),
    },
    {
      key: 'activity',
      title: 'Latest activity',
      content: (
        <ActivityList
          label="Latest activity"
          items={[...history]
            .sort((a, b) => (a.at < b.at ? 1 : -1))
            .slice(0, 3)
            .map((entry) => ({
              key: entry.id,
              author: entry.actor.name,
              time: <span dir="ltr">{format.dateTime(entry.at)}</span>,
              text: entry.text ?? entry.changes?.map((change) => change.field).join(', ') ?? '',
            }))}
        />
      ),
    },
  ]

  const reminder = <Button family="verify" icon={Send} label="Send reminder" />
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: INVOICE_0410.number }]}
      tabs={SALES_TABS}
      {...(phone ? { bottomBar: reminder } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={INVOICE_0410.number}
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge(INVOICE_0410.status)}
        lifecycle={{ steps: STEPS, current: 3, label: 'Invoice status' }}
        counterparty={{
          label: 'Customer',
          name: INVOICE_0410.customer,
          taxId: `PIB ${INVOICE_0410.taxId}`,
          address: INVOICE_0410.address,
        }}
        keyFigures={[
          { label: 'Amount due', value: <MoneyText value={TOTALS_0410.due} currency="RSD" /> },
          {
            label: 'Invoice total',
            value: <MoneyText value={TOTALS_0410.total} currency="RSD" />,
          },
          { label: 'Due', value: <DateText value={INVOICE_0410.due} /> },
        ]}
        actions={
          <>
            <PresenceAvatars people={PRESENT_0410} />
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone ? null : reminder}
          </>
        }
        lines={
          <DataTable
            label="Lines"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={LINE_COLUMNS}
            rows={LINES_0410}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.item}
            mobile={{ details: ['quantity', 'unit', 'price', 'vat', 'amount'] }}
          />
        }
        totals={{
          rows: TOTAL_ROWS,
          total: { key: 'due', label: 'Amount due', value: TOTALS_0410.due, currency: 'RSD' },
          label: 'Totals',
        }}
        sections={[
          {
            key: 'comments',
            title: 'Comments',
            content: (
              <MessageThread
                className={phone ? 'h-[32rem]' : 'h-[30rem]'}
                label={`Comments on ${INVOICE_0410.number}`}
                messages={thread}
                composer={{
                  label: 'Comment',
                  placeholder: 'Write a comment, @ to mention',
                  candidates: PEOPLE_A,
                  onSend: ({ text, mentions }) => {
                    setSent((list) => [
                      ...list,
                      {
                        id: `sent-${String(list.length + 1)}`,
                        author: { id: 'u-milica', name: 'Milica Petrović' },
                        own: true,
                        at: at('2026-10-06', `10:${String(20 + list.length).padStart(2, '0')}`),
                        text,
                        mentions,
                      },
                    ])
                  },
                }}
              />
            ),
          },
          {
            key: 'history',
            title: 'History',
            content: (
              <HistoryList
                label={`History of ${INVOICE_0410.number}`}
                entries={history}
                loading={loadingHistory}
                hasMore={!history.some((entry) => entry.id === 'h1')}
                onLoadMore={() => {
                  setLoadingHistory(true)
                  setTimeout(() => {
                    setHistory((entries) => [...entries, ...OLDER_HISTORY_0410])
                    setLoadingHistory(false)
                  }, 400)
                }}
              />
            ),
          },
        ]}
        panels={panels}
        panelsOpen={open}
        onPanelsOpenChange={setOpen}
        panelsHidden={hidden}
        onPanelsHiddenChange={setHidden}
      />
    </Shell>
  )
}

// ── Employment contract questionnaire ─────────────────────────────────────────────────────────

const CONTRACT_TABS: ModuleTab[] = HR_TABS.map((tab) => ({
  ...tab,
  current: tab.key === 'contracts',
}))

export function ContractQuestionnaire({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { today } = useLiro()
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Contracts', href: '#/hr/contracts' }, { label: 'New contract' }]}
      tabs={CONTRACT_TABS}
    >
      <div
        className={
          phone
            ? 'box-border flex w-full flex-col gap-4 p-4'
            : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
        }
      >
        <PageHeader
          title="New employment contract"
          back={{ href: '#/hr/contracts', label: 'Contracts' }}
          subtitle="Template: Employment contract, Kvadrat Gradnja d.o.o. (2026)"
        />
        <div
          className={`box-border w-full max-w-160 rounded-lg border border-solid border-default bg-surface-raised ${phone ? 'p-4' : 'p-6'}`}
        >
          <Questionnaire
            label="Employment contract"
            questions={CONTRACT_QUESTIONS_A}
            submitLabel="Generate contract"
            submitIcon={FileSignature}
            validate={(question, answer) =>
              checkContractAnswer(
                question.id,
                typeof answer?.value === 'string' ? answer.value : null,
                today,
              )
            }
            onSubmit={() => {
              navigate(ROUTES_A.signing)
            }}
          />
        </div>
      </div>
    </Shell>
  )
}

/** Group A's screens, registered in example-app.tsx. */
export const GROUP_A_ROUTES: ExampleRoute[] = [
  { path: ROUTES_A.invoice, render: (phone) => <InvoiceActivity phone={phone} /> },
  { path: ROUTES_A.contract, render: (phone) => <ContractQuestionnaire phone={phone} /> },
]

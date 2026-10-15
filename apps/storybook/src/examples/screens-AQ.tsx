import { CheckCheck, CircleX, Send } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ActionGroup,
  AttachmentList,
  Button,
  DataTable,
  DateField,
  DateText,
  DetailPage,
  DocumentTotals,
  EmptyState,
  FileDropzone,
  FormFullWidth,
  FormSection,
  KeyValueList,
  MoneyField,
  MoneyText,
  RadioGroupField,
  ReasonConfirmDialog,
  RecordFormPage,
  SectionCard,
  SelectField,
  StatusBadge,
  TextAreaField,
  TextField,
  toneFor,
  Toaster,
  UnavailableAction,
  WorklistPage,
  notice,
  type ActionItem,
  type DataTableColumn,
  type DetailSection,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { COMPANIES, Shell, type ExampleAccount } from './example-shell'
import { Tenant } from './screens-G'
import {
  AQ_ROUTES,
  AQ_TODAY,
  COST_CENTRES,
  JELENA,
  NEW_ORDER,
  PER_DIEM,
  REJECT_REASONS,
  SETTLEMENT_TONES,
  TAXI_RECEIPT,
  TO_APPROVE,
  TRAVELLERS,
  VEHICLES,
  type PerDiemRow,
  type Settlement,
  type SettlementState,
  type Transport,
  type TravelExpense,
} from './data-AQ'

/*
 * Group AQ's example screens (P5.48, travel orders): Kvadrat Gradnja d.o.o. on 14 October 2026.
 * - A new travel order (RecordFormPage, the site manager Snežana Popović): the traveller, the
 *   destination and purpose, the dates, how they travel (a company vehicle, their own car, bus or
 *   train), the cost centre and the advance; Cancel, Save draft, Send for approval.
 * - A settlement (DetailPage, Jelena Stojković on her phone first): the trip, the expenses with the
 *   photos of their receipts — "Take a photo" (FileDropzone `camera`) and the receipts as an
 *   AttachmentList —, the per-diems by the trip's hours and the settlement (DocumentTotals:
 *   expenses, per-diems, the advance, to pay or to return). Submit is unavailable, with the reason,
 *   while a receipt is missing.
 * - The settlements to approve (WorklistPage, Milica Petrović): each settlement as a row with what
 *   is paid or returned, the same sections in the detail, Reject (with a reason) and Approve.
 * Every figure is the application's (data-AQ.ts); the screens file the photo and keep the states.
 */

export { AQ_ROUTES }

const KVADRAT = COMPANIES.filter((company) => company.id === 'kvadrat')

const SITE_MANAGER: ExampleAccount = {
  name: 'Snežana Popović',
  email: 'snezana.popovic@kvadratgradnja.example.com',
  companies: KVADRAT,
  links: [{ label: 'New travel order', path: AQ_ROUTES.newOrder }],
}

const TRAVELLER: ExampleAccount = {
  name: 'Jelena Stojković',
  email: 'jelena.stojkovic@kvadratgradnja.example.com',
  companies: KVADRAT,
  links: [{ label: 'Settlement PN-2026-047', path: AQ_ROUTES.settlement }],
}

function TravelShell({
  phone,
  account,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  account?: ExampleAccount
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={AQ_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        {...(account === undefined ? {} : { account })}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

function stateBadge(state: SettlementState) {
  return <StatusBadge label={state} tone={toneFor(state, SETTLEMENT_TONES)} />
}

// ── A new travel order ────────────────────────────────────────────────────────────────────────

interface OrderDraft {
  traveller: string
  destination: string
  purpose: string
  departure: string | null
  return: string | null
  transport: Transport
  vehicle: string
  costCentre: string
  advance: string | null
}

export function NewTravelOrder({ phone }: { phone: boolean }) {
  const [draft, setDraft] = useState<OrderDraft>({ ...NEW_ORDER })
  const [dirty, setDirty] = useState(false)
  const set = (next: Partial<OrderDraft>) => {
    setDraft((current) => ({ ...current, ...next }))
    setDirty(true)
  }
  const traveller = TRAVELLERS.find((each) => each.value === draft.traveller)
  const actions: ActionItem[] = [
    {
      key: 'cancel',
      intent: 'cancel',
      label: 'Cancel',
      onClick: () => {
        setDirty(false)
      },
    },
    {
      key: 'save',
      intent: 'save',
      emphasis: 'secondary',
      label: 'Save draft',
      onClick: () => {
        setDirty(false)
        notice.success(`${NEW_ORDER.number} saved as a draft.`)
      },
    },
    {
      key: 'send',
      family: 'primary',
      icon: Send,
      emphasis: 'primary',
      label: 'Send for approval',
      onClick: () => {
        setDirty(false)
        notice.success(`${NEW_ORDER.number} sent to Goran Medić for approval.`)
      },
    },
  ]
  const columns = phone ? 1 : 2
  return (
    <TravelShell
      phone={phone}
      account={SITE_MANAGER}
      crumbs={[{ label: 'Travel orders' }, { label: 'New travel order' }]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="New travel order"
        subtitle={<bdi>{NEW_ORDER.number}</bdi>}
        back={{ href: '#/travel/orders', label: 'Travel orders' }}
        dirty={dirty}
        actions={<ActionGroup actions={actions} />}
      >
        <div className="flex flex-col gap-4">
          <FormSection title="Trip" columns={columns}>
            <SelectField
              label="Traveller"
              required
              options={TRAVELLERS}
              value={draft.traveller}
              onChange={(value) => {
                set({ traveller: value })
              }}
            />
            <TextField
              label="Destination"
              required
              value={draft.destination}
              onChange={(destination) => {
                set({ destination })
              }}
            />
            <FormFullWidth>
              <TextAreaField
                label="Purpose"
                required
                rows={2}
                value={draft.purpose}
                onChange={(purpose) => {
                  set({ purpose })
                }}
              />
            </FormFullWidth>
            <DateField
              label="Departure"
              required
              value={draft.departure}
              onChange={(departure) => {
                set({ departure })
              }}
            />
            <DateField
              label="Return"
              required
              value={draft.return}
              onChange={(value) => {
                set({ return: value })
              }}
            />
          </FormSection>
          <FormSection title="Travel and costs" columns={columns}>
            <RadioGroupField
              label="Travels by"
              options={[
                { value: 'company', label: 'Company vehicle' },
                {
                  value: 'own',
                  label: 'Own car',
                  description: 'Paid by the kilometre, at the application’s rate.',
                },
                { value: 'public', label: 'Bus or train' },
              ]}
              value={draft.transport}
              onChange={(value) => {
                set({
                  transport: value === 'own' ? 'own' : value === 'public' ? 'public' : 'company',
                })
              }}
            />
            {draft.transport === 'company' ? (
              <SelectField
                label="Vehicle"
                required
                options={VEHICLES}
                value={draft.vehicle}
                onChange={(vehicle) => {
                  set({ vehicle })
                }}
              />
            ) : null}
            <SelectField
              label="Cost centre"
              required
              options={COST_CENTRES}
              value={draft.costCentre}
              onChange={(costCentre) => {
                set({ costCentre })
              }}
            />
            <MoneyField
              label="Advance"
              currency="RSD"
              description={`Paid to ${traveller?.label ?? 'the traveller'}’s account before the trip.`}
              value={draft.advance}
              onChange={(advance) => {
                set({ advance })
              }}
            />
          </FormSection>
          <FormSection title="Approval" columns={1}>
            <KeyValueList
              columns={1}
              items={[
                {
                  key: 'approver',
                  label: 'Approves the order',
                  value: 'Goran Medić, head of construction',
                },
                { key: 'issued', label: 'Issued by', value: NEW_ORDER.approver },
                { key: 'per-diem', label: 'Per-diem', value: PER_DIEM.rule, fullWidth: true },
              ]}
            />
          </FormSection>
        </div>
      </RecordFormPage>
    </TravelShell>
  )
}

// ── A settlement's sections ───────────────────────────────────────────────────────────────────

/** The receipt column: the photo's name, or that it is missing (warning, in words). */
function receiptCell(settlement: Settlement, expense: TravelExpense): ReactNode {
  if (expense.receipt === null) return <StatusBadge label="Receipt missing" tone="warning" />
  const file = settlement.receipts.find((each) => each.id === expense.receipt)
  return <bdi className="text-sm">{file?.name}</bdi>
}

function expenseColumns(settlement: Settlement): DataTableColumn<TravelExpense>[] {
  return [
    { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
    {
      id: 'expense',
      header: 'Expense',
      minWidth: 200,
      cell: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content font-medium">{row.kind}</span>
          <span className="bidi-content text-xs text-secondary">{row.description}</span>
        </span>
      ),
    },
    { id: 'amount', header: 'Amount', numeric: true, cell: (row) => money(row.amount) },
    { id: 'receipt', header: 'Receipt', cell: (row) => receiptCell(settlement, row) },
  ]
}

const PER_DIEM_COLUMNS: DataTableColumn<PerDiemRow>[] = [
  {
    id: 'span',
    header: 'Part of the trip',
    minWidth: 200,
    cell: (row) => <bdi>{row.span}</bdi>,
  },
  { id: 'hours', header: 'Hours', numeric: true, cell: (row) => <bdi>{row.hours}</bdi> },
  { id: 'count', header: 'Per-diems', numeric: true, cell: (row) => <bdi>{row.count}</bdi> },
  { id: 'amount', header: 'Amount', numeric: true, cell: (row) => money(row.amount) },
]

function settlementSections(
  settlement: Settlement,
  phone: boolean,
  capture?: ReactNode,
): DetailSection[] {
  const result = settlement.totals.resultKind === 'pay'
  return [
    {
      id: 'trip',
      label: 'Trip',
      content: (
        <KeyValueList
          columns={phone ? 1 : 2}
          items={[
            {
              key: 'traveller',
              label: 'Traveller',
              value: `${settlement.traveller}, ${settlement.role}`,
            },
            { key: 'destination', label: 'Destination', value: settlement.destination },
            {
              key: 'departed',
              label: 'Departed',
              value: <bdi>{settlement.departed}</bdi>,
              numeric: true,
            },
            {
              key: 'returned',
              label: 'Returned',
              value: <bdi>{settlement.returned}</bdi>,
              numeric: true,
            },
            { key: 'transport', label: 'Travelled by', value: settlement.transport },
            { key: 'centre', label: 'Cost centre', value: settlement.costCentre },
            { key: 'purpose', label: 'Purpose', value: settlement.purpose, fullWidth: true },
          ]}
        />
      ),
    },
    {
      id: 'expenses',
      label: 'Expenses',
      description: 'Every expense with the photo of its receipt.',
      content: (
        <div className="flex flex-col gap-4">
          {capture}
          <DataTable
            label={`Expenses of ${settlement.number}`}
            layout={phone ? 'cards' : 'table'}
            columns={expenseColumns(settlement)}
            rows={settlement.expenses}
            getRowId={(row) => row.id}
            getRowLabel={(row) => `${row.kind} ${row.description}`}
            totalsLabel="Total"
            totals={{ amount: money(settlement.totals.expenses) }}
            mobile={{
              title: (row) => row.kind,
              subtitle: (row) => <span className="bidi-content">{row.description}</span>,
              details: ['date', 'amount', 'receipt'],
            }}
          />
          <AttachmentList
            label={`Receipts of ${settlement.number}`}
            files={settlement.receipts}
            onDownload={(file) => {
              notice.info(`${file.name} is downloading.`)
            }}
          />
        </div>
      ),
    },
    {
      id: 'per-diems',
      label: 'Per-diems',
      description: PER_DIEM.rule,
      flush: true,
      content: (
        <DataTable
          label={`Per-diems of ${settlement.number}`}
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={PER_DIEM_COLUMNS}
          rows={settlement.perDiems}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.span}
          totalsLabel={`Total, ${settlement.duration}`}
          totals={{ amount: money(settlement.totals.perDiems) }}
          mobile={{
            title: (row) => <bdi>{row.span}</bdi>,
            details: ['hours', 'count', 'amount'],
          }}
        />
      ),
    },
    {
      id: 'settlement',
      label: 'Settlement',
      content: (
        <DocumentTotals
          label={`Settlement of ${settlement.number}`}
          rows={[
            {
              key: 'expenses',
              label: 'Expenses',
              value: settlement.totals.expenses,
              currency: 'RSD',
            },
            {
              key: 'per-diems',
              label: 'Per-diems',
              value: settlement.totals.perDiems,
              currency: 'RSD',
            },
            {
              key: 'costs',
              label: 'Costs of the trip',
              value: settlement.totals.costs,
              currency: 'RSD',
              group: true,
            },
            {
              key: 'advance',
              label: 'Advance paid',
              value: settlement.totals.advance,
              currency: 'RSD',
            },
          ]}
          total={{
            key: 'result',
            label: result
              ? `To pay to ${settlement.traveller}`
              : `To return by ${settlement.traveller}`,
            value: settlement.totals.result,
            currency: 'RSD',
          }}
        />
      ),
    },
  ]
}

// ── Jelena's settlement ───────────────────────────────────────────────────────────────────────

export function TravelSettlement({ phone, ready = false }: { phone: boolean; ready?: boolean }) {
  const [settlement, setSettlement] = useState<Settlement>(() =>
    ready ? withTaxiReceipt(JELENA) : JELENA,
  )
  const missing = settlement.expenses.filter((expense) => expense.receipt === null)
  const submitted = settlement.state !== 'Draft'
  const submit =
    missing.length === 0 ? (
      <Button
        family="primary"
        icon={Send}
        emphasis="primary"
        label="Submit for approval"
        onClick={() => {
          setSettlement((current) => ({ ...current, state: 'To approve', submitted: AQ_TODAY }))
          notice.success(`${settlement.number} sent to Milica Petrović for approval.`)
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={Send}
        emphasis="primary"
        label="Submit for approval"
        reason="Add the photo of the taxi’s receipt of 07.10.2026."
      />
    )
  const capture = submitted ? undefined : (
    <FileDropzone
      label="Add a receipt"
      description="A photo or a scan; the application files it with the expense."
      accept={['image/jpeg', 'image/png', '.pdf']}
      acceptText="JPG, PNG or PDF"
      maxSize={10 * 1024 * 1024}
      maxSizeText="10 MB"
      camera
      layout={phone ? 'phone' : 'desktop'}
      onFiles={() => {
        setSettlement((current) => withTaxiReceipt(current))
        notice.success('Receipt added to the taxi of 07.10.2026.')
      }}
    />
  )
  return (
    <TravelShell
      phone={phone}
      account={TRAVELLER}
      crumbs={[{ label: 'My travel orders' }, { label: settlement.number }]}
      {...(phone && !submitted ? { bottomBar: submit } : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Settlement ${settlement.number}`}
        back={{ href: '#/travel/my-orders', label: 'My travel orders' }}
        status={stateBadge(settlement.state)}
        subtitle={
          <span className="bidi-content">{`${settlement.destination} · ${settlement.duration}`}</span>
        }
        {...(phone || submitted ? {} : { actions: submit })}
        keyFigures={[
          { key: 'costs', label: 'Costs of the trip', value: money(settlement.totals.costs) },
          { key: 'advance', label: 'Advance paid', value: money(settlement.totals.advance) },
          { key: 'result', label: 'To pay to you', value: money(settlement.totals.result) },
        ]}
        sections={settlementSections(settlement, phone, capture)}
      />
    </TravelShell>
  )
}

/** The application files the new photo with the expense that had no receipt. */
function withTaxiReceipt(settlement: Settlement): Settlement {
  return {
    ...settlement,
    expenses: settlement.expenses.map((expense) =>
      expense.receipt === null ? { ...expense, receipt: TAXI_RECEIPT.id } : expense,
    ),
    receipts: settlement.receipts.some((file) => file.id === TAXI_RECEIPT.id)
      ? settlement.receipts
      : [...settlement.receipts, TAXI_RECEIPT],
  }
}

// ── The settlements to approve ────────────────────────────────────────────────────────────────

function ResultFigure({ settlement }: { settlement: Settlement }) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      {money(settlement.totals.result)}
      <span className="text-xs text-secondary">
        {settlement.totals.resultKind === 'pay' ? 'to pay' : 'to return'}
      </span>
    </span>
  )
}

export function SettlementApprovals({ phone, ask }: { phone: boolean; ask?: 'reject' }) {
  const [rows, setRows] = useState<readonly Settlement[]>(TO_APPROVE)
  const [selected, setSelected] = useState<string | undefined>(
    phone && ask === undefined ? undefined : TO_APPROVE[0]?.number,
  )
  const [rejecting, setRejecting] = useState(ask === 'reject')
  const index = rows.findIndex((each) => each.number === selected)
  const row = rows[index]
  const decide = (number: string, done: string) => {
    const at = rows.findIndex((each) => each.number === number)
    const rest = rows.filter((each) => each.number !== number)
    setRows(rest)
    setSelected(phone ? undefined : rest[Math.min(Math.max(at, 0), rest.length - 1)]?.number)
    notice.success(done)
  }
  const items: WorklistItem[] = rows.map((each) => ({
    id: each.number,
    label: `${each.number} ${each.traveller}`,
    title: each.traveller,
    subtitle: <span className="bidi-content">{`${each.number} · ${each.destination}`}</span>,
    figure: <ResultFigure settlement={each} />,
    status: stateBadge(each.state),
  }))
  const decisions =
    row === undefined ? undefined : (
      <>
        <Button
          family="destructive"
          icon={CircleX}
          emphasis="secondary"
          label="Reject"
          onClick={() => {
            setRejecting(true)
          }}
        />
        <Button
          family="positive"
          icon={CheckCheck}
          emphasis="primary"
          label="Approve"
          onClick={() => {
            decide(row.number, `${row.number} approved.`)
          }}
        />
      </>
    )
  return (
    <TravelShell
      phone={phone}
      crumbs={[{ label: 'Travel orders' }, { label: 'Settlements to approve' }]}
      {...(phone && decisions !== undefined
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Travel settlements to approve"
        label="Travel settlements to approve"
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        empty={
          <EmptyState
            title="Nothing to approve"
            description="Settlements appear here when travellers submit them."
          />
        }
        {...(row === undefined
          ? {}
          : {
              detail: (
                <div className="flex flex-col gap-4">
                  {settlementSections(row, phone).map((section) => (
                    <SectionCard
                      key={section.id}
                      title={section.label}
                      headingLevel={2}
                      {...(section.description === undefined
                        ? {}
                        : { description: section.description })}
                      {...(section.flush === true ? { flush: true } : {})}
                    >
                      {section.content}
                    </SectionCard>
                  ))}
                </div>
              ),
            })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          setSelected(rows[(index - 1 + rows.length) % rows.length]?.number)
        }}
        onNext={() => {
          setSelected(rows[(index + 1) % rows.length]?.number)
        }}
      />
      <ReasonConfirmDialog
        open={rejecting && row !== undefined}
        onOpenChange={setRejecting}
        family="destructive"
        actionIcon={CircleX}
        title="Reject settlement"
        {...(row === undefined ? {} : { subject: `${row.number} · ${row.traveller}` })}
        message="The traveller sees the reason and can correct the settlement."
        reasonLabel="Reason for rejection"
        reasons={REJECT_REASONS}
        confirmLabel="Reject"
        onConfirm={() => {
          if (row !== undefined) decide(row.number, `${row.number} rejected.`)
        }}
      />
    </TravelShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AQ_ROUTES: ExampleRoute[] = [
  { path: AQ_ROUTES.newOrder, render: (phone) => <NewTravelOrder phone={phone} /> },
  { path: AQ_ROUTES.settlement, render: (phone) => <TravelSettlement phone={phone} /> },
  {
    path: AQ_ROUTES.settlementReady,
    render: (phone) => <TravelSettlement phone={phone} ready />,
  },
  { path: AQ_ROUTES.approvals, render: (phone) => <SettlementApprovals phone={phone} /> },
  {
    path: AQ_ROUTES.approvalsReject,
    render: (phone) => <SettlementApprovals phone={phone} ask="reject" />,
  },
]

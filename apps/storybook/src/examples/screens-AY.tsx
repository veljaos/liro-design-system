import { Send, Truck } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  ChangeableValue,
  ChangeText,
  compareDecimal,
  DataTable,
  DateField,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DetailPage,
  DocumentPage,
  EditableGrid,
  KeyValueList,
  MoneyText,
  notice,
  NumberText,
  SelectField,
  StatusBadge,
  Toaster,
  toneFor,
  UnavailableAction,
  useLiro,
  type DataTableColumn,
  type EditableGridColumn,
  type GridMessage,
  type LifecycleStep,
  type ModuleTab,
  type Tone,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Tenant } from './screens-G'
import {
  AY_ROUTES,
  AY_TODAY,
  BALANCE_TOTALS,
  BALANCES,
  CENTRAL_STOCK,
  ITEM,
  MOVEMENT_TOTALS,
  MOVEMENTS,
  SENT_NOTE,
  STOCK_DOCUMENTS,
  TRANSFER_STATES,
  TRANSFERS,
  transferIncomplete,
  transferProblems,
  WAREHOUSES,
  type Movement,
  type StockDocument,
  type StockDocumentLine,
  type Transfer,
  type TransferLine,
  type TransferState,
  type WarehouseBalance,
  type WarehouseId,
} from './data-AY'
import { BB_ROUTES } from './data-BB'

/*
 * Group AY's example screens (P5.51, the item card and transfers): Kvadrat Gradnja d.o.o.'s
 * Inventory module on 14.10.2026 at 09:40. The item card is a DetailPage — the key figures, the
 * balance per warehouse with its value (a press shows that warehouse's movements), the movements
 * of the period with the running balance and value, each document a link (drill-down: a transfer,
 * a goods receipt, a delivery note, an issue). A transfer between the warehouses is a
 * DocumentPage: from, to, the lines with what the source can give (an EditableGrid while it is a
 * draft; the application checks each line), Draft → In transit → Received in the application's
 * words. Every figure comes from data-AY.ts; the screens add nothing.
 */

export { AY_ROUTES }

/** The application's states of stock documents and their tones. */
export const STOCK_TONES: Record<string, Tone> = {
  Active: 'success',
  Draft: 'neutral',
  'In transit': 'info',
  Received: 'success',
  Posted: 'success',
  Counting: 'info',
  'Awaiting signatures': 'warning',
  Signed: 'success',
}

export function stockBadge(state: string) {
  return <StatusBadge label={state} tone={toneFor(state, STOCK_TONES)} />
}

/** Kvadrat Gradnja's Inventory module: items, transfers, stocktaking. */
export function inventoryTabs(current: 'items' | 'transfers' | 'stocktaking'): ModuleTab[] {
  return [
    { key: 'items', label: 'Items', href: `#${AY_ROUTES.item}` },
    { key: 'transfers', label: 'Transfers', href: `#${AY_ROUTES.transfer}` },
    { key: 'stocktaking', label: 'Stocktaking', href: `#${BB_ROUTES.list}` },
  ].map((tab) => ({ ...tab, current: tab.key === current }))
}

/** A document number inside a link or a sentence, always left to right. */
function Code({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>
}

/** A quantity with its unit ("460 bag"), the number through the provider's format. */
function useQuantity() {
  const { format } = useLiro()
  return (value: string, unit: string) => `${format.number(value)} ${unit}`
}

// ── The item card ─────────────────────────────────────────────────────────────────────────────

function balanceColumns(): DataTableColumn<WarehouseBalance>[] {
  return [
    {
      id: 'warehouse',
      header: 'Warehouse',
      cell: (row) => WAREHOUSES[row.id].name,
    },
    {
      id: 'onHand',
      header: 'On hand',
      align: 'end',
      numeric: true,
      cell: (row) => <NumberText value={row.onHand} />,
    },
    {
      id: 'reserved',
      header: 'Reserved',
      align: 'end',
      numeric: true,
      cell: (row) => <NumberText value={row.reserved} />,
    },
    {
      id: 'available',
      header: 'Available',
      align: 'end',
      numeric: true,
      cell: (row) => <NumberText value={row.available} />,
    },
    {
      id: 'averageCost',
      header: 'Average cost',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.averageCost} currency="RSD" />,
    },
    {
      id: 'value',
      header: 'Value',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.value} currency="RSD" />,
    },
  ]
}

function MovementDocument({ movement }: { movement: Movement }) {
  const { linkComponent: Link } = useLiro()
  if (movement.document === undefined || movement.href === undefined) return movement.kind
  return (
    <Link
      href={`#${movement.href}`}
      className="bidi-isolate text-link no-underline hover:underline"
    >
      {movement.kind} <Code>{movement.document}</Code>
    </Link>
  )
}

function movementColumns(): DataTableColumn<Movement>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      numeric: true,
      align: 'start',
      cell: (row) => <DateText value={row.date} />,
    },
    {
      id: 'document',
      header: 'Document',
      cell: (row) => <MovementDocument movement={row} />,
    },
    { id: 'note', header: 'Partner or purpose', minWidth: 200, cell: (row) => row.note },
    {
      id: 'in',
      header: 'In',
      align: 'end',
      numeric: true,
      cell: (row) => (row.quantityIn === null ? null : <NumberText value={row.quantityIn} />),
    },
    {
      id: 'out',
      header: 'Out',
      align: 'end',
      numeric: true,
      cell: (row) => (row.quantityOut === null ? null : <NumberText value={row.quantityOut} />),
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'end',
      numeric: true,
      cell: (row) => <NumberText value={row.balance} />,
    },
    {
      id: 'value',
      header: 'Value',
      align: 'end',
      numeric: true,
      cell: (row) => <ChangeText value={row.value} currency="RSD" />,
    },
    {
      id: 'balanceValue',
      header: 'Balance value',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.balanceValue} currency="RSD" />,
    },
  ]
}

const WAREHOUSE_OPTIONS = (Object.keys(WAREHOUSES) as WarehouseId[]).map((id) => ({
  value: id,
  label: WAREHOUSES[id].name,
}))

function ItemCard({ phone, warehouse }: { phone: boolean; warehouse: WarehouseId }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const quantity = useQuantity()
  const [shown, setShown] = useState<WarehouseId>(warehouse)
  const totals = MOVEMENT_TOTALS[shown]
  return (
    <Tenant today={AY_TODAY}>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Inventory', href: `#${AY_ROUTES.item}` }, { label: ITEM.name }]}
        tabs={inventoryTabs('items')}
      >
        <DetailPage
          layout={phone ? 'phone' : 'desktop'}
          title={ITEM.name}
          status={stockBadge('Active')}
          subtitle={
            <>
              {ITEM.group} · <Code>{ITEM.code}</Code>
            </>
          }
          actions={
            <Button
              family="primary"
              icon={Truck}
              label="New transfer"
              emphasis="secondary"
              onClick={() => {
                navigate(AY_ROUTES.transfer)
              }}
            />
          }
          keyFigures={[
            { key: 'onHand', label: 'On hand', value: quantity(BALANCE_TOTALS.onHand, ITEM.unit) },
            {
              key: 'available',
              label: 'Available',
              value: quantity(BALANCE_TOTALS.available, ITEM.unit),
            },
            {
              key: 'value',
              label: 'Stock value',
              value: <MoneyText value={BALANCE_TOTALS.value} currency="RSD" />,
            },
            {
              key: 'average',
              label: 'Average cost',
              value: <MoneyText value={BALANCE_TOTALS.averageCost} currency="RSD" />,
            },
          ]}
          sections={[
            {
              id: 'balances',
              label: 'Balance by warehouse',
              description: `On ${format.date(AY_TODAY)} at 09:40. Choose a warehouse to see its movements.`,
              flush: true,
              content: (
                <DataTable
                  label="Balance by warehouse"
                  inCard
                  layout={phone ? 'cards' : 'table'}
                  columns={balanceColumns()}
                  rows={BALANCES}
                  getRowId={(row) => row.id}
                  getRowLabel={(row) => WAREHOUSES[row.id].name}
                  onRowClick={(row) => {
                    setShown(row.id)
                  }}
                  totals={{
                    onHand: <NumberText value={BALANCE_TOTALS.onHand} />,
                    reserved: <NumberText value={BALANCE_TOTALS.reserved} />,
                    available: <NumberText value={BALANCE_TOTALS.available} />,
                    averageCost: <MoneyText value={BALANCE_TOTALS.averageCost} currency="RSD" />,
                    value: <MoneyText value={BALANCE_TOTALS.value} currency="RSD" />,
                  }}
                  totalsLabel="Both warehouses"
                  mobile={{
                    title: (row) => WAREHOUSES[row.id].name,
                    details: ['onHand', 'reserved', 'available', 'averageCost', 'value'],
                  }}
                />
              ),
            },
            {
              id: 'movements',
              label: 'Movements',
              description: `${WAREHOUSES[shown].name}, ${format.date('2026-10-01')} – ${format.date(AY_TODAY)}`,
              flush: true,
              actions: (
                <SelectField
                  label="Warehouse"
                  hideLabel
                  options={WAREHOUSE_OPTIONS}
                  value={shown}
                  onChange={(value) => {
                    setShown(value === 'site' ? 'site' : 'central')
                  }}
                />
              ),
              content: (
                <DataTable
                  label={`Movements in ${WAREHOUSES[shown].name}`}
                  inCard
                  layout={phone ? 'cards' : 'table'}
                  columns={movementColumns()}
                  rows={MOVEMENTS[shown]}
                  getRowId={(row) => row.id}
                  getRowLabel={(row) =>
                    row.document === undefined ? row.kind : `${row.kind} ${row.document}`
                  }
                  totals={{
                    in: <NumberText value={totals.quantityIn} />,
                    out: <NumberText value={totals.quantityOut} />,
                    balance: <NumberText value={totals.balance} />,
                    value: <ChangeText value={totals.value} currency="RSD" />,
                    balanceValue: <MoneyText value={totals.balanceValue} currency="RSD" />,
                  }}
                  totalsLabel="Period"
                  mobile={{
                    title: (row) => <MovementDocument movement={row} />,
                    subtitle: (row) => (
                      <>
                        <DateText value={row.date} /> · {row.note}
                      </>
                    ),
                    details: ['in', 'out', 'balance', 'value', 'balanceValue'],
                  }}
                />
              ),
            },
            {
              id: 'details',
              label: 'Details',
              content: (
                <KeyValueList
                  items={[
                    { label: 'Code', value: <Code>{ITEM.code}</Code> },
                    { label: 'Unit', value: ITEM.unit },
                    { label: 'Group', value: ITEM.group },
                    { label: 'VAT rate', value: ITEM.vat, numeric: true },
                    { label: 'Main supplier', value: ITEM.supplier },
                    { label: 'Stock account', value: ITEM.account },
                    { label: 'Valuation', value: ITEM.valuation },
                    {
                      label: 'Minimum in Central warehouse',
                      value: quantity(ITEM.minimum, ITEM.unit),
                      numeric: true,
                    },
                  ]}
                />
              ),
            },
          ]}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── Transfers ─────────────────────────────────────────────────────────────────────────────────

const TRANSFER_STEPS: LifecycleStep[] = TRANSFER_STATES.map((state) => ({
  key: state,
  label: state,
}))

function transferDetails(transfer: Transfer, date: ReactNode) {
  return (
    <>
      <ChangeableValue label="From" value={WAREHOUSES[transfer.from].name} />
      <ChangeableValue label="To" value={WAREHOUSES[transfer.to].name} />
      {date}
      <ChangeableValue label="Purpose" value={transfer.purpose} />
      <ChangeableValue label="Prepared by" value={transfer.preparedBy} />
    </>
  )
}

const ITEM_OPTIONS = CENTRAL_STOCK.map((each) => ({ value: each.code, label: each.item }))

function TransferDraft({ phone, transfer }: { phone: boolean; transfer: Transfer }) {
  const { format } = useLiro()
  const [lines, setLines] = useState<readonly TransferLine[]>(transfer.lines)
  const [date, setDate] = useState<string | null>(transfer.date)
  const [state, setState] = useState<TransferState>('Draft')
  if (state !== 'Draft') {
    return <TransferView phone={phone} transfer={{ ...transfer, lines, state, sent: SENT_NOTE }} />
  }
  const problems = transferProblems(lines, compareDecimal, (value) => format.number(value))
  const messages: Record<string, GridMessage[]> = {}
  for (const [id, problem] of Object.entries(problems)) {
    messages[id] = [{ tone: 'danger', text: problem.text, columns: problem.columns }]
  }
  const reason =
    Object.keys(problems).length > 0
      ? 'A line asks for more than Central warehouse can give.'
      : transferIncomplete(lines, compareDecimal)
        ? 'Every line needs an item and a quantity.'
        : undefined
  const send =
    reason === undefined ? (
      <Button
        family="primary"
        icon={Send}
        emphasis="primary"
        label="Send"
        onClick={() => {
          setState('In transit')
          notice.success(`${transfer.number} is on its way to ${WAREHOUSES[transfer.to].name}.`)
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={Send}
        emphasis="primary"
        label="Send"
        reason={reason}
      />
    )
  const columns: EditableGridColumn<TransferLine>[] = [
    {
      id: 'item',
      header: 'Item',
      type: 'combobox',
      value: (line) => (line.code === null ? null : { value: line.code, label: line.item }),
      options: ITEM_OPTIONS,
    },
    {
      id: 'available',
      header: 'Available',
      width: 120,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (line) => <NumberText value={line.available} />,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      width: 120,
      type: 'number',
      value: (line) => line.quantity,
    },
    { id: 'unit', header: 'Unit', width: 80, type: 'display', display: (line) => line.unit },
  ]
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Transfers', href: `#${AY_ROUTES.transfer}` }, { label: transfer.number }]}
      tabs={inventoryTabs('transfers')}
      {...(phone ? { bottomBar: send } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={transfer.number}
        status={stockBadge('Draft')}
        lifecycle={{ steps: TRANSFER_STEPS, current: 0, label: 'Transfer status' }}
        details={transferDetails(
          transfer,
          <ChangeableValue
            label="Date"
            value={<DateText value={date} />}
            field={<DateField label="Date" value={date} onChange={setDate} />}
          />,
        )}
        actions={
          <>
            <Button
              intent="save"
              emphasis="secondary"
              label="Save draft"
              onClick={() => {
                notice.success(`${transfer.number} saved.`)
              }}
            />
            {phone ? null : send}
          </>
        }
        lines={
          <EditableGrid<TransferLine>
            label={`Lines of ${transfer.number}`}
            inCard
            layout={phone ? 'phone' : 'desktop'}
            columns={columns}
            rows={lines}
            getRowId={(line) => line.id}
            messages={messages}
            onCellChange={(rowId, columnId, value) => {
              setLines((current) =>
                current.map((line) => {
                  if (line.id !== rowId) return line
                  if (columnId === 'quantity') {
                    return { ...line, quantity: typeof value === 'string' ? value : null }
                  }
                  if (columnId === 'item') {
                    const code =
                      typeof value === 'object' && value !== null && 'value' in value
                        ? String(value.value)
                        : null
                    const stock = CENTRAL_STOCK.find((each) => each.code === code)
                    return stock === undefined
                      ? { ...line, code: null, item: '', unit: '', available: null }
                      : {
                          ...line,
                          code: stock.code,
                          item: stock.item,
                          unit: stock.unit,
                          available: stock.available,
                        }
                  }
                  return line
                }),
              )
            }}
            onAddRow={(index) => {
              setLines((current) => [
                ...current.slice(0, index),
                {
                  id: `n${String(current.length + 1)}`,
                  code: null,
                  item: '',
                  unit: '',
                  available: null,
                  quantity: null,
                },
                ...current.slice(index),
              ])
            }}
            onRemoveRow={(rowId) => {
              setLines((current) => current.filter((line) => line.id !== rowId))
            }}
          />
        }
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

function TransferView({ phone, transfer }: { phone: boolean; transfer: Transfer }) {
  const received = transfer.state === 'Received'
  const columns: DataTableColumn<TransferLine>[] = [
    { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.item },
    {
      id: 'quantity',
      header: 'Sent',
      align: 'end',
      numeric: true,
      cell: (line) => <NumberText value={line.quantity} />,
    },
    ...(received
      ? [
          {
            id: 'received',
            header: 'Received',
            align: 'end' as const,
            numeric: true,
            cell: (line: TransferLine) => <NumberText value={line.received ?? null} />,
          },
        ]
      : []),
    { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  ]
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Transfers', href: `#${AY_ROUTES.transfer}` }, { label: transfer.number }]}
      tabs={inventoryTabs('transfers')}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={transfer.number}
        back={{ href: `#${AY_ROUTES.item}`, label: ITEM.name }}
        status={stockBadge(transfer.state)}
        lifecycle={{
          steps: TRANSFER_STEPS,
          current: TRANSFER_STATES.indexOf(transfer.state),
          label: 'Transfer status',
        }}
        details={transferDetails(
          transfer,
          <ChangeableValue label="Date" value={<DateText value={transfer.date} />} />,
        )}
        lines={
          <DataTable
            label={`Lines of ${transfer.number}`}
            inCard
            layout={phone ? 'cards' : 'table'}
            columns={columns}
            rows={transfer.lines}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.item}
            mobile={{ details: received ? ['quantity', 'received', 'unit'] : ['quantity', 'unit'] }}
          />
        }
        sections={[
          {
            key: 'shipment',
            title: 'Shipment',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  { label: 'Sent', value: transfer.sent ?? '—' },
                  {
                    label: 'Received',
                    value:
                      transfer.received ??
                      `Waiting for ${WAREHOUSES[transfer.to].keeper} at ${WAREHOUSES[transfer.to].name}`,
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

function TransferScreen({
  phone,
  number,
  sent = false,
}: {
  phone: boolean
  number: string
  sent?: boolean
}) {
  const transfer = TRANSFERS.find((each) => each.number === number)
  if (transfer === undefined) return null
  return (
    <Tenant today={AY_TODAY}>
      {transfer.state === 'Draft' && !sent ? (
        <TransferDraft phone={phone} transfer={transfer} />
      ) : (
        <TransferView
          phone={phone}
          transfer={sent ? { ...transfer, state: 'In transit', sent: SENT_NOTE } : transfer}
        />
      )}
    </Tenant>
  )
}

// ── Other stock documents ─────────────────────────────────────────────────────────────────────

function StockDocumentScreen({ phone, document }: { phone: boolean; document: StockDocument }) {
  const columns: DataTableColumn<StockDocumentLine>[] = [
    { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.item },
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
      header: 'Cost',
      align: 'end',
      numeric: true,
      cell: (line) => <MoneyText value={line.price} currency="RSD" />,
    },
    {
      id: 'value',
      header: 'Value',
      align: 'end',
      numeric: true,
      cell: (line) => <MoneyText value={line.value} currency="RSD" />,
    },
  ]
  return (
    <Tenant today={AY_TODAY}>
      <Shell
        phone={phone}
        crumbs={[
          { label: 'Inventory', href: `#${AY_ROUTES.item}` },
          { label: `${document.kind} ${document.number}` },
        ]}
        tabs={inventoryTabs('items')}
      >
        <DocumentPage
          layout={phone ? 'phone' : 'desktop'}
          title={document.number}
          back={{ href: `#${AY_ROUTES.item}`, label: ITEM.name }}
          status={stockBadge('Posted')}
          counterparty={{
            label: document.party.label,
            name: document.party.name,
            ...(document.party.taxId === undefined ? {} : { taxId: document.party.taxId }),
          }}
          details={
            <>
              <ChangeableValue label="Kind" value={document.kind} />
              <ChangeableValue label="Warehouse" value={WAREHOUSES[document.warehouse].name} />
              <ChangeableValue label="Date" value={<DateText value={document.date} />} />
              {document.basedOn === undefined ? null : (
                <ChangeableValue label="Based on" value={document.basedOn} />
              )}
              <ChangeableValue label="Posted by" value={document.postedBy} />
            </>
          }
          lines={
            <DataTable
              label={`Lines of ${document.number}`}
              inCard
              layout={phone ? 'cards' : 'table'}
              columns={columns}
              rows={document.lines}
              getRowId={(line) => line.id}
              getRowLabel={(line) => line.item}
              mobile={{ details: ['quantity', 'unit', 'price', 'value'] }}
            />
          }
          totals={{
            label: 'Totals',
            rows: [],
            total: { key: 'total', label: 'Total at cost', value: document.total, currency: 'RSD' },
          }}
        />
      </Shell>
    </Tenant>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AY_ROUTES: ExampleRoute[] = [
  { path: AY_ROUTES.item, render: (phone) => <ItemCard phone={phone} warehouse="central" /> },
  { path: AY_ROUTES.itemSite, render: (phone) => <ItemCard phone={phone} warehouse="site" /> },
  {
    path: AY_ROUTES.transferSent,
    render: (phone) => <TransferScreen phone={phone} number="MP-2026-0031" sent />,
  },
  ...TRANSFERS.map((transfer) => ({
    path: AY_ROUTES.transferOf(transfer.number),
    render: (phone: boolean) => <TransferScreen phone={phone} number={transfer.number} />,
  })),
  ...STOCK_DOCUMENTS.map((document) => ({
    path: AY_ROUTES.documentOf(document.number),
    render: (phone: boolean) => <StockDocumentScreen phone={phone} document={document} />,
  })),
]

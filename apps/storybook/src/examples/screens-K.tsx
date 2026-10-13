import {
  ArrowRightLeft,
  Bike,
  CircleCheck,
  HandPlatter,
  Merge,
  ReceiptText,
  RotateCcw,
  Save,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  BrandLockup,
  Button,
  CandidateList,
  ChangeConfirmDialog,
  Dialog,
  EmptyState,
  FloorPlan,
  KeyValueList,
  LiroProvider,
  MoneyText,
  notice,
  overlappingItems,
  PageHeader,
  QuantityStepper,
  SeatingChart,
  SectionCard,
  StatusBadge,
  Tabs,
  Toaster,
  applyFloorChanges,
  seatingChanges,
  useLiro,
  type FloorItem,
  type FloorWarning,
  type KeyValueItem,
  type ModuleTab,
  type SeatingGuest,
  type SeatRef,
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { useExampleState } from './example-state'
import { Navigate, Shell, type ExampleAccount } from './example-shell'
import { Frame } from './screens-G'
import {
  BISTRO,
  BISTRO_AREAS,
  BISTRO_ORDERS,
  BISTRO_PALETTE,
  BISTRO_SIZE,
  BISTRO_STATES,
  BISTRO_TABLES,
  bistroItems,
  CAFE,
  CAFE_SIZE,
  CAFE_STATES,
  CAFE_TABLES,
  GALA,
  GALA_CONFLICTS,
  GALA_FIXTURES,
  GALA_GUESTS,
  GALA_SEAT,
  GALA_SIZE,
  GALA_TABLES,
  guestsText,
  K_ROUTES,
  layoutTables,
  mergedBox,
  moveTargets,
  type BistroTable,
  type CafeTable,
  type ChannelOrder,
} from './data-K'
import { BISTRO_VENUE, CAFE_VENUE, tabTotal, type Tab } from './data-K-tabs'
import { TabTill, useTabs, type TabStart } from './screens-K-tabs'

/** The states of a tab pictured on table 3 (P5.28 item 22). */
const TAB_STARTS: readonly TabStart[] = [
  'new',
  'edit',
  'discount',
  'split',
  'pay-part',
  'move',
  'bill',
  'closed',
]

/*
 * Group K's example screens (P5.25): floor plans and seating, each played by the application
 * around the components (data-K.ts): it keeps the tables and the guests, decides every change
 * the plan reports, and computes every figure; the components show and report.
 * - Bistro Dunav's evening service (FloorPlan): the hall, the terrace and the bar; a table chosen
 *   shows its party and what can be done — open a free table, move a party with "Move to table…",
 *   seat a reservation, mark a table clean; the floor plan in edit mode, where two terrace tables
 *   are merged into one for a party.
 * - Kafić Kod Mike's terrace on the bar's tablet (touch density): a table opens its order on the
 *   till (PosShell, ProductGrid, CartPanel of P5.10).
 * - Konferencija Liro 2026's gala dinner (SeatingChart): 14 tables of ten, 112 of 140 seated.
 */

export { K_ROUTES }

// ── Bistro Dunav ──────────────────────────────────────────────────────────────────────────────

const BISTRO_COMPANY: ShellCompany = {
  id: BISTRO.companyId,
  name: BISTRO.name,
  description: BISTRO.address,
}

const BISTRO_ACCOUNT: ExampleAccount = {
  name: BISTRO.manager.name,
  email: BISTRO.manager.email,
  companies: [BISTRO_COMPANY],
  links: [
    { label: 'Floor', path: K_ROUTES.floor },
    { label: 'Floor plan', path: K_ROUTES.floorEdit },
  ],
}

const BISTRO_TABS = (current: 'floor' | 'plan'): ModuleTab[] => [
  { key: 'floor', label: 'Floor', href: `#${K_ROUTES.floor}`, current: current === 'floor' },
  { key: 'plan', label: 'Floor plan', href: `#${K_ROUTES.floorEdit}`, current: current === 'plan' },
]

function BistroShell({
  phone,
  tab,
  children,
}: {
  phone: boolean
  tab: 'floor' | 'plan'
  children: ReactNode
}) {
  return (
    <Shell
      phone={phone}
      account={BISTRO_ACCOUNT}
      company={BISTRO_COMPANY.id}
      crumbs={[
        { label: BISTRO.name, href: `#${K_ROUTES.floor}` },
        { label: tab === 'floor' ? 'Floor' : 'Floor plan' },
      ]}
      tabs={BISTRO_TABS(tab)}
    >
      {children}
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

/** "Table 7". */
function tableName(table: BistroTable): string {
  return `Table ${String(table.number)}`
}

/** The chosen table: its party, and what the host can do (the main action last). */
function TablePanel({
  table,
  onOpen,
  onMove,
  onSeat,
  onClear,
  onClean,
  onTab,
  tabText,
}: {
  table: BistroTable | undefined
  onOpen: () => void
  onMove: () => void
  onSeat: () => void
  onClear: () => void
  onClean: () => void
  /** Opens the table's tab on the till (P5.28 item 22). */
  onTab: () => void
  /** What the tab still has to pay, written; null without a tab. */
  tabText: string | null
}) {
  const { format } = useLiro()
  const number = (value: string) => format.number(value)
  if (table === undefined) {
    return (
      <SectionCard title="Table" headingLevel={2}>
        <EmptyState
          compact
          title="No table chosen"
          description="Choose a table on the plan or in the list to see its guests."
        />
      </SectionCard>
    )
  }
  const state = BISTRO_STATES.find((each) => each.id === table.state)
  const party = table.party
  const items: KeyValueItem[] = [
    { label: 'Area', value: BISTRO_AREAS.find((area) => area.id === table.areaId)?.label ?? '' },
    { label: 'Seats', value: number(String(table.seats)), numeric: true },
    ...(party === undefined
      ? []
      : [
          { label: 'Guests', value: guestsText(party.size, number) },
          {
            label: table.state === 'reserved' ? 'Reserved for' : 'Since',
            value: party.time,
            numeric: true,
          },
          ...(party.name === undefined ? [] : [{ label: 'Name', value: party.name }]),
          ...(party.phone === undefined
            ? []
            : [{ label: 'Phone', value: <span dir="ltr">{party.phone}</span> }]),
          ...(party.note === undefined
            ? []
            : [{ label: 'Note', value: party.note, fullWidth: true }]),
        ]),
    ...(tabText === null ? [] : [{ label: 'Tab', value: tabText, numeric: true }]),
  ]
  const actions =
    table.state === 'free' ? (
      <Button
        family="primary"
        emphasis="primary"
        icon={UsersRound}
        label="Open table"
        onClick={onOpen}
      />
    ) : table.state === 'occupied' ? (
      <>
        <Button family="neutral" icon={Sparkles} label="Clear table" onClick={onClear} />
        <Button family="neutral" icon={ReceiptText} label="Tab" onClick={onTab} />
        <Button
          family="primary"
          emphasis="primary"
          icon={ArrowRightLeft}
          label="Move to table…"
          onClick={onMove}
        />
      </>
    ) : table.state === 'reserved' ? (
      <>
        <Button family="neutral" icon={ArrowRightLeft} label="Move to table…" onClick={onMove} />
        <Button
          family="primary"
          emphasis="primary"
          icon={UsersRound}
          label="Seat guests"
          onClick={onSeat}
        />
      </>
    ) : (
      <Button
        family="primary"
        emphasis="primary"
        icon={Sparkles}
        label="Mark as clean"
        onClick={onClean}
      />
    )
  return (
    <SectionCard
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="bidi-content">{tableName(table)}</span>
          {state !== undefined && (
            <StatusBadge label={state.label} tone={state.tone} icon={state.icon} />
          )}
        </span>
      }
      headingLevel={2}
    >
      <div className="flex flex-col gap-4">
        <KeyValueList items={items} columns={1} />
        <div className="flex flex-wrap justify-end gap-2">{actions}</div>
      </div>
    </SectionCard>
  )
}

/** "Sala · 4 seats": where a table stands and how many it seats. */
function tablePlace(table: BistroTable, number: (value: string) => string): string {
  const area = BISTRO_AREAS.find((each) => each.id === table.areaId)?.label ?? ''
  return `${area} · ${number(String(table.seats))} seats`
}

/** An order of a channel (takeaway, delivery) as the host sees it, with its next step. */
function ChannelOrders({
  channel,
  orders,
  onAdvance,
}: {
  channel: ChannelOrder['channel']
  orders: readonly ChannelOrder[]
  onAdvance: (order: ChannelOrder) => void
}) {
  const shown = orders.filter((order) => order.channel === channel && order.state !== 'done')
  if (shown.length === 0) {
    return (
      <EmptyState
        compact
        title={channel === 'takeaway' ? 'No takeaway orders' : 'No deliveries'}
        description="New orders from the till appear here."
      />
    )
  }
  const STATE: Record<
    ChannelOrder['state'],
    { label: string; tone: 'neutral' | 'success' | 'warning' }
  > = {
    preparing: { label: 'Preparing', tone: 'neutral' },
    ready: { label: channel === 'takeaway' ? 'Ready for pick-up' : 'Ready to go', tone: 'success' },
    out: { label: 'Out for delivery', tone: 'warning' },
    done: { label: 'Done', tone: 'neutral' },
  }
  const next = (order: ChannelOrder) =>
    order.state === 'preparing'
      ? 'Mark as ready'
      : order.state === 'ready'
        ? channel === 'takeaway'
          ? 'Handed over'
          : 'Out for delivery'
        : 'Delivered'
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {shown.map((order) => (
        <li key={order.id}>
          <SectionCard
            title={
              <span className="flex flex-wrap items-center gap-2">
                <span dir="ltr" className="bidi-isolate">
                  {order.number}
                </span>
                <StatusBadge label={STATE[order.state].label} tone={STATE[order.state].tone} />
              </span>
            }
            headingLevel={3}
            actions={
              <Button
                family="neutral"
                icon={
                  order.state === 'preparing'
                    ? CircleCheck
                    : order.channel === 'delivery'
                      ? Bike
                      : HandPlatter
                }
                label={next(order)}
                onClick={() => {
                  onAdvance(order)
                }}
              />
            }
          >
            <KeyValueList
              columns={1}
              items={[
                { label: 'Name', value: order.name },
                {
                  label: channel === 'takeaway' ? 'Pick-up' : 'Delivery',
                  value: order.time,
                  numeric: true,
                },
                ...(order.address === undefined
                  ? []
                  : [{ label: 'Address', value: order.address }]),
                ...(order.phone === undefined
                  ? []
                  : [{ label: 'Phone', value: <span dir="ltr">{order.phone}</span> }]),
                {
                  label: 'Total',
                  value: <MoneyText value={order.total} currency={BISTRO_VENUE.currency} />,
                  numeric: true,
                },
              ]}
            />
          </SectionCard>
        </li>
      ))}
    </ul>
  )
}

/**
 * Moving a party (P5.28 items 6, 9, 25): the free tables with seats enough, best first, chosen and
 * confirmed in one dialog — the table old → new and, for a reservation, the guest's SMS as a
 * choice. When no free table is big enough the dialog says so and offers merging tables.
 */
function MoveGuestsDialog({
  phone,
  table,
  tables,
  open,
  onOpenChange,
  onMove,
  onMerge,
}: {
  phone: boolean
  table: BistroTable
  tables: readonly BistroTable[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onMove: (to: BistroTable, notify: readonly string[]) => void
  onMerge: () => void
}) {
  const { format } = useLiro()
  const number = (value: string) => format.number(value)
  const party = table.party
  const targets = moveTargets(tables, table)
  const [target, setTarget] = useState(targets[0]?.id ?? '')
  const to = targets.find((each) => each.id === target) ?? targets[0]
  if (party === undefined) return null
  const subject = `${tableName(table)} · ${party.name === undefined ? '' : `${party.name}, `}${guestsText(party.size, number)}`
  if (to === undefined) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Move guests"
        subject={subject}
        actions={
          <>
            <Button
              intent="cancel"
              label={phone ? 'Close' : 'Cancel'}
              onClick={() => {
                onOpenChange(false)
              }}
            />
            {/* The floor plan is edited on a computer or a tablet (P5.28 item 27). */}
            {!phone && (
              <Button
                family="primary"
                emphasis="primary"
                icon={Merge}
                label="Merge tables in the floor plan"
                onClick={onMerge}
              />
            )}
          </>
        }
      >
        <EmptyState
          compact
          title={`No free table seats ${guestsText(party.size, number)}`}
          description={
            phone
              ? 'Merge two free tables in the floor plan on a computer or tablet, or wait for a table to be cleared.'
              : 'Merge two free tables in the floor plan, or wait for a table to be cleared.'
          }
        />
      </Dialog>
    )
  }
  return (
    <ChangeConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Move guests"
      subject={subject}
      changes={[
        {
          label: 'Table',
          from: `${tableName(table)} · ${tablePlace(table, number)}`,
          to: `${tableName(to)} · ${tablePlace(to, number)}`,
        },
      ]}
      {...(table.state === 'reserved' && party.phone !== undefined
        ? {
            affected: `${party.name ?? ''} (reservation for ${party.time})`,
            notify: [
              {
                id: 'guest',
                label: `Notify ${party.name ?? ''} by SMS`,
                description: `To ${party.phone}: the new table for ${party.time}.`,
              },
            ],
          }
        : {
            affected: 'The waiter and the kitchen see the new table at once.',
          })}
      confirmLabel="Move"
      onConfirm={(answer) => {
        onMove(to, answer.notify)
      }}
    >
      <CandidateList
        label="Free tables with enough seats"
        multiple={false}
        selected={[to.id]}
        onSelectedChange={(ids) => {
          setTarget(ids[0] ?? to.id)
        }}
        candidates={targets.map((each) => ({
          id: each.id,
          title: tableName(each),
          label: `${tableName(each)}, ${tablePlace(each, number)}`,
          subtitle: tablePlace(each, number),
          ...(each.areaId === table.areaId ? { reason: 'Same area' } : {}),
        }))}
      />
    </ChangeConfirmDialog>
  )
}

/** Bistro Dunav's evening service: the floor (dine-in), takeaway and delivery; open and move. */
export function Service({
  phone,
  tableId,
  dialog,
  channel: initialChannel = 'dine-in',
  area,
}: {
  phone: boolean
  tableId?: string
  dialog?: 'open' | 'move'
  channel?: 'dine-in' | 'takeaway' | 'delivery'
  area?: string
}) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const number = (value: string) => format.number(value)
  // The tables and the orders are the restaurant's records: kept above the screens (P5.28).
  const [tables, setTables] = useExampleState<readonly BistroTable[]>(
    'bistro.tables',
    () => BISTRO_TABLES,
  )
  const [orders, setOrders] = useExampleState<readonly ChannelOrder[]>(
    'bistro.orders',
    () => BISTRO_ORDERS,
  )
  const [channel, setChannel] = useState(initialChannel)
  const [chosen, setChosen] = useState<string | undefined>(tableId)
  const [open, setOpen] = useState(dialog === 'open')
  const [move, setMove] = useState(dialog === 'move')
  const [partySize, setPartySize] = useState<string | null>('2')
  const table = tables.find((each) => each.id === chosen)
  const update = (id: string, change: Partial<BistroTable>, drop?: 'party') => {
    setTables((current) =>
      current.map((each) => {
        if (each.id !== id) return each
        const next = { ...each, ...change }
        if (drop === 'party') delete next.party
        return next
      }),
    )
  }
  const items = bistroItems(tables, number)
  const tabs = useTabs(BISTRO_VENUE)
  const tab = chosen === undefined ? undefined : tabs[chosen]
  const tabRest = tabTotal(BISTRO_VENUE, tab)
  const plan = (
    <FloorPlan
      label={`${BISTRO.name}, evening service`}
      items={items}
      width={BISTRO_SIZE.width}
      height={BISTRO_SIZE.height}
      areas={BISTRO_AREAS}
      states={BISTRO_STATES}
      {...(area === undefined ? {} : { defaultArea: area })}
      selected={chosen === undefined ? [] : [chosen]}
      onSelectionChange={(selected) => {
        setChosen(selected[0])
      }}
      onItemActivate={(item) => {
        setChosen(item.id)
      }}
      layout={phone ? 'phone' : 'desktop'}
    />
  )
  const panel = (
    <TablePanel
      table={table}
      onOpen={() => {
        setPartySize(String(Math.min(2, table?.seats ?? 2)))
        setOpen(true)
      }}
      onMove={() => {
        setMove(true)
      }}
      onSeat={() => {
        if (table === undefined) return
        update(table.id, {
          state: 'occupied',
          party: { ...(table.party ?? { size: 1 }), time: BISTRO.now },
        })
        notice.success(`${tableName(table)}: guests seated at ${BISTRO.now}.`)
      }}
      onClear={() => {
        if (table === undefined) return
        update(table.id, { state: 'cleaning' }, 'party')
        notice.success(`${tableName(table)} cleared. It waits for cleaning.`)
      }}
      onClean={() => {
        if (table === undefined) return
        update(table.id, { state: 'free' })
        notice.success(`${tableName(table)} is free.`)
      }}
      onTab={() => {
        if (table !== undefined) navigate(BISTRO_VENUE.tableRoute(table.id))
      }}
      tabText={tabRest === null ? null : format.money(tabRest, BISTRO_VENUE.currency)}
    />
  )
  const size = partySize === null ? null : Number.parseInt(partySize, 10)
  const sizeError =
    table !== undefined && (size === null || Number.isNaN(size) || size < 1 || size > table.seats)
      ? `From 1 to ${number(String(table.seats))} guests.`
      : undefined
  const waiting = (kind: ChannelOrder['channel']) =>
    orders.filter((order) => order.channel === kind && order.state !== 'done').length
  const floor = phone ? (
    <div className="flex flex-col gap-4">
      {table !== undefined && panel}
      {plan}
    </div>
  ) : (
    <div className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-6">
      {plan}
      {panel}
    </div>
  )
  const advance = (order: ChannelOrder) => {
    const next: ChannelOrder['state'] =
      order.state === 'preparing'
        ? 'ready'
        : order.state === 'ready' && order.channel === 'delivery'
          ? 'out'
          : 'done'
    setOrders((current) =>
      current.map((each) => (each.id === order.id ? { ...each, state: next } : each)),
    )
    notice.success(
      next === 'ready'
        ? `${order.number} is ready.`
        : next === 'out'
          ? `${order.number} is out for delivery.`
          : `${order.number} is done.`,
    )
  }
  return (
    <BistroShell phone={phone} tab="floor">
      <Frame phone={phone} wide>
        <PageHeader
          title="Floor"
          titleHidden
          subtitle={`${format.dateLong('2026-10-06')} · ${BISTRO.now}`}
        />
        {/* P5.28 item 26: takeaway and delivery are the till's order channels, not plan areas. */}
        <Tabs
          label="Orders"
          value={channel}
          onValueChange={(value) => {
            if (value === 'dine-in' || value === 'takeaway' || value === 'delivery')
              setChannel(value)
          }}
          items={[
            { value: 'dine-in', label: 'Dine-in', content: floor },
            {
              value: 'takeaway',
              label: `Takeaway (${number(String(waiting('takeaway')))})`,
              content: <ChannelOrders channel="takeaway" orders={orders} onAdvance={advance} />,
            },
            {
              value: 'delivery',
              label: `Delivery (${number(String(waiting('delivery')))})`,
              content: <ChannelOrders channel="delivery" orders={orders} onAdvance={advance} />,
            },
          ]}
        />
      </Frame>
      {/* At page level, outside the Tabs (D16). */}
      {table !== undefined && (
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Open table"
          subject={tableName(table)}
          description={`${number(String(table.seats))} seats, from ${BISTRO.now}.`}
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setOpen(false)
                }}
              />
              <Button
                family="primary"
                emphasis="primary"
                icon={UsersRound}
                label="Open table"
                onClick={() => {
                  if (sizeError !== undefined || size === null) return
                  update(table.id, { state: 'occupied', party: { size, time: BISTRO.now } })
                  setOpen(false)
                  notice.success(`${tableName(table)} opened for ${guestsText(size, number)}.`)
                }}
              />
            </>
          }
        >
          <QuantityStepper
            label="Guests"
            value={partySize}
            onChange={setPartySize}
            min="1"
            max={String(table.seats)}
            {...(sizeError === undefined ? {} : { error: sizeError })}
          />
        </Dialog>
      )}
      {table?.party !== undefined && (
        <MoveGuestsDialog
          // A new round of choosing each time it opens: the best table first.
          key={`${table.id}:${String(move)}`}
          phone={phone}
          table={table}
          tables={tables}
          open={move}
          onOpenChange={setMove}
          onMerge={() => {
            navigate(K_ROUTES.floorEdit)
          }}
          onMove={(to, notify) => {
            const party = table.party
            if (party === undefined) return
            update(to.id, { state: table.state, party })
            update(table.id, { state: table.state === 'occupied' ? 'cleaning' : 'free' }, 'party')
            setChosen(to.id)
            const moved = `Guests moved from ${tableName(table)} to ${tableName(to)}.`
            notice.success(
              table.state !== 'reserved' || party.phone === undefined
                ? moved
                : notify.includes('guest')
                  ? `${moved} ${party.name ?? ''} gets an SMS.`
                  : `${moved} No message was sent.`,
            )
          }}
        />
      )}
    </BistroShell>
  )
}

/** The merged table as the plan draws it: "11 + 12", both tables' seats. */
function mergeItems(a: FloorItem, b: FloorItem): FloorItem | null {
  const box = mergedBox(a, b)
  if (box === null) return null
  return {
    ...a,
    ...box,
    id: `${a.id}+${b.id}`,
    shape: 'rect',
    label: `${a.label} + ${b.shortLabel ?? b.label}`,
    shortLabel: `${a.shortLabel ?? a.label} + ${b.shortLabel ?? b.label}`,
    capacity: (a.capacity ?? 0) + (b.capacity ?? 0),
  }
}

/** The plan with tables 11 and 12 merged (the restaurant's own change). */
function withMerge(items: readonly FloorItem[], a: string, b: string): FloorItem[] {
  const first = items.find((item) => item.id === a)
  const second = items.find((item) => item.id === b)
  const merged = first === undefined || second === undefined ? null : mergeItems(first, second)
  if (merged === null) return [...items]
  return [...items.filter((item) => item.id !== a && item.id !== b), merged]
}

/** The floor plan in edit mode: move, add, and merge two tables for a party. */
export function FloorEditor({ phone, merged }: { phone: boolean; merged: boolean }) {
  const { format } = useLiro()
  const number = (value: string) => format.number(value)
  // The plan starts from the tables the service keeps, and Save gives them their new places.
  const [tables, setTables] = useExampleState<readonly BistroTable[]>(
    'bistro.tables',
    () => BISTRO_TABLES,
  )
  const initial = bistroItems(tables, number)
  const [items, setItems] = useState<readonly FloorItem[]>(
    merged ? withMerge(initial, 't11', 't12') : initial,
  )
  const [selected, setSelected] = useState<readonly string[]>(merged ? ['t11+t12'] : ['t11', 't12'])
  const [next, setNext] = useState(1)
  const chosen = items.filter((item) => selected.includes(item.id))
  const [a, b] = chosen
  const canMerge =
    chosen.length === 2 && a !== undefined && b !== undefined && mergeItems(a, b) !== null
  // The application's warnings: overlapping items.
  const warnings: FloorWarning[] = overlappingItems(items).flatMap(([first, second]) => {
    const label = (id: string) => items.find((item) => item.id === id)?.label ?? id
    return [
      { itemId: first, text: `Overlaps ${label(second)}` },
      { itemId: second, text: `Overlaps ${label(first)}` },
    ]
  })
  return (
    <BistroShell phone={phone} tab="plan">
      <Frame phone={phone} wide>
        <PageHeader
          title="Floor plan"
          titleHidden
          subtitle={`${BISTRO.name} · ${BISTRO.address}`}
        />
        {merged && (
          <Alert tone="success" title="Tables 11 and 12 are one table of 8 for tonight.">
            The new table keeps number 11; it is split again after the service.
          </Alert>
        )}
        <FloorPlan
          label={`${BISTRO.name}, floor plan`}
          items={items}
          width={BISTRO_SIZE.width}
          height={BISTRO_SIZE.height}
          areas={BISTRO_AREAS}
          states={BISTRO_STATES}
          editing
          palette={BISTRO_PALETTE}
          selectionMode="multiple"
          selected={selected}
          onSelectionChange={setSelected}
          warnings={warnings}
          defaultView="plan"
          layout={phone ? 'phone' : 'desktop'}
          onChange={(changes) => {
            setItems((current) =>
              applyFloorChanges(current, changes, (_, index) => `new-${String(next + index)}`),
            )
            setNext((value) => value + changes.length)
          }}
          // On a phone the plan is not edited (P5.28 item 27): nothing to merge or save there.
          toolbar={
            phone ? undefined : (
              <>
                {canMerge && (
                  <Button
                    family="neutral"
                    icon={Merge}
                    label={`Merge ${a.label} and ${b.label}`}
                    onClick={() => {
                      setItems((current) => withMerge(current, a.id, b.id))
                      setSelected([`${a.id}+${b.id}`])
                      notice.success(`${a.label} and ${b.label} merged.`)
                    }}
                  />
                )}
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={Save}
                  label="Save floor plan"
                  onClick={() => {
                    setTables((current) => layoutTables(current, items))
                    notice.success('Floor plan saved. The service sees it at once.')
                  }}
                />
              </>
            )
          }
        />
      </Frame>
    </BistroShell>
  )
}

// ── Kafić Kod Mike ─────────────────────────────────────────────────────────────────────────────

/** The examples' provider again, with `density="touch"` (the bar's tablet). */
function Touch({ children }: { children: ReactNode }) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={liro.locale}
      direction={liro.direction}
      colorScheme={liro.colorScheme}
      messages={liro.messages}
      format={liro.format}
      today={liro.today}
      weekStartsOn={liro.weekStartsOn}
      timeZone={liro.timeZone}
      linkComponent={liro.linkComponent}
      density="touch"
    >
      {children}
    </LiroProvider>
  )
}

/** The terrace table's route. */
function terraceTableRoute(id: string): string {
  return `/cafe/kod-mike/terrace/${id}`
}

/**
 * The terrace as the plan draws it: each open table with since when and what its tab still has to
 * pay (P5.28 item 22: the tabs the application keeps, `useTabs`).
 */
function terraceItems(
  tables: readonly CafeTable[],
  tabs: Readonly<Record<string, Tab>>,
  money: (value: string) => string,
): FloorItem[] {
  return [
    ...tables.map((table) => {
      const tab = tabs[table.id]
      const total = tabTotal(CAFE_VENUE, tab)
      const since = tab?.openedAt
      const state =
        tab === undefined
          ? table.state === 'open'
            ? 'free'
            : table.state
          : table.state === 'bill'
            ? 'bill'
            : 'open'
      return {
        id: table.id,
        kind: 'table' as const,
        shape: 'round' as const,
        label: `Table ${String(table.number)}`,
        shortLabel: String(table.number),
        x: table.x,
        y: table.y,
        width: 140,
        height: 140,
        capacity: 4,
        stateId: state,
        // The list and the name: since when and the rest to pay; the plan: the rest to pay
        // (P5.28 item 24: the time is not on the plan).
        ...(since === undefined || total === null
          ? {}
          : { detail: `${since} · ${money(total)}`, planDetail: money(total) }),
        ...(table.note === undefined ? {} : { note: table.note }),
      }
    }),
  ]
}

/** The terrace on the bar's tablet: a table opens its order on the till. */
export function Terrace({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const tabs = useTabs(CAFE_VENUE)
  return (
    <Touch>
      <div className="box-border flex min-h-full flex-col bg-surface-page">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-0 border-b border-solid border-default bg-surface-raised px-4 py-3 sm:px-6">
          <BrandLockup brandName="Kod Mike" productName="Kasa" compact={phone} />
          <h1 className="m-0 text-h3 font-semibold text-primary bidi-content">Terrace</h1>
          <span className="ms-auto text-sm text-secondary bidi-isolate">
            {`${CAFE.waiter} · ${format.dateLong('2026-10-06')}`}
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <FloorPlan
            label={`${CAFE.name}, terrace`}
            items={terraceItems(CAFE_TABLES, tabs, (value) => format.money(value, CAFE.currency))}
            width={CAFE_SIZE.width}
            height={CAFE_SIZE.height}
            states={CAFE_STATES}
            selectionMode="none"
            onItemActivate={(item) => {
              const table = CAFE_TABLES.find((each) => each.id === item.id)
              if (table === undefined) return
              if (table.state === 'closed') {
                notice.info(`${item.label} is not in use: ${table.note ?? ''}`)
                return
              }
              navigate(terraceTableRoute(table.id))
            }}
            layout={phone ? 'phone' : 'desktop'}
          />
        </div>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </div>
    </Touch>
  )
}

/** A terrace table's open tab on the till (P5.28 item 22: screens-K-tabs.tsx). */
export function CafeTill({
  phone,
  tableId,
  start,
}: {
  phone: boolean
  tableId: string
  start?: TabStart
}) {
  return (
    <TabTill
      phone={phone}
      venue={CAFE_VENUE}
      tableId={tableId}
      {...(start === undefined ? {} : { start })}
    />
  )
}

// ── Konferencija Liro 2026 ─────────────────────────────────────────────────────────────────────

const LIRO_COMPANY: ShellCompany = { id: 'liro', name: 'Liro d.o.o.', description: 'Events' }

const ORGANISER: ExampleAccount = {
  name: GALA.organiser.name,
  email: GALA.organiser.email,
  companies: [LIRO_COMPANY],
  links: [{ label: 'Gala dinner seating', path: K_ROUTES.seating }],
}

/** "t4-9" from the route: table 4, seat 9. */
function seatFromRoute(value: string | undefined): SeatRef | undefined {
  if (value === undefined) return undefined
  const at = value.lastIndexOf('-')
  return { tableId: value.slice(0, at), seat: Number(value.slice(at + 1)) }
}

/** "Table 4, seat 9", or null for no seat. */
function seatText(seat: SeatRef | null, number: (value: string) => string): string | null {
  if (seat === null) return null
  const table = GALA_TABLES.find((each) => each.id === seat.tableId)
  return `${table?.label ?? seat.tableId}, seat ${number(String(seat.seat))}`
}

/**
 * The gala dinner's seating: the organiser seats the guests the conference registered. Every
 * seating stays pending until "Save seating…" confirms them together (P5.28 item 9): the changes
 * guest by guest, the guests' e-mail as a choice.
 */
export function GalaSeating({
  phone,
  seat,
  seatAt,
  table,
  pending: startPending = false,
}: {
  phone: boolean
  seat?: string
  seatAt?: string
  table?: string
  pending?: boolean
}) {
  const { format } = useLiro()
  const number = (value: string) => format.number(value)
  // The seating saved is the conference's record (kept above the screens); the changes are pending.
  const [saved, setSaved] = useExampleState<readonly SeatingGuest[]>(
    'gala.guests',
    () => GALA_GUESTS,
  )
  const [guests, setGuests] = useState<readonly SeatingGuest[]>(() =>
    startPending ? withPendingExample(saved) : saved,
  )
  const [confirm, setConfirm] = useState(startPending)
  const changes = seatingChanges(saved, guests)
  const chosenSeat = seatFromRoute(seat)
  const seatedCount = saved.filter((guest) => guest.seat != null).length
  const nameOf = (id: string) => guests.find((guest) => guest.id === id)?.name ?? id
  return (
    <Shell
      phone={phone}
      account={ORGANISER}
      company={LIRO_COMPANY.id}
      crumbs={[
        { label: 'Events', href: `#${K_ROUTES.seating}` },
        { label: 'Konferencija Liro 2026' },
      ]}
    >
      <Frame phone={phone} wide>
        <PageHeader
          title="Gala dinner seating"
          subtitle={`${GALA.title} · ${format.dateLong(GALA.date)} · ${GALA.hall}`}
          actions={
            <Button
              intent="export"
              label="Export place cards"
              onClick={() => {
                notice.success(
                  `Place cards exported for ${number(String(seatedCount))} seated guests.`,
                )
              }}
            />
          }
        />
        {changes.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-solid border-default bg-surface-raised px-4 py-3">
            <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
              {changes.length === 1
                ? '1 change not saved'
                : `${number(String(changes.length))} changes not saved`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                family="neutral"
                icon={RotateCcw}
                label="Discard changes"
                onClick={() => {
                  setGuests(saved)
                }}
              />
              <Button
                family="primary"
                emphasis="primary"
                icon={Save}
                label="Save seating…"
                onClick={() => {
                  setConfirm(true)
                }}
              />
            </div>
          </div>
        )}
        <SeatingChart
          label={`${GALA.hall}, gala dinner`}
          tables={GALA_TABLES}
          guests={guests}
          fixtures={GALA_FIXTURES}
          width={GALA_SIZE.width}
          height={GALA_SIZE.height}
          seatSize={GALA_SEAT.size}
          seatGap={GALA_SEAT.gap}
          conflicts={GALA_CONFLICTS}
          {...(chosenSeat === undefined ? {} : { defaultSeatDialog: chosenSeat })}
          {...(seatAt === undefined ? {} : { defaultSeatAt: seatAt })}
          {...(table === undefined ? {} : { defaultTableDialog: table })}
          layout={phone ? 'phone' : 'desktop'}
          onSeat={(guestId, to) => {
            // The application's rule: a seat holds one guest; whoever sat there is not seated now.
            setGuests((current) => seatGuest(current, guestId, to))
          }}
        />
      </Frame>
      <ChangeConfirmDialog
        open={confirm && changes.length > 0}
        onOpenChange={setConfirm}
        title="Save seating"
        subject={`Gala dinner, ${format.date(GALA.date)}`}
        changes={changes.map((change) => ({
          key: change.guestId,
          label: nameOf(change.guestId),
          from: seatText(change.from, number),
          to: seatText(change.to, number),
        }))}
        affected={changes.length === 1 ? '1 guest' : `${number(String(changes.length))} guests`}
        notify={[
          {
            id: 'guests',
            label:
              changes.length === 1
                ? `E-mail ${nameOf(changes[0]?.guestId ?? '')} the new seat`
                : `E-mail the ${number(String(changes.length))} guests their new seats`,
            description: 'The table and the seat, with the place card.',
          },
        ]}
        onConfirm={(answer) => {
          const count = changes.length
          setSaved(guests)
          notice.success(
            answer.notify.includes('guests')
              ? `Seating saved. ${count === 1 ? '1 guest gets' : `${number(String(count))} guests get`} an e-mail.`
              : 'Seating saved. No message was sent.',
          )
        }}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

/** A guest seated (or unseated) by the application's rule: one guest a seat. */
function seatGuest(
  guests: readonly SeatingGuest[],
  guestId: string,
  to: SeatRef | null,
): SeatingGuest[] {
  return guests.map((guest) => {
    if (guest.id === guestId) return { ...guest, seat: to }
    const taken = to !== null && guest.seat?.tableId === to.tableId && guest.seat.seat === to.seat
    return taken ? { ...guest, seat: null } : guest
  })
}

/** The pictured pending changes: two guests not seated yet seated at table 4, one moved apart. */
function withPendingExample(guests: readonly SeatingGuest[]): SeatingGuest[] {
  let next = seatGuest(guests, 'g113', { tableId: 't4', seat: 9 })
  next = seatGuest(next, 'g114', { tableId: 't4', seat: 10 })
  return seatGuest(next, 'g45', { tableId: 't13', seat: 9 })
}

export const GROUP_K_ROUTES: ExampleRoute[] = [
  { path: K_ROUTES.floor, render: (phone) => <Service phone={phone} /> },
  { path: K_ROUTES.floorTable, render: (phone) => <Service phone={phone} tableId="t7" /> },
  {
    path: K_ROUTES.floorOpen,
    render: (phone) => <Service phone={phone} tableId="t4" dialog="open" />,
  },
  {
    path: K_ROUTES.floorMove,
    render: (phone) => <Service phone={phone} tableId="t5" dialog="move" />,
  },
  {
    path: K_ROUTES.floorMoveNone,
    render: (phone) => <Service phone={phone} tableId="t8" dialog="move" />,
  },
  {
    path: K_ROUTES.floorTakeaway,
    render: (phone) => <Service phone={phone} channel="takeaway" />,
  },
  { path: K_ROUTES.floorTerrace, render: (phone) => <Service phone={phone} area="terasa" /> },
  { path: K_ROUTES.floorEdit, render: (phone) => <FloorEditor phone={phone} merged={false} /> },
  { path: K_ROUTES.floorMerged, render: (phone) => <FloorEditor phone={phone} merged /> },
  { path: K_ROUTES.terrace, render: (phone) => <Terrace phone={phone} /> },
  ...CAFE_TABLES.map((table) => ({
    path: terraceTableRoute(table.id),
    render: (phone: boolean) => <CafeTill phone={phone} tableId={table.id} />,
  })),
  // P5.28 item 22: table 3's tab in each state; Bistro Dunav's tabs.
  ...TAB_STARTS.map((start) => ({
    path: `${terraceTableRoute('t3')}?${start}`,
    render: (phone: boolean) => <CafeTill phone={phone} tableId="t3" start={start} />,
  })),
  ...BISTRO_VENUE.tables.map((table) => ({
    path: BISTRO_VENUE.tableRoute(table.id),
    render: (phone: boolean) => <TabTill phone={phone} venue={BISTRO_VENUE} tableId={table.id} />,
  })),
  {
    path: `${BISTRO_VENUE.tableRoute('t7')}?paid-share`,
    render: (phone: boolean) => (
      <TabTill phone={phone} venue={BISTRO_VENUE} tableId="t7" start="paid-share" />
    ),
  },
  { path: K_ROUTES.seating, render: (phone) => <GalaSeating phone={phone} /> },
  { path: K_ROUTES.seatingSeat, render: (phone) => <GalaSeating phone={phone} seat="t4-9" /> },
  {
    path: K_ROUTES.seatingSeatAt,
    render: (phone) => <GalaSeating phone={phone} seatAt="g113" />,
  },
  { path: K_ROUTES.seatingTable, render: (phone) => <GalaSeating phone={phone} table="t6" /> },
  { path: K_ROUTES.seatingPending, render: (phone) => <GalaSeating phone={phone} pending /> },
]

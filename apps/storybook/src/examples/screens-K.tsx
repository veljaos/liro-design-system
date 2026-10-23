import {
  ArrowRightLeft,
  Bike,
  CircleCheck,
  HandPlatter,
  Merge,
  ReceiptText,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  CandidateList,
  ChangeConfirmDialog,
  Dialog,
  EmptyState,
  FloorPlan,
  KeyValueList,
  MoneyText,
  notice,
  PageHeader,
  QuantityStepper,
  SectionCard,
  StatusBadge,
  Tabs,
  Toaster,
  useLiro,
  type KeyValueItem,
  type ModuleTab,
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
  BISTRO_SIZE,
  BISTRO_STATES,
  BISTRO_TABLES,
  bistroItems,
  guestsText,
  K_ROUTES,
  moveTargets,
  type BistroTable,
  type ChannelOrder,
} from './data-K'
import { BISTRO_VENUE, tabTotal } from './data-K-tabs'
import { TabTill, useTabs } from './screens-K-tabs'

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

// ── Kafić Kod Mike ─────────────────────────────────────────────────────────────────────────────

// ── Konferencija Liro 2026 ─────────────────────────────────────────────────────────────────────

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
  // P5.28 item 22: table 3's tab in each state; Bistro Dunav's tabs.
  ...BISTRO_VENUE.tables.map((table) => ({
    path: BISTRO_VENUE.tableRoute(table.id),
    render: (phone: boolean) => <TabTill phone={phone} venue={BISTRO_VENUE} tableId={table.id} />,
  })),
]

import { ArrowLeft, ArrowRightLeft, Merge, Save, Sparkles, UsersRound } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  BrandLockup,
  Button,
  CartPanel,
  Dialog,
  EmptyState,
  FloorPlan,
  KeyValueList,
  LiroProvider,
  notice,
  overlappingItems,
  PageHeader,
  PosShell,
  ProductGrid,
  QuantityStepper,
  SeatingChart,
  SectionCard,
  SelectField,
  StatusBadge,
  Toaster,
  applyFloorChanges,
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
import { Navigate, Shell, type ExampleAccount } from './example-shell'
import { Frame } from './screens-G'
import {
  BISTRO,
  BISTRO_AREAS,
  BISTRO_PALETTE,
  BISTRO_SIZE,
  BISTRO_STATES,
  BISTRO_TABLES,
  bistroItems,
  CAFE,
  CAFE_CATEGORIES,
  CAFE_PRODUCTS,
  CAFE_SIZE,
  CAFE_STATES,
  CAFE_TABLES,
  cafeCartLines,
  cafeCartTotals,
  computeOrder,
  GALA,
  GALA_CONFLICTS,
  GALA_FIXTURES,
  GALA_GUESTS,
  GALA_SEAT,
  GALA_SIZE,
  GALA_TABLES,
  guestsText,
  K_ROUTES,
  mergedBox,
  moveTargets,
  type BistroTable,
  type CafeTable,
  type OrderLine,
} from './data-K'
import { decimal } from '../../../../packages/ui/src/components/amounts-story-data'

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
}: {
  table: BistroTable | undefined
  onOpen: () => void
  onMove: () => void
  onSeat: () => void
  onClear: () => void
  onClean: () => void
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

/** Bistro Dunav's evening service: the floor, the chosen table, open and move. */
export function Service({
  phone,
  tableId,
  dialog,
}: {
  phone: boolean
  tableId?: string
  dialog?: 'open' | 'move'
}) {
  const { format } = useLiro()
  const number = (value: string) => format.number(value)
  const [tables, setTables] = useState<readonly BistroTable[]>(BISTRO_TABLES)
  const [chosen, setChosen] = useState<string | undefined>(tableId)
  const [open, setOpen] = useState(dialog === 'open')
  const [move, setMove] = useState(dialog === 'move')
  const [partySize, setPartySize] = useState<string | null>('2')
  const table = tables.find((each) => each.id === chosen)
  const targets = table === undefined ? [] : moveTargets(tables, table)
  const [target, setTarget] = useState(targets[0]?.id ?? '')
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
  const plan = (
    <FloorPlan
      label={`${BISTRO.name}, evening service`}
      items={items}
      width={BISTRO_SIZE.width}
      height={BISTRO_SIZE.height}
      areas={BISTRO_AREAS}
      states={BISTRO_STATES}
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
        setTarget(targets[0]?.id ?? '')
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
    />
  )
  const size = partySize === null ? null : Number.parseInt(partySize, 10)
  const sizeError =
    table !== undefined && (size === null || Number.isNaN(size) || size < 1 || size > table.seats)
      ? `From 1 to ${number(String(table.seats))} guests.`
      : undefined
  return (
    <BistroShell phone={phone} tab="floor">
      <Frame phone={phone} wide>
        <PageHeader
          title="Floor"
          titleHidden
          subtitle={`${format.dateLong('2026-10-06')} · ${BISTRO.now}`}
        />
        {phone ? (
          <div className="flex flex-col gap-4">
            {table !== undefined && panel}
            {plan}
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-6">
            {plan}
            {panel}
          </div>
        )}
        {table !== undefined && (
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title={`Open ${tableName(table)}`}
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
          <Dialog
            open={move}
            onOpenChange={setMove}
            title={`Move guests from ${tableName(table)}`}
            description={`${guestsText(table.party.size, number)}: free tables with seats enough.`}
            actions={
              <>
                <Button
                  intent="cancel"
                  label="Cancel"
                  onClick={() => {
                    setMove(false)
                  }}
                />
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={ArrowRightLeft}
                  label="Move"
                  disabled={target === ''}
                  onClick={() => {
                    const to = tables.find((each) => each.id === target)
                    const party = table.party
                    if (to === undefined || party === undefined) return
                    update(to.id, { state: table.state, party })
                    update(
                      table.id,
                      { state: table.state === 'occupied' ? 'cleaning' : 'free' },
                      'party',
                    )
                    setChosen(to.id)
                    setMove(false)
                    notice.success(`Guests moved from ${tableName(table)} to ${tableName(to)}.`)
                  }}
                />
              </>
            }
          >
            <SelectField
              label="To table"
              value={target}
              onChange={setTarget}
              options={targets.map((each) => ({
                value: each.id,
                label: `${tableName(each)} · ${BISTRO_AREAS.find((area) => area.id === each.areaId)?.label ?? ''} · ${number(String(each.seats))} seats`,
              }))}
            />
          </Dialog>
        )}
      </Frame>
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
  const initial = bistroItems(BISTRO_TABLES, number)
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
          toolbar={
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
                  notice.success('Floor plan saved. The service sees it at once.')
                }}
              />
            </>
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

/** The terrace as the plan draws it: each open table with since when and its total. */
function terraceItems(tables: readonly CafeTable[], money: (value: string) => string): FloorItem[] {
  return [
    { id: 'railing', kind: 'wall', label: 'Railing', x: 0, y: 500, width: 800, height: 20 },
    { id: 'door', kind: 'door', label: 'Door to the bar', x: 340, y: 0, width: 120, height: 20 },
    ...tables.map((table) => {
      const total = computeOrder(table.order).total
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
        stateId: table.state,
        ...(table.since === undefined
          ? {}
          : { detail: `${table.since} · ${money(decimal(total))}` }),
        ...(table.note === undefined ? {} : { note: table.note }),
      }
    }),
  ]
}

/** The terrace on the bar's tablet: a table opens its order on the till. */
export function Terrace({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
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
            items={terraceItems(CAFE_TABLES, (value) => format.money(value, CAFE.currency))}
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

/** A terrace table's order on the till: add products, then the bill. */
export function CafeTill({ phone, tableId }: { phone: boolean; tableId: string }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const table = CAFE_TABLES.find((each) => each.id === tableId)
  const [order, setOrder] = useState<readonly OrderLine[]>(table?.order ?? [])
  if (table === undefined) return null
  const name = `Table ${String(table.number)}`
  const computed = computeOrder(order)
  const total = order.length === 0 ? null : decimal(computed.total)
  const add = (id: string) => {
    setOrder((current) =>
      current.some((line) => line.productId === id)
        ? current.map((line) =>
            line.productId === id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...current, { productId: id, quantity: 1 }],
    )
  }
  return (
    <Touch>
      <div className={phone ? 'h-full' : 'h-dvh'}>
        <PosShell
          layout={phone ? 'phone' : 'tablet'}
          brand={<BrandLockup brandName="Kod Mike" productName="Kasa" compact={phone} />}
          register={CAFE.register}
          cashier={CAFE.waiter}
          actions={
            <Button
              family="neutral"
              icon={ArrowLeft}
              label="Terrace"
              onClick={() => {
                navigate(K_ROUTES.terrace)
              }}
            />
          }
          products={
            <ProductGrid
              products={CAFE_PRODUCTS}
              categories={CAFE_CATEGORIES}
              currency={CAFE.currency}
              onSelect={add}
            />
          }
          cart={
            <CartPanel
              className="flex-1"
              title={name}
              lines={cafeCartLines(order)}
              currency={CAFE.currency}
              total={total}
              totals={order.length === 0 ? [] : cafeCartTotals(order)}
              onQuantityChange={(id, quantity) => {
                if (quantity === null || !/^\d+$/.test(quantity)) return
                const count = Number.parseInt(quantity, 10)
                setOrder((current) =>
                  count === 0
                    ? current.filter((line) => line.productId !== id)
                    : current.map((line) =>
                        line.productId === id ? { ...line, quantity: count } : line,
                      ),
                )
              }}
              onRemove={(id) => {
                setOrder((current) => current.filter((line) => line.productId !== id))
              }}
              {...(total === null
                ? {}
                : { chargeLabel: `Bill ${format.money(total, CAFE.currency)}` })}
              onCharge={() => {
                if (total === null) return
                notice.success(
                  `${name}: the bill for ${format.money(total, CAFE.currency)} is printing.`,
                )
              }}
              emptyTitle={`${name} has no order yet`}
              emptyDescription="Add products from the menu."
            />
          }
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </div>
    </Touch>
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

/** The gala dinner's seating: the organiser seats the guests the conference registered. */
export function GalaSeating({
  phone,
  seat,
  seatAt,
  table,
}: {
  phone: boolean
  seat?: string
  seatAt?: string
  table?: string
}) {
  const { format } = useLiro()
  const [guests, setGuests] = useState<readonly SeatingGuest[]>(GALA_GUESTS)
  const chosenSeat = seatFromRoute(seat)
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
                notice.success('Place cards exported for 112 seated guests.')
              }}
            />
          }
        />
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
            setGuests((current) =>
              current.map((guest) => {
                if (guest.id === guestId) return { ...guest, seat: to }
                const taken =
                  to !== null && guest.seat?.tableId === to.tableId && guest.seat.seat === to.seat
                return taken ? { ...guest, seat: null } : guest
              }),
            )
          }}
        />
      </Frame>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
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
  { path: K_ROUTES.floorEdit, render: (phone) => <FloorEditor phone={phone} merged={false} /> },
  { path: K_ROUTES.floorMerged, render: (phone) => <FloorEditor phone={phone} merged /> },
  { path: K_ROUTES.terrace, render: (phone) => <Terrace phone={phone} /> },
  ...CAFE_TABLES.map((table) => ({
    path: terraceTableRoute(table.id),
    render: (phone: boolean) => <CafeTill phone={phone} tableId={table.id} />,
  })),
  { path: K_ROUTES.seating, render: (phone) => <GalaSeating phone={phone} /> },
  { path: K_ROUTES.seatingSeat, render: (phone) => <GalaSeating phone={phone} seat="t4-9" /> },
  {
    path: K_ROUTES.seatingSeatAt,
    render: (phone) => <GalaSeating phone={phone} seatAt="g113" />,
  },
  { path: K_ROUTES.seatingTable, render: (phone) => <GalaSeating phone={phone} table="t6" /> },
]

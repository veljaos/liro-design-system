import {
  ArrowLeft,
  ArrowRightLeft,
  ChefHat,
  Clock,
  PauseCircle,
  Percent,
  Receipt,
  Send,
  Split,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import {
  BrandLockup,
  Button,
  CartPanel,
  ComboboxField,
  Dialog,
  DropdownMenu,
  IconButton,
  LineQuantityPicker,
  notice,
  PaymentDialog,
  PosShell,
  ProductGrid,
  QuantityStepper,
  RadioGroupField,
  ReceiptResult,
  SelectField,
  SwitchField,
  TextField,
  Toaster,
  useLiro,
  type CardState,
  type CartLine,
  type ChoosableLine,
} from '@veljaos/ui'
import { decimal, paras } from '../../../../packages/ui/src/components/amounts-story-data'
import {
  PAYMENT_OPTIONS,
  instantPaymentCode,
  type InstantPayee,
} from '../../../../packages/ui/src/components/sale-story-data'
import { QrCode } from '../../../../packages/ui/src/components/qr-code'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import {
  computeTab,
  equalShares,
  inOrder,
  initialTabs,
  itemsAmount,
  markPaid,
  moveItems,
  sendLines,
  sentText,
  tabReceiptNumber,
  unsentByStation,
  type Tab,
  type TabLine,
  type Venue,
} from './data-K-tabs'
import { BISTRO_TABLES, type BistroTable } from './data-K'
import { TillTouch } from './screens-I-till'

/*
 * A table's open tab on the till (P5.28 item 22), for Bistro Dunav's service. The tabs live above
 * the screens (`useExampleState`, key `tabs.<venue>`): the waiter adds items, leaves for the floor
 * and comes back to the same tab.
 *
 * Sending (P5.90 item 20, as restaurant tills do it — "send on leaving the table"): a new item is
 * marked "New" and goes to the bar or the kitchen by itself when the waiter leaves the table
 * (Floor), each line then "Sent to the kitchen · 19:40"; "Send now" is kept for a rush; a line
 * held for a later course (the desserts) waits, marked "Held", until "Send held". A waiter who
 * forgets to press Send no longer leaves an order unsent; nothing is sent while items are still
 * being tapped. The sending itself is the application's — the screen reports what went where.
 * Every tap answers at once (the tile's count, the line's highlight, the order bar on phones);
 * removing a line offers Undo instead of a confirmation.
 *
 * On the tab: edit a
 * line (quantity, note, discount), a discount on the whole order, the venue's promotions (the
 * dessert of the day) applied by the application, split the bill (equally or by items) and pay a
 * part, move items or the whole tab to another table, and close it with the fiscal receipt (item
 * 21). The application computes every figure (data-K-tabs.ts).
 */

/** How long the example's card terminal takes. */
const TERMINAL_DELAY = 1200

/** The ways a tab is paid at the table (the application's choice of the seven). */
const TAB_PAYMENTS = PAYMENT_OPTIONS.filter((each) => ['cash', 'card', 'instant'].includes(each.id))

/** Where the venue's instant payments go (P5.40): an invented account with valid control numbers. */
const VENUE_PAYEES: Record<Venue['id'], InstantPayee> = {
  bistro: {
    name: 'Bistro Dunav, Novi Sad',
    account: '170-0000000987654-14',
    merchantCategory: '5812',
  },
}

/** "Table 3". */
function tableName(venue: Venue, tableId: string): string {
  const table = venue.tables.find((each) => each.id === tableId)
  return table === undefined ? tableId : `Table ${String(table.number)}`
}

export function TabTill({
  phone,
  venue,
  tableId,
}: {
  phone: boolean
  venue: Venue
  tableId: string
}) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const money = (value: bigint) => format.money(decimal(value), venue.currency)
  const [tabs, setTabs] = useExampleState<Record<string, Tab>>(`tabs.${venue.id}`, () =>
    initialTabs(),
  )
  // The floor's tables: closing the tab frees the table at once (P5.90 item 20).
  const [, setTables] = useExampleState<readonly BistroTable[]>(
    'bistro.tables',
    () => BISTRO_TABLES,
  )
  const name = tableName(venue, tableId)
  const productName = (id: string) => venue.products.find((each) => each.id === id)?.name ?? ''
  const tab: Tab = tabs[tableId] ?? { tableId, openedAt: venue.now, lines: [], payments: [] }
  const figures = computeTab(venue, tab)
  const setTab = (change: (current: Tab) => Tab) => {
    setTabs((current) => {
      const now = current[tableId] ?? { tableId, openedAt: venue.now, lines: [], payments: [] }
      return { ...current, [tableId]: change(now) }
    })
  }

  // ── Dialogs ──
  const [editId, setEditId] = useState<string | null>(null)
  const editing = tab.lines.find((line) => line.id === editId)
  const [draft, setDraft] = useState<{
    quantity: string | null
    note: string
    discountId: string
    held: boolean
  }>({
    quantity: editing === undefined ? null : String(editing.quantity),
    note: editing?.note ?? '',
    discountId: editing?.discountId ?? '',
    held: editing?.held === true,
  })
  const [discountOpen, setDiscountOpen] = useState(false)
  const [orderDiscount, setOrderDiscount] = useState(tab.orderDiscountId ?? '')
  const [splitOpen, setSplitOpen] = useState(false)
  const [splitMode, setSplitMode] = useState<'equal' | 'items'>('equal')
  const [people, setPeople] = useState<string | null>('4')
  const [chosenItems, setChosenItems] = useState<Readonly<Record<string, string | null>>>({})
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveWhat, setMoveWhat] = useState<'all' | 'items'>('all')
  const [moveTo, setMoveTo] = useState(
    venue.tables.find((each) => each.id !== tableId && tabs[each.id] === undefined)?.id ?? '',
  )
  const [moveItemsChosen, setMoveItemsChosen] = useState<Readonly<Record<string, string | null>>>(
    {},
  )

  // ── The payment ──
  /** What is being paid: the rest of the tab, a share, or items. */
  const [paying, setPaying] = useState<{
    amount: bigint
    what: string
    /** It pays what remains: the table closes after it. */
    closes: boolean
    items?: Readonly<Record<string, string | null>>
  } | null>(null)
  const [method, setMethod] = useState('cash')
  const [tendered, setTendered] = useState<string | null>(null)
  const [cardState, setCardState] = useState<CardState>('idle')
  const [done, setDone] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)

  useEffect(() => {
    if (paying === null || cardState !== 'waiting') return
    const timer = window.setTimeout(() => {
      setCardState('approved')
    }, TERMINAL_DELAY)
    return () => {
      window.clearTimeout(timer)
    }
  }, [paying, cardState])

  const unsentCount = unsentByStation(venue, tab).reduce((sum, each) => sum + each.count, 0)
  const heldCount = unsentByStation(venue, tab, 'held').reduce((sum, each) => sum + each.count, 0)
  const counts = inOrder(tab)
  /** Sends the new lines (or the held ones) and says what went where. */
  const send = (which: 'new' | 'held') => {
    const result = sendLines(venue, tab, venue.now, which)
    if (result.sent.length === 0) return
    setTab(() => result.tab)
    notice.success(`Sent: ${sentText(result.sent)}.`)
  }
  const add = (productId: string) => {
    const product = venue.products.find((each) => each.id === productId)
    if (product === undefined || product.unavailableReason !== undefined) return
    setTab((current) => {
      // A new item joins an unsent line of the same product; a sent line stays as it was sent.
      const open = current.lines.find(
        (line) =>
          line.productId === productId &&
          line.sentAt === undefined &&
          line.held !== true &&
          line.note === undefined &&
          line.discountId === undefined,
      )
      return {
        ...current,
        lines:
          open === undefined
            ? [
                ...current.lines,
                {
                  id: `${tableId}-${String(Date.now())}`,
                  productId,
                  quantity: 1,
                },
              ]
            : current.lines.map((line) =>
                line.id === open.id ? { ...line, quantity: line.quantity + 1 } : line,
              ),
      }
    })
  }

  const cartLines: CartLine[] = figures.lines.map(
    ({ line, product, promotion, discount, total }) => {
      const station = venue.stations[product.categoryId ?? '']
      const paid = line.paid ?? 0
      return {
        id: line.id,
        name: product.name,
        quantity: String(line.quantity),
        unit: 'pc',
        unitPrice: product.price,
        total: decimal(total),
        min: '1',
        ...(promotion === undefined && discount === undefined
          ? {}
          : {
              discount: [promotion, discount]
                .filter((each) => each !== undefined)
                .map((each) => `${each.label}: ${money(-each.amount)}`)
                .join(' · '),
            }),
        ...(line.note === undefined ? {} : { note: line.note }),
        state:
          paid >= line.quantity
            ? { label: 'Paid', tone: 'success' as const }
            : line.held === true
              ? { label: 'Held for later', icon: PauseCircle }
              : line.sentAt === undefined
                ? { label: 'New · sent when you leave the table', icon: Clock }
                : {
                    label: `Sent to ${station?.label ?? 'the bar'} · ${line.sentAt}${paid > 0 ? ` · ${String(paid)} paid` : ''}`,
                    icon: ChefHat,
                  },
      }
    },
  )

  const remainingText = decimal(figures.remaining)
  /** Leaving the table sends the new items by themselves (P5.90 item 20). */
  const leave = () => {
    send('new')
    navigate(venue.back.route)
  }

  const cart = (
    <CartPanel
      className="flex-1"
      title={name}
      kindLabel={`Tab since ${tab.openedAt} · ${venue.waiter}`}
      lines={cartLines}
      currency={venue.currency}
      total={tab.lines.length === 0 ? null : remainingText}
      {...(figures.paid > 0n ? { totalLabel: 'To pay' } : {})}
      totals={
        tab.lines.length === 0
          ? []
          : [
              { id: 'subtotal', label: 'Subtotal', value: decimal(figures.subtotal) },
              ...figures.promotions.map(([label, amount]) => ({
                id: `promo-${label}`,
                label,
                value: decimal(-amount),
              })),
              ...(figures.lineDiscounts > 0n
                ? [{ id: 'lines', label: 'Line discounts', value: decimal(-figures.lineDiscounts) }]
                : []),
              ...(figures.orderDiscount === null
                ? []
                : [
                    {
                      id: 'order',
                      label: figures.orderDiscount.label,
                      value: decimal(-figures.orderDiscount.amount),
                    },
                  ]),
              ...(figures.paid > 0n
                ? [
                    { id: 'total', label: 'Total', value: decimal(figures.total) },
                    { id: 'paid', label: 'Paid', value: decimal(-figures.paid) },
                  ]
                : []),
              { id: 'vat', label: 'VAT 20% included', value: decimal(figures.vat) },
            ]
      }
      onQuantityChange={(id, quantity) => {
        if (quantity === null || !/^[1-9]\d*$/.test(quantity)) return
        setTab((current) => ({
          ...current,
          lines: current.lines.map((line) =>
            line.id === id ? { ...line, quantity: Number.parseInt(quantity, 10) } : line,
          ),
        }))
      }}
      onEditLine={(id) => {
        const line = tab.lines.find((each) => each.id === id)
        if (line === undefined) return
        setDraft({
          quantity: String(line.quantity),
          note: line.note ?? '',
          discountId: line.discountId ?? '',
          held: line.held === true,
        })
        setEditId(id)
      }}
      chargeLabel={`Bill ${money(figures.remaining)}`}
      onCharge={() => {
        setTendered(null)
        setCardState('idle')
        setMethod('cash')
        setDone(false)
        setPaying({ amount: figures.remaining, what: 'The rest of the tab', closes: true })
      }}
      headerActions={
        <>
          <Button
            family="neutral"
            icon={ArrowRightLeft}
            label="Move…"
            onClick={() => {
              setMoveOpen(true)
            }}
          />
          <DropdownMenu
            align="end"
            trigger={<IconButton intent="more" label={`${name} menu`} />}
            entries={[
              {
                label: 'Discount on the order…',
                icon: Percent,
                onSelect: () => {
                  setOrderDiscount(tab.orderDiscountId ?? '')
                  setDiscountOpen(true)
                },
              },
              {
                label: 'Split the bill…',
                icon: Split,
                onSelect: () => {
                  setSplitMode('equal')
                  setSplitOpen(true)
                },
              },
              {
                label: 'Pay part…',
                icon: Wallet,
                onSelect: () => {
                  setSplitMode('items')
                  setChosenItems({})
                  setSplitOpen(true)
                },
              },
            ]}
          />
        </>
      }
      actions={
        unsentCount > 0 || heldCount > 0 ? (
          <>
            {unsentCount > 0 && (
              <Button
                family="neutral"
                icon={ChefHat}
                label={`Send now (${String(unsentCount)})`}
                onClick={() => {
                  send('new')
                }}
              />
            )}
            {heldCount > 0 && (
              <Button
                family="neutral"
                icon={Send}
                label={`Send held (${String(heldCount)})`}
                onClick={() => {
                  send('held')
                }}
              />
            )}
          </>
        ) : undefined
      }
      emptyTitle={`${name} has no order yet`}
      emptyDescription="Add products from the menu."
    />
  )

  /** The lines that can still be paid or moved. */
  const choosable = (purpose: 'pay' | 'move'): ChoosableLine[] =>
    figures.lines.map(({ line, product, total }) => {
      const left = line.quantity - (purpose === 'pay' ? (line.paid ?? 0) : 0)
      return {
        id: line.id,
        name: product.name,
        available: String(left),
        unit: 'pc',
        unitPrice: decimal(total / BigInt(line.quantity)),
        ...(line.note === undefined ? {} : { note: line.note }),
        ...(left === 0 ? { unavailableReason: 'Paid' } : {}),
      }
    })

  const peopleCount = people === null ? 0 : Number.parseInt(people, 10) || 0
  const shares = equalShares(figures.remaining, peopleCount)
  const itemsTotal = itemsAmount(venue, tab, chosenItems)
  const paymentTotal = paying?.amount ?? 0n
  const cash = method === 'cash'
  const given = tendered === null ? null : paras(tendered)
  const change = cash && given !== null && given >= paymentTotal ? given - paymentTotal : null
  const short = cash && given !== null && given < paymentTotal ? paymentTotal - given : null
  const completeDisabledReason = cash
    ? tendered === null
      ? 'Enter the amount tendered.'
      : short !== null
        ? 'The amount tendered is less than the amount due.'
        : undefined
    : cardState === 'approved'
      ? undefined
      : 'Waiting for the payment.'
  const closing = paying?.closes === true
  const moveOptions = venue.tables
    .filter((each) => each.id !== tableId)
    .map((each) => ({
      value: each.id,
      label: `Table ${String(each.number)} · ${each.area} · ${
        tabs[each.id] === undefined ? 'free' : 'open tab, joined'
      }`,
    }))

  return (
    <TillTouch>
      <div className={phone ? 'h-full' : 'h-dvh'}>
        <PosShell
          layout={phone ? 'phone' : 'tablet'}
          brand={<BrandLockup brandName={venue.brand} productName="Kasa" compact={phone} />}
          register={venue.register}
          cashier={venue.waiter}
          actions={
            <Button family="neutral" icon={ArrowLeft} label={venue.back.label} onClick={leave} />
          }
          products={
            <ProductGrid
              products={venue.products.map((product) => {
                const count = counts[product.id]
                return count === undefined ? product : { ...product, inOrder: String(count) }
              })}
              categories={venue.categories}
              defaultCategory={venue.categories[0]?.id ?? null}
              currency={venue.currency}
              search
              onSelect={add}
            />
          }
          cart={cart}
          orderSummary={{
            count: tab.lines.length,
            total: tab.lines.length === 0 ? null : remainingText,
            currency: venue.currency,
          }}
        />

        {/* Edit a line */}
        {editing !== undefined && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) setEditId(null)
            }}
            title="Edit line"
            actions={
              <>
                <Button
                  family="destructive"
                  icon={Trash2}
                  label="Remove line"
                  onClick={() => {
                    const removed = editing
                    const at = tab.lines.findIndex((line) => line.id === removed.id)
                    setTab((current) => ({
                      ...current,
                      lines: current.lines.filter((line) => line.id !== removed.id),
                    }))
                    setEditId(null)
                    // Undo instead of a confirmation (P5.90 item 20).
                    notice.success(`${productName(removed.productId)} removed.`, {
                      action: {
                        label: 'Undo',
                        onClick: () => {
                          setTab((current) => ({
                            ...current,
                            lines: [
                              ...current.lines.slice(0, at),
                              removed,
                              ...current.lines.slice(at),
                            ],
                          }))
                        },
                      },
                    })
                  }}
                />
                <Button
                  intent="cancel"
                  label="Cancel"
                  onClick={() => {
                    setEditId(null)
                  }}
                />
                <Button
                  intent="save"
                  label="Save line"
                  onClick={() => {
                    const quantity =
                      draft.quantity === null
                        ? editing.quantity
                        : Number.parseInt(draft.quantity, 10)
                    if (!Number.isInteger(quantity) || quantity < 1) return
                    setTab((current) => ({
                      ...current,
                      lines: current.lines.map((line): TabLine => {
                        if (line.id !== editing.id) return line
                        const next: TabLine = { ...line, quantity }
                        if (draft.note.trim() === '') delete next.note
                        else next.note = draft.note.trim()
                        if (draft.discountId === '') delete next.discountId
                        else next.discountId = draft.discountId
                        if (draft.held && line.sentAt === undefined) next.held = true
                        else delete next.held
                        return next
                      }),
                    }))
                    setEditId(null)
                  }}
                />
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <p className="m-0 text-md font-semibold text-primary bidi-content">
                {productName(editing.productId)}
              </p>
              <QuantityStepper
                label="Quantity"
                value={draft.quantity}
                min="1"
                onChange={(quantity) => {
                  setDraft((current) => ({ ...current, quantity }))
                }}
                unit="pc"
              />
              <TextField
                label="Note for the kitchen or the bar"
                value={draft.note}
                onChange={(note) => {
                  setDraft((current) => ({ ...current, note }))
                }}
              />
              <SelectField
                label="Discount"
                options={[
                  { value: '', label: 'No discount' },
                  ...venue.discounts.map((each) => ({ value: each.id, label: each.label })),
                ]}
                value={draft.discountId}
                onChange={(discountId) => {
                  setDraft((current) => ({ ...current, discountId }))
                }}
              />
              {editing.sentAt === undefined && (
                <SwitchField
                  label="Hold for a later course"
                  description="Not sent when you leave the table; send it with “Send held”."
                  checked={draft.held}
                  onChange={(held) => {
                    setDraft((current) => ({ ...current, held }))
                  }}
                />
              )}
              {editing.sentAt !== undefined && (
                <p className="m-0 text-xs text-secondary bidi-content">
                  {`Sent at ${editing.sentAt}; a change of quantity or note is sent again with the next order.`}
                </p>
              )}
            </div>
          </Dialog>
        )}

        {/* Discount on the order */}
        <Dialog
          open={discountOpen}
          onOpenChange={setDiscountOpen}
          title="Discount on the order"
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setDiscountOpen(false)
                }}
              />
              <Button
                intent="confirm"
                label="Apply discount"
                onClick={() => {
                  setTab((current) => {
                    const next: Tab = { ...current }
                    if (orderDiscount === '') delete next.orderDiscountId
                    else next.orderDiscountId = orderDiscount
                    return next
                  })
                  setDiscountOpen(false)
                }}
              />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="m-0 font-semibold text-primary bidi-content">
              {`${name} · ${money(figures.total)}`}
            </p>
            <RadioGroupField
              label="Discount"
              options={[
                { value: '', label: 'No discount' },
                ...venue.discounts.map((each) => ({ value: each.id, label: each.label })),
              ]}
              value={orderDiscount}
              onChange={setOrderDiscount}
            />
            <p className="m-0 text-xs text-secondary bidi-content">
              {`Promotions apply by themselves: ${venue.promotions.map((each) => each.label).join('; ')}.`}
            </p>
          </div>
        </Dialog>

        {/* Split the bill or pay part */}
        <Dialog
          open={splitOpen}
          onOpenChange={setSplitOpen}
          size="wide"
          title={splitMode === 'equal' ? 'Split the bill' : 'Pay part'}
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setSplitOpen(false)
                }}
              />
              {splitMode === 'equal' ? (
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={Wallet}
                  label={`Pay one share ${money(shares[0] ?? 0n)}`}
                  onClick={() => {
                    const share = shares[0]
                    if (share === undefined) return
                    setSplitOpen(false)
                    setTendered(null)
                    setCardState('idle')
                    setDone(false)
                    setPaying({
                      amount: shares.length === 1 ? figures.remaining : share,
                      what: `Share 1 of ${String(shares.length)}`,
                      closes: shares.length === 1,
                    })
                  }}
                />
              ) : (
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={Wallet}
                  label={`Pay ${money(itemsTotal)}`}
                  onClick={() => {
                    if (itemsTotal === 0n) return
                    setSplitOpen(false)
                    setTendered(null)
                    setCardState('idle')
                    setDone(false)
                    setPaying({
                      amount: itemsTotal,
                      what: 'Items',
                      closes: itemsTotal === figures.remaining,
                      items: chosenItems,
                    })
                  }}
                />
              )}
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="m-0 font-semibold text-primary bidi-content">
              {`${name} · to pay ${money(figures.remaining)}`}
            </p>
            <RadioGroupField
              label="How"
              options={[
                { value: 'equal', label: 'Equally', description: 'Everyone pays the same share.' },
                {
                  value: 'items',
                  label: 'By items',
                  description: 'Each guest pays what they had.',
                },
              ]}
              value={splitMode}
              onChange={(value) => {
                setSplitMode(value === 'items' ? 'items' : 'equal')
              }}
            />
            {splitMode === 'equal' ? (
              <div className="flex flex-col gap-3">
                <QuantityStepper
                  label="People"
                  className="w-48"
                  value={people}
                  min="2"
                  max="12"
                  onChange={setPeople}
                />
                {shares.length > 0 && (
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {shares.map((share, index) => (
                      <li
                        key={String(index)}
                        className="flex items-baseline justify-between gap-4 border-0 border-b border-solid border-subtle py-1 text-sm"
                      >
                        <span className="text-secondary bidi-content">
                          {`Share ${String(index + 1)} of ${String(shares.length)}`}
                        </span>
                        <bdi className="font-semibold tabular-nums">{money(share)}</bdi>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <LineQuantityPicker
                label="Items to pay now"
                lines={choosable('pay')}
                value={chosenItems}
                onChange={setChosenItems}
                currency={venue.currency}
                chosenTotal={decimal(itemsTotal)}
                chosenTotalLabel="To pay now"
              />
            )}
          </div>
        </Dialog>

        {/* Move items or the whole tab */}
        <Dialog
          open={moveOpen}
          onOpenChange={setMoveOpen}
          size={moveWhat === 'items' ? 'wide' : 'default'}
          title="Move to another table"
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setMoveOpen(false)
                }}
              />
              <Button
                family="primary"
                emphasis="primary"
                icon={ArrowRightLeft}
                label={moveWhat === 'all' ? 'Move tab' : 'Move items'}
                onClick={() => {
                  if (moveTo === '') return
                  const to = tableName(venue, moveTo)
                  setTabs((current) =>
                    moveItems(
                      current,
                      tableId,
                      moveTo,
                      moveWhat === 'all' ? 'all' : moveItemsChosen,
                      venue.now,
                    ),
                  )
                  setMoveOpen(false)
                  notice.success(
                    moveWhat === 'all' ? `${name}’s tab moved to ${to}.` : `Items moved to ${to}.`,
                  )
                  if (moveWhat === 'all') navigate(venue.tableRoute(moveTo))
                }}
              />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="m-0 font-semibold text-primary bidi-content">
              {`${name} · ${money(figures.remaining)}`}
            </p>
            <RadioGroupField
              label="What"
              options={[
                { value: 'all', label: 'The whole tab' },
                { value: 'items', label: 'Some items' },
              ]}
              value={moveWhat}
              onChange={(value) => {
                setMoveWhat(value === 'items' ? 'items' : 'all')
              }}
            />
            {moveOptions.length > 10 ? (
              // More than ten tables: a searchable combobox (P5.28 item 3).
              <ComboboxField
                label="To table"
                options={moveOptions}
                value={moveOptions.find((each) => each.value === moveTo) ?? null}
                onChange={(option) => {
                  setMoveTo(option?.value ?? '')
                }}
              />
            ) : (
              <SelectField
                label="To table"
                options={moveOptions}
                value={moveTo}
                onChange={setMoveTo}
              />
            )}
            {moveWhat === 'items' && (
              <LineQuantityPicker
                label="Items to move"
                lines={choosable('move')}
                value={moveItemsChosen}
                onChange={setMoveItemsChosen}
              />
            )}
          </div>
        </Dialog>

        {/* Pay: the rest, a share or items; the fiscal receipt (item 21) */}
        {paying !== null && (
          <PaymentDialog
            open
            onOpenChange={(open) => {
              if (!open) setPaying(null)
            }}
            title={`${name}: ${paying.what}`}
            total={decimal(paying.amount)}
            currency={venue.currency}
            methods={TAB_PAYMENTS}
            method={method}
            onMethodChange={(next) => {
              setMethod(next)
              setCardState('idle')
            }}
            tendered={tendered}
            onTenderedChange={setTendered}
            quickAmounts={['1000', '2000', '5000']}
            change={change === null ? null : decimal(change)}
            remaining={short === null ? null : decimal(short)}
            cardState={cardState}
            onCardStart={() => {
              setCardState('waiting')
            }}
            onCardCancel={() => {
              setCardState('idle')
            }}
            qrCode={
              <span className="flex text-primary">
                <QrCode
                  value={instantPaymentCode(
                    VENUE_PAYEES[venue.id],
                    decimal(paying.amount),
                    `20261014${String(tab.payments.length + 1).padStart(3, '0')}`,
                  )}
                  label="IPS QR code for the payment"
                  size={176}
                />
              </span>
            }
            {...(completeDisabledReason === undefined ? {} : { completeDisabledReason })}
            onComplete={() => {
              if (completeDisabledReason !== undefined) return
              const number = tabReceiptNumber(tab.payments.length + 1)
              setTab((current) => {
                const paidTab =
                  paying.items === undefined ? current : markPaid(current, paying.items)
                return {
                  ...paidTab,
                  payments: [
                    ...paidTab.payments,
                    {
                      id: `pay-${String(paidTab.payments.length + 1)}`,
                      label: TAB_PAYMENTS.find((each) => each.id === method)?.label ?? method,
                      amount: decimal(paying.amount),
                      what: paying.what,
                      receipt: number,
                    },
                  ],
                }
              })
              setReceipt(number)
              setDone(true)
            }}
            done={done}
            {...(receipt === null ? {} : { doneText: `Receipt ${receipt}` })}
            {...(receipt === null
              ? {}
              : {
                  doneContent: (
                    <ReceiptResult
                      facts={[
                        { id: 'number', label: 'Processor receipt number', value: receipt },
                        {
                          id: 'time',
                          label: 'Processor time',
                          value: `06.10.2026. ${venue.now}:12`,
                        },
                      ]}
                      code={
                        <span className="flex text-primary">
                          <QrCode value={receipt} label="Receipt code" size={112} />
                        </span>
                      }
                      deliveries={[{ id: 'print', label: 'Print', icon: Receipt }]}
                      onDeliver={() => {
                        notice.success('Receipt printed.')
                      }}
                    />
                  ),
                })}
            doneActions={
              closing ? (
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={Receipt}
                  label="Close table"
                  onClick={() => {
                    setTabs((current) => {
                      const rest: Record<string, Tab> = {}
                      for (const [id, each] of Object.entries(current)) {
                        if (id !== tableId) rest[id] = each
                      }
                      return rest
                    })
                    setTables((current) =>
                      current.map((each) => {
                        if (each.id !== tableId) return each
                        const free: BistroTable = { ...each, state: 'free' }
                        delete free.party
                        return free
                      }),
                    )
                    setPaying(null)
                    notice.success(`${name} closed and free.`)
                    navigate(venue.back.route)
                  }}
                />
              ) : (
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={ArrowLeft}
                  label="Back to the tab"
                  onClick={() => {
                    setPaying(null)
                    setDone(false)
                  }}
                />
              )
            }
          />
        )}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </div>
    </TillTouch>
  )
}

/** A tab's total for the floor (the rest to pay), from the kept tabs. */
export function useTabs(venue: Venue): Record<string, Tab> {
  const [tabs] = useExampleState<Record<string, Tab>>(`tabs.${venue.id}`, () => initialTabs())
  return tabs
}

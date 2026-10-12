import { Lock, PauseCircle, RefreshCw } from 'lucide-react'
import { useContext, useEffect, useState, type ReactNode } from 'react'
import {
  BrandLockup,
  Button,
  CartPanel,
  Dialog,
  DropdownMenu,
  IconButton,
  LiroProvider,
  notice,
  PaymentDialog,
  PickList,
  PosShell,
  ProductGrid,
  ReceiptPreview,
  ScanField,
  StockCount,
  Toaster,
  useLiro,
  type CardState,
  type PaymentMethod,
  type PickLine,
  type PickStep,
  type ScanFeedback,
} from '@veljaos/ui'
import { decimal } from '../../../../packages/ui/src/components/amounts-story-data'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES } from './example-shell'
import {
  BAKERY,
  CARD_APPROVAL,
  cartLines,
  cartTotals,
  cashOutcome,
  CATEGORIES,
  computeSale,
  COUNT,
  COUNT_RECORDS,
  countItems,
  CURRENT_COUNT,
  CURRENT_PICK,
  I_ROUTES,
  PICK_LINES,
  PICKING,
  productByCode,
  PRODUCTS,
  QUICK_AMOUNTS,
  quantityUnits,
  RECEIPT_FOOTER,
  receiptItems,
  receiptTotals,
  SALE,
  SKIP_REASONS,
  type CountRecord,
  type SaleLine,
} from './data-I'

/*
 * Group I's example screens (P5.17): the till of a bakery and a warehouse handheld — devices of
 * their own, not pages of the back office, so they stand without AppShell and are not reached
 * from the home page. Each screen plays the application around the components: it checks every
 * scan, keeps the sale or the pick list, and computes every figure in data-I.ts; the components
 * only show them and report what the cashier or the worker does. Both run in the touch density
 * (a LiroProvider with `density="touch"` inside the examples' provider, as an application wraps
 * its till).
 */

export { I_ROUTES }

/** The application's answer to a scan: a new id each time, so the same words are news again. */
function answer(previous: ScanFeedback | null, tone: ScanFeedback['tone'], text: string) {
  return { id: typeof previous?.id === 'number' ? previous.id + 1 : 1, tone, text }
}

// ── Touch ─────────────────────────────────────────────────────────────────────────────────────

/** The examples' provider again, with `density="touch"`: every target at least 44px. */
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

// ── The till: Pekara Zlatni klas ──────────────────────────────────────────────────────────────

/** Where the sale stands when the screen opens (one route per state, P5.23). */
export type TillStep = 'cart' | 'cash' | 'card-waiting' | 'card-approved' | 'receipt'

/** How long the example's card terminal takes to approve (a real one answers the application). */
const TERMINAL_DELAY = 1200

function Till({
  phone,
  step = 'cart',
  offline = false,
  productsOpen = false,
}: {
  phone: boolean
  step?: TillStep
  offline?: boolean
  productsOpen?: boolean
}) {
  const { format } = useLiro()
  const [sale, setSale] = useState<readonly SaleLine[]>(SALE)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const [paying, setPaying] = useState(step !== 'cart' && step !== 'receipt')
  const [method, setMethod] = useState<PaymentMethod>(step.startsWith('card') ? 'card' : 'cash')
  const [tendered, setTendered] = useState<string | null>(
    step === 'cash' || step === 'receipt' ? (QUICK_AMOUNTS[0] ?? null) : null,
  )
  const [cardState, setCardState] = useState<CardState>(
    step === 'card-waiting' ? 'waiting' : step === 'card-approved' ? 'approved' : 'idle',
  )
  const [done, setDone] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(step === 'receipt')
  // The paid sale stays on the receipt after the cart is emptied for the next one.
  const [paid, setPaid] = useState<{ lines: readonly SaleLine[]; tendered: string | null } | null>(
    step === 'receipt' ? { lines: SALE, tendered: QUICK_AMOUNTS[0] ?? null } : null,
  )

  // The example's terminal: it approves a while after the cashier sent the amount (a restored
  // "waiting" picture stays waiting).
  const [sent, setSent] = useState(false)
  useEffect(() => {
    if (!paying || cardState !== 'waiting' || !sent) return
    const timer = window.setTimeout(() => {
      setCardState('approved')
    }, TERMINAL_DELAY)
    return () => {
      window.clearTimeout(timer)
    }
  }, [paying, cardState, sent])

  const computed = computeSale(sale)
  const totalText = computed.lines.length === 0 ? null : decimal(computed.total)
  const cash = cashOutcome(computed.total, method === 'cash' ? tendered : null)

  const scan = (code: string) => {
    const item = productByCode(code)
    if (item === undefined) {
      setFeedback((previous) => answer(previous, 'error', `Unknown code ${code}`))
      return
    }
    add(item.id)
  }
  const add = (id: string) => {
    const item = PRODUCTS.find((each) => each.id === id)
    if (item === undefined) return
    const reason = item.unavailableReason
    if (reason !== undefined) {
      setFeedback((previous) => answer(previous, 'error', `${item.name}: ${reason}`))
      return
    }
    setFeedback((previous) => answer(previous, 'success', `${item.name} added`))
    setSale((current) => {
      const line = current.find((each) => each.productId === id)
      return line === undefined
        ? [...current, { productId: id, quantity: '1' }]
        : current.map((each) =>
            each.productId === id
              ? { ...each, quantity: (BigInt(each.quantity) + 1n).toString() }
              : each,
          )
    })
  }

  const completeDisabledReason =
    method === 'card'
      ? cardState === 'approved'
        ? undefined
        : 'Waiting for the card payment.'
      : tendered === null
        ? 'Enter the amount tendered.'
        : cash.remaining !== null
          ? 'The amount tendered is less than the amount due.'
          : undefined

  const newSale = () => {
    setSale([])
    setPaying(false)
    setDone(false)
    setReceiptOpen(false)
    setTendered(null)
    setCardState('idle')
    setMethod('cash')
    setFeedback(null)
  }

  const receiptSale = computeSale(paid?.lines ?? sale)
  const paidCash = paid?.tendered ?? null
  const receiptCash = cashOutcome(receiptSale.total, paidCash)
  const signed = (amount: string) => format.number(amount, { decimals: 2 })

  const products = (
    <ProductGrid
      products={PRODUCTS}
      categories={CATEGORIES}
      currency={BAKERY.currency}
      onSelect={add}
      toolbar={
        <ScanField
          label="Barcode or PLU"
          hideLabel
          placeholder="Scan or type a barcode"
          onScan={scan}
          feedback={feedback}
        />
      }
    />
  )

  const cart = (
    <CartPanel
      className="flex-1"
      lines={cartLines(
        computed,
        (reason, rate, amount) =>
          `${reason} ${rate.toString()}%: ${format.money(amount, BAKERY.currency)}`,
      )}
      currency={BAKERY.currency}
      total={totalText}
      totals={computed.lines.length === 0 ? [] : cartTotals(computed)}
      onQuantityChange={(id, quantity) => {
        if (quantity === null || !/^[1-9]\d*$/.test(quantity)) return
        setSale((current) =>
          current.map((each) => (each.productId === id ? { ...each, quantity } : each)),
        )
      }}
      onRemove={(id) => {
        setSale((current) => current.filter((each) => each.productId !== id))
      }}
      onCharge={() => {
        setPaying(true)
      }}
      actions={
        <Button
          family="neutral"
          icon={PauseCircle}
          label="Park sale"
          onClick={() => {
            notice.success('Sale parked. It waits under Parked sales.')
            newSale()
          }}
        />
      }
    />
  )

  return (
    <Touch>
      <div className={phone ? 'h-full' : 'h-dvh'}>
        <PosShell
          layout={phone ? 'phone' : 'tablet'}
          brand={<BrandLockup brandName="Zlatni klas" productName="Kasa" compact={phone} />}
          register={BAKERY.register}
          cashier={BAKERY.cashier}
          offline={offline}
          queued={offline ? BAKERY.queued : 0}
          offlineAction={
            <Button
              family="neutral"
              icon={RefreshCw}
              label="Try now"
              onClick={() => {
                notice.info('Still offline. The sales stay on this register until it connects.')
              }}
            />
          }
          actions={
            <IconButton
              family="neutral"
              icon={Lock}
              label="Lock register"
              onClick={() => {
                notice.info('Register locked.')
              }}
            />
          }
          onScan={scan}
          defaultProductsOpen={productsOpen}
          products={products}
          cart={cart}
        />
        {totalText !== null && (
          <PaymentDialog
            open={paying}
            onOpenChange={(open) => {
              setPaying(open)
              if (!open) setDone(false)
            }}
            total={totalText}
            currency={BAKERY.currency}
            methods={['cash', 'card']}
            method={method}
            onMethodChange={setMethod}
            tendered={tendered}
            onTenderedChange={setTendered}
            quickAmounts={QUICK_AMOUNTS}
            change={method === 'cash' ? cash.change : null}
            remaining={method === 'cash' ? cash.remaining : null}
            cardState={cardState}
            {...(cardState === 'approved' ? { cardMessage: CARD_APPROVAL } : {})}
            onCardStart={() => {
              setSent(true)
              setCardState('waiting')
            }}
            onCardCancel={() => {
              setCardState('idle')
            }}
            {...(completeDisabledReason === undefined ? {} : { completeDisabledReason })}
            onComplete={() => {
              setPaid({ lines: sale, tendered: method === 'cash' ? tendered : null })
              setDone(true)
            }}
            done={done}
            doneText={`Receipt ${BAKERY.receipt}`}
            doneActions={
              <>
                <Button
                  intent="print"
                  emphasis="secondary"
                  label="Show receipt"
                  onClick={() => {
                    setPaying(false)
                    setDone(false)
                    setReceiptOpen(true)
                  }}
                />
                <Button intent="create" emphasis="primary" label="New sale" onClick={newSale} />
              </>
            }
          />
        )}
        <Dialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          title={`Receipt ${BAKERY.receipt}`}
          description="Printed on the register's printer; the customer can ask for it by e-mail."
          actions={
            <>
              <Button
                intent="print"
                emphasis="secondary"
                label="Print again"
                onClick={() => {
                  notice.success('Receipt sent to the printer.')
                }}
              />
              <Button intent="create" emphasis="primary" label="New sale" onClick={newSale} />
            </>
          }
        >
          <ReceiptPreview
            className="mx-auto"
            header={[BAKERY.name, BAKERY.address, BAKERY.taxId]}
            facts={[
              { id: 'number', label: 'Receipt', value: BAKERY.receipt },
              {
                id: 'time',
                label: 'Date',
                value: `${format.date('2026-10-06')} ${BAKERY.time}`,
              },
              { id: 'register', label: 'Register', value: BAKERY.register },
              { id: 'cashier', label: 'Cashier', value: BAKERY.cashier },
            ]}
            items={receiptItems(
              receiptSale,
              (rate, amount) => `Discount ${rate.toString()}%: ${signed(amount)}`,
            )}
            totals={receiptTotals(receiptSale)}
            payments={
              paidCash === null
                ? [{ id: 'card', label: 'Card', value: decimal(receiptSale.total) }]
                : [
                    { id: 'cash', label: 'Cash', value: paidCash },
                    ...(receiptCash.change === null
                      ? []
                      : [{ id: 'change', label: 'Change', value: receiptCash.change }]),
                  ]
            }
            footer={RECEIPT_FOOTER}
            currency={BAKERY.currency}
          />
        </Dialog>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </div>
    </Touch>
  )
}

// ── The handheld: picking PL-2026-0418 ───────────────────────────────────────────────────────

/** A handheld's screen at its own width; on a wide screen, a tablet on a cart (640px). */
function Handheld({ phone, children }: { phone: boolean; children: ReactNode }) {
  return (
    <Touch>
      <div
        className={
          phone ? 'h-full' : 'mx-auto h-dvh max-w-160 border-0 border-x border-solid border-default'
        }
      >
        {children}
        <Toaster layout="phone" />
      </div>
    </Touch>
  )
}

/** The menu of the list: count the location the pick came up short at, sign out. */
function HandheldMenu() {
  const navigate = useContext(Navigate)
  return (
    <DropdownMenu
      align="end"
      trigger={<IconButton intent="more" label="Pick list menu" />}
      entries={[
        {
          label: `Count location ${COUNT.location}`,
          onSelect: () => {
            navigate(I_ROUTES.count)
          },
        },
        {
          label: 'Sign out',
          onSelect: () => {
            navigate(ROUTES.signIn)
          },
        },
      ]}
    />
  )
}

/** Where the current line stands when the screen opens (one route per state). */
export type PickingStep = 'location' | 'item' | 'quantity' | 'skip'

function Picking({
  phone,
  step: initialStep = 'location',
  offline = false,
}: {
  phone: boolean
  step?: PickingStep
  offline?: boolean
}) {
  const { format } = useLiro()
  const [lines, setLines] = useState<readonly PickLine[]>(PICK_LINES)
  const [currentId, setCurrentId] = useState<string | null>(CURRENT_PICK)
  const [step, setStep] = useState<PickStep>(initialStep === 'skip' ? 'item' : initialStep)
  const current = lines.find((line) => line.id === currentId) ?? null
  const [feedback, setFeedback] = useState<ScanFeedback | null>(() => {
    const line = PICK_LINES.find((each) => each.id === CURRENT_PICK)
    if (line === undefined || initialStep === 'location') return null
    return initialStep === 'quantity'
      ? { id: 'restored', tone: 'success', text: line.item }
      : { id: 'restored', tone: 'success', text: `Location ${line.location}` }
  })

  const amount = (quantity: string, unit: string | undefined) =>
    `${format.number(quantity)}${unit === undefined ? '' : ` ${unit}`}`

  /** The next open line after the one just done, else the first open one. */
  const moveOn = (next: readonly PickLine[], doneId: string) => {
    const at = next.findIndex((line) => line.id === doneId)
    const after = [...next.slice(at + 1), ...next.slice(0, at)].find(
      (line) => line.state === 'open',
    )
    setCurrentId(after?.id ?? null)
    setStep('location')
  }

  return (
    <Handheld phone={phone}>
      <PickList
        title={`Pick list ${PICKING.list}`}
        subtitle={`${PICKING.customer} · ${PICKING.warehouse}`}
        lines={lines}
        currentId={currentId}
        step={step}
        feedback={feedback}
        onScan={(code, at) => {
          if (current === null) return
          if (at === 'location') {
            if (code === current.location) {
              setFeedback((previous) => answer(previous, 'success', `Location ${code}`))
              setStep('item')
            } else {
              setFeedback((previous) =>
                answer(previous, 'error', `Wrong location: ${code}. Go to ${current.location}.`),
              )
            }
            return
          }
          if (code === current.itemCode) {
            setFeedback((previous) => answer(previous, 'success', current.item))
            setStep('quantity')
            return
          }
          const other = PICK_LINES.find((line) => line.itemCode === code)
          setFeedback((previous) =>
            answer(
              previous,
              'error',
              other === undefined
                ? `Unknown code ${code}.`
                : `This is ${other.item}, not ${current.item}. Put it back on ${other.location}.`,
            ),
          )
        }}
        onConfirm={(lineId, quantity) => {
          const line = lines.find((each) => each.id === lineId)
          if (line === undefined || quantity === null) return
          const short = quantityUnits(quantity) < quantityUnits(line.quantity)
          const next = lines.map((each) =>
            each.id === lineId
              ? {
                  ...each,
                  picked: quantity,
                  state: short ? ('short' as const) : ('picked' as const),
                  ...(short
                    ? {
                        note: `Picked ${amount(quantity, line.unit)} of ${amount(line.quantity, line.unit)}.`,
                      }
                    : {}),
                }
              : each,
          )
          setLines(next)
          setFeedback((previous) =>
            answer(previous, 'success', `${line.item}: ${amount(quantity, line.unit)} picked`),
          )
          moveOn(next, lineId)
        }}
        onSkip={(lineId, answer) => {
          const reason = SKIP_REASONS.find((each) => each.value === answer.reason)?.label ?? ''
          const details = answer.text.trim()
          const next = lines.map((each) =>
            each.id === lineId
              ? {
                  ...each,
                  state: 'skipped' as const,
                  note: `Skipped: ${reason}${details === '' ? '' : ` — ${details}`}`,
                }
              : each,
          )
          setLines(next)
          setFeedback(null)
          moveOn(next, lineId)
        }}
        skipReasons={SKIP_REASONS}
        defaultSkipOpen={initialStep === 'skip'}
        onSelectLine={(lineId) => {
          const line = lines.find((each) => each.id === lineId)
          if (line?.state !== 'open') return
          setCurrentId(lineId)
          setStep('location')
          setFeedback(null)
        }}
        onFinish={() => {
          notice.success(`${PICKING.list} is picked and handed over for loading.`)
        }}
        offline={offline}
        queued={offline ? PICKING.queued : 0}
        offlineAction={
          <Button
            family="neutral"
            icon={RefreshCw}
            label="Try now"
            onClick={() => {
              notice.info('Still offline. Your changes stay on this device.')
            }}
          />
        }
        actions={<HandheldMenu />}
      />
    </Handheld>
  )
}

// ── The handheld: counting A-02-03 ───────────────────────────────────────────────────────────

function Counting({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [location, setLocation] = useState<string | null>(COUNT.location)
  const [records, setRecords] = useState<readonly CountRecord[]>(COUNT_RECORDS)
  const [currentId, setCurrentId] = useState<string | null>(CURRENT_COUNT)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  return (
    <Handheld phone={phone}>
      <StockCount
        title={COUNT.title}
        subtitle={COUNT.subtitle}
        location={location}
        {...(location === COUNT.location ? { locationName: COUNT.locationName } : {})}
        items={location === null ? [] : countItems(records)}
        currentId={location === null ? null : currentId}
        feedback={feedback}
        onScan={(code, target) => {
          if (target === 'location') {
            if (code === COUNT.location) {
              setLocation(code)
              setFeedback((previous) => answer(previous, 'success', `Location ${code}`))
            } else {
              setFeedback((previous) =>
                answer(previous, 'error', `${code} is not in this count. Scan ${COUNT.location}.`),
              )
            }
            return
          }
          const record = records.find((each) => each.itemCode === code)
          if (record === undefined) {
            setFeedback((previous) =>
              answer(
                previous,
                'error',
                `Unknown code ${code}. Put the item aside and tell the shift leader.`,
              ),
            )
            return
          }
          setCurrentId(record.id)
          setFeedback((previous) => answer(previous, 'success', record.item))
        }}
        onCountChange={(itemId, counted) => {
          setRecords((current) =>
            current.map((each) => (each.id === itemId ? { ...each, counted } : each)),
          )
        }}
        onSelectItem={setCurrentId}
        onChangeLocation={() => {
          setLocation(null)
          setFeedback(null)
        }}
        onFinish={() => {
          notice.success(`Location ${COUNT.location} counted.`)
          navigate(I_ROUTES.picking)
        }}
        actions={<IconButton intent="more" label="Count menu" />}
      />
    </Handheld>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_I_ROUTES: ExampleRoute[] = [
  { path: I_ROUTES.pos, render: (phone) => <Till phone={phone} /> },
  { path: I_ROUTES.posCash, render: (phone) => <Till phone={phone} step="cash" /> },
  {
    path: I_ROUTES.posCardWaiting,
    render: (phone) => <Till phone={phone} step="card-waiting" />,
  },
  {
    path: I_ROUTES.posCardApproved,
    render: (phone) => <Till phone={phone} step="card-approved" />,
  },
  { path: I_ROUTES.posReceipt, render: (phone) => <Till phone={phone} step="receipt" /> },
  { path: I_ROUTES.posOffline, render: (phone) => <Till phone={phone} offline /> },
  { path: I_ROUTES.posProducts, render: (phone) => <Till phone={phone} productsOpen /> },
  { path: I_ROUTES.picking, render: (phone) => <Picking phone={phone} /> },
  { path: I_ROUTES.pickingItem, render: (phone) => <Picking phone={phone} step="item" /> },
  {
    path: I_ROUTES.pickingQuantity,
    render: (phone) => <Picking phone={phone} step="quantity" />,
  },
  { path: I_ROUTES.pickingSkip, render: (phone) => <Picking phone={phone} step="skip" /> },
  { path: I_ROUTES.pickingOffline, render: (phone) => <Picking phone={phone} offline /> },
  { path: I_ROUTES.count, render: (phone) => <Counting phone={phone} /> },
]

import {
  ChartNoAxesColumn,
  GraduationCap,
  HandCoins,
  ListChecks,
  CircleCheck,
  Lock,
  LockOpen,
  LogOut,
  PauseCircle,
  Printer,
  Receipt,
  RefreshCw,
  Send,
  Undo2,
  UserRound,
} from 'lucide-react'
import { useContext, useEffect, useState, type ReactNode } from 'react'
import {
  AdvanceList,
  Banner,
  BrandLockup,
  BuyerField,
  Button,
  CartPanel,
  CheckboxField,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  IconButton,
  LineQuantityPicker,
  LiroProvider,
  MoneyField,
  PaymentDialog,
  PosShell,
  ProductGrid,
  ReceiptFinder,
  ReceiptKindPicker,
  ReceiptPreview,
  ReceiptResult,
  SaveStatus,
  ScanField,
  TextAreaField,
  Toaster,
  useLiro,
  type BuyerValue,
  type CardState,
  type FoundReceipt,
  type PaymentPart,
  type ReceiptDelivery,
  type ScanFeedback,
} from '@veljaos/ui'
import { decimal, paras } from '../../../../packages/ui/src/components/amounts-story-data'
import {
  FISCAL_BANNER,
  FISCAL_END,
  NOT_FISCAL,
  BAKERY_PAYEE,
  instantPaymentCode,
} from '../../../../packages/ui/src/components/sale-story-data'
import { QrCode } from '../../../../packages/ui/src/components/qr-code'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import {
  BAKERY,
  CARD_APPROVAL,
  cartLines,
  cartTotals,
  CATEGORIES,
  computeSale,
  productByCode,
  MOST_SOLD,
  PRODUCTS,
  QUICK_AMOUNTS,
  RECEIPT_FOOTER,
  SALE,
  type SaleLine,
} from './data-I'
import {
  ADVANCE_TAKEN,
  advanceDeduction,
  BUYER_ID_TYPES,
  BUYER_OPTIONAL_TYPES,
  COMPANY_ADVANCES,
  COMPANY_BUYER,
  entryTotal,
  FISCAL,
  issuedFacts,
  journalWith,
  kindLabel,
  kindLine,
  MIXED_PARTS,
  nextEntry,
  ORIGINAL_ID,
  paymentFigures,
  paymentOptionsFor,
  RECEIPT_HEADER,
  RECEIPT_TYPES,
  receiptParts,
  REFUND_BUYER,
  REFUND_CHOICE,
  refundableLines,
  refundFigures,
  searchJournal,
  searchJournalText,
  TILL_ROUTES,
  TRANSACTIONS,
  type JournalEntry,
  type ReceiptTypeId,
  type TransactionId,
} from './data-I-fiscal'

/*
 * The till of Pekara Zlatni klas (group I, screens-I.tsx registers its routes) with the fiscal
 * flows of P5.28 item 21: the receipt's kind, training, the buyer, the ways to pay and several on
 * one receipt, refunds of an earlier receipt, advances and the offline queue. The screen plays the
 * application: it keeps the sale, the receipt's kind, the buyer, the payments and the journal of
 * the day — the sale, the journal and the open advances above the screens (`useExampleState`), as
 * the Core keeps them — decides every rule and computes every figure in data-I.ts and
 * data-I-fiscal.ts; the components show and report. Illustrative: the kinds, codes and rules after
 * the Serbian fiscal system; every number invented.
 */

/** How long the example's terminal (or the customer's bank) takes to answer. */
const TERMINAL_DELAY = 1200

/** Where the till stands when the screen opens (one route per state, P5.23). */
export interface TillStart {
  step?:
    | 'cash'
    | 'card-waiting'
    | 'card-approved'
    | 'receipt'
    | 'mixed'
    | 'instant'
    | 'deferred'
    | 'corporate'
    | 'issued'
  offline?: boolean
  /** Phones: the order sheet open. */
  orderOpen?: boolean
  /** The receipt kind dialog open with this type chosen. */
  kindDialog?: ReceiptTypeId
  /** The cart's type. */
  type?: ReceiptTypeId
  buyerDialog?: boolean
  refund?: 'find' | 'lines' | 'cart' | 'receipt'
  advances?: boolean
  advance?: 'take' | 'refund'
  noCompensation?: boolean
  queue?: 'failed'
}

/** The application's answer to a scan: a new id each time. */
function answer(previous: ScanFeedback | null, tone: ScanFeedback['tone'], text: string) {
  return { id: typeof previous?.id === 'number' ? previous.id + 1 : 1, tone, text }
}

/** The examples' provider again, with `density="touch"`: every target at least 44px. */
export function TillTouch({ children }: { children: ReactNode }) {
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

/** The buyer in words: "10 · Tax number (PIB) 100100100". */
function buyerText(buyer: BuyerValue): string {
  const type = BUYER_ID_TYPES.find((each) => each.value === buyer.typeId)?.label ?? buyer.typeId
  const optional =
    buyer.optionalTypeId === undefined || buyer.optionalTypeId === '' || buyer.optional === ''
      ? ''
      : ` · ${BUYER_OPTIONAL_TYPES.find((each) => each.value === buyer.optionalTypeId)?.label ?? ''} ${buyer.optional ?? ''}`
  return `${type} ${buyer.id}${optional}`
}

/** The buyer as the receipt prints it: "10:100100100". */
function buyerCode(buyer: BuyerValue): string {
  return `${buyer.typeId}:${buyer.id}`
}

/** The receipt's code (a stand-in drawn from its link; the application draws the real one). */
function receiptCode(number: string, size = 128) {
  return (
    <span className="flex text-primary">
      <QrCode value={`${FISCAL.linkBase}${number}`} label="Receipt code" size={size} />
    </span>
  )
}

/** Whether a kind is a real sale (it gets the fiscal banner; the others the marker). */
function isFiscal(type: ReceiptTypeId): boolean {
  return type === 'normal' || type === 'advance'
}

/** An issued receipt as the till prints it. */
function EntryReceipt({ entry }: { entry: JournalEntry }) {
  const { format } = useLiro()
  const signed = (amount: string) => format.number(amount, { decimals: 2 })
  const sale = computeSale(entry.lines)
  const parts = receiptParts(
    sale,
    entry.transaction,
    (rate, amount) => `Discount ${rate.toString()}%: ${signed(amount)}`,
  )
  const type = entry.type
  const fiscal = isFiscal(type)
  const payments = entry.payments.map((part) => ({
    id: part.id,
    label: part.label,
    value: entry.transaction === 'refund' ? decimal(-paras(part.value)) : part.value,
  }))
  const total = entryTotal(entry)
  const paid = entry.payments.reduce((sum, part) => sum + paras(part.value), 0n)
  const change = entry.transaction === 'sale' && paid > total ? paid - total : 0n
  const advanceItem =
    entry.type === 'advance'
      ? [
          {
            id: 'advance',
            name: `Advance: ${entry.advanceText ?? 'order'} (Đ)`,
            quantity: '1',
            unitPrice: decimal(total),
            total: decimal(total),
          },
        ]
      : null
  return (
    <ReceiptPreview
      className="mx-auto"
      {...(fiscal ? { banner: FISCAL_BANNER, end: FISCAL_END } : { marker: NOT_FISCAL })}
      header={RECEIPT_HEADER}
      facts={[
        { id: 'cashier', label: 'Cashier', value: BAKERY.cashier },
        { id: 'device', label: 'Device', value: FISCAL.device },
        ...(entry.buyer === undefined
          ? []
          : [{ id: 'buyer', label: 'Buyer ID', value: buyerCode(entry.buyer) }]),
        ...(entry.buyer?.optionalTypeId === undefined || entry.buyer.optionalTypeId === ''
          ? []
          : [
              {
                id: 'optional',
                label: 'Buyer’s optional field',
                value: `${entry.buyer.optionalTypeId}:${entry.buyer.optional ?? ''}`,
              },
            ]),
        ...(entry.reference === undefined
          ? []
          : [
              { id: 'ref', label: 'Original receipt', value: entry.reference.number },
              { id: 'reftime', label: 'Original time', value: entry.reference.time },
            ]),
      ]}
      kindLine={kindLine(type, entry.transaction)}
      items={advanceItem ?? parts.items}
      totals={
        advanceItem === null
          ? parts.totals
          : [{ id: 'total', label: 'Advance', value: decimal(total), strong: true }]
      }
      payments={[
        ...payments,
        ...(change === 0n ? [] : [{ id: 'change', label: 'Change', value: decimal(change) }]),
      ]}
      {...(advanceItem === null && parts.recap.rows.length > 0 ? { recap: parts.recap } : {})}
      {...(fiscal ? { issuedFacts: issuedFacts(entry) } : {})}
      {...(entry.transaction === 'refund' && entry.payments.some((part) => part.label === 'Cash')
        ? { signature: 'Buyer’s signature' }
        : {})}
      {...(fiscal && entry.state === 'sent' ? { code: receiptCode(entry.number) } : {})}
      footer={[
        ...(entry.withoutCompensation === true ? ['WITHOUT COMPENSATION'] : []),
        ...RECEIPT_FOOTER,
      ]}
      currency={BAKERY.currency}
    />
  )
}

// ── The till ──────────────────────────────────────────────────────────────────────────────────

/** A sent receipt's ways to the customer, with the example's states. */
const DELIVERY_WAYS: readonly ReceiptDelivery[] = [
  { id: 'print', label: 'Print', icon: Printer },
  {
    id: 'email',
    label: 'Send by e-mail',
    icon: Send,
    address: { label: 'Customer’s e-mail', type: 'email' },
  },
  {
    id: 'sms',
    label: 'Send a link by SMS',
    icon: Send,
    address: { label: 'Customer’s mobile number', type: 'tel' },
  },
]

export function Till({ phone, start = {} }: { phone: boolean; start?: TillStart }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const money = (value: string) => format.money(value, BAKERY.currency)
  const step = start.step
  const offline = start.offline === true

  // ── What the application keeps above the screens ──
  const [journal, setJournal] = useExampleState<JournalEntry[]>('till.journal', () =>
    journalWith(start.queue === 'failed' ? 'failed' : offline ? 'offline' : 'online'),
  )
  const [advances, setAdvances] = useExampleState('till.advances', () => [...COMPANY_ADVANCES])
  const [refundOriginalId] = useExampleState('till.refundOriginal', () => ORIGINAL_ID)

  // ── The sale ──
  // The sale outlives the screen, as the Core keeps it (P5.28).
  const [sale, setSale] = useExampleState<readonly SaleLine[]>('till.sale', () => SALE)
  /**
   * The cart's Undo of the last removal or of a parked sale, in its place (P5.93 item 3: no toasts
   * for routine actions at a till).
   */
  const [undo, setUndo] = useState<{
    message: string
    undoLabel?: string
    after?: string
    before: readonly SaleLine[]
  } | null>(null)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const [locked, setLocked] = useState(false)
  const [offlineChecked, setOfflineChecked] = useState(false)
  /** The advance just refunded, said in the cart's details (P5.93 item 3: no toast). */
  const [refunded, setRefunded] = useState<string | null>(null)
  const [reprinted, setReprinted] = useState(false)
  const [type, setType] = useState<ReceiptTypeId>(start.type ?? 'normal')
  const [transaction, setTransaction] = useState<TransactionId>(
    start.refund === 'cart' || start.refund === 'receipt' ? 'refund' : 'sale',
  )
  const [withoutCompensation, setWithoutCompensation] = useState(start.noCompensation === true)
  const [buyer, setBuyer] = useState<BuyerValue | null>(
    start.step === 'corporate'
      ? COMPANY_BUYER.card
      : start.advances === true || start.buyerDialog === true || start.advance !== undefined
        ? COMPANY_BUYER.value
        : start.refund === 'cart' || start.refund === 'receipt'
          ? REFUND_BUYER
          : null,
  )
  const [advancesChosen, setAdvancesChosen] = useState<string[]>(
    start.advances === true ? ['a2265'] : [],
  )

  // ── Dialogs ──
  const [kindOpen, setKindOpen] = useState(start.kindDialog !== undefined)
  const [kindDraft, setKindDraft] = useState<{
    type: ReceiptTypeId
    transaction: string
    withoutCompensation: boolean
  }>({ type: start.kindDialog ?? type, transaction: 'sale', withoutCompensation: false })
  const [buyerOpen, setBuyerOpen] = useState(start.buyerDialog === true)
  const [buyerDraft, setBuyerDraft] = useState<BuyerValue>(
    start.buyerDialog === true ? COMPANY_BUYER.card : (buyer ?? { typeId: '10', id: '' }),
  )
  const [refundOpen, setRefundOpen] = useState(start.refund === 'find' || start.refund === 'lines')
  // The step stays while the dialog closes, so its content does not change under the animation.
  const [refundStep, setRefundStep] = useState<'find' | 'lines'>(
    start.refund === 'lines' ? 'lines' : 'find',
  )
  const [found, setFound] = useState<FoundReceipt[] | undefined>(
    start.refund === 'find' || start.refund === 'lines'
      ? searchJournal(journal, { number: '', total: '1011' })
      : undefined,
  )
  const [refundChosenId, setRefundChosenId] = useState<string | null>(
    start.refund === undefined ? null : refundOriginalId,
  )
  const [refundChoice, setRefundChoice] = useState<Readonly<Record<string, string | null>>>(
    start.refund === 'find' ? {} : REFUND_CHOICE,
  )
  const [refundBuyer, setRefundBuyer] = useState<BuyerValue>(REFUND_BUYER)
  const [advanceOpen, setAdvanceOpen] = useState(start.advance === 'take')
  const [advanceAmount, setAdvanceAmount] = useState<string | null>(ADVANCE_TAKEN.amount)
  const [advanceNote, setAdvanceNote] = useState(ADVANCE_TAKEN.note)
  const [advanceRefundId, setAdvanceRefundId] = useState<string | null>(
    start.advance === 'refund' ? 'a2265' : null,
  )
  /** Taking an advance: the amount being paid. */
  const [takingAdvance, setTakingAdvance] = useState<string | null>(null)

  // ── The payment ──
  const paymentSteps = [
    'cash',
    'card-waiting',
    'card-approved',
    'mixed',
    'instant',
    'deferred',
    'corporate',
    'issued',
  ]
  const [paying, setPaying] = useState(step !== undefined && paymentSteps.includes(step))
  const [method, setMethod] = useState<string>(
    step === 'card-waiting' || step === 'card-approved' || step === 'corporate'
      ? 'card'
      : step === 'instant'
        ? 'instant'
        : step === 'deferred'
          ? 'wire'
          : 'cash',
  )
  const [parts, setParts] = useState<readonly PaymentPart[]>(
    step === 'mixed'
      ? MIXED_PARTS
      : step === 'card-approved' || step === 'corporate'
        ? [
            {
              id: 'card-1',
              label: 'Card',
              value: decimal(computeSale(SALE).total),
              detail: step === 'corporate' ? 'Corporate card •••• 7310' : CARD_APPROVAL,
              state: 'approved',
            },
          ]
        : [],
  )
  const [tendered, setTendered] = useState<string | null>(
    step === 'cash' || step === 'receipt' || step === 'issued'
      ? (QUICK_AMOUNTS[0] ?? null)
      : step === 'mixed'
        ? '500'
        : null,
  )
  const [reference, setReference] = useState('')
  // The buyer showed their own IPS QR code (kind PK) and the cashier scanned it (P5.40).
  const [buyerCode, setBuyerCode] = useState(false)
  const [cardState, setCardState] = useState<CardState>(
    step === 'card-waiting' || step === 'instant'
      ? 'waiting'
      : step === 'card-approved' || step === 'corporate'
        ? 'approved'
        : 'idle',
  )
  /** The amount sent to the terminal or shown in the code (null: a restored picture). */
  const [sentAmount, setSentAmount] = useState<string | null>(null)
  const [done, setDone] = useState(step === 'issued')
  const [issued, setIssued] = useState<JournalEntry | null>(() => {
    if (step === 'issued' || step === 'receipt') {
      return nextEntry(journal, {
        type: 'normal',
        transaction: 'sale',
        lines: SALE,
        payments: [{ id: 'cash', label: 'Cash', value: '2000.00' }],
        offline,
      })
    }
    if (start.refund === 'receipt') {
      const original = journal.find((each) => each.id === refundOriginalId)
      if (original === undefined) return null
      const figures = refundFigures(original, REFUND_CHOICE)
      return nextEntry(journal, {
        type: 'normal',
        transaction: 'refund',
        lines: figures.lines,
        payments: [{ id: 'cash', label: 'Cash', value: decimal(figures.total) }],
        reference: { number: original.number, time: `06.10.2026. ${original.time}` },
        buyer: REFUND_BUYER,
      })
    }
    return null
  })
  const [receiptOpen, setReceiptOpen] = useState(step === 'receipt' || start.refund === 'receipt')
  const [deliveries, setDeliveries] = useState<Record<string, Partial<ReceiptDelivery>>>({})

  // ── The application's figures ──
  const original = journal.find((each) => each.id === refundChosenId)
  const refund =
    transaction === 'refund' && original !== undefined
      ? refundFigures(original, refundChoice)
      : null
  const computed = computeSale(refund === null ? sale : refund.lines)
  const deduction =
    refund === null && buyer !== null && advancesChosen.length > 0
      ? advanceDeduction(
          computed.total,
          advancesChosen.filter((id) => advances.some((each) => each.id === id)),
        )
      : 0n
  const due =
    takingAdvance !== null
      ? paras(takingAdvance)
      : refund !== null
        ? refund.total
        : computed.total - deduction
  const options = withoutCompensation
    ? paymentOptionsFor(buyer).filter((each) => each.id === 'other')
    : paymentOptionsFor(buyer)
  const option = options.find((each) => each.id === method) ?? options[0]
  const figures = paymentFigures(due, parts, tendered, option?.kind === 'cash')
  const training = type === 'training'
  const marker = RECEIPT_TYPES.find((each) => each.id === type)?.marker

  // The example's terminal and bank: they answer a while after the amount is sent.
  useEffect(() => {
    if (!paying || cardState !== 'waiting' || sentAmount === null) return
    const timer = window.setTimeout(() => {
      setCardState('approved')
      setParts((current) => [
        ...current,
        {
          id: `${method}-${String(current.length + 1)}`,
          label: option?.label ?? method,
          value: sentAmount,
          detail: method === 'card' ? CARD_APPROVAL : 'Reference 97 0612-0942',
          state: 'approved',
        },
      ])
      setSentAmount(null)
      setTendered(null)
    }, TERMINAL_DELAY)
    return () => {
      window.clearTimeout(timer)
    }
  }, [paying, cardState, sentAmount, method, option?.label])

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
    setUndo(null)
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

  const resetPayment = () => {
    setParts([])
    setTendered(null)
    setReference('')
    setCardState('idle')
    setSentAmount(null)
    setMethod(options[0]?.id ?? 'cash')
  }
  const newSale = () => {
    setSale([])
    setPaying(false)
    setDone(false)
    setReceiptOpen(false)
    setIssued(null)
    setDeliveries({})
    setTransaction('sale')
    setRefundChosenId(null)
    setRefundChoice({})
    setAdvancesChosen([])
    setTakingAdvance(null)
    setBuyer(null)
    setWithoutCompensation(false)
    setFeedback(null)
    setUndo(null)
    resetPayment()
  }

  const completeDisabledReason =
    (option?.unavailableReason === undefined ? undefined : 'Enter the buyer first.') ??
    (cardState === 'waiting'
      ? 'Waiting for the payment.'
      : figures.remaining <= 0n
        ? undefined
        : option?.kind === 'cash'
          ? tendered === null
            ? 'Enter the amount tendered.'
            : figures.remainingText !== null
              ? 'The amount tendered is less than the amount due.'
              : undefined
          : 'Pay the remaining amount first.')

  const complete = () => {
    if (completeDisabledReason !== undefined) return
    const cashPart =
      option?.kind === 'cash' && figures.remaining > 0n && tendered !== null
        ? [
            {
              id: `cash-${String(parts.length + 1)}`,
              label: 'Cash',
              value: decimal(paras(tendered)),
            },
          ]
        : []
    const entryType: ReceiptTypeId = takingAdvance !== null ? 'advance' : type
    const lines = takingAdvance !== null ? [] : refund !== null ? refund.lines : sale
    const entry = nextEntry(journal, {
      type: entryType,
      transaction,
      lines,
      payments: [
        ...(deduction > 0n
          ? [{ id: 'advance', label: 'Advances deducted', value: decimal(deduction) }]
          : []),
        ...parts,
        ...cashPart,
      ],
      offline,
      ...(buyer === null ? {} : { buyer }),
      ...(refund !== null && original !== undefined
        ? {
            reference: { number: original.number, time: `06.10.2026. ${original.time}` },
            buyer: refundBuyer,
          }
        : {}),
      ...(takingAdvance === null ? {} : { advanceText: advanceNote }),
      ...(withoutCompensation ? { withoutCompensation: true } : {}),
    })
    setJournal((current) => [...current, entry])
    if (deduction > 0n) {
      setAdvances((current) =>
        current.filter((each) => !advancesChosen.includes(each.id) || paras(each.open) > deduction),
      )
    }
    setIssued(entry)
    setDone(true)
  }

  // Each tile shows how many of it the sale holds: the count goes up under the finger (P5.90).
  const inSale = new Map(sale.map((line) => [line.productId, line.quantity]))
  const products = (
    <ProductGrid
      products={[
        ...MOST_SOLD.flatMap((id) => PRODUCTS.filter((each) => each.id === id)),
        ...PRODUCTS.filter((each) => !MOST_SOLD.includes(each.id)),
      ].map((each) => {
        const quantity = inSale.get(each.id)
        return {
          ...each,
          ...(MOST_SOLD.includes(each.id) ? { categoryIds: ['top'] } : {}),
          ...(quantity === undefined ? {} : { inOrder: quantity }),
        }
      })}
      categories={[{ id: 'top', label: 'Most sold' }, ...CATEGORIES]}
      currency={BAKERY.currency}
      search
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

  const kind = `${kindLabel(type, transaction)}${withoutCompensation ? ' · Without compensation' : ''}`
  const buyerLine =
    buyer === null ? null : (
      <p className="m-0 text-sm text-secondary bidi-content">{`Buyer: ${buyerText(buyer)}`}</p>
    )
  const companyBuyer =
    buyer !== null && buyer.typeId === '10' && buyer.id === COMPANY_BUYER.value.id

  const details =
    refund !== null && original !== undefined ? (
      <>
        <p className="m-0 text-sm text-primary bidi-content">
          {`Refund of ${original.number}, 06.10.2026. ${original.time}`}
        </p>
        <p className="m-0 text-sm text-secondary bidi-content">{`Buyer: ${buyerText(refundBuyer)}`}</p>
      </>
    ) : buyer !== null ? (
      <>
        {buyerLine}
        {companyBuyer && type === 'normal' && (
          <AdvanceList
            title={`Open advances of ${COMPANY_BUYER.name}`}
            advances={advances}
            currency={BAKERY.currency}
            selected={advancesChosen}
            onSelectionChange={setAdvancesChosen}
            onRefund={setAdvanceRefundId}
            chosenTotal={advancesChosen.length === 0 ? null : decimal(deduction)}
            emptyText="No open advances."
          />
        )}
        {refunded !== null && (
          <p role="status" className="m-0 text-sm text-status-success-fg bidi-content">
            <CircleCheck aria-hidden="true" className="me-1.5 inline size-4 align-[-0.1875em]" />
            {refunded}
          </p>
        )}
      </>
    ) : undefined

  const cart = (
    <CartPanel
      className="flex-1"
      kindLabel={kind}
      {...(marker === undefined ? {} : { marker })}
      {...(details === undefined ? {} : { details })}
      lines={
        refund !== null
          ? cartLines(computed, () => '').map((line) => ({ ...line, min: '0' }))
          : cartLines(
              computed,
              (reason, rate, amount) => `${reason} ${rate.toString()}%: ${money(amount)}`,
            )
      }
      currency={BAKERY.currency}
      total={computed.lines.length === 0 ? null : decimal(due)}
      totals={
        computed.lines.length === 0
          ? []
          : [
              ...cartTotals(computed),
              ...(deduction > 0n
                ? [{ id: 'advances', label: 'Advances deducted', value: decimal(-deduction) }]
                : []),
            ]
      }
      {...(deduction > 0n ? { totalLabel: 'To pay' } : {})}
      {...(refund !== null ? { totalLabel: 'To pay out' } : {})}
      {...(refund === null
        ? {
            onQuantityChange: (id: string, quantity: string | null) => {
              if (quantity === null || !/^[1-9]\d*$/.test(quantity)) return
              setUndo(null)
              setSale((current) =>
                current.map((each) => (each.productId === id ? { ...each, quantity } : each)),
              )
            },
            onRemove: (id: string) => {
              // No question first: the line goes, and Undo stands in its place (P5.93 item 3).
              const at = sale.findIndex((each) => each.productId === id)
              const name = PRODUCTS.find((each) => each.id === id)?.name ?? ''
              const previous = at > 0 ? sale[at - 1]?.productId : undefined
              setUndo({
                message: `${name} removed`,
                ...(previous === undefined ? {} : { after: previous }),
                before: sale,
              })
              setSale((current) => current.filter((each) => each.productId !== id))
            },
          }
        : {})}
      {...(refund !== null
        ? { chargeLabel: `Pay out ${money(decimal(due))}` }
        : deduction > 0n
          ? { chargeLabel: `Charge ${money(decimal(due))}` }
          : {})}
      {...(undo === null
        ? {}
        : {
            undo: {
              message: undo.message,
              ...(undo.undoLabel === undefined ? {} : { undoLabel: undo.undoLabel }),
              ...(undo.after === undefined ? {} : { after: undo.after }),
              onUndo: () => {
                setSale(undo.before)
                setUndo(null)
              },
            },
          })}
      onCharge={() => {
        setUndo(null)
        resetPayment()
        setPaying(true)
      }}
      headerActions={
        <>
          <Button
            family="neutral"
            icon={Receipt}
            label="Receipt kind"
            onClick={() => {
              setKindDraft({ type, transaction, withoutCompensation })
              setKindOpen(true)
            }}
          />
          <Button
            family="neutral"
            icon={UserRound}
            label={buyer === null ? 'Buyer' : 'Change buyer'}
            onClick={() => {
              setBuyerDraft(buyer ?? { typeId: '10', id: '' })
              setBuyerOpen(true)
            }}
          />
        </>
      }
      actions={
        <Button
          family="neutral"
          icon={PauseCircle}
          label="Park sale"
          onClick={() => {
            const parked = sale
            newSale()
            // The empty cart says where the sale went, with "Resume" (P5.93 item 3: no toast).
            setUndo({
              message: 'Sale parked. It waits under Parked sales.',
              undoLabel: 'Resume',
              before: parked,
            })
          }}
        />
      }
    />
  )

  const waitingCount = journal.filter((each) => each.state !== 'sent').length
  const refusedCount = journal.filter((each) => each.state === 'refused').length

  const menu = (
    <DropdownMenu
      align="end"
      trigger={<IconButton intent="more" label="Till menu" />}
      entries={[
        {
          label: 'Receipt journal',
          icon: ListChecks,
          onSelect: () => {
            navigate(TILL_ROUTES.journal)
          },
        },
        {
          label: 'Daily report',
          icon: ChartNoAxesColumn,
          onSelect: () => {
            navigate(TILL_ROUTES.dailyReport)
          },
        },
        { type: 'separator' },
        {
          label: 'Refund…',
          icon: Undo2,
          onSelect: () => {
            setFound(undefined)
            setRefundChosenId(null)
            setRefundChoice({})
            setRefundStep('find')
            setRefundOpen(true)
          },
        },
        {
          label: 'Take advance…',
          icon: HandCoins,
          onSelect: () => {
            setBuyer((current) => current ?? COMPANY_BUYER.value)
            setAdvanceOpen(true)
          },
        },
        {
          label: training ? 'Leave training' : 'Training mode',
          icon: GraduationCap,
          onSelect: () => {
            setType(training ? 'normal' : 'training')
          },
        },
      ]}
    />
  )

  const optionNow = options.find((each) => each.id === method)
  const amountShown = (value: string) => money(value)

  if (locked) {
    // The register locked in place (P5.93 item 3: the screen itself answers, not a toast).
    return (
      <TillTouch>
        <div
          className={`${phone ? 'h-full' : 'h-dvh'} flex flex-col items-center justify-center gap-4 bg-surface-sunken p-6 text-center`}
        >
          <BrandLockup brandName="Zlatni klas" productName="Kasa" />
          <h1 className="m-0 text-h2 text-primary bidi-content">{`${BAKERY.register} is locked`}</h1>
          <p className="m-0 text-sm text-secondary bidi-content">{`${BAKERY.cashier} · the sale waits as it was`}</p>
          <Button
            family="primary"
            emphasis="primary"
            icon={LockOpen}
            label="Unlock"
            onClick={() => {
              setLocked(false)
            }}
          />
        </div>
      </TillTouch>
    )
  }

  return (
    <TillTouch>
      <div className={phone ? 'h-full' : 'h-dvh'}>
        <PosShell
          layout={phone ? 'phone' : 'tablet'}
          brand={<BrandLockup brandName="Zlatni klas" productName="Kasa" compact={phone} />}
          register={BAKERY.register}
          cashier={BAKERY.cashier}
          offline={offline}
          queued={waitingCount}
          {...(refusedCount > 0
            ? {
                queueState: 'failed' as const,
                queuedText: `${String(refusedCount)} receipts were not accepted`,
              }
            : {})}
          queueAction={
            <Button
              family="neutral"
              icon={ListChecks}
              label="Show receipts"
              onClick={() => {
                navigate(TILL_ROUTES.journalQueue)
              }}
            />
          }
          offlineAction={
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {/* The answer beside the action, not a toast (P5.93 item 3). */}
              <span role="status" className="text-xs text-secondary bidi-content">
                {offlineChecked ? 'Still offline' : ''}
              </span>
              <Button
                family="neutral"
                icon={RefreshCw}
                label="Try now"
                onClick={() => {
                  setOfflineChecked(true)
                }}
              />
            </span>
          }
          {...(training
            ? {
                banners: (
                  <Banner
                    tone="warning"
                    icon={GraduationCap}
                    title="Training mode"
                    role="status"
                    actions={
                      <Button
                        family="neutral"
                        icon={LogOut}
                        label="Leave training"
                        onClick={() => {
                          setType('normal')
                        }}
                      />
                    }
                  >
                    Nothing is reported; every receipt says it is not a fiscal receipt.
                  </Banner>
                ),
              }
            : {})}
          actions={
            <>
              <IconButton
                family="neutral"
                icon={Lock}
                label="Lock register"
                onClick={() => {
                  setLocked(true)
                }}
              />
              {menu}
            </>
          }
          onScan={scan}
          defaultOrderOpen={start.orderOpen === true}
          products={products}
          cart={cart}
          orderSummary={{
            count: computed.lines.length,
            total: computed.lines.length === 0 ? null : decimal(due),
            currency: BAKERY.currency,
          }}
        />

        {/* The receipt kind */}
        <Dialog
          open={kindOpen}
          onOpenChange={setKindOpen}
          title="Receipt kind"
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setKindOpen(false)
                }}
              />
              <Button
                intent="confirm"
                label="Apply"
                onClick={() => {
                  setKindOpen(false)
                  if (kindDraft.transaction === 'refund') {
                    // The application's rule: a refund starts from the original receipt.
                    setFound(undefined)
                    setRefundStep('find')
                    setRefundOpen(true)
                    return
                  }
                  setType(kindDraft.type)
                  setWithoutCompensation(kindDraft.withoutCompensation)
                }}
              />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <ReceiptKindPicker
              types={RECEIPT_TYPES}
              transactions={TRANSACTIONS}
              type={kindDraft.type}
              transaction={kindDraft.transaction}
              onChange={(nextType, nextTransaction) => {
                const known = RECEIPT_TYPES.find((each) => each.id === nextType)
                if (known === undefined) return
                setKindDraft((current) => ({
                  ...current,
                  type: known.id as ReceiptTypeId,
                  transaction: nextTransaction,
                }))
              }}
            />
            <CheckboxField
              label="Sale without compensation"
              description="A gift or a sample: recorded as a sale paid by Other cashless, printed “Without compensation”."
              checked={kindDraft.withoutCompensation}
              onChange={(checked) => {
                setKindDraft((current) => ({ ...current, withoutCompensation: checked }))
              }}
            />
          </div>
        </Dialog>

        {/* The buyer */}
        <Dialog
          open={buyerOpen}
          onOpenChange={setBuyerOpen}
          title="Buyer"
          actions={
            <>
              {buyer !== null && (
                <Button
                  family="neutral"
                  icon={UserRound}
                  label="Remove buyer"
                  onClick={() => {
                    setBuyer(null)
                    setAdvancesChosen([])
                    setBuyerOpen(false)
                  }}
                />
              )}
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setBuyerOpen(false)
                }}
              />
              <Button
                intent="save"
                label="Save buyer"
                onClick={() => {
                  if (buyerDraft.id.trim() === '') return
                  setBuyer(buyerDraft)
                  setBuyerOpen(false)
                }}
              />
            </>
          }
        >
          <BuyerField
            types={BUYER_ID_TYPES}
            optionalTypes={BUYER_OPTIONAL_TYPES}
            value={buyerDraft}
            onChange={setBuyerDraft}
            description="Needed for a wire transfer, a refund or a corporate card; optional otherwise."
            {...(buyerDraft.typeId === '10' &&
            buyerDraft.id !== '' &&
            !/^\d{9}$/.test(buyerDraft.id)
              ? { errors: { id: 'A tax number has 9 digits.' } }
              : {})}
          />
        </Dialog>

        {/* Refund: find the original, then its lines */}
        <Dialog
          open={refundOpen}
          onOpenChange={(open) => {
            if (!open) setRefundOpen(false)
          }}
          size="wide"
          title={
            refundStep === 'lines' && original !== undefined
              ? `Refund from ${original.number}`
              : 'Refund'
          }
          actions={
            refundStep === 'lines' ? (
              <>
                <Button
                  intent="back"
                  label="Back"
                  onClick={() => {
                    setRefundStep('find')
                  }}
                />
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={Undo2}
                  label={`Refund ${money(decimal(original === undefined ? 0n : refundFigures(original, refundChoice).total))}`}
                  onClick={() => {
                    if (original === undefined) return
                    if (refundFigures(original, refundChoice).lines.length === 0) return
                    setTransaction('refund')
                    setType('normal')
                    setRefundOpen(false)
                  }}
                />
              </>
            ) : (
              <>
                <Button
                  intent="cancel"
                  label="Cancel"
                  onClick={() => {
                    setRefundOpen(false)
                  }}
                />
                <Button
                  intent="next"
                  label="Choose lines"
                  onClick={() => {
                    if (refundChosenId === null) return
                    setRefundChoice({})
                    setRefundStep('lines')
                  }}
                />
              </>
            )
          }
        >
          {refundStep === 'lines' && original !== undefined ? (
            <div className="flex flex-col gap-6">
              <LineQuantityPicker
                label="Lines to refund"
                lines={refundableLines(original)}
                value={refundChoice}
                onChange={setRefundChoice}
                currency={BAKERY.currency}
                chosenTotal={decimal(refundFigures(original, refundChoice).total)}
                chosenTotalLabel="To refund"
              />
              <BuyerField
                types={BUYER_ID_TYPES}
                value={refundBuyer}
                onChange={setRefundBuyer}
                required
                description={FISCAL.refundBuyerRule}
              />
            </div>
          ) : (
            <ReceiptFinder
              currency={BAKERY.currency}
              defaultSearch={format.number('1011', { decimals: 2 })}
              onScan={(code) => {
                const hit = journal.find((each) => code.endsWith(each.number))
                if (hit !== undefined) {
                  setFound(searchJournal(journal, { number: hit.number, total: null }))
                  setRefundChosenId(hit.id)
                }
              }}
              onSearch={(text) => {
                // The application reads the one field: a day, an amount or a receipt's number.
                setFound(text === '' ? undefined : searchJournalText(journal, text, format))
              }}
              {...(found === undefined ? {} : { results: found })}
              chosenId={refundChosenId}
              onChoose={setRefundChosenId}
            />
          )}
        </Dialog>

        {/* Taking an advance */}
        <Dialog
          open={advanceOpen}
          onOpenChange={setAdvanceOpen}
          title="Take advance"
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setAdvanceOpen(false)
                }}
              />
              <Button
                family="primary"
                emphasis="primary"
                icon={HandCoins}
                label={
                  advanceAmount === null
                    ? 'Take advance'
                    : `Take ${money(decimal(paras(advanceAmount)))}`
                }
                onClick={() => {
                  if (advanceAmount === null || buyer === null) return
                  setTakingAdvance(decimal(paras(advanceAmount)))
                  setAdvanceOpen(false)
                  resetPayment()
                  setPaying(true)
                }}
              />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <BuyerField
              types={BUYER_ID_TYPES}
              value={buyer ?? { typeId: '10', id: '' }}
              onChange={setBuyer}
              required
              description="An advance names the buyer it is closed for."
            />
            <MoneyField
              label="Advance"
              currency={BAKERY.currency}
              value={advanceAmount}
              onChange={setAdvanceAmount}
              required
            />
            <TextAreaField label="For" value={advanceNote} onChange={setAdvanceNote} />
          </div>
        </Dialog>

        {/* Refunding an advance */}
        {(() => {
          const advance = advances.find((each) => each.id === advanceRefundId)
          if (advance === undefined) return null
          return (
            <ConfirmDialog
              open
              onOpenChange={(open) => {
                if (!open) setAdvanceRefundId(null)
              }}
              title="Refund advance"
              family="caution"
              actionIcon={Undo2}
              confirmLabel={`Refund ${money(advance.open)}`}
              message={
                <>
                  <strong className="block font-semibold bidi-content">{advance.number}</strong>
                  <span className="block bidi-content">
                    {`${money(advance.open)} still open goes back to ${COMPANY_BUYER.name} by wire transfer, with a refund receipt that refers to the advance.`}
                  </span>
                </>
              }
              onConfirm={() => {
                setAdvances((current) => current.filter((each) => each.id !== advance.id))
                setAdvancesChosen((current) => current.filter((id) => id !== advance.id))
                setAdvanceRefundId(null)
                setRefunded(`${advance.number} refunded: ${money(advance.open)}, by wire transfer`)
              }}
            />
          )
        })()}

        {/* The payment */}
        {(computed.lines.length > 0 || takingAdvance !== null) && (
          <PaymentDialog
            open={paying}
            onOpenChange={(open) => {
              setPaying(open)
              if (!open) {
                setDone(false)
                setTakingAdvance(null)
              }
            }}
            title={
              takingAdvance !== null
                ? 'Advance payment'
                : refund !== null
                  ? 'Refund payment'
                  : 'Payment'
            }
            total={decimal(due)}
            currency={BAKERY.currency}
            methods={options}
            method={optionNow?.id ?? options[0]?.id ?? 'cash'}
            onMethodChange={(next) => {
              setMethod(next)
              setCardState('idle')
              const nextOption = options.find((each) => each.id === next)
              setTendered(
                nextOption?.kind === 'cash'
                  ? null
                  : figures.remaining > 0n
                    ? decimal(figures.remaining)
                    : null,
              )
            }}
            tendered={tendered}
            onTenderedChange={setTendered}
            quickAmounts={QUICK_AMOUNTS}
            change={figures.change}
            remaining={
              parts.length > 0
                ? decimal(figures.remaining)
                : option?.kind === 'cash'
                  ? figures.remainingText
                  : null
            }
            paid={parts}
            onAddPart={(id, amount) => {
              const chosen = options.find((each) => each.id === id)
              if (chosen === undefined) return
              if (chosen.kind === 'cash' && paras(amount) >= figures.remaining) {
                complete()
                return
              }
              setParts((current) => [
                ...current,
                {
                  id: `${id}-${String(current.length + 1)}`,
                  label: chosen.label,
                  value: decimal(paras(amount)),
                  ...(reference.trim() === '' ? {} : { detail: reference.trim() }),
                },
              ])
              setTendered(null)
              setReference('')
            }}
            onRemovePart={(id) => {
              setParts((current) => current.filter((each) => each.id !== id))
            }}
            onCancel={() => {
              // The example reverses the approved parts at once; a real till asks its terminal.
              setParts([])
              setCardState('idle')
              setTendered(null)
              setSentAmount(null)
            }}
            reference={reference}
            onReferenceChange={setReference}
            qrCode={
              buyerCode ? null : (
                <span className="flex text-primary">
                  <QrCode
                    value={instantPaymentCode(
                      BAKERY_PAYEE,
                      sentAmount ?? decimal(due),
                      '20261014000412',
                    )}
                    label="IPS QR code for the payment"
                    size={176}
                  />
                </span>
              )
            }
            cardState={cardState}
            {...(cardState === 'approved' && parts.length > 0
              ? {
                  cardMessage: `${amountShown(parts[parts.length - 1]?.value ?? '0')} · ${parts[parts.length - 1]?.detail ?? ''}`,
                }
              : cardState === 'waiting' && buyerCode
                ? {
                    cardMessage:
                      'The buyer’s code is read; the bank is asking the buyer to confirm.',
                  }
                : {})}
            onCardStart={() => {
              setSentAmount(
                tendered === null ? decimal(figures.remaining) : decimal(paras(tendered)),
              )
              setCardState('waiting')
            }}
            onCardCancel={() => {
              setSentAmount(null)
              setBuyerCode(false)
              setCardState('idle')
            }}
            {...(step === 'deferred' || option?.unavailableReason !== undefined
              ? {
                  extra: (
                    <BuyerField
                      types={BUYER_ID_TYPES}
                      value={buyer ?? { typeId: '10', id: '' }}
                      onChange={(next) => {
                        setBuyer(next)
                      }}
                      required
                      description={FISCAL.deferredBuyerRule}
                    />
                  ),
                }
              : option?.kind === 'qr' && cardState === 'idle'
                ? {
                    // The other way of an instant payment: the buyer shows their bank app's code
                    // (IPS QR, kind PK) and the cashier scans it.
                    extra: (
                      <ScanField
                        label="Or scan the buyer’s code"
                        description="The buyer shows the IPS QR code from their bank’s app."
                        placeholder="Scan the buyer’s IPS QR code"
                        onScan={() => {
                          setSentAmount(
                            tendered === null
                              ? decimal(figures.remaining)
                              : decimal(paras(tendered)),
                          )
                          setBuyerCode(true)
                          setCardState('waiting')
                        }}
                      />
                    ),
                  }
                : buyer !== null && step === 'corporate'
                  ? {
                      extra: (
                        <p className="m-0 text-sm text-secondary bidi-content">
                          {`Buyer: ${buyerText(buyer)}`}
                        </p>
                      ),
                    }
                  : {})}
            {...(completeDisabledReason === undefined ? {} : { completeDisabledReason })}
            onComplete={complete}
            done={done}
            {...(issued === null ? {} : { doneText: `Receipt ${issued.number}` })}
            {...(issued === null
              ? {}
              : {
                  doneContent: (
                    <ReceiptResult
                      tone={issued.state === 'sent' ? 'issued' : 'waiting'}
                      {...(issued.state === 'sent'
                        ? {}
                        : {
                            text: 'Kept on this till and sent when the connection is back; the printed receipt is valid.',
                          })}
                      facts={issuedFacts(issued)}
                      {...(issued.state === 'sent'
                        ? {
                            code: receiptCode(issued.number, 112),
                            link: {
                              href: `${FISCAL.linkBase}${issued.number}`,
                              label: `example.com/receipts/${issued.number}`,
                            },
                          }
                        : {})}
                      deliveries={(issued.state === 'sent'
                        ? DELIVERY_WAYS
                        : DELIVERY_WAYS.slice(0, 1)
                      ).map((way) => ({ ...way, ...deliveries[way.id] }))}
                      onDeliver={(id, address) => {
                        if (id === 'print') {
                          setDeliveries((current) => ({
                            ...current,
                            print: { state: 'sent', stateText: 'Printed' },
                          }))
                          return
                        }
                        if (address === null || address === '') {
                          setDeliveries((current) => ({
                            ...current,
                            [id]: {
                              state: 'failed',
                              stateText:
                                id === 'email'
                                  ? 'Enter the customer’s e-mail.'
                                  : 'Enter the mobile number.',
                            },
                          }))
                          return
                        }
                        setDeliveries((current) => ({
                          ...current,
                          [id]: { state: 'sent', stateText: `Sent to ${address}` },
                        }))
                      }}
                    />
                  ),
                })}
            doneActions={
              <>
                <Button
                  family="document"
                  icon={Receipt}
                  label="Show receipt"
                  onClick={() => {
                    setPaying(false)
                    setDone(false)
                    setReprinted(false)
                    setReceiptOpen(true)
                  }}
                />
                <Button intent="create" emphasis="primary" label="New sale" onClick={newSale} />
              </>
            }
          />
        )}

        {/* The issued receipt as printed */}
        {issued !== null && (
          <Dialog
            open={receiptOpen}
            onOpenChange={setReceiptOpen}
            title={`Receipt ${issued.number}`}
            description="Printed on the register's printer; the customer can ask for it by e-mail."
            actions={
              <>
                {/* The answer beside the action, not a toast (P5.93 item 3). */}
                <SaveStatus state={reprinted ? 'saved' : 'idle'} savedText="Sent to the printer" />
                <Button
                  intent="print"
                  emphasis="secondary"
                  label="Print again"
                  onClick={() => {
                    setReprinted(true)
                  }}
                />
                <Button intent="create" emphasis="primary" label="New sale" onClick={newSale} />
              </>
            }
          >
            <EntryReceipt entry={issued} />
          </Dialog>
        )}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </div>
    </TillTouch>
  )
}

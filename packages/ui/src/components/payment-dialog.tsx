import {
  Banknote,
  ChevronDown,
  CircleCheck,
  CreditCard,
  QrCode,
  Split,
  Trash2,
  WalletCards,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ButtonPrimitive, LoadingButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as DialogRoot,
  DialogTrigger,
} from '../primitives/dialog'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button } from './button'
import { DialogHeading } from './dialog'
import { MoneyText } from './display-text'
import { NumericKeypad } from './numeric-keypad'
import {
  hasOwnOptions,
  paymentOptions,
  type PaymentKind,
  type PaymentMethod,
  type PaymentOption,
} from './sale-logic'
import { Spinner } from './spinner'
import { TextField } from './text-field'
import { usePhone } from './use-phone'

/*
 * PaymentDialog (BUILD-PLAN P5.10; docs/decisions.md "Touch and POS"). Taking the money for a
 * sale: cash, card or split. **The dialog never subtracts (D4):** the amount due, the change, the
 * remaining amount and the parts already paid arrive from the application as decimal strings;
 * the dialog reports what the cashier enters (`onTenderedChange`, `onAddPart`) and the
 * application answers with the new figures. Whether the payment can be completed is the
 * application's too (`completeDisabledReason`).
 *
 * - On top, the amount due (h2 size, tabular). Then the method as a segmented control.
 * - Cash: "Exact amount" and the application's quick amounts (banknotes) as 44px buttons, then a
 *   NumericKeypad for the amount tendered (without Enter: "Complete payment" in the footer is
 *   the one main action), then the change due and, while short, the remaining amount.
 * - Card: the terminal's state from the application — ready ("Send to card terminal"), waiting
 *   (a spinner, what the customer does, "Cancel card payment"; the dialog cannot be dismissed
 *   meanwhile), declined (a danger Alert with the terminal's reason and "Try again"), approved (a
 *   success Alert).
 * - Split: the parts paid so far and the remaining amount; the keypad for the next part, then
 *   "Add cash" or "Add card".
 * - Done: a check, "Payment complete", the change due large, and the application's actions
 *   (print the receipt, a new sale).
 * Footer: Cancel, then "Complete payment" (primary, last; D13).
 *
 * P5.28 (item 21b): the application may offer its **own ways to pay** (`methods` with
 * `PaymentOption`s: cash, card, cheque, wire transfer or deferred payment, voucher, instant
 * payment, other cashless — the ids, words and rules are its data). More than four become a
 * wrapping grid of pressed buttons (the neutral selection, never blue). **Several ways on one
 * sale:** with `onAddPart` each panel takes the amount of this payment and adds it; the parts
 * paid (with `onRemovePart`) and the remaining amount stand above the method, from the
 * application. A 'qr' way shows the application's code (`qrCode`) large for the customer with
 * the same states as a card (`cardState`). A way that cannot be used yet
 * (`unavailableReason`, e.g. a deferred payment without the buyer) shows its reason and the
 * application's `extra` content (the buyer's field). `doneContent` takes the issued receipt
 * (ReceiptResult) in the done view.
 *
 * P5.93 (item 13, the owner's fourth review): **the dialog never scrolls** — at a tablet
 * (1024 × 768) and a phone (390 × 844) everything fits at once: the amount due, the ways to pay,
 * the quick amounts, the amount tendered, the keypad and the main action. It is wider (880px,
 * at most 90% of the screen) and lays out in two columns — the amount due, the ways to pay, the
 * quick amounts and the change at the start, the keypad (or the card terminal) at the end; on a
 * phone one column with 48px keys. **Cash and Card are the two big choices** (56px); every
 * other way stands behind one "Other…" (a menu; one other way stands beside them by itself),
 * which then names the way chosen. The parts already paid are chips with their remove button,
 * the remaining amount beside the amount due. **Done:** the change due as the application gives
 * it (never rounded), on a plain row, and the focus on the done view's main action (the last of
 * `doneActions`, "New sale").
 */

export type { PaymentKind, PaymentMethod, PaymentOption }

/** The card terminal's (or an instant payment's) state, from the application. */
export type CardState = 'idle' | 'waiting' | 'declined' | 'approved'

/** A part of a split payment already taken. */
export interface PaymentPart {
  id: string
  /** How it was paid, in the application's words ("Card", "Cash"). */
  label: string
  /** A decimal string. */
  value: string
  /** A line under it: the card, the voucher's code, the cheque's number. */
  detail?: string
}

export interface PaymentDialogProps {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it (the cart's Charge button). */
  trigger?: ReactElement
  /** Default: `messages['payment.title']`. */
  title?: string
  /** The amount due, a decimal string. */
  total: string
  currency: string
  /**
   * The methods offered, in this order. Default: cash, card, split. The application's own ways to
   * pay (P5.28) are `PaymentOption`s; the built-in names may stand among them.
   */
  methods?: readonly (PaymentMethod | PaymentOption)[]
  /** Controlled method: a built-in name or an option's id. */
  method?: string
  /** Uncontrolled initial method. Default: the first of `methods`. */
  defaultMethod?: string
  onMethodChange?: (method: string) => void
  /** Controlled amount on the keypad (cash tendered, or the next split part); a decimal string. */
  tendered?: string | null
  /** Uncontrolled initial amount. */
  defaultTendered?: string | null
  onTenderedChange?: (value: string | null) => void
  /** Banknotes offered as buttons, decimal strings ("2000", "5000"). */
  quickAmounts?: readonly string[]
  /** The change due, from the application; null or absent while there is none. */
  change?: string | null
  /** What is still to pay, from the application (cash short, split). */
  remaining?: string | null
  /** The parts of a split payment already taken. */
  paid?: readonly PaymentPart[]
  /**
   * Split: the cashier adds the keypad's amount as a cash or card part. With the application's
   * own options (P5.28), the option's id, and every panel takes the amount of this payment.
   */
  onAddPart?: (method: string, amount: string) => void
  /** Adds a remove button to each part paid (an option's own ways, P5.28). */
  onRemovePart?: (id: string) => void
  /** A 'qr' way's code (an image), from the application; shown large while waiting. */
  qrCode?: ReactNode
  /** Controlled reference of a way that asks for one (`referenceLabel`). */
  reference?: string
  /** Uncontrolled initial reference. */
  defaultReference?: string
  onReferenceChange?: (value: string) => void
  /** The application's content under the method's panel: the buyer's field a way needs. */
  extra?: ReactNode
  /** The card terminal's state. Default 'idle'. */
  cardState?: CardState
  /** The terminal's words: the reason of a decline, the approval's detail. */
  cardMessage?: string
  /** Sends the amount to the terminal (also "Try again"). */
  onCardStart?: () => void
  /** Cancels the payment on the terminal while waiting. */
  onCardCancel?: () => void
  /** The main action. */
  onComplete?: () => void
  /** Default: `messages['payment.complete']`. */
  completeLabel?: string
  /** Why it cannot be completed yet, from the application; shown under the dialog's content. */
  completeDisabledReason?: string
  /** The application is completing it: the button works and the dialog stays. */
  completing?: boolean
  /** The payment is complete: the done view. */
  done?: boolean
  /** A line under "Payment complete", from the application ("Receipt 2026-000412"). */
  doneText?: string
  /** The done view's actions ("Print receipt", "New sale"), the main one last. */
  doneActions?: ReactNode
  /** Under "Payment complete": the issued receipt (ReceiptResult), from the application. */
  doneContent?: ReactNode
}

const METHOD_ICON = { cash: Banknote, card: CreditCard, split: Split } as const

/** The icon of a way to pay by its kind. */
const KIND_ICON: Record<PaymentKind, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  plain: WalletCards,
}

/** A big choice of the way to pay: the neutral selection when chosen (D17), 56px high. */
const CHOICE = cn(
  BUTTON_RESET,
  FOCUS_RING,
  'flex min-h-14 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-solid px-3 py-2 text-md font-semibold text-primary',
  'disabled:cursor-not-allowed disabled:text-disabled',
)
const CHOICE_ON = 'border-selected bg-surface-selected'
const CHOICE_OFF = 'border-default bg-surface-raised enabled:hover:bg-surface-hover'

/** The keypad's keys at 44px (the touch minimum) on a phone, so everything fits the screen. */
const PHONE_KEYPAD =
  '[&_[data-key]]:h-11 [&_[data-key]]:min-h-11 [&_div:has(>input)]:h-12 [&_input]:text-h4'

/** The focusable elements of the done view's actions; the last is its main action (D13). */
function lastAction(container: HTMLElement | null): HTMLElement | null {
  const all = container?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
  return all === undefined || all.length === 0 ? null : (all[all.length - 1] ?? null)
}

/** Taking the payment for a sale: cash, card or another way; every figure from the application. */
export function PaymentDialog(props: PaymentDialogProps) {
  const { messages, format } = useLiro()
  const phone = usePhone()
  const methods = props.methods ?? (['cash', 'card', 'split'] as const)
  const ownOptions = hasOwnOptions(methods)
  const options = paymentOptions(methods, {
    cash: messages['payment.cash'],
    card: messages['payment.card'],
    split: messages['payment.split'],
  })
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen ?? false)
  const open = props.open ?? innerOpen
  const [innerMethod, setInnerMethod] = useState<string>(
    props.defaultMethod ?? options[0]?.id ?? 'cash',
  )
  const method = props.method ?? innerMethod
  const option = options.find((each) => each.id === method)
  // The built-in names keep their P5.10 panels; the application's own options take their kind's.
  const kind: PaymentKind | 'split' = ownOptions
    ? (option?.kind ?? 'cash')
    : method === 'split'
      ? 'split'
      : method === 'card'
        ? 'card'
        : 'cash'
  const [innerTendered, setInnerTendered] = useState<string | null>(props.defaultTendered ?? null)
  const tendered = props.tendered === undefined ? innerTendered : props.tendered
  const [innerReference, setInnerReference] = useState(props.defaultReference ?? '')
  const reference = props.reference ?? innerReference
  const cardState = props.cardState ?? 'idle'
  const waiting = cardState === 'waiting'
  const completing = props.completing === true
  const done = props.done === true
  const locked = waiting || completing
  const reasonId = useId()
  const paid = props.paid ?? []
  const parts = props.onAddPart !== undefined
  const doneActions = useRef<HTMLDivElement>(null)

  // Done while open: the focus goes to the done view's main action ("New sale").
  useEffect(() => {
    if (!open || !done) return
    const frame = requestAnimationFrame(() => {
      lastAction(doneActions.current)?.focus()
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [open, done])

  const setOpen = (next: boolean) => {
    if (locked) return
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  const setTendered = (value: string | null) => {
    setInnerTendered(value)
    props.onTenderedChange?.(value)
  }
  const chooseMethod = (next: string) => {
    setInnerMethod(next)
    props.onMethodChange?.(next)
  }

  const money = (value: string) => format.money(value, props.currency)
  const iconOf = (item: PaymentOption) =>
    item.icon ??
    (ownOptions
      ? KIND_ICON[item.kind]
      : item.id === 'cash' || item.id === 'card' || item.id === 'split'
        ? METHOD_ICON[item.id]
        : KIND_ICON[item.kind])

  const amountRow = (label: string, value: string | null | undefined, large = false) =>
    value === undefined || value === null ? null : (
      <div className="flex items-baseline justify-between gap-4">
        <dt
          className={cn(
            large ? 'text-md font-semibold' : 'text-sm',
            'text-primary',
            TEXT_DIRECTION,
          )}
        >
          {label}
        </dt>
        <dd className="m-0">
          <MoneyText
            value={value}
            currency={props.currency}
            className={large ? 'text-h3 font-semibold' : 'text-md font-semibold'}
          />
        </dd>
      </div>
    )

  const keypad = (label: string) => (
    <NumericKeypad
      label={label}
      value={tendered}
      currency={props.currency}
      onChange={setTendered}
      className={cn('max-w-none', phone && PHONE_KEYPAD)}
    />
  )

  // "Exact amount" is the amount due, or what remains once parts are paid (no arithmetic here).
  const exact =
    paid.length > 0 && props.remaining !== undefined && props.remaining !== null
      ? props.remaining
      : props.total

  const quick = (
    <div
      role="group"
      aria-label={messages['payment.quickAmounts']}
      className={cn(
        'gap-2',
        // On a phone one row of equal buttons: the banknotes without the currency (said above).
        phone ? 'grid grid-cols-[repeat(auto-fit,minmax(3.75rem,1fr))]' : 'flex flex-wrap',
      )}
    >
      <ButtonPrimitive
        className="min-h-11 px-2"
        aria-pressed={tendered === exact}
        onClick={() => {
          setTendered(exact)
        }}
      >
        <span className={cn('text-center', TEXT_DIRECTION)}>{messages['payment.exact']}</span>
      </ButtonPrimitive>
      {props.quickAmounts?.map((amount) => (
        <ButtonPrimitive
          key={amount}
          className="min-h-11 px-2 tabular-nums"
          aria-pressed={tendered === amount}
          {...(phone ? { 'aria-label': money(amount) } : {})}
          onClick={() => {
            setTendered(amount)
          }}
        >
          <bdi>{phone ? format.number(amount) : money(amount)}</bdi>
        </ButtonPrimitive>
      ))}
    </div>
  )

  /** The card terminal's or the instant payment's state. */
  const terminal = (qr: boolean) => (
    <div data-slot={qr ? 'payment-code' : 'card-terminal'} className="flex flex-col gap-3">
      {cardState === 'idle' && props.onCardStart !== undefined && (
        <ButtonPrimitive
          family="primary"
          emphasis="secondary"
          className="min-h-14 w-full text-md"
          onClick={props.onCardStart}
        >
          {qr ? (
            <QrCode aria-hidden="true" className="size-4 shrink-0" />
          ) : (
            <CreditCard aria-hidden="true" className="size-4 shrink-0" />
          )}
          <span className={TEXT_DIRECTION}>
            {qr ? messages['payment.qrStart'] : messages['payment.cardStart']}
          </span>
        </ButtonPrimitive>
      )}
      {waiting && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-sunken px-4 py-5 text-center">
          {qr && props.qrCode !== undefined && props.qrCode !== null && (
            <figure
              aria-label={messages['payment.qrCode']}
              className="m-0 flex justify-center rounded-md border border-solid border-default bg-surface-raised p-3"
            >
              {props.qrCode}
            </figure>
          )}
          <Spinner size={qr ? 'md' : 'lg'}>
            <span className={cn('text-md font-semibold text-primary', TEXT_ISOLATE)}>
              {qr ? messages['payment.qrWaiting'] : messages['payment.cardWaiting']}
            </span>
          </Spinner>
          <p className={cn('m-0 text-sm text-secondary', TEXT_ISOLATE)}>
            {props.cardMessage ??
              (qr ? messages['payment.qrHint'] : messages['payment.cardWaitingHint'])}
          </p>
          {props.onCardCancel !== undefined && (
            <Button
              intent="cancel"
              label={qr ? messages['payment.qrCancel'] : messages['payment.cardCancel']}
              onClick={props.onCardCancel}
            />
          )}
        </div>
      )}
      {cardState === 'declined' && (
        <Alert
          tone="danger"
          title={qr ? messages['payment.qrDeclined'] : messages['payment.cardDeclined']}
        >
          {props.cardMessage !== undefined && (
            <p className={cn('m-0', TEXT_DIRECTION)}>{props.cardMessage}</p>
          )}
          {props.onCardStart !== undefined && (
            <ButtonPrimitive className="mt-3 min-h-11" onClick={props.onCardStart}>
              <span className={TEXT_DIRECTION}>{messages['payment.cardRetry']}</span>
            </ButtonPrimitive>
          )}
        </Alert>
      )}
      {cardState === 'approved' && (
        <Alert
          tone="success"
          title={qr ? messages['payment.qrApproved'] : messages['payment.cardApproved']}
        >
          {props.cardMessage}
        </Alert>
      )}
    </div>
  )

  // Cash and Card are the two big choices; every other way stands behind "Other…" (P5.93).
  const isMain = (item: PaymentOption, wanted: 'cash' | 'card') =>
    ownOptions ? item.kind === wanted : item.id === wanted
  const mainChoices = (['cash', 'card'] as const).flatMap((wanted) => {
    const found = options.find((item) => isMain(item, wanted))
    return found === undefined ? [] : [found]
  })
  const otherChoices = options.filter((item) => !mainChoices.includes(item))
  const chosenOther = otherChoices.find((item) => item.id === method)

  const choice = (item: PaymentOption) => {
    const Icon = iconOf(item)
    const pressed = item.id === method
    return (
      <button
        key={item.id}
        type="button"
        aria-pressed={pressed}
        disabled={locked}
        onClick={() => {
          chooseMethod(item.id)
        }}
        className={cn(
          CHOICE,
          pressed ? CHOICE_ON : CHOICE_OFF,
          item.unavailableReason !== undefined && !pressed && 'text-secondary',
        )}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <span className={cn('min-w-0 break-words', TEXT_ISOLATE)}>{item.label}</span>
      </button>
    )
  }

  const otherMenu = (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild disabled={locked}>
        <button
          type="button"
          data-slot="payment-other"
          className={cn(CHOICE, chosenOther === undefined ? CHOICE_OFF : CHOICE_ON)}
        >
          {chosenOther !== undefined &&
            (() => {
              const Icon = iconOf(chosenOther)
              return <Icon aria-hidden="true" className="size-5 shrink-0" />
            })()}
          <span className={cn('min-w-0 break-words', TEXT_ISOLATE)}>
            {chosenOther?.label ?? messages['payment.other']}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={method} onValueChange={chooseMethod}>
          {otherChoices.map((item) => {
            const Icon = iconOf(item)
            return (
              <DropdownMenuRadioItem key={item.id} value={item.id} check>
                <Icon aria-hidden="true" />
                {item.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </MenuRoot>
  )

  const chooserCount = mainChoices.length + (otherChoices.length > 0 ? 1 : 0)
  const chooser =
    options.length <= 1 ? null : (
      <div
        role="group"
        aria-label={messages['payment.method']}
        data-slot="payment-methods"
        className={cn('grid gap-2', chooserCount === 2 ? 'grid-cols-2' : 'grid-cols-3')}
      >
        {mainChoices.map(choice)}
        {otherChoices.length === 1 && otherChoices[0] !== undefined && choice(otherChoices[0])}
        {otherChoices.length > 1 && otherMenu}
      </div>
    )

  /** The parts paid so far, as chips with their remove button (several ways on one sale). */
  const paidParts = paid.length > 0 && (
    <div className="flex flex-col gap-1">
      <span className={cn('text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {messages['payment.paid']}
      </span>
      <ul aria-label={messages['payment.paid']} className="m-0 flex list-none flex-wrap gap-2 p-0">
        {paid.map((part) => (
          <li
            key={part.id}
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-md bg-surface-sunken ps-3 text-sm"
          >
            <span className="flex min-w-0 flex-col py-1">
              <span className={cn('font-medium text-primary', TEXT_DIRECTION)}>
                {part.label}{' '}
                <MoneyText value={part.value} currency={props.currency} className="font-semibold" />
              </span>
              {part.detail !== undefined && (
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{part.detail}</span>
              )}
            </span>
            {props.onRemovePart === undefined ? (
              <span className="pe-3" />
            ) : (
              <ButtonPrimitive
                family="neutral"
                emphasis="menu"
                shape="icon"
                aria-label={messages['payment.removePart'](part.label)}
                title={messages['payment.removePart'](part.label)}
                className="size-11 shrink-0 px-0"
                disabled={locked}
                onClick={() => {
                  props.onRemovePart?.(part.id)
                }}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </ButtonPrimitive>
            )}
          </li>
        ))}
      </ul>
    </div>
  )

  const addPart = parts && option !== undefined && (
    <ButtonPrimitive
      className="min-h-11 w-full"
      disabled={tendered === null || locked}
      onClick={() => {
        if (tendered !== null) props.onAddPart?.(option.id, tendered)
      }}
    >
      {(() => {
        const Icon = iconOf(option)
        return <Icon aria-hidden="true" className="size-4 shrink-0" />
      })()}
      <span className={TEXT_DIRECTION}>{messages['payment.addPart']}</span>
    </ButtonPrimitive>
  )

  const splitParts = !ownOptions && kind === 'split' && parts && (
    <div className="grid grid-cols-2 gap-2">
      {(['cash', 'card'] as const).map((part) => {
        const Icon = METHOD_ICON[part]
        return (
          <ButtonPrimitive
            key={part}
            className="min-h-11"
            disabled={tendered === null || locked}
            onClick={() => {
              if (tendered !== null) props.onAddPart?.(part, tendered)
            }}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className={TEXT_DIRECTION}>
              {part === 'cash' ? messages['payment.addCash'] : messages['payment.addCard']}
            </span>
          </ButtonPrimitive>
        )
      })}
    </div>
  )

  const referenceField = option?.referenceLabel !== undefined && (
    <TextField
      label={option.referenceLabel}
      direction="ltr"
      value={reference}
      onChange={(value) => {
        setInnerReference(value)
        props.onReferenceChange?.(value)
      }}
    />
  )

  const unavailableReason = ownOptions ? option?.unavailableReason : undefined
  const unavailable = unavailableReason !== undefined
  const cardLike = kind === 'card' || kind === 'qr'
  // The keypad is there whenever an amount is typed: cash, a split, or a part of the sale.
  const needsKeypad =
    !unavailable &&
    (kind === 'cash' ||
      kind === 'split' ||
      (parts && ownOptions && (kind === 'plain' || (cardLike && cardState === 'idle'))))
  const keypadPanel = needsKeypad && (
    <div className="flex flex-col gap-2">
      {keypad(kind === 'cash' && !parts ? messages['payment.tendered'] : messages['payment.part'])}
      {ownOptions ? addPart : splitParts}
    </div>
  )
  const terminalPanel = cardLike && !unavailable && terminal(kind === 'qr')

  /** What the chosen way shows beside the keypad: its amounts, its terminal, its reference. */
  const methodPanel = unavailable ? (
    <Alert tone="warning" title={unavailableReason} />
  ) : (
    <>
      {kind === 'cash' && quick}
      {kind === 'cash' && (
        <dl className="m-0 flex flex-col gap-1">
          {amountRow(messages['payment.change'], props.change, true)}
          {paid.length === 0 && amountRow(messages['payment.remaining'], props.remaining)}
        </dl>
      )}
      {kind === 'split' && cardState !== 'idle' && terminal(false)}
      {kind === 'plain' && referenceField}
      {needsKeypad && cardLike && terminalPanel}
      {kind !== 'cash' &&
        kind !== 'split' &&
        paid.length === 0 &&
        props.remaining !== undefined &&
        props.remaining !== null && (
          <dl className="m-0">{amountRow(messages['payment.remaining'], props.remaining)}</dl>
        )}
    </>
  )

  const notes = (
    <>
      {option?.note !== undefined && (
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{option.note}</p>
      )}
      {props.extra}
      {props.completeDisabledReason !== undefined && (
        <p id={reasonId} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {props.completeDisabledReason}
        </p>
      )}
    </>
  )

  const showRemaining =
    (paid.length > 0 || kind === 'split') &&
    props.remaining !== undefined &&
    props.remaining !== null
  /** The amount due, and beside it what remains once parts are paid. */
  const amounts = (
    <dl className="m-0 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <div className="flex min-w-0 flex-col">
        <dt className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{messages['payment.due']}</dt>
        <dd className="m-0">
          <MoneyText
            value={props.total}
            currency={props.currency}
            className="text-h2 font-semibold text-primary"
          />
        </dd>
      </div>
      {showRemaining && (
        <div className="flex min-w-0 flex-col items-end">
          <dt className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['payment.remaining']}
          </dt>
          <dd className="m-0">
            <MoneyText
              value={props.remaining ?? ''}
              currency={props.currency}
              className="text-h3 font-semibold text-primary"
            />
          </dd>
        </div>
      )}
    </dl>
  )

  const start = (
    <div className={cn('flex min-w-0 flex-col', phone ? 'gap-2' : 'gap-4')}>
      {amounts}
      {paidParts}
      {chooser}
      {methodPanel}
      {!phone && notes}
    </div>
  )
  const end = needsKeypad ? keypadPanel : cardLike ? terminalPanel : null

  const doneSummary = (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <CircleCheck aria-hidden="true" className="size-12 text-status-success-fg" />
      <p className={cn('m-0 text-h3 font-semibold text-primary', TEXT_ISOLATE)}>
        {messages['payment.done']}
      </p>
      {props.doneText !== undefined && (
        <p className={cn('m-0 text-sm text-secondary', TEXT_ISOLATE)}>{props.doneText}</p>
      )}
      {props.change !== undefined && props.change !== null && (
        // The change as the application gives it, exact (D4), on a plain row.
        <dl className="m-0 flex w-full max-w-md flex-wrap items-baseline justify-between gap-x-4 border-0 border-y border-solid border-subtle py-3 text-start">
          <dt className={cn('text-md font-semibold text-primary', TEXT_DIRECTION)}>
            {messages['payment.change']}
          </dt>
          <dd className="m-0">
            <MoneyText
              value={props.change}
              currency={props.currency}
              className="text-h2 font-semibold text-primary"
            />
          </dd>
        </dl>
      )}
    </div>
  )
  const body = done ? (
    // With the issued receipt on a wide screen: the summary at the start, the receipt at the
    // end, so it fits without scrolling.
    <div
      data-slot="payment-done"
      className={cn(
        'grid items-center gap-6',
        !phone && props.doneContent !== undefined
          ? 'grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
          : 'grid-cols-1',
      )}
    >
      {doneSummary}
      {props.doneContent !== undefined && (
        <div className="min-w-0 text-start">{props.doneContent}</div>
      )}
    </div>
  ) : phone ? (
    <div className="flex flex-col gap-2">
      {start}
      {end}
      {notes}
    </div>
  ) : (
    <div
      className={cn(
        'grid items-start gap-6',
        end === null || end === false ? 'grid-cols-1' : 'grid-cols-2',
      )}
    >
      {start}
      {end !== null && end !== false && <div className="flex min-w-0 flex-col gap-3">{end}</div>}
    </div>
  )

  const actions = done ? (
    <div ref={doneActions} className="contents">
      {props.doneActions}
    </div>
  ) : (
    <>
      <Button
        intent="cancel"
        label={messages['dialog.cancel']}
        disabled={locked}
        onClick={() => {
          setOpen(false)
        }}
      />
      {props.onComplete !== undefined && (
        <LoadingButtonPrimitive
          family="primary"
          emphasis="primary"
          loading={completing}
          waiting={props.completeDisabledReason !== undefined || waiting}
          aria-describedby={props.completeDisabledReason === undefined ? undefined : reasonId}
          className={cn(phone && 'min-h-11 flex-1')}
          onClick={props.onComplete}
        >
          <CircleCheck aria-hidden="true" className="size-3.75 shrink-0" />
          <span className={TEXT_DIRECTION}>
            {props.completeLabel ?? messages['payment.complete']}
          </span>
        </LoadingButtonPrimitive>
      )}
    </>
  )

  const prevent = (event: Event) => {
    if (locked) event.preventDefault()
  }

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      {props.trigger !== undefined && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent
        aria-describedby={undefined}
        data-slot="payment-dialog"
        // Wider, and nearer the top and bottom edges: everything fits at once (P5.93).
        className="top-[2%] max-h-[96%] w-220"
        onEscapeKeyDown={prevent}
        onPointerDownOutside={prevent}
        onInteractOutside={prevent}
        onOpenAutoFocus={(event) => {
          // Opened done (a restored screen): the focus on the done view's main action.
          if (!done) return
          const target = lastAction(doneActions.current)
          if (target === null) return
          event.preventDefault()
          target.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <DialogHeading title={props.title ?? messages['payment.title']} />
          </DialogTitle>
          {!locked && <DialogCloseButton label={messages['dialog.close']} />}
        </DialogHeader>
        <DialogBody>
          {body}
          <DialogFooter>{actions}</DialogFooter>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

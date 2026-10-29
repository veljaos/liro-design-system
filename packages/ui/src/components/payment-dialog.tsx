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
import { Accordion } from './accordion'
import { Alert } from './alert'
import { Button } from './button'
import { DialogHeading } from './dialog'
import { MoneyText } from './display-text'
import { FittedLabel } from './fitted-label'
import { NumericKeypad } from './numeric-keypad'
import { Tooltip } from './popover'
import {
  hasOwnOptions,
  partOverLimit,
  paymentOptions,
  stillToPay,
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
 * `doneActions`, "New sale"); the issued receipt (`doneContent`) beside it on a wide screen, and
 * behind "Receipt" on a phone.
 *
 * P5.94 (item 5, the owner's fifth review): **a sale is paid in parts by any ways, in any order**
 * (`onAddPart`): part cash, part card, part voucher. The parts paid stand in a list — the way, the
 * amount and its state ("Paid", or "Approved" for a card or an instant payment) — and the
 * remaining amount always beside the amount due. The keypad holds the amount of this part; cash
 * and the plain ways add it ("Add this payment"); a card (or an instant payment) takes one part
 * at a time: "Pay 500,00 RSD by card" sends it to the terminal (`onCardStart(amount)`), the
 * customer taps or inserts the card, and the application adds the approved part to `paid` and
 * lowers `remaining`; declined keeps the amount for "Try again" or another way. Only cash gives
 * change; a part of any other way is at most the remaining amount and the way's own `maxAmount`
 * (a voucher's value, `maxReason`), compared exactly (`partOverLimit`). "Complete payment" waits
 * while something is still to pay. Cancelling after an approved part says first, in the dialog,
 * that the approved parts are reversed ("Keep paying" / "Cancel payment"); the reversal is the
 * application's (`onCancel`). A way's label never breaks inside a word (item 4): the ways wrap as
 * whole buttons (on a phone the icon above the label) and a label too long for its button ends in
 * "…" with the whole name in the Tooltip.
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
  /**
   * 'approved': a card's or an instant payment's approval (reversed if the payment is cancelled,
   * by the application); 'paid' (default): cash or a plain way.
   */
  state?: 'paid' | 'approved'
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
  /**
   * Sends the amount to the terminal (also "Try again"): the keypad's amount, or the remaining
   * amount when none is typed (P5.94).
   */
  onCardStart?: (amount: string | null) => void
  /** Cancels the payment on the terminal while waiting. */
  onCardCancel?: () => void
  /** The main action. */
  onComplete?: () => void
  /**
   * The cashier cancels the payment (Cancel, the X or Escape); after an approved part only once
   * the dialog has said that the approved parts are reversed (P5.94). The reversal is the
   * application's.
   */
  onCancel?: () => void
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

/**
 * A big choice of the way to pay: the neutral selection when chosen (D17), 56px high. Sized by its
 * label and growing to fill the row, so the ways wrap as whole buttons; a label wider than a whole
 * row ends in "…" (FittedLabel), never broken inside a word (P5.94 item 4).
 */
const CHOICE = cn(
  BUTTON_RESET,
  FOCUS_RING,
  'flex min-h-14 min-w-0 flex-[1_1_auto] cursor-pointer items-center justify-center gap-2 rounded-md border border-solid px-3 py-2 text-md font-semibold text-primary',
  'disabled:cursor-not-allowed disabled:text-disabled',
)
/** On a phone a little tighter, so three ways fit one row. */
const CHOICE_PHONE = 'gap-1.5 px-2'
const CHOICE_ON = 'border-selected bg-surface-selected'
const CHOICE_OFF = 'border-default bg-surface-raised enabled:hover:bg-surface-hover'

/**
 * The keypad's keys at 44px (the touch minimum) on a phone, so everything fits the screen; no
 * Clear row there (P5.94): Backspace stays, and "Exact amount" and the quick amounts replace the
 * amount in one press.
 */
const PHONE_KEYPAD =
  '[&_[data-key]]:h-11 [&_[data-key]]:min-h-11 [&_div:has(>input)]:h-12 [&_input]:text-h4 [&_[data-key=clear]]:hidden'

/** The focusable elements of the done view's actions; the last is its main action (D13). */
function lastAction(container: HTMLElement | null): HTMLElement | null {
  const all = container?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
  return all === undefined || all.length === 0 ? null : (all[all.length - 1] ?? null)
}

/** Taking the payment for a sale: cash, card or another way; every figure from the application. */
export function PaymentDialog(props: PaymentDialogProps) {
  const { messages, format } = useLiro()
  const phone = usePhone()
  // With parts every way can pay a part, so no "Split" way is needed (P5.94).
  const methods =
    props.methods ??
    (props.onAddPart === undefined
      ? (['cash', 'card', 'split'] as const)
      : (['cash', 'card'] as const))
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
  const limitId = useId()
  const paid = props.paid ?? []
  const parts = props.onAddPart !== undefined
  const doneActions = useRef<HTMLDivElement>(null)
  // The parts a card or an instant payment approved: cancelling reverses them (P5.94).
  const approved = paid.filter((part) => part.state === 'approved')
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const keepPaying = useRef<HTMLDivElement>(null)
  // The question about reversing takes the focus on "Keep paying", the safe answer.
  useEffect(() => {
    if (confirmingCancel) keepPaying.current?.querySelector('button')?.focus()
  }, [confirmingCancel])

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

  const close = () => {
    setConfirmingCancel(false)
    setInnerOpen(false)
    props.onOpenChange?.(false)
  }
  const setOpen = (next: boolean) => {
    if (locked) return
    if (next) {
      setInnerOpen(true)
      props.onOpenChange?.(true)
      return
    }
    if (done) {
      close()
      return
    }
    // Escape or the X on the question about reversing keeps the payment going: only "Cancel
    // payment" cancels it.
    if (confirmingCancel) {
      setConfirmingCancel(false)
      return
    }
    // After an approved card part the dialog first says that it is reversed (P5.94).
    if (approved.length > 0) {
      setConfirmingCancel(true)
      return
    }
    props.onCancel?.()
    close()
  }
  const cancelPayment = () => {
    props.onCancel?.()
    close()
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
      {cardState === 'idle' && props.onCardStart !== undefined && !parts && (
        <ButtonPrimitive
          family="primary"
          emphasis="secondary"
          className="min-h-14 w-full text-md"
          onClick={() => {
            props.onCardStart?.(cardAmount)
          }}
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
          {parts && <p className={cn('m-0', TEXT_DIRECTION)}>{messages['payment.declinedHint']}</p>}
          {props.onCardStart !== undefined && (
            <ButtonPrimitive
              className="mt-3 min-h-11"
              disabled={over !== null}
              onClick={() => {
                props.onCardStart?.(cardAmount)
              }}
            >
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
          phone && CHOICE_PHONE,
          pressed ? CHOICE_ON : CHOICE_OFF,
          item.unavailableReason !== undefined && !pressed && 'text-secondary',
        )}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <FittedLabel text={item.label} className="max-w-full" />
      </button>
    )
  }

  const otherMenu = (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild disabled={locked}>
        <button
          type="button"
          data-slot="payment-other"
          className={cn(
            CHOICE,
            phone && CHOICE_PHONE,
            chosenOther === undefined ? CHOICE_OFF : CHOICE_ON,
          )}
        >
          {chosenOther !== undefined &&
            (() => {
              const Icon = iconOf(chosenOther)
              return <Icon aria-hidden="true" className="size-5 shrink-0" />
            })()}
          <span className="flex max-w-full min-w-0 items-center gap-1">
            <FittedLabel text={chosenOther?.label ?? messages['payment.other']} />
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </span>
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

  const chooser =
    options.length <= 1 ? null : (
      <div
        role="group"
        aria-label={messages['payment.method']}
        data-slot="payment-methods"
        className="flex flex-wrap gap-2"
      >
        {mainChoices.map(choice)}
        {otherChoices.length === 1 && otherChoices[0] !== undefined && choice(otherChoices[0])}
        {otherChoices.length > 1 && otherMenu}
      </div>
    )

  /**
   * The parts paid so far (several ways on one sale): the way, its amount and its state, and a
   * remove button for a part that is not an approval (P5.94).
   */
  const paidParts = paid.length > 0 && (
    <div className="flex flex-col gap-1">
      {!phone && (
        <span className={cn('text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
          {messages['payment.paid']}
        </span>
      )}
      <ul
        aria-label={messages['payment.paid']}
        data-slot="payment-parts"
        className={cn(
          'm-0 flex list-none gap-1 p-0',
          // On a phone the parts are chips, two to a row, so the dialog still fits (P5.93).
          phone ? 'flex-row flex-wrap gap-2' : 'flex-col',
        )}
      >
        {paid.map((part) => {
          const isApproved = part.state === 'approved'
          const state = isApproved ? messages['payment.partApproved'] : messages['payment.partPaid']
          if (phone) {
            // One line on a phone: the way, the amount and, for an approval, a check; the
            // detail (the card, the voucher's code) in the tooltip and for assistive technology.
            const chip = (
              <span className="flex min-w-0 items-center gap-1.5 py-1">
                {isApproved && (
                  <CircleCheck
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-status-success-fg"
                  />
                )}
                <span className={cn('font-medium whitespace-nowrap text-primary', TEXT_DIRECTION)}>
                  {part.label}{' '}
                  <MoneyText
                    value={part.value}
                    currency={props.currency}
                    className="font-semibold"
                  />
                </span>
                <span className="sr-only">
                  {[state, part.detail].filter((each) => each !== undefined).join(', ')}
                </span>
              </span>
            )
            return (
              <li
                key={part.id}
                className="flex min-h-11 min-w-0 items-center gap-1 rounded-md bg-surface-sunken ps-3 text-sm"
              >
                {part.detail === undefined ? chip : <Tooltip label={part.detail}>{chip}</Tooltip>}
                {props.onRemovePart === undefined || isApproved ? (
                  <span className="pe-2" />
                ) : (
                  <Tooltip label={messages['payment.removePart'](part.label)}>
                    <ButtonPrimitive
                      family="neutral"
                      emphasis="menu"
                      shape="icon"
                      aria-label={messages['payment.removePart'](part.label)}
                      className="size-11 shrink-0 px-0"
                      disabled={locked}
                      onClick={() => {
                        props.onRemovePart?.(part.id)
                      }}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </ButtonPrimitive>
                  </Tooltip>
                )}
              </li>
            )
          }
          return (
            <li
              key={part.id}
              className="flex min-h-11 min-w-0 items-center gap-3 rounded-md bg-surface-sunken ps-3 text-sm"
            >
              <span className="flex min-w-0 flex-1 flex-col py-1">
                <span className={cn('font-medium text-primary', TEXT_DIRECTION)}>{part.label}</span>
                {part.detail !== undefined && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {part.detail}
                  </span>
                )}
              </span>
              <MoneyText value={part.value} currency={props.currency} className="font-semibold" />
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 text-xs',
                  isApproved ? 'text-status-success-fg' : 'text-secondary',
                  TEXT_DIRECTION,
                )}
              >
                {isApproved && <CircleCheck aria-hidden="true" className="size-3.5 shrink-0" />}
                {state}
              </span>
              {props.onRemovePart === undefined || isApproved ? (
                <span className="pe-1" />
              ) : (
                <Tooltip label={messages['payment.removePart'](part.label)}>
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="menu"
                    shape="icon"
                    aria-label={messages['payment.removePart'](part.label)}
                    className="size-11 shrink-0 px-0"
                    disabled={locked}
                    onClick={() => {
                      props.onRemovePart?.(part.id)
                    }}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </ButtonPrimitive>
                </Tooltip>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )

  // The amount of this part: the keypad's, or for a card what remains (P5.94).
  const cardLikeNow = kind === 'card' || kind === 'qr'
  const partAmount = tendered ?? (cardLikeNow ? (props.remaining ?? null) : null)
  const over = option === undefined ? null : partOverLimit(option, partAmount, props.remaining)
  const overReason =
    over === null
      ? undefined
      : over.reason === 'remaining'
        ? messages['payment.overRemaining'](money(over.limit))
        : (over.words ?? messages['payment.overLimit'](money(over.limit)))
  const cardAmount = parts ? partAmount : props.total
  /** The part's action: cash and the plain ways add it; a card or a code sends it (P5.94). */
  const addPart = parts && option !== undefined && (
    <div className="flex flex-col gap-1">
      <ButtonPrimitive
        family={cardLikeNow ? 'primary' : 'neutral'}
        emphasis="secondary"
        className={cn('w-full', phone ? 'min-h-11' : 'min-h-12 text-md')}
        disabled={partAmount === null || locked}
        aria-disabled={over === null ? undefined : true}
        aria-describedby={over === null ? undefined : limitId}
        onClick={() => {
          if (partAmount === null || over !== null) return
          if (cardLikeNow) props.onCardStart?.(partAmount)
          else props.onAddPart?.(option.id, partAmount)
        }}
      >
        {(() => {
          const Icon = iconOf(option)
          return <Icon aria-hidden="true" className="size-4 shrink-0" />
        })()}
        <span className={TEXT_DIRECTION}>
          {kind === 'card' && partAmount !== null
            ? messages['payment.payByCard'](money(partAmount))
            : kind === 'qr' && partAmount !== null
              ? messages['payment.payByCode'](money(partAmount))
              : messages['payment.addPart']}
        </span>
      </ButtonPrimitive>
      {overReason !== undefined && (
        <p id={limitId} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {overReason}
        </p>
      )}
    </div>
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
      (parts &&
        (kind === 'plain' ||
          (cardLike &&
            (cardState === 'idle' ||
              cardState === 'declined' ||
              // After an approved part, the next part while something is still to pay.
              (cardState === 'approved' && stillToPay(props.remaining)))))))
  const keypadPanel = needsKeypad && (
    <div className="flex flex-col gap-2">
      {keypad(kind === 'cash' && !parts ? messages['payment.tendered'] : messages['payment.part'])}
      {kind === 'split' ? splitParts : addPart}
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

  // "Complete payment" waits while something is still to pay after a part (P5.94). The remaining
  // amount stands at the top, so this reason is for assistive technology only; the
  // application's own reason is shown.
  const stillToPayReason =
    props.completeDisabledReason === undefined &&
    parts &&
    paid.length > 0 &&
    stillToPay(props.remaining)
      ? messages['payment.stillToPay'](money(props.remaining ?? '0'))
      : undefined
  const completeReason = props.completeDisabledReason ?? stillToPayReason
  const notes = (
    <>
      {option?.note !== undefined && (
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{option.note}</p>
      )}
      {props.extra}
      {completeReason !== undefined && (
        <p
          id={reasonId}
          className={cn(
            'm-0 text-xs text-secondary',
            TEXT_DIRECTION,
            stillToPayReason !== undefined && 'sr-only',
          )}
        >
          {completeReason}
        </p>
      )}
    </>
  )

  const showRemaining =
    (paid.length > 0 || kind === 'split' || parts) &&
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
      {props.doneContent !== undefined &&
        (phone ? (
          // On a phone the receipt opens on request, so the change due and "New sale" stay in
          // view without scrolling (simplicity first).
          <Accordion
            headingLevel={3}
            className="text-start"
            items={[
              {
                value: 'receipt',
                title: messages['payment.doneDetails'],
                content: props.doneContent,
              },
            ]}
          />
        ) : (
          <div className="min-w-0 text-start">{props.doneContent}</div>
        ))}
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

  // Cancelling after an approved part: the dialog says that it is reversed, in place (P5.94).
  const reverseQuestion = confirmingCancel && (
    <div data-slot="payment-reverse" className="flex flex-col gap-3">
      <Alert
        tone="warning"
        title={messages['payment.reverseWarning'](
          approved.map((part) => `${part.label} ${money(part.value)}`).join(', '),
        )}
      />
    </div>
  )
  const actions = done ? (
    <div ref={doneActions} className="contents">
      {props.doneActions}
    </div>
  ) : confirmingCancel ? (
    <>
      <div ref={keepPaying} className="contents">
        <Button
          family="neutral"
          icon={CircleCheck}
          label={messages['payment.keepPaying']}
          onClick={() => {
            setConfirmingCancel(false)
          }}
        />
      </div>
      <Button
        intent="delete"
        emphasis="primary"
        label={messages['payment.cancelPayment']}
        onClick={cancelPayment}
      />
    </>
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
          waiting={completeReason !== undefined || waiting}
          aria-describedby={completeReason === undefined ? undefined : reasonId}
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
          {reverseQuestion}
          <DialogFooter>{actions}</DialogFooter>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

import { Banknote, CircleCheck, CreditCard, QrCode, Trash2, WalletCards } from 'lucide-react'
import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { ButtonPrimitive, LoadingButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button } from './button'
import { Dialog } from './dialog'
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
import { Tooltip } from './popover'

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

const METHOD_ICON = { cash: Banknote, card: CreditCard, split: null } as const

/** The icon of a way to pay by its kind. */
const KIND_ICON: Record<PaymentKind, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  plain: WalletCards,
}

/** Up to this many ways stand in one segmented row; more wrap as a grid of pressed buttons. */
const SEGMENTED_MAX = 4

/** Taking the payment for a sale: cash, card or split; every figure from the application. */
export function PaymentDialog(props: PaymentDialogProps) {
  const { messages, format } = useLiro()
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
      className="max-w-none"
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
      className="flex flex-wrap gap-2"
    >
      <ButtonPrimitive
        className="min-h-11"
        aria-pressed={tendered === exact}
        onClick={() => {
          setTendered(exact)
        }}
      >
        <span className={TEXT_DIRECTION}>{messages['payment.exact']}</span>
      </ButtonPrimitive>
      {props.quickAmounts?.map((amount) => (
        <ButtonPrimitive
          key={amount}
          className="min-h-11 tabular-nums"
          aria-pressed={tendered === amount}
          onClick={() => {
            setTendered(amount)
          }}
        >
          <bdi>{money(amount)}</bdi>
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
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-sunken px-4 py-6 text-center">
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

  /** The ways to pay: a segmented row, or a wrapping grid of pressed buttons when many. */
  const chooser =
    options.length <= 1 ? null : options.length <= SEGMENTED_MAX ? (
      <ToggleGroup
        type="single"
        aria-label={messages['payment.method']}
        value={method}
        disabled={locked}
        onValueChange={(value) => {
          const next = options.find((item) => item.id === value)
          if (next !== undefined) chooseMethod(next.id)
        }}
        className="w-full"
      >
        {options.map((item) => {
          const Icon =
            item.icon ??
            (ownOptions
              ? KIND_ICON[item.kind]
              : item.id === 'cash' || item.id === 'card'
                ? METHOD_ICON[item.id]
                : null)
          return (
            <ToggleGroupItem key={item.id} value={item.id} className="min-h-10">
              <span className="inline-flex items-center justify-center gap-2">
                {Icon !== null && <Icon aria-hidden="true" className="size-4 shrink-0" />}
                {item.label}
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    ) : (
      <div
        role="group"
        aria-label={messages['payment.method']}
        data-slot="payment-methods"
        className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2"
      >
        {options.map((item) => {
          const Icon = item.icon ?? KIND_ICON[item.kind]
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
                BUTTON_RESET,
                FOCUS_RING,
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-solid px-3 py-2 text-start text-sm font-medium text-primary',
                pressed
                  ? 'border-selected bg-surface-selected'
                  : 'border-default bg-surface-raised enabled:hover:bg-surface-hover',
                'disabled:cursor-not-allowed disabled:text-disabled',
                item.unavailableReason !== undefined && !pressed && 'text-secondary',
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className={cn('min-w-0 break-words', TEXT_ISOLATE)}>{item.label}</span>
            </button>
          )
        })}
      </div>
    )

  /** The parts paid so far and what remains (several ways on one sale). */
  const paidSummary = (
    <dl className="m-0 flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
      {paid.length > 0 && (
        <div className="flex flex-col gap-1">
          <dt className={cn('text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
            {messages['payment.paid']}
          </dt>
          {paid.map((part) => (
            <dd key={part.id} className="m-0 flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 flex-col">
                <span className={TEXT_DIRECTION}>{part.label}</span>
                {part.detail !== undefined && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {part.detail}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <MoneyText value={part.value} currency={props.currency} />
                {props.onRemovePart !== undefined && (
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
              </span>
            </dd>
          ))}
        </div>
      )}
      {amountRow(messages['payment.remaining'], props.remaining, true)}
    </dl>
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
        const Icon = option.icon ?? KIND_ICON[option.kind]
        return <Icon aria-hidden="true" className="size-4 shrink-0" />
      })()}
      <span className={TEXT_DIRECTION}>{messages['payment.addPart']}</span>
    </ButtonPrimitive>
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

  /** The panel of the application's own way to pay (P5.28). */
  const ownPanel =
    option === undefined ? null : option.unavailableReason !== undefined ? (
      <Alert tone="warning" title={option.unavailableReason} />
    ) : (
      <>
        {kind === 'cash' && (
          <>
            {quick}
            {keypad(messages['payment.tendered'])}
            {addPart}
            <dl className="m-0 flex flex-col gap-1">
              {amountRow(messages['payment.change'], props.change, true)}
              {paid.length === 0 && amountRow(messages['payment.remaining'], props.remaining)}
            </dl>
          </>
        )}
        {(kind === 'card' || kind === 'qr') && (
          <>
            {parts && cardState === 'idle' && keypad(messages['payment.part'])}
            {terminal(kind === 'qr')}
          </>
        )}
        {kind === 'plain' && (
          <>
            {parts && keypad(messages['payment.part'])}
            {referenceField}
            {addPart}
          </>
        )}
        {kind !== 'cash' && paid.length === 0 && props.remaining !== undefined && (
          <dl className="m-0">{amountRow(messages['payment.remaining'], props.remaining)}</dl>
        )}
      </>
    )

  const body = done ? (
    <div data-slot="payment-done" className="flex flex-col items-center gap-3 py-4 text-center">
      <CircleCheck aria-hidden="true" className="size-12 text-status-success-fg" />
      <p className={cn('m-0 text-h3 font-semibold text-primary', TEXT_ISOLATE)}>
        {messages['payment.done']}
      </p>
      {props.doneText !== undefined && (
        <p className={cn('m-0 text-sm text-secondary', TEXT_ISOLATE)}>{props.doneText}</p>
      )}
      {props.change !== undefined && props.change !== null && (
        <dl className="m-0 flex w-full flex-col gap-1 rounded-lg bg-surface-sunken p-4 text-start">
          {amountRow(messages['payment.change'], props.change, true)}
        </dl>
      )}
      {props.doneContent !== undefined && (
        <div className="w-full text-start">{props.doneContent}</div>
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <dl className="m-0">
        <div className="flex items-baseline justify-between gap-4">
          <dt className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['payment.due']}
          </dt>
          <dd className="m-0">
            <MoneyText
              value={props.total}
              currency={props.currency}
              className="text-h2 font-semibold text-primary"
            />
          </dd>
        </div>
      </dl>
      {ownOptions && paid.length > 0 && paidSummary}
      {chooser}
      {ownOptions ? (
        ownPanel
      ) : (
        <>
          {kind === 'cash' && (
            <>
              {quick}
              {keypad(messages['payment.tendered'])}
              <dl className="m-0 flex flex-col gap-1">
                {amountRow(messages['payment.change'], props.change, true)}
                {amountRow(messages['payment.remaining'], props.remaining)}
              </dl>
            </>
          )}
          {kind === 'card' && terminal(false)}
          {kind === 'split' && (
            <>
              {paidSummary}
              {cardState !== 'idle' && terminal(false)}
              {keypad(messages['payment.part'])}
              {props.onAddPart !== undefined && (
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
                          {part === 'cash'
                            ? messages['payment.addCash']
                            : messages['payment.addCard']}
                        </span>
                      </ButtonPrimitive>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
      {option?.note !== undefined && (
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{option.note}</p>
      )}
      {props.extra}
      {props.completeDisabledReason !== undefined && (
        <p id={reasonId} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {props.completeDisabledReason}
        </p>
      )}
    </div>
  )

  const actions = done ? (
    props.doneActions
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

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={props.title ?? messages['payment.title']}
      dismissible={!locked}
      actions={actions}
      {...(props.trigger === undefined ? {} : { trigger: props.trigger })}
    >
      {body}
    </Dialog>
  )
}

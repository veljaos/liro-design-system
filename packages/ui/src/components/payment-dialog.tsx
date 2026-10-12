import { Banknote, CircleCheck, CreditCard } from 'lucide-react'
import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { ButtonPrimitive, LoadingButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button } from './button'
import { Dialog } from './dialog'
import { MoneyText } from './display-text'
import { NumericKeypad } from './numeric-keypad'
import { Spinner } from './spinner'

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
 */

export type PaymentMethod = 'cash' | 'card' | 'split'

/** The card terminal's state, from the application. */
export type CardState = 'idle' | 'waiting' | 'declined' | 'approved'

/** A part of a split payment already taken. */
export interface PaymentPart {
  id: string
  /** How it was paid, in the application's words ("Card", "Cash"). */
  label: string
  /** A decimal string. */
  value: string
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
  /** The methods offered, in this order. Default: cash, card, split. */
  methods?: readonly PaymentMethod[]
  /** Controlled method. */
  method?: PaymentMethod
  /** Uncontrolled initial method. Default: the first of `methods`. */
  defaultMethod?: PaymentMethod
  onMethodChange?: (method: PaymentMethod) => void
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
  /** Split: the cashier adds the keypad's amount as a cash or card part. */
  onAddPart?: (method: 'cash' | 'card', amount: string) => void
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
}

const METHOD_ICON = { cash: Banknote, card: CreditCard, split: null } as const

/** Taking the payment for a sale: cash, card or split; every figure from the application. */
export function PaymentDialog(props: PaymentDialogProps) {
  const { messages, format } = useLiro()
  const methods = props.methods ?? (['cash', 'card', 'split'] as const)
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen ?? false)
  const open = props.open ?? innerOpen
  const [innerMethod, setInnerMethod] = useState<PaymentMethod>(
    props.defaultMethod ?? methods[0] ?? 'cash',
  )
  const method = props.method ?? innerMethod
  const [innerTendered, setInnerTendered] = useState<string | null>(props.defaultTendered ?? null)
  const tendered = props.tendered === undefined ? innerTendered : props.tendered
  const cardState = props.cardState ?? 'idle'
  const waiting = cardState === 'waiting'
  const completing = props.completing === true
  const done = props.done === true
  const locked = waiting || completing
  const reasonId = useId()

  const setOpen = (next: boolean) => {
    if (locked) return
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  const setTendered = (value: string | null) => {
    setInnerTendered(value)
    props.onTenderedChange?.(value)
  }
  const chooseMethod = (next: PaymentMethod) => {
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

  const quick = (
    <div
      role="group"
      aria-label={messages['payment.quickAmounts']}
      className="flex flex-wrap gap-2"
    >
      <ButtonPrimitive
        className="min-h-11"
        aria-pressed={tendered === props.total}
        onClick={() => {
          setTendered(props.total)
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

  const card = (
    <div data-slot="card-terminal" className="flex flex-col gap-3">
      {cardState === 'idle' && props.onCardStart !== undefined && (
        <ButtonPrimitive
          family="primary"
          emphasis="secondary"
          className="min-h-14 w-full text-md"
          onClick={props.onCardStart}
        >
          <CreditCard aria-hidden="true" className="size-4 shrink-0" />
          <span className={TEXT_DIRECTION}>{messages['payment.cardStart']}</span>
        </ButtonPrimitive>
      )}
      {waiting && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-sunken px-4 py-6 text-center">
          <Spinner size="lg">
            <span className="text-md font-semibold text-primary">
              {messages['payment.cardWaiting']}
            </span>
          </Spinner>
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {props.cardMessage ?? messages['payment.cardWaitingHint']}
          </p>
          {props.onCardCancel !== undefined && (
            <Button
              intent="cancel"
              label={messages['payment.cardCancel']}
              onClick={props.onCardCancel}
            />
          )}
        </div>
      )}
      {cardState === 'declined' && (
        <Alert tone="danger" title={messages['payment.cardDeclined']}>
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
        <Alert tone="success" title={messages['payment.cardApproved']}>
          {props.cardMessage}
        </Alert>
      )}
    </div>
  )

  const body = done ? (
    <div data-slot="payment-done" className="flex flex-col items-center gap-3 py-4 text-center">
      <CircleCheck aria-hidden="true" className="size-12 text-status-success-fg" />
      <p className={cn('m-0 text-h3 font-semibold text-primary', TEXT_DIRECTION)}>
        {messages['payment.done']}
      </p>
      {props.doneText !== undefined && (
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.doneText}</p>
      )}
      {props.change !== undefined && props.change !== null && (
        <dl className="m-0 flex w-full flex-col gap-1 rounded-lg bg-surface-sunken p-4">
          {amountRow(messages['payment.change'], props.change, true)}
        </dl>
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
      {methods.length > 1 && (
        <ToggleGroup
          type="single"
          aria-label={messages['payment.method']}
          value={method}
          disabled={locked}
          onValueChange={(value) => {
            const next = methods.find((item) => item === value)
            if (next !== undefined) chooseMethod(next)
          }}
          className="w-full"
        >
          {methods.map((item) => {
            const Icon = METHOD_ICON[item]
            return (
              <ToggleGroupItem key={item} value={item} className="min-h-10">
                <span className="inline-flex items-center justify-center gap-2">
                  {Icon !== null && <Icon aria-hidden="true" className="size-4 shrink-0" />}
                  {messages[`payment.${item}`]}
                </span>
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      )}
      {method === 'cash' && (
        <>
          {quick}
          {keypad(messages['payment.tendered'])}
          <dl className="m-0 flex flex-col gap-1">
            {amountRow(messages['payment.change'], props.change, true)}
            {amountRow(messages['payment.remaining'], props.remaining)}
          </dl>
        </>
      )}
      {method === 'card' && card}
      {method === 'split' && (
        <>
          <dl className="m-0 flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            {props.paid !== undefined && props.paid.length > 0 && (
              <div className="flex flex-col gap-1">
                <dt className={cn('text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
                  {messages['payment.paid']}
                </dt>
                {props.paid.map((part) => (
                  <dd
                    key={part.id}
                    className="m-0 flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className={TEXT_DIRECTION}>{part.label}</span>
                    <MoneyText value={part.value} currency={props.currency} />
                  </dd>
                ))}
              </div>
            )}
            {amountRow(messages['payment.remaining'], props.remaining, true)}
          </dl>
          {cardState !== 'idle' && card}
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
                      {part === 'cash' ? messages['payment.addCash'] : messages['payment.addCard']}
                    </span>
                  </ButtonPrimitive>
                )
              })}
            </div>
          )}
        </>
      )}
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

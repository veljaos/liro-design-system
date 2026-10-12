import { ShoppingCart, Trash2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { MoneyText, NumberText } from './display-text'
import { EmptyState } from './empty-state'
import { QuantityStepper } from './quantity-stepper'
import { SettlingValue } from './settling-value'

/*
 * CartPanel (BUILD-PLAN P5.10; docs/decisions.md "Touch and POS"). What is being sold, for a
 * till: the lines, the discounts and totals, and the one main action, "Charge 1.234,00 RSD", last
 * and full width at the bottom (D13), within the thumb's reach. **It computes nothing (D4):**
 * every quantity, unit price, line total, discount and total arrives from the application as a
 * decimal string; a change of quantity is reported (`onQuantityChange`) and the application sends
 * the new totals, which settle in place (SettlingValue, `pending`) instead of jumping.
 *
 * A line: the name (semibold, wrapping) with its total at the end; the detail and the line's
 * discount in the application's words; then a QuantityStepper (44px targets, named "Quantity,
 * <name>"), the unit price ("25,00 RSD each") and a 44px remove button ("Remove <name>").
 * The list scrolls; the header (title and count) and the footer (totals and actions) stay.
 */

export interface CartLine {
  id: string
  name: string
  /** A line under the name: size, code, options ("60 g · sesame"). */
  detail?: string
  /** A decimal string. */
  quantity: string
  /** The unit after the quantity ("pc", "kg"). */
  unit?: string
  /** A decimal string. */
  unitPrice: string
  /** The line's total, a decimal string, from the application. */
  total: string
  /** The line's discount in the application's words ("Discount 10%: −15,00"). */
  discount?: string
  /** The stepper's step, a decimal string; default "1". */
  step?: string
  /** The least quantity; default the stepper's own (none). */
  min?: string
  /** The largest quantity (what is in stock). */
  max?: string
}

/** A row above the total: a subtotal, a discount, tax included; signed as the application sends. */
export interface CartAmount {
  id: string
  label: string
  /** A decimal string (a discount is negative). */
  value: string
}

export interface CartPanelProps {
  lines: readonly CartLine[]
  /** The currency of every amount, from the application. */
  currency: string
  /** The amount to charge, a decimal string from the application; null while there is none. */
  total: string | null
  /** Rows above the total: subtotal, discounts, tax included. */
  totals?: readonly CartAmount[]
  /** The application is computing new totals: the shown ones stay until they settle. */
  pending?: boolean
  /** A quantity was changed; without it the quantities are text. */
  onQuantityChange?: (id: string, quantity: string | null) => void
  /** Adds a remove button to each line. */
  onRemove?: (id: string) => void
  /** The main action. Shown while there are lines. */
  onCharge?: () => void
  /** Default: `messages['cart.charge']` with the total ("Charge 1.234,00 RSD"). */
  chargeLabel?: string
  /** The charge cannot be done now: why, shown under the button (it stays focusable). */
  chargeDisabledReason?: string
  /** Buttons before the main action ("Park sale", "Discount"), from the application. */
  actions?: ReactNode
  /** Buttons in the header at the end ("Customer", "Clear"), from the application. */
  headerActions?: ReactNode
  /** Default: `messages['cart.title']`. */
  title?: string
  /** Default: `messages['cart.empty']`. */
  emptyTitle?: string
  /** Default: `messages['cart.emptyDescription']`. */
  emptyDescription?: string
  /** Layout classes (height, width). */
  className?: string
}

/** The lines and totals of a sale, with "Charge" last; computes nothing. */
export function CartPanel(props: CartPanelProps) {
  const { messages, format } = useLiro()
  const titleId = useId()
  const reasonId = useId()
  const count = props.lines.length
  const pending = props.pending === true
  const blocked = props.chargeDisabledReason !== undefined || props.total === null
  const chargeLabel =
    props.chargeLabel ??
    messages['cart.charge'](props.total === null ? '—' : format.money(props.total, props.currency))
  return (
    <section
      aria-labelledby={titleId}
      data-slot="cart-panel"
      className={cn('flex min-h-0 min-w-0 flex-col bg-surface-raised font-sans', props.className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-0 border-b border-solid border-default px-4 py-3">
        <h2 id={titleId} className={cn('m-0 text-h4 font-semibold text-primary', TEXT_DIRECTION)}>
          {props.title ?? messages['cart.title']}
        </h2>
        {count > 0 && (
          <span className={cn('text-sm text-secondary', TEXT_ISOLATE)}>
            {messages['cart.count'](count, format.number(String(count)))}
          </span>
        )}
        {props.headerActions !== undefined && (
          <div className="ms-auto flex flex-wrap gap-2">{props.headerActions}</div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {count === 0 ? (
          <EmptyState
            compact
            icon={ShoppingCart}
            title={props.emptyTitle ?? messages['cart.empty']}
            description={props.emptyDescription ?? messages['cart.emptyDescription']}
            className="py-8"
          />
        ) : (
          <ul className="m-0 list-none p-0">
            {props.lines.map((line) => (
              <CartLineRow key={line.id} line={line} cart={props} />
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-3 border-0 border-t border-solid border-default px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {(props.totals !== undefined && props.totals.length > 0) || props.total !== null ? (
          <dl className="m-0 flex flex-col gap-1">
            {props.totals?.map((row) => (
              <div key={row.id} className="flex items-baseline justify-between gap-4 text-sm">
                <dt className={cn('text-secondary', TEXT_DIRECTION)}>{row.label}</dt>
                <dd className="m-0 text-primary">
                  <SettlingValue value={row.value} currency={props.currency} pending={pending} />
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-0 border-t border-solid border-strong pt-2">
              <dt className={cn('text-md font-semibold text-primary', TEXT_DIRECTION)}>
                {messages['cart.total']}
              </dt>
              <dd className="m-0 text-h3 font-semibold text-primary">
                <SettlingValue value={props.total} currency={props.currency} pending={pending} />
              </dd>
            </div>
          </dl>
        ) : null}
        {(props.actions !== undefined || (props.onCharge !== undefined && count > 0)) && (
          <div className="flex flex-col gap-2">
            {props.actions !== undefined && (
              <div className="flex flex-wrap gap-2">{props.actions}</div>
            )}
            {props.onCharge !== undefined && count > 0 && (
              <>
                <ButtonPrimitive
                  family="primary"
                  emphasis="primary"
                  aria-disabled={blocked || undefined}
                  aria-describedby={props.chargeDisabledReason === undefined ? undefined : reasonId}
                  className="min-h-14 w-full text-md"
                  onClick={() => {
                    if (!blocked) props.onCharge?.()
                  }}
                >
                  <span className={TEXT_DIRECTION}>{chargeLabel}</span>
                </ButtonPrimitive>
                {props.chargeDisabledReason !== undefined && (
                  <p id={reasonId} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
                    {props.chargeDisabledReason}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function CartLineRow({ line, cart }: { line: CartLine; cart: CartPanelProps }) {
  const { messages, format } = useLiro()
  const onQuantityChange = cart.onQuantityChange
  return (
    <li className="flex flex-col gap-2 border-0 border-b border-solid border-subtle px-4 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={cn('text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}>
            {line.name}
          </span>
          {line.detail !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{line.detail}</span>
          )}
          {line.discount !== undefined && (
            <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
              {line.discount}
            </span>
          )}
        </div>
        <MoneyText
          value={line.total}
          currency={cart.currency}
          className="shrink-0 text-sm font-semibold text-primary"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {onQuantityChange === undefined ? (
          <span className={cn('text-sm text-primary', TEXT_ISOLATE)}>
            <NumberText value={line.quantity} />
            {line.unit !== undefined && <span className="ms-1 text-secondary">{line.unit}</span>}
          </span>
        ) : (
          <QuantityStepper
            label={messages['cart.quantity'](line.name)}
            hideLabel
            value={line.quantity}
            onChange={(value) => {
              onQuantityChange(line.id, value)
            }}
            className="w-44 shrink-0"
            {...(line.unit === undefined ? {} : { unit: line.unit })}
            {...(line.step === undefined ? {} : { step: line.step })}
            {...(line.min === undefined ? {} : { min: line.min })}
            {...(line.max === undefined ? {} : { max: line.max })}
          />
        )}
        <span className={cn('min-w-0 flex-1 text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
          {messages['cart.each'](format.money(line.unitPrice, cart.currency))}
        </span>
        {cart.onRemove !== undefined && (
          <ButtonPrimitive
            family="neutral"
            emphasis="menu"
            shape="icon"
            aria-label={messages['cart.remove'](line.name)}
            title={messages['cart.remove'](line.name)}
            className="size-11 shrink-0 px-0"
            onClick={() => {
              cart.onRemove?.(line.id)
            }}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </ButtonPrimitive>
        )}
      </div>
    </li>
  )
}

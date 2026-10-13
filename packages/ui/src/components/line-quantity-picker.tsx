import { useId, useState } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { QuantityStepper } from './quantity-stepper'
import { SettlingValue } from './settling-value'
import {
  allLinesChosen,
  chooseAllLines,
  chosenLineIds,
  isChosen,
  toggleLine,
  type ChosenQuantities,
} from './sale-logic'

/*
 * LineQuantityPicker (P5.28 items 21d and 22). Choosing some of a sale's lines and how much of
 * each: the lines of a refund (a partial refund: two of the three coffees), the items paid now
 * when a bill is split or paid in part, the items moved to another table. One pattern for all.
 * - "All lines" on top (a tri-state checkbox: every line at its whole quantity, or none).
 * - A row per line: a checkbox at the start (ticked = the whole quantity available; cleared =
 *   none), the name (semibold, wrapping), its detail and the application's note ("1 refunded
 *   already"), "of 3 pc" — what is available — and a QuantityStepper from 0 to what is available,
 *   named "Quantity, <name>". A chosen row is the neutral selection (D17). A line that cannot be
 *   chosen shows its reason; its controls are disabled.
 * - Under the rows the application's figure for what is chosen (`chosenTotal`, settling while
 *   `pending`), e.g. "To refund 440,00 RSD": **the picker adds nothing** (D4); quantities are
 *   compared exactly as decimal strings, never as numbers.
 * Controlled (`value`, `onChange` with every line's quantity) or not (`defaultValue`).
 */

/** A line that can be chosen. */
export interface ChoosableLine {
  id: string
  name: string
  /** A line under the name ("60 g", "Table 4"). */
  detail?: string
  /** How much can be chosen, a decimal string ("3"; what is left after earlier refunds). */
  available: string
  /** The unit after the quantity ("pc"). */
  unit?: string
  /** The price of one, a decimal string ("25,00 RSD each"). */
  unitPrice?: string
  /** The application's note ("1 refunded already on 06.10.2026."). */
  note?: string
  /** The stepper's step, a decimal string; default "1". */
  step?: string
  /** Why the line cannot be chosen ("Refunded in full"). */
  unavailableReason?: string
}

export interface LineQuantityPickerProps {
  /** Names the list ("Lines to refund"). */
  label: string
  lines: readonly ChoosableLine[]
  /** Controlled quantities by line id; null or absent is none. */
  value?: ChosenQuantities
  /** Uncontrolled initial quantities. */
  defaultValue?: ChosenQuantities
  /** Every line's quantity after a change. */
  onChange?: (value: Record<string, string | null>) => void
  /** The currency of the prices and the figure. */
  currency?: string
  /** The application's figure for what is chosen, a decimal string; null "—". */
  chosenTotal?: string | null
  /** Default: `messages['lines.chosenTotal']`. */
  chosenTotalLabel?: string
  /** The application is computing the figure: the shown one stays until it settles. */
  pending?: boolean
  className?: string
}

const ROW = 'relative flex items-start gap-3 border-0 border-b border-solid border-subtle p-3'
const CHOSEN =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** Some of the lines and how much of each; the figure for them is the application's. */
export function LineQuantityPicker(props: LineQuantityPickerProps) {
  const { messages, format } = useLiro()
  const base = useId()
  const [inner, setInner] = useState<ChosenQuantities>(props.defaultValue ?? {})
  const value = props.value ?? inner
  const change = (next: Record<string, string | null>) => {
    setInner(next)
    props.onChange?.(next)
  }
  const chosenCount = chosenLineIds(props.lines, value).length
  const all = allLinesChosen(props.lines, value)
  const open = props.lines.some((line) => line.unavailableReason === undefined)
  const quantityText = (quantity: string, unit: string | undefined) =>
    unit === undefined ? format.number(quantity) : `${format.number(quantity)} ${unit}`

  return (
    <div
      data-slot="line-quantity-picker"
      className={cn('flex min-w-0 flex-col font-sans', props.className)}
    >
      <div className="flex items-center gap-3 px-3 pb-2">
        <Checkbox
          id={`${base}-all`}
          checked={all ? true : chosenCount > 0 ? 'indeterminate' : false}
          disabled={!open}
          onCheckedChange={(checked) => {
            change(chooseAllLines(props.lines, checked === true))
          }}
        />
        <label
          htmlFor={`${base}-all`}
          className={cn('cursor-pointer text-sm font-semibold text-primary', TEXT_DIRECTION)}
        >
          {messages['lines.all']}
        </label>
      </div>
      <ul
        aria-label={props.label}
        className="m-0 list-none border-0 border-t border-solid border-subtle p-0"
      >
        {props.lines.map((line, index) => {
          const id = `${base}-${String(index)}`
          const quantity = value[line.id] ?? null
          const chosen = isChosen(quantity)
          const unavailable = line.unavailableReason !== undefined
          return (
            <li key={line.id} className={cn(ROW, chosen && CHOSEN)}>
              <Checkbox
                id={id}
                className="mt-0.5"
                checked={chosen}
                disabled={unavailable}
                onCheckedChange={(checked) => {
                  change(toggleLine(value, line, checked === true))
                }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label htmlFor={id} className="flex min-w-0 cursor-pointer flex-col gap-0.5">
                  <span
                    className={cn(
                      'text-sm font-semibold break-words',
                      unavailable ? 'text-secondary' : 'text-primary',
                      TEXT_DIRECTION,
                    )}
                  >
                    {line.name}
                  </span>
                  {line.detail !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {line.detail}
                    </span>
                  )}
                  {line.note !== undefined && (
                    <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
                      {line.note}
                    </span>
                  )}
                  {unavailable && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {line.unavailableReason}
                    </span>
                  )}
                </label>
                {!unavailable && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <QuantityStepper
                      label={messages['cart.quantity'](line.name)}
                      hideLabel
                      value={quantity}
                      min="0"
                      max={line.available}
                      onChange={(next) => {
                        change({ ...value, [line.id]: next })
                      }}
                      className="w-44 shrink-0"
                      {...(line.unit === undefined ? {} : { unit: line.unit })}
                      {...(line.step === undefined ? {} : { step: line.step })}
                    />
                    <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                      {messages['lines.of'](quantityText(line.available, line.unit))}
                    </span>
                    {line.unitPrice !== undefined && props.currency !== undefined && (
                      <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                        {messages['cart.each'](format.money(line.unitPrice, props.currency))}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {props.chosenTotal !== undefined && props.currency !== undefined && (
        <dl className="m-0 flex items-baseline justify-between gap-4 px-3 pt-3">
          <dt className={cn('text-md font-semibold text-primary', TEXT_DIRECTION)}>
            {props.chosenTotalLabel ?? messages['lines.chosenTotal']}
          </dt>
          <dd className="m-0 text-h4 font-semibold text-primary">
            <SettlingValue
              value={props.chosenTotal}
              currency={props.currency}
              pending={props.pending === true}
            />
          </dd>
        </dl>
      )}
    </div>
  )
}

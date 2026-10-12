import { Minus, Plus } from 'lucide-react'
import { useId, type KeyboardEvent } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import { readNumber, showNumber } from './number-logic'
import { canStep, quantityRange, stepQuantity } from './quantity-logic'
import { entryAttributes, entryError, useEntry, type EntryProps } from './use-entry'

/*
 * QuantityStepper (BUILD-PLAN P5.11; docs/decisions.md "Touch and POS"). − / the quantity / +,
 * every target at least 44px (56px with `size="large"`), for a handheld and a till. The quantity is
 * typed freely as in NumberField (read by `format.parseNumber` on leaving the field, on Enter or
 * on a step) or stepped by `step`; it is a decimal string, never a JavaScript number, and the
 * limits are compared exactly (`compareDecimal`). A typed value outside `min` / `max` is kept and
 * shown as an error ("At least 1.") — never changed behind the user's back; − and + stop at the
 * limits. ArrowUp and ArrowDown step in the field. The unit ("pc", "kg") stands after the number.
 * The number is written left to right in every direction, as in NumberField.
 */

export interface QuantityStepperProps extends FieldBaseProps, EntryProps {
  /** The least quantity, a decimal string ("0", "1"). */
  min?: string
  /** The largest quantity, a decimal string. */
  max?: string
  /** What − and + change it by, a decimal string. Default "1"; "0.5", "0.001" for weights. */
  step?: string
  /** Zeros added up to this many decimals when shown; never rounded. */
  decimals?: number
  /** The unit after the number, from the application ("pc", "kg"). */
  unit?: string
  /** 'large' (56px, bigger digits) for the line in front of the user on a handheld. */
  size?: 'default' | 'large'
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name; the decimal string is submitted. */
  name?: string
}

/** A quantity with − and + for fingers, typed or stepped; a decimal string. */
export function QuantityStepper(props: QuantityStepperProps) {
  const { messages, format } = useLiro()
  const decreaseId = useId()
  const increaseId = useId()
  const unitId = useId()
  const entry = useEntry(
    props,
    (text) => readNumber(text, format),
    (value) => showNumber(value, format, props.decimals),
  )
  const limits = {
    ...(props.step === undefined ? {} : { step: props.step }),
    ...(props.min === undefined ? {} : { min: props.min }),
    ...(props.max === undefined ? {} : { max: props.max }),
  }
  const range = quantityRange(entry.value, props.min, props.max)
  const rangeError =
    range === 'below' && props.min !== undefined
      ? messages['quantity.belowMin'](format.number(props.min))
      : range === 'above' && props.max !== undefined
        ? messages['quantity.aboveMax'](format.number(props.max))
        : undefined
  const error = entryError(props.error ?? rangeError, entry.valid, messages['field.invalidNumber'])
  const large = props.size === 'large'

  /** Steps from what is typed now, read first, as leaving the field would. */
  const step = (direction: 1 | -1) => {
    const typed = readNumber(entry.text, format)
    const from = typed.valid ? typed.value : entry.value
    entry.pick(stepQuantity(from, direction, limits))
  }

  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => {
        const attributes = entryAttributes(entry, props, control.readOnly)
        // The unit is read after the number: it describes the field.
        const describedBy =
          [control.describedBy, props.unit === undefined ? undefined : unitId]
            .filter((id) => id !== undefined)
            .join(' ') || undefined
        const unit = props.unit !== undefined && (
          <span
            id={unitId}
            className={cn('shrink-0 pe-3 text-secondary', large ? 'text-md' : 'text-sm')}
          >
            {props.unit}
          </span>
        )
        if (control.readOnly) {
          return (
            <div className={cn('flex items-center', large ? 'h-14' : 'h-11')}>
              <input
                {...controlAttributes(control, messages['field.readOnly'])}
                {...attributes}
                aria-describedby={describedBy}
                dir="ltr"
                className={cn(
                  'm-0 w-full min-w-0 flex-1 cursor-text border-0 bg-transparent p-0 font-sans text-primary tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  large ? 'text-h3 font-semibold' : 'text-md',
                )}
              />
              {unit}
            </div>
          )
        }
        const button = (direction: 1 | -1) => {
          const id = direction === 1 ? increaseId : decreaseId
          const Icon = direction === 1 ? Plus : Minus
          return (
            <ButtonPrimitive
              family="neutral"
              emphasis="secondary"
              shape="icon"
              aria-labelledby={`${id} ${control.labelId}`}
              disabled={control.disabled || !canStep(entry.value, direction, limits)}
              className={cn('shrink-0 px-0', large ? 'size-14' : 'size-11')}
              onClick={() => {
                step(direction)
              }}
            >
              <span id={id} hidden>
                {direction === 1 ? messages['quantity.increase'] : messages['quantity.decrease']}
              </span>
              <Icon aria-hidden="true" className={large ? 'size-6' : 'size-5'} />
            </ButtonPrimitive>
          )
        }
        return (
          <div data-slot="quantity-stepper" className="flex items-center gap-2">
            {button(-1)}
            <div
              dir="ltr"
              className={cn(
                'flex min-w-0 flex-1 items-center rounded-md border border-solid border-control bg-surface-raised focus-within:border-focus',
                large ? 'h-14' : 'h-11',
                control.invalid && 'border-status-danger-fg focus-within:border-status-danger-fg',
                control.disabled && 'border-default bg-surface-disabled',
              )}
            >
              <input
                {...controlAttributes(control, messages['field.readOnly'])}
                {...attributes}
                aria-describedby={describedBy}
                inputMode="decimal"
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    step(event.key === 'ArrowUp' ? 1 : -1)
                    return
                  }
                  attributes.onKeyDown(event)
                }}
                className={cn(
                  'm-0 h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3 text-center font-sans text-primary tabular-nums outline-none placeholder:text-tertiary disabled:cursor-not-allowed disabled:text-disabled',
                  large ? 'text-h3 font-semibold' : 'text-md font-semibold',
                )}
              />
              {unit}
            </div>
            {button(1)}
            {props.name !== undefined && (
              <input type="hidden" name={props.name} value={entry.value ?? ''} />
            )}
          </div>
        )
      }}
    </Field>
  )
}

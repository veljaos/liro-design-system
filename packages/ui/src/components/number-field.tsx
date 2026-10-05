import type { FocusEventHandler, ReactNode } from 'react'
import { INPUT, READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import { currencyFirst, readNumber, showNumber } from './number-logic'
import { entryAttributes, entryError, useEntry, type EntryProps } from './use-entry'

/*
 * NumberField and MoneyField (BUILD-PLAN P2.3). No input mask (Appendix B.3): the user types
 * freely, pastes anything, and the text is read by `format.parseNumber` on leaving the field or
 * on Enter; then it is shown again through `format.number`, which never rounds. The value is a
 * decimal string or null, never a JavaScript number and never "0" for unreadable text (B.4).
 *
 * Owner's decisions (2026-09-28, docs/decisions.md "Numbers, money and dates"):
 * - Unreadable text stays in the field for the user to correct; the value is null; the field shows
 *   `messages['field.invalidNumber']` as its error (the application's `error` wins) and tells the
 *   application through `onValidityChange`, so a form can block saving.
 * - Start-aligned in forms, as Mantine's NumberInput; tabular digits.
 * - MoneyField's currency sits where `format.money` puts it for the locale.
 *
 * The text is laid out left to right in every direction (`dir="ltr"`): a number is written left to
 * right, and in a right-to-left field the bidi algorithm moved the minus sign to the end of
 * "-42,00" (docs/decisions.md, Provider). In right-to-left it is aligned to the field's start,
 * which is the input's end. The direction is the provider's (`useLiro().direction`), not CSS:
 * Tailwind's `rtl:` also matches a left-to-right field inside a right-to-left page, and Vite's CSS
 * minifier rewrites `:dir(rtl)` into a list of right-to-left languages.
 */

interface NumberValueProps extends EntryProps {
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name; the decimal string is submitted, not the text shown. */
  name?: string
  /**
   * A short fixed text inside the field at its start, drawn as the currency is (FilterBar's
   * "From" / "To"). Decorative: the field's label names it; a press on it puts the caret in the
   * field.
   */
  startText?: string
}

export interface NumberFieldProps extends FieldBaseProps, NumberValueProps {
  /**
   * Decimals to show: zeros are added up to this many; more digits are always shown, never
   * rounded. Default: the digits of the value as they are.
   */
  decimals?: number
}

export interface MoneyFieldProps extends FieldBaseProps, NumberValueProps {
  /** The currency code or sign shown beside the amount, e.g. "EUR". From the application. */
  currency: string
  /** Decimals to show, as NumberField. Default: the provider's `format.moneyDecimals`. */
  decimals?: number
}

/** The typed entry of a number: read by `format.parseNumber`, shown by `format.number`. */
function useNumberEntry(props: NumberValueProps, decimals: number | undefined) {
  const { format } = useLiro()
  return useEntry(
    props,
    (text) => readNumber(text, format),
    (value) => showNumber(value, format, decimals),
  )
}

/** The attributes of a number's typing area: a numeric keyboard, left to right. */
function numberAttributes(
  entry: ReturnType<typeof useEntry>,
  props: NumberValueProps,
  readOnly: boolean,
) {
  return {
    ...entryAttributes(entry, props, readOnly),
    inputMode: 'decimal' as const,
    dir: 'ltr',
  }
}

/** A fixed text beside the typing area: Mantine's input section, at least 34px wide, centred. */
function Section(props: {
  children: ReactNode
  disabled: boolean
  htmlFor?: string
  onPress?: () => void
}) {
  const className = cn(
    'flex h-full min-w-[34px] shrink-0 cursor-text items-center justify-center text-sm',
    props.disabled ? 'cursor-not-allowed text-disabled' : 'text-secondary',
  )
  return props.htmlFor === undefined ? (
    <span
      aria-hidden="true"
      // Wider than the currency, so with air of its own: 12px from the field's edge (the field's
      // text padding) and 8px to the typing area (the gap between fields).
      className={cn(className, 'ps-3 pe-2')}
      onMouseDown={(event) => {
        event.preventDefault()
        props.onPress?.()
      }}
    >
      {props.children}
    </span>
  ) : (
    <label htmlFor={props.htmlFor} className={className}>
      {props.children}
    </label>
  )
}

/**
 * The framed box of MoneyField, and of NumberField with a `startText`: the typing area between
 * fixed texts. The typing area is left to right inside a field that may be right to left, so the
 * side next to a section has no padding (the section is its space) and a free side 12px.
 */
function NumberBox(props: {
  control: Parameters<typeof controlAttributes>[0]
  entry: ReturnType<typeof useNumberEntry>
  field: NumberValueProps
  before: ReactNode
  after: ReactNode
}) {
  const { messages, direction } = useLiro()
  const rtl = direction === 'rtl'
  const { control } = props
  const attributes = controlAttributes(control, messages['field.readOnly'])
  // The typing area's own direction is left to right: its start is the field's end in
  // right-to-left.
  const left = rtl ? props.after !== null : props.before !== null
  const right = rtl ? props.before !== null : props.after !== null
  return (
    <>
      <div
        data-slot="money"
        className={cn(
          INPUT,
          'flex items-center px-0 focus-within:border-focus',
          control.invalid && 'border-status-danger-fg focus-within:border-status-danger-fg',
          control.disabled && 'cursor-not-allowed border-default bg-surface-disabled text-disabled',
          control.readOnly &&
            'border-transparent bg-transparent focus-within:border-transparent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
        )}
      >
        {props.before}
        <input
          {...attributes}
          {...numberAttributes(props.entry, props.field, control.readOnly)}
          className={cn(
            'm-0 h-full min-w-0 flex-1 border-0 bg-transparent py-0 font-sans text-sm text-inherit tabular-nums outline-none placeholder:text-tertiary disabled:cursor-not-allowed',
            rtl && 'text-end',
            left ? 'ps-0' : 'ps-3',
            right ? 'pe-0' : 'pe-3',
            control.readOnly && 'cursor-text',
          )}
        />
        {props.after}
      </div>
      {props.field.name !== undefined && (
        <input type="hidden" name={props.field.name} value={props.entry.value ?? ''} />
      )}
    </>
  )
}

/** The `startText` section, which puts the caret in the field when pressed. */
function startSection(text: string | undefined, control: { id: string; disabled: boolean }) {
  if (text === undefined) return null
  return (
    <Section
      disabled={control.disabled}
      onPress={() => {
        document.getElementById(control.id)?.focus()
      }}
    >
      {text}
    </Section>
  )
}

/**
 * A number typed freely (no mask) and read on leaving the field: "1234.56", "1.234,56",
 * "1 234,56" and the other forms of Appendix B.3 all give the decimal string "1234.56".
 */
export function NumberField(props: NumberFieldProps) {
  const { messages, direction } = useLiro()
  const rtl = direction === 'rtl'
  const entry = useNumberEntry(props, props.decimals)
  const error = entryError(props.error, entry.valid, messages['field.invalidNumber'])
  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) =>
        props.startText === undefined ? (
          <>
            <Input
              {...controlAttributes(control, messages['field.readOnly'])}
              {...numberAttributes(entry, props, control.readOnly)}
              className={cn('tabular-nums', rtl && 'text-end', control.readOnly && READ_ONLY)}
            />
            {props.name !== undefined && (
              <input type="hidden" name={props.name} value={entry.value ?? ''} />
            )}
          </>
        ) : (
          <NumberBox
            control={control}
            entry={entry}
            field={props}
            before={startSection(props.startText, control)}
            after={null}
          />
        )
      }
    </Field>
  )
}

/**
 * An amount with its currency beside it, on the side where the locale writes it
 * (`format.money`). The amount is typed and read as in NumberField; the value is a decimal
 * string, and the currency is the application's.
 */
export function MoneyField(props: MoneyFieldProps) {
  const { messages, format } = useLiro()
  const entry = useNumberEntry(props, props.decimals ?? format.moneyDecimals)
  const error = entryError(props.error, entry.valid, messages['field.invalidNumber'])
  const first = currencyFirst(format, props.currency)
  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => {
        // The currency is a second label of the input: a press on it puts the caret in the
        // amount, and the input's name includes it ("Amount EUR").
        const currency = (
          <Section disabled={control.disabled} htmlFor={control.id}>
            {props.currency}
          </Section>
        )
        const start = startSection(props.startText, control)
        return (
          <NumberBox
            control={control}
            entry={entry}
            field={props}
            before={
              start === null && !first ? null : (
                <>
                  {start}
                  {first && currency}
                </>
              )
            }
            after={first ? null : currency}
          />
        )
      }}
    </Field>
  )
}

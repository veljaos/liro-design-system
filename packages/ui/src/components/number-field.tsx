import {
  useState,
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { INPUT, READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import { currencyFirst, readNumber, showNumber } from './number-logic'

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
 * which is the input's end.
 */

interface NumberValueProps {
  /** Controlled value: a decimal string such as "1234.5", or null for empty. */
  value?: string | null
  /** Uncontrolled initial value. */
  defaultValue?: string | null
  /**
   * Called when the user leaves the field or presses Enter and the value changed: the decimal
   * string read from the text, or null when the text is empty or cannot be read.
   */
  onChange?: (value: string | null) => void
  /**
   * Called when the text becomes unreadable (false) or readable again (true). While it is false
   * the value is null and the field shows its own error; a form should not save.
   */
  onValidityChange?: (valid: boolean) => void
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name; the decimal string is submitted, not the text shown. */
  name?: string
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

/** The value, the text in the field and its validity, shared by both fields. */
function useNumberEntry(props: NumberValueProps, decimals: number | undefined) {
  const { format } = useLiro()
  const [inner, setInner] = useState(props.defaultValue ?? null)
  const value = props.value === undefined ? inner : props.value
  // The text while it differs from the value's own text (being typed, or unreadable).
  const [text, setText] = useState<string | null>(null)
  const [valid, setValid] = useState(true)
  // The last value this field reported, and the last value it was given: a new value from the
  // application (not the one just reported) replaces any text being typed.
  const [reported, setReported] = useState(value)
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    if (value !== reported) {
      setReported(value)
      setText(null)
      if (!valid) {
        setValid(true)
        props.onValidityChange?.(true)
      }
    }
  }

  const commit = () => {
    if (text === null) return
    const entry = readNumber(text, format)
    if (entry.valid !== valid) {
      setValid(entry.valid)
      props.onValidityChange?.(entry.valid)
    }
    if (entry.valid) setText(null)
    if (entry.value !== value) {
      setInner(entry.value)
      setReported(entry.value)
      props.onChange?.(entry.value)
    }
  }

  return {
    value,
    valid,
    text: text ?? showNumber(value, format, decimals),
    setText,
    commit,
  }
}

/** The error a number field shows: the application's, else its own for unreadable text. */
function numberError(error: ReactNode, valid: boolean, message: string): ReactNode {
  if (error !== undefined && error !== null && error !== false) return error
  return valid ? undefined : message
}

/** The attributes of the typing area, shared by both fields. */
function entryAttributes(
  entry: ReturnType<typeof useNumberEntry>,
  props: NumberValueProps,
  readOnly: boolean,
) {
  return {
    type: 'text',
    inputMode: 'decimal' as const,
    autoComplete: 'off',
    dir: 'ltr',
    value: entry.text,
    ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }),
    onChange: (event: { target: { value: string } }) => {
      if (!readOnly) entry.setText(event.target.value)
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') entry.commit()
    },
    onBlur: (event: Parameters<FocusEventHandler<HTMLInputElement>>[0]) => {
      entry.commit()
      props.onBlur?.(event)
    },
  }
}

/**
 * A number typed freely (no mask) and read on leaving the field: "1234.56", "1.234,56",
 * "1 234,56" and the other forms of Appendix B.3 all give the decimal string "1234.56".
 */
export function NumberField(props: NumberFieldProps) {
  const { messages } = useLiro()
  const entry = useNumberEntry(props, props.decimals)
  const error = numberError(props.error, entry.valid, messages['field.invalidNumber'])
  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => (
        <>
          <Input
            {...controlAttributes(control, messages['field.readOnly'])}
            {...entryAttributes(entry, props, control.readOnly)}
            className={cn('tabular-nums rtl:text-end', control.readOnly && READ_ONLY)}
          />
          {props.name !== undefined && (
            <input type="hidden" name={props.name} value={entry.value ?? ''} />
          )}
        </>
      )}
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
  const error = numberError(props.error, entry.valid, messages['field.invalidNumber'])
  const first = currencyFirst(format, props.currency)
  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => {
        const attributes = controlAttributes(control, messages['field.readOnly'])
        // The currency is a second label of the input: a press on it puts the caret in the
        // amount, and the input's name includes it ("Amount EUR"). Mantine's input section (Input.css): at least the input's height minus 2px wide (34px),
        // the content centred, in the dimmed colour (text.secondary).
        const currency = (
          <label
            htmlFor={control.id}
            className={cn(
              'flex h-full min-w-[34px] shrink-0 cursor-text items-center justify-center text-sm',
              control.disabled ? 'cursor-not-allowed text-disabled' : 'text-secondary',
            )}
          >
            {props.currency}
          </label>
        )
        return (
          <>
            <div
              data-slot="money"
              className={cn(
                INPUT,
                'flex items-center px-0 focus-within:border-focus',
                control.invalid && 'border-status-danger-fg focus-within:border-status-danger-fg',
                control.disabled &&
                  'cursor-not-allowed border-default bg-surface-disabled text-disabled',
                control.readOnly &&
                  'border-transparent bg-transparent focus-within:border-transparent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
              )}
            >
              {first && currency}
              <input
                {...attributes}
                {...entryAttributes(entry, props, control.readOnly)}
                className={cn(
                  'm-0 h-full min-w-0 flex-1 border-0 bg-transparent py-0 font-sans text-sm text-inherit tabular-nums outline-none placeholder:text-tertiary disabled:cursor-not-allowed rtl:text-end',
                  // The input is left to right inside a field that may be right to left: the side
                  // next to the currency has no padding (the section is its space), the other 12px.
                  first ? 'ps-0 pe-3 rtl:ps-3 rtl:pe-0' : 'ps-3 pe-0 rtl:ps-0 rtl:pe-3',
                  control.readOnly && 'cursor-text',
                )}
              />
              {!first && currency}
            </div>
            {props.name !== undefined && (
              <input type="hidden" name={props.name} value={entry.value ?? ''} />
            )}
          </>
        )
      }}
    </Field>
  )
}

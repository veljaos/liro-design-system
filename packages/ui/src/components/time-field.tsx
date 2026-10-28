import { READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import { parseTimeText } from './time-logic'
import { entryAttributes, entryError, useEntry, type EntryProps } from './use-entry'

/*
 * TimeField (P5.90 item 12): a time of day typed the quick way, as the date fields read "010326".
 * "630", "0630" and "6:30" become 06:30, "1430" becomes 14:30, "6:30 pm" 18:30; with `withSeconds`
 * "630" becomes 06:30:00. The text is read on leaving the field or on Enter (`parseTimeText`) and
 * shown again as the value, so the user sees at once what was understood. Unreadable text stays
 * with `messages['field.invalidTime']` and `onValidityChange(false)`; the value is null, never
 * midnight. The value is a clock time of the tenant on a 24-hour clock, "HH:MM" or "HH:MM:SS";
 * the application joins it to a date. Left to right in every language, as a code.
 */

export interface TimeFieldProps extends FieldBaseProps, EntryProps {
  /** The value carries seconds, "HH:MM:SS". Default: "HH:MM". */
  withSeconds?: boolean
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name; the "HH:MM" value is submitted, not the text typed. */
  name?: string
  onBlur?: () => void
}

/** A time of day, typed: "630" → 06:30. The value is "HH:MM" (or "HH:MM:SS") or null. */
export function TimeField(props: TimeFieldProps) {
  const { messages, direction } = useLiro()
  const seconds = props.withSeconds === true
  const entry = useEntry(
    props,
    (text) => {
      if (text.trim() === '') return { value: null, valid: true }
      const value = parseTimeText(text, { seconds })
      return { value, valid: value !== null }
    },
    (value) => value ?? '',
  )
  const error = entryError(props.error, entry.valid, messages['field.invalidTime'])
  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => (
        <>
          <Input
            {...controlAttributes(control)}
            {...entryAttributes(
              entry,
              {
                ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }),
                ...(props.onBlur === undefined ? {} : { onBlur: props.onBlur }),
              },
              control.readOnly,
            )}
            // Digits and a separator are all a time needs: the phone's number pad.
            inputMode="decimal"
            data-slot="time"
            dir="ltr"
            className={cn(
              'tabular-nums',
              direction === 'rtl' && 'text-end',
              control.readOnly && READ_ONLY,
            )}
          />
          {props.name !== undefined && (
            <input type="hidden" name={props.name} value={entry.value ?? ''} />
          )}
        </>
      )}
    </Field>
  )
}

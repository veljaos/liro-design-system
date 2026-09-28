import type { ChangeEvent, FocusEventHandler, HTMLInputAutoCompleteAttribute } from 'react'
import { READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Textarea } from '../primitives/textarea'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'

/** Value props shared by the text fields: the value is always a string. */
interface TextValueProps {
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Called with the new text on every change. */
  onChange?: (value: string) => void
  onBlur?: FocusEventHandler<HTMLElement>
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name. */
  name?: string
}

export interface TextFieldProps extends FieldBaseProps, TextValueProps {
  /** Default: 'text'. Numbers, money and dates have their own fields (P2.3). */
  type?: 'text' | 'email' | 'tel' | 'url' | 'search'
  /** The browser's autofill hint, e.g. 'email', 'organization'. */
  autoComplete?: HTMLInputAutoCompleteAttribute
}

function valueProps(props: TextValueProps) {
  return {
    ...(props.value === undefined ? {} : { value: props.value }),
    ...(props.defaultValue === undefined ? {} : { defaultValue: props.defaultValue }),
    ...(props.onBlur === undefined ? {} : { onBlur: props.onBlur }),
    ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }),
    ...(props.name === undefined ? {} : { name: props.name }),
  }
}

/**
 * A single-line text field: label, the input, description, error, read-only and disabled states.
 * The value is plain text; paste is always allowed.
 */
export function TextField(props: TextFieldProps) {
  const { messages } = useLiro()
  return (
    <Field {...fieldProps(props)}>
      {(control) => (
        <Input
          {...controlAttributes(control, messages['field.readOnly'])}
          {...valueProps(props)}
          type={props.type ?? 'text'}
          {...(props.autoComplete === undefined ? {} : { autoComplete: props.autoComplete })}
          onChange={(event: ChangeEvent<HTMLInputElement>) => props.onChange?.(event.target.value)}
          className={cn(control.readOnly && READ_ONLY)}
        />
      )}
    </Field>
  )
}

export interface TextAreaFieldProps extends FieldBaseProps, TextValueProps {
  /** Visible lines. Default: the browser's (2), as Mantine's Textarea. */
  rows?: number
}

/** A multi-line text field, with the states of TextField. Paste is always allowed. */
export function TextAreaField(props: TextAreaFieldProps) {
  const { messages } = useLiro()
  return (
    <Field {...fieldProps(props)}>
      {(control) => (
        <Textarea
          {...controlAttributes(control, messages['field.readOnly'])}
          {...valueProps(props)}
          {...(props.rows === undefined ? {} : { rows: props.rows })}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            props.onChange?.(event.target.value)
          }
          className={cn(control.readOnly && READ_ONLY)}
        />
      )}
    </Field>
  )
}

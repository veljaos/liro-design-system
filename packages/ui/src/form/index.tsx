import { useRef } from 'react'
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  type Validate,
} from 'react-hook-form'
import { CheckboxField, SwitchField, type CheckboxFieldProps } from '../components/checkbox-field'
import { ComboboxField, type ComboboxFieldProps } from '../components/combobox-field'
import {
  DateField,
  DateRangeField,
  type DateFieldProps,
  type DateRangeFieldProps,
} from '../components/date-field'
import { MultiSelectField, type MultiSelectFieldProps } from '../components/multi-select-field'
import {
  MoneyField,
  NumberField,
  type MoneyFieldProps,
  type NumberFieldProps,
} from '../components/number-field'
import { RadioGroupField, type RadioGroupFieldProps } from '../components/radio-group-field'
import { SelectField, type SelectFieldProps } from '../components/select-field'
import {
  TextAreaField,
  TextField,
  type TextAreaFieldProps,
  type TextFieldProps,
} from '../components/text-field'
import { useLiro } from '../provider/liro-provider'

/*
 * @veljaos/ui/form (BUILD-PLAN P3.5; owner's decision, 2026-10-01): an optional binding of the
 * Design System's fields to React Hook Form, which the application installs (an optional peer
 * dependency). Each Form… component is the field of the same name with `control`, `name` and
 * `rules` in place of `value` and `onChange`: it shows the form's value and the rule's error
 * message, and reports changes and leaving the field. The fields themselves stay presentational
 * and do not depend on React Hook Form. No validation library: rules are React Hook Form's own
 * (required, min, validate …) or the application's functions. Number, money and date fields add
 * one rule of their own: text they cannot read fails with the field's own message, so the form
 * does not submit while it is there (the owner's decision of P2.3a).
 */

/** What every bound field takes in place of its value and onChange. */
export interface Bound<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  control: Control<TValues>
  name: TName
  rules?: Omit<
    RegisterOptions<TValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
}

type Unbound<P> = Omit<P, 'value' | 'defaultValue' | 'onChange' | 'name' | 'checked'>

function useBound<TValues extends FieldValues, TName extends FieldPath<TValues>>(
  bound: Bound<TValues, TName>,
  unreadable?: () => string | true,
) {
  const rules =
    unreadable === undefined
      ? bound.rules
      : {
          ...bound.rules,
          validate: {
            ...(typeof bound.rules?.validate === 'function'
              ? { rule: bound.rules.validate }
              : (bound.rules?.validate as Record<string, Validate<unknown, TValues>> | undefined)),
            readable: unreadable,
          },
        }
  const { field, fieldState } = useController({
    control: bound.control,
    name: bound.name,
    ...(rules === undefined ? {} : { rules: rules }),
  })
  const error = fieldState.error?.message
  return { field, error: error === undefined || error === '' ? undefined : error }
}

/** A typed field's readability, as a validation rule with the field's own message. */
function useReadable(message: string) {
  const valid = useRef(true)
  return {
    rule: (): string | true => (valid.current ? true : message),
    onValidityChange: (next: boolean) => {
      valid.current = next
    },
  }
}

function errorOf(own: unknown, fallback: CheckboxFieldProps['error']) {
  return typeof own === 'string' ? own : fallback
}

export function FormTextField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<TextFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <TextField
      {...props}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormTextAreaField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<TextAreaFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <TextAreaField
      {...props}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormNumberField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<NumberFieldProps>) {
  const { messages } = useLiro()
  const readable = useReadable(messages['field.invalidNumber'])
  const { field, error } = useBound(
    { control, name, ...(rules === undefined ? {} : { rules }) },
    readable.rule,
  )
  return (
    <NumberField
      {...props}
      name={field.name}
      value={field.value ?? null}
      onChange={field.onChange}
      onBlur={field.onBlur}
      onValidityChange={(valid) => {
        readable.onValidityChange(valid)
        props.onValidityChange?.(valid)
      }}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormMoneyField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<MoneyFieldProps>) {
  const { messages } = useLiro()
  const readable = useReadable(messages['field.invalidNumber'])
  const { field, error } = useBound(
    { control, name, ...(rules === undefined ? {} : { rules }) },
    readable.rule,
  )
  return (
    <MoneyField
      {...props}
      name={field.name}
      value={field.value ?? null}
      onChange={field.onChange}
      onBlur={field.onBlur}
      onValidityChange={(valid) => {
        readable.onValidityChange(valid)
        props.onValidityChange?.(valid)
      }}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormDateField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<DateFieldProps>) {
  const { messages } = useLiro()
  const readable = useReadable(messages['field.invalidDate'])
  const { field, error } = useBound(
    { control, name, ...(rules === undefined ? {} : { rules }) },
    readable.rule,
  )
  return (
    <DateField
      {...props}
      name={field.name}
      value={field.value ?? null}
      onChange={field.onChange}
      onValidityChange={(valid) => {
        readable.onValidityChange(valid)
        props.onValidityChange?.(valid)
      }}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormDateRangeField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Omit<Unbound<DateRangeFieldProps>, 'startName' | 'endName'>) {
  const { messages } = useLiro()
  const readable = useReadable(messages['field.invalidDate'])
  const { field, error } = useBound(
    { control, name, ...(rules === undefined ? {} : { rules }) },
    readable.rule,
  )
  return (
    <DateRangeField
      {...props}
      value={field.value ?? { start: null, end: null }}
      onChange={field.onChange}
      onValidityChange={(valid) => {
        readable.onValidityChange(valid)
        props.onValidityChange?.(valid)
      }}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormSelectField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<SelectFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <SelectField
      {...props}
      name={field.name}
      value={field.value ?? ''}
      onChange={(value) => {
        field.onChange(value === '' ? null : value)
      }}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormComboboxField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<ComboboxFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <ComboboxField
      {...props}
      name={field.name}
      value={field.value ?? null}
      onChange={field.onChange}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormMultiSelectField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({ control, name, rules, ...props }: Bound<TValues, TName> & Unbound<MultiSelectFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <MultiSelectField
      {...props}
      name={field.name}
      value={(field.value as string[] | undefined) ?? []}
      onChange={field.onChange}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormRadioGroupField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<RadioGroupFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <RadioGroupField
      {...props}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      {...(error === undefined ? {} : { error })}
    />
  )
}

export function FormCheckboxField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<CheckboxFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <CheckboxField
      {...props}
      name={field.name}
      checked={field.value === true}
      onChange={field.onChange}
      error={errorOf(error, props.error)}
    />
  )
}

export function FormSwitchField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  rules,
  ...props
}: Bound<TValues, TName> & Unbound<CheckboxFieldProps>) {
  const { field, error } = useBound({ control, name, ...(rules === undefined ? {} : { rules }) })
  return (
    <SwitchField
      {...props}
      name={field.name}
      checked={field.value === true}
      onChange={field.onChange}
      error={errorOf(error, props.error)}
    />
  )
}

import { READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../primitives/select'
import { useLiro } from '../provider/liro-provider'
import { useState } from 'react'
import { CompactIconButton } from './button'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'

/** One choice of a SelectField. */
export interface SelectOption {
  /** The value the application stores. Not empty. */
  value: string
  /** What the user sees. From the application. */
  label: string
  /** Shown, but cannot be chosen. */
  disabled?: boolean
  /** Options with the same group are listed together under this heading, in order of first use. */
  group?: string
}

export interface SelectFieldProps extends FieldBaseProps {
  options: readonly SelectOption[]
  /** Controlled value; undefined or '' shows the placeholder. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Called with the chosen value, or '' when the field is cleared. */
  onChange?: (value: string) => void
  /**
   * While a value is chosen, a clear button (named by `messages['field.clear']`) replaces the
   * chevron (Mantine Select `clearable`). For optional choices such as filters.
   */
  clearable?: boolean
  /** Shown while nothing is chosen. From the application. */
  placeholder?: string
  /** The form field name. */
  name?: string
}

/** The options in their groups, groups in order of first appearance; ungrouped options first. */
export function groupOptions(options: readonly SelectOption[]) {
  const groups = new Map<string | undefined, SelectOption[]>()
  for (const option of options) {
    const list = groups.get(option.group) ?? []
    list.push(option)
    groups.set(option.group, list)
  }
  const ungrouped = groups.get(undefined) ?? []
  groups.delete(undefined)
  return { ungrouped, groups: [...groups.entries()] as [string, SelectOption[]][] }
}

/**
 * A choice from a short, known list (Mantine Select look). For a long list, or one that is
 * searched on the server, use ComboboxField. Read-only shows the chosen option's label as text.
 */
export function SelectField(props: SelectFieldProps) {
  const { messages } = useLiro()
  const { ungrouped, groups } = groupOptions(props.options)
  const [innerValue, setInnerValue] = useState(props.defaultValue ?? '')
  const value = props.value ?? innerValue
  const change = (next: string) => {
    setInnerValue(next)
    props.onChange?.(next)
  }
  const chosen = props.value ?? props.defaultValue
  const chosenLabel = props.options.find((option) => option.value === chosen)?.label ?? ''
  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        if (control.readOnly) {
          return (
            <Input
              {...controlAttributes(control, messages['field.readOnly'])}
              value={chosenLabel}
              className={READ_ONLY}
            />
          )
        }
        const { id, disabled, required } = control
        const showClear = props.clearable === true && value !== '' && !disabled
        return (
          <div className="relative">
            <Select
              value={value}
              onValueChange={change}
              {...(props.name === undefined ? {} : { name: props.name })}
              disabled={disabled}
              required={required}
            >
              <SelectTrigger
                id={id}
                aria-describedby={control.describedBy}
                aria-invalid={control.invalid || undefined}
                className={cn('w-full', showClear && 'pe-9 [&>svg]:hidden')}
              >
                {/* The chosen option's text takes its direction from itself (P3.6c). */}
                <SelectValue
                  dir="auto"
                  {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
                />
              </SelectTrigger>
              <SelectContent>
                {ungrouped.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled === true}
                  >
                    {option.label}
                  </SelectItem>
                ))}
                {groups.map(([heading, members], index) => (
                  <SelectGroup key={heading}>
                    {(index > 0 || ungrouped.length > 0) && <SelectSeparator />}
                    <SelectLabel>{heading}</SelectLabel>
                    {members.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled === true}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {showClear && (
              <span className="absolute inset-y-0 end-1 flex items-center">
                <CompactIconButton
                  intent="cancel"
                  label={messages['field.clear']}
                  onClick={() => {
                    change('')
                  }}
                />
              </span>
            )}
          </div>
        )
      }}
    </Field>
  )
}

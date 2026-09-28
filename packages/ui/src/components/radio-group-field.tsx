import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { RadioGroup, RadioGroupItem } from '../primitives/radio-group'
import { useLiro } from '../provider/liro-provider'
import { Field, fieldProps, type FieldBaseProps } from './field'

/** One choice of a RadioGroupField. */
export interface RadioOption {
  /** The value the application stores. */
  value: string
  /** What the user sees. From the application. */
  label: ReactNode
  /** A hint under the option's label. */
  description?: ReactNode
  /** Shown, but cannot be chosen. */
  disabled?: boolean
}

export interface RadioGroupFieldProps extends FieldBaseProps {
  options: readonly RadioOption[]
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  onChange?: (value: string) => void
  /** The form field name. */
  name?: string
}

/**
 * One choice from a few options that should all be visible (up to about five). The group label
 * names the radio group; each option has its own label (Mantine Radio.Group and InlineInput:
 * 12px between radio and label, 20px label line, 16px between options). Arrow keys follow the
 * direction. Read-only shows the options with the chosen one marked, and nothing can change.
 */
export function RadioGroupField(props: RadioGroupFieldProps) {
  const { messages } = useLiro()
  const current = props.value ?? props.defaultValue
  return (
    <Field {...fieldProps(props)} group>
      {(control) => {
        const state = control.readOnly
          ? current === undefined
            ? {}
            : { value: current }
          : {
              ...(props.value === undefined ? {} : { value: props.value }),
              ...(props.defaultValue === undefined ? {} : { defaultValue: props.defaultValue }),
            }
        return (
          <RadioGroup
            {...state}
            onValueChange={(value) => {
              if (!control.readOnly) props.onChange?.(value)
            }}
            {...(props.name === undefined ? {} : { name: props.name })}
            aria-labelledby={control.labelId}
            aria-describedby={control.describedBy}
            aria-invalid={control.invalid || undefined}
            aria-readonly={control.readOnly || undefined}
            aria-required={control.required || undefined}
            title={control.readOnly ? messages['field.readOnly'] : undefined}
            required={control.required}
            disabled={control.disabled}
          >
            {props.options.map((option, index) => {
              const id = `${control.id}-${String(index)}`
              const disabled = control.disabled || option.disabled === true
              return (
                <div key={option.value} className="flex items-start">
                  <RadioGroupItem
                    id={id}
                    value={option.value}
                    disabled={disabled}
                    className={cn(
                      control.invalid && 'border-status-danger-fg',
                      control.readOnly && 'cursor-default',
                    )}
                  />
                  <div className="flex min-w-0 flex-col ps-3">
                    <label
                      htmlFor={id}
                      className={cn(
                        'text-sm leading-5 break-words',
                        disabled ? 'cursor-not-allowed text-disabled' : 'text-primary',
                        !disabled && !control.readOnly && 'cursor-pointer',
                      )}
                    >
                      {option.label}
                    </label>
                    {option.description !== undefined && (
                      <p className="m-0 mt-[5px] text-xs leading-tight text-secondary">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        )
      }}
    </Field>
  )
}

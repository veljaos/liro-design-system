import type { ReactNode } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { cn } from '../primitives/cn'
import { Switch } from '../primitives/switch'
import { useLiro } from '../provider/liro-provider'
import { FieldMessage, RequiredMark, useFieldIds, type FieldBaseProps } from './field'

/*
 * A checkbox or a switch with its label beside it (Mantine InlineInput.css, size 'sm'): the label
 * column starts 12px after the control, the label is 13px with a 20px line (the control's
 * height), the description and the error sit 5px under the label. Read-only keeps the control in
 * its colours and state, but it cannot be changed (aria-readonly); disabled greys it out.
 */

export interface CheckboxFieldProps extends FieldBaseProps {
  /** Controlled state. */
  checked?: boolean
  /** Uncontrolled initial state. */
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  /** The form field name. */
  name?: string
  /** The value submitted with the form when checked. Default: 'on'. */
  value?: string
}

interface InlineProps extends CheckboxFieldProps {
  control: (props: InlineControlProps) => ReactNode
}

interface InlineControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  'aria-readonly': true | undefined
  title: string | undefined
  required: boolean
  disabled: boolean
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange: (checked: boolean) => void
  name?: string
  value?: string
}

function InlineField(props: InlineProps) {
  const { messages } = useLiro()
  const ids = useFieldIds(props)
  const readOnly = props.readOnly === true
  const disabled = props.disabled === true
  const current = props.checked ?? props.defaultChecked ?? false
  const state = readOnly
    ? { checked: current }
    : {
        ...(props.checked === undefined ? {} : { checked: props.checked }),
        ...(props.defaultChecked === undefined ? {} : { defaultChecked: props.defaultChecked }),
      }
  return (
    <div
      data-slot="inline-field"
      data-invalid={ids.hasError || undefined}
      data-readonly={readOnly || undefined}
      className={cn('flex min-w-0 items-start font-sans', props.className)}
    >
      {props.control({
        id: ids.id,
        'aria-describedby': ids.describedBy,
        'aria-invalid': ids.hasError || undefined,
        'aria-readonly': readOnly || undefined,
        title: readOnly ? messages['field.readOnly'] : undefined,
        required: props.required === true,
        disabled,
        ...state,
        onCheckedChange: (checked) => {
          if (!readOnly) props.onChange?.(checked)
        },
        ...(props.name === undefined ? {} : { name: props.name }),
        ...(props.value === undefined ? {} : { value: props.value }),
      })}
      <div className="flex min-w-0 flex-col ps-3">
        <label
          id={ids.labelId}
          htmlFor={ids.id}
          className={cn(
            'text-sm leading-5 break-words',
            disabled ? 'cursor-not-allowed text-disabled' : 'text-primary',
            !disabled && !readOnly && 'cursor-pointer',
          )}
        >
          {props.label}
          {props.required === true && <RequiredMark />}
        </label>
        {ids.hasDescription && (
          <p id={ids.descriptionId} className="m-0 mt-[5px] text-xs leading-tight text-secondary">
            {props.description}
          </p>
        )}
        {ids.hasError && (
          <FieldMessage id={ids.errorId} tone="error" className="mt-[5px]">
            {props.error}
          </FieldMessage>
        )}
        {ids.showReason && (
          <FieldMessage id={ids.reasonId} tone="hint" className="mt-[5px]">
            {props.disabledReason}
          </FieldMessage>
        )}
      </div>
    </div>
  )
}

/** A yes/no choice that takes effect with the form: a checkbox with its label. */
export function CheckboxField(props: CheckboxFieldProps) {
  return (
    <InlineField
      {...props}
      control={({ onCheckedChange, ...control }) => (
        <Checkbox
          {...control}
          onCheckedChange={(checked) => {
            onCheckedChange(checked === true)
          }}
          className={cn(
            'mt-0',
            control['aria-invalid'] && 'border-status-danger-fg',
            control['aria-readonly'] && 'cursor-default',
          )}
        />
      )}
    />
  )
}

export type SwitchFieldProps = CheckboxFieldProps

/** A setting that is on or off, often taking effect at once: a switch with its label. */
export function SwitchField(props: SwitchFieldProps) {
  return (
    <InlineField
      {...props}
      control={(control) => (
        <Switch {...control} className={cn(control['aria-readonly'] && 'cursor-default')} />
      )}
    />
  )
}

import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * The frame of every field (BUILD-PLAN P2.2): label, optional description, the control, and under
 * it the error or the reason it is disabled. Mantine 9.6.2 Input.Wrapper (Input.css, InputWrapper):
 * label 13px weight 600; description and error at the label size minus 2px (12px here, the
 * smallest A.5 size) with line height 1.2 (A.5 tight, 1.25, here); the control 5px (10 / 2) below
 * a description and above an error. The required mark is Mantine's " *" in the error colour.
 *
 * Owner's decisions (2026-09-25, docs/decisions.md "Fields"):
 * - Error: the message sits under the field in status.danger.fg with an icon, the control's border
 *   takes the same colour, the control is aria-invalid and the message is linked with
 *   aria-describedby. Colour is never the only signal.
 * - Read-only is plain text in the full text colour, without border or background, at the same
 *   height and padding as an editable control; selectable, copyable and announced as read-only.
 *   It is not disabled.
 * - Disabled shows its reason, when given, as visible text under the control.
 */

/** What every field takes, besides its value. */
export interface FieldBaseProps {
  /** The field's name for the user. From the application. */
  label: ReactNode
  /** A hint under the label. */
  description?: ReactNode
  /** The problem with the value, shown under the field. The field is marked invalid while set. */
  error?: ReactNode
  /** Marks the field with " *" and as required for assistive technology. */
  required?: boolean
  /** Shows the value as text that can be selected and copied, not changed. Not disabled. */
  readOnly?: boolean
  /** The field cannot be used. Give `disabledReason` so the user sees why. */
  disabled?: boolean
  /** Why the field is disabled, shown as text under it. */
  disabledReason?: ReactNode
  /** The control's id. Default: generated. */
  id?: string
  /** Layout classes for the field's frame (width, margins). */
  className?: string
}

/** What the control inside a Field receives. */
export interface FieldControl {
  id: string
  /** The id of the label element. */
  labelId: string
  /** The description, error and disabled reason, for the control's aria-describedby. */
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  readOnly: boolean
  disabled: boolean
}

export interface FieldProps extends FieldBaseProps {
  /**
   * The label names a group of controls (radio buttons) rather than one control: it is not a
   * <label> element, and the group points to it with aria-labelledby.
   */
  group?: boolean
  /** Renders the control with the ids and states it needs. */
  children: (control: FieldControl) => ReactNode
}

/** The required mark after a label: " *" in the error colour; its name comes from messages. */
export function RequiredMark() {
  const { messages } = useLiro()
  return (
    <span aria-hidden="true" title={messages['field.required']} className="text-status-danger-fg">
      {' *'}
    </span>
  )
}

/** A message under a control: the error (with an icon) or a hint. */
export function FieldMessage({
  id,
  tone,
  children,
  className,
}: {
  id: string
  tone: 'error' | 'hint'
  children: ReactNode
  className?: string
}) {
  return (
    <p
      id={id}
      className={cn(
        'm-0 flex items-start gap-1 text-xs leading-tight',
        tone === 'error' ? 'text-status-danger-fg' : 'text-secondary',
        className,
      )}
    >
      {tone === 'error' && <CircleAlert aria-hidden="true" className="mt-px size-3 shrink-0" />}
      <span>{children}</span>
    </p>
  )
}

/** The ids and describedBy of a field's parts. */
export function useFieldIds(props: FieldBaseProps) {
  const generated = useId()
  const id = props.id ?? `field-${generated}`
  const hasError = props.error !== undefined && props.error !== null && props.error !== false
  const hasDescription = props.description !== undefined && props.description !== null
  const showReason =
    props.disabled === true &&
    !hasError &&
    props.disabledReason !== undefined &&
    props.disabledReason !== null
  const ids = {
    id,
    labelId: `${id}-label`,
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
    reasonId: `${id}-reason`,
  }
  const describedBy =
    [
      hasDescription ? ids.descriptionId : null,
      hasError ? ids.errorId : null,
      showReason ? ids.reasonId : null,
    ]
      .filter((part) => part !== null)
      .join(' ') || undefined
  return { ...ids, describedBy, hasError, hasDescription, showReason }
}

/**
 * The frame of a field: label, description, control, error or disabled reason. TextField,
 * SelectField and the other fields use it; use it directly only for a control the Design System
 * does not have yet.
 */
export function Field(props: FieldProps) {
  const { label, description, error, required = false, readOnly = false, disabled = false } = props
  const ids = useFieldIds(props)
  const control: FieldControl = {
    id: ids.id,
    labelId: ids.labelId,
    describedBy: ids.describedBy,
    invalid: ids.hasError,
    required,
    readOnly,
    disabled,
  }
  const labelClass = 'inline-block text-sm font-semibold break-words text-primary'
  return (
    <div
      data-slot="field"
      data-invalid={ids.hasError || undefined}
      data-readonly={readOnly || undefined}
      data-disabled={disabled || undefined}
      className={cn('flex min-w-0 flex-col font-sans', props.className)}
    >
      {props.group === true ? (
        <span id={ids.labelId} className={labelClass}>
          {label}
          {required && <RequiredMark />}
        </span>
      ) : (
        <label id={ids.labelId} htmlFor={ids.id} className={labelClass}>
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      {ids.hasDescription && (
        <p id={ids.descriptionId} className="m-0 text-xs leading-tight text-secondary">
          {description}
        </p>
      )}
      <div
        className={cn(
          ids.hasDescription && 'mt-[5px]',
          (ids.hasError || ids.showReason) && 'mb-[5px]',
        )}
      >
        {props.children(control)}
      </div>
      {ids.hasError && (
        <FieldMessage id={ids.errorId} tone="error">
          {error}
        </FieldMessage>
      )}
      {ids.showReason && (
        <FieldMessage id={ids.reasonId} tone="hint">
          {props.disabledReason}
        </FieldMessage>
      )}
    </div>
  )
}

/** The attributes a Field gives its control. */
export function controlAttributes(control: FieldControl, readOnlyTitle: string) {
  return {
    id: control.id,
    'aria-describedby': control.describedBy,
    'aria-invalid': control.invalid || undefined,
    required: control.required,
    disabled: control.disabled,
    readOnly: control.readOnly,
    title: control.readOnly ? readOnlyTitle : undefined,
  }
}

/** The FieldBaseProps of a field's props, without undefined members. */
export function fieldProps(props: FieldBaseProps) {
  const { label, description, error, required, readOnly, disabled, disabledReason, id, className } =
    props
  return {
    label,
    ...(description === undefined ? {} : { description }),
    ...(error === undefined ? {} : { error }),
    ...(required === undefined ? {} : { required }),
    ...(readOnly === undefined ? {} : { readOnly }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(disabledReason === undefined ? {} : { disabledReason }),
    ...(id === undefined ? {} : { id }),
    ...(className === undefined ? {} : { className }),
  }
}

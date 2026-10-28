import { CircleAlert } from 'lucide-react'
import { createContext, useContext, useId, type ReactNode } from 'react'
import { INPUT, READ_ONLY, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * The frame of every field (BUILD-PLAN P2.2): label, the control, and under it the optional
 * description, then the error. Mantine 9.6.2 Input.Wrapper (Input.css, InputWrapper):
 * label 13px weight 600; description and error at the label size minus 2px (12px here, the
 * smallest A.5 size) with line height 1.2 (A.5 tight, 1.25, here); the control 5px (10 / 2) above
 * an error. The required mark is Mantine's " *" in the error colour.
 *
 * The control sits 4px (spacing xxs) under the label (owner, P3.2a). The description is a hint
 * UNDER the control, never between the label and the control (owner, P5.90 item 18): fields side
 * by side in one row keep their controls on one line whether or not they have a hint.
 *
 * Owner's decisions (2026-09-25, docs/decisions.md "Fields"):
 * - Error: the message sits under the field in status.danger.fg with an icon, the control's border
 *   takes the same colour, the control is aria-invalid and the message is linked with
 *   aria-describedby. Colour is never the only signal.
 * - One state for a field that cannot be changed: read-only (owner, P5.93 item 1; fields have no
 *   disabled state). It looks like the old disabled field — the grey surface.disabled background
 *   and a drawn border.default — but the value stays in the full text colour: readable,
 *   selectable, copyable, focusable and announced as read-only (native `readonly`, or
 *   `aria-readonly` where the role takes it). No hint and no placeholder in read-only; an empty
 *   value shows "—" (READ_ONLY_EMPTY). The error, when the application gives one, still shows.
 */

/** What a read-only field shows for an empty value (P5.93 item 1). */
export const READ_ONLY_EMPTY = '—'

/** What every field takes, besides its value. */
export interface FieldBaseProps {
  /** The field's name for the user. From the application. */
  label: ReactNode
  /** A hint under the control (never between the label and the control, P5.90). */
  description?: ReactNode
  /** The problem with the value, shown under the field. The field is marked invalid while set. */
  error?: ReactNode
  /** Marks the field with " *" and as required for assistive technology. */
  required?: boolean
  /**
   * The value cannot be changed here: the field is drawn grey with a border, the value stays
   * readable, selectable and focusable; no hint, no placeholder, an empty value shows "—". The
   * one non-editable state of a field (there is no disabled field, P5.93).
   */
  readOnly?: boolean
  /** The control's id. Default: generated. */
  id?: string
  /**
   * Ids of other elements that describe the control (added to its aria-describedby), such as the
   * messages under an editable grid's row.
   */
  describedBy?: string
  /**
   * The label for assistive technology only, where the row around the field already names it (a
   * setting row, P4.6). Description and error stay visible.
   */
  hideLabel?: boolean
  /** Layout classes for the field's frame (width, margins). */
  className?: string
}

/** What the control inside a Field receives. */
export interface FieldControl {
  id: string
  /** The id of the label element. */
  labelId: string
  /** The description and the error, for the control's aria-describedby. */
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  readOnly: boolean
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

/**
 * The required mark after a label: " *" in the error colour, hidden from assistive technology —
 * the control itself is `required` (no browser title on it, P5.93 item 7).
 */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-status-danger-fg">
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
      <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>{children}</span>
    </p>
  )
}

/** The ids and describedBy of a field's parts. */
export function useFieldIds(props: FieldBaseProps) {
  const generated = useId()
  const id = props.id ?? `field-${generated}`
  const hasError = props.error !== undefined && props.error !== null && props.error !== false
  // No hint in read-only (P5.93 item 1): there is nothing to fill in.
  const hasDescription =
    props.readOnly !== true && props.description !== undefined && props.description !== null
  const ids = {
    id,
    labelId: `${id}-label`,
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
  }
  const describedBy =
    [
      hasDescription ? ids.descriptionId : null,
      hasError ? ids.errorId : null,
      props.describedBy ?? null,
    ]
      .filter((part) => part !== null)
      .join(' ') || undefined
  return { ...ids, describedBy, hasError, hasDescription }
}

/**
 * Inside it, every field's label is for assistive technology only, as with `hideLabel` (not
 * exported from the package): a template whose row already names the control — a SettingsPage
 * row — sets it, so a visible label is never written twice (P4.9, the owner's review). A field's
 * own `hideLabel` still wins.
 */
export const FieldLabelsHidden = createContext(false)

/**
 * The frame of a field: label, control, description, error. TextField,
 * SelectField and the other fields use it; use it directly only for a control the Design System
 * does not have yet.
 */
export function Field(props: FieldProps) {
  const { label, description, error, required = false, readOnly = false } = props
  const ids = useFieldIds(props)
  const labelsHidden = useContext(FieldLabelsHidden)
  const hideLabel = props.hideLabel ?? labelsHidden
  const control: FieldControl = {
    id: ids.id,
    labelId: ids.labelId,
    describedBy: ids.describedBy,
    invalid: ids.hasError,
    required,
    readOnly,
  }
  const labelClass = cn(
    'inline-block text-sm font-semibold break-words text-primary',
    TEXT_DIRECTION,
    hideLabel && 'sr-only',
  )
  return (
    <div
      data-slot="field"
      data-invalid={ids.hasError || undefined}
      data-readonly={readOnly || undefined}
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
      {/* A group's options stand 8px under their question, a single control 4px (P5.90 item 16). */}
      <div className={cn(!hideLabel && (props.group === true ? 'mt-2' : 'mt-1'))}>
        {props.children(control)}
      </div>
      {(ids.hasDescription || ids.hasError) && (
        <div data-field-messages="" className="mt-[5px] flex min-w-0 flex-col gap-1">
          {ids.hasDescription && (
            <p
              id={ids.descriptionId}
              className={cn('m-0 text-xs leading-tight break-words text-secondary', TEXT_DIRECTION)}
            >
              {description}
            </p>
          )}
          {ids.hasError && (
            <FieldMessage id={ids.errorId} tone="error">
              {error}
            </FieldMessage>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The attributes a Field gives its control. Read-only: native `readonly` (read by assistive
 * technology; no native `title`, P5.93 item 7) and "—" where the value is empty (the placeholder,
 * P5.93 item 1).
 */
export function controlAttributes(control: FieldControl) {
  return {
    id: control.id,
    'aria-describedby': control.describedBy,
    'aria-invalid': control.invalid || undefined,
    required: control.required,
    readOnly: control.readOnly,
    ...(control.readOnly ? { placeholder: READ_ONLY_EMPTY } : {}),
  }
}

/** The FieldBaseProps of a field's props, without undefined members. */
export function fieldProps(props: FieldBaseProps) {
  const { label, description, error, required, readOnly, id, className, describedBy, hideLabel } =
    props
  return {
    label,
    ...(description === undefined ? {} : { description }),
    ...(error === undefined ? {} : { error }),
    ...(required === undefined ? {} : { required }),
    ...(readOnly === undefined ? {} : { readOnly }),
    ...(id === undefined ? {} : { id }),
    ...(className === undefined ? {} : { className }),
    ...(hideLabel === undefined ? {} : { hideLabel }),
    ...(describedBy === undefined || describedBy === '' ? {} : { describedBy }),
  }
}

/**
 * A read-only value that is not one line of text (MultiSelectField's pills, a rich text, a code's
 * boxes): the read-only look of every field (READ_ONLY), focusable and selectable, read as a
 * read-only text box named by the field's label (P5.93 item 1). Empty: "—".
 */
export function ReadOnlyBox({
  control,
  empty,
  className,
  children,
}: {
  control: FieldControl
  /** Whether there is no value: the box shows "—". */
  empty: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      id={control.id}
      role="textbox"
      aria-readonly="true"
      aria-multiline="true"
      aria-labelledby={control.labelId}
      aria-describedby={control.describedBy}
      aria-invalid={control.invalid || undefined}
      tabIndex={0}
      data-slot="read-only"
      className={cn(INPUT, READ_ONLY, 'h-auto min-h-control py-[5.5px] select-text', className)}
    >
      {empty ? <span className="text-secondary">{READ_ONLY_EMPTY}</span> : children}
    </div>
  )
}

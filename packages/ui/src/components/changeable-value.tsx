import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'

/*
 * ChangeableValue (P4.9, the owner's review; docs/decisions.md "Draft documents"): a value the
 * system filled in — a draft's number, its date, its due date — shown as a value, not as an empty
 * or pre-filled field, with a way to change it.
 * - Read: the label xs text.secondary above, the value sm medium (tabular digits), then a 28px
 *   subtle pencil (the edit intent, CompactIconButton) named "Change <label>"
 *   (`messages['value.change']`).
 * - The pencil turns it into the application's field (`field`, with its own label), which takes
 *   the focus; it stays a field from then on — the value is the user's now. `editing` and
 *   `onEditingChange` make it controlled (the Core may open it, e.g. on a validation error).
 */

export interface ChangeableValueProps {
  /** What the value is ("Issue date"). */
  label: string
  /** The value as text: DateText, MoneyText, a number. */
  value: ReactNode
  /**
   * The field that changes it, with the same label (DateField, SelectField, TextField …).
   * Without it the value is read-only here: no pencil, the same alignment.
   */
  field?: ReactNode
  /** Shown as the field; default: uncontrolled, false until the pencil is pressed. */
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
  className?: string
}

/** A value the system filled in, which the user may change. */
export function ChangeableValue(props: ChangeableValueProps) {
  const { messages } = useLiro()
  const [ownEditing, setOwnEditing] = useState(false)
  const editing = props.editing ?? ownEditing
  const fieldRef = useRef<HTMLDivElement>(null)
  const opened = useRef(false)

  useEffect(() => {
    if (!editing || !opened.current) return
    opened.current = false
    fieldRef.current?.querySelector<HTMLElement>('input, textarea, button, select')?.focus()
  }, [editing])

  if (editing && props.field !== undefined) {
    return (
      <div ref={fieldRef} data-slot="changeable-value" className={cn('min-w-0', props.className)}>
        {props.field}
      </div>
    )
  }
  return (
    <div
      data-slot="changeable-value"
      className={cn('flex min-w-0 flex-col gap-0.5 font-sans', props.className)}
    >
      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{props.label}</span>
      <span className="flex min-h-7 items-center gap-1">
        <span className={cn('text-sm font-medium text-primary tabular-nums', TEXT_DIRECTION)}>
          {props.value}
        </span>
        {props.field !== undefined && (
          <CompactIconButton
            intent="edit"
            label={messages['value.change'](props.label)}
            onClick={() => {
              opened.current = true
              setOwnEditing(true)
              props.onEditingChange?.(true)
            }}
          />
        )}
      </span>
    </div>
  )
}

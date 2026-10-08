import { Check, Minus } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  isAllowed,
  matrixFocusTarget,
  setPermission,
  type MatrixCell,
  type PermissionValue,
} from './admin-logic'
import { CheckboxField } from './checkbox-field'
import { Tooltip } from './popover'
import { usePhone } from './use-phone'

/*
 * PermissionMatrix (BUILD-PLAN P5.21, users and roles): what a role may do, areas × actions, for
 * a company administrator. The roles, areas, actions and rules are the Core's.
 * - A table: the areas as row headers (name sm semibold, an optional description xs), the actions
 *   as column headers (centred, xs semibold), a checkbox in each cell named "Edit: Sales
 *   invoices" (`messages['permissions.cell']`).
 * - A cell the action does not apply to (`applies` false: a report cannot be deleted) shows a
 *   dash, "Not applicable" for assistive technology. A cell that is unavailable (`unavailable`
 *   gives the reason: "Only an Administrator can change company settings") keeps its checkbox,
 *   drawn disabled but still focusable (`aria-disabled`), with the reason as its description and
 *   in a tooltip; it cannot be changed.
 * - Read-only (a built-in role, `readOnly`): no checkboxes — a check for allowed and a dash for
 *   not allowed, both named (P2.2: read-only is plain text, never disabled controls).
 * - Keyboard: the WAI-ARIA grid — one cell in the tab order; the arrows move one cell (the arrow
 *   pointing forward in the reading direction to the next column, B.7), Home and End to the row's
 *   ends, Ctrl+Home and Ctrl+End to the matrix's corners; Space changes the checkbox.
 * - Phones: each area is a group of its actions as checkboxes, one under the other (a table of
 *   five checkbox columns does not fit 360px).
 * - Changes are reported (`onChange` with the whole value and the one change); the matrix shows
 *   what it is given.
 */

/** An area of the application: a row. */
export interface PermissionArea {
  id: string
  label: string
  description?: string
}

/** An action: a column. */
export interface PermissionAction {
  id: string
  label: string
}

/** One change: the area, the action and whether it is now allowed. */
export interface PermissionChange {
  area: string
  action: string
  allowed: boolean
}

export interface PermissionMatrixProps {
  areas: readonly PermissionArea[]
  actions: readonly PermissionAction[]
  /** What is allowed: area id → action ids. */
  value: PermissionValue
  /** A checkbox changed: the new value and the change. */
  onChange?: (value: PermissionValue, change: PermissionChange) => void
  /** Whether an action applies to an area at all. Default: every action applies. */
  applies?: (area: string, action: string) => boolean
  /** Why a cell cannot be changed, or undefined when it can (the Core's rule). */
  unavailable?: (area: string, action: string) => string | undefined
  /** A built-in role: the values as text, nothing can be changed. */
  readOnly?: boolean
  /** Names the matrix (its caption), from the application: "Permissions of Site manager". */
  label: ReactNode
  /** 'phone' lists the areas one under the other; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The areas × actions of a role: checkboxes, or the values as text for a built-in role. */
export function PermissionMatrix(props: PermissionMatrixProps) {
  const { messages, direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const readOnly = props.readOnly === true
  const [active, setActive] = useState<MatrixCell>({ row: 0, column: 0 })
  const table = useRef<HTMLTableElement>(null)
  const baseId = useId()
  const applies = (area: string, action: string) => props.applies?.(area, action) ?? true
  const actionIds = props.actions.map((action) => action.id)

  const change = (area: string, action: string, allowed: boolean) => {
    props.onChange?.(setPermission(props.value, area, action, allowed, actionIds), {
      area,
      action,
      allowed,
    })
  }

  if (phone) {
    return (
      <div
        data-slot="permission-matrix"
        data-layout="phone"
        className={cn('flex flex-col', props.className)}
      >
        <p className={cn('m-0 mb-3 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {props.label}
        </p>
        {props.areas.map((area) => (
          <fieldset
            key={area.id}
            className="m-0 flex flex-col gap-2 border-0 border-t border-solid border-subtle px-0 py-3 last:pb-0"
          >
            <legend
              className={cn(
                'float-start mb-2 w-full p-0 text-sm font-semibold text-primary',
                TEXT_DIRECTION,
              )}
            >
              {area.label}
              {area.description !== undefined && (
                <span className="block text-xs font-normal text-secondary">{area.description}</span>
              )}
            </legend>
            {props.actions.map((action) => {
              if (!applies(area.id, action.id)) return null
              const allowed = isAllowed(props.value, area.id, action.id)
              if (readOnly) {
                return <ReadOnlyValue key={action.id} allowed={allowed} label={action.label} />
              }
              const reason = props.unavailable?.(area.id, action.id)
              return (
                <CheckboxField
                  key={action.id}
                  label={action.label}
                  checked={allowed}
                  {...(reason === undefined
                    ? {
                        onChange: (next: boolean) => {
                          change(area.id, action.id, next)
                        },
                      }
                    : { disabled: true, disabledReason: reason })}
                />
              )
            })}
          </fieldset>
        ))}
      </div>
    )
  }

  // Only checkboxes take the focus: one of them is in the tab order (roving), the arrows move.
  const focusable = (cell: MatrixCell) => {
    const area = props.areas[cell.row]
    const action = props.actions[cell.column]
    return !readOnly && area !== undefined && action !== undefined && applies(area.id, action.id)
  }
  const firstFocusable =
    props.areas
      .flatMap((_, row) => props.actions.map((__, column) => ({ row, column })))
      .find(focusable) ?? null
  const current = focusable(active) ? active : firstFocusable
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, cell: MatrixCell) => {
    const target = matrixFocusTarget(
      event.key,
      cell,
      props.areas.length,
      props.actions.length,
      direction,
      event.ctrlKey || event.metaKey,
      focusable,
    )
    if (target === null) {
      if (event.key.startsWith('Arrow')) event.preventDefault()
      return
    }
    event.preventDefault()
    setActive(target)
    table.current
      ?.querySelector<HTMLElement>(`[data-cell="${String(target.row)}-${String(target.column)}"]`)
      ?.focus()
  }
  const tabIndex = (cell: MatrixCell) =>
    current !== null && cell.row === current.row && cell.column === current.column ? 0 : -1

  return (
    <div data-slot="permission-matrix" className={cn('min-w-0 overflow-x-auto', props.className)}>
      <table ref={table} className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="pb-3 text-start text-sm font-semibold">
          <span className={cn('block', TEXT_DIRECTION)}>{props.label}</span>
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className={cn(
                'border-0 border-b border-solid border-default px-3 py-2 text-start text-xs font-semibold text-secondary',
              )}
            >
              <span className={TEXT_ISOLATE}>{messages['permissions.area']}</span>
            </th>
            {props.actions.map((action) => (
              <th
                key={action.id}
                scope="col"
                className="min-w-20 border-0 border-b border-solid border-default px-3 py-2 text-center text-xs font-semibold text-secondary"
              >
                <span className={TEXT_ISOLATE}>{action.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.areas.map((area, row) => (
            <tr
              key={area.id}
              className="border-0 border-b border-solid border-subtle last:border-b-0"
            >
              <th scope="row" className="px-3 py-2 text-start font-normal">
                <span className={cn('block text-sm font-semibold', TEXT_DIRECTION)}>
                  {area.label}
                </span>
                {area.description !== undefined && (
                  <span className={cn('block text-xs text-secondary', TEXT_DIRECTION)}>
                    {area.description}
                  </span>
                )}
              </th>
              {props.actions.map((action, column) => {
                const cell = { row, column }
                const key = `${String(row)}-${String(column)}`
                const allowed = isAllowed(props.value, area.id, action.id)
                const name = messages['permissions.cell'](area.label, action.label)
                const onFocus = () => {
                  setActive(cell)
                }
                if (!applies(area.id, action.id) || readOnly) {
                  const text = !applies(area.id, action.id)
                    ? messages['permissions.notApplicable']
                    : allowed
                      ? messages['permissions.allowed']
                      : messages['permissions.notAllowed']
                  return (
                    <td key={action.id} className="px-3 py-2 text-center text-secondary">
                      {applies(area.id, action.id) && allowed ? (
                        <Check
                          aria-hidden="true"
                          className="inline-block size-4 align-middle text-primary"
                        />
                      ) : (
                        <Minus
                          aria-hidden="true"
                          className="inline-block size-4 align-middle text-tertiary"
                        />
                      )}
                      <span className="sr-only">{text}</span>
                    </td>
                  )
                }
                const reason = props.unavailable?.(area.id, action.id)
                const reasonId = `${baseId}-${key}`
                const box = (
                  <Checkbox
                    data-cell={key}
                    aria-label={name}
                    checked={allowed}
                    tabIndex={tabIndex(cell)}
                    onFocus={onFocus}
                    onKeyDown={(event) => {
                      onKeyDown(event, cell)
                    }}
                    {...(reason === undefined
                      ? {
                          onCheckedChange: (next) => {
                            change(area.id, action.id, next === true)
                          },
                        }
                      : {
                          'aria-disabled': true,
                          'aria-describedby': reasonId,
                          onClick: (event) => {
                            event.preventDefault()
                          },
                          className:
                            'cursor-not-allowed border-default bg-surface-disabled text-disabled data-[state=checked]:not-disabled:border-default data-[state=checked]:not-disabled:bg-surface-disabled',
                        })}
                  />
                )
                return (
                  <td key={action.id} className="px-3 py-2 text-center">
                    <span className="inline-flex align-middle">
                      {reason === undefined ? box : <Tooltip label={reason}>{box}</Tooltip>}
                    </span>
                    {reason !== undefined && (
                      <span id={reasonId} className="sr-only">
                        {reason}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A read-only value on phones: the action and a check or a dash, named. */
function ReadOnlyValue({ allowed, label }: { allowed: boolean; label: string }) {
  const { messages } = useLiro()
  return (
    <div className="flex items-center gap-2 text-sm text-primary">
      {allowed ? (
        <Check aria-hidden="true" className="size-4 shrink-0" />
      ) : (
        <Minus aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
      )}
      <span className={TEXT_DIRECTION}>{label}</span>
      <span className="sr-only">
        {allowed ? messages['permissions.allowed'] : messages['permissions.notAllowed']}
      </span>
    </div>
  )
}

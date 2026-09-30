import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { cn } from '../primitives/cn'
import { CompactIconButton } from './button'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'

/*
 * One row as a card, the DataTable's phone layout (BUILD-PLAN P3.2), the previous Design System's
 * (the owner, 2026-09-30, docs/decisions.md "Table"): a border, radius md, padding sm (12px), the
 * raised surface; selected: surface.selected with border.brand. The top row: an optional
 * checkbox, the title (13px, semibold, one line) and subtitle (12px, text.secondary, one line),
 * and at the end a badge and the row menu (CompactIconButton). Below, the detail rows: the label
 * (12px, text.tertiary) at the start, the value (12px, weight 500, tabular digits) at the end,
 * 2px apart. Gaps the owner did not give are Mantine's Group and Stack default, md (16px).
 */

/** One label and value of a card. */
export interface CardDetail {
  key: string
  label: ReactNode
  value: ReactNode
}

export interface DataTableCardProps {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  details: readonly CardDetail[]
  selected: boolean
  /** With it, the card has a checkbox named `selectLabel`. */
  onSelectedChange?: (selected: boolean) => void
  selectLabel: string
  /** The row menu, named `actionsLabel`. */
  actions?: readonly MenuEntry[]
  actionsLabel: string
  /** Pressing the card (pointer, or Enter on the focused card). */
  onPress?: () => void
  /** The card's position for a virtual list. */
  index?: number
}

/** Keeps a press on a control inside the card (checkbox, menu, link) from pressing the card. */
export function fromControl(event: MouseEvent | KeyboardEvent): boolean {
  const target = event.target as Element
  // Menus render in a portal; their events still bubble through the React tree.
  if (!event.currentTarget.contains(target)) return true
  return target.closest('button, a, input, select, textarea, [role="checkbox"]') !== null
}

/** A row of a DataTable on a phone. */
export function DataTableCard(props: DataTableCardProps) {
  const { onPress } = props
  return (
    <div
      data-index={props.index}
      {...(onPress === undefined
        ? {}
        : {
            tabIndex: 0,
            onClick: (event: MouseEvent) => {
              if (!fromControl(event)) onPress()
            },
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key === 'Enter' && !fromControl(event)) {
                event.preventDefault()
                onPress()
              }
            },
          })}
      className={cn(
        'flex flex-col gap-4 rounded-md border border-solid p-3 text-primary',
        props.selected ? 'border-brand bg-surface-selected' : 'border-default bg-surface-raised',
        onPress !== undefined &&
          'cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
      )}
    >
      <div className="flex items-center gap-4">
        {props.onSelectedChange !== undefined && (
          <Checkbox
            checked={props.selected}
            onCheckedChange={(value) => {
              props.onSelectedChange?.(value === true)
            }}
            aria-label={props.selectLabel}
            className="flex size-4 after:-inset-1 [&_svg]:size-2.5"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{props.title}</span>
          {props.subtitle !== undefined && (
            <span className="truncate text-xs text-secondary">{props.subtitle}</span>
          )}
        </div>
        {props.badge !== undefined && <div className="shrink-0">{props.badge}</div>}
        {props.actions !== undefined && (
          <DropdownMenu
            align="end"
            trigger={<CompactIconButton intent="more" label={props.actionsLabel} />}
            entries={props.actions}
          />
        )}
      </div>
      {props.details.length > 0 && (
        <dl className="m-0 flex flex-col gap-0.5">
          {props.details.map((detail) => (
            <div key={detail.key} className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-tertiary">{detail.label}</dt>
              <dd className="m-0 text-end text-xs font-medium tabular-nums">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

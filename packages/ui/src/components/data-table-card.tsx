import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { CompactIconButton } from './button'
import { rowKeyAction } from './data-table-logic'
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
  /** Pressing the card (pointer, or Space or Enter on the focused card). */
  onPress?: () => void
  /** Enter opens the record instead of pressing the card (the table's `onRowOpen`). */
  onOpen?: () => void
  /** The card's position for a virtual list. */
  index?: number
  /**
   * A row of a flat list inside a card (P4.9: no cards inside a card): no border or radius of its
   * own, padding 12px by 16px; the list draws the dividers.
   */
  flat?: boolean
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
      data-liro-surface={props.selected ? 'selected' : undefined}
      {...(onPress === undefined
        ? {}
        : {
            tabIndex: 0,
            onClick: (event: MouseEvent) => {
              if (!fromControl(event)) onPress()
            },
            onKeyDown: (event: KeyboardEvent) => {
              if (fromControl(event)) return
              const action = rowKeyAction(event.key, props.onOpen !== undefined)
              if (action === null) return
              event.preventDefault()
              if (action === 'open') props.onOpen?.()
              else onPress()
            },
          })}
      className={cn(
        'flex flex-col text-primary',
        props.flat === true
          ? cn(
              'gap-3 px-4 py-3',
              // Selected: the neutral selection and the 3px start bar; the start padding gives
              // back the bar's width, so the content does not move.
              props.selected
                ? 'border-0 border-s-[3px] border-solid border-selected bg-surface-selected ps-3.25'
                : 'bg-surface-raised',
            )
          : cn(
              'gap-4 rounded-md border border-solid p-3',
              // Selected (P3.6, owner): neutral, with a 3px start bar; the start padding gives
              // back the 2px the bar adds, so the content does not move.
              props.selected
                ? 'border-s-[3px] border-selected bg-surface-selected ps-2.5'
                : 'border-default bg-surface-raised',
            ),
        onPress !== undefined &&
          cn(
            'cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-focus',
            props.flat === true
              ? 'focus-visible:-outline-offset-2'
              : 'focus-visible:outline-offset-2',
          ),
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
          <span className={cn('truncate text-sm font-semibold', TEXT_DIRECTION)}>
            {props.title}
          </span>
          {props.subtitle !== undefined && (
            <span className={cn('truncate text-xs text-secondary', TEXT_DIRECTION)}>
              {props.subtitle}
            </span>
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
              <dt className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{detail.label}</dt>
              <dd className="m-0 text-end text-xs font-medium tabular-nums">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

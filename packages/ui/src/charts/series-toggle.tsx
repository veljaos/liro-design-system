import type { ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * ChartSeriesToggle (P4.7a, shadcn/ui's interactive chart header): the series a chart shows, as
 * toggle buttons in its header — each the series' name (xs, text.secondary) and its total (lg
 * semibold, tabular; the application's, never added here). The chosen one is the neutral selection
 * (surface.selected with a 2px border.selected line under it, D17), never blue. One at a time by
 * default; `multiple` lets several be shown.
 */

export interface ChartSeriesToggleItem {
  key: string
  label: string
  /** The series' total for the period, as text ("24.828,40 RSD"): from the application. */
  total?: ReactNode
}

export interface ChartSeriesToggleProps {
  /** Names the group for assistive technology ("Series shown"). */
  label: string
  items: readonly ChartSeriesToggleItem[]
  /** The keys shown. */
  value: readonly string[]
  onValueChange: (value: string[]) => void
  /** Several at once; at least one stays chosen. Default: one at a time. */
  multiple?: boolean
  className?: string
}

/** The series a chart shows, chosen in its header. */
export function ChartSeriesToggle(props: ChartSeriesToggleProps) {
  return (
    <div
      role="group"
      aria-label={props.label}
      className={cn('flex flex-wrap items-stretch gap-1', props.className)}
    >
      {props.items.map((item) => {
        const pressed = props.value.includes(item.key)
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={pressed}
            onClick={() => {
              if (props.multiple !== true) {
                props.onValueChange([item.key])
                return
              }
              const next = pressed
                ? props.value.filter((key) => key !== item.key)
                : [...props.value, item.key]
              if (next.length > 0) props.onValueChange(next)
            }}
            className={cn(
              'box-border flex min-h-11 min-w-24 cursor-pointer flex-col items-start justify-center gap-0.5 rounded-md border-0 border-b-2 border-solid px-3 py-1.5 text-start font-sans',
              pressed
                ? 'border-selected bg-surface-selected'
                : 'border-transparent bg-transparent hover:bg-surface-hover',
              FOCUS_RING,
            )}
          >
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.label}</span>
            {item.total !== undefined && (
              <bdi className="text-lg leading-tight font-semibold text-primary tabular-nums">
                {item.total}
              </bdi>
            )}
          </button>
        )
      })}
    </div>
  )
}

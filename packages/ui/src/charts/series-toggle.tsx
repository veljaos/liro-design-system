import { useContext, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { ChartPhoneContext } from './frame'

/*
 * ChartSeriesToggle (shadcn/ui's "Bar Chart - Interactive"): the key
 * figures of a chart as toggle buttons, passed as the chart's `toggle` so they stand at the end of
 * its header band, full height, a line between each (on phones under the title, side by side
 * across the width). Each is the series' name (xs, text.secondary) and its figure (xl semibold on
 * a desktop, lg on a phone, tabular; the application's, never added here). The chosen one is the
 * neutral selection (surface.selected with a 2px border.selected line along its bottom edge, the
 * header's rule), never blue: it chooses what the chart shows, it is not a tab. One at a time
 * by default; `multiple` lets several be shown.
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
  const phone = useContext(ChartPhoneContext)
  return (
    <div
      role="group"
      aria-label={props.label}
      className={cn('flex min-w-0 flex-1 items-stretch', props.className)}
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
              'm-0 box-border flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col items-start justify-center gap-1 border-0 border-b-2 border-solid px-4 py-3 text-start font-sans not-first:border-s not-first:border-s-default',
              pressed
                ? 'border-b-selected bg-surface-selected'
                : 'border-b-transparent bg-transparent hover:bg-surface-hover',
              'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus',
            )}
          >
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.label}</span>
            {item.total !== undefined && (
              <bdi
                className={cn(
                  'leading-tight font-semibold text-primary tabular-nums',
                  phone ? 'text-lg' : 'text-xl',
                )}
              >
                {item.total}
              </bdi>
            )}
          </button>
        )
      })}
    </div>
  )
}

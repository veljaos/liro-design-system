import { TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * The text in the centre of a donut or a radial chart (P4.7a): a value and its name, sized to the
 * hole. It is an HTML layer over the plot (Recharts draws a polar Label before its sectors exist,
 * at 0,0), so it also keeps the page's text direction. The hole's radius is the ring's inner
 * radius as a share of half the plot's height (the plots are wider than tall); the value's size
 * falls from 20px until it fits about 84% of the hole's width (Noto Sans digits are about 0.6em
 * wide), and never below 12px. The name is xs, text.secondary.
 */

const VALUE_MAX = 20
const VALUE_MIN = 12
const DIGIT_WIDTH = 0.6

/** The value's font size for a hole of this radius: the largest that fits, 12–20px. */
export function centreValueSize(text: string, innerRadius: number): number {
  const room = innerRadius * 2 * 0.84
  const fit = Math.floor(room / (Math.max(text.length, 1) * DIGIT_WIDTH))
  return Math.max(VALUE_MIN, Math.min(VALUE_MAX, fit))
}

/** The value and its name over the plot's centre. */
export function CentreText({
  value,
  name,
  height,
  innerShare,
}: {
  /** The value, already written by the provider's format. */
  value: string
  name: string
  /** The plot's height in pixels. */
  height: number
  /** The ring's inner radius as a share of half the plot (0.58 for "58%"). */
  innerShare: number
}) {
  const holeRadius = (innerShare * height) / 2
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
      <span
        className={cn('leading-tight font-semibold text-primary tabular-nums', TEXT_ISOLATE)}
        style={{ fontSize: centreValueSize(value, holeRadius) }}
      >
        {value}
      </span>
      <span
        className={cn('text-xs text-secondary', TEXT_ISOLATE)}
        style={{ maxWidth: holeRadius * 1.6 }}
      >
        {name}
      </span>
    </div>
  )
}

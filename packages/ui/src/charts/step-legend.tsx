import { TEXT_DIRECTION } from '../primitives/classes'
import { useLiro } from '../provider/liro-provider'
import { stepCount, stepRanges, stepShade, type StepRamp } from './steps'

/*
 * The legend and the "No data" hatching of values in steps (P5.41's RegionChart; Heatmap, P5.93
 * item 44): each step's swatch — its shade laid on the card — with its range written through
 * `format` in the provider's words ("Under 10", "10 to under 50", "50 and more"), or the
 * application's own words; then "No data" with the hatch, when a value is missing.
 */

/** The SVG pattern that hatches a missing value ("No data", never 0). Put once per chart. */
export function NoDataPattern({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <pattern
          id={id}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" style={{ fill: 'var(--liro-surface-sunken)' }} />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            style={{ stroke: 'var(--liro-border-strong)', strokeWidth: 1.5 }}
          />
        </pattern>
      </defs>
    </svg>
  )
}

/** A step's words: the application's, else its range through `format`. */
export function useStepText(
  breaks: readonly string[],
  write: (value: string) => string,
  stepLabels?: readonly string[],
): (step: number) => string {
  const { messages } = useLiro()
  const ranges = stepRanges(breaks)
  return (step) => {
    const own = stepLabels?.[step]
    if (own !== undefined) return own
    const range = ranges[step]
    if (range === undefined) return ''
    if (range.from === null && range.to !== null) return messages['map.stepBelow'](write(range.to))
    if (range.from !== null && range.to === null) return messages['map.stepFrom'](write(range.from))
    if (range.from !== null && range.to !== null) {
      return messages['map.stepBetween'](write(range.from), write(range.to))
    }
    return ''
  }
}

/** The steps' legend, lowest first, and "No data" when a value is missing. */
export function StepLegend({
  breaks,
  ramp,
  stepText,
  pattern,
  missing,
}: {
  breaks: readonly string[]
  ramp: StepRamp
  stepText: (step: number) => string
  /** The hatching pattern's id. */
  pattern: string
  /** Some value is missing: the legend says "No data". */
  missing: boolean
}) {
  const { messages } = useLiro()
  const count = stepCount(breaks)
  return (
    <ul
      data-slot="chart-legend"
      className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-secondary"
    >
      {stepRanges(breaks).map((range) => {
        const shade = stepShade(range.step, count, ramp)
        return (
          <li key={range.step} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-3 shrink-0 rounded-xs border border-solid border-strong bg-surface-raised"
            >
              <span
                className="block size-full"
                style={{ backgroundColor: shade.colour, opacity: shade.opacity }}
              />
            </span>
            <span className={TEXT_DIRECTION}>{stepText(range.step)}</span>
          </li>
        )
      })}
      {missing && (
        <li className="flex items-center gap-1.5">
          <svg aria-hidden="true" className="size-3 shrink-0 rounded-xs" viewBox="0 0 12 12">
            <rect width="12" height="12" fill={`url(#${pattern})`} />
            <rect
              x="0.5"
              y="0.5"
              width="11"
              height="11"
              fill="none"
              style={{ stroke: 'var(--liro-border-strong)' }}
            />
          </svg>
          <span className={TEXT_DIRECTION}>{messages['map.noData']}</span>
        </li>
      )}
    </ul>
  )
}

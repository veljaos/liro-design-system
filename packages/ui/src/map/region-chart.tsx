import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChartCard } from '../charts/frame'
import { plotValue, useFormatValue, type ChartStateProps } from '../charts/shared'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { ChartTooltipContent } from '../primitives/chart-parts'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { MapCanvas, type CanvasLabel, type CanvasShape, type MapBaseLayer } from './map-canvas'
import {
  bubbleRadius,
  geometryBounds,
  geometryPolygons,
  labelPoint,
  pointInArea,
  pointsBounds,
  rampShade,
  regionKeyTarget,
  regionReadingOrder,
  regionStep,
  regionStepCount,
  regionStepRanges,
  unionBounds,
  type LatLng,
  type MapAreaGeometry,
  type RegionRamp,
  type ScreenPoint,
} from './map-logic'

/*
 * RegionChart (P5.41, maps in charts; the owner: "for companies working in several countries, or
 * that want to see their regions"): a choropleth — areas coloured by their value's step — with an
 * optional point or bubble per place. It is a chart of `@veljaos/ui/charts`' kind, drawn on the
 * map subpath's Leaflet SVG map without tiles:
 * - The card, its title and description, "Show as table" (the table is the screen reader's and the
 *   keyboard's way), the loading skeleton, the empty state and the error with Retry are the charts'
 *   own (`ChartCard`); the tooltip and its look too (`ChartTooltipContent`).
 * - Values are decimal strings (D4): the step an area falls in is found by comparing the strings
 *   exactly with the application's `breaks` (`regionStep`); only a bubble's size turns a value into
 *   a number (`plotValue`), to draw it. Nothing is added, rounded or ranked.
 * - The steps are one meaning in shades (`rampShade`): the charts' main blue, or neutral grey,
 *   laid on the card at 25% up to 100% — never a rainbow, never a status colour. An area without
 *   a value is hatched and says "No data", never 0.
 * - The legend writes each step's range through `format` in the provider's words ("Under 1,000",
 *   "1,000 to under 5,000", "5,000 and more"), or the application's own words (`stepLabels`).
 * - Keyboard: the map is one Tab stop; the arrows move between the areas in reading order (rows
 *   north to south, each from the page's start), show the tooltip and announce the area and its
 *   value; Enter or Space chooses; Escape hides the tooltip. A chosen area keeps its fill and takes
 *   the neutral selected line (D17).
 * - The map is never mirrored in right-to-left; the card, the legend and the table are.
 * - The geometry is the application's (GeoJSON).
 */

/** One area: its boundary and its value. */
export interface RegionChartArea {
  id: string
  name: string
  /** GeoJSON Polygon or MultiPolygon, [longitude, latitude]. */
  geometry: MapAreaGeometry
  /** A decimal string; null (or unreadable) is "No data", hatched — never 0. */
  value: string | null
  /** A line under the name in the tooltip and the table, the application's words ("+12% on 2025"). */
  detail?: string
}

/** A place on the map (an office, a shop): a point, or a bubble sized by its value. */
export interface RegionChartPlace extends LatLng {
  id: string
  name: string
  /** A decimal string; with values the places are bubbles. */
  value?: string | null
}

export interface RegionChartProps extends ChartStateProps {
  title: string
  description?: string
  /** The values' name: the table's column and the tooltip's row ("Revenue"). */
  valueLabel: string
  areas: readonly RegionChartArea[]
  /**
   * Where the steps change, ascending decimal strings: n breaks make n + 1 steps (at most five;
   * four breaks). A value at a break belongs to the step above it.
   */
  breaks: readonly string[]
  /** The application's words for the steps, lowest first; default the ranges through `format`. */
  stepLabels?: readonly string[]
  /** The shades' meaning: the charts' main blue (default) or neutral grey. */
  ramp?: RegionRamp
  /** Values are amounts in this currency (written by `format.money`). */
  currency?: string
  decimals?: number
  /** Places drawn over the areas: points, or bubbles when they carry values. */
  places?: readonly RegionChartPlace[]
  /** The places' name, in the legend and as their table's title ("Offices"). */
  placeLabel?: string
  /** The chosen area (controlled). */
  selected?: string | null
  /** The chosen area at first (uncontrolled). */
  defaultSelected?: string
  onSelect?: (id: string) => void
  /** The application's base map; without it (the usual case for a chart) only the areas are drawn. */
  baseLayer?: MapBaseLayer
  /** The map's height in pixels. Default 380 (300 on phones). */
  height?: number
  /** The application's controls in the header (a period select). */
  controls?: ReactNode
  /** The key figures as toggle buttons (a ChartSeriesToggle) at the header's end (P5.93 item 42). */
  toggle?: ReactNode
  /** Default: from the viewport (below 48em 'phone'). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const TOOLTIP_HALF = 124

/** A choropleth: areas coloured by their value's step, with points or bubbles for places. */
export function RegionChart(props: RegionChartProps) {
  const { messages, direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const height = props.height ?? (phone ? 300 : 380)
  const ramp = props.ramp ?? 'main'
  const write = useFormatValue(props.currency, props.decimals)
  const pattern = `liro-no-data-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [inner, setInner] = useState<string | null>(props.defaultSelected ?? null)
  const selected = props.selected === undefined ? inner : props.selected
  const [active, setActive] = useState<string | null>(null)
  const [hover, setHover] = useState<{ id: string; at: ScreenPoint } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [ready, setReady] = useState(false)

  const count = regionStepCount(props.breaks)
  const valueText = (value: string | null | undefined): string =>
    regionStep(value, []) === null ? messages['map.noData'] : write(value)

  // Every area's step and paint, its label point and the polygon the label stands in.
  const drawn = useMemo(
    () =>
      props.areas.map((area) => {
        const step = regionStep(area.value, props.breaks)
        const at = labelPoint(area.geometry)
        const rings =
          at === null
            ? []
            : (geometryPolygons(area.geometry).find((each) =>
                pointInArea(at, {
                  type: 'Polygon',
                  coordinates: each.map((ring) =>
                    ring.map((point) => [point.lng, point.lat] as const),
                  ),
                }),
              ) ?? [])
        const paint =
          step === null
            ? { fill: `url(#${pattern})`, opacity: 1 }
            : (() => {
                const shade = rampShade(step, count, ramp)
                return { fill: shade.colour, opacity: shade.opacity }
              })()
        return { area, step, at, rings, paint }
      }),
    [props.areas, props.breaks, count, ramp, pattern],
  )

  // The keys' order: reading order of the label points.
  const order = useMemo(() => {
    const placed = drawn.flatMap((each) => (each.at === null ? [] : [{ ...each, at: each.at }]))
    const lats = placed.map((each) => each.at.lat)
    const span = lats.length === 0 ? 0 : Math.max(...lats) - Math.min(...lats)
    return regionReadingOrder(placed, direction, Math.max(span / 6, 0.0001))
  }, [drawn, direction])

  const largest = useMemo(() => {
    const values = (props.places ?? []).map((place) => plotValue(place.value))
    const readable = values.filter((value): value is number => value !== null)
    return readable.length === 0 ? null : Math.max(...readable)
  }, [props.places])
  const bubbles = largest !== null

  const shapes = useMemo((): CanvasShape[] => {
    const list: CanvasShape[] = drawn.map(({ area, paint }) => ({
      kind: 'area',
      id: area.id,
      geometry: area.geometry,
      tone: 'neutral',
      selected: area.id === selected,
      active: area.id === active,
      interactive: true,
      paint,
    }))
    for (const place of props.places ?? []) {
      list.push({
        kind: 'dot',
        id: `place-${place.id}`,
        at: { lat: place.lat, lng: place.lng },
        look: bubbles ? 'bubble' : 'point',
        ...(bubbles ? { radius: bubbleRadius(plotValue(place.value), largest) } : {}),
      })
    }
    return list
  }, [drawn, selected, active, props.places, bubbles, largest])

  const labels = useMemo(
    (): CanvasLabel[] =>
      drawn.flatMap(({ area, at, rings }) =>
        at === null
          ? []
          : [{ id: area.id, at, text: area.name, rings, strong: area.id === selected }],
      ),
    [drawn, selected],
  )

  const bounds = useMemo(
    () =>
      unionBounds([
        ...props.areas.map((area) => geometryBounds(area.geometry)),
        pointsBounds(props.places ?? []),
      ]),
    [props.areas, props.places],
  )

  const choose = (id: string) => {
    setInner(id)
    props.onSelect?.(id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setActive(null)
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && active !== null) {
      event.preventDefault()
      choose(active)
      return
    }
    const index = order.findIndex((each) => each.area.id === active)
    const target = regionKeyTarget(index, event.key, order.length, direction)
    if (target === null) return
    event.preventDefault()
    const next = order[target]
    if (next === undefined) return
    setHover(null)
    setActive(next.area.id)
    setAnnouncement(messages['map.areaValue'](next.area.name, valueText(next.area.value)))
  }

  const ranges = regionStepRanges(props.breaks)
  const stepText = (index: number): string => {
    const own = props.stepLabels?.[index]
    if (own !== undefined) return own
    const range = ranges[index]
    if (range === undefined) return ''
    if (range.from === null && range.to !== null) return messages['map.stepBelow'](write(range.to))
    if (range.from !== null && range.to === null) return messages['map.stepFrom'](write(range.from))
    if (range.from !== null && range.to !== null) {
      return messages['map.stepBetween'](write(range.from), write(range.to))
    }
    return ''
  }
  const anyMissing = drawn.some((each) => each.step === null)

  const legend = (
    <ul
      data-slot="chart-legend"
      className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-secondary"
    >
      {ranges.map((range) => {
        const shade = rampShade(range.step, count, ramp)
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
      {anyMissing && (
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
      {(props.places ?? []).length > 0 && props.placeLabel !== undefined && (
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 shrink-0 rounded-full border-[1.5px] border-solid border-[var(--liro-text-primary)]"
          />
          <span className={TEXT_DIRECTION}>{props.placeLabel}</span>
        </li>
      )}
    </ul>
  )

  const head = 'border-0 border-b border-solid border-default px-2 py-1.5 font-semibold'
  const cell = 'border-0 border-b border-solid border-subtle px-2 py-1.5'
  const withDetail = props.areas.some((area) => area.detail !== undefined)
  const table = (
    <div className="flex flex-col gap-4 overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{props.title}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, 'text-start')} />
            <th scope="col" className={cn(head, 'text-end')}>
              <span className={TEXT_ISOLATE}>{props.valueLabel}</span>
            </th>
            {withDetail && <th scope="col" className={cn(head, 'text-start')} />}
          </tr>
        </thead>
        <tbody>
          {props.areas.map((area) => (
            <tr key={area.id}>
              <th scope="row" className={cn(cell, 'text-start font-regular')}>
                <span className={TEXT_ISOLATE}>{area.name}</span>
              </th>
              <td
                className={cn(
                  cell,
                  'text-end tabular-nums',
                  regionStep(area.value, []) === null && 'text-secondary',
                )}
              >
                <bdi>{valueText(area.value)}</bdi>
              </td>
              {withDetail && (
                <td className={cn(cell, 'text-start text-secondary')}>
                  <span className={TEXT_ISOLATE}>{area.detail ?? ''}</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {(props.places ?? []).length > 0 && (
        <table className="w-full border-collapse font-sans text-sm text-primary">
          <caption
            className={cn('pb-1 text-start text-xs font-semibold text-secondary', TEXT_DIRECTION)}
          >
            {props.placeLabel ?? props.title}
          </caption>
          <tbody>
            {(props.places ?? []).map((place) => (
              <tr key={place.id}>
                <th scope="row" className={cn(cell, 'text-start font-regular')}>
                  <span className={TEXT_ISOLATE}>{place.name}</span>
                </th>
                {bubbles && (
                  <td className={cn(cell, 'text-end tabular-nums')}>
                    <bdi>{valueText(place.value)}</bdi>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  // The tooltip: at the pointer, or at the area the keys reached.
  const tipId = hover?.id ?? active
  const tipArea = tipId === null ? undefined : drawn.find((each) => each.area.id === tipId)
  const overlay = (
    project: (at: LatLng) => ScreenPoint | null,
    size: { width: number; height: number },
  ): ReactNode => {
    if (tipArea === undefined) return null
    const point = hover === null ? (tipArea.at === null ? null : project(tipArea.at)) : hover.at
    if (point === null || size.width === 0) return null
    const x =
      size.width < TOOLTIP_HALF * 2
        ? size.width / 2
        : Math.min(Math.max(point.x, TOOLTIP_HALF), size.width - TOOLTIP_HALF)
    const below = point.y < 96
    return (
      <div
        data-slot="region-chart-tooltip"
        className={cn(
          'absolute max-w-60 -translate-x-1/2',
          below ? 'translate-y-3.5' : '-translate-y-[calc(100%+14px)]',
        )}
        style={{ insetInlineStart: x, top: point.y }}
      >
        <ChartTooltipContent
          direction={direction}
          indicator="none"
          label={
            <>
              {tipArea.area.name}
              {tipArea.area.detail !== undefined && (
                <span className={cn('block font-regular text-secondary', TEXT_DIRECTION)}>
                  {tipArea.area.detail}
                </span>
              )}
            </>
          }
          rows={[
            {
              key: tipArea.area.id,
              name: props.valueLabel,
              text: valueText(tipArea.area.value),
              color: 'currentColor',
            },
          ]}
        />
      </div>
    )
  }

  const empty = props.areas.length === 0 || drawn.every((each) => each.step === null)
  const waiting = props.loading !== true && props.error === undefined && !empty
  const reveal =
    active === null ? null : (drawn.find((each) => each.area.id === active)?.at ?? null)

  return (
    <div
      data-slot="region-chart"
      {...(!waiting || ready ? { 'data-ready': '' } : {})}
      className={props.className}
    >
      {/* The "No data" hatching, referenced by the areas and the legend's swatch. */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <pattern
            id={pattern}
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
      <ChartCard
        title={props.title}
        {...(props.description === undefined ? {} : { description: props.description })}
        {...(props.controls === undefined ? {} : { controls: props.controls })}
        {...(props.toggle === undefined ? {} : { toggle: props.toggle })}
        {...(props.loading === undefined ? {} : { loading: props.loading })}
        {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
        {...(props.error === undefined ? {} : { error: props.error })}
        empty={empty}
        skeleton="block"
        height={height}
        phone={phone}
        legend={legend}
        table={table}
      >
        <MapCanvas
          label={messages['map.name'](props.title)}
          hint={messages['map.regionKeys']}
          shapes={shapes}
          labels={labels}
          bounds={bounds}
          baseLayer={props.baseLayer}
          height={height}
          surface="raised"
          keyboard={false}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setActive(null)
          }}
          onShapeClick={(id) => {
            choose(id)
          }}
          onShapeHover={(id, at) => {
            setHover(id === null || at === null ? null : { id, at })
          }}
          reveal={reveal}
          overlay={overlay}
          onReady={() => {
            setReady(true)
          }}
        />
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </ChartCard>
    </div>
  )
}

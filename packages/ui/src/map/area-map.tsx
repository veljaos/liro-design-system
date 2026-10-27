import { MapPin } from 'lucide-react'
import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { EmptyState, ErrorState } from '../components/empty-state'
import { usePhone } from '../components/use-phone'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { MapCanvas, type CanvasLabel, type CanvasShape, type MapTiles } from './map-canvas'
import {
  areaAt,
  areaListKeyTarget,
  geometryBounds,
  geometryPolygons,
  labelPoint,
  pointInArea,
  pointsBounds,
  type LatLng,
  unionBounds,
  type MapAreaGeometry,
  type MapAreaTone,
} from './map-logic'

/*
 * AreaMap (BUILD-PLAN P5.41): areas on a map — municipalities, the zones of a city's tax, service
 * areas — drawn as lines and fills in tokens, labelled where the name fits, with the list of
 * every area beside the map. The list is the keyboard's and the screen reader's way (a single
 * choice, the arrow keys move and choose), and choosing an area on the map or in the list marks
 * it neutrally (D17: `border.selected` and `surface.selected`). An optional point (an address)
 * says which area it falls in ("Falls in: Zone II", `pointInArea`). The legend and every word on
 * an area are the application's; every boundary is the application's data (GeoJSON polygons),
 * and the base map's tiles too (`tiles`) — without them only the areas are drawn.
 * Phones: the list first, the map full width under it. The map is never mirrored.
 */

/** One area: its boundary (GeoJSON Polygon or MultiPolygon, [longitude, latitude]) and words. */
export interface MapArea {
  id: string
  name: string
  /** A line under the name in the list, the application's words ("Rate from the city's decision"). */
  detail?: string
  geometry: MapAreaGeometry
  /** Its colour: neutral or one of five categories. Default 'neutral'. */
  tone?: MapAreaTone
}

/** A legend entry in the application's words. */
export interface MapLegendEntry {
  tone: MapAreaTone
  label: string
}

/** A point on the map, an address. */
export interface MapPoint extends LatLng {
  /** Its name ("Bulevar oslobođenja 41"). */
  label: string
}

export interface AreaMapProps {
  /** Names the map and the list ("Illustrative zones of Novi Sad"). */
  label: string
  areas: readonly MapArea[]
  legend?: readonly MapLegendEntry[]
  /** A point shown with the area it falls in. */
  point?: MapPoint
  /** The chosen area (controlled). */
  selected?: string | null
  /** The chosen area at first (uncontrolled). */
  defaultSelected?: string
  onSelect?: (id: string) => void
  /** The application's base map; without it only the areas are drawn. */
  tiles?: MapTiles
  /** The map's height in pixels. Default 420 (320 on phones). */
  height?: number
  /** Default: from the viewport (below 48em 'phone'). */
  layout?: 'desktop' | 'phone'
  loading?: boolean
  error?: { message?: string; onRetry: () => void }
  className?: string
}

/** A tone's colour, for the legend's and the list's swatches. Written out. */
export const AREA_SWATCH: Readonly<Record<MapAreaTone, CSSProperties>> = {
  neutral: { borderColor: 'var(--liro-border-strong)' },
  category1: { borderColor: 'var(--liro-chart-category1)' },
  category2: { borderColor: 'var(--liro-chart-category2)' },
  category3: { borderColor: 'var(--liro-chart-category3)' },
  category4: { borderColor: 'var(--liro-chart-category4)' },
  category5: { borderColor: 'var(--liro-chart-category5)' },
}

function Swatch({ tone }: { tone: MapAreaTone }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 box-border size-3.5 shrink-0 rounded-xs border-2 border-solid bg-surface-sunken"
      style={AREA_SWATCH[tone]}
    />
  )
}

/** Areas on a map, with their list, legend and an optional point. */
export function AreaMap(props: AreaMapProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const height = props.height ?? (phone ? 320 : 420)
  const [inner, setInner] = useState<string | null>(props.defaultSelected ?? null)
  const selected = props.selected === undefined ? inner : props.selected
  const [announcement, setAnnouncement] = useState('')
  const [ready, setReady] = useState(false)
  const items = useRef<(HTMLDivElement | null)[]>([])
  const headingId = useId()

  const choose = (id: string) => {
    setInner(id)
    props.onSelect?.(id)
    const area = props.areas.find((each) => each.id === id)
    if (area !== undefined) setAnnouncement(messages['map.chosen'](area.name))
  }

  const point = props.point
  const home = point === undefined ? undefined : areaAt(point, props.areas)

  const shapes = useMemo((): CanvasShape[] => {
    const list: CanvasShape[] = props.areas.map((area) => ({
      kind: 'area',
      id: area.id,
      geometry: area.geometry,
      tone: area.tone ?? 'neutral',
      selected: area.id === selected,
      interactive: true,
    }))
    if (point !== undefined) {
      list.push({ kind: 'dot', id: 'point', at: { lat: point.lat, lng: point.lng }, look: 'point' })
    }
    return list
  }, [props.areas, selected, point])

  const labels = useMemo(
    (): CanvasLabel[] =>
      props.areas.flatMap((area) => {
        const at = labelPoint(area.geometry)
        if (at === null) return []
        // The polygon the name stands in, with its holes.
        const rings =
          geometryPolygons(area.geometry).find((each) =>
            pointInArea(at, {
              type: 'Polygon',
              coordinates: each.map((ring) => ring.map((point) => [point.lng, point.lat] as const)),
            }),
          ) ?? []
        return [{ id: area.id, at, text: area.name, rings, strong: area.id === selected }]
      }),
    [props.areas, selected],
  )

  const bounds = useMemo(
    () =>
      unionBounds([
        ...props.areas.map((area) => geometryBounds(area.geometry)),
        point === undefined ? null : pointsBounds([point]),
      ]),
    [props.areas, point],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const target = areaListKeyTarget(index, event.key, props.areas.length)
    if (target === null) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        const area = props.areas[index]
        if (area !== undefined) choose(area.id)
      }
      return
    }
    event.preventDefault()
    const area = props.areas[target]
    if (area === undefined) return
    choose(area.id)
    items.current[target]?.focus()
  }

  if (props.loading === true) {
    return (
      <div
        role="region"
        aria-label={props.label}
        aria-busy="true"
        data-slot="area-map"
        data-ready=""
        className={cn('flex flex-col gap-3', props.className)}
      >
        {/* A visible loading state (P5.93 item 2): the map's place, and the words over it. */}
        <div className="relative w-full" style={{ height }}>
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <span className="text-sm text-secondary bidi-isolate">{messages['map.loading']}</span>
          </div>
        </div>
      </div>
    )
  }
  if (props.error !== undefined) {
    return (
      <div data-slot="area-map" data-ready="" className={props.className}>
        <ErrorState
          title={props.error.message ?? messages['map.error']}
          action={{ label: messages['map.retry'], onClick: props.error.onRetry }}
        />
      </div>
    )
  }
  if (props.areas.length === 0) {
    return (
      <div data-slot="area-map" data-ready="" className={props.className}>
        <EmptyState title={messages['map.empty']} />
      </div>
    )
  }

  const focusIndex = Math.max(
    0,
    props.areas.findIndex((area) => area.id === selected),
  )
  const list = (
    <section
      aria-labelledby={headingId}
      className={cn('flex min-w-0 flex-col gap-3', !phone && 'w-80 shrink-0')}
    >
      {point !== undefined && (
        <div className="flex items-start gap-2 rounded-md border border-solid border-default bg-surface-raised p-3">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
              {point.label}
            </span>
            <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
              {home === undefined
                ? messages['map.fallsInNone']
                : messages['map.fallsIn'](home.name)}
            </span>
          </span>
        </div>
      )}
      <h3 id={headingId} className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {messages['map.areas']}
      </h3>
      <div role="listbox" aria-label={props.label} className="flex flex-col gap-1">
        {props.areas.map((area, index) => {
          const chosen = area.id === selected
          return (
            <div
              key={area.id}
              ref={(node) => {
                items.current[index] = node
              }}
              role="option"
              aria-selected={chosen}
              tabIndex={index === focusIndex ? 0 : -1}
              data-area-id={area.id}
              {...(chosen ? { 'data-liro-surface': 'selected' } : {})}
              onClick={() => {
                choose(area.id)
              }}
              onKeyDown={(event) => {
                onKeyDown(event, index)
              }}
              className={cn(
                'relative flex min-h-11 cursor-pointer items-start gap-2 rounded-sm px-3 py-2',
                FOCUS_RING,
                chosen
                  ? "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:rounded-s-sm before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"
                  : 'hover:bg-surface-hover',
              )}
            >
              <Swatch tone={area.tone ?? 'neutral'} />
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    'text-sm text-primary',
                    chosen ? 'font-semibold' : 'font-medium',
                    TEXT_DIRECTION,
                  )}
                >
                  {area.name}
                </span>
                {area.detail !== undefined && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {area.detail}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
      {props.legend !== undefined && props.legend.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {messages['map.legend']}
          </h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {props.legend.map((entry) => (
              <li key={`${entry.tone}-${entry.label}`} className="flex items-start gap-2">
                <Swatch tone={entry.tone} />
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{entry.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )

  const canvas = (
    <MapCanvas
      label={messages['map.name'](props.label)}
      shapes={shapes}
      labels={labels}
      bounds={bounds}
      tiles={props.tiles}
      height={height}
      className="min-w-0 flex-1"
      onShapeClick={choose}
      onReady={() => {
        setReady(true)
      }}
    />
  )

  return (
    <div
      data-slot="area-map"
      {...(ready ? { 'data-ready': '' } : {})}
      className={cn(
        'flex min-w-0 gap-4',
        phone ? 'flex-col' : 'flex-row items-start',
        props.className,
      )}
    >
      {phone ? (
        <>
          {list}
          {canvas}
        </>
      ) : (
        <>
          {canvas}
          {list}
        </>
      )}
      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}

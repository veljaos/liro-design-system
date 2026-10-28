import L from 'leaflet'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { IconButton } from '../components/button'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  geometryPolygons,
  labelFits,
  type LatLng,
  type MapAreaGeometry,
  type MapAreaTone,
  type MapBounds,
  type ScreenPoint,
} from './map-logic'

/*
 * The map itself (P5.41), shared by AreaMap and LocationCheck: a thin React wrapper on Leaflet
 * 1.9.4 (BSD-2-Clause) — never react-leaflet (Hippocratic licence) — drawing with SVG (never
 * canvas or WebGL, so a picture is the same every time). Leaflet's own controls, attribution and
 * style sheet are not used: zoom is our IconButtons, the tiles' attribution is written under the
 * map by the component, and `map/map.css` keeps Leaflet's structural rules with tokens.
 * - The base map is optional and off by default (`baseLayer`, P5.93 item 37): the application's
 *   tile source (`url`, a `{z}/{x}/{y}` template, `urlDark` for the dark theme, `maxZoom`) and its
 *   attribution, always shown under the map. The provider, its key and its usage terms are the
 *   application's (the public openstreetmap.org tiles are not for heavy commercial use). Without
 *   it only the shapes are drawn, on a token surface; the library fetches nothing.
 * - Shapes are areas (GeoJSON polygons, coloured by their tone through CSS classes), circles in
 *   metres (an allowed area, an accuracy) and dots (a point, a position). Their colours are CSS
 *   (`map.css`), so they follow the theme.
 * - Labels are HTML over the map, each measured and shown only when it fits inside its area
 *   (`labelFits`): never cut.
 * - Keyboard: the map is one Tab stop, named; the arrow keys pan and + / − zoom (Leaflet's
 *   keyboard handler); the buttons zoom and fit. Nothing needs dragging.
 * - The map is never mirrored in right-to-left (`dir="ltr"` on it); the buttons stand at the
 *   page's end corner.
 */

/**
 * The application's base map (P5.93 item 37): its tile provider, key and usage terms are the
 * application's; the attribution is always shown under the map.
 */
export interface MapBaseLayer {
  /** A tile URL template ("https://tile.example.com/{z}/{x}/{y}.png"), with the application's key. */
  url: string
  /** The tiles' attribution as plain text, always shown under the map ("© OpenStreetMap contributors"). */
  attribution: string
  /** The deepest zoom the provider serves; the map zooms no further. Default 18. */
  maxZoom?: number
  /** Tiles for the dark theme; default `url`. */
  urlDark?: string
}

/**
 * Whether Leaflet has a view yet: projecting a point before the first fit throws ("Set map center
 * and zoom first"), which a chart remounted with new areas (a drill-down, P5.93 item 43) reached.
 */
function hasView(map: L.Map): boolean {
  try {
    map.getCenter()
    return true
  } catch {
    return false
  }
}

/** The deepest zoom of a base map whose `maxZoom` is not given (Leaflet's default). */
const DEFAULT_MAX_ZOOM = 18

export type CanvasShape =
  | {
      kind: 'area'
      id: string
      geometry: MapAreaGeometry
      tone: MapAreaTone
      selected: boolean
      interactive: boolean
      /**
       * A region chart's value (P5.41): the fill is this paint — a ramp's meaning laid on the
       * surface at an opacity, or a pattern (`url(#…)`) for "No data" — and the line is the
       * surface's, thin, between neighbours.
       */
      paint?: { fill: string; opacity: number }
      /** The area the keys reached: a strong line in the text colour. */
      active?: boolean
    }
  | { kind: 'circle'; id: string; centre: LatLng; radius: number; look: 'allowed' | 'accuracy' }
  | {
      kind: 'dot'
      id: string
      at: LatLng
      look: 'point' | 'position' | 'bubble'
      /** Pixels; default 6 (7 for a position). */
      radius?: number
    }

export interface CanvasLabel {
  id: string
  at: LatLng
  text: string
  /** The rings of the label's polygon (outer first), for the fit; without them it is always shown. */
  rings?: readonly (readonly LatLng[])[]
  /** Bold, for the chosen area. */
  strong?: boolean
}

export interface MapCanvasProps {
  /** Names the map for assistive technology ("Map: Illustrative zones of Novi Sad"). */
  label: string
  shapes: readonly CanvasShape[]
  labels?: readonly CanvasLabel[]
  /** What the map shows at first, and again with "Show all". */
  bounds: MapBounds | null
  baseLayer?: MapBaseLayer | undefined
  /**
   * The areas' own attribution (P5.93 item 43: boundary data under an open licence, such as
   * `SERBIA_BOUNDARIES_ATTRIBUTION`), written under the map after the base map's.
   */
  attribution?: string | undefined
  height: number
  onShapeClick?: (id: string) => void
  /** The pointer over an interactive area (its id and the point in the map), or off it (null). */
  onShapeHover?: (id: string | null, at: ScreenPoint | null) => void
  /**
   * Leaflet's keys (default true: the arrows pan, + and − zoom). A region chart turns them off and
   * handles the keys itself (`onKeyDown`: the arrows move between areas).
   */
  keyboard?: boolean
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
  onBlur?: () => void
  /** The keys described for assistive technology; default `messages['map.keys']`. */
  hint?: string
  /** HTML over the map (a tooltip), placed through `project`; drawn again after every move. */
  overlay?: (
    project: (at: LatLng) => ScreenPoint | null,
    size: { width: number; height: number },
  ) => ReactNode
  /** A place to keep in view: the map pans (without animation) when it is out of sight. */
  reveal?: LatLng | null
  /** The map's background: the sunken surface (default) or the card's (a region chart). */
  surface?: 'sunken' | 'raised'
  /** Called once the map is drawn and its labels are measured. */
  onReady?: () => void
  className?: string
}

/** The Leaflet layers of one shape, with our classes (colours are CSS). */
function shapeLayer(shape: CanvasShape): L.Path {
  if (shape.kind === 'area') {
    const latlngs = geometryPolygons(shape.geometry).map((rings) =>
      rings.map((ring) => ring.map((point) => L.latLng(point.lat, point.lng))),
    )
    return L.polygon(latlngs, {
      className: cn(
        'liro-map-area',
        shape.paint === undefined ? `liro-map-tone-${shape.tone}` : 'liro-map-value',
        shape.selected && 'is-selected',
        shape.active === true && 'is-active',
      ),
      interactive: shape.interactive,
      bubblingMouseEvents: false,
    })
  }
  if (shape.kind === 'circle') {
    return L.circle([shape.centre.lat, shape.centre.lng], {
      radius: shape.radius,
      className: `liro-map-${shape.look}`,
      interactive: false,
    })
  }
  return L.circleMarker([shape.at.lat, shape.at.lng], {
    radius: shape.radius ?? (shape.look === 'position' ? 7 : 6),
    className: `liro-map-${shape.look}`,
    interactive: false,
  })
}

/** Leaflet's bounds of ours. */
function leafletBounds(bounds: MapBounds): L.LatLngBounds {
  return L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east])
}

interface PlacedLabel {
  id: string
  text: string
  strong: boolean
  x: number
  y: number
  rings: ScreenPoint[][] | null
}

/** A Leaflet map with our shapes, labels and buttons. */
export function MapCanvas(props: MapCanvasProps) {
  const { messages, colorScheme } = useLiro()
  const hintId = useId()
  const holder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [placed, setPlaced] = useState<PlacedLabel[]>([])
  const [shown, setShown] = useState<ReadonlySet<string> | null>(null)
  const [, setView] = useState(0)
  // Fonts that arrive after the first drawing change every label's size: the labels are measured
  // again then, and the map is ready only once the fonts are (FloorPlan does the same).
  const [fonts, setFonts] = useState<{ settled: boolean; loads: number }>({
    settled: false,
    loads: 0,
  })
  const latest = useRef(props)
  useLayoutEffect(() => {
    latest.current = props
  })
  const moved = useRef(false)

  // The map, once. No animation, so the view after a fit or a zoom is final at once.
  useEffect(() => {
    const element = holder.current
    if (element === null) return
    const instance = L.map(element, {
      zoomControl: false,
      attributionControl: false,
      keyboard: latest.current.keyboard !== false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
      zoomSnap: 0.25,
      renderer: L.svg(),
    })
    instance.on('dragstart zoomstart', () => {
      moved.current = true
    })
    setMap(instance)
    return () => {
      instance.remove()
      setMap(null)
    }
  }, [])

  // Named for assistive technology: one Tab stop, the keys described.
  useEffect(() => {
    const element = holder.current
    if (element === null) return
    element.setAttribute('role', 'region')
    element.setAttribute('aria-label', props.label)
    element.setAttribute('aria-describedby', hintId)
    element.tabIndex = 0
  }, [props.label, hintId, map])

  // The base map, when the application gives one.
  const tileUrl =
    props.baseLayer === undefined
      ? undefined
      : colorScheme === 'dark'
        ? (props.baseLayer.urlDark ?? props.baseLayer.url)
        : props.baseLayer.url
  const maxZoom = props.baseLayer?.maxZoom ?? DEFAULT_MAX_ZOOM
  useEffect(() => {
    if (map === null || tileUrl === undefined) return
    map.setMaxZoom(maxZoom)
    const layer = L.tileLayer(tileUrl, { className: 'liro-map-tiles', maxZoom }).addTo(map)
    return () => {
      layer.remove()
    }
  }, [map, tileUrl, maxZoom])

  // The view: the bounds, with room around; a single point at street level.
  const boundsKey = props.bounds === null ? '' : JSON.stringify(props.bounds)
  const fit = useCallback(() => {
    const bounds = latest.current.bounds
    if (map === null) return
    if (bounds === null) {
      map.setView([0, 0], 1, { animate: false })
      return
    }
    if (bounds.south === bounds.north && bounds.west === bounds.east) {
      map.setView([bounds.south, bounds.west], 16, { animate: false })
      return
    }
    map.fitBounds(leafletBounds(bounds), { padding: [24, 24], animate: false })
  }, [map])
  useEffect(() => {
    moved.current = false
    fit()
  }, [fit, boundsKey])

  // A new size: Leaflet measures again; an untouched map fits its bounds again.
  useEffect(() => {
    const element = holder.current
    if (map === null || element === null) return
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
      if (!moved.current) fit()
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [map, fit])

  // The shapes, redrawn when they change.
  useEffect(() => {
    if (map === null) return
    const group = L.layerGroup().addTo(map)
    for (const shape of props.shapes) {
      const layer = shapeLayer(shape)
      if (shape.kind === 'area' && shape.interactive) {
        layer.on('click', () => {
          latest.current.onShapeClick?.(shape.id)
        })
        layer.on('mousemove', (event: L.LeafletMouseEvent) => {
          latest.current.onShapeHover?.(shape.id, {
            x: event.containerPoint.x,
            y: event.containerPoint.y,
          })
        })
        layer.on('mouseout', () => {
          latest.current.onShapeHover?.(null, null)
        })
      }
      layer.addTo(group)
      // A value's paint is a style (CSS variables and patterns are not attribute values).
      const element = layer.getElement()
      if (shape.kind === 'area' && shape.paint !== undefined && element instanceof SVGElement) {
        element.style.fill = shape.paint.fill
        element.style.fillOpacity = String(shape.paint.opacity)
      }
    }
    return () => {
      group.remove()
    }
  }, [map, props.shapes])

  // The labels' places on the screen, again after every move and zoom.
  const labels = props.labels
  useEffect(() => {
    if (map === null) return
    const place = () => {
      const size = map.getSize()
      if (size.x === 0 || size.y === 0 || !hasView(map)) return
      setPlaced(
        (labels ?? []).map((label) => {
          const point = map.latLngToContainerPoint([label.at.lat, label.at.lng])
          return {
            id: label.id,
            text: label.text,
            strong: label.strong === true,
            x: point.x,
            y: point.y,
            rings:
              label.rings === undefined
                ? null
                : label.rings.map((ring) =>
                    ring.map((each) => {
                      const at = map.latLngToContainerPoint([each.lat, each.lng])
                      return { x: at.x, y: at.y }
                    }),
                  ),
          }
        }),
      )
    }
    const placeAndRedraw = () => {
      place()
      setView((count) => count + 1)
    }
    placeAndRedraw()
    map.on('zoomend moveend resize viewreset', placeAndRedraw)
    return () => {
      map.off('zoomend moveend resize viewreset', placeAndRedraw)
    }
  }, [map, labels])

  useEffect(() => {
    let live = true
    const fontSet = document.fonts
    const settle = () => {
      if (live) setFonts((current) => ({ settled: true, loads: current.loads + 1 }))
    }
    void fontSet.ready.then(settle)
    fontSet.addEventListener('loadingdone', settle)
    return () => {
      live = false
      fontSet.removeEventListener('loadingdone', settle)
    }
  }, [])

  // Measured: a label is shown only where it fits inside its area.
  useLayoutEffect(() => {
    const element = overlay.current
    if (element === null) return
    const next = new Set<string>()
    for (const label of placed) {
      const node = element.querySelector<HTMLElement>(`[data-label-id="${CSS.escape(label.id)}"]`)
      if (node === null) continue
      const fits =
        label.rings === null ||
        labelFits({ x: label.x, y: label.y }, node.offsetWidth, node.offsetHeight, label.rings)
      if (fits) next.add(label.id)
    }
    setShown((current) => {
      if (
        current !== null &&
        current.size === next.size &&
        [...next].every((id) => current.has(id))
      ) {
        return current
      }
      return next
    })
  }, [placed, fonts.loads])

  // The place the keys reached stays in view.
  const reveal = props.reveal
  useEffect(() => {
    if (map === null || reveal === undefined || reveal === null || !hasView(map)) return
    const at = L.latLng(reveal.lat, reveal.lng)
    if (map.getBounds().pad(-0.1).contains(at)) return
    moved.current = true
    map.panInside(at, { padding: [48, 48], animate: false })
  }, [map, reveal])

  const project = (at: LatLng): ScreenPoint | null => {
    if (map === null || !hasView(map)) return null
    const point = map.latLngToContainerPoint([at.lat, at.lng])
    return { x: point.x, y: point.y }
  }

  const mapSize = map?.getSize()
  const size = { width: mapSize?.x ?? 0, height: mapSize?.y ?? 0 }

  const ready = map !== null && shown !== null && fonts.settled
  useEffect(() => {
    if (ready) latest.current.onReady?.()
  }, [ready])

  return (
    <div className={cn('relative isolate min-w-0', props.className)}>
      <p id={hintId} className="sr-only">
        {props.hint ?? messages['map.keys']}
      </p>
      <div
        ref={holder}
        dir="ltr"
        data-slot="map"
        className={cn(
          'liro-map w-full rounded-md border border-solid border-default',
          props.surface === 'raised' && 'liro-map-raised',
        )}
        style={{ height: props.height }}
        {...(props.onKeyDown === undefined ? {} : { onKeyDown: props.onKeyDown })}
        {...(props.onBlur === undefined ? {} : { onBlur: props.onBlur })}
      />
      <div
        ref={overlay}
        dir="ltr"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[450] overflow-hidden rounded-md"
      >
        {placed.map((label) => (
          <span
            key={label.id}
            data-label-id={label.id}
            className={cn(
              'absolute block max-w-48 -translate-x-1/2 -translate-y-1/2 rounded-xs px-1 text-center text-xs leading-tight',
              !label.strong && 'bg-surface-raised text-primary',
              // The chosen area's name stands out: the strong tag (P5.93 item 37).
              label.strong ? 'bg-surface-inverse font-semibold text-on-inverse' : 'font-medium',
              shown?.has(label.id) === true ? 'visible' : 'invisible',
            )}
            style={{ insetInlineStart: label.x, top: label.y }}
          >
            {label.text}
          </span>
        ))}
      </div>
      {props.overlay !== undefined && (
        <div dir="ltr" className="pointer-events-none absolute inset-0 z-[900]">
          {props.overlay(project, size)}
        </div>
      )}
      <div className="absolute end-2 top-2 z-[1000] flex flex-col gap-1">
        <IconButton
          family="neutral"
          icon={ZoomIn}
          label={messages['map.zoomIn']}
          onClick={() => {
            moved.current = true
            map?.zoomIn(1, { animate: false })
          }}
        />
        <IconButton
          family="neutral"
          icon={ZoomOut}
          label={messages['map.zoomOut']}
          onClick={() => {
            moved.current = true
            map?.zoomOut(1, { animate: false })
          }}
        />
        <IconButton
          family="neutral"
          icon={Maximize}
          label={messages['map.showAll']}
          onClick={() => {
            moved.current = false
            fit()
          }}
        />
      </div>
      {(props.baseLayer !== undefined || props.attribution !== undefined) && (
        <p data-slot="map-attribution" className="bidi-content m-0 mt-1 text-xs text-secondary">
          {[props.baseLayer?.attribution, props.attribution]
            .filter((part) => part !== undefined)
            .join(' · ')}
        </p>
      )}
    </div>
  )
}

import { pointInPolygon, polygonCentroid } from '../components/floor-plan-logic'

/*
 * The logic of AreaMap and LocationCheck, apart from the markup so it can be
 * unit-tested. Coordinates are degrees (WGS 84) as GeoJSON writes them: a position
 * is [longitude, latitude]; a point the components take is `{ lat, lng }`. Nothing here is ever
 * mirrored for a right-to-left page: east stays to the right. The verdicts that matter to people
 * (inside a workplace, which tax zone) are the application's; these helpers are what an
 * application may use to reach them, and what the map needs to draw.
 */

/** A point on the earth, in degrees. */
export interface LatLng {
  lat: number
  lng: number
}

/** A GeoJSON position: [longitude, latitude]. */
export type MapPosition = readonly [number, number]

/** A GeoJSON Polygon: its outer ring first, then its holes. */
export interface MapPolygonGeometry {
  type: 'Polygon'
  coordinates: readonly (readonly MapPosition[])[]
}

/** A GeoJSON MultiPolygon: several polygons, each with its outer ring and holes. */
export interface MapMultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: readonly (readonly (readonly MapPosition[])[])[]
}

export type MapAreaGeometry = MapPolygonGeometry | MapMultiPolygonGeometry

/** The south-west and north-east corners of what shapes cover. */
export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

/** A position as a point. */
export function positionPoint(position: MapPosition): LatLng {
  return { lat: position[1], lng: position[0] }
}

/** Every polygon of a geometry, each as its rings of points (outer first). */
export function geometryPolygons(geometry: MapAreaGeometry): LatLng[][][] {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : [...geometry.coordinates]
  return polygons.map((rings) => rings.map((ring) => ring.map(positionPoint)))
}

/** A ring as the plan points FloorPlan's geometry takes: x east, y north. */
function planPoints(ring: readonly LatLng[]) {
  return ring.map((point) => ({ x: point.lng, y: point.lat }))
}

/** Whether a point lies inside a geometry: inside an outer ring and in none of its holes. */
export function pointInArea(point: LatLng, geometry: MapAreaGeometry): boolean {
  const at = { x: point.lng, y: point.lat }
  return geometryPolygons(geometry).some(([outer, ...holes]) => {
    if (outer === undefined || !pointInPolygon(at, planPoints(outer))) return false
    return !holes.some((hole) => pointInPolygon(at, planPoints(hole)))
  })
}

/** The first area a point falls in, or undefined. */
export function areaAt<Area extends { geometry: MapAreaGeometry }>(
  point: LatLng,
  areas: readonly Area[],
): Area | undefined {
  return areas.find((area) => pointInArea(point, area.geometry))
}

/** The bounds of some points; null for none. */
export function pointsBounds(points: readonly LatLng[]): MapBounds | null {
  if (points.length === 0) return null
  return {
    south: Math.min(...points.map((point) => point.lat)),
    west: Math.min(...points.map((point) => point.lng)),
    north: Math.max(...points.map((point) => point.lat)),
    east: Math.max(...points.map((point) => point.lng)),
  }
}

/** The bounds of a geometry's outer rings. */
export function geometryBounds(geometry: MapAreaGeometry): MapBounds | null {
  return pointsBounds(geometryPolygons(geometry).flatMap((rings) => rings[0] ?? []))
}

/** Bounds covering all of the given ones; null when none. */
export function unionBounds(list: readonly (MapBounds | null)[]): MapBounds | null {
  const known = list.filter((each): each is MapBounds => each !== null)
  if (known.length === 0) return null
  return {
    south: Math.min(...known.map((each) => each.south)),
    west: Math.min(...known.map((each) => each.west)),
    north: Math.max(...known.map((each) => each.north)),
    east: Math.max(...known.map((each) => each.east)),
  }
}

/** A ring's surface in square degrees (for choosing the largest polygon), always positive. */
function ringSurface(ring: readonly LatLng[]): number {
  let twice = 0
  ring.forEach((a, index) => {
    const b = ring[(index + 1) % ring.length] ?? a
    twice += a.lng * b.lat - b.lng * a.lat
  })
  return Math.abs(twice) / 2
}

/** The distance from a point to a segment, in the plan's units. */
function segmentDistance(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = dx * dx + dy * dy
  const t =
    length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/**
 * Where an area's name goes: in its largest polygon, at the centroid of the outer ring when that
 * stands inside the area, else (a ring around a hole, a crescent) at the point of a 24 × 24 grid
 * over it that lies inside and farthest from every line. Longitude is scaled by the cosine of
 * the latitude, so "farthest" is measured as on the map.
 */
export function labelPoint(geometry: MapAreaGeometry): LatLng | null {
  const polygons = geometryPolygons(geometry).filter((rings) => (rings[0]?.length ?? 0) > 0)
  if (polygons.length === 0) return null
  const largest = polygons.reduce((a, b) =>
    ringSurface(b[0] ?? []) > ringSurface(a[0] ?? []) ? b : a,
  )
  const outer = largest[0] ?? []
  const single: MapAreaGeometry = {
    type: 'Polygon',
    coordinates: largest.map((ring) => ring.map((point) => [point.lng, point.lat] as const)),
  }
  const centre = polygonCentroid(planPoints(outer))
  const centroid = { lat: centre.y, lng: centre.x }
  if (pointInArea(centroid, single)) return centroid
  const bounds = pointsBounds(outer)
  if (bounds === null) return centroid
  const scale = Math.cos((centroid.lat * Math.PI) / 180)
  const plan = (point: LatLng) => ({ x: point.lng * scale, y: point.lat })
  const segments = largest.flatMap((ring) =>
    ring.map(
      (point, index) => [plan(point), plan(ring[(index + 1) % ring.length] ?? point)] as const,
    ),
  )
  let best: LatLng | null = null
  let room = -1
  const steps = 24
  for (let i = 1; i < steps; i += 1) {
    for (let j = 1; j < steps; j += 1) {
      const candidate = {
        lat: bounds.south + ((bounds.north - bounds.south) * i) / steps,
        lng: bounds.west + ((bounds.east - bounds.west) * j) / steps,
      }
      if (!pointInArea(candidate, single)) continue
      const at = plan(candidate)
      const nearest = Math.min(...segments.map(([a, b]) => segmentDistance(at, a, b)))
      if (nearest > room) {
        room = nearest
        best = candidate
      }
    }
  }
  return best ?? centroid
}

/** A point on the screen, in pixels from the map's top-left corner. */
export interface ScreenPoint {
  x: number
  y: number
}

/**
 * Whether a label of `width` × `height` pixels, centred on `centre`, stands wholly inside an area
 * drawn on the screen (`rings`: the outer ring first, then its holes), with `margin` pixels of
 * room: its corners and the middles of its sides inside the outer ring and in no hole, and no
 * corner of a hole inside it. A label is never cut by a line; one that does not fit is left out
 * (the list names every area).
 */
export function labelFits(
  centre: ScreenPoint,
  width: number,
  height: number,
  rings: readonly (readonly ScreenPoint[])[],
  margin = 2,
): boolean {
  const [outer, ...holes] = rings
  if (outer === undefined || outer.length < 3 || width <= 0 || height <= 0) return false
  const halfWidth = width / 2 + margin
  const halfHeight = height / 2 + margin
  const probes = [
    { x: centre.x - halfWidth, y: centre.y - halfHeight },
    { x: centre.x + halfWidth, y: centre.y - halfHeight },
    { x: centre.x + halfWidth, y: centre.y + halfHeight },
    { x: centre.x - halfWidth, y: centre.y + halfHeight },
    // A line crossing the label's middle would cut it even with its corners inside.
    { x: centre.x, y: centre.y - halfHeight },
    { x: centre.x, y: centre.y + halfHeight },
    { x: centre.x - halfWidth, y: centre.y },
    { x: centre.x + halfWidth, y: centre.y },
    centre,
  ]
  const inside = (point: ScreenPoint) =>
    pointInPolygon(point, outer) && !holes.some((hole) => pointInPolygon(point, hole))
  if (!probes.every(inside)) return false
  const box = (point: ScreenPoint) =>
    Math.abs(point.x - centre.x) < halfWidth && Math.abs(point.y - centre.y) < halfHeight
  return [outer, ...holes].every((ring) => !ring.some(box))
}

/** The earth's mean radius in metres (IUGG). */
export const EARTH_RADIUS = 6_371_008.8

/**
 * The distance between two points along the earth's surface, in metres (haversine formula). For
 * an application that decides whether someone is at a workplace; the component never decides.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Whether a point lies within `radius` metres of a centre. */
export function withinRadius(point: LatLng, centre: LatLng, radius: number): boolean {
  return distanceMeters(point, centre) <= radius
}

/**
 * Where the arrow keys move in the list of areas (a single-choice list, roving focus): up and
 * down step, Home and End go to the ends; null for any other key.
 */
export function areaListKeyTarget(index: number, key: string, count: number): number | null {
  if (count === 0) return null
  if (key === 'ArrowDown') return Math.min(count - 1, index + 1)
  if (key === 'ArrowUp') return Math.max(0, index - 1)
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

/**
 * The tones an area may take: the charts' main blue (every area alike, the default), neutral, or
 * one of the five categorical colours of the charts (when the data sorts the
 * areas into kinds).
 */
export type MapAreaTone =
  'main' | 'neutral' | 'category1' | 'category2' | 'category3' | 'category4' | 'category5'

export const MAP_AREA_TONES: readonly MapAreaTone[] = [
  'main',
  'neutral',
  'category1',
  'category2',
  'category3',
  'category4',
  'category5',
]

/** Metres in one degree of latitude (and of longitude at the equator). */
const METRES_PER_DEGREE = (Math.PI * EARTH_RADIUS) / 180

/** The bounds of a circle of `radius` metres around a centre (a small circle, as on a map). */
export function circleBounds(centre: LatLng, radius: number): MapBounds {
  const dLat = radius / METRES_PER_DEGREE
  const dLng = radius / (METRES_PER_DEGREE * Math.max(0.01, Math.cos((centre.lat * Math.PI) / 180)))
  return {
    south: centre.lat - dLat,
    west: centre.lng - dLng,
    north: centre.lat + dLat,
    east: centre.lng + dLng,
  }
}

// ── RegionChart (maps in charts) ───────────────────────────────────────────────────────

// The steps, their shades and ranges are the charts' (`charts/steps.ts`, shared with Heatmap);
// the region chart keeps its names.
export {
  MAX_STEPS as REGION_MAX_STEPS,
  stepCount as regionStepCount,
  stepRanges as regionStepRanges,
  stepShade as rampShade,
  valueStep as regionStep,
} from '../charts/steps'
export type {
  StepRamp as RegionRamp,
  StepRange as RegionStepRange,
  StepShade as RampShade,
} from '../charts/steps'

/**
 * The areas in reading order: rows from north to south (points within `rowTolerance` degrees of
 * latitude share a row), each row from the reading direction's start — west to east on a
 * left-to-right page, east to west on a right-to-left one. The map itself is never mirrored; only
 * the order the keys walk follows the page.
 */
export function regionReadingOrder<Item extends { at: LatLng }>(
  items: readonly Item[],
  direction: 'ltr' | 'rtl',
  rowTolerance: number,
): Item[] {
  const byNorth = [...items].sort((a, b) => b.at.lat - a.at.lat)
  const rows: Item[][] = []
  for (const item of byNorth) {
    const row = rows[rows.length - 1]
    const first = row?.[0]
    if (row !== undefined && first !== undefined && first.at.lat - item.at.lat < rowTolerance) {
      row.push(item)
    } else {
      rows.push([item])
    }
  }
  const sign = direction === 'rtl' ? -1 : 1
  return rows.flatMap((row) => row.sort((a, b) => sign * (a.at.lng - b.at.lng)))
}

/**
 * Where a key moves in a region chart's reading order: ArrowDown and the arrow toward the line's
 * end (ArrowRight on a left-to-right page, ArrowLeft on a right-to-left one) to the next area,
 * ArrowUp and the other to the previous, Home and End to the first and last. From nothing
 * (`index` -1) any forward key starts at the first. Null for other keys or an empty chart.
 */
export function regionKeyTarget(
  index: number,
  key: string,
  count: number,
  direction: 'ltr' | 'rtl',
): number | null {
  if (count === 0) return null
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowDown' || key === forward) return index < 0 ? 0 : Math.min(index + 1, count - 1)
  if (key === 'ArrowUp' || key === backward) return index < 0 ? 0 : Math.max(index - 1, 0)
  return null
}

/** A bubble's radius in pixels: its area grows with the value (drawing only); 4–22px. */
export function bubbleRadius(value: number | null, largest: number | null): number {
  if (value === null || largest === null || largest <= 0 || value <= 0) return 4
  return 4 + 18 * Math.sqrt(Math.min(value / largest, 1))
}

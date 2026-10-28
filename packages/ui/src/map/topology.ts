import type { MapAreaGeometry, MapPosition } from './map-logic'

/*
 * A small TopoJSON reader (P5.93 item 43) for the boundary data the map subpath ships: quantized,
 * delta-encoded arcs shared between neighbouring areas, turned back into GeoJSON polygons. Only
 * what the data uses — Polygon and MultiPolygon geometries with properties — so the package needs
 * no topojson-client (a development dependency of the stories only).
 */

/** A quantized topology: arcs as delta-encoded integer positions, and its transform. */
export interface Topology {
  type: 'Topology'
  transform: { scale: readonly [number, number]; translate: readonly [number, number] }
  arcs: readonly (readonly (readonly [number, number])[])[]
  objects: Readonly<Record<string, TopologyCollection>>
}

/** A collection of polygons with their properties. */
export interface TopologyCollection {
  type: 'GeometryCollection'
  geometries: readonly TopologyGeometry[]
}

/** One polygon or multipolygon: its rings as arc indices (a negative index runs an arc backwards). */
export type TopologyGeometry =
  | {
      type: 'Polygon'
      arcs: readonly (readonly number[])[]
      properties?: Readonly<Record<string, unknown>>
    }
  | {
      type: 'MultiPolygon'
      arcs: readonly (readonly (readonly number[])[])[]
      properties?: Readonly<Record<string, unknown>>
    }

/** One feature read back: its geometry in degrees and its properties. */
export interface TopologyFeature {
  geometry: MapAreaGeometry
  properties: Readonly<Record<string, unknown>>
}

/** The arcs in degrees: each position the running sum of its deltas, through the transform. */
export function decodeArcs(topology: Topology): MapPosition[][] {
  const [scaleX, scaleY] = topology.transform.scale
  const [moveX, moveY] = topology.transform.translate
  return topology.arcs.map((arc) => {
    let x = 0
    let y = 0
    return arc.map(([dx, dy]) => {
      x += dx
      y += dy
      return [x * scaleX + moveX, y * scaleY + moveY] as const
    })
  })
}

/**
 * A ring from its arcs: each arc in order (`~index` backwards), the shared point between two arcs
 * written once, closed on its first point.
 */
export function ringFromArcs(
  indices: readonly number[],
  arcs: readonly MapPosition[][],
): MapPosition[] {
  const ring: MapPosition[] = []
  for (const index of indices) {
    const arc = index < 0 ? [...(arcs[~index] ?? [])].reverse() : (arcs[index] ?? [])
    arc.forEach((point, at) => {
      if (at === 0 && ring.length > 0) return
      ring.push(point)
    })
  }
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first !== undefined && last !== undefined && (first[0] !== last[0] || first[1] !== last[1]))
    ring.push(first)
  return ring
}

/** Every polygon of a collection as GeoJSON, with its properties. */
export function topologyFeatures(topology: Topology, object: string): TopologyFeature[] {
  const arcs = decodeArcs(topology)
  const collection = topology.objects[object]
  if (collection === undefined) return []
  return collection.geometries.map((geometry) => ({
    geometry:
      geometry.type === 'Polygon'
        ? { type: 'Polygon', coordinates: geometry.arcs.map((ring) => ringFromArcs(ring, arcs)) }
        : {
            type: 'MultiPolygon',
            coordinates: geometry.arcs.map((polygon) =>
              polygon.map((ring) => ringFromArcs(ring, arcs)),
            ),
          },
    properties: geometry.properties ?? {},
  }))
}

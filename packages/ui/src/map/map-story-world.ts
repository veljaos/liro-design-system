/*
 * Countries for the RegionChart stories and examples (P5.41), from Natural Earth's 1:110m Admin 0
 * boundaries (public domain) as redistributed by `world-atlas` 2.0.2 (ISC) and turned into GeoJSON
 * by `topojson-client` 3.1.0 (ISC) — development dependencies only: the package ships no geometry
 * (a real application passes its own). Not exported from `@veljaos/ui/map`.
 *
 * Natural Earth draws Kosovo as a polygon of its own; here it is merged into Serbia's area, so the
 * map has no gap (docs/notes/P5.41-map.md asks the owner to confirm; the geometry is always the
 * application's).
 */
import { feature, merge } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import type { MapAreaGeometry, MapPosition } from './map-logic'

type Topology = Parameters<typeof feature>[0]
type TopologyObject = Parameters<typeof feature>[1]

interface CountryObject {
  type: string
  id?: string
  properties?: { name?: string }
}

const topology = world as unknown as Topology
const countries = (
  topology.objects as unknown as Record<string, { geometries: readonly CountryObject[] }>
).countries

function named(name: string): CountryObject {
  const found = countries?.geometries.find((each) => each.properties?.name === name)
  if (found === undefined) throw new Error(`Natural Earth has no country named "${name}"`)
  return found
}

function asPositions(ring: readonly (readonly number[])[]): MapPosition[] {
  return ring.map((point) => [point[0] ?? 0, point[1] ?? 0] as const)
}

/** A GeoJSON geometry from topojson-client as ours (Polygon or MultiPolygon only). */
function asArea(geometry: { type: string; coordinates?: unknown }): MapAreaGeometry {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as readonly (readonly (readonly number[])[])[]
    return { type: 'Polygon', coordinates: rings.map(asPositions) }
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons =
      geometry.coordinates as readonly (readonly (readonly (readonly number[])[])[])[]
    return {
      type: 'MultiPolygon',
      coordinates: polygons.map((rings) => rings.map(asPositions)),
    }
  }
  throw new Error(`Not an area: ${geometry.type}`)
}

function country(name: string): MapAreaGeometry {
  const result = feature(topology, named(name) as unknown as TopologyObject) as unknown as {
    geometry: { type: string; coordinates?: unknown }
  }
  return asArea(result.geometry)
}

/** Serbia with Kosovo's polygon merged in (see the note above). */
function serbia(): MapAreaGeometry {
  const parts = [named('Serbia'), named('Kosovo')] as unknown as Parameters<typeof merge>[1]
  return asArea(merge(topology, parts))
}

/** The countries of the stories and examples, by a key of ours (names are the application's). */
export const COUNTRY_SHAPES = {
  serbia: serbia(),
  bosnia: country('Bosnia and Herz.'),
  montenegro: country('Montenegro'),
  northMacedonia: country('Macedonia'),
  croatia: country('Croatia'),
  slovenia: country('Slovenia'),
  hungary: country('Hungary'),
  albania: country('Albania'),
} as const satisfies Record<string, MapAreaGeometry>

export type CountryKey = keyof typeof COUNTRY_SHAPES

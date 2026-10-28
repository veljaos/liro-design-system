import type { MapAreaGeometry } from './map-logic'
import { topologyFeatures, type Topology } from './topology'

/*
 * The boundaries of the Republic of Serbia (P5.93 item 43, owner: "choropleth and bubble maps of
 * Serbia by statistical region, district, city and municipality … boundaries from an openly
 * licensed source that allows commercial use … simplified, loaded on demand"):
 * - Three levels: the five statistical regions (NSTJ level 2), the districts (okrug, with their
 *   ISO 3166-2:RS codes) and the 145 cities and municipalities; each area names its parent one
 *   level up (a municipality its district, a district its region), so an application drills
 *   down region → district → municipality by filtering.
 * - Each level is a separate module loaded on first use (`loadSerbiaBoundaries`): an application
 *   that never draws Serbia never downloads it. Regions about 8 KB, districts 17 KB, cities and
 *   municipalities 51 KB.
 * - Source: geoBoundaries gbOpen SRB ADM1 / ADM2 and XKX ADM0, from OpenStreetMap (© OpenStreetMap
 *   contributors, ODbL 1.0); simplified with mapshaper (weighted Visvalingam, 8% of the points,
 *   shapes kept) and quantized. Not GADM. The attribution must be shown with the map:
 *   `SERBIA_BOUNDARIES_ATTRIBUTION`, RegionChart's `attribution`.
 * - Kosovo and Metohija is part of Serbia (AGENTS.md D31, P5.31a): drawn within Serbia's area, as
 *   Serbian law names it — the Region Kosovo and Metohija among the statistical regions, the
 *   Autonomous Province of Kosovo and Metohija among the districts and the municipalities. Its five
 *   districts and its municipalities as Serbian law defines them have no open boundary data (the
 *   open data follow a division Serbia does not recognise), so the province is one area at those
 *   levels; an application with the official geometry passes its own.
 * - Names in Serbian (Latin script) and English; an application writes its own names by `id`.
 */

/** A level of Serbia's territorial division. */
export type SerbiaLevel = 'region' | 'district' | 'municipality'

export const SERBIA_LEVELS: readonly SerbiaLevel[] = ['region', 'district', 'municipality']

/** One area of a level. */
export interface SerbiaArea {
  /**
   * Regions: 'beograd', 'vojvodina', 'sumadija-zapadna-srbija', 'juzna-istocna-srbija',
   * 'kosovo-metohija'. Districts: ISO 3166-2:RS ('RS-00' Belgrade … 'RS-24'; 'RS-KM' the province).
   * Cities and municipalities: a slug of the name ('novi-sad', 'cacak'; 'RS-KM' the province).
   */
  id: string
  /** The name in Serbian, Latin script ("Južnobački okrug", "Čačak"). */
  name: string
  /** The name in English ("South Bačka District", "Čačak"). */
  nameEn: string
  /** The area one level up: a district's region, a municipality's district; null for a region. */
  parent: string | null
  /** Cities and municipalities only: a city, a municipality, or the province. */
  kind?: 'city' | 'municipality' | 'province'
  /** GeoJSON, [longitude, latitude]. */
  geometry: MapAreaGeometry
}

/** One level's areas and the attribution that goes with them. */
export interface SerbiaBoundaries {
  level: SerbiaLevel
  areas: SerbiaArea[]
  /** Written under the map (the data's licence requires it). */
  attribution: string
}

/** The boundary data's attribution: show it with every map drawn from them. */
export const SERBIA_BOUNDARIES_ATTRIBUTION =
  '© OpenStreetMap contributors (ODbL), via geoBoundaries'

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** A level's areas from its topology (exported for the tests). */
export function serbiaAreas(topology: Topology, level: SerbiaLevel): SerbiaArea[] {
  return topologyFeatures(topology, 'areas').map(({ geometry, properties }) => {
    const kind = properties.kind
    return {
      id: text(properties.id),
      name: text(properties.name),
      nameEn: text(properties.nameEn) || text(properties.name),
      parent: level === 'region' ? null : text(properties.parent) || null,
      ...(kind === 'city' || kind === 'municipality' || kind === 'province' ? { kind } : {}),
      geometry,
    }
  })
}

async function topologyOf(level: SerbiaLevel): Promise<Topology> {
  const module =
    level === 'region'
      ? await import('./serbia/regions')
      : level === 'district'
        ? await import('./serbia/districts')
        : await import('./serbia/municipalities')
  return JSON.parse(module.TOPOLOGY) as Topology
}

/**
 * Loads one level of Serbia's boundaries on first use (a separate module per level). The areas
 * carry their parent, so `areas.filter((area) => area.parent === 'vojvodina')` is one region's
 * districts.
 */
export async function loadSerbiaBoundaries(level: SerbiaLevel): Promise<SerbiaBoundaries> {
  return {
    level,
    areas: serbiaAreas(await topologyOf(level), level),
    attribution: SERBIA_BOUNDARIES_ATTRIBUTION,
  }
}

/** The areas of one level inside one area of the level above (a drill-down's next step). */
export function serbiaChildren(areas: readonly SerbiaArea[], parent: string): SerbiaArea[] {
  return areas.filter((area) => area.parent === parent)
}

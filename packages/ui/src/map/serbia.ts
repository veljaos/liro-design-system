import type { MapAreaGeometry } from './map-logic'
import { topologyFeatures, type Topology } from './topology'

/*
 * The boundaries of the Republic of Serbia (P5.93 item 43, owner: "choropleth and bubble maps of
 * Serbia by statistical region, district, city and municipality … boundaries from an openly
 * licensed source that allows commercial use … simplified, loaded on demand"):
 * - Four levels: the five statistical regions (NSTJ level 2), the districts (okrug, with their
 *   ISO 3166-2:RS codes), the 145 cities and municipalities and (P5.94 item 1) the city
 *   municipalities (gradske opštine) of the cities that have them — Belgrade's 17, Niš's 5 and
 *   the two each of Požarevac, Užice and Vranje (Novi Sad's and Kragujevac's have no boundaries in
 *   OpenStreetMap). Each area names its parent one level up (a city municipality its city, a
 *   municipality its district, a district its region), so an application drills down
 *   region → district → municipality → city municipality by filtering; `hasLowerLevel` says
 *   whether an area opens a level under it (the last level is not choosable).
 * - Each level is a separate module loaded on first use (`loadSerbiaBoundaries`): an application
 *   that never draws Serbia never downloads it. Regions about 8 KB, districts 17 KB, cities and
 *   municipalities 51 KB, city municipalities 19 KB.
 * - Source: geoBoundaries gbOpen SRB ADM1 / ADM2 and XKX ADM0, from OpenStreetMap (© OpenStreetMap
 *   contributors, ODbL 1.0); simplified with mapshaper (weighted Visvalingam, 8% of the points,
 *   shapes kept) and quantized. Not GADM. The attribution must be shown with the map:
 *   `SERBIA_BOUNDARIES_ATTRIBUTION`, RegionChart's `attribution`. The city municipalities come
 *   straight from OpenStreetMap's relations of admin_level 8 (ODbL 1.0), simplified the same way
 *   (250 m): `SERBIA_CITY_MUNICIPALITIES_ATTRIBUTION`. `loadSerbiaBoundaries` gives each level's.
 * - Kosovo and Metohija is part of Serbia (AGENTS.md D31, P5.31a): drawn within Serbia's area, as
 *   Serbian law names it — the Region Kosovo and Metohija among the statistical regions, the
 *   Autonomous Province of Kosovo and Metohija among the districts and the municipalities. Its five
 *   districts and its municipalities as Serbian law defines them have no open boundary data (the
 *   open data follow a division Serbia does not recognise), so the province is one area at those
 *   levels; an application with the official geometry passes its own.
 * - Names in Serbian (Latin script) and English; an application writes its own names by `id`.
 */

/** A level of Serbia's territorial division. */
export type SerbiaLevel = 'region' | 'district' | 'municipality' | 'city-municipality'

export const SERBIA_LEVELS: readonly SerbiaLevel[] = [
  'region',
  'district',
  'municipality',
  'city-municipality',
]

/**
 * The cities divided into city municipalities (gradske opštine) in the data, by their id at the
 * municipality level: their areas open the fourth level (P5.94 item 1).
 */
export const SERBIA_DIVIDED_CITIES: readonly string[] = [
  'beograd',
  'nis',
  'pozarevac',
  'uzice',
  'vranje',
]

/** One area of a level. */
export interface SerbiaArea {
  /**
   * Regions: 'beograd', 'vojvodina', 'sumadija-zapadna-srbija', 'juzna-istocna-srbija',
   * 'kosovo-metohija'. Districts: ISO 3166-2:RS ('RS-00' Belgrade … 'RS-24'; 'RS-KM' the province).
   * Cities and municipalities: a slug of the name ('novi-sad', 'cacak'; 'RS-KM' the province).
   * City municipalities: the city's id and a slug of the name ('beograd-zemun', 'nis-medijana').
   */
  id: string
  /** The name in Serbian, Latin script ("Južnobački okrug", "Čačak"). */
  name: string
  /** The name in English ("South Bačka District", "Čačak"). */
  nameEn: string
  /**
   * The area one level up: a district's region, a municipality's district, a city municipality's
   * city; null for a region.
   */
  parent: string | null
  /**
   * Cities and municipalities: a city, a municipality, or the province; city municipalities:
   * 'city-municipality'.
   */
  kind?: 'city' | 'municipality' | 'province' | 'city-municipality'
  /**
   * Whether the area opens a level under it in the data (a drill-down's next step): every region
   * and district, a city divided into city municipalities; never Kosovo and Metohija (one area at
   * every level under the region, D31) nor a city municipality. An area without one is the last
   * level: not choosable in a drill-down (P5.94 item 1).
   */
  hasLowerLevel: boolean
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

/** The city municipalities' attribution (straight from OpenStreetMap): show it with their map. */
export const SERBIA_CITY_MUNICIPALITIES_ATTRIBUTION = '© OpenStreetMap contributors (ODbL)'

/** The level under a level, or null under the last. */
export function serbiaLowerLevel(level: SerbiaLevel): SerbiaLevel | null {
  return SERBIA_LEVELS[SERBIA_LEVELS.indexOf(level) + 1] ?? null
}

/** Whether an area of a level opens a level under it (see `SerbiaArea.hasLowerLevel`). */
function opensLowerLevel(level: SerbiaLevel, id: string): boolean {
  if (id === 'kosovo-metohija' || id === 'RS-KM') return false
  if (level === 'municipality') return SERBIA_DIVIDED_CITIES.includes(id)
  return level !== 'city-municipality'
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** A level's areas from its topology (exported for the tests). */
export function serbiaAreas(topology: Topology, level: SerbiaLevel): SerbiaArea[] {
  return topologyFeatures(topology, 'areas').map(({ geometry, properties }) => {
    const kind = properties.kind
    const id = text(properties.id)
    return {
      id,
      name: text(properties.name),
      nameEn: text(properties.nameEn) || text(properties.name),
      parent: level === 'region' ? null : text(properties.parent) || null,
      ...(kind === 'city' ||
      kind === 'municipality' ||
      kind === 'province' ||
      kind === 'city-municipality'
        ? { kind }
        : {}),
      hasLowerLevel: opensLowerLevel(level, id),
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
        : level === 'municipality'
          ? await import('./serbia/municipalities')
          : await import('./serbia/city-municipalities')
  return JSON.parse(module.TOPOLOGY) as Topology
}

/**
 * Loads one level of Serbia's boundaries on first use (a separate module per level). The areas
 * carry their parent, so `areas.filter((area) => area.parent === 'vojvodina')` is one region's
 * districts. The city-municipality level covers only the divided cities, not all of Serbia.
 */
export async function loadSerbiaBoundaries(level: SerbiaLevel): Promise<SerbiaBoundaries> {
  return {
    level,
    areas: serbiaAreas(await topologyOf(level), level),
    attribution:
      level === 'city-municipality'
        ? SERBIA_CITY_MUNICIPALITIES_ATTRIBUTION
        : SERBIA_BOUNDARIES_ATTRIBUTION,
  }
}

/** The areas of one level inside one area of the level above (a drill-down's next step). */
export function serbiaChildren(areas: readonly SerbiaArea[], parent: string): SerbiaArea[] {
  return areas.filter((area) => area.parent === parent)
}

/** A drill-down's next step: the level opened under an area, and the areas shown there. */
export interface SerbiaDrillStep {
  /** The level shown. */
  level: SerbiaLevel
  /** The areas under the chosen one (choosable where `hasLowerLevel`). */
  areas: SerbiaArea[]
  /**
   * The areas passed through: a level with only one area under the chosen one (the Belgrade
   * Region's one district, the City of Belgrade's one city) is skipped, so one press on the
   * Belgrade Region opens its 17 city municipalities. The last is the area whose parts are shown.
   */
  through: SerbiaArea[]
  /** The shown level's attribution. */
  attribution: string
}

/**
 * Opens the level under an area of `level` (P5.94 item 1): loads the lower level, keeps the
 * area's children and skips a level that has only one child, which opens again by itself. Null
 * when the area has no lower level (the last level: nothing to open).
 */
export async function loadSerbiaChildren(
  level: SerbiaLevel,
  parent: string,
): Promise<SerbiaDrillStep | null> {
  const lower = serbiaLowerLevel(level)
  if (lower === null) return null
  const boundaries = await loadSerbiaBoundaries(lower)
  const areas = serbiaChildren(boundaries.areas, parent)
  const only = areas.length === 1 ? areas[0] : undefined
  if (only?.hasLowerLevel === true) {
    const next = await loadSerbiaChildren(lower, only.id)
    if (next !== null) return { ...next, through: [only, ...next.through] }
  }
  return areas.length === 0
    ? null
    : { level: lower, areas, through: [], attribution: boundaries.attribution }
}

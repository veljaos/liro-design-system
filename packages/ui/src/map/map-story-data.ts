import { expect, waitFor } from 'storybook/test'
import type { MapArea } from './area-map'
import type { MapAreaGeometry, MapPosition } from './map-logic'
import { COUNTRY_SHAPES } from './map-story-world'
import type { RegionChartArea, RegionChartPlace } from './region-chart'

/*
 * The maps' story data (P5.41): an invented town's zones, hand-drawn rings around a centre — not
 * a real boundary. No tiles: the stories draw only shapes, so they fetch nothing and their
 * pictures never change. Not part of the package.
 */

const ring = (points: readonly MapPosition[]): MapPosition[] => [...points, points[0] ?? [0, 0]]

const CENTRE: MapPosition[] = ring([
  [19.835, 45.252],
  [19.85, 45.252],
  [19.852, 45.259],
  [19.84, 45.262],
  [19.832, 45.258],
])
const INNER: MapPosition[] = ring([
  [19.82, 45.243],
  [19.862, 45.243],
  [19.868, 45.262],
  [19.845, 45.272],
  [19.818, 45.265],
])
const OUTER: MapPosition[] = ring([
  [19.8, 45.232],
  [19.885, 45.232],
  [19.892, 45.268],
  [19.85, 45.285],
  [19.795, 45.276],
])

export const CENTRE_ZONE: MapAreaGeometry = { type: 'Polygon', coordinates: [CENTRE] }
export const INNER_ZONE: MapAreaGeometry = { type: 'Polygon', coordinates: [INNER, CENTRE] }
export const OUTER_ZONE: MapAreaGeometry = { type: 'Polygon', coordinates: [OUTER, INNER] }
export const EAST_ZONE: MapAreaGeometry = {
  type: 'MultiPolygon',
  coordinates: [
    [
      ring([
        [19.895, 45.24],
        [19.915, 45.24],
        [19.918, 45.255],
        [19.897, 45.258],
      ]),
    ],
    [
      ring([
        [19.9, 45.262],
        [19.915, 45.262],
        [19.913, 45.272],
        [19.899, 45.27],
      ]),
    ],
  ],
}

/** The town's zones, all in one colour (P5.94 item 17: the default). */
export const TOWN_AREAS: MapArea[] = [
  { id: 'centre', name: 'Centre', detail: 'Rate A', geometry: CENTRE_ZONE },
  { id: 'inner', name: 'Inner ring', detail: 'Rate B', geometry: INNER_ZONE },
  { id: 'outer', name: 'Outer ring', detail: 'Rate C', geometry: OUTER_ZONE },
  { id: 'east', name: 'East bank', detail: 'Rate C', geometry: EAST_ZONE },
]

/** The same zones coloured by their rate: the data asks for categories, the legend names them. */
export const TOWN_AREAS_BY_RATE: MapArea[] = TOWN_AREAS.map((area) => ({
  ...area,
  tone:
    area.detail === 'Rate A' ? 'category1' : area.detail === 'Rate B' ? 'category2' : 'category3',
}))

export const TOWN_LEGEND = [
  { tone: 'category1' as const, label: 'Rate A — the highest' },
  { tone: 'category2' as const, label: 'Rate B' },
  { tone: 'category3' as const, label: 'Rate C' },
]

export const LONG_AREAS: MapArea[] = TOWN_AREAS.map((area) =>
  area.id === 'inner'
    ? {
        ...area,
        name: 'Inner ring between the boulevard and the old railway embankment, with the market',
        detail:
          'Rate B from the town council’s decision of 2025, applied to buildings and building land alike',
      }
    : area,
)

export const ARABIC_AREAS: MapArea[] = TOWN_AREAS.map((area, index) => ({
  ...area,
  name: ['الوسط', 'الحلقة الداخلية', 'الحلقة الخارجية', 'الضفة الشرقية'][index] ?? area.name,
  detail: ['الفئة أ', 'الفئة ب', 'الفئة ج', 'الفئة ج'][index] ?? '',
}))

export const JAPANESE_AREAS: MapArea[] = TOWN_AREAS.map((area, index) => ({
  ...area,
  name: ['中心部', '内環', '外環', '東岸'][index] ?? area.name,
  detail: ['区分A', '区分B', '区分C', '区分C'][index] ?? '',
}))

/** An address in the inner ring. */
export const ADDRESS = { lat: 45.247, lng: 19.848, label: 'Riverside Street 4' }

/** The workplace of the location stories: a circle of 150 m. */
export const SITE = { lat: 45.247, lng: 19.848 }

export const INSIDE_FIX = {
  lat: 45.2473,
  lng: 19.8486,
  accuracy: '18',
  at: '2026-10-14T06:58:00+02:00',
}

export const OUTSIDE_FIX = {
  lat: 45.2512,
  lng: 19.8395,
  accuracy: '25',
  at: '2026-10-14T06:52:00+02:00',
}

/** Waits until the map is drawn and its labels measured. */
export async function mapReady(canvasElement: HTMLElement): Promise<void> {
  await waitFor(
    async () => {
      await expect(
        canvasElement.querySelector(
          '[data-slot="area-map"][data-ready], [data-slot="location-check"][data-ready], [data-slot="region-chart"][data-ready]',
        ),
      ).not.toBeNull()
    },
    { timeout: 10_000 },
  )
}

// ── RegionChart (P5.41, maps in charts) ───────────────────────────────────────────────────────
// Invented revenue by country, EUR; the countries' outlines are Natural Earth's (map-story-world).

export const COUNTRY_REVENUE: RegionChartArea[] = [
  {
    id: 'serbia',
    name: 'Serbia',
    geometry: COUNTRY_SHAPES.serbia,
    value: '4820000',
    detail: 'Home market',
  },
  {
    id: 'bosnia',
    name: 'Bosnia and Herzegovina',
    geometry: COUNTRY_SHAPES.bosnia,
    value: '1240000',
  },
  { id: 'montenegro', name: 'Montenegro', geometry: COUNTRY_SHAPES.montenegro, value: '385000' },
  {
    id: 'north-macedonia',
    name: 'North Macedonia',
    geometry: COUNTRY_SHAPES.northMacedonia,
    value: '612000',
  },
  { id: 'croatia', name: 'Croatia', geometry: COUNTRY_SHAPES.croatia, value: '960000' },
  { id: 'slovenia', name: 'Slovenia', geometry: COUNTRY_SHAPES.slovenia, value: '74500' },
  { id: 'hungary', name: 'Hungary', geometry: COUNTRY_SHAPES.hungary, value: '2150000' },
  {
    id: 'albania',
    name: 'Albania',
    geometry: COUNTRY_SHAPES.albania,
    value: null,
    detail: 'Not reported yet',
  },
]

/** Four breaks, five steps. */
export const REVENUE_BREAKS = ['100000', '500000', '1000000', '2000000'] as const

/** Offices in the capitals, with their own revenue (bubbles). */
export const CAPITAL_OFFICES: RegionChartPlace[] = [
  { id: 'belgrade', name: 'Belgrade', lat: 44.817, lng: 20.457, value: '3100000' },
  { id: 'sarajevo', name: 'Sarajevo', lat: 43.856, lng: 18.413, value: '840000' },
  { id: 'podgorica', name: 'Podgorica', lat: 42.441, lng: 19.263, value: '385000' },
  { id: 'skopje', name: 'Skopje', lat: 41.998, lng: 21.425, value: '612000' },
  { id: 'zagreb', name: 'Zagreb', lat: 45.815, lng: 15.982, value: '960000' },
  { id: 'budapest', name: 'Budapest', lat: 47.498, lng: 19.04, value: '2150000' },
]

export const ARABIC_REVENUE: RegionChartArea[] = COUNTRY_REVENUE.map((area, index) => ({
  id: area.id,
  geometry: area.geometry,
  value: area.value,
  name:
    [
      'صربيا',
      'البوسنة والهرسك',
      'الجبل الأسود',
      'مقدونيا الشمالية',
      'كرواتيا',
      'سلوفينيا',
      'المجر',
      'ألبانيا',
    ][index] ?? area.name,
}))

export const JAPANESE_REVENUE: RegionChartArea[] = COUNTRY_REVENUE.map((area, index) => ({
  id: area.id,
  geometry: area.geometry,
  value: area.value,
  name:
    [
      'セルビア',
      'ボスニア・ヘルツェゴビナ',
      'モンテネグロ',
      '北マケドニア',
      'クロアチア',
      'スロベニア',
      'ハンガリー',
      'アルバニア',
    ][index] ?? area.name,
}))

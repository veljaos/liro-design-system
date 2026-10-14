/*
 * Group AE's and AF's example data (P5.41, maps): **illustrative** zones of Novi Sad for a local
 * property tax — hand-drawn simple rings near the city centre (45.25° N, 19.84° E), NOT the city's
 * real boundaries — with Kvadrat Gradnja d.o.o.'s three properties; and the site "Liman 4" where
 * Nikola Marković checks in (a circle of 150 m round the site gate), with the positions his phone
 * reports. Every number is invented. Which zone a property falls in, and whether Nikola is at the
 * site, are the application's verdicts (it uses `areaAt` and `distanceMeters`); the components
 * only show them. No tiles: nothing is fetched. Not part of the package.
 */
import type {
  LocationFix,
  MapArea,
  MapLegendEntry,
  MapPosition,
} from '../../../../packages/ui/src/map'

export const AE_ROUTES = {
  zones: '/finance/property-tax/zones',
  /** The same with the warehouse chosen. */
  warehouse: '/finance/property-tax/zones?property=warehouse',
} as const

export const AF_ROUTES = {
  checkIn: '/me/check-in',
  outside: '/me/check-in?state=outside',
  unknown: '/me/check-in?state=unknown',
  denied: '/me/check-in?state=denied',
} as const

const ring = (points: readonly MapPosition[]): MapPosition[] => [...points, points[0] ?? [0, 0]]

const ZONE_I_RING = ring([
  [19.838, 45.2535],
  [19.8505, 45.2525],
  [19.8535, 45.2595],
  [19.8445, 45.2635],
  [19.8345, 45.2595],
])
const ZONE_II_RING = ring([
  [19.822, 45.2425],
  [19.861, 45.2415],
  [19.869, 45.2605],
  [19.851, 45.2725],
  [19.8195, 45.2665],
])
const ZONE_III_RING = ring([
  [19.799, 45.2305],
  [19.874, 45.2295],
  [19.8895, 45.2665],
  [19.8505, 45.2865],
  [19.7935, 45.2775],
])

export const ZONES: MapArea[] = [
  {
    id: 'zone-1',
    name: 'Zone I',
    detail: 'The old town · the highest rate (illustrative)',
    geometry: { type: 'Polygon', coordinates: [ZONE_I_RING] },
    tone: 'category1',
  },
  {
    id: 'zone-2',
    name: 'Zone II',
    detail: 'Liman and the boulevards (illustrative)',
    geometry: { type: 'Polygon', coordinates: [ZONE_II_RING, ZONE_I_RING] },
    tone: 'category2',
  },
  {
    id: 'zone-3',
    name: 'Zone III',
    detail: 'The rest of the city (illustrative)',
    geometry: { type: 'Polygon', coordinates: [ZONE_III_RING, ZONE_II_RING] },
    tone: 'category3',
  },
  {
    id: 'zone-4',
    name: 'Zone IV',
    detail: 'Across the river, two parts (illustrative)',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          ring([
            [19.877, 45.2335],
            [19.909, 45.2345],
            [19.914, 45.2515],
            [19.8935, 45.2555],
          ]),
        ],
        [
          ring([
            [19.896, 45.2615],
            [19.916, 45.2605],
            [19.914, 45.2735],
            [19.8955, 45.2715],
          ]),
        ],
      ],
    },
    tone: 'category4',
  },
]

export const ZONE_LEGEND: MapLegendEntry[] = [
  { tone: 'category1', label: 'Zone I — the highest rate' },
  { tone: 'category2', label: 'Zone II' },
  { tone: 'category3', label: 'Zone III' },
  { tone: 'category4', label: 'Zone IV — the lowest rate' },
]

export interface Property {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  /** The surface the tax is charged on, m², as the cadastre has it (illustrative). */
  area: string
}

export const PROPERTIES: Property[] = [
  {
    id: 'office',
    name: 'Head office',
    address: 'Bulevar oslobođenja 41 (illustrative)',
    lat: 45.257,
    lng: 19.843,
    area: '412',
  },
  {
    id: 'liman',
    name: 'Site Liman 4',
    address: 'Bulevar cara Lazara 4 (illustrative)',
    lat: 45.247,
    lng: 19.848,
    area: '1850',
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    address: 'Industrijska 12 (illustrative)',
    lat: 45.2365,
    lng: 19.8105,
    area: '960',
  },
]

// ── The check-in at Liman 4 (AF) ──────────────────────────────────────────────────────────────

export const SITE_GATE = { lat: 45.247, lng: 19.848 }
export const SITE_RADIUS = 150

export const FIX_AT_SITE: LocationFix = {
  lat: 45.2473,
  lng: 19.8486,
  accuracy: '18',
  at: '2026-10-14T06:58:00+02:00',
}

/** On the tram, about 800 m away. */
export const FIX_ON_THE_WAY: LocationFix = {
  lat: 45.2512,
  lng: 19.8395,
  accuracy: '25',
  at: '2026-10-14T06:52:00+02:00',
}

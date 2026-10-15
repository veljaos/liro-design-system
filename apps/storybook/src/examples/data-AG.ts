/*
 * Group AG's example data (P5.41, maps in charts): Kvadrat Gradnja group's revenue by country in
 * January–September 2026 (EUR), and its sales by region of Serbia (RSD). Every figure is invented.
 * The countries' outlines are Natural Earth's 1:110m (`world-atlas`, a development dependency of
 * the stories, through `map-story-world.ts`); the regions of Serbia are **illustrative** — five
 * simple hand-drawn shapes, never the country's real administrative boundaries, and labelled so.
 * The breaks, the steps' words and the figures are the application's; RegionChart only compares
 * and draws. Not part of the package.
 */
import type {
  MapPosition,
  RegionChartArea,
  RegionChartPlace,
} from '../../../../packages/ui/src/map'
import { COUNTRY_SHAPES } from '../../../../packages/ui/src/map/map-story-world'

export const AG_ROUTES = {
  countries: '/reports/group-revenue',
  regions: '/reports/sales-by-region',
} as const

// ── Group revenue by country (EUR) ───────────────────────────────────────────────────────────

export const GROUP_COUNTRIES: RegionChartArea[] = [
  {
    id: 'rs',
    name: 'Serbia',
    geometry: COUNTRY_SHAPES.serbia,
    value: '18640000',
    detail: 'Kvadrat Gradnja d.o.o., Novi Sad',
  },
  {
    id: 'ba',
    name: 'Bosnia and Herzegovina',
    geometry: COUNTRY_SHAPES.bosnia,
    value: '3120000',
    detail: 'Kvadrat Gradnja BH d.o.o., Banja Luka',
  },
  {
    id: 'me',
    name: 'Montenegro',
    geometry: COUNTRY_SHAPES.montenegro,
    value: '1480000',
    detail: 'Kvadrat Gradnja CG d.o.o., Podgorica',
  },
  {
    id: 'mk',
    name: 'North Macedonia',
    geometry: COUNTRY_SHAPES.northMacedonia,
    value: '960000',
    detail: 'Kvadrat Gradnja MK DOOEL, Skopje',
  },
  {
    id: 'hr',
    name: 'Croatia',
    geometry: COUNTRY_SHAPES.croatia,
    value: '2310000',
    detail: 'Kvadrat Gradnja HR d.o.o., Zagreb',
  },
  {
    id: 'si',
    name: 'Slovenia',
    geometry: COUNTRY_SHAPES.slovenia,
    value: '540000',
    detail: 'Sales through a partner',
  },
  {
    id: 'hu',
    name: 'Hungary',
    geometry: COUNTRY_SHAPES.hungary,
    value: '1870000',
    detail: 'Kvadrat Gradnja Kft., Szeged',
  },
  {
    id: 'al',
    name: 'Albania',
    geometry: COUNTRY_SHAPES.albania,
    value: null,
    detail: 'The new branch reports from January 2027',
  },
]

/** Under 1 million, 1–2, 2–5, 5–10, 10 million and more. */
export const COUNTRY_BREAKS = ['1000000', '2000000', '5000000', '10000000'] as const

/** The subsidiaries' seats, as points. */
export const SUBSIDIARIES: RegionChartPlace[] = [
  { id: 'novi-sad', name: 'Novi Sad', lat: 45.2671, lng: 19.8335 },
  { id: 'banja-luka', name: 'Banja Luka', lat: 44.7722, lng: 17.191 },
  { id: 'podgorica', name: 'Podgorica', lat: 42.441, lng: 19.2636 },
  { id: 'skopje', name: 'Skopje', lat: 41.9981, lng: 21.4254 },
  { id: 'zagreb', name: 'Zagreb', lat: 45.815, lng: 15.9819 },
  { id: 'szeged', name: 'Szeged', lat: 46.253, lng: 20.1414 },
]

// ── Sales by illustrative region of Serbia (RSD) ─────────────────────────────────────────────

const ring = (points: readonly MapPosition[]): MapPosition[] => [...points, points[0] ?? [0, 0]]

const NORTH = ring([
  [18.95, 45.9],
  [19.6, 46.17],
  [20.7, 46.15],
  [21.4, 45.8],
  [21.5, 45.2],
  [21.0, 44.9],
  [20.75, 44.95],
  [20.2, 44.95],
  [19.5, 44.9],
  [19.05, 45.0],
])
const CAPITAL = ring([
  [20.2, 44.95],
  [20.75, 44.95],
  [20.8, 44.6],
  [20.5, 44.5],
  [20.15, 44.65],
])
const WEST = ring([
  [19.05, 45.0],
  [19.5, 44.9],
  [20.2, 44.95],
  [20.15, 44.65],
  [20.5, 44.5],
  [20.6, 43.9],
  [20.4, 43.3],
  [19.6, 43.3],
  [19.2, 43.5],
  [19.3, 44.2],
  [19.1, 44.6],
])
const EAST = ring([
  [20.75, 44.95],
  [21.0, 44.9],
  [21.5, 45.2],
  [22.1, 44.6],
  [22.7, 44.2],
  [22.5, 43.7],
  [21.9, 43.7],
  [20.6, 43.9],
  [20.5, 44.5],
  [20.8, 44.6],
])
const SOUTH = ring([
  [20.4, 43.3],
  [20.6, 43.9],
  [21.9, 43.7],
  [22.5, 43.7],
  [22.9, 43.1],
  [22.4, 42.4],
  [21.6, 42.3],
  [20.8, 42.6],
  [20.3, 42.9],
])

export const SERBIA_REGIONS: RegionChartArea[] = [
  {
    id: 'north',
    name: 'North',
    geometry: { type: 'Polygon', coordinates: [NORTH] },
    value: '412300000',
    detail: '+8% on 2025',
  },
  {
    id: 'capital',
    name: 'Capital',
    geometry: { type: 'Polygon', coordinates: [CAPITAL] },
    value: '688900000',
    detail: '+14% on 2025',
  },
  {
    id: 'west',
    name: 'West',
    geometry: { type: 'Polygon', coordinates: [WEST] },
    value: '205400000',
    detail: '+3% on 2025',
  },
  {
    id: 'east',
    name: 'East',
    geometry: { type: 'Polygon', coordinates: [EAST] },
    value: '148700000',
    detail: '−2% on 2025',
  },
  {
    id: 'south',
    name: 'South',
    geometry: { type: 'Polygon', coordinates: [SOUTH] },
    value: '96200000',
    detail: 'New sales office since March',
  },
]

/** Under 100 million, 100–200, 200–400, 400–600, 600 million and more. */
export const REGION_BREAKS = ['100000000', '200000000', '400000000', '600000000'] as const

/** The sales offices, sized by their own sales. */
export const SALES_OFFICES: RegionChartPlace[] = [
  { id: 'novi-sad', name: 'Novi Sad', lat: 45.2671, lng: 19.8335, value: '298000000' },
  { id: 'beograd', name: 'Beograd', lat: 44.8125, lng: 20.4612, value: '688900000' },
  { id: 'cacak', name: 'Čačak', lat: 43.8914, lng: 20.3497, value: '121000000' },
  { id: 'kragujevac', name: 'Kragujevac', lat: 44.0128, lng: 20.9114, value: '84400000' },
  { id: 'nis', name: 'Niš', lat: 43.3209, lng: 21.8958, value: '96200000' },
]

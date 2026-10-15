import { LiroProvider } from '@veljaos/ui'
import { AreaMap, LocationCheck, RegionChart, regionStep, type MapArea } from '@veljaos/ui/map'

const AREAS: MapArea[] = [
  {
    id: 'a',
    name: 'Zone A',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [19.83, 45.24],
          [19.86, 45.24],
          [19.86, 45.26],
          [19.83, 45.26],
          [19.83, 45.24],
        ],
      ],
    },
    tone: 'category1',
  },
]

/**
 * The maps (and RegionChart, a chart on the map) through the `@veljaos/ui/map` subpath (P5.41), typed against the packed declarations;
 * Leaflet comes with it as a dependency of `@veljaos/ui`. No tiles: nothing is fetched.
 */
export function MapExample() {
  return (
    <LiroProvider locale="en">
      <AreaMap label="Zones" areas={AREAS} point={{ lat: 45.25, lng: 19.845, label: 'Office' }} />
      <LocationCheck
        label="Site"
        area={{ kind: 'circle', centre: { lat: 45.25, lng: 19.845 }, radius: 150 }}
        state="unknown"
      />
      <RegionChart
        title="Revenue by zone"
        valueLabel="Revenue"
        areas={AREAS.map((area) => ({ ...area, value: '1200' }))}
        breaks={['1000']}
        places={[{ id: 'o', name: 'Office', lat: 45.25, lng: 19.845, value: '300' }]}
      />
      <p>{regionStep('1200', ['1000'])}</p>
    </LiroProvider>
  )
}

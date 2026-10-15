// @veljaos/ui/map (P5.41): AreaMap, LocationCheck and RegionChart on Leaflet (BSD-2-Clause), drawn
// with SVG.
// A subpath of its own, so an application without maps does not load Leaflet.
export { AreaMap, AREA_SWATCH } from './area-map'
export type { AreaMapProps, MapArea, MapLegendEntry, MapPoint } from './area-map'
export { LocationCheck, LOCATION_STATES } from './location-check'
export type {
  LocationAction,
  LocationArea,
  LocationCheckProps,
  LocationFix,
  LocationState,
} from './location-check'
export type { MapTiles } from './map-canvas'
export { RegionChart } from './region-chart'
export type { RegionChartArea, RegionChartPlace, RegionChartProps } from './region-chart'
export {
  areaAt,
  areaListKeyTarget,
  bubbleRadius,
  circleBounds,
  distanceMeters,
  EARTH_RADIUS,
  geometryBounds,
  geometryPolygons,
  labelFits,
  labelPoint,
  MAP_AREA_TONES,
  pointInArea,
  pointsBounds,
  positionPoint,
  rampShade,
  REGION_MAX_STEPS,
  regionKeyTarget,
  regionReadingOrder,
  regionStep,
  regionStepCount,
  regionStepRanges,
  unionBounds,
  withinRadius,
} from './map-logic'
export type {
  LatLng,
  MapAreaGeometry,
  MapAreaTone,
  MapBounds,
  MapMultiPolygonGeometry,
  MapPolygonGeometry,
  MapPosition,
  RampShade,
  RegionRamp,
  RegionStepRange,
  ScreenPoint,
} from './map-logic'

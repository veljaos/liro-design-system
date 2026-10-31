// @veljaos/ui/map: AreaMap, LocationCheck and RegionChart on Leaflet (BSD-2-Clause), drawn
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
export type { MapBaseLayer } from './map-canvas'
export { RegionChart } from './region-chart'
export {
  loadSerbiaBoundaries,
  loadSerbiaChildren,
  SERBIA_BOUNDARIES_ATTRIBUTION,
  SERBIA_CITY_MUNICIPALITIES_ATTRIBUTION,
  SERBIA_DIVIDED_CITIES,
  SERBIA_LEVELS,
  serbiaAreas,
  serbiaChildren,
  serbiaLowerLevel,
} from './serbia'
export type { SerbiaArea, SerbiaBoundaries, SerbiaDrillStep, SerbiaLevel } from './serbia'
export { decodeArcs, ringFromArcs, topologyFeatures } from './topology'
export type { Topology, TopologyCollection, TopologyFeature, TopologyGeometry } from './topology'
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

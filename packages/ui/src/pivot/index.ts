// @veljaos/ui/pivot (P5.77): Pivot, the pivot analysis built on TanStack Table (MIT, already a
// dependency of @veljaos/ui). A subpath of its own, so the pivot's code loads only where an
// analysis is drawn. The application computes every figure; the library lays them out.
export { Pivot } from './pivot'
export type { PivotExport, PivotProps } from './pivot'
export {
  acceptsField,
  areaFieldIds,
  areaOf,
  dropField,
  EMPTY_PIVOT_LAYOUT,
  fieldAreas,
  hasValues,
  moveField,
  PIVOT_AREAS,
  PIVOT_PAGE_ROWS,
  pivotGroupKeys,
  pivotHeaderDepth,
  pivotKeyTarget,
  pivotLeaves,
  pivotRowPaths,
  pivotSummaryParts,
  pivotTopGroupKeys,
  pivotViewOf,
  placeField,
  removeField,
  sameLayout,
  setAggregation,
  setFilterValues,
  unusedFields,
} from './pivot-logic'
export type {
  PivotArea,
  PivotCellRef,
  PivotColumn,
  PivotField,
  PivotFilter,
  PivotLayout,
  PivotLeaf,
  PivotOption,
  PivotPosition,
  PivotResult,
  PivotRow,
  PivotSummaryParts,
  PivotValue,
  PivotValueKind,
  PivotView,
  PivotZone,
} from './pivot-logic'

// @veljaos/ui/charts (P4.7a): the charts, on Recharts through the shadcn/ui Chart primitive. A
// subpath of its own, so an application without charts does not load Recharts.
export {
  AreaChart,
  BarChart,
  defaultCurve,
  DOTS_MAX_POINTS,
  equalTicks,
  LINEAR_MAX_POINTS,
  LineChart,
} from './cartesian'
export type {
  AreaChartProps,
  BarChartProps,
  CartesianChartProps,
  ChartCurve,
  ChartTooltipOptions,
  LineChartProps,
} from './cartesian'
export { CandlestickChart } from './candlestick'
export type { Candle, CandlestickChartProps } from './candlestick'
export { FunnelChart } from './funnel'
export type { FunnelChartProps, FunnelStage } from './funnel'
export { Heatmap } from './heatmap'
export type { HeatmapProps } from './heatmap'
export { MatrixChart } from './matrix'
export type { MatrixChartProps, MatrixItem, MatrixLevel } from './matrix'
export {
  CANDLE_MAX_WIDTH,
  candleDomain,
  candleDrawable,
  candleRises,
  candleShapes,
  gridBoxes,
  gridCells,
  gridKeyTarget,
  itemsInCell,
  linearScale,
  niceTicks,
  physicalX,
  sankeyColumn,
  sankeyColumns,
  sankeyData,
  sankeyLabelRoom,
  scatterOrder,
  scatterRadius,
  sequenceKeyTarget,
  spacedLabels,
  textWidth,
  trapezoidPath,
  treemapLeaves,
} from './plot-logic'
export type {
  CandlePrices,
  CandleShape,
  GridCell,
  SankeyLayoutData,
  ScatterEntry,
  TreemapLeaf,
} from './plot-logic'
export { SankeyChart } from './sankey'
export type { SankeyChartProps, SankeyFlow, SankeyNode } from './sankey'
export { ScatterChart } from './scatter'
export type { ScatterAxis, ScatterChartProps, ScatterPoint, ScatterSeries } from './scatter'
export { MAX_STEPS, stepCount, stepRanges, stepShade, valueStep } from './steps'
export type { StepRamp, StepRange, StepShade } from './steps'
export { Treemap } from './treemap'
export type { TreemapItem, TreemapProps } from './treemap'
export { DonutChart, PieChart } from './pie'
export type { PieChartProps, PieSlice } from './pie'
export { RadarChart, RadialChart } from './polar'
export type { RadarChartProps, RadialChartProps, RadialItem } from './polar'
export { ChartSeriesToggle } from './series-toggle'
export type { ChartSeriesToggleItem, ChartSeriesToggleProps } from './series-toggle'
export {
  categoricalColour,
  isEmptyChart,
  percentTick,
  plotValue,
  seriesColour,
  shortTick,
  toneColour,
} from './shared'
export type {
  ChartCategory,
  ChartPalette,
  ChartSeries,
  ChartStateProps,
  ChartTone,
  ChartValues,
} from './shared'

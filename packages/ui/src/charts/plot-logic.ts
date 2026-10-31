import { compareDecimal, isDecimal } from '../components/quantity-logic'
import { plotValue } from './shared'

/*
 * The layout and keyboard logic of the charts drawn as marks one by one (CandlestickChart,
 * FunnelChart, ScatterChart, Heatmap, SankeyChart, MatrixChart, Treemap), apart
 * from the markup so it can be unit-tested. Positions are measured from the plot's
 * start (`fromStart`); `physicalX` turns them into SVG coordinates, mirrored on a right-to-left
 * page for the charts whose axis is time or a scale (a candlestick's days, a heatmap's hours).
 * Values stay decimal strings; they become numbers only to be drawn, never to be shown.
 */

/** A mark's place measured from the plot's start, as an SVG x (from the end in right-to-left). */
export function physicalX(
  fromStart: number,
  width: number,
  total: number,
  direction: 'ltr' | 'rtl',
): number {
  return direction === 'rtl' ? total - fromStart - width : fromStart
}

/**
 * Where a key moves along a sequence of marks: the arrow toward the line's end (ArrowRight on a
 * left-to-right page, ArrowLeft on a right-to-left one) and ArrowDown to the next, the others to
 * the previous, Home and End to the first and the last. From nothing (`index` -1) any of them
 * starts at the first (End at the last). Null for other keys or no marks.
 */
export function sequenceKeyTarget(
  index: number,
  key: string,
  count: number,
  direction: 'ltr' | 'rtl',
): number | null {
  if (count === 0) return null
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowDown' || key === forward) return index < 0 ? 0 : Math.min(index + 1, count - 1)
  if (key === 'ArrowUp' || key === backward) return index < 0 ? 0 : Math.max(index - 1, 0)
  return null
}

/** A cell of a grid: its row from the top and its column from the start. */
export interface GridCell {
  row: number
  column: number
}

/**
 * Where a key moves in a grid of cells (Heatmap, MatrixChart): the arrows by the screen — columns
 * run from the page's start, so ArrowRight goes toward the end on a left-to-right page and toward
 * the start on a right-to-left one —, Home and End to the row's first and last cell, with Ctrl (or
 * Cmd) to the grid's first and last. From nothing any of them starts at the first cell. Null for
 * other keys or an empty grid.
 */
export function gridKeyTarget(
  at: GridCell | null,
  key: string,
  rows: number,
  columns: number,
  direction: 'ltr' | 'rtl',
  withControl = false,
): GridCell | null {
  if (rows === 0 || columns === 0) return null
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (!keys.includes(key)) return null
  if (at === null) {
    return key === 'End' && withControl
      ? { row: rows - 1, column: columns - 1 }
      : { row: 0, column: 0 }
  }
  const clampRow = (row: number) => Math.min(Math.max(row, 0), rows - 1)
  const clampColumn = (column: number) => Math.min(Math.max(column, 0), columns - 1)
  const toEnd = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  switch (key) {
    case 'ArrowUp':
      return { row: clampRow(at.row - 1), column: at.column }
    case 'ArrowDown':
      return { row: clampRow(at.row + 1), column: at.column }
    case 'Home':
      return { row: withControl ? 0 : at.row, column: 0 }
    case 'End':
      return { row: withControl ? rows - 1 : at.row, column: columns - 1 }
    default:
      return { row: at.row, column: clampColumn(at.column + (key === toEnd ? 1 : -1)) }
  }
}

/** A tick's value without the floating-point noise of a step ("0.3", not "0.30000000000000004"). */
function clean(value: number): number {
  return Number(value.toPrecision(12))
}

/**
 * Round ticks covering `min`–`max`: about `count` of them, at steps of 1, 2, 2.5 or 5 times a power
 * of ten, the first at or below `min` and the last at or above `max`. A flat range is widened, so
 * there is always something to draw against. Ticks are the scale's steps, never data.
 */
export function niceTicks(min: number, max: number, count: number): number[] {
  let low = Math.min(min, max)
  let high = Math.max(min, max)
  if (!Number.isFinite(low) || !Number.isFinite(high)) return []
  if (low === high) {
    const pad = low === 0 ? 1 : Math.abs(low) * 0.1
    low -= pad
    high += pad
  }
  const rough = (high - low) / Math.max(count - 1, 1)
  const power = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((each) => each * power).find((each) => each >= rough) ?? 10 * power
  const first = Math.floor(low / step) * step
  const ticks: number[] = []
  for (let tick = first; tick < high + step / 2; tick += step) {
    ticks.push(clean(tick))
    if (ticks.length > 50) break
  }
  const last = ticks[ticks.length - 1]
  if (last !== undefined && last < high) ticks.push(clean(last + step))
  return ticks
}

/** A linear scale from a domain to pixels. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  return (value) => (span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0))
}

/** One candle's prices: decimal strings (null when the day has none). */
export interface CandlePrices {
  key: string
  open: string | null
  high: string | null
  low: string | null
  close: string | null
}

/** The lowest low and the highest high, for drawing; null when no candle is readable. */
export function candleDomain(candles: readonly CandlePrices[]): [number, number] | null {
  const lows = candles.map((each) => plotValue(each.low)).filter((each) => each !== null)
  const highs = candles.map((each) => plotValue(each.high)).filter((each) => each !== null)
  if (lows.length === 0 || highs.length === 0) return null
  return [Math.min(...lows), Math.max(...highs)]
}

/**
 * Whether a candle rose: its close at or above its open, compared exactly as decimal strings
 * Null when either is missing or unreadable.
 */
export function candleRises(open: string | null, close: string | null): boolean | null {
  if (open === null || close === null || !isDecimal(open.trim()) || !isDecimal(close.trim()))
    return null
  return compareDecimal(close.trim(), open.trim()) >= 0
}

/** Whether a candle can be drawn: all four prices readable (otherwise a gap, never 0). */
export function candleDrawable(candle: CandlePrices): boolean {
  return (
    plotValue(candle.open) !== null &&
    plotValue(candle.high) !== null &&
    plotValue(candle.low) !== null &&
    plotValue(candle.close) !== null &&
    candleRises(candle.open, candle.close) !== null
  )
}

/** One candle drawn: its centre from the plot's start, its body and its wick, in pixels. */
export interface CandleShape {
  key: string
  /** The centre of the candle's band, measured from the plot's start. */
  centre: number
  bodyWidth: number
  bodyTop: number
  bodyHeight: number
  wickTop: number
  wickBottom: number
  rising: boolean
}

/** The most a candle's body is wide, in pixels: the rest of its band is air. */
export const CANDLE_MAX_WIDTH = 16

/**
 * The candles as shapes on a plot `width` × `height` pixels with the value scale `domain`: each in
 * its band (60% of it for the body, at most 16px, at least 1px), the body from open to close (at
 * least 1px high, so a day that closed where it opened is a line), the wick from low to high. A
 * candle missing a price is not drawn (a gap, never 0).
 */
export function candleShapes(
  candles: readonly CandlePrices[],
  width: number,
  height: number,
  domain: readonly [number, number],
): CandleShape[] {
  if (candles.length === 0 || width <= 0 || height <= 0) return []
  const band = width / candles.length
  const bodyWidth = Math.max(1, Math.min(band * 0.6, CANDLE_MAX_WIDTH))
  const y = linearScale(domain, [height, 0])
  return candles.flatMap((candle, index) => {
    const open = plotValue(candle.open)
    const high = plotValue(candle.high)
    const low = plotValue(candle.low)
    const close = plotValue(candle.close)
    const rising = candleRises(candle.open, candle.close)
    if (open === null || high === null || low === null || close === null || rising === null)
      return []
    const top = y(Math.max(open, close))
    const bottom = y(Math.min(open, close))
    return [
      {
        key: candle.key,
        centre: band * (index + 0.5),
        bodyWidth,
        bodyTop: top,
        bodyHeight: Math.max(bottom - top, 1),
        wickTop: y(high),
        wickBottom: y(low),
        rising,
      },
    ]
  })
}

/**
 * About how wide a line of text is, in pixels, at `fontSize`: wide (CJK, full-width) characters
 * take 1em, the others about 0.56em. Used only to decide whether a label fits inside a mark; a label
 * that might not fit is left out (the tooltip and the table say it), never cut.
 */
export function textWidth(text: string, fontSize: number): number {
  let width = 0
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0
    const wide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    width += wide ? fontSize : fontSize * 0.56
  }
  return width
}

/** The items placed in one cell of a matrix (likelihood × impact), in the application's order. */
export function itemsInCell<Item extends { row: string; column: string }>(
  items: readonly Item[],
  row: string,
  column: string,
): Item[] {
  return items.filter((item) => item.row === row && item.column === column)
}

/** Every cell of a grid in reading order (rows from the top, columns from the start). */
export function gridCells(rows: number, columns: number): GridCell[] {
  return Array.from({ length: rows * columns }, (_, index) => ({
    row: Math.floor(index / columns),
    column: index % columns,
  }))
}

/**
 * A grid's cell boxes on a plot `width` × `height` pixels: equal columns from the start and equal
 * rows from the top, `gap` pixels apart. Each box is measured from the start; `physicalX` places it.
 */
export function gridBoxes(
  rows: number,
  columns: number,
  width: number,
  height: number,
  gap: number,
): { fromStart: number; top: number; width: number; height: number }[][] {
  if (rows === 0 || columns === 0) return []
  const cellWidth = Math.max((width - gap * (columns - 1)) / columns, 0)
  const cellHeight = Math.max((height - gap * (rows - 1)) / rows, 0)
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (__, column) => ({
      fromStart: column * (cellWidth + gap),
      top: row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    })),
  )
}

/** A scatter point in the keyboard's order, with its series. */
export interface ScatterEntry<Point> {
  /** `<series key>:<point key>`, the point's mark. */
  id: string
  seriesIndex: number
  point: Point
}

/**
 * The drawn points of every series in the keyboard's order: by x, then by y, then as given (values
 * read for drawing only). A point missing x or y is not drawn, so not reached.
 */
export function scatterOrder<Point extends { key: string; x: string | null; y: string | null }>(
  series: readonly { key: string; points: readonly Point[] }[],
): ScatterEntry<Point>[] {
  const entries = series.flatMap((each, seriesIndex) =>
    each.points.flatMap((point) => {
      const x = plotValue(point.x)
      const y = plotValue(point.y)
      return x === null || y === null
        ? []
        : [{ id: `${each.key}:${point.key}`, seriesIndex, point, x, y }]
    }),
  )
  return entries
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map(({ id, seriesIndex, point }) => ({ id, seriesIndex, point }))
}

/**
 * A point's radius in pixels: 5 without sizes; a bubble's area grows with its value against the
 * largest (drawing only), 4–20px; a missing or non-positive size is the smallest.
 */
export function scatterRadius(value: number | null, largest: number | null): number {
  if (largest === null) return 5
  if (value === null || largest <= 0 || value <= 0) return 4
  return 4 + 16 * Math.sqrt(Math.min(value / largest, 1))
}

/**
 * Which of `count` column labels are written: at most `max`, every kth from the first (the first
 * hour, the first day), so the axis reads at equal steps; all of them when they fit.
 */
export function spacedLabels(count: number, max: number): number[] {
  if (count <= 0) return []
  const step = Math.max(1, Math.ceil(count / Math.max(max, 1)))
  return Array.from({ length: count }, (_, index) => index).filter((index) => index % step === 0)
}

/** A Sankey's data for Recharts: nodes by index, flows by their nodes' indices. */
export interface SankeyLayoutData<Node> {
  /** The nodes some drawn flow touches, in the application's order. */
  nodes: (Node & { index: number })[]
  /** The drawn flows: a known source and target and an amount above zero (drawing only). */
  links: { source: number; target: number; value: number; flow: number; index: number }[]
}

/** The nodes and flows as Recharts' Sankey takes them; unknown nodes and empty flows left out. */
export function sankeyData<Node extends { key: string }>(
  nodes: readonly Node[],
  flows: readonly { source: string; target: string; value: string | null }[],
): SankeyLayoutData<Node> {
  const known = new Set(nodes.map((node) => node.key))
  const drawn = flows.flatMap((flow, index) => {
    const value = plotValue(flow.value)
    return known.has(flow.source) &&
      known.has(flow.target) &&
      flow.source !== flow.target &&
      value !== null &&
      value > 0
      ? [{ ...flow, plot: value, flow: index }]
      : []
  })
  const used = new Set(drawn.flatMap((flow) => [flow.source, flow.target]))
  const kept = nodes.filter((node) => used.has(node.key))
  const position = new Map(kept.map((node, index) => [node.key, index]))
  return {
    nodes: kept.map((node, index) => ({ ...node, index })),
    links: drawn.map((flow, index) => ({
      source: position.get(flow.source) ?? 0,
      target: position.get(flow.target) ?? 0,
      value: flow.plot,
      flow: flow.flow,
      index,
    })),
  }
}

/** A treemap's block in the keyboard's order, with its group. */
export interface TreemapLeaf<Item> {
  item: Item
  /** The group it stands in (none without groups). */
  group?: Item
  /** The group's place among the top-level items (its colour); the block's own without groups. */
  groupIndex: number
}

/**
 * A treemap's blocks — the items without children, and the children of the groups — in the
 * application's order, each with its group; a block without a value above zero is not drawn, so
 * not reached.
 */
export function treemapLeaves<Item extends { value: string | null; children?: readonly Item[] }>(
  items: readonly Item[],
): TreemapLeaf<Item>[] {
  const drawn = (item: Item) => (plotValue(item.value) ?? 0) > 0
  return items.flatMap((item, groupIndex): TreemapLeaf<Item>[] =>
    item.children === undefined
      ? drawn(item)
        ? [{ item, groupIndex }]
        : []
      : item.children.filter(drawn).map((child) => ({ item: child, group: item, groupIndex })),
  )
}

/**
 * A funnel stage's outline: its upper edge `upper` wide from `x`, its lower edge `lower` wide and
 * centred under it, `height` below.
 */
export function trapezoidPath(
  x: number,
  y: number,
  upper: number,
  lower: number,
  height: number,
): string {
  const inset = (upper - lower) / 2
  const points = [
    [x, y],
    [x + upper, y],
    [x + upper - inset, y + height],
    [x + inset, y + height],
  ]
  return `M${points.map(([px = 0, py = 0]) => `${String(px)},${String(py)}`).join('L')}Z`
}

/**
 * How many columns a Sankey has: one more than its longest path of flows (sinks are moved to the
 * last column). Flows must not loop; a loop stops counting.
 */
export function sankeyColumns(
  nodes: number,
  links: readonly { source: number; target: number }[],
): number {
  if (nodes === 0) return 0
  const depth = new Array<number>(nodes).fill(0)
  for (let pass = 0; pass < nodes; pass += 1) {
    let changed = false
    for (const link of links) {
      const next = (depth[link.source] ?? 0) + 1
      if (next > (depth[link.target] ?? 0)) {
        depth[link.target] = next
        changed = true
      }
    }
    if (!changed) break
  }
  return Math.min(Math.max(...depth) + 1, nodes)
}

/**
 * The room in pixels a Sankey node's name has beside its node, toward the inside (after the nodes
 * of every column but the last, before the last column's): the gap to the next column, shared half
 * and half where two columns' names face each other — the last column's names and those of the
 * column before it.
 */
export function sankeyLabelRoom(
  width: number,
  nodeWidth: number,
  columns: number,
  column: number,
): number {
  if (columns < 2) return Math.max(width - nodeWidth - 12, 0)
  const gap = (width - nodeWidth) / (columns - 1) - nodeWidth
  const shared = column >= columns - 2
  return Math.max(shared ? gap / 2 - 4 : gap - 12, 0)
}

/** The column a Sankey node stands in, from its x (columns are evenly spaced). */
export function sankeyColumn(x: number, width: number, nodeWidth: number, columns: number): number {
  if (columns < 2) return 0
  const step = (width - nodeWidth) / (columns - 1)
  return Math.min(Math.max(Math.round(x / step), 0), columns - 1)
}

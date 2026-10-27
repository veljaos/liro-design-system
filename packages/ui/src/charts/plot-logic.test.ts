import { describe, expect, it } from 'vitest'
import {
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
import { stepCount, stepRanges, stepShade, valueStep } from './steps'

describe('physicalX', () => {
  it('measures from the start, mirrored in right-to-left', () => {
    expect(physicalX(10, 20, 100, 'ltr')).toBe(10)
    expect(physicalX(10, 20, 100, 'rtl')).toBe(70)
  })
})

describe('sequenceKeyTarget', () => {
  it('moves with the screen: the arrow toward the line’s end goes forward', () => {
    expect(sequenceKeyTarget(1, 'ArrowRight', 5, 'ltr')).toBe(2)
    expect(sequenceKeyTarget(1, 'ArrowLeft', 5, 'ltr')).toBe(0)
    expect(sequenceKeyTarget(1, 'ArrowLeft', 5, 'rtl')).toBe(2)
    expect(sequenceKeyTarget(1, 'ArrowDown', 5, 'rtl')).toBe(2)
  })
  it('starts at the first, stops at the ends, and Home / End jump', () => {
    expect(sequenceKeyTarget(-1, 'ArrowLeft', 5, 'ltr')).toBe(0)
    expect(sequenceKeyTarget(4, 'ArrowRight', 5, 'ltr')).toBe(4)
    expect(sequenceKeyTarget(0, 'ArrowUp', 5, 'ltr')).toBe(0)
    expect(sequenceKeyTarget(2, 'Home', 5, 'ltr')).toBe(0)
    expect(sequenceKeyTarget(2, 'End', 5, 'ltr')).toBe(4)
  })
  it('leaves other keys alone, and an empty chart', () => {
    expect(sequenceKeyTarget(1, 'Enter', 5, 'ltr')).toBeNull()
    expect(sequenceKeyTarget(-1, 'ArrowRight', 0, 'ltr')).toBeNull()
  })
})

describe('gridKeyTarget', () => {
  const at = { row: 1, column: 1 }
  it('moves by the screen: ArrowRight toward the start in right-to-left', () => {
    expect(gridKeyTarget(at, 'ArrowRight', 3, 4, 'ltr')).toEqual({ row: 1, column: 2 })
    expect(gridKeyTarget(at, 'ArrowRight', 3, 4, 'rtl')).toEqual({ row: 1, column: 0 })
    expect(gridKeyTarget(at, 'ArrowLeft', 3, 4, 'rtl')).toEqual({ row: 1, column: 2 })
    expect(gridKeyTarget(at, 'ArrowUp', 3, 4, 'ltr')).toEqual({ row: 0, column: 1 })
    expect(gridKeyTarget(at, 'ArrowDown', 3, 4, 'ltr')).toEqual({ row: 2, column: 1 })
  })
  it('stays inside the grid', () => {
    expect(gridKeyTarget({ row: 0, column: 0 }, 'ArrowUp', 3, 4, 'ltr')).toEqual({
      row: 0,
      column: 0,
    })
    expect(gridKeyTarget({ row: 2, column: 3 }, 'ArrowRight', 3, 4, 'ltr')).toEqual({
      row: 2,
      column: 3,
    })
  })
  it('Home and End go to the row’s ends, with Ctrl to the grid’s', () => {
    expect(gridKeyTarget(at, 'Home', 3, 4, 'ltr')).toEqual({ row: 1, column: 0 })
    expect(gridKeyTarget(at, 'End', 3, 4, 'ltr')).toEqual({ row: 1, column: 3 })
    expect(gridKeyTarget(at, 'Home', 3, 4, 'ltr', true)).toEqual({ row: 0, column: 0 })
    expect(gridKeyTarget(at, 'End', 3, 4, 'ltr', true)).toEqual({ row: 2, column: 3 })
  })
  it('starts at the first cell; other keys and an empty grid do nothing', () => {
    expect(gridKeyTarget(null, 'ArrowDown', 3, 4, 'ltr')).toEqual({ row: 0, column: 0 })
    expect(gridKeyTarget(null, 'End', 3, 4, 'ltr', true)).toEqual({ row: 2, column: 3 })
    expect(gridKeyTarget(at, 'Enter', 3, 4, 'ltr')).toBeNull()
    expect(gridKeyTarget(null, 'ArrowDown', 0, 4, 'ltr')).toBeNull()
  })
})

describe('niceTicks', () => {
  it('covers the range with round steps', () => {
    expect(niceTicks(117.07, 117.36, 5)).toEqual([117, 117.1, 117.2, 117.3, 117.4])
    expect(niceTicks(0, 95, 5)).toEqual([0, 25, 50, 75, 100])
    expect(niceTicks(420, 4680, 6)).toEqual([0, 1000, 2000, 3000, 4000, 5000])
  })
  it('never shows floating-point noise', () => {
    for (const tick of niceTicks(0.1, 0.7, 4)) expect(String(tick).length).toBeLessThan(6)
  })
  it('widens a flat range, and gives nothing for no range', () => {
    expect(niceTicks(5, 5, 3).length).toBeGreaterThan(1)
    expect(niceTicks(Number.NaN, 1, 3)).toEqual([])
  })
})

describe('linearScale', () => {
  it('maps the domain onto the range, inverted for a y axis', () => {
    const y = linearScale([100, 200], [200, 0])
    expect(y(100)).toBe(200)
    expect(y(150)).toBe(100)
    expect(linearScale([1, 1], [0, 10])(1)).toBe(5)
  })
})

describe('candles', () => {
  const candles = [
    { key: 'a', open: '117.1200', high: '117.1800', low: '117.0800', close: '117.1500' },
    { key: 'b', open: '117.1500', high: '117.1600', low: '117.1000', close: '117.1100' },
    { key: 'c', open: null, high: null, low: null, close: null },
    { key: 'd', open: '117.1100', high: '117.1100', low: '117.1100', close: '117.1100' },
  ]
  it('compares the close with the open exactly, as decimal strings', () => {
    expect(candleRises('117.1200', '117.1500')).toBe(true)
    expect(candleRises('117.15', '117.1500')).toBe(true)
    expect(candleRises('117.1500', '117.1499')).toBe(false)
    expect(candleRises(null, '1')).toBeNull()
    expect(candleRises('abc', '1')).toBeNull()
  })
  it('finds the lowest low and the highest high; none without prices', () => {
    expect(candleDomain(candles)).toEqual([117.08, 117.18])
    expect(candleDomain(candles.slice(2, 3))).toBeNull()
  })
  it('draws a candle only with its four prices: a missing day is a gap', () => {
    expect(candles.map(candleDrawable)).toEqual([true, true, false, true])
    const shapes = candleShapes(candles, 400, 200, [117, 117.2])
    expect(shapes.map((shape) => shape.key)).toEqual(['a', 'b', 'd'])
  })
  it('places each candle in its band, the body from open to close, the wick from low to high', () => {
    const [a, b, d] = candleShapes(candles, 400, 200, [117, 117.2])
    expect(a?.centre).toBe(50)
    expect(b?.centre).toBe(150)
    expect(a?.rising).toBe(true)
    expect(b?.rising).toBe(false)
    expect(a?.bodyTop).toBeCloseTo(50)
    expect(a?.bodyHeight).toBeCloseTo(30)
    expect(a?.wickTop).toBeCloseTo(20)
    expect(a?.wickBottom).toBeCloseTo(120)
    // A day that closed where it opened is a 1px line.
    expect(d?.bodyHeight).toBe(1)
  })
  it('keeps bodies at most 16px wide and at least 1px', () => {
    expect(candleShapes(candles.slice(0, 1), 400, 200, [117, 117.2])[0]?.bodyWidth).toBe(16)
    const many = Array.from({ length: 400 }, (_, index) => ({
      ...candles[3],
      key: String(index),
      open: '117.1',
      high: '117.2',
      low: '117',
      close: '117.1',
    }))
    expect(candleShapes(many, 200, 200, [117, 117.2])[0]?.bodyWidth).toBe(1)
  })
})

describe('textWidth', () => {
  it('counts wide characters as 1em and the rest narrower', () => {
    expect(textWidth('受注', 12)).toBe(24)
    expect(textWidth('Won', 12)).toBeCloseTo(20.16)
    expect(textWidth('', 12)).toBe(0)
  })
})

describe('grids', () => {
  it('lists the cells in reading order', () => {
    expect(gridCells(2, 2)).toEqual([
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
    ])
  })
  it('lays out equal cells with gaps, measured from the start', () => {
    const boxes = gridBoxes(2, 3, 304, 62, 2)
    expect(boxes[0]?.[0]).toEqual({ fromStart: 0, top: 0, width: 100, height: 30 })
    expect(boxes[1]?.[2]).toEqual({ fromStart: 204, top: 32, width: 100, height: 30 })
    expect(gridBoxes(0, 3, 100, 100, 2)).toEqual([])
  })
  it('places items in their cells in the application’s order', () => {
    const items = [
      { key: 'a', row: '4', column: '3' },
      { key: 'b', row: '4', column: '2' },
      { key: 'c', row: '4', column: '3' },
    ]
    expect(itemsInCell(items, '4', '3').map((item) => item.key)).toEqual(['a', 'c'])
    expect(itemsInCell(items, '1', '1')).toEqual([])
  })
  it('writes at most `max` column labels at equal steps from the first', () => {
    expect(spacedLabels(13, 8)).toEqual([0, 2, 4, 6, 8, 10, 12])
    expect(spacedLabels(13, 4)).toEqual([0, 4, 8, 12])
    expect(spacedLabels(5, 8)).toEqual([0, 1, 2, 3, 4])
    expect(spacedLabels(0, 8)).toEqual([])
  })
})

describe('scatter', () => {
  const series = [
    {
      key: 'a',
      points: [
        { key: '1', x: '30', y: '5' },
        { key: '2', x: '10', y: '9' },
        { key: '3', x: null, y: '1' },
      ],
    },
    { key: 'b', points: [{ key: '1', x: '10', y: '2' }] },
  ]
  it('orders the drawn points by x, then y; a point without x or y is not reached', () => {
    expect(scatterOrder(series).map((entry) => entry.id)).toEqual(['b:1', 'a:2', 'a:1'])
  })
  it('sizes bubbles by area against the largest; plain points without sizes', () => {
    expect(scatterRadius(null, null)).toBe(5)
    expect(scatterRadius(100, 100)).toBe(20)
    expect(scatterRadius(25, 100)).toBe(12)
    expect(scatterRadius(null, 100)).toBe(4)
    expect(scatterRadius(-1, 100)).toBe(4)
  })
})

describe('trapezoidPath', () => {
  it('centres the lower edge under the upper one', () => {
    expect(trapezoidPath(0, 0, 100, 50, 20)).toBe('M0,0L100,0L75,20L25,20Z')
  })
})

describe('sankey', () => {
  const nodes = [{ key: 'in' }, { key: 'bank' }, { key: 'out' }, { key: 'unused' }]
  it('turns keys into indices, leaving out unknown nodes, loops and empty flows', () => {
    const data = sankeyData(nodes, [
      { source: 'in', target: 'bank', value: '100.00' },
      { source: 'bank', target: 'out', value: '60' },
      { source: 'bank', target: 'nowhere', value: '10' },
      { source: 'bank', target: 'bank', value: '10' },
      { source: 'in', target: 'out', value: '0' },
      { source: 'in', target: 'out', value: null },
    ])
    expect(data.nodes.map((node) => node.key)).toEqual(['in', 'bank', 'out'])
    expect(data.links).toEqual([
      { source: 0, target: 1, value: 100, flow: 0, index: 0 },
      { source: 1, target: 2, value: 60, flow: 1, index: 1 },
    ])
  })
  it('counts the columns by the longest path', () => {
    expect(
      sankeyColumns(4, [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 0, target: 3 },
      ]),
    ).toBe(3)
    expect(sankeyColumns(0, [])).toBe(0)
  })
  it('gives names the gap to the next column, halved where two columns face each other', () => {
    // Three columns 12px wide on 612px: 288px between them.
    expect(sankeyLabelRoom(612, 12, 3, 0)).toBe(276)
    expect(sankeyLabelRoom(612, 12, 3, 1)).toBe(140)
    expect(sankeyLabelRoom(612, 12, 3, 2)).toBe(140)
    expect(sankeyColumn(300, 612, 12, 3)).toBe(1)
    expect(sankeyColumn(600, 612, 12, 3)).toBe(2)
  })
})

describe('treemapLeaves', () => {
  it('lists the blocks group by group, without the empty ones', () => {
    const leaves = treemapLeaves([
      {
        key: 'g1',
        value: '10',
        children: [
          { key: 'a', value: '6' },
          { key: 'b', value: '0' },
        ],
      },
      { key: 'c', value: '3' },
      { key: 'd', value: null },
    ])
    expect(leaves.map((leaf) => [leaf.item.key, leaf.group?.key, leaf.groupIndex])).toEqual([
      ['a', 'g1', 0],
      ['c', undefined, 1],
    ])
  })
})

describe('steps', () => {
  it('compares values with the breaks exactly; a missing value has no step', () => {
    expect(valueStep('99.9', ['100', '150'])).toBe(0)
    expect(valueStep('100.0', ['100', '150'])).toBe(1)
    expect(valueStep('150', ['100', '150'])).toBe(2)
    expect(valueStep(null, ['100'])).toBeNull()
    expect(valueStep('n/a', ['100'])).toBeNull()
  })
  it('never makes more than five steps', () => {
    const breaks = ['1', '2', '3', '4', '5', '6']
    expect(stepCount(breaks)).toBe(5)
    expect(valueStep('10', breaks)).toBe(4)
    expect(stepRanges(breaks)).toHaveLength(5)
  })
  it('shades the steps of one meaning from 25% to 100%', () => {
    expect(stepShade(0, 5, 'main')).toEqual({ colour: 'var(--liro-chart-main)', opacity: 0.25 })
    expect(stepShade(4, 5, 'neutral')).toEqual({ colour: 'var(--liro-chart-other)', opacity: 1 })
  })
})

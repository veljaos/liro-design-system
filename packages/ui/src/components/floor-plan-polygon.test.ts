import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { messagesEn } from '../provider/messages.en'
import {
  areaBox,
  areaContains,
  areaLabelPoint,
  isFixture,
  isPolygonArea,
  levelText,
  levelWidth,
  listGroups,
  percentPoint,
  pointInPolygon,
  polygonBounds,
  polygonCentroid,
  svgPoints,
  type FloorArea,
  type FloorPoint,
} from './floor-plan-logic'

/*
 * P5.25a: polygon areas (bounds, centroid, inside, the label's point, SVG points) and an item's
 * level (the bar's CSS width, never a number; the words).
 */

/** An L-shaped room: 400 × 300 without its top-right 200 × 150 corner. */
const L_SHAPE: readonly FloorPoint[] = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 150 },
  { x: 400, y: 150 },
  { x: 400, y: 300 },
  { x: 0, y: 300 },
]

const SQUARE: readonly FloorPoint[] = [
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
  { x: 100, y: 300 },
]

describe('polygon areas', () => {
  it('finds the box round a polygon', () => {
    expect(polygonBounds(L_SHAPE)).toEqual({ x: 0, y: 0, width: 400, height: 300 })
    expect(polygonBounds([{ x: 50, y: 70 }])).toEqual({ x: 50, y: 70, width: 0, height: 0 })
    expect(polygonBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('finds the centroid of the surface, in either winding', () => {
    expect(polygonCentroid(SQUARE)).toEqual({ x: 200, y: 200 })
    expect(polygonCentroid([...SQUARE].reverse())).toEqual({ x: 200, y: 200 })
    // The L: a 200 × 300 block centred at (100, 150) and a 200 × 150 block at (300, 225).
    const centroid = polygonCentroid(L_SHAPE)
    expect(centroid.x).toBeCloseTo((60000 * 100 + 30000 * 300) / 90000)
    expect(centroid.y).toBeCloseTo((60000 * 150 + 30000 * 225) / 90000)
  })

  it('takes the mean of the corners for a polygon without a surface', () => {
    expect(
      polygonCentroid([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 200, y: 0 },
      ]),
    ).toEqual({ x: 100, y: 0 })
    expect(polygonCentroid([])).toEqual({ x: 0, y: 0 })
  })

  it('tells whether a point lies inside a polygon', () => {
    expect(pointInPolygon({ x: 100, y: 100 }, L_SHAPE)).toBe(true)
    expect(pointInPolygon({ x: 300, y: 250 }, L_SHAPE)).toBe(true)
    // The missing corner of the L.
    expect(pointInPolygon({ x: 300, y: 50 }, L_SHAPE)).toBe(false)
    expect(pointInPolygon({ x: 500, y: 100 }, L_SHAPE)).toBe(false)
    expect(pointInPolygon({ x: 10, y: 10 }, [])).toBe(false)
  })

  it('treats rectangles and polygons alike', () => {
    const hall: FloorArea = { id: 'hall', label: 'Hall', x: 0, y: 0, width: 300, height: 200 }
    const room: FloorArea = { id: 'room', label: 'Room 1', points: L_SHAPE }
    expect(isPolygonArea(hall)).toBe(false)
    expect(isPolygonArea(room)).toBe(true)
    expect(areaBox(hall)).toEqual({ x: 0, y: 0, width: 300, height: 200 })
    expect(areaBox(room)).toEqual({ x: 0, y: 0, width: 400, height: 300 })
    expect(areaContains(hall, { x: 300, y: 200 })).toBe(true)
    expect(areaContains(hall, { x: 301, y: 10 })).toBe(false)
    expect(areaContains(room, { x: 300, y: 50 })).toBe(false)
    expect(areaContains(room, { x: 300, y: 200 })).toBe(true)
  })

  it('centres the name on labelAt, else on the centroid', () => {
    expect(areaLabelPoint({ id: 'a', label: 'A', points: SQUARE })).toEqual({ x: 200, y: 200 })
    expect(
      areaLabelPoint({ id: 'a', label: 'A', points: L_SHAPE, labelAt: { x: 100, y: 40 } }),
    ).toEqual({ x: 100, y: 40 })
  })

  it('writes the corners for SVG and a point in percentages of the plan', () => {
    expect(svgPoints(SQUARE)).toBe('100,100 300,100 300,300 100,300')
    expect(percentPoint({ x: 250, y: 150 }, { width: 1000, height: 600 })).toEqual({
      left: '25%',
      top: '25%',
    })
  })

  it('groups the list by polygon areas as by rectangles', () => {
    const areas: FloorArea[] = [
      { id: 'r1', label: 'Room 1', points: L_SHAPE },
      { id: 'r2', label: 'Room 2', x: 500, y: 0, width: 200, height: 200 },
    ]
    const bed = (id: string, areaId: string, x: number) => ({
      id,
      areaId,
      x,
      y: 200,
      width: 40,
      height: 80,
    })
    const groups = listGroups([bed('b2', 'r2', 550), bed('b1', 'r1', 60)], areas, 'Other')
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ['Room 1', ['b1']],
      ['Room 2', ['b2']],
    ])
  })

  it('keeps a place a place, not a fixture', () => {
    expect(isFixture({ kind: 'place' })).toBe(false)
  })
})

describe('level', () => {
  it('draws the application’s percentage as CSS, kept between 0% and 100% by CSS', () => {
    expect(levelWidth('62.5')).toBe('clamp(0%, 62.5%, 100%)')
    expect(levelWidth(' 100 ')).toBe('clamp(0%, 100%, 100%)')
    expect(levelWidth('+120')).toBe('clamp(0%, 120%, 100%)')
    expect(levelWidth('-5')).toBe('clamp(0%, -5%, 100%)')
  })

  it('draws no bar for a value that is not a decimal string', () => {
    expect(levelWidth('')).toBeNull()
    expect(levelWidth('62,5')).toBeNull()
    expect(levelWidth('about half')).toBeNull()
    expect(levelWidth('1e2')).toBeNull()
  })

  it('says the level in words: the application’s, else the formatted percentage', () => {
    const serbian = createFormat('sr-Latn-RS')
    const english = createFormat('en')
    const words = messagesEn['floorPlan.level']
    expect(levelText({ percent: '62.5' }, (value) => serbian.percent(value), words)).toBe(
      '62,5% full',
    )
    expect(levelText({ percent: '100' }, (value) => english.percent(value), words)).toBe(
      '100% full',
    )
    expect(
      levelText({ percent: '0', label: 'Empty' }, (value) => english.percent(value), words),
    ).toBe('Empty')
  })
})

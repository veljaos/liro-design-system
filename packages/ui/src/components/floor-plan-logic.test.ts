import { describe, expect, it } from 'vitest'
import {
  addedPosition,
  applyFloorChanges,
  boxesOverlap,
  dragPosition,
  duplicateDraft,
  footprint,
  isFixture,
  keepInside,
  listGroups,
  minimumPlanWidth,
  nearestItem,
  nextRotation,
  nudge,
  overlappingItems,
  percentBox,
  readingOrder,
  resizeFootprint,
  rotateChange,
  snap,
  planZoomStep,
  type FloorItem,
} from './floor-plan-logic'

const PLAN = { width: 1000, height: 600 }

/** A 3 × 2 grid of 80 × 80 tables, 200 units apart, and one far to the right on the top row. */
const A: FloorItem = { id: 'a', kind: 'table', label: 'A', x: 100, y: 100, width: 80, height: 80 }
const B: FloorItem = { id: 'b', kind: 'table', label: 'B', x: 300, y: 100, width: 80, height: 80 }
const GRID: FloorItem[] = [
  A,
  B,
  { id: 'c', kind: 'table', label: 'C', x: 500, y: 100, width: 80, height: 80 },
  { id: 'd', kind: 'table', label: 'D', x: 100, y: 300, width: 80, height: 80 },
  { id: 'e', kind: 'table', label: 'E', x: 300, y: 300, width: 80, height: 80 },
  { id: 'f', kind: 'table', label: 'F', x: 500, y: 300, width: 80, height: 80 },
]

describe('footprint and rotation', () => {
  const bar = { id: 'bar', x: 100, y: 100, width: 200, height: 40 }

  it('keeps the box unturned and after a half turn', () => {
    expect(footprint(bar)).toEqual({ x: 100, y: 100, width: 200, height: 40 })
    expect(footprint({ ...bar, rotation: 180 })).toEqual({ x: 100, y: 100, width: 200, height: 40 })
  })

  it('swaps width and height round the same centre after a quarter turn', () => {
    expect(footprint({ ...bar, rotation: 90 })).toEqual({ x: 180, y: 20, width: 40, height: 200 })
    expect(footprint({ ...bar, rotation: 270 })).toEqual({ x: 180, y: 20, width: 40, height: 200 })
  })

  it('turns clockwise in quarter turns, back to 0 after 270', () => {
    expect(nextRotation(undefined)).toBe(90)
    expect(nextRotation(90)).toBe(180)
    expect(nextRotation(180)).toBe(270)
    expect(nextRotation(270)).toBe(0)
  })

  it('keeps a turned item inside the plan', () => {
    // A 200 × 40 bar at the top edge turned upright would stick out above the plan.
    expect(rotateChange({ id: 'x', x: 0, y: 0, width: 200, height: 40 }, PLAN)).toEqual({
      rotation: 90,
      x: 0,
      y: 80,
    })
    expect(footprint({ id: 'x', x: 0, y: 80, width: 200, height: 40, rotation: 90 })).toEqual({
      x: 80,
      y: 0,
      width: 40,
      height: 200,
    })
  })
})

describe('fixtures', () => {
  it('tells the building from the places', () => {
    expect(isFixture({ kind: 'wall' })).toBe(true)
    expect(isFixture({ kind: 'stage' })).toBe(true)
    expect(isFixture({ kind: 'table' })).toBe(false)
    expect(isFixture({ kind: 'bar' })).toBe(false)
  })
})

describe('nearestItem (physical directions)', () => {
  it('goes to the neighbour straight ahead', () => {
    expect(nearestItem(GRID, 'a', 'ArrowRight')).toBe('b')
    expect(nearestItem(GRID, 'b', 'ArrowLeft')).toBe('a')
    expect(nearestItem(GRID, 'a', 'ArrowDown')).toBe('d')
    expect(nearestItem(GRID, 'e', 'ArrowUp')).toBe('b')
  })

  it('returns null at the edge', () => {
    expect(nearestItem(GRID, 'a', 'ArrowLeft')).toBeNull()
    expect(nearestItem(GRID, 'a', 'ArrowUp')).toBeNull()
    expect(nearestItem(GRID, 'f', 'ArrowRight')).toBeNull()
  })

  it('prefers an item straight ahead to a nearer one far to the side', () => {
    const items: FloorItem[] = [
      { id: 'from', kind: 'table', label: '', x: 0, y: 200, width: 40, height: 40 },
      { id: 'side', kind: 'table', label: '', x: 80, y: 20, width: 40, height: 40 },
      { id: 'ahead', kind: 'table', label: '', x: 260, y: 210, width: 40, height: 40 },
    ]
    expect(nearestItem(items, 'from', 'ArrowRight')).toBe('ahead')
  })

  it('returns null for an unknown item', () => {
    expect(nearestItem(GRID, 'nope', 'ArrowRight')).toBeNull()
  })
})

describe('readingOrder', () => {
  it('reads by rows from the top, then from the left', () => {
    const shuffled = [GRID[4], GRID[0], GRID[5], GRID[2], GRID[1], GRID[3]].filter(
      (item) => item !== undefined,
    )
    expect(readingOrder(shuffled).map((item) => item.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  it('counts items a little out of line as one row', () => {
    const items: FloorItem[] = [
      { id: 'right', kind: 'table', label: '', x: 300, y: 95, width: 80, height: 80 },
      { id: 'left', kind: 'table', label: '', x: 100, y: 105, width: 80, height: 80 },
    ]
    expect(readingOrder(items).map((item) => item.id)).toEqual(['left', 'right'])
  })
})

describe('moving with the keys', () => {
  const table = { id: 't', x: 100, y: 100, width: 80, height: 80 }

  it('moves 1 unit, with Shift 5, in physical directions', () => {
    expect(nudge(table, 'ArrowRight', false, PLAN)).toEqual({ x: 101, y: 100 })
    expect(nudge(table, 'ArrowLeft', true, PLAN)).toEqual({ x: 95, y: 100 })
    expect(nudge(table, 'ArrowDown', false, PLAN)).toEqual({ x: 100, y: 101 })
    expect(nudge(table, 'ArrowUp', true, PLAN)).toEqual({ x: 100, y: 95 })
  })

  it('stops at the plan’s edges', () => {
    expect(nudge({ ...table, x: 0 }, 'ArrowLeft', true, PLAN)).toEqual({ x: 0, y: 100 })
    expect(nudge({ ...table, x: 918 }, 'ArrowRight', true, PLAN)).toEqual({ x: 920, y: 100 })
  })

  it('ignores other keys', () => {
    expect(nudge(table, 'Enter', false, PLAN)).toBeNull()
  })
})

describe('snapping and dragging', () => {
  it('snaps to the grid, or to whole units without one', () => {
    expect(snap(104, 10)).toBe(100)
    expect(snap(105, 10)).toBe(110)
    expect(snap(104.6, undefined)).toBe(105)
    expect(snap(104.6, 0)).toBe(105)
  })

  it('keeps a footprint inside the plan', () => {
    const item = { id: 'x', x: 0, y: 0, width: 100, height: 50 }
    expect(keepInside(item, -20, 700, PLAN)).toEqual({ x: 0, y: 550 })
    expect(keepInside(item, 950, 10, PLAN)).toEqual({ x: 900, y: 10 })
  })

  it('drags by plan units, snapping the footprint’s corner', () => {
    const item = { id: 'x', x: 100, y: 100, width: 80, height: 80 }
    expect(dragPosition(item, 33, -12, 10, PLAN)).toEqual({ x: 130, y: 90 })
    expect(dragPosition(item, 33, -12, undefined, PLAN)).toEqual({ x: 133, y: 88 })
    expect(dragPosition(item, 5000, 5000, 10, PLAN)).toEqual({ x: 920, y: 520 })
  })

  it('snaps a quarter-turned item by its drawn corner', () => {
    const bar = { id: 'bar', x: 100, y: 100, width: 200, height: 40, rotation: 90 as const }
    const moved = dragPosition(bar, 12, 0, 10, PLAN)
    expect(footprint({ ...bar, ...moved }).x).toBe(190)
  })
})

describe('resizeFootprint', () => {
  it('sets the size and keeps an unturned item’s corner', () => {
    const item = { id: 'x', x: 100, y: 100, width: 80, height: 80 }
    expect(resizeFootprint(item, 123, 47, 10)).toEqual({ x: 100, y: 100, width: 120, height: 50 })
  })

  it('never goes below the smallest size', () => {
    const item = { id: 'x', x: 100, y: 100, width: 80, height: 80 }
    expect(resizeFootprint(item, 1, -20, undefined)).toEqual({
      x: 100,
      y: 100,
      width: 5,
      height: 5,
    })
  })

  it('swaps the sides of a quarter-turned item and keeps its drawn corner', () => {
    const bar = { id: 'bar', x: 100, y: 100, width: 200, height: 40, rotation: 90 as const }
    const before = footprint(bar)
    const box = resizeFootprint(bar, 60, 300, undefined)
    expect(box.width).toBe(300)
    expect(box.height).toBe(60)
    const after = footprint({ ...bar, ...box })
    expect(after).toEqual({ x: before.x, y: before.y, width: 60, height: 300 })
  })
})

describe('overlaps', () => {
  it('finds boxes that share area, not those that only touch', () => {
    expect(
      boxesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true)
    expect(
      boxesOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }),
    ).toBe(false)
  })

  it('lists each overlapping pair once, by footprint', () => {
    const items: FloorItem[] = [
      ...GRID,
      { id: 'g', kind: 'table', label: 'G', x: 150, y: 150, width: 80, height: 80 },
      { id: 'h', kind: 'bar', label: 'H', x: 190, y: 240, width: 300, height: 20, rotation: 90 },
    ]
    expect(overlappingItems(items)).toEqual([
      ['a', 'g'],
      ['b', 'h'],
      ['e', 'h'],
    ])
  })
})

describe('targets and zoom', () => {
  it('needs a wider plan when the smallest target would be under 24px', () => {
    // 1000 units, a 30-unit seat: 24px needs 0.8px a unit.
    expect(minimumPlanWidth([{ id: 's', x: 0, y: 0, width: 30, height: 30 }, A], 1000)).toBe(800)
    expect(minimumPlanWidth([], 1000)).toBe(0)
  })

  it('steps in and out, and stays at the ends', () => {
    expect(planZoomStep(1, 1)).toBe(1.5)
    expect(planZoomStep(1.5, 1)).toBe(2)
    expect(planZoomStep(3, 1)).toBe(3)
    expect(planZoomStep(2, -1)).toBe(1.5)
    expect(planZoomStep(1, -1)).toBe(1)
    expect(planZoomStep(1.2, -1)).toBe(1)
  })

  it('places boxes in percentages of the plan', () => {
    expect(percentBox({ x: 250, y: 150, width: 100, height: 60 }, PLAN)).toEqual({
      left: '25%',
      top: '25%',
      width: '10%',
      height: '10%',
    })
  })
})

describe('listGroups', () => {
  const items: FloorItem[] = [
    { id: 't2', kind: 'table', label: '2', x: 300, y: 100, width: 80, height: 80, areaId: 'hall' },
    { id: 't1', kind: 'table', label: '1', x: 100, y: 100, width: 80, height: 80, areaId: 'hall' },
    {
      id: 't9',
      kind: 'table',
      label: '9',
      x: 100,
      y: 400,
      width: 80,
      height: 80,
      areaId: 'terrace',
    },
    { id: 'b', kind: 'bar', label: 'Bar', x: 700, y: 400, width: 200, height: 40 },
    { id: 'x', kind: 'table', label: 'X', x: 700, y: 100, width: 80, height: 80, areaId: 'gone' },
  ]

  it('groups by area in the areas’ order, items in reading order, the rest last', () => {
    const groups = listGroups(
      items,
      [
        { id: 'terrace', label: 'Terrace' },
        { id: 'hall', label: 'Hall' },
        { id: 'empty', label: 'Empty' },
      ],
      'Other',
    )
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ['Terrace', ['t9']],
      ['Hall', ['t1', 't2']],
      ['Other', ['x', 'b']],
    ])
  })
})

describe('changes', () => {
  it('applies adds, moves, resizes, turns and removes in order', () => {
    const result = applyFloorChanges(
      GRID.slice(0, 3),
      [
        { type: 'move', id: 'a', x: 110, y: 120 },
        { type: 'resize', id: 'b', x: 300, y: 100, width: 160, height: 80 },
        { type: 'rotate', id: 'b', rotation: 90, x: 300, y: 100 },
        { type: 'remove', id: 'c' },
        { type: 'add', item: { kind: 'seat', label: 'New', x: 0, y: 0, width: 30, height: 30 } },
        { type: 'move', id: 'unknown', x: 0, y: 0 },
      ],
      (_, index) => `new-${String(index)}`,
    )
    expect(result).toEqual([
      { ...A, x: 110, y: 120 },
      { ...B, width: 160, rotation: 90 },
      { id: 'new-4', kind: 'seat', label: 'New', x: 0, y: 0, width: 30, height: 30 },
    ])
  })

  it('duplicates one grid step down and to the right, without the id', () => {
    const copy = duplicateDraft({ ...A, stateId: 'free', capacity: 4 }, 10, PLAN)
    expect(copy).toEqual({
      kind: 'table',
      label: 'A',
      x: 110,
      y: 110,
      width: 80,
      height: 80,
      stateId: 'free',
      capacity: 4,
    })
    expect(duplicateDraft({ ...A, x: 920, y: 520 }, undefined, PLAN)).toMatchObject({
      x: 920,
      y: 520,
    })
  })

  it('adds from the palette at the plan’s centre, on the grid', () => {
    expect(addedPosition({ width: 80, height: 80 }, 10, PLAN)).toEqual({ x: 460, y: 260 })
    expect(addedPosition({ width: 2000, height: 80 }, 10, PLAN)).toEqual({ x: 0, y: 260 })
  })
})

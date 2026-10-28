import { describe, expect, it } from 'vitest'
import { dropLineOffset, dropMoves, listDropTarget, type DropZoneGeometry } from './list-drag-logic'

/** Two lists stacked: Rows (two items) above Columns (empty). */
const GEOMETRY: DropZoneGeometry[] = [
  {
    id: 'rows',
    x: 0,
    y: 0,
    width: 300,
    height: 100,
    items: [
      { id: 'a', y: 8, height: 36 },
      { id: 'b', y: 52, height: 36 },
    ],
  },
  { id: 'columns', x: 0, y: 120, width: 300, height: 48, items: [] },
]

describe('listDropTarget', () => {
  it('lands in the list under the point, after every other item above it', () => {
    expect(listDropTarget(GEOMETRY, 'a', { x: 10, y: 80 })).toEqual({ zone: 'rows', index: 1 })
    expect(listDropTarget(GEOMETRY, 'b', { x: 10, y: 10 })).toEqual({ zone: 'rows', index: 0 })
    expect(listDropTarget(GEOMETRY, 'a', { x: 10, y: 140 })).toEqual({ zone: 'columns', index: 0 })
  })

  it('takes the nearest list that accepts the item when the point is outside every list', () => {
    expect(listDropTarget(GEOMETRY, 'a', { x: 10, y: 400 })).toEqual({ zone: 'columns', index: 0 })
    expect(listDropTarget(GEOMETRY, 'a', { x: 10, y: 140 }, (zone) => zone !== 'columns')).toEqual({
      zone: 'rows',
      index: 1,
    })
    expect(listDropTarget(GEOMETRY, 'a', { x: 10, y: 140 }, () => false)).toBeNull()
  })
})

describe('dropLineOffset and dropMoves', () => {
  it('draws the line between items, above the first, below the last, at the top when empty', () => {
    const rows = GEOMETRY[0]
    const columns = GEOMETRY[1]
    if (rows === undefined || columns === undefined) throw new Error('geometry')
    expect(dropLineOffset(rows, 'x', 0)).toBe(6)
    expect(dropLineOffset(rows, 'x', 1)).toBe(48)
    expect(dropLineOffset(rows, 'x', 2)).toBe(90)
    expect(dropLineOffset(rows, 'a', 1)).toBe(90)
    expect(dropLineOffset(columns, 'a', 0)).toBe(0)
  })

  it('reports a drop only when it changes the list or the place', () => {
    expect(dropMoves({ zone: 'rows', index: 1 }, { zone: 'rows', index: 1 })).toBe(false)
    expect(dropMoves({ zone: 'rows', index: 1 }, { zone: 'rows', index: 0 })).toBe(true)
    expect(dropMoves({ zone: 'rows', index: 0 }, { zone: 'columns', index: 0 })).toBe(true)
  })
})

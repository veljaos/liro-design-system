import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { DashboardGrid, type DashboardCard } from './dashboard-grid'
import {
  addCard,
  allowedSizes,
  cardSpan,
  dashboardKeyTarget,
  gridPlacement,
  layoutOf,
  moveCardBy,
  moveCardTo,
  removeCard,
  resizeCard,
  type DashboardCardSize,
} from './dashboard-grid-logic'

const SIZES: DashboardCardSize[] = [
  { id: 'small', label: 'Small', columns: 1 },
  { id: 'medium', label: 'Medium', columns: 2 },
  { id: 'wide', label: 'Wide', columns: 3 },
  { id: 'full', label: 'Full width', columns: 4 },
]

const LAYOUT = [
  { id: 'revenue', size: 'small' },
  { id: 'cash', size: 'small' },
  { id: 'chart', size: 'medium' },
  { id: 'table', size: 'full' },
]

describe('moving, resizing, removing and adding', () => {
  it('moves a card to a place, clamped to the ends', () => {
    expect(moveCardTo(LAYOUT, 'table', 0).map((item) => item.id)).toEqual([
      'table',
      'revenue',
      'cash',
      'chart',
    ])
    expect(moveCardTo(LAYOUT, 'revenue', 2).map((item) => item.id)).toEqual([
      'cash',
      'chart',
      'revenue',
      'table',
    ])
    expect(moveCardTo(LAYOUT, 'revenue', 99).map((item) => item.id)).toEqual([
      'cash',
      'chart',
      'table',
      'revenue',
    ])
    expect(moveCardTo(LAYOUT, 'missing', 0)).toEqual(LAYOUT)
  })
  it('moves one place earlier or later, never past an end, keeping the size', () => {
    expect(moveCardBy(LAYOUT, 'chart', -1)).toEqual([
      { id: 'revenue', size: 'small' },
      { id: 'chart', size: 'medium' },
      { id: 'cash', size: 'small' },
      { id: 'table', size: 'full' },
    ])
    expect(moveCardBy(LAYOUT, 'revenue', -1)).toEqual(LAYOUT)
    expect(moveCardBy(LAYOUT, 'table', 1)).toEqual(LAYOUT)
  })
  it('resizes one card and removes one card', () => {
    expect(resizeCard(LAYOUT, 'cash', 'medium')[1]).toEqual({ id: 'cash', size: 'medium' })
    expect(resizeCard(LAYOUT, 'cash', 'medium')[0]).toEqual(LAYOUT[0])
    expect(removeCard(LAYOUT, 'chart').map((item) => item.id)).toEqual(['revenue', 'cash', 'table'])
  })
  it('adds a card at the end or at a place, never twice', () => {
    expect(addCard(LAYOUT, { id: 'budget', size: 'medium' }).at(-1)).toEqual({
      id: 'budget',
      size: 'medium',
    })
    expect(addCard(LAYOUT, { id: 'budget', size: 'medium' }, 0)[0]?.id).toBe('budget')
    expect(addCard(LAYOUT, { id: 'cash', size: 'full' })).toEqual(LAYOUT)
  })
  it('reads the layout of cards', () => {
    expect(layoutOf([{ id: 'a', size: 'small', title: 'A' } as never])).toEqual([
      { id: 'a', size: 'small' },
    ])
  })
})

describe('cardSpan and allowedSizes', () => {
  it('takes the size’s columns, never more than the grid has, at least one', () => {
    expect(cardSpan('medium', SIZES, 4)).toBe(2)
    expect(cardSpan('full', SIZES, 4)).toBe(4)
    expect(cardSpan('full', SIZES, 2)).toBe(2)
    expect(cardSpan('wide', SIZES, 1)).toBe(1)
    expect(cardSpan('unknown', SIZES, 4)).toBe(1)
  })
  it('offers the sizes a card names, in the application’s order', () => {
    expect(allowedSizes(SIZES).map((size) => size.id)).toEqual(['small', 'medium', 'wide', 'full'])
    expect(allowedSizes(SIZES, ['full', 'medium']).map((size) => size.id)).toEqual([
      'medium',
      'full',
    ])
  })
})

describe('gridPlacement', () => {
  it('places cards in order and wraps a card that does not fit', () => {
    expect(gridPlacement([1, 1, 2, 4, 3, 2], 4)).toEqual([
      { row: 0, column: 0, span: 1 },
      { row: 0, column: 1, span: 1 },
      { row: 0, column: 2, span: 2 },
      { row: 1, column: 0, span: 4 },
      { row: 2, column: 0, span: 3 },
      { row: 3, column: 0, span: 2 },
    ])
  })
  it('clamps spans to the grid, one card a row in one column', () => {
    expect(gridPlacement([4, 1], 2)).toEqual([
      { row: 0, column: 0, span: 2 },
      { row: 1, column: 0, span: 1 },
    ])
    expect(gridPlacement([2, 3], 1).map((place) => place.row)).toEqual([0, 1])
  })
})

describe('dashboardKeyTarget', () => {
  // Row 0: [0][1][ 2 2 ]; row 1: [ 3 3 3 3 ]; row 2: [4][ 5 5 ]
  const places = gridPlacement([1, 1, 2, 4, 1, 2], 4)
  it('moves along the reading order, mirrored in right-to-left', () => {
    expect(dashboardKeyTarget('ArrowRight', 1, places, 'ltr')).toBe(2)
    expect(dashboardKeyTarget('ArrowLeft', 1, places, 'ltr')).toBe(0)
    expect(dashboardKeyTarget('ArrowRight', 1, places, 'rtl')).toBe(0)
    expect(dashboardKeyTarget('ArrowLeft', 1, places, 'rtl')).toBe(2)
    expect(dashboardKeyTarget('ArrowLeft', 0, places, 'ltr')).toBeNull()
    expect(dashboardKeyTarget('ArrowRight', 5, places, 'ltr')).toBeNull()
  })
  it('moves up and down to the card that shares the most columns', () => {
    expect(dashboardKeyTarget('ArrowDown', 2, places, 'ltr')).toBe(3)
    expect(dashboardKeyTarget('ArrowDown', 3, places, 'ltr')).toBe(5)
    expect(dashboardKeyTarget('ArrowUp', 3, places, 'ltr')).toBe(2)
    expect(dashboardKeyTarget('ArrowUp', 4, places, 'ltr')).toBe(3)
    expect(dashboardKeyTarget('ArrowUp', 0, places, 'ltr')).toBeNull()
    expect(dashboardKeyTarget('ArrowDown', 5, places, 'ltr')).toBeNull()
  })
  it('falls back to the nearest start column when nothing shares a column', () => {
    // Row 0: [0][1]; row 1: [ 2 2 ] … a narrow row under a gap.
    const gap = [
      { row: 0, column: 3, span: 1 },
      { row: 1, column: 0, span: 1 },
      { row: 1, column: 1, span: 1 },
    ]
    expect(dashboardKeyTarget('ArrowDown', 0, gap, 'ltr')).toBe(2)
  })
  it('goes to the start and the end, and ignores other keys', () => {
    expect(dashboardKeyTarget('Home', 4, places, 'ltr')).toBe(0)
    expect(dashboardKeyTarget('End', 0, places, 'rtl')).toBe(5)
    expect(dashboardKeyTarget('Home', 0, places, 'ltr')).toBeNull()
    expect(dashboardKeyTarget('Enter', 2, places, 'ltr')).toBeNull()
  })
})

const CARDS: DashboardCard[] = [
  { id: 'revenue', title: 'Revenue', size: 'small', content: <p>Revenue card</p> },
  {
    id: 'table',
    title: 'Open invoices',
    size: 'full',
    sizes: ['wide', 'full'],
    content: <p>Table card</p>,
  },
]

function html(props: Partial<Parameters<typeof DashboardGrid>[0]>) {
  return renderToStaticMarkup(
    <LiroProvider locale="en-GB">
      <DashboardGrid label="Overview" cards={CARDS} sizes={SIZES} {...props} />
    </LiroProvider>,
  )
}

describe('DashboardGrid', () => {
  it('shows only the cards in view mode, each with its spans', () => {
    const markup = html({})
    expect(markup).toContain('Revenue card')
    expect(markup).not.toContain('Move: Revenue')
    expect(markup).toContain('--liro-dash-span:4;--liro-dash-span-xs:2')
    expect(markup).toContain('--liro-dash-columns:4')
  })
  it('gives each card a handle, a size button, a menu and Remove in editing mode', () => {
    const markup = html({ editing: true })
    expect(markup).toContain('aria-label="Move: Revenue"')
    expect(markup).toContain('aria-label="Small, size of Revenue"')
    expect(markup).toContain('aria-label="Options: Open invoices"')
    expect(markup).toContain('aria-label="Remove: Open invoices"')
    expect(markup).toContain('inert=""')
  })
  it('on phones moves by the menu only: no handle, no size button, no spans', () => {
    const markup = html({ editing: true, layout: 'phone' })
    expect(markup).not.toContain('Move: Revenue')
    expect(markup).not.toContain('size of Revenue')
    expect(markup).toContain('aria-label="Options: Revenue"')
    expect(markup).not.toContain('--liro-dash-span:')
  })
  it('keeps each card’s place with a skeleton while loading, and says when it is empty', () => {
    expect(html({ loading: true })).toContain('aria-busy="true"')
    expect(html({ loading: true })).not.toContain('Revenue card')
    expect(html({ cards: [] })).toContain('No cards on this dashboard.')
    expect(html({ cards: [], empty: <p>Add your first card</p> })).toContain('Add your first card')
  })
})

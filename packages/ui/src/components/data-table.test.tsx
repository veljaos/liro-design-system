import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { DataTable, type DataTableColumn, type DataTableProps } from './data-table'
import {
  ariaSort,
  clampWidth,
  COUNT_THRESHOLD,
  formatCount,
  hasActiveFilters,
  isActiveFilterValue,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  nextSort,
  widthAfterDrag,
  widthAfterKey,
} from './data-table-logic'

interface Line {
  id: string
  name: string
  amount: string
}

const ROWS: Line[] = [
  { id: 'b', name: 'Beta', amount: '2.50' },
  { id: 'a', name: 'Alpha', amount: '10.00' },
  { id: 'c', name: 'Gamma', amount: '1.25' },
]

const COLUMNS: DataTableColumn<Line>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, sortable: true },
  { id: 'amount', header: 'Amount', cell: (row) => row.amount, align: 'end', numeric: true },
]

const render = (props: Partial<DataTableProps<Line>> = {}) =>
  renderToStaticMarkup(
    <LiroProvider locale="en">
      <DataTable
        label="Lines"
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        {...props}
      />
    </LiroProvider>,
  )

/** The row names in the order the table draws them. */
const order = (html: string) =>
  [...html.matchAll(/<td[^>]*><span[^>]*>(Alpha|Beta|Gamma)<\/span><\/td>/g)].map(
    (match) => match[1],
  )

const en = createFormat('en')

describe('formatCount', () => {
  it('shows the exact number up to the threshold and "More than" above it', () => {
    expect(formatCount(messagesEn, en, 1)).toBe('1 row')
    expect(formatCount(messagesEn, en, 1234)).toBe('1,234 rows')
    expect(formatCount(messagesEn, en, COUNT_THRESHOLD)).toBe('10,000 rows')
    expect(formatCount(messagesEn, en, 10_001)).toBe('More than 10,000 rows')
    expect(formatCount(messagesEn, en, 250, true, 100)).toBe('More than 100 rows')
  })

  it('reads a count the server did not finish as a lower bound', () => {
    expect(formatCount(messagesEn, en, 500, false)).toBe('More than 500 rows')
  })

  it('writes the number through the provider format, as every count (P4.9)', () => {
    const sr = createFormat('sr-Latn-RS')
    expect(formatCount(messagesEn, sr, 1284)).toBe('1.284 rows')
    expect(formatCount(messagesEn, sr, 10_001)).toBe('More than 10.000 rows')
  })
})

describe('filters', () => {
  it('count only values that filter something', () => {
    for (const value of [null, undefined, '', false, []])
      expect(isActiveFilterValue(value)).toBe(false)
    for (const value of ['x', 0, true, ['a'], { from: '1' }]) {
      expect(isActiveFilterValue(value)).toBe(true)
    }
    expect(hasActiveFilters(undefined)).toBe(false)
    expect(hasActiveFilters({ status: null, search: '' })).toBe(false)
    expect(hasActiveFilters({ status: ['open'] })).toBe(true)
  })
})

describe('sort', () => {
  it('goes ascending, then descending, then ascending again; another column starts ascending', () => {
    expect(nextSort(null, 'name')).toEqual({ column: 'name', direction: 'asc' })
    expect(nextSort({ column: 'name', direction: 'asc' }, 'name')).toEqual({
      column: 'name',
      direction: 'desc',
    })
    expect(nextSort({ column: 'name', direction: 'desc' }, 'name')).toEqual({
      column: 'name',
      direction: 'asc',
    })
    expect(nextSort({ column: 'name', direction: 'desc' }, 'date')).toEqual({
      column: 'date',
      direction: 'asc',
    })
  })

  it('gives aria-sort only to sortable columns', () => {
    expect(ariaSort(null, 'name', true)).toBe('none')
    expect(ariaSort({ column: 'name', direction: 'asc' }, 'name', true)).toBe('ascending')
    expect(ariaSort({ column: 'name', direction: 'desc' }, 'name', true)).toBe('descending')
    expect(ariaSort({ column: 'name', direction: 'desc' }, 'name', false)).toBeUndefined()
  })
})

describe('DataTable', () => {
  it('never sorts: the rows keep the order they came in, whatever the sort says', () => {
    const noop = () => undefined
    expect(order(render())).toEqual(['Beta', 'Alpha', 'Gamma'])
    for (const direction of ['asc', 'desc'] as const) {
      const html = render({ sort: { column: 'name', direction }, onSortChange: noop })
      expect(order(html)).toEqual(['Beta', 'Alpha', 'Gamma'])
      expect(html).toContain(`aria-sort="${direction === 'asc' ? 'ascending' : 'descending'}"`)
    }
  })

  it('never sums: no totals row without totals, and only the totals it is given', () => {
    const plain = render()
    expect(plain).not.toContain('<tfoot')
    expect(plain).not.toContain('13.75')
    const html = render({ totals: { amount: '99.00' }, totalsLabel: 'Total' })
    const footer = html.slice(html.indexOf('<tfoot'))
    expect(footer).toContain('>Total</td>')
    expect(footer).toContain('>99.00</td>')
    expect(html).not.toContain('13.75')
  })

  it('leaves the label out when the first column has a total of its own', () => {
    const html = render({ totals: { name: '3 lines', amount: '99.00' }, totalsLabel: 'Total' })
    expect(html).toContain('>3 lines</td>')
    expect(html).not.toContain('>Total</td>')
  })

  it('shows a sort control only on sortable columns, and only with onSortChange', () => {
    expect(render()).not.toContain('aria-sort')
    const html = render({ onSortChange: () => undefined })
    expect(html.match(/aria-sort=/g)).toHaveLength(1)
    expect(html.match(/<button[^>]*>/g)).toHaveLength(1)
  })

  it('tells "nothing here yet" from "no rows match", which offers to clear the filters', () => {
    expect(render({ rows: [] })).toContain(messagesEn['table.noRows'])
    const filtered = render({
      rows: [],
      filters: { status: 'open' },
      onFiltersChange: () => undefined,
    })
    expect(filtered).toContain(messagesEn['table.noMatch'])
    expect(filtered).toContain(messagesEn['table.clearFilters'])
    expect(render({ rows: [], filters: { status: null } })).toContain(messagesEn['table.noRows'])
  })

  it('shows skeleton bars on the first load and keeps the rows on a refetch', () => {
    const first = render({ rows: [], loading: true })
    expect(first.match(/data-slot="skeleton"/g)).toHaveLength(5)
    expect(first).toContain('<thead')
    expect(first).not.toContain(messagesEn['table.noRows'])
    expect(
      render({ rows: [], loading: true, skeletonRows: 3 }).match(/data-slot="skeleton"/g),
    ).toHaveLength(3)
    const refetch = render({ loading: true })
    expect(order(refetch)).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(refetch).toContain('role="status"')
    expect(refetch).toContain('aria-busy="true"')
    expect(refetch).not.toContain('data-slot="skeleton"')
  })

  it('marks selected rows and makes the header checkbox indeterminate for some', () => {
    const some = render({ selection: ['a'], onSelectionChange: () => undefined })
    expect(some).toContain('aria-selected="true"')
    expect(some).toContain('bg-surface-selected')
    expect(some).toContain('data-state="indeterminate"')
    expect(some).toContain('aria-label="Select Alpha"')
    const all = render({ selection: ['a', 'b', 'c'], onSelectionChange: () => undefined })
    expect(all).not.toContain('data-state="indeterminate"')
    expect(all.match(/data-state="checked"/g)?.length).toBeGreaterThanOrEqual(4)
    expect(render()).not.toContain('role="checkbox"')
  })

  it('makes rows focusable and highlighted only when they can be pressed', () => {
    expect(render()).not.toContain('tabindex')
    expect(render()).not.toContain('hover:bg-surface-sunken')
    const html = render({ onRowClick: () => undefined })
    expect(html.match(/<tr tabindex="0"/g)).toHaveLength(3)
    expect(html).toContain('hover:bg-surface-sunken')
  })

  it('writes the count through the messages, with paging', () => {
    const html = render({ count: 25_000, onNext: () => undefined, hasNext: true })
    expect(html).toContain('More than 10,000 rows')
    expect(html).toContain('aria-label="Next"')
  })

  it('passes the count options, the bulk loading state and the class name through', () => {
    expect(render({ count: 300, countIsExact: false })).toContain('More than 300 rows')
    expect(render({ count: 300, countThreshold: 100 })).toContain('More than 100 rows')
    const bulk = (bulkLoading: boolean) =>
      render({
        selection: ['a'],
        onSelectionChange: () => undefined,
        bulkActions: [
          { key: 'export', intent: 'export', label: 'Export', onClick: () => undefined },
        ],
        bulkLoading,
      })
    expect(bulk(false)).toContain('1 selected')
    expect(bulk(true).match(/<button[^>]*disabled=""[^>]*>/g)?.length ?? 0).toBeGreaterThan(
      bulk(false).match(/<button[^>]*disabled=""[^>]*>/g)?.length ?? 0,
    )
    expect(render({ className: 'my-table' })).toContain('my-table')
  })
})

describe('column widths', () => {
  it('stay between 64px (or the column minimum) and 640px, in whole pixels', () => {
    expect(clampWidth(10)).toBe(MIN_COLUMN_WIDTH)
    expect(clampWidth(10, 120)).toBe(120)
    expect(clampWidth(9000)).toBe(MAX_COLUMN_WIDTH)
    expect(clampWidth(100.6)).toBe(101)
  })

  it('widen with the arrow that points in the reading direction, 10px or 40px with Shift', () => {
    expect(widthAfterKey(200, 'ArrowRight', false, 'ltr')).toBe(210)
    expect(widthAfterKey(200, 'ArrowLeft', false, 'ltr')).toBe(190)
    expect(widthAfterKey(200, 'ArrowRight', true, 'ltr')).toBe(240)
    expect(widthAfterKey(200, 'ArrowLeft', false, 'rtl')).toBe(210)
    expect(widthAfterKey(200, 'ArrowRight', true, 'rtl')).toBe(160)
    expect(widthAfterKey(200, 'ArrowUp', false, 'ltr')).toBeNull()
    expect(widthAfterKey(70, 'ArrowLeft', true, 'ltr')).toBe(MIN_COLUMN_WIDTH)
    expect(widthAfterKey(635, 'ArrowRight', false, 'ltr')).toBe(MAX_COLUMN_WIDTH)
  })

  it('follow the pointer from the leading edge in both directions', () => {
    expect(widthAfterDrag(200, 500, 530, 'ltr')).toBe(230)
    expect(widthAfterDrag(200, 500, 470, 'ltr')).toBe(170)
    // In right-to-left the column's end is on the left: moving left widens it.
    expect(widthAfterDrag(200, 500, 470, 'rtl')).toBe(230)
    expect(widthAfterDrag(200, 500, 530, 'rtl')).toBe(170)
    expect(widthAfterDrag(200, 500, 0, 'ltr', 90)).toBe(90)
  })
})

describe('DataTable on a phone', () => {
  it('renders either the table or the cards, never both', () => {
    const cards = render({ layout: 'cards' })
    expect(cards).not.toContain('<table')
    expect(cards).toContain('<ul')
    const table = render({ layout: 'table' })
    expect(table).toContain('<table')
    expect(table).not.toContain('<ul')
  })

  it('builds each card from the mobile description', () => {
    const html = render({
      layout: 'cards',
      mobile: {
        title: (row) => `Title ${row.name}`,
        subtitle: (row) => `Sub ${row.id}`,
        badge: () => 'BADGE',
        details: ['amount'],
      },
      selection: ['a'],
      onSelectionChange: () => undefined,
      rowActions: () => [],
    })
    expect(html).toContain('Title Alpha')
    expect(html).toContain('Sub a')
    expect(html).toContain('BADGE')
    expect(html).toContain('<dt class="text-xs text-tertiary bidi-content">Amount</dt>')
    expect(html).not.toContain('>Name</dt>')
    expect(html).toContain('aria-label="Select Alpha"')
    expect(html).toContain('aria-label="Actions: Alpha"')
    expect(html).toContain('border-selected bg-surface-selected')
  })

  it('uses the row label and every column without a mobile description', () => {
    const html = render({ layout: 'cards' })
    expect(html).toContain('>Alpha</span>')
    expect(html).toContain('>Name</dt>')
    expect(html).toContain('>Amount</dt>')
  })

  it('in a card, draws one flat list with dividers, never cards in a card (P4.9)', () => {
    const flat = render({ layout: 'cards', inCard: true })
    expect(flat).not.toContain('rounded-md border border-solid p-3')
    expect(flat).toContain('[&amp;&gt;li+li]:border-t')
    expect(render({ layout: 'cards' })).toContain('rounded-md border border-solid p-3')
  })

  it('in a card, ends with the last row when nothing stands under it (P4.9)', () => {
    expect(render({ layout: 'table', inCard: true })).not.toContain('pb-3')
    expect(render({ layout: 'table', inCard: true, count: 3 })).toContain('pb-3')
  })

  it('shows the given totals under the cards, and the empty and loading states', () => {
    const html = render({ layout: 'cards', totals: { amount: '99.00' }, totalsLabel: 'Total' })
    expect(html).toContain('>99.00</span>')
    expect(render({ layout: 'cards', rows: [] })).toContain(messagesEn['table.noRows'])
    expect(
      render({ layout: 'cards', rows: [], loading: true }).match(/data-slot="skeleton"/g),
    ).toHaveLength(5)
  })
})

describe('DataTable with many rows', () => {
  it('numbers the rows for assistive technology when virtualized', () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({
      id: String(index),
      name: `Row ${String(index)}`,
      amount: '1.00',
    }))
    const html = render({ rows, virtualize: true, maxHeight: '400px' })
    expect(html).toContain('aria-rowcount="1001"')
    expect(html).toContain('sticky top-0')
    // Only the rows in view are drawn, never all thousand.
    expect((html.match(/aria-rowindex=/g) ?? []).length).toBeLessThan(100)
  })
})

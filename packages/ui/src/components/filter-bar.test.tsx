import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { FilterBar } from './filter-bar'
import {
  clearFilters,
  emptyFilterValue,
  filterValueText,
  isFilterSet,
  rangeText,
  sortButtonText,
  type FilterDefinition,
} from './filter-logic'

const FILTERS: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
    ],
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'multiSelect',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
  },
  { id: 'issued', label: 'Issued', type: 'dateRange' },
  { id: 'total', label: 'Total', type: 'numberRange', decimals: 2 },
  { id: 'paid', label: 'Paid', type: 'boolean' },
  { id: 'note', label: 'Note', type: 'text' },
]

const byId = (id: string) => {
  const filter = FILTERS.find((one) => one.id === id)
  if (filter === undefined) throw new Error(id)
  return filter
}

const format = createFormat('en')

describe('isFilterSet', () => {
  it('reads null, undefined, empty text, an empty list and an open range as not set', () => {
    for (const value of [
      null,
      undefined,
      '',
      [],
      { start: null, end: null },
      { min: '', max: null },
    ]) {
      expect(isFilterSet(value)).toBe(false)
    }
  })

  it('reads false, a value, a list and a half-open range as set', () => {
    for (const value of [
      false,
      'sent',
      ['a'],
      { start: '2026-09-01', end: null },
      { min: '0', max: null },
    ]) {
      expect(isFilterSet(value)).toBe(true)
    }
  })
})

describe('clearFilters', () => {
  it("clears only the bar's own filters and keeps the application's other keys", () => {
    const values = { status: 'sent', tags: ['a'], owner: 'me' }
    const cleared = clearFilters(FILTERS, values)
    expect(cleared.owner).toBe('me')
    expect(cleared.status).toBeNull()
    expect(cleared.tags).toEqual([])
    expect(cleared.issued).toEqual({ start: null, end: null })
    expect(cleared.total).toEqual({ min: null, max: null })
    expect(FILTERS.every((filter) => !isFilterSet(cleared[filter.id]))).toBe(true)
  })

  it('has an empty value for each kind', () => {
    expect(emptyFilterValue(byId('note'))).toBeNull()
    expect(emptyFilterValue(byId('paid'))).toBeNull()
  })
})

describe('filterValueText', () => {
  const text = (id: string, value: unknown) => filterValueText(byId(id), value, format, messagesEn)

  it('writes option labels, lists, yes / no and text', () => {
    expect(text('status', 'paid')).toBe('Paid')
    expect(text('tags', ['a', 'b'])).toBe('Alpha, Beta')
    expect(text('paid', true)).toBe('Yes')
    expect(text('paid', false)).toBe('No')
    expect(text('note', 'urgent')).toBe('urgent')
    expect(text('status', null)).toBeNull()
  })

  it('writes ranges "from – to" through format, never rounding', () => {
    expect(text('issued', { start: '2026-09-01', end: '2026-09-30' })).toBe(
      `${format.date('2026-09-01')} – ${format.date('2026-09-30')}`,
    )
    expect(text('total', { min: '1000', max: '2500.125' })).toBe('1,000.00 – 2,500.125')
    expect(text('total', { min: null, max: '10' })).toBe('– 10.00')
    expect(text('total', { min: '10', max: null })).toBe('10.00 –')
  })

  it('writes an amount range with its currency (P3.6)', () => {
    const amount = { id: 'amount', label: 'Amount', type: 'numberRange' as const, currency: 'EUR' }
    expect(filterValueText(amount, { min: '10', max: '20.5' }, format, messagesEn)).toBe(
      `${format.money('10', 'EUR')} – ${format.money('20.5', 'EUR')}`,
    )
  })

  it('joins the ends with an en dash', () => {
    expect(rangeText('a', 'b')).toBe('a – b')
  })
})

describe('sortButtonText', () => {
  const columns = [
    { id: 'date', label: 'Date' },
    { id: 'total', label: 'Total' },
  ]
  it('names the sorted column with its direction, or the fallback', () => {
    expect(sortButtonText({ column: 'date', direction: 'desc' }, columns, 'Sort')).toBe('Date ↓')
    expect(sortButtonText({ column: 'total', direction: 'asc' }, columns, 'Sort')).toBe('Total ↑')
    expect(sortButtonText(null, columns, 'Sort')).toBe('Sort')
    expect(sortButtonText({ column: 'gone', direction: 'asc' }, columns, 'Sort')).toBe('Sort')
  })
})

describe('FilterBar', () => {
  const render = (node: React.ReactNode) =>
    renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

  it('puts the first `inline` filters in the row, labelled, and the rest behind "Filters"', () => {
    const html = render(
      <FilterBar
        filters={FILTERS}
        values={{}}
        onValuesChange={() => undefined}
        inline={2}
        layout="desktop"
      />,
    )
    expect(html).toContain('>Status</label>')
    expect(html).toContain('>Tags</label>')
    expect(html).not.toContain('>Issued</label>')
    expect(html).toContain('>Filters</span>')
  })

  it('shows pills only for active filters that are not inline, and "Clear all"', () => {
    const html = render(
      <FilterBar
        filters={FILTERS}
        values={{ status: 'sent', paid: true }}
        onValuesChange={() => undefined}
        inline={1}
        layout="desktop"
      />,
    )
    expect(html).toContain('Paid: Yes')
    expect(html).not.toContain('Status: Sent')
    expect(html).toContain('aria-label="Remove filter: Paid"')
    expect(html).toContain('>Clear all</span>')
  })

  it('on phones puts every filter in the drawer and offers the sort', () => {
    const html = render(
      <FilterBar
        filters={FILTERS}
        values={{ status: 'sent' }}
        onValuesChange={() => undefined}
        inline={3}
        layout="phone"
        sort={{ column: 'date', direction: 'desc' }}
        sortColumns={[{ id: 'date', label: 'Date' }]}
        onSortChange={() => undefined}
      />,
    )
    expect(html).not.toContain('>Status</label>')
    expect(html).toContain('Status: Sent')
    expect(html).toContain('>Date ↓</span>')
  })

  it('never repeats the label as the placeholder: an empty choice says "All" (P4.9)', () => {
    const html = render(
      <FilterBar
        filters={FILTERS}
        values={{}}
        onValuesChange={() => undefined}
        inline={2}
        layout="desktop"
      />,
    )
    expect(html).toContain('>All<')
    expect(html).not.toContain('placeholder="Status"')
    expect(html).not.toContain('>Status</span>')
  })

  it('on phones puts search first and the list actions in one menu (P4.9)', () => {
    const html = render(
      <FilterBar
        filters={FILTERS}
        values={{}}
        onValuesChange={() => undefined}
        layout="phone"
        search=""
        onSearchChange={() => undefined}
        actions={<button type="button">COLUMNS</button>}
        phoneMenu={[{ label: 'Export', onSelect: () => undefined }]}
      />,
    )
    expect(html).not.toContain('COLUMNS')
    expect(html).toContain('aria-label="More actions"')
    expect(html.indexOf('aria-label="Search…"')).toBeLessThan(html.indexOf('>Filters</span>'))
    const desktop = render(
      <FilterBar
        filters={FILTERS}
        values={{}}
        onValuesChange={() => undefined}
        layout="desktop"
        actions={<button type="button">COLUMNS</button>}
        phoneMenu={[{ label: 'Export', onSelect: () => undefined }]}
      />,
    )
    expect(desktop).toContain('COLUMNS')
    expect(desktop).not.toContain('aria-label="More actions"')
  })

  it('shows the search field only with onSearchChange, named by its placeholder', () => {
    const without = render(<FilterBar filters={[]} values={{}} onValuesChange={() => undefined} />)
    expect(without).not.toContain('aria-label="Search…"')
    const html = render(
      <FilterBar
        filters={[]}
        values={{}}
        onValuesChange={() => undefined}
        search="abc"
        onSearchChange={() => undefined}
      />,
    )
    expect(html).toContain('aria-label="Search…"')
    expect(html).toContain('placeholder="Search…"')
    expect(html).toContain('aria-label="Clear search"')
  })
})

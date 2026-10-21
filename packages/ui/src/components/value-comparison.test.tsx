import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import {
  chosenCounts,
  ValueComparison,
  valueComparisonCounts,
  type ComparisonRow,
} from './value-comparison'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const ROWS: ComparisonRow[] = [
  { id: 'a', label: 'Invoice 101', values: ['120.00', '120.00'], numeric: true },
  {
    id: 'b',
    label: 'Invoice 102',
    values: [null, '36.00'],
    numeric: true,
    differs: true,
    note: 'Only in theirs',
  },
  { id: 'c', label: 'Invoice 103', values: ['84.00', '80.00'], numeric: true, differs: true },
]

describe('valueComparisonCounts', () => {
  it('counts the rows the application marks', () => {
    expect(valueComparisonCounts(ROWS)).toEqual({ differ: 2, total: 3 })
    expect(valueComparisonCounts([])).toEqual({ differ: 0, total: 0 })
  })
})

describe('ValueComparison', () => {
  it('is a table with both sources and the result in words', () => {
    const html = render(
      <ValueComparison
        label="Open items"
        columns={['Ours', 'Theirs']}
        rows={ROWS}
        layout="desktop"
      />,
    )
    expect(html).toContain('<caption class="sr-only">Open items</caption>')
    expect(html).toContain('>Ours<')
    expect(html).toContain('>Theirs<')
    expect(html).toContain('>Item<')
    expect(html).toContain('>Result<')
    expect(html).toContain('2 of 3 differ')
    expect(html).toContain('Only in theirs')
    expect(html).toContain('Differs')
    expect(html).toContain('Same')
    expect(html.match(/data-differs="true"/g)).toHaveLength(2)
    expect(html.match(/bg-status-warning-bg/g)).toHaveLength(2)
    // A value one source does not have.
    expect(html).toContain('—')
    expect(html).toContain('text-end')
  })

  it('takes its own first heading, and says when nothing differs', () => {
    const html = render(
      <ValueComparison
        label="Open items"
        columns={['Ours', 'Theirs']}
        rowHeader="Document"
        rows={ROWS.slice(0, 1)}
        layout="desktop"
      />,
    )
    expect(html).toContain('>Document<')
    expect(html).toContain('No differences')
  })

  it('is one card per row on phones, each value labelled', () => {
    const html = render(
      <ValueComparison
        label="Open items"
        columns={['Ours', 'Theirs']}
        rows={ROWS}
        layout="phone"
      />,
    )
    expect(html).not.toContain('<table')
    expect(html.match(/<li/g)).toHaveLength(3)
    expect(html.match(/<dt[^>]*>Ours<\/dt>/g)).toHaveLength(3)
    expect(html.match(/<dt[^>]*>Theirs<\/dt>/g)).toHaveLength(3)
  })

  it('waits while loading, and says when there is nothing to compare', () => {
    const loading = render(
      <ValueComparison label="Open items" columns={['Ours', 'Theirs']} rows={ROWS} loading />,
    )
    expect(loading).toContain('aria-busy="true"')
    expect(loading).not.toContain('<table')
    expect(loading).not.toContain('2 of 3 differ')
    const empty = render(
      <ValueComparison label="Open items" columns={['Ours', 'Theirs']} rows={[]} />,
    )
    expect(empty).toContain('Nothing to compare')
    const own = render(
      <ValueComparison
        label="Open items"
        columns={['Ours', 'Theirs']}
        rows={[]}
        empty="No open items."
      />,
    )
    expect(own).toContain('No open items.')
  })

  it('takes three sources: a column, and a labelled value, for each', () => {
    const rows: ComparisonRow[] = [
      { id: 'q', label: 'Quantity', values: ['36', '35', '35'], numeric: true },
      {
        id: 'p',
        label: 'Pump hours',
        values: ['3', '4', '4'],
        numeric: true,
        differs: true,
        note: 'More than ordered',
      },
    ]
    const table = render(
      <ValueComparison
        label="Three-way match"
        columns={['Order', 'Receipt', 'Invoice']}
        rows={rows}
        layout="desktop"
      />,
    )
    expect(table.match(/<th scope="col"/g)).toHaveLength(5)
    expect(table.match(/<td/g)).toHaveLength(8)
    expect(table).toContain('1 of 2 differ')
    expect(table).toContain('More than ordered')
    const cards = render(
      <ValueComparison
        label="Three-way match"
        columns={['Order', 'Receipt', 'Invoice']}
        rows={rows}
        layout="phone"
      />,
    )
    expect(cards).toContain('grid-cols-3')
    expect(cards.match(/<dt[^>]*>Receipt<\/dt>/g)).toHaveLength(2)
    const two = render(
      <ValueComparison label="Two" columns={['Ours', 'Theirs']} rows={ROWS} layout="phone" />,
    )
    expect(two).toContain('grid-cols-2')
  })

  it('chooses the value to keep in each differing row (P5.79)', () => {
    const table = render(
      <ValueComparison
        label="Values to keep"
        columns={['Kept record', 'Merged record']}
        rows={ROWS}
        chosen={{ b: 1 }}
        onChoose={() => undefined}
        layout="desktop"
      />,
    )
    // Two differing rows, two radios each; one chosen.
    expect(table.match(/type="radio"/g)).toHaveLength(4)
    expect(table.match(/checked=""/g)).toHaveLength(1)
    expect(table).toContain('1 of 2 chosen')
    expect(table).toContain('Choose the value to keep')
    expect(table.match(/data-chosen="true"/g)).toHaveLength(1)
    // Only the row still to choose warns.
    expect(table.match(/bg-status-warning-bg/g)).toHaveLength(1)
    expect(table).toContain('bg-surface-selected')
    // The same row is not a choice.
    expect(table).toContain('Same')
    const cards = render(
      <ValueComparison
        label="Values to keep"
        columns={['Kept record', 'Merged record']}
        rows={ROWS}
        chosen={{ b: 1, c: 0 }}
        onChoose={() => undefined}
        layout="phone"
      />,
    )
    expect(cards.match(/role="radiogroup"/g)).toHaveLength(2)
    expect(cards.match(/<label/g)).toHaveLength(4)
    expect(cards).toContain('2 of 2 chosen')
    expect(cards).not.toContain('bg-status-warning-bg')
  })

  it('shows the values chosen without changing them', () => {
    const html = render(
      <ValueComparison
        label="Values kept"
        columns={['Kept record', 'Merged record']}
        rows={ROWS}
        chosen={{ b: 1, c: 0 }}
        layout="desktop"
      />,
    )
    expect(html).not.toContain('type="radio"')
    expect(html.match(/data-chosen="true"/g)).toHaveLength(2)
    expect(html).toContain('Chosen')
  })
})

describe('chosenCounts', () => {
  it('counts the differing rows with a value chosen', () => {
    expect(chosenCounts(ROWS, {})).toEqual({ chosen: 0, total: 2 })
    expect(chosenCounts(ROWS, { b: 0, a: 1 })).toEqual({ chosen: 1, total: 2 })
    expect(chosenCounts([], {})).toEqual({ chosen: 0, total: 0 })
  })
})

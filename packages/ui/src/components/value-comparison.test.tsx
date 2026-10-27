import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import {
  chosenCounts,
  comparisonRowsShown,
  mergedFields,
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
    // P5.93: one alignment for every column — the values at the start, figures tabular.
    expect(html).not.toContain('text-end')
    expect(html).toContain('tabular-nums')
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
    // P5.93: only the differing rows while choosing; the identical one behind the switch.
    expect(table).toContain('Show identical fields (1)')
    expect(table.split('value-comparison-preview')[0]).not.toContain('Invoice 101')
    expect(table.match(/type="radio"/g)).toHaveLength(4)
    expect(table.match(/checked=""/g)).toHaveLength(1)
    expect(table).toContain('1 of 2 chosen')
    expect(table).toContain('Choose the value to keep')
    expect(table.match(/data-chosen="true"/g)).toHaveLength(1)
    // Only the row still to choose warns.
    expect(table.match(/bg-status-warning-bg/g)).toHaveLength(1)
    expect(table).toContain('bg-surface-selected')
    // The kept value says so in words; the merged record lists every field.
    expect(table.match(/>Kept</g)).toHaveLength(1)
    expect(table).toContain('aria-label="Merged record"')
    expect(table).toContain('Not chosen yet')
    const all = render(
      <ValueComparison
        label="Values to keep"
        columns={['Kept record', 'Merged record']}
        rows={ROWS}
        chosen={{ b: 1 }}
        onChoose={() => undefined}
        onChooseAll={() => undefined}
        defaultShowIdentical
        preview={false}
        layout="desktop"
      />,
    )
    // The same row is not a choice.
    expect(all).toContain('Same')
    expect(all).toContain('Invoice 101')
    expect(all).toContain('Keep all from Kept record')
    expect(all).toContain('Keep all from Merged record')
    expect(all).not.toContain('aria-label="Merged record"')
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
    // Large choices, stacked.
    expect(cards).toContain('min-h-14')
    expect(cards.match(/<label/g)).toHaveLength(5) // four choices and the identical fields' switch
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
    expect(html.match(/>Kept</g)).toHaveLength(2)
    // Shown, not chosen: no preview unless asked for.
    expect(html).not.toContain('aria-label="Merged record"')
  })
})

describe('chosenCounts', () => {
  it('counts the differing rows with a value chosen', () => {
    expect(chosenCounts(ROWS, {})).toEqual({ chosen: 0, total: 2 })
    expect(chosenCounts(ROWS, { b: 0, a: 1 })).toEqual({ chosen: 1, total: 2 })
    expect(chosenCounts([], {})).toEqual({ chosen: 0, total: 0 })
  })
})

describe('comparisonRowsShown', () => {
  it('lists only the differing rows while choosing, unless the identical are asked for', () => {
    expect(comparisonRowsShown(ROWS, false, false).map((row) => row.id)).toEqual(['a', 'b', 'c'])
    expect(comparisonRowsShown(ROWS, true, false).map((row) => row.id)).toEqual(['b', 'c'])
    expect(comparisonRowsShown(ROWS, true, true).map((row) => row.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('mergedFields', () => {
  it('keeps an identical value, the chosen source of a differing one, or waits', () => {
    expect(mergedFields(ROWS, { c: 1 })).toEqual([
      { id: 'a', label: 'Invoice 101', value: '120.00', pending: false },
      { id: 'b', label: 'Invoice 102', value: null, pending: true },
      { id: 'c', label: 'Invoice 103', value: '80.00', pending: false },
    ])
    expect(mergedFields(ROWS, { b: 0 })[1]).toEqual({
      id: 'b',
      label: 'Invoice 102',
      value: null,
      pending: false,
    })
  })
})

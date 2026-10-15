import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { ValueComparison, valueComparisonCounts, type ComparisonRow } from './value-comparison'

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
})

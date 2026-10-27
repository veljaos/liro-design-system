import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { Pivot, type PivotProps } from './pivot'
import { PivotFields } from './pivot-fields'
import { EMPTY_PIVOT_LAYOUT } from './pivot-logic'
import {
  FIELDS,
  MONTH_LAYOUT,
  MONTH_RESULT,
  QUARTER_LAYOUT,
  QUARTER_RESULT,
  VIEWS,
} from './pivot-story-data'

function render(node: ReactNode): string {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={createFormat('en')}>
      {node}
    </LiroProvider>,
  )
}

const base: PivotProps = {
  label: 'Sales',
  fields: FIELDS,
  value: QUARTER_LAYOUT,
  onChange: () => undefined,
  result: QUARTER_RESULT,
}

/** The header rows of the grid. */
function headerRows(html: string): string[] {
  const thead = /<thead[^>]*>(.*)<\/thead>/s.exec(html)?.[1] ?? ''
  return [...thead.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)].map((match) => match[1] ?? '')
}

describe('Pivot header building', () => {
  it('draws two header rows: each quarter over its figures, the corner and nothing above the leaves', () => {
    const rows = headerRows(render(<Pivot {...base} />))
    expect(rows).toHaveLength(2)
    // The corner spans both rows and names the row and column fields.
    expect(rows[0]).toMatch(
      /<th role="columnheader" rowSpan="2" aria-rowspan="2" data-sticky-start=""/,
    )
    expect(rows[0]).toContain('Region / Product line')
    expect(rows[0]).toContain('Quarter')
    // A quarter over its two figures; the total column too.
    expect(rows[0]).toMatch(/colSpan="2"[^>]*aria-colspan="2"[^>]*>.*Q1 2026/s)
    expect(rows[0]).toMatch(/data-total=""[^>]*>.*Total/s)
    expect([...(rows[1] ?? '').matchAll(/role="columnheader"/g)]).toHaveLength(8)
  })

  it('draws one header row for one level of columns', () => {
    const rows = headerRows(render(<Pivot {...base} value={MONTH_LAYOUT} result={MONTH_RESULT} />))
    expect(rows).toHaveLength(1)
    expect([...(rows[0] ?? '').matchAll(/role="columnheader"/g)]).toHaveLength(5)
  })

  it('spans a shallow leaf over the header rows of the deeper ones', () => {
    const rows = headerRows(
      render(
        <Pivot
          {...base}
          result={{
            ...QUARTER_RESULT,
            columns: [
              ...QUARTER_RESULT.columns.slice(0, 1),
              { key: 'share', label: 'Share', kind: 'percent' },
            ],
          }}
        />,
      ),
    )
    expect(rows[0]).toMatch(/rowSpan="2" aria-colspan="1" aria-rowspan="2"[^>]*>.*Share/s)
  })
})

describe('Pivot rows', () => {
  it('opens the first level by default, its groups marked expanded, the deeper rows drawn', () => {
    const html = render(<Pivot {...base} />)
    expect(html).toMatch(/role="treegrid"[^>]*aria-label="Sales"/)
    expect(html.match(/role="row"[^>]*aria-expanded="true"/g)).toHaveLength(3)
    expect(html).toMatch(/aria-level="2"/)
    expect(html).toContain('Hardware')
    // Figures through the provider's format; tabular.
    expect(html).toContain('EUR\u00a01,563,013.37')
    expect(html).toMatch(/tabular-nums/)
  })

  it('draws a closed group without its rows, and null as a dash', () => {
    const html = render(<Pivot {...base} defaultExpanded={['west']} />)
    expect(html.match(/role="row"[^>]*aria-expanded="false"/g)).toHaveLength(2)
    expect(html.match(/role="row"[^>]*aria-expanded="true"/g)).toHaveLength(1)
    // West's Services has no sales in Q1: "—", never 0.
    expect(html).toContain('>—<')
  })

  it('puts the grand total last, in the footer, and one cell in the tab order', () => {
    const html = render(<Pivot {...base} />)
    expect(html).toMatch(/<tfoot><tr role="row" aria-level="1" data-total="">/)
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
  })
})

/** The same pivot with a fixed layout: no `onChange`. */
const fixedProps: PivotProps = {
  label: base.label,
  fields: base.fields,
  value: base.value,
  result: QUARTER_RESULT,
}

describe('Pivot states and actions', () => {
  it('asks for a value when none is chosen, with "Choose fields"', () => {
    const html = render(<Pivot {...base} value={EMPTY_PIVOT_LAYOUT} result={null} />)
    expect(html).toContain('Choose a value')
    expect(html).toContain('Choose fields')
    expect(html).not.toContain('role="treegrid"')
  })

  it('shows skeletons first, keeps the figures while updating, and the error with Try again', () => {
    expect(render(<Pivot {...base} result={null} loading />)).toMatch(/aria-busy="true"/)
    const updating = render(<Pivot {...base} loading />)
    expect(updating).toContain('Updating…')
    expect(updating).toContain('role="treegrid"')
    const failed = render(
      <Pivot {...base} error="The figures could not be computed." onRetry={() => undefined} />,
    )
    expect(failed).toContain('The figures could not be computed.')
    expect(failed).toContain('Try again')
  })

  it('says when the layout has no figures', () => {
    expect(render(<Pivot {...base} result={{ columns: [], rows: [] }} />)).toContain(
      'No figures for this layout',
    )
  })

  it('has no chooser without onChange; with it, a closed Fields button and no open sheet', () => {
    const fixed = render(<Pivot {...fixedProps} views={VIEWS} />)
    expect(fixed).not.toContain('>Fields<')
    expect(fixed).not.toContain('Suggested views')
    const closed = render(<Pivot {...base} />)
    expect(closed).toMatch(/aria-haspopup="dialog" aria-expanded="false"[^>]*>.*Fields/s)
    expect(closed).not.toContain('data-slot="pivot-fields"')
  })

  it('draws the four zones in order, Rows first, then the unused fields, as chips', () => {
    const html = render(
      <PivotFields fields={FIELDS} layout={QUARTER_LAYOUT} onChange={() => undefined} />,
    )
    const headings = [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((match) => match[1])
    expect(headings).toEqual(['Rows', 'Columns', 'Values', 'Filters', 'Available fields'])
    expect(html).toContain('data-drop-zone="rows"')
    expect(html).toContain('data-drop-zone="available"')
    expect(html).toContain('data-drop-item="line"')
    expect(html).toContain('aria-label="Options: Product line"')
    expect(html).toContain('aria-label="Add Month"')
  })

  it('offers the suggested views first, the current one pressed, and says the layout in words', () => {
    const html = render(<Pivot {...base} views={VIEWS} />)
    expect(html).toMatch(/aria-label="Suggested views"/)
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*By region and quarter/s)
    expect(html).toContain(
      'Sum of Amount, Count of Orders by Region / Product line, across Quarter',
    )
    const filtered = render(
      <Pivot
        {...base}
        views={VIEWS}
        value={{ ...QUARTER_LAYOUT, filters: [{ field: 'salesperson', values: ['ana'] }] }}
      />,
    )
    expect(filtered).toContain('· Only Salesperson: Ana Petrović')
    expect(filtered).not.toMatch(/aria-pressed="true"/)
  })

  it('has one Expand all / Collapse all button, by whether every group is open', () => {
    expect(render(<Pivot {...base} />)).toContain('Collapse all')
    const closed = render(<Pivot {...base} defaultExpanded={[]} />)
    expect(closed).toContain('Expand all')
    expect(closed).not.toContain('Collapse all')
  })

  it('exports by one button or by a menu of formats', () => {
    const one = render(
      <Pivot
        {...base}
        exportAction={{ formats: [{ id: 'xlsx', label: 'Excel' }], onExport: () => undefined }}
      />,
    )
    expect(one).toMatch(/data-intent="export"[^>]*>.*Export/s)
    expect(one).not.toMatch(/aria-haspopup="menu"[^>]*data-intent="export"/)
  })
})

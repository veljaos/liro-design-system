import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { DocumentPage } from '../templates/document-page'
import { DataTable, type DataTableColumn } from './data-table'
import { subtotalStart } from './data-table-logic'
import {
  CancellationBanner,
  ChangeText,
  correctionColumns,
  DocumentCurrency,
  DocumentNotes,
  DocumentReferences,
  DocumentSpecification,
} from './document-blocks'
import { chosenNoteTexts, hasNotes } from './document-logic'
import { DocumentTotals } from './document-totals'
import type { LineType } from './line-types'

const NBSP = ' '

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={createFormat('sr-Latn-RS')}>
      {node}
    </LiroProvider>,
  )
}

/** The text of rendered markup, without tags and comments. */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")
}

describe('subtotalStart', () => {
  it('starts at the trailing run of end-aligned columns', () => {
    expect(subtotalStart(['start', 'end', 'start', 'end', 'end'])).toBe(3)
    expect(subtotalStart(['start', 'start', 'end'])).toBe(2)
  })
  it('keeps one column for the label', () => {
    expect(subtotalStart(['end', 'end'])).toBe(1)
    expect(subtotalStart(['start', 'start'])).toBe(1)
    expect(subtotalStart([undefined, 'center', 'start'])).toBe(2)
  })
})

describe('DocumentReferences', () => {
  const groups = [
    {
      key: 'proforma',
      label: 'Proforma',
      items: [{ key: 'p', number: 'PR-2026-031', href: '#/p' }],
    },
    {
      key: 'advances',
      label: 'Advances',
      kind: 'Advance invoice',
      items: [
        {
          key: 'a1',
          number: 'A-2026-038',
          href: '#/a1',
          status: { label: 'Paid', tone: 'success' as const },
        },
        { key: 'a2', number: 'A-2026-044', href: '#/a2', status: { label: 'Paid' } },
      ],
    },
  ]
  it('writes one line: the lead, each kind and its numbers as links', () => {
    const html = render(<DocumentReferences groups={groups} />)
    expect(text(html)).toBe('Based on:ProformaPR-2026-031·AdvancesA-2026-038Paid, A-2026-044Paid')
    expect(html.match(/<a /g)).toHaveLength(3)
  })
  it('names every link with its kind, number and state (P4.9 rule 7)', () => {
    const html = render(<DocumentReferences groups={groups} />)
    expect(html).toContain('aria-label="Proforma PR-2026-031"')
    expect(html).toContain('aria-label="Advance invoice A-2026-038, Paid"')
    expect(html).toContain('text-status-success-fg')
  })
  it('takes another lead and leaves out empty groups; nothing when all are empty', () => {
    const html = render(
      <DocumentReferences
        label="Cancels"
        groups={[{ key: 'x', label: 'Invoice', items: [] }, ...groups.slice(0, 1)]}
      />,
    )
    expect(text(html)).toBe('Cancels:ProformaPR-2026-031')
    expect(
      text(render(<DocumentReferences groups={[{ key: 'x', label: 'X', items: [] }]} />)),
    ).toBe('')
  })
})

describe('DocumentCurrency', () => {
  it('writes the currency, the rate through format and its date', () => {
    const html = render(
      <DocumentCurrency currency="EUR" homeCurrency="RSD" rate="117.1825" rateDate="2026-10-05" />,
    )
    expect(text(html)).toBe('CurrencyEURExchange rate1 EUR = 117,1825 RSDRate date05.10.2026.')
  })
})

describe('notes', () => {
  const templates = [
    { value: 'pay', label: 'Payment', text: 'Pay within 15 days.' },
    { value: 'law', label: 'Legal', text: 'Exempt under the law.' },
  ]
  it('shows the chosen templates in their order, then the free note', () => {
    expect(chosenNoteTexts(templates, { templates: ['law', 'pay', 'gone'], note: ' Hi ' })).toEqual(
      [
        { key: 'template:law', text: 'Exempt under the law.' },
        { key: 'template:pay', text: 'Pay within 15 days.' },
        { key: 'note', text: 'Hi' },
      ],
    )
  })
  it('has notes only with a known template or a written note', () => {
    expect(hasNotes(templates, { templates: [], note: '  ' })).toBe(false)
    expect(hasNotes(templates, { templates: ['gone'], note: '' })).toBe(false)
    expect(hasNotes(templates, { templates: ['pay'], note: '' })).toBe(true)
  })
  it('reads as text in view mode and as fields in edit mode', () => {
    const view = render(
      <DocumentNotes templates={templates} value={{ templates: ['pay'], note: 'Thanks.' }} />,
    )
    expect(text(view)).toBe('Pay within 15 days.Thanks.')
    const edit = render(
      <DocumentNotes
        mode="edit"
        templates={templates}
        value={{ templates: ['pay'], note: 'Thanks.' }}
        onChange={() => undefined}
      />,
    )
    expect(edit).toContain('Standard texts')
    expect(edit).toContain('<textarea')
  })
})

describe('DocumentSpecification', () => {
  it('sums up the specification with its count and amount through format', () => {
    const html = render(
      <DocumentSpecification
        title="Specification of works"
        count={300}
        amount="2418300"
        currency="RSD"
      >
        <p>TABLE</p>
      </DocumentSpecification>,
    )
    expect(html).toContain(`Specification of works: 300 positions, 2.418.300,00${NBSP}RSD`)
    expect(html).toContain('Open')
    // The full view is not rendered until it is opened.
    expect(html).not.toContain('TABLE')
  })
})

describe('CancellationBanner', () => {
  it('says who cancelled it and when, in the tenant’s time, the reason and the document', () => {
    const html = render(
      <CancellationBanner
        by="Milica Petrović"
        at="2026-10-06T11:20:00+02:00"
        reason="Wrong prices."
        document={{ kind: 'Cancellation document', number: 'ST-2026-0004', href: '#/st' }}
      />,
    )
    expect(text(html)).toContain(
      'Cancelled by Milica Petrović on 06.10.2026. at 11:20. Reason: Wrong prices. Cancellation document ST-2026-0004',
    )
    // The word is said once (P5.23), and the banner takes the badge's danger tone, politely.
    expect(text(html)).not.toContain('Cancelled Cancelled')
    expect(html).toContain('href="#/st"')
    expect(html).toContain('role="status"')
    expect(html).toContain('data-tone="danger"')
  })
})

describe('corrections', () => {
  it('signs a change and never rounds it', () => {
    expect(text(render(<ChangeText value="-13780.00" currency="RSD" />))).toBe(
      `-13.780,00${NBSP}RSD`,
    )
    expect(text(render(<ChangeText value="20" />))).toBe('+20')
    expect(text(render(<ChangeText value={null} />))).toBe('—')
  })
  it('makes three columns per corrected value, headers from messages', () => {
    interface Line {
      id: string
      before: string
      change: string
      after: string
    }
    const columns = correctionColumns<Line>({
      id: 'amount',
      original: (line) => line.before,
      change: (line) => line.change,
      next: (line) => line.after,
      currency: 'RSD',
    })
    expect(columns.map((column) => column.id)).toEqual([
      'amount.original',
      'amount.change',
      'amount.new',
    ])
    const html = render(
      <DataTable
        label="Lines"
        layout="table"
        columns={columns}
        rows={[{ id: '1', before: '96460.00', change: '-13780.00', after: '82680.00' }]}
        getRowId={(line) => line.id}
        getRowLabel={(line) => line.id}
      />,
    )
    expect(text(html)).toContain('OriginalChangeNew')
    expect(text(html)).toContain(`96.460,00${NBSP}RSD-13.780,00${NBSP}RSD82.680,00${NBSP}RSD`)
  })
})

describe('DocumentTotals (P5.18)', () => {
  it('ends with the recap, the deductions as links, the amount due, the rate and footnotes', () => {
    const html = render(
      <DocumentTotals
        label="Totals"
        rows={[{ key: 'total', label: 'Invoice total', value: '1200.00', currency: 'EUR' }]}
        recap={{
          label: 'Recap by tax category',
          headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
          rows: [
            { key: 's20', category: 'S 20%', base: '1000.00', rate: '20', tax: '200.00' },
            { key: 'e', category: 'E¹', base: '0.00', rate: null, tax: null },
          ],
        }}
        deductions={[
          {
            key: 'a1',
            label: 'Advance A-2026-038',
            value: '-600.00',
            currency: 'EUR',
            href: '#/a1',
          },
        ]}
        total={{ key: 'due', label: 'Amount due', value: '600.00', currency: 'EUR' }}
        exchange={{
          currency: 'EUR',
          homeCurrency: 'RSD',
          rate: '117.1825',
          source: 'NBS middle rate on 05.10.2026.',
          rows: [{ key: 'rsd', label: 'Total in RSD', value: '140619.00', currency: 'RSD' }],
        }}
        footnotes={[{ key: '1', marker: '¹', text: 'Exempt under article 24.' }]}
      />,
    )
    const order = [
      'Invoice total',
      'Recap by tax category',
      'S 20%',
      '20%',
      'Advance A-2026-038',
      'Amount due',
      'Total in RSD',
      '1 EUR = 117,1825 RSD, NBS middle rate on 05.10.2026.',
      'Exempt under article 24.',
    ]
    const plain = text(html)
    let at = -1
    for (const part of order) {
      const next = plain.indexOf(part, at + 1)
      expect(next, part).toBeGreaterThan(at)
      at = next
    }
    expect(html).toContain('role="group"')
    expect(html).toContain('href="#/a1"')
    expect(html).toContain('max-w-96')
    // An empty recap cell is a dash, never 0.
    expect(plain).toContain('E¹0,00——')
  })
  it('keeps the P4.5 list when nothing new is asked, the deductions in it', () => {
    const html = render(
      <DocumentTotals
        label="Totals"
        rows={[]}
        deductions={[{ key: 'a', label: 'Advance', value: '-1.00' }]}
        total={{ key: 'due', label: 'Amount due', value: '1.00' }}
      />,
    )
    expect(html).toContain('<dl aria-label="Totals"')
    expect(html).toContain('border-subtle')
  })
})

describe('DataTable line types (P5.18)', () => {
  interface Line {
    id: string
    type: LineType
    item: string
    amount: string
  }
  const columns: DataTableColumn<Line>[] = [
    { id: 'item', header: 'Item', cell: (line) => line.item },
    { id: 'vat', header: 'VAT', cell: () => 'S 20%' },
    { id: 'amount', header: 'Amount', align: 'end', cell: (line) => line.amount },
  ]
  const rows: Line[] = [
    { id: 'h', type: 'heading', item: '1. Steel structure', amount: '' },
    { id: 'l', type: 'line', item: 'Beams', amount: '100,00' },
    { id: 's', type: 'subtotal', item: 'Total 1. Steel structure', amount: '100,00' },
    { id: 't', type: 'text', item: 'Delivered to the site.', amount: '' },
    { id: 'd', type: 'discount', item: 'Discount 3%', amount: '-3,00' },
  ]
  const table = (layout: 'table' | 'cards') =>
    render(
      <DataTable
        label="Lines"
        layout={layout}
        inCard
        columns={columns}
        rows={rows}
        getRowId={(line) => line.id}
        getRowLabel={(line) => line.item}
        lineType={(line) => line.type}
        lineKind={(line) => (line.type === 'line' ? 'Item' : null)}
        onSelectionChange={() => undefined}
        selection={[]}
      />,
    )
  it('spans headings and text lines across the row, by typography', () => {
    const html = table('table')
    expect(html).toMatch(/data-line="heading"><td colSpan="4" class="[^"]*font-semibold/)
    expect(html).toMatch(/data-line="text"><td colSpan="4" class="[^"]*text-xs text-secondary/)
  })
  it('puts a subtotal’s label end-aligned before the amounts, under a strong rule', () => {
    const html = table('table')
    expect(html).toMatch(
      /data-line="subtotal"><td colSpan="3" class="[^"]*border-t-strong[^"]*text-end/,
    )
  })
  it('gives checkboxes only to lines, and shows the kind under the first cell', () => {
    const html = table('table')
    // The header's, the line's and the discount's.
    expect(html.match(/role="checkbox"/g)).toHaveLength(3)
    expect(html).toContain('data-slot="line-kind"')
  })
  it('keeps the types on phones', () => {
    const html = table('cards')
    expect(html).toContain('<li data-line="heading">')
    expect(html).toContain('<li data-line="subtotal">')
    expect(html).toContain('Total 1. Steel structure')
  })
})

describe('DocumentPage block order (P5.18)', () => {
  it('renders header → references → lines → specification → totals → notes → attachments', () => {
    const html = render(
      <DocumentPage
        layout="desktop"
        title="F-2026-0418"
        banner={<p>BANNER</p>}
        currency={<p>CURRENCY</p>}
        references={<p>REFERENCES</p>}
        lines={<p>LINES</p>}
        specification={<p>SPECIFICATION</p>}
        totals={{
          label: 'Totals',
          rows: [],
          total: { key: 'due', label: 'TOTALS', value: '1.00' },
        }}
        notes={{ title: 'Notes', content: <p>NOTES</p> }}
        attachments={{ title: 'Attachments', content: <p>ATTACHMENTS</p> }}
        sections={[{ key: 's', title: 'Payment', content: <p>SECTION</p> }]}
      />,
    )
    const order = [
      'BANNER',
      'F-2026-0418',
      'CURRENCY',
      'REFERENCES',
      'LINES',
      'SPECIFICATION',
      'TOTALS',
      'NOTES',
      'ATTACHMENTS',
      'SECTION',
    ]
    const positions = order.map((part) => html.indexOf(part))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })
  it('leaves out a block without content', () => {
    const html = render(<DocumentPage layout="desktop" title="X" lines={null} />)
    expect(html).not.toContain('section-card')
  })
})

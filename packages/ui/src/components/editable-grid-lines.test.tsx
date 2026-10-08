import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { EditableGrid, type EditableGridColumn } from './editable-grid'
import type { LineType } from './line-types'
import { LookupField } from './lookup-field'
import type { LookupKind, LookupOption } from './lookup-logic'

/*
 * P5.18 and P5.19: the line types, the lookup column, details and the "Add line ▾" menu as the
 * grid renders them; LookupField's states. The keyboard and the lists are proved in the stories.
 */

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

interface Line {
  id: string
  type: LineType
  text: string
  item: LookupOption | null
  quantity: string | null
  unit: string
  tax: string
  amount: string
}

const KINDS: LookupKind[] = [
  { key: 'item', heading: 'Items', label: 'Item' },
  { key: 'service', heading: 'Services', label: 'Service' },
]

const COLUMNS: EditableGridColumn<Line>[] = [
  {
    id: 'item',
    header: 'Item or service',
    type: 'lookup',
    value: (line) => line.item,
    results: () => [],
    onSearch: () => undefined,
    kinds: KINDS,
  },
  { id: 'quantity', header: 'Quantity', type: 'number', value: (line) => line.quantity },
  {
    id: 'unit',
    header: 'Unit',
    type: 'unit',
    value: (line) => line.unit,
    units: [{ value: 'H87', label: 'pc' }],
  },
  {
    id: 'tax',
    header: 'VAT',
    type: 'taxCategory',
    value: (line) => line.tax,
    categories: [{ value: 'S20', code: 'S', rate: '20' }],
  },
  {
    id: 'amount',
    header: 'Amount',
    type: 'display',
    align: 'end',
    numeric: true,
    display: (line) => line.amount,
  },
]

const blank = { item: null, quantity: null, unit: 'H87', tax: 'S20', amount: '' }
const LINES: Line[] = [
  { id: 'h', type: 'heading', text: '1. Earthworks', ...blank },
  {
    id: 'l',
    type: 'line',
    text: '',
    ...blank,
    item: { value: 's1', label: 'Montaža armature', kind: 'service' },
    quantity: '3',
    amount: '12.345,60',
  },
  { id: 't', type: 'text', text: 'Delivered to the site', ...blank },
  { id: 's', type: 'subtotal', text: 'Subtotal 1. Earthworks', ...blank, amount: '12.345,60' },
]

const grid = (extra: Partial<React.ComponentProps<typeof EditableGrid<Line>>> = {}) =>
  render(
    <EditableGrid<Line>
      label="Lines"
      columns={COLUMNS}
      rows={LINES}
      getRowId={(line) => line.id}
      getRowType={(line) => line.type}
      lineText={{ columnId: 'text', value: (line) => line.text }}
      onCellChange={() => undefined}
      onAddRow={() => undefined}
      onRemoveRow={() => undefined}
      layout="desktop"
      {...extra}
    />,
  )

describe('EditableGrid line types', () => {
  it('draws a heading and a text line as one field across the row, by typography', () => {
    const html = grid()
    expect(html).toMatch(/<tr data-row-id="h"[^>]*data-row-type="heading"[^>]*><td colSpan="5"/)
    expect(html).toContain('[&amp;_input]:font-semibold')
    expect(html).toContain('[&amp;_input]:text-xs [&amp;_input]:text-secondary')
    expect(html).toContain('Section heading, line 1')
    expect(html).toContain('Text, line 3')
  })

  it('draws a subtotal without a field: its text end-aligned, semibold, a rule above', () => {
    const html = grid()
    const subtotal =
      /<tr data-row-id="s"[^>]*data-row-type="subtotal"[^>]*>(.*?)<\/tr>/.exec(html)?.[1] ?? ''
    expect(subtotal).toContain('colSpan="4"')
    expect(subtotal).toContain('border-t-strong')
    expect(subtotal).toContain('text-end font-semibold')
    expect(subtotal).toContain('Subtotal 1. Earthworks')
    expect(subtotal).not.toContain('<input')
    expect(subtotal).not.toContain('Remove line')
  })

  it('shows the chosen record’s kind in the line as secondary text', () => {
    expect(grid()).toMatch(/data-slot="line-kind" class="[^"]*text-secondary[^"]*">Service</)
  })

  it('shows details under the row, internal ones after the "Internal" note, and links them', () => {
    const html = grid({
      details: {
        l: [{ text: 'Asset OS-0047' }, { text: 'Book value 412.000,00 RSD', internal: true }],
      },
    })
    expect(html).toContain('Asset OS-0047')
    expect(html).toMatch(/>Internal<\/span><span class="bidi-content">Book value 412.000,00 RSD/)
    expect(html).toMatch(/aria-describedby="[^"]*-l-d0 [^"]*-l-d1"/)
  })

  it('offers the rarer types behind the chevron of "Add line" only when allowed', () => {
    expect(grid()).not.toContain('More options: Add line')
    expect(grid({ addTypes: ['text', 'heading', 'discount'] })).toContain('More options: Add line')
  })

  it('keeps the types on phones: one field for a heading, the subtotal without a field', () => {
    const html = grid({ layout: 'phone' })
    expect(html).toMatch(/<li data-row-id="s"[^>]*data-row-type="subtotal"[^>]*border-t-strong/)
    expect(html).toContain('Subtotal 1. Earthworks')
    expect(html).toMatch(/data-row-type="heading"[\s\S]*?Section heading, line 1/)
  })
})

describe('EditableGrid with many lines', () => {
  const many = Array.from({ length: 150 }, (_, index) => ({
    ...blank,
    id: `m${String(index)}`,
    type: 'line' as const,
    text: '',
    quantity: String(index + 1),
  }))

  it('draws a window of the lines, with a spacer and the whole table’s row count', () => {
    const html = grid({ rows: many })
    const drawn = html.match(/<tr data-row-id=/g)?.length ?? 0
    expect(drawn).toBeGreaterThan(20)
    expect(drawn).toBeLessThan(60)
    expect(html).toContain('aria-rowcount="151"')
    expect(html).toContain('data-slot="grid-spacer"')
    expect(html).toContain('aria-rowindex="2"')
  })

  it('draws every line when told not to virtualise, or below 100 lines', () => {
    expect(grid({ rows: many, virtualize: false }).match(/<tr data-row-id=/g)).toHaveLength(150)
    expect(grid({ rows: many.slice(0, 99) })).not.toContain('aria-rowcount')
  })
})

describe('LookupField', () => {
  const field = (extra: Partial<React.ComponentProps<typeof LookupField>> = {}) =>
    render(
      <LookupField
        id="customer"
        label="Customer"
        results={[]}
        onSearch={() => undefined}
        value={{ value: 'c1', label: 'Bojović i sinovi d.o.o.' }}
        {...extra}
      />,
    )

  it('is a combobox with the chosen record’s name', () => {
    const html = field({ name: 'customer' })
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('value="Bojović i sinovi d.o.o."')
    expect(html).toContain('<input type="hidden" name="customer" value="c1"/>')
  })

  it('reads as text when read-only, and shows the reason when disabled', () => {
    expect(field({ readOnly: true })).toContain('readOnly=""')
    expect(field({ readOnly: true })).not.toContain('role="combobox"')
    const disabled = field({ disabled: true, disabledReason: 'The document is issued.' })
    expect(disabled).toContain('disabled=""')
    expect(disabled).toContain('The document is issued.')
  })

  it('shows the error under the field and marks it invalid', () => {
    const html = field({ error: 'Choose a customer.' })
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('Choose a customer.')
  })
})

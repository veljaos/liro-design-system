import { Users } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { Card, isEmptyValue, KeyValueList, keyValueLines, SectionCard } from './cards'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('Card and SectionCard', () => {
  it('draw the raised surface with a border and radius lg', () => {
    const html = render(<Card>x</Card>)
    expect(html).toContain('rounded-lg')
    expect(html).toContain('border-default')
  })

  it('show a header only with a title or actions, the title at the given level, no line', () => {
    expect(render(<SectionCard>body</SectionCard>)).not.toContain('section-card-header')
    const html = render(
      <SectionCard title="Parties" headingLevel={3}>
        body
      </SectionCard>,
    )
    expect(html).toContain('<h3')
    expect(html).toContain('section-card-header')
    expect(html).not.toContain('border-b')
  })

  it('draw no icon by default, and the given one before the title', () => {
    expect(render(<SectionCard title="Parties">b</SectionCard>)).not.toContain('<svg')
    expect(
      render(
        <SectionCard title="Parties" icon={Users}>
          b
        </SectionCard>,
      ),
    ).toContain('<svg')
  })

  it('leave the body unpadded when flush', () => {
    expect(render(<SectionCard flush>body</SectionCard>)).not.toContain('gap-4 p-4')
  })
})

describe('keyValueLines', () => {
  it('draws a line under every item but the last on phones', () => {
    const lines = keyValueLines([{}, {}, {}], 2)
    expect(lines.map((line) => line.phone)).toEqual([true, true, false])
  })

  it('draws no line after the last row of each column', () => {
    // Two columns, five items: column 1 holds 1, 3, 5; column 2 holds 2, 4.
    expect(keyValueLines([{}, {}, {}, {}, {}], 2).map((line) => line.wide)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
    expect(keyValueLines([{}, {}, {}], 3).map((line) => line.wide)).toEqual([false, false, false])
  })

  it('treats a full-width item as a row of its own below every column', () => {
    // Items 1 and 2, then a full-width note, then 4 in the first column.
    expect(keyValueLines([{}, {}, { fullWidth: true }, {}], 2).map((line) => line.wide)).toEqual([
      true,
      true,
      true,
      false,
    ])
    // An odd item before a full-width one: the note sits below both columns.
    expect(keyValueLines([{}, { fullWidth: true }], 2).map((line) => line.wide)).toEqual([
      true,
      false,
    ])
  })

  it('in one column is the phone rule', () => {
    expect(keyValueLines([{}, {}], 1)).toEqual([
      { phone: true, wide: true },
      { phone: false, wide: false },
    ])
  })
})

describe('KeyValueList', () => {
  it('writes an empty value as an em dash, never a hyphen', () => {
    for (const value of [null, undefined, '']) {
      expect(isEmptyValue(value)).toBe(true)
    }
    expect(isEmptyValue(0)).toBe(false)
    const html = render(<KeyValueList items={[{ label: 'Note', value: null }]} />)
    expect(html).toContain('>—</dd>')
  })

  it('in rows: label at the start in normal case, value at the end, weight 500', () => {
    const html = render(<KeyValueList items={[{ label: 'Total', value: '1,234.50' }]} />)
    expect(html).toContain('justify-between')
    expect(html).toContain('gap-x-8')
    expect(html).toContain('text-end')
    expect(html).toContain('font-medium')
    expect(html).not.toContain('uppercase')
    expect(html).not.toContain('tracking-caps')
  })

  it('is a description list with columns, numeric and full-width items', () => {
    const html = render(
      <KeyValueList
        columns={3}
        items={[
          { label: 'Total', value: '1,234.50', numeric: true },
          { label: 'Address', value: 'Somewhere', fullWidth: true },
        ]}
      />,
    )
    expect(html).toContain('<dl')
    expect(html).toContain('grid-cols-1 ')
    expect(html).toContain('@min-[54rem]:grid-cols-3')
    expect(html).toContain('tabular-nums')
    expect(html).toContain('col-span-full')
    expect(html).toMatch(/flex-col[^"]*col-span-full/)
  })

  it('stacked: label above value, no lines', () => {
    const html = render(
      <KeyValueList
        layout="stacked"
        items={[
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ]}
      />,
    )
    expect(html).toContain('flex-col gap-0.5')
    expect(html).not.toContain('border-subtle')
  })

  it('splits into titled groups, each named by its title', () => {
    const html = render(
      <KeyValueList
        groups={[
          { title: 'Customer', items: [{ label: 'Name', value: 'Alfa' }] },
          { title: 'Payment', items: [{ label: 'Total', value: '1' }] },
        ]}
      />,
    )
    expect(html.match(/role="group"/g)).toHaveLength(2)
    expect(html).toContain('>Customer</p>')
    expect(html.match(/<dl/g)).toHaveLength(2)
  })

  it('shows skeletons while loading', () => {
    const html = render(<KeyValueList loading items={[{ label: 'Total', value: '1' }]} />)
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('data-slot="skeleton"')
    expect(html).not.toContain('>Total<')
  })
})

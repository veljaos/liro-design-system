import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { Card, isEmptyValue, KeyValueList, SectionCard } from './cards'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('Card and SectionCard', () => {
  it('draw the raised surface with a border and radius lg', () => {
    const html = render(<Card>x</Card>)
    expect(html).toContain('rounded-lg')
    expect(html).toContain('border-default')
  })

  it('show a header only with a title or actions, and the title at the given level', () => {
    expect(render(<SectionCard>body</SectionCard>)).not.toContain('border-subtle')
    const html = render(
      <SectionCard title="Parties" headingLevel={3}>
        body
      </SectionCard>,
    )
    expect(html).toContain('<h3')
    expect(html).toContain('border-subtle')
    expect(
      render(
        <SectionCard title="Parties" withDivider={false}>
          b
        </SectionCard>,
      ),
    ).not.toContain('border-subtle')
  })

  it('leave the body unpadded when flush', () => {
    expect(render(<SectionCard flush>body</SectionCard>)).not.toContain('gap-4 p-4')
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

  it('is a description list with numeric and full-width items', () => {
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
    expect(html).toContain('sm:grid-cols-3')
    expect(html).toContain('tabular-nums')
    expect(html).toContain('col-span-full')
  })

  it('shows skeletons while loading', () => {
    const html = render(<KeyValueList loading items={[{ label: 'Total', value: '1' }]} />)
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('data-slot="skeleton"')
    expect(html).not.toContain('>Total<')
  })
})

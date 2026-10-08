import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { Breadcrumbs, CursorPagination, ShortcutHint, Tabs } from './navigation'

const render = (node: React.ReactNode, props: { linkComponent?: React.ElementType } = {}) =>
  renderToStaticMarkup(
    <LiroProvider locale="en" {...props}>
      {node}
    </LiroProvider>,
  )

describe('Tabs', () => {
  it('mounts only the active panel and starts the list at the start (P4.7c)', () => {
    const html = render(
      <Tabs
        items={[
          { value: 'a', label: 'General', content: 'General panel' },
          { value: 'b', label: 'Lines', content: 'Lines panel' },
        ]}
      />,
    )
    expect(html).toContain('General panel')
    expect(html).not.toContain('Lines panel')
    expect(html).toContain('justify-start')
  })
})

describe('Breadcrumbs', () => {
  const items = [
    { label: 'Sales', href: '/sales' },
    { label: 'Invoices', href: '/sales/invoices' },
    { label: 'F-114', href: '/sales/invoices/114' },
  ]

  it('makes every item but the last a link through the provider link component', () => {
    function RouterLink(props: { href: string; className?: string; children?: React.ReactNode }) {
      return (
        <a data-router="" href={props.href} className={props.className}>
          {props.children}
        </a>
      )
    }
    const html = render(<Breadcrumbs items={items} />, { linkComponent: RouterLink })
    expect(html.match(/data-router=""/g)).toHaveLength(2)
    expect(html).not.toContain('href="/sales/invoices/114"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('aria-label="Breadcrumbs"')
    expect(html.match(/›/g)).toHaveLength(2)
  })
  it('shows nothing for one level: it would only repeat the page title', () => {
    expect(render(<Breadcrumbs items={[{ label: 'Overview' }]} />)).toBe(
      render(<Breadcrumbs items={[]} />),
    )
    expect(render(<Breadcrumbs items={[{ label: 'Overview' }]} />)).not.toContain('Breadcrumbs')
  })
})

describe('CursorPagination', () => {
  it('has only previous and next, disabled when there is nothing that way', () => {
    const html = render(
      <CursorPagination
        hasPrevious={false}
        hasNext
        onPrevious={() => undefined}
        onNext={() => undefined}
        count="1,234 rows"
      />,
    )
    expect(html).toMatch(/aria-label="Previous"[^>]*disabled=""/)
    expect(html).not.toMatch(/aria-label="Next"[^>]*disabled=""/)
    expect(html).toContain('1,234 rows')
    expect(html.match(/<button/g)).toHaveLength(2)
  })
})

describe('ShortcutHint', () => {
  it('draws each key and joins them with +', () => {
    const html = render(<ShortcutHint keys={['Ctrl', 'K']} />)
    expect(html.match(/<kbd/g)).toHaveLength(2)
    expect(html).toContain('>+</span>')
  })
})

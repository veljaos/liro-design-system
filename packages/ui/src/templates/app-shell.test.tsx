import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import {
  AppShell,
  COMPANY_SEARCH_THRESHOLD,
  matchingCompanies,
  type AppShellProps,
} from './app-shell'

const COMPANIES = [
  { id: 'a', name: 'Kvadrat Gradnja d.o.o.', description: 'PIB 108452317' },
  { id: 'b', name: 'Vojvođanka Mlin a.d.', description: 'PIB 100421987' },
  { id: 'c', name: 'Medic Lab Niš d.o.o.', description: 'PIB 107819450' },
]

const BASE: AppShellProps = {
  brand: {
    brandName: 'Liro',
    productName: 'Business Apps',
    icon: 'i.svg',
    wordmark: 'w.svg',
    href: '/',
  },
  breadcrumbs: [{ label: 'Sales', href: '/sales' }, { label: 'Invoices' }],
  commands: { items: [] },
  notifications: { unread: 3, panel: null },
  companies: { items: COMPANIES, current: 'a', onSelect: () => undefined },
  user: { name: 'Milica Petrović', entries: [] },
  moduleTabs: [
    { key: 'i', label: 'Invoices', href: '/sales/invoices', current: true },
    { key: 'q', label: 'Quotes', href: '/sales/quotes' },
  ],
  children: <p>Page</p>,
}

function render(props: Partial<AppShellProps>) {
  return renderToStaticMarkup(
    <LiroProvider locale="en">
      <AppShell {...BASE} {...props} />
    </LiroProvider>,
  )
}

describe('matchingCompanies', () => {
  it('finds by name or description, ignoring case and accents', () => {
    expect(matchingCompanies(COMPANIES, 'vojvodjanka', 'en')).toEqual([])
    expect(matchingCompanies(COMPANIES, 'vojvođ', 'en').map((c) => c.id)).toEqual(['b'])
    expect(matchingCompanies(COMPANIES, 'nis', 'en').map((c) => c.id)).toEqual(['c'])
    expect(matchingCompanies(COMPANIES, '1078', 'en').map((c) => c.id)).toEqual(['c'])
    expect(matchingCompanies(COMPANIES, '', 'en')).toHaveLength(3)
  })
  it('shows a search field above seven companies', () => {
    expect(COMPANY_SEARCH_THRESHOLD).toBe(7)
  })
})

describe('AppShell', () => {
  it('names the bell with the unread count and shows the dot only while something is unread', () => {
    const unread = render({ layout: 'desktop' })
    expect(unread).toContain('aria-label="Notifications, 3 unread"')
    expect(unread).toContain('data-slot="notification-dot"')
    const none = render({ layout: 'desktop', notifications: { unread: 0, panel: null } })
    expect(none).toContain('aria-label="Notifications"')
    expect(none).not.toContain('data-slot="notification-dot"')
  })
  it('marks the current module tab and starts with a skip link to the content', () => {
    const html = render({ layout: 'desktop' })
    expect(html).toContain('aria-current="page"')
    expect(html).toMatch(/<a href="#[^"]+"[^>]*>Skip to content<\/a>/)
    expect(html).toContain('<main id=')
  })
  it('on desktop: breadcrumbs, the company switcher and the search text', () => {
    const html = render({ layout: 'desktop' })
    expect(html).toContain('aria-label="Breadcrumbs"')
    expect(html).toContain('Switch company: Kvadrat Gradnja d.o.o.')
    expect(html).toContain('>Search…<')
    expect(html).toContain('>Business Apps<')
  })
  it('on phones: no breadcrumbs or company button, an icon search, the bottom bar', () => {
    const html = render({ layout: 'phone', bottomBar: <button type="button">New invoice</button> })
    expect(html).not.toContain('aria-label="Breadcrumbs"')
    expect(html).not.toContain('Switch company:')
    expect(html).toContain('aria-label="Search…"')
    expect(html).not.toContain('>Business Apps<')
    expect(html).toContain('data-slot="shell-bottom-bar"')
    expect(render({ layout: 'desktop', bottomBar: <span /> })).not.toContain('shell-bottom-bar')
  })
  it('renders the slots in their places', () => {
    const html = render({
      layout: 'desktop',
      impersonationBar: <div>IMPERSONATION</div>,
      environmentMarker: <span>SANDBOX</span>,
      offlineIndicator: <div>OFFLINE</div>,
    })
    const order = ['IMPERSONATION', 'SANDBOX', 'Breadcrumbs', 'OFFLINE', 'Page'].map((text) =>
      html.indexOf(text),
    )
    expect(order.every((position) => position > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import {
  AppShell,
  COMPANY_SEARCH_THRESHOLD,
  companyKeyTarget,
  companyRows,
  companySections,
  edgeFade,
  matchingCompanies,
  type AppShellProps,
} from './app-shell'
import { manyCompanies } from './shell-story-data'

const COMPANIES = [
  { id: 'a', name: 'Kvadrat Gradnja d.o.o.', description: 'PIB 108452317' },
  { id: 'b', name: 'Vojvođanka Mlin a.d.', description: 'PIB 100421987' },
  { id: 'c', name: 'Medic Lab Niš d.o.o.', description: 'PIB 107819450' },
]

const BASE: AppShellProps = {
  brand: {
    brandName: 'Liro',
    productName: 'Business Apps',
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
  it('searches 5,000 companies quickly, by name or tax number', () => {
    const companies = manyCompanies(5000)
    expect(new Set(companies.map((company) => company.name)).size).toBe(5000)
    const started = performance.now()
    const found = matchingCompanies(companies, 'drina prevoz', 'sr-Latn')
    expect(performance.now() - started).toBeLessThan(200)
    expect(found.length).toBeGreaterThan(0)
    expect(found.every((company) => company.name.includes('Drina Prevoz'))).toBe(true)
  })
})

describe('companySections', () => {
  it('lists pinned, then recent, then all, each company once, empty sections left out', () => {
    const sections = companySections(COMPANIES, ['c'], ['c', 'a'])
    expect(sections.map((section) => [section.key, section.companies.map((c) => c.id)])).toEqual([
      ['pinned', ['c']],
      ['recent', ['a']],
      ['all', ['b']],
    ])
    expect(companySections(COMPANIES).map((section) => section.key)).toEqual(['all'])
    expect(companySections(COMPANIES.slice(1, 2), ['c'], ['a']).map((s) => s.key)).toEqual(['all'])
  })
  it('heads the rows only with more than one section, and counts the companies', () => {
    expect(companyRows(companySections(COMPANIES)).map((row) => row.kind)).toEqual([
      'company',
      'company',
      'company',
    ])
    const rows = companyRows(companySections(COMPANIES, ['b']))
    expect(rows.map((row) => (row.kind === 'heading' ? row.key : row.position))).toEqual([
      'pinned',
      1,
      'all',
      2,
      3,
    ])
  })
})

describe('companyKeyTarget', () => {
  const rows = companyRows(companySections(COMPANIES, ['b']))
  it('moves by one, by ten and to the ends, skipping headings', () => {
    expect(companyKeyTarget(rows, 1, 'ArrowDown')).toBe(3)
    expect(companyKeyTarget(rows, 3, 'ArrowUp')).toBe(1)
    expect(companyKeyTarget(rows, 1, 'ArrowUp')).toBe(1)
    expect(companyKeyTarget(rows, 4, 'ArrowDown')).toBe(4)
    expect(companyKeyTarget(rows, 1, 'PageDown')).toBe(4)
    expect(companyKeyTarget(rows, 4, 'Home')).toBe(1)
    expect(companyKeyTarget(rows, 1, 'End')).toBe(4)
    expect(companyKeyTarget(rows, 1, 'a')).toBeUndefined()
    expect(companyKeyTarget([], 0, 'ArrowDown')).toBeUndefined()
  })
})

describe('edgeFade', () => {
  it('fades only the edges with more past them, in reading order', () => {
    expect(edgeFade({ start: false, end: false }, 'ltr')).toBeUndefined()
    expect(edgeFade({ start: false, end: true }, 'ltr')).toBe(
      'linear-gradient(to right, currentcolor, currentcolor, currentcolor calc(100% - 32px), transparent)',
    )
    expect(edgeFade({ start: true, end: false }, 'rtl')).toBe(
      'linear-gradient(to left, transparent, currentcolor 32px, currentcolor)',
    )
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
  it('shows breadcrumbs only from two levels', () => {
    expect(render({ layout: 'desktop', breadcrumbs: [{ label: 'Overview' }] })).not.toContain(
      'aria-label="Breadcrumbs"',
    )
  })
  it('on desktop: breadcrumbs, the company switcher and the search text', () => {
    const html = render({ layout: 'desktop' })
    expect(html).toContain('aria-label="Breadcrumbs"')
    expect(html).toContain('Switch company: Kvadrat Gradnja d.o.o.')
    expect(html).toContain('>Search…<')
    expect(html).toContain('Business Apps</span>')
    expect(html).toContain('>Ctrl K<')
    expect(html).not.toContain('<kbd')
  })
  it('on phones: no breadcrumbs or company button, an icon search, the bottom bar', () => {
    const html = render({ layout: 'phone', bottomBar: <button type="button">New invoice</button> })
    expect(html).not.toContain('aria-label="Breadcrumbs"')
    expect(html).not.toContain('Switch company:')
    expect(html).not.toContain('max-w-60 truncate')
    expect(html).toContain('aria-label="Search…"')
    expect(html).not.toContain('Business Apps</span>')
    expect(html).toContain('data-slot="shell-bottom-bar"')
    expect(render({ layout: 'desktop', bottomBar: <span /> })).not.toContain('shell-bottom-bar')
  })
  it('renders the slots in their places', () => {
    const html = render({
      layout: 'desktop',
      impersonationBar: <div>IMPERSONATION</div>,
      environmentMarker: <span>SANDBOX</span>,
      offlineIndicator: <div>OFFLINE</div>,
      agent: <button type="button">AGENT</button>,
    })
    const order = ['IMPERSONATION', 'SANDBOX', 'Breadcrumbs', 'AGENT', 'OFFLINE', 'Page'].map(
      (text) => html.indexOf(text),
    )
    expect(order.every((position) => position > -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
  it('puts the application-wide banners under the offline indicator, at the top of the content', () => {
    const html = render({
      layout: 'desktop',
      impersonationBar: <div>IMPERSONATION</div>,
      offlineIndicator: <div>OFFLINE</div>,
      banners: <div>TRIAL</div>,
    })
    const order = ['IMPERSONATION', '<header', 'OFFLINE', '<main', 'shell-banners', 'TRIAL', 'Page']
    const positions = order.map((text) => html.indexOf(text))
    expect(positions.every((position) => position > -1)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    // Banners scroll with the page: they are inside main, outside the sticky top.
    expect(html.indexOf('TRIAL')).toBeGreaterThan(html.indexOf('</header>'))
    expect(render({ layout: 'desktop' })).not.toContain('shell-banners')
    expect(render({ layout: 'desktop', banners: null })).not.toContain('shell-banners')
  })
})

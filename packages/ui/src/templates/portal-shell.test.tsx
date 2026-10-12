import { CalendarDays, MessageSquare } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { PortalShell, type PortalShellProps } from './portal-shell'

const BASE: PortalShellProps = {
  brand: { brandName: 'Dom zdravlja', productName: 'Novi Sad', href: '/' },
  participant: { name: 'Jovana Nikolić', detail: 'Patient' },
  menu: [],
  sections: [
    { key: 'a', label: 'Appointments', href: '/a', icon: CalendarDays, current: true },
    { key: 'm', label: 'Messages', href: '/m', icon: MessageSquare, note: '2 new' },
  ],
  children: <p>Page</p>,
}

function render(props: Partial<PortalShellProps>) {
  return renderToStaticMarkup(
    <LiroProvider locale="en">
      <PortalShell {...BASE} {...props} />
    </LiroProvider>,
  )
}

describe('PortalShell', () => {
  it('starts with a skip link to the content', () => {
    const html = render({ layout: 'desktop' })
    expect(html.indexOf('Skip to content')).toBeLessThan(html.indexOf('<header'))
    expect(html).toMatch(/<main id="[^"]+"/)
  })

  it('shows the sections as tabs on desktop, the current one marked', () => {
    const html = render({ layout: 'desktop' })
    expect(html).toContain('aria-label="Sections"')
    expect(html).toContain('aria-current="page"')
    expect(html).not.toContain('portal-bottom-bar')
    expect(html).toContain('aria-label="Account: Jovana Nikolić"')
  })

  it('moves the sections into a bottom bar on phones, a note in the link name', () => {
    const html = render({ layout: 'phone' })
    expect(html).toContain('data-slot="portal-bottom-bar"')
    expect(html).toContain('aria-label="Messages, 2 new"')
    expect(html).toContain('data-slot="portal-note-dot"')
    // The bottom bar comes after the page.
    expect(html.indexOf('portal-bottom-bar')).toBeGreaterThan(html.indexOf('<main'))
  })

  it('puts banners at the top of the content and the footer after it', () => {
    const html = render({ layout: 'phone', banners: <p>Closed on Friday</p>, footer: 'Contact' })
    expect(html.indexOf('Closed on Friday')).toBeGreaterThan(html.indexOf('<main'))
    expect(html.indexOf('Closed on Friday')).toBeLessThan(html.indexOf('Page'))
    expect(html.indexOf('<footer')).toBeGreaterThan(html.indexOf('</main>'))
  })

  it('has no section navigation without sections', () => {
    expect(render({ sections: [], layout: 'phone' })).not.toContain('aria-label="Sections"')
  })
})

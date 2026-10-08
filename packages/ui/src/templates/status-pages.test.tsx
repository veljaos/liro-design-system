import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Tabs } from '../components/navigation'
import { LiroProvider } from '../provider/liro-provider'
import { AuthShell } from './auth-shell'
import { SettingsPage } from './settings-page'
import { STATUS_KINDS, StatusPage, statusLook } from './status-page'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

const BRAND = { brandName: 'Liro', productName: 'Business Apps' }

describe('statusLook', () => {
  it('gives each kind the owner’s tone, and the HTTP code only to the coded pages', () => {
    expect(
      STATUS_KINDS.map((kind) => [kind, statusLook(kind).tone, statusLook(kind).code]),
    ).toEqual([
      ['unauthenticated', 'warning', '401'],
      ['planRequired', 'warning', '402'],
      ['forbidden', 'warning', '403'],
      ['notFound', 'neutral', '404'],
      ['error', 'danger', '500'],
      ['maintenance', 'warning', undefined],
      ['suspended', 'danger', undefined],
    ])
  })
})

describe('StatusPage', () => {
  it('shows the default texts, the bare code and the tone fill', () => {
    const html = render(<StatusPage kind="notFound" brand={BRAND} />)
    expect(html).toContain('<h1')
    expect(html).toContain('Page not found')
    expect(html).toContain('>404</p>')
    expect(html).toContain('bg-status-neutral-solid')
    expect(html).not.toContain('bg-status-info-solid')
  })
  it('takes the application’s texts, removes the code with null, and shows the case number', () => {
    const html = render(
      <StatusPage
        kind="error"
        brand={BRAND}
        title="Greška"
        description="Pokušajte ponovo."
        eyebrow={null}
        caseId="LRO-1"
      />,
    )
    expect(html).toContain('Greška')
    expect(html).toContain('Pokušajte ponovo.')
    expect(html).not.toContain('>500</p>')
    expect(html).toContain('Case number:')
    expect(html).toContain('LRO-1')
  })
  it('draws a link action as a button that keeps its colours, and a plain action as a button', () => {
    const html = render(
      <StatusPage
        kind="unauthenticated"
        brand={BRAND}
        primaryAction={{ label: 'Sign in', href: '/sign-in' }}
        secondaryAction={{ label: 'Retry', onClick: () => undefined }}
      />,
    )
    expect(html).toMatch(/<a [^>]*href="\/sign-in"[^>]*visited:text-on-accent/)
    expect(html).toMatch(/<button[^>]*>.*Retry/)
    expect(html).toContain('bg-status-warning-solid')
  })
  it('names the suspended subject: the user’s account by default, or a company', () => {
    const account = render(<StatusPage kind="suspended" brand={BRAND} />)
    expect(account).toContain('Account suspended')
    expect(account).toContain('Your account is suspended.')
    const company = render(
      <StatusPage
        kind="suspended"
        brand={BRAND}
        subject={{ kind: 'company', name: 'Kvadrat Gradnja d.o.o.' }}
      />,
    )
    expect(company).toContain('Company suspended')
    expect(company).toContain('Access for Kvadrat Gradnja d.o.o. is suspended.')
    // Another kind ignores the subject.
    expect(
      render(<StatusPage kind="notFound" brand={BRAND} subject={{ kind: 'company', name: 'X' }} />),
    ).toContain('Page not found')
  })
  it('has no buttons without actions', () => {
    expect(render(<StatusPage kind="maintenance" brand={BRAND} />)).not.toContain('<button')
  })
})

describe('AuthShell', () => {
  it('frames the card on desktop and drops the frame on phones', () => {
    const desktop = render(
      <AuthShell brand={BRAND} title="Sign in" layout="desktop" footer="Terms">
        <p>flow</p>
      </AuthShell>,
    )
    expect(desktop).toContain('bg-surface-sunken')
    expect(desktop).toContain('border-default')
    expect(desktop).toContain('<footer')
    const phone = render(
      <AuthShell brand={BRAND} title="Sign in" layout="phone">
        <p>flow</p>
      </AuthShell>,
    )
    expect(phone).not.toContain('border-default')
    expect(phone).not.toContain('<footer')
    expect(phone).toContain('Business Apps')
  })
})

describe('start-aligned tabs', () => {
  it('Tabs stand at the start by default and centre with align="center" (P4.7c)', () => {
    const items = [{ value: 'a', label: 'A', content: 'a' }]
    expect(render(<Tabs items={items} />)).toContain('justify-start')
    expect(render(<Tabs items={items} align="center" />)).toContain('justify-center')
  })
  it('SettingsPage stands at the start with start-aligned tabs', () => {
    const html = render(
      <SettingsPage
        title="Settings"
        groups={[
          { key: 'a', label: 'A', sections: [] },
          { key: 'b', label: 'B', sections: [] },
        ]}
      />,
    )
    expect(html).not.toContain('mx-auto')
    expect(html).toContain('justify-start')
  })
})

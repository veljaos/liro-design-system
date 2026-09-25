import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Direction } from 'radix-ui'
import { describe, expect, it } from 'vitest'
import { LiroProvider, localToday, useLiro } from './liro-provider'
import type { LiroMessages } from './messages'
import { messagesEn } from './messages.en'

function render(node: ReactNode): string {
  return renderToStaticMarkup(node)
}

function Messages() {
  const { messages } = useLiro()
  return (
    <output>
      {[
        messages['table.next'],
        messages['table.count'](1234, true),
        messages['action.unavailable']('closed period'),
      ].join('|')}
    </output>
  )
}

function Dates() {
  const { today, weekStartsOn } = useLiro()
  return <output>{`${today}|${String(weekStartsOn)}`}</output>
}

function Link() {
  const { linkComponent: LinkComponent } = useLiro()
  return <LinkComponent href="/things/1">Thing</LinkComponent>
}

function RadixDirection() {
  return <output>{Direction.useDirection()}</output>
}

describe('messages', () => {
  it('has English defaults for every key', () => {
    expect(messagesEn['table.previous']).toBe('Previous')
    expect(messagesEn['table.count'](1234, true)).toBe('1,234 rows')
    expect(messagesEn['table.count'](1, true)).toBe('1 row')
    expect(messagesEn['table.count'](10000, false)).toBe('More than 10,000 rows')
    expect(messagesEn['action.unavailable']('closed period')).toBe('Unavailable: closed period')
  })

  it('makes a missing key a compile error', () => {
    // @ts-expect-error -- every key of LiroMessages is required; this object lacks all but one.
    const incomplete: LiroMessages = { 'table.next': 'Next' }
    expect(Object.keys(incomplete)).toHaveLength(1)
    expect(Object.keys(messagesEn).sort()).toEqual([
      'action.unavailable',
      'connection.offline',
      'field.readOnly',
      'field.required',
      'table.count',
      'table.next',
      'table.noMatch',
      'table.noRows',
      'table.previous',
    ])
  })

  it('lets the application replace any message, including those that take a value', () => {
    const html = render(
      <LiroProvider
        locale="sr-Latn-RS"
        messages={{
          'table.next': 'Sledeće',
          'table.count': (count, exact) => `${exact ? '' : 'Više od '}${String(count)} redova`,
        }}
      >
        <Messages />
      </LiroProvider>,
    )
    expect(html).toContain('<output>Sledeće|1234 redova|Unavailable: closed period</output>')
  })

  it('uses the English defaults outside a provider', () => {
    expect(render(<Messages />)).toBe('<output>Next|1,234 rows|Unavailable: closed period</output>')
  })
})

describe('today and weekStartsOn', () => {
  it('passes the given today, e.g. the tenant date', () => {
    expect(
      render(
        <LiroProvider locale="en" today="2026-03-15">
          <Dates />
        </LiroProvider>,
      ),
    ).toContain('<output>2026-03-15|0</output>')
  })

  it("defaults today to the device's local date", () => {
    expect(
      render(
        <LiroProvider locale="en">
          <Dates />
        </LiroProvider>,
      ),
    ).toContain(`<output>${localToday()}|0</output>`)
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('takes the first day of the week from the locale, or from the prop', () => {
    const at = (locale: string, weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6) =>
      render(
        <LiroProvider
          locale={locale}
          today="2026-03-15"
          {...(weekStartsOn === undefined ? {} : { weekStartsOn })}
        >
          <Dates />
        </LiroProvider>,
      )
    expect(at('sr-Latn-RS')).toContain('2026-03-15|1<')
    expect(at('ar')).toContain('2026-03-15|6<')
    expect(at('en', 1)).toContain('2026-03-15|1<')
  })
})

describe('linkComponent', () => {
  it('renders links as <a> by default', () => {
    expect(render(<Link />)).toBe('<a href="/things/1">Thing</a>')
  })

  it("renders links with the application's router link", () => {
    function RouterLink({ href, children }: { href: string; children: ReactNode }) {
      return (
        <a href={href} data-router="client">
          {children}
        </a>
      )
    }
    expect(
      render(
        <LiroProvider locale="en" linkComponent={RouterLink}>
          <Link />
        </LiroProvider>,
      ),
    ).toContain('<a href="/things/1" data-router="client">Thing</a>')
  })
})

describe('direction for Radix', () => {
  it('gives Radix primitives the direction of the provider', () => {
    expect(
      render(
        <LiroProvider locale="ar">
          <RadixDirection />
        </LiroProvider>,
      ),
    ).toContain('<output>rtl</output>')
    expect(
      render(
        <LiroProvider locale="ar" direction="ltr">
          <RadixDirection />
        </LiroProvider>,
      ),
    ).toContain('<output>ltr</output>')
  })
})

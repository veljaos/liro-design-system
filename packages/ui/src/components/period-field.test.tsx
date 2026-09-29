import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { PeriodField } from './period-field'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <LiroProvider locale="en" today="2026-09-28">
      {node}
    </LiroProvider>,
  )

describe('PeriodField markup', () => {
  it('shows the current period as the trigger label, named by the field label', () => {
    const html = render(
      <PeriodField
        id="p"
        label="Period"
        value={{ start: '2025-07-01', end: '2026-06-30' }}
        yearStartMonth={7}
      />,
    )
    expect(html).toContain('>2025/26</span>')
    expect(html).toContain('aria-labelledby="p-label')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('font-regular')
  })

  it('shows "All periods" without a value', () => {
    expect(render(<PeriodField label="Period" />)).toContain('All periods')
  })

  it('names quarters on the chosen basis', () => {
    const range = { start: '2026-01-01', end: '2026-03-31' }
    expect(render(<PeriodField label="P" value={range} yearStartMonth={7} />)).toContain(
      'Q3 2025/26',
    )
    expect(
      render(<PeriodField label="P" value={range} yearStartMonth={7} quarterBasis="calendar" />),
    ).toContain('Q1 2026')
  })

  it('submits both ends under their names', () => {
    const html = render(
      <PeriodField
        label="P"
        value={{ start: '2026-01-01', end: '2026-03-31' }}
        startName="from"
        endName="to"
      />,
    )
    expect(html).toContain('name="from" value="2026-01-01"')
    expect(html).toContain('name="to" value="2026-03-31"')
  })

  it('draws read-only as text and disabled with its reason', () => {
    const readOnly = render(
      <PeriodField label="P" readOnly value={{ start: '2026-03-01', end: '2026-03-31' }} />,
    )
    expect(readOnly).toMatch(/<input[^>]*readOnly=""[^>]*value="March 2026"/)
    const disabled = render(<PeriodField id="d" label="P" disabled disabledReason="Closed" />)
    expect(disabled).toContain('Closed')
    expect(disabled).toMatch(/<button[^>]*disabled=""/)
  })
})

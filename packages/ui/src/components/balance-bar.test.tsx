import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { BalanceBar } from './balance-bar'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('BalanceBar', () => {
  it('says the entry is balanced, in words', () => {
    const html = render(
      <BalanceBar
        debit="144720.00"
        credit="144720.00"
        difference="0.00"
        state="balanced"
        currency="RSD"
      />,
    )
    expect(html).toContain('Debit')
    expect(html).toContain('Credit')
    expect(html).toContain('Difference')
    expect(html).toMatch(/role="status"[^>]*>.*Balanced/)
    expect(html).toContain('data-state="balanced"')
  })

  it('marks a difference in words and the danger tone', () => {
    const html = render(
      <BalanceBar
        debit="146720.00"
        credit="144720.00"
        difference="2000.00"
        state="unbalanced"
        currency="RSD"
      />,
    )
    expect(html).toContain('Not balanced')
    expect(html).toMatch(/text-status-danger-fg[^>]*>.*2,000.00/)
  })

  it('never shows a difference it cannot know', () => {
    const html = render(
      <BalanceBar
        debit="84600.00"
        credit="144720.00"
        difference="-60120.00"
        state="incomplete"
        currency="RSD"
      />,
    )
    expect(html).toContain('Amounts missing')
    expect(html).not.toContain('60,120')
    expect(html).toContain('—')
  })
})

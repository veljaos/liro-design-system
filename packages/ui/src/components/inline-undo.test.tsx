import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { CartPanel, type CartLine } from './cart-panel'
import { InlineUndo } from './inline-undo'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const LINES: CartLine[] = [
  { id: 'a', name: 'Kifla', quantity: '1', unitPrice: '25.00', total: '25.00' },
  { id: 'b', name: 'Jogurt', quantity: '1', unitPrice: '90.00', total: '90.00' },
]

describe('InlineUndo (P5.93 item 3)', () => {
  it('says what happened politely and describes its Undo with it', () => {
    const html = render(<InlineUndo message="Krempita removed" onUndo={() => undefined} />)
    const id = /<p id="([^"]+)" role="status"/.exec(html)?.[1]
    expect(id).toBeDefined()
    expect(html).toContain(`aria-describedby="${id ?? ''}"`)
    expect(html).toContain('>Undo</span>')
  })
})

describe('CartPanel undo', () => {
  it('stands after the line it follows', () => {
    const html = render(
      <CartPanel
        lines={LINES}
        currency="RSD"
        total="115.00"
        undo={{ message: 'Burek removed', after: 'a', onUndo: () => undefined }}
      />,
    )
    expect(html.indexOf('Kifla')).toBeLessThan(html.indexOf('Burek removed'))
    expect(html.indexOf('Burek removed')).toBeLessThan(html.indexOf('Jogurt'))
  })

  it('stands at the top without a line to follow, also in an empty cart', () => {
    const html = render(
      <CartPanel
        lines={[]}
        currency="RSD"
        total={null}
        undo={{ message: 'Sale parked', undoLabel: 'Resume', onUndo: () => undefined }}
      />,
    )
    expect(html).toContain('Sale parked')
    expect(html).toContain('>Resume</span>')
    expect(html.indexOf('Sale parked')).toBeLessThan(html.indexOf('No items yet'))
  })
})

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { numericFormat } from '../provider/format'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import { PosShell } from '../templates/pos-shell'
import { CartPanel } from './cart-panel'
import { NumericKeypad } from './numeric-keypad'
import { ProductGrid } from './product-tile'
import { QuantityStepper } from './quantity-stepper'
import { ScanField } from './scan-field'

const SERBIAN = numericFormat('sr-Latn-RS')

function render(node: React.ReactNode, density?: 'default' | 'touch') {
  return renderToStaticMarkup(
    <LiroProvider locale="en-RS" format={SERBIAN} {...(density === undefined ? {} : { density })}>
      {node}
    </LiroProvider>,
  )
}

function Density() {
  return <span data-density={useLiro().density} />
}

describe('touch density', () => {
  it('marks its scope and tells the components', () => {
    const html = render(<Density />, 'touch')
    expect(html).toContain('data-liro-density="touch"')
    expect(html).toContain('data-density="touch"')
  })

  it('is the default without the prop, with no attribute', () => {
    const html = render(<Density />)
    expect(html).not.toContain('data-liro-density')
    expect(html).toContain('data-density="default"')
  })

  it('is inherited, and never lowered, by a nested provider', () => {
    const inherited = render(
      <LiroProvider locale="ar">
        <Density />
      </LiroProvider>,
      'touch',
    )
    expect(inherited).toContain('data-density="touch"')
    const lowered = render(
      <LiroProvider locale="en" density="default">
        <Density />
      </LiroProvider>,
      'touch',
    )
    expect(lowered).toContain('data-density="touch"')
  })
})

describe('NumericKeypad', () => {
  it('writes the value and the separator through format, keys left to right', () => {
    const html = render(
      <NumericKeypad
        label="Amount tendered"
        currency="RSD"
        defaultValue="1234.5"
        onEnter={() => undefined}
      />,
    )
    expect(html).toContain('value="1.234,5"')
    expect(html).toContain('aria-label="Decimal separator"')
    expect(html).toContain('>,</button>')
    expect(html).toContain('dir="ltr"')
    expect(html).toContain('inputMode="none"')
    expect(html).toContain('data-key="enter"')
  })

  it('has no separator key without decimals, and no Enter without onEnter', () => {
    const html = render(<NumericKeypad label="Quantity" maxDecimals={0} />)
    expect(html).not.toContain('data-key="decimal"')
    expect(html).not.toContain('data-key="enter"')
  })
})

describe('CartPanel', () => {
  it('shows the amounts it is given and computes none', () => {
    const html = render(
      <CartPanel
        currency="RSD"
        total="1234"
        totals={[{ id: 'sub', label: 'Subtotal', value: '1300' }]}
        lines={[{ id: 'a', name: 'Kifla', quantity: '3', unitPrice: '25', total: '999.99' }]}
        onCharge={() => undefined}
      />,
    )
    // The line total is the application's, not 3 × 25.
    expect(html).toContain('999,99')
    expect(html).not.toContain('75,00')
    expect(html).toContain('Charge 1.234,00')
    expect(html).toContain('1 item')
  })

  it('keeps the charge focusable with its reason while it cannot be done', () => {
    const html = render(
      <CartPanel
        currency="RSD"
        total="10"
        lines={[{ id: 'a', name: 'Kifla', quantity: '1', unitPrice: '10', total: '10' }]}
        onCharge={() => undefined}
        chargeDisabledReason="The register is closed."
      />,
    )
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('The register is closed.')
  })
})

describe('QuantityStepper', () => {
  it('shows an out-of-range quantity as an error, never changing it', () => {
    const html = render(<QuantityStepper label="Quantity" value="15" max="12" unit="pc" />)
    expect(html).toContain('value="15"')
    expect(html).toContain('At most 12.')
    expect(html).toContain('aria-invalid="true"')
  })

  it('names its buttons with the field, and stops at a limit, still focusable', () => {
    const html = render(<QuantityStepper label="Quantity" value="0" min="0" />)
    expect(html).toMatch(/aria-labelledby="[^"]+ [^"]+"[^>]*aria-disabled="true"/)
    expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
    expect(html).toContain('Decrease')
    // At the lower limit without the application's reason: no line under the field.
    expect(html).not.toContain('Minimum 0')
  })

  it('says why + cannot be used at the maximum, with the application’s reason', () => {
    const html = render(
      <QuantityStepper label="Quantity" value="6" max="6" maxReason="the quantity on the order" />,
    )
    expect(html).toContain('Maximum 6 — the quantity on the order')
    expect(html).toMatch(/aria-disabled="true"[^>]*aria-describedby="([^"]+)"/)
    const described = /aria-disabled="true"[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1] ?? ''
    expect(html).toContain(`id="${described}"`)
  })

  it('shows read-only in the read-only look, without − and +', () => {
    const html = render(<QuantityStepper label="Quantity" value="4" readOnly />)
    expect(html).toContain('bg-surface-disabled')
    expect(html).not.toContain('Increase')
  })
})

describe('ScanField', () => {
  it('shows the feedback with words before it, and the camera button', () => {
    const html = render(
      <ScanField
        label="Item code"
        onScan={() => undefined}
        onCameraScan={() => undefined}
        feedback={{ id: 1, tone: 'error', text: 'Unknown code 8600123' }}
      />,
    )
    expect(html).toContain('role="status"')
    expect(html).toContain('Problem:')
    expect(html).toContain('Unknown code 8600123')
    expect(html).toContain('aria-label="Scan with camera"')
  })
})

describe('ProductGrid', () => {
  it('shows the chosen category, unavailable tiles focusable with their reason', () => {
    const html = render(
      <ProductGrid
        currency="RSD"
        onSelect={() => undefined}
        categories={[
          { id: 'bread', label: 'Bread' },
          { id: 'cakes', label: 'Cakes' },
        ]}
        defaultCategory="bread"
        products={[
          { id: 'a', name: 'Kifla', price: '25', categoryId: 'bread' },
          {
            id: 'b',
            name: 'Burek',
            price: '180',
            categoryId: 'bread',
            unavailableReason: 'Sold out',
          },
          {
            id: 'd',
            name: 'Pogača',
            price: '90',
            categoryId: 'bread',
            stock: { tone: 'warning', text: '3 left' },
          },
          { id: 'c', name: 'Krempita', price: '220', categoryId: 'cakes' },
        ]}
      />,
    )
    expect(html).toContain('Kifla')
    expect(html).not.toContain('Krempita')
    // P5.93: a state in two lines — the state with its icon, the detail under it.
    expect(html).toMatch(/>Unavailable<\/span><\/span><span[^>]*>Sold out</)
    expect(html).toMatch(/>Low stock<\/span><\/span><span[^>]*>3 left</)
    expect(html).toContain('aria-pressed="true"')
    // One tile in the tab order.
    expect(html.match(/tabindex="0"/gi)).toHaveLength(1)
  })
})

describe('PosShell', () => {
  it('shows the queue while online and the offline strip while offline', () => {
    const online = render(
      <PosShell
        brand="Zlatni klas"
        register="Kasa 2"
        cashier="Milica"
        queued={3}
        products={null}
        cart={null}
        layout="tablet"
      />,
    )
    expect(online).toContain('3 sales waiting to be sent')
    expect(online).toContain('Sending…')
    const offline = render(
      <PosShell
        brand="Zlatni klas"
        offline
        queued={1}
        products={null}
        cart={null}
        layout="tablet"
      />,
    )
    expect(offline).toContain('Offline')
    expect(offline).toContain('1 sale waiting to be sent')
  })
})

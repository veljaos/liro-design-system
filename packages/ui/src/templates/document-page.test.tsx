import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentTotals } from '../components/document-totals'
import { LifecycleBar, lifecycleState } from '../components/lifecycle-bar'
import { SidePanels } from '../components/side-panels'
import { LiroProvider } from '../provider/liro-provider'
import { DocumentPage } from './document-page'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={{ numberScheme: 'dot-comma' }}>
      {node}
    </LiroProvider>,
  )
}

const STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'sef', label: 'Sent to SEF' },
  { key: 'paid', label: 'Paid' },
]

describe('lifecycleState', () => {
  it('is completed before the current step, future after it, and error wins', () => {
    expect(lifecycleState(STEPS[0] ?? { key: '', label: '' }, 0, 2)).toBe('completed')
    expect(lifecycleState({ key: 'x', label: 'x' }, 2, 2)).toBe('current')
    expect(lifecycleState({ key: 'x', label: 'x' }, 3, 2)).toBe('future')
    expect(lifecycleState({ key: 'x', label: 'x', error: 'No' }, 0, 2)).toBe('error')
  })
})

describe('LifecycleBar', () => {
  it('marks the current step and reads completed steps and errors to assistive technology', () => {
    const html = render(
      <LifecycleBar layout="desktop" label="Invoice status" steps={STEPS} current={2} />,
    )
    expect(html).toContain('aria-label="Invoice status"')
    expect(html.match(/aria-current="step"/g)).toHaveLength(1)
    expect(html).toMatch(/aria-current="step".*Sent to SEF/)
    expect(html).toContain('<span class="sr-only">, Completed</span>')
    const error = render(
      <LifecycleBar
        layout="desktop"
        label="Invoice status"
        steps={[
          ...STEPS.slice(0, 2),
          { key: 'sef', label: 'Rejected by SEF', error: 'Unknown buyer' },
        ]}
        current={2}
      />,
    )
    expect(error).toContain('text-status-danger-fg')
    expect(error).toContain('<span class="sr-only">: Unknown buyer</span>')
  })
  it('is one line on phones: "Step 3 of 4: Sent to SEF"', () => {
    const html = render(
      <LifecycleBar layout="phone" label="Invoice status" steps={STEPS} current={2} />,
    )
    expect(html).toContain('Step 3 of 4: Sent to SEF')
    expect(html).not.toContain('<ol')
  })
})

describe('DocumentTotals', () => {
  it('writes every row, a group line where asked, and the final row large', () => {
    const html = render(
      <DocumentTotals
        label="Totals"
        rows={[
          { key: 'a', label: 'Tax base 20%', value: '144920.00', currency: 'RSD' },
          { key: 'b', label: 'Tax base 10%', value: '8500.00', currency: 'RSD', group: true },
        ]}
        total={{ key: 't', label: 'Amount due', value: '133254.00', currency: 'RSD' }}
      />,
    )
    expect(html).toContain('aria-label="Totals"')
    expect(html).toContain('144.920,00')
    expect(html.match(/border-subtle/g)).toHaveLength(1)
    expect(html).toMatch(/border-strong[^"]*text-lg font-semibold/)
    expect(html).toContain('max-w-80')
  })
})

describe('SidePanels', () => {
  it('shows an open panel and collapses a closed one to its header', () => {
    const html = render(
      <SidePanels
        panels={[
          { key: 'att', title: 'Attachments', count: 3, content: <p>FILES</p> },
          { key: 'his', title: 'History', content: <p>LOG</p> },
        ]}
        open={['att']}
        onOpenChange={() => undefined}
      />,
    )
    expect(html).toMatch(/aria-expanded="true"[^>]*>.*Attachments.*>3</)
    expect(html).toContain('FILES')
    expect(html).toMatch(/aria-expanded="false"[^>]*>.*History/)
    expect(html).not.toContain('LOG')
  })
})

describe('DocumentPage', () => {
  const base = {
    title: 'F-2026-0412',
    linesTitle: 'Lines',
    lines: <p>LINES</p>,
    counterparty: { label: 'Customer', name: 'Panonija Agro d.o.o.', taxId: 'PIB 104987265' },
    panels: [{ key: 'att', title: 'Attachments', content: <p>FILES</p> }],
    panelsOpen: ['att'],
    onPanelsHiddenChange: () => undefined,
  }
  it('shows the counterparty, the panels beside the document and the hide button', () => {
    const html = render(<DocumentPage {...base} layout="desktop" />)
    expect(html).toContain('Customer')
    expect(html).toContain('Panonija Agro d.o.o.')
    expect(html).toContain('aria-label="Panels"')
    expect(html).toContain('Hide panels')
    expect(html).toContain('lg:grid-cols-[minmax(0,1fr)_300px]')
  })
  it('leaves the panels out when hidden, and keeps them under the document below 75em', () => {
    const hidden = render(<DocumentPage {...base} layout="desktop" panelsHidden />)
    expect(hidden).not.toContain('aria-label="Panels"')
    expect(hidden).toContain('Show panels')
    const narrow = render(<DocumentPage {...base} layout="narrow" panelsHidden />)
    expect(narrow).toContain('aria-label="Panels"')
    expect(narrow).not.toContain('Show panels')
    expect(narrow).not.toContain('lg:grid-cols-')
  })
})

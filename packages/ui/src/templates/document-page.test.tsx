import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DocumentTotals } from '../components/document-totals'
import { LifecycleBar, lifecycleState } from '../components/lifecycle-bar'
import { SidePanels } from '../components/side-panels'
import { ActivityList, RelatedDocuments } from '../components/panel-lists'
import { ChangeableValue } from '../components/changeable-value'
import { LiroProvider } from '../provider/liro-provider'
import { DocumentSource } from '../components/document-source'
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

describe('panel lists (P4.9)', () => {
  const entries = ['c4', 'c3', 'c2', 'c1'].map((key) => ({
    key,
    author: `Author ${key}`,
    time: '01.10.2026.',
    text: `Text ${key}`,
  }))

  it('shows the latest two entries and "Show all" with the count through format', () => {
    const html = render(<ActivityList label="Comments" items={entries} />)
    expect(html).toContain('Author c4')
    expect(html).toContain('Author c3')
    expect(html).not.toContain('Author c2')
    expect(html).toContain('Show all 4')
    expect(html).toContain('aria-expanded="false"')
  })

  it('shows every entry and no button when there are no more than the limit', () => {
    const html = render(<ActivityList label="History" items={entries} limit={4} />)
    expect(html).toContain('Author c1')
    expect(html).not.toContain('Show all')
  })

  it('makes every related document a link with its type, number and status', () => {
    const html = render(
      <RelatedDocuments
        label="Related documents"
        items={[
          {
            key: 'o',
            type: 'Order',
            number: 'N-2026-0157',
            href: '#orders/N-2026-0157',
            status: <span>Completed</span>,
          },
        ]}
      />,
    )
    expect(html).toMatch(/<a href="#orders\/N-2026-0157"[^>]*>.*Order.*N-2026-0157.*<\/a>/)
    expect(html).toContain('Completed')
  })

  it('leaves no space of its own at a panel body’s edges', () => {
    const html = render(
      <SidePanels
        open={['p']}
        onOpenChange={() => undefined}
        panels={[
          { key: 'p', title: 'Comments', content: <ActivityList label="C" items={entries} /> },
        ]}
      />,
    )
    expect(html).toContain('[&amp;_[data-slot=panel-row]:first-child]:pt-0')
    expect(html).toContain('pb-3')
  })
})

describe('ChangeableValue (P4.9)', () => {
  it('shows the value and a pencil named after it, not the field', () => {
    const html = render(
      <ChangeableValue
        label="Due date"
        value="21.10.2026."
        field={<input aria-label="Due date" />}
      />,
    )
    expect(html).toContain('21.10.2026.')
    expect(html).toContain('aria-label="Change Due date"')
    expect(html).not.toContain('<input')
  })

  it('shows the field when editing', () => {
    const html = render(
      <ChangeableValue
        label="Due date"
        value="21.10.2026."
        editing
        field={<input aria-label="Due date" />}
      />,
    )
    expect(html).toContain('<input aria-label="Due date"/>')
  })

  it('without a field: the same value row, no pencil, never a field (P5.23)', () => {
    const changeable = render(
      <ChangeableValue label="Date" value="06.10.2026." field={<input aria-label="Date" />} />,
    )
    const fixed = render(<ChangeableValue label="Based on" value="UF-2026-1204" editing />)
    expect(fixed).toContain('UF-2026-1204')
    expect(fixed).not.toContain('Change Based on')
    // Both value rows are as high as the pencil, so the header's values align.
    expect(fixed).toContain('min-h-7')
    expect(changeable).toContain('min-h-7')
  })
})

describe('DocumentSource in the header (P5.23)', () => {
  it('stands beside the counterparty, before the key figures and the references', () => {
    const html = render(
      <DocumentPage
        layout="desktop"
        title="KO-2026-0009"
        counterparty={{ label: 'Customer', name: 'Medic Lab Niš d.o.o.' }}
        source={
          <DocumentSource
            label="Corrects"
            documents={[
              {
                key: 'f',
                kind: 'Invoice',
                number: 'F-2026-0410',
                href: '#/f',
                date: '2026-09-25',
                total: { value: '186420.35', currency: 'RSD' },
                status: <span>Partially paid</span>,
              },
            ]}
          />
        }
        keyFigures={[{ label: 'Change', value: '-18.657,60' }]}
        references={<p>Based on</p>}
        lines={null}
      />,
    )
    const parties = html.indexOf('data-slot="document-parties"')
    expect(parties).toBeGreaterThan(-1)
    expect(html.indexOf('Medic Lab')).toBeGreaterThan(parties)
    expect(html.indexOf('data-slot="document-source"')).toBeGreaterThan(html.indexOf('Medic Lab'))
    expect(html.indexOf('data-slot="document-source"')).toBeLessThan(html.indexOf('Change'))
    expect(html.indexOf('Change')).toBeLessThan(html.indexOf('Based on'))
    expect(html).toMatch(/<a href="#\/f"[^>]*>.*Invoice.*F-2026-0410.*<\/a>/)
    expect(html).toContain('Issued')
    expect(html).toContain('186.420,35')
    expect(html).toContain('Partially paid')
  })

  it('leaves the counterparty as it was without a source; no documents render nothing', () => {
    const html = render(
      <DocumentPage
        layout="desktop"
        title="F-2026-0410"
        counterparty={{ label: 'Customer', name: 'Medic Lab Niš d.o.o.' }}
        lines={null}
      />,
    )
    expect(html).not.toContain('document-parties')
    expect(render(<DocumentSource label="Corrects" documents={[]} />)).not.toContain('Corrects')
  })
})

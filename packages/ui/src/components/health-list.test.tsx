import type { ReactNode } from 'react'
import { Plug } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { HealthList, healthIcon, type HealthItem } from './health-list'
import { HEALTH_KINDS, healthFacts } from './health-logic'

const format = createFormat('en')

function render(node: ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

const SEF: HealthItem = {
  id: 'sef',
  name: 'SEF (e-invoicing)',
  detail: 'Production',
  state: { kind: 'down', label: 'Down', tone: 'danger' },
  metrics: [{ key: 'queue', label: 'Waiting to send', value: '14' }],
  lastSuccess: '2026-10-14T07:55:00+02:00',
  lastError: { at: '2026-10-14T09:31:00+02:00', message: 'The service did not answer in 30 s.' },
  actions: [{ key: 'retry', label: 'Retry', onSelect: () => undefined }],
}

describe('healthFacts', () => {
  it('writes the last success and the last error with its message, each only when reported', () => {
    expect(healthFacts(SEF, format, messagesEn)).toEqual([
      {
        key: 'lastSuccess',
        label: 'Last success',
        value: `${format.date('2026-10-14')} ${format.time('2026-10-14T07:55:00+02:00')}`,
      },
      {
        key: 'lastError',
        label: 'Last error',
        value: `${format.date('2026-10-14')} ${format.time('2026-10-14T09:31:00+02:00')}`,
      },
      {
        key: 'errorMessage',
        label: 'Error message',
        value: 'The service did not answer in 30 s.',
      },
    ])
    expect(healthFacts({}, format, messagesEn)).toEqual([])
  })

  it('says "Never" for a thing that never worked, never an empty time', () => {
    expect(healthFacts({ lastSuccess: null }, format, messagesEn)).toEqual([
      { key: 'lastSuccess', label: 'Last success', value: 'Never' },
    ])
  })
})

describe('healthIcon', () => {
  it('gives every kind its own icon, and the application’s icon first', () => {
    const icons = HEALTH_KINDS.map((kind) => healthIcon({ kind, label: kind, tone: 'neutral' }))
    expect(new Set(icons).size).toBe(HEALTH_KINDS.length)
    expect(healthIcon({ kind: 'up', label: 'Up', tone: 'success', icon: Plug })).toBe(Plug)
  })
})

describe('HealthList', () => {
  it('shows the state in the application’s words and tone, the figures and the times', () => {
    const html = render(<HealthList label="Connections" items={[SEF]} layout="desktop" />)
    expect(html).toContain('aria-label="Connections"')
    expect(html).toContain('data-tone="danger"')
    expect(html).toContain('>Down<')
    expect(html).toContain('Waiting to send')
    expect(html).toContain('The service did not answer in 30 s.')
    expect(html).toContain('aria-label="Retry: SEF (e-invoicing)"')
  })

  it('draws one card per thing on a phone, with the title above the cards', () => {
    const html = render(
      <HealthList label="Connections" title="Connections" items={[SEF, SEF]} layout="phone" />,
    )
    expect(html.match(/data-slot="health-item"/g)).toHaveLength(2)
    expect(html).toContain('<h2')
  })

  it('shows the application’s words when there is nothing, and its error', () => {
    expect(render(<HealthList label="Nodes" items={[]} emptyText="No nodes yet." />)).toContain(
      'No nodes yet.',
    )
    expect(render(<HealthList label="Nodes" items={[]} />)).toContain(
      'Nothing is monitored here yet.',
    )
    expect(
      render(<HealthList label="Nodes" items={[SEF]} error="The states cannot be loaded." />),
    ).toContain('The states cannot be loaded.')
  })

  it('marks the list busy while loading', () => {
    expect(render(<HealthList label="Nodes" items={[]} loading />)).toContain('aria-busy="true"')
  })
})

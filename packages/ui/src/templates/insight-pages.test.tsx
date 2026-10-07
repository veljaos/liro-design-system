import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { sparklinePoints, StatCard } from '../components/stat-card'
import { LiroProvider } from '../provider/liro-provider'
import { DashboardPage } from './dashboard-page'
import { ReportPage } from './report-page'
import { SettingsPage } from './settings-page'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('sparklinePoints', () => {
  it('places the values in a 96 × 32 box, oldest at the start', () => {
    expect(sparklinePoints(['1', '3'])).toBe('0.0,30.0 96.0,2.0')
    expect(sparklinePoints(['5'])).toBe('')
  })
})

describe('StatCard', () => {
  it('colours a change only when the application says it is good or bad', () => {
    const good = render(
      <StatCard
        label="Revenue"
        value="1"
        change={{ text: '+5 %', direction: 'up', sentiment: 'good' }}
      />,
    )
    expect(good).toContain('text-status-success-fg')
    const neutral = render(
      <StatCard label="Invoices" value="1" change={{ text: '−3 %', direction: 'down' }} />,
    )
    expect(neutral).not.toContain('text-status-')
    expect(render(<StatCard label="X" loading />)).toContain('h-26')
  })
})

describe('DashboardPage', () => {
  it('lays the numbers four to a row from 62em', () => {
    const html = render(
      <DashboardPage
        layout="desktop"
        title="Overview"
        stats={[{ key: 'a', label: 'Revenue', value: '1' }]}
      />,
    )
    expect(html).toContain('md:grid-cols-4')
  })
})

describe('ReportPage', () => {
  it('shows the parameters and "Run report" until the first run', () => {
    const html = render(
      <ReportPage
        layout="desktop"
        title="Account card"
        parameters={<p>FIELDS</p>}
        summary={[{ key: 'p', label: 'Period', value: '01.01.–30.09.2026.' }]}
        onRun={() => undefined}
      >
        <p>RESULT</p>
      </ReportPage>,
    )
    expect(html).toContain('FIELDS')
    expect(html).toContain('Run report')
    expect(html).toContain('RESULT')
  })
  it('shows the one-line summary with "Edit" when the parameters are collapsed', () => {
    const html = render(
      <ReportPage
        layout="desktop"
        title="Account card"
        parametersOpen={false}
        parameters={<p>FIELDS</p>}
        summary={[
          { key: 'p', label: 'Period', value: '01.01.–30.09.2026.' },
          { key: 'a', label: 'Account', value: '2040' },
        ]}
        onRun={() => undefined}
      >
        <p>RESULT</p>
      </ReportPage>,
    )
    expect(html).not.toContain('FIELDS')
    expect(html).toContain('Period: ')
    expect(html).toContain('2040')
    expect(html).toContain('>Edit<')
  })
})

describe('SettingsPage', () => {
  const groups = [
    {
      key: 'g',
      label: 'Invoices',
      sections: [
        {
          key: 's',
          title: 'Sending',
          rows: [
            { key: 'a', label: 'Send to SEF', control: <span>A</span>, state: 'saved' as const },
            {
              key: 'b',
              label: 'Copy by e-mail',
              control: <span>B</span>,
              state: 'error' as const,
              error: 'Could not save.',
            },
          ],
        },
      ],
    },
  ]
  it('shows "Saved" as a status and an error as an alert in the row', () => {
    const html = render(<SettingsPage layout="desktop" title="Sales settings" groups={groups} />)
    expect(html).toMatch(/role="status"[^>]*>.*Saved/)
    expect(html).toMatch(/role="alert"[^>]*>.*Could not save\./)
  })
  it('puts the control under the description on phones, and several groups in tabs', () => {
    expect(render(<SettingsPage layout="phone" title="T" groups={groups} />)).toContain('flex-col')
    const tabs = render(
      <SettingsPage
        layout="desktop"
        title="T"
        groups={[...groups, { ...groups[0], key: 'h', label: 'Payments' } as (typeof groups)[0]]}
      />,
    )
    expect(tabs).toContain('role="tablist"')
  })
})

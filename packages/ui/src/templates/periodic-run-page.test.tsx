import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { countChecks } from './periodic-run-logic'
import { PeriodicRunPage, type RunCheck, type RunStep } from './periodic-run-page'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const STEPS: RunStep[] = [
  { key: 'prepare', label: 'Prepare' },
  { key: 'calculate', label: 'Calculate' },
  { key: 'review', label: 'Review' },
  { key: 'post', label: 'Post' },
  { key: 'send', label: 'Send' },
]

const CHECKS: RunCheck[] = [
  { id: 'a', label: 'All employees calculated', result: 'passed' },
  { id: 'b', label: 'Bank accounts', result: 'passed' },
  { id: 'c', label: 'Overtime', result: 'warning', detail: '2 employees over 8 hours' },
  { id: 'd', label: 'Payslips', result: 'notRun' },
]

describe('countChecks', () => {
  it('counts by result, what needs attention first, leaving out results nobody has', () => {
    expect(countChecks(CHECKS)).toEqual([
      { result: 'warning', count: 1 },
      { result: 'passed', count: 2 },
      { result: 'notRun', count: 1 },
    ])
    expect(countChecks([])).toEqual([])
    expect(countChecks([{ result: 'failed' }, { result: 'failed' }])).toEqual([
      { result: 'failed', count: 2 },
    ])
  })
})

describe('PeriodicRunPage', () => {
  it('shows the steps, the lock state and the checks in words', () => {
    const html = render(
      <PeriodicRunPage
        title="Payroll September 2026"
        steps={STEPS}
        active={2}
        lock={{ state: 'open', detail: 'Opened by Ivana Stojanović' }}
        checks={CHECKS}
        layout="desktop"
      />,
    )
    expect(html).toContain('<h1')
    expect(html).toContain('aria-current="step"')
    expect(html).toContain('Period open')
    expect(html).toContain('Opened by Ivana Stojanović')
    expect(html).toContain('1 warning')
    expect(html).toContain('2 passed')
    expect(html).toContain('>Warning<')
    expect(html).toContain('Not run yet')
  })

  it('on phones writes the step instead of the step list', () => {
    const html = render(
      <PeriodicRunPage
        title="Payroll September 2026"
        steps={STEPS}
        active={2}
        lock={{ state: 'locked' }}
        layout="phone"
      />,
    )
    expect(html).not.toContain('aria-current="step"')
    expect(html.replace(/<[^>]+>/g, '')).toContain('Step 3 of 5 · Review')
    expect(html).toContain('Period locked')
  })

  it('offers a rerun, or says why it is not possible', () => {
    const rerun = {
      title: 'Rerun payroll?',
      confirmLabel: 'Rerun',
      onConfirm: () => undefined,
    }
    expect(
      render(
        <PeriodicRunPage
          title="T"
          steps={STEPS}
          active={2}
          lock={{ state: 'open' }}
          rerun={rerun}
        />,
      ),
    ).toContain('Rerun')
    expect(
      render(
        <PeriodicRunPage
          title="T"
          steps={STEPS}
          active={2}
          lock={{ state: 'locked' }}
          rerun={{ ...rerun, unavailableReason: 'The period is locked' }}
        />,
      ),
    ).toContain('Unavailable: The period is locked')
  })

  it('shows the running step’s progress and the preview', () => {
    const html = render(
      <PeriodicRunPage
        title="T"
        steps={STEPS}
        active={1}
        lock={{ state: 'open' }}
        progress={{ label: 'Calculating payroll', value: 23, max: 46, current: 'Marko Petrović' }}
        preview={{ summary: <p>Totals</p>, table: <table aria-label="Employees" /> }}
      />,
    )
    expect(html).toContain('Calculating payroll')
    expect(html).toContain('23 of 46')
    expect(html).toContain('Marko Petrović')
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('Preview before posting')
    expect(html).toContain('aria-label="Employees"')
  })
})

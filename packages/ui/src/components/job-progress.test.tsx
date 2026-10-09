import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { clampedDone, JobProgress, jobOutcome, type JobProgressProps } from './job-progress'
import { StatusTimeline } from './status-timeline'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={createFormat('sr-Latn-RS')}>
      {node}
    </LiroProvider>,
  )
}

const RUNNING: JobProgressProps = {
  label: 'Sending invoices to SEF',
  state: 'running',
  done: 312,
  total: 1284,
}

describe('clampedDone', () => {
  it('keeps the count inside the total, and is null without one', () => {
    expect(clampedDone(312, 1284)).toBe(312)
    expect(clampedDone(1285, 1284)).toBe(1284)
    expect(clampedDone(-1, 10)).toBe(0)
    expect(clampedDone(5, undefined)).toBeNull()
    expect(clampedDone(5, 0)).toBeNull()
  })
})

describe('jobOutcome', () => {
  it('chooses the report by state and failures', () => {
    expect(jobOutcome('running', 3)).toBe('running')
    expect(jobOutcome('finished', 0)).toBe('success')
    expect(jobOutcome('finished', 14)).toBe('partial')
    expect(jobOutcome('cancelled', 0)).toBe('cancelled')
    expect(jobOutcome('cancelled', 2)).toBe('cancelled')
  })
})

describe('JobProgress', () => {
  it('writes the count through the provider and offers Cancel while running', () => {
    const html = render(
      <JobProgress {...RUNNING} onCancel={() => undefined} current="F-2026-0412" />,
    )
    expect(html).toContain('312 of 1.284')
    expect(html).toContain('F-2026-0412')
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('>Cancel<')
    expect(render(<JobProgress {...RUNNING} onCancel={() => undefined} cancelling />)).toContain(
      'Cancelling…',
    )
  })

  it('shows a spinner while the total is not known', () => {
    const html = render(<JobProgress label={RUNNING.label} state="running" done={0} />)
    expect(html).not.toContain('role="progressbar"')
    expect(html).toContain('Sending invoices to SEF')
  })

  it('reports the outcome lines, the failures and the actions when finished', () => {
    const html = render(
      <JobProgress
        {...RUNNING}
        state="finished"
        done={1284}
        outcomes={[
          { key: 'sent', text: '1.270 invoices sent', tone: 'success' },
          { key: 'failed', text: '14 not sent', tone: 'danger' },
        ]}
        failures={[
          { key: 'a', label: 'F-2026-0398', reason: 'The buyer is not registered in SEF.' },
        ]}
        actions={<button type="button">Retry failed</button>}
        onCancel={() => undefined}
      />,
    )
    expect(html).toContain('Finished')
    expect(html).toContain('1.270 invoices sent')
    expect(html).toContain('Not done')
    expect(html).toContain('The buyer is not registered in SEF.')
    expect(html).toContain('Retry failed')
    expect(html).not.toContain('>Cancel<')
    expect(html).not.toContain('312 of')
  })
})

describe('StatusTimeline', () => {
  it('marks reached, current, later and failed states, and puts the next step under the current', () => {
    const html = render(
      <StatusTimeline
        label="Delivery to SEF"
        current={1}
        steps={[
          { key: 'p', label: 'Prepared', at: '2026-10-06T09:12:00+02:00' },
          { key: 's', label: 'Sent' },
          { key: 'd', label: 'Delivered' },
        ]}
        next={{ title: 'Delivery pending — action needed', tone: 'warning' }}
      />,
    )
    expect(html).toContain('aria-label="Delivery to SEF"')
    expect(html).toMatch(/data-state="completed"[^>]*>/)
    expect(html).toMatch(/data-state="current"[^>]*aria-current="step"/)
    expect(html).toContain('data-state="future"')
    expect(html).toContain('Completed')
    expect(html).toContain('Next step: </span>Delivery pending — action needed')
    expect(html).toContain('dateTime="2026-10-06T09:12:00+02:00"')
    // The next step sits inside the current state's item, before the later ones.
    expect(html.indexOf('Delivery pending')).toBeLessThan(html.indexOf('Delivered'))
    const failed = render(
      <StatusTimeline
        label="Delivery"
        current={1}
        steps={[
          { key: 'p', label: 'Prepared' },
          { key: 'r', label: 'Rejected by SEF', error: 'The buyer’s PIB is unknown.' },
        ]}
      />,
    )
    expect(failed).toContain('data-state="error"')
    expect(failed).toContain('The buyer’s PIB is unknown.')
    expect(failed).toContain('Failed')
  })
})

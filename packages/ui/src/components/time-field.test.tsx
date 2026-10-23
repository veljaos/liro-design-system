import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { TimeField, type TimeFieldProps } from './time-field'

const render = (props: TimeFieldProps) =>
  renderToStaticMarkup(
    <LiroProvider locale="en">
      <TimeField {...props} />
    </LiroProvider>,
  )

describe('TimeField', () => {
  it('shows the value as HH:MM, left to right, with the number pad on phones', () => {
    const html = render({ label: 'Start', defaultValue: '06:30', name: 'start' })
    expect(html).toContain('value="06:30"')
    expect(html).toContain('dir="ltr"')
    expect(html).toContain('inputMode="decimal"')
    expect(html).toContain('type="hidden" name="start" value="06:30"')
  })

  it("shows the application's error and the read-only value", () => {
    expect(render({ label: 'End', error: 'Before the start' })).toContain('Before the start')
    expect(render({ label: 'End', readOnly: true, defaultValue: '14:30' })).toContain('readOnly')
  })
})

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { ProgressBar, Stepper, stepState } from './progress'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('stepState', () => {
  it('completes the steps before the active one', () => {
    expect([0, 1, 2].map((index) => stepState(index, 1))).toEqual([
      'completed',
      'current',
      'upcoming',
    ])
    expect(stepState(2, 3)).toBe('completed')
  })
})

describe('Stepper', () => {
  const steps = [{ label: 'Company' }, { label: 'Users' }, { label: 'Done' }]

  it('marks the current step and tells that earlier ones are completed', () => {
    const html = render(<Stepper steps={steps} active={1} />)
    expect(html).toContain('aria-current="step"')
    expect(html).toContain('>Completed</span>')
    expect(html).not.toContain('<button')
  })

  it('turns steps into buttons with onStepClick', () => {
    expect(render(<Stepper steps={steps} active={1} onStepClick={() => undefined} />)).toContain(
      '<button',
    )
  })
})

describe('ProgressBar', () => {
  it('is a named progressbar, 5px and fully rounded', () => {
    const html = render(<ProgressBar label="Import" value={40} />)
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('aria-label="Import"')
    expect(html).toContain('h-[5px]')
    expect(html).toContain('rounded-full')
    expect(html).toContain('inline-size:40%')
  })
})

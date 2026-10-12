import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { compactStep, ProgressBar, Stepper, stepState } from './progress'

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

  it('is one line over a thin bar on phones, never a row of steps', () => {
    const html = render(
      <Stepper steps={steps} active={1} layout="phone" onStepClick={() => undefined} />,
    )
    expect(html.replace(/<[^>]+>/g, '')).toContain('Step 2 of 3 · Users')
    expect(html).not.toContain('<ol')
    expect(html).not.toContain('<button')
    // The bar is filled to the current step and hidden: the line says it.
    expect(html).toMatch(/aria-hidden="true"[^>]*><div[^>]*role="progressbar"/)
    expect(html).toContain('aria-valuenow="2"')
  })
})

describe('compactStep', () => {
  it('names the current step, the last when all are completed', () => {
    expect(compactStep(0, 4)).toBe(1)
    expect(compactStep(2, 4)).toBe(3)
    expect(compactStep(4, 4)).toBe(4)
    expect(compactStep(0, 0)).toBe(1)
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

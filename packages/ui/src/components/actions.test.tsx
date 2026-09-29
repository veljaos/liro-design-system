import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { visibleActions } from './action-logic'
import { ActionGroup, UnavailableAction } from './actions'

describe('visibleActions', () => {
  it('shows every action when they fit', () => {
    expect(visibleActions([80, 90, 100], 36, 8, 400)).toBe(3)
    expect(visibleActions([80, 90, 100], 36, 8, 286)).toBe(3)
  })

  it('keeps the main (last) action and as many before it as fit beside "More"', () => {
    // 100 + 8 + 36 = 144; + 90 + 8 = 242 fits in 250; + 80 + 8 does not.
    expect(visibleActions([80, 90, 100], 36, 8, 250)).toBe(2)
    expect(visibleActions([80, 90, 100], 36, 8, 150)).toBe(1)
  })

  it('never hides the main action, even when nothing fits', () => {
    expect(visibleActions([80, 90, 100], 36, 8, 10)).toBe(1)
    expect(visibleActions([], 36, 8, 10)).toBe(0)
  })
})

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('UnavailableAction', () => {
  it('is focusable but aria-disabled, with its reason in words and linked', () => {
    const html = render(
      <UnavailableAction intent="delete" label="Delete" reason="The period is closed" />,
    )
    expect(html).toMatch(/<button[^>]*aria-disabled="true"/)
    expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
    expect(html).toContain('Unavailable: The period is closed')
    const id = /aria-describedby="([^"]+)"/.exec(html)?.[1]
    expect(html).toContain(`id="${String(id)}"`)
  })
})

describe('ActionGroup', () => {
  it('lays the actions out in order, the main one last, at the end by default', () => {
    const html = render(
      <ActionGroup
        actions={[
          { key: 'c', intent: 'cancel', label: 'Cancel' },
          { key: 's', intent: 'save', label: 'Save' },
        ]}
      />,
    )
    expect(html).toContain('justify-end')
    const visible = html.slice(html.lastIndexOf('inert'))
    expect(visible.indexOf('Cancel')).toBeLessThan(visible.indexOf('Save'))
  })
})

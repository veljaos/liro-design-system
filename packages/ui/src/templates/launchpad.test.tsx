import { Receipt } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { Launchpad } from './launchpad'
import {
  dropModule,
  launchpadArrowTarget,
  launchpadDigitTarget,
  moveModule,
} from './launchpad-logic'

describe('launchpadArrowTarget', () => {
  it('moves in reading order: right is forward in ltr, backward in rtl', () => {
    expect(launchpadArrowTarget('ArrowRight', 1, 7, 3, 'ltr')).toBe(2)
    expect(launchpadArrowTarget('ArrowLeft', 1, 7, 3, 'ltr')).toBe(0)
    expect(launchpadArrowTarget('ArrowRight', 1, 7, 3, 'rtl')).toBe(0)
    expect(launchpadArrowTarget('ArrowLeft', 1, 7, 3, 'rtl')).toBe(2)
  })
  it('moves by a row up and down, and stops at the edges', () => {
    expect(launchpadArrowTarget('ArrowDown', 1, 7, 3, 'ltr')).toBe(4)
    expect(launchpadArrowTarget('ArrowUp', 4, 7, 3, 'ltr')).toBe(1)
    expect(launchpadArrowTarget('ArrowDown', 5, 7, 3, 'ltr')).toBeNull()
    expect(launchpadArrowTarget('ArrowUp', 1, 7, 3, 'ltr')).toBeNull()
    expect(launchpadArrowTarget('ArrowRight', 6, 7, 3, 'ltr')).toBeNull()
    expect(launchpadArrowTarget('ArrowLeft', 0, 7, 3, 'ltr')).toBeNull()
  })
  it('goes to the first and last card with Home and End, and ignores other keys', () => {
    expect(launchpadArrowTarget('Home', 4, 7, 3, 'ltr')).toBe(0)
    expect(launchpadArrowTarget('End', 0, 7, 3, 'rtl')).toBe(6)
    expect(launchpadArrowTarget('Enter', 0, 7, 3, 'ltr')).toBeNull()
  })
})

describe('launchpadDigitTarget', () => {
  it('opens the first nine modules with 1–9', () => {
    expect(launchpadDigitTarget('1', 12)).toBe(0)
    expect(launchpadDigitTarget('9', 12)).toBe(8)
    expect(launchpadDigitTarget('5', 4)).toBeNull()
    expect(launchpadDigitTarget('0', 12)).toBeNull()
    expect(launchpadDigitTarget('a', 12)).toBeNull()
  })
})

describe('moveModule and dropModule', () => {
  const ids = ['sales', 'purchasing', 'accounting', 'hr']
  it('moves one place, never past an end', () => {
    expect(moveModule(ids, 'accounting', -1)).toEqual(['sales', 'accounting', 'purchasing', 'hr'])
    expect(moveModule(ids, 'sales', 1)).toEqual(['purchasing', 'sales', 'accounting', 'hr'])
    expect(moveModule(ids, 'sales', -1)).toEqual(ids)
    expect(moveModule(ids, 'hr', 1)).toEqual(ids)
  })
  it('drops onto the place of another card', () => {
    expect(dropModule(ids, 'hr', 'sales')).toEqual(['hr', 'sales', 'purchasing', 'accounting'])
    expect(dropModule(ids, 'sales', 'accounting')).toEqual([
      'purchasing',
      'accounting',
      'sales',
      'hr',
    ])
    expect(dropModule(ids, 'sales', 'sales')).toEqual(ids)
  })
})

const MODULES = [
  { id: 's', name: 'Sales', icon: Receipt, href: '/sales', counter: '3 waiting' },
  { id: 'f', name: 'Fixed assets', icon: Receipt, href: '/fa', locked: 'Available in Pro' },
]

function render(props: Partial<Parameters<typeof Launchpad>[0]>) {
  return renderToStaticMarkup(
    <LiroProvider locale="en">
      <Launchpad label="Modules" modules={MODULES} {...props} />
    </LiroProvider>,
  )
}

describe('Launchpad', () => {
  it('links open modules with their shortcut; a locked one is not a link', () => {
    const html = render({})
    expect(html).toContain('href="/sales"')
    expect(html).toContain('aria-keyshortcuts="1"')
    expect(html).not.toContain('href="/fa"')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('Available in Pro')
    expect(html).toContain('3 waiting')
  })
  it('in editing mode: buttons instead of links, and the hidden list', () => {
    const html = render({
      editing: true,
      hidden: [{ id: 'h', name: 'Payroll', icon: Receipt, href: '/payroll' }],
    })
    expect(html).not.toContain('href="/sales"')
    expect(html).toContain('aria-label="Move earlier: Sales"')
    expect(html).toContain('aria-label="Hide: Sales"')
    expect(html).toContain('Hidden (1)')
    expect(html).toContain('aria-label="Show: Payroll"')
  })
  it('shows skeleton cards while loading', () => {
    const html = render({ loading: true, skeletonCount: 4 })
    expect(html).toContain('aria-busy="true"')
    expect(html.match(/h-33/g)).toHaveLength(4)
  })
})

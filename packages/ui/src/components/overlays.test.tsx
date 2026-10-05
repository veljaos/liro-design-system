import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { Button } from './button'
import { Dialog } from './dialog'
import { DropdownMenu } from './dropdown-menu'
import { physicalSide, Popover, Tooltip } from './popover'

describe('physicalSide', () => {
  it('puts start and end on the leading and trailing side of the direction', () => {
    expect(physicalSide('start', 'ltr')).toBe('left')
    expect(physicalSide('end', 'ltr')).toBe('right')
    expect(physicalSide('start', 'rtl')).toBe('right')
    expect(physicalSide('end', 'rtl')).toBe('left')
    expect(physicalSide('top', 'rtl')).toBe('top')
  })
})

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('overlay triggers', () => {
  it('get the attributes Radix gives a trigger through Button (asChild)', () => {
    const html = render(<Dialog trigger={<Button intent="edit" label="Edit" />} title="Edit" />)
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*data-state="closed"/)
    expect(html).toContain('data-intent="edit"')
  })

  it('turn their trigger into the opener of a dialog or a menu', () => {
    const trigger = <Button intent="edit" label="Edit" />
    expect(render(<Dialog trigger={trigger} title="Edit" />)).toContain('aria-haspopup="dialog"')
    expect(render(<Popover trigger={trigger}>x</Popover>)).toContain('aria-haspopup="dialog"')
    expect(
      render(
        <DropdownMenu trigger={trigger} entries={[{ label: 'A', onSelect: () => undefined }]} />,
      ),
    ).toContain('aria-haspopup="menu"')
  })

  it('leaves the tooltip target and its own name alone until it opens', () => {
    const html = render(
      <Tooltip label="Opens the settings">
        <Button intent="settings" label="Settings" />
      </Tooltip>,
    )
    expect(html).toContain('<span class="bidi-content">Settings</span>')
    expect(html).not.toContain('Opens the settings')
  })
})

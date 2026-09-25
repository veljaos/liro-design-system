import { Star } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button, CompactIconButton, IconButton } from './button'
import { INTENT_NAMES, INTENTS } from './intents'

describe('Button', () => {
  it('takes family, emphasis and icon from the intent; the label from the application', () => {
    const html = renderToStaticMarkup(<Button intent="delete" label="Delete row" />)
    expect(html).toContain('data-family="destructive"')
    expect(html).toContain('data-emphasis="menu"')
    expect(html).toContain('data-intent="delete"')
    expect(html).toContain('data-confirms="true"')
    expect(html).toContain('text-family-destructive-fg')
    expect(html).toContain('<span>Delete row</span>')
    expect(html).toMatch(/<svg[^>]*lucide-trash[^>]*aria-hidden="true"/)
  })

  it('lets emphasis raise or lower the weight', () => {
    const html = renderToStaticMarkup(<Button intent="delete" label="Delete" emphasis="primary" />)
    expect(html).toContain('data-emphasis="primary"')
    expect(html).toContain('bg-family-destructive-solid text-on-accent')
  })

  it('takes a family and an icon for any other action, secondary by default', () => {
    const html = renderToStaticMarkup(<Button family="verify" icon={Star} label="Sign" />)
    expect(html).toContain('data-family="verify"')
    expect(html).toContain('data-emphasis="secondary"')
    expect(html).toContain('bg-family-verify-subtle')
    expect(html).not.toContain('data-intent')
    expect(html).toMatch(/lucide-star/)
  })

  it('draws the neutral secondary as "default": raised surface with a border', () => {
    const html = renderToStaticMarkup(<Button intent="cancel" label="Cancel" />)
    expect(html).toContain('border-default bg-surface-raised text-family-neutral-fg')
    expect(html).not.toMatch(/[\s"]border-transparent[\s"]/)
    expect(renderToStaticMarkup(<Button intent="edit" label="Edit" emphasis="menu" />)).toContain(
      'border-transparent',
    )
  })

  it('mirrors direction arrows in right-to-left only', () => {
    expect(renderToStaticMarkup(<Button intent="back" label="Back" />)).toContain(
      'rtl:-scale-x-100',
    )
    expect(renderToStaticMarkup(<Button intent="next" label="Next" />)).toContain(
      'rtl:-scale-x-100',
    )
    expect(renderToStaticMarkup(<Button intent="save" label="Save" />)).not.toContain('rtl:')
  })

  it("has the previous system's Mantine 'sm' size: 36px, 13px, radius md, 12/18px padding, 10px gap", () => {
    const html = renderToStaticMarkup(<Button intent="save" label="Save" />)
    expect(html).toContain('size-3.75 shrink-0')
    for (const part of [
      'h-control',
      'text-sm',
      'rounded-md',
      'font-semibold',
      'leading-none',
      'ps-3',
      'pe-4.5',
      'gap-2.5',
    ]) {
      expect(html).toContain(` ${part} `)
    }
  })

  it('passes type, disabled and onClick to the element', () => {
    const html = renderToStaticMarkup(
      <Button intent="save" label="Save" type="submit" disabled onClick={() => undefined} />,
    )
    expect(html).toContain('type="submit"')
    expect(html).toContain('disabled=""')
    expect(html).toContain('disabled:bg-surface-disabled')
  })

  it('rejects a colour or a variant, and a family without an icon, at compile time', () => {
    // Never called: the type checker reads these lines, the test only proves they exist.
    const wrong = () => [
      // @ts-expect-error -- a Button chooses an intent or a family, never a colour.
      <Button key="colour" intent="save" label="Save" color="red" />,
      // @ts-expect-error -- a family needs an icon.
      <Button key="icon" family="positive" label="Approve" />,
      // @ts-expect-error -- intent and family together are ambiguous.
      <Button key="both" intent="save" family="positive" icon={Star} label="Save" />,
    ]
    expect(typeof wrong).toBe('function')
  })

  it('knows every interface intent of Appendix A.6', () => {
    expect(INTENT_NAMES).toHaveLength(20)
    expect(INTENTS.pdf).toMatchObject({ family: 'document', emphasis: 'primary', confirms: false })
    expect(INTENTS.export.family).toBe('positive')
    expect(INTENT_NAMES.filter((name) => INTENTS[name].confirms)).toEqual(['delete'])
  })
})

describe('IconButton', () => {
  it('is the 36px button without visible text: 8px padding, 16px icon, label as its name', () => {
    const html = renderToStaticMarkup(<IconButton intent="more" label="More actions" />)
    expect(html).toContain('aria-label="More actions"')
    expect(html).toContain('title="More actions"')
    expect(html).not.toContain('<span>')
    expect(html).toContain(' h-control px-2 ')
    expect(html).toContain('size-4 shrink-0')
  })

  it("keeps the intent's or family's emphasis, like Button", () => {
    expect(renderToStaticMarkup(<IconButton intent="save" label="Save" />)).toContain(
      'data-emphasis="primary"',
    )
    const family = renderToStaticMarkup(<IconButton family="verify" icon={Star} label="Sign" />)
    expect(family).toContain('data-emphasis="secondary"')
  })
})

describe('CompactIconButton', () => {
  it("is Mantine's 28px ActionIcon, for tight places", () => {
    const html = renderToStaticMarkup(<CompactIconButton intent="more" label="Row actions" />)
    expect(html).toContain('size-7 p-0')
    expect(html).toContain('aria-label="Row actions"')
  })

  it('defaults to the neutral family and subtle (menu) emphasis', () => {
    const withIcon = renderToStaticMarkup(<CompactIconButton icon={Star} label="Favourite" />)
    expect(withIcon).toContain('data-family="neutral"')
    expect(withIcon).toContain('data-emphasis="menu"')
    const withIntent = renderToStaticMarkup(<CompactIconButton intent="save" label="Save" />)
    expect(withIntent).toContain('data-family="primary"')
    expect(withIntent).toContain('data-emphasis="menu"')
    const raised = renderToStaticMarkup(
      <CompactIconButton intent="save" label="Save" emphasis="primary" />,
    )
    expect(raised).toContain('data-emphasis="primary"')
  })
})

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { Button } from './button'
import { ConfirmDialog, confirmTone, DeleteConfirmDialog } from './confirm-dialog'
import { FAMILY_NAMES } from './intents'

describe('confirmTone', () => {
  it("takes the tone from the action's family (the old ConfirmModal's map)", () => {
    const tones = Object.fromEntries(
      FAMILY_NAMES.map((family) => [family, confirmTone(undefined, family)]),
    )
    expect(tones).toEqual({
      primary: 'info',
      verify: 'info',
      document: 'neutral',
      positive: 'success',
      destructive: 'danger',
      caution: 'warning',
      neutral: 'neutral',
    })
  })

  it('is warning without a family, and the tone prop wins', () => {
    expect(confirmTone(undefined, undefined)).toBe('warning')
    expect(confirmTone('premium', 'destructive')).toBe('premium')
  })
})

describe('confirm dialog triggers and messages', () => {
  it('turns the action button into the opener of the dialog', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="en">
        <ConfirmDialog
          trigger={<Button intent="delete" label="Delete" />}
          intent="delete"
          title="Delete invoice F-114?"
          confirmLabel="Delete"
          onConfirm={() => undefined}
        />
      </LiroProvider>,
    )
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('data-confirms="true"')
  })

  it('has English defaults for the delete preset', () => {
    expect(messagesEn['confirm.deleteTitle']).toBe('Delete this item?')
    expect(messagesEn['confirm.deleteLabel']).toBe('Delete')
    expect(messagesEn['confirm.typeToConfirm']('F-114')).toBe('Type F-114 to confirm')
    expect(
      renderToStaticMarkup(
        <LiroProvider locale="en">
          <DeleteConfirmDialog
            trigger={<Button intent="delete" label="Delete" />}
            onConfirm={() => undefined}
          />
        </LiroProvider>,
      ),
    ).toContain('aria-haspopup="dialog"')
  })
})

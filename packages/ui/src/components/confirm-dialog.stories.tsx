import type { Meta, StoryObj } from '@storybook/react-vite'
import { Send } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { ConfirmDialog, DeleteConfirmDialog, IrreversibleConfirmDialog } from './confirm-dialog'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Overlays/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** asking before an action that needs a second thought — delete, send, ' +
          "post, void. The previous Design System's ConfirmModal: an icon and the question in " +
          "the tone's colour, the text, then Cancel and the confirm button filled in the " +
          "action's family colour (main action last). The tone follows the `intent` or " +
          '`family` (destructive → danger, positive → success, caution → warning, primary and ' +
          'verify → info, document and neutral → neutral; warning without one); `tone` ' +
          'overrides it. When `onConfirm` returns a promise, the button shows a loader, Cancel ' +
          'is disabled and nothing closes the dialog until it settles. `DeleteConfirmDialog` ' +
          'has the delete texts from the provider; `IrreversibleConfirmDialog` enables its ' +
          'button only when the user types `confirmText`.\n\n' +
          '**When not:** an action that can be undone (just do it, and offer undo); a bulk ' +
          'action asks once, with the count, not per item (Appendix B.8).',
      },
    },
  },
  args: { title: '', confirmLabel: '', onConfirm: () => undefined },
  play: settle,
} satisfies Meta<typeof ConfirmDialog>

export default meta

type Story = StoryObj<typeof meta>

/** The delete preset from its button; Escape closes it and the focus returns. */
export const Delete: Story = {
  render: () => (
    <DeleteConfirmDialog
      trigger={<Button intent="delete" label="Delete" />}
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = body.getByRole('button', { name: 'Delete' })
    await userEvent.click(trigger)
    await body.findByRole('alertdialog', { name: 'Delete this item?' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(trigger)
    await body.findByRole('alertdialog')
    await settle()
  },
}

/** A positive action (approve): the success tone and a filled green button. */
export const Positive: Story = {
  render: () => (
    <ConfirmDialog
      defaultOpen
      family="positive"
      actionIcon={Send}
      title="Approve 12 invoices?"
      message="They are sent to the customers today."
      confirmLabel="Approve and send"
      onConfirm={() => undefined}
    />
  ),
}

/** No intent or family: the warning tone. */
export const WithoutAction: Story = {
  name: 'Without an action (warning)',
  render: () => (
    <ConfirmDialog
      defaultOpen
      title="Leave without saving?"
      message="Your changes to this invoice are lost."
      confirmLabel="Leave"
      onConfirm={() => undefined}
    />
  ),
}

/** While confirming: a loader, Cancel disabled, Escape does not close it. */
export const Loading: Story = {
  render: () => (
    <ConfirmDialog
      defaultOpen
      intent="delete"
      title="Delete invoice F-114?"
      message="The invoice and its lines are deleted."
      confirmLabel="Delete"
      onConfirm={() => new Promise<void>(() => undefined)}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('alertdialog')
    await settle()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await expect(within(dialog).getByRole('button', { name: 'Delete' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await expect(body.getByRole('alertdialog')).toBeVisible()
    await expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull()
  },
}

/** Irreversible: the button enables only when the number is typed. */
export const Irreversible: Story = {
  render: () => (
    <IrreversibleConfirmDialog
      defaultOpen
      family="caution"
      actionIcon={Send}
      title="Void invoice F-114?"
      message="A voided invoice cannot be restored; its number is not reused."
      confirmLabel="Void the invoice"
      confirmText="F-114"
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('alertdialog')
    await settle()
    const button = within(dialog).getByRole('button', { name: 'Void the invoice' })
    await expect(button).toBeDisabled()
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Type F-114 to confirm' }),
      'F-114',
    )
    await expect(button).toBeEnabled()
  },
}

/** Long question and text at phone width (a 390px frame): the buttons wrap. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <ConfirmDialog
        defaultOpen
        intent="delete"
        title={LONG.label}
        message={LONG.description}
        confirmLabel={LONG.label}
        onConfirm={() => undefined}
      />
    </PhoneFrame>
  ),
}

/** Arabic sample text, right to left: the buttons at the end (left), the main action last. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ConfirmDialog
        defaultOpen
        intent="delete"
        title={ARABIC.label}
        message={ARABIC.description}
        confirmLabel={ARABIC.reason}
        cancelLabel={ARABIC.options[0] ?? ''}
        onConfirm={() => undefined}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ConfirmDialog
        defaultOpen
        intent="delete"
        title={JAPANESE.label}
        message={JAPANESE.description}
        confirmLabel={JAPANESE.reason}
        cancelLabel={JAPANESE.options[0] ?? ''}
        onConfirm={() => undefined}
      />
    </StoryProvider>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ban, BookCheck, CheckCheck, CircleX } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { KeyValueList } from './cards'
import {
  ConfirmDialog,
  DeleteConfirmDialog,
  IrreversibleConfirmDialog,
  ReasonConfirmDialog,
} from './confirm-dialog'
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
          'overrides it. Colours never mix: without an action, or when `tone` overrides the ' +
          "action's, the button takes the tone's family (warning → caution, danger → " +
          'destructive, info → primary, success → positive, neutral → neutral). When `onConfirm` returns a promise, the button shows a loader, Cancel ' +
          'is disabled and nothing closes the dialog until it settles. `DeleteConfirmDialog` ' +
          'has the delete texts from the provider; `IrreversibleConfirmDialog` enables its ' +
          'button only when the user types `confirmText`; with `reason` (P5.18, a cancellation) ' +
          'the same dialog also asks why — a required text, or a choice from `reason.reasons` ' +
          'with optional details — and `onConfirm` receives the answer: one dialog, never two ' +
          'in a row.\n\n' +
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

/**
 * The safe action takes the focus (P4.9d): in every confirmation Cancel is focused when the
 * dialog opens, so a single Enter closes it and never deletes, rejects or discards.
 */
export const SafeInitialFocus: Story = {
  name: 'Initial focus on Cancel',
  render: () => {
    const confirmed: string[] = []
    return (
      <div className="flex flex-wrap gap-2">
        <DeleteConfirmDialog
          trigger={<Button intent="delete" label="Delete" />}
          onConfirm={() => {
            confirmed.push('delete')
            document.body.dataset.confirmed = confirmed.join(',')
          }}
        />
        <ReasonConfirmDialog
          trigger={<Button family="destructive" icon={CircleX} label="Reject" />}
          family="destructive"
          actionIcon={CircleX}
          title="Reject UF-2026-1187?"
          confirmLabel="Reject"
          reasons={[{ value: 'price', label: 'Price differs from the order' }]}
          onConfirm={() => {
            confirmed.push('reject')
            document.body.dataset.confirmed = confirmed.join(',')
          }}
        />
        <IrreversibleConfirmDialog
          trigger={<Button family="caution" icon={Ban} label="Void" />}
          family="caution"
          actionIcon={Ban}
          title="Void F-2026-0412?"
          confirmLabel="Void"
          confirmText="F-2026-0412"
          onConfirm={() => {
            confirmed.push('void')
            document.body.dataset.confirmed = confirmed.join(',')
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    delete document.body.dataset.confirmed
    for (const name of ['Delete', 'Reject', 'Void']) {
      await userEvent.click(within(canvasElement).getByRole('button', { name }))
      const dialog = await body.findByRole('alertdialog')
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus(),
      )
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    }
    await expect(document.body.dataset.confirmed).toBeUndefined()
    await settle()
  },
}

/** A positive action (approve): the success tone and a filled green button. */
export const Positive: Story = {
  render: () => (
    <ConfirmDialog
      defaultOpen
      family="positive"
      actionIcon={CheckCheck}
      title="Approve 12 invoices?"
      message="They are sent to the customers today."
      confirmLabel="Approve and send"
      onConfirm={() => undefined}
    />
  ),
}

/** No intent or family: the warning tone, and the button in the caution family (orange). */
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

/** `tone` overrides the action's: the button follows the tone (danger → destructive). */
export const ToneOverride: Story = {
  name: 'Tone overrides the action',
  render: () => (
    <ConfirmDialog
      defaultOpen
      intent="save"
      tone="danger"
      title="Save over the signed version?"
      message="The signed version is replaced and its signature is removed."
      confirmLabel="Save anyway"
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
      actionIcon={Ban}
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

/** Reject with a written reason: the button enables once a reason is written. */
export const Reason: Story = {
  render: () => (
    <ReasonConfirmDialog
      defaultOpen
      family="destructive"
      actionIcon={CircleX}
      title="Reject UF-2026-1187?"
      message="EPS Snabdevanje d.o.o. is told the reason through SEF."
      reasonLabel="Reason for rejection"
      confirmLabel="Reject"
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('alertdialog')
    await settle()
    const button = within(dialog).getByRole('button', { name: 'Reject' })
    await expect(button).toBeDisabled()
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Reason for rejection/ }),
      'Wrong quantity on line 2',
    )
    await expect(button).toBeEnabled()
  },
}

/** Reject with a reason from the Core's list and optional details. */
export const ReasonList: Story = {
  name: 'Reason from a list',
  render: () => (
    <ReasonConfirmDialog
      defaultOpen
      family="destructive"
      actionIcon={CircleX}
      title="Reject UF-2026-1187?"
      reasonLabel="Reason for rejection"
      reasons={[
        { value: 'price', label: 'Price differs from the order' },
        { value: 'quantity', label: 'Quantity differs from the delivery' },
        { value: 'duplicate', label: 'Invoice already received' },
        { value: 'other', label: 'Other' },
      ]}
      confirmLabel="Reject"
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('alertdialog')
    await settle()
    const button = within(dialog).getByRole('button', { name: 'Reject' })
    await expect(button).toBeDisabled()
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'Quantity differs from the delivery' }),
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

// ── P5 group D2: a cancellation asks why and for the number, in one dialog (P5.18) ──────────

/**
 * Cancelling an issued invoice: one dialog asks for the reason (required) and the typed number;
 * the button enables once both are given, and `onConfirm` receives the reason.
 */
export const IrreversibleWithReason: Story = {
  name: 'Irreversible with a reason',
  render: () => (
    <IrreversibleConfirmDialog
      trigger={<Button family="caution" icon={Ban} label="Cancel invoice" />}
      family="caution"
      actionIcon={Ban}
      title="Cancel invoice F-2026-0407?"
      message="A cancellation document is issued and sent to SEF. This cannot be undone."
      confirmLabel="Cancel invoice"
      confirmText="F-2026-0407"
      cancelLabel="Keep invoice"
      reason={{ label: 'Reason for the cancellation' }}
      onConfirm={(answer) => {
        document.body.dataset.cancelReason = answer.text
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Cancel invoice' }))
    const dialog = within(await body.findByRole('alertdialog'))
    await settle()
    // The safe action takes the focus.
    await expect(dialog.getByRole('button', { name: 'Keep invoice' })).toHaveFocus()
    const confirm = dialog.getByRole('button', { name: 'Cancel invoice' })
    await userEvent.type(dialog.getByRole('textbox', { name: /^Type F-2026-0407/ }), 'F-2026-0407')
    // The number alone is not enough: the reason is required.
    await expect(confirm).toBeDisabled()
    await userEvent.type(
      dialog.getByRole('textbox', { name: /Reason for the cancellation/ }),
      'Wrong prices.',
    )
    await expect(confirm).toBeEnabled()
    await userEvent.click(confirm)
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    await expect(document.body.dataset.cancelReason).toBe('Wrong prices.')
    delete document.body.dataset.cancelReason
    // Opened again for the picture: everything empty.
    await userEvent.click(body.getByRole('button', { name: 'Cancel invoice' }))
    await body.findByRole('alertdialog')
    await settle()
  },
}

/** With the Core's list of reasons: one must be chosen, the details are optional. */
export const IrreversibleWithReasons: Story = {
  name: 'Irreversible with a list of reasons',
  render: () => (
    <IrreversibleConfirmDialog
      defaultOpen
      family="caution"
      actionIcon={Ban}
      title="Cancel invoice F-2026-0407?"
      message="A cancellation document is issued and sent to SEF."
      confirmLabel="Cancel invoice"
      confirmText="F-2026-0407"
      reason={{
        reasons: [
          { value: 'price', label: 'Wrong prices' },
          { value: 'customer', label: 'Wrong customer' },
          { value: 'duplicate', label: 'Issued twice' },
        ],
        label: 'Reason',
        detailsLabel: 'Details for the cancellation document',
      }}
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = within(await body.findByRole('alertdialog'))
    await settle()
    await userEvent.type(dialog.getByRole('textbox', { name: /^Type F-2026-0407/ }), 'F-2026-0407')
    const confirm = dialog.getByRole('button', { name: 'Cancel invoice' })
    await expect(confirm).toBeDisabled()
    await userEvent.click(dialog.getByRole('radio', { name: 'Wrong prices' }))
    await expect(confirm).toBeEnabled()
  },
}

/**
 * `preview` shows what the action will do before it is confirmed — a summary and a read-only
 * result — and `size` 'wide' gives it room. Cancel still takes the focus.
 */
export const WithPreview: Story = {
  name: 'With a preview',
  render: () => (
    <ConfirmDialog
      defaultOpen
      family="primary"
      actionIcon={BookCheck}
      tone="info"
      size="wide"
      title="Post statement 188?"
      message="The journal entry is posted and the open items are closed."
      preview={
        <KeyValueList
          columns={1}
          items={[
            { label: 'Close open items', value: '4 lines, 4 items' },
            { label: 'Posted to accounts', value: '6 lines' },
            { label: 'Money in', value: '291.566,40 RSD', numeric: true },
            { label: 'Money out', value: '4.180.462,00 RSD', numeric: true },
          ]}
        />
      }
      confirmLabel="Post statement"
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('alertdialog', { name: 'Post statement 188?' })
    await expect(dialog).toHaveTextContent('4 lines, 4 items')
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await expect(dialog.getBoundingClientRect().width).toBeGreaterThan(440)
    await settle()
  },
}

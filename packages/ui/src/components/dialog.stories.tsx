import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { Dialog } from './dialog'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const meta = {
  title: 'Components/Overlays/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one action with one outcome, or a read-only view (Appendix B.8): ' +
          'rename, a short confirmation of details, a preview. Title, optional description, ' +
          'content and actions at the end with the main action last. The focus stays inside ' +
          'while it is open and returns to the trigger; Escape, a press outside and the close ' +
          'button close it, unless `dismissible` is false (while an action runs).\n\n' +
          '**When not:** a short edit with the list still visible (Drawer); anything with more ' +
          'than about ten fields, tabs or attachments (a full page); asking before a ' +
          'destructive action (ConfirmDialog).',
      },
    },
  },
  args: { title: 'Rename the report' },
  play: settle,
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

/** Open from a button; Escape closes it and the focus returns to the button. */
export const Default: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button intent="edit" label="Rename" />}
        title="Rename the report"
        description="The new name appears in the list of reports."
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setOpen(false)
              }}
            />
            <Button
              intent="save"
              label="Save"
              onClick={() => {
                setOpen(false)
              }}
            />
          </>
        }
      >
        <TextField label="Name" defaultValue="Sales by region, Q3" />
      </Dialog>
    )
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = body.getByRole('button', { name: 'Rename' })
    await userEvent.click(trigger)
    const dialog = await body.findByRole('dialog', { name: 'Rename the report' })
    await expect(dialog).toHaveAccessibleDescription('The new name appears in the list of reports.')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(trigger)
    await body.findByRole('dialog')
    await settle()
  },
}

/** While an action runs: Escape and a press outside do not close it; no close button. */
export const NotDismissible: Story = {
  name: 'Not dismissible',
  render: () => (
    <Dialog
      defaultOpen
      dismissible={false}
      title="Sending 24 invoices"
      description="The dialog closes when the invoices are sent."
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await body.findByRole('dialog')
    await settle()
    await userEvent.keyboard('{Escape}')
    await expect(body.getByRole('dialog')).toBeVisible()
    await expect(body.queryByRole('button', { name: 'Close' })).toBeNull()
    await settle()
  },
}

/** Long title and text at phone width (a 390px frame): 5% from the edges, the text wraps. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <Dialog
        defaultOpen
        title={LONG.label}
        description={LONG.description}
        actions={<Button intent="confirm" label="Confirm the delivery address" />}
      >
        <p className="m-0 text-sm">{LONG.value}</p>
      </Dialog>
    </PhoneFrame>
  ),
}

/** Arabic sample text, right to left: the close button at the inline end (left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Dialog
        defaultOpen
        title={ARABIC.label}
        description={ARABIC.description}
        actions={<Button intent="save" label={ARABIC.value} />}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Dialog
        defaultOpen
        title={JAPANESE.label}
        description={JAPANESE.description}
        actions={<Button intent="save" label={JAPANESE.value} />}
      />
    </StoryProvider>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { Drawer } from './dialog'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const meta = {
  title: 'Components/Overlays/Drawer',
  component: Drawer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a short edit while the list stays visible beside it (Appendix B.8): ' +
          'edit a contact, filter details. It slides in from the `side`: the start by default ' +
          '(the left in left-to-right, the right in right-to-left) or the end. Title, optional ' +
          'description, content, actions with the main action last; the focus stays inside and ' +
          'returns to the trigger.\n\n' +
          '**When not:** one action with one outcome (Dialog); more than about ten fields, tabs ' +
          'or attachments (a full page with an address and a back button).',
      },
    },
  },
  args: { title: 'Edit the contact' },
  play: settle,
} satisfies Meta<typeof Drawer>

export default meta

type Story = StoryObj<typeof meta>

function EditContact({ side }: { side?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false)
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      {...(side === undefined ? {} : { side })}
      trigger={<Button intent="edit" label="Edit the contact" />}
      title="Edit the contact"
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
      <TextField label="Name" defaultValue="Ana Jovanović" />
      <TextField label="E-mail" type="email" defaultValue="ana@example.com" />
    </Drawer>
  )
}

async function openAndCheck(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body)
  const trigger = body.getByRole('button', { name: 'Edit the contact' })
  await userEvent.click(trigger)
  await body.findByRole('dialog', { name: 'Edit the contact' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  await waitFor(() => expect(trigger).toHaveFocus())
  await userEvent.click(trigger)
  await body.findByRole('dialog')
  await settle()
}

/** From the start side; Escape closes it and the focus returns to the button. */
export const Start: Story = {
  render: () => <EditContact />,
  play: async ({ canvasElement }) => {
    await openAndCheck(canvasElement)
  },
}

/** From the end side. */
export const End: Story = {
  render: () => <EditContact side="end" />,
  play: async ({ canvasElement }) => {
    await openAndCheck(canvasElement)
  },
}

/** While saving: not dismissible, no close button. */
export const NotDismissible: Story = {
  name: 'Not dismissible',
  render: () => <Drawer defaultOpen dismissible={false} title="Saving the contact" />,
}

/** Long text at phone width (a 390px frame): the drawer takes the whole width. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <Drawer defaultOpen title={LONG.label} description={LONG.description}>
        <TextField label={LONG.label} defaultValue={LONG.value} error={LONG.error} />
      </Drawer>
    </PhoneFrame>
  ),
}

/** Arabic sample text, right to left: from the start side, which is the right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Drawer defaultOpen title={ARABIC.label} description={ARABIC.description}>
        <TextField label={ARABIC.label} defaultValue={ARABIC.value} />
      </Drawer>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Drawer defaultOpen title={JAPANESE.label} description={JAPANESE.description}>
        <TextField label={JAPANESE.label} defaultValue={JAPANESE.value} />
      </Drawer>
    </StoryProvider>
  ),
}

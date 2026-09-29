import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileDown, Mail, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { MenuEntry } from './dropdown-menu'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SplitAction } from './split-action'
import { StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Actions/SplitAction',
  component: SplitAction,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a main action with related ones behind a chevron — "Save" with "Save ' +
          'as draft", "PDF" with "Send by e-mail". The two halves are one control in the main ' +
          "action's family and weight; the menu opens under it at its end (the other side in " +
          'right-to-left) with an arrow; destructive items are red. The chevron is named "More ' +
          'options: <label>".\n\n' +
          '**When not:** two independent actions (ActionGroup); a list of equal actions ' +
          '(DropdownMenu).',
      },
    },
  },
  args: { intent: 'save', label: 'Save', entries: [] },
  play: settle,
} satisfies Meta<typeof SplitAction>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

const ENTRIES: MenuEntry[] = [
  { label: 'Save as draft', icon: Save, onSelect: noop },
  { label: 'Save and send', icon: Mail, onSelect: noop },
  { type: 'separator' },
  { label: 'Discard changes', icon: Trash2, onSelect: noop, destructive: true },
]

/** Families and weights: the joined halves follow the main action. */
export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <SplitAction intent="save" label="Save" entries={ENTRIES} />
      <SplitAction
        intent="pdf"
        label="PDF"
        entries={[{ label: 'Download', icon: FileDown, onSelect: noop }]}
      />
      <SplitAction intent="edit" label="Edit" entries={ENTRIES} />
      <SplitAction family="verify" icon={Mail} label="Send" emphasis="menu" entries={ENTRIES} />
      <SplitAction intent="save" label="Save" disabled entries={ENTRIES} />
    </div>
  ),
}

/** The menu open from the keyboard; choosing an item runs it and closes the menu. */
export const Open: Story = {
  render: function Render() {
    const [ran, setRan] = useState('nothing')
    return (
      <div className="flex min-h-60 flex-col items-start gap-3">
        <SplitAction
          intent="save"
          label="Save"
          onClick={() => {
            setRan('Save')
          }}
          entries={ENTRIES.map((entry) =>
            entry.type === undefined || entry.type === 'item'
              ? {
                  ...entry,
                  onSelect: () => {
                    setRan(entry.label)
                  },
                }
              : entry,
          )}
        />
        <p className="m-0 text-sm text-secondary">
          Ran: <code>{ran}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const chevron = canvas.getByRole('button', { name: 'More options: Save' })
    chevron.focus()
    await userEvent.keyboard('{Enter}')
    await body.findByRole('menu')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(canvas.getByText('Save and send')).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await body.findByRole('menu')
    await settle()
  },
}

/** Long label at phone width: the control keeps its halves together. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <SplitAction
        intent="confirm"
        label="Confirm the delivery address"
        entries={[{ label: LONG.label, onSelect: noop }]}
      />
    </div>
  ),
}

/** Arabic sample text, right to left: the chevron at the start side of the menu's anchor. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="min-h-50">
        <SplitAction
          intent="save"
          label={ARABIC.options[0] ?? ''}
          entries={ARABIC.options.map((label) => ({ label, icon: Save, onSelect: noop }))}
        />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^More options/ }))
    await body.findByRole('menu')
    await settle()
  },
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <SplitAction
        intent="pdf"
        label={JAPANESE.options[0] ?? ''}
        entries={JAPANESE.options.map((label) => ({ label, icon: FileDown, onSelect: noop }))}
      />
    </StoryProvider>
  ),
}

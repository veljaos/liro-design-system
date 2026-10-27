import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { SectionCard } from './cards'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { InlineUndo } from './inline-undo'
import { PhoneFrame } from './story-frames'

const meta = {
  title: 'Components/Feedback/InlineUndo',
  component: InlineUndo,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the answer to a routine, reversible action, in the place where it ' +
          'happened: what changed, in the application’s words, and Undo — "Krempita removed · ' +
          'Undo" in a cart, "Guests seated at 19:40 · Undo" in a table’s panel (P5.93). Nothing ' +
          'to dismiss, nothing that covers the screen; the application takes it away at the next ' +
          'change. The words are announced politely; the button is described by them.\n\n' +
          '**When:** a till, a restaurant’s floor, any quick flow where a toast would cover the ' +
          'next tap. Undo instead of a confirmation for anything reversible.\n\n' +
          '**When not:** a routine save (SaveStatus beside the action); an error (under its ' +
          'field, or an Alert); an outcome somewhere else ("Payroll posted": a toast); something ' +
          'that cannot be undone (ConfirmDialog first).',
      },
    },
  },
  args: { message: 'Krempita removed', onUndo: fn() },
  render: (args) => (
    <div className="w-96 max-w-full">
      <InlineUndo {...args} />
    </div>
  ),
  play: settle,
} satisfies Meta<typeof InlineUndo>

export default meta

type Story = StoryObj<typeof meta>

/** The words at the start, Undo after them. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Undo' }),
    ).toHaveAccessibleDescription('Krempita removed')
  },
}

/** In a table's panel on a floor plan, with the application's icon and its own words. */
export const InAPanel: Story = {
  name: 'In a panel',
  render: () => (
    <div className="w-80 max-w-full">
      <SectionCard title="Table 7" headingLevel={2}>
        <InlineUndo
          message="Guests seated at 19:40"
          icon={CircleCheck}
          undoLabel="Undo seating"
          onUndo={() => undefined}
        />
      </SectionCard>
    </div>
  ),
}

/** Long words wrap; Undo goes under them when the row is narrow. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: { message: LONG.value },
}

/** On a phone, across the screen's width. */
export const Phone: Story = {
  tags: ['!dev'],
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <InlineUndo
          {...args}
          message="Sale parked. It waits under Parked sales."
          undoLabel="Resume"
        />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic sample text, right to left: the words at the start (right), Undo after them. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: () => (
    <div lang="ar" dir="rtl" className="w-96 max-w-full">
      <InlineUndo message={ARABIC.value} undoLabel={ARABIC.options[0] ?? ''} onUndo={() => undefined} />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: () => (
    <div lang="ja" className="w-96 max-w-full">
      <InlineUndo message={JAPANESE.value} onUndo={() => undefined} />
    </div>
  ),
}

/** Undo puts it back at once, with no question. */
function Removable() {
  const [removed, setRemoved] = useState(true)
  return removed ? (
    <InlineUndo
      message="Krempita removed"
      onUndo={() => {
        setRemoved(false)
      }}
    />
  ) : (
    <p className="m-0 text-sm text-primary">Krempita · 1 pc</p>
  )
}

export const UndoInteraction: Story = {
  name: 'Undo, interaction',
  tags: ['interaction', '!dev'],
  render: () => (
    <div className="w-96 max-w-full">
      <Removable />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
    await expect(canvas.getByText('Krempita · 1 pc')).toBeVisible()
  },
}

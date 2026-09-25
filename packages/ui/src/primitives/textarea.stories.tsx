import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import { internal, settle } from './story-helpers'
import { Textarea } from './textarea'

const meta = {
  title: 'Internal/Primitives/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: internal('A multi-line text input with the input look. TextAreaField (P2.2).'),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

/** With a value, with a placeholder, and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="textarea-value">Note</Label>
        <Textarea
          id="textarea-value"
          rows={3}
          defaultValue="Deliver to the back entrance. The gate closes at 18:00, so call ahead if the delivery is late."
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="textarea-empty">Comment</Label>
        <Textarea id="textarea-empty" placeholder="Write a comment" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="textarea-disabled">Internal note</Label>
        <Textarea id="textarea-disabled" defaultValue="Locked by the period close." disabled />
      </div>
    </div>
  ),
}

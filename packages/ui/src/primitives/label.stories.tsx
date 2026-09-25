import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Label',
  component: Label,
  parameters: {
    docs: {
      description: {
        component: internal('A field label: 13px, weight 600. Field (P2.2) places it.'),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

/** Above an input, beside a checkbox, and a long label that wraps. */
export const Placement: Story = {
  render: () => (
    <div className="flex max-w-80 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="label-input">Invoice number</Label>
        <Input id="label-input" />
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="label-checkbox" />
        <Label htmlFor="label-checkbox">Send a copy to the customer</Label>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="label-long">
          The address where the goods are delivered, when it differs from the registered address
        </Label>
        <Input id="label-long" />
      </div>
    </div>
  ),
}

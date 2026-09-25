import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './input'
import { Label } from './label'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A single-line text input: 36px, border.control, the focus colour on focus. TextField (P2.2) adds the label, description, error and read-only state.',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

/** Empty with a placeholder, with a value, and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-80 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="input-empty">Customer name</Label>
        <Input id="input-empty" placeholder="Search by name" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="input-value">City</Label>
        <Input id="input-value" defaultValue="Novi Sad" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="input-disabled">Account</Label>
        <Input id="input-disabled" defaultValue="1200" disabled />
      </div>
    </div>
  ),
}

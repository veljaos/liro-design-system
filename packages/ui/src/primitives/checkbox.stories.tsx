import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './checkbox'
import { Label } from './label'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: internal('A 20px checkbox with a 24px target. CheckboxField (P2.2).'),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

const STATES = [
  { id: 'unchecked', label: 'Unchecked', checked: false, disabled: false },
  { id: 'checked', label: 'Checked', checked: true, disabled: false },
  { id: 'indeterminate', label: 'Some selected', checked: 'indeterminate', disabled: false },
  { id: 'disabled', label: 'Disabled', checked: false, disabled: true },
  { id: 'disabled-checked', label: 'Disabled, checked', checked: true, disabled: true },
] as const

/** Unchecked, checked, indeterminate, disabled and disabled checked. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map((state) => (
        <div key={state.id} className="flex items-center gap-3">
          <Checkbox
            id={`checkbox-${state.id}`}
            defaultChecked={state.checked}
            disabled={state.disabled}
          />
          <Label htmlFor={`checkbox-${state.id}`}>{state.label}</Label>
        </div>
      ))}
    </div>
  ),
}

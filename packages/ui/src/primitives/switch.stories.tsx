import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import { internal, settle } from './story-helpers'
import { Switch } from './switch'

const meta = {
  title: 'Internal/Primitives/Switch',
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A 38×20px switch; the thumb starts at the leading edge in both directions. SwitchField (P2.2).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

const STATES = [
  { id: 'off', label: 'Email notifications', checked: false, disabled: false },
  { id: 'on', label: 'Two-step sign-in', checked: true, disabled: false },
  { id: 'disabled-off', label: 'Beta features (disabled)', checked: false, disabled: true },
  { id: 'disabled-on', label: 'Audit log (disabled, on)', checked: true, disabled: true },
] as const

/** Off, on, and disabled in both positions. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {STATES.map((state) => (
        <div key={state.id} className="flex items-center gap-3">
          <Switch
            id={`switch-${state.id}`}
            defaultChecked={state.checked}
            disabled={state.disabled}
          />
          <Label htmlFor={`switch-${state.id}`}>{state.label}</Label>
        </div>
      ))}
    </div>
  ),
}

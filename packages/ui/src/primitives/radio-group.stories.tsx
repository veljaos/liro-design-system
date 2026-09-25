import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/RadioGroup',
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: internal(
          'Radio buttons, 16px apart; the arrow keys follow the direction. RadioGroupField (P2.2).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly (not available for this plan)', disabled: true },
]

/** One chosen, one disabled; and a whole group disabled. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {[false, true].map((disabled) => (
        <div key={String(disabled)} className="flex flex-col gap-2">
          <span id={`radio-heading-${String(disabled)}`} className="text-sm font-semibold">
            {disabled ? 'Reporting period (disabled)' : 'Reporting period'}
          </span>
          <RadioGroup
            defaultValue="quarterly"
            disabled={disabled}
            aria-labelledby={`radio-heading-${String(disabled)}`}
          >
            {OPTIONS.map((option) => {
              const id = `radio-${String(disabled)}-${option.value}`
              return (
                <div key={option.value} className="flex items-center gap-3">
                  <RadioGroupItem id={id} value={option.value} disabled={option.disabled} />
                  <Label htmlFor={id}>{option.label}</Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      ))}
    </div>
  ),
}

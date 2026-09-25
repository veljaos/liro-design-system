import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A select: the input look with a chevron at the inline end; the list opens 8px below, as wide as the trigger. SelectField (P2.2).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

function Options() {
  return (
    <>
      <SelectGroup>
        <SelectLabel>Domestic</SelectLabel>
        <SelectItem value="rsd">Serbian dinar</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Foreign</SelectLabel>
        <SelectItem value="eur">Euro</SelectItem>
        <SelectItem value="usd">US dollar</SelectItem>
        <SelectItem value="chf" disabled>
          Swiss franc (no exchange rate today)
        </SelectItem>
      </SelectGroup>
    </>
  )
}

/** Open, with groups, a chosen option and a disabled one. */
export const Open: Story = {
  render: () => (
    <div className="flex max-w-80 flex-col gap-1 pb-56">
      <Label id="select-open-label">Currency</Label>
      {/* Held open: Radix closes a select when the window resizes, as a full-page screenshot does. */}
      <Select defaultValue="eur" open>
        <SelectTrigger aria-labelledby="select-open-label">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <Options />
        </SelectContent>
      </Select>
    </div>
  ),
}

/** Closed: a placeholder, a value, and disabled. */
export const Closed: Story = {
  render: () => (
    <div className="flex max-w-80 flex-col gap-4">
      {(['placeholder', 'value', 'disabled'] as const).map((state) => (
        <div key={state} className="flex flex-col gap-1">
          <Label id={`select-${state}-label`}>Currency ({state})</Label>
          <Select
            {...(state === 'placeholder' ? {} : { defaultValue: 'rsd' })}
            disabled={state === 'disabled'}
          >
            <SelectTrigger aria-labelledby={`select-${state}-label`}>
              <SelectValue placeholder="Choose a currency" />
            </SelectTrigger>
            <SelectContent>
              <Options />
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  ),
}

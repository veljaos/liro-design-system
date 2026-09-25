import type { Meta, StoryObj } from '@storybook/react-vite'
import { Filter } from 'lucide-react'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import { Checkbox } from './checkbox'
import { Label } from './label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component: internal(
          'Floating content 8px from its trigger, 12px by 16px padding. Popover (P2.4), filters (P3.3).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Popover>

export default meta

type Story = StoryObj<typeof meta>

/** Open below its trigger, aligned to the start. */
export const Open: Story = {
  render: () => (
    <div className="pb-40">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <ButtonPrimitive>
            <Filter aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
            <span>Filter</span>
          </ButtonPrimitive>
        </PopoverTrigger>
        <PopoverContent align="start">
          <div className="flex flex-col gap-3">
            <span className="font-semibold">Show</span>
            {['Drafts', 'Posted', 'Cancelled'].map((status) => (
              <div key={status} className="flex items-center gap-3">
                <Checkbox id={`popover-${status}`} defaultChecked={status !== 'Cancelled'} />
                <Label htmlFor={`popover-${status}`}>{status}</Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
}

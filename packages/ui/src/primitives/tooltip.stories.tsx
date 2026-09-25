import type { Meta, StoryObj } from '@storybook/react-vite'
import { Printer } from 'lucide-react'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import { internal, settle } from './story-helpers'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta = {
  title: 'Internal/Primitives/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: internal(
          'The previous Design System tooltip: inverted colours, radius 4px, 12px text, an arrow, 300ms delay. Never the only place important information lives. Tooltip (P2.4).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

/** Open above an icon button. */
export const Open: Story = {
  render: () => (
    <TooltipProvider>
      <div className="pt-10">
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <ButtonPrimitive shape="icon" family="document" aria-label="Print">
              <Printer aria-hidden="true" className={BUTTON_SHAPES.icon.icon} />
            </ButtonPrimitive>
          </TooltipTrigger>
          <TooltipContent>Print (Ctrl+P)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}

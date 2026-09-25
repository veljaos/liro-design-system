import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, Trash2, X } from 'lucide-react'
import { FAMILY_NAMES } from '../components/intents'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Button',
  component: ButtonPrimitive,
  parameters: {
    docs: {
      description: {
        component: internal(
          'The Liro button look (family, emphasis, shape) for buttons inside other primitives. ' +
            'Product code uses Button, IconButton or CompactIconButton.',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof ButtonPrimitive>

export default meta

type Story = StoryObj<typeof meta>

/** Every family filled, one light and one subtle button, the three shapes, and disabled. */
export const Looks: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FAMILY_NAMES.map((family) => (
          <ButtonPrimitive key={family} family={family} emphasis="primary">
            <Plus aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
            <span>{family}</span>
          </ButtonPrimitive>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonPrimitive family="destructive" emphasis="secondary">
          <Trash2 aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
          <span>Delete</span>
        </ButtonPrimitive>
        <ButtonPrimitive family="primary" emphasis="menu">
          <Plus aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
          <span>Add line</span>
        </ButtonPrimitive>
        <ButtonPrimitive shape="icon" aria-label="Add">
          <Plus aria-hidden="true" className={BUTTON_SHAPES.icon.icon} />
        </ButtonPrimitive>
        <ButtonPrimitive shape="compact" emphasis="menu" aria-label="Close">
          <X aria-hidden="true" className={BUTTON_SHAPES.compact.icon} />
        </ButtonPrimitive>
        <ButtonPrimitive disabled>
          <Plus aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
          <span>Disabled</span>
        </ButtonPrimitive>
      </div>
    </div>
  ),
}

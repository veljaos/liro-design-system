import type { Meta, StoryObj } from '@storybook/react-vite'
import { Save } from 'lucide-react'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import {
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Input } from './input'
import { Label } from './label'
import { Sheet, SheetContent, type SheetSide } from './sheet'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Sheet',
  component: Sheet,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A side sheet on a logical side: start is the left in left-to-right and the right in right-to-left. Drawer (P2.4).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Sheet>

export default meta

type Story = StoryObj<typeof meta>

function OpenSheet({ side }: { side: SheetSide }) {
  return (
    <Sheet defaultOpen>
      <SheetContent side={side}>
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
          <DialogCloseButton label="Close" />
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Changes apply to new documents only.</DialogDescription>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`sheet-${side}-name`}>Contact person</Label>
            <Input id={`sheet-${side}-name`} defaultValue="Ana Jovanović" />
          </div>
          <DialogFooter>
            <ButtonPrimitive family="primary" emphasis="primary">
              <Save aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
              <span>Save</span>
            </ButtonPrimitive>
          </DialogFooter>
        </DialogBody>
      </SheetContent>
    </Sheet>
  )
}

/** On the start side (Mantine's default). */
export const Start: Story = {
  render: () => <OpenSheet side="start" />,
}

/** On the end side. */
export const End: Story = {
  render: () => <OpenSheet side="end" />,
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check, X } from 'lucide-react'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A modal dialog: 440px, 5dvh from the top, header with a close button, body, actions at the end. Dialog and ConfirmDialog (P2.4).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

/** Open: title, close button, text and two actions, the main one last. */
export const Open: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close the period</DialogTitle>
          <DialogCloseButton label="Close" />
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            Entries dated in September 2026 can no longer be changed after the period is closed.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <ButtonPrimitive>
                <X aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
                <span>Cancel</span>
              </ButtonPrimitive>
            </DialogClose>
            <ButtonPrimitive family="primary" emphasis="primary">
              <Check aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
              <span>Close period</span>
            </ButtonPrimitive>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
}

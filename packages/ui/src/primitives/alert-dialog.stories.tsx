import type { Meta, StoryObj } from '@storybook/react-vite'
import { Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from './alert-dialog'
import { BUTTON_SHAPES } from './button'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/AlertDialog',
  component: AlertDialog,
  parameters: {
    docs: {
      description: {
        component: internal(
          'Asks before an action: the Dialog look without a close button; cancel gets the focus. ConfirmDialog and IrreversibleConfirmDialog (P2.4).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof AlertDialog>

export default meta

type Story = StoryObj<typeof meta>

/** Open, confirming a destructive action. */
export const Open: Story = {
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogTitle>Delete 3 draft invoices?</AlertDialogTitle>
        <AlertDialogDescription>
          The drafts and their lines are removed. Posted invoices are not affected.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <X aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
            <span>Cancel</span>
          </AlertDialogCancel>
          <AlertDialogAction family="destructive">
            <Trash2 aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
            <span>Delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

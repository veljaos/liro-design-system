import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A menu of actions; a submenu opens towards the inline end (to the left in right-to-left). DropdownMenu (P2.4), the "more" menu of ActionGroup (P2.7).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

/** Open with icons, a shortcut, a disabled item, checkbox and radio items and an open submenu. */
export const Open: Story = {
  render: () => (
    <div className="flex min-h-120 justify-center">
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <ButtonPrimitive shape="icon" emphasis="menu" aria-label="More actions">
            <MoreHorizontal aria-hidden="true" className={BUTTON_SHAPES.icon.icon} />
          </ButtonPrimitive>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Pencil aria-hidden="true" />
              Edit
              <DropdownMenuShortcut>E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy aria-hidden="true" />
              Duplicate
            </DropdownMenuItem>
            {/* Held open: a submenu closes when the focus moves to the menu. */}
            <DropdownMenuSub open>
              <DropdownMenuSubTrigger>
                <Share2 aria-hidden="true" />
                Send to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Customer</DropdownMenuItem>
                <DropdownMenuItem>Accountant</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem disabled>
              <Trash2 aria-hidden="true" />
              Delete (posted)
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked>Amount</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>Due date</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="comfortable">
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}

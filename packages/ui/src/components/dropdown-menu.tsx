import type { ReactElement } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import type { IconComponent } from './intents'

/*
 * DropdownMenu (BUILD-PLAN P2.4) on the P2.1 primitive (Mantine Menu): items with an optional
 * 15px icon and shortcut, labels and separators, from a list the application gives. A
 * destructive item takes the danger colours, as Mantine's Menu.Item with color="red": the text in
 * status.danger.fg, and status.danger.bg under the pointer or the keyboard.
 */

/** One entry of a menu. */
export type MenuEntry =
  | {
      type?: 'item'
      /** The item's text. From the application. */
      label: string
      /** Called when the item is chosen; the menu then closes. */
      onSelect: () => void
      icon?: IconComponent
      /** A keyboard shortcut shown at the end, e.g. "Ctrl+D". From the application. */
      shortcut?: string
      disabled?: boolean
      /** A destructive action (delete, reject): drawn in the danger colours. */
      destructive?: boolean
    }
  | { type: 'separator' }
  | {
      type: 'label'
      /** A heading over the next items. From the application. */
      label: string
    }

export interface DropdownMenuProps {
  /** The element that opens it, usually an IconButton or a Button. */
  trigger: ReactElement
  entries: readonly MenuEntry[]
  /** Where it lines up with its trigger. Default: 'start', as Mantine's position 'bottom-start'. */
  align?: 'start' | 'center' | 'end'
}

/**
 * A menu of actions opened from a button. The keyboard moves through the items with the arrows,
 * Enter chooses, Escape closes and returns the focus to the trigger.
 */
export function DropdownMenu({ trigger, entries, align = 'start' }: DropdownMenuProps) {
  return (
    // Not modal, as Mantine's Menu: the page is not hidden from assistive technology while the
    // menu is open, so the trigger never sits focusable inside aria-hidden content.
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {entries.map((entry, index) => {
          if (entry.type === 'separator') return <DropdownMenuSeparator key={index} />
          if (entry.type === 'label') {
            return <DropdownMenuLabel key={index}>{entry.label}</DropdownMenuLabel>
          }
          const Icon = entry.icon
          return (
            <DropdownMenuItem
              key={index}
              disabled={entry.disabled === true}
              onSelect={entry.onSelect}
              className={cn(
                entry.destructive === true &&
                  'text-status-danger-fg data-highlighted:bg-status-danger-bg',
              )}
            >
              {Icon !== undefined && <Icon aria-hidden="true" />}
              <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{entry.label}</span>
              {entry.shortcut !== undefined && (
                <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </MenuRoot>
  )
}

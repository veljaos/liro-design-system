import { ChevronRight } from 'lucide-react'
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
      /**
       * The current value the item changes ("Kvadrat Gradnja d.o.o." under "Switch company"): a
       * second line in smaller secondary text that wraps instead of being cut, with a chevron at
       * the end, because choosing the item opens a chooser. From the application.
       */
      value?: string
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
                entry.value !== undefined && 'items-start',
                entry.destructive === true &&
                  'text-status-danger-fg data-highlighted:bg-status-danger-bg',
              )}
            >
              {Icon !== undefined && (
                <Icon aria-hidden="true" className={menuIconClass(entry.value)} />
              )}
              <MenuItemText label={entry.label} value={entry.value} />
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

/**
 * The text of a menu item (P5, the owner's review of the phone user menu). With a current value
 * the item has two lines — the action, then the value in xs text.secondary, wrapping onto more
 * lines rather than ending in "…" — and a chevron at the end. Every menu item that shows a current
 * value uses it (DropdownMenu entries with `value`, the AppShell's "Switch company"). Internal.
 */
export function MenuItemText({ label, value }: { label: string; value?: string | undefined }) {
  if (value === undefined) {
    return <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{label}</span>
  }
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={TEXT_DIRECTION}>{label}</span>
        <span className={cn('text-xs wrap-break-word text-secondary', TEXT_DIRECTION)}>
          {value}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="shrink-0 self-center rtl:-scale-x-100" />
    </>
  )
}

/** A two-line item's icon stands beside its first line (13px text on a 1.45 line). */
export function menuIconClass(value: string | undefined): string | undefined {
  return value === undefined ? undefined : 'mt-0.75'
}

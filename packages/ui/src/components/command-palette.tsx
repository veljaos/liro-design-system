import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { useDebouncedCallback } from './combobox-logic'
import { commandMatches, highlightParts, opensPalette } from './command-logic'
import type { IconComponent } from './intents'

/*
 * CommandPalette (BUILD-PLAN P2.6), the previous Design System's Mantine Spotlight, carried over
 * (owner's decision, 2026-09-28, docs/decisions.md "Navigation"):
 * - opens with Ctrl/Cmd+K and Ctrl/Cmd+P; radius lg;
 * - a search field with an 18px search icon at the start and a placeholder from the messages;
 * - the matching text of results highlighted;
 * - results in groups, actions first, then navigation ("Go to"); each item a label, an optional
 *   description, an optional 17px icon and optional keywords used for matching;
 * - "Nothing found" from the messages.
 *
 * Mantine 9.6.2 Spotlight (@mantine/spotlight styles.css and defaults): a modal 80px from the top
 * (yOffset), the Modal's 440px width; the search is an Input of size 'lg' without border or
 * background (50px high, 16px text); the results under a 1px line (gray-2 / dark-4; P3.6, owner:
 * border.subtle, thin and quiet), 4px padding, at most 400px high and scrolling;
 * an item 7px by 16px, radius md, surface.hover under the pointer, filled with the brand colour
 * when chosen with the keyboard, its icon 16px before the label, its description 12px in
 * text.secondary (on the brand fill, brand.onSolid: Mantine lowers it with opacity 0.7, which
 * Appendix B.6 forbids for text); a group label 12px, bold, upper case, text.secondary, 16px from
 * the start, 16px above its group; "nothing found" text.secondary, centred, 16px padding. Matches
 * are highlighted as Mantine's Highlight (Mark): here status.warning.bg (the pale yellow orange-0)
 * under text.primary.
 *
 * The keyboard is cmdk's: the focus stays in the search field, the arrows move through the
 * results, Enter runs the chosen one, Escape closes and the focus returns.
 */

/** One command. */
export interface CommandItem {
  id: string
  /** From the application. */
  label: string
  /** A line under the label, from the application. */
  description?: string
  icon?: IconComponent
  /** More words that find it ("bill" for "Invoices"). From the application. */
  keywords?: readonly string[]
  /** 'actions' are listed first, 'navigation' ("Go to") after them. */
  group: 'actions' | 'navigation'
  /** Runs it; the palette then closes. */
  onSelect: () => void
}

export interface CommandPaletteProps {
  items: readonly CommandItem[]
  /** Controlled open state; by default Ctrl/Cmd+K and Ctrl/Cmd+P open it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Called with the text after typing pauses for `searchDelay`, for results from the server,
   * passed back as `items` with `loading` while it works. Without it, `items` are filtered here.
   */
  onSearch?: (query: string) => void
  /** Milliseconds of quiet before `onSearch`. Default: 300 (as ComboboxField). */
  searchDelay?: number
  /** The application is searching. */
  loading?: boolean
}

function Label({ text, query }: { text: string; query: string }) {
  const { locale } = useLiro()
  return (
    <>
      {highlightParts(text, query, locale).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-xs bg-status-warning-bg text-primary">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  )
}

/**
 * Search and commands for the whole application, opened with Ctrl/Cmd+K (or +P): actions first,
 * then places to go. Keyboard only if the user wants: type, arrows, Enter.
 */
export function CommandPalette(props: CommandPaletteProps) {
  const { messages, locale } = useLiro()
  const [innerOpen, setInnerOpen] = useState(false)
  const open = props.open ?? innerOpen
  const [query, setQuery] = useState('')
  const search = useDebouncedCallback(props.onSearch, props.searchDelay ?? 300)
  const onOpenChange = props.onOpenChange

  const setOpen = (next: boolean) => {
    setInnerOpen(next)
    onOpenChange?.(next)
    if (!next) setQuery('')
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (opensPalette(event)) {
        event.preventDefault()
        setInnerOpen(true)
        onOpenChange?.(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [onOpenChange])

  const shown =
    props.onSearch === undefined
      ? props.items.filter((item) => commandMatches(item, query, locale))
      : props.items
  const groups = [
    { key: 'actions' as const, heading: messages['command.actions'] },
    { key: 'navigation' as const, heading: messages['command.navigation'] },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby={undefined} className="top-20 overflow-hidden rounded-lg p-0">
        <DialogTitle className="sr-only">{messages['command.title']}</DialogTitle>
        <CommandPrimitive
          shouldFilter={false}
          label={messages['command.title']}
          className="flex flex-col font-sans text-primary"
        >
          <div className="flex h-[50px] items-center">
            <span
              aria-hidden="true"
              className="flex w-12 shrink-0 items-center justify-center text-secondary"
            >
              <Search className="size-4.5" />
            </span>
            <CommandPrimitive.Input
              value={query}
              onValueChange={(text) => {
                setQuery(text)
                search(text)
              }}
              placeholder={messages['command.placeholder']}
              aria-label={messages['command.title']}
              className="m-0 h-full min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent p-0 pe-4 font-sans text-lg text-primary shadow-none outline-none placeholder:text-tertiary focus:outline-none focus-visible:outline-none"
            />
          </div>
          {props.loading === true && (
            <p
              role="status"
              className={cn(
                'm-0 border-0 border-t border-solid border-subtle p-4 text-center text-sm text-secondary',
                TEXT_ISOLATE,
              )}
            >
              {messages['field.loading']}
            </p>
          )}
          {props.loading !== true && shown.length === 0 && (
            <p
              role="status"
              className={cn(
                'm-0 border-0 border-t border-solid border-subtle p-4 text-center text-sm text-secondary',
                TEXT_ISOLATE,
              )}
            >
              {messages['command.noResults']}
            </p>
          )}
          {/*
           * A listbox holds only groups and options: the messages above stay outside it. The
           * list is always there, because the search field points to it (aria-controls).
           */}
          <CommandPrimitive.List
            label={messages['command.title']}
            className="max-h-100 overflow-y-auto border-0 border-t border-solid border-subtle p-1"
          >
            {groups.map((group) => {
              const items = shown.filter((item) => item.group === group.key)
              if (items.length === 0) return null
              return (
                <CommandPrimitive.Group
                  key={group.key}
                  heading={group.heading}
                  className="mt-4 first:mt-0 **:[[cmdk-group-heading]]:ps-4 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-secondary"
                >
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => {
                          setOpen(false)
                          item.onSelect()
                        }}
                        className={cn(
                          'group flex cursor-pointer items-center rounded-md px-4 py-[7px] text-sm text-primary outline-none select-none hover:bg-surface-hover',
                          'data-[selected=true]:bg-brand-solid data-[selected=true]:text-brand-on-solid',
                        )}
                      >
                        {Icon !== undefined && (
                          <Icon aria-hidden="true" className="me-4 size-[17px] shrink-0" />
                        )}
                        <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>
                          <span className="block">
                            <Label text={item.label} query={query} />
                          </span>
                          {item.description !== undefined && (
                            <span className="block text-xs text-secondary group-data-[selected=true]:text-brand-on-solid">
                              {item.description}
                            </span>
                          )}
                        </span>
                      </CommandPrimitive.Item>
                    )
                  })}
                </CommandPrimitive.Group>
              )
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  )
}

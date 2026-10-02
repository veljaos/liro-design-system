import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs'
import { useLiro } from '../provider/liro-provider'
import type { IconComponent } from './intents'

/*
 * Tabs, Breadcrumbs, CursorPagination and ShortcutHint (BUILD-PLAN P2.6), the previous Design
 * System's (owner's decision, 2026-09-28, docs/decisions.md "Navigation"):
 * - Tabs: radius md; the list always centred (a list at the start of a wide screen leaves a gap
 *   that looks like something is missing); hidden panels are not kept mounted, so a dialog opened
 *   from a tab belongs at page level, outside the Tabs (AGENTS.md D14).
 * - Breadcrumbs: the separator "›", which mirrors in right-to-left by itself (a Unicode mirrored
 *   character), 10px (xs) on each side; links underlined only on hover; the last item not a link.
 * - CursorPagination: Mantine Pagination 'sm', radius md, no first/last buttons; only the
 *   previous and next controls, no page numbers.
 * - ShortcutHint: Mantine Kbd 'xs'.
 */

/** One tab. */
export interface TabItem {
  value: string
  /** The tab's name, from the application. */
  label: ReactNode
  /** The panel, mounted only while its tab is active. */
  content: ReactNode
  icon?: IconComponent
  disabled?: boolean
}

export interface TabsProps {
  items: readonly TabItem[]
  /** Controlled active tab. */
  value?: string
  /** Uncontrolled initial tab; default: the first. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Names the list of tabs for assistive technology. From the application. */
  label?: string
  /** Layout classes. */
  className?: string
}

/**
 * Parts of one screen shown one at a time (the tabs inside a module, Appendix B.8). Arrow keys
 * move between tabs in the provider's direction.
 */
export function Tabs(props: TabsProps) {
  const first = props.items[0]?.value
  return (
    <TabsRoot
      {...(props.value === undefined ? {} : { value: props.value })}
      {...(props.defaultValue === undefined
        ? first === undefined
          ? {}
          : { defaultValue: first }
        : { defaultValue: props.defaultValue })}
      {...(props.onValueChange === undefined ? {} : { onValueChange: props.onValueChange })}
      className={props.className}
    >
      <TabsList
        className="justify-center"
        {...(props.label === undefined ? {} : { 'aria-label': props.label })}
      >
        {props.items.map((item) => {
          const Icon = item.icon
          return (
            <TabsTrigger key={item.value} value={item.value} disabled={item.disabled === true}>
              {Icon !== undefined && <Icon aria-hidden="true" />}
              <span className={TEXT_DIRECTION}>{item.label}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
      {props.items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  )
}

/** One step of a breadcrumb trail. */
export interface Crumb {
  /** From the application. */
  label: ReactNode
  /** Where it leads; ignored on the last item, which is the current page. */
  href?: string
}

export interface BreadcrumbsProps {
  items: readonly Crumb[]
  className?: string
}

/**
 * Where the user is, from the third level of routes on (Appendix B.8). Links use the provider's
 * `linkComponent`, so navigation stays in the application's router; the last item is the current
 * page and is not a link.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const { linkComponent: Link, messages } = useLiro()
  return (
    <nav aria-label={messages['breadcrumbs.label']} className={cn('font-sans text-md', className)}>
      <ol className="m-0 flex list-none flex-wrap items-center p-0">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={index}>
              <li className="leading-none whitespace-nowrap">
                {last || item.href === undefined ? (
                  <span
                    {...(last ? { 'aria-current': 'page' as const } : {})}
                    className={cn('text-primary', TEXT_DIRECTION)}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'rounded-sm text-link no-underline hover:underline',
                      TEXT_DIRECTION,
                      FOCUS_RING,
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              {!last && (
                <li
                  aria-hidden="true"
                  className="mx-2.5 flex items-center justify-center leading-none text-secondary"
                >
                  ›
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export interface CursorPaginationProps {
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  /** The count of rows, from the application (e.g. through `messages['table.count']`). */
  count?: ReactNode
  className?: string
}

/**
 * Paging by cursor: only "previous" and "next", never page numbers (the server pages by cursor).
 * The count sits at the start, the controls at the end. Mantine Pagination 'sm': 26px square
 * controls with a 14.4px chevron (26 / 1.8), 1px border.strong border, raised surface, radius md,
 * 8px apart; surface.hover on hover; disabled without opacity (Appendix B.6).
 */
export function CursorPagination(props: CursorPaginationProps) {
  const { messages } = useLiro()
  const control = (label: string, enabled: boolean, onClick: () => void, Icon: IconComponent) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!enabled}
      onClick={onClick}
      className={cn(
        BUTTON_RESET,
        'flex size-[26px] cursor-pointer items-center justify-center rounded-md border border-solid border-strong bg-surface-raised text-primary enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:border-default disabled:bg-surface-disabled disabled:text-disabled',
        FOCUS_RING,
      )}
    >
      <Icon aria-hidden="true" className="size-[calc(26px/1.8)] rtl:-scale-x-100" />
    </button>
  )
  return (
    <div
      className={cn('flex flex-wrap items-center justify-between gap-2 font-sans', props.className)}
    >
      <div className="text-sm text-secondary">{props.count}</div>
      <div className="flex items-center gap-2">
        {control(messages['table.previous'], props.hasPrevious, props.onPrevious, ChevronLeft)}
        {control(messages['table.next'], props.hasNext, props.onNext, ChevronRight)}
      </div>
    </div>
  )
}

export interface ShortcutHintProps {
  /** The keys, from the application in the user's words: ["Ctrl", "K"] or ["⌘", "K"]. */
  keys: readonly string[]
  className?: string
}

/**
 * A keyboard shortcut drawn as keys (Mantine Kbd 'xs'): monospace, bold, 12px (Mantine 10px; A.5's
 * smallest size is 12px), radius sm, a 1px border.default border with a 3px bottom edge,
 * text.secondary on surface.hover, padding 0.12em 0.45em; keys joined by "+".
 */
export function ShortcutHint({ keys, className }: ShortcutHintProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-secondary', className)}>
      {keys.map((key, index) => (
        <Fragment key={index}>
          {index > 0 && <span aria-hidden="true">+</span>}
          <kbd className="rounded-sm border border-b-[3px] border-solid border-default bg-surface-hover px-[0.45em] py-[0.12em] text-center font-mono text-xs leading-[1.55] font-bold text-secondary [unicode-bidi:embed]">
            {key}
          </kbd>
        </Fragment>
      ))}
    </span>
  )
}

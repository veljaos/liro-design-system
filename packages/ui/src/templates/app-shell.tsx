import { Bell, Building2, Search } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { BrandLockup, type BrandLockupProps } from '../components/brand-lockup'
import {
  CommandPalette,
  type CommandItem,
  type CommandPaletteProps,
} from '../components/command-palette'
import { MenuItemText, menuIconClass, type MenuEntry } from '../components/dropdown-menu'
import { Breadcrumbs, type Crumb } from '../components/navigation'
import { PersonAvatar } from '../components/person'
import { usePhone } from '../components/use-phone'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import type { ShellCompanies } from './company-logic'
import { CompanySheet, CompanySwitcher, currentCompanyName } from './company-switcher'

export { COMPANY_SEARCH_THRESHOLD } from './company-switcher'
export {
  companyKeyTarget,
  companyRows,
  companySections,
  matchingCompanies,
  type CompanyRow,
  type CompanySection,
  type CompanySectionKey,
  type ShellCompanies,
  type ShellCompany,
} from './company-logic'

/*
 * AppShell (BUILD-PLAN P4.1; the owner's values, docs/decisions.md "Application shell"):
 * - Header 56px on surface.header with a 1px border.default line under it; horizontal padding md
 *   (16px) on phones and lg (24px) from sm. Start, 16px (md) apart: the BrandLockup, an optional
 *   environment marker, then from sm a short vertical divider (18px, border.default) and the
 *   breadcrumbs in xs. End: the search button, then 16px, then the cluster of notifications,
 *   company switcher and user menu, 8px (xs) apart.
 * - Search (the old look): a neutral "default" button, small (30px), the Search icon 15px,
 *   `messages['shell.search']`, then 16px (md) and the shortcut as plain text ("Ctrl K"; the
 *   application gives "⌘K" on a Mac) in xs text.tertiary, no key boxes (owner); width by
 *   content. It opens the CommandPalette (also Ctrl/Cmd+K). On phones an icon-only subtle 36px
 *   button, like the bell.
 * - Notifications: a subtle 36px button with an 18px Bell; while anything is unread a 10px dot in
 *   status.danger.solid sits at the bell's top end corner, 4px in (Mantine Indicator offset), no
 *   number and no animation; the count is in the button's name ("Notifications, 3 unread") and in
 *   the panel (NotificationsPanel, P4.9), which the application passes.
 * - Company switcher (CompanySwitcher, P4.9): a subtle neutral 30px button, the company 13px
 *   medium and a 14px chevron; a 320px list below it at the end, searchable by name or tax number
 *   above 7 companies, sectioned Pinned / Recent / All companies, virtualised for thousands, a
 *   status badge for a suspended company and the application's note ("5 tasks") — never a bare
 *   number. "Switch company…" is also in the command palette. On phones it is an entry of the
 *   user menu that opens a full-screen sheet with the search field at the top.
 * - User menu: PersonAvatar sm (26px) in a 36px button, no name; the menu below at the end, 220px,
 *   radius md, shadow md: the name xs semibold and the e-mail xs text.tertiary, then the entries
 *   with 14px icons, all neutral — signing out is not destructive (P4.9).
 * - Breadcrumbs only from two levels: one crumb repeats the page's title (P4.9).
 * - Module tabs: a second header row (the header 96px in all), centred, as page-level tabs; links,
 *   the current one `aria-current="page"` with the 2px brand line; a row wider than the screen
 *   scrolls and fades at the edge with more past it (P4.9). There is no sidebar, ever
 *   (Appendix B.8).
 * - Slots: the impersonation bar above the header, the environment marker after the brand, the
 *   offline indicator under the header (P5.3 fills them).
 * - Phones (below 48em, by real branching, or `layout`): the lockup without the product name, no
 *   breadcrumbs, the bottom bar for the main action within thumb reach — the form's bottom bar
 *   (surface.page, a 1px border.default line on top, padding sm) plus the safe-area insets.
 */

export interface ShellUser {
  name: string
  email?: string
  /** A photo; the initials show without it. */
  avatarSrc?: string
  /** The menu's entries (profile, settings, sign out …), as DropdownMenu's. */
  entries: readonly MenuEntry[]
}

export interface ShellNotifications {
  /** How many are unread; the dot shows above 0. */
  unread: number
  /** The panel the button opens: the application's list of notifications. */
  panel: ReactNode
}

/** A tab of the module tab row: a link to one part of the module. */
export interface ModuleTab {
  key: string
  label: string
  href: string
  /** The part being shown. */
  current?: boolean
}

export interface AppShellProps {
  /** The brand at the start, a link home (BrandLockup's props: the application's brand files). */
  brand: BrandLockupProps
  /** Where the user is (from the third level of routes, Appendix B.8); hidden on phones. */
  breadcrumbs?: readonly Crumb[]
  /** The command palette the search button opens (its items and search). */
  commands?: Omit<CommandPaletteProps, 'open' | 'onOpenChange'>
  /**
   * The search shortcut as the user sees it, plain text. Default: "Ctrl K"
   * (`messages['grid.modifierKey']` and K); the application gives "⌘K" on a Mac.
   */
  searchShortcut?: string
  notifications?: ShellNotifications
  companies?: ShellCompanies
  user?: ShellUser
  /** The module's tabs: a second header row. */
  moduleTabs?: readonly ModuleTab[]
  /** Above the header, never dismissible (P5.3 ImpersonationBar). */
  impersonationBar?: ReactNode
  /** After the brand (P5.3 EnvironmentMarker: sandbox, demo). */
  environmentMarker?: ReactNode
  /** Under the header (P5.3 OfflineIndicator). */
  offlineIndicator?: ReactNode
  /** Phones only: the page's main action within thumb reach. */
  bottomBar?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /** The page. */
  children: ReactNode
}

const SMALL_BUTTON = 'min-h-control-sm gap-2 px-3.5 text-xs'

function NotificationsButton({ notifications }: { notifications: ShellNotifications }) {
  const { messages, format } = useLiro()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          shape="icon"
          aria-label={messages['shell.notifications'](
            notifications.unread,
            format.number(String(notifications.unread)),
          )}
        >
          <span className="relative flex">
            <Bell aria-hidden="true" className="size-4.5" />
            {notifications.unread > 0 && (
              <span
                aria-hidden="true"
                data-slot="notification-dot"
                className="absolute -end-px -top-px size-2.5 rounded-full bg-status-danger-solid"
              />
            )}
          </span>
        </ButtonPrimitive>
      </PopoverTrigger>
      <PopoverContent align="end" className="box-border px-1 py-2 shadow-md">
        {notifications.panel}
      </PopoverContent>
    </Popover>
  )
}

function UserMenu({
  user,
  companies,
  onSwitchCompany,
  triggerRef,
}: {
  user: ShellUser
  /** The menu's button, where the focus returns after the company sheet. */
  triggerRef?: RefObject<HTMLButtonElement | null>
  /** Phones: the company switcher moves into the user menu, as one entry. */
  companies?: ShellCompanies
  onSwitchCompany?: () => void
}) {
  const { messages } = useLiro()
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          shape="icon"
          ref={triggerRef}
          aria-label={messages['shell.userMenu']}
          className="px-1.25"
        >
          <PersonAvatar
            name={user.name}
            size="sm"
            {...(user.avatarSrc === undefined ? {} : { src: user.avatarSrc })}
          />
        </ButtonPrimitive>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="box-border w-55 shadow-md [&_[data-slot=dropdown-menu-item]_svg]:size-3.5"
      >
        <div className="flex flex-col px-3 py-1.5">
          <span className={cn('truncate text-xs font-semibold text-primary', TEXT_DIRECTION)}>
            {user.name}
          </span>
          {user.email !== undefined && (
            <span dir="ltr" className="truncate text-start text-xs text-tertiary">
              {user.email}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {companies !== undefined && onSwitchCompany !== undefined && (
          <>
            <DropdownMenuItem onSelect={onSwitchCompany} className="items-start">
              <Building2 aria-hidden="true" className={menuIconClass('')} />
              <MenuItemText
                label={messages['shell.switchCompanyTitle']}
                value={currentCompanyName(companies)}
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {user.entries.map((entry, index) => {
          if (entry.type === 'separator') return <DropdownMenuSeparator key={index} />
          if (entry.type === 'label') {
            return <DropdownMenuLabel key={index}>{entry.label}</DropdownMenuLabel>
          }
          const Icon = entry.icon
          // The user menu is neutral (P4.9, the owner's review): signing out loses nothing, so it
          // is never drawn in the danger colours; `destructive` is not read here.
          return (
            <DropdownMenuItem
              key={index}
              disabled={entry.disabled === true}
              onSelect={entry.onSelect}
              className={cn(entry.value !== undefined && 'items-start')}
            >
              {Icon !== undefined && (
                <Icon aria-hidden="true" className={menuIconClass(entry.value)} />
              )}
              <MenuItemText label={entry.label} value={entry.value} />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Which ends of a scrolling row have more content past them (in reading order). */
function useOverflowEnds(element: HTMLElement | null): { start: boolean; end: boolean } {
  const [ends, setEnds] = useState({ start: false, end: false })
  useEffect(() => {
    if (element === null) return
    const measure = () => {
      // scrollLeft runs negative in right-to-left; its size from the start is what counts.
      const fromStart = Math.abs(element.scrollLeft)
      const room = element.scrollWidth - element.clientWidth
      const next = { start: fromStart > 1, end: room - fromStart > 1 }
      setEnds((last) => (last.start === next.start && last.end === next.end ? last : next))
    }
    measure()
    element.addEventListener('scroll', measure, { passive: true })
    // The row's own box keeps its width when its tabs grow, so each tab is observed; a web font
    // that arrives after the first measure changes the tabs' widths (found as a flaky baseline).
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    for (const item of element.querySelectorAll('li')) observer.observe(item)
    const fonts = typeof document === 'undefined' ? undefined : document.fonts
    fonts?.addEventListener('loadingdone', measure)
    void fonts?.ready.then(measure)
    return () => {
      element.removeEventListener('scroll', measure)
      fonts?.removeEventListener('loadingdone', measure)
      observer.disconnect()
    }
  }, [element])
  return ends
}

/**
 * The mask that fades a scrolling row's edges where more lies past them: 32px from fully drawn to
 * gone, toward the start and the end in reading order. A mask, not a colour: the row fades into
 * whatever surface is behind it (only the mask's alpha counts, and currentcolor is opaque).
 */
export function edgeFade(
  ends: { start: boolean; end: boolean },
  direction: 'ltr' | 'rtl',
): string | undefined {
  if (!ends.start && !ends.end) return undefined
  const towards = direction === 'rtl' ? 'to left' : 'to right'
  const start = ends.start ? 'transparent, currentcolor 32px' : 'currentcolor, currentcolor'
  const end = ends.end ? 'currentcolor calc(100% - 32px), transparent' : 'currentcolor'
  return `linear-gradient(${towards}, ${start}, ${end})`
}

function ModuleTabs({ tabs }: { tabs: readonly ModuleTab[] }) {
  const { messages, direction, linkComponent: Link } = useLiro()
  const [scroller, setScroller] = useState<HTMLElement | null>(null)
  const mask = edgeFade(useOverflowEnds(scroller), direction)
  return (
    // On a narrow screen the row scrolls sideways, without a scrollbar of its own: a tab that takes
    // the focus scrolls into view, and a finger swipes. While tabs lie past an edge, that edge
    // fades into the header (P4.9), so the row shows that it goes on.
    <nav
      ref={setScroller}
      aria-label={messages['shell.moduleTabs']}
      data-fade={mask === undefined ? undefined : ''}
      className="-mb-px overflow-x-auto [scrollbar-width:none]"
      {...(mask === undefined ? {} : { style: { maskImage: mask } })}
    >
      <ul className="m-0 flex h-10 list-none justify-center-safe p-0">
        {tabs.map((tab) => (
          <li key={tab.key} className="flex">
            <Link
              href={tab.href}
              {...(tab.current === true ? { 'aria-current': 'page' } : {})}
              className={cn(
                'flex items-center rounded-t-md border-0 border-b-2 border-solid border-transparent px-4 font-sans text-sm leading-none whitespace-nowrap text-primary no-underline visited:text-primary hover:border-default hover:bg-surface-hover hover:text-primary active:text-primary',
                tab.current === true && 'border-brand hover:border-brand',
                FOCUS_RING,
                '-outline-offset-2',
                TEXT_DIRECTION,
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * The frame of every Liro screen: the header with the brand, breadcrumbs, search, notifications,
 * company and user; the module's tabs; the page; on phones the bottom action bar. Navigation is
 * the launchpad and module tabs, never a sidebar (Appendix B.8).
 */
export function AppShell(props: AppShellProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [searching, setSearching] = useState(false)
  const [switching, setSwitching] = useState(false)
  const userButton = useRef<HTMLButtonElement>(null)
  const contentId = useId()
  const shortcut = props.searchShortcut ?? `${messages['grid.modifierKey']} K`
  const root = useRef<HTMLDivElement>(null)
  // "Switch company…" in the command palette (P4.9): it opens the switcher once the palette has
  // closed, so the palette's focus return does not close the popover again.
  const commandItems: readonly CommandItem[] =
    props.commands === undefined
      ? []
      : props.companies === undefined
        ? props.commands.items
        : [
            ...props.commands.items,
            {
              id: 'liro-switch-company',
              label: messages['shell.switchCompanyCommand'],
              icon: Building2,
              group: 'actions',
              onSelect: () => {
                window.setTimeout(() => {
                  setSwitching(true)
                }, 0)
              },
            },
          ]
  const top = useRef<HTMLDivElement>(null)

  // The height of everything sticky at the top (bars, header, tabs), as --liro-shell-top on the
  // shell, so a page can fill the rest of the screen (WorklistPage's panes scroll on their own).
  useLayoutEffect(() => {
    const bar = top.current
    const shell = root.current
    if (bar === null || shell === null) return
    const measure = () => {
      shell.style.setProperty('--liro-shell-top', `${String(bar.offsetHeight)}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => {
      observer.disconnect()
    }
  }, [])

  // The bottom bar's height, as --liro-shell-bottom on the provider's root (P4.9d), so the
  // Toaster — placed inside LiroProvider, beside or inside the shell — stands above the bar and
  // never covers its actions.
  const [bottom, setBottom] = useState<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const shell = root.current
    if (bottom === null || shell === null) return
    const owner = shell.closest<HTMLElement>('[data-liro-theme]') ?? shell
    const measure = () => {
      owner.style.setProperty('--liro-shell-bottom', `${String(bottom.offsetHeight)}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bottom)
    return () => {
      observer.disconnect()
      owner.style.removeProperty('--liro-shell-bottom')
    }
  }, [bottom])

  return (
    <div
      ref={root}
      data-slot="app-shell"
      className="flex min-h-dvh flex-col bg-surface-page font-sans"
    >
      <a
        href={`#${contentId}`}
        className={cn(
          'sr-only z-(--liro-layer-tooltip) rounded-md bg-surface-overlay px-3 py-2 text-sm text-link visited:text-link focus:not-sr-only focus:absolute focus:start-2 focus:top-2',
          FOCUS_RING,
        )}
      >
        {messages['shell.skipToContent']}
      </a>
      <div ref={top} className="sticky top-0 z-(--liro-layer-header)">
        {props.impersonationBar}
        <header className="border-0 border-b border-solid border-default bg-surface-header pt-[env(safe-area-inset-top)]">
          <div
            className={cn(
              'flex h-header items-center gap-4',
              phone
                ? 'ps-[max(16px,env(safe-area-inset-left))] pe-[max(16px,env(safe-area-inset-right))]'
                : 'px-6',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <BrandLockup {...props.brand} compact={phone} />
              {props.environmentMarker}
              {/* One level is no trail: the page's title already says it (P4.9). */}
              {!phone && props.breadcrumbs !== undefined && props.breadcrumbs.length > 1 && (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4.5 shrink-0 border-0 border-s border-solid border-default"
                  />
                  {/* One line in the header: crumbs that do not fit end with "…" (the full text stays
                      in the accessible name and the page's title). */}
                  <Breadcrumbs
                    items={props.breadcrumbs}
                    className="min-w-0 overflow-hidden text-xs [&_li:not([aria-hidden])]:min-w-0 [&_li:not([aria-hidden])]:truncate [&_li:not([aria-hidden])]:leading-base [&_ol]:flex-nowrap"
                  />
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {props.commands !== undefined &&
                (phone ? (
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="menu"
                    shape="icon"
                    aria-label={messages['shell.search']}
                    onClick={() => {
                      setSearching(true)
                    }}
                  >
                    <Search aria-hidden="true" className="size-4" />
                  </ButtonPrimitive>
                ) : (
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="secondary"
                    // Exactly 30px (owner): the keys' line height made it 35.5px, which put its
                    // edges between pixels and changed their antialiasing from run to run.
                    className={cn(SMALL_BUTTON, 'h-control-sm py-0')}
                    aria-keyshortcuts="Control+K Meta+K"
                    onClick={() => {
                      setSearching(true)
                    }}
                  >
                    <Search aria-hidden="true" className="size-3.75 shrink-0" />
                    <span className={TEXT_DIRECTION}>{messages['shell.search']}</span>
                    <span
                      aria-hidden="true"
                      dir="ltr"
                      className="ms-2 text-xs font-regular whitespace-nowrap text-tertiary"
                    >
                      {shortcut}
                    </span>
                  </ButtonPrimitive>
                ))}
              <div className="flex items-center gap-2">
                {props.notifications !== undefined && (
                  <NotificationsButton notifications={props.notifications} />
                )}
                {!phone && props.companies !== undefined && (
                  <CompanySwitcher
                    companies={props.companies}
                    open={switching}
                    onOpenChange={setSwitching}
                  />
                )}
                {props.user !== undefined && (
                  <UserMenu
                    user={props.user}
                    triggerRef={userButton}
                    {...(phone && props.companies !== undefined
                      ? {
                          companies: props.companies,
                          onSwitchCompany: () => {
                            setSwitching(true)
                          },
                        }
                      : {})}
                  />
                )}
              </div>
            </div>
          </div>
          {props.moduleTabs !== undefined && props.moduleTabs.length > 0 && (
            <ModuleTabs tabs={props.moduleTabs} />
          )}
        </header>
        {props.offlineIndicator}
      </div>
      <main id={contentId} tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        {props.children}
      </main>
      {phone && props.bottomBar !== undefined && (
        <div
          ref={setBottom}
          data-slot="shell-bottom-bar"
          className="sticky bottom-0 z-(--liro-layer-sticky) border-0 border-t border-solid border-default bg-surface-page ps-[max(12px,env(safe-area-inset-left))] pe-[max(12px,env(safe-area-inset-right))] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] [&>*]:w-full"
        >
          {props.bottomBar}
        </div>
      )}
      {props.commands !== undefined && (
        <CommandPalette
          {...props.commands}
          items={commandItems}
          open={searching}
          onOpenChange={setSearching}
        />
      )}
      {phone && props.companies !== undefined && (
        <CompanySheet
          companies={props.companies}
          open={switching}
          onOpenChange={setSwitching}
          returnFocusTo={userButton}
        />
      )}
    </div>
  )
}

import { Bell, Check, ChevronDown, Search } from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import { useId, useState, type ReactNode } from 'react'
import { BrandLockup, type BrandLockupProps } from '../components/brand-lockup'
import { CommandPalette, type CommandPaletteProps } from '../components/command-palette'
import { commandMatches } from '../components/command-logic'
import { Dialog } from '../components/dialog'
import type { MenuEntry } from '../components/dropdown-menu'
import { Breadcrumbs, ShortcutHint, type Crumb } from '../components/navigation'
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

/*
 * AppShell (BUILD-PLAN P4.1; the owner's values, docs/decisions.md "Application shell"):
 * - Header 56px on surface.header with a 1px border.default line under it; horizontal padding md
 *   (16px) on phones and lg (24px) from sm. Start, 16px (md) apart: the BrandLockup, an optional
 *   environment marker, then from sm a short vertical divider (18px, border.default) and the
 *   breadcrumbs in xs. End: the search button, then 16px, then the cluster of notifications,
 *   company switcher and user menu, 8px (xs) apart.
 * - Search (the old look): a neutral "default" button, small (30px), the Search icon 15px,
 *   `messages['shell.search']`, then the shortcut (ShortcutHint, quiet: text.tertiary); width by
 *   content. It opens the CommandPalette (also Ctrl/Cmd+K). On phones an icon-only subtle 36px
 *   button, like the bell.
 * - Notifications: a subtle 36px button with an 18px Bell; while anything is unread a 10px dot in
 *   status.danger.solid sits at the bell's top end corner, 4px in (Mantine Indicator offset), no
 *   number and no animation; the count is in the button's name ("Notifications, 3 unread") and in
 *   the panel, which the application renders.
 * - Company switcher: a subtle neutral 30px button, the company 13px medium and a 14px chevron; a
 *   list below it at the end, 260px: each company with its description (a tax number) in xs
 *   text.tertiary, an optional waiting count, the current one with a check; a search field at the
 *   top when there are more than 7 (name or description); the order is the application's (recent
 *   first). On phones it moves into the user menu.
 * - User menu: PersonAvatar sm (26px) in a 36px button, no name; the menu below at the end, 220px,
 *   radius md, shadow md: the name xs semibold and the e-mail xs text.tertiary, then the entries
 *   with 14px icons.
 * - Module tabs: a second header row (the header 96px in all), centred, as page-level tabs; links,
 *   the current one `aria-current="page"` with the 2px brand line. There is no sidebar, ever
 *   (Appendix B.8).
 * - Slots: the impersonation bar above the header, the environment marker after the brand, the
 *   offline indicator under the header (P5.3 fills them).
 * - Phones (below 48em, by real branching, or `layout`): the lockup without the product name, no
 *   breadcrumbs, the bottom bar for the main action within thumb reach — the form's bottom bar
 *   (surface.page, a 1px border.default line on top, padding sm) plus the safe-area insets.
 */

/** One company of the company switcher. */
export interface ShellCompany {
  id: string
  /** The company's name, from the application. */
  name: string
  /** A second line, e.g. its tax number, from the application. Searched with the name. */
  description?: string
  /** How many items wait in this company; shown when above 0. */
  waiting?: number
}

export interface ShellCompanies {
  /** In the application's order (recently used first). */
  items: readonly ShellCompany[]
  /** The id of the current company. */
  current: string
  onSelect: (id: string) => void
}

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
  /** The search shortcut as the user sees it. Default: Ctrl (`messages['grid.modifierKey']`) K. */
  searchShortcut?: readonly string[]
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

/** The companies list shows a search field above this many. */
export const COMPANY_SEARCH_THRESHOLD = 7

/** The companies that match the search: by name or description, ignoring case and accents. */
export function matchingCompanies(
  companies: readonly ShellCompany[],
  query: string,
  locale: string,
): ShellCompany[] {
  return companies.filter((company) =>
    commandMatches(
      {
        label: company.name,
        ...(company.description === undefined ? {} : { description: company.description }),
      },
      query,
      locale,
    ),
  )
}

const SMALL_BUTTON = 'min-h-control-sm gap-2 px-3.5 text-xs'

/** The list of companies, searchable above COMPANY_SEARCH_THRESHOLD. */
function CompanyList({ companies, onDone }: { companies: ShellCompanies; onDone: () => void }) {
  const { messages, locale, format } = useLiro()
  const [query, setQuery] = useState('')
  const searchable = companies.items.length > COMPANY_SEARCH_THRESHOLD
  const shown = searchable ? matchingCompanies(companies.items, query, locale) : companies.items
  return (
    <CommandPrimitive
      shouldFilter={false}
      // cmdk names its input with this label (aria-labelledby wins over the input's own name);
      // the list below has its own.
      label={searchable ? messages['shell.findCompany'] : messages['shell.companies']}
      className="flex flex-col font-sans text-primary"
    >
      {searchable && (
        <CommandPrimitive.Input
          value={query}
          onValueChange={setQuery}
          placeholder={messages['shell.findCompany']}
          className="mb-1 box-border block h-control w-full min-w-0 appearance-none rounded-md border border-solid border-control bg-surface-raised px-3 font-sans text-sm text-primary outline-none placeholder:text-tertiary focus:border-focus"
        />
      )}
      {shown.length === 0 && (
        <p role="status" className="m-0 px-2.5 py-1.5 text-center text-sm text-secondary">
          {messages['field.noResults']}
        </p>
      )}
      <CommandPrimitive.List
        label={messages['shell.companies']}
        className="max-h-80 overflow-y-auto"
      >
        {shown.map((company) => {
          const current = company.id === companies.current
          return (
            <CommandPrimitive.Item
              key={company.id}
              value={company.id}
              onSelect={() => {
                companies.onSelect(company.id)
                onDone()
              }}
              {...(current ? { 'aria-current': 'true' as const } : {})}
              className="group box-border flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-primary outline-none select-none data-[selected=true]:bg-surface-sunken"
            >
              <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center">
                {current && <Check className="size-3.5" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn('truncate', TEXT_DIRECTION, current && 'font-medium')}>
                  {company.name}
                </span>
                {company.description !== undefined && (
                  <span className={cn('truncate text-xs text-tertiary', TEXT_DIRECTION)}>
                    {company.description}
                  </span>
                )}
              </span>
              {company.waiting !== undefined && company.waiting > 0 && (
                <span className="shrink-0 text-xs text-secondary tabular-nums">
                  <span aria-hidden="true">{format.number(String(company.waiting))}</span>
                  <span className="sr-only">{messages['shell.waiting'](company.waiting)}</span>
                </span>
              )}
            </CommandPrimitive.Item>
          )
        })}
      </CommandPrimitive.List>
    </CommandPrimitive>
  )
}

function currentCompany(companies: ShellCompanies): ShellCompany | undefined {
  return companies.items.find((company) => company.id === companies.current)
}

function CompanySwitcher({ companies }: { companies: ShellCompanies }) {
  const { messages } = useLiro()
  const [open, setOpen] = useState(false)
  const current = currentCompany(companies)
  const name = current?.name ?? ''
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          aria-label={messages['shell.switchCompany'](name)}
          className={cn(SMALL_BUTTON, 'gap-1.5 px-2.5 text-sm font-medium')}
        >
          <span className={cn('max-w-60 truncate', TEXT_DIRECTION)}>{name}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </ButtonPrimitive>
      </PopoverTrigger>
      <PopoverContent align="end" className="box-border w-65 p-1 shadow-md">
        <CompanyList
          companies={companies}
          onDone={() => {
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function NotificationsButton({ notifications }: { notifications: ShellNotifications }) {
  const { messages } = useLiro()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          shape="icon"
          aria-label={messages['shell.notifications'](notifications.unread)}
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
      <PopoverContent align="end" className="shadow-md">
        {notifications.panel}
      </PopoverContent>
    </Popover>
  )
}

function UserMenu({ user, companies }: { user: ShellUser; companies?: ShellCompanies }) {
  const { messages } = useLiro()
  const [choosing, setChoosing] = useState(false)
  const inline = companies !== undefined && companies.items.length <= COMPANY_SEARCH_THRESHOLD
  const current = companies === undefined ? undefined : currentCompany(companies)
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <ButtonPrimitive
            family="neutral"
            emphasis="menu"
            shape="icon"
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
          {companies !== undefined && inline && (
            <>
              <DropdownMenuLabel>{messages['shell.companies']}</DropdownMenuLabel>
              {companies.items.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onSelect={() => {
                    companies.onSelect(company.id)
                  }}
                  {...(company.id === companies.current ? { 'aria-current': 'true' as const } : {})}
                >
                  <span aria-hidden="true" className="flex size-3.5 shrink-0">
                    {company.id === companies.current && <Check />}
                  </span>
                  <span className={cn('min-w-0 flex-1 truncate', TEXT_DIRECTION)}>
                    {company.name}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          {companies !== undefined && !inline && (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  setChoosing(true)
                }}
              >
                <span className={cn('min-w-0 flex-1 truncate', TEXT_DIRECTION)}>
                  {messages['shell.switchCompany'](current?.name ?? '')}
                </span>
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
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {companies !== undefined && !inline && (
        <Dialog open={choosing} onOpenChange={setChoosing} title={messages['shell.companies']}>
          <CompanyList
            companies={companies}
            onDone={() => {
              setChoosing(false)
            }}
          />
        </Dialog>
      )}
    </>
  )
}

function ModuleTabs({ tabs }: { tabs: readonly ModuleTab[] }) {
  const { messages, linkComponent: Link } = useLiro()
  return (
    // On a narrow screen the row scrolls sideways, without a scrollbar of its own: a tab that takes
    // the focus scrolls into view, and a finger swipes.
    <nav
      aria-label={messages['shell.moduleTabs']}
      className="-mb-px overflow-x-auto [scrollbar-width:none]"
    >
      <ul className="m-0 flex h-10 list-none justify-center-safe p-0">
        {tabs.map((tab) => (
          <li key={tab.key} className="flex">
            <Link
              href={tab.href}
              {...(tab.current === true ? { 'aria-current': 'page' } : {})}
              className={cn(
                'flex items-center rounded-t-md border-0 border-b-2 border-solid border-transparent px-4 font-sans text-sm leading-none whitespace-nowrap text-primary no-underline hover:border-default hover:bg-surface-hover',
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
  const contentId = useId()
  const shortcut = props.searchShortcut ?? [messages['grid.modifierKey'], 'K']

  return (
    <div data-slot="app-shell" className="flex min-h-dvh flex-col bg-surface-page font-sans">
      <a
        href={`#${contentId}`}
        className={cn(
          'sr-only z-(--liro-layer-tooltip) rounded-md bg-surface-overlay px-3 py-2 text-sm text-link focus:not-sr-only focus:absolute focus:start-2 focus:top-2',
          FOCUS_RING,
        )}
      >
        {messages['shell.skipToContent']}
      </a>
      <div className="sticky top-0 z-(--liro-layer-header)">
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
              {!phone && props.breadcrumbs !== undefined && props.breadcrumbs.length > 0 && (
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
                    <span aria-hidden="true" className="flex">
                      <ShortcutHint keys={shortcut} quiet />
                    </span>
                  </ButtonPrimitive>
                ))}
              <div className="flex items-center gap-2">
                {props.notifications !== undefined && (
                  <NotificationsButton notifications={props.notifications} />
                )}
                {!phone && props.companies !== undefined && (
                  <CompanySwitcher companies={props.companies} />
                )}
                {props.user !== undefined && (
                  <UserMenu
                    user={props.user}
                    {...(phone && props.companies !== undefined
                      ? { companies: props.companies }
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
          data-slot="shell-bottom-bar"
          className="sticky bottom-0 z-(--liro-layer-sticky) border-0 border-t border-solid border-default bg-surface-page ps-[max(12px,env(safe-area-inset-left))] pe-[max(12px,env(safe-area-inset-right))] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] [&>*]:w-full"
        >
          {props.bottomBar}
        </div>
      )}
      {props.commands !== undefined && (
        <CommandPalette {...props.commands} open={searching} onOpenChange={setSearching} />
      )}
    </div>
  )
}

import { ChevronDown } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { BrandLockup, type BrandLockupProps } from '../components/brand-lockup'
import { MenuItemText, menuIconClass, type MenuEntry } from '../components/dropdown-menu'
import type { IconComponent } from '../components/intents'
import { PersonAvatar } from '../components/person'
import { usePhone } from '../components/use-phone'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { useLiro } from '../provider/liro-provider'

/*
 * PortalShell (BUILD-PLAN P5.16): the frame for people outside the company — a patient, a parent,
 * a student, a customer. Simpler than AppShell: no launchpad, no company switcher, no command
 * palette; a few sections; phone first. The same tokens and the same header values as AppShell
 * (docs/decisions.md "Application shell").
 * - Header: 56px on surface.header with a 1px border.default line under it; 16px at the sides on
 *   phones (with the safe-area insets), 24px from 48em; sticky at the top under the top safe
 *   area. At the start the BrandLockup (the application's brand as props, D18: no logo inside);
 *   at the end the participant: on desktop a subtle button with the avatar, the name (13px
 *   medium) and a 14px chevron; on phones the avatar alone (36px). It opens the participant's
 *   menu (neutral, 220px): the name and its detail line ("Parent of Luka Jovanović"), then the
 *   application's entries (profile, language, sign out).
 * - Sections (up to five): on desktop a second header row of tabs, start-aligned (D16: only the
 *   module tabs of AppShell are centred), links with `aria-current="page"` and the 2px brand line
 *   (D17); a section's note ("2 new") as small secondary text after its name. On phones a bottom
 *   navigation bar within thumb reach: one equal cell per section, a 20px icon over the 12px
 *   name, at least 56px high, the current one in text.primary semibold with the 2px brand line
 *   on top; a note is a 8px status.danger.solid dot on the icon (never a number alone) and part
 *   of the link's name ("Messages, 2 new"). The bar stands on surface.header with a 1px line on
 *   top and the bottom safe-area inset under it; its height is published as
 *   --liro-shell-bottom (as AppShell's bottom bar), so the Toaster stands above it.
 * - `banners` at the top of the content, full width and square, scrolling with the page (P5.3);
 *   `footer` under the content (the institution's address and hours), never under the bottom bar.
 * - A skip link to the content first, as AppShell's.
 */

/** A section of the portal: a link to one of its few pages. */
export interface PortalSection {
  key: string
  /** The section's name, from the application ("Appointments"). */
  label: string
  href: string
  /** Its icon in the bottom bar on phones (lucide). */
  icon: IconComponent
  /** The page being shown. */
  current?: boolean
  /** A short note from the application ("2 new"): a dot on phones, small text on desktop. */
  note?: string
}

/** The person using the portal. */
export interface PortalParticipant {
  name: string
  /** A second line in the menu: who they are here ("Parent of Luka Jovanović"). */
  detail?: string
  /** A photo; the initials show without it. */
  avatarSrc?: string
}

export interface PortalShellProps {
  /** The brand at the start, a link home (BrandLockup's props: the application's names). */
  brand: BrandLockupProps
  /** The person signed in; the menu opens from their avatar. */
  participant?: PortalParticipant
  /** The participant menu's entries (profile, language, sign out), as DropdownMenu's. */
  menu?: readonly MenuEntry[]
  /** The portal's few sections: tabs on desktop, the bottom bar on phones. */
  sections?: readonly PortalSection[]
  /** Portal-wide Banners (a maintenance window), most important first; they scroll away. */
  banners?: ReactNode
  /** Under the content: the institution's contact line, from the application. */
  footer?: ReactNode
  /** The participant menu is open when the shell first shows (a page restored as it was left). */
  defaultMenuOpen?: boolean
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /** The page. */
  children: ReactNode
}

const SIDES_PHONE =
  'ps-[max(16px,env(safe-area-inset-left))] pe-[max(16px,env(safe-area-inset-right))]'

function ParticipantMenu({
  participant,
  entries,
  phone,
  defaultOpen,
}: {
  participant: PortalParticipant
  entries: readonly MenuEntry[]
  phone: boolean
  defaultOpen: boolean
}) {
  const { messages } = useLiro()
  const avatar = (
    <PersonAvatar
      name={participant.name}
      size="sm"
      {...(participant.avatarSrc === undefined ? {} : { src: participant.avatarSrc })}
    />
  )
  return (
    <DropdownMenu modal={false} defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>
        {phone ? (
          <ButtonPrimitive
            family="neutral"
            emphasis="menu"
            shape="icon"
            aria-label={messages['portal.menu'](participant.name)}
            className="px-1.25"
          >
            {avatar}
          </ButtonPrimitive>
        ) : (
          <ButtonPrimitive
            family="neutral"
            emphasis="menu"
            aria-label={messages['portal.menu'](participant.name)}
            className="max-w-72 gap-2 ps-1.25 pe-2.5"
          >
            {avatar}
            <span className={cn('min-w-0 truncate text-sm font-medium', TEXT_DIRECTION)}>
              {participant.name}
            </span>
            <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
          </ButtonPrimitive>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="box-border w-55 shadow-md [&_[data-slot=dropdown-menu-item]_svg]:size-3.5"
      >
        <div className="flex flex-col px-3 py-1.5">
          <span className={cn('text-xs font-semibold text-primary', TEXT_DIRECTION)}>
            {participant.name}
          </span>
          {participant.detail !== undefined && (
            <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>
              {participant.detail}
            </span>
          )}
        </div>
        {entries.length > 0 && <DropdownMenuSeparator />}
        {entries.map((entry, index) => {
          if (entry.type === 'separator') return <DropdownMenuSeparator key={index} />
          if (entry.type === 'label') {
            return <DropdownMenuLabel key={index}>{entry.label}</DropdownMenuLabel>
          }
          const Icon = entry.icon
          // Neutral, as AppShell's user menu (P4.9): signing out loses nothing.
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

/** Desktop: the sections as a row of tabs under the header's first row, from the start. */
function SectionTabs({ sections }: { sections: readonly PortalSection[] }) {
  const { messages, linkComponent: Link } = useLiro()
  return (
    <nav
      aria-label={messages['portal.sections']}
      className="-mb-px overflow-x-auto px-4 [scrollbar-width:none]"
    >
      <ul className="m-0 flex h-10 list-none p-0">
        {sections.map((section) => (
          <li key={section.key} className="flex">
            <Link
              href={section.href}
              {...(section.current === true ? { 'aria-current': 'page' } : {})}
              className={cn(
                'flex items-center gap-2 rounded-t-md border-0 border-b-2 border-solid border-transparent px-2 font-sans text-sm leading-none whitespace-nowrap text-primary no-underline visited:text-primary hover:border-default hover:bg-surface-hover hover:text-primary active:text-primary',
                section.current === true && 'border-brand hover:border-brand',
                FOCUS_RING,
                '-outline-offset-2',
              )}
            >
              <span className={TEXT_DIRECTION}>{section.label}</span>
              {section.note !== undefined && (
                <span
                  className={cn(
                    'rounded-full bg-surface-sunken px-1.5 py-0.5 text-xs text-secondary',
                    TEXT_ISOLATE,
                  )}
                >
                  {section.note}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Phones: the sections in a bottom bar within thumb reach. */
function BottomNavigation({
  sections,
  barRef,
}: {
  sections: readonly PortalSection[]
  barRef: (element: HTMLElement | null) => void
}) {
  const { messages, linkComponent: Link } = useLiro()
  return (
    <nav
      ref={barRef}
      aria-label={messages['portal.sections']}
      data-slot="portal-bottom-bar"
      className={cn(
        'sticky bottom-0 z-(--liro-layer-sticky) border-0 border-t border-solid border-default bg-surface-header pb-[env(safe-area-inset-bottom)]',
        'ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]',
      )}
    >
      <ul className="m-0 flex list-none p-0">
        {sections.map((section) => {
          const Icon = section.icon
          const current = section.current === true
          return (
            <li key={section.key} className="flex min-w-0 flex-1">
              <Link
                href={section.href}
                {...(current ? { 'aria-current': 'page' } : {})}
                {...(section.note === undefined
                  ? {}
                  : { 'aria-label': messages['portal.sectionNote'](section.label, section.note) })}
                className={cn(
                  'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 border-0 border-t-2 border-solid px-1 pt-1.5 pb-2 font-sans text-xs no-underline hover:bg-surface-hover',
                  current
                    ? 'border-brand font-semibold text-primary visited:text-primary hover:text-primary active:text-primary'
                    : 'border-transparent text-secondary visited:text-secondary hover:text-primary active:text-primary',
                  FOCUS_RING,
                  '-outline-offset-2',
                )}
              >
                <span className="relative flex">
                  <Icon aria-hidden="true" className="size-5" />
                  {section.note !== undefined && (
                    <span
                      aria-hidden="true"
                      data-slot="portal-note-dot"
                      className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-status-danger-solid"
                    />
                  )}
                </span>
                <span className={cn('max-w-full truncate', TEXT_ISOLATE)}>{section.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * The frame of a portal for people outside the company: the brand, the participant and their
 * menu, a few sections (tabs, or the bottom bar on phones), the page.
 */
export function PortalShell(props: PortalShellProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const contentId = useId()
  const root = useRef<HTMLDivElement>(null)
  const sections = props.sections ?? []

  // The bottom bar's height as --liro-shell-bottom on the provider's root (as AppShell's), so the
  // Toaster stands above the bar and never covers it.
  const [bottom, setBottom] = useState<HTMLElement | null>(null)
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
      data-slot="portal-shell"
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
      <header className="sticky top-0 z-(--liro-layer-header) border-0 border-b border-solid border-default bg-surface-header pt-[env(safe-area-inset-top)]">
        <div className={cn('flex h-header items-center gap-4', phone ? SIDES_PHONE : 'px-6')}>
          <div className="flex min-w-0 flex-1 items-center">
            <BrandLockup {...props.brand} compact={phone} />
          </div>
          {props.participant !== undefined && (
            <ParticipantMenu
              participant={props.participant}
              entries={props.menu ?? []}
              phone={phone}
              defaultOpen={props.defaultMenuOpen === true}
            />
          )}
        </div>
        {!phone && sections.length > 0 && <SectionTabs sections={sections} />}
      </header>
      <main id={contentId} tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        {props.banners !== undefined && props.banners !== null && props.banners !== false && (
          <div
            data-slot="shell-banners"
            className={cn(
              'flex flex-col [&>*]:rounded-none [&>*]:border-0 [&>*]:border-b [&>*]:border-solid [&>*]:border-default [&>*]:py-3',
              phone
                ? '[&>*]:ps-[max(16px,env(safe-area-inset-left))] [&>*]:pe-[max(16px,env(safe-area-inset-right))]'
                : '[&>*]:px-6',
            )}
          >
            {props.banners}
          </div>
        )}
        {props.children}
      </main>
      {props.footer !== undefined && (
        <footer
          className={cn(
            'border-0 border-t border-solid border-default py-4 text-xs text-tertiary',
            phone ? SIDES_PHONE : 'px-6',
            TEXT_DIRECTION,
          )}
        >
          {props.footer}
        </footer>
      )}
      {phone && sections.length > 0 && <BottomNavigation sections={sections} barRef={setBottom} />}
    </div>
  )
}

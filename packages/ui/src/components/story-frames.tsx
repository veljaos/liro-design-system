import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react'
import { expect } from 'storybook/test'
import { createFormat, numericFormat } from '../provider/format'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import { ScreenContext } from '../provider/screen'

/*
 * Frames for overlay stories. Not part of the package: nothing in src/index.ts imports this file.
 * Inline styles only: Storybook compiles Tailwind classes from *.stories.tsx files alone.
 *
 * Overlays render into their provider's container with fixed positions, so a story cannot narrow
 * them with a wrapper. A nested provider inside a transformed frame keeps them inside it: an
 * element with a transform is the containing block of its fixed descendants.
 */

/**
 * A nested provider in the story's theme; locale, direction and theme may be given. A story whose
 * text depends on "today" (a due date's "2 days overdue") passes a fixed `today`, so its picture
 * does not change with the date (P5.23: the Kanban Arabic and Japanese stories did).
 */
export function StoryProvider({
  locale,
  direction,
  colorScheme,
  today,
  density,
  children,
}: {
  locale?: string
  direction?: 'ltr' | 'rtl'
  colorScheme?: 'light' | 'dark'
  /** YYYY-MM-DD; default the story's (the device's date). */
  today?: string
  /** 'touch' for the till and handheld stories (P5.10); default the story's. */
  density?: 'default' | 'touch'
  children: ReactNode
}) {
  const liro = useLiro()
  // With its own locale, the frame takes that locale's direction unless one is given.
  const dir = direction ?? (locale === undefined ? liro.direction : undefined)
  return (
    <LiroProvider
      locale={locale ?? liro.locale}
      {...(dir === undefined ? {} : { direction: dir })}
      colorScheme={colorScheme ?? liro.colorScheme}
      today={today ?? liro.today}
      {...(density === undefined ? {} : { density })}
    >
      {children}
    </LiroProvider>
  )
}

/** The tenant's date in the template stories, so pictures do not change with the date. */
export const EXAMPLE_TODAY = '2026-10-06'

const SERBIAN_FORMAT = createFormat('sr-Latn-RS')

/**
 * A percentage as the application writes it for a Serbian tenant ("62,4%", "+16,7%"): story data
 * goes through the provider's format, never a hand-written "62,4 %" (P4.7c).
 */
export function percentText(value: string, sign: 'auto' | 'always' = 'auto'): string {
  return SERBIAN_FORMAT.percent(value, { sign })
}

/**
 * The examples' tenant is a Serbian company (P5.28 item 2): the story's language with the region
 * RS ("en" → "en-RS"), so the words — month and weekday names, long dates — are the interface
 * language's and the first day of the week is the region's (Monday). A locale that names its
 * region keeps it.
 */
export function tenantLocale(locale: string): string {
  const parsed = new Intl.Locale(locale)
  return parsed.region === undefined
    ? new Intl.Locale(parsed.baseName, { region: 'RS' }).toString()
    : locale
}

/** How a Serbian tenant writes digits (12.345,60 RSD, 06.10.2026., 09:42), without its words. */
const TENANT_DIGITS = numericFormat('sr-Latn-RS')

/**
 * The examples' format in the stories' English: English words, a Serbian tenant's digits. Story
 * checks that expect a long date or a weekday name build them with it.
 */
export const EXAMPLE_FORMAT = createFormat('en-RS', TENANT_DIGITS)

/** The examples' tenant's time zone (a Serbian company). */
export const EXAMPLE_TIME_ZONE = 'Europe/Belgrade'

/**
 * The template and example stories (Phase 4): the story's locale (with the tenant's region, see
 * `tenantLocale`), direction and theme, the English interface text, but numbers, amounts and
 * numeric dates written as a Serbian tenant writes them (12.345,60 RSD, 06.10.2026.) — never its
 * month or weekday names (P5.28 item 2) — and a fixed today. Instants are shown in the tenant's
 * time zone (Europe/Belgrade), also where a screen formats one above its own shell: before P5.77
 * those fell back to the machine's zone (05:00 for 07:00 in a UTC test container).
 */
export function ExampleProvider({
  linkComponent,
  children,
}: {
  /** The example screens' router link (P4.8); default a plain anchor. */
  linkComponent?: ElementType
  children: ReactNode
}) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={tenantLocale(liro.locale)}
      direction={liro.direction}
      colorScheme={liro.colorScheme}
      format={TENANT_DIGITS}
      today={EXAMPLE_TODAY}
      timeZone={EXAMPLE_TIME_ZONE}
      {...(linkComponent === undefined ? {} : { linkComponent })}
    >
      {children}
    </LiroProvider>
  )
}

/** What the keyboard can reach inside a phone frame's page. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * A phone's screen (390 × 844px) inside a wider page: what is drawn in it behaves as on a phone
 * (P5.28 items 1, 5 and 11). A handheld scanner's screen is 360 × 740 (P5.11: `width={360}
 * height={740}`).
 * - The frame is the screen: it has a transform, so it is the containing block of every fixed
 *   element inside it — backdrops, dialogs, sheets and bottom bars cover the frame, not the
 *   window — and it is the collision boundary of floating lists, menus and popovers, and makes
 *   usePhone() answer true (provider/screen.ts), whatever the window's width.
 * - The page scrolls inside the frame, as on a phone: a scroll container fills the frame, so a
 *   sticky header and a sticky bottom bar stay in place while the page moves under them, and a
 *   long page can be read to its end. Its scrollbar is not drawn (a phone's is an overlay), so the
 *   page keeps the frame's full width. Fixed elements are not inside the scrolling: their
 *   containing block is the frame.
 * - A picture (the visual tests, a full-page screenshot) shows the frame's first screen: the
 *   frame keeps its size whatever the page's length.
 * - A page that scrolls but has nothing to focus (a printout) can be focused itself, so it can be
 *   scrolled from the keyboard (axe: scrollable-region-focusable).
 */
export function PhoneFrame({
  width = 390,
  height = 844,
  children,
}: {
  width?: number
  height?: number
  children: ReactNode
}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [page, setPage] = useState<HTMLDivElement | null>(null)
  const screen = useMemo(() => ({ element, phone: true }), [element])
  useEffect(() => {
    if (page === null) return
    const update = () => {
      const scrolls = page.scrollHeight > page.clientHeight
      if (scrolls && page.querySelector(FOCUSABLE) === null) page.setAttribute('tabindex', '0')
      else page.removeAttribute('tabindex')
    }
    update()
    const resized = new ResizeObserver(update)
    resized.observe(page)
    const changed = new MutationObserver(update)
    changed.observe(page, { childList: true, subtree: true })
    return () => {
      resized.disconnect()
      changed.disconnect()
    }
  }, [page])
  return (
    <div
      ref={setElement}
      data-liro-phone-frame=""
      style={{
        transform: 'translateZ(0)',
        width,
        height,
        maxWidth: '100%',
        // Clip, not hidden: a hidden overflow can still be scrolled by the browser (a focused
        // element brought into view), which moved the whole screen under its fixed overlays.
        overflow: 'clip',
        outline: '1px solid var(--liro-border-default)',
      }}
    >
      <div
        ref={setPage}
        data-liro-phone-page=""
        style={{
          height: '100%',
          overflow: 'auto',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
        }}
      >
        <ScreenContext value={screen}>
          <StoryProvider>{children}</StoryProvider>
        </ScreenContext>
      </div>
    </div>
  )
}

/**
 * The "English in right-to-left" stories (P3.6): an Arabic page whose texts fell back to English,
 * as when the application has no translation yet. Proves that each named text block takes its
 * direction from its content (unicode-bidi: plaintext) while the layout (`direction`) stays right
 * to left.
 */
export async function expectContentDirection(...elements: Element[]) {
  for (const element of elements) {
    await expect(getComputedStyle(element).unicodeBidi).toBe('plaintext')
    await expect(getComputedStyle(element).direction).toBe('rtl')
  }
}

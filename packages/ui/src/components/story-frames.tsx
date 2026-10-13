import type { ElementType, ReactNode } from 'react'
import { expect } from 'storybook/test'
import { createFormat, numericFormat } from '../provider/format'
import { LiroProvider, useLiro } from '../provider/liro-provider'

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

/**
 * The template and example stories (Phase 4): the story's locale (with the tenant's region, see
 * `tenantLocale`), direction and theme, the English interface text, but numbers, amounts and
 * numeric dates written as a Serbian tenant writes them (12.345,60 RSD, 06.10.2026.) — never its
 * month or weekday names (P5.28 item 2) — and a fixed today.
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
      {...(linkComponent === undefined ? {} : { linkComponent })}
    >
      {children}
    </LiroProvider>
  )
}

/**
 * A phone-sized frame (390 × 844px) whose overlays stay inside it. A handheld scanner's screen is
 * 360 × 740 (P5.11: `width={360} height={740}`).
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
  return (
    <div
      style={{
        transform: 'translateZ(0)',
        width,
        height,
        maxWidth: '100%',
        overflow: 'hidden',
        outline: '1px solid var(--liro-border-default)',
      }}
    >
      <StoryProvider>{children}</StoryProvider>
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

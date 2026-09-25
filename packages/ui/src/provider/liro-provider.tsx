import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from 'react'
import { Direction } from 'radix-ui'
import {
  createFormat,
  intlLocale,
  weekStartsOnForLocale,
  type LiroFormat,
  type Weekday,
} from './format'
import type { LiroMessages } from './messages'
import { messagesEn } from './messages.en'

/**
 * Everything that differs between applications, languages and customers (BUILD-PLAN section 5).
 * Every value has a default, so the Design System works on its own and in Storybook.
 */
export interface LiroProviderProps {
  /** BCP 47 tag, e.g. 'en', 'sr-Latn-RS', 'sr-Cyrl-RS', 'ar', 'ja'. Used for direction and formatting only. */
  locale: string
  /** Default: derived from `locale`. */
  direction?: 'ltr' | 'rtl'
  /** The Design System's own strings. English defaults for every key. */
  messages?: Partial<LiroMessages>
  /** Formatting and parsing. Intl-based defaults for `locale`; each member given here replaces the default. */
  format?: Partial<LiroFormat>
  /** The date "today" as YYYY-MM-DD. Default: the browser's local date. The Core passes the tenant's date. */
  today?: string
  /** 0 = Sunday … 6 = Saturday. Default: from the locale. */
  weekStartsOn?: Weekday
  /** Default: 'system', which follows the operating system. */
  colorScheme?: 'light' | 'dark' | 'system'
  /** Router link component, so navigation stays client-side. Default: <a>. */
  linkComponent?: ElementType
  children: ReactNode
}

export interface LiroContextValue {
  locale: string
  direction: 'ltr' | 'rtl'
  colorScheme: 'light' | 'dark'
  messages: LiroMessages
  format: LiroFormat
  /** YYYY-MM-DD. */
  today: string
  weekStartsOn: Weekday
  /** Renders links: the application's router link, or <a>. */
  linkComponent: ElementType
}

const RTL_SCRIPTS = new Set([
  'Arab',
  'Hebr',
  'Thaa',
  'Syrc',
  'Nkoo',
  'Adlm',
  'Rohg',
  'Mand',
  'Samr',
])

/** The writing direction of a locale, from its (likely) script. */
export function directionForLocale(locale: string): 'ltr' | 'rtl' {
  const script = new Intl.Locale(intlLocale(locale)).maximize().script
  return script !== undefined && RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr'
}

/** The local date of this device as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${String(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const DEFAULT_LOCALE = 'en'

const LiroContext = createContext<LiroContextValue | null>(null)

let fallback: LiroContextValue | undefined

/** The defaults outside any provider, built once; `today` follows the device's date. */
function defaultContext(): LiroContextValue {
  const today = localToday()
  if (fallback === undefined) {
    fallback = {
      locale: DEFAULT_LOCALE,
      direction: directionForLocale(DEFAULT_LOCALE),
      colorScheme: 'light',
      messages: messagesEn,
      format: createFormat(DEFAULT_LOCALE),
      today,
      weekStartsOn: weekStartsOnForLocale(DEFAULT_LOCALE),
      linkComponent: 'a',
    }
  } else if (fallback.today !== today) {
    fallback = { ...fallback, today }
  }
  return fallback
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystemScheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(
    subscribeToSystemScheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  )
}

/**
 * Wrap the application in it once. Sets `dir`, `lang` and the theme on a wrapper that adds no
 * box to the layout, and gives Radix primitives the same direction.
 */
export function LiroProvider({
  locale,
  direction,
  messages,
  format,
  today,
  weekStartsOn,
  colorScheme = 'system',
  linkComponent = 'a',
  children,
}: LiroProviderProps) {
  const systemPrefersDark = useSystemPrefersDark()
  const resolvedScheme =
    colorScheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : colorScheme
  const resolvedDirection = direction ?? directionForLocale(locale)
  const resolvedFormat = useMemo(() => createFormat(locale, format), [locale, format])
  const resolvedMessages = useMemo(() => ({ ...messagesEn, ...messages }), [messages])
  // Read once: a page left open past midnight keeps its date until the application passes one.
  const [deviceToday] = useState(localToday)
  const resolvedWeekStart = weekStartsOn ?? weekStartsOnForLocale(locale)

  const value = useMemo<LiroContextValue>(
    () => ({
      locale,
      direction: resolvedDirection,
      colorScheme: resolvedScheme,
      messages: resolvedMessages,
      format: resolvedFormat,
      today: today ?? deviceToday,
      weekStartsOn: resolvedWeekStart,
      linkComponent,
    }),
    [
      locale,
      resolvedDirection,
      resolvedScheme,
      resolvedMessages,
      resolvedFormat,
      today,
      deviceToday,
      resolvedWeekStart,
      linkComponent,
    ],
  )

  return (
    <LiroContext value={value}>
      <Direction.Provider dir={resolvedDirection}>
        {/* display: contents keeps the wrapper out of layout; dir, lang and the theme still inherit. */}
        <div
          dir={resolvedDirection}
          lang={locale}
          data-liro-theme={resolvedScheme}
          style={{ display: 'contents' }}
        >
          {children}
        </div>
      </Direction.Provider>
    </LiroContext>
  )
}

/** Everything the nearest LiroProvider carries, or the English defaults outside one. */
export function useLiro(): LiroContextValue {
  return useContext(LiroContext) ?? defaultContext()
}

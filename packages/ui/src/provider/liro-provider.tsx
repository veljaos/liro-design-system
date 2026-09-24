import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { createFormat, type LiroFormat } from './format'

/**
 * P0.3 subset of the provider of BUILD-PLAN section 5: locale, direction, colour scheme and
 * number formatting. P1.5 adds messages, dates, `today`, `weekStartsOn` and `linkComponent`.
 */
export interface LiroProviderProps {
  /** BCP 47 tag, e.g. 'en', 'sr-Latn-RS', 'sr-Cyrl-RS', 'ar', 'ja'. Used for direction and formatting only. */
  locale: string
  /** Default: derived from `locale`. */
  direction?: 'ltr' | 'rtl'
  /** Default: 'system', which follows the operating system. */
  colorScheme?: 'light' | 'dark' | 'system'
  /** Formatting. Intl-based defaults for `locale`; each member given here replaces the default. */
  format?: Partial<LiroFormat>
  children: ReactNode
}

export interface LiroContextValue {
  locale: string
  direction: 'ltr' | 'rtl'
  colorScheme: 'light' | 'dark'
  format: LiroFormat
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
  const script = new Intl.Locale(locale).maximize().script
  return script !== undefined && RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr'
}

const DEFAULT_LOCALE = 'en'

const LiroContext = createContext<LiroContextValue>({
  locale: DEFAULT_LOCALE,
  direction: directionForLocale(DEFAULT_LOCALE),
  colorScheme: 'light',
  format: createFormat(DEFAULT_LOCALE),
})

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

export function LiroProvider({
  locale,
  direction,
  colorScheme = 'system',
  format,
  children,
}: LiroProviderProps) {
  const systemPrefersDark = useSystemPrefersDark()
  const resolvedScheme =
    colorScheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : colorScheme
  const resolvedDirection = direction ?? directionForLocale(locale)
  const resolvedFormat = useMemo(() => createFormat(locale, format), [locale, format])

  const value = useMemo<LiroContextValue>(
    () => ({
      locale,
      direction: resolvedDirection,
      colorScheme: resolvedScheme,
      format: resolvedFormat,
    }),
    [locale, resolvedDirection, resolvedScheme, resolvedFormat],
  )

  return (
    <LiroContext value={value}>
      {/* display: contents keeps the wrapper out of layout; dir, lang and the theme still inherit. */}
      <div
        dir={resolvedDirection}
        lang={locale}
        data-liro-theme={resolvedScheme}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </LiroContext>
  )
}

/** Locale, direction, colour scheme and format of the nearest LiroProvider, or the English defaults. */
export function useLiro(): LiroContextValue {
  return useContext(LiroContext)
}

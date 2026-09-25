// Changing the accessibility settings in this file is a protected change (BUILD-PLAN rule 10).
import { LiroProvider, NUMBER_SCHEMES, type LiroFormat } from '@veljaos/ui'
import type { Decorator, Preview } from '@storybook/react-vite'
import { WCAG_TAGS } from './a11y'
import './preview.css'

const LOCALES = ['en', 'sr-Latn-RS', 'ar', 'ja'] as const
const MONEY_DECIMALS = ['0', '2', '4', '6'] as const

/**
 * A toolbar value, checked against its options. Globals arrive untyped, and Storybook turns a
 * numeric URL value (`globals=moneyDecimals:4`) into a number, so values are compared as strings.
 */
function pick<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  const text = typeof value === 'number' ? String(value) : value
  return options.find((option) => option === text) ?? fallback
}

const withLiroProvider: Decorator = (Story, { globals }) => {
  const locale = pick(globals.locale, LOCALES, 'en')
  const theme = pick(globals.theme, ['light', 'dark'], 'light')
  const direction = pick(globals.direction, ['auto', 'ltr', 'rtl'], 'auto')
  const numberScheme = pick(globals.numberScheme, ['locale', ...NUMBER_SCHEMES], 'locale')
  const moneyDecimals = Number(pick(globals.moneyDecimals, MONEY_DECIMALS, '2'))

  const format: Partial<LiroFormat> =
    numberScheme === 'locale' ? { moneyDecimals } : { moneyDecimals, numberScheme }

  return (
    <LiroProvider
      locale={locale}
      colorScheme={theme}
      format={format}
      {...(direction === 'auto' ? {} : { direction })}
    >
      <div className="min-h-dvh bg-surface-page p-4 text-text-primary">
        <Story />
      </div>
    </LiroProvider>
  )
}

const preview: Preview = {
  decorators: [withLiroProvider],
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Writing direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'auto', title: 'Direction from locale' },
          { value: 'ltr', title: 'Left to right' },
          { value: 'rtl', title: 'Right to left' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Format locale: formatting and direction only; story text stays English',
      toolbar: {
        title: 'Format locale',
        icon: 'globe',
        items: LOCALES.map((value) => ({ value, title: `Locale: ${value}` })),
        dynamicTitle: true,
      },
    },
    numberScheme: {
      description: 'Number separators',
      toolbar: {
        title: 'Number scheme',
        icon: 'listordered',
        items: [
          { value: 'locale', title: 'Number scheme from locale' },
          ...NUMBER_SCHEMES.map((value) => ({ value, title: `Numbers: ${value}` })),
        ],
        dynamicTitle: true,
      },
    },
    moneyDecimals: {
      description: 'Default decimals for money',
      toolbar: {
        title: 'Money decimals',
        icon: 'calendar',
        items: MONEY_DECIMALS.map((value) => ({ value, title: `Money decimals: ${value}` })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    direction: 'auto',
    locale: 'en',
    numberScheme: 'locale',
    moneyDecimals: '2',
  },
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        phone: { name: 'Phone', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        tablet: { name: 'Tablet', styles: { width: '820px', height: '1180px' }, type: 'tablet' },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
      },
    },
    a11y: {
      // WCAG 2.2 AA (see ./a11y.ts).
      options: {
        runOnly: {
          type: 'tag',
          values: WCAG_TAGS,
        },
      },
      // A violation fails the story (its storyFinished status is "error"), so the story tests fail.
      test: 'error',
    },
  },
}

export default preview

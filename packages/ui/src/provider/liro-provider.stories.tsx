import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/button'
import { LiroProvider, useLiro } from './liro-provider'

/** Typed input as a person might enter it, shown with what parseNumber and parseDate read. */
const TYPED_NUMBERS = ['1234.56', '1.234,56', '240.000', 'abc']
const TYPED_DATES = ['010326', '1.3.2026', '2026-03-01']

/**
 * Shows what the Storybook toolbar changes: theme (colours), direction (the Start and End
 * labels swap sides), format locale and number scheme (separators, currency position, dates,
 * names and the first day of the week), money decimals (digits after the separator) and viewport
 * (the frame width).
 */
function ToolbarSample() {
  const { locale, direction, colorScheme, format, messages, today, weekStartsOn, linkComponent } =
    useLiro()
  const LinkComponent = linkComponent
  const rows: [string, string][] = [
    ['Format locale', locale],
    ['Direction', direction],
    ['Theme', colorScheme],
    ['Number scheme', format.numberScheme],
    ['Money decimals', String(format.moneyDecimals)],
    ['Number', format.number('1234567.891')],
    ['Money', format.money('1234567.5', 'EUR')],
    ['Negative money', format.money('-42', 'RSD')],
    ['Money, 2 decimals, never rounded', format.money('1.567', 'EUR', { decimals: 2 })],
    ...TYPED_NUMBERS.map((text): [string, string] => [
      `Typed "${text}"`,
      format.parseNumber(text) ?? 'unreadable (null)',
    ]),
    ['Date', format.date('2026-03-01')],
    ['Date and time', format.dateTime('2026-03-01T14:05:00Z')],
    ...TYPED_DATES.map((text): [string, string] => [
      `Typed "${text}"`,
      format.parseDate(text) ?? 'unreadable (null)',
    ]),
    ['Today (fixed in this story)', `${today} · ${format.date(today)}`],
    ['Month', `${format.monthName(3, 'long')} · ${format.monthName(3, 'short')}`],
    ['Week starts on', format.weekdayName(weekStartsOn, 'long')],
    ['Message', messages['table.count'](12345, true)],
    ['Message', messages['table.count'](10000, false)],
  ]
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="flex justify-between">
        <span>Start</span>
        <span>End</span>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([term, value], index) => (
          <div key={`${term}-${String(index)}`} className="contents">
            <dt>{term}</dt>
            <dd className="m-0 text-end tabular-nums">
              {/* bdi keeps a value in its own direction: without it, right-to-left text moves
                  the minus sign and the currency to the wrong side. */}
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between">
        <LinkComponent href="#liro-provider" className="text-inherit underline">
          A link through linkComponent
        </LinkComponent>
        <Button>Save</Button>
      </div>
    </div>
  )
}

/**
 * Takes everything from the toolbar's provider and fixes `today`, so the screenshots do not
 * change with the date.
 */
function FixedToday() {
  const { locale, direction, colorScheme, format, messages, weekStartsOn } = useLiro()
  return (
    <LiroProvider
      locale={locale}
      direction={direction}
      colorScheme={colorScheme}
      format={format}
      messages={messages}
      weekStartsOn={weekStartsOn}
      today="2026-03-15"
    >
      <ToolbarSample />
    </LiroProvider>
  )
}

const meta = {
  title: 'Foundations/LiroProvider',
  parameters: {
    docs: {
      description: {
        component:
          'Carries everything that differs between applications, languages and customers: locale, ' +
          'direction, the Design System messages, number, money and date formatting and parsing, ' +
          '"today", the first day of the week, colour scheme and the link component. Wrap the ' +
          'application in it once; every value has a default. Every story is already wrapped, ' +
          'through the toolbar. Money and numbers are decimal strings: formatting never rounds, ' +
          'and unreadable input is null, never 0.',
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** Switch any toolbar global; each one visibly changes this sample. */
export const ToolbarGlobals: Story = {
  render: () => <FixedToday />,
}

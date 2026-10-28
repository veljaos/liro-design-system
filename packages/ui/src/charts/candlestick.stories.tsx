import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { CandlestickChart, type Candle, type CandlestickChartProps } from './candlestick'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'

/**
 * The euro's daily rate against the dinar on the company's bank's exchange office, September 2026
 * (invented): open, high, low and close of each working day, four decimals.
 */
function euroRates(): Candle[] {
  const days = [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30]
  const moves = [6, -4, 9, -2, -7, 3, 12, -5, -9, 4, 8, -3, -11, 6, 2, -6, 10, -4, 7, -2, -8, 5]
  const swings = [9, 7, 12, 5, 10, 6, 14, 8, 11, 7, 9, 6, 13, 8, 5, 9, 12, 7, 10, 6, 11, 8]
  let open = 11712
  return days.map((day, index) => {
    const close = open + (moves[index] ?? 0)
    const swing = swings[index] ?? 5
    const high = Math.max(open, close) + Math.ceil(swing / 2)
    const low = Math.min(open, close) - Math.floor(swing / 2)
    const text = (value: number) => (value / 100).toFixed(4)
    const candle: Candle = {
      key: `2026-09-${String(day).padStart(2, '0')}`,
      label: `${String(day).padStart(2, '0')}.09.`,
      open: text(open),
      high: text(high),
      low: text(low),
      close: text(close),
    }
    open = close
    return candle
  })
}

const RATES = euroRates()

const meta = {
  title: 'Charts/Candlestick',
  component: CandlestickChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a price that moves within each period — an exchange rate, a share — ' +
          'with its open, high, low and close.\n\n' +
          '**How:** `candles` (each with `open`, `high`, `low`, `close` as decimal strings), ' +
          '`currency` or `decimals`. A rising candle (the close at or above the open) is hollow, ' +
          'a falling one filled, in one colour: the shape says the direction, the legend names ' +
          'it. The plot is one Tab stop: the arrows move between the days and show the four ' +
          'prices. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** one value per period (LineChart); amounts to compare (BarChart).',
      },
    },
  },
  args: {
    title: 'EUR exchange rate',
    description: 'RSD for 1 EUR, buying rate, September 2026',
    candles: RATES,
    decimals: 4,
  },
  render: (args: CandlestickChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <CandlestickChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof CandlestickChart>

export default meta

type Story = StoryObj<typeof meta>

/** A month of working days: rising candles hollow, falling ones filled. */
export const Default: Story = {}

/** The last week only: wider bodies, at most 16px. */
export const OneWeek: Story = {
  name: 'One week',
  args: { candles: RATES.slice(-5), description: 'RSD for 1 EUR, 24–30 September 2026' },
}

/** "Show as table": the four prices of every day. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Phone width: four date labels, four ticks, the legend under the plot. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <CandlestickChart {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: an arrow reaches a day, shows its prices and announces them. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction', '!dev'],
  play: keysReachMarks,
}

/** Pressing "Show as table". */
export const AsTableInteraction: Story = {
  name: 'Show as table, interaction',
  tags: ['interaction', '!dev'],
  play: showTable,
}

/** A day without prices is a gap, never 0; loading, and an error with Retry. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-4">
        <CandlestickChart
          {...args}
          title="EUR exchange rate, a holiday"
          candles={RATES.map((candle, index) =>
            index === 9 ? { ...candle, open: null, high: null, low: null, close: null } : candle,
          )}
        />
        <CandlestickChart {...args} loading />
        <CandlestickChart {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

/** Arabic: time runs from the right, the value axis at the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <CandlestickChart
            {...args}
            title="سعر صرف اليورو"
            description="دينار مقابل يورو واحد، سبتمبر 2026"
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <div className="max-w-180">
          <CandlestickChart
            {...args}
            title="ユーロ為替レート"
            description="1ユーロあたりのディナール、2026年9月"
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** A long title and description wrap; the plot keeps its height. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    title: 'Euro exchange rate at the bank’s exchange office used for every foreign payment',
    description:
      'Dinars for one euro, buying rate as published each working day at 8:00, September 2026',
  },
}

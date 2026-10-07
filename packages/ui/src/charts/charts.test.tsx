import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { BarChart, defaultCurve, equalTicks } from './cartesian'
import { centreValueSize } from './centre'
import { ChartSeriesToggle } from './series-toggle'
import { DonutChart } from './pie'
import {
  categoricalColour,
  isEmptyChart,
  percentTick,
  plotValue,
  seriesColour,
  shortTick,
} from './shared'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

const serbian = createFormat('sr-Latn-RS')

describe('seriesColour', () => {
  it('gives the main series the brand blue and the rest greys by default', () => {
    expect(seriesColour({}, 0, 'default')).toBe('var(--liro-chart-main)')
    expect(seriesColour({}, 1, 'default')).toBe('var(--liro-chart-comparison)')
    expect(seriesColour({}, 2, 'default')).toBe('var(--liro-chart-other)')
    expect(seriesColour({ role: 'comparison' }, 0, 'default')).toBe('var(--liro-chart-comparison)')
  })
  it('uses a status colour when a series means a state, and the fixed categorical order', () => {
    expect(seriesColour({ tone: 'danger' }, 0, 'default')).toBe('var(--liro-status-danger-solid)')
    expect(seriesColour({}, 0, 'categorical')).toBe('var(--liro-chart-category1)')
    expect(seriesColour({}, 4, 'categorical')).toBe('var(--liro-chart-category5)')
  })
  it('never cycles the categorical hues: past the fifth, grey', () => {
    expect(categoricalColour(5)).toBe('var(--liro-chart-other)')
  })
})

describe('plotValue', () => {
  it('reads a decimal string for drawing only; unreadable, empty or missing is a gap', () => {
    expect(plotValue('5684.2')).toBe(5684.2)
    expect(plotValue('-1200.50')).toBe(-1200.5)
    expect(plotValue(null)).toBeNull()
    expect(plotValue('')).toBeNull()
    expect(plotValue('abc')).toBeNull()
  })
})

describe('isEmptyChart', () => {
  const series = [{ key: 'a' }]
  it('is empty without categories or without one readable value', () => {
    expect(isEmptyChart([], series, {})).toBe(true)
    expect(isEmptyChart([{ key: 'x', label: 'X' }], series, { a: { x: null } })).toBe(true)
  })
  it('is not empty with partial data (gaps)', () => {
    const categories = [
      { key: 'x', label: 'X' },
      { key: 'y', label: 'Y' },
    ]
    expect(isEmptyChart(categories, series, { a: { x: null, y: '0' } })).toBe(false)
  })
})

describe('shortTick', () => {
  it('writes ticks in full below 10,000 and short above, with the messages’ words', () => {
    expect(shortTick(1500, serbian, messagesEn)).toBe('1.500')
    expect(shortTick(12000, serbian, messagesEn)).toBe('12K')
    expect(shortTick(1500000, serbian, messagesEn)).toBe('1,5M')
    expect(shortTick(-2500000000, serbian, messagesEn)).toBe('-2,5B')
  })
  it('has no floating-point noise', () => {
    expect(shortTick(300000 * 3, serbian, messagesEn)).toBe('900K')
    expect(percentTick(0.7000000000000001, serbian)).toBe('70%')
  })
})

describe('charts', () => {
  const categories = [
    { key: 'q1', label: 'Q1' },
    { key: 'q2', label: 'Q2' },
  ]
  it('says "No data for this period" when there is nothing to draw', () => {
    const html = render(
      <BarChart
        title="Revenue"
        categories={categories}
        series={[{ key: 'r', label: 'Revenue' }]}
        values={{ r: { q1: null, q2: null } }}
      />,
    )
    expect(html).toContain('No data for this period')
    expect(html).not.toContain('Show as table')
  })
  it('draws a skeleton while loading, and the error with Retry', () => {
    const loading = render(
      <BarChart title="Revenue" categories={categories} series={[]} values={{}} loading />,
    )
    expect(loading).toContain('aria-busy="true"')
    expect(loading).toContain('data-slot="skeleton"')
    const failed = render(
      <BarChart
        title="Revenue"
        categories={categories}
        series={[]}
        values={{}}
        error={{ onRetry: () => undefined }}
      />,
    )
    expect(failed).toContain('The chart could not be loaded.')
    expect(failed).toContain('Retry')
  })
  it('names the profit and loss colours in the legend', () => {
    const html = render(
      <BarChart
        title="Result"
        categories={categories}
        series={[{ key: 'r', label: 'Result' }]}
        values={{ r: { q1: '120.00', q2: '-40.00' } }}
        signTones={{ positive: 'Profit', negative: 'Loss' }}
      />,
    )
    expect(html).toContain('Profit')
    expect(html).toContain('Loss')
  })
  it('shows a donut’s legend instead of labels when the labels are off', () => {
    const html = render(
      <DonutChart
        title="Receivables"
        labels="none"
        slices={[
          { key: 'a', label: 'Not due', value: '100', share: '62,4%' },
          { key: 'b', label: 'Overdue', value: '60', share: '37,6%', tone: 'danger' },
        ]}
      />,
    )
    expect(html).toContain('data-slot="chart-legend"')
    expect(html).toContain('Not due 62,4%')
  })
})

describe('ChartSeriesToggle', () => {
  it('presses the chosen series', () => {
    const html = render(
      <ChartSeriesToggle
        label="Series shown"
        items={[
          { key: 'a', label: 'Sales', total: '1.234,00' },
          { key: 'b', label: 'Purchases' },
        ]}
        value={['a']}
        onValueChange={() => undefined}
      />,
    )
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*Sales/)
    expect(html).toContain('aria-pressed="false"')
  })
})

describe('centreValueSize', () => {
  it('keeps 20px when the value fits the hole, shrinks a long one, never below 12px', () => {
    expect(centreValueSize('96,4', 70)).toBe(20)
    expect(centreValueSize('2.952.160,50 RSD', 70)).toBe(12)
    expect(centreValueSize('421.740,00 RSD', 92)).toBe(18)
    expect(centreValueSize('12.345.678.901,00 RSD', 40)).toBe(12)
  })
})

describe('defaultCurve and equalTicks (P4.7c)', () => {
  it('draws straight segments up to 31 points and smooth ones beyond', () => {
    expect(defaultCurve(6)).toBe('linear')
    expect(defaultCurve(31)).toBe('linear')
    expect(defaultCurve(92)).toBe('monotone')
  })
  it('keeps every category when they fit, else equal steps ending on the last', () => {
    expect(equalTicks(['a', 'b', 'c'], 8)).toEqual(['a', 'b', 'c'])
    const days = Array.from({ length: 30 }, (_, index) => index)
    const ticks = equalTicks(days, 8)
    expect(ticks.at(-1)).toBe(29)
    const steps = ticks.slice(1).map((tick, index) => tick - (ticks[index] ?? 0))
    expect(new Set(steps).size).toBe(1)
    expect(ticks.length).toBeLessThanOrEqual(8)
  })
})

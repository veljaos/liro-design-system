import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { CandlestickChart } from './candlestick'
import { FunnelChart } from './funnel'
import { Heatmap } from './heatmap'
import { MatrixChart } from './matrix'
import { SankeyChart } from './sankey'
import { ScatterChart } from './scatter'
import { Treemap } from './treemap'

/*
 * The charts whose marks are reached one by one (P5.93 item 44), rendered on a server: their card,
 * legend and table. The marks themselves are drawn once the plot is measured (in a browser: the
 * stories' play functions check the keys and the tooltip).
 */

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('CandlestickChart', () => {
  const candles = [
    { key: 'a', label: '01.09.', open: '117.12', high: '117.18', low: '117.08', close: '117.15' },
    { key: 'b', label: '02.09.', open: null, high: null, low: null, close: null },
  ]
  it('names rising and falling candles in the legend', () => {
    const html = render(<CandlestickChart title="EUR" candles={candles} />)
    expect(html).toContain('Rising')
    expect(html).toContain('Falling')
  })
  it('writes the four prices in its table, "—" for a day without them', () => {
    const html = render(
      <CandlestickChart title="EUR" candles={candles} decimals={2} defaultView="table" />,
    )
    expect(html).toContain('<table')
    expect(html).toContain('117.12')
    expect(html).toContain('—')
  })
  it('puts the application’s toggle in the interactive header', () => {
    const html = render(
      <CandlestickChart title="EUR" candles={candles} toggle={<span>Key figures</span>} />,
    )
    expect(html).toContain('Key figures')
  })
  it('says "No data" when no candle can be drawn', () => {
    const html = render(<CandlestickChart title="EUR" candles={candles.slice(1)} />)
    expect(html).toContain('No data for this period')
  })
})

describe('Heatmap', () => {
  const props = {
    title: 'Sales',
    rows: [{ key: 'mon', label: 'Mon' }],
    columns: [
      { key: '08', label: '08:00' },
      { key: '09', label: '09:00' },
    ],
    values: { mon: { '08': '120', '09': null } },
    valueLabel: 'Sales',
    breaks: ['100'],
  }
  it('names its steps through format and hatches "No data", never 0', () => {
    const html = render(<Heatmap {...props} />)
    expect(html).toContain('Under 100')
    expect(html).toContain('100 and more')
    expect(html).toContain('No data')
  })
  it('takes the application’s words for the steps', () => {
    const html = render(<Heatmap {...props} stepLabels={['Quiet', 'Busy']} />)
    expect(html).toContain('Quiet')
    expect(html).toContain('Busy')
  })
  it('shows the rows and columns as a table', () => {
    const html = render(<Heatmap {...props} defaultView="table" />)
    expect(html).toContain('<table')
    expect(html).toContain('120')
  })
})

describe('MatrixChart', () => {
  it('names the levels and lists each cell’s items in its table', () => {
    const html = render(
      <MatrixChart
        title="Risks"
        rows={[{ key: 'h', label: 'High' }]}
        columns={[{ key: 'm', label: 'Moderate' }]}
        rowLabel="Likelihood"
        columnLabel="Impact"
        levels={[{ key: 'critical', label: 'Critical', tone: 'danger' }]}
        cellLevels={{ h: { m: 'critical' } }}
        items={[{ key: 'r1', label: 'Warehouse fire', row: 'h', column: 'm' }]}
        defaultView="table"
      />,
    )
    expect(html).toContain('Critical')
    expect(html).toContain('Warehouse fire')
    expect(html).toContain('Likelihood')
  })
})

describe('FunnelChart, ScatterChart, SankeyChart and Treemap', () => {
  it('show their values as tables', () => {
    const funnel = render(
      <FunnelChart
        title="Pipeline"
        valueLabel="Deals"
        shareLabel="Of leads"
        stages={[{ key: 'a', label: 'Leads', value: '1240', share: '100%' }]}
        defaultView="table"
      />,
    )
    expect(funnel).toContain('Of leads')
    expect(funnel).toContain('100%')
    const scatter = render(
      <ScatterChart
        title="Price"
        x={{ label: 'Price', currency: 'RSD' }}
        y={{ label: 'Margin', percent: true }}
        series={[
          { key: 's', label: 'Tiles', points: [{ key: 'p', label: 'Tile', x: '10', y: '5' }] },
        ]}
        defaultView="table"
      />,
    )
    expect(scatter).toContain('Margin')
    expect(scatter).toContain('5%')
    const sankey = render(
      <SankeyChart
        title="Cash"
        nodes={[
          { key: 'a', label: 'Sales' },
          { key: 'b', label: 'Bank' },
        ]}
        flows={[{ source: 'a', target: 'b', value: '100' }]}
        defaultView="table"
      />,
    )
    expect(sankey).toContain('From')
    expect(sankey).toContain('Bank')
    const treemap = render(
      <Treemap
        title="Costs"
        items={[
          {
            key: 'g',
            label: 'Services',
            value: '30',
            children: [{ key: 'r', label: 'Rent', value: '30', share: '12%' }],
          },
        ]}
        shareLabel="Share"
        defaultView="table"
      />,
    )
    expect(treemap).toContain('Rent')
    expect(treemap).toContain('12%')
  })
})

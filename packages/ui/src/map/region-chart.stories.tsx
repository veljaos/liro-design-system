import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import {
  ARABIC_REVENUE,
  CAPITAL_OFFICES,
  COUNTRY_REVENUE,
  JAPANESE_REVENUE,
  mapReady,
  REVENUE_BREAKS,
} from './map-story-data'
import { RegionChart } from './region-chart'

const meta = {
  title: 'Components/Map/Region chart',
  component: RegionChart,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/map` — a chart of areas: **a choropleth**, each area coloured by the step ' +
          'its value falls in, with an optional point or bubble per place. The charts’ card, ' +
          'tooltip, “Show as table” and states (`@veljaos/ui/charts`), drawn on the map subpath’s ' +
          'SVG map without tiles.\n\n' +
          '**What for:** one figure across places — revenue by country for a group working in ' +
          'several countries, sales by region, customers by municipality.\n\n' +
          '**Values** are decimal strings: the step is found by comparing them exactly with the ' +
          'application’s `breaks` (n breaks, n + 1 steps, at most five); nothing is added or ' +
          'rounded. **Colours** are one meaning in shades — the charts’ main blue, or neutral ' +
          '(`ramp="neutral"`) — never a rainbow or a status colour. An area **without a value is ' +
          'hatched and says “No data”**, never 0. The legend writes each step’s range through ' +
          '`format`, or the application’s words (`stepLabels`).\n\n' +
          '**Keyboard:** Tab to the map; the arrows move between the areas in reading order and ' +
          'show the tooltip; Enter chooses (a neutral line, D17); Escape hides it. “Show as table” ' +
          'is the screen reader’s way. The map is never mirrored in right-to-left.\n\n' +
          '**Geometry** is the application’s GeoJSON. These stories use Natural Earth’s 1:110m ' +
          'countries (`world-atlas`, a development dependency only).\n\n' +
          '**When not:** a value over time (a line or bar chart); choosing among areas (AreaMap); ' +
          'more than five steps of precision (the table).',
      },
    },
  },
  args: {
    title: 'Revenue by country',
    description: 'January to September 2026, EUR',
    valueLabel: 'Revenue',
    areas: COUNTRY_REVENUE,
    breaks: REVENUE_BREAKS,
    currency: 'EUR',
    decimals: 0,
    className: 'max-w-180',
  },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
  },
} satisfies Meta<typeof RegionChart>

export default meta

type Story = StoryObj<typeof meta>

/** Seven countries in five shades of blue; Albania has no figure yet: hatched, "No data". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Revenue by country' })).toBeVisible()
    await expect(canvas.getByRole('region', { name: 'Map: Revenue by country' })).toHaveAttribute(
      'tabindex',
      '0',
    )
    await expect(canvasElement.querySelector('[data-slot="chart-legend"]')).toHaveTextContent(
      'No data',
    )
  },
}

/** Neutral shades, for a figure that is not the screen's main one. */
export const Neutral: Story = {
  args: { ramp: 'neutral', description: 'Neutral ramp' },
}

/** Places as bubbles sized by their own value; listed in the table. */
export const WithBubbles: Story = {
  name: 'With bubbles',
  args: { places: CAPITAL_OFFICES, placeLabel: 'Offices (bubble: their revenue)' },
}

/** Places without values are points. */
export const WithPoints: Story = {
  name: 'With points',
  args: {
    places: CAPITAL_OFFICES.map((place) => ({
      id: place.id,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
    })),
    placeLabel: 'Offices',
  },
}

/** The steps in the application's words. */
export const StepLabels: Story = {
  name: 'Step labels',
  args: {
    breaks: ['500000', '2000000'],
    stepLabels: ['Small market', 'Growing market', 'Main market'],
  },
}

/** A chosen area keeps its fill and takes the neutral selected line. */
export const Chosen: Story = {
  args: { defaultSelected: 'serbia' },
}

/** The keyboard: the arrows move in reading order, show the tooltip and announce; Enter chooses. */
export const Keyboard: Story = {
  tags: ['interaction'],
  args: { onSelect: fn() },
  play: async ({ canvasElement, args }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    canvas.getByRole('region', { name: 'Map: Revenue by country' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector('[data-slot="region-chart-tooltip"]'),
      ).toHaveTextContent('Hungary')
    })
    await expect(canvas.getByRole('status')).toHaveTextContent('Hungary:')
    // Forward through the reading order to the area without a figure.
    const tooltip = () => canvasElement.querySelector('[data-slot="region-chart-tooltip"]')
    for (let step = 0; step < 8 && tooltip()?.textContent.includes('Albania') !== true; step++) {
      await userEvent.keyboard('{ArrowDown}')
    }
    await expect(tooltip()).toHaveTextContent('Albania')
    await expect(tooltip()).toHaveTextContent('No data')
    await userEvent.keyboard('{Enter}')
    await expect(args.onSelect).toHaveBeenCalledWith('albania')
    await userEvent.keyboard('{Escape}')
    await expect(canvasElement.querySelector('[data-slot="region-chart-tooltip"]')).toBeNull()
  },
}

/** The values as a table: the screen reader's way. Missing values say "No data". */
export const AsTable: Story = {
  name: 'As a table',
  args: { defaultView: 'table', places: CAPITAL_OFFICES, placeLabel: 'Offices' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('rowheader', { name: 'Albania' })).toBeVisible()
    await expect(canvas.getAllByRole('table')).toHaveLength(2)
    await expect(canvasElement).toHaveTextContent('No data')
  },
}

export const Loading: Story = {
  args: { loading: true },
}

export const Failed: Story = {
  args: {
    error: {
      onRetry: () => {
        // The application loads the figures again.
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Retry' })).toBeVisible()
  },
}

/** No figure at all: the charts' empty state. */
export const Empty: Story = {
  args: { areas: COUNTRY_REVENUE.map((area) => ({ ...area, value: null })) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('No data for this period')
  },
}

/** Long names: whole in the tooltip and the table; on the map left out where they do not fit. */
export const LongNames: Story = {
  name: 'Long names',
  args: {
    title:
      'Revenue by country of the customer’s registered seat, all business lines, before discounts',
    areas: COUNTRY_REVENUE.map((area) => ({
      ...area,
      name: `${area.name} (including the branches and the representative offices)`,
    })),
  },
}

/** A phone: the legend under the map. */
export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <RegionChart {...args} className="" places={CAPITAL_OFFICES} placeLabel="Offices" />
      </div>
    </PhoneFrame>
  ),
}

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <RegionChart
        className="max-w-180"
        title="الإيرادات حسب البلد"
        description="يناير إلى سبتمبر 2026، باليورو"
        valueLabel="الإيرادات"
        areas={ARABIC_REVENUE}
        breaks={REVENUE_BREAKS}
        currency="EUR"
        decimals={0}
      />
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <RegionChart
        className="max-w-180"
        title="国別の売上"
        description="2026年1月〜9月、ユーロ"
        valueLabel="売上"
        areas={JAPANESE_REVENUE}
        breaks={REVENUE_BREAKS}
        currency="EUR"
        decimals={0}
      />
    </StoryProvider>
  ),
}

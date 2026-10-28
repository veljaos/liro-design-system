import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { RegionChart, type RegionChartArea, type RegionChartPlace } from './region-chart'
import {
  loadSerbiaBoundaries,
  serbiaChildren,
  type SerbiaArea,
  type SerbiaBoundaries,
  type SerbiaLevel,
} from './serbia'

/*
 * Maps of Serbia (P5.93 item 43): RegionChart on the boundaries `@veljaos/ui/map` ships, loaded on
 * demand by level. Invented sales of Kvadrat Gradnja d.o.o., January–September 2026, in millions
 * of RSD; Kosovo and Metohija is part of Serbia (D31), hatched "No data" because the company has
 * no sales recorded there.
 */

/** Waits until the boundaries have loaded and the map is drawn (its attribution is shown). */
async function serbiaReady(canvasElement: HTMLElement): Promise<void> {
  await waitFor(
    async () => {
      await expect(
        canvasElement.querySelector(
          '[data-slot="region-chart"][data-ready] [data-slot="map-attribution"]',
        ),
      ).not.toBeNull()
    },
    { timeout: 10_000 },
  )
}

/** A level's boundaries, loaded once (the application's own loading). */
function useSerbia(level: SerbiaLevel): SerbiaBoundaries | null {
  const [loaded, setLoaded] = useState<SerbiaBoundaries | null>(null)
  useEffect(() => {
    let live = true
    void loadSerbiaBoundaries(level).then((boundaries) => {
      if (live) setLoaded(boundaries)
    })
    return () => {
      live = false
    }
  }, [level])
  return loaded?.level === level ? loaded : null
}

/** A repeatable invented figure per area, in millions of RSD with one decimal (as the Core sends). */
function sales(id: string, scale: number): string {
  let hash = 7
  for (const character of id) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 10007
  const big = id === 'beograd' || id === 'RS-00' ? 6 : id === 'vojvodina' || id === 'RS-06' ? 3 : 1
  return ((((hash % 900) + 100) / 10) * scale * big).toFixed(1)
}

function withSales(areas: readonly SerbiaArea[], scale: number, english = true): RegionChartArea[] {
  return areas.map((area) => ({
    id: area.id,
    name: english ? area.nameEn : area.name,
    geometry: area.geometry,
    value: area.id === 'RS-KM' || area.id === 'kosovo-metohija' ? null : sales(area.id, scale),
  }))
}

const BREAKS: Record<SerbiaLevel, string[]> = {
  region: ['100', '200', '400', '800'],
  district: ['30', '60', '120', '240'],
  municipality: ['5', '10', '20', '40'],
}
const SCALE: Record<SerbiaLevel, number> = { region: 2, district: 1, municipality: 0.2 }

/** The company's sales offices, as bubbles by their own sales. */
const OFFICES: RegionChartPlace[] = [
  { id: 'bg', name: 'Beograd', lat: 44.8125, lng: 20.4612, value: '412.6' },
  { id: 'ns', name: 'Novi Sad', lat: 45.2671, lng: 19.8335, value: '184.2' },
  { id: 'ni', name: 'Niš', lat: 43.3209, lng: 21.8958, value: '96.8' },
  { id: 'kg', name: 'Kragujevac', lat: 44.0128, lng: 20.9114, value: '71.4' },
  { id: 'su', name: 'Subotica', lat: 46.1, lng: 19.6658, value: '38.9' },
  { id: 'ca', name: 'Čačak', lat: 43.8914, lng: 20.3497, value: '42.1' },
  { id: 'vr', name: 'Vranje', lat: 42.5514, lng: 21.9003, value: '18.5' },
]

function SerbiaChart({
  level,
  english = true,
  title,
  description,
  valueLabel = 'Sales',
  places,
  defaultView,
  phone,
}: {
  level: SerbiaLevel
  english?: boolean
  title: string
  description: string
  valueLabel?: string
  places?: RegionChartPlace[]
  defaultView?: 'chart' | 'table'
  phone?: boolean
}) {
  const data = useSerbia(level)
  return (
    <RegionChart
      title={title}
      description={description}
      valueLabel={valueLabel}
      areas={data === null ? [] : withSales(data.areas, SCALE[level], english)}
      breaks={BREAKS[level]}
      loading={data === null}
      {...(data === null ? {} : { attribution: data.attribution })}
      {...(places === undefined ? {} : { places, placeLabel: 'Sales offices' })}
      {...(defaultView === undefined ? {} : { defaultView })}
      {...(phone === undefined ? {} : { layout: phone ? 'phone' : 'desktop' })}
      decimals={1}
      className="max-w-180"
    />
  )
}

/** Region → district → city or municipality: choosing an area opens the level under it. */
function DrillDown({ phone = false }: { phone?: boolean }) {
  const [trail, setTrail] = useState<SerbiaArea[]>([])
  const level: SerbiaLevel =
    trail.length === 0 ? 'region' : trail.length === 1 ? 'district' : 'municipality'
  const data = useSerbia(level)
  const parent = trail[trail.length - 1]
  const areas =
    data === null ? [] : parent === undefined ? data.areas : serbiaChildren(data.areas, parent.id)
  return (
    <RegionChart
      title="Sales in Serbia"
      description={['Serbia', ...trail.map((area) => area.nameEn)].join(' › ')}
      valueLabel="Sales"
      areas={withSales(areas, SCALE[level])}
      breaks={BREAKS[level]}
      loading={data === null}
      {...(data === null ? {} : { attribution: data.attribution })}
      decimals={1}
      layout={phone ? 'phone' : 'desktop'}
      className={phone ? '' : 'max-w-180'}
      selected={null}
      onSelect={(id) => {
        const area = areas.find((each) => each.id === id)
        if (area !== undefined && level !== 'municipality') setTrail([...trail, area])
      }}
      controls={
        trail.length > 0 ? (
          <Button
            intent="back"
            emphasis="secondary"
            label={trail.length === 1 ? 'Back to regions' : 'Back to districts'}
            onClick={() => {
              setTrail(trail.slice(0, -1))
            }}
          />
        ) : undefined
      }
    />
  )
}

const meta = {
  title: 'Charts/Map/Serbia',
  component: RegionChart,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/map` — **maps of Serbia** by statistical region, district (okrug) and ' +
          'city or municipality: RegionChart (choropleth and bubbles, legend, "Show as table", ' +
          'tooltips, "No data" hatching) on the boundaries the package ships.\n\n' +
          '**How:** `loadSerbiaBoundaries(level)` loads one level on first use (regions 8 KB, ' +
          'districts 17 KB, cities and municipalities 51 KB) and returns its `areas` (id, Serbian ' +
          'and English name, `parent` one level up, GeoJSON) and the `attribution` to pass to ' +
          'RegionChart; `serbiaChildren(areas, parentId)` drills down. Districts carry their ' +
          'ISO 3166-2:RS codes.\n\n' +
          '**Source:** geoBoundaries, from OpenStreetMap (© OpenStreetMap contributors, ODbL), ' +
          'simplified; never GADM. **Kosovo and Metohija is part of Serbia** (D31): the Region ' +
          'Kosovo and Metohija among the regions and the Autonomous Province among the districts ' +
          'and municipalities; its districts and municipalities as Serbian law defines them have ' +
          'no open boundaries, so an application with the official geometry passes its own.\n\n' +
          '**When not:** values over time (LineChart); exact comparison (BarChart, the table).',
      },
    },
  },
  args: {
    title: 'Sales by region',
    valueLabel: 'Sales',
    areas: [],
    breaks: BREAKS.region,
  },
  play: async ({ canvasElement }) => {
    await serbiaReady(canvasElement)
  },
} satisfies Meta<typeof RegionChart>

export default meta

type Story = StoryObj<typeof meta>

/** The five statistical regions; Kosovo and Metohija hatched "No data". */
export const ByRegion: Story = {
  name: 'By region',
  render: () => (
    <SerbiaChart
      level="region"
      title="Sales by region"
      description="January–September 2026, millions of RSD"
    />
  ),
}

/** The districts (okrug), with the sales offices as bubbles. */
export const ByDistrict: Story = {
  name: 'By district, with bubbles',
  render: () => (
    <SerbiaChart
      level="district"
      title="Sales by district"
      description="January–September 2026, millions of RSD"
      places={OFFICES}
    />
  ),
}

/** The 145 cities and municipalities. */
export const ByMunicipality: Story = {
  name: 'By city and municipality',
  render: () => (
    <SerbiaChart
      level="municipality"
      title="Sales by city and municipality"
      description="January–September 2026, millions of RSD"
    />
  ),
}

/** Drill-down: a region opens its districts, a district its cities and municipalities. */
export const DrillDownStory: Story = {
  name: 'Drill-down',
  render: () => <DrillDown />,
}

/** The keys drill down: Enter on a region opens its districts; Back returns. */
export const DrillDownInteraction: Story = {
  name: 'Drill-down, interaction',
  tags: ['interaction', '!dev'],
  render: () => <DrillDown />,
  play: async ({ canvasElement }) => {
    await serbiaReady(canvasElement)
    const canvas = within(canvasElement)
    const map = canvas.getByRole('region', { name: 'Map: Sales in Serbia' })
    map.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    const back = await canvas.findByRole('button', { name: 'Back to regions' })
    await waitFor(async () => {
      await expect(canvas.getByText(/^Serbia › /)).toBeVisible()
    })
    await userEvent.click(back)
    await waitFor(async () => {
      await expect(canvas.queryByRole('button', { name: 'Back to regions' })).toBeNull()
    })
  },
}

/** "Show as table": every district with its sales, "No data" for the province. */
export const AsTable: Story = {
  name: 'Show as table',
  tags: ['!dev'],
  render: () => (
    <SerbiaChart
      level="district"
      title="Sales by district"
      description="January–September 2026, millions of RSD"
      defaultView="table"
    />
  ),
  play: async ({ canvasElement }) => {
    await waitFor(
      async () => {
        await expect(within(canvasElement).getByRole('table')).toBeVisible()
      },
      { timeout: 10_000 },
    )
  },
}

/** Phone width: the map full width, the legend under it. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <DrillDown phone />
      </div>
    </PhoneFrame>
  ),
}

/** Serbian names, from the data. */
export const SerbianNames: Story = {
  name: 'Serbian names',
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="sr-Latn-RS">
      <SerbiaChart
        level="district"
        english={false}
        title="Prodaja po okruzima"
        description="Januar–septembar 2026, miliona dinara"
        valueLabel="Prodaja"
      />
    </StoryProvider>
  ),
}

/** Arabic: the card, legend and table right to left; the map never mirrored. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ar">
      <SerbiaChart
        level="region"
        title="المبيعات حسب المنطقة"
        description="يناير – سبتمبر 2026، ملايين الدنانير"
        valueLabel="المبيعات"
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ja">
      <SerbiaChart
        level="region"
        title="地域別売上"
        description="2026年1月〜9月、百万ディナール"
        valueLabel="売上"
      />
    </StoryProvider>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { RegionChart, type RegionChartArea, type RegionChartPlace } from './region-chart'
import {
  loadSerbiaBoundaries,
  loadSerbiaChildren,
  type SerbiaArea,
  type SerbiaBoundaries,
  type SerbiaDrillStep,
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

function withSales(
  areas: readonly SerbiaArea[],
  scale: number,
  english = true,
  drill = false,
): RegionChartArea[] {
  return areas.map((area) => ({
    id: area.id,
    name: english ? area.nameEn : area.name,
    geometry: area.geometry,
    value: area.id === 'RS-KM' || area.id === 'kosovo-metohija' ? null : sales(area.id, scale),
    // In a drill-down only an area with a level under it can be chosen (P5.94 item 1).
    ...(drill ? { choosable: area.hasLowerLevel } : {}),
  }))
}

const BREAKS: Record<SerbiaLevel, string[]> = {
  region: ['100', '200', '400', '800'],
  district: ['30', '60', '120', '240'],
  municipality: ['5', '10', '20', '40'],
  'city-municipality': ['10', '20', '40', '80'],
}
const SCALE: Record<SerbiaLevel, number> = {
  region: 2,
  district: 1,
  municipality: 0.2,
  'city-municipality': 0.5,
}

/** "Back to …": the level the user came from. */
const BACK_TO: Record<SerbiaLevel, string> = {
  region: 'Back to regions',
  district: 'Back to districts',
  municipality: 'Back to cities and municipalities',
  'city-municipality': 'Back to city municipalities',
}

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

/** One opened area: what was chosen, on which level, and what opened under it. */
interface Opened {
  area: SerbiaArea
  level: SerbiaLevel
  step: SerbiaDrillStep
}

/** The trail with one more area opened under `level`, or null when it has no level under it. */
async function open(
  path: readonly Opened[],
  level: SerbiaLevel,
  area: SerbiaArea,
): Promise<Opened[] | null> {
  const step = await loadSerbiaChildren(level, area.id)
  return step === null ? null : [...path, { area, level, step }]
}

/**
 * Region → district → city or municipality → city municipality (P5.94 item 1): choosing an area
 * opens the level under it (`loadSerbiaChildren`, which skips a level with one area: the Belgrade
 * Region opens its 17 city municipalities at once). An area with no level under it is the last
 * level: not choosable (no pointer cursor, Enter does nothing).
 */
function DrillDown({
  phone = false,
  start = [],
}: {
  phone?: boolean
  /** Areas to open at first, from the regions down (by id). */
  start?: readonly string[]
}) {
  const regions = useSerbia('region')
  const [trail, setTrail] = useState<Opened[]>([])
  const [opening, setOpening] = useState(start.length > 0)
  const startKey = start.join(' ')
  // The story's starting point: open the given areas one after another.
  useEffect(() => {
    if (regions === null || startKey === '') return
    const run = { live: true }
    void (async () => {
      let path: Opened[] = []
      let areas: readonly SerbiaArea[] = regions.areas
      let level: SerbiaLevel = 'region'
      for (const id of startKey.split(' ')) {
        const area = areas.find((each) => each.id === id)
        if (area === undefined) break
        const next = await open(path, level, area)
        const last = next?.[next.length - 1]
        if (next === null || last === undefined) break
        path = next
        areas = last.step.areas
        level = last.step.level
      }
      if (run.live) {
        setTrail(path)
        setOpening(false)
      }
    })()
    return () => {
      run.live = false
    }
  }, [regions, startKey])
  const last = trail[trail.length - 1]
  const level: SerbiaLevel = last === undefined ? 'region' : last.step.level
  const areas = last === undefined ? (regions?.areas ?? []) : last.step.areas
  const loading = regions === null || opening
  const attribution = last === undefined ? regions?.attribution : last.step.attribution
  const shown = (each: Opened) => each.step.through[each.step.through.length - 1] ?? each.area
  return (
    <RegionChart
      title="Sales in Serbia"
      description={['Serbia', ...trail.map((each) => shown(each).nameEn)].join(' › ')}
      valueLabel="Sales"
      areas={loading ? [] : withSales(areas, SCALE[level], true, true)}
      breaks={BREAKS[level]}
      loading={loading}
      {...(attribution === undefined ? {} : { attribution })}
      decimals={1}
      layout={phone ? 'phone' : 'desktop'}
      className={phone ? '' : 'max-w-180'}
      selected={null}
      onSelect={(id) => {
        const area = areas.find((each) => each.id === id)
        if (area?.hasLowerLevel !== true) return
        setOpening(true)
        void open(trail, level, area).then((next) => {
          if (next !== null) setTrail(next)
          setOpening(false)
        })
      }}
      controls={
        last !== undefined ? (
          <Button
            intent="back"
            emphasis="secondary"
            label={BACK_TO[last.level]}
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
          '`@veljaos/ui/map` — **maps of Serbia** by statistical region, district (okrug), ' +
          'city or municipality, and city municipality (gradska opština): RegionChart ' +
          '(choropleth and bubbles, legend, "Show as table", tooltips, "No data" hatching) on ' +
          'the boundaries the package ships.\n\n' +
          '**How:** `loadSerbiaBoundaries(level)` loads one level on first use (regions 8 KB, ' +
          'districts 17 KB, cities and municipalities 51 KB, city municipalities 19 KB) and ' +
          'returns its `areas` (id, Serbian and English name, `parent` one level up, ' +
          '`hasLowerLevel`, GeoJSON) and the `attribution` to pass to RegionChart. ' +
          '`loadSerbiaChildren(level, id)` opens the level under an area for a drill-down, ' +
          'skipping a level with a single area (the Belgrade Region opens its 17 city ' +
          'municipalities at once). Districts carry their ISO 3166-2:RS codes.\n\n' +
          '**Drill-down:** only an area with a level under it is choosable (`choosable: ' +
          'area.hasLowerLevel`); the last level has no pointer cursor and Enter does nothing. ' +
          'City municipalities exist in the data for Belgrade (17), Niš (5), Požarevac, Užice and ' +
          'Vranje (2 each).\n\n' +
          '**Source:** geoBoundaries and, for the city municipalities, OpenStreetMap itself ' +
          '(© OpenStreetMap contributors, ODbL), simplified; never GADM. The attribution is ' +
          'always written under the map. **Kosovo and Metohija is part of Serbia** (D31): the Region ' +
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

/**
 * Drill-down: a region opens its districts, a district its cities and municipalities, a divided
 * city its city municipalities.
 */
export const DrillDownStory: Story = {
  name: 'Drill-down',
  render: () => <DrillDown />,
}

/** The fourth level: Belgrade's 17 city municipalities, the last level (nothing to choose). */
export const BelgradeCityMunicipalities: Story = {
  name: 'Drill-down, Belgrade’s city municipalities',
  render: () => <DrillDown start={['beograd']} />,
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

/**
 * The last level (P5.94 item 1): in the Nišava District only Niš opens (its city municipalities);
 * every other municipality has no pointer cursor and does nothing; inside Niš nothing opens.
 */
export const DrillDownLastLevel: Story = {
  name: 'Drill-down, the last level, interaction',
  tags: ['interaction', '!dev'],
  render: () => <DrillDown start={['juzna-istocna-srbija', 'RS-20']} />,
  play: async ({ canvasElement }) => {
    await serbiaReady(canvasElement)
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(
        canvas.getByText('Serbia › Southern and Eastern Serbia Region › Nišava District'),
      ).toBeVisible()
    })
    const areas = () => [...canvasElement.querySelectorAll<SVGPathElement>('path.liro-map-area')]
    const choosable = areas().filter((path) => !path.classList.contains('is-static'))
    await expect(choosable).toHaveLength(1)
    // The last level has no pointer cursor; Niš, which opens, has one.
    for (const path of areas()) {
      const pointer = getComputedStyle(path).cursor === 'pointer'
      await expect(pointer).toBe(!path.classList.contains('is-static'))
    }
    const city = choosable[0]
    if (city === undefined) throw new Error('Niš is not choosable')
    await userEvent.click(city)
    await canvas.findByRole('button', { name: 'Back to cities and municipalities' })
    await waitFor(async () => {
      await expect(areas()).toHaveLength(5)
    })
    await serbiaReady(canvasElement)
    await expect(areas().every((path) => path.classList.contains('is-static'))).toBe(true)
    const map = canvas.getByRole('region', { name: 'Map: Sales in Serbia' })
    await expect(map).toHaveAccessibleDescription('Arrow keys move between the areas.')
    map.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    await expect(areas()).toHaveLength(5)
    await expect(canvasElement).toHaveTextContent('© OpenStreetMap contributors (ODbL)')
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

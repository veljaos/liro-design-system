import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { AreaMap } from './area-map'
import {
  ADDRESS,
  ARABIC_AREAS,
  JAPANESE_AREAS,
  LONG_AREAS,
  mapReady,
  TOWN_AREAS,
  TOWN_LEGEND,
} from './map-story-data'

/** A tile that is only a faint grid, local and drawn by the browser: no network in a story. */
const GRID_TILE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cpath d='M0 0H256V256' fill='none' stroke='currentColor' stroke-opacity='0.12'/%3E%3C/svg%3E"

const meta = {
  title: 'Components/Map/Area map',
  component: AreaMap,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/map` — a subpath of its own, so Leaflet (BSD-2-Clause) loads only where a ' +
          'map is drawn. Drawn with SVG; never mirrored in right-to-left.\n\n' +
          '**What for:** areas on a map — municipalities, the zones of a local tax, service ' +
          'areas — as lines and fills in tokens, labelled where the name fits, with the list of ' +
          'every area beside the map (the keyboard’s and the screen reader’s way: the arrow keys ' +
          'move and choose). An optional point (an address) says which area it falls in. The ' +
          'legend and every word are the application’s.\n\n' +
          '**Data:** each area’s boundary is a GeoJSON Polygon or MultiPolygon ([longitude, ' +
          'latitude], holes after the outer ring). **The base map is optional and off by ' +
          'default:** a real application passes `baseLayer` — its tile URL template (with its ' +
          'key), its attribution, always shown under the map, and its max zoom. The provider, ' +
          'key and usage terms are the application’s (the public openstreetmap.org tiles are not ' +
          'for heavy commercial use). These stories fetch nothing: “With a base map” uses an ' +
          'illustrative local tile.\n\n' +
          '**Chosen:** the area filled with its own colour, clearly stronger, its label on the ' +
          'strong tag and the same item selected in the list; the pointer tints an area lighter.\n\n' +
          '**Keyboard:** the map is one Tab stop — arrow keys pan, plus and minus zoom; the ' +
          'buttons zoom and show everything again. Nothing needs dragging.\n\n' +
          '**Phones:** the list first, the map full width under it.\n\n' +
          '**When not:** a building’s floor (FloorPlan); one workplace and a person’s position ' +
          '(LocationCheck).',
      },
    },
  },
  args: {
    label: 'Illustrative town zones',
    areas: TOWN_AREAS,
    legend: TOWN_LEGEND,
  },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
  },
} satisfies Meta<typeof AreaMap>

export default meta

type Story = StoryObj<typeof meta>

/** Four zones: the centre, two rings (each with the one inside it as a hole) and two pieces across the river. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('region', { name: 'Map: Illustrative town zones' }),
    ).toHaveAttribute('tabindex', '0')
    await expect(canvas.getByRole('listbox', { name: 'Illustrative town zones' })).toBeVisible()
    await expect(canvas.getAllByRole('option')).toHaveLength(4)
    await expect(canvas.getByRole('button', { name: 'Zoom in' })).toBeVisible()
  },
}

/** An address, and the area it falls in. */
export const WithPoint: Story = {
  name: 'With a point',
  args: { point: ADDRESS },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    await expect(canvasElement).toHaveTextContent('Falls in: Inner ring')
  },
}

/** A chosen area: neutral, strong, and marked in the list. */
export const Chosen: Story = {
  args: { defaultSelected: 'outer', point: ADDRESS },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    await expect(within(canvasElement).getByRole('option', { name: /Outer ring/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

/** The keyboard: Tab to the list, the arrows choose; the choice is announced. */
export const Keyboard: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    canvas.getByRole('option', { name: /Centre/ }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('option', { name: /Inner ring/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(document.activeElement).toBe(canvas.getByRole('option', { name: /Inner ring/ }))
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('option', { name: /East bank/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('Chosen: East bank')
    })
  },
}

/**
 * With the application's base map (`baseLayer`): an illustrative provider — a local stand-in tile,
 * so nothing is fetched — its attribution under the map and its max zoom.
 */
export const WithBaseMap: Story = {
  name: 'With a base map',
  args: {
    defaultSelected: 'inner',
    baseLayer: {
      url: GRID_TILE,
      urlDark: GRID_TILE,
      attribution: 'Map tiles: Example Maps (illustrative provider)',
      maxZoom: 16,
    },
  },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    await expect(canvasElement.querySelector('[data-slot="map-attribution"]')).toHaveTextContent(
      'Map tiles: Example Maps (illustrative provider)',
    )
    await expect(canvasElement.querySelector('.liro-map-tiles')).not.toBeNull()
  },
}

/** Long names: whole in the list; on the map left out when they do not fit. */
export const LongNames: Story = {
  name: 'Long names',
  args: { areas: LONG_AREAS },
}

export const Loading: Story = {
  args: { loading: true },
}

export const Failed: Story = {
  args: {
    error: {
      onRetry: () => {
        // The application fetches the areas again.
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

export const Empty: Story = {
  args: { areas: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('No areas to show')
  },
}

/** A phone: the point and the list first, the map full width under them. */
export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <AreaMap {...args} point={ADDRESS} />
      </div>
    </PhoneFrame>
  ),
}

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <AreaMap label="مناطق المدينة" areas={ARABIC_AREAS} />
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <AreaMap label="町の区域" areas={JAPANESE_AREAS} />
    </StoryProvider>
  ),
}

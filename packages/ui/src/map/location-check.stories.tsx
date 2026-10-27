import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { LocationCheck, type LocationFix, type LocationState } from './location-check'
import { distanceMeters } from './map-logic'
import { CENTRE_ZONE, INSIDE_FIX, mapReady, OUTSIDE_FIX, SITE } from './map-story-data'

/** The application's side: it asks the browser (here: a fixed answer) and decides the state. */
function Locating() {
  const [fix, setFix] = useState<LocationFix | null>(null)
  const state: LocationState =
    fix === null ? 'unknown' : distanceMeters(fix, SITE) <= 150 ? 'inside' : 'outside'
  return (
    <LocationCheck
      label="Riverside site"
      detail="Riverside Street 4"
      area={{ kind: 'circle', centre: SITE, radius: 150 }}
      areaText="Within 150 m of the site gate"
      position={fix}
      state={state}
      onLocate={() =>
        new Promise<void>((resolve) => {
          window.setTimeout(() => {
            setFix(INSIDE_FIX)
            resolve()
          }, 300)
        })
      }
      action={{
        label: 'Check in',
        onClick: () => undefined,
        ...(state === 'inside' ? {} : { unavailableReason: 'Check in at the site.' }),
      }}
    />
  )
}

const meta = {
  title: 'Components/Map/Location check',
  component: LocationCheck,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/map`. **What for:** is the person at the workplace — before a check-in, ' +
          'a delivery, a visit. The workplace’s allowed area (a circle of metres or a polygon) ' +
          'and the person’s position with its accuracy, on a map, and the state in words: ' +
          'inside, outside, unknown or denied — **always as the application decides it** (it may ' +
          'use `distanceMeters`). “Use my location” calls the application’s `onLocate`, which asks ' +
          'the browser and passes the position back; the library never asks the browser itself. ' +
          'The check-in is unavailable with the application’s reason in words.\n\n' +
          '**Base map:** the application’s `baseLayer` (with its attribution); these stories pass ' +
          'none, so they fetch nothing.\n\n' +
          '**Phones** are the main use: the state, the facts and the buttons first, the map under ' +
          'them.\n\n**When not:** areas to choose from (AreaMap).',
      },
    },
  },
  args: {
    label: 'Riverside site',
    detail: 'Riverside Street 4',
    area: { kind: 'circle', centre: SITE, radius: 150 },
    areaText: 'Within 150 m of the site gate',
    position: INSIDE_FIX,
    state: 'inside',
    onLocate: () => undefined,
    action: { label: 'Check in', onClick: () => undefined },
  },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
  },
} satisfies Meta<typeof LocationCheck>

export default meta

type Story = StoryObj<typeof meta>

/** Inside: the check-in is available. */
export const Inside: Story = {
  args: { distance: '40 m from the site gate' },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Inside the allowed area')
    await expect(canvas.getByRole('button', { name: 'Check in' })).not.toHaveAttribute(
      'aria-disabled',
    )
    await expect(canvasElement).toHaveTextContent('Accurate to 18 m')
    await expect(canvas.getByRole('region', { name: 'Map: Riverside site' })).toBeVisible()
  },
}

/** Outside: the reason, the distance, and the check-in unavailable with its reason. */
export const Outside: Story = {
  args: {
    position: OUTSIDE_FIX,
    state: 'outside',
    stateDetail: 'You are about 800 m from the site. Check in when you arrive.',
    distance: '800 m from the site gate',
    action: {
      label: 'Check in',
      onClick: () => undefined,
      unavailableReason: 'Check in at the site.',
    },
  },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Check in' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(canvasElement).toHaveTextContent('Check in at the site.')
  },
}

/** Not known yet: no position; Use my location. */
export const Unknown: Story = {
  args: {
    position: null,
    state: 'unknown',
    action: {
      label: 'Check in',
      onClick: () => undefined,
      unavailableReason: 'Share your location first.',
    },
  },
}

/** Denied: the browser's location is off; the application says how to turn it on. */
export const Denied: Story = {
  args: {
    position: null,
    state: 'denied',
    stateDetail: 'Allow location for this site in your browser’s settings, then try again.',
    action: {
      label: 'Check in',
      onClick: () => undefined,
      unavailableReason: 'Location is needed to check in here.',
    },
  },
}

/** The application is finding the position. */
export const Finding: Story = {
  args: { position: null, state: 'unknown', locating: true },
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Finding your location…' }),
    ).toBeDisabled()
  },
}

/** A workplace drawn as a polygon. */
export const PolygonArea: Story = {
  name: 'Polygon area',
  args: {
    area: { kind: 'polygon', geometry: CENTRE_ZONE },
    areaText: 'Inside the market hall’s grounds',
    position: { lat: 45.2565, lng: 19.842, accuracy: '12', at: '2026-10-14T07:31:00+02:00' },
  },
}

/** Use my location: the application answers, decides "inside", and the check-in becomes available. */
export const UseMyLocation: Story = {
  name: 'Use my location',
  tags: ['interaction'],
  render: () => <Locating />,
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Use my location' }))
    await waitFor(
      async () => {
        await expect(canvas.getByRole('button', { name: 'Check in' })).not.toHaveAttribute(
          'aria-disabled',
          'true',
        )
      },
      { timeout: 5_000 },
    )
    await expect(canvasElement).toHaveTextContent('Inside the allowed area')
  },
}

/** Long words from the application. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label:
      'Residential and commercial building at the corner of Riverside Street and the boulevard',
    stateDetail:
      'Your position is less sure than the site needs (it may be up to 250 m off). Step outside, wait a moment for a better position, and try again.',
    state: 'unknown',
    position: { ...OUTSIDE_FIX, accuracy: '250' },
  },
}

export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <LocationCheck {...args} />
      </div>
    </PhoneFrame>
  ),
}

export const PhoneOutside: Story = {
  name: 'Phone, outside',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <LocationCheck
          {...args}
          position={OUTSIDE_FIX}
          state="outside"
          distance="800 m from the site gate"
          action={{
            label: 'Check in',
            onClick: () => undefined,
            unavailableReason: 'Check in at the site.',
          }}
        />
      </div>
    </PhoneFrame>
  ),
}

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <LocationCheck
        label="موقع البناء"
        detail="شارع النهر 4"
        area={{ kind: 'circle', centre: SITE, radius: 150 }}
        areaText="ضمن 150 مترًا من بوابة الموقع"
        position={INSIDE_FIX}
        state="inside"
        action={{ label: 'تسجيل الحضور', onClick: () => undefined }}
      />
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <LocationCheck
        label="川沿いの現場"
        detail="川沿い通り4"
        area={{ kind: 'circle', centre: SITE, radius: 150 }}
        areaText="現場ゲートから150m以内"
        position={INSIDE_FIX}
        state="inside"
        action={{ label: 'チェックイン', onClick: () => undefined }}
      />
    </StoryProvider>
  ),
}

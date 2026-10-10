import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { COUNT_ITEMS, COUNT_SUBTITLE, COUNT_TITLE } from '../components/warehouse-story-data'
import { StockCount, type StockCountProps } from './stock-count'

function Handheld({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame width={360} height={740}>
      <StoryProvider density="touch">
        <ExampleProvider>{children}</ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  )
}

function Counting(props: Partial<StockCountProps>) {
  return (
    <Handheld>
      <StockCount
        title={COUNT_TITLE}
        subtitle={COUNT_SUBTITLE}
        location="B-04-02"
        locationName="Rack B4, shelf 2"
        items={COUNT_ITEMS}
        currentId="i1"
        onScan={() => undefined}
        onCountChange={() => undefined}
        onSelectItem={() => undefined}
        onChangeLocation={() => undefined}
        onFinish={() => undefined}
        onCameraScan={() => undefined}
        feedback={{ id: 1, tone: 'success', text: 'Fasadna mrežica 160 g/m² — counted 5' }}
        {...props}
      />
    </Handheld>
  )
}

/** The application around the count: a scanned location opens it. */
function CountingDemo({ onScan }: { onScan: StockCountProps['onScan'] }) {
  const [location, setLocation] = useState<string | null>(null)
  return (
    <Counting
      location={location}
      items={location === null ? [] : COUNT_ITEMS}
      feedback={null}
      onScan={(code, target, source) => {
        onScan(code, target, source)
        if (target === 'location') setLocation(code)
      }}
    />
  )
}

const meta = {
  title: 'Components/Warehouse/StockCount',
  component: StockCount,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** counting stock on a handheld at 360px, one location at a time: scan the ' +
          'location, scan items, count the item in front with a large QuantityStepper; the items ' +
          'counted here under it. **The application checks every scan and owns every figure:** ' +
          'the count is reported, the expected quantity and the difference come from it (none in ' +
          'a blind count); a difference is signed, with an icon and its tone. “Finish location” is ' +
          'the main action. Offline, the strip and the queue.\n\n' +
          '**When:** a stock take, a cycle count, checking a location.\n\n' +
          '**When not:** adjusting stock in the books (a form with a reason); picking (PickList).',
      },
    },
  },
  args: {
    title: COUNT_TITLE,
    location: 'B-04-02',
    items: COUNT_ITEMS,
    onScan: () => undefined,
    onCountChange: () => undefined,
  },
  render: () => <Counting />,
  play: settle,
} satisfies Meta<typeof StockCount>

export default meta

type Story = StoryObj<typeof meta>

/** Counting at B-04-02: the item in front, the differences from the application. */
export const Default: Story = {
  name: 'Counting',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Counted quantity' })).toHaveValue('5')
    await expect(canvas.getAllByText('-1 roll').length).toBeGreaterThan(0)
  },
}

/** Before a location is scanned. */
export const NoLocation: Story = {
  name: 'Scan a location',
  render: () => <Counting location={null} items={[]} currentId={null} feedback={null} />,
}

/** A location scanned, nothing counted yet. */
export const Empty: Story = {
  render: () => <Counting items={[]} currentId={null} feedback={null} />,
}

/** A blind count: no expected quantities or differences. */
export const Blind: Story = {
  name: 'Blind count',
  render: () => (
    <Counting
      items={COUNT_ITEMS.map(({ id, item, itemCode, unit, counted }) => ({
        id,
        item,
        counted,
        ...(itemCode === undefined ? {} : { itemCode }),
        ...(unit === undefined ? {} : { unit }),
      }))}
    />
  ),
}

/** A large difference in front, with the application's note. */
export const Difference: Story = {
  name: 'Large difference',
  render: () => (
    <Counting
      currentId="i4"
      feedback={{ id: 2, tone: 'error', text: 'Counted 0 of 3: check the returns area.' }}
    />
  ),
}

/** Offline, changes waiting. */
export const Offline: Story = {
  render: () => <Counting offline queued={7} />,
}

/** Loading. */
export const Loading: Story = {
  render: () => <Counting loading />,
}

/** Long names wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Counting
      title="Inventory 2026 of the whole Zone B, racks one to twelve, both sides"
      location="B-04-02-LEVO-GORE"
      locationName="Rack B4, shelf 2, the left side, top level (reach truck only)"
      items={[
        {
          id: 'x1',
          item: 'Fasadna mrežica od staklenih vlakana 160 g/m², alkalno otporna, rolna 50 m',
          itemCode: '3870012500056',
          unit: 'rolls',
          counted: '123456',
          expected: '123460',
          difference: '-4',
          differenceTone: 'warning',
          note: 'Four rolls were moved to the returns area after the delivery of 2 October.',
        },
      ]}
      currentId="x1"
    />
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <PhoneFrame width={360} height={740}>
      <StoryProvider locale="ar" density="touch">
        <StockCount
          title="جرد 2026"
          location="B-04-02"
          locationName="الرف ب4"
          items={[
            {
              id: 'a1',
              item: 'شبكة الواجهات',
              unit: 'لفة',
              counted: '5',
              expected: '6',
              difference: '-1',
              differenceTone: 'warning',
            },
          ]}
          currentId="a1"
          onScan={() => undefined}
          onCountChange={() => undefined}
          onFinish={() => undefined}
        />
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <PhoneFrame width={360} height={740}>
      <StoryProvider locale="ja" density="touch">
        <StockCount
          title="棚卸 2026"
          location="B-04-02"
          locationName="B4棚 2段目"
          items={[
            {
              id: 'j1',
              item: '外壁用メッシュ',
              unit: '巻',
              counted: '6',
              expected: '6',
              difference: '0',
            },
          ]}
          currentId="j1"
          onScan={() => undefined}
          onCountChange={() => undefined}
          onFinish={() => undefined}
        />
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Scanning a location opens it; then the item field takes the focus. */
export const ScanLocation: Story = {
  name: 'Scan a location, interaction',
  tags: ['interaction'],
  args: { onScan: fn() },
  render: (args) => <CountingDemo onScan={args.onScan} />,
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Location code' }), 'B-04-02{Enter}')
    await expect(args.onScan).toHaveBeenCalledWith('B-04-02', 'location', expect.anything())
    await expect(await canvas.findByRole('textbox', { name: 'Item code' })).toHaveFocus()
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { RoomRack, type RoomRackProps } from './room-rack'
import {
  HOUSEKEEPING_STATES,
  LARGE_FLOORS,
  OCCUPANCY_STATES,
  RACK_FLOORS,
  RACK_TODAY,
} from './room-rack-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'

/** The application around the rack: it keeps the chosen room and says which one was opened. */
function FrontDesk(props: Partial<RoomRackProps>) {
  const [chosen, setChosen] = useState(props.selectedId)
  const [said, setSaid] = useState('')
  return (
    <StoryProvider today={RACK_TODAY}>
      <div className="flex flex-col gap-3">
        <RoomRack
          label="Rooms, 06.10.2026"
          floors={RACK_FLOORS}
          occupancyStates={OCCUPANCY_STATES}
          housekeepingStates={HOUSEKEEPING_STATES}
          onRoomOpen={(room) => {
            setChosen(room.id)
            setSaid(`Opened: ${room.number}`)
          }}
          {...props}
          {...(chosen === undefined ? {} : { selectedId: chosen })}
        />
        <output className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{said}</output>
      </div>
    </StoryProvider>
  )
}

/** Whether the story's page runs right to left. */
function rtl(canvasElement: HTMLElement): boolean {
  const rack = canvasElement.querySelector('[data-slot="room-rack"]')
  return rack !== null && getComputedStyle(rack).direction === 'rtl'
}

const meta = {
  title: 'Components/Places/RoomRack',
  component: RoomRack,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the rooms of a place at a glance — a hotel front desk’s room rack, the ' +
          'beds of a ward, the cabins of a ship. Floors (or sections) one under another; each room ' +
          'a tile with its number, a short type, its occupancy state (icon and words on the ' +
          'state’s tone) and housekeeping state (icon and words), the guest, arrival and ' +
          'departure (through `format`) and notes such as VIP. Every state and tone is the ' +
          'application’s data.\n\n' +
          '**Filters:** a search by number or name and one chip per state with its count (the ' +
          'application’s `count`, else the rooms given counted); one occupancy and one ' +
          'housekeeping state at a time; the chips are also the legend.\n\n' +
          '**Keyboard:** one tile in the tab order; the arrows move in reading order (the rack is ' +
          'a list of rooms, not a map of the building, so in right-to-left the forward arrow is ' +
          'ArrowLeft), ArrowUp and ArrowDown a line, across floors; Home / End the floor’s ends, ' +
          'with Ctrl the rack’s; Enter or Space opens the room (`onRoomOpen`). The room open ' +
          'beside the rack (`selectedId`) has the neutral selection.\n\n' +
          '**Density:** `compact` for 200 rooms and more: the number and both states as icons; ' +
          'the words are read by assistive technology and shown in the tile’s title.\n\n' +
          '**Phones:** a list grouped by floor with the same facts.\n\n' +
          '**When:** the state of every room today — arrivals, departures, cleaning.\n\n' +
          '**When not:** stays over days (ResourceSchedule with `scale="days"`); the plan of a ' +
          'place with positions (FloorPlan); a list to sort and page (DataTable).',
      },
    },
  },
  args: {
    floors: RACK_FLOORS,
    occupancyStates: OCCUPANCY_STATES,
    label: 'Rooms',
  },
  render: () => <FrontDesk />,
  play: settle,
} satisfies Meta<typeof RoomRack>

export default meta

type Story = StoryObj<typeof meta>

/** Garni hotel Tvrđava on 06.10.2026: three floors, the chips with their counts. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const rack = canvas.getByRole('region', { name: 'Rooms, 06.10.2026' })
    await expect(within(rack).getAllByRole('heading', { level: 2 })).toHaveLength(3)
    const occupancy = canvas.getByRole('group', { name: 'Occupancy' })
    await expect(within(occupancy).getByRole('button', { name: /^Occupied/ })).toHaveTextContent(
      'Occupied4',
    )
    await expect(
      within(occupancy).getByRole('button', { name: /^Arriving today/ }),
    ).toHaveTextContent('Arriving today3')
    const housekeeping = canvas.getByRole('group', { name: 'Housekeeping' })
    await expect(within(housekeeping).getByRole('button', { name: /^Dirty/ })).toHaveTextContent(
      'Dirty5',
    )
    // One tile in the tab order, with the instructions.
    const tiles = canvas.getAllByRole('button', { name: /^\d{3}/ })
    await expect(tiles).toHaveLength(15)
    await expect(tiles.filter((tile) => tile.tabIndex === 0)).toHaveLength(1)
    await expect(tiles[0]).toHaveAccessibleDescription(
      'Use the arrow keys to move between the rooms, and Enter to open one.',
    )
    await expect(
      canvas.getByRole('button', { name: /^104, DBL, Arriving today/ }),
    ).toHaveTextContent('VIP')
  },
}

/** The room open beside the rack: the neutral selection (surface.selected and its bar). */
export const Chosen: Story = {
  name: 'Chosen room',
  render: () => <FrontDesk selectedId="202" />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const chosen = canvas.getByRole('button', { name: /^202/ })
    await expect(chosen).toHaveAttribute('aria-current', 'true')
    await expect(chosen.tabIndex).toBe(0)
  },
}

/** The arrows move in reading order and between floors; Enter opens. */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const forward = rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}'
    canvas.getByRole('button', { name: /^101/ }).focus()
    await userEvent.keyboard(forward)
    await expect(canvas.getByRole('button', { name: /^102/ })).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('button', { name: /^106/ })).toHaveFocus()
    await userEvent.keyboard(forward)
    await expect(canvas.getByRole('button', { name: /^201/ })).toHaveFocus()
    await userEvent.keyboard('{Control>}{End}{/Control}')
    await expect(canvas.getByRole('button', { name: /^304/ })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('Opened: 304')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^304/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
  },
}

/** A chip filters by its state; the search by number or name; Clear filters brings all back. */
export const FilterInteraction: Story = {
  name: 'Filter, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const dirty = canvas.getByRole('button', { name: /^Dirty/ })
    await userEvent.click(dirty)
    await expect(dirty).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText('5 of 15 shown')).toBeVisible()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search by number or name' }), 'petr')
    await expect(canvas.getAllByRole('button', { name: /^\d{3}/ })).toHaveLength(1)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search by number or name' }), 'zz')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await expect(canvas.getAllByRole('button', { name: /^\d{3}/ })).toHaveLength(15)
    await expect(dirty).toHaveAttribute('aria-pressed', 'false')
  },
}

/** Opened filtered: the rooms to clean, "5 of 15 shown". */
export const Filtered: Story = {
  render: () => <FrontDesk defaultFilter={{ housekeeping: 'dirty' }} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Dirty/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText('5 of 15 shown')).toBeVisible()
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(3)
  },
}

/** A search that matches nothing: "Nothing matches" with Clear filters. */
export const NoMatches: Story = {
  name: 'Nothing matches',
  render: () => <FrontDesk defaultFilter={{ query: 'Zimmermann' }} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Nothing matches')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  },
}

/** 240 rooms on twelve floors in the compact density; the chips are the legend. */
export const Compact: Story = {
  name: 'Compact, 240 rooms',
  render: () => (
    <FrontDesk floors={LARGE_FLOORS} compact label="Rooms, Hotel Panonija, 06.10.2026" />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const tiles = canvas.getAllByRole('button', { name: /^\d{3,4},/ })
    await expect(tiles).toHaveLength(240)
    // The words stay in the tile's name and title.
    await expect(tiles[0]).toHaveAccessibleName(/^101, TWN, (Occupied|Vacant|Arriving today)/)
    await expect(tiles[0]?.getAttribute('title')).toBe(tiles[0]?.getAttribute('aria-label'))
  },
}

/** Tiles as text: no `onRoomOpen`. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <StoryProvider today={RACK_TODAY}>
      <RoomRack
        label="Rooms"
        floors={RACK_FLOORS}
        occupancyStates={OCCUPANCY_STATES}
        housekeepingStates={HOUSEKEEPING_STATES}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('button', { name: /^\d{3}/ })).toHaveLength(0)
    await expect(canvas.getByText('Thomas Becker')).toBeVisible()
  },
}

/** Without filters and housekeeping states: a rack the application has narrowed already. */
export const WithoutFilters: Story = {
  name: 'Without filters',
  render: () => (
    <FrontDesk floors={RACK_FLOORS.slice(0, 1)} filters={false} housekeepingStates={[]} />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('textbox')).toBeNull()
    await expect(canvas.queryByText('Clean')).toBeNull()
  },
}

/** Loading: skeleton tiles. */
export const Loading: Story = {
  render: () => <FrontDesk loading />,
}

/** No rooms yet. */
export const Empty: Story = {
  render: () => <FrontDesk floors={[]} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No rooms yet')).toBeVisible()
  },
}

/** Long names, notes and floor names wrap in their tiles; counts from the application. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <FrontDesk
      occupancyStates={OCCUPANCY_STATES.map((state) =>
        state.id === 'occupied' ? { ...state, count: '1.204' } : state,
      )}
      floors={[
        {
          id: 'x',
          label: 'Ground floor, east wing, rooms with direct access to the garden',
          description: '2 rooms · both accessible for wheelchairs',
          rooms: [
            {
              id: 'G01',
              number: 'G01',
              type: 'Superior double with terrace',
              occupancy: 'occupied',
              housekeeping: 'progress',
              guest: 'Aleksandra Radivojević-Stanković and Kristina Vukašinović-Đorđević',
              arrival: '2026-10-04',
              departure: '2026-10-18',
              notes: [
                { label: 'VIP', tone: 'premium' },
                { label: 'Airport transfer on departure at 05:30', tone: 'warning' },
              ],
            },
            {
              id: 'G02',
              number: 'G02',
              type: 'Accessible double',
              occupancy: 'vacant',
              housekeeping: 'inspected',
            },
          ],
        },
      ]}
    />
  ),
}

/** On a phone: a list grouped by floor with the same facts. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="box-border h-full overflow-y-auto p-4">
        <FrontDesk layout="phone" />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Search by number or name' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^102/ })).toHaveTextContent(
      'Late check-out 14:00',
    )
    const rack = canvasElement.querySelector<HTMLElement>('[data-slot="room-rack"]')
    if (rack === null) throw new Error('no rack')
    await expect(rack.scrollWidth).toBeLessThanOrEqual(rack.clientWidth)
  },
}

/** On a phone, the rooms of one floor to clean: Floor 2, Dirty. */
export const PhoneFiltered: Story = {
  name: 'Phone width, filtered',
  render: () => (
    <PhoneFrame>
      <div className="box-border h-full overflow-y-auto p-4">
        <FrontDesk
          layout="phone"
          floors={RACK_FLOORS.slice(1, 2)}
          defaultFilter={{ housekeeping: 'dirty' }}
        />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('1 of 5 shown')).toBeVisible()
  },
}

/** Arabic states, names and floors in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" today={RACK_TODAY}>
      <RoomRack
        label="الغرف"
        occupancyStates={[
          { id: 'occupied', label: 'مشغولة', tone: 'info' },
          { id: 'vacant', label: 'شاغرة', tone: 'neutral' },
          { id: 'arriving', label: 'وصول اليوم', tone: 'success' },
        ]}
        housekeepingStates={[
          { id: 'clean', label: 'نظيفة', tone: 'success' },
          { id: 'dirty', label: 'تحتاج تنظيف', tone: 'warning' },
        ]}
        searchLabel="ابحث برقم الغرفة أو اسم الضيف"
        occupancyLabel="الإشغال"
        housekeepingLabel="التنظيف"
        onRoomOpen={() => undefined}
        floors={[
          {
            id: 'a1',
            label: 'الطابق الأول',
            rooms: [
              {
                id: '101',
                number: '101',
                type: 'مزدوجة',
                occupancy: 'occupied',
                housekeeping: 'clean',
                guest: 'أحمد علي',
                arrival: '2026-10-04',
                departure: '2026-10-08',
                notes: [{ label: 'ضيف مميز', tone: 'premium' }],
              },
              {
                id: '102',
                number: '102',
                type: 'فردية',
                occupancy: 'vacant',
                housekeeping: 'dirty',
              },
              {
                id: '103',
                number: '103',
                type: 'جناح',
                occupancy: 'arriving',
                housekeeping: 'clean',
                guest: 'سارة حسن',
                arrival: '2026-10-06',
                departure: '2026-10-09',
              },
            ],
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese states, names and floors. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" today={RACK_TODAY}>
      <RoomRack
        label="客室"
        occupancyStates={[
          { id: 'occupied', label: '滞在中', tone: 'info' },
          { id: 'vacant', label: '空室', tone: 'neutral' },
          { id: 'departing', label: '本日チェックアウト', tone: 'warning' },
        ]}
        housekeepingStates={[
          { id: 'clean', label: '清掃済み', tone: 'success' },
          { id: 'dirty', label: '要清掃', tone: 'warning' },
        ]}
        searchLabel="部屋番号または氏名で検索"
        occupancyLabel="利用状況"
        housekeepingLabel="清掃"
        onRoomOpen={() => undefined}
        floors={[
          {
            id: 'j1',
            label: '1階',
            rooms: [
              {
                id: '101',
                number: '101',
                type: '和室',
                occupancy: 'occupied',
                housekeeping: 'clean',
                guest: '佐藤 花子',
                arrival: '2026-10-05',
                departure: '2026-10-07',
              },
              {
                id: '102',
                number: '102',
                type: '洋室',
                occupancy: 'departing',
                housekeeping: 'dirty',
                guest: '田中 一郎',
                arrival: '2026-10-03',
                departure: '2026-10-06',
                notes: [{ label: 'レイトチェックアウト' }],
              },
              {
                id: '103',
                number: '103',
                type: '洋室',
                occupancy: 'vacant',
                housekeeping: 'clean',
              },
            ],
          },
        ]}
      />
    </StoryProvider>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import {
  WEDDING_CONFLICTS,
  WEDDING_FIXTURES,
  WEDDING_GUESTS,
  WEDDING_SIZE,
  WEDDING_TABLES,
} from './floor-plan-story-data'
import { SeatingChart, type SeatingChartProps } from './seating-chart'
import type { SeatingGuest, SeatingTable, SeatRef } from './seating-logic'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/**
 * The application around the chart: it seats a guest where it is told (a guest already on that
 * seat goes to "Not seated") and keeps the list.
 */
function Chart(
  props: Partial<Omit<SeatingChartProps, 'guests' | 'onSeat'>> & {
    initial?: readonly SeatingGuest[]
    readOnly?: boolean
  },
) {
  const { initial, readOnly, ...rest } = props
  const [guests, setGuests] = useState<readonly SeatingGuest[]>(initial ?? WEDDING_GUESTS)
  return (
    <SeatingChart
      label="Wedding of Ana and Marko, Sala Fruškać"
      tables={WEDDING_TABLES}
      fixtures={WEDDING_FIXTURES}
      width={WEDDING_SIZE.width}
      height={WEDDING_SIZE.height}
      conflicts={WEDDING_CONFLICTS}
      {...rest}
      guests={guests}
      {...(readOnly === true
        ? {}
        : {
            onSeat: (guestId: string, seat: SeatRef | null) => {
              setGuests((current) =>
                current.map((guest) => {
                  if (guest.id === guestId) return { ...guest, seat }
                  const taken =
                    seat !== null &&
                    guest.seat?.tableId === seat.tableId &&
                    guest.seat.seat === seat.seat
                  return taken ? { ...guest, seat: null } : guest
                }),
              )
            },
          })}
    />
  )
}

/** A seat's element on the plan. */
function seatOf(canvasElement: HTMLElement, tableId: string, seat: number): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(
    `[data-floor-item="${tableId}#${String(seat)}"]`,
  )
  if (element === null) throw new Error(`no seat ${tableId}#${String(seat)}`)
  return element
}

const meta = {
  title: 'Components/SeatingChart',
  component: SeatingChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** who sits where at an event — a wedding, a gala dinner, a conference. ' +
          'Built on FloorPlan: the tables where the application puts them, their seats drawn round ' +
          'them (round tables evenly, rectangular ones along the long sides), each seat a target ' +
          'named "Table 3, seat 4, Ana Petrović, Taken". Beside the plan the guest list: "52 of ' +
          '60 seated", a search, the guests not seated first, then each table’s guests in seat ' +
          'order, with their group and notes (diet) as data.\n\n' +
          '**Seating a guest, three ways:** choose a seat (a press, or Enter on the plan or in its ' +
          'list) and then a guest in its dialog — the keyboard’s way; drag a guest onto a seat; or ' +
          '"Seat at…" from the guest’s menu (a table, then a free seat). "Unseat" in the menu and ' +
          'in a taken seat’s dialog. Every change is reported as `onSeat(guestId, seat | null)`; ' +
          'the chart never decides. A table opens its guests in order. Conflicts — a full table, ' +
          'guests to keep apart — are the application’s: on the table and on the guests.\n\n' +
          '**Others rely on the seating (P5.28):** the application keeps the changes pending (“3 ' +
          'changes not saved”) and saves them together through ChangeConfirmDialog — each guest’s ' +
          'seat old → new (`seatingChanges`), the guests’ e-mail as a choice (the gala example).\n\n' +
          '**When:** seated events with tables. **When not:** a restaurant’s service (FloorPlan ' +
          'with table states); booking times (ResourceSchedule); a list of attendees without seats ' +
          '(DataTable).',
      },
    },
  },
  args: {
    label: 'Wedding of Ana and Marko, Sala Fruškać',
    tables: WEDDING_TABLES,
    guests: WEDDING_GUESTS,
    width: WEDDING_SIZE.width,
    height: WEDDING_SIZE.height,
  },
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof SeatingChart>

export default meta

type Story = StoryObj<typeof meta>

/** The wedding: 52 of 60 seated, eight not yet; two conflicts from the application. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('52 of 60 seated')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'Not seated' })).toBeVisible()
    await expect(seatOf(canvasElement, 'head', 2)).toHaveAccessibleName(
      'Head table, seat 2, Ana Petrović, Taken',
    )
    await expect(seatOf(canvasElement, 'w1', 7)).toHaveAccessibleName('Table 1, seat 7, Free')
    await expect(
      canvas.getByRole('button', { name: /^Table 1, 6 of 8, Problem: Keep apart/ }),
    ).toBeVisible()
  },
}

/** A free seat chosen: its dialog lists the guests to seat on it, the ones not seated first. */
export const SeatDialog: Story = {
  name: 'Seat chosen',
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" defaultSeatDialog={{ tableId: 'w3', seat: 7 }} />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Seat a guest Table 3, seat 7',
    })
    const list = within(dialog).getByRole('list', { name: 'Choose a guest' })
    await expect(within(list).getAllByRole('button')[0]).toHaveTextContent(/Not seated/)
  },
}

/** A taken seat chosen: who sits there, Unseat, and the others to seat instead. */
export const TakenSeatDialog: Story = {
  name: 'Taken seat chosen',
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" defaultSeatDialog={{ tableId: 'head', seat: 2 }} />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Seat a guest Head table, seat 2',
    })
    await expect(dialog).toHaveTextContent('Seated here: Ana Petrović')
    await expect(within(dialog).getByRole('button', { name: 'Unseat' })).toBeVisible()
  },
}

/** "Seat at…" from a guest's menu: a table with its free seats, then a seat. */
export const SeatAt: Story = {
  name: 'Seat at…',
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" defaultSeatAt="g53" />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: /^Choose a seat / })
    await expect(within(dialog).getByRole('combobox', { name: 'Table' })).toHaveTextContent(
      'Head table · 2 free',
    )
  },
}

/** A table's guests in seat order, empty seats included, with its conflict. */
export const TableGuests: Story = {
  name: 'A table’s guests',
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" defaultTableDialog="w1" />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Table 1' })
    await expect(dialog).toHaveTextContent('6 of 8')
    await expect(dialog).toHaveTextContent('Empty seat')
    await expect(dialog).toHaveTextContent('Keep apart')
  },
}

/** Searching the guests: by name, group or a note such as a diet. */
export const Search: Story = {
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" defaultQuery="vegetarian" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="seating-guest-list"]')
    if (list === null) throw new Error('no list')
    for (const row of list.querySelectorAll('li')) {
      await expect(row).toHaveTextContent('Vegetarian')
    }
  },
}

/** A search that finds no one. */
export const SearchNoMatch: Story = {
  name: 'Search, no match',
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" defaultQuery="Zzz" />
    </ExampleProvider>
  ),
}

/**
 * The keyboard: Enter on a free seat of table 3 opens its dialog; choosing the first guest not
 * seated seats them there — "53 of 60 seated".
 */
export const KeyboardSeating: Story = {
  name: 'Seating with the keyboard',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    seatOf(canvasElement, 'w3', 7).focus()
    await userEvent.keyboard('{Enter}')
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Seat a guest Table 3, seat 7',
    })
    const first = within(dialog).getAllByRole('button', { name: /Not seated/ })[0]
    if (first === undefined) throw new Error('no guest')
    const name = first.querySelector('span')?.textContent ?? ''
    await userEvent.click(first)
    await waitFor(async () => {
      await expect(canvas.getByText('53 of 60 seated')).toBeVisible()
    })
    await expect(seatOf(canvasElement, 'w3', 7)).toHaveAccessibleName(
      `Table 3, seat 7, ${name}, Taken`,
    )
    await expect(canvasElement.querySelector('[data-slot="seating-announcer"]')).toHaveTextContent(
      `${name} seated at Table 3, seat 7.`,
    )
  },
}

/** "Seat at…" and "Unseat" from a guest's menu. */
export const SeatAtMenu: Story = {
  name: 'Seat at…, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const guest = WEDDING_GUESTS[52]
    if (guest === undefined) throw new Error('no guest')
    await userEvent.click(canvas.getByRole('button', { name: `Actions: ${guest.name}` }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Seat at…' }))
    const dialog = await body.findByRole('dialog', { name: `Choose a seat ${guest.name}` })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Seat' }))
    await waitFor(async () => {
      await expect(canvas.getByText('53 of 60 seated')).toBeVisible()
    })
    await expect(seatOf(canvasElement, 'head', 4)).toHaveAccessibleName(
      `Head table, seat 4, ${guest.name}, Taken`,
    )
    await userEvent.click(canvas.getByRole('button', { name: `Actions: ${guest.name}` }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Unseat' }))
    await waitFor(async () => {
      await expect(canvas.getByText('52 of 60 seated')).toBeVisible()
    })
  },
}

/** Dragging a guest from the list onto a free seat. */
export const Dragging: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const guest = WEDDING_GUESTS[53]
    if (guest === undefined) throw new Error('no guest')
    const row = canvasElement.querySelector<HTMLElement>(`[data-seating-guest="${guest.id}"]`)
    if (row === null) throw new Error('no row')
    const seat = seatOf(canvasElement, 'w4', 8)
    const from = row.getBoundingClientRect()
    const to = seat.getBoundingClientRect()
    const start = { x: from.left + 40, y: from.top + from.height / 2 }
    const end = { x: to.left + to.width / 2, y: to.top + to.height / 2 }
    const user = userEvent.setup()
    await user.pointer([
      { keys: '[MouseLeft>]', target: row, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x - 10, clientY: start.y } },
      { coords: { clientX: end.x, clientY: end.y } },
    ])
    await expect(canvasElement.querySelector('[data-slot="seating-drag"]')).not.toBeNull()
    await user.pointer({ keys: '[/MouseLeft]', coords: { clientX: end.x, clientY: end.y } })
    await waitFor(async () => {
      await expect(seatOf(canvasElement, 'w4', 8)).toHaveAccessibleName(
        `Table 4, seat 8, ${guest.name}, Taken`,
      )
    })
  },
}

/** Without `onSeat` the chart is read-only: no menus, no dragging; a seat opens its table. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" readOnly />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryByRole('button', { name: /^Actions:/ })).toBeNull()
  },
}

/** Loading. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" loading />
    </ExampleProvider>
  ),
}

/** No guests yet: the tables and their free seats, and the list says so. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Chart layout="desktop" initial={[]} />
    </ExampleProvider>
  ),
}

/** Long names, groups and notes wrap in the list. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Chart
        layout="desktop"
        initial={[
          {
            id: 'long',
            name: 'Aleksandra Konstantinović-Radovanović Petrović',
            group: 'Friends of the bride from the faculty of technical sciences in Novi Sad',
            notes: ['Vegetarian, no eggs and no dairy', 'Wheelchair: a place by the aisle'],
            seat: { tableId: 'w1', seat: 1 },
          },
          ...WEDDING_GUESTS.slice(4, 20),
        ]}
      />
    </ExampleProvider>
  ),
}

/** Long tables: a head table of ten and two long tables of twelve, turned upright. */
export const LongTables: Story = {
  name: 'Long tables',
  render: () => {
    const tables: SeatingTable[] = [
      {
        id: 'h',
        label: 'Head table',
        shortLabel: 'Head',
        shape: 'rect',
        x: 300,
        y: 40,
        width: 400,
        height: 60,
        seats: 10,
      },
      {
        id: 'l1',
        label: 'Long table 1',
        shortLabel: '1',
        shape: 'rect',
        x: 80,
        y: 360,
        width: 420,
        height: 60,
        rotation: 90,
        seats: 12,
      },
      {
        id: 'l2',
        label: 'Long table 2',
        shortLabel: '2',
        shape: 'rect',
        x: 500,
        y: 360,
        width: 420,
        height: 60,
        rotation: 90,
        seats: 11,
      },
    ]
    return (
      <ExampleProvider>
        <Chart
          layout="desktop"
          tables={tables}
          fixtures={[]}
          conflicts={[]}
          initial={WEDDING_GUESTS.slice(0, 20).map((guest, index) => ({
            ...guest,
            seat:
              index < 18
                ? { tableId: index < 6 ? 'h' : index < 12 ? 'l1' : 'l2', seat: (index % 6) + 1 }
                : null,
          }))}
        />
      </ExampleProvider>
    )
  },
}

/** On a phone: the guest list first, then the plan's list of seats by table. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Chart layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const chart = canvasElement.querySelector<HTMLElement>('[data-slot="seating-chart"]')
    if (chart !== null) await expect(chart.scrollWidth).toBeLessThanOrEqual(chart.clientWidth)
    await expect(
      canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan"]')?.dataset.view,
    ).toBe('list')
  },
}

const ARABIC_GUESTS: SeatingGuest[] = [
  { id: 'a1', name: 'سارة أحمد', group: 'عائلة العروس', seat: { tableId: 'head', seat: 3 } },
  { id: 'a2', name: 'محمد علي', group: 'عائلة العريس', seat: { tableId: 'head', seat: 4 } },
  { id: 'a3', name: 'ليلى حسن', notes: ['نباتية'], seat: { tableId: 'w1', seat: 1 } },
  { id: 'a4', name: 'عمر خالد', seat: null },
]

/** Arabic names in a right-to-left page: the list turns, the plan does not. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Chart
        layout="desktop"
        label="حفل الزفاف"
        guestsTitle="الضيوف"
        conflicts={[]}
        tables={WEDDING_TABLES.map((table) => ({
          ...table,
          label: `طاولة ${table.shortLabel ?? ''}`,
        }))}
        initial={ARABIC_GUESTS}
      />
    </StoryProvider>
  ),
}

/** Japanese names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Chart
        layout="desktop"
        label="結婚披露宴"
        guestsTitle="ゲスト"
        conflicts={[]}
        tables={WEDDING_TABLES.map((table) => ({
          ...table,
          label: `テーブル ${table.shortLabel ?? ''}`,
        }))}
        initial={[
          { id: 'j1', name: '佐藤 花子', group: '新婦の家族', seat: { tableId: 'head', seat: 3 } },
          { id: 'j2', name: '鈴木 一郎', group: '新郎の家族', seat: { tableId: 'head', seat: 4 } },
          { id: 'j3', name: '高橋 美咲', notes: ['ベジタリアン'], seat: null },
        ]}
      />
    </StoryProvider>
  ),
}

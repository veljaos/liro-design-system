import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import {
  ResourceSchedule,
  type ResourceScheduleProps,
  type ScheduleBooking,
} from './resource-schedule'
import {
  CLINIC_BOOKINGS,
  CLINIC_RESOURCES,
  CLINIC_UNAVAILABLE,
  ScheduleFrame,
} from './schedule-story-data'
import { PhoneFrame } from './story-frames'

/** The application around the schedule: it applies every move it is told about. */
function Schedule(
  props: Partial<ResourceScheduleProps> & { initial?: readonly ScheduleBooking[] },
) {
  const { initial, ...rest } = props
  const [bookings, setBookings] = useState<readonly ScheduleBooking[]>(initial ?? CLINIC_BOOKINGS)
  const [said, setSaid] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <ResourceSchedule
        resources={CLINIC_RESOURCES}
        unavailable={CLINIC_UNAVAILABLE}
        label="Health centre Liman, Wednesday 14 October"
        resourceLabel="Doctor or room"
        bookings={bookings}
        onMove={(move) => {
          setBookings((current) =>
            current.map((booking) =>
              booking.id === move.id
                ? { ...booking, resourceId: move.resourceId, start: move.start, end: move.end }
                : booking,
            ),
          )
          setSaid(`Moved ${move.id} to ${move.resourceId} at ${move.start}–${move.end}`)
        }}
        onSelect={(booking) => {
          setSaid(`Opened: ${booking.title}`)
        }}
        {...rest}
      />
      <output className="text-sm text-secondary">{said}</output>
    </div>
  )
}

function rtl(canvasElement: HTMLElement): boolean {
  const schedule = canvasElement.querySelector('[data-slot="resource-schedule"]') ?? canvasElement
  return getComputedStyle(schedule).direction === 'rtl'
}

/** The schedule's own announcements (the story's output is a status too). */
function liveRegion(canvasElement: HTMLElement): HTMLElement {
  const region = canvasElement.querySelector<HTMLElement>(
    '[data-slot="resource-schedule"] > [role="status"]',
  )
  if (region === null) throw new Error('no live region')
  return region
}

/** The booking's button: its name starts with its title. */
function booking(canvasElement: HTMLElement, title: string): HTMLElement {
  return within(canvasElement).getByRole('button', { name: new RegExp(`^${title}, `) })
}

const meta = {
  title: 'Components/Scheduling/ResourceSchedule',
  component: ResourceSchedule,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** several people or rooms side by side against the time of one day (or ' +
          'a few days) — doctors, rooms, teachers, vehicles — with their bookings as blocks. ' +
          'The names stand in a sticky column at the start; the time runs from the leading edge ' +
          '(from the right in right-to-left pages). Unavailable times (`unavailable`, with their ' +
          'reason) are hatched and neutral, named in words.\n\n' +
          '**Moving a booking — three ways (WCAG 2.5.7):** drag it (it snaps to slots and rows, ' +
          'a dashed placeholder stays where it was; touch after a short press; Escape cancels); ' +
          'the keyboard on it (Space picks it up, the arrows move it by a slot or a row, Enter ' +
          'drops it, Escape cancels; each step is announced, with the reason when the place is ' +
          'unavailable); or its "Move to…" button (row, day and start, then Move). The schedule ' +
          'only reports `onMove({ id, resourceId, start, end })`: whether the move is allowed is ' +
          'the application’s decision.\n\n' +
          '**Phones:** one row at a time, chosen in a select; the time runs down.\n\n' +
          '**When:** planning shared people or rooms over one day or a few days.\n\n' +
          '**When not:** one person’s days and weeks (CalendarView); offering free slots to book ' +
          '(SlotPicker); a school week (Timetable).',
      },
    },
  },
  args: { resources: CLINIC_RESOURCES, bookings: CLINIC_BOOKINGS, label: 'Schedule' },
  render: () => (
    <ScheduleFrame>
      <Schedule />
    </ScheduleFrame>
  ),
  play: settle,
} satisfies Meta<typeof ResourceSchedule>

export default meta

type Story = StoryObj<typeof meta>

/** Four rows on Wednesday 14 October 2026: bookings, the lunch break for all, a service. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const ana = booking(canvasElement, 'Ana Petrović')
    await expect(ana).toHaveAccessibleName(
      /^Ana Petrović, Dr Milica Jovanović, 09:00\sAM – 10:00\sAM$/,
    )
    await expect(ana).toHaveAccessibleDescription(/Press Space to pick up the booking/)
    await expect(canvas.getAllByText('Unavailable: Lunch break, 12:00 PM – 12:30 PM')).toHaveLength(
      4,
    )
    await expect(canvas.getByRole('button', { name: 'Move to…: Ana Petrović' })).toBeVisible()
  },
}

/**
 * The keyboard: pick up Ana Petrović's booking, move it one slot later and one row down, drop it;
 * each step is announced.
 */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    booking(canvasElement, 'Ana Petrović').focus()
    await userEvent.keyboard(' ')
    await expect(liveRegion(canvasElement)).toHaveTextContent(
      /^Picked up Ana Petrović\. Dr Milica Jovanović, 09:00\sAM – 10:00\sAM\.$/,
    )
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await userEvent.keyboard('{ArrowDown}')
    await expect(liveRegion(canvasElement)).toHaveTextContent(
      /^Ana Petrović: Dr Nenad Kovačević, 09:30\sAM – 10:30\sAM\.$/,
    )
    await expect(booking(canvasElement, 'Ana Petrović')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(
      canvas.getByText('Moved b2 to kovacevic at 2026-10-14T09:30–2026-10-14T10:30'),
    ).toBeVisible()
    await waitFor(async () => {
      await expect(booking(canvasElement, 'Ana Petrović')).toHaveAccessibleName(
        /Dr Nenad Kovačević, 09:30\sAM – 10:30\sAM$/,
      )
    })
  },
}

/** Over an unavailable time the announcement says why; the schedule still reports the move. */
export const KeyboardUnavailableInteraction: Story = {
  name: 'Keyboard over unavailable, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    booking(canvasElement, 'Dragana Nikolić').focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard(
      rtl(canvasElement) ? '{ArrowRight}{ArrowRight}' : '{ArrowLeft}{ArrowLeft}',
    )
    await expect(liveRegion(canvasElement)).toHaveTextContent('Unavailable here: Lunch break.')
    await userEvent.keyboard('{Escape}')
    await expect(liveRegion(canvasElement)).toHaveTextContent(
      'Move cancelled. Dragana Nikolić is back in its place.',
    )
  },
}

/** "Move to…": choose the row and the start, then Move. */
export const MoveToInteraction: Story = {
  name: 'Move to, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Move to…: Marko Ilić' }))
    const panel = await body.findByRole('dialog', { name: 'Move to…: Marko Ilić' })
    await userEvent.click(within(panel).getByRole('combobox', { name: 'Resource' }))
    await userEvent.click(await body.findByRole('option', { name: 'Dr Jelena Stojanović' }))
    // The panel is hidden from assistive technology while the select is open.
    await userEvent.click(await within(panel).findByRole('combobox', { name: 'Start' }))
    await userEvent.click(await body.findByRole('option', { name: /^11:00\sAM$/ }))
    await userEvent.click(await within(panel).findByRole('button', { name: 'Move' }))
    await expect(
      canvas.getByText('Moved b1 to stojanovic at 2026-10-14T11:00–2026-10-14T11:30'),
    ).toBeVisible()
  },
}

/** Dragging with the pointer: one row down and two slots later. */
export const DraggingInteraction: Story = {
  name: 'Dragging, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const block = booking(canvasElement, 'Marko Ilić')
    const box = block.getBoundingClientRect()
    const sign = rtl(canvasElement) ? -1 : 1
    const start = { x: box.left + 10, y: box.top + box.height / 2 }
    // The grid fills its box: a minute is the track's width over the day's 480 minutes. Two
    // 30-minute slots later, one 56px row down.
    const track = canvasElement.querySelector('[data-track="0"]')
    if (track === null) throw new Error('no track')
    const minute = track.getBoundingClientRect().width / 480
    const end = { x: start.x + sign * 60 * minute, y: start.y + 56 }
    const user = userEvent.setup()
    await user.pointer([
      { keys: '[MouseLeft>]', target: block, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x + sign * 10, clientY: start.y } },
      { coords: { clientX: end.x, clientY: end.y } },
    ])
    await expect(
      canvasElement.querySelector('[data-slot="schedule-drop-placeholder"]'),
    ).not.toBeNull()
    // Released over what is under the pointer now: the lifted booking was drawn anew in its row.
    await user.pointer({
      keys: '[/MouseLeft]',
      target: document.elementFromPoint(end.x, end.y) ?? document.body,
      coords: { clientX: end.x, clientY: end.y },
    })
    await expect(
      canvas.getByText('Moved b1 to kovacevic at 2026-10-14T09:00–2026-10-14T09:30'),
    ).toBeVisible()
  },
}

/** Several days one after another, 15-minute steps from 07:00 to 13:00. */
export const SeveralDays: Story = {
  name: 'Several days',
  render: () => (
    <ScheduleFrame>
      <Schedule
        days={['2026-10-14', '2026-10-15']}
        dayStart="07:00"
        dayEnd="13:00"
        slotMinutes={15}
        initial={[
          ...CLINIC_BOOKINGS,
          {
            id: 'b7',
            resourceId: 'jovanovic',
            title: 'Jovana Simić',
            description: 'Check-up',
            start: '2026-10-15T11:00',
            end: '2026-10-15T11:30',
          },
        ]}
      />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(booking(canvasElement, 'Jovana Simić')).toHaveAccessibleName(
      /^Jovana Simić, Dr Milica Jovanović, 10\/15\/2026, 11:00\sAM – 11:30\sAM$/,
    )
  },
}

/** Read-only: bookings open but do not move (no handles, no "Move to…"); a locked one likewise. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ScheduleFrame>
      <div className="flex flex-col gap-6">
        <Schedule readOnly />
        <Schedule
          initial={CLINIC_BOOKINGS.map((each) =>
            each.id === 'b2' ? { ...each, locked: true } : each,
          )}
        />
      </div>
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // Ana Petrović's booking is locked in the second schedule; nothing moves in the first.
    await expect(
      canvas.queryAllByRole('button', { name: /^Move to…: Ana Petrović$/ }),
    ).toHaveLength(0)
    await expect(canvas.getAllByRole('button', { name: /^Move to…: Marko Ilić$/ })).toHaveLength(1)
  },
}

/** Without `onSelect` and `onMove` the bookings are shown as text, their names still read. */
export const Static: Story = {
  render: () => (
    <ScheduleFrame>
      <ResourceSchedule
        resources={CLINIC_RESOURCES}
        bookings={CLINIC_BOOKINGS}
        unavailable={CLINIC_UNAVAILABLE}
        label="Health centre Liman"
      />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0)
  },
}

/** Loading: skeleton rows. */
export const Loading: Story = {
  render: () => (
    <ScheduleFrame>
      <Schedule loading />
    </ScheduleFrame>
  ),
}

/** No bookings yet: the rows and the unavailable times. */
export const Empty: Story = {
  render: () => (
    <ScheduleFrame>
      <Schedule initial={[]} />
    </ScheduleFrame>
  ),
}

/** Long names and titles are cut in the grid; their names and tooltips keep them whole. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ScheduleFrame>
      <ResourceSchedule
        label="Long text"
        onMove={() => undefined}
        resources={[
          {
            id: 'r1',
            name: 'Prof. dr Aleksandra Radivojević-Stanković',
            description: 'Cardiology and internal medicine, second floor, room 214',
          },
          { id: 'r2', name: 'Diagnostic room for ultrasound and Doppler examinations' },
        ]}
        bookings={[
          {
            id: 'x1',
            resourceId: 'r1',
            title: 'Kristina Vukašinović-Đorđević',
            description: 'Check-up after the treatment of a complicated fracture',
            start: '2026-10-14T09:00',
            end: '2026-10-14T10:30',
          },
          {
            id: 'x2',
            resourceId: 'r2',
            title: 'Aleksandar Radovanović',
            start: '2026-10-14T09:00',
            end: '2026-10-14T09:15',
          },
        ]}
        unavailable={[
          {
            resourceId: 'r2',
            start: '2026-10-14T11:00',
            end: '2026-10-14T14:00',
            reason: 'Regular maintenance of the ultrasound device by the authorised service',
          },
        ]}
      />
    </ScheduleFrame>
  ),
}

/** The schedule in a phone frame. */
function phoneSchedule() {
  return (
    <PhoneFrame>
      <ScheduleFrame>
        <div className="p-4">
          <Schedule layout="phone" />
        </div>
      </ScheduleFrame>
    </PhoneFrame>
  )
}

/** On a phone: one row at a time, the time running down. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: phoneSchedule,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Doctor or room' })).toHaveTextContent(
      'Dr Milica Jovanović',
    )
    await expect(canvas.queryByText('Stefan Đorđević')).toBeNull()
    const schedule = canvasElement.querySelector<HTMLElement>('[data-slot="resource-schedule"]')
    if (schedule !== null)
      await expect(schedule.scrollWidth).toBeLessThanOrEqual(schedule.clientWidth)
  },
}

/** On a phone the keyboard moves a booking to the next row with the arrow across. */
export const PhoneKeyboardInteraction: Story = {
  name: 'Phone keyboard, interaction',
  tags: ['interaction'],
  render: phoneSchedule,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    booking(canvasElement, 'Marko Ilić').focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await expect(canvas.getByRole('combobox', { name: 'Doctor or room' })).toHaveTextContent(
      'Dr Nenad Kovačević',
    )
    await expect(booking(canvasElement, 'Marko Ilić')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(
      canvas.getByText('Moved b1 to kovacevic at 2026-10-14T08:30–2026-10-14T09:00'),
    ).toBeVisible()
  },
}

/** Arabic rows in a right-to-left schedule: the names at the right, the time running left. */
export const Arabic: Story = {
  render: () => (
    <ScheduleFrame locale="ar">
      <ResourceSchedule
        label="الجدول"
        onMove={() => undefined}
        resources={[
          { id: 'a', name: 'د. أحمد علي', description: 'طب عام' },
          { id: 'b', name: 'غرفة الأشعة' },
        ]}
        bookings={[
          {
            id: 'a1',
            resourceId: 'a',
            title: 'سارة حسن',
            description: 'فحص',
            start: '2026-10-14T09:00',
            end: '2026-10-14T10:00',
          },
        ]}
        unavailable={[
          { start: '2026-10-14T12:00', end: '2026-10-14T12:30', reason: 'استراحة الغداء' },
        ]}
      />
    </ScheduleFrame>
  ),
}

/** Japanese rows. */
export const Japanese: Story = {
  render: () => (
    <ScheduleFrame locale="ja">
      <ResourceSchedule
        label="予定表"
        onMove={() => undefined}
        resources={[
          { id: 'a', name: '佐藤 医師', description: '内科' },
          { id: 'b', name: '検査室' },
        ]}
        bookings={[
          {
            id: 'j1',
            resourceId: 'a',
            title: '田中 一郎',
            description: '診察',
            start: '2026-10-14T09:00',
            end: '2026-10-14T10:00',
            tone: 'info',
          },
        ]}
        unavailable={[{ start: '2026-10-14T12:00', end: '2026-10-14T13:00', reason: '昼休み' }]}
      />
    </ScheduleFrame>
  ),
}

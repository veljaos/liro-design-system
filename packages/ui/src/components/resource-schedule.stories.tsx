import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { ChangeConfirmDialog } from './change-confirm-dialog'
import {
  ResourceSchedule,
  type ResourceScheduleProps,
  type ScheduleBooking,
  type ScheduleMove,
} from './resource-schedule'
import {
  CLINIC_BOOKINGS,
  CLINIC_RESOURCES,
  CLINIC_UNAVAILABLE,
  ScheduleFrame,
} from './schedule-story-data'
import type { SchedulePhoneList } from './schedule-phone-lists'
import { HOTEL_LISTS, HOTEL_ROOMS, HOTEL_STAYS } from './schedule-phone-story-data'
import { PhoneFrame } from './story-frames'
import {
  expectBelowShell,
  expectFirstColumnStays,
  scrollUnderShell,
  ShellPage,
} from './sticky-story-helpers'

/**
 * The application around the schedule. A move only proposes (P5.28 item 9): the application asks
 * first with ChangeConfirmDialog — the booking, its row and time old → new, the person's message
 * as a choice (unchecked) — and moves the booking on Save; Cancel leaves it where it was.
 */
function Schedule(
  props: Partial<ResourceScheduleProps> & {
    initial?: readonly ScheduleBooking[]
    /** A move proposed when the story opens: the confirmation is shown at once. */
    proposed?: ScheduleMove
  },
) {
  const { initial, proposed: initialProposal, ...rest } = props
  const { format } = useLiro()
  const resources = props.resources ?? CLINIC_RESOURCES
  const [bookings, setBookings] = useState<readonly ScheduleBooking[]>(initial ?? CLINIC_BOOKINGS)
  const [proposed, setProposed] = useState<ScheduleMove | null>(initialProposal ?? null)
  const [said, setSaid] = useState('')
  const moving = proposed === null ? undefined : bookings.find((each) => each.id === proposed.id)
  const rowName = (id: string) => resources.find((each) => each.id === id)?.name ?? id
  // Days (YYYY-MM-DD) or times (YYYY-MM-DDTHH:mm), as the schedule reports them.
  const when = (start: string, end: string) =>
    start.length === 10
      ? `${format.date(start)} – ${format.date(end)}`
      : `${format.date(start.slice(0, 10))} ${format.time(start)}–${format.time(end)}`
  return (
    <div className="flex flex-col gap-3">
      <ResourceSchedule
        resources={CLINIC_RESOURCES}
        unavailable={CLINIC_UNAVAILABLE}
        label="Health centre Liman, Wednesday 14 October"
        resourceLabel="Doctor or room"
        bookings={bookings}
        onMove={setProposed}
        onSelect={(booking) => {
          setSaid(`Opened: ${booking.title}`)
        }}
        now="10:20"
        {...rest}
      />
      {proposed !== null && moving !== undefined && (
        <ChangeConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setProposed(null)
          }}
          title="Move booking"
          subject={moving.title}
          changes={[
            ...(proposed.resourceId === moving.resourceId
              ? []
              : [
                  {
                    label: props.resourceLabel ?? 'Doctor or room',
                    from: rowName(moving.resourceId),
                    to: rowName(proposed.resourceId),
                  },
                ]),
            {
              label: 'When',
              from: when(moving.start, moving.end),
              to: when(proposed.start, proposed.end),
            },
          ]}
          notify={[
            {
              id: 'person',
              label: `Notify ${moving.title}`,
              description: 'The new place and time, as the application sends it.',
            },
          ]}
          onConfirm={(answer) => {
            setBookings((current) =>
              current.map((booking) =>
                booking.id === proposed.id
                  ? {
                      ...booking,
                      resourceId: proposed.resourceId,
                      start: proposed.start,
                      end: proposed.end,
                    }
                  : booking,
              ),
            )
            setSaid(
              `Moved ${proposed.id} to ${proposed.resourceId} at ${proposed.start}–${proposed.end}; ` +
                (answer.notify.length > 0 ? 'message sent' : 'no message'),
            )
          }}
        />
      )}
      <output className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{said}</output>
    </div>
  )
}

/** Saves the move the schedule proposed (P5.28 item 9). */
async function saveMove(subject: string) {
  const dialog = await within(document.body).findByRole('dialog', {
    name: `Move booking ${subject}`,
  })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
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
          'the application’s decision. A move of something other people rely on (an ' +
          'appointment, a reservation) only proposes: the application confirms it with ' +
          'ChangeConfirmDialog — old → new, "Notify …" as a choice, Cancel / Save — and changes ' +
          '`bookings` on Save (P5.28 item 9; "Move asked").\n\n' +
          '**Phones:** one row at a time, chosen in a select; the time runs down. With many ' +
          'rows (a hotel with 200 rooms) a phone shows no timeline at all: `phoneLists`, the ' +
          'day’s lists the application passes — Arrivals, Departures, In house — a list at a ' +
          'time with its count, a search over names, rooms and notes, each booking a row that ' +
          'opens it (`onSelect`). Desktops and tablets keep the timeline (the F7 phone rule).\n\n' +
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

/**
 * Four rows on Wednesday 14 October 2026: bookings, the lunch break for all, a service; "now"
 * (10:20, the application's clock) as its time in the hours row.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const ana = booking(canvasElement, 'Ana Petrović')
    await expect(ana).toHaveAccessibleName(
      /^Ana Petrović, Dr Milica Jovanović, 9:00\sAM – 10:00\sAM$/,
    )
    await expect(ana).toHaveAccessibleDescription(/Press Space to pick up the booking/)
    await expect(canvas.getAllByText('Unavailable: Lunch break, 12:00 PM – 12:30 PM')).toHaveLength(
      4,
    )
    await expect(canvas.getByRole('button', { name: 'Move to…: Ana Petrović' })).toBeVisible()
    // "Now" is only its time in the hours row, from the application's clock (P5.94 item 16): no
    // line across the rows.
    const marker = canvas.getByRole('img', { name: /^Now, 10:20\sAM$/ })
    await expect(marker).toHaveTextContent(/^10:20\sAM$/)
    await expect(canvasElement.querySelector('[data-slot="now-marker"]')).toBeNull()
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
      /^Picked up Ana Petrović\. Dr Milica Jovanović, 9:00\sAM – 10:00\sAM\.$/,
    )
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await userEvent.keyboard('{ArrowDown}')
    await expect(liveRegion(canvasElement)).toHaveTextContent(
      /^Ana Petrović: Dr Nenad Kovačević, 9:30\sAM – 10:30\sAM\.$/,
    )
    await expect(booking(canvasElement, 'Ana Petrović')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    // The drop only proposes: nothing moves until the confirmation's Save (P5.28 item 9). The
    // page under the open dialog is hidden from assistive technology.
    await expect(
      within(canvasElement).getByRole('button', { name: /^Ana Petrović, /, hidden: true }),
    ).toHaveAccessibleName(/Dr Milica Jovanović, 9:00\sAM – 10:00\sAM$/)
    await saveMove('Ana Petrović')
    await expect(
      canvas.getByText('Moved b2 to kovacevic at 2026-10-14T09:30–2026-10-14T10:30; no message'),
    ).toBeVisible()
    await waitFor(async () => {
      await expect(booking(canvasElement, 'Ana Petrović')).toHaveAccessibleName(
        /Dr Nenad Kovačević, 9:30\sAM – 10:30\sAM$/,
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
    // The action, then the booking it moves, bold on its own line (P5.28 item 6).
    await expect(panel.querySelector('[data-slot="move-subject"]')).toHaveTextContent('Marko Ilić')
    await userEvent.click(within(panel).getByRole('combobox', { name: 'Doctor or room' }))
    await userEvent.click(await body.findByRole('option', { name: 'Dr Jelena Stojanović' }))
    // The panel is hidden from assistive technology while the select is open.
    await userEvent.click(await within(panel).findByRole('combobox', { name: 'Start' }))
    await userEvent.click(await body.findByRole('option', { name: /^11:00\sAM$/ }))
    await userEvent.click(await within(panel).findByRole('button', { name: 'Move' }))
    // The confirmation: the message is a choice; checked, Save says so (P5.28 item 9).
    const dialog = await body.findByRole('dialog', { name: 'Move booking Marko Ilić' })
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /^Notify Marko Ilić/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save and notify' }))
    await expect(
      canvas.getByText('Moved b1 to stojanovic at 2026-10-14T11:00–2026-10-14T11:30; message sent'),
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
    await saveMove('Marko Ilić')
    await expect(
      canvas.getByText('Moved b1 to kovacevic at 2026-10-14T09:00–2026-10-14T09:30; no message'),
    ).toBeVisible()
  },
}

/**
 * A move proposed (by a drag, the keys or "Move to…"): the application asks first — the booking,
 * its doctor and time old → new, the person's message as an unchecked choice — and moves it only
 * on Save (P5.28 item 9). The schedule still shows the booking where it is.
 */
export const MoveAsked: Story = {
  name: 'Move asked',
  render: () => (
    <ScheduleFrame>
      <Schedule
        proposed={{
          id: 'b1',
          resourceId: 'stojanovic',
          start: '2026-10-14T11:00',
          end: '2026-10-14T11:30',
        }}
      />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Move booking Marko Ilić' })
    await expect(
      within(dialog).getByRole('checkbox', { name: /^Notify Marko Ilić/ }),
    ).not.toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible()
    // Still in its place (the page under the dialog is hidden from assistive technology).
    await expect(
      within(canvasElement).getByRole('button', { name: /^Marko Ilić, /, hidden: true }),
    ).toHaveAccessibleName(/Dr Milica Jovanović, 8:00\sAM – 8:30\sAM$/)
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
    await saveMove('Marko Ilić')
    await expect(
      canvas.getByText('Moved b1 to kovacevic at 2026-10-14T08:30–2026-10-14T09:00; no message'),
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

// ── Days (P5.25): stays over two weeks ──

const ROOMS = [
  { id: 'r101', name: 'Room 101', description: 'Double' },
  { id: 'r102', name: 'Room 102', description: 'Twin' },
  { id: 'r103', name: 'Room 103', description: 'Single' },
  { id: 'r104', name: 'Room 104', description: 'Suite' },
]

/** Fourteen days from Wednesday 14 October 2026 (the stories' today). */
const FORTNIGHT = Array.from(
  { length: 14 },
  (_, index) => `2026-10-${String(14 + index).padStart(2, '0')}`,
)

/** Stays by their days: `end` is the last night, included. */
const STAYS: ScheduleBooking[] = [
  {
    id: 's1',
    resourceId: 'r101',
    title: 'Marko Ilić',
    start: '2026-10-12',
    end: '2026-10-15',
    tone: 'info',
    locked: true,
  },
  { id: 's2', resourceId: 'r101', title: 'Ana Petrović', start: '2026-10-16', end: '2026-10-19' },
  {
    id: 's3',
    resourceId: 'r102',
    title: 'Thomas Becker',
    description: '2 adults',
    start: '2026-10-14',
    end: '2026-10-20',
  },
  { id: 's4', resourceId: 'r103', title: 'Sofia Rossi', start: '2026-10-21', end: '2026-10-22' },
  {
    id: 's5',
    resourceId: 'r104',
    title: 'Jelena Stojanović',
    description: 'VIP',
    start: '2026-10-24',
    end: '2026-10-30',
    tone: 'premium',
  },
]

const STAY_UNAVAILABLE = [
  { resourceId: 'r103', start: '2026-10-15', end: '2026-10-17', reason: 'Out of order: new floor' },
]

function daysSchedule(phone = false) {
  return (
    <ScheduleFrame>
      <Schedule
        {...(phone ? { layout: 'phone' as const, className: 'p-4' } : {})}
        scale="days"
        days={FORTNIGHT}
        resources={ROOMS}
        initial={STAYS}
        unavailable={STAY_UNAVAILABLE}
        label="Rooms, 14 – 27 October 2026"
        resourceLabel="Room"
      />
    </ScheduleFrame>
  )
}

/**
 * `scale="days"`: rooms over two weeks, one column a day under its weekday and date (today in the
 * neutral circle); a stay that began before the first day is drawn from it, one that ends after
 * the last runs to it; an out-of-order room is hatched with its reason.
 */
export const Days: Story = {
  name: 'Days, two weeks',
  render: () => daysSchedule(),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(booking(canvasElement, 'Thomas Becker')).toHaveAccessibleName(
      /^Thomas Becker, Room 102, 10\/14\/2026 – 10\/20\/2026$/,
    )
    await expect(booking(canvasElement, 'Marko Ilić')).toHaveAccessibleName(
      /^Marko Ilić, Room 101, 10\/14\/2026 – 10\/15\/2026$/,
    )
    await expect(canvas.queryByRole('button', { name: 'Move to…: Marko Ilić' })).toBeNull()
    await expect(
      canvas.getByText('Unavailable: Out of order: new floor, 10/15/2026 – 10/17/2026'),
    ).toBeInTheDocument()
  },
}

/** The keyboard moves a stay by whole days (from the leading edge) and to another room. */
export const DaysKeyboardInteraction: Story = {
  name: 'Days keyboard, interaction',
  tags: ['interaction'],
  render: () => daysSchedule(),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    booking(canvasElement, 'Sofia Rossi').focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await userEvent.keyboard('{ArrowUp}')
    await expect(liveRegion(canvasElement)).toHaveTextContent(
      'Sofia Rossi: Room 102, 10/22/2026 – 10/23/2026.',
    )
    await userEvent.keyboard('{Enter}')
    await saveMove('Sofia Rossi')
    await expect(
      canvas.getByText('Moved s4 to r102 at 2026-10-22–2026-10-23; no message'),
    ).toBeVisible()
  },
}

/** "Move to…" offers every day shown as the stay's first day. */
export const DaysMoveToInteraction: Story = {
  name: 'Days move to, interaction',
  tags: ['interaction'],
  render: () => daysSchedule(),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Move to…: Ana Petrović' }))
    const panel = await body.findByRole('dialog', { name: 'Move to…: Ana Petrović' })
    await expect(within(panel).queryByRole('combobox', { name: 'Day' })).toBeNull()
    await userEvent.click(within(panel).getByRole('combobox', { name: 'Start' }))
    await userEvent.click(await body.findByRole('option', { name: /^Wednesday, October 21, 2026/ }))
    await userEvent.click(await within(panel).findByRole('button', { name: 'Move' }))
    await saveMove('Ana Petrović')
    await waitFor(async () => {
      await expect(
        canvas.getByText('Moved s2 to r101 at 2026-10-21–2026-10-24; no message'),
      ).toBeVisible()
    })
  },
}

/** Days on a phone: one room at a time, the days running down. */
export const DaysPhone: Story = {
  name: 'Days, phone width',
  render: () => <PhoneFrame>{daysSchedule(true)}</PhoneFrame>,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Room' })).toHaveTextContent('Room 101')
    await expect(booking(canvasElement, 'Ana Petrović')).toBeVisible()
    const schedule = canvasElement.querySelector<HTMLElement>('[data-slot="resource-schedule"]')
    if (schedule !== null)
      await expect(schedule.scrollWidth).toBeLessThanOrEqual(schedule.clientWidth)
  },
}

// ── Phones with many rows (P5.90 item 19, the F7 phone rule): today's lists, no timeline ──

/** Hotel Fruška's 200 rooms on a phone: the day's lists, a search, a press opens the stay. */
function HotelPhone({
  lists = HOTEL_LISTS,
  loading = false,
}: {
  lists?: readonly SchedulePhoneList[]
  loading?: boolean
}) {
  const [opened, setOpened] = useState('')
  return (
    <PhoneFrame>
      <ScheduleFrame>
        <div className="flex flex-col gap-3 p-4">
          <ResourceSchedule
            layout="phone"
            scale="days"
            days={FORTNIGHT}
            resources={HOTEL_ROOMS}
            bookings={HOTEL_STAYS}
            phoneLists={lists}
            phoneSearchLabel="Search guests or rooms"
            label="Hotel Fruška, Wednesday 14 October"
            loading={loading}
            onSelect={(stay) => {
              setOpened(`Opened: ${stay.title}`)
            }}
          />
          <output className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{opened}</output>
        </div>
      </ScheduleFrame>
    </PhoneFrame>
  )
}

/**
 * A hotel of 200 rooms on a phone: no timeline — the day's lists (17 arrivals, 20 departures, 134
 * in house), which the application passes, a list at a time with its count, and a search.
 */
export const PhoneLists: Story = {
  name: 'Phone, 200 rooms: today’s lists',
  render: () => <HotelPhone />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Arrivals 17' })).toBeChecked()
    await expect(canvas.getByRole('radio', { name: 'In house 134' })).not.toBeChecked()
    await expect(canvas.getByRole('list', { name: 'Arrivals' }).children).toHaveLength(17)
    await expect(canvasElement.querySelector('[data-track]')).toBeNull()
  },
}

/** Search by a guest without accents, choose the list, press a stay to open it. */
export const PhoneListsInteraction: Story = {
  name: 'Phone lists, interaction',
  tags: ['interaction'],
  render: () => <HotelPhone />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: /^In house/ }))
    await expect(canvas.getByRole('list', { name: 'In house' }).children).toHaveLength(134)
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search guests or rooms' }),
      'dordevic',
    )
    const list = canvas.getByRole('list', { name: 'In house' })
    await expect(list.children.length).toBeLessThan(134)
    for (const row of Array.from(list.children)) {
      await expect(row).toHaveTextContent('Đorđević')
    }
    // The counts follow the search: Thomas Đorđević arrives today.
    await expect(canvas.getByRole('radio', { name: 'Arrivals 1' })).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: 'Arrivals 1' }))
    await userEvent.click(canvas.getByRole('button', { name: /Thomas Đorđević/ }))
    await expect(canvas.getByText('Opened: Thomas Đorđević')).toBeVisible()
    await userEvent.clear(canvas.getByRole('searchbox', { name: 'Search guests or rooms' }))
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search guests or rooms' }),
      'room 999',
    )
    await expect(canvas.getByText('Nothing matches “room 999”')).toBeVisible()
  },
}

/** A quiet day: no arrivals, in the application's words. */
export const PhoneListsEmpty: Story = {
  name: 'Phone lists, empty',
  render: () => (
    <HotelPhone
      lists={HOTEL_LISTS.map((list) => (list.id === 'in-house' ? list : { ...list, bookings: [] }))}
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No arrivals today')).toBeVisible()
  },
}

/** The lists load: skeleton rows. */
export const PhoneListsLoading: Story = {
  name: 'Phone lists, loading',
  render: () => <HotelPhone loading />,
}

/** Desktops and tablets keep the timeline: `phoneLists` is for phones only. */
export const PhoneListsDesktop: Story = {
  name: 'Phone lists on a desktop: the timeline',
  render: () => (
    <ScheduleFrame>
      <Schedule
        scale="days"
        days={FORTNIGHT}
        resources={ROOMS}
        initial={STAYS}
        phoneLists={[{ id: 'arrivals', label: 'Arrivals', bookings: STAYS.slice(2, 3) }]}
        label="Rooms, 14 – 27 October 2026"
        resourceLabel="Room"
        layout="desktop"
      />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-track]')).not.toBeNull()
    await expect(within(canvasElement).queryByRole('list', { name: 'Arrivals' })).toBeNull()
  },
}

/*
 * P5.28 item 4: the hours row stays below the shell's sticky header while the page scrolls, and
 * the names stay at the start while the schedule scrolls sideways.
 */

const THIRTY_ROOMS = Array.from({ length: 30 }, (_, index) => ({
  id: `room${String(index + 1)}`,
  name: `Room ${String(index + 1)}`,
  description: index % 2 === 0 ? 'Examination' : 'Treatment',
}))

/** Thirty rooms over a long day, on a page under the shell; the page and the schedule scroll. */
export const UnderTheShell: Story = {
  name: 'Thirty rows under the shell, interaction',
  tags: ['interaction'],
  render: () => (
    <ScheduleFrame>
      <ShellPage>
        <Schedule
          resources={THIRTY_ROOMS}
          unavailable={[]}
          initial={[
            {
              id: 'r1',
              resourceId: 'room13',
              title: 'Marko Ilić',
              start: '2026-10-14T09:00',
              end: '2026-10-14T10:00',
            },
          ]}
          dayStart="07:00"
          dayEnd="20:00"
        />
      </ShellPage>
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const region = within(canvasElement).getByRole('region', {
      name: 'Health centre Liman, Wednesday 14 October',
    })
    const head = region.querySelector('[data-sticky-head]')
    if (head === null) throw new Error('no hours row')
    await scrollUnderShell(canvasElement, region, 400)
    await expectBelowShell(canvasElement, head)
    const name = within(region).getByText('Room 13').parentElement
    if (name === null) throw new Error('no name cell')
    await expectFirstColumnStays(region, name, booking(canvasElement, 'Marko Ilić'))
  },
}

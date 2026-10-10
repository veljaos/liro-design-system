import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CalendarView, type CalendarEvent, type CalendarViewProps } from './calendar-view'
import type { CalendarViewName } from './schedule-logic'
import { CLINIC_EVENTS, LONG_EVENTS, SCHEDULE_TODAY, ScheduleFrame } from './schedule-story-data'
import { PhoneFrame } from './story-frames'

/** The application around the calendar: it keeps the view and the date, and shows what was chosen. */
function Calendar({
  initialView,
  initialDate,
  ...rest
}: Partial<CalendarViewProps> & { initialView?: CalendarViewName; initialDate?: string }) {
  const [view, setView] = useState<CalendarViewName | undefined>(initialView)
  const [date, setDate] = useState(initialDate ?? SCHEDULE_TODAY)
  const [chosen, setChosen] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <CalendarView
        events={CLINIC_EVENTS}
        label="Appointments of Dr Milica Jovanović"
        onSelect={(event) => {
          setChosen(`Opened: ${event.title}`)
        }}
        onSlotSelect={(slot) => {
          setChosen(`New appointment at ${slot.start}`)
        }}
        {...rest}
        {...(view === undefined ? {} : { view })}
        onViewChange={setView}
        date={date}
        onDateChange={setDate}
      />
      <output className="text-sm text-secondary">{chosen}</output>
    </div>
  )
}

/** The event button with this title (its name starts with the title). */
function eventButton(canvasElement: HTMLElement, title: string): HTMLElement {
  return within(canvasElement).getByRole('button', { name: new RegExp(`^${title}, `) })
}

function rtl(canvasElement: HTMLElement): boolean {
  const calendar = canvasElement.querySelector('[data-slot="calendar-view"]') ?? canvasElement
  return getComputedStyle(calendar).direction === 'rtl'
}

const meta = {
  title: 'Components/Scheduling/CalendarView',
  component: CalendarView,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a person’s or a team’s events in time — appointments, meetings, shifts, ' +
          'lessons — in a **day**, a **week**, a **month** or an **agenda** (the week as a list). ' +
          'The toolbar has Today, previous and next and the period’s title; the view switcher ' +
          'stands at the end. The week’s first day, month and weekday names, dates, times, ' +
          '"today" and the time zone come from `LiroProvider`; an event’s local time ' +
          '("2026-10-14T09:00") is shown as written, an instant with an offset in the provider’s ' +
          '`timeZone`.\n\n' +
          '**Events** come from props (`id`, `title`, `start`/`end`, optional `tone` and ' +
          '`description`); overlapping events stand side by side, all-day events (and events ' +
          'outside the hours shown) in a strip above the day and week grids, and a month day shows ' +
          'three lines, then "+N more", which opens the day’s list. An event is a button whose ' +
          'name says its title, time and day (`onSelect`).\n\n' +
          '**Keyboard:** the grid is one tab stop; the arrows move between days (from the leading ' +
          'edge in right-to-left) and time slots, Page Up / Page Down change the period, Enter on ' +
          'a slot reports it (`onSlotSelect`, e.g. to book there) and on a month day opens its ' +
          'list. Events follow the grid in the tab order.\n\n' +
          '**Phones:** Day and Agenda (agenda by default); a week or month is shown as its agenda, ' +
          'so nothing scrolls sideways at 360px.\n\n' +
          '**When:** events with a time that people plan around.\n\n' +
          '**When not:** several people or rooms side by side (ResourceSchedule); choosing one free ' +
          'slot to book (SlotPicker); a school week of periods (Timetable); a list of records with ' +
          'dates (DataTable).',
      },
    },
  },
  args: { events: CLINIC_EVENTS, label: 'Appointments' },
  render: () => (
    <ScheduleFrame>
      <Calendar />
    </ScheduleFrame>
  ),
  play: settle,
} satisfies Meta<typeof CalendarView>

export default meta

type Story = StoryObj<typeof meta>

/** The week of 12–18 October 2026: overlaps side by side, all-day events above, today marked. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', {
        name: /^Minor surgery: Stefan Đorđević, 09:00\sAM – 10:30\sAM, Wednesday, October 14, 2026$/,
      }),
    ).toBeVisible()
    await expect(canvas.getByRole('grid')).toBeVisible()
    await expect(canvas.getByRole('radio', { name: 'Week' })).toBeChecked()
    // Three events overlap at 10:00 on Wednesday: each a third of the column wide at most.
    const surgery = eventButton(canvasElement, 'Minor surgery: Stefan Đorđević')
    const consultation = eventButton(canvasElement, 'Consultation: Dragana Nikolić')
    await expect(Math.round(surgery.getBoundingClientRect().width)).toBe(
      Math.round(consultation.getBoundingClientRect().width),
    )
    await expect(
      surgery.getBoundingClientRect().top < consultation.getBoundingClientRect().top,
    ).toBe(true)
  },
}

/** One day: the hours run down, every slot a 24px target. */
export const Day: Story = {
  render: () => (
    <ScheduleFrame>
      <Calendar initialView="day" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getAllByRole('row')).toHaveLength(26)
  },
}

/** The month: three lines a day, then "+N more"; the leave runs over several days. */
export const Month: Story = {
  render: () => (
    <ScheduleFrame>
      <Calendar initialView="month" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'October 2026' })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '3 more events on Wednesday, October 14, 2026' }),
    ).toHaveTextContent('+3 more')
  },
}

/** The day's list, open: every event of the day and "Open the day". */
export const MonthDayList: Story = {
  name: 'Month, day list',
  render: () => (
    <ScheduleFrame>
      <Calendar initialView="month" defaultOpenDay="2026-10-14" />
    </ScheduleFrame>
  ),
  play: async () => {
    await settle()
    const list = await within(document.body).findByRole('dialog', {
      name: 'Wednesday, October 14, 2026',
    })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    await expect(within(list).getByRole('button', { name: 'Open the day' })).toBeVisible()
  },
}

/** "+N more" opens the list; an event in it is chosen; Escape returns to the day. */
export const MonthMoreInteraction: Story = {
  name: 'Month, more, interaction',
  tags: ['interaction'],
  render: () => (
    <ScheduleFrame>
      <Calendar initialView="month" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: '3 more events on Wednesday, October 14, 2026' }),
    )
    const list = await within(document.body).findByRole('dialog')
    await userEvent.click(within(list).getByRole('button', { name: /Lab results: Milan Savić/ }))
    await expect(canvas.getByText('Opened: Lab results: Milan Savić')).toBeVisible()
    await userEvent.click(within(list).getByRole('button', { name: 'Open the day' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('radio', { name: 'Day' })).toBeChecked()
    })
    await expect(canvas.getByRole('heading', { name: 'Wednesday, October 14, 2026' })).toBeVisible()
  },
}

/** The agenda: the week's days that have events, each event with its time. */
export const Agenda: Story = {
  render: () => (
    <ScheduleFrame>
      <Calendar initialView="agenda" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(5)
    await expect(canvas.getByRole('heading', { name: /Today$/ })).toBeVisible()
  },
}

/**
 * The keyboard in the week: the arrows move between slots and days (from the leading edge),
 * Enter reports the slot.
 */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const first = canvas.getByRole('gridcell', { name: /^Wednesday, October 14, 2026, 07:00\sAM$/ })
    await expect(first).toHaveAttribute('tabindex', '0')
    first.focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect(
      canvas.getByRole('gridcell', { name: /^Wednesday, October 14, 2026, 08:00\sAM$/ }),
    ).toHaveFocus()
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await expect(
      canvas.getByRole('gridcell', { name: /^Thursday, October 15, 2026, 08:00\sAM$/ }),
    ).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('New appointment at 2026-10-15T08:00')).toBeVisible()
    // Page Down goes to the next week; the title follows.
    await userEvent.keyboard('{PageDown}')
    await expect(
      canvas.getByRole('gridcell', { name: /^Thursday, October 22, 2026, 08:00\sAM$/ }),
    ).toHaveFocus()
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(
      '10/19/2026 – 10/25/2026',
    )
  },
}

/** The toolbar: next, previous, Today and the view switcher. */
export const NavigationInteraction: Story = {
  name: 'Navigation, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const title = canvas.getByRole('heading', { level: 2 })
    await userEvent.click(canvas.getByRole('button', { name: 'Next week' }))
    await expect(title).toHaveTextContent('10/19/2026 – 10/25/2026')
    await userEvent.click(canvas.getByRole('button', { name: 'Today' }))
    await expect(title).toHaveTextContent('10/12/2026 – 10/18/2026')
    await userEvent.click(canvas.getByRole('radio', { name: 'Month' }))
    await expect(title).toHaveTextContent('October 2026')
    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }))
    await expect(title).toHaveTextContent('September 2026')
  },
}

/** A month day without events: Enter reports the day, to plan something there. */
export const MonthKeyboardInteraction: Story = {
  name: 'Month keyboard, interaction',
  tags: ['interaction'],
  render: () => (
    <ScheduleFrame>
      <Calendar initialView="month" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const today = canvasElement.querySelector<HTMLElement>('[data-cell="2026-10-14"]')
    if (today === null) throw new Error('no cell for today')
    today.focus()
    await userEvent.keyboard('{ArrowDown}')
    const next = canvasElement.querySelector('[data-cell="2026-10-21"]')
    await expect(next).toHaveFocus()
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowRight}' : '{ArrowLeft}')
    await expect(canvasElement.querySelector('[data-cell="2026-10-20"]')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('New appointment at 2026-10-20')).toBeVisible()
  },
}

/** Without `onSelect` the events are shown, not pressable; their names are still read. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ScheduleFrame>
      <CalendarView events={CLINIC_EVENTS} label="Appointments" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /^Check-up: Petar Đurić/ })).toBeNull()
    await expect(
      canvas.getByText(/^Check-up: Petar Đurić, 08:00\sAM – 08:30\sAM/),
    ).toBeInTheDocument()
  },
}

/** Loading: a skeleton under the toolbar. */
export const Loading: Story = {
  render: () => (
    <ScheduleFrame>
      <Calendar loading />
    </ScheduleFrame>
  ),
}

/** An empty week and an empty agenda. */
export const Empty: Story = {
  render: () => (
    <ScheduleFrame>
      <div className="flex flex-col gap-8">
        <Calendar events={[]} />
        <Calendar events={[]} initialView="agenda" />
      </div>
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Nothing planned in this period')).toBeVisible()
  },
}

/** Long titles are cut in the grid (the button's name and tooltip keep them whole) and wrap in the agenda. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ScheduleFrame>
      <div className="flex flex-col gap-8">
        <Calendar events={LONG_EVENTS} initialView="day" dayStart="08:00" dayEnd="11:00" />
        <Calendar events={LONG_EVENTS} initialView="agenda" />
      </div>
    </ScheduleFrame>
  ),
}

/** Hours, slots and the week's first day: 15-minute slots from 08:00 to 12:00, Sunday first. */
export const HoursAndWeekStart: Story = {
  name: 'Hours and week start',
  render: () => (
    <ScheduleFrame weekStartsOn={0}>
      <Calendar dayStart="08:00" dayEnd="12:00" slotMinutes={15} />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(
      '10/11/2026 – 10/17/2026',
    )
    await expect(canvas.getAllByRole('row')).toHaveLength(16)
    // The 06:30 handover lies outside the hours: it stands in the strip above, with its time.
    await expect(eventButton(canvasElement, 'Early shift handover')).toHaveTextContent(/06:30\sAM/)
  },
}

/** Instants with an offset are shown in the provider's time zone: Belgrade, then Tokyo. */
const ONLINE: readonly CalendarEvent[] = [
  {
    id: 'z1',
    title: 'Video consultation: Ana Petrović',
    start: '2026-10-14T07:30:00Z',
    end: '2026-10-14T08:00:00Z',
  },
]

export const TimeZone: Story = {
  name: 'Time zone',
  render: () => (
    <div className="flex flex-col gap-8">
      <ScheduleFrame timeZone="Europe/Belgrade">
        <CalendarView events={ONLINE} label="Belgrade" view="agenda" />
      </ScheduleFrame>
      <ScheduleFrame timeZone="Asia/Tokyo">
        <CalendarView events={ONLINE} label="Tokyo" view="agenda" />
      </ScheduleFrame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/^09:30\sAM – 10:00\sAM$/)).toBeVisible()
    await expect(canvas.getByText(/^04:30\sPM – 05:00\sPM$/)).toBeVisible()
  },
}

/** On a phone: the agenda by default, Day and Agenda to choose from, nothing sideways. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ScheduleFrame>
        <div className="p-4">
          <Calendar layout="phone" />
        </div>
      </ScheduleFrame>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Agenda' })).toBeChecked()
    await expect(canvas.queryByRole('radio', { name: 'Week' })).toBeNull()
    const calendar = canvasElement.querySelector<HTMLElement>('[data-slot="calendar-view"]')
    if (calendar !== null)
      await expect(calendar.scrollWidth).toBeLessThanOrEqual(calendar.clientWidth)
  },
}

/** A day on a phone: one column. */
export const PhoneDay: Story = {
  name: 'Phone width, day',
  render: () => (
    <PhoneFrame>
      <ScheduleFrame>
        <div className="p-4">
          <Calendar layout="phone" initialView="day" dayStart="08:00" dayEnd="15:00" />
        </div>
      </ScheduleFrame>
    </PhoneFrame>
  ),
}

/** Arabic events in a right-to-left week: the days run from the right. */
export const Arabic: Story = {
  render: () => (
    <ScheduleFrame locale="ar">
      <CalendarView
        label="المواعيد"
        onSelect={() => undefined}
        events={[
          { id: 'a1', title: 'فحص: أحمد علي', start: '2026-10-12T09:00', end: '2026-10-12T09:30' },
          {
            id: 'a2',
            title: 'استشارة: سارة حسن',
            start: '2026-10-14T10:00',
            end: '2026-10-14T11:00',
            tone: 'info',
          },
          { id: 'a3', title: 'اجتماع الفريق', start: '2026-10-15' },
        ]}
        dayStart="08:00"
        dayEnd="13:00"
      />
    </ScheduleFrame>
  ),
}

/** Japanese events in the month view. */
export const Japanese: Story = {
  render: () => (
    <ScheduleFrame locale="ja">
      <CalendarView
        label="予約"
        view="month"
        onSelect={() => undefined}
        events={[
          {
            id: 'j1',
            title: '診察：佐藤 花子',
            start: '2026-10-12T09:00',
            end: '2026-10-12T09:30',
          },
          {
            id: 'j2',
            title: '相談：田中 一郎',
            start: '2026-10-14T10:00',
            end: '2026-10-14T11:00',
            tone: 'success',
          },
          { id: 'j3', title: 'チーム会議', start: '2026-10-21', end: '2026-10-22', tone: 'info' },
        ]}
      />
    </ScheduleFrame>
  ),
}

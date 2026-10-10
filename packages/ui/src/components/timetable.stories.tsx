import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CLASS_LESSONS, SCHOOL_PERIODS, ScheduleFrame } from './schedule-story-data'
import { PhoneFrame } from './story-frames'
import { Timetable, type TimetableProps } from './timetable'

/** The application around the timetable: it says which lesson was opened. */
function Grid(props: Partial<TimetableProps>) {
  const [said, setSaid] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <Timetable
        label="OŠ Jovan Popović, class 7/2, 2026/27"
        periods={SCHOOL_PERIODS}
        lessons={CLASS_LESSONS}
        now="09:10"
        onSelect={(lesson) => {
          setSaid(`Opened: ${lesson.subject}`)
        }}
        {...props}
      />
      <output className="text-sm text-secondary">{said}</output>
    </div>
  )
}

const meta = {
  title: 'Components/Scheduling/Timetable',
  component: Timetable,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a school week — the periods of the day (rows, with their times) by the ' +
          'weekdays (columns) — with each lesson’s subject, teacher and room, an optional note in ' +
          'a status tone (a test, a substitution) and empty periods. Weekday names, times and ' +
          '"today" come from `LiroProvider`; `now` (the application’s clock) marks the running ' +
          'period today with a neutral outline and "Now".\n\n' +
          '**Phones:** one day at a time, chosen in a row of weekdays (today first).\n\n' +
          '**When:** a repeating weekly plan of fixed periods (classes, courses, shifts of a ' +
          'school).\n\n' +
          '**When not:** dated events (CalendarView); people or rooms over a day ' +
          '(ResourceSchedule).',
      },
    },
  },
  args: { periods: SCHOOL_PERIODS, lessons: CLASS_LESSONS, label: 'Timetable' },
  render: () => (
    <ScheduleFrame>
      <Grid />
    </ScheduleFrame>
  ),
  play: settle,
} satisfies Meta<typeof Timetable>

export default meta

type Story = StoryObj<typeof meta>

/** Class 7/2's week; Wednesday is today and the 2nd period is running (a mathematics test). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'OŠ Jovan Popović, class 7/2, 2026/27' })
    await expect(within(table).getAllByRole('row')).toHaveLength(7)
    await expect(canvas.getByRole('columnheader', { name: /^Wednesday/ })).toHaveAttribute(
      'aria-current',
      'date',
    )
    const now = canvasElement.querySelector('[aria-current="time"]')
    await expect(now).toHaveTextContent('Now')
    await expect(now).toHaveTextContent('Mathematics')
    await expect(canvas.getAllByText('Free')).toHaveLength(5)
  },
}

/** A lesson opens on a press. */
export const SelectInteraction: Story = {
  name: 'Select, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Chemistry club/ }))
    await expect(canvas.getByText('Opened: Chemistry club')).toBeVisible()
  },
}

/** Lessons as text (no `onSelect`), six days, no clock. */
export const ReadOnly: Story = {
  name: 'Read-only, six days',
  render: () => (
    <ScheduleFrame>
      <Timetable
        label="OŠ Jovan Popović, class 7/2"
        periods={SCHOOL_PERIODS}
        lessons={[
          ...CLASS_LESSONS,
          {
            id: 's1',
            day: 6,
            periodId: 'p1',
            subject: 'Robotics club',
            teacher: 'Petar Bogdanović',
            room: 'Lab 2',
          },
        ]}
        days={[1, 2, 3, 4, 5, 6]}
      />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
    await expect(canvasElement.querySelector('[aria-current="time"]')).toBeNull()
  },
}

/** Loading: skeleton rows. */
export const Loading: Story = {
  render: () => (
    <ScheduleFrame>
      <Grid loading />
    </ScheduleFrame>
  ),
}

/** No lessons yet: every period free. */
export const Empty: Story = {
  render: () => (
    <ScheduleFrame>
      <Grid lessons={[]} />
    </ScheduleFrame>
  ),
}

/** Long subjects, names and notes wrap in their cells. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ScheduleFrame>
      <Grid
        periods={SCHOOL_PERIODS.slice(0, 2)}
        lessons={[
          {
            id: 'x1',
            day: 1,
            periodId: 'p1',
            subject: 'Informatics and computing: project work in groups',
            teacher: 'Aleksandra Radivojević-Stanković',
            room: 'Computer classroom 2, second floor',
            tone: 'info',
            note: 'Substitute: Kristina Vukašinović-Đorđević',
          },
          {
            id: 'x2',
            day: 3,
            periodId: 'p2',
            subject: 'Mathematics',
            teacher: 'Zoran Mićić',
            room: '14',
            tone: 'warning',
            note: 'Written test: linear equations and inequalities',
          },
        ]}
      />
    </ScheduleFrame>
  ),
}

/** On a phone: one day at a time, today first. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ScheduleFrame>
        <div className="p-4">
          <Grid layout="phone" />
        </div>
      </ScheduleFrame>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Wednesday' })).toBeChecked()
    await expect(canvas.getByText('Geography')).toBeVisible()
    const timetable = canvasElement.querySelector<HTMLElement>('[data-slot="timetable"]')
    if (timetable !== null) {
      await expect(timetable.scrollWidth).toBeLessThanOrEqual(timetable.clientWidth)
    }
  },
}

/** On a phone the day switcher shows another day. */
export const PhoneDayInteraction: Story = {
  name: 'Phone day, interaction',
  tags: ['interaction'],
  render: PhoneWidth.render ?? (() => <></>),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Friday' }))
    await expect(canvas.getByText('Class meeting')).toBeVisible()
    await expect(canvasElement.querySelector('[aria-current="time"]')).toBeNull()
  },
}

/** Arabic subjects in a right-to-left week. */
export const Arabic: Story = {
  render: () => (
    <ScheduleFrame locale="ar">
      <Timetable
        label="الجدول الدراسي"
        periods={SCHOOL_PERIODS.slice(0, 3)}
        now="08:10"
        lessons={[
          {
            id: 'a1',
            day: 1,
            periodId: 'p1',
            subject: 'الرياضيات',
            teacher: 'أحمد علي',
            room: '12',
          },
          {
            id: 'a2',
            day: 3,
            periodId: 'p1',
            subject: 'اللغة العربية',
            teacher: 'سارة حسن',
            room: '8',
          },
          {
            id: 'a3',
            day: 3,
            periodId: 'p2',
            subject: 'العلوم',
            teacher: 'محمد يوسف',
            room: 'مختبر 1',
            tone: 'info',
          },
        ]}
      />
    </ScheduleFrame>
  ),
}

/** Japanese subjects. */
export const Japanese: Story = {
  render: () => (
    <ScheduleFrame locale="ja">
      <Timetable
        label="時間割"
        periods={SCHOOL_PERIODS.slice(0, 3)}
        lessons={[
          { id: 'j1', day: 1, periodId: 'p1', subject: '数学', teacher: '佐藤 先生', room: '12' },
          { id: 'j2', day: 2, periodId: 'p2', subject: '国語', teacher: '田中 先生', room: '8' },
          {
            id: 'j3',
            day: 4,
            periodId: 'p3',
            subject: '理科',
            teacher: '鈴木 先生',
            room: '理科室',
            tone: 'success',
            note: '実験',
          },
        ]}
      />
    </ScheduleFrame>
  ),
}

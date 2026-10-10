import { useState, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import type { Weekday } from '../provider/format'
import { useLiro } from '../provider/liro-provider'
import { toneClasses } from './calendar-view'
import { currentPeriod, initialTimetableDay, weekdayOf } from './schedule-logic'
import type { Tone } from './status-badge'
import { usePhone } from './use-phone'

/*
 * Timetable (BUILD-PLAN P5.8): a weekly school grid — periods (rows, with their times) by weekdays
 * (columns), the lessons from props. The weekday names come from `format.weekdayName`, the times
 * from `format.time`, "today" from the provider; `now` ("HH:mm", the application's clock) marks
 * the period running today.
 * - A table: the caption (`label`), a corner header, the weekdays (today marked in words); each
 *   row a period: its label and its time range; each cell the period's lessons (several when a
 *   class is split): the subject (sm semibold), the teacher and the room (xs), a note in the
 *   tone's colour; the tone's colours (neutral by default) with a 3px bar at the start. An empty
 *   period shows "—" and says `timetable.free` to assistive technology.
 * - The running period: today's cell has a 2px border.selected outline and "Now" (neutral, D17),
 *   `aria-current="time"`.
 * - Phones (below 48em or `layout="phone"`): one day at a time, chosen in a segmented control
 *   (today's day first by default); the periods as a list.
 */

/** A period of the school day, from the application. */
export interface TimetablePeriod {
  id: string
  /** Its name in the day ("1.", "First"). */
  label: string
  /** "HH:mm". */
  start: string
  end: string
}

/** A lesson, from the application. */
export interface TimetableLesson {
  id: string
  /** 0 = Sunday … 6 = Saturday. */
  day: Weekday
  periodId: string
  subject: string
  teacher?: string
  room?: string
  /** A status tone (Appendix A.2), e.g. a test or a substitution; default neutral. */
  tone?: Tone
  /** A short line in the tone's colour ("Test", "Substitute: Ivan Grujić"). */
  note?: string
}

export interface TimetableProps {
  periods: readonly TimetablePeriod[]
  lessons: readonly TimetableLesson[]
  /** The table's caption, from the application ("Class 7/2, 2026/27"). */
  label: string
  /** The weekdays shown, in order. Default Monday to Friday. */
  days?: readonly Weekday[]
  /** The application's clock, "HH:mm": marks the period running today. */
  now?: string
  /** A lesson was opened (pressed, or Enter). Without it lessons are text. */
  onSelect?: (lesson: TimetableLesson) => void
  /** Skeleton rows while the timetable loads. */
  loading?: boolean
  /** Phones: the day shown (controlled); default today when it is a school day. */
  day?: Weekday
  defaultDay?: Weekday
  onDayChange?: (day: Weekday) => void
  /** 'phone' shows one day at a time; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const SCHOOL_WEEK: readonly Weekday[] = [1, 2, 3, 4, 5]

/** The weekly grid of periods and lessons. */
export function Timetable(props: TimetableProps) {
  const { format, messages, today } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const days = props.days ?? SCHOOL_WEEK
  const [innerDay, setInnerDay] = useState<Weekday | undefined>(props.defaultDay)
  const todayWeekday = weekdayOf(today)
  const running = props.now === undefined ? null : currentPeriod(props.periods, props.now)
  const shownDay = initialTimetableDay(days, today, props.day ?? innerDay)

  const timeText = (period: TimetablePeriod) =>
    messages['calendar.range'](
      format.time(`${today}T${period.start}`),
      format.time(`${today}T${period.end}`),
    )
  const lessonsAt = (day: Weekday, periodId: string) =>
    props.lessons.filter((lesson) => lesson.day === day && lesson.periodId === periodId)

  const lessonBox = (lesson: TimetableLesson): ReactNode => {
    const tone = toneClasses(lesson.tone)
    const content = (
      <>
        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-current" />
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {lesson.subject}
        </span>
        {lesson.teacher !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{lesson.teacher}</span>
        )}
        {lesson.room !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{lesson.room}</span>
        )}
        {lesson.note !== undefined && (
          <span className={cn('text-xs font-semibold', TEXT_DIRECTION)}>{lesson.note}</span>
        )}
      </>
    )
    const look = cn(
      'relative box-border flex w-full min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-sm border border-solid py-1.5 ps-3 pe-2 text-start',
      tone.block,
    )
    if (props.onSelect === undefined) return <div className={look}>{content}</div>
    return (
      <button
        type="button"
        className={cn(BUTTON_RESET, look, 'cursor-pointer', FOCUS_RING)}
        onClick={() => {
          props.onSelect?.(lesson)
        }}
      >
        {content}
      </button>
    )
  }

  const cell = (day: Weekday, period: TimetablePeriod) => {
    const lessons = lessonsAt(day, period.id)
    const now = running === period.id && day === todayWeekday
    return (
      <div
        className={cn(
          'relative flex flex-col gap-1',
          now &&
            'rounded-md outline-2 outline-offset-1 outline-(--liro-border-selected) [outline-style:solid]',
        )}
      >
        {now && (
          <span className="self-start rounded-xs bg-surface-selected px-1.5 py-0.5 text-xs font-semibold text-primary">
            {messages['timetable.now']}
          </span>
        )}
        {lessons.length === 0 ? (
          <span className="px-3 py-1.5 text-sm text-tertiary">
            <span aria-hidden="true">—</span>
            <span className="sr-only">{messages['timetable.free']}</span>
          </span>
        ) : (
          lessons.map((lesson) => <div key={lesson.id}>{lessonBox(lesson)}</div>)
        )}
      </div>
    )
  }

  if (props.loading === true) {
    return (
      <div
        role="region"
        aria-label={props.label}
        aria-busy="true"
        className={cn('flex flex-col gap-2', props.className)}
      >
        <Skeleton className="h-8" />
        {props.periods.map((period) => (
          <Skeleton key={period.id} className="h-16" />
        ))}
      </div>
    )
  }

  if (phone) {
    return (
      <section
        data-slot="timetable"
        aria-label={props.label}
        className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
      >
        <p className={cn('m-0 text-md font-semibold text-primary', TEXT_DIRECTION)}>
          {props.label}
        </p>
        <ToggleGroup
          type="single"
          value={String(shownDay)}
          aria-label={messages['timetable.day']}
          className="flex w-full"
          onValueChange={(value) => {
            const day = days.find((each) => String(each) === value)
            if (day === undefined) return
            setInnerDay(day)
            props.onDayChange?.(day)
          }}
        >
          {days.map((day) => (
            <ToggleGroupItem
              key={day}
              value={String(day)}
              aria-label={format.weekdayName(day, 'long')}
              className="first-letter:uppercase"
            >
              {format.weekdayName(day, 'short')}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ol className="m-0 flex list-none flex-col p-0">
          {props.periods.map((period) => (
            <li
              key={period.id}
              {...(running === period.id && shownDay === todayWeekday
                ? { 'aria-current': 'time' as const }
                : {})}
              className="flex gap-3 border-0 border-t border-solid border-subtle py-2 first:border-t-0"
            >
              <div className="flex w-24 shrink-0 flex-col gap-0.5">
                <span className={cn('text-sm font-semibold text-primary', TEXT_ISOLATE)}>
                  {period.label}
                </span>
                <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                  {timeText(period)}
                </span>
              </div>
              <div className="min-w-0 flex-1">{cell(shownDay, period)}</div>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  return (
    <div
      data-slot="timetable"
      className={cn(
        'min-w-0 overflow-x-auto rounded-md border border-solid border-default bg-surface-raised font-sans',
        props.className,
      )}
    >
      <table className="w-full table-fixed border-collapse">
        <caption
          className={cn(
            'px-3 pt-3 pb-2 text-start text-md font-semibold text-primary',
            TEXT_DIRECTION,
          )}
        >
          {props.label}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="w-36 border-0 border-b border-solid border-default px-3 py-2 text-start text-xs font-medium text-secondary"
            >
              {messages['timetable.period']}
            </th>
            {days.map((day) => (
              <th
                key={day}
                scope="col"
                {...(day === todayWeekday ? { 'aria-current': 'date' as const } : {})}
                className="border-0 border-b border-solid border-default px-2 py-2 text-start text-sm font-semibold text-primary"
              >
                <span className="block first-letter:uppercase">
                  {format.weekdayName(day, 'long')}
                </span>
                {day === todayWeekday && (
                  <span className="block text-xs font-medium text-secondary">
                    {messages['calendar.todayMark']}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.periods.map((period) => (
            <tr key={period.id}>
              <th
                scope="row"
                className="border-0 border-t border-solid border-subtle px-3 py-2 text-start align-top"
              >
                <span className={cn('block text-sm font-semibold text-primary', TEXT_ISOLATE)}>
                  {period.label}
                </span>
                <span
                  className={cn(
                    'block text-xs font-regular text-secondary tabular-nums',
                    TEXT_ISOLATE,
                  )}
                >
                  {timeText(period)}
                </span>
              </th>
              {days.map((day) => (
                <td
                  key={day}
                  {...(running === period.id && day === todayWeekday
                    ? { 'aria-current': 'time' as const }
                    : {})}
                  className="border-0 border-t border-s border-solid border-subtle p-1.5 align-top"
                >
                  {cell(day, period)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

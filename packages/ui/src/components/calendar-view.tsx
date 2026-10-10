import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Popover, PopoverAnchor, PopoverContent } from '../primitives/popover'
import { Skeleton } from '../primitives/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro, type LiroContextValue } from '../provider/liro-provider'
import {
  byStart,
  calendarKeyTarget,
  CALENDAR_VIEWS,
  cellEvents,
  layoutDay,
  localDateTime,
  localOfAbsolute,
  minutesOf,
  monthWeeks,
  onDay,
  periodDays,
  shiftPeriod,
  spanOf,
  weekdayOf,
  withinDay,
  type CalendarViewName,
  type GridCell,
  type Span,
} from './schedule-logic'
import type { Tone } from './status-badge'
import { usePhone } from './use-phone'

/*
 * CalendarView (BUILD-PLAN P5.8): events in a day, a week, a month or an agenda (a list of the
 * week's days). Everything that differs between applications comes from the provider: the week's
 * first day (`weekStartsOn`), month and weekday names (`format.monthName`, `format.weekdayName`),
 * dates and times (`format`), "today" (`today`, never the device's clock) and the time zone an
 * instant is shown in (`timeZone`). The calendar shows what it is given and reports a choice; it
 * never creates, moves or checks events.
 * - Toolbar: Today, previous and next (chevrons mirrored in right-to-left), the period's title
 *   (a live heading), and the view switcher at the end (the neutral segmented control). Phones
 *   offer Day and Agenda; a week or month asked for on a phone is shown as its agenda.
 * - Day and week: a grid of time slots (`slotMinutes`, 24px each, so every slot is a target) from
 *   `dayStart` to `dayEnd`; events as blocks over their day's column, overlapping events side by
 *   side (`layoutDay`); all-day events, and timed events outside the hours shown, in a strip
 *   above. Month: whole weeks, at most three lines a day, then "+N more", which opens the day's
 *   list (a popover with every event and "Open the day"). Agenda: the week's days that have
 *   events, each event a row with its time.
 * - Tones: an event's optional status tone (neutral by default) colours its block — the tone's
 *   bg with its fg text and a 3px bar in the fg at the start. Never blue (D17).
 * - Keyboard (role grid, one tab stop): the arrows move between days (from the leading edge,
 *   Appendix B.7) and slots, Home / End and Page Up / Page Down as `calendarKeyTarget`; leaving
 *   the period moves the calendar. Enter on a slot reports it (`onSlotSelect`); Enter on a month
 *   day opens its list (or reports the day when it has none). Events are buttons whose names say
 *   the title, the time and the day; in the time grid they follow the grid in the tab order.
 */

/** An event, from the application. */
export interface CalendarEvent {
  id: string
  /** What the event is, from the application ("Check-up: Marko Ilić"). */
  title: string
  /**
   * "YYYY-MM-DD" (all day) or a local "YYYY-MM-DDTHH:mm", shown as written. An instant with an
   * offset ("2026-10-12T07:30:00Z") is shown in the provider's time zone.
   */
  start: string
  /**
   * Of an all-day event the last day (included); of a timed one the end (excluded). Default: the
   * start's day, or the start itself.
   */
  end?: string
  /** A status tone among the six (Appendix A.2); default neutral. Never the only signal. */
  tone?: Tone
  /** A line under the title in the agenda and the day list. */
  description?: string
}

/** A slot or a day the user chose, to create something there: local values or days. */
export interface CalendarSlot {
  /** "YYYY-MM-DDTHH:mm", or "YYYY-MM-DD" for a month's day. */
  start: string
  end: string
}

export interface CalendarViewProps {
  events: readonly CalendarEvent[]
  /** Names the calendar for assistive technology, from the application ("Appointments"). */
  label: string
  /** The view shown (controlled). Default: week, on phones agenda. */
  view?: CalendarViewName
  /** The first view (uncontrolled). */
  defaultView?: CalendarViewName
  onViewChange?: (view: CalendarViewName) => void
  /** A day of the period shown, YYYY-MM-DD (controlled). Default: the provider's today. */
  date?: string
  defaultDate?: string
  onDateChange?: (date: string) => void
  /** An event was chosen (pressed, or Enter). Without it events are shown, not pressable. */
  onSelect?: (event: CalendarEvent) => void
  /** A free slot or day was chosen (pressed, or Enter), e.g. to book there. */
  onSlotSelect?: (slot: CalendarSlot) => void
  /** The day and week views' hours, "HH:mm". Default 07:00 – 20:00. */
  dayStart?: string
  dayEnd?: string
  /** Minutes per slot of the day and week views. Default 30. */
  slotMinutes?: 15 | 30 | 60
  /** Skeleton while the events load. */
  loading?: boolean
  /** The day whose list is open from the start (a month's "+N more"), YYYY-MM-DD. */
  defaultOpenDay?: string
  /** 'phone' offers Day and Agenda; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  /** The period title's heading level; the agenda's days are one below. Default 2. */
  headingLevel?: 2 | 3
  className?: string
}

/** The height of one slot of the time grid, px: every slot is a 24px target (WCAG 2.5.8). */
const SLOT_HEIGHT = 24
/** The free strip at the end of each day column, px. */
const SLOT_TARGET = 24
/** The time gutter at the start of the time grid, px. */
const GUTTER = 72
/** Lines a month day shows before "+N more". */
const MONTH_LINES = 3

/** Every class is written out, so Tailwind finds them. */
const TONES: Record<Tone, { block: string; fg: string }> = {
  neutral: {
    block: 'bg-status-neutral-bg text-status-neutral-fg border-status-neutral-border',
    fg: 'text-status-neutral-fg',
  },
  info: {
    block: 'bg-status-info-bg text-status-info-fg border-status-info-border',
    fg: 'text-status-info-fg',
  },
  success: {
    block: 'bg-status-success-bg text-status-success-fg border-status-success-border',
    fg: 'text-status-success-fg',
  },
  warning: {
    block: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
    fg: 'text-status-warning-fg',
  },
  danger: {
    block: 'bg-status-danger-bg text-status-danger-fg border-status-danger-border',
    fg: 'text-status-danger-fg',
  },
  premium: {
    block: 'bg-status-premium-bg text-status-premium-fg border-status-premium-border',
    fg: 'text-status-premium-fg',
  },
}

/** The tone classes of a status tone (shared with ResourceSchedule and Timetable). */
export function toneClasses(tone: Tone | undefined): { block: string; fg: string } {
  return TONES[tone ?? 'neutral']
}

/** An event with its span on the time line. */
interface Read {
  event: CalendarEvent
  span: Span
}

/** The texts of an event: its time, its day(s) and its accessible name. */
function eventTexts(
  read: Read,
  liro: Pick<LiroContextValue, 'format' | 'messages'>,
): { time: string; start: string; date: string; label: string } {
  const { format, messages } = liro
  const startDay = Math.floor(read.span.start / 1440)
  const lastDay = Math.floor((read.span.end - (read.span.allDay ? 1 : 0)) / 1440)
  const startText = format.time(localOfAbsolute(read.span.start))
  const time = read.span.allDay
    ? messages['calendar.allDay']
    : read.span.end === read.span.start
      ? startText
      : messages['calendar.range'](startText, format.time(localOfAbsolute(read.span.end)))
  const first = localOfAbsolute(startDay * 1440).slice(0, 10)
  const last = localOfAbsolute(lastDay * 1440).slice(0, 10)
  const date =
    first === last
      ? format.dateLong(first)
      : messages['calendar.range'](format.date(first), format.date(last))
  return {
    time,
    start: read.span.allDay ? messages['calendar.allDay'] : startText,
    date,
    label: messages['calendar.eventLabel'](read.event.title, time, date),
  }
}

/** The title of the period a view shows. */
function periodTitle(
  view: CalendarViewName,
  date: string,
  days: readonly string[],
  liro: Pick<LiroContextValue, 'format' | 'messages'>,
): string {
  const { format, messages } = liro
  if (view === 'day') return format.dateLong(date)
  if (view === 'month') {
    return messages['calendar.monthTitle'](
      format.monthName(Number(date.slice(5, 7)), 'long'),
      date.slice(0, 4).replace(/^0+/, ''),
    )
  }
  return messages['calendar.range'](format.date(days[0] ?? date), format.date(days.at(-1) ?? date))
}

/** The calendar: a toolbar and the chosen view of the events. */
export function CalendarView(props: CalendarViewProps) {
  const liro = useLiro()
  const { messages, today, weekStartsOn, timeZone } = liro
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [innerView, setInnerView] = useState<CalendarViewName | undefined>(props.defaultView)
  const [innerDate, setInnerDate] = useState<string | undefined>(props.defaultDate)
  const chosenView = props.view ?? innerView ?? (phone ? 'agenda' : 'week')
  // A week or a month on a phone is its agenda: seven columns do not fit at 360px.
  const view: CalendarViewName =
    phone && (chosenView === 'week' || chosenView === 'month') ? 'agenda' : chosenView
  const date = props.date ?? innerDate ?? today
  const days = periodDays(view, date, weekStartsOn)
  const title = periodTitle(view, date, days, liro)
  const titleId = useId()
  const instructionsId = useId()
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'

  const read: Read[] = byStart(
    props.events
      .map((event) => ({ event, span: spanOf(event, timeZone) }))
      .filter((each): each is Read => each.span !== null),
  )

  const changeDate = (next: string) => {
    setInnerDate(next)
    props.onDateChange?.(next)
  }
  const changeView = (next: CalendarViewName) => {
    setInnerView(next)
    props.onViewChange?.(next)
  }

  const views = phone
    ? CALENDAR_VIEWS.filter((each) => each === 'day' || each === 'agenda')
    : CALENDAR_VIEWS
  const viewNames: Record<CalendarViewName, string> = {
    day: messages['calendar.day'],
    week: messages['calendar.week'],
    month: messages['calendar.month'],
    agenda: messages['calendar.agenda'],
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Heading
        id={titleId}
        aria-live="polite"
        className={cn(
          'm-0 min-w-0 text-lg font-semibold text-primary first-letter:uppercase',
          TEXT_DIRECTION,
          phone ? 'order-first basis-full' : 'order-4 me-auto ms-2',
        )}
      >
        {title}
      </Heading>
      <ButtonPrimitive
        className="order-1 ps-4.5"
        onClick={() => {
          changeDate(today)
        }}
      >
        <span className={TEXT_DIRECTION}>{messages['calendar.today']}</span>
      </ButtonPrimitive>
      <ButtonPrimitive
        shape="icon"
        className="order-2"
        aria-label={messages['calendar.previous'](view)}
        title={messages['calendar.previous'](view)}
        onClick={() => {
          changeDate(shiftPeriod(view, date, -1))
        }}
      >
        <ChevronLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      </ButtonPrimitive>
      <ButtonPrimitive
        shape="icon"
        className="order-3"
        aria-label={messages['calendar.next'](view)}
        title={messages['calendar.next'](view)}
        onClick={() => {
          changeDate(shiftPeriod(view, date, 1))
        }}
      >
        <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      </ButtonPrimitive>
      <ToggleGroup
        type="single"
        value={view}
        aria-label={messages['calendar.view']}
        className={cn('order-5', phone && 'ms-auto')}
        onValueChange={(value) => {
          const next = views.find((each) => each === value)
          if (next !== undefined) changeView(next)
        }}
      >
        {views.map((each) => (
          <ToggleGroupItem key={each} value={each}>
            {viewNames[each]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )

  let body: ReactNode
  if (props.loading === true) {
    body = (
      <div aria-busy="true" aria-labelledby={titleId} role="region" className="flex flex-col gap-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-96" />
      </div>
    )
  } else if (view === 'agenda') {
    body = (
      <Agenda
        days={days}
        read={read}
        level={(props.headingLevel ?? 2) + 1}
        onSelect={props.onSelect}
        stacked={phone}
      />
    )
  } else if (view === 'month') {
    body = (
      <MonthGrid
        date={date}
        read={read}
        title={title}
        instructionsId={instructionsId}
        onSelect={props.onSelect}
        onSlotSelect={props.onSlotSelect}
        onOpenDay={(day) => {
          changeDate(day)
          changeView('day')
        }}
        onLeave={changeDate}
        defaultOpenDay={props.defaultOpenDay}
      />
    )
  } else {
    body = (
      <TimeGrid
        view={view}
        days={days}
        read={read}
        title={title}
        instructionsId={instructionsId}
        dayStart={minutesOf(props.dayStart ?? '07:00') ?? 420}
        dayEnd={minutesOf(props.dayEnd ?? '20:00') ?? 1200}
        slotMinutes={props.slotMinutes ?? 30}
        onSelect={props.onSelect}
        onSlotSelect={props.onSlotSelect}
        onLeave={changeDate}
      />
    )
  }

  return (
    <section
      data-slot="calendar-view"
      aria-label={props.label}
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      <span id={instructionsId} className="sr-only">
        {messages['calendar.instructions']}
      </span>
      {toolbar}
      {body}
    </section>
  )
}

/** Moves the focus to a grid cell after the render that shows it. */
function useCellFocus(container: RefObject<HTMLElement | null>) {
  const pending = useRef<string | null>(null)
  useEffect(() => {
    const key = pending.current
    if (key === null) return
    pending.current = null
    container.current?.querySelector<HTMLElement>(`[data-cell="${CSS.escape(key)}"]`)?.focus()
  })
  return (key: string) => {
    pending.current = key
  }
}

/** An event as a button (or as text when nothing can be done with it). */
function EventBox({
  label,
  onPress,
  className,
  style,
  tabIndex,
  children,
}: {
  label?: string
  onPress: (() => void) | undefined
  className: string
  style?: CSSProperties
  tabIndex?: number
  children: ReactNode
}) {
  if (onPress === undefined) {
    // Nothing to do with it: its name as text for assistive technology, the look hidden.
    return (
      <div className={className} style={style}>
        {label === undefined ? (
          children
        ) : (
          <>
            <span className="sr-only">{label}</span>
            <span aria-hidden="true" className="contents">
              {children}
            </span>
          </>
        )}
      </div>
    )
  }
  return (
    <button
      type="button"
      className={cn(BUTTON_RESET, 'cursor-pointer', FOCUS_RING, className)}
      style={style}
      {...(label === undefined ? {} : { 'aria-label': label, title: label })}
      {...(tabIndex === undefined ? {} : { tabIndex })}
      onClick={onPress}
    >
      {children}
    </button>
  )
}

/** The tone's start bar of an event block, in the block's text colour (the tone's fg). */
function ToneBar() {
  return <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-current" />
}

/** The weekday and the day of the month over a day column; today marked. */
function DayHeader({ day, compact }: { day: string; compact: boolean }) {
  const { format, today, messages } = useLiro()
  const isToday = day === today
  return (
    <div
      {...(isToday ? { 'aria-current': 'date' as const } : {})}
      className="flex min-w-0 flex-1 basis-0 flex-col items-center gap-0.5 py-1.5"
    >
      <span className="sr-only">
        {format.dateLong(day)}
        {isToday ? `, ${messages['calendar.todayMark']}` : ''}
      </span>
      <span aria-hidden="true" className="text-xs text-secondary first-letter:uppercase">
        {format.weekdayName(weekdayOf(day), compact ? 'short' : 'long')}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-full text-md tabular-nums',
          isToday ? 'bg-surface-inverse font-semibold text-on-inverse' : 'text-primary',
        )}
      >
        {format.number(String(Number(day.slice(8, 10))))}
      </span>
    </div>
  )
}

interface GridProps {
  read: readonly Read[]
  title: string
  instructionsId: string
  onSelect: ((event: CalendarEvent) => void) | undefined
  onSlotSelect: ((slot: CalendarSlot) => void) | undefined
  /** The keyboard left the period: show the period of this day. */
  onLeave: (day: string) => void
}

/** The day and week views: a grid of slots, the events over it, all-day events above. */
function TimeGrid(
  props: GridProps & {
    view: 'day' | 'week'
    days: readonly string[]
    dayStart: number
    dayEnd: number
    slotMinutes: number
  },
) {
  const liro = useLiro()
  const { format, messages, direction, weekStartsOn, today } = liro
  const container = useRef<HTMLDivElement>(null)
  const focusLater = useCellFocus(container)
  const slotMinutes = props.slotMinutes
  const from = props.dayStart
  const to = Math.max(props.dayEnd, from + slotMinutes)
  const slots = Math.ceil((to - from) / slotMinutes)
  const firstDay = props.days.includes(today) ? today : (props.days[0] ?? today)
  const [focus, setFocus] = useState<GridCell>({ day: firstDay, slot: 0 })
  const focusCell = props.days.includes(focus.day) ? focus : { day: firstDay, slot: focus.slot }
  const compact = props.days.length > 1

  const perDay = props.days.map((day) => {
    const ofDay = props.read.filter((each) => onDay(each.span, day))
    const timed = ofDay.filter((each) => !each.span.allDay)
    const layout = layoutDay(
      timed.map((each) => ({ id: each.event.id, ...withinDay(each.span, day) })),
      from,
      to,
      slotMinutes,
    )
    const strip = ofDay.filter((each) => each.span.allDay || layout.outside.includes(each.event.id))
    return { day, timed, layout, strip }
  })
  const hasStrip = perDay.some((each) => each.strip.length > 0)

  const slotRange = (day: string, slot: number): CalendarSlot => ({
    start: localDateTime(day, from + slot * slotMinutes),
    end: localDateTime(day, Math.min(from + (slot + 1) * slotMinutes, 1440)),
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      props.onSlotSelect?.(slotRange(focusCell.day, focusCell.slot))
      return
    }
    const target = calendarKeyTarget(event.key, focusCell, {
      view: props.view,
      direction,
      weekStartsOn,
      slots,
    })
    if (target === null) return
    event.preventDefault()
    if (!props.days.includes(target.day)) props.onLeave(target.day)
    setFocus(target)
    focusLater(`${target.day}|${String(target.slot)}`)
  }

  const columnStyle = (index: number): CSSProperties => ({
    insetInlineStart: `${String((index * 100) / props.days.length)}%`,
    // A 24px strip at each column's end stays free of events, so every slot keeps a target to
    // press or focus (WCAG 2.5.8) beside a busy hour.
    width: `calc(${String(100 / props.days.length)}% - ${String(SLOT_TARGET)}px)`,
  })

  return (
    <div
      ref={container}
      className="flex min-w-0 flex-col rounded-md border border-solid border-default bg-surface-raised"
    >
      <div className="flex border-0 border-b border-solid border-default">
        <div style={{ width: GUTTER }} className="shrink-0" />
        {props.days.map((day) => (
          <DayHeader key={day} day={day} compact={compact} />
        ))}
      </div>
      {hasStrip && (
        <div className="flex border-0 border-b border-solid border-default">
          <div
            style={{ width: GUTTER }}
            className={cn(
              'box-border shrink-0 px-1 py-1.5 text-end text-xs text-tertiary',
              TEXT_ISOLATE,
            )}
          >
            {messages['calendar.allDay']}
          </div>
          {perDay.map(({ day, strip }) => (
            <ul
              key={day}
              aria-label={`${format.dateLong(day)}: ${messages['calendar.allDay']}`}
              className="m-0 flex min-w-0 flex-1 basis-0 list-none flex-col gap-0.5 border-0 border-s border-solid border-subtle p-0.5"
            >
              {strip.map((each) => {
                const texts = eventTexts(each, liro)
                const tone = toneClasses(each.event.tone)
                return (
                  <li key={each.event.id} className="min-w-0">
                    <EventBox
                      label={texts.label}
                      onPress={
                        props.onSelect === undefined
                          ? undefined
                          : () => props.onSelect?.(each.event)
                      }
                      className={cn(
                        'relative flex h-6 w-full min-w-0 items-center gap-1 overflow-hidden rounded-sm border border-solid ps-2 pe-1 text-start text-xs',
                        tone.block,
                      )}
                    >
                      <ToneBar />
                      {!each.span.allDay && (
                        <span className={cn('shrink-0 tabular-nums', TEXT_ISOLATE)}>
                          {texts.start}
                        </span>
                      )}
                      <span className={cn('truncate font-semibold', TEXT_ISOLATE)}>
                        {each.event.title}
                      </span>
                    </EventBox>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      )}
      <div className="relative">
        <div role="grid" aria-label={props.title} aria-describedby={props.instructionsId}>
          {Array.from({ length: slots }, (_, slot) => {
            const minutes = from + slot * slotMinutes
            const onHour = minutes % 60 === 0
            const time = format.time(localDateTime(props.days[0] ?? today, minutes))
            return (
              <div key={slot} role="row" className="flex" style={{ height: SLOT_HEIGHT }}>
                <div
                  role="rowheader"
                  style={{ width: GUTTER }}
                  className="relative box-border shrink-0 pe-2 text-end text-xs text-tertiary tabular-nums"
                >
                  <span
                    className={cn(
                      'absolute end-2 whitespace-nowrap',
                      TEXT_ISOLATE,
                      slot === 0 ? 'top-0.5' : '-top-2',
                      !onHour && 'sr-only',
                    )}
                  >
                    {time}
                  </span>
                </div>
                {props.days.map((day) => {
                  const focused = focusCell.day === day && focusCell.slot === slot
                  return (
                    <div
                      key={day}
                      role="gridcell"
                      data-cell={`${day}|${String(slot)}`}
                      tabIndex={focused ? 0 : -1}
                      onKeyDown={onKeyDown}
                      aria-label={`${format.dateLong(day)}, ${time}`}
                      onClick={() => {
                        setFocus({ day, slot })
                        props.onSlotSelect?.(slotRange(day, slot))
                      }}
                      className={cn(
                        'relative min-w-0 flex-1 basis-0 border-0 border-s border-t border-subtle outline-none focus-visible:z-(--liro-layer-raised) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                        onHour ? 'border-solid' : 'border-solid [border-top-style:dotted]',
                        slot === 0 && 'border-t-0',
                        props.onSlotSelect !== undefined && 'cursor-pointer hover:bg-surface-hover',
                      )}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* The events, over their day's column; after the grid in the tab order. */}
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ insetInlineStart: GUTTER, insetInlineEnd: 0 }}
        >
          {perDay.map(({ day, timed, layout }, index) => (
            <ul
              key={day}
              aria-label={format.dateLong(day)}
              className="absolute inset-y-0 m-0 list-none p-0"
              style={columnStyle(index)}
            >
              {layout.placed.map((placement) => {
                const each = timed.find((item) => item.event.id === placement.id)
                if (each === undefined) return null
                const texts = eventTexts(each, liro)
                const tone = toneClasses(each.event.tone)
                const height = (placement.height / slotMinutes) * SLOT_HEIGHT
                return (
                  <li
                    key={placement.id}
                    className="absolute box-border px-0.5"
                    style={{
                      top: (placement.top / slotMinutes) * SLOT_HEIGHT,
                      height,
                      insetInlineStart: `${String((placement.column * 100) / placement.columns)}%`,
                      width: `${String(100 / placement.columns)}%`,
                    }}
                  >
                    <EventBox
                      label={texts.label}
                      onPress={
                        props.onSelect === undefined
                          ? undefined
                          : () => props.onSelect?.(each.event)
                      }
                      className={cn(
                        'pointer-events-auto relative box-border flex size-full min-w-0 flex-col items-start overflow-hidden rounded-sm border border-solid ps-2 pe-1 text-start text-xs leading-tight focus-visible:z-(--liro-layer-raised)',
                        height >= 40 ? 'py-1' : 'justify-center',
                        tone.block,
                      )}
                    >
                      <ToneBar />
                      <span
                        className={cn(
                          'w-full truncate font-semibold',
                          height >= 64 && 'line-clamp-2 whitespace-normal',
                          TEXT_DIRECTION,
                        )}
                      >
                        {each.event.title}
                      </span>
                      {height >= 40 && (
                        <span className={cn('w-full truncate tabular-nums', TEXT_ISOLATE)}>
                          {texts.time}
                        </span>
                      )}
                    </EventBox>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}

/** The month view: whole weeks, a few lines a day, "+N more" opening the day's list. */
function MonthGrid(
  props: GridProps & {
    date: string
    onOpenDay: (day: string) => void
    defaultOpenDay: string | undefined
  },
) {
  const liro = useLiro()
  const { format, messages, direction, weekStartsOn, today } = liro
  const container = useRef<HTMLDivElement>(null)
  const focusLater = useCellFocus(container)
  const weeks = monthWeeks(props.date, weekStartsOn)
  const days = weeks.flat()
  const month = props.date.slice(0, 7)
  const [focus, setFocus] = useState<string>(props.date)
  const focusDay = days.includes(focus) ? focus : props.date
  const [openDay, setOpenDay] = useState<string | null>(props.defaultOpenDay ?? null)

  const ofDay = (day: string) => props.read.filter((each) => onDay(each.span, day))

  const activate = (day: string) => {
    if (ofDay(day).length > 0) setOpenDay(day)
    else props.onSlotSelect?.({ start: day, end: day })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (openDay !== null) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(focusDay)
      return
    }
    const target = calendarKeyTarget(
      event.key,
      { day: focusDay, slot: 0 },
      { view: 'month', direction, weekStartsOn, slots: 0 },
    )
    if (target === null) return
    event.preventDefault()
    if (!days.includes(target.day)) props.onLeave(target.day)
    setFocus(target.day)
    focusLater(target.day)
  }

  const weekdays = weeks[0] ?? []

  return (
    <div
      ref={container}
      role="grid"
      aria-label={props.title}
      aria-describedby={props.instructionsId}
      className="flex min-w-0 flex-col overflow-hidden rounded-md border border-solid border-default bg-surface-raised"
    >
      <div role="row" className="flex">
        {weekdays.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="min-w-0 flex-1 basis-0 py-1.5 text-center text-xs text-secondary first-letter:uppercase"
          >
            <abbr title={format.weekdayName(weekdayOf(day), 'long')} className="no-underline">
              {format.weekdayName(weekdayOf(day), 'short')}
            </abbr>
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} role="row" className="flex">
          {week.map((day) => {
            const items = ofDay(day)
            const { shown, more } = cellEvents(items, MONTH_LINES)
            const inMonth = day.startsWith(month)
            const isToday = day === today
            const dateText = format.dateLong(day)
            const cell = (
              <div
                role="gridcell"
                data-cell={day}
                tabIndex={day === focusDay ? 0 : -1}
                onKeyDown={onKeyDown}
                {...(isToday ? { 'aria-current': 'date' as const } : {})}
                onClick={(event) => {
                  setFocus(day)
                  if (event.target === event.currentTarget) activate(day)
                }}
                className={cn(
                  'relative box-border flex min-h-28 min-w-0 flex-1 basis-0 flex-col gap-0.5 border-0 border-s border-t border-solid border-subtle p-1 outline-none first:border-s-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                  !inMonth && 'bg-surface-sunken',
                )}
              >
                <span className="sr-only">
                  {dateText}
                  {isToday ? `, ${messages['calendar.todayMark']}` : ''}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none inline-flex size-6 shrink-0 items-center justify-center self-start rounded-full text-xs tabular-nums',
                    isToday
                      ? 'bg-surface-inverse font-semibold text-on-inverse'
                      : inMonth
                        ? 'text-primary'
                        : 'text-tertiary',
                  )}
                >
                  {format.number(String(Number(day.slice(8, 10))))}
                </span>
                {shown.map((each) => {
                  const texts = eventTexts(each, liro)
                  const tone = toneClasses(each.event.tone)
                  return (
                    <EventBox
                      key={each.event.id}
                      label={texts.label}
                      tabIndex={-1}
                      onPress={
                        props.onSelect === undefined
                          ? undefined
                          : () => props.onSelect?.(each.event)
                      }
                      className={cn(
                        'relative flex h-6 w-full min-w-0 shrink-0 items-center gap-1 overflow-hidden rounded-sm border border-solid ps-2 pe-1 text-start text-xs',
                        tone.block,
                      )}
                    >
                      <ToneBar />
                      {!each.span.allDay && (
                        <span className={cn('shrink-0 tabular-nums', TEXT_ISOLATE)}>
                          {texts.start}
                        </span>
                      )}
                      <span className={cn('truncate font-semibold', TEXT_ISOLATE)}>
                        {each.event.title}
                      </span>
                    </EventBox>
                  )
                })}
                {more > 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={messages['calendar.moreLabel'](
                      more,
                      format.number(String(more)),
                      dateText,
                    )}
                    onClick={() => {
                      setFocus(day)
                      setOpenDay(day)
                    }}
                    className={cn(
                      BUTTON_RESET,
                      'h-6 w-full shrink-0 cursor-pointer rounded-sm px-2 text-start text-xs font-semibold text-secondary hover:bg-surface-hover',
                      FOCUS_RING,
                    )}
                  >
                    <span className={TEXT_ISOLATE}>
                      {messages['calendar.more'](more, format.number(String(more)))}
                    </span>
                  </button>
                )}
              </div>
            )
            return (
              <Popover
                key={day}
                open={openDay === day}
                onOpenChange={(open) => {
                  if (!open) setOpenDay(null)
                }}
              >
                <PopoverAnchor asChild>{cell}</PopoverAnchor>
                {openDay === day && (
                  <PopoverContent
                    align="start"
                    aria-label={dateText}
                    className="flex max-h-(--radix-popover-content-available-height) w-80 flex-col gap-2 overflow-y-auto"
                    onCloseAutoFocus={(event) => {
                      event.preventDefault()
                      container.current
                        ?.querySelector<HTMLElement>(`[data-cell="${CSS.escape(day)}"]`)
                        ?.focus()
                    }}
                  >
                    <DayList
                      day={day}
                      read={items}
                      onSelect={props.onSelect}
                      onOpenDay={() => {
                        setOpenDay(null)
                        props.onOpenDay(day)
                      }}
                    />
                  </PopoverContent>
                )}
              </Popover>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * One event as a row of a list: its time at the start, the tone's dot, the title and its
 * description; `stacked` (the day list, phones) puts the time above the title.
 */
function EventRow({
  read,
  onSelect,
  stacked,
}: {
  read: Read
  onSelect: ((event: CalendarEvent) => void) | undefined
  stacked: boolean
}) {
  const liro = useLiro()
  const texts = eventTexts(read, liro)
  const dot = (
    <span
      aria-hidden="true"
      className={cn('size-2 shrink-0 rounded-full bg-current', toneClasses(read.event.tone).fg)}
    />
  )
  const time = <span className={cn('tabular-nums', TEXT_ISOLATE)}>{texts.time}</span>
  return (
    <EventBox
      onPress={
        onSelect === undefined
          ? undefined
          : () => {
              onSelect(read.event)
            }
      }
      className="flex w-full min-w-0 items-start gap-3 rounded-sm px-2 py-2 text-start hover:bg-surface-hover"
    >
      {stacked ? (
        <span className="mt-1.5 flex shrink-0">{dot}</span>
      ) : (
        <>
          <span className="w-40 shrink-0 text-sm text-secondary">{time}</span>
          <span className="mt-1.5 flex shrink-0">{dot}</span>
        </>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {stacked && <span className="text-xs text-secondary">{time}</span>}
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {read.event.title}
        </span>
        {read.event.description !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
            {read.event.description}
          </span>
        )}
      </span>
    </EventBox>
  )
}

/** The list of one day's events (the month's "+N more" and Enter on a day). */
function DayList({
  day,
  read,
  onSelect,
  onOpenDay,
}: {
  day: string
  read: readonly Read[]
  onSelect: ((event: CalendarEvent) => void) | undefined
  onOpenDay: () => void
}) {
  const { format, messages, today } = useLiro()
  return (
    <>
      <p
        className={cn(
          'm-0 text-sm font-semibold text-primary first-letter:uppercase',
          TEXT_DIRECTION,
        )}
      >
        {format.dateLong(day)}
        {day === today ? ` · ${messages['calendar.todayMark']}` : ''}
      </p>
      <ul className="m-0 flex list-none flex-col p-0">
        {read.map((each) => (
          <li key={each.event.id}>
            <EventRow read={each} onSelect={onSelect} stacked />
          </li>
        ))}
      </ul>
      <ButtonPrimitive emphasis="menu" className="self-start ps-4.5" onClick={onOpenDay}>
        <span className={TEXT_DIRECTION}>{messages['calendar.openDay']}</span>
      </ButtonPrimitive>
    </>
  )
}

/** The agenda: the period's days that have events, each event a row with its time. */
function Agenda({
  days,
  read,
  level,
  onSelect,
  stacked,
}: {
  days: readonly string[]
  read: readonly Read[]
  level: number
  onSelect: ((event: CalendarEvent) => void) | undefined
  stacked: boolean
}) {
  const { format, messages, today } = useLiro()
  const idPrefix = useId()
  const Heading = `h${String(Math.min(level, 6))}` as 'h3'
  const filled = days
    .map((day) => ({ day, items: read.filter((each) => onDay(each.span, day)) }))
    .filter((each) => each.items.length > 0)
  if (filled.length === 0) {
    return (
      <p
        className={cn(
          'm-0 rounded-md bg-surface-sunken px-4 py-8 text-center text-sm text-secondary',
          TEXT_ISOLATE,
        )}
      >
        {messages['calendar.noEvents']}
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {filled.map(({ day, items }) => (
        <section key={day} aria-labelledby={`${idPrefix}-${day}`} className="flex flex-col gap-1">
          <Heading
            id={`${idPrefix}-${day}`}
            className={cn(
              'm-0 flex flex-wrap items-baseline gap-2 border-0 border-b border-solid border-default pb-1.5 text-sm font-semibold text-primary',
              TEXT_DIRECTION,
            )}
          >
            <span className="inline-block first-letter:uppercase">{format.dateLong(day)}</span>
            {day === today && (
              <span className="text-xs font-medium text-secondary">
                {messages['calendar.todayMark']}
              </span>
            )}
          </Heading>
          <ul className="m-0 flex list-none flex-col p-0">
            {items.map((each) => (
              <li
                key={each.event.id}
                className="border-0 border-t border-solid border-subtle first:border-t-0"
              >
                <EventRow read={each} onSelect={onSelect} stacked={stacked} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

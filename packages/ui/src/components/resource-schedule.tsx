import { MoveRight } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { Skeleton } from '../primitives/skeleton'
import { useLiro, type LiroContextValue } from '../provider/liro-provider'
import { toneClasses } from './calendar-view'
import {
  absoluteMinutes,
  axisMinutes,
  axisMoment,
  dayLength,
  dayOfNumber,
  dropPlace,
  layoutDay,
  localDateTime,
  minutesOf,
  scheduleKeyTarget,
  spanOf,
  unavailableReason,
  type ScheduleAxis,
  type SchedulePlace,
  type UnavailableTime,
} from './schedule-logic'
import { SelectField } from './select-field'
import type { Tone } from './status-badge'
import { usePhone } from './use-phone'

/*
 * ResourceSchedule (BUILD-PLAN P5.8): rows of resources — doctors, rooms, teachers — against the
 * time of one day or a few days, bookings as blocks. The schedule shows what it is given and
 * reports a move (`onMove({ id, resourceId, start, end })`); it never decides whether a move is
 * allowed. Unavailable times (from props, with their reason) are hatched and neutral, named in
 * words, and announced when a booking is moved over them.
 * - Desktop: the names in a sticky column at the start (200px), the time running from the leading
 *   edge (right to left in right-to-left pages), 2px a minute, hour labels above, slot lines;
 *   the grid scrolls sideways inside its own box. Rows 56px; bookings that overlap share the row
 *   in lanes. A booking: the tone's colours (neutral by default) with a 3px bar at the start,
 *   its title and its description or time.
 * - Three ways to move a booking (WCAG 2.5.7): drag it (pointer events; a mouse after 4px, a touch
 *   after a 250ms press; it snaps to slots and rows, a dashed neutral placeholder stays where it
 *   was; Escape cancels); the keyboard on the booking (Space picks it up, the arrows move it by a
 *   slot or a row — the time arrows from the leading edge —, Enter or Space drops it, Escape or
 *   leaving it cancels; every step announced politely); or its "Move to…" button (a popover with
 *   the row, the day and the start, then Move).
 * - Phones (below 48em or `layout="phone"`): one row at a time, chosen in a select; the time runs
 *   down; Left and Right move a picked-up booking to the other rows.
 */

/** A row of the schedule, from the application. */
export interface ScheduleResource {
  id: string
  /** The row's name ("Dr Milica Jovanović", "Room 4"). */
  name: string
  /** A line under the name ("Cardiology"). */
  description?: string
}

/** A booking, from the application. */
export interface ScheduleBooking {
  id: string
  /** The row it stands in. */
  resourceId: string
  /** What it is ("Marko Ilić"). */
  title: string
  /** A line under the title ("Check-up"). */
  description?: string
  /** Local "YYYY-MM-DDTHH:mm", shown as written (an instant with an offset in the provider's zone). */
  start: string
  end: string
  /** A status tone (Appendix A.2); default neutral. */
  tone?: Tone
  /** This booking cannot be moved (e.g. it has started); it can still be opened. */
  locked?: boolean
}

/** A move the user made: the booking, its new row, start and end (local values). */
export interface ScheduleMove {
  id: string
  resourceId: string
  start: string
  end: string
}

export interface ResourceScheduleProps {
  resources: readonly ScheduleResource[]
  bookings: readonly ScheduleBooking[]
  /** Times that cannot be booked, with their reason; shown hatched. The application decides. */
  unavailable?: readonly UnavailableTime[]
  /** The day shown, YYYY-MM-DD. Default: the provider's today. */
  date?: string
  /** A few days one after another, instead of `date`. */
  days?: readonly string[]
  /** The hours shown each day, "HH:mm". Default 08:00 – 16:00. */
  dayStart?: string
  dayEnd?: string
  /** The step of a move and of the slot lines, in minutes. Default 30. */
  slotMinutes?: 15 | 30 | 60
  /** Names the schedule for assistive technology, from the application ("Doctors, 14 October"). */
  label: string
  /** A booking was moved; the application changes `bookings` (or not). */
  onMove?: (move: ScheduleMove) => void
  /** A booking was opened (pressed, or Enter). */
  onSelect?: (booking: ScheduleBooking) => void
  /** No moving: no dragging, keys or "Move to…". */
  readOnly?: boolean
  /** Skeleton rows while the schedule loads. */
  loading?: boolean
  /** Phones: the row shown (controlled); default the first. */
  resource?: string
  onResourceChange?: (resource: string) => void
  /** The label of the phones' row chooser ("Doctor"); default `schedule.resource`. */
  resourceLabel?: string
  /** 'phone' shows one row at a time with the time running down; default by the viewport. */
  layout?: 'desktop' | 'phone'
  className?: string
}

/**
 * The desktop grid fills its box; a minute is at least PX_MIN wide (a 30-minute booking 75px),
 * else the grid scrolls sideways in its own box. On a phone a minute is PX_PHONE high.
 */
const PX_MIN = 2.5
const PX_PHONE = 1.6
/** The names' column (200px), a row, a day's header on a phone. */
const NAME_WIDTH = 200
const ROW_HEIGHT = 56
const DAY_HEADER = 32
/** A booking is drawn at least this long (minutes), so it stays a 24px target. */
const MIN_DRAWN = 15
/** The narrowest a movable booking is drawn on the desktop, px. */
const MOVABLE_MIN_WIDTH = 56
/** Under this height (px) a booking on a phone shows only its title. */
const TWO_LINES = 40

/** A booking read onto the axis. */
interface Placed {
  booking: ScheduleBooking
  resource: number
  start: number
  duration: number
}

/** A booking being moved: by the keyboard (`keys`) or the pointer. */
interface Moving {
  id: string
  from: SchedulePlace
  to: SchedulePlace
  keys: boolean
}

/** The texts of a place: the row's name, the time (with the day over several days), the reason. */
function placeTexts(
  axis: ScheduleAxis,
  place: SchedulePlace,
  duration: number,
  resources: readonly ScheduleResource[],
  unavailable: readonly UnavailableTime[],
  liro: Pick<LiroContextValue, 'format' | 'messages' | 'timeZone'>,
) {
  const { format, messages, timeZone } = liro
  const moment = axisMoment(axis, place.start)
  const start = localDateTime(moment.day, moment.minutes)
  const end = localDateTime(moment.day, moment.minutes + duration)
  const range = messages['calendar.range'](format.time(start), format.time(end))
  const time =
    axis.days.length > 1 ? messages['schedule.when'](format.date(moment.day), range) : range
  const resource = resources[place.resource]
  const reason =
    resource === undefined
      ? null
      : unavailableReason(
          unavailable,
          resource.id,
          absoluteMinutes(moment.day, moment.minutes),
          absoluteMinutes(moment.day, moment.minutes + duration),
          timeZone,
        )
  return {
    resource: resource?.name ?? '',
    resourceId: resource?.id ?? '',
    time,
    start,
    end,
    reason,
  }
}

/** The schedule: rows of resources against time, bookings moved by drag, keys or a menu. */
export function ResourceSchedule(props: ResourceScheduleProps) {
  const liro = useLiro()
  const { messages, format, today, timeZone, direction } = liro
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const instructionsId = useId()
  const grid = useRef<HTMLDivElement>(null)
  const [moving, setMoving] = useState<Moving | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [innerResource, setInnerResource] = useState<string | undefined>(undefined)
  const swallowClick = useRef(false)
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    const element = grid.current
    if (element === null || phone) return
    const measure = () => {
      setScrolls(element.scrollWidth > element.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const content = element.firstElementChild
    if (content !== null) observer.observe(content)
    return () => {
      observer.disconnect()
    }
  }, [phone])
  const unavailable = props.unavailable ?? []

  const axis: ScheduleAxis = {
    days: props.days ?? [props.date ?? today],
    dayStart: minutesOf(props.dayStart ?? '08:00') ?? 480,
    dayEnd: minutesOf(props.dayEnd ?? '16:00') ?? 960,
    slotMinutes: props.slotMinutes ?? 30,
  }
  const length = dayLength(axis)
  const total = length * axis.days.length
  const editable = props.readOnly !== true && props.onMove !== undefined

  const placed: Placed[] = []
  for (const booking of props.bookings) {
    const resource = props.resources.findIndex((each) => each.id === booking.resourceId)
    const span = spanOf(booking, timeZone)
    if (resource === -1 || span === null || span.allDay) continue
    const day = Math.floor(span.start / 1440)
    const date = dayOfNumber(day)
    const start = axisMinutes(axis, date, span.start - day * 1440)
    if (start === null) continue
    // A booking that starts before the hours shown is drawn from their start; one that ends
    // before them is not drawn.
    const dayFrom = axis.days.indexOf(date) * length
    const end = start + (span.end - span.start)
    if (end <= dayFrom && span.end > span.start) continue
    placed.push({
      booking,
      resource,
      start: Math.max(start, dayFrom),
      duration: end - Math.max(start, dayFrom),
    })
  }

  const shownResourceId = props.resource ?? innerResource ?? props.resources[0]?.id
  const phoneRow = Math.max(
    0,
    props.resources.findIndex((each) => each.id === shownResourceId),
  )
  const showResource = (index: number) => {
    const id = props.resources[index]?.id
    if (id === undefined) return
    setInnerResource(id)
    props.onResourceChange?.(id)
  }

  const texts = (place: SchedulePlace, duration: number) =>
    placeTexts(axis, place, duration, props.resources, unavailable, liro)
  const announce = (
    kind: 'schedule.lifted' | 'schedule.moved' | 'schedule.dropped',
    item: Placed,
    place: SchedulePlace,
  ) => {
    const text = texts(place, item.duration)
    const said = messages[kind](item.booking.title, text.resource, text.time)
    setAnnouncement(
      text.reason === null ? said : `${said} ${messages['schedule.unavailableHere'](text.reason)}`,
    )
  }
  const report = (shownItem: Placed, to: SchedulePlace) => {
    // Compared with where the application has the booking, not where it is shown while moving.
    const item = placed.find((each) => each.booking.id === shownItem.booking.id) ?? shownItem
    if (to.resource === item.resource && to.start === item.start) return
    const text = texts(to, item.duration)
    props.onMove?.({
      id: item.booking.id,
      resourceId: text.resourceId,
      start: text.start,
      end: text.end,
    })
  }

  // The booking keeps the focus while it moves between rows (React mounts it anew there).
  const focusAfterMove = useRef<string | null>(null)
  useEffect(() => {
    const id = focusAfterMove.current
    if (id === null) return
    focusAfterMove.current = null
    grid.current
      ?.querySelector<HTMLElement>(`[data-booking="${CSS.escape(id)}"] [data-booking-button]`)
      ?.focus()
  })

  const movable = (item: Placed) => editable && item.booking.locked !== true

  const onBookingKey = (event: KeyboardEvent<HTMLElement>, item: Placed) => {
    const lifted = moving?.keys === true && moving.id === item.booking.id ? moving : null
    if (lifted === null) {
      if (event.key !== ' ' || !movable(item) || moving !== null) return
      event.preventDefault()
      const from = { resource: item.resource, start: item.start }
      setMoving({ id: item.booking.id, from, to: from, keys: true })
      announce('schedule.lifted', item, from)
      return
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setMoving(null)
      announce('schedule.dropped', item, lifted.to)
      focusAfterMove.current = item.booking.id
      report(item, lifted.to)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setMoving(null)
      setAnnouncement(messages['schedule.cancelled'](item.booking.title))
      focusAfterMove.current = item.booking.id
      if (phone) showResource(lifted.from.resource)
      return
    }
    const target = scheduleKeyTarget(event.key, lifted.to, item.duration, {
      axis,
      resources: props.resources.length,
      direction,
      orientation: phone ? 'vertical' : 'horizontal',
    })
    if (target === null) {
      if (event.key.startsWith('Arrow')) event.preventDefault()
      return
    }
    event.preventDefault()
    setMoving({ ...lifted, to: target })
    if (phone && target.resource !== lifted.to.resource) showResource(target.resource)
    focusAfterMove.current = item.booking.id
    announce('schedule.moved', item, target)
  }

  // Dragging on pointer events (the dragging rule of KanbanBoard): it snaps to slots and rows.
  const startDrag = (event: PointerEvent<HTMLElement>, item: Placed) => {
    if (!movable(item) || moving !== null || event.button !== 0) return
    const element = grid.current
    if (element === null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    const from = { resource: item.resource, start: item.start }
    const rows = Array.from(element.querySelectorAll<HTMLElement>('[data-track]')).map((row) => ({
      index: Number(row.dataset.track),
      rect: row.getBoundingClientRect(),
    }))
    let active = false
    let current: SchedulePlace = from
    const activate = () => {
      active = true
      setMoving({ id: item.booking.id, from, to: from, keys: false })
    }
    const timer = touch ? window.setTimeout(activate, 250) : undefined
    const finish = (commit: boolean) => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('touchmove', onTouchMove)
      if (active) {
        swallowClick.current = true
        window.setTimeout(() => {
          swallowClick.current = false
        }, 0)
        if (commit) report(item, current)
      }
      setMoving(null)
    }
    const onMove = (move: globalThis.PointerEvent) => {
      const distance = Math.hypot(move.clientX - startX, move.clientY - startY)
      if (!active) {
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        activate()
      }
      const along = phone
        ? move.clientY - startY
        : direction === 'rtl'
          ? startX - move.clientX
          : move.clientX - startX
      const perMinute = phone ? PX_PHONE : (rows[0]?.rect.width ?? total * PX_MIN) / total
      const slots = Math.round(along / perMinute / axis.slotMinutes)
      let resource = from.resource
      if (!phone && rows.length > 0) {
        const under =
          rows.find((row) => move.clientY >= row.rect.top && move.clientY < row.rect.bottom) ??
          rows.reduce((best, row) =>
            Math.abs(row.rect.top + row.rect.height / 2 - move.clientY) <
            Math.abs(best.rect.top + best.rect.height / 2 - move.clientY)
              ? row
              : best,
          )
        resource = under.index
      }
      current = dropPlace(from, slots, resource, item.duration, {
        axis,
        resources: props.resources.length,
      })
      setMoving({ id: item.booking.id, from, to: current, keys: false })
    }
    const onUp = () => {
      finish(true)
    }
    const onCancel = () => {
      finish(false)
    }
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== 'Escape' || !active) return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }
    const onTouchMove = (touchMove: TouchEvent) => {
      if (active) touchMove.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  /** Where each booking is shown: a moving one at its target. */
  const shown = placed.map((item) =>
    moving?.id === item.booking.id
      ? { ...item, resource: moving.to.resource, start: moving.to.start }
      : item,
  )
  const movingItem = placed.find((item) => item.booking.id === moving?.id)

  /**
   * The position of axis minutes along the time: on a phone px from the top, on the desktop a
   * percentage of the track from its leading edge.
   */
  const along = (value: number): number => {
    if (!phone) return (value * 100) / total
    const index = Math.min(axis.days.length - 1, Math.max(0, Math.floor(value / length)))
    const header = axis.days.length > 1 ? DAY_HEADER : 0
    return index * (header + length * PX_PHONE) + header + (value - index * length) * PX_PHONE
  }
  const extent = axis.days.length * ((axis.days.length > 1 ? DAY_HEADER : 0) + length * PX_PHONE)
  /** A desktop length in percent of the track; a phone length in px. */
  const unit = (value: number): number | string => (phone ? value : `${String(value)}%`)

  const blockStyle = (
    start: number,
    duration: number,
    lane: number,
    lanes: number,
  ): CSSProperties => {
    const from = along(Math.max(0, start))
    const to = along(Math.min(total, start + Math.max(duration, MIN_DRAWN)))
    const size = Math.max(
      to - from,
      phone ? Math.max(MIN_DRAWN * PX_PHONE, 24) : (MIN_DRAWN * 100) / total,
    )
    if (phone) {
      return {
        top: from,
        height: size,
        insetInlineStart: `${String((lane * 100) / lanes)}%`,
        width: `${String(100 / lanes)}%`,
      }
    }
    const laneHeight = (ROW_HEIGHT - 8) / lanes
    return {
      insetInlineStart: unit(from),
      width: unit(size),
      top: 4 + lane * laneHeight,
      height: laneHeight,
    }
  }

  const renderTrack = (row: number) => {
    const resource = props.resources[row]
    if (resource === undefined) return null
    const items = shown.filter((item) => item.resource === row)
    const lanes = layoutDay(
      items.map((item) => ({
        id: item.booking.id,
        start: item.start,
        end: item.start + Math.max(item.duration, MIN_DRAWN),
      })),
      0,
      total,
      MIN_DRAWN,
    ).placed
    const blocked = unavailable.flatMap((each) => {
      if (each.resourceId !== undefined && each.resourceId !== resource.id) return []
      const span = spanOf(each, timeZone)
      if (span === null) return []
      const day = Math.floor(span.start / 1440)
      const date = dayOfNumber(day)
      const start = axisMinutes(axis, date, span.start - day * 1440)
      if (start === null) return []
      const dayFrom = axis.days.indexOf(date) * length
      const end = Math.min(start + (span.end - span.start), dayFrom + length)
      if (end <= dayFrom) return []
      const from = Math.max(start, dayFrom)
      return [{ each, start: from, end, date, minutes: axis.dayStart + from - dayFrom }]
    })
    const placeholder =
      moving !== null && movingItem !== undefined && moving.from.resource === row
        ? moving.from
        : null
    return (
      <div
        data-track={row}
        className="relative min-w-0 flex-1"
        style={
          phone
            ? {
                height: extent,
                ...(axis.days.length === 1
                  ? {
                      backgroundImage: `repeating-linear-gradient(to bottom, var(--liro-border-subtle) 0 1px, transparent 1px ${String(axis.slotMinutes * PX_PHONE)}px)`,
                    }
                  : {}),
              }
            : {
                height: ROW_HEIGHT,
                backgroundImage: `repeating-linear-gradient(to ${direction === 'rtl' ? 'left' : 'right'}, var(--liro-border-subtle) 0 1px, transparent 1px ${String((axis.slotMinutes * 100) / total)}%)`,
              }
        }
      >
        {blocked.map(({ each, start, end, date, minutes }, index) => {
          const timeText = messages['calendar.range'](
            format.time(localDateTime(date, minutes)),
            format.time(localDateTime(date, minutes + (end - start))),
          )
          const style: CSSProperties = phone
            ? {
                top: along(start),
                height: along(end) - along(start),
                insetInlineStart: 0,
                insetInlineEnd: 0,
              }
            : {
                insetInlineStart: unit(along(start)),
                width: unit(along(end) - along(start)),
                top: 0,
                bottom: 0,
              }
          return (
            <div
              key={index}
              title={each.reason}
              className="absolute box-border flex items-start overflow-hidden border-0 border-s border-solid border-default bg-surface-sunken bg-[repeating-linear-gradient(135deg,var(--liro-border-default)_0_1px,transparent_1px_7px)] px-1.5 py-1"
              style={style}
            >
              <span className="sr-only">
                {messages['schedule.unavailable'](each.reason, timeText)}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'rounded-xs bg-surface-sunken px-1 text-xs text-secondary',
                  phone ? 'whitespace-normal' : 'truncate',
                  TEXT_ISOLATE,
                )}
              >
                {each.reason}
              </span>
            </div>
          )
        })}
        {placeholder !== null && movingItem !== undefined && (
          <div
            aria-hidden="true"
            data-slot="schedule-drop-placeholder"
            className="pointer-events-none absolute box-border rounded-sm border-2 border-dashed border-strong"
            style={blockStyle(placeholder.start, movingItem.duration, 0, 1)}
          />
        )}
        {items.map((item) => {
          const lane = lanes.find((each) => each.id === item.booking.id)
          const style = blockStyle(item.start, item.duration, lane?.column ?? 0, lane?.columns ?? 1)
          const text = texts({ resource: item.resource, start: item.start }, item.duration)
          const label = messages['schedule.bookingLabel'](
            item.booking.title,
            text.resource,
            text.time,
          )
          const isMoving = moving?.id === item.booking.id
          const canMove = movable(item)
          const pressable = props.onSelect !== undefined || canMove
          const tone = toneClasses(item.booking.tone)
          const short = typeof style.height === 'number' && style.height < TWO_LINES
          const body = (
            <>
              <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-current" />
              <span className={cn('w-full truncate font-semibold', TEXT_DIRECTION)}>
                {item.booking.title}
              </span>
              {!short && (
                <span className={cn('w-full truncate', TEXT_ISOLATE)}>
                  {item.booking.description ?? text.time}
                </span>
              )}
            </>
          )
          const look = cn(
            'relative box-border flex size-full min-w-0 flex-col items-start justify-center overflow-hidden rounded-sm border border-solid ps-2 text-start text-xs leading-tight',
            canMove ? 'pe-7' : 'pe-1',
            tone.block,
            isMoving && 'border-strong shadow-lg',
          )
          return (
            <div
              key={item.booking.id}
              data-booking={item.booking.id}
              {...(isMoving ? { 'data-moving': '' } : {})}
              className={cn('absolute box-border px-px', isMoving && 'z-(--liro-layer-raised)')}
              // A movable booking keeps 24px beside its 24px "Move to…" button (WCAG 2.5.8).
              style={canMove && !phone ? { ...style, minWidth: MOVABLE_MIN_WIDTH } : style}
            >
              {pressable ? (
                <button
                  type="button"
                  data-booking-button=""
                  aria-label={label}
                  title={label}
                  {...(canMove ? { 'aria-describedby': instructionsId } : {})}
                  onKeyDown={(event) => {
                    onBookingKey(event, item)
                  }}
                  onKeyUp={(event) => {
                    // Space picks up and drops: it never also presses the button.
                    if (event.key === ' ' && canMove) event.preventDefault()
                  }}
                  onClick={() => {
                    if (swallowClick.current || moving !== null) return
                    props.onSelect?.(item.booking)
                  }}
                  onBlur={(event) => {
                    if (moving?.keys === true && isMoving && event.relatedTarget !== null) {
                      setMoving(null)
                      setAnnouncement(messages['schedule.cancelled'](item.booking.title))
                    }
                  }}
                  onPointerDown={(event) => {
                    startDrag(event, item)
                  }}
                  className={cn(
                    BUTTON_RESET,
                    look,
                    FOCUS_RING,
                    canMove ? 'cursor-grab select-none' : 'cursor-pointer',
                    isMoving && 'cursor-grabbing',
                  )}
                >
                  {body}
                </button>
              ) : (
                <div className={look}>
                  <span className="sr-only">{label}</span>
                  <span aria-hidden="true" className="contents">
                    {body}
                  </span>
                </div>
              )}
              {canMove && (
                <MoveTo
                  item={item}
                  axis={axis}
                  resources={props.resources}
                  unavailable={unavailable}
                  onMove={(to) => {
                    report(item, to)
                    announce('schedule.moved', item, to)
                  }}
                />
              )}
            </div>
          )
        })}
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
        {Array.from({ length: phone ? 1 : 4 }, (_, index) => (
          <Skeleton key={index} className={phone ? 'h-96' : 'h-14'} />
        ))}
      </div>
    )
  }

  const hours: { day: number; at: number; text: string }[] = []
  axis.days.forEach((day, index) => {
    for (let at = Math.ceil(axis.dayStart / 60) * 60; at < axis.dayEnd; at += 60) {
      hours.push({
        day: index,
        at: index * length + at - axis.dayStart,
        text: format.time(localDateTime(day, at)),
      })
    }
  })

  const resourceOf = props.resources[phoneRow]

  return (
    <div
      data-slot="resource-schedule"
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      <span id={instructionsId} className="sr-only">
        {messages['schedule.instructions']}
      </span>
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {phone && resourceOf !== undefined && (
        <SelectField
          label={props.resourceLabel ?? messages['schedule.resource']}
          value={resourceOf.id}
          options={props.resources.map((each) => ({ value: each.id, label: each.name }))}
          onChange={(value) => {
            const index = props.resources.findIndex((each) => each.id === value)
            if (index !== -1) showResource(index)
          }}
        />
      )}
      {phone ? (
        <div
          ref={grid}
          role="region"
          aria-label={resourceOf === undefined ? props.label : `${props.label}: ${resourceOf.name}`}
          className="flex rounded-md border border-solid border-default bg-surface-raised"
        >
          <div aria-hidden="true" className="relative w-16 shrink-0" style={{ height: extent }}>
            {axis.days.length > 1 &&
              axis.days.map((day, index) => (
                <span
                  key={day}
                  className="absolute inset-x-0 truncate px-2 py-2 text-xs font-semibold text-primary"
                  style={{ top: index * (DAY_HEADER + length * PX_PHONE) }}
                >
                  {format.date(day)}
                </span>
              ))}
            {hours.map((hour) => (
              <span
                key={`${String(hour.day)}-${String(hour.at)}`}
                className={cn(
                  'absolute end-2 text-xs whitespace-nowrap text-tertiary tabular-nums',
                  TEXT_ISOLATE,
                )}
                style={{ top: along(hour.at) + 2 }}
              >
                {hour.text}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 border-0 border-s border-solid border-subtle">
            {renderTrack(phoneRow)}
          </div>
        </div>
      ) : (
        <div
          ref={grid}
          role="region"
          aria-label={props.label}
          // Focusable only while it scrolls, so the keyboard can scroll it (WCAG 2.1.1, axe
          // scrollable-region-focusable), as DataTable's area.
          {...(scrolls ? { tabIndex: 0 } : {})}
          className={cn(
            'overflow-x-auto rounded-md border border-solid border-default bg-surface-raised',
            FOCUS_RING,
          )}
        >
          <div className="relative" style={{ minWidth: NAME_WIDTH + total * PX_MIN }}>
            {axis.days.length > 1 && (
              <div aria-hidden="true" className="flex border-0 border-b border-solid border-subtle">
                <div
                  className="sticky start-0 shrink-0 bg-surface-raised"
                  style={{ width: NAME_WIDTH }}
                />
                <div className="flex min-w-0 flex-1">
                  {axis.days.map((day) => (
                    <div
                      key={day}
                      className="box-border truncate border-0 border-s border-solid border-default px-2 py-1.5 text-xs font-semibold text-primary"
                      style={{ width: `${String((length * 100) / total)}%` }}
                    >
                      {format.dateLong(day)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div aria-hidden="true" className="flex border-0 border-b border-solid border-default">
              <div
                className="sticky start-0 z-(--liro-layer-raised) shrink-0 bg-surface-raised"
                style={{ width: NAME_WIDTH }}
              />
              <div className="relative h-7 flex-1">
                {hours.map((hour) => (
                  <span
                    key={`${String(hour.day)}-${String(hour.at)}`}
                    className={cn(
                      'absolute top-1.5 ps-1 text-xs whitespace-nowrap text-tertiary tabular-nums',
                      TEXT_ISOLATE,
                    )}
                    style={{ insetInlineStart: `${String(along(hour.at))}%` }}
                  >
                    {hour.text}
                  </span>
                ))}
              </div>
            </div>
            {props.resources.map((resource, row) => (
              <div
                key={resource.id}
                role="group"
                aria-labelledby={`${instructionsId}-${resource.id}`}
                className={cn(
                  'flex border-0 border-t border-solid border-subtle',
                  row === 0 && 'border-t-0',
                )}
              >
                <div
                  className="sticky start-0 z-(--liro-layer-raised) box-border flex shrink-0 flex-col justify-center gap-0.5 border-0 border-e border-solid border-default bg-surface-raised px-3"
                  style={{ width: NAME_WIDTH, height: ROW_HEIGHT }}
                >
                  <span
                    id={`${instructionsId}-${resource.id}`}
                    className={cn('truncate text-sm font-semibold text-primary', TEXT_DIRECTION)}
                  >
                    {resource.name}
                  </span>
                  {resource.description !== undefined && (
                    <span className={cn('truncate text-xs text-secondary', TEXT_DIRECTION)}>
                      {resource.description}
                    </span>
                  )}
                </div>
                {renderTrack(row)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** "Move to…": the row, the day and the start in a popover, then Move. */
function MoveTo({
  item,
  axis,
  resources,
  unavailable,
  onMove,
}: {
  item: Placed
  axis: ScheduleAxis
  resources: readonly ScheduleResource[]
  unavailable: readonly UnavailableTime[]
  onMove: (to: SchedulePlace) => void
}) {
  const { messages, format, timeZone } = useLiro()
  const length = dayLength(axis)
  const [open, setOpen] = useState(false)
  const initialDay = Math.min(axis.days.length - 1, Math.floor(item.start / length))
  const [resource, setResource] = useState(item.resource)
  const [dayIndex, setDayIndex] = useState(initialDay)
  const [offset, setOffset] = useState(item.start - initialDay * length)
  const day = axis.days[dayIndex] ?? axis.days[0] ?? ''
  const resourceId = resources[resource]?.id ?? ''
  const starts: number[] = []
  for (let at = 0; at + Math.min(item.duration, length) <= length; at += axis.slotMinutes)
    starts.push(at)
  if (!starts.includes(offset)) starts.push(offset)
  starts.sort((a, b) => a - b)
  const title = messages['schedule.moveTo'](item.booking.title)
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setResource(item.resource)
          setDayIndex(initialDay)
          setOffset(item.start - initialDay * length)
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title}
          title={title}
          className={cn(
            BUTTON_RESET,
            'absolute end-1 top-1/2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-current hover:bg-surface-hover',
            FOCUS_RING,
          )}
        >
          <MoveRight aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={title} className="flex w-72 flex-col gap-3">
        <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {messages['schedule.moveToTitle']}
        </p>
        <SelectField
          label={messages['schedule.resource']}
          value={resourceId}
          options={resources.map((each) => ({ value: each.id, label: each.name }))}
          onChange={(value) => {
            const index = resources.findIndex((each) => each.id === value)
            if (index !== -1) setResource(index)
          }}
        />
        {axis.days.length > 1 && (
          <SelectField
            label={messages['schedule.day']}
            value={day}
            options={axis.days.map((each) => ({ value: each, label: format.dateLong(each) }))}
            onChange={(value) => {
              const index = axis.days.indexOf(value)
              if (index !== -1) setDayIndex(index)
            }}
          />
        )}
        <SelectField
          label={messages['schedule.start']}
          value={String(offset)}
          options={starts.map((at) => {
            const minutes = axis.dayStart + at
            const text = format.time(localDateTime(day, minutes))
            const reason = unavailableReason(
              unavailable,
              resourceId,
              absoluteMinutes(day, minutes),
              absoluteMinutes(day, minutes + item.duration),
              timeZone,
            )
            return {
              value: String(at),
              label: reason === null ? text : messages['schedule.optionUnavailable'](text, reason),
            }
          })}
          onChange={(value) => {
            setOffset(Number(value))
          }}
        />
        <ButtonPrimitive
          family="primary"
          className="self-end ps-4.5"
          onClick={() => {
            setOpen(false)
            onMove({ resource, start: dayIndex * length + offset })
          }}
        >
          <span className={TEXT_DIRECTION}>{messages['schedule.move']}</span>
        </ButtonPrimitive>
      </PopoverContent>
    </Popover>
  )
}

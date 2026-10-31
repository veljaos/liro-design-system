import { useId, useState } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { toneClasses } from './calendar-view'
import type { ScheduleBooking, ScheduleResource } from './resource-schedule'
import { scheduleSearchMatches } from './schedule-logic'
import { TextField } from './text-field'

/*
 * ResourceSchedule's phone lists: a phone never draws the
 * timeline of a schedule with many rows (a hotel with 200 rooms). It shows the day's lists the
 * application passes (`phoneLists`: arrivals, departures, in house …) — which booking is in which
 * list is the application's data, the component computes nothing — chosen with a segmented
 * control that counts each list, a search over every booking's title, description and row name
 * (the counts follow it), and the bookings as rows of at least 56px: the title, the row and the
 * time (or the days of a stay), the description. A press opens the booking (`onSelect`: the
 * application's Drawer). The timeline stays on desktops and tablets.
 */

/** One of the day's lists on a phone, from the application ("Arrivals"). */
export interface SchedulePhoneList {
  id: string
  /** Its name ("Arrivals", "In house"). */
  label: string
  /** The bookings in it, in the application's order. A booking may be in several lists. */
  bookings: readonly ScheduleBooking[]
  /** Said when it has none ("No arrivals today"). Default `messages['schedule.listEmpty']`. */
  emptyText?: string
}

export interface SchedulePhoneListsProps {
  lists: readonly SchedulePhoneList[]
  resources: readonly ScheduleResource[]
  /** Names the lists' region ("Rooms, 14 October"). */
  label: string
  /** The search field's label. Default `messages['schedule.search']`. */
  searchLabel?: string
  /** Stays over days: a booking's days, not its hours. */
  byDay: boolean
  onSelect?: (booking: ScheduleBooking) => void
  className?: string
}

/** The day's lists of a schedule on a phone: a list at a time, searched, each booking pressable. */
export function SchedulePhoneLists(props: SchedulePhoneListsProps) {
  const { messages, format, locale } = useLiro()
  const listId = useId()
  const [chosen, setChosen] = useState(props.lists[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const resourceName = (booking: ScheduleBooking) =>
    props.resources.find((each) => each.id === booking.resourceId)?.name
  const matching = (list: SchedulePhoneList) =>
    list.bookings.filter((booking) =>
      scheduleSearchMatches(
        query,
        [booking.title, booking.description, resourceName(booking)],
        locale,
      ),
    )
  const shown = props.lists.find((each) => each.id === chosen) ?? props.lists[0]
  const rows = shown === undefined ? [] : matching(shown)
  const searching = query.trim() !== ''

  /** The booking's time: its hours, or its days for a stay (the last day included). */
  const timeText = (booking: ScheduleBooking) => {
    if (props.byDay) {
      const first = booking.start.slice(0, 10)
      const last = booking.end.slice(0, 10)
      return first === last
        ? format.date(first)
        : messages['calendar.range'](format.date(first), format.date(last))
    }
    return messages['calendar.range'](format.time(booking.start), format.time(booking.end))
  }

  return (
    <section
      data-slot="schedule-phone-lists"
      aria-label={props.label}
      className={cn('flex min-w-0 flex-col gap-3', props.className)}
    >
      <TextField
        type="search"
        label={props.searchLabel ?? messages['schedule.search']}
        hideLabel
        placeholder={props.searchLabel ?? messages['schedule.search']}
        value={query}
        onChange={setQuery}
      />
      {props.lists.length > 1 && (
        <ToggleGroup
          type="single"
          value={shown?.id ?? ''}
          aria-label={props.label}
          className="flex w-full"
          onValueChange={(value) => {
            if (value !== '') setChosen(value)
          }}
        >
          {props.lists.map((list) => (
            <ToggleGroupItem
              key={list.id}
              value={list.id}
              aria-controls={listId}
              className="h-auto min-h-9 min-w-0 flex-1 px-2 py-1 whitespace-normal"
            >
              <span className={TEXT_DIRECTION}>{list.label}</span>{' '}
              <span className={cn('text-secondary tabular-nums', TEXT_ISOLATE)}>
                {format.number(String(matching(list).length))}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <div id={listId} className="flex min-w-0 flex-col gap-1">
        {shown !== undefined && props.lists.length === 1 && (
          <h3 className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {shown.label}
          </h3>
        )}
        {rows.length === 0 ? (
          <p
            className={cn(
              'm-0 rounded-md bg-surface-sunken px-4 py-8 text-center text-sm text-secondary',
              TEXT_ISOLATE,
            )}
          >
            {searching
              ? messages['schedule.noMatches'](query.trim())
              : (shown?.emptyText ?? messages['schedule.listEmpty'])}
          </p>
        ) : (
          <ul
            aria-label={shown?.label}
            className="m-0 flex list-none flex-col overflow-hidden rounded-md border border-solid border-default bg-surface-raised p-0"
          >
            {rows.map((booking) => {
              const room = resourceName(booking)
              const toned = booking.tone !== undefined && booking.tone !== 'neutral'
              const content = (
                <>
                  {toned && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-y-2 start-0 w-[3px] rounded-full bg-current',
                        toneClasses(booking.tone).fg,
                      )}
                    />
                  )}
                  <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                    {booking.title}
                  </span>
                  <span className="flex flex-wrap gap-x-2 text-xs text-secondary">
                    {room !== undefined && <span className={TEXT_DIRECTION}>{room}</span>}
                    <span className={cn('tabular-nums', TEXT_ISOLATE)}>{timeText(booking)}</span>
                  </span>
                  {booking.description !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {booking.description}
                    </span>
                  )}
                </>
              )
              const look =
                'relative box-border flex min-h-14 w-full min-w-0 flex-col justify-center gap-0.5 px-4 py-2 text-start'
              return (
                <li
                  key={booking.id}
                  data-booking={booking.id}
                  className="border-0 border-t border-solid border-subtle first:border-t-0"
                >
                  {props.onSelect === undefined ? (
                    <div className={look}>{content}</div>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        BUTTON_RESET,
                        look,
                        'cursor-pointer hover:bg-surface-hover',
                        FOCUS_RING,
                        // Inside the list's rounded frame, which clips what stands outside it.
                        'focus-visible:-outline-offset-2',
                      )}
                      onClick={() => {
                        props.onSelect?.(booking)
                      }}
                    >
                      {content}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

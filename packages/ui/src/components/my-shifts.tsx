import { ArrowLeftRight, CalendarX2, PenLine } from 'lucide-react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { EmptyState } from './empty-state'
import { shiftsByWeek, weekdayOf } from './shift-logic'
import { ShiftTime } from './shift-parts'
import {
  ShiftSwapDialog,
  type ShiftSwapRequest,
  type SwapColleague,
  type SwapShift,
} from './shift-swap-dialog'
import { StatusBadge } from './status-badge'

/*
 * MyShifts (BUILD-PLAN P5.24 b): a person's own upcoming shifts, made for a phone. Weeks under a
 * heading ("This week", "Next week", then their dates); each shift a card: the weekday and date,
 * the template's name and times ("22:00–06:00 (+1)", read as "… the next day"), the place and
 * team, "Changed" (a warning badge with its icon, and the application's words of what changed)
 * when it changed since publishing, the application's state of a swap request in words, and
 * "Request swap", which opens ShiftSwapDialog. The application decides which shifts may be
 * swapped (`swappable`) and who may take them (`colleagues`).
 */

/** One of the person's shifts, from the application. */
export interface MyShift extends SwapShift {
  /** The team ("Late team"), after the place. */
  team?: string
  /** Changed since publishing: what changed, in the application's words ("Was 15:00–23:00"). */
  changed?: string
  /** A swap request's state, in the application's words ("Swap requested · waiting"). */
  swapState?: string
  /** "Request swap" is offered. Default true when `onSwapSubmit` is given and no `swapState`. */
  swappable?: boolean
}

export interface MyShiftsProps {
  shifts: readonly MyShift[]
  /** The heading. Default: the provider's "My shifts". */
  title?: string
  /** The heading's level. Default 1 (the phone screen's own heading). */
  headingLevel?: 1 | 2 | 3
  /** Who may take a shift, from the application. */
  colleagues?: (shift: MyShift) => readonly SwapColleague[]
  /** Sends a swap request; a returned promise keeps the dialog working until it settles. */
  onSwapSubmit?: (request: ShiftSwapRequest) => void | Promise<void>
  /** The swap's reason must be written. */
  swapReasonRequired?: boolean
  /** The shift whose swap dialog is open from the start (a request being written, restored). */
  defaultSwapShift?: string
  /** Skeleton cards while the shifts load. */
  loading?: boolean
  className?: string
}

/** A person's upcoming shifts by week, each with "Request swap". */
export function MyShifts(props: MyShiftsProps) {
  const { messages, format, weekStartsOn, today } = useLiro()
  const Heading = `h${String(props.headingLevel ?? 1)}` as 'h1'
  const SubHeading = `h${String(Math.min(6, (props.headingLevel ?? 1) + 1))}` as 'h2'
  const title = props.title ?? messages['shifts.myShifts']
  const weeks = shiftsByWeek(props.shifts, weekStartsOn, today)
  return (
    <section
      data-slot="my-shifts"
      aria-label={title}
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      <Heading className={cn('m-0 text-h3 font-semibold text-primary', TEXT_DIRECTION)}>
        {title}
      </Heading>
      {props.loading === true ? (
        <div aria-busy="true" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-md" />
          ))}
        </div>
      ) : weeks.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarX2}
          title={messages['shifts.noUpcoming']}
          description={messages['shifts.noUpcomingDescription']}
          className="py-8"
        />
      ) : (
        weeks.map((week) => {
          const heading =
            week.kind === 'this'
              ? messages['shifts.thisWeek']
              : week.kind === 'next'
                ? messages['shifts.nextWeek']
                : messages['shifts.week'](format.date(week.start), format.date(week.end))
          return (
            <section key={week.start} className="flex flex-col gap-2">
              <SubHeading className="m-0 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-primary">
                <span className={TEXT_ISOLATE}>{heading}</span>
                {week.kind !== 'date' && (
                  <span className="text-xs font-normal text-secondary tabular-nums">
                    {messages['shifts.week'](format.date(week.start), format.date(week.end))}
                  </span>
                )}
              </SubHeading>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {week.shifts.map((shift) => {
                  const swappable =
                    props.onSwapSubmit !== undefined &&
                    (shift.swappable ?? shift.swapState === undefined)
                  const where = [shift.place, shift.team].filter(
                    (each): each is string => each !== undefined,
                  )
                  return (
                    <li
                      key={shift.id}
                      className="box-border flex gap-3 rounded-md border border-solid border-default bg-surface-raised p-3"
                    >
                      <div className="flex w-20 shrink-0 flex-col">
                        <span className="text-xs font-semibold text-secondary">
                          {format.weekdayName(weekdayOf(shift.date), 'short')}
                        </span>
                        <time
                          dir="auto"
                          dateTime={shift.date}
                          className="text-sm text-primary tabular-nums"
                        >
                          {format.date(shift.date)}
                        </time>
                        {shift.date === today && (
                          <span className="text-xs font-semibold text-primary">
                            {messages['shifts.today']}
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className={cn('font-semibold text-primary', TEXT_ISOLATE)}>
                            {shift.label}
                          </span>
                          <ShiftTime start={shift.start} end={shift.end} className="text-primary" />
                        </span>
                        {where.length > 0 && (
                          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                            {where.join(' · ')}
                          </span>
                        )}
                        {shift.changed !== undefined && (
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <StatusBadge
                              label={messages['shifts.changed']}
                              tone="warning"
                              icon={PenLine}
                            />
                            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                              {shift.changed}
                            </span>
                          </span>
                        )}
                        {shift.swapState !== undefined && (
                          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                            {shift.swapState}
                          </span>
                        )}
                        {swappable && props.onSwapSubmit !== undefined && (
                          <div className="mt-1 flex">
                            <ShiftSwapDialog
                              shift={shift}
                              colleagues={props.colleagues?.(shift) ?? []}
                              onSubmit={props.onSwapSubmit}
                              {...(props.swapReasonRequired === true
                                ? { reasonRequired: true }
                                : {})}
                              {...(props.defaultSwapShift === shift.id
                                ? { defaultOpen: true }
                                : {})}
                              trigger={
                                <Button
                                  family="neutral"
                                  icon={ArrowLeftRight}
                                  label={messages['shifts.requestSwap']}
                                />
                              }
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
    </section>
  )
}

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type ChevronProps, type DayPickerProps } from 'react-day-picker'
import { useLiro } from '../provider/liro-provider'
import { BUTTON_RESET, FOCUS_RING } from './classes'
import { cn } from './cn'

/*
 * A month calendar (shadcn/ui calendar on react-day-picker, adapted; Mantine dates 9.6.2:
 * Day, WeekdaysRow and CalendarHeader styles, size 'sm').
 *
 * Everything that depends on the language comes from LiroProvider, never from a bundled locale:
 * month and weekday names from `format` (BUILD-PLAN section 3), the first day of the week from
 * `weekStartsOn`, "today" from `today`, the direction from `direction`, and the accessible names
 * of the days from `format.date`. The three labels the calendar needs for its own controls come
 * from the caller (`labels`), because the Design System has no text of its own.
 *
 * The direction is passed to react-day-picker, which then swaps the left and right arrow keys in
 * right-to-left. shadcn/ui's calendar does not pass it, so those keys moved the wrong way in
 * right-to-left (P2.1 finding, Appendix B.7). The month chevrons are drawn mirrored in
 * right-to-left, as the Button arrows: react-day-picker's default navigation always draws them
 * left and right (its 'around' layout, which swaps them, is not offered).
 *
 * Sizes: days and header controls 36px, radius md, 13px (Mantine: 36 / 2.8 ≈ 12.9px); weekday
 * names 13px, regular, text.secondary, 6px under them; month name weight 600, 10px above the
 * days; 0.5px around each day (withCellSpacing). Selected: brand.solid, brand.solidHover on
 * hover; inside a range: brand.subtle, square corners; days of other months: text.tertiary;
 * disabled: text.disabled.
 */

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export interface CalendarLabels {
  /** The button that shows the previous month. */
  previousMonth: string
  /** The button that shows the next month. */
  nextMonth: string
  /** The group of those two buttons. */
  navigation: string
}

export type CalendarProps = DistributiveOmit<
  DayPickerProps,
  | 'captionLayout'
  | 'navLayout'
  | 'showWeekNumber'
  | 'labels'
  | 'formatters'
  | 'dir'
  | 'locale'
  | 'weekStartsOn'
> & { labels: CalendarLabels }

/** YYYY-MM-DD of a local date. */
function isoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** A local Date at midnight from YYYY-MM-DD. */
function localDate(iso: string): Date {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function Chevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
  return <Icon aria-hidden="true" className={cn('size-[60%] rtl:-scale-x-100', className)} />
}

const NAV_BUTTON = cn(
  BUTTON_RESET,
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-primary hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:text-disabled aria-disabled:hover:bg-transparent',
  FOCUS_RING,
)

export function Calendar({ labels, className, classNames, today, ...props }: CalendarProps) {
  const liro = useLiro()
  const { format } = liro
  const caption = (month: Date) =>
    `${format.monthName(month.getMonth() + 1, 'long')} ${String(month.getFullYear())}`
  return (
    <DayPicker
      dir={liro.direction}
      weekStartsOn={liro.weekStartsOn}
      today={today ?? localDate(liro.today)}
      showOutsideDays
      formatters={{
        formatCaption: caption,
        formatDay: (date) => String(date.getDate()),
        formatWeekdayName: (date) => format.weekdayName(date.getDay(), 'short'),
        formatMonthDropdown: (date) => format.monthName(date.getMonth() + 1, 'long'),
        formatYearDropdown: (date) => String(date.getFullYear()),
      }}
      labels={{
        labelNav: () => labels.navigation,
        labelPrevious: () => labels.previousMonth,
        labelNext: () => labels.nextMonth,
        labelGrid: caption,
        labelGridcell: (date) => format.date(isoDate(date)),
        labelDayButton: (date) => format.date(isoDate(date)),
        labelWeekday: (date) => format.weekdayName(date.getDay(), 'long'),
      }}
      className={cn('relative w-fit font-sans text-primary', className)}
      classNames={{
        months: 'relative flex flex-col gap-4 md:flex-row',
        month: 'flex flex-col',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: NAV_BUTTON,
        button_next: NAV_BUTTON,
        month_caption: 'mb-2.5 flex h-9 items-center justify-center px-9',
        caption_label: 'text-sm font-semibold capitalize',
        month_grid: 'border-collapse',
        weekday: 'pb-1.5 text-sm font-regular text-secondary capitalize',
        day: 'p-[0.5px] text-center',
        day_button: cn(
          BUTTON_RESET,
          'inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-sm text-primary hover:bg-surface-hover',
          FOCUS_RING,
        ),
        selected:
          '[&:not(.liro-range-middle)>button]:bg-brand-solid [&:not(.liro-range-middle)>button]:text-brand-on-solid [&:not(.liro-range-middle)>button:hover]:bg-brand-solid-hover',
        range_start: 'liro-range-start [&:not(.liro-range-end)>button]:rounded-e-none',
        range_end: 'liro-range-end [&:not(.liro-range-start)>button]:rounded-s-none',
        range_middle:
          'liro-range-middle [&>button]:rounded-none [&>button]:bg-brand-subtle [&>button:hover]:bg-brand-subtle-hover',
        outside: '[&>button]:text-tertiary',
        disabled:
          '[&>button]:cursor-not-allowed [&>button]:text-disabled [&>button:hover]:bg-transparent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{ Chevron }}
      {...props}
    />
  )
}

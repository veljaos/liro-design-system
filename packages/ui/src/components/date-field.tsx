import { CalendarDays } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { Calendar, type CalendarLabels } from '../primitives/calendar'
import { INPUT, READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import {
  fromLocalDate,
  openingMonth,
  rangeInOrder,
  readDate,
  showDate,
  toLocalDate,
} from './date-logic'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import { entryAttributes, entryError, useEntry, type EntryProps } from './use-entry'

/*
 * DateField and DateRangeField (BUILD-PLAN P2.3). A date is typed (read by `format.parseDate` on
 * leaving the field or on Enter: "010326", "1.3.2026", "01/03/2026", the locale's own form) or
 * picked in the calendar; the value is YYYY-MM-DD. The calendar opens on the provider's `today`
 * (the tenant's date), and its month and weekday names come from `format`.
 *
 * Owner's decisions (2026-09-28, docs/decisions.md "Numbers, money and dates"):
 * - The calendar opens only from the calendar button at the end of the field, or with Alt+ArrowDown
 *   in the field; typing never opens it (Mantine's DateInput opens it on focus). The focus moves
 *   into the calendar when it opens and back to the field when it closes; Escape closes it.
 * - Unreadable text stays, the value is null, the field shows `messages['field.invalidDate']` and
 *   calls `onValidityChange(false)`; the application's `error` wins.
 *
 * Look: the calendar button is Mantine's ActionIcon in the input's right section (the 28px compact
 * button, neutral and subtle, in a section at least 34px wide); the calendar opens under the field,
 * aligned to its start (Mantine DateInput: position 'bottom-start'), in a popover. A range is shown
 * as "start – end" (Mantine DatesProvider labelSeparator "–").
 */

interface DateInputProps {
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** Shown while the field is empty. From the application. */
  placeholder?: string
}

export interface DateFieldProps extends FieldBaseProps, EntryProps, DateInputProps {
  /** The form field name; the YYYY-MM-DD value is submitted, not the text shown. */
  name?: string
}

/** The calendar's own labels, from the provider's messages. */
function useCalendarLabels(): CalendarLabels {
  const { messages } = useLiro()
  return {
    previousMonth: messages['calendar.previousMonth'],
    nextMonth: messages['calendar.nextMonth'],
    navigation: messages['calendar.navigation'],
  }
}

/** The typed entry of a date: read by `format.parseDate`, shown by `format.date`. */
function useDateEntry(props: EntryProps) {
  const { format } = useLiro()
  return useEntry(
    props,
    (text) => readDate(text, format),
    (value) => showDate(value, format),
  )
}

/** The frame of an editable date field: the input look around the typing areas and the button. */
function dateBoxClass(control: { invalid: boolean; disabled: boolean }) {
  return cn(
    INPUT,
    'flex items-center px-0 focus-within:border-focus',
    control.invalid && 'border-status-danger-fg focus-within:border-status-danger-fg',
    control.disabled && 'cursor-not-allowed border-default bg-surface-disabled text-disabled',
  )
}

/** A typing area inside the frame. */
const TYPING =
  'm-0 h-full min-w-0 flex-1 border-0 bg-transparent py-0 font-sans text-sm text-inherit tabular-nums outline-none placeholder:text-tertiary disabled:cursor-not-allowed'

/**
 * Each end of a range is as wide as its text (`field-sizing: content`, at least 8 characters so
 * an empty end can be clicked), so the range reads "start – end" as Mantine writes it, in any
 * locale's date length. A wide end area also cut its last digit in right-to-left in Chromium on
 * Linux. Without field-sizing, a browser gives each input its default width.
 */
const RANGE_PART = 'min-w-[8ch] flex-none field-sizing-content'

/** The calendar button, in a section at the end of the field. */
function CalendarButton({ disabled }: { disabled: boolean }) {
  const { messages } = useLiro()
  const label = messages['field.openCalendar']
  return (
    <span className="flex h-full min-w-[34px] shrink-0 items-center justify-center">
      <PopoverTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          shape="compact"
          aria-label={label}
          title={label}
          disabled={disabled}
        >
          <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
        </ButtonPrimitive>
      </PopoverTrigger>
    </span>
  )
}

/** The popover that holds the calendar; on close the focus returns to `returnTo`. */
function CalendarPopover({
  labelId,
  returnTo,
  children,
}: {
  labelId: string
  returnTo: RefObject<HTMLInputElement | null>
  children: ReactNode
}) {
  const content = useRef<HTMLDivElement>(null)
  return (
    <PopoverContent
      align="start"
      aria-labelledby={labelId}
      className="w-auto"
      ref={content}
      onOpenAutoFocus={(event) => {
        // The focus goes to the calendar's day in the tab order: the chosen day, else today
        // (react-day-picker's roving tab index), not to the first button in the popover.
        event.preventDefault()
        content.current?.querySelector<HTMLElement>('[role="grid"] button[tabindex="0"]')?.focus()
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        returnTo.current?.focus()
      }}
    >
      {children}
    </PopoverContent>
  )
}

/**
 * Whether a calendar popover is open, and how many times it has opened: the calendar is keyed by
 * that count, so it starts on the right month and day each time. Reopened quickly, the closing
 * popover is still mounted (it fades out) and the calendar kept the month it last showed.
 */
export function useCalendarOpen() {
  const [open, setOpenState] = useState(false)
  const [openings, setOpenings] = useState(0)
  const setOpen = (next: boolean) => {
    if (next && !open) setOpenings((count) => count + 1)
    setOpenState(next)
  }
  return { open, setOpen, openings }
}

/** Alt+ArrowDown in a typing area opens the calendar. */
function openOnAltArrowDown(open: () => void) {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault()
      open()
    }
  }
}

/**
 * A date, typed or picked in the calendar. The value is YYYY-MM-DD; the text is written and read
 * in the locale's order through the provider's `format`.
 */
export function DateField(props: DateFieldProps) {
  const { messages, today } = useLiro()
  const labels = useCalendarLabels()
  const entry = useDateEntry(props)
  const error = entryError(props.error, entry.valid, messages['field.invalidDate'])
  const { open, setOpen, openings } = useCalendarOpen()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => {
        const attributes = controlAttributes(control, messages['field.readOnly'])
        const typing = entryAttributes(entry, props, control.readOnly)
        if (control.readOnly) {
          return <Input {...attributes} {...typing} className={cn('tabular-nums', READ_ONLY)} />
        }
        const onKeyDown = openOnAltArrowDown(() => {
          entry.commit()
          setOpen(true)
        })
        return (
          <>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverAnchor asChild>
                <div data-slot="date" className={dateBoxClass(control)}>
                  <input
                    ref={inputRef}
                    {...attributes}
                    {...typing}
                    onKeyDown={(event) => {
                      onKeyDown(event)
                      typing.onKeyDown(event)
                    }}
                    className={cn(TYPING, 'ps-3 pe-0')}
                  />
                  <CalendarButton disabled={control.disabled} />
                </div>
              </PopoverAnchor>
              <CalendarPopover labelId={control.labelId} returnTo={inputRef}>
                <Calendar
                  key={openings}
                  mode="single"
                  labels={labels}
                  defaultMonth={openingMonth(entry.value, today)}
                  {...(entry.value === null ? {} : { selected: toLocalDate(entry.value) })}
                  onSelect={(date: Date | undefined) => {
                    // A second press on the chosen day gives undefined: the choice stays.
                    if (date !== undefined) entry.pick(fromLocalDate(date))
                    setOpen(false)
                  }}
                />
              </CalendarPopover>
            </Popover>
            {props.name !== undefined && (
              <input type="hidden" name={props.name} value={entry.value ?? ''} />
            )}
          </>
        )
      }}
    </Field>
  )
}

/** A range of dates; either end may be open (null). */
export interface DateRange {
  start: string | null
  end: string | null
}

const EMPTY_RANGE: DateRange = { start: null, end: null }

export interface DateRangeFieldProps extends FieldBaseProps, DateInputProps {
  /** Controlled range. */
  value?: DateRange
  /** Uncontrolled initial range. */
  defaultValue?: DateRange
  /** Called when either end changes: on leaving a typing area, on Enter, or on a pick. */
  onChange?: (range: DateRange) => void
  /**
   * Called when the range becomes invalid (false: unreadable text, or the end before the start)
   * or valid again (true). A form should not save while it is false.
   */
  onValidityChange?: (valid: boolean) => void
  /** The form field name of the start; its YYYY-MM-DD value is submitted. */
  startName?: string
  /** The form field name of the end. */
  endName?: string
}

/**
 * A range of dates in one field, "start – end": each end typed, or both picked in the calendar
 * (the first day picked is the start, the second the end, in either order). An end before the
 * start is shown as an error, never swapped silently.
 */
export function DateRangeField(props: DateRangeFieldProps) {
  const { messages, today } = useLiro()
  const labels = useCalendarLabels()
  const [inner, setInner] = useState(props.defaultValue ?? EMPTY_RANGE)
  const range = props.value ?? inner
  const emit = (next: DateRange) => {
    setInner(next)
    props.onChange?.(next)
  }
  const [startValid, setStartValid] = useState(true)
  const [endValid, setEndValid] = useState(true)
  const start = useDateEntry({
    value: range.start,
    onChange: (value) => {
      emit({ start: value, end: range.end })
    },
    onValidityChange: setStartValid,
  })
  const end = useDateEntry({
    value: range.end,
    onChange: (value) => {
      emit({ start: range.start, end: value })
    },
    onValidityChange: setEndValid,
  })

  const readable = startValid && endValid
  const inOrder = rangeInOrder(range.start, range.end)
  const valid = readable && inOrder
  const reportedValid = useRef(true)
  const onValidityChange = props.onValidityChange
  useEffect(() => {
    if (valid !== reportedValid.current) {
      reportedValid.current = valid
      onValidityChange?.(valid)
    }
  }, [valid, onValidityChange])

  const ownError = !readable
    ? messages['field.invalidDate']
    : inOrder
      ? undefined
      : messages['field.invalidRange']
  const error = entryError(props.error, ownError === undefined, ownError ?? '')

  const { open, setOpen, openings } = useCalendarOpen()
  // Days picked since the calendar opened: the first is the start, the second the end.
  const [picked, setPicked] = useState<string | null>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const nameId = useId()

  return (
    <Field {...fieldProps({ ...props, error })}>
      {(control) => {
        const attributes = controlAttributes(control, messages['field.readOnly'])
        const startTyping = entryAttributes(start, props, control.readOnly)
        const endTyping = entryAttributes(end, props, control.readOnly)
        const startLabel = `${nameId}-start`
        const endLabel = `${nameId}-end`
        const names = (
          <>
            <span id={startLabel} className="sr-only">
              {messages['field.rangeStart']}
            </span>
            <span id={endLabel} className="sr-only">
              {messages['field.rangeEnd']}
            </span>
          </>
        )
        const separator = (
          <span aria-hidden="true" className="shrink-0 px-1 text-sm text-secondary">
            –
          </span>
        )
        if (control.readOnly) {
          return (
            <div className="flex h-control items-center px-3 font-sans text-sm text-primary">
              {names}
              <input
                {...attributes}
                {...startTyping}
                aria-labelledby={`${control.labelId} ${startLabel}`}
                className={cn(
                  TYPING,
                  RANGE_PART,
                  'px-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                )}
              />
              {separator}
              <input
                {...attributes}
                {...endTyping}
                id={`${control.id}-end`}
                aria-labelledby={`${control.labelId} ${endLabel}`}
                className={cn(
                  TYPING,
                  RANGE_PART,
                  'px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                )}
              />
            </div>
          )
        }
        const openCalendar = () => {
          start.commit()
          end.commit()
          setPicked(null)
          setOpen(true)
        }
        return (
          <>
            {names}
            <Popover
              open={open}
              onOpenChange={(next) => {
                if (next) setPicked(null)
                setOpen(next)
              }}
            >
              <PopoverAnchor asChild>
                <div data-slot="date-range" className={dateBoxClass(control)}>
                  <input
                    ref={startRef}
                    {...attributes}
                    {...startTyping}
                    aria-labelledby={`${control.labelId} ${startLabel}`}
                    onKeyDown={(event) => {
                      openOnAltArrowDown(openCalendar)(event)
                      startTyping.onKeyDown(event)
                    }}
                    className={cn(TYPING, RANGE_PART, 'ps-3 pe-0')}
                  />
                  {separator}
                  <input
                    {...attributes}
                    {...endTyping}
                    id={`${control.id}-end`}
                    aria-labelledby={`${control.labelId} ${endLabel}`}
                    onKeyDown={(event) => {
                      openOnAltArrowDown(openCalendar)(event)
                      endTyping.onKeyDown(event)
                    }}
                    className={cn(TYPING, RANGE_PART, 'px-0.5')}
                  />
                  {/* The room between the end and the calendar button. */}
                  <span aria-hidden="true" className="flex-1" />
                  <CalendarButton disabled={control.disabled} />
                </div>
              </PopoverAnchor>
              <CalendarPopover labelId={control.labelId} returnTo={startRef}>
                <Calendar
                  key={openings}
                  mode="range"
                  labels={labels}
                  defaultMonth={openingMonth(range.start ?? range.end, today)}
                  selected={{
                    from:
                      picked === null
                        ? range.start === null
                          ? undefined
                          : toLocalDate(range.start)
                        : toLocalDate(picked),
                    to: picked === null && range.end !== null ? toLocalDate(range.end) : undefined,
                  }}
                  onSelect={(_range, day: Date) => {
                    const iso = fromLocalDate(day)
                    if (picked === null) {
                      setPicked(iso)
                      return
                    }
                    emit(iso < picked ? { start: iso, end: picked } : { start: picked, end: iso })
                    setOpen(false)
                  }}
                />
              </CalendarPopover>
            </Popover>
            {props.startName !== undefined && (
              <input type="hidden" name={props.startName} value={range.start ?? ''} />
            )}
            {props.endName !== undefined && (
              <input type="hidden" name={props.endName} value={range.end ?? ''} />
            )}
          </>
        )
      }}
    </Field>
  )
}

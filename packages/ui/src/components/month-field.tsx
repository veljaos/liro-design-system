import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { BUTTON_RESET, FOCUS_RING, INPUT, READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import { useCalendarOpen } from './date-field'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'

/*
 * MonthField (BUILD-PLAN P2.3), the previous Design System's AccountingPeriodSelect: one month,
 * chosen in a month grid (owner's decision, 2026-09-28). Mantine 9.6.2 MonthPickerInput and
 * @mantine/dates styles: the trigger is a button drawn as an input (PickerInputBase), the value
 * written as month and year; the dropdown opens under it at its start and shows a year header
 * with previous and next buttons (CalendarHeader, 36px controls) over twelve months in four rows
 * of three (MonthsList); each month is a PickerControl: 36px high, 36 × 7 / 3 + 1.5 ≈ 85.5px wide,
 * 13px, radius md, surface.hover on hover, brand.solid when chosen, 0.5px around each.
 *
 * Keyboard: the arrows move between months — left and right by one, measured from the leading
 * edge (Appendix B.7), up and down by a row of three — and change the year at either end; Enter
 * or Space chooses. The focus goes to the chosen month (else the current one) when it opens and
 * back to the trigger when it closes.
 */

export interface MonthFieldProps extends FieldBaseProps {
  /** Controlled month as YYYY-MM, or null for none. */
  value?: string | null
  /** Uncontrolled initial month. */
  defaultValue?: string | null
  /** Called with the chosen month as YYYY-MM. */
  onChange?: (month: string) => void
  /** Shown while no month is chosen. From the application. */
  placeholder?: string
  /** The form field name; the YYYY-MM value is submitted. */
  name?: string
}

/** Months counted from year 0: year * 12 + (month - 1), for YYYY-MM or YYYY-MM-DD. */
export function monthIndexOf(value: string): number {
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1
}

/** YYYY-MM of a month index. */
export function monthOf(index: number): string {
  const year = Math.floor(index / 12)
  const month = index - year * 12 + 1
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

/**
 * The month an arrow key moves to from `index`: ArrowRight goes to the next month in
 * left-to-right and to the previous one in right-to-left (the grid runs from the leading edge);
 * up and down move by a row of three. Crossing either end changes the year. null for other keys.
 */
export function moveMonth(index: number, key: string, direction: 'ltr' | 'rtl'): number | null {
  const forward = direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft'
  const backward = direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight'
  if (key === forward) return index + 1
  if (key === backward) return index - 1
  if (key === 'ArrowDown') return index + 3
  if (key === 'ArrowUp') return index - 3
  return null
}

const NAV = cn(
  BUTTON_RESET,
  'inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-primary hover:bg-surface-hover',
  FOCUS_RING,
)

const CONTROL = cn(
  BUTTON_RESET,
  'flex h-9 w-[85.5px] cursor-pointer items-center justify-center rounded-md text-sm text-primary capitalize hover:bg-surface-hover aria-pressed:bg-brand-solid aria-pressed:text-brand-on-solid aria-pressed:hover:bg-brand-solid-hover',
  FOCUS_RING,
)

/** One month, chosen in a grid of twelve. The value is YYYY-MM. */
export function MonthField(props: MonthFieldProps) {
  const liro = useLiro()
  const { messages, format, direction } = liro
  const [inner, setInner] = useState(props.defaultValue ?? null)
  const value = props.value === undefined ? inner : props.value
  const { open, setOpen, openings } = useCalendarOpen()
  const current = value === null ? monthIndexOf(liro.today) : monthIndexOf(value)
  // The month that holds the focus in the grid; its year is the year shown.
  const [focused, setFocused] = useState(current)
  const grid = useRef<HTMLDivElement>(null)
  const shownYear = Math.floor(focused / 12)

  const name = (index: number, style: 'long' | 'short') =>
    `${format.monthName((index % 12) + 1, style)}${style === 'long' ? ` ${String(Math.floor(index / 12))}` : ''}`
  const text = value === null ? null : name(monthIndexOf(value), 'long')

  const focusMonth = (index: number) => {
    setFocused(index)
    // After the grid shows the new year, focus the month's button.
    requestAnimationFrame(() => {
      grid.current?.querySelector<HTMLElement>(`[data-month="${String(index)}"]`)?.focus()
    })
  }
  const choose = (index: number) => {
    const month = monthOf(index)
    setInner(month)
    props.onChange?.(month)
    setOpen(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = moveMonth(index, event.key, direction)
    if (next !== null) {
      event.preventDefault()
      focusMonth(next)
    }
  }

  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        if (control.readOnly) {
          return (
            <Input
              {...controlAttributes(control, messages['field.readOnly'])}
              value={text ?? ''}
              className={READ_ONLY}
            />
          )
        }
        return (
          <>
            <Popover
              open={open}
              onOpenChange={(next) => {
                if (next) setFocused(current)
                setOpen(next)
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id={control.id}
                  aria-labelledby={`${control.labelId} ${control.id}`}
                  aria-describedby={control.describedBy}
                  disabled={control.disabled}
                  className={cn(
                    INPUT,
                    'cursor-pointer text-start enabled:hover:bg-surface-hover',
                    // The month's name is capitalised; the placeholder is shown as given.
                    text === null ? 'text-tertiary' : 'capitalize',
                    // A button cannot be aria-invalid; the error is linked by aria-describedby.
                    control.invalid && 'border-status-danger-fg',
                  )}
                >
                  {text ?? props.placeholder ?? ''}
                </button>
              </PopoverTrigger>
              <PopoverContent
                key={openings}
                align="start"
                aria-labelledby={control.labelId}
                className="w-auto"
                onOpenAutoFocus={(event) => {
                  event.preventDefault()
                  grid.current
                    ?.querySelector<HTMLElement>(`[data-month="${String(current)}"]`)
                    ?.focus()
                }}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    className={NAV}
                    aria-label={messages['calendar.previousYear']}
                    title={messages['calendar.previousYear']}
                    onClick={() => {
                      setFocused(focused - 12)
                    }}
                  >
                    <ChevronLeft aria-hidden="true" className="size-[60%] rtl:-scale-x-100" />
                  </button>
                  <span className="text-sm font-semibold">{shownYear}</span>
                  <button
                    type="button"
                    className={NAV}
                    aria-label={messages['calendar.nextYear']}
                    title={messages['calendar.nextYear']}
                    onClick={() => {
                      setFocused(focused + 12)
                    }}
                  >
                    <ChevronRight aria-hidden="true" className="size-[60%] rtl:-scale-x-100" />
                  </button>
                </div>
                <div
                  ref={grid}
                  role="group"
                  aria-label={String(shownYear)}
                  className="grid grid-cols-3"
                >
                  {Array.from({ length: 12 }, (_, month) => {
                    const index = shownYear * 12 + month
                    return (
                      <span key={index} className="p-[0.5px]">
                        <button
                          type="button"
                          data-month={index}
                          aria-label={name(index, 'long')}
                          aria-pressed={value !== null && index === monthIndexOf(value)}
                          tabIndex={index === focused ? 0 : -1}
                          className={CONTROL}
                          onKeyDown={(event) => {
                            onKeyDown(event, index)
                          }}
                          onClick={() => {
                            choose(index)
                          }}
                        >
                          {name(index, 'short')}
                        </button>
                      </span>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
            {props.name !== undefined && (
              <input type="hidden" name={props.name} value={value ?? ''} />
            )}
          </>
        )
      }}
    </Field>
  )
}

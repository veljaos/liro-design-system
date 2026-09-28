import { CalendarDays, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { Calendar } from '../primitives/calendar'
import { READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import { useCalendarOpen, type DateRange } from './date-field'
import { fromLocalDate, openingMonth, toLocalDate } from './date-logic'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import {
  describePeriod,
  matchingPreset,
  PERIOD_PRESETS,
  presetRange,
  type PeriodPreset,
  type PeriodRules,
  type QuarterBasis,
} from './period-logic'

/*
 * PeriodField (BUILD-PLAN P2.3), carried over from the previous Design System's PeriodPicker
 * (owner's decision, 2026-09-28, docs/decisions.md "Numbers, money and dates"):
 * - The trigger is a neutral "default" button: a 15px calendar icon at the start, a 14px chevron
 *   at the end, the current period as its label in regular weight.
 * - It opens a popover (radius md, shadow md, under the trigger at its start) with two parts side
 *   by side: presets in a 190px column on the start side, separated by a border.subtle line, as
 *   small buttons aligned to the start (the active one light and semibold, the others subtle and
 *   neutral), with an optional "Clear" (all periods) under a divider; and on the other side the
 *   caption "Custom range" over a range calendar. Choosing both ends applies the range and closes.
 * - A preset is active when the value is exactly its range. Presets follow the business year
 *   (`yearStartMonth`), `quarterBasis`, and the provider's `today` and `weekStartsOn`.
 *
 * Small buttons: Mantine Button size 'xs' (Button.css: 30px high, 14px horizontal padding, 12px
 * text), our small control height. The caption: Mantine Menu.label (12px, weight 600, dimmed,
 * padding 5px 12px). On a narrow screen the two parts stack, presets first.
 */

/** The message of each preset: text keys only, so the name is always a string. */
type PresetMessage =
  | 'period.today'
  | 'period.thisWeek'
  | 'period.thisMonth'
  | 'period.lastMonth'
  | 'period.thisQuarter'
  | 'period.lastQuarter'
  | 'period.yearToDate'
  | 'period.lastYear'

const PRESET_MESSAGE: Record<PeriodPreset, PresetMessage> = {
  today: 'period.today',
  thisWeek: 'period.thisWeek',
  thisMonth: 'period.thisMonth',
  lastMonth: 'period.lastMonth',
  thisQuarter: 'period.thisQuarter',
  lastQuarter: 'period.lastQuarter',
  yearToDate: 'period.yearToDate',
  lastYear: 'period.lastYear',
}

export interface PeriodFieldProps extends FieldBaseProps {
  /** Controlled period; null is all periods. */
  value?: DateRange | null
  /** Uncontrolled initial period. */
  defaultValue?: DateRange | null
  /** Called with the new period, or null when it is cleared. */
  onChange?: (period: DateRange | null) => void
  /** The business year's first month, 1 (January) … 12. Default: 1. */
  yearStartMonth?: number
  /**
   * 'business' (default): Q1 is the business year's first quarter. 'calendar': Q1 is always
   * January to March, for periods such as quarterly VAT.
   */
  quarterBasis?: QuarterBasis
  /** The presets, in order. Default: today … last year (all eight). */
  presets?: readonly PeriodPreset[]
  /** Offers "Clear" under the presets: no period, meaning all periods. */
  clearable?: boolean
  /** The form field name of the start; its YYYY-MM-DD value is submitted. */
  startName?: string
  /** The form field name of the end. */
  endName?: string
}

/** A small preset button (Mantine Button 'xs'), full width, aligned to the start. */
const PRESET = 'h-control-sm w-full justify-start px-3.5 text-xs'

/**
 * A reporting period: a preset (this month, last quarter, year to date …) or a custom range
 * picked in the calendar. The value is a range of YYYY-MM-DD dates, or null for all periods.
 */
export function PeriodField(props: PeriodFieldProps) {
  const liro = useLiro()
  const { messages, format } = liro
  const rules: PeriodRules = {
    today: liro.today,
    yearStartMonth: props.yearStartMonth ?? 1,
    weekStartsOn: liro.weekStartsOn,
    quarterBasis: props.quarterBasis ?? 'business',
  }
  const presets = props.presets ?? PERIOD_PRESETS
  const [inner, setInner] = useState(props.defaultValue ?? null)
  const value = props.value === undefined ? inner : props.value
  const { open, setOpen, openings } = useCalendarOpen()
  // The first day picked in the calendar since it opened; the second applies the range.
  const [picked, setPicked] = useState<string | null>(null)
  const textId = `${useId()}-text`

  const choose = (next: DateRange | null) => {
    setInner(next)
    props.onChange?.(next)
    setOpen(false)
  }
  const start = value?.start ?? null
  const end = value?.end ?? null
  const text = describePeriod(value, rules, format, messages)
  const active = matchingPreset(value, presets, rules)

  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        if (control.readOnly) {
          return (
            <Input
              {...controlAttributes(control, messages['field.readOnly'])}
              value={text}
              className={READ_ONLY}
            />
          )
        }
        return (
          <>
            <Popover
              open={open}
              onOpenChange={(next) => {
                if (next) setPicked(null)
                setOpen(next)
              }}
            >
              <PopoverTrigger asChild>
                <ButtonPrimitive
                  id={control.id}
                  family="neutral"
                  emphasis="secondary"
                  aria-labelledby={`${control.labelId} ${textId}`}
                  aria-describedby={control.describedBy}
                  disabled={control.disabled}
                  className={cn(
                    'max-w-full pe-3 font-regular',
                    // A button cannot be aria-invalid; the error is linked by aria-describedby.
                    control.invalid && 'border-status-danger-fg',
                  )}
                >
                  <CalendarDays aria-hidden="true" className="size-3.75 shrink-0" />
                  <span id={textId} className="truncate">
                    {text}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
                </ButtonPrimitive>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                aria-labelledby={control.labelId}
                className="flex w-auto flex-col p-0 shadow-md sm:flex-row"
              >
                <div className="flex w-full flex-col gap-0.5 border-0 border-b border-solid border-subtle p-1 sm:w-[190px] sm:border-e sm:border-b-0">
                  {presets.map((preset) => {
                    const isActive = preset === active
                    return (
                      <ButtonPrimitive
                        key={preset}
                        family={isActive ? 'primary' : 'neutral'}
                        emphasis={isActive ? 'secondary' : 'menu'}
                        aria-pressed={isActive}
                        className={cn(PRESET, isActive ? 'font-semibold' : 'font-regular')}
                        onClick={() => {
                          choose(presetRange(preset, rules))
                        }}
                      >
                        {messages[PRESET_MESSAGE[preset]]}
                      </ButtonPrimitive>
                    )
                  })}
                  {props.clearable === true && (
                    <>
                      <div
                        role="separator"
                        className="my-1 border-0 border-t border-solid border-subtle"
                      />
                      <ButtonPrimitive
                        family="neutral"
                        emphasis="menu"
                        className={cn(PRESET, 'font-regular')}
                        onClick={() => {
                          choose(null)
                        }}
                      >
                        {messages['period.clear']}
                      </ButtonPrimitive>
                    </>
                  )}
                </div>
                <div className="flex flex-col px-4 py-3">
                  <p className="m-0 px-3 py-[5px] text-xs font-semibold text-secondary">
                    {messages['period.customRange']}
                  </p>
                  <Calendar
                    key={openings}
                    mode="range"
                    labels={{
                      previousMonth: messages['calendar.previousMonth'],
                      nextMonth: messages['calendar.nextMonth'],
                      navigation: messages['calendar.navigation'],
                    }}
                    defaultMonth={openingMonth(start, liro.today)}
                    selected={
                      picked === null
                        ? {
                            from: start === null ? undefined : toLocalDate(start),
                            to: end === null ? undefined : toLocalDate(end),
                          }
                        : { from: toLocalDate(picked), to: undefined }
                    }
                    onSelect={(_range, day: Date) => {
                      const iso = fromLocalDate(day)
                      if (picked === null) {
                        setPicked(iso)
                        return
                      }
                      choose(
                        iso < picked ? { start: iso, end: picked } : { start: picked, end: iso },
                      )
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
            {props.startName !== undefined && (
              <input type="hidden" name={props.startName} value={start ?? ''} />
            )}
            {props.endName !== undefined && (
              <input type="hidden" name={props.endName} value={end ?? ''} />
            )}
          </>
        )
      }}
    </Field>
  )
}

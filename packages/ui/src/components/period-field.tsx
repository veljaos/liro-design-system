import { CalendarDays, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { Calendar } from '../primitives/calendar'
import { AUTO_DIRECTION, READ_ONLY, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { DialogBody, DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
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
import { usePhone } from './use-phone'

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
 * padding 5px 12px).
 *
 * On a phone (P5.28 item 1) the popover would run off the screen: the field opens a sheet on the
 * screen's bottom edge instead, titled by the field's label, with the presets first — two columns
 * of the same buttons — then "Custom range" with one month across the sheet's full width.
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
  /** Shows the calendar from the start (asked for at once). Closed by default. */
  defaultOpen?: boolean
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
const PRESET = 'min-h-control-sm w-full justify-start px-3.5 text-start text-xs'

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
  const { open, setOpen, openings } = useCalendarOpen(props.defaultOpen)
  // The first day picked in the calendar since it opened; the second applies the range.
  const [picked, setPicked] = useState<string | null>(null)
  const textId = `${useId()}-text`
  const phone = usePhone()

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
              dir={AUTO_DIRECTION.dir}
              className={cn(AUTO_DIRECTION.className, READ_ONLY)}
            />
          )
        }
        const openChange = (next: boolean) => {
          if (next) setPicked(null)
          setOpen(next)
        }
        const trigger = (
          <ButtonPrimitive
            id={control.id}
            family="neutral"
            emphasis="secondary"
            aria-labelledby={`${control.labelId} ${textId}`}
            aria-describedby={control.describedBy}
            className={cn(
              'max-w-full pe-3 font-regular',
              // A button cannot be aria-invalid; the error is linked by aria-describedby.
              control.invalid && 'border-status-danger-fg',
            )}
          >
            <CalendarDays aria-hidden="true" className="size-3.75 shrink-0" />
            {/* 2px of room at the end, taken back by the margin: Chromium on Linux draws
                hinted text wider than it lays it out, and `truncate` cut the last digit. */}
            <span id={textId} className={cn('-me-0.5 truncate pe-0.5', TEXT_DIRECTION)}>
              {text}
            </span>
            <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
          </ButtonPrimitive>
        )
        /** The presets and "Clear" in `className`'s layout. */
        const presetButtons = (className: string) => (
          <div className={className}>
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
                  <span className={TEXT_DIRECTION}>{messages[PRESET_MESSAGE[preset]]}</span>
                </ButtonPrimitive>
              )
            })}
            {props.clearable === true && (
              <>
                <div
                  role="separator"
                  className="col-span-full my-1 border-0 border-t border-solid border-subtle"
                />
                <ButtonPrimitive
                  family="neutral"
                  emphasis="menu"
                  className={cn(PRESET, 'font-regular')}
                  onClick={() => {
                    choose(null)
                  }}
                >
                  <span className={TEXT_DIRECTION}>{messages['period.clear']}</span>
                </ButtonPrimitive>
              </>
            )}
          </div>
        )
        /** "Custom range" and the month; `fill`: across the sheet's width (phones). */
        const calendar = (fill: boolean) => (
          <>
            <p
              className={cn(
                'm-0 px-3 py-[5px] text-xs font-semibold text-secondary',
                TEXT_DIRECTION,
              )}
            >
              {messages['period.customRange']}
            </p>
            <Calendar
              key={openings}
              fullWidth={fill}
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
                choose(iso < picked ? { start: iso, end: picked } : { start: picked, end: iso })
              }}
            />
          </>
        )
        return (
          <>
            {phone ? (
              <Sheet open={open} onOpenChange={openChange}>
                <SheetTrigger asChild>{trigger}</SheetTrigger>
                <SheetContent
                  side="bottom"
                  aria-describedby={undefined}
                  className="h-auto max-h-[calc(100%-40px)] rounded-t-lg pb-[env(safe-area-inset-bottom)]"
                >
                  <DialogHeader>
                    <DialogTitle>{props.label}</DialogTitle>
                    <DialogCloseButton label={messages['dialog.close']} />
                  </DialogHeader>
                  <DialogBody className="gap-3">
                    {presetButtons('grid grid-cols-2 gap-1')}
                    {calendar(true)}
                  </DialogBody>
                </SheetContent>
              </Sheet>
            ) : (
              <Popover open={open} onOpenChange={openChange}>
                <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                <PopoverContent
                  align="start"
                  aria-labelledby={control.labelId}
                  className="flex w-auto flex-row p-0 shadow-md"
                >
                  {presetButtons(
                    'flex w-[190px] flex-col gap-0.5 border-0 border-e border-solid border-subtle p-1',
                  )}
                  <div className="flex flex-col px-4 py-3">{calendar(false)}</div>
                </PopoverContent>
              </Popover>
            )}
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

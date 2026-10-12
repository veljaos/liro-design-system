import { OctagonAlert, TriangleAlert } from 'lucide-react'
import { TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import type { LiroFormat } from '../provider/format'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import { crossesMidnight, hoursAndMinutes, shiftSpan } from './shift-logic'

/*
 * Parts shared by ShiftPlanner, MyShifts and ShiftSwapDialog (P5.24 b). Internal: not exported
 * from the package.
 */

/** A shift template, from the application: a name, its clock times and a short mark. */
export interface ShiftTemplate {
  id: string
  /** The template's name ("Early"), from the application. */
  label: string
  /** HH:mm. */
  start: string
  /** HH:mm. An end not after the start crosses midnight: "22:00–06:00 (+1)". */
  end: string
  /** A short mark for the grid's cells ("E", "07–15"), from the application. */
  short: string
  /**
   * The key that assigns it in the planner (one character, compared without case). Default: its
   * position in `templates`, 1 … 9.
   */
  key?: string
  /**
   * Tells templates apart; never blue (D17) and never warning or danger, which say "conflict".
   * Default neutral.
   */
  tone?: ShiftTemplateTone
}

/** The tones a template may take. */
export type ShiftTemplateTone = 'neutral' | 'premium' | 'success'

/** A template's tone as a chip: the tone's bg, fg and border (every class written out). */
export const TEMPLATE_TONE: Record<ShiftTemplateTone, string> = {
  neutral: 'border-status-neutral-border bg-status-neutral-bg text-status-neutral-fg',
  premium: 'border-status-premium-border bg-status-premium-bg text-status-premium-fg',
  success: 'border-status-success-border bg-status-success-bg text-status-success-fg',
}

/** "07:00" as the locale writes a clock time; unreadable text is returned as is. */
export function clockText(format: Pick<LiroFormat, 'time'>, clock: string): string {
  return /^\d{1,2}:\d{2}$/.test(clock) ? format.time(`2000-01-01T${clock.padStart(5, '0')}`) : clock
}

/** A template's times as shown ("22:00–06:00 (+1)") and as spoken ("… the next day"). */
export function timeTexts(
  format: Pick<LiroFormat, 'time'>,
  messages: Pick<LiroMessages, 'shifts.nextDayMark' | 'shifts.timeRange'>,
  start: string,
  end: string,
): { shown: string; spoken: string } {
  const startText = clockText(format, start)
  const endText = clockText(format, end)
  const crosses = crossesMidnight(start, end)
  return {
    shown: `${startText}–${endText}${crosses ? ` ${messages['shifts.nextDayMark']}` : ''}`,
    spoken: messages['shifts.timeRange'](startText, endText, crosses),
  }
}

/** A template's length in words ("8 h", "7 h 30 min"), display only; null when unreadable. */
export function durationText(
  format: Pick<LiroFormat, 'number'>,
  messages: Pick<LiroMessages, 'shifts.duration'>,
  start: string,
  end: string,
): string | null {
  const span = shiftSpan(start, end)
  if (span === null) return null
  const { hours, minutes } = hoursAndMinutes(span.minutes)
  return messages['shifts.duration'](
    hours,
    format.number(String(hours)),
    minutes,
    format.number(String(minutes)),
  )
}

/**
 * A shift's times: shown as "22:00–06:00 (+1)" and read as "22:00 to 06:00 the next day". Its
 * direction from its own content.
 */
export function ShiftTime({
  start,
  end,
  className,
}: {
  start: string
  end: string
  className?: string
}) {
  const { format, messages } = useLiro()
  const texts = timeTexts(format, messages, start, end)
  return (
    <span className={cn('tabular-nums', className)}>
      <span aria-hidden="true" className={TEXT_ISOLATE}>
        {texts.shown}
      </span>
      <span className="sr-only">{texts.spoken}</span>
    </span>
  )
}

/** A conflict's icon by its tone: a triangle for a warning, an octagon for a problem. */
export function ConflictIcon({
  tone,
  className,
}: {
  tone: 'warning' | 'danger'
  className?: string
}) {
  const Icon = tone === 'danger' ? OctagonAlert : TriangleAlert
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        'shrink-0',
        tone === 'danger' ? 'text-status-danger-fg' : 'text-status-warning-fg',
        className,
      )}
    />
  )
}

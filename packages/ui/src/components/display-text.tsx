import type { ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/tooltip'
import { useLiro } from '../provider/liro-provider'
import { StatusBadge } from './status-badge'

/*
 * DateText, DateRangeText, DueDate, NumberText and MoneyText (BUILD-PLAN P2.8), the previous
 * Design System's, carried over (owner's decision, 2026-09-28, docs/decisions.md "Display"):
 * tabular digits; an empty value is "—" (Appendix B.5) in text.secondary; values formatted only
 * through the provider's `format` (never here). Numbers and amounts are isolated (<bdi>), so a
 * minus sign or a currency never moves in right-to-left text (docs/decisions.md, Provider).
 *
 * DueDate compares with the provider's `today` (the tenant's date, not the device's):
 * settled → success "Settled"; overdue → danger, the number of days in the badge's own text (a
 * deliberate change: the old system hid it in the tooltip); due today → warning "Due today";
 * due within `warningDays` (default 5) → warning "Due in N days"; otherwise the plain date. The
 * badges carry the due date in a tooltip (300ms), on a plain button so the keyboard reaches it.
 */

/** The empty value: an em dash, never a hyphen (a hyphen reads as a minus sign). */
function Empty() {
  return <span className="text-secondary">—</span>
}

/** Whole days from `from` to `to`, both YYYY-MM-DD; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const day = (iso: string) => {
    const [year = 0, month = 1, date = 1] = iso.split('-').map(Number)
    return Date.UTC(year, month - 1, date) / 86_400_000
  }
  return Math.round(day(to) - day(from))
}

/** A tooltip on a focusable element (the badge of a DueDate, a DateText). */
function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <TooltipProvider>
      <TooltipRoot>
        {/* A button, so the keyboard reaches the tooltip as the pointer does; it does nothing. */}
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(BUTTON_RESET, 'cursor-default rounded-xs text-inherit', FOCUS_RING)}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export interface DateTextProps {
  /** YYYY-MM-DD, or empty. */
  value?: string | null
  /** A tooltip with the weekday and the date in words (`format.dateLong`). */
  withWeekday?: boolean
  /** In the secondary text colour, for dates that matter less. */
  dimmed?: boolean
  className?: string
}

/** A date written in the locale's form, with tabular digits. */
export function DateText({ value, withWeekday = false, dimmed = false, className }: DateTextProps) {
  const { format } = useLiro()
  if (value === undefined || value === null || value === '') return <Empty />
  const text = (
    <time
      dateTime={value}
      className={cn('tabular-nums', dimmed ? 'text-secondary' : 'text-inherit', className)}
    >
      {format.date(value)}
    </time>
  )
  return withWeekday ? <Hint label={format.dateLong(value)}>{text}</Hint> : text
}

export interface DateRangeTextProps {
  /** YYYY-MM-DD, or empty. */
  from?: string | null
  /** YYYY-MM-DD, or empty. */
  to?: string | null
  className?: string
}

/** Two dates as "from – to", with an en dash. */
export function DateRangeText({ from, to, className }: DateRangeTextProps) {
  return (
    <span className={cn('whitespace-nowrap', className)}>
      <DateText value={from ?? null} /> – <DateText value={to ?? null} />
    </span>
  )
}

export interface DueDateProps {
  /** The due date, YYYY-MM-DD. */
  value?: string | null
  /** Paid or otherwise closed: shows "Settled". */
  settled?: boolean
  /** Days before the due date from which it warns. Default: 5. */
  warningDays?: number
}

/** The state of a due date against today: what DueDate shows. */
export function dueState(
  value: string,
  today: string,
  settled: boolean,
  warningDays: number,
): { kind: 'settled' | 'overdue' | 'today' | 'soon' | 'later'; days: number } {
  const days = daysBetween(today, value)
  if (settled) return { kind: 'settled', days }
  if (days < 0) return { kind: 'overdue', days: -days }
  if (days === 0) return { kind: 'today', days }
  if (days <= warningDays) return { kind: 'soon', days }
  return { kind: 'later', days }
}

/**
 * When something is due, measured from the provider's `today`: settled, overdue (with the days),
 * due today, due soon, or just the date.
 */
export function DueDate({ value, settled = false, warningDays = 5 }: DueDateProps) {
  const { messages, format, today } = useLiro()
  if (value === undefined || value === null || value === '') return <Empty />
  const state = dueState(value, today, settled, warningDays)
  const date = format.date(value)
  switch (state.kind) {
    case 'settled':
      return <StatusBadge tone="success" label={messages['due.settled']} />
    case 'overdue':
      return (
        <Hint label={date}>
          <StatusBadge tone="danger" label={messages['due.overdue'](state.days)} />
        </Hint>
      )
    case 'today':
      return (
        <Hint label={date}>
          <StatusBadge tone="warning" label={messages['due.today']} />
        </Hint>
      )
    case 'soon':
      return (
        <Hint label={date}>
          <StatusBadge tone="warning" label={messages['due.inDays'](state.days)} />
        </Hint>
      )
    case 'later':
      return <DateText value={value} />
  }
}

export interface NumberTextProps {
  /** A decimal string such as "1234.5", or empty. Never a JavaScript number. */
  value?: string | null
  /** Zeros added up to this many decimals; never rounded. */
  decimals?: number
  className?: string
}

/** A number written through the provider's `format.number`, with tabular digits. */
export function NumberText({ value, decimals, className }: NumberTextProps) {
  const { format } = useLiro()
  if (value === undefined || value === null || value === '') return <Empty />
  return (
    <bdi className={cn('tabular-nums', className)}>
      {format.number(value, decimals === undefined ? {} : { decimals })}
    </bdi>
  )
}

export interface MoneyTextProps extends NumberTextProps {
  /** The currency code or sign, from the application. */
  currency: string
}

/**
 * An amount written through the provider's `format.money`: the currency on the locale's side,
 * joined by a no-break space, with the provider's money decimals unless `decimals` is given.
 */
export function MoneyText({ value, currency, decimals, className }: MoneyTextProps) {
  const { format } = useLiro()
  if (value === undefined || value === null || value === '') return <Empty />
  return (
    <bdi className={cn('tabular-nums whitespace-nowrap', className)}>
      {format.money(value, currency, decimals === undefined ? {} : { decimals })}
    </bdi>
  )
}

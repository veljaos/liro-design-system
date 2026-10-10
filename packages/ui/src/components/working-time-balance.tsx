import { useId, type ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { DataTable, type DataTableColumn } from './data-table'
import { DateRangeText } from './display-text'
import { ConflictIcon } from './shift-parts'

/*
 * WorkingTimeBalance (BUILD-PLAN P5.24 d, working-time redistribution): a plan that spreads the
 * hours of a period unevenly over its weeks, and per person the balance of planned against worked
 * hours. Everything is the application's: the weeks' hours, each person's planned, worked and
 * difference, the running average per week, the reference average and the warnings — the
 * component computes nothing and encodes no legal limit (its stories use illustrative values,
 * labelled as such). A null value shows "—", never 0.
 * - The plan's header: the period, the reference average with the application's label, and the
 *   weeks with their planned hours, start-aligned and wrapping.
 * - The table (DataTable): the person, planned, worked, difference (signed through `format`, "+4
 *   h"), average per week, and the warnings, each with its icon (a triangle, an octagon) and its
 *   words — never colour alone. On phones, DataTable's cards.
 */

/** One week of the plan, from the application. */
export interface WorkingTimeWeek {
  /** The week's first and last day, YYYY-MM-DD. */
  start: string
  end: string
  /** Planned hours, a decimal string; null shows "—". */
  hours: string | null
}

/** The plan of a period, from the application. */
export interface WorkingTimePlan {
  /** The period's first and last day, YYYY-MM-DD. */
  start: string
  end: string
  weeks: readonly WorkingTimeWeek[]
  /** The average the plan is held to, with the application's label ("Reference average, illustrative"). */
  reference?: { label: string; hours: string | null }
}

/** A warning about a person's balance, from the application. */
export interface WorkingTimeWarning {
  tone: 'warning' | 'danger'
  /** In words ("Average above the illustrative limit of 48 h"). */
  text: string
}

/** One person's balance, from the application: decimal strings of hours, null for "—". */
export interface WorkingTimeRow {
  id: string
  name: string
  /** A line under the name ("Cashier"). */
  subtitle?: string
  planned: string | null
  worked: string | null
  /** Worked minus planned, computed by the application; shown signed. */
  difference: string | null
  /** The running average per week so far. */
  average: string | null
  warnings?: readonly WorkingTimeWarning[]
}

export interface WorkingTimeBalanceProps {
  /** Names the table, from the application ("Balance, Dom zdravlja"). */
  label: string
  plan: WorkingTimePlan
  rows: readonly WorkingTimeRow[]
  /** The plan's heading, from the application; without it the header has none. */
  title?: string
  /** The heading's level. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** The table's first load: skeleton rows. */
  loading?: boolean
  /** 'auto' (default): cards below 48em. 'table' or 'cards' forces one (DataTable). */
  layout?: 'auto' | 'table' | 'cards'
  className?: string
}

/** The plan of a period and each person's balance of planned against worked hours. */
export function WorkingTimeBalance(props: WorkingTimeBalanceProps) {
  const { messages, format } = useLiro()
  const weeksId = useId()
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'
  const hours = (value: string | null, sign: 'auto' | 'always' = 'auto') =>
    value === null ? '—' : messages['shifts.hoursValue'](format.number(value, { sign }))
  const amount = (value: string | null, sign: 'auto' | 'always' = 'auto'): ReactNode => (
    <span className="whitespace-nowrap tabular-nums">{hours(value, sign)}</span>
  )

  const columns: DataTableColumn<WorkingTimeRow>[] = [
    {
      id: 'person',
      header: messages['workingTime.person'],
      cell: (row) => (
        <span className="flex flex-col">
          <span className={cn('font-semibold', TEXT_DIRECTION)}>{row.name}</span>
          {row.subtitle !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{row.subtitle}</span>
          )}
        </span>
      ),
    },
    {
      id: 'planned',
      header: messages['workingTime.planned'],
      align: 'end',
      numeric: true,
      cell: (row) => amount(row.planned),
    },
    {
      id: 'worked',
      header: messages['workingTime.worked'],
      align: 'end',
      numeric: true,
      cell: (row) => amount(row.worked),
    },
    {
      id: 'difference',
      header: messages['workingTime.difference'],
      align: 'end',
      numeric: true,
      cell: (row) => amount(row.difference, 'always'),
    },
    {
      id: 'average',
      header: messages['workingTime.average'],
      align: 'end',
      numeric: true,
      cell: (row) => amount(row.average),
    },
    {
      id: 'warnings',
      header: messages['workingTime.warnings'],
      minWidth: 200,
      cell: (row) =>
        row.warnings === undefined || row.warnings.length === 0 ? (
          <>
            <span aria-hidden="true" className="text-tertiary">
              —
            </span>
            <span className="sr-only">{messages['workingTime.noWarnings']}</span>
          </>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {row.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-1.5 text-sm">
                <ConflictIcon tone={warning.tone} className="mt-0.5 size-4" />
                <span className={TEXT_DIRECTION}>
                  <span className="sr-only">
                    {warning.tone === 'danger'
                      ? messages['shifts.conflictDanger']('')
                      : messages['shifts.conflictWarning']('')}
                  </span>
                  {warning.text}
                </span>
              </li>
            ))}
          </ul>
        ),
    },
  ]

  return (
    <div
      data-slot="working-time-balance"
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      <section
        {...(props.title === undefined ? { 'aria-label': props.label } : {})}
        className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4"
      >
        {props.title !== undefined && (
          <Heading className={cn('m-0 text-md font-semibold text-primary', TEXT_DIRECTION)}>
            {props.title}
          </Heading>
        )}
        <dl className="m-0 flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-secondary">{messages['workingTime.period']}</dt>
            <dd className="m-0 text-sm font-semibold text-primary">
              <DateRangeText from={props.plan.start} to={props.plan.end} />
            </dd>
          </div>
          {props.plan.reference !== undefined && (
            <div className="flex flex-col gap-0.5">
              <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                {props.plan.reference.label}
              </dt>
              <dd className="m-0 text-sm font-semibold text-primary tabular-nums">
                {hours(props.plan.reference.hours)}
              </dd>
            </div>
          )}
        </dl>
        <div className="flex flex-col gap-1.5">
          <span id={weeksId} className="text-xs font-semibold text-secondary">
            {messages['workingTime.weeks']}
          </span>
          <ol
            aria-labelledby={weeksId}
            className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 p-0"
          >
            {props.plan.weeks.map((week, index) => (
              <li
                key={week.start}
                className="box-border flex flex-col gap-0.5 rounded-md border border-solid border-subtle bg-surface-sunken px-2.5 py-1.5"
              >
                <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className={cn('text-xs font-semibold text-secondary', TEXT_ISOLATE)}>
                    {messages['workingTime.week'](index + 1, format.number(String(index + 1)))}
                  </span>
                  <span className="text-sm font-semibold text-primary tabular-nums">
                    {hours(week.hours)}
                  </span>
                </span>
                <span className="text-xs text-secondary">
                  <DateRangeText from={week.start} to={week.end} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <DataTable
        label={props.label}
        columns={columns}
        rows={props.rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        layout={props.layout ?? 'auto'}
        {...(props.loading === true ? { loading: true } : {})}
        mobile={{
          title: (row) => row.name,
          subtitle: (row) => row.subtitle,
          details: ['planned', 'worked', 'difference', 'average', 'warnings'],
        }}
      />
    </div>
  )
}

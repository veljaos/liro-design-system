import type { RowData } from '@tanstack/react-table'
import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { DataTable, type DataTableColumn, type DataTableMobile } from '../components/data-table'
import type { MenuEntry } from '../components/dropdown-menu'
import type { EmptyAction } from '../components/empty-state'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'
import { registerMenu } from './register-logic'

/*
 * RegisterPage (BUILD-PLAN P5.20): a chronological register for a period — VAT records, the
 * work-injury register, the safety-training register. Its rules:
 * - **Entries are never deleted.** A correction is a new entry that refers to the one it
 *   corrects: the new one says "Corrects no. 14", the corrected one "Corrected by no. 27" (a
 *   neutral badge: its state), both in the Correction column the page adds after the
 *   application's columns. The application offers "Correct" in a row's menu; the page offers no
 *   delete.
 * - **Locked periods** are marked where the list starts — a lock and words ("January–June 2026 is
 *   locked"), the reason and who locked it, from the application — and on each of their entries
 *   (a lock before the number, "Locked" for assistive technology); a locked entry is read-only:
 *   its menu holds one unavailable item that says why ("Locked period: entries cannot be
 *   changed"), instead of its actions.
 * - The period is chosen in the card's first row (the application's PeriodField or MonthField);
 *   export and print are the page's actions (the application's buttons, the main one last).
 * - Long registers stay responsive: `virtualize` draws only the rows in view (DataTable's 44px
 *   rows inside `maxHeight`, default 70% of the screen's height); measured with 5,000 entries
 *   (docs/decisions.md "Liro patterns (Phase 5 part 1)").
 * Layout: the page header (visible title: no module tab names a register), then ONE card (as
 * ListPage): the period row, the locks, the table to the card's edges, count and paging under it.
 */

/** What the page needs to know about an entry. */
export interface RegisterEntry {
  /** The entry's number in the register, as written ("27"). */
  number: string
  /** The number of the entry this one corrects. */
  corrects?: string
  /** The number of the entry that corrects this one. */
  correctedBy?: string
  /** The entry is in a locked period: read-only. */
  locked?: boolean
}

/** A locked period, from the application. */
export interface RegisterLock {
  key: string
  /** The period, as the application names it ("January–June 2026"). */
  period: string
  /** Why it is locked ("Reported to the labour inspection"). */
  reason: string
  /** Who locked it and when, in the application's words. */
  detail?: string
}

export interface RegisterPageProps<Row extends RowData> {
  /** The register's name: the page's visible h1 ("Work-injury register 2026"). */
  title: string
  /** A line under the title (the company, the legal basis as the application words it). */
  subtitle?: ReactNode
  /** The back button: the list the register belongs to. */
  back?: PageBack
  /** After the title: a StatusBadge. */
  status?: ReactNode
  /** The page's actions (Print, Export, New entry), the main one last. */
  actions?: ReactNode
  /** The period: the application's PeriodField or MonthField, in the card's first row. */
  period?: ReactNode
  /** Other controls of the first row, at its end (a search, a filter). */
  tools?: ReactNode
  /** The locked periods. */
  locks?: readonly RegisterLock[]
  /** The application's columns; the page adds the number before them and the Correction after. */
  columns: readonly DataTableColumn<Row>[]
  /** The entries, in the register's (chronological) order. */
  rows: readonly Row[]
  getRowId: (row: Row) => string
  getRowLabel: (row: Row) => string
  /** The register facts of an entry: its number, its corrections, its lock. */
  entry: (row: Row) => RegisterEntry
  /** A row's actions ("Correct entry", "Open"); a locked entry's menu says why it has none. */
  rowActions?: (row: Row) => readonly MenuEntry[]
  /** Pressing a row (opens the entry). */
  onRowClick?: (row: Row) => void
  count?: number
  countIsExact?: boolean
  hasPrevious?: boolean
  hasNext?: boolean
  onPrevious?: () => void
  onNext?: () => void
  loading?: boolean
  /** The first step of an empty register ("New entry"). */
  emptyAction?: EmptyAction
  /** Draw only the rows in view (thousands of entries). */
  virtualize?: boolean
  /** The height the table scrolls in when virtualized. Default "70dvh". */
  maxHeight?: string
  /** The card of an entry on a phone; the number and the correction are added to its details. */
  mobile?: DataTableMobile<Row>
  /** 'phone' forces the phone layout; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const NUMBER = '__number'
const CORRECTION = '__correction'

/** A chronological register: entries corrected, never deleted; locked periods marked. */
export function RegisterPage<Row extends RowData>(props: RegisterPageProps<Row>) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const { entry } = props
  const columns: DataTableColumn<Row>[] = [
    {
      id: NUMBER,
      header: messages['register.number'],
      label: messages['register.number'],
      numeric: true,
      cell: (row) => {
        const info = entry(row)
        return (
          <span className="inline-flex items-center gap-1.5">
            {info.locked === true && (
              <>
                <Lock aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
                <span className="sr-only">{messages['register.locked']}</span>
              </>
            )}
            <span dir="ltr">{info.number}</span>
          </span>
        )
      },
    },
    ...props.columns,
    {
      id: CORRECTION,
      header: messages['register.correction'],
      label: messages['register.correction'],
      cell: (row) => {
        const info = entry(row)
        return (
          <span className="inline-flex flex-wrap items-center gap-2">
            {info.corrects !== undefined && (
              <span className="text-secondary">{messages['register.corrects'](info.corrects)}</span>
            )}
            {info.correctedBy !== undefined && (
              <StatusBadge
                tone="neutral"
                label={messages['register.correctedBy'](info.correctedBy)}
              />
            )}
          </span>
        )
      },
    },
  ]
  const appColumns = props.columns.map((column) => column.id)
  const mobile: DataTableMobile<Row> = {
    ...props.mobile,
    details: [NUMBER, ...(props.mobile?.details ?? appColumns), CORRECTION],
  }
  const { rowActions } = props
  const virtualize = props.virtualize === true
  return (
    <div
      data-slot="register-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <PageHeader
        title={props.title}
        {...(props.back === undefined ? {} : { back: props.back })}
        {...(props.status === undefined ? {} : { status: props.status })}
        {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
      />
      <section
        aria-label={props.title}
        className="box-border flex min-w-0 flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised"
      >
        {(props.period !== undefined || props.tools !== undefined) && (
          <div className="flex flex-wrap items-end justify-between gap-3 p-4">
            {props.period}
            {props.tools !== undefined && (
              <div className="ms-auto flex flex-wrap items-end gap-3">{props.tools}</div>
            )}
          </div>
        )}
        {props.locks !== undefined && props.locks.length > 0 && (
          <ul
            data-slot="register-locks"
            className="m-0 flex list-none flex-col border-0 border-y border-solid border-default bg-surface-sunken p-0"
          >
            {props.locks.map((lock) => (
              <li
                key={lock.key}
                className="flex items-start gap-2 border-0 border-b border-solid border-subtle px-4 py-3 last:border-b-0"
              >
                <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                <p className="m-0 flex min-w-0 flex-col gap-0.5">
                  <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                    {messages['register.periodLocked'](lock.period)}
                  </span>
                  <span className={cn('text-sm text-primary', TEXT_DIRECTION)}>{lock.reason}</span>
                  {lock.detail !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {lock.detail}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
        <DataTable
          label={props.title}
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={props.rows}
          getRowId={props.getRowId}
          getRowLabel={props.getRowLabel}
          mobile={mobile}
          {...(rowActions === undefined
            ? {}
            : {
                rowActions: (row: Row) =>
                  registerMenu(entry(row), rowActions(row), messages['register.lockedEntry']),
              })}
          {...(props.onRowClick === undefined ? {} : { onRowClick: props.onRowClick })}
          {...(props.count === undefined ? {} : { count: props.count })}
          {...(props.countIsExact === undefined ? {} : { countIsExact: props.countIsExact })}
          {...(props.onNext === undefined
            ? {}
            : {
                hasNext: props.hasNext ?? false,
                hasPrevious: props.hasPrevious ?? false,
                onNext: props.onNext,
                onPrevious: props.onPrevious ?? (() => undefined),
              })}
          {...(props.loading === undefined ? {} : { loading: props.loading })}
          {...(props.emptyAction === undefined ? {} : { emptyAction: props.emptyAction })}
          {...(virtualize ? { virtualize: true, maxHeight: props.maxHeight ?? '70dvh' } : {})}
        />
      </section>
    </div>
  )
}

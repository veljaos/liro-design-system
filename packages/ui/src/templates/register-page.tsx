import type { RowData } from '@tanstack/react-table'
import { Lock } from 'lucide-react'
import { useId, useMemo, useRef, type MouseEvent, type ReactNode } from 'react'
import {
  DataTable,
  type DataTableColumn,
  type DataTableHandle,
  type DataTableMobile,
} from '../components/data-table'
import type { MenuEntry } from '../components/dropdown-menu'
import type { EmptyAction } from '../components/empty-state'
import { RefetchLoader } from '../components/refetch-loader'
import { usePhone } from '../components/use-phone'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'
import { registerMenu } from './register-logic'

/*
 * RegisterPage (BUILD-PLAN P5.20): a chronological register for a period — VAT records, the
 * work-injury register, the safety-training register. Its rules:
 * - **Entries are never deleted.** A correction is a new entry that refers to the one it
 *   corrects: the new one says "Corrects no. 14", the corrected one "Corrected by no. 27", both
 *   in the Correction column the page adds after the application's columns, and both the same
 *   kind of link (P5.23): it scrolls to the other entry — drawing it first in a virtualized
 *   register — and focuses its number. An entry outside the rows shown goes to `onGoToEntry`.
 *   The application offers "Correct" in a row's menu; the page offers no delete.
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
 * The page owns every space in the card (P5.23): the locks band meets the table's header with
 * nothing between them, whatever the application passes; the refetch loader stands at the end of
 * the first row, never in a slot of its own between the locks and the table.
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
  /**
   * A correction link to an entry that is not among `rows` (another page or period): the
   * application shows it. Without it, such a reference is plain text.
   */
  onGoToEntry?: (number: string) => void
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

/** Link colours named for every state (P4.4), as DocumentReferences' links. */
const LINK =
  'inline-flex min-h-6 items-center rounded-sm font-medium whitespace-nowrap text-link no-underline visited:text-link hover:text-link hover:underline active:text-link'

/** A chronological register: entries corrected, never deleted; locked periods marked. */
export function RegisterPage<Row extends RowData>(props: RegisterPageProps<Row>) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const { entry, rows, getRowId, onGoToEntry } = props
  const table = useRef<DataTableHandle>(null)
  // Each entry's number is an anchor the correction links go to (P5.23).
  const anchorBase = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const anchorOf = (number: string) => `${anchorBase}-entry-${number}`
  const shown = useMemo(() => new Set(rows.map((row) => entry(row).number)), [rows, entry])
  const goTo = (event: MouseEvent, number: string) => {
    event.preventDefault()
    const row = rows.find((each) => entry(each).number === number)
    if (row === undefined) {
      onGoToEntry?.(number)
      return
    }
    table.current?.revealRow(getRowId(row))
    // A virtualized row is drawn a frame or two after the scroll: wait for its number.
    let frames = 0
    const focus = () => {
      const target = document.getElementById(anchorOf(number))
      if (target !== null) target.focus()
      else if (frames++ < 30) requestAnimationFrame(focus)
    }
    focus()
  }
  const reference = (text: string, number: string) =>
    shown.has(number) || onGoToEntry !== undefined ? (
      <a
        href={`#${anchorOf(number)}`}
        onClick={(event) => {
          goTo(event, number)
        }}
        className={cn(LINK, FOCUS_RING)}
      >
        {text}
      </a>
    ) : (
      <span className="text-secondary">{text}</span>
    )
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
            <span
              id={anchorOf(info.number)}
              tabIndex={-1}
              dir="ltr"
              // Reached from a correction link: the ring shows where the focus landed.
              className="rounded-sm outline-none focus:outline-2 focus:outline-offset-2 focus:outline-focus"
            >
              {info.number}
            </span>
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
          <span className="inline-flex flex-wrap items-center gap-x-3">
            {info.corrects !== undefined &&
              reference(messages['register.corrects'](info.corrects), info.corrects)}
            {info.correctedBy !== undefined &&
              reference(messages['register.correctedBy'](info.correctedBy), info.correctedBy)}
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
  const loader =
    props.loading === undefined ? null : (
      <span className="flex h-control items-center">
        <RefetchLoader active={props.loading && rows.length > 0} />
      </span>
    )
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
        {(props.period !== undefined || props.tools !== undefined || loader !== null) && (
          <div className="flex flex-wrap items-end justify-between gap-3 p-4">
            {props.period}
            {(props.tools !== undefined || loader !== null) && (
              <div className="ms-auto flex flex-wrap items-end gap-3">
                {props.tools}
                {loader}
              </div>
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
          ref={table}
          label={props.title}
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={getRowId}
          loaderSlot={false}
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

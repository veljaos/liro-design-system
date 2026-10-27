import { Check, CheckCheck, TriangleAlert } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { SwitchField } from './checkbox-field'
import { Skeleton } from './progress'
import { usePhone } from './use-phone'

/*
 * ValueComparison (BUILD-PLAN P5.33): the same things as two sources record them, side by side,
 * the differences marked — our open items beside a partner's, a record beside its copy, a
 * document's fields beside what the other side sent. It compares nothing: which rows differ, and
 * why, is the application's (`differs`, `note`).
 * - Desktop: a table — the row's name (sm medium), the two sources' values (sm, numbers tabular
 *   at the end of their cell), then the result in words: "Same" with a Check in text.secondary,
 *   or "Differs" (or the application's `note`: "Only in their statement") with a TriangleAlert in
 *   status.warning.fg, weight 500. A differing row lies on status.warning.bg — with the icon and
 *   the words, never colour alone. Above it "2 of 5 differ", politely announced as rows change.
 * - Phones (`layout`, default below 48em): one card per row, each value labelled with its
 *   source's name, the result under them.
 * - Two sources, or three (P5.49: a purchase order, its goods receipt and the supplier's invoice
 *   side by side — the three-way match); every row has one value per source.
 * - A value the source does not have is the application's words ("Not in our books"); `null`
 *   shows "—". Loading: three skeleton rows; no rows: `empty` ("Nothing to compare").
 * - Choosing the values to keep (P5.79, merging two records): with `onChoose`, each differing
 *   row's values are radio buttons (one group per row; the arrows move between them), the whole
 *   cell the target; the chosen value is the neutral selection (D17: surface.selected with the
 *   3px border.selected bar, only the radio blue). A row still to choose lies on
 *   status.warning.bg with "Choose the value to keep"; a chosen one says "Chosen". The count
 *   reads "2 of 3 chosen". With `chosen` and no `onChoose` the choices are shown, not changed (a
 *   merge's summary): the kept value carries a check. The application decides what a merge keeps
 *   and checks the choice; the comparison only reports it.
 * - P5.93 (items 18 and 19, the owner's fourth review): **one alignment for every column** — the
 *   values at the start of their cells, figures in tabular digits, so the sources compare at a
 *   glance (start alignment is the rule). **Merging** is simple first: while choosing, only the
 *   differing fields are listed ("Show identical fields" brings back the rest,
 *   `defaultShowIdentical`); one press on a value keeps it, marked "Kept" in words with a check
 *   on the neutral selection; "Keep all from …" (`onChooseAll`) answers every row from one
 *   source at once; a live preview of the merged record (`preview`, `previewTitle`) lists every
 *   field with the value it will keep ("Not chosen yet" until chosen). On a phone every differing
 *   field is a card with its values stacked as large choices (56px). The merge itself — one
 *   confirmation, it cannot be undone — is the application's.
 */

/** The sources' names or values: two, or three (P5.49). */
export type ComparisonValues =
  readonly [ReactNode, ReactNode] | readonly [ReactNode, ReactNode, ReactNode]

export interface ComparisonRow {
  id: string
  /** The thing compared ("ES-2026-0412, invoice of 05.08.2026"). From the application. */
  label: ReactNode
  /** One value per source, in the order of `columns`; null shows "—". */
  values: ComparisonValues
  /** The application says the two differ. */
  differs?: boolean
  /** The result in the application's words ("Only in their statement"), in place of "Differs". */
  note?: ReactNode
  /** The values are figures: tabular, at the end of their cells. */
  numeric?: boolean
}

export interface ValueComparisonProps {
  /** Names the comparison ("Open items at 30.09.2026"). */
  label: string
  /**
   * The sources' names ("Our books", "Their statement"): two, or three ("Order", "Receipt",
   * "Invoice"; P5.49). Each row gives a value for every source.
   */
  columns: ComparisonValues
  rows: readonly ComparisonRow[]
  /** The first column's heading. Default `messages['comparison.item']`. */
  rowHeader?: ReactNode
  /** 'phone' shows cards; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /** The application is gathering the values: three skeleton rows. */
  loading?: boolean
  /** Shown instead of the rows when there are none. Default `messages['comparison.empty']`. */
  empty?: ReactNode
  /**
   * P5.79: the value kept from each differing row, as the index of its source in `columns`
   * (row id → index). With `onChoose` the differing rows are choices; without it, shown.
   */
  chosen?: Readonly<Record<string, number>>
  /** P5.79: the user chose a row's value (the index of its source). */
  onChoose?: (rowId: string, index: number) => void
  /**
   * P5.93: "Keep all from …" — one button per source; the application keeps that source's value
   * in every differing row. Shown while choosing (`onChoose`).
   */
  onChooseAll?: (index: number) => void
  /**
   * P5.93: while choosing (`chosen` or `onChoose`), the identical rows are hidden behind "Show
   * identical fields"; true shows them at first. Default false.
   */
  defaultShowIdentical?: boolean
  /**
   * P5.93: the merged record as it will be, under the comparison (every field with the value it
   * keeps). Default true while choosing with `onChoose`.
   */
  preview?: boolean
  /** The preview's title. Default `messages['comparison.preview']` ("Merged record"). */
  previewTitle?: string
  className?: string
}

/** How many rows the application marks as differing, and how many there are. */
export function valueComparisonCounts(rows: readonly Pick<ComparisonRow, 'differs'>[]): {
  differ: number
  total: number
} {
  return { differ: rows.filter((row) => row.differs === true).length, total: rows.length }
}

/**
 * How many of the rows the application marks as differing have a value chosen (P5.79), and how
 * many differ.
 */
export function chosenCounts(
  rows: readonly Pick<ComparisonRow, 'id' | 'differs'>[],
  chosen: Readonly<Record<string, number>>,
): { chosen: number; total: number } {
  const differing = rows.filter((row) => row.differs === true)
  return {
    chosen: differing.filter((row) => chosen[row.id] !== undefined).length,
    total: differing.length,
  }
}

/** Which rows are listed: while choosing, the identical ones only on request (P5.93). */
export function comparisonRowsShown<R extends Pick<ComparisonRow, 'differs'>>(
  rows: readonly R[],
  choosing: boolean,
  showIdentical: boolean,
): R[] {
  return choosing && !showIdentical ? rows.filter((row) => row.differs === true) : [...rows]
}

/** A field of the merged record: the value it keeps, or `pending` while none is chosen. */
export interface MergedField {
  id: string
  label: ReactNode
  value: ReactNode
  pending: boolean
}

/**
 * The merged record as the choices make it (P5.93): an identical row keeps its value (the
 * first source's: the application says they are the same), a differing row the chosen source's,
 * or nothing yet. Picks values; compares and computes nothing.
 */
export function mergedFields(
  rows: readonly ComparisonRow[],
  chosen: Readonly<Record<string, number>>,
): MergedField[] {
  return rows.map((row) => {
    if (row.differs !== true) {
      return { id: row.id, label: row.label, value: row.values[0], pending: false }
    }
    const index = chosen[row.id]
    return index === undefined
      ? { id: row.id, label: row.label, value: null, pending: true }
      : { id: row.id, label: row.label, value: row.values[index], pending: false }
  })
}

/** The kept value of a merge: the neutral selection with its bar at the start (D17). */
const CHOSEN_CELL =
  "relative bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** A native radio drawn as the system's (RadioGroupItem): 20px, brand.solid with a dot. */
const RADIO = cn(
  'm-0 mt-px size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-solid border-control bg-surface-raised',
  'checked:border-[6px] checked:border-brand-solid checked:bg-on-accent',
  FOCUS_RING,
)

function Value({ value }: { value: ReactNode }) {
  return value === null || value === undefined || value === '' ? '—' : value
}

/** The kept value's mark: a check and "Kept" in words, never the selection's colour alone. */
function KeptMark() {
  const { messages } = useLiro()
  return (
    <span
      data-slot="value-comparison-kept"
      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
    >
      <Check aria-hidden="true" className="size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>{messages['comparison.kept']}</span>
    </span>
  )
}

function Result({
  row,
  choosing,
  chosen,
}: {
  row: ComparisonRow
  choosing: boolean
  chosen: boolean
}) {
  const { messages } = useLiro()
  if (choosing && row.differs === true) {
    return chosen ? (
      <span className="inline-flex items-start gap-1 text-sm text-secondary">
        <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{row.note ?? messages['comparison.chosen']}</span>
      </span>
    ) : (
      <span className="inline-flex items-start gap-1 text-sm font-medium text-status-warning-fg">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{messages['comparison.choose']}</span>
      </span>
    )
  }
  if (row.differs === true) {
    return (
      <span className="inline-flex items-start gap-1 text-sm font-medium text-status-warning-fg">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{row.note ?? messages['comparison.differs']}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-start gap-1 text-sm text-secondary">
      <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>{row.note ?? messages['comparison.same']}</span>
    </span>
  )
}

/** Two or three sources' values side by side, the differences the application found marked in words. */
export function ValueComparison(props: ValueComparisonProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const base = useId()
  const [showIdentical, setShowIdentical] = useState(props.defaultShowIdentical ?? false)
  const choosing = props.chosen !== undefined || props.onChoose !== undefined
  const chosenMap = props.chosen ?? {}
  const counts = valueComparisonCounts(props.rows)
  const choices = chosenCounts(props.rows, chosenMap)
  const identical = counts.total - counts.differ
  const rows = comparisonRowsShown(props.rows, choosing, showIdentical)
  const showPreview = choosing && (props.preview ?? props.onChoose !== undefined)
  const countText = choosing
    ? messages['comparison.chosenCount'](
        choices.chosen,
        format.number(String(choices.chosen)),
        choices.total,
        format.number(String(choices.total)),
      )
    : messages['comparison.count'](
        counts.differ,
        format.number(String(counts.differ)),
        counts.total,
        format.number(String(counts.total)),
      )
  const sources = props.columns
  /** A source's name for "Keep all from …": its text, or its place ("Source 2"). */
  const sourceName = (index: number) => {
    const source = sources[index]
    return typeof source === 'string'
      ? source
      : messages['comparison.source'](format.number(String(index + 1)))
  }
  /** A row the user is to choose in, and whether the value at `index` is the kept one. */
  const choosable = (row: ComparisonRow) => choosing && row.differs === true
  const isChosen = (row: ComparisonRow, index: number) =>
    choosable(row) && chosenMap[row.id] === index
  /** The row's background: a difference still to resolve, in the warning tone. */
  const warns = (row: ComparisonRow) =>
    row.differs === true && (!choosing || chosenMap[row.id] === undefined)
  /** A choice's native radio: one group per row, the arrows move within it. */
  const radio = (row: ComparisonRow, index: number, onChoose: (id: string, at: number) => void) => (
    <input
      type="radio"
      name={`${base}-${row.id}`}
      className={RADIO}
      checked={chosenMap[row.id] === index}
      onChange={() => {
        onChoose(row.id, index)
      }}
    />
  )

  const toolbar =
    choosing &&
    props.loading !== true &&
    props.rows.length > 0 &&
    ((props.onChooseAll !== undefined && props.onChoose !== undefined) || identical > 0) ? (
      <div
        data-slot="value-comparison-tools"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        {props.onChooseAll !== undefined && props.onChoose !== undefined ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((_, index) => (
              <Button
                key={index}
                family="neutral"
                icon={CheckCheck}
                label={messages['comparison.keepAll'](sourceName(index))}
                onClick={() => {
                  props.onChooseAll?.(index)
                }}
              />
            ))}
          </div>
        ) : (
          <span />
        )}
        {identical > 0 && (
          <SwitchField
            label={messages['comparison.showIdentical'](
              identical,
              format.number(String(identical)),
            )}
            checked={showIdentical}
            onChange={setShowIdentical}
          />
        )}
      </div>
    ) : null

  const preview = showPreview && props.loading !== true && props.rows.length > 0 && (
    <section
      aria-label={props.previewTitle ?? messages['comparison.preview']}
      data-slot="value-comparison-preview"
      className="flex min-w-0 flex-col gap-2 rounded-md border border-solid border-default bg-surface-raised p-3"
    >
      <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {props.previewTitle ?? messages['comparison.preview']}
      </p>
      <dl
        className={cn(
          'm-0 grid gap-x-6 gap-y-2',
          phone ? 'grid-cols-1' : 'grid-cols-[minmax(0,auto)_minmax(0,1fr)]',
        )}
      >
        {mergedFields(props.rows, chosenMap).map((field) => {
          const row = props.rows.find((each) => each.id === field.id)
          return (
            <div key={field.id} className="contents">
              <dt className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{field.label}</dt>
              <dd
                className={cn(
                  'm-0 text-sm',
                  field.pending ? 'text-secondary' : 'font-medium text-primary',
                  row?.numeric === true && 'tabular-nums',
                  phone && 'mb-1',
                  TEXT_ISOLATE,
                )}
              >
                {field.pending ? messages['comparison.notChosen'] : <Value value={field.value} />}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )

  return (
    <div
      data-slot="value-comparison"
      className={cn('flex min-w-0 flex-col gap-2 font-sans', props.className)}
    >
      <p role="status" className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
        {props.loading === true || props.rows.length === 0 ? '' : countText}
      </p>
      {toolbar}
      {props.loading === true ? (
        <div
          aria-busy="true"
          aria-label={props.label}
          role="group"
          data-slot="value-comparison-loading"
          className="flex flex-col gap-3 rounded-md border border-solid border-default bg-surface-raised p-3"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : props.rows.length === 0 || rows.length === 0 ? (
        <p
          className={cn(
            'm-0 rounded-md border border-solid border-default bg-surface-raised p-3 text-sm text-secondary',
            TEXT_DIRECTION,
          )}
        >
          {props.rows.length === 0
            ? (props.empty ?? messages['comparison.empty'])
            : messages['comparison.count'](
                0,
                format.number('0'),
                counts.total,
                format.number(String(counts.total)),
              )}
        </p>
      ) : phone ? (
        <ul aria-label={props.label} className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li
              key={row.id}
              data-differs={row.differs === true ? 'true' : undefined}
              className={cn(
                'flex flex-col gap-2 rounded-md border border-solid p-3',
                warns(row)
                  ? 'border-status-warning-border bg-status-warning-bg'
                  : 'border-default bg-surface-raised',
              )}
            >
              <span
                id={`${base}-${row.id}-label`}
                className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}
              >
                {row.label}
              </span>
              {choosable(row) ? (
                // P5.79, P5.93: on a phone the values are the choices, stacked as large targets,
                // each with its source; the kept one says so.
                <div
                  role={props.onChoose === undefined ? undefined : 'radiogroup'}
                  aria-labelledby={`${base}-${row.id}-label`}
                  className="flex flex-col gap-2"
                >
                  {sources.map((source, index) => {
                    const kept = isChosen(row, index)
                    const box = cn(
                      'flex min-h-14 min-w-0 items-start gap-3 rounded-md border border-solid border-default bg-surface-raised px-3 py-3',
                      kept && CHOSEN_CELL,
                    )
                    const text = (
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                          {source}
                        </span>
                        <span
                          className={cn(
                            'text-md text-primary',
                            row.numeric === true && 'tabular-nums',
                            TEXT_ISOLATE,
                          )}
                        >
                          <Value value={row.values[index]} />
                        </span>
                      </span>
                    )
                    const onChoose = props.onChoose
                    return onChoose === undefined ? (
                      <div key={index} data-chosen={kept ? 'true' : undefined} className={box}>
                        {text}
                        {kept && <KeptMark />}
                      </div>
                    ) : (
                      <label
                        key={index}
                        data-chosen={kept ? 'true' : undefined}
                        className={cn(box, 'cursor-pointer')}
                      >
                        {radio(row, index, onChoose)}
                        {text}
                        {kept && <KeptMark />}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <dl
                  className={cn(
                    'm-0 grid gap-x-4 gap-y-1',
                    sources.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
                  )}
                >
                  {sources.map((source, index) => (
                    <div key={index} className="flex min-w-0 flex-col gap-0.5">
                      <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{source}</dt>
                      <dd
                        className={cn(
                          'm-0 text-sm text-primary',
                          row.numeric === true && 'tabular-nums',
                          TEXT_ISOLATE,
                        )}
                      >
                        <Value value={row.values[index]} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <Result row={row} choosing={choosing} chosen={chosenMap[row.id] !== undefined} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-md border border-solid border-default">
          <table className="w-full border-collapse bg-surface-raised text-start">
            <caption className="sr-only">{props.label}</caption>
            <thead>
              <tr className="border-0 border-b border-solid border-default">
                {/* P5.93: every heading at the start, over values at the start. */}
                {[props.rowHeader ?? messages['comparison.item'], ...sources].map(
                  (heading, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="px-3 py-2 text-start text-xs font-medium text-secondary"
                    >
                      <span className={TEXT_ISOLATE}>{heading}</span>
                    </th>
                  ),
                )}
                <th scope="col" className="px-3 py-2 text-start text-xs font-medium text-secondary">
                  <span className={TEXT_ISOLATE}>{messages['comparison.result']}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-differs={row.differs === true ? 'true' : undefined}
                  className={cn(
                    'border-0 border-b border-solid border-subtle last:border-b-0',
                    warns(row) && 'bg-status-warning-bg',
                  )}
                >
                  <th
                    scope="row"
                    className="px-3 py-2 text-start align-top text-sm font-medium text-primary"
                  >
                    <span className={TEXT_DIRECTION}>{row.label}</span>
                  </th>
                  {row.values.map((value, index) => {
                    const kept = isChosen(row, index)
                    const onChoose = props.onChoose
                    const content = (
                      <span className={cn('min-w-0', TEXT_ISOLATE)}>
                        <Value value={value} />
                      </span>
                    )
                    return (
                      <td
                        key={index}
                        data-chosen={kept ? 'true' : undefined}
                        className={cn(
                          'text-start align-top text-sm text-primary',
                          row.numeric === true && 'tabular-nums',
                          choosable(row) && onChoose !== undefined ? 'p-0' : 'px-3 py-2',
                          kept && CHOSEN_CELL,
                        )}
                      >
                        {choosable(row) && onChoose !== undefined ? (
                          // The whole cell is the target: one press keeps the value.
                          <label className="flex min-h-11 w-full cursor-pointer items-start gap-2 px-3 py-2">
                            {radio(row, index, onChoose)}
                            <span className="sr-only">{sources[index]}</span>
                            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                              {content}
                              {kept && <KeptMark />}
                            </span>
                          </label>
                        ) : kept ? (
                          <span className="flex min-w-0 flex-col items-start gap-0.5">
                            {content}
                            <KeptMark />
                          </span>
                        ) : (
                          content
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 align-top">
                    <Result
                      row={row}
                      choosing={choosing}
                      chosen={chosenMap[row.id] !== undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {preview}
    </div>
  )
}

import { ChevronsDownUp, ChevronsUpDown, SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../components/button'
import { DropdownMenu } from '../components/dropdown-menu'
import { EmptyState, ErrorState } from '../components/empty-state'
import { Skeleton } from '../components/progress'
import { Spinner } from '../components/spinner'
import { TAB_ROW_BOX, TAB_ROW_SCROLLER, useTabRow } from '../components/tab-row'
import { usePhone } from '../components/use-phone'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { Sheet, SheetContent } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import { PivotFields, PivotFieldsDone } from './pivot-fields'
import { PivotGrid } from './pivot-grid'
import {
  areaFieldIds,
  hasValues,
  pivotGroupKeys,
  pivotSummaryParts,
  pivotTopGroupKeys,
  pivotViewOf,
  type PivotCellRef,
  type PivotField,
  type PivotLayout,
  type PivotOption,
  type PivotResult,
  type PivotView,
} from './pivot-logic'

/*
 * Pivot: the user chooses the layout — which fields make the rows and the columns, which
 * figures are shown with which aggregation, which values are kept — and the application computes
 * the result for it. The library lays the result out and never adds, averages or counts.
 * - The layout is controlled (`value` / `onChange`): every change in the chooser is reported at
 *   once; the application then passes the new `result` (`loading` while it computes: skeleton
 *   rows the first time, "Updating…" at the toolbar's end with the old figures kept after).
 * - ONE card. Its first row is the
 *   application's suggested views (`views`, the tab look with the blue line under the one the
 *   layout is, start-aligned, the tab row rule); the user starts from one. The second row says in
 *   one line what the grid shows ("Sum of Amount, Count of Orders by Region / Product line,
 *   across Quarter · Only Salesperson: Ana Petrović"), with few buttons at its end: Fields, one
 *   Expand all / Collapse all, the application's actions and Export. Then the grid.
 * - The chooser ("Fields") is closed by default: an end sheet over the page on wider screens, a
 *   full-screen sheet on phones, with the four zones Rows / Columns / Values / Filters and the
 *   unused fields (PivotFields: chips dragged, or moved by their menus). The grid behind it
 *   follows every change. Without `onChange` the layout is fixed: no views, no chooser.
 * - The grid (PivotGrid): the application's column tree as header rows, rows as groups that open
 *   and close (one "Expand all" / "Collapse all"; by default the first level open), subtotals and
 *   totals as given, sticky header and first column; a figure opens its records through
 *   `onDrillDown` (the application shows them, e.g. in a Drawer with a DataTable).
 * - Export reports the format chosen (`exportAction.onExport`): the application makes the file.
 * - States: no value chosen ("Choose a value", with "Choose fields"), loading, error with Try
 *   again, no figures for the layout.
 */

/** Export: the application's formats; one is a button, several a menu. */
export interface PivotExport {
  formats: readonly PivotOption[]
  onExport: (format: string) => void
}

export interface PivotProps {
  /** The analysis's name, from the application: names the region and the grid. */
  label: string
  /** The fields the application offers, in its order. */
  fields: readonly PivotField[]
  /** The layout chosen (controlled). */
  value: PivotLayout
  /** Reports each change of the layout. Without it the layout is fixed and there is no chooser. */
  onChange?: (layout: PivotLayout) => void
  /**
   * The views the application suggests, as the card's first row: a press reports
   * the view's layout through `onChange`; the view the layout is stands chosen.
   */
  views?: readonly PivotView[]
  /** What the application computed for `value`; null or missing before the first result. */
  result?: PivotResult | null
  /** The application is computing: skeleton rows first, then "Updating…" with the old figures. */
  loading?: boolean
  /** The result could not be computed, in the application's words; with `onRetry`, Try again. */
  error?: ReactNode
  onRetry?: () => void
  /** The open groups' row keys (controlled with `onExpandedChange`). */
  expanded?: readonly string[]
  /** Uncontrolled: the groups open at first. Default: the first level. */
  defaultExpanded?: readonly string[]
  onExpandedChange?: (keys: string[]) => void
  /** A figure was opened: the application shows the records behind it. */
  onDrillDown?: (cell: PivotCellRef) => void
  /** Export: the application makes the file in the format chosen. */
  exportAction?: PivotExport
  /** The chooser's sheet is open (controlled with `onFieldsOpenChange`). */
  fieldsOpen?: boolean
  /** Uncontrolled: the chooser's sheet open at first. Default: closed. */
  defaultFieldsOpen?: boolean
  onFieldsOpenChange?: (open: boolean) => void
  /** More actions at the toolbar's end (before Export), from the application. */
  actions?: ReactNode
  /** 'phone' forces the phone layout; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The names of an area's fields, joined. */
function fieldNames(fields: readonly PivotField[], ids: readonly string[]): string {
  return ids
    .flatMap((id) => fields.filter((field) => field.id === id).map((f) => f.label))
    .join(' / ')
}

/** Skeleton rows in the grid's place while the first result is computed. */
function Loading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 p-4">
      {[0, 1, 2, 3, 4].map((row) => (
        <Skeleton key={row} className="h-9 w-full" />
      ))}
    </div>
  )
}

/** The one-line summary of what the grid shows, in the fields' names. */
export function pivotSummaryText(
  messages: LiroMessages,
  countText: (count: number) => string,
  fields: readonly PivotField[],
  layout: PivotLayout,
): string {
  const parts = pivotSummaryParts(fields, layout)
  const values = parts.values
    .map((value) =>
      value.aggregation === undefined
        ? value.field
        : messages['pivot.summaryValue'](value.field, value.aggregation),
    )
    .join(', ')
  const main = messages['pivot.summary'](values, parts.rows.join(' / '), parts.columns.join(' / '))
  if (parts.filters.length === 0) return main
  const filters = parts.filters
    .map((filter) =>
      messages['pivot.summaryFilter'](
        filter.field,
        filter.values.length > 3
          ? messages['pivot.summaryMany'](countText(filter.values.length))
          : filter.values.join(', '),
      ),
    )
    .join('; ')
  return `${main} · ${messages['pivot.summaryFilters'](filters)}`
}

/** The suggested views: the card's first row, tab look, the tab row rule. */
function SuggestedViews({
  views,
  current,
  onChoose,
}: {
  views: readonly PivotView[]
  current: string | undefined
  onChoose: (view: PivotView) => void
}) {
  const { messages } = useLiro()
  const row = useTabRow(current)
  return (
    <div className="border-0 border-b border-solid border-default px-2">
      <div className={cn('-mb-px', TAB_ROW_BOX)}>
        <div
          {...row.scroller}
          role="group"
          aria-label={messages['pivot.views']}
          className={cn('flex', TAB_ROW_SCROLLER)}
        >
          {views.map((view) => {
            const chosen = view.id === current
            return (
              <button
                key={view.id}
                type="button"
                aria-pressed={chosen}
                {...(chosen ? { 'data-active-tab': '' } : {})}
                onClick={() => {
                  onChoose(view)
                }}
                className={cn(
                  'm-0 box-border flex h-10 shrink-0 cursor-pointer items-center rounded-t-md border-0 border-b-2 border-solid border-transparent bg-transparent px-3 font-sans text-sm leading-none whitespace-nowrap text-primary hover:border-default hover:bg-surface-hover',
                  chosen && 'border-brand hover:border-brand',
                  FOCUS_RING,
                  'focus-visible:-outline-offset-2',
                )}
              >
                <span className={TEXT_DIRECTION}>{view.label}</span>
              </button>
            )
          })}
        </div>
        {row.edges}
      </div>
    </div>
  )
}

export function Pivot(props: PivotProps) {
  const { messages, format } = useLiro()
  const viewport = usePhone()
  const phone = props.layout === undefined ? viewport : props.layout === 'phone'
  const chooser = props.onChange !== undefined

  const [ownFieldsOpen, setOwnFieldsOpen] = useState(props.defaultFieldsOpen ?? false)
  const fieldsOpen = chooser && (props.fieldsOpen ?? ownFieldsOpen)
  const setFieldsOpen = (open: boolean) => {
    setOwnFieldsOpen(open)
    props.onFieldsOpenChange?.(open)
  }

  const result = props.result ?? null
  const [ownExpanded, setOwnExpanded] = useState<readonly string[] | null>(
    props.defaultExpanded ?? null,
  )
  const expanded =
    props.expanded ?? ownExpanded ?? (result === null ? [] : pivotTopGroupKeys(result.rows))
  const setExpanded = (keys: string[]) => {
    setOwnExpanded(keys)
    props.onExpandedChange?.(keys)
  }
  const groups = result === null ? [] : pivotGroupKeys(result.rows)
  const allOpen = groups.length > 0 && groups.every((key) => expanded.includes(key))

  const ready = hasValues(props.value)
  const busy = props.loading === true
  const showGrid = ready && props.error === undefined && result !== null && result.rows.length > 0

  const fieldsButton = chooser && (
    <ButtonPrimitive
      family="neutral"
      aria-haspopup="dialog"
      aria-expanded={fieldsOpen}
      onClick={() => {
        setFieldsOpen(!fieldsOpen)
      }}
    >
      <SlidersHorizontal aria-hidden="true" className="size-4" />
      <span className={TEXT_DIRECTION}>{messages['pivot.fields']}</span>
    </ButtonPrimitive>
  )

  const exportAction = props.exportAction
  const exportButton =
    exportAction !== undefined && ready && exportAction.formats.length > 0 ? (
      exportAction.formats.length === 1 ? (
        <Button
          intent="export"
          label={messages['pivot.export']}
          onClick={() => {
            exportAction.onExport(exportAction.formats[0]?.id ?? '')
          }}
        />
      ) : (
        <DropdownMenu
          align="end"
          trigger={<Button intent="export" label={messages['pivot.export']} />}
          entries={exportAction.formats.map((each) => ({
            label: each.label,
            onSelect: () => {
              exportAction.onExport(each.id)
            },
          }))}
        />
      )
    ) : null

  let body: ReactNode
  if (!ready) {
    body = (
      <EmptyState
        compact
        title={messages['pivot.chooseValueTitle']}
        description={messages['pivot.chooseValueDescription']}
        {...(chooser
          ? {
              action: {
                label: messages['pivot.chooseFields'],
                onClick: () => {
                  setFieldsOpen(true)
                },
              },
            }
          : {})}
      />
    )
  } else if (props.error !== undefined) {
    body = (
      <ErrorState
        compact
        description={props.error}
        {...(props.onRetry === undefined
          ? {}
          : { action: { label: messages['pivot.retry'], onClick: props.onRetry } })}
      />
    )
  } else if (result === null) {
    body = <Loading />
  } else if (result.rows.length === 0) {
    body = (
      <EmptyState
        compact
        variant="no-results"
        title={messages['pivot.noDataTitle']}
        description={messages['pivot.noDataDescription']}
      />
    )
  } else {
    body = (
      <PivotGrid
        label={props.label}
        result={result}
        expanded={expanded}
        onToggle={(key) => {
          setExpanded(
            expanded.includes(key) ? expanded.filter((each) => each !== key) : [...expanded, key],
          )
        }}
        onDrillDown={props.onDrillDown}
        rowFields={fieldNames(props.fields, props.value.rows)}
        columnFields={fieldNames(props.fields, areaFieldIds(props.value, 'columns'))}
        busy={busy}
        phone={phone}
      />
    )
  }

  const onChange = props.onChange
  const views = chooser ? (props.views ?? []) : []
  const summary = ready
    ? pivotSummaryText(messages, (count) => format.number(String(count)), props.fields, props.value)
    : null

  return (
    <section
      aria-label={props.label}
      data-slot="pivot"
      className={cn(
        'flex min-w-0 flex-col overflow-clip rounded-lg border border-solid border-default bg-surface-raised font-sans',
        props.className,
      )}
    >
      {views.length > 0 && onChange !== undefined && (
        <SuggestedViews
          views={views}
          current={pivotViewOf(views, props.value)}
          onChoose={(view) => {
            onChange(view.layout)
          }}
        />
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-0 border-b border-solid border-default px-4 py-3">
        {summary !== null && (
          <p
            data-slot="pivot-summary"
            className={cn('m-0 min-w-0 flex-1 basis-60 text-sm text-secondary', TEXT_DIRECTION)}
          >
            {summary}
          </p>
        )}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {busy && result !== null && ready && (
            <Spinner size="sm">{messages['table.updating']}</Spinner>
          )}
          {fieldsButton}
          {showGrid && groups.length > 0 && (
            <Button
              family="neutral"
              icon={allOpen ? ChevronsDownUp : ChevronsUpDown}
              emphasis="menu"
              label={allOpen ? messages['pivot.collapseAll'] : messages['pivot.expandAll']}
              onClick={() => {
                setExpanded(allOpen ? [] : groups)
              }}
            />
          )}
          {props.actions}
          {exportButton}
        </div>
      </div>
      <div aria-busy={busy || undefined} className="min-w-0">
        {body}
      </div>
      {chooser && onChange !== undefined && (
        <Sheet open={fieldsOpen} onOpenChange={setFieldsOpen}>
          <SheetContent
            side={phone ? 'full' : 'end'}
            aria-describedby={undefined}
            data-slot="pivot-fields-sheet"
            className={cn(
              'overflow-hidden',
              phone &&
                'pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]',
            )}
          >
            <DialogHeader
              className={cn(
                'shrink-0 border-0 border-b border-solid border-default',
                phone && 'pt-[max(16px,env(safe-area-inset-top))]',
              )}
            >
              <DialogTitle className="min-w-0 flex-1">{messages['pivot.fields']}</DialogTitle>
              <DialogCloseButton label={messages['dialog.close']} />
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <PivotFields fields={props.fields} layout={props.value} onChange={onChange} />
            </div>
            <div className="flex shrink-0 justify-end border-0 border-t border-solid border-default p-4">
              <PivotFieldsDone
                onClose={() => {
                  setFieldsOpen(false)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </section>
  )
}

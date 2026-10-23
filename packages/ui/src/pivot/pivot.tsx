import { ChevronsDownUp, ChevronsUpDown, SlidersHorizontal } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '../components/button'
import { Drawer } from '../components/dialog'
import { DropdownMenu } from '../components/dropdown-menu'
import { EmptyState, ErrorState } from '../components/empty-state'
import { Skeleton } from '../components/progress'
import { Spinner } from '../components/spinner'
import { usePhone } from '../components/use-phone'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PivotFields, PivotFieldsDone } from './pivot-fields'
import { PivotGrid } from './pivot-grid'
import {
  areaFieldIds,
  hasValues,
  pivotGroupKeys,
  pivotTopGroupKeys,
  type PivotCellRef,
  type PivotField,
  type PivotLayout,
  type PivotOption,
  type PivotResult,
} from './pivot-logic'

/*
 * Pivot (P5.77): the user chooses the layout — which fields make the rows and the columns, which
 * figures are shown with which aggregation, which values are kept — and the application computes
 * the result for it. The library lays the result out and never adds, averages or counts.
 * - The layout is controlled (`value` / `onChange`): every change in the chooser is reported at
 *   once; the application then passes the new `result` (`loading` while it computes: skeleton
 *   rows the first time, "Updating…" at the toolbar's end with the old figures kept after).
 * - The chooser stands in a start column beside the grid on wider screens (hidden and shown by
 *   "Fields", `aria-expanded`), in a full-screen sheet on phones. Without `onChange` the layout
 *   is fixed and there is no chooser.
 * - The grid (PivotGrid): the application's column tree as header rows, rows as groups that open
 *   and close ("Expand all" / "Collapse all"; by default the first level open), subtotals and
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
  /** The chooser is shown (controlled with `onFieldsOpenChange`). */
  fieldsOpen?: boolean
  /** Uncontrolled: the chooser shown at first. Default: on wider screens yes, on phones no. */
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

export function Pivot(props: PivotProps) {
  const { messages } = useLiro()
  const viewport = usePhone()
  const phone = props.layout === undefined ? viewport : props.layout === 'phone'
  const chooser = props.onChange !== undefined
  const fieldsId = useId()

  const [ownFieldsOpen, setOwnFieldsOpen] = useState<boolean | null>(
    props.defaultFieldsOpen ?? null,
  )
  const fieldsOpen = chooser && (props.fieldsOpen ?? ownFieldsOpen ?? !phone)
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

  const ready = hasValues(props.value)
  const busy = props.loading === true
  const showGrid = ready && props.error === undefined && result !== null && result.rows.length > 0

  const fieldsButton = chooser && (
    <ButtonPrimitive
      aria-expanded={fieldsOpen}
      {...(phone || !fieldsOpen ? {} : { 'aria-controls': fieldsId })}
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
          entries={exportAction.formats.map((format) => ({
            label: format.label,
            onSelect: () => {
              exportAction.onExport(format.id)
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

  const fields = chooser && props.onChange !== undefined && (
    <PivotFields fields={props.fields} layout={props.value} onChange={props.onChange} />
  )

  return (
    <section
      aria-label={props.label}
      data-slot="pivot"
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        {fieldsButton}
        {showGrid && groups.length > 0 && (
          <>
            <Button
              family="neutral"
              icon={ChevronsUpDown}
              emphasis="menu"
              label={messages['pivot.expandAll']}
              onClick={() => {
                setExpanded(groups)
              }}
            />
            <Button
              family="neutral"
              icon={ChevronsDownUp}
              emphasis="menu"
              label={messages['pivot.collapseAll']}
              onClick={() => {
                setExpanded([])
              }}
            />
          </>
        )}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {busy && result !== null && ready && (
            <Spinner size="sm">{messages['table.updating']}</Spinner>
          )}
          {props.actions}
          {exportButton}
        </div>
      </div>
      <div className="flex min-w-0 items-start gap-4">
        {fieldsOpen && !phone && (
          <aside
            id={fieldsId}
            aria-label={messages['pivot.fields']}
            className="box-border w-72 shrink-0 rounded-lg border border-solid border-default bg-surface-raised p-4"
          >
            {fields}
          </aside>
        )}
        <div
          aria-busy={busy || undefined}
          className="min-w-0 flex-1 overflow-hidden rounded-lg border border-solid border-default bg-surface-raised"
        >
          {body}
        </div>
      </div>
      {chooser && phone && (
        <Drawer
          open={fieldsOpen}
          onOpenChange={setFieldsOpen}
          title={messages['pivot.fields']}
          actions={
            <PivotFieldsDone
              onClose={() => {
                setFieldsOpen(false)
              }}
            />
          }
        >
          {fields}
        </Drawer>
      )}
    </section>
  )
}

import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleX,
  LocateFixed,
  PencilLine,
  TriangleAlert,
  Undo2,
} from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Alert } from '../components/alert'
import { Button, CompactIconButton } from '../components/button'
import { SwitchField } from '../components/checkbox-field'
import { Drawer } from '../components/dialog'
import { DateText, MoneyText } from '../components/display-text'
import { LifecycleBar, type LifecycleStep } from '../components/lifecycle-bar'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLangAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { STICKY_CLEARANCE, STICKY_HEAD, useStickyHead } from '../components/sticky-head'
import { PageHeader, type PageBack } from './page-header'
import { fieldElementId, ruleCounts, rulesTone, type StatutoryRule } from './register-logic'
import {
  statutoryColumnLabel,
  findStatutoryPlace,
  statutoryGridLines,
  statutoryHeaderRows,
  statutoryRowRules,
  statutoryCellId,
  type StatutoryGridLine,
  type StatutoryCell,
  type StatutoryColumn,
  type StatutoryRow,
  type StatutorySection,
} from './statutory-logic'

export type {
  SourceDocument,
  StatutoryCell,
  StatutoryCellKind,
  StatutoryColumn,
  StatutoryGroup,
  StatutoryItem,
  StatutoryOverride,
  StatutoryRow,
  StatutorySection,
} from './statutory-logic'

/*
 * StatutoryFormPage (BUILD-PLAN P5.20; a form grid since P5.28 item 19, the owner: "as the real
 * form grid, like PP PDV, POPDV and the input-VAT records on ePorezi"). An official form (a VAT
 * return, a statistical report) with its own parts, groups and row numbers ("1.1.5"). Parts,
 * columns, rows, codes, rules and texts come from the Core as data; the page computes nothing.
 * - **Parts** are cards (h2), each collapsible, each a grid with **its own columns**: a group's
 *   header over its sub-columns ("General rate 20%" over "Base" and "VAT"), or one column
 *   ("Amount / value"). Rows sit in **numbered groups** nested to any depth (Part 1 → 1.1 →
 *   1.1.1), each a heading row with a disclosure button; a collapsed group's rows are not drawn.
 *   Long labels wrap; numbers are left to right.
 * - **A cell that does not apply is absent**: blank space, never 0, never a disabled field.
 *   **Three kinds of cells:** `entered` (the application's field; plain text when read-only),
 *   `computed` (read-only text: a total), `source` (read-only, the value a link-coloured button
 *   that opens its documents — e-invoices, customs declarations — in an end Drawer: each a link
 *   with kind, number, state, date and amount, P4.9 rule 7).
 * - **Sticky** (P5.28 item 4, the shared rule of `components/sticky-head.ts`, as AttendanceGrid):
 *   the header rows stay right below the shell's sticky top while the page scrolls (`useStickyHead`
 *   moves them), also when the grid scrolls sideways; a grid wider than its card scrolls sideways
 *   in a named, focusable region with its first column (number and label) sticky at the start.
 *   The page scrolls the rows, never a box of its own.
 * - **The previous period** is a comparison, never a replacement of the columns: "Compare with
 *   August 2026" (a switch, `compare` / `defaultCompare`) shows each cell's previous value under
 *   it, smaller, named for assistive technology.
 * - **Manual overrides:** a computed or source cell with `editor` has a 28px pencil ("Change
 *   1.1.1 · General rate 20% · VAT") that turns it into the application's field with Cancel and
 *   Save; an overridden cell's row carries a neutral "Changed manually" badge with the cell's
 *   column, who and when, the computed value and "Use computed value" (the way back).
 * - **Rule checks** ("3.1.4 must equal 3.1.1 + 3.1.2 + 3.1.3", results from the Core): under
 *   each row they concern (a rule names rows or cells), failed in danger, warnings in warning,
 *   with icon and words; a summary Alert above the parts with "Go to 3.1.4" (a neutral secondary
 *   button, never a link colour on the toned Alert, P5.28 item 7; opening the part
 *   and the groups around it first).
 * - **Phones:** each row is a card (number and label, its checks), each value in it labelled
 *   with its group and column; absent cells are left out.
 * - `readOnly` (a submitted form): entered values as text, no pencils, no way back; the
 *   drill-down stays. Print and export are the application's actions in the header.
 */

export interface StatutoryFormPageProps {
  /** The form's name and period: the page's visible h1 ("VAT return, September 2026"). */
  title: string
  subtitle?: ReactNode
  back?: PageBack
  /** After the title: a StatusBadge. */
  status?: ReactNode
  /** Print, Export, Check, Submit — the main one last. */
  actions?: ReactNode
  /** The form's status steps (draft → checked → submitted), above the header. */
  lifecycle?: { steps: readonly LifecycleStep[]; current: number; label: string }
  /** The form's parts, in order. */
  sections: readonly StatutorySection[]
  /** The rule checks and their results, from the Core. */
  rules?: readonly StatutoryRule[]
  /** The amounts' currency (a cell may have its own). */
  currency: string
  /** This period ("September 2026"): named in the comparison and the source documents. */
  currentLabel: string
  /** The previous period ("August 2026"); without it there is no comparison. */
  previousLabel?: string
  /** The previous period's values are shown (controlled with `onCompareChange`). */
  compare?: boolean
  /** Uncontrolled: compare from the start. Default false. */
  defaultCompare?: boolean
  onCompareChange?: (compare: boolean) => void
  /** The keys of the parts and groups collapsed at first. Default: every one open. */
  defaultCollapsed?: readonly string[]
  /** The cell being changed (its editor shown), by `statutoryCellId`; controlled with `onEditingChange`. */
  editing?: string | null
  onEditingChange?: (cell: string | null) => void
  /** Saves the value typed in a cell's editor; a promise keeps the editor until it settles. */
  onSaveOverride?: (cell: string) => void | Promise<void>
  /** Goes back to the computed value of an overridden cell. */
  onUseComputed?: (cell: string) => void
  /** A submitted form: no changes, no way back; the drill-down stays. */
  readOnly?: boolean
  /** Above the parts, under the checks: the application's Alert (e.g. the deadline). */
  notice?: ReactNode
  /**
   * The language of the form's own texts (parts, groups, rows, columns) when it is not the
   * page's ("sr-Cyrl" on an English page): they carry `lang` (D15).
   */
  lang?: string
  /** 'phone' forces the phone layout; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const RULE_LOOK = {
  failed: { icon: CircleX, fg: 'text-status-danger-fg', key: 'statutory.checkFailed' },
  warning: { icon: TriangleAlert, fg: 'text-status-warning-fg', key: 'statutory.checkWarning' },
  passed: { icon: CircleCheck, fg: 'text-status-success-fg', key: 'statutory.checkPassed' },
} as const

/** The indent of a nested group's heading and rows, by depth. */
const INDENT = ['', 'ps-4', 'ps-8', 'ps-12', 'ps-16'] as const
const indent = (depth: number) => INDENT[Math.min(depth, INDENT.length - 1)]

/** A rule's result as a line: an icon, the state in words, the rule and what was found. */
function RuleLine({ rule }: { rule: StatutoryRule }) {
  const { messages } = useLiro()
  const look = RULE_LOOK[rule.result]
  const Icon = look.icon
  return (
    <span className={cn('flex items-start gap-1 text-xs whitespace-normal', look.fg)}>
      <Icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>
        <span className="font-semibold">{messages[look.key]}:</span> {rule.text}
        {rule.detail !== undefined && <> · {rule.detail}</>}
      </span>
    </span>
  )
}

/** What a part's grid needs from the page. */
interface GridContext {
  prefix: string
  phone: boolean
  compare: boolean
  readOnly: boolean
  rules: readonly StatutoryRule[]
  currency: string
  previousLabel: string | undefined
  editing: string | null
  saving: boolean
  setEditing: (cell: string | null) => void
  save: (cell: string) => void
  onUseComputed: ((cell: string) => void) | undefined
  openSources: (row: StatutoryRow, column: StatutoryColumn) => void
  collapsed: ReadonlySet<string>
  toggle: (key: string) => void
  /** The form texts' `lang` attribute (empty when it is the page's language). */
  lang: { lang?: string }
}

function Amount({
  cell,
  value,
  currency,
}: {
  cell: StatutoryCell
  value: string | null | undefined
  currency: string
}) {
  return (
    <MoneyText
      value={value ?? null}
      currency={cell.currency ?? currency}
      {...(cell.decimals === undefined ? {} : { decimals: cell.decimals })}
    />
  )
}

/** One cell's content: the value (or the field, or the editor), its mark and the comparison. */
function CellContent({
  row,
  column,
  cell,
  context,
}: {
  row: StatutoryRow
  column: StatutoryColumn
  cell: StatutoryCell
  context: GridContext
}) {
  const { messages, format } = useLiro()
  const id = statutoryCellId(row.id, column.id)
  const where = `${row.number} · ${statutoryColumnLabel(column)}`
  const currency = cell.currency ?? context.currency
  const money = (value: string) =>
    format.money(value, currency, cell.decimals === undefined ? {} : { decimals: cell.decimals })
  const editable = cell.editor !== undefined && cell.kind !== 'entered' && !context.readOnly
  if (context.editing === id && editable) {
    return (
      <span className="flex flex-col items-stretch gap-2">
        <span className="min-w-36">{cell.editor}</span>
        <span className="flex flex-wrap justify-end gap-2">
          <Button
            intent="cancel"
            label={messages['dialog.cancel']}
            disabled={context.saving}
            onClick={() => {
              context.setEditing(null)
            }}
          />
          <Button
            intent="save"
            label={messages['statutory.saveOverride']}
            disabled={context.saving}
            onClick={() => {
              context.save(id)
            }}
          />
        </span>
      </span>
    )
  }
  let value: ReactNode
  if (cell.kind === 'entered' && cell.field !== undefined && !context.readOnly) {
    value = <span className="block min-w-36 flex-1">{cell.field}</span>
  } else if (cell.kind === 'source' && cell.sources !== undefined && cell.value !== null) {
    value = (
      <button
        type="button"
        aria-label={messages['statutory.showSources'](where, money(cell.value))}
        onClick={() => {
          context.openSources(row, column)
        }}
        className={cn(
          BUTTON_RESET,
          'min-h-6 cursor-pointer rounded-sm text-link underline decoration-dotted underline-offset-2 hover:decoration-solid',
          FOCUS_RING,
        )}
      >
        <Amount cell={cell} value={cell.value} currency={context.currency} />
      </button>
    )
  } else {
    value = <Amount cell={cell} value={cell.value} currency={context.currency} />
  }
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span
        id={fieldElementId(context.prefix, id)}
        tabIndex={-1}
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-focus',
          cell.kind === 'entered' && !context.readOnly && 'w-full',
          row.total === true && 'font-semibold',
        )}
      >
        {value}
        {editable && (
          <CompactIconButton
            intent="edit"
            label={messages['value.change'](where)}
            onClick={() => {
              context.setEditing(id)
            }}
          />
        )}
      </span>
      {context.compare && cell.previous !== undefined && context.previousLabel !== undefined && (
        <span data-slot="statutory-previous" className="text-xs font-regular text-secondary">
          <span className="sr-only">
            {messages['statutory.previousValue'](context.previousLabel)}{' '}
          </span>
          <Amount cell={cell} value={cell.previous} currency={context.currency} />
        </span>
      )}
    </span>
  )
}

/** Under a row's label: its open checks, and each overridden cell with who, when and the way back. */
function RowNotes({
  row,
  columns,
  context,
}: {
  row: StatutoryRow
  columns: readonly StatutoryColumn[]
  context: GridContext
}) {
  const { messages, format } = useLiro()
  const checks = statutoryRowRules(context.rules, row, columns)
  const overridden = columns.flatMap((column) => {
    const cell = row.cells[column.id]
    return cell?.override === undefined ? [] : [{ column, cell, override: cell.override }]
  })
  if (checks.length === 0 && overridden.length === 0) return null
  return (
    <>
      {checks.map((rule) => (
        <RuleLine key={rule.id} rule={rule} />
      ))}
      {overridden.map(({ column, cell, override }) => {
        const currency = cell.currency ?? context.currency
        const computed = format.money(
          override.computed,
          currency,
          cell.decimals === undefined ? {} : { decimals: cell.decimals },
        )
        return (
          <span
            key={column.id}
            data-slot="statutory-override"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-regular whitespace-normal text-secondary"
          >
            <StatusBadge
              tone="neutral"
              icon={PencilLine}
              label={messages['statutory.overridden']}
            />
            {columns.length > 1 && (
              <span {...context.lang} className={TEXT_DIRECTION}>
                {statutoryColumnLabel(column)}
              </span>
            )}
            <span className={TEXT_DIRECTION}>
              {messages['statutory.overriddenBy'](override.by, override.at)}
            </span>
            <span className={cn('tabular-nums', TEXT_DIRECTION)}>
              {messages['statutory.computed'](computed)}
            </span>
            {!context.readOnly && context.onUseComputed !== undefined && (
              <Button
                family="neutral"
                icon={Undo2}
                emphasis="menu"
                label={messages['statutory.useComputed']}
                onClick={() => {
                  context.onUseComputed?.(statutoryCellId(row.id, column.id))
                }}
              />
            )}
          </span>
        )
      })}
    </>
  )
}

/** The number of a row (its element is the row's "Go to" target). */
function RowNumber({ row, context }: { row: StatutoryRow; context: GridContext }) {
  return (
    <span
      id={fieldElementId(context.prefix, row.id)}
      tabIndex={-1}
      dir="ltr"
      className={cn(
        'shrink-0 rounded-sm tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-focus',
        !context.phone && 'w-14 text-start',
      )}
    >
      {row.number}
    </span>
  )
}

/** A group's heading: a disclosure button with its number and title. */
function GroupToggle({
  line,
  context,
}: {
  line: Extract<StatutoryGridLine, { kind: 'group' }>
  context: GridContext
}) {
  const { group, open } = line
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => {
        context.toggle(group.key)
      }}
      className={cn(
        BUTTON_RESET,
        FOCUS_RING,
        'flex min-h-6 max-w-full cursor-pointer items-start gap-2 rounded-sm py-1 text-start text-sm font-semibold text-primary',
      )}
    >
      {open ? (
        <ChevronDown aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
      ) : (
        <ChevronRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-secondary rtl:-scale-x-100"
        />
      )}
      <span {...context.lang} className={cn('min-w-0 break-words', TEXT_DIRECTION)}>
        {group.number !== undefined && (
          <>
            <span dir="ltr" className="tabular-nums">
              {group.number}
            </span>{' '}
          </>
        )}
        {group.title}
      </span>
    </button>
  )
}

const HEADER_CELL =
  'border-0 border-b border-solid border-default bg-surface-sunken px-3 py-2 align-bottom text-xs font-semibold text-secondary'
const BODY_CELL = 'border-0 border-b border-solid border-subtle px-3 py-2 align-top'

/**
 * A part's grid on wider screens: two header rows (groups over columns), group headings and rows.
 * It scrolls sideways only when it does not fit its card (then a named, focusable region). The
 * header rows move as one group (`STICKY_HEAD` on the `thead`: the two rows stay together) below
 * the shell while the page scrolls; the number and label column and the corner stay at the start.
 */
function DesktopGrid({ section, context }: { section: StatutorySection; context: GridContext }) {
  const { messages } = useLiro()
  const wrapper = useRef<HTMLDivElement>(null)
  const table = useRef<HTMLTableElement>(null)
  const [width, setWidth] = useState<number | null>(null)
  const [overflowing, setOverflowing] = useState(false)
  useLayoutEffect(() => {
    const frame = wrapper.current
    const grid = table.current
    if (frame === null || grid === null) return
    const measure = () => {
      setWidth(frame.clientWidth)
      setOverflowing(grid.scrollWidth > frame.clientWidth + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    observer.observe(grid)
    return () => {
      observer.disconnect()
    }
  }, [])
  useStickyHead(wrapper)
  const { first, second } = statutoryHeaderRows(section.columns)
  const grouped = second.length > 0
  const lines = statutoryGridLines(section.items, context.collapsed)
  const span = section.columns.length + 1
  return (
    <div
      ref={wrapper}
      data-slot="statutory-grid"
      data-overflowing={overflowing ? '' : undefined}
      style={
        width === null
          ? undefined
          : ({ '--liro-grid-width': `${String(width)}px` } as CSSProperties)
      }
      {...(overflowing ? { role: 'region', 'aria-label': section.title, tabIndex: 0 } : {})}
      className={cn(
        'w-full overflow-x-auto rounded-b-lg',
        STICKY_CLEARANCE,
        // The grid's own controls (fields, pencils, source buttons) are scrolled clear too.
        '[&_tbody_:is(input,button,[tabindex])]:scroll-mt-[calc(var(--liro-shell-top,0px)+var(--liro-head-height,0px))] [&_tbody_td_:is(input,button)]:scroll-ms-[var(--liro-start-width,0px)]',
        overflowing && cn(FOCUS_RING, '-outline-offset-2'),
      )}
    >
      <table
        ref={table}
        aria-label={section.title}
        className="w-full border-separate border-spacing-0 font-sans text-sm text-primary"
      >
        <thead data-sticky-head="" className={cn(STICKY_HEAD, 'z-10')}>
          <tr>
            <th
              scope="col"
              rowSpan={grouped ? 2 : 1}
              data-sticky-start=""
              className={cn(HEADER_CELL, 'sticky start-0 z-20 min-w-64 text-start')}
            >
              <span className="flex gap-3">
                <span className={cn('w-14 shrink-0', TEXT_ISOLATE)}>
                  {messages['statutory.number']}
                </span>
                <span className={TEXT_ISOLATE}>{messages['statutory.description']}</span>
              </span>
            </th>
            {first.map((cell) =>
              cell.kind === 'group' ? (
                <th
                  key={cell.key}
                  scope="colgroup"
                  colSpan={cell.span}
                  className={cn(HEADER_CELL, 'border-s text-center')}
                >
                  <span {...context.lang} className={TEXT_ISOLATE}>
                    {cell.label}
                  </span>
                </th>
              ) : (
                <th
                  key={cell.column.id}
                  scope="col"
                  rowSpan={grouped ? 2 : 1}
                  className={cn(HEADER_CELL, 'w-40 min-w-36 text-end')}
                >
                  <span {...context.lang} className={TEXT_ISOLATE}>
                    {cell.column.label}
                  </span>
                </th>
              ),
            )}
          </tr>
          {grouped && (
            <tr>
              {second.map((column, index) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    HEADER_CELL,
                    'w-40 min-w-36 text-end',
                    (index === 0 || second[index - 1]?.group !== column.group) && 'border-s',
                  )}
                >
                  <span {...context.lang} className={TEXT_ISOLATE}>
                    {column.label}
                  </span>
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody className="[&>tr:last-child>*]:border-b-0">
          {lines.map((line) => {
            if (line.kind === 'group') {
              return (
                <tr key={`g-${line.group.key}`} data-slot="statutory-group">
                  <td colSpan={span} className={cn(BODY_CELL, 'bg-surface-raised py-1')}>
                    <div
                      className={cn(
                        'sticky start-3 max-w-[calc(var(--liro-grid-width,100%)-1.5rem)]',
                        indent(line.depth),
                      )}
                    >
                      <GroupToggle line={line} context={context} />
                    </div>
                  </td>
                </tr>
              )
            }
            const { row } = line
            return (
              <tr
                key={row.id}
                data-slot="statutory-row"
                data-total={row.total === true ? '' : undefined}
              >
                <th
                  scope="row"
                  className={cn(
                    BODY_CELL,
                    'sticky start-0 z-[5] bg-surface-raised text-start font-regular',
                    row.total === true && 'font-semibold',
                  )}
                >
                  <span className={cn('flex gap-3', indent(line.depth))}>
                    <RowNumber row={row} context={context} />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span {...context.lang} className={TEXT_DIRECTION}>
                        {row.label}
                      </span>
                      <RowNotes row={row} columns={section.columns} context={context} />
                    </span>
                  </span>
                </th>
                {section.columns.map((column) => {
                  const cell = row.cells[column.id]
                  return (
                    <td
                      key={column.id}
                      data-cell-kind={cell?.kind ?? 'absent'}
                      className={cn(BODY_CELL, 'text-end whitespace-nowrap')}
                    >
                      {cell !== undefined && (
                        <CellContent row={row} column={column} cell={cell} context={context} />
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** A part on a phone: group headings and one card per row, each value labelled. */
function PhoneGrid({ section, context }: { section: StatutorySection; context: GridContext }) {
  const lines = statutoryGridLines(section.items, context.collapsed)
  return (
    <div
      data-slot="statutory-grid"
      className={cn(
        'flex flex-col gap-2 px-3 pb-3',
        // A field reached by the keyboard is scrolled clear of the shell's sticky top (WCAG 2.4.11).
        '[&_:is(input,button,[tabindex])]:scroll-mt-[calc(var(--liro-shell-top,0px)+0.5rem)]',
      )}
    >
      {lines.map((line) => {
        if (line.kind === 'group') {
          return (
            <div key={`g-${line.group.key}`} data-slot="statutory-group" className="pt-1">
              <GroupToggle line={line} context={context} />
            </div>
          )
        }
        const { row } = line
        const present = section.columns.flatMap((column) => {
          const cell = row.cells[column.id]
          return cell === undefined ? [] : [{ column, cell }]
        })
        return (
          <div
            key={row.id}
            data-slot="statutory-row"
            data-total={row.total === true ? '' : undefined}
            className={cn(
              'flex flex-col gap-2 rounded-md border border-solid bg-surface-raised p-3',
              row.total === true ? 'border-strong' : 'border-default',
            )}
          >
            <p className={cn('m-0 text-sm', row.total === true && 'font-semibold', TEXT_DIRECTION)}>
              <RowNumber row={row} context={context} /> <span {...context.lang}>{row.label}</span>
            </p>
            <RowNotes row={row} columns={section.columns} context={context} />
            <dl className="m-0 flex flex-col gap-2">
              {present.map(({ column, cell }) => {
                const field =
                  (cell.kind === 'entered' && cell.field !== undefined && !context.readOnly) ||
                  context.editing === statutoryCellId(row.id, column.id)
                return (
                  <div
                    key={column.id}
                    data-cell-kind={cell.kind}
                    className={cn(
                      'flex gap-x-3 gap-y-1 border-0 border-t border-solid border-subtle pt-2',
                      field ? 'flex-col' : 'items-baseline justify-between',
                    )}
                  >
                    <dt
                      {...context.lang}
                      className={cn('min-w-0 text-xs text-secondary', TEXT_DIRECTION)}
                    >
                      {statutoryColumnLabel(column)}
                    </dt>
                    <dd className={cn('m-0 text-sm', field ? 'w-full' : 'shrink-0')}>
                      <CellContent row={row} column={column} cell={cell} context={context} />
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        )
      })}
    </div>
  )
}

/** A part of the form: a card with a collapsible title (h2), then its grid. */
function Part({ section, context }: { section: StatutorySection; context: GridContext }) {
  const open = !context.collapsed.has(section.key)
  return (
    <section
      data-slot="statutory-part"
      className={cn(
        'rounded-lg border border-solid border-default font-sans text-primary',
        context.phone ? 'bg-surface-sunken' : 'bg-surface-raised',
      )}
    >
      <div className="flex flex-col gap-0.5 p-4">
        <h2 className="m-0 text-h4">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              context.toggle(section.key)
            }}
            className={cn(
              BUTTON_RESET,
              FOCUS_RING,
              'flex min-h-6 max-w-full cursor-pointer items-start gap-2 rounded-sm text-start text-h4',
            )}
          >
            {open ? (
              <ChevronDown aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
            ) : (
              <ChevronRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-secondary rtl:-scale-x-100"
              />
            )}
            <span {...context.lang} className={cn('min-w-0 break-words', TEXT_DIRECTION)}>
              {section.title}
            </span>
          </button>
        </h2>
        {section.description !== undefined && (
          <p
            {...context.lang}
            className={cn('m-0 ps-6 text-xs break-words text-secondary', TEXT_DIRECTION)}
          >
            {section.description}
          </p>
        )}
      </div>
      {open &&
        (context.phone ? (
          <PhoneGrid section={section} context={context} />
        ) : (
          <DesktopGrid section={section} context={context} />
        ))}
    </section>
  )
}

/** An official form as its grid: parts, groups, rows and cells; drill-down, overrides, checks. */
export function StatutoryFormPage(props: StatutoryFormPageProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const prefix = useId()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const rules = props.rules ?? []
  const [ownEditing, setOwnEditing] = useState<string | null>(null)
  const editing = props.editing === undefined ? ownEditing : props.editing
  const setEditing = (cell: string | null) => {
    setOwnEditing(cell)
    props.onEditingChange?.(cell)
  }
  const [ownCompare, setOwnCompare] = useState(props.defaultCompare ?? false)
  const compare = props.previousLabel !== undefined && (props.compare ?? ownCompare)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(props.defaultCollapsed ?? []),
  )
  const [saving, setSaving] = useState(false)
  const [drill, setDrill] = useState<{ row: StatutoryRow; column: StatutoryColumn } | null>(null)
  const readOnly = props.readOnly === true
  const lang = useLangAttribute(props.lang)

  // "Go to": the row or cell to focus once the part and groups around it are drawn open.
  const pendingFocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (id === null) return
    pendingFocus.current = null
    const target = document.getElementById(fieldElementId(prefix, id))
    target?.scrollIntoView({ block: 'center' })
    target?.focus({ preventScroll: true })
  })

  /** Opens the part and the groups around a row or cell, then focuses it. */
  const goTo = (id: string) => {
    const place = findStatutoryPlace(props.sections, id)
    if (place === undefined) return
    pendingFocus.current = id
    setCollapsed((current) => new Set([...current].filter((key) => !place.path.includes(key))))
  }

  const context: GridContext = {
    prefix,
    phone,
    compare,
    readOnly,
    rules,
    currency: props.currency,
    previousLabel: props.previousLabel,
    editing,
    saving,
    setEditing,
    save: (cell) => {
      const result = props.onSaveOverride?.(cell)
      if (result instanceof Promise) {
        setSaving(true)
        void result
          .then(() => {
            setEditing(null)
          })
          .finally(() => {
            setSaving(false)
          })
      } else setEditing(null)
    },
    onUseComputed: props.onUseComputed,
    openSources: (row, column) => {
      setDrill({ row, column })
    },
    collapsed,
    toggle: (key) => {
      setCollapsed((current) => {
        const next = new Set(current)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    lang,
  }

  const counts = ruleCounts(rules)
  const count = (value: number) => format.number(String(value))
  const open = rules.filter((rule) => rule.result !== 'passed')
  const summaryTitle = [
    counts.failed > 0 && messages['statutory.checksFailed'](counts.failed, count(counts.failed)),
    counts.warning > 0 &&
      messages['statutory.checksWarnings'](counts.warning, count(counts.warning)),
    counts.passed > 0 && messages['statutory.checksPassed'](counts.passed, count(counts.passed)),
  ]
    .filter((part) => part !== false)
    .join(' · ')

  const drillCell = drill === null ? undefined : drill.row.cells[drill.column.id]
  const drillAmount = (value: string | null) =>
    drillCell === undefined ? null : (
      <Amount cell={drillCell} value={value} currency={props.currency} />
    )

  return (
    <div
      data-slot="statutory-form-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-4 p-6',
        props.className,
      )}
    >
      {props.lifecycle !== undefined && (
        <LifecycleBar
          steps={props.lifecycle.steps}
          current={props.lifecycle.current}
          label={props.lifecycle.label}
          layout={phone ? 'phone' : 'desktop'}
        />
      )}
      <PageHeader
        title={props.title}
        {...(props.back === undefined ? {} : { back: props.back })}
        {...(props.status === undefined ? {} : { status: props.status })}
        {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
      />
      {rules.length > 0 && (
        <Alert tone={rulesTone(rules)} title={summaryTitle}>
          {open.length > 0 && (
            <ul
              aria-label={messages['statutory.checks']}
              className="m-0 flex list-none flex-col gap-2 p-0"
            >
              {open.map((rule) => {
                const first = rule.fields[0]
                const place =
                  first === undefined ? undefined : findStatutoryPlace(props.sections, first)
                return (
                  <li key={rule.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <RuleLine rule={rule} />
                    {first !== undefined && place !== undefined && (
                      // An action on a toned Alert is a neutral secondary button (P5.28 item 7).
                      <Button
                        family="neutral"
                        emphasis="secondary"
                        icon={LocateFixed}
                        label={messages['statutory.goToField'](place.row.number)}
                        onClick={() => {
                          goTo(first)
                        }}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Alert>
      )}
      {props.notice}
      {props.previousLabel !== undefined && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <SwitchField
            label={messages['statutory.compareWith'](props.previousLabel)}
            checked={compare}
            onChange={(checked) => {
              setOwnCompare(checked)
              props.onCompareChange?.(checked)
            }}
          />
          {compare && (
            <p
              data-slot="statutory-compare-note"
              className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}
            >
              {messages['statutory.comparing'](props.currentLabel, props.previousLabel)}
            </p>
          )}
        </div>
      )}
      {props.sections.map((section) => (
        <Part key={section.key} section={section} context={context} />
      ))}
      {drill !== null && drillCell !== undefined && (
        <Drawer
          side="end"
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) setDrill(null)
          }}
          title={`${drill.row.number} ${drill.row.label}`}
          description={`${statutoryColumnLabel(drill.column)} · ${props.currentLabel}`}
          actions={
            <Button
              intent="cancel"
              label={messages['dialog.close']}
              onClick={() => {
                setDrill(null)
              }}
            />
          }
        >
          {drillCell.sourceName !== undefined && (
            <p className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
              {drillCell.sourceName}
            </p>
          )}
          {(drillCell.sources ?? []).length === 0 ? (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {messages['statutory.noSources']}
            </p>
          ) : (
            <ul
              aria-label={drillCell.sourceName ?? messages['statutory.sources']}
              className="m-0 flex list-none flex-col p-0 font-sans"
            >
              {(drillCell.sources ?? []).map((source) => (
                <li
                  key={source.key}
                  className="flex items-center justify-between gap-3 border-0 border-b border-solid border-subtle py-2 first:pt-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      href={source.href}
                      className={cn(
                        'flex min-w-0 flex-col rounded-sm text-sm no-underline hover:underline',
                        FOCUS_RING,
                      )}
                    >
                      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                        {source.type}
                      </span>
                      <span dir="ltr" className="text-start font-medium text-link tabular-nums">
                        {source.number}
                      </span>
                    </Link>
                    {source.date !== undefined && (
                      <span className="text-xs text-secondary">
                        <DateText value={source.date} />
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium">{drillAmount(source.amount)}</span>
                    {source.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="m-0 flex items-baseline justify-between gap-3 border-0 border-t border-solid border-strong pt-2 text-sm font-semibold">
            <span className={TEXT_DIRECTION}>
              {messages['statutory.fieldValue'](
                `${drill.row.number} · ${statutoryColumnLabel(drill.column)}`,
              )}
            </span>
            {drillAmount(drillCell.value)}
          </p>
        </Drawer>
      )}
    </div>
  )
}

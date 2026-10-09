import { useVirtualizer, type Range, type Rect, type Virtualizer } from '@tanstack/react-virtual'
import { CircleAlert, Plus, Trash2, TriangleAlert } from 'lucide-react'
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ActionButton } from './actions'
import { CompactIconButton } from './button'
import { ComboboxField, type ComboboxOption } from './combobox-field'
import { DateField } from './date-field'
import { ariaRowIndexes, VIRTUALIZE_FROM } from './editable-grid-window'
import {
  gridKeyAction,
  orderMessages,
  type GridAction,
  type GridDetail,
  type GridMessage,
} from './editable-grid-logic'
import {
  editableCellCount,
  taxCategoryText,
  type AddableLineType,
  type LineType,
  type TaxCategory,
  type UnitOfMeasure,
} from './line-types'
import {
  LookupCreateDrawer,
  type LookupDraft,
  type LookupDraftErrors,
} from './lookup-create-drawer'
import { LookupField } from './lookup-field'
import {
  lookupKindLabel,
  type LookupCreateKind,
  type LookupKind,
  type LookupOption,
} from './lookup-logic'
import { ShortcutHint } from './navigation'
import { NumberField } from './number-field'
import { SelectField, type SelectOption } from './select-field'
import { SettlingMemory, SettlingValue, type SettlingMemoryValue } from './settling-value'
import { SplitAction } from './split-action'
import { TextField } from './text-field'
import { EntryDraftSlot, type EntryDraft } from './use-entry'
import { usePhone } from './use-phone'
import { keepFocusedRow, overscanRows, spacersBetween } from './virtual-rows'

/*
 * EditableGrid (BUILD-PLAN P3.4): a keyboard-first line editor for document lines and journal
 * entries. Owner's decisions (2026-10-01, docs/decisions.md "Editable grid"):
 * - Cells are always fields, as in the old grid: the Design System's own fields (TextField,
 *   NumberField, SelectField, ComboboxField, DateField, LookupField) without their frames, inside
 *   a table with 1px border.default lines, the header on surface.sunken, 4px cell padding,
 *   numbers at the end with tabular digits. The focused cell: an inset 1px border.focus line and
 *   surface.hover (not the old blue surface.selected: blue is for actions and focus). A 44px end
 *   column holds the row's remove (×) button. The frames are taken off in styles.css ("grid-cell").
 * - Enter: the same column, next row; on the last row a new row. Shift+Enter: previous row. Tab
 *   and Shift+Tab: the browser's order. While a cell's option list is open, Enter chooses and does
 *   not move. On phones Enter ("next" on the on-screen keyboard) goes through the row's fields,
 *   then to the next row, and adds a row after the last field.
 * - Ctrl/Cmd+Enter inserts a row below; Ctrl/Cmd+Delete removes the row (no confirmation: a
 *   draft); the focus stays in the column. "Add line" and × always remain, with the shortcuts
 *   beside "Add line". minRows / maxRows are kept.
 * - Errors and warnings: a line under the row, full width, 12px, an icon in the tone's colour,
 *   errors first; the row's fields point to it (aria-describedby); an error's cells take the
 *   danger border.
 * - Totals from props, shown with SettlingValue, under a 2px border.strong line. Nothing is
 *   computed: the application sums, checks the balance and sends the messages.
 *
 * On phones (below 48em; P3.6, owner: the old behaviour — a table scrolling sideways is not usable
 * there):
 * - every line is a card (border.default, radius md, padding sm) with its fields stacked, each
 *   under its column's label (xs, text.tertiary, 2px gap), the line's messages under the fields,
 *   and an xs "Remove line" button (Trash2, destructive family, menu weight) at the card's end;
 * - the totals and the footer (the balance) stand in a card sticky at the TOP (raised, border,
 *   radius md, padding xs): the balance is the number the operator watches, and a long entry
 *   would push a total at the bottom below the screen;
 * - "Add line" under the cards, without the shortcut hints (no hardware keyboard); the on-screen
 *   keyboard's "next" goes through a line's fields, then to the next line.
 *
 * P4.9 (the owner's review):
 * - "Add line" is a normal button — the default neutral look (raised, border.default) at the
 *   normal 36px size and padding with the Plus icon — not a small tinted one.
 * - `inCard` (a document's lines card, as DataTable's): no card inside a card. On desktop the
 *   grid keeps md (16px) from the card's edges; on phones the lines are a flat list with 1px
 *   border.subtle dividers, padded md at the sides, and the totals a sticky bar with a line under
 *   it instead of a card.
 *
 * P5.18 (complex documents) and P5.19 (catalogues at scale):
 * - Line types (`getRowType`, components/line-types.ts), told apart by typography, never colour:
 *   a text line is one field across the row, xs and secondary; a section heading one field across
 *   the row, semibold; a subtotal no field — its text end-aligned and its amounts semibold, with a
 *   1px border.strong rule above; discounts and deductions are lines whose negative amounts the
 *   application sends. The keyboard skips subtotals, and Enter keeps its column through a heading.
 * - "Add line ▾": the button adds a normal line; its chevron menu (SplitAction) offers the rarer
 *   types the document allows (`addTypes`). Enter still adds a normal line.
 * - A `lookup` column: one LookupField per line instead of a "Type" column; the chosen record's
 *   kind stands in the cell as small secondary text (no colour); "+ Create …" opens
 *   LookupCreateDrawer and fills the line with the new record. `taxCategory` and `unit` columns
 *   choose from the Core's lists ("S 20%"; "pc" stored as H87). Details per line (`details`:
 *   an asset number, a sale note; `internal` ones after the "Internal" note) under the row.
 * - 300 lines stay responsive: each editable cell is a memoised component whose props are the
 *   values the application gave for it, so typing in one cell renders that cell's field again,
 *   not the 2,000 others (docs/decisions.md "Liro patterns (Phase 5 part 1)", measured).
 */

/*
 * The row window follows the page, not a scrolling box of its own: TanStack Virtual's view is
 * the window (`observeViewport`), and its offset how far the window's top is below the first
 * line's top (`observeOffsetInPage`; negative while the grid starts lower on the screen), read
 * once a frame after any scrolling — the page, a scrolling container, a phone frame — or
 * resizing. The grid never scrolls itself (`scrollWithPage`): the browser keeps a focused field
 * in view.
 */
function observeViewport(
  instance: Virtualizer<HTMLElement, HTMLElement>,
  onRect: (rect: Rect) => void,
) {
  const view = instance.targetWindow
  if (view === null) return
  const measure = () => {
    onRect({ width: view.innerWidth, height: view.innerHeight })
  }
  measure()
  view.addEventListener('resize', measure)
  return () => {
    view.removeEventListener('resize', measure)
  }
}

function observeOffsetInPage(
  instance: Virtualizer<HTMLElement, HTMLElement>,
  onOffset: (offset: number, isScrolling: boolean) => void,
) {
  const body = instance.scrollElement
  const view = instance.targetWindow
  if (body === null || view === null) return
  let frame = 0
  const read = () => {
    onOffset(-body.getBoundingClientRect().top, false)
  }
  const onScroll = () => {
    view.cancelAnimationFrame(frame)
    frame = view.requestAnimationFrame(read)
  }
  read()
  view.addEventListener('scroll', onScroll, { capture: true, passive: true })
  view.addEventListener('resize', onScroll)
  return () => {
    view.cancelAnimationFrame(frame)
    view.removeEventListener('scroll', onScroll, { capture: true })
    view.removeEventListener('resize', onScroll)
  }
}

function scrollWithPage() {
  // The page scrolls; the grid never moves it.
}

function keepScrollOnResize() {
  return false
}

interface ColumnBase<Row> {
  /** Unique; `onCellChange`, `totals` and messages refer to it. */
  id: string
  /** The column's heading, from the application. Also names each cell ("Quantity, line 3"). */
  header: string
  /** Width in pixels; columns without one share the rest. */
  width?: number
  /** The cell cannot be changed in this row (shown as plain text, not disabled). */
  readOnly?: (row: Row) => boolean
}

/** "+ Create …" from a lookup column: what the panel offers and how the application saves. */
export interface GridLookupCreate {
  /** The kinds that may be created from the typed text. */
  kinds: readonly LookupCreateKind[]
  /** The units of measure to choose from. */
  units: readonly UnitOfMeasure[]
  /** The tax categories to choose from. */
  taxCategories: readonly TaxCategory[]
  /** The price's currency. */
  currency: string
  defaultUnit?: string
  defaultTaxCategory?: string
  /**
   * Saves the new record for the line; resolves with it (the grid then fills the line through
   * `onCellChange`), or with null when it was not saved (`errors` say why).
   */
  onCreate: (rowId: string, draft: LookupDraft) => Promise<LookupOption | null>
  /** The application's messages about the values entered in the panel. */
  errors?: LookupDraftErrors
}

/** One column of an EditableGrid: an editor by kind, or a value shown from the row. */
export type EditableGridColumn<Row> = ColumnBase<Row> &
  (
    | { type: 'text'; value: (row: Row) => string }
    | {
        type: 'number'
        /** A decimal string, or null when empty. */
        value: (row: Row) => string | null
        /** Zeros added up to this many; never rounds. */
        decimals?: number
      }
    | { type: 'select'; value: (row: Row) => string; options: readonly SelectOption[] }
    | {
        type: 'combobox'
        value: (row: Row) => ComboboxOption | null
        /** The options to show (all, or the row's last search results). */
        options: readonly ComboboxOption[] | ((row: Row) => readonly ComboboxOption[])
        /** The application searches for the row; the results arrive as `options`. */
        onSearch?: (rowId: string, query: string) => void
        /** The row's search is running. */
        loading?: (row: Row) => boolean
      }
    | { type: 'date'; value: (row: Row) => string | null }
    | {
        /**
         * One search field per line (P5.18): a LookupField over the catalogues the document
         * allows, its results grouped by kind; the chosen record's kind is shown in the line.
         */
        type: 'lookup'
        value: (row: Row) => LookupOption | null
        /** The row's last search results. */
        results: (row: Row) => readonly LookupOption[]
        /** The application searches for the row (after 300ms of quiet). */
        onSearch: (rowId: string, query: string) => void
        /** The row's search is running. */
        loading?: (row: Row) => boolean
        /** Recently used records, shown while nothing is typed. */
        recent?: readonly LookupOption[]
        /** The kinds, in the order of their groups, with headings and names. */
        kinds?: readonly LookupKind[]
        /** "+ Create …" and its panel. */
        create?: GridLookupCreate
        /** A one-off line without a catalogue record is allowed (the application's rule). */
        allowOneOff?: boolean
        /** Adds "Search all…": the application opens its full search for the row. */
        onSearchAll?: (rowId: string, query: string) => void
      }
    | {
        /** The line's tax category, from the Core's list, shown as "S 20%". */
        type: 'taxCategory'
        /** The category's value, or '' for none. */
        value: (row: Row) => string
        categories: readonly TaxCategory[]
      }
    | {
        /** The line's unit of measure, from the Core's list: "pc" shown, its code stored. */
        type: 'unit'
        /** The unit's standard code, or '' for none. */
        value: (row: Row) => string
        units: readonly UnitOfMeasure[]
      }
    | {
        /** Not editable: a value the application computes, such as the line's amount. */
        type: 'display'
        display: (row: Row) => ReactNode
        align?: 'start' | 'end'
        numeric?: boolean
      }
  )

/** A total under a column, from the application, shown with SettlingValue. */
export interface GridTotal {
  /** A decimal string; null shows "—". */
  value: string | null
  /** A new total is being computed: the last one stays, with a quiet dot. */
  pending?: boolean
  currency?: string
  decimals?: number
}

export interface EditableGridProps<Row> {
  /** The grid's accessible name, from the application ("Invoice lines"). */
  label: string
  columns: readonly EditableGridColumn<Row>[]
  /** The rows in order; the application keeps them. */
  rows: readonly Row[]
  getRowId: (row: Row) => string
  /**
   * A cell's new value: text, a decimal string or null, an option value, an option, a date, a
   * lookup record (`LookupOption`).
   */
  onCellChange: (rowId: string, columnId: string, value: unknown) => void
  /** Insert a new, empty row of this type at this index (a normal `line` unless chosen from "Add line ▾"). */
  onAddRow: (index: number, type: LineType) => void
  onRemoveRow: (rowId: string) => void
  /** The fewest rows; the last ones cannot be removed. Default: 1. */
  minRows?: number
  /** The most rows; no row can be added beyond it. */
  maxRows?: number
  /** Errors and warnings by row id, from the application. */
  messages?: Readonly<Record<string, readonly GridMessage[]>>
  /** Details by row id (an asset number, a sale note), from the application, under the row. */
  details?: Readonly<Record<string, readonly GridDetail[]>>
  /** Totals by column id, from the application. */
  totals?: Readonly<Record<string, GridTotal>>
  /**
   * Shown in the totals row's first column when it has no total of its own; on phones, the
   * title of the totals card.
   */
  totalsLabel?: string
  /** The balance or a summary, from the application: under the grid, on phones in the totals card. */
  footer?: ReactNode
  /** Forces the desktop table or the phone cards; default: by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /** Inside a card (a document's lines): no frames of its own on phones, md from the edges. */
  inCard?: boolean
  /** Each row's line type (P5.18). Default: every row is a normal `line`. */
  getRowType?: (row: Row) => LineType
  /**
   * The text of a text line, a section heading and a subtotal: the one field across the row
   * (reported through `onCellChange` with `columnId`), and a subtotal's label.
   */
  lineText?: { columnId: string; value: (row: Row) => string }
  /** The rarer line types "Add line ▾" offers (the document's rule); none: a plain "Add line". */
  addTypes?: readonly AddableLineType[]
  /**
   * Draw only the lines in view (and 600px around them, and the focused line): for long grids,
   * such as a specification of 300 positions. Default: from VIRTUALIZE_FROM (100) rows on.
   */
  virtualize?: boolean
  className?: string
}

/** Literal classes, so Tailwind finds them. */
const CELL_BORDER = 'border border-solid border-default'
const MESSAGE_TONE = {
  danger: { text: 'text-status-danger-fg', Icon: CircleAlert },
  warning: { text: 'text-status-warning-fg', Icon: TriangleAlert },
} as const
/** The typing area of a text line and of a heading takes the line type's typography. */
const SPAN_TEXT = {
  text: '[&_input]:text-xs [&_input]:text-secondary',
  heading: '[&_input]:font-semibold',
} as const

/** The first control of a cell that takes the focus. */
const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), button:not([disabled])'

/** A column of any row, as a cell sees it: the cell never calls the column's row functions. */
type CellColumn = EditableGridColumn<never>

/**
 * Focuses the field of a cell (and selects its text): the given column, or the row's last cell
 * before it when the row has fewer (a heading has one).
 */
function focusCellIn(root: HTMLElement | null, row: number, column: number): HTMLElement | null {
  for (let at = column; at >= 0; at -= 1) {
    const cell = root?.querySelector(
      `[data-grid-row="${String(row)}"][data-grid-column="${String(at)}"]`,
    )
    const target = cell?.querySelector<HTMLElement>(FOCUSABLE)
    if (target === null || target === undefined) continue
    target.focus()
    if (target instanceof HTMLInputElement) target.select()
    return target
  }
  return null
}

function isEditable<Row>(column: EditableGridColumn<Row>): boolean {
  return column.type !== 'display'
}

function Total({ total, since }: { total: GridTotal; since: SettlingMemoryValue }) {
  return (
    <SettlingMemory.Provider value={since}>
      <SettlingValue
        value={total.value}
        {...(total.pending === undefined ? {} : { pending: total.pending })}
        {...(total.currency === undefined ? {} : { currency: total.currency })}
        {...(total.decimals === undefined ? {} : { decimals: total.decimals })}
      />
    </SettlingMemory.Provider>
  )
}

/** One message or detail under a row, with its id (the row's fields point to it). */
type RowNote =
  | { kind: 'message'; id: string; message: GridMessage }
  | { kind: 'detail'; id: string; detail: GridDetail }

function NoteList({ notes }: { notes: readonly RowNote[] }) {
  const { messages } = useLiro()
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {notes.map((note) => {
        if (note.kind === 'detail') {
          return (
            <li
              key={note.id}
              id={note.id}
              className="flex items-start gap-1.5 text-xs leading-tight text-secondary"
            >
              {note.detail.internal === true && (
                <span className={cn('shrink-0 font-semibold', TEXT_DIRECTION)}>
                  {messages['grid.internal']}
                </span>
              )}
              <span className={TEXT_DIRECTION}>{note.detail.text}</span>
            </li>
          )
        }
        const tone = MESSAGE_TONE[note.message.tone]
        return (
          <li
            key={note.id}
            id={note.id}
            className={cn('flex items-start gap-1 text-xs leading-tight', tone.text)}
          >
            <tone.Icon aria-hidden="true" className="mt-px size-3 shrink-0" />
            <span className={TEXT_DIRECTION}>{note.message.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** What a cell asks the grid for; one stable object, so the memoised cells keep their props. */
interface GridApi {
  change: (rowId: string, columnId: string, value: unknown) => void
  validity: (rowId: string, columnId: string, valid: boolean) => void
  search: (rowId: string, columnId: string, query: string) => void
  searchAll: (rowId: string, columnId: string, query: string) => void
  create: (rowId: string, columnId: string, kind: string, query: string) => void
  drafts: Map<string, EntryDraft>
}

/**
 * The rows' numbers from 1, by row id, for the fields' names ("Quantity, line 3"). Read by the
 * small CellName inside each field's label, so a row inserted at the top renames the fields below
 * it without rendering their fields again.
 */
const LineNumbers = createContext<ReadonlyMap<string, number>>(new Map())

/** A field's name for assistive technology: "<column>, line <n>". */
function CellName({ rowId, header }: { rowId: string; header: string }) {
  const { messages, format } = useLiro()
  const line = useContext(LineNumbers).get(rowId) ?? 0
  return (
    <span className="sr-only">
      {messages['grid.cell'](header, line, format.number(String(line)))}
    </span>
  )
}

interface CellProps {
  api: GridApi
  column: CellColumn
  rowId: string
  /** The cell's value as the column gave it for the row. */
  value: unknown
  /** A combobox's options for the row. */
  options: readonly ComboboxOption[] | undefined
  /** A lookup's results for the row. */
  results: readonly LookupOption[] | undefined
  loading: boolean
  readOnly: boolean
  error: string | undefined
  describedBy: string
}

/**
 * The field of one cell. Memoised: its props are the values the application gave for this cell,
 * so a change elsewhere in a long grid does not render its field again (P5.18: 300 lines).
 */
const GridCellEditor = memo(function GridCellEditor(props: CellProps) {
  const { messages, format } = useLiro()
  const { api, column, rowId } = props
  const label = <CellName rowId={rowId} header={column.header} />
  const common = {
    label,
    readOnly: props.readOnly,
    ...(props.describedBy === '' ? {} : { describedBy: props.describedBy }),
    ...(props.error === undefined ? {} : { error: props.error }),
  }
  const change = (value: unknown) => {
    api.change(rowId, column.id, value)
  }
  const validity = (valid: boolean) => {
    api.validity(rowId, column.id, valid)
  }
  const field = () => {
    switch (column.type) {
      case 'text':
        return <TextField {...common} value={props.value as string} onChange={change} />
      case 'number':
        return (
          <NumberField
            {...common}
            value={props.value as string | null}
            onChange={change}
            onValidityChange={validity}
            {...(column.decimals === undefined ? {} : { decimals: column.decimals })}
          />
        )
      case 'select':
        return (
          <SelectField
            {...common}
            options={column.options}
            value={props.value as string}
            onChange={change}
          />
        )
      case 'taxCategory':
        return (
          <SelectField
            {...common}
            options={column.categories.map((category) => ({
              value: category.value,
              label: taxCategoryText(category, (rate) => format.percent(rate)),
            }))}
            value={props.value as string}
            onChange={change}
          />
        )
      case 'unit':
        return (
          <SelectField
            {...common}
            options={column.units}
            value={props.value as string}
            onChange={change}
          />
        )
      case 'combobox':
        return (
          <ComboboxField
            {...common}
            options={props.options ?? []}
            value={props.value as ComboboxOption | null}
            onChange={change}
            {...(column.onSearch === undefined
              ? {}
              : {
                  onSearch: (query: string) => {
                    api.search(rowId, column.id, query)
                  },
                })}
            loading={props.loading}
          />
        )
      case 'lookup': {
        const value = props.value as LookupOption | null
        const kind = lookupKindLabel(value, column.kinds, messages['lookup.oneOffKind'])
        const { create } = column
        return (
          <div className="flex min-w-0 items-center">
            <LookupField
              {...common}
              className="min-w-0 flex-1"
              value={value}
              results={props.results ?? []}
              loading={props.loading}
              onChange={change}
              onSearch={(query) => {
                api.search(rowId, column.id, query)
              }}
              {...(column.recent === undefined ? {} : { recent: column.recent })}
              {...(column.kinds === undefined ? {} : { kinds: column.kinds })}
              {...(column.allowOneOff === undefined ? {} : { allowOneOff: column.allowOneOff })}
              {...(create === undefined
                ? {}
                : {
                    create: create.kinds,
                    onCreate: (kindKey: string, query: string) => {
                      api.create(rowId, column.id, kindKey, query)
                    },
                  })}
              {...(column.onSearchAll === undefined
                ? {}
                : {
                    onSearchAll: (query: string) => {
                      api.searchAll(rowId, column.id, query)
                    },
                  })}
            />
            {/* The record's kind, small and secondary (P5.18: words, no colour). */}
            {kind !== undefined && (
              <span
                data-slot="line-kind"
                className={cn('shrink-0 ps-1 pe-1 text-xs text-secondary', TEXT_DIRECTION)}
              >
                {kind}
              </span>
            )}
          </div>
        )
      }
      case 'date':
        return (
          <DateField
            {...common}
            value={props.value as string | null}
            onChange={change}
            onValidityChange={validity}
          />
        )
      case 'display':
        return null
    }
  }
  return (
    <EntryDraftSlot.Provider value={{ drafts: api.drafts, key: `${rowId}\n${column.id}` }}>
      {field()}
    </EntryDraftSlot.Provider>
  )
}, sameCell)

/**
 * Whether a cell's field must render again. Every prop is compared as it is, except the column:
 * an application that builds its columns again on each change (their `display` functions read
 * its state) gives a new object each time, so the column is compared by what its field shows —
 * the row functions are not the cell's (the grid calls them and passes the values).
 */
function sameCell(previous: CellProps, next: CellProps): boolean {
  return (
    previous.api === next.api &&
    previous.rowId === next.rowId &&
    Object.is(previous.value, next.value) &&
    previous.options === next.options &&
    previous.results === next.results &&
    previous.loading === next.loading &&
    previous.readOnly === next.readOnly &&
    previous.error === next.error &&
    previous.describedBy === next.describedBy &&
    sameEditor(previous.column, next.column)
  )
}

/** Two columns draw the same field: the same kind, heading and choices. */
function sameEditor(a: CellColumn, b: CellColumn): boolean {
  if (a === b) return true
  if (a.id !== b.id || a.header !== b.header) return false
  switch (a.type) {
    case 'text':
    case 'date':
      return b.type === a.type
    case 'number':
      return b.type === 'number' && a.decimals === b.decimals
    case 'select':
      return b.type === 'select' && a.options === b.options
    case 'taxCategory':
      return b.type === 'taxCategory' && a.categories === b.categories
    case 'unit':
      return b.type === 'unit' && a.units === b.units
    case 'combobox':
      return b.type === 'combobox' && (a.onSearch === undefined) === (b.onSearch === undefined)
    case 'lookup':
      return (
        b.type === 'lookup' &&
        a.recent === b.recent &&
        a.kinds === b.kinds &&
        a.allowOneOff === b.allowOneOff &&
        (a.onSearchAll === undefined) === (b.onSearchAll === undefined) &&
        a.create?.kinds === b.create?.kinds
      )
    case 'display':
      return b.type === 'display'
  }
}

/** The values a cell takes from its row (the column's row functions, called by the grid). */
function cellValues<Row>(column: EditableGridColumn<Row>, row: Row) {
  switch (column.type) {
    case 'combobox':
      return {
        value: column.value(row),
        options: typeof column.options === 'function' ? column.options(row) : column.options,
        results: undefined,
        loading: column.loading?.(row) === true,
      }
    case 'lookup':
      return {
        value: column.value(row),
        options: undefined,
        results: column.results(row),
        loading: column.loading?.(row) === true,
      }
    case 'display':
      return { value: null, options: undefined, results: undefined, loading: false }
    default:
      return { value: column.value(row), options: undefined, results: undefined, loading: false }
  }
}

/**
 * Lines of a document or journal entry, entered from the keyboard. Controlled: the application
 * keeps the rows, adds and removes them when asked, computes totals and checks; the grid shows.
 */
export function EditableGrid<Row>(props: EditableGridProps<Row>) {
  const { messages, direction, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const inCard = props.inCard === true
  const rootRef = useRef<HTMLDivElement>(null)
  const idBase = useId()
  const pending = useRef<{ row: number; column: number } | null>(null)
  const [unreadable, setUnreadable] = useState<Readonly<Record<string, boolean>>>({})
  // Each total's pending start and reserved width, kept while the layout changes (see
  // SettlingMemory).
  const pendingSince = useRef(new Map<string, number>()).current
  const totalWidths = useRef(new Map<string, number>()).current
  // The latest props, for the cells' stable callbacks (read in events, after the render).
  const latest = useRef(props)
  useLayoutEffect(() => {
    latest.current = props
  })
  // "+ Create …": the line and column it was chosen in, the kind and the text typed.
  const [creating, setCreating] = useState<{
    rowId: string
    columnId: string
    kind: LookupCreateKind
    query: string
  } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [api] = useState<GridApi>(() => ({
    // Typed text of the number and date cells, kept while the layout changes (EntryDraftSlot).
    drafts: new Map<string, EntryDraft>(),
    change: (rowId, columnId, value) => {
      latest.current.onCellChange(rowId, columnId, value)
    },
    validity: (rowId, columnId, valid) => {
      setUnreadable((current) =>
        current[`${rowId}\n${columnId}`] === !valid
          ? current
          : { ...current, [`${rowId}\n${columnId}`]: !valid },
      )
    },
    search: (rowId, columnId, query) => {
      const column = latest.current.columns.find((each) => each.id === columnId)
      if (column?.type === 'combobox' || column?.type === 'lookup') column.onSearch?.(rowId, query)
    },
    searchAll: (rowId, columnId, query) => {
      const column = latest.current.columns.find((each) => each.id === columnId)
      if (column?.type === 'lookup') column.onSearchAll?.(rowId, query)
    },
    create: (rowId, columnId, kindKey, query) => {
      const column = latest.current.columns.find((each) => each.id === columnId)
      if (column?.type !== 'lookup') return
      const kind = column.create?.kinds.find((each) => each.kind === kindKey)
      if (kind === undefined) return
      setCreating({ rowId, columnId, kind, query })
      setCreateOpen(true)
    },
  }))
  const { rows, columns } = props
  const editable = columns.filter(isEditable)
  const minRows = props.minRows ?? 1
  const canAdd = props.maxRows === undefined || rows.length < props.maxRows
  const canRemove = rows.length > minRows
  const lineCount = rows.length
  const rowType = (row: Row): LineType => props.getRowType?.(row) ?? 'line'
  const hasText = props.lineText !== undefined
  const rowCells = rows.map((row) => editableCellCount(rowType(row), editable.length, hasText))
  // The one field of a text line and of a heading, as a column of its own.
  const lineText = props.lineText
  const spanColumns = useMemo(
    () =>
      lineText === undefined
        ? undefined
        : {
            text: {
              id: lineText.columnId,
              header: messages['grid.textCell'],
              type: 'text' as const,
              value: lineText.value,
            } satisfies EditableGridColumn<Row>,
            heading: {
              id: lineText.columnId,
              header: messages['grid.headingCell'],
              type: 'text' as const,
              value: lineText.value,
            } satisfies EditableGridColumn<Row>,
          },
    [lineText, messages],
  )

  const focusCell = (row: number, column: number) => focusCellIn(rootRef.current, row, column)

  // After a row is added or removed, the focus goes where the action asked, once the rows arrive.
  useEffect(() => {
    const target = pending.current
    if (target === null) return
    pending.current = null
    focusCellIn(rootRef.current, target.row, target.column)
  }, [lineCount])

  // The cell that has the focus, kept while the layout changes between the table and the cards
  // (a resize across 48em, a rotated tablet): the old cell's field leaves the page with the focus,
  // and the same cell of the new layout takes it back, with the same selection. A focus anywhere
  // else forgets it. In a full line, its column is also the one Enter keeps (`preferred`).
  const focused = useRef<{ row: number; column: number; element: Element } | null>(null)
  const preferred = useRef(0)
  // The focused line, which a long grid always draws (with its neighbours).
  const [focusRow, setFocusRow] = useState<number | null>(null)
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const cell =
        rootRef.current?.contains(target) === true ? target?.closest('[data-grid-row]') : null
      if (cell === null || cell === undefined || target === null) {
        focused.current = null
        if (rootRef.current?.contains(target) !== true) setFocusRow(null)
        return
      }
      const row = Number(cell.getAttribute('data-grid-row'))
      const column = Number(cell.getAttribute('data-grid-column'))
      focused.current = { row, column, element: target }
      setFocusRow(row)
      if (cell.getAttribute('data-grid-span') === null) preferred.current = column
    }
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [])
  const shownPhone = useRef(phone)
  useLayoutEffect(() => {
    if (shownPhone.current === phone) return
    shownPhone.current = phone
    const last = focused.current
    if (last === null || last.element.isConnected) return
    const active = document.activeElement
    if (active !== null && active !== document.body) return
    const target = focusCellIn(rootRef.current, last.row, last.column)
    if (target instanceof HTMLInputElement && last.element instanceof HTMLInputElement) {
      const { selectionStart, selectionEnd, selectionDirection } = last.element
      if (selectionStart !== null && selectionEnd !== null) {
        target.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? 'none')
      }
    }
  }, [phone])

  // The on-screen keyboard shows "next" on every field of the grid (set once per field: an
  // attribute written again would make the browser recalculate the styles of a long grid).
  useEffect(() => {
    rootRef.current
      ?.querySelectorAll('[data-grid-row] input:not([type="hidden"]):not([enterkeyhint])')
      .forEach((input) => {
        input.setAttribute('enterkeyhint', 'next')
      })
  })

  const run = (action: GridAction, type: LineType = 'line') => {
    if (action === null) return
    if (action.type === 'focus') {
      focusCell(action.row, action.column)
    } else if (action.type === 'add') {
      pending.current = { row: action.at, column: action.column }
      props.onAddRow(action.at, type)
    } else {
      const row = rows[action.row]
      if (row === undefined) return
      if (action.focusRow !== null)
        pending.current = { row: action.focusRow, column: action.column }
      props.onRemoveRow(props.getRowId(row))
    }
  }

  const removeRow = (rowIndex: number) => {
    const action = gridKeyAction(
      { key: 'Delete', shift: false, mod: true, alt: false },
      {
        row: rowIndex,
        column: 0,
        rowCount: rows.length,
        columnCount: editable.length,
        canAdd,
        canRemove,
        phone,
        rowCells,
      },
    )
    run(action)
  }

  const onCellKey = (event: KeyboardEvent<HTMLElement>, row: number, column: number) => {
    // Keys from an open list or calendar (rendered elsewhere) and keys a field used are theirs.
    if (event.defaultPrevented) return
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return
    const action = gridKeyAction(
      {
        key: event.key,
        shift: event.shiftKey,
        mod: event.ctrlKey || event.metaKey,
        alt: event.altKey,
      },
      {
        row,
        column,
        rowCount: rows.length,
        columnCount: editable.length,
        canAdd,
        canRemove,
        phone,
        rowCells,
        preferredColumn: (rowCells[row] ?? 0) > 1 ? column : preferred.current,
      },
    )
    if (action === null) return
    event.preventDefault()
    event.stopPropagation()
    run(action)
  }

  /** The keys of a cell, in a table cell and in a phone card. */
  const cellKeys = (row: number, column: number) => ({
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
      // A closed select opens on Enter in Radix; in the grid Enter moves (Space, Alt+ArrowDown or
      // the arrows open it).
      if (
        event.key === 'Enter' &&
        event.target instanceof Element &&
        event.target.closest('[data-slot="select-trigger"]') !== null &&
        event.target.getAttribute('aria-expanded') !== 'true'
      ) {
        onCellKey(event, row, column)
      }
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      onCellKey(event, row, column)
    },
  })

  /** The field of a cell, with the values its column gives for the row. */
  const editor = (
    column: EditableGridColumn<Row>,
    row: Row,
    rowIndex: number,
    describedBy: string,
  ) => {
    const rowId = props.getRowId(row)
    const errorText = (props.messages?.[rowId] ?? []).find(
      (message) => message.tone === 'danger' && message.columns?.includes(column.id) === true,
    )?.text
    const values = cellValues(column, row)
    return (
      <GridCellEditor
        api={api}
        column={column}
        rowId={rowId}
        value={values.value}
        options={values.options}
        results={values.results}
        loading={values.loading}
        readOnly={column.readOnly?.(row) === true}
        error={errorText}
        describedBy={describedBy}
      />
    )
  }

  /** The row's messages: the application's, then a line for each unreadable cell of the grid's own. */
  const rowMessages = (row: Row): GridMessage[] => {
    const rowId = props.getRowId(row)
    const own: GridMessage[] = editable.flatMap((column) =>
      unreadable[`${rowId}\n${column.id}`] === true
        ? [
            {
              tone: 'danger' as const,
              text: messages['grid.cellMessage'](
                column.header,
                column.type === 'date'
                  ? messages['field.invalidDate']
                  : messages['field.invalidNumber'],
              ),
              columns: [column.id],
            },
          ]
        : [],
    )
    return orderMessages([...(props.messages?.[rowId] ?? []), ...own])
  }

  /** A row's id, its notes (details, then messages) and the ids that describe its fields. */
  const rowParts = (row: Row) => {
    const rowId = props.getRowId(row)
    const notes: RowNote[] = [
      ...(props.details?.[rowId] ?? []).map((detail, index): RowNote => ({
        kind: 'detail',
        id: `${idBase}-${rowId}-d${String(index)}`,
        detail,
      })),
      ...rowMessages(row).map((message, index): RowNote => ({
        kind: 'message',
        id: `${idBase}-${rowId}-${String(index)}`,
        message,
      })),
    ]
    return { rowId, notes, describedBy: notes.map((note) => note.id).join(' ') }
  }

  const removeLabel = (rowIndex: number) =>
    messages['grid.removeLine'](rowIndex + 1, format.number(String(rowIndex + 1)))

  // The rows' numbers by id; a new map only when the rows' order or number changes.
  const rowIds = rows.map((row) => props.getRowId(row))
  const idsKey = rowIds.join('\n')
  const lineNumbers = useMemo(
    () => new Map(idsKey === '' ? [] : idsKey.split('\n').map((id, index) => [id, index + 1])),
    [idsKey],
  )

  // ── The row window of a long grid (TanStack Virtual, virtual-rows.ts) ──
  // The grid scrolls with the page (or any scrolling container around it), not in a box of its
  // own (`observeViewport`, `observeOffsetInPage`). Heights are measured once drawn (a line and
  // its notes, a card and its gap), estimated before; the focused line is always drawn.
  const virtual = props.virtualize ?? rows.length >= VIRTUALIZE_FROM
  const gap = phone && !inCard ? 12 : 0
  const lineEstimate = phone
    ? 60 + 58 * editable.length + 40 * (columns.length - editable.length) + gap
    : 37
  const estimate = (row: Row): number => {
    const type = rowType(row)
    if (!phone) return 37
    if (type === 'subtotal') return 40 + 24 * (columns.length - editable.length) + gap
    if (type === 'text' || type === 'heading') return 110 + gap
    return lineEstimate
  }
  const bodyRef = useRef<HTMLElement | null>(null)
  const setBody = (element: HTMLElement | null) => {
    bodyRef.current = element
  }
  // Sizes are kept by line id and layout (a table row and a card differ).
  const ids = useMemo(() => (idsKey === '' ? [] : idsKey.split('\n')), [idsKey])
  const layout = phone ? 'card' : 'row'
  const getItemKey = useCallback(
    (index: number) => `${layout}:${ids[index] ?? String(index)}`,
    [ids, layout],
  )
  const rangeExtractor = useCallback((range: Range) => keepFocusedRow(range, focusRow), [focusRow])
  const virtualizer = useVirtualizer<HTMLElement, HTMLElement>({
    count: rows.length,
    getScrollElement: () => bodyRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      return row === undefined ? lineEstimate : estimate(row)
    },
    getItemKey,
    // 600px above and below the view (virtual-rows.ts), as lines.
    overscan: overscanRows(lineEstimate),
    rangeExtractor,
    enabled: virtual,
    observeElementRect: observeViewport,
    observeElementOffset: observeOffsetInPage,
    scrollToFn: scrollWithPage,
    // Before the grid is placed (and on the server), assume a screen's height from its top.
    initialRect: { width: 0, height: 900 },
  })
  // A line measured above the view moves the page's content, and the browser keeps the view in
  // place itself (scroll anchoring); TanStack Virtual's own correction would count it twice.
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = keepScrollOnResize
  // The drawn rows' heights (a line and its notes, a card and its gap), by line.
  useLayoutEffect(() => {
    if (!virtual) return
    const root = rootRef.current
    if (root === null) return
    const sizes = new Map<string, number>()
    root.querySelectorAll<HTMLElement>('[data-row-key]').forEach((element) => {
      const key = element.getAttribute('data-row-key') ?? ''
      sizes.set(key, (sizes.get(key) ?? gap) + element.getBoundingClientRect().height)
    })
    const known = virtualizer.measurementsCache
    sizes.forEach((size, key) => {
      const line = lineNumbers.get(key)
      if (line === undefined) return
      const current = known[line - 1]?.size
      if (current === undefined || Math.abs(current - size) > 0.5) {
        virtualizer.resizeItem(line - 1, size)
      }
    })
  })
  // The lines drawn, each with the empty height before it (a spacer), and the height after them.
  const drawn = virtual ? virtualizer.getVirtualItems() : []
  const spacers = virtual
    ? spacersBetween(drawn, virtualizer.getTotalSize())
    : { before: [], after: 0 }
  const shown = virtual
    ? drawn.flatMap((item, at) => {
        const row = rows[item.index]
        return row === undefined
          ? []
          : [{ row, rowIndex: item.index, before: spacers.before[at] ?? 0 }]
      })
    : rows.map((row, rowIndex) => ({ row, rowIndex, before: 0 }))
  // aria-rowindex and aria-rowcount, so assistive technology hears the whole table.
  const aria = virtual
    ? ariaRowIndexes(
        rows.map(
          (row) =>
            (props.details?.[props.getRowId(row)]?.length ?? 0) + rowMessages(row).length > 0,
        ),
        1,
        props.totals !== undefined && Object.keys(props.totals).length > 0 ? 1 : 0,
      )
    : undefined

  const hasTotals = props.totals !== undefined && Object.keys(props.totals).length > 0
  const minWidth = columns.reduce((sum, column) => sum + (column.width ?? 120), 0) + 44
  // A subtotal's text spans the columns before the first value column.
  const firstDisplay = columns.findIndex((column) => column.type === 'display')
  const labelSpan = firstDisplay <= 0 ? columns.length : firstDisplay

  const table = () => (
    <div className="overflow-x-auto">
      <table
        aria-label={props.label}
        {...(aria === undefined ? {} : { 'aria-rowcount': aria.count })}
        className="w-full table-fixed border-collapse text-sm"
        style={{ minWidth }}
      >
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.id}
              {...(column.width === undefined ? {} : { style: { width: column.width } })}
            />
          ))}
          <col style={{ width: 44 }} />
        </colgroup>
        <thead>
          <tr {...(aria === undefined ? {} : { 'aria-rowindex': 1 })}>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  CELL_BORDER,
                  'bg-surface-sunken px-2 py-2 align-bottom font-semibold break-words',
                  column.type === 'number' || (column.type === 'display' && column.align === 'end')
                    ? 'text-end'
                    : 'text-start',
                )}
              >
                <span className={TEXT_ISOLATE}>{column.header}</span>
              </th>
            ))}
            <td className={cn(CELL_BORDER, 'bg-surface-sunken')} />
          </tr>
        </thead>
        <tbody ref={setBody}>
          {/* One flat list of keyed rows: an array per line would be keyed by its position, and
              a line inserted at the top would mount every line after it again (P5.18). */}
          {shown.flatMap(({ row, rowIndex, before }) => {
            const type = rowType(row)
            const { rowId, notes, describedBy } = rowParts(row)
            // The lines not drawn before this one.
            const spacer =
              before > 0 ? (
                <tr key={`${rowId}-spacer`} aria-hidden="true" data-slot="grid-spacer">
                  <td
                    colSpan={columns.length + 1}
                    className="border-0 p-0"
                    style={{ height: before }}
                  />
                </tr>
              ) : null
            const index = aria?.indexes[rowIndex]
            const rowAria = (extra = 0) =>
              index === undefined ? {} : { 'aria-rowindex': index + extra }
            const notesRow =
              notes.length > 0 ? (
                <tr
                  key={`${rowId}-messages`}
                  data-slot="grid-messages"
                  data-row-key={rowId}
                  {...rowAria(1)}
                >
                  <td colSpan={columns.length + 1} className={cn(CELL_BORDER, 'px-2 py-1')}>
                    <NoteList notes={notes} />
                  </td>
                </tr>
              ) : null
            if (type === 'subtotal') {
              return [
                spacer,
                <tr
                  key={rowId}
                  data-row-id={rowId}
                  data-row-key={rowId}
                  data-row-type={type}
                  {...rowAria()}
                >
                  <td
                    colSpan={labelSpan}
                    className={cn(
                      CELL_BORDER,
                      'border-t-strong px-2 py-2 text-end font-semibold break-words',
                    )}
                  >
                    <span className={TEXT_ISOLATE}>{props.lineText?.value(row)}</span>
                  </td>
                  {columns.slice(labelSpan).map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        CELL_BORDER,
                        'border-t-strong px-2 py-2 align-middle font-semibold break-words',
                        column.type === 'display' && column.align === 'end'
                          ? 'text-end'
                          : 'text-start',
                        column.type === 'display' && column.numeric === true && 'tabular-nums',
                      )}
                    >
                      {column.type === 'display' ? column.display(row) : null}
                    </td>
                  ))}
                  <td className={cn(CELL_BORDER, 'border-t-strong')} />
                </tr>,
                notesRow,
              ]
            }
            const span = type === 'text' || type === 'heading' ? spanColumns?.[type] : undefined
            return [
              spacer,
              <tr
                key={rowId}
                data-row-id={rowId}
                data-row-key={rowId}
                data-row-type={type}
                {...rowAria()}
              >
                {span !== undefined ? (
                  <td
                    colSpan={columns.length}
                    data-slot="grid-cell"
                    data-grid-row={rowIndex}
                    data-grid-column={0}
                    data-grid-span=""
                    data-column-id={span.id}
                    data-align="start"
                    className={cn(
                      CELL_BORDER,
                      'p-1 align-middle',
                      SPAN_TEXT[span === spanColumns?.text ? 'text' : 'heading'],
                    )}
                    {...cellKeys(rowIndex, 0)}
                  >
                    {editor(span, row, rowIndex, describedBy)}
                  </td>
                ) : (
                  (() => {
                    let editIndex = -1
                    return columns.map((column) => {
                      if (column.type === 'display') {
                        return (
                          <td
                            key={column.id}
                            className={cn(
                              CELL_BORDER,
                              'px-2 py-1 align-middle break-words',
                              column.align === 'end' ? 'text-end' : 'text-start',
                              column.numeric === true && 'tabular-nums',
                            )}
                          >
                            {column.display(row)}
                          </td>
                        )
                      }
                      editIndex += 1
                      const at = editIndex
                      return (
                        <td
                          key={column.id}
                          data-slot="grid-cell"
                          data-grid-row={rowIndex}
                          data-grid-column={at}
                          data-column-id={column.id}
                          data-align={column.type === 'number' ? 'end' : 'start'}
                          className={cn(CELL_BORDER, 'p-1 align-middle')}
                          {...cellKeys(rowIndex, at)}
                        >
                          {editor(column, row, rowIndex, describedBy)}
                        </td>
                      )
                    })
                  })()
                )}
                <td className={cn(CELL_BORDER, 'p-1 text-center align-middle')}>
                  <CompactIconButton
                    intent="cancel"
                    label={removeLabel(rowIndex)}
                    disabled={!canRemove}
                    onClick={() => {
                      removeRow(rowIndex)
                    }}
                  />
                </td>
              </tr>,
              notesRow,
            ]
          })}
          {spacers.after > 0 && (
            <tr aria-hidden="true" data-slot="grid-spacer">
              <td
                colSpan={columns.length + 1}
                className="border-0 p-0"
                style={{ height: spacers.after }}
              />
            </tr>
          )}
        </tbody>
        {hasTotals && (
          <tfoot>
            <tr {...(aria === undefined ? {} : { 'aria-rowindex': aria.count })}>
              {columns.map((column, index) => {
                const total = props.totals?.[column.id]
                return (
                  <td
                    key={column.id}
                    className={cn(
                      CELL_BORDER,
                      'border-t-2 border-t-strong bg-surface-sunken px-2 py-2 font-semibold',
                      total === undefined ? 'text-start' : 'text-end',
                    )}
                  >
                    {total !== undefined ? (
                      <Total
                        total={total}
                        since={{ since: pendingSince, widest: totalWidths, key: column.id }}
                      />
                    ) : index === 0 ? (
                      props.totalsLabel
                    ) : null}
                  </td>
                )
              })}
              <td className={cn(CELL_BORDER, 'border-t-2 border-t-strong bg-surface-sunken')} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )

  /** A card's place in the whole list, when only a window of the cards is drawn. */
  const cardAria = (rowIndex: number) =>
    virtual ? { 'aria-setsize': rows.length, 'aria-posinset': rowIndex + 1 } : {}

  const cardClass = (extra?: string) =>
    cn(
      'flex flex-col gap-3 bg-surface-raised',
      inCard
        ? 'border-0 border-b border-solid border-subtle px-4 py-3'
        : 'rounded-md border border-solid border-default p-3',
      extra,
    )

  const removeButton = (rowIndex: number) => (
    <div className="flex justify-end">
      <ActionButton
        small
        action={{
          family: 'destructive',
          icon: Trash2,
          emphasis: 'menu',
          label: removeLabel(rowIndex),
        }}
        disabled={!canRemove}
        onClick={() => {
          removeRow(rowIndex)
        }}
      />
    </div>
  )

  const cards = () => (
    <>
      {(hasTotals || props.footer !== undefined) && (
        <div
          data-slot="grid-totals"
          className={cn(
            'sticky top-0 z-(--liro-layer-sticky) flex flex-col gap-1 bg-surface-raised text-sm',
            inCard
              ? 'border-0 border-b border-solid border-default px-4 py-2'
              : 'rounded-md border border-solid border-default p-2',
          )}
        >
          {props.totalsLabel !== undefined && (
            <span className={cn('text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
              {props.totalsLabel}
            </span>
          )}
          {hasTotals && (
            <dl className="m-0 flex flex-col gap-1">
              {columns.map((column) => {
                const total = props.totals?.[column.id]
                if (total === undefined) return null
                return (
                  <div key={column.id} className="flex items-baseline justify-between gap-4">
                    <dt className={cn('text-secondary', TEXT_DIRECTION)}>{column.header}</dt>
                    <dd className="m-0 font-semibold">
                      <Total
                        total={total}
                        since={{ since: pendingSince, widest: totalWidths, key: column.id }}
                      />
                    </dd>
                  </div>
                )
              })}
            </dl>
          )}
          {props.footer !== undefined && <div>{props.footer}</div>}
        </div>
      )}
      <ul
        ref={setBody}
        aria-label={props.label}
        className={cn('m-0 flex list-none flex-col p-0', !inCard && 'gap-3')}
      >
        {shown.flatMap(({ row, rowIndex, before }) => {
          const type = rowType(row)
          const { rowId, notes, describedBy } = rowParts(row)
          // The cards not drawn before this one; the list's gap follows the spacer.
          const spacer =
            before > 0 ? (
              <li
                key={`${rowId}-spacer`}
                aria-hidden="true"
                data-slot="grid-spacer"
                style={{ height: Math.max(0, before - gap) }}
              />
            ) : null
          if (type === 'subtotal') {
            // The text and the amounts, semibold, with the rule above (no field, no remove).
            return [
              spacer,
              <li
                key={rowId}
                data-row-id={rowId}
                data-row-key={rowId}
                data-row-type={type}
                {...cardAria(rowIndex)}
                className={cardClass('gap-1 border-t border-t-strong text-sm font-semibold')}
              >
                <span className={cn('text-end', TEXT_DIRECTION)}>{props.lineText?.value(row)}</span>
                {columns.map((column) =>
                  column.type === 'display' ? (
                    <div
                      key={column.id}
                      className="flex items-baseline justify-between gap-4 font-semibold"
                    >
                      <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>
                        {column.header}
                      </span>
                      <span className={cn(column.numeric === true && 'tabular-nums')}>
                        {column.display(row)}
                      </span>
                    </div>
                  ) : null,
                )}
                {notes.length > 0 && <NoteList notes={notes} />}
              </li>,
            ]
          }
          const span = type === 'text' || type === 'heading' ? spanColumns?.[type] : undefined
          if (span !== undefined) {
            return [
              spacer,
              <li
                key={rowId}
                data-row-id={rowId}
                data-row-key={rowId}
                data-row-type={type}
                {...cardAria(rowIndex)}
                className={cardClass()}
              >
                <div
                  data-slot="grid-card-cell"
                  data-grid-row={rowIndex}
                  data-grid-column={0}
                  data-grid-span=""
                  data-column-id={span.id}
                  className={cn(
                    'flex flex-col gap-0.5',
                    SPAN_TEXT[span === spanColumns?.text ? 'text' : 'heading'],
                  )}
                  {...cellKeys(rowIndex, 0)}
                >
                  <span aria-hidden="true" className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>
                    {span.header}
                  </span>
                  {editor(span, row, rowIndex, describedBy)}
                </div>
                {notes.length > 0 && <NoteList notes={notes} />}
                {removeButton(rowIndex)}
              </li>,
            ]
          }
          let editIndex = -1
          return [
            spacer,
            <li
              key={rowId}
              data-row-id={rowId}
              data-row-key={rowId}
              data-row-type={type}
              {...cardAria(rowIndex)}
              className={cardClass()}
            >
              {columns.map((column) => {
                if (column.type === 'display') {
                  return (
                    <div key={column.id} className="flex flex-col gap-0.5">
                      <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>
                        {column.header}
                      </span>
                      <div className={cn('text-sm', column.numeric === true && 'tabular-nums')}>
                        {column.display(row)}
                      </div>
                    </div>
                  )
                }
                editIndex += 1
                const at = editIndex
                return (
                  <div
                    key={column.id}
                    data-slot="grid-card-cell"
                    data-grid-row={rowIndex}
                    data-grid-column={at}
                    data-column-id={column.id}
                    className="flex flex-col gap-0.5"
                    {...cellKeys(rowIndex, at)}
                  >
                    {/* The field's own name is "Quantity, line 3" (screen readers); this is the visible one. */}
                    <span
                      aria-hidden="true"
                      className={cn('text-xs text-tertiary', TEXT_DIRECTION)}
                    >
                      {column.header}
                    </span>
                    {editor(column, row, rowIndex, describedBy)}
                  </div>
                )
              })}
              {notes.length > 0 && <NoteList notes={notes} />}
              {removeButton(rowIndex)}
            </li>,
          ]
        })}
        {spacers.after > 0 && (
          <li
            aria-hidden="true"
            data-slot="grid-spacer"
            style={{ height: Math.max(0, spacers.after - gap) }}
          />
        )}
      </ul>
    </>
  )

  const addTypes = props.addTypes ?? []
  const addTypeLabel: Record<AddableLineType, string> = {
    text: messages['grid.addText'],
    heading: messages['grid.addHeading'],
    discount: messages['grid.addDiscount'],
    deduction: messages['grid.addDeduction'],
  }
  const addLine = (type: LineType) => {
    run({ type: 'add', at: rows.length, column: 0 }, type)
  }

  // "+ Create …": the panel for the line it was chosen in.
  const createColumn =
    creating === null ? undefined : columns.find((column) => column.id === creating.columnId)
  const createConfig = createColumn?.type === 'lookup' ? createColumn.create : undefined

  return (
    <div
      ref={rootRef}
      data-slot="editable-grid"
      data-grid-direction={direction}
      className={cn(
        'flex min-w-0 flex-col gap-2 font-sans text-primary',
        inCard && (phone ? 'gap-3 pb-4' : 'gap-3 p-4'),
        props.className,
      )}
    >
      <LineNumbers.Provider value={lineNumbers}>{phone ? cards() : table()}</LineNumbers.Provider>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3',
          inCard && phone && 'px-4',
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          {addTypes.length === 0 ? (
            <ActionButton
              action={{
                family: 'neutral',
                icon: Plus,
                emphasis: 'secondary',
                label: messages['grid.addLine'],
              }}
              disabled={!canAdd}
              onClick={() => {
                addLine('line')
              }}
            />
          ) : (
            <SplitAction
              family="neutral"
              icon={Plus}
              emphasis="secondary"
              label={messages['grid.addLine']}
              disabled={!canAdd}
              onClick={() => {
                addLine('line')
              }}
              entries={addTypes.map((type) => ({
                label: addTypeLabel[type],
                onSelect: () => {
                  addLine(type)
                },
              }))}
            />
          )}
          {!phone && (
            <span className="flex flex-wrap items-center gap-3 text-xs text-secondary">
              <span className="flex items-center gap-1">
                {messages['grid.insertLine']}
                <ShortcutHint keys={[messages['grid.modifierKey'], messages['grid.enterKey']]} />
              </span>
              <span className="flex items-center gap-1">
                {messages['grid.deleteLine']}
                <ShortcutHint keys={[messages['grid.modifierKey'], messages['grid.deleteKey']]} />
              </span>
            </span>
          )}
        </div>
        {!phone && props.footer !== undefined && <div className="ms-auto">{props.footer}</div>}
      </div>
      {creating !== null && createConfig !== undefined && (
        <LookupCreateDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          kind={creating.kind}
          initialName={creating.query}
          units={createConfig.units}
          taxCategories={createConfig.taxCategories}
          currency={createConfig.currency}
          {...(createConfig.defaultUnit === undefined
            ? {}
            : { defaultUnit: createConfig.defaultUnit })}
          {...(createConfig.defaultTaxCategory === undefined
            ? {}
            : { defaultTaxCategory: createConfig.defaultTaxCategory })}
          {...(createConfig.errors === undefined ? {} : { errors: createConfig.errors })}
          onCreate={(draft) => createConfig.onCreate(creating.rowId, draft)}
          onCreated={(option) => {
            props.onCellChange(creating.rowId, creating.columnId, option)
          }}
          onCloseFocus={() => {
            const row = Array.from(rootRef.current?.querySelectorAll('[data-row-id]') ?? []).find(
              (element) => element.getAttribute('data-row-id') === creating.rowId,
            )
            row
              ?.querySelector<HTMLElement>(
                `[data-column-id="${creating.columnId}"] input:not([type="hidden"])`,
              )
              ?.focus()
          }}
        />
      )}
    </div>
  )
}

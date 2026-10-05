import { CircleAlert, Plus, Trash2, TriangleAlert } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
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
import {
  gridKeyAction,
  orderMessages,
  type GridAction,
  type GridMessage,
} from './editable-grid-logic'
import { ShortcutHint } from './navigation'
import { NumberField } from './number-field'
import { SelectField, type SelectOption } from './select-field'
import { SettlingSince, SettlingValue } from './settling-value'
import { TextField } from './text-field'
import { EntryDraftSlot, type EntryDraft } from './use-entry'
import { usePhone } from './use-phone'

/*
 * EditableGrid (BUILD-PLAN P3.4): a keyboard-first line editor for document lines and journal
 * entries. Owner's decisions (2026-10-01, docs/decisions.md "Editable grid"):
 * - Cells are always fields, as in the old grid: the Design System's own fields (TextField,
 *   NumberField, SelectField, ComboboxField, DateField) without their frames, inside a table with
 *   1px border.default lines, the header on surface.sunken, 4px cell padding, numbers at the end
 *   with tabular digits. The focused cell: an inset 1px border.focus line and surface.hover (not
 *   the old blue surface.selected: blue is for actions and focus). A 44px end column holds the
 *   row's remove (×) button. The frames are taken off in styles.css ("grid-cell").
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
 */

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
  /** A cell's new value: text, a decimal string or null, an option value, an option, a date. */
  onCellChange: (rowId: string, columnId: string, value: unknown) => void
  /** Insert a new, empty row at this index. */
  onAddRow: (index: number) => void
  onRemoveRow: (rowId: string) => void
  /** The fewest rows; the last ones cannot be removed. Default: 1. */
  minRows?: number
  /** The most rows; no row can be added beyond it. */
  maxRows?: number
  /** Errors and warnings by row id, from the application. */
  messages?: Readonly<Record<string, readonly GridMessage[]>>
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
  className?: string
}

/** Literal classes, so Tailwind finds them. */
const CELL_BORDER = 'border border-solid border-default'
const MESSAGE_TONE = {
  danger: { text: 'text-status-danger-fg', Icon: CircleAlert },
  warning: { text: 'text-status-warning-fg', Icon: TriangleAlert },
} as const

/** The first control of a cell that takes the focus. */
const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), button:not([disabled])'

function isEditable<Row>(column: EditableGridColumn<Row>): boolean {
  return column.type !== 'display'
}

function Total({
  total,
  since,
}: {
  total: GridTotal
  since: { since: Map<string, number>; key: string }
}) {
  return (
    <SettlingSince.Provider value={since}>
      <SettlingValue
        value={total.value}
        {...(total.pending === undefined ? {} : { pending: total.pending })}
        {...(total.currency === undefined ? {} : { currency: total.currency })}
        {...(total.decimals === undefined ? {} : { decimals: total.decimals })}
      />
    </SettlingSince.Provider>
  )
}

function MessageList({ list, ids }: { list: readonly GridMessage[]; ids: readonly string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {list.map((message, index) => {
        const tone = MESSAGE_TONE[message.tone]
        return (
          <li
            key={index}
            id={ids[index]}
            className={cn('flex items-start gap-1 text-xs leading-tight', tone.text)}
          >
            <tone.Icon aria-hidden="true" className="mt-px size-3 shrink-0" />
            <span className={TEXT_DIRECTION}>{message.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Lines of a document or journal entry, entered from the keyboard. Controlled: the application
 * keeps the rows, adds and removes them when asked, computes totals and checks; the grid shows.
 */
export function EditableGrid<Row>(props: EditableGridProps<Row>) {
  const { messages, direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const rootRef = useRef<HTMLDivElement>(null)
  const idBase = useId()
  const pending = useRef<{ row: number; column: number } | null>(null)
  const [unreadable, setUnreadable] = useState<Readonly<Record<string, boolean>>>({})
  // Typed text of the number and date cells, kept while the layout changes (see EntryDraftSlot).
  const drafts = useRef(new Map<string, EntryDraft>()).current
  // Since when each total is pending, kept while the layout changes (see SettlingSince).
  const pendingSince = useRef(new Map<string, number>()).current
  const { rows, columns } = props
  const editable = columns.filter(isEditable)
  const minRows = props.minRows ?? 1
  const canAdd = props.maxRows === undefined || rows.length < props.maxRows
  const canRemove = rows.length > minRows
  const lineCount = rows.length

  const focusCell = (row: number, column: number) => {
    const cell = rootRef.current?.querySelector(
      `[data-grid-row="${String(row)}"][data-grid-column="${String(column)}"]`,
    )
    const target = cell?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
    if (target instanceof HTMLInputElement) target.select()
    return target
  }

  // After a row is added or removed, the focus goes where the action asked, once the rows arrive.
  useEffect(() => {
    const target = pending.current
    if (target === null) return
    pending.current = null
    focusCell(target.row, target.column)
  }, [lineCount])

  // The cell that has the focus, kept while the layout changes between the table and the cards
  // (a resize across 48em, a rotated tablet): the old cell's field leaves the page with the focus,
  // and the same cell of the new layout takes it back, with the same selection. A focus anywhere
  // else forgets it.
  const focused = useRef<{ row: number; column: number; element: Element } | null>(null)
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const cell =
        rootRef.current?.contains(target) === true ? target?.closest('[data-grid-row]') : null
      focused.current =
        cell === null || cell === undefined || target === null
          ? null
          : {
              row: Number(cell.getAttribute('data-grid-row')),
              column: Number(cell.getAttribute('data-grid-column')),
              element: target,
            }
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
    const target = focusCell(last.row, last.column)
    if (target instanceof HTMLInputElement && last.element instanceof HTMLInputElement) {
      const { selectionStart, selectionEnd, selectionDirection } = last.element
      if (selectionStart !== null && selectionEnd !== null) {
        target.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? 'none')
      }
    }
  }, [phone])

  // The on-screen keyboard shows "next" on every field of the grid.
  useEffect(() => {
    rootRef.current
      ?.querySelectorAll('[data-grid-row] input:not([type="hidden"])')
      .forEach((input) => {
        input.setAttribute('enterkeyhint', 'next')
      })
  })

  const run = (action: GridAction) => {
    if (action === null) return
    if (action.type === 'focus') {
      focusCell(action.row, action.column)
    } else if (action.type === 'add') {
      pending.current = { row: action.at, column: action.column }
      props.onAddRow(action.at)
    } else {
      const row = rows[action.row]
      if (row === undefined) return
      if (action.focusRow !== null)
        pending.current = { row: action.focusRow, column: action.column }
      props.onRemoveRow(props.getRowId(row))
    }
  }

  const removeRow = (rowIndex: number) => {
    run({
      type: 'remove',
      row: rowIndex,
      focusRow: rowIndex < rows.length - 1 ? rowIndex : rowIndex - 1,
      column: 0,
    })
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

  const editor = (column: EditableGridColumn<Row>, row: Row, rowIndex: number, ids: string) => {
    const rowId = props.getRowId(row)
    const label = (
      <span className="sr-only">{messages['grid.cell'](column.header, rowIndex + 1)}</span>
    )
    const readOnly = column.readOnly?.(row) === true
    const errorText = (props.messages?.[rowId] ?? []).find(
      (message) => message.tone === 'danger' && message.columns?.includes(column.id) === true,
    )?.text
    const common = {
      label,
      readOnly,
      ...(ids === '' ? {} : { describedBy: ids }),
      ...(errorText === undefined ? {} : { error: errorText }),
    }
    const change = (value: unknown) => {
      props.onCellChange(rowId, column.id, value)
    }
    const validity = (valid: boolean) => {
      setUnreadable((current) => ({ ...current, [`${rowId}\n${column.id}`]: !valid }))
    }
    const field = () => {
      switch (column.type) {
        case 'text':
          return <TextField {...common} value={column.value(row)} onChange={change} />
        case 'number':
          return (
            <NumberField
              {...common}
              value={column.value(row)}
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
              value={column.value(row)}
              onChange={change}
            />
          )
        case 'combobox': {
          const options =
            typeof column.options === 'function' ? column.options(row) : column.options
          const search = column.onSearch
          return (
            <ComboboxField
              {...common}
              options={options}
              value={column.value(row)}
              onChange={change}
              {...(search === undefined
                ? {}
                : {
                    onSearch: (query: string) => {
                      search(rowId, query)
                    },
                  })}
              loading={column.loading?.(row) === true}
            />
          )
        }
        case 'date':
          return (
            <DateField
              {...common}
              value={column.value(row)}
              onChange={change}
              onValidityChange={validity}
            />
          )
        case 'display':
          return null
      }
    }
    return (
      <EntryDraftSlot.Provider
        value={{
          drafts,
          key: `${rowId}
${column.id}`,
        }}
      >
        {field()}
      </EntryDraftSlot.Provider>
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

  /** A row's id, messages and the ids that describe its fields. */
  const rowParts = (row: Row) => {
    const rowId = props.getRowId(row)
    const list = rowMessages(row)
    const messageIds = list.map((_, index) => `${idBase}-${rowId}-${String(index)}`)
    return { rowId, list, messageIds, describedBy: messageIds.join(' ') }
  }

  const hasTotals = props.totals !== undefined && Object.keys(props.totals).length > 0
  const minWidth = columns.reduce((sum, column) => sum + (column.width ?? 120), 0) + 44

  const table = () => (
    <div className="overflow-x-auto">
      <table
        aria-label={props.label}
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
          <tr>
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
        <tbody>
          {rows.map((row, rowIndex) => {
            const { rowId, list, messageIds, describedBy } = rowParts(row)
            let editIndex = -1
            return [
              <tr key={rowId} data-row-id={rowId}>
                {columns.map((column) => {
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
                      data-align={column.type === 'number' ? 'end' : 'start'}
                      className={cn(CELL_BORDER, 'p-1 align-middle')}
                      {...cellKeys(rowIndex, at)}
                    >
                      {editor(column, row, rowIndex, describedBy)}
                    </td>
                  )
                })}
                <td className={cn(CELL_BORDER, 'p-1 text-center align-middle')}>
                  <CompactIconButton
                    intent="cancel"
                    label={messages['grid.removeLine'](rowIndex + 1)}
                    disabled={!canRemove}
                    onClick={() => {
                      removeRow(rowIndex)
                    }}
                  />
                </td>
              </tr>,
              list.length > 0 ? (
                <tr key={`${rowId}-messages`} data-slot="grid-messages">
                  <td colSpan={columns.length + 1} className={cn(CELL_BORDER, 'px-2 py-1')}>
                    <MessageList list={list} ids={messageIds} />
                  </td>
                </tr>
              ) : null,
            ]
          })}
        </tbody>
        {hasTotals && (
          <tfoot>
            <tr>
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
                      <Total total={total} since={{ since: pendingSince, key: column.id }} />
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

  const cards = () => (
    <>
      {(hasTotals || props.footer !== undefined) && (
        <div
          data-slot="grid-totals"
          className="sticky top-0 z-(--liro-layer-sticky) flex flex-col gap-1 rounded-md border border-solid border-default bg-surface-raised p-2 text-sm"
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
                      <Total total={total} since={{ since: pendingSince, key: column.id }} />
                    </dd>
                  </div>
                )
              })}
            </dl>
          )}
          {props.footer !== undefined && <div>{props.footer}</div>}
        </div>
      )}
      <ul aria-label={props.label} className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((row, rowIndex) => {
          const { rowId, list, messageIds, describedBy } = rowParts(row)
          let editIndex = -1
          return (
            <li
              key={rowId}
              data-row-id={rowId}
              className="flex flex-col gap-3 rounded-md border border-solid border-default bg-surface-raised p-3"
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
              {list.length > 0 && <MessageList list={list} ids={messageIds} />}
              <div className="flex justify-end">
                <ActionButton
                  small
                  action={{
                    family: 'destructive',
                    icon: Trash2,
                    emphasis: 'menu',
                    label: messages['grid.removeLine'](rowIndex + 1),
                  }}
                  disabled={!canRemove}
                  onClick={() => {
                    removeRow(rowIndex)
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )

  return (
    <div
      ref={rootRef}
      data-slot="editable-grid"
      data-grid-direction={direction}
      className={cn('flex min-w-0 flex-col gap-2 font-sans text-primary', props.className)}
    >
      {phone ? cards() : table()}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            small
            action={{
              family: 'primary',
              icon: Plus,
              emphasis: 'secondary',
              label: messages['grid.addLine'],
            }}
            disabled={!canAdd}
            onClick={() => {
              run({ type: 'add', at: rows.length, column: 0 })
            }}
          />
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
    </div>
  )
}

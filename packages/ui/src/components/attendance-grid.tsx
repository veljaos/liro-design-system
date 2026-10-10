import { useVirtualizer, type Range } from '@tanstack/react-virtual'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eraser,
  Lock,
  PaintBucket,
  Pencil,
} from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { BUTTON_RESET, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  Dialog as DialogRoot,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { ActionButton, UnavailableAction } from './actions'
import {
  attendanceKeyAction,
  cellRange,
  clearCells,
  copyPreviousWeek,
  entryOf,
  fillRange,
  inRange,
  isDayCell,
  markColumn,
  markRow,
  rangeIds,
  rangeSize,
  changeCells,
  sameEntry,
  stepPerson,
  weekdayOf,
  withCode,
  type AttendanceChange,
  type AttendanceColumnKind,
  type AttendanceEntry,
  type AttendanceValue,
  type AttendanceCell,
  type AttendancePosition,
} from './attendance-logic'
import { Button, CompactIconButton, IconButton } from './button'
import { LazyDropdownMenu, type MenuEntry } from './dropdown-menu'
import { EmptyState } from './empty-state'
import { ShortcutHint } from './navigation'
import { NumberField } from './number-field'
import { Tooltip } from './popover'
import { Skeleton } from './progress'
import { SelectField } from './select-field'
import { StatusBadge, type Tone } from './status-badge'
import { TextAreaField } from './text-field'
import { usePhone } from './use-phone'
import { keepFocusedRow, overscanRows, spacersBetween } from './virtual-rows'

/*
 * AttendanceGrid (BUILD-PLAN P5.13 attendance and quick marking, P5.24 a and c working time; one
 * pattern by the owner's decision, 2026-10-10): people × days (or lessons), each cell a code and,
 * in the hours mode, hours, entered from the keyboard. The codes, their keys and tones, the
 * totals, the marks, the lock, the corrections and the hand-off are the application's data; the
 * grid shows them and reports changes (`onChange` with the list of changes). It computes nothing:
 * the totals come from props, hours are decimal strings read by `format.parseNumber`, and
 * unreadable hours stay in the cell with the field's message, never 0 (D4, B.4).
 * - A WAI-ARIA grid (`role="grid"`, one cell in the tab order): the column headers, the row
 *   headers, the day cells and the totals are all cells the arrows reach (the forward arrow in the
 *   reading direction to the next column, B.7); Home and End to the row's ends, Ctrl+Home and
 *   Ctrl+End to the corners. Shift with an arrow (or a press with Shift) selects a range.
 * - Code mode (P5.13: present / absent / late / excused, a gradebook's marks): a code's key marks
 *   the focused cell and moves on (`advance`: down the column by default) or marks the whole
 *   selection; a column header's menu "Mark everyone: <code>", a row header's "Mark all: <code>"
 *   (weekends and holidays left as they are); Delete clears; Enter moves down as in EditableGrid.
 * - Hours mode (P5.24a, a timesheet): a digit starts typing the hours (Enter or F2 edits them), a
 *   code's key sets the code; Ctrl/Cmd+D fills the selection with its first cell's entry; "Copy
 *   previous week" copies the week before the focused cell's week onto it for the selected rows
 *   (days of the same kind only). Typing hours into an empty cell gives it `defaultCode`.
 * - The toolbar above the grid repeats every key as a button (pointer and touch users, and the
 *   keys shown as ShortcutHint), so nothing needs the keyboard and nothing needs a drag.
 * - Weekends and holidays are shaded with surface.sunken, never by colour alone: a holiday
 *   column carries a visible mark (and its note in the tooltip and for assistive technology), a
 *   day column its weekday.
 * - The selection is neutral (D17): surface.selected with a 1px border.selected line inside each
 *   selected cell; the focused cell has the focus colour's inset outline.
 * - Locked (P5.24a: the month locks after payroll): a lock line with the reason; cells read-only;
 *   a change only through `onCorrect` — a dialog that asks for the new entry and a required
 *   reason. The original is kept by the application; a corrected cell carries a hollow marker,
 *   who, when and why (`corrections`) in its description and tooltip, and the corrections are
 *   listed under the grid. Never deleted.
 * - Marks (P5.24c, a shift allowance): a small filled dot in the cell, their labels in its
 *   description and tooltip. Night hours are one more total the application passes.
 * - Hand-off (to payroll): an action with its state; unavailable with its reason (P2.7).
 * - Many rows (`virtualize`, by default from 100): only the rows in view are drawn (TanStack
 *   Virtual with the shared window rules of `virtual-rows.ts`) inside `maxHeight`.
 * - Phones (`layout="phone"`, by default below 48em): one person per screen — Previous, "3 of
 *   12", Next and a chooser —, that person's totals, then the days as a list, each day's entry
 *   editable with the Design System's fields.
 */

/** A row: a person. */
export interface AttendanceRow {
  id: string
  label: string
  /** A second line (a class, a job title). */
  description?: string
}

/** A column: a day of a month or a lesson. */
export interface AttendanceColumn {
  id: string
  /** The header's text ("1", "3rd lesson"). */
  label: string
  /** YYYY-MM-DD: the weekday is shown under the label, and "Copy previous week" finds weeks. */
  date?: string
  /** Default 'normal'. Weekends and holidays are shaded and named. */
  kind?: AttendanceColumnKind
  /** What the day is (a holiday's name), in the tooltip and for assistive technology. */
  note?: string
}

/** A code a cell can hold, from the application. */
export interface AttendanceCode {
  code: string
  /** Its name ("Present", "Annual leave"). */
  label: string
  /** Its short form, shown in the cell ("P", "AL"). */
  short: string
  /** The one key that gives it ("p"; "1" for a mark in the code mode). */
  key?: string
  /** A tone for the short form; none is neutral text. */
  tone?: Tone
}

/** A mark on a cell (a shift allowance), from the application. */
export interface AttendanceMark {
  label: string
}

/** A correction of a locked cell, from the application: the original kept, who, when and why. */
export interface AttendanceCorrection {
  original: AttendanceEntry | null
  by: string
  /** An instant (ISO 8601), written by `format.dateTime`. */
  at: string
  reason: string
}

/** What the correction dialog reports. */
export interface AttendanceCorrectionRequest extends AttendanceChange {
  reason: string
}

/** A total line, from the application: a total column after the days, or a totals row under them. */
export interface AttendanceTotal {
  id: string
  label: string
  /** A short header for a total column. Default: `label`. */
  short?: string
  decimals?: number
}

/** Totals from the application: which ones, and their values (decimal strings; null shows "—"). */
export interface AttendanceTotals {
  totals: readonly AttendanceTotal[]
  /** Row totals: row id → total id → value. Column totals: total id → column id → value. */
  values: Readonly<Record<string, Readonly<Record<string, string | null>>>>
}

/** The hand-off (to payroll): an action and its state. */
export interface AttendanceHandOff {
  state: 'open' | 'done'
  /** The action ("Send to payroll"). */
  label: string
  /** The state once done ("Sent to payroll on 03.11.2026."). */
  doneText: string
  onHandOff?: () => void
  /** Why it cannot be done now: shown beside it and in a tooltip. */
  unavailableReason?: string
}

/** A locked grid: why, and who locked it. */
export interface AttendanceLock {
  reason: string
  detail?: string
}

export interface AttendanceGridProps {
  /** The grid's accessible name ("October 2026 timesheet"). */
  label: string
  rows: readonly AttendanceRow[]
  columns: readonly AttendanceColumn[]
  codes: readonly AttendanceCode[]
  /** 'code' (default): a cell holds a code. 'hours': hours and a code. */
  mode?: 'code' | 'hours'
  value: AttendanceValue
  onChange?: (changes: AttendanceChange[]) => void
  /** The header of the row headers ("Pupil", "Employee"). Default: `messages['attendance.rows']`. */
  rowsLabel?: string
  /** Hours typed into a cell without a code give it this code (regular work). */
  defaultCode?: string
  /** Where marking moves the focus. Default: 'down' in the code mode, 'forward' in the hours mode. */
  advance?: 'down' | 'forward'
  /** Total columns after the days, per row. */
  rowTotals?: AttendanceTotals
  /** Totals rows under the people, per column. */
  columnTotals?: AttendanceTotals
  /** Marks by row and column id. */
  marks?: Readonly<Record<string, Readonly<Record<string, readonly AttendanceMark[]>>>>
  /** Locked: read-only, changed only through `onCorrect`. */
  locked?: AttendanceLock
  /** A locked cell's correction: the new entry and its reason. */
  onCorrect?: (request: AttendanceCorrectionRequest) => void | Promise<void>
  /** Corrections by row and column id. */
  corrections?: Readonly<Record<string, Readonly<Record<string, AttendanceCorrection>>>>
  handOff?: AttendanceHandOff
  /** The first load: skeleton rows. */
  loading?: boolean
  /** No rows: the empty state's title. Default: the provider's. */
  empty?: ReactNode
  /** Forces the table or the phone list; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /** Draws only the rows in view. Default: from 100 rows. */
  virtualize?: boolean
  /** The height the grid scrolls in (CSS length). Default: none, or 70vh when virtualized. */
  maxHeight?: string
  /** A selection shown from the start (cells by row and column id). */
  defaultSelection?: {
    anchor: { row: string; column: string }
    focus: { row: string; column: string }
  }
  /** The correction dialog open from the start, for this cell. */
  defaultCorrecting?: { row: string; column: string }
  /** Phones: the person shown first. Default: the first. */
  defaultRow?: string
  /** False while a cell holds hours that cannot be read: the application blocks saving. */
  onValidityChange?: (valid: boolean) => void
  className?: string
}

/** From this many rows on, the grid draws only its window. */
export const ATTENDANCE_VIRTUALIZE_FROM = 100

/** A day row's height (owner's 44px table rows). */
const ROW_HEIGHT = 44

/** The tone of a code's short form (text and background); literal classes for Tailwind. */
const TONE_CHIP: Record<Tone, string> = {
  success: 'bg-status-success-bg text-status-success-fg',
  warning: 'bg-status-warning-bg text-status-warning-fg',
  danger: 'bg-status-danger-bg text-status-danger-fg',
  info: 'bg-status-info-bg text-status-info-fg',
  neutral: 'bg-status-neutral-bg text-status-neutral-fg',
  premium: 'bg-status-premium-bg text-status-premium-fg',
}

const CELL_LINES = 'border-0 border-b border-e border-solid border-subtle'
const FOCUS_CELL =
  'outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-solid focus:outline-focus'
const SELECTED = 'bg-surface-selected shadow-[inset_0_0_0_1px_var(--liro-border-selected)]'

function key(row: string, column: string): string {
  return `${row}\u0000${column}`
}

/** The record without these keys. */
function without(
  record: Readonly<Record<string, string>>,
  keys: readonly string[],
): Record<string, string> {
  return Object.fromEntries(Object.entries(record).filter(([each]) => !keys.includes(each)))
}

/** The text of an entry, for assistive technology and the corrections: "8 h, Regular work". */
function useEntryText() {
  const { messages, format } = useLiro()
  return (entry: AttendanceEntry | null, codes: readonly AttendanceCode[]): string => {
    const parts: string[] = []
    const hours = entry?.hours ?? null
    if (hours !== null) parts.push(messages['attendance.hours'](format.number(hours)))
    const code = codes.find((each) => each.code === entry?.code)
    if (code !== undefined) parts.push(code.label)
    else if (entry?.code != null) parts.push(entry.code)
    return parts.length === 0 ? messages['attendance.noEntry'] : parts.join(', ')
  }
}

/** A column's name: its label with the weekday ("Thu 1"), for menus, phones and dialogs. */
function useColumnName() {
  const { format } = useLiro()
  return (column: AttendanceColumn): string =>
    column.date === undefined
      ? column.label
      : `${format.weekdayName(weekdayOf(column.date), 'short')} ${column.label}`
}

/** What a column's kind adds to its name: "Weekend", "Holiday: Armistice Day". */
function useKindText() {
  const { messages } = useLiro()
  return (column: AttendanceColumn): string | null => {
    const kind = column.kind ?? 'normal'
    if (kind === 'normal') return column.note ?? null
    const name =
      kind === 'weekend' ? messages['attendance.weekend'] : messages['attendance.holiday']
    return column.note === undefined ? name : `${name}: ${column.note}`
  }
}

/** A people × days grid of codes (and hours), entered from the keyboard. */
export function AttendanceGrid(props: AttendanceGridProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [correcting, setCorrecting] = useState<{ row: string; column: string } | null>(
    props.defaultCorrecting ?? null,
  )
  const [invalid, setInvalid] = useState<Readonly<Record<string, string>>>({})
  const onValidity = props.onValidityChange
  const valid = Object.keys(invalid).length === 0
  const reported = useRef(true)
  useEffect(() => {
    if (reported.current === valid) return
    reported.current = valid
    onValidity?.(valid)
  }, [valid, onValidity])

  if (props.loading === true) return <Loading {...props} />
  if (props.rows.length === 0) {
    return (
      <div data-slot="attendance-grid" className={cn('font-sans', props.className)}>
        <LockLine {...props} />
        <EmptyState {...(props.empty === undefined ? {} : { title: props.empty })} />
      </div>
    )
  }
  const correctingRow = props.rows.find((row) => row.id === correcting?.row)
  const correctingColumn = props.columns.find((column) => column.id === correcting?.column)
  return (
    <div
      data-slot="attendance-grid"
      data-layout={phone ? 'phone' : 'desktop'}
      className={cn('flex min-w-0 flex-col gap-3 font-sans text-sm text-primary', props.className)}
    >
      <LockLine {...props} />
      {phone ? (
        <PhoneView
          {...props}
          invalid={invalid}
          setInvalid={setInvalid}
          onAskCorrection={setCorrecting}
        />
      ) : (
        <DesktopView
          {...props}
          invalid={invalid}
          setInvalid={setInvalid}
          onAskCorrection={setCorrecting}
        />
      )}
      <CorrectionList {...props} />
      {correctingRow !== undefined && correctingColumn !== undefined && (
        <CorrectionDialog
          {...props}
          row={correctingRow}
          column={correctingColumn}
          onClose={() => {
            setCorrecting(null)
          }}
        />
      )}
    </div>
  )
}

interface ViewProps extends AttendanceGridProps {
  invalid: Readonly<Record<string, string>>
  setInvalid: (
    update: (current: Readonly<Record<string, string>>) => Record<string, string>,
  ) => void
  onAskCorrection: (cell: { row: string; column: string }) => void
}

/** The lock line: a lock, "Locked", the reason and who locked it. */
function LockLine(props: AttendanceGridProps) {
  const { messages } = useLiro()
  if (props.locked === undefined) return null
  return (
    <div
      data-slot="attendance-lock"
      className="flex items-start gap-2 rounded-md border border-solid border-default bg-surface-sunken px-4 py-3"
    >
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
      <p className="m-0 flex min-w-0 flex-col gap-0.5">
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {messages['attendance.locked']}
        </span>
        <span className={cn('text-sm text-primary', TEXT_DIRECTION)}>{props.locked.reason}</span>
        {props.locked.detail !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
            {props.locked.detail}
          </span>
        )}
      </p>
    </div>
  )
}

/** The hand-off: the action, unavailable with its reason, or its state once done. */
function HandOff({ handOff }: { handOff: AttendanceHandOff | undefined }) {
  if (handOff === undefined) return null
  if (handOff.state === 'done') {
    return <StatusBadge tone="success" label={handOff.doneText} />
  }
  if (handOff.unavailableReason !== undefined) {
    return (
      <UnavailableAction
        intent="confirm"
        label={handOff.label}
        reason={handOff.unavailableReason}
      />
    )
  }
  return (
    <Button
      intent="confirm"
      label={handOff.label}
      {...(handOff.onHandOff === undefined ? {} : { onClick: handOff.onHandOff })}
    />
  )
}

/** A code's short form, in its tone. */
function CodeChip({ code, className }: { code: AttendanceCode; className?: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 text-xs font-semibold',
        code.tone === undefined ? 'text-primary' : TONE_CHIP[code.tone],
        className,
      )}
    >
      {code.short}
    </span>
  )
}

/** The desktop grid with its toolbar. */
function DesktopView(props: ViewProps) {
  const { messages, format, direction, weekStartsOn } = useLiro()
  const entryText = useEntryText()
  const columnName = useColumnName()
  const kindText = useKindText()
  const mode = props.mode ?? 'code'
  const hoursMode = mode === 'hours'
  const editable = props.locked === undefined && props.onChange !== undefined
  const correctable = props.locked !== undefined && props.onCorrect !== undefined
  const people = props.rows.length
  const days = props.columns.length
  const rowTotals = props.rowTotals?.totals ?? []
  const columnTotals = props.columnTotals?.totals ?? []
  const tableRows = 1 + people + columnTotals.length
  const tableColumns = 1 + days + rowTotals.length
  const rowIds = props.rows.map((row) => row.id)
  const columnIds = props.columns.map((column) => column.id)
  const instructionsId = useId()

  const indexOf = (cell: { row: string; column: string } | undefined): AttendanceCell | null => {
    if (cell === undefined) return null
    const row = rowIds.indexOf(cell.row)
    const column = columnIds.indexOf(cell.column)
    return row < 0 || column < 0 ? null : { row, column }
  }
  const initialFocus = indexOf(props.defaultSelection?.focus) ?? { row: 0, column: 0 }
  const [active, setActive] = useState<AttendancePosition>({
    row: initialFocus.row + 1,
    column: initialFocus.column + 1,
  })
  const [dayFocus, setDayFocus] = useState<AttendanceCell>(initialFocus)
  const [anchor, setAnchor] = useState<AttendanceCell | null>(
    indexOf(props.defaultSelection?.anchor),
  )
  const [shown, setShown] = useState(props.defaultSelection !== undefined)
  const [editing, setEditing] = useState<{ row: number; column: number; text: string } | null>(null)
  const [scheduledFocus, setScheduledFocus] = useState(0)
  const table = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // Rows and columns may change under the focus: keep it inside.
  const safeDay: AttendanceCell = {
    row: Math.min(dayFocus.row, Math.max(people - 1, 0)),
    column: Math.min(dayFocus.column, Math.max(days - 1, 0)),
  }
  const range = cellRange(anchor ?? safeDay, safeDay)
  const ranged = rangeSize(range) > 1

  // A move asks for the focus; it is given once the cell is drawn (a row far away in a long
  // grid is drawn on this render: the window keeps the focused row).
  const pendingFocus = useRef<AttendancePosition | null>(null)
  const focusCell = useCallback((cell: AttendancePosition) => {
    pendingFocus.current = cell
    setActive(cell)
    setScheduledFocus((count) => count + 1)
  }, [])
  useLayoutEffect(() => {
    const cell = pendingFocus.current
    if (cell === null) return
    pendingFocus.current = null
    table.current
      ?.querySelector<HTMLElement>(`[data-pos="${String(cell.row)}:${String(cell.column)}"]`)
      ?.focus()
  }, [scheduledFocus])

  const report = (changes: AttendanceChange[]) => {
    if (changes.length > 0) props.onChange?.(changes)
  }
  const targets = () =>
    ranged
      ? rangeIds(range, rowIds, columnIds)
      : rangeIds(cellRange(safeDay, safeDay), rowIds, columnIds)
  const mark = (code: string | null) => {
    report(changeCells(props.value, targets(), withCode(code)))
  }
  const clear = () => {
    report(clearCells(props.value, targets(), hoursMode))
    const cleared = targets().map((cell) => key(cell.row, cell.column))
    props.setInvalid((current) => without(current, cleared))
  }
  const fill = () => {
    report(fillRange(props.value, rowIds, columnIds, range, anchor ?? safeDay, hoursMode))
  }
  const copyWeek = () => {
    const column = columnIds[safeDay.column]
    if (column === undefined) return
    const rows = rowIds.slice(range.top, range.bottom + 1)
    report(copyPreviousWeek(props.value, rows, props.columns, column, weekStartsOn, hoursMode))
  }

  const moveTo = (cell: AttendancePosition, extend: boolean) => {
    if (isDayCell(cell, people, days)) {
      const day = { row: cell.row - 1, column: cell.column - 1 }
      if (extend) setAnchor((current) => current ?? safeDay)
      else setAnchor(null)
      setDayFocus(day)
    }
    focusCell(cell)
  }

  /** Commits typed hours: read by `format.parseNumber`; unreadable text stays, marked invalid. */
  const commit = (cell: AttendanceCell, text: string) => {
    const row = rowIds[cell.row]
    const column = columnIds[cell.column]
    if (row === undefined || column === undefined) return
    const trimmed = text.trim()
    const hours = trimmed === '' ? null : format.parseNumber(trimmed)
    const id = key(row, column)
    if (trimmed !== '' && hours === null) {
      props.setInvalid((current) => ({ ...current, [id]: text }))
      return
    }
    props.setInvalid((current) => without(current, [id]))
    const previous = entryOf(props.value, row, column)
    const code = previous?.code ?? (hours === null ? null : (props.defaultCode ?? null))
    const entry: AttendanceEntry = { code, hours }
    if (!sameEntry(previous, entry)) report([{ row, column, entry, previous }])
  }

  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (editing !== null) return
    if (!(event.target instanceof Element) || event.target.closest('[data-pos]') === null) return
    const action = attendanceKeyAction(
      {
        key: event.key,
        shift: event.shiftKey,
        mod: event.ctrlKey || event.metaKey,
        alt: event.altKey,
      },
      {
        at: active,
        rows: tableRows,
        columns: tableColumns,
        people,
        days,
        direction,
        mode,
        codes: props.codes,
        editable,
        correctable,
        advance: props.advance ?? (hoursMode ? 'forward' : 'down'),
        ranged,
      },
    )
    if (action === null) return
    event.preventDefault()
    event.stopPropagation()
    setShown(true)
    switch (action.type) {
      case 'move':
        moveTo(action.to, false)
        return
      case 'extend':
        moveTo(action.to, true)
        return
      case 'mark':
        mark(action.code)
        if (action.to !== null) moveTo(action.to, false)
        return
      case 'clear':
        clear()
        return
      case 'fill':
        fill()
        return
      case 'edit': {
        const row = rowIds[safeDay.row]
        const column = columnIds[safeDay.column]
        if (row === undefined || column === undefined) return
        const draft = props.invalid[key(row, column)]
        const hours = entryOf(props.value, row, column)?.hours ?? null
        setEditing({
          ...safeDay,
          text: action.text ?? draft ?? (hours === null ? '' : format.number(hours)),
        })
        return
      }
      case 'correct': {
        const row = rowIds[safeDay.row]
        const column = columnIds[safeDay.column]
        if (row !== undefined && column !== undefined) props.onAskCorrection({ row, column })
        return
      }
    }
  }

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const pos = event.target.closest('[data-pos]')?.getAttribute('data-pos')
    if (pos === undefined || pos === null) return
    const [row = 0, column = 0] = pos.split(':').map(Number)
    setActive({ row, column })
    if (isDayCell({ row, column }, people, days)) setDayFocus({ row: row - 1, column: column - 1 })
    setShown(true)
  }

  const onCellMouseDown = (event: MouseEvent<HTMLElement>, cell: AttendanceCell) => {
    if (event.button !== 0) return
    if (event.shiftKey) {
      // A press with Shift selects from the cell where the selection started.
      event.preventDefault()
      setAnchor((current) => current ?? safeDay)
      setDayFocus(cell)
      focusCell({ row: cell.row + 1, column: cell.column + 1 })
    } else {
      setAnchor(null)
    }
  }

  // ── The row window ──
  const virtual = props.virtualize ?? people >= ATTENDANCE_VIRTUALIZE_FROM
  const focusRow = active.row >= 1 && active.row <= people ? active.row - 1 : null
  const rangeExtractor = useCallback((r: Range) => keepFocusedRow(r, focusRow), [focusRow])
  const virtualizer = useVirtualizer({
    count: people,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: overscanRows(ROW_HEIGHT),
    rangeExtractor,
    enabled: virtual,
    initialRect: { width: 0, height: 720 },
  })
  const items = virtual ? virtualizer.getVirtualItems() : []
  const spacers = virtual
    ? spacersBetween(items, virtualizer.getTotalSize())
    : { before: [], after: 0 }
  const drawn = virtual
    ? items.map((item, at) => ({ index: item.index, before: spacers.before[at] ?? 0 }))
    : props.rows.map((_, index) => ({ index, before: 0 }))
  const maxHeight = props.maxHeight ?? (virtual ? '70vh' : undefined)

  const tabIndex = (cell: AttendancePosition) =>
    cell.row === active.row && cell.column === active.column && editing === null ? 0 : -1
  const pos = (cell: AttendancePosition) => `${String(cell.row)}:${String(cell.column)}`

  // ── The header row ──
  const headerCell = (column: AttendanceColumn, index: number) => {
    const cell = { row: 0, column: index + 1 }
    const kind = column.kind ?? 'normal'
    const extra = kindText(column)
    const content = (
      <>
        <span className={cn('block text-sm font-semibold', TEXT_ISOLATE)}>{column.label}</span>
        {column.date !== undefined && (
          <span className="block text-xs font-normal text-secondary">
            {format.weekdayName(weekdayOf(column.date), 'short')}
          </span>
        )}
        {(kind === 'holiday' || (kind === 'weekend' && column.date === undefined)) && (
          <span aria-hidden="true" className="block text-xs font-semibold text-secondary">
            {kind === 'holiday'
              ? messages['attendance.holidayMark']
              : messages['attendance.weekendMark']}
          </span>
        )}
        {extra !== null && <span className="sr-only">{extra}</span>}
      </>
    )
    const shaded = kind !== 'normal'
    const th = (children: ReactNode, focusable: boolean) => (
      <div
        key={column.id}
        role="columnheader"
        aria-colindex={index + 2}
        {...(focusable ? { 'data-pos': pos(cell), tabIndex: tabIndex(cell) } : {})}
        className={cn(
          'sticky top-0 z-10 h-11 w-11 min-w-11 p-0 text-center align-middle font-sans',
          CELL_LINES,
          'border-b-default',
          shaded ? 'bg-surface-sunken' : 'bg-surface-raised',
          focusable && FOCUS_CELL,
        )}
      >
        {children}
      </div>
    )
    if (!editable) {
      return th(
        <div className="px-0.5 py-1" {...(extra === null ? {} : { title: extra })}>
          {content}
        </div>,
        true,
      )
    }
    const menu: MenuEntry[] = props.codes.map((code) => ({
      label: messages['attendance.markColumn'](code.label),
      onSelect: () => {
        report(markColumn(props.value, rowIds, column.id, code.code))
      },
    }))
    return th(
      <LazyDropdownMenu
        entries={() => menu}
        trigger={
          <button
            type="button"
            data-pos={pos(cell)}
            tabIndex={tabIndex(cell)}
            title={extra ?? undefined}
            className={cn(
              BUTTON_RESET,
              'flex min-h-11 w-full cursor-pointer flex-col items-center justify-center px-0.5 py-1 text-primary hover:bg-surface-hover',
              FOCUS_CELL,
            )}
          >
            {content}
          </button>
        }
      />,
      false,
    )
  }

  // ── A row header ──
  const rowHeader = (row: AttendanceRow, index: number) => {
    const cell = { row: index + 1, column: 0 }
    const text = (
      <span className="flex min-w-0 flex-col text-start">
        <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>{row.label}</span>
        {row.description !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{row.description}</span>
        )}
      </span>
    )
    const base = cn(
      'sticky start-0 z-[5] w-48 min-w-48 max-w-72 bg-surface-raised p-0 text-start align-middle font-normal',
      CELL_LINES,
      'border-e-default',
    )
    if (!editable) {
      return (
        <div
          role="rowheader"
          aria-colindex={1}
          data-pos={pos(cell)}
          tabIndex={tabIndex(cell)}
          className={cn(base, 'px-3 py-1.5', FOCUS_CELL)}
        >
          {text}
        </div>
      )
    }
    const menu: MenuEntry[] = props.codes.map((code) => ({
      label: messages['attendance.markRow'](code.label),
      onSelect: () => {
        report(markRow(props.value, row.id, props.columns, code.code))
      },
    }))
    return (
      <div role="rowheader" aria-colindex={1} className={base}>
        <LazyDropdownMenu
          entries={() => menu}
          trigger={
            <button
              type="button"
              data-pos={pos(cell)}
              tabIndex={tabIndex(cell)}
              className={cn(
                BUTTON_RESET,
                'flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-surface-hover',
                FOCUS_CELL,
              )}
            >
              {text}
              <ChevronDown
                aria-hidden="true"
                className="ms-auto size-3.5 shrink-0 text-secondary"
              />
            </button>
          }
        />
      </div>
    )
  }

  // ── A day cell ──
  const dayCell = (
    row: AttendanceRow,
    rowIndex: number,
    column: AttendanceColumn,
    index: number,
  ) => {
    const cell = { row: rowIndex + 1, column: index + 1 }
    const day = { row: rowIndex, column: index }
    const entry = entryOf(props.value, row.id, column.id)
    const code = props.codes.find((each) => each.code === entry?.code)
    const hours = entry?.hours ?? null
    const draft = props.invalid[key(row.id, column.id)]
    const cellMarks = props.marks?.[row.id]?.[column.id] ?? []
    const correction = props.corrections?.[row.id]?.[column.id]
    const selected = shown && inRange(range, day)
    const isEditing = editing?.row === rowIndex && editing.column === index
    const shaded = (column.kind ?? 'normal') !== 'normal'
    const notes = [
      ...cellMarks.map((each) => each.label),
      ...(correction === undefined
        ? []
        : [
            messages['attendance.corrected'](
              correction.by,
              format.dateTime(correction.at),
              correction.reason,
            ),
            messages['attendance.original'](entryText(correction.original, props.codes)),
          ]),
    ]
    const shownText = draft ?? null
    const td = (
      <div
        key={column.id}
        role="gridcell"
        aria-colindex={index + 2}
        data-pos={pos(cell)}
        tabIndex={tabIndex(cell)}
        {...(editable ? { 'aria-selected': selected } : { 'aria-readonly': true })}
        onMouseDown={(event) => {
          onCellMouseDown(event, day)
        }}
        onDoubleClick={() => {
          if (editable && hoursMode) {
            setEditing({ ...day, text: draft ?? (hours === null ? '' : format.number(hours)) })
          } else if (correctable) {
            props.onAskCorrection({ row: row.id, column: column.id })
          }
        }}
        className={cn(
          'relative h-11 w-11 min-w-11 p-0 text-center align-middle',
          CELL_LINES,
          shaded && 'bg-surface-sunken',
          selected && SELECTED,
          draft !== undefined && 'shadow-[inset_0_0_0_1px_var(--liro-status-danger-fg)]',
          FOCUS_CELL,
        )}
      >
        {isEditing ? (
          <CellEditor
            label={`${row.label}, ${columnName(column)}, ${messages['attendance.hoursLabel']}`}
            text={editing.text}
            onText={(text) => {
              setEditing({ ...editing, text })
            }}
            onLeave={(text) => {
              commit(day, text)
              setEditing(null)
            }}
            onCancel={() => {
              setEditing(null)
              focusCell(cell)
            }}
            onDone={(text, step) => {
              commit(day, text)
              setEditing(null)
              moveTo(
                {
                  row: Math.min(Math.max(cell.row + step.row, 1), people),
                  column: Math.min(Math.max(cell.column + step.column, 1), days),
                },
                false,
              )
            }}
          />
        ) : (
          <>
            <span
              aria-hidden="true"
              className="flex flex-col items-center justify-center gap-0.5 leading-none"
            >
              {shownText !== null ? (
                <span dir="ltr" className="max-w-10 truncate text-xs text-status-danger-fg">
                  {shownText}
                </span>
              ) : (
                <>
                  {hoursMode && hours !== null && (
                    <span dir="ltr" className="text-sm tabular-nums">
                      {format.number(hours)}
                    </span>
                  )}
                  {code !== undefined ? (
                    <CodeChip code={code} className={hoursMode ? 'h-4 font-normal' : undefined} />
                  ) : (
                    entry?.code != null && <span className="text-xs">{entry.code}</span>
                  )}
                </>
              )}
            </span>
            <span className="sr-only">
              {draft === undefined
                ? entryText(entry, props.codes)
                : `${draft}, ${messages['field.invalidNumber']}`}
              {notes.length > 0 && `. ${notes.join('. ')}`}
            </span>
            {cellMarks.length > 0 && (
              <span
                aria-hidden="true"
                data-slot="attendance-mark"
                className="absolute top-1 end-1 size-1.5 rounded-full bg-status-neutral-solid"
              />
            )}
            {correction !== undefined && (
              <span
                aria-hidden="true"
                data-slot="attendance-corrected"
                className="absolute bottom-1 end-1 size-2 rounded-full border border-solid border-strong"
              />
            )}
          </>
        )}
      </div>
    )
    return notes.length > 0 && !isEditing ? (
      <Tooltip key={column.id} label={notes.join(' · ')}>
        {td}
      </Tooltip>
    ) : (
      td
    )
  }

  const totalText = (value: string | null | undefined, total: AttendanceTotal) =>
    value === null || value === undefined
      ? '—'
      : format.number(value, total.decimals === undefined ? {} : { decimals: total.decimals })

  const bodyRow = (index: number, before: number) => {
    const row = props.rows[index]
    if (row === undefined) return null
    return (
      <Fragment key={row.id}>
        {before > 0 && (
          <div aria-hidden="true" className="table-row" style={{ height: before }}>
            <div className="table-cell border-0 p-0" />
          </div>
        )}
        <div
          role="row"
          aria-rowindex={index + 2}
          data-index={index}
          ref={virtual ? virtualizer.measureElement : undefined}
        >
          {rowHeader(row, index)}
          {props.columns.map((column, columnIndex) => dayCell(row, index, column, columnIndex))}
          {rowTotals.map((total, totalIndex) => {
            const cell = { row: index + 1, column: days + 1 + totalIndex }
            return (
              <div
                key={total.id}
                role="gridcell"
                aria-readonly="true"
                aria-colindex={days + 2 + totalIndex}
                data-pos={pos(cell)}
                tabIndex={tabIndex(cell)}
                className={cn(
                  'h-11 min-w-16 bg-surface-sunken px-2 text-end align-middle font-semibold tabular-nums',
                  CELL_LINES,
                  totalIndex === 0 && 'border-s border-s-default',
                  FOCUS_CELL,
                )}
              >
                <bdi>{totalText(props.rowTotals?.values[row.id]?.[total.id], total)}</bdi>
              </div>
            )
          })}
        </div>
      </Fragment>
    )
  }

  const toolbar = (
    <div
      role="toolbar"
      aria-label={props.label}
      className="flex flex-wrap items-center gap-x-2 gap-y-2"
    >
      {editable && (
        <div
          role="group"
          aria-label={messages['attendance.markWith']}
          className="flex flex-wrap items-center gap-2"
        >
          {props.codes.map((code) => (
            <button
              key={code.code}
              type="button"
              onClick={() => {
                setShown(true)
                mark(code.code)
              }}
              className={cn(
                BUTTON_RESET,
                'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-solid border-default bg-surface-raised px-2.5 text-sm text-primary hover:bg-surface-hover',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
              )}
            >
              <CodeChip code={code} />
              <span className={TEXT_DIRECTION}>{code.label}</span>
              {code.key !== undefined && (
                <ShortcutHint keys={[code.key.toUpperCase()]} className="ms-1" />
              )}
            </button>
          ))}
        </div>
      )}
      {editable && (
        <span className="flex flex-wrap items-center gap-2">
          <ActionButton
            action={{ family: 'neutral', icon: Eraser, label: messages['attendance.clear'] }}
            onClick={clear}
          />
          {hoursMode &&
            (ranged ? (
              <ActionButton
                action={{
                  family: 'neutral',
                  icon: PaintBucket,
                  label: messages['attendance.fill'],
                }}
                aria-keyshortcuts="Control+D Meta+D"
                onClick={fill}
              />
            ) : (
              <UnavailableAction
                family="neutral"
                icon={PaintBucket}
                label={messages['attendance.fill']}
                reason={messages['attendance.fillReason']}
              />
            ))}
          {hoursMode && (
            <ShortcutHint keys={[messages['grid.modifierKey'], messages['attendance.fillKey']]} />
          )}
          {hoursMode && (
            <ActionButton
              action={{ family: 'neutral', icon: Copy, label: messages['attendance.copyWeek'] }}
              onClick={copyWeek}
            />
          )}
        </span>
      )}
      {correctable && (
        <ActionButton
          action={{ intent: 'edit', label: messages['attendance.correct'] }}
          onClick={() => {
            const row = rowIds[safeDay.row]
            const column = columnIds[safeDay.column]
            if (row !== undefined && column !== undefined) props.onAskCorrection({ row, column })
          }}
        />
      )}
      {editable && shown && ranged && (
        <span aria-live="polite" className="text-xs text-secondary">
          {messages['attendance.selected'](
            rangeSize(range),
            format.number(String(rangeSize(range))),
          )}
        </span>
      )}
      {props.handOff !== undefined && (
        <span className="ms-auto">
          <HandOff handOff={props.handOff} />
        </span>
      )}
    </div>
  )

  return (
    <>
      {(editable || correctable || props.handOff !== undefined) && toolbar}
      <div
        ref={scroller}
        data-slot="attendance-scroll"
        className="w-fit max-w-full min-w-0 self-start overflow-auto rounded-md border border-solid border-default"
        {...(maxHeight === undefined ? {} : { style: { maxHeight } })}
      >
        <div
          ref={table}
          role="grid"
          aria-label={props.label}
          aria-describedby={instructionsId}
          aria-rowcount={tableRows}
          aria-colcount={tableColumns}
          {...(editable ? { 'aria-multiselectable': true } : { 'aria-readonly': true })}
          onKeyDownCapture={onKeyDownCapture}
          onFocus={onFocus}
          className="table border-separate border-spacing-0 font-sans text-sm text-primary [&_[role=columnheader]]:table-cell [&_[role=gridcell]]:table-cell [&_[role=row]]:table-row [&_[role=rowheader]]:table-cell"
        >
          <div role="rowgroup" className="table-header-group">
            <div role="row" aria-rowindex={1}>
              <div
                role="columnheader"
                aria-colindex={1}
                data-pos="0:0"
                tabIndex={tabIndex({ row: 0, column: 0 })}
                className={cn(
                  'sticky start-0 top-0 z-20 bg-surface-raised px-3 text-start align-bottom text-xs font-semibold text-secondary',
                  CELL_LINES,
                  'border-e-default border-b-default',
                  FOCUS_CELL,
                )}
              >
                <span className={TEXT_ISOLATE}>
                  {props.rowsLabel ?? messages['attendance.rows']}
                </span>
              </div>
              {props.columns.map(headerCell)}
              {rowTotals.map((total, index) => {
                const cell = { row: 0, column: days + 1 + index }
                return (
                  <div
                    key={total.id}
                    role="columnheader"
                    aria-colindex={days + 2 + index}
                    data-pos={pos(cell)}
                    tabIndex={tabIndex(cell)}
                    title={total.short === undefined ? undefined : total.label}
                    className={cn(
                      'sticky top-0 z-10 min-w-16 bg-surface-sunken px-2 text-end align-middle text-xs font-semibold text-secondary',
                      CELL_LINES,
                      'border-b-default',
                      index === 0 && 'border-s border-s-default',
                      FOCUS_CELL,
                    )}
                  >
                    {total.short === undefined ? (
                      <span className={TEXT_ISOLATE}>{total.label}</span>
                    ) : (
                      <abbr title={total.label} className="no-underline">
                        <span aria-hidden="true">{total.short}</span>
                        <span className="sr-only">{total.label}</span>
                      </abbr>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div role="rowgroup" className="table-row-group">
            {drawn.map(({ index, before }) => bodyRow(index, before))}
            {virtual && spacers.after > 0 && (
              <div aria-hidden="true" className="table-row" style={{ height: spacers.after }}>
                <div className="table-cell border-0 p-0" />
              </div>
            )}
          </div>
          {columnTotals.length > 0 && (
            <div role="rowgroup" className="table-footer-group">
              {columnTotals.map((total, totalIndex) => {
                const tableRow = people + 1 + totalIndex
                const head = { row: tableRow, column: 0 }
                return (
                  <div key={total.id} role="row" aria-rowindex={tableRow + 1}>
                    <div
                      role="rowheader"
                      aria-colindex={1}
                      data-pos={pos(head)}
                      tabIndex={tabIndex(head)}
                      className={cn(
                        'sticky start-0 z-[5] bg-surface-sunken px-3 py-2 text-start text-xs font-semibold text-secondary',
                        CELL_LINES,
                        'border-e-default',
                        totalIndex === 0 && 'border-t border-t-strong',
                        FOCUS_CELL,
                      )}
                    >
                      <span className={TEXT_DIRECTION}>{total.label}</span>
                    </div>
                    {props.columns.map((column, index) => {
                      const cell = { row: tableRow, column: index + 1 }
                      return (
                        <div
                          key={column.id}
                          role="gridcell"
                          aria-readonly="true"
                          aria-colindex={index + 2}
                          data-pos={pos(cell)}
                          tabIndex={tabIndex(cell)}
                          className={cn(
                            'h-9 bg-surface-sunken px-0.5 text-center align-middle text-xs font-semibold tabular-nums',
                            CELL_LINES,
                            totalIndex === 0 && 'border-t border-t-strong',
                            FOCUS_CELL,
                          )}
                        >
                          <bdi>
                            {totalText(props.columnTotals?.values[total.id]?.[column.id], total)}
                          </bdi>
                        </div>
                      )
                    })}
                    {rowTotals.map((rowTotal, index) => {
                      const cell = { row: tableRow, column: days + 1 + index }
                      return (
                        <div
                          key={rowTotal.id}
                          role="gridcell"
                          aria-readonly="true"
                          aria-colindex={days + 2 + index}
                          data-pos={pos(cell)}
                          tabIndex={tabIndex(cell)}
                          className={cn(
                            'bg-surface-sunken',
                            CELL_LINES,
                            index === 0 && 'border-s border-s-default',
                            totalIndex === 0 && 'border-t border-t-strong',
                            FOCUS_CELL,
                          )}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <p id={instructionsId} className="sr-only">
        {messages['attendance.instructions']}
      </p>
    </>
  )
}

/** The phone view: one person per screen, the days as a list. */
function PhoneView(props: ViewProps) {
  const { messages, format } = useLiro()
  const columnName = useColumnName()
  const kindText = useKindText()
  const entryText = useEntryText()
  const hoursMode = (props.mode ?? 'code') === 'hours'
  const editable = props.locked === undefined && props.onChange !== undefined
  const correctable = props.locked !== undefined && props.onCorrect !== undefined
  const first = Math.max(
    0,
    props.rows.findIndex((row) => row.id === props.defaultRow),
  )
  const [index, setIndex] = useState(first)
  const current = Math.min(index, props.rows.length - 1)
  const row = props.rows[current]
  if (row === undefined) return null
  const total = props.rows.length
  const codeOptions = props.codes.map((code) => ({
    value: code.code,
    label: `${code.short} · ${code.label}`,
  }))
  const change = (column: string, next: (previous: AttendanceEntry | null) => AttendanceEntry) => {
    const changes = changeCells(props.value, [{ row: row.id, column }], next)
    if (changes.length > 0) props.onChange?.(changes)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <IconButton
          family="neutral"
          icon={ChevronLeft}
          label={messages['attendance.previousRow']}
          disabled={current === 0}
          onClick={() => {
            setIndex(stepPerson(current, -1, total))
          }}
        />
        <SelectField
          className="min-w-0 flex-1"
          label={messages['attendance.chooseRow']}
          description={messages['attendance.position'](
            current + 1,
            format.number(String(current + 1)),
            total,
            format.number(String(total)),
          )}
          options={props.rows.map((each) => ({ value: each.id, label: each.label }))}
          value={row.id}
          onChange={(id) => {
            const next = props.rows.findIndex((each) => each.id === id)
            if (next >= 0) setIndex(next)
          }}
        />
        <IconButton
          family="neutral"
          icon={ChevronRight}
          label={messages['attendance.nextRow']}
          disabled={current === total - 1}
          onClick={() => {
            setIndex(stepPerson(current, 1, total))
          }}
        />
      </div>
      <div>
        <h3 className={cn('m-0 text-md font-semibold text-primary', TEXT_DIRECTION)}>
          {row.label}
        </h3>
        {row.description !== undefined && (
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{row.description}</p>
        )}
      </div>
      {props.rowTotals !== undefined && props.rowTotals.totals.length > 0 && (
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-solid border-default bg-surface-sunken p-3">
          {props.rowTotals.totals.map((each) => {
            const value = props.rowTotals?.values[row.id]?.[each.id] ?? null
            return (
              <div key={each.id} className="flex min-w-0 flex-col gap-0.5">
                <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{each.label}</dt>
                <dd className="m-0 text-md font-semibold tabular-nums">
                  <bdi>
                    {value === null
                      ? '—'
                      : format.number(
                          value,
                          each.decimals === undefined ? {} : { decimals: each.decimals },
                        )}
                  </bdi>
                </dd>
              </div>
            )
          })}
        </dl>
      )}
      {props.handOff !== undefined && (
        <div className="flex flex-wrap">
          <HandOff handOff={props.handOff} />
        </div>
      )}
      <ul aria-label={props.label} className="m-0 flex list-none flex-col p-0">
        {props.columns.map((column) => {
          const entry = entryOf(props.value, row.id, column.id)
          const shaded = (column.kind ?? 'normal') !== 'normal'
          const name = columnName(column)
          const extra = kindText(column)
          const marks = props.marks?.[row.id]?.[column.id] ?? []
          const correction = props.corrections?.[row.id]?.[column.id]
          const code = props.codes.find((each) => each.code === entry?.code)
          return (
            <li
              key={column.id}
              data-kind={column.kind ?? 'normal'}
              className={cn(
                'flex flex-col gap-1 border-0 border-b border-solid border-subtle px-2 py-2',
                shaded && 'bg-surface-sunken',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex w-20 shrink-0 flex-col">
                  <span className="text-sm font-semibold">{name}</span>
                  {extra !== null && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{extra}</span>
                  )}
                </span>
                {editable ? (
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {hoursMode && (
                      <NumberField
                        className="w-20 shrink-0"
                        hideLabel
                        label={`${name}, ${messages['attendance.hoursLabel']}`}
                        value={entry?.hours ?? null}
                        onChange={(hours) => {
                          change(column.id, (previous) => ({
                            code:
                              previous?.code ??
                              (hours === null ? null : (props.defaultCode ?? null)),
                            hours,
                          }))
                        }}
                        onValidityChange={(ok) => {
                          const id = key(row.id, column.id)
                          props.setInvalid((currentInvalid) =>
                            ok ? without(currentInvalid, [id]) : { ...currentInvalid, [id]: '' },
                          )
                        }}
                      />
                    )}
                    <SelectField
                      className="min-w-0 flex-1"
                      hideLabel
                      clearable
                      placeholder={messages['attendance.noCode']}
                      label={`${name}, ${messages['attendance.code']}`}
                      options={codeOptions}
                      value={entry?.code ?? ''}
                      onChange={(next) => {
                        change(column.id, withCode(next === '' ? null : next))
                      }}
                    />
                  </span>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    {hoursMode && entry?.hours != null && (
                      <span dir="ltr" className="tabular-nums">
                        {messages['attendance.hours'](format.number(entry.hours))}
                      </span>
                    )}
                    {code !== undefined && <CodeChip code={code} />}
                    <span className="sr-only">{entryText(entry, props.codes)}</span>
                    {code === undefined && (entry?.hours ?? null) === null && (
                      <span aria-hidden="true" className="text-secondary">
                        —
                      </span>
                    )}
                    {correctable && (
                      <CompactIconButton
                        icon={Pencil}
                        label={`${messages['attendance.correct']}: ${name}`}
                        onClick={() => {
                          props.onAskCorrection({ row: row.id, column: column.id })
                        }}
                      />
                    )}
                  </span>
                )}
              </div>
              {marks.map((each) => (
                <span key={each.label} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  {each.label}
                </span>
              ))}
              {correction !== undefined && (
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  {messages['attendance.corrected'](
                    correction.by,
                    format.dateTime(correction.at),
                    correction.reason,
                  )}{' '}
                  {messages['attendance.original'](entryText(correction.original, props.codes))}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** The corrections of a locked grid, listed under it: who, when, why, and the original. */
function CorrectionList(props: AttendanceGridProps) {
  const { messages, format } = useLiro()
  const columnName = useColumnName()
  const entryText = useEntryText()
  const headingId = useId()
  const items = props.rows.flatMap((row) =>
    props.columns.flatMap((column) => {
      const correction = props.corrections?.[row.id]?.[column.id]
      return correction === undefined ? [] : [{ row, column, correction }]
    }),
  )
  if (items.length === 0) return null
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1">
      <h3 id={headingId} className="m-0 text-sm font-semibold text-primary">
        {messages['attendance.corrections']}
      </h3>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map(({ row, column, correction }) => (
          <li key={key(row.id, column.id)} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
            <span className="font-semibold text-primary">
              {row.label}, {columnName(column)}:
            </span>{' '}
            {entryText(entryOf(props.value, row.id, column.id), props.codes)}.{' '}
            {messages['attendance.original'](entryText(correction.original, props.codes))}.{' '}
            {messages['attendance.corrected'](
              correction.by,
              format.dateTime(correction.at),
              correction.reason,
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The correction of a locked cell: the new entry and a required reason. */
function CorrectionDialog(
  props: AttendanceGridProps & {
    row: AttendanceRow
    column: AttendanceColumn
    onClose: () => void
  },
) {
  const { messages } = useLiro()
  const columnName = useColumnName()
  const entryText = useEntryText()
  const hoursMode = (props.mode ?? 'code') === 'hours'
  const previous = entryOf(props.value, props.row.id, props.column.id)
  const [code, setCode] = useState(previous?.code ?? '')
  const [hours, setHours] = useState<string | null>(previous?.hours ?? null)
  const [hoursValid, setHoursValid] = useState(true)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [pending, setPending] = useState(false)

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (pending) return
    if (reason.trim() === '') {
      setReasonError(true)
      return
    }
    if (!hoursValid) return
    const entry: AttendanceEntry = hoursMode
      ? { code: code === '' ? null : code, hours }
      : { code: code === '' ? null : code }
    const result = props.onCorrect?.({
      row: props.row.id,
      column: props.column.id,
      entry,
      previous,
      reason: reason.trim(),
    })
    if (result instanceof Promise) {
      setPending(true)
      result.then(
        () => {
          setPending(false)
          props.onClose()
        },
        () => {
          setPending(false)
        },
      )
    } else {
      props.onClose()
    }
  }

  return (
    <DialogRoot
      open
      onOpenChange={(open) => {
        if (!open && !pending) props.onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        aria-busy={pending || undefined}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {messages['attendance.correctTitle'](props.row.label, columnName(props.column))}
          </DialogTitle>
          {!pending && <DialogCloseButton label={messages['dialog.close']} />}
        </DialogHeader>
        <form noValidate onSubmit={submit} className="contents">
          <DialogBody>
            <p className="m-0 text-sm text-secondary">
              <span className="font-semibold text-primary">{messages['attendance.current']}:</span>{' '}
              {entryText(previous, props.codes)}
            </p>
            <SelectField
              label={messages['attendance.code']}
              clearable
              placeholder={messages['attendance.noCode']}
              options={props.codes.map((each) => ({
                value: each.code,
                label: `${each.short} · ${each.label}`,
              }))}
              value={code}
              onChange={setCode}
            />
            {hoursMode && (
              <NumberField
                label={messages['attendance.hoursLabel']}
                value={hours}
                onChange={setHours}
                onValidityChange={setHoursValid}
              />
            )}
            <TextAreaField
              label={messages['attendance.reason']}
              required
              rows={3}
              value={reason}
              onChange={(next) => {
                setReason(next)
                if (next.trim() !== '') setReasonError(false)
              }}
              {...(reasonError ? { error: messages['field.required'] } : {})}
            />
            <DialogFooter>
              <Button
                intent="cancel"
                label={messages['dialog.cancel']}
                disabled={pending}
                onClick={props.onClose}
              />
              <Button
                intent="save"
                type="submit"
                label={messages['attendance.saveCorrection']}
                disabled={pending}
              />
            </DialogFooter>
          </DialogBody>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

/** The first load: the header and skeleton rows. */
function Loading(props: AttendanceGridProps) {
  return (
    <div
      data-slot="attendance-grid"
      aria-busy="true"
      className={cn('flex flex-col gap-2 font-sans', props.className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 flex-1" />
        </div>
      ))}
    </div>
  )
}

/** The editor of a cell's hours: a plain input over the cell, focused when it opens. */
function CellEditor(props: {
  label: string
  text: string
  onText: (text: string) => void
  onLeave: (text: string) => void
  onCancel: () => void
  onDone: (text: string, step: { row: number; column: number }) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  // Leaving by a key commits once; the blur that follows must not commit again.
  const done = useRef(false)
  useLayoutEffect(() => {
    const element = input.current
    if (element === null) return
    element.focus()
    element.setSelectionRange(element.value.length, element.value.length)
  }, [])
  return (
    <input
      ref={input}
      aria-label={props.label}
      dir="ltr"
      inputMode="decimal"
      value={props.text}
      onChange={(event) => {
        props.onText(event.target.value)
      }}
      onBlur={(event) => {
        if (!done.current) props.onLeave(event.target.value)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          done.current = true
          props.onCancel()
          return
        }
        const step =
          event.key === 'Enter'
            ? { row: event.shiftKey ? -1 : 1, column: 0 }
            : event.key === 'Tab'
              ? { row: 0, column: event.shiftKey ? -1 : 1 }
              : null
        if (step === null) return
        event.preventDefault()
        done.current = true
        props.onDone(props.text, step)
      }}
      className="absolute inset-0 box-border h-full w-full border-0 bg-surface-raised px-1 text-center font-sans text-sm text-primary tabular-nums outline-2 -outline-offset-2 outline-solid outline-focus"
    />
  )
}

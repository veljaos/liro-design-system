import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PenLine,
  Repeat,
  Send,
  Trash2,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { Skeleton } from '../primitives/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { matrixKeyTarget } from './admin-logic'
import { Button, CompactIconButton, IconButton } from './button'
import { ConfirmDialog } from './confirm-dialog'
import { DateRangeText } from './display-text'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { EmptyState } from './empty-state'
import { ShortcutHint } from './navigation'
import {
  assignChanges,
  cellAtPoint,
  cellConflictTone,
  conflictList,
  inRange,
  moveChange,
  periodDays,
  rangeCells,
  removeChanges,
  shiftPeriod,
  templateForKey,
  templateKey,
  todayPeriod,
  type CellBox,
  type GridCell,
  type RotationPattern,
  type ShiftAssignment,
  type ShiftCellRef,
  type ShiftChange,
  type ShiftConflict,
  type ShiftConflicts,
} from './shift-logic'
import { MoveDialog, RotationDialog } from './shift-planner-dialogs'
import {
  ConflictIcon,
  ShiftTime,
  TEMPLATE_TONE,
  durationText,
  timeTexts,
  type ShiftTemplate,
} from './shift-parts'
import { StatusBadge } from './status-badge'
import { usePhone } from './use-phone'

/*
 * ShiftPlanner (BUILD-PLAN P5.24 b): people × days of a week or a period, each cell holding zero
 * or more assignments of the application's shift templates. The planner shows what it is given
 * and reports changes (`onChange`); it never decides whether a plan is valid — rest between
 * shifts, double booking and weekly limits arrive as conflicts (data), and legal limits are never
 * encoded here.
 * - Toolbar: the period (previous, Today, next; the dates), the view (by person, or by one of the
 *   application's groupings: team, site), then at the end the schedule's state (Draft /
 *   Published / Changed since publishing), "Apply rotation…" and Publish, the page's main action,
 *   last (D13), with a confirmation that states the application's counts.
 * - The palette: the templates as chips with their times ("22:00–06:00 (+1)", read as "… the next
 *   day") and their key. Drag one onto a day, or press it (or its key) to assign it to the
 *   selected days.
 * - The grid (a WAI-ARIA grid, one cell in the tab order): the person and a subtitle as row
 *   headers (sticky at the start), a day per column (weekday, date; today marked in words), the
 *   planned hours at the row's end (`format.number`, "—" for null), the coverage at the columns'
 *   foot. Rows grouped under collapsible headings. A cell's name says the person, the day, its
 *   assignments with their times in words, "Changed", and each conflict in words.
 * - Keyboard: the arrows move (the forward arrow in the reading direction to the next day, B.7),
 *   Home / End to the row's ends, Ctrl+Home / Ctrl+End to the corners; Shift with an arrow
 *   selects a range (neutral: surface.selected with a border.selected border, D17); a template's
 *   key assigns it to the range or the cell; Delete or Backspace empties them; Escape clears the
 *   range; Enter or Space opens the cell's menu — the templates, "Move … to…", "Remove …". Each
 *   change is announced politely.
 * - Dragging (decisions.md "Launchpad dragging is live", the rule for every drag): pointer events,
 *   never the browser's drag and drop; a mouse drag starts after 4px, a touch after a 250ms press
 *   without moving more than 8px. A template from the palette, or an assignment from its cell,
 *   lifts (shadow lg, border.strong, the raised layer) and follows the pointer; a neutral dashed
 *   border.strong placeholder on surface.sunken shows where it lands, in the cell under the
 *   pointer, measured on the laid-out grid (`cellAtPoint`; right to left needs no mirroring).
 *   Escape or a cancelled pointer puts it back. The menu and the keys are the other ways
 *   (WCAG 2.5.7).
 * - Conflicts: an icon in the cell (a triangle for a warning, an octagon for a problem), the words
 *   in its name, and a "Conflicts" summary above the grid listing each with "Go to".
 * - Phones (below 48em or `layout="phone"`): one day at a time — a day switcher, then the people
 *   with that day's shifts and conflicts in words, each with a menu (assign, move, remove).
 */

/** A person in the plan: a row. */
export interface ShiftPlannerRow {
  id: string
  /** The person's name, from the application. */
  name: string
  /** A line under the name ("Cashier", "Nurse, 0,5"). */
  subtitle?: string
  /** Planned hours in the period, a decimal string from the application; null shows "—". */
  hours?: string | null
}

/** A group of rows under a heading (a team, a site), from the application. */
export interface ShiftGroup {
  id: string
  label: string
  /** The ids of its rows, in order. */
  rows: readonly string[]
  /** A short line after the heading, from the application ("3 people · 112 h"). */
  note?: string
}

/** One way of grouping the rows ("By team", "By site"), offered in the view switch. */
export interface ShiftGrouping {
  id: string
  /** The view's name in the switch ("By team"). */
  label: string
  groups: readonly ShiftGroup[]
}

/** A day's coverage at the column's foot: decimal strings from the application. */
export interface ShiftCoverage {
  /** How many are planned ("5"). */
  planned: string
  /** How many are needed ("6"): shown as "5 of 6". */
  needed?: string
  /** A day below its need, in the application's judgement: an icon and `note` in words. */
  tone?: 'warning' | 'danger'
  /** The words for the tone ("One short in the late shift"). */
  note?: string
}

/** The application's counts for the publish confirmation. */
export interface ShiftPublishCounts {
  shifts: number
  people: number
  /** Conflicts still open. */
  conflicts?: number
}

export interface ShiftPlannerProps {
  /** Names the grid, from the application ("Shifts, Prodavnica 12"). */
  label: string
  rows: readonly ShiftPlannerRow[]
  templates: readonly ShiftTemplate[]
  assignments: readonly ShiftAssignment[]
  /** The period's first and last day (YYYY-MM-DD): a week, or up to 62 days. */
  start: string
  end: string
  /** Previous, next and Today: the period the user moved to. Without it, no navigation. */
  onPeriodChange?: (period: { start: string; end: string }) => void
  /** The application's conflicts per row and day. */
  conflicts?: ShiftConflicts
  /** The application's coverage per day (YYYY-MM-DD). */
  coverage?: Readonly<Record<string, ShiftCoverage>>
  /** Ways of grouping the rows, offered beside "By person". */
  groupings?: readonly ShiftGrouping[]
  /** The grouping shown (controlled); null shows one list by person. */
  groupBy?: string | null
  /** The grouping shown first. Default null (by person). */
  defaultGroupBy?: string | null
  onGroupByChange?: (groupBy: string | null) => void
  /** The ids of the collapsed groups (controlled). */
  collapsed?: readonly string[]
  defaultCollapsed?: readonly string[]
  onCollapsedChange?: (collapsed: string[]) => void
  /** The changes the user made; the application applies them (or not). */
  onChange?: (changes: ShiftChange[]) => void
  /** Read only: no palette, menus or dragging; the cells can still be walked and read. */
  readOnly?: boolean
  /** The schedule's state. Without it, no state and no Publish. */
  status?: 'draft' | 'published'
  /** Published, then changed (from the application): "Changed since publishing". */
  changedSincePublishing?: boolean
  /** Publishes the schedule, after the confirmation. A returned promise keeps it working. */
  onPublish?: () => void | Promise<void>
  /** The counts the confirmation states. */
  publishCounts?: ShiftPublishCounts
  /** The application's rotation patterns; with `onChange`, "Apply rotation…" is offered. */
  rotations?: readonly RotationPattern[]
  /** Opens "Apply rotation…" from the start (a state an application restores). */
  defaultRotationOpen?: boolean
  /** A selected range from the start: its first corner and the focused cell. */
  defaultSelection?: { anchor: ShiftCellRef; focus: ShiftCellRef }
  /** Skeleton rows while the plan loads. */
  loading?: boolean
  /** 'phone' shows one day at a time; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  /** Phones: the day shown (controlled); default today when in the period, else the first. */
  day?: string
  onDayChange?: (day: string) => void
  className?: string
}

/** A row as shown, under its group (null by person). */
interface ShownRow {
  row: ShiftPlannerRow
  group: ShiftGroup | null
}

/** A cell by its row and day, with the index of the row shown (a person may be in two groups). */
type PlaceRef = ShiftCellRef & { row?: number }

/** A drag in progress. */
interface DragState {
  kind: 'template' | 'assignment'
  id: string
  dx: number
  dy: number
  target: ShiftCellRef | null
}

const TODAY_TEXT = 'text-xs font-semibold text-primary'

/** The planner: people × days; keys, menus or dragging assign the application's templates. */
export function ShiftPlanner(props: ShiftPlannerProps) {
  const liro = useLiro()
  const { messages, format, direction, today, weekStartsOn } = liro
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const baseId = useId()
  const grid = useRef<HTMLTableElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const editable = props.readOnly !== true && props.onChange !== undefined

  const [innerGroupBy, setInnerGroupBy] = useState<string | null>(props.defaultGroupBy ?? null)
  const groupBy = props.groupBy === undefined ? innerGroupBy : props.groupBy
  const [innerCollapsed, setInnerCollapsed] = useState<readonly string[]>(
    props.defaultCollapsed ?? [],
  )
  const collapsed = props.collapsed ?? innerCollapsed
  const [active, setActive] = useState<PlaceRef | null>(props.defaultSelection?.focus ?? null)
  const [anchor, setAnchor] = useState<PlaceRef | null>(props.defaultSelection?.anchor ?? null)
  const [menuCell, setMenuCell] = useState<string | null>(null)
  const [moving, setMoving] = useState<ShiftAssignment | null>(null)
  const [rotationOpen, setRotationOpen] = useState(props.defaultRotationOpen === true)
  const [announcement, setAnnouncement] = useState('')
  const [drag, setDrag] = useState<DragState | null>(null)
  const [innerDay, setInnerDay] = useState<string | undefined>(undefined)
  const suppressClick = useRef(false)
  /** What takes the focus after the next render: a cell, or a phone's menu button by its key. */
  const focusAfter = useRef<PlaceRef | string | null>(null)
  const movedFrom = useRef<PlaceRef>({ rowId: '', date: '' })

  const days = periodDays(props.start, props.end)
  const templateOf = (id: string) => props.templates.find((template) => template.id === id)
  const rowOf = (id: string) => props.rows.find((row) => row.id === id)
  const grouping =
    groupBy === null ? undefined : props.groupings?.find((each) => each.id === groupBy)
  const sections: { group: ShiftGroup | null; rows: ShiftPlannerRow[] }[] =
    grouping === undefined
      ? [{ group: null, rows: [...props.rows] }]
      : grouping.groups.map((group) => ({
          group,
          rows: group.rows.flatMap((id) => {
            const row = rowOf(id)
            return row === undefined ? [] : [row]
          }),
        }))
  const shown: ShownRow[] = sections.flatMap((section) =>
    section.group !== null && collapsed.includes(section.group.id)
      ? []
      : section.rows.map((row) => ({ row, group: section.group })),
  )

  const cellsOf = (rowId: string, date: string) =>
    props.assignments.filter((each) => each.rowId === rowId && each.date === date)
  const conflictsOf = (rowId: string, date: string): readonly ShiftConflict[] =>
    props.conflicts?.[rowId]?.[date] ?? []

  // The focused cell and the selected range, as indices of the cells shown.
  const indexOf = (ref: PlaceRef | null): GridCell | null => {
    if (ref === null) return null
    // A person shown in two groups: the row the focus is in, else the first.
    const row =
      ref.row !== undefined && shown[ref.row]?.row.id === ref.rowId
        ? ref.row
        : shown.findIndex((each) => each.row.id === ref.rowId)
    const column = days.indexOf(ref.date)
    return row === -1 || column === -1 ? null : { row, column }
  }
  const activeIndex = indexOf(active) ?? { row: 0, column: 0 }
  const anchorIndex = indexOf(anchor)
  const refOf = (cell: GridCell): PlaceRef | null => {
    const row = shown[cell.row]
    const date = days[cell.column]
    return row === undefined || date === undefined
      ? null
      : { rowId: row.row.id, date, row: cell.row }
  }
  const selectedRefs = (): ShiftCellRef[] =>
    (anchorIndex === null ? [activeIndex] : rangeCells(anchorIndex, activeIndex)).flatMap(
      (cell) => {
        const ref = refOf(cell)
        return ref === null ? [] : [{ rowId: ref.rowId, date: ref.date }]
      },
    )

  const dayText = (date: string) => format.dateLong(date)
  const templateName = (template: ShiftTemplate) =>
    `${template.label}, ${timeTexts(format, messages, template.start, template.end).spoken}`
  const report = (changes: ShiftChange[]) => {
    if (changes.length > 0) props.onChange?.(changes)
  }
  const assign = (template: ShiftTemplate, cells: readonly ShiftCellRef[]) => {
    report(assignChanges(cells, template.id, props.assignments))
    setAnnouncement(
      messages['shifts.assigned'](
        template.label,
        cells.length,
        format.number(String(cells.length)),
      ),
    )
  }
  const remove = (changes: ShiftChange[]) => {
    report(changes)
    setAnnouncement(
      messages['shifts.removed'](changes.length, format.number(String(changes.length))),
    )
  }
  const moved = (change: ShiftChange) => {
    if (change.type !== 'move') return
    const assignment = props.assignments.find((each) => each.id === change.assignmentId)
    const template = assignment === undefined ? undefined : templateOf(assignment.templateId)
    report([change])
    setAnnouncement(
      messages['shifts.moved'](
        template?.label ?? '',
        rowOf(change.to.rowId)?.name ?? '',
        dayText(change.to.date),
      ),
    )
  }

  // The focus follows the keyboard (and "Go to") after React has drawn the cell.
  useEffect(() => {
    const target = focusAfter.current
    if (target === null) return
    focusAfter.current = null
    const cell = typeof target === 'string' ? null : indexOf(target)
    const key =
      typeof target === 'string'
        ? target
        : cell === null
          ? ''
          : `${String(cell.row)}-${String(cell.column)}`
    const element = root.current?.querySelector<HTMLElement>(`[data-cell="${CSS.escape(key)}"]`)
    element?.focus()
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
  const focusCell = (ref: PlaceRef) => {
    focusAfter.current = ref
  }

  const onCellKey = (event: KeyboardEvent<HTMLButtonElement>, cell: GridCell) => {
    const control = event.ctrlKey || event.metaKey
    const target = matrixKeyTarget(event.key, cell, shown.length, days.length, direction, control)
    if (target !== null) {
      event.preventDefault()
      const ref = refOf(target)
      const here = refOf(cell)
      if (ref === null) return
      if (event.shiftKey) {
        const corner = anchor ?? here
        setAnchor(corner)
        const range = rangeCells(indexOf(corner) ?? cell, target).length
        setAnnouncement(messages['shifts.selected'](range, format.number(String(range))))
      } else {
        setAnchor(null)
      }
      setActive(ref)
      focusCell(ref)
      return
    }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault()
      return
    }
    if (event.key === 'Escape' && anchor !== null) {
      event.preventDefault()
      event.stopPropagation()
      setAnchor(null)
      return
    }
    if (!editable) {
      // A read-only cell opens no menu.
      if (event.key === 'Enter' || event.key === ' ') event.preventDefault()
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      remove(removeChanges(selectedRefs(), props.assignments))
      return
    }
    if (control || event.altKey) return
    const template = templateForKey(props.templates, event.key)
    if (template !== null) {
      event.preventDefault()
      assign(template, selectedRefs())
    }
  }

  // Live dragging on pointer events (no browser ghost; touch after a short press).
  const startDrag = (
    event: PointerEvent<HTMLElement>,
    source: { kind: 'template' | 'assignment'; id: string },
    onTap?: () => void,
  ) => {
    if (!editable || event.button !== 0 || phone) return
    // Keeps the cell's menu shut while the press may still become a drag.
    if (source.kind === 'assignment') event.preventDefault()
    const table = grid.current
    if (table === null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    let active = false
    let boxes: CellBox[] = []
    let current: DragState | null = null
    const activate = () => {
      boxes = Array.from(table.querySelectorAll<HTMLElement>('[data-shift-cell]')).map((cell) => {
        const rect = cell.getBoundingClientRect()
        return {
          rowId: cell.dataset.row ?? '',
          date: cell.dataset.date ?? '',
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        }
      })
      active = true
      current = { ...source, dx: 0, dy: 0, target: null }
      setDrag(current)
    }
    const timer = touch ? window.setTimeout(activate, 250) : undefined
    const finish = (commit: boolean) => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('touchmove', onTouchMove)
      if (active) {
        suppressClick.current = true
        window.setTimeout(() => {
          suppressClick.current = false
        }, 0)
      }
      if (active && commit && current?.target != null) {
        const to = current.target
        if (source.kind === 'template') {
          const template = templateOf(source.id)
          if (template !== undefined) assign(template, [to])
        } else {
          const assignment = props.assignments.find((each) => each.id === source.id)
          const change = assignment === undefined ? null : moveChange(assignment, to)
          if (change !== null) moved(change)
        }
      }
      if (!active && commit) onTap?.()
      setDrag(null)
    }
    const onMove = (move: globalThis.PointerEvent) => {
      const distance = Math.hypot(move.clientX - startX, move.clientY - startY)
      if (!active) {
        // A touch that moves before the press completes is a swipe: the page scrolls.
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        activate()
      }
      current = {
        ...source,
        dx: move.clientX - startX,
        dy: move.clientY - startY,
        target: cellAtPoint(boxes, { x: move.clientX, y: move.clientY }),
      }
      setDrag(current)
    }
    const onUp = () => {
      finish(true)
    }
    const onCancel = () => {
      finish(false)
    }
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== 'Escape' || !active) return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }
    // While a touch drags, the page must not scroll under it.
    const onTouchMove = (touchMove: TouchEvent) => {
      if (active) touchMove.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
  }
  const liftStyle = (kind: DragState['kind'], id: string): CSSProperties | undefined =>
    drag !== null && drag.kind === kind && drag.id === id
      ? { transform: `translate(${String(drag.dx)}px, ${String(drag.dy)}px)` }
      : undefined
  const lifted = (kind: DragState['kind'], id: string) =>
    drag !== null && drag.kind === kind && drag.id === id

  const setGroupBy = (value: string | null) => {
    setInnerGroupBy(value)
    props.onGroupByChange?.(value)
  }
  const toggleGroup = (id: string) => {
    const next = collapsed.includes(id)
      ? collapsed.filter((each) => each !== id)
      : [...collapsed, id]
    setInnerCollapsed(next)
    props.onCollapsedChange?.(next)
  }

  // ── Phones: the day shown ──
  const phoneDay =
    props.day ?? innerDay ?? (days.includes(today) ? today : (days[0] ?? props.start))
  const showDay = (day: string) => {
    setInnerDay(day)
    props.onDayChange?.(day)
  }

  const goTo = (ref: ShiftCellRef) => {
    const owner = sections.find(
      (section) =>
        section.group !== null &&
        collapsed.includes(section.group.id) &&
        section.rows.some((row) => row.id === ref.rowId),
    )
    if (owner?.group != null) toggleGroup(owner.group.id)
    if (phone) {
      showDay(ref.date)
      focusAfter.current = `menu|${ref.rowId}`
      return
    }
    setAnchor(null)
    setActive(ref)
    focusCell(ref)
  }

  if (props.loading === true) {
    return (
      <div
        role="region"
        aria-label={props.label}
        aria-busy="true"
        className={cn('flex flex-col gap-3', props.className)}
      >
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-8 w-full max-w-160" />
        {Array.from({ length: phone ? 4 : 6 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-md" />
        ))}
      </div>
    )
  }

  const visibleConflicts = conflictList(
    props.conflicts ?? {},
    [...new Set(sections.flatMap((section) => section.rows.map((row) => row.id)))],
    phone ? [phoneDay] : days,
  )
  const anyChanged = props.assignments.some(
    (each) => each.changed === true && days.includes(each.date),
  )
  const showHours = props.rows.some((row) => row.hours !== undefined)

  // ── The toolbar ──
  const PreviousIcon = direction === 'rtl' ? ChevronRight : ChevronLeft
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight
  const periodNavigation =
    props.onPeriodChange === undefined ? null : (
      <div className="flex items-center gap-1">
        <IconButton
          family="neutral"
          icon={PreviousIcon}
          label={messages['shifts.previousPeriod']}
          onClick={() => props.onPeriodChange?.(shiftPeriod(props.start, props.end, -1))}
        />
        <Button
          family="neutral"
          icon={CalendarDays}
          label={messages['shifts.today']}
          onClick={() =>
            props.onPeriodChange?.(todayPeriod(props.start, props.end, today, weekStartsOn))
          }
        />
        <IconButton
          family="neutral"
          icon={NextIcon}
          label={messages['shifts.nextPeriod']}
          onClick={() => props.onPeriodChange?.(shiftPeriod(props.start, props.end, 1))}
        />
      </div>
    )
  const statusBadge =
    props.status === undefined ? null : props.status === 'draft' ? (
      <StatusBadge label={messages['shifts.draft']} tone="neutral" withBorder />
    ) : props.changedSincePublishing === true ? (
      <StatusBadge
        label={messages['shifts.changedSincePublishing']}
        tone="warning"
        icon={PenLine}
        withBorder
      />
    ) : (
      <StatusBadge label={messages['shifts.published']} tone="success" withBorder />
    )
  const canPublish =
    props.onPublish !== undefined &&
    props.readOnly !== true &&
    (props.status !== 'published' || props.changedSincePublishing === true)
  const counts = props.publishCounts
  const publishMessage =
    counts === undefined ? undefined : (
      <>
        {messages['shifts.publishMessage'](
          counts.shifts,
          format.number(String(counts.shifts)),
          counts.people,
          format.number(String(counts.people)),
        )}
        {counts.conflicts !== undefined && counts.conflicts > 0 && (
          <>
            {' '}
            {messages['shifts.publishConflicts'](
              counts.conflicts,
              format.number(String(counts.conflicts)),
            )}
          </>
        )}
      </>
    )
  const publishLabel =
    props.status === 'published' ? messages['shifts.publishChanges'] : messages['shifts.publish']
  const rotationsOffered = editable && props.rotations !== undefined && props.rotations.length > 0
  const defaultPeople = [
    ...new Set(
      anchorIndex === null
        ? []
        : rangeCells(anchorIndex, activeIndex).flatMap((cell) => {
            const ref = refOf(cell)
            return ref === null ? [] : [ref.rowId]
          }),
    ),
  ]
  const viewSwitch =
    props.groupings === undefined || props.groupings.length === 0 ? null : (
      <div className="flex flex-col gap-1">
        <span id={`${baseId}-view`} className="text-xs font-semibold text-secondary">
          {messages['shifts.view']}
        </span>
        <ToggleGroup
          type="single"
          aria-labelledby={`${baseId}-view`}
          dir={direction}
          value={groupBy ?? '-'}
          onValueChange={(value) => {
            if (value !== '') setGroupBy(value === '-' ? null : value)
          }}
        >
          <ToggleGroupItem value="-">{messages['shifts.byPerson']}</ToggleGroupItem>
          {props.groupings.map((each) => (
            <ToggleGroupItem key={each.id} value={each.id}>
              {each.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    )
  const toolbar = (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        {periodNavigation}
        <span className="text-sm font-semibold text-primary">
          <DateRangeText from={props.start} to={props.end} />
        </span>
      </div>
      {!phone && viewSwitch}
      <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
        {statusBadge}
        {rotationsOffered && (
          <RotationDialog
            open={rotationOpen}
            onOpenChange={setRotationOpen}
            trigger={
              <Button family="neutral" icon={Repeat} label={messages['shifts.applyRotation']} />
            }
            rotations={props.rotations ?? []}
            templates={props.templates}
            rows={props.rows}
            defaultPeople={defaultPeople}
            start={props.start}
            end={props.end}
            onApply={(changes) => {
              report(changes)
            }}
          />
        )}
        {canPublish && (
          <ConfirmDialog
            family="primary"
            actionIcon={Send}
            title={messages['shifts.publishTitle']}
            {...(publishMessage === undefined ? {} : { message: publishMessage })}
            confirmLabel={publishLabel}
            onConfirm={() => props.onPublish?.()}
            trigger={
              <Button family="primary" icon={Send} emphasis="primary" label={publishLabel} />
            }
          />
        )}
      </div>
    </div>
  )

  // ── The palette ──
  const palette =
    editable && !phone ? (
      <div className="flex flex-col gap-1.5">
        <div
          role="group"
          aria-labelledby={`${baseId}-palette`}
          className="flex flex-wrap items-center gap-2"
        >
          <span id={`${baseId}-palette`} className="text-xs font-semibold text-secondary">
            {messages['shifts.templates']}
          </span>
          {props.templates.map((template, index) => {
            const key = templateKey(template, index)
            const duration = durationText(format, messages, template.start, template.end)
            const isLifted = lifted('template', template.id)
            return (
              <button
                key={template.id}
                type="button"
                data-template={template.id}
                {...(isLifted ? { 'data-dragging': '' } : {})}
                title={duration ?? undefined}
                onPointerDown={(event) => {
                  startDrag(event, { kind: 'template', id: template.id })
                }}
                onClick={() => {
                  if (suppressClick.current) return
                  assign(template, selectedRefs())
                  const here = refOf(activeIndex)
                  if (here !== null) focusCell(here)
                }}
                style={liftStyle('template', template.id)}
                className={cn(
                  BUTTON_RESET,
                  FOCUS_RING,
                  'relative box-border flex min-h-8 items-center gap-2 rounded-md border border-solid px-2 py-1 text-xs',
                  TEMPLATE_TONE[template.tone ?? 'neutral'],
                  'cursor-grab select-none',
                  isLifted && 'z-(--liro-layer-raised) cursor-grabbing border-strong shadow-lg',
                )}
              >
                <span className={cn('font-semibold', TEXT_ISOLATE)}>{template.label}</span>
                <ShiftTime start={template.start} end={template.end} />
                {key !== null && (
                  <>
                    <span aria-hidden="true" className="inline-flex">
                      <ShortcutHint keys={[key]} className="[&_kbd]:bg-surface-raised" />
                    </span>
                    <span className="sr-only">{messages['shifts.key'](key)}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
        <p className={cn('m-0 flex flex-wrap gap-x-4 text-xs text-tertiary', TEXT_DIRECTION)}>
          <span>{messages['shifts.paletteHint']}</span>
          {anyChanged && (
            <span className="inline-flex items-center gap-1">
              <PenLine aria-hidden="true" className="size-3" />
              {messages['shifts.changed']}
            </span>
          )}
        </p>
      </div>
    ) : anyChanged ? (
      <p className="m-0 inline-flex items-center gap-1 text-xs text-tertiary">
        <PenLine aria-hidden="true" className="size-3" />
        {messages['shifts.changed']}
      </p>
    ) : null

  // ── The conflicts summary ──
  const conflictsPanel =
    visibleConflicts.length === 0 ? null : (
      <section
        aria-labelledby={`${baseId}-conflicts`}
        className="flex flex-col gap-2 rounded-md border border-solid border-default bg-surface-raised p-3"
      >
        <h2 id={`${baseId}-conflicts`} className="m-0 text-sm font-semibold text-primary">
          {messages['shifts.conflicts']}
        </h2>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {visibleConflicts.map((entry, index) => {
            const name = rowOf(entry.rowId)?.name ?? ''
            return (
              <li key={index} className="flex items-start gap-2 text-sm text-primary">
                <ConflictIcon tone={entry.conflict.tone} className="mt-0.5 size-4" />
                <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>
                  <span className="font-semibold">{name}</span>
                  {', '}
                  {format.date(entry.date)}
                  {': '}
                  <span className="sr-only">
                    {entry.conflict.tone === 'danger'
                      ? messages['shifts.conflictDanger']('')
                      : messages['shifts.conflictWarning']('')}
                  </span>
                  {entry.conflict.text}
                </span>
                <button
                  type="button"
                  aria-label={messages['shifts.goToCell'](name, dayText(entry.date))}
                  onClick={() => {
                    goTo(entry)
                  }}
                  className={cn(
                    BUTTON_RESET,
                    FOCUS_RING,
                    'min-h-6 shrink-0 cursor-pointer rounded-sm px-1 text-sm text-link underline hover:text-link',
                  )}
                >
                  {messages['shifts.goTo']}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )

  const announcer = (
    <div role="status" className="sr-only">
      {announcement}
    </div>
  )

  const moveDialog = (
    <MoveDialog
      assignment={moving}
      label={moving === null ? '' : (templateOf(moving.templateId)?.label ?? '')}
      rows={props.rows}
      days={days}
      onClose={() => {
        setMoving(null)
      }}
      onMove={moved}
      onCloseFocus={() => {
        // Back to the cell (or, on a phone, the person's menu button) the menu was opened from.
        const from = movedFrom.current
        const cell = indexOf(from)
        const key = phone
          ? `menu|${from.rowId}`
          : cell === null
            ? ''
            : `${String(cell.row)}-${String(cell.column)}`
        root.current?.querySelector<HTMLElement>(`[data-cell="${CSS.escape(key)}"]`)?.focus()
      }}
    />
  )

  /** The menu entries of one cell: assign a template, move or remove each assignment. */
  const cellEntries = (ref: PlaceRef, cells: readonly ShiftCellRef[]): MenuEntry[] => {
    const here = cellsOf(ref.rowId, ref.date)
    return [
      { type: 'label', label: messages['shifts.assign'] },
      ...props.templates.map((template, index) => {
        const key = templateKey(template, index)
        return {
          label: `${template.label} ${timeTexts(format, messages, template.start, template.end).shown}`,
          ...(key === null || phone ? {} : { shortcut: key }),
          onSelect: () => {
            assign(template, cells)
          },
        }
      }),
      ...(here.length === 0 ? [] : [{ type: 'separator' as const }]),
      ...here.flatMap((assignment): MenuEntry[] => {
        const label = templateOf(assignment.templateId)?.label ?? ''
        return [
          {
            label: messages['shifts.moveTo'](label),
            onSelect: () => {
              movedFrom.current = ref
              setMoving(assignment)
            },
          },
          {
            label: messages['shifts.remove'](label),
            icon: Trash2,
            destructive: true,
            onSelect: () => {
              remove(removeChanges([ref], [assignment]))
            },
          },
        ]
      }),
    ]
  }

  const groupHeading = (group: ShiftGroup, level: 'row' | 'block') => {
    const open = !collapsed.includes(group.id)
    const button = (
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          toggleGroup(group.id)
        }}
        className={cn(
          BUTTON_RESET,
          FOCUS_RING,
          'inline-flex min-h-6 cursor-pointer items-center gap-1.5 rounded-sm text-sm font-semibold text-primary',
        )}
      >
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 transition-transform duration-(--liro-duration-fast) ease-standard',
            !open && (direction === 'rtl' ? 'rotate-90' : '-rotate-90'),
          )}
        />
        <span className={TEXT_ISOLATE}>{group.label}</span>
      </button>
    )
    const note =
      group.note === undefined ? null : (
        <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>{group.note}</span>
      )
    if (level === 'block') {
      return (
        <h2 className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {button}
          {note}
        </h2>
      )
    }
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {button}
        {note}
      </div>
    )
  }

  const hoursText = (row: ShiftPlannerRow) =>
    row.hours === null || row.hours === undefined
      ? '—'
      : messages['shifts.hoursValue'](format.number(row.hours))

  const coverageCell = (date: string): ReactNode => {
    const value = props.coverage?.[date]
    if (value === undefined) return <span className="text-tertiary">—</span>
    return (
      <span className="inline-flex items-center gap-1">
        {value.tone !== undefined && <ConflictIcon tone={value.tone} className="size-3.5" />}
        <span className="tabular-nums">
          {messages['shifts.coverageValue'](
            format.number(value.planned),
            value.needed === undefined ? undefined : format.number(value.needed),
          )}
        </span>
        {value.note !== undefined && <span className="sr-only">{value.note}</span>}
      </span>
    )
  }

  // ── Phones: one day, a list of people ──
  if (phone) {
    const dayIndex = Math.max(0, days.indexOf(phoneDay))
    const previousDay = days[dayIndex - 1]
    const nextDay = days[dayIndex + 1]
    const coverage = props.coverage?.[phoneDay]
    return (
      <div
        ref={root}
        data-slot="shift-planner"
        className={cn('flex min-w-0 flex-col gap-4', props.className)}
      >
        {announcer}
        {toolbar}
        {viewSwitch}
        {palette}
        <div className="flex items-center gap-2">
          <IconButton
            family="neutral"
            icon={PreviousIcon}
            label={messages['shifts.previousDay']}
            disabled={previousDay === undefined}
            onClick={() => {
              if (previousDay !== undefined) showDay(previousDay)
            }}
          />
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className="text-xs text-secondary">{messages['shifts.day']}</span>
            <span aria-live="polite" className="text-sm font-semibold text-primary">
              {dayText(phoneDay)}
              {phoneDay === today && (
                <span className={cn('ms-2', TODAY_TEXT)}>· {messages['shifts.today']}</span>
              )}
            </span>
          </div>
          <IconButton
            family="neutral"
            icon={NextIcon}
            label={messages['shifts.nextDay']}
            disabled={nextDay === undefined}
            onClick={() => {
              if (nextDay !== undefined) showDay(nextDay)
            }}
          />
        </div>
        {coverage !== undefined && (
          <p className="m-0 flex items-center gap-2 text-sm text-secondary">
            <span>{messages['shifts.coverage']}</span>
            <span className="text-primary">{coverageCell(phoneDay)}</span>
            {coverage.note !== undefined && (
              <span aria-hidden="true" className={cn('text-xs', TEXT_DIRECTION)}>
                {coverage.note}
              </span>
            )}
          </p>
        )}
        {conflictsPanel}
        {props.rows.length === 0 ? (
          <EmptyState
            compact
            title={messages['shifts.noPeople']}
            description={messages['shifts.noPeopleDescription']}
          />
        ) : (
          sections.map((section, sectionIndex) => (
            <section key={section.group?.id ?? sectionIndex} className="flex flex-col gap-2">
              {section.group !== null && groupHeading(section.group, 'block')}
              {(section.group === null || !collapsed.includes(section.group.id)) && (
                <ul
                  aria-label={section.group?.label ?? props.label}
                  className="m-0 flex list-none flex-col gap-2 p-0"
                >
                  {section.rows.map((row) => {
                    const here = cellsOf(row.id, phoneDay)
                    const conflicts = conflictsOf(row.id, phoneDay)
                    return (
                      <li
                        key={row.id}
                        className="box-border flex items-start gap-3 rounded-md border border-solid border-default bg-surface-raised p-3"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                            <span
                              className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}
                            >
                              {row.name}
                            </span>
                            {showHours && (
                              <span className="text-xs text-secondary tabular-nums">
                                {hoursText(row)}
                              </span>
                            )}
                          </div>
                          {row.subtitle !== undefined && (
                            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                              {row.subtitle}
                            </span>
                          )}
                          {here.length === 0 ? (
                            <span className="text-xs text-tertiary">
                              {messages['shifts.cellEmpty']}
                            </span>
                          ) : (
                            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                              {here.map((assignment) => (
                                <AssignmentChip
                                  key={assignment.id}
                                  as="li"
                                  assignment={assignment}
                                  template={templateOf(assignment.templateId)}
                                  wide
                                />
                              ))}
                            </ul>
                          )}
                          {conflicts.length > 0 && (
                            <ul className="m-0 flex list-none flex-col gap-1 p-0">
                              {conflicts.map((conflict, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-1.5 text-xs text-primary"
                                >
                                  <ConflictIcon tone={conflict.tone} className="mt-px size-3.5" />
                                  <span className={TEXT_DIRECTION}>
                                    <span className="sr-only">
                                      {conflict.tone === 'danger'
                                        ? messages['shifts.conflictDanger']('')
                                        : messages['shifts.conflictWarning']('')}
                                    </span>
                                    {conflict.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {editable && (
                          <DropdownMenu
                            align="end"
                            entries={cellEntries({ rowId: row.id, date: phoneDay }, [
                              { rowId: row.id, date: phoneDay },
                            ])}
                            trigger={
                              <CompactIconButton
                                icon={MoreHorizontal}
                                label={messages['shifts.cellMenu'](row.name, dayText(phoneDay))}
                                data-cell={`menu|${row.id}`}
                              />
                            }
                          />
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ))
        )}
        {moveDialog}
      </div>
    )
  }

  // ── Desktop: the grid ──
  const columnCount = days.length + 1 + (showHours ? 1 : 0)
  const selectionOn = anchorIndex !== null
  const renderCell = (shownRow: ShownRow, rowIndex: number, date: string, column: number) => {
    const row = shownRow.row
    const cell = { row: rowIndex, column }
    const key = `${String(rowIndex)}-${String(column)}`
    const place: PlaceRef = { rowId: row.id, date, row: rowIndex }
    const here = cellsOf(row.id, date)
    const conflicts = conflictsOf(row.id, date)
    const tone = cellConflictTone(conflicts)
    const selected = selectionOn && inRange(cell, anchorIndex, activeIndex)
    const focused = activeIndex.row === rowIndex && activeIndex.column === column
    const contents = [
      ...(here.length === 0
        ? [messages['shifts.cellEmpty']]
        : here.map((assignment) => {
            const template = templateOf(assignment.templateId)
            const name = template === undefined ? '' : templateName(template)
            return assignment.changed === true ? `${name}, ${messages['shifts.changed']}` : name
          })),
      ...conflicts.map((conflict) =>
        conflict.tone === 'danger'
          ? messages['shifts.conflictDanger'](conflict.text)
          : messages['shifts.conflictWarning'](conflict.text),
      ),
      ...(selected ? [messages['shifts.inSelection']] : []),
    ].join('; ')
    const isTarget = drag !== null && drag.target?.rowId === row.id && drag.target.date === date
    const cellButton = (
      <button
        type="button"
        data-cell={key}
        tabIndex={focused ? 0 : -1}
        aria-label={messages['shifts.cell'](row.name, dayText(date), contents)}
        onFocus={() => {
          if (!focused) setActive(place)
        }}
        onKeyDown={(event) => {
          onCellKey(event, cell)
        }}
        onPointerDown={(event) => {
          if (event.shiftKey && event.button === 0) {
            // Shift and a press extend the range, and open no menu.
            event.preventDefault()
            setAnchor(anchor ?? active ?? refOf(activeIndex))
            setActive(place)
            focusCell(place)
            return
          }
          if (!editable) return
          setAnchor(null)
          setActive(place)
        }}
        className={cn(
          BUTTON_RESET,
          FOCUS_RING,
          'relative box-border flex min-h-14 w-full flex-col items-stretch gap-1 rounded-sm border border-solid p-1 text-start',
          editable ? 'cursor-pointer hover:bg-surface-hover' : 'cursor-default',
          selected
            ? 'border-selected bg-surface-selected hover:bg-surface-selected'
            : 'border-transparent',
        )}
      >
        {tone !== null && (
          <span className="flex justify-end">
            <ConflictIcon tone={tone} className="size-3.5" />
          </span>
        )}
        {here.map((assignment) => (
          <AssignmentChip
            key={assignment.id}
            assignment={assignment}
            template={templateOf(assignment.templateId)}
            lifted={lifted('assignment', assignment.id)}
            style={liftStyle('assignment', assignment.id)}
            draggable={editable}
            onPointerDown={(event) => {
              startDrag(event, { kind: 'assignment', id: assignment.id }, () => {
                setAnchor(null)
                setActive(place)
                setMenuCell(key)
              })
            }}
          />
        ))}
        {isTarget && (
          // Where the dragged template or assignment lands: neutral, never blue (D17).
          <span
            aria-hidden="true"
            data-slot="shift-drop-placeholder"
            className="pointer-events-none box-border block h-9 rounded-sm border-2 border-dashed border-strong bg-surface-sunken"
          />
        )}
      </button>
    )
    return (
      <td
        key={date}
        data-shift-cell=""
        data-row={row.id}
        data-date={date}
        className="border-0 border-b border-s border-solid border-subtle p-0.5 align-top"
      >
        {editable ? (
          <MenuRoot
            modal={false}
            open={menuCell === key}
            onOpenChange={(open) => {
              setMenuCell(open ? key : null)
            }}
          >
            <DropdownMenuTrigger asChild>{cellButton}</DropdownMenuTrigger>
            {menuCell === key && (
              <DropdownMenuContent align="start">
                {cellEntries(place, selected ? selectedRefs() : [{ rowId: row.id, date }]).map(
                  (entry, index) =>
                    entry.type === 'separator' ? (
                      <DropdownMenuSeparator key={index} />
                    ) : entry.type === 'label' ? (
                      <DropdownMenuLabel key={index}>{entry.label}</DropdownMenuLabel>
                    ) : (
                      <DropdownMenuItem
                        key={index}
                        onSelect={entry.onSelect}
                        className={cn(
                          entry.destructive === true &&
                            'text-status-danger-fg data-highlighted:bg-status-danger-bg',
                        )}
                      >
                        {entry.icon !== undefined && <entry.icon aria-hidden="true" />}
                        <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{entry.label}</span>
                        {entry.shortcut !== undefined && (
                          <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    ),
                )}
              </DropdownMenuContent>
            )}
          </MenuRoot>
        ) : (
          cellButton
        )}
      </td>
    )
  }

  let rowIndex = -1
  return (
    <div
      ref={root}
      data-slot="shift-planner"
      className={cn('flex min-w-0 flex-col gap-4', props.className)}
    >
      {announcer}
      <span id={`${baseId}-instructions`} className="sr-only">
        {messages['shifts.instructions']}
      </span>
      {toolbar}
      {palette}
      {conflictsPanel}
      {props.rows.length === 0 ? (
        <EmptyState
          compact
          className="rounded-md border border-solid border-default py-8"
          title={messages['shifts.noPeople']}
          description={messages['shifts.noPeopleDescription']}
        />
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-md border border-solid border-default bg-surface-raised">
          <table
            ref={grid}
            aria-label={props.label}
            aria-describedby={`${baseId}-instructions`}
            className="w-full border-separate border-spacing-0 font-sans text-sm text-primary"
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky start-0 z-1 min-w-48 border-0 border-b border-solid border-default bg-surface-raised px-3 py-2 text-start text-xs font-semibold text-secondary"
                >
                  <span className={TEXT_ISOLATE}>{messages['shifts.person']}</span>
                </th>
                {days.map((date) => {
                  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
                  return (
                    <th
                      key={date}
                      scope="col"
                      {...(date === today ? { 'aria-current': 'date' as const } : {})}
                      className="min-w-28 border-0 border-s border-b border-solid border-default border-s-subtle px-2 py-2 text-start align-bottom text-xs font-normal text-secondary"
                    >
                      <span className="flex flex-col">
                        <span className="font-semibold text-primary">
                          {format.weekdayName(weekday, 'short')}
                        </span>
                        <span className="tabular-nums">{format.date(date)}</span>
                        {date === today && (
                          <span className={TODAY_TEXT}>{messages['shifts.today']}</span>
                        )}
                      </span>
                    </th>
                  )
                })}
                {showHours && (
                  <th
                    scope="col"
                    className="min-w-20 border-0 border-s border-b border-solid border-default border-s-subtle px-3 py-2 text-end align-bottom text-xs font-semibold text-secondary"
                  >
                    <span className={TEXT_ISOLATE}>{messages['shifts.hours']}</span>
                  </th>
                )}
              </tr>
            </thead>
            {sections.map((section, sectionIndex) => {
              const open = section.group === null || !collapsed.includes(section.group.id)
              return (
                <tbody key={section.group?.id ?? sectionIndex}>
                  {section.group !== null && (
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={columnCount}
                        className="border-0 border-b border-solid border-default bg-surface-sunken px-3 py-1.5 text-start font-normal"
                      >
                        {groupHeading(section.group, 'row')}
                      </th>
                    </tr>
                  )}
                  {open &&
                    section.rows.map((row) => {
                      rowIndex += 1
                      const index = rowIndex
                      const shownRow = shown[index] ?? { row, group: section.group }
                      return (
                        <tr key={row.id}>
                          <th
                            scope="row"
                            className="sticky start-0 z-1 border-0 border-b border-solid border-subtle bg-surface-raised px-3 py-2 text-start align-top font-normal"
                          >
                            <span className={cn('block text-sm font-semibold', TEXT_DIRECTION)}>
                              {row.name}
                            </span>
                            {row.subtitle !== undefined && (
                              <span className={cn('block text-xs text-secondary', TEXT_DIRECTION)}>
                                {row.subtitle}
                              </span>
                            )}
                          </th>
                          {days.map((date, column) => renderCell(shownRow, index, date, column))}
                          {showHours && (
                            <td className="border-0 border-s border-b border-solid border-subtle px-3 py-2 text-end align-top text-sm tabular-nums">
                              {hoursText(row)}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              )
            })}
            {props.coverage !== undefined && (
              <tfoot>
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-1 border-0 border-t border-solid border-strong bg-surface-raised px-3 py-2 text-start text-xs font-semibold text-secondary"
                  >
                    <span className={TEXT_ISOLATE}>{messages['shifts.coverage']}</span>
                  </th>
                  {days.map((date) => {
                    const note = props.coverage?.[date]?.note
                    return (
                      <td
                        key={date}
                        {...(note === undefined ? {} : { title: note })}
                        className="border-0 border-s border-t border-solid border-subtle border-t-strong px-2 py-2 text-start text-xs text-primary"
                      >
                        {coverageCell(date)}
                      </td>
                    )
                  })}
                  {showHours && (
                    <td className="border-0 border-s border-t border-solid border-subtle border-t-strong" />
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
      {moveDialog}
    </div>
  )
}

/** One assignment as a chip: the template's short mark and its times; "Changed" as an icon. */
function AssignmentChip({
  assignment,
  template,
  lifted = false,
  style,
  draggable = false,
  wide = false,
  as: Tag = 'span',
  onPointerDown,
}: {
  assignment: ShiftAssignment
  template: ShiftTemplate | undefined
  lifted?: boolean
  style?: CSSProperties | undefined
  draggable?: boolean
  wide?: boolean
  as?: 'span' | 'li'
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void
}) {
  const { messages } = useLiro()
  return (
    <Tag
      data-assignment={assignment.id}
      {...(lifted ? { 'data-dragging': '' } : {})}
      {...(onPointerDown === undefined ? {} : { onPointerDown })}
      style={style}
      className={cn(
        'relative box-border flex rounded-sm border border-solid px-1.5 py-0.5 text-xs',
        wide ? 'flex-row flex-wrap items-baseline gap-x-2' : 'flex-col',
        TEMPLATE_TONE[template?.tone ?? 'neutral'],
        draggable && 'cursor-grab select-none',
        lifted && 'z-(--liro-layer-raised) cursor-grabbing border-strong shadow-lg',
      )}
    >
      <span className="flex items-center gap-1">
        <span className={cn('font-semibold', TEXT_ISOLATE)}>
          {wide ? (template?.label ?? '') : (template?.short ?? '')}
        </span>
        {assignment.changed === true && (
          <>
            <PenLine aria-hidden="true" className="size-3 shrink-0" />
            {wide && <span className="sr-only">{messages['shifts.changed']}</span>}
          </>
        )}
      </span>
      {template !== undefined && <ShiftTime start={template.start} end={template.end} />}
    </Tag>
  )
}

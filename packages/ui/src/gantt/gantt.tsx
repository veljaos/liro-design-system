import { Gantt as SvarGantt, type IApi, type IScaleConfig } from '@svar-ui/react-gantt'
import { Flag, MoreHorizontal } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { Alert } from '../components/alert'
import { CompactIconButton } from '../components/button'
import { DropdownMenu } from '../components/dropdown-menu'
import { EmptyState, ErrorState } from '../components/empty-state'
import { MoneyText } from '../components/display-text'
import { NowMarker } from '../components/now-marker'
import { nowMoment, addDays, dayNumber } from '../components/schedule-logic'
import { StatusBadge, type Tone } from '../components/status-badge'
import { STICKY_HEAD, useStickyHead } from '../components/sticky-head'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import {
  chartDate,
  chartEnd,
  chartRange,
  dependencyType,
  dragChange,
  ganttRows,
  isProgress,
  kindOf,
  linkType,
  nowPosition,
  progressWidth,
  type GanttChange,
  type GanttDependency,
  type GanttRow,
  type GanttScale,
  type GanttTask,
} from './gantt-logic'
import { GanttDialogs, GanttList, useRowWords, type GanttDialog } from './gantt-parts'
import { Tooltip } from '../components/popover'

/*
 * Gantt (BUILD-PLAN P5.37; docs/decisions.md "Gantt"): a project's plan — phases, tasks and
 * milestones against time — on SVAR React Gantt (@svar-ui/react-gantt 2.7.3, MIT edition), drawn
 * with Liro tokens (gantt.css; SVAR's themes and icon font are not used).
 * - Desktop: a table at the start — each row's name with its dates and who does it, its progress
 *   and, when the application gives them, a phase's budget and what was spent (decimal strings
 *   through `format`, never added: D4) — and the timeline beside it, the same rows at the same
 *   height. Phases are summary bars, tasks bars with their progress as a line, milestones
 *   diamonds; dependencies are lines. The one "now" marker (D25) comes from the application's
 *   `now`, drawn by Gantt (SVAR's markers are a paid feature). The header rows of both stay below
 *   the shell while the page scrolls (D21).
 * - Edit (`mode="edit"`): drag a bar to move it, its ends to change its dates, its tab to set the
 *   progress, a dot at its end to another bar to add a dependency; and for every drag another way
 *   (WCAG 2.5.7): each row's "Change" menu — Move…, Change dates…, Set progress…, Dependencies… —
 *   opens a dialog titled by the action with the row bold under it (D22). Every edit is reported
 *   through `onChange` (SVAR's `api.intercept` turns a drag into a report and stops it); nothing
 *   changes until the application passes new rows. SVAR's own keys (Backspace deletes, Ctrl+C/X/V/D)
 *   are off.
 * - Right to left: SVAR has none. The whole timeline is mirrored, so time runs from the leading
 *   edge beside the table; its texts are turned back; dragging is off there and the dialogs edit.
 * - Phones (below 48em, or `screen="phone"`): the list by phase with dates; "Timeline" shows the
 *   chart read-only, scrolling sideways inside its card. Editing says where to edit.
 * - The list ("List") is the plan as text on every width; the table names every row in full
 *   ("Task: Floors 3–4, in Structure, 12.10.2026. – 06.11.2026., 20% done, Crew Ilić") and every
 *   bar carries the same name for assistive technology.
 */

/** A row's height on the timeline and in the table, px. */
const ROW = 44
/** One row of the time scale, px; the scale has two. */
const SCALE_ROW = 28
/** Room under the rows for the chart's own sideways scrollbar, px. */
const SCROLLBAR_ROOM = 16
/** A column's width: a day, or a month. */
const COLUMN: Readonly<Record<GanttScale, number>> = { days: 28, months: 64 }

/** A chosen row: the selection surface with the selected bar at its start (D17). */
const SELECTED_ROW =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** The look of a bar by its tone (neutral when the application gives none). Written out. */
const BAR_TONE: Readonly<Record<Tone, string>> = {
  neutral: 'bg-status-neutral-bg text-status-neutral-fg border-status-neutral-border',
  success: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  warning: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
  danger: 'bg-status-danger-bg text-status-danger-fg border-status-danger-border',
  info: 'bg-status-info-bg text-status-info-fg border-status-info-border',
  premium: 'bg-status-premium-bg text-status-premium-fg border-status-premium-border',
}

export interface GanttProps {
  /** Names the plan for assistive technology ("Residential building Liman 4"). */
  label: string
  /** Phases, tasks and milestones; a task names its phase in `parent`. */
  tasks: readonly GanttTask[]
  dependencies?: readonly GanttDependency[]
  /** Default 'view'. 'edit' reports changes through `onChange` (never on a phone). */
  mode?: 'view' | 'edit'
  /** Every edit, as one change; the application applies and saves it. */
  onChange?: (change: GanttChange) => void
  /**
   * The application's clock (D25): "HH:mm" of the provider's `today`, a local
   * "YYYY-MM-DDTHH:mm", or an instant with an offset (shown in the provider's time zone). The
   * one "now" marker stands there; without it, none is drawn.
   */
  now?: string
  /** The scale it opens on. Default 'months'. */
  defaultScale?: GanttScale
  /** 'list' opens on the list by phase. Default: 'timeline' ('list' on a phone). */
  defaultView?: 'timeline' | 'list'
  /** The row chosen when the plan opens, as an application restores it. */
  defaultSelected?: string
  /** A dialog open when the plan opens (edit), as an application restores it. */
  defaultDialog?: GanttDialog
  /** The plan is being fetched: a skeleton in its place. */
  loading?: boolean
  /** The plan could not be fetched: its message and Retry. */
  error?: { message?: string; onRetry: () => void }
  /** Default: from the viewport (below 48em 'phone'). */
  screen?: 'desktop' | 'phone'
  className?: string
}

/** What SVAR draws: our row plus the words its bar shows and is named by. */
interface ChartTask {
  id: string
  text: string
  start: Date
  end: Date
  type: 'summary' | 'task' | 'milestone'
  parent?: string
  open?: boolean
  progress: number
  liroName: string
  liroTone: Tone | undefined
}

/** The bar's look and words (SVAR's `taskTemplate`): our tokens, its name for assistive technology. */
function BarTemplate({ data }: { data: Record<string, unknown> }) {
  const type = data.type
  const label = typeof data.text === 'string' ? data.text : ''
  const name = typeof data.liroName === 'string' ? data.liroName : label
  const tone = (typeof data.liroTone === 'string' ? data.liroTone : 'neutral') as Tone
  const progress = typeof data.progress === 'number' ? data.progress : 0
  if (type === 'milestone') {
    return (
      <>
        <span
          aria-hidden="true"
          data-gantt-text=""
          className="pointer-events-none absolute start-full top-1/2 -translate-y-1/2 ps-1.5 text-xs font-medium whitespace-nowrap text-primary"
        >
          {label}
        </span>
        <span className="sr-only">{name}</span>
      </>
    )
  }
  const summary = type === 'summary'
  return (
    <span
      data-slot="gantt-bar"
      className={cn(
        'pointer-events-none absolute inset-0 box-border flex items-center overflow-hidden rounded-sm border border-solid',
        summary ? 'border-transparent bg-surface-inverse text-on-inverse' : BAR_TONE[tone],
      )}
    >
      <span
        aria-hidden="true"
        data-gantt-text=""
        className="block min-w-0 truncate px-2 text-xs font-medium"
      >
        {label}
      </span>
      <span className="sr-only">{name}</span>
      {progress > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute start-0 bottom-0 h-1',
            summary ? 'bg-surface-raised' : 'bg-current',
          )}
          style={{ width: `${String(progress)}%` }}
        />
      )}
    </span>
  )
}

/** The table at the start of the timeline: one row per bar, at the same height. */
function GanttTable({
  rows,
  words,
  editable,
  budget,
  selected,
  onDialog,
  label,
}: {
  rows: readonly GanttRow[]
  words: ReturnType<typeof useRowWords>
  editable: boolean
  budget: boolean
  selected: string | null
  onDialog: (dialog: GanttDialog) => void
  label: string
}) {
  const { messages } = useLiro()
  const columns = budget
    ? 'grid-cols-[minmax(12rem,1fr)_4rem_8.5rem_8.5rem]'
    : 'grid-cols-[minmax(12rem,1fr)_4rem]'
  const cell = 'flex min-w-0 items-center px-3 box-border'
  return (
    <div
      role="table"
      aria-label={label}
      data-slot="gantt-table"
      className={cn(
        'grid shrink-0 border-0 border-e border-solid border-default text-sm',
        columns,
        budget ? 'w-[33rem]' : 'w-[20rem]',
      )}
    >
      <div role="rowgroup" className="contents">
        <div
          role="row"
          data-sticky-head=""
          className={cn(
            STICKY_HEAD,
            'z-10 col-span-full grid grid-cols-subgrid border-0 border-b border-solid border-default bg-surface-raised',
          )}
          style={{ height: SCALE_ROW * 2 }}
        >
          <span role="columnheader" className={cn(cell, 'text-xs font-semibold text-secondary')}>
            <span className={TEXT_DIRECTION}>{messages['gantt.task']}</span>
          </span>
          <span
            role="columnheader"
            className={cn(cell, 'justify-end text-xs font-semibold text-secondary')}
          >
            <span className={TEXT_DIRECTION}>{messages['gantt.progress']}</span>
          </span>
          {budget && (
            <>
              <span
                role="columnheader"
                className={cn(cell, 'justify-end text-xs font-semibold text-secondary')}
              >
                <span className={TEXT_DIRECTION}>{messages['gantt.planned']}</span>
              </span>
              <span
                role="columnheader"
                className={cn(cell, 'justify-end text-xs font-semibold text-secondary')}
              >
                <span className={TEXT_DIRECTION}>{messages['gantt.actual']}</span>
              </span>
            </>
          )}
        </div>
      </div>
      <div role="rowgroup" className="contents">
        {rows.map(({ task, level, phase }) => {
          const kind = kindOf(task)
          const chosen = selected === task.id
          const menu = editable && kind !== 'phase'
          return (
            <div
              key={task.id}
              role="row"
              data-gantt-row={task.id}
              {...(chosen ? { 'aria-selected': true, 'data-liro-surface': 'selected' } : {})}
              className={cn(
                'relative col-span-full box-border grid grid-cols-subgrid border-0 border-b border-solid border-subtle',
                chosen && SELECTED_ROW,
              )}
              style={{ height: ROW }}
            >
              <span
                role="rowheader"
                className={cn(cell, 'gap-1.5', level > 0 && 'ps-7')}
                aria-label={words.name(task, phase)}
              >
                {kind === 'milestone' && (
                  <Flag aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
                )}
                <span className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
                  <Tooltip label={task.label}>
                    <span
                      className={cn(
                        'block truncate text-sm text-primary',
                        kind === 'phase' ? 'font-semibold' : 'font-medium',
                        TEXT_DIRECTION,
                      )}
                    >
                      {task.label}
                    </span>
                  </Tooltip>
                  <span
                    className={cn(
                      'block truncate text-xs text-secondary tabular-nums',
                      TEXT_DIRECTION,
                    )}
                  >
                    {[words.dates(task), task.assignee].filter((part) => part != null).join(' · ')}
                  </span>
                </span>
                {task.state !== undefined && (
                  <StatusBadge label={task.state.label} tone={task.state.tone} />
                )}
                {menu && (
                  <DropdownMenu
                    align="end"
                    trigger={
                      <CompactIconButton
                        icon={MoreHorizontal}
                        label={messages['gantt.actions'](task.label)}
                      />
                    }
                    entries={[
                      {
                        label: messages['gantt.move'],
                        onSelect: () => {
                          onDialog({ type: 'move', id: task.id })
                        },
                      },
                      {
                        label: messages['gantt.changeDates'],
                        onSelect: () => {
                          onDialog({ type: 'dates', id: task.id })
                        },
                      },
                      ...(kind === 'milestone'
                        ? []
                        : [
                            {
                              label: messages['gantt.setProgress'],
                              onSelect: () => {
                                onDialog({ type: 'progress', id: task.id })
                              },
                            },
                          ]),
                      {
                        label: messages['gantt.dependencies'],
                        onSelect: () => {
                          onDialog({ type: 'dependencies', id: task.id })
                        },
                      },
                    ]}
                  />
                )}
              </span>
              <span
                role="cell"
                className={cn(cell, 'justify-end text-xs text-secondary tabular-nums')}
              >
                {isProgress(task.progress) ? (
                  <span dir="ltr">{words.percent(task.progress)}</span>
                ) : (
                  <span aria-hidden="true">—</span>
                )}
              </span>
              {budget && (
                <>
                  <span role="cell" className={cn(cell, 'justify-end text-xs tabular-nums')}>
                    {task.budget === undefined ? null : (
                      <MoneyText value={task.budget.planned} currency={task.budget.currency} />
                    )}
                  </span>
                  <span
                    role="cell"
                    className={cn(cell, 'flex-col items-end justify-center text-xs tabular-nums')}
                  >
                    {task.budget === undefined ? null : (
                      <>
                        <MoneyText value={task.budget.actual} currency={task.budget.currency} />
                        {task.budget.state !== undefined && (
                          <span
                            className={cn(
                              'text-xs font-medium',
                              TONE_TEXT[task.budget.state.tone],
                              TEXT_DIRECTION,
                            )}
                          >
                            {task.budget.state.label}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** A tone's text colour for a short verdict under an amount (as DueDate's). Written out. */
const TONE_TEXT: Readonly<Record<Tone, string>> = {
  neutral: 'text-secondary',
  success: 'text-status-success-fg',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
  info: 'text-status-info-fg',
  premium: 'text-status-premium-fg',
}

/** One of SVAR's reactive values: told of every change (its `unsubscribe` is not in its types). */
interface Watchable {
  subscribe: (listener: () => void) => void
  unsubscribe?: (listener: () => void) => void
}

/** SVAR's own grid is not drawn: the table is ours. */
const NO_COLUMNS: [] = []

/** SVAR's actions that would change the plan by themselves: never let through. */
const BLOCKED = [
  'hotkey',
  'add-task',
  'delete-task',
  'copy-task',
  'move-task',
  'indent-task',
  'split-task',
  'update-link',
] as const

interface ChartProps {
  label: string
  rows: readonly GanttRow[]
  tasks: readonly GanttTask[]
  dependencies: readonly GanttDependency[]
  scale: GanttScale
  readonly: boolean
  mirrored: boolean
  selected: string | null
  now: string | undefined
  words: ReturnType<typeof useRowWords>
  onSelect: (id: string) => void
  onChange: (change: GanttChange) => void
  onDialog: (dialog: GanttDialog) => void
  onReady: () => void
}

/** The timeline: SVAR's chart, controlled, with our "now" marker. */
function GanttChart(props: ChartProps) {
  const { messages, format, today, timeZone } = useLiro()
  const holder = useRef<HTMLDivElement>(null)
  const api = useRef<IApi | null>(null)
  const hintId = useId()
  const [area, setArea] = useState<HTMLElement | null>(null)
  const [geometry, setGeometry] = useState<{ nowX: number | null; column: number }>({
    nowX: null,
    column: COLUMN[props.scale],
  })
  const nowX = geometry.nowX
  // Bumped after an edit was reported: SVAR's store is rebuilt from the rows, so a bar dragged
  // but not (yet) accepted goes back to where the application has it.
  const [revision, setRevision] = useState(0)

  const latest = useRef(props)
  useLayoutEffect(() => {
    latest.current = props
  })

  const range = useMemo(
    () => chartRange(props.tasks, props.scale, today),
    [props.tasks, props.scale, today],
  )

  const chartTasks = useMemo((): ChartTask[] => {
    // A new revision is a new list: SVAR rebuilds its store from it.
    if (revision < 0) return []
    const parents = new Set(props.rows.map((row) => row.phase?.id))
    return props.rows.map(({ task, phase }) => ({
      id: task.id,
      text: task.label,
      start: chartDate(task.start),
      end: chartEnd(task),
      type:
        kindOf(task) === 'phase' ? 'summary' : kindOf(task) === 'milestone' ? 'milestone' : 'task',
      ...(phase === undefined ? {} : { parent: phase.id }),
      // SVAR walks the children of an open row: only a row with children is opened.
      ...(parents.has(task.id) ? { open: true } : {}),
      progress: progressWidth(task.progress),
      liroName: props.words.name(task, phase),
      liroTone: task.state?.tone,
    }))
  }, [props.rows, props.words, revision])
  const links = useMemo(
    () =>
      props.dependencies.map((dependency) => ({
        id: dependency.id,
        source: dependency.from,
        target: dependency.to,
        type: linkType(dependency.type),
      })),
    [props.dependencies],
  )
  const scales = useMemo((): IScaleConfig[] => {
    if (props.scale === 'days') {
      return [
        {
          unit: 'month',
          step: 1,
          format: (date: Date) =>
            messages['gantt.monthYear'](
              format.monthName(date.getMonth() + 1, 'long'),
              String(date.getFullYear()),
            ),
        },
        { unit: 'day', step: 1, format: (date: Date) => String(date.getDate()) },
      ]
    }
    return [
      { unit: 'year', step: 1, format: (date: Date) => String(date.getFullYear()) },
      {
        unit: 'month',
        step: 1,
        format: (date: Date) => format.monthName(date.getMonth() + 1, 'short'),
      },
    ]
  }, [props.scale, messages, format])
  const selected = useMemo(
    () => (props.selected === null ? [] : [props.selected]),
    [props.selected],
  )
  const start = useMemo(() => chartDate(range.start), [range.start])
  const end = useMemo(() => chartDate(range.end), [range.end])

  const report = useCallback((change: GanttChange) => {
    latest.current.onChange(change)
    setRevision((value) => value + 1)
  }, [])

  const init = useCallback(
    (instance: IApi) => {
      for (const action of BLOCKED) instance.intercept(action, () => false)
      instance.intercept('drag-task', (event: { id: string | number }) => {
        const task = latest.current.tasks.find((each) => each.id === String(event.id))
        return task !== undefined && kindOf(task) !== 'phase'
      })
      instance.intercept(
        'update-task',
        (event: {
          id: string | number
          task: Record<string, unknown>
          diff?: number
          inProgress?: boolean
        }) => {
          if (event.inProgress === true) return true
          const task = latest.current.tasks.find((each) => each.id === String(event.id))
          if (task === undefined) return false
          if ('progress' in event.task && typeof event.task.progress === 'number') {
            const progress = String(Math.round(event.task.progress))
            if (progress !== task.progress) report({ type: 'progress', id: task.id, progress })
            else setRevision((value) => value + 1)
            return false
          }
          const change = dragChange(task, event.task, event.diff)
          if (change !== null) report(change)
          else setRevision((value) => value + 1)
          return false
        },
      )
      instance.intercept(
        'add-link',
        (event: { link: { source?: unknown; target?: unknown; type?: string } }) => {
          const from = String(event.link.source)
          const to = String(event.link.target)
          report({
            type: 'add-dependency',
            from,
            to,
            dependencyType: dependencyType(event.link.type),
          })
          return false
        },
      )
      instance.intercept('delete-link', (event: { id: string | number }) => {
        report({ type: 'remove-dependency', id: String(event.id) })
        return false
      })
      instance.intercept('show-editor', (event: { id: string | number }) => {
        const task = latest.current.tasks.find((each) => each.id === String(event.id))
        if (task !== undefined && kindOf(task) !== 'phase' && !latest.current.readonly) {
          latest.current.onDialog({ type: 'dates', id: task.id })
        }
        return false
      })
      instance.on('select-task', (event: { id: string | number }) => {
        latest.current.onSelect(String(event.id))
      })
    },
    [report],
  )

  // SVAR's layout box takes no Tab stop of its own; the scrolling chart does, named, so the
  // keyboard can scroll it (the rows' words are in the table). Its link-removal button is named.
  useEffect(() => {
    const root = holder.current
    if (root === null) return
    const name = () => {
      root.querySelector('.wx-layout')?.setAttribute('tabindex', '-1')
      const chart = root.querySelector('.wx-chart')
      if (chart !== null) {
        chart.setAttribute('tabindex', '0')
        chart.setAttribute('role', 'region')
        chart.setAttribute('aria-label', messages['gantt.timeline'](latest.current.label))
        chart.setAttribute('aria-describedby', hintId)
      }
      for (const button of root.querySelectorAll('.wx-delete-button')) {
        button.setAttribute('aria-label', messages['gantt.removeDependency'](''))
      }
    }
    name()
    setArea(root.querySelector<HTMLElement>('.wx-area'))
    const observer = new MutationObserver(name)
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
    }
  }, [messages, hintId])

  // "Now": the application's moment on the chart's own scale (as SVAR places a bar), plus the
  // part of the day that has passed. Opens with today in view. A passive effect: SVAR rebuilds its
  // store from new props in its own (child) effect, which runs first.
  const scrolled = useRef<string | null>(null)
  useEffect(() => {
    const instance = api.current
    if (instance === null) return
    const reactive = instance.getReactiveState() as unknown as Record<string, Watchable | undefined>
    const moment = props.now === undefined ? null : nowMoment(props.now, today, timeZone)
    const key = `${props.scale}:${range.start}`
    let frame = 0
    const measure = () => {
      frame = 0
      const state = instance.getState()
      const scales = state._scales
      const cellWidth = state.cellWidth ?? COLUMN[props.scale]
      let x: number | null = null
      if (scales !== undefined && moment !== null) {
        const inRange =
          dayNumber(moment.day) >= dayNumber(range.start) &&
          dayNumber(moment.day) < dayNumber(range.end)
        if (inRange) {
          const at = (day: string) =>
            scales.diff(chartDate(day), scales.start, scales.lengthUnit) * cellWidth
          x = nowPosition(at(moment.day), at(addDays(moment.day, 1)), moment.minutes)
        }
      }
      setGeometry({ nowX: x, column: cellWidth })
      // Measured: SVAR knows the chart's width (it widens the columns of a short plan to fill it).
      if (state._chartWidth === undefined) return
      if (scrolled.current !== key) {
        scrolled.current = key
        void instance.exec('scroll-chart', { left: Math.max(0, Math.round((x ?? 0) - 160)) })
      }
      latest.current.onReady()
    }
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure)
    }
    const watched = [reactive._scales, reactive._chartWidth].filter(
      (each): each is Watchable => each !== undefined,
    )
    for (const each of watched) each.subscribe(schedule)
    // SVAR measures its chart after the first paint; a chart wider than the plan keeps its scale.
    const tag = Symbol('liro-gantt-now')
    instance.on('resize-chart', schedule, { tag })
    return () => {
      cancelAnimationFrame(frame)
      for (const each of watched) each.unsubscribe?.(schedule)
      instance.detach(tag)
    }
  }, [props.now, props.scale, range, today, timeZone])

  const height = SCALE_ROW * 2 + props.rows.length * ROW + SCROLLBAR_ROOM
  const style = {
    height,
    '--liro-gantt-column': `${String(geometry.column)}px`,
    '--liro-gantt-row': `${String(ROW)}px`,
  } as CSSProperties
  const moment = props.now === undefined ? null : nowMoment(props.now, today, timeZone)
  return (
    <div ref={holder} dir="ltr" className="relative min-w-0 flex-1" style={style}>
      <p id={hintId} className="sr-only">
        {props.readonly
          ? messages['gantt.timelineHint']
          : `${messages['gantt.timelineHint']} ${messages['gantt.dragHint']}`}
      </p>
      <SvarGantt
        tasks={chartTasks}
        links={links}
        scales={scales}
        columns={NO_COLUMNS}
        displayMode="chart"
        start={start}
        end={end}
        autoScale={false}
        lengthUnit="day"
        cellWidth={COLUMN[props.scale]}
        cellHeight={ROW}
        scaleHeight={SCALE_ROW}
        readonly={props.readonly}
        selected={selected}
        taskTemplate={BarTemplate}
        init={init}
        ref={api}
      />
      {area !== null &&
        nowX !== null &&
        moment !== null &&
        createPortal(
          <NowMarker
            orientation="vertical"
            label={messages['gantt.now'](
              `${format.date(moment.day)} ${String(Math.floor(moment.minutes / 60)).padStart(2, '0')}:${String(moment.minutes % 60).padStart(2, '0')}`,
            )}
            // Under the bars (`.wx-bars` is layer 1 in gantt.css): they cover its line (P5.90).
            className="z-0"
            style={{ insetInlineStart: nowX, top: 0, bottom: 0 }}
          />,
          area,
        )}
    </div>
  )
}

/** A project's plan: phases, tasks and milestones against time, with their dependencies. */
export function Gantt(props: GanttProps) {
  const { messages, format, direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.screen === undefined ? viewportPhone : props.screen === 'phone'
  const mode = props.mode ?? 'view'
  const rtl = direction === 'rtl'
  const editable = mode === 'edit' && !phone
  const dependencies = useMemo(() => props.dependencies ?? [], [props.dependencies])
  const rows = useMemo(() => ganttRows(props.tasks), [props.tasks])
  const words = useRowWords(props.tasks, dependencies)
  const budget = props.tasks.some((task) => task.budget !== undefined)
  const [scale, setScale] = useState<GanttScale>(props.defaultScale ?? 'months')
  const [view, setView] = useState<'timeline' | 'list'>(
    props.defaultView ?? (phone ? 'list' : 'timeline'),
  )
  const [selected, setSelected] = useState<string | null>(props.defaultSelected ?? null)
  const [dialog, setDialog] = useState<GanttDialog | null>(
    editable ? (props.defaultDialog ?? null) : null,
  )
  const [announcement, setAnnouncement] = useState('')
  const [ready, setReady] = useState(false)
  const region = useRef<HTMLDivElement>(null)
  useStickyHead(region, !phone && view === 'timeline')

  const labelOf = (id: string) => props.tasks.find((task) => task.id === id)?.label ?? id
  const change = (next: GanttChange) => {
    props.onChange?.(next)
    if (next.type === 'dates') {
      const range =
        next.start === next.end
          ? format.date(next.start)
          : `${format.date(next.start)} – ${format.date(next.end)}`
      setAnnouncement(messages['gantt.changedDates'](labelOf(next.id), range))
    } else if (next.type === 'progress') {
      setAnnouncement(
        messages['gantt.changedProgress'](
          labelOf(next.id),
          messages['gantt.done'](format.percent(next.progress)),
        ),
      )
    } else if (next.type === 'add-dependency') {
      setAnnouncement(messages['gantt.addedDependency'](labelOf(next.to), labelOf(next.from)))
    } else {
      const removed = dependencies.find((each) => each.id === next.id)
      if (removed !== undefined) {
        setAnnouncement(
          messages['gantt.removedDependency'](labelOf(removed.to), labelOf(removed.from)),
        )
      }
    }
  }

  let body
  if (props.loading === true) {
    body = (
      <div
        role="region"
        aria-label={props.label}
        aria-busy="true"
        className="flex flex-col gap-2 rounded-md border border-solid border-default bg-surface-raised p-4"
      >
        <span className="sr-only">{messages['gantt.loading']}</span>
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-8" />
        ))}
      </div>
    )
  } else if (props.error !== undefined) {
    body = (
      <ErrorState
        title={props.error.message ?? messages['gantt.error']}
        action={{ label: messages['gantt.retry'], onClick: props.error.onRetry }}
      />
    )
  } else if (props.tasks.length === 0) {
    body = <EmptyState title={messages['gantt.empty']} />
  } else if (view === 'list') {
    body = <GanttList tasks={props.tasks} dependencies={dependencies} label={props.label} />
  } else {
    body = (
      <div
        ref={region}
        data-slot="gantt-timeline"
        className={cn(
          'liro-gantt flex min-w-0 overflow-hidden rounded-md border border-solid border-default bg-surface-raised',
        )}
        {...(rtl ? { 'data-mirrored': '' } : {})}
        {...(!editable || rtl ? { 'data-readonly': '' } : {})}
      >
        {!phone && (
          <GanttTable
            rows={rows}
            words={words}
            editable={editable}
            budget={budget}
            selected={selected}
            label={props.label}
            onDialog={setDialog}
          />
        )}
        <GanttChart
          label={props.label}
          rows={rows}
          tasks={props.tasks}
          dependencies={dependencies}
          scale={scale}
          readonly={!editable || rtl}
          mirrored={rtl}
          selected={selected}
          now={props.now}
          words={words}
          onSelect={setSelected}
          onChange={change}
          onDialog={setDialog}
          onReady={() => {
            setReady(true)
          }}
        />
      </div>
    )
  }

  const settled = props.loading === true || props.error !== undefined || view === 'list' || ready
  const tools = props.tasks.length > 0 && props.loading !== true && props.error === undefined
  return (
    <div
      data-slot="gantt"
      {...(settled ? { 'data-ready': '' } : {})}
      className={cn('flex min-w-0 flex-col gap-3', props.className)}
    >
      {tools && (
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            aria-label={messages['gantt.view']}
            onValueChange={(value) => {
              if (value === 'timeline' || value === 'list') setView(value)
            }}
          >
            <ToggleGroupItem value="timeline">{messages['gantt.timelineView']}</ToggleGroupItem>
            <ToggleGroupItem value="list">{messages['gantt.listView']}</ToggleGroupItem>
          </ToggleGroup>
          {view === 'timeline' && (
            <ToggleGroup
              type="single"
              value={scale}
              aria-label={messages['gantt.scale']}
              onValueChange={(value) => {
                if (value === 'days' || value === 'months') setScale(value)
              }}
            >
              <ToggleGroupItem value="months">{messages['gantt.scaleMonths']}</ToggleGroupItem>
              <ToggleGroupItem value="days">{messages['gantt.scaleDays']}</ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      )}
      {mode === 'edit' && phone && tools && (
        <Alert tone="neutral" title={messages['gantt.editOnLargerScreen']} />
      )}
      {body}
      {editable && (
        <GanttDialogs
          dialog={dialog}
          tasks={props.tasks}
          dependencies={dependencies}
          onClose={() => {
            setDialog(null)
          }}
          onChange={change}
        />
      )}
      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}

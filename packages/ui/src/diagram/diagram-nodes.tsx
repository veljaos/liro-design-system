import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  Position,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import {
  CircleCheck,
  CircleDashed,
  CirclePlay,
  CircleSlash,
  CircleX,
  Clock3,
  Cog,
  Hourglass,
  Mail,
  Plus,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { createContext, useContext, type ReactNode } from 'react'
import type { Family, IconComponent } from '../components/intents'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import type { LiroMessages } from '../provider/messages'
import { useLiro } from '../provider/liro-provider'
import {
  COMPACT_LABEL_GAP,
  COMPACT_LABEL_WIDTH,
  isTaskKind,
  shapeSize,
  type DiagramConnection,
  type DiagramFocus,
  type DiagramLayout,
  type DiagramProblem,
  type DiagramStep,
  type DiagramStepKind,
  type DiagramStepState,
} from './diagram-logic'

/*
 * The parts Diagram draws inside React Flow: a step in its BPMN-style shape, a lane's band and a
 * connection. Drawn by us with tokens (no React Flow style sheet): a task is a box (radius md,
 * 1.5px border.control, which keeps 3:1 against every surface for WCAG 1.4.11), an event a
 * circle (the end event's ring 3px in text.primary), a gateway a diamond with its X or +, a
 * sub-process a box with the + marker. Labels are HTML, so their words keep their order in
 * every direction (D15). States are an icon, words and a status tone — never blue (D17); the
 * blue in the canvas is the focus ring and a connection being dragged.
 */

// ── Shared state ──────────────────────────────────────────────────────────────────────────────

/** An action the application offers on a step of a run ("Retry", "Skip"). */
export interface DiagramStepAction {
  key: string
  label: string
  icon: IconComponent
  /** Default 'neutral'. */
  family?: Family
}

/** A step's state in a run, from the application. */
export interface DiagramRunStep {
  state: DiagramStepState
  /** A short line under the state, written by the application ("02:14, 3 s", "Ana Petrović"). */
  note?: string
  /** Why it failed or was skipped ("The bank's server did not answer."). */
  reason?: string
  /**
   * The step's log or the response it got (secrets already masked by the application), shown on
   * request under the reason in a small CodeBlock (P5.93).
   */
  log?: string
  /** The log's language for CodeBlock ("json", "xml", "ansi" for terminal output). */
  logLanguage?: string
  /** What the user may do now, the main action last (Skip, Retry). */
  actions?: readonly DiagramStepAction[]
}

export interface DiagramView {
  mode: 'view' | 'edit' | 'run'
  /** Edit mode on a screen that allows it (never a phone). */
  editable: boolean
  layout: DiagramLayout
  rtl: boolean
  states: Readonly<Record<string, DiagramRunStep | undefined>>
  /** The connections a run went along; null outside a run. */
  path: ReadonlySet<string> | null
  stepProblems: ReadonlyMap<string, DiagramProblem[]>
  connectionProblems: ReadonlyMap<string, DiagramProblem[]>
  selected: DiagramFocus | null
  onStepAction?: (stepId: string, action: string) => void
}

export const DiagramContext = createContext<DiagramView | null>(null)

function useDiagramView(): DiagramView {
  const view = useContext(DiagramContext)
  if (view === null) throw new Error('A diagram part must be inside Diagram')
  return view
}

/** The message key that names each kind. */
export const KIND_MESSAGE = {
  start: 'diagram.start',
  end: 'diagram.end',
  task: 'diagram.task',
  'user-task': 'diagram.userTask',
  'service-task': 'diagram.serviceTask',
  'sub-process': 'diagram.subProcess',
  timer: 'diagram.timer',
  message: 'diagram.message',
  exclusive: 'diagram.exclusive',
  parallel: 'diagram.parallel',
} as const satisfies Record<DiagramStepKind, keyof LiroMessages>

/** Each state's icon, words and tone (status tones; running is neutral, never blue). */
export const STATE_LOOK = {
  done: { icon: CircleCheck, message: 'diagram.done', text: 'text-status-success-fg' },
  running: { icon: CirclePlay, message: 'diagram.running', text: 'text-primary' },
  waiting: { icon: Hourglass, message: 'diagram.waiting', text: 'text-status-warning-fg' },
  failed: { icon: CircleX, message: 'diagram.failed', text: 'text-status-danger-fg' },
  skipped: { icon: CircleSlash, message: 'diagram.skipped', text: 'text-secondary' },
  'not-reached': { icon: CircleDashed, message: 'diagram.notReached', text: 'text-tertiary' },
} as const satisfies Record<
  DiagramStepState,
  { icon: IconComponent; message: keyof LiroMessages; text: string }
>

// ── A step ────────────────────────────────────────────────────────────────────────────────────

export type StepNode = Node<{ step: DiagramStep }, 'step'>

/** The sides a step's connections arrive at and leave from, mirrored in right-to-left. */
export function handleSides(layout: DiagramLayout, rtl: boolean) {
  if (layout === 'top-to-bottom') return { target: Position.Top, source: Position.Bottom }
  return rtl
    ? { target: Position.Right, source: Position.Left }
    : { target: Position.Left, source: Position.Right }
}

function Handles({ step }: { step: DiagramStep }) {
  const view = useDiagramView()
  const sides = handleSides(view.layout, view.rtl)
  const into = view.editable && step.kind !== 'start'
  const outOf = view.editable && step.kind !== 'end'
  return (
    <>
      <Handle
        type="target"
        position={sides.target}
        isConnectable={into}
        data-slot="diagram-handle"
        data-hidden={!into}
        className="nodrag"
      />
      <Handle
        type="source"
        position={sides.source}
        isConnectable={outOf}
        data-slot="diagram-handle"
        data-hidden={!outOf}
        className="nodrag"
      />
    </>
  )
}

/**
 * The state under a step's name: icon and words, the note and the reason. A step's actions stand
 * above the canvas (`RunAttention`), at full size whatever the zoom.
 */
function RunState({ step }: { step: DiagramStep }) {
  const view = useDiagramView()
  const { messages } = useLiro()
  if (view.mode !== 'run') return null
  const run = view.states[step.id]
  const state = run?.state ?? 'not-reached'
  const look = STATE_LOOK[state]
  const Icon = look.icon
  return (
    <div data-slot="diagram-step-state" className="flex w-full flex-col items-center gap-1">
      <p
        className={cn(
          'm-0 flex items-center justify-center gap-1 text-xs font-medium',
          look.text,
          state === 'running' && 'font-semibold',
        )}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className={TEXT_ISOLATE}>{messages[look.message]}</span>
      </p>
      {run?.note !== undefined && (
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{run.note}</p>
      )}
      {run?.reason !== undefined && (
        <p
          className={cn(
            'm-0 text-xs',
            state === 'failed' ? 'text-status-danger-fg' : 'text-secondary',
            TEXT_DIRECTION,
          )}
        >
          {run.reason}
        </p>
      )}
    </div>
  )
}

/** The danger badge with a step's number of problems. */
function ProblemBadge({ count }: { count: number }) {
  const { format } = useLiro()
  return (
    <span
      aria-hidden="true"
      data-slot="diagram-problem-badge"
      className="absolute -end-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full border border-solid border-status-danger-border bg-status-danger-bg px-1 text-xs font-semibold text-status-danger-fg"
    >
      <TriangleAlert className="size-3 shrink-0" />
      {count > 1 && <bdi>{format.number(String(count))}</bdi>}
    </span>
  )
}

/** The outline of a step for its state, problems and selection. */
function outline(view: DiagramView, step: DiagramStep) {
  const state = view.mode === 'run' ? (view.states[step.id]?.state ?? 'not-reached') : null
  const problem = (view.stepProblems.get(step.id)?.length ?? 0) > 0
  const selected = view.selected?.type === 'step' && view.selected.id === step.id
  return { state, problem, selected }
}

/** The stroke and fill classes of an event's circle or a gateway's diamond. */
function shapeClasses(view: DiagramView, step: DiagramStep) {
  const { state, problem, selected } = outline(view, step)
  if (selected)
    return {
      stroke: 'stroke-(--liro-border-selected)',
      fill: 'fill-(--liro-surface-selected)',
      width: 2.5,
    }
  if (problem || state === 'failed') {
    return {
      stroke: 'stroke-(--liro-status-danger-fg)',
      fill: 'fill-(--liro-surface-raised)',
      width: 2.5,
    }
  }
  if (state === 'running') {
    return {
      stroke: 'stroke-(--liro-text-primary)',
      fill: 'fill-(--liro-surface-raised)',
      width: 2.5,
    }
  }
  return {
    stroke: 'stroke-(--liro-border-control)',
    fill: 'fill-(--liro-surface-raised)',
    width: 1.5,
  }
}

/** An event's circle or a gateway's diamond, drawn in SVG, with its marker. */
function Shape({ step }: { step: DiagramStep }) {
  const view = useDiagramView()
  const size = shapeSize(step.kind)
  const { stroke, fill, width } = shapeClasses(view, step)
  const half = size / 2
  const state = view.mode === 'run' ? (view.states[step.id]?.state ?? 'not-reached') : null
  const dashed = state === 'skipped' || state === 'not-reached'
  let drawn: ReactNode
  if (step.kind === 'exclusive' || step.kind === 'parallel') {
    const inset = width
    const points = `${String(half)},${String(inset)} ${String(size - inset)},${String(half)} ${String(half)},${String(size - inset)} ${String(inset)},${String(half)}`
    const arm = size * 0.16
    drawn = (
      <>
        <polygon
          points={points}
          className={cn(stroke, fill)}
          strokeWidth={width}
          strokeDasharray={dashed ? '4 3' : undefined}
        />
        {step.kind === 'exclusive' ? (
          <path
            d={`M ${String(half - arm)} ${String(half - arm)} L ${String(half + arm)} ${String(half + arm)} M ${String(half + arm)} ${String(half - arm)} L ${String(half - arm)} ${String(half + arm)}`}
            className="stroke-(--liro-text-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ) : (
          <path
            d={`M ${String(half)} ${String(half - arm * 1.3)} L ${String(half)} ${String(half + arm * 1.3)} M ${String(half - arm * 1.3)} ${String(half)} L ${String(half + arm * 1.3)} ${String(half)}`}
            className="stroke-(--liro-text-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
      </>
    )
  } else {
    const ring = step.kind === 'end' ? 3 : width
    const r = half - ring / 2
    drawn = (
      <>
        <circle
          cx={half}
          cy={half}
          r={r}
          className={cn(
            step.kind === 'end' && width === 1.5 ? 'stroke-(--liro-text-primary)' : stroke,
            fill,
          )}
          strokeWidth={step.kind === 'end' ? Math.max(3, width) : width}
          strokeDasharray={dashed ? '4 3' : undefined}
        />
        {(step.kind === 'timer' || step.kind === 'message') && (
          <circle
            cx={half}
            cy={half}
            r={r - 3.5}
            className={cn(stroke, 'fill-none')}
            strokeWidth={1.5}
          />
        )}
      </>
    )
  }
  const Marker = step.kind === 'timer' ? Clock3 : step.kind === 'message' ? Mail : null
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        className="block overflow-visible"
      >
        {drawn}
      </svg>
      {Marker !== null && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <Marker className="size-4 text-primary" />
        </span>
      )}
      <Handles step={step} />
    </div>
  )
}

/** The marker in a task's corner: a person (user task) or a cog (automatic task). */
function TaskMarker({ kind }: { kind: DiagramStepKind }) {
  const Icon = kind === 'user-task' ? UserRound : kind === 'service-task' ? Cog : null
  if (Icon === null) return null
  return <Icon aria-hidden="true" className="absolute start-2 top-2 size-3.5 text-secondary" />
}

/** A step in React Flow: a task's box, or an event's or gateway's shape with its label. */
export function StepNodeView({ data }: NodeProps<StepNode>) {
  const view = useDiagramView()
  const { direction } = useLiro()
  const { step } = data
  const { state, problem, selected } = outline(view, step)
  const problems = view.stepProblems.get(step.id)?.length ?? 0
  const muted = state === 'skipped' || state === 'not-reached'
  const label = (
    <p
      className={cn(
        'm-0 text-primary',
        isTaskKind(step.kind) ? 'text-sm font-medium' : 'text-xs',
        muted && 'text-secondary',
        TEXT_DIRECTION,
      )}
    >
      {step.label}
    </p>
  )
  if (isTaskKind(step.kind)) {
    return (
      <div
        dir={direction}
        data-slot="diagram-step"
        data-kind={step.kind}
        data-state={state ?? undefined}
        data-selected={selected || undefined}
        className={cn(
          'relative box-border flex min-h-16 w-44 flex-col items-center justify-center gap-1 rounded-md border-solid px-3 py-2 text-center font-sans',
          step.kind === 'user-task' || step.kind === 'service-task' ? 'pt-5' : '',
          step.kind === 'sub-process' ? 'pb-6' : '',
          selected
            ? 'border-2 border-selected bg-surface-selected'
            : problem || state === 'failed'
              ? 'border-2 border-status-danger-fg bg-surface-raised'
              : state === 'running'
                ? 'border-2 border-(--liro-text-primary) bg-surface-raised'
                : cn(
                    'border-[1.5px] border-control bg-surface-raised',
                    muted && 'border-dashed bg-surface-sunken',
                  ),
        )}
      >
        <TaskMarker kind={step.kind} />
        {label}
        <RunState step={step} />
        {step.kind === 'sub-process' && (
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 start-1/2 flex size-3.5 -translate-x-1/2 items-center justify-center rounded-xs border border-solid border-(--liro-text-secondary) rtl:translate-x-1/2"
          >
            <Plus className="size-3 text-secondary" />
          </span>
        )}
        {problems > 0 && <ProblemBadge count={problems} />}
        <Handles step={step} />
      </div>
    )
  }
  const shape = shapeSize(step.kind)
  const content = (
    <div className="flex min-w-0 flex-col items-center gap-1">
      {label}
      <RunState step={step} />
    </div>
  )
  if (view.layout === 'top-to-bottom') {
    // Beside the shape at the end side; the box symmetric around the shape.
    return (
      <div
        dir={direction}
        data-slot="diagram-step"
        data-kind={step.kind}
        data-state={state ?? undefined}
        className="relative grid items-start font-sans"
        style={{
          gridTemplateColumns: `${String(COMPACT_LABEL_WIDTH + COMPACT_LABEL_GAP)}px ${String(shape)}px ${String(COMPACT_LABEL_WIDTH + COMPACT_LABEL_GAP)}px`,
        }}
      >
        <span />
        <div className="relative">
          <Shape step={step} />
          {problems > 0 && <ProblemBadge count={problems} />}
        </div>
        <div className="ps-1 text-start [&_p]:text-start [&>div]:items-start">{content}</div>
      </div>
    )
  }
  return (
    <div
      dir={direction}
      data-slot="diagram-step"
      data-kind={step.kind}
      data-state={state ?? undefined}
      className="relative flex flex-col items-center gap-1 text-center font-sans"
      style={{ width: COMPACT_LABEL_WIDTH }}
    >
      <div className="relative">
        <Shape step={step} />
        {problems > 0 && <ProblemBadge count={problems} />}
      </div>
      {content}
    </div>
  )
}

// ── A lane ────────────────────────────────────────────────────────────────────────────────────

export type LaneNode = Node<{ label: string; index: number; last: boolean }, 'lane'>

/** A lane's band: its label at the top-start corner, a line between bands. */
export function LaneNodeView({ data }: NodeProps<LaneNode>) {
  const view = useDiagramView()
  const { direction } = useLiro()
  return (
    <div
      dir={direction}
      data-slot="diagram-lane"
      className={cn(
        'box-border size-full border-0 border-solid border-default font-sans',
        data.index % 2 === 1 && 'bg-surface-hover',
        !data.last && (view.layout === 'start-to-end' ? 'border-b' : 'border-e'),
      )}
    >
      <p className={cn('m-0 px-3 pt-3 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {data.label}
      </p>
    </div>
  )
}

// ── A connection ──────────────────────────────────────────────────────────────────────────────

export type ConnectionEdge = Edge<{ connection: DiagramConnection }, 'connection'>

/** The arrowhead's length; the line stops at its base. */
const ARROW = 8

/** A point `by` pixels back from the target along the side it enters from. */
function backOff(x: number, y: number, side: Position, by: number): [number, number] {
  if (side === Position.Left) return [x - by, y]
  if (side === Position.Right) return [x + by, y]
  if (side === Position.Top) return [x, y - by]
  return [x, y + by]
}

/** The arrowhead at the target, pointing into the step. */
function arrowPoints(x: number, y: number, side: Position): string {
  const half = ARROW / 2
  const [bx, by] = backOff(x, y, side, ARROW)
  const across =
    side === Position.Left || side === Position.Right
      ? [
          [bx, by - half],
          [bx, by + half],
        ]
      : [
          [bx - half, by],
          [bx + half, by],
        ]
  return [[x, y], ...across].map(([px, py]) => `${String(px)},${String(py)}`).join(' ')
}

/** The default flow's slash, 12px from the source across the line. */
function defaultMark(x: number, y: number, side: Position): string {
  const [cx, cy] = backOff(x, y, side, -12)
  return side === Position.Left || side === Position.Right
    ? `M ${String(cx - 4)} ${String(cy + 6)} L ${String(cx + 4)} ${String(cy - 6)}`
    : `M ${String(cx - 6)} ${String(cy - 4)} L ${String(cx + 6)} ${String(cy + 4)}`
}

/**
 * Where a connection's label stands: beside its last stretch, just before the arrow — above it
 * when the connection arrives from a side, at its end side when it arrives from the top — so
 * the branches out of one decision never share a place.
 */
export function labelTransform(x: number, y: number, side: Position, rtl: boolean): string {
  const gap = ARROW + 6
  if (side === Position.Left)
    return `translate(${String(x - gap)}px, ${String(y - 3)}px) translate(-100%, -100%)`
  if (side === Position.Right)
    return `translate(${String(x + gap)}px, ${String(y - 3)}px) translate(0, -100%)`
  if (side === Position.Top) {
    return rtl
      ? `translate(${String(x - 6)}px, ${String(y - gap)}px) translate(-100%, -100%)`
      : `translate(${String(x + 6)}px, ${String(y - gap)}px) translate(0, -100%)`
  }
  return `translate(${String(x + 6)}px, ${String(y + gap)}px)`
}

/** A connection: a line with rounded corners, its arrowhead, its default mark and its label. */
export function ConnectionEdgeView(props: EdgeProps<ConnectionEdge>) {
  const view = useDiagramView()
  const { direction } = useLiro()
  const connection = props.data?.connection
  const [targetX, targetY] = backOff(props.targetX, props.targetY, props.targetPosition, ARROW - 1)
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX,
    targetY,
    targetPosition: props.targetPosition,
    borderRadius: 8,
    offset: 20,
  })
  const selected = view.selected?.type === 'connection' && view.selected.id === props.id
  const problem = (view.connectionProblems.get(props.id)?.length ?? 0) > 0
  const taken = view.path?.has(props.id) ?? false
  const look = selected
    ? {
        stroke: 'stroke-(--liro-border-selected)',
        fill: 'fill-(--liro-border-selected)',
        width: 2.5,
        dash: undefined,
      }
    : problem
      ? {
          stroke: 'stroke-(--liro-status-danger-fg)',
          fill: 'fill-(--liro-status-danger-fg)',
          width: 2,
          dash: undefined,
        }
      : view.path !== null && taken
        ? {
            stroke: 'stroke-(--liro-text-primary)',
            fill: 'fill-(--liro-text-primary)',
            width: 2.5,
            dash: undefined,
          }
        : view.path !== null
          ? {
              stroke: 'stroke-(--liro-border-control)',
              fill: 'fill-(--liro-border-control)',
              width: 1.5,
              dash: '5 4',
            }
          : {
              stroke: 'stroke-(--liro-border-control)',
              fill: 'fill-(--liro-border-control)',
              width: 1.5,
              dash: undefined,
            }
  return (
    <>
      <path
        d={path}
        data-slot="diagram-edge-focus"
        className="fill-none stroke-transparent"
        strokeWidth={6}
      />
      <path
        d={path}
        data-slot="diagram-edge"
        data-taken={view.path === null ? undefined : taken}
        className={cn('fill-none', look.stroke)}
        strokeWidth={look.width}
        strokeDasharray={look.dash}
      />
      <polygon
        points={arrowPoints(props.targetX, props.targetY, props.targetPosition)}
        className={look.fill}
      />
      {connection?.isDefault === true && (
        <path
          d={defaultMark(props.sourceX, props.sourceY, props.sourcePosition)}
          data-slot="diagram-default-mark"
          className={look.stroke}
          strokeWidth={1.5}
        />
      )}
      <path
        d={path}
        className="react-flow__edge-interaction fill-none stroke-transparent"
        strokeWidth={20}
      />
      {connection?.label !== undefined && connection.label !== '' && (
        <EdgeLabelRenderer>
          <div
            dir={direction}
            data-slot="diagram-edge-label"
            className={cn(
              'absolute max-w-40 rounded-sm border border-solid bg-surface-raised px-1.5 py-0.5 text-center font-sans text-xs',
              problem
                ? 'border-status-danger-border text-status-danger-fg'
                : 'border-default text-secondary',
              view.path !== null && taken && 'font-medium text-primary',
            )}
            style={{
              transform: labelTransform(
                props.targetX,
                props.targetY,
                props.targetPosition,
                view.rtl,
              ),
            }}
          >
            <span className={TEXT_ISOLATE}>{connection.label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

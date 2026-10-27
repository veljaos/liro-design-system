import {
  ConnectionLineType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeTypes,
  type FitViewOptions,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react'
import {
  AlertTriangle,
  ListOrdered,
  Maximize,
  Pencil,
  Plus,
  Spline,
  Trash2,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Alert } from '../components/alert'
import { Button, CompactIconButton } from '../components/button'
import { DropdownMenu } from '../components/dropdown-menu'
import { usePhone } from '../components/use-phone'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import {
  addStepOperations,
  canConnect,
  connectionTargets,
  defaultStepSize,
  DIAGRAM_STEP_KINDS,
  diagramKeyTarget,
  drawnX,
  keyMoveDelta,
  layoutDiagram,
  layoutX,
  nextDiagramId,
  positionAfter,
  problemsByTarget,
  removeStepOperations,
  stepOrder,
  takenIds,
  type DiagramConnection,
  type DiagramFocus,
  type DiagramIdMaker,
  type DiagramLane,
  type DiagramLayout,
  type DiagramOperation,
  type DiagramPosition,
  type DiagramProblem,
  type DiagramSize,
  type DiagramStep,
  type DiagramStepKind,
} from './diagram-logic'
import {
  ConnectionEdgeView,
  DiagramContext,
  KIND_MESSAGE,
  LaneNodeView,
  STATE_LOOK,
  StepNodeView,
  type ConnectionEdge,
  type DiagramView,
  type LaneNode,
  type StepNode,
} from './diagram-nodes'
import {
  EditDialog,
  KindGlyph,
  ProblemsList,
  RunAttention,
  RunSummary,
  StepsList,
  type DiagramDialog,
  type DiagramRun,
} from './diagram-parts'

/*
 * Diagram (BUILD-PLAN P5.26; docs/decisions.md "Diagrams"): a process of steps and connections
 * — a workflow, an approval, an orchestrator's job — on React Flow (@xyflow/react, MIT) with
 * dagre (MIT) for the automatic layout, in a BPMN-style notation drawn with tokens. One
 * component in three modes:
 * - view: read only. Fit to the view, zoom buttons, an optional overview (minimap). Every step
 *   is a Tab stop in the flow's order, named by its kind, name, lane and state; the arrow keys
 *   follow the connections (`diagramKeyTarget`), so every step and connection is reachable.
 * - edit: a palette of kinds (click adds after the chosen step; drag places it), "Add step
 *   after…", "Connect to…" (or a drag between the handles), "Label…", "Rename…", "Remove"; a
 *   step moves by dragging or, chosen with Enter, by the arrow keys. Every change is reported
 *   through `onChange` as operations; nothing is saved here (`applyDiagramOperations` is what an
 *   application does with them). The application's validation messages stand on their steps and
 *   in a list ("3 problems") with Go to.
 * - run: one instance's state per step as icon, words and a status tone (never blue), the path
 *   taken drawn strong and the rest dashed, a failed step's actions (Retry, Skip) through
 *   `onStepAction`, and a summary line.
 * Phones show view and run only; edit says where to edit. The steps list ("Show steps as a
 * list") is the diagram's text alternative everywhere.
 * Every drag has another way (WCAG 2.5.7): the palette by click, a connection by "Connect to…",
 * a move by the arrow keys. Layout from the leading edge: start-to-end is mirrored in
 * right-to-left pages; labels are HTML in the page's direction with their own text order (D15).
 */

type FlowNode = StepNode | LaneNode

const NODE_TYPES = { step: StepNodeView, lane: LaneNodeView } satisfies NodeTypes
const EDGE_TYPES = { connection: ConnectionEdgeView } satisfies EdgeTypes

/**
 * Fit to the view: 24px of room around (with the overview, room under the steps for it), never
 * larger than 100%. No animation, so a picture is the same every time.
 */
function fitOptions(minimap: boolean): FitViewOptions<FlowNode> {
  return {
    padding: minimap ? { top: '24px', x: '24px', bottom: '136px' } : '24px',
    maxZoom: 1,
    minZoom: 0.2,
  }
}

export interface DiagramProps {
  /** Names the diagram for assistive technology ("Approval of an incoming invoice"). */
  label: string
  steps: readonly DiagramStep[]
  connections: readonly DiagramConnection[]
  /** Lanes as labelled bands, in this order; each step names its lane. */
  lanes?: readonly DiagramLane[]
  /** Default 'view'. 'edit' reports changes through `onChange`; 'run' shows `run`. */
  mode?: 'view' | 'edit' | 'run'
  /** Default 'start-to-end' (mirrored in right-to-left pages). */
  layout?: DiagramLayout
  /** The canvas's height in pixels. Default 480 (360 on phones). */
  height?: number
  /** Shows the overview of the whole diagram in the canvas's end-bottom corner. */
  minimap?: boolean
  /**
   * Hides React Flow's small credit link ("React Flow", in the start-bottom corner). Its MIT
   * licence allows hiding it, but React Flow's authors ask that only applications with a React
   * Flow Pro subscription do (docs/decisions.md, P5.26). Default false: the link is shown.
   */
  hideAttribution?: boolean
  /** The instance to show in mode 'run'. */
  run?: DiagramRun
  /** The application's validation messages, on their steps and in the problems list. */
  problems?: readonly DiagramProblem[]
  /** Every edit, as operations; the application applies and saves them. */
  onChange?: (operations: DiagramOperation[]) => void
  /** A run step's action was pressed ("retry", "skip"). */
  onStepAction?: (stepId: string, action: string) => void
  /** The kinds the palette offers, in this order. Default: every kind. */
  palette?: readonly DiagramStepKind[]
  /** Makes the id of a new step or connection. Default: "step-4", "connection-7". */
  newId?: DiagramIdMaker
  /** The step chosen when the diagram opens (edit), as an application restores it. */
  defaultSelected?: string
  /** 'steps' opens on the steps list, as an application restores it. Default 'diagram'. */
  defaultView?: 'diagram' | 'steps'
  /** The diagram is being fetched: a skeleton in the canvas's place. */
  loading?: boolean
  /** The diagram could not be fetched: its message and Retry. */
  error?: { message?: string; onRetry: () => void }
  /** Default: from the viewport (below 48em 'phone'). */
  screen?: 'desktop' | 'phone'
  className?: string
}

/** Whether a measured size is the same as before. */
function sameSize(was: DiagramSize | undefined, size: DiagramSize): boolean {
  return was?.width === size.width && was.height === size.height
}

/** Bumps when the page's fonts finish loading; null until they are ready (P4.6, as the charts). */
function useFontGeneration(): number | null {
  const [generation, setGeneration] = useState<number | null>(() =>
    typeof document === 'undefined' || !('fonts' in document) || document.fonts.status === 'loaded'
      ? 0
      : null,
  )
  useEffect(() => {
    if (!('fonts' in document)) return
    const fonts = document.fonts
    let cancelled = false
    const bump = () => {
      if (!cancelled) setGeneration((current) => (current ?? 0) + 1)
    }
    void fonts.ready.then(bump)
    fonts.addEventListener('loadingdone', bump)
    return () => {
      cancelled = true
      fonts.removeEventListener('loadingdone', bump)
    }
  }, [])
  return generation
}

/** A process of steps and connections: view, edit or a run's state. */
export function Diagram(props: DiagramProps) {
  return (
    <ReactFlowProvider>
      <DiagramBody {...props} />
    </ReactFlowProvider>
  )
}

/** A palette entry being dragged: the kind and the pointer. */
interface PaletteDrag {
  kind: DiagramStepKind
  x: number
  y: number
}

interface PalettePress extends PaletteDrag {
  pointerId: number
  touch: boolean
  started: boolean
  timer: number | undefined
}

function DiagramBody(props: DiagramProps) {
  const { messages, format, direction } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.screen === undefined ? viewportPhone : props.screen === 'phone'
  const mode = props.mode ?? 'view'
  const editable = mode === 'edit' && !phone
  const layout = props.layout ?? 'start-to-end'
  const height = props.height ?? (phone ? 360 : 480)
  const makeId = props.newId ?? nextDiagramId
  const kinds = props.palette ?? DIAGRAM_STEP_KINDS
  const generation = useFontGeneration()
  const rf = useReactFlow<FlowNode, ConnectionEdge>()
  const instructionsId = useId()
  const connectionInstructionsId = useId()
  const paletteHeadingId = useId()
  const paletteHintId = useId()
  const wrapper = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef<DiagramFocus | null>(null)
  const press = useRef<PalettePress | null>(null)
  const suppressClick = useRef(false)

  const { steps, connections } = props
  const model = useMemo(() => ({ steps, connections }), [steps, connections])
  const order = useMemo(() => stepOrder(model), [model])
  const stepById = useMemo(() => new Map(steps.map((step) => [step.id, step])), [steps])
  const laneNames = useMemo(
    () => new Map((props.lanes ?? []).map((lane) => [lane.id, lane.label])),
    [props.lanes],
  )
  const problems = useMemo(() => props.problems ?? [], [props.problems])
  const byTarget = useMemo(() => problemsByTarget(problems), [problems])

  const [measured, setMeasured] = useState<Record<string, DiagramSize>>({})
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<DiagramFocus | null>(
    props.defaultSelected === undefined ? null : { type: 'step', id: props.defaultSelected },
  )
  const [dialog, setDialog] = useState<DiagramDialog | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [asList, setAsList] = useState(props.defaultView === 'steps')
  const [viewMoved, setViewMoved] = useState(false)
  const [fitted, setFitted] = useState<string | null>(null)
  const [paletteDrag, setPaletteDrag] = useState<PaletteDrag | null>(null)

  const result = useMemo(
    () =>
      layoutDiagram({
        steps,
        connections,
        ...(props.lanes === undefined ? {} : { lanes: props.lanes }),
        layout,
        sizes: measured,
      }),
    [steps, connections, props.lanes, layout, measured],
  )
  const sizeOf = useCallback(
    (step: DiagramStep) => result.sizes[step.id] ?? defaultStepSize(step.kind, layout),
    [result, layout],
  )

  const kindName = useCallback((kind: DiagramStepKind) => messages[KIND_MESSAGE[kind]], [messages])
  const labelOf = useCallback((id: string) => stepById.get(id)?.label ?? id, [stepById])

  /** A step's accessible name: kind and name, lane, state (and reason), problems. */
  const stepName = useCallback(
    (step: DiagramStep) => {
      const parts = [messages['diagram.stepName'](kindName(step.kind), step.label)]
      const lane = step.lane === undefined ? undefined : laneNames.get(step.lane)
      if (lane !== undefined) parts.push(messages['diagram.inLane'](lane))
      if (mode === 'run') {
        const run = props.run?.steps[step.id]
        parts.push(messages[STATE_LOOK[run?.state ?? 'not-reached'].message])
        if (run?.reason !== undefined) parts.push(run.reason)
      }
      const count = byTarget.steps.get(step.id)?.length ?? 0
      if (count > 0) parts.push(messages['diagram.problems'](count, format.number(String(count))))
      return parts.join('. ')
    },
    [messages, kindName, laneNames, mode, props.run, byTarget, format],
  )

  const nodes = useMemo((): FlowNode[] => {
    const lanes: LaneNode[] = result.lanes.map((lane, index) => ({
      id: `lane:${lane.id}`,
      type: 'lane',
      position: { x: drawnX(lane.x, lane.width, rtl), y: lane.y },
      data: { label: lane.label, index, last: index === result.lanes.length - 1 },
      width: lane.width,
      height: lane.height,
      draggable: false,
      selectable: false,
      focusable: false,
      connectable: false,
      zIndex: -1,
      domAttributes: { 'aria-roledescription': undefined },
    }))
    const stepNodes = order.flatMap((id): StepNode[] => {
      const step = stepById.get(id)
      const position = result.positions[id]
      if (step === undefined || position === undefined) return []
      const size = sizeOf(step)
      const size_ = measured[id]
      return [
        {
          id,
          type: 'step',
          position:
            drag?.id === id
              ? { x: drag.x, y: drag.y }
              : { x: drawnX(position.x, size.width, rtl), y: position.y },
          data: { step },
          ...(size_ === undefined ? {} : { measured: size_ }),
          draggable: editable,
          connectable: editable,
          focusable: true,
          ariaLabel: stepName(step),
          className: cn('rounded-md', FOCUS_RING),
          domAttributes: {
            'aria-roledescription': undefined,
            'aria-describedby': instructionsId,
          },
        },
      ]
    })
    return [...lanes, ...stepNodes]
  }, [result, order, stepById, sizeOf, measured, drag, rtl, editable, stepName, instructionsId])

  const edges = useMemo(
    (): ConnectionEdge[] =>
      connections
        .filter((each) => stepById.has(each.from) && stepById.has(each.to))
        .map((connection) => ({
          id: connection.id,
          source: connection.from,
          target: connection.to,
          type: 'connection',
          data: { connection },
          focusable: false,
          selectable: false,
          ariaRole: 'group',
          ariaLabel: [
            messages['diagram.connectionName'](labelOf(connection.from), labelOf(connection.to)),
            ...(connection.label === undefined ? [] : [connection.label]),
            ...(connection.isDefault === true ? [messages['diagram.defaultFlow']] : []),
            ...(byTarget.connections.get(connection.id) ?? []).map((each) => each.message),
          ].join('. '),
          domAttributes: {
            tabIndex: -1,
            'aria-roledescription': undefined,
            'aria-describedby': connectionInstructionsId,
          },
        })),
    [connections, stepById, labelOf, messages, byTarget, connectionInstructionsId],
  )

  // ── Fit and readiness ──
  const allMeasured = steps.every((step) => measured[step.id] !== undefined)
  const showCanvas =
    !asList &&
    props.loading !== true &&
    props.error === undefined &&
    (steps.length > 0 || editable) &&
    generation !== null
  const layoutKey = useMemo(
    () =>
      JSON.stringify([
        result.positions,
        result.sizes,
        result.lanes.map((lane) => [lane.x, lane.y, lane.width, lane.height]),
        rtl,
        height,
      ]),
    [result, rtl, height],
  )
  useEffect(() => {
    if (!showCanvas || steps.length === 0 || !allMeasured || viewMoved) return
    let live = true
    void rf.fitView(fitOptions(props.minimap === true)).then(() => {
      if (live) setFitted(layoutKey)
    })
    return () => {
      live = false
    }
  }, [rf, showCanvas, steps.length, allMeasured, viewMoved, layoutKey, props.minimap])
  const ready =
    props.loading !== true &&
    (!showCanvas || steps.length === 0 || (allMeasured && (viewMoved || fitted === layoutKey)))

  // ── Focus ──
  /** A step's or connection's box in the canvas's coordinates. */
  const boxOf = (target: DiagramFocus) => {
    const box = (id: string) => {
      const step = stepById.get(id)
      const position = result.positions[id]
      if (step === undefined || position === undefined) return null
      const size = sizeOf(step)
      return { x: drawnX(position.x, size.width, rtl), y: position.y, ...size }
    }
    if (target.type === 'step') return box(target.id)
    const connection = connections.find((each) => each.id === target.id)
    if (connection === undefined) return null
    const a = box(connection.from)
    const b = box(connection.to)
    if (a === null || b === null) return a ?? b
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    return {
      x,
      y,
      width: Math.max(a.x + a.width, b.x + b.width) - x,
      height: Math.max(a.y + a.height, b.y + b.height) - y,
    }
  }
  /** Brings a step or connection into view when it is outside it. */
  const reveal = (target: DiagramFocus) => {
    const box = boxOf(target)
    const area = canvas.current
    if (box === null || area === null) return
    const { x, y, zoom } = rf.getViewport()
    const start = box.x * zoom + x
    const top = box.y * zoom + y
    const inside =
      start >= 0 &&
      top >= 0 &&
      start + box.width * zoom <= area.clientWidth &&
      top + box.height * zoom <= area.clientHeight
    if (!inside) void rf.setCenter(box.x + box.width / 2, box.y + box.height / 2, { zoom })
  }
  /** Moves the keyboard to a step or a connection; false while it is not drawn yet. */
  const focusTarget = (target: DiagramFocus): boolean => {
    const area = canvas.current
    if (area === null) return false
    const selector =
      target.type === 'step'
        ? `.react-flow__node[data-id="${CSS.escape(target.id)}"]`
        : `.react-flow__edge[data-id="${CSS.escape(target.id)}"]`
    const element = area.querySelector<HTMLElement | SVGGElement>(selector)
    if (element === null) return false
    reveal(target)
    element.focus({ preventScroll: true })
    return document.activeElement === element
  }
  // A step added or reached by Go to takes the keyboard once it is drawn.
  useEffect(() => {
    const target = pendingFocus.current
    if (target === null) return
    let tries = 0
    let frame = 0
    const attempt = () => {
      if (focusTarget(target)) {
        pendingFocus.current = null
        return
      }
      tries += 1
      if (tries < 20) frame = requestAnimationFrame(attempt)
    }
    attempt()
    return () => {
      cancelAnimationFrame(frame)
    }
  })

  // ── Changes ──
  const report = (operations: DiagramOperation[], said: string) => {
    props.onChange?.(operations)
    setAnnouncement(said)
    setViewMoved(true)
  }
  const addStep = (kind: DiagramStepKind, after: string | undefined, at?: DiagramPosition) => {
    const id = makeId('step', takenIds(model))
    const afterStep = after === undefined ? undefined : stepById.get(after)
    const position =
      at ??
      (afterStep === undefined ? undefined : positionAfter(afterStep, sizeOf(afterStep), layout))
    const step: DiagramStep = {
      id,
      kind,
      label: kindName(kind),
      ...(afterStep?.lane === undefined ? {} : { lane: afterStep.lane }),
      ...(position === undefined ? {} : { position }),
    }
    report(addStepOperations(model, step, after, makeId), messages['diagram.added'](step.label))
    setSelected({ type: 'step', id })
    pendingFocus.current = { type: 'step', id }
  }
  const removeStep = (id: string) => {
    const index = order.indexOf(id)
    const neighbour = order[index - 1] ?? order[index + 1]
    report(removeStepOperations(model, id), messages['diagram.removed'](labelOf(id)))
    setSelected(null)
    if (neighbour !== undefined) pendingFocus.current = { type: 'step', id: neighbour }
  }
  const removeConnection = (connection: DiagramConnection) => {
    report(
      [{ type: 'remove-connection', id: connection.id }],
      messages['diagram.removed'](
        messages['diagram.connectionName'](labelOf(connection.from), labelOf(connection.to)),
      ),
    )
    setSelected(null)
    pendingFocus.current = { type: 'step', id: connection.from }
  }
  const connect = (from: string, to: string, label: string | undefined) => {
    if (!canConnect(model, from, to)) return
    const id = makeId('connection', takenIds(model))
    report(
      [
        {
          type: 'add-connection',
          connection: { id, from, to, ...(label === undefined ? {} : { label }) },
        },
      ],
      messages['diagram.connected'](labelOf(from), labelOf(to)),
    )
  }

  // ── Keyboard ──
  /** Edit's keys on a step or a connection; true when the key was used. */
  const editKey = (event: KeyboardEvent<HTMLDivElement>, focus: DiagramFocus): boolean => {
    const chosen = selected !== null && selected.type === focus.type && selected.id === focus.id
    if (event.key === 'Enter' || event.key === ' ') {
      setSelected(chosen ? null : focus)
      const name =
        focus.type === 'step'
          ? labelOf(focus.id)
          : (edges.find((each) => each.id === focus.id)?.ariaLabel ?? '')
      setAnnouncement(
        chosen ? messages['diagram.released'](name) : messages['diagram.chosen'](name),
      )
      return true
    }
    if (event.key === 'Escape' && chosen) {
      setSelected(null)
      setAnnouncement(messages['diagram.released'](focus.type === 'step' ? labelOf(focus.id) : ''))
      return true
    }
    if (event.key === 'F2') {
      setDialog(
        focus.type === 'step' ? { type: 'rename', id: focus.id } : { type: 'label', id: focus.id },
      )
      return true
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (focus.type === 'step') removeStep(focus.id)
      else {
        const connection = connections.find((each) => each.id === focus.id)
        if (connection !== undefined) removeConnection(connection)
      }
      return true
    }
    if (focus.type === 'step' && chosen) {
      const delta = keyMoveDelta(event.key, event.shiftKey, rtl)
      const position = result.positions[focus.id]
      if (delta === null || position === undefined) return false
      report(
        [
          {
            type: 'move-step',
            id: focus.id,
            position: { x: position.x + delta.x, y: position.y + delta.y },
          },
        ],
        messages['diagram.moved'](labelOf(focus.id)),
      )
      return true
    }
    return false
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const node = target.closest('.react-flow__node')
    const edge = target.closest('.react-flow__edge')
    let focus: DiagramFocus | null = null
    if (node !== null && node === target) {
      const id = node.getAttribute('data-id')
      if (id !== null && stepById.has(id)) focus = { type: 'step', id }
    } else if (edge !== null && edge === target) {
      const id = edge.getAttribute('data-id')
      if (id !== null) focus = { type: 'connection', id }
    }
    if (focus === null) return
    if (editable && editKey(event, focus)) {
      event.preventDefault()
      return
    }
    const next = diagramKeyTarget(model, focus, event.key, {
      layout,
      rtl,
      order,
      positions: result.positions,
    })
    if (next === null) return
    event.preventDefault()
    focusTarget(next)
  }

  // ── Palette dragging (pointer events; touch after a 250ms press) ──
  const dropAt = (kind: DiagramStepKind, x: number, y: number) => {
    const area = canvas.current?.getBoundingClientRect()
    if (area === undefined || x < area.left || x > area.right || y < area.top || y > area.bottom) {
      return
    }
    const point = rf.screenToFlowPosition({ x, y })
    const size = defaultStepSize(kind, layout)
    addStep(kind, undefined, {
      x: Math.round(layoutX(point.x - size.width / 2, size.width, rtl)),
      y: Math.round(point.y - size.height / 2),
    })
  }
  const endPress = () => {
    const current = press.current
    if (current?.timer !== undefined) window.clearTimeout(current.timer)
    press.current = null
    setPaletteDrag(null)
  }
  const paletteHandlers = (kind: DiagramStepKind) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return
      const touch = event.pointerType === 'touch'
      const start: PalettePress = {
        kind,
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        touch,
        started: false,
        timer: undefined,
      }
      if (touch) {
        start.timer = window.setTimeout(() => {
          if (press.current === start) {
            start.started = true
            setPaletteDrag({ kind, x: start.x, y: start.y })
          }
        }, 250)
      }
      press.current = start
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = press.current
      if (current?.pointerId !== event.pointerId) return
      const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y)
      if (!current.started) {
        if (current.touch) {
          if (distance > 8) endPress()
          return
        }
        if (distance <= 4) return
        current.started = true
      }
      if (current.touch) event.preventDefault()
      setPaletteDrag({ kind, x: event.clientX, y: event.clientY })
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = press.current
      if (current?.pointerId !== event.pointerId) return
      if (current.started) {
        suppressClick.current = true
        dropAt(kind, event.clientX, event.clientY)
      }
      endPress()
    },
    onPointerCancel: endPress,
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Escape' && press.current !== null) endPress()
    },
    onClick: () => {
      if (suppressClick.current) {
        suppressClick.current = false
        return
      }
      addStep(kind, selected?.type === 'step' ? selected.id : undefined)
    },
  })

  // ── Go to ──
  const goTo = (problem: DiagramProblem) => {
    const target: DiagramFocus | null =
      problem.stepId !== undefined
        ? { type: 'step', id: problem.stepId }
        : problem.connectionId !== undefined
          ? { type: 'connection', id: problem.connectionId }
          : null
    if (target === null) return
    if (editable) setSelected(target)
    setAsList(false)
    pendingFocus.current = target
    setViewMoved(true)
  }

  // ── The parts ──
  const view: DiagramView = {
    mode,
    editable,
    layout,
    rtl,
    states: props.run?.steps ?? {},
    path: mode === 'run' ? new Set(props.run?.path ?? []) : null,
    stepProblems: byTarget.steps,
    connectionProblems: byTarget.connections,
    selected: editable ? selected : null,
    ...(props.onStepAction === undefined ? {} : { onStepAction: props.onStepAction }),
  }
  const selectedStep = editable && selected?.type === 'step' ? stepById.get(selected.id) : undefined
  const selectedConnection =
    editable && selected?.type === 'connection'
      ? connections.find((each) => each.id === selected.id)
      : undefined

  const editActions = editable && !asList && (
    <div data-slot="diagram-edit-actions" className="flex min-w-0 flex-wrap items-center gap-2">
      {selectedStep !== undefined ? (
        <>
          <DropdownMenu
            align="start"
            entries={kinds.map((kind) => ({
              label: kindName(kind),
              onSelect: () => {
                addStep(kind, selectedStep.id)
              },
            }))}
            trigger={
              <Button family="neutral" icon={Plus} label={messages['diagram.addStepAfter']} />
            }
          />
          {selectedStep.kind !== 'end' && (
            <Button
              family="neutral"
              icon={Spline}
              label={messages['diagram.connectTo']}
              onClick={() => {
                setDialog({ type: 'connect', id: selectedStep.id })
              }}
            />
          )}
          <Button
            family="neutral"
            icon={Pencil}
            label={messages['diagram.rename']}
            onClick={() => {
              setDialog({ type: 'rename', id: selectedStep.id })
            }}
          />
          <Button
            family="destructive"
            icon={Trash2}
            label={messages['diagram.remove']}
            onClick={() => {
              removeStep(selectedStep.id)
            }}
          />
        </>
      ) : selectedConnection !== undefined ? (
        <>
          <Button
            family="neutral"
            icon={Pencil}
            label={messages['diagram.labelConnection']}
            onClick={() => {
              setDialog({ type: 'label', id: selectedConnection.id })
            }}
          />
          <Button
            family="destructive"
            icon={Trash2}
            label={messages['diagram.remove']}
            onClick={() => {
              removeConnection(selectedConnection)
            }}
          />
        </>
      ) : (
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          {messages['diagram.chooseHint']}
        </p>
      )}
    </div>
  )

  const viewControls = (
    <div className="ms-auto flex shrink-0 items-center gap-1">
      {steps.length > 0 && props.loading !== true && props.error === undefined && (
        <Button
          family="neutral"
          emphasis="menu"
          icon={asList ? Workflow : ListOrdered}
          label={asList ? messages['diagram.showDiagram'] : messages['diagram.showSteps']}
          onClick={() => {
            setAsList(!asList)
          }}
        />
      )}
      {showCanvas && steps.length > 0 && (
        <>
          <CompactIconButton
            icon={ZoomOut}
            label={messages['diagram.zoomOut']}
            onClick={() => {
              setViewMoved(true)
              void rf.zoomOut()
            }}
          />
          <CompactIconButton
            icon={ZoomIn}
            label={messages['diagram.zoomIn']}
            onClick={() => {
              setViewMoved(true)
              void rf.zoomIn()
            }}
          />
          <CompactIconButton
            icon={Maximize}
            label={messages['diagram.fitView']}
            onClick={() => {
              void rf.fitView(fitOptions(props.minimap === true))
            }}
          />
        </>
      )}
    </div>
  )

  let body
  if (props.loading === true) {
    body = (
      // A visible loading state (P5.93 item 2): the canvas's place, and the words over it.
      <div
        role="status"
        aria-label={messages['diagram.loading']}
        className="relative"
        style={{ height }}
      >
        <Skeleton className="absolute inset-0 rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span aria-hidden="true" className={cn('text-sm text-secondary', TEXT_ISOLATE)}>
            {messages['diagram.loading']}
          </span>
        </div>
      </div>
    )
  } else if (props.error !== undefined) {
    const { onRetry } = props.error
    body = (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-solid border-default bg-surface-raised text-center"
        style={{ height }}
      >
        <p
          role="alert"
          className={cn(
            'm-0 flex items-center gap-1.5 text-sm text-status-danger-fg',
            TEXT_ISOLATE,
          )}
        >
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {props.error.message ?? messages['diagram.error']}
        </p>
        <Button
          intent="refresh"
          emphasis="secondary"
          label={messages['diagram.retry']}
          onClick={() => {
            onRetry()
          }}
        />
      </div>
    )
  } else if (steps.length === 0 && !editable) {
    body = (
      <div
        className="flex items-center justify-center rounded-lg border border-solid border-default bg-surface-raised"
        style={{ height }}
      >
        <p className={cn('m-0 text-center text-sm text-secondary', TEXT_ISOLATE)}>
          {messages['diagram.empty']}
        </p>
      </div>
    )
  } else if (asList) {
    body = (
      <StepsList
        label={props.label}
        model={model}
        order={order}
        lanes={laneNames}
        mode={mode}
        run={props.run}
        stepProblems={byTarget.steps}
        onStepAction={props.onStepAction}
      />
    )
  } else {
    body = (
      <div
        data-slot="diagram-frame"
        className="flex min-w-0 overflow-hidden rounded-lg border border-solid border-default bg-surface-sunken"
        style={{ height }}
      >
        {editable && (
          <div
            role="group"
            aria-labelledby={paletteHeadingId}
            aria-describedby={paletteHintId}
            data-slot="diagram-palette"
            className="flex w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-0 border-e border-solid border-default bg-surface-raised p-2"
          >
            <h3
              id={paletteHeadingId}
              className={cn('m-0 px-2 pt-1 text-xs font-semibold text-secondary', TEXT_DIRECTION)}
            >
              {messages['diagram.palette']}
            </h3>
            <p
              id={paletteHintId}
              className={cn('m-0 px-2 pb-1 text-xs text-tertiary', TEXT_DIRECTION)}
            >
              {messages['diagram.paletteHint']}
            </p>
            {kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                data-kind={kind}
                aria-label={messages['diagram.addKind'](kindName(kind))}
                className={cn(
                  BUTTON_RESET,
                  'flex min-h-8 w-full shrink-0 cursor-grab touch-none items-center gap-2 rounded-md px-2 text-start text-sm text-primary hover:bg-surface-hover',
                  FOCUS_RING,
                )}
                {...paletteHandlers(kind)}
              >
                <KindGlyph kind={kind} />
                <span className={TEXT_DIRECTION}>{kindName(kind)}</span>
              </button>
            ))}
          </div>
        )}
        <div
          ref={canvas}
          data-slot="diagram-canvas"
          className={cn(
            'relative min-w-0 flex-1',
            // Hidden only until the first fit; a later layout (a font arriving) refits in place.
            steps.length > 0 && fitted === null && !viewMoved && 'invisible',
          )}
        >
          {generation !== null && (
            <ReactFlow<FlowNode, ConnectionEdge>
              aria-label={props.label}
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              onKeyDown={onKeyDown}
              onNodesChange={(changes: NodeChange<FlowNode>[]) => {
                const sizes: Record<string, DiagramSize> = {}
                for (const change of changes) {
                  if (change.type === 'dimensions' && change.dimensions !== undefined) {
                    if (!stepById.has(change.id)) continue
                    sizes[change.id] = {
                      width: Math.ceil(change.dimensions.width),
                      height: Math.ceil(change.dimensions.height),
                    }
                  } else if (
                    change.type === 'position' &&
                    change.position !== undefined &&
                    change.dragging === true
                  ) {
                    setDrag({ id: change.id, x: change.position.x, y: change.position.y })
                  }
                }
                if (Object.keys(sizes).length === 0) return
                setMeasured((current) =>
                  Object.entries(sizes).some(([id, size]) => !sameSize(current[id], size))
                    ? { ...current, ...sizes }
                    : current,
                )
              }}
              onNodeDragStop={(_event, node) => {
                setDrag(null)
                const step = stepById.get(node.id)
                if (step === undefined) return
                const size = sizeOf(step)
                report(
                  [
                    {
                      type: 'move-step',
                      id: step.id,
                      position: {
                        x: Math.round(layoutX(node.position.x, size.width, rtl)),
                        y: Math.round(node.position.y),
                      },
                    },
                  ],
                  messages['diagram.moved'](step.label),
                )
              }}
              onNodeClick={(_event, node) => {
                if (editable && stepById.has(node.id)) setSelected({ type: 'step', id: node.id })
              }}
              onNodeDoubleClick={(_event, node) => {
                if (editable && stepById.has(node.id)) setDialog({ type: 'rename', id: node.id })
              }}
              onEdgeClick={(_event, edge: Edge) => {
                if (editable) setSelected({ type: 'connection', id: edge.id })
              }}
              onPaneClick={() => {
                if (editable) setSelected(null)
              }}
              onConnect={(connection: Connection) => {
                connect(connection.source, connection.target, undefined)
              }}
              isValidConnection={(connection) =>
                canConnect(model, connection.source, connection.target)
              }
              onMoveStart={(event) => {
                if (event !== null) setViewMoved(true)
              }}
              nodesDraggable={editable}
              nodesConnectable={editable}
              nodesFocusable
              edgesFocusable={false}
              elementsSelectable={false}
              disableKeyboardA11y
              deleteKeyCode={null}
              selectionKeyCode={null}
              multiSelectionKeyCode={null}
              panActivationKeyCode={null}
              zoomActivationKeyCode={null}
              zoomOnScroll={false}
              zoomOnDoubleClick={false}
              panOnScroll={false}
              preventScrolling={false}
              nodeDragThreshold={4}
              minZoom={0.2}
              maxZoom={2}
              connectionLineType={ConnectionLineType.SmoothStep}
              proOptions={{ hideAttribution: props.hideAttribution === true }}
              attributionPosition={rtl ? 'bottom-right' : 'bottom-left'}
              ariaLabelConfig={{
                'node.a11yDescription.default': editable
                  ? messages['diagram.editInstructions']
                  : messages['diagram.instructions'],
                'node.a11yDescription.keyboardDisabled': editable
                  ? messages['diagram.editInstructions']
                  : messages['diagram.instructions'],
                'edge.a11yDescription.default': messages['diagram.connectionInstructions'],
                'minimap.ariaLabel': messages['diagram.minimap'],
              }}
            >
              {props.minimap === true && (
                <MiniMap<FlowNode>
                  position={rtl ? 'bottom-left' : 'bottom-right'}
                  ariaLabel={messages['diagram.minimap']}
                  nodeClassName={(node) => (node.type === 'lane' ? 'hidden' : '')}
                  nodeBorderRadius={4}
                  style={{ width: 160, height: 104 }}
                />
              )}
            </ReactFlow>
          )}
          {editable && steps.length === 0 && (
            <p
              className={cn(
                'pointer-events-none absolute inset-0 m-0 flex items-center justify-center p-4 text-center text-sm text-secondary',
                TEXT_ISOLATE,
              )}
            >
              {messages['diagram.emptyEdit']}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <DiagramContext.Provider value={view}>
      <section
        ref={wrapper}
        aria-label={props.label}
        aria-busy={props.loading === true}
        data-slot="diagram"
        data-mode={mode}
        data-ready={ready}
        className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
      >
        {mode === 'run' && props.run !== undefined && steps.length > 0 && (
          <RunSummary steps={steps} run={props.run} />
        )}
        {mode === 'run' && props.run !== undefined && !asList && (
          <RunAttention steps={steps} run={props.run} onStepAction={props.onStepAction} />
        )}
        {mode === 'edit' && phone && (
          <Alert tone="neutral" title={messages['diagram.editOnLargerScreen']} />
        )}
        {problems.length > 0 && <ProblemsList model={model} problems={problems} onGoTo={goTo} />}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {editActions}
          {viewControls}
        </div>
        {body}
        <p id={instructionsId} hidden>
          {editable ? messages['diagram.editInstructions'] : messages['diagram.instructions']}
        </p>
        <p id={connectionInstructionsId} hidden>
          {messages['diagram.connectionInstructions']}
        </p>
        <div role="status" className="sr-only">
          {announcement}
        </div>
        {paletteDrag !== null && (
          <div
            dir="ltr"
            aria-hidden="true"
            className="pointer-events-none fixed start-0 top-0 z-(--liro-layer-popover)"
            style={{
              transform: `translate(${String(paletteDrag.x + 8)}px, ${String(paletteDrag.y + 8)}px)`,
            }}
          >
            <div
              dir={direction}
              data-slot="diagram-palette-ghost"
              className="flex h-8 items-center gap-2 rounded-md border border-solid border-strong bg-surface-raised px-2 text-sm text-primary shadow-lg"
            >
              <KindGlyph kind={paletteDrag.kind} />
              <span className={TEXT_DIRECTION}>{kindName(paletteDrag.kind)}</span>
            </div>
          </div>
        )}
        {editable && (
          <EditDialog
            dialog={dialog}
            model={model}
            targets={dialog?.type === 'connect' ? connectionTargets(model, dialog.id) : []}
            onClose={() => {
              setDialog(null)
            }}
            onRename={(id, label) => {
              setDialog(null)
              report([{ type: 'rename-step', id, label }], messages['diagram.renamed'](label))
            }}
            onLabel={(id, label, isDefault) => {
              setDialog(null)
              const connection = connections.find((each) => each.id === id)
              const operations: DiagramOperation[] = []
              if (connection?.label !== label) {
                operations.push({ type: 'label-connection', id, label })
              }
              if ((connection?.isDefault === true) !== isDefault) {
                operations.push({ type: 'set-default-connection', id, isDefault })
              }
              if (operations.length > 0) {
                report(operations, messages['diagram.labelled'](label ?? ''))
              }
            }}
            onConnect={(from, to, label) => {
              setDialog(null)
              connect(from, to, label)
            }}
          />
        )}
      </section>
    </DiagramContext.Provider>
  )
}

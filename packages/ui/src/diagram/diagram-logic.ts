import dagre, { type EdgeLabel, type GraphLabel, type NodeLabel } from '@dagrejs/dagre'

/*
 * The pure logic of Diagram (BUILD-PLAN P5.26): the data a diagram is made of, the automatic
 * layout (dagre), the order of the steps, the keyboard's targets, the operations an edit reports
 * and how an application applies them, and the counts of a run. No React here; every function is
 * tested in diagram-logic.test.ts.
 *
 * Coordinates are the layout's own: x grows from the leading edge (the start of the reading
 * direction), y grows downwards, in pixels at zoom 1. Diagram mirrors x in a right-to-left page
 * when it draws, so a stored position means the same place in both directions (B.7).
 */

// ── The data ──────────────────────────────────────────────────────────────────────────────────

/** The kinds of step, in a BPMN-style notation drawn by the Design System. */
export const DIAGRAM_STEP_KINDS = [
  'start',
  'end',
  'task',
  'user-task',
  'service-task',
  'sub-process',
  'timer',
  'message',
  'exclusive',
  'parallel',
] as const

export type DiagramStepKind = (typeof DIAGRAM_STEP_KINDS)[number]

/** How the steps flow: from the leading edge to the trailing one, or from the top down. */
export type DiagramLayout = 'start-to-end' | 'top-to-bottom'

export interface DiagramPosition {
  x: number
  y: number
}

export interface DiagramSize {
  width: number
  height: number
}

/** One step of the diagram. */
export interface DiagramStep {
  id: string
  kind: DiagramStepKind
  /** The step's name, from the application ("Check the invoice"). */
  label: string
  /** The lane (`DiagramLane.id`) the step stands in. */
  lane?: string
  /**
   * Where the step stands, in the layout's coordinates (x from the leading edge). Steps without
   * a position are placed by the automatic layout; a step with one keeps it.
   */
  position?: DiagramPosition
}

/** A connection (sequence flow) from one step to another. */
export interface DiagramConnection {
  id: string
  from: string
  to: string
  /** A condition or a name, from the application ("Above 100,000 RSD"). */
  label?: string
  /** The default flow out of a gateway: drawn with the slash mark near its start. */
  isDefault?: boolean
}

/** A lane: a labelled band the steps of one role or system stand in. */
export interface DiagramLane {
  id: string
  label: string
}

/** The steps and connections of a diagram. */
export interface DiagramModel {
  steps: readonly DiagramStep[]
  connections: readonly DiagramConnection[]
}

/** One change an edit reports; the application applies it (`applyDiagramOperations`) and saves. */
export type DiagramOperation =
  | { type: 'add-step'; step: DiagramStep }
  | { type: 'remove-step'; id: string }
  | { type: 'rename-step'; id: string; label: string }
  | { type: 'move-step'; id: string; position: DiagramPosition }
  | { type: 'add-connection'; connection: DiagramConnection }
  | { type: 'remove-connection'; id: string }
  | { type: 'label-connection'; id: string; label: string | undefined }
  /** Makes a connection the default way out of its step (the others lose the mark), or not. */
  | { type: 'set-default-connection'; id: string; isDefault: boolean }

/** A step's state in one run of the process. */
export type DiagramStepState = 'done' | 'running' | 'waiting' | 'failed' | 'skipped' | 'not-reached'

export const DIAGRAM_STEP_STATES: readonly DiagramStepState[] = [
  'done',
  'running',
  'waiting',
  'failed',
  'skipped',
  'not-reached',
]

/** A problem the application found in the diagram, shown on its step or connection. */
export interface DiagramProblem {
  id: string
  /** From the application: "Approve has no way out." */
  message: string
  stepId?: string
  connectionId?: string
}

/** What the keyboard is on: a step or a connection. */
export type DiagramFocus = { type: 'step'; id: string } | { type: 'connection'; id: string }

// ── Sizes ─────────────────────────────────────────────────────────────────────────────────────

/** A task's box: 176px wide, at least 64px high (its label may wrap to more lines). */
export const TASK_WIDTH = 176
export const TASK_MIN_HEIGHT = 64
/** An event's circle and a gateway's diamond. */
export const EVENT_SIZE = 36
export const GATEWAY_SIZE = 44
/** The label under (start-to-end) or beside (top-to-bottom) an event or a gateway. */
export const COMPACT_LABEL_WIDTH = 120
export const COMPACT_LABEL_GAP = 4
/** Space between ranks (along the flow) and between steps of one rank. */
export const RANK_GAP = 64
export const STEP_GAP = 40
/** A lane's label row and its padding. */
export const LANE_HEADER = 40
export const LANE_PADDING = 16
/** How far one arrow key moves a chosen step (Shift: five times as far). */
export const MOVE_STEP = 8

/** Whether a kind is drawn as a box with its label inside (tasks and sub-processes). */
export function isTaskKind(kind: DiagramStepKind): boolean {
  return (
    kind === 'task' || kind === 'user-task' || kind === 'service-task' || kind === 'sub-process'
  )
}

/** An event's circle or a gateway's diamond, in pixels. */
export function shapeSize(kind: DiagramStepKind): number {
  return kind === 'exclusive' || kind === 'parallel' ? GATEWAY_SIZE : EVENT_SIZE
}

/**
 * The size a step is laid out with before it is measured: a task 176 × 64; an event or a gateway
 * with its label under it (start-to-end, 120px wide, two lines) or beside it at the end side
 * (top-to-bottom, the box symmetric around the shape so connections stay straight).
 */
export function defaultStepSize(kind: DiagramStepKind, layout: DiagramLayout): DiagramSize {
  if (isTaskKind(kind)) return { width: TASK_WIDTH, height: TASK_MIN_HEIGHT }
  const shape = shapeSize(kind)
  if (layout === 'start-to-end') {
    return { width: COMPACT_LABEL_WIDTH, height: shape + COMPACT_LABEL_GAP + 32 }
  }
  return { width: shape + 2 * (COMPACT_LABEL_WIDTH + COMPACT_LABEL_GAP), height: shape }
}

/** The room a connection's label takes in the layout (about 6.5px a character, at most 160px). */
export function connectionLabelSize(label: string | undefined): DiagramSize {
  if (label === undefined || label === '') return { width: 0, height: 0 }
  return { width: Math.min(160, Math.ceil(label.length * 6.5) + 16), height: 24 }
}

// ── Order ─────────────────────────────────────────────────────────────────────────────────────

/** The connections that leave a step, in the application's order. */
export function outgoing(model: DiagramModel, id: string): DiagramConnection[] {
  return model.connections.filter((connection) => connection.from === id)
}

/** The connections that arrive at a step, in the application's order. */
export function incoming(model: DiagramModel, id: string): DiagramConnection[] {
  return model.connections.filter((connection) => connection.to === id)
}

/**
 * The steps in the order of the flow: from each start (a start event, or a step nothing leads
 * to) along the connections, breadth first; steps no start reaches follow in the application's
 * order. Tab and the steps list follow it.
 */
export function stepOrder(model: DiagramModel): string[] {
  const ids = new Set(model.steps.map((step) => step.id))
  const hasIncoming = new Set(
    model.connections.filter((each) => ids.has(each.from)).map((each) => each.to),
  )
  const starts = [
    ...model.steps.filter((step) => step.kind === 'start'),
    ...model.steps.filter((step) => step.kind !== 'start' && !hasIncoming.has(step.id)),
  ]
  const seen = new Set<string>()
  const order: string[] = []
  const queue: string[] = []
  const visit = (id: string) => {
    if (seen.has(id) || !ids.has(id)) return
    seen.add(id)
    queue.push(id)
  }
  const drain = () => {
    while (queue.length > 0) {
      const id = queue.shift()
      if (id === undefined) break
      order.push(id)
      for (const connection of outgoing(model, id)) visit(connection.to)
    }
  }
  for (const start of starts) {
    visit(start.id)
    drain()
  }
  for (const step of model.steps) {
    visit(step.id)
    drain()
  }
  return order
}

// ── Layout ────────────────────────────────────────────────────────────────────────────────────

export interface LaidOutLane extends DiagramLane, DiagramPosition, DiagramSize {}

export interface DiagramLayoutResult {
  /** Each step's top-start corner. */
  positions: Record<string, DiagramPosition>
  sizes: Record<string, DiagramSize>
  lanes: LaidOutLane[]
}

export interface DiagramLayoutInput extends DiagramModel {
  lanes?: readonly DiagramLane[]
  layout: DiagramLayout
  /** Measured sizes; a step without one takes `defaultStepSize`. */
  sizes?: Readonly<Record<string, DiagramSize>>
}

/**
 * Places the steps: dagre for every step without a position (ranks along the flow, 64px apart;
 * steps of one rank 40px apart; a connection's label gets its room), the given positions kept.
 * With lanes, each lane becomes a band across the diagram (start-to-end: one under the other;
 * top-to-bottom: side by side) in the order of `lanes`: its steps keep their places along the
 * flow and are moved across into their band, under a 40px label row. A step without a known
 * lane stands in the first one.
 */
export function layoutDiagram(input: DiagramLayoutInput): DiagramLayoutResult {
  const sizes: Record<string, DiagramSize> = {}
  for (const step of input.steps) {
    sizes[step.id] = input.sizes?.[step.id] ?? defaultStepSize(step.kind, input.layout)
  }
  const along = input.layout === 'start-to-end'
  const graph = new dagre.graphlib.Graph<GraphLabel, NodeLabel, EdgeLabel>({ multigraph: true })
  graph.setGraph({
    rankdir: along ? 'LR' : 'TB',
    nodesep: STEP_GAP,
    ranksep: RANK_GAP,
    edgesep: 16,
    marginx: 0,
    marginy: 0,
  })
  graph.setDefaultEdgeLabel(() => ({}))
  const ids = new Set(input.steps.map((step) => step.id))
  for (const step of input.steps) {
    const size = sizes[step.id] ?? defaultStepSize(step.kind, input.layout)
    graph.setNode(step.id, { width: size.width, height: size.height })
  }
  for (const connection of input.connections) {
    if (!ids.has(connection.from) || !ids.has(connection.to)) continue
    const label = connectionLabelSize(connection.label)
    graph.setEdge(
      connection.from,
      connection.to,
      { width: label.width, height: label.height, labelpos: 'c' },
      connection.id,
    )
  }
  if (input.steps.length > 0) dagre.layout(graph)

  const positions: Record<string, DiagramPosition> = {}
  for (const step of input.steps) {
    const node = graph.node(step.id)
    const size = sizes[step.id] ?? defaultStepSize(step.kind, input.layout)
    positions[step.id] = {
      x: Math.round((node.x ?? 0) - size.width / 2),
      y: Math.round((node.y ?? 0) - size.height / 2),
    }
  }

  const lanes = input.lanes ?? []
  if (lanes.length === 0) {
    for (const step of input.steps) {
      if (step.position !== undefined) positions[step.id] = { ...step.position }
    }
    return { positions, sizes, lanes: [] }
  }

  // Lanes: each lane's steps moved across into its band, in the order of `lanes`.
  const laneOf = (step: DiagramStep) =>
    lanes.some((lane) => lane.id === step.lane) ? (step.lane ?? '') : (lanes[0]?.id ?? '')
  const cross = (position: DiagramPosition) => (along ? position.y : position.x)
  const crossSize = (size: DiagramSize) => (along ? size.height : size.width)
  // Start-to-end: the label row is the band's top; top-to-bottom: it stands above the steps.
  const crossPadding = along ? LANE_HEADER : LANE_PADDING
  let bandStart = 0
  const bands: { lane: DiagramLane; start: number; size: number }[] = []
  for (const lane of lanes) {
    const members = input.steps.filter((step) => laneOf(step) === lane.id)
    const auto = members.filter((step) => step.position === undefined)
    const first = Math.min(...auto.map((step) => cross(positions[step.id] ?? { x: 0, y: 0 })))
    let end = 0
    for (const step of auto) {
      const position = positions[step.id] ?? { x: 0, y: 0 }
      const size = sizes[step.id] ?? defaultStepSize(step.kind, input.layout)
      const moved = bandStart + crossPadding + (cross(position) - first)
      positions[step.id] = along ? { x: position.x, y: moved } : { x: moved, y: position.y }
      end = Math.max(end, moved + crossSize(size) - bandStart)
    }
    const size = Math.max(end + LANE_PADDING, crossPadding + 48)
    bands.push({ lane, start: bandStart, size })
    bandStart += size
  }
  for (const step of input.steps) {
    if (step.position !== undefined) positions[step.id] = { ...step.position }
  }
  // Every band spans the whole diagram along the flow.
  let alongStart = Infinity
  let alongEnd = -Infinity
  for (const step of input.steps) {
    const position = positions[step.id] ?? { x: 0, y: 0 }
    const size = sizes[step.id] ?? defaultStepSize(step.kind, input.layout)
    const start = along ? position.x : position.y
    alongStart = Math.min(alongStart, start)
    alongEnd = Math.max(alongEnd, start + (along ? size.width : size.height))
  }
  if (!Number.isFinite(alongStart)) {
    alongStart = 0
    alongEnd = 240
  }
  alongStart -= LANE_PADDING
  alongEnd += LANE_PADDING
  const laidOut = bands.map(({ lane, start, size }) =>
    along
      ? { ...lane, x: alongStart, y: start, width: alongEnd - alongStart, height: size }
      : {
          ...lane,
          x: start,
          y: alongStart - LANE_HEADER,
          width: size,
          height: alongEnd - alongStart + LANE_HEADER,
        },
  )
  return { positions, sizes, lanes: laidOut }
}

/**
 * A layout x as drawn: in a right-to-left page the diagram is mirrored, so the leading edge is
 * on the right (`x` is the box's leading side, `width` its width).
 */
export function drawnX(x: number, width: number, rtl: boolean): number {
  return rtl ? -(x + width) : x
}

/** The layout x of a box drawn at `drawn` (the inverse of `drawnX`). */
export function layoutX(drawn: number, width: number, rtl: boolean): number {
  return rtl ? -(drawn + width) : drawn
}

// ── Keyboard ──────────────────────────────────────────────────────────────────────────────────

/** The arrow pointing along the flow, and back against it. */
function flowKeys(layout: DiagramLayout, rtl: boolean) {
  if (layout === 'top-to-bottom') {
    return {
      forward: 'ArrowDown',
      back: 'ArrowUp',
      next: rtl ? 'ArrowLeft' : 'ArrowRight',
      previous: rtl ? 'ArrowRight' : 'ArrowLeft',
    }
  }
  return {
    forward: rtl ? 'ArrowLeft' : 'ArrowRight',
    back: rtl ? 'ArrowRight' : 'ArrowLeft',
    next: 'ArrowDown',
    previous: 'ArrowUp',
  }
}

/**
 * Where a key takes the keyboard (view and run, and in edit while no step is chosen to move):
 * - on a step, the arrow along the flow (forward in the reading direction, or down) goes to the
 *   first connection out of it, the opposite arrow to the first connection into it;
 * - on a connection, along the flow to the step it leads to, back to the step it leaves; the
 *   other two arrows to the next or previous connection out of the same step (another branch);
 * - Home and End: the first and the last step in the flow's order.
 * Siblings are ordered by where they are drawn across the flow (`positions`), so the next one is
 * the one below (start-to-end) or further along the reading direction (top-to-bottom).
 * Null: the key does nothing there.
 */
export function diagramKeyTarget(
  model: DiagramModel,
  focus: DiagramFocus,
  key: string,
  options: {
    layout: DiagramLayout
    rtl: boolean
    order: readonly string[]
    positions?: Readonly<Record<string, DiagramPosition>>
  },
): DiagramFocus | null {
  if (key === 'Home' || key === 'End') {
    const id = key === 'Home' ? options.order[0] : options.order.at(-1)
    return id === undefined ? null : { type: 'step', id }
  }
  const keys = flowKeys(options.layout, options.rtl)
  const across = (id: string) => {
    const position = options.positions?.[id]
    if (position === undefined) return options.order.indexOf(id)
    return options.layout === 'start-to-end' ? position.y : position.x
  }
  const byCross = (list: DiagramConnection[], end: 'from' | 'to') =>
    list
      .map((connection, index) => ({ connection, index, at: across(connection[end]) }))
      .sort((a, b) => a.at - b.at || a.index - b.index)
      .map((each) => each.connection)
  if (focus.type === 'step') {
    if (key === keys.forward) {
      const first = byCross(outgoing(model, focus.id), 'to')[0]
      return first === undefined ? null : { type: 'connection', id: first.id }
    }
    if (key === keys.back) {
      const first = byCross(incoming(model, focus.id), 'from')[0]
      return first === undefined ? null : { type: 'connection', id: first.id }
    }
    return null
  }
  const connection = model.connections.find((each) => each.id === focus.id)
  if (connection === undefined) return null
  if (key === keys.forward) return { type: 'step', id: connection.to }
  if (key === keys.back) return { type: 'step', id: connection.from }
  if (key === keys.next || key === keys.previous) {
    const siblings = byCross(outgoing(model, connection.from), 'to')
    const index = siblings.findIndex((each) => each.id === connection.id)
    const target = siblings[key === keys.next ? index + 1 : index - 1]
    return target === undefined ? null : { type: 'connection', id: target.id }
  }
  return null
}

/**
 * How far an arrow key moves a chosen step, in layout coordinates: 8px (Shift: 40px) in the
 * arrow's direction on the screen. In a right-to-left page the layout's x runs the other way, so
 * ArrowRight lowers it (B.7: movement measured from the leading edge). Null for other keys.
 */
export function keyMoveDelta(key: string, shift: boolean, rtl: boolean): DiagramPosition | null {
  const step = shift ? MOVE_STEP * 5 : MOVE_STEP
  if (key === 'ArrowUp') return { x: 0, y: -step }
  if (key === 'ArrowDown') return { x: 0, y: step }
  if (key === 'ArrowRight') return { x: rtl ? -step : step, y: 0 }
  if (key === 'ArrowLeft') return { x: rtl ? step : -step, y: 0 }
  return null
}

// ── Editing ───────────────────────────────────────────────────────────────────────────────────

/** Makes the id of a new step or connection, given the ids already taken. */
export type DiagramIdMaker = (prefix: 'step' | 'connection', taken: ReadonlySet<string>) => string

/** The first `<prefix>-<n>` (n from 1) that is not taken: the default id maker. */
export function nextDiagramId(prefix: string, taken: ReadonlySet<string>): string {
  let n = 1
  while (taken.has(`${prefix}-${String(n)}`)) n += 1
  return `${prefix}-${String(n)}`
}

/** Every id the model uses, steps and connections. */
export function takenIds(model: DiagramModel): Set<string> {
  return new Set([
    ...model.steps.map((step) => step.id),
    ...model.connections.map((each) => each.id),
  ])
}

/**
 * Whether a connection from `from` to `to` may be added: not to itself, not out of an end event,
 * not into a start event, and not twice.
 */
export function canConnect(model: DiagramModel, from: string, to: string): boolean {
  if (from === to) return false
  const source = model.steps.find((step) => step.id === from)
  const target = model.steps.find((step) => step.id === to)
  if (source === undefined || target === undefined) return false
  if (source.kind === 'end' || target.kind === 'start') return false
  return !model.connections.some((each) => each.from === from && each.to === to)
}

/** The steps a connection from `from` may lead to, in the flow's order ("Connect to…"). */
export function connectionTargets(model: DiagramModel, from: string): DiagramStep[] {
  const order = stepOrder(model)
  return order
    .filter((id) => canConnect(model, from, id))
    .map((id) => model.steps.find((step) => step.id === id))
    .filter((step): step is DiagramStep => step !== undefined)
}

/**
 * Where a step added after `after` stands when `after` has a position of its own: one rank
 * further along the flow. Undefined when `after` is placed by the automatic layout (the new step
 * is too).
 */
export function positionAfter(
  after: DiagramStep,
  size: DiagramSize,
  layout: DiagramLayout,
): DiagramPosition | undefined {
  if (after.position === undefined) return undefined
  return layout === 'start-to-end'
    ? { x: after.position.x + size.width + RANK_GAP, y: after.position.y }
    : { x: after.position.x, y: after.position.y + size.height + RANK_GAP }
}

/**
 * The operations that add `step` after the step `after`: when `after` has exactly one way out
 * (and the new step is not an end event), the new step goes in between — that connection is
 * replaced by one into the new step (keeping its label and default mark) and one out of it;
 * otherwise a connection from `after` to the new step is added. An end event has no way out, so
 * nothing is connected after it. Without `after`, the step is only added.
 */
export function addStepOperations(
  model: DiagramModel,
  step: DiagramStep,
  after: string | undefined,
  makeId: DiagramIdMaker = nextDiagramId,
): DiagramOperation[] {
  const operations: DiagramOperation[] = [{ type: 'add-step', step }]
  const source = model.steps.find((each) => each.id === after)
  if (source === undefined || source.kind === 'end') return operations
  const used = takenIds(model)
  used.add(step.id)
  const newId = () => {
    const id = makeId('connection', used)
    used.add(id)
    return id
  }
  const out = outgoing(model, source.id)
  const only = out.length === 1 ? out[0] : undefined
  if (only !== undefined && step.kind !== 'end') {
    operations.push({ type: 'remove-connection', id: only.id })
    operations.push({
      type: 'add-connection',
      connection: {
        id: newId(),
        from: source.id,
        to: step.id,
        ...(only.label === undefined ? {} : { label: only.label }),
        ...(only.isDefault === true ? { isDefault: true } : {}),
      },
    })
    operations.push({
      type: 'add-connection',
      connection: { id: newId(), from: step.id, to: only.to },
    })
    return operations
  }
  operations.push({
    type: 'add-connection',
    connection: { id: newId(), from: source.id, to: step.id },
  })
  return operations
}

/** The operations that remove a step: its connections first, then the step. */
export function removeStepOperations(model: DiagramModel, id: string): DiagramOperation[] {
  return [
    ...model.connections
      .filter((each) => each.from === id || each.to === id)
      .map((each): DiagramOperation => ({ type: 'remove-connection', id: each.id })),
    { type: 'remove-step', id },
  ]
}

/**
 * The model after the operations, in order: what an application does with `onChange` before it
 * saves (or sends the operations to its server). Removing a step also removes its connections.
 */
export function applyDiagramOperations<M extends DiagramModel>(
  model: M,
  operations: readonly DiagramOperation[],
): M {
  let steps = [...model.steps]
  let connections = [...model.connections]
  for (const operation of operations) {
    switch (operation.type) {
      case 'add-step':
        if (!steps.some((step) => step.id === operation.step.id)) steps.push(operation.step)
        break
      case 'remove-step':
        steps = steps.filter((step) => step.id !== operation.id)
        connections = connections.filter(
          (each) => each.from !== operation.id && each.to !== operation.id,
        )
        break
      case 'rename-step':
        steps = steps.map((step) =>
          step.id === operation.id ? { ...step, label: operation.label } : step,
        )
        break
      case 'move-step':
        steps = steps.map((step) =>
          step.id === operation.id ? { ...step, position: { ...operation.position } } : step,
        )
        break
      case 'add-connection':
        if (!connections.some((each) => each.id === operation.connection.id)) {
          connections.push(operation.connection)
        }
        break
      case 'remove-connection':
        connections = connections.filter((each) => each.id !== operation.id)
        break
      case 'label-connection':
        connections = connections.map((each) => {
          if (each.id !== operation.id) return each
          const next: DiagramConnection = { ...each }
          delete next.label
          return operation.label === undefined || operation.label.trim() === ''
            ? next
            : { ...next, label: operation.label.trim() }
        })
        break
      case 'set-default-connection': {
        const from = connections.find((each) => each.id === operation.id)?.from
        connections = connections.map((each) => {
          if (each.from !== from) return each
          const next: DiagramConnection = { ...each }
          delete next.isDefault
          return operation.isDefault && each.id === operation.id
            ? { ...next, isDefault: true }
            : next
        })
        break
      }
    }
  }
  return { ...model, steps, connections }
}

// ── Runs ──────────────────────────────────────────────────────────────────────────────────────

/** A step's state in a run: what the run says, or not reached. */
export function runStateOf(
  states: Readonly<Record<string, { state: DiagramStepState } | undefined>>,
  id: string,
): DiagramStepState {
  return states[id]?.state ?? 'not-reached'
}

/** How many steps are in each state, and how many there are. */
export function runCounts(
  steps: readonly DiagramStep[],
  states: Readonly<Record<string, { state: DiagramStepState } | undefined>>,
): Record<DiagramStepState, number> & { total: number } {
  const counts = {
    done: 0,
    running: 0,
    waiting: 0,
    failed: 0,
    skipped: 0,
    'not-reached': 0,
    total: steps.length,
  }
  for (const step of steps) counts[runStateOf(states, step.id)] += 1
  return counts
}

/** The problems on each step and each connection, by id. */
export function problemsByTarget(problems: readonly DiagramProblem[]): {
  steps: Map<string, DiagramProblem[]>
  connections: Map<string, DiagramProblem[]>
} {
  const steps = new Map<string, DiagramProblem[]>()
  const connections = new Map<string, DiagramProblem[]>()
  for (const problem of problems) {
    if (problem.stepId !== undefined) {
      steps.set(problem.stepId, [...(steps.get(problem.stepId) ?? []), problem])
    } else if (problem.connectionId !== undefined) {
      connections.set(problem.connectionId, [
        ...(connections.get(problem.connectionId) ?? []),
        problem,
      ])
    }
  }
  return { steps, connections }
}

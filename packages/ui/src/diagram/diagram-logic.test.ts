import { describe, expect, it } from 'vitest'
import {
  addStepOperations,
  applyDiagramOperations,
  canConnect,
  connectionLabelSize,
  connectionTargets,
  defaultStepSize,
  diagramKeyTarget,
  drawnX,
  isTaskKind,
  keyMoveDelta,
  layoutDiagram,
  layoutX,
  nextDiagramId,
  positionAfter,
  problemsByTarget,
  removeStepOperations,
  runCounts,
  runStateOf,
  stepOrder,
  takenIds,
  type DiagramModel,
} from './diagram-logic'

/** start → check → gate → (yes) approve → end; gate → (no) reject → end2. */
const MODEL: DiagramModel = {
  steps: [
    { id: 'start', kind: 'start', label: 'Start' },
    { id: 'check', kind: 'user-task', label: 'Check' },
    { id: 'gate', kind: 'exclusive', label: 'OK?' },
    { id: 'approve', kind: 'task', label: 'Approve' },
    { id: 'reject', kind: 'message', label: 'Reject' },
    { id: 'end', kind: 'end', label: 'Done' },
    { id: 'end2', kind: 'end', label: 'Rejected' },
  ],
  connections: [
    { id: 'c1', from: 'start', to: 'check' },
    { id: 'c2', from: 'check', to: 'gate' },
    { id: 'c3', from: 'gate', to: 'approve', label: 'Yes', isDefault: true },
    { id: 'c4', from: 'gate', to: 'reject', label: 'No' },
    { id: 'c5', from: 'approve', to: 'end' },
    { id: 'c6', from: 'reject', to: 'end2' },
  ],
}

describe('sizes', () => {
  it('draws tasks as boxes and the rest as shapes with a label', () => {
    expect(isTaskKind('user-task')).toBe(true)
    expect(isTaskKind('sub-process')).toBe(true)
    expect(isTaskKind('exclusive')).toBe(false)
    expect(defaultStepSize('task', 'start-to-end')).toEqual({ width: 176, height: 64 })
    expect(defaultStepSize('start', 'start-to-end')).toEqual({ width: 120, height: 72 })
    // Top to bottom: the label beside the shape, the box symmetric around it.
    expect(defaultStepSize('parallel', 'top-to-bottom')).toEqual({ width: 292, height: 44 })
  })
  it('gives a connection label room by its length, at most 160px', () => {
    expect(connectionLabelSize(undefined)).toEqual({ width: 0, height: 0 })
    expect(connectionLabelSize('Yes').width).toBe(36)
    expect(connectionLabelSize('x'.repeat(100)).width).toBe(160)
  })
})

describe('stepOrder', () => {
  it('follows the connections breadth first from the start', () => {
    expect(stepOrder(MODEL)).toEqual(['start', 'check', 'gate', 'approve', 'reject', 'end', 'end2'])
  })
  it('puts steps nothing reaches after, in the given order', () => {
    const model: DiagramModel = {
      steps: [{ id: 'loose', kind: 'task', label: 'Loose' }, ...MODEL.steps],
      connections: [...MODEL.connections, { id: 'cx', from: 'loose', to: 'loose2' }],
    }
    // A step nothing leads to starts a flow of its own, after the start events.
    expect(stepOrder(model).slice(0, 2)).toEqual(['start', 'check'])
    expect(stepOrder(model)).toContain('loose')
    expect(stepOrder(model)).toHaveLength(8)
  })
  it('survives a cycle', () => {
    const model: DiagramModel = {
      steps: [
        { id: 'a', kind: 'start', label: 'A' },
        { id: 'b', kind: 'task', label: 'B' },
        { id: 'c', kind: 'task', label: 'C' },
      ],
      connections: [
        { id: '1', from: 'a', to: 'b' },
        { id: '2', from: 'b', to: 'c' },
        { id: '3', from: 'c', to: 'b' },
      ],
    }
    expect(stepOrder(model)).toEqual(['a', 'b', 'c'])
  })
})

describe('layoutDiagram', () => {
  it('places the ranks from the leading edge, start to end', () => {
    const { positions } = layoutDiagram({ ...MODEL, layout: 'start-to-end' })
    const x = (id: string) => positions[id]?.x ?? NaN
    expect(x('start')).toBeLessThan(x('check'))
    expect(x('check')).toBeLessThan(x('gate'))
    expect(x('gate')).toBeLessThan(x('approve'))
    expect(x('approve')).toBeLessThan(x('end'))
  })
  it('places the ranks from the top down', () => {
    const { positions } = layoutDiagram({ ...MODEL, layout: 'top-to-bottom' })
    const y = (id: string) => positions[id]?.y ?? NaN
    expect(y('start')).toBeLessThan(y('check'))
    expect(y('gate')).toBeLessThan(y('reject'))
  })
  it('keeps a given position and uses measured sizes', () => {
    const model: DiagramModel = {
      steps: MODEL.steps.map((step) =>
        step.id === 'check' ? { ...step, position: { x: 500, y: -40 } } : step,
      ),
      connections: MODEL.connections,
    }
    const result = layoutDiagram({
      ...model,
      layout: 'start-to-end',
      sizes: { approve: { width: 176, height: 120 } },
    })
    expect(result.positions.check).toEqual({ x: 500, y: -40 })
    expect(result.sizes.approve).toEqual({ width: 176, height: 120 })
    expect(result.sizes.end).toEqual({ width: 120, height: 72 })
  })
  it('is the same every time (pictures are stable)', () => {
    const a = layoutDiagram({ ...MODEL, layout: 'start-to-end' })
    const b = layoutDiagram({ ...MODEL, layout: 'start-to-end' })
    expect(a).toEqual(b)
  })
  it('stacks lanes as bands, each step inside its own, under the label row', () => {
    const lanes = [
      { id: 'a', label: 'Accounting' },
      { id: 'm', label: 'Management' },
    ]
    const steps = MODEL.steps.map((step) => ({
      ...step,
      lane: step.id === 'approve' ? 'm' : step.id === 'end' ? 'nowhere' : 'a',
    }))
    const result = layoutDiagram({
      steps,
      connections: MODEL.connections,
      lanes,
      layout: 'start-to-end',
    })
    const [first, second] = result.lanes
    if (first === undefined || second === undefined) throw new Error('two lanes')
    expect(first.label).toBe('Accounting')
    expect(second.y).toBe(first.y + first.height)
    expect(second.x).toBe(first.x)
    expect(second.width).toBe(first.width)
    const approve = result.positions.approve
    const end = result.positions.end
    if (approve === undefined || end === undefined) throw new Error('placed')
    expect(approve.y).toBeGreaterThanOrEqual(second.y + 40)
    expect(approve.y + 64).toBeLessThanOrEqual(second.y + second.height)
    // An unknown lane is the first one.
    expect(end.y).toBeLessThan(second.y)
    expect(end.y).toBeGreaterThanOrEqual(first.y + 40)
  })
  it('sets lanes side by side from the top down, the label row above the steps', () => {
    const lanes = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]
    const steps = MODEL.steps.map((step) => ({ ...step, lane: step.id === 'reject' ? 'b' : 'a' }))
    const result = layoutDiagram({
      steps,
      connections: MODEL.connections,
      lanes,
      layout: 'top-to-bottom',
    })
    const [first, second] = result.lanes
    if (first === undefined || second === undefined) throw new Error('two lanes')
    expect(second.x).toBe(first.x + first.width)
    const start = result.positions.start
    if (start === undefined) throw new Error('placed')
    expect(start.y).toBeGreaterThanOrEqual(first.y + 40)
  })
  it('gives an empty lane a band of its own', () => {
    const result = layoutDiagram({
      steps: [{ id: 's', kind: 'start', label: 'S', lane: 'a' }],
      connections: [],
      lanes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      layout: 'start-to-end',
    })
    expect(result.lanes[1]?.height).toBeGreaterThan(0)
  })
})

describe('mirroring', () => {
  it('draws the leading edge on the right in right-to-left, and reads it back', () => {
    expect(drawnX(100, 176, false)).toBe(100)
    expect(drawnX(100, 176, true)).toBe(-276)
    expect(layoutX(drawnX(100, 176, true), 176, true)).toBe(100)
    expect(layoutX(40, 120, false)).toBe(40)
  })
})

describe('diagramKeyTarget', () => {
  const order = stepOrder(MODEL)
  const options = { layout: 'start-to-end' as const, rtl: false, order }
  it('goes along the flow: step, its connection, the next step', () => {
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'check' }, 'ArrowRight', options)).toEqual({
      type: 'connection',
      id: 'c2',
    })
    expect(
      diagramKeyTarget(MODEL, { type: 'connection', id: 'c2' }, 'ArrowRight', options),
    ).toEqual({ type: 'step', id: 'gate' })
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'check' }, 'ArrowLeft', options)).toEqual({
      type: 'connection',
      id: 'c1',
    })
    expect(diagramKeyTarget(MODEL, { type: 'connection', id: 'c1' }, 'ArrowLeft', options)).toEqual(
      {
        type: 'step',
        id: 'start',
      },
    )
  })
  it('moves between the branches of a decision with the other arrows', () => {
    expect(diagramKeyTarget(MODEL, { type: 'connection', id: 'c3' }, 'ArrowDown', options)).toEqual(
      {
        type: 'connection',
        id: 'c4',
      },
    )
    expect(diagramKeyTarget(MODEL, { type: 'connection', id: 'c4' }, 'ArrowUp', options)).toEqual({
      type: 'connection',
      id: 'c3',
    })
    expect(
      diagramKeyTarget(MODEL, { type: 'connection', id: 'c4' }, 'ArrowDown', options),
    ).toBeNull()
  })
  it('orders branches by where they are drawn', () => {
    const positions = { approve: { x: 0, y: 200 }, reject: { x: 0, y: 0 } }
    expect(
      diagramKeyTarget(MODEL, { type: 'step', id: 'gate' }, 'ArrowRight', {
        ...options,
        positions,
      }),
    ).toEqual({ type: 'connection', id: 'c4' })
  })
  it('mirrors the arrows in right-to-left and turns them from the top down', () => {
    const rtl = { ...options, rtl: true }
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'check' }, 'ArrowLeft', rtl)).toEqual({
      type: 'connection',
      id: 'c2',
    })
    const down = { ...options, layout: 'top-to-bottom' as const }
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'check' }, 'ArrowDown', down)).toEqual({
      type: 'connection',
      id: 'c2',
    })
    expect(diagramKeyTarget(MODEL, { type: 'connection', id: 'c3' }, 'ArrowRight', down)).toEqual({
      type: 'connection',
      id: 'c4',
    })
    expect(
      diagramKeyTarget(MODEL, { type: 'connection', id: 'c3' }, 'ArrowLeft', {
        ...down,
        rtl: true,
      }),
    ).toEqual({ type: 'connection', id: 'c4' })
  })
  it('goes to the first and last step with Home and End, and ignores other keys', () => {
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'gate' }, 'Home', options)).toEqual({
      type: 'step',
      id: 'start',
    })
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'gate' }, 'End', options)).toEqual({
      type: 'step',
      id: 'end2',
    })
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'end' }, 'ArrowRight', options)).toBeNull()
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'gate' }, 'ArrowDown', options)).toBeNull()
    expect(
      diagramKeyTarget(MODEL, { type: 'connection', id: 'nope' }, 'ArrowRight', options),
    ).toBeNull()
    expect(diagramKeyTarget(MODEL, { type: 'step', id: 'gate' }, 'a', options)).toBeNull()
  })
})

describe('keyMoveDelta', () => {
  it('moves 8px (Shift 40px) the way the arrow points on screen', () => {
    expect(keyMoveDelta('ArrowRight', false, false)).toEqual({ x: 8, y: 0 })
    expect(keyMoveDelta('ArrowDown', true, false)).toEqual({ x: 0, y: 40 })
    expect(keyMoveDelta('ArrowUp', false, true)).toEqual({ x: 0, y: -8 })
    expect(keyMoveDelta('Enter', false, false)).toBeNull()
  })
  it('measures from the leading edge in right-to-left', () => {
    expect(keyMoveDelta('ArrowRight', false, true)).toEqual({ x: -8, y: 0 })
    expect(keyMoveDelta('ArrowLeft', false, true)).toEqual({ x: 8, y: 0 })
  })
})

describe('editing', () => {
  it('makes the first free id', () => {
    expect(nextDiagramId('step', new Set())).toBe('step-1')
    expect(nextDiagramId('step', new Set(['step-1', 'step-2']))).toBe('step-3')
    expect(takenIds(MODEL).has('c3')).toBe(true)
    expect(takenIds(MODEL).has('gate')).toBe(true)
  })
  it('allows a connection only where it makes sense', () => {
    expect(canConnect(MODEL, 'check', 'approve')).toBe(true)
    expect(canConnect(MODEL, 'check', 'check')).toBe(false)
    expect(canConnect(MODEL, 'end', 'check')).toBe(false)
    expect(canConnect(MODEL, 'check', 'start')).toBe(false)
    expect(canConnect(MODEL, 'start', 'check')).toBe(false)
    expect(canConnect(MODEL, 'check', 'nowhere')).toBe(false)
    expect(connectionTargets(MODEL, 'reject').map((step) => step.id)).toEqual([
      'check',
      'gate',
      'approve',
      'end',
    ])
  })
  it('places a step one rank after a placed step, and leaves an automatic one to the layout', () => {
    const placed = { id: 'p', kind: 'task' as const, label: 'P', position: { x: 10, y: 20 } }
    expect(positionAfter(placed, { width: 176, height: 64 }, 'start-to-end')).toEqual({
      x: 250,
      y: 20,
    })
    expect(positionAfter(placed, { width: 176, height: 64 }, 'top-to-bottom')).toEqual({
      x: 10,
      y: 148,
    })
    expect(
      positionAfter({ id: 'a', kind: 'task', label: 'A' }, { width: 1, height: 1 }, 'start-to-end'),
    ).toBeUndefined()
  })
  it('puts a step added after a step with one way out in between, keeping the label', () => {
    const step = { id: 'step-1', kind: 'task' as const, label: 'Task' }
    expect(addStepOperations(MODEL, step, 'check')).toEqual([
      { type: 'add-step', step },
      { type: 'remove-connection', id: 'c2' },
      { type: 'add-connection', connection: { id: 'connection-1', from: 'check', to: 'step-1' } },
      { type: 'add-connection', connection: { id: 'connection-2', from: 'step-1', to: 'gate' } },
    ])
    const afterDefault = addStepOperations(
      { steps: MODEL.steps, connections: MODEL.connections.filter((each) => each.id !== 'c4') },
      step,
      'gate',
    )
    expect(afterDefault[2]).toEqual({
      type: 'add-connection',
      connection: { id: 'connection-1', from: 'gate', to: 'step-1', label: 'Yes', isDefault: true },
    })
  })
  it('adds a branch after a decision with several ways out, and nothing after an end', () => {
    const step = { id: 'step-1', kind: 'task' as const, label: 'Task' }
    expect(addStepOperations(MODEL, step, 'gate')).toEqual([
      { type: 'add-step', step },
      { type: 'add-connection', connection: { id: 'connection-1', from: 'gate', to: 'step-1' } },
    ])
    expect(addStepOperations(MODEL, step, 'end')).toEqual([{ type: 'add-step', step }])
    expect(addStepOperations(MODEL, step, undefined)).toEqual([{ type: 'add-step', step }])
    // An end event added after a step only joins it; nothing follows an end.
    const end = { id: 'step-1', kind: 'end' as const, label: 'End' }
    expect(addStepOperations(MODEL, end, 'check')).toHaveLength(2)
  })
  it('uses the application’s ids', () => {
    const step = { id: 'S9', kind: 'task' as const, label: 'Task' }
    const operations = addStepOperations(MODEL, step, 'gate', (prefix, taken) => {
      expect(taken.has('S9')).toBe(true)
      return `${prefix}-x`
    })
    expect(operations[1]).toEqual({
      type: 'add-connection',
      connection: { id: 'connection-x', from: 'gate', to: 'S9' },
    })
  })
  it('removes a step with its connections first', () => {
    expect(removeStepOperations(MODEL, 'gate')).toEqual([
      { type: 'remove-connection', id: 'c2' },
      { type: 'remove-connection', id: 'c3' },
      { type: 'remove-connection', id: 'c4' },
      { type: 'remove-step', id: 'gate' },
    ])
  })
  it('applies every operation in order', () => {
    const next = applyDiagramOperations(MODEL, [
      { type: 'add-step', step: { id: 'x', kind: 'task', label: 'X' } },
      { type: 'add-step', step: { id: 'x', kind: 'task', label: 'Again' } },
      { type: 'rename-step', id: 'x', label: 'Renamed' },
      { type: 'move-step', id: 'x', position: { x: 1, y: 2 } },
      { type: 'add-connection', connection: { id: 'cx', from: 'check', to: 'x' } },
      { type: 'add-connection', connection: { id: 'cx', from: 'x', to: 'x' } },
      { type: 'label-connection', id: 'cx', label: '  Maybe ' },
      { type: 'label-connection', id: 'c3', label: '' },
      { type: 'remove-connection', id: 'c6' },
      { type: 'remove-step', id: 'approve' },
    ])
    expect(next.steps.find((step) => step.id === 'x')).toEqual({
      id: 'x',
      kind: 'task',
      label: 'Renamed',
      position: { x: 1, y: 2 },
    })
    expect(next.connections.find((each) => each.id === 'cx')).toEqual({
      id: 'cx',
      from: 'check',
      to: 'x',
      label: 'Maybe',
    })
    expect(next.connections.find((each) => each.id === 'c3')).toBeUndefined()
    expect(next.connections.some((each) => each.id === 'c6' || each.id === 'c5')).toBe(false)
    expect(next.steps.some((step) => step.id === 'approve')).toBe(false)
    // The original is unchanged.
    expect(MODEL.connections).toHaveLength(6)
  })
  it('keeps one default way out of a step', () => {
    const next = applyDiagramOperations(MODEL, [
      { type: 'set-default-connection', id: 'c4', isDefault: true },
    ])
    expect(next.connections.find((each) => each.id === 'c4')?.isDefault).toBe(true)
    expect(next.connections.find((each) => each.id === 'c3')?.isDefault).toBeUndefined()
    const none = applyDiagramOperations(next, [
      { type: 'set-default-connection', id: 'c4', isDefault: false },
    ])
    expect(none.connections.some((each) => each.isDefault === true)).toBe(false)
    // Other steps' connections are left alone.
    expect(none.connections.find((each) => each.id === 'c1')).toEqual(MODEL.connections[0])
  })
  it('removes a connection label when it is cleared', () => {
    const next = applyDiagramOperations(MODEL, [
      { type: 'label-connection', id: 'c4', label: undefined },
    ])
    expect(next.connections.find((each) => each.id === 'c4')).toEqual({
      id: 'c4',
      from: 'gate',
      to: 'reject',
    })
  })
})

describe('runs and problems', () => {
  it('counts the steps in each state; a step not in the run was not reached', () => {
    const states = {
      start: { state: 'done' as const },
      check: { state: 'done' as const },
      gate: { state: 'failed' as const },
    }
    expect(runStateOf(states, 'approve')).toBe('not-reached')
    expect(runCounts(MODEL.steps, states)).toEqual({
      done: 2,
      running: 0,
      waiting: 0,
      failed: 1,
      skipped: 0,
      'not-reached': 4,
      total: 7,
    })
  })
  it('groups the problems by step and by connection', () => {
    const { steps, connections } = problemsByTarget([
      { id: '1', stepId: 'gate', message: 'a' },
      { id: '2', stepId: 'gate', message: 'b' },
      { id: '3', connectionId: 'c3', message: 'c' },
      { id: '4', message: 'the whole diagram' },
    ])
    expect(steps.get('gate')).toHaveLength(2)
    expect(connections.get('c3')?.[0]?.message).toBe('c')
    expect(steps.size + connections.size).toBe(2)
  })
})

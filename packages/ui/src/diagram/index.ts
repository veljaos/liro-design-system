// @veljaos/ui/diagram (P5.26): Diagram, on React Flow (@xyflow/react) with dagre for the automatic
// layout. A subpath of its own, so an application without diagrams does not load React Flow.
export { Diagram } from './diagram'
export type { DiagramProps } from './diagram'
export type { DiagramRunStep, DiagramStepAction } from './diagram-nodes'
export type { DiagramRun } from './diagram-parts'
export {
  addStepOperations,
  applyDiagramOperations,
  canConnect,
  connectionTargets,
  DIAGRAM_STEP_KINDS,
  DIAGRAM_STEP_STATES,
  diagramKeyTarget,
  keyMoveDelta,
  layoutDiagram,
  nextDiagramId,
  problemsByTarget,
  removeStepOperations,
  runCounts,
  stepOrder,
} from './diagram-logic'
export type {
  DiagramConnection,
  DiagramFocus,
  DiagramIdMaker,
  DiagramLane,
  DiagramLayout,
  DiagramLayoutResult,
  DiagramModel,
  DiagramOperation,
  DiagramPosition,
  DiagramProblem,
  DiagramSize,
  DiagramStep,
  DiagramStepKind,
  DiagramStepState,
} from './diagram-logic'

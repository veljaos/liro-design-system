// @veljaos/ui/gantt (P5.37): Gantt, on SVAR React Gantt (@svar-ui/react-gantt, MIT edition). A
// subpath of its own, so an application without a project plan does not load SVAR.
export { Gantt } from './gantt'
export type { GanttProps } from './gantt'
export type { GanttDialog } from './gantt-parts'
export {
  applyGanttChange,
  chartRange,
  dependencyCandidates,
  dependencyType,
  dependsOn,
  draggedDates,
  dragChange,
  durationDays,
  forbiddenGanttPackages,
  GANTT_DEPENDENCY_TYPES,
  GANTT_SCALES,
  GANTT_TASK_KINDS,
  ganttRows,
  isProgress,
  linkType,
  movedDates,
  nextDependencyId,
  nowPosition,
  phaseGroups,
  predecessors,
} from './gantt-logic'
export type {
  GanttBudget,
  GanttChange,
  GanttDependency,
  GanttDependencyType,
  GanttDragEdge,
  GanttModel,
  GanttRow,
  GanttScale,
  GanttState,
  GanttTask,
  GanttTaskKind,
} from './gantt-logic'

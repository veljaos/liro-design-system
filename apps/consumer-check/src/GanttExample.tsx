import { LiroProvider } from '@veljaos/ui'
import { applyGanttChange, Gantt, type GanttModel } from '@veljaos/ui/gantt'
import { useState } from 'react'

/**
 * One plan through the `@veljaos/ui/gantt` subpath (P5.37), typed against the packed declarations;
 * SVAR React Gantt (MIT) comes with it as a dependency of `@veljaos/ui`.
 */
export function GanttExample() {
  const [model, setModel] = useState<GanttModel>({
    tasks: [
      { id: 'build', label: 'Build', kind: 'phase', start: '2026-09-01', end: '2026-10-30' },
      { id: 'frame', label: 'Frame', parent: 'build', start: '2026-09-01', end: '2026-10-16' },
      {
        id: 'done',
        label: 'Done',
        kind: 'milestone',
        parent: 'build',
        start: '2026-10-30',
        end: '2026-10-30',
      },
    ],
    dependencies: [{ id: 'd1', from: 'frame', to: 'done' }],
  })
  return (
    <LiroProvider locale="en" today="2026-10-14">
      <Gantt
        label="Plan"
        mode="edit"
        now="09:40"
        tasks={model.tasks}
        dependencies={model.dependencies}
        onChange={(change) => {
          setModel((current) => applyGanttChange(current, change))
        }}
      />
    </LiroProvider>
  )
}

import { LiroProvider } from '@veljaos/ui'
import { applyDiagramOperations, Diagram, type DiagramModel } from '@veljaos/ui/diagram'
import { useState } from 'react'

/**
 * One diagram through the `@veljaos/ui/diagram` subpath (P5.26), typed against the packed
 * declarations; React Flow and dagre come with it as dependencies of `@veljaos/ui`.
 */
export function DiagramExample() {
  const [model, setModel] = useState<DiagramModel>({
    steps: [
      { id: 'received', kind: 'start', label: 'Invoice received' },
      { id: 'approve', kind: 'user-task', label: 'Approve' },
      { id: 'paid', kind: 'end', label: 'Paid' },
    ],
    connections: [
      { id: 'c1', from: 'received', to: 'approve' },
      { id: 'c2', from: 'approve', to: 'paid' },
    ],
  })
  return (
    <LiroProvider locale="en">
      <Diagram
        label="Approval"
        mode="edit"
        steps={model.steps}
        connections={model.connections}
        onChange={(operations) => {
          setModel((current) => applyDiagramOperations(current, operations))
        }}
      />
    </LiroProvider>
  )
}

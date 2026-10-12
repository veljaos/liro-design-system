import { CircleAlert, Upload } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { Alert, Button, notice, PageHeader, Toaster, useLiro } from '@veljaos/ui'
import {
  applyDiagramOperations,
  Diagram,
  type DiagramModel,
  type DiagramRun,
} from '../../../../packages/ui/src/diagram'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, statusBadge, toneOf } from './example-shell'
import { Frame } from './screens-G'
import {
  APPROVAL_LANES,
  APPROVAL_STEPS,
  approvalConnections,
  approvalDraft,
  checkWorkflow,
  IMPORT,
  IMPORT_CONNECTIONS,
  IMPORT_STEPS,
  importRun,
  M_ROUTES,
  WORKFLOW,
} from './data-M'

/*
 * Group M's example screens (P5.26, Diagrams): Kvadrat Gradnja's approval of an incoming invoice
 * ("Odobravanje ulazne fakture") as it runs today, its draft of version 4 being edited with the
 * application's two problems, and the orchestrator's nightly bank-statement import stopped at a
 * failed step with Retry. Each screen plays the application: it applies the diagram's operations
 * to its draft, checks the draft again after every change (data-M.ts) and answers Retry; the
 * diagram only shows and reports. Phones show the workflow and the run; editing is for a larger
 * screen.
 */

export { M_ROUTES }

/** The threshold as the tenant writes it ("500.000,00 RSD"). */
function useThreshold() {
  const { format } = useLiro()
  return format.money(WORKFLOW.threshold, 'RSD')
}

const WORKFLOW_CRUMBS = [
  { label: 'Workflows', href: `#${M_ROUTES.approval}` },
  { label: WORKFLOW.name },
]

// ── 1. The workflow, read only ────────────────────────────────────────────────────────────────

export function ApprovalWorkflow({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const threshold = useThreshold()
  const connections = useMemo(() => approvalConnections(threshold), [threshold])
  return (
    <Shell phone={phone} crumbs={WORKFLOW_CRUMBS}>
      <Frame phone={phone} wide>
        <PageHeader
          title={WORKFLOW.name}
          status={statusBadge('Active')}
          subtitle={`Version ${format.number(String(WORKFLOW.version))} · active since ${format.date(WORKFLOW.activeSince)} · ${format.number(String(WORKFLOW.waiting))} invoices on their way`}
          actions={
            phone ? undefined : (
              <Button
                intent="edit"
                label="Edit a draft"
                onClick={() => {
                  navigate(M_ROUTES.approvalEdit)
                }}
              />
            )
          }
        />
        <Diagram
          label={`${WORKFLOW.name}, version ${format.number(String(WORKFLOW.version))}`}
          steps={APPROVAL_STEPS}
          connections={connections}
          lanes={APPROVAL_LANES}
          minimap={!phone}
          height={phone ? 320 : 560}
          screen={phone ? 'phone' : 'desktop'}
        />
      </Frame>
    </Shell>
  )
}

// ── 2. The draft of version 4, being edited ───────────────────────────────────────────────────

export function ApprovalWorkflowEdit({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const threshold = useThreshold()
  const [draft, setDraft] = useState<DiagramModel>(() => approvalDraft(threshold))
  const problems = checkWorkflow(draft)
  return (
    <Shell phone={phone} crumbs={WORKFLOW_CRUMBS}>
      <Frame phone={phone} wide>
        <PageHeader
          title={WORKFLOW.name}
          status={statusBadge('Draft')}
          subtitle={`Version ${format.number(String(WORKFLOW.version + 1))}, a draft · version ${format.number(String(WORKFLOW.version))} stays active until this one is published`}
          actions={
            <>
              <Button
                intent="cancel"
                label="Discard the draft"
                onClick={() => {
                  navigate(M_ROUTES.approval)
                }}
              />
              <Button
                family="primary"
                icon={Upload}
                emphasis="primary"
                label="Publish"
                disabled={problems.length > 0}
                onClick={() => {
                  notice.success('Version 4 is published. New invoices follow it.')
                }}
              />
            </>
          }
        />
        {problems.length > 0 && (
          <p className="bidi-content m-0 flex items-start gap-1.5 text-sm text-secondary">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Publish when the problems below are solved; the check runs after every change.
          </p>
        )}
        <Diagram
          label={`${WORKFLOW.name}, draft of version ${format.number(String(WORKFLOW.version + 1))}`}
          mode="edit"
          steps={draft.steps}
          connections={draft.connections}
          lanes={APPROVAL_LANES}
          problems={problems}
          height={phone ? 320 : 600}
          screen={phone ? 'phone' : 'desktop'}
          onChange={(operations) => {
            setDraft((current) => applyDiagramOperations(current, operations))
          }}
        />
        {problems.length === 0 && (
          <Alert tone="success" title="The draft checks out. Publish it when you are ready." />
        )}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Frame>
    </Shell>
  )
}

// ── 3. The nightly import, stopped at a failed step ───────────────────────────────────────────

export function ImportRun({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const summary = `Started ${format.time(IMPORT.started)}, stopped ${format.time(IMPORT.stopped)}`
  const [run, setRun] = useState<DiagramRun>(() =>
    importRun({ night: format.time(IMPORT.started), summary, failedTone: toneOf('Failed') }),
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Automation', href: `#${M_ROUTES.importRun}` }, { label: IMPORT.name }]}
    >
      <Frame phone={phone} wide>
        <PageHeader title={IMPORT.name} subtitle={`Run of ${format.date(IMPORT.date)}`} />
        <Diagram
          label={`${IMPORT.name}, run of ${format.date(IMPORT.date)}`}
          mode="run"
          steps={IMPORT_STEPS}
          connections={IMPORT_CONNECTIONS}
          run={run}
          height={phone ? 320 : 460}
          screen={phone ? 'phone' : 'desktop'}
          onStepAction={(stepId, action) => {
            setRun((current) => ({
              ...current,
              status: { label: 'In progress', tone: toneOf('In progress') },
              steps: {
                ...current.steps,
                [stepId]:
                  action === 'retry'
                    ? { state: 'running', note: 'Attempt 2 of 3' }
                    : { state: 'skipped', reason: 'Skipped by Milica Petrović.' },
              },
            }))
            notice.info(
              action === 'retry'
                ? 'Banca Intesa’s statement is being fetched again.'
                : 'Banca Intesa is skipped tonight; its statement comes with tomorrow’s run.',
            )
          }}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Frame>
    </Shell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_M_ROUTES: ExampleRoute[] = [
  { path: M_ROUTES.approval, render: (phone) => <ApprovalWorkflow phone={phone} /> },
  { path: M_ROUTES.approvalEdit, render: (phone) => <ApprovalWorkflowEdit phone={phone} /> },
  { path: M_ROUTES.importRun, render: (phone) => <ImportRun phone={phone} /> },
]

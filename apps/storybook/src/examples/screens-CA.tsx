import { CircleCheck, FileText, FileWarning, Gavel, Paperclip } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  ActivityList,
  Alert,
  AttachmentList,
  Button,
  DataTable,
  DateText,
  DropdownMenu,
  EmptyState,
  HistoryList,
  KeyValueList,
  ListPage,
  MoneyText,
  notice,
  ReasonConfirmDialog,
  RelatedDocuments,
  SignerList,
  StatusBadge,
  StatusTimeline,
  TextAreaField,
  useLiro,
  DocumentPage,
  type DataTableColumn,
  type RelatedDocument,
  type Signer,
  type StatusNextStep,
  type StatusTimelineStep,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import {
  amlDateTime,
  AML_NOW_AT,
  AmlLink,
  AmlShell,
  ConfidentialNote,
  kycBadge,
  pepBadge,
  riskBadge,
  useAmlAlerts,
  useAmlCases,
  useAmlClients,
  useAmlReports,
} from './aml-shared'
import {
  AML_DEPUTY,
  AML_OFFICER,
  AML_ROUTES,
  amlClient,
  riskInForce,
  type AmlClient,
} from './data-aml'
import { HIT_TONES, SCREENING_HITS, type ScreeningHit } from './data-BY'
import { ALERT_TONES, BZ_ROUTES, type MonitoringAlert, type MonitoredTransaction } from './data-BZ'
import {
  AML_CASES,
  CA_ROUTES,
  CASE_STEPS,
  CASE_TONES,
  caseStep,
  DECLINE_REASONS,
  FOUR_EYES,
  lastStepLabel,
  NO_SUSPICION_REASONS,
  REPORT_REASONS,
  type AmlCase,
  type CaseOutcome,
  type CaseState,
  type CaseTask,
} from './data-CA'
import { CB_ROUTES, draftReportFor, nextReportId } from './data-CB'

/*
 * Group CA's example screens (P5.86, case management), Snežana Jelić on 14 October 2026:
 * - The cases (ListPage): open, closed, all; each with its client, subject, when it was opened,
 *   who investigates, how many alerts it holds and its state.
 * - One case (DocumentPage): the client as the counterparty, the key figures, the summary, the
 *   transactions under review (from the linked alerts) with the total the application gives, the
 *   timeline (StatusTimeline with the next step), the linked alerts and screening matches
 *   (RelatedDocuments), the documents (AttachmentList), the tasks, the decision and its four-eyes
 *   approval (SignerList: one person proposes, another approves; the proposer cannot approve), the
 *   notes, the client and the history in the side panels. "Propose decision" offers "No
 *   suspicion…" and "Report to the authority…", each confirmed with the reason the application
 *   requires (ReasonConfirmDialog). An approved report opens a draft report (P5.87). Every page
 *   starts with the confidentiality reminder: the client must not be told.
 * Nothing here decides: data-CA.ts holds the application's cases, reasons and figures.
 */

function caseBadge(state: CaseState) {
  return <StatusBadge label={state} tone={CASE_TONES[state]} />
}

function outcomeBadge(outcome: CaseOutcome) {
  return (
    <StatusBadge
      label={outcome}
      tone={outcome === 'Report to the authority' ? 'danger' : 'neutral'}
    />
  )
}

const isOpenCase = (found: AmlCase) => found.state !== 'Closed' && found.state !== 'Reported'

// ── The cases ─────────────────────────────────────────────────────────────────────────────────

const VIEWS = [
  { id: 'open', label: 'Open', holds: (found: AmlCase) => isOpenCase(found) },
  { id: 'closed', label: 'Closed', holds: (found: AmlCase) => !isOpenCase(found) },
  { id: 'all', label: 'All', holds: () => true },
]

function caseColumns(clientOf: (id: string) => AmlClient): DataTableColumn<AmlCase>[] {
  return [
    {
      id: 'id',
      header: 'Case',
      cell: (row) => (
        <span dir="ltr" className="font-medium text-link tabular-nums">
          {row.id}
        </span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      minWidth: 180,
      cell: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content">{clientOf(row.clientId).name}</span>
          {riskBadge(riskInForce(clientOf(row.clientId).assessment))}
        </span>
      ),
    },
    {
      id: 'title',
      header: 'Subject',
      minWidth: 240,
      cell: (row) => <span className="bidi-content">{row.title}</span>,
    },
    {
      id: 'opened',
      header: 'Opened',
      numeric: true,
      cell: (row) => <DateText value={row.opened.slice(0, 10)} />,
    },
    { id: 'assignee', header: 'Investigates', cell: (row) => row.assignee },
    {
      id: 'alerts',
      header: 'Alerts',
      align: 'end',
      numeric: true,
      cell: (row) => <span className="bidi-isolate">{String(row.alertIds.length)}</span>,
    },
    { id: 'state', header: 'State', cell: (row) => caseBadge(row.state) },
  ]
}

export function AmlCases({ phone, start = {} }: { phone: boolean; start?: { view?: string } }) {
  const navigate = useContext(Navigate)
  const [cases] = useAmlCases()
  const { clients } = useAmlClients()
  const clientOf = (id: string) => clients.find((each) => each.id === id) ?? amlClient(id)
  const [view, setView] = useState(start.view ?? 'open')
  const holds = VIEWS.find((each) => each.id === view)?.holds ?? (() => true)
  const rows = cases.filter(holds)
  return (
    <AmlShell phone={phone} tab="cases" crumbs={[{ label: 'Cases' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Cases"
        views={VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: cases.filter(each.holds).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Cases"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={caseColumns(clientOf)}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.id}
          onRowOpen={(row) => {
            navigate(CA_ROUTES.case(row.id))
          }}
          mobile={{
            title: (row) => row.id,
            subtitle: (row) => <span className="bidi-content">{clientOf(row.clientId).name}</span>,
            badge: (row) => caseBadge(row.state),
            details: ['title', 'opened', 'assignee'],
          }}
        />
      </ListPage>
    </AmlShell>
  )
}

// ── One case ──────────────────────────────────────────────────────────────────────────────────

interface TransactionRow extends MonitoredTransaction {
  alertId: string
}

const TRANSACTION_COLUMNS: DataTableColumn<TransactionRow>[] = [
  { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
  {
    id: 'counterparty',
    header: 'Counterparty',
    minWidth: 200,
    cell: (row) => <span className="bidi-content">{row.counterparty}</span>,
  },
  { id: 'direction', header: 'In / Out', cell: (row) => row.direction },
  {
    id: 'description',
    header: 'Description',
    minWidth: 220,
    cell: (row) => <span className="bidi-content">{row.description}</span>,
  },
  {
    id: 'alert',
    header: 'Alert',
    cell: (row) => <AmlLink href={BZ_ROUTES.alert(row.alertId)}>{row.alertId}</AmlLink>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.amount} currency={row.currency} />,
  },
]

const TASK_TONES = { done: 'success', todo: 'neutral', blocked: 'warning' } as const
const TASK_WORDS = { done: 'Done', todo: 'To do', blocked: 'Blocked' } as const

const TASK_COLUMNS: DataTableColumn<CaseTask>[] = [
  {
    id: 'task',
    header: 'Task',
    minWidth: 260,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{row.title}</span>
        {row.description !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.description}</span>
        )}
      </span>
    ),
  },
  { id: 'owner', header: 'Owner', cell: (row) => row.owner },
  {
    id: 'state',
    header: 'State',
    minWidth: 200,
    cell: (row) => (
      <span className="flex flex-col items-start gap-1">
        <StatusBadge label={TASK_WORDS[row.state]} tone={TASK_TONES[row.state]} />
        {row.blockedReason !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.blockedReason}</span>
        )}
        {row.doneNote !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.doneNote}</span>
        )}
      </span>
    ),
  },
]

/** The next step under the timeline's current state, in the application's words. */
function nextStep(
  found: AmlCase,
  onOpenReport: (() => void) | undefined,
): StatusNextStep | undefined {
  switch (found.state) {
    case 'Under investigation':
      return {
        title: 'Investigation in progress',
        description: `${found.assignee} investigates; when done, a decision is proposed. ${FOUR_EYES}`,
      }
    case 'Decision proposed':
      return {
        title: `${found.decision?.approver ?? ''} approves or declines next`,
        description: FOUR_EYES,
        tone: 'warning',
      }
    case 'Approved':
      return {
        title: 'Report to the authority',
        description: `Report ${found.reportId ?? ''} is prepared, reviewed and submitted; the case is reported when it is sent.`,
        tone: 'warning',
        ...(onOpenReport === undefined
          ? {}
          : {
              actions: (
                <Button
                  family="neutral"
                  icon={FileText}
                  label={`Open report ${found.reportId ?? ''}`}
                  onClick={onOpenReport}
                />
              ),
            }),
      }
    default:
      return undefined
  }
}

export function AmlCasePage({
  phone,
  caseId,
  start = {},
}: {
  phone: boolean
  caseId: string
  start?: { decide?: 'no-suspicion' | 'report' }
}) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [cases, setCases] = useAmlCases()
  const [alerts] = useAmlAlerts()
  const [reports, setReports] = useAmlReports()
  const [hits] = useExampleState<readonly ScreeningHit[]>('aml.hits', () => SCREENING_HITS)
  const { clients } = useAmlClients()
  const found = cases.find((each) => each.id === caseId)
  const [proposal, setProposal] = useState<{ outcome: CaseOutcome; open: boolean }>({
    outcome: start.decide === 'report' ? 'Report to the authority' : 'No suspicion',
    open: start.decide !== undefined,
  })
  const [note, setNote] = useState('')
  const [panelsOpen, setPanelsOpen] = useState<string[]>(['notes', 'client', 'history'])
  const [panelsHidden, setPanelsHidden] = useState(false)

  if (found === undefined) {
    return (
      <AmlShell
        phone={phone}
        tab="cases"
        crumbs={[{ label: 'Cases', href: `#${CA_ROUTES.cases}` }]}
      >
        <EmptyState
          variant="no-results"
          title="No such case"
          description={`${caseId} is not among the cases.`}
        />
      </AmlShell>
    )
  }
  const client = clients.find((each) => each.id === found.clientId) ?? amlClient(found.clientId)
  const update = (change: (current: AmlCase) => AmlCase) => {
    setCases((list) => list.map((each) => (each.id === found.id ? change(each) : each)))
  }
  const linkedAlerts = found.alertIds.flatMap((id) => {
    const alert = alerts.find((each) => each.id === id)
    return alert === undefined ? [] : [alert]
  })
  const linkedHits = found.hitIds.flatMap((id) => {
    const hit = hits.find((each) => each.id === id)
    return hit === undefined ? [] : [hit]
  })
  const transactions: TransactionRow[] = linkedAlerts.flatMap((alert: MonitoringAlert) =>
    alert.transactions.map((each) => ({ ...each, alertId: alert.id })),
  )
  const decision = found.decision
  const approving = found.state === 'Decision proposed' && decision?.approver === AML_OFFICER.name

  const propose = (outcome: CaseOutcome, reason: string, details: string) => {
    // The signed-in user proposes; the other pair of eyes is the deputy.
    const approver = AML_DEPUTY.name
    update((current) => ({
      ...current,
      state: 'Decision proposed',
      decision: {
        outcome,
        reason,
        details,
        proposedBy: AML_OFFICER.name,
        proposedAt: AML_NOW_AT,
        approver,
      },
      reached: { ...current.reached, 'Decision proposed': AML_NOW_AT },
      notes: [
        {
          key: `${current.id}-proposal-${AML_NOW_AT}`,
          author: AML_OFFICER.name,
          at: AML_NOW_AT,
          text: `Proposed: ${outcome.toLocaleLowerCase('en')}. ${reason}.${details === '' ? '' : ` ${details}`}`,
        },
        ...current.notes,
      ],
      history: [
        {
          id: `${current.id}-proposed-${AML_NOW_AT}`,
          at: AML_NOW_AT,
          actor: { name: AML_OFFICER.name },
          text: `Decision proposed: ${outcome.toLocaleLowerCase('en')} (${reason.toLocaleLowerCase('en')}).`,
          changes: [{ field: 'State', from: current.state, to: 'Decision proposed' }],
        },
        ...current.history,
      ],
    }))
    notice.success(`Decision proposed; ${approver} approves next.`)
  }

  const approve = () => {
    if (decision === undefined) return
    if (decision.outcome === 'No suspicion') {
      update((current) => ({
        ...current,
        state: 'Closed',
        decision: { ...decision, approvedAt: AML_NOW_AT },
        reached: { ...current.reached, Approved: AML_NOW_AT, Closed: AML_NOW_AT },
        history: [
          {
            id: `${current.id}-approved-${AML_NOW_AT}`,
            at: AML_NOW_AT,
            actor: { name: AML_OFFICER.name },
            text: 'Decision approved: no suspicion. Case closed.',
            changes: [{ field: 'State', from: current.state, to: 'Closed' }],
          },
          ...current.history,
        ],
      }))
      notice.success('Case closed: no suspicion.')
      return
    }
    const reportId = nextReportId(reports)
    setReports((list) => [draftReportFor(found, reportId, AML_NOW_AT, AML_OFFICER.name), ...list])
    update((current) => ({
      ...current,
      state: 'Approved',
      reportId,
      decision: { ...decision, approvedAt: AML_NOW_AT },
      reached: { ...current.reached, Approved: AML_NOW_AT },
      history: [
        {
          id: `${current.id}-approved-${AML_NOW_AT}`,
          at: AML_NOW_AT,
          actor: { name: AML_OFFICER.name },
          text: `Decision approved: report to the authority. Report ${reportId} opened as a draft.`,
          changes: [{ field: 'State', from: current.state, to: 'Approved' }],
        },
        ...current.history,
      ],
    }))
    notice.success(`Decision approved. Report ${reportId} opened as a draft.`)
  }

  const decline = (reason: string) => {
    if (decision === undefined) return
    update((current) => ({
      ...current,
      state: 'Under investigation',
      decision: { ...decision, declinedAt: AML_NOW_AT, declineReason: reason },
      reached: Object.fromEntries(
        Object.entries(current.reached).filter(([key]) => key !== 'Decision proposed'),
      ),
      history: [
        {
          id: `${current.id}-declined-${AML_NOW_AT}`,
          at: AML_NOW_AT,
          actor: { name: AML_OFFICER.name },
          text: `Decision declined: ${reason}. Back to the investigation.`,
          changes: [{ field: 'State', from: current.state, to: 'Under investigation' }],
        },
        ...current.history,
      ],
    }))
    notice.info('Decision declined; the case goes back to the investigation.')
  }

  const addNote = () => {
    const text = note.trim()
    if (text === '') return
    update((current) => ({
      ...current,
      notes: [
        {
          key: `${current.id}-note-${String(current.notes.length)}`,
          author: AML_OFFICER.name,
          at: AML_NOW_AT,
          text,
        },
        ...current.notes,
      ],
    }))
    setNote('')
    notice.success('Note added.')
  }

  const steps: StatusTimelineStep[] = CASE_STEPS.map((step, index) => ({
    key: step.key,
    label: index === CASE_STEPS.length - 1 ? lastStepLabel(decision, found.state) : step.label,
    ...(index <= caseStep(found.state) && found.reached[step.key] !== undefined
      ? { at: found.reached[step.key] }
      : {}),
  }))
  const related: RelatedDocument[] = [
    ...linkedAlerts.map((alert) => ({
      key: alert.id,
      type: 'Alert',
      number: alert.id,
      href: `#${BZ_ROUTES.alert(alert.id)}`,
      status: <StatusBadge label={alert.state} tone={ALERT_TONES[alert.state]} />,
    })),
    ...linkedHits.map((hit) => ({
      key: hit.id,
      type: 'Screening match',
      number: hit.id,
      href: `#${AML_ROUTES.screeningHit(hit.id)}`,
      status: <StatusBadge label={hit.state} tone={HIT_TONES[hit.state]} />,
    })),
    ...(found.reportId === undefined
      ? []
      : [
          {
            key: found.reportId,
            type: 'Report to the authority',
            number: found.reportId,
            href: `#${CB_ROUTES.report(found.reportId)}`,
            status:
              reports.find((each) => each.id === found.reportId) === undefined ? undefined : (
                <StatusBadge
                  label={reports.find((each) => each.id === found.reportId)?.state ?? ''}
                  tone="neutral"
                />
              ),
          },
        ]),
  ]
  const signers: Signer[] | undefined =
    decision === undefined
      ? undefined
      : [
          {
            id: 'proposer',
            name: decision.proposedBy,
            role: 'Proposed the decision',
            state: 'signed',
            at: decision.proposedAt,
          },
          {
            id: 'approver',
            name: decision.approver,
            role: 'Approves',
            state:
              decision.approvedAt !== undefined
                ? 'signed'
                : decision.declinedAt !== undefined
                  ? 'declined'
                  : 'waiting',
            ...(decision.approvedAt === undefined ? {} : { at: decision.approvedAt }),
            ...(decision.declinedAt === undefined ? {} : { at: decision.declinedAt }),
            ...(decision.declineReason === undefined ? {} : { reason: decision.declineReason }),
            current: approving,
          },
        ]
  const openReport =
    found.reportId === undefined
      ? undefined
      : () => {
          navigate(CB_ROUTES.report(found.reportId ?? ''))
        }

  const next = nextStep(found, openReport)

  return (
    <AmlShell
      phone={phone}
      tab="cases"
      crumbs={[{ label: 'Cases', href: `#${CA_ROUTES.cases}` }, { label: found.id }]}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={found.id}
        back={{ href: `#${CA_ROUTES.cases}`, label: 'Cases' }}
        status={caseBadge(found.state)}
        lifecycle={{
          steps: CASE_STEPS.map((step, index) => ({
            key: step.key,
            label:
              index === CASE_STEPS.length - 1 ? lastStepLabel(decision, found.state) : step.label,
          })),
          current: caseStep(found.state),
          label: 'Case status',
        }}
        counterparty={{
          label: 'Client',
          name: client.name,
          taxId: `PIB ${client.taxId}`,
          address: client.address,
        }}
        keyFigures={[
          { key: 'risk', label: 'Risk in force', value: riskBadge(riskInForce(client.assessment)) },
          {
            key: 'opened',
            label: 'Opened',
            value: (
              <span className="bidi-content tabular-nums">{amlDateTime(format, found.opened)}</span>
            ),
          },
          { key: 'assignee', label: 'Investigates', value: found.assignee },
          {
            key: 'total',
            label: 'Transactions under review',
            value: (
              <MoneyText
                value={found.transactionsTotal.amount}
                currency={found.transactionsTotal.currency}
              />
            ),
          },
        ]}
        banner={
          <ConfidentialNote>
            The client, its owners and anyone outside the compliance team must not be told that a
            case is open, what it looks at or how it ends. Documents are asked for as part of the
            ordinary bookkeeping only.
          </ConfidentialNote>
        }
        details={<p className="bidi-content m-0 text-sm text-primary">{found.summary}</p>}
        actions={
          <>
            {found.state === 'Under investigation' && (
              <DropdownMenu
                trigger={<Button family="neutral" icon={Gavel} label="Propose decision" />}
                entries={[
                  {
                    label: 'No suspicion…',
                    icon: CircleCheck,
                    onSelect: () => {
                      setProposal({ outcome: 'No suspicion', open: true })
                    },
                  },
                  {
                    label: 'Report to the authority…',
                    icon: FileWarning,
                    onSelect: () => {
                      setProposal({ outcome: 'Report to the authority', open: true })
                    },
                  },
                ]}
                align="end"
              />
            )}
            {found.state === 'Approved' && openReport !== undefined && (
              <Button
                family="document"
                icon={FileText}
                label={`Open report ${found.reportId ?? ''}`}
                onClick={openReport}
              />
            )}
          </>
        }
        linesTitle="Transactions under review"
        lines={
          transactions.length === 0 ? (
            <EmptyState
              compact
              title="No transactions"
              description="The case was opened from a screening match; no alert is linked yet."
            />
          ) : (
            <DataTable
              label={`Transactions of case ${found.id}`}
              layout={phone ? 'cards' : 'table'}
              inCard
              columns={TRANSACTION_COLUMNS}
              rows={transactions}
              getRowId={(row) => row.id}
              getRowLabel={(row) => `${row.counterparty}, ${row.date}`}
              mobile={{
                title: (row) => row.counterparty,
                subtitle: (row) => <span className="bidi-content">{row.description}</span>,
                badge: (row) => <MoneyText value={row.amount} currency={row.currency} />,
                details: ['date', 'direction', 'alert'],
              }}
            />
          )
        }
        totals={{
          label: 'Totals',
          rows: [],
          total: {
            key: 'total',
            label: 'Transactions under review',
            value: found.transactionsTotal.amount,
            currency: found.transactionsTotal.currency,
          },
        }}
        sections={[
          {
            key: 'timeline',
            title: 'Timeline',
            content: (
              <StatusTimeline
                label={`States of ${found.id}`}
                steps={steps}
                current={caseStep(found.state)}
                {...(next === undefined ? {} : { next })}
              />
            ),
          },
          {
            key: 'linked',
            title: 'Linked alerts, screening and reports',
            content:
              related.length === 0 ? (
                <p className="m-0 text-sm text-secondary">Nothing linked yet.</p>
              ) : (
                <RelatedDocuments label="Linked records" items={related} />
              ),
          },
          {
            key: 'documents',
            title: 'Documents',
            actions: (
              <Button
                family="neutral"
                icon={Paperclip}
                label="Add document"
                emphasis="secondary"
                onClick={() => {
                  notice.info('Choose a file from the client’s books or the firm’s drive.')
                }}
              />
            ),
            content: (
              <AttachmentList
                label={`Documents of ${found.id}`}
                files={found.documents}
                empty="No documents yet."
                onDownload={(file) => {
                  notice.info(`${file.name} opens in the viewer.`)
                }}
              />
            ),
          },
          {
            key: 'tasks',
            title: 'Tasks',
            content: (
              <DataTable
                label={`Tasks of ${found.id}`}
                layout={phone ? 'cards' : 'table'}
                columns={TASK_COLUMNS}
                rows={found.tasks}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.title}
                mobile={{
                  title: (row) => row.title,
                  subtitle: (row) => row.owner,
                  badge: (row) => (
                    <StatusBadge label={TASK_WORDS[row.state]} tone={TASK_TONES[row.state]} />
                  ),
                  details: [],
                }}
              />
            ),
          },
          {
            key: 'decision',
            title: 'Decision',
            content:
              decision === undefined || signers === undefined ? (
                <div className="flex flex-col gap-3">
                  <p className="bidi-content m-0 text-sm text-secondary">
                    No decision proposed yet. When the investigation is done, propose no suspicion
                    or a report to the authority.
                  </p>
                  <Alert tone="neutral" title="Four eyes">
                    {FOUR_EYES}
                  </Alert>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <KeyValueList
                    columns={phone ? 1 : 2}
                    items={[
                      { key: 'outcome', label: 'Outcome', value: outcomeBadge(decision.outcome) },
                      { key: 'reason', label: 'Reason', value: decision.reason },
                      {
                        key: 'proposed',
                        label: 'Proposed by',
                        value: (
                          <span className="bidi-content">{`${decision.proposedBy}, ${amlDateTime(format, decision.proposedAt)}`}</span>
                        ),
                      },
                      {
                        key: 'approver',
                        label: decision.approvedAt === undefined ? 'Approves' : 'Approved by',
                        value: (
                          <span className="bidi-content">
                            {decision.approvedAt === undefined
                              ? decision.approver
                              : `${decision.approver}, ${amlDateTime(format, decision.approvedAt)}`}
                          </span>
                        ),
                      },
                      {
                        key: 'details',
                        label: 'Details',
                        value: decision.details,
                        fullWidth: true,
                      },
                    ]}
                  />
                  <SignerList
                    signers={signers}
                    signLabel="Approve"
                    declineReasons={DECLINE_REASONS}
                    declineMessage="The case goes back to the investigation with your reason; the proposal is kept in the history."
                    declineSubject={`${found.id} · ${decision.outcome}`}
                    onSign={approve}
                    onDecline={(_signer, answer) => {
                      const label = DECLINE_REASONS.find(
                        (each) => each.value === answer.reason,
                      )?.label
                      decline([label, answer.text].filter(Boolean).join(': '))
                    }}
                  />
                  <Alert tone="neutral" title="Four eyes">
                    {FOUR_EYES}
                  </Alert>
                </div>
              ),
          },
        ]}
        panels={[
          {
            key: 'notes',
            title: 'Notes',
            count: found.notes.length,
            content: (
              <div className="flex flex-col gap-3">
                {isOpenCase(found) && (
                  <div className="flex flex-col gap-2">
                    <TextAreaField label="New note" rows={2} value={note} onChange={setNote} />
                    <div className="flex justify-end">
                      <Button
                        family="neutral"
                        icon={FileText}
                        label="Add note"
                        emphasis="secondary"
                        onClick={addNote}
                      />
                    </div>
                  </div>
                )}
                <ActivityList
                  label="Notes"
                  limit={3}
                  items={found.notes.map((each) => ({
                    key: each.key,
                    author: each.author,
                    time: <span dir="ltr">{amlDateTime(format, each.at)}</span>,
                    text: each.text,
                  }))}
                />
              </div>
            ),
          },
          {
            key: 'client',
            title: 'Client',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  {
                    key: 'file',
                    label: 'Client file',
                    value: <AmlLink href={AML_ROUTES.client(client.id)}>{client.name}</AmlLink>,
                  },
                  {
                    key: 'risk',
                    label: 'Risk in force',
                    value: riskBadge(riskInForce(client.assessment)),
                  },
                  { key: 'kyc', label: 'File state', value: kycBadge(client.kyc) },
                  { key: 'pep', label: 'PEP status', value: pepBadge(client.pep.status) },
                  { key: 'accountant', label: 'Accountant', value: client.accountant },
                ]}
              />
            ),
          },
          {
            key: 'history',
            title: 'History',
            count: found.history.length,
            content: (
              <HistoryList
                label={`History of ${found.id}`}
                entries={found.history}
                headingLevel={4}
              />
            ),
          },
        ]}
        panelsOpen={panelsOpen}
        onPanelsOpenChange={setPanelsOpen}
        panelsHidden={panelsHidden}
        onPanelsHiddenChange={setPanelsHidden}
      />
      <ReasonConfirmDialog
        open={proposal.open}
        onOpenChange={(open) => {
          setProposal((current) => ({ ...current, open }))
        }}
        {...(proposal.outcome === 'Report to the authority'
          ? { family: 'caution' as const, actionIcon: FileWarning }
          : { family: 'neutral' as const, actionIcon: CircleCheck })}
        title={
          proposal.outcome === 'Report to the authority'
            ? 'Propose a report to the authority'
            : 'Propose: no suspicion'
        }
        subject={`${found.id} · ${client.name}`}
        message={
          proposal.outcome === 'Report to the authority'
            ? `The proposal goes to ${AML_DEPUTY.name} for approval. When approved, the application opens the report to the illustrative financial intelligence unit as a draft. The client must not be informed.`
            : `The proposal goes to ${AML_DEPUTY.name} for approval; the case closes when approved. The client is not told.`
        }
        reasons={
          proposal.outcome === 'Report to the authority' ? REPORT_REASONS : NO_SUSPICION_REASONS
        }
        reasonLabel="Reason"
        detailsLabel="Reasoning"
        confirmLabel="Propose"
        onConfirm={({ reason, text }) => {
          const reasons =
            proposal.outcome === 'Report to the authority' ? REPORT_REASONS : NO_SUSPICION_REASONS
          propose(
            proposal.outcome,
            reasons.find((each) => each.value === reason)?.label ?? text,
            text,
          )
        }}
      />
    </AmlShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

/** The cases of the data and the two the examples may open by escalation. */
const CASE_IDS = [...AML_CASES.map((each) => each.id), 'CM-2026-0008', 'CM-2026-0009']

export const GROUP_CA_ROUTES: ExampleRoute[] = [
  { path: CA_ROUTES.cases, render: (phone) => <AmlCases phone={phone} /> },
  {
    path: CA_ROUTES.casesClosed,
    render: (phone) => <AmlCases phone={phone} start={{ view: 'closed' }} />,
  },
  ...CASE_IDS.flatMap((id): ExampleRoute[] => [
    { path: CA_ROUTES.case(id), render: (phone) => <AmlCasePage phone={phone} caseId={id} /> },
    {
      path: CA_ROUTES.caseDecide(id, 'no-suspicion'),
      render: (phone) => (
        <AmlCasePage phone={phone} caseId={id} start={{ decide: 'no-suspicion' }} />
      ),
    },
    {
      path: CA_ROUTES.caseDecide(id, 'report'),
      render: (phone) => <AmlCasePage phone={phone} caseId={id} start={{ decide: 'report' }} />,
    },
  ]),
]

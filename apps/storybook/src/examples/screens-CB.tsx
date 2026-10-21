import { Check, Save, Send, Undo2 } from 'lucide-react'
import { useContext, useRef, useState, type ReactNode } from 'react'
import {
  AttachmentList,
  Button,
  ConfirmDialog,
  DataTable,
  DateText,
  DefinedForm,
  EmptyState,
  HistoryList,
  KeyValueList,
  ListPage,
  notice,
  PageHeader,
  ReasonConfirmDialog,
  SectionCard,
  StatusBadge,
  StatusTimeline,
  useLiro,
  type DataTableColumn,
  type DefinedFormHandle,
  type DefinedValues,
  type StatusNextStep,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import {
  amlDateTime,
  AML_NOW_AT,
  AmlLink,
  AmlShell,
  ConfidentialNote,
  useAmlCases,
  useAmlReports,
} from './aml-shared'
import { AML_AUTHORITY, AML_OFFICER, AML_ROUTES } from './data-aml'
import { CA_ROUTES } from './data-CA'
import {
  AML_REPORTS,
  CB_ROUTES,
  REPORT_FORM,
  REPORT_STEPS,
  REPORT_TONES,
  reportStep,
  submissionOf,
  type AmlReport,
  type ReportState,
} from './data-CB'

/*
 * Group CB's example screens (P5.87, the suspicious transaction report), Snežana Jelić on
 * 14 October 2026:
 * - The reports (ListPage): every report to the illustrative financial intelligence unit with its
 *   client, case, state and when it was sent.
 * - One report: the form the authority asks for, drawn by DefinedForm from the application's
 *   field definitions (data-CB's REPORT_FORM; the values the application filled in from the case),
 *   with the confidentiality reminder first; its states as a StatusTimeline (draft, in review,
 *   approved, submitted, acknowledged) with the next step; "Send for review" checks the form (the
 *   missing values are said under their fields) — the reviewer, never the one who prepared it,
 *   approves or sends it back with a reason — "Submit to the authority…" confirms what happens;
 *   after that the form is read-only and the record of what was sent and when stands beside it
 *   (reference, channel, the files kept, the acknowledgement). The library renders no document:
 *   the files are the application's.
 * Nothing here sends anything: data-CB.ts holds the application's reports and references.
 */

function reportBadge(state: ReportState) {
  return <StatusBadge label={state} tone={REPORT_TONES[state]} />
}

const isSent = (report: AmlReport) =>
  report.state === 'Submitted' || report.state === 'Acknowledged'

// ── The reports ───────────────────────────────────────────────────────────────────────────────

const VIEWS = [
  { id: 'open', label: 'In preparation', holds: (report: AmlReport) => !isSent(report) },
  { id: 'sent', label: 'Sent', holds: (report: AmlReport) => isSent(report) },
  { id: 'all', label: 'All', holds: () => true },
]

const COLUMNS: DataTableColumn<AmlReport>[] = [
  {
    id: 'id',
    header: 'Report',
    cell: (row) => (
      <span dir="ltr" className="font-medium text-link tabular-nums">
        {row.id}
      </span>
    ),
  },
  {
    id: 'client',
    header: 'Person reported',
    minWidth: 220,
    cell: (row) =>
      row.clientId === undefined ? (
        <span className="bidi-content">{row.clientName}</span>
      ) : (
        <AmlLink href={AML_ROUTES.client(row.clientId)}>{row.clientName}</AmlLink>
      ),
  },
  {
    id: 'case',
    header: 'Case',
    cell: (row) => <AmlLink href={CA_ROUTES.case(row.caseId)}>{row.caseId}</AmlLink>,
  },
  {
    id: 'created',
    header: 'Prepared',
    numeric: true,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <DateText value={row.created.slice(0, 10)} />
        <span className="bidi-content text-xs text-secondary">{row.createdBy}</span>
      </span>
    ),
  },
  {
    id: 'submitted',
    header: 'Sent',
    numeric: true,
    cell: (row) =>
      row.submission === undefined ? (
        <span className="text-tertiary">—</span>
      ) : (
        <DateText value={row.submission.at.slice(0, 10)} />
      ),
  },
  { id: 'state', header: 'State', cell: (row) => reportBadge(row.state) },
]

export function AmlReports({ phone, start = {} }: { phone: boolean; start?: { view?: string } }) {
  const navigate = useContext(Navigate)
  const [reports] = useAmlReports()
  const [view, setView] = useState(start.view ?? 'all')
  const holds = VIEWS.find((each) => each.id === view)?.holds ?? (() => true)
  return (
    <AmlShell phone={phone} tab="reports" crumbs={[{ label: 'Reports' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Reports to the authority"
        views={VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: reports.filter(each.holds).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Reports to the authority"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={COLUMNS}
          rows={reports.filter(holds)}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.id}
          onRowOpen={(row) => {
            navigate(CB_ROUTES.report(row.id))
          }}
          mobile={{
            title: (row) => row.id,
            subtitle: (row) => <span className="bidi-content">{row.clientName}</span>,
            badge: (row) => reportBadge(row.state),
            details: ['case', 'created', 'submitted'],
          }}
        />
      </ListPage>
    </AmlShell>
  )
}

// ── One report ────────────────────────────────────────────────────────────────────────────────

type StartState = 'review' | 'approved' | 'submitted' | 'missing'

/** A draft advanced to a later state, for the examples that start there (the application's record). */
function advanced(report: AmlReport, state: StartState): AmlReport {
  if (report.state !== 'Draft' || state === 'missing') return report
  const reviewAt = report.reached['In review'] ?? '2026-10-14T09:38:00+02:00'
  const inReview: AmlReport = {
    ...report,
    state: 'In review',
    values: { ...report.values, narrative: NARRATIVE, notInformed: true },
    reached: { ...report.reached, 'In review': reviewAt },
    history: [
      {
        id: `${report.id}-review`,
        at: reviewAt,
        actor: { name: report.createdBy },
        text: 'Sent for review.',
      },
      ...report.history,
    ],
  }
  if (state === 'review') return inReview
  const approvedAt = '2026-10-14T09:39:00+02:00'
  const approved: AmlReport = {
    ...inReview,
    state: 'Approved',
    reached: { ...inReview.reached, Approved: approvedAt },
    history: [
      {
        id: `${report.id}-approved`,
        at: approvedAt,
        actor: { name: report.reviewer },
        text: 'Approved for submission.',
      },
      ...inReview.history,
    ],
  }
  if (state === 'approved') return approved
  const submission = submissionOf(report, AML_NOW_AT, report.reviewer)
  return {
    ...approved,
    state: 'Submitted',
    submission,
    reached: { ...approved.reached, Submitted: AML_NOW_AT },
    history: [
      {
        id: `${report.id}-submitted`,
        at: AML_NOW_AT,
        actor: { name: report.reviewer },
        text: `Submitted to ${AML_AUTHORITY}; reference ${submission.reference}.`,
      },
      ...approved.history,
    ],
  }
}

/** The reasons for suspicion the examples write into STR-2026-0003. */
const NARRATIVE =
  'On 14.10.2026 the screening found the client’s sole owner, Meridian Trade Holdings Ltd (Cyprus), a potential match on the Illustrative sanctions list (score 82): the same name but for one word, the same country and line of business, a different registration number. The owners of 60% of the holding have not been disclosed since 30.09.2026. In the same weeks the client paid 9.800.000,00 RSD in two round advances to Balkan Scrap Trade d.o.o., first paid two weeks earlier, for 120 t of scrap metal of which no delivery was booked. The client’s business does not explain the payments; the owner’s match could not be ruled out.'

const BACK_REASONS = [
  { value: 'missing', label: 'Information missing' },
  { value: 'wording', label: 'The wording needs changing' },
  { value: 'other', label: 'Another reason, in the details' },
]

function nextStep(
  report: AmlReport,
  phone: boolean,
  actions: ReactNode,
): StatusNextStep | undefined {
  switch (report.state) {
    case 'Draft':
      return {
        title: 'Fill in the form and send it for review',
        description: `${report.reviewer} reviews and approves it; the one who prepared it cannot approve.`,
        ...(phone ? {} : { actions }),
      }
    case 'In review':
      return {
        title: `${report.reviewer} reviews the report`,
        description: 'Approve it for submission, or send it back to the draft with a reason.',
        tone: 'warning',
        ...(phone ? {} : { actions }),
      }
    case 'Approved':
      return {
        title: 'Ready to submit',
        description: `The report goes to ${AML_AUTHORITY} through its portal; what is sent is kept with the case.`,
        tone: 'warning',
        ...(phone ? {} : { actions }),
      }
    case 'Submitted':
      return {
        title: 'Waiting for the acknowledgement',
        description: `${AML_AUTHORITY} acknowledges within the period its rules say (illustrative).`,
      }
    default:
      return undefined
  }
}

export function AmlReportPage({
  phone,
  reportId,
  start = {},
}: {
  phone: boolean
  reportId: string
  start?: { state?: StartState }
}) {
  const { format } = useLiro()
  const [reports, setReports] = useAmlReports()
  const [, setCases] = useAmlCases()
  const stored = reports.find((each) => each.id === reportId)
  const report =
    stored === undefined || start.state === undefined ? stored : advanced(stored, start.state)
  const form = useRef<DefinedFormHandle>(null)
  const [values, setValues] = useState<DefinedValues>(report?.values ?? {})
  const [showMissing, setShowMissing] = useState(start.state === 'missing')
  const [backAsked, setBackAsked] = useState(false)
  const [submitAsked, setSubmitAsked] = useState(false)

  if (report === undefined) {
    return (
      <AmlShell
        phone={phone}
        tab="reports"
        crumbs={[{ label: 'Reports', href: `#${CB_ROUTES.reports}` }]}
      >
        <EmptyState
          variant="no-results"
          title="No such report"
          description={`${reportId} is not among the reports.`}
        />
      </AmlShell>
    )
  }

  const update = (change: (current: AmlReport) => AmlReport) => {
    setReports((list) => list.map((each) => (each.id === report.id ? change(each) : each)))
  }
  /** Moves the report to a state, writing the history and the values as they stand. */
  const moveTo = (state: ReportState, text: string, extra: Partial<AmlReport> = {}) => {
    update(() => ({
      ...report,
      ...extra,
      state,
      values,
      reached: { ...report.reached, [state]: AML_NOW_AT },
      history: [
        {
          id: `${report.id}-${state}-${AML_NOW_AT}`,
          at: AML_NOW_AT,
          actor: { name: AML_OFFICER.name },
          text,
        },
        ...report.history,
      ],
    }))
  }

  const sendForReview = () => {
    const result = form.current?.check()
    if (result === undefined) return
    if (!result.valid) {
      setShowMissing(true)
      notice.error('The report is not complete: see the fields marked below.')
      return
    }
    moveTo('In review', 'Sent for review.')
    notice.success(`Sent for review to ${report.reviewer}.`)
  }

  const submit = () => {
    const submission = submissionOf(report, AML_NOW_AT, AML_OFFICER.name)
    moveTo('Submitted', `Submitted to ${AML_AUTHORITY}; reference ${submission.reference}.`, {
      submission,
    })
    setCases((list) =>
      list.map((each) =>
        each.id === report.caseId
          ? {
              ...each,
              state: 'Reported',
              reached: { ...each.reached, Reported: AML_NOW_AT },
              history: [
                {
                  id: `${each.id}-reported-${AML_NOW_AT}`,
                  at: AML_NOW_AT,
                  actor: { name: AML_OFFICER.name },
                  text: `Report ${report.id} submitted to ${AML_AUTHORITY}.`,
                  changes: [{ field: 'State', from: each.state, to: 'Reported' }],
                },
                ...each.history,
              ],
            }
          : each,
      ),
    )
    notice.success(`${report.id} submitted; reference ${submission.reference}.`)
  }

  const actions = (
    <>
      {report.state === 'Draft' && (
        <>
          <Button
            family="neutral"
            icon={Save}
            label="Save draft"
            onClick={() => {
              update((current) => ({ ...current, values }))
              notice.success('Draft saved.')
            }}
          />
          <Button family="primary" icon={Send} label="Send for review" onClick={sendForReview} />
        </>
      )}
      {report.state === 'In review' && (
        <>
          <Button
            family="neutral"
            icon={Undo2}
            label="Back to draft…"
            onClick={() => {
              setBackAsked(true)
            }}
          />
          <Button
            family="positive"
            icon={Check}
            label="Approve"
            onClick={() => {
              moveTo('Approved', 'Approved for submission.')
              notice.success('Approved for submission.')
            }}
          />
        </>
      )}
      {report.state === 'Approved' && (
        <Button
          family="caution"
          icon={Send}
          label="Submit to the authority…"
          onClick={() => {
            setSubmitAsked(true)
          }}
        />
      )}
      {isSent(report) && (
        <Button
          intent="download"
          label="Download what was sent"
          emphasis="secondary"
          onClick={() => {
            notice.info(`${report.id}.pdf and ${report.id}.xml download as sent.`)
          }}
        />
      )}
    </>
  )
  const timelineActions = (
    <div className="flex flex-wrap gap-2">
      {report.state === 'Draft' && (
        <Button family="neutral" icon={Send} label="Send for review" onClick={sendForReview} />
      )}
      {report.state === 'In review' && (
        <Button
          family="neutral"
          icon={Check}
          label="Approve"
          onClick={() => {
            moveTo('Approved', 'Approved for submission.')
            notice.success('Approved for submission.')
          }}
        />
      )}
      {report.state === 'Approved' && (
        <Button
          family="neutral"
          icon={Send}
          label="Submit to the authority…"
          onClick={() => {
            setSubmitAsked(true)
          }}
        />
      )}
    </div>
  )
  const next = nextStep(report, phone, timelineActions)
  const readOnly = report.state !== 'Draft'

  return (
    <AmlShell
      phone={phone}
      tab="reports"
      crumbs={[{ label: 'Reports', href: `#${CB_ROUTES.reports}` }, { label: report.id }]}
      {...(phone &&
      (report.state === 'Draft' || report.state === 'In review' || report.state === 'Approved')
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{actions}</div> }
        : {})}
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={report.id}
          back={{ href: `#${CB_ROUTES.reports}`, label: 'Reports' }}
          status={reportBadge(report.state)}
          subtitle={
            <span className="bidi-content">
              {`Suspicious transaction report · ${report.clientName} · case `}
              <AmlLink href={CA_ROUTES.case(report.caseId)}>{report.caseId}</AmlLink>
            </span>
          }
          {...(phone ? {} : { actions })}
        />
        <ConfidentialNote>
          This report and the case behind it are confidential. The person reported, its owners and
          anyone outside the compliance team must not be told that a report is being prepared or has
          been sent, nor what it says.
        </ConfidentialNote>
        <div
          className={
            phone ? 'flex flex-col gap-6' : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'
          }
        >
          <div className="flex min-w-0 flex-col gap-6">
            {phone && (
              <SectionCard title="Progress" headingLevel={2}>
                <StatusTimeline
                  label={`States of ${report.id}`}
                  steps={REPORT_STEPS.map((step, index) => ({
                    key: step.key,
                    label: step.label,
                    ...(index <= reportStep(report.state) && report.reached[step.key] !== undefined
                      ? { at: report.reached[step.key] }
                      : {}),
                  }))}
                  current={reportStep(report.state)}
                  {...(next === undefined ? {} : { next })}
                />
              </SectionCard>
            )}
            {report.submission !== undefined && (
              <SectionCard
                title="What was sent"
                headingLevel={2}
                description={`The record of the submission to ${AML_AUTHORITY}.`}
              >
                <KeyValueList
                  columns={phone ? 1 : 2}
                  items={[
                    {
                      key: 'at',
                      label: 'Sent',
                      value: (
                        <span className="bidi-content">{`${amlDateTime(format, report.submission.at)}, by ${report.submission.by}`}</span>
                      ),
                    },
                    { key: 'channel', label: 'Channel', value: report.submission.channel },
                    {
                      key: 'reference',
                      label: 'Reference',
                      value: <bdi>{report.submission.reference}</bdi>,
                      numeric: true,
                    },
                    {
                      key: 'ack',
                      label: 'Acknowledged',
                      value:
                        report.submission.acknowledgedAt === undefined ? (
                          <span className="text-secondary">Not yet</span>
                        ) : (
                          <span className="bidi-content">
                            {`${amlDateTime(format, report.submission.acknowledgedAt)} · ${report.submission.acknowledgement ?? ''}`}
                          </span>
                        ),
                    },
                  ]}
                />
                <AttachmentList
                  label="Files sent"
                  files={report.submission.files.map((file) => ({
                    ...file,
                    state: 'available' as const,
                  }))}
                  onDownload={(file) => {
                    notice.info(`${file.name} downloads as sent.`)
                  }}
                />
              </SectionCard>
            )}
            <DefinedForm
              ref={form}
              sections={REPORT_FORM}
              values={values}
              onChange={setValues}
              showMissing={showMissing}
              readOnly={readOnly}
              headingLevel={2}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            {!phone && (
              <SectionCard title="Progress" headingLevel={2}>
                <StatusTimeline
                  label={`States of ${report.id}`}
                  steps={REPORT_STEPS.map((step, index) => ({
                    key: step.key,
                    label: step.label,
                    ...(index <= reportStep(report.state) && report.reached[step.key] !== undefined
                      ? { at: report.reached[step.key] }
                      : {}),
                  }))}
                  current={reportStep(report.state)}
                  {...(next === undefined ? {} : { next })}
                />
              </SectionCard>
            )}
            <SectionCard title="Prepared and reviewed" headingLevel={2}>
              <KeyValueList
                columns={1}
                items={[
                  { key: 'by', label: 'Prepared by', value: report.createdBy },
                  {
                    key: 'created',
                    label: 'Opened',
                    value: (
                      <span className="bidi-content">{amlDateTime(format, report.created)}</span>
                    ),
                  },
                  { key: 'reviewer', label: 'Reviewed and approved by', value: report.reviewer },
                  {
                    key: 'case',
                    label: 'Case',
                    value: <AmlLink href={CA_ROUTES.case(report.caseId)}>{report.caseId}</AmlLink>,
                  },
                ]}
              />
            </SectionCard>
            <SectionCard title="History" headingLevel={2}>
              <HistoryList
                label={`History of ${report.id}`}
                entries={report.history}
                headingLevel={3}
              />
            </SectionCard>
          </div>
        </div>
      </div>
      <ReasonConfirmDialog
        open={backAsked}
        onOpenChange={setBackAsked}
        family="neutral"
        actionIcon={Undo2}
        title="Back to draft"
        subject={report.id}
        message={`The report goes back to ${report.createdBy} as a draft with your reason.`}
        reasons={BACK_REASONS}
        reasonLabel="Reason"
        detailsLabel="Details"
        confirmLabel="Back to draft"
        onConfirm={({ reason, text }) => {
          const label = BACK_REASONS.find((each) => each.value === reason)?.label ?? text
          moveTo(
            'Draft',
            `Sent back to the draft: ${label.toLocaleLowerCase('en')}.${text === '' ? '' : ` ${text}`}`,
          )
          notice.info('Back to the draft.')
        }}
      />
      <ConfirmDialog
        open={submitAsked}
        onOpenChange={setSubmitAsked}
        family="caution"
        actionIcon={Send}
        title="Submit report"
        subject={`${report.id} · ${report.clientName}`}
        message={`The report goes to ${AML_AUTHORITY} through its portal. The files sent are kept with the case for as long as the retention rules say. The person reported must not be informed.`}
        confirmLabel="Submit"
        onConfirm={submit}
      />
    </AmlShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

/** The reports of the data and the one the examples may open from a case's approval. */
const REPORT_IDS = [...AML_REPORTS.map((each) => each.id), 'STR-2026-0004']

export const GROUP_CB_ROUTES: ExampleRoute[] = [
  { path: CB_ROUTES.reports, render: (phone) => <AmlReports phone={phone} /> },
  ...REPORT_IDS.flatMap((id): ExampleRoute[] => [
    {
      path: CB_ROUTES.report(id),
      render: (phone) => <AmlReportPage phone={phone} reportId={id} />,
    },
    ...(['review', 'approved', 'submitted', 'missing'] as const).map((state): ExampleRoute => ({
      path: CB_ROUTES.reportAt(id, state),
      render: (phone) => <AmlReportPage phone={phone} reportId={id} start={{ state }} />,
    })),
  ]),
]

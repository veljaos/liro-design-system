import { ClipboardCheck, SlidersHorizontal } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Button,
  DataTable,
  DateText,
  DetailPage,
  DropdownMenu,
  DueDate,
  HistoryList,
  KeyValueList,
  notice,
  PageHeader,
  Questionnaire,
  ReasonConfirmDialog,
  SectionCard,
  StatusBadge,
  type DataTableColumn,
  type MenuEntry,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { Frame } from './screens-G'
import { AmlShell, riskBadge, useAmlClient } from './aml-shared'
import {
  AML_CLIENTS,
  AML_FACTOR_TONES,
  AML_OFFICER,
  AML_REVIEW_CYCLE,
  AML_ROUTES,
  AML_TODAY,
  amlAt,
  riskInForce,
  type AmlAssessment,
  type AmlClient,
  type AmlFactor,
  type AmlRisk,
} from './data-aml'
import { LAST_ANSWERS, OVERRIDE_REASONS, reviewedClient, RISK_QUESTIONS } from './data-BW'

/*
 * Group BW's example screens (P5.82, client risk assessment), Snežana Jelić on 14 October 2026:
 * - The assessment in force (DetailPage): the risk in words and tone, the score on the
 *   application's scale and its band, when it was made and the next review (DueDate); an
 *   override over it with who, when and why; the factors that drove it — each answer with the
 *   application's effect in words and its points, the application's score as the total
 *   (DataTable); the earlier assessments (HistoryList). "Override risk" offers the other levels;
 *   the chosen one is confirmed with a required reason (ReasonConfirmDialog) and kept.
 * - The review (Questionnaire): the application's questions with their branch (the owners above
 *   a holding), starting from the last answers; the summary where any answer can be changed;
 *   "Send for assessment" returns the application's result and opens it.
 * Adria Commodities d.o.o. shows an override in force (Medium by the assessment, High by the
 * compliance officer); Pekara Zlatni klas a low risk. The screens never add points or choose a
 * risk: every figure and word is the application's (data-aml.ts, data-BW.ts).
 */

const LEVELS: AmlRisk[] = ['Low', 'Medium', 'High']

const FACTOR_COLUMNS: DataTableColumn<AmlFactor>[] = [
  {
    id: 'factor',
    header: 'Factor',
    minWidth: 160,
    cell: (row) => <span className="bidi-content font-medium">{row.factor}</span>,
  },
  {
    id: 'answer',
    header: 'Answer',
    minWidth: 240,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{row.answer}</span>
        {row.note !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.note}</span>
        )}
      </span>
    ),
  },
  {
    id: 'effect',
    header: 'Effect',
    cell: (row) => <StatusBadge label={row.effect} tone={AML_FACTOR_TONES[row.effect]} />,
  },
  {
    id: 'points',
    header: 'Points',
    align: 'end',
    numeric: true,
    cell: (row) => <bdi>{row.points}</bdi>,
  },
]

interface RiskStart {
  /** "Override risk" asked, to this level (a page restored as it was left). */
  override?: AmlRisk
}

/** The assessment as the application made it, without a person's override. */
function withoutOverride(assessment: AmlAssessment): AmlAssessment {
  return {
    id: assessment.id,
    on: assessment.on,
    by: assessment.by,
    level: assessment.level,
    score: assessment.score,
    scale: assessment.scale,
    band: assessment.band,
    method: assessment.method,
    factors: assessment.factors,
    nextReview: assessment.nextReview,
  }
}

/** The client after an override: the level, the reason and its entry in the history. */
function overridden(client: AmlClient, level: AmlRisk, reason: string, details: string): AmlClient {
  const before = riskInForce(client.assessment)
  const assessment = withoutOverride(client.assessment)
  const back = level === client.assessment.level
  return {
    ...client,
    assessment: back
      ? assessment
      : {
          ...assessment,
          override: { level, reason, details, by: AML_OFFICER.name, on: AML_TODAY },
        },
    history: [
      {
        id: `${client.id}-override-${String(client.history.length)}`,
        at: amlAt(AML_TODAY, '09:40'),
        actor: { name: AML_OFFICER.name },
        text: back
          ? `Override removed: ${reason}.`
          : `Risk overridden: ${reason.charAt(0).toLocaleLowerCase('en')}${reason.slice(1)}.`,
        changes: [{ field: 'Risk', from: before, to: level }],
      },
      ...client.history,
    ],
  }
}

export function AmlRiskAssessment({
  phone,
  clientId,
  start = {},
}: {
  phone: boolean
  clientId: string
  start?: RiskStart
}) {
  const navigate = useContext(Navigate)
  const [client, change] = useAmlClient(clientId)
  const assessment = client.assessment
  const risk = riskInForce(assessment)
  const [asked, setAsked] = useState<AmlRisk | null>(start.override ?? null)
  const [shown, setShown] = useState<AmlRisk>(start.override ?? 'High')
  const override = assessment.override

  const entries: MenuEntry[] = LEVELS.filter((level) => level !== risk).map((level) => ({
    label:
      override !== undefined && level === assessment.level
        ? `Back to ${level}, the assessment’s`
        : `Set to ${level}`,
    onSelect: () => {
      setShown(level)
      setAsked(level)
    },
  }))
  const actions = (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu
        align="end"
        trigger={<Button family="neutral" icon={SlidersHorizontal} label="Override risk" />}
        entries={entries}
      />
      <Button
        family="primary"
        icon={ClipboardCheck}
        emphasis="primary"
        label="Start review"
        onClick={() => {
          navigate(AML_ROUTES.review(client.id))
        }}
      />
    </div>
  )

  return (
    <AmlShell
      phone={phone}
      tab="clients"
      crumbs={[
        { label: 'Clients', href: `#${AML_ROUTES.clients}` },
        { label: client.name, href: `#${AML_ROUTES.client(client.id)}` },
        { label: 'Risk assessment' },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title="Risk assessment"
        back={{ href: `#${AML_ROUTES.client(client.id)}`, label: client.name }}
        status={riskBadge(risk)}
        subtitle={<span className="bidi-content">{`${client.name} · PIB ${client.taxId}`}</span>}
        actions={actions}
        keyFigures={[
          { key: 'risk', label: 'Risk in force', value: riskBadge(risk) },
          {
            key: 'score',
            label: 'Score',
            value: (
              <span className="bidi-isolate">{`${assessment.score} of ${assessment.scale}`}</span>
            ),
          },
          { key: 'assessed', label: 'Assessed', value: <DateText value={assessment.on} /> },
          {
            key: 'review',
            label: 'Next review',
            value: <DueDate value={assessment.nextReview} warningDays={30} />,
          },
        ]}
        sections={[
          ...(override === undefined
            ? []
            : [
                {
                  id: 'override',
                  label: 'Override',
                  description: 'The risk in force was set by a person over the assessment’s.',
                  content: (
                    <KeyValueList
                      columns={phone ? 1 : 2}
                      items={[
                        {
                          key: 'assessed',
                          label: 'By the assessment',
                          value: riskBadge(assessment.level, assessment.level),
                        },
                        {
                          key: 'set',
                          label: 'Set to',
                          value: riskBadge(override.level, override.level),
                        },
                        { key: 'reason', label: 'Reason', value: override.reason },
                        {
                          key: 'by',
                          label: 'Set by',
                          value: (
                            <span className="bidi-content">
                              {`${override.by}, `}
                              <DateText value={override.on} />
                            </span>
                          ),
                        },
                        {
                          key: 'details',
                          label: 'Details',
                          value: override.details === '' ? null : override.details,
                          fullWidth: true,
                        },
                      ]}
                    />
                  ),
                },
              ]),
          {
            id: 'result',
            label: 'Result',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  {
                    key: 'level',
                    label: 'Risk by the assessment',
                    value: riskBadge(assessment.level, assessment.level),
                  },
                  { key: 'band', label: 'Band', value: assessment.band },
                  { key: 'cycle', label: 'Review cycle', value: AML_REVIEW_CYCLE[risk] },
                  { key: 'by', label: 'Assessed by', value: assessment.by },
                  {
                    key: 'number',
                    label: 'Assessment',
                    value: <bdi>{assessment.id}</bdi>,
                    numeric: true,
                  },
                  { key: 'method', label: 'Method', value: assessment.method },
                ]}
              />
            ),
          },
          {
            id: 'factors',
            label: 'Factors',
            description: 'What drove the risk: each answer as the application’s matrix weighs it.',
            flush: true,
            content: (
              <DataTable
                label={`Risk factors of ${client.name}`}
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={FACTOR_COLUMNS}
                rows={assessment.factors}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.factor}
                totalsLabel="Score"
                totals={{ points: <bdi>{assessment.score}</bdi> }}
                mobile={{
                  title: (row) => row.factor,
                  subtitle: (row) => <span className="bidi-content">{row.answer}</span>,
                  badge: (row) => (
                    <StatusBadge label={row.effect} tone={AML_FACTOR_TONES[row.effect]} />
                  ),
                  details: ['points'],
                }}
              />
            ),
          },
          {
            id: 'history',
            label: 'Earlier assessments',
            content: (
              <HistoryList label={`Assessments of ${client.name}`} entries={client.history} />
            ),
          },
        ]}
      />
      <ReasonConfirmDialog
        open={asked !== null}
        onOpenChange={(open) => {
          if (!open) setAsked(null)
        }}
        family="caution"
        actionIcon={SlidersHorizontal}
        title="Override risk"
        subject={client.name}
        message={
          shown === assessment.level
            ? `The risk goes back to the assessment’s ${shown} (${assessment.score} points). The reason is kept in the client’s history.`
            : `The assessment gives ${assessment.level} (${assessment.score} points). The risk in force becomes ${shown} until the next review; the reason is kept in the client’s history.`
        }
        reasons={OVERRIDE_REASONS}
        reasonLabel="Reason"
        detailsLabel="Details"
        confirmLabel={`Set to ${shown}`}
        onConfirm={({ reason, text }) => {
          const label = OVERRIDE_REASONS.find((each) => each.value === reason)?.label ?? text
          change((current) => overridden(current, shown, label, text))
          notice.success(`The risk of ${client.name} is ${shown}.`)
        }}
      />
    </AmlShell>
  )
}

// ── The review ────────────────────────────────────────────────────────────────────────────────

export function AmlRiskReview({
  phone,
  clientId,
  summary = false,
}: {
  phone: boolean
  clientId: string
  /** Opens on the summary, every answer given (a page restored as it was left). */
  summary?: boolean
}) {
  const navigate = useContext(Navigate)
  const [client, change] = useAmlClient(clientId)
  const last = LAST_ANSWERS[client.id]
  return (
    <AmlShell
      phone={phone}
      tab="clients"
      crumbs={[
        { label: 'Clients', href: `#${AML_ROUTES.clients}` },
        { label: client.name, href: `#${AML_ROUTES.client(client.id)}` },
        { label: 'Risk review' },
      ]}
    >
      <Frame phone={phone}>
        <PageHeader
          title="Risk review"
          back={{ href: `#${AML_ROUTES.risk(client.id)}`, label: 'Risk assessment' }}
          subtitle={<span className="bidi-content">{`${client.name} · PIB ${client.taxId}`}</span>}
        />
        <SectionCard
          title="Questions"
          headingLevel={2}
          description={
            last === undefined ? (
              'Answer each question; the application assesses the answers.'
            ) : (
              <span className="bidi-content">
                {'The answers of the last assessment, '}
                <DateText value={client.assessment.on} />
                {', are filled in: confirm or change each one.'}
              </span>
            )
          }
        >
          <Questionnaire
            label={`Risk review of ${client.name}`}
            questions={RISK_QUESTIONS}
            {...(last === undefined ? {} : { defaultAnswers: last })}
            {...(summary ? { defaultStep: { kind: 'summary' as const } } : {})}
            headingLevel={3}
            submitLabel="Send for assessment"
            onSubmit={() => {
              change((current) => reviewedClient(current))
              notice.success(`The review of ${client.name} is assessed.`)
              navigate(AML_ROUTES.risk(client.id))
            }}
          />
        </SectionCard>
      </Frame>
    </AmlShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BW_ROUTES: ExampleRoute[] = [
  ...AML_CLIENTS.flatMap((client) => [
    {
      path: AML_ROUTES.risk(client.id),
      render: (phone: boolean) => <AmlRiskAssessment phone={phone} clientId={client.id} />,
    },
    {
      path: AML_ROUTES.review(client.id),
      render: (phone: boolean) => <AmlRiskReview phone={phone} clientId={client.id} />,
    },
  ]),
  {
    path: AML_ROUTES.riskOverride,
    render: (phone) => (
      <AmlRiskAssessment phone={phone} clientId="kvadrat" start={{ override: 'High' }} />
    ),
  },
  {
    path: AML_ROUTES.reviewSummary,
    render: (phone) => <AmlRiskReview phone={phone} clientId="kvadrat" summary />,
  },
]

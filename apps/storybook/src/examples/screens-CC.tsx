import { useState, type ReactNode } from 'react'
import {
  AttachmentList,
  DashboardPage,
  DataTable,
  DateText,
  DetailPage,
  HistoryList,
  KeyValueList,
  notice,
  SectionCard,
  SetupChecklist,
  StatusBadge,
  useLiro,
  type DataTableColumn,
  type HistoryEntry,
} from '@veljaos/ui'
import { BarChart, DonutChart } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { AmlLink, AmlShell, useAmlAlerts, useAmlCases } from './aml-shared'
import { AML_AUTHORITY, AML_FIRM } from './data-aml'
import { BZ_ROUTES } from './data-BZ'
import { CA_ROUTES } from './data-CA'
import {
  AGEING,
  ALERTS_BY_MONTH,
  APPOINTMENTS,
  AUDIT_TRAIL,
  AUDIT_TRAIL_OLDER,
  CC_ROUTES,
  OBLIGATIONS,
  OVERVIEW_FIGURES,
  PROCEDURES,
  RETENTION,
  RETENTION_DUE,
  REVIEWS_DUE,
  RISK_SLICES,
  TRAINING,
  TRAINING_TONES,
  type RetentionDue,
  type TrainingRecord,
} from './data-CC'

/*
 * Group CC's example screens (P5.88, the AML overview and obligations), Snežana Jelić on
 * 14 October 2026:
 * - The overview (DashboardPage): the figures over all 214 clients as the application counts them
 *   (high-risk clients, reviews due, open alerts and cases — the alerts and cases of this session),
 *   the clients by risk (a donut in the states' tones, named in the legend), the reviews due by
 *   month, the open alerts and cases by age and the alerts raised and closed by month; the
 *   compliance officer and deputy; the obligations of the year as a checklist (SetupChecklist).
 * - The obligations (DetailPage): the officer and deputy with their appointments, the staff's
 *   training records with the application's state in words, the internal procedures as documents
 *   with their review dates, the retention rules and the records whose period ends, and the audit
 *   trail of the module (HistoryList, older entries paged in by the application).
 * Nothing here counts or judges: data-CC.ts holds the application's figures and words.
 */

function Figure({ children }: { children: ReactNode }) {
  return (
    <span dir="auto" className="bidi-isolate">
      {children}
    </span>
  )
}

// ── The overview ──────────────────────────────────────────────────────────────────────────────

export function AmlOverview({ phone, loading = false }: { phone: boolean; loading?: boolean }) {
  const { format } = useLiro()
  const [alerts] = useAmlAlerts()
  const [cases] = useAmlCases()
  const layout = phone ? 'phone' : 'desktop'
  const openAlerts = alerts.filter((each) => each.state === 'Open' || each.state === 'In review')
  const openCases = cases.filter((each) => each.state !== 'Closed' && each.state !== 'Reported')
  const count = (value: string | number) => format.number(String(value))
  return (
    <AmlShell phone={phone} tab="overview" crumbs={[{ label: 'Overview' }]}>
      <DashboardPage
        layout={layout}
        title="AML overview"
        subtitle={`${AML_FIRM.name} · ${count(OVERVIEW_FIGURES.clients)} clients · today, 14.10.2026.`}
        loading={loading}
        stats={[
          {
            key: 'high',
            label: 'High-risk clients',
            value: <Figure>{count(OVERVIEW_FIGURES.byRisk.High)}</Figure>,
            comparison: `Of ${count(OVERVIEW_FIGURES.clients)} clients`,
          },
          {
            key: 'reviews',
            label: 'Reviews due',
            value: <Figure>{count(OVERVIEW_FIGURES.reviewsDue)}</Figure>,
            comparison: `${count(OVERVIEW_FIGURES.reviewsOverdue)} overdue`,
          },
          {
            key: 'alerts',
            label: 'Open alerts',
            value: <Figure>{count(openAlerts.length)}</Figure>,
            comparison: `${count(OVERVIEW_FIGURES.alertsOver7Days)} older than 7 days`,
          },
          {
            key: 'cases',
            label: 'Open cases',
            value: <Figure>{count(openCases.length)}</Figure>,
            comparison: `${count(OVERVIEW_FIGURES.reportsThisYear)} reports this year`,
          },
        ]}
      >
        <DonutChart
          title="Clients by risk"
          description="The risk in force, as assessed or overridden"
          slices={RISK_SLICES}
          labels="none"
          centre={{ value: OVERVIEW_FIGURES.clients, label: 'Clients' }}
          layout={layout}
          {...(loading ? { loading: true } : {})}
        />
        <BarChart
          title="Reviews due"
          description="Client files whose periodic review falls due, by month"
          categories={REVIEWS_DUE.categories}
          series={[{ key: 'reviews', label: 'Reviews due' }]}
          values={REVIEWS_DUE.values}
          activeCategory="overdue"
          labels="end"
          layout={layout}
          {...(loading ? { loading: true } : {})}
        />
        <BarChart
          title="Open alerts and cases by age"
          description="How long the open alerts and cases have waited"
          categories={AGEING.categories}
          series={[
            { key: 'alerts', label: 'Alerts' },
            { key: 'cases', label: 'Cases', role: 'comparison' },
          ]}
          values={AGEING.values}
          stack="stacked"
          layout={layout}
          {...(loading ? { loading: true } : {})}
        />
        <BarChart
          title="Alerts raised and closed"
          description="The last six months"
          categories={ALERTS_BY_MONTH.categories}
          series={[
            { key: 'raised', label: 'Raised' },
            { key: 'closed', label: 'Closed', role: 'comparison' },
          ]}
          values={ALERTS_BY_MONTH.values}
          layout={layout}
          {...(loading ? { loading: true } : {})}
        />
        <SectionCard
          title="Compliance officer and deputy"
          headingLevel={2}
          actions={<AmlLink href={CC_ROUTES.obligations}>Obligations</AmlLink>}
        >
          <KeyValueList
            columns={1}
            loading={loading}
            items={[
              {
                key: 'officer',
                label: APPOINTMENTS.officer.role,
                value: (
                  <span className="bidi-content">{`${APPOINTMENTS.officer.name}, appointed ${format.date(APPOINTMENTS.officer.appointed)}`}</span>
                ),
              },
              {
                key: 'deputy',
                label: APPOINTMENTS.deputy.role,
                value: (
                  <span className="bidi-content">{`${APPOINTMENTS.deputy.name}, appointed ${format.date(APPOINTMENTS.deputy.appointed)}`}</span>
                ),
              },
              { key: 'registered', label: 'Appointments', value: APPOINTMENTS.registeredWith },
              {
                key: 'queue',
                label: 'Work waiting',
                value: (
                  <span className="bidi-content">
                    <AmlLink
                      href={BZ_ROUTES.alerts}
                    >{`${count(openAlerts.length)} alerts`}</AmlLink>
                    {' · '}
                    <AmlLink href={CA_ROUTES.cases}>{`${count(openCases.length)} cases`}</AmlLink>
                  </span>
                ),
              },
            ]}
          />
        </SectionCard>
        <SetupChecklist
          title="Obligations this year"
          description="What the firm’s AML procedure requires in 2026, as the application tracks it."
          steps={OBLIGATIONS}
          loading={loading}
        />
      </DashboardPage>
    </AmlShell>
  )
}

// ── The obligations ───────────────────────────────────────────────────────────────────────────

const TRAINING_COLUMNS: DataTableColumn<TrainingRecord>[] = [
  {
    id: 'person',
    header: 'Person',
    minWidth: 180,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{row.person}</span>
        <span className="bidi-content text-xs text-secondary">{row.role}</span>
      </span>
    ),
  },
  {
    id: 'last',
    header: 'Last training',
    numeric: true,
    cell: (row) => <DateText value={row.last} />,
  },
  {
    id: 'topic',
    header: 'Topic',
    minWidth: 240,
    cell: (row) => <span className="bidi-content">{row.topic}</span>,
  },
  {
    id: 'next',
    header: 'Next due',
    numeric: true,
    cell: (row) => <DateText value={row.nextDue} />,
  },
  {
    id: 'state',
    header: 'State',
    cell: (row) => <StatusBadge label={row.state} tone={TRAINING_TONES[row.state]} />,
  },
  {
    id: 'record',
    header: 'Record',
    cell: (row) => <span className="bidi-content">{row.record}</span>,
  },
]

const RETENTION_DUE_COLUMNS: DataTableColumn<RetentionDue>[] = [
  { id: 'records', header: 'Records', cell: (row) => row.records },
  {
    id: 'client',
    header: 'Former client',
    minWidth: 240,
    cell: (row) => <span className="bidi-content">{row.client}</span>,
  },
  {
    id: 'until',
    header: 'Kept until',
    numeric: true,
    cell: (row) => <DateText value={row.until} />,
  },
  {
    id: 'then',
    header: 'Then',
    minWidth: 220,
    cell: (row) => <span className="bidi-content">{row.then}</span>,
  },
]

export function AmlObligations({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [audit, setAudit] = useState<readonly HistoryEntry[]>(AUDIT_TRAIL)
  const [auditLoading, setAuditLoading] = useState(false)
  const hasMore = audit.length === AUDIT_TRAIL.length
  const layout = phone ? 'phone' : 'desktop'
  const trained = TRAINING.filter((each) => each.state === 'Done').length
  return (
    <AmlShell
      phone={phone}
      tab="overview"
      crumbs={[{ label: 'Overview', href: `#${CC_ROUTES.overview}` }, { label: 'Obligations' }]}
    >
      <DetailPage
        layout={layout}
        title="Obligations"
        back={{ href: `#${CC_ROUTES.overview}`, label: 'Overview' }}
        subtitle={`${AML_FIRM.name} as an obligated entity · the firm’s AML procedure, version 2026-01 (illustrative)`}
        sectionBar={!phone}
        keyFigures={[
          {
            key: 'trained',
            label: 'Staff trained this year',
            value: (
              <Figure>{`${format.number(String(trained))} of ${format.number(String(TRAINING.length))}`}</Figure>
            ),
            ...(trained < TRAINING.length ? { tone: 'warning' as const } : {}),
          },
          {
            key: 'procedures',
            label: 'Procedures',
            value: <Figure>{format.number(String(PROCEDURES.length))}</Figure>,
          },
          {
            key: 'retention',
            label: 'Records due for disposal',
            value: <Figure>{format.number(String(RETENTION_DUE.length))}</Figure>,
          },
          {
            key: 'audit',
            label: 'Audit entries today',
            value: (
              <Figure>
                {format.number(
                  String(AUDIT_TRAIL.filter((each) => each.at.startsWith('2026-10-14')).length),
                )}
              </Figure>
            ),
          },
        ]}
        sections={[
          {
            id: 'officers',
            label: 'Compliance officer and deputy',
            description: 'Who answers for the firm’s AML duties, and when they were appointed.',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                groups={[
                  {
                    key: 'officer',
                    title: APPOINTMENTS.officer.role,
                    items: [
                      { key: 'name', label: 'Name', value: APPOINTMENTS.officer.name },
                      {
                        key: 'email',
                        label: 'E-mail',
                        value: <bdi>{APPOINTMENTS.officer.email}</bdi>,
                      },
                      {
                        key: 'appointed',
                        label: 'Appointed',
                        value: <DateText value={APPOINTMENTS.officer.appointed} />,
                        numeric: true,
                      },
                      { key: 'decision', label: 'By', value: APPOINTMENTS.officer.decision },
                      {
                        key: 'registered',
                        label: `Reported to ${AML_AUTHORITY}`,
                        value: <DateText value={APPOINTMENTS.officer.registered} />,
                        numeric: true,
                      },
                    ],
                  },
                  {
                    key: 'deputy',
                    title: APPOINTMENTS.deputy.role,
                    items: [
                      { key: 'name', label: 'Name', value: APPOINTMENTS.deputy.name },
                      {
                        key: 'email',
                        label: 'E-mail',
                        value: <bdi>{APPOINTMENTS.deputy.email}</bdi>,
                      },
                      {
                        key: 'appointed',
                        label: 'Appointed',
                        value: <DateText value={APPOINTMENTS.deputy.appointed} />,
                        numeric: true,
                      },
                      { key: 'decision', label: 'By', value: APPOINTMENTS.deputy.decision },
                      {
                        key: 'registered',
                        label: `Reported to ${AML_AUTHORITY}`,
                        value: <DateText value={APPOINTMENTS.deputy.registered} />,
                        numeric: true,
                      },
                    ],
                  },
                ]}
              />
            ),
          },
          {
            id: 'training',
            label: 'Staff training',
            description:
              'Everyone who works with clients, with the last training and the next one due; the state is the application’s.',
            flush: true,
            content: (
              <DataTable
                label="Training records"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={TRAINING_COLUMNS}
                rows={TRAINING}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.person}
                mobile={{
                  title: (row) => row.person,
                  subtitle: (row) => <span className="bidi-content">{row.topic}</span>,
                  badge: (row) => (
                    <StatusBadge label={row.state} tone={TRAINING_TONES[row.state]} />
                  ),
                  details: ['last', 'next', 'record'],
                }}
              />
            ),
          },
          {
            id: 'procedures',
            label: 'Internal procedures',
            description:
              'The documents in force, with the date each was adopted and when its review is due.',
            flush: true,
            content: (
              <AttachmentList
                label="Internal procedures"
                files={PROCEDURES}
                inCard
                onDownload={(file) => {
                  notice.info(`${file.name} opens in the viewer.`)
                }}
              />
            ),
          },
          {
            id: 'retention',
            label: 'Retention of records',
            description: 'How long each kind of record is kept, and the records whose period ends.',
            content: (
              <div className="flex flex-col gap-4">
                <KeyValueList
                  columns={1}
                  items={RETENTION.map((rule) => ({
                    key: rule.id,
                    label: rule.records,
                    value: (
                      <span className="bidi-content">{`${rule.period} from ${rule.from.toLocaleLowerCase('en')}`}</span>
                    ),
                  }))}
                />
                <DataTable
                  label="Records due for disposal"
                  layout={phone ? 'cards' : 'table'}
                  columns={RETENTION_DUE_COLUMNS}
                  rows={RETENTION_DUE}
                  getRowId={(row) => row.id}
                  getRowLabel={(row) => row.client}
                  mobile={{
                    title: (row) => row.client,
                    subtitle: (row) => row.records,
                    details: ['until', 'then'],
                  }}
                />
              </div>
            ),
          },
          {
            id: 'audit',
            label: 'Audit trail',
            description:
              'Every change in the module and every reading of a sensitive value, newest first.',
            content: (
              <HistoryList
                label="Audit trail of the AML module"
                entries={audit}
                hasMore={hasMore}
                loading={auditLoading}
                onLoadMore={() => {
                  setAuditLoading(true)
                  setAudit([...AUDIT_TRAIL, ...AUDIT_TRAIL_OLDER])
                  setAuditLoading(false)
                }}
              />
            ),
          },
        ]}
      />
    </AmlShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_CC_ROUTES: ExampleRoute[] = [
  { path: CC_ROUTES.overview, render: (phone) => <AmlOverview phone={phone} /> },
  { path: CC_ROUTES.overviewLoading, render: (phone) => <AmlOverview phone={phone} loading /> },
  { path: CC_ROUTES.obligations, render: (phone) => <AmlObligations phone={phone} /> },
]

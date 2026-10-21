import { CircleCheck, FolderPlus, UserPlus } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import {
  Alert,
  BulkActionBar,
  Button,
  DataTable,
  DateText,
  Dialog,
  EmptyState,
  FilterBar,
  HistoryList,
  KeyFigures,
  KeyValueList,
  MoneyText,
  notice,
  RadioGroupField,
  ReasonConfirmDialog,
  StatusBadge,
  TextAreaField,
  useLiro,
  WorklistPage,
  type DataTableColumn,
  type FilterDefinition,
  type HistoryEntry,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
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
} from './aml-shared'
import { AML_OFFICER, AML_ROUTES, amlClient, riskInForce, type AmlClient } from './data-aml'
import {
  ALERT_RULES,
  ALERT_TONES,
  alertRule,
  BZ_ROUTES,
  CLOSE_REASONS,
  ESCALATE_REASONS,
  MONITORING_ALERTS,
  type AlertDecision,
  type AlertState,
  type MonitoringAlert,
  type MonitoredTransaction,
} from './data-BZ'
import { CA_ROUTES, caseFromAlert, nextCaseId, withAlert } from './data-CA'

/*
 * Group BZ's example screens (P5.85, transaction monitoring alerts), Snežana Jelić on 14 October
 * 2026: the alert queue (WorklistPage), one alert at a time. Each alert names the rule that
 * raised it, the client (with its risk in force), the transactions' total, its age and who it is
 * assigned to; its detail holds the rule and what it watches (the application's threshold), the
 * transactions that triggered it with the application's marks and the total it gives, the
 * client's profile (risk, expected activity, source of funds, screening) and the alert's history.
 * "Close…" asks for the reason the application requires (ReasonConfirmDialog; several alerts at
 * once from the bulk bar); "Escalate to a case…" opens a new case or adds the alert to the
 * client's open case, with the reason, and goes to the case. An unassigned alert offers "Assign
 * to me". On a phone the list comes first and the decisions stand in the bottom bar. Nothing here
 * scores or decides: data-BZ.ts holds the application's rules, alerts and figures.
 */

function alertBadge(state: AlertState) {
  return <StatusBadge label={state} tone={ALERT_TONES[state]} />
}

function money(amount: string, currency: string) {
  return <MoneyText value={amount} currency={currency} />
}

// ── The queue ─────────────────────────────────────────────────────────────────────────────────

type StateFilter = 'open' | 'closed' | 'all'

const FILTERS: FilterDefinition[] = [
  {
    id: 'state',
    label: 'State',
    type: 'select',
    options: [
      { value: 'open', label: 'Open and in review' },
      { value: 'closed', label: 'Closed and escalated' },
      { value: 'all', label: 'All' },
    ],
  },
  {
    id: 'rule',
    label: 'Rule',
    type: 'multiSelect',
    options: ALERT_RULES.map((rule) => ({ value: rule.id, label: rule.name })),
  },
  {
    id: 'assignee',
    label: 'Assignee',
    type: 'select',
    options: [
      { value: 'Snežana Jelić', label: 'Snežana Jelić' },
      { value: 'Marko Jelić', label: 'Marko Jelić' },
      { value: 'none', label: 'Unassigned' },
    ],
  },
]

const isOpen = (alert: MonitoringAlert) => alert.state === 'Open' || alert.state === 'In review'

function filterAlerts(
  alerts: readonly MonitoringAlert[],
  search: string,
  values: Record<string, unknown>,
): MonitoringAlert[] {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const state = (values.state ?? 'all') as StateFilter
  const rules = Array.isArray(values.rule) ? (values.rule as string[]) : []
  const assignee = typeof values.assignee === 'string' ? values.assignee : ''
  return alerts.filter((alert) => {
    if (state === 'open' && !isOpen(alert)) return false
    if (state === 'closed' && isOpen(alert)) return false
    if (rules.length > 0 && !rules.includes(alert.ruleId)) return false
    if (assignee === 'none' && alert.assignee !== null) return false
    if (assignee !== '' && assignee !== 'none' && alert.assignee !== assignee) return false
    if (query === '') return true
    const client = amlClient(alert.clientId)
    return [alert.id, client.name, alertRule(alert.ruleId).name, alert.summary].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  })
}

const TRANSACTION_COLUMNS: DataTableColumn<MonitoredTransaction>[] = [
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
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{row.description}</span>
        {row.note !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.note}</span>
        )}
      </span>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (row) => money(row.amount, row.currency),
  },
]

/** The client's profile the rule was applied to, in the client file's words. */
function ClientProfile({ client, phone }: { client: AmlClient; phone: boolean }) {
  return (
    <KeyValueList
      columns={phone ? 1 : 2}
      items={[
        {
          key: 'client',
          label: 'Client',
          value: <AmlLink href={AML_ROUTES.client(client.id)}>{client.name}</AmlLink>,
        },
        { key: 'risk', label: 'Risk in force', value: riskBadge(riskInForce(client.assessment)) },
        { key: 'kyc', label: 'Client file', value: kycBadge(client.kyc) },
        { key: 'pep', label: 'PEP status', value: pepBadge(client.pep.status) },
        { key: 'activity', label: 'Activity', value: client.activity, fullWidth: true },
        {
          key: 'expected',
          label: 'Expected activity',
          value: client.expectedActivity,
          fullWidth: true,
        },
        { key: 'funds', label: 'Source of funds', value: client.sourceOfFunds, fullWidth: true },
        {
          key: 'screening',
          label: 'Screening',
          value: (
            <AmlLink href={AML_ROUTES.clientScreening(client.id)}>{client.screening.note}</AmlLink>
          ),
        },
      ]}
    />
  )
}

function AlertDetail({
  alert,
  client,
  phone,
}: {
  alert: MonitoringAlert
  client: AmlClient
  phone: boolean
}) {
  const { format } = useLiro()
  const rule = alertRule(alert.ruleId)
  const decision = alert.decision
  return (
    <div className={phone ? 'flex flex-col gap-4' : 'flex flex-col gap-6 p-6'}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="bidi-content m-0 text-h2 text-primary">{rule.name}</h2>
        <p className="bidi-content m-0 text-sm text-secondary">
          <AmlLink href={AML_ROUTES.client(client.id)}>{client.name}</AmlLink>
          {` · ${alert.id}`}
        </p>
      </div>
      {decision?.state === 'Escalated' && decision.caseId !== undefined && (
        <ConfidentialNote>
          {`The alert is part of case ${decision.caseId}. The client must not be told that its transactions are reviewed in a case, nor of the outcome.`}
        </ConfidentialNote>
      )}
      {decision !== undefined && (
        <KeyValueList
          columns={phone ? 1 : 2}
          items={[
            { key: 'decision', label: 'Decision', value: alertBadge(decision.state) },
            {
              key: 'by',
              label: 'Decided by',
              value: (
                <span className="bidi-content">{`${decision.by}, ${amlDateTime(format, decision.at)}`}</span>
              ),
            },
            { key: 'reason', label: 'Reason', value: decision.reason },
            ...(decision.caseId === undefined
              ? []
              : [
                  {
                    key: 'case',
                    label: 'Case',
                    value: (
                      <AmlLink href={CA_ROUTES.case(decision.caseId)}>{decision.caseId}</AmlLink>
                    ),
                  },
                ]),
            {
              key: 'details',
              label: 'Details',
              value: decision.details === '' ? null : decision.details,
              fullWidth: true,
            },
          ]}
        />
      )}
      <KeyValueList
        columns={phone ? 1 : 2}
        items={[
          { key: 'rule', label: 'Rule', value: rule.name },
          { key: 'watches', label: 'What it watches', value: rule.watches, fullWidth: true },
          {
            key: 'amount',
            label: 'Amount',
            value: money(alert.amount, alert.currency),
            numeric: true,
          },
          {
            key: 'count',
            label: 'Transactions',
            value: (
              <span className="bidi-isolate">
                {format.number(String(alert.transactions.length))}
              </span>
            ),
            numeric: true,
          },
          {
            key: 'raised',
            label: 'Raised',
            value: <span className="bidi-content">{amlDateTime(format, alert.raised)}</span>,
          },
          {
            key: 'age',
            label: 'Age',
            value: <span className="bidi-isolate">{alert.ageText}</span>,
          },
          {
            key: 'assignee',
            label: 'Assignee',
            value: alert.assignee ?? <span className="text-secondary">Unassigned</span>,
          },
          { key: 'state', label: 'State', value: alertBadge(alert.state) },
        ]}
      />
      <Alert tone="neutral" title="What the rule found">
        {alert.summary}
      </Alert>
      <section aria-labelledby={`${alert.id}-transactions`} className="flex flex-col gap-2">
        <h3 id={`${alert.id}-transactions`} className="bidi-content m-0 text-h4 text-primary">
          Transactions
        </h3>
        <DataTable
          label={`Transactions of alert ${alert.id}`}
          layout={phone ? 'cards' : 'table'}
          columns={TRANSACTION_COLUMNS}
          rows={alert.transactions}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${row.counterparty}, ${row.date}`}
          totals={{ amount: money(alert.amount, alert.currency) }}
          totalsLabel="Total"
          mobile={{
            title: (row) => row.counterparty,
            subtitle: (row) => <span className="bidi-content">{row.description}</span>,
            badge: (row) => money(row.amount, row.currency),
            details: ['date', 'direction'],
          }}
        />
      </section>
      <section aria-labelledby={`${alert.id}-client`} className="flex flex-col gap-2">
        <h3 id={`${alert.id}-client`} className="bidi-content m-0 text-h4 text-primary">
          Client’s profile
        </h3>
        <ClientProfile client={client} phone={phone} />
      </section>
      <section aria-labelledby={`${alert.id}-history`} className="flex flex-col gap-2">
        <h3 id={`${alert.id}-history`} className="bidi-content m-0 text-h4 text-primary">
          History
        </h3>
        <HistoryList
          label={`History of alert ${alert.id}`}
          entries={alert.history}
          headingLevel={4}
        />
      </section>
    </div>
  )
}

interface AlertsStart {
  alert?: string
  act?: 'close' | 'escalate'
  /** The queue on its "Closed and escalated" view. */
  closed?: boolean
}

interface Escalation {
  alertId: string
  open: boolean
  /** The case chosen: an open case's id, or 'new'. */
  target: string
  reason: string | undefined
  details: string
}

export function AmlAlerts({ phone, start = {} }: { phone: boolean; start?: AlertsStart }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [alerts, setAlerts] = useAmlAlerts()
  const [cases, setCases] = useAmlCases()
  const { clients } = useAmlClients()
  const clientOf = (alert: MonitoringAlert) =>
    clients.find((each) => each.id === alert.clientId) ?? amlClient(alert.clientId)
  const [search, setSearch] = useState('')
  const startAlert = alerts.find((each) => each.id === start.alert)
  const [values, setValues] = useState<Record<string, unknown>>({
    // An alert already decided is opened among all of them.
    state:
      start.closed === true
        ? 'closed'
        : startAlert !== undefined && !isOpen(startAlert)
          ? 'all'
          : 'open',
  })
  const rows = useMemo(() => filterAlerts(alerts, search, values), [alerts, search, values])
  const [selected, setSelected] = useState<string | undefined>(
    start.alert ?? (phone ? undefined : rows[0]?.id),
  )
  const [checked, setChecked] = useState<string[]>([])
  const [closing, setClosing] = useState<{ ids: readonly string[]; open: boolean }>({
    ids: start.alert === undefined ? [] : [start.alert],
    open: start.act === 'close' && start.alert !== undefined,
  })
  const [escalation, setEscalation] = useState<Escalation>({
    alertId: start.alert ?? '',
    open: start.act === 'escalate' && start.alert !== undefined,
    target: 'new',
    reason: undefined,
    details: '',
  })
  const alert = rows.find((each) => each.id === selected)
  const index = rows.findIndex((each) => each.id === selected)
  const closing1 =
    closing.ids.length === 1 ? alerts.find((each) => each.id === closing.ids[0]) : undefined
  const escalating = alerts.find((each) => each.id === escalation.alertId)
  const openCases = (clientId: string) =>
    cases.filter(
      (each) =>
        each.clientId === clientId &&
        each.state !== 'Closed' &&
        each.state !== 'Reported' &&
        each.state !== 'Approved',
    )

  /** The next alert of the queue opens at the same place after a decision. */
  const moveOn = (next: readonly MonitoringAlert[]) => {
    const after = filterAlerts(next, search, values)
    if (!phone || selected !== undefined) {
      setSelected(
        after.some((each) => each.id === selected)
          ? selected
          : after[Math.min(Math.max(index, 0), after.length - 1)]?.id,
      )
    }
  }

  const decide = (ids: readonly string[], decision: AlertDecision, text: string) => {
    const next = alerts.map((each) =>
      ids.includes(each.id)
        ? {
            ...each,
            state: decision.state,
            decision,
            history: [
              {
                id: `${each.id}-${decision.state}-${decision.at}`,
                at: decision.at,
                actor: { name: decision.by },
                text,
                changes: [{ field: 'State', from: each.state, to: decision.state }],
              } satisfies HistoryEntry,
              ...each.history,
            ],
          }
        : each,
    )
    setAlerts(next)
    setChecked([])
    moveOn(next)
  }

  const assignToMe = (each: MonitoringAlert) => {
    setAlerts((list) =>
      list.map((one) =>
        one.id === each.id
          ? {
              ...one,
              assignee: AML_OFFICER.name,
              state: 'In review' as const,
              history: [
                {
                  id: `${one.id}-assigned-${AML_NOW_AT}`,
                  at: AML_NOW_AT,
                  actor: { name: AML_OFFICER.name },
                  text: `Assigned to ${AML_OFFICER.name}; review started.`,
                  changes: [{ field: 'Assignee', to: AML_OFFICER.name }],
                },
                ...one.history,
              ],
            }
          : one,
      ),
    )
    notice.success(`${each.id} assigned to you.`)
  }

  const escalate = () => {
    if (escalating === undefined || escalation.reason === undefined) return
    const reason =
      ESCALATE_REASONS.find((each) => each.value === escalation.reason)?.label ?? escalation.details
    const existing = cases.find((each) => each.id === escalation.target)
    const caseId = existing?.id ?? nextCaseId(cases)
    if (existing === undefined) {
      setCases((list) => [
        caseFromAlert(escalating, {
          id: caseId,
          title: alertRule(escalating.ruleId).name,
          at: AML_NOW_AT,
          by: AML_OFFICER.name,
          reason,
          details: escalation.details,
        }),
        ...list,
      ])
    } else {
      setCases((list) =>
        list.map((each) =>
          each.id === existing.id
            ? withAlert(each, escalating, AML_NOW_AT, AML_OFFICER.name)
            : each,
        ),
      )
    }
    decide(
      [escalating.id],
      {
        state: 'Escalated',
        reason,
        details: escalation.details,
        by: AML_OFFICER.name,
        at: AML_NOW_AT,
        caseId,
      },
      existing === undefined
        ? `Escalated to the new case ${caseId}.`
        : `Escalated to case ${caseId}.`,
    )
    setEscalation((current) => ({ ...current, open: false }))
    notice.success(
      existing === undefined
        ? `Case ${caseId} opened from ${escalating.id}.`
        : `${escalating.id} added to case ${caseId}.`,
    )
    navigate(CA_ROUTES.case(caseId))
  }

  const items: WorklistItem[] = rows.map((each) => {
    const client = clientOf(each)
    return {
      id: each.id,
      label: `${each.id}, ${alertRule(each.ruleId).name}`,
      title: <span className="bidi-content">{alertRule(each.ruleId).name}</span>,
      subtitle: (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="bidi-content">{client.name}</span>
          {riskBadge(riskInForce(client.assessment))}
          <span className="bidi-isolate text-tertiary">{`${each.ageText} · ${each.assignee ?? 'Unassigned'}`}</span>
        </span>
      ),
      figure: money(each.amount, each.currency),
      status: alertBadge(each.state),
    }
  })

  const decisions =
    alert === undefined || !isOpen(alert) ? undefined : (
      <>
        {alert.assignee === null && (
          <Button
            family="neutral"
            icon={UserPlus}
            label="Assign to me"
            onClick={() => {
              assignToMe(alert)
            }}
          />
        )}
        <Button
          family="neutral"
          icon={CircleCheck}
          label="Close…"
          onClick={() => {
            setClosing({ ids: [alert.id], open: true })
          }}
        />
        <Button
          family="caution"
          icon={FolderPlus}
          label="Escalate to a case…"
          onClick={() => {
            setEscalation({
              alertId: alert.id,
              open: true,
              target: openCases(alert.clientId)[0]?.id ?? 'new',
              reason: undefined,
              details: '',
            })
          }}
        />
      </>
    )

  const count = (predicate: (each: MonitoringAlert) => boolean) =>
    format.number(String(alerts.filter(predicate).length))

  return (
    <AmlShell
      phone={phone}
      tab="alerts"
      crumbs={[{ label: 'Alerts' }]}
      {...(phone && decisions !== undefined
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Alerts"
        label="Monitoring alerts"
        summary={
          <KeyFigures
            layout={phone ? 'phone' : 'desktop'}
            items={[
              {
                key: 'open',
                label: 'Open',
                value: count((each) => each.state === 'Open'),
                ...(alerts.some((each) => each.state === 'Open')
                  ? { tone: 'warning' as const }
                  : {}),
              },
              {
                key: 'review',
                label: 'In review',
                value: count((each) => each.state === 'In review'),
              },
              {
                key: 'unassigned',
                label: 'Unassigned',
                value: count((each) => isOpen(each) && each.assignee === null),
              },
              {
                key: 'escalated',
                label: 'Escalated',
                value: count((each) => each.state === 'Escalated'),
              },
            ]}
          />
        }
        toolbar={
          <FilterBar
            layout={phone ? 'phone' : 'desktop'}
            filters={FILTERS}
            inline={0}
            values={values}
            onValuesChange={(next) => {
              setValues(next)
            }}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Alert, client or rule"
          />
        }
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        checked={checked}
        onCheckedChange={setChecked}
        bulkBar={
          <BulkActionBar
            count={checked.length}
            onClear={() => {
              setChecked([])
            }}
            actions={[
              {
                key: 'close',
                family: 'neutral',
                icon: CircleCheck,
                label: 'Close…',
                onClick: () => {
                  setClosing({
                    ids: checked.filter((id) => {
                      const each = alerts.find((one) => one.id === id)
                      return each !== undefined && isOpen(each)
                    }),
                    open: true,
                  })
                },
              },
            ]}
          />
        }
        empty={
          <EmptyState
            variant="no-results"
            title="No alerts"
            description="Nothing matches the search and the filters."
          />
        }
        {...(alert === undefined
          ? {}
          : { detail: <AlertDetail alert={alert} client={clientOf(alert)} phone={phone} /> })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          setSelected(rows[(index - 1 + rows.length) % rows.length]?.id)
        }}
        onNext={() => {
          setSelected(rows[(index + 1) % rows.length]?.id)
        }}
      />
      <ReasonConfirmDialog
        open={closing.open}
        onOpenChange={(open) => {
          setClosing((current) => ({ ...current, open }))
        }}
        family="neutral"
        actionIcon={CircleCheck}
        {...(closing1 === undefined
          ? { title: `Close ${format.number(String(closing.ids.length))} alerts?` }
          : {
              title: 'Close alert',
              subject: `${closing1.id} · ${alertRule(closing1.ruleId).name}`,
            })}
        message="The alert, its transactions and the reason are kept with the client’s record for as long as the retention rules say. The client is not told."
        reasons={CLOSE_REASONS}
        reasonLabel="Reason"
        detailsLabel="Details"
        confirmLabel="Close"
        onConfirm={({ reason, text }) => {
          const label = CLOSE_REASONS.find((each) => each.value === reason)?.label ?? text
          decide(
            closing.ids,
            { state: 'Closed', reason: label, details: text, by: AML_OFFICER.name, at: AML_NOW_AT },
            `Closed: ${label.toLocaleLowerCase('en')}.`,
          )
          notice.success(
            closing.ids.length > 1
              ? `${format.number(String(closing.ids.length))} alerts closed.`
              : 'Alert closed.',
          )
        }}
      />
      <Dialog
        open={escalation.open}
        onOpenChange={(open) => {
          setEscalation((current) => ({ ...current, open }))
        }}
        title="Escalate to a case"
        {...(escalating === undefined
          ? {}
          : { subject: `${escalating.id} · ${alertRule(escalating.ruleId).name}` })}
        description="The alert and its transactions move into a case, where the investigation, the decision and the four-eyes approval are recorded. The client is not told."
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setEscalation((current) => ({ ...current, open: false }))
              }}
            />
            <Button
              family="caution"
              icon={FolderPlus}
              label="Escalate"
              disabled={escalation.reason === undefined}
              onClick={escalate}
            />
          </>
        }
      >
        {escalating !== undefined && (
          <div className="flex flex-col gap-4">
            <RadioGroupField
              label="Case"
              required
              options={[
                ...openCases(escalating.clientId).map((each) => ({
                  value: each.id,
                  label: `Add to ${each.id}`,
                  description: each.title,
                })),
                { value: 'new', label: 'Open a new case' },
              ]}
              value={escalation.target}
              onChange={(target) => {
                setEscalation((current) => ({ ...current, target }))
              }}
            />
            <RadioGroupField
              label="Reason"
              required
              options={ESCALATE_REASONS}
              {...(escalation.reason === undefined ? {} : { value: escalation.reason })}
              onChange={(reason) => {
                setEscalation((current) => ({ ...current, reason }))
              }}
            />
            <TextAreaField
              label="Details"
              rows={3}
              value={escalation.details}
              onChange={(details) => {
                setEscalation((current) => ({ ...current, details }))
              }}
            />
          </div>
        )}
      </Dialog>
    </AmlShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BZ_ROUTES: ExampleRoute[] = [
  { path: BZ_ROUTES.alerts, render: (phone) => <AmlAlerts phone={phone} /> },
  {
    path: BZ_ROUTES.alertsClosed,
    render: (phone) => <AmlAlerts phone={phone} start={{ closed: true }} />,
  },
  ...MONITORING_ALERTS.flatMap((alert): ExampleRoute[] => [
    {
      path: BZ_ROUTES.alert(alert.id),
      render: (phone: boolean) => <AmlAlerts phone={phone} start={{ alert: alert.id }} />,
    },
    {
      path: BZ_ROUTES.alertAct(alert.id, 'close'),
      render: (phone: boolean) => (
        <AmlAlerts phone={phone} start={{ alert: alert.id, act: 'close' }} />
      ),
    },
    {
      path: BZ_ROUTES.alertAct(alert.id, 'escalate'),
      render: (phone: boolean) => (
        <AmlAlerts phone={phone} start={{ alert: alert.id, act: 'escalate' }} />
      ),
    },
  ]),
]

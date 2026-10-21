import { FlaskConical, Power } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Alert,
  Button,
  DataTable,
  DetailPage,
  FormSection,
  ListPage,
  MIN_COLUMN_WIDTH,
  notice,
  NumberText,
  RecordFormPage,
  RuleBuilder,
  ruleProblemKey,
  ruleValueText,
  SectionCard,
  StatusBadge,
  SwitchField,
  TextField,
  emptyRuleDraft,
  useLiro,
  type DataTableColumn,
  type LiroFormat,
  type RuleCondition,
  type RuleDraft,
  type Tone,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import {
  BS_ACTIONS,
  BS_EDITED,
  BS_FAILED_HINT,
  BS_FIELDS,
  BS_OPERATORS,
  BS_PEOPLE,
  BS_ROUTES,
  BS_RULES,
  BS_RUN_VIEWS,
  BS_RUNS,
  BS_TEST_RUN,
  BS_TRIGGERS,
  BS_VIEWS,
  type BsRule,
  type BsRun,
  type BsRunResult,
} from './data-BS'
import { moduleTabs, TradeShell } from './screens-AU'

/*
 * Group BS's example screens (P5.78, automation rules): Kvadrat Gradnja d.o.o.'s rules on
 * 14 October 2026 at 09:40, seen by Milica Petrović (Settings → Automation).
 * - The rules (ListPage): name and the rule in words, what starts it, the last run with its
 *   result in words, the runs in the last 30 days, and a switch per rule (On / Off in words
 *   beside it); views All, On, Off, Last run failed.
 * - A rule (DetailPage): the rule in words, its figures, the rule as text (RuleBuilder,
 *   read-only), its runs; the last run's failure with its message and the next step; Turn off,
 *   Edit. Edit mode (the same page): the name and the RuleBuilder; "Test run" shows the
 *   application's answer on the latest records; Save shows the application's problems under
 *   their fields, or saves.
 * - A new rule (RecordFormPage) and the run log of every rule (ListPage, All runs / Failed).
 * The screen plays the application: it writes the rule in words (`bsSummary`) and checks it
 * (`bsProblems`); nothing here evaluates a rule.
 */

export { BS_ROUTES }

const AUTOMATION = [
  { key: 'rules', label: 'Rules', path: BS_ROUTES.rules },
  { key: 'log', label: 'Run log', path: BS_ROUTES.log },
]

const RESULT_TONES: Record<BsRunResult, Tone> = {
  Done: 'success',
  Failed: 'danger',
  'Not met': 'neutral',
}

function bsResult(result: BsRunResult) {
  return <StatusBadge label={result} tone={RESULT_TONES[result]} />
}

function bsStateBadge(on: boolean) {
  return <StatusBadge label={on ? 'On' : 'Off'} tone={on ? 'success' : 'neutral'} />
}

/** An instant of the examples (local, as written), isolated in its line. */
function BsTime({ value }: { value: string }) {
  const { format } = useLiro()
  return <span className="bidi-isolate tabular-nums">{format.dateTime(value)}</span>
}

/** A link through the application's router. */
function BsLink({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={href} className="bidi-content text-link underline">
      {children}
    </Link>
  )
}

/** The automation screens' shell: Settings → Automation, two tabs. */
function BsShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: string
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(AUTOMATION, tab)}
      crumbs={crumbs}
      {...(bottomBar === undefined ? {} : { bottomBar })}
    >
      {children}
    </TradeShell>
  )
}

/** The rules as the application keeps them (a rule turned off stays off on every screen). */
function useBsRules() {
  return useExampleState<BsRule[]>('BS.rules', () => BS_RULES)
}

// ── The application's words and checks ────────────────────────────────────────────────────────

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** The rule in words, as the application writes it. */
export function bsSummary(draft: RuleDraft, format: LiroFormat): string {
  const trigger = BS_TRIGGERS.find((each) => each.id === draft.trigger)
  const fields = draft.trigger === null ? [] : (BS_FIELDS[draft.trigger] ?? [])
  const condition = (item: RuleCondition) => {
    const field = fields.find((each) => each.id === item.field)
    const operator = BS_OPERATORS.find((each) => each.id === item.operator)
    if (field === undefined || operator === undefined) return '…'
    if (operator.noValue === true) return `${lower(field.label)} ${operator.label}`
    const value = ruleValueText(format, field.kind, item.value, field.options, field.currency)
    return `${lower(field.label)} ${operator.label} ${value === '—' ? '…' : value}`
  }
  const joined = (join: 'all' | 'any') => (join === 'all' ? ' and ' : ' or ')
  const conditions = draft.conditions.map((item) =>
    item.kind === 'condition'
      ? condition(item)
      : `(${item.items.map(condition).join(joined(item.join))})`,
  )
  const person = (id: string | null | undefined) =>
    BS_PEOPLE.find((each) => each.value === id)?.label ?? '…'
  const actions = draft.actions.map((action) => {
    const params = action.params
    if (action.type === 'notify') return `notify ${person(params.who)}`
    if (action.type === 'assign') return `assign it for review to ${person(params.who)}`
    if (action.type === 'task')
      return `create the task "${params.title ?? '…'}" for ${person(params.who)}`
    if (action.type === 'hold') return 'hold the payment'
    if (action.type === 'email') {
      const template = BS_ACTIONS.find((each) => each.id === 'email')?.params[0]?.options?.find(
        (each) => each.value === params.template,
      )?.label
      return `send "${template ?? '…'}" to the partner`
    }
    return '…'
  })
  const when = `When ${trigger === undefined ? '…' : lower(trigger.label)}`
  const ifPart = conditions.length === 0 ? '' : `, if ${conditions.join(joined(draft.join))}`
  const then = actions.length === 0 ? ', do nothing yet' : `, ${actions.join(', then ')}`
  return `${when}${ifPart}${then}.`
}

/** The application's checks of an edited rule, keyed as RuleBuilder shows them. */
export function bsProblems(draft: RuleDraft): Record<string, string> {
  const problems: Record<string, string> = {}
  if (draft.trigger === null) problems.trigger = 'Choose what starts the rule.'
  const fields = draft.trigger === null ? [] : (BS_FIELDS[draft.trigger] ?? [])
  const check = (item: RuleCondition) => {
    const field = fields.find((each) => each.id === item.field)
    const operator = BS_OPERATORS.find((each) => each.id === item.operator)
    if (field === undefined) problems[ruleProblemKey(item.id, 'field')] = 'Choose a field.'
    else if (operator === undefined)
      problems[ruleProblemKey(item.id, 'operator')] = 'Choose a test.'
    else if (operator.noValue !== true && item.value === null) {
      problems[ruleProblemKey(item.id, 'value')] =
        field.kind === 'choice' ? 'Choose a value.' : 'Enter a value.'
    }
  }
  for (const item of draft.conditions) {
    if (item.kind === 'condition') check(item)
    else item.items.forEach(check)
  }
  if (draft.actions.length === 0) problems.actions = 'Add at least one action.'
  for (const action of draft.actions) {
    const type = BS_ACTIONS.find((each) => each.id === action.type)
    if (type === undefined) {
      problems[ruleProblemKey(action.id, 'type')] = 'Choose an action.'
      continue
    }
    for (const param of type.params) {
      const value = action.params[param.id]
      if (param.required === true && (value === null || value === undefined)) {
        problems[ruleProblemKey(action.id, param.id)] =
          param.id === 'reason' ? 'Give the reason the payment is held.' : 'This is required.'
      }
    }
  }
  return problems
}

// ── The rules ─────────────────────────────────────────────────────────────────────────────────

function inBsView(rule: BsRule, view: string) {
  if (view === 'on') return rule.on
  if (view === 'off') return !rule.on
  if (view === 'failing') return rule.lastResult === 'Failed'
  return true
}

function RuleSummaryLine({ rule }: { rule: BsRule }) {
  const { format } = useLiro()
  return (
    <span className="bidi-content text-xs text-secondary">{bsSummary(rule.draft, format)}</span>
  )
}

export function BsRulesScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [rules, setRules] = useBsRules()
  const [view, setView] = useState('all')
  const rows = rules.filter((rule) => inBsView(rule, view))
  const toggle = (rule: BsRule, on: boolean) => {
    setRules((list) => list.map((each) => (each.id === rule.id ? { ...each, on } : each)))
    notice.success(`${rule.name} is ${on ? 'on' : 'off'}.`)
  }
  const columns: DataTableColumn<BsRule>[] = [
    {
      id: 'name',
      header: 'Rule',
      minWidth: 320,
      cell: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content font-medium">{row.name}</span>
          <RuleSummaryLine rule={row} />
        </span>
      ),
    },
    {
      id: 'trigger',
      header: 'When',
      minWidth: 200,
      cell: (row) => (
        <span className="bidi-content">
          {BS_TRIGGERS.find((each) => each.id === row.draft.trigger)?.label}
        </span>
      ),
    },
    {
      id: 'last',
      header: 'Last run',
      minWidth: 170,
      cell: (row) =>
        row.lastRun === null || row.lastResult === null ? (
          '—'
        ) : (
          <span className="flex flex-col items-start gap-1">
            <BsTime value={row.lastRun} />
            {bsResult(row.lastResult)}
          </span>
        ),
    },
    {
      id: 'runs',
      header: 'Runs, 30 days',
      align: 'end',
      numeric: true,
      minWidth: MIN_COLUMN_WIDTH,
      cell: (row) => <NumberText value={row.runs30} />,
    },
    {
      id: 'on',
      header: 'State',
      minWidth: 110,
      cell: (row) => (
        <span className="flex items-center gap-2">
          <SwitchField
            label={row.name}
            hideLabel
            checked={row.on}
            onChange={(on) => {
              toggle(row, on)
            }}
          />
          <span aria-hidden="true" className="bidi-isolate text-sm">
            {row.on ? 'On' : 'Off'}
          </span>
        </span>
      ),
    },
  ]
  return (
    <BsShell phone={phone} tab="rules" crumbs={[{ label: 'Settings' }, { label: 'Automation' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Automation rules"
        actions={
          <Button
            intent="create"
            label="New rule"
            onClick={() => {
              navigate(BS_ROUTES.create)
            }}
          />
        }
        views={BS_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: rules.filter((rule) => inBsView(rule, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Automation rules"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          count={rows.length}
          onRowClick={(row) => {
            navigate(BS_ROUTES.rule(row.id))
          }}
          rowActions={(row) => [
            {
              label: row.on ? 'Turn off' : 'Turn on',
              onSelect: () => {
                toggle(row, !row.on)
              },
            },
          ]}
          mobile={{
            title: (row) => row.name,
            subtitle: (row) => <RuleSummaryLine rule={row} />,
            badge: (row) => bsStateBadge(row.on),
            details: ['last', 'runs'],
          }}
        />
      </ListPage>
    </BsShell>
  )
}

// ── One rule ──────────────────────────────────────────────────────────────────────────────────

/** The record a run was about: a link where the examples have its page. */
function recordCell(row: BsRun) {
  return row.recordPath === undefined ? (
    <span className="bidi-content">{row.record}</span>
  ) : (
    <BsLink href={`#${row.recordPath}`}>{row.record}</BsLink>
  )
}

function runColumns(withRule: boolean): DataTableColumn<BsRun>[] {
  return [
    {
      id: 'time',
      header: 'Time',
      minWidth: 150,
      numeric: true,
      cell: (row) => <BsTime value={row.time} />,
    },
    ...(withRule
      ? [
          {
            id: 'rule',
            header: 'Rule',
            minWidth: 200,
            cell: (row: BsRun) => {
              const rule = BS_RULES.find((each) => each.id === row.rule)
              return <BsLink href={`#${BS_ROUTES.rule(row.rule)}`}>{rule?.name}</BsLink>
            },
          },
        ]
      : []),
    { id: 'record', header: 'Record', minWidth: 220, cell: recordCell },
    { id: 'result', header: 'Result', minWidth: 110, cell: (row) => bsResult(row.result) },
    {
      id: 'message',
      header: 'What happened',
      minWidth: 280,
      cell: (row) => <span className="bidi-content">{row.message}</span>,
    },
  ]
}

function RunTable({
  phone,
  runs,
  withRule,
}: {
  phone: boolean
  runs: readonly BsRun[]
  withRule: boolean
}) {
  return (
    <DataTable
      label="Runs"
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={runColumns(withRule)}
      rows={runs}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.record}
      mobile={{
        title: recordCell,
        subtitle: (row) => <BsTime value={row.time} />,
        badge: (row) => bsResult(row.result),
        details: withRule ? ['rule', 'message'] : ['message'],
      }}
    />
  )
}

type BsEditState = 'none' | 'edit' | 'problems' | 'tested'

export function BsRuleScreen({
  phone,
  id,
  start = 'none',
}: {
  phone: boolean
  id: string
  start?: BsEditState
}) {
  const { format } = useLiro()
  const [rules, setRules] = useBsRules()
  const rule = rules.find((each) => each.id === id)
  const editing = start !== 'none'
  const [mode, setMode] = useState<'view' | 'edit'>(editing ? 'edit' : 'view')
  const initialDraft = editing ? withReason(BS_EDITED, start === 'tested') : rule?.draft
  const [draft, setDraft] = useState<RuleDraft>(initialDraft ?? emptyRuleDraft())
  const [name, setName] = useState(rule?.name ?? '')
  const [problems, setProblems] = useState<Record<string, string>>(
    start === 'problems' ? bsProblems(BS_EDITED) : {},
  )
  const [tested, setTested] = useState(start === 'tested')
  if (rule === undefined) return null
  const runs = BS_RUNS.filter((run) => run.rule === rule.id)
  const failed =
    rule.lastResult === 'Failed' ? runs.find((run) => run.result === 'Failed') : undefined
  const dirty = editing || draft !== rule.draft || name !== rule.name
  const fields = draft.trigger === null ? [] : (BS_FIELDS[draft.trigger] ?? [])
  const toggle = () => {
    setRules((list) => list.map((each) => (each.id === rule.id ? { ...each, on: !rule.on } : each)))
    notice.success(`${rule.name} is ${rule.on ? 'off' : 'on'}.`)
  }
  const builderProps = {
    label: 'Rule',
    triggers: BS_TRIGGERS,
    fields,
    operators: BS_OPERATORS,
    actionTypes: BS_ACTIONS,
    layout: phone ? ('phone' as const) : ('desktop' as const),
  }
  const viewActions = (
    <ActionGroup
      actions={[
        {
          key: 'toggle',
          family: 'neutral',
          icon: Power,
          label: rule.on ? 'Turn off' : 'Turn on',
          onClick: toggle,
        },
        {
          key: 'edit',
          intent: 'edit',
          label: 'Edit',
          onClick: () => {
            setMode('edit')
          },
        },
      ]}
    />
  )
  return (
    <BsShell
      phone={phone}
      tab="rules"
      crumbs={[{ label: 'Automation', href: `#${BS_ROUTES.rules}` }, { label: rule.name }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={rule.name}
        back={{ href: `#${BS_ROUTES.rules}`, label: 'Automation rules' }}
        status={bsStateBadge(rule.on)}
        subtitle={rule.changed}
        keyFigures={[
          { label: 'Runs in the last 30 days', value: <NumberText value={rule.runs30} /> },
          { label: 'Failed', value: <NumberText value={rule.failed30} /> },
          {
            label: 'Last run',
            value: rule.lastRun === null ? '—' : <BsTime value={rule.lastRun} />,
          },
        ]}
        actions={viewActions}
        mode={mode}
        dirty={dirty}
        editActions={
          <ActionGroup
            actions={[
              {
                key: 'cancel',
                intent: 'cancel',
                label: 'Cancel',
                onClick: () => {
                  setDraft(rule.draft)
                  setName(rule.name)
                  setProblems({})
                  setTested(false)
                  setMode('view')
                },
              },
              {
                key: 'test',
                family: 'neutral',
                icon: FlaskConical,
                label: 'Test run',
                onClick: () => {
                  setTested(true)
                },
              },
              {
                key: 'save',
                intent: 'save',
                label: 'Save',
                onClick: () => {
                  const found = bsProblems(draft)
                  setProblems(found)
                  if (Object.keys(found).length > 0) {
                    notice.error('The rule has problems. They are shown under their fields.')
                    return
                  }
                  setRules((list) =>
                    list.map((each) => (each.id === rule.id ? { ...each, draft, name } : each)),
                  )
                  setMode('view')
                  setTested(false)
                  notice.success(`${name} is saved.`)
                },
              },
            ]}
          />
        }
        sections={[
          {
            id: 'rule',
            label: 'Rule',
            content: (
              <RuleBuilder
                {...builderProps}
                value={rule.draft}
                summary={bsSummary(rule.draft, format)}
                fields={rule.draft.trigger === null ? [] : (BS_FIELDS[rule.draft.trigger] ?? [])}
                readOnly
              />
            ),
            edit: (
              <div className="flex flex-col gap-4">
                <TextField
                  label="Name"
                  required
                  value={name}
                  onChange={setName}
                  className="max-w-md"
                />
                <RuleBuilder
                  {...builderProps}
                  value={draft}
                  onChange={(next) => {
                    setDraft(next)
                    setTested(false)
                  }}
                  summary={bsSummary(draft, format)}
                  problems={problems}
                />
              </div>
            ),
          },
          ...(mode === 'edit' && tested
            ? [
                {
                  id: 'test',
                  label: 'Test run',
                  description:
                    'The rule as edited, run on the two latest invoices. Nothing was done.',
                  editable: false,
                  content: <BsTestRun />,
                },
              ]
            : []),
          {
            id: 'runs',
            label: 'Runs',
            flush: true,
            editable: false,
            content: (
              <div className="flex flex-col">
                {failed !== undefined && (
                  <Alert tone="danger" title="The last run failed" className="m-4">
                    {`${failed.message} ${BS_FAILED_HINT}`}
                  </Alert>
                )}
                <RunTable phone={phone} runs={runs} withRule={false} />
              </div>
            ),
          },
        ]}
      />
    </BsShell>
  )
}

/** The edited rule; for the test run its hold reason is given. */
function withReason(draft: RuleDraft, reason: boolean): RuleDraft {
  if (!reason) return draft
  return {
    ...draft,
    actions: draft.actions.map((action) =>
      action.type === 'hold'
        ? { ...action, params: { reason: 'Large invoice on Liman 4: the director approves.' } }
        : action,
    ),
  }
}

/** The application's answer to "Test run". */
function BsTestRun() {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {BS_TEST_RUN.map((each) => (
        <li key={each.id} className="flex flex-col items-start gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="bidi-content text-sm font-medium">{each.record}</span>
            <StatusBadge
              label={each.result}
              tone={each.result === 'Would run' ? 'info' : 'neutral'}
            />
          </span>
          <span className="bidi-content text-sm text-secondary">{each.detail}</span>
        </li>
      ))}
    </ul>
  )
}

// ── A new rule ────────────────────────────────────────────────────────────────────────────────

export function BsNewRuleScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [draft, setDraft] = useState<RuleDraft>(emptyRuleDraft())
  const [name, setName] = useState('')
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [nameProblem, setNameProblem] = useState<string | undefined>(undefined)
  const fields = draft.trigger === null ? [] : (BS_FIELDS[draft.trigger] ?? [])
  return (
    <BsShell
      phone={phone}
      tab="rules"
      crumbs={[{ label: 'Automation', href: `#${BS_ROUTES.rules}` }, { label: 'New rule' }]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="New rule"
        back={{ href: `#${BS_ROUTES.rules}`, label: 'Automation rules' }}
        dirty={name !== '' || draft.trigger !== null}
        actions={
          <ActionGroup
            actions={[
              {
                key: 'cancel',
                intent: 'cancel',
                label: 'Cancel',
                onClick: () => {
                  navigate(BS_ROUTES.rules)
                },
              },
              {
                key: 'save',
                intent: 'save',
                label: 'Save rule',
                onClick: () => {
                  const found = bsProblems(draft)
                  setProblems(found)
                  setNameProblem(name.trim() === '' ? 'Give the rule a name.' : undefined)
                  if (Object.keys(found).length === 0 && name.trim() !== '') {
                    notice.success(`${name} is saved and on.`)
                    navigate(BS_ROUTES.rules)
                  }
                },
              },
            ]}
          />
        }
      >
        <FormSection title="Name" columns={1}>
          <TextField
            label="Name"
            required
            value={name}
            onChange={setName}
            {...(nameProblem === undefined ? {} : { error: nameProblem })}
          />
        </FormSection>
        <SectionCard title="Rule" headingLevel={2}>
          <RuleBuilder
            label="Rule"
            value={draft}
            onChange={setDraft}
            triggers={BS_TRIGGERS}
            fields={fields}
            operators={BS_OPERATORS}
            actionTypes={BS_ACTIONS}
            summary={bsSummary(draft, format)}
            problems={problems}
            layout={phone ? 'phone' : 'desktop'}
          />
        </SectionCard>
      </RecordFormPage>
    </BsShell>
  )
}

// ── The run log ───────────────────────────────────────────────────────────────────────────────

export function BsRunLogScreen({ phone, start = 'all' }: { phone: boolean; start?: string }) {
  const [view, setView] = useState(start)
  const rows = BS_RUNS.filter((run) => view !== 'failed' || run.result === 'Failed')
  return (
    <BsShell phone={phone} tab="log" crumbs={[{ label: 'Settings' }, { label: 'Automation' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Run log"
        views={BS_RUN_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: BS_RUNS.filter((run) => each.id !== 'failed' || run.result === 'Failed').length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <RunTable phone={phone} runs={rows} withRule />
      </ListPage>
    </BsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BS_ROUTES: ExampleRoute[] = [
  { path: BS_ROUTES.rules, render: (phone) => <BsRulesScreen phone={phone} /> },
  { path: BS_ROUTES.log, render: (phone) => <BsRunLogScreen phone={phone} /> },
  { path: BS_ROUTES.logFailed, render: (phone) => <BsRunLogScreen phone={phone} start="failed" /> },
  { path: BS_ROUTES.create, render: (phone) => <BsNewRuleScreen phone={phone} /> },
  {
    path: BS_ROUTES.largeEdit,
    render: (phone) => <BsRuleScreen phone={phone} id="r1" start="edit" />,
  },
  {
    path: BS_ROUTES.largeProblems,
    render: (phone) => <BsRuleScreen phone={phone} id="r1" start="problems" />,
  },
  {
    path: BS_ROUTES.largeTested,
    render: (phone) => <BsRuleScreen phone={phone} id="r1" start="tested" />,
  },
  ...BS_RULES.map((rule) => ({
    path: BS_ROUTES.rule(rule.id),
    render: (phone: boolean) => <BsRuleScreen phone={phone} id={rule.id} />,
  })),
]

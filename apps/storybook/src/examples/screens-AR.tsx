import { ListTree } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  DataTable,
  DateText,
  KeyFigures,
  MoneyText,
  PageHeader,
  SectionCard,
  StatusBadge,
  Tabs,
  toneFor,
  Toaster,
  TreeTable,
  UnavailableAction,
  notice,
  useLiro,
  type DataTableColumn,
  type TreeNode,
  type TreeTableColumn,
} from '@veljaos/ui'
import { BarChart } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  AR_ROUTES,
  AR_TODAY,
  BUDGET,
  BUDGET_LINES,
  BUDGET_TONES,
  BY_CENTRE,
  BY_PROJECT,
  budgetLine,
  CENTRE_CHART,
  entriesOf,
  PROJECT_CHART,
  PROJECTS_TOTAL,
  type BudgetEntry,
  type BudgetLine,
  type BudgetState,
  type BudgetView,
} from './data-AR'

/*
 * Group AR's example screens (P5.58, budget and cost centres): Kvadrat Gradnja d.o.o.'s budget
 * 2026 against the books for January–September, on 14 October 2026.
 * - The budget (one page, two tabs): the key figures (plan, actual, variance, used), then by cost
 *   centre or by project — a bar chart of plan against actual (`@veljaos/ui/charts`, the plan grey,
 *   the actual blue) and the lines as a TreeTable: plan, actual, the variance with its sign, the
 *   share used and the state in the application's words ("Over budget", "Within budget", "Under
 *   budget"; never colour alone). A chosen line (TreeTable's single selection, neutral) opens its
 *   entries with "Show entries".
 * - A line's entries (the drill-down): its figures and the latest entries from the books — date,
 *   document (a link where the examples have its page: the asset card of a depreciation, group AP),
 *   partner, account, text, amount — with the application's count of all of them.
 * Every figure is the application's (data-AR.ts); the screens choose and link.
 */

export { AR_ROUTES }

function BudgetShell({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={AR_TODAY}>
      <Shell phone={phone} crumbs={crumbs}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

function stateBadge(state: BudgetState) {
  return <StatusBadge label={state} tone={toneFor(state, BUDGET_TONES)} />
}

/** A variance with its sign ("+9.380.000,00 RSD"). */
function Variance({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi className="tabular-nums">{format.money(value, 'RSD', { sign: 'always' })}</bdi>
}

function Used({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi className="tabular-nums">{format.percent(value, { decimals: 1 })}</bdi>
}

function toNodes(lines: readonly BudgetLine[]): TreeNode<BudgetLine>[] {
  return lines.map((each) => ({
    id: each.id,
    label: each.name,
    code: each.code,
    data: each,
    ...(each.children === undefined ? {} : { children: toNodes(each.children) }),
  }))
}

const CENTRE_NODES = toNodes(BY_CENTRE)
const PROJECT_NODES = toNodes(BY_PROJECT)

const COLUMNS: TreeTableColumn<BudgetLine>[] = [
  { id: 'plan', header: 'Plan', numeric: true, cell: (node) => money(node.data?.plan ?? null) },
  {
    id: 'actual',
    header: 'Actual',
    numeric: true,
    cell: (node) => money(node.data?.actual ?? null),
  },
  {
    id: 'variance',
    header: 'Variance',
    numeric: true,
    cell: (node) => (node.data === undefined ? null : <Variance value={node.data.variance} />),
  },
  {
    id: 'used',
    header: 'Used',
    numeric: true,
    cell: (node) => (node.data === undefined ? null : <Used value={node.data.used} />),
  },
  {
    id: 'state',
    header: 'State',
    minWidth: 140,
    cell: (node) => (node.data === undefined ? null : stateBadge(node.data.state)),
  },
]

/** One tab's content: the chart, then the lines with "Show entries" for the chosen one. */
function BudgetTree({
  phone,
  view,
  chosen,
  onChoose,
}: {
  phone: boolean
  view: BudgetView
  chosen: string | undefined
  onChoose: (id: string | undefined) => void
}) {
  const navigate = useContext(Navigate)
  const centres = view === 'centres'
  const line = chosen === undefined ? undefined : budgetLine(chosen)
  const chart = centres ? CENTRE_CHART : PROJECT_CHART
  return (
    <div className="flex flex-col gap-4">
      <BarChart
        title={
          centres
            ? 'Plan and actual by cost centre'
            : 'Residential building Liman 4: plan and actual by cost type'
        }
        description={`RSD, ${BUDGET.period}`}
        categories={chart.categories}
        series={[
          { key: 'actual', label: 'Actual' },
          { key: 'plan', label: 'Plan', role: 'comparison' },
        ]}
        values={chart.values}
        currency="RSD"
        orientation="horizontal"
        layout={phone ? 'phone' : 'desktop'}
      />
      <SectionCard
        title={centres ? 'By cost centre' : 'By project and cost type'}
        headingLevel={2}
        description="Choose a line to see its entries."
        flush
        actions={
          line === undefined ? (
            <UnavailableAction
              family="neutral"
              icon={ListTree}
              label="Show entries"
              reason="Choose a line first."
            />
          ) : (
            <Button
              family="neutral"
              icon={ListTree}
              label={`Show entries of ${line.code}`}
              onClick={() => {
                navigate(AR_ROUTES.entries(line.id))
              }}
            />
          )
        }
      >
        <TreeTable
          label={centres ? 'Budget by cost centre' : 'Budget by project'}
          treeHeader={centres ? 'Cost centre' : 'Project and cost type'}
          nodes={centres ? CENTRE_NODES : PROJECT_NODES}
          columns={COLUMNS}
          defaultExpanded={centres ? ['c300'] : ['p310']}
          selectionMode="single"
          selected={chosen === undefined ? [] : [chosen]}
          onSelectedChange={(ids) => {
            onChoose(ids[0])
          }}
          mainColumn="variance"
          totalsLabel="Total"
          totals={
            centres
              ? {
                  plan: money(BUDGET.plan),
                  actual: money(BUDGET.actual),
                  variance: <Variance value={BUDGET.variance} />,
                  used: <Used value={BUDGET.used} />,
                }
              : {
                  plan: money(PROJECTS_TOTAL.plan),
                  actual: money(PROJECTS_TOTAL.actual),
                  variance: <Variance value={PROJECTS_TOTAL.variance} />,
                  used: <Used value={PROJECTS_TOTAL.used} />,
                }
          }
          layout={phone ? 'phone' : 'desktop'}
        />
      </SectionCard>
    </div>
  )
}

export function BudgetPage({
  phone,
  view: startView,
  chosen: startChosen,
}: {
  phone: boolean
  view?: BudgetView
  chosen?: string
}) {
  const [view, setView] = useState<BudgetView>(startView ?? 'centres')
  const [chosen, setChosen] = useState<string | undefined>(startChosen)
  return (
    <BudgetShell phone={phone} crumbs={[{ label: 'Accounting' }, { label: BUDGET.name }]}>
      <Frame phone={phone}>
        <PageHeader
          title={BUDGET.name}
          subtitle={`Plan against actual, ${BUDGET.period} · ${BUDGET.version}`}
          actions={
            <Button
              intent="export"
              label="Export"
              onClick={() => {
                notice.success(`${BUDGET.name} is being exported.`)
              }}
            />
          }
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'plan', label: `Plan, ${BUDGET.period}`, value: money(BUDGET.plan) },
            { key: 'actual', label: 'Actual', value: money(BUDGET.actual) },
            {
              key: 'variance',
              label: 'Over budget by',
              value: <Variance value={BUDGET.variance} />,
              tone: 'danger',
            },
            { key: 'used', label: 'Used', value: <Used value={BUDGET.used} /> },
          ]}
        />
        <Tabs
          label="Budget by"
          value={view}
          onValueChange={(next) => {
            setView(next === 'projects' ? 'projects' : 'centres')
            setChosen(undefined)
          }}
          items={[
            {
              value: 'centres',
              label: 'Cost centres',
              content: (
                <BudgetTree phone={phone} view="centres" chosen={chosen} onChoose={setChosen} />
              ),
            },
            {
              value: 'projects',
              label: 'Projects',
              content: (
                <BudgetTree phone={phone} view="projects" chosen={chosen} onChoose={setChosen} />
              ),
            },
          ]}
        />
      </Frame>
    </BudgetShell>
  )
}

// ── A line's entries ──────────────────────────────────────────────────────────────────────────

function DocumentCell({ entry }: { entry: BudgetEntry }) {
  const { linkComponent: Link } = useLiro()
  if (entry.href === undefined) return <span className="bidi-content">{entry.document}</span>
  return (
    <Link href={entry.href} className="bidi-isolate text-link no-underline hover:underline">
      {entry.document}
    </Link>
  )
}

const ENTRY_COLUMNS: DataTableColumn<BudgetEntry>[] = [
  { id: 'date', header: 'Date', numeric: true, cell: (entry) => <DateText value={entry.date} /> },
  {
    id: 'document',
    header: 'Document',
    minWidth: 220,
    cell: (entry) => (
      <span className="flex flex-col gap-0.5">
        <DocumentCell entry={entry} />
        <span className="bidi-content text-xs text-secondary">{entry.partner}</span>
      </span>
    ),
  },
  { id: 'account', header: 'Account', cell: (entry) => <bdi>{entry.account}</bdi> },
  {
    id: 'text',
    header: 'Text',
    minWidth: 200,
    cell: (entry) => <span className="bidi-content">{entry.text}</span>,
  },
  { id: 'amount', header: 'Amount', numeric: true, cell: (entry) => money(entry.amount) },
]

export function BudgetEntries({ phone, id }: { phone: boolean; id: string }) {
  const { format } = useLiro()
  const line = budgetLine(id)
  if (line === undefined) return null
  const project = id.startsWith('p')
  const entries = entriesOf(id)
  const parent = BUDGET_LINES.find((each) => each.children?.some((child) => child.id === id))
  const name = parent === undefined ? line.name : `${parent.name} · ${line.name}`
  return (
    <BudgetShell
      phone={phone}
      crumbs={[
        { label: BUDGET.name, href: `#${project ? AR_ROUTES.projects : AR_ROUTES.budget}` },
        { label: `${line.code} ${line.name}` },
      ]}
    >
      <Frame phone={phone}>
        <PageHeader
          title={name}
          back={{
            href: `#${project ? AR_ROUTES.projects : AR_ROUTES.budget}`,
            label: BUDGET.name,
          }}
          status={stateBadge(line.state)}
          subtitle={<bdi>{`${line.code} · ${BUDGET.period}`}</bdi>}
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'plan', label: 'Plan', value: money(line.plan) },
            { key: 'actual', label: 'Actual', value: money(line.actual) },
            { key: 'variance', label: 'Variance', value: <Variance value={line.variance} /> },
            { key: 'used', label: 'Used', value: <Used value={line.used} /> },
          ]}
        />
        <SectionCard
          title="Entries"
          headingLevel={2}
          description="The latest entries from the books; the export has all of them."
          flush
        >
          <DataTable
            label={`Entries of ${line.code} ${line.name}`}
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={ENTRY_COLUMNS}
            rows={entries}
            getRowId={(entry) => entry.id}
            getRowLabel={(entry) => entry.document}
            totalsLabel={`Actual, ${format.number(line.entryCount)} entries`}
            totals={{ amount: money(line.actual) }}
            rowLimitMessage={`The latest ${format.number(String(entries.length))} of ${format.number(line.entryCount)} entries.`}
            mobile={{
              title: (entry) => <DocumentCell entry={entry} />,
              subtitle: (entry) => <span className="bidi-content">{entry.partner}</span>,
              details: ['date', 'text', 'amount'],
            }}
          />
        </SectionCard>
      </Frame>
    </BudgetShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AR_ROUTES: ExampleRoute[] = [
  { path: AR_ROUTES.budget, render: (phone) => <BudgetPage phone={phone} /> },
  {
    path: AR_ROUTES.projects,
    render: (phone) => <BudgetPage phone={phone} view="projects" />,
  },
  {
    path: AR_ROUTES.projectsChosen,
    render: (phone) => <BudgetPage phone={phone} view="projects" chosen="p310-5120" />,
  },
  ...BUDGET_LINES.map((each) => ({
    path: AR_ROUTES.entries(each.id),
    render: (phone: boolean) => <BudgetEntries phone={phone} id={each.id} />,
  })),
]

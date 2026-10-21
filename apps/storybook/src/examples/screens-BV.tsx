import {
  Check,
  Copy,
  LayoutGrid,
  Pencil,
  Save,
  SlidersHorizontal,
  Star,
  Trash2,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  addCard,
  Button,
  DashboardGrid,
  DashboardPage,
  DataTable,
  DateText,
  DeleteConfirmDialog,
  DropdownMenu,
  DueDate,
  EmptyState,
  FileNameDialog,
  KeyValueList,
  LookupDialog,
  MoneyText,
  notice,
  ProgressBar,
  SectionCard,
  SelectField,
  StatCard,
  useLiro,
  type DashboardCard,
  type DashboardLayoutItem,
  type DataTableColumn,
  type MenuEntry,
} from '@veljaos/ui'
import { BarChart } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { COMPANIES, Navigate, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { BUDGET, CENTRE_CHART, PROJECT_CHART } from './data-AR'
import { PROJECT } from './data-AA'
import { CASH_NOW } from './data-AM'
import {
  OVERDUE_30,
  OVERDUE_30_TOTAL,
  RECEIVABLES,
  RECEIVABLES_OPEN,
  REVENUE,
  type Receivable,
} from './data-X'
import {
  BV_ROUTES,
  CASH_LIMIT,
  CATALOGUE,
  LAYOUTS,
  layoutNameProblem,
  SIZES,
  type CatalogueCard,
  type SavedLayout,
} from './data-BV'
import { AnalyticsShell } from './screens-BU'

/*
 * Group BV's example screens (P5.81, the customizable dashboard): Nenad Kovačević, the director
 * of Kvadrat Gradnja d.o.o., on his overview on 14 October 2026 at 09:40.
 * - View: DashboardPage with the layout's cards in DashboardGrid — open receivables, overdue more
 *   than 30 days, the main cash desk, the budget used (StatCards), revenue by month and plan
 *   against actual by cost centre (the charts), Residential building Liman 4's progress; the
 *   layout chosen in the header ("My overview", the default, or "Month end") with its menu (Save
 *   as…, Rename…, Set as default, Delete…) and "Customize".
 * - Customizing: the same cards in DashboardGrid's editing mode — moved by dragging, by the
 *   keyboard or by their menus, resized among the application's sizes, removed — with "Add card"
 *   (LookupDialog over the application's catalogue), Cancel (everything back) and Done (the
 *   application saves the layout).
 * - Phones: one column, every card full width, customizing by the menus.
 * The layouts are the application's data (data-BV.ts), kept above the screens; every figure is
 * one the other groups show (X, AM, AR, AA). New: DashboardGrid (docs/notes/P5.77-reports.md).
 */

export { BV_ROUTES }

const KVADRAT = COMPANIES.find((company) => company.id === 'kvadrat')

/** The director, signed in at his company. */
const DIRECTOR: ExampleAccount = {
  name: 'Nenad Kovačević',
  email: 'nenad.kovacevic@example.com',
  companies: KVADRAT === undefined ? [] : [KVADRAT],
  links: [{ label: 'Overview', path: BV_ROUTES.overview }],
}

const sizeLabel = (id: string) => SIZES.find((size) => size.id === id)?.label ?? id

// ── The cards' content ────────────────────────────────────────────────────────────────────────

const OVERDUE_COLUMNS: DataTableColumn<Receivable>[] = [
  {
    id: 'invoice',
    header: 'Invoice',
    cell: (row) => (
      <span dir="ltr" className="text-start">
        {row.id}
      </span>
    ),
  },
  { id: 'customer', header: 'Customer', minWidth: 200, cell: (row) => row.customer },
  { id: 'due', header: 'Due', numeric: true, cell: (row) => <DueDate value={row.due} /> },
  {
    id: 'open',
    header: 'Amount due',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.open} currency="RSD" />,
  },
]

/** What a card of the catalogue shows, drawn from the other groups' figures. */
function CardContent({ id, phone }: { id: string; phone: boolean }): ReactNode {
  const { format } = useLiro()
  const layout = phone ? 'phone' : 'desktop'
  const invoices = (count: number) =>
    `${format.number(String(count))} ${count === 1 ? 'invoice' : 'invoices'}`
  switch (id) {
    case 'receivables':
      return (
        <StatCard
          label="Open receivables"
          value={<MoneyText value={RECEIVABLES_OPEN} currency="RSD" />}
          comparison={invoices(RECEIVABLES.length)}
        />
      )
    case 'overdue':
      return (
        <StatCard
          label="Overdue more than 30 days"
          value={<MoneyText value={OVERDUE_30_TOTAL} currency="RSD" />}
          comparison={invoices(OVERDUE_30.length)}
        />
      )
    case 'cash':
      return (
        <StatCard
          label="Main cash desk"
          value={<MoneyText value={CASH_NOW.balance} currency="RSD" />}
          comparison={
            CASH_NOW.excess === null
              ? `Limit ${format.money(CASH_LIMIT, 'RSD')}`
              : `${format.money(CASH_NOW.excess, 'RSD')} above its limit`
          }
        />
      )
    case 'budget-used':
      return (
        <StatCard
          label={`Budget used, ${BUDGET.period}`}
          value={<bdi>{format.percent(BUDGET.used)}</bdi>}
          comparison={`Over plan by ${format.money(BUDGET.variance, 'RSD')}`}
        />
      )
    case 'revenue-quarter':
      return (
        <StatCard
          label="Revenue, third quarter"
          value={<MoneyText value={REVENUE.total} currency="RSD" />}
          change={{
            text: format.percent(REVENUE.change, { sign: 'always' }),
            direction: 'up',
            sentiment: 'good',
          }}
          comparison="vs third quarter 2025"
        />
      )
    case 'revenue':
      return (
        <BarChart
          title="Revenue by month"
          description="Thousands of RSD, without VAT"
          categories={REVENUE.categories}
          series={[
            { key: 'this', label: '2026' },
            { key: 'last', label: '2025', role: 'comparison' },
          ]}
          values={REVENUE.values}
          height={220}
          layout={layout}
        />
      )
    case 'budget':
      return (
        <BarChart
          title="Plan and actual by cost centre"
          description={`RSD, ${BUDGET.period}`}
          categories={CENTRE_CHART.categories}
          series={[
            { key: 'actual', label: 'Actual' },
            { key: 'plan', label: 'Plan', role: 'comparison' },
          ]}
          values={CENTRE_CHART.values}
          currency="RSD"
          orientation="horizontal"
          layout={layout}
        />
      )
    case 'liman-costs':
      return (
        <BarChart
          title="Liman 4 by cost type"
          description={`RSD, ${BUDGET.period}`}
          categories={PROJECT_CHART.categories}
          series={[
            { key: 'actual', label: 'Actual' },
            { key: 'plan', label: 'Plan', role: 'comparison' },
          ]}
          values={PROJECT_CHART.values}
          currency="RSD"
          orientation="horizontal"
          layout={layout}
        />
      )
    case 'liman':
      return (
        <SectionCard title={PROJECT.name} headingLevel={3} description={PROJECT.place}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="bidi-content text-sm text-secondary">
                {`${format.percent(PROJECT.done)} done, by budget`}
              </span>
              <ProgressBar label="Done" value={Number(PROJECT.done)} />
            </div>
            <KeyValueList
              columns={phone ? 1 : 2}
              items={[
                {
                  label: 'Planned',
                  numeric: true,
                  value: <MoneyText value={PROJECT.planned} currency="RSD" />,
                },
                {
                  label: 'Spent',
                  numeric: true,
                  value: <MoneyText value={PROJECT.spent} currency="RSD" />,
                },
                {
                  label: 'Handover',
                  numeric: true,
                  value: <DateText value={PROJECT.handover} />,
                },
                { label: 'Site manager', value: PROJECT.manager },
              ]}
            />
          </div>
        </SectionCard>
      )
    case 'overdue-list':
      return (
        <SectionCard title="Invoices overdue more than 30 days" headingLevel={3} flush>
          <DataTable
            label="Invoices overdue more than 30 days"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={OVERDUE_COLUMNS}
            rows={OVERDUE_30}
            getRowId={(row) => row.id}
            getRowLabel={(row) => `${row.id} ${row.customer}`}
            mobile={{ subtitle: (row) => row.customer, details: ['due', 'open'] }}
          />
        </SectionCard>
      )
    default:
      return null
  }
}

/** The dashboard's cards from a layout. */
function cardsOf(layout: readonly DashboardLayoutItem[], phone: boolean): DashboardCard[] {
  return layout.flatMap((item) => {
    const entry = CATALOGUE.find((each) => each.id === item.id)
    if (entry === undefined) return []
    return [
      {
        id: entry.id,
        title: entry.name,
        size: item.size,
        ...(entry.sizes === undefined ? {} : { sizes: entry.sizes }),
        content: <CardContent id={entry.id} phone={phone} />,
      },
    ]
  })
}

// ── The catalogue ─────────────────────────────────────────────────────────────────────────────

const CATALOGUE_COLUMNS: DataTableColumn<CatalogueCard>[] = [
  {
    id: 'name',
    header: 'Card',
    minWidth: 260,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content font-medium">{row.name}</span>
        <span className="bidi-content text-xs text-secondary">{row.description}</span>
      </span>
    ),
  },
  { id: 'kind', header: 'Kind', cell: (row) => row.kind },
  { id: 'size', header: 'Added as', cell: (row) => sizeLabel(row.size) },
]

// ── The overview ──────────────────────────────────────────────────────────────────────────────

type Dialog = 'save-as' | 'rename' | 'delete' | null

export function OverviewScreen({
  phone,
  start = {},
}: {
  phone: boolean
  start?: { layout?: string; editing?: boolean; adding?: boolean; dialog?: Dialog }
}) {
  const navigate = useContext(Navigate)
  const [layouts, setLayouts] = useExampleState<readonly SavedLayout[]>('BV.layouts', () => LAYOUTS)
  const fallback = layouts.find((each) => each.isDefault) ?? layouts[0]
  const [currentId, setCurrentId] = useState(start.layout ?? fallback?.id ?? '')
  const current = layouts.find((each) => each.id === currentId) ?? fallback
  const [editing, setEditing] = useState(start.editing === true)
  const [draft, setDraft] = useState<DashboardLayoutItem[]>(() => [...(current?.cards ?? [])])
  const [adding, setAdding] = useState(start.adding === true)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<Dialog>(start.dialog ?? null)
  if (current === undefined) return null
  const shown = editing ? draft : current.cards
  const cards = cardsOf(shown, phone)

  const choose = (id: string) => {
    const next = layouts.find((each) => each.id === id)
    if (next === undefined) return
    setCurrentId(id)
    setDraft([...next.cards])
  }
  const customize = () => {
    setDraft([...current.cards])
    setEditing(true)
  }
  const done = () => {
    setLayouts((list) =>
      list.map((each) => (each.id === current.id ? { ...each, cards: draft } : each)),
    )
    setEditing(false)
    notice.success(`${current.name} is saved.`)
  }
  const cancel = () => {
    setDraft([...current.cards])
    setEditing(false)
  }
  const available = CATALOGUE.filter(
    (entry) =>
      !draft.some((item) => item.id === entry.id) &&
      `${entry.name} ${entry.description} ${entry.kind}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )

  const layoutMenu: MenuEntry[] = [
    {
      label: 'Save as…',
      icon: Copy,
      onSelect: () => {
        setDialog('save-as')
      },
    },
    {
      label: 'Rename…',
      icon: Pencil,
      onSelect: () => {
        setDialog('rename')
      },
    },
    {
      label: 'Set as default',
      icon: Star,
      disabled: current.isDefault,
      onSelect: () => {
        setLayouts((list) => list.map((each) => ({ ...each, isDefault: each.id === current.id })))
        notice.success(`${current.name} opens first from now on.`)
      },
    },
    { type: 'separator' },
    {
      label: 'Delete…',
      icon: Trash2,
      destructive: true,
      disabled: layouts.length < 2,
      onSelect: () => {
        setDialog('delete')
      },
    },
  ]

  const actions = editing ? (
    <>
      <Button
        intent="create"
        label="Add card"
        onClick={() => {
          setQuery('')
          setAdding(true)
        }}
      />
      <Button intent="cancel" label="Cancel" onClick={cancel} />
      <Button family="primary" icon={Check} emphasis="primary" label="Done" onClick={done} />
    </>
  ) : (
    <>
      <SelectField
        label="Layout"
        hideLabel
        className="min-w-48"
        options={layouts.map((each) => ({
          value: each.id,
          label: each.isDefault ? `${each.name} · Default` : each.name,
        }))}
        value={current.id}
        onChange={choose}
      />
      <DropdownMenu
        align="end"
        entries={layoutMenu}
        trigger={<Button family="neutral" icon={LayoutGrid} label="Layout" />}
      />
      <Button family="neutral" icon={SlidersHorizontal} label="Customize" onClick={customize} />
    </>
  )

  return (
    <AnalyticsShell
      phone={phone}
      tab="overview"
      crumbs={[{ label: 'Analytics' }, { label: 'Overview' }]}
      account={DIRECTOR}
    >
      <DashboardPage
        layout={phone ? 'phone' : 'desktop'}
        title="Overview"
        subtitle={
          editing
            ? `Customizing ${current.name}: drag the cards or use their menus. Done saves the layout.`
            : current.isDefault
              ? `${current.name}, the layout that opens first`
              : current.name
        }
        actions={<div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      >
        <DashboardGrid
          className="col-span-full"
          label={current.name}
          cards={cards}
          sizes={SIZES}
          editing={editing}
          layout={phone ? 'phone' : 'desktop'}
          onLayoutChange={(next) => {
            setDraft(next)
          }}
          empty={
            <EmptyState
              title="This layout has no cards"
              description="Add the figures and charts you want to see first."
              action={{
                label: 'Add card',
                onClick: () => {
                  if (!editing) customize()
                  setAdding(true)
                },
              }}
            />
          }
        />
      </DashboardPage>
      <LookupDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add a card"
        description={`The cards not yet on ${current.name}. A card is added at the end; move it after.`}
        onSearch={setQuery}
        searchPlaceholder="Name or kind"
        columns={CATALOGUE_COLUMNS}
        rows={available}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        onChoose={(entry) => {
          setDraft((list) => addCard(list, { id: entry.id, size: entry.size }))
          notice.success(`${entry.name} is added at the end.`)
        }}
        hasNext={false}
        onNext={() => undefined}
        count={available.length}
        layout={phone ? 'phone' : 'desktop'}
        mobile={{
          subtitle: (row) => `${row.kind} · ${sizeLabel(row.size)}`,
          details: [],
        }}
      />
      <FileNameDialog
        key={`save-as-${String(dialog === 'save-as')}`}
        open={dialog === 'save-as'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Save layout as"
        label="Layout name"
        defaultValue={`${current.name} (copy)`}
        confirmLabel="Save"
        confirmIcon={Save}
        onSubmit={(name) => {
          const problem = layoutNameProblem(name, layouts)
          if (problem !== undefined) return problem
          const id = `layout-${String(layouts.length + 1)}`
          setLayouts((list) => [
            ...list,
            { id, name: name.trim(), isDefault: false, cards: [...current.cards] },
          ])
          setCurrentId(id)
          setDraft([...current.cards])
          notice.success(`${name.trim()} is saved.`)
          return undefined
        }}
      />
      <FileNameDialog
        key={`rename-${String(dialog === 'rename')}`}
        open={dialog === 'rename'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Rename layout"
        subject={current.name}
        label="Layout name"
        defaultValue={current.name}
        confirmLabel="Rename"
        confirmIcon={Pencil}
        onSubmit={(name) => {
          const problem = layoutNameProblem(name, layouts, current.id)
          if (problem !== undefined) return problem
          setLayouts((list) =>
            list.map((each) => (each.id === current.id ? { ...each, name: name.trim() } : each)),
          )
          return undefined
        }}
      />
      <DeleteConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title="Delete layout"
        subject={current.name}
        message={
          current.isDefault
            ? 'Only the layout is deleted, never the figures. The next layout opens first from now on.'
            : 'Only the layout is deleted, never the figures.'
        }
        confirmLabel="Delete layout"
        onConfirm={() => {
          const rest = layouts.filter((each) => each.id !== current.id)
          const next = rest[0]
          if (next === undefined) return
          setLayouts(
            rest.map((each) => ({
              ...each,
              isDefault: current.isDefault ? each.id === next.id : each.isDefault,
            })),
          )
          setCurrentId(next.id)
          setDraft([...next.cards])
          notice.success(`${current.name} is deleted.`)
          navigate(BV_ROUTES.overview)
        }}
      />
    </AnalyticsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BV_ROUTES: ExampleRoute[] = [
  { path: BV_ROUTES.overview, render: (phone) => <OverviewScreen phone={phone} /> },
  {
    path: BV_ROUTES.monthEnd,
    render: (phone) => <OverviewScreen phone={phone} start={{ layout: 'month-end' }} />,
  },
  {
    path: BV_ROUTES.editing,
    render: (phone) => <OverviewScreen phone={phone} start={{ editing: true }} />,
  },
  {
    path: BV_ROUTES.adding,
    render: (phone) => <OverviewScreen phone={phone} start={{ editing: true, adding: true }} />,
  },
  {
    path: BV_ROUTES.saveAs,
    render: (phone) => <OverviewScreen phone={phone} start={{ dialog: 'save-as' }} />,
  },
  {
    path: BV_ROUTES.deleting,
    render: (phone) => (
      <OverviewScreen phone={phone} start={{ layout: 'month-end', dialog: 'delete' }} />
    ),
  },
]

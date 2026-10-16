import { BookCheck } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  ChangeableValue,
  ChangeText,
  correctionColumns,
  DataTable,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DetailPage,
  DocumentPage,
  DocumentReferences,
  KeyFigures,
  MoneyText,
  notice,
  NumberText,
  PageHeader,
  RelatedDocuments,
  StatusBadge,
  Toaster,
  toneFor,
  TreeTable,
  useLiro,
  type DataTableColumn,
  type LifecycleStep,
  type ModuleTab,
  type Tone,
  type TreeNode,
  type TreeTableColumn,
} from '@veljaos/ui'
import { Gantt, type GanttChange } from '../../../../packages/ui/src/gantt'
import type { ExampleRoute } from './example-app'
import { Shell, type ExampleAccount } from './example-shell'
import { Frame, Tenant } from './screens-G'
import { applyPlanChange } from './data-AA'
import {
  AZ_NOW,
  AZ_ROUTES,
  AZ_TODAY,
  BAKERY_COMPANY,
  BAKERY_OWNER,
  BOMS,
  MATERIAL_TOTALS,
  MATERIALS,
  OUTPUT,
  PLAN_DEPENDENCIES,
  PLAN_FIGURES,
  PLAN_LABEL,
  PLAN_TASKS,
  ROUTING,
  WORK_ORDER,
  WORK_ORDER_STATES,
  type Bom,
  type Component,
  type MaterialLine,
  type OutputLine,
  type WorkOrderState,
} from './data-AZ'
import { BA_ROUTES } from './data-BA'

/*
 * Group AZ's example screens (P5.52, production): Pekara Zlatni klas's back office on 14.10.2026
 * at 09:40, as Jovana Marković sees it. A bill of materials is a DetailPage around TreeTable —
 * the components with their quantities, units and costs for a batch, the rye sourdough starter a
 * semi-finished good whose own bill opens under it (and on a page of its own); the work order is a
 * DocumentPage whose material lines are the Original / Change / New pattern (planned, difference,
 * used) with each difference's value, and whose output lists the good loaves and the scrap with
 * its reasons; the production plan is Gantt (`@veljaos/ui/gantt`): the work orders on the bread
 * line, the pastry line and the cakes' oven, the one "now" marker. Every figure comes from
 * data-AZ.ts.
 */

export { AZ_ROUTES }

/** The production's and the shop's states and their tones (the bakery's map). */
export const BAKERY_TONES: Record<string, Tone> = {
  Active: 'success',
  Planned: 'neutral',
  Released: 'info',
  'In production': 'info',
  Completed: 'success',
  Posted: 'success',
  Draft: 'neutral',
  Good: 'success',
  Scrap: 'warning',
}

export function bakeryBadge(state: string) {
  return <StatusBadge label={state} tone={toneFor(state, BAKERY_TONES)} />
}

/** Jovana Marković at Pekara Zlatni klas: the back office of the bakery. */
export const BAKERY_ACCOUNT: ExampleAccount = {
  name: BAKERY_OWNER.name,
  email: BAKERY_OWNER.email,
  companies: [BAKERY_COMPANY],
  links: [
    { label: 'Bill of materials SAS-0012', path: AZ_ROUTES.bom },
    { label: 'Work order RN-2026-0158', path: AZ_ROUTES.workOrder },
    { label: 'Production plan', path: AZ_ROUTES.plan },
    { label: 'Retail price calculation KLK-2026-0047', path: BA_ROUTES.calculation },
  ],
}

/** The bakery's back-office tabs: production, then the shop's prices. */
export function bakeryTabs(current: 'boms' | 'orders' | 'plan' | 'prices'): ModuleTab[] {
  return [
    { key: 'boms', label: 'Bills of materials', href: `#${AZ_ROUTES.bom}` },
    { key: 'orders', label: 'Work orders', href: `#${AZ_ROUTES.workOrder}` },
    { key: 'plan', label: 'Production plan', href: `#${AZ_ROUTES.plan}` },
    { key: 'prices', label: 'Shop prices', href: `#${BA_ROUTES.calculation}` },
  ].map((tab) => ({ ...tab, current: tab.key === current }))
}

/** A code inside text, left to right. */
function Code({ children }: { children: string }) {
  return <span dir="ltr">{children}</span>
}

function useQuantity() {
  const { format } = useLiro()
  return (value: string, unit: string) => `${format.number(value)} ${unit}`
}

// ── Bills of materials ────────────────────────────────────────────────────────────────────────

function BomScreen({ phone, bom }: { phone: boolean; bom: Bom }) {
  const { format, linkComponent: Link } = useLiro()
  const quantity = useQuantity()
  const starter = BOMS.find((each) => each.number === 'SAS-0004')
  const columns: TreeTableColumn<Component>[] = [
    {
      id: 'quantity',
      header: 'Quantity',
      numeric: true,
      cell: (node: TreeNode<Component>) =>
        node.data === undefined ? null : quantity(node.data.quantity, node.data.unit),
    },
    { id: 'kind', header: 'Kind', cell: (node: TreeNode<Component>) => node.data?.kind },
    {
      id: 'cost',
      header: 'Cost',
      numeric: true,
      cell: (node: TreeNode<Component>) => (
        <MoneyText value={node.data?.cost ?? null} currency="RSD" />
      ),
    },
  ]
  return (
    <Tenant today={AZ_TODAY}>
      <Shell
        phone={phone}
        account={BAKERY_ACCOUNT}
        company={BAKERY_COMPANY.id}
        crumbs={[{ label: 'Bills of materials', href: `#${AZ_ROUTES.bom}` }, { label: bom.number }]}
        tabs={bakeryTabs('boms')}
      >
        <DetailPage
          layout={phone ? 'phone' : 'desktop'}
          title={bom.product}
          status={bakeryBadge('Active')}
          subtitle={`Bill of materials ${bom.number} · version ${bom.version}, valid from ${format.date(bom.validFrom)}`}
          {...(bom.usedIn === undefined
            ? {}
            : { back: { href: `#${AZ_ROUTES.bom}`, label: 'Raženi hleb, 400 g' } })}
          keyFigures={[
            {
              key: 'batch',
              label: 'Batch',
              value: quantity(bom.batch.quantity, bom.batch.unit),
            },
            {
              key: 'cost',
              label: 'Cost of a batch',
              value: <MoneyText value={bom.cost} currency="RSD" />,
            },
            {
              key: 'per',
              label: `Cost per ${bom.per}`,
              value: <MoneyText value={bom.costPerUnit} currency="RSD" />,
            },
          ]}
          sections={[
            {
              id: 'components',
              label: 'Components',
              description:
                bom.usedIn === undefined && starter !== undefined ? (
                  <>
                    For a batch of {quantity(bom.batch.quantity, bom.batch.unit)}. The starter is
                    made from its own bill,{' '}
                    <Link
                      href={`#${AZ_ROUTES.starter}`}
                      className="text-link no-underline hover:underline"
                    >
                      <Code>{starter.number}</Code>
                    </Link>
                    .
                  </>
                ) : (
                  `For a batch of ${quantity(bom.batch.quantity, bom.batch.unit)}.`
                ),
              flush: true,
              content: (
                <TreeTable<Component>
                  label={`Components of ${bom.number}`}
                  treeHeader="Component"
                  nodes={bom.nodes}
                  defaultExpanded={['s1']}
                  columns={columns}
                  totals={{ cost: <MoneyText value={bom.cost} currency="RSD" /> }}
                  totalsLabel="Cost of a batch"
                  mainColumn="quantity"
                  layout={phone ? 'phone' : 'desktop'}
                />
              ),
            },
            ...(bom.usedIn === undefined
              ? [
                  {
                    id: 'steps',
                    label: 'Steps',
                    flush: true,
                    content: (
                      <DataTable
                        label={`Steps of ${bom.product}`}
                        inCard
                        layout={phone ? 'cards' : 'table'}
                        columns={[
                          { id: 'step', header: 'Step', cell: (row) => row.step },
                          { id: 'place', header: 'Where', cell: (row) => row.place },
                          {
                            id: 'minutes',
                            header: 'Minutes',
                            align: 'end',
                            numeric: true,
                            cell: (row) => <NumberText value={row.minutes} />,
                          },
                        ]}
                        rows={ROUTING}
                        getRowId={(row) => row.id}
                        getRowLabel={(row) => row.step}
                        mobile={{ subtitle: (row) => row.place, details: ['minutes'] }}
                      />
                    ),
                  },
                  {
                    id: 'orders',
                    label: 'Work orders',
                    content: (
                      <RelatedDocuments
                        label={`Work orders of ${bom.number}`}
                        items={[
                          {
                            key: 'rn-0158',
                            type: 'Work order',
                            number: WORK_ORDER.number,
                            href: `#${AZ_ROUTES.workOrder}`,
                            status: bakeryBadge('Completed'),
                          },
                          {
                            key: 'rn-0165',
                            type: 'Work order',
                            number: 'RN-2026-0165',
                            href: `#${AZ_ROUTES.plan}`,
                            status: bakeryBadge('Planned'),
                          },
                        ]}
                      />
                    ),
                  },
                ]
              : [
                  {
                    id: 'used',
                    label: 'Used in',
                    content: (
                      <RelatedDocuments
                        label={`Bills that use ${bom.number}`}
                        items={bom.usedIn.map((each) => ({
                          key: each.number,
                          type: `Bill of materials · ${each.product}`,
                          number: each.number,
                          href: `#${AZ_ROUTES.bom}`,
                          status: bakeryBadge('Active'),
                        }))}
                      />
                    ),
                  },
                ]),
          ]}
        />
      </Shell>
    </Tenant>
  )
}

// ── Work order ────────────────────────────────────────────────────────────────────────────────

const ORDER_STEPS: LifecycleStep[] = WORK_ORDER_STATES.map((state) => ({
  key: state,
  label: state,
}))

function ItemWithNote({ item, note }: { item: string; note?: string | undefined }) {
  return (
    <span className="flex flex-col">
      <span className="bidi-content">{item}</span>
      {note === undefined ? null : (
        <span className="bidi-content text-xs text-secondary">{note}</span>
      )}
    </span>
  )
}

const MATERIAL_COLUMNS: DataTableColumn<MaterialLine>[] = [
  {
    id: 'item',
    header: 'Material',
    minWidth: DESCRIPTION_MIN_WIDTH,
    cell: (line) => <ItemWithNote item={line.item} note={line.note} />,
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  ...correctionColumns<MaterialLine>({
    id: 'quantity',
    original: (line) => line.planned,
    change: (line) => line.difference,
    next: (line) => line.used,
    headers: { original: 'Planned', change: 'Difference', next: 'Used' },
  }),
  {
    id: 'differenceValue',
    header: 'Difference value',
    align: 'end',
    numeric: true,
    cell: (line) => <ChangeText value={line.differenceValue} currency="RSD" />,
  },
]

const OUTPUT_COLUMNS: DataTableColumn<OutputLine>[] = [
  { id: 'kind', header: 'Output', cell: (row) => bakeryBadge(row.kind) },
  { id: 'text', header: 'Item or reason', cell: (row) => row.text },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (row) => <NumberText value={row.quantity} />,
  },
  { id: 'unit', header: 'Unit', cell: (row) => row.unit },
  { id: 'note', header: 'Where it went', minWidth: DESCRIPTION_MIN_WIDTH, cell: (row) => row.note },
]

function WorkOrderScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const quantity = useQuantity()
  const [state, setState] = useState<WorkOrderState>(WORK_ORDER.state)
  const post =
    state === 'Completed' ? (
      <Button
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post to stock"
        onClick={() => {
          setState('Posted')
          notice.success(
            `${WORK_ORDER.number} posted: ${quantity(WORK_ORDER.good, WORK_ORDER.unit)} into stock, the material out of it.`,
          )
        }}
      />
    ) : null
  const at = (time: string) => format.time(`${WORK_ORDER.date}T${time}:00+02:00`)
  return (
    <Tenant today={AZ_TODAY}>
      <Shell
        phone={phone}
        account={BAKERY_ACCOUNT}
        company={BAKERY_COMPANY.id}
        crumbs={[
          { label: 'Work orders', href: `#${AZ_ROUTES.workOrder}` },
          { label: WORK_ORDER.number },
        ]}
        tabs={bakeryTabs('orders')}
        {...(phone && post !== null ? { bottomBar: post } : {})}
      >
        <DocumentPage
          layout={phone ? 'phone' : 'desktop'}
          title={WORK_ORDER.number}
          back={{ href: `#${AZ_ROUTES.plan}`, label: 'Production plan' }}
          status={bakeryBadge(state)}
          lifecycle={{
            steps: ORDER_STEPS,
            current: WORK_ORDER_STATES.indexOf(state),
            label: 'Work order status',
          }}
          actions={
            <>
              <Button intent="print" emphasis="secondary" label="Print" />
              {phone ? null : post}
            </>
          }
          details={
            <>
              <ChangeableValue label="Product" value={WORK_ORDER.product} />
              <ChangeableValue label="Line" value={WORK_ORDER.line} />
              <ChangeableValue label="Shift" value={WORK_ORDER.shift} />
              <ChangeableValue label="Date" value={<DateText value={WORK_ORDER.date} />} />
              <ChangeableValue
                label="Baked"
                value={
                  <span dir="ltr">
                    {at(WORK_ORDER.started)}–{at(WORK_ORDER.finished)}
                  </span>
                }
              />
            </>
          }
          references={
            <DocumentReferences
              groups={[
                {
                  key: 'bom',
                  label: 'Bill of materials',
                  items: [
                    {
                      key: 'bom',
                      number: WORK_ORDER.bom,
                      href: `#${AZ_ROUTES.bom}`,
                      status: { label: 'Version 3' },
                    },
                  ],
                },
                {
                  key: 'starter',
                  label: 'Starter',
                  kind: 'Work order',
                  items: [
                    {
                      key: 'rn-0157',
                      number: 'RN-2026-0157',
                      href: `#${AZ_ROUTES.plan}`,
                      status: { label: 'Posted', tone: 'success' },
                    },
                  ],
                },
              ]}
            />
          }
          keyFigures={[
            {
              key: 'planned',
              label: 'Planned',
              value: quantity(WORK_ORDER.planned, WORK_ORDER.unit),
            },
            { key: 'good', label: 'Good', value: quantity(WORK_ORDER.good, WORK_ORDER.unit) },
            {
              key: 'scrap',
              label: 'Scrap',
              value: `${quantity(WORK_ORDER.scrap, WORK_ORDER.unit)} · ${format.percent(WORK_ORDER.scrapShare)}`,
              tone: 'warning',
            },
            {
              key: 'cost',
              label: 'Cost per loaf',
              value: <MoneyText value={WORK_ORDER.actualCostPerPiece} currency="RSD" />,
            },
          ]}
          linesTitle="Material"
          lines={
            <DataTable
              label={`Material of ${WORK_ORDER.number}`}
              inCard
              layout={phone ? 'cards' : 'table'}
              columns={MATERIAL_COLUMNS}
              rows={MATERIALS}
              getRowId={(line) => line.id}
              getRowLabel={(line) => line.item}
              mobile={{
                title: (line) => line.item,
                subtitle: (line) => line.note ?? line.unit,
                details: [
                  'quantity.original',
                  'quantity.change',
                  'quantity.new',
                  'differenceValue',
                ],
              }}
            />
          }
          totals={{
            label: 'Material value',
            rows: [
              {
                key: 'planned',
                label: 'Planned material',
                value: MATERIAL_TOTALS.planned,
                currency: 'RSD',
              },
              {
                key: 'difference',
                label: 'Difference',
                value: MATERIAL_TOTALS.difference,
                currency: 'RSD',
              },
            ],
            total: {
              key: 'used',
              label: 'Used material',
              value: MATERIAL_TOTALS.used,
              currency: 'RSD',
            },
          }}
          sections={[
            {
              key: 'output',
              title: 'Output',
              content: (
                <DataTable
                  label={`Output of ${WORK_ORDER.number}`}
                  layout={phone ? 'cards' : 'table'}
                  columns={OUTPUT_COLUMNS}
                  rows={OUTPUT}
                  getRowId={(row) => row.id}
                  getRowLabel={(row) => `${row.kind}: ${row.text}`}
                  mobile={{
                    title: (row) => row.text,
                    subtitle: (row) => row.note,
                    badge: (row) => bakeryBadge(row.kind),
                    details: ['quantity', 'unit'],
                  }}
                />
              ),
            },
          ]}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── Production plan ───────────────────────────────────────────────────────────────────────────

function ProductionPlan({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [model, setModel] = useState({ tasks: PLAN_TASKS, dependencies: PLAN_DEPENDENCIES })
  const label = (id: string) => model.tasks.find((each) => each.id === id)?.label ?? id
  const report = (change: GanttChange) => {
    setModel((current) => applyPlanChange(current, change))
    if (change.type === 'dates') {
      notice.success(
        `${label(change.id)} now runs ${format.date(change.start)} – ${format.date(change.end)}`,
      )
    }
  }
  return (
    <Tenant today={AZ_TODAY}>
      <Shell
        phone={phone}
        account={BAKERY_ACCOUNT}
        company={BAKERY_COMPANY.id}
        crumbs={[{ label: 'Production' }, { label: 'Production plan' }]}
        tabs={bakeryTabs('plan')}
      >
        <Frame phone={phone} wide>
          <PageHeader title="Production plan" subtitle={PLAN_LABEL} />
          <KeyFigures
            layout={phone ? 'phone' : 'desktop'}
            items={[
              { key: 'orders', label: 'Work orders', value: format.number(PLAN_FIGURES.orders) },
              { key: 'done', label: 'Done', value: format.number(PLAN_FIGURES.done) },
              {
                key: 'waiting',
                label: 'Waiting for material',
                value: format.number(PLAN_FIGURES.waiting),
                tone: 'warning',
              },
            ]}
          />
          <Gantt
            label={PLAN_LABEL}
            tasks={model.tasks}
            dependencies={model.dependencies}
            mode="edit"
            now={AZ_NOW}
            onChange={report}
            defaultScale="days"
            screen={phone ? 'phone' : 'desktop'}
          />
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AZ_ROUTES: ExampleRoute[] = [
  ...BOMS.map((bom) => ({
    path: `/production/boms/${bom.number}`,
    render: (phone: boolean) => <BomScreen phone={phone} bom={bom} />,
  })),
  { path: AZ_ROUTES.workOrder, render: (phone) => <WorkOrderScreen phone={phone} /> },
  { path: AZ_ROUTES.plan, render: (phone) => <ProductionPlan phone={phone} /> },
]

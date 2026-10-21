import { useState, type ReactNode } from 'react'
import {
  DataTable,
  DateText,
  Drawer,
  MoneyText,
  NumberText,
  PageHeader,
  SelectField,
  Toaster,
  notice,
  useLiro,
  type DataTableColumn,
} from '@veljaos/ui'
import {
  EMPTY_PIVOT_LAYOUT,
  Pivot,
  type PivotCellRef,
  type PivotLayout,
  type PivotResult,
  type PivotRow,
} from '../../../../packages/ui/src/pivot'
import type { ExampleRoute } from './example-app'
import { Shell, type ExampleAccount } from './example-shell'
import { BAKERY_COMPANY, BAKERY_OWNER } from './data-AZ'
import {
  BR_ROUTES,
  BR_TODAY,
  COST_DOCUMENTS,
  COST_FIELDS,
  COST_OPENED,
  COST_SITES,
  COST_SUPPLIERS,
  COST_VIEWS,
  membersOf,
  resultFor,
  SALES_CUSTOMERS,
  SALES_FIELDS,
  SALES_OPENED,
  SALES_PRODUCTS,
  SALES_RECORDS,
  SALES_VIEWS,
  viewOf,
  type AnalysisView,
  type CostDocument,
  type SalesRecord,
} from './data-BR'
import { Frame, Tenant } from './screens-G'

/*
 * Group BR's example screens (P5.77, pivot analysis) on 14 October 2026 at 09:40:
 * - Kvadrat Gradnja d.o.o.'s cost analysis (Accounting → Cost analysis, Milica Petrović): sites and
 *   their cost accounts down, July–September across, the amount and the number of supplier
 *   invoices under each month, the totals; the saved view "By supplier". A figure opens its
 *   invoices in an end Drawer (DataTable: date, number, supplier, text, amount; the latest ten of
 *   the application's count).
 * - Pekara Zlatni klas's sales analysis (Sales → Sales analysis, Jovana Marković): categories and
 *   products down, months across with revenue and pieces; the saved view "By product and shop"
 *   (its own shop and the shops it supplies). A figure opens its sale lines.
 * The layout is the user's (the Pivot's chooser, or a saved view); the figures are the
 * application's for that layout (data-BR.ts) — this illustrative application has them for the
 * saved views only, so any other layout shows "No figures for this layout". Export is reported in
 * a toast; the application makes the file.
 */

export { BR_ROUTES }

const EXPORT_FORMATS = [
  { id: 'xlsx', label: 'Excel workbook (.xlsx)' },
  { id: 'csv', label: 'Comma-separated values (.csv)' },
]

/** Jovana Marković runs the bakery. */
const BAKERY_ACCOUNT: ExampleAccount = {
  name: BAKERY_OWNER.name,
  email: BAKERY_OWNER.email,
  companies: [BAKERY_COMPANY],
  links: [{ label: 'Sales analysis', path: BR_ROUTES.sales }],
}

/** A signed-in screen of the analyses on 14 October 2026, with its toasts. */
function AnalysisShell({
  phone,
  crumbs,
  bakery = false,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  bakery?: boolean
  children: ReactNode
}) {
  return (
    <Tenant today={BR_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        {...(bakery ? { account: BAKERY_ACCOUNT, company: BAKERY_COMPANY.id } : {})}
      >
        <Frame phone={phone} wide>
          {children}
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** A row of a result by its key, wherever it stands; the grand total too. */
function rowOf(result: PivotResult, key: string): PivotRow | undefined {
  const find = (rows: readonly PivotRow[]): PivotRow | undefined => {
    for (const row of rows) {
      if (row.key === key) return row
      const below = row.children === undefined ? undefined : find(row.children)
      if (below !== undefined) return below
    }
    return undefined
  }
  return result.total?.key === key ? result.total : find(result.rows)
}

/** The records of a figure: those of its row's and column's members and of the kept filters. */
function recordsOf<Item extends object>(
  items: readonly Item[],
  cell: PivotCellRef,
  layout: PivotLayout,
): Item[] {
  const members = membersOf(cell.rowKey, cell.columnKey)
  return items.filter((item) => {
    const record = item as Record<string, unknown>
    return (
      Object.entries(members).every(([field, value]) => record[field] === value) &&
      layout.filters.every(
        (filter) =>
          filter.values.length === 0 || filter.values.includes(String(record[filter.field])),
      )
    )
  })
}

/** How many records the drawer shows: the latest ten. */
const SHOWN = 10

/** The saved views as a select in the pivot's toolbar; "Custom layout" when none matches. */
function ViewSelect({
  views,
  layout,
  onChoose,
}: {
  views: readonly AnalysisView[]
  layout: PivotLayout
  onChoose: (view: AnalysisView) => void
}) {
  return (
    <SelectField
      label="Saved view"
      hideLabel
      className="w-56"
      placeholder="Custom layout"
      options={views.map((view) => ({ value: view.id, label: view.label }))}
      value={viewOf(views, layout)}
      onChange={(id) => {
        const view = views.find((each) => each.id === id)
        if (view !== undefined) onChoose(view)
      }}
    />
  )
}

/** A saved view's layout. */
function layoutOf(views: readonly AnalysisView[], id: string): PivotLayout {
  return views.find((each) => each.id === id)?.layout ?? EMPTY_PIVOT_LAYOUT
}

/** The figure a drawer is about, for its subject: the row's and the column's labels. */
function cellSubject(cell: PivotCellRef): string {
  return [...cell.rowPath, ...cell.columnPath].join(' · ')
}

// ── Kvadrat Gradnja d.o.o.: cost analysis ────────────────────────────────────────────────────

const COST_COLUMNS: DataTableColumn<CostDocument>[] = [
  { id: 'date', header: 'Date', cell: (row) => <DateText value={row.date} /> },
  {
    id: 'number',
    header: 'Invoice',
    cell: (row) => (
      <span dir="ltr" className="font-medium">
        {row.number}
      </span>
    ),
  },
  {
    id: 'supplier',
    header: 'Supplier',
    cell: (row) => (
      <span className="bidi-content">
        {COST_SUPPLIERS.find((each) => each.id === row.supplier)?.label}
      </span>
    ),
  },
  {
    id: 'site',
    header: 'Site',
    cell: (row) => (
      <span className="bidi-content">{COST_SITES.find((each) => each.id === row.site)?.label}</span>
    ),
  },
  { id: 'text', header: 'Text', cell: (row) => <span className="bidi-content">{row.text}</span> },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.amount} currency="RSD" />,
  },
]

function CostDocuments({
  cell,
  layout,
  result,
  phone,
  onClose,
}: {
  cell: PivotCellRef | null
  layout: PivotLayout
  result: PivotResult
  phone: boolean
  onClose: () => void
}) {
  const { format } = useLiro()
  const records = cell === null ? [] : recordsOf(COST_DOCUMENTS, cell, layout)
  // The application's count of all of them: the figure "Documents" of the same row and month.
  const count =
    cell === null
      ? undefined
      : rowOf(result, cell.rowKey)?.cells[cell.columnKey.replace('value=amount', 'value=documents')]
  return (
    <Drawer
      side="end"
      open={cell !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Supplier invoices"
      {...(cell === null ? {} : { subject: cellSubject(cell) })}
      description={
        count === undefined || count === null
          ? `The latest ${String(Math.min(SHOWN, records.length))}.`
          : `The latest ${String(Math.min(SHOWN, records.length))} of ${format.number(count)} invoices.`
      }
    >
      <DataTable
        label="Supplier invoices"
        layout={phone ? 'cards' : 'table'}
        columns={COST_COLUMNS}
        rows={records.slice(0, SHOWN)}
        getRowId={(row) => row.number}
        getRowLabel={(row) => row.number}
        mobile={{
          title: (row) => row.number,
          subtitle: (row) => (
            <span className="bidi-content">
              {COST_SUPPLIERS.find((each) => each.id === row.supplier)?.label}
            </span>
          ),
          details: ['date', 'text', 'amount'],
        }}
      />
    </Drawer>
  )
}

function CostAnalysisScreen({
  phone,
  view = 'sites',
  opened = false,
}: {
  phone: boolean
  view?: string
  opened?: boolean
}) {
  const [layout, setLayout] = useState<PivotLayout>(layoutOf(COST_VIEWS, view))
  const result = resultFor(COST_VIEWS, layout)
  const [cell, setCell] = useState<PivotCellRef | null>(
    opened
      ? {
          ...COST_OPENED,
          value: rowOf(result, COST_OPENED.rowKey)?.cells[COST_OPENED.columnKey] ?? '',
        }
      : null,
  )
  return (
    <AnalysisShell phone={phone} crumbs={[{ label: 'Accounting' }, { label: 'Cost analysis' }]}>
      <PageHeader
        title="Cost analysis"
        subtitle="Supplier invoices booked to the sites, July–September 2026 · Illustrative figures for the saved views"
      />
      <Pivot
        label="Costs by site and month"
        fields={COST_FIELDS}
        value={layout}
        onChange={setLayout}
        result={result}
        onDrillDown={setCell}
        exportAction={{
          formats: EXPORT_FORMATS,
          onExport: (format) => {
            const name = EXPORT_FORMATS.find((each) => each.id === format)?.label ?? format
            notice.success(`Cost analysis is being exported as ${name}.`)
          },
        }}
        actions={
          <ViewSelect
            views={COST_VIEWS}
            layout={layout}
            onChoose={(each) => {
              setLayout(each.layout)
            }}
          />
        }
      />
      <CostDocuments
        cell={cell}
        layout={layout}
        result={result}
        phone={phone}
        onClose={() => {
          setCell(null)
        }}
      />
    </AnalysisShell>
  )
}

// ── Pekara Zlatni klas: sales analysis ───────────────────────────────────────────────────────

const SALES_COLUMNS: DataTableColumn<SalesRecord>[] = [
  { id: 'date', header: 'Date', cell: (row) => <DateText value={row.date} /> },
  {
    id: 'number',
    header: 'Document',
    cell: (row) => <span className="bidi-content font-medium">{row.number}</span>,
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: (row) => (
      <span className="bidi-content">
        {SALES_CUSTOMERS.find((each) => each.id === row.customer)?.label}
      </span>
    ),
  },
  {
    id: 'product',
    header: 'Product',
    cell: (row) => (
      <span className="bidi-content">
        {SALES_PRODUCTS.find((each) => each.id === row.product)?.label}
      </span>
    ),
  },
  {
    id: 'quantity',
    header: 'Pieces',
    align: 'end',
    numeric: true,
    cell: (row) => <NumberText value={row.quantity} />,
  },
  {
    id: 'amount',
    header: 'Revenue',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.amount} currency="RSD" />,
  },
]

function SalesLines({
  cell,
  layout,
  phone,
  onClose,
}: {
  cell: PivotCellRef | null
  layout: PivotLayout
  phone: boolean
  onClose: () => void
}) {
  const records = cell === null ? [] : recordsOf(SALES_RECORDS, cell, layout)
  return (
    <Drawer
      side="end"
      open={cell !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Sale lines"
      {...(cell === null ? {} : { subject: cellSubject(cell) })}
      description={`The latest ${String(Math.min(SHOWN, records.length))} of ${String(records.length)} lines.`}
    >
      <DataTable
        label="Sale lines"
        layout={phone ? 'cards' : 'table'}
        columns={SALES_COLUMNS}
        rows={records.slice(0, SHOWN)}
        getRowId={(row) => `${row.number}-${row.product}`}
        getRowLabel={(row) => row.number}
        mobile={{
          title: (row) => row.number,
          subtitle: (row) => (
            <span className="bidi-content">
              {SALES_CUSTOMERS.find((each) => each.id === row.customer)?.label}
            </span>
          ),
          details: ['date', 'product', 'quantity', 'amount'],
        }}
      />
    </Drawer>
  )
}

function SalesAnalysisScreen({
  phone,
  view = 'months',
  opened = false,
  fieldsOpen,
}: {
  phone: boolean
  view?: string
  opened?: boolean
  fieldsOpen?: boolean
}) {
  const [layout, setLayout] = useState<PivotLayout>(layoutOf(SALES_VIEWS, view))
  const result = resultFor(SALES_VIEWS, layout)
  const [cell, setCell] = useState<PivotCellRef | null>(
    opened
      ? {
          ...SALES_OPENED,
          value: rowOf(result, SALES_OPENED.rowKey)?.cells[SALES_OPENED.columnKey] ?? '',
        }
      : null,
  )
  return (
    <AnalysisShell phone={phone} bakery crumbs={[{ label: 'Sales' }, { label: 'Sales analysis' }]}>
      <PageHeader
        title="Sales analysis"
        subtitle="The shop and the wholesale customers, July–September 2026 · Illustrative figures for the saved views"
      />
      <Pivot
        label="Sales by product"
        fields={SALES_FIELDS}
        value={layout}
        onChange={setLayout}
        result={result}
        onDrillDown={setCell}
        {...(fieldsOpen === undefined ? {} : { defaultFieldsOpen: fieldsOpen })}
        exportAction={{
          formats: EXPORT_FORMATS,
          onExport: (format) => {
            const name = EXPORT_FORMATS.find((each) => each.id === format)?.label ?? format
            notice.success(`Sales analysis is being exported as ${name}.`)
          },
        }}
        actions={
          <ViewSelect
            views={SALES_VIEWS}
            layout={layout}
            onChoose={(each) => {
              setLayout(each.layout)
            }}
          />
        }
      />
      <SalesLines
        cell={cell}
        layout={layout}
        phone={phone}
        onClose={() => {
          setCell(null)
        }}
      />
    </AnalysisShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BR_ROUTES: ExampleRoute[] = [
  { path: BR_ROUTES.costs, render: (phone) => <CostAnalysisScreen phone={phone} /> },
  {
    path: BR_ROUTES.costsBySupplier,
    render: (phone) => <CostAnalysisScreen phone={phone} view="suppliers" />,
  },
  {
    path: BR_ROUTES.costsDocuments,
    render: (phone) => <CostAnalysisScreen phone={phone} opened />,
  },
  { path: BR_ROUTES.sales, render: (phone) => <SalesAnalysisScreen phone={phone} /> },
  {
    path: BR_ROUTES.salesByShop,
    render: (phone) => <SalesAnalysisScreen phone={phone} view="shops" />,
  },
  {
    path: BR_ROUTES.salesDocuments,
    render: (phone) => <SalesAnalysisScreen phone={phone} opened />,
  },
  {
    path: BR_ROUTES.salesFields,
    render: (phone) => <SalesAnalysisScreen phone={phone} fieldsOpen />,
  },
]

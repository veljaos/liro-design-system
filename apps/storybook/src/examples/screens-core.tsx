import {
  BookOpen,
  BookmarkPlus,
  Building,
  ChartColumn,
  FileSpreadsheet,
  CheckCheck,
  CircleX,
  Landmark,
  Package,
  Receipt,
  Send,
  ShoppingCart,
  Users,
  SquareKanban,
  Wallet,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  ActivityList,
  AuthShell,
  BulkActionBar,
  Button,
  ColumnChooser,
  DashboardPage,
  DataTable,
  DateField,
  DateRangeText,
  DateText,
  DetailPage,
  DocumentPage,
  DueDate,
  EmailFirstForm,
  EmptyState,
  FilterBar,
  filterNotifications,
  FormGrid,
  KeyValueList,
  Launchpad,
  ListPage,
  MoneyField,
  MoneyText,
  NumberText,
  notice,
  NotificationsPage,
  QuickPreview,
  ReasonConfirmDialog,
  RelatedDocuments,
  SectionCard,
  SelectField,
  StatusBadge,
  TextField,
  Toaster,
  useLiro,
  WorklistPage,
  type ChooserColumn,
  type DataTableColumn,
  type DataTableFilters,
  type DetailSection,
  type FilterDefinition,
  type LaunchpadModule,
  type LifecycleStep,
  type SidePanel,
  type TotalsRow,
  type WorklistItem,
} from '@veljaos/ui'
import { BarChart, LineChart } from '../../../../packages/ui/src/charts'
import { percentText } from '../../../../packages/ui/src/components/story-frames'
import {
  APPROVAL_DETAILS,
  APPROVALS,
  CASH,
  EMPLOYEE,
  INVOICES,
  LARGEST_OPEN,
  LINES,
  REJECT_REASONS,
  REVENUE,
  TOTALS,
  type ApprovalLine,
  type ExampleApproval,
  type ExampleInvoice,
  type ExampleLine,
} from './examples-story-data'
import {
  BRAND,
  COMPANIES,
  HR_TABS,
  Navigate,
  NOTIFICATION_TYPES,
  Notifications,
  ROUTES,
  SALES_TABS,
  Shell,
  statusBadge,
} from './example-shell'
import { signInProviders } from './data-C'

// ── Sign in ───────────────────────────────────────────────────────────────────────────────────

export function SignIn({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { linkComponent: Link } = useLiro()
  return (
    <AuthShell
      brand={BRAND}
      layout={phone ? 'phone' : 'desktop'}
      title="Sign in"
      description="Use the e-mail address your company gave you."
      footer={
        <>
          {['English', 'Terms', 'Privacy'].map((item) => (
            <Link
              key={item}
              href={`#/${item.toLowerCase()}`}
              className="text-tertiary no-underline visited:text-tertiary hover:text-secondary hover:underline"
            >
              {item}
            </Link>
          ))}
        </>
      }
    >
      {/* P5.6 (group C): the e-mail first, then the "or" divider and the providers' buttons. */}
      <EmailFirstForm
        label="Work e-mail"
        placeholder="name@company.rs"
        defaultValue="milica.petrovic@kvadratgradnja.rs"
        onSubmit={() => {
          navigate(ROUTES.home)
        }}
        providers={signInProviders(() => {
          navigate(ROUTES.home)
        })}
        signUp={
          <>
            No account?{' '}
            <Link
              href="#/sign-in/help"
              className="text-link underline visited:text-link hover:text-link active:text-link"
            >
              Ask your company’s administrator
            </Link>
          </>
        }
      />
    </AuthShell>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────────────────────────

const MODULES: LaunchpadModule[] = [
  {
    id: 'sales',
    name: 'Sales',
    description: 'Invoices, quotes, customers',
    icon: Receipt,
    href: '#/sales/invoices',
    counter: '3 to send',
  },
  {
    id: 'purchasing',
    name: 'Purchasing',
    description: 'Supplier invoices and orders',
    icon: ShoppingCart,
    href: '#/purchasing/approvals',
    // The application writes its counter; its number goes through the provider's format (Home).
    counter: 'to approve',
  },
  {
    id: 'reports',
    name: 'Overview',
    description: 'Revenue, cash, receivables',
    icon: ChartColumn,
    href: '#/reports/overview',
  },
  {
    id: 'hr',
    name: 'Employees',
    description: 'Records, contracts, leave',
    icon: Users,
    href: `#${ROUTES.employee}`,
    counter: '1 leave request',
  },
  {
    id: 'banking',
    name: 'Banking',
    description: 'Statements and payments',
    icon: Landmark,
    href: '#/banking/statements/188',
    counter: '7 lines to check',
  },
  {
    id: 'accounting',
    name: 'Accounting',
    description: 'General ledger, journal entries, VAT',
    icon: BookOpen,
    href: '#/accounting/journal/NK-2026-0912',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Items, warehouses, stock counts',
    icon: Package,
    href: '#/inventory',
    counter: '14 below minimum',
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'September 2026 due on 15.10.',
    icon: Wallet,
    href: '#/hr/payroll/2026-09',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'The team’s board',
    icon: SquareKanban,
    href: '#/tasks',
  },
  {
    id: 'assets',
    name: 'Fixed assets',
    description: 'Register and depreciation',
    icon: Building,
    href: '#/assets',
    locked: 'Available in Pro',
  },
]

export function Home({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  // Counts the application writes go through the provider's format, as every number (P4.9).
  const modules = MODULES.map((module) =>
    module.id === 'purchasing'
      ? { ...module, counter: `${format.number(String(APPROVALS.length))} to approve` }
      : module,
  )
  return (
    <Shell phone={phone}>
      <div
        className={
          phone
            ? 'box-border flex w-full flex-col gap-4 p-4'
            : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
        }
      >
        {/* The company is in the header: the page's h1 is for screen readers only. */}
        <h1 className="sr-only">Home</h1>
        <Launchpad label="Modules" modules={modules} layout={phone ? 'phone' : 'desktop'} />
      </div>
    </Shell>
  )
}

// ── Invoice list ──────────────────────────────────────────────────────────────────────────────

const INVOICE_COLUMNS: (DataTableColumn<ExampleInvoice> & { label: string })[] = [
  { id: 'number', label: 'Number', header: 'Number', cell: (row) => row.number },
  { id: 'customer', label: 'Customer', header: 'Customer', cell: (row) => row.customer },
  {
    id: 'issued',
    label: 'Issued',
    header: 'Issued',
    numeric: true,
    sortable: true,
    cell: (row) => <DateText value={row.issued} />,
  },
  {
    id: 'due',
    label: 'Due',
    header: 'Due',
    numeric: true,
    sortable: true,
    cell: (row) =>
      row.status === 'Paid' ? <DateText value={row.due} /> : <DueDate value={row.due} />,
  },
  {
    id: 'total',
    label: 'Total',
    header: 'Total',
    align: 'end',
    numeric: true,
    sortable: true,
    cell: (row) => <MoneyText value={row.total} currency="RSD" />,
  },
  {
    id: 'status',
    label: 'Status',
    header: 'Status',
    cell: (row) => statusBadge(row.status),
  },
]

const INVOICE_FILTERS: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  { id: 'issued', label: 'Issue date', type: 'dateRange' },
  { id: 'total', label: 'Total', type: 'numberRange', decimals: 2, currency: 'RSD' },
]

/** The saved views: five as tabs on desktop, the rest under "More"; one select on phones. */
const INVOICE_VIEWS = [
  { id: 'all', label: 'All', count: 1284 },
  { id: 'unpaid', label: 'Unpaid', count: 37 },
  { id: 'overdue', label: 'Overdue', count: 9 },
  { id: 'drafts', label: 'Drafts', count: 4 },
  { id: 'mine', label: 'Mine' },
  { id: 'sef', label: 'Rejected by SEF', count: 2 },
  { id: 'cancelled', label: 'Cancelled', count: 6 },
]

export function InvoiceList({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState('all')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const [columns, setColumns] = useState<ChooserColumn[]>(
    INVOICE_COLUMNS.map((column) => ({
      id: column.id,
      label: column.label,
      visible: true,
      ...(column.id === 'number' ? { required: true } : {}),
    })),
  )
  const [preview, setPreview] = useState<ExampleInvoice | null>(null)
  const shown = columns
    .filter((column) => column.visible)
    .flatMap((column) => INVOICE_COLUMNS.filter((each) => each.id === column.id))
  const open = (invoice: ExampleInvoice) => {
    navigate(ROUTES.invoice(invoice.number))
  }
  const newInvoice = (
    <Button
      intent="create"
      label="New invoice"
      onClick={() => {
        navigate('/sales/invoices/new')
      }}
    />
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Sales', href: '#/sales/invoices' }, { label: 'Invoices' }]}
      tabs={SALES_TABS}
      bottomBar={newInvoice}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Invoices"
        {...(phone ? {} : { actions: newInvoice })}
        views={INVOICE_VIEWS}
        view={view}
        onViewChange={setView}
        saveView={<Button family="neutral" emphasis="menu" icon={BookmarkPlus} label="Save view" />}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={INVOICE_FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search number or customer"
            actions={
              <>
                <ColumnChooser columns={columns} onChange={setColumns} />
                <Button intent="export" label="Export" />
              </>
            }
            phoneMenu={[{ label: 'Export', icon: FileSpreadsheet, onSelect: () => undefined }]}
          />
        }
      >
        <DataTable
          label="Invoices"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={shown}
          rows={INVOICES}
          getRowId={(row) => row.number}
          getRowLabel={(row) => row.number}
          filters={filters}
          onRowClick={setPreview}
          onRowOpen={open}
          count={1284}
          countIsExact
          hasPrevious={false}
          hasNext
          onPrevious={() => undefined}
          onNext={() => undefined}
          mobile={{
            subtitle: (row) => row.customer,
            badge: (row) => statusBadge(row.status),
            details: ['due', 'total'],
          }}
        />
      </ListPage>
      {preview !== null && (
        <QuickPreview
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) setPreview(null)
          }}
          title={preview.number}
          description={preview.customer}
          items={[
            { label: 'Status', value: statusBadge(preview.status) },
            { label: 'Issued', value: <DateText value={preview.issued} />, numeric: true },
            {
              label: 'Due',
              value: <DueDate value={preview.due} settled={preview.status === 'Paid'} />,
              numeric: true,
            },
            {
              label: 'Total',
              value: <MoneyText value={preview.total} currency="RSD" />,
              numeric: true,
            },
            {
              label: 'Amount due',
              value: <MoneyText value={preview.open} currency="RSD" />,
              numeric: true,
            },
          ]}
          onOpenRecord={() => {
            const chosen = preview
            setPreview(null)
            open(chosen)
          }}
        />
      )}
    </Shell>
  )
}

// ── Invoice (document) ────────────────────────────────────────────────────────────────────────

const LINE_COLUMNS: DataTableColumn<ExampleLine>[] = [
  { id: 'item', header: 'Item', cell: (line) => line.item },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.price} currency="RSD" />,
  },
  { id: 'vat', header: 'VAT', cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

const TOTAL_ROWS: TotalsRow[] = [
  { key: 'base20', label: 'Tax base S 20%', value: TOTALS.base20, currency: 'RSD' },
  { key: 'vat20', label: 'VAT S 20%', value: TOTALS.vat20, currency: 'RSD' },
  { key: 'base10', label: 'Tax base S 10%', value: TOTALS.base10, currency: 'RSD', group: true },
  { key: 'vat10', label: 'VAT S 10%', value: TOTALS.vat10, currency: 'RSD' },
  {
    key: 'exempt',
    label: 'Exempt E (deposit)',
    value: TOTALS.exempt,
    currency: 'RSD',
    group: true,
  },
  { key: 'total', label: 'Invoice total', value: TOTALS.total, currency: 'RSD', group: true },
  {
    key: 'advance',
    label: 'Advance A-2026-031',
    value: TOTALS.advance,
    currency: 'RSD',
  },
]

const STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'sef', label: 'Sent to SEF' },
  { key: 'paid', label: 'Paid' },
]

/** A time as the application writes it (`format.dateTime` in the tenant's zone). */
function Time({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>
}

const PANELS: SidePanel[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    content: (
      <KeyValueList
        columns={1}
        items={[
          { label: 'SEF', value: <StatusBadge label="Delivered" tone="success" /> },
          { label: 'Sent', value: <Time>28.09.2026. 10:42</Time>, numeric: true },
        ]}
      />
    ),
  },
  {
    key: 'related',
    title: 'Related documents',
    count: 3,
    content: (
      <RelatedDocuments
        label="Related documents"
        items={[
          {
            key: 'order',
            type: 'Order',
            number: 'N-2026-0157',
            href: '#/sales/orders/N-2026-0157',
            status: <StatusBadge label="Completed" tone="neutral" />,
          },
          {
            key: 'delivery',
            type: 'Delivery note',
            number: 'OTP-2026-0311',
            href: '#/sales/deliveries/OTP-2026-0311',
            status: <StatusBadge label="Delivered" tone="success" />,
          },
          {
            key: 'advance',
            type: 'Advance invoice',
            number: 'A-2026-031',
            href: '#/sales/invoices/A-2026-031',
            status: <StatusBadge label="Paid" tone="success" />,
          },
        ]}
      />
    ),
  },
  {
    key: 'comments',
    title: 'Comments',
    count: 3,
    content: (
      <ActivityList
        label="Comments"
        items={[
          {
            key: 'c3',
            author: 'Dragan Ilić',
            time: <Time>02.10.2026. 09:15</Time>,
            text: 'Customer asked for delivery on Friday.',
          },
          {
            key: 'c2',
            author: 'Milica Petrović',
            time: <Time>29.09.2026. 13:40</Time>,
            text: 'Advance A-2026-031 deducted, as agreed with Panonija.',
          },
          {
            key: 'c1',
            author: 'Jelena Marković',
            time: <Time>28.09.2026. 10:05</Time>,
            text: 'Prices checked against the September price list.',
          },
        ]}
      />
    ),
  },
  {
    key: 'history',
    title: 'History',
    content: (
      <ActivityList
        label="History"
        items={[
          {
            key: 'h3',
            author: 'Milica Petrović',
            time: <Time>28.09.2026. 10:42</Time>,
            text: 'Sent to SEF',
          },
          {
            key: 'h2',
            author: 'Milica Petrović',
            time: <Time>28.09.2026. 10:40</Time>,
            text: 'Issued',
          },
        ]}
      />
    ),
  },
]

export function Invoice({ phone, invoice }: { phone: boolean; invoice: ExampleInvoice }) {
  const [open, setOpen] = useState<string[]>(['delivery', 'related'])
  const [hidden, setHidden] = useState(false)
  const reminder = <Button family="verify" icon={Send} label="Send reminder" />
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: invoice.number }]}
      tabs={SALES_TABS}
      {...(phone ? { bottomBar: reminder } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={invoice.number}
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge(invoice.status)}
        lifecycle={{ steps: STEPS, current: 2, label: 'Invoice status' }}
        counterparty={{
          label: 'Customer',
          name: invoice.customer,
          taxId: `PIB ${invoice.taxId}`,
          address: invoice.address,
        }}
        keyFigures={[
          { label: 'Amount due', value: <MoneyText value={TOTALS.due} currency="RSD" /> },
          { label: 'Invoice total', value: <MoneyText value={invoice.total} currency="RSD" /> },
          { label: 'Due', value: <DateText value={invoice.due} /> },
        ]}
        actions={
          <>
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone ? null : reminder}
          </>
        }
        lines={
          <DataTable
            label="Lines"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={LINE_COLUMNS}
            rows={LINES}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.item}
            mobile={{ details: ['quantity', 'unit', 'price', 'vat', 'amount'] }}
          />
        }
        totals={{
          rows: TOTAL_ROWS,
          total: { key: 'due', label: 'Amount due', value: TOTALS.due, currency: 'RSD' },
          label: 'Totals',
        }}
        sections={[
          {
            key: 'payment',
            title: 'Payment',
            content: (
              <p className="bidi-content m-0 text-sm text-primary">
                Payment to 160-0000012345678-21 with reference 97 2026-0412, by 13.10.2026.
              </p>
            ),
          },
        ]}
        panels={PANELS}
        panelsOpen={open}
        onPanelsOpenChange={setOpen}
        panelsHidden={hidden}
        onPanelsHiddenChange={setHidden}
      />
    </Shell>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────────────────────

/** Adds decimal strings in whole paras (the application's work, played by the story). */
function sum(values: readonly string[]): string {
  const paras = values.reduce((total, value) => total + Math.round(Number(value) * 100), 0)
  return `${String(Math.trunc(paras / 100))}.${String(Math.abs(paras % 100)).padStart(2, '0')}`
}

const OVERDUE = INVOICES.filter((invoice) => invoice.status === 'Overdue')

export function Dashboard({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const columns: DataTableColumn<ExampleInvoice>[] = [
    {
      id: 'number',
      header: 'Invoice',
      cell: (row) => (
        <Link
          href={`#${ROUTES.invoice(row.number)}`}
          className="text-link no-underline visited:text-link hover:underline"
        >
          {row.number}
        </Link>
      ),
    },
    { id: 'customer', header: 'Customer', cell: (row) => row.customer },
    {
      id: 'due',
      header: 'Due',
      numeric: true,
      cell: (row) => <DueDate value={row.due} />,
    },
    {
      id: 'total',
      header: 'Total',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.total} currency="RSD" />,
    },
    {
      id: 'open',
      header: 'Amount due',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.open} currency="RSD" />,
    },
  ]
  return (
    <Shell phone={phone} crumbs={[{ label: 'Overview' }]}>
      <DashboardPage
        layout={phone ? 'phone' : 'desktop'}
        title="Overview"
        // The company is in the header already: the subtitle names only the period.
        subtitle="September 2026"
        stats={[
          {
            key: 'revenue',
            label: 'Revenue, September',
            // Money is never rounded: every amount with its paras (P4.9).
            value: <MoneyText value="5684200.00" currency="RSD" />,
            change: { text: percentText('16.7', 'always'), direction: 'up', sentiment: 'good' },
            comparison: 'vs September 2025',
            trend: ['4812.4', '5230.9', '4977.1', '3906.5', '4421.8', '5684.2'],
          },
          {
            key: 'overdue',
            label: 'Overdue receivables',
            value: <MoneyText value={sum(OVERDUE.map((invoice) => invoice.open))} currency="RSD" />,
            comparison: `${format.number(String(OVERDUE.length))} invoices`,
          },
          {
            key: 'cash',
            label: 'Cash',
            value: <MoneyText value="3012775.40" currency="RSD" />,
            change: { text: percentText('36.0', 'always'), direction: 'up', sentiment: 'good' },
            comparison: 'vs 31.08.2026.',
          },
          {
            key: 'vat',
            label: 'VAT due 15.10.',
            value: <MoneyText value="612480.00" currency="RSD" />,
          },
        ]}
      >
        <BarChart {...REVENUE} />
        <LineChart {...CASH} />
        {/* col-span-full, never md:col-span-2: in the phone layout one column stays one. */}
        <SectionCard title="Largest open invoices" headingLevel={3} flush className="col-span-full">
          <DataTable
            label="Largest open invoices"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={columns}
            rows={LARGEST_OPEN}
            getRowId={(row) => row.number}
            getRowLabel={(row) => row.number}
            mobile={{ subtitle: (row) => row.customer, details: ['due', 'open'] }}
          />
        </SectionCard>
      </DashboardPage>
    </Shell>
  )
}

// ── Approvals (worklist) ──────────────────────────────────────────────────────────────────────

const APPROVAL_LINE_COLUMNS: DataTableColumn<ApprovalLine>[] = [
  { id: 'item', header: 'Item', cell: (line) => line.item },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (line) => <NumberText value={line.quantity} />,
  },
  // The unit of measure is the Core's (its symbol, with its standard code), in its own column:
  // a number is never joined to a word that would need a plural ("12 line", P4.9d).
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  { id: 'vat', header: 'VAT', align: 'end', numeric: true, cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

/** Reject first, then Approve: the confirming action last (mirrored in right-to-left). */
function Decisions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <>
      <Button family="destructive" icon={CircleX} label="Reject" onClick={onReject} />
      <Button
        family="positive"
        icon={CheckCheck}
        label="Approve"
        emphasis="primary"
        onClick={onApprove}
      />
    </>
  )
}

/**
 * The chosen supplier invoice, whole: its facts, its lines and its PDF, and the two decisions —
 * at the top of the pane on a desktop, in the bottom bar on a phone.
 */
function ApprovalDetail({
  row,
  phone,
  onApprove,
  onReject,
}: {
  row: ExampleApproval
  phone: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const { linkComponent: Link } = useLiro()
  const detail = APPROVAL_DETAILS[row.id]
  return (
    <div className={phone ? 'flex flex-col gap-4' : 'flex flex-col gap-6 p-6'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="bidi-content m-0 text-h2 text-primary">{row.supplier}</h2>
          <p className="bidi-content m-0 text-sm text-secondary">
            {row.number} · requested by {row.requester}
          </p>
        </div>
        {!phone && (
          <div className="flex gap-2">
            <Decisions onApprove={onApprove} onReject={onReject} />
          </div>
        )}
      </div>
      <KeyValueList
        items={[
          { label: 'Amount', value: <MoneyText value={row.total} currency="RSD" />, numeric: true },
          { label: 'Due', value: <DueDate value={row.due} />, numeric: true },
          { label: 'Received', value: <DateText value={row.received} />, numeric: true },
          { label: 'Cost centre', value: row.costCenter },
          ...(detail?.purchaseOrder === undefined
            ? []
            : [{ label: 'Purchase order', value: detail.purchaseOrder, numeric: true }]),
          // Two values, never "30.09.2026., complete" (a date followed by a comma).
          ...(detail?.goods === undefined
            ? []
            : [
                { label: 'Goods received', value: detail.goods.state },
                {
                  label: 'Goods received on',
                  value: <DateText value={detail.goods.date} />,
                  numeric: true,
                },
              ]),
          ...(detail === undefined
            ? []
            : [
                {
                  label: 'Attachment',
                  value: (
                    <Link
                      href={`#/purchasing/files/${detail.attachment}`}
                      className="text-link no-underline visited:text-link hover:underline"
                    >
                      {detail.attachment}
                    </Link>
                  ),
                },
              ]),
        ]}
      />
      {detail !== undefined && (
        <section aria-label="Lines" className={phone ? undefined : '-mx-6'}>
          <h3
            className={
              phone ? 'm-0 mb-2 text-h4 text-primary' : 'm-0 mb-2 px-6 text-h4 text-primary'
            }
          >
            Lines
          </h3>
          <DataTable
            label="Lines"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={APPROVAL_LINE_COLUMNS}
            rows={detail.lines}
            getRowId={(line) => line.item}
            getRowLabel={(line) => line.item}
            mobile={{ details: ['quantity', 'unit', 'vat', 'amount'] }}
          />
        </section>
      )}
    </div>
  )
}

export function Approvals({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [rows, setRows] = useState(APPROVALS)
  const [selected, setSelected] = useState<string | undefined>(phone ? undefined : 'u1')
  const [checked, setChecked] = useState<string[]>([])
  // What Reject asks about — one invoice or the checked ones — kept while the dialog closes.
  const [rejecting, setRejecting] = useState<{ ids: readonly string[]; name: string }>({
    ids: [],
    name: '',
  })
  const [asking, setAsking] = useState(false)
  const reject = (ids: readonly string[]) => {
    setRejecting({ ids, name: numbers(ids) })
    setAsking(true)
  }

  /** Takes the invoices off the queue and opens the next one at the same place. */
  const decide = (ids: readonly string[], done: string, undo: boolean) => {
    const index = rows.findIndex((row) => ids.includes(row.id))
    const rest = rows.filter((row) => !ids.includes(row.id))
    setRows(rest)
    setChecked([])
    if (!phone || selected !== undefined) {
      setSelected(rest[Math.min(Math.max(index, 0), rest.length - 1)]?.id)
    }
    notice.success(done, {
      // Undo only where the Core can take the decision back (an approval; a rejection has
      // already gone to SEF).
      ...(undo
        ? {
            action: {
              label: 'Undo',
              onClick: () => {
                setRows((current) =>
                  APPROVALS.filter(
                    (each) => ids.includes(each.id) || current.some((row) => row.id === each.id),
                  ),
                )
                setSelected(ids[0])
              },
            },
          }
        : {}),
    })
  }
  function numbers(ids: readonly string[]) {
    return ids.length === 1
      ? (rows.find((row) => row.id === ids[0])?.number ?? '')
      : `${format.number(String(ids.length))} invoices`
  }
  const approve = (ids: readonly string[]) => {
    decide(ids, `${numbers(ids)} approved.`, true)
  }

  const row = rows.find((each) => each.id === selected)
  const index = rows.findIndex((each) => each.id === selected)
  const items: WorklistItem[] = rows.map((each) => ({
    id: each.id,
    label: each.number,
    title: each.supplier,
    subtitle: `${each.number} · ${each.costCenter}`,
    figure: <MoneyText value={each.total} currency="RSD" />,
    status: statusBadge(each.status),
  }))
  const decisions =
    row === undefined ? undefined : (
      <Decisions
        onApprove={() => {
          approve([row.id])
        }}
        onReject={() => {
          reject([row.id])
        }}
      />
    )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Purchasing', href: '#/purchasing' }, { label: 'To approve' }]}
      // On a phone the decisions stand in the bottom bar, within thumb reach.
      {...(phone && decisions !== undefined
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Supplier invoices to approve"
        label="Supplier invoices to approve"
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
                key: 'reject',
                family: 'destructive',
                icon: CircleX,
                label: 'Reject',
                onClick: () => {
                  reject(checked)
                },
              },
              {
                key: 'approve',
                family: 'positive',
                icon: CheckCheck,
                label: 'Approve',
                onClick: () => {
                  approve(checked)
                },
              },
            ]}
          />
        }
        empty={
          <EmptyState
            title="Nothing to approve"
            description="New supplier invoices appear here when they arrive from SEF."
          />
        }
        {...(row === undefined
          ? {}
          : {
              detail: (
                <ApprovalDetail
                  row={row}
                  phone={phone}
                  onApprove={() => {
                    approve([row.id])
                  }}
                  onReject={() => {
                    reject([row.id])
                  }}
                />
              ),
            })}
        onBack={() => {
          setSelected(undefined)
        }}
        onNext={() => {
          setSelected(rows[(index + 1) % rows.length]?.id)
        }}
      />
      <ReasonConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        family="destructive"
        actionIcon={CircleX}
        title={`Reject ${rejecting.name}?`}
        message="The supplier sees the reason on SEF. A rejection cannot be taken back."
        reasonLabel="Reason for rejection"
        reasons={REJECT_REASONS}
        confirmLabel="Reject"
        onConfirm={() => {
          decide(rejecting.ids, `${rejecting.name} rejected.`, false)
        }}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

// ── Employee record ───────────────────────────────────────────────────────────────────────────

/** What the Core keeps while the record is edited. */
interface EmployeeValues {
  phone: string
  email: string
  address: string
  position: string
}

const EMPLOYEE_START: EmployeeValues = {
  phone: EMPLOYEE.phone,
  email: EMPLOYEE.email,
  address: EMPLOYEE.address,
  position: EMPLOYEE.position,
}

/**
 * The employee's record (DetailPage): read, and edited as a whole with one Edit — no tabs, no
 * side column, the leave data in its own section.
 */
export function Employee({ phone }: { phone: boolean }) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [saved, setSaved] = useState(EMPLOYEE_START)
  const [values, setValues] = useState(EMPLOYEE_START)
  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  const change = (patch: Partial<EmployeeValues>) => {
    setValues((current) => ({ ...current, ...patch }))
  }
  const edit = (
    <Button
      intent="edit"
      label="Edit"
      onClick={() => {
        setMode('edit')
      }}
    />
  )
  const sections: DetailSection[] = [
    {
      id: 'personal',
      label: 'Personal',
      content: (
        <KeyValueList
          items={[
            {
              label: 'Date of birth',
              value: <DateText value={EMPLOYEE.birthDate} />,
              numeric: true,
            },
            { label: 'Phone', value: values.phone, numeric: true },
            { label: 'E-mail', value: values.email },
            { label: 'Address', value: values.address },
          ]}
        />
      ),
      edit: (
        <FormGrid>
          <DateField label="Date of birth" defaultValue={EMPLOYEE.birthDate} />
          <TextField
            label="Phone"
            type="tel"
            value={values.phone}
            onChange={(phoneNumber) => {
              change({ phone: phoneNumber })
            }}
          />
          <TextField
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(email) => {
              change({ email })
            }}
          />
          <TextField
            label="Address"
            value={values.address}
            onChange={(address) => {
              change({ address })
            }}
          />
        </FormGrid>
      ),
    },
    {
      id: 'employment',
      label: 'Employment',
      content: (
        <KeyValueList
          items={[
            { label: 'Position', value: values.position },
            { label: 'Department', value: 'Finance' },
            { label: 'Contract', value: EMPLOYEE.contract },
            {
              label: 'Contract period',
              value: <DateRangeText from={EMPLOYEE.since} to={EMPLOYEE.contractEnd} />,
              numeric: true,
            },
            { label: 'Working hours', value: EMPLOYEE.hours },
          ]}
        />
      ),
      edit: (
        <FormGrid>
          <TextField
            label="Position"
            value={values.position}
            onChange={(position) => {
              change({ position })
            }}
          />
          <SelectField
            label="Department"
            defaultValue={EMPLOYEE.department}
            options={[
              { value: 'finance', label: 'Finance' },
              { value: 'sales', label: 'Sales' },
              { value: 'warehouse', label: 'Warehouse' },
            ]}
          />
          <DateField label="Start date" defaultValue={EMPLOYEE.since} />
          <DateField label="Contract end" defaultValue={EMPLOYEE.contractEnd} />
        </FormGrid>
      ),
    },
    {
      id: 'leave',
      label: 'Leave',
      // Kept by leave requests: read-only in edit mode too.
      description: 'Changed through leave requests',
      content: (
        <KeyValueList
          items={[
            { label: 'Days left in 2026', value: EMPLOYEE.leaveLeft, numeric: true },
            { label: 'Days taken', value: EMPLOYEE.leaveTaken, numeric: true },
            {
              label: 'Next leave',
              value: <DateRangeText from={EMPLOYEE.nextLeave.from} to={EMPLOYEE.nextLeave.to} />,
              numeric: true,
            },
            { label: 'Manager', value: EMPLOYEE.manager },
          ]}
        />
      ),
    },
    {
      id: 'payroll',
      label: 'Payroll',
      content: (
        <KeyValueList
          items={[
            {
              label: 'Gross salary',
              value: <MoneyText value={EMPLOYEE.gross} currency="RSD" />,
              numeric: true,
            },
            { label: 'Bank account', value: EMPLOYEE.account, numeric: true },
          ]}
        />
      ),
      edit: (
        <FormGrid>
          <MoneyField label="Gross salary" currency="RSD" defaultValue={EMPLOYEE.gross} />
          <TextField label="Bank account" defaultValue={EMPLOYEE.account} direction="ltr" />
        </FormGrid>
      ),
    },
  ]
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Employees', href: '#/hr/employees' }, { label: EMPLOYEE.name }]}
      tabs={HR_TABS}
      // On a phone Edit stands in the bottom bar; while editing, the page's own bar does.
      {...(phone && mode === 'view' ? { bottomBar: edit } : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={EMPLOYEE.name}
        back={{ href: '#/home', label: 'Home' }}
        status={<StatusBadge label="Active" tone="success" />}
        subtitle={`${values.position} · Finance`}
        keyFigures={[
          {
            label: 'Net salary, September 2026',
            value: <MoneyText value={EMPLOYEE.net} currency="RSD" />,
          },
          { label: 'Leave left', value: `${EMPLOYEE.leaveLeft} days` },
          { label: 'Contract ends', value: <DateText value={EMPLOYEE.contractEnd} /> },
        ]}
        {...(phone ? {} : { actions: edit })}
        sections={sections}
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
                  setValues(saved)
                  setMode('view')
                },
              },
              {
                key: 'save',
                intent: 'save',
                label: 'Save',
                onClick: () => {
                  setSaved(values)
                  setMode('view')
                },
              },
            ]}
          />
        }
      />
    </Shell>
  )
}

// ── Notifications ─────────────────────────────────────────────────────────────────────────────

export function NotificationsScreen({ phone }: { phone: boolean }) {
  const notifications = useContext(Notifications)
  const [show, setShow] = useState<'all' | 'unread'>('all')
  const [companies, setCompanies] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  return (
    <Shell phone={phone}>
      <NotificationsPage
        layout={phone ? 'phone' : 'desktop'}
        title="Notifications"
        items={filterNotifications(notifications.items, {
          unreadOnly: show === 'unread',
          companies,
          types,
        })}
        unread={notifications.items.filter((item) => !item.read).length}
        show={show}
        onShowChange={setShow}
        companyFilter={{
          label: 'Company',
          options: COMPANIES.map((company) => ({ value: company.id, label: company.name })),
          value: companies,
          onChange: setCompanies,
        }}
        typeFilter={{
          label: 'Type',
          options: NOTIFICATION_TYPES,
          value: types,
          onChange: setTypes,
        }}
        onOpen={(item) => {
          notifications.setRead(item.id, true)
        }}
        onReadChange={(item, read) => {
          notifications.setRead(item.id, read)
        }}
        onMarkAllRead={() => {
          notifications.setRead('all', true)
        }}
        onClearFilters={() => {
          setShow('all')
          setCompanies([])
          setTypes([])
        }}
        settingsHref="#/settings/notifications"
      />
    </Shell>
  )
}

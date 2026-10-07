import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BookOpen,
  BookmarkPlus,
  Building,
  Building2,
  ChartColumn,
  CheckCheck,
  CircleX,
  House,
  Landmark,
  LogOut,
  Package,
  Receipt,
  Send,
  ShoppingCart,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { expect, userEvent, within } from 'storybook/test'
import {
  ActionGroup,
  AppShell,
  AuthShell,
  Button,
  ColumnChooser,
  DashboardPage,
  DataTable,
  DateField,
  DateText,
  DocumentPage,
  DueDate,
  FilterBar,
  FormSection,
  FormTabs,
  KeyValueList,
  Launchpad,
  ListPage,
  MoneyField,
  MoneyText,
  QuickPreview,
  RecordFormPage,
  SectionCard,
  SelectField,
  StatusBadge,
  StatusPage,
  TextField,
  toneFor,
  useLiro,
  WorklistPage,
  type ChooserColumn,
  type CommandItem,
  type DataTableColumn,
  type DataTableFilters,
  type FilterDefinition,
  type LaunchpadModule,
  type LifecycleStep,
  type ModuleTab,
  type ShellCompany,
  type ShellUser,
  type SidePanel,
  type TotalsRow,
  type WorklistItem,
} from '../index'
import { BarChart, LineChart } from '../charts'
import { LIRO_BRAND } from '../components/story-brand'
import { ExampleProvider, PhoneFrame, percentText } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import {
  APPROVALS,
  CASH,
  EMPLOYEE,
  FEATURED,
  INVOICES,
  LARGEST_OPEN,
  LINES,
  REVENUE,
  TOTALS,
  type ExampleApproval,
  type ExampleInvoice,
  type ExampleLine,
} from './examples-story-data'

/*
 * The example screens (P4.8): Liro as it will look, one company and one dataset, the screens
 * linked into one walk-through. They use only the public entry points — `@veljaos/ui` and
 * `@veljaos/ui/charts` — as the Core will. Navigation goes through the provider's
 * `linkComponent`: a link to "#/…" changes the example's route instead of the page (the Core
 * passes its router's link the same way).
 */

// ── The router ────────────────────────────────────────────────────────────────────────────────

const Navigate = createContext<(path: string) => void>(() => undefined)

/** The provider's link component: "#/path" links move inside the examples. */
function RouterLink({ href, onClick, children, ...props }: ComponentProps<'a'>) {
  const navigate = useContext(Navigate)
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !href?.startsWith('#/')) return
        event.preventDefault()
        navigate(href.slice(1))
      }}
      {...props}
    >
      {children}
    </a>
  )
}

const ROUTES = {
  signIn: '/sign-in',
  home: '/home',
  invoices: '/sales/invoices',
  invoice: (number: string) => `/sales/invoices/${number}`,
  dashboard: '/reports/overview',
  approvals: '/purchasing/approvals',
  employee: `/hr/employees/${EMPLOYEE.id}`,
}

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

const BRAND = { ...LIRO_BRAND, href: '#/home' }

const COMPANIES: ShellCompany[] = [
  { id: 'kvadrat', name: 'Kvadrat Gradnja d.o.o.', description: 'PIB 108452317', waiting: 5 },
  { id: 'panonija', name: 'Panonija Agro d.o.o.', description: 'PIB 104987265' },
  { id: 'bojovic', name: 'Bojović i sinovi d.o.o.', description: 'PIB 109773148', waiting: 12 },
]

const SALES_TABS: ModuleTab[] = [
  { key: 'invoices', label: 'Invoices', href: '#/sales/invoices', current: true },
  { key: 'quotes', label: 'Quotes', href: '#/sales/quotes' },
  { key: 'orders', label: 'Orders', href: '#/sales/orders' },
  { key: 'customers', label: 'Customers', href: '#/sales/customers' },
  { key: 'reports', label: 'Reports', href: '#/sales/reports' },
]

const HR_TABS: ModuleTab[] = [
  { key: 'employees', label: 'Employees', href: '#/hr/employees', current: true },
  { key: 'leave', label: 'Leave', href: '#/hr/leave' },
  { key: 'contracts', label: 'Contracts', href: '#/hr/contracts' },
]

const TONES = {
  Draft: 'neutral',
  Sent: 'info',
  Paid: 'success',
  Overdue: 'danger',
  'Partially paid': 'warning',
  'To approve': 'warning',
  'Query sent': 'info',
} as const

function statusBadge(status: keyof typeof TONES) {
  return <StatusBadge label={status} tone={toneFor(status, TONES)} />
}

/** The shell around every signed-in screen. */
function Shell({
  phone,
  crumbs,
  tabs,
  bottomBar,
  children,
}: {
  phone: boolean
  crumbs?: { label: string; href?: string }[]
  tabs?: ModuleTab[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const commands: CommandItem[] = [
    {
      id: 'new-invoice',
      label: 'New invoice',
      group: 'actions',
      onSelect: () => {
        navigate(ROUTES.invoices)
      },
    },
    {
      id: 'go-invoices',
      label: 'Invoices',
      group: 'navigation',
      onSelect: () => {
        navigate(ROUTES.invoices)
      },
    },
    {
      id: 'go-overview',
      label: 'Overview',
      group: 'navigation',
      onSelect: () => {
        navigate(ROUTES.dashboard)
      },
    },
    {
      id: 'go-approvals',
      label: 'Supplier invoices to approve',
      group: 'navigation',
      onSelect: () => {
        navigate(ROUTES.approvals)
      },
    },
  ]
  const user: ShellUser = {
    name: 'Milica Petrović',
    email: 'milica.petrovic@kvadratgradnja.rs',
    entries: [
      { label: 'Profile', icon: UserRound, onSelect: () => undefined },
      { label: 'Company settings', icon: Building2, onSelect: () => undefined },
      { type: 'separator' },
      {
        label: 'Sign out',
        icon: LogOut,
        onSelect: () => {
          navigate(ROUTES.signIn)
        },
      },
    ],
  }
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      {...(crumbs === undefined ? {} : { breadcrumbs: crumbs })}
      commands={{ items: commands }}
      notifications={{
        unread: 2,
        panel: <p className="m-0 text-sm">2 supplier invoices are overdue for approval.</p>,
      }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={user}
      {...(tabs === undefined ? {} : { moduleTabs: tabs })}
      {...(bottomBar === undefined ? {} : { bottomBar })}
    >
      {children}
    </AppShell>
  )
}

// ── Sign in ───────────────────────────────────────────────────────────────────────────────────

function SignIn({ phone }: { phone: boolean }) {
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
      <form
        className="flex flex-col gap-4 [&>button]:w-full"
        onSubmit={(event) => {
          event.preventDefault()
          navigate(ROUTES.home)
        }}
      >
        <TextField
          label="Work e-mail"
          type="email"
          autoComplete="email"
          placeholder="name@company.rs"
          defaultValue="milica.petrovic@kvadratgradnja.rs"
        />
        <Button intent="next" label="Continue" type="submit" />
      </form>
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
    counter: `${String(APPROVALS.length)} to approve`,
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
    href: '#/banking',
    counter: '2 statements',
  },
  {
    id: 'accounting',
    name: 'Accounting',
    description: 'General ledger, journal entries, VAT',
    icon: BookOpen,
    href: '#/accounting',
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
    href: '#/payroll',
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

function Home({ phone }: { phone: boolean }) {
  return (
    <Shell phone={phone}>
      <div
        className={
          phone
            ? 'box-border flex w-full flex-col gap-4 p-4'
            : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
        }
      >
        <h1 className="bidi-content m-0 text-h1 text-primary">Kvadrat Gradnja d.o.o.</h1>
        <Launchpad label="Modules" modules={MODULES} layout={phone ? 'phone' : 'desktop'} />
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
    ],
  },
  { id: 'issued', label: 'Issue date', type: 'dateRange' },
  { id: 'total', label: 'Total', type: 'numberRange', decimals: 2, currency: 'RSD' },
]

function InvoiceList({ phone }: { phone: boolean }) {
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
  const newInvoice = <Button intent="create" label="New invoice" />
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
        views={[
          { id: 'all', label: 'All', count: 1284 },
          { id: 'unpaid', label: 'Unpaid', count: 37 },
          { id: 'overdue', label: 'Overdue', count: 9 },
          { id: 'mine', label: 'Mine' },
        ]}
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
    cell: (line) => line.quantity,
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.price} currency="RSD" />,
  },
  { id: 'vat', header: 'VAT', align: 'end', numeric: true, cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

const TOTAL_ROWS: TotalsRow[] = [
  { key: 'base20', label: 'Tax base 20%', value: TOTALS.base20, currency: 'RSD' },
  { key: 'vat20', label: 'VAT 20%', value: TOTALS.vat20, currency: 'RSD' },
  { key: 'base10', label: 'Tax base 10%', value: TOTALS.base10, currency: 'RSD', group: true },
  { key: 'vat10', label: 'VAT 10%', value: TOTALS.vat10, currency: 'RSD' },
  {
    key: 'exempt',
    label: 'VAT-exempt deposit',
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

const PANELS: SidePanel[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    content: (
      <dl className="m-0 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-secondary">SEF</dt>
          <dd className="m-0">
            <StatusBadge label="Delivered" tone="info" />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-secondary">Sent</dt>
          <dd className="m-0 tabular-nums" dir="ltr">
            28.09.2026. 10:42
          </dd>
        </div>
      </dl>
    ),
  },
  {
    key: 'related',
    title: 'Related documents',
    count: 3,
    content: (
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
        <li>Order N-2026-0157</li>
        <li>Delivery note OTP-2026-0311</li>
        <li>Advance invoice A-2026-031</li>
      </ul>
    ),
  },
  {
    key: 'comments',
    title: 'Comments',
    count: 1,
    content: (
      <p className="bidi-content m-0 text-sm">
        Dragan Ilić: Customer asked for delivery on Friday.
      </p>
    ),
  },
  {
    key: 'history',
    title: 'History',
    content: <p className="m-0 text-sm">Issued by Milica Petrović, 28.09.2026.</p>,
  },
]

function Invoice({ phone, invoice }: { phone: boolean; invoice: ExampleInvoice }) {
  const [open, setOpen] = useState<string[]>(['delivery', 'related'])
  const [hidden, setHidden] = useState(false)
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: invoice.number }]}
      tabs={SALES_TABS}
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
            <Button family="verify" icon={Send} label="Send reminder" />
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
            mobile={{ details: ['quantity', 'price', 'vat', 'amount'] }}
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

function Dashboard({ phone }: { phone: boolean }) {
  const { linkComponent: Link } = useLiro()
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
        subtitle="Kvadrat Gradnja d.o.o. · September 2026"
        stats={[
          {
            key: 'revenue',
            label: 'Revenue, September',
            value: <MoneyText value="5684200" currency="RSD" decimals={0} />,
            change: { text: percentText('16.7', 'always'), direction: 'up', sentiment: 'good' },
            comparison: 'vs September 2025',
            trend: ['4812.4', '5230.9', '4977.1', '3906.5', '4421.8', '5684.2'],
          },
          {
            key: 'overdue',
            label: 'Overdue receivables',
            value: <MoneyText value={sum(OVERDUE.map((invoice) => invoice.open))} currency="RSD" />,
            comparison: `${String(OVERDUE.length)} invoices`,
          },
          {
            key: 'cash',
            label: 'Cash',
            value: <MoneyText value="3012775" currency="RSD" decimals={0} />,
            change: { text: percentText('36.0', 'always'), direction: 'up', sentiment: 'good' },
            comparison: 'vs 31.08.2026.',
          },
          {
            key: 'vat',
            label: 'VAT due 15.10.',
            value: <MoneyText value="612480" currency="RSD" decimals={0} />,
          },
        ]}
      >
        <BarChart {...REVENUE} />
        <LineChart {...CASH} />
        <SectionCard title="Largest open invoices" headingLevel={3} flush className="md:col-span-2">
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

function ApprovalDetail({
  row,
  onDecide,
}: {
  row: ExampleApproval
  onDecide: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="bidi-content m-0 text-h2 text-primary">{row.supplier}</h2>
          <p className="bidi-content m-0 text-sm text-secondary">
            {row.number} · requested by {row.requester}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            family="destructive"
            icon={CircleX}
            label="Reject"
            onClick={() => {
              onDecide(row.id)
            }}
          />
          <Button
            family="positive"
            icon={CheckCheck}
            label="Approve"
            emphasis="primary"
            onClick={() => {
              onDecide(row.id)
            }}
          />
        </div>
      </div>
      <KeyValueList
        columns={2}
        items={[
          { label: 'Amount', value: <MoneyText value={row.total} currency="RSD" />, numeric: true },
          { label: 'Due', value: <DueDate value={row.due} />, numeric: true },
          { label: 'Received', value: <DateText value={row.received} />, numeric: true },
          { label: 'Cost centre', value: row.costCenter },
          { label: 'Requested by', value: row.requester },
          { label: 'Goods received', value: '30.09.2026., complete' },
        ]}
      />
    </div>
  )
}

function Approvals({ phone }: { phone: boolean }) {
  const [rows, setRows] = useState(APPROVALS)
  const [selected, setSelected] = useState<string | undefined>(phone ? undefined : 'u1')
  const decide = (id: string) => {
    const index = rows.findIndex((row) => row.id === id)
    const rest = rows.filter((row) => row.id !== id)
    setRows(rest)
    setSelected(rest[Math.min(index, rest.length - 1)]?.id)
  }
  const row = rows.find((each) => each.id === selected)
  const index = rows.findIndex((each) => each.id === selected)
  const items: WorklistItem[] = rows.map((each) => ({
    id: each.id,
    title: each.supplier,
    subtitle: `${each.number} · ${each.costCenter}`,
    figure: <MoneyText value={each.total} currency="RSD" />,
    status: statusBadge(each.status),
    actions: (
      <>
        <Button
          family="destructive"
          icon={CircleX}
          label="Reject"
          emphasis="menu"
          onClick={() => {
            decide(each.id)
          }}
        />
        <Button
          family="positive"
          icon={CheckCheck}
          label="Approve"
          onClick={() => {
            decide(each.id)
          }}
        />
      </>
    ),
  }))
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Purchasing', href: '#/purchasing' }, { label: 'To approve' }]}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Supplier invoices to approve"
        label="Supplier invoices to approve"
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        {...(row === undefined ? {} : { detail: <ApprovalDetail row={row} onDecide={decide} /> })}
        onBack={() => {
          setSelected(undefined)
        }}
        onNext={() => {
          setSelected(rows[(index + 1) % rows.length]?.id)
        }}
      />
    </Shell>
  )
}

// ── Employee record form ──────────────────────────────────────────────────────────────────────

function Employee({ phone }: { phone: boolean }) {
  const [dirty, setDirty] = useState(false)
  const touched = () => {
    setDirty(true)
  }
  const columns = phone ? 1 : 2
  const actions = (
    <ActionGroup
      actions={[
        { key: 'cancel', intent: 'cancel', label: 'Cancel' },
        {
          key: 'save',
          intent: 'save',
          label: 'Save',
          onClick: () => {
            setDirty(false)
          },
        },
      ]}
    />
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Employees', href: '#/hr/employees' }, { label: EMPLOYEE.name }]}
      tabs={HR_TABS}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title={EMPLOYEE.name}
        back={{ href: '#/home', label: 'Home' }}
        status={<StatusBadge label="Active" tone="success" />}
        subtitle={`${EMPLOYEE.position} · Finance`}
        dirty={dirty}
        actions={actions}
        side={
          <section className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4">
            <h2 className="m-0 text-h5 text-primary">Leave</h2>
            <KeyValueList
              layout="stacked"
              columns={1}
              items={[
                { label: 'Days left in 2026', value: EMPLOYEE.leaveLeft, numeric: true },
                { label: 'Manager', value: EMPLOYEE.manager },
                { label: 'Last changed', value: 'Dragan Ilić, 01.07.2026.' },
              ]}
            />
          </section>
        }
      >
        <FormTabs
          label="Employee"
          items={[
            {
              value: 'personal',
              label: 'Personal',
              content: (
                <FormSection title="Personal details" columns={columns}>
                  <TextField
                    label="First name"
                    defaultValue={EMPLOYEE.firstName}
                    required
                    onChange={touched}
                  />
                  <TextField
                    label="Last name"
                    defaultValue={EMPLOYEE.lastName}
                    required
                    onChange={touched}
                  />
                  <DateField label="Date of birth" defaultValue={EMPLOYEE.birthDate} />
                  <TextField
                    label="Phone"
                    type="tel"
                    defaultValue={EMPLOYEE.phone}
                    onChange={touched}
                  />
                  <TextField
                    label="E-mail"
                    type="email"
                    defaultValue={EMPLOYEE.email}
                    onChange={touched}
                  />
                  <TextField label="Address" defaultValue={EMPLOYEE.address} onChange={touched} />
                </FormSection>
              ),
            },
            {
              value: 'employment',
              label: 'Employment',
              content: (
                <FormSection title="Employment" columns={columns}>
                  <TextField label="Position" defaultValue={EMPLOYEE.position} onChange={touched} />
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
                </FormSection>
              ),
            },
            {
              value: 'payroll',
              label: 'Payroll',
              content: (
                <FormSection title="Payroll" columns={columns}>
                  <MoneyField label="Gross salary" currency="RSD" defaultValue={EMPLOYEE.gross} />
                  <TextField
                    label="Bank account"
                    defaultValue={EMPLOYEE.account}
                    direction="ltr"
                    onChange={touched}
                  />
                </FormSection>
              ),
            },
          ]}
        />
      </RecordFormPage>
    </Shell>
  )
}

// ── Not found ─────────────────────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <StatusPage
      kind="notFound"
      brand={BRAND}
      primaryAction={{ label: 'Go to home page', href: '#/home', icon: House }}
    />
  )
}

// ── The app ───────────────────────────────────────────────────────────────────────────────────

function Screen({ path, phone }: { path: string; phone: boolean }) {
  if (path === ROUTES.signIn) return <SignIn phone={phone} />
  if (path === ROUTES.home) return <Home phone={phone} />
  if (path === ROUTES.invoices) return <InvoiceList phone={phone} />
  if (path === ROUTES.dashboard) return <Dashboard phone={phone} />
  if (path === ROUTES.approvals) return <Approvals phone={phone} />
  if (path === ROUTES.employee) return <Employee phone={phone} />
  if (path === ROUTES.invoice(FEATURED)) {
    const invoice = INVOICES.find((each) => each.number === FEATURED)
    if (invoice !== undefined) return <Invoice phone={phone} invoice={invoice} />
  }
  return <NotFound />
}

/** The examples as one application: a route, the provider with the router's link, a screen. */
function ExampleApp({ start, phone = false }: { start: string; phone?: boolean }) {
  const [path, setPath] = useState(start)
  const navigate = useCallback((next: string) => {
    setPath(next)
    window.scrollTo(0, 0)
  }, [])
  return (
    <Navigate.Provider value={navigate}>
      <ExampleProvider linkComponent={RouterLink}>
        {/* A new screen starts with fresh state, as a page of the application does. */}
        <Screen key={path} path={path} phone={phone} />
      </ExampleProvider>
    </Navigate.Provider>
  )
}

function OnPhone({ start }: { start: string }) {
  return (
    <PhoneFrame>
      <ExampleApp start={start} phone />
    </PhoneFrame>
  )
}

// ── Stories ───────────────────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Examples',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          'Liro as it will look: Kvadrat Gradnja d.o.o. on 6 October 2026, one dataset and the ' +
          'screens linked into one application — sign in, the home page, the invoice list, ' +
          'invoice F-2026-0412, the overview, supplier invoices to approve, an employee record and ' +
          'a page that does not exist. Every link goes through the provider’s ' +
          '`linkComponent`, as the Core’s router will; the screens use only `@veljaos/ui` and ' +
          '`@veljaos/ui/charts`. The interface text is English; numbers and dates are written as ' +
          'a Serbian tenant sees them. Start with "Walk-through" and click.',
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/**
 * The whole path: sign in, open Sales from the home page, preview and open F-2026-0412, back
 * to the list. The same invoice shows the same total in the list and on its page.
 */
export const WalkThrough: Story = {
  name: 'Walk-through',
  render: () => <ExampleApp start={ROUTES.signIn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await settle()
    await userEvent.click(await canvas.findByRole('link', { name: /Sales/ }))
    await settle()
    const row = await canvas.findByRole('row', { name: /F-2026-0412/ })
    await expect(row).toHaveTextContent('185.954,00')
    await userEvent.click(row)
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: 'F-2026-0412' })
    await userEvent.click(within(drawer).getByRole('button', { name: 'Open' }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'F-2026-0412' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('185.954,00')
    await expect(canvasElement).toHaveTextContent('135.954,00')
    await userEvent.click(canvas.getByRole('link', { name: 'Back to Invoices' }))
    await settle()
    await expect(await canvas.findByRole('row', { name: /F-2026-0412/ })).toBeVisible()
  },
}

/** Sign-in (AuthShell). Continue opens the home page. */
export const SignInScreen: Story = {
  name: 'Sign in',
  render: () => <ExampleApp start={ROUTES.signIn} />,
}

export const SignInPhone: Story = {
  name: 'Sign in, phone',
  render: () => <OnPhone start={ROUTES.signIn} />,
}

/** The home page: the modules; Sales, Purchasing, Overview and Employees open their examples. */
export const HomeScreen: Story = {
  name: 'Home',
  render: () => <ExampleApp start={ROUTES.home} />,
}

export const HomePhone: Story = {
  name: 'Home, phone',
  render: () => <OnPhone start={ROUTES.home} />,
}

/** The invoice list: views, filters, columns, quick preview (click), the page (Enter or Open). */
export const InvoiceListScreen: Story = {
  name: 'Invoice list',
  render: () => <ExampleApp start={ROUTES.invoices} />,
}

export const InvoiceListPhone: Story = {
  name: 'Invoice list, phone',
  render: () => <OnPhone start={ROUTES.invoices} />,
}

/** Invoice F-2026-0412: lifecycle, customer, key figures, lines with three VAT treatments, totals, panels. */
export const InvoiceScreen: Story = {
  name: 'Invoice',
  render: () => <ExampleApp start={ROUTES.invoice(FEATURED)} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Panonija Agro d.o.o.')
    await expect(canvasElement).toHaveTextContent('185.954,00')
    await expect(canvasElement).toHaveTextContent('135.954,00')
  },
}

export const InvoicePhone: Story = {
  name: 'Invoice, phone',
  render: () => <OnPhone start={ROUTES.invoice(FEATURED)} />,
}

/** The overview: numbers, charts and the largest open invoices (F-2026-0412 links to its page). */
export const DashboardScreen: Story = {
  name: 'Overview (dashboard)',
  render: () => <ExampleApp start={ROUTES.dashboard} />,
  play: async ({ canvasElement }) => {
    await settle()
    const link = within(canvasElement).getByRole('link', { name: FEATURED })
    await expect(link.closest('tr')).toHaveTextContent('Panonija Agro d.o.o.')
    await expect(link.closest('tr')).toHaveTextContent('185.954,00')
    await expect(link.closest('tr')).toHaveTextContent('135.954,00')
  },
}

export const DashboardPhone: Story = {
  name: 'Overview (dashboard), phone',
  render: () => <OnPhone start={ROUTES.dashboard} />,
}

/** Supplier invoices to approve: Approve or Reject in the row or in the detail. */
export const ApprovalsScreen: Story = {
  name: 'Supplier invoices to approve',
  render: () => <ExampleApp start={ROUTES.approvals} />,
}

export const ApprovalsPhone: Story = {
  name: 'Supplier invoices to approve, phone',
  render: () => <OnPhone start={ROUTES.approvals} />,
}

/** An employee record: tabs in the form card, sections, the bottom bar once something changes. */
export const EmployeeScreen: Story = {
  name: 'Employee record',
  render: () => <ExampleApp start={ROUTES.employee} />,
}

export const EmployeePhone: Story = {
  name: 'Employee record, phone',
  render: () => <OnPhone start={ROUTES.employee} />,
}

/** A page that does not exist (any module the examples do not have, e.g. Banking). */
export const NotFoundScreen: Story = {
  name: 'Not found (404)',
  render: () => <ExampleApp start="/banking" />,
}

export const NotFoundPhone: Story = {
  name: 'Not found (404), phone',
  render: () => <OnPhone start="/banking" />,
}

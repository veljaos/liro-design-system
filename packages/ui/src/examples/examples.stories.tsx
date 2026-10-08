import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BookOpen,
  BookmarkPlus,
  Building,
  Building2,
  ChartColumn,
  FileSpreadsheet,
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
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  ActionGroup,
  ActivityList,
  AppShell,
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
  NotificationsPanel,
  QuickPreview,
  ReasonConfirmDialog,
  RelatedDocuments,
  SectionCard,
  SelectField,
  StatusBadge,
  StatusPage,
  TextField,
  Toaster,
  toneFor,
  useLiro,
  WorklistPage,
  type ChooserColumn,
  type CommandItem,
  type DataTableColumn,
  type DataTableFilters,
  type DetailSection,
  type FilterDefinition,
  type LaunchpadModule,
  type LifecycleStep,
  type ModuleTab,
  type NotificationItem,
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
  APPROVAL_DETAILS,
  APPROVALS,
  CASH,
  EMPLOYEE,
  FEATURED,
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
  notifications: '/notifications',
}

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

const BRAND = { ...LIRO_BRAND, href: '#/home' }

/** The companies Milica works for: more than seven, so the switcher searches; one suspended. */
const COMPANIES: ShellCompany[] = [
  {
    id: 'bojovic',
    name: 'Bojović i sinovi d.o.o.',
    description: 'PIB 109773148',
    note: '12 tasks',
  },
  { id: 'drina', name: 'Drina Prevoz d.o.o.', description: 'PIB 101665092' },
  { id: 'jelic', name: 'Knjigovodstvo Jelić', description: 'PIB 110583224' },
  { id: 'kvadrat', name: 'Kvadrat Gradnja d.o.o.', description: 'PIB 108452317', note: '5 tasks' },
  { id: 'medic', name: 'Medic Lab Niš d.o.o.', description: 'PIB 107819450' },
  { id: 'panonija', name: 'Panonija Agro d.o.o.', description: 'PIB 104987265', note: '1 task' },
  {
    id: 'rakic',
    name: 'Rakić Pekara SZR',
    description: 'PIB 111296603',
    status: { label: 'Suspended', tone: 'danger' },
  },
  { id: 'stanic', name: 'Stanić Elektro STR', description: 'PIB 112048376' },
  { id: 'vojvodjanka', name: 'Vojvođanka Mlin a.d.', description: 'PIB 100421987' },
]

/** Milica's notifications on 6 October 2026: two unread; the links open the example screens. */
const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'UF-2026-1187 from EPS Snabdevanje waits for your approval',
    company: 'Kvadrat Gradnja d.o.o.',
    companyId: 'kvadrat',
    type: 'approvals',
    at: '2026-10-06T10:14:00+02:00',
    href: '#/purchasing/approvals',
    read: false,
  },
  {
    id: 'n2',
    title: 'F-2026-0411 to Drina Prevoz d.o.o. is 3 days overdue',
    company: 'Kvadrat Gradnja d.o.o.',
    companyId: 'kvadrat',
    type: 'documents',
    at: '2026-10-06T07:00:00+02:00',
    href: '#/sales/invoices',
    read: false,
  },
  {
    id: 'n3',
    title: 'Dragan Ilić commented on F-2026-0412',
    body: '“Customer asked for delivery on Friday.”',
    company: 'Kvadrat Gradnja d.o.o.',
    companyId: 'kvadrat',
    type: 'mentions',
    at: '2026-10-05T15:20:00+02:00',
    href: '#/sales/invoices/F-2026-0412',
    read: true,
  },
  {
    id: 'n4',
    title: 'Jelena Marković asked for leave, 13.–17.10.2026.',
    company: 'Kvadrat Gradnja d.o.o.',
    companyId: 'kvadrat',
    type: 'approvals',
    at: '2026-10-05T09:31:00+02:00',
    href: `#/hr/employees/${EMPLOYEE.id}`,
    read: true,
  },
  {
    id: 'n5',
    title: 'UF-2026-0877 from Elektrovojvodina waits for your approval',
    company: 'Panonija Agro d.o.o.',
    companyId: 'panonija',
    type: 'approvals',
    at: '2026-10-02T13:05:00+02:00',
    href: '#/purchasing/approvals',
    read: true,
  },
  {
    id: 'n6',
    title: 'Bank statement 187 imported: 14 payments matched',
    company: 'Kvadrat Gradnja d.o.o.',
    companyId: 'kvadrat',
    type: 'system',
    at: '2026-10-02T07:40:00+02:00',
    href: '#/banking',
    read: true,
  },
]

const NOTIFICATION_TYPES = [
  { value: 'approvals', label: 'Approvals' },
  { value: 'documents', label: 'Documents and SEF' },
  { value: 'mentions', label: 'Mentions and comments' },
  { value: 'system', label: 'System' },
]

/** The read state of the notifications, kept by the application across its screens. */
const Notifications = createContext<{
  items: NotificationItem[]
  /** An id, or 'all'. */
  setRead: (id: string, read: boolean) => void
}>({ items: NOTIFICATIONS, setRead: () => undefined })

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
  const notifications = useContext(Notifications)
  const unread = notifications.items.filter((item) => !item.read).length
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
    {
      id: 'go-notifications',
      label: 'Notifications',
      group: 'navigation',
      onSelect: () => {
        navigate(ROUTES.notifications)
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
        unread,
        panel: (
          <NotificationsPanel
            items={notifications.items.slice(0, 5)}
            unread={unread}
            viewAllHref={`#${ROUTES.notifications}`}
            onOpen={(item) => {
              notifications.setRead(item.id, true)
            }}
            onMarkAllRead={() => {
              notifications.setRead('all', true)
            }}
          />
        ),
      }}
      companies={{
        items: COMPANIES,
        pinned: ['kvadrat', 'panonija'],
        recent: ['bojovic', 'medic'],
        current: 'kvadrat',
        onSelect: () => undefined,
      }}
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

function Invoice({ phone, invoice }: { phone: boolean; invoice: ExampleInvoice }) {
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

function Dashboard({ phone }: { phone: boolean }) {
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

function Approvals({ phone }: { phone: boolean }) {
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
function Employee({ phone }: { phone: boolean }) {
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

// ── Notifications ─────────────────────────────────────────────────────────────────────────────

function NotificationsScreen({ phone }: { phone: boolean }) {
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

// ── The app ───────────────────────────────────────────────────────────────────────────────────

function Screen({ path, phone }: { path: string; phone: boolean }) {
  if (path === ROUTES.signIn) return <SignIn phone={phone} />
  if (path === ROUTES.home) return <Home phone={phone} />
  if (path === ROUTES.invoices) return <InvoiceList phone={phone} />
  if (path === ROUTES.dashboard) return <Dashboard phone={phone} />
  if (path === ROUTES.approvals) return <Approvals phone={phone} />
  if (path === ROUTES.employee) return <Employee phone={phone} />
  if (path === ROUTES.notifications) return <NotificationsScreen phone={phone} />
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
  // The notifications' read state lives above the screens, as the Core keeps it.
  const [items, setItems] = useState(NOTIFICATIONS)
  const setRead = useCallback((id: string, read: boolean) => {
    setItems((list) =>
      list.map((item) => (id === 'all' || item.id === id ? { ...item, read } : item)),
    )
  }, [])
  return (
    <Navigate.Provider value={navigate}>
      <Notifications.Provider value={{ items, setRead }}>
        <ExampleProvider linkComponent={RouterLink}>
          {/* A new screen starts with fresh state, as a page of the application does. */}
          <Screen key={path} path={path} phone={phone} />
        </ExampleProvider>
      </Notifications.Provider>
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
          'invoice F-2026-0412, the overview, supplier invoices to approve, an employee record, ' +
          'the notifications (the bell’s "View all") and a page that does not exist. Every link goes through the provider’s ' +
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
    // The bell: the panel, then "View all" opens the notifications page.
    await userEvent.click(canvas.getByRole('button', { name: 'Notifications, 2 unread' }))
    await settle()
    await userEvent.click(within(document.body).getByRole('link', { name: 'View all' }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Notifications' }),
    ).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible()
    // Opening a notification goes to its record and marks it read.
    await userEvent.click(canvas.getByRole('link', { name: /UF-2026-1187 from EPS Snabdevanje/ }))
    await settle()
    await expect(
      await canvas.findByRole('button', { name: 'Notifications, 1 unread' }),
    ).toBeVisible()
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

/**
 * Supplier invoices to approve: the decisions only in the detail (Reject, then Approve), with the
 * invoice's lines and PDF; checked rows get the bulk bar.
 */
export const ApprovalsScreen: Story = {
  name: 'Supplier invoices to approve',
  render: () => <ExampleApp start={ROUTES.approvals} />,
}

/**
 * Deciding: Approve opens the next invoice and confirms with a toast that offers Undo; Reject
 * asks for the reason first, and its toast has no Undo (the rejection goes to SEF).
 */
export const ApprovalsDecide: Story = {
  name: 'Supplier invoices to approve, deciding',
  render: () => <ExampleApp start={ROUTES.approvals} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await expect(canvas.getByRole('heading', { name: 'EPS Snabdevanje d.o.o.' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    await expect(await canvas.findByRole('heading', { name: 'Telekom Srbija a.d.' })).toBeVisible()
    await waitFor(async () => {
      await expect(page.getByText('UF-2026-1187 approved.')).toBeVisible()
    })
    await userEvent.click(page.getByRole('button', { name: 'Undo' }))
    await expect(
      await canvas.findByRole('heading', { name: 'EPS Snabdevanje d.o.o.' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }))
    const dialog = within(await page.findByRole('alertdialog'))
    const confirm = dialog.getByRole('button', { name: 'Reject' })
    await expect(confirm).toBeDisabled()
    await userEvent.click(dialog.getByRole('radio', { name: 'Price differs from the order' }))
    await userEvent.click(confirm)
    await expect(await canvas.findByRole('heading', { name: 'Telekom Srbija a.d.' })).toBeVisible()
    await waitFor(async () => {
      await expect(page.getByText('UF-2026-1187 rejected.')).toBeVisible()
    })
    // The pictures are taken without toasts, which come and go with time.
    notice.dismiss()
    await waitFor(async () => {
      await expect(page.queryByText('UF-2026-1187 rejected.')).toBeNull()
    })
  },
}

export const ApprovalsPhone: Story = {
  name: 'Supplier invoices to approve, phone',
  render: () => <OnPhone start={ROUTES.approvals} />,
}

/** On a phone: the invoice full width, each label above its value, the decisions in the bottom bar. */
export const ApprovalPhoneDetail: Story = {
  name: 'Supplier invoice to approve, phone',
  render: () => <OnPhone start={ROUTES.approvals} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /EPS Snabdevanje/ }))
    await settle()
    await expect(canvas.getByRole('heading', { name: 'EPS Snabdevanje d.o.o.' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeVisible()
  },
}

/** The first ancestor that has a box of its own (`display: contents` elements have none). */
function boxAround(element: Element | null): Element | null {
  let parent = element?.parentElement ?? null
  while (parent !== null && parent.getBoundingClientRect().width === 0)
    parent = parent.parentElement
  return parent
}

/**
 * Approve on a phone: the toast spans the screen less 16px at each side and stands above the
 * bottom action bar, never over Reject and Approve (P4.9d).
 */
export const ApprovalPhoneToast: Story = {
  name: 'Supplier invoice to approve, phone, approved',
  render: () => <OnPhone start={ROUTES.approvals} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: /EPS Snabdevanje/ }))
    await settle()
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    const text = await page.findByText('UF-2026-1187 approved.')
    // The phone frame: the first box around the shell (the provider's root has no box of its own).
    const frame = boxAround(canvasElement.querySelector('[data-slot="app-shell"]'))
    const bar = canvasElement.querySelector('[data-slot="shell-bottom-bar"]')
    await waitFor(async () => {
      const toast = text.closest('li')?.getBoundingClientRect()
      const screen = frame?.getBoundingClientRect()
      const actions = bar?.getBoundingClientRect()
      await expect(toast !== undefined && screen !== undefined && actions !== undefined).toBe(true)
      if (toast === undefined || screen === undefined || actions === undefined) return
      await expect(Math.round(toast.left - screen.left)).toBe(16)
      await expect(Math.round(screen.right - toast.right)).toBe(16)
      await expect(toast.bottom).toBeLessThanOrEqual(actions.top - 16 + 1)
    })
    // The pictures are taken without toasts, which come and go with time.
    notice.dismiss()
    await waitFor(async () => {
      await expect(page.queryByText('UF-2026-1187 approved.')).toBeNull()
    })
  },
}

/**
 * An employee's record: header, key figures, then Personal, Employment, Leave and Payroll as
 * text; one Edit turns the whole record into fields.
 */
export const EmployeeScreen: Story = {
  name: 'Employee record',
  render: () => <ExampleApp start={ROUTES.employee} />,
}

/** Edit: the same sections as fields (Leave stays read-only), Cancel and Save in the bottom bar. */
export const EmployeeEdit: Story = {
  name: 'Employee record, editing',
  render: () => <ExampleApp start={ROUTES.employee} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await settle()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Address' }), ', stan 4')
    await expect(canvas.getByText('Unsaved changes')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible()
  },
}

export const EmployeePhone: Story = {
  name: 'Employee record, phone',
  render: () => <OnPhone start={ROUTES.employee} />,
}

/** A page that does not exist (any module the examples do not have, e.g. Banking). */
/** Every notification of every company, grouped by day, with filters (from the bell's "View all"). */
export const NotificationsExample: Story = {
  name: 'Notifications',
  render: () => <ExampleApp start={ROUTES.notifications} />,
}

export const NotificationsPhone: Story = {
  name: 'Notifications, phone',
  render: () => <OnPhone start={ROUTES.notifications} />,
}

export const NotFoundScreen: Story = {
  name: 'Not found (404)',
  render: () => <ExampleApp start="/banking" />,
}

export const NotFoundPhone: Story = {
  name: 'Not found (404), phone',
  render: () => <OnPhone start="/banking" />,
}

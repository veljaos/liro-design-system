import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Banner } from '../components/alert'
import { Button } from '../components/button'
import { DataTable, type DataTableColumn } from '../components/data-table'
import { DateText, MoneyText } from '../components/display-text'
import { StatusBadge, toneFor } from '../components/status-badge'
import { settle } from '../primitives/story-helpers'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { AppShell, type AppShellProps } from './app-shell'
import {
  BRAND,
  COMMANDS,
  COMPANIES,
  CRUMBS,
  INVOICES,
  MANY_COMPANIES,
  SALES_TABS,
  USER,
  type InvoiceRow,
} from './shell-story-data'

const TONES = {
  Draft: 'neutral',
  Sent: 'info',
  Paid: 'success',
  Overdue: 'danger',
  'Partially paid': 'warning',
} as const

const COLUMNS: DataTableColumn<InvoiceRow>[] = [
  { id: 'number', header: 'Number', cell: (row) => row.number },
  { id: 'customer', header: 'Customer', cell: (row) => row.customer },
  { id: 'issued', header: 'Issued', numeric: true, cell: (row) => <DateText value={row.issued} /> },
  { id: 'due', header: 'Due', numeric: true, cell: (row) => <DateText value={row.due} /> },
  {
    id: 'total',
    header: 'Total',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.total} currency="RSD" />,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge label={row.status} tone={toneFor(row.status, TONES)} />,
  },
]

/** A plain page inside the shell: the title and a short table (the list templates are P4.3). */
function SamplePage({ phone = false }: { phone?: boolean }) {
  return (
    <div
      className={
        phone
          ? 'box-border flex w-full flex-col gap-4 p-4'
          : 'mx-auto box-border flex w-full max-w-content flex-col gap-4 p-6'
      }
    >
      <h1 className="m-0 text-h1 text-primary">Invoices</h1>
      <DataTable
        label="Invoices"
        columns={COLUMNS}
        rows={INVOICES}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.number}
        layout={phone ? 'cards' : 'table'}
        mobile={{
          subtitle: (row) => row.customer,
          badge: (row) => <StatusBadge label={row.status} tone={toneFor(row.status, TONES)} />,
          details: ['due', 'total'],
        }}
      />
    </div>
  )
}

function NotificationsPanel() {
  return (
    <div className="flex w-72 flex-col gap-3 text-sm">
      <h2 className="m-0 text-h5">3 unread</h2>
      <p className="m-0">F-2026-0411 is 3 days overdue.</p>
      <p className="m-0">SEF accepted F-2026-0409.</p>
      <p className="m-0">Dragan Ilić approved order N-2026-0157.</p>
    </div>
  )
}

const BASE: AppShellProps = {
  brand: BRAND,
  breadcrumbs: CRUMBS,
  commands: { items: COMMANDS },
  notifications: { unread: 3, panel: <NotificationsPanel /> },
  companies: { items: COMPANIES, current: 'kvadrat', onSelect: () => undefined },
  user: USER,
  moduleTabs: SALES_TABS,
  children: <SamplePage />,
}

const meta = {
  title: 'Templates/AppShell',
  component: AppShell,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the frame of every Liro screen. The header (56px): the brand lockup as ' +
          'a link home, breadcrumbs, then search (opens the command palette, Ctrl/Cmd+K), ' +
          'notifications (a red dot while anything is unread, the count in its name), the ' +
          'company switcher and the user menu. A module adds its tabs as a second row (96px in ' +
          'all), centred. Slots for the impersonation bar, environment marker and offline ' +
          'indicator. On phones the lockup drops the product name, the breadcrumbs go, the ' +
          'company switcher moves into the user menu, and `bottomBar` holds the main action ' +
          'within thumb reach.\n\n' +
          '**How:** data through props (`brand`, `companies`, `user`, `notifications`, ' +
          '`moduleTabs`, `commands`); the page is `children`. Links use the provider’s ' +
          '`linkComponent`.\n\n' +
          '**When not:** there is no sidebar navigation, ever: the launchpad and module tabs ' +
          'navigate (Appendix B.8). Sign-in and status pages use AuthShell and the status pages ' +
          '(P4.7).',
      },
    },
  },
  args: BASE,
  render: (args) => (
    <ExampleProvider>
      <AppShell {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof AppShell>

export default meta

type Story = StoryObj<typeof meta>

/** Inside a module: breadcrumbs and the module's tabs. */
export const Default: Story = {
  args: { layout: 'desktop' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Liro Business Apps' })).toBeVisible()
    const tabs = within(canvas.getByRole('navigation', { name: 'Module' }))
    await expect(tabs.getByRole('link', { name: 'Invoices' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByRole('button', { name: 'Notifications, 3 unread' })).toBeVisible()
  },
}

/** At the launchpad: no breadcrumbs, no module tabs, nothing unread (no dot). */
export const Home: Story = {
  args: {
    layout: 'desktop',
    breadcrumbs: [],
    moduleTabs: [],
    notifications: { unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Notifications' })).toBeVisible()
    await expect(canvasElement.querySelector('[data-slot="notification-dot"]')).toBeNull()
  },
}

/** The company switcher open: the current company checked, waiting counts at the end. */
export const CompanySwitcher: Story = {
  name: 'Company switcher',
  args: { layout: 'desktop' },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Switch company: Kvadrat Gradnja d.o.o.' }),
    )
    await settle()
    const list = within(document.body).getByRole('listbox', { name: 'Companies' })
    await expect(within(list).getAllByRole('option')).toHaveLength(3)
  },
}

/** More than seven companies: a search field by name or tax number. */
export const ManyCompanies: Story = {
  name: 'Many companies',
  args: {
    layout: 'desktop',
    companies: { items: MANY_COMPANIES, current: 'kvadrat', onSelect: () => undefined },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Switch company: Kvadrat Gradnja d.o.o.' }),
    )
    await settle()
    const body = within(document.body)
    await userEvent.type(body.getByRole('combobox', { name: 'Find company' }), '10781')
    await expect(body.getAllByRole('option')).toHaveLength(1)
    await expect(body.getByRole('option')).toHaveTextContent('Medic Lab Niš d.o.o.')
  },
}

/** The user menu: name and e-mail, then the entries. */
export const UserMenu: Story = {
  name: 'User menu',
  args: { layout: 'desktop' },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Account' }))
    await settle()
    await expect(within(document.body).getByRole('menuitem', { name: 'Sign out' })).toBeVisible()
  },
}

/** The search button opens the command palette; on a Mac the application gives "⌘K". */
export const Search: Story = {
  args: { layout: 'desktop', searchShortcut: '⌘K' },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Search…' }))
    await settle()
    await expect(within(document.body).getByRole('dialog')).toBeVisible()
  },
}

/** The slots of P5.3: impersonation bar above, environment marker after the brand, offline. */
export const Slots: Story = {
  args: {
    layout: 'desktop',
    impersonationBar: (
      <Banner tone="warning" title="Viewing as Milica Petrović." className="rounded-none">
        Support session, read-only, ends at 14:30.
      </Banner>
    ),
    environmentMarker: <StatusBadge label="Sandbox" tone="premium" withBorder />,
    offlineIndicator: (
      <Banner tone="neutral" title="Offline." className="rounded-none border-x-0 border-t-0">
        Changes are kept on this device and sent when the connection returns.
      </Banner>
    ),
  },
}

/** Long names: the company and the crumbs stay on one line. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    layout: 'desktop',
    breadcrumbs: [
      { label: 'Accounting', href: '#a' },
      { label: 'Fixed assets and depreciation', href: '#b' },
      { label: 'Depreciation run for business year 2025/26' },
    ],
    companies: {
      items: [
        {
          id: 'long',
          name: 'Poljoprivredno-industrijski kombinat Banat Agrar d.o.o.',
          description: 'PIB 103877512',
        },
      ],
      current: 'long',
      onSelect: () => undefined,
    },
  },
}

/** Phone width: compact lockup, icon search, companies in the user menu, the bottom bar. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <AppShell
          {...args}
          layout="phone"
          bottomBar={<Button intent="create" label="New invoice" />}
          children={<SamplePage phone />}
        />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Phone width, the user menu open: the companies inside it. */
export const PhoneUserMenu: Story = {
  name: 'Phone user menu',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <AppShell
          {...args}
          layout="phone"
          bottomBar={<Button intent="create" label="New invoice" />}
          children={<SamplePage phone />}
        />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Account' }))
    await settle()
    await expect(
      within(document.body).getByRole('menuitem', { name: 'Panonija Agro d.o.o.' }),
    ).toBeVisible()
  },
}

/** Arabic module and crumb names in a right-to-left page. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <AppShell {...args} />
      </ExampleProvider>
    </StoryProvider>
  ),
  args: {
    layout: 'desktop',
    breadcrumbs: [{ label: 'المبيعات', href: '#s' }, { label: 'الفواتير' }],
    moduleTabs: [
      { key: 'i', label: 'الفواتير', href: '#i', current: true },
      { key: 'c', label: 'العملاء', href: '#c' },
      { key: 'r', label: 'التقارير', href: '#r' },
    ],
  },
}

/** Japanese module and crumb names. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <AppShell {...args} />
      </ExampleProvider>
    </StoryProvider>
  ),
  args: {
    layout: 'desktop',
    breadcrumbs: [{ label: '販売', href: '#s' }, { label: '請求書' }],
    moduleTabs: [
      { key: 'i', label: '請求書', href: '#i', current: true },
      { key: 'c', label: '顧客', href: '#c' },
      { key: 'r', label: 'レポート', href: '#r' },
    ],
  },
}

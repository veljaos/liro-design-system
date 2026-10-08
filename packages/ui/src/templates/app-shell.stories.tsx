import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Banner } from '../components/alert'
import { Button } from '../components/button'
import { DataTable, type DataTableColumn } from '../components/data-table'
import { DateText, MoneyText } from '../components/display-text'
import { StatusBadge, toneFor } from '../components/status-badge'
import { settle } from '../primitives/story-helpers'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { AppShell, type AppShellProps } from './app-shell'
import { NotificationsPanel } from './notifications-panel'
import {
  BRAND,
  COMMANDS,
  COMPANIES,
  CRUMBS,
  FIVE_THOUSAND_COMPANIES,
  INVOICES,
  MANY_COMPANIES,
  NOTIFICATIONS,
  PINNED_COMPANIES,
  RECENT_COMPANIES,
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

/** The bell's panel: the five most recent notifications of the stories' data. */
const PANEL = (
  <NotificationsPanel
    items={NOTIFICATIONS.slice(0, 5)}
    unread={3}
    viewAllHref="#notifications"
    onMarkAllRead={() => undefined}
  />
)

const BASE: AppShellProps = {
  brand: BRAND,
  breadcrumbs: CRUMBS,
  commands: { items: COMMANDS },
  notifications: { unread: 3, panel: PANEL },
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
          'notifications (a red dot while anything is unread, never a number; the panel lists ' +
          'the recent ones with "Mark all as read" and "View all"), the company switcher ' +
          '(searchable by name or tax number, pinned and recent first, virtualised for thousands, ' +
          'suspended companies marked; also "Switch company…" in the command palette) and the ' +
          'user menu (all entries neutral, sign-out too). Breadcrumbs only from two levels. A module adds its tabs as a second row (96px in ' +
          'all), centred. Slots for the impersonation bar, environment marker and offline ' +
          'indicator. On phones the lockup drops the product name, the breadcrumbs go, the ' +
          'company switcher becomes an entry of the user menu that opens a full-screen sheet ' +
          'with the search at the top, module tabs that do not fit scroll and fade at the edge, ' +
          'and `bottomBar` holds the main action within thumb reach.\n\n' +
          '**How:** data through props (`brand`, `companies`, `user`, `notifications`, ' +
          '`moduleTabs`, `commands`); companies with `pinned` and `recent` ids, a `status` and ' +
          'a `note` written by the application ("5 tasks"); the page is `children`. Links use ' +
          'the provider’s ' +
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

/** The bell's panel: recent notifications, the unread count, Mark all as read, View all. */
export const Notifications: Story = {
  args: { layout: 'desktop' },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Notifications, 3 unread' }),
    )
    await settle()
    const body = within(document.body)
    await expect(body.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    await expect(body.getByText('3 unread')).toBeVisible()
    await expect(body.getByRole('link', { name: 'View all' })).toBeVisible()
    await expect(body.getByRole('button', { name: 'Mark all as read' })).toBeVisible()
  },
}

/** One level is no trail: no breadcrumbs (the page's title says where the user is). */
export const OneLevel: Story = {
  name: 'One level, no breadcrumbs',
  args: { layout: 'desktop', breadcrumbs: [{ label: 'Overview' }], moduleTabs: [] },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).queryByRole('navigation', { name: 'Breadcrumbs' }),
    ).toBeNull()
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

/** The company switcher open: the current company checked, the application's notes at the end. */
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
    await expect(within(list).getAllByRole('option')[0]).toHaveTextContent('3 tasks')
  },
}

/**
 * More than seven companies: a search field by name or tax number; pinned first, then recent,
 * then all; a suspended and an inactive company marked.
 */
export const ManyCompanies: Story = {
  name: 'Many companies',
  args: {
    layout: 'desktop',
    companies: {
      items: MANY_COMPANIES,
      pinned: PINNED_COMPANIES,
      recent: RECENT_COMPANIES,
      current: 'kvadrat',
      onSelect: () => undefined,
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Switch company: Kvadrat Gradnja d.o.o.' }),
    )
    await settle()
    const body = within(document.body)
    const options = body.getAllByRole('option')
    await expect(options[0]).toHaveTextContent('Kvadrat Gradnja d.o.o.')
    await expect(options[1]).toHaveTextContent('Medic Lab Niš d.o.o.')
    await expect(options[2]).toHaveTextContent('Bojović i sinovi d.o.o.')
    await expect(body.getByRole('option', { name: /Rakić Pekara SZR/ })).toHaveTextContent(
      'Suspended',
    )
    const search = body.getByRole('combobox', { name: 'Find company' })
    await userEvent.type(search, '10781')
    await expect(body.getAllByRole('option')).toHaveLength(1)
    await expect(body.getByRole('option')).toHaveTextContent('Medic Lab Niš d.o.o.')
    await userEvent.clear(search)
    await userEvent.type(search, 'Beograd')
    await expect(await body.findByText('No company matches “Beograd”.')).toBeVisible()
  },
}

/** Opens the phone company sheet from the user menu. */
async function openCompanySheet(canvasElement: HTMLElement) {
  await settle()
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Account' }))
  await settle()
  await userEvent.click(
    within(document.body).getByRole('menuitem', {
      name: 'Switch company: Kvadrat Gradnja d.o.o.',
    }),
  )
  await settle()
}

/**
 * An accountant's 5,000 companies: only the rows in view are in the page, the search answers at
 * once, and the arrow keys move through the list (End reaches the last company).
 */
export const FiveThousandCompanies: Story = {
  name: '5,000 companies',
  args: {
    layout: 'desktop',
    companies: {
      items: FIVE_THOUSAND_COMPANIES,
      pinned: ['c17', 'c2048'],
      recent: ['c311', 'c4020', 'c9'],
      current: 'c311',
      onSelect: () => undefined,
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const current = FIVE_THOUSAND_COMPANIES.find((company) => company.id === 'c311')?.name ?? ''
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: `Switch company: ${current}` }),
    )
    await settle()
    const body = within(document.body)
    // Virtualised: far fewer rows in the page than companies.
    await expect(body.getAllByRole('option').length).toBeLessThan(60)
    const search = body.getByRole('combobox', { name: 'Find company' })
    await userEvent.type(search, 'morava agro')
    await settle()
    const found = body.getAllByRole('option')
    await expect(found.length).toBeGreaterThan(0)
    await expect(found[0]).toHaveTextContent(/Morava Agro/)
    await userEvent.keyboard('{ArrowDown}')
    await expect(search.getAttribute('aria-activedescendant')).toBe(found[1]?.id ?? found[0]?.id)
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

/** Phone width, the user menu open: "Switch company" inside it, every entry neutral. */
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
      within(document.body).getByRole('menuitem', {
        name: 'Switch company: Kvadrat Gradnja d.o.o.',
      }),
    ).toBeVisible()
  },
}

/** Phones: the company switcher is a full-screen sheet, the search field at the top. */
export const PhoneCompanySheet: Story = {
  name: 'Phone company switcher',
  args: {
    companies: {
      items: MANY_COMPANIES,
      pinned: PINNED_COMPANIES,
      recent: RECENT_COMPANIES,
      current: 'kvadrat',
      onSelect: () => undefined,
    },
  },
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
    await openCompanySheet(canvasElement)
    const sheet = within(document.body).getByRole('dialog', { name: 'Switch company' })
    await expect(within(sheet).getByRole('combobox', { name: 'Find company' })).toHaveFocus()
    // A true full-screen sheet: it covers the whole frame, the bottom bar included.
    // The phone frame: the first box around the shell (the provider's root has no box of its own).
    let frame = canvasElement.querySelector('[data-slot="app-shell"]')?.parentElement ?? null
    while (frame !== null && frame.getBoundingClientRect().width === 0) frame = frame.parentElement
    const covered = frame?.getBoundingClientRect()
    const box = (await within(document.body).findByRole('dialog')).getBoundingClientRect()
    await expect(covered).toBeDefined()
    await expect(Math.round(box.top)).toBe(Math.round(covered?.top ?? -1))
    await expect(Math.round(box.bottom)).toBe(Math.round(covered?.bottom ?? -1))
    await expect(Math.round(box.width)).toBe(Math.round(covered?.width ?? -1))
  },
}

/** Many module tabs on a phone: the row scrolls and fades at the edge with more past it. */
export const PhoneScrollingTabs: Story = {
  name: 'Phone, scrolling module tabs',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <AppShell {...args} layout="phone" children={<SamplePage phone />} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  args: { breadcrumbs: [] },
  play: async ({ canvasElement }) => {
    await settle()
    const tabs = within(canvasElement).getByRole('navigation', { name: 'Module' })
    await expect(tabs).toHaveAttribute('data-fade')
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

/** Escape closes the phone company sheet and the focus returns to the user menu's button. */
export const PhoneCompanySheetEscape: Story = {
  ...PhoneCompanySheet,
  name: 'Phone company switcher, Escape',
  play: async ({ canvasElement }) => {
    await openCompanySheet(canvasElement)
    await userEvent.keyboard('{Escape}')
    await settle()
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await waitFor(() =>
      expect(within(canvasElement).getByRole('button', { name: 'Account' })).toHaveFocus(),
    )
  },
}

import { Building2, House, LogOut, UserRound } from 'lucide-react'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import {
  AppShell,
  NotificationsPanel,
  StatusBadge,
  StatusPage,
  toneFor,
  type CommandItem,
  type ModuleTab,
  type NotificationItem,
  type ShellCompany,
  type ShellUser,
} from '@veljaos/ui'
import { LIRO_BRAND } from '../../../../packages/ui/src/components/story-brand'
import { EMPLOYEE } from './examples-story-data'

/*
 * The example screens (P4.8): Liro as it will look, one company and one dataset, the screens
 * linked into one walk-through. They use only the public entry points — `@veljaos/ui` and
 * `@veljaos/ui/charts` — as the Core will. Navigation goes through the provider's
 * `linkComponent`: a link to "#/…" changes the example's route instead of the page (the Core
 * passes its router's link the same way).
 */

// ── The router ────────────────────────────────────────────────────────────────────────────────

export const Navigate = createContext<(path: string) => void>(() => undefined)

/** The provider's link component: "#/path" links move inside the examples. */
export function RouterLink({ href, onClick, children, ...props }: ComponentProps<'a'>) {
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

export const ROUTES = {
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

export const BRAND = { ...LIRO_BRAND, href: '#/home' }

/** The companies Milica works for: more than seven, so the switcher searches; one suspended. */
export const COMPANIES: ShellCompany[] = [
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
export const NOTIFICATIONS: NotificationItem[] = [
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

export const NOTIFICATION_TYPES = [
  { value: 'approvals', label: 'Approvals' },
  { value: 'documents', label: 'Documents and SEF' },
  { value: 'mentions', label: 'Mentions and comments' },
  { value: 'system', label: 'System' },
]

/** The read state of the notifications, kept by the application across its screens. */
export const Notifications = createContext<{
  items: NotificationItem[]
  /** An id, or 'all'. */
  setRead: (id: string, read: boolean) => void
}>({ items: NOTIFICATIONS, setRead: () => undefined })

export const SALES_TABS: ModuleTab[] = [
  { key: 'invoices', label: 'Invoices', href: '#/sales/invoices', current: true },
  { key: 'quotes', label: 'Quotes', href: '#/sales/quotes' },
  { key: 'orders', label: 'Orders', href: '#/sales/orders' },
  { key: 'customers', label: 'Customers', href: '#/sales/customers' },
  { key: 'reports', label: 'Reports', href: '#/sales/reports' },
]

export const HR_TABS: ModuleTab[] = [
  { key: 'employees', label: 'Employees', href: '#/hr/employees', current: true },
  { key: 'leave', label: 'Leave', href: '#/hr/leave' },
  { key: 'contracts', label: 'Contracts', href: '#/hr/contracts' },
]

export const TONES = {
  Draft: 'neutral',
  Sent: 'info',
  Paid: 'success',
  Overdue: 'danger',
  'Partially paid': 'warning',
  Cancelled: 'neutral',
  'To approve': 'warning',
  'Query sent': 'info',
} as const

export function statusBadge(status: keyof typeof TONES) {
  return <StatusBadge label={status} tone={toneFor(status, TONES)} />
}

/** Kvadrat Gradnja d.o.o.: the company of the walk-through. */
export const HOME_COMPANY = 'kvadrat'

/**
 * The shell around every signed-in screen. `company` is the current company (another one for
 * Stanić Elektro STR's setup; choosing Kvadrat Gradnja there goes home); `agent` is the agent
 * button (P5.3).
 */
export function Shell({
  phone,
  crumbs,
  tabs,
  bottomBar,
  company = HOME_COMPANY,
  agent,
  children,
}: {
  phone: boolean
  crumbs?: { label: string; href?: string }[]
  tabs?: ModuleTab[]
  bottomBar?: ReactNode
  company?: string
  agent?: ReactNode
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
        current: company,
        onSelect: (id) => {
          if (id === HOME_COMPANY && company !== HOME_COMPANY) navigate(ROUTES.home)
        },
      }}
      user={user}
      {...(tabs === undefined ? {} : { moduleTabs: tabs })}
      {...(bottomBar === undefined ? {} : { bottomBar })}
      {...(agent === undefined ? {} : { agent })}
    >
      {children}
    </AppShell>
  )
}

// ── Not found ─────────────────────────────────────────────────────────────────────────────────

export function NotFound() {
  return (
    <StatusPage
      kind="notFound"
      brand={BRAND}
      primaryAction={{ label: 'Go to home page', href: '#/home', icon: House }}
    />
  )
}

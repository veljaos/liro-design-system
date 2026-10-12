import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { filterNotifications, type NotificationItem } from './notifications-logic'
import { NotificationsPage, type NotificationsPageProps } from './notifications-page'
import { NotificationsPanel } from './notifications-panel'
import { NOTIFICATION_COMPANIES, NOTIFICATION_TYPES, NOTIFICATIONS } from './shell-story-data'

/**
 * The page as an application uses it: it keeps the read state and the filters, and filters on
 * the device with `filterNotifications` (the Core usually filters on the server).
 */
function Demo({
  initial = NOTIFICATIONS,
  show: initialShow = 'all',
  companies: initialCompanies = [],
  loading = false,
  layout = 'desktop',
}: {
  initial?: NotificationItem[]
  show?: 'all' | 'unread'
  companies?: string[]
  loading?: boolean
  layout?: 'desktop' | 'phone'
}) {
  const [items, setItems] = useState(initial)
  const [show, setShow] = useState<'all' | 'unread'>(initialShow)
  const [companies, setCompanies] = useState<string[]>(initialCompanies)
  const [types, setTypes] = useState<string[]>([])
  const read = (id: string, value: boolean) => {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, read: value } : item)))
  }
  const props: NotificationsPageProps = {
    title: 'Notifications',
    items: filterNotifications(items, { unreadOnly: show === 'unread', companies, types }),
    unread: items.filter((item) => !item.read).length,
    show,
    onShowChange: setShow,
    companyFilter: {
      label: 'Company',
      options: NOTIFICATION_COMPANIES,
      value: companies,
      onChange: setCompanies,
    },
    typeFilter: { label: 'Type', options: NOTIFICATION_TYPES, value: types, onChange: setTypes },
    onOpen: (item) => {
      read(item.id, true)
    },
    onReadChange: (item, value) => {
      read(item.id, value)
    },
    onMarkAllRead: () => {
      setItems((list) => list.map((item) => ({ ...item, read: true })))
    },
    onClearFilters: () => {
      setShow('all')
      setCompanies([])
      setTypes([])
    },
    settingsHref: '#settings/notifications',
    loading,
    layout,
  }
  return <NotificationsPage {...props} />
}

const meta = {
  title: 'Templates/NotificationsPage',
  component: NotificationsPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** every notification of the user, across all their companies — where ' +
          '"View all" in the bell’s panel (NotificationsPanel) leads. Grouped by day (Today, ' +
          'Yesterday, then the date); All / Unread; filters by company (searchable) and by type ' +
          '(the application’s: approvals, documents and SEF, mentions and comments, system); ' +
          'each notification shows its company and time, its title is a link to the record ' +
          '(opening it marks it read), and a small button marks it read or unread. "Mark all as ' +
          'read" and the "Notification settings" link stand in the header.\n\n' +
          '**How:** the page shows what it is given — the application filters (on the server, ' +
          'or with `filterNotifications`) and keeps the read state through the callbacks. ' +
          'Times come from `format.time`, days from the provider’s `today`.\n\n' +
          '**When not:** for the few recent ones, the bell’s NotificationsPanel. A notification ' +
          'is not a task list: work to do belongs in a worklist.',
      },
    },
  },
  args: {
    title: 'Notifications',
    items: NOTIFICATIONS,
    unread: 3,
    show: 'all',
    onShowChange: () => undefined,
  },
  render: () => (
    <ExampleProvider>
      <Demo />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof NotificationsPage>

export default meta

type Story = StoryObj<typeof meta>

/** Today, Yesterday and earlier days; three unread. Opening one marks it read. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Yesterday' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Notification settings' })).toBeVisible()
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Yesterday' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Notification settings' })).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Mark as read: UF-2026-1187 from EPS Snabdevanje waits for your approval',
      }),
    )
    await expect(
      canvas.getByRole('button', {
        name: 'Mark as unread: UF-2026-1187 from EPS Snabdevanje waits for your approval',
      }),
    ).toBeVisible()
  },
}

/** Only the unread ones. */
export const Unread: Story = {
  render: () => (
    <ExampleProvider>
      <Demo show="unread" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /Unread/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3)
  },
}

/** Filtered by one company that has no unread notification: "Nothing matches" with Clear. */
export const NoMatch: Story = {
  name: 'Nothing matches',
  render: () => (
    <ExampleProvider>
      <Demo show="unread" companies={['panonija']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No notification matches these filters')).toBeVisible()
    await settle()
  },
}

export const NoMatchInteraction: Story = {
  name: 'Nothing matches, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Demo show="unread" companies={['panonija']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No notification matches these filters')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await expect(canvas.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible()
  },
}

/** Nothing at all. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Demo initial={[]} />
    </ExampleProvider>
  ),
}

/** Loading the first time: skeleton rows. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Demo initial={[]} loading />
    </ExampleProvider>
  ),
}

const LONG: NotificationItem[] = [
  {
    id: 'long',
    title:
      'SEF returned UF-2026-1187 from Poljoprivredno-industrijski kombinat Banat Agrar d.o.o. with the message that the reference to the advance invoice does not match any document registered for this buyer',
    body: '“Please check the advance A-2026-031 before sending the final invoice again — the customer’s accounting department confirmed the amount by e-mail.”',
    company: 'Poljoprivredno-industrijski kombinat Banat Agrar d.o.o.',
    companyId: 'banat',
    type: 'documents',
    at: '2026-10-06T11:58:00+02:00',
    href: '#sales/invoices/F-2026-0415',
    read: false,
  },
  ...NOTIFICATIONS,
]

/** Long titles, comments and company names wrap; nothing is cut. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Demo initial={LONG} />
    </ExampleProvider>
  ),
}

/** Phone width: filters stacked, the same rows. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Demo layout="phone" />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The bell's panel on its own: recent notifications, unread count, Mark all as read, View all. */
export const Panel: Story = {
  name: 'Panel (bell)',
  render: () => (
    <ExampleProvider>
      <div className="w-fit rounded-md border border-solid border-default bg-surface-overlay px-1 py-2">
        <NotificationsPanel
          items={NOTIFICATIONS.slice(0, 5)}
          unread={3}
          viewAllHref="#notifications"
          onMarkAllRead={() => undefined}
        />
      </div>
    </ExampleProvider>
  ),
}

/** The panel with nothing in it. */
export const PanelEmpty: Story = {
  name: 'Panel, empty',
  render: () => (
    <ExampleProvider>
      <div className="w-fit rounded-md border border-solid border-default bg-surface-overlay px-1 py-2">
        <NotificationsPanel items={[]} unread={0} viewAllHref="#notifications" />
      </div>
    </ExampleProvider>
  ),
}

const ARABIC: NotificationItem[] = [
  {
    id: 'a1',
    title: 'فاتورة المورد UF-2026-1187 بانتظار موافقتك',
    company: 'شركة النور للتجارة',
    companyId: 'nour',
    type: 'approvals',
    at: '2026-10-06T10:14:00+03:00',
    href: '#a1',
    read: false,
  },
  {
    id: 'a2',
    title: 'أشار إليك أحمد في الفاتورة F-2026-0412',
    company: 'شركة النور للتجارة',
    companyId: 'nour',
    type: 'mentions',
    at: '2026-10-05T16:30:00+03:00',
    href: '#a2',
    read: true,
  },
]

/** Arabic notifications in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Demo initial={ARABIC} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

const JAPANESE: NotificationItem[] = [
  {
    id: 'j1',
    title: '仕入請求書 UF-2026-1187 の承認をお待ちしています',
    company: '株式会社さくら商事',
    companyId: 'sakura',
    type: 'approvals',
    at: '2026-10-06T10:14:00+09:00',
    href: '#j1',
    read: false,
  },
  {
    id: 'j2',
    title: '田中さんが請求書 F-2026-0412 であなたをメンションしました',
    company: '株式会社さくら商事',
    companyId: 'sakura',
    type: 'mentions',
    at: '2026-10-05T16:30:00+09:00',
    href: '#j2',
    read: true,
  },
]

/** Japanese notifications. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Demo initial={JAPANESE} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

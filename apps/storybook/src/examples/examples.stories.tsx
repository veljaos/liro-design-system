import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { FEATURED } from './examples-story-data'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'

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

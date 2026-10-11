import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createFormat, notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { FEATURED } from './examples-story-data'
import { C_ROUTES } from './data-C'
import {
  draftTotals,
  fromParas,
  fromRecord,
  initialDraft,
  newLine,
  NEW_SERVICE,
  specificationOf,
  specTotals,
  type DraftLine,
} from './data-D1'
import { D1_ROUTES } from './screens-D1'
import { D2_ROUTES } from './screens-D2'
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
          'the notifications (the bell’s "View all") and a page that does not exist; and from ' +
          'Phase 5: invoices with history and comments, a draft found line by line, complex and ' +
          'corrective documents, customers at scale with their import, the VAT return and the ' +
          'work-injury register, a bank statement worked line by line, a journal entry, the ' +
          'payroll run, ' +
          'users and roles, the first-run setup, a contract from questions to signatures and the ' +
          'tasks board — reached from the home page, the module tabs, the notifications, the user ' +
          'menu and the search (Ctrl K). Every link goes through the provider’s ' +
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
 * to the list, the notifications, bank statement 188 from its notification, home, the tasks.
 * The same invoice shows the same total in the list and on its page.
 */
export const WalkThrough: Story = {
  name: 'Walk-through',
  tags: ['interaction'],
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
    // Phase 5: the bank statement from its notification, then the tasks from the home page.
    await userEvent.click(canvas.getByRole('button', { name: 'Notifications, 1 unread' }))
    await settle()
    await userEvent.click(within(document.body).getByRole('link', { name: 'View all' }))
    await settle()
    await userEvent.click(await canvas.findByRole('link', { name: /Bank statement 188 imported/ }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Statement 188' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: 'Liro Business Apps' }))
    await settle()
    await userEvent.click(await canvas.findByRole('link', { name: /Tasks/ }))
    await settle()
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Tasks' })).toBeVisible()
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
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // Cancelled by ST-2026-0004: shown as Cancelled, never overdue, owing nothing.
    const cancelled = await canvas.findByRole('row', { name: /F-2026-0407/ })
    await expect(cancelled).toHaveTextContent('Cancelled')
    await expect(cancelled).not.toHaveTextContent(/overdue/i)
    await settle()
  },
}

export const InvoiceListScreenInteraction: Story = {
  name: 'Invoice list, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={ROUTES.invoices} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // Cancelled by ST-2026-0004: shown as Cancelled, never overdue, owing nothing.
    const cancelled = await canvas.findByRole('row', { name: /F-2026-0407/ })
    await expect(cancelled).toHaveTextContent('Cancelled')
    await expect(cancelled).not.toHaveTextContent(/overdue/i)
    await userEvent.click(cancelled)
    await settle()
    let preview = within(document.body).getByRole('dialog', { name: 'F-2026-0407' })
    await expect(preview).toHaveTextContent(/Amount due\s*0,00\s*RSD/)
    await userEvent.keyboard('{Escape}')
    await settle()
    // Decreased by KO-2026-0009: the total after the decrease, and what is still due.
    const decreased = canvas.getByRole('row', { name: /F-2026-0410/ })
    await expect(decreased).toHaveTextContent('167.762,75')
    await expect(decreased).not.toHaveTextContent('186.420,35')
    await userEvent.click(decreased)
    await settle()
    preview = within(document.body).getByRole('dialog', { name: 'F-2026-0410' })
    await expect(preview).toHaveTextContent(/Amount due\s*67\.762,75\s*RSD/)
    await userEvent.keyboard('{Escape}')
    await settle()
  },
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
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: FEATURED })
    await expect(link.closest('tr')).toHaveTextContent('Panonija Agro d.o.o.')
    await expect(link.closest('tr')).toHaveTextContent('185.954,00')
    await expect(link.closest('tr')).toHaveTextContent('135.954,00')
    // Overdue receivables: F-2026-0411 only; cancelled F-2026-0407 counts nowhere.
    const overdue = canvas.getByText('Overdue receivables').closest('[data-slot="stat-card"]')
    await expect(overdue).toHaveTextContent('58.440,00')
    await expect(overdue).toHaveTextContent('1 invoice')
    await expect(overdue).not.toHaveTextContent('152.940,00')
    await expect(canvasElement).not.toHaveTextContent('F-2026-0407')
    // F-2026-0410 owes what is left after decrease KO-2026-0009 and the payment.
    const decreased = canvas.getByRole('row', { name: /F-2026-0410/ })
    await expect(decreased).toHaveTextContent('167.762,75')
    await expect(decreased).toHaveTextContent('67.762,75')
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
  tags: ['interaction'],
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
  tags: ['interaction'],
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
  tags: ['interaction'],
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
  tags: ['interaction'],
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

// ── P5 group F ──
// (Imports here, inside the group's block, so the groups' blocks merge without touching the top.)
import { PAYROLL_TOTALS } from './data-F'
import { F_ROUTES } from './screens-F'

const SERBIAN = createFormat('sr-Latn-RS')

/** Journal entry NK-2026-0912, balanced: the supplier invoice UF-2026-1204 booked. */
export const JournalEntryScreen: Story = {
  name: 'Journal entry',
  render: () => <ExampleApp start={F_ROUTES.journal} />,
  play: async ({ canvasElement }) => {
    await settle()
    const bar = canvasElement.querySelector('[data-slot="balance-bar"]')
    if (bar === null) throw new Error('no balance bar')
    await expect(bar).toHaveTextContent('144.720,00 RSD')
    await expect(bar).toHaveTextContent('Balanced')
    await expect(within(canvasElement).getByRole('button', { name: 'Post' })).toBeEnabled()
    // The draft's header follows the invoice draft's (P5.23): three values on one row, the date
    // and the journal changeable, "Based on" read-only; the lines' card has no title.
    const canvas = within(canvasElement)
    const values = Array.from(
      canvasElement.querySelectorAll(
        '[data-slot="document-details"] [data-slot="changeable-value"]',
      ),
    )
    await expect(values).toHaveLength(3)
    const tops = values.map((each) => Math.round(each.getBoundingClientRect().top))
    await expect(new Set(tops).size).toBe(1)
    await expect(canvas.getByRole('button', { name: 'Change Date' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Change Journal' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Change Based on' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: 'Lines' })).toBeNull()
  },
}

/**
 * The same entry while the supplier's amount is mistyped: the difference is marked and "Post" is
 * unavailable with the Core's reason; correcting the amount balances it.
 */
export const JournalEntryUnbalanced: Story = {
  name: 'Journal entry, unbalanced',
  render: () => <ExampleApp start={F_ROUTES.journalUnbalanced} />,
  play: async ({ canvasElement }) => {
    await settle()
    const bar = canvasElement.querySelector('[data-slot="balance-bar"]')
    if (bar === null) throw new Error('no balance bar')
    await expect(bar).toHaveTextContent('Not balanced')
    await expect(bar).toHaveTextContent('2.000,00 RSD')
    await expect(canvasElement).toHaveTextContent(
      'Unavailable: Debit and credit must be equal. The difference is 2.000,00 RSD.',
    )
    await settle()
  },
}

export const JournalEntryUnbalancedInteraction: Story = {
  name: 'Journal entry, unbalanced, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={F_ROUTES.journalUnbalanced} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const bar = canvasElement.querySelector('[data-slot="balance-bar"]')
    if (bar === null) throw new Error('no balance bar')
    await expect(bar).toHaveTextContent('Not balanced')
    await expect(bar).toHaveTextContent('2.000,00 RSD')
    await expect(canvasElement).toHaveTextContent(
      'Unavailable: Debit and credit must be equal. The difference is 2.000,00 RSD.',
    )
    const credit = canvas.getByRole('textbox', { name: 'Credit, line 4' })
    await userEvent.clear(credit)
    await userEvent.type(credit, '144720')
    await userEvent.tab()
    await expect(bar).toHaveTextContent('Balanced')
    await expect(canvas.getByRole('button', { name: 'Post' })).toBeEnabled()
    await settle()
  },
}

export const JournalEntryPhone: Story = {
  name: 'Journal entry, unbalanced, phone',
  render: () => <OnPhone start={F_ROUTES.journalUnbalanced} />,
  play: async ({ canvasElement }) => {
    await settle()
    const bar = canvasElement.querySelector('[data-slot="balance-bar"]')
    const totals = bar?.closest('[data-slot="grid-totals"]')
    await expect(
      totals === null || totals === undefined ? '' : getComputedStyle(totals).position,
    ).toBe('sticky')
    await expect(bar).toHaveTextContent('Not balanced')
  },
}

/** Payroll September 2026 at review: one warning, the totals of 46 employees, the period open. */
export const PayrollScreen: Story = {
  name: 'Payroll run',
  render: () => <ExampleApp start={F_ROUTES.payroll} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('1 warning')
    await expect(canvasElement).toHaveTextContent('Period open')
    for (const value of [
      PAYROLL_TOTALS.gross,
      PAYROLL_TOTALS.contributions,
      PAYROLL_TOTALS.tax,
      PAYROLL_TOTALS.net,
    ]) {
      await expect(canvasElement).toHaveTextContent(SERBIAN.number(value, { decimals: 2 }))
    }
  },
}

export const PayrollPhone: Story = {
  name: 'Payroll run, phone',
  render: () => <OnPhone start={F_ROUTES.payroll} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Step 3 of 5 · Review')
    const page = canvasElement.querySelector('[data-slot="periodic-run-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** The rerun asks for a reason, then the run goes back to Calculate. */
export const PayrollRerun: Story = {
  name: 'Payroll run, rerun',
  tags: ['interaction'],
  render: () => <ExampleApp start={F_ROUTES.payroll} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Rerun' }))
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Corrected working hours' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rerun' }))
    await settle()
    await expect(await canvas.findByText('0 of 46')).toBeVisible()
    await expect(canvas.getAllByText('Corrected working hours')[0]).toBeVisible()
    await expect(canvasElement.querySelector('[aria-current="step"]')).toHaveTextContent(
      'Calculate',
    )
  },
}

// ── P5 group A ──

/** Group A's routes (screens-A.tsx). */
const ROUTES_A = { invoice: '/sales/invoices/F-2026-0410', contract: '/hr/contracts/new' }

/**
 * Invoice F-2026-0410 (partially paid): Dragan and the Liro agent are viewing it; the comments
 * as a conversation in which the agent asks for the payment date; the full history (SEF, the
 * bank import, the agent on behalf of Milica); the side panel keeps the latest activity.
 */
export const InvoiceActivityScreen: Story = {
  name: 'Invoice with history, comments and presence',
  render: () => <ExampleApp start={ROUTES_A.invoice} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'F-2026-0410' }),
    ).toBeVisible()
    // The same figures as the invoice list: 186.420,35 issued, decreased by KO-2026-0009 to
    // 167.762,75, due 67.762,75 after 100.000,00.
    const [label] = canvas.getAllByText('Amount due', { selector: 'dt' })
    const figures = label?.closest('dl')
    if (figures === null || figures === undefined) throw new Error('No key figures')
    await expect(figures).toHaveTextContent('67.762,75 RSD')
    await expect(figures).toHaveTextContent('167.762,75 RSD')
    const totals = canvasElement.querySelector('[data-slot="document-totals"]')
    await expect(totals).toHaveTextContent('186.420,35 RSD')
    await expect(totals).toHaveTextContent('-18.657,60 RSD')
    await expect(totals).toHaveTextContent('-100.000,00 RSD')
    // Its correcting document (P5.23): in Related documents and as the totals row's link.
    const related = within(canvas.getByRole('list', { name: 'Related documents' }))
    await expect(related.getByRole('link', { name: /KO-2026-0009/ })).toHaveAttribute(
      'href',
      '#/sales/corrections/KO-2026-0009',
    )
    await expect(
      within(totals as HTMLElement).getByRole('link', { name: 'Decrease KO-2026-0009' }),
    ).toHaveAttribute('href', '#/sales/corrections/KO-2026-0009')
    await expect(
      canvas.getByRole('button', { name: 'Also here: Dragan Ilić, Liro agent (agent)' }),
    ).toBeVisible()
    await settle()
  },
}

export const InvoiceActivityScreenInteraction: Story = {
  name: 'Invoice with history, comments and presence, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={ROUTES_A.invoice} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'F-2026-0410' }),
    ).toBeVisible()
    // The same figures as the invoice list: 186.420,35 issued, decreased by KO-2026-0009 to
    // 167.762,75, due 67.762,75 after 100.000,00.
    const [label] = canvas.getAllByText('Amount due', { selector: 'dt' })
    const figures = label?.closest('dl')
    if (figures === null || figures === undefined) throw new Error('No key figures')
    await expect(figures).toHaveTextContent('67.762,75 RSD')
    await expect(figures).toHaveTextContent('167.762,75 RSD')
    const totals = canvasElement.querySelector('[data-slot="document-totals"]')
    await expect(totals).toHaveTextContent('186.420,35 RSD')
    await expect(totals).toHaveTextContent('-18.657,60 RSD')
    await expect(totals).toHaveTextContent('-100.000,00 RSD')
    // Its correcting document (P5.23): in Related documents and as the totals row's link.
    const related = within(canvas.getByRole('list', { name: 'Related documents' }))
    await expect(related.getByRole('link', { name: /KO-2026-0009/ })).toHaveAttribute(
      'href',
      '#/sales/corrections/KO-2026-0009',
    )
    await expect(
      within(totals as HTMLElement).getByRole('link', { name: 'Decrease KO-2026-0009' }),
    ).toHaveAttribute('href', '#/sales/corrections/KO-2026-0009')
    await expect(
      canvas.getByRole('button', { name: 'Also here: Dragan Ilić, Liro agent (agent)' }),
    ).toBeVisible()
    // The agent's question, answered from the keyboard.
    const question = canvas.getByRole('group', { name: 'Question from Liro agent' })
    const date = within(question).getByRole('textbox', { name: 'Expected payment date' })
    await userEvent.type(date, '20.10.2026{Enter}')
    await expect(await canvas.findByText('Payment expected on 20.10.2026.')).toBeVisible()
    await expect(canvas.getByText(/I will check the payment on 20\.10\.2026\./)).toBeVisible()
    // A comment with a mention.
    const field = canvas.getByRole('textbox', { name: 'Comment' })
    await userEvent.type(field, 'Thanks @iva')
    await within(document.body).findByRole('listbox', { name: 'People to mention' })
    await userEvent.keyboard('{Enter}')
    await userEvent.type(field, 'please note it.{Enter}')
    await expect(field).toHaveValue('')
    const log = canvas.getByRole('log')
    await expect(within(log).getByText('@Ivana Stojanović')).toBeVisible()
    // The history: newest first, older entries on request.
    const history = canvas.getByRole('group', { name: 'History of F-2026-0410' })
    await expect(
      within(history).getAllByText('On behalf of Milica Petrović').length,
    ).toBeGreaterThan(0)
    await userEvent.click(within(history).getByRole('button', { name: 'Show more' }))
    await expect(
      await within(history).findByText('Created the invoice from order N-2026-0149'),
    ).toBeVisible()
    await settle()
  },
}

export const InvoiceActivityPhone: Story = {
  name: 'Invoice with history, comments and presence, phone',
  render: () => <OnPhone start={ROUTES_A.invoice} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'F-2026-0410' }),
    ).toBeVisible()
    await expect(canvas.getByRole('log')).toBeInTheDocument()
    // Nothing overflows sideways at phone width.
    const main = canvas.getByRole('main')
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth)
  },
}

/**
 * The questions for Stefan Nikolić's employment contract: branching (hybrid asks for the office
 * days, probation for its months), the application's checks, the summary, and "Generate
 * contract", which opens RU-2026-017 for signing (group C's screen).
 */
export const ContractQuestionnaireScreen: Story = {
  name: 'Employment contract questionnaire',
  render: () => <ExampleApp start={ROUTES_A.contract} />,
  play: async () => {
    await settle()
  },
}

export const ContractQuestionnaireScreenInteraction: Story = {
  name: 'Employment contract questionnaire, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={ROUTES_A.contract} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const next = () => userEvent.keyboard('{Enter}')
    await userEvent.click(await canvas.findByRole('radio', { name: /Stefan Nikolić/ }))
    await next()
    await userEvent.keyboard('1')
    await next()
    await userEvent.keyboard('1')
    await next()
    // The application's check: the start must be after today.
    const start = canvas.getByRole('textbox', { name: 'When does the employee start?' })
    await userEvent.type(start, '01.10.2026{Enter}')
    await expect(canvas.getByText('The start date must be after today.')).toBeVisible()
    await userEvent.clear(start)
    await userEvent.type(start, '02.11.2026{Enter}')
    await userEvent.keyboard('3')
    await next()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Office days per week' }), '3{Enter}')
    await userEvent.keyboard('1')
    await next()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Probation months' }), '3{Enter}')
    await userEvent.keyboard('1')
    await next()
    await userEvent.type(
      canvas.getByRole('textbox', { name: /Gross monthly salary/ }),
      '185000{Enter}',
    )
    await userEvent.type(canvas.getByRole('textbox', { name: 'Annual leave days' }), '22{Enter}')
    await expect(await canvas.findByRole('heading', { name: 'Check your answers' })).toBeVisible()
    await expect(canvas.getByText('11 of 11 answered')).toBeVisible()
    await expect(canvas.getByText('185.000,00 RSD')).toBeVisible()
    await expect(canvas.getByText('02.11.2026.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Generate contract' })).toBeEnabled()
    await settle()
  },
}

export const ContractQuestionnairePhone: Story = {
  name: 'Employment contract questionnaire, phone',
  render: () => <OnPhone start={ROUTES_A.contract} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('group', { name: 'Who is the contract for?' }),
    ).toBeVisible()
    const main = canvas.getByRole('main')
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth)
  },
}

// ── P5 group C ──

/** Sign in with the providers (P5.6): the e-mail first, then "or" and Microsoft and Google. */
export const SignInProviders: Story = {
  name: 'Sign in, providers',
  render: () => <ExampleApp start={ROUTES.signIn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const microsoft = canvas.getByRole('button', { name: 'Continue with Microsoft' })
    // The mark is drawn by ProviderSignInButtons (provider-marks.tsx), decorative.
    await expect(microsoft.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    await expect(canvas.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Work e-mail' })).toHaveAttribute(
      'autocomplete',
      'username',
    )
  },
}

/** Users and roles (P5.21): members, the roles with a custom role's permissions, invitations. */
export const UsersAndRoles: Story = {
  name: 'Users and roles',
  render: () => <ExampleApp start={C_ROUTES.users} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('row', { name: /Snežana Popović/ })).toHaveTextContent(
      'Site manager',
    )
    await settle()
  },
}

export const UsersAndRolesInteraction: Story = {
  name: 'Users and roles, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={C_ROUTES.users} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('row', { name: /Snežana Popović/ })).toHaveTextContent(
      'Site manager',
    )
    await userEvent.click(canvas.getByRole('tab', { name: 'Roles' }))
    await settle()
    await expect(canvas.getByRole('heading', { name: 'Permissions: Site manager' })).toBeVisible()
    const cell = canvas.getByRole('checkbox', { name: 'Edit: Supplier invoices' })
    await userEvent.click(cell)
    await expect(cell).toBeChecked()
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(cell).not.toBeChecked()
    // A built-in role is read-only.
    await userEvent.click(canvas.getByRole('row', { name: /^Accountant Built-in/ }))
    await expect(canvas.getByRole('heading', { name: 'Permissions: Accountant' })).toBeVisible()
    await expect(canvas.queryByRole('checkbox', { name: 'Edit: Supplier invoices' })).toBeNull()
  },
}

/** Inviting: the drawer, then the new invitation pending beside the others. */
export const UsersInvite: Story = {
  name: 'Users and roles, inviting',
  tags: ['interaction'],
  render: () => <ExampleApp start={C_ROUTES.users} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Invite user' }))
    const drawer = within(await page.findByRole('dialog', { name: 'Invite user' }))
    await userEvent.type(
      drawer.getByRole('textbox', { name: 'E-mail' }),
      'marija.jovic@kvadratgradnja.rs',
    )
    await userEvent.click(drawer.getByRole('button', { name: 'Send invitation' }))
    await settle()
    await expect(await canvas.findByRole('row', { name: /marija\.jovic/ })).toHaveTextContent(
      'Pending',
    )
    await expect(canvas.getByRole('row', { name: /biljana\.ristic/ })).toHaveTextContent('Expired')
    notice.dismiss()
    await waitFor(async () => {
      await expect(page.queryByText(/Invitation sent to/)).toBeNull()
    })
  },
}

export const UsersPhone: Story = {
  name: 'Users and roles, phone',
  render: () => <OnPhone start={C_ROUTES.users} />,
}

/** First-run setup of Stanić Elektro STR (P5.21): two of five steps done, resume at the next. */
export const SetupScreen: Story = {
  name: 'First-run setup',
  render: () => <ExampleApp start={C_ROUTES.setup} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Stanić Elektro STR' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('2 of 5 done')
    await expect(canvasElement.querySelector('[aria-current="step"]')).toHaveTextContent(
      'Import customers',
    )
  },
}

export const SetupPhone: Story = {
  name: 'First-run setup, phone',
  render: () => <OnPhone start={C_ROUTES.setup} />,
}

/** RU-2026-017 awaiting signatures, seen by Milica (not a signer): who has signed, a reminder. */
export const ContractSigning: Story = {
  name: 'Contract awaiting signatures',
  render: () => <ExampleApp start={C_ROUTES.signing} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'RU-2026-017' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('1 of 3 signed')
    await expect(canvasElement).toHaveTextContent('Signed 05.10.2026. 14:12')
    await expect(canvas.queryByRole('button', { name: 'Sign' })).toBeNull()
  },
}

export const ContractSigningPhone: Story = {
  name: 'Contract awaiting signatures, phone',
  render: () => <OnPhone start={C_ROUTES.signing} />,
}

/** Stefan Nikolić from his e-mail link: he signs; Jelena Marković signs next. */
export const ContractSignerLink: Story = {
  name: 'Contract signing, the employee signs',
  render: () => <ExampleApp start={C_ROUTES.signerLink} />,
  play: async () => {
    await settle()
  },
}

export const ContractSignerLinkInteraction: Story = {
  name: 'Contract signing, the employee signs, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={C_ROUTES.signerLink} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Sign' }))
    await waitFor(async () => {
      await expect(canvasElement).toHaveTextContent('2 of 3 signed')
    })
    await expect(canvas.getByText('Signed by you')).toBeVisible()
    notice.dismiss()
    await waitFor(async () => {
      await expect(page.queryByText(/RU-2026-017 signed/)).toBeNull()
    })
  },
}

export const ContractSignerLinkPhone: Story = {
  name: 'Contract signing, the employee, phone',
  render: () => <OnPhone start={C_ROUTES.signerLink} />,
}

/** The tasks board (P5.7): each card links to its record; the columns count their tasks. */
export const TasksScreen: Story = {
  name: 'Tasks',
  render: () => <ExampleApp start={C_ROUTES.tasks} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Contract RU-2026-017' })).toHaveAttribute(
      'href',
      `#${C_ROUTES.signing}`,
    )
    const todo = canvasElement.querySelector('[data-kanban-column="todo"]')
    await expect(todo).toHaveTextContent('3 tasks')
    await settle()
  },
}

export const TasksScreenInteraction: Story = {
  name: 'Tasks, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={C_ROUTES.tasks} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Contract RU-2026-017' })).toHaveAttribute(
      'href',
      `#${C_ROUTES.signing}`,
    )
    const todo = canvasElement.querySelector('[data-kanban-column="todo"]')
    await expect(todo).toHaveTextContent('3 tasks')
    // "Send reminder for F-2026-0411" moves to In progress with its menu.
    await userEvent.click(
      canvas.getByRole('button', { name: 'Move to: Send reminder for F-2026-0411' }),
    )
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: 'In progress' }),
    )
    await waitFor(async () => {
      await expect(todo).toHaveTextContent('2 tasks')
    })
    await expect(canvasElement.querySelector('[data-kanban-column="progress"]')).toHaveTextContent(
      '3 tasks',
    )
  },
}

export const TasksPhone: Story = {
  name: 'Tasks, phone',
  render: () => <OnPhone start={C_ROUTES.tasks} />,
}

// ── P5 group E ──
// Catalogues at scale (P5.19) and registers and official forms (P5.20). Legal codes, field
// numbers and texts are illustrative.

/** Nothing in the phone frame scrolls sideways (P4.9 rule 16). */
async function noSidewaysScroll(canvasElement: HTMLElement) {
  const frame = boxAround(canvasElement.querySelector('[data-slot="app-shell"]'))
  await expect(frame).not.toBeNull()
  await expect(frame?.scrollWidth ?? 0).toBeLessThanOrEqual(frame?.clientWidth ?? 0)
}

/**
 * The customer catalogue: the dataset's customers and 50,000 generated ones, virtualised
 * (only the rows in view are drawn); views Active / Inactive / All with counts; inactive
 * customers are hidden, never deleted, and marked "Inactive" after the name where the list mixes
 * both (All) — not on the Inactive view, whose tab already says it (P5.23).
 */
export const CustomersScreen: Story = {
  name: 'Customers',
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = await canvas.findByRole('row', { name: /Panonija Agro d.o.o./ })
    await expect(row).toHaveTextContent('383.763,12')
    await expect(canvasElement.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(60)
    await settle()
  },
}

export const CustomersScreenInteraction: Story = {
  name: 'Customers, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = await canvas.findByRole('row', { name: /Panonija Agro d.o.o./ })
    await expect(row).toHaveTextContent('383.763,12')
    await expect(canvasElement.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(60)
    await userEvent.click(canvas.getByRole('button', { name: /^Inactive/ }))
    const rakic = await canvas.findByRole('row', { name: /Rakić Pekara SZR/ })
    await expect(within(rakic).queryByText('Inactive')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: /^All/ }))
    const mixed = await canvas.findByRole('row', { name: /Rakić Pekara SZR/ })
    await expect(within(mixed).getByText('Inactive')).toBeVisible()
  },
}

/**
 * A catalogue list sorts by its columns and filters by several values (P5.23): customers in Kać
 * or Niš, the largest open balance first; the application sorts (amounts exactly).
 */
export const CustomersSortAndFilter: Story = {
  name: 'Customers, sort and filter',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const city = await canvas.findByRole('combobox', { name: 'City' })
    await userEvent.click(city)
    await userEvent.type(city, 'Kać', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await userEvent.type(city, 'Niš', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}{Enter}{Escape}')
    await waitFor(async () => {
      await expect(canvas.queryByRole('row', { name: /Vojvođanka Mlin/ })).toBeNull()
    })
    await expect(canvas.getByRole('row', { name: /Panonija Agro d.o.o./ })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Open balance' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Open balance' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('columnheader', { name: 'Open balance' })).toHaveAttribute(
        'aria-sort',
        'descending',
      )
    })
    await settle()
  },
}

/** Three customers selected: the bulk bar is a row of its own, 12px from the filters and the table. */
export const CustomersSelected: Story = {
  name: 'Customers, selected',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    for (const name of ['Panonija Agro d.o.o.', 'Drina Prevoz d.o.o.', 'Medic Lab Niš d.o.o.']) {
      await userEvent.click(await canvas.findByRole('checkbox', { name: `Select ${name}` }))
    }
    await expect(await canvas.findByText('3 selected')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Select all/ })).toBeVisible()
    await settle()
  },
}

export const CustomersPhone: Story = {
  name: 'Customers, phone',
  render: () => <OnPhone start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(await within(canvasElement).findByText('Panonija Agro d.o.o.')).toBeVisible()
    await noSidewaysScroll(canvasElement)
  },
}

/** Bulk edit: two customers selected, "Edit 2 records", the payment term set to 30 days for both. */
export const CustomersBulkEdit: Story = {
  name: 'Customers, bulk edit',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(
      await canvas.findByRole('checkbox', { name: 'Select Panonija Agro d.o.o.' }),
    )
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Drina Prevoz d.o.o.' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Edit 2 records' }))
    const drawer = within(await page.findByRole('dialog', { name: 'Edit 2 records' }))
    await userEvent.click(drawer.getByRole('checkbox', { name: 'Payment term' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Apply to 2 records' }))
    const confirm = within(await page.findByRole('alertdialog', { name: 'Change 2 records?' }))
    await userEvent.click(confirm.getByRole('button', { name: 'Change' }))
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
      await expect(page.queryByRole('alertdialog')).toBeNull()
    })
    await settle()
    // Drina Prevoz's payment term was 7 days; it is now 30.
    const drina = await canvas.findByRole('row', { name: /Drina Prevoz d.o.o./ })
    await expect(within(drina).getByRole('cell', { name: '30' })).toBeVisible()
  },
}

/** Deactivating hides a customer from Active and shows it under Inactive; nothing is deleted. */
export const CustomersDeactivate: Story = {
  name: 'Customers, deactivate',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Actions: Drina Prevoz d.o.o.' }),
    )
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: 'Deactivate' }),
    )
    await waitFor(async () => {
      await expect(canvas.queryByRole('row', { name: /Drina Prevoz/ })).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: /^Inactive/ }))
    await expect(await canvas.findByRole('row', { name: /Drina Prevoz/ })).toBeVisible()
  },
}

/**
 * "Search all…" opens the whole catalogue in the LookupDialog (the integrator wires the
 * LookupField's last entry to it): type, ArrowDown, Enter chooses — here the list then shows
 * the chosen customer (its tax number in the search).
 */
export const CustomersLookup: Story = {
  name: 'Customers, search all',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(await canvas.findByRole('button', { name: 'Search all…' }))
    const dialog = within(await page.findByRole('dialog', { name: 'Customers' }))
    const search = dialog.getByRole('textbox', { name: 'Name, tax number or city' })
    await waitFor(async () => {
      await expect(search).toHaveFocus()
    })
    await userEvent.type(search, 'vojvo')
    // The application's results for "vojvo" have replaced the first page.
    await waitFor(async () => {
      await expect(dialog.queryByRole('row', { name: /Panonija Agro/ })).toBeNull()
    })
    await expect(dialog.getByRole('row', { name: /Vojvođanka Mlin a.d./ })).toBeVisible()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
    })
    await settle()
    await expect(canvas.getByRole('textbox', { name: 'Name, tax number or city' })).toHaveValue(
      '100421987',
    )
    await expect(
      await canvas.findByRole('row', { name: /Vojvođanka Mlin a.d./ }),
    ).toHaveTextContent('61.204,75')
  },
}

/**
 * Import: the file, the suggested columns, the validation preview (counts, the duplicate
 * warning for Panonija Agro d.o.o., problems in their cells), then the import with its progress.
 */
export const CustomerImportScreen: Story = {
  name: 'Customer import',
  render: () => <ExampleApp start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('no file input')
    await settle()
  },
}

export const CustomerImportScreenInteraction: Story = {
  name: 'Customer import, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('no file input')
    await userEvent.upload(input, new File([IMPORT_FILE], 'kupci-stari-sistem.csv'))
    await expect(await canvas.findByText('kupci-stari-sistem.csv')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(await canvas.findByText('Not imported: Napomena')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(await canvas.findByText('1.198 rows ready')).toBeVisible()
    await expect(canvas.getByText('3 duplicates')).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Panonija Agro d.o.o./ })).toBeVisible()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Skip rows with errors' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Import 1.198 rows' }))
    await expect(
      await canvas.findByText('1.198 customers imported', undefined, { timeout: 5000 }),
    ).toBeVisible()
    await settle()
  },
}

export const CustomerImportPhone: Story = {
  name: 'Customer import, phone',
  render: () => <OnPhone start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysScroll(canvasElement)
  },
}

/**
 * The VAT return for September 2026 (an illustrative PP PDV-like form): prefilled from the
 * books, 3.2 drills down to the invoices (F-2026-0412 among them), 8a.2 overridden by Ivana
 * Stojanović, one failing check, August beside September, status Checked.
 */
export const VatReturnScreen: Story = {
  name: 'VAT return',
  render: () => <ExampleApp start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 check failed · 4 checks passed')).toBeVisible()
    await expect(canvas.getByText('By Ivana Stojanović on 05.10.2026. 14:12')).toBeVisible()
    await expect(
      canvas.getAllByText('Difference: 64.400,00 RSD', { exact: false })[0],
    ).toBeVisible()
    await settle()
  },
}

export const VatReturnScreenInteraction: Story = {
  name: 'VAT return, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await expect(canvas.getByText('1 check failed · 4 checks passed')).toBeVisible()
    await expect(canvas.getByText('By Ivana Stojanović on 05.10.2026. 14:12')).toBeVisible()
    await expect(
      canvas.getAllByText('Difference: 64.400,00 RSD', { exact: false })[0],
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: /^510\.809,60\sRSD, sources of 3\.2$/ }),
    )
    const drawer = within(await page.findByRole('dialog', { name: '3.2 Tax base' }))
    await settle()
    await expect(drawer.getByRole('link', { name: /F-2026-0412/ })).toBeVisible()
    await expect(drawer.getByText('144.920,00 RSD')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
    })
    // 5.2 = 3.6 + 4.6, and 10.1 = 5.2 − 8e.6, as the Core computed them.
    await expect(canvasElement).toHaveTextContent('103.011,92')
    await expect(canvasElement).toHaveTextContent('34.054,32')
  },
}

export const VatReturnPhone: Story = {
  name: 'VAT return, phone',
  render: () => <OnPhone start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysScroll(canvasElement)
  },
}

/**
 * The work-injury register for 2026: January–June locked with the reason; no. 7 corrects no. 4
 * (marked "Corrected by no. 7"); entries are never deleted.
 */
export const InjuryRegisterScreen: Story = {
  name: 'Work-injury register',
  render: () => <ExampleApp start={E_ROUTES.injuryRegister} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('January–June 2026 is locked')).toBeVisible()
    // The same component and spacing as the template's stories (P5.23).
    await expectLocksMeetTable(canvasElement)
    await settle()
  },
}

export const InjuryRegisterScreenInteraction: Story = {
  name: 'Work-injury register, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.injuryRegister} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('January–June 2026 is locked')).toBeVisible()
    // The same component and spacing as the template's stories (P5.23).
    await expectLocksMeetTable(canvasElement)
    await expectCorrectionLink(canvasElement, 'Corrects no. 4', '4')
    await expectCorrectionLink(canvasElement, 'Corrected by no. 7', '7')
    await userEvent.click(canvas.getByRole('button', { name: 'Actions: No. 3, Dejan Savić' }))
    await expect(
      await within(document.body).findByRole('menuitem', {
        name: 'Locked period: entries cannot be changed',
      }),
    ).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Escape}')
  },
}

export const InjuryRegisterPhone: Story = {
  name: 'Work-injury register, phone',
  render: () => <OnPhone start={E_ROUTES.injuryRegister} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysScroll(canvasElement)
  },
}

/** 5,000 generated entries stay responsive: only the rows in view are drawn. */
export const InjuryRegisterMany: Story = {
  name: 'Work-injury register, 5,000 entries',
  render: () => <ExampleApp start={E_ROUTES.injuryRegisterGenerated} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('table')).toHaveAttribute('aria-rowcount', '5001')
    await expect(canvasElement.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(60)
    await settle()
  },
}

export const InjuryRegisterManyInteraction: Story = {
  name: 'Work-injury register, 5,000 entries, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={E_ROUTES.injuryRegisterGenerated} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('table')).toHaveAttribute('aria-rowcount', '5001')
    await expect(canvasElement.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(60)
    await expectCorrectionLink(canvasElement, 'Corrected by no. 4990', '4990')
    await expectCorrectionLink(canvasElement, 'Corrects no. 12', '12')
  },
}

import { IMPORT_FILE } from './data-E'
import { E_ROUTES } from './screens-E'
import {
  expectCorrectionLink,
  expectLocksMeetTable,
} from '../../../../packages/ui/src/templates/register-story-data'

// ── P5 group D2 ──
// Complex documents (P5.18): the play functions read the amounts the screens show and check
// that they add up — lines → recap by tax category → totals → deductions → amount due — in whole
// paras, as written for a Serbian tenant ("1.234,56").

/** An amount as shown ("-1.234,56 RSD") in whole paras. */
function paras(text: string | null | undefined): bigint {
  const match = /(-?)(\d[\d.]*),(\d{2})/.exec(text ?? '')
  if (match === null) throw new Error(`No amount in "${text ?? ''}"`)
  const value = BigInt(`${(match[2] ?? '').replaceAll('.', '')}${match[3] ?? ''}`)
  return match[1] === '-' ? -value : value
}

function total(values: readonly bigint[]): bigint {
  return values.reduce((sum, value) => sum + value, 0n)
}

/** A totals row's amount, found by its label. */
function totalsAmount(root: Element, label: string): bigint {
  const term = [...root.querySelectorAll('dt')].find((dt) => dt.textContent.trim() === label)
  if (term === undefined) throw new Error(`No totals row "${label}"`)
  return paras(term.nextElementSibling?.textContent)
}

/** The amounts of a table's lines (not headings, text lines or subtotals): the last cell. */
function lineAmounts(table: HTMLElement): bigint[] {
  return [
    ...table.querySelectorAll(
      'tbody > tr:not([data-line="heading"]):not([data-line="text"]):not([data-line="subtotal"])',
    ),
  ].map((row) => paras(row.querySelector('td:last-child')?.textContent))
}

/** The recap's bases and taxes (a dash is no tax). */
function recapRows(root: Element): { base: bigint; tax: bigint }[] {
  const table = root.querySelector('[data-slot="tax-recap"]')
  if (table === null) throw new Error('No recap')
  return [...table.querySelectorAll('tbody > tr')].map((row) => {
    const cells = row.querySelectorAll('td')
    const tax = cells[2]?.textContent ?? '—'
    return { base: paras(cells[0]?.textContent), tax: tax.trim() === '—' ? 0n : paras(tax) }
  })
}

/** Nothing on the page is wider than the phone frame. */
/**
 * A document table's description column wraps to at most two lines (P5.23): the lines of each
 * cell's own text, not the line kind under it, counted by their boxes.
 */
async function expectAtMostTwoLines(table: HTMLElement, header: string) {
  const headers = within(table)
    .getAllByRole('columnheader')
    .map((cell) => cell.textContent)
  const column = headers.indexOf(header)
  for (const row of table.querySelectorAll('tbody > tr')) {
    const cell = row.querySelectorAll('td')[column]
    if (cell === undefined) continue
    const range = document.createRange()
    range.selectNodeContents(cell)
    const tops = new Set(
      [...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top / 6)),
    )
    await expect(tops.size).toBeLessThanOrEqual(2)
  }
}

async function noSidewaysOverflow(canvasElement: HTMLElement) {
  const page = canvasElement.querySelector('[data-slot="document-page"]')
  await expect(page).not.toBeNull()
  if (page !== null) await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
}

/**
 * Final invoice F-2026-0418 to Vojvođanka Mlin a.d.: "Based on" references (proforma, two
 * advances, contract), lines with sections, subtotals, a text line and a discount, the recap by
 * tax category, both advances deducted (links), notes and attachments with their "Send with the
 * e-invoice" flags.
 */
export const FinalInvoiceScreen: Story = {
  name: 'Final invoice with advances',
  render: () => <ExampleApp start={D2_ROUTES.final} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const lines = canvas.getByRole('table', { name: 'Lines' })
    const amounts = lineAmounts(lines)
    const recap = recapRows(canvasElement)
    // The lines add up to the bases of the recap; bases and taxes to the invoice total.
    await expect(total(amounts)).toBe(total(recap.map((row) => row.base)))
    const invoiceTotal = totalsAmount(canvasElement, 'Invoice total')
    await expect(total(recap.map((row) => row.base + row.tax))).toBe(invoiceTotal)
    // The section's lines add up to its subtotal.
    const subtotal = within(lines).getByText('Total steel structure').closest('tr')
    await expect(paras(subtotal?.textContent)).toBe(total(amounts.slice(0, 3)))
    // The invoice total less both advances is the amount due, as the key figure says.
    const due =
      invoiceTotal +
      totalsAmount(canvasElement, 'Advance A-2026-038') +
      totalsAmount(canvasElement, 'Advance A-2026-044')
    await expect(totalsAmount(canvasElement, 'Amount due')).toBe(due)
    await expect(canvasElement).toHaveTextContent('5.003.678,22')
    await expect(
      canvas.getByRole('link', { name: 'Advance invoice A-2026-044, Paid' }),
    ).toHaveAttribute('href', '#/sales/invoices/A-2026-044')
    await settle()
  },
}

export const FinalInvoiceScreenInteraction: Story = {
  name: 'Final invoice with advances, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={D2_ROUTES.final} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const lines = canvas.getByRole('table', { name: 'Lines' })
    const amounts = lineAmounts(lines)
    const recap = recapRows(canvasElement)
    // The lines add up to the bases of the recap; bases and taxes to the invoice total.
    await expect(total(amounts)).toBe(total(recap.map((row) => row.base)))
    const invoiceTotal = totalsAmount(canvasElement, 'Invoice total')
    await expect(total(recap.map((row) => row.base + row.tax))).toBe(invoiceTotal)
    // The section's lines add up to its subtotal.
    const subtotal = within(lines).getByText('Total steel structure').closest('tr')
    await expect(paras(subtotal?.textContent)).toBe(total(amounts.slice(0, 3)))
    // The invoice total less both advances is the amount due, as the key figure says.
    const due =
      invoiceTotal +
      totalsAmount(canvasElement, 'Advance A-2026-038') +
      totalsAmount(canvasElement, 'Advance A-2026-044')
    await expect(totalsAmount(canvasElement, 'Amount due')).toBe(due)
    await expect(canvasElement).toHaveTextContent('5.003.678,22')
    await expect(
      canvas.getByRole('link', { name: 'Advance invoice A-2026-044, Paid' }),
    ).toHaveAttribute('href', '#/sales/invoices/A-2026-044')
    // The attachments' flags change with a press.
    const flag = within(canvas.getByRole('group', { name: 'Otpremnice OTP-2026-0388–0402.pdf' }))
    await userEvent.click(flag.getByRole('checkbox', { name: 'Send with the e-invoice' }))
    await expect(flag.getByRole('checkbox')).toBeChecked()
    window.scrollTo(0, 0)
  },
}

export const FinalInvoicePhone: Story = {
  name: 'Final invoice with advances, phone',
  render: () => <OnPhone start={D2_ROUTES.final} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('5.003.678,22')
    await noSidewaysOverflow(canvasElement)
  },
}

/**
 * Interim situation IS-2026-007 (contract 12/2026, Hall B extension): the works of the period as
 * one line, the specification as a summary row ("300 positions") whose "Open" shows all 300
 * positions in twelve groups with subtotals and the previous / this period / cumulative columns.
 */
export const SituationScreen: Story = {
  name: 'Interim situation with a specification',
  render: () => <ExampleApp start={D2_ROUTES.situation} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Specification of works: 300 positions,')
    await settle()
  },
}

export const SituationScreenInteraction: Story = {
  name: 'Interim situation with a specification, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={D2_ROUTES.situation} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('Specification of works: 300 positions,')
    const lineAmount = total(lineAmounts(canvas.getByRole('table', { name: 'Lines' })))
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }))
    const sheet = await within(document.body).findByRole('dialog', {
      name: 'Specification of works',
    })
    const table = within(sheet).getByRole('table', { name: 'Specification of works' })
    // 12 groups × (heading + 25 positions + subtotal), and the header: drawn as they come into view.
    await expect(table).toHaveAttribute('aria-rowcount', '325')
    // The recap's base is the situation's line.
    await expect(recapRows(sheet)[0]?.base).toBe(lineAmount)
    // Virtualised: only the rows in view are drawn.
    await expect(within(table).getAllByRole('row').length).toBeLessThan(60)
    await settle()
  },
}

export const SituationPhone: Story = {
  name: 'Interim situation with a specification, phone',
  render: () => <OnPhone start={D2_ROUTES.situation} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysOverflow(canvasElement)
  },
}

/**
 * Invoice F-2026-0415 in EUR to Donau Bau GmbH: the currency block in the header, the lines in
 * EUR with S 20%, S 10%, E¹ and AE², the reasons once under the totals, and the RSD equivalents
 * with the rate line only in the totals.
 */
export const EurInvoiceScreen: Story = {
  name: 'Invoice in EUR, mixed tax categories',
  render: () => <ExampleApp start={D2_ROUTES.eur} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const recap = recapRows(canvasElement)
    await expect(recap).toHaveLength(4)
    await expect(total(lineAmounts(canvas.getByRole('table', { name: 'Lines' })))).toBe(
      total(recap.map((row) => row.base)),
    )
    await expect(total(recap.map((row) => row.base + row.tax))).toBe(
      totalsAmount(canvasElement, 'Invoice total'),
    )
    await expect(
      totalsAmount(canvasElement, 'Total without VAT in RSD') +
        totalsAmount(canvasElement, 'VAT in RSD'),
    ).toBe(totalsAmount(canvasElement, 'Invoice total in RSD'))
    await expect(canvasElement).toHaveTextContent(
      '1 EUR = 117,1825 RSD, NBS middle rate on 05.10.2026.',
    )
    await expect(canvasElement).toHaveTextContent('¹ E: returnable packaging')
  },
}

export const EurInvoicePhone: Story = {
  name: 'Invoice in EUR, mixed tax categories, phone',
  render: () => <OnPhone start={D2_ROUTES.eur} />,
  play: async ({ canvasElement }) => {
    await settle()
    // Footnotes stay on phones.
    await expect(canvasElement).toHaveTextContent('² AE: reverse charge')
    await noSidewaysOverflow(canvasElement)
  },
}

/**
 * Decrease document KO-2026-0009 against F-2026-0410 (Medic Lab Niš d.o.o.): the source in the
 * header beside the customer ("Corrects" with the invoice's link, state, date and total; P5.23),
 * the lines as Original / Change / New (item names on at most two lines), the totals of the
 * change; original total plus the change is the new total.
 */
export const DecreaseScreen: Story = {
  name: 'Decrease document',
  render: () => <ExampleApp start={D2_ROUTES.decrease} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Corrected lines' })
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)
    const change = headers.indexOf('Change')
    const changes = [...table.querySelectorAll('tbody > tr')].map((row) =>
      paras(row.querySelectorAll('td')[change]?.textContent),
    )
    const base = totalsAmount(canvasElement, 'Change of tax base S 20%')
    await expect(total(changes)).toBe(base)
    const decrease = totalsAmount(canvasElement, 'Total decrease')
    await expect(base + totalsAmount(canvasElement, 'Change of VAT S 20%')).toBe(decrease)
    // 186.420,35 (F-2026-0410 as issued) − 18.657,60 = 167.762,75 (the invoice in the list).
    await expect(canvasElement).toHaveTextContent('186.420,35')
    await expect(paras('186.420,35') + decrease).toBe(paras('167.762,75'))
    await expect(canvasElement).toHaveTextContent('167.762,75')
    // The source at the customer's level, before the key figures (P5.23).
    const source = canvasElement.querySelector('[data-slot="document-source"]')
    await expect(source?.closest('[data-slot="document-parties"]')).toHaveTextContent('Medic Lab')
    const link = within(source as HTMLElement).getByRole('link', { name: 'Invoice F-2026-0410' })
    await expect(link).toHaveAttribute('href', '#/sales/invoices/F-2026-0410')
    await expect(source).toHaveTextContent('Partially paid')
    await expect(source).toHaveTextContent('25.09.2026.')
    await expect(canvas.queryByText('Corrects:')).toBeNull()
    await expectAtMostTwoLines(table, 'Item')
  },
}

export const DecreasePhone: Story = {
  name: 'Decrease document, phone',
  render: () => <OnPhone start={D2_ROUTES.decrease} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysOverflow(canvasElement)
  },
}

/**
 * Cancelled invoice F-2026-0407: the banner at the top says who cancelled it, when and why, and
 * links to cancellation document ST-2026-0004, which links back ("Cancels"); its totals are the
 * invoice's, negated.
 */
export const CancelledScreen: Story = {
  name: 'Cancelled invoice and its cancellation document',
  render: () => <ExampleApp start={D2_ROUTES.cancelled} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(
      'Cancelled by Milica Petrović on 06.10.2026. at 11:20.',
    )
  },
}

export const CancelledScreenInteraction: Story = {
  name: 'Cancelled invoice and its cancellation document, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={D2_ROUTES.cancelled} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent(
      'Cancelled by Milica Petrović on 06.10.2026. at 11:20.',
    )
    const invoiceTotal = totalsAmount(canvasElement, 'Invoice total')
    await expect(total(lineAmounts(canvas.getByRole('table', { name: 'Lines' })))).toBe(
      totalsAmount(canvasElement, 'Total without VAT'),
    )
    // The banner's link (the side panel lists the same document).
    const [link] = canvas.getAllByRole('link', { name: 'Cancellation document ST-2026-0004' })
    if (link !== undefined) await userEvent.click(link)
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'ST-2026-0004' }),
    ).toBeVisible()
    await expect(totalsAmount(canvasElement, 'Total')).toBe(-invoiceTotal)
    // And back, from the source in its header (P5.23).
    const source = canvasElement.querySelector('[data-slot="document-source"]')
    await expect(source).toHaveTextContent('Cancels')
    await userEvent.click(
      within(source as HTMLElement).getByRole('link', { name: 'Invoice F-2026-0407' }),
    )
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'F-2026-0407' }),
    ).toBeVisible()
  },
}

export const CancelledPhone: Story = {
  name: 'Cancelled invoice, phone',
  render: () => <OnPhone start={D2_ROUTES.cancelled} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysOverflow(canvasElement)
  },
}

/** The cancellation document ST-2026-0004 on its own. */
export const CancellationScreen: Story = {
  name: 'Cancellation document',
  render: () => <ExampleApp start={D2_ROUTES.cancellation} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(total(lineAmounts(canvas.getByRole('table', { name: 'Lines' })))).toBe(
      totalsAmount(canvasElement, 'Total without VAT'),
    )
    await expect(canvasElement).toHaveTextContent('-94.500,00')
  },
}

export const CancellationPhone: Story = {
  name: 'Cancellation document, phone',
  render: () => <OnPhone start={D2_ROUTES.cancellation} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysOverflow(canvasElement)
  },
}

// ── P5 group D1 ──

// SERBIAN: the format declared in group F's block above (one per file).
// As the page's text reads it (the no-break space of an amount is a space there).
const rsd = (value: string) => SERBIAN.money(value, 'RSD').replace(/\s/gu, ' ')

/** The draft's lines after the walk-through: the last line is the new service, 24 hours. */
function draftAfterCreate(): DraftLine[] {
  const lines = initialDraft()
  const last = lines[lines.length - 1] ?? newLine()
  const option = { value: NEW_SERVICE.value, label: NEW_SERVICE.name, kind: 'service' }
  return [...lines.slice(0, -1), { ...fromRecord(last, option), quantity: '24' }]
}

/**
 * P5.18: a draft to Bojović i sinovi d.o.o. whose lines are added by search — items with their
 * stock (a warning when the quantity is above it), services, a fixed asset sold (its number, and
 * its book value marked internal) — in two sections with subtotals, a text line and a discount,
 * S 20% and S 10%. The walk-through creates the service "Montaža skele" from the last line's
 * search ("+ Create service …"), enters 24 hours, and the totals follow (computed in data-D1.ts).
 */
export const D1InvoiceDraft: Story = {
  name: 'Invoice draft, lines by search',
  render: () => <ExampleApp start={D1_ROUTES.draft} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const before = draftTotals(initialDraft())
    await expect(canvasElement).toHaveTextContent(rsd(before.total.value ?? '0'))
    await expect(
      canvas.getByText('Only 36 pc of ART-0118 in stock: the rest goes on back order.'),
    ).toBeVisible()
    await expect(canvas.getByText('Internal')).toBeVisible()
    await settle()
  },
}

export const D1InvoiceDraftInteraction: Story = {
  name: 'Invoice draft, lines by search, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={D1_ROUTES.draft} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const before = draftTotals(initialDraft())
    await expect(canvasElement).toHaveTextContent(rsd(before.total.value ?? '0'))
    await expect(
      canvas.getByText('Only 36 pc of ART-0118 in stock: the rest goes on back order.'),
    ).toBeVisible()
    await expect(canvas.getByText('Internal')).toBeVisible()
    // The last line: search, nothing found, "+ Create service …" with the typed name.
    const item = canvas.getByRole('combobox', { name: 'Item, service or asset, line 13' })
    await userEvent.click(item)
    await userEvent.type(item, NEW_SERVICE.name, { delay: 0 })
    const body = within(document.body)
    await userEvent.click(
      await body.findByRole(
        'option',
        { name: `Create service “${NEW_SERVICE.name}”` },
        { timeout: 3000 },
      ),
    )
    const panel = await body.findByRole('dialog', { name: 'New service' })
    await userEvent.type(within(panel).getByRole('textbox', { name: /^Price/ }), '1850')
    await userEvent.click(within(panel).getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(item).toHaveValue(NEW_SERVICE.name)
    // The quantity, and the totals the Core computes again.
    const quantity = canvas.getByRole('textbox', { name: 'Quantity, line 13' })
    await userEvent.click(quantity)
    await userEvent.keyboard('24{Tab}')
    const after = draftTotals(draftAfterCreate())
    await waitFor(() => expect(canvasElement).toHaveTextContent(rsd(after.total.value ?? '0')))
    await expect(canvasElement).toHaveTextContent(rsd(after.net))
    await settle()
  },
}

export const D1InvoiceDraftPhone: Story = {
  name: 'Invoice draft, lines by search, phone',
  render: () => <OnPhone start={D1_ROUTES.draft} />,
  play: async ({ canvasElement }) => {
    await settle()
    const before = draftTotals(initialDraft())
    await expect(canvasElement).toHaveTextContent(rsd(before.net))
    await expect(
      within(canvasElement).getByRole('button', { name: 'More options: Add line' }),
    ).toBeVisible()
    // Nothing overflows sideways at phone width.
    const main = canvasElement.querySelector('main')
    await expect(main === null ? 0 : main.scrollWidth - main.clientWidth).toBeLessThanOrEqual(0)
  },
}

/**
 * P5.18: the specification of works of IS-2026-007 (Vojvođanka Mlin a.d., contract 12/2026):
 * 300 positions in 12 groups, each group a heading and a subtotal, Previous / This period /
 * Cumulative quantities, edited like document lines. Changing a position's quantity this period
 * updates its amount, its group's subtotal, the key figure and the recap (data-D1.ts).
 */
export const D1Specification: Story = {
  name: 'Interim situation, editing the specification',
  render: () => <ExampleApp start={D1_ROUTES.specification} />,
  play: async ({ canvasElement }) => {
    await settle()
    const rows = specificationOf()
    const before = specTotals(rows)
    await expect(before.positions).toBe(300)
    await expect(canvasElement).toHaveTextContent(rsd(fromParas(before.current)))
    // Every row is in the table's count (with the header and the totals); only the rows around
    // the view are drawn. (Queries by role or name would compute the names of 1,800 fields.)
    await expect(canvasElement.querySelector('table')).toHaveAttribute(
      'aria-rowcount',
      String(rows.length + 2),
    )
  },
}

export const D1SpecificationInteraction: Story = {
  name: 'Interim situation, editing the specification, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={D1_ROUTES.specification} />,
  play: async ({ canvasElement }) => {
    await settle()
    const rows = specificationOf()
    const before = specTotals(rows)
    await expect(before.positions).toBe(300)
    await expect(canvasElement).toHaveTextContent(rsd(fromParas(before.contract)))
    await expect(canvasElement).toHaveTextContent(rsd(fromParas(before.current)))
    // Cells found by their row and column (a query by name would name all 1,800 fields).
    const cellOf = (rowId: string) =>
      canvasElement.querySelector<HTMLInputElement>(
        `[data-row-id="${rowId}"] [data-column-id="current"] input`,
      )
    // Every row is in the table's count (with the header and the totals); only the rows around
    // the view are drawn.
    const table = within(canvasElement).getByRole('table', { name: 'Specification of works' })
    await expect(table).toHaveAttribute('aria-rowcount', String(rows.length + 2))
    // Position 1.1 (line 2): 5 units this period; Enter goes to position 1.2.
    const cell = cellOf('p1-1')
    await expect(cell).toHaveAccessibleName('This period, line 2')
    if (cell === null) return
    await userEvent.click(cell)
    await userEvent.keyboard('{Control>}a{/Control}5{Enter}')
    await expect(cellOf('p1-2')).toHaveFocus()
    const after = specTotals(
      rows.map((row) => (row.id === 'p1-1' ? { ...row, current: '5' } : row)),
    )
    await waitFor(() => expect(canvasElement).toHaveTextContent(rsd(fromParas(after.current))))
    await expect(canvasElement).toHaveTextContent(rsd(after.recap.total.value ?? '0'))
    await settle()
  },
}

export const D1SpecificationPhone: Story = {
  name: 'Interim situation, editing the specification, phone',
  render: () => <OnPhone start={D1_ROUTES.specification} />,
  play: async ({ canvasElement }) => {
    await settle()
    const before = specTotals(specificationOf())
    await expect(canvasElement).toHaveTextContent(rsd(fromParas(before.current)))
    const main = canvasElement.querySelector('main')
    await expect(main === null ? 0 : main.scrollWidth - main.clientWidth).toBeLessThanOrEqual(0)
  },
}

// ── P5.23 bank statement, line by line ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { STATEMENT_TOTALS } from './data-bank'
import { BANK_ROUTES } from './screens-bank'

const SERBIAN_BANK = createFormat('sr-Latn-RS')

/** The detail bar's position text ("3 of 10"). */
function position(canvasElement: HTMLElement): string {
  return canvasElement.querySelector('[data-slot="worklist-position"]')?.textContent ?? ''
}

/**
 * Bank statement 188 of 06.10.2026 (Banca Intesa), worked line by line as the supplier invoices
 * are approved: the statement's balances (they check out), its file and progress; ten lines,
 * two done, one left for later; line 3 (a partial payment) in focus. "Confirm and next" decides
 * it, the toast offers Undo, and line 4 (a supplier invoice paid in full) opens.
 */
export const BankStatementScreen: Story = {
  name: 'Bank statement 188',
  render: () => <ExampleApp start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Statement 188' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent(
      SERBIAN_BANK.number(STATEMENT_TOTALS.closing, { decimals: 2 }),
    )
    await expect(canvasElement).toHaveTextContent('Balance checks out')
    await expect(canvasElement).toHaveTextContent('2 of 10 lines done')
    await expect(position(canvasElement)).toBe('3 of 10')
    // Posting waits for the lines, and says why.
    await expect(canvasElement).toHaveTextContent(
      '7 lines still need a decision, and 1 line is left for later.',
    )
    await expect(canvasElement).toHaveTextContent('17.762,75 RSD stays open')
    await settle()
  },
}

export const BankStatementScreenInteraction: Story = {
  name: 'Bank statement 188, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Statement 188' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent(
      SERBIAN_BANK.number(STATEMENT_TOTALS.closing, { decimals: 2 }),
    )
    await expect(canvasElement).toHaveTextContent('Balance checks out')
    await expect(canvasElement).toHaveTextContent('2 of 10 lines done')
    await expect(position(canvasElement)).toBe('3 of 10')
    // Posting waits for the lines, and says why.
    await expect(canvasElement).toHaveTextContent(
      '7 lines still need a decision, and 1 line is left for later.',
    )
    await expect(canvasElement).toHaveTextContent('17.762,75 RSD stays open')
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm and next' }))
    await expect(
      await within(document.body).findByText(/Line 3 done: Pays part of F-2026-0410/),
    ).toBeInTheDocument()
    await expect(position(canvasElement)).toBe('4 of 10')
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Gradska mehanizacija d.o.o.' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('3 of 10 lines done')
    await expect(canvasElement).toHaveTextContent('Closes UF-2026-1204 in full.')
    await settle()
  },
}

/**
 * Line 3 in focus: Medic Lab Niš pays 50.000,00 RSD of F-2026-0410, which owes 67.762,75 RSD
 * after its decrease; the result is shown before confirming, and the rest stays open (writing it
 * off is offered only up to 100,00 RSD).
 */
export const BankStatementPartial: Story = {
  name: 'Bank statement 188, partial payment',
  render: () => <ExampleApp start={BANK_ROUTES.partial} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0410/ })).toBeChecked()
    await expect(canvasElement).toHaveTextContent(
      'Pays 50.000,00 RSD of F-2026-0410; 17.762,75 RSD stays open.',
    )
    const difference = canvas.getByRole('radiogroup', { name: /The difference of 17\.762,75\sRSD/ })
    await expect(within(difference).getByRole('radio', { name: /Leave it open/ })).toBeChecked()
    await expect(within(difference).getByRole('radio', { name: /Write it off/ })).toBeDisabled()
    await settle()
  },
}

export const BankStatementPartialInteraction: Story = {
  name: 'Bank statement 188, partial payment, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={BANK_ROUTES.partial} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0410/ })).toBeChecked()
    await expect(canvasElement).toHaveTextContent(
      'Pays 50.000,00 RSD of F-2026-0410; 17.762,75 RSD stays open.',
    )
    const difference = canvas.getByRole('radiogroup', { name: /The difference of 17\.762,75\sRSD/ })
    await expect(within(difference).getByRole('radio', { name: /Leave it open/ })).toBeChecked()
    await expect(within(difference).getByRole('radio', { name: /Write it off/ })).toBeDisabled()
    // The detail scrolled to its end, as a user who reads down to the difference: ticking a
    // second open item adds a result line, unticking it takes the line away again, and what is
    // in view never moves (the pane keeps its scroll position, P5.23).
    const second = canvas.getByRole('checkbox', { name: /^F-2026-0381/ })
    const pane = second.closest<HTMLElement>('.overflow-y-auto')
    if (pane === null) throw new Error('no scrolling detail')
    pane.scrollTop = pane.scrollHeight
    await settle()
    const before = second.getBoundingClientRect().top
    await userEvent.click(second)
    await expect(canvasElement).toHaveTextContent('Nothing is left for F-2026-0381')
    await userEvent.click(second)
    await waitFor(async () => {
      await expect(canvasElement).not.toHaveTextContent('Nothing is left for F-2026-0381')
    })
    await settle()
    await expect(Math.abs(second.getBoundingClientRect().top - before)).toBeLessThan(1)
  },
}

/**
 * Every line decided: "Post statement" asks first, with the summary (lines that close open
 * items, lines posted to accounts, money in and out) and the journal entry's preview, which
 * balances.
 */
export const BankStatementPost: Story = {
  name: 'Bank statement 188, posting',
  render: () => <ExampleApp start={BANK_ROUTES.decided} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('10 of 10 lines done')
    await settle()
  },
}

export const BankStatementPostInteraction: Story = {
  name: 'Bank statement 188, posting, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={BANK_ROUTES.decided} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('10 of 10 lines done')
    await userEvent.click(canvas.getByRole('button', { name: 'Post statement' }))
    const dialog = await within(document.body).findByRole('alertdialog', {
      name: 'Post statement 188?',
    })
    await expect(dialog).toHaveTextContent('4 lines, 4 items')
    await expect(dialog).toHaveTextContent('6 lines')
    const bar = dialog.querySelector('[data-slot="balance-bar"]')
    if (bar === null) throw new Error('no balance bar')
    await expect(bar).toHaveTextContent('Balanced')
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await settle()
  },
}

/**
 * Phone: line 3 (the partial payment) on its own screen, the whole detail in one column: the
 * bank's data, the open items, the result and the difference.
 */
export const BankStatementPartialPhone: Story = {
  name: 'Bank statement 188, partial payment, phone',
  render: () => <OnPhone start={BANK_ROUTES.partial} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0410/ })).toBeChecked()
    await expect(canvasElement).toHaveTextContent(
      'Pays 50.000,00 RSD of F-2026-0410; 17.762,75 RSD stays open.',
    )
  },
}

/** Phone: the statement's summary, then the list of lines; the posting in the bottom bar. */
export const BankStatementPhone: Story = {
  name: 'Bank statement 188, phone',
  render: () => <OnPhone start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Lines of statement 188' })).toBeVisible()
    const page = canvasElement.querySelector('[data-slot="worklist-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
    await settle()
  },
}

/**
 * Phone, one line full screen: Zlatibor Turs paid 0,40 RSD less than F-2026-0406; the
 * difference is written off as the Core suggests; "7 of 10" in the header and "Confirm and next"
 * in the bottom bar; no list beside or under it.
 */
export const BankStatementLinePhone: Story = {
  name: 'Bank statement 188, phone, line in focus',
  render: () => <OnPhone start={BANK_ROUTES.difference} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(position(canvasElement)).toBe('7 of 10')
    await expect(canvas.queryByRole('list', { name: 'Lines of statement 188' })).toBeNull()
    await expect(canvasElement).toHaveTextContent('Same customer, amount differs by 0,40 RSD')
    await expect(canvasElement).toHaveTextContent('Closes F-2026-0406; 0,40 RSD is written off.')
    await expect(canvas.getByRole('button', { name: 'Confirm and next' })).toBeVisible()
    const page = canvasElement.querySelector('[data-slot="worklist-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
    await settle()
  },
}

// ── P5.17 group J: Learning and printouts ──

import { J_ROUTES } from './data-J'

/**
 * The occupational-safety course "Bezbednost i zdravlje na radu" as Nikola Marković, a site
 * worker of Kvadrat Gradnja d.o.o., left it: 5 of 8 lessons done, "Manual handling of loads"
 * next; the lesson after it is locked until this one is done, the final test until every lesson
 * is.
 */
export const SafetyCourseLesson: Story = {
  name: 'Safety course, lesson',
  render: () => <ExampleApp start={J_ROUTES.lesson} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Bezbednost i zdravlje na radu',
    )
    await expect(canvas.getByText('5 of 8 lessons')).toBeVisible()
    const outline = canvas.getByRole('navigation', { name: 'Course outline' })
    const current = within(outline).getByRole('link', { current: 'page' })
    await expect(current).toHaveTextContent('Manual handling of loads')
    await expect(current).toHaveAttribute('data-state', 'todo')
    await expect(
      within(outline).getByText(
        'Reading · 11 min · Locked: finish “Manual handling of loads” first',
      ),
    ).toBeVisible()
    await expect(
      within(outline).getByText('Quiz · 5 questions · Locked: finish every lesson first'),
    ).toBeVisible()
    await expect(within(outline).queryByRole('link', { name: /Final test/ })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Mark as done' })).toBeEnabled()
    // The next lesson is locked: the pager offers only the previous one.
    const pager = canvas.getByRole('navigation', { name: 'Lessons' })
    await expect(within(pager).queryByRole('link', { name: /Next lesson/ })).toBeNull()
    await expect(within(pager).getByRole('link', { name: /Previous lesson/ })).toBeVisible()
  },
}

/** Phone: the lesson first, the outline behind "Course outline". */
export const SafetyCourseLessonPhone: Story = {
  name: 'Safety course, lesson, phone',
  render: () => <OnPhone start={J_ROUTES.lesson} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Course outline' })).toBeVisible()
    await expect(canvas.queryByRole('navigation', { name: 'Course outline' })).toBeNull()
    await expect(canvas.getByText('5 of 8 lessons')).toBeVisible()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="course-page"]')
    if (page === null) throw new Error('no course page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** Phone, the outline open: done, to do, and the locked lessons with their reasons. */
export const SafetyCourseOutlinePhone: Story = {
  name: 'Safety course, outline, phone',
  render: () => <OnPhone start={J_ROUTES.lessonOutline} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Course outline' })
    await settle()
    await expect(within(dialog).getByRole('link', { current: 'page' })).toHaveTextContent(
      'Manual handling of loads',
    )
    await expect(within(dialog).getByText(/Locked: finish every lesson first/)).toBeVisible()
    await expect(within(dialog).getByText('2 of 2 done')).toBeVisible()
  },
}

/** The final test on the general Questionnaire, resumed at the third of five questions. */
export const SafetyCourseTest: Story = {
  name: 'Safety course, final test',
  render: () => <ExampleApp start={J_ROUTES.test} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('7 of 8 lessons')).toBeVisible()
    await expect(canvas.getByText('2 of 5 answered')).toBeVisible()
    await expect(
      canvas.getByRole('group', { name: /Which equipment must every worker wear on the site\?/ }),
    ).toBeVisible()
    await expect(canvas.queryByRole('region', { name: 'Course completed' })).toBeNull()
  },
}

/** The first attempt, not passed: 3 of 5, the answers with the correct ones, "Take the test again". */
export const SafetyCourseTestNotPassed: Story = {
  name: 'Safety course, test not passed',
  render: () => <ExampleApp start={J_ROUTES.testNotPassed} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Not passed')).toBeVisible()
    await expect(canvas.getByText('3 of 5 correct')).toBeVisible()
    await expect(canvas.getByText('You need 4 correct answers to pass.')).toBeVisible()
    await expect(canvas.getByText('Correct answer: From 2 m')).toBeVisible()
    await expect(
      canvas.getByText('Correct answer: Safety helmet, Safety boots, High-visibility vest'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Take the test again' })).toBeEnabled()
    await expect(canvas.getByText('7 of 8 lessons')).toBeVisible()
  },
}

/** Passed: the course completed, "Download certificate" and the certificate's preview. */
export const SafetyCourseCompleted: Story = {
  name: 'Safety course, completed',
  render: () => <ExampleApp start={J_ROUTES.completed} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('8 of 8 lessons')).toBeVisible()
    const completion = canvas.getByRole('region', { name: 'Course completed' })
    await expect(completion).toHaveTextContent(
      'Completed on 06.10.2026. with 4 of 5 correct answers in the final test.',
    )
    await expect(
      within(completion).getByRole('button', { name: 'Download certificate' }),
    ).toBeEnabled()
    await expect(
      within(completion).getByRole('figure', { name: 'Certificate preview' }),
    ).toHaveTextContent('Nikola Marković')
    await expect(canvas.getByText('4 of 5 correct')).toBeVisible()
    await expect(canvas.getByText('Passed')).toBeVisible()
  },
}

export const SafetyCourseCompletedPhone: Story = {
  name: 'Safety course, completed, phone',
  render: () => <OnPhone start={J_ROUTES.completed} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Download certificate' })).toBeVisible()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="course-page"]')
    if (page === null) throw new Error('no course page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/**
 * The course worked through: "Mark as done" saves and the next lesson opens; the final test
 * not passed, taken again and passed; "Download certificate" opens the certificate's printout,
 * and its back button returns to the course.
 */
export const SafetyCourseInteraction: Story = {
  name: 'Safety course, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={J_ROUTES.lesson} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as done' }))
    await settle()
    await expect(await canvas.findByText('6 of 8 lessons')).toBeVisible()
    await expect(canvas.getByText('Lesson completed')).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: /Next lesson/ }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 2, name: 'Cranes, slings and signals' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as done' }))
    await settle()
    await expect(await canvas.findByText('7 of 8 lessons')).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: /Next lesson/ }))
    await settle()
    // The test resumes at the third question; two answers wrong.
    await userEvent.click(await canvas.findByRole('checkbox', { name: /Safety helmet/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(await canvas.findByRole('radio', { name: /Loads up to 40 kg/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(await canvas.findByRole('radio', { name: /One signaller/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Review answers' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit answers' }))
    await expect(await canvas.findByText('Not passed')).toBeVisible()
    await expect(canvas.getByText('3 of 5 correct')).toBeVisible()
    // Again, from the first question, every answer right.
    await userEvent.click(canvas.getByRole('button', { name: 'Take the test again' }))
    await userEvent.click(await canvas.findByRole('radio', { name: /From 2 m/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(await canvas.findByRole('radio', { name: /A competent person/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    for (const name of [/Safety helmet/, /Safety boots/, /High-visibility vest/]) {
      await userEvent.click(await canvas.findByRole('checkbox', { name }))
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(await canvas.findByRole('radio', { name: /Loads up to 25 kg/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(await canvas.findByRole('radio', { name: /One signaller/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Review answers' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit answers' }))
    await expect(await canvas.findByText('Passed')).toBeVisible()
    await expect(canvas.getByText('5 of 5 correct')).toBeVisible()
    await expect(canvas.getByText('8 of 8 lessons')).toBeVisible()
    const completion = canvas.getByRole('region', { name: 'Course completed' })
    await userEvent.click(within(completion).getByRole('button', { name: 'Download certificate' }))
    await settle()
    await expect(
      await canvas.findByRole('article', { name: 'Certificate: Nikola Marković' }),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('link', { name: 'Back to Bezbednost i zdravlje na radu' }),
    )
    await settle()
    await expect(await canvas.findByText('8 of 8 lessons')).toBeVisible()
  },
}

/** Invoice F-2026-0412 on paper: the lines and totals of its page, from the same data. */
export const PrintoutInvoice: Story = {
  name: 'Printout, invoice F-2026-0412',
  render: () => <ExampleApp start={J_ROUTES.invoicePrint} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const sheet = canvas.getByRole('article', { name: `Invoice ${FEATURED}` })
    await expect(sheet).toHaveAttribute('data-liro-theme', 'light')
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(`Invoice ${FEATURED}`)
    const lines = canvas.getByRole('table', { name: 'Lines' })
    await expect(within(lines).getAllByRole('row')).toHaveLength(6)
    const totals = sheet.querySelector('[data-slot="document-totals"]')
    await expect(totals).toHaveAttribute('aria-label', 'Totals')
    await expect(totals).toHaveTextContent('185.954,00')
    await expect(totals).toHaveTextContent('135.954,00')
    await expect(canvas.getByText('Novi Sad, 28.09.2026.')).toBeVisible()
    await expect(canvas.getByRole('link', { name: `Back to ${FEATURED}` })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Print' })).toBeVisible()
  },
}

export const PrintoutInvoicePhone: Story = {
  name: 'Printout, invoice F-2026-0412, phone',
  render: () => <OnPhone start={J_ROUTES.invoicePrint} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no print page')
    // The sheet is scaled down to the phone's width: nothing scrolls sideways.
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** The invoice's "PDF" opens its printout; the back button returns to the invoice. */
export const PrintoutInvoiceInteraction: Story = {
  name: 'Printout, invoice from its page, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={ROUTES.invoice(FEATURED)} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'PDF' }))
    await settle()
    const sheet = await canvas.findByRole('article', { name: `Invoice ${FEATURED}` })
    await expect(sheet.querySelector('[data-slot="document-totals"]')).toHaveTextContent(
      '135.954,00',
    )
    await userEvent.click(canvas.getByRole('link', { name: `Back to ${FEATURED}` }))
    await settle()
    await expect(await canvas.findByRole('heading', { level: 1, name: FEATURED })).toBeVisible()
  },
}

/** The course certificate, landscape, from "Download certificate". */
export const PrintoutCertificate: Story = {
  name: 'Printout, certificate',
  render: () => <ExampleApp start={J_ROUTES.certificate} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const sheet = canvas.getByRole('article', { name: 'Certificate: Nikola Marković' })
    await expect(sheet).toHaveAttribute('data-orientation', 'landscape')
    await expect(canvas.getByText('Novi Sad, 06.10.2026.')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'Back to Bezbednost i zdravlje na radu' }),
    ).toBeVisible()
  },
}

export const PrintoutCertificatePhone: Story = {
  name: 'Printout, certificate, phone',
  render: () => <OnPhone start={J_ROUTES.certificate} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no print page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** A pupil's report card from OŠ „Jovan Popović“ Novi Sad; the average is the school's. */
export const PrintoutReportCard: Story = {
  name: 'Printout, school report',
  render: () => <ExampleApp start={J_ROUTES.reportCard} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Report card')
    const table = canvas.getByRole('table', { name: 'Final grades by subject' })
    await expect(within(table).getByRole('rowheader', { name: 'Average grade' })).toBeVisible()
    await expect(table).toHaveTextContent('4,57')
    await expect(canvas.getByRole('img', { name: 'OŠ „Jovan Popović“ Novi Sad' })).toBeVisible()
  },
}

export const PrintoutReportCardPhone: Story = {
  name: 'Printout, school report, phone',
  render: () => <OnPhone start={J_ROUTES.reportCard} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no print page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** A specialist's finding from Dom zdravlja Novi Sad, confidential on every page. */
export const PrintoutFinding: Story = {
  name: 'Printout, medical finding',
  render: () => <ExampleApp start={J_ROUTES.finding} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Patient' })).toHaveTextContent(
      'Svetlana Đorđević',
    )
    await expect(
      canvas.getByRole('table', { name: 'Laboratory results, 03.10.2026.' }),
    ).toHaveTextContent('6,4')
    await expect(canvasElement.querySelector('[data-slot="print-confidentiality"]')).not.toBeNull()
  },
}

export const PrintoutFindingPhone: Story = {
  name: 'Printout, medical finding, phone',
  render: () => <OnPhone start={J_ROUTES.finding} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no print page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

// ── P5.24 working time and P5.17 industry examples ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { CLOCK_DAY, CREW, crewSum, SITE, STORE_PUBLISH, TOTALS_LOCKED, TOTALS_OPEN } from './data-G'
import { ABSENCE_COUNTS, FINDING, JOVANA_BOOKING, PATIENT } from './data-H'
import { G_ROUTES } from './screens-G'
import { H_ROUTES } from './screens-H'

const SERBIAN_G = createFormat('sr-Latn-RS')

/** The page does not scroll sideways (the wide grids scroll inside their own box). */
async function noPageOverflow(canvasElement: HTMLElement) {
  const main = canvasElement.querySelector('main')
  await expect(main === null ? 0 : main.scrollWidth - main.clientWidth).toBeLessThanOrEqual(0)
}

/**
 * Kvadrat Gradnja's site crew, October 2026 (P5.24 a, c): ten workers × the month's days in
 * hours and a code — regular work, night work with its allowance, overtime, the illustrative
 * public holiday on 20.10. (labelled so), sick leave, annual leave, a business trip, paid and
 * unpaid leave, an absence. Totals per type per worker and per day are the application's; the
 * key figures above are the crew's. "Hand off to payroll" ends the month.
 */
export const SiteTimesheet: Story = {
  name: 'Site timesheet, October 2026',
  render: () => <ExampleApp start={G_ROUTES.timesheet} />,
  play: async ({ canvasElement }) => {
    await settle()
    // Plain DOM queries: the grid has some 400 cells, and role queries walk all of them.
    await expect(canvasElement.querySelector('h1')).toHaveTextContent('Timesheet, October 2026')
    const headers = [...canvasElement.querySelectorAll('[role="columnheader"]')].map(
      (header) => header.textContent,
    )
    await expect(headers.some((text) => text.includes('Illustrative public holiday'))).toBe(true)
    await expect(headers.some((text) => text.includes('Night hours'))).toBe(true)
    await expect(canvasElement).toHaveTextContent(
      `${SERBIAN_G.number(crewSum(TOTALS_OPEN.rowTotals, 'worked'))} h`,
    )
    await expect(canvasElement).toHaveTextContent('Hand off to payroll')
  },
}

export const SiteTimesheetPhone: Story = {
  name: 'Site timesheet, October 2026, phone',
  render: () => <OnPhone start={G_ROUTES.timesheet} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // One worker per screen: the first, then Next.
    await expect(canvas.getByRole('heading', { name: CREW[0]?.label ?? '' })).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

/**
 * The month locked after payroll: read-only, the lock's reason and who locked it; one
 * correction — Vladimir Tomić's absence on 28.10. was sick leave (the certificate came after the
 * payroll run) — kept with the original, who, when and why. His total and the day's total
 * include it.
 */
export const SiteTimesheetLocked: Story = {
  name: 'Site timesheet, locked after payroll',
  render: () => <ExampleApp start={G_ROUTES.timesheetLocked} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Payroll for October 2026 has been calculated.')
    await expect(canvasElement).toHaveTextContent(SITE.lockedDetail)
    await expect(canvasElement).toHaveTextContent('Corrections')
    await expect(canvasElement).toHaveTextContent('Sick-leave certificate for 28.10.')
    await expect(canvasElement).toHaveTextContent(
      `${SERBIAN_G.number(crewSum(TOTALS_LOCKED.rowTotals, 'leave'))} h`,
    )
  },
}

/** Phone: the locked month on Vladimir Tomić, whose day was corrected. */
export const SiteTimesheetLockedPhone: Story = {
  name: 'Site timesheet, locked after payroll, phone',
  render: () => <OnPhone start={G_ROUTES.timesheetLockedWorker} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { name: 'Vladimir Tomić' }),
    ).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

/**
 * The clock records of Thursday 29.10.2026 from the site's gate terminal (one from a phone at
 * the crane): each record's hours are that day's hours in the timesheet; Milan Jovanović's
 * missing clock-out corrected by the foreman, the original kept; the guard's night ends the next
 * day.
 */
export const SiteClockRecords: Story = {
  name: 'Site clock records, 29.10.2026',
  render: () => <ExampleApp start={G_ROUTES.clockRecords} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Clock records' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Forgot to clock out')
    await expect(canvasElement).toHaveTextContent('next day')
    await expect(canvasElement).toHaveTextContent(SERBIAN_G.date(CLOCK_DAY))
  },
}

export const SiteClockRecordsPhone: Story = {
  name: 'Site clock records, 29.10.2026, phone',
  render: () => <OnPhone start={G_ROUTES.clockRecords} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Forgot to clock out')
    await noPageOverflow(canvasElement)
  },
}

/**
 * Prodavnica 12, the week of 12.–18.10.2026 (P5.24 b): early 07–15 and late 15–23, by person
 * (or by team); published, then changed (two shifts marked "Changed"); conflicts from the
 * application — Luka Đorđević's 8 hours of rest between a late and an early shift, Sanja
 * Vuković's approved leave — and the coverage per day ("One short in the late shift" on Thursday).
 * "Publish changes" states the counts.
 */
export const StoreShifts: Story = {
  name: 'Store shifts, Prodavnica 12',
  render: () => <ExampleApp start={G_ROUTES.storePlanner} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('Changed since publishing')
    await expect(canvasElement).toHaveTextContent('Approved annual leave on 18.10.2026')
    await expect(canvas.getByRole('button', { name: 'Publish changes' })).toBeVisible()
  },
}

export const StoreShiftsPhone: Story = {
  name: 'Store shifts, Prodavnica 12, phone',
  render: () => <OnPhone start={G_ROUTES.storePlanner} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Luka Đorđević')
    await noPageOverflow(canvasElement)
  },
}

export const StoreShiftsPublish: Story = {
  name: 'Store shifts, publish, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={G_ROUTES.storePlanner} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Publish changes' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await expect(dialog).toHaveTextContent(
      `${String(STORE_PUBLISH.shifts)} shifts for ${String(STORE_PUBLISH.people)} people`,
    )
    await userEvent.click(within(dialog).getByRole('button', { name: /^Publish/ }))
    await expect(
      await within(document.body).findByText(/Changes published\. 8 people were notified\./),
    ).toBeInTheDocument()
    await waitFor(async () => {
      await expect(canvas.queryByText('Changed since publishing')).toBeNull()
    })
  },
}

/**
 * The cashier Stefan Lukić's own shifts (P5.24 b), as published: this week and next; Thursday's
 * changed shift says what it was; Saturday's swap request waits for the manager (it is the first
 * of the swap requests).
 */
export const StoreMyShiftsPhone: Story = {
  name: 'Store, my shifts, phone',
  render: () => <OnPhone start={G_ROUTES.myShifts} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^This week/ })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Swap requested with Jelena Rakić')
    await expect(canvasElement).toHaveTextContent('Was Early, 07:00–15:00')
    await noPageOverflow(canvasElement)
  },
}

export const StoreMyShifts: Story = {
  name: 'Store, my shifts',
  render: () => <ExampleApp start={G_ROUTES.myShifts} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Swap requested with Jelena Rakić')
  },
}

/** A swap request being written for Thursday 15.10., with the colleagues who may take it. */
export const StoreSwapRequestPhone: Story = {
  name: 'Store, my shifts, swap request, phone',
  render: () => <OnPhone start={G_ROUTES.myShiftsSwap} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Request a swap' }),
    ).toHaveTextContent('07:00')
  },
}

export const StoreSwapRequest: Story = {
  name: 'Store, my shifts, swap request',
  render: () => <ExampleApp start={G_ROUTES.myShiftsSwap} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Request a swap' }),
    ).toBeVisible()
  },
}

/**
 * The manager's swap requests (P5.24 b on the approvals pattern, P4.3 and P5.23): one at a time,
 * the shift, who takes it and the shift given back, the reason and the application's check;
 * Reject asks for a reason, Approve is the main action.
 */
export const StoreSwapRequests: Story = {
  name: 'Store, swap requests',
  render: () => <ExampleApp start={G_ROUTES.swapRequests} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2, name: 'Stefan Lukić' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('No conflicts for either of them.')
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeVisible()
  },
}

/** Sanja Vuković's request: the check warns that Nemanja would go over his contract's hours. */
export const StoreSwapRequestWarning: Story = {
  name: 'Store, swap requests, a warning',
  render: () => <ExampleApp start={G_ROUTES.swapRequestWarning} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('above the illustrative 16 h')
  },
}

export const StoreSwapRequestsPhone: Story = {
  name: 'Store, swap requests, phone',
  render: () => <OnPhone start={G_ROUTES.swapRequests} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('list', { name: 'Swap requests to approve' }),
    ).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

export const StoreSwapRequestWarningPhone: Story = {
  name: 'Store, swap requests, a warning, phone',
  render: () => <OnPhone start={G_ROUTES.swapRequestWarning} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('above the illustrative 16 h')
    await expect(within(canvasElement).getByRole('button', { name: 'Approve' })).toBeVisible()
  },
}

export const StoreSwapRequestsReject: Story = {
  name: 'Store, swap requests, reject, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={G_ROUTES.swapRequestWarning} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Reject' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await userEvent.click(
      within(dialog).getByRole('radio', {
        name: 'The colleague would go over the hours of their contract',
      }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))
    await expect(
      await within(document.body).findByText('Swap of Sanja Vuković rejected.'),
    ).toBeInTheDocument()
    await expect(canvas.queryByRole('heading', { level: 2, name: 'Sanja Vuković' })).toBeNull()
  },
}

/**
 * Dom zdravlja Novi Sad, the emergency department (P5.24 b, c): 06–14, 14–22 and 22–06 (the
 * night crosses midnight), by team; the 8-day rotation applied to all twelve, then the changes —
 * a nurse's sick leave, two shifts added to cover — and the conflicts the application found: 8
 * hours of rest after a night, a morning straight after a night, 56 hours in a week (illustrative
 * limits).
 */
export const EmergencyShifts: Story = {
  name: 'Emergency shifts, rotation applied',
  render: () => <ExampleApp start={G_ROUTES.erPlanner} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Nurses and technicians, team A')
    await expect(canvasElement).toHaveTextContent(
      'No rest: the morning shift starts when the night shift ends',
    )
    await expect(canvasElement).toHaveTextContent('22:00–06:00')
  },
}

export const EmergencyShiftsPhone: Story = {
  name: 'Emergency shifts, rotation applied, phone',
  render: () => <OnPhone start={G_ROUTES.erPlanner} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Jelena Popović')
    await noPageOverflow(canvasElement)
  },
}

/** "Apply rotation…" open: the pattern, the people, the dates and the offset per person. */
export const EmergencyRotation: Story = {
  name: 'Emergency shifts, apply a rotation',
  render: () => <ExampleApp start={G_ROUTES.erRotation} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Apply a rotation' }),
    ).toBeVisible()
  },
}

/**
 * The working-time redistribution of the eight weeks before (P5.24 d): the plan's weeks (48 to
 * 32 hours, a reference average of 40, illustrative), per person planned, worked, the difference
 * and the average; warnings from the application with illustrative limits; a new colleague
 * without figures ("—", never 0).
 */
export const EmergencyBalance: Story = {
  name: 'Emergency working-time balance',
  render: () => <ExampleApp start={G_ROUTES.erBalance} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Average above the illustrative limit of 48 h')
    await expect(canvasElement).toHaveTextContent('Reference average per week (illustrative)')
  },
}

export const EmergencyBalancePhone: Story = {
  name: 'Emergency working-time balance, phone',
  render: () => <OnPhone start={G_ROUTES.erBalance} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Jelena Popović')
    await noPageOverflow(canvasElement)
  },
}

/**
 * Health (P5.17): Jovana Nikolić books a check-up in Dom zdravlja Novi Sad's patient portal
 * (PortalShell) — the service and her chosen doctor, then a free time (SlotPicker), then Book.
 */
export const HealthBooking: Story = {
  name: 'Health, book an appointment',
  render: () => <ExampleApp start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Book an appointment' }),
    ).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /Check-up/ })).toBeChecked()
  },
}

export const HealthBookingPhone: Story = {
  name: 'Health, book an appointment, phone',
  render: () => <OnPhone start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Continue' })).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

/** The free times of dr Marko Stanković next week; nothing chosen, so Book says why it waits. */
export const HealthBookingTime: Story = {
  name: 'Health, book an appointment, choose a time',
  render: () => <ExampleApp start={H_ROUTES.bookTime} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('radiogroup')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Choose a time first.')
  },
}

export const HealthBookingTimePhone: Story = {
  name: 'Health, book an appointment, choose a time, phone',
  render: () => <OnPhone start={H_ROUTES.bookTime} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('radiogroup')).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

/** Wednesday 14.10. at 11:30 chosen: the appointment in words, then Book. */
export const HealthBookingConfirm: Story = {
  name: 'Health, book an appointment, confirm',
  render: () => <ExampleApp start={H_ROUTES.bookConfirm} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('at 11:30')
    await expect(within(canvasElement).getByRole('button', { name: 'Book' })).toBeVisible()
  },
}

export const HealthBookingConfirmPhone: Story = {
  name: 'Health, book an appointment, confirm, phone',
  render: () => <OnPhone start={H_ROUTES.bookConfirm} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('at 11:30')
    await noPageOverflow(canvasElement)
  },
}

/** Booked: the confirmation, the appointment, and a link to the clinic's schedule of that day. */
export const HealthBooked: Story = {
  name: 'Health, appointment booked',
  render: () => <ExampleApp start={H_ROUTES.booked} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Your appointment is booked')
    await expect(canvasElement).toHaveTextContent('Confirmed')
  },
}

export const HealthBookedPhone: Story = {
  name: 'Health, appointment booked, phone',
  render: () => <OnPhone start={H_ROUTES.booked} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Your appointment is booked')
    await noPageOverflow(canvasElement)
  },
}

/** The whole booking from the keyboard and pointer, then on to the clinic's schedule. */
export const HealthBookingWalk: Story = {
  name: 'Health, booking, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await settle()
    // The slot's name: its time range and the day in words.
    const day = SERBIAN_G.dateLong('2026-10-14')
    const radio = (await canvas.findAllByRole('radio')).find((each) => {
      const name = each.getAttribute('aria-label') ?? ''
      return name.startsWith('11:30') && name.includes(day)
    })
    if (radio === undefined) throw new Error('no 11:30 on 14.10.')
    await userEvent.click(radio)
    await expect(canvasElement).toHaveTextContent('at 11:30')
    await userEvent.click(canvas.getByRole('button', { name: 'Book' }))
    await settle()
    await expect(await canvas.findByText('Your appointment is booked')).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: 'schedule of 14.10.2026' }))
    await settle()
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Schedule' })).toBeVisible()
  },
}

/**
 * The clinic's schedule of Wednesday 14.10.2026 (ResourceSchedule): three doctors and the
 * laboratory; the break and dr Vesna Lukić's annual leave hatched with their reasons; Jovana
 * Nikolić's appointment booked online at 11:30. Opening it shows her finding.
 */
export const HealthClinicSchedule: Story = {
  name: 'Health, clinic schedule',
  render: () => <ExampleApp start={H_ROUTES.clinicSchedule} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(PATIENT.name)
    await expect(canvasElement).toHaveTextContent('Annual leave')
  },
}

export const HealthClinicSchedulePhone: Story = {
  name: 'Health, clinic schedule, phone',
  render: () => <OnPhone start={H_ROUTES.clinicSchedule} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(PATIENT.name)
    await noPageOverflow(canvasElement)
  },
}

/** dr Marko Stanković's week (CalendarView), his appointments and the team meeting. */
export const HealthDoctorCalendar: Story = {
  name: 'Health, doctor’s calendar',
  render: () => <ExampleApp start={H_ROUTES.doctorCalendar} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', {
        name: new RegExp(`${PATIENT.name}, Check-up`),
      }),
    ).toBeVisible()
  },
}

export const HealthDoctorCalendarPhone: Story = {
  name: 'Health, doctor’s calendar, phone',
  render: () => <OnPhone start={H_ROUTES.doctorCalendar} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('dr Marko Stanković')
    await noPageOverflow(canvasElement)
  },
}

/**
 * Jovana Nikolić's last finding: the diagnosis and the finding are health data, masked until the
 * user says why (MaskedValue, P5.14); the next appointment is the one she booked.
 */
export const HealthFinding: Story = {
  name: 'Health, finding',
  render: () => <ExampleApp start={H_ROUTES.finding} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Show Diagnosis' })).toBeVisible()
    await expect(canvasElement).not.toHaveTextContent(FINDING.diagnosis)
    await expect(canvasElement).toHaveTextContent(
      SERBIAN_G.dateLong(JOVANA_BOOKING.start.slice(0, 10)),
    )
  },
}

export const HealthFindingPhone: Story = {
  name: 'Health, finding, phone',
  render: () => <OnPhone start={H_ROUTES.finding} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).not.toHaveTextContent(FINDING.diagnosis)
    await noPageOverflow(canvasElement)
  },
}

/** "Show" asks why: the reasons from the application, Other, and the note that it is logged. */
export const HealthFindingReason: Story = {
  name: 'Health, finding, reason asked',
  render: () => <ExampleApp start={H_ROUTES.findingAsk} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Show Diagnosis' }),
    ).toHaveTextContent('Access is logged')
  },
}

export const HealthFindingReasonPhone: Story = {
  name: 'Health, finding, reason asked, phone',
  render: () => <OnPhone start={H_ROUTES.findingAsk} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Show Diagnosis' }),
    ).toBeVisible()
  },
}

/** The diagnosis shown after a reason, with Hide. */
export const HealthFindingShown: Story = {
  name: 'Health, finding, diagnosis shown',
  render: () => <ExampleApp start={H_ROUTES.findingShown} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(FINDING.diagnosis)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Hide Diagnosis' }),
    ).toBeVisible()
  },
}

export const HealthFindingReveal: Story = {
  name: 'Health, finding, reveal, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={H_ROUTES.finding} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show Diagnosis' }))
    const dialog = await within(document.body).findByRole('dialog', { name: 'Show Diagnosis' })
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'I am treating the patient now' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show' }))
    await expect(await canvas.findByText(FINDING.diagnosis)).toBeVisible()
    // The dialog has closed (until then the page behind it is hidden from assistive technology).
    await userEvent.click(await canvas.findByRole('button', { name: 'Hide Diagnosis' }))
    await expect(canvasElement).not.toHaveTextContent(FINDING.diagnosis)
  },
}

/**
 * School (P5.17): class 7/2 of OŠ "Jovan Popović", 2026/27 — the week by periods with their
 * times, Wednesday's written test and Thursday's substitute; lesson 3 running now ("Now"), with
 * a link to mark its attendance.
 */
export const SchoolTimetable: Story = {
  name: 'School, timetable 7/2',
  render: () => <ExampleApp start={H_ROUTES.timetable} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Written test 2')
    await expect(canvasElement).toHaveTextContent('Substitute')
  },
}

export const SchoolTimetablePhone: Story = {
  name: 'School, timetable 7/2, phone',
  render: () => <OnPhone start={H_ROUTES.timetable} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Mathematics')
    await noPageOverflow(canvasElement)
  },
}

/**
 * Today's attendance (P5.13): lessons 1 and 2 marked by their teachers — Luka Jovanović absent,
 * Mila Lazarević late, Teodora Savić excused —; lesson 3 to be marked now, from its first cell,
 * one key per pupil (P present, A absent, L late, E excused), or "Mark everyone" in the column's
 * menu. The counts are the application's.
 */
export const SchoolAttendance: Story = {
  name: 'School, attendance of a lesson',
  render: () => <ExampleApp start={H_ROUTES.attendance} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('grid', { name: /Attendance, class 7\/2/ }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Lessons missed today')
  },
}

export const SchoolAttendancePhone: Story = {
  name: 'School, attendance of a lesson, phone',
  render: () => <OnPhone start={H_ROUTES.attendance} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { name: 'Luka Jovanović' }),
    ).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

export const SchoolAttendanceMarking: Story = {
  name: 'School, attendance, marking, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={H_ROUTES.attendance} />,
  play: async ({ canvasElement }) => {
    await settle()
    const first = canvasElement.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
    if (first === null) throw new Error('no focused cell')
    first.focus()
    // Down the third lesson's column: the first three present, Luka (the fourth) absent.
    await userEvent.keyboard('pppa')
    const luka = canvasElement.querySelector('[data-pos="4:3"]')
    await expect(luka).toHaveTextContent('A')
    await expect(canvasElement.querySelector('[data-pos="5:3"]')).toHaveFocus()
  },
}

/** The mathematics gradebook (P5.13): marks one key each, the application's averages. */
export const SchoolGradebook: Story = {
  name: 'School, gradebook',
  render: () => <ExampleApp start={H_ROUTES.gradebook} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('columnheader', { name: 'Average' })).toBeVisible()
  },
}

export const SchoolGradebookPhone: Story = {
  name: 'School, gradebook, phone',
  render: () => <OnPhone start={H_ROUTES.gradebook} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { name: 'Luka Jovanović' }),
    ).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

/**
 * The parents' portal (PortalShell): Luka Jovanović's absences this term — the counts, today's
 * two lessons not excused yet (as the attendance grid has them), earlier ones excused.
 */
export const SchoolParentPortal: Story = {
  name: 'School, parents’ portal, absences',
  render: () => <ExampleApp start={H_ROUTES.parent} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Today’s absences are not excused yet')
    await expect(canvasElement).toHaveTextContent(String(ABSENCE_COUNTS.total))
  },
}

export const SchoolParentPortalPhone: Story = {
  name: 'School, parents’ portal, absences, phone',
  render: () => <OnPhone start={H_ROUTES.parent} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Today’s absences are not excused yet')
    await noPageOverflow(canvasElement)
  },
}

export const SchoolParentPortalExcuse: Story = {
  name: 'School, parents’ portal, excuse, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={H_ROUTES.parent} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Excuse today’s absences' }))
    await expect(
      await within(document.body).findByText('Sent to the class teacher, Dragana Simić.'),
    ).toBeInTheDocument()
    await expect(canvasElement).not.toHaveTextContent('Today’s absences are not excused yet')
  },
}

// ── P5.17 group I: the till and the handheld ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { PhoneFrame } from '../../../../packages/ui/src/components/story-frames'
import { BAKERY, CARD_APPROVAL, COUNT, I_ROUTES, PICKING, SALE_FIGURES } from './data-I'

const SERBIAN_I = createFormat('sr-Latn-RS')

/**
 * An amount of the till as the bakery sees it ("1.907,00 RSD"), as the text matchers read the
 * page: every space (the no-break one too) as one.
 */
function tillText(value: string): string {
  return SERBIAN_I.money(value, BAKERY.currency).replace(/\s+/g, ' ')
}

/** The cart's main action by its name, "Charge 1.907,00 RSD", whatever space the format writes. */
function chargeName(value: string): RegExp {
  const text = `Charge ${tillText(value)}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${text.replace(/ /g, '\\s')}$`)
}

/** A handheld scanner's screen: 360 × 740. */
function OnHandheld({ start }: { start: string }) {
  return (
    <PhoneFrame width={360} height={740}>
      <ExampleApp start={start} phone />
    </PhoneFrame>
  )
}

/** The payment dialog of the till. */
function paymentDialog() {
  return within(document.body).getByRole('dialog', { name: 'Payment' })
}

/** Nothing on the screen scrolls sideways. */
async function expectNoSidewaysScroll(canvasElement: HTMLElement) {
  for (const element of canvasElement.querySelectorAll<HTMLElement>(
    '[data-slot="pos-shell"], [data-slot="pick-list"], [data-slot="stock-count"]',
  )) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
  }
}

/**
 * The till of Pekara Zlatni klas in Novi Sad (Kasa 1, Snežana Kovačević) on a landscape tablet,
 * in the touch density: the products by category with a scan field above them, the cart of six
 * lines with the loyalty card's 10% on the cakes (1.995,00 − 88,00 = 1.907,00 RSD, VAT included
 * per category), "Charge 1.907,00 RSD" last. No application header: the till is one task.
 */
export const PosCheckout: Story = {
  name: 'POS checkout, Pekara Zlatni klas',
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Register status' })).toHaveTextContent(
      BAKERY.register,
    )
    await expect(canvasElement).toHaveTextContent('6 items')
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Krempita' })).toHaveValue('4')
    await expect(canvasElement).toHaveTextContent(
      `Loyalty discount 10%: ${tillText(`-${SALE_FIGURES.discounts}`)}`,
    )
    await expect(canvas.getByRole('button', { name: chargeName(SALE_FIGURES.total) })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Raženi hleb/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** Paying cash: 2.000,00 RSD tendered (the first banknote offered), the change 93,00 RSD. */
export const PosCash: Story = {
  name: 'POS checkout, paying cash',
  render: () => <ExampleApp start={I_ROUTES.posCash} />,
  play: async () => {
    await settle()
    const dialog = paymentDialog()
    await expect(dialog).toHaveTextContent(tillText(SALE_FIGURES.total))
    await expect(dialog).toHaveTextContent('Change due')
    await expect(dialog).toHaveTextContent(tillText(SALE_FIGURES.change))
    await expect(within(dialog).getByLabelText(/Amount tendered/)).toHaveValue('2.000')
  },
}

/** Paying by card: the terminal waits for the customer; the dialog cannot be dismissed. */
export const PosCardWaiting: Story = {
  name: 'POS checkout, card waiting',
  render: () => <ExampleApp start={I_ROUTES.posCardWaiting} />,
  play: async () => {
    await settle()
    const dialog = paymentDialog()
    await expect(dialog).toHaveTextContent('Waiting for the card terminal…')
    await expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull()
  },
}

/** The terminal approved the card: "Complete payment" can be pressed. */
export const PosCardApproved: Story = {
  name: 'POS checkout, card approved',
  render: () => <ExampleApp start={I_ROUTES.posCardApproved} />,
  play: async () => {
    await settle()
    const dialog = paymentDialog()
    await expect(dialog).toHaveTextContent('Card payment approved')
    await expect(dialog).toHaveTextContent(CARD_APPROVAL)
    await expect(
      within(dialog).getByRole('button', { name: 'Complete payment' }),
    ).not.toHaveAttribute('aria-disabled', 'true')
  },
}

/** The sale paid in cash: receipt ZK-01-002318 with the tax per category, cash and change. */
export const PosReceipt: Story = {
  name: 'POS checkout, receipt',
  render: () => <ExampleApp start={I_ROUTES.posReceipt} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: `Receipt ${BAKERY.receipt}` })
    const receipt = within(dialog).getByRole('article', { name: 'Receipt' })
    await expect(receipt).toHaveTextContent(BAKERY.name)
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.total))
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.vatE))
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.change))
  },
}

/** The connection lost: three sales wait on the till, selling goes on. */
export const PosOffline: Story = {
  name: 'POS checkout, offline',
  render: () => <ExampleApp start={I_ROUTES.posOffline} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('3 sales waiting to be sent')).toBeVisible()
    await expect(
      within(canvasElement).getByRole('button', {
        name: chargeName(SALE_FIGURES.total),
      }),
    ).toBeVisible()
  },
}

/**
 * A barcode read into the scan field adds the orange juice (the till sums: 2.057,00 RSD); a
 * second kifla adds to its line; an unknown code is a problem in words.
 */
export const PosScanInteraction: Story = {
  name: 'POS checkout, scanning, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Barcode or PLU' })
    await userEvent.type(field, '8600417000528{Enter}')
    await expect(await canvas.findByText('Sok od pomorandže added')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Sok od pomorandže' })).toHaveValue(
      '1',
    )
    await expect(canvas.getByRole('button', { name: chargeName('2057') })).toBeVisible()
    await userEvent.type(field, '8600417000207{Enter}')
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('7')
    })
    await expect(canvas.getByRole('button', { name: chargeName('2082') })).toBeVisible()
    await userEvent.type(field, '8600999999999{Enter}')
    await expect(await canvas.findByText('Unknown code 8600999999999')).toBeVisible()
  },
}

/** Charge, the 2.000,00 banknote, Complete payment, then the receipt. */
export const PosPayInteraction: Story = {
  name: 'POS checkout, paying cash, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: chargeName(SALE_FIGURES.total),
      }),
    )
    const dialog = await within(document.body).findByRole('dialog', { name: 'Payment' })
    await userEvent.click(within(dialog).getByRole('button', { name: /^2\.000/ }))
    await expect(dialog).toHaveTextContent(tillText(SALE_FIGURES.change))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Complete payment' }))
    await expect(await within(dialog).findByText('Payment complete')).toBeVisible()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show receipt' }))
    const receipt = await within(document.body).findByRole('dialog', {
      name: `Receipt ${BAKERY.receipt}`,
    })
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.total))
    await settle()
  },
}

/** Phone: the cart first, "Products" above it opening the products as a bottom sheet. */
export const PosPhone: Story = {
  name: 'POS checkout, phone',
  render: () => <OnPhone start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Products' })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: chargeName(SALE_FIGURES.total) }),
    ).toBeInTheDocument()
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** Phone: the products sheet open over the cart. */
export const PosPhoneProducts: Story = {
  name: 'POS checkout, phone, products',
  render: () => <OnPhone start={I_ROUTES.posProducts} />,
  play: async () => {
    await settle()
    const sheet = within(document.body).getByRole('dialog', { name: 'Products' })
    await expect(within(sheet).getByRole('textbox', { name: 'Barcode or PLU' })).toBeVisible()
    await expect(within(sheet).getByRole('button', { name: /^Kifla/ })).toBeVisible()
  },
}

/** Phone: paying cash. */
export const PosPhoneCash: Story = {
  name: 'POS checkout, phone, paying cash',
  render: () => <OnPhone start={I_ROUTES.posCash} />,
  play: async () => {
    await settle()
    await expect(paymentDialog()).toHaveTextContent(tillText(SALE_FIGURES.change))
  },
}

/**
 * Picking order NP-2026-0233 for Kvadrat Gradnja d.o.o. at Magacin Novi Sad on a handheld:
 * "4 of 12" (two picked, one short, one skipped with its reason), line 5 large — location
 * B-03-04, the facade boards, 18 packs — and its steps; scan the location first.
 */
export const PickingHandheld: Story = {
  name: 'Warehouse picking, handheld',
  render: () => <OnHandheld start={I_ROUTES.picking} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('4 of 12')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Location code' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('B-03-04')
    await expect(canvasElement).toHaveTextContent('Skipped: Damaged — the rolls are wet.')
    await expect(canvasElement).toHaveTextContent(PICKING.customer)
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** The location confirmed: scan the item. */
export const PickingHandheldItem: Story = {
  name: 'Warehouse picking, handheld, item',
  render: () => <OnHandheld start={I_ROUTES.pickingItem} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Item code' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Location B-03-04')
  },
}

/** Both scanned: confirm the quantity, 18 packs by default. */
export const PickingHandheldQuantity: Story = {
  name: 'Warehouse picking, handheld, quantity',
  render: () => <OnHandheld start={I_ROUTES.pickingQuantity} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Quantity picked' })).toHaveValue('18')
    await expect(canvas.getByRole('button', { name: 'Confirm quantity' })).toBeVisible()
  },
}

/** Skipping line 5: the reason asked from the warehouse's list. */
export const PickingHandheldSkip: Story = {
  name: 'Warehouse picking, handheld, skipping a line',
  render: () => <OnHandheld start={I_ROUTES.pickingSkip} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('alertdialog', { name: /^Skip Fasadni stiropor/ }),
    ).toBeVisible()
  },
}

/** Offline: three changes wait on the handheld; picking goes on. */
export const PickingHandheldOffline: Story = {
  name: 'Warehouse picking, handheld, offline',
  render: () => <OnHandheld start={I_ROUTES.pickingOffline} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('3 changes waiting to be sent')).toBeVisible()
  },
}

/** Scan B-03-04, scan the boards, confirm 18: "5 of 12", and line 6 opens at B-05-02. */
export const PickingHandheldInteraction: Story = {
  name: 'Warehouse picking, handheld, interaction',
  tags: ['interaction'],
  render: () => <OnHandheld start={I_ROUTES.picking} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Location code' }), 'B-03-05{Enter}')
    await expect(await canvas.findByText('Wrong location: B-03-05. Go to B-03-04.')).toBeVisible()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Location code' }), 'B-03-04{Enter}')
    const item = await canvas.findByRole('textbox', { name: 'Item code' })
    await userEvent.type(item, '8600981000149{Enter}')
    await userEvent.click(await canvas.findByRole('button', { name: 'Confirm quantity' }))
    await expect(await canvas.findByText('5 of 12')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('B-05-02')
    await expect(canvas.getByRole('textbox', { name: 'Location code' })).toBeVisible()
  },
}

/** The same list on a tablet on a cart (640px). */
export const PickingTablet: Story = {
  name: 'Warehouse picking, tablet',
  render: () => <ExampleApp start={I_ROUTES.pickingItem} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('4 of 12')).toBeVisible()
    await expectNoSidewaysScroll(canvasElement)
  },
}

/**
 * Counting A-02-03, where the pick came up short: the mesh Q188 just scanned in front — counted
 * 14, the books 12, difference +2 — and the other items counted here: Q131 counted 0 of 3
 * (difference −3, danger), the binding wire 0.
 */
export const StockCountHandheld: Story = {
  name: 'Stock count, handheld',
  render: () => <OnHandheld start={I_ROUTES.count} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(COUNT.location)
    await expect(canvasElement).toHaveTextContent(SERBIAN_I.number('-3', { sign: 'always' }))
    await expect(canvasElement).toHaveTextContent(SERBIAN_I.number('2', { sign: 'always' }))
    await expect(
      within(canvasElement).getByRole('button', { name: 'Finish location' }),
    ).toBeVisible()
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** One Q188 sheet less (it was a Q131): the count goes to 13 and the application's difference to +1. */
export const StockCountHandheldInteraction: Story = {
  name: 'Stock count, handheld, interaction',
  tags: ['interaction'],
  render: () => <OnHandheld start={I_ROUTES.count} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease Counted quantity' }))
    await expect(canvas.getByRole('textbox', { name: 'Counted quantity' })).toHaveValue('13')
    await waitFor(async () => {
      await expect(canvasElement).toHaveTextContent(SERBIAN_I.number('1', { sign: 'always' }))
    })
  },
}

// ── P5.25 group L: Hotel ──

import { L_ROUTES } from './data-L'

/**
 * The rooms' tiles of the rack: their names start with the room number (hidden from assistive
 * technology too while a drawer is open over the rack).
 */
function roomTile(canvasElement: HTMLElement, number: string): HTMLElement {
  return within(canvasElement).getByRole('button', {
    name: new RegExp(`^${number}, `),
    hidden: true,
  })
}

/**
 * Hotel Fruška's front desk on Tuesday 6 October 2026: 6 arrivals, 5 departures, the room rack of
 * four floors with today's occupancy and housekeeping, worked out from the stays.
 */
export const HotelRack: Story = {
  name: 'Hotel, room rack',
  render: () => <ExampleApp start={L_ROUTES.rack} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Room rack' })).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: /^\d{3}, / })).toHaveLength(40)
    const occupancy = canvas.getByRole('group', { name: 'Occupancy' })
    await expect(
      within(occupancy).getByRole('button', { name: /^Arriving today/ }),
    ).toHaveTextContent('Arriving today6')
    await expect(
      within(occupancy).getByRole('button', { name: /^Departing today/ }),
    ).toHaveTextContent('Departing today5')
    await expect(roomTile(canvasElement, '204')).toHaveAccessibleName(
      /^204, TWN, Departing today, Dirty, Paolo Bianchi, 04\.10\.2026\. – 06\.10\.2026\.$/,
    )
    await expect(roomTile(canvasElement, '108')).toHaveAccessibleName(/Out of order.*Bathroom/)
  },
}

export const HotelRackPhone: Story = {
  name: 'Hotel, room rack, phone',
  render: () => <OnPhone start={L_ROUTES.rack} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(roomTile(canvasElement, '101')).toBeVisible()
    const rack = canvasElement.querySelector<HTMLElement>('[data-slot="room-rack"]')
    if (rack === null) throw new Error('no rack')
    await expect(rack.scrollWidth).toBeLessThanOrEqual(rack.clientWidth)
  },
}

/** Room 204 in its drawer: Paolo Bianchi departs today, the folio's balance, Check out. */
export const HotelDeparture: Story = {
  name: 'Hotel, departing guest',
  render: () => <ExampleApp start={L_ROUTES.rackRoom} />,
  play: async ({ canvasElement }) => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 204' })
    await settle()
    await expect(drawer).toHaveTextContent('Paolo Bianchi')
    await expect(drawer).toHaveTextContent('21.250,00')
    await expect(within(drawer).getByRole('button', { name: 'Check out' })).toBeVisible()
    await expect(within(drawer).queryByRole('button', { name: 'Mark clean' })).toBeNull()
    await expect(roomTile(canvasElement, '204')).toHaveAttribute('aria-current', 'true')
  },
}

export const HotelDeparturePhone: Story = {
  name: 'Hotel, departing guest, phone',
  render: () => <OnPhone start={L_ROUTES.rackRoom} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 204' })
    await settle()
    await expect(within(drawer).getByRole('button', { name: 'Check out' })).toBeVisible()
  },
}

/** Room 104: a VIP arriving today, the room inspected and the stay prepaid; Check in. */
export const HotelArrival: Story = {
  name: 'Hotel, VIP arrival',
  render: () => <ExampleApp start={L_ROUTES.rackArrival} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 104' })
    await settle()
    await expect(drawer).toHaveTextContent('Jelena Stojanović')
    await expect(drawer).toHaveTextContent('VIP')
    await expect(within(drawer).getByRole('button', { name: 'Check in' })).toBeEnabled()
  },
}

export const HotelArrivalPhone: Story = {
  name: 'Hotel, VIP arrival, phone',
  render: () => <OnPhone start={L_ROUTES.rackArrival} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 104' })
    await settle()
    await expect(within(drawer).getByRole('button', { name: 'Check in' })).toBeVisible()
  },
}

/** Checking out: the room turns vacant and dirty, the counts follow. */
export const HotelCheckOutInteraction: Story = {
  name: 'Hotel, check out, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={L_ROUTES.rackRoom} />,
  play: async ({ canvasElement }) => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 204' })
    await settle()
    await userEvent.click(within(drawer).getByRole('button', { name: 'Check out' }))
    await waitFor(async () => {
      await expect(
        within(document.body).getByText('Paolo Bianchi checked out of room 204.'),
      ).toBeVisible()
    })
    await expect(roomTile(canvasElement, '204')).toHaveAccessibleName(/^204, TWN, Vacant, Dirty$/)
    // The drawer stays open over the rack, which is hidden from assistive technology meanwhile.
    const occupancy = within(canvasElement).getByRole('group', { name: 'Occupancy', hidden: true })
    await expect(
      within(occupancy).getByRole('button', { name: /^Departing today/, hidden: true }),
    ).toHaveTextContent('Departing today4')
    notice.dismiss()
  },
}

/** The coming two weeks on ResourceSchedule by days: floor 1's rooms, stays as bookings. */
export const HotelBookings: Story = {
  name: 'Hotel, bookings',
  render: () => <ExampleApp start={L_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Bookings' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Claire Martin, Room 101, / })).toBeVisible()
    await expect(canvas.getByText(/^Unavailable: Bathroom renovation/)).toBeInTheDocument()
  },
}

export const HotelBookingsPhone: Story = {
  name: 'Hotel, bookings, phone',
  render: () => <OnPhone start={L_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Room' })).toHaveTextContent('Room 101')
    const schedule = canvasElement.querySelector<HTMLElement>('[data-slot="resource-schedule"]')
    if (schedule === null) throw new Error('no schedule')
    await expect(schedule.scrollWidth).toBeLessThanOrEqual(schedule.clientWidth)
  },
}

/** Housekeeping on floor 3: the rooms to clean (the Dirty chip pressed). */
export const HotelHousekeeping: Story = {
  name: 'Hotel, housekeeping',
  render: () => <ExampleApp start={L_ROUTES.housekeeping} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Dirty/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getAllByRole('button', { name: /^3\d\d, / })).toHaveLength(5)
  },
}

export const HotelHousekeepingPhone: Story = {
  name: 'Hotel, housekeeping, phone',
  render: () => <OnPhone start={L_ROUTES.housekeeping} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('5 of 10 shown')).toBeVisible()
  },
}

/** Room 306 open on the phone: Start cleaning, then Mark clean (the main action, last). */
export const HotelMarkCleanPhone: Story = {
  name: 'Hotel, housekeeping, room, phone',
  render: () => <OnPhone start={L_ROUTES.housekeepingRoom} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 306' })
    await settle()
    const buttons = within(drawer).getAllByRole('button', { name: /Start cleaning|Mark clean/ })
    await expect(buttons.at(-1)).toHaveAccessibleName('Mark clean')
  },
}

export const HotelMarkClean: Story = {
  name: 'Hotel, housekeeping, room',
  render: () => <ExampleApp start={L_ROUTES.housekeepingRoom} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 306' })
    await settle()
    await expect(within(drawer).getByRole('button', { name: 'Mark clean' })).toBeVisible()
  },
}

/** Mark clean: the room leaves the list of rooms to clean. */
export const HotelMarkCleanInteraction: Story = {
  name: 'Hotel, mark clean, interaction',
  tags: ['interaction'],
  render: () => <OnPhone start={L_ROUTES.housekeepingRoom} />,
  play: async ({ canvasElement }) => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 306' })
    await settle()
    await userEvent.click(within(drawer).getByRole('button', { name: 'Mark clean' }))
    await waitFor(async () => {
      await expect(
        within(document.body).getByText('Room 306 is clean. The front desk sees it.'),
      ).toBeVisible()
    })
    await waitFor(async () => {
      await expect(within(canvasElement).getByText('4 of 10 shown')).toBeVisible()
    })
    notice.dismiss()
  },
}

// ── P5.25 group K: floor plans and seating ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { GALA_GUESTS, K_ROUTES, TABLE_3_FIGURES } from './data-K'

const SERBIAN_K = createFormat('sr-Latn-RS')

/** A table on a floor plan by its id. */
function floorItem(canvasElement: HTMLElement, id: string): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(`[data-floor-item="${id}"]`)
  if (element === null) throw new Error(`no item ${id}`)
  return element
}

/** Nothing on the screen scrolls sideways (the plan scrolls inside its own box). */
async function expectNoPageScroll(canvasElement: HTMLElement) {
  for (const element of canvasElement.querySelectorAll<HTMLElement>(
    '[data-slot="floor-plan"], [data-slot="seating-chart"], [data-slot="pos-shell"]',
  )) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
  }
}

/**
 * Bistro Dunav at 19:40 on a Tuesday: the hall, the terrace and the bar, each table in the
 * restaurant's state — free, occupied (how many, since when), reserved (for when, how many),
 * one waiting to be cleaned. Table 7 is chosen: its party and "Move to table…".
 */
export const RestaurantService: Story = {
  name: 'Restaurant service, Bistro Dunav',
  render: () => <ExampleApp start={K_ROUTES.floorTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(floorItem(canvasElement, 't7')).toHaveAttribute('aria-pressed', 'true')
    await expect(floorItem(canvasElement, 't3')).toHaveAccessibleName(
      'Table 3, 20:00 · 4 guests, Reserved, 4 seats, Sala',
    )
    await expect(canvas.getByRole('heading', { name: /^Table 7/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Move to table…' })).toBeVisible()
    await expectNoPageScroll(canvasElement)
  },
}

/** On a phone: the chosen table first, then the floor as a list by area. */
export const RestaurantServicePhone: Story = {
  name: 'Restaurant service, Bistro Dunav, phone',
  render: () => <OnPhone start={K_ROUTES.floorTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: 'Terasa' })).toBeInTheDocument()
    await expectNoPageScroll(canvasElement)
  },
}

/** Opening free table 4 for a walk-in party: how many guests. */
export const RestaurantOpenTable: Story = {
  name: 'Restaurant service, opening a table',
  render: () => <ExampleApp start={K_ROUTES.floorOpen} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Open Table 4' })
    await expect(within(dialog).getByRole('textbox', { name: 'Guests' })).toHaveValue('2')
  },
}

export const RestaurantOpenTablePhone: Story = {
  name: 'Restaurant service, opening a table, phone',
  render: () => <OnPhone start={K_ROUTES.floorOpen} />,
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('dialog', { name: 'Open Table 4' })).toBeVisible()
  },
}

/** Moving table 5's party of three: the free tables with seats enough. */
export const RestaurantMoveGuests: Story = {
  name: 'Restaurant service, moving guests',
  render: () => <ExampleApp start={K_ROUTES.floorMove} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move guests from Table 5',
    })
    await expect(within(dialog).getByRole('combobox', { name: 'To table' })).toHaveTextContent(
      'Table 4 · Sala · 4 seats',
    )
  },
}

export const RestaurantMoveGuestsPhone: Story = {
  name: 'Restaurant service, moving guests, phone',
  render: () => <OnPhone start={K_ROUTES.floorMove} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Move guests from Table 5' }),
    ).toBeVisible()
  },
}

/**
 * The service by the keys and presses: Enter opens table 2, which is free — "Open table" for
 * two; then table 5's party moves to table 10 and table 5 waits for cleaning.
 */
export const RestaurantServiceInteraction: Story = {
  name: 'Restaurant service, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={K_ROUTES.floor} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(floorItem(canvasElement, 't2'))
    await userEvent.click(canvas.getByRole('button', { name: 'Open table' }))
    let dialog = await body.findByRole('dialog', { name: 'Open Table 2' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Open table' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't2')).toHaveAccessibleName(
        'Table 2, 2 guests · 19:40, Occupied, 2 seats, Sala',
      )
    })
    floorItem(canvasElement, 't2').focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(floorItem(canvasElement, 't6')).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(floorItem(canvasElement, 't5')).toHaveFocus()
    // The closed dialog leaves the page hidden from assistive technology until it has gone.
    await userEvent.click(await canvas.findByRole('button', { name: 'Move to table…' }))
    dialog = await body.findByRole('dialog', { name: 'Move guests from Table 5' })
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'To table' }))
    await userEvent.click(await body.findByRole('option', { name: /^Table 10/ }))
    // The select's list closes first; then the dialog is in use again.
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Move' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't5')).toHaveAccessibleName(/Needs cleaning/)
    })
    await expect(floorItem(canvasElement, 't10')).toHaveAccessibleName(
      /^Table 10, 3 guests · 19:20, Occupied/,
    )
  },
}

/**
 * The floor plan in edit mode: terrace tables 11 and 12 chosen, "Merge Table 11 and Table 12"
 * beside "Save floor plan"; the palette, the grid, the chosen items' frames.
 */
export const RestaurantFloorPlanEdit: Story = {
  name: 'Restaurant floor plan, editing',
  render: () => <ExampleApp start={K_ROUTES.floorEdit} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Merge Table 11 and Table 12' })).toBeVisible()
    await expect(floorItem(canvasElement, 't11')).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('group', { name: 'Add' })).toBeVisible()
    await expectNoPageScroll(canvasElement)
  },
}

export const RestaurantFloorPlanEditPhone: Story = {
  name: 'Restaurant floor plan, editing, phone',
  render: () => <OnPhone start={K_ROUTES.floorEdit} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoPageScroll(canvasElement)
  },
}

/** Tables 11 and 12 merged into one table of eight for the evening. */
export const RestaurantTablesMerged: Story = {
  name: 'Restaurant floor plan, tables merged',
  render: () => <ExampleApp start={K_ROUTES.floorMerged} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(floorItem(canvasElement, 't11+t12')).toHaveAccessibleName(
      /^Table 11 \+ 12, Free, 8 seats, Terasa/,
    )
  },
}

export const RestaurantTablesMergedPhone: Story = {
  name: 'Restaurant floor plan, tables merged, phone',
  render: () => <OnPhone start={K_ROUTES.floorMerged} />,
}

/** Merging by pressing, then moving the merged table with the keys (Space, arrows, Space). */
export const RestaurantMergeInteraction: Story = {
  name: 'Restaurant floor plan, merging, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={K_ROUTES.floorEdit} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Merge Table 11 and Table 12' }))
    const merged = floorItem(canvasElement, 't11+t12')
    await expect(merged).toHaveAccessibleName(/8 seats/)
    merged.focus()
    await userEvent.keyboard(' {Shift>}{ArrowDown}{ArrowDown}{/Shift} ')
    await expect(
      canvasElement.querySelector('[data-slot="floor-plan-announcer"]'),
    ).toHaveTextContent('Dropped Table 11 + 12 at 820, 70.')
  },
}

/**
 * Kafić Kod Mike's terrace on the bar's tablet (touch density): eight tables, the open ones with
 * the time and their total; a table opens its order on the till.
 */
export const CafeTerrace: Story = {
  name: 'Café terrace, Kafić Kod Mike',
  render: () => <ExampleApp start={K_ROUTES.terrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(floorItem(canvasElement, 't3')).toHaveAccessibleName(
      `Table 3, 18:15 · ${SERBIAN_K.money(TABLE_3_FIGURES.total, 'RSD')}, Order open, 4 seats`,
    )
    await expectNoPageScroll(canvasElement)
  },
}

export const CafeTerracePhone: Story = {
  name: 'Café terrace, Kafić Kod Mike, phone',
  render: () => <OnPhone start={K_ROUTES.terrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoPageScroll(canvasElement)
  },
}

/** Table 3's order on the till: four lines, 1.200,00 RSD, "Bill" last. */
export const CafeTableTill: Story = {
  name: 'Café terrace, table 3 on the till',
  render: () => <ExampleApp start={K_ROUTES.terraceTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Table 3' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('4 items')
    await expect(
      canvas.getByRole('button', {
        name: new RegExp(
          `^Bill ${SERBIAN_K.money(TABLE_3_FIGURES.total, 'RSD').replace(/\./g, '\\.').replace(/\s/g, '\\s')}$`,
        ),
      }),
    ).toBeVisible()
  },
}

export const CafeTableTillPhone: Story = {
  name: 'Café terrace, table 3 on the till, phone',
  render: () => <OnPhone start={K_ROUTES.terraceTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoPageScroll(canvasElement)
  },
}

/** A press on table 3 opens its order; a kapućino more; back to the terrace. */
export const CafeInteraction: Story = {
  name: 'Café terrace, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={K_ROUTES.terrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(floorItem(canvasElement, 't3'))
    await expect(await canvas.findByRole('heading', { name: 'Table 3' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Kapućino/ }))
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Kapućino' })).toHaveValue('3')
    await userEvent.click(canvas.getByRole('button', { name: 'Terrace' }))
    await expect(await canvas.findByRole('heading', { name: 'Terrace' })).toBeVisible()
  },
}

/**
 * Konferencija Liro 2026's gala dinner: 14 tables of ten round the stage, 112 of 140 guests
 * seated, the 28 not yet seated first in the list; two conflicts from the organiser.
 */
export const GalaSeatingScreen: Story = {
  name: 'Event seating, gala dinner',
  render: () => <ExampleApp start={K_ROUTES.seating} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('112 of 140 seated')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'Warnings' })).toBeVisible()
    await expect(canvasElement.querySelectorAll('[data-floor-item*="#"]')).toHaveLength(140)
    await expectNoPageScroll(canvasElement)
  },
}

export const GalaSeatingPhone: Story = {
  name: 'Event seating, gala dinner, phone',
  render: () => <OnPhone start={K_ROUTES.seating} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('112 of 140 seated')).toBeVisible()
    await expectNoPageScroll(canvasElement)
  },
}

/** A free seat chosen (table 4, seat 9): the guests to seat there, those not seated first. */
export const GalaSeatChosen: Story = {
  name: 'Event seating, a seat chosen',
  render: () => <ExampleApp start={K_ROUTES.seatingSeat} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Table 4, seat 9' }),
    ).toBeVisible()
  },
}

export const GalaSeatChosenPhone: Story = {
  name: 'Event seating, a seat chosen, phone',
  render: () => <OnPhone start={K_ROUTES.seatingSeat} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Table 4, seat 9' }),
    ).toBeVisible()
  },
}

/** "Seat at…" from a guest's menu: a table with its free seats, then a seat. */
export const GalaSeatAt: Story = {
  name: 'Event seating, Seat at…',
  render: () => <ExampleApp start={K_ROUTES.seatingSeatAt} />,
  play: async () => {
    await settle()
    const guest = GALA_GUESTS.find((each) => each.id === 'g113')
    await expect(
      within(document.body).getByRole('dialog', { name: `Seat ${guest?.name ?? ''}` }),
    ).toBeVisible()
  },
}

export const GalaSeatAtPhone: Story = {
  name: 'Event seating, Seat at…, phone',
  render: () => <OnPhone start={K_ROUTES.seatingSeatAt} />,
}

/** Table 6's guests in seat order, with the organiser's conflict. */
export const GalaTableGuests: Story = {
  name: 'Event seating, a table’s guests',
  render: () => <ExampleApp start={K_ROUTES.seatingTable} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Table 6' })
    await expect(dialog).toHaveTextContent('Keep apart')
  },
}

export const GalaTableGuestsPhone: Story = {
  name: 'Event seating, a table’s guests, phone',
  render: () => <OnPhone start={K_ROUTES.seatingTable} />,
}

/** The keyboard's way: Enter on table 4's seat 9, then the first guest not seated: 113 of 140. */
export const GalaSeatingInteraction: Story = {
  name: 'Event seating, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={K_ROUTES.seating} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    floorItem(canvasElement, 't4#9').focus()
    await userEvent.keyboard('{Enter}')
    const dialog = await within(document.body).findByRole('dialog', { name: 'Table 4, seat 9' })
    const first = within(dialog).getAllByRole('button', { name: /Not seated/ })[0]
    if (first === undefined) throw new Error('no guest to seat')
    await userEvent.click(first)
    await waitFor(async () => {
      await expect(canvas.getByText('113 of 140 seated')).toBeVisible()
    })
  },
}

// ── P5.26 group M: Diagrams ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { diagramReady, quiet } from '../../../../packages/ui/src/diagram/diagram-story-data'
import { M_ROUTES } from './data-M'

/** Whether the story's page runs right to left (the forward arrow is ArrowLeft there). */
function pageRtl(canvasElement: HTMLElement): boolean {
  const diagram = canvasElement.querySelector('[data-slot="diagram"]') ?? canvasElement
  return getComputedStyle(diagram).direction === 'rtl'
}

/**
 * "Odobravanje ulazne fakture", Kvadrat Gradnja's approval of an incoming invoice, version 3 as
 * it runs: received from SEF, checked against the order and delivery, then by the amount the
 * site manager (up to 500.000,00 RSD) or the director approves, posted, paid; a mismatch is
 * rejected in SEF with the reason. Lanes say who does each step; the overview in the corner.
 */
export const IncomingInvoiceApproval: Story = {
  name: 'Incoming invoice approval, workflow',
  render: () => <ExampleApp start={M_ROUTES.approval} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Odobravanje ulazne fakture',
    )
    await expect(canvas.getByText('Above 500.000,00 RSD')).toBeVisible()
    await expect(
      canvas.getByRole('group', { name: 'User task: Director approves. Lane: Management' }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Edit a draft' })).toBeVisible()
  },
}

/** Phone: the workflow fits the width; zoom or read it as a list. */
export const IncomingInvoiceApprovalPhone: Story = {
  name: 'Incoming invoice approval, workflow, phone',
  render: () => <OnPhone start={M_ROUTES.approval} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Show steps as a list' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Edit a draft' })).toBeNull()
  },
}

/**
 * The draft of version 4, being edited: a legal review for invoices under no contract, added
 * after the director's approval. The application's check finds two problems — the review has
 * no way out, and the new decision has no default way out — so Publish waits.
 */
export const IncomingInvoiceApprovalDraft: Story = {
  name: 'Incoming invoice approval, draft with two problems',
  render: () => <ExampleApp start={M_ROUTES.approvalEdit} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const problems = canvas.getByRole('region', { name: '2 problems' })
    await expect(problems).toHaveTextContent('Legal reviews the terms: Has no way out')
    await expect(problems).toHaveTextContent(
      'Under a contract?: A decision needs a default way out',
    )
    await expect(canvas.getByRole('button', { name: 'Publish' })).toBeDisabled()
  },
}

/** Solving both: Go to the review, connect it on; mark the decision's "Yes" as its default. */
export const IncomingInvoiceApprovalDraftFixed: Story = {
  name: 'Incoming invoice approval, draft fixed, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={M_ROUTES.approvalEdit} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Go to Legal reviews the terms' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Connect to…' }))
    const connect = await body.findByRole('dialog', {
      name: 'Connect “Legal reviews the terms” to',
    })
    await quiet()
    await userEvent.click(within(connect).getByRole('radio', { name: /Post to the ledger/ }))
    await userEvent.click(within(connect).getByRole('button', { name: 'Connect' }))
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await expect(canvas.getByRole('region', { name: '1 problem' })).toBeVisible()
    // The decision's first way out, from the keyboard; Enter chooses it.
    canvas.getByRole('group', { name: /^Decision: Under a contract\?/ }).focus()
    await userEvent.keyboard(pageRtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await userEvent.keyboard('{Enter}')
    await userEvent.click(canvas.getByRole('button', { name: 'Label…' }))
    const label = await body.findByRole('dialog', { name: 'Label the connection' })
    await quiet()
    await userEvent.click(within(label).getByRole('checkbox', { name: /Default way out/ }))
    await userEvent.click(within(label).getByRole('button', { name: 'Save' }))
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await expect(canvas.queryByRole('region', { name: /problem/ })).toBeNull()
    await expect(
      canvas.getByText('The draft checks out. Publish it when you are ready.'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Publish' })).toBeEnabled()
    await diagramReady(canvasElement)
  },
}

/**
 * The orchestrator's nightly bank-statement import of 6 October 2026, stopped at 02:01: the
 * statements were fetched, Raiffeisen's imported, Banca Intesa's failed on a timeout. Skip this
 * bank or Retry; matching and the morning report wait.
 */
export const BankImportRun: Story = {
  name: 'Nightly bank-statement import, failed run',
  render: () => <ExampleApp start={M_ROUTES.importRun} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByText('4 of 10 steps done')).toBeVisible()
    await expect(canvas.getByText('Started 02:00, stopped 02:01')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Retry: Import Banca Intesa 160-0000000412-77' }),
    ).toBeVisible()
  },
}

export const BankImportRunPhone: Story = {
  name: 'Nightly bank-statement import, failed run, phone',
  render: () => <OnPhone start={M_ROUTES.importRun} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(
      within(canvasElement).getByRole('button', {
        name: 'Retry: Import Banca Intesa 160-0000000412-77',
      }),
    ).toBeVisible()
  },
}

/** Retry: the step runs again, the run is in progress again. */
export const BankImportRunRetry: Story = {
  name: 'Nightly bank-statement import, retry, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={M_ROUTES.importRun} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Retry: Import Banca Intesa 160-0000000412-77' }),
    )
    await expect(
      canvas.getByRole('group', {
        name: 'Automatic task: Import Banca Intesa 160-0000000412-77. Running',
      }),
    ).toBeInTheDocument()
    await expect(canvas.getByText('In progress')).toBeVisible()
    await diagramReady(canvasElement)
  },
}

// ── P5.27 group P: legal search and the gazette ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { P_ROUTES } from './data-P'

/**
 * The legal search: "site records" in building works, in force today (06.10.2026.) — five
 * illustrative acts and decisions, four on the first page, the best first; each match marked,
 * with the article it is in. The area and the date in force are pills; the type, status and
 * issuer stand in the row.
 */
export const LegalSearch: Story = {
  name: 'Legal search',
  render: () => <ExampleApp start={P_ROUTES.search} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('5 results')).toBeVisible()
    await expect(canvas.getByText('Area: Building works')).toBeVisible()
    await expect(canvas.getByText('In force between: 06.10.2026. – 06.10.2026.')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'Law on Illustrative Building Works' }),
    ).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Found in Article 57' })).toHaveAttribute(
      'href',
      '#/legal/acts/building-works/article-57',
    )
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeEnabled()
  },
}

export const LegalSearchPhone: Story = {
  name: 'Legal search, phone',
  render: () => <OnPhone start={P_ROUTES.search} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('5 results')).toBeVisible()
  },
}

/** Searching other words, sorting, the next page and clearing the filters: the application answers. */
export const LegalSearchInteraction: Story = {
  name: 'Legal search, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={P_ROUTES.search} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    const results = canvas.getByRole('list', { name: 'Search results' })
    await expect(within(results).getAllByRole('listitem')).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Sort: Relevance' }))
    await userEvent.click(await body.findByRole('menuitemradio', { name: 'Title' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Sort: Title' })).toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }))
    await expect(canvas.getByText('7 results')).toBeVisible()
    const search = canvas.getByRole('textbox', { name: 'Search acts…' })
    await userEvent.clear(search)
    await userEvent.type(search, 'building permit')
    await waitFor(() => expect(canvas.getByText('1 result')).toBeVisible())
    await expect(
      canvas.getByRole('link', { name: 'Decree on Illustrative Construction Fees' }),
    ).toBeVisible()
  },
}

/** "New in the Illustrative Gazette": three issues, newest first, with "Show more issues". */
export const GazetteNews: Story = {
  name: 'New in the Illustrative Gazette',
  render: () => <ExampleApp start={P_ROUTES.gazette} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelectorAll('[data-slot="gazette-issue"]')).toHaveLength(3)
    await expect(canvas.getByRole('button', { name: 'Show more issues' })).toBeVisible()
  },
}

export const GazetteNewsPhone: Story = {
  name: 'New in the Illustrative Gazette, phone',
  render: () => <OnPhone start={P_ROUTES.gazette} />,
}

/** "Show more issues" loads the two older issues. */
export const GazetteNewsInteraction: Story = {
  name: 'New in the Illustrative Gazette, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={P_ROUTES.gazette} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show more issues' }))
    await expect(canvasElement.querySelectorAll('[data-slot="gazette-issue"]')).toHaveLength(5)
    await expect(canvas.queryByRole('button', { name: 'Show more issues' })).toBeNull()
  },
}

// ── P5.27 group O: legal information, the act page ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { O_ROUTES } from './data-O'

/**
 * The Law on Illustrative Building Works (invented, labelled "Illustrative"), the version in
 * force: its four gazette numbers, the panels — versions, history of changes, its by-law,
 * references, two court decisions and an opinion, Milica's notes.
 */
export const IllustrativeLaw: Story = {
  name: 'Illustrative law, act page',
  render: () => <ExampleApp start={O_ROUTES.law} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Law on Illustrative Building Works' }),
    ).toBeVisible()
    await expect(canvas.getByText(/^Illustrative: the act, the gazette/)).toBeVisible()
    await expect(canvas.getByText('Version as of 06.10.2026.')).toBeVisible()
    await expect(canvas.getAllByText('In force').length).toBeGreaterThan(0)
    await expect(canvas.getByRole('link', { name: 'Illustrative Supreme Court' })).toBeVisible()
  },
}

export const IllustrativeLawPhone: Story = {
  name: 'Illustrative law, act page, phone',
  render: () => <OnPhone start={O_ROUTES.law} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Details' })).toBeVisible()
  },
}

/** Article 57 chosen: the panels narrowed to it — changed twice, two decisions, one opinion. */
export const IllustrativeLawArticle: Story = {
  name: 'Illustrative law, Article 57 selected',
  render: () => <ExampleApp start={O_ROUTES.lawArticle} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('Article 57: changed twice, 2 court decisions, 1 opinion'),
    ).toBeVisible()
    // Only what concerns Article 57: the act Article 90 refers to is not listed.
    await expect(canvas.queryByText('Law on Illustrative Safety at Work')).toBeNull()
  },
}

/** On a phone the article's panels open as a sheet. */
export const IllustrativeLawArticlePhone: Story = {
  name: 'Illustrative law, Article 57 selected, phone',
  render: () => <OnPhone start={O_ROUTES.lawArticle} />,
  play: async () => {
    await settle()
    const sheet = within(document.body).getByRole('dialog', { name: 'Details' })
    await expect(
      within(sheet).getByText('Article 57: changed twice, 2 court decisions, 1 opinion'),
    ).toBeVisible()
  },
}

/** The law as it stood from 30.06.2018.: Article 20 not yet deleted, no Article 90. */
export const IllustrativeLawVersion: Story = {
  name: 'Illustrative law, version of 2018',
  render: () => <ExampleApp start={O_ROUTES.lawVersion} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Version as of 30.06.2018.')).toBeVisible()
    await expect(canvas.getAllByText('No longer in force').length).toBeGreaterThan(0)
    await expect(canvas.queryByRole('heading', { name: /^Article 90/ })).toBeNull()
  },
}

export const IllustrativeLawVersionPhone: Story = {
  name: 'Illustrative law, version of 2018, phone',
  render: () => <OnPhone start={O_ROUTES.lawVersion} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Version as of 30.06.2018.')).toBeVisible()
  },
}

/** The printout: A4, the title and gazette on every page, every article. */
export const IllustrativeLawPrint: Story = {
  name: 'Illustrative law, printout',
  render: () => <ExampleApp start={O_ROUTES.lawPrint} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^Article 90/ })).toBeVisible()
    await expect(canvas.getByText('Deleted (No. 33/2021)')).toBeVisible()
  },
}

export const IllustrativeLawPrintPhone: Story = {
  name: 'Illustrative law, printout, phone',
  render: () => <OnPhone start={O_ROUTES.lawPrint} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** Kvadrat Gradnja d.o.o.'s Work Rulebook, 2025 version, based on the illustrative law. */
export const WorkRulebook: Story = {
  name: 'Kvadrat Gradnja work rulebook',
  render: () => <ExampleApp start={O_ROUTES.rulebook} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('Based on Articles 12 and 57 of the Law on Illustrative Building Works'),
    ).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Version' })).toHaveTextContent(
      'From 01.03.2025. (current)',
    )
  },
}

export const WorkRulebookPhone: Story = {
  name: 'Kvadrat Gradnja work rulebook, phone',
  render: () => <OnPhone start={O_ROUTES.rulebook} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', {
        level: 1,
        name: 'Kvadrat Gradnja d.o.o. — Work Rulebook',
      }),
    ).toBeVisible()
  },
}

/**
 * Choosing Article 12 in the text narrows the panels; back to the whole act; the 2021 version
 * from the Versions panel; watching the law.
 */
export const IllustrativeLawInteraction: Story = {
  name: 'Illustrative law, an article and a version, interaction',
  tags: ['interaction'],
  render: () => <ExampleApp start={O_ROUTES.law} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Details of Article 12' }))
    await expect(
      canvas.getByText('Article 12: changed once, 1 court decision, 0 opinions'),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the whole act' }))
    const versions = canvas.getByRole('list', { name: 'Versions' })
    await userEvent.click(within(versions).getByRole('button', { name: /^10\.04\.2021\./ }))
    await expect(canvas.getByText('Version as of 10.04.2021.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Watch for changes' }))
    await expect(canvas.getByRole('button', { name: 'Stop watching' })).toBeVisible()
  },
}

/** The law's by-law: the Rulebook on Illustrative Site Records, based on Article 63. */
export const IllustrativeByLaw: Story = {
  name: 'Illustrative by-law',
  render: () => <ExampleApp start={O_ROUTES.byLaw} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText(
        'Based on Article 63 of the Law on Illustrative Building Works',
      ),
    ).toBeVisible()
  },
}

export const IllustrativeByLawPhone: Story = {
  name: 'Illustrative by-law, phone',
  render: () => <OnPhone start={O_ROUTES.byLaw} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Details' })).toBeVisible()
  },
}

/** A court decision's short page: its holding and the law's articles it concerns. */
export const IllustrativeDecision: Story = {
  name: 'Illustrative court decision',
  render: () => <ExampleApp start="/legal/practice/gz-101-2022" />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', {
        level: 1,
        name: 'Illustrative Appellate Court, Gž 101/2022',
      }),
    ).toBeVisible()
  },
}

export const IllustrativeDecisionPhone: Story = {
  name: 'Illustrative court decision, phone',
  render: () => <OnPhone start="/legal/practice/gz-101-2022" />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Final')).toBeVisible()
  },
}

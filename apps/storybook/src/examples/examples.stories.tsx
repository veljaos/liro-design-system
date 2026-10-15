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
          'a Serbian tenant sees them. Start with "Sign in" and click. The sidebar shows each ' +
          'screen twice, on a desktop and on a phone; the steps in between and the interaction ' +
          'tests are hidden from it and still run in the tests (P5.28).',
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
 * The VAT return for September 2026 as its form grid (an illustrative PP PDV / POPDV-like form,
 * P5.28 item 19): the rates over Base and VAT, nested numbered groups (1.2 collapsed), one-column
 * parts, absent cells blank; 1.1.1 from SEF opens the invoices (F-2026-0412 among them); typed
 * cells as fields; 3.1.1's VAT overridden by Ivana Stojanović, one failing check.
 */
export const VatReturnScreen: Story = {
  name: 'VAT return',
  render: () => <ExampleApp start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
    await expect(canvas.getByText('By Ivana Stojanović on 05.10.2026. 14:12')).toBeVisible()
    await expect(
      canvas.getAllByText('Difference: 64.400,00 RSD', { exact: false })[0],
    ).toBeVisible()
    await expect(canvas.getAllByRole('columnheader', { name: 'Општа стопа 20%' })).toHaveLength(2)
    await settle()
  },
}

export const VatReturnScreenInteraction: Story = {
  name: 'VAT return, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', {
        name: /^510\.809,60\sRSD, sources of 1\.1\.1 · Општа стопа 20% · Основица$/,
      }),
    )
    const drawer = within(
      await page.findByRole('dialog', { name: /^Source documents 1\.1\.1 Промет/ }),
    )
    await settle()
    await expect(drawer.getByRole('link', { name: /F-2026-0412/ })).toBeVisible()
    await expect(drawer.getByText('144.920,00 RSD')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
    })
    // 4.1 = 1.1.6 + 1.2.1 and 4.3 = 4.1 − 4.2, as the Core computed them.
    await expect(canvasElement).toHaveTextContent('122.551,92')
    await expect(canvasElement).toHaveTextContent('49.904,32')
    // "Go to" focuses the failing total.
    await userEvent.click(canvas.getByRole('button', { name: 'Go to 3.1.4' }))
    await waitFor(async () => {
      await expect(document.activeElement).toHaveTextContent('72.647,60')
    })
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.decided} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('10 of 10 lines done')
    await settle()
  },
}

export const BankStatementPostInteraction: Story = {
  name: 'Bank statement 188, posting, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.decided} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('10 of 10 lines done')
    await userEvent.click(canvas.getByRole('button', { name: 'Post statement' }))
    const dialog = await within(document.body).findByRole('alertdialog', {
      name: 'Post statement Statement 188 · Banca Intesa',
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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

/**
 * Invoice F-2026-0412 on paper, as simple as a Stripe invoice (P5.28): title and logo, the
 * key/value block, seller and buyer, "135.954,00 RSD due …", the payment details with the IPS QR
 * code, the lines and totals of its page from the same data; no signatures.
 */
export const PrintoutInvoice: Story = {
  name: 'Printout, invoice F-2026-0412',
  render: () => <ExampleApp start={J_ROUTES.invoicePrint} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const sheet = canvas.getByRole('article', { name: `Invoice ${FEATURED}` })
    await expect(sheet).toHaveAttribute('data-liro-theme', 'light')
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(/^Invoice$/)
    await expect(sheet.querySelector('[data-slot="print-amount-due"]')).toHaveTextContent(
      /^135\.954,00 RSD due \d{2}\.\d{2}\.\d{4}\.$/,
    )
    await expect(canvas.getByRole('img', { name: 'IPS QR code for the payment' })).toBeVisible()
    await expect(sheet.querySelector('[data-signature-field]')).toBeNull()
    const lines = canvas.getByRole('table', { name: 'Lines' })
    await expect(within(lines).getAllByRole('row')).toHaveLength(6)
    const totals = sheet.querySelector('[data-slot="document-totals"]')
    await expect(totals).toHaveAttribute('aria-label', 'Totals')
    await expect(totals).toHaveTextContent('185.954,00')
    await expect(totals).toHaveTextContent('135.954,00')
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
  tags: ['interaction', '!dev'],
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
    // Two electronic signature fields with their places in the PDF, on the one page.
    const fields = [...sheet.querySelectorAll<HTMLElement>('[data-signature-field]')]
    await expect(fields.map((field) => field.dataset.signatureField)).toEqual([
      'officer',
      'director',
    ])
    await expect(fields.map((field) => field.dataset.pdfPage)).toEqual(['1', '1'])
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={G_ROUTES.storePlanner} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Publish changes' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await expect(dialog).toHaveTextContent(
      `${String(STORE_PUBLISH.shifts)} shifts for ${String(STORE_PUBLISH.people)} people`,
    )
    // The messages are a choice (P5.28 item 9): the app's checked by the store, the SMS not.
    await expect(
      within(dialog).getByRole('checkbox', { name: /^Notify 8 people in the app/ }),
    ).toBeChecked()
    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: /^Send an SMS to the 2 people/ }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Publish changes and notify' }),
    )
    await expect(
      await within(document.body).findByText(
        'Changes published. 8 people get a message in the app. 2 also get an SMS.',
      ),
    ).toBeInTheDocument()
    await waitFor(async () => {
      await expect(canvas.queryByText('Changed since publishing')).toBeNull()
    })
  },
}

/**
 * "Publish changes" asked (P5.28 item 9): the counts and the open conflicts, then the messages as
 * a choice — "Notify 8 people in the app" checked by the store, an SMS to the two people whose
 * shifts changed not checked; the button says "Publish changes and notify" while one is checked.
 */
export const StoreShiftsPublishAsked: Story = {
  name: 'Store shifts, publish asked',
  tags: ['!dev'],
  render: () => <ExampleApp start={G_ROUTES.storePublish} />,
  play: async () => {
    await settle()
    const dialog = within(
      within(document.body).getByRole('alertdialog', { name: 'Publish the schedule?' }),
    )
    await expect(
      dialog.getByRole('checkbox', { name: /^Notify 8 people in the app/ }),
    ).toBeChecked()
    await expect(
      dialog.getByRole('checkbox', { name: /^Send an SMS to the 2 people/ }),
    ).not.toBeChecked()
    await expect(dialog.getByRole('button', { name: 'Publish changes and notify' })).toBeVisible()
  },
}

export const StoreShiftsPublishAskedPhone: Story = {
  name: 'Store shifts, publish asked, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={G_ROUTES.storePublish} />,
  play: async () => {
    await settle()
    const dialog = within(
      within(document.body).getByRole('alertdialog', { name: 'Publish the schedule?' }),
    )
    await expect(dialog.getByRole('button', { name: 'Publish changes and notify' })).toBeVisible()
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
  tags: ['!dev'],
  render: () => <OnPhone start={G_ROUTES.myShiftsSwap} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: /^Request a swap / }),
    ).toHaveTextContent('07:00')
  },
}

export const StoreSwapRequest: Story = {
  name: 'Store, my shifts, swap request',
  tags: ['!dev'],
  render: () => <ExampleApp start={G_ROUTES.myShiftsSwap} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: /^Request a swap / }),
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <OnPhone start={G_ROUTES.swapRequestWarning} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('above the illustrative 16 h')
    await expect(within(canvasElement).getByRole('button', { name: 'Approve' })).toBeVisible()
  },
}

export const StoreSwapRequestsReject: Story = {
  name: 'Store, swap requests, reject, interaction',
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.bookTime} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('radiogroup')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Choose a time first.')
  },
}

export const HealthBookingTimePhone: Story = {
  name: 'Health, book an appointment, choose a time, phone',
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.bookConfirm} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('at 11:30')
    await expect(within(canvasElement).getByRole('button', { name: 'Book' })).toBeVisible()
  },
}

export const HealthBookingConfirmPhone: Story = {
  name: 'Health, book an appointment, confirm, phone',
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.booked} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Your appointment is booked')
    await expect(canvasElement).toHaveTextContent('Confirmed')
  },
}

export const HealthBookedPhone: Story = {
  name: 'Health, appointment booked, phone',
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await settle()
    // The slot's name: its time range and the day in words.
    const day = EXAMPLE_FORMAT.dateLong('2026-10-14')
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
 * Nikolić's appointment booked online at 11:30; "now" (09:40) marked across the rows. Opening it
 * shows her finding.
 */
export const HealthClinicSchedule: Story = {
  name: 'Health, clinic schedule',
  render: () => <ExampleApp start={H_ROUTES.clinicSchedule} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(PATIENT.name)
    await expect(canvasElement).toHaveTextContent('Annual leave')
    // The time grids' one "now" marker at the clinic's clock (P5.28 item 10).
    await expect(within(canvasElement).getByRole('img', { name: 'Now, 09:40' })).toBeInTheDocument()
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

/**
 * dr Marko Stanković's week (CalendarView), his appointments and the team meeting, seen on the
 * day of Jovana's appointment at 09:40: the week from Monday, "now" on Wednesday's column.
 */
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
    // English names, the tenant's digits, the week from Monday (P5.28 item 2); "now" marked.
    await expect(canvasElement.querySelector('[data-slot="calendar-view"] h2')).toHaveTextContent(
      '12.10.2026. – 18.10.2026.',
    )
    await expect(canvasElement).toHaveTextContent('Wednesday, October 14, 2026')
    await expect(within(canvasElement).getByRole('img', { name: 'Now, 09:40' })).toBeInTheDocument()
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
    await expect(canvas.getByRole('button', { name: 'Show diagnosis' })).toBeVisible()
    await expect(canvasElement).not.toHaveTextContent(FINDING.diagnosis)
    await expect(canvasElement).toHaveTextContent(
      EXAMPLE_FORMAT.dateLong(JOVANA_BOOKING.start.slice(0, 10)),
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
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.findingAsk} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: /^Show diagnosis Jovana Nikolić/ }),
    ).toHaveTextContent('Access is logged')
  },
}

export const HealthFindingReasonPhone: Story = {
  name: 'Health, finding, reason asked, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={H_ROUTES.findingAsk} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: /^Show diagnosis Jovana Nikolić/ }),
    ).toBeVisible()
  },
}

/** The diagnosis shown after a reason, with Hide. */
export const HealthFindingShown: Story = {
  name: 'Health, finding, diagnosis shown',
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.findingShown} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(FINDING.diagnosis)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Hide diagnosis' }),
    ).toBeVisible()
  },
}

export const HealthFindingReveal: Story = {
  name: 'Health, finding, reveal, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.finding} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show diagnosis' }))
    const dialog = await within(document.body).findByRole('dialog', { name: /^Show diagnosis/ })
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'I am treating the patient now' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show' }))
    await expect(await canvas.findByText(FINDING.diagnosis)).toBeVisible()
    // The dialog has closed (until then the page behind it is hidden from assistive technology).
    await userEvent.click(await canvas.findByRole('button', { name: 'Hide diagnosis' }))
    await expect(canvasElement).not.toHaveTextContent(FINDING.diagnosis)
  },
}

/**
 * School (P5.17): class 7/2 of OŠ "Jovan Popović", 2026/27 — the week by periods with their
 * times, Wednesday's written test and Thursday's substitute; lesson 3 running now (the "now"
 * marker at 10:05), with a link to mark its attendance.
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.parent} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Excuse absences…' }))
    const drawer = await body.findByRole('dialog', { name: /^Excuse absences Luka Jovanović/ })
    // Today's absences are chosen; the reason is asked before anything is sent.
    await expect(within(drawer).getAllByRole('checkbox', { checked: true })).toHaveLength(2)
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send' }))
    await expect(drawer).toHaveTextContent('Choose a reason.')
    await userEvent.click(within(drawer).getByRole('radio', { name: 'Doctor’s appointment' }))
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send' }))
    await expect(
      await body.findByText('Excuse sent to the class teacher, Dragana Simić.'),
    ).toBeInTheDocument()
    await expect(canvasElement).toHaveTextContent('Excuse sent, waiting for the class teacher')
    await expect(canvasElement).not.toHaveTextContent('Today’s absences are not excused yet')
    // The drawer has closed (until then the page behind it is hidden from assistive technology).
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <ExampleApp start={I_ROUTES.posReceipt} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: `Receipt ${BAKERY.receipt}` })
    const receipt = within(dialog).getByRole('article', { name: 'Receipt' })
    await expect(receipt).toHaveTextContent(BAKERY.name)
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.total))
    // The tax per label is a recap table of amounts without the currency (P5.28).
    await expect(receipt).toHaveTextContent(SERBIAN_I.number(SALE_FIGURES.vatE, { decimals: 2 }))
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.change))
  },
}

/** The connection lost: three sales wait on the till, selling goes on. */
export const PosOffline: Story = {
  name: 'POS checkout, offline',
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <OnHandheld start={I_ROUTES.pickingSkip} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('alertdialog', { name: /^Skip line Fasadni stiropor/ }),
    ).toBeVisible()
  },
}

/** Offline: three changes wait on the handheld; picking goes on. */
export const PickingHandheldOffline: Story = {
  name: 'Warehouse picking, handheld, offline',
  tags: ['!dev'],
  render: () => <OnHandheld start={I_ROUTES.pickingOffline} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('3 changes waiting to be sent')).toBeVisible()
  },
}

/** Scan B-03-04, scan the boards, confirm 18: "5 of 12", and line 6 opens at B-05-02. */
export const PickingHandheldInteraction: Story = {
  name: 'Warehouse picking, handheld, interaction',
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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

/**
 * A booking opened in place (P5.28 item 17): Claire Martin's stay in a drawer over the same
 * timeline; the Bookings tab stays current.
 */
export const HotelBookingOpen: Story = {
  name: 'Hotel, bookings, a booking',
  tags: ['!dev'],
  render: () => <ExampleApp start={L_ROUTES.timelineStay} />,
  play: async ({ canvasElement }) => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Claire Martin' })
    await settle()
    await expect(drawer).toHaveTextContent('Room 101')
    await expect(drawer).toHaveTextContent('3 nights')
    await expect(
      within(canvasElement).getByRole('heading', { level: 1, name: 'Bookings', hidden: true }),
    ).toBeInTheDocument()
  },
}

export const HotelBookingOpenPhone: Story = {
  name: 'Hotel, bookings, a booking, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={L_ROUTES.timelineStay} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Claire Martin' })
    await settle()
    await expect(dialog).toBeVisible()
  },
}

/**
 * A stay moved on the timeline only proposes (P5.28 item 9): "Move stay" with the room and the
 * dates old → new and the guest's e-mail as a choice, checked as the hotel sets it.
 */
export const HotelStayMove: Story = {
  name: 'Hotel, bookings, moving a stay',
  tags: ['!dev'],
  render: () => <ExampleApp start={L_ROUTES.timelineMove} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Move stay Dragan Lazić',
    })
    await settle()
    const changes = within(dialog).getByRole('list', { name: 'Changes' })
    await expect(changes).toHaveTextContent('Room 103After:Room 105')
    await expect(within(changes).getAllByRole('listitem')).toHaveLength(2)
    await expect(
      within(dialog).getByRole('checkbox', { name: /^Notify Dragan Lazić by e-mail/ }),
    ).toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Save and notify' })).toBeVisible()
  },
}

export const HotelStayMovePhone: Story = {
  name: 'Hotel, bookings, moving a stay, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={L_ROUTES.timelineMove} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Move stay Dragan Lazić',
    })
    await settle()
    await expect(dialog).toBeVisible()
  },
}

/**
 * A booking opens in its drawer and closes again on the same tab; "Move to…" a stay asks first,
 * and Save moves it and says the guest gets an e-mail.
 */
export const HotelBookingsInteraction: Story = {
  name: 'Hotel, bookings, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={L_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: /^Claire Martin, Room 101, / }))
    const stay = await body.findByRole('dialog', { name: 'Claire Martin' })
    await waitFor(async () => {
      await expect(stay).toBeVisible()
    })
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await expect(canvas.getByRole('heading', { level: 1, name: 'Bookings' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Move to…: Dragan Lazić' }))
    const panel = await body.findByRole('dialog', { name: 'Move to…: Dragan Lazić' })
    await userEvent.click(within(panel).getByRole('combobox', { name: 'Room' }))
    await userEvent.click(await body.findByRole('option', { name: 'Room 105' }))
    await userEvent.click(await within(panel).findByRole('button', { name: 'Move' }))
    const dialog = await body.findByRole('dialog', { name: 'Move stay Dragan Lazić' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save and notify' }))
    await waitFor(async () => {
      await expect(body.getByText('Stay moved. Dragan Lazić gets an e-mail.')).toBeVisible()
    })
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /^Dragan Lazić, Room 105, / })).toBeVisible()
    })
    notice.dismiss()
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
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

/** Start cleaning on a phone: room 306 leaves the rooms to clean (P5.28 item 25). */
export const HotelStartCleaningInteraction: Story = {
  name: 'Hotel, start cleaning, interaction',
  tags: ['interaction', '!dev'],
  render: () => <OnPhone start={L_ROUTES.housekeepingRoom} />,
  play: async ({ canvasElement }) => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Room 306' })
    await settle()
    await userEvent.click(within(drawer).getByRole('button', { name: 'Start cleaning' }))
    await waitFor(async () => {
      await expect(within(canvasElement).getByText('4 of 10 shown')).toBeInTheDocument()
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
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorOpen} />,
  play: async () => {
    await settle()
    // The action, then the table on its own line (P5.28 item 6).
    const dialog = within(document.body).getByRole('dialog', { name: 'Open table Table 4' })
    await expect(within(dialog).getByRole('textbox', { name: 'Guests' })).toHaveValue('2')
  },
}

export const RestaurantOpenTablePhone: Story = {
  name: 'Restaurant service, opening a table, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.floorOpen} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Open table Table 4' }),
    ).toBeVisible()
  },
}

/**
 * Moving table 5's party of three (P5.28 items 6, 9, 25): the free tables with seats enough,
 * best first (the same area, the fewest seats left over), and the change old → new; Move.
 */
export const RestaurantMoveGuests: Story = {
  name: 'Restaurant service, moving guests',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorMove} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move guests Table 5 · 3 guests',
    })
    const tables = within(dialog).getByRole('radiogroup', { name: 'Free tables with enough seats' })
    await expect(within(tables).getAllByRole('radio')).toHaveLength(4)
    await expect(within(tables).getByRole('radio', { name: /^Table 4/ })).toBeChecked()
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'Table 5 · Sala · 4 seatsAfter:Table 4 · Sala · 4 seats',
    )
    await expect(within(dialog).getByRole('button', { name: 'Move' })).toBeVisible()
  },
}

export const RestaurantMoveGuestsPhone: Story = {
  name: 'Restaurant service, moving guests, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.floorMove} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Move guests Table 5 · 3 guests' }),
    ).toBeVisible()
  },
}

/**
 * Table 8's reservation for six (P5.28 item 25, the owner's case): no free table seats six, so the
 * dialog says so and offers to merge tables — never an empty list.
 */
export const RestaurantMoveNoTable: Story = {
  name: 'Restaurant service, no table for the party',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorMoveNone} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move guests Table 8 · Kovačević, 6 guests',
    })
    await expect(dialog).toHaveTextContent('No free table seats 6 guests')
    await expect(
      within(dialog).getByRole('button', { name: 'Merge tables in the floor plan' }),
    ).toBeVisible()
  },
}

export const RestaurantMoveNoTablePhone: Story = {
  name: 'Restaurant service, no table for the party, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.floorMoveNone} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', {
        name: 'Move guests Table 8 · Kovačević, 6 guests',
      }),
    ).toBeVisible()
  },
}

/** One area at a time (P5.28 item 26): the terrace alone, fitted to the width. */
export const RestaurantTerrace: Story = {
  name: 'Restaurant service, the terrace',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorTerrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('radio', { name: 'Terasa' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvasElement.querySelector('[data-floor-item="t1"]')).toBeNull()
    await expect(floorItem(canvasElement, 't13')).toHaveTextContent('132 guests')
    await expectNoPageScroll(canvasElement)
  },
}

export const RestaurantTerracePhone: Story = {
  name: 'Restaurant service, the terrace, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.floorTerrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryByRole('heading', { name: 'Sala' })).toBeNull()
    await expect(within(canvasElement).getByRole('heading', { name: 'Terasa' })).toBeVisible()
    await expectNoPageScroll(canvasElement)
  },
}

/**
 * Takeaway and delivery are the till's order channels beside dine-in, not areas of the plan
 * (P5.28 item 26): two takeaway orders, the next step on each.
 */
export const RestaurantTakeaway: Story = {
  name: 'Restaurant service, takeaway orders',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorTakeaway} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tab', { name: 'Takeaway (2)' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.getByRole('heading', { name: /^T-041/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Handed over' })).toBeVisible()
  },
}

export const RestaurantTakeawayPhone: Story = {
  name: 'Restaurant service, takeaway orders, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.floorTakeaway} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: /^T-042/ })).toBeVisible()
    await expectNoPageScroll(canvasElement)
  },
}

/** A takeaway order made ready, then handed over: it leaves the list. */
export const RestaurantTakeawayInteraction: Story = {
  name: 'Restaurant service, takeaway, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorTakeaway} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as ready' }))
    await waitFor(async () => {
      await expect(canvas.getAllByRole('button', { name: 'Handed over' })).toHaveLength(2)
    })
    const handed = canvas.getAllByRole('button', { name: 'Handed over' })[0]
    if (handed === undefined) throw new Error('no order to hand over')
    await userEvent.click(handed)
    await waitFor(async () => {
      await expect(canvas.getByRole('tab', { name: 'Takeaway (1)' })).toBeVisible()
    })
    await userEvent.click(canvas.getByRole('tab', { name: 'Delivery (1)' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Mark as ready' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Out for delivery' }))
    await expect(await canvas.findByRole('button', { name: 'Delivered' })).toBeVisible()
    notice.dismiss()
  },
}

/**
 * The service by the keys and presses: Enter opens table 2, which is free — "Open table" for
 * two; then table 5's party moves to table 10 and table 5 waits for cleaning.
 */
export const RestaurantServiceInteraction: Story = {
  name: 'Restaurant service, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.floor} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(floorItem(canvasElement, 't2'))
    await userEvent.click(canvas.getByRole('button', { name: 'Open table' }))
    let dialog = await body.findByRole('dialog', { name: 'Open table Table 2' })
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
    dialog = await body.findByRole('dialog', { name: 'Move guests Table 5 · 3 guests' })
    await userEvent.click(within(dialog).getByRole('radio', { name: /^Table 10/ }))
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'After:Table 10',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't5')).toHaveAccessibleName(/Needs cleaning/)
    })
    await expect(floorItem(canvasElement, 't10')).toHaveAccessibleName(
      /^Table 10, 3 guests · 19:20, Occupied/,
    )
    notice.dismiss()
  },
}

/**
 * The owner's case end to end (P5.28 item 25): table 8's party of six has no free table; "Merge
 * tables in the floor plan" opens it, tables 11 and 12 are merged and saved, and back on the floor
 * the party moves to table 11 (eight seats) — the reservation's SMS left unchecked.
 */
export const RestaurantMergeAndMoveInteraction: Story = {
  name: 'Restaurant service, merge and move a party, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorMoveNone} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    let dialog = body.getByRole('dialog', { name: /^Move guests Table 8/ })
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Merge tables in the floor plan' }),
    )
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Merge Table 11 and Table 12' }),
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Save floor plan' }))
    await userEvent.click(canvas.getByRole('link', { name: 'Floor' }))
    await userEvent.click(await canvas.findByRole('button', { name: /^Table 8,/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Move to table…' }))
    dialog = await body.findByRole('dialog', { name: /^Move guests Table 8/ })
    await expect(within(dialog).getByRole('radio', { name: /^Table 11/ })).toBeChecked()
    await expect(
      within(dialog).getByRole('checkbox', { name: /Notify Kovačević/ }),
    ).not.toBeChecked()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't11')).toHaveAccessibleName(
        /^Table 11, 20:30 · 6 guests, Reserved, 8 seats, Terasa/,
      )
    })
    await waitFor(async () => {
      await expect(
        body.getByText('Guests moved from Table 8 to Table 11. No message was sent.'),
      ).toBeVisible()
    })
    notice.dismiss()
  },
}

/**
 * Every table action of the service (P5.28 item 25): a reservation seated, a table cleared, a
 * table cleaned — each state on the plan at once.
 */
export const RestaurantTableActionsInteraction: Story = {
  name: 'Restaurant service, seat, clear and clean, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.floor} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(floorItem(canvasElement, 't3'))
    await userEvent.click(canvas.getByRole('button', { name: 'Seat guests' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't3')).toHaveAccessibleName(/^Table 3, .*Occupied/)
    })
    await userEvent.click(floorItem(canvasElement, 't7'))
    await userEvent.click(canvas.getByRole('button', { name: 'Clear table' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't7')).toHaveAccessibleName(/^Table 7, Needs cleaning/)
    })
    await userEvent.click(floorItem(canvasElement, 't6'))
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as clean' }))
    await waitFor(async () => {
      await expect(floorItem(canvasElement, 't6')).toHaveAccessibleName(/^Table 6, Free/)
    })
    notice.dismiss()
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

/** On a phone the plan is not edited (P5.28 item 27): a note, no palette, no Save. */
export const RestaurantFloorPlanEditPhone: Story = {
  name: 'Restaurant floor plan, editing, phone',
  render: () => <OnPhone start={K_ROUTES.floorEdit} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Edit the plan on a computer or tablet.')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Save floor plan' })).toBeNull()
    await expectNoPageScroll(canvasElement)
  },
}

/** Tables 11 and 12 merged into one table of eight for the evening. */
export const RestaurantTablesMerged: Story = {
  name: 'Restaurant floor plan, tables merged',
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.floorMerged} />,
}

/** Merging by pressing, then moving the merged table with the keys (Space, arrows, Space). */
export const RestaurantMergeInteraction: Story = {
  name: 'Restaurant floor plan, merging, interaction',
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.terraceTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoPageScroll(canvasElement)
  },
}

/** A press on table 3 opens its order; a kapućino more; back to the terrace. */
export const CafeInteraction: Story = {
  name: 'Café terrace, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.terrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(floorItem(canvasElement, 't3'))
    await expect(await canvas.findByRole('heading', { name: 'Table 3' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Kapućino/ }))
    // P5.28: a sent line stays as it was sent; the new kapućino waits to be sent.
    await expect(canvas.getByRole('button', { name: 'Send order (1)' })).toBeVisible()
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
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.seatingSeat} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Seat a guest Table 4, seat 9' }),
    ).toBeVisible()
  },
}

export const GalaSeatChosenPhone: Story = {
  name: 'Event seating, a seat chosen, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.seatingSeat} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Seat a guest Table 4, seat 9' }),
    ).toBeVisible()
  },
}

/** "Seat at…" from a guest's menu: a table with its free seats, then a seat. */
export const GalaSeatAt: Story = {
  name: 'Event seating, Seat at…',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.seatingSeatAt} />,
  play: async () => {
    await settle()
    const guest = GALA_GUESTS.find((each) => each.id === 'g113')
    await expect(
      within(document.body).getByRole('dialog', { name: `Choose a seat ${guest?.name ?? ''}` }),
    ).toBeVisible()
  },
}

export const GalaSeatAtPhone: Story = {
  name: 'Event seating, Seat at…, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.seatingSeatAt} />,
}

/** Table 6's guests in seat order, with the organiser's conflict. */
export const GalaTableGuests: Story = {
  name: 'Event seating, a table’s guests',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.seatingTable} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Table 6' })
    await expect(dialog).toHaveTextContent('Keep apart')
  },
}

export const GalaTableGuestsPhone: Story = {
  name: 'Event seating, a table’s guests, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.seatingTable} />,
}

/**
 * The keyboard's way: Enter on table 4's seat 9, then the first guest not seated: 113 of 140,
 * "1 change not saved"; "Save seating…" asks with the change and the guest's e-mail as a choice
 * (P5.28 item 9), and Save keeps it.
 */
export const GalaSeatingInteraction: Story = {
  name: 'Event seating, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.seating} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    floorItem(canvasElement, 't4#9').focus()
    await userEvent.keyboard('{Enter}')
    let dialog = await body.findByRole('dialog', { name: 'Seat a guest Table 4, seat 9' })
    const first = within(dialog).getAllByRole('button', { name: /Not seated/ })[0]
    if (first === undefined) throw new Error('no guest to seat')
    await userEvent.click(first)
    await waitFor(async () => {
      await expect(canvas.getByText('113 of 140 seated')).toBeVisible()
    })
    await expect(canvas.getByText('1 change not saved')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Save seating…' }))
    dialog = await body.findByRole('dialog', { name: /^Save seating Gala dinner/ })
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'Table 4, seat 9',
    )
    await expect(within(dialog).getByRole('checkbox', { name: /^E-mail / })).not.toBeChecked()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(async () => {
      await expect(body.getByText('Seating saved. No message was sent.')).toBeVisible()
    })
    await waitFor(async () => {
      await expect(canvas.queryByText('1 change not saved')).toBeNull()
    })
    notice.dismiss()
  },
}

/** Three seatings pending, "Save seating…" asked: every guest's seat old → new (P5.28 item 9). */
export const GalaSeatingPending: Story = {
  name: 'Event seating, saving the changes',
  tags: ['!dev'],
  render: () => <ExampleApp start={K_ROUTES.seatingPending} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText('3 changes not saved', { exact: true }),
    ).toBeInTheDocument()
    const dialog = within(document.body).getByRole('dialog', { name: /^Save seating Gala dinner/ })
    await expect(
      within(within(dialog).getByRole('list', { name: 'Changes' })).getAllByRole('listitem'),
    ).toHaveLength(3)
    await expect(
      within(dialog).getByRole('checkbox', { name: 'E-mail the 3 guests their new seats' }),
    ).not.toBeChecked()
  },
}

export const GalaSeatingPendingPhone: Story = {
  name: 'Event seating, saving the changes, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={K_ROUTES.seatingPending} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: /^Save seating Gala dinner/ }),
    ).toBeVisible()
  },
}

/** Pending seatings discarded: the dialog cancelled, then "Discard changes" (P5.28 item 9). */
export const GalaSeatingDiscardInteraction: Story = {
  name: 'Event seating, discarding the changes, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.seatingPending} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const dialog = within(document.body).getByRole('dialog', { name: /^Save seating/ })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Discard changes' }))
    await expect(canvas.getByText('112 of 140 seated')).toBeVisible()
    await expect(canvas.queryByText('3 changes not saved')).toBeNull()
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={M_ROUTES.approvalEdit} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Go to Legal reviews the terms' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Connect to…' }))
    const connect = await body.findByRole('dialog', {
      name: 'Connect to Legal reviews the terms',
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
    const label = await body.findByRole('dialog', { name: /^Label connection Connection from / })
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={O_ROUTES.law} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Article 12' }))
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

/**
 * "Compare versions" from the law's page: the 2021 version against the version in force, inline,
 * the changed articles only; insertions underlined, deletions struck through, each with its word.
 */
export const IllustrativeLawCompare: Story = {
  name: 'Illustrative law, compare versions',
  render: () => <ExampleApp start={O_ROUTES.lawCompare} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Compare versions' })).toBeVisible()
    await expect(canvasElement.querySelector('ins')).not.toBeNull()
  },
}

export const IllustrativeLawComparePhone: Story = {
  name: 'Illustrative law, compare versions, phone',
  render: () => <OnPhone start={O_ROUTES.lawCompare} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { level: 1, name: 'Compare versions' }),
    ).toBeVisible()
  },
}

/** Kvadrat Gradnja's Work Rulebook: the 2022 version against the 2025 version. */
export const RulebookCompare: Story = {
  name: 'Kvadrat Gradnja work rulebook, compare 2022 and 2025',
  tags: ['!dev'],
  render: () => <ExampleApp start={O_ROUTES.rulebookCompare} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { level: 1, name: 'Compare versions' }),
    ).toBeVisible()
  },
}

/** From the act page: "Compare versions", then another earlier version. */
export const IllustrativeLawCompareInteraction: Story = {
  name: 'Illustrative law, compare versions, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={O_ROUTES.law} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Compare versions' }))
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Compare versions' }),
    ).toBeVisible()
    await expect(canvasElement.querySelector('ins')).not.toBeNull()
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

// ── P5.25a group N: a warehouse, a hospital ward, an office ──

import { BEDS, N_ROUTES } from './data-N'

/** A place on a floor plan by its id. */
function placeOn(canvasElement: HTMLElement, id: string): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(`[data-floor-item="${id}"]`)
  if (element === null) throw new Error(`no place ${id}`)
  return element
}

/** The building's drawings under the plans are drawn (`data:` URIs decode at once). */
async function drawingsShown(canvasElement: HTMLElement) {
  await waitFor(async () => {
    for (const image of canvasElement.querySelectorAll<HTMLImageElement>(
      '[data-slot="floor-plan-background"]',
    )) {
      await expect(image.complete && image.naturalWidth > 0).toBe(true)
    }
  })
}

/** Nothing on the screen scrolls sideways (the plan scrolls inside its own box). */
async function expectPlanFits(canvasElement: HTMLElement) {
  for (const element of canvasElement.querySelectorAll<HTMLElement>('[data-slot="floor-plan"]')) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
  }
}

/**
 * Magacin Novi Sad's hall on Tuesday 6 October 2026: four zones of racks and the bulk yard (a
 * polygon round the dispatch dock), each bin with how full it is (a bar, and words in its name)
 * and its state — in stock, low, empty, blocked, and A-02-03 where count CC-2026-0031 is open.
 */
export const WarehouseFloorPlan: Story = {
  name: 'Warehouse floor plan, Magacin Novi Sad',
  render: () => <ExampleApp start={N_ROUTES.warehouse} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(placeOn(canvasElement, 'A-02-03')).toHaveAccessibleName(
      `A-02-03, Count open, 45% full, Zone A, Cycle count CC-2026-0031 is open: the pick of PL-2026-0418 came up short here.`,
    )
    await expect(placeOn(canvasElement, 'E-01-01')).toHaveAccessibleName(
      /^E-01-01, In stock, 75% full, Bulk yard E/,
    )
    await expectPlanFits(canvasElement)
  },
}

/** On a phone: the key figures, then the bins as a list by rack. */
export const WarehouseFloorPlanPhone: Story = {
  name: 'Warehouse floor plan, Magacin Novi Sad, phone',
  render: () => <OnPhone start={N_ROUTES.warehouse} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: 'Rack A2' })).toBeVisible()
    await expectPlanFits(canvasElement)
  },
}

/** A-02-03's record: what the books say it holds, and "Count now" (the handheld's count). */
export const WarehouseBinCount: Story = {
  name: 'Warehouse floor plan, a bin to count',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.warehouseBin} />,
  play: async () => {
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: 'Bin A-02-03' })
    await expect(drawer).toHaveTextContent('Armaturna mreža Q188, 2,15 × 6 m')
    await expect(within(drawer).getByRole('button', { name: 'Count now' })).toBeVisible()
  },
}

export const WarehouseBinCountPhone: Story = {
  name: 'Warehouse floor plan, a bin to count, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.warehouseBin} />,
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('dialog', { name: 'Bin A-02-03' })).toBeVisible()
  },
}

/** B-03-04, the next line of pick list PL-2026-0418: "Pick here" opens the pick list. */
export const WarehouseBinPick: Story = {
  name: 'Warehouse floor plan, the next pick',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.warehousePick} />,
  play: async () => {
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: 'Bin B-03-04' })
    await expect(within(drawer).getByRole('button', { name: 'Pick here' })).toBeVisible()
    await expect(drawer).toHaveTextContent('65% full')
  },
}

export const WarehouseBinPickPhone: Story = {
  name: 'Warehouse floor plan, the next pick, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.warehousePick} />,
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('dialog', { name: 'Bin B-03-04' })).toBeVisible()
  },
}

/** A bin opened from the plan, then "Count now": the handheld's count of A-02-03. */
export const WarehouseFloorPlanInteraction: Story = {
  name: 'Warehouse floor plan, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={N_ROUTES.warehouse} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(placeOn(canvasElement, 'A-02-03'))
    const drawer = await within(document.body).findByRole('dialog', { name: 'Bin A-02-03' })
    await userEvent.click(within(drawer).getByRole('button', { name: 'Count now' }))
    await expect(await within(canvasElement).findByText('Cycle count CC-2026-0031')).toBeVisible()
  },
}

/** The other bin actions (P5.28 item 25): a count started, a blocked bin unblocked. */
export const WarehouseBinActionsInteraction: Story = {
  name: 'Warehouse floor plan, count and unblock, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={N_ROUTES.warehouse} />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(placeOn(canvasElement, 'B-05-02'))
    let drawer = within(await body.findByRole('dialog', { name: 'Bin B-05-02' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Count' }))
    await waitFor(async () => {
      await expect(placeOn(canvasElement, 'B-05-02')).toHaveAccessibleName(/^B-05-02, Count open/)
    })
    await userEvent.click(placeOn(canvasElement, 'A-04-01'))
    drawer = within(await body.findByRole('dialog', { name: 'Bin A-04-01' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Unblock' }))
    await waitFor(async () => {
      await expect(placeOn(canvasElement, 'A-04-01')).toHaveAccessibleName(/^A-04-01, In stock/)
    })
    notice.dismiss()
  },
}

/**
 * Interno odeljenje 3 over the building's drawing: rooms 1–6 and the anteroom rectangles, the
 * corridor with its lobby, room 7 round it and the isolation room as polygons; 17 beds free,
 * occupied, needing cleaning or blocked. No patient's name on the plan.
 */
export const HospitalWard: Story = {
  name: 'Hospital ward, Interno odeljenje 3',
  render: () => <ExampleApp start={N_ROUTES.ward} />,
  play: async ({ canvasElement }) => {
    await settle()
    await drawingsShown(canvasElement)
    await expect(placeOn(canvasElement, 'b8')).toHaveAccessibleName(
      'Bed 8, Blocked, Room 4, Oxygen outlet faulty; maintenance on 07.10.2026.',
    )
    for (const bed of BEDS) {
      if (bed.patient !== undefined)
        await expect(canvasElement).not.toHaveTextContent(bed.patient.name)
    }
    await expectPlanFits(canvasElement)
  },
}

/** On a phone: the beds as a list by room. */
export const HospitalWardPhone: Story = {
  name: 'Hospital ward, Interno odeljenje 3, phone',
  render: () => <OnPhone start={N_ROUTES.ward} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: 'Isolation' })).toBeVisible()
    await expectPlanFits(canvasElement)
  },
}

/** Bed 9 in its drawer: the patient's name masked, admitted, the doctor, Transfer and Discharge. */
export const HospitalWardBed: Story = {
  name: 'Hospital ward, a bed',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.wardBed} />,
  play: async () => {
    await settle()
    const drawer = within(within(document.body).getByRole('dialog', { name: 'Bed 9' }))
    await expect(drawer.getByRole('button', { name: 'Show patient’s name' })).toBeVisible()
    await expect(within(document.body).queryByText('Vesna Radović')).toBeNull()
    await expect(drawer.getByRole('button', { name: 'Discharge' })).toBeVisible()
  },
}

export const HospitalWardBedPhone: Story = {
  name: 'Hospital ward, a bed, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.wardBed} />,
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('dialog', { name: 'Bed 9' })).toBeVisible()
  },
}

/** Bed 9 opened, its patient's name shown for a reason, then discharged: it needs cleaning. */
export const HospitalWardInteraction: Story = {
  name: 'Hospital ward, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={N_ROUTES.ward} />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(placeOn(canvasElement, 'b9'))
    const drawer = within(await body.findByRole('dialog', { name: 'Bed 9' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Show patient’s name' }))
    const dialog = await body.findByRole('dialog', { name: 'Show patient’s name Bed 9' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Shift handover' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show' }))
    await waitFor(async () => {
      await expect(body.getByText('Vesna Radović')).toBeVisible()
    })
    await userEvent.click(
      within(await body.findByRole('dialog', { name: 'Bed 9' })).getByRole('button', {
        name: 'Discharge',
      }),
    )
    await waitFor(async () => {
      await expect(placeOn(canvasElement, 'b9')).toHaveAccessibleName(
        'Bed 9, Needs cleaning, Room 5, Discharged today',
      )
    })
  },
}

/**
 * "Transfer…" on bed 9 (P5.28 item 18): the free beds by room, the bed old → new, the doctor's
 * message checked and the porters' a choice; the patient's name stays masked.
 */
export const HospitalWardTransfer: Story = {
  name: 'Hospital ward, transferring a patient',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.wardTransfer} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Transfer patient Bed 9 · Room 5',
    })
    await settle()
    await expect(
      within(dialog).getByRole('radiogroup', { name: 'Free beds in Room 1' }),
    ).toBeVisible()
    await expect(within(dialog).getByRole('radio', { name: /^Bed 2/ })).toBeChecked()
    await expect(
      within(dialog).getByRole('checkbox', { name: /^Notify dr Ivana Lukić in Liro/ }),
    ).toBeChecked()
    await expect(within(document.body).queryByText('Vesna Radović')).toBeNull()
  },
}

export const HospitalWardTransferPhone: Story = {
  name: 'Hospital ward, transferring a patient, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.wardTransfer} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Transfer patient Bed 9 · Room 5',
    })
    await settle()
    await expect(dialog).toBeVisible()
  },
}

/** "Admit patient…" on free bed 2 (P5.28 item 18): the patients waiting, by case number. */
export const HospitalWardAdmit: Story = {
  name: 'Hospital ward, admitting a patient',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.wardAdmit} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Admit patient Bed 2 · Room 1',
    })
    await settle()
    await expect(within(dialog).getByRole('radio', { name: /^P-2026-1187/ })).toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Admit' })).toBeVisible()
  },
}

export const HospitalWardAdmitPhone: Story = {
  name: 'Hospital ward, admitting a patient, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.wardAdmit} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Admit patient Bed 2 · Room 1',
    })
    await settle()
    await expect(dialog).toBeVisible()
  },
}

/**
 * Transfer from bed 9 to bed 15 in room 7, the doctor told: bed 9 needs cleaning, bed 15 is
 * occupied; then free bed 2 admits the next patient waiting.
 */
export const HospitalWardTransferInteraction: Story = {
  name: 'Hospital ward, transfer and admit, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={N_ROUTES.ward} />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(placeOn(canvasElement, 'b9'))
    let drawer = within(await body.findByRole('dialog', { name: 'Bed 9' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Transfer…' }))
    const dialog = await body.findByRole('dialog', { name: 'Transfer patient Bed 9 · Room 5' })
    await userEvent.click(within(dialog).getByRole('radio', { name: /^Bed 15/ }))
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'After:Bed 15 · Room 7',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Transfer' }))
    await waitFor(async () => {
      await expect(
        body.getByText('Patient moved from Bed 9 to Bed 15. Sent to dr Ivana Lukić.'),
      ).toBeVisible()
    })
    await waitFor(async () => {
      await expect(placeOn(canvasElement, 'b9')).toHaveAccessibleName(
        'Bed 9, Needs cleaning, Room 5, Patient moved to Bed 15',
      )
    })
    await expect(placeOn(canvasElement, 'b15')).toHaveAccessibleName('Bed 15, Occupied, Room 7')
    await userEvent.click(placeOn(canvasElement, 'b2'))
    drawer = within(await body.findByRole('dialog', { name: 'Bed 2' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Admit patient…' }))
    const admit = await body.findByRole('dialog', { name: 'Admit patient Bed 2 · Room 1' })
    await userEvent.click(within(admit).getByRole('button', { name: 'Admit' }))
    await waitFor(async () => {
      await expect(body.getByText('P-2026-1187 admitted to Bed 2.')).toBeVisible()
    })
    notice.dismiss()
  },
}

/** The other bed actions (P5.28 item 25): a bed cleaned, a blocked bed unblocked. */
export const HospitalWardBedActionsInteraction: Story = {
  name: 'Hospital ward, clean and unblock, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={N_ROUTES.ward} />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(placeOn(canvasElement, 'b5'))
    let drawer = within(await body.findByRole('dialog', { name: 'Bed 5' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Mark clean' }))
    await waitFor(async () => {
      await expect(placeOn(canvasElement, 'b5')).toHaveAccessibleName(/^Bed 5, Free/)
    })
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await userEvent.click(placeOn(canvasElement, 'b8'))
    drawer = within(await body.findByRole('dialog', { name: 'Bed 8' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Unblock' }))
    await waitFor(async () => {
      await expect(placeOn(canvasElement, 'b8')).toHaveAccessibleName(/^Bed 8, Free/)
    })
    notice.dismiss()
  },
}

/**
 * Kvadrat Gradnja's office, floor 2, today (Tuesday 06.10.2026) over the architect's drawing:
 * the open space (a polygon round the kitchen), two meeting rooms and the quiet room; 22 desks,
 * free, booked (with the colleague's name), Milica's own, one out of use.
 */
export const OfficeDesks: Story = {
  name: 'Office desks, Kvadrat Gradnja',
  render: () => <ExampleApp start={N_ROUTES.office} />,
  play: async ({ canvasElement }) => {
    await settle()
    await drawingsShown(canvasElement)
    const canvas = within(canvasElement)
    // Interface text in English, dates as the Serbian tenant writes them.
    await expect(canvas.getByRole('combobox', { name: 'Day' })).toHaveTextContent(
      /^Today, \S+ 06\.10\.2026\.$/,
    )
    await expect(placeOn(canvasElement, 'd1')).toHaveAccessibleName(
      'Desk 1, Stefan N., Booked, Open space',
    )
    await expect(placeOn(canvasElement, 'd3')).toHaveAccessibleName(
      'Desk 3, Your booking, Open space',
    )
    await expectPlanFits(canvasElement)
  },
}

/** On a phone: the day, then the desks as a list by area. */
export const OfficeDesksPhone: Story = {
  name: 'Office desks, Kvadrat Gradnja, phone',
  render: () => <OnPhone start={N_ROUTES.office} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: 'Quiet room' })).toBeVisible()
    await expectPlanFits(canvasElement)
  },
}

/** Desk 7, free today, chosen: its equipment and "Book". */
export const OfficeDesksFree: Story = {
  name: 'Office desks, a free desk',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.officeDesk} />,
  play: async ({ canvasElement }) => {
    await settle()
    await drawingsShown(canvasElement)
    await expect(placeOn(canvasElement, 'd7')).toHaveAttribute('aria-pressed', 'true')
    await expect(within(canvasElement).getByRole('button', { name: 'Book' })).toBeVisible()
  },
}

export const OfficeDesksFreePhone: Story = {
  name: 'Office desks, a free desk, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.officeDesk} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Book' })).toBeVisible()
  },
}

/** Milica's own desk today: "Cancel booking". */
export const OfficeDesksOwn: Story = {
  name: 'Office desks, your booking',
  tags: ['!dev'],
  render: () => <ExampleApp start={N_ROUTES.officeOwn} />,
  play: async ({ canvasElement }) => {
    await settle()
    await drawingsShown(canvasElement)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Cancel booking' }),
    ).toBeVisible()
  },
}

export const OfficeDesksOwnPhone: Story = {
  name: 'Office desks, your booking, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={N_ROUTES.officeOwn} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Cancel booking' }),
    ).toBeVisible()
  },
}

/**
 * Booking desk 7 today gives desk 3 back (one desk a person a day); on Thursday desk 3 is
 * Milica's again.
 */
export const OfficeDesksInteraction: Story = {
  name: 'Office desks, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={N_ROUTES.office} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(placeOn(canvasElement, 'd7'))
    await userEvent.click(canvas.getByRole('button', { name: 'Book' }))
    await expect(placeOn(canvasElement, 'd7')).toHaveAccessibleName(
      'Desk 7, Your booking, Open space',
    )
    await expect(placeOn(canvasElement, 'd3')).toHaveAccessibleName('Desk 3, Free, Open space')
    await userEvent.click(canvas.getByRole('combobox', { name: 'Day' }))
    await userEvent.click(
      await within(document.body).findByRole('option', { name: /08\.10\.2026\.$/ }),
    )
    await expect(placeOn(canvasElement, 'd3')).toHaveAccessibleName(
      'Desk 3, Your booking, Open space',
    )
    notice.dismiss()
    // The day's list has closed and given the page back to assistive technology.
    await waitFor(async () => {
      await expect(document.body.querySelector('[data-aria-hidden]')).toBeNull()
    })
  },
}

// ── P5.28 dates ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
// Long dates and weekday names in the interface's language, the tenant's digits (P5.28 item 2).
import { EXAMPLE_FORMAT } from '../../../../packages/ui/src/components/story-frames'
import { nextFrames } from '../../../../packages/ui/src/components/sticky-story-helpers'

/** The bottom edge of AppShell's sticky top (the header with the module tabs). */
function shellEdge(canvasElement: HTMLElement): number {
  const header = canvasElement.querySelector('[data-slot="app-shell"] header')
  const top = header?.parentElement
  if (top === null || top === undefined) throw new Error('no shell header')
  return top.getBoundingClientRect().bottom
}

/**
 * The gradebook of 30 pupils (P5.28 item 4): scrolled down the page, the assessments row stays
 * right below the shell's header (it disappeared under it), and the pupils stay at the start.
 */
export const SchoolGradebookUnderTheShell: Story = {
  name: 'School, gradebook, header under the shell, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.gradebook} />,
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(canvasElement).getByRole('grid')
    const corner = grid.querySelector('[data-sticky-start]')
    if (corner === null) throw new Error('no corner')
    const scroller = document.scrollingElement ?? document.documentElement
    scroller.scrollTop += grid.getBoundingClientRect().top - shellEdge(canvasElement) + 500
    await nextFrames()
    await waitFor(async () => {
      await expect(
        Math.abs(corner.getBoundingClientRect().top - shellEdge(canvasElement)),
      ).toBeLessThanOrEqual(1)
    })
    await expect(within(grid).getAllByRole('rowheader')).toHaveLength(30)
  },
}

// ── P5.28 screens: moves are confirmed, the excuse asks first ──

/**
 * The clinic's schedule after a drag (P5.28): Jovana Nikolić's appointment dragged to dr Nada
 * Grujić's free 12:30. Nothing has moved yet: the confirmation shows the change (doctor and time,
 * old → new), who it concerns, and her SMS as a choice, checked as the clinic sets it; Cancel
 * leaves it where it was.
 */
export const HealthClinicScheduleMove: Story = {
  name: 'Health, clinic schedule, move asked',
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.clinicScheduleMove} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move appointment Jovana Nikolić, check-up',
    })
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'dr Nada Grujić',
    )
    await expect(
      within(dialog).getByRole('checkbox', { name: /Notify Jovana Nikolić by SMS/ }),
    ).toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Save and notify' })).toBeVisible()
  },
}

export const HealthClinicScheduleMovePhone: Story = {
  name: 'Health, clinic schedule, move asked, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={H_ROUTES.clinicScheduleMove} />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: /^Move appointment/ }),
    ).toBeVisible()
  },
}

/** Unchecking the SMS makes the button plain Save; the move is made and nobody is messaged. */
export const HealthClinicScheduleMoveConfirm: Story = {
  name: 'Health, clinic schedule, move, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.clinicScheduleMove} />,
  play: async () => {
    await settle()
    const body = within(document.body)
    const dialog = body.getByRole('dialog', { name: /^Move appointment/ })
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Notify Jovana Nikolić/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await expect(
      await body.findByText('Appointment moved. No message was sent.'),
    ).toBeInTheDocument()
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
  },
}

/**
 * Approving a swap moves shifts two people rely on (P5.28): the change (Saturday's shift from
 * Stefan Lukić to Jelena Rakić, Sunday's back), and each of them told as a choice; Approve last.
 */
export const StoreSwapApprove: Story = {
  name: 'Store, swap requests, approve asked',
  tags: ['!dev'],
  render: () => <ExampleApp start={G_ROUTES.swapRequestApprove} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: /^Approve swap Stefan Lukić/ })
    await expect(within(dialog).getAllByRole('listitem')).toHaveLength(2)
    await expect(
      within(dialog).getByRole('checkbox', { name: 'Notify Jelena Rakić' }),
    ).toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Approve' })).toBeVisible()
  },
}

export const StoreSwapApprovePhone: Story = {
  name: 'Store, swap requests, approve asked, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={G_ROUTES.swapRequestApprove} />,
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('dialog', { name: /^Approve swap/ })).toBeVisible()
  },
}

export const StoreSwapApproveConfirm: Story = {
  name: 'Store, swap requests, approve, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={G_ROUTES.swapRequests} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    const dialog = await within(document.body).findByRole('dialog', { name: /^Approve swap/ })
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Notify Stefan Lukić' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))
    await expect(
      await within(document.body).findByText(
        'Swap of Stefan Lukić approved. Jelena Rakić notified.',
      ),
    ).toBeInTheDocument()
  },
}

/**
 * The excuse asks first (P5.28): Luka's two absences of today chosen, the reason (illness,
 * doctor, family reason, other with words), the doctor's note as a photo or a PDF — on a phone the
 * camera — then Send.
 */
export const SchoolParentExcuse: Story = {
  name: 'School, parents’ portal, excuse',
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.parentExcuse} />,
  play: async () => {
    await settle()
    const drawer = within(document.body).getByRole('dialog', {
      name: /^Excuse absences Luka Jovanović/,
    })
    await expect(within(drawer).getAllByRole('checkbox', { checked: true })).toHaveLength(2)
    await expect(within(drawer).getByRole('radiogroup', { name: /Reason/ })).toBeVisible()
    await expect(within(drawer).getByRole('button', { name: 'Choose a file' })).toBeVisible()
  },
}

export const SchoolParentExcusePhone: Story = {
  name: 'School, parents’ portal, excuse, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={H_ROUTES.parentExcuse} />,
  play: async () => {
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: /^Excuse absences/ })
    await expect(within(drawer).getByRole('button', { name: 'Take a photo' })).toBeVisible()
  },
}

/** Sent: today's absences say "Excuse sent", and the page says it waits for the class teacher. */
export const SchoolParentExcuseSent: Story = {
  name: 'School, parents’ portal, excuse sent',
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.parentExcuseSent} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Excuse sent, waiting for the class teacher')
    await expect(within(canvasElement).getAllByText('Excuse sent')).toHaveLength(2)
  },
}

export const SchoolParentExcuseSentPhone: Story = {
  name: 'School, parents’ portal, excuse sent, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={H_ROUTES.parentExcuseSent} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Excuse sent, waiting for the class teacher')
    await noPageOverflow(canvasElement)
  },
}

// ── P5.28 pos: the till's fiscal flows and the tabs on tables ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { TILL_ROUTES, WEB_ORDER } from './data-I-fiscal'

/** A landscape tablet's screen: 1024 × 768. */
function OnTablet({ start }: { start: string }) {
  return (
    <PhoneFrame width={1024} height={768}>
      <ExampleApp start={start} />
    </PhoneFrame>
  )
}

/** A dialog of the screen by its name. */
function screenDialog(name: string | RegExp) {
  return within(document.body).getByRole('dialog', { name })
}

/** A confirmation of the screen (an alertdialog) by its name. */
function screenConfirm(name: string | RegExp) {
  return within(document.body).getByRole('alertdialog', { name })
}

const TAB_3 = '/cafe/kod-mike/terrace/t3'
const BISTRO_TAB_7 = '/restaurant/bistro-dunav/tables/t7'

/** A static story's checks on the canvas (the desktop's 1280 × 720). */
function deskPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
  }
}

/** The same checks on a phone, and nothing scrolls sideways. */
function phonePlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    await expectNoSidewaysScroll(canvasElement)
  }
}

/**
 * The receipt kind (item 21a): two choices, type and transaction, from the application's data;
 * Proforma chosen shows its marker — never chosen silently.
 */
const FISCAL_KIND_CHECK = async () => {
  const dialog = screenDialog('Receipt kind')
  await expect(within(dialog).getByRole('button', { name: 'Proforma' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(dialog).toHaveTextContent('Proforma — this is not a fiscal receipt')
}

export const FiscalKind: Story = {
  name: 'POS fiscal, receipt kind',
  render: () => <ExampleApp start={TILL_ROUTES.kind} />,
  play: deskPlay(FISCAL_KIND_CHECK),
}

export const FiscalKindPhone: Story = {
  name: 'POS fiscal, receipt kind, phone',
  render: () => <OnPhone start={TILL_ROUTES.kind} />,
  play: phonePlay(FISCAL_KIND_CHECK),
}

/** A proforma in the cart: the kind under the title and the marker above the lines. */
const FISCAL_PROFORMA_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Proforma · Sale')
  await expect(canvasElement.querySelector('[data-slot="cart-marker"]')).toHaveTextContent(
    'Proforma — this is not a fiscal receipt',
  )
}

export const FiscalProforma: Story = {
  name: 'POS fiscal, proforma',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.proforma} />,
  play: deskPlay(FISCAL_PROFORMA_CHECK),
}

export const FiscalProformaPhone: Story = {
  name: 'POS fiscal, proforma, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.proforma} />,
  play: phonePlay(FISCAL_PROFORMA_CHECK),
}

/** Training mode: the persistent banner under the strip, the cart's marker. */
const FISCAL_TRAINING_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement.querySelector('[data-slot="pos-banners"]')).toHaveTextContent(
    'Training mode',
  )
  await expect(canvasElement.querySelector('[data-slot="cart-marker"]')).toHaveTextContent(
    'Training — this is not a fiscal receipt',
  )
}

export const FiscalTraining: Story = {
  name: 'POS fiscal, training mode',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.training} />,
  play: deskPlay(FISCAL_TRAINING_CHECK),
}

export const FiscalTrainingPhone: Story = {
  name: 'POS fiscal, training mode, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.training} />,
  play: phonePlay(FISCAL_TRAINING_CHECK),
}

export const FiscalTrainingTablet: Story = {
  name: 'POS fiscal, training mode, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={TILL_ROUTES.training} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** The buyer (item 21c): the kind of ID (15, searchable), the ID, the optional corporate card. */
const FISCAL_BUYER_CHECK = async () => {
  const dialog = screenDialog('Buyer')
  await expect(within(dialog).getByRole('combobox', { name: 'ID type' })).toBeVisible()
  await expect(within(dialog).getByRole('textbox', { name: 'Buyer ID' })).toHaveValue('100100100')
}

export const FiscalBuyer: Story = {
  name: 'POS fiscal, buyer',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.buyer} />,
  play: deskPlay(FISCAL_BUYER_CHECK),
}

export const FiscalBuyerPhone: Story = {
  name: 'POS fiscal, buyer, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.buyer} />,
  play: phonePlay(FISCAL_BUYER_CHECK),
}

/**
 * Several ways on one receipt (item 21b): a voucher of 500,00 and 1.000,00 by card taken, 407,00
 * remaining, 500,00 cash tendered: the change 93,00 — every figure the application's.
 */
const FISCAL_MIXED_CHECK = async () => {
  const dialog = paymentDialog()
  await expect(dialog).toHaveTextContent('Paid so far')
  await expect(dialog).toHaveTextContent(tillText('407'))
  await expect(dialog).toHaveTextContent(tillText('93'))
  await expect(
    within(within(dialog).getByRole('group', { name: 'Payment method' })).getAllByRole('button'),
  ).toHaveLength(7)
}

export const FiscalMixed: Story = {
  name: 'POS fiscal, several payment methods',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.mixed} />,
  play: deskPlay(FISCAL_MIXED_CHECK),
}

export const FiscalMixedPhone: Story = {
  name: 'POS fiscal, several payment methods, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.mixed} />,
  play: phonePlay(FISCAL_MIXED_CHECK),
}

export const FiscalMixedTablet: Story = {
  name: 'POS fiscal, several payment methods, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={TILL_ROUTES.mixed} />,
  play: async () => {
    await settle()
    await expect(paymentDialog()).toHaveTextContent('Paid so far')
  },
}

/** An instant payment: the code shown large to the customer, waiting. */
const FISCAL_INSTANT_CHECK = async () => {
  await expect(
    within(paymentDialog()).getByRole('img', { name: 'IPS QR code for the payment' }),
  ).toBeVisible()
}

export const FiscalInstant: Story = {
  name: 'POS fiscal, instant payment',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.instant} />,
  play: deskPlay(FISCAL_INSTANT_CHECK),
}

export const FiscalInstantPhone: Story = {
  name: 'POS fiscal, instant payment, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.instant} />,
  play: phonePlay(FISCAL_INSTANT_CHECK),
}

/**
 * The other way of an instant payment (P5.40): the cashier stops showing the till's code and
 * scans the buyer's IPS QR code from their bank's app; the bank asks the buyer to confirm.
 */
export const FiscalInstantBuyerCode: Story = {
  name: 'POS fiscal, instant payment, buyer’s code, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.instant} />,
  play: deskPlay(async () => {
    await FISCAL_INSTANT_CHECK()
    const dialog = within(paymentDialog())
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel this payment' }))
    const scan = await dialog.findByRole('textbox', { name: 'Or scan the buyer’s code' })
    await userEvent.type(scan, 'K:PK|V:01|C:1|R:205000000011122205{Enter}')
    await waitFor(async () => {
      await expect(paymentDialog()).toHaveTextContent(
        'The buyer’s code is read; the bank is asking the buyer to confirm.',
      )
    })
    await expect(dialog.queryByRole('img', { name: 'IPS QR code for the payment' })).toBeNull()
  }),
}

/** A wire transfer (deferred payment) without a buyer: the rule and the buyer's field. */
const FISCAL_DEFERRED_CHECK = async () => {
  const dialog = paymentDialog()
  await expect(dialog).toHaveTextContent('A wire transfer needs the buyer’s tax number.')
  await expect(within(dialog).getByRole('textbox', { name: /Buyer ID/ })).toBeVisible()
}

export const FiscalDeferred: Story = {
  name: 'POS fiscal, deferred payment needs the buyer',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.deferred} />,
  play: deskPlay(FISCAL_DEFERRED_CHECK),
}

export const FiscalDeferredPhone: Story = {
  name: 'POS fiscal, deferred payment needs the buyer, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.deferred} />,
  play: phonePlay(FISCAL_DEFERRED_CHECK),
}

/** A corporate card: the company as the buyer, its card in the optional field, approved. */
export const FiscalCorporate: Story = {
  name: 'POS fiscal, corporate card',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.corporate} />,
  play: async () => {
    await settle()
    const dialog = paymentDialog()
    await expect(dialog).toHaveTextContent('Corporate card •••• 7310')
    await expect(
      within(dialog).getByRole('button', { name: 'Complete payment' }),
    ).not.toHaveAttribute('aria-disabled', 'true')
  },
}

/** The receipt issued (item 21g): processor number and time, counter, code, link, delivery. */
const FISCAL_ISSUED_CHECK = async () => {
  const dialog = paymentDialog()
  await expect(dialog).toHaveTextContent('ZK7Q2M4P-ZK7Q2M4P-2318')
  await expect(dialog).toHaveTextContent('2289/2318ПП')
  await expect(within(dialog).getByRole('img', { name: 'Receipt code' })).toBeVisible()
  await expect(within(dialog).getByRole('button', { name: 'Send by e-mail' })).toBeVisible()
}

export const FiscalIssued: Story = {
  name: 'POS fiscal, receipt issued',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.issued} />,
  play: deskPlay(FISCAL_ISSUED_CHECK),
}

export const FiscalIssuedPhone: Story = {
  name: 'POS fiscal, receipt issued, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.issued} />,
  play: phonePlay(FISCAL_ISSUED_CHECK),
}

export const FiscalIssuedTablet: Story = {
  name: 'POS fiscal, receipt issued, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={TILL_ROUTES.issued} />,
  play: async () => {
    await settle()
    await expect(paymentDialog()).toHaveTextContent('Receipt issued')
  },
}

/** Issued offline (item 21h): a local number, "waiting to be sent", the queue in the strip. */
const FISCAL_ISSUED_OFFLINE_CHECK = async (canvasElement: HTMLElement) => {
  await expect(paymentDialog()).toHaveTextContent('Receipt issued, waiting to be sent')
  await expect(canvasElement).toHaveTextContent('3 sales waiting to be sent')
}

export const FiscalIssuedOffline: Story = {
  name: 'POS fiscal, receipt issued offline',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.issuedOffline} />,
  play: deskPlay(FISCAL_ISSUED_OFFLINE_CHECK),
}

export const FiscalIssuedOfflinePhone: Story = {
  name: 'POS fiscal, receipt issued offline, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.issuedOffline} />,
  play: phonePlay(FISCAL_ISSUED_OFFLINE_CHECK),
}

/** Refund (item 21d): the original found by its total; one refunded already says so. */
const FISCAL_REFUND_FIND_CHECK = async () => {
  const dialog = screenDialog('Refund')
  await expect(
    within(dialog).getByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2315/ }),
  ).toHaveAttribute('aria-pressed', 'true')
}

export const FiscalRefundFind: Story = {
  name: 'POS fiscal, refund, find the receipt',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.refundFind} />,
  play: deskPlay(FISCAL_REFUND_FIND_CHECK),
}

export const FiscalRefundFindPhone: Story = {
  name: 'POS fiscal, refund, find the receipt, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.refundFind} />,
  play: phonePlay(FISCAL_REFUND_FIND_CHECK),
}

export const FiscalRefundFindTablet: Story = {
  name: 'POS fiscal, refund, find the receipt, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={TILL_ROUTES.refundFind} />,
  play: async () => {
    await settle()
    await expect(
      within(screenDialog('Refund')).getByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2315/ }),
    ).toBeVisible()
  },
}

/** Refund: two kifle and a burek of the original (240,00), the buyer named by the rule. */
const FISCAL_REFUND_LINES_CHECK = async () => {
  const dialog = screenDialog(/^Refund from/)
  await expect(within(dialog).getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('2')
  await expect(dialog).toHaveTextContent('1 of 4 refunded already')
  await expect(dialog).toHaveTextContent(tillText('240'))
}

export const FiscalRefundLines: Story = {
  name: 'POS fiscal, refund, lines',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.refundLines} />,
  play: deskPlay(FISCAL_REFUND_LINES_CHECK),
}

export const FiscalRefundLinesPhone: Story = {
  name: 'POS fiscal, refund, lines, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.refundLines} />,
  play: phonePlay(FISCAL_REFUND_LINES_CHECK),
}

/** The refund in the cart: "Pay out 240,00 RSD", the original's number. */
const FISCAL_REFUND_CART_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Normal · Refund')
  await expect(canvasElement).toHaveTextContent('Refund of ZK7Q2M4P-ZK7Q2M4P-2315')
}

export const FiscalRefundCart: Story = {
  name: 'POS fiscal, refund in the cart',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.refundCart} />,
  play: deskPlay(FISCAL_REFUND_CART_CHECK),
}

export const FiscalRefundCartPhone: Story = {
  name: 'POS fiscal, refund in the cart, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.refundCart} />,
  play: phonePlay(FISCAL_REFUND_CART_CHECK),
}

/** The refund's receipt: the original's number and time carried over, the signature line. */
const FISCAL_REFUND_RECEIPT_CHECK = async () => {
  const receipt = within(screenDialog(/^Receipt /)).getByRole('article', { name: 'Receipt' })
  await expect(receipt).toHaveTextContent('NORMAL REFUND')
  await expect(receipt).toHaveTextContent('Original receipt')
  await expect(receipt).toHaveTextContent('Buyer’s signature')
}

export const FiscalRefundReceipt: Story = {
  name: 'POS fiscal, refund receipt',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.refundReceipt} />,
  play: deskPlay(FISCAL_REFUND_RECEIPT_CHECK),
}

export const FiscalRefundReceiptPhone: Story = {
  name: 'POS fiscal, refund receipt, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.refundReceipt} />,
  play: phonePlay(FISCAL_REFUND_RECEIPT_CHECK),
}

/** A buyer's open advances (item 21e): one deducted, 707,00 to pay. */
const FISCAL_ADVANCES_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Open advances of Restoran Dunavski cvet d.o.o.')
  await expect(canvasElement).toHaveTextContent('To pay')
  await expect(canvasElement).toHaveTextContent(tillText('707'))
}

export const FiscalAdvances: Story = {
  name: 'POS fiscal, advances',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.advances} />,
  play: deskPlay(FISCAL_ADVANCES_CHECK),
}

export const FiscalAdvancesPhone: Story = {
  name: 'POS fiscal, advances, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.advances} />,
  play: phonePlay(FISCAL_ADVANCES_CHECK),
}

/** Taking an advance for a cake order: the buyer, the amount, what it is for. */
const FISCAL_ADVANCE_TAKE_CHECK = async () => {
  await expect(screenDialog('Take advance')).toHaveTextContent('12 krempite')
}

export const FiscalAdvanceTake: Story = {
  name: 'POS fiscal, take an advance',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.advanceTake} />,
  play: deskPlay(FISCAL_ADVANCE_TAKE_CHECK),
}

export const FiscalAdvanceTakePhone: Story = {
  name: 'POS fiscal, take an advance, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.advanceTake} />,
  play: phonePlay(FISCAL_ADVANCE_TAKE_CHECK),
}

/** Refunding an advance: the action as the title, the advance bold on its own line. */
export const FiscalAdvanceRefund: Story = {
  name: 'POS fiscal, refund an advance',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.advanceRefund} />,
  play: async () => {
    await settle()
    await expect(screenConfirm('Refund advance')).toHaveTextContent('ZK7Q2M4P-ZK7Q2M4P-2265')
  },
}

/** A sale without compensation: its kind under the title, paid only as Other cashless. */
export const FiscalNoCompensation: Story = {
  name: 'POS fiscal, sale without compensation',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.noCompensation} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Without compensation')
  },
}

/** Two receipts the processor did not accept: a danger "Not sent" in the strip. */
export const FiscalQueueFailed: Story = {
  name: 'POS fiscal, receipts not accepted',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.queueFailed} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Not sent')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('2 receipts were not accepted')
  },
}

/** The journal of the day (item 21g): the receipts with their state, the last one shown. */
const FISCAL_JOURNAL_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('ZK7Q2M4P-ZK7Q2M4P-2317')
}

export const FiscalJournal: Story = {
  name: 'POS journal',
  render: () => <ExampleApp start={TILL_ROUTES.journal} />,
  play: deskPlay(FISCAL_JOURNAL_CHECK),
}

export const FiscalJournalPhone: Story = {
  name: 'POS journal, phone',
  render: () => <OnPhone start={TILL_ROUTES.journal} />,
  play: phonePlay(FISCAL_JOURNAL_CHECK),
}

export const FiscalJournalTablet: Story = {
  name: 'POS journal, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={TILL_ROUTES.journal} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { name: 'Receipts today' }),
    ).toBeVisible()
  },
}

/** A copy: "THIS IS NOT A FISCAL RECEIPT" boxed at the top and the bottom. */
const FISCAL_JOURNAL_COPY_CHECK = async () => {
  const dialog = screenDialog(/^Copy of /)
  await expect(dialog.querySelectorAll('[data-slot="receipt-marker"]')).toHaveLength(2)
  await expect(dialog).toHaveTextContent('COPY SALE')
}

export const FiscalJournalCopy: Story = {
  name: 'POS journal, copy',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.journalCopy} />,
  play: deskPlay(FISCAL_JOURNAL_COPY_CHECK),
}

export const FiscalJournalCopyPhone: Story = {
  name: 'POS journal, copy, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.journalCopy} />,
  play: phonePlay(FISCAL_JOURNAL_COPY_CHECK),
}

/** Cancelling a receipt issued by mistake: the reason asked, the receipt bold on its own line. */
const FISCAL_JOURNAL_CANCEL_CHECK = async () => {
  await expect(screenConfirm('Cancel receipt issued by mistake')).toHaveTextContent(
    'ZK7Q2M4P-ZK7Q2M4P-2317',
  )
}

export const FiscalJournalCancel: Story = {
  name: 'POS journal, cancel a receipt',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.journalCancel} />,
  play: deskPlay(FISCAL_JOURNAL_CANCEL_CHECK),
}

export const FiscalJournalCancelPhone: Story = {
  name: 'POS journal, cancel a receipt, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.journalCancel} />,
  play: phonePlay(FISCAL_JOURNAL_CANCEL_CHECK),
}

/** The receipts not sent (item 21h): the reason and "Send again". */
const FISCAL_JOURNAL_QUEUE_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Two receipts were not accepted')
}

export const FiscalJournalQueue: Story = {
  name: 'POS journal, not sent',
  tags: ['!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.journalQueue} />,
  play: deskPlay(FISCAL_JOURNAL_QUEUE_CHECK),
}

export const FiscalJournalQueuePhone: Story = {
  name: 'POS journal, not sent, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={TILL_ROUTES.journalQueue} />,
  play: phonePlay(FISCAL_JOURNAL_QUEUE_CHECK),
}

/** The daily report: sales, refunds, by way of paying, the tax per label. */
const FISCAL_DAILY_REPORT_CHECK = async () => {
  const dialog = screenDialog('Daily report')
  await expect(dialog).toHaveTextContent('DAILY REPORT')
  await expect(dialog).toHaveTextContent('Refunds (1)')
}

export const FiscalDailyReport: Story = {
  name: 'POS daily report',
  render: () => <ExampleApp start={TILL_ROUTES.dailyReport} />,
  play: deskPlay(FISCAL_DAILY_REPORT_CHECK),
}

export const FiscalDailyReportPhone: Story = {
  name: 'POS daily report, phone',
  render: () => <OnPhone start={TILL_ROUTES.dailyReport} />,
  play: phonePlay(FISCAL_DAILY_REPORT_CHECK),
}

/** An online sale (item 21i): the web-shop order's receipt issued and e-mailed, link and code. */
const WEB_SHOP_ORDER_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent(WEB_ORDER.receipt.number)
  await expect(canvasElement).toHaveTextContent(`Sent to ${WEB_ORDER.email}`)
}

export const WebShopOrder: Story = {
  name: 'Web shop order, receipt delivered',
  render: () => <ExampleApp start={TILL_ROUTES.webOrder} />,
  play: deskPlay(WEB_SHOP_ORDER_CHECK),
}

export const WebShopOrderPhone: Story = {
  name: 'Web shop order, receipt delivered, phone',
  render: () => <OnPhone start={TILL_ROUTES.webOrder} />,
  play: phonePlay(WEB_SHOP_ORDER_CHECK),
}

export const WebShopOrderTablet: Story = {
  name: 'Web shop order, receipt delivered, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={TILL_ROUTES.webOrder} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(WEB_ORDER.receipt.number)
  },
}

/**
 * Several ways on one receipt, end to end: a voucher of 500,00, then 1.000,00 by card (the
 * example's terminal approves), then cash for the remaining 407,00; the receipt is issued.
 */
export const FiscalMixedInteraction: Story = {
  name: 'POS fiscal, several payment methods, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: chargeName(SALE_FIGURES.total) }),
    )
    const dialog = await within(document.body).findByRole('dialog', { name: 'Payment' })
    const body = within(dialog)
    const amount = async (digits: string) => {
      await userEvent.click(body.getByRole('button', { name: 'Clear' }))
      for (const key of digits) await userEvent.click(body.getByRole('button', { name: key }))
    }
    await userEvent.click(body.getByRole('button', { name: 'Voucher' }))
    await amount('500')
    await userEvent.type(body.getByRole('textbox', { name: 'Voucher code' }), 'VC-2026-7741')
    await userEvent.click(body.getByRole('button', { name: 'Add this payment' }))
    await expect(dialog).toHaveTextContent('Paid so far')
    await userEvent.click(body.getByRole('button', { name: 'Card' }))
    await amount('1000')
    await userEvent.click(body.getByRole('button', { name: 'Send to card terminal' }))
    await expect(
      await body.findByText('Card payment approved', {}, { timeout: 4000 }),
    ).toBeVisible()
    await expect(dialog).toHaveTextContent(tillText('407'))
    await userEvent.click(body.getByRole('button', { name: 'Cash' }))
    await userEvent.click(body.getByRole('button', { name: 'Exact amount' }))
    await userEvent.click(body.getByRole('button', { name: 'Complete payment' }))
    await expect(await body.findByText('Receipt issued')).toBeVisible()
    await settle()
  },
}

/** Refund end to end: the menu's Refund…, find by total, two kifle, pay out in cash. */
export const FiscalRefundInteraction: Story = {
  name: 'POS fiscal, refund, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Till menu' }))
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Refund…' }))
    const find = await within(document.body).findByRole('dialog', { name: 'Refund' })
    await userEvent.click(within(find).getByRole('button', { name: 'Search' }))
    await userEvent.click(
      await within(find).findByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2315/ }),
    )
    await userEvent.click(within(find).getByRole('button', { name: 'Choose lines' }))
    const lines = await within(document.body).findByRole('dialog', { name: /^Refund from/ })
    await userEvent.click(within(lines).getByRole('checkbox', { name: /^Jogurt/ }))
    await userEvent.click(within(lines).getByRole('button', { name: /^Refund 135,00/ }))
    await expect(await within(canvasElement).findByText('Normal · Refund')).toBeVisible()
    await userEvent.click(await within(canvasElement).findByRole('button', { name: /^Pay out/ }))
    const pay = await within(document.body).findByRole('dialog', { name: 'Refund payment' })
    await userEvent.click(within(pay).getByRole('button', { name: 'Exact amount' }))
    await userEvent.click(within(pay).getByRole('button', { name: 'Complete payment' }))
    await expect(await within(pay).findByText('Receipt issued')).toBeVisible()
    await settle()
  },
}

/** The journal: a receipt cancelled with a reason becomes a refund in the list. */
export const FiscalCancelInteraction: Story = {
  name: 'POS journal, cancel a receipt, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={TILL_ROUTES.journalCancel} />,
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = screenConfirm('Cancel receipt issued by mistake')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Wrong way of paying' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel receipt' }))
    // The refund that cancels it is issued and shown: the next receipt of the journal.
    await expect(
      await within(canvasElement).findByRole('heading', { name: 'ZK7Q2M4P-ZK7Q2M4P-2318' }),
    ).toBeVisible()
    await settle()
  },
}

// ── P5.28 pos: open tabs on tables (item 22) ──

/** Table 3's tab with two new items not sent yet: "Send order (2)" before the bill. */
const CAFE_TAB_NEW_CHECK = async (canvasElement: HTMLElement) => {
  await expect(
    within(canvasElement).getByRole('button', { name: 'Send order (2)' }),
  ).toBeInTheDocument()
  await expect(canvasElement).toHaveTextContent('Oat milk')
  await expect(canvasElement).toHaveTextContent('Sent to the bar · 18:15')
}

export const CafeTabNew: Story = {
  name: 'Café tab, new items to send',
  render: () => <ExampleApp start={`${TAB_3}?new`} />,
  play: deskPlay(CAFE_TAB_NEW_CHECK),
}

export const CafeTabNewPhone: Story = {
  name: 'Café tab, new items to send, phone',
  render: () => <OnPhone start={`${TAB_3}?new`} />,
  play: phonePlay(CAFE_TAB_NEW_CHECK),
}

/** Editing a line: quantity, a note for the kitchen, a discount from the venue's list. */
const CAFE_TAB_EDIT_CHECK = async () => {
  const dialog = screenDialog('Edit line')
  await expect(within(dialog).getByRole('textbox', { name: /Note/ })).toHaveValue('Without walnuts')
}

export const CafeTabEdit: Story = {
  name: 'Café tab, edit a line',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?edit`} />,
  play: deskPlay(CAFE_TAB_EDIT_CHECK),
}

export const CafeTabEditPhone: Story = {
  name: 'Café tab, edit a line, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={`${TAB_3}?edit`} />,
  play: phonePlay(CAFE_TAB_EDIT_CHECK),
}

/** A discount on the whole order; the promotions apply by themselves. */
export const CafeTabDiscount: Story = {
  name: 'Café tab, discount on the order',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?discount`} />,
  play: async () => {
    await settle()
    await expect(
      within(screenDialog('Discount on the order')).getByRole('radio', {
        name: 'Regular guest −10%',
      }),
    ).toBeChecked()
  },
}

/** Split the bill equally among four: the shares from the application. */
const CAFE_TAB_SPLIT_CHECK = async () => {
  await expect(screenDialog('Split the bill')).toHaveTextContent('Share 4 of 4')
}

export const CafeTabSplit: Story = {
  name: 'Café tab, split the bill',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?split`} />,
  play: deskPlay(CAFE_TAB_SPLIT_CHECK),
}

export const CafeTabSplitPhone: Story = {
  name: 'Café tab, split the bill, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={`${TAB_3}?split`} />,
  play: phonePlay(CAFE_TAB_SPLIT_CHECK),
}

/** Pay part by items: two cappuccinos chosen. */
const CAFE_TAB_PAY_PART_CHECK = async () => {
  const dialog = screenDialog('Pay part')
  await expect(within(dialog).getByRole('textbox', { name: 'Quantity, Kapućino' })).toHaveValue('2')
  await expect(dialog).toHaveTextContent(SERBIAN_K.money('440', 'RSD').replace(/\s+/g, ' '))
}

export const CafeTabPayPart: Story = {
  name: 'Café tab, pay part',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?pay-part`} />,
  play: deskPlay(CAFE_TAB_PAY_PART_CHECK),
}

export const CafeTabPayPartPhone: Story = {
  name: 'Café tab, pay part, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={`${TAB_3}?pay-part`} />,
  play: phonePlay(CAFE_TAB_PAY_PART_CHECK),
}

/** Move the whole tab or some items to another table. */
const CAFE_TAB_MOVE_CHECK = async () => {
  await expect(screenDialog('Move to another table')).toHaveTextContent('Table 3')
}

export const CafeTabMove: Story = {
  name: 'Café tab, move to another table',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?move`} />,
  play: deskPlay(CAFE_TAB_MOVE_CHECK),
}

export const CafeTabMovePhone: Story = {
  name: 'Café tab, move to another table, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={`${TAB_3}?move`} />,
  play: phonePlay(CAFE_TAB_MOVE_CHECK),
}

/** The bill: 1.200,00 RSD, 2.000,00 tendered, the change. */
const CAFE_TAB_BILL_CHECK = async () => {
  await expect(screenDialog(/^Table 3:/)).toHaveTextContent('Change due')
}

export const CafeTabBill: Story = {
  name: 'Café tab, bill',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?bill`} />,
  play: deskPlay(CAFE_TAB_BILL_CHECK),
}

export const CafeTabBillPhone: Story = {
  name: 'Café tab, bill, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={`${TAB_3}?bill`} />,
  play: phonePlay(CAFE_TAB_BILL_CHECK),
}

/** Paid: the fiscal receipt issued, "Close table". */
const CAFE_TAB_CLOSED_CHECK = async () => {
  const dialog = screenDialog(/^Table 3:/)
  await expect(dialog).toHaveTextContent('Receipt issued')
  await expect(within(dialog).getByRole('button', { name: 'Close table' })).toBeVisible()
}

export const CafeTabClosed: Story = {
  name: 'Café tab, closed with the receipt',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${TAB_3}?closed`} />,
  play: deskPlay(CAFE_TAB_CLOSED_CHECK),
}

export const CafeTabClosedPhone: Story = {
  name: 'Café tab, closed with the receipt, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={`${TAB_3}?closed`} />,
  play: phonePlay(CAFE_TAB_CLOSED_CHECK),
}

/** Table 1: a third espresso, the venue's promotion "Espresso 3 for 2". */
export const CafeTabPromotion: Story = {
  name: 'Café tab, promotion 3 for 2',
  tags: ['!dev'],
  render: () => <ExampleApp start="/cafe/kod-mike/terrace/t1" />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Espresso 3 for 2')
  },
}

export const CafeTabTablet: Story = {
  name: 'Café tab, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={`${TAB_3}?new`} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** Bistro Dunav's table 7: food from the kitchen, drinks from the bar, the dessert promotion. */
const RESTAURANT_TAB_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Sent to the kitchen · 19:01')
  await expect(canvasElement).toHaveTextContent('Dessert of the day −15%')
  await expect(canvasElement).toHaveTextContent('One without onion')
}

export const RestaurantTab: Story = {
  name: 'Restaurant tab, table 7',
  render: () => <ExampleApp start={BISTRO_TAB_7} />,
  play: deskPlay(RESTAURANT_TAB_CHECK),
}

export const RestaurantTabPhone: Story = {
  name: 'Restaurant tab, table 7, phone',
  render: () => <OnPhone start={BISTRO_TAB_7} />,
  play: phonePlay(RESTAURANT_TAB_CHECK),
}

export const RestaurantTabTablet: Story = {
  name: 'Restaurant tab, table 7, tablet',
  tags: ['!dev'],
  render: () => <OnTablet start={BISTRO_TAB_7} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expectNoSidewaysScroll(canvasElement)
  },
}

/** A share of three paid by card: Total, Paid and "To pay". */
export const RestaurantTabPaidShare: Story = {
  name: 'Restaurant tab, a share paid',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${BISTRO_TAB_7}?paid-share`} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('To pay')
    await expect(canvasElement).toHaveTextContent('Paid')
  },
}

/**
 * The tab persists: on the terrace, free table 2 gets two espressos; Send order; back to the
 * terrace, table 2 shows its total; back on table 2 the lines are there, sent.
 */
export const CafeTabPersistsInteraction: Story = {
  name: 'Café tab, persists, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.terrace} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(floorItem(canvasElement, 't2'))
    await expect(await canvas.findByRole('heading', { name: 'Table 2' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Espresso/ }))
    await userEvent.click(canvas.getByRole('button', { name: /^Espresso/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Send order (2)' }))
    await expect(await canvas.findByText('Sent to the bar · 18:40')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Terrace' }))
    await expect(await canvas.findByRole('heading', { name: 'Terrace' })).toBeVisible()
    await expect(floorItem(canvasElement, 't2')).toHaveAccessibleName(
      new RegExp(
        `^Table 2, 18:40 · ${SERBIAN_K.money('320', 'RSD').replace(/\./g, '\\.').replace(/\s/g, '\\s')}`,
      ),
    )
    await userEvent.click(floorItem(canvasElement, 't2'))
    await expect(await canvas.findByRole('textbox', { name: 'Quantity, Espresso' })).toHaveValue(
      '2',
    )
  },
}

/** Move the whole tab of table 3 to table 2, bill it in cash, close the table. */
export const CafeTabMoveCloseInteraction: Story = {
  name: 'Café tab, move and close, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={TAB_3} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Move…' }))
    const move = await within(document.body).findByRole('dialog', {
      name: 'Move to another table',
    })
    await userEvent.click(within(move).getByRole('button', { name: 'Move tab' }))
    await expect(await canvas.findByRole('heading', { name: 'Table 2' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Bill / }))
    const pay = await within(document.body).findByRole('dialog', { name: /^Table 2:/ })
    await userEvent.click(within(pay).getByRole('button', { name: 'Exact amount' }))
    await userEvent.click(within(pay).getByRole('button', { name: 'Complete payment' }))
    await userEvent.click(await within(pay).findByRole('button', { name: 'Close table' }))
    await expect(await canvas.findByRole('heading', { name: 'Terrace' })).toBeVisible()
  },
}

/** Bistro Dunav: table 7's tab from the floor, a krempita added, back on the floor its total. */
export const RestaurantTabInteraction: Story = {
  name: 'Restaurant tab, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Tab' }))
    await expect(await canvas.findByRole('heading', { name: 'Table 7' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Krempita/ }))
    await expect(canvas.getByRole('button', { name: 'Send order (3)' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Floor' }))
    await userEvent.click(await waitFor(() => floorItem(canvasElement, 't7')))
    await expect(await canvas.findByRole('button', { name: 'Tab' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent(
      SERBIAN_K.money('9534', 'RSD').replace(/\s+/g, ' '),
    )
  },
}

// ── P5.29 superadmin ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { OPEN_INCIDENT, RESOLVED_INCIDENT } from './data-R'
import { EDITED_ROUTE, R_ROUTES } from './screens-R'

/** Dialogs close with an animation: on a busy machine that takes longer than waitFor's 1s. */
const WAIT = { timeout: 5000 }

/** The phone frame's page never scrolls sideways (P5.28 item 1). */
async function expectPhonePageFits(canvasElement: HTMLElement) {
  for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  }
}

/** The first of the elements found (the top one of a form's two action rows). */
function firstOf(elements: HTMLElement[]): HTMLElement {
  const [first] = elements
  if (first === undefined) throw new Error('Nothing found')
  return first
}

/** A phone story's checks, then nothing scrolls sideways. */
function superadminPhonePlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    await expectPhonePageFits(canvasElement)
  }
}

/**
 * The Superadmin's incidents: every incident across the tenants, the open one first among them —
 * state, severity, the services and how many tenants, when it started and how long it lasted.
 */
const SA_INCIDENTS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(canvasElement).toHaveTextContent('INC-2026-042')
  await expect(canvasElement).toHaveTextContent('SEF submissions delayed')
  await expect(canvasElement).toHaveTextContent('Monitoring')
}

export const SaIncidents: Story = {
  name: 'Superadmin incidents',
  render: () => <ExampleApp start={R_ROUTES.incidents} />,
  play: deskPlay(SA_INCIDENTS_CHECK),
}

export const SaIncidentsPhone: Story = {
  name: 'Superadmin incidents, phone',
  render: () => <OnPhone start={R_ROUTES.incidents} />,
  play: superadminPhonePlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('SEF submissions delayed')
  }),
}

/**
 * The open incident INC-2026-042 (DocumentPage): its stage, severity, start and duration, the
 * status-page message, the timeline of updates with "Not acknowledged" under the latest, the
 * affected tenants and the postmortem to come; people, services and a related incident in the
 * side panels. Acknowledge is the main action while the on-call engineer has not taken it.
 */
const SA_INCIDENT_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: `${OPEN_INCIDENT} · SEF submissions delayed` }),
  ).toBeVisible()
  await expect(canvas.getByRole('list', { name: 'Timeline' })).toHaveTextContent('Not acknowledged')
  await expect(canvasElement).toHaveTextContent('Invoices are taking longer to reach SEF')
  await expect(canvasElement).toHaveTextContent('Written after the incident is resolved.')
}

export const SaIncident: Story = {
  name: 'Superadmin incident',
  render: () => <ExampleApp start={R_ROUTES.incident(OPEN_INCIDENT)} />,
  play: deskPlay(async (canvasElement) => {
    await SA_INCIDENT_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Post update…' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Acknowledge' })).toBeVisible()
  }),
}

/** On a phone the incident is read and acknowledged (the bottom bar); updates need a computer. */
export const SaIncidentPhone: Story = {
  name: 'Superadmin incident, phone',
  render: () => <OnPhone start={R_ROUTES.incident(OPEN_INCIDENT)} />,
  play: superadminPhonePlay(async (canvasElement) => {
    await SA_INCIDENT_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Acknowledge' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Post update…' })).toBeNull()
  }),
}

/** "Post update" asked: the stage, the message and the status page as an explicit choice. */
export const SaIncidentUpdateAsked: Story = {
  name: 'Superadmin incident, post update',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.incidentUpdate} />,
  play: deskPlay(async () => {
    const dialog = screenDialog(/Post update/)
    await expect(within(dialog).getByRole('radio', { name: /Identified/ })).toBeChecked()
    await expect(
      within(dialog).getByRole('checkbox', { name: /Also post it to the status page/ }),
    ).toBeChecked()
  }),
}

/** "Resolve" asked: the incident as the subject, the messages as choices. */
export const SaIncidentResolveAsked: Story = {
  name: 'Superadmin incident, resolve',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.incidentResolve} />,
  play: deskPlay(async () => {
    const dialog = screenConfirm(/Resolve incident/)
    await expect(dialog).toHaveTextContent(`${OPEN_INCIDENT} · SEF submissions delayed`)
    await expect(
      within(dialog).getByRole('checkbox', { name: /Post “Resolved” to the status page/ }),
    ).toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Resolve and notify' })).toBeVisible()
  }),
}

/** A resolved incident with its postmortem (RichText). */
const SA_RESOLVED_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 3, name: 'What we changed' })).toBeVisible()
  await expect(canvas.queryByRole('button', { name: 'Acknowledge' })).toBeNull()
}

export const SaIncidentResolved: Story = {
  name: 'Superadmin incident, resolved with postmortem',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.incident(RESOLVED_INCIDENT)} />,
  play: deskPlay(SA_RESOLVED_CHECK),
}

export const SaIncidentResolvedPhone: Story = {
  name: 'Superadmin incident, resolved with postmortem, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={R_ROUTES.incident(RESOLVED_INCIDENT)} />,
  play: superadminPhonePlay(SA_RESOLVED_CHECK),
}

/**
 * Acknowledge, post an update, resolve with the status page, and the list shows it resolved: the
 * application keeps the incident above its screens.
 */
export const SaIncidentInteraction: Story = {
  name: 'Superadmin incident, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={R_ROUTES.incidents} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('row', { name: /INC-2026-042/ }))
    await settle()
    await userEvent.click(await canvas.findByRole('button', { name: 'Acknowledge' }))
    await waitFor(
      () => expect(canvas.queryByRole('button', { name: 'Acknowledge' })).toBeNull(),
      WAIT,
    )
    const timeline = canvas.getByRole('list', { name: 'Timeline' })
    await expect(timeline).toHaveTextContent('Acknowledged')
    await expect(timeline).not.toHaveTextContent('Not acknowledged')
    await userEvent.click(canvas.getByRole('button', { name: 'Post update…' }))
    const dialog = screenDialog(/Post update/)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Post update' }))
    await expect(dialog).toHaveTextContent('Write what changed.')
    await userEvent.click(within(dialog).getByRole('radio', { name: /Identified/ }))
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Message/ }),
      'SEF confirmed a slowdown on their side.',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Post update' }))
    await waitFor(
      () => expect(within(document.body).queryByRole('dialog', { name: /Post update/ })).toBeNull(),
      WAIT,
    )
    await expect(canvas.getByRole('list', { name: 'Timeline' })).toHaveTextContent(
      'SEF confirmed a slowdown on their side.',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Resolve…' }))
    const confirm = screenConfirm(/Resolve incident/)
    await userEvent.click(within(confirm).getByRole('button', { name: 'Resolve and notify' }))
    await waitFor(() => expect(within(document.body).queryByRole('alertdialog')).toBeNull(), WAIT)
    await expect(canvas.queryByRole('button', { name: 'Resolve…' })).toBeNull()
    await expect(canvasElement).toHaveTextContent('Due by 21.10.2026.')
    await userEvent.click(canvas.getByRole('link', { name: 'Back to Incidents' }))
    await settle()
    await expect(await canvas.findByRole('row', { name: /INC-2026-042/ })).toHaveTextContent(
      'Resolved',
    )
  },
}

/** On a phone: Acknowledge in the bottom bar, then the bar is gone. */
export const SaIncidentPhoneInteraction: Story = {
  name: 'Superadmin incident, phone, interaction',
  tags: ['interaction', '!dev'],
  render: () => <OnPhone start={R_ROUTES.incident(OPEN_INCIDENT)} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Acknowledge' }))
    await waitFor(
      () => expect(canvas.queryByRole('button', { name: 'Acknowledge' })).toBeNull(),
      WAIT,
    )
    await expect(canvas.getByRole('list', { name: 'Timeline' })).toHaveTextContent(
      'Acknowledged; paging stopped.',
    )
  },
}

/**
 * Security events, decided one by one (WorklistPage): the events not closed yet, the most severe
 * first; the first one open with its facts, the action taken so far and its history; Start
 * investigating, then Close… with the action taken.
 */
const SA_SECURITY_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('list', { name: 'Security events' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Failed sign-in burst')
}

export const SaSecurity: Story = {
  name: 'Superadmin security events',
  render: () => <ExampleApp start={R_ROUTES.security} />,
  play: deskPlay(async (canvasElement) => {
    await SA_SECURITY_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Failed sign-in burst' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('203.0.113.24')
    await expect(canvas.getByRole('button', { name: 'Close…' })).toBeVisible()
  }),
}

export const SaSecurityPhone: Story = {
  name: 'Superadmin security events, phone',
  render: () => <OnPhone start={R_ROUTES.security} />,
  play: superadminPhonePlay(SA_SECURITY_CHECK),
}

/** Close asked: the event as the subject, the action taken chosen from the Core's list. */
export const SaSecurityCloseAsked: Story = {
  name: 'Superadmin security events, close',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.securityClose} />,
  play: deskPlay(async () => {
    const dialog = screenConfirm(/Close security event/)
    await expect(dialog).toHaveTextContent('Failed sign-in burst · Pekara Zlatni klas')
    await expect(dialog).toHaveTextContent('Action taken')
  }),
}

/** Start investigating, then close with the action taken: the next event opens in its place. */
export const SaSecurityInteraction: Story = {
  name: 'Superadmin security events, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={R_ROUTES.security} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Start investigating' }))
    await waitFor(
      () => expect(canvas.queryByRole('button', { name: 'Start investigating' })).toBeNull(),
      WAIT,
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Close…' }))
    const dialog = screenConfirm(/Close security event/)
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Address or range blocked' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close event' }))
    await waitFor(
      () => expect(body.queryByRole('alertdialog', { name: /Close security event/ })).toBeNull(),
      WAIT,
    )
    // The closed event leaves the queue; the next most severe one is open.
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Suspicious IP address' }),
    ).toBeVisible()
  },
}

/**
 * The tenants: plan, users, health (with the reason when it is not good) and the last activity.
 * A row opens "View as admin", which asks why first; the row menu also sends an announcement.
 */
const SA_TENANTS_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Kvadrat Gradnja d.o.o.')
  await expect(canvasElement).toHaveTextContent('Degraded')
}

export const SaTenants: Story = {
  name: 'Superadmin tenants',
  render: () => <ExampleApp start={R_ROUTES.tenants} />,
  play: deskPlay(async (canvasElement) => {
    await SA_TENANTS_CHECK(canvasElement)
    await expect(canvasElement).toHaveTextContent('Bank statements not imported since 13.10.2026.')
  }),
}

export const SaTenantsPhone: Story = {
  name: 'Superadmin tenants, phone',
  render: () => <OnPhone start={R_ROUTES.tenants} />,
  play: superadminPhonePlay(SA_TENANTS_CHECK),
}

/** "View as admin" asked: the tenant as the subject, the reason before anything opens. */
export const SaTenantsViewAsAsked: Story = {
  name: 'Superadmin tenants, view as admin',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.tenantsViewAs} />,
  play: deskPlay(async () => {
    const dialog = screenConfirm(/View as admin/)
    await expect(dialog).toHaveTextContent('Kvadrat Gradnja d.o.o.')
    await expect(dialog).toHaveTextContent('recorded in the audit log')
    await expect(within(dialog).getByRole('button', { name: 'View as admin' })).toBeDisabled()
  }),
}

/**
 * The tenant's administration, read-only, behind the audited ImpersonationBar: whose view, the
 * mode, the reason given, that every page is recorded, and "Exit view".
 */
const SA_VIEW_AS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const bar = canvas.getByRole('region', { name: 'Session as another user' })
  await expect(bar).toHaveTextContent('Viewing as Kvadrat Gradnja d.o.o. administrator')
  await expect(bar).toHaveTextContent('Read-only')
  await expect(bar).toHaveTextContent('Reason: Support ticket 4821 — SEF invoice rejected')
  await expect(bar).toHaveTextContent('Every page you open is recorded in the audit log')
  await expect(canvas.getByRole('heading', { level: 1, name: 'Administration' })).toBeVisible()
}

export const SaViewAs: Story = {
  name: 'Superadmin view as tenant admin',
  render: () => <ExampleApp start={R_ROUTES.viewAs('kvadrat')} />,
  play: deskPlay(SA_VIEW_AS_CHECK),
}

export const SaViewAsPhone: Story = {
  name: 'Superadmin view as tenant admin, phone',
  render: () => <OnPhone start={R_ROUTES.viewAs('kvadrat')} />,
  play: superadminPhonePlay(SA_VIEW_AS_CHECK),
}

/** From the tenants: a row, the reason, the view with that reason; Exit view returns. */
export const SaViewAsInteraction: Story = {
  name: 'Superadmin view as tenant admin, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={R_ROUTES.tenants} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('row', { name: /Hotel Fruška/ }))
    const dialog = screenConfirm(/View as admin/)
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Incident' }))
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Ticket or incident number/ }),
      'INC-2026-042',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'View as admin' }))
    await settle()
    const bar = await canvas.findByRole('region', { name: 'Session as another user' })
    await expect(bar).toHaveTextContent('Viewing as Hotel Fruška administrator')
    await expect(bar).toHaveTextContent('Reason: Incident INC-2026-042')
    await userEvent.click(within(bar).getByRole('button', { name: 'Exit view' }))
    await settle()
    await expect(await canvas.findByRole('row', { name: /Hotel Fruška/ })).toBeVisible()
  },
}

/** The announcements: banners and status messages, to all tenants or chosen ones, by state. */
const SA_ANNOUNCEMENTS_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Planned maintenance on 20 October')
  await expect(canvasElement).toHaveTextContent('Scheduled')
}

export const SaAnnouncements: Story = {
  name: 'Superadmin announcements',
  render: () => <ExampleApp start={R_ROUTES.announcements} />,
  play: deskPlay(async (canvasElement) => {
    await SA_ANNOUNCEMENTS_CHECK(canvasElement)
    await expect(
      within(canvasElement).getByRole('button', { name: 'New announcement' }),
    ).toBeVisible()
  }),
}

export const SaAnnouncementsPhone: Story = {
  name: 'Superadmin announcements, phone',
  render: () => <OnPhone start={R_ROUTES.announcements} />,
  play: superadminPhonePlay(SA_ANNOUNCEMENTS_CHECK),
}

/**
 * The editor (RecordFormPage) of a scheduled banner to four chosen tenants: the message, its
 * preview as tenants will see it, the audience as a searchable choice, the start and the end.
 */
const SA_EDITOR_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Fiscal receipts: new rules from 1 November' }),
  ).toBeVisible()
  await expect(canvasElement.querySelector('[data-tone="warning"]')).toHaveTextContent(
    'From 1 November every refund must name the original receipt.',
  )
  await expect(canvasElement).toHaveTextContent('Pekara Zlatni klas')
  await expect(canvasElement).toHaveTextContent('As tenants will see it')
}

export const SaAnnouncementEditor: Story = {
  name: 'Superadmin announcement editor',
  render: () => <ExampleApp start={EDITED_ROUTE} />,
  play: deskPlay(SA_EDITOR_CHECK),
}

export const SaAnnouncementEditorPhone: Story = {
  name: 'Superadmin announcement editor, phone',
  render: () => <OnPhone start={EDITED_ROUTE} />,
  play: superadminPhonePlay(SA_EDITOR_CHECK),
}

/** A live status message: "End now…" beside "Save changes". */
export const SaAnnouncementLive: Story = {
  name: 'Superadmin announcement editor, live',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.announcement('an-6')} />,
  play: deskPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getAllByRole('button', { name: 'End now…' })[0],
    ).toBeVisible()
  }),
}

/** An ended banner: read only, "Duplicate as new". */
export const SaAnnouncementEnded: Story = {
  name: 'Superadmin announcement editor, ended',
  tags: ['!dev'],
  render: () => <ExampleApp start={R_ROUTES.announcement('an-1')} />,
  play: deskPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getAllByRole('button', { name: 'Duplicate as new' })[0],
    ).toBeVisible()
  }),
}

/**
 * A new announcement: Schedule without a message asks for it; then written, started and
 * scheduled, it stands in the list as Scheduled.
 */
export const SaAnnouncementInteraction: Story = {
  name: 'Superadmin announcement editor, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={R_ROUTES.announcements} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'New announcement' }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'New announcement' }),
    ).toBeVisible()
    await userEvent.click(firstOf(canvas.getAllByRole('button', { name: 'Schedule' })))
    await expect(canvasElement).toHaveTextContent('Write the announcement’s title.')
    await userEvent.type(canvas.getByRole('textbox', { name: /Title/ }), 'Holiday support hours')
    await userEvent.type(
      canvas.getByRole('textbox', { name: /Message/ }),
      'Support answers from 9:00 to 13:00 on 11 November.',
    )
    await expect(canvasElement).toHaveTextContent('Holiday support hours')
    const start = canvas.getByRole('textbox', { name: /Starts on/ })
    await userEvent.type(start, '10.11.2026.{Enter}')
    await userEvent.click(firstOf(canvas.getAllByRole('button', { name: 'Schedule' })))
    await settle()
    await expect(
      await canvas.findByRole('row', { name: /Holiday support hours/ }),
    ).toHaveTextContent('Scheduled')
  },
}

// ── P5.29 admin ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { Q_ROUTES } from './data-Q'

/**
 * Kvadrat Gradnja d.o.o.'s administration on 14 October 2026: users and sessions, failed sign-ins
 * today, accounts without two-factor sign-in, licences, and the two integrations with errors.
 */
export const AdminOverviewScreen: Story = {
  name: 'Admin overview',
  render: () => <ExampleApp start={Q_ROUTES.adminOverview} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const failed = canvas.getByText('Failed sign-ins today').closest('[data-slot="stat-card"]')
    await expect(failed).toHaveTextContent('7')
    await expect(canvas.getByText(/^24 of 30/)).toBeVisible()
    const errors = canvas.getByRole('list', { name: 'Integrations with errors' })
    await expect(errors).toHaveTextContent('SEF (e-invoicing)')
    await expect(errors).toHaveTextContent('Banca Intesa, statements')
    await expect(errors).not.toHaveTextContent('Outgoing e-mail')
  },
}

export const AdminOverviewPhone: Story = {
  name: 'Admin overview, phone',
  render: () => <OnPhone start={Q_ROUTES.adminOverview} />,
}

/**
 * Who signed in, when and from where: device, browser, approximate place; the address masked
 * until the administrator says why. Dragan Ilić's account was blocked at 09:35 after three wrong
 * passwords from Amsterdam.
 */
export const AdminSignIns: Story = {
  name: 'Admin sign-in activity',
  render: () => <ExampleApp start={Q_ROUTES.signIns} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Blocked').length).toBeGreaterThan(0)
    await expect(canvas.queryByText('192.0.2.77')).toBeNull()
    await expect(canvas.getAllByRole('button', { name: 'Show IP address' }).length).toBeGreaterThan(
      0,
    )
  },
}

export const AdminSignInsPhone: Story = {
  name: 'Admin sign-in activity, phone',
  render: () => <OnPhone start={Q_ROUTES.signIns} />,
}

/** The saved view "Failed and blocked": only the attempts that did not succeed. */
export const AdminSignInsFailed: Story = {
  name: 'Admin sign-in activity, failed and blocked',
  tags: ['!dev'],
  render: () => <ExampleApp start={Q_ROUTES.signInsFailed} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Sign-in activity' })
    await expect(within(table).queryByText('Success')).toBeNull()
  },
}

/** Showing an address: a reason first (the access is logged), then the address; Hide again. */
export const AdminSignInsAddress: Story = {
  name: 'Admin sign-in activity, address shown, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Q_ROUTES.signIns} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const first = canvas.getAllByRole('button', { name: 'Show IP address' })[0]
    if (first === undefined) throw new Error('No masked address')
    await userEvent.click(first)
    const dialog = await body.findByRole('dialog', { name: /^Show IP address Dragan Ilić/ })
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'Investigating a failed or blocked sign-in' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show' }))
    await expect(await canvas.findByText('192.0.2.77')).toBeVisible()
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Hide IP address' }))
    await expect(canvas.queryByText('192.0.2.77')).toBeNull()
  },
}

/**
 * Who changed what and when: the record, the field, old → new. Filtered and exported; never
 * edited or deleted (no row actions). A click shows the whole entry.
 */
export const AdminAuditLog: Story = {
  name: 'Admin audit log',
  render: () => <ExampleApp start={Q_ROUTES.audit} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = canvas.getByRole('row', { name: /F-2026-0412/ })
    await expect(row).toHaveTextContent('05.10.2026.')
    await expect(row).toHaveTextContent('12.10.2026.')
    await expect(canvas.queryByRole('button', { name: /^Actions/ })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Export' })).toBeVisible()
  },
}

export const AdminAuditLogPhone: Story = {
  name: 'Admin audit log, phone',
  render: () => <OnPhone start={Q_ROUTES.audit} />,
}

/** The view "Access and settings", narrowed to Milica Petrović's changes. */
export const AdminAuditLogFiltered: Story = {
  name: 'Admin audit log, one person’s access changes',
  tags: ['!dev'],
  render: () => <ExampleApp start={Q_ROUTES.auditFiltered} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Audit log' })
    await expect(table).toHaveTextContent('Two-factor sign-in')
    await expect(table).not.toHaveTextContent('Nenad Kovačević')
    await expect(table).not.toHaveTextContent('F-2026-0412')
  },
}

/** A row opens the whole entry, read only: before, after, the address and the request. */
export const AdminAuditLogEntry: Story = {
  name: 'Admin audit log, an entry, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Q_ROUTES.audit} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('row', { name: /F-2026-0412/ }))
    const drawer = await within(document.body).findByRole('dialog', {
      name: /^Invoice: F-2026-0412/,
    })
    await expect(drawer).toHaveTextContent('req_7Q2M4P9W')
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
  },
}

/**
 * Security: two-factor sign-in per user, a user's devices with Sign out, the API keys with
 * Revoke (confirmed), and the password and session policy as the Core stores it.
 */
export const AdminSecurityScreen: Story = {
  name: 'Admin security',
  render: () => <ExampleApp start={Q_ROUTES.security} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Devices of Dragan Ilić' })).toHaveTextContent(
      'Firefox 131 on Linux',
    )
    await expect(canvas.getByRole('table', { name: 'API keys and tokens' })).toHaveTextContent(
      'Revoked',
    )
    await expect(canvas.getByText('5 attempts, for 15 minutes')).toBeVisible()
  },
}

export const AdminSecurityPhone: Story = {
  name: 'Admin security, phone',
  render: () => <OnPhone start={Q_ROUTES.security} />,
}

/** Revoking a key asks first: the action as the title, the key bold under it. */
export const AdminSecurityRevoke: Story = {
  name: 'Admin security, revoke an API key',
  tags: ['!dev'],
  render: () => <ExampleApp start={Q_ROUTES.securityRevoke} />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    await expect(dialog).toHaveTextContent('Reports for the bank (read only)')
    await expect(within(dialog).getByRole('button', { name: 'Revoke key' })).toBeVisible()
  },
}

/** Revoke from the row's menu, confirmed: the key is revoked and stays in the list. */
export const AdminSecurityRevoking: Story = {
  name: 'Admin security, revoking a key, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Q_ROUTES.security} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const table = canvas.getByRole('table', { name: 'API keys and tokens' })
    await userEvent.click(within(table).getByRole('button', { name: /Payroll export to the bank/ }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Revoke' }))
    const dialog = await body.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke key' }))
    await waitFor(async () => {
      await expect(body.queryByRole('alertdialog')).toBeNull()
    })
    await expect(within(table).getByRole('row', { name: /Payroll export/ })).toHaveTextContent(
      'Revoked',
    )
  },
}

/** Each connection with its state, last success, last error and Retry. */
export const AdminIntegrationsScreen: Story = {
  name: 'Admin integrations health',
  render: () => <ExampleApp start={Q_ROUTES.integrations} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Retry: SEF (e-invoicing)' })).toBeVisible()
    await expect(
      canvas.getByText('The service did not answer within 30 seconds (attempt 6 of 10).'),
    ).toBeVisible()
  },
}

export const AdminIntegrationsPhone: Story = {
  name: 'Admin integrations health, phone',
  render: () => <OnPhone start={Q_ROUTES.integrations} />,
}

/** Retry: the button is busy while the application tries; SEF answers and is up again. */
export const AdminIntegrationsRetry: Story = {
  name: 'Admin integrations health, retry, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Q_ROUTES.integrations} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const retry = canvas.getByRole('button', { name: 'Retry: SEF (e-invoicing)' })
    await userEvent.click(retry)
    await expect(retry).toHaveAttribute('aria-busy', 'true')
    await waitFor(async () => {
      await expect(canvas.queryByRole('button', { name: 'Retry: SEF (e-invoicing)' })).toBeNull()
    })
    const sef = canvasElement.querySelector('[data-slot="health-item"][data-kind="up"]')
    await expect(sef).toHaveTextContent('SEF (e-invoicing)')
  },
}

/**
 * The Liro team's system status across every tenant: services, response time and error rate,
 * queues, databases and storage, backups with the restore test, certificates and maintenance.
 */
export const PlatformStatus: Story = {
  name: 'Superadmin system status',
  render: () => <ExampleApp start={Q_ROUTES.systemStatus} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'Response time, last 24 hours' }),
    ).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Services' })).toHaveTextContent(
      'E-invoicing gateway',
    )
    await expect(canvas.getByRole('list', { name: 'Backups' })).toHaveTextContent(
      'Restore test, weekly',
    )
    await expect(canvas.getByRole('table', { name: 'Certificates' })).toHaveTextContent(
      'Expires soon',
    )
  },
}

export const PlatformStatusPhone: Story = {
  name: 'Superadmin system status, phone',
  render: () => <OnPhone start={Q_ROUTES.systemStatus} />,
}

/** While the monitoring answers: skeletons for the numbers, charts, lists and tables. */
export const PlatformStatusLoading: Story = {
  name: 'Superadmin system status, loading',
  tags: ['!dev'],
  render: () => <ExampleApp start={Q_ROUTES.systemStatusLoading} />,
}

/** Regions and nodes with their health, latency and alerts. */
export const PlatformNetwork: Story = {
  name: 'Superadmin network and infrastructure',
  render: () => <ExampleApp start={Q_ROUTES.network} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Regions' })).toHaveTextContent('Belgrade')
    await expect(canvas.getByRole('table', { name: 'Nodes' })).toHaveTextContent('stor-beg-3')
    await expect(canvas.getByRole('table', { name: 'Open alerts' })).toHaveTextContent(
      'Disk latency above 200 ms',
    )
  },
}

export const PlatformNetworkPhone: Story = {
  name: 'Superadmin network and infrastructure, phone',
  render: () => <OnPhone start={Q_ROUTES.network} />,
}

/** Acknowledging an alert from its row's menu: the operator's name in "Acknowledged by". */
export const PlatformNetworkAcknowledge: Story = {
  name: 'Superadmin network and infrastructure, acknowledge an alert, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Q_ROUTES.network} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Open alerts' })
    await userEvent.click(within(table).getByRole('button', { name: /worker-fra-1/ }))
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: 'Acknowledge' }),
    )
    await expect(within(table).getByRole('row', { name: /worker-fra-1/ })).toHaveTextContent(
      'Vuk Stojanović',
    )
  },
}

// ── P5.29 agent ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { S_ROUTES } from './data-S'

/** Waits until the reply composer's editor has replaced its first drawing. */
async function composerReady(canvasElement: HTMLElement) {
  await waitFor(async () => {
    await expect(
      canvasElement.querySelector('[data-slot="reply-composer"] .ProseMirror'),
    ).not.toBeNull()
  })
  await settle()
}

/**
 * Liro support's inbox, seen by Nikola Ilić (E-invoicing) on 14.10.2026 at 09:40: "My open",
 * the tickets ordered by their service level — the first response and the resolution, overdue in
 * the danger tone and in words. Views Unassigned, Overdue and All with their counts; ArrowDown and
 * ArrowUp move between rows, Enter opens a ticket; checked rows are assigned or set together.
 */
export const HelpdeskInbox: Story = {
  name: 'Helpdesk inbox',
  render: () => <ExampleApp start={S_ROUTES.inbox} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^My open/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const table = canvas.getByRole('table', { name: 'Tickets' })
    await expect(within(table).getByText('SEF invoice rejected')).toBeVisible()
    await expect(within(table).getAllByText(/^Overdue by /).length).toBeGreaterThan(0)
  },
}

export const HelpdeskInboxPhone: Story = {
  name: 'Helpdesk inbox, phone',
  render: () => <OnPhone start={S_ROUTES.inbox} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('SEF invoice rejected')).toBeVisible()
  },
}

/** The Overdue view: every ticket whose first response or resolution is late. */
export const HelpdeskInboxOverdue: Story = {
  name: 'Helpdesk inbox, overdue',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.overdue} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Tickets' })
    await expect(within(table).getByText('Bank statement import stopped')).toBeVisible()
    await expect(within(table).getByText('SEF invoice rejected')).toBeVisible()
  },
}

/** The Unassigned view. */
export const HelpdeskInboxUnassigned: Story = {
  name: 'Helpdesk inbox, unassigned',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.unassigned} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Tickets' })
    await expect(within(table).getAllByText('Unassigned').length).toBe(5)
  },
}

/** All tickets, three checked: the bulk bar with "Change status…" and "Assign…". */
export const HelpdeskInboxSelected: Story = {
  name: 'Helpdesk inbox, three checked',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.selected} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Assign…' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Change status…' })).toBeVisible()
  },
}

/** "Assign…" asked for the three checked tickets. */
export const HelpdeskInboxAssign: Story = {
  name: 'Helpdesk inbox, assign three',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.assign} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Assign 3 tickets?' }),
    ).toBeVisible()
    await expect(canvasElement).toBeInTheDocument()
  },
}

/** The keyboard: the first row, ArrowDown to the next, Enter opens that ticket. */
export const HelpdeskInboxKeyboard: Story = {
  name: 'Helpdesk inbox, keyboard, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={S_ROUTES.inbox} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Tickets' })
    const rows = within(table)
      .getAllByRole('row')
      .filter((row) => row.hasAttribute('data-pressable'))
    const [first, second] = rows
    if (first === undefined || second === undefined) throw new Error('Two rows expected')
    first.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(second).toHaveFocus()
    const subject = second.querySelector('.font-medium')?.textContent ?? ''
    await userEvent.keyboard('{Enter}')
    await expect(await canvas.findByRole('heading', { level: 1, name: subject })).toBeVisible()
  },
}

/** Two tickets checked and assigned to Ana Kovač; the inbox says so. */
export const HelpdeskInboxBulkAssign: Story = {
  name: 'Helpdesk inbox, bulk assign, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={S_ROUTES.unassigned} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const boxes = canvas.getAllByRole('checkbox', { name: /^Select #/ })
    for (const box of boxes.slice(0, 2)) await userEvent.click(box)
    await userEvent.click(canvas.getByRole('button', { name: 'Assign…' }))
    const dialog = await within(document.body).findByRole('dialog', { name: 'Assign 2 tickets?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Assign' }))
    await waitFor(async () => {
      await expect(
        within(document.body).getByText('2 tickets assigned to Ana Kovač.'),
      ).toBeVisible()
    })
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /^Unassigned/ })).toHaveTextContent('3')
    })
  },
}

/**
 * Ticket #4821 "SEF invoice rejected": Milica Petrović's message with the rejection notice,
 * Nikola's internal note asking Ana Kovač and her answer — both marked "Internal" — and Nikola's
 * reply started in the composer (saved replies, files, "Insert article"). Beside it the
 * properties, changed in place, the service levels (the first response overdue since 09:10), the contact and
 * company with their other tickets, and the activity.
 */
export const HelpdeskTicket: Story = {
  name: 'Helpdesk ticket',
  render: () => <ExampleApp start={S_ROUTES.ticket('4821')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'SEF invoice rejected',
    )
    const log = canvas.getByRole('log')
    await expect(within(log).getAllByText('Internal')).toHaveLength(2)
    await expect(canvas.getByRole('textbox', { name: 'Reply' })).toHaveTextContent('Dear Milica,')
    await expect(canvas.getByRole('combobox', { name: 'Priority' })).toBeVisible()
  },
}

export const HelpdeskTicketPhone: Story = {
  name: 'Helpdesk ticket, phone',
  render: () => <OnPhone start={S_ROUTES.ticket('4821')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Details' })).toBeVisible()
    await expect(canvas.queryByRole('combobox', { name: 'Priority' })).toBeNull()
  },
}

/** The composer in the internal-note mode. */
export const HelpdeskTicketNote: Story = {
  name: 'Helpdesk ticket, internal note',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticketNote} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    await expect(
      within(canvasElement).getByText('Only your team sees internal notes.'),
    ).toBeVisible()
  },
}

/** "Insert article" asked: the knowledge base in a LookupDialog. */
export const HelpdeskTicketArticle: Story = {
  name: 'Helpdesk ticket, insert article',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticketArticle} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const dialog = within(document.body).getByRole('dialog', { name: 'Knowledge base' })
    await expect(within(dialog).getByText('Why was my SEF invoice rejected?')).toBeVisible()
  },
}

/** On a phone, "Details" opens the side panels in a sheet. */
export const HelpdeskTicketDetailsPhone: Story = {
  name: 'Helpdesk ticket, details, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={S_ROUTES.ticketDetails} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const sheet = within(document.body).getByRole('dialog', { name: /^Details/ })
    await expect(within(sheet).getByRole('combobox', { name: 'Status' })).toBeVisible()
  },
}

/** #4823, paused while the customer sends the bank's specification. */
export const HelpdeskTicketPaused: Story = {
  name: 'Helpdesk ticket, paused',
  tags: ['!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticket('4823')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    await expect(within(canvasElement).getAllByText('Paused').length).toBeGreaterThan(0)
  },
}

/** A reply sent: it joins the conversation, the ticket is Replied and its first response met. */
export const HelpdeskTicketReply: Story = {
  name: 'Helpdesk ticket, reply, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticket('4821')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Saved replies/ }))
    const list = await within(document.body).findByRole('listbox', { name: 'Saved replies' })
    await userEvent.click(
      within(list).getByRole('option', { name: 'SEF rejected: the buyer’s tax number' }),
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }))
    await waitFor(async () => {
      await expect(within(document.body).getByText('Reply sent to Milica Petrović.')).toBeVisible()
    })
    await expect(canvas.getByRole('log')).toHaveTextContent(
      'Send the corrected invoice to SEF again.',
    )
    await expect(canvas.getAllByText('Replied').length).toBeGreaterThan(0)
    await expect(canvas.getByText(/^Missed by /)).toBeVisible()
  },
}

/**
 * A saved reply with merge fields (P5.31): it goes in with this ticket's values — the contact's
 * first name, the ticket, the day it was reported — and today and "in three days" computed from
 * the provider's day; nothing is left to fill in.
 */
export const HelpdeskTicketSavedReplyValues: Story = {
  name: 'Helpdesk ticket, saved reply with values, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticket('4821')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const canvas = within(canvasElement)
    const reply = canvas.getByRole('textbox', { name: 'Reply' })
    await userEvent.click(reply)
    await userEvent.keyboard('{Control>}a{/Control}{Backspace}')
    await userEvent.click(canvas.getByRole('button', { name: /Saved replies/ }))
    const list = await within(document.body).findByRole('listbox', { name: 'Saved replies' })
    await userEvent.click(within(list).getByRole('option', { name: 'After a phone call' }))
    await waitFor(async () => {
      await expect(reply).toHaveTextContent('Dear Milica,')
    })
    await expect(reply).toHaveTextContent(/about ticket .4821, reported on 14\.10\.2026\./)
    await expect(reply).toHaveTextContent(
      'today, 14.10.2026., and will write to you by 17.10.2026.',
    )
    await expect(reply).toHaveTextContent('Nikola Ilić')
    await expect(reply.querySelector('[data-merge-field]')).toBeNull()
  },
}

/** "Insert article": the knowledge base, an article chosen, its link in the reply. */
export const HelpdeskTicketInsertArticle: Story = {
  name: 'Helpdesk ticket, insert article, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticket('4821')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Insert article' }))
    const dialog = await within(document.body).findByRole('dialog', { name: 'Knowledge base' })
    await userEvent.click(within(dialog).getByRole('row', { name: /Update a buyer’s tax number/ }))
    const reply = canvas.getByRole('textbox', { name: 'Reply' })
    await expect(
      await within(reply).findByRole('link', { name: 'Update a buyer’s tax number' }),
    ).toHaveAttribute('href', 'https://support.example.com/kb/buyer-tax-number')
  },
}

/** A property changed in place: the priority, and the activity log says so. */
export const HelpdeskTicketPriority: Story = {
  name: 'Helpdesk ticket, priority changed, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={S_ROUTES.ticket('4821')} />,
  play: async ({ canvasElement }) => {
    await composerReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Priority' }))
    await userEvent.click(await within(document.body).findByRole('option', { name: 'Urgent' }))
    // The list closes first; the field is in the accessibility tree again after it.
    await waitFor(async () => {
      await expect(canvas.getByRole('combobox', { name: 'Priority' })).toHaveTextContent('Urgent')
    })
    await expect(canvasElement).toHaveTextContent('Priority: High → Urgent')
  },
}

/**
 * Liro support's overview: open, unassigned and overdue tickets (the same figures as the inbox's
 * views), the median first response and resolution, satisfaction; tickets opened and resolved,
 * the first response by day, open tickets by team, the ratings and the overdue tickets.
 */
export const HelpdeskOverview: Story = {
  name: 'Helpdesk overview',
  render: () => <ExampleApp start={S_ROUTES.dashboard} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Support overview')
    await expect(canvas.getByText('1 h 12 min')).toBeVisible()
    await expect(canvas.getByRole('table', { name: 'Overdue tickets' })).toBeVisible()
  },
}

export const HelpdeskOverviewPhone: Story = {
  name: 'Helpdesk overview, phone',
  render: () => <OnPhone start={S_ROUTES.dashboard} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Support overview')).toBeVisible()
  },
}

// ── P5.29 portal ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { T_ROUTES } from './screens-T'

/** Every check of a portal story also holds on a phone: nothing scrolls sideways. */
async function expectPortalFits(canvasElement: HTMLElement) {
  for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  }
}

/** A portal story's checks on the desktop, and the same on a phone. */
function portalPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) await expectPortalFits(canvasElement)
  }
}

/**
 * The support portal's home (PortalShell, Milica Petrović of Kvadrat Gradnja d.o.o., 14.10.2026):
 * the search, her four tickets that are not closed — 4821 "SEF invoice rejected" open, 4807
 * waiting for her answer, 4796 resolved and asking for a rating — and the knowledge base's five
 * categories with their counts.
 */
const PORTAL_HOME_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'How can we help, Milica?' }),
  ).toBeVisible()
  await expect(canvas.getByRole('link', { name: 'SEF invoice rejected' })).toBeVisible()
  await expect(canvas.getByRole('link', { name: 'E-invoicing' })).toHaveAccessibleDescription(
    /^5 articles/,
  )
}

export const SupportPortalHome: Story = {
  name: 'Support portal',
  render: () => <ExampleApp start={T_ROUTES.home} />,
  play: portalPlay(PORTAL_HOME_CHECK),
}

export const SupportPortalHomePhone: Story = {
  name: 'Support portal, phone',
  render: () => <OnPhone start={T_ROUTES.home} />,
  play: portalPlay(PORTAL_HOME_CHECK, true),
}

/**
 * A new ticket half written ("SEF rejected our invoice"): the application proposed three
 * articles — "Why was my SEF invoice rejected?" first — beside the form; Submit stays usable.
 */
const NEW_TICKET_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { name: 'These articles may help' })).toBeVisible()
  await expect(canvas.getByRole('link', { name: 'Why was my SEF invoice rejected?' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Submit ticket' })).toBeEnabled()
  await expect(canvasElement).toHaveTextContent('Problem')
}

export const SupportPortalNewTicket: Story = {
  name: 'Support portal, new ticket',
  render: () => <ExampleApp start={T_ROUTES.newTicketDraft} />,
  play: portalPlay(NEW_TICKET_CHECK),
}

export const SupportPortalNewTicketPhone: Story = {
  name: 'Support portal, new ticket, phone',
  render: () => <OnPhone start={T_ROUTES.newTicketDraft} />,
  play: portalPlay(NEW_TICKET_CHECK, true),
}

/** The empty form: nothing proposed yet. */
export const SupportPortalNewTicketEmpty: Story = {
  name: 'Support portal, new ticket, empty',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.newTicket} />,
  play: portalPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).queryByRole('heading', { name: 'These articles may help' }),
    ).toBeNull()
  }),
}

/**
 * Submitting: Submit with nothing names the missing fields; the subject brings the articles
 * (the application's search after 300ms); Submit opens the new ticket 4824 with the message.
 */
export const SupportPortalSubmitInteraction: Story = {
  name: 'Support portal, submit a ticket, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={T_ROUTES.newTicket} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Submit ticket' }))
    await expect(canvasElement).toHaveTextContent('Choose what kind of help you need.')
    await expect(canvasElement).toHaveTextContent('Write a subject.')
    await userEvent.click(canvas.getByRole('radio', { name: /^Access/ }))
    await userEvent.type(canvas.getByRole('textbox', { name: /^Subject/ }), 'Reset two-factor')
    await expect(
      await canvas.findByRole('link', { name: 'Reset two-factor sign-in' }),
    ).toBeVisible()
    await userEvent.type(
      canvas.getByRole('textbox', { name: /^Description/ }),
      'I lost my phone and have no recovery codes.',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Submit ticket' }))
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Reset two-factor' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('I lost my phone and have no recovery codes.')
  },
}

/** My tickets: six, the latest change first, each status in words and tone. */
const MY_TICKETS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'My tickets' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Waiting for your answer')
  await expect(canvas.getAllByText('SEF invoice rejected')[0]).toBeVisible()
}

export const SupportPortalMyTickets: Story = {
  name: 'Support portal, my tickets',
  render: () => <ExampleApp start={T_ROUTES.tickets} />,
  play: portalPlay(MY_TICKETS_CHECK),
}

export const SupportPortalMyTicketsPhone: Story = {
  name: 'Support portal, my tickets, phone',
  render: () => <OnPhone start={T_ROUTES.tickets} />,
  play: portalPlay(MY_TICKETS_CHECK, true),
}

/**
 * Ticket 4807, waiting for Milica's answer: her question, Ana Kovač's two replies and her file,
 * the reply field at the bottom. The agents' internal notes are not in what the portal gets.
 */
const TICKET_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', {
      level: 1,
      name: 'Bank statement import shows the wrong value dates',
    }),
  ).toBeVisible()
  await expect(canvas.getByRole('log')).toHaveTextContent('Ana Kovač')
  await expect(canvas.getByRole('textbox', { name: 'Reply' })).toBeVisible()
}

export const SupportPortalTicket: Story = {
  name: 'Support portal, ticket',
  render: () => <ExampleApp start={T_ROUTES.ticket('4807')} />,
  play: portalPlay(TICKET_CHECK),
}

export const SupportPortalTicketPhone: Story = {
  name: 'Support portal, ticket, phone',
  render: () => <OnPhone start={T_ROUTES.ticket('4807')} />,
  play: portalPlay(TICKET_CHECK, true),
}

/** Ticket 4821, "SEF invoice rejected": Milica's message and its two files, no answer yet. */
export const SupportPortalTicketOpen: Story = {
  name: 'Support portal, ticket, open',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.ticket('4821')} />,
  play: portalPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByRole('log')).toHaveTextContent('sef-rejection.png')
  }),
}

/** A closed ticket: the reply field disabled with its reason. */
export const SupportPortalTicketClosed: Story = {
  name: 'Support portal, ticket, closed',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.ticket('4772')} />,
  play: portalPlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('This ticket is closed.')
  }),
}

/** A reply: it joins the conversation as Milica's own, and the ticket is open again. */
export const SupportPortalReplyInteraction: Story = {
  name: 'Support portal, reply, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={T_ROUTES.ticket('4807')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Reply' }),
      'I imported it again; the dates match now.{Enter}',
    )
    await expect(canvas.getByRole('log')).toHaveTextContent('the dates match now')
    await expect(canvas.getAllByText('Open').length).toBeGreaterThan(0)
  },
}

/**
 * Ticket 4796, resolved by Ana Kovač: "Rate the help you got" — five steps with words, an
 * optional comment and Send — above the conversation.
 */
const RATING_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const group = canvas.getByRole('radiogroup', {
    name: 'How satisfied are you with how we solved this ticket?',
  })
  await expect(within(group).getAllByRole('radio')).toHaveLength(5)
  const rating = canvasElement.querySelector<HTMLElement>('[data-slot="satisfaction-rating"]')
  await expect(within(rating ?? canvasElement).getByRole('button', { name: 'Send' })).toBeVisible()
}

export const SupportPortalRating: Story = {
  name: 'Support portal, rating',
  render: () => <ExampleApp start={T_ROUTES.ticket('4796')} />,
  play: portalPlay(RATING_CHECK),
}

export const SupportPortalRatingPhone: Story = {
  name: 'Support portal, rating, phone',
  render: () => <OnPhone start={T_ROUTES.ticket('4796')} />,
  play: portalPlay(RATING_CHECK, true),
}

/** The rating sent: the thanks and the answer in words. */
export const SupportPortalRatingSent: Story = {
  name: 'Support portal, rating sent',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.rated} />,
  play: portalPlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('Your answer: 4, Satisfied')
  }),
}

/** Rating: a step, the arrows to the last, a comment and Send. */
export const SupportPortalRatingInteraction: Story = {
  name: 'Support portal, rating, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={T_ROUTES.ticket('4796')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: '1 Very dissatisfied' }))
    // The group moves the focus a moment after each key, so each step is awaited.
    for (const name of ['2 Dissatisfied', '3 Neither', '4 Satisfied', '5 Very satisfied']) {
      // Held down until the step is chosen: the group chooses on the focus the key moved.
      await userEvent.keyboard('{ArrowDown>}')
      await waitFor(() => expect(canvas.getByRole('radio', { name })).toBeChecked())
      await userEvent.keyboard('{/ArrowDown}')
    }
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Comment (optional)' }),
      'Quick and clear.',
    )
    const rating = canvasElement.querySelector<HTMLElement>('[data-slot="satisfaction-rating"]')
    await userEvent.click(within(rating ?? canvasElement).getByRole('button', { name: 'Send' }))
    await expect(canvasElement).toHaveTextContent('Your answer: 5, Very satisfied')
  },
}

/** The knowledge base: search, five categories with their counts, the most read articles. */
const KB_HOME_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Knowledge base' })).toBeVisible()
  await expect(
    within(canvas.getByRole('list', { name: 'Categories' })).getAllByRole('link'),
  ).toHaveLength(5)
}

export const KnowledgeBase: Story = {
  name: 'Knowledge base',
  render: () => <ExampleApp start={T_ROUTES.kb} />,
  play: portalPlay(KB_HOME_CHECK),
}

export const KnowledgeBasePhone: Story = {
  name: 'Knowledge base, phone',
  render: () => <OnPhone start={T_ROUTES.kb} />,
  play: portalPlay(KB_HOME_CHECK, true),
}

/** E-invoicing's five articles, each with its summary and date. */
const KB_CATEGORY_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'E-invoicing' })).toBeVisible()
  await expect(
    canvas.getByRole('link', { name: 'Connect Liro to SEF with an API key' }),
  ).toBeVisible()
}

export const KnowledgeBaseCategory: Story = {
  name: 'Knowledge base, category',
  render: () => <ExampleApp start={T_ROUTES.kbCategory('e-invoicing')} />,
  play: portalPlay(KB_CATEGORY_CHECK),
}

export const KnowledgeBaseCategoryPhone: Story = {
  name: 'Knowledge base, category, phone',
  render: () => <OnPhone start={T_ROUTES.kbCategory('e-invoicing')} />,
  play: portalPlay(KB_CATEGORY_CHECK, true),
}

/**
 * "Why was my SEF invoice rejected?": a calm reading column, the contents at the start (on
 * phones a disclosure above the text), "Was this helpful?" and the related articles.
 */
const KB_ARTICLE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Why was my SEF invoice rejected?' }),
  ).toBeVisible()
  await expect(canvas.getByRole('navigation', { name: 'On this page' })).toBeVisible()
  await expect(canvas.getByRole('group', { name: 'Was this helpful?' })).toBeVisible()
  await expect(canvas.getByRole('heading', { name: 'Related articles' })).toBeVisible()
}

export const KnowledgeBaseArticle: Story = {
  name: 'Knowledge base, article',
  render: () => <ExampleApp start={T_ROUTES.kbArticle('sef-rejected')} />,
  play: portalPlay(KB_ARTICLE_CHECK),
}

export const KnowledgeBaseArticlePhone: Story = {
  name: 'Knowledge base, article, phone',
  render: () => <OnPhone start={T_ROUTES.kbArticle('sef-rejected')} />,
  play: portalPlay(KB_ARTICLE_CHECK, true),
}

/** "Was this helpful?" No, what was missing, Send: the thanks. */
export const KnowledgeBaseHelpfulInteraction: Story = {
  name: 'Knowledge base, was this helpful, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={T_ROUTES.kbArticle('sef-rejected')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'No' }))
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'What was missing?' }),
      'A buyer from abroad.',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }))
    await expect(canvasElement).toHaveTextContent('Thank you. Your comment was sent.')
  },
}

/** "rejected": two articles, the matches marked in the titles and the snippets. */
const KB_SEARCH_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('searchbox', { name: /^Search words/ })).toHaveValue('rejected')
  await expect(canvasElement).toHaveTextContent('2 articles for “rejected”')
  await expect(canvas.getByRole('link', { name: 'Why was my SEF invoice rejected?' })).toBeVisible()
  await expect(canvasElement.querySelectorAll('mark').length).toBeGreaterThan(2)
}

export const KnowledgeBaseSearch: Story = {
  name: 'Knowledge base, search',
  render: () => <ExampleApp start={T_ROUTES.kbSearchRejected} />,
  play: portalPlay(KB_SEARCH_CHECK),
}

export const KnowledgeBaseSearchPhone: Story = {
  name: 'Knowledge base, search, phone',
  render: () => <OnPhone start={T_ROUTES.kbSearchRejected} />,
  play: portalPlay(KB_SEARCH_CHECK, true),
}

/** Nothing found: "Submit a ticket" from the empty state. */
export const KnowledgeBaseSearchNothing: Story = {
  name: 'Knowledge base, search without results',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.kbSearchNothing} />,
  play: portalPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Submit a ticket' }),
    ).toBeVisible()
  }),
}

/** From the home page: the query goes to the search; typing changes the results. */
export const KnowledgeBaseSearchInteraction: Story = {
  name: 'Knowledge base, search, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={T_ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search the knowledge base' }),
      'payroll{Enter}',
    )
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Search the knowledge base' }),
    ).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Export payroll to your bank' })).toBeVisible()
    const field = canvas.getByRole('searchbox', { name: /^Search words/ })
    await userEvent.clear(field)
    await userEvent.type(field, 'two-factor')
    await expect(
      await canvas.findByRole('link', { name: 'Reset two-factor sign-in' }),
    ).toBeVisible()
  },
}

/**
 * The knowledge base for agents: the same pages inside the agents' AppShell (Nikola Ilić, Liro
 * support), each article with its author and how helpful readers found it.
 */
const AGENT_KB_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Knowledge base' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('by Nikola Ilić')
}

export const KnowledgeBaseAgents: Story = {
  name: 'Knowledge base for agents',
  render: () => <ExampleApp start={T_ROUTES.agentKb} />,
  play: portalPlay(AGENT_KB_CHECK),
}

export const KnowledgeBaseAgentsPhone: Story = {
  name: 'Knowledge base for agents, phone',
  render: () => <OnPhone start={T_ROUTES.agentKb} />,
  play: portalPlay(AGENT_KB_CHECK, true),
}

/** An article for agents: "Copy link" in the header. */
export const KnowledgeBaseAgentsArticle: Story = {
  name: 'Knowledge base for agents, article',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.agentArticle('reset-2fa')} />,
  play: portalPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Copy link' })).toBeVisible()
  }),
}

export const KnowledgeBaseAgentsArticlePhone: Story = {
  name: 'Knowledge base for agents, article, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={T_ROUTES.agentArticle('reset-2fa')} />,
  play: portalPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Copy link' })).toBeVisible()
  }, true),
}

/** The agents' search: "two-factor". */
export const KnowledgeBaseAgentsSearch: Story = {
  name: 'Knowledge base for agents, search',
  tags: ['!dev'],
  render: () => <ExampleApp start={T_ROUTES.agentSearch} />,
  play: portalPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByRole('link', { name: 'Reset two-factor sign-in' }),
    ).toBeVisible()
  }),
}

// ── P5.37 gantt ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { ganttReady } from '../../../../packages/ui/src/gantt/gantt-story-data'
import { AA_ROUTES } from './data-AA'

/**
 * Kvadrat Gradnja's "Residential building Liman 4" on 14.10.2026 (P5.37): the figures, then the
 * plan — nine phases with their tasks and milestones, each phase's budget and what was spent
 * beside the timeline, today's marker, Floors 3–4 at risk. Every row has its Change menu.
 */
const PROJECT_TIMELINE_CHECK = async (canvasElement: HTMLElement) => {
  await ganttReady(canvasElement)
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Residential building Liman 4' }),
  ).toBeVisible()
  await expect(canvasElement).toHaveTextContent('249.000.000,00')
}

export const ProjectTimeline: Story = {
  name: 'Project timeline',
  render: () => <ExampleApp start={AA_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await PROJECT_TIMELINE_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('rowheader', { name: /^Task: Floors 3–4, in Structure, .*At risk/ }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Change Floors 3–4' })).toBeVisible()
    await expect(
      canvas.getByRole('img', { name: /^Now, 14\.10\.2026\. 09:40$/ }),
    ).toBeInTheDocument()
  },
}

export const ProjectTimelinePhone: Story = {
  name: 'Project timeline, phone',
  render: () => <OnPhone start={AA_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await PROJECT_TIMELINE_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Structure' })).toBeVisible()
    await expect(canvas.getByText('Open this plan on a larger screen to change it.')).toBeVisible()
  },
}

/** A column a day: today in view, the fourth floor's slab at risk. */
export const ProjectTimelineDays: Story = {
  name: 'Project timeline, days',
  tags: ['!dev'],
  render: () => <ExampleApp start={AA_ROUTES.days} />,
  play: async ({ canvasElement }) => {
    await PROJECT_TIMELINE_CHECK(canvasElement)
  },
}

/** Move… open on Floors 3–4, as the application restores it: the action, the task bold. */
export const ProjectTimelineMove: Story = {
  name: 'Project timeline, move',
  tags: ['!dev'],
  render: () => <ExampleApp start={AA_ROUTES.move} />,
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const dialog = await within(document.body).findByRole('dialog', { name: /Move\s*Floors 3–4/ })
    await expect(dialog).toHaveTextContent('The length stays the same.')
  },
}

/**
 * The keyboard way of a drag: Change → Move…, a new start two weeks later, Move. The application
 * applies it (Structure still ends on 27.11.) and confirms it.
 */
export const ProjectTimelineMoveInteraction: Story = {
  name: 'Project timeline, move by keyboard, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AA_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Change Floors 3–4' }))
    await userEvent.click(await page.findByRole('menuitem', { name: 'Move…' }))
    const dialog = await page.findByRole('dialog', { name: /Move\s*Floors 3–4/ })
    const start = within(dialog).getByRole('textbox', { name: /New start/ })
    await userEvent.clear(start)
    await userEvent.type(start, '19.10.2026.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }))
    await page.findByText(/^Floors 3–4 now runs 19\.10\.2026\. – 13\.11\.2026\.$/)
    await waitFor(
      async () => {
        await expect(page.queryByRole('dialog')).toBeNull()
        await expect(
          canvas.getByRole('rowheader', {
            name: /^Task: Floors 3–4, in Structure, 19\.10\.2026\./,
          }),
        ).toBeInTheDocument()
      },
      { timeout: 5_000 },
    )
    notice.dismiss()
  },
}

// ── P5.35 gantt ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { Y_ROUTES } from './data-Y'

/** An employee portal story's checks, and on a phone that nothing scrolls sideways. */
function employeePlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/**
 * The employee portal of Kvadrat Gradnja d.o.o. (P5.35, PortalShell) as Nikola Marković, a site
 * worker on Liman 4, sees it on 14.10.2026: the annex waiting for his signature, his latest
 * payslip, the leave left, his next shift (changed to a night pour) and his details.
 */
const EMPLOYEE_HOME_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Hello, Nikola' })).toBeVisible()
  await expect(canvas.getByRole('link', { name: 'September 2026' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Open the annex' })).toBeVisible()
}

export const EmployeePortal: Story = {
  name: 'Employee portal',
  render: () => <ExampleApp start={Y_ROUTES.home} />,
  play: employeePlay(EMPLOYEE_HOME_CHECK),
}

export const EmployeePortalPhone: Story = {
  name: 'Employee portal, phone',
  render: () => <OnPhone start={Y_ROUTES.home} />,
  play: employeePlay(EMPLOYEE_HOME_CHECK, true),
}

/** His payslips of 2026, newest first; September is new. */
const PAYSLIPS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Payslips' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('85.330,37')
}

export const EmployeePayslips: Story = {
  name: 'Employee portal, payslips',
  render: () => <ExampleApp start={Y_ROUTES.payslips} />,
  play: employeePlay(PAYSLIPS_CHECK),
}

export const EmployeePayslipsPhone: Story = {
  name: 'Employee portal, payslips, phone',
  render: () => <OnPhone start={Y_ROUTES.payslips} />,
  play: employeePlay(PAYSLIPS_CHECK, true),
}

/** September's payslip: net, gross, hours, every earning and deduction, what the employer adds. */
const PAYSLIP_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Payslip for September 2026' }),
  ).toBeVisible()
  await expect(canvasElement).toHaveTextContent('117.672,00')
  await expect(canvasElement).toHaveTextContent('32.341,63')
  await expect(canvas.getByRole('button', { name: 'View PDF' })).toBeVisible()
}

export const EmployeePayslip: Story = {
  name: 'Employee portal, payslip',
  render: () => <ExampleApp start={Y_ROUTES.payslip('2026-09')} />,
  play: employeePlay(PAYSLIP_CHECK),
}

export const EmployeePayslipPhone: Story = {
  name: 'Employee portal, payslip, phone',
  render: () => <OnPhone start={Y_ROUTES.payslip('2026-09')} />,
  play: employeePlay(PAYSLIP_CHECK, true),
}

/** The payslip's PDF as the application renders it: one A4 sheet. */
const PAYSLIP_PDF_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Net pay 85.330,37 RSD')
  await expect(
    within(canvasElement).getByRole('button', { name: 'Back to the payslip' }),
  ).toBeVisible()
}

export const EmployeePayslipPdf: Story = {
  name: 'Employee portal, payslip PDF',
  render: () => <ExampleApp start={Y_ROUTES.payslipPdf('2026-09')} />,
  play: employeePlay(PAYSLIP_PDF_CHECK),
}

export const EmployeePayslipPdfPhone: Story = {
  name: 'Employee portal, payslip PDF, phone',
  render: () => <OnPhone start={Y_ROUTES.payslipPdf('2026-09')} />,
  play: employeePlay(PAYSLIP_PDF_CHECK, true),
}

/** Leave: 22 days, 11 taken, 5 waiting for HR, 6 left; the requests with their state. */
const LEAVE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Leave' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Waiting for HR')
  await expect(canvasElement).toHaveTextContent('The foundation slab of Liman 4 is poured')
}

export const EmployeeLeave: Story = {
  name: 'Employee portal, leave',
  render: () => <ExampleApp start={Y_ROUTES.leave} />,
  play: employeePlay(LEAVE_CHECK),
}

export const EmployeeLeavePhone: Story = {
  name: 'Employee portal, leave, phone',
  render: () => <OnPhone start={Y_ROUTES.leave} />,
  play: employeePlay(LEAVE_CHECK, true),
}

/** LR-2026-031: submitted, approved by the site manager, waiting for HR (Jelena Marković). */
const LEAVE_REQUEST_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'LR-2026-031' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Approved by the site manager')
  await expect(canvas.getByRole('button', { name: 'Withdraw request' })).toBeVisible()
}

export const EmployeeLeaveRequest: Story = {
  name: 'Employee portal, leave request',
  render: () => <ExampleApp start={Y_ROUTES.leaveRequest('LR-2026-031')} />,
  play: employeePlay(LEAVE_REQUEST_CHECK),
}

export const EmployeeLeaveRequestPhone: Story = {
  name: 'Employee portal, leave request, phone',
  render: () => <OnPhone start={Y_ROUTES.leaveRequest('LR-2026-031')} />,
  play: employeePlay(LEAVE_REQUEST_CHECK, true),
}

/** A rejected request: the site manager's reason on its step. */
export const EmployeeLeaveRejected: Story = {
  name: 'Employee portal, leave request, rejected',
  tags: ['!dev'],
  render: () => <ExampleApp start={Y_ROUTES.leaveRequest('LR-2026-027')} />,
  play: employeePlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('Rejected by the site manager')
    await expect(
      within(canvasElement).queryByRole('button', { name: 'Withdraw request' }),
    ).toBeNull()
  }),
}

/** A new request half written: 21.–28.12.2026., the application counts 6 working days. */
const NEW_LEAVE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Request leave' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('6 working days · 6 left this year')
}

export const EmployeeNewLeave: Story = {
  name: 'Employee portal, new leave request',
  render: () => <ExampleApp start={Y_ROUTES.newLeaveDraft} />,
  play: employeePlay(NEW_LEAVE_CHECK),
}

export const EmployeeNewLeavePhone: Story = {
  name: 'Employee portal, new leave request, phone',
  render: () => <OnPhone start={Y_ROUTES.newLeaveDraft} />,
  play: employeePlay(NEW_LEAVE_CHECK, true),
}

/** The request sent: it waits for the site manager; nothing left to take. */
export const EmployeeLeaveSent: Story = {
  name: 'Employee portal, leave, request sent',
  tags: ['!dev'],
  render: () => <ExampleApp start={`${Y_ROUTES.leave}?sent`} />,
  play: employeePlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('Waiting for site manager')
  }),
}

/** Sending: Send with no dates names them; with the dates the request goes and the list shows it. */
export const EmployeeRequestLeaveInteraction: Story = {
  name: 'Employee portal, request leave, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Y_ROUTES.newLeave} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Send request' }))
    await expect(canvasElement).toHaveTextContent('Choose the first and the last day.')
    const [from, to] = canvas.getAllByRole('textbox', { name: /Dates/ })
    if (from === undefined || to === undefined) throw new Error('The dates are missing.')
    await userEvent.type(from, '21.12.2026.')
    await userEvent.type(to, '28.12.2026.')
    await userEvent.tab()
    await expect(canvasElement).toHaveTextContent('6 working days')
    await userEvent.click(canvas.getByRole('button', { name: 'Send request' }))
    await waitFor(async () => {
      await expect(canvasElement).toHaveTextContent('Request sent')
    })
    notice.dismiss()
  },
}

/** His shifts by week: Thursday's changed to a night pour, a swap waiting for the site manager. */
const SHIFTS_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Night pour')
  await expect(canvasElement).toHaveTextContent('Swap requested with Marko Ilić')
}

export const EmployeeShifts: Story = {
  name: 'Employee portal, shifts',
  render: () => <ExampleApp start={Y_ROUTES.shifts} />,
  play: employeePlay(SHIFTS_CHECK),
}

export const EmployeeShiftsPhone: Story = {
  name: 'Employee portal, shifts, phone',
  render: () => <OnPhone start={Y_ROUTES.shifts} />,
  play: employeePlay(SHIFTS_CHECK, true),
}

/** What waits for his signature and what he signed. */
const DOCUMENTS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('link', {
      name: 'Annex 2 to the employment contract — night work on Liman 4',
    }),
  ).toBeVisible()
  await expect(canvasElement).toHaveTextContent('sign by 16.10.2026.')
}

export const EmployeeDocuments: Story = {
  name: 'Employee portal, documents',
  render: () => <ExampleApp start={Y_ROUTES.documents} />,
  play: employeePlay(DOCUMENTS_CHECK),
}

export const EmployeeDocumentsPhone: Story = {
  name: 'Employee portal, documents, phone',
  render: () => <OnPhone start={Y_ROUTES.documents} />,
  play: employeePlay(DOCUMENTS_CHECK, true),
}

/** The annex: its text first, the signers with his Decline and Sign. */
const ANNEX_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'ANX-2026-014' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Sign' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Article 1')
}

export const EmployeeAnnex: Story = {
  name: 'Employee portal, document to sign',
  render: () => <ExampleApp start={Y_ROUTES.document('ANX-2026-014')} />,
  play: employeePlay(ANNEX_CHECK),
}

export const EmployeeAnnexPhone: Story = {
  name: 'Employee portal, document to sign, phone',
  render: () => <OnPhone start={Y_ROUTES.document('ANX-2026-014')} />,
  play: employeePlay(ANNEX_CHECK, true),
}

/** Sign: his state becomes Signed, the director signs next. */
export const EmployeeSignInteraction: Story = {
  name: 'Employee portal, sign the annex, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Y_ROUTES.document('ANX-2026-014')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Sign' }))
    await waitFor(async () => {
      await expect(canvas.getByText('Signed by you')).toBeVisible()
    })
    notice.dismiss()
  },
}

/** What HR has, and the change of his phone number waiting for HR. */
const DETAILS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'My details' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Waiting for HR')
  await expect(canvas.getByRole('button', { name: 'Request a change' })).toBeVisible()
}

export const EmployeeDetails: Story = {
  name: 'Employee portal, my details',
  render: () => <ExampleApp start={Y_ROUTES.details} />,
  play: employeePlay(DETAILS_CHECK),
}

export const EmployeeDetailsPhone: Story = {
  name: 'Employee portal, my details, phone',
  render: () => <OnPhone start={Y_ROUTES.details} />,
  play: employeePlay(DETAILS_CHECK, true),
}

/** The change request open on the address (a Drawer, D14), as the application restores it. */
export const EmployeeDetailsChange: Story = {
  name: 'Employee portal, my details, change',
  tags: ['!dev'],
  render: () => <ExampleApp start={Y_ROUTES.detailsChange} />,
  play: employeePlay(async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Request a change' })
    await expect(drawer).toHaveTextContent('HR will ask for proof')
  }),
}

/** Asking for a change: the new value goes to HR and waits in the list. */
export const EmployeeDetailsChangeInteraction: Story = {
  name: 'Employee portal, request a change, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Y_ROUTES.details} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Request a change' }))
    const drawer = await page.findByRole('dialog', { name: 'Request a change' })
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send to HR' }))
    await expect(drawer).toHaveTextContent('Write the new value.')
    await userEvent.type(within(drawer).getByRole('textbox', { name: /New value/ }), '065 555 0999')
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send to HR' }))
    await waitFor(async () => {
      await expect(canvasElement).toHaveTextContent('CR-2026-010')
    })
    notice.dismiss()
  },
}

// ── P5.40 Payment orders (group AD) ──
import { AD_ROUTES } from './data-AD'

/**
 * Kvadrat Gradnja's transfer order (form 3) to Beton Mix for invoice 2026-1187: the fields at the
 * start, the bank's form as it will print at the end, with the IPS QR code its payment carries.
 */
const PAYMENT_ORDER_CHECK = async (canvasElement: HTMLElement) => {
  await settle()
  const canvas = within(canvasElement)
  const form = await canvas.findByRole('region', { name: 'NALOG ZA PRENOS' })
  await expect(within(form).getByText('294.000,00')).toBeVisible()
  await expect(within(form).getByRole('img', { name: 'IPS QR code for the payment' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Print' })).toBeVisible()
}

export const PaymentOrders: Story = {
  name: 'Payment orders',
  render: () => <ExampleApp start={AD_ROUTES.transfer} />,
  play: async ({ canvasElement }) => {
    await PAYMENT_ORDER_CHECK(canvasElement)
  },
}

export const PaymentOrdersPhone: Story = {
  name: 'Payment orders, phone',
  render: () => <OnPhone start={AD_ROUTES.transfer} />,
  play: async ({ canvasElement }) => {
    await PAYMENT_ORDER_CHECK(canvasElement)
  },
}

/** A payment order (form 1): a customer pays invoice F-2026-0412, with the IPS QR code. */
export const PaymentOrdersPayment: Story = {
  name: 'Payment orders, payment order',
  tags: ['!dev'],
  render: () => <ExampleApp start={AD_ROUTES.payment} />,
  play: async ({ canvasElement }) => {
    await settle()
    const form = await within(canvasElement).findByRole('region', { name: 'NALOG ZA UPLATU' })
    await expect(within(form).getByText('5.003.678,22')).toBeVisible()
  },
}

/** A withdrawal order (form 2): cash for the site; no QR code. */
export const PaymentOrdersWithdrawal: Story = {
  name: 'Payment orders, withdrawal order',
  tags: ['!dev'],
  render: () => <ExampleApp start={AD_ROUTES.withdrawal} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await canvas.findByRole('region', { name: 'NALOG ZA ISPLATU' })
    await expect(
      canvas.getByText('A withdrawal pays out cash: it has no IPS QR code.'),
    ).toBeVisible()
  },
}

/** Checked with two mistakes: each under its field, in words; no QR code until they are fixed. */
export const PaymentOrdersProblems: Story = {
  name: 'Payment orders, problems',
  tags: ['!dev'],
  render: () => <ExampleApp start={AD_ROUTES.problems} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText('2 fields need a correction before the order can be printed.'),
    ).toBeVisible()
    await expect(canvas.getByText(/^Creditor’s account: not a valid account number/)).toBeVisible()
    await expect(
      canvas.getByText(/^Amount: an amount from 0.01 with at most two decimals/),
    ).toBeVisible()
    await expect(canvasElement.querySelector('[data-slot="payment-order-code"]')).toBeNull()
  },
}

/** A wrong account typed, then Print: the check under the field, the focus on it. */
export const PaymentOrdersPrintInteraction: Story = {
  name: 'Payment orders, wrong account, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AD_ROUTES.transfer} />,
  play: async ({ canvasElement }) => {
    await PAYMENT_ORDER_CHECK(canvasElement)
    const canvas = within(canvasElement)
    const account = canvas.getByRole('textbox', { name: 'Creditor’s account' })
    await userEvent.clear(account)
    await userEvent.type(account, '265-654321-34')
    await expect(canvasElement.querySelector('[data-slot="payment-order-code"]')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Print' }))
    await waitFor(async () => {
      await expect(account).toHaveFocus()
    })
    await expect(account).toHaveAccessibleDescription(/not a valid account number/)
    await userEvent.clear(account)
    await userEvent.type(account, '265-654321-33')
    await waitFor(async () => {
      await expect(canvas.getByRole('img', { name: 'IPS QR code for the payment' })).toBeVisible()
    })
  },
}

// ── P5.32 acct ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { V_ROUTES } from './data-V'
import { Z_ROUTES } from './data-Z'

/** The first file input inside an element (FileDropzone's). */
function firstFileInput(element: HTMLElement): HTMLInputElement {
  const input = element.querySelector<HTMLInputElement>('input[type="file"]')
  if (input === null) throw new Error('No file input')
  return input
}

/**
 * Knjigovodstvo Jelić's clients on 14 October 2026, Snežana Jelić signed in: her clients in the
 * application's order of urgency — at risk first, then the nearest open deadline —, each with
 * its next deadline, missing documents, open tasks, last activity and health in words.
 */
export const AccountantClients: Story = {
  name: 'Accountant clients',
  render: () => <ExampleApp start={V_ROUTES.clients} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Clients' })
    const kvadrat = within(table).getByRole('row', { name: /Kvadrat Gradnja d\.o\.o\./ })
    await expect(kvadrat).toHaveTextContent('PIB 108452317')
    await expect(kvadrat).toHaveTextContent('At risk')
    await expect(kvadrat).toHaveTextContent('3 documents')
    // At risk first: the overdue payroll tax return of Rakić Pekara leads.
    const first = within(table).getAllByRole('row')[1]
    await expect(first).toHaveTextContent('Rakić Pekara SZR')
    await expect(canvas.getByRole('button', { name: /All clients/ })).toHaveTextContent('214')
    // 25 a page, in the application's order; the next page from the pager.
    await expect(within(table).getAllByRole('row')).toHaveLength(26)
  },
}

export const AccountantClientsPhone: Story = {
  name: 'Accountant clients, phone',
  render: () => <OnPhone start={V_ROUTES.clients} />,
}

/** Every client who needs attention, both accountants'. */
export const AccountantClientsAttention: Story = {
  name: 'Accountant clients, needs attention',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.attention} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Clients' })
    await expect(table).toHaveTextContent('Medija Print d.o.o.')
    await expect(table).not.toHaveTextContent('On track')
  },
}

/** All 214 clients, both accountants', 25 a page. */
export const AccountantClientsAll: Story = {
  name: 'Accountant clients, all',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.allClients} />,
}

/** Filtered to overdue deadlines, then a row's menu asks the client; Send adds the request. */
export const AccountantClientsFilterAndAsk: Story = {
  name: 'Accountant clients, filter and ask, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={V_ROUTES.clients} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Name or tax number' }), '108452317')
    const table = canvas.getByRole('table', { name: 'Clients' })
    await waitFor(async () => {
      await expect(within(table).getAllByRole('row')).toHaveLength(2)
    })
    await userEvent.click(within(table).getByRole('button', { name: /Kvadrat Gradnja/ }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Ask the client…' }))
    const drawer = await body.findByRole('dialog', { name: /^Ask the client/ })
    await expect(drawer).toHaveTextContent('Kvadrat Gradnja d.o.o.')
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send request' }))
    await waitFor(
      async () => {
        await expect(body.queryByRole('dialog')).toBeNull()
      },
      { timeout: 5000 },
    )
    // The toast fades in.
    await waitFor(
      async () => {
        await expect(body.getByText(/Request sent to Kvadrat Gradnja d\.o\.o\./)).toBeVisible()
      },
      { timeout: 5000 },
    )
    // The client's checklist lists the new request beside the earlier ones.
    await userEvent.click(within(table).getByRole('row', { name: /Kvadrat Gradnja/ }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { name: 'Requests to the client' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Documents asked on 14.10.2026.')
  },
}

/**
 * The company switcher at 214 clients (AppShell's, virtualised): pinned, recent, then every
 * client; the tax number on the second line; a suspended account marked; the application's note.
 */
export const AccountantSwitcher: Story = {
  name: 'Accountant client switcher',
  render: () => <ExampleApp start={V_ROUTES.switcher} />,
  play: async () => {
    const list = await within(document.body).findByRole('listbox', { name: 'Companies' })
    await settle()
    // The list opens at the current company, the firm's own books, among all 214.
    const current = within(list).getByRole('option', { name: /Knjigovodstvo Jelić/ })
    await expect(current).toHaveAttribute('aria-selected', 'true')
    await expect(current).toHaveAttribute('aria-setsize', '214')
    // A virtualised list: far fewer rows in the page than clients.
    await expect(within(list).getAllByRole('option').length).toBeLessThan(60)
  },
}

export const AccountantSwitcherPhone: Story = {
  name: 'Accountant client switcher, phone',
  render: () => <OnPhone start={V_ROUTES.switcher} />,
  play: async () => {
    const sheet = await within(document.body).findByRole('dialog', { name: 'Switch company' })
    await settle()
    await expect(within(sheet).getByRole('combobox', { name: 'Find company' })).toBeVisible()
  },
}

/** A tax number finds its client among 214; Enter opens that client's month-end checklist. */
export const AccountantSwitcherSearch: Story = {
  name: 'Accountant client switcher, search by tax number, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={V_ROUTES.switcher} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    const search = await body.findByRole('combobox', { name: 'Find company' })
    await settle()
    await userEvent.type(search, '107819450')
    const list = body.getByRole('listbox', { name: 'Companies' })
    await waitFor(async () => {
      await expect(within(list).getAllByRole('option')).toHaveLength(1)
    })
    await expect(within(list).getByRole('option')).toHaveTextContent('Medic Lab Niš d.o.o.')
    // Without accents and in parts: "vojvodanka mlin".
    await userEvent.clear(search)
    await userEvent.type(search, 'vojvodjanka mlin')
    await userEvent.clear(search)
    await userEvent.type(search, 'mlin vojvo')
    await waitFor(async () => {
      await expect(within(list).getAllByRole('option')[0]).toHaveTextContent('Vojvođanka Mlin a.d.')
    })
    await userEvent.clear(search)
    await userEvent.type(search, '108452317{Enter}')
    await expect(
      await within(canvasElement).findByRole('heading', {
        level: 1,
        name: 'Kvadrat Gradnja d.o.o.: September 2026',
      }),
    ).toBeVisible()
  },
}

/** On a phone: the full-screen sheet, searched by name; choosing opens the client. */
export const AccountantSwitcherPhoneSearch: Story = {
  name: 'Accountant client switcher, phone, search, interaction',
  tags: ['interaction', '!dev'],
  render: () => <OnPhone start={V_ROUTES.switcher} />,
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    const sheet = await body.findByRole('dialog', { name: 'Switch company' })
    await settle()
    await userEvent.type(
      within(sheet).getByRole('combobox', { name: 'Find company' }),
      'zlatni klas',
    )
    const option = await within(sheet).findByRole('option', { name: /Pekara Zlatni klas/ })
    await userEvent.click(option)
    await expect(
      await within(canvasElement).findByRole('heading', {
        level: 1,
        name: 'Pekara Zlatni klas d.o.o.: September 2026',
      }),
    ).toBeVisible()
  },
}

/**
 * The deadlines across Snežana's clients in October: the VAT returns for September on the 15th,
 * the payroll tax returns, an annual account; each in its state's words and tone.
 */
export const AccountantDeadlines: Story = {
  name: 'Accountant deadlines',
  render: () => <ExampleApp start={V_ROUTES.deadlines} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Deadlines' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Payroll tax return · Rakić Pekara SZR')
  },
}

export const AccountantDeadlinesPhone: Story = {
  name: 'Accountant deadlines, phone',
  render: () => <OnPhone start={V_ROUTES.deadlines} />,
}

/** The agenda on a desktop: day by day. */
export const AccountantDeadlinesAgenda: Story = {
  name: 'Accountant deadlines, agenda',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.deadlinesAgenda} />,
}

/** The 15th's list open: every deadline of that day. */
export const AccountantDeadlinesDay: Story = {
  name: 'Accountant deadlines, 15 October',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.deadlinesDay} />,
}

/**
 * Kvadrat Gradnja d.o.o.'s September (SetupChecklist): purchase invoices wait for three missing
 * documents ("Ask the client…"), the VAT return and the lock wait for them; beside it the
 * deadlines, the requests sent to the client and its facts.
 */
export const AccountantMonthClose: Story = {
  name: 'Accountant month close',
  render: () => <ExampleApp start={V_ROUTES.close('kvadrat')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('3 of 7 done')
    await expect(canvas.getByRole('button', { name: 'Ask the client…' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Waits for the purchase invoices (step 3).')
    await expect(canvasElement).toHaveTextContent('Documents for the VAT return, September 2026')
  },
}

export const AccountantMonthClosePhone: Story = {
  name: 'Accountant month close, phone',
  render: () => <OnPhone start={V_ROUTES.close('kvadrat')} />,
}

/** Another client's checklist, from its state: Medic Lab Niš waits for its bank statements. */
export const AccountantMonthCloseMedic: Story = {
  name: 'Accountant month close, Medic Lab Niš',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.close('medic')} />,
}

/**
 * "Ask the client" (an end Drawer, the list still visible): documents or answers, the items, the
 * due date, a message and the e-mail as a choice; the client answers in the portal.
 */
export const AccountantAsk: Story = {
  name: 'Accountant ask the client',
  render: () => <ExampleApp start={V_ROUTES.ask} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: /^Ask the client/ })
    await settle()
    await expect(within(drawer).getByRole('radio', { name: /Documents/ })).toBeChecked()
    await expect(within(drawer).getByRole('textbox', { name: 'Document 1' })).toHaveValue(
      'Contract with Elektro Sistem d.o.o. for the excavator rental',
    )
    await expect(
      within(drawer).getByRole('checkbox', { name: 'Notify Milica Petrović by e-mail' }),
    ).toBeChecked()
  },
}

export const AccountantAskPhone: Story = {
  name: 'Accountant ask the client, phone',
  render: () => <OnPhone start={V_ROUTES.ask} />,
  play: async () => {
    await within(document.body).findByRole('dialog', { name: /^Ask the client/ })
    await settle()
  },
}

/** Send with nothing asked and no due date: the checks say what is missing. */
export const AccountantAskErrors: Story = {
  name: 'Accountant ask the client, errors',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.askErrors} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: /^Ask the client/ })
    await settle()
    await expect(drawer).toHaveTextContent('Write at least one question.')
    await expect(drawer).toHaveTextContent('Choose the day the answer is due.')
  },
}

/**
 * Kvadrat Gradnja's client portal (Milica Petrović): the firm's open requests — three documents
 * for the VAT return and two payments to explain — and the earlier ones, done.
 */
export const ClientPortalRequests: Story = {
  name: 'Client portal requests',
  render: () => <ExampleApp start={V_ROUTES.portal} />,
  play: portalPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Requests from your accountant' }),
    ).toBeVisible()
    await expect(canvas.getByRole('table', { name: 'Open requests' })).toHaveTextContent(
      'Two payments to explain',
    )
  }),
}

export const ClientPortalRequestsPhone: Story = {
  name: 'Client portal requests, phone',
  render: () => <OnPhone start={V_ROUTES.portal} />,
  play: portalPlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('Documents for the VAT return, September 2026')
  }, true),
}

/** One request: the accountant's message, a drop zone per document, Send. */
export const ClientPortalRequest: Story = {
  name: 'Client portal request',
  render: () => <ExampleApp start={V_ROUTES.request('REQ-2026-118')} />,
  play: portalPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button', { name: 'Choose files' })).toHaveLength(3)
    await expect(canvas.getByRole('button', { name: 'Send to Snežana Jelić' })).toBeVisible()
  }),
}

export const ClientPortalRequestPhone: Story = {
  name: 'Client portal request, phone',
  render: () => <OnPhone start={V_ROUTES.request('REQ-2026-118')} />,
  play: portalPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getAllByRole('button', { name: 'Take a photo' }).length,
    ).toBeGreaterThan(0)
  }, true),
}

/** The first document uploaded: the file in its place, removable until sent; "1 of 3 given". */
export const ClientPortalRequestUploaded: Story = {
  name: 'Client portal request, one document uploaded',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.requestUploaded} />,
  play: portalPlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('beton-mix-2026-1187.pdf')
    await expect(canvasElement).toHaveTextContent('1 of 3 given')
  }),
}

/** The questions answered and sent: the answers read only, "Sent to Snežana Jelić on …". */
export const ClientPortalRequestSent: Story = {
  name: 'Client portal request, answers sent',
  tags: ['!dev'],
  render: () => <ExampleApp start={V_ROUTES.requestSent} />,
  play: portalPlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('Sent to Snežana Jelić on')
    await expect(within(canvasElement).queryByRole('textbox')).toBeNull()
  }),
}

/** Upload a document, Send: the request is answered and leaves the open list. */
export const ClientPortalUpload: Story = {
  name: 'Client portal request, upload and send, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={V_ROUTES.request('REQ-2026-118')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Send to Snežana Jelić' }))
    await expect(canvasElement).toHaveTextContent('Upload at least one document before you send.')
    await userEvent.upload(
      firstFileInput(canvasElement),
      new File(['%PDF-1.7'], 'beton-mix-2026-1187.pdf', { type: 'application/pdf' }),
    )
    await expect(await canvas.findByText('beton-mix-2026-1187.pdf')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('1 of 3 given')
    await userEvent.click(canvas.getByRole('button', { name: 'Send to Snežana Jelić' }))
    await expect(await canvas.findByText(/^Sent to Snežana Jelić on/)).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: 'Back to Requests' }))
    await settle()
    await expect(canvas.getByRole('table', { name: 'Open requests' })).not.toHaveTextContent(
      'Documents for the VAT return',
    )
  },
}

/** What Kvadrat Gradnja sent the firm earlier. */
export const ClientPortalDocuments: Story = {
  name: 'Client portal documents',
  render: () => <ExampleApp start={V_ROUTES.documents} />,
}

export const ClientPortalDocumentsPhone: Story = {
  name: 'Client portal documents, phone',
  render: () => <OnPhone start={V_ROUTES.documents} />,
}

/**
 * Kvadrat Gradnja d.o.o.'s Liro subscription (Milica Petrović, administrator): Business with the
 * Projects module, 24 of 30 users and the other allowances (UsageMeter; the assistant near its
 * limit in the application's words), the next invoice, the card and the latest invoices.
 */
export const SubscriptionOverview: Story = {
  name: 'Subscription',
  render: () => <ExampleApp start={Z_ROUTES.subscription} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('progressbar', { name: 'Users' })).toHaveAttribute(
      'aria-valuetext',
      '24 of 30',
    )
    await expect(canvasElement).toHaveTextContent('Near the limit')
    await expect(canvasElement).toHaveTextContent('20.760,00')
    await expect(canvas.getByRole('button', { name: 'Change plan' })).toBeVisible()
  },
}

export const SubscriptionOverviewPhone: Story = {
  name: 'Subscription, phone',
  render: () => <OnPhone start={Z_ROUTES.subscription} />,
}

/** A company on its trial: the trial Banner in the shell, no invoices, no payment method yet. */
export const SubscriptionTrial: Story = {
  name: 'Subscription, trial',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.trial} />,
  play: async ({ canvasElement }) => {
    await settle()
    const banner = canvasElement.querySelector('[data-slot="shell-banners"]')
    await expect(banner).toHaveTextContent('Your trial ends in 9 days')
    await expect(canvasElement).toHaveTextContent('No payment method yet.')
  },
}

export const SubscriptionTrialPhone: Story = {
  name: 'Subscription, trial, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={Z_ROUTES.trial} />,
}

/** October's card payment failed: the danger Banner in the shell, the invoice overdue. */
export const SubscriptionPastDue: Story = {
  name: 'Subscription, payment past due',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.pastDue} />,
  play: async ({ canvasElement }) => {
    await settle()
    const banner = canvasElement.querySelector('[data-slot="shell-banners"]')
    await expect(banner).toHaveTextContent('Payment past due')
    await expect(
      within(canvasElement).getByRole('button', { name: 'Update payment method' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Overdue')
  },
}

export const SubscriptionPastDuePhone: Story = {
  name: 'Subscription, payment past due, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={Z_ROUTES.pastDue} />,
}

/** Cancelled: it runs to the end of the term; "Keep the subscription" in the banner. */
export const SubscriptionCancelled: Story = {
  name: 'Subscription, cancelled',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.cancelled} />,
}

/** "Change" on the payment method: the card, a transfer, or a new card at the provider. */
export const SubscriptionPayment: Story = {
  name: 'Subscription, payment method',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.payment} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', {
      name: /^Change payment method/,
    })
    await settle()
    await expect(within(drawer).getByRole('radio', { name: /Visa ending in 4242/ })).toBeChecked()
  },
}

/** Cancelling asks why and the company's name: what happens to access and data, in words. */
export const SubscriptionCancel: Story = {
  name: 'Subscription, cancel',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.cancel} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog')
    await settle()
    await expect(dialog).toHaveTextContent('Kvadrat Gradnja d.o.o. · Business')
    await expect(within(dialog).getByRole('button', { name: 'Cancel subscription' })).toBeDisabled()
  },
}

/** Cancel, a reason, the name typed: the cancelled banner; "Keep the subscription" undoes it. */
export const SubscriptionCancelling: Story = {
  name: 'Subscription, cancel and keep, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Z_ROUTES.subscription} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel subscription' }))
    const dialog = await body.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'It costs too much' }))
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Kvadrat Gradnja/ }),
      'Kvadrat Gradnja d.o.o.',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel subscription' }))
    await waitFor(
      async () => {
        await expect(body.queryByRole('alertdialog')).toBeNull()
      },
      { timeout: 5000 },
    )
    const banner = canvasElement.querySelector('[data-slot="shell-banners"]')
    await expect(banner).toHaveTextContent('Your subscription is cancelled')
    await userEvent.click(canvas.getByRole('button', { name: 'Keep the subscription' }))
    await expect(canvasElement.querySelector('[data-slot="shell-banners"]')).toBeNull()
  },
}

/** Liro's invoices, newest first; a row opens the PDF. */
export const SubscriptionInvoicesList: Story = {
  name: 'Subscription invoices',
  render: () => <ExampleApp start={Z_ROUTES.invoices} />,
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', { name: 'Liro’s invoices' })
    await expect(within(table).getAllByRole('row')[1]).toHaveTextContent('LB-2026-0934')
  },
}

export const SubscriptionInvoicesListPhone: Story = {
  name: 'Subscription invoices, phone',
  render: () => <OnPhone start={Z_ROUTES.invoices} />,
}

/** October's invoice as its PDF (PrintDocument): paid by card, no amount due. */
export const SubscriptionInvoicePdf: Story = {
  name: 'Subscription invoice PDF',
  render: () => <ExampleApp start={Z_ROUTES.invoice('LB-2026-0934')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(
      'Paid on 01.10.2026. with the card ending in 4242.',
    )
    await expect(canvasElement).toHaveTextContent('20.760,00')
  },
}

export const SubscriptionInvoicePdfPhone: Story = {
  name: 'Subscription invoice PDF, phone',
  render: () => <OnPhone start={Z_ROUTES.invoice('LB-2026-0934')} />,
}

/**
 * Change plan: Start, Business and Pro side by side (PlanComparison), Business current; Start
 * cannot hold 24 users and says so.
 */
export const SubscriptionChangePlan: Story = {
  name: 'Subscription change plan',
  render: () => <ExampleApp start={Z_ROUTES.changePlan} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Business' })).toBeChecked()
    await expect(canvas.getByRole('radio', { name: 'Start' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Change plan' })).toBeDisabled()
  },
}

export const SubscriptionChangePlanPhone: Story = {
  name: 'Subscription change plan, phone',
  render: () => <OnPhone start={Z_ROUTES.changePlan} />,
}

/** Pro chosen: what changes and the billing service's proration, "Due today 8.779,36 RSD". */
export const SubscriptionChangePlanPro: Story = {
  name: 'Subscription change plan, Pro chosen',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.changePlanPro} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('8.779,36')
    await expect(canvasElement).toHaveTextContent('-8.651,61')
  },
}

export const SubscriptionChangePlanProPhone: Story = {
  name: 'Subscription change plan, Pro chosen, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={Z_ROUTES.changePlanPro} />,
}

/** "Change to Pro" asks first: the action, Business → Pro, the charge and the proration. */
export const SubscriptionChangePlanConfirm: Story = {
  name: 'Subscription change plan, confirm',
  tags: ['!dev'],
  render: () => <ExampleApp start={Z_ROUTES.changePlanConfirm} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('alertdialog')
    await settle()
    await expect(dialog).toHaveTextContent('Business → Pro')
    await expect(within(dialog).getByRole('button', { name: 'Change to Pro' })).toBeVisible()
  },
}

/** Choose Pro, confirm: the subscription page shows Pro with its limits and next invoice. */
export const SubscriptionChangingPlan: Story = {
  name: 'Subscription change plan, to Pro, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Z_ROUTES.changePlan} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Pro', { selector: 'span' }))
    await expect(canvas.getByRole('radio', { name: 'Pro' })).toBeChecked()
    await expect(canvasElement).toHaveTextContent('8.779,36')
    await userEvent.click(canvas.getByRole('button', { name: 'Change to Pro' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Change to Pro' }))
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Subscription' }),
    ).toBeVisible()
    await expect(canvas.getByRole('progressbar', { name: 'Users' })).toHaveAttribute(
      'aria-valuetext',
      '24 of 100',
    )
    await expect(canvasElement).toHaveTextContent('35.880,00')
  },
}

// P5.34 ai
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { X_ROUTES } from './data-X'
import { AB_ROUTES } from './data-AB'
import { AC_ROUTES } from './data-AC'

/** The assistant's panel, once it is open (it is a sheet over the page). */
async function assistantPanel() {
  const panel = await within(document.body).findByRole('dialog', { name: 'Liro Assistant' })
  await settle()
  return within(panel)
}

/**
 * The Liro Assistant beside Receivables (AssistantPanel from the header's button, P5.34),
 * Kvadrat Gradnja d.o.o., 14.10.2026 09:40: "Which invoices are overdue more than 30 days?" —
 * three invoices as cards linked to their records, the total, the sources, follow-ups, labelled
 * AI-generated with "Report a wrong answer".
 */
const ASSISTANT_OVERDUE_CHECK = async () => {
  const panel = await assistantPanel()
  await expect(panel.getByRole('log', { name: 'Conversation' })).toHaveTextContent('512.400,00')
  await expect(panel.getByRole('link', { name: 'F-2026-0341' })).toBeVisible()
  await expect(panel.getAllByText('AI-generated')[0]).toBeVisible()
  await expect(panel.getByRole('list', { name: 'Sources' })).toBeVisible()
}

export const LiroAssistant: Story = {
  name: 'Liro Assistant',
  render: () => <ExampleApp start={X_ROUTES.overdue} />,
  play: ASSISTANT_OVERDUE_CHECK,
}

export const LiroAssistantPhone: Story = {
  name: 'Liro Assistant, phone',
  render: () => <OnPhone start={X_ROUTES.overdue} />,
  play: ASSISTANT_OVERDUE_CHECK,
}

/** "How did revenue change this quarter?": the text, a bar chart from the charts, sources. */
const ASSISTANT_REVENUE_CHECK = async () => {
  const panel = await assistantPanel()
  await expect(panel.getByRole('heading', { name: 'Revenue in the third quarter' })).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'Revenue by month' })).toBeVisible()
}

export const LiroAssistantRevenue: Story = {
  name: 'Liro Assistant, revenue',
  render: () => <ExampleApp start={X_ROUTES.revenue} />,
  play: ASSISTANT_REVENUE_CHECK,
}

export const LiroAssistantRevenuePhone: Story = {
  name: 'Liro Assistant, revenue, phone',
  render: () => <OnPhone start={X_ROUTES.revenue} />,
  play: ASSISTANT_REVENUE_CHECK,
}

/** "Post the Beton Mix invoice": a proposed action that waits for Confirm. */
const ASSISTANT_POST_CHECK = async () => {
  const panel = await assistantPanel()
  await expect(
    panel.getByRole('heading', { name: 'Post invoice 2026-1187 from Beton Mix d.o.o.' }),
  ).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Post invoice' })).toBeEnabled()
  await expect(panel.getByText('Nothing is done until you confirm.')).toBeVisible()
}

export const LiroAssistantAction: Story = {
  name: 'Liro Assistant, proposed action',
  render: () => <ExampleApp start={X_ROUTES.post} />,
  play: ASSISTANT_POST_CHECK,
}

export const LiroAssistantActionPhone: Story = {
  name: 'Liro Assistant, proposed action, phone',
  render: () => <OnPhone start={X_ROUTES.post} />,
  play: ASSISTANT_POST_CHECK,
}

/** A salaries question without the right: the application's words, never a failure. */
const ASSISTANT_SALARIES_CHECK = async () => {
  const panel = await assistantPanel()
  await expect(panel.getByRole('log')).toHaveTextContent(
    'You do not have permission to see salaries.',
  )
}

export const LiroAssistantNoAccess: Story = {
  name: 'Liro Assistant, no access',
  render: () => <ExampleApp start={X_ROUTES.salaries} />,
  play: ASSISTANT_SALARIES_CHECK,
}

export const LiroAssistantNoAccessPhone: Story = {
  name: 'Liro Assistant, no access, phone',
  render: () => <OnPhone start={X_ROUTES.salaries} />,
  play: ASSISTANT_SALARIES_CHECK,
}

/** Before the first question: what it can do and four suggested questions. */
export const LiroAssistantStart: Story = {
  name: 'Liro Assistant, before the first question',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.start} />,
  play: async () => {
    const panel = await assistantPanel()
    await expect(panel.getByRole('list', { name: 'Suggested questions' })).toBeVisible()
  },
}

/** A second question asked; nothing written yet. */
export const LiroAssistantThinking: Story = {
  name: 'Liro Assistant, thinking',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.thinking} />,
  play: async () => {
    const panel = await assistantPanel()
    await expect(panel.getByText('Thinking…')).toBeVisible()
  },
}

/** Being written: the text so far and Stop. */
export const LiroAssistantStreaming: Story = {
  name: 'Liro Assistant, streaming',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.streaming} />,
  play: async () => {
    const panel = await assistantPanel()
    await expect(panel.getByRole('button', { name: 'Stop' })).toBeVisible()
  },
}

/** Stopped: what was written, marked incomplete, Try again. */
export const LiroAssistantStopped: Story = {
  name: 'Liro Assistant, stopped',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.stopped} />,
  play: async () => {
    const panel = await assistantPanel()
    await expect(panel.getByText('Stopped. The answer may be incomplete.')).toBeVisible()
  },
}

/** It could not be answered: the application's words and Try again. */
export const LiroAssistantError: Story = {
  name: 'Liro Assistant, error',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.failed} />,
  play: async () => {
    const panel = await assistantPanel()
    await expect(panel.getByRole('alert')).toHaveTextContent('could not be read')
  },
}

/**
 * From Receivables: the header's button opens the panel; a suggested question is answered; its
 * first invoice opens the invoice's page.
 */
export const LiroAssistantAskInteraction: Story = {
  name: 'Liro Assistant, ask, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={X_ROUTES.receivables} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Liro Assistant' }))
    const panel = await assistantPanel()
    await userEvent.click(
      panel.getByRole('button', { name: 'Which invoices are overdue more than 30 days?' }),
    )
    await userEvent.click(await panel.findByRole('link', { name: 'F-2026-0341' }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Invoice F-2026-0341' }),
    ).toBeVisible()
  },
}

/** Post invoice: nothing happened before; after Confirm the outcome with its link. */
export const LiroAssistantConfirmInteraction: Story = {
  name: 'Liro Assistant, confirm the action, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={X_ROUTES.post} />,
  play: async () => {
    const panel = await assistantPanel()
    await userEvent.click(panel.getByRole('button', { name: 'Post invoice' }))
    await expect(panel.getByText(/as entry 2026-0884/)).toBeVisible()
    await expect(panel.queryByRole('button', { name: 'Post invoice' })).toBeNull()
  },
}

/** Stop while it writes, then Try again: the whole answer. */
export const LiroAssistantStopInteraction: Story = {
  name: 'Liro Assistant, stop, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={X_ROUTES.streaming} />,
  play: async () => {
    const panel = await assistantPanel()
    await userEvent.click(panel.getByRole('button', { name: 'Stop' }))
    await expect(panel.getByText('Stopped. The answer may be incomplete.')).toBeVisible()
    await userEvent.click(panel.getByRole('button', { name: 'Try again' }))
    await expect(panel.getByRole('link', { name: 'F-2026-0341' })).toBeVisible()
  },
}

/** Report a wrong answer: a reason, Send report, the thanks. */
export const LiroAssistantReportInteraction: Story = {
  name: 'Liro Assistant, report, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={X_ROUTES.overdue} />,
  play: async () => {
    const panel = await assistantPanel()
    await userEvent.click(panel.getByRole('button', { name: 'Report a wrong answer' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Something is missing' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }))
    await expect(await panel.findByText('Thank you. Your report was sent.')).toBeVisible()
  },
}

/** "Open as a page": the same question on the "Ask" page. */
export const LiroAssistantOpenPageInteraction: Story = {
  name: 'Liro Assistant, open as a page, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={X_ROUTES.revenue} />,
  play: async ({ canvasElement }) => {
    const panel = await assistantPanel()
    await userEvent.click(panel.getByRole('link', { name: 'Open as a page' }))
    await settle()
    await expect(
      await within(canvasElement).findByRole('heading', {
        level: 1,
        name: 'How did revenue change this quarter?',
      }),
    ).toBeVisible()
  },
}

/** The "Ask" page: one large centred box, suggested and recent questions, nothing else. */
const ASK_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'What would you like to know?' }),
  ).toBeVisible()
  await expect(canvas.getByRole('textbox', { name: 'Your question' })).toBeVisible()
  await expect(canvas.getByRole('list', { name: 'Recent questions' })).toBeVisible()
}

export const AskLiro: Story = {
  name: 'Ask Liro',
  render: () => <ExampleApp start={X_ROUTES.ask} />,
  play: async ({ canvasElement }) => {
    await settle()
    await ASK_CHECK(canvasElement)
  },
}

export const AskLiroPhone: Story = {
  name: 'Ask Liro, phone',
  render: () => <OnPhone start={X_ROUTES.ask} />,
  play: async ({ canvasElement }) => {
    await settle()
    await ASK_CHECK(canvasElement)
  },
}

/** An answer as a calm page: the question as the h1, heading, text, chart, list, sources. */
const ASK_ANSWER_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'How did revenue change this quarter?' }),
  ).toBeVisible()
  await expect(
    canvas.getByRole('heading', { level: 2, name: 'Revenue in the third quarter' }),
  ).toBeVisible()
  await expect(canvas.getByRole('textbox', { name: 'Ask a follow-up' })).toBeVisible()
}

export const AskLiroAnswer: Story = {
  name: 'Ask Liro, answer',
  render: () => <ExampleApp start={X_ROUTES.askAnswer('revenue')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await ASK_ANSWER_CHECK(canvasElement)
  },
}

export const AskLiroAnswerPhone: Story = {
  name: 'Ask Liro, answer, phone',
  render: () => <OnPhone start={X_ROUTES.askAnswer('revenue')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await ASK_ANSWER_CHECK(canvasElement)
  },
}

/** A table answer on the page: a real table with its total. */
export const AskLiroTable: Story = {
  name: 'Ask Liro, table answer',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.askAnswer('overdue')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('table')).toHaveTextContent('512.400,00')
  },
}

/** A proposed action on the page. */
export const AskLiroAction: Story = {
  name: 'Ask Liro, proposed action',
  tags: ['!dev'],
  render: () => <ExampleApp start={X_ROUTES.askAnswer('post')} />,
}

/** A suggested question, then "New question" back to the box. */
export const AskLiroInteraction: Story = {
  name: 'Ask Liro, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={X_ROUTES.ask} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Which invoices are overdue more than 30 days?' }),
    )
    await expect(canvas.getByRole('table')).toHaveTextContent('F-2026-0341')
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Ask a follow-up' }),
      'What is the average gross salary on the sites?{Enter}',
    )
    await expect(canvasElement).toHaveTextContent('You do not have permission to see salaries.')
    await userEvent.click(canvas.getByRole('button', { name: 'New question' }))
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'What would you like to know?' }),
    ).toBeVisible()
  },
}

// ── P5.38: e-mail templates ──

/** Kvadrat Gradnja d.o.o.'s e-mail templates: seven, when each is sent, its languages. */
const TEMPLATES_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'E-mail templates' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Invoice e-mail')
  await expect(canvasElement).toHaveTextContent('en · sr-Latn · sr-Cyrl')
}

export const EmailTemplates: Story = {
  name: 'E-mail templates',
  render: () => <ExampleApp start={AB_ROUTES.list} />,
  play: async ({ canvasElement }) => {
    await settle()
    await TEMPLATES_CHECK(canvasElement)
  },
}

export const EmailTemplatesPhone: Story = {
  name: 'E-mail templates, phone',
  render: () => <OnPhone start={AB_ROUTES.list} />,
  play: async ({ canvasElement }) => {
    await settle()
    await TEMPLATES_CHECK(canvasElement)
  },
}

/**
 * The invoice e-mail: English, Serbian (Latin) and Serbian (Cyrillic) as tabs; the subject and
 * the body with merge fields as pills; the preview with Gradska toplana Novi Sad's sample.
 */
const TEMPLATE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Invoice e-mail' })).toBeVisible()
  await expect(canvas.getByRole('tab', { name: 'English' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const preview = canvas.getByRole('region', { name: 'E-mail preview' })
  await expect(preview).toHaveTextContent('Invoice F-2026-0423 from Kvadrat Gradnja d.o.o.')
  await expect(preview).toHaveTextContent('1.284.600,00 RSD due 30.10.2026.')
}

export const EmailTemplate: Story = {
  name: 'E-mail template',
  render: () => <ExampleApp start={AB_ROUTES.template('invoice')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await TEMPLATE_CHECK(canvasElement)
  },
}

export const EmailTemplatePhone: Story = {
  name: 'E-mail template, phone',
  render: () => <OnPhone start={AB_ROUTES.template('invoice')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await TEMPLATE_CHECK(canvasElement)
  },
}

/** The versions in an end Drawer, each with Restore. */
export const EmailTemplateVersions: Story = {
  name: 'E-mail template, versions',
  tags: ['!dev'],
  render: () => <ExampleApp start={AB_ROUTES.versions} />,
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', {
      name: 'Versions Invoice e-mail',
    })
    await settle()
    await expect(within(drawer).getByRole('list', { name: 'Versions' })).toBeVisible()
  },
}

/** "Send test": the address and the sample. */
export const EmailTemplateSendTest: Story = {
  name: 'E-mail template, send test',
  tags: ['!dev'],
  render: () => <ExampleApp start={AB_ROUTES.sendTest} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Send test Invoice e-mail · English',
    })
    await settle()
    await expect(within(dialog).getByRole('textbox', { name: 'Send to' })).toHaveValue(
      'milica.petrovic@example.com',
    )
  },
}

/** The preview at a phone's width in a dark mail client. */
export const EmailTemplateDarkPhone: Story = {
  name: 'E-mail template, dark mail client at 360px',
  tags: ['!dev'],
  render: () => <ExampleApp start={AB_ROUTES.darkPhone} />,
  play: async ({ canvasElement }) => {
    await settle()
    const message = canvasElement.querySelector('[data-slot="email-message"]')
    await expect(message).toHaveAttribute('data-liro-theme', 'dark')
    await expect(message).toHaveAttribute('data-width', 'phone')
  },
}

/**
 * A sample without a payment reference (Stanogradnja Plus d.o.o., F-2026-0428): the field stays a
 * pill marked "No value"; the others are filled in through the provider's format.
 */
export const EmailTemplateNoValue: Story = {
  name: 'E-mail template, a field without a value',
  tags: ['!dev'],
  render: () => <ExampleApp start={AB_ROUTES.noValue} />,
  play: async ({ canvasElement }) => {
    await settle()
    const preview = within(canvasElement).getByRole('region', { name: 'E-mail preview' })
    await expect(preview).toHaveTextContent('322.800,00 RSD due 06.11.2026.')
    await expect(preview).toHaveTextContent('No value: Payment reference')
    await expect(preview.querySelectorAll('[data-missing]')).toHaveLength(1)
  },
}

/** The Serbian Cyrillic variant: the message carries its language (D12, D15). */
export const EmailTemplateCyrillic: Story = {
  name: 'E-mail template, Serbian Cyrillic',
  tags: ['!dev'],
  render: () => <ExampleApp start={AB_ROUTES.cyrillic} />,
  play: async ({ canvasElement }) => {
    await settle()
    const message = canvasElement.querySelector('[data-slot="email-message"]')
    await expect(message).toHaveAttribute('lang', 'sr-Cyrl')
    await expect(message).toHaveTextContent('Рачун F-2026-0423 од Kvadrat Gradnja d.o.o.')
  },
}

/** A language without its variant: "Start from English". */
export const EmailTemplateMissing: Story = {
  name: 'E-mail template, missing language',
  tags: ['!dev'],
  render: () => <ExampleApp start={AB_ROUTES.missing} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Start from English' }),
    ).toBeVisible()
  },
}

/** The subject changes the preview; Srpski (latinica); the dark mail client. */
export const EmailTemplateEditInteraction: Story = {
  name: 'E-mail template, edit and preview, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AB_ROUTES.template('invoice')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const subject = canvas.getByRole('textbox', { name: 'Subject' })
    await userEvent.clear(subject)
    await userEvent.type(subject, 'Your invoice {{{{invoice.number}}')
    const preview = () => canvas.getByRole('region', { name: 'E-mail preview' })
    await expect(preview()).toHaveTextContent('Your invoice F-2026-0423')
    await userEvent.click(canvas.getByRole('tab', { name: 'Srpski (latinica)' }))
    await expect(preview()).toHaveTextContent('Račun F-2026-0423 od Kvadrat Gradnja d.o.o.')
    await userEvent.click(within(preview()).getByRole('radio', { name: 'Dark' }))
    await expect(canvasElement.querySelector('[data-slot="email-message"]')).toHaveAttribute(
      'data-liro-theme',
      'dark',
    )
  },
}

/** Send test: the toast says where it went. */
export const EmailTemplateSendInteraction: Story = {
  name: 'E-mail template, send test, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AB_ROUTES.template('invoice')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Send test' }))
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Send test Invoice e-mail · English',
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send test' }))
    // The toast reports where it went (it slides in, so its words are checked, not its place).
    await waitFor(() =>
      expect(document.body).toHaveTextContent('Test e-mail sent to milica.petrovic@example.com'),
    )
  },
}

// ── P5.39: the blog ──

/** Liro's blog: the lead story, the articles, categories, search, tags, the newsletter. */
const BLOG_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Liro blog' })).toBeVisible()
  await expect(
    canvas.getByRole('link', { name: 'Why e-invoices are rejected, and how to avoid it' }),
  ).toBeVisible()
  await expect(canvas.getByRole('navigation', { name: 'Categories' })).toBeVisible()
  await expect(canvas.getByRole('search', { name: 'Search the blog' })).toBeVisible()
}

export const Blog: Story = {
  name: 'Blog',
  render: () => <ExampleApp start={AC_ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await settle()
    await BLOG_CHECK(canvasElement)
  },
}

export const BlogPhone: Story = {
  name: 'Blog, phone',
  render: () => <OnPhone start={AC_ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await settle()
    await BLOG_CHECK(canvasElement)
  },
}

/** "Why e-invoices are rejected": the reading layout with contents, share, newsletter, related. */
const BLOG_ARTICLE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', {
      level: 1,
      name: 'Why e-invoices are rejected, and how to avoid it',
    }),
  ).toBeVisible()
  await expect(canvas.getByRole('navigation', { name: 'On this page' })).toBeVisible()
  await expect(canvas.getByRole('group', { name: 'Share' })).toBeVisible()
  await expect(canvas.getByRole('heading', { level: 2, name: 'Related articles' })).toBeVisible()
}

export const BlogArticle: Story = {
  name: 'Blog article',
  render: () => <ExampleApp start={AC_ROUTES.post('why-e-invoices-are-rejected')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await BLOG_ARTICLE_CHECK(canvasElement)
  },
}

export const BlogArticlePhone: Story = {
  name: 'Blog article, phone',
  render: () => <OnPhone start={AC_ROUTES.post('why-e-invoices-are-rejected')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await BLOG_ARTICLE_CHECK(canvasElement)
  },
}

/** A category: Accounting, the current one marked neutrally. */
export const BlogCategory: Story = {
  name: 'Blog, category',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.category('accounting')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('link', { name: 'Accounting' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

/** A tag: SEF. */
export const BlogTag: Story = {
  name: 'Blog, tag',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.tag('sef')} />,
}

/** The search: "rejected", the matches marked. */
export const BlogSearch: Story = {
  name: 'Blog, search',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.searchFor('rejected')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('1 article for “rejected”')
    await expect(canvasElement.querySelectorAll('mark').length).toBeGreaterThan(0)
  },
}

/** Nothing found: All articles. */
export const BlogSearchNothing: Story = {
  name: 'Blog, search without results',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.searchFor('fiscal printer')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'All articles' })).toBeVisible()
  },
}

/** Searching from the list: the query goes to the search page. */
export const BlogSearchInteraction: Story = {
  name: 'Blog, search, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AC_ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search the blog' }),
      'payroll{Enter}',
    )
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Search the blog' }),
    ).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Export payroll/ })).toBeVisible()
  },
}

/** Authoring: the posts with Draft, Scheduled and Published. */
const POSTS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Blog posts' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Scheduled')
  await expect(canvasElement).toHaveTextContent('Meet the Liro Assistant')
}

export const BlogPosts: Story = {
  name: 'Blog posts',
  render: () => <ExampleApp start={AC_ROUTES.posts} />,
  play: async ({ canvasElement }) => {
    await settle()
    await POSTS_CHECK(canvasElement)
  },
}

export const BlogPostsPhone: Story = {
  name: 'Blog posts, phone',
  render: () => <OnPhone start={AC_ROUTES.posts} />,
  play: async ({ canvasElement }) => {
    await settle()
    await POSTS_CHECK(canvasElement)
  },
}

/** A draft in the editor: text, cover, address, category and tags, search engines. */
const POST_EDITOR_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Meet the Liro Assistant' }),
  ).toBeVisible()
  await expect(canvas.getByRole('textbox', { name: /^Address/ })).toHaveValue(
    'meet-the-liro-assistant',
  )
  await expect(canvas.getAllByRole('button', { name: 'Publish' })[0]).toBeVisible()
}

export const BlogPostEditor: Story = {
  name: 'Blog post editor',
  render: () => <ExampleApp start={AC_ROUTES.edit('p8')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await POST_EDITOR_CHECK(canvasElement)
  },
}

export const BlogPostEditorPhone: Story = {
  name: 'Blog post editor, phone',
  render: () => <OnPhone start={AC_ROUTES.edit('p8')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await POST_EDITOR_CHECK(canvasElement)
  },
}

/** A scheduled post: when it goes out, Unschedule, Publish now. */
export const BlogPostScheduled: Story = {
  name: 'Blog post editor, scheduled',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.edit('p6')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Goes out 20.10.2026. at 08:00, Belgrade time')
  },
}

/** The schedule dialog. */
export const BlogPostSchedule: Story = {
  name: 'Blog post editor, schedule',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.schedule('p8')} />,
  play: async () => {
    await within(document.body).findByRole('dialog', {
      name: 'Schedule Meet the Liro Assistant',
    })
    await settle()
  },
}

/** The draft as readers will see it, under the Preview banner. */
export const BlogPostPreview: Story = {
  name: 'Blog post, preview',
  tags: ['!dev'],
  render: () => <ExampleApp start={AC_ROUTES.preview('p8')} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Back to editing' }),
    ).toBeVisible()
  },
}

/** Publish asks for the missing search description, then confirms; the post is published. */
export const BlogPostPublishInteraction: Story = {
  name: 'Blog post editor, publish, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AC_ROUTES.edit('p8')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(firstOf(canvas.getAllByRole('button', { name: 'Publish' })))
    await expect(canvasElement).toHaveTextContent('Write a description for search engines.')
    await userEvent.type(
      canvas.getByRole('textbox', { name: /^Description for search engines/ }),
      'Ask Liro about your company in plain words; every action waits for you.',
    )
    await userEvent.click(firstOf(canvas.getAllByRole('button', { name: 'Publish' })))
    const dialog = await within(document.body).findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish' }))
    await expect(await canvas.findByText('Published 14.10.2026.')).toBeVisible()
  },
}

// ── P5.31 docs ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { U_ROUTES } from './data-U'

/** A story's checks on the desktop, and on a phone that nothing scrolls sideways. */
function docsPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/**
 * Kvadrat Gradnja d.o.o.'s document inbox on 14.10.2026 at 09:40: eleven documents to review —
 * uploaded, e-mailed to the inbox address, scanned at the office or received through SEF — with
 * their type, sender, time and state, a new document's condition in words (recognising, not
 * recognised, locked with a password, scan cannot be read); "Add documents" above the list.
 */
const INBOX_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('button', { name: /^To review/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(canvas.getByRole('button', { name: 'Choose files' })).toBeVisible()
  await expect(canvas.getAllByText('Beton Mix d.o.o.').length).toBeGreaterThan(0)
  await expect(canvas.getByText('Locked with a password')).toBeVisible()
  await expect(canvas.getByText('Recognising…')).toBeVisible()
}

export const DocumentInbox: Story = {
  name: 'Document inbox',
  render: () => <ExampleApp start={U_ROUTES.inbox} />,
  play: docsPlay(async (canvasElement) => {
    await INBOX_CHECK(canvasElement)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Review 11 documents' }),
    ).toBeVisible()
  }),
}

export const DocumentInboxPhone: Story = {
  name: 'Document inbox, phone',
  render: () => <OnPhone start={U_ROUTES.inbox} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Take a photo' })).toBeVisible()
    await expect(canvas.getAllByText('Beton Mix d.o.o.').length).toBeGreaterThan(0)
  }, true),
}

/** Every document: posted, rejected (with the reason) and the duplicates too. */
export const DocumentInboxAll: Story = {
  name: 'Document inbox, all',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.inboxAll} />,
  play: docsPlay(async (canvasElement) => {
    const table = within(canvasElement).getByRole('table', { name: 'Documents' })
    await expect(within(table).getAllByText('Posted').length).toBeGreaterThan(0)
    await expect(within(table).getAllByText('Rejected').length).toBe(2)
    await expect(within(table).getByText('Duplicate')).toBeVisible()
  }),
}

/** Three documents checked: "Review" and "Reject…" on the bulk bar. */
export const DocumentInboxChecked: Story = {
  name: 'Document inbox, three checked',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.inboxChecked} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Reject…' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Review' })).toBeVisible()
  }),
}

/** Two files chosen: they arrive as new documents, being recognised. */
export const DocumentInboxUpload: Story = {
  name: 'Document inbox, upload, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={U_ROUTES.inbox} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const input = canvasElement.querySelector<HTMLInputElement>(
      '[data-slot="list-page"] input[type="file"]',
    )
    if (input === null) throw new Error('The file input is missing')
    await userEvent.upload(input, [
      new File(['%PDF-1.7'], 'Racun_DP-344.pdf', { type: 'application/pdf' }),
      new File(['%PDF-1.7'], 'Otpremnica_7790.pdf', { type: 'application/pdf' }),
    ])
    await expect(await canvas.findByText('Racun_DP-344.pdf')).toBeVisible()
    await expect(canvas.getByText('Otpremnica_7790.pdf')).toBeVisible()
    await waitFor(async () => {
      await expect(
        within(document.body).getByText('2 documents are being recognised.'),
      ).toBeVisible()
    })
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

/**
 * The review of Beton Mix d.o.o.'s invoice 2026-1187 (12.10.2026, 294.000,00 RSD): the page beside
 * the recognised fields — the supplier matched by its tax number, the number, the dates (the due
 * date's reading uncertain: "Low confidence"), VAT by rate, the three lines with their suggested
 * accounts (the pump's quantity uncertain) — each with the service's confidence and "Show where it
 * was read". Save for later, Mark as duplicate, Reject and Confirm and post, the main one last.
 */
const REVIEW_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 2, name: 'Beton Mix d.o.o.' })).toBeVisible()
  await expect(canvas.getByRole('textbox', { name: 'Due date' })).toHaveAccessibleDescription(
    /Low confidence/,
  )
  await expect(canvas.getByRole('textbox', { name: 'Number' })).toHaveValue('2026-1187')
  await expect(
    canvas.getAllByRole('button', { name: 'Show where it was read' }).length,
  ).toBeGreaterThan(5)
  await expect(canvasElement).toHaveTextContent(
    'Matched in your suppliers by tax number 106543218.',
  )
}

export const DocumentReview: Story = {
  name: 'Document review',
  render: () => <ExampleApp start={U_ROUTES.review} />,
  play: docsPlay(async (canvasElement) => {
    await REVIEW_CHECK(canvasElement)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Confirm and post' }),
    ).toBeVisible()
  }),
}

export const DocumentReviewPhone: Story = {
  name: 'Document review, phone',
  render: () => <OnPhone start={U_ROUTES.reviewOf('u1')} />,
  play: docsPlay(REVIEW_CHECK, true),
}

/** The due date's region shown on the page: the marker and its name. */
export const DocumentReviewSource: Story = {
  name: 'Document review, where it was read',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewSource} />,
  play: docsPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByText('Highlighted: Due date, page 1 of 1'),
    ).toBeInTheDocument()
  }),
}

/** A scan the service is still recognising: the page, and the fields still to come. */
export const DocumentReviewProcessing: Story = {
  name: 'Document review, recognising',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u8')} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Recognising the document')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Confirm and file' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  }),
}

/** Recognition failed: the fields to enter by hand from the page. */
export const DocumentReviewFailed: Story = {
  name: 'Document review, recognition failed',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u9')} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('The document could not be recognised')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Number' })).toHaveValue('')
    await expect(canvas.queryByText(/^Confidence/)).toBeNull()
  }),
}

/** A PDF locked with a password: "Enter the password…" in place of the page. */
export const DocumentReviewPassword: Story = {
  name: 'Document review, locked PDF',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u5')} />,
  play: docsPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Enter the password…' }),
    ).toBeVisible()
  }),
}

export const DocumentReviewPasswordPhone: Story = {
  name: 'Document review, locked PDF, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={U_ROUTES.reviewOf('u5')} />,
  play: docsPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Enter the password…' }),
    ).toBeVisible()
  }, true),
}

/** A photo out of focus: upload a better copy, or enter it by hand. */
export const DocumentReviewUnreadable: Story = {
  name: 'Document review, unreadable scan',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u7')} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('The scan cannot be read')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Enter by hand' })).toBeVisible()
  }),
}

/** A photo of 2026-1187 uploaded the next day: the application suspects a duplicate. */
export const DocumentReviewDuplicate: Story = {
  name: 'Document review, possible duplicate',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u6')} />,
  play: docsPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('This may be a duplicate')).toBeVisible()
  }),
}

/** "Mark as duplicate…" asked for the photo: the original chosen. */
export const DocumentReviewMarkDuplicate: Story = {
  name: 'Document review, mark as duplicate',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewDuplicate} />,
  play: docsPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', { name: /^Mark as duplicate/ })
    await expect(within(dialog).getByRole('radio')).toBeChecked()
  }),
}

/** "Reject…" asked for 2026-1187: the reasons. */
export const DocumentReviewReject: Story = {
  name: 'Document review, reject',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewReject} />,
  play: docsPlay(async () => {
    const dialog = within(document.body).getByRole('alertdialog', { name: /^Reject/ })
    await expect(within(dialog).getByText('Not addressed to us')).toBeVisible()
  }),
}

/** A supplier the catalog does not have: its tax number read, "+ Create supplier" offered. */
export const DocumentReviewNewSupplier: Story = {
  name: 'Document review, new supplier',
  tags: ['!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u17')} />,
  play: docsPlay(async (canvasElement) => {
    await expect(canvasElement).toHaveTextContent('Not in your suppliers: tax number 109876543')
  }),
}

/** "Show where it was read" on the total marks it on the page; pressed again, it goes. */
export const DocumentReviewShowSource: Story = {
  name: 'Document review, show where it was read, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={U_ROUTES.review} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas
      .getByRole('textbox', { name: /^Total/ })
      .closest<HTMLElement>('[data-slot="recognized-field"]')
    if (field === null) throw new Error('The total is not a recognised field')
    const show = within(field).getByRole('button', { name: 'Show where it was read' })
    await userEvent.click(show)
    await expect(show).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText('Highlighted: Total, page 1 of 1')).toBeInTheDocument()
    await userEvent.click(show)
    await expect(show).toHaveAttribute('aria-pressed', 'false')
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

/** Keyboard first: Enter in a field confirms and posts, and the next document opens. */
export const DocumentReviewEnter: Story = {
  name: 'Document review, Enter confirms, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={U_ROUTES.review} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Number' }))
    await userEvent.keyboard('{Enter}')
    await waitFor(async () => {
      await expect(
        within(document.body).getByText('Supplier invoice 2026-1187 posted as UF-2026-1236.'),
      ).toBeVisible()
    })
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Beton Mix d.o.o.')
      await expect(canvas.getByText('This may be a duplicate')).toBeVisible()
    })
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

/** Rejected with a reason: the next document opens, the list says Rejected. */
export const DocumentReviewRejectFlow: Story = {
  name: 'Document review, reject, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u17')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Reject…' }))
    const dialog = await within(document.body).findByRole('alertdialog', { name: /^Reject/ })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Not addressed to us' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))
    await waitFor(async () => {
      await expect(
        within(document.body).getByText('Supplier invoice AR-2026-077 rejected.'),
      ).toBeVisible()
    })
    await waitFor(async () => {
      await expect(canvas.getAllByText('Rejected').length).toBeGreaterThan(0)
    })
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

/** An unreadable scan entered by hand: the fields appear, Confirm waits for what is missing. */
export const DocumentReviewByHand: Story = {
  name: 'Document review, enter by hand, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={U_ROUTES.reviewOf('u7')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Enter by hand' }))
    await expect(await canvas.findByRole('textbox', { name: 'Number' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Enter the supplier, the number and the total.')
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

// ── P5.33 docs ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { W_ROUTES } from './data-W'

/**
 * Kvadrat Gradnja d.o.o.'s statements of open items at the cut-off date 30.09.2026, on
 * 14.10.2026: fourteen partners with their balance in our books and the statement's state — four
 * not sent, four waiting for an answer, Elektro Sistem d.o.o. disputed (their balance
 * 300.000,00 RSD), two without an answer after a reminder, three confirmed.
 */
const IOS_LIST_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(canvas.getAllByText('Elektro Sistem d.o.o.').length).toBeGreaterThan(0)
  await expect(canvas.getAllByText('Disputed').length).toBeGreaterThan(0)
  await expect(canvas.getAllByText('No answer').length).toBeGreaterThan(0)
}

export const IosPartners: Story = {
  name: 'IOS partners',
  render: () => <ExampleApp start={W_ROUTES.list} />,
  play: docsPlay(async (canvasElement) => {
    await IOS_LIST_CHECK(canvasElement)
    await expect(canvasElement).toHaveTextContent('Their balance 300.000,00 RSD')
  }),
}

export const IosPartnersPhone: Story = {
  name: 'IOS partners, phone',
  render: () => <OnPhone start={W_ROUTES.list} />,
  play: docsPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getAllByText('Elektro Sistem d.o.o.').length,
    ).toBeGreaterThan(0)
  }, true),
}

/** The four partners not sent yet, and "Prepare statements…": the cut-off date, how they go. */
export const IosPartnersPrepare: Story = {
  name: 'IOS partners, prepare',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.prepare} />,
  play: docsPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', { name: 'Send 4 statements?' })
    await expect(within(dialog).getByRole('textbox', { name: /^Cut-off date/ })).toHaveValue(
      '30.09.2026.',
    )
    await expect(
      within(dialog).getByText('2 of 4 partners have Liro Bridge; the others get an e-mail.'),
    ).toBeVisible()
  }),
}

export const IosPartnersPreparePhone: Story = {
  name: 'IOS partners, prepare, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={W_ROUTES.prepare} />,
  play: docsPlay(async () => {
    await expect(
      within(document.body).getByRole('dialog', { name: 'Send 4 statements?' }),
    ).toBeVisible()
  }, true),
}

/** The preview of the first statement, as the partner receives it. */
export const IosPartnersPreview: Story = {
  name: 'IOS partners, preview',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.preview} />,
  play: docsPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', { name: /^Send 4 statements\?/ })
    await expect(
      within(dialog).getByRole('heading', { name: 'Statement of open items' }),
    ).toBeVisible()
    await expect(within(dialog).getByRole('combobox', { name: 'Partner' })).toBeVisible()
  }),
}

/** Three partners waiting for an answer checked, and "Send reminder…" asked. */
export const IosPartnersRemind: Story = {
  name: 'IOS partners, reminder',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.remind} />,
  play: docsPlay(async () => {
    await expect(
      within(document.body).getByRole('alertdialog', { name: 'Send a reminder to 3 partners?' }),
    ).toBeVisible()
  }),
}

/** The Disputed view. */
export const IosPartnersDisputed: Story = {
  name: 'IOS partners, disputed',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.disputed} />,
  play: docsPlay(async (canvasElement) => {
    const table = within(canvasElement).getByRole('table', { name: 'Partners' })
    await expect(within(table).getByText('Elektro Sistem d.o.o.')).toBeVisible()
  }),
}

/** Four partners chosen, previewed and sent: they wait for an answer. */
export const IosPartnersSend: Story = {
  name: 'IOS partners, prepare and send, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={W_ROUTES.list} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Prepare statements…' }))
    const dialog = await within(document.body).findByRole('dialog', { name: 'Send 4 statements?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Preview…' }))
    await waitFor(async () => {
      await expect(
        within(dialog).getByRole('heading', { name: 'Statement of open items' }),
      ).toBeVisible()
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send 4 statements' }))
    await waitFor(async () => {
      await expect(within(document.body).getByText('4 statements sent.')).toBeVisible()
    })
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /^Not sent/ })).toHaveTextContent('0')
    })
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

/**
 * Elektro Sistem d.o.o.'s dispute worked line by line (the bank statement's pattern): our books
 * 180.000,00, theirs 300.000,00. Our payment of ES-2026-0498 (84.000,00) left on 30.09.2026 and
 * they booked it on 01.10.2026; ES-2026-0533 (36.000,00, 28.09.2026) is theirs only — it reached
 * our document inbox through SEF on 13.10.2026. Our open items beside theirs, the differences
 * marked; the suggestion preselected; "Send our answer" once nothing is left.
 */
const RECONCILE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('IOS-2026-0042')
  await expect(canvas.getByText('0 of 2 differences resolved')).toBeVisible()
  await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('ES-2026-0498')
  await expect(canvas.getAllByText('Dates differ').length).toBeGreaterThan(0)
}

export const IosReconciliation: Story = {
  name: 'IOS reconciliation',
  render: () => <ExampleApp start={W_ROUTES.reconcile} />,
  play: docsPlay(async (canvasElement) => {
    await RECONCILE_CHECK(canvasElement)
    await expect(within(canvasElement).getByRole('radio', { name: /^Timing/ })).toBeChecked()
  }),
}

export const IosReconciliationPhone: Story = {
  name: 'IOS reconciliation, phone',
  render: () => <OnPhone start={W_ROUTES.reconcileItem('r2')} />,
  play: docsPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByRole('heading', { level: 2 })).toHaveTextContent(
      'ES-2026-0498',
    )
  }, true),
}

/** The invoice only in their statement, and where it is: the document inbox. */
export const IosReconciliationMissing: Story = {
  name: 'IOS reconciliation, invoice only in theirs',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.reconcileItem('r4')} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Only in their statement').length).toBeGreaterThan(0)
    await expect(canvas.getByRole('button', { name: 'Open in the document inbox' })).toBeVisible()
  }),
}

/** A line both sides have the same. */
export const IosReconciliationMatch: Story = {
  name: 'IOS reconciliation, a match',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.reconcileItem('r1')} />,
  play: docsPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('No differences')).toBeVisible()
  }),
}

/** Both differences resolved: nothing is left unexplained, "Send our answer" can be used. */
export const IosReconciliationResolved: Story = {
  name: 'IOS reconciliation, resolved',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.resolved} />,
  play: docsPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('2 of 2 differences resolved')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Send our answer' })).toBeEnabled()
  }),
}

/** Both differences resolved one after the other, then our answer sent. */
export const IosReconciliationResolve: Story = {
  name: 'IOS reconciliation, resolve and answer, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={W_ROUTES.reconcile} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Resolve and next' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('ES-2026-0533')
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Resolve and next' }))
    await expect(await canvas.findByText('2 of 2 differences resolved')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Send our answer' }))
    const dialog = await within(document.body).findByRole('alertdialog', {
      name: /^Send our answer/,
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send our answer' }))
    await expect(await canvas.findByText('Reconciled')).toBeVisible()
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

/**
 * The partner's side: Jelena Popović of Elektro Sistem d.o.o. in Liro's partner portal sees
 * Kvadrat Gradnja d.o.o.'s statement — its open items, the balance 180.000,00 RSD — before she
 * answers: Confirm, or Dispute with her figures and a note.
 */
const PORTAL_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Statement of open items' }),
  ).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Confirm' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent('180.000,00')
}

export const IosPartnerPortal: Story = {
  name: 'IOS partner portal',
  render: () => <ExampleApp start={W_ROUTES.portal} />,
  play: docsPlay(PORTAL_CHECK),
}

export const IosPartnerPortalPhone: Story = {
  name: 'IOS partner portal, phone',
  render: () => <OnPhone start={W_ROUTES.portal} />,
  play: docsPlay(PORTAL_CHECK, true),
}

/** "Dispute…": their balance, what differs and their open items. */
export const IosPartnerPortalDispute: Story = {
  name: 'IOS partner portal, dispute',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.portalDispute} />,
  play: docsPlay(async () => {
    const drawer = within(document.body).getByRole('dialog', { name: /^Dispute/ })
    await expect(within(drawer).getByRole('button', { name: 'Send dispute' })).toBeVisible()
    await expect(
      within(drawer).getByText('Elektro_Sistem_otvorene_stavke_30-09-2026.pdf'),
    ).toBeVisible()
  }),
}

export const IosPartnerPortalDisputePhone: Story = {
  name: 'IOS partner portal, dispute, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={W_ROUTES.portalDispute} />,
  play: docsPlay(async () => {
    await expect(within(document.body).getByRole('dialog', { name: /^Dispute/ })).toBeVisible()
  }, true),
}

/** After the dispute: their answer, and that Kvadrat Gradnja answers here. */
export const IosPartnerPortalDisputed: Story = {
  name: 'IOS partner portal, disputed',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.portalDisputed} />,
  play: docsPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('You disputed this statement')).toBeVisible()
  }),
}

/** "Confirm" asked. */
export const IosPartnerPortalConfirm: Story = {
  name: 'IOS partner portal, confirm',
  tags: ['!dev'],
  render: () => <ExampleApp start={W_ROUTES.portalConfirm} />,
  play: docsPlay(async () => {
    await expect(
      within(document.body).getByRole('alertdialog', { name: /^Confirm the balance/ }),
    ).toBeVisible()
  }),
}

/** The dispute written and sent: the statement says Disputed, with her answer. */
export const IosPartnerPortalDisputeFlow: Story = {
  name: 'IOS partner portal, dispute, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={W_ROUTES.portal} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Dispute…' }))
    const drawer = await within(document.body).findByRole('dialog', { name: /^Dispute/ })
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send dispute' }))
    await waitFor(async () => {
      await expect(within(drawer).getByText('Enter your balance.')).toBeVisible()
    })
    const balance = within(drawer).getByRole('textbox', { name: /^Balance in your books/ })
    await userEvent.type(balance, '300000{Enter}')
    await userEvent.type(
      within(drawer).getByRole('textbox', { name: /^What differs/ }),
      'ES-2026-0533 and ES-2026-0498 are open in our books.',
    )
    await userEvent.click(within(drawer).getByRole('button', { name: 'Send dispute' }))
    await waitFor(async () => {
      await expect(canvas.getByText('You disputed this statement')).toBeVisible()
    })
    await expect(canvasElement).toHaveTextContent('300.000,00')
    // The toast and the dialogs finish moving before the checks of the page.
    await settle()
  },
}

// ── P5.41 map ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { mapReady } from '../../../../packages/ui/src/map/map-story-data'
import { AE_ROUTES, AF_ROUTES } from './data-AE'
import { AG_ROUTES } from './data-AG'

/**
 * Kvadrat Gradnja's property-tax view (P5.41): the illustrative zones of Novi Sad on AreaMap, its
 * three properties, and the zone the chosen one falls in.
 */
const ZONES_CHECK = async (canvasElement: HTMLElement, zone: string) => {
  await mapReady(canvasElement)
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Property tax zones' })).toBeVisible()
  await expect(canvasElement).toHaveTextContent(`Falls in: ${zone}`)
  await expect(
    canvas.getByRole('region', { name: 'Map: Illustrative zones of Novi Sad' }),
  ).toBeVisible()
}

export const PropertyTaxZones: Story = {
  name: 'Property tax zones',
  render: () => <ExampleApp start={AE_ROUTES.zones} />,
  play: async ({ canvasElement }) => {
    await ZONES_CHECK(canvasElement, 'Zone II')
  },
}

export const PropertyTaxZonesPhone: Story = {
  name: 'Property tax zones, phone',
  render: () => <OnPhone start={AE_ROUTES.zones} />,
  play: async ({ canvasElement }) => {
    await ZONES_CHECK(canvasElement, 'Zone II')
  },
}

/** The warehouse chosen, as the application restores it: Zone III. */
export const PropertyTaxZonesWarehouse: Story = {
  name: 'Property tax zones, warehouse',
  tags: ['!dev'],
  render: () => <ExampleApp start={AE_ROUTES.warehouse} />,
  play: async ({ canvasElement }) => {
    await ZONES_CHECK(canvasElement, 'Zone III')
  },
}

/** Choosing a property moves the point and marks its zone. */
export const PropertyTaxZonesInteraction: Story = {
  name: 'Property tax zones, choose a property, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AE_ROUTES.zones} />,
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: /Head office/ }))
    await expect(canvasElement).toHaveTextContent('Falls in: Zone I')
    await expect(canvas.getByRole('option', { name: /Zone I\b/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

/**
 * Nikola Marković checks in at Site Liman 4 from his phone (P5.41): inside 150 m of the gate, so
 * Check in is available.
 */
const CHECK_IN_CHECK = async (canvasElement: HTMLElement, state: string) => {
  await mapReady(canvasElement)
  await expect(canvasElement).toHaveTextContent(state)
  await expect(
    within(canvasElement).getByRole('region', { name: 'Map: Site Liman 4' }),
  ).toBeVisible()
}

export const SiteCheckIn: Story = {
  name: 'Site check-in',
  render: () => <ExampleApp start={AF_ROUTES.checkIn} />,
  play: async ({ canvasElement }) => {
    await CHECK_IN_CHECK(canvasElement, 'Inside the allowed area')
    await expect(
      within(canvasElement).getByRole('button', { name: 'Check in' }),
    ).not.toHaveAttribute('aria-disabled')
  },
}

export const SiteCheckInPhone: Story = {
  name: 'Site check-in, phone',
  render: () => <OnPhone start={AF_ROUTES.checkIn} />,
  play: async ({ canvasElement }) => {
    await CHECK_IN_CHECK(canvasElement, 'Inside the allowed area')
  },
}

/** On the tram, about 800 m away: the check-in waits, with its reason. */
export const SiteCheckInOutside: Story = {
  name: 'Site check-in, outside',
  tags: ['!dev'],
  render: () => <OnPhone start={AF_ROUTES.outside} />,
  play: async ({ canvasElement }) => {
    await CHECK_IN_CHECK(canvasElement, 'Outside the allowed area')
    await expect(canvasElement).toHaveTextContent('Check in when you are at the site.')
  },
}

export const SiteCheckInUnknown: Story = {
  name: 'Site check-in, unknown',
  tags: ['!dev'],
  render: () => <OnPhone start={AF_ROUTES.unknown} />,
  play: async ({ canvasElement }) => {
    await CHECK_IN_CHECK(canvasElement, 'Location not known yet')
  },
}

export const SiteCheckInDenied: Story = {
  name: 'Site check-in, location off',
  tags: ['!dev'],
  render: () => <OnPhone start={AF_ROUTES.denied} />,
  play: async ({ canvasElement }) => {
    await CHECK_IN_CHECK(canvasElement, 'Location access is off')
  },
}

/** Use my location: the application answers, decides "inside", and Check in works. */
export const SiteCheckInInteraction: Story = {
  name: 'Site check-in, use my location, interaction',
  tags: ['interaction', '!dev'],
  render: () => <OnPhone start={AF_ROUTES.unknown} />,
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Use my location' }))
    // Unavailable is aria-disabled, which toBeEnabled does not see: wait for the verdict.
    await waitFor(
      async () => {
        await expect(canvas.getByRole('button', { name: 'Check in' })).not.toHaveAttribute(
          'aria-disabled',
          'true',
        )
      },
      { timeout: 5_000 },
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Check in' }))
    await waitFor(async () => {
      await expect(canvasElement).toHaveTextContent('Checked in at')
    })
    notice.dismiss()
  },
}

/**
 * Kvadrat Gradnja group's revenue by country (P5.41, maps in charts): seven countries in shades of
 * the main blue, Albania hatched with "No data", the subsidiaries' seats as points.
 */
const REGION_CHART_CHECK = async (canvasElement: HTMLElement, heading: string, map: string) => {
  await mapReady(canvasElement)
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  await expect(canvas.getByRole('region', { name: `Map: ${map}` })).toBeVisible()
}

export const GroupRevenueByCountry: Story = {
  name: 'Group revenue by country',
  render: () => <ExampleApp start={AG_ROUTES.countries} />,
  play: async ({ canvasElement }) => {
    await REGION_CHART_CHECK(canvasElement, 'Group revenue by country', 'Revenue by country')
    await expect(canvasElement).toHaveTextContent('No data')
  },
}

export const GroupRevenueByCountryPhone: Story = {
  name: 'Group revenue by country, phone',
  render: () => <OnPhone start={AG_ROUTES.countries} />,
  play: async ({ canvasElement }) => {
    await REGION_CHART_CHECK(canvasElement, 'Group revenue by country', 'Revenue by country')
  },
}

/** Sales by illustrative region of Serbia, the sales offices as bubbles. */
export const SalesByRegion: Story = {
  name: 'Sales by region',
  render: () => <ExampleApp start={AG_ROUTES.regions} />,
  play: async ({ canvasElement }) => {
    await REGION_CHART_CHECK(canvasElement, 'Sales by region', 'Sales by illustrative region')
    await expect(canvasElement).toHaveTextContent('Illustrative regions')
  },
}

export const SalesByRegionPhone: Story = {
  name: 'Sales by region, phone',
  render: () => <OnPhone start={AG_ROUTES.regions} />,
  play: async ({ canvasElement }) => {
    await REGION_CHART_CHECK(canvasElement, 'Sales by region', 'Sales by illustrative region')
  },
}

/** The keys move over the regions and Enter shows the chosen one's figures under the chart. */
export const SalesByRegionInteraction: Story = {
  name: 'Sales by region, choose a region, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AG_ROUTES.regions} />,
  play: async ({ canvasElement }) => {
    await mapReady(canvasElement)
    const canvas = within(canvasElement)
    canvas.getByRole('region', { name: 'Map: Sales by illustrative region' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector('[data-slot="region-chart-tooltip"]'),
      ).toHaveTextContent('North')
    })
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('heading', { level: 2, name: 'North' })).toBeVisible()
  },
}

// ── P5.42 org ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { AJ_ROUTES } from './data-AJ'

/** A story's checks, and on a phone that nothing scrolls sideways. */
function orgPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/**
 * Kvadrat Gradnja d.o.o.'s organisation on 14.10.2026: forty people under the director Nenad
 * Kovačević — Finance and administration (Milica Petrović), Human resources, Sales, Procurement
 * and warehouse with an open Buyer position, and Construction with the site managers of Liman 4,
 * Bulevar Evrope 24 and Hall B extension; three levels open, a crew as a list, "+N" on the
 * closed nodes.
 */
const ORG_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('tab', { name: 'People' })).toHaveAttribute('aria-selected', 'true')
  await expect(canvas.getByRole('treeitem', { name: /^Nenad Kovačević/ })).toBeVisible()
  await expect(canvas.getByRole('treeitem', { name: /^Snežana Popović/ })).toBeVisible()
}

export const OrganisationChart: Story = {
  name: 'Organisation chart',
  render: () => <ExampleApp start={AJ_ROUTES.chart} />,
  play: orgPlay(async (canvasElement) => {
    await ORG_CHECK(canvasElement)
    await expect(
      within(canvasElement).getByRole('treeitem', { name: /^Buyer, construction materials/ }),
    ).toBeVisible()
  }),
}

export const OrganisationChartPhone: Story = {
  name: 'Organisation chart, phone',
  render: () => <OnPhone start={AJ_ROUTES.chart} />,
  play: orgPlay(ORG_CHECK, true),
}

/** The same company by its units: the head and the headcount, the open position counted. */
export const OrganisationChartUnits: Story = {
  name: 'Organisation chart, units',
  tags: ['!dev'],
  render: () => <ExampleApp start={AJ_ROUTES.units} />,
  play: orgPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('treeitem', { name: /^Construction, Head: Goran Medić/ }),
    ).toBeVisible()
    await expect(canvas.getByText('1 vacant')).toBeVisible()
  }),
}

/** Milica Petrović's card: the external accountant is a secondary relation, listed, not drawn. */
export const OrganisationChartCard: Story = {
  name: 'Organisation chart, a person’s card',
  tags: ['!dev'],
  render: () => <ExampleApp start={AJ_ROUTES.card} />,
  play: orgPlay(async () => {
    const drawer = within(document.body).getByRole('dialog', { name: /^Milica Petrović/ })
    await expect(within(drawer).getByText('Snežana Jelić, Knjigovodstvo Jelić')).toBeVisible()
  }),
}

export const OrganisationChartCardPhone: Story = {
  name: 'Organisation chart, a person’s card, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AJ_ROUTES.card} />,
  play: orgPlay(async () => {
    await expect(
      within(document.body).getByRole('dialog', { name: /^Milica Petrović/ }),
    ).toBeVisible()
  }, true),
}

/** "Marković": three people; the first revealed and chosen. */
export const OrganisationChartSearch: Story = {
  name: 'Organisation chart, search',
  tags: ['!dev'],
  render: () => <ExampleApp start={AJ_ROUTES.search} />,
  play: orgPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 of 3 found')).toBeVisible()
  }),
}

/** The Liman 4 site alone, with its way back up. */
export const OrganisationChartUnit: Story = {
  name: 'Organisation chart, one site',
  tags: ['!dev'],
  render: () => <ExampleApp start={AJ_ROUTES.unit} />,
  play: orgPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('navigation', { name: 'Path to the unit' })).toBeVisible()
    await expect(canvas.queryByText('Dragan Ilić')).toBeNull()
  }),
}

export const OrganisationChartUnitPhone: Story = {
  name: 'Organisation chart, one site, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AJ_ROUTES.unit} />,
  play: orgPlay(async (canvasElement) => {
    await expect(within(canvasElement).queryByText('Dragan Ilić')).toBeNull()
  }, true),
}

/** Search for a worker, open the card, show the site alone and back. */
export const OrganisationChartFlow: Story = {
  name: 'Organisation chart, search and card, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AJ_ROUTES.chart} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Find a person or position' }),
      'Nikola Mar',
    )
    const nikola = canvas.getByRole('treeitem', { name: 'Nikola Marković, Site worker' })
    await waitFor(async () => {
      await expect(nikola).toHaveAttribute('aria-selected', 'true')
    })
    const box = nikola.querySelector<HTMLElement>('[data-slot="hierarchy-node"]') ?? nikola
    await userEvent.click(box)
    const drawer = await within(document.body).findByRole('dialog', { name: /^Nikola Marković/ })
    await waitFor(async () => {
      await expect(within(drawer).getByText('Residential building Liman 4')).toBeVisible()
    })
    await userEvent.keyboard('{Escape}')
    await settle()
  },
}

/**
 * Kvadrat group: Kvadrat Holding d.o.o. owns Kvadrat Gradnja d.o.o. (100%), Kvadrat Beton d.o.o.
 * (60%) and a quarter of Novosadske fasade d.o.o. (25%, an associate); Kvadrat Gradnja owns
 * Liman 4 Stanovi d.o.o. (51%) and Kvadrat Nekretnine d.o.o. (100%).
 */
const GROUP_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getAllByText('Kvadrat Beton d.o.o.').length).toBeGreaterThan(0)
  await expect(canvasElement).toHaveTextContent('60%')
  await expect(canvasElement).toHaveTextContent('51%')
}

export const CompanyGroup: Story = {
  name: 'Company group',
  render: () => <ExampleApp start={AJ_ROUTES.group} />,
  play: orgPlay(async (canvasElement) => {
    await GROUP_CHECK(canvasElement)
    await expect(within(canvasElement).getByText('Associate')).toBeVisible()
  }),
}

export const CompanyGroupPhone: Story = {
  name: 'Company group, phone',
  render: () => <OnPhone start={AJ_ROUTES.group} />,
  play: orgPlay(GROUP_CHECK, true),
}

/** Kvadrat Beton d.o.o.'s card: the share and the other owner. */
export const CompanyGroupCard: Story = {
  name: 'Company group, a company’s card',
  tags: ['!dev'],
  render: () => <ExampleApp start={AJ_ROUTES.groupCard} />,
  play: orgPlay(async () => {
    const drawer = within(document.body).getByRole('dialog', { name: /^Kvadrat Beton/ })
    await expect(within(drawer).getByText('Kvadrat Holding d.o.o., 60%')).toBeVisible()
  }),
}

// ── P5.43 files ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { AH_ROUTES } from './data-AH'
import { AI_ROUTES } from './data-AI'

/** A files story's checks, and on a phone that nothing scrolls sideways. */
function filesPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/**
 * Kvadrat Gradnja d.o.o.'s company documents on 14.10.2026 at 09:40, as Milica Petrović sees
 * them: "Residential building Liman 4" in the site documentation — its folders, the delivery note
 * linked to invoice F-2026-0412, the interim situation, the plan of works; the folder tree with
 * Contracts, Employee files, Site documentation, Finance and Company records; Recent, Favourites,
 * Shared with me and Trash; 38,4 GB of 50 GB used.
 */
const COMPANY_DOCUMENTS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Residential building Liman 4' }),
  ).toBeVisible()
  await expect(canvas.getByText('Otpremnica_uz_F-2026-0412.pdf')).toBeVisible()
  await expect(canvas.getAllByRole('link', { name: 'Invoice F-2026-0412' }).length).toBeGreaterThan(
    0,
  )
}

export const CompanyDocuments: Story = {
  name: 'Company documents',
  render: () => <ExampleApp start={AH_ROUTES.liman4} />,
  play: filesPlay(async (canvasElement) => {
    await COMPANY_DOCUMENTS_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('treeitem', { name: 'Residential building Liman 4' }),
    ).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByText('38,4 GB of 50 GB')).toBeVisible()
  }),
}

export const CompanyDocumentsPhone: Story = {
  name: 'Company documents, phone',
  render: () => <OnPhone start={AH_ROUTES.liman4} />,
  play: filesPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Back to Site documentation' })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Actions: Otpremnica_uz_F-2026-0412.pdf' }),
    ).toBeVisible()
  }, true),
}

/** The delivery note of F-2026-0412 in the preview: the first of the folder's four files. */
const PREVIEW_CHECK = async () => {
  const sheet = within(document.body).getByRole('dialog', {
    name: /Otpremnica_uz_F-2026-0412\.pdf/,
  })
  await expect(within(sheet).getByRole('button', { name: 'Next file' })).toBeVisible()
  await expect(within(sheet).getByRole('button', { name: 'Download' })).toBeVisible()
}

export const CompanyDocumentPreview: Story = {
  name: 'Company document preview',
  render: () => <ExampleApp start={AH_ROUTES.preview} />,
  play: filesPlay(PREVIEW_CHECK),
}

export const CompanyDocumentPreviewPhone: Story = {
  name: 'Company document preview, phone',
  render: () => <OnPhone start={AH_ROUTES.preview} />,
  play: filesPlay(PREVIEW_CHECK, true),
}

/** A drawing the browser cannot show: Download instead. */
export const CompanyDocumentNoPreview: Story = {
  name: 'Company document preview, no preview',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.previewDrawing} />,
  play: filesPlay(async () => {
    await expect(within(document.body).getByText('This file cannot be previewed')).toBeVisible()
  }),
}

/** The site photos as a grid of pictures. */
export const CompanyDocumentsGrid: Story = {
  name: 'Company documents, photos as a grid',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.photosGrid} />,
  play: filesPlay(async (canvasElement) => {
    const grid = within(canvasElement).getByRole('list', { name: 'Site photos' })
    await expect(grid.querySelectorAll('[data-file-tile]')).toHaveLength(6)
  }),
}

/** Two files checked: Download as ZIP, Move to…, Move to Trash. */
export const CompanyDocumentsChecked: Story = {
  name: 'Company documents, two checked',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.liman4Checked} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('2 selected')).toBeVisible()
  }),
}

/** The delivery note's details: linked to F-2026-0412, kept until 2036, two versions. */
export const CompanyDocumentDetails: Story = {
  name: 'Company documents, details',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.deliveryNote} />,
  play: filesPlay(async (canvasElement) => {
    const details = within(canvasElement).getByRole('complementary', { name: 'Details' })
    await expect(within(details).getByText('Keep until 2036')).toBeVisible()
    await expect(within(details).getByRole('link', { name: 'Invoice F-2026-0412' })).toBeVisible()
    await expect(within(details).getByText('Version 2')).toBeVisible()
  }),
}

export const CompanyDocumentDetailsPhone: Story = {
  name: 'Company documents, details, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AH_ROUTES.deliveryNote} />,
  play: filesPlay(async () => {
    const drawer = within(document.body).getByRole('dialog', { name: /Otpremnica_uz_F-2026-0412/ })
    await expect(within(drawer).getByText('Keep until 2036')).toBeVisible()
  }, true),
}

/** Nikola Marković's employee file: his contract, safety certificate, medical certificate. */
export const CompanyDocumentsEmployeeFile: Story = {
  name: 'Company documents, employee file',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.employee} />,
  play: filesPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Nikola Marković' })).toBeVisible()
    await expect(
      canvas.getByText('Employee files hold personal data: every opening is recorded.'),
    ).toBeVisible()
  }),
}

/** The director's file: no access, with the application's reason. */
export const CompanyDocumentsNoAccess: Story = {
  name: 'Company documents, no access',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.director} />,
  play: filesPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByText('You do not have access to this folder'),
    ).toBeVisible()
  }),
}

/** The site's inspections: an empty folder. */
export const CompanyDocumentsEmpty: Story = {
  name: 'Company documents, empty folder',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.inspections} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('This folder is empty')).toBeVisible()
  }),
}

/** "Upload" in the site photos: what is accepted, files or a whole folder. */
export const CompanyDocumentsUpload: Story = {
  name: 'Company documents, upload',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.upload} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', { name: /^Upload files/ })
    await expect(within(dialog).getByRole('button', { name: 'Choose a folder' })).toBeVisible()
  }),
}

/** Photos uploading: uploading, checked for viruses, done, blocked. */
export const CompanyDocumentsUploading: Story = {
  name: 'Company documents, uploading',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.uploading} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('1 of 4 uploaded')).toBeVisible()
  }),
}

/** Three photos whose names are taken: Replace / Keep both / Skip, "Apply to all". */
export const CompanyDocumentsConflict: Story = {
  name: 'Company documents, name conflict',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.conflict} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', {
      name: /^A file with this name exists/,
    })
    await expect(within(dialog).getByText('Conflict 1 of 3')).toBeVisible()
  }),
}

export const CompanyDocumentsConflictPhone: Story = {
  name: 'Company documents, name conflict, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AH_ROUTES.conflict} />,
  play: filesPlay(async () => {
    await expect(
      within(document.body).getByRole('dialog', { name: /^A file with this name exists/ }),
    ).toBeVisible()
  }, true),
}

/** "Move to…" for the plan of works: the folder picker. */
export const CompanyDocumentsMove: Story = {
  name: 'Company documents, move to',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.move} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move to Plan_radova_Liman_4.xlsx',
    })
    await expect(within(dialog).getByRole('tree', { name: 'Folders' })).toBeVisible()
  }),
}

/** "Share…" for the site documentation: the site manager, the office, the customer's portal. */
export const CompanyDocumentsShare: Story = {
  name: 'Company documents, share',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.share} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Share Site documentation',
    })
    await expect(within(dialog).getByText('Stanogradnja Plus d.o.o.')).toBeVisible()
  }),
}

/** The maintenance contract with Gradska toplana waits for Milica's signature. */
export const CompanyDocumentsSign: Story = {
  name: 'Company documents, sign',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.sign} />,
  play: filesPlay(async (canvasElement) => {
    const details = within(canvasElement).getByRole('complementary', { name: 'Details' })
    await expect(within(details).getByText('1 of 3 signed')).toBeVisible()
    await expect(within(details).getByRole('button', { name: 'Sign' })).toBeVisible()
  }),
}

/** "liman" searched everywhere: results with their folders. */
export const CompanyDocumentsSearch: Story = {
  name: 'Company documents, search everywhere',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.search} />,
  play: filesPlay(async (canvasElement) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Search results' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Everywhere' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  }),
}

/** Trash: where each item was, when it was deleted, Restore, and "Empty Trash…". */
export const CompanyDocumentsTrash: Story = {
  name: 'Company documents, Trash',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.trash} />,
  play: filesPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByText('Zapisnik_primopredaje_lokacije_stari.pdf'),
    ).toBeVisible()
  }),
}

export const CompanyDocumentsEmptyTrash: Story = {
  name: 'Company documents, empty Trash',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.emptyTrash} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('alertdialog', { name: /^Empty Trash/ })
    await expect(within(dialog).getByText('Type Trash to confirm')).toBeVisible()
  }),
}

/** Offline: the files as last loaded; Upload and New folder wait. */
export const CompanyDocumentsOffline: Story = {
  name: 'Company documents, offline',
  tags: ['!dev'],
  render: () => <ExampleApp start={AH_ROUTES.offline} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('You are offline')).toBeVisible()
  }),
}

export const CompanyDocumentsOfflinePhone: Story = {
  name: 'Company documents, offline, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AH_ROUTES.offline} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('You are offline')).toBeVisible()
  }, true),
}

/** Photos uploaded; one name is taken: Keep both; they arrive checked in the folder. */
export const CompanyDocumentsUploadFlow: Story = {
  name: 'Company documents, upload, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AH_ROUTES.folder('liman4-photos')} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }))
    const dialog = await within(document.body).findByRole('dialog', { name: /^Upload files/ })
    const input = dialog.querySelector<HTMLInputElement>('[data-slot="file-dropzone"] input')
    if (input === null) throw new Error('The file input is missing')
    await userEvent.upload(input, [
      new File(['jpeg'], 'IMG_2026-10-14_0712.jpg', { type: 'image/jpeg' }),
      new File(['jpeg'], 'IMG_2026-10-14_0935.jpg', { type: 'image/jpeg' }),
    ])
    const conflict = await within(document.body).findByRole('dialog', {
      name: /^A file with this name exists/,
    })
    await expect(within(conflict).getByRole('radio', { name: /^Keep both/ })).toBeChecked()
    await userEvent.click(within(conflict).getByRole('button', { name: 'Continue' }))
    await waitFor(
      async () => {
        const table = canvas.getByRole('table', { name: 'Site photos' })
        await expect(within(table).getByText('IMG_2026-10-14_0712 (1).jpg')).toBeVisible()
        await expect(within(table).getByText('IMG_2026-10-14_0935.jpg')).toBeVisible()
      },
      { timeout: 5000 },
    )
    await settle()
  },
}

/** "Move to…" from the menu: the plan of works into Site diary; it leaves the folder. */
export const CompanyDocumentsMoveFlow: Story = {
  name: 'Company documents, move, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AH_ROUTES.liman4} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Actions: Plan_radova_Liman_4.xlsx' }))
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Move to…' }))
    const dialog = await within(document.body).findByRole('dialog', { name: /^Move to/ })
    await userEvent.click(within(dialog).getByRole('treeitem', { name: 'Site diary' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move here' }))
    await waitFor(async () => {
      await expect(canvas.queryByText('Plan_radova_Liman_4.xlsx')).toBeNull()
    })
    await settle()
  },
}

/** Milica signs the maintenance contract from its details: signed through Liro Bridge. */
export const CompanyDocumentsSignFlow: Story = {
  name: 'Company documents, sign, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AH_ROUTES.sign} />,
  play: async ({ canvasElement }) => {
    await settle()
    const details = within(canvasElement).getByRole('complementary', { name: 'Details' })
    await userEvent.click(within(details).getByRole('button', { name: 'Sign' }))
    await waitFor(async () => {
      await expect(within(details).getByText('2 of 3 signed')).toBeVisible()
    })
    await settle()
  },
}

/** Empty Trash: the typed word enables the button; Trash is empty after it. */
export const CompanyDocumentsEmptyTrashFlow: Story = {
  name: 'Company documents, empty Trash, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AH_ROUTES.trash} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Empty Trash…' }))
    const dialog = await within(document.body).findByRole('alertdialog', { name: /^Empty Trash/ })
    await userEvent.type(within(dialog).getByRole('textbox'), 'Trash')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Empty Trash' }))
    await waitFor(async () => {
      await expect(canvas.queryByText('Zapisnik_primopredaje_lokacije_stari.pdf')).toBeNull()
    })
    await settle()
  },
}

/**
 * Knjigovodstvo Jelić's client folders on 14.10.2026 at 09:40, as Snežana Jelić sees them:
 * Kvadrat Gradnja d.o.o.'s "Sent to the accountant / October 2026" — what Milica Petrović
 * uploaded in the client portal this morning for request REQ-2026-118 (Beton Mix's invoice,
 * Banca Intesa's statement 189, a photo still being checked), each linked to the month-end
 * checklist and to Kvadrat Gradnja's document inbox.
 */
const CLIENT_FOLDERS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'October 2026' })).toBeVisible()
  await expect(canvas.getByText('Beton_Mix_racun_2026-1187.pdf')).toBeVisible()
  await expect(
    canvas.getByText(
      'Milica Petrović uploads to this folder from Kvadrat Gradnja d.o.o.’s client portal.',
    ),
  ).toBeVisible()
}

export const ClientFolders: Story = {
  name: 'Client folders',
  render: () => <ExampleApp start={AI_ROUTES.clientUploads} />,
  play: filesPlay(async (canvasElement) => {
    await CLIENT_FOLDERS_CHECK(canvasElement)
    await expect(
      within(canvasElement).getAllByRole('link', {
        name: 'Document inbox: Beton Mix d.o.o., invoice 2026-1187',
      }).length,
    ).toBeGreaterThan(0)
  }),
}

export const ClientFoldersPhone: Story = {
  name: 'Client folders, phone',
  render: () => <OnPhone start={AI_ROUTES.clientUploads} />,
  play: filesPlay(CLIENT_FOLDERS_CHECK, true),
}

/** The invoice's details: the request it answers, the document inbox, its activity. */
export const ClientFoldersDetails: Story = {
  name: 'Client folders, details',
  tags: ['!dev'],
  render: () => <ExampleApp start={AI_ROUTES.clientUploadDetails} />,
  play: filesPlay(async (canvasElement) => {
    const details = within(canvasElement).getByRole('complementary', { name: 'Details' })
    await expect(
      within(details).getByRole('link', { name: 'Month-end checklist: Kvadrat Gradnja d.o.o.' }),
    ).toBeVisible()
  }),
}

/** Kvadrat Gradnja's folder shared with Marko Jelić and the client's portal; never by link. */
export const ClientFoldersShare: Story = {
  name: 'Client folders, share',
  tags: ['!dev'],
  render: () => <ExampleApp start={AI_ROUTES.clientShare} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Share Kvadrat Gradnja d.o.o.',
    })
    await expect(
      within(dialog).getByText('Client documents are never shared by link.'),
    ).toBeVisible()
  }),
}

/** Marko Jelić's client: no access, with the way to ask. */
export const ClientFoldersNoAccess: Story = {
  name: 'Client folders, no access',
  tags: ['!dev'],
  render: () => <ExampleApp start={AI_ROUTES.otherClient} />,
  play: filesPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getByText('You do not have access to this folder'),
    ).toBeVisible()
  }),
}

/**
 * Kvadrat Gradnja d.o.o.'s client portal, Files: Milica Petrović's "Sent to the accountant /
 * October 2026" with what she uploaded for REQ-2026-118; Upload is the main action.
 */
const PORTAL_FILES_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'October 2026' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Upload' })).toBeVisible()
  await expect(canvas.getByText('Izvod_189_Banca_Intesa.pdf')).toBeVisible()
}

export const ClientPortalFiles: Story = {
  name: 'Client portal files',
  render: () => <ExampleApp start={AI_ROUTES.portalUploads} />,
  play: filesPlay(PORTAL_FILES_CHECK),
}

export const ClientPortalFilesPhone: Story = {
  name: 'Client portal files, phone',
  render: () => <OnPhone start={AI_ROUTES.portalUploads} />,
  play: filesPlay(PORTAL_FILES_CHECK, true),
}

/** "Upload" on the phone: Take a photo or Choose files. */
export const ClientPortalUploadPhone: Story = {
  name: 'Client portal files, upload, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AI_ROUTES.portalUpload} />,
  play: filesPlay(async () => {
    const dialog = within(document.body).getByRole('dialog', { name: /^Upload files/ })
    await expect(within(dialog).getByRole('button', { name: 'Take a photo' })).toBeVisible()
  }, true),
}

/** Photos uploading in the portal. */
export const ClientPortalUploading: Story = {
  name: 'Client portal files, uploading',
  tags: ['!dev'],
  render: () => <ExampleApp start={AI_ROUTES.portalUploading} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('1 of 4 uploaded')).toBeVisible()
  }),
}

/** "Sent by the accountant": read only; Upload says why not. */
export const ClientPortalFromFirm: Story = {
  name: 'Client portal files, sent by the accountant',
  tags: ['!dev'],
  render: () => <ExampleApp start={AI_ROUTES.portalFromFirm} />,
  play: filesPlay(async (canvasElement) => {
    await expect(
      within(canvasElement).getAllByText(/Only Knjigovodstvo Jelić adds files here\./).length,
    ).toBeGreaterThan(0)
  }),
}

export const ClientPortalOfflinePhone: Story = {
  name: 'Client portal files, offline, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={AI_ROUTES.portalOffline} />,
  play: filesPlay(async (canvasElement) => {
    await expect(within(canvasElement).getByText('You are offline')).toBeVisible()
  }, true),
}

/**
 * Milica uploads the credit note asked in REQ-2026-118: uploading, checked, then in the folder
 * (the firm's "Sent to the accountant / October 2026" reads the same files).
 */
export const ClientPortalUploadFlow: Story = {
  name: 'Client portal files, upload reaches the accountant, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AI_ROUTES.portalUploads} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }))
    const dialog = await within(document.body).findByRole('dialog', { name: /^Upload files/ })
    const input = dialog.querySelector<HTMLInputElement>('[data-slot="file-dropzone"] input')
    if (input === null) throw new Error('The file input is missing')
    await userEvent.upload(input, [
      new File(['%PDF-1.7'], 'Elektro_Sistem_odobrenje_2026-0933.pdf', {
        type: 'application/pdf',
      }),
    ])
    await waitFor(
      async () => {
        const table = canvas.getByRole('table', { name: 'October 2026' })
        await expect(
          within(table).getByText('Elektro_Sistem_odobrenje_2026-0933.pdf'),
        ).toBeVisible()
        await expect(canvas.getByText('1 of 1 uploaded')).toBeVisible()
      },
      { timeout: 5000 },
    )
    await settle()
  },
}

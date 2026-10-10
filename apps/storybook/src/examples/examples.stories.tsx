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
    await expect(canvasElement).toHaveTextContent('Step 3 of 5: Review')
    const page = canvasElement.querySelector('[data-slot="periodic-run-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** The rerun asks for a reason, then the run goes back to Calculate. */
export const PayrollRerun: Story = {
  name: 'Payroll run, rerun',
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
    await expect(
      canvas.getByRole('link', { name: 'Decrease KO-2026-0009, Sent to SEF' }),
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
 * customers are hidden, never deleted, and marked "Inactive" after the name.
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
    await userEvent.click(canvas.getByRole('button', { name: /^Inactive/ }))
    const rakic = await canvas.findByRole('row', { name: /Rakić Pekara SZR/ })
    await expect(within(rakic).getByText('Inactive')).toBeVisible()
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
    await expect(canvas.getByText('Corrected by no. 7')).toBeVisible()
    await expect(canvas.getByText('Corrects no. 4')).toBeVisible()
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
  },
}

import { IMPORT_FILE } from './data-E'
import { E_ROUTES } from './screens-E'

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
 * Decrease document KO-2026-0009 against F-2026-0410 (Medic Lab Niš d.o.o.): "Corrects" links
 * back, the lines as Original / Change / New, the totals of the change; original total plus the
 * change is the new total.
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
    await expect(
      canvas.getByRole('link', { name: 'Invoice F-2026-0410, Partially paid' }),
    ).toBeVisible()
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
    // And back.
    await userEvent.click(canvas.getByRole('link', { name: 'Invoice F-2026-0407, Cancelled' }))
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
    // A second open item of the customer closes too: the payment no longer covers both.
    await userEvent.click(canvas.getByRole('checkbox', { name: /^F-2026-0381/ }))
    await expect(canvasElement).toHaveTextContent('Nothing is left for F-2026-0381')
    await userEvent.click(canvas.getByRole('checkbox', { name: /^F-2026-0381/ }))
    await settle()
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

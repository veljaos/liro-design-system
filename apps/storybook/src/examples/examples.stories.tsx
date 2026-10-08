import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { FEATURED } from './examples-story-data'
import { C_ROUTES } from './data-C'
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

// ── P5 group F ──
// (Imports here, inside the group's block, so the groups' blocks merge without touching the top.)
import { createFormat } from '@veljaos/ui'
import { PAYROLL_TOTALS, STATEMENT_TOTALS } from './data-F'
import { F_ROUTES } from './screens-F'

const SERBIAN = createFormat('sr-Latn-RS')

/**
 * Bank statement 188 of 06.10.2026 (Banca Intesa) against the open invoices: three lines matched
 * at import, the Core's suggestions with their confidence, one partial payment (F-2026-0410), and
 * line 10 (a malformed reference) matched by hand after a search.
 */
export const BankStatementScreen: Story = {
  name: 'Bank statement matching',
  render: () => <ExampleApp start={F_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Statement 188' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent(
      SERBIAN.number(STATEMENT_TOTALS.closing, { decimals: 2 }),
    )
    // Three lines were matched at import.
    const matched = canvas.getByRole('heading', { name: 'Matched' }).parentElement
    if (matched === null) throw new Error('no matched section')
    await expect(matched).toHaveTextContent('F-2026-0396')
    await expect(matched).toHaveTextContent('Matched at import')
    // The partial payment: F-2026-0410 stays open with what is left.
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Match: Line 3, Medic Lab Niš d.o.o. with F-2026-0410',
      }),
    )
    const invoices = canvas.getByRole('listbox', { name: 'Open invoices' })
    await expect(within(invoices).getByRole('option', { name: /^F-2026-0410/ })).toHaveTextContent(
      '36.420,35 RSD left',
    )
    // Line 10 by hand: search the invoice, select both, match.
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search: Open invoices' }), '0399')
    await userEvent.click(await within(invoices).findByRole('option', { name: /^F-2026-0399/ }))
    const lines = canvas.getByRole('listbox', { name: 'Statement lines' })
    await userEvent.click(within(lines).getByRole('option', { name: /Bojović i sinovi/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Match' }))
    await expect(matched).toHaveTextContent('Matched by Milica Petrović')
    await expect(within(lines).queryByRole('option', { name: /Bojović i sinovi/ })).toBeNull()
    await settle()
  },
}

export const BankStatementPhone: Story = {
  name: 'Bank statement matching, phone',
  render: () => <OnPhone start={F_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('option', { name: /Bojović i sinovi/ }))
    await userEvent.click(canvas.getByRole('radio', { name: /Open invoices/ }))
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search: Open invoices' }), '0399')
    await userEvent.click(await canvas.findByRole('option', { name: /^F-2026-0399/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Match' }))
    await expect(canvasElement).toHaveTextContent('Matched by Milica Petrović')
    const view = canvasElement.querySelector('[data-slot="matching-view"]')
    if (view === null) throw new Error('no view')
    await expect(view.scrollWidth).toBeLessThanOrEqual(view.clientWidth)
    await settle()
  },
}

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
    await expect(
      await canvas.findByText(/0 of 46 employees · Corrected working hours/),
    ).toBeVisible()
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
    // The same figures as the invoice list: total 186.420,35, due 86.420,35 after 100.000,00.
    const [label] = canvas.getAllByText('Amount due', { selector: 'dt' })
    const figures = label?.closest('dl')
    if (figures === null || figures === undefined) throw new Error('No key figures')
    await expect(figures).toHaveTextContent('86.420,35 RSD')
    await expect(figures).toHaveTextContent('186.420,35 RSD')
    const totals = canvasElement.querySelector('[data-slot="document-totals"]')
    await expect(totals).toHaveTextContent('-100.000,00 RSD')
    await expect(totals).toHaveTextContent('186.420,35 RSD')
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
    await Promise.all(
      Array.from(document.images).map((image) => image.decode().catch(() => undefined)),
    )
    const canvas = within(canvasElement)
    const microsoft = canvas.getByRole('button', { name: 'Continue with Microsoft' })
    await expect(microsoft.querySelector('img')?.naturalWidth).toBeGreaterThan(0)
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
    // INTEGRATION: AttachmentList — the flags change with a press.
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
    // 186.420,35 (the invoice in the list) − 18.657,60 = 167.762,75.
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

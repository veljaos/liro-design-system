import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createFormat, notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'
import { STATEMENT_TOTALS } from './data-bank'
import { BANK_ROUTES } from './screens-bank'

const meta = {
  title: 'Examples/F4 Worklist',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          "F4 Worklist (WorklistPage): items decided one by one, what the application handled automatically first — supplier invoices to approve and the bank statement's lines.",
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

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

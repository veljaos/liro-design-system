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

/** The statement's lines, as the table or the cards show them, in their order. */
function bankRows(canvasElement: HTMLElement): string[] {
  const list = canvasElement.querySelector(
    'table[aria-label="Lines of statement 188"], ul[aria-label="Lines of statement 188"]',
  )
  if (list === null) throw new Error('no lines')
  return Array.from(list.querySelectorAll<HTMLElement>('tbody tr, :scope > li')).map(
    (row) => row.textContent,
  )
}

/**
 * Bank statement 188 of 06.10.2026 (Banca Intesa), auto first (P5.90 item 9): one compact table
 * of its ten lines, each with what it does and its state — six matched automatically, three
 * suggestions (one of them the payment against proforma PR-2026-118: an advance and its invoice,
 * P5.93 item 17), one that needs the user. "Accept all exact matches (6)" is the main action; the
 * balances check out.
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
    await expect(canvasElement).toHaveTextContent('0 of 10 lines done')
    await expect(canvasElement).toHaveTextContent(
      '6 matched automatically · 3 suggestions · 1 needs you',
    )
    await expect(canvas.getByRole('button', { name: 'Accept all exact matches (6)' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Advance and its invoice for PR-2026-118')
    await expect(bankRows(canvasElement)).toHaveLength(10)
    await settle()
  },
}

/**
 * Accepting the six exact matches at once (Undo offered), then line 3 — the Core's suggestion —
 * opened in the drawer: what it does in one sentence, "Confirm and next", and line 7 opens.
 */
export const BankStatementScreenInteraction: Story = {
  name: 'Bank statement 188, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Accept all exact matches (6)' }))
    await expect(await page.findByText('6 lines accepted.')).toBeInTheDocument()
    await expect(canvasElement).toHaveTextContent('6 of 10 lines done')
    await expect(canvas.queryByRole('button', { name: /^Accept all/ })).toBeNull()
    await userEvent.click(canvas.getByRole('cell', { name: 'Medic Lab Niš d.o.o.' }))
    const drawer = within(await page.findByRole('dialog', { name: /Confirm payment/ }))
    await expect(drawer.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'Pays 50.000,00',
    )
    // The full choice and the bank's details only on demand.
    await expect(drawer.queryByRole('radiogroup')).toBeNull()
    await userEvent.click(drawer.getByRole('button', { name: 'Confirm and next' }))
    const next = within(await page.findByRole('dialog', { name: /Line 7/ }))
    await expect(next.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'Closes F-2026-0406; 0,40 RSD is written off.',
    )
    await expect(canvasElement).toHaveTextContent('7 of 10 lines done')
    notice.dismiss()
    await settle()
  },
}

/** Phone: the summary, then the lines as cards — those that need the user first. */
export const BankStatementPhone: Story = {
  name: 'Bank statement 188, phone',
  render: () => <OnPhone start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const rows = bankRows(canvasElement)
    await expect(rows[0]).toMatch(/Petar Jovanović.*Needs you/)
    await expect(rows[1]).toMatch(/Medic Lab Niš.*Suggestion/)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Accept all exact matches (6)' }),
    ).toBeVisible()
    await settle()
  },
}

/**
 * Phone, one line on the whole screen: Zlatibor Turs paid 0,40 RSD less than F-2026-0406; the
 * difference is written off as the Core suggests; "Confirm and next".
 */
export const BankStatementLinePhone: Story = {
  name: 'Bank statement 188, phone, line in focus',
  tags: ['!dev'],
  render: () => <OnPhone start={BANK_ROUTES.difference} />,
  play: async () => {
    await settle()
    const drawer = within(
      await within(document.body).findByRole('dialog', { name: /Zlatibor Turs/ }),
    )
    await expect(drawer.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'Closes F-2026-0406; 0,40 RSD is written off.',
    )
    await expect(drawer.getByRole('button', { name: 'Confirm and next' })).toBeVisible()
    await settle()
  },
}

/**
 * A payment against a proforma invoice (P5.93 item 17): line 9 open — it pays proforma
 * PR-2026-118; the Core proposes to post it as an advance and to issue the advance invoice at
 * once, one press: "Post advance and issue invoice".
 */
export const BankStatementProforma: Story = {
  name: 'Bank statement 188, proforma paid',
  tags: ['!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.proforma} />,
  play: async () => {
    await settle()
    const drawer = within(
      await within(document.body).findByRole('dialog', { name: /Vojvođanka Mlin/ }),
    )
    await expect(drawer.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'The advance invoice is issued at once.',
    )
    await expect(drawer.getByRole('link', { name: 'PR-2026-118' })).toBeVisible()
    await expect(
      drawer.getByRole('button', { name: 'Post advance and issue invoice' }),
    ).toBeVisible()
    await settle()
  },
}

/**
 * The result in place, after the one press: advance invoice AF-2026-0031 issued (its number a
 * link), the payment posted as an advance, the related documents (the proforma, paid; the
 * advance invoice, issued) and "Next line".
 */
export const BankStatementProformaIssued: Story = {
  name: 'Bank statement 188, advance invoice issued',
  tags: ['!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.proformaIssued} />,
  play: async () => {
    await settle()
    const drawer = within(
      await within(document.body).findByRole('dialog', { name: /Vojvođanka Mlin/ }),
    )
    const result = drawer.getByRole('region', { name: 'Result' })
    await expect(within(result).getByRole('link', { name: 'AF-2026-0031' })).toBeVisible()
    const related = within(result).getByRole('list', { name: 'Related documents' })
    await expect(related).toHaveTextContent('PR-2026-118')
    await expect(related).toHaveTextContent('AF-2026-0031')
    await expect(drawer.getByRole('button', { name: 'Next line' })).toBeVisible()
    await settle()
  },
}

/** The one step: post the advance and issue its invoice, see the result, go to the next line. */
export const BankStatementProformaInteraction: Story = {
  name: 'Bank statement 188, proforma, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.proforma} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = within(document.body)
    const drawer = within(await page.findByRole('dialog', { name: /Vojvođanka Mlin/ }))
    await userEvent.click(drawer.getByRole('button', { name: 'Post advance and issue invoice' }))
    const result = await drawer.findByRole('region', { name: 'Result' })
    await expect(within(result).getByRole('link', { name: 'AF-2026-0031' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('1 of 10 lines done')
    await userEvent.click(drawer.getByRole('button', { name: 'Next line' }))
    // The next line's drawer slides in: wait for it to settle.
    await waitFor(async () => {
      await expect(page.getByRole('dialog', { name: /Petar Jovanović/ })).toBeVisible()
    })
    await settle()
  },
}

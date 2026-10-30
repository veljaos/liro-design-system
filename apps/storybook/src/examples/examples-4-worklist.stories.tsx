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

/** The rows of the statement's queue drawn now, as their text, in their order. */
function bankRows(canvasElement: HTMLElement, statement = '188'): string[] {
  const list = canvasElement.querySelector(`ul[aria-label="Lines of statement ${statement}"]`)
  if (list === null) throw new Error('no lines')
  return Array.from(list.querySelectorAll<HTMLElement>(':scope > li[data-worklist-row]')).map(
    (row) => row.textContent,
  )
}

/** A filter chip of the queue ("Needs you 1"), by its state's words. */
function chip(canvasElement: HTMLElement, label: string): HTMLElement {
  const group = within(canvasElement).getByRole('group', { name: 'Show lines' })
  return within(group).getByRole('button', { name: new RegExp(`^${label}`) })
}

/** The chosen line's heading in the detail (the payer or the payee). */
function lineHeading(canvasElement: HTMLElement): string {
  return canvasElement.querySelector('h2')?.textContent ?? ''
}

/**
 * Bank statement 188 of 06.10.2026 (Banca Intesa) as a worklist (P5.94 item 19): the strip with
 * the balances and "0 of 10 done"; the queue with "Accept all exact matches (6)" at its top, the
 * search and the states as chips (All 10, Needs you 1, Suggestion 3, Matched automatically 6,
 * Done 0), Needs you chosen; the one line nothing was found for — Petar Jovanović's payment — open beside
 * it with the bank's text and "What is this payment?".
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
    await expect(canvasElement).toHaveTextContent('0 of 10 done')
    await expect(chip(canvasElement, 'All')).toHaveTextContent('All10')
    await expect(chip(canvasElement, 'All')).toHaveAttribute('aria-pressed', 'false')
    await expect(chip(canvasElement, 'Needs you')).toHaveAttribute('aria-pressed', 'true')
    await expect(chip(canvasElement, 'Needs you')).toHaveTextContent('Needs you1')
    await expect(chip(canvasElement, 'Suggestion')).toHaveTextContent('Suggestion3')
    await expect(chip(canvasElement, 'Matched automatically')).toHaveTextContent(
      'Matched automatically6',
    )
    await expect(canvas.getByRole('button', { name: 'Accept all exact matches (6)' })).toBeVisible()
    await expect(bankRows(canvasElement)).toHaveLength(1)
    await expect(lineHeading(canvasElement)).toBe('Petar Jovanović')
    await expect(canvas.getByRole('radiogroup', { name: 'What is this payment?' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Post statement' })).toBeNull()
    await settle()
  },
}

/**
 * Accepting the six exact matches at once ("6 lines accepted." with Undo in place, no
 * confirmation); the suggestions: line 3 confirmed with the button, line 7 opens by itself with
 * "Line 3 done … Undo" above it; Enter in the queue confirms line 7 and line 9 (the proforma)
 * opens; Undo takes line 7 back.
 */
export const BankStatementScreenInteraction: Story = {
  name: 'Bank statement 188, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Accept all exact matches (6)' }))
    await expect(await canvas.findByText('6 lines accepted.')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('6 of 10 done')
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
    await expect(canvasElement).toHaveTextContent('0 of 10 done')
    await userEvent.click(canvas.getByRole('button', { name: 'Accept all exact matches (6)' }))
    await userEvent.click(chip(canvasElement, 'Suggestion'))
    await expect(lineHeading(canvasElement)).toBe('Medic Lab Niš d.o.o.')
    await expect(canvas.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'Pays 50.000,00',
    )
    await expect(
      within(canvas.getByRole('list', { name: 'Why' })).getAllByRole('listitem'),
    ).toHaveLength(3)
    // The full choice only on demand.
    await expect(canvas.queryByRole('radiogroup')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
    await expect(lineHeading(canvasElement)).toBe('Zlatibor Turs d.o.o.')
    await expect(canvas.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'Closes F-2026-0406; 0,40 RSD is written off.',
    )
    await expect(canvasElement).toHaveTextContent('Line 3 done: Pays part of F-2026-0410.')
    await expect(canvasElement).toHaveTextContent('7 of 10 done')
    // The keyboard: the queue's chosen row, then Enter confirms it.
    const row = canvasElement.querySelector<HTMLElement>(
      '[data-worklist-row="b7"] [data-worklist-target]',
    )
    row?.focus()
    await userEvent.keyboard('{Enter}')
    await expect(lineHeading(canvasElement)).toBe('Vojvođanka Mlin a.d.')
    await expect(canvasElement).toHaveTextContent('Line 7 done')
    await expect(document.activeElement?.closest('[data-worklist-row]')).toHaveAttribute(
      'data-worklist-row',
      'b9',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
    await expect(lineHeading(canvasElement)).toBe('Zlatibor Turs d.o.o.')
    await expect(canvasElement).toHaveTextContent('7 of 10 done')
    await settle()
  },
}

/** Every line decided: the strip offers "Post statement" (the journal entry in a confirmation). */
export const BankStatementReady: Story = {
  name: 'Bank statement 188, ready to post',
  tags: ['!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.decided} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('10 of 10 done')
    await expect(chip(canvasElement, 'Done')).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: 'Post statement' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /^Accept all/ })).toBeNull()
    await settle()
  },
}

/** Posting: the confirmation shows the journal entry, balanced; the statement is posted. */
export const BankStatementPost: Story = {
  name: 'Bank statement 188, ready to post, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.decided} />,
  play: async ({ canvasElement }) => {
    await settle()
    const page = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Post statement' }))
    const alert = await page.findByRole('alertdialog')
    const dialog = within(alert)
    await expect(alert).toHaveTextContent('Journal entry')
    await expect(alert).toHaveTextContent('Balanced')
    await userEvent.click(dialog.getByRole('button', { name: 'Post statement' }))
    await expect(await page.findByText('Statement 188 posted.')).toBeInTheDocument()
    // The dialog closes; the strip no longer offers posting, and the statement says Posted.
    await waitFor(async () => {
      await expect(
        within(canvasElement).queryByRole('button', { name: 'Post statement' }),
      ).toBeNull()
    })
    await expect(within(canvasElement).getByText('Posted')).toBeVisible()
    notice.dismiss()
    await settle()
  },
}

/** Phone: the strip, then the queue — the lines that need the user first (Needs you). */
export const BankStatementPhone: Story = {
  name: 'Bank statement 188, phone',
  render: () => <OnPhone start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const rows = bankRows(canvasElement)
    await expect(rows).toHaveLength(1)
    await expect(rows[0]).toMatch(/Petar Jovanović.*Needs you/)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Accept all exact matches (6)' }),
    ).toBeVisible()
    await settle()
  },
}

/**
 * Phone, one line on the whole screen: Zlatibor Turs paid 0,40 RSD less than F-2026-0406; the
 * difference is written off as the Core suggests; Change and Confirm in the bottom bar.
 */
export const BankStatementLinePhone: Story = {
  name: 'Bank statement 188, phone, one line',
  tags: ['!dev'],
  render: () => <OnPhone start={BANK_ROUTES.difference} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(lineHeading(canvasElement)).toBe('Zlatibor Turs d.o.o.')
    await expect(canvas.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'Closes F-2026-0406; 0,40 RSD is written off.',
    )
    await expect(canvas.getByText('2 of 3')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Confirm' })).toBeVisible()
    await settle()
  },
}

/**
 * Phone, as the approvals: the queue, a line on the whole screen, Confirm, and the next line
 * opens by itself (with Undo in place); Back to list returns to the queue.
 */
export const BankStatementPhoneInteraction: Story = {
  name: 'Bank statement 188, phone, interaction',
  tags: ['interaction', '!dev'],
  render: () => <OnPhone start={BANK_ROUTES.statement} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(chip(canvasElement, 'Suggestion'))
    await userEvent.click(canvas.getByRole('button', { name: /Medic Lab Niš/ }))
    await settle()
    await expect(lineHeading(canvasElement)).toBe('Medic Lab Niš d.o.o.')
    await expect(canvas.getByText('1 of 3')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
    await settle()
    // The next line that waits opens by itself, the last decision's Undo above it.
    await expect(lineHeading(canvasElement)).toBe('Zlatibor Turs d.o.o.')
    await expect(canvasElement).toHaveTextContent('Line 3 done')
    await userEvent.click(canvas.getByRole('button', { name: 'Back to list' }))
    await settle()
    await expect(chip(canvasElement, 'Suggestion')).toHaveAttribute('aria-pressed', 'true')
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
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(lineHeading(canvasElement)).toBe('Vojvođanka Mlin a.d.')
    await expect(canvas.getByRole('region', { name: 'What it does' })).toHaveTextContent(
      'The advance invoice is issued at once.',
    )
    await expect(canvas.getByRole('link', { name: 'PR-2026-118' })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Post advance and issue invoice' }),
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
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const result = canvas.getByRole('region', { name: 'Result' })
    await expect(within(result).getByRole('link', { name: 'AF-2026-0031' })).toBeVisible()
    const related = within(result).getByRole('list', { name: 'Related documents' })
    await expect(related).toHaveTextContent('PR-2026-118')
    await expect(related).toHaveTextContent('AF-2026-0031')
    await expect(canvas.getByRole('button', { name: 'Next line' })).toBeVisible()
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
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Post advance and issue invoice' }))
    const result = await canvas.findByRole('region', { name: 'Result' })
    await expect(within(result).getByRole('link', { name: 'AF-2026-0031' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('1 of 10 done')
    await userEvent.click(canvas.getByRole('button', { name: 'Next line' }))
    await expect(lineHeading(canvasElement)).toBe('Medic Lab Niš d.o.o.')
    await settle()
  },
}

/**
 * Statement 189: 1,240 generated lines (P5.94 item 19). The strip and the chips count them all;
 * the queue draws only the rows in view.
 */
export const BankStatementLarge: Story = {
  name: 'Bank statement 189, 1,240 lines',
  tags: ['!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.large} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('0 of 1.240 done')
    await expect(chip(canvasElement, 'Needs you')).toHaveAttribute('aria-pressed', 'true')
    await settle()
  },
}

/**
 * 1,240 lines: the 1,161 matched automatically in the queue, only about twenty rows drawn, each
 * telling its place; End, ArrowUp and Home move the chosen line (its detail follows); Enter
 * confirms it and the next one opens; the search finds one line by its reference.
 */
export const BankStatementLargeInteraction: Story = {
  name: 'Bank statement 189, 1,240 lines, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BANK_ROUTES.large} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const auto = chip(canvasElement, 'Matched automatically')
    const count = Number(auto.textContent.replace(/\D/g, ''))
    await expect(count).toBeGreaterThan(1000)
    await userEvent.click(auto)
    await settle()
    const list = () => {
      const element = canvasElement.querySelector('ul[aria-label="Lines of statement 189"]')
      if (element === null) throw new Error('no queue')
      return element
    }
    const drawn = () => list().querySelectorAll('li[data-worklist-row]')
    await expect(drawn().length).toBeGreaterThan(5)
    await expect(drawn().length).toBeLessThan(60)
    await expect(drawn()[0]).toHaveAttribute('aria-setsize', String(count))
    const chosen = () => list().querySelector('li[aria-current="true"]')
    // The keyboard: the chosen row has the queue's one tab stop.
    list().querySelector<HTMLElement>('li[aria-current="true"] [data-worklist-target]')?.focus()
    await userEvent.keyboard('{End}')
    await waitFor(async () => {
      await expect(chosen()).toHaveAttribute('aria-posinset', String(count))
    })
    const last = lineHeading(canvasElement)
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(async () => {
      await expect(chosen()).toHaveAttribute('aria-posinset', String(count - 1))
    })
    await expect(lineHeading(canvasElement)).not.toBe(last)
    await expect(drawn().length).toBeLessThan(60)
    // Enter confirms the chosen line; the next one in the queue opens and keeps the focus.
    const before = lineHeading(canvasElement)
    await userEvent.keyboard('{Enter}')
    await expect(canvasElement).toHaveTextContent('1 of 1.240 done')
    await expect(lineHeading(canvasElement)).not.toBe(before)
    await expect(document.activeElement?.closest('li')).toHaveAttribute('aria-current', 'true')
    await userEvent.keyboard('{Home}')
    await waitFor(async () => {
      await expect(chosen()).toHaveAttribute('aria-posinset', '1')
    })
    // The search: a reference finds its one line.
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Name, amount, reference or account' }),
      '261000500',
    )
    await waitFor(async () => {
      await expect(drawn()).toHaveLength(1)
    })
    await expect(lineHeading(canvasElement)).toMatch(/\S/)
    await settle()
  },
}

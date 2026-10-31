import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createFormat } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { FEATURED } from './examples-story-data'
import {
  draftTotals,
  fromRecord,
  initialDraft,
  newLine,
  NEW_SERVICE,
  type DraftLine,
} from './data-D1'
import { D1_ROUTES } from './screens-D1'
import { D2_ROUTES } from './screens-D2'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'
import { F_ROUTES } from './screens-F'

const meta = {
  title: 'Examples/F3 Document',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          'F3 Document (DocumentPage): header, the one line editor, totals from the application, related documents and history. The invoice, its draft, a journal entry and a decrease document are the same floorplan.',
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

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
    // The draft's header follows the invoice draft's: three values on one row, the date
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
    // The balance in one place after the lines and "Add line", never over a line.
    const totals = bar?.closest('[data-slot="grid-totals"]')
    const lines = canvasElement.querySelectorAll('[data-row-key]')
    const last = lines[lines.length - 1]
    if (totals === null || totals === undefined || last === undefined) throw new Error('no lines')
    await expect(getComputedStyle(totals).position).toBe('static')
    await expect(totals.getBoundingClientRect().top).toBeGreaterThan(
      last.getBoundingClientRect().bottom,
    )
    await expect(canvasElement.querySelectorAll('[data-slot="balance-bar"]')).toHaveLength(1)
    await expect(bar).toHaveTextContent('Not balanced')
    await noSidewaysOverflow(canvasElement)
  },
}

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

/**
 * A document table's description column wraps to at most two lines: the lines of each
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
 * Decrease document KO-2026-0009 against F-2026-0410 (Medic Lab Niš d.o.o.): the source in the
 * header beside the customer ("Corrects" with the invoice's link, state, date and total),
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
    // The source at the customer's level, before the key figures.
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

const rsd = (value: string) => SERBIAN.money(value, 'RSD').replace(/\s/gu, ' ')

/** The draft's lines after the walk-through: the last line is the new service, 24 hours. */
function draftAfterCreate(): DraftLine[] {
  const lines = initialDraft()
  const last = lines[lines.length - 1] ?? newLine()
  const option = { value: NEW_SERVICE.value, label: NEW_SERVICE.name, kind: 'service' }
  return [...lines.slice(0, -1), { ...fromRecord(last, option), quantity: '24' }]
}

/**
 * A draft to Bojović i sinovi d.o.o. whose lines are added by search — items with their
 * stock (a warning when the quantity is above it), services, a fixed asset sold (its number, and
 * its book value marked internal) —, S 20% and S 10%. Simple by default: item,
 * quantity, unit, price, VAT and amount; no discount column while no line has a discount; the
 * header with the date of supply and the place of issue. The walk-through creates the service
 * "Montaža skele" from the last line's search ("+ Create service …"), enters 24 hours, gives the
 * cement a 5% discount from "Add line ▾" (the column appears), and the totals follow (computed in
 * data-D1.ts).
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
    // Simple by default: the six columns, no discount or account column.
    const headers = within(canvas.getByRole('table', { name: 'Lines' }))
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)
    await expect(headers).toEqual([
      'Item, service or asset',
      'Quantity',
      'Unit',
      'Price',
      'VAT',
      'Amount',
    ])
    await expect(canvas.getByRole('button', { name: 'Change Date of supply' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Change Place of issue' })).toBeVisible()
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
    const item = canvas.getByRole('combobox', { name: 'Item, service or asset, line 7' })
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
    const quantity = canvas.getByRole('textbox', { name: 'Quantity, line 7' })
    await userEvent.click(quantity)
    await userEvent.keyboard('24{Tab}')
    const after = draftTotals(draftAfterCreate())
    await waitFor(() => expect(canvasElement).toHaveTextContent(rsd(after.total.value ?? '0')))
    await expect(canvasElement).toHaveTextContent(rsd(after.net))
    // A 5% discount on the cement: "Add line ▾" shows the discount column.
    await userEvent.click(canvas.getByRole('textbox', { name: 'Quantity, line 1' }))
    await userEvent.click(canvas.getByRole('button', { name: 'More options: Add line' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Discount on a line' }))
    const discount = await canvas.findByRole('textbox', { name: 'Discount %, line 1' })
    await waitFor(() => expect(discount).toHaveFocus())
    await userEvent.keyboard('5{Tab}')
    const discounted = draftTotals(
      draftAfterCreate().map((line, index) => (index === 0 ? { ...line, discount: '5' } : line)),
    )
    await waitFor(() => expect(canvasElement).toHaveTextContent(rsd(discounted.total.value ?? '0')))
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
 * The invoice's "PDF" opens liro-folio's PDF (a stand-in in the examples); the back button
 * returns to the invoice.
 */
export const PrintoutInvoiceInteraction: Story = {
  name: 'Invoice PDF from its page, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={ROUTES.invoice(FEATURED)} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'PDF' }))
    await settle()
    const pdf = await canvas.findByRole('figure', {
      name: `${FEATURED}.pdf, PDF from liro-folio`,
    })
    await expect(within(pdf).getByRole('button', { name: 'Download PDF' })).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: `Back to ${FEATURED}` }))
    await settle()
    await expect(await canvas.findByRole('heading', { level: 1, name: FEATURED })).toBeVisible()
  },
}

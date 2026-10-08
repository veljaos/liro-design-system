import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DataTable, type DataTableColumn } from './data-table'
import { MoneyText, NumberText } from './display-text'
import { DocumentSpecification } from './document-blocks'
import { DocumentTotals } from './document-totals'
import type { LineType } from './line-types'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

interface Position {
  id: string
  type: LineType
  text: string
  unit?: string
  quantity?: string
  price?: string
  previous: string
  current: string
  cumulative: string
}

/** The application's arithmetic in whole paras, played by the story (components never add). */
function paras(value: bigint): string {
  const digits = value.toString().padStart(3, '0')
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`
}

const GROUPS = ['1. Earthworks', '2. Concrete works', '3. Roofing']
const WORKS = ['Excavation', 'Backfill', 'Formwork', 'Concrete C25/30', 'Reinforcement B500B']

/** `groups` groups of `size` positions, with subtotals; repeatable, no randomness. */
function specification(groups: number, size: number): { rows: Position[]; total: bigint } {
  const rows: Position[] = []
  let total = 0n
  for (let g = 1; g <= groups; g += 1) {
    const name = GROUPS[(g - 1) % GROUPS.length] ?? ''
    rows.push({
      id: `h${String(g)}`,
      type: 'heading',
      text: `${name} (${String(g)})`,
      previous: '',
      current: '',
      cumulative: '',
    })
    let previousSum = 0n
    let currentSum = 0n
    for (let i = 1; i <= size; i += 1) {
      const quantity = BigInt(((g * 7 + i * 3) % 40) + 1)
      const price = BigInt(50000 + ((g * 1301 + i * 977) % 950000))
      const previous = ((quantity * BigInt((i % 3) * 25)) / 100n) * price
      const current = ((quantity * BigInt(((i + g) % 2) * 25)) / 100n) * price
      previousSum += previous
      currentSum += current
      rows.push({
        id: `${String(g)}.${String(i)}`,
        type: 'line',
        text: `${String(g)}.${String(i)} ${WORKS[(i - 1) % WORKS.length] ?? ''}, section ${String(Math.ceil(i / 5))}`,
        unit: i % 2 === 1 ? 'm²' : 'pc',
        quantity: quantity.toString(),
        price: paras(price),
        previous: paras(previous),
        current: paras(current),
        cumulative: paras(previous + current),
      })
    }
    total += currentSum
    rows.push({
      id: `s${String(g)}`,
      type: 'subtotal',
      text: `Total ${name}`,
      previous: paras(previousSum),
      current: paras(currentSum),
      cumulative: paras(previousSum + currentSum),
    })
  }
  return { rows, total }
}

const money = (value: string | undefined) =>
  value === undefined || value === '' ? null : <MoneyText value={value} currency="RSD" />

const COLUMNS: DataTableColumn<Position>[] = [
  { id: 'text', header: 'Position', cell: (row) => row.text },
  { id: 'unit', header: 'Unit', cell: (row) => row.unit },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (row) => <NumberText value={row.quantity ?? null} />,
  },
  { id: 'price', header: 'Price', align: 'end', numeric: true, cell: (row) => money(row.price) },
  {
    id: 'previous',
    header: 'Previous',
    align: 'end',
    numeric: true,
    cell: (row) => money(row.previous),
  },
  {
    id: 'current',
    header: 'This period',
    align: 'end',
    numeric: true,
    cell: (row) => money(row.current),
  },
  {
    id: 'cumulative',
    header: 'Cumulative',
    align: 'end',
    numeric: true,
    cell: (row) => money(row.cumulative),
  },
]

function Specification({
  groups = 3,
  size = 6,
  phone = false,
  defaultOpen = false,
}: {
  groups?: number
  size?: number
  phone?: boolean
  defaultOpen?: boolean
}) {
  const { rows, total } = specification(groups, size)
  const tax = (total * 20n + 50n) / 100n
  return (
    <DocumentSpecification
      title="Specification of works"
      count={groups * size}
      amount={paras(total)}
      currency="RSD"
      description="IS-2026-007 · Contract 12/2026 · Hall B extension, Temerinski put 51"
      defaultOpen={defaultOpen}
    >
      <DataTable
        label="Specification of works"
        layout={phone ? 'cards' : 'table'}
        columns={COLUMNS}
        rows={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.text}
        lineType={(row) => row.type}
        stickyHeader
        maxHeight="60vh"
        mobile={{ details: ['unit', 'quantity', 'price', 'previous', 'current', 'cumulative'] }}
      />
      <DocumentTotals
        label="Specification totals"
        rows={[]}
        recap={{
          label: 'Recap by tax category',
          headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
          rows: [
            { key: 's20', category: 'S 20%', base: paras(total), rate: '20', tax: paras(tax) },
          ],
        }}
        total={{
          key: 'total',
          label: 'This period with VAT',
          value: paras(total + tax),
          currency: 'RSD',
        }}
        {...(phone ? { className: 'max-w-none' } : {})}
      />
    </DocumentSpecification>
  )
}

const meta = {
  title: 'Components/Documents/DocumentSpecification',
  component: DocumentSpecification,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a long specification (a construction situation’s works, a delivery’s ' +
          'items) is not inside the lines table (P5.18). In the lines’ card it is one summary ' +
          'row — "Specification of works: 300 positions, 2.418.300,00 RSD" (the count and the ' +
          'amount through the provider’s `format`, the words from the application) — with ' +
          '**Open**, which shows the whole specification read-only in a **full-screen sheet** ' +
          'over the document (D14: a read-only view; the document stays under it and Escape ' +
          'returns to it with the focus on Open). Inside: a DataTable with `lineType` — groups ' +
          'as headings, their subtotals under a rule — and columns previous / this period / ' +
          'cumulative where the application has them, then the same recap by tax category ' +
          '(DocumentTotals).\n\n' +
          '**When not:** a short list of lines (the lines table itself); editing the ' +
          'specification (EditableGrid on its own page).',
      },
    },
  },
  args: {
    title: 'Specification of works',
    count: 18,
    amount: '0',
    currency: 'RSD',
    children: null,
  },
  render: () => (
    <ExampleProvider>
      <Specification />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentSpecification>

export default meta

type Story = StoryObj<typeof meta>

/** The summary row; Open shows the specification, Escape returns to Open. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('Specification of works: 18 positions,')
    const open = canvas.getByRole('button', { name: 'Open' })
    await userEvent.click(open)
    await settle()
    const sheet = within(document.body).getByRole('dialog', { name: 'Specification of works' })
    await expect(within(sheet).getByRole('cell', { name: 'Total 1. Earthworks' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(open).toHaveFocus())
  },
}

/** Open: groups with subtotals, the three period columns, the recap at the end. */
export const Opened: Story = {
  render: () => (
    <ExampleProvider>
      <Specification defaultOpen />
    </ExampleProvider>
  ),
}

/**
 * 300 positions (12 groups of 25): the sheet opens and scrolls without delay; the table is not
 * virtualised, so every position keeps its full text (measured in docs/p5-notes/group-D2.md).
 */
export const ThreeHundred: Story = {
  name: '300 positions',
  render: () => (
    <ExampleProvider>
      <Specification groups={12} size={25} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('300 positions')
    const started = performance.now()
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }))
    const sheet = await within(document.body).findByRole('dialog', {
      name: 'Specification of works',
    })
    await expect(within(sheet).getAllByRole('row').length).toBeGreaterThan(300)
    // Opening 324 rows stays well under a second, even on a loaded test machine.
    await expect(performance.now() - started).toBeLessThan(3000)
    await settle()
  },
}

/** A long title wraps beside Open. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <div className="max-w-120">
        <DocumentSpecification
          title="Specification of the works carried out on the Hall B extension in September 2026, by group and position"
          count={1284}
          amount="12345678.90"
          currency="RSD"
        >
          <p className="m-0 text-sm">The positions.</p>
        </DocumentSpecification>
      </div>
    </ExampleProvider>
  ),
}

/** Phone width: the sheet fills the frame; the positions are a list. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <Specification phone defaultOpen />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** Arabic title in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentSpecification
          title="مواصفات الأعمال"
          count={18}
          amount="2418300.00"
          currency="RSD"
        >
          <p className="m-0 text-sm">البنود</p>
        </DocumentSpecification>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese title. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DocumentSpecification title="工事明細書" count={18} amount="2418300.00" currency="RSD">
          <p className="m-0 text-sm">明細</p>
        </DocumentSpecification>
      </ExampleProvider>
    </StoryProvider>
  ),
}

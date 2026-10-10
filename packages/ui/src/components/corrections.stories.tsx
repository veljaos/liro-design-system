import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { useLiro } from '../provider/liro-provider'
import { settle } from '../primitives/story-helpers'
import { DataTable, type DataTableColumn } from './data-table'
import { MoneyText } from './display-text'
import { ChangeText, correctionColumns } from './document-blocks'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { DESCRIPTION_MIN_WIDTH, MIN_COLUMN_WIDTH } from './data-table-logic'

interface Corrected {
  id: string
  document?: string
  item: string
  unit: string
  price: string
  vat: string
  quantity: [string, string, string]
  amount: [string, string, string]
}

/** KO-2026-0009 against F-2026-0410: damaged goods returned (values from the application). */
const DECREASE: Corrected[] = [
  {
    id: '1',
    item: 'Gypsum boards 12,5 mm, 1200 × 2000 mm',
    unit: 'pc',
    price: '689.00',
    vat: 'S 20%',
    quantity: ['140', '-20', '120'],
    amount: ['96460.00', '-13780.00', '82680.00'],
  },
  {
    id: '3',
    item: 'Mineral wool 50 mm',
    unit: 'm²',
    price: '221.00',
    vat: 'S 20%',
    quantity: ['60', '-8', '52'],
    amount: ['13260.00', '-1768.00', '11492.00'],
  },
]

/** A volume rebate for September on several invoices: one line per invoice. */
const PERIOD: Corrected[] = [
  ['F-2026-0389', 'Cement CEM II 42,5 R, 25 kg', '84500.00', '-2535.00', '81965.00'],
  ['F-2026-0397', 'Cement CEM II 42,5 R, 25 kg', '123300.00', '-3699.00', '119601.00'],
  ['F-2026-0412', 'Cement CEM II 42,5 R, 25 kg', '82200.00', '-2466.00', '79734.00'],
].map(([document = '', item = '', before = '', change = '', after = '']) => ({
  id: document,
  document,
  item,
  unit: 'bag',
  price: '685.00',
  vat: 'S 20%',
  quantity: ['', '', ''],
  amount: [before, change, after],
}))

function columns(withQuantity: boolean, withDocument: boolean): DataTableColumn<Corrected>[] {
  return [
    ...(withDocument
      ? [
          {
            id: 'document',
            header: 'Invoice',
            cell: (row: Corrected) => row.document,
          } satisfies DataTableColumn<Corrected>,
        ]
      : []),
    {
      id: 'item',
      header: 'Item',
      minWidth: DESCRIPTION_MIN_WIDTH,
      cell: (row) => row.item,
    },
    { id: 'unit', header: 'Unit', minWidth: MIN_COLUMN_WIDTH, cell: (row) => row.unit },
    ...(withQuantity
      ? correctionColumns<Corrected>({
          id: 'quantity',
          original: (row) => row.quantity[0],
          change: (row) => row.quantity[1],
          next: (row) => row.quantity[2],
          headers: { original: 'Original qty', change: 'Qty change', next: 'New qty' },
        })
      : []),
    {
      id: 'price',
      header: 'Price',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.price} currency="RSD" />,
    },
    ...correctionColumns<Corrected>({
      id: 'amount',
      original: (row) => row.amount[0],
      change: (row) => row.amount[1],
      next: (row) => row.amount[2],
      currency: 'RSD',
      ...(withQuantity
        ? { headers: { original: 'Original amount', change: 'Change', next: 'New amount' } }
        : {}),
    }),
    {
      id: 'vat',
      header: 'VAT',
      minWidth: MIN_COLUMN_WIDTH,
      // A code never wraps ("S 20%").
      cell: (row) => <span className="whitespace-nowrap">{row.vat}</span>,
    },
  ]
}

const meta = {
  title: 'Components/Documents/Corrections',
  component: ChangeText,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the lines of a corrective document (P5.18) — a decrease or an ' +
          'increase against one document, or against several documents for a period — shown ' +
          'as **Original / Change / New**. `correctionColumns(spec)` makes the three DataTable ' +
          'columns of one corrected value (the quantity, the amount), with the headers from ' +
          '`messages` or the application’s; `ChangeText` writes a change with its sign ("+" for ' +
          'an increase, through the provider’s `format` with `sign: "always"`), never rounded. ' +
          'Every value comes from the application: nothing is computed.\n\n' +
          '**A corrective document is a DocumentPage** (decided in P5.18): its source in the ' +
          'header beside the customer ("Corrects" with the invoice’s link, state, date and ' +
          'total: `DocumentSource` in `source`, P5.23), these lines, and the totals of the ' +
          'change (DocumentTotals); no template of its own.\n\n' +
          '**Room for the item:** the item column keeps `DESCRIPTION_MIN_WIDTH` (240px), so a ' +
          'name wraps to at most two lines; these columns, the unit and the tax category may ' +
          'be 64px (their headers wrap); amounts and codes never wrap; a table wider than its ' +
          'card scrolls sideways.\n\n' +
          '**When not:** a cancellation of the whole document (IrreversibleConfirmDialog with ' +
          '`reason`, then CancellationBanner).',
      },
    },
  },
  args: { value: '-13780.00', currency: 'RSD' },
  render: () => (
    <ExampleProvider>
      <DataTable
        label="Corrected lines"
        layout="table"
        columns={columns(true, false)}
        rows={DECREASE}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.item}
        totals={{
          'amount.original': <MoneyText value="109720.00" currency="RSD" />,
          'amount.change': <ChangeText value="-15548.00" currency="RSD" />,
          'amount.new': <MoneyText value="94172.00" currency="RSD" />,
        }}
        totalsLabel="Total without VAT"
      />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ChangeText>

export default meta

type Story = StoryObj<typeof meta>

/** A decrease against one invoice: quantity and amount, each Original / Change / New. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = canvas.getByRole('row', { name: /Gypsum boards/ })
    await expect(row).toHaveTextContent('140-20120')
    await expect(row).toHaveTextContent('-13.780,00')
  },
}

/** Several invoices of a period: a rebate, one line per invoice; default headers. */
export const SeveralDocuments: Story = {
  name: 'Several documents for a period',
  render: () => (
    <ExampleProvider>
      <DataTable
        label="Rebate for September 2026"
        layout="table"
        columns={columns(false, true)}
        rows={PERIOD}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.document ?? row.item}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('columnheader', { name: 'Original' }),
    ).toBeVisible()
  },
}

/** An increase: the change with "+"; an empty change is a dash. */
export const Increase: Story = {
  render: () => {
    function Values() {
      const { format } = useLiro()
      return (
        <dl className="m-0 flex flex-col gap-2 text-sm">
          <div className="flex gap-4">
            <dt className="text-secondary">Amount change</dt>
            <dd className="m-0">
              <ChangeText value="2466.00" currency="RSD" />
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-secondary">Quantity change</dt>
            <dd className="m-0">
              <ChangeText value="12.5" decimals={3} />
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-secondary">No change</dt>
            <dd className="m-0">
              <ChangeText value={null} />
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-secondary">Written by format</dt>
            <dd className="m-0">{format.number('0.5', { sign: 'always' })}</dd>
          </div>
        </dl>
      )
    }
    return (
      <ExampleProvider>
        <Values />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('+2.466,00')
    await expect(canvasElement).toHaveTextContent('+12,500')
  },
}

/** A long item name wraps in its cell. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <DataTable
        label="Corrected lines"
        layout="table"
        columns={columns(true, false)}
        rows={DECREASE.map((row) => ({
          ...row,
          item: `${row.item}, returned damaged after delivery note OTP-2026-0347, inspected on site on 01.10.2026.`,
        }))}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.item}
      />
    </ExampleProvider>
  ),
}

/** Phone width: each corrected line a row of the flat list with its values. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <DataTable
          label="Corrected lines"
          layout="cards"
          columns={columns(true, false)}
          rows={DECREASE}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.item}
        />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic item names in a right-to-left table; the signed amounts stay left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DataTable
          label="البنود المصححة"
          layout="table"
          columns={columns(true, false)}
          rows={DECREASE.map((row) => ({ ...row, item: 'ألواح الجبس' }))}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.item}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese item names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DataTable
          label="訂正明細"
          layout="table"
          columns={columns(true, false)}
          rows={DECREASE.map((row) => ({ ...row, item: '石膏ボード' }))}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.item}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

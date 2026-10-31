import type { Meta, StoryObj } from '@storybook/react-vite'
import { Merge } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { UnavailableAction } from './actions'
import { Button } from './button'
import { ConfirmDialog } from './confirm-dialog'
import { chosenCounts } from './value-comparison'
import { DateText, MoneyText } from './display-text'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { ValueComparison, type ComparisonRow } from './value-comparison'

const money = (value: string) => <MoneyText value={value} currency="GBP" />

/** A supplier's open items as both sides keep them; two differ (fictitious). */
const OPEN_ITEMS: ComparisonRow[] = [
  {
    id: 'inv-1001',
    label: 'INV-1001 · 06.08.2026',
    values: [money('720.00'), money('720.00')],
    numeric: true,
  },
  {
    id: 'inv-1017',
    label: 'INV-1017 · 15.09.2026',
    values: [money('310.00'), money('310.00')],
    numeric: true,
  },
  {
    id: 'inv-1022',
    label: 'INV-1022 · 02.09.2026',
    values: ['Paid 30.09.2026', money('480.00')],
    numeric: true,
    differs: true,
    note: 'Paid by us, open in theirs',
  },
  {
    id: 'inv-1031',
    label: 'INV-1031 · 28.09.2026',
    values: ['Not in our books', money('96.00')],
    numeric: true,
    differs: true,
    note: 'Only in their statement',
  },
]

/** One payment's facts as both sides recorded them. */
const PAYMENT: ComparisonRow[] = [
  { id: 'document', label: 'Document', values: ['INV-1022', 'INV-1022'] },
  { id: 'amount', label: 'Amount', values: [money('480.00'), money('480.00')], numeric: true },
  {
    id: 'date',
    label: 'Payment booked',
    values: [
      <DateText key="ours" value="2026-09-30" />,
      <DateText key="theirs" value="2026-10-01" />,
    ],
    numeric: true,
    differs: true,
    note: 'Dates differ',
  },
  { id: 'reference', label: 'Reference', values: ['97 12-1022', null] },
]

const meta = {
  title: 'Components/Display/ValueComparison',
  component: ValueComparison,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the same things as two sources record them, side by side, the ' +
          'differences marked in words with an icon on the warning background — our open items ' +
          'beside a partner’s statement, a payment as each side booked it; or three sources — ' +
          'an order, its receipt and the invoice (the three-way match). It compares nothing: ' +
          'which rows differ, and why, is the application’s (`differs`, `note`). Phones show one ' +
          'card per row, each value labelled with its source. To merge two records, ' +
          '`chosen` and `onChoose` make each differing row a choice of the value to keep (radio ' +
          'buttons, the kept value the neutral selection); `chosen` alone shows what was kept.\n\n' +
          '**Merging:** only the differing fields by default (“Show identical fields” ' +
          'brings back the rest); one press on a value keeps it, marked “Kept”; “Keep all from …” ' +
          '(`onChooseAll`) answers every row from one record; the merged record is previewed ' +
          'under the comparison as the choices are made; the merge — it cannot be undone — is ' +
          'confirmed once, by the application. On a phone each differing field is a card with ' +
          'its two values stacked as large choices. Every value starts at the start of its ' +
          'column, figures in tabular digits, so the sources compare at a glance.\n\n' +
          '**When to use:** reconciling two records of the same things, where the user must see ' +
          'both. **When not:** a change from an old to a new value (ChangeConfirmDialog, ' +
          'ChangeText); two versions of a text (LegalCompare); choosing which record a line ' +
          'closes (CandidateList).',
      },
    },
  },
  args: {
    label: 'Open items at 30.09.2026',
    columns: ['Our books', 'Their statement'],
    rows: OPEN_ITEMS,
    rowHeader: 'Document',
    layout: 'desktop',
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-3xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof ValueComparison>

export default meta

type Story = StoryObj<typeof meta>

/** Four open items; two differ, each with the application's words. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('2 of 4 differ')
    const table = canvas.getByRole('table', { name: 'Open items at 30.09.2026' })
    await expect(within(table).getByText('Only in their statement')).toBeVisible()
    await expect(table.querySelectorAll('[data-differs="true"]')).toHaveLength(2)
  },
}

/** One record's facts as both sides keep them. */
export const Details: Story = {
  name: 'One record’s details',
  args: { label: 'Payment for INV-1022', rows: PAYMENT, rowHeader: undefined },
}

/** Nothing differs. */
export const NoDifferences: Story = {
  name: 'No differences',
  args: { rows: OPEN_ITEMS.slice(0, 2) },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('No differences')
  },
}

/** The application is gathering the values. */
export const Loading: Story = {
  args: { loading: true },
}

/** Nothing to compare: the application's words. */
export const Empty: Story = {
  args: { rows: [], empty: 'Neither side has open items at 30.09.2026.' },
}

/** Long names and notes. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    columns: ['Our books (purchase ledger, account 4350)', 'Their statement as they sent it'],
    rows: OPEN_ITEMS.map((row) =>
      row.id === 'inv-1031'
        ? {
            ...row,
            label: 'INV-1031 · 28.09.2026 · Timber delivery to the Harbour Road site, second half',
            note: 'Only in their statement: we have not received this invoice by post or e-mail',
          }
        : row,
    ),
  },
}

/** Phone width: one card per row. */
export const Phone: Story = {
  args: { layout: 'phone' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** One order line as the order, the receipt and the invoice record it (fictitious). */
const THREE_WAY: ComparisonRow[] = [
  {
    id: 'timber-qty',
    label: 'Timber 45 × 95, quantity',
    values: ['40 m', '38 m', '38 m'],
    numeric: true,
    note: 'Invoiced as received',
  },
  {
    id: 'timber-price',
    label: 'Timber 45 × 95, price',
    values: [money('4.20'), null, money('4.20')],
    numeric: true,
  },
  {
    id: 'delivery',
    label: 'Delivery, quantity',
    values: ['1', '1', '2'],
    numeric: true,
    differs: true,
    note: 'Invoiced twice, received once',
  },
]

/** Three sources: an order, its receipt and the invoice (the three-way match). */
export const ThreeSources: Story = {
  name: 'Three sources',
  args: {
    label: 'Order PO-118, receipt GR-204, invoice INV-1040',
    columns: ['Order', 'Receipt', 'Invoice'],
    rows: THREE_WAY,
    rowHeader: 'Line',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('1 of 3 differ')
    const table = canvas.getByRole('table', { name: /^Order PO-118/ })
    await expect(within(table).getAllByRole('columnheader')).toHaveLength(5)
    await expect(within(table).getByText('Invoiced twice, received once')).toBeVisible()
  },
}

/** Three sources on a phone: three labelled values per card. */
export const ThreeSourcesPhone: Story = {
  name: 'Three sources, phone',
  args: {
    label: 'Order PO-118, receipt GR-204, invoice INV-1040',
    columns: ['Order', 'Receipt', 'Invoice'],
    rows: THREE_WAY,
    layout: 'phone',
  },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    label: 'البنود المفتوحة',
    columns: ['دفاترنا', 'كشفهم'],
    rowHeader: 'المستند',
    rows: [
      { id: 'a', label: 'فاتورة 1001', values: [money('720.00'), money('720.00')], numeric: true },
      {
        id: 'b',
        label: 'فاتورة 1031',
        values: ['غير موجودة في دفاترنا', money('96.00')],
        numeric: true,
        differs: true,
        note: 'في كشفهم فقط',
      },
    ],
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    label: '未決済項目',
    columns: ['当社帳簿', '先方明細'],
    rowHeader: '書類',
    rows: [
      { id: 'a', label: '請求書 1001', values: [money('720.00'), money('720.00')], numeric: true },
      {
        id: 'b',
        label: '請求書 1031',
        values: ['当社帳簿になし', money('96.00')],
        numeric: true,
        differs: true,
        note: '先方明細のみ',
      },
    ],
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

// ── Choosing the values to keep ──

/** Two records of one supplier, the values that differ chosen one by one (fictitious). */
const MERGE_ROWS: ComparisonRow[] = [
  {
    id: 'name',
    label: 'Name',
    values: ['Harbour Timber Ltd', 'Harbour-Timber Ltd.'],
    differs: true,
  },
  { id: 'tax', label: 'Tax number', values: ['GB 204 5512 08', 'GB 204 5512 08'] },
  {
    id: 'address',
    label: 'Address',
    values: ['4 Quay Street, Bristol', '4 Quay St, Bristol BS1'],
    differs: true,
  },
  { id: 'email', label: 'E-mail', values: ['accounts@example.com', null], differs: true },
  { id: 'terms', label: 'Payment terms', values: ['30 days', '15 days'], differs: true },
]

/** The comparison with the choice kept as the application keeps it. */
function Choosing(props: Parameters<typeof ValueComparison>[0]) {
  const [chosen, setChosen] = useState<Record<string, number>>(props.chosen ?? {})
  return (
    <ValueComparison
      {...props}
      chosen={chosen}
      onChoose={(rowId, index) => {
        setChosen((current) => ({ ...current, [rowId]: index }))
      }}
      onChooseAll={(index) => {
        setChosen(
          Object.fromEntries(
            props.rows.filter((row) => row.differs === true).map((row) => [row.id, index]),
          ),
        )
      }}
    />
  )
}

/**
 * The application's merge around the comparison: Merge only once every differing field
 * is chosen, then one confirmation — a merge cannot be undone.
 */
function MergeScreen(props: Parameters<typeof ValueComparison>[0]) {
  const [chosen, setChosen] = useState<Record<string, number>>(props.chosen ?? {})
  const [confirming, setConfirming] = useState(false)
  const [merged, setMerged] = useState(false)
  const counts = chosenCounts(props.rows, chosen)
  const left = counts.total - counts.chosen
  return (
    <div className="flex flex-col gap-4">
      <ValueComparison
        {...props}
        chosen={chosen}
        onChoose={(rowId, index) => {
          setChosen((current) => ({ ...current, [rowId]: index }))
        }}
        onChooseAll={(index) => {
          setChosen(
            Object.fromEntries(
              props.rows.filter((row) => row.differs === true).map((row) => [row.id, index]),
            ),
          )
        }}
      />
      <div className="flex justify-end">
        {left === 0 ? (
          <Button
            family="caution"
            icon={Merge}
            emphasis="primary"
            label="Merge records"
            onClick={() => {
              setConfirming(true)
            }}
          />
        ) : (
          <UnavailableAction
            family="caution"
            icon={Merge}
            emphasis="primary"
            label="Merge records"
            reason={`Choose the value to keep in ${String(left)} more ${left === 1 ? 'field' : 'fields'}.`}
          />
        )}
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        family="caution"
        actionIcon={Merge}
        title="Merge records"
        subject="Harbour-Timber Ltd. into Harbour Timber Ltd"
        message="Its documents move to Harbour Timber Ltd with the values chosen, and Harbour-Timber Ltd. is removed. A merge cannot be undone."
        confirmLabel="Merge records"
        onConfirm={() => {
          setMerged(true)
          setConfirming(false)
        }}
      />
      <p role="status" className="bidi-content m-0 text-sm text-primary">
        {merged ? 'Harbour-Timber Ltd. merged into Harbour Timber Ltd.' : ''}
      </p>
    </div>
  )
}

const MERGE_ARGS = {
  label: 'Values to keep',
  columns: ['Harbour Timber Ltd (stays)', 'Harbour-Timber Ltd. (merged into it)'],
  rows: MERGE_ROWS,
  rowHeader: 'Field',
} as const

/**
 * Merging two records: each differing row's values are radio buttons; the kept value is
 * the neutral selection, a row still to choose stays on the warning background.
 */
export const ChooseValues: Story = {
  name: 'Choose the values to keep',
  args: { ...MERGE_ARGS, chosen: { name: 0, email: 0 } },
  render: (args) => <Choosing {...args} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('2 of 4 chosen')
    await expect(canvas.getAllByRole('radio')).toHaveLength(8)
    await expect(canvas.getAllByText('Choose the value to keep')).toHaveLength(2)
  },
}

/**
 * Merging two records: only the four differing fields (the tax number is the same, behind
 * "Show identical fields"), "Keep all from …" for either record, two values kept ("Kept"), the
 * merged record previewed under them, and Merge waiting for the other two.
 */
export const MergeRecords: Story = {
  name: 'Merge two records',
  args: { ...MERGE_ARGS, chosen: { name: 0, email: 0 } },
  render: (args) => <MergeScreen {...args} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('switch', { name: 'Show identical fields (1)' }),
    ).not.toBeChecked()
    await expect(canvas.getAllByText('Kept')).toHaveLength(2)
    await expect(
      canvas.getByRole('button', { name: 'Keep all from Harbour Timber Ltd (stays)' }),
    ).toBeVisible()
    await expect(canvas.getByRole('region', { name: 'Merged record' })).toHaveTextContent(
      'GB 204 5512 08',
    )
    await expect(canvas.getByRole('button', { name: 'Merge records' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/**
 * Merging, the whole way: "Keep all from" the record that stays, one value from the other, the
 * identical fields shown on request, then Merge and its one confirmation.
 */
export const MergeRecordsInteraction: Story = {
  name: 'Merge two records, interaction',
  tags: ['interaction', '!dev'],
  args: { ...MERGE_ARGS },
  render: (args) => <MergeScreen {...args} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const preview = canvas.getByRole('region', { name: 'Merged record' })
    await expect(preview).toHaveTextContent('Not chosen yet')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Keep all from Harbour Timber Ltd (stays)' }),
    )
    await expect(canvas.getByText('4 of 4 chosen')).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: /4 Quay St, Bristol BS1/ }))
    await expect(preview).toHaveTextContent('4 Quay St, Bristol BS1')
    await expect(preview).not.toHaveTextContent('Not chosen yet')
    await expect(canvas.queryByRole('rowheader', { name: 'Tax number' })).toBeNull()
    await userEvent.click(canvas.getByRole('switch', { name: 'Show identical fields (1)' }))
    await expect(canvas.getByRole('rowheader', { name: 'Tax number' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Merge records' }))
    const dialog = within(await within(document.body).findByRole('alertdialog'))
    await userEvent.click(dialog.getByRole('button', { name: 'Merge records' }))
    await expect(
      await canvas.findByText('Harbour-Timber Ltd. merged into Harbour Timber Ltd.'),
    ).toBeVisible()
  },
}

/** On a phone: a card per differing field, its two values stacked as large choices. */
export const ChooseValuesPhone: Story = {
  name: 'Merge two records, phone',
  args: { ...MERGE_ARGS, chosen: { name: 0, email: 0 }, layout: 'phone' },
  render: (args) => <MergeScreen {...args} />,
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('radiogroup')).toHaveLength(4)
    await expect(canvas.getAllByText('Kept')).toHaveLength(2)
  },
}

/** The choice shown, not changed: what a merge kept. */
export const ValuesKept: Story = {
  name: 'Values kept',
  args: {
    ...MERGE_ARGS,
    label: 'Values kept',
    chosen: { name: 0, address: 1, email: 0, terms: 0 },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('radio')).toHaveLength(0)
    await expect(canvas.getByRole('status')).toHaveTextContent('4 of 4 chosen')
  },
}

/** Choosing from the keyboard: a press chooses, the arrows move the choice within the row. */
export const ChooseValuesKeyboard: Story = {
  name: 'Choose the values to keep, interaction',
  tags: ['interaction'],
  args: { ...MERGE_ARGS },
  render: (args) => <Choosing {...args} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: /4 Quay St, Bristol BS1/ }))
    await expect(canvas.getByRole('status')).toHaveTextContent('1 of 4 chosen')
    await userEvent.keyboard('{ArrowUp}')
    await expect(canvas.getByRole('radio', { name: /4 Quay Street, Bristol/ })).toBeChecked()
    await expect(canvas.getByRole('status')).toHaveTextContent('1 of 4 chosen')
  },
}

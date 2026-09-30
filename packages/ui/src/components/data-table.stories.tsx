import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eye, Pencil } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { DataTable, type DataTableColumn } from './data-table'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import { DateText, MoneyText } from './display-text'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StatusBadge, toneFor, type Tone } from './status-badge'

const meta = {
  title: 'Components/Table/DataTable',
  component: DataTable,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a list of records — columns, sort, selection with bulk actions, a menu ' +
          'of actions per row, totals, the count and paging by cursor. **Controlled:** the ' +
          'application fetches, sorts, filters and sums on the server; the table shows the rows ' +
          'in the order they come and every total as given, and reports each change through a ' +
          'callback. Headers sort ascending, then descending, then ascending again. The first ' +
          'load shows skeleton bars; a refetch keeps the rows with a small loader. An empty ' +
          'table says "nothing here yet" (with the first step) or, when filters are set, "no ' +
          'rows match" (with "Clear filters").\n\n**When not:** a few labelled values of one ' +
          'record (KeyValueList); editing lines (the editable grid, P3.4); a phone (card layout, ' +
          'P3.2).',
      },
    },
  },
  args: {
    label: 'Invoices',
    columns: [],
    rows: [],
    getRowId: () => '',
    getRowLabel: () => '',
  },
  play: settle,
} satisfies Meta<typeof DataTable>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

/** Fictitious data (AGENTS.md D5: examples may use domain words). */
interface Invoice {
  id: string
  number: string
  customer: string
  date: string
  status: string
  amount: string
}

const STATUS_TONES: Record<string, Tone> = { draft: 'neutral', sent: 'info', paid: 'success' }
const STATUS_NAMES: Record<string, string> = { draft: 'Draft', sent: 'Sent', paid: 'Paid' }

const FIRST: Invoice = {
  id: '1',
  number: 'F-2026-114',
  customer: 'Alfa Trade d.o.o.',
  date: '2026-09-28',
  status: 'sent',
  amount: '12345.60',
}

const INVOICES: Invoice[] = [
  FIRST,

  {
    id: '2',
    number: 'F-2026-113',
    customer: 'Beta Logistika',
    date: '2026-09-25',
    status: 'paid',
    amount: '980.00',
  },
  {
    id: '3',
    number: 'F-2026-112',
    customer: 'Gama Projekt',
    date: '2026-09-21',
    status: 'draft',
    amount: '-150.25',
  },
  {
    id: '4',
    number: 'F-2026-111',
    customer: 'Delta Servis',
    date: '2026-09-18',
    status: 'paid',
    amount: '4200.00',
  },
]

const AMOUNT: DataTableColumn<Invoice> = {
  id: 'amount',
  header: 'Amount',
  cell: (row) => <MoneyText value={row.amount} currency="EUR" />,
  align: 'end',
  numeric: true,
  sortable: true,
}

const COLUMNS: DataTableColumn<Invoice>[] = [
  { id: 'number', header: 'Number', cell: (row) => row.number, sortable: true, numeric: true },
  { id: 'customer', header: 'Customer', cell: (row) => row.customer, sortable: true },
  {
    id: 'date',
    header: 'Date',
    cell: (row) => <DateText value={row.date} />,
    sortable: true,
    numeric: true,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <StatusBadge
        label={STATUS_NAMES[row.status] ?? row.status}
        tone={toneFor(row.status, STATUS_TONES)}
      />
    ),
  },
  AMOUNT,
]

const BASE = {
  label: 'Invoices',
  columns: COLUMNS,
  getRowId: (row: Invoice) => row.id,
  getRowLabel: (row: Invoice) => row.number,
}

/** The "server" of the stories: it sorts, as the application does. The table never sorts. */
function sortOnServer(rows: readonly Invoice[], sort: DataTableSort): Invoice[] {
  if (sort === null) return [...rows]
  const key = sort.column as keyof Invoice
  const factor = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (key === 'amount') {
      // Fictitious comparison for the story only; amounts stay decimal strings everywhere else.
      return factor * a.amount.localeCompare(b.amount, 'en', { numeric: true })
    }
    return factor * a[key].localeCompare(b[key])
  })
}

const ROW_ACTIONS = (row: Invoice) => [
  { label: 'View', icon: Eye, onSelect: noop },
  { label: 'Edit', icon: Pencil, onSelect: noop, disabled: row.status === 'paid' },
  { type: 'separator' as const },
  { label: 'Delete', onSelect: noop, destructive: true },
]

/** A table with its own state, as an application keeps it. */
function Interactive(props: Partial<ComponentProps<typeof DataTable<Invoice>>>) {
  const [sort, setSort] = useState<DataTableSort>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [opened, setOpened] = useState<string | null>(null)
  return (
    <div className="flex max-w-240 flex-col gap-2">
      <DataTable
        {...BASE}
        rows={sortOnServer(INVOICES, sort)}
        sort={sort}
        onSortChange={setSort}
        selection={selection}
        onSelectionChange={setSelection}
        bulkActions={[
          { key: 'export', intent: 'export', label: 'Export', onClick: noop },
          { key: 'delete', intent: 'delete', label: 'Delete', onClick: noop },
        ]}
        onSelectAll={noop}
        onRowClick={(row) => {
          setOpened(row.number)
        }}
        rowActions={ROW_ACTIONS}
        totals={{ amount: <MoneyText value="17375.35" currency="EUR" /> }}
        totalsLabel="Total"
        count={48}
        hasNext
        onNext={noop}
        onPrevious={noop}
        exportAction={<Button intent="export" label="Export" />}
        {...props}
      />
      <p className="m-0 text-sm text-secondary" data-testid="opened">
        {opened === null ? 'No row opened.' : `Opened ${opened}.`}
      </p>
    </div>
  )
}

/**
 * Sort (headers), selection with the bulk bar, a row menu, row press, totals, count and paging.
 * The story's "server" sorts; the table only shows what it is given.
 */
export const Default: Story = {
  render: () => <Interactive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('columnheader', { name: /Customer/ })
    await expect(header).toHaveAttribute('aria-sort', 'none')
    await userEvent.click(canvas.getByRole('button', { name: /Customer/ }))
    await expect(header).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(canvas.getByRole('button', { name: /Customer/ }))
    await expect(header).toHaveAttribute('aria-sort', 'descending')
    await userEvent.click(canvas.getByRole('button', { name: /Customer/ }))
    await expect(header).toHaveAttribute('aria-sort', 'ascending')
    await expect(canvas.getByRole('columnheader', { name: 'Status' })).not.toHaveAttribute(
      'aria-sort',
    )

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select F-2026-113' }))
    const count = await canvas.findByText('1 selected')
    await settle()
    await expect(count).toBeVisible()
    await expect(canvas.getByRole('checkbox', { name: 'Select all rows shown' })).toHaveAttribute(
      'data-state',
      'indeterminate',
    )

    await userEvent.click(canvas.getByText('Delta Servis'))
    await expect(canvas.getByTestId('opened')).toHaveTextContent('Opened F-2026-111.')
    await settle()
  },
}

/** The first load: five skeleton bars under the header. */
export const Loading: Story = {
  render: () => (
    <div className="max-w-240">
      <DataTable {...BASE} rows={[]} loading />
    </div>
  ),
}

/** A refetch (e.g. after a filter change): the rows stay, a small loader in the top end corner. */
export const Refetching: Story = {
  render: () => (
    <div className="max-w-240">
      <DataTable {...BASE} rows={INVOICES} loading count={4} />
    </div>
  ),
}

/** Nothing yet: the empty state with the first step. */
export const Empty: Story = {
  name: 'Empty (nothing here yet)',
  render: () => (
    <div className="max-w-240">
      <DataTable
        {...BASE}
        rows={[]}
        emptyAction={{ label: 'Create an invoice', onClick: noop }}
        count={0}
      />
    </div>
  ),
}

function Filtered() {
  const [filters, setFilters] = useState<DataTableFilters>({ status: ['cancelled'] })
  return (
    <div className="max-w-240">
      <DataTable
        {...BASE}
        rows={[]}
        filters={filters}
        onFiltersChange={setFilters}
        emptyAction={{ label: 'Create an invoice', onClick: noop }}
      />
    </div>
  )
}

/** Filters match nothing: "no rows match" with "Clear filters", which clears them. */
export const NoMatch: Story = {
  name: 'No match (clear filters)',
  render: () => <Filtered />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No rows match')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(canvas.getByText('Nothing here yet')).toBeVisible())
  },
}

const MANY: Invoice[] = Array.from({ length: 30 }, (_, index) => {
  const base = INVOICES[index % INVOICES.length] ?? FIRST
  return {
    ...base,
    id: String(index + 1),
    number: `F-2026-${String(200 - index)}`,
  }
})

/**
 * Inside a height: the header stays at the top and the totals at the bottom while the rows scroll.
 */
export const StickyHeaderAndTotals: Story = {
  name: 'Sticky header and totals',
  render: () => (
    <div className="max-w-240">
      <DataTable
        {...BASE}
        rows={MANY}
        stickyHeader
        maxHeight="320px"
        totals={{ amount: <MoneyText value="102482.10" currency="EUR" /> }}
        totalsLabel="Total"
      />
    </div>
  ),
}

/** A count above the threshold, and the application's row-limit message. */
export const CountAndRowLimit: Story = {
  name: 'Count above the threshold, row limit',
  render: () => (
    <div className="max-w-240">
      <DataTable
        {...BASE}
        rows={INVOICES}
        count={25_000}
        hasPrevious
        hasNext
        onPrevious={noop}
        onNext={noop}
        rowLimitMessage="Only the first 5,000 rows can be exported. Narrow the filters to export the rest."
      />
    </div>
  ),
}

/** Long text wraps in its cell; at phone width the table scrolls sideways (cards: P3.2). */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <DataTable
        {...BASE}
        rows={[{ ...FIRST, customer: LONG.value }, ...INVOICES.slice(1)]}
        rowActions={ROW_ACTIONS}
        count={4}
      />
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="max-w-240">
      <DataTable
        {...BASE}
        label={ARABIC.label}
        columns={[
          { id: 'customer', header: ARABIC.label, cell: (row) => row.customer, sortable: true },
          { ...AMOUNT, header: ARABIC.options[0] },
        ]}
        rows={INVOICES.map((row) => ({ ...row, customer: ARABIC.value }))}
        sort={{ column: 'customer', direction: 'asc' }}
        onSortChange={noop}
        totals={{ amount: <MoneyText value="17375.35" currency="EUR" /> }}
        totalsLabel={ARABIC.options[2]}
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="max-w-240">
      <DataTable
        {...BASE}
        label={JAPANESE.label}
        columns={[
          { id: 'customer', header: JAPANESE.label, cell: (row) => row.customer, sortable: true },
          { ...AMOUNT, header: JAPANESE.options[0] },
        ]}
        rows={INVOICES.map((row) => ({ ...row, customer: JAPANESE.value }))}
        sort={{ column: 'customer', direction: 'desc' }}
        onSortChange={noop}
        selection={['2']}
        onSelectionChange={noop}
      />
    </div>
  ),
}

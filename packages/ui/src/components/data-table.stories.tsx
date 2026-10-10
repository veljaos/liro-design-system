import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eye, Pencil } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { DataTable, type DataTableColumn } from './data-table'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import { DateText, MoneyText, NumberText } from './display-text'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StatusBadge, toneFor, type Tone } from './status-badge'
import type { LineType } from './line-types'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'
import { DESCRIPTION_MIN_WIDTH } from './data-table-logic'

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
          'P3.2).\n\n**Line types (P5.18):** a document’s read-only lines and a specification ' +
          'pass `lineType` (the types of `line-types.ts`): a heading bold across the row, a text ' +
          'line smaller and secondary, a subtotal semibold with a rule above and its label ' +
          'end-aligned before the amounts (the trailing end-aligned columns), discounts and ' +
          'deductions as lines with negative amounts from the application. `lineKind` writes ' +
          'what a line is ("Item", "Service") as small secondary text under its first cell. ' +
          'Phones keep the types by typography.',
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
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
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

/**
 * A refetch (e.g. after a filter change): the rows stay; a small loader above the table at the
 * end, in a slot that is always reserved, and "Updating…" for screen readers.
 */
export const Refetching: Story = {
  render: () => (
    <div className="max-w-240">
      <DataTable {...BASE} rows={INVOICES} loading count={4} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole('status')
    await expect(status).toHaveTextContent('Updating…')
    // Above the table, never over a header label (P3.6).
    const header = canvas.getByRole('columnheader', { name: 'Amount' }).getBoundingClientRect()
    await expect(status.getBoundingClientRect().bottom).toBeLessThanOrEqual(header.top)
    await settle()
  },
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
  },
}

export const NoMatchInteraction: Story = {
  name: 'No match (clear filters), interaction',
  tags: ['interaction'],
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

const MOBILE = {
  title: (row: Invoice) => row.customer,
  subtitle: (row: Invoice) => row.number,
  badge: (row: Invoice) => (
    <StatusBadge
      label={STATUS_NAMES[row.status] ?? row.status}
      tone={toneFor(row.status, STATUS_TONES)}
    />
  ),
  details: ['date', 'amount'],
}

/**
 * On a phone the rows are cards (only the cards are rendered): title and subtitle on one line
 * each, the badge and the row menu at the end, the details under them. Long text is cut with an
 * ellipsis in the title and wraps in a value. Stories force `layout="cards"`; in an application
 * `layout` 'auto' switches below 48em.
 */
export const LongTextPhone: Story = {
  name: 'Phone: cards, long text',
  render: () => {
    function Cards() {
      const [selection, setSelection] = useState<string[]>(['2'])
      return (
        <div className="w-[390px] max-w-full">
          <DataTable
            {...BASE}
            layout="cards"
            mobile={MOBILE}
            rows={[{ ...FIRST, customer: LONG.value }, ...INVOICES.slice(1)]}
            rowActions={ROW_ACTIONS}
            selection={selection}
            onSelectionChange={setSelection}
            bulkActions={[{ key: 'delete', intent: 'delete', label: 'Delete', onClick: noop }]}
            onRowClick={noop}
            totals={{ amount: <MoneyText value="17375.35" currency="EUR" /> }}
            totalsLabel="Total"
            count={4}
          />
        </div>
      )
    }
    return <Cards />
  },
}

/**
 * Phones, inside a card (`inCard`): no cards inside the card (P4.9) — one flat list, the rows
 * divided by a line, 12px by 16px each; the selected row neutral with its start bar; totals and
 * paging close the card.
 */
export const CardsInCard: Story = {
  name: 'Phone: in a card, a flat list',
  render: () => {
    function InCard() {
      const [selection, setSelection] = useState<string[]>(['2'])
      return (
        <div className="box-border w-[360px] max-w-full overflow-hidden rounded-lg border border-solid border-default bg-surface-raised">
          <DataTable
            {...BASE}
            layout="cards"
            inCard
            rows={INVOICES}
            mobile={MOBILE}
            rowActions={ROW_ACTIONS}
            selection={selection}
            onSelectionChange={setSelection}
            onRowClick={noop}
            totals={{ amount: <MoneyText value="17375.35" currency="EUR" /> }}
            totalsLabel="Total"
            count={1284}
            hasNext
            onNext={noop}
            onPrevious={noop}
          />
        </div>
      )
    }
    return <InCard />
  },
}

const THOUSAND: Invoice[] = Array.from({ length: 1000 }, (_, index) => {
  const base = INVOICES[index % INVOICES.length] ?? FIRST
  return { ...base, id: String(index + 1), number: `F-2026-${String(1000 + index)}` }
})

function LargeList({ cards }: { cards: boolean }) {
  const [selection, setSelection] = useState<string[]>([])
  const [sort, setSort] = useState<DataTableSort>(null)
  return (
    <div className={cards ? 'w-[390px] max-w-full' : 'max-w-240'}>
      <DataTable
        {...BASE}
        layout={cards ? 'cards' : 'table'}
        mobile={MOBILE}
        rows={sortOnServer(THOUSAND, sort)}
        sort={sort}
        onSortChange={setSort}
        selection={selection}
        onSelectionChange={setSelection}
        onRowClick={noop}
        rowActions={ROW_ACTIONS}
        virtualize
        maxHeight="480px"
        totals={{ amount: <MoneyText value="4343837.50" currency="EUR" /> }}
        totalsLabel="Total"
        count={1000}
      />
    </div>
  )
}

/**
 * 1,000 rows, virtualized: only the rows in view are drawn (44px each), the header stays at the
 * top and the totals at the bottom. Sorting and selecting stay quick (docs/decisions.md "Table").
 */
export const ThousandRows: Story = {
  name: '1,000 rows (virtualized)',
  render: () => <LargeList cards={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table')).toHaveAttribute('aria-rowcount', '1002')
    await expect(canvas.getAllByRole('row').length).toBeLessThan(60)
  },
}

export const ThousandRowsInteraction: Story = {
  name: '1,000 rows (virtualized), interaction',
  tags: ['interaction'],
  render: () => <LargeList cards={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table')).toHaveAttribute('aria-rowcount', '1002')
    await expect(canvas.getAllByRole('row').length).toBeLessThan(60)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select F-2026-1001' }))
    await expect(canvas.getByRole('checkbox', { name: 'Select F-2026-1001' })).toBeChecked()
  },
}

/** 1,000 cards on a phone, virtualized: each card measured once drawn (estimate 104px). */
export const ThousandCards: Story = {
  name: '1,000 cards (phone, virtualized)',
  render: () => <LargeList cards />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('listitem').length).toBeLessThan(40)
    await expect(canvas.getAllByRole('listitem')[0]).toHaveAttribute('aria-setsize', '1000')
  },
}

function Resizing() {
  const [widths, setWidths] = useState<Record<string, number>>({})
  return (
    <div className="flex max-w-240 flex-col gap-2">
      <DataTable
        {...BASE}
        columns={COLUMNS.map((column) =>
          column.id === 'customer' ? { ...column, width: 140 } : column,
        )}
        rows={[{ ...FIRST, customer: LONG.value }, ...INVOICES.slice(1)]}
        sort={null}
        onSortChange={noop}
        resizable
        onColumnWidthsChange={setWidths}
      />
      <p className="m-0 text-sm text-secondary" data-testid="widths">
        {Object.keys(widths).length === 0
          ? 'Not resized yet.'
          : `Customer: ${String(widths.customer)}px`}
      </p>
    </div>
  )
}

/**
 * Resizable columns: drag the line at a header's end (it shows while the pointer is over the
 * header), use the arrow keys on it (10px, Shift 40px; the arrow that widens points in the reading
 * direction), or press it without moving for "Narrower" and "Wider" (no dragging needed, WCAG
 * 2.5.7). Widths stay between 64px and 640px; what does not fit ends with "…". The table is as
 * wide as its columns, so one column never moves another.
 */
export const ResizableColumns: Story = {
  name: 'Resizable columns',
  render: () => <Resizing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The widths are measured again when the web fonts finish loading; resize after that.
    await waitFor(() => expect(document.fonts.status).toBe('loaded'))
    const handle = await canvas.findByRole('separator', { name: 'Resize column: Customer' })
    // The arrow that widens points in the reading direction.
    await expect(handle).toHaveAttribute('aria-valuenow', '140')
    await settle()
  },
}

export const ResizableColumnsInteraction: Story = {
  name: 'Resizable columns, interaction',
  tags: ['interaction'],
  render: () => <Resizing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    // The widths are measured again when the web fonts finish loading; resize after that.
    await waitFor(() => expect(document.fonts.status).toBe('loaded'))
    const handle = await canvas.findByRole('separator', { name: 'Resize column: Customer' })
    // The arrow that widens points in the reading direction.
    const rtl = getComputedStyle(handle).direction === 'rtl'
    const wider = rtl ? '{ArrowLeft}' : '{ArrowRight}'
    await expect(handle).toHaveAttribute('aria-valuenow', '140')
    handle.focus()
    await userEvent.keyboard(wider)
    await expect(handle).toHaveAttribute('aria-valuenow', '150')
    await userEvent.keyboard(`{Shift>}${wider}{/Shift}`)
    await expect(handle).toHaveAttribute('aria-valuenow', '190')
    await waitFor(() => expect(canvas.getByTestId('widths')).toHaveTextContent('Customer: 190px'))

    await userEvent.click(handle)
    await userEvent.click(await body.findByRole('button', { name: 'Narrower: Customer' }))
    await expect(handle).toHaveAttribute('aria-valuenow', '150')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(handle).toHaveFocus())
    // End without focus: whether a returned focus counts as keyboard focus (:focus-visible) varies
    // between runs, and the picture must not.
    handle.blur()
    await settle()
  },
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

/**
 * English in a right-to-left page (P3.6): the headers ("Amount (EUR)") and the bulk bar's
 * "2 selected" keep their own order; columns, the selection bar and the selected rows' bar stay
 * right to left.
 */
export const EnglishInRtl: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Interactive
        layout="table"
        columns={[...COLUMNS.slice(0, 4), { ...AMOUNT, header: 'Amount (EUR)' }]}
      />
    </StoryProvider>
  ),
  play: async () => {
    await settle()
  },
}

export const EnglishInRtlInteraction: Story = {
  name: 'English in rtl, interaction',
  tags: ['interaction'],
  render: () => (
    <StoryProvider locale="ar">
      <Interactive
        layout="table"
        columns={[...COLUMNS.slice(0, 4), { ...AMOUNT, header: 'Amount (EUR)' }]}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const boxes = canvas.getAllByRole('checkbox')
    await userEvent.click(boxes[1] ?? canvasElement)
    await userEvent.click(boxes[2] ?? canvasElement)
    await expectContentDirection(
      await canvas.findByText('2 selected'),
      canvas.getByText('Amount (EUR)'),
      canvas.getAllByText('Alfa Trade d.o.o.')[0] ?? canvasElement,
    )
    await settle()
  },
}

// ── P5 group D2: line types (P5.18) ──────────────────────────────────────────────────────────

interface DocumentLine {
  id: string
  type: LineType
  item: string
  kind?: string
  quantity?: string
  unit?: string
  vat?: string
  amount?: string
}

/** Part of final invoice F-2026-0418: sections with subtotals, a text line, a discount. */
const DOCUMENT_LINES: DocumentLine[] = [
  { id: 'h1', type: 'heading', item: 'Steel structure' },
  {
    id: '1',
    type: 'line',
    item: 'Steel beams HEA 200, S275JR',
    kind: 'Item',
    quantity: '12.6',
    unit: 't',
    vat: 'S 20%',
    amount: '1799280.00',
  },
  {
    id: '2',
    type: 'line',
    item: 'Steel columns HEB 240, S275JR',
    kind: 'Item',
    quantity: '8.4',
    unit: 't',
    vat: 'S 20%',
    amount: '1230600.00',
  },
  { id: 's1', type: 'subtotal', item: 'Total steel structure', amount: '3029880.00' },
  { id: 'h2', type: 'heading', item: 'Services' },
  {
    id: '3',
    type: 'line',
    item: 'Assembly drawings, printed and bound',
    kind: 'Service',
    quantity: '2',
    unit: 'lot',
    vat: 'S 10%',
    amount: '12800.00',
  },
  { id: 's2', type: 'subtotal', item: 'Total services', amount: '12800.00' },
  {
    id: 't',
    type: 'text',
    item: 'Delivered to the site at Temerinski put 51, Novi Sad, from 14 to 25 September 2026.',
  },
  {
    id: 'd',
    type: 'discount',
    item: 'Contract discount 3% on the steel structure',
    kind: 'Discount',
    vat: 'S 20%',
    amount: '-90896.40',
  },
  {
    id: 'a',
    type: 'deduction',
    item: 'Advance A-2026-038',
    kind: 'Deduction',
    vat: 'S 20%',
    amount: '-1000000.00',
  },
]

function LineAmount({ line }: { line: DocumentLine }) {
  return line.amount === undefined ? null : <MoneyText value={line.amount} currency="RSD" />
}

const LINE_TYPE_COLUMNS: DataTableColumn<DocumentLine>[] = [
  {
    id: 'item',
    header: 'Item',
    minWidth: DESCRIPTION_MIN_WIDTH,
    cell: (line) => line.item,
  },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (line) => (line.quantity === undefined ? null : <NumberText value={line.quantity} />),
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  { id: 'vat', header: 'VAT', cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <LineAmount line={line} />,
  },
]

function LineTypesTable({
  layout,
  selectable = false,
}: {
  layout: 'table' | 'cards'
  selectable?: boolean
}) {
  const [selection, setSelection] = useState<string[]>([])
  return (
    <div className="overflow-hidden rounded-lg border border-solid border-default bg-surface-raised">
      <DataTable
        label="Lines"
        layout={layout}
        inCard
        columns={LINE_TYPE_COLUMNS}
        rows={DOCUMENT_LINES}
        getRowId={(line) => line.id}
        getRowLabel={(line) => line.item}
        lineType={(line) => line.type}
        lineKind={(line) => line.kind}
        mobile={{ details: ['quantity', 'unit', 'vat', 'amount'] }}
        {...(selectable ? { selection, onSelectionChange: setSelection } : {})}
      />
    </div>
  )
}

/**
 * A document's lines with their types: headings bold across the row, subtotals end-aligned and
 * semibold under a rule, a text line small and secondary, a discount and a deduction as lines
 * with negative amounts; the kind under each item.
 */
export const LineTypes: Story = {
  name: 'Line types',
  render: () => (
    <ExampleProvider>
      <LineTypesTable layout="table" selectable />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const heading = canvas.getByText('Steel structure').closest('tr')
    await expect(heading).toHaveAttribute('data-line', 'heading')
    const subtotal = canvas.getByText('Total steel structure').closest('td')
    await expect(subtotal).toHaveClass('text-end', 'font-semibold')
    await expect(canvas.getByText('Total steel structure').closest('tr')).toHaveTextContent(
      '3.029.880,00',
    )
    // Only lines can be selected: the header's checkbox and one per line, discount and deduction.
    await expect(canvas.getAllByRole('checkbox')).toHaveLength(6)
    await expect(canvasElement).toHaveTextContent('-90.896,40')
  },
}

/** Phone width: the same order and types, by typography, as a flat list in the card. */
export const LineTypesPhone: Story = {
  name: 'Line types, phone',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <LineTypesTable layout="cards" />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const list = within(canvasElement).getByRole('list', { name: 'Lines' })
    await expect(list.querySelector('li[data-line="subtotal"]')).not.toBeNull()
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
  },
}

/** Arabic headings and items in a right-to-left table. */
export const LineTypesArabic: Story = {
  name: 'Line types, Arabic',
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DataTable
          label="البنود"
          layout="table"
          columns={LINE_TYPE_COLUMNS}
          rows={[
            { id: 'h', type: 'heading', item: 'الهيكل الفولاذي' },
            {
              id: '1',
              type: 'line',
              item: 'عوارض فولاذية',
              kind: 'صنف',
              quantity: '12.6',
              unit: 't',
              vat: 'S 20%',
              amount: '1799280.00',
            },
            { id: 's', type: 'subtotal', item: 'مجموع الهيكل الفولاذي', amount: '1799280.00' },
            { id: 't', type: 'text', item: 'تم التسليم إلى الموقع.' },
          ]}
          getRowId={(line) => line.id}
          getRowLabel={(line) => line.item}
          lineType={(line) => line.type}
          lineKind={(line) => line.kind}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese headings and items. */
export const LineTypesJapanese: Story = {
  name: 'Line types, Japanese',
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DataTable
          label="明細"
          layout="table"
          columns={LINE_TYPE_COLUMNS}
          rows={[
            { id: 'h', type: 'heading', item: '鉄骨工事' },
            {
              id: '1',
              type: 'line',
              item: '鉄骨梁 HEA 200',
              kind: '品目',
              quantity: '12.6',
              unit: 't',
              vat: 'S 20%',
              amount: '1799280.00',
            },
            { id: 's', type: 'subtotal', item: '鉄骨工事 小計', amount: '1799280.00' },
            { id: 't', type: 'text', item: '現場に納品済み。' },
          ]}
          getRowId={(line) => line.id}
          getRowLabel={(line) => line.item}
          lineType={(line) => line.type}
          lineKind={(line) => line.kind}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

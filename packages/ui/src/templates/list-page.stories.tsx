import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookmarkPlus, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../components/button'
import { DataTable, type DataTableColumn } from '../components/data-table'
import type { DataTableFilters } from '../components/data-table-logic'
import { DateText, DueDate, MoneyText } from '../components/display-text'
import { FilterBar } from '../components/filter-bar'
import type { FilterDefinition } from '../components/filter-logic'
import { StatusBadge, toneFor } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import {
  ColumnChooser,
  ListPage,
  QuickPreview,
  type ChooserColumn,
  type SavedView,
} from './list-page'
import {
  BRAND,
  COMMANDS,
  COMPANIES,
  INVOICE_LIST,
  SALES_TABS,
  USER,
  type InvoiceRow,
} from './shell-story-data'

const TONES = {
  Draft: 'neutral',
  Sent: 'info',
  Paid: 'success',
  Overdue: 'danger',
  'Partially paid': 'warning',
} as const

const ALL_COLUMNS: (DataTableColumn<InvoiceRow> & { label: string })[] = [
  { id: 'number', label: 'Number', header: 'Number', cell: (row) => row.number },
  { id: 'customer', label: 'Customer', header: 'Customer', cell: (row) => row.customer },
  {
    id: 'issued',
    label: 'Issued',
    header: 'Issued',
    numeric: true,
    sortable: true,
    cell: (row) => <DateText value={row.issued} />,
  },
  {
    id: 'due',
    label: 'Due',
    header: 'Due',
    numeric: true,
    sortable: true,
    // A paid invoice's due date is only a date: its status already says it is paid.
    cell: (row) =>
      row.status === 'Paid' ? <DateText value={row.due} /> : <DueDate value={row.due} />,
  },
  {
    id: 'total',
    label: 'Total',
    header: 'Total',
    align: 'end',
    numeric: true,
    sortable: true,
    cell: (row) => <MoneyText value={row.total} currency="RSD" />,
  },
  {
    id: 'status',
    label: 'Status',
    header: 'Status',
    cell: (row) => <StatusBadge label={row.status} tone={toneFor(row.status, TONES)} />,
  },
]

interface Rate {
  currency: string
  date: string
  rate: string
}

/** NBS middle rates of a fictitious day (illustrative values). */
const RATES: Rate[] = [
  { currency: 'EUR', date: '2026-10-06', rate: '117,1532' },
  { currency: 'USD', date: '2026-10-06', rate: '100,0418' },
  { currency: 'CHF', date: '2026-10-06', rate: '125,3307' },
  { currency: 'GBP', date: '2026-10-06', rate: '134,8915' },
]

/** Seven views: five tabs and "More" on desktop, one select on phones (P4.9). */
const VIEWS: SavedView[] = [
  { id: 'all', label: 'All', count: 1284 },
  { id: 'unpaid', label: 'Unpaid', count: 37 },
  { id: 'overdue', label: 'Overdue', count: 9 },
  { id: 'drafts', label: 'Drafts', count: 4 },
  { id: 'mine', label: 'Mine' },
  { id: 'sef', label: 'Rejected by SEF', count: 2 },
  { id: 'cancelled', label: 'Cancelled', count: 6 },
]

/** Many views: the phone's select gets a search field above 7. */
const MANY_VIEWS: SavedView[] = [
  ...VIEWS,
  { id: 'export', label: 'Export customers', count: 118 },
  { id: 'novisad', label: 'Customers in Novi Sad', count: 342 },
]

const FILTERS: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
    ],
  },
  { id: 'issued', label: 'Issue date', type: 'dateRange' },
  { id: 'total', label: 'Total', type: 'numberRange', decimals: 2, currency: 'RSD' },
]

/** The invoice list as the Core would drive it: state lives here, the DS only renders. */
function InvoiceList({
  phone = false,
  previewOpen = false,
  views = VIEWS,
}: {
  phone?: boolean
  previewOpen?: boolean
  views?: readonly SavedView[]
}) {
  const [view, setView] = useState('all')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const [columns, setColumns] = useState<ChooserColumn[]>(
    ALL_COLUMNS.map((column) => ({
      id: column.id,
      label: column.label,
      visible: true,
      ...(column.id === 'number' ? { required: true } : {}),
    })),
  )
  const [preview, setPreview] = useState<InvoiceRow | null>(
    previewOpen ? (INVOICE_LIST[1] ?? null) : null,
  )
  const shown = columns
    .filter((column) => column.visible)
    .flatMap((column) => ALL_COLUMNS.filter((each) => each.id === column.id))

  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Sales', href: '#sales' }, { label: 'Invoices' }]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 3, panel: <p className="m-0 text-sm">3 unread.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      moduleTabs={SALES_TABS}
      bottomBar={<Button intent="create" label="New invoice" />}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Invoices"
        {...(phone ? {} : { actions: <Button intent="create" label="New invoice" /> })}
        views={views}
        view={view}
        onViewChange={setView}
        saveView={<Button family="neutral" emphasis="menu" icon={BookmarkPlus} label="Save view" />}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search number or customer"
            actions={
              <>
                <ColumnChooser columns={columns} onChange={setColumns} />
                <Button intent="export" label="Export" />
              </>
            }
            phoneMenu={[{ label: 'Export', icon: FileSpreadsheet, onSelect: () => undefined }]}
          />
        }
      >
        <DataTable
          label="Invoices"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={shown}
          rows={INVOICE_LIST}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.number}
          filters={filters}
          onRowClick={setPreview}
          onRowOpen={() => undefined}
          count={1284}
          countIsExact
          hasPrevious={false}
          hasNext
          onPrevious={() => undefined}
          onNext={() => undefined}
          mobile={{
            subtitle: (row) => row.customer,
            badge: (row) => <StatusBadge label={row.status} tone={toneFor(row.status, TONES)} />,
            details: ['due', 'total'],
          }}
        />
      </ListPage>
      {preview !== null && (
        <QuickPreview
          open
          onOpenChange={(open) => {
            if (!open) setPreview(null)
          }}
          title={preview.number}
          description={preview.customer}
          items={[
            {
              label: 'Status',
              value: <StatusBadge label={preview.status} tone={toneFor(preview.status, TONES)} />,
            },
            { label: 'Issued', value: <DateText value={preview.issued} />, numeric: true },
            {
              label: 'Due',
              value: <DueDate value={preview.due} settled={preview.status === 'Paid'} />,
              numeric: true,
            },
            {
              label: 'Total',
              value: <MoneyText value={preview.total} currency="RSD" />,
              numeric: true,
            },
            { label: 'Payment reference', value: '97 2026-0411', numeric: true },
            { label: 'Delivered by', value: 'SEF, accepted 26.09.2026.' },
          ]}
          onOpenRecord={() => {
            setPreview(null)
          }}
        />
      )}
    </AppShell>
  )
}

const meta = {
  title: 'Templates/ListPage',
  component: ListPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a list of records. The title and the page’s main action ("New ' +
          'invoice") on the page; below them ONE card: the saved views (with counts and a "Save ' +
          'view" slot), the FilterBar with the list’s own actions (Columns, Export) and the ' +
          'table to the card’s edges, with paging under it.\n\n' +
          '**How:** the application keeps every state (view, filters, search, columns, sort) and ' +
          'passes it in; the DS only renders and reports. `ColumnChooser` shows, hides and ' +
          'reorders columns without dragging. `QuickPreview` opens from a row (click or Space, ' +
          'DataTable `onRowClick`); Enter opens the full page (`onRowOpen`).\n\n' +
          '**Catalogues** (customers, suppliers, items, services, fixed assets, accounts; P5.19, ' +
          'P5.23): every column is `sortable` (the application sorts — text by the language’s ' +
          'collation, amounts exactly), each choice filter is a `multiSelect` (several cities ' +
          'at once), the views are Active / Inactive / All, and the "Inactive" badge stands ' +
          'only where the list mixes both (All, a lookup with "Show inactive"). The ' +
          'BulkActionBar is a row of its own between the filters and the table, 12px from ' +
          'each. See Examples / Customers.\n\n' +
          '**When not:** a queue worked item by item (WorklistPage); a single record ' +
          '(DetailPage, P4.4).',
      },
    },
  },
  args: { title: 'Invoices', children: null },
  render: () => (
    <ExampleProvider>
      <InvoiceList />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ListPage>

export default meta

type Story = StoryObj<typeof meta>

/** The invoice list: views, filters, columns, export, paging. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: /^Overdue/ }))
    await expect(canvas.getByRole('button', { name: /^Overdue/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** The views that do not fit as tabs are under "More"; choosing one names it on the button. */
export const MoreViews: Story = {
  name: 'More views',
  play: async () => {
    await settle()
  },
}

export const MoreViewsInteraction: Story = {
  name: 'More views, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'More' }))
    const menu = await body.findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: /Cancelled/ }))
    await expect(canvas.getByRole('button', { name: /^Cancelled/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: /^Cancelled/ }))
    await body.findByRole('menu')
    await settle()
  },
}

/** Phones: one select "View: All 1.284" with the counts; above 7 views a search field. */
export const PhoneViews: Story = {
  name: 'Phone views',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <InvoiceList phone views={MANY_VIEWS} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
  },
}

export const PhoneViewsInteraction: Story = {
  name: 'Phone views, interaction',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <InvoiceList phone views={MANY_VIEWS} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: /View: All/ }))
    const search = await body.findByPlaceholderText('Find view')
    await userEvent.type(search, 'novi')
    await expect(body.getByRole('option', { name: /Customers in Novi Sad/ })).toBeVisible()
    await settle()
  },
}

/** A row pressed: the quick preview from the end, with "Open" to the full page. */
export const Preview: Story = {
  render: () => (
    <ExampleProvider>
      <InvoiceList previewOpen />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: 'F-2026-0411' })
    await expect(within(drawer).getByRole('button', { name: 'Open' })).toBeVisible()
  },
}

/** Space on a focused row opens the preview; the column chooser hides a column. */
export const Keyboard: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = canvas.getByRole('row', { name: /F-2026-0410/ })
    row.focus()
    await userEvent.keyboard(' ')
    await settle()
    const body = within(document.body)
    await expect(body.getByRole('dialog', { name: 'F-2026-0410' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await settle()
    await userEvent.click(canvas.getByRole('button', { name: 'Columns' }))
    await settle()
    await userEvent.click(body.getByRole('checkbox', { name: 'Issued' }))
    await expect(canvas.queryByRole('columnheader', { name: 'Issued' })).toBeNull()
    await userEvent.click(body.getByRole('button', { name: 'Move up: Total' }))
    await userEvent.keyboard('{Escape}')
  },
}

/** Phone width: cards, filters in the drawer, the main action in the bottom bar. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <InvoiceList phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** A list that no module tab names (a report's list, a settings list): the title shows. */
export const VisibleTitle: Story = {
  name: 'Visible title',
  render: () => (
    <ExampleProvider>
      <ListPage
        layout="desktop"
        title="Exchange rates"
        titleHidden={false}
        actions={<Button intent="refresh" label="Update rates" emphasis="secondary" />}
      >
        <DataTable
          label="Exchange rates"
          inCard
          columns={[
            { id: 'currency', header: 'Currency', cell: (row: Rate) => row.currency },
            {
              id: 'date',
              header: 'Date',
              numeric: true,
              cell: (row: Rate) => <DateText value={row.date} />,
            },
            {
              id: 'rate',
              header: 'Middle rate (RSD)',
              align: 'end',
              numeric: true,
              cell: (row: Rate) => row.rate,
            },
          ]}
          rows={RATES}
          getRowId={(row) => row.currency}
          getRowLabel={(row) => row.currency}
        />
      </ListPage>
    </ExampleProvider>
  ),
}

/** Arabic view names. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <ListPage
          layout="desktop"
          title="الفواتير"
          views={[
            { id: 'a', label: 'الكل', count: 1284 },
            { id: 'u', label: 'غير مدفوعة', count: 37 },
          ]}
          view="a"
        >
          <p className="m-0 p-4 text-sm">—</p>
        </ListPage>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese view names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <ListPage
          layout="desktop"
          title="請求書"
          views={[
            { id: 'a', label: 'すべて', count: 1284 },
            { id: 'u', label: '未払い', count: 37 },
          ]}
          view="a"
        >
          <p className="m-0 p-4 text-sm">—</p>
        </ListPage>
      </ExampleProvider>
    </StoryProvider>
  ),
}

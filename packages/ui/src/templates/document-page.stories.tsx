import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileText, Send } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../components/button'
import { DataTable, type DataTableColumn } from '../components/data-table'
import { DateText, MoneyText } from '../components/display-text'
import { EditableGrid, type EditableGridColumn } from '../components/editable-grid'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import type { TotalsRow } from '../components/document-totals'
import type { LifecycleStep } from '../components/lifecycle-bar'
import type { SidePanel } from '../components/side-panels'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { DocumentPage, type DocumentPageProps } from './document-page'
import { BRAND, COMMANDS, COMPANIES, SALES_TABS, USER } from './shell-story-data'

interface Line {
  id: string
  item: string
  quantity: string
  unit: string
  price: string
  vat: '20%' | '10%'
  amount: string
}

/** The lines of F-2026-0412 (amounts computed by the application, never here). */
const LINES: Line[] = [
  {
    id: '1',
    item: 'Cement CEM II 42,5 R, 25 kg',
    quantity: '120',
    unit: 'bag',
    price: '685.00',
    vat: '20%',
    amount: '82200.00',
  },
  {
    id: '2',
    item: 'Armature mesh Q188, 2,15 × 6 m',
    quantity: '18',
    unit: 'pc',
    price: '2940.00',
    vat: '20%',
    amount: '52920.00',
  },
  {
    id: '3',
    item: 'Transport Novi Sad – Kać',
    quantity: '1',
    unit: 'trip',
    price: '9800.00',
    vat: '20%',
    amount: '9800.00',
  },
  {
    id: '4',
    item: 'Technical drawings, printed set',
    quantity: '2',
    unit: 'set',
    price: '4250.00',
    vat: '10%',
    amount: '8500.00',
  },
]

const COLUMNS: DataTableColumn<Line>[] = [
  { id: 'item', header: 'Item', cell: (line) => line.item },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (line) => line.quantity,
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.price} currency="RSD" />,
  },
  { id: 'vat', header: 'VAT', align: 'end', numeric: true, cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

const TOTAL_ROWS: TotalsRow[] = [
  { key: 'base20', label: 'Tax base 20%', value: '144920.00', currency: 'RSD' },
  { key: 'vat20', label: 'VAT 20%', value: '28984.00', currency: 'RSD' },
  { key: 'base10', label: 'Tax base 10%', value: '8500.00', currency: 'RSD', group: true },
  { key: 'vat10', label: 'VAT 10%', value: '850.00', currency: 'RSD' },
  {
    key: 'advance',
    label: 'Advance deducted (A-2026-031)',
    value: '-50000.00',
    currency: 'RSD',
    group: true,
  },
]

const TOTAL: TotalsRow = { key: 'total', label: 'Amount due', value: '133254.00', currency: 'RSD' }

const STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'sef', label: 'Sent to SEF' },
  { key: 'paid', label: 'Paid' },
]

const REJECTED: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  {
    key: 'sef',
    label: 'Rejected by SEF',
    error: "The buyer's tax number is not registered in SEF.",
  },
  { key: 'paid', label: 'Paid' },
]

const PANELS: SidePanel[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    content: (
      <dl className="m-0 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-secondary">SEF</dt>
          <dd className="m-0">
            <StatusBadge label="Delivered" tone="info" />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-secondary">Sent</dt>
          <dd className="m-0 tabular-nums" dir="ltr">
            28.09.2026. 10:42
          </dd>
        </div>
      </dl>
    ),
  },
  {
    key: 'related',
    title: 'Related documents',
    count: 2,
    content: (
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
        <li>Order N-2026-0157</li>
        <li>Delivery note OTP-2026-0311</li>
      </ul>
    ),
  },
  {
    key: 'attachments',
    title: 'Attachments',
    count: 2,
    content: (
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
        <li>Otpremnica 0311.pdf</li>
        <li>Ugovor 2026-04.pdf</li>
      </ul>
    ),
  },
  {
    key: 'comments',
    title: 'Comments',
    count: 3,
    content: (
      <p className={cn('m-0 text-sm', TEXT_DIRECTION)}>
        Dragan Ilić: Customer asked for delivery on Friday.
      </p>
    ),
  },
  {
    key: 'history',
    title: 'History',
    content: <p className="m-0 text-sm">Issued by Milica Petrović, 28.09.2026.</p>,
  },
]

const BASE: DocumentPageProps = {
  title: 'F-2026-0412',
  back: { href: '#sales/invoices', label: 'Invoices' },
  status: <StatusBadge label="Sent" tone="info" />,
  lifecycle: { steps: STEPS, current: 2, label: 'Invoice status' },
  counterparty: {
    label: 'Customer',
    name: 'Panonija Agro d.o.o.',
    taxId: 'PIB 104987265',
    address: 'Novosadski put 14, 21241 Kać',
  },
  keyFigures: [
    { label: 'Amount due', value: <MoneyText value="133254.00" currency="RSD" /> },
    { label: 'Issued', value: <DateText value="2026-09-28" /> },
    { label: 'Due', value: <DateText value="2026-10-13" /> },
  ],
  actions: (
    <>
      <Button intent="pdf" label="PDF" emphasis="secondary" />
      <Button family="verify" icon={Send} label="Send reminder" />
    </>
  ),
  lines: (
    <DataTable
      label="Lines"
      inCard
      columns={COLUMNS}
      rows={LINES}
      getRowId={(line) => line.id}
      getRowLabel={(line) => line.item}
    />
  ),
  totals: { rows: TOTAL_ROWS, total: TOTAL, label: 'Totals' },
  sections: [
    {
      key: 'terms',
      title: 'Payment',
      content: (
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
          Payment to 160-0000012345678-21 with reference 97 2026-0412, within 15 days.
        </p>
      ),
    },
  ],
  panels: PANELS,
}

/** The invoice as the Core would drive it: the panel states live here. */
function Invoice({
  layout = 'desktop',
  ...props
}: Partial<DocumentPageProps> & { layout?: DocumentPageProps['layout'] }) {
  const [open, setOpen] = useState<string[]>(['delivery', 'related', 'attachments'])
  const [hidden, setHidden] = useState(false)
  return (
    <AppShell
      layout={layout === 'phone' ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Invoices', href: '#sales/invoices' }, { label: 'F-2026-0412' }]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 1, panel: <p className="m-0 text-sm">1 unread.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      moduleTabs={SALES_TABS}
    >
      <DocumentPage
        {...BASE}
        panelsOpen={open}
        onPanelsOpenChange={setOpen}
        panelsHidden={hidden}
        onPanelsHiddenChange={setHidden}
        {...props}
        layout={layout}
      />
    </AppShell>
  )
}

interface DraftLine {
  id: string
  item: string
  quantity: string | null
  price: string | null
}

const DRAFT_COLUMNS: EditableGridColumn<DraftLine>[] = [
  { id: 'item', header: 'Item', type: 'text', value: (line) => line.item },
  {
    id: 'quantity',
    header: 'Quantity',
    type: 'number',
    width: 120,
    value: (line) => line.quantity,
  },
  {
    id: 'price',
    header: 'Price',
    type: 'number',
    width: 160,
    decimals: 2,
    value: (line) => line.price,
  },
]

/** A draft: the lines in the editable grid. */
function DraftLines() {
  const [lines, setLines] = useState<DraftLine[]>([
    { id: 'a', item: 'Cement CEM II 42,5 R, 25 kg', quantity: '120', price: '685.00' },
    { id: 'b', item: 'Armature mesh Q188, 2,15 × 6 m', quantity: '18', price: '2940.00' },
  ])
  return (
    <EditableGrid<DraftLine>
      label="Lines"
      columns={DRAFT_COLUMNS}
      rows={lines}
      getRowId={(line) => line.id}
      onCellChange={(rowId, columnId, value) => {
        setLines((current) =>
          current.map((line) => (line.id === rowId ? { ...line, [columnId]: value } : line)),
        )
      }}
      onAddRow={(index) => {
        setLines((current) => [
          ...current.slice(0, index),
          { id: String(Date.now()), item: '', quantity: null, price: null },
          ...current.slice(index),
        ])
      }}
      onRemoveRow={(rowId) => {
        setLines((current) => current.filter((line) => line.id !== rowId))
      }}
    />
  )
}

const meta = {
  title: 'Templates/DocumentPage',
  component: DocumentPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** one business document — an invoice, an order, a journal entry. The ' +
          'lifecycle bar above the header (where the document stands; an error step with its ' +
          'reason), the header with the number, status and actions, the counterparty only (the ' +
          'user’s own company is in the shell), the key figures, the lines (an EditableGrid or ' +
          'a read-only DataTable) with the totals under them, further sections, and the side ' +
          'panels (delivery, related documents, attachments, comments, history, presence), each ' +
          'collapsible, the whole column hidden with "Hide panels".\n\n' +
          '**How:** everything through props; the totals and their rows are computed by the ' +
          'application (never here); `panelsOpen` / `onPanelsOpenChange` and `panelsHidden` / ' +
          '`onPanelsHiddenChange` let the Core remember the panels.\n\n' +
          '**When not:** a record without lines (DetailPage); a list (ListPage).',
      },
    },
  },
  args: BASE,
  render: () => (
    <ExampleProvider>
      <Invoice />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentPage>

export default meta

type Story = StoryObj<typeof meta>

/** An issued invoice sent to SEF: lines, totals with two VAT rates and an advance, panels. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const bar = within(canvas.getByRole('list', { name: 'Invoice status' }))
    await expect(bar.getByText('Sent to SEF').closest('li')).toHaveAttribute('aria-current', 'step')
    await userEvent.click(canvas.getByRole('button', { name: /^Comments/ }))
    await expect(canvas.getByRole('button', { name: /^Comments/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    // The click scrolled the panel into view; the picture shows the page from its top.
    window.scrollTo(0, 0)
  },
}

/** "Hide panels": the document takes the full width. */
export const PanelsHidden: Story = {
  name: 'Panels hidden',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Hide panels' }))
    await expect(canvas.queryByRole('complementary', { name: 'Panels' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Show panels' })).toBeVisible()
  },
}

/** Rejected by SEF: the error step in danger, its reason on hover and focus. */
export const Rejected: Story = {
  render: () => (
    <ExampleProvider>
      <Invoice
        lifecycle={{ steps: REJECTED, current: 2, label: 'Invoice status' }}
        status={<StatusBadge label="Rejected" tone="danger" />}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const step = within(canvasElement).getByRole('button', { name: /Rejected by SEF/ })
    // The reason is part of the name (the hidden text may be read with a space before the colon).
    await expect(step).toHaveAccessibleName(
      /^Rejected by SEF\s?: The buyer's tax number is not registered in SEF\.$/,
    )
  },
}

/** A draft: the lines in the editable grid, no totals yet. */
export const Draft: Story = {
  render: () => (
    <ExampleProvider>
      <Invoice
        title="Draft 2026-118"
        status={<StatusBadge label="Draft" tone="neutral" />}
        lifecycle={{ steps: STEPS, current: 0, label: 'Invoice status' }}
        keyFigures={[]}
        lines={<DraftLines />}
        actions={
          <>
            <Button intent="preview" label="Preview" />
            <Button family="primary" icon={FileText} label="Issue invoice" emphasis="primary" />
          </>
        }
      />
    </ExampleProvider>
  ),
}

/** Below 75em: the panels under the document, no whole-column button. */
export const Narrow: Story = {
  render: () => (
    <ExampleProvider>
      <Invoice layout="narrow" />
    </ExampleProvider>
  ),
}

/** Phone width: the lifecycle as one line, figures in two columns, panels under the document. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Invoice
          layout="phone"
          lines={
            <DataTable
              label="Lines"
              layout="cards"
              inCard
              columns={COLUMNS}
              rows={LINES}
              getRowId={(line) => line.id}
              getRowLabel={(line) => line.item}
              mobile={{ details: ['quantity', 'price', 'amount'] }}
              className="pt-4"
            />
          }
          actions={<Button intent="pdf" label="PDF" emphasis="secondary" />}
        />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic lines and counterparty in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentPage
          {...BASE}
          layout="desktop"
          counterparty={{ label: 'العميل', name: 'شركة النور للتجارة', taxId: 'PIB 104987265' }}
          lifecycle={{
            steps: [
              { key: 'a', label: 'مسودة' },
              { key: 'b', label: 'صادرة' },
              { key: 'c', label: 'مدفوعة' },
            ],
            current: 1,
            label: 'حالة الفاتورة',
          }}
          panelsOpen={['delivery']}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese counterparty. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DocumentPage
          {...BASE}
          layout="desktop"
          counterparty={{ label: '得意先', name: '株式会社さくら商事', taxId: 'PIB 104987265' }}
          panelsOpen={['delivery']}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

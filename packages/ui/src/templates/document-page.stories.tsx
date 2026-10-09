import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ban, FileCheck, Send } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { KeyValueList } from '../components/cards'
import { ChangeableValue } from '../components/changeable-value'
import { IrreversibleConfirmDialog } from '../components/confirm-dialog'
import { DataTable, type DataTableColumn } from '../components/data-table'
import { DateField } from '../components/date-field'
import { DateText, MoneyText, NumberText } from '../components/display-text'
import {
  CancellationBanner,
  DocumentNotes,
  DocumentReferences,
} from '../components/document-blocks'
import type { DocumentNotesValue } from '../components/document-logic'
import {
  FINAL_DEDUCTIONS,
  FINAL_DUE,
  FINAL_LINES,
  FINAL_RECAP,
  FINAL_ROWS,
  NOTE_TEMPLATES,
  REFERENCES,
  type FinalLine,
} from '../components/document-story-data'
import { EditableGrid, type EditableGridColumn } from '../components/editable-grid'
import { ActivityList, RelatedDocuments } from '../components/panel-lists'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TextField } from '../components/text-field'
import type { TotalsRow } from '../components/document-totals'
import type { LifecycleStep } from '../components/lifecycle-bar'
import type { SidePanel } from '../components/side-panels'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { DocumentPage, type DocumentPageProps } from './document-page'
import { BRAND, COMMANDS, COMPANIES, SALES_TABS, USER } from './shell-story-data'
import { fromUnits, toUnits } from '../components/amounts-story-data'

interface Line {
  id: string
  item: string
  quantity: string
  unit: string
  price: string
  /** The tax category and rate, as the e-invoice system names them ("S 20%"). */
  vat: 'S 20%' | 'S 10%'
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
    vat: 'S 20%',
    amount: '82200.00',
  },
  {
    id: '2',
    item: 'Armature mesh Q188, 2,15 × 6 m',
    quantity: '18',
    unit: 'pc',
    price: '2940.00',
    vat: 'S 20%',
    amount: '52920.00',
  },
  {
    id: '3',
    item: 'Transport Novi Sad – Kać',
    quantity: '1',
    unit: 'trip',
    price: '9800.00',
    vat: 'S 20%',
    amount: '9800.00',
  },
  {
    id: '4',
    item: 'Technical drawings, printed set',
    quantity: '2',
    unit: 'set',
    price: '4250.00',
    vat: 'S 10%',
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
  { id: 'vat', header: 'VAT', cell: (line) => line.vat },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

/** As the application sends them: bases and VAT of the lines above, the total, the advance. */
const TOTAL_ROWS: TotalsRow[] = [
  { key: 'base20', label: 'Tax base S 20%', value: '144920.00', currency: 'RSD' },
  { key: 'vat20', label: 'VAT S 20%', value: '28984.00', currency: 'RSD' },
  { key: 'base10', label: 'Tax base S 10%', value: '8500.00', currency: 'RSD', group: true },
  { key: 'vat10', label: 'VAT S 10%', value: '850.00', currency: 'RSD' },
  { key: 'total', label: 'Invoice total', value: '183254.00', currency: 'RSD', group: true },
  { key: 'advance', label: 'Advance A-2026-031', value: '-50000.00', currency: 'RSD' },
]

const TOTAL: TotalsRow = { key: 'due', label: 'Amount due', value: '133254.00', currency: 'RSD' }

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

/** A time as the application writes it (`format.dateTime` in the tenant's zone). */
function Time({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>
}

const PANELS: SidePanel[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    content: (
      <KeyValueList
        columns={1}
        items={[
          { label: 'SEF', value: <StatusBadge label="Delivered" tone="success" /> },
          { label: 'Sent', value: <Time>28.09.2026. 10:42</Time>, numeric: true },
        ]}
      />
    ),
  },
  {
    key: 'related',
    title: 'Related documents',
    count: 3,
    content: (
      <RelatedDocuments
        label="Related documents"
        items={[
          {
            key: 'order',
            type: 'Order',
            number: 'N-2026-0157',
            href: '#sales/orders/N-2026-0157',
            status: <StatusBadge label="Completed" tone="neutral" />,
          },
          {
            key: 'delivery',
            type: 'Delivery note',
            number: 'OTP-2026-0311',
            href: '#sales/deliveries/OTP-2026-0311',
            status: <StatusBadge label="Delivered" tone="success" />,
          },
          {
            key: 'advance',
            type: 'Advance invoice',
            number: 'A-2026-031',
            href: '#sales/invoices/A-2026-031',
            status: <StatusBadge label="Paid" tone="success" />,
          },
        ]}
      />
    ),
  },
  {
    key: 'attachments',
    title: 'Attachments',
    count: 2,
    content: (
      <RelatedDocuments
        label="Attachments"
        items={[
          { key: 'a', type: 'PDF, 184 KB', number: 'Otpremnica 0311.pdf', href: '#files/0311' },
          { key: 'b', type: 'PDF, 92 KB', number: 'Ugovor 2026-04.pdf', href: '#files/2026-04' },
        ]}
      />
    ),
  },
  {
    key: 'comments',
    title: 'Comments',
    count: 3,
    content: (
      <ActivityList
        label="Comments"
        items={[
          {
            key: 'c3',
            author: 'Dragan Ilić',
            time: <Time>02.10.2026. 09:15</Time>,
            text: 'Customer asked for delivery on Friday.',
          },
          {
            key: 'c2',
            author: 'Milica Petrović',
            time: <Time>29.09.2026. 13:40</Time>,
            text: 'Advance A-2026-031 deducted, as agreed with Panonija.',
          },
          {
            key: 'c1',
            author: 'Jelena Marković',
            time: <Time>28.09.2026. 10:05</Time>,
            text: 'Prices checked against the September price list.',
          },
        ]}
      />
    ),
  },
  {
    key: 'history',
    title: 'History',
    content: (
      <ActivityList
        label="History"
        items={[
          {
            key: 'h3',
            author: 'Milica Petrović',
            time: <Time>28.09.2026. 10:42</Time>,
            text: 'Sent to SEF',
          },
          {
            key: 'h2',
            author: 'Milica Petrović',
            time: <Time>28.09.2026. 10:40</Time>,
            text: 'Issued',
          },
          {
            key: 'h1',
            author: 'Milica Petrović',
            time: <Time>26.09.2026. 14:05</Time>,
            text: 'Created the draft',
          },
        ]}
      />
    ),
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
    { label: 'Invoice total', value: <MoneyText value="183254.00" currency="RSD" /> },
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
  bottomBar,
  ...props
}: Partial<DocumentPageProps> & { layout?: DocumentPageProps['layout']; bottomBar?: ReactNode }) {
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
      {...(bottomBar === undefined ? {} : { bottomBar })}
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

// ── The draft ──────────────────────────────────────────────────────────────────────────────

interface DraftLine {
  id: string
  item: string
  quantity: string | null
  unit: string
  price: string | null
  vat: string
}

/** Units of measure from the Core: the display name, with the standard code as the option's value. */
const UNITS = [
  { value: 'H87', label: 'pc' },
  { value: 'XBG', label: 'bag' },
  { value: 'SET', label: 'set' },
  { value: 'E54', label: 'trip' },
]

/** Tax categories from the Core: code and rate, as the e-invoice system requires. */
const TAX_CATEGORIES = [
  { value: 'S20', label: 'S 20%', rate: '20' },
  { value: 'S10', label: 'S 10%', rate: '10' },
]

// The application's arithmetic, played by the story on decimal strings (components never add).
/** Rounds `places + extra` decimals to `places`, half up (amounts here are never negative). */
function roundUnits(units: bigint, extra: number): bigint {
  const factor = 10n ** BigInt(extra)
  return (units + factor / 2n) / factor
}

/** The line's amount: quantity × price, to the para. */
function amountOf(line: DraftLine): string | null {
  if (line.quantity === null || line.price === null) return null
  return fromUnits(roundUnits(toUnits(line.quantity, 3) * toUnits(line.price, 2), 3), 2)
}

/** Bases and VAT per tax category, the total: what the Core would send for the draft. */
function draftTotals(lines: readonly DraftLine[]): { rows: TotalsRow[]; total: TotalsRow } {
  const rows: TotalsRow[] = []
  let total = 0n
  for (const category of TAX_CATEGORIES) {
    const base = lines
      .filter((line) => line.vat === category.value)
      .reduce((sum, line) => sum + toUnits(amountOf(line) ?? '0', 2), 0n)
    if (base === 0n) continue
    const vat = roundUnits(base * toUnits(category.rate, 0), 2)
    total += base + vat
    rows.push(
      {
        key: `base-${category.value}`,
        label: `Tax base ${category.label}`,
        value: fromUnits(base, 2),
        currency: 'RSD',
        ...(rows.length > 0 ? { group: true } : {}),
      },
      {
        key: `vat-${category.value}`,
        label: `VAT ${category.label}`,
        value: fromUnits(vat, 2),
        currency: 'RSD',
      },
    )
  }
  return {
    rows,
    total: { key: 'total', label: 'Invoice total', value: fromUnits(total, 2), currency: 'RSD' },
  }
}

const DRAFT_COLUMNS: EditableGridColumn<DraftLine>[] = [
  { id: 'item', header: 'Item', type: 'text', value: (line) => line.item },
  {
    id: 'quantity',
    header: 'Quantity',
    type: 'number',
    width: 100,
    value: (line) => line.quantity,
  },
  {
    id: 'unit',
    header: 'Unit',
    type: 'select',
    width: 90,
    value: (line) => line.unit,
    options: UNITS,
  },
  {
    id: 'price',
    header: 'Price',
    type: 'number',
    width: 140,
    decimals: 2,
    value: (line) => line.price,
  },
  {
    id: 'vat',
    header: 'VAT',
    type: 'select',
    width: 100,
    value: (line) => line.vat,
    options: TAX_CATEGORIES,
  },
  {
    id: 'amount',
    header: 'Amount',
    type: 'display',
    width: 150,
    align: 'end',
    numeric: true,
    display: (line) => <MoneyText value={amountOf(line)} currency="RSD" />,
  },
]

const DRAFT_LINES: DraftLine[] = [
  {
    id: 'a',
    item: 'Cement CEM II 42,5 R, 25 kg',
    quantity: '120',
    unit: 'XBG',
    price: '685.00',
    vat: 'S20',
  },
  {
    id: 'b',
    item: 'Armature mesh Q188, 2,15 × 6 m',
    quantity: '18',
    unit: 'H87',
    price: '2940.00',
    vat: 'S20',
  },
  {
    id: 'c',
    item: 'Technical drawings, printed set',
    quantity: '2',
    unit: 'SET',
    price: '4250.00',
    vat: 'S10',
  },
]

/**
 * A draft as the Core would show it: no side panels (no attachments yet), Preview and Issue
 * invoice, the values the system filled in as values that can be changed, the lines in the
 * editable grid with unit, tax category and amount, totals that follow the lines.
 */
function DraftInvoice({ layout = 'desktop' }: { layout?: 'desktop' | 'phone' }) {
  const [lines, setLines] = useState<DraftLine[]>(DRAFT_LINES)
  const [number, setNumber] = useState('F-2026-0413')
  const [issued, setIssued] = useState<string | null>('2026-10-06')
  const [due, setDue] = useState<string | null>('2026-10-21')
  const totals = draftTotals(lines)
  const issue = (
    <Button family="primary" icon={FileCheck} label="Issue invoice" emphasis="primary" />
  )
  return (
    <Invoice
      layout={layout}
      title="New invoice"
      status={<StatusBadge label="Draft" tone="neutral" />}
      lifecycle={{ steps: STEPS, current: 0, label: 'Invoice status' }}
      keyFigures={[]}
      details={
        <>
          <ChangeableValue
            label="Number"
            value={<span dir="ltr">{number}</span>}
            field={<TextField label="Number" direction="ltr" value={number} onChange={setNumber} />}
          />
          <ChangeableValue
            label="Issue date"
            value={<DateText value={issued} />}
            field={<DateField label="Issue date" value={issued} onChange={setIssued} />}
          />
          <ChangeableValue
            label="Due date"
            value={<DateText value={due} />}
            field={<DateField label="Due date" value={due} onChange={setDue} />}
          />
        </>
      }
      lines={
        <EditableGrid<DraftLine>
          label="Lines"
          inCard
          layout={layout}
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
              {
                id: String(Date.now()),
                item: '',
                quantity: null,
                unit: 'H87',
                price: null,
                vat: 'S20',
              },
              ...current.slice(index),
            ])
          }}
          onRemoveRow={(rowId) => {
            setLines((current) => current.filter((line) => line.id !== rowId))
          }}
        />
      }
      totals={{ rows: totals.rows, total: totals.total, label: 'Totals' }}
      sections={[]}
      panels={[]}
      actions={
        <>
          <Button intent="preview" label="Preview" />
          {layout === 'phone' ? null : issue}
        </>
      }
      {...(layout === 'phone' ? { bottomBar: issue } : {})}
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
          '**The header is slots; the Core decides what it shows.** `counterparty` (the customer ' +
          'or supplier block), `keyFigures` (any two to four values: amount due, invoice total, ' +
          'due date …, or none), `details` (on a draft, the values the system filled in — ' +
          'number, issue date, due date — as `ChangeableValue`s: a value with a pencil that ' +
          'turns it into its field). Leave a slot out and it takes no room.\n\n' +
          '**Side panels** follow one spacing rule (header, 12px, the body padded 16px) and use ' +
          'the panel lists: `KeyValueList` (one column) for facts, `RelatedDocuments` (every ' +
          'item a link with its type, number and status), `ActivityList` for comments and ' +
          'history (author and time on one line, the text under it, the latest two and "Show ' +
          'all").\n\n' +
          '**A draft is as simple as possible:** no side panels (attachments only when there ' +
          'are some), two actions — Preview and Issue invoice —, the filled-in values as ' +
          '`details`, and the lines with unit, tax category ("S 20%") and amount; the totals ' +
          'follow the lines (the Core computes them).\n\n' +
          '**How:** everything through props; the totals and their rows are computed by the ' +
          'application (never here); `panelsOpen` / `onPanelsOpenChange` and `panelsHidden` / ' +
          '`onPanelsHiddenChange` let the Core remember the panels. On phones the lines are a ' +
          'flat list in the card (never cards in a card), the key figures two columns, and the ' +
          'main action in the shell’s bottom bar.\n\n' +
          '**Complex documents (P5.18): a fixed block order** — `banner` (a cancelled ' +
          'document’s CancellationBanner) above everything; the header with the `currency` ' +
          'block (DocumentCurrency) in it; the "Based on" `references` (DocumentReferences); the ' +
          'lines (DataTable with `lineType`: headings, subtotals, text lines, discounts) with a ' +
          'long `specification`’s summary row (DocumentSpecification) under them; the totals ' +
          '(recap by tax category, deductions, home-currency equivalents, footnotes); the ' +
          '`notes` (DocumentNotes); the `attachments`; then the other sections. A block without ' +
          'content is not rendered; phones keep the order. **Cancellation:** an ' +
          'IrreversibleConfirmDialog with `reason` (one dialog asks why and for the number), ' +
          'then the status "Cancelled" and the banner with who, when, why and the link to the ' +
          'cancellation document, which links back ("Cancels"). **Corrective documents** are ' +
          'DocumentPages too: "Corrects:" references and Original / Change / New lines ' +
          '(`correctionColumns`).\n\n' +
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
    // Related documents are links.
    await expect(canvas.getByRole('link', { name: /N-2026-0157/ })).toHaveAttribute(
      'href',
      '#sales/orders/N-2026-0157',
    )
    await userEvent.click(canvas.getByRole('button', { name: /^Comments/ }))
    await expect(canvas.getByRole('button', { name: /^Comments/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    // The latest two comments, then all three.
    const comments = canvas.getByRole('list', { name: 'Comments' })
    await expect(within(comments).getAllByRole('listitem')).toHaveLength(2)
    await userEvent.click(canvas.getByRole('button', { name: 'Show all 3' }))
    await expect(within(comments).getAllByRole('listitem')).toHaveLength(3)
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
        panels={PANELS.filter((panel) => panel.key !== 'delivery')}
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

/**
 * A new invoice (draft): no side panels, Preview and Issue invoice, the number and dates the
 * system filled in as values with a pencil, lines with unit, tax category and amount; the totals
 * follow the lines.
 */
export const Draft: Story = {
  render: () => (
    <ExampleProvider>
      <DraftInvoice />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('complementary', { name: 'Panels' })).toBeNull()
    // 135.120,00 at 20% and 8.500,00 at 10%: VAT 27.024,00 and 850,00, total 171.494,00.
    await expect(canvasElement).toHaveTextContent('27.024,00')
    await expect(canvasElement).toHaveTextContent('171.494,00')
    await userEvent.click(canvas.getByRole('button', { name: 'Change Due date' }))
    await expect(canvas.getByRole('textbox', { name: 'Due date' })).toHaveFocus()
  },
}

/** Below 75em: the panels under the document, no whole-column button. */
export const Narrow: Story = {
  render: () => (
    <ExampleProvider>
      <Invoice layout="narrow" />
    </ExampleProvider>
  ),
}

/**
 * Phone width: the lifecycle as one line, figures in a two-column grid, the lines as a flat list
 * in the card, panels under the document, the main action in the bottom bar.
 */
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
              mobile={{ details: ['quantity', 'unit', 'price', 'vat', 'amount'] }}
            />
          }
          actions={<Button intent="pdf" label="PDF" emphasis="secondary" />}
          bottomBar={<Button family="verify" icon={Send} label="Send reminder" />}
        />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The draft at phone width: the lines as a flat list, Issue invoice in the bottom bar. */
export const DraftPhone: Story = {
  name: 'Draft, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <DraftInvoice layout="phone" />
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

const FINAL_COLUMNS: DataTableColumn<FinalLine>[] = [
  { id: 'item', header: 'Item', cell: (line) => line.item },
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
    cell: (line) =>
      line.amount === undefined ? null : <MoneyText value={line.amount} currency="RSD" />,
  },
]

// ── P5 group D2: complex documents (P5.18) ────────────────────────────────────────────────────

/** A final invoice with every block of P5.18, in the fixed order. */
function ComplexInvoice({ layout = 'desktop' }: { layout?: 'desktop' | 'phone' }) {
  const [notesMode, setNotesMode] = useState<'view' | 'edit'>('view')
  const [notes, setNotes] = useState<DocumentNotesValue>({
    templates: ['payment', 'advances'],
    note: 'Please quote the contract number 12/2026 with the payment.',
  })
  return (
    <Invoice
      layout={layout}
      title="F-2026-0418"
      status={<StatusBadge label="Sent" tone="info" />}
      counterparty={{
        label: 'Customer',
        name: 'Vojvođanka Mlin a.d.',
        taxId: 'PIB 100421987',
        address: 'Industrijska 4, 23000 Zrenjanin',
      }}
      keyFigures={[
        { label: 'Amount due', value: <MoneyText value={FINAL_DUE.value} currency="RSD" /> },
        { label: 'Invoice total', value: <MoneyText value="8003678.22" currency="RSD" /> },
        { label: 'Due', value: <DateText value="2026-10-21" /> },
      ]}
      references={<DocumentReferences groups={REFERENCES} />}
      lines={
        <DataTable
          label="Lines"
          inCard
          layout={layout === 'phone' ? 'cards' : 'table'}
          columns={FINAL_COLUMNS}
          rows={FINAL_LINES}
          getRowId={(line) => line.id}
          getRowLabel={(line) => line.item}
          lineType={(line) => line.type}
          lineKind={(line) => line.kind}
          mobile={{ details: ['quantity', 'unit', 'vat', 'amount'] }}
        />
      }
      totals={{
        label: 'Totals',
        rows: FINAL_ROWS,
        recap: FINAL_RECAP,
        deductions: FINAL_DEDUCTIONS,
        total: FINAL_DUE,
      }}
      notes={{
        title: 'Notes',
        actions:
          notesMode === 'view' ? (
            <Button
              intent="edit"
              label="Edit notes"
              onClick={() => {
                setNotesMode('edit')
              }}
            />
          ) : (
            <Button
              intent="save"
              emphasis="secondary"
              label="Done"
              onClick={() => {
                setNotesMode('view')
              }}
            />
          ),
        content: (
          <DocumentNotes
            mode={notesMode}
            templates={NOTE_TEMPLATES}
            value={notes}
            onChange={setNotes}
          />
        ),
      }}
      attachments={{
        title: 'Attachments',
        content: (
          <RelatedDocuments
            label="Attachments"
            items={[
              { key: 'a', type: 'PDF, 412 KB', number: 'Ugovor 12-2026.pdf', href: '#files/12' },
              {
                key: 'b',
                type: 'PDF, 1,2 MB',
                number: 'Zapisnik o primopredaji.pdf',
                href: '#files/zp',
              },
            ]}
          />
        ),
      }}
      sections={[]}
      panels={PANELS.filter((panel) => panel.key === 'delivery' || panel.key === 'history')}
    />
  )
}

/**
 * A final invoice with every P5.18 block: "Based on" references, lines, totals with the recap by
 * tax category and two advances deducted (links), notes (template texts and a free note, edited
 * in place), attachments. The block order is fixed.
 */
export const ComplexDocument: Story = {
  name: 'Complex document',
  render: () => (
    <ExampleProvider>
      <ComplexInvoice />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('link', { name: 'Advance invoice A-2026-044, Paid' }),
    ).toBeVisible()
    await expect(canvas.getByRole('table', { name: 'Recap by tax category' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Edit notes' }))
    await expect(canvas.getByRole('textbox', { name: 'Note' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Done' }))
    // The blocks in their order: references, lines, totals, notes, attachments.
    const text = canvasElement.textContent
    const order = [
      'Based on:',
      'Steel beams HEA 200',
      'Recap by tax category',
      'Payment within 15 days',
      'Ugovor 12-2026.pdf',
    ]
    const positions = order.map((part) => text.indexOf(part))
    await expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    window.scrollTo(0, 0)
  },
}

/** The same at phone width: the same order, the lines a flat list, the recap full width. */
export const ComplexDocumentPhone: Story = {
  name: 'Complex document, phone',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <ComplexInvoice layout="phone" />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/**
 * Cancelling an issued invoice: "Cancel invoice" opens one dialog asking for the reason and the
 * typed number; then the status is "Cancelled", the banner at the top says who, when and why,
 * and links to the cancellation document.
 */
export const CancelDocument: Story = {
  name: 'Cancel a document',
  render: () => {
    function Cancellable() {
      const [reason, setReason] = useState<string | null>(null)
      return (
        <Invoice
          status={
            reason === null ? (
              <StatusBadge label="Overdue" tone="danger" />
            ) : (
              <StatusBadge label="Cancelled" tone="neutral" />
            )
          }
          {...(reason === null
            ? {}
            : {
                banner: (
                  <CancellationBanner
                    by="Milica Petrović"
                    at="2026-10-06T11:20:00+02:00"
                    reason={reason}
                    document={{
                      kind: 'Cancellation document',
                      number: 'ST-2026-0004',
                      href: '#sales/invoices/ST-2026-0004',
                    }}
                  />
                ),
              })}
          actions={
            <>
              <Button intent="pdf" label="PDF" emphasis="secondary" />
              {reason === null && (
                <IrreversibleConfirmDialog
                  trigger={<Button family="caution" icon={Ban} label="Cancel invoice" />}
                  family="caution"
                  actionIcon={Ban}
                  title="Cancel invoice F-2026-0412?"
                  message="A cancellation document is issued and sent to SEF. This cannot be undone."
                  confirmLabel="Cancel invoice"
                  cancelLabel="Keep invoice"
                  confirmText="F-2026-0412"
                  reason={{ label: 'Reason for the cancellation' }}
                  onConfirm={(answer) => {
                    setReason(answer.text)
                  }}
                />
              )}
            </>
          }
        />
      )
    }
    return (
      <ExampleProvider>
        <Cancellable />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel invoice' }))
    const dialog = within(await body.findByRole('alertdialog'))
    await userEvent.type(
      dialog.getByRole('textbox', { name: /Reason for the cancellation/ }),
      'Wrong prices: the September price list was not applied.',
    )
    await userEvent.type(dialog.getByRole('textbox', { name: /^Type F-2026-0412/ }), 'F-2026-0412')
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel invoice' }))
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    await expect(
      canvas.getByText(/Reason: Wrong prices: the September price list was not applied\./),
    ).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'Cancellation document ST-2026-0004' }),
    ).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Cancel invoice' })).toBeNull()
    await settle()
  },
}

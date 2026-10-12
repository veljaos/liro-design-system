import type { Meta, StoryObj } from '@storybook/react-vite'
import { Building2 } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { MoneyText, NumberText, DateText } from '../components/display-text'
import {
  FINAL_DEDUCTIONS,
  FINAL_DUE,
  FINAL_LINES,
  FINAL_RECAP,
  FINAL_ROWS,
  FOOTNOTES,
  NOTE_TEMPLATES,
  type FinalLine,
} from '../components/document-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import type { PrintColumn } from './print-parts'
import { BUYER, SELLER, longInvoice, type PrintLine } from './print-story-data'
import { PrintDocument, type PrintDocumentProps } from './print-templates'

/** The issuer's block at the top of the first page; the "logo" is an icon passed as an image. */
function Letterhead() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md border border-solid border-strong text-primary">
        <Building2 aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col">
        <span className={cn('text-md font-semibold text-primary', TEXT_DIRECTION)}>
          Kvadrat Gradnja d.o.o.
        </span>
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
          Construction and engineering · Temerinski put 51, Novi Sad · office@kvadrat-gradnja.rs
        </span>
      </div>
    </div>
  )
}

const HEADER = (
  <div className="flex justify-between gap-4">
    <span className={TEXT_ISOLATE}>Kvadrat Gradnja d.o.o.</span>
    <span className={TEXT_ISOLATE}>
      Invoice <span dir="ltr">F-2026-0418</span>
    </span>
  </div>
)

const FOOTER =
  'Kvadrat Gradnja d.o.o. · Temerinski put 51, 21000 Novi Sad · PIB 109876543 · MB 21345678 · Account 160-0000000456789-12 (Banca Intesa)'

const FINAL_COLUMNS: PrintColumn<FinalLine>[] = [
  { key: 'item', header: 'Item', cell: (line) => line.item },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'end',
    cell: (line) => (line.quantity === undefined ? null : <NumberText value={line.quantity} />),
  },
  { key: 'unit', header: 'Unit', cell: (line) => line.unit, width: '12mm' },
  { key: 'vat', header: 'VAT', cell: (line) => line.vat, width: '16mm' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (line) =>
      line.amount === undefined ? null : <MoneyText value={line.amount} currency="RSD" />,
  },
]

const LONG_COLUMNS: PrintColumn<PrintLine>[] = [
  { key: 'item', header: 'Item', cell: (line) => line.item },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'end',
    cell: (line) =>
      line.quantity === undefined ? null : <NumberText value={line.quantity} decimals={2} />,
  },
  { key: 'unit', header: 'Unit', cell: (line) => line.unit, width: '12mm' },
  {
    key: 'price',
    header: 'Price',
    align: 'end',
    cell: (line) =>
      line.price === undefined ? null : <NumberText value={line.price} decimals={2} />,
  },
  { key: 'vat', header: 'VAT', cell: (line) => line.vat, width: '16mm' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (line) =>
      line.amount === undefined ? null : <MoneyText value={line.amount} currency="RSD" />,
  },
]

const DETAILS = [
  { key: 'issued', label: 'Date of issue', value: <DateText value="2026-10-06" />, numeric: true },
  { key: 'supply', label: 'Date of supply', value: <DateText value="2026-09-25" />, numeric: true },
  { key: 'due', label: 'Due date', value: <DateText value="2026-10-21" />, numeric: true },
  { key: 'place', label: 'Place of issue', value: 'Novi Sad' },
  { key: 'contract', label: 'Contract', value: '12/2026' },
  { key: 'reference', label: 'Payment reference', value: '97 2026-0418', numeric: true },
]

const SIGNATURES = [
  { key: 'issued', label: 'Issued by', name: 'Milica Petrović', detail: 'Accounting' },
  { key: 'received', label: 'Received by' },
]

const INVOICE: PrintDocumentProps<FinalLine> = {
  title: 'Invoice',
  number: 'F-2026-0418',
  letterhead: <Letterhead />,
  header: HEADER,
  footer: FOOTER,
  parties: [SELLER, BUYER],
  details: DETAILS,
  lines: {
    caption: 'Lines',
    columns: FINAL_COLUMNS,
    rows: FINAL_LINES,
    rowKey: (line) => line.id,
    lineType: (line) => line.type,
    lineText: (line) => line.item,
  },
  totals: {
    label: 'Totals',
    rows: FINAL_ROWS,
    recap: FINAL_RECAP,
    deductions: FINAL_DEDUCTIONS.map((row) => ({
      key: row.key,
      label: row.label,
      value: row.value,
      currency: 'RSD',
    })),
    total: FINAL_DUE,
    footnotes: FOOTNOTES,
  },
  notesTitle: 'Notes',
  notes: NOTE_TEMPLATES.slice(0, 3).map((template) => template.text),
  issued: { place: 'Novi Sad', date: '2026-10-06' },
  signatures: SIGNATURES,
}

const meta = {
  title: 'Templates/Print/PrintDocument',
  component: PrintDocument,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a business document on paper — an invoice, a delivery note, an offer, ' +
          'a proforma: the letterhead (the issuer’s block, a logo as an image), the title and ' +
          'number, the parties side by side, the document’s details, the lines (a PrintTable: ' +
          'line types by typography, the header row repeating on every page, a row never split), ' +
          'the totals exactly as DocumentTotals shows them on screen (recap by tax category, ' +
          'deductions, footnotes; nothing computed), notes, place and date, signatures. A ' +
          'PrintPage: header and footer on every page, page numbers, paper always light; a ' +
          'draft or a cancelled document prints its marker.\n\n' +
          '**When:** the printout or the PDF of a document the application has issued or is ' +
          'about to issue.\n\n' +
          '**When not:** the document on screen (DocumentPage); a certificate, a report of ' +
          'results or a finding (their own templates); a list (print a ReportPage’s result).',
      },
    },
  },
  args: {
    title: 'Invoice',
    lines: { caption: 'Lines', columns: [], rows: [], rowKey: () => '' },
  },
  render: () => (
    <ExampleProvider>
      <PrintDocument {...INVOICE} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PrintDocument>

export default meta

type Story = StoryObj<typeof meta>

/** A final invoice with two advances deducted, the recap and footnotes. */
export const Default: Story = {
  name: 'Invoice',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const sheet = canvas.getByRole('article', { name: 'Invoice F-2026-0418' })
    await expect(sheet).toHaveAttribute('data-liro-theme', 'light')
    await expect(getComputedStyle(sheet).colorScheme).toBe('light')
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Invoice F-2026-0418')
    await expect(canvas.getByRole('table', { name: 'Lines' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Totals' })).toHaveTextContent('5.003.678,22')
    await expect(canvas.getByText('Novi Sad, 06.10.2026.')).toBeVisible()
    const style = canvasElement.querySelector('[data-slot="print-page"] style')
    await expect(style?.textContent).toContain('size: A4 portrait')
    await expect(style?.textContent).toContain(
      'content: "Page " counter(page) " of " counter(pages)',
    )
  },
}

const LONG = longInvoice(6, 14)

/** About a hundred lines: five pages on paper, the table's header on every one. */
export const Long: Story = {
  name: 'Long invoice, several pages',
  render: () => (
    <ExampleProvider>
      <PrintDocument
        {...INVOICE}
        number="F-2026-0431"
        header={
          <div className="flex justify-between gap-4">
            <span className={TEXT_ISOLATE}>Kvadrat Gradnja d.o.o.</span>
            <span className={TEXT_ISOLATE}>
              Invoice <span dir="ltr">F-2026-0431</span>
            </span>
          </div>
        }
        lines={{
          caption: 'Lines',
          columns: LONG_COLUMNS,
          rows: LONG.lines,
          rowKey: (line) => line.id,
          lineType: (line) => line.type,
          lineText: (line) => line.item,
        }}
        totals={{ label: 'Totals', rows: LONG.rows, recap: LONG.recap, total: LONG.total }}
        notes={[NOTE_TEMPLATES[0]?.text ?? '']}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const sheet = canvasElement.querySelector<HTMLElement>('[data-slot="print-sheet"]')
    if (sheet === null) throw new Error('no sheet')
    // Taller than three A4 pages (297mm each) on screen.
    await expect(sheet.offsetHeight).toBeGreaterThan(3 * 297 * (96 / 25.4))
    await expect(within(sheet).getAllByRole('row').length).toBeGreaterThan(90)
  },
}

/** A draft: "Draft" at the top and across every page. */
export const Draft: Story = {
  render: () => (
    <ExampleProvider>
      <PrintDocument
        {...INVOICE}
        status={{ kind: 'draft', note: 'Not valid as a tax document until it is issued.' }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const marker = canvasElement.querySelector('[data-slot="print-status"]')
    await expect(marker).toHaveTextContent('Draft')
    await expect(canvasElement.querySelector('[data-slot="print-watermark"]')).toHaveAttribute(
      'data-text',
      'Draft',
    )
  },
}

/** A cancelled document: who, when, why and the cancellation document; "Cancelled" across it. */
export const Cancelled: Story = {
  render: () => (
    <ExampleProvider>
      <PrintDocument
        {...INVOICE}
        number="F-2026-0407"
        status={{
          kind: 'cancelled',
          by: 'Milica Petrović',
          at: '2026-10-06T11:20:00+02:00',
          reason: 'Wrong buyer: issued to Vojvođanka Mlin a.d. instead of Mlinpek d.o.o.',
          document: { kind: 'Cancellation document', number: 'ST-2026-0004' },
        }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const marker = canvasElement.querySelector('[data-slot="print-status"]')
    await expect(marker).toHaveTextContent('by Milica Petrović on 06.10.2026. at 11:20.')
    await expect(marker).toHaveTextContent('ST-2026-0004')
  },
}

/** On a phone the sheet is scaled down to the width; the page never scrolls sideways. */
export const Phone: Story = {
  name: 'Phone',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintDocument {...INVOICE} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
    const sheet = page.querySelector<HTMLElement>('[data-slot="print-sheet"]')
    await expect(Number(sheet?.style.getPropertyValue('--liro-print-zoom'))).toBeLessThan(1)
  },
}

const ARABIC_LINES: FinalLine[] = [
  { id: 'h', type: 'heading', item: 'أعمال الهيكل' },
  {
    id: '1',
    type: 'line',
    item: 'عوارض فولاذية',
    quantity: '12.6',
    unit: 'طن',
    vat: 'S 20%',
    amount: '1799280.00',
  },
  {
    id: '2',
    type: 'line',
    item: 'أعمدة فولاذية',
    quantity: '8.4',
    unit: 'طن',
    vat: 'S 20%',
    amount: '1230600.00',
  },
  { id: 's', type: 'subtotal', item: 'مجموع الهيكل', amount: '3029880.00' },
]

/** Arabic, right to left: the parties, the lines and the totals mirror. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PrintDocument
        title="فاتورة"
        number="F-2026-0418"
        header="شركة كفادرات للبناء"
        footer="شركة كفادرات للبناء · نوفي ساد"
        parties={[
          { key: 's', label: 'البائع', name: 'شركة كفادرات للبناء', lines: ['نوفي ساد، صربيا'] },
          { key: 'b', label: 'المشتري', name: 'شركة المطاحن', lines: ['باتشكا بالانكا، صربيا'] },
        ]}
        details={[{ key: 'd', label: 'تاريخ الإصدار', value: <DateText value="2026-10-06" /> }]}
        lines={{
          caption: 'البنود',
          columns: [
            { key: 'item', header: 'البند', cell: (line) => line.item },
            {
              key: 'quantity',
              header: 'الكمية',
              align: 'end',
              cell: (line) =>
                line.quantity === undefined ? null : <NumberText value={line.quantity} />,
            },
            { key: 'unit', header: 'الوحدة', cell: (line) => line.unit },
            {
              key: 'amount',
              header: 'المبلغ',
              align: 'end',
              cell: (line) =>
                line.amount === undefined ? null : <MoneyText value={line.amount} currency="RSD" />,
            },
          ],
          rows: ARABIC_LINES,
          rowKey: (line) => line.id,
          lineType: (line) => line.type,
          lineText: (line) => line.item,
        }}
        totals={{
          label: 'المجاميع',
          rows: [{ key: 'net', label: 'المجموع دون ضريبة', value: '3029880.00', currency: 'RSD' }],
          total: { key: 'due', label: 'المبلغ المستحق', value: '3635856.00', currency: 'RSD' },
        }}
        issued={{ place: 'نوفي ساد', date: '2026-10-06' }}
        signatures={[{ key: 'i', label: 'أصدرها', name: 'ميليتسا بتروفيتش' }]}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PrintDocument
        title="請求書"
        number="F-2026-0418"
        header="クヴァドラト建設株式会社"
        footer="クヴァドラト建設株式会社 · ノヴィ・サド"
        parties={[
          { key: 's', label: '売主', name: 'クヴァドラト建設株式会社', lines: ['ノヴィ・サド'] },
          {
            key: 'b',
            label: '買主',
            name: 'ヴォイヴォディナ製粉株式会社',
            lines: ['バチュカ・パランカ'],
          },
        ]}
        lines={{
          caption: '明細',
          columns: [
            { key: 'item', header: '品目', cell: (line) => line.item },
            {
              key: 'amount',
              header: '金額',
              align: 'end',
              cell: (line) =>
                line.amount === undefined ? null : <MoneyText value={line.amount} currency="JPY" />,
            },
          ],
          rows: [
            { id: '1', type: 'line', item: '鉄骨梁 HEA 200', amount: '1799280' },
            { id: '2', type: 'line', item: '鉄骨柱 HEB 240', amount: '1230600' },
          ],
          rowKey: (line: FinalLine) => line.id,
        }}
        totals={{
          label: '合計',
          rows: [],
          total: { key: 'due', label: '請求金額', value: '3029880', currency: 'JPY', decimals: 0 },
        }}
        issued={{ date: '2026-10-06' }}
        signatures={[{ key: 'i', label: '発行者', name: '佐藤 花子' }]}
      />
    </StoryProvider>
  ),
}

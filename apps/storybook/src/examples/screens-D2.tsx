import { Send } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  AttachmentList,
  notice,
  ActivityList,
  Button,
  CancellationBanner,
  CheckboxField,
  correctionColumns,
  DataTable,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DocumentCurrency,
  DocumentNotes,
  DocumentPage,
  DocumentReferences,
  DocumentSource,
  DocumentSpecification,
  DocumentTotals,
  KeyValueList,
  MIN_COLUMN_WIDTH,
  MoneyText,
  NumberText,
  RelatedDocuments,
  ChangeText,
  type DataTableColumn,
  type DocumentNotesValue,
  type DocumentReferenceGroup,
  type LifecycleStep,
  type NoteTemplate,
  type SidePanel,
  type TaxRecap,
  type TotalsRow,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { SALES_TABS, Shell, statusBadge, toneOf } from './example-shell'
import {
  ADVANCES,
  BOJOVIC,
  CANCELLATION,
  CANCELLATION_LINES,
  CANCELLATION_TOTALS,
  CANCELLED_LINES,
  CANCELLED_TOTALS,
  DECREASE,
  DECREASE_LINES,
  DONAU_BAU,
  EUR_IN_RSD,
  EUR_LINES,
  EUR_RATE,
  EUR_RECAP,
  EUR_TOTALS,
  FINAL_ATTACHMENTS,
  FINAL_DUE,
  FINAL_LINES,
  FINAL_RECAP,
  FINAL_TOTALS,
  MEDIC_LAB,
  MEDIC_TOTALS,
  SITUATION_LINES,
  SITUATION_RECAP,
  SITUATION_TOTALS,
  SPEC_ROWS,
  SPEC_TOTALS,
  SPECIFICATION,
  TAX,
  VOJVODJANKA,
  type CorrectedLine,
  type DocLine,
  type RecapRow,
  type SpecRow,
} from './data-D2'

/*
 * The complex documents of P5.18 (group D2), linked into the example application: final invoice
 * F-2026-0418 (two advances deducted, references, notes, attachments, the recap by tax category),
 * interim situation IS-2026-007 with its specification of 300 positions, invoice F-2026-0415 in
 * EUR with four tax categories, decrease document KO-2026-0009 against F-2026-0410, and the
 * cancelled invoice F-2026-0407 with its cancellation document ST-2026-0004. Only the public
 * entry point; every amount comes from data-D2.ts, computed there in whole paras.
 */

export const D2_ROUTES = {
  final: '/sales/invoices/F-2026-0418',
  situation: '/projects/IS-2026-007',
  eur: '/sales/invoices/F-2026-0415',
  decrease: '/sales/corrections/KO-2026-0009',
  cancelled: '/sales/invoices/F-2026-0407',
  cancellation: `/sales/invoices/${CANCELLATION.number}`,
}

// ── Shared pieces ───────────────────────────────────────────────────────────────────────────

const STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'sef', label: 'Sent to SEF' },
  { key: 'paid', label: 'Paid' },
]

/** The tax category as the lines show it: the code with the rate, the footnote marker after it. */
function taxLabel(code: DocLine['tax']): ReactNode {
  if (code === undefined) return null
  const category = TAX[code]
  return (
    <>
      {category.label}
      {category.marker !== undefined && <sup>{category.marker}</sup>}
    </>
  )
}

/** The read-only lines of a document, in its currency, with their types. */
function linesTable(lines: readonly DocLine[], currency: string, phone: boolean, label = 'Lines') {
  const money = (value: string | undefined) =>
    value === undefined ? null : <MoneyText value={value} currency={currency} />
  const columns: DataTableColumn<DocLine>[] = [
    { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.text },
    {
      id: 'quantity',
      header: 'Quantity',
      align: 'end',
      numeric: true,
      cell: (line) => (line.quantity === undefined ? null : <NumberText value={line.quantity} />),
    },
    { id: 'unit', header: 'Unit', cell: (line) => line.unit },
    {
      id: 'price',
      header: 'Price',
      align: 'end',
      numeric: true,
      cell: (line) => money(line.price),
    },
    { id: 'vat', header: 'VAT', cell: (line) => taxLabel(line.tax) },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      numeric: true,
      cell: (line) => money(line.amount),
    },
  ]
  return (
    <DataTable
      label={label}
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={columns}
      rows={lines}
      getRowId={(line) => line.id}
      getRowLabel={(line) => line.text}
      lineType={(line) => line.type}
      lineKind={(line) => line.kind}
      mobile={{ details: ['quantity', 'unit', 'price', 'vat', 'amount'] }}
    />
  )
}

/** The recap by tax category as DocumentTotals takes it. */
function recapOf(rows: readonly RecapRow[], currency?: string): TaxRecap {
  return {
    label: 'Recap by tax category',
    headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
    ...(currency === undefined ? {} : { currency }),
    rows: rows.map((row) => ({
      key: row.code,
      category: taxLabel(row.code),
      base: row.base,
      rate: TAX[row.code].rate,
      tax: row.tax,
    })),
  }
}

/** Without VAT, VAT and the invoice total, as the Core sends them. */
function totalRows(
  totals: { net: string; tax: string; total: string },
  currency: string,
  final: boolean,
): TotalsRow[] {
  return [
    { key: 'net', label: 'Total without VAT', value: totals.net, currency },
    { key: 'vat', label: 'VAT', value: totals.tax, currency },
    ...(final
      ? []
      : [{ key: 'total', label: 'Invoice total', value: totals.total, currency, group: true }]),
  ]
}

/** A time as the application writes it (`format.dateTime` in the tenant's zone). */
function Time({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>
}

function historyPanel(
  entries: { key: string; author: string; time: string; text: string }[],
): SidePanel {
  return {
    key: 'history',
    title: 'History',
    content: (
      <ActivityList
        label="History"
        items={entries.map((entry) => ({ ...entry, time: <Time>{entry.time}</Time> }))}
      />
    ),
  }
}

function deliveryPanel(sent: string): SidePanel {
  return {
    key: 'delivery',
    title: 'Delivery',
    content: (
      <KeyValueList
        columns={1}
        items={[
          { label: 'SEF', value: statusBadge('Delivered') },
          { label: 'Sent', value: <Time>{sent}</Time>, numeric: true },
        ]}
      />
    ),
  }
}

/** The panels' open state, as the Core keeps it. */
function usePanels(initial: string[]) {
  const [open, setOpen] = useState<string[]>(initial)
  const [hidden, setHidden] = useState(false)
  return {
    panelsOpen: open,
    onPanelsOpenChange: setOpen,
    panelsHidden: hidden,
    onPanelsHiddenChange: setHidden,
  }
}

function reminder() {
  return <Button family="verify" icon={Send} label="Send reminder" />
}

// ── F-2026-0418: final invoice ──────────────────────────────────────────────────────────────

const FINAL_REFERENCES: DocumentReferenceGroup[] = [
  {
    key: 'proforma',
    label: 'Proforma',
    items: [
      {
        key: 'pr',
        number: 'PR-2026-031',
        href: '#/sales/proformas/PR-2026-031',
        status: { label: 'Accepted' },
      },
    ],
  },
  {
    key: 'advances',
    label: 'Advances',
    kind: 'Advance invoice',
    items: ADVANCES.map((advance) => ({
      key: advance.number,
      number: advance.number,
      href: `#/sales/invoices/${advance.number}`,
      status: { label: 'Paid', tone: toneOf('Paid') },
    })),
  },
  {
    key: 'contract',
    label: 'Contract',
    items: [
      {
        key: 'c',
        number: '12/2026',
        href: '#/sales/contracts/12-2026',
        status: { label: 'Active' },
      },
    ],
  },
]

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    value: 'payment',
    label: 'Payment terms',
    text: 'Payment within 15 days to account 160-0000000456789-12 (Banca Intesa), reference 97 2026-0418.',
  },
  {
    value: 'advances',
    label: 'Advances deducted',
    text: 'Advances A-2026-038 and A-2026-044 are deducted with their VAT as invoiced.',
  },
  {
    value: 'warranty',
    label: 'Warranty',
    text: 'Warranty on the steel structure and the roofing panels: 24 months from the handover record of 25.09.2026.',
  },
  {
    value: 'retention',
    label: 'Retention of title',
    text: 'The goods remain the property of Kvadrat Gradnja d.o.o. until paid in full.',
  },
]

/** The attachments (AttachmentList, P5.5), each with its "Send with the e-invoice" flag. */
function Attachments() {
  const [send, setSend] = useState(
    Object.fromEntries(FINAL_ATTACHMENTS.map((file) => [file.id, file.send])),
  )
  return (
    <AttachmentList
      label="Attachments"
      files={FINAL_ATTACHMENTS.map((file) => ({
        id: file.id,
        name: file.name,
        sizeText: `PDF, ${file.size}`,
        state: 'available',
      }))}
      onDownload={(file) => {
        notice.info(`${file.name} is downloaded.`)
      }}
      extra={(file) => (
        <span role="group" aria-label={file.name}>
          <CheckboxField
            label="Send with the e-invoice"
            checked={send[file.id] === true}
            onChange={(checked) => {
              setSend((current) => ({ ...current, [file.id]: checked }))
            }}
          />
        </span>
      )}
    />
  )
}

function FinalInvoice({ phone }: { phone: boolean }) {
  const panels = usePanels(['delivery'])
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [notes, setNotes] = useState<DocumentNotesValue>({
    templates: ['payment', 'advances', 'warranty'],
    note: 'Please quote contract 12/2026 with the payment.',
  })
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: 'F-2026-0418' }]}
      tabs={SALES_TABS}
      {...(phone ? { bottomBar: reminder() } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title="F-2026-0418"
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge('Sent')}
        lifecycle={{ steps: STEPS, current: 2, label: 'Invoice status' }}
        counterparty={{ label: 'Customer', ...VOJVODJANKA }}
        keyFigures={[
          { label: 'Amount due', value: <MoneyText value={FINAL_DUE} currency="RSD" /> },
          {
            label: 'Invoice total',
            value: <MoneyText value={FINAL_TOTALS.total} currency="RSD" />,
          },
          { label: 'Due', value: <DateText value="2026-10-21" /> },
        ]}
        actions={
          <>
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone ? null : reminder()}
          </>
        }
        references={<DocumentReferences groups={FINAL_REFERENCES} />}
        lines={linesTable(FINAL_LINES, 'RSD', phone)}
        totals={{
          label: 'Totals',
          rows: totalRows(FINAL_TOTALS, 'RSD', false),
          recap: recapOf(FINAL_RECAP),
          deductions: ADVANCES.map((advance) => ({
            key: advance.number,
            label: `Advance ${advance.number}`,
            value: `-${advance.amount}`,
            currency: 'RSD',
            href: `#/sales/invoices/${advance.number}`,
          })),
          total: { key: 'due', label: 'Amount due', value: FINAL_DUE, currency: 'RSD' },
        }}
        notes={{
          title: 'Notes',
          actions:
            mode === 'view' ? (
              <Button
                intent="edit"
                label="Edit notes"
                onClick={() => {
                  setMode('edit')
                }}
              />
            ) : (
              <Button
                intent="save"
                emphasis="secondary"
                label="Done"
                onClick={() => {
                  setMode('view')
                }}
              />
            ),
          content: (
            <DocumentNotes
              mode={mode}
              templates={NOTE_TEMPLATES}
              value={notes}
              onChange={setNotes}
            />
          ),
        }}
        attachments={{ title: 'Attachments', content: <Attachments /> }}
        panels={[
          deliveryPanel('28.09.2026. 10:42'),
          {
            key: 'related',
            title: 'Related documents',
            count: 4,
            content: (
              <RelatedDocuments
                label="Related documents"
                items={[
                  {
                    key: 'pr',
                    type: 'Proforma',
                    number: 'PR-2026-031',
                    href: '#/sales/proformas/PR-2026-031',
                    status: statusBadge('Accepted'),
                  },
                  ...ADVANCES.map((advance) => ({
                    key: advance.number,
                    type: 'Advance invoice',
                    number: advance.number,
                    href: `#/sales/invoices/${advance.number}`,
                    status: statusBadge('Paid'),
                  })),
                  {
                    key: 'is',
                    type: 'Interim situation',
                    number: 'IS-2026-007',
                    href: '#/projects/IS-2026-007',
                    status: statusBadge('Issued'),
                  },
                ]}
              />
            ),
          },
          historyPanel([
            {
              key: 'h2',
              author: 'Milica Petrović',
              time: '28.09.2026. 10:42',
              text: 'Sent to SEF',
            },
            { key: 'h1', author: 'Dragan Ilić', time: '28.09.2026. 09:15', text: 'Issued' },
          ]),
        ]}
        {...panels}
      />
    </Shell>
  )
}

// ── IS-2026-007: interim situation and its specification ────────────────────────────────────

const SPEC_COLUMNS: DataTableColumn<SpecRow>[] = [
  { id: 'number', header: 'No.', cell: (row) => <span dir="ltr">{row.position?.number}</span> },
  { id: 'text', header: 'Position', minWidth: DESCRIPTION_MIN_WIDTH, cell: (row) => row.text },
  { id: 'unit', header: 'Unit', cell: (row) => row.position?.unit },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (row) =>
      row.position === undefined ? null : <NumberText value={row.position.quantity} />,
  },
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    numeric: true,
    cell: (row) =>
      row.position === undefined ? null : <MoneyText value={row.position.price} currency="RSD" />,
  },
  {
    id: 'contract',
    header: 'Contracted',
    align: 'end',
    numeric: true,
    cell: (row) => (
      <MoneyText value={row.position?.amount ?? row.sums?.amount ?? null} currency="RSD" />
    ),
  },
  {
    id: 'previous',
    header: 'Previous',
    align: 'end',
    numeric: true,
    cell: (row) => (
      <MoneyText
        value={row.position?.previous.amount ?? row.sums?.previous ?? null}
        currency="RSD"
      />
    ),
  },
  {
    id: 'current',
    header: 'This period',
    align: 'end',
    numeric: true,
    cell: (row) => (
      <MoneyText value={row.position?.current.amount ?? row.sums?.current ?? null} currency="RSD" />
    ),
  },
  {
    id: 'cumulative',
    header: 'Cumulative',
    align: 'end',
    numeric: true,
    cell: (row) => (
      <MoneyText
        value={row.position?.cumulative.amount ?? row.sums?.cumulative ?? null}
        currency="RSD"
      />
    ),
  },
]

function Situation({ phone }: { phone: boolean }) {
  const panels = usePanels(['related'])
  const [open, setOpen] = useState(false)
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Projects', href: '#/projects' }, { label: 'IS-2026-007' }]}
      {...(phone ? { bottomBar: <Button intent="pdf" label="PDF" /> } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title="IS-2026-007"
        back={{ href: '#/projects', label: 'Projects' }}
        status={statusBadge('Issued')}
        lifecycle={{ steps: STEPS, current: 1, label: 'Situation status' }}
        counterparty={{
          label: 'Investor',
          ...VOJVODJANKA,
          address: 'Hall B extension, Temerinski put 51, 21000 Novi Sad',
        }}
        keyFigures={[
          {
            label: 'This situation',
            value: <MoneyText value={SITUATION_TOTALS.total} currency="RSD" />,
          },
          {
            label: 'Done to date',
            value: <MoneyText value={SPEC_TOTALS.cumulative} currency="RSD" />,
          },
          { label: 'Contracted', value: <MoneyText value={SPEC_TOTALS.amount} currency="RSD" /> },
        ]}
        {...(phone ? {} : { actions: <Button intent="pdf" label="PDF" /> })}
        references={
          <DocumentReferences
            groups={[
              {
                key: 'contract',
                label: 'Contract',
                items: [
                  {
                    key: 'c',
                    number: '12/2026',
                    href: '#/sales/contracts/12-2026',
                    status: { label: 'Active' },
                  },
                ],
              },
              {
                key: 'previous',
                label: 'Previous situation',
                kind: 'Interim situation',
                items: [
                  {
                    key: 'is6',
                    number: 'IS-2026-006',
                    href: '#/projects/IS-2026-006',
                    status: { label: 'Paid', tone: toneOf('Paid') },
                  },
                ],
              },
            ]}
          />
        }
        lines={linesTable(SITUATION_LINES, 'RSD', phone)}
        specification={
          <DocumentSpecification
            title="Specification of works"
            count={SPECIFICATION.length}
            amount={SPEC_TOTALS.current}
            currency="RSD"
            description="IS-2026-007 · Contract 12/2026 · September 2026"
            open={open}
            onOpenChange={setOpen}
          >
            <DataTable
              label="Specification of works"
              layout={phone ? 'cards' : 'table'}
              columns={SPEC_COLUMNS}
              rows={SPEC_ROWS}
              getRowId={(row) => row.id}
              getRowLabel={(row) => `${row.position?.number ?? ''} ${row.text}`}
              lineType={(row) => row.type}
              virtualize
              maxHeight="62vh"
              mobile={{
                title: (row) => `${row.position?.number ?? ''} ${row.text}`,
                details: ['quantity', 'unit', 'price', 'previous', 'current', 'cumulative'],
              }}
            />
            <DocumentTotals
              label="Specification totals"
              rows={[
                {
                  key: 'contract',
                  label: 'Contracted',
                  value: SPEC_TOTALS.amount,
                  currency: 'RSD',
                },
                {
                  key: 'previous',
                  label: 'Previous',
                  value: SPEC_TOTALS.previous,
                  currency: 'RSD',
                },
              ]}
              recap={recapOf(SITUATION_RECAP)}
              total={{
                key: 'current',
                label: 'This period with VAT',
                value: SITUATION_TOTALS.total,
                currency: 'RSD',
              }}
              {...(phone ? { className: 'max-w-none' } : {})}
            />
          </DocumentSpecification>
        }
        totals={{
          label: 'Totals',
          rows: totalRows(SITUATION_TOTALS, 'RSD', true),
          recap: recapOf(SITUATION_RECAP),
          total: {
            key: 'due',
            label: 'Amount due',
            value: SITUATION_TOTALS.total,
            currency: 'RSD',
          },
        }}
        panels={[
          {
            key: 'related',
            title: 'Related documents',
            count: 2,
            content: (
              <RelatedDocuments
                label="Related documents"
                items={[
                  {
                    key: 'is6',
                    type: 'Interim situation',
                    number: 'IS-2026-006',
                    href: '#/projects/IS-2026-006',
                    status: statusBadge('Paid'),
                  },
                  {
                    key: 'f418',
                    type: 'Final invoice',
                    number: 'F-2026-0418',
                    href: '#/sales/invoices/F-2026-0418',
                    status: statusBadge('Sent'),
                  },
                ]}
              />
            ),
          },
          historyPanel([
            {
              key: 'h1',
              author: 'Snežana Popović',
              time: '05.10.2026. 16:20',
              text: 'Quantities confirmed by the supervising engineer',
            },
          ]),
        ]}
        {...panels}
      />
    </Shell>
  )
}

// ── F-2026-0415: invoice in EUR ─────────────────────────────────────────────────────────────

function EurInvoice({ phone }: { phone: boolean }) {
  const panels = usePanels(['delivery'])
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: 'F-2026-0415' }]}
      tabs={SALES_TABS}
      {...(phone ? { bottomBar: reminder() } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title="F-2026-0415"
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge('Sent')}
        lifecycle={{ steps: STEPS, current: 2, label: 'Invoice status' }}
        counterparty={{ label: 'Customer', ...DONAU_BAU }}
        keyFigures={[
          {
            label: 'Invoice total',
            value: <MoneyText value={EUR_TOTALS.total} currency="EUR" />,
          },
          { label: 'In RSD', value: <MoneyText value={EUR_IN_RSD.total} currency="RSD" /> },
          { label: 'Due', value: <DateText value="2026-11-02" /> },
        ]}
        currency={
          <DocumentCurrency
            currency="EUR"
            homeCurrency="RSD"
            rate={EUR_RATE.rate}
            rateDate={EUR_RATE.date}
          />
        }
        actions={
          <>
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone ? null : reminder()}
          </>
        }
        references={
          <DocumentReferences
            groups={[
              {
                key: 'order',
                label: 'Order',
                items: [
                  {
                    key: 'o',
                    number: 'PO 4500018823',
                    href: '#/sales/orders/PO-4500018823',
                    status: { label: 'Completed' },
                  },
                ],
              },
            ]}
          />
        }
        lines={linesTable(EUR_LINES, 'EUR', phone)}
        totals={{
          label: 'Totals',
          rows: totalRows(EUR_TOTALS, 'EUR', true),
          recap: recapOf(EUR_RECAP, 'EUR'),
          total: { key: 'total', label: 'Invoice total', value: EUR_TOTALS.total, currency: 'EUR' },
          exchange: {
            currency: 'EUR',
            homeCurrency: 'RSD',
            rate: EUR_RATE.rate,
            source: 'NBS middle rate on 05.10.2026.',
            rows: [
              {
                key: 'net',
                label: 'Total without VAT in RSD',
                value: EUR_IN_RSD.net,
                currency: 'RSD',
              },
              { key: 'vat', label: 'VAT in RSD', value: EUR_IN_RSD.tax, currency: 'RSD' },
              {
                key: 'total',
                label: 'Invoice total in RSD',
                value: EUR_IN_RSD.total,
                currency: 'RSD',
              },
            ],
          },
          footnotes: [
            {
              key: 'e',
              marker: '¹',
              text: 'E: returnable packaging, exempt under Article 24 of the VAT Act (illustrative).',
            },
            {
              key: 'ae',
              marker: '²',
              text: 'AE: reverse charge — the recipient accounts for the VAT, Article 10 of the VAT Act (illustrative).',
            },
          ],
        }}
        panels={[deliveryPanel('02.10.2026. 08:31')]}
        {...panels}
      />
    </Shell>
  )
}

// ── KO-2026-0009: decrease against F-2026-0410 ──────────────────────────────────────────────

const DECREASE_COLUMNS: DataTableColumn<CorrectedLine>[] = [
  { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.text },
  // Short codes give their room to the item's name (P5.23).
  { id: 'unit', header: 'Unit', minWidth: MIN_COLUMN_WIDTH, cell: (line) => line.unit },
  ...correctionColumns<CorrectedLine>({
    id: 'quantity',
    original: (line) => line.quantity.original,
    change: (line) => line.quantity.change,
    next: (line) => line.quantity.next,
    headers: { original: 'Original qty', change: 'Qty change', next: 'New qty' },
  }),
  {
    id: 'price',
    header: 'Price',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.price} currency="RSD" />,
  },
  ...correctionColumns<CorrectedLine>({
    id: 'amount',
    original: (line) => line.amount.original,
    change: (line) => line.amount.change,
    next: (line) => line.amount.next,
    currency: 'RSD',
    headers: { original: 'Original amount', change: 'Change', next: 'New amount' },
  }),
  {
    id: 'vat',
    header: 'VAT',
    minWidth: MIN_COLUMN_WIDTH,
    // A code never wraps ("S 20%").
    cell: (line) => <span className="whitespace-nowrap">{taxLabel(line.tax)}</span>,
  },
]

function Decrease({ phone }: { phone: boolean }) {
  const panels = usePanels(['delivery'])
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: 'KO-2026-0009' }]}
      tabs={SALES_TABS}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title="KO-2026-0009"
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge('Sent to SEF')}
        counterparty={{ label: 'Customer', ...MEDIC_LAB }}
        source={
          <DocumentSource
            label="Corrects"
            documents={[
              {
                key: 'f410',
                kind: 'Invoice',
                number: 'F-2026-0410',
                href: '#/sales/invoices/F-2026-0410',
                date: '2026-09-25',
                total: { value: MEDIC_TOTALS.total, currency: 'RSD' },
                status: statusBadge('Partially paid'),
              },
            ]}
          />
        }
        keyFigures={[
          { label: 'Change', value: <ChangeText value={DECREASE.change} currency="RSD" /> },
          { label: 'New total', value: <MoneyText value={DECREASE.newTotal} currency="RSD" /> },
        ]}
        actions={<Button intent="pdf" label="PDF" emphasis="secondary" />}
        lines={
          <DataTable
            label="Corrected lines"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={DECREASE_COLUMNS}
            rows={DECREASE_LINES}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.text}
          />
        }
        totals={{
          label: 'Totals of the change',
          rows: [
            {
              key: 'base',
              label: 'Change of tax base S 20%',
              value: DECREASE.base,
              currency: 'RSD',
            },
            { key: 'vat', label: 'Change of VAT S 20%', value: DECREASE.tax, currency: 'RSD' },
          ],
          total: {
            key: 'change',
            label: 'Total decrease',
            value: DECREASE.change,
            currency: 'RSD',
          },
        }}
        sections={[
          {
            key: 'reason',
            title: 'Reason for the correction',
            content: (
              <p className="bidi-content m-0 text-sm text-primary">
                Damaged goods returned with delivery note OTP-2026-0347, inspected on site on
                01.10.2026.
              </p>
            ),
          },
        ]}
        panels={[deliveryPanel('06.10.2026. 09:05')]}
        {...panels}
      />
    </Shell>
  )
}

// ── F-2026-0407 cancelled, and ST-2026-0004 ─────────────────────────────────────────────────

function Cancelled({ phone }: { phone: boolean }) {
  const panels = usePanels(['related'])
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: 'F-2026-0407' }]}
      tabs={SALES_TABS}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title="F-2026-0407"
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge('Cancelled')}
        banner={
          <CancellationBanner
            by={CANCELLATION.by}
            at={CANCELLATION.at}
            reason={CANCELLATION.reason}
            document={{
              kind: 'Cancellation document',
              number: CANCELLATION.number,
              href: `#${D2_ROUTES.cancellation}`,
            }}
          />
        }
        counterparty={{ label: 'Customer', ...BOJOVIC }}
        keyFigures={[
          {
            label: 'Invoice total',
            value: <MoneyText value={CANCELLED_TOTALS.total} currency="RSD" />,
          },
          { label: 'Issued', value: <DateText value="2026-09-18" /> },
        ]}
        actions={<Button intent="pdf" label="PDF" emphasis="secondary" />}
        lines={linesTable(CANCELLED_LINES, 'RSD', phone)}
        totals={{
          label: 'Totals',
          rows: totalRows(CANCELLED_TOTALS, 'RSD', true),
          total: {
            key: 'total',
            label: 'Invoice total',
            value: CANCELLED_TOTALS.total,
            currency: 'RSD',
          },
        }}
        panels={[
          {
            key: 'related',
            title: 'Related documents',
            count: 1,
            content: (
              <RelatedDocuments
                label="Related documents"
                items={[
                  {
                    key: 'st',
                    type: 'Cancellation document',
                    number: CANCELLATION.number,
                    href: `#${D2_ROUTES.cancellation}`,
                    status: statusBadge('Sent to SEF'),
                  },
                ]}
              />
            ),
          },
          historyPanel([
            {
              key: 'h2',
              author: CANCELLATION.by,
              time: '06.10.2026. 11:20',
              text: `Cancelled by ${CANCELLATION.number}`,
            },
            { key: 'h1', author: 'Dragan Ilić', time: '18.09.2026. 13:02', text: 'Issued' },
          ]),
        ]}
        {...panels}
      />
    </Shell>
  )
}

function CancellationDocument({ phone }: { phone: boolean }) {
  const panels = usePanels(['delivery'])
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: CANCELLATION.number }]}
      tabs={SALES_TABS}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={CANCELLATION.number}
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge('Sent to SEF')}
        counterparty={{ label: 'Customer', ...BOJOVIC }}
        source={
          <DocumentSource
            label="Cancels"
            documents={[
              {
                key: 'f407',
                kind: 'Invoice',
                number: CANCELLATION.invoice,
                href: `#${D2_ROUTES.cancelled}`,
                date: '2026-09-18',
                total: { value: CANCELLED_TOTALS.total, currency: 'RSD' },
                status: statusBadge('Cancelled'),
              },
            ]}
          />
        }
        keyFigures={[
          {
            label: 'Total',
            value: <MoneyText value={CANCELLATION_TOTALS.total} currency="RSD" />,
          },
          { label: 'Issued', value: <DateText value="2026-10-06" /> },
        ]}
        actions={<Button intent="pdf" label="PDF" emphasis="secondary" />}
        lines={linesTable(CANCELLATION_LINES, 'RSD', phone)}
        totals={{
          label: 'Totals',
          rows: totalRows(CANCELLATION_TOTALS, 'RSD', true),
          total: {
            key: 'total',
            label: 'Total',
            value: CANCELLATION_TOTALS.total,
            currency: 'RSD',
          },
        }}
        sections={[
          {
            key: 'reason',
            title: 'Reason',
            content: <p className="bidi-content m-0 text-sm text-primary">{CANCELLATION.reason}</p>,
          },
        ]}
        panels={[deliveryPanel('06.10.2026. 11:21')]}
        {...panels}
      />
    </Shell>
  )
}

// ── Routes ──────────────────────────────────────────────────────────────────────────────────

export const GROUP_D2_ROUTES: ExampleRoute[] = [
  { path: D2_ROUTES.final, render: (phone) => <FinalInvoice phone={phone} /> },
  { path: D2_ROUTES.situation, render: (phone) => <Situation phone={phone} /> },
  { path: D2_ROUTES.eur, render: (phone) => <EurInvoice phone={phone} /> },
  { path: D2_ROUTES.decrease, render: (phone) => <Decrease phone={phone} /> },
  { path: D2_ROUTES.cancelled, render: (phone) => <Cancelled phone={phone} /> },
  { path: D2_ROUTES.cancellation, render: (phone) => <CancellationDocument phone={phone} /> },
]

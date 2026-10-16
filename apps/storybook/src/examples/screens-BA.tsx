import { BookCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Button,
  ChangeableValue,
  ChangeText,
  correctionColumns,
  DataTable,
  DateField,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DocumentPage,
  DocumentReferences,
  EditableGrid,
  MoneyText,
  notice,
  NumberText,
  Toaster,
  UnavailableAction,
  useLiro,
  type DataTableColumn,
  type EditableGridColumn,
  type GridMessage,
  type LifecycleStep,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import { Tenant } from './screens-G'
import { BAKERY_ACCOUNT, bakeryBadge, bakeryTabs } from './screens-AZ'
import { BAKERY_COMPANY } from './data-AZ'
import {
  BA_ROUTES,
  BA_TODAY,
  CALCULATION,
  CALCULATION_INPUTS,
  calculationTotals,
  lineWarnings,
  PRICE_CHANGE,
  PRICE_CHANGE_LINES,
  PRICE_CHANGE_TOTALS,
  priceChanges,
  priceLine,
  vatRecap,
  type CalculationInput,
  type CalculationLine,
  type PriceChangeLine,
} from './data-BA'

/*
 * Group BA's example screens (P5.53, the retail price calculation): Pekara Zlatni klas's shop
 * prices the goods it resells from Mlekara Ravnica d.o.o.'s invoice 2026-4471. Calculation
 * KLK-2026-0047 is a DocumentPage whose lines are an EditableGrid: the shop enters a line's retail
 * price and every other column is the application's figure, read-only (purchase price, dependent
 * costs, cost price, margin percentage and amount, price without VAT, VAT rate and amount, retail
 * value); the totals and the VAT by rate are DocumentTotals; the price change it causes on the
 * shelf is the Original / Change / New pattern, and its own document NIV-2026-0012. The screen
 * passes what the shop enters to the application (data-BA.ts plays it) and shows its answer.
 */

export { BA_ROUTES }

const STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'posted', label: 'Posted' },
]

/** Prices per piece: two decimals, the currency named once on the page. */
function Price({ value }: { value: string | null }) {
  return <NumberText value={value} decimals={2} />
}

function useCalculationColumns(posted: boolean): EditableGridColumn<CalculationLine>[] {
  const { format } = useLiro()
  const shown = (
    id: string,
    header: string,
    pick: (line: CalculationLine) => string | null,
    width = 104,
  ): EditableGridColumn<CalculationLine> => ({
    id,
    header,
    width,
    type: 'display',
    align: 'end',
    numeric: true,
    display: (line) => <Price value={pick(line)} />,
  })
  return [
    {
      id: 'item',
      header: 'Item',
      width: 220,
      type: 'display',
      display: (line) => <span className="bidi-content">{line.item}</span>,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      width: 88,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (line) => <NumberText value={line.quantity} />,
    },
    { id: 'unit', header: 'Unit', width: 64, type: 'display', display: (line) => line.unit },
    shown('purchase', 'Purchase price', (line) => line.purchase),
    shown('dependent', 'Dependent costs', (line) => line.dependent),
    shown('cost', 'Cost price', (line) => line.cost),
    {
      id: 'marginPercent',
      header: 'Margin %',
      width: 96,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (line) => (
        <span className="bidi-isolate">
          {line.marginPercent === null ? '—' : format.percent(line.marginPercent, { decimals: 2 })}
        </span>
      ),
    },
    shown('margin', 'Margin', (line) => line.margin),
    shown('net', 'Price without VAT', (line) => line.net),
    {
      id: 'rate',
      header: 'VAT rate',
      width: 80,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (line) => <span className="bidi-isolate">{format.percent(line.rate)}</span>,
    },
    shown('vat', 'VAT', (line) => line.vat, 88),
    {
      id: 'retail',
      header: 'Retail price',
      width: 120,
      type: 'number',
      decimals: 2,
      value: (line) => line.retail,
      readOnly: () => posted,
    },
    shown('retailValue', 'Retail value', (line) => line.retailValue, 120),
  ]
}

function priceChangeColumns(): DataTableColumn<PriceChangeLine>[] {
  return [
    { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.item },
    {
      id: 'quantity',
      header: 'On the shelf',
      align: 'end',
      numeric: true,
      cell: (line) => <NumberText value={line.quantity} />,
    },
    { id: 'unit', header: 'Unit', cell: (line) => line.unit },
    ...correctionColumns<PriceChangeLine>({
      id: 'price',
      original: (line) => line.old,
      change: (line) => line.change,
      next: (line) => line.next,
      headers: { original: 'Old price', change: 'Change', next: 'New price' },
      currency: 'RSD',
    }),
    {
      id: 'value',
      header: 'Value of the change',
      align: 'end',
      numeric: true,
      cell: (line) => <ChangeText value={line.value} currency="RSD" />,
    },
  ]
}

function PriceChangeTable({
  lines,
  phone,
  label,
  inCard = false,
}: {
  lines: readonly PriceChangeLine[]
  phone: boolean
  label: string
  inCard?: boolean
}) {
  return (
    <DataTable
      label={label}
      inCard={inCard}
      layout={phone ? 'cards' : 'table'}
      columns={priceChangeColumns()}
      rows={lines}
      getRowId={(line) => line.id}
      getRowLabel={(line) => line.item}
      mobile={{
        title: (line) => line.item,
        details: ['quantity', 'price.original', 'price.change', 'price.new', 'value'],
      }}
    />
  )
}

function supplierDetails(date: ReactNode, basedOn: ReactNode) {
  return (
    <>
      <ChangeableValue label="Shop" value={CALCULATION.shop} />
      {date}
      <ChangeableValue label="Based on" value={basedOn} />
      <ChangeableValue
        label="Dependent costs"
        value={`${CALCULATION.transport.name}, ${CALCULATION.transport.number}`}
      />
      <ChangeableValue label="Currency" value="RSD" />
      <ChangeableValue label="Prepared by" value={CALCULATION.preparedBy} />
    </>
  )
}

function CalculationScreen({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [inputs, setInputs] = useState<readonly CalculationInput[]>(CALCULATION_INPUTS)
  const [date, setDate] = useState<string | null>(CALCULATION.date)
  const [posted, setPosted] = useState(false)
  const lines = inputs.map(priceLine)
  const totals = calculationTotals(lines)
  const changes = priceChanges(lines)
  const columns = useCalculationColumns(posted)
  const messages: Record<string, GridMessage[]> = {}
  for (const line of lines) {
    const warnings = lineWarnings(line)
    if (warnings.length > 0) {
      messages[line.id] = warnings.map((text) => ({ tone: 'warning', text, columns: ['retail'] }))
    }
  }
  const missing = lines.some((line) => line.retail === null)
  const post = posted ? null : missing ? (
    <UnavailableAction
      family="primary"
      icon={BookCheck}
      emphasis="primary"
      label="Post"
      reason="Every line needs its retail price."
    />
  ) : (
    <Button
      family="primary"
      icon={BookCheck}
      emphasis="primary"
      label="Post"
      onClick={() => {
        setPosted(true)
        notice.success(
          `${CALCULATION.number} posted with price change ${PRICE_CHANGE.number}: the shelf takes the new prices.`,
        )
      }}
    />
  )
  return (
    <Tenant today={BA_TODAY}>
      <Shell
        phone={phone}
        account={BAKERY_ACCOUNT}
        company={BAKERY_COMPANY.id}
        crumbs={[
          { label: 'Shop prices', href: `#${BA_ROUTES.calculation}` },
          { label: CALCULATION.number },
        ]}
        tabs={bakeryTabs('prices')}
        {...(phone && post !== null ? { bottomBar: post } : {})}
      >
        <DocumentPage
          layout={phone ? 'phone' : 'desktop'}
          title={CALCULATION.number}
          status={bakeryBadge(posted ? 'Posted' : 'Draft')}
          lifecycle={{ steps: STEPS, current: posted ? 1 : 0, label: 'Calculation status' }}
          counterparty={{
            label: 'Supplier',
            name: CALCULATION.supplier.name,
            taxId: CALCULATION.supplier.taxId,
            address: CALCULATION.supplier.address,
          }}
          details={supplierDetails(
            <ChangeableValue
              label="Date"
              value={<DateText value={date} />}
              {...(posted
                ? {}
                : { field: <DateField label="Date" value={date} onChange={setDate} /> })}
            />,
            `Supplier invoice ${CALCULATION.invoice.number} of ${format.date(CALCULATION.invoice.date)}`,
          )}
          keyFigures={[
            {
              key: 'retail',
              label: 'Retail value',
              value: <MoneyText value={totals.retail} currency="RSD" />,
            },
            {
              key: 'cost',
              label: 'Cost value',
              value: <MoneyText value={totals.cost} currency="RSD" />,
            },
            {
              key: 'margin',
              label: 'Margin',
              value: <MoneyText value={totals.margin} currency="RSD" />,
            },
            {
              key: 'changes',
              label: 'Price changes',
              value: `${format.number(String(changes.length))} items`,
            },
          ]}
          actions={
            <>
              <Button intent="print" emphasis="secondary" label="Print" />
              {phone ? null : post}
            </>
          }
          lines={
            <EditableGrid<CalculationLine>
              label={`Lines of ${CALCULATION.number}`}
              inCard
              layout={phone ? 'phone' : 'desktop'}
              columns={columns}
              rows={lines}
              getRowId={(line) => line.id}
              minRows={lines.length}
              maxRows={lines.length}
              messages={messages}
              totals={{ retailValue: { value: totals.retail } }}
              onCellChange={(rowId, columnId, value) => {
                if (columnId !== 'retail') return
                setInputs((current) =>
                  current.map((input) =>
                    input.id === rowId
                      ? { ...input, retail: typeof value === 'string' ? value : null }
                      : input,
                  ),
                )
              }}
              onAddRow={() => undefined}
              onRemoveRow={() => undefined}
            />
          }
          totals={{
            label: 'Totals',
            rows: [
              { key: 'purchase', label: 'Purchase value', value: totals.purchase, currency: 'RSD' },
              {
                key: 'dependent',
                label: 'Dependent costs',
                value: totals.dependent,
                currency: 'RSD',
              },
              { key: 'cost', label: 'Cost value', value: totals.cost, currency: 'RSD' },
              {
                key: 'margin',
                label: 'Margin',
                value: totals.margin,
                currency: 'RSD',
                group: true,
              },
              { key: 'net', label: 'Value without VAT', value: totals.net, currency: 'RSD' },
              { key: 'vat', label: 'VAT', value: totals.vat, currency: 'RSD' },
            ],
            total: { key: 'retail', label: 'Retail value', value: totals.retail, currency: 'RSD' },
            recap: {
              label: 'VAT by rate',
              headers: { category: 'Rate', base: 'Without VAT', rate: 'Rate', tax: 'VAT' },
              currency: 'RSD',
              rows: vatRecap(lines).map((row) => ({
                key: row.rate,
                category: `VAT ${format.percent(row.rate)}`,
                base: row.base,
                rate: row.rate,
                tax: row.vat,
              })),
            },
          }}
          sections={[
            {
              key: 'changes',
              title: 'Price changes on the shelf',
              actions: (
                <Link
                  href={`#${BA_ROUTES.priceChange}`}
                  className="text-sm text-link no-underline hover:underline"
                >
                  Price change <span dir="ltr">{PRICE_CHANGE.number}</span>
                </Link>
              ),
              content: (
                <PriceChangeTable
                  lines={changes}
                  phone={phone}
                  label={`Price changes from ${CALCULATION.number}`}
                />
              ),
            },
          ]}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function PriceChangeScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  return (
    <Tenant today={BA_TODAY}>
      <Shell
        phone={phone}
        account={BAKERY_ACCOUNT}
        company={BAKERY_COMPANY.id}
        crumbs={[
          { label: 'Shop prices', href: `#${BA_ROUTES.calculation}` },
          { label: PRICE_CHANGE.number },
        ]}
        tabs={bakeryTabs('prices')}
      >
        <DocumentPage
          layout={phone ? 'phone' : 'desktop'}
          title={PRICE_CHANGE.number}
          back={{ href: `#${BA_ROUTES.calculation}`, label: CALCULATION.number }}
          status={bakeryBadge('Draft')}
          lifecycle={{ steps: STEPS, current: 0, label: 'Price change status' }}
          details={
            <>
              <ChangeableValue label="Shop" value={CALCULATION.shop} />
              <ChangeableValue label="Date" value={<DateText value={PRICE_CHANGE.date} />} />
              <ChangeableValue label="Reason" value={PRICE_CHANGE.reason} />
            </>
          }
          references={
            <DocumentReferences
              groups={[
                {
                  key: 'calculation',
                  label: 'Calculation',
                  items: [
                    {
                      key: 'klk',
                      number: CALCULATION.number,
                      href: `#${BA_ROUTES.calculation}`,
                      status: { label: 'Draft' },
                    },
                  ],
                },
              ]}
            />
          }
          keyFigures={[
            {
              key: 'items',
              label: 'Items',
              value: <NumberText value={String(PRICE_CHANGE_LINES.length)} />,
            },
            {
              key: 'total',
              label: 'Change of the shelf’s value',
              value: <ChangeText value={PRICE_CHANGE_TOTALS.total} currency="RSD" />,
            },
          ]}
          lines={
            <PriceChangeTable
              lines={PRICE_CHANGE_LINES}
              phone={phone}
              label={`Lines of ${PRICE_CHANGE.number}`}
              inCard
            />
          }
          totals={{
            label: 'Totals',
            rows: [
              {
                key: 'net',
                label: 'Change without VAT',
                value: PRICE_CHANGE_TOTALS.net,
                currency: 'RSD',
              },
              {
                key: 'vat10',
                label: `VAT ${format.percent('10')}`,
                value: PRICE_CHANGE_TOTALS.vat10,
                currency: 'RSD',
              },
              {
                key: 'vat20',
                label: `VAT ${format.percent('20')}`,
                value: PRICE_CHANGE_TOTALS.vat20,
                currency: 'RSD',
              },
            ],
            total: {
              key: 'total',
              label: 'Change of retail value',
              value: PRICE_CHANGE_TOTALS.total,
              currency: 'RSD',
            },
          }}
        />
      </Shell>
    </Tenant>
  )
}

export const GROUP_BA_ROUTES: ExampleRoute[] = [
  { path: BA_ROUTES.calculation, render: (phone) => <CalculationScreen phone={phone} /> },
  { path: BA_ROUTES.priceChange, render: (phone) => <PriceChangeScreen phone={phone} /> },
]

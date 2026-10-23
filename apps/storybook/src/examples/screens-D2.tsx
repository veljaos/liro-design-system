import { useState, type ReactNode } from 'react'
import {
  Button,
  correctionColumns,
  DataTable,
  DESCRIPTION_MIN_WIDTH,
  DocumentPage,
  DocumentSource,
  KeyValueList,
  MIN_COLUMN_WIDTH,
  MoneyText,
  ChangeText,
  type DataTableColumn,
  type SidePanel,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { SALES_TABS, Shell, statusBadge } from './example-shell'
import {
  DECREASE,
  DECREASE_LINES,
  MEDIC_LAB,
  MEDIC_TOTALS,
  TAX,
  type CorrectedLine,
  type DocLine,
} from './data-D2'

/*
 * A complex document of P5.18 (group D2), linked into the example application: decrease document
 * KO-2026-0009 against F-2026-0410, its lines as Original / Change / New. Only the public entry
 * point; every amount comes from data-D2.ts, computed there in whole paras.
 */

export const D2_ROUTES = {
  decrease: '/sales/corrections/KO-2026-0009',
}

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

/** A time as the application writes it (`format.dateTime` in the tenant's zone). */
function Time({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>
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
    cell: (line) => <span className="bidi-isolate whitespace-nowrap">{taxLabel(line.tax)}</span>,
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

// ── Routes ──────────────────────────────────────────────────────────────────────────────────

export const GROUP_D2_ROUTES: ExampleRoute[] = [
  { path: D2_ROUTES.decrease, render: (phone) => <Decrease phone={phone} /> },
]

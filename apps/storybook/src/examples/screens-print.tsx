import { type ReactNode } from 'react'
import {
  BackButton,
  Button,
  DateText,
  MoneyText,
  NumberText,
  PrintDocument,
  useLiro,
  type PageBack,
  type PrintColumn,
  type PrintParty,
} from '@veljaos/ui'
import { QrCode } from '../../../../packages/ui/src/components/qr-code'
import type { ExampleRoute } from './example-app'
import { ROUTES } from './example-shell'
import { TOTAL_ROWS } from './screens-core'
import {
  FEATURED,
  INVOICE_FACTS,
  INVOICES,
  LINES,
  SELLER,
  TOTALS,
  type ExampleInvoice,
  type ExampleLine,
} from './examples-story-data'

/*
 * Invoice F-2026-0412 on paper (P5.17, P5.28), opened from its page's "PDF": a print preview with
 * no application chrome — a bar with the way back and Print (left off the paper) above the sheet.
 * The sheet is as simple as a Stripe invoice: the lines and totals its page shows, from the same
 * data (examples-story-data.ts); the amount due, the payment details and the IPS QR code; no
 * signatures. Only the public entry point `@veljaos/ui`.
 */

/**
 * A printout as the application opens it: no shell, a bar with the way back and Print above the
 * sheet (the bar is left off the paper), the sheet on the page.
 */
function PrintPreview({
  title,
  back,
  children,
}: {
  title: string
  back?: PageBack
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
      <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2 print:hidden">
        {back !== undefined && <BackButton back={back} />}
        <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
          {title}
        </p>
        <Button
          intent="print"
          label="Print"
          onClick={() => {
            window.print()
          }}
        />
      </header>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}

/**
 * The issuer's logo on the printout (an image from the application, D18): a mark and the name in
 * the logo colour, drawn here as an SVG.
 */
function Logo({ name }: { name: string }) {
  return (
    <svg
      role="img"
      aria-label={name}
      viewBox="0 0 220 32"
      className="block h-8 w-auto text-logo"
      fill="currentColor"
    >
      <rect
        x="2.5"
        y="4.5"
        width="23"
        height="23"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <text x="34" y="22" fontSize="16" fontWeight="700" fontFamily="var(--liro-font-brand)">
        {name}
      </text>
    </svg>
  )
}

const INVOICE_COLUMNS: PrintColumn<ExampleLine>[] = [
  { key: 'item', header: 'Item', cell: (line) => line.item },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'end',
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { key: 'unit', header: 'Unit', cell: (line) => line.unit, width: '12mm' },
  {
    key: 'price',
    header: 'Price',
    align: 'end',
    cell: (line) => <NumberText value={line.price} decimals={2} />,
  },
  { key: 'vat', header: 'VAT', cell: (line) => line.vat, width: '16mm' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

/** A footer of parts: it wraps between the parts, never inside a number. */
function FooterLine({ parts }: { parts: readonly string[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 && ' · '}
          <span className="whitespace-nowrap">{part}</span>
        </span>
      ))}
    </>
  )
}

function InvoicePrintScreen({ invoice }: { invoice: ExampleInvoice }) {
  const { format } = useLiro()
  const seller: PrintParty = {
    key: 'seller',
    label: 'Seller',
    name: SELLER.name,
    lines: [SELLER.address, SELLER.city],
    details: [
      { key: 'pib', label: 'PIB', value: SELLER.taxId, numeric: true },
      { key: 'mb', label: 'MB', value: SELLER.registration, numeric: true },
      { key: 'email', label: 'E-mail', value: SELLER.email },
    ],
  }
  const buyer: PrintParty = {
    key: 'buyer',
    label: 'Buyer',
    name: invoice.customer,
    lines: [invoice.address],
    details: [
      { key: 'pib', label: 'PIB', value: invoice.taxId, numeric: true },
      { key: 'mb', label: 'MB', value: INVOICE_FACTS.buyerRegistration, numeric: true },
      { key: 'email', label: 'E-mail', value: INVOICE_FACTS.buyerEmail },
    ],
  }
  const due = `${format.money(TOTALS.due, 'RSD')} due ${format.date(invoice.due)}`
  return (
    <PrintPreview
      title={`Invoice ${invoice.number}`}
      back={{ href: `#${ROUTES.invoice(invoice.number)}`, label: invoice.number }}
    >
      <PrintDocument
        title="Invoice"
        number={invoice.number}
        logo={<Logo name="Kvadrat Gradnja" />}
        footer={<FooterLine parts={[`Invoice ${invoice.number}`, due]} />}
        details={[
          {
            key: 'number',
            label: 'Invoice number',
            value: <bdi>{invoice.number}</bdi>,
            numeric: true,
          },
          {
            key: 'issued',
            label: 'Date of issue',
            value: <DateText value={invoice.issued} />,
            numeric: true,
          },
          {
            key: 'supplied',
            label: 'Date of supply',
            value: <DateText value={INVOICE_FACTS.supplied} />,
            numeric: true,
          },
          { key: 'due', label: 'Due date', value: <DateText value={invoice.due} />, numeric: true },
          { key: 'place', label: 'Place of issue', value: INVOICE_FACTS.place },
        ]}
        parties={[seller, buyer]}
        amountDue={{ value: TOTALS.due, currency: 'RSD', date: invoice.due }}
        payment={{
          title: 'Payment details',
          details: [
            { key: 'recipient', label: 'Recipient', value: `${SELLER.name}, Novi Sad` },
            {
              key: 'account',
              label: 'Account',
              value: <bdi>{`${SELLER.account} (${SELLER.bank})`}</bdi>,
              numeric: true,
            },
            {
              key: 'reference',
              label: 'Model and reference number',
              value: <bdi>{INVOICE_FACTS.reference}</bdi>,
              numeric: true,
            },
            { key: 'purpose', label: 'Purpose of payment', value: `Invoice ${invoice.number}` },
          ],
          code: (
            <QrCode
              value={INVOICE_FACTS.ipsPayload}
              label="IPS QR code for the payment"
              size="fill"
            />
          ),
          codeCaption: 'IPS QR',
        }}
        lines={{
          caption: 'Lines',
          columns: INVOICE_COLUMNS,
          rows: LINES,
          rowKey: (line) => line.id,
        }}
        totals={{
          label: 'Totals',
          rows: TOTAL_ROWS,
          total: { key: 'due', label: 'Amount due', value: TOTALS.due, currency: 'RSD' },
        }}
        notesTitle="Notes"
        notes={[
          `The advance ${INVOICE_FACTS.advance} is deducted from this invoice.`,
          `The pallet deposit of ${format.money(TOTALS.exempt, 'RSD')} is exempt from VAT and is returned when the pallets come back.`,
        ]}
      />
    </PrintPreview>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const PRINTED = INVOICES.find((each) => each.number === FEATURED)

/** The printout of the invoice the examples open (FEATURED). */
export const PRINT_ROUTES: ExampleRoute[] =
  PRINTED === undefined
    ? []
    : [
        {
          path: ROUTES.invoicePrint(PRINTED.number),
          render: () => <InvoicePrintScreen invoice={PRINTED} />,
        },
      ]

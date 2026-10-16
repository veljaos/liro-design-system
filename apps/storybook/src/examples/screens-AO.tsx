import { FileText } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  DateText,
  DocumentPage,
  DocumentReferences,
  KeyFigures,
  MoneyText,
  notice,
  NumberText,
  ReportPage,
  SectionCard,
  SelectField,
  useLiro,
  type DataTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, statusBadge } from './example-shell'
import {
  AO_ROUTES,
  INTEREST_NOTE,
  LINES,
  PARTNER,
  PARTNERS,
  RATES,
  TOTALS,
  type InterestLine,
  type InterestRate,
} from './data-AO'
import { LedgerShell } from './screens-AK'

/*
 * Group AO's example screens (P5.56): the late-payment interest Kvadrat Gradnja d.o.o. charges
 * Stanogradnja Plus d.o.o. — the calculation (ReportPage: partner, period and rates as
 * parameters; each invoice's late days at the rate of their period, split where the rate
 * changes; the rate table as the application's data) and the interest note it issues
 * (DocumentPage). Assembled from ReportPage, KeyFigures, DataTable, ConfirmDialog, DocumentPage
 * and DocumentReferences; the days, rates and amounts are the Core's (data-AO.ts).
 */

export { AO_ROUTES }

function useInterestColumns(): DataTableColumn<InterestLine>[] {
  const { format } = useLiro()
  const note = (line: InterestLine) => {
    if (line.note === undefined) return null
    if (line.note.kind === 'open') return 'Still open: interest runs until it is paid.'
    if (line.note.kind === 'rateChange')
      return `The rate changed on ${format.date(line.note.date ?? line.from)}.`
    return `${format.money(line.note.amount ?? '0.00', 'RSD')} paid on ${format.date(line.note.date ?? line.from)}.`
  }
  return [
    {
      id: 'document',
      header: 'Invoice',
      cell: (line) => (
        <span className="flex flex-col">
          <span dir="ltr" className="bidi-isolate">
            {line.document}
          </span>
          {line.note !== undefined && (
            <span className="bidi-content text-xs text-secondary">{note(line)}</span>
          )}
        </span>
      ),
    },
    { id: 'due', header: 'Due', numeric: true, cell: (line) => <DateText value={line.due} /> },
    {
      id: 'paid',
      header: 'Paid',
      numeric: true,
      cell: (line) => (line.paid === null ? 'Not paid' : <DateText value={line.paid} />),
    },
    {
      id: 'days',
      header: 'Late days',
      minWidth: 170,
      cell: (line) => (
        <span className="bidi-isolate whitespace-nowrap tabular-nums">
          <DateText value={line.from} />–<DateText value={line.to} />
          <span className="text-secondary">{` · ${format.number(line.days)}`}</span>
        </span>
      ),
    },
    {
      id: 'rate',
      header: 'Rate',
      align: 'end',
      numeric: true,
      cell: (line) => format.percent(line.rate, { decimals: 2 }),
    },
    {
      id: 'base',
      header: 'Amount late',
      align: 'end',
      numeric: true,
      cell: (line) => <MoneyText value={line.base} currency="RSD" />,
    },
    {
      id: 'interest',
      header: 'Interest',
      align: 'end',
      numeric: true,
      cell: (line) => <MoneyText value={line.interest} currency="RSD" />,
    },
  ]
}

function InterestTable({ phone, label }: { phone: boolean; label: string }) {
  const { format } = useLiro()
  const columns = useInterestColumns()
  return (
    <DataTable
      inCard
      label={label}
      layout={phone ? 'cards' : 'table'}
      columns={columns}
      rows={LINES}
      getRowId={(line) => line.id}
      getRowLabel={(line) => `${line.document}, ${format.date(line.from)}–${format.date(line.to)}`}
      totalsLabel="Total interest"
      totals={{ interest: <MoneyText value={TOTALS.interest} currency="RSD" /> }}
      mobile={{
        title: (line) => line.document,
        subtitle: (line) => (
          <span className="bidi-isolate tabular-nums">
            <DateText value={line.from} />–<DateText value={line.to} />
            {` · ${format.number(line.days)} days`}
          </span>
        ),
        details: ['due', 'paid', 'rate', 'base', 'interest'],
      }}
    />
  )
}

function useRateColumns(): DataTableColumn<InterestRate>[] {
  const { format } = useLiro()
  return [
    {
      id: 'period',
      header: 'Period',
      minWidth: 200,
      cell: (rate) => (
        <span className="bidi-isolate whitespace-nowrap tabular-nums">
          <DateText value={rate.from} />–
          {rate.to === null ? 'in force' : <DateText value={rate.to} />}
        </span>
      ),
    },
    {
      id: 'reference',
      header: 'Reference rate',
      align: 'end',
      numeric: true,
      cell: (rate) => format.percent(rate.reference, { decimals: 2 }),
    },
    {
      id: 'margin',
      header: 'Points added',
      align: 'end',
      numeric: true,
      cell: (rate) => <NumberText value={rate.margin} decimals={2} />,
    },
    {
      id: 'rate',
      header: 'Default interest, a year',
      align: 'end',
      numeric: true,
      cell: (rate) => format.percent(rate.rate, { decimals: 2 }),
    },
  ]
}

// ── The calculation ───────────────────────────────────────────────────────────────────────────

export function InterestCalculation({
  phone,
  asking = false,
}: {
  phone: boolean
  asking?: boolean
}) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const rateColumns = useRateColumns()
  const [confirming, setConfirming] = useState(asking)
  const issue = (
    <Button
      family="document"
      icon={FileText}
      emphasis="primary"
      label="Issue interest note"
      onClick={() => {
        setConfirming(true)
      }}
    />
  )
  return (
    <LedgerShell
      phone={phone}
      tab="interest"
      crumbs={[{ label: 'Accounting' }, { label: 'Late-payment interest' }]}
      {...(phone ? { bottomBar: issue } : {})}
    >
      <ReportPage
        layout={phone ? 'phone' : 'desktop'}
        title="Late-payment interest"
        subtitle={`${PARTNER.name} · 01.01.–14.10.2026. · illustrative statutory default interest`}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            {phone ? null : issue}
          </>
        }
        parametersOpen={false}
        parameters={
          <>
            <SelectField
              label="Partner"
              options={PARTNERS}
              defaultValue="stanogradnja"
              {...(phone ? {} : { className: 'w-64' })}
            />
            <SelectField
              label="Period"
              options={[{ value: 'ytd', label: '01.01.–14.10.2026.' }]}
              defaultValue="ytd"
              {...(phone ? {} : { className: 'w-48' })}
            />
            <SelectField
              label="Rates"
              options={[{ value: 'statutory', label: 'Illustrative statutory default interest' }]}
              defaultValue="statutory"
              {...(phone ? {} : { className: 'w-72' })}
            />
          </>
        }
        summary={[
          { key: 'partner', label: 'Partner', value: PARTNER.name },
          { key: 'period', label: 'Period', value: '01.01.–14.10.2026.' },
          { key: 'rates', label: 'Rates', value: 'Illustrative statutory default interest' },
        ]}
        onRun={() => undefined}
      >
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            {
              key: 'interest',
              label: 'Interest',
              value: <MoneyText value={TOTALS.interest} currency="RSD" />,
            },
            { key: 'invoices', label: 'Invoices paid late', value: format.number(TOTALS.invoices) },
            {
              key: 'open',
              label: 'Still late today',
              value: <MoneyText value={TOTALS.open} currency="RSD" />,
              tone: 'danger',
            },
          ]}
        />
        <SectionCard flush title="Calculation" headingLevel={2}>
          <InterestTable phone={phone} label={`Late-payment interest, ${PARTNER.name}`} />
        </SectionCard>
        <SectionCard
          flush
          title="Illustrative statutory default interest rates"
          description="Invented rates: an illustrative reference rate plus eight points."
          headingLevel={2}
        >
          <DataTable
            inCard
            label="Illustrative statutory default interest rates"
            layout={phone ? 'cards' : 'table'}
            columns={rateColumns}
            rows={RATES}
            getRowId={(rate) => rate.id}
            getRowLabel={(rate) => `${format.date(rate.from)}, ${format.percent(rate.rate)}`}
            mobile={{ details: ['reference', 'margin', 'rate'] }}
          />
        </SectionCard>
      </ReportPage>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        family="document"
        actionIcon={FileText}
        title="Issue interest note"
        subject={PARTNER.name}
        message={`Interest note ${INTEREST_NOTE.number} for ${format.money(TOTALS.interest, 'RSD')}, due on ${format.date(INTEREST_NOTE.due)}, is posted to ${INTEREST_NOTE.account} and sent to the customer by e-mail.`}
        confirmLabel="Issue"
        onConfirm={() => {
          notice.success(`${INTEREST_NOTE.number} issued.`)
          navigate(AO_ROUTES.note)
        }}
      />
    </LedgerShell>
  )
}

// ── The interest note ─────────────────────────────────────────────────────────────────────────

export function InterestNote({ phone }: { phone: boolean }) {
  const pdf = <Button intent="pdf" label="PDF" />
  return (
    <LedgerShell
      phone={phone}
      tab="interest"
      crumbs={[
        { label: 'Late-payment interest', href: `#${AO_ROUTES.calculation}` },
        { label: INTEREST_NOTE.number },
      ]}
      {...(phone ? { bottomBar: pdf } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={INTEREST_NOTE.number}
        back={{ href: `#${AO_ROUTES.calculation}`, label: 'Late-payment interest' }}
        status={statusBadge('Sent')}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            {phone ? null : pdf}
          </>
        }
        counterparty={{ label: 'Customer', ...PARTNER }}
        keyFigures={[
          { label: 'Interest', value: <MoneyText value={TOTALS.interest} currency="RSD" /> },
          { label: 'Issued', value: <DateText value={INTEREST_NOTE.date} /> },
          { label: 'Due', value: <DateText value={INTEREST_NOTE.due} /> },
        ]}
        references={
          <DocumentReferences
            groups={[
              {
                key: 'calculation',
                label: 'Calculation',
                items: [
                  {
                    key: 'calc',
                    number: '01.01.–14.10.2026.',
                    href: `#${AO_ROUTES.calculation}`,
                    kind: 'Late-payment interest',
                  },
                ],
              },
            ]}
          />
        }
        linesTitle="Interest by invoice"
        lines={<InterestTable phone={phone} label={`Lines of ${INTEREST_NOTE.number}`} />}
        totals={{
          label: 'Totals',
          rows: [],
          total: {
            key: 'total',
            label: 'Interest to pay',
            value: TOTALS.interest,
            currency: 'RSD',
          },
        }}
        sections={[
          {
            key: 'terms',
            title: 'Payment',
            content: (
              <p className="bidi-content m-0 text-sm text-primary">
                Interest on late payment is not subject to VAT. Pay to account 160-0000000456789-28
                with the reference KM-2026-0007 (illustrative).
              </p>
            ),
          },
        ]}
      />
    </LedgerShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AO_ROUTES: ExampleRoute[] = [
  { path: AO_ROUTES.calculation, render: (phone) => <InterestCalculation phone={phone} /> },
  {
    path: AO_ROUTES.calculationIssue,
    render: (phone) => <InterestCalculation phone={phone} asking />,
  },
  { path: AO_ROUTES.note, render: (phone) => <InterestNote phone={phone} /> },
]

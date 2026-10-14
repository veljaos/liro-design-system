import { Receipt } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Dialog,
  KeyValueList,
  MoneyText,
  PageHeader,
  ReceiptPreview,
  ReceiptResult,
  SectionCard,
  StatusBadge,
  Toaster,
  useLiro,
  type ReceiptDelivery,
  type ShellCompany,
} from '@veljaos/ui'
import { decimal } from '../../../../packages/ui/src/components/amounts-story-data'
import { FISCAL_BANNER, FISCAL_END } from '../../../../packages/ui/src/components/sale-story-data'
import { QrCode } from '../../../../packages/ui/src/components/qr-code'
import { Shell, type ExampleAccount } from './example-shell'
import { BAKERY, computeSale, RECEIPT_FOOTER } from './data-I'
import {
  FISCAL,
  kindLine,
  RECEIPT_HEADER,
  receiptParts,
  SHOP_ACCOUNT,
  TILL_ROUTES,
  WEB_ORDER,
} from './data-I-fiscal'
import { Frame } from './screens-G'

/*
 * An online sale (P5.28 item 21i): Pekara Zlatni klas's web-shop order WEB-1042, paid by card
 * online; the shop's application issued its fiscal receipt when the payment was approved and
 * e-mailed it with the order's confirmation — the link and the code on the order's page, the
 * receipt as printed in a dialog. A back-office page (AppShell); invented numbers.
 */

const BAKERY_COMPANY: ShellCompany = {
  id: 'zlatni-klas',
  name: BAKERY.name,
  description: BAKERY.address,
}

const ACCOUNT: ExampleAccount = {
  name: SHOP_ACCOUNT.name,
  email: SHOP_ACCOUNT.email,
  companies: [BAKERY_COMPANY],
  links: [{ label: `Web order ${WEB_ORDER.number}`, path: TILL_ROUTES.webOrder }],
}

export function WebOrder({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [sms, setSms] = useState<Partial<ReceiptDelivery>>({})
  const sale = computeSale(WEB_ORDER.lines)
  const parts = receiptParts(sale, 'sale', () => '')
  const link = `${FISCAL.linkBase}${WEB_ORDER.receipt.number}`
  const code = (size: number) => (
    <span className="flex text-primary">
      <QrCode value={link} label="Receipt code" size={size} />
    </span>
  )
  return (
    <Shell
      phone={phone}
      account={ACCOUNT}
      company={BAKERY_COMPANY.id}
      crumbs={[{ label: 'Web shop' }, { label: `Order ${WEB_ORDER.number}` }]}
    >
      <Frame phone={phone}>
        <PageHeader
          title={`Order ${WEB_ORDER.number}`}
          status={<StatusBadge label="Paid, receipt e-mailed" tone="success" />}
          subtitle={`${WEB_ORDER.customer} · ${format.date(WEB_ORDER.placed)} ${WEB_ORDER.placedTime}`}
        />
        <div className={phone ? 'flex flex-col gap-4' : 'grid grid-cols-2 items-start gap-6'}>
          <SectionCard title="Order" headingLevel={2}>
            <KeyValueList
              columns={1}
              items={[
                { label: 'Customer', value: WEB_ORDER.customer },
                { label: 'E-mail', value: <bdi dir="ltr">{WEB_ORDER.email}</bdi> },
                { label: 'Pick-up', value: WEB_ORDER.pickup },
                ...sale.lines.map(({ line, product, total }) => ({
                  label: `${line.quantity} × ${product.name}`,
                  value: <MoneyText value={decimal(total)} currency={BAKERY.currency} />,
                  numeric: true,
                })),
                {
                  label: 'Total',
                  value: <MoneyText value={decimal(sale.total)} currency={BAKERY.currency} />,
                  numeric: true,
                },
                { label: 'Payment', value: WEB_ORDER.payment.detail },
              ]}
            />
          </SectionCard>
          <SectionCard
            title="Fiscal receipt"
            headingLevel={2}
            actions={
              <Button
                family="document"
                icon={Receipt}
                label="Show receipt"
                onClick={() => {
                  setReceiptOpen(true)
                }}
              />
            }
          >
            <ReceiptResult
              headingLevel={3}
              title="Issued and e-mailed"
              text="Issued when the online payment was approved; sent with the order’s confirmation."
              facts={[
                {
                  id: 'number',
                  label: 'Processor receipt number',
                  value: WEB_ORDER.receipt.number,
                },
                { id: 'time', label: 'Processor time', value: WEB_ORDER.receipt.time },
                { id: 'counter', label: 'Receipt counter', value: WEB_ORDER.receipt.counter },
              ]}
              code={code(112)}
              link={{ href: link, label: `example.com/receipts/${WEB_ORDER.receipt.number}` }}
              deliveries={[
                {
                  id: 'email',
                  label: 'Send by e-mail again',
                  address: {
                    label: 'Customer’s e-mail',
                    type: 'email',
                    defaultValue: WEB_ORDER.email,
                  },
                  state: 'sent',
                  stateText: `Sent to ${WEB_ORDER.email} at 08:15`,
                },
                {
                  id: 'sms',
                  label: 'Send a link by SMS',
                  address: { label: 'Customer’s mobile number', type: 'tel' },
                  ...sms,
                },
              ]}
              onDeliver={(id, address) => {
                if (id !== 'sms') return
                setSms(
                  address === null || address === ''
                    ? { state: 'failed', stateText: 'Enter the mobile number.' }
                    : { state: 'sent', stateText: `Link sent to ${address}` },
                )
              }}
            />
          </SectionCard>
        </div>
        <Dialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          title={`Receipt ${WEB_ORDER.receipt.number}`}
        >
          <ReceiptPreview
            className="mx-auto"
            label={`Receipt ${WEB_ORDER.receipt.number}`}
            banner={FISCAL_BANNER}
            end={FISCAL_END}
            header={RECEIPT_HEADER.slice(0, 3)}
            facts={[
              { id: 'channel', label: 'Sold', value: 'Online, web shop' },
              { id: 'order', label: 'Order', value: WEB_ORDER.number },
            ]}
            kindLine={kindLine('normal', 'sale')}
            items={parts.items}
            totals={parts.totals}
            payments={[{ id: 'card', label: 'Card', value: WEB_ORDER.payment.value }]}
            recap={parts.recap}
            issuedFacts={[
              { id: 'time', label: 'Processor time', value: WEB_ORDER.receipt.time },
              { id: 'number', label: 'Processor receipt number', value: WEB_ORDER.receipt.number },
              { id: 'counter', label: 'Receipt counter', value: WEB_ORDER.receipt.counter },
            ]}
            code={code(128)}
            footer={RECEIPT_FOOTER}
            currency={BAKERY.currency}
          />
        </Dialog>
      </Frame>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

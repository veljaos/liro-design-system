import { Download, Printer } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  CheckboxField,
  FormGrid,
  ipsQrText,
  MoneyField,
  notice,
  PageHeader,
  PaymentOrderForm,
  PrintPage,
  QrCode,
  RadioGroupField,
  SectionCard,
  SelectField,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  type ModuleTab,
} from '@veljaos/ui'
import {
  orderFormProps,
  orderPayment,
} from '../../../../packages/ui/src/templates/payment-order-story-data'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import {
  AD_ROUTES,
  MODELS,
  orderProblems,
  PAYMENT,
  paymentCodes,
  TRANSFER,
  TRANSFER_WITH_PROBLEMS,
  WITHDRAWAL,
  type OrderData,
  type OrderField,
  type OrderKind,
} from './data-AD'

/*
 * Group AD (P5.40): Kvadrat Gradnja's payment orders — the Serbian payment order (form 1),
 * withdrawal order (form 2) and transfer order (form 3) filled in and printed as their real forms
 * (PaymentOrderForm in PrintPage), with the IPS QR code on forms 1 and 3 (`ipsQrText`, QrCode).
 * The fields at the start, the order as it will print at the end (under them on a phone); the
 * application's checks stand under their fields once the user prints or downloads, the first
 * problem focused. Print and Download are the application's (a toast reports the download).
 */

const BANKING_TABS: ModuleTab[] = [
  { key: 'statements', label: 'Statements', href: '#/banking/statements' },
  { key: 'payments', label: 'Payments', href: '#/banking/payments' },
  { key: 'orders', label: 'Payment orders', href: '#/banking/payment-orders', current: true },
  { key: 'accounts', label: 'Bank accounts', href: '#/banking/accounts' },
]

const KINDS: { value: OrderKind; label: string; description: string }[] = [
  { value: 'payment', label: 'Payment order', description: 'Form 1 · nalog za uplatu' },
  { value: 'withdrawal', label: 'Withdrawal order', description: 'Form 2 · nalog za isplatu' },
  { value: 'transfer', label: 'Transfer order', description: 'Form 3 · nalog za prenos' },
]

const START: Record<OrderKind, OrderData> = {
  payment: PAYMENT,
  withdrawal: WITHDRAWAL,
  transfer: TRANSFER,
}

/** The words of each field, as the checks name them. */
function fieldLabels(kind: OrderKind): Record<OrderField, string> {
  return {
    payer:
      kind === 'payment' ? 'Payer' : kind === 'withdrawal' ? 'Account holder' : 'Debtor (payer)',
    purpose: 'Purpose of payment',
    payee: kind === 'transfer' ? 'Creditor (payee)' : 'Payee',
    paymentCode: 'Payment code',
    amount: 'Amount',
    payerAccount: kind === 'withdrawal' ? 'Account to withdraw from' : 'Debtor’s account',
    payerReference: 'Reference number (debit)',
    payeeAccount: kind === 'transfer' ? 'Creditor’s account' : 'Payee’s account',
    payeeReference: 'Reference number (credit)',
  }
}

const TITLES: Record<OrderKind, string> = {
  payment: 'Payment order',
  withdrawal: 'Withdrawal order',
  transfer: 'Transfer order',
}

function PaymentOrders({
  phone,
  start,
  checked: initiallyChecked = false,
}: {
  phone: boolean
  start: OrderData
  checked?: boolean
}) {
  const { messages } = useLiro()
  const [order, setOrder] = useState<OrderData>(start)
  const [checked, setChecked] = useState(initiallyChecked)
  const labels = fieldLabels(order.kind)
  const problems = orderProblems(order)
  const errorOf = (field: OrderField) => {
    if (!checked) return {}
    const problem = problems.find((each) => each.field === field)
    return problem === undefined
      ? {}
      : { error: messages['ips.problem'](problem.code, labels[field], problem.limit) }
  }
  const change = (patch: Partial<OrderData>) => {
    setOrder((current) => ({ ...current, ...patch }))
  }
  const payment = orderPayment(order)
  const ips = payment === null ? null : ipsQrText(payment)
  const qrText = ips?.text ?? null
  const form = orderFormProps(
    order,
    qrText === null ? undefined : (
      <QrCode value={qrText} label="IPS QR code for the payment" size="fill" />
    ),
  )
  const title = TITLES[order.kind]

  /** Prints or downloads once the checks pass; otherwise shows them and focuses the first. */
  const finish = (action: 'print' | 'download') => {
    setChecked(true)
    if (problems.length > 0) {
      const first = problems[0]
      if (first !== undefined) {
        requestAnimationFrame(() => {
          document.getElementById(`order-${first.field}`)?.focus()
        })
      }
      return
    }
    if (action === 'print') window.print()
    else notice.success(`${title} downloaded as PDF.`)
  }

  const actions = (
    <div className="flex flex-wrap gap-2 [&>*]:max-sm:flex-1">
      <Button
        family="neutral"
        icon={Download}
        label="Download PDF"
        onClick={() => {
          finish('download')
        }}
      />
      <Button
        family="primary"
        icon={Printer}
        label="Print"
        onClick={() => {
          finish('print')
        }}
      />
    </div>
  )

  const fields = (
    <div className="flex flex-col gap-4">
      <SectionCard title="Order">
        <RadioGroupField
          label="Form"
          value={order.kind}
          options={KINDS}
          onChange={(value) => {
            const kind = value as OrderKind
            setOrder(START[kind])
            setChecked(false)
          }}
        />
      </SectionCard>
      <SectionCard title="Parties">
        <FormGrid columns={1}>
          <TextAreaField
            id="order-payer"
            label={labels.payer}
            rows={2}
            value={order.payer}
            onChange={(payer) => {
              change({ payer })
            }}
            description="Name and address, up to three lines."
            {...errorOf('payer')}
          />
          <TextField
            id="order-purpose"
            label={labels.purpose}
            value={order.purpose}
            onChange={(purpose) => {
              change({ purpose })
            }}
            description="Up to 35 characters."
            {...errorOf('purpose')}
          />
          <TextAreaField
            id="order-payee"
            label={labels.payee}
            rows={2}
            value={order.payee}
            onChange={(payee) => {
              change({ payee })
            }}
            {...errorOf('payee')}
          />
        </FormGrid>
      </SectionCard>
      <SectionCard title="Payment">
        <FormGrid columns={2}>
          <SelectField
            id="order-paymentCode"
            label={labels.paymentCode}
            value={order.paymentCode}
            options={paymentCodes(order.kind)}
            onChange={(paymentCode) => {
              change({ paymentCode })
            }}
            {...errorOf('paymentCode')}
          />
          <MoneyField
            id="order-amount"
            label={labels.amount}
            currency={order.currency === '' ? 'RSD' : order.currency}
            value={order.amount === '' ? null : order.amount}
            onChange={(amount) => {
              change({ amount: amount ?? '' })
            }}
            {...errorOf('amount')}
          />
          {order.kind !== 'payment' && (
            <>
              <TextField
                id="order-payerAccount"
                label={labels.payerAccount}
                direction="ltr"
                value={order.payerAccount ?? ''}
                onChange={(payerAccount) => {
                  change({ payerAccount })
                }}
                description="18 digits, or 160-123456-54."
                {...errorOf('payerAccount')}
              />
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2">
                <SelectField
                  label="Model"
                  value={order.payerModel ?? ''}
                  options={MODELS}
                  onChange={(payerModel) => {
                    change({ payerModel })
                  }}
                />
                <TextField
                  id="order-payerReference"
                  label={labels.payerReference}
                  direction="ltr"
                  value={order.payerReference ?? ''}
                  onChange={(payerReference) => {
                    change({ payerReference })
                  }}
                  {...errorOf('payerReference')}
                />
              </div>
            </>
          )}
          {order.kind !== 'withdrawal' && (
            <>
              <TextField
                id="order-payeeAccount"
                label={labels.payeeAccount}
                direction="ltr"
                value={order.payeeAccount ?? ''}
                onChange={(payeeAccount) => {
                  change({ payeeAccount })
                }}
                description="18 digits, or 160-123456-54."
                {...errorOf('payeeAccount')}
              />
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2">
                <SelectField
                  label="Model"
                  value={order.payeeModel ?? ''}
                  options={MODELS}
                  onChange={(payeeModel) => {
                    change({ payeeModel })
                  }}
                />
                <TextField
                  id="order-payeeReference"
                  label={labels.payeeReference}
                  direction="ltr"
                  value={order.payeeReference ?? ''}
                  onChange={(payeeReference) => {
                    change({ payeeReference })
                  }}
                  {...errorOf('payeeReference')}
                />
              </div>
            </>
          )}
          {order.kind === 'transfer' && (
            <CheckboxField
              label="Urgent"
              checked={order.urgent === true}
              onChange={(urgent) => {
                change({ urgent })
              }}
            />
          )}
        </FormGrid>
      </SectionCard>
    </div>
  )

  const preview = (
    <SectionCard
      title="As it will print"
      description={
        order.kind === 'withdrawal'
          ? 'A withdrawal pays out cash: it has no IPS QR code.'
          : qrText === null
            ? 'The IPS QR code appears when the order is complete and correct.'
            : 'Scan the IPS QR code with a bank’s app to fill in the payment.'
      }
    >
      <PrintPage
        title={title}
        margins={{ top: '10mm', bottom: '10mm', start: '10mm', end: '10mm' }}
        pageNumbers={false}
        fit="width"
      >
        <PaymentOrderForm {...form} />
      </PrintPage>
      {qrText !== null && (
        <details className="mt-3 text-xs text-secondary">
          <summary className="cursor-pointer">What the QR code holds</summary>
          <code
            dir="ltr"
            className="mt-2 block rounded-md bg-surface-sunken p-3 font-mono break-all whitespace-pre-wrap text-primary"
          >
            {qrText}
          </code>
        </details>
      )}
    </SectionCard>
  )

  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Banking', href: '#/banking/statements' }, { label: 'Payment orders' }]}
      tabs={BANKING_TABS}
      {...(phone ? { bottomBar: actions } : {})}
    >
      <div className="flex flex-col gap-4">
        <PageHeader
          title={title}
          subtitle="Kvadrat Gradnja d.o.o. · printed on the bank’s form, with the IPS QR code"
          {...(phone ? {} : { actions })}
        />
        {checked && problems.length > 0 && (
          <p role="alert" dir="auto" className="m-0 text-sm text-status-danger-fg">
            {problems.length === 1
              ? 'One field needs a correction before the order can be printed.'
              : `${String(problems.length)} fields need a correction before the order can be printed.`}
          </p>
        )}
        {phone ? (
          <div className="flex flex-col gap-4">
            {fields}
            {preview}
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start gap-4">
            {fields}
            {preview}
          </div>
        )}
      </div>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

export const GROUP_AD_ROUTES: ExampleRoute[] = [
  { path: AD_ROUTES.transfer, render: (phone) => <PaymentOrders phone={phone} start={TRANSFER} /> },
  { path: AD_ROUTES.payment, render: (phone) => <PaymentOrders phone={phone} start={PAYMENT} /> },
  {
    path: AD_ROUTES.withdrawal,
    render: (phone) => <PaymentOrders phone={phone} start={WITHDRAWAL} />,
  },
  {
    path: AD_ROUTES.problems,
    render: (phone) => <PaymentOrders phone={phone} start={TRANSFER_WITH_PROBLEMS} checked />,
  },
]

import {
  ArrowRightLeft,
  CreditCard,
  Download,
  FileText,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  BackButton,
  Banner,
  Button,
  ConfirmDialog,
  DataTable,
  DateText,
  DocumentTotals,
  Drawer,
  IrreversibleConfirmDialog,
  KeyValueList,
  ListPage,
  MoneyText,
  notice,
  NumberText,
  PageHeader,
  PlanComparison,
  PrintDocument,
  RadioGroupField,
  SectionCard,
  StatusBadge,
  Toaster,
  UsageMeter,
  useLiro,
  type ComparedFeature,
  type ComparedPlan,
  type DataTableColumn,
  type ModuleTab,
  type PageBack,
  type PrintColumn,
  type PrintParty,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { useExampleState } from './example-state'
import { C_ROUTES } from './data-C'
import { Q_ROUTES } from './data-Q'
import { adminTabs } from './screens-Q'
import { Frame, Tenant } from './screens-G'
import {
  BUYER,
  CANCEL_REASONS,
  INVOICE_TONES,
  INVOICES,
  LIMITS,
  MODULES,
  PAST_DUE,
  PAYMENT_OPTIONS,
  PLAN_FEATURES,
  PLAN_ORDER,
  PLAN_UNAVAILABLE,
  PLANS,
  PRO_NEXT,
  PRORATION,
  SELLER,
  SUBSCRIPTION_STATES,
  SUBSCRIPTIONS,
  Z_ROUTES,
  Z_TODAY,
  type InvoiceStatus,
  type LiroInvoice,
  type PlanId,
  type Subscription,
  type SubscriptionState,
} from './data-Z'

/*
 * Group Z's example screens (P5.36, subscription and billing). Milica Petrović, Kvadrat Gradnja
 * d.o.o.'s administrator, looks at the company's Liro subscription in the administration: the
 * plan and its modules, users and usage (UsageMeter), the next invoice, the card on file, Liro's
 * invoices and their PDF (PrintDocument), changing the plan (PlanComparison, the proration from
 * the billing service, a confirmation) and cancelling (IrreversibleConfirmDialog with a reason);
 * a trial and a payment past due show their Banner in AppShell's `banners` slot. Every price,
 * proration, limit and state is the application's (data-Z.ts); the screens only play it.
 */

export { Z_ROUTES }

// ── Shared: the administration's shell with the subscription ──────────────────────────────────

/** The administration's module tabs and "Subscription" after them, current. */
function billingTabs(): ModuleTab[] {
  return [
    ...adminTabs('overview').map((tab) => ({ ...tab, current: false })),
    {
      key: 'subscription',
      label: 'Subscription',
      href: `#${Z_ROUTES.subscription}`,
      current: true,
    },
  ]
}

/** What the application keeps about the subscription above its screens. */
interface Kept {
  state: SubscriptionState
  plan: PlanId
}

function useKept(start: SubscriptionState = 'active') {
  return useExampleState<Kept>('Z.subscription', () => ({ state: start, plan: 'business' }))
}

/** The subscription as the billing service returns it for what is kept. */
function subscriptionOf(kept: Kept): Subscription {
  const base = SUBSCRIPTIONS[kept.state]
  if (kept.plan === 'business') return base
  return {
    ...base,
    plan: kept.plan,
    modules: MODULES.map(({ id, name }) => ({ id, name })),
    next: PRO_NEXT,
    // Pro's limits; its own allowances are not near them, so no state.
    usage: base.usage.map((line) => ({
      id: line.id,
      label: line.label,
      used: line.used,
      limit: LIMITS[kept.plan][line.id] ?? null,
      ...(line.unit === undefined ? {} : { unit: line.unit }),
      ...(line.note === undefined ? {} : { note: line.note }),
    })),
  }
}

/** The application-wide banner of a trial, a payment past due or a cancellation. */
function SubscriptionBanner({
  kept,
  onPayment,
  onResume,
}: {
  kept: Kept
  onPayment: () => void
  onResume: () => void
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  if (kept.state === 'trial') {
    const ends = SUBSCRIPTIONS.trial.trialEnds ?? Z_TODAY
    return (
      <Banner
        tone="info"
        role="status"
        title="Your trial ends in 9 days"
        actions={
          <Button
            family="neutral"
            icon={CreditCard}
            label="Add a payment method"
            onClick={onPayment}
          />
        }
      >
        {`The Business trial ends on ${format.date(ends)}. Add a payment method to keep your data and settings.`}
      </Banner>
    )
  }
  if (kept.state === 'pastDue') {
    return (
      <Banner
        tone="danger"
        role="status"
        title="Payment past due"
        actions={
          <>
            <Button
              family="neutral"
              icon={FileText}
              label="View invoice"
              onClick={() => {
                navigate(Z_ROUTES.invoice(PAST_DUE.invoice))
              }}
            />
            <Button
              family="neutral"
              icon={CreditCard}
              label="Update payment method"
              onClick={onPayment}
            />
          </>
        }
      >
        {`The card was declined for invoice ${PAST_DUE.invoice} (${format.money(PAST_DUE.amount, 'RSD')}). Update the payment method by ${format.date(PAST_DUE.readOnlyFrom)}, or Liro becomes read-only.`}
      </Banner>
    )
  }
  if (kept.state === 'cancelled') {
    return (
      <Banner
        tone="warning"
        role="status"
        title="Your subscription is cancelled"
        actions={
          <Button
            family="neutral"
            icon={RotateCcw}
            label="Keep the subscription"
            onClick={onResume}
          />
        }
      >
        {`It ends on ${format.date(SUBSCRIPTIONS.cancelled.termEnd)}. Until then everything works as now.`}
      </Banner>
    )
  }
  return null
}

/** Milica's administration with the subscription's banner on every page. */
function BillingShell({
  phone,
  crumb,
  start,
  onPayment,
  children,
}: {
  phone: boolean
  crumb?: { label: string; href?: string }
  start?: SubscriptionState
  onPayment?: () => void
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const [kept, setKept] = useKept(start)
  // A banner only while a state needs one: AppShell draws the slot for any element it is given.
  const banner =
    kept.state === 'active' ? undefined : (
      <SubscriptionBanner
        kept={kept}
        onPayment={
          onPayment ??
          (() => {
            navigate(Z_ROUTES.payment)
          })
        }
        onResume={() => {
          setKept((current) => ({ ...current, state: 'active' }))
          notice.success('Your subscription continues.')
        }}
      />
    )
  return (
    <Tenant today={Z_TODAY}>
      <Shell
        phone={phone}
        crumbs={[
          { label: 'Administration', href: `#${Q_ROUTES.adminOverview}` },
          crumb === undefined
            ? { label: 'Subscription' }
            : { label: 'Subscription', href: `#${Z_ROUTES.subscription}` },
          ...(crumb === undefined ? [] : [crumb]),
        ]}
        tabs={billingTabs()}
        {...(banner === undefined ? {} : { banners: banner })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function invoiceStatus(invoice: LiroInvoice, kept: Kept): InvoiceStatus {
  return kept.state === 'pastDue' && invoice.number === PAST_DUE.invoice
    ? 'Overdue'
    : invoice.status
}

function useInvoiceColumns(kept: Kept): DataTableColumn<LiroInvoice>[] {
  return [
    {
      id: 'number',
      header: 'Invoice',
      cell: (invoice) => <span className="bidi-isolate font-medium">{invoice.number}</span>,
    },
    { id: 'period', header: 'Period', cell: (invoice) => invoice.periodText },
    { id: 'issued', header: 'Issued', cell: (invoice) => <DateText value={invoice.issued} /> },
    {
      id: 'total',
      header: 'Amount',
      align: 'end',
      numeric: true,
      cell: (invoice) => <MoneyText value={invoice.total} currency="RSD" />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (invoice) => {
        const status = invoiceStatus(invoice, kept)
        return <StatusBadge label={status} tone={INVOICE_TONES[status]} />
      },
    },
  ]
}

// ── 1. The subscription ───────────────────────────────────────────────────────────────────────

interface SubscriptionStart {
  state?: SubscriptionState
  paymentOpen?: boolean
  cancelOpen?: boolean
}

/** "Change" on the payment method (D14: a short edit, a Drawer). */
function PaymentDrawer({
  open,
  onOpenChange,
  current,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: string | null
}) {
  const [choice, setChoice] = useState(current ?? 'new-card')
  const newCard = choice === 'new-card'
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      title="Change payment method"
      subject={BUYER.name}
      description="Liro’s invoices are paid this way from the next one on."
      actions={
        <>
          <Button
            intent="cancel"
            label="Cancel"
            onClick={() => {
              onOpenChange(false)
            }}
          />
          <Button
            family="primary"
            icon={CreditCard}
            label={newCard ? 'Continue to the payment provider' : 'Save'}
            onClick={() => {
              notice.success(
                newCard
                  ? 'The payment provider’s page opens in a new tab.'
                  : 'The payment method is saved.',
              )
              onOpenChange(false)
            }}
          />
        </>
      }
    >
      <RadioGroupField
        label="Pay with"
        options={PAYMENT_OPTIONS.filter((option) => current !== null || option.value !== 'card')}
        value={choice}
        onChange={setChoice}
      />
    </Drawer>
  )
}

export function SubscriptionScreen({
  phone,
  start = {},
}: {
  phone: boolean
  start?: SubscriptionStart
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [kept, setKept] = useKept(start.state)
  const [paying, setPaying] = useState(start.paymentOpen === true)
  const [cancelling, setCancelling] = useState(start.cancelOpen === true)
  const subscription = subscriptionOf(kept)
  const plan = PLANS[subscription.plan]
  const state = SUBSCRIPTION_STATES[kept.state]
  const columns = useInvoiceColumns(kept)
  const trial = kept.state === 'trial'
  const usersLimit = LIMITS[subscription.plan].users ?? ''
  return (
    <BillingShell
      phone={phone}
      {...(start.state === undefined ? {} : { start: start.state })}
      onPayment={() => {
        setPaying(true)
      }}
    >
      <Frame phone={phone}>
        <PageHeader
          title="Subscription"
          status={<StatusBadge label={state.label} tone={state.tone} />}
          subtitle={BUYER.name}
          actions={
            <Button
              family="primary"
              icon={ArrowRightLeft}
              label="Change plan"
              onClick={() => {
                navigate(Z_ROUTES.changePlan)
              }}
            />
          }
        />
        <div
          className={
            phone ? 'flex flex-col gap-4' : 'grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6'
          }
        >
          <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
            <SectionCard title="Plan" headingLevel={2}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="bidi-content m-0 text-h3 font-semibold text-primary">{plan.name}</p>
                  <p className="bidi-content m-0 text-sm text-secondary">
                    {`${format.money(plan.price, 'RSD')} a month, without VAT · ${plan.description}`}
                  </p>
                </div>
                <KeyValueList
                  items={[
                    {
                      key: 'term',
                      label: trial ? 'Trial' : 'Term',
                      value: (
                        <span className="bidi-isolate">
                          <DateText value={subscription.termStart} />
                          {' – '}
                          <DateText value={subscription.termEnd} />
                        </span>
                      ),
                      numeric: true,
                    },
                    {
                      key: 'renews',
                      label:
                        kept.state === 'cancelled' ? 'Ends' : trial ? 'Billing starts' : 'Renews',
                      value: (
                        <DateText
                          value={
                            kept.state === 'cancelled' ? subscription.termEnd : subscription.renews
                          }
                        />
                      ),
                      numeric: true,
                    },
                    { key: 'billing', label: 'Billing', value: 'Monthly, on the 1st' },
                  ]}
                />
                <div className="flex flex-col gap-2">
                  <h3 className="bidi-content m-0 text-sm font-semibold text-primary">Modules</h3>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {subscription.modules.map((module) => (
                      <li
                        key={module.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm"
                      >
                        <span className="bidi-content text-primary">{module.name}</span>
                        <span className="bidi-isolate text-secondary">
                          {module.addOn === undefined
                            ? `Included in ${plan.name}`
                            : `Add-on, ${format.money(module.addOn, 'RSD')} a month`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {kept.state !== 'cancelled' && !trial && (
                  <div>
                    <Button
                      family="destructive"
                      emphasis="secondary"
                      icon={XCircle}
                      label="Cancel subscription"
                      onClick={() => {
                        setCancelling(true)
                      }}
                    />
                  </div>
                )}
              </div>
            </SectionCard>
            <SectionCard
              title="Users and usage"
              headingLevel={2}
              actions={
                <Button
                  family="neutral"
                  emphasis="secondary"
                  icon={Users}
                  label="Manage users"
                  onClick={() => {
                    navigate(C_ROUTES.users)
                  }}
                />
              }
            >
              <div className={phone ? 'flex flex-col gap-5' : 'grid grid-cols-2 gap-x-8 gap-y-5'}>
                {subscription.usage.map((line) => (
                  <UsageMeter
                    key={line.id}
                    label={line.label}
                    used={line.used}
                    limit={line.limit}
                    {...(line.unit === undefined ? {} : { unit: line.unit })}
                    {...(line.state === undefined ? {} : { state: line.state })}
                    {...(line.id === 'users'
                      ? {
                          note: `Included in ${plan.name}: ${format.number(usersLimit)} users.`,
                        }
                      : line.note === undefined
                        ? {}
                        : { note: line.note })}
                  />
                ))}
              </div>
            </SectionCard>
          </div>
          <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
            <SectionCard title="Next invoice" headingLevel={2}>
              <div className="flex flex-col gap-3">
                <p className="bidi-content m-0 text-sm text-secondary">
                  {trial
                    ? `The first invoice is issued on ${format.date(subscription.next.date)}, when the trial ends.`
                    : subscription.payment === null
                      ? `Issued on ${format.date(subscription.next.date)}.`
                      : `Issued on ${format.date(subscription.next.date)} and charged to ${subscription.payment.label}.`}
                </p>
                <DocumentTotals
                  label="Next invoice"
                  className="w-full max-w-none"
                  rows={[
                    ...subscription.next.rows.map((row) => ({ ...row, currency: 'RSD' })),
                    {
                      key: 'subtotal',
                      label: 'Without VAT',
                      value: subscription.next.subtotal,
                      currency: 'RSD',
                      group: true,
                    },
                    { key: 'vat', label: 'VAT 20%', value: subscription.next.vat, currency: 'RSD' },
                  ]}
                  total={{
                    key: 'total',
                    label: 'Total',
                    value: subscription.next.total,
                    currency: 'RSD',
                  }}
                />
              </div>
            </SectionCard>
            <SectionCard
              title="Payment method"
              headingLevel={2}
              actions={
                <Button
                  family="neutral"
                  emphasis="secondary"
                  icon={CreditCard}
                  label={subscription.payment === null ? 'Add' : 'Change'}
                  onClick={() => {
                    setPaying(true)
                  }}
                />
              }
            >
              {subscription.payment === null ? (
                <p className="bidi-content m-0 text-sm text-secondary">No payment method yet.</p>
              ) : (
                <div className="flex items-start gap-3">
                  <CreditCard
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-secondary"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="bidi-content text-sm font-medium text-primary">
                      {subscription.payment.label}
                    </span>
                    <span
                      className={`bidi-content text-xs ${kept.state === 'pastDue' ? 'text-status-danger-fg' : 'text-secondary'}`}
                    >
                      {subscription.payment.detail}
                    </span>
                  </div>
                </div>
              )}
            </SectionCard>
            {!trial && (
              <SectionCard
                title="Invoices"
                headingLevel={2}
                flush
                actions={
                  <Button
                    family="neutral"
                    emphasis="secondary"
                    icon={FileText}
                    label="All invoices"
                    onClick={() => {
                      navigate(Z_ROUTES.invoices)
                    }}
                  />
                }
              >
                <DataTable
                  label="Latest invoices"
                  layout="cards"
                  columns={columns}
                  rows={INVOICES.slice(0, 3)}
                  getRowId={(invoice) => invoice.number}
                  getRowLabel={(invoice) => `${invoice.number} ${invoice.periodText}`}
                  onRowClick={(invoice) => {
                    navigate(Z_ROUTES.invoice(invoice.number))
                  }}
                  mobile={{
                    title: (invoice) => invoice.periodText,
                    subtitle: (invoice) => <span className="bidi-isolate">{invoice.number}</span>,
                    badge: (invoice) => {
                      const status = invoiceStatus(invoice, kept)
                      return <StatusBadge label={status} tone={INVOICE_TONES[status]} />
                    },
                    details: ['total'],
                  }}
                />
              </SectionCard>
            )}
          </div>
        </div>
      </Frame>
      <PaymentDrawer
        open={paying}
        onOpenChange={setPaying}
        current={subscription.payment === null ? null : 'card'}
      />
      <IrreversibleConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        family="destructive"
        actionIcon={XCircle}
        title="Cancel subscription"
        subject={`${BUYER.name} · ${plan.name}`}
        message={`The subscription ends on ${format.date(subscription.termEnd)}, at the end of the term; until then everything works and is invoiced as now. Then Liro is read-only for 90 days, so you can export your data, and the data is deleted after that. Invoices already paid are not refunded.`}
        confirmText={BUYER.name}
        confirmLabel="Cancel subscription"
        cancelLabel="Keep subscription"
        reason={{ reasons: CANCEL_REASONS, label: 'Why are you leaving?' }}
        onConfirm={() => {
          setKept((current) => ({ ...current, state: 'cancelled' }))
          notice.success(`The subscription ends on ${format.date(subscription.termEnd)}.`)
        }}
      />
    </BillingShell>
  )
}

// ── 2. Liro's invoices ────────────────────────────────────────────────────────────────────────

export function SubscriptionInvoices({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [kept] = useKept()
  const columns = useInvoiceColumns(kept)
  return (
    <BillingShell phone={phone} crumb={{ label: 'Invoices' }}>
      <ListPage layout={phone ? 'phone' : 'desktop'} title="Invoices">
        <DataTable
          label="Liro’s invoices"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={INVOICES}
          getRowId={(invoice) => invoice.number}
          getRowLabel={(invoice) => `${invoice.number} ${invoice.periodText}`}
          count={INVOICES.length}
          onRowClick={(invoice) => {
            navigate(Z_ROUTES.invoice(invoice.number))
          }}
          rowActions={(invoice) => [
            {
              label: 'Download PDF',
              icon: Download,
              onSelect: () => {
                notice.success(`${invoice.number}.pdf is downloading.`)
              },
            },
          ]}
          mobile={{
            title: (invoice) => invoice.periodText,
            subtitle: (invoice) => <span className="bidi-isolate">{invoice.number}</span>,
            badge: (invoice) => {
              const status = invoiceStatus(invoice, kept)
              return <StatusBadge label={status} tone={INVOICE_TONES[status]} />
            },
            details: ['issued', 'total'],
          }}
        />
      </ListPage>
    </BillingShell>
  )
}

// ── 3. An invoice's PDF ───────────────────────────────────────────────────────────────────────

/** The print preview's frame: back, the title, Print (as the printouts of group J). */
function PrintPreview({
  title,
  back,
  children,
}: {
  title: string
  back: PageBack
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
      <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2 print:hidden">
        <BackButton back={back} />
        <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
          {title}
        </p>
        <Button
          family="neutral"
          icon={Download}
          label="Download PDF"
          onClick={() => {
            notice.success(`${title}.pdf is downloading.`)
          }}
        />
        <Button
          intent="print"
          label="Print"
          onClick={() => {
            window.print()
          }}
        />
      </header>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      <Toaster />
    </div>
  )
}

/** Liro's wordmark as the issuer's logo (D18: the application passes it). */
function LiroLogo() {
  return (
    <svg role="img" aria-label="Liro" viewBox="0 0 96 32" className="block h-8 w-auto text-logo">
      <text
        x="0"
        y="24"
        fontSize="24"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--liro-font-brand)"
      >
        Liro
      </text>
    </svg>
  )
}

const LINE_COLUMNS: PrintColumn<LiroInvoice['lines'][number]>[] = [
  { key: 'item', header: 'Item', cell: (line) => line.item },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'end',
    width: '20mm',
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { key: 'unit', header: 'Unit', width: '16mm', cell: (line) => line.unit },
  {
    key: 'price',
    header: 'Price',
    align: 'end',
    width: '28mm',
    cell: (line) => <MoneyText value={line.price} currency="RSD" />,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    width: '30mm',
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

export function SubscriptionInvoicePdf({ number }: { number: string }) {
  const { format } = useLiro()
  const [kept] = useKept()
  const invoice = INVOICES.find((each) => each.number === number) ?? INVOICES[0]
  if (invoice === undefined) throw new Error('No invoice')
  const overdue = invoiceStatus(invoice, kept) === 'Overdue'
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
    name: BUYER.name,
    lines: [BUYER.address],
    details: [
      { key: 'pib', label: 'PIB', value: BUYER.taxId, numeric: true },
      { key: 'email', label: 'E-mail', value: BUYER.email },
    ],
  }
  return (
    <Tenant today={Z_TODAY}>
      <PrintPreview
        title={`Invoice ${invoice.number}`}
        back={{ href: `#${Z_ROUTES.invoices}`, label: 'Invoices' }}
      >
        <PrintDocument
          title="Invoice"
          number={invoice.number}
          logo={<LiroLogo />}
          footer={`${SELLER.name} · Invoice ${invoice.number} · Illustrative`}
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
            { key: 'period', label: 'Period', value: invoice.periodText },
            {
              key: 'due',
              label: 'Due date',
              value: <DateText value={invoice.issued} />,
              numeric: true,
            },
          ]}
          parties={[seller, buyer]}
          {...(overdue
            ? { amountDue: { value: invoice.total, currency: 'RSD', date: PAST_DUE.readOnlyFrom } }
            : {})}
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
                value: <bdi>{`97 ${invoice.number.replace(/\D/g, '')}`}</bdi>,
                numeric: true,
              },
            ],
          }}
          lines={{
            caption: 'Lines',
            columns: LINE_COLUMNS,
            rows: invoice.lines,
            rowKey: (line) => line.id,
          }}
          totals={{
            label: 'Totals',
            rows: [
              { key: 'subtotal', label: 'Without VAT', value: invoice.subtotal, currency: 'RSD' },
              { key: 'vat', label: 'VAT 20%', value: invoice.vat, currency: 'RSD' },
            ],
            total: { key: 'total', label: 'Total', value: invoice.total, currency: 'RSD' },
          }}
          notes={[
            overdue
              ? `The card was declined on 01.10., 04.10. and 08.10.2026. Pay by transfer with the reference number above, or update the payment method.`
              : `Paid on ${format.date(invoice.paidOn ?? invoice.issued)} with the card ending in 4242. Thank you.`,
            'Liro Software d.o.o. and its numbers are illustrative.',
          ]}
        />
      </PrintPreview>
    </Tenant>
  )
}

// ── 4. Change plan ────────────────────────────────────────────────────────────────────────────

interface ChangeStart {
  plan?: PlanId
  confirmOpen?: boolean
}

function useComparedPlans(): ComparedPlan[] {
  const { format } = useLiro()
  return PLAN_ORDER.map((id) => {
    const plan = PLANS[id]
    const reason = PLAN_UNAVAILABLE[id]
    return {
      id,
      name: plan.name,
      price: format.money(plan.price, 'RSD'),
      priceNote: 'a month, without VAT',
      description: plan.description,
      ...(reason === undefined ? {} : { unavailableReason: reason }),
    }
  })
}

const FEATURES: ComparedFeature[] = PLAN_FEATURES.map((feature) => ({
  id: feature.id,
  label: feature.label,
  group: feature.group,
  ...(feature.description === undefined ? {} : { description: feature.description }),
  values: feature.values,
}))

export function ChangePlan({ phone, start = {} }: { phone: boolean; start?: ChangeStart }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [kept, setKept] = useKept()
  const plans = useComparedPlans()
  const [chosen, setChosen] = useState<PlanId>(start.plan ?? kept.plan)
  const [confirming, setConfirming] = useState(start.confirmOpen === true)
  const current = PLANS[kept.plan]
  const target = PLANS[chosen]
  const proration = chosen === kept.plan ? undefined : PRORATION[chosen]
  const card = SUBSCRIPTIONS[kept.state].payment?.label ?? 'the card on file'
  const totals =
    proration === undefined ? null : (
      <DocumentTotals
        label="Charged today"
        className="w-full max-w-none"
        rows={[
          ...proration.rows.map((row) => ({ ...row, currency: 'RSD' })),
          {
            key: 'subtotal',
            label: 'Without VAT',
            value: proration.subtotal,
            currency: 'RSD',
            group: true,
          },
          { key: 'vat', label: 'VAT 20%', value: proration.vat, currency: 'RSD' },
        ]}
        total={{ key: 'due', label: 'Due today', value: proration.dueToday, currency: 'RSD' }}
      />
    )
  const back = () => {
    navigate(Z_ROUTES.subscription)
  }
  return (
    <BillingShell phone={phone} crumb={{ label: 'Change plan' }}>
      <Frame phone={phone}>
        <PageHeader
          title="Change plan"
          back={{ href: `#${Z_ROUTES.subscription}`, label: 'Subscription' }}
          subtitle={`${BUYER.name} · now on ${current.name}`}
        />
        <PlanComparison
          label="Choose a plan"
          description="Prices a month, without VAT. A change applies from today; the difference for this month is charged now."
          plans={plans}
          features={FEATURES}
          current={kept.plan}
          value={chosen}
          onChange={(id) => {
            setChosen(id as PlanId)
          }}
          layout={phone ? 'phone' : 'desktop'}
        />
        <SectionCard title="What changes" headingLevel={2}>
          {proration === undefined ? (
            <p className="bidi-content m-0 text-sm text-secondary">
              {`Choose a plan other than ${current.name} to see what changes and what is charged today.`}
            </p>
          ) : (
            <div className={phone ? 'flex flex-col gap-4' : 'grid grid-cols-2 items-start gap-8'}>
              <ul className="m-0 flex list-disc flex-col gap-2 ps-5 text-sm text-primary">
                <li className="bidi-content">
                  {`${target.name} applies from today. Users included: ${format.number(target.usersIncluded)} instead of ${format.number(current.usersIncluded)}.`}
                </li>
                <li className="bidi-content">
                  Projects is included in Pro: the add-on ends today and its unused days are
                  credited.
                </li>
                <li className="bidi-content">
                  {`From ${format.date(proration.monthlyFrom)}: ${format.money(proration.monthly, 'RSD')} a month with VAT, charged to ${card}.`}
                </li>
              </ul>
              {totals}
            </div>
          )}
        </SectionCard>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button intent="cancel" label="Cancel" onClick={back} />
          <Button
            family="primary"
            icon={ArrowRightLeft}
            label={chosen === kept.plan ? 'Change plan' : `Change to ${target.name}`}
            disabled={proration === undefined}
            onClick={() => {
              setConfirming(true)
            }}
          />
        </div>
      </Frame>
      {proration !== undefined && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          family="primary"
          actionIcon={ArrowRightLeft}
          title="Change plan"
          subject={`${current.name} → ${target.name}`}
          message={`${format.money(proration.dueToday, 'RSD')} is charged today to ${card}. From ${format.date(proration.monthlyFrom)} the plan costs ${format.money(proration.monthly, 'RSD')} a month with VAT.`}
          preview={totals}
          confirmLabel={`Change to ${target.name}`}
          onConfirm={() => {
            setKept((value) => ({ ...value, plan: chosen }))
            notice.success(`Your plan is now ${target.name}.`)
            navigate(Z_ROUTES.subscription)
          }}
        />
      )}
    </BillingShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_Z_ROUTES: ExampleRoute[] = [
  { path: Z_ROUTES.subscription, render: (phone) => <SubscriptionScreen phone={phone} /> },
  {
    path: Z_ROUTES.trial,
    render: (phone) => <SubscriptionScreen phone={phone} start={{ state: 'trial' }} />,
  },
  {
    path: Z_ROUTES.pastDue,
    render: (phone) => <SubscriptionScreen phone={phone} start={{ state: 'pastDue' }} />,
  },
  {
    path: Z_ROUTES.cancelled,
    render: (phone) => <SubscriptionScreen phone={phone} start={{ state: 'cancelled' }} />,
  },
  {
    path: Z_ROUTES.payment,
    render: (phone) => <SubscriptionScreen phone={phone} start={{ paymentOpen: true }} />,
  },
  {
    path: Z_ROUTES.cancel,
    render: (phone) => <SubscriptionScreen phone={phone} start={{ cancelOpen: true }} />,
  },
  { path: Z_ROUTES.invoices, render: (phone) => <SubscriptionInvoices phone={phone} /> },
  ...INVOICES.map((invoice) => ({
    path: Z_ROUTES.invoice(invoice.number),
    render: () => <SubscriptionInvoicePdf number={invoice.number} />,
  })),
  { path: Z_ROUTES.changePlan, render: (phone) => <ChangePlan phone={phone} /> },
  {
    path: Z_ROUTES.changePlanPro,
    render: (phone) => <ChangePlan phone={phone} start={{ plan: 'pro' }} />,
  },
  {
    path: Z_ROUTES.changePlanConfirm,
    render: (phone) => <ChangePlan phone={phone} start={{ plan: 'pro', confirmOpen: true }} />,
  },
]

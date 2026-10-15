/*
 * Group Z's example data (P5.36, subscription and billing): Kvadrat Gradnja d.o.o.'s Liro
 * subscription as its administrator Milica Petrović sees it on 14 October 2026 — the Business
 * plan with the Projects module, 24 of 30 users (as the administration's overview says), usage,
 * the next invoice, Liro's invoices, the card on file, the three plans (Start, Business, Pro)
 * and the proration of a change to Pro. Every price, amount, limit, proration and state is the
 * application's (here: invented, in RSD); the components only show them, nothing is computed.
 * The seller "Liro Software d.o.o." and its numbers are illustrative. Not part of the package.
 * No classes here.
 */
import type { Tone } from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const Z_ROUTES = {
  subscription: '/settings/subscription',
  /** A company still on its trial: the trial banner, no invoices, no payment method. */
  trial: '/settings/subscription?state=trial',
  /** October's payment failed: the past-due banner on every page. */
  pastDue: '/settings/subscription?state=past-due',
  /** Cancelled, running to the end of the term. */
  cancelled: '/settings/subscription?state=cancelled',
  /** "Change" on the payment method: the drawer. */
  payment: '/settings/subscription?payment=open',
  /** "Cancel subscription": the confirmation. */
  cancel: '/settings/subscription?cancel=open',
  invoices: '/settings/subscription/invoices',
  invoice: (number: string) => `/settings/subscription/invoices/${number}`,
  changePlan: '/settings/subscription/change-plan',
  /** Pro chosen: the proration under the comparison. */
  changePlanPro: '/settings/subscription/change-plan?plan=pro',
  /** Pro chosen and "Change to Pro" asked: the confirmation. */
  changePlanConfirm: '/settings/subscription/change-plan?plan=pro&confirm=open',
} as const

export const Z_TODAY = '2026-10-14'

// ── Plans ─────────────────────────────────────────────────────────────────────────────────────

export type PlanId = 'start' | 'business' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  /** Per month, without VAT. */
  price: string
  usersIncluded: string
  description: string
}

export const PLANS: Record<PlanId, Plan> = {
  start: {
    id: 'start',
    name: 'Start',
    price: '3900.00',
    usersIncluded: '5',
    description: 'For a small company starting out.',
  },
  business: {
    id: 'business',
    name: 'Business',
    price: '14900.00',
    usersIncluded: '30',
    description: 'For a growing company with a team.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '29900.00',
    usersIncluded: '100',
    description: 'For several sites and many users.',
  },
}

export const PLAN_ORDER: PlanId[] = ['start', 'business', 'pro']

/** What each plan offers, as the comparison's rows (the application's words). */
export const PLAN_FEATURES: {
  id: string
  label: string
  group: string
  description?: string
  values: Record<PlanId, boolean | string>
}[] = [
  {
    id: 'users',
    label: 'Users included',
    group: 'Limits',
    values: { start: '5', business: '30', pro: '100' },
  },
  {
    id: 'storage',
    label: 'Storage',
    group: 'Limits',
    values: { start: '10 GB', business: '100 GB', pro: '500 GB' },
  },
  {
    id: 'einvoices',
    label: 'E-invoices a month',
    group: 'Limits',
    values: { start: '100', business: '1.000', pro: '10.000' },
  },
  {
    id: 'banks',
    label: 'Bank connections',
    group: 'Limits',
    values: { start: '1', business: '3', pro: 'No limit' },
  },
  {
    id: 'sales',
    label: 'Sales',
    group: 'Modules',
    values: { start: true, business: true, pro: true },
  },
  {
    id: 'purchasing',
    label: 'Purchasing',
    group: 'Modules',
    values: { start: true, business: true, pro: true },
  },
  {
    id: 'accounting',
    label: 'Accounting',
    group: 'Modules',
    values: { start: true, business: true, pro: true },
  },
  {
    id: 'hr',
    label: 'Employees and payroll',
    group: 'Modules',
    values: { start: false, business: true, pro: true },
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'An add-on on Business',
    group: 'Modules',
    values: { start: false, business: '2.400,00 RSD a month', pro: true },
  },
  {
    id: 'assistant',
    label: 'Liro Assistant',
    group: 'Modules',
    values: { start: '50 questions', business: '500 questions', pro: 'No limit' },
  },
  {
    id: 'support',
    label: 'Support',
    group: 'Support',
    values: { start: 'E-mail', business: 'E-mail and phone', pro: 'A named adviser' },
  },
]

/** Why a plan cannot be chosen now (the application's check): Start holds 5 users. */
export const PLAN_UNAVAILABLE: Partial<Record<PlanId, string>> = {
  start: 'Start has 5 users; you have 24. Deactivate 19 users first.',
}

/** The proration of a change today, from the billing service (never computed here). */
export interface Proration {
  rows: { key: string; label: string; value: string }[]
  subtotal: string
  vat: string
  dueToday: string
  /** From the next billing day: the new monthly amount with VAT. */
  monthly: string
  monthlyFrom: string
}

export const PRORATION: Partial<Record<PlanId, Proration>> = {
  pro: {
    rows: [
      { key: 'pro', label: 'Pro, 14.–31.10.2026 (18 of 31 days)', value: '17361.29' },
      { key: 'business', label: 'Unused Business, 14.–31.10.2026', value: '-8651.61' },
      { key: 'projects', label: 'Unused Projects module, 14.–31.10.2026', value: '-1393.55' },
    ],
    subtotal: '7316.13',
    vat: '1463.23',
    dueToday: '8779.36',
    monthly: '35880.00',
    monthlyFrom: '2026-11-01',
  },
}

// ── The subscription ──────────────────────────────────────────────────────────────────────────

export type SubscriptionState = 'active' | 'trial' | 'pastDue' | 'cancelled'

export interface Module {
  id: string
  name: string
  /** Included in the plan, or an add-on with its monthly price. */
  addOn?: string
}

export interface UsageLine {
  id: string
  label: string
  used: string
  limit: string | null
  unit?: string
  note?: string
  state?: { label: string; tone: Tone }
}

export interface Subscription {
  state: SubscriptionState
  plan: PlanId
  modules: Module[]
  termStart: string
  termEnd: string
  renews: string
  trialEnds?: string
  usage: UsageLine[]
  next: {
    date: string
    rows: { key: string; label: string; value: string }[]
    subtotal: string
    vat: string
    total: string
  }
  payment: { label: string; detail: string } | null
}

export const MODULES: Module[] = [
  { id: 'sales', name: 'Sales' },
  { id: 'purchasing', name: 'Purchasing' },
  { id: 'accounting', name: 'Accounting' },
  { id: 'hr', name: 'Employees and payroll' },
  { id: 'projects', name: 'Projects', addOn: '2400.00' },
]

const USAGE: UsageLine[] = [
  {
    id: 'users',
    label: 'Users',
    used: '24',
    limit: '30',
  },
  { id: 'storage', label: 'Storage', used: '38.4', limit: '100', unit: 'GB' },
  {
    id: 'einvoices',
    label: 'E-invoices sent this month',
    used: '412',
    limit: '1000',
    note: 'Resets on 01.11.2026.',
  },
  { id: 'banks', label: 'Bank connections', used: '2', limit: '3' },
  {
    id: 'assistant',
    label: 'Liro Assistant questions this month',
    used: '462',
    limit: '500',
    note: 'Resets on 01.11.2026. Questions over the limit wait until then.',
    state: { label: 'Near the limit', tone: 'warning' },
  },
]

const NEXT = {
  date: '2026-11-01',
  rows: [
    { key: 'business', label: 'Business, November 2026', value: '14900.00' },
    { key: 'projects', label: 'Projects module, November 2026', value: '2400.00' },
  ],
  subtotal: '17300.00',
  vat: '3460.00',
  total: '20760.00',
}

const CARD = { label: 'Visa ending in 4242', detail: 'Expires 08/2028 · Kvadrat Gradnja d.o.o.' }

export const SUBSCRIPTIONS: Record<SubscriptionState, Subscription> = {
  active: {
    state: 'active',
    plan: 'business',
    modules: MODULES,
    termStart: '2026-01-01',
    termEnd: '2026-12-31',
    renews: '2027-01-01',
    usage: USAGE,
    next: NEXT,
    payment: CARD,
  },
  trial: {
    state: 'trial',
    plan: 'business',
    modules: MODULES,
    termStart: '2026-09-24',
    termEnd: '2026-10-23',
    renews: '2026-10-24',
    trialEnds: '2026-10-23',
    usage: USAGE.map((line) => (line.id === 'users' ? { ...line, used: '6' } : line)).filter(
      (line) => line.id !== 'assistant',
    ),
    next: { ...NEXT, date: '2026-10-24' },
    payment: null,
  },
  pastDue: {
    state: 'pastDue',
    plan: 'business',
    modules: MODULES,
    termStart: '2026-01-01',
    termEnd: '2026-12-31',
    renews: '2027-01-01',
    usage: USAGE,
    next: NEXT,
    payment: { label: 'Visa ending in 4242', detail: 'Declined on 01.10., 04.10. and 08.10.2026.' },
  },
  cancelled: {
    state: 'cancelled',
    plan: 'business',
    modules: MODULES,
    termStart: '2026-01-01',
    termEnd: '2026-12-31',
    renews: '2027-01-01',
    usage: USAGE,
    next: NEXT,
    payment: CARD,
  },
}

/** Each plan's limits, by usage line (null: no limit). */
export const LIMITS: Record<PlanId, Record<string, string | null>> = {
  start: { users: '5', storage: '10', einvoices: '100', banks: '1', assistant: '50' },
  business: { users: '30', storage: '100', einvoices: '1000', banks: '3', assistant: '500' },
  pro: { users: '100', storage: '500', einvoices: '10000', banks: null, assistant: null },
}

/** The next invoice after a change to Pro (the billing service's). */
export const PRO_NEXT: Subscription['next'] = {
  date: '2026-11-01',
  rows: [{ key: 'pro', label: 'Pro, November 2026', value: '29900.00' }],
  subtotal: '29900.00',
  vat: '5980.00',
  total: '35880.00',
}

/** The subscription's state in words and tone (the application's map). */
export const SUBSCRIPTION_STATES: Record<SubscriptionState, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  trial: { label: 'Trial', tone: 'info' },
  pastDue: { label: 'Payment past due', tone: 'danger' },
  cancelled: { label: 'Ends 31.12.2026.', tone: 'warning' },
}

/** The past-due payment's facts (the billing service's). */
export const PAST_DUE = {
  invoice: 'LB-2026-0934',
  amount: '20760.00',
  readOnlyFrom: '2026-10-22',
}

// ── Liro's invoices ───────────────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'Paid' | 'Overdue'

export const INVOICE_TONES: Record<InvoiceStatus, Tone> = { Paid: 'success', Overdue: 'danger' }

export interface LiroInvoice {
  number: string
  /** The month invoiced, YYYY-MM. */
  period: string
  periodText: string
  issued: string
  total: string
  status: InvoiceStatus
  paidOn?: string
  lines: {
    id: string
    item: string
    quantity: string
    unit: string
    price: string
    amount: string
  }[]
  subtotal: string
  vat: string
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
]

/** January to October 2026: Business; the Projects module from April. */
export const INVOICES: LiroInvoice[] = MONTHS.map((month, index) => {
  const number = `LB-2026-${String(70 + index * 96).padStart(4, '0')}`
  const period = `2026-${String(index + 1).padStart(2, '0')}`
  const projects = index >= 3
  return {
    number,
    period,
    periodText: `${month} 2026`,
    issued: `${period}-01`,
    total: projects ? '20760.00' : '17880.00',
    status: 'Paid' as const,
    paidOn: `${period}-01`,
    lines: [
      {
        id: 'business',
        item: `Business plan, ${month} 2026`,
        quantity: '1',
        unit: 'month',
        price: '14900.00',
        amount: '14900.00',
      },
      ...(projects
        ? [
            {
              id: 'projects',
              item: `Projects module, ${month} 2026`,
              quantity: '1',
              unit: 'month',
              price: '2400.00',
              amount: '2400.00',
            },
          ]
        : []),
    ],
    subtotal: projects ? '17300.00' : '14900.00',
    vat: projects ? '3460.00' : '2980.00',
  }
}).reverse()

export const SELLER = {
  name: 'Liro Software d.o.o.',
  address: 'Bulevar oslobođenja 1',
  city: '21000 Novi Sad',
  taxId: '112345678',
  registration: '21987654',
  account: '160-0000000123456-78',
  bank: 'Illustrative Bank',
  email: 'billing@example.com',
}

export const BUYER = {
  name: 'Kvadrat Gradnja d.o.o.',
  address: 'Futoška 12, 21000 Novi Sad',
  taxId: '108452317',
  email: 'milica.petrovic@example.com',
}

export const CANCEL_REASONS = [
  { value: 'price', label: 'It costs too much' },
  { value: 'features', label: 'Something we need is missing' },
  { value: 'other-product', label: 'We are moving to another product' },
  { value: 'closing', label: 'The company is closing' },
  { value: 'other', label: 'Other' },
]

export const PAYMENT_OPTIONS = [
  {
    value: 'card',
    label: 'Visa ending in 4242',
    description: 'Charged on the first day of each month.',
  },
  {
    value: 'transfer',
    label: 'Bank transfer against each invoice',
    description: 'Pay within 8 days of the invoice, with its reference number.',
  },
  {
    value: 'new-card',
    label: 'A new card',
    description: 'You enter the card on the payment provider’s page; Liro never sees its number.',
  },
]

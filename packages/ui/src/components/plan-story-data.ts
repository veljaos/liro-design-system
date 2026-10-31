import type { ComparedFeature, ComparedPlan } from './plan-logic'

/*
 * Fictitious plans for the PlanComparison and UsageMeter stories and tests: three tiers
 * of an illustrative business application, prices in RSD as the application writes them. Not
 * part of the package's API.
 */

export const PLANS: ComparedPlan[] = [
  {
    id: 'start',
    name: 'Start',
    price: '3.900,00 RSD',
    priceNote: 'per month, without VAT',
    description: 'For a small company starting out.',
  },
  {
    id: 'business',
    name: 'Business',
    price: '14.900,00 RSD',
    priceNote: 'per month, without VAT',
    description: 'For a growing company with a team.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29.900,00 RSD',
    priceNote: 'per month, without VAT',
    description: 'For several sites and many users.',
  },
]

export const FEATURES: ComparedFeature[] = [
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
    id: 'sales',
    label: 'Sales and purchasing',
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
    description: 'Add-on on Business',
    group: 'Modules',
    values: { start: false, business: '2.400,00 RSD a month', pro: true },
  },
  {
    id: 'support',
    label: 'Support',
    group: 'Support',
    values: { start: 'E-mail', business: 'E-mail and phone', pro: 'A named adviser' },
  },
]

/** Business in use; Start cannot hold its 24 users. */
export const PLANS_WITH_REASON: ComparedPlan[] = PLANS.map((plan) =>
  plan.id === 'start'
    ? { ...plan, unavailableReason: 'Start has 5 users; you have 24. Remove 19 users first.' }
    : plan,
)

export const LONG_PLANS: ComparedPlan[] = [
  {
    id: 'basic',
    name: 'Basic bookkeeping for sole traders and very small partnerships',
    price: '1.250.000,00 RSD',
    priceNote: 'per year, paid in advance, without VAT and without the one-off setup fee',
    description:
      'Everything a sole trader needs to keep the books, issue documents and send the yearly returns on time, with e-mail support on working days.',
  },
  ...PLANS.slice(1),
]

export const ARABIC_PLANS: ComparedPlan[] = [
  { id: 'start', name: 'البداية', price: '3.900 د.ص', priceNote: 'شهريًا، بدون الضريبة' },
  { id: 'business', name: 'الأعمال', price: '14.900 د.ص', priceNote: 'شهريًا، بدون الضريبة' },
  { id: 'pro', name: 'الاحترافية', price: '29.900 د.ص', priceNote: 'شهريًا، بدون الضريبة' },
]

export const ARABIC_FEATURES: ComparedFeature[] = [
  {
    id: 'users',
    label: 'المستخدمون المشمولون',
    group: 'الحدود',
    values: { start: '5', business: '30', pro: '100' },
  },
  {
    id: 'hr',
    label: 'الموظفون والرواتب',
    group: 'الوحدات',
    values: { start: false, business: true, pro: true },
  },
  {
    id: 'support',
    label: 'الدعم',
    group: 'الدعم',
    values: { start: 'البريد الإلكتروني', business: 'البريد والهاتف', pro: 'مستشار مخصص' },
  },
]

export const JAPANESE_PLANS: ComparedPlan[] = [
  { id: 'start', name: 'スタート', price: '3,900 円', priceNote: '月額（税抜）' },
  { id: 'business', name: 'ビジネス', price: '14,900 円', priceNote: '月額（税抜）' },
  { id: 'pro', name: 'プロ', price: '29,900 円', priceNote: '月額（税抜）' },
]

export const JAPANESE_FEATURES: ComparedFeature[] = [
  {
    id: 'users',
    label: '含まれるユーザー数',
    group: '上限',
    values: { start: '5', business: '30', pro: '100' },
  },
  {
    id: 'hr',
    label: '従業員と給与',
    group: 'モジュール',
    values: { start: false, business: true, pro: true },
  },
  {
    id: 'support',
    label: 'サポート',
    group: 'サポート',
    values: { start: 'メール', business: 'メールと電話', pro: '専任アドバイザー' },
  },
]

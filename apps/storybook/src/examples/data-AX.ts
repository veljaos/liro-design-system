/*
 * Group AX's example data (P5.54, price lists, discounts and promotions): Pekara Zlatni klas
 * (group I's bakery in Novi Sad) on 14.10.2026 — its own shop's retail price list, wholesale
 * price lists for shops and for cafés and restaurants (one of them scheduled from 01.11.2026, one
 * ended), the prices of one list with the customers' own prices and the customers it applies to,
 * promotions with their validity (Active, Scheduled, Ended: the application's words) and the
 * discount rules as data. Every price, rate and state is the application's; the screens compare
 * no dates and compute no price. Invented data; PIBs are illustrative.
 */

export const AX_ROUTES = {
  lists: '/pricing/price-lists',
  list: '/pricing/price-lists/CN-02',
  promotions: '/pricing/promotions',
  rules: '/pricing/discount-rules',
}

export type PricingState = 'Active' | 'Scheduled' | 'Ended'

export interface PriceList {
  code: string
  name: string
  /** Who it applies to, in the application's words. */
  appliesTo: string
  vat: 'VAT included' | 'VAT excluded'
  from: string
  to: string | null
  items: string
  state: PricingState
}

export const PRICE_LISTS: PriceList[] = [
  {
    code: 'CN-01',
    name: 'Shop, retail',
    appliesTo: 'Own shop, Kasa 1',
    vat: 'VAT included',
    from: '2026-09-01',
    to: null,
    items: '42',
    state: 'Active',
  },
  {
    code: 'CN-02',
    name: 'Wholesale, shops',
    appliesTo: 'Customer group Shops',
    vat: 'VAT excluded',
    from: '2026-10-01',
    to: '2026-10-31',
    items: '11',
    state: 'Active',
  },
  {
    code: 'CN-03',
    name: 'Wholesale, cafés and restaurants',
    appliesTo: 'Customer group Cafés and restaurants',
    vat: 'VAT excluded',
    from: '2026-10-01',
    to: null,
    items: '14',
    state: 'Active',
  },
  {
    code: 'CN-04',
    name: 'Wholesale, shops, from November',
    appliesTo: 'Customer group Shops',
    vat: 'VAT excluded',
    from: '2026-11-01',
    to: null,
    items: '11',
    state: 'Scheduled',
  },
  {
    code: 'CN-00',
    name: 'Wholesale, shops, summer',
    appliesTo: 'Customer group Shops',
    vat: 'VAT excluded',
    from: '2026-06-01',
    to: '2026-09-30',
    items: '11',
    state: 'Ended',
  },
]

export const PRICE_LIST_VIEWS: { id: string; label: string; states: readonly PricingState[] }[] = [
  { id: 'current', label: 'Active and scheduled', states: ['Active', 'Scheduled'] },
  { id: 'ended', label: 'Ended', states: ['Ended'] },
  { id: 'all', label: 'All', states: ['Active', 'Scheduled', 'Ended'] },
]

// ── CN-02, wholesale to shops ────────────────────────────────────────────────────────────────

export interface ListPrice {
  id: string
  name: string
  code: string
  unit: string
  /** Without VAT, RSD. */
  price: string
  /** The price before this one, where it changed: the application's. */
  previous: string | null
  vat: string
  from: string
}

export const CN02_PRICES: ListPrice[] = [
  {
    id: 'beli',
    name: 'Beli hleb, 500 g',
    code: '8600417000108',
    unit: 'pcs',
    price: '54.00',
    previous: '52.00',
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'polubeli',
    name: 'Polubeli hleb, 600 g',
    code: '8600417000115',
    unit: 'pcs',
    price: '62.00',
    previous: '60.00',
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'integralni',
    name: 'Integralni hleb, 400 g',
    code: '8600417000122',
    unit: 'pcs',
    price: '79.00',
    previous: null,
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'kukuruzni',
    name: 'Kukuruzni hleb, 450 g',
    code: '8600417000139',
    unit: 'pcs',
    price: '75.00',
    previous: null,
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'razeni',
    name: 'Raženi hleb, 400 g',
    code: '8600417000146',
    unit: 'pcs',
    price: '92.00',
    previous: '90.00',
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'kifla',
    name: 'Kifla, 60 g',
    code: '8600417000207',
    unit: 'pcs',
    price: '20.00',
    previous: null,
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'perec',
    name: 'Perec sa susamom, 90 g',
    code: '8600417000214',
    unit: 'pcs',
    price: '37.00',
    previous: null,
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'kroasan',
    name: 'Kroasan sa čokoladom, 80 g',
    code: '8600417000221',
    unit: 'pcs',
    price: '92.00',
    previous: '88.00',
    vat: 'E 10%',
    from: '2026-10-08',
  },
  {
    id: 'burek-sir',
    name: 'Burek sa sirom, 250 g',
    code: '8600417000306',
    unit: 'pcs',
    price: '150.00',
    previous: null,
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'burek-meso',
    name: 'Burek sa mesom, 250 g',
    code: '8600417000313',
    unit: 'pcs',
    price: '158.00',
    previous: null,
    vat: 'E 10%',
    from: '2026-10-01',
  },
  {
    id: 'pogacice',
    name: 'Pogačice sa čvarcima, per kg',
    code: '8600417000337',
    unit: 'kg',
    price: '580.00',
    previous: '560.00',
    vat: 'E 10%',
    from: '2026-10-01',
  },
]

export interface CustomerPrice {
  id: string
  customer: string
  item: string
  price: string
  from: string
  to: string | null
}

/** A customer's own price on this list, where it differs from the list's. */
export const CN02_CUSTOMER_PRICES: CustomerPrice[] = [
  {
    id: 'sunce-beli',
    customer: 'Market Sunce d.o.o.',
    item: 'Beli hleb, 500 g',
    price: '52.00',
    from: '2026-10-01',
    to: '2026-12-31',
  },
  {
    id: 'sunce-polubeli',
    customer: 'Market Sunce d.o.o.',
    item: 'Polubeli hleb, 600 g',
    price: '60.00',
    from: '2026-10-01',
    to: '2026-12-31',
  },
  {
    id: 'lipa-kifla',
    customer: 'Mini market Lipa',
    item: 'Kifla, 60 g',
    price: '19.00',
    from: '2026-10-01',
    to: null,
  },
]

export interface GroupCustomer {
  id: string
  name: string
  taxId: string
  since: string
}

/** The customer group Shops, which CN-02 applies to. */
export const SHOPS: GroupCustomer[] = [
  { id: 'sunce', name: 'Market Sunce d.o.o.', taxId: '109223417', since: '2024-03-01' },
  { id: 'lipa', name: 'Mini market Lipa', taxId: '110874392', since: '2025-01-15' },
  { id: 'detelinara', name: 'Prodavnica Detelinara', taxId: '108331946', since: '2023-09-01' },
  { id: 'liman', name: 'Market Liman 3', taxId: '111506283', since: '2025-06-01' },
  { id: 'podbara', name: 'Samoposluga Podbara', taxId: '107992615', since: '2022-11-01' },
  { id: 'telep', name: 'Market Telep d.o.o.', taxId: '112118740', since: '2026-02-01' },
]

// ── Promotions ────────────────────────────────────────────────────────────────────────────────

export interface Promotion {
  id: string
  name: string
  items: string
  /** The rule in the application's words. */
  rule: string
  /** Where it applies: a price list or the shop. */
  where: string
  from: string
  to: string
  state: PricingState
}

export const PROMOTIONS: Promotion[] = [
  {
    id: 'croissant',
    name: 'Croissant 2 + 1',
    items: 'Kroasan sa čokoladom',
    rule: 'Buy 2, get 1 free',
    where: 'CN-01 Shop, retail',
    from: '2026-10-01',
    to: '2026-10-31',
    state: 'Active',
  },
  {
    id: 'burek',
    name: 'Burek with yoghurt',
    items: 'Burek sa sirom, Burek sa mesom, Jogurt 0,5 l',
    rule: 'The yoghurt at half price with a burek',
    where: 'CN-01 Shop, retail',
    from: '2026-10-01',
    to: '2026-10-15',
    state: 'Active',
  },
  {
    id: 'bread-week',
    name: 'Wholesale bread week',
    items: 'Every bread',
    rule: '8% off',
    where: 'CN-02 Wholesale, shops',
    from: '2026-10-20',
    to: '2026-10-26',
    state: 'Scheduled',
  },
  {
    id: 'breakfast',
    name: 'Café breakfast bundle',
    items: 'Kifla, Kroasan sa čokoladom',
    rule: '5% off orders of 50 pieces or more',
    where: 'CN-03 Wholesale, cafés and restaurants',
    from: '2026-11-01',
    to: '2026-11-30',
    state: 'Scheduled',
  },
  {
    id: 'school',
    name: 'Back to school',
    items: 'Every pastry',
    rule: '15% off',
    where: 'CN-01 Shop, retail',
    from: '2026-09-01',
    to: '2026-09-15',
    state: 'Ended',
  },
  {
    id: 'summer',
    name: 'Summer pogačice',
    items: 'Pogačice sa čvarcima',
    rule: '10% off',
    where: 'CN-00 Wholesale, shops, summer',
    from: '2026-07-01',
    to: '2026-08-31',
    state: 'Ended',
  },
]

export const PROMOTION_VIEWS: { id: string; label: string; states: readonly PricingState[] }[] = [
  { id: 'active', label: 'Active', states: ['Active'] },
  { id: 'scheduled', label: 'Scheduled', states: ['Scheduled'] },
  { id: 'ended', label: 'Ended', states: ['Ended'] },
  { id: 'all', label: 'All', states: ['Active', 'Scheduled', 'Ended'] },
]

// ── Discount rules ────────────────────────────────────────────────────────────────────────────

export interface DiscountRule {
  id: string
  /** The order the application applies them in. */
  order: string
  name: string
  appliesTo: string
  condition: string
  discount: string
  on: boolean
}

export const DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'quantity',
    order: '1',
    name: 'Quantity discount',
    appliesTo: 'Customer group Shops',
    condition: 'An order of 200 pieces or more',
    discount: '3% off the order',
    on: true,
  },
  {
    id: 'loyalty',
    order: '2',
    name: 'Loyal cafés',
    appliesTo: 'Customer group Cafés and restaurants',
    condition: 'A customer for more than 12 months',
    discount: '4% off every line',
    on: true,
  },
  {
    id: 'early',
    order: '3',
    name: 'Early payment',
    appliesTo: 'Every wholesale customer',
    condition: 'Paid within 8 days of the invoice',
    discount: '2% off the invoice, as a credit note',
    on: true,
  },
  {
    id: 'packaging',
    order: '4',
    name: 'Damaged packaging',
    appliesTo: 'Own shop, Kasa 1',
    condition: 'Marked by the cashier at the till',
    discount: '20% off the item',
    on: false,
  },
]

/** How the rules and promotions combine: the application's words. */
export const RULES_NOTE =
  'Applied in this order, each on what the one before left. A line in a promotion takes no further discount.'

/*
 * Group I's example data (P5.17): the till of Pekara Zlatni klas in Novi Sad (a bakery, Kasa 1)
 * on 6 October 2026, and the handheld of Magacin Novi Sad picking order NP-2026-0233 for Kvadrat
 * Gradnja d.o.o., then counting the location the pick came up short at. Fictitious; English
 * interface text, Serbian data. Amounts are whole paras (BigInt) and quantities whole thousandths:
 * every line total, discount, tax and difference is computed here, as the application would; the
 * components add nothing (D4). The stated figures below are checked against the computation in
 * dataset-checks.ts. Tax labels (E 10%, Đ 20%) and codes are illustrative. Not part of the
 * package. No classes here.
 */
import type {
  CartAmount,
  CartLine,
  ConfirmReason,
  CountItem,
  PickLine,
  PosProduct,
  ProductCategory,
  ReceiptAmount,
  ReceiptItem,
} from '@veljaos/ui'
import {
  decimal,
  fromUnits,
  paras,
  sumUnits,
  toUnits,
} from '../../../../packages/ui/src/components/amounts-story-data'

export const I_ROUTES = {
  /** The till, a sale of six lines in the cart. */
  pos: '/pos/zlatni-klas',
  /** The same sale, paying cash: 2.000,00 tendered. */
  posCash: '/pos/zlatni-klas?step=cash',
  /** Paying by card, the terminal waiting for the customer. */
  posCardWaiting: '/pos/zlatni-klas?step=card-waiting',
  /** The terminal approved the card. */
  posCardApproved: '/pos/zlatni-klas?step=card-approved',
  /** The sale paid in cash, its receipt shown. */
  posReceipt: '/pos/zlatni-klas?step=receipt',
  /** The connection lost, three sales kept on the till. */
  posOffline: '/pos/zlatni-klas?offline',
  /** Phones: the products sheet open over the cart. */
  posProducts: '/pos/zlatni-klas?products=open',
  /** The pick list, line 5 of 12: scan its location. */
  picking: '/warehouse/picking/PL-2026-0418',
  /** The location scanned: scan the item. */
  pickingItem: '/warehouse/picking/PL-2026-0418?step=item',
  /** Both scanned: confirm the quantity. */
  pickingQuantity: '/warehouse/picking/PL-2026-0418?step=quantity',
  /** Skipping the line, the reason asked. */
  pickingSkip: '/warehouse/picking/PL-2026-0418?step=skip',
  /** The connection lost, three changes kept on the handheld. */
  pickingOffline: '/warehouse/picking/PL-2026-0418?offline',
  /** The count of A-02-03, where the pick came up short. */
  count: '/warehouse/counts/CC-2026-0031',
}

// ── The till ──────────────────────────────────────────────────────────────────────────────────

export const BAKERY = {
  name: 'Pekara Zlatni klas',
  address: 'Bulevar oslobođenja 46, Novi Sad',
  taxId: 'PIB 112374905',
  register: 'Kasa 1',
  cashier: 'Snežana Kovačević',
  currency: 'RSD',
  /** The receipt's number and time of the sale in the cart. */
  receipt: 'ZK-01-002318',
  time: '09:42',
  /** Sales kept on the till while the connection is lost. */
  queued: 3,
}

/** The tax categories of the till (illustrative): the label printed after an item, and its rate. */
export const VAT = {
  E: { label: 'E', rate: 10n },
  Đ: { label: 'Đ', rate: 20n },
} as const

export type VatCategory = keyof typeof VAT

/** A product of the till: a ProductGrid entry with its barcode and tax category. */
export interface BakeryProduct extends PosProduct {
  /** The barcode a scanner reads (fictitious, GS1 prefix of Serbia). */
  code: string
  vat: VatCategory
}

export const CATEGORIES: readonly ProductCategory[] = [
  { id: 'bread', label: 'Hleb' },
  { id: 'pastry', label: 'Peciva' },
  { id: 'savoury', label: 'Slano' },
  { id: 'cakes', label: 'Kolači' },
  { id: 'drinks', label: 'Pića' },
]

export const PRODUCTS: readonly BakeryProduct[] = [
  {
    id: 'beli',
    name: 'Beli hleb',
    detail: '500 g',
    price: '65.00',
    categoryId: 'bread',
    stock: { tone: 'neutral', text: '18 left' },
    code: '8600417000108',
    vat: 'E',
  },
  {
    id: 'polubeli',
    name: 'Polubeli hleb',
    detail: '600 g',
    price: '75.00',
    categoryId: 'bread',
    code: '8600417000115',
    vat: 'E',
  },
  {
    id: 'integralni',
    name: 'Integralni hleb',
    detail: '400 g',
    price: '95.00',
    categoryId: 'bread',
    stock: { tone: 'warning', text: 'Low stock: 3' },
    code: '8600417000122',
    vat: 'E',
  },
  {
    id: 'kukuruzni',
    name: 'Kukuruzni hleb',
    detail: '450 g',
    price: '90.00',
    categoryId: 'bread',
    code: '8600417000139',
    vat: 'E',
  },
  {
    id: 'razeni',
    name: 'Raženi hleb',
    detail: '400 g',
    price: '110.00',
    categoryId: 'bread',
    unavailableReason: 'Sold out; the next batch is at 11:00',
    code: '8600417000146',
    vat: 'E',
  },
  {
    id: 'kifla',
    name: 'Kifla',
    detail: '60 g',
    price: '25.00',
    categoryId: 'pastry',
    code: '8600417000207',
    vat: 'E',
  },
  {
    id: 'perec',
    name: 'Perec sa susamom',
    detail: '90 g',
    price: '45.00',
    categoryId: 'pastry',
    code: '8600417000214',
    vat: 'E',
  },
  {
    id: 'kroasan',
    name: 'Kroasan sa čokoladom',
    detail: '80 g',
    price: '110.00',
    categoryId: 'pastry',
    code: '8600417000221',
    vat: 'E',
  },
  {
    id: 'burek-sir',
    name: 'Burek sa sirom',
    detail: '250 g',
    price: '180.00',
    categoryId: 'savoury',
    code: '8600417000306',
    vat: 'E',
  },
  {
    id: 'burek-meso',
    name: 'Burek sa mesom',
    detail: '250 g',
    price: '190.00',
    categoryId: 'savoury',
    stock: { tone: 'warning', text: 'Low stock: 2' },
    code: '8600417000313',
    vat: 'E',
  },
  {
    id: 'pogacice',
    name: 'Pogačice sa čvarcima',
    detail: '100 g',
    price: '70.00',
    categoryId: 'savoury',
    code: '8600417000320',
    vat: 'E',
  },
  {
    id: 'krempita',
    name: 'Krempita',
    price: '220.00',
    categoryId: 'cakes',
    code: '8600417000405',
    vat: 'Đ',
  },
  {
    id: 'reforma',
    name: 'Reforma torta, parče',
    price: '260.00',
    categoryId: 'cakes',
    stock: { tone: 'danger', text: '1 left' },
    code: '8600417000412',
    vat: 'Đ',
  },
  {
    id: 'tulumbe',
    name: 'Tulumbe',
    detail: '200 g',
    price: '160.00',
    categoryId: 'cakes',
    code: '8600417000429',
    vat: 'Đ',
  },
  {
    id: 'jogurt',
    name: 'Jogurt',
    detail: '1 l',
    price: '135.00',
    categoryId: 'drinks',
    code: '8600417000504',
    vat: 'E',
  },
  {
    id: 'kafa',
    name: 'Domaća kafa',
    price: '120.00',
    categoryId: 'drinks',
    code: '8600417000511',
    vat: 'Đ',
  },
  {
    id: 'sok',
    name: 'Sok od pomorandže',
    detail: '0,25 l',
    price: '150.00',
    categoryId: 'drinks',
    code: '8600417000528',
    vat: 'Đ',
  },
]

/** The product a barcode names, or undefined. */
export function productByCode(code: string): BakeryProduct | undefined {
  return PRODUCTS.find((each) => each.code === code)
}

function product(id: string): BakeryProduct {
  const found = PRODUCTS.find((each) => each.id === id)
  if (found === undefined) throw new Error(`Example dataset: product ${id} is missing`)
  return found
}

/** A line of the sale as the till keeps it: a product, a whole quantity, a discount rate. */
export interface SaleLine {
  productId: string
  /** Whole pieces, a decimal string. */
  quantity: string
  /** A discount in whole percent and its reason ("Loyalty discount"). */
  discount?: { rate: bigint; reason: string }
}

/** The sale in the cart: six lines, the loyalty card's 10% on the cakes. */
export const SALE: readonly SaleLine[] = [
  { productId: 'kifla', quantity: '6' },
  { productId: 'burek-sir', quantity: '2' },
  { productId: 'integralni', quantity: '1' },
  { productId: 'jogurt', quantity: '2' },
  { productId: 'krempita', quantity: '4', discount: { rate: 10n, reason: 'Loyalty discount' } },
  { productId: 'kafa', quantity: '2' },
]

/** The loyalty card on the sale, as the till shows it. */
export const LOYALTY_CARD = 'Loyalty card 0417-2291'

/** Half up, for positive amounts: numerator / denominator in whole paras. */
function halfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n)
}

/** One line computed: before the discount, the discount, after it. In paras. */
export interface ComputedLine {
  line: SaleLine
  product: BakeryProduct
  gross: bigint
  discount: bigint
  total: bigint
}

/** The application's arithmetic of one sale: lines, discounts, the tax included, the total. */
export function computeSale(lines: readonly SaleLine[]) {
  const computed: ComputedLine[] = lines.map((line) => {
    const item = product(line.productId)
    const gross = paras(item.price) * BigInt(line.quantity)
    const discount = line.discount === undefined ? 0n : halfUp(gross * line.discount.rate, 100n)
    return { line, product: item, gross, discount, total: gross - discount }
  })
  const subtotal = sumUnits(computed.map((each) => each.gross))
  const discounts = sumUnits(computed.map((each) => each.discount))
  const total = sumUnits(computed.map((each) => each.total))
  // The tax included in the prices, per category: total × rate / (100 + rate), half up.
  const vat = (Object.keys(VAT) as VatCategory[]).map((category) => {
    const base = sumUnits(
      computed.filter((each) => each.product.vat === category).map((each) => each.total),
    )
    const rate = VAT[category].rate
    return { category, base, vat: halfUp(base * rate, 100n + rate) }
  })
  return { lines: computed, subtotal, discounts, total, vat }
}

export type ComputedSale = ReturnType<typeof computeSale>

/** The figures of the sale as stated (the till's display); checked in dataset-checks.ts. */
export const SALE_FIGURES = {
  subtotal: '1995.00',
  discounts: '88.00',
  total: '1907.00',
  vatE: '79.55',
  vatD: '172.00',
  /** Cash tendered and the change. */
  tendered: '2000.00',
  change: '93.00',
}

/** Banknotes the cashier is offered for this total. */
export const QUICK_AMOUNTS: readonly string[] = ['2000', '2500', '5000']

/** The card the terminal approved (fictitious). */
export const CARD_APPROVAL = 'Visa •••• 4821 · authorisation 093214'

/** The cart's lines as CartPanel shows them. `discountText` writes a discount in the tenant's way. */
export function cartLines(
  sale: ComputedSale,
  discountText: (reason: string, rate: bigint, amount: string) => string,
): CartLine[] {
  return sale.lines.map(({ line, product: item, discount, total }) => ({
    id: item.id,
    name: item.name,
    ...(item.detail === undefined ? {} : { detail: item.detail }),
    quantity: line.quantity,
    unit: 'pc',
    unitPrice: item.price,
    total: decimal(total),
    min: '1',
    ...(line.discount === undefined
      ? {}
      : { discount: discountText(line.discount.reason, line.discount.rate, decimal(-discount)) }),
  }))
}

/** The rows above the total: subtotal, discounts, the tax included per category. */
export function cartTotals(sale: ComputedSale): CartAmount[] {
  return [
    { id: 'subtotal', label: 'Subtotal', value: decimal(sale.subtotal) },
    ...(sale.discounts === 0n
      ? []
      : [{ id: 'discounts', label: 'Discounts', value: decimal(-sale.discounts) }]),
    ...sale.vat
      .filter((each) => each.base !== 0n)
      .map((each) => ({
        id: `vat-${each.category}`,
        label: `VAT ${String(VAT[each.category].rate)}% included`,
        value: decimal(each.vat),
      })),
  ]
}

/** What the cash tendered leaves: the change, or what is still to pay. Null while nothing is typed. */
export function cashOutcome(total: bigint, tendered: string | null) {
  if (tendered === null) return { change: null, remaining: null }
  const given = paras(tendered)
  return given >= total
    ? { change: decimal(given - total), remaining: null }
    : { change: null, remaining: decimal(total - given) }
}

/** The receipt's items: the tax label after the name, a discount under it. */
export function receiptItems(
  sale: ComputedSale,
  discountText: (rate: bigint, amount: string) => string,
): ReceiptItem[] {
  return sale.lines.map(({ line, product: item, discount, total }) => ({
    id: item.id,
    name: `${item.name}${item.detail === undefined ? '' : ` ${item.detail}`} (${item.vat})`,
    quantity: line.quantity,
    unitPrice: item.price,
    total: decimal(total),
    ...(line.discount === undefined
      ? {}
      : { note: discountText(line.discount.rate, decimal(-discount)) }),
  }))
}

/** The receipt's totals: the total, then the tax per category and all of it. */
export function receiptTotals(sale: ComputedSale): ReceiptAmount[] {
  const rows = sale.vat.filter((each) => each.base !== 0n)
  return [
    { id: 'total', label: 'Total', value: decimal(sale.total), strong: true },
    ...rows.map((each) => ({
      id: `vat-${each.category}`,
      label: `${VAT[each.category].label} ${String(VAT[each.category].rate)}% VAT`,
      value: decimal(each.vat),
    })),
    { id: 'vat', label: 'Total VAT', value: decimal(sumUnits(rows.map((each) => each.vat))) },
  ]
}

export const RECEIPT_FOOTER: readonly string[] = [
  'Thank you, see you tomorrow!',
  '======== END OF FISCAL RECEIPT ========',
]

// ── The handheld: picking ─────────────────────────────────────────────────────────────────────

export const PICKING = {
  list: 'PL-2026-0418',
  order: 'NP-2026-0233',
  customer: 'Kvadrat Gradnja d.o.o.',
  warehouse: 'Magacin Novi Sad',
  worker: 'Nikola Babić',
  /** Changes kept on the handheld while the connection is lost. */
  queued: 3,
}

export const PICK_LINES: readonly PickLine[] = [
  {
    id: 'p1',
    location: 'A-01-02',
    item: 'Cement CEM II/A-M 42,5R, 25 kg',
    itemCode: '8600981000101',
    quantity: '40',
    picked: '40',
    unit: 'bag',
    state: 'picked',
  },
  {
    id: 'p2',
    location: 'A-01-06',
    item: 'Lepak za pločice C2TE, 25 kg',
    itemCode: '8600981000118',
    quantity: '15',
    picked: '15',
    unit: 'bag',
    state: 'picked',
  },
  {
    id: 'p3',
    location: 'A-02-03',
    item: 'Armaturna mreža Q131, 2,15 × 6 m',
    itemCode: '8600981000125',
    quantity: '10',
    picked: '7',
    unit: 'pc',
    state: 'short',
    note: 'Only 7 on the shelf; the rest arrives on 08.10.2026.',
  },
  {
    id: 'p4',
    location: 'A-04-01',
    item: 'Hidroizolaciona traka, rolna 10 m',
    itemCode: '8600981000132',
    quantity: '4',
    picked: null,
    unit: 'roll',
    state: 'skipped',
    note: 'Skipped: Damaged — the rolls are wet.',
  },
  {
    id: 'p5',
    location: 'B-03-04',
    item: 'Fasadni stiropor EPS 10 cm, paket 3 m²',
    itemCode: '8600981000149',
    quantity: '18',
    picked: null,
    unit: 'pack',
    state: 'open',
  },
  {
    id: 'p6',
    location: 'B-05-02',
    item: 'Fasadna mrežica 145 g/m², rolna 50 m',
    itemCode: '8600981000156',
    quantity: '6',
    picked: null,
    unit: 'roll',
    state: 'open',
  },
  {
    id: 'p7',
    location: 'C-01-02',
    item: 'Gips-karton ploča 12,5 mm, 1200 × 2000 mm',
    itemCode: '8600981000163',
    quantity: '32',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
  {
    id: 'p8',
    location: 'C-01-05',
    item: 'UW profil 50 mm, 3 m',
    itemCode: '8600981000170',
    quantity: '20',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
  {
    id: 'p9',
    location: 'C-02-01',
    item: 'Šrafovi za gips-karton 3,5 × 35 mm, 1000 kom',
    itemCode: '8600981000187',
    quantity: '4',
    picked: null,
    unit: 'box',
    state: 'open',
  },
  {
    id: 'p10',
    location: 'D-02-03',
    item: 'Silikon građevinski, beli, 300 ml',
    itemCode: '8600981000194',
    quantity: '12',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
  {
    id: 'p11',
    location: 'E-01-01',
    item: 'Pesak 0–4 mm, rinfuz',
    itemCode: '8600981000200',
    quantity: '1.5',
    picked: null,
    unit: 't',
    state: 'open',
  },
  {
    id: 'p12',
    location: 'E-03-02',
    item: 'Mešalica za beton 140 l',
    itemCode: '8600981000217',
    quantity: '1',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
]

/** The line in front of the worker when the list opens: the first open one. */
export const CURRENT_PICK = 'p5'

/** The reasons to skip a line (the application's list). */
export const SKIP_REASONS: readonly ConfirmReason[] = [
  { value: 'missing', label: 'Not on the shelf' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong', label: 'A different item at the location' },
  { value: 'blocked', label: 'Location blocked' },
  { value: 'other', label: 'Other' },
]

// ── The handheld: counting ────────────────────────────────────────────────────────────────────

export const COUNT = {
  number: 'CC-2026-0031',
  title: 'Cycle count CC-2026-0031',
  subtitle: 'Magacin Novi Sad · after PL-2026-0418',
  location: 'A-02-03',
  locationName: 'Rack A2, shelf 3',
}

/** Quantities as whole thousandths, so 1,5 t is exact. */
export function quantityUnits(value: string): bigint {
  return toUnits(value, 3)
}

/** Whole thousandths as a decimal string without trailing zeros ("-3", "1.5"). */
export function quantityText(units: bigint): string {
  return fromUnits(units, 3).replace(/\.?0+$/, '')
}

/** The books' quantity at the location, and what was counted (the application's records). */
export interface CountRecord {
  id: string
  item: string
  itemCode: string
  unit: string
  expected: string
  counted: string | null
  note?: string
}

export const COUNT_RECORDS: readonly CountRecord[] = [
  {
    id: 'c1',
    item: 'Armaturna mreža Q131, 2,15 × 6 m',
    itemCode: '8600981000125',
    unit: 'pc',
    expected: '3',
    counted: '0',
    note: '7 picked for PL-2026-0418; the books expected 10 here before the pick.',
  },
  {
    id: 'c2',
    item: 'Armaturna mreža Q188, 2,15 × 6 m',
    itemCode: '8600981000231',
    unit: 'pc',
    expected: '12',
    counted: '14',
    note: 'Two sheets may be Q131 stored with Q188.',
  },
  {
    id: 'c3',
    item: 'Vezivna žica 1,2 mm, 25 kg',
    itemCode: '8600981000248',
    unit: 'roll',
    expected: '6',
    counted: '6',
  },
]

/** The item in front when the count opens: the last one scanned. */
export const CURRENT_COUNT = 'c2'

/** The differences as stated (counted − expected); checked in dataset-checks.ts. */
export const COUNT_DIFFERENCES: Record<string, string> = { c1: '-3', c2: '2', c3: '0' }

/**
 * The application's reading of a count: the difference counted − expected, and its tone
 * (none: neutral; up to 2: warning; more: danger).
 */
export function countItems(records: readonly CountRecord[]): CountItem[] {
  return records.map((record) => {
    const difference =
      record.counted === null
        ? null
        : quantityUnits(record.counted) - quantityUnits(record.expected)
    const size = difference === null ? 0n : difference < 0n ? -difference : difference
    return {
      id: record.id,
      item: record.item,
      itemCode: record.itemCode,
      unit: record.unit,
      counted: record.counted,
      expected: record.expected,
      difference: difference === null ? null : quantityText(difference),
      differenceTone: size === 0n ? 'neutral' : size <= 2000n ? 'warning' : 'danger',
      ...(record.note === undefined ? {} : { note: record.note }),
    }
  })
}

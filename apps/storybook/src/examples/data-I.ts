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
import type { CartAmount, CartLine, PosProduct, ProductCategory } from '@veljaos/ui'
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

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
  /** The receipt's number (the processor's, invented; P5.28) and time of the sale in the cart. */
  receipt: 'ZK7Q2M4P-ZK7Q2M4P-2318',
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

/** The footer's lines; the closing line is ReceiptPreview's `end` (P5.28), not "=====" text. */
export const RECEIPT_FOOTER: readonly string[] = ['Thank you, see you tomorrow!']

// ── The handheld: picking ─────────────────────────────────────────────────────────────────────

// ── The handheld: counting ────────────────────────────────────────────────────────────────────

/** What the cash tendered leaves: the change, or what is still to pay. Null while nothing is typed. */
export function cashOutcome(total: bigint, tendered: string | null) {
  if (tendered === null) return { change: null, remaining: null }
  const given = paras(tendered)
  return given >= total
    ? { change: decimal(given - total), remaining: null }
    : { change: null, remaining: decimal(total - given) }
}

import { createFormat } from '../provider/format'
import type { CartAmount, CartLine } from './cart-panel'
import type { PaymentPart } from './payment-dialog'
import type { PosProduct, ProductCategory } from './product-tile'
import type { ReceiptAmount, ReceiptFact, ReceiptItem } from './receipt-preview'

/*
 * Story data of the till (P5.10): Pekara Zlatni klas, a bakery in Novi Sad (fictitious). English
 * interface text, Serbian data; every amount a decimal string, and the totals add up as the
 * application would send them. Not part of the package: nothing in src/index.ts imports this
 * file. No classes here: Storybook compiles classes only from *.stories.tsx files.
 */

const SERBIAN = createFormat('sr-Latn-RS')

export const CURRENCY = 'RSD'

export const CATEGORIES: readonly ProductCategory[] = [
  { id: 'bread', label: 'Hleb' },
  { id: 'pastry', label: 'Peciva' },
  { id: 'cakes', label: 'Kolači' },
  { id: 'drinks', label: 'Pića' },
]

export const PRODUCTS: readonly PosProduct[] = [
  {
    id: 'beli',
    name: 'Beli hleb',
    detail: '500 g',
    price: '65',
    categoryId: 'bread',
    stock: { tone: 'neutral', text: '24 left' },
  },
  {
    id: 'integralni',
    name: 'Integralni hleb',
    detail: '400 g',
    price: '95',
    categoryId: 'bread',
    stock: { tone: 'warning', text: 'Low stock: 3' },
  },
  {
    id: 'kukuruzni',
    name: 'Kukuruzni hleb',
    detail: '450 g',
    price: '90',
    categoryId: 'bread',
  },
  { id: 'kifla', name: 'Kifla', detail: '60 g', price: '25', categoryId: 'pastry' },
  {
    id: 'pogacice',
    name: 'Pogačice sa čvarcima',
    detail: '100 g',
    price: '70',
    categoryId: 'pastry',
  },
  {
    id: 'burek-sir',
    name: 'Burek sa sirom',
    detail: '250 g',
    price: '180',
    categoryId: 'pastry',
    unavailableReason: 'Sold out; the next batch is at 11:00',
  },
  {
    id: 'burek-meso',
    name: 'Burek sa mesom',
    detail: '250 g',
    price: '190',
    categoryId: 'pastry',
  },
  {
    id: 'kroasan',
    name: 'Kroasan sa čokoladom',
    detail: '80 g',
    price: '110',
    categoryId: 'pastry',
  },
  { id: 'krempita', name: 'Krempita', price: '220', categoryId: 'cakes' },
  {
    id: 'reforma',
    name: 'Reforma torta, parče',
    price: '260',
    categoryId: 'cakes',
    stock: { tone: 'danger', text: '1 left' },
  },
  { id: 'jogurt', name: 'Jogurt', detail: '1 l', price: '135', categoryId: 'drinks' },
  { id: 'kafa', name: 'Domaća kafa', price: '120', categoryId: 'drinks' },
  {
    id: 'sok',
    name: 'Sok od pomorandže',
    detail: '0,25 l',
    price: '150',
    categoryId: 'drinks',
  },
]

export const CART_LINES: readonly CartLine[] = [
  {
    id: 'c1',
    name: 'Kifla',
    detail: '60 g',
    quantity: '4',
    unit: 'pc',
    unitPrice: '25',
    total: '100.00',
  },
  {
    id: 'c2',
    name: 'Burek sa mesom',
    detail: '250 g',
    quantity: '2',
    unit: 'pc',
    unitPrice: '190',
    total: '380.00',
  },
  {
    id: 'c3',
    name: 'Jogurt',
    detail: '1 l',
    quantity: '1',
    unit: 'pc',
    unitPrice: '135',
    total: '135.00',
    max: '6',
  },
  {
    id: 'c4',
    name: 'Krempita',
    quantity: '2',
    unit: 'pc',
    unitPrice: '220',
    total: '396.00',
    discount: `Loyalty discount 10%: ${SERBIAN.money('-44', CURRENCY)}`,
  },
]

export const CART_TOTALS: readonly CartAmount[] = [
  { id: 'subtotal', label: 'Subtotal', value: '1055.00' },
  { id: 'discount', label: 'Discounts', value: '-44.00' },
  { id: 'vat', label: 'VAT 20% included', value: '168.50' },
]

export const CART_TOTAL = '1011.00'

/** Banknotes offered for cash. */
export const QUICK_AMOUNTS: readonly string[] = ['1100', '1500', '2000', '5000']

export const SPLIT_PAID: readonly PaymentPart[] = [{ id: 'p1', label: 'Card', value: '500.00' }]

export const RECEIPT_HEADER: readonly string[] = [
  'Pekara Zlatni klas',
  'Bulevar oslobođenja 46, Novi Sad',
  'PIB 108765432',
]

export const RECEIPT_FACTS: readonly ReceiptFact[] = [
  { id: 'number', label: 'Receipt', value: 'ZK-02-000412' },
  { id: 'time', label: 'Date', value: '06.10.2026. 09:42' },
  { id: 'register', label: 'Register', value: 'Kasa 2' },
  { id: 'cashier', label: 'Cashier', value: 'Milica Jovanović' },
]

export const RECEIPT_ITEMS: readonly ReceiptItem[] = [
  { id: 'r1', name: 'Kifla 60 g (Đ)', quantity: '4', unitPrice: '25.00', total: '100.00' },
  {
    id: 'r2',
    name: 'Burek sa mesom 250 g (Đ)',
    quantity: '2',
    unitPrice: '190.00',
    total: '380.00',
  },
  { id: 'r3', name: 'Jogurt 1 l (Đ)', quantity: '1', unitPrice: '135.00', total: '135.00' },
  {
    id: 'r4',
    name: 'Krempita (Đ)',
    quantity: '2',
    unitPrice: '220.00',
    total: '396.00',
    note: `Discount 10%: ${SERBIAN.number('-44', { decimals: 2 })}`,
  },
]

export const RECEIPT_TOTALS: readonly ReceiptAmount[] = [
  { id: 'total', label: 'Total', value: '1011.00', strong: true },
  { id: 'vat', label: 'Đ 20% VAT', value: '168.50' },
]

export const RECEIPT_PAYMENTS: readonly ReceiptAmount[] = [
  { id: 'cash', label: 'Cash', value: '2000.00' },
  { id: 'change', label: 'Change', value: '989.00' },
]

export const RECEIPT_FOOTER: readonly string[] = ['Thank you, see you tomorrow!']

/** The closing line, printed between double rules (P5.28: the `end` prop, not "=====" text). */
export const RECEIPT_END = 'END OF FISCAL RECEIPT'

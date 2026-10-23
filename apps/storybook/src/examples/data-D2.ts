/*
 * The documents of group D2 (P5.18, complex documents) for the examples: Kvadrat Gradnja
 * d.o.o. on 6 October 2026, the same dataset as examples-story-data.ts. Every amount is computed
 * here from the lines, in whole paras with BigInt (the application's work, played by the
 * examples; components never add): lines → recap by tax category → totals. Legal texts, codes and tax categories are illustrative. No classes here: Storybook
 * compiles classes only from *.stories.tsx files.
 *
 * - KO-2026-0009: decrease document against F-2026-0410 (Medic Lab Niš d.o.o.), the one D2
 *   screen.
 * - F-2026-0407 (Bojović i sinovi d.o.o.), cancelled on 06.10.2026. by cancellation document
 *   ST-2026-0004: no screen of its own, its figures checked against the invoice list
 *   (dataset-checks.ts).
 */

import type { LineType } from '@veljaos/ui'
import { fromUnits, toUnits } from '../../../../packages/ui/src/components/amounts-story-data'

// ── Arithmetic in whole paras (the application's) ───────────────────────────────────────────

/** Divides and rounds half away from zero (amounts are rounded to the para). */
function divideRounded(value: bigint, divisor: bigint): bigint {
  const negative = value < 0n
  const magnitude = negative ? -value : value
  const rounded = (magnitude * 2n + divisor) / (divisor * 2n)
  return negative ? -rounded : rounded
}

/** quantity (up to 3 decimals) × price (paras) → paras, rounded to the para. */
export function lineAmount(quantity: string, price: string): string {
  return fromUnits(divideRounded(toUnits(quantity, 3) * toUnits(price, 2), 1000n))
}

/** The sum of decimal strings, in paras. */
export function sum(values: readonly string[]): string {
  return fromUnits(values.reduce((total, value) => total + toUnits(value), 0n))
}

/** `amount` × `rate` % (rate a decimal string such as "20" or "3"), rounded to the para. */
export function percentOf(amount: string, rate: string): string {
  return fromUnits(divideRounded(toUnits(amount) * toUnits(rate, 4), 1_000_000n))
}

/** Negates a decimal string. */
export function negated(value: string): string {
  return fromUnits(-toUnits(value))
}

// ── Lines and tax categories ────────────────────────────────────────────────────────────────

export interface DocTaxCategory {
  code: 'S20' | 'S10' | 'E' | 'AE'
  /** As the e-invoice system names it, and as the lines' tax column shows it. */
  label: string
  /** The rate as a percentage; null where no tax is charged. */
  rate: string | null
  /** The footnote marker of an exemption or a reverse charge. */
  marker?: string
}

export const TAX: Record<DocTaxCategory['code'], DocTaxCategory> = {
  S20: { code: 'S20', label: 'S 20%', rate: '20' },
  S10: { code: 'S10', label: 'S 10%', rate: '10' },
  E: { code: 'E', label: 'E', rate: null, marker: '¹' },
  AE: { code: 'AE', label: 'AE', rate: null, marker: '²' },
}

/** One line of a document as the Core sends it: its type, text and values. */
export interface DocLine {
  id: string
  type: LineType
  /** The item, the heading, the text line or the subtotal's label. */
  text: string
  /** What the line is ("Item", "Service"), from the chosen catalogue entry. */
  kind?: string
  quantity?: string
  unit?: string
  price?: string
  tax?: DocTaxCategory['code']
  amount?: string
}

/** A normal line: its amount is quantity × price. */
function line(
  id: string,
  text: string,
  kind: string,
  quantity: string,
  unit: string,
  price: string,
  tax: DocTaxCategory['code'],
): DocLine {
  return {
    id,
    type: 'line',
    text,
    kind,
    quantity,
    unit,
    price,
    tax,
    amount: lineAmount(quantity, price),
  }
}

/** The lines that carry an amount and a tax category (not headings, texts or subtotals). */
function taxed(lines: readonly DocLine[]): DocLine[] {
  return lines.filter(
    (each) =>
      (each.type === 'line' || each.type === 'discount' || each.type === 'deduction') &&
      each.amount !== undefined &&
      each.tax !== undefined,
  )
}

/** One row of the recap by tax category. */
export interface RecapRow {
  code: DocTaxCategory['code']
  base: string
  tax: string | null
}

/** Bases per category in the order of TAX, and the tax of each (rounded to the para). */
export function recapOf(lines: readonly DocLine[]): RecapRow[] {
  const rows: RecapRow[] = []
  for (const category of Object.values(TAX)) {
    const amounts = taxed(lines)
      .filter((each) => each.tax === category.code)
      .map((each) => each.amount ?? '0')
    if (amounts.length === 0) continue
    const base = sum(amounts)
    rows.push({
      code: category.code,
      base,
      tax: category.rate === null ? null : percentOf(base, category.rate),
    })
  }
  return rows
}

/** The document's totals from its recap: without tax, tax, total. */
export function totalsOf(recap: readonly RecapRow[]): { net: string; tax: string; total: string } {
  const net = sum(recap.map((row) => row.base))
  const tax = sum(recap.map((row) => row.tax ?? '0'))
  return { net, tax, total: sum([net, tax]) }
}

// ── The customer ────────────────────────────────────────────────────────────────────────────

export const MEDIC_LAB = {
  name: 'Medic Lab Niš d.o.o.',
  taxId: 'PIB 107819450',
  address: 'Bulevar Nemanjića 25, 18000 Niš',
}

// ── F-2026-0410 and its decrease KO-2026-0009 ───────────────────────────────────────────────

/** The lines of F-2026-0410 (186.420,35 RSD as issued). */
const BOARDS = line(
  '1',
  'Gypsum boards 12,5 mm, 1200 × 2000 mm',
  'Item',
  '140',
  'pc',
  '689.00',
  'S20',
)
const PROFILES = line('2', 'CW profiles 75 mm, 3 m', 'Item', '220', 'pc', '189.70', 'S20')
const WOOL = line('3', 'Mineral wool 50 mm', 'Item', '60', 'm²', '221.00', 'S20')
const DOCUMENTATION = line(
  '4',
  'Technical documentation, printed',
  'Service',
  '1',
  'lot',
  '4250.50',
  'S10',
)
export const MEDIC_LINES: DocLine[] = [BOARDS, PROFILES, WOOL, DOCUMENTATION]
export const MEDIC_TOTALS = totalsOf(recapOf(MEDIC_LINES))

/** A corrected line: before, change and after, for the quantity and the amount. */
export interface CorrectedLine {
  id: string
  text: string
  unit: string
  price: string
  tax: DocTaxCategory['code']
  quantity: { original: string; change: string; next: string }
  amount: { original: string; change: string; next: string }
}

function corrected(original: DocLine, change: string): CorrectedLine {
  const quantity = original.quantity ?? '0'
  const next = fromUnits(toUnits(quantity, 3) + toUnits(change, 3), 3).replace(/\.?0+$/, '')
  const amount = lineAmount(next, original.price ?? '0')
  return {
    id: original.id,
    text: original.text,
    unit: original.unit ?? '',
    price: original.price ?? '0',
    tax: original.tax ?? 'S20',
    quantity: { original: quantity, change, next },
    amount: {
      original: original.amount ?? '0',
      change: sum([amount, negated(original.amount ?? '0')]),
      next: amount,
    },
  }
}

/** Damaged goods returned: 20 gypsum boards and 8 m² of mineral wool. */
export const DECREASE_LINES: CorrectedLine[] = [corrected(BOARDS, '-20'), corrected(WOOL, '-8')]

export const DECREASE = (() => {
  const base = sum(DECREASE_LINES.map((each) => each.amount.change))
  const tax = percentOf(base, '20')
  const change = sum([base, tax])
  return { base, tax, change, newTotal: sum([MEDIC_TOTALS.total, change]) }
})()

// ── F-2026-0407 and its cancellation ST-2026-0004 ───────────────────────────────────────────

export const CANCELLED_LINES: DocLine[] = [
  line('1', 'Facade adhesive, 25 kg', 'Item', '150', 'bag', '395.00', 'S20'),
  line('2', 'Facade anchors 140 mm', 'Item', '1500', 'pc', '13.00', 'S20'),
]
export const CANCELLED_TOTALS = totalsOf(recapOf(CANCELLED_LINES))

export const CANCELLATION = {
  number: 'ST-2026-0004',
  invoice: 'F-2026-0407',
  by: 'Milica Petrović',
  at: '2026-10-06T11:20:00+02:00',
  reason: 'The September price list was not applied; the goods will be invoiced again.',
}

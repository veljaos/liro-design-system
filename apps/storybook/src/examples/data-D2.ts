/*
 * The documents of group D2 (P5.18, complex documents) for the example screens: Kvadrat Gradnja
 * d.o.o. on 6 October 2026, the same dataset as examples-story-data.ts. Every amount is computed
 * here from the lines, in whole paras with BigInt (the application's work, played by the
 * examples; components never add): lines → recap by tax category → totals → deductions → amount
 * due. Legal texts, codes and tax categories are illustrative. No classes here: Storybook
 * compiles classes only from *.stories.tsx files.
 *
 * - F-2026-0418: final invoice to Vojvođanka Mlin a.d. deducting advances A-2026-038 and
 *   A-2026-044, based on proforma PR-2026-031 and contract 12/2026.
 * - IS-2026-007: interim situation 7 under contract 12/2026 (Hall B extension, Temerinski put
 *   51), with its specification of 300 positions (`specificationOf`, the recipe shared with
 *   group D1).
 * - F-2026-0415: invoice in EUR to Donau Bau GmbH, Wien, with S 20%, S 10%, E and AE lines.
 * - KO-2026-0009: decrease document against F-2026-0410 (Medic Lab Niš d.o.o.).
 * - F-2026-0407 (Bojović i sinovi d.o.o.), cancelled on 06.10.2026. by cancellation document
 *   ST-2026-0004 (the number chosen by group D2).
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

// ── The company and the customers ───────────────────────────────────────────────────────────

export const MEDIC_LAB = {
  name: 'Medic Lab Niš d.o.o.',
  taxId: 'PIB 107819450',
  address: 'Bulevar Nemanjića 25, 18000 Niš',
}

// ── F-2026-0418: the final invoice ──────────────────────────────────────────────────────────

// ── F-2026-0415: the invoice in EUR ─────────────────────────────────────────────────────────

// ── F-2026-0410 and its decrease KO-2026-0009 ───────────────────────────────────────────────

/** The lines of F-2026-0410 (186.420,35 RSD as issued; group A's screen shows them too). */
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

// ── IS-2026-007: the interim situation and its specification ────────────────────────────────

/** The twelve groups of works (the recipe shared with group D1). */
export const SPEC_GROUPS = [
  '1. Preparatory works',
  '2. Earthworks',
  '3. Concrete works',
  '4. Masonry',
  '5. Steel structure',
  '6. Roofing',
  '7. Facade',
  '8. Carpentry',
  '9. Plumbing',
  '10. Electrical installation',
  '11. Floors',
  '12. Finishing works',
]

/** A few works per group; positions cycle through them with their place on the site. */
const SPEC_WORKS: string[][] = [
  [
    'Site fencing, panels 2 m',
    'Site office containers, rent',
    'Removal of topsoil',
    'Setting out the axes',
    'Temporary power connection',
  ],
  [
    'Excavation of foundation trenches',
    'Backfill with compacted gravel',
    'Removal of excess soil',
    'Trench support, timber',
    'Levelling of the subgrade',
  ],
  [
    'Concrete C25/30 for footings',
    'Reinforcement B500B',
    'Formwork for walls',
    'Concrete C30/37 for columns',
    'Lean concrete C12/15',
  ],
  [
    'Clay block walls 25 cm',
    'Partition walls 12 cm',
    'Lintels, precast',
    'Ring beams',
    'Chimney blocks',
  ],
  [
    'Steel columns HEB 240',
    'Steel beams HEA 200',
    'Wind bracing',
    'Anti-corrosion coating',
    'Anchor bolts',
  ],
  [
    'Sandwich roof panels',
    'Ridge flashings',
    'Gutters and downpipes',
    'Roof skylights',
    'Snow guards',
  ],
  [
    'Facade panels',
    'Facade insulation 10 cm',
    'Window sills, aluminium',
    'Facade plaster',
    'Plinth tiles',
  ],
  [
    'Aluminium windows',
    'Steel doors, fire rated',
    'Sectional gates',
    'Internal doors',
    'Glass partitions',
  ],
  ['Water supply pipes', 'Sewer pipes PVC', 'Sanitary fittings', 'Water heaters', 'Floor drains'],
  ['Cable trays', 'Power cables', 'Lighting fixtures, LED', 'Distribution boards', 'Earthing'],
  [
    'Industrial floor screed',
    'Floor tiles, offices',
    'Epoxy coating',
    'Expansion joints',
    'Skirting',
  ],
  ['Wall painting', 'Ceiling boards', 'Signage', 'Final cleaning', 'Handover documentation'],
]

/** One position of the specification. */
export interface SpecPosition {
  id: string
  group: number
  position: number
  /** "5.12": group and position. */
  number: string
  text: string
  unit: 'm²' | 'pc'
  /** The contracted quantity, whole units. */
  quantity: string
  /** The unit price, a decimal string in RSD. */
  price: string
  /** The contracted amount: quantity × price. */
  amount: string
  previous: { quantity: string; amount: string }
  current: { quantity: string; amount: string }
  cumulative: { quantity: string; amount: string }
}

/**
 * The specification of IS-2026-007, generated with EXACTLY the recipe agreed with group D1
 * (group briefs, D1 item 8), so both screens agree: 12 groups × 25 positions; position i of
 * group g: quantity ((g·7 + i·3) mod 40) + 1, "m²" for odd i and "pc" for even i; unit price in
 * paras 50000 + ((g·1301 + i·977) mod 950000); previous period (i mod 3) · 25 % of the quantity
 * and this period ((i + g) mod 2) · 25 %, both rounded down to whole units; amounts quantity ×
 * price exactly; every position S 20%.
 */
export function specificationOf(): SpecPosition[] {
  const positions: SpecPosition[] = []
  for (let g = 1; g <= 12; g += 1) {
    const works = SPEC_WORKS[g - 1] ?? []
    for (let i = 1; i <= 25; i += 1) {
      const quantity = BigInt(((g * 7 + i * 3) % 40) + 1)
      const price = BigInt(50000 + ((g * 1301 + i * 977) % 950000))
      const previous = (quantity * BigInt((i % 3) * 25)) / 100n
      const current = (quantity * BigInt(((i + g) % 2) * 25)) / 100n
      const work = works[(i - 1) % works.length] ?? ''
      positions.push({
        id: `${String(g)}.${String(i)}`,
        group: g,
        position: i,
        number: `${String(g)}.${String(i)}`,
        text: `${work}, section ${String(Math.ceil(i / 5))}`,
        unit: i % 2 === 1 ? 'm²' : 'pc',
        quantity: quantity.toString(),
        price: fromUnits(price),
        amount: fromUnits(quantity * price),
        previous: { quantity: previous.toString(), amount: fromUnits(previous * price) },
        current: { quantity: current.toString(), amount: fromUnits(current * price) },
        cumulative: {
          quantity: (previous + current).toString(),
          amount: fromUnits((previous + current) * price),
        },
      })
    }
  }
  return positions
}

/** A row of the specification view: a group heading, a position or a group's subtotal. */
export interface SpecRow {
  id: string
  type: LineType
  text: string
  position?: SpecPosition
  /** A subtotal's sums: contracted, previous, this period, cumulative. */
  sums?: { amount: string; previous: string; current: string; cumulative: string }
}

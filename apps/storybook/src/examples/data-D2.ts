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

/** The line types of P5.18, as DataTable's `lineType` takes them. */
export type LineType = 'line' | 'text' | 'heading' | 'subtotal' | 'discount' | 'deduction'

// ── Arithmetic in whole paras (the application's) ───────────────────────────────────────────

/** A decimal string with up to `places` decimals as whole units of 10^-places. */
export function units(value: string, places = 2): bigint {
  const negative = value.startsWith('-')
  const [whole = '0', fraction = ''] = value.replace(/^-/, '').split('.')
  const result = BigInt(whole + fraction.padEnd(places, '0').slice(0, places))
  return negative ? -result : result
}

/** Whole units of 10^-places as a decimal string. */
export function fromUnits(value: bigint, places = 2): string {
  const negative = value < 0n
  const digits = (negative ? -value : value).toString().padStart(places + 1, '0')
  const text = places === 0 ? digits : `${digits.slice(0, -places)}.${digits.slice(-places)}`
  return negative ? `-${text}` : text
}

/** Divides and rounds half away from zero (amounts are rounded to the para). */
function divideRounded(value: bigint, divisor: bigint): bigint {
  const negative = value < 0n
  const magnitude = negative ? -value : value
  const rounded = (magnitude * 2n + divisor) / (divisor * 2n)
  return negative ? -rounded : rounded
}

/** quantity (up to 3 decimals) × price (paras) → paras, rounded to the para. */
export function lineAmount(quantity: string, price: string): string {
  return fromUnits(divideRounded(units(quantity, 3) * units(price, 2), 1000n))
}

/** The sum of decimal strings, in paras. */
export function sum(values: readonly string[]): string {
  return fromUnits(values.reduce((total, value) => total + units(value), 0n))
}

/** `amount` × `rate` % (rate a decimal string such as "20" or "3"), rounded to the para. */
export function percentOf(amount: string, rate: string): string {
  return fromUnits(divideRounded(units(amount) * units(rate, 4), 1_000_000n))
}

/** An amount in another currency at `rate` (home units for one foreign unit, 4 decimals). */
export function converted(amount: string, rate: string): string {
  return fromUnits(divideRounded(units(amount) * units(rate, 4), 10_000n))
}

/** Negates a decimal string. */
export function negated(value: string): string {
  return fromUnits(-units(value))
}

// ── Lines and tax categories ────────────────────────────────────────────────────────────────

export interface TaxCategory {
  code: 'S20' | 'S10' | 'E' | 'AE'
  /** As the e-invoice system names it, and as the lines' tax column shows it. */
  label: string
  /** The rate as a percentage; null where no tax is charged. */
  rate: string | null
  /** The footnote marker of an exemption or a reverse charge. */
  marker?: string
}

export const TAX: Record<TaxCategory['code'], TaxCategory> = {
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
  tax?: TaxCategory['code']
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
  tax: TaxCategory['code'],
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
  code: TaxCategory['code']
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

/** A heading's section: its lines, then a subtotal of their amounts. */
function section(id: string, heading: string, lines: DocLine[], subtotalLabel: string): DocLine[] {
  return [
    { id: `${id}-h`, type: 'heading', text: heading },
    ...lines,
    {
      id: `${id}-s`,
      type: 'subtotal',
      text: subtotalLabel,
      amount: sum(lines.map((each) => each.amount ?? '0')),
    },
  ]
}

// ── The company and the customers ───────────────────────────────────────────────────────────

export const VOJVODJANKA = {
  name: 'Vojvođanka Mlin a.d.',
  taxId: 'PIB 100421987',
  address: 'Industrijska 4, 23000 Zrenjanin',
}

export const DONAU_BAU = {
  name: 'Donau Bau GmbH',
  taxId: 'UID ATU12345678',
  address: 'Handelskai 94, 1200 Wien, Austria',
}

export const MEDIC_LAB = {
  name: 'Medic Lab Niš d.o.o.',
  taxId: 'PIB 107819450',
  address: 'Bulevar Nemanjića 25, 18000 Niš',
}

export const BOJOVIC = {
  name: 'Bojović i sinovi d.o.o.',
  taxId: 'PIB 109773148',
  address: 'Kralja Petra I 31, 11300 Smederevo',
}

// ── F-2026-0418: the final invoice ──────────────────────────────────────────────────────────

const STEEL = [
  line('1', 'Steel beams HEA 200, S275JR', 'Item', '12.6', 't', '142800.00', 'S20'),
  line('2', 'Steel columns HEB 240, S275JR', 'Item', '8.4', 't', '146500.00', 'S20'),
  line(
    '3',
    'High-strength bolts M20 10.9 with nuts and washers',
    'Item',
    '640',
    'pc',
    '186.40',
    'S20',
  ),
]

const ROOFING = [
  line('4', 'Sandwich roof panels PUR 100 mm, RAL 9002', 'Item', '820', 'm²', '4385.00', 'S20'),
  line('5', 'Ridge and edge flashings, 0,6 mm', 'Item', '96', 'm', '1240.00', 'S20'),
]

/** The 3% contract discount on the steel structure and the roofing (S 20%). */
const DISCOUNT_BASE = sum([...STEEL, ...ROOFING].map((each) => each.amount ?? '0'))

export const FINAL_LINES: DocLine[] = [
  ...section('steel', 'Steel structure', STEEL, 'Total steel structure'),
  ...section('roof', 'Roofing', ROOFING, 'Total roofing'),
  line('6', 'Assembly drawings, printed and bound', 'Service', '2', 'lot', '6400.00', 'S10'),
  {
    id: 'note',
    type: 'text',
    text: 'Delivered to the site at Temerinski put 51, Novi Sad, from 14 to 25 September 2026; delivery notes OTP-2026-0388 to OTP-2026-0402.',
  },
  {
    id: 'discount',
    type: 'discount',
    text: 'Contract discount 3% on the steel structure and the roofing',
    kind: 'Discount',
    tax: 'S20',
    amount: negated(percentOf(DISCOUNT_BASE, '3')),
  },
]

export const FINAL_RECAP = recapOf(FINAL_LINES)
export const FINAL_TOTALS = totalsOf(FINAL_RECAP)

/** The two advances, as invoiced (with their VAT). */
export const ADVANCES = [
  { number: 'A-2026-038', issued: '2026-07-15', amount: '1200000.00' },
  { number: 'A-2026-044', issued: '2026-08-20', amount: '1800000.00' },
]

export const FINAL_DUE = sum([
  FINAL_TOTALS.total,
  ...ADVANCES.map((advance) => negated(advance.amount)),
])

/** The attachments of F-2026-0418, each with its "Send with the e-invoice" flag. */
export const FINAL_ATTACHMENTS = [
  { id: 'contract', name: 'Ugovor 12-2026.pdf', size: '412 KB', send: true },
  { id: 'handover', name: 'Zapisnik o primopredaji 25.09.2026.pdf', size: '1,2 MB', send: true },
  { id: 'notes', name: 'Otpremnice OTP-2026-0388–0402.pdf', size: '3,8 MB', send: false },
]

// ── F-2026-0415: the invoice in EUR ─────────────────────────────────────────────────────────

export const EUR_LINES: DocLine[] = [
  line('1', 'Precast concrete stair flights, type ST-12', 'Item', '6', 'pc', '1240.00', 'S20'),
  line('2', 'Technical documentation, printed set', 'Item', '3', 'lot', '85.00', 'S10'),
  line('3', 'Supervision of installation on site, Wien', 'Service', '16', 'h', '62.50', 'AE'),
  line('4', 'Returnable steel transport pallets', 'Item', '10', 'pc', '45.00', 'E'),
]

export const EUR_RATE = { rate: '117.1825', date: '2026-10-05' }
export const EUR_RECAP = recapOf(EUR_LINES)
export const EUR_TOTALS = totalsOf(EUR_RECAP)

/** The equivalents in RSD: the net and the tax converted, the total their sum. */
export const EUR_IN_RSD = (() => {
  const net = converted(EUR_TOTALS.net, EUR_RATE.rate)
  const tax = converted(EUR_TOTALS.tax, EUR_RATE.rate)
  return { net, tax, total: sum([net, tax]) }
})()

// ── F-2026-0410 and its decrease KO-2026-0009 ───────────────────────────────────────────────

/** The lines of F-2026-0410 (total 186.420,35 RSD, as in the invoice list). */
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
  tax: TaxCategory['code']
  quantity: { original: string; change: string; next: string }
  amount: { original: string; change: string; next: string }
}

function corrected(original: DocLine, change: string): CorrectedLine {
  const quantity = original.quantity ?? '0'
  const next = fromUnits(units(quantity, 3) + units(change, 3), 3).replace(/\.?0+$/, '')
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

/** The cancellation document's lines: the cancelled invoice's, negated. */
export const CANCELLATION_LINES: DocLine[] = CANCELLED_LINES.map((each) => ({
  ...each,
  quantity: negated(each.quantity ?? '0').replace(/\.00$/, ''),
  amount: negated(each.amount ?? '0'),
}))
export const CANCELLATION_TOTALS = totalsOf(recapOf(CANCELLATION_LINES))

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

export const SPECIFICATION = specificationOf()

/** A row of the specification view: a group heading, a position or a group's subtotal. */
export interface SpecRow {
  id: string
  type: LineType
  text: string
  position?: SpecPosition
  /** A subtotal's sums: contracted, previous, this period, cumulative. */
  sums?: { amount: string; previous: string; current: string; cumulative: string }
}

function sums(positions: readonly SpecPosition[]) {
  return {
    amount: sum(positions.map((each) => each.amount)),
    previous: sum(positions.map((each) => each.previous.amount)),
    current: sum(positions.map((each) => each.current.amount)),
    cumulative: sum(positions.map((each) => each.cumulative.amount)),
  }
}

export const SPEC_ROWS: SpecRow[] = SPEC_GROUPS.flatMap((name, index) => {
  const positions = SPECIFICATION.filter((each) => each.group === index + 1)
  return [
    { id: `g${String(index + 1)}`, type: 'heading' as const, text: name },
    ...positions.map((each) => ({
      id: each.id,
      type: 'line' as const,
      text: each.text,
      position: each,
    })),
    {
      id: `s${String(index + 1)}`,
      type: 'subtotal' as const,
      text: `Total ${name}`,
      sums: sums(positions),
    },
  ]
})

export const SPEC_TOTALS = sums(SPECIFICATION)

/** This period's works, as the situation's one line (S 20%). */
export const SITUATION_LINES: DocLine[] = [
  {
    id: '1',
    type: 'line',
    text: 'Works on the Hall B extension, Temerinski put 51, in September 2026, under contract 12/2026',
    kind: 'Service',
    quantity: '1',
    unit: 'lot',
    price: SPEC_TOTALS.current,
    tax: 'S20',
    amount: SPEC_TOTALS.current,
  },
]
export const SITUATION_RECAP = recapOf(SITUATION_LINES)
export const SITUATION_TOTALS = totalsOf(SITUATION_RECAP)

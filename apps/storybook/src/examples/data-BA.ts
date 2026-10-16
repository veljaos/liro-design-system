/*
 * Group BA's example data (P5.53, the retail price calculation — kalkulacija): Pekara Zlatni klas
 * resells dairy and drinks in its shop. Mlekara Ravnica d.o.o.'s invoice 2026-4471 of 13.10.2026
 * arrived with five lines, and the transport by Prevoz Bačka d.o.o. (2.192,00 RSD, the dependent
 * cost: 8,00 a piece by the shop's rule). Calculation KLK-2026-0047 of 14.10.2026 prices each line
 * — purchase price, dependent costs, cost price, margin (percentage and amount), price without
 * VAT, the VAT rate and amount, the retail price and the line's retail value — and the totals;
 * the new retail prices change the price of the pieces already on the shelf: price change
 * NIV-2026-0012.
 *
 * The shop sets a line's retail price (with VAT); everything else is the application's
 * calculation, played here in whole paras (`priceLine`, `calculationTotals`, `priceChanges`):
 * VAT is taken out of the retail price, rounded half up to the para; the margin is what remains
 * over the cost price; its percentage is of the cost price, rounded half up to two decimals. The
 * stated figures below are what it gives for the invoice's prices (checked in dataset-checks.ts).
 * The screens and the components compute nothing. English interface text, Serbian data; invented,
 * the PIBs illustrative. Not part of the package. No classes here.
 */
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

export const BA_TODAY = '2026-10-14'

export const CALCULATION = {
  number: 'KLK-2026-0047',
  date: '2026-10-14',
  shop: 'Shop, Bulevar oslobođenja 46',
  preparedBy: 'Snežana Kovačević',
  supplier: {
    name: 'Mlekara Ravnica d.o.o.',
    taxId: 'PIB 107733591',
    address: 'Sentandrejski put 160, Novi Sad',
  },
  invoice: { number: '2026-4471', date: '2026-10-13', total: '22764.00' },
  transport: { name: 'Prevoz Bačka d.o.o.', number: '2026-0915', amount: '2192.00' },
}

export const PRICE_CHANGE = {
  number: 'NIV-2026-0012',
  date: '2026-10-14',
  reason: 'New retail prices from calculation KLK-2026-0047',
}

export const BA_ROUTES = {
  calculation: `/shop/price-calculations/${CALCULATION.number}`,
  priceChange: `/shop/price-changes/${PRICE_CHANGE.number}`,
}

/** What the shop enters, or what came on the invoice: one line's inputs. */
export interface CalculationInput {
  id: string
  item: string
  code: string
  unit: string
  /** Whole pieces. */
  quantity: string
  /** The supplier's price for one piece, without VAT. */
  purchase: string
  /** The dependent costs for one piece. */
  dependent: string
  /** The VAT rate in percent ("10", "20"). */
  rate: string
  /** The retail price of one piece, with VAT: the shop's choice; null until entered. */
  retail: string | null
}

/** A calculated line: the inputs and the application's figures (per piece, then the line). */
export interface CalculationLine extends CalculationInput {
  cost: string | null
  marginPercent: string | null
  margin: string | null
  net: string | null
  vat: string | null
  retailValue: string | null
  /** The line's values: purchase, dependent costs, cost, margin, without VAT, VAT. */
  values: {
    purchase: string
    dependent: string
    cost: string
    margin: string | null
    net: string | null
    vat: string | null
  }
}

export const CALCULATION_INPUTS: readonly CalculationInput[] = [
  {
    id: 'jogurt',
    item: 'Jogurt 2,8% m.m., 1 l',
    code: '8606012004417',
    unit: 'pc',
    quantity: '60',
    purchase: '118.00',
    dependent: '8.00',
    rate: '10',
    retail: '165.00',
  },
  {
    id: 'kiselo',
    item: 'Kiselo mleko, 0,5 l',
    code: '8606012004424',
    unit: 'pc',
    quantity: '40',
    purchase: '72.00',
    dependent: '8.00',
    rate: '10',
    retail: '99.00',
  },
  {
    id: 'sok',
    item: 'Sok od pomorandže, 0,25 l',
    code: '8606012009115',
    unit: 'pc',
    quantity: '48',
    purchase: '74.00',
    dependent: '8.00',
    rate: '20',
    retail: '120.00',
  },
  {
    id: 'voda',
    item: 'Voda negazirana, 0,5 l',
    code: '8606012009122',
    unit: 'pc',
    quantity: '96',
    purchase: '38.00',
    dependent: '8.00',
    rate: '20',
    retail: '66.00',
  },
  {
    id: 'cokoladno',
    item: 'Čokoladno mleko, 0,5 l',
    code: '8606012004431',
    unit: 'pc',
    quantity: '30',
    purchase: '96.00',
    dependent: '8.00',
    rate: '10',
    retail: '143.00',
  },
]

/** a / b rounded half up (away from zero), for b > 0. */
function divide(a: bigint, b: bigint): bigint {
  const negative = a < 0n
  const size = negative ? -a : a
  const result = (2n * size + b) / (2n * b)
  return negative ? -result : result
}

/** The application's calculation of one line. */
export function priceLine(input: CalculationInput): CalculationLine {
  const pieces = BigInt(input.quantity)
  const purchase = paras(input.purchase)
  const dependent = paras(input.dependent)
  const cost = purchase + dependent
  const values = {
    purchase: decimal(purchase * pieces),
    dependent: decimal(dependent * pieces),
    cost: decimal(cost * pieces),
  }
  if (input.retail === null) {
    return {
      ...input,
      cost: decimal(cost),
      marginPercent: null,
      margin: null,
      net: null,
      vat: null,
      retailValue: null,
      values: { ...values, margin: null, net: null, vat: null },
    }
  }
  const retail = paras(input.retail)
  const rate = BigInt(input.rate)
  const net = divide(retail * 100n, 100n + rate)
  const vat = retail - net
  const margin = net - cost
  // Hundredths of a percent: margin / cost × 100, two decimals.
  const percent = divide(margin * 10000n, cost)
  return {
    ...input,
    cost: decimal(cost),
    marginPercent: decimal(percent),
    margin: decimal(margin),
    net: decimal(net),
    vat: decimal(vat),
    retailValue: decimal(retail * pieces),
    values: {
      ...values,
      margin: decimal(margin * pieces),
      net: decimal(net * pieces),
      vat: decimal(vat * pieces),
    },
  }
}

export interface CalculationTotals {
  purchase: string
  dependent: string
  cost: string
  margin: string | null
  net: string | null
  vat: string | null
  retail: string | null
}

/** The application's totals; null while a line has no retail price. */
export function calculationTotals(lines: readonly CalculationLine[]): CalculationTotals {
  const sum = (pick: (line: CalculationLine) => string | null) => {
    const values = lines.map(pick)
    if (values.some((value) => value === null)) return null
    return decimal(sumUnits(values.map((value) => paras(value ?? '0'))))
  }
  return {
    purchase: sum((line) => line.values.purchase) ?? '0.00',
    dependent: sum((line) => line.values.dependent) ?? '0.00',
    cost: sum((line) => line.values.cost) ?? '0.00',
    margin: sum((line) => line.values.margin),
    net: sum((line) => line.values.net),
    vat: sum((line) => line.values.vat),
    retail: sum((line) => line.retailValue),
  }
}

/** The calculation as stated for the invoice's prices: what `calculationTotals` must give. */
export const CALCULATION_TOTALS: CalculationTotals = {
  purchase: '20040.00',
  dependent: '2192.00',
  cost: '22232.00',
  margin: '4348.00',
  net: '26580.00',
  vat: '3666.00',
  retail: '30246.00',
}

/** The VAT by rate: the base (without VAT) and the VAT of the lines at each rate. */
export function vatRecap(
  lines: readonly CalculationLine[],
): { rate: string; base: string | null; vat: string | null }[] {
  const rates = [...new Set(lines.map((line) => line.rate))]
  return rates.map((rate) => {
    const own = lines.filter((line) => line.rate === rate)
    const sum = (pick: (line: CalculationLine) => string | null) =>
      own.some((line) => pick(line) === null)
        ? null
        : decimal(sumUnits(own.map((line) => paras(pick(line) ?? '0'))))
    return { rate, base: sum((line) => line.values.net), vat: sum((line) => line.values.vat) }
  })
}

/** The recap as stated for the invoice's prices. */
export const VAT_RECAP = [
  { rate: '10', base: '16500.00', vat: '1650.00' },
  { rate: '20', base: '10080.00', vat: '2016.00' },
]

/** The application's warnings about a line, under its row. */
export function lineWarnings(line: CalculationLine): string[] {
  if (line.retail === null) return ['Enter the retail price.']
  if (line.margin?.startsWith('-') === true) {
    return ['The retail price is below the cost price: the margin is negative.']
  }
  return []
}

// ── The price change ──────────────────────────────────────────────────────────────────────────

/** What is on the shelf before the delivery, at the old retail price (the shop's records). */
export const ON_SHELF: Readonly<Record<string, { quantity: string; price: string }>> = {
  jogurt: { quantity: '14', price: '159.00' },
  kiselo: { quantity: '8', price: '95.00' },
  sok: { quantity: '20', price: '115.00' },
  voda: { quantity: '31', price: '66.00' },
  cokoladno: { quantity: '6', price: '149.00' },
}

export interface PriceChangeLine {
  id: string
  item: string
  unit: string
  quantity: string
  old: string
  change: string
  next: string
  /** On the shelf × the change, signed. */
  value: string
}

/** The application's price change: every line whose retail price differs from the shelf's. */
export function priceChanges(lines: readonly CalculationLine[]): PriceChangeLine[] {
  const changes: PriceChangeLine[] = []
  for (const line of lines) {
    const shelf = ON_SHELF[line.id]
    if (shelf === undefined || line.retail === null) continue
    const change = paras(line.retail) - paras(shelf.price)
    if (change === 0n) continue
    changes.push({
      id: line.id,
      item: line.item,
      unit: line.unit,
      quantity: shelf.quantity,
      old: shelf.price,
      change: decimal(change),
      next: line.retail,
      value: decimal(change * BigInt(shelf.quantity)),
    })
  }
  return changes
}

/** NIV-2026-0012's lines and totals as the application keeps them (the invoice's prices). */
export const PRICE_CHANGE_LINES: readonly PriceChangeLine[] = [
  {
    id: 'jogurt',
    item: 'Jogurt 2,8% m.m., 1 l',
    unit: 'pc',
    quantity: '14',
    old: '159.00',
    change: '6.00',
    next: '165.00',
    value: '84.00',
  },
  {
    id: 'kiselo',
    item: 'Kiselo mleko, 0,5 l',
    unit: 'pc',
    quantity: '8',
    old: '95.00',
    change: '4.00',
    next: '99.00',
    value: '32.00',
  },
  {
    id: 'sok',
    item: 'Sok od pomorandže, 0,25 l',
    unit: 'pc',
    quantity: '20',
    old: '115.00',
    change: '5.00',
    next: '120.00',
    value: '100.00',
  },
  {
    id: 'cokoladno',
    item: 'Čokoladno mleko, 0,5 l',
    unit: 'pc',
    quantity: '6',
    old: '149.00',
    change: '-6.00',
    next: '143.00',
    value: '-36.00',
  },
]

/** The VAT inside the change, by rate, and the totals: the application's. */
export const PRICE_CHANGE_TOTALS = {
  net: '156.06',
  vat10: '7.27',
  vat20: '16.67',
  total: '180.00',
}

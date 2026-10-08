/*
 * Story data for PeriodicRunPage and the payroll example: the September 2026 payroll of Kvadrat
 * Gradnja d.o.o., computed here in whole paras (BigInt) as the Core would. The rates and the
 * non-taxable amount are illustrative, not the law. Not part of the package (a *-story-data.ts
 * file). No classes here.
 */

/** One employee's payroll line, every amount a decimal string. */
export interface PayrollLine {
  id: string
  name: string
  position: string
  gross: string
  contributions: string
  tax: string
  net: string
  employer: string
}

/** The run's totals, every amount a decimal string. */
export interface PayrollTotals {
  employees: number
  gross: string
  contributions: string
  tax: string
  net: string
  employer: string
  /** What the company pays out in all: gross and the employer's contributions. */
  cost: string
}

/** Illustrative rates in basis points (1/100 of a percent). */
export const PAYROLL_RATES = {
  /** The employee's contributions: pension 14%, health 5.15%, unemployment 0.75%. */
  employee: [1400n, 515n, 75n],
  /** The employer's contributions: pension 10%, health 5.15%. */
  employer: [1000n, 515n],
  /** Income tax 10% of the gross less the non-taxable amount. */
  tax: 1000n,
  /** The monthly non-taxable amount, in paras (illustrative). */
  nonTaxable: 2842300n,
}

function decimal(paras: bigint): string {
  const sign = paras < 0n ? '-' : ''
  const abs = paras < 0n ? -paras : paras
  return `${sign}${String(abs / 100n)}.${String(abs % 100n).padStart(2, '0')}`
}

/** A share in basis points, rounded half up to whole paras (the Core's rounding). */
function share(paras: bigint, basisPoints: bigint): bigint {
  return (paras * basisPoints + 5000n) / 10000n
}

/** The people named in the shared example data come first; the rest are generated. */
const NAMED: { name: string; position: string; gross: bigint }[] = [
  { name: 'Nenad Kovačević', position: 'Director', gross: 42000000n },
  { name: 'Milica Petrović', position: 'Finance manager', gross: 31500000n },
  { name: 'Ivana Stojanović', position: 'Accountant', gross: 18950000n },
  { name: 'Jelena Marković', position: 'HR officer', gross: 16480000n },
  { name: 'Dragan Ilić', position: 'Sales representative', gross: 17325050n },
  { name: 'Snežana Popović', position: 'Site manager', gross: 26800000n },
  { name: 'Marko Đorđević', position: 'Warehouse keeper', gross: 11240075n },
]

const FIRST = [
  'Aleksandar',
  'Bojana',
  'Dušan',
  'Jovana',
  'Miloš',
  'Tamara',
  'Nikola',
  'Ana',
  'Lazar',
  'Marija',
  'Vladimir',
  'Katarina',
  'Petar',
  'Dragana',
  'Uroš',
  'Sanja',
  'Goran',
  'Milena',
  'Zoran',
  'Teodora',
]
const LAST = [
  'Jovanović',
  'Nikolić',
  'Pavlović',
  'Stanković',
  'Lazić',
  'Tomić',
  'Radovanović',
  'Milošević',
  'Savić',
  'Kostić',
  'Vasić',
  'Babić',
  'Simić',
]
const POSITIONS = [
  'Mason',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Machine operator',
  'Driver',
  'Site engineer',
  'Steel fixer',
]

/** The September 2026 payroll for `count` employees (46 in the example), repeatable. */
export function payrollLines(count = 46): PayrollLine[] {
  const people = [...NAMED]
  for (let index = 0; people.length < count; index += 1) {
    const name = `${FIRST[index % FIRST.length] ?? ''} ${LAST[(index * 7) % LAST.length] ?? ''}`
    people.push({
      name,
      position: POSITIONS[index % POSITIONS.length] ?? '',
      // From about 78.000,00 to about 160.000,00 RSD, with paras, never round.
      gross: 7800000n + BigInt((index * 173_311) % 8_200_000) + BigInt((index * 37) % 100),
    })
  }
  return people.slice(0, count).map((person, index) => {
    const contributions = PAYROLL_RATES.employee
      .map((rate) => share(person.gross, rate))
      .reduce((sum, value) => sum + value, 0n)
    const base = person.gross - PAYROLL_RATES.nonTaxable
    const tax = base > 0n ? share(base, PAYROLL_RATES.tax) : 0n
    const employer = PAYROLL_RATES.employer
      .map((rate) => share(person.gross, rate))
      .reduce((sum, value) => sum + value, 0n)
    return {
      id: `e${String(index + 1)}`,
      name: person.name,
      position: person.position,
      gross: decimal(person.gross),
      contributions: decimal(contributions),
      tax: decimal(tax),
      net: decimal(person.gross - contributions - tax),
      employer: decimal(employer),
    }
  })
}

function paras(value: string): bigint {
  const [whole = '0', fraction = '00'] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2))
}

/** The totals of the lines, summed in whole paras. */
export function payrollTotals(lines: readonly PayrollLine[]): PayrollTotals {
  const sum = (pick: (line: PayrollLine) => string) =>
    lines.reduce((total, line) => total + paras(pick(line)), 0n)
  const gross = sum((line) => line.gross)
  const employer = sum((line) => line.employer)
  return {
    employees: lines.length,
    gross: decimal(gross),
    contributions: decimal(sum((line) => line.contributions)),
    tax: decimal(sum((line) => line.tax)),
    net: decimal(sum((line) => line.net)),
    employer: decimal(employer),
    cost: decimal(gross + employer),
  }
}

/*
 * Story data for RegisterPage and StatutoryFormPage (P5.20): Kvadrat Gradnja d.o.o.'s
 * safety-training register for 2026 and a short illustrative tax form. Legal codes, field
 * numbers and texts are illustrative, not authoritative. Not part of the package: nothing in
 * src/index.ts imports this file. No classes here.
 */

import { expect, userEvent, waitFor, within } from 'storybook/test'
import { decimal, paras } from '../components/amounts-story-data'

/**
 * The register's spacing (P5.23), checked in the template's and the examples' stories alike:
 * the locks band meets the table's header, nothing between them.
 */
export async function expectLocksMeetTable(canvasElement: HTMLElement): Promise<void> {
  const locks = canvasElement.querySelector('[data-slot="register-locks"]')
  const header = canvasElement.querySelector('[data-slot="register-page"] thead')
  if (locks === null || header === null) throw new Error('No locks band or table header')
  const gap = header.getBoundingClientRect().top - locks.getBoundingClientRect().bottom
  await expect(Math.round(gap)).toBe(0)
}

/**
 * A correction link goes to the other entry (P5.23): pressing it focuses that entry's number,
 * drawn first when the register is virtualized.
 */
export async function expectCorrectionLink(
  canvasElement: HTMLElement,
  link: string,
  target: string,
): Promise<void> {
  await userEvent.click(within(canvasElement).getByRole('link', { name: link }))
  await waitFor(() => expect(document.activeElement?.textContent).toBe(target))
  await expect(document.activeElement?.closest('tr')).not.toBeNull()
}

export interface TrainingEntry {
  id: string
  no: string
  /** The day of the training, YYYY-MM-DD. */
  date: string
  employee: string
  position: string
  training: string
  instructor: string
  /** Valid until, YYYY-MM-DD. */
  validUntil: string
  corrects?: string
  correctedBy?: string
  locked?: boolean
}

const OFFICER = 'Zoran Babić'

/** Ten entries: January–June locked; no. 9 corrects no. 4. */
export const TRAINING: TrainingEntry[] = [
  {
    id: 't1',
    no: '1',
    date: '2026-01-12',
    employee: 'Marko Đorđević',
    position: 'Warehouse worker',
    training: 'Forklift operation',
    instructor: OFFICER,
    validUntil: '2029-01-12',
    locked: true,
  },
  {
    id: 't2',
    no: '2',
    date: '2026-01-12',
    employee: 'Goran Mitić',
    position: 'Driver',
    training: 'Securing loads',
    instructor: OFFICER,
    validUntil: '2029-01-12',
    locked: true,
  },
  {
    id: 't3',
    no: '3',
    date: '2026-02-09',
    employee: 'Dejan Savić',
    position: 'Mason',
    training: 'Work at height',
    instructor: OFFICER,
    validUntil: '2027-02-09',
    locked: true,
  },
  {
    id: 't4',
    no: '4',
    date: '2026-03-02',
    employee: 'Snežana Popović',
    position: 'Site manager',
    training: 'First aid, 8 hours',
    instructor: 'Dom zdravlja Novi Sad',
    validUntil: '2031-03-02',
    correctedBy: '9',
    locked: true,
  },
  {
    id: 't5',
    no: '5',
    date: '2026-04-20',
    employee: 'Stefan Lukić',
    position: 'Electrician',
    training: 'Electrical safety',
    instructor: OFFICER,
    validUntil: '2029-04-20',
    locked: true,
  },
  {
    id: 't6',
    no: '6',
    date: '2026-06-15',
    employee: 'Ivan Pavlović',
    position: 'Carpenter',
    training: 'Work at height',
    instructor: OFFICER,
    validUntil: '2027-06-15',
    locked: true,
  },
  {
    id: 't7',
    no: '7',
    date: '2026-07-06',
    employee: 'Milan Rakić',
    position: 'Tiler',
    training: 'Power tools',
    instructor: OFFICER,
    validUntil: '2029-07-06',
  },
  {
    id: 't8',
    no: '8',
    date: '2026-09-14',
    employee: 'Nemanja Vasić',
    position: 'Crane operator',
    training: 'Tower crane operation',
    instructor: 'Kran Servis Beograd',
    validUntil: '2028-09-14',
  },
  {
    id: 't9',
    no: '9',
    date: '2026-09-21',
    employee: 'Snežana Popović',
    position: 'Site manager',
    training: 'First aid, 16 hours',
    instructor: 'Dom zdravlja Novi Sad',
    validUntil: '2031-03-02',
    corrects: '4',
  },
  {
    id: 't10',
    no: '10',
    date: '2026-10-05',
    employee: 'Bojan Ristić',
    position: 'Site engineer',
    training: 'Fire safety',
    instructor: OFFICER,
    validUntil: '2029-10-05',
  },
]

const PEOPLE = [
  'Marko Đorđević',
  'Goran Mitić',
  'Dejan Savić',
  'Stefan Lukić',
  'Ivan Pavlović',
  'Milan Rakić',
  'Nemanja Vasić',
  'Bojan Ristić',
  'Petar Jović',
  'Aleksandar Kostić',
  'Nikola Tomić',
  'Uroš Lazić',
]
const COURSES = [
  'Work at height',
  'Forklift operation',
  'Fire safety',
  'Power tools',
  'First aid, 8 hours',
  'Securing loads',
]

/**
 * `count` generated entries over 2026 (the stress story); the first half of the year locked. The
 * tenth from last corrects no. 12, so the correction links cross thousands of entries.
 */
export function manyTraining(count: number): TrainingEntry[] {
  const corrector = String(count - 10)
  return Array.from({ length: count }, (_, index) => {
    const day = Math.floor((index * 365) / count)
    const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10)
    const until = `${String(2027 + (index % 3))}${date.slice(4)}`
    return {
      id: `m${String(index + 1)}`,
      no: String(index + 1),
      date,
      employee: PEOPLE[index % PEOPLE.length] ?? '',
      position: 'Construction worker',
      training: COURSES[index % COURSES.length] ?? '',
      instructor: OFFICER,
      validUntil: until,
      ...(date < '2026-07-01' ? { locked: true } : {}),
      ...(index === 11 ? { correctedBy: corrector } : {}),
      ...(String(index + 1) === corrector ? { corrects: '12' } : {}),
    }
  })
}

// ── An illustrative VAT return (StatutoryFormPage) ───────────────────────────────────────────

/** Decimal strings added in whole paras (the stories play the application; components never add). */
export function addAmounts(...values: readonly string[]): string {
  return decimal(values.reduce((total, value) => total + paras(value), 0n))
}

/** One amount less another, in whole paras. */
export function subtractAmount(value: string, less: string): string {
  return decimal(paras(value) - paras(less))
}

/** One fifth of an amount (VAT at 20%), exact in paras. */
export function fifth(value: string): string {
  const amount = paras(value)
  if (amount % 5n !== 0n) throw new Error(`${value} has no exact fifth`)
  return decimal(amount / 5n)
}

/** September 2026's sales at 20%: invoices of the dataset whose whole total is at 20%. */
export const SALES_20 = [
  {
    number: 'F-2026-0412',
    customer: 'Panonija Agro d.o.o.',
    date: '2026-09-28',
    base: '144920.00',
  },
  { number: 'F-2026-0411', customer: 'Drina Prevoz d.o.o.', date: '2026-09-26', base: '48700.00' },
  { number: 'F-2026-0409', customer: 'Stanić Elektro STR', date: '2026-09-22', base: '19932.00' },
  {
    number: 'F-2026-0407',
    customer: 'Bojović i sinovi d.o.o.',
    date: '2026-09-18',
    base: '78750.00',
  },
  { number: 'F-2026-0404', customer: 'Knjigovodstvo Jelić', date: '2026-09-12', base: '12000.00' },
  {
    number: 'F-2026-0403',
    customer: 'Panonija Agro d.o.o.',
    date: '2026-09-10',
    base: '206507.60',
  },
]

/** September 2026's purchases at 20%: supplier invoices received in September. */
export const PURCHASES_20 = [
  {
    number: 'UF-2026-1179',
    supplier: 'Beočinska fabrika cementa',
    date: '2026-09-27',
    base: '322000.00',
  },
  { number: 'UF-2026-1176', supplier: 'NIS a.d. Novi Sad', date: '2026-09-26', base: '22788.00' },
]

const base20 = addAmounts(...SALES_20.map((sale) => sale.base))
const vat20 = addAmounts(...SALES_20.map((sale) => fifth(sale.base)))
const outputVat = addAmounts(vat20, '850.00')
const inputVat = addAmounts(...PURCHASES_20.map((purchase) => fifth(purchase.base)))
/** Ivana Stojanović left out UF-2026-1179 (a query is open with the supplier). */
const inputVatOverride = fifth('22788.00')
const previousOutput = addAmounts('93650.00', '1240.00')

/** The return's values, September and August 2026 (August as filed). */
export const VAT_VALUES = {
  exempt: { current: '2700.00', previous: '1800.00' },
  base20: { current: base20, previous: '468250.00' },
  vat20: { current: vat20, previous: '93650.00' },
  base10: { current: '8500.00', previous: '12400.00' },
  vat10: { current: '850.00', previous: '1240.00' },
  totalBase: {
    current: addAmounts(base20, '8500.00'),
    previous: addAmounts('468250.00', '12400.00'),
  },
  totalVat: { current: outputVat, previous: previousOutput },
  inputBase: {
    current: addAmounts(...PURCHASES_20.map((purchase) => purchase.base)),
    previous: '301500.00',
  },
  inputVat: { current: inputVatOverride, computed: inputVat, previous: '60300.00' },
  inputTotal: { current: inputVat, previous: '60300.00' },
  payable: {
    current: subtractAmount(outputVat, inputVat),
    previous: subtractAmount(previousOutput, '60300.00'),
  },
  /** The failing check: 8e.6 (the books) against 8a.2 (overridden). */
  difference: subtractAmount(inputVat, inputVatOverride),
}

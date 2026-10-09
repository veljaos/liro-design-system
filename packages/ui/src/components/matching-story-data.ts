/*
 * Story data for MatchingView, and the small "application" the stories and the bank statement
 * example play: amounts in whole paras (BigInt), matches allocate what each side has left. The
 * Design System never does this; the Core does. Not part of the package (a *-story-data.ts file:
 * nothing in src/index.ts imports it, and styles.css skips it). No classes here.
 */

import { decimal, paras } from './amounts-story-data'

/** One line or open item, its amount in whole paras (negative for money going out). */
export interface MatchingEntry {
  id: string
  /** Plain text for assistive technology. */
  label: string
  title: string
  subtitle: string
  paras: bigint
}

/** One allocation of a match: how much of an entry it used. */
export interface Allocation {
  id: string
  paras: bigint
}

/** A match the application recorded. */
export interface MatchRecord {
  id: string
  left: Allocation[]
  right: Allocation[]
  /** How it was made, in the application's words ("Suggestion accepted", "Matched by hand"). */
  how: string
}

/** A decimal string from whole paras ("-1240.00"). */
export function decimalOf(paras: bigint): string {
  return decimal(paras)
}

/** Whole paras from a decimal string with two decimals ("135954.00"). */
export function parasOf(decimal: string): bigint {
  return paras(decimal)
}

export function sumParas(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n)
}

/** What an entry has left after the matches. */
export function remainingOf(
  entry: MatchingEntry,
  matches: readonly MatchRecord[],
  side: 'left' | 'right',
): bigint {
  const used = sumParas(
    matches
      .flatMap((match) => match[side].filter((each) => each.id === entry.id))
      .map((each) => each.paras),
  )
  return entry.paras - used
}

/** Allocates `amount` over the entries in order, each up to what it has left. */
function allocate(entries: readonly { id: string; left: bigint }[], amount: bigint): Allocation[] {
  const result: Allocation[] = []
  let rest = amount
  for (const entry of entries) {
    if (rest <= 0n) break
    const take = entry.left < rest ? entry.left : rest
    if (take > 0n) result.push({ id: entry.id, paras: take })
    rest -= take
  }
  return result
}

/**
 * The match of the chosen entries: the smaller of the two sides' totals is matched; the other
 * side keeps the rest (a partial match). Only incoming amounts (positive) are matched here.
 */
export function matchOf(
  id: string,
  left: readonly MatchingEntry[],
  right: readonly MatchingEntry[],
  matches: readonly MatchRecord[],
  how: string,
): MatchRecord {
  const leftLeft = left.map((entry) => ({
    id: entry.id,
    left: remainingOf(entry, matches, 'left'),
  }))
  const rightLeft = right.map((entry) => ({
    id: entry.id,
    left: remainingOf(entry, matches, 'right'),
  }))
  const leftTotal = sumParas(leftLeft.map((each) => each.left))
  const rightTotal = sumParas(rightLeft.map((each) => each.left))
  const amount = leftTotal < rightTotal ? leftTotal : rightTotal
  return { id, left: allocate(leftLeft, amount), right: allocate(rightLeft, amount), how }
}

/** The statement lines of the component stories: 6 October 2026, Banca Intesa. */
export const STATEMENT_LINES: MatchingEntry[] = [
  {
    id: 'l1',
    label: 'Line 1, Panonija Agro d.o.o.',
    title: 'Panonija Agro d.o.o.',
    subtitle: 'Line 1 · Ref. 97 F-2026-0412',
    paras: 13595400n,
  },
  {
    id: 'l2',
    label: 'Line 2, Drina Prevoz d.o.o.',
    title: 'Drina Prevoz d.o.o.',
    subtitle: 'Line 2 · Ref. F-2026-0411',
    paras: 5844000n,
  },
  {
    id: 'l3',
    label: 'Line 3, Medic Lab Niš d.o.o.',
    title: 'Medic Lab Niš d.o.o.',
    subtitle: 'Line 3 · Ref. F-2026-0410',
    paras: 5000000n,
  },
  {
    id: 'l4',
    label: 'Line 4, Zlatibor Turs d.o.o.',
    title: 'Zlatibor Turs d.o.o.',
    subtitle: 'Line 4 · No reference',
    paras: 3361280n,
  },
  {
    id: 'l5',
    label: 'Line 5, Petar Jovanović',
    title: 'Petar Jovanović',
    subtitle: 'Line 5 · “Uplata”',
    paras: 1200000n,
  },
]

/** The open invoices the lines are matched against. */
export const OPEN_INVOICES: MatchingEntry[] = [
  {
    id: 'r1',
    label: 'F-2026-0412, Panonija Agro d.o.o.',
    title: 'F-2026-0412',
    subtitle: 'Panonija Agro d.o.o. · due 13.10.2026.',
    paras: 13595400n,
  },
  {
    id: 'r2',
    label: 'F-2026-0411, Drina Prevoz d.o.o.',
    title: 'F-2026-0411',
    subtitle: 'Drina Prevoz d.o.o. · due 03.10.2026.',
    paras: 5844000n,
  },
  {
    id: 'r3',
    label: 'F-2026-0410, Medic Lab Niš d.o.o.',
    title: 'F-2026-0410',
    subtitle: 'Medic Lab Niš d.o.o. · due 25.10.2026.',
    paras: 8642035n,
  },
  {
    id: 'r4',
    label: 'F-2026-0406, Zlatibor Turs d.o.o.',
    title: 'F-2026-0406',
    subtitle: 'Zlatibor Turs d.o.o. · due 17.10.2026.',
    paras: 3361280n,
  },
  {
    id: 'r5',
    label: 'F-2026-0403, Panonija Agro d.o.o.',
    title: 'F-2026-0403',
    subtitle: 'Panonija Agro d.o.o. · due 10.10.2026.',
    paras: 24780912n,
  },
]

/** A suggestion of the Core: which entries, and why, in words. */
export interface SuggestionRecord {
  id: string
  left: string[]
  right: string[]
  confidence: string
}

export const SUGGESTIONS: SuggestionRecord[] = [
  { id: 's1', left: ['l1'], right: ['r1'], confidence: 'Exact: amount and reference' },
  { id: 's2', left: ['l2'], right: ['r2'], confidence: 'Exact: amount and reference' },
  { id: 's3', left: ['l3'], right: ['r3'], confidence: 'Likely: reference, part of the amount' },
  { id: 's4', left: ['l4'], right: ['r4'], confidence: 'Likely: amount and payer' },
]

/** 5,000 generated open items for the "Large list" story: repeatable names and amounts. */
export function manyOpenItems(count: number): MatchingEntry[] {
  const customers = [
    'Panonija Agro d.o.o.',
    'Drina Prevoz d.o.o.',
    'Medic Lab Niš d.o.o.',
    'Bojović i sinovi d.o.o.',
    'Vojvođanka Mlin a.d.',
    'Stanić Elektro STR',
    'Rakić Pekara SZR',
  ]
  return Array.from({ length: count }, (_, index) => {
    const number = `F-2025-${String(index + 1).padStart(4, '0')}`
    const customer = customers[index % customers.length] ?? ''
    const paras = BigInt(1000000 + ((index * 7919) % 25000000) + (index % 100))
    return {
      id: `g${String(index)}`,
      label: `${number}, ${customer}`,
      title: number,
      subtitle: customer,
      paras,
    }
  })
}

/*
 * Group BB's example data (P5.57, stocktaking lists): Kvadrat Gradnja d.o.o.'s quarterly
 * stocktaking POP-2026-02 of Central warehouse at 13.10.2026, on 14.10.2026 at 09:40. The
 * commission (Dragan Ilić, chair; Marija Đurić; Milica Petrović) counted every location
 * yesterday with the handheld (group I's StockCount, a blind count: the books' quantities are not
 * shown while counting); two members have signed the list, Milica has not yet. The book
 * quantities are the item card's (group AY, data-AY.ts: 460 bags of cement on 13.10.); each
 * line's difference, its value at average cost and the totals are the application's, written as
 * decimal strings — the screens compute nothing. Posting the differences is the application's
 * work too: the screen only asks and reports. Invented data. Not part of the package. No classes
 * here.
 */
import type { Signer } from '@veljaos/ui'
import { ITEM } from './data-AY'

export const BB_TODAY = '2026-10-14'

export const STOCKTAKING = {
  number: 'POP-2026-02',
  title: 'Stocktaking POP-2026-02',
  kind: 'Quarterly stocktaking',
  warehouse: 'Central warehouse',
  /** The day it was counted: the book quantities are this day's closing. */
  at: '2026-10-13',
  decision: 'Decision 12/2026 of 01.10.2026. by Nenad Kovačević, director',
  /** The documents the application writes when the differences are posted. */
  surplusDocument: 'VI-2026-004',
  shortageDocument: 'MA-2026-004',
}

const BASE = `/inventory/stocktaking/${STOCKTAKING.number}`

export const BB_ROUTES = {
  list: BASE,
  /** Every member has signed: the differences may be posted. */
  signed: `${BASE}?signed`,
  /** "Post differences…" asked. */
  post: `${BASE}?post`,
  /** Posted. */
  posted: `${BASE}?posted`,
  /** The handheld counting location A-02. */
  count: `${BASE}/count`,
}

/** The list's states, in the application's words, in their order. */
export const STOCKTAKING_STEPS = ['Counting', 'Awaiting signatures', 'Signed', 'Posted'] as const
export type StocktakingState = (typeof STOCKTAKING_STEPS)[number]

export interface StocktakingLine {
  id: string
  location: string
  item: string
  code: string
  unit: string
  /** The books' quantity at the end of the day counted. */
  book: string
  counted: string
  /** Counted − book, signed: a surplus (+) or a shortage (−). The application's. */
  difference: string
  /** The average cost on that day. */
  cost: string
  /** The difference's value at cost, signed. */
  differenceValue: string
  /** The commission's note. */
  note?: string
}

export const STOCKTAKING_LINES: readonly StocktakingLine[] = [
  {
    id: 'l1',
    location: 'A-01',
    item: ITEM.name,
    code: ITEM.code,
    unit: ITEM.unit,
    book: '460',
    counted: '456',
    difference: '-4',
    cost: '700.00',
    differenceValue: '-2800.00',
    note: 'Four torn bags thrown away by the storekeeper on 10.10.',
  },
  {
    id: 'l2',
    location: 'A-01',
    item: 'Lepak za pločice C2TE, 25 kg',
    code: '8600981000118',
    unit: 'bag',
    book: '74',
    counted: '74',
    difference: '0',
    cost: '890.00',
    differenceValue: '0.00',
  },
  {
    id: 'l3',
    location: 'A-02',
    item: 'Armaturna mreža Q188, 2,15 × 6 m',
    code: '8600981000231',
    unit: 'pc',
    book: '86',
    counted: '88',
    difference: '2',
    cost: '1450.00',
    differenceValue: '2900.00',
    note: 'Two sheets were stored with Q131.',
  },
  {
    id: 'l4',
    location: 'A-02',
    item: 'Armaturna mreža Q131, 2,15 × 6 m',
    code: '8600981000125',
    unit: 'pc',
    book: '2',
    counted: '0',
    difference: '-2',
    cost: '1180.00',
    differenceValue: '-2360.00',
    note: 'The two sheets are Q188 (line above).',
  },
  {
    id: 'l5',
    location: 'A-02',
    item: 'Vezivna žica 1,2 mm, 25 kg',
    code: '8600981000248',
    unit: 'roll',
    book: '9',
    counted: '9',
    difference: '0',
    cost: '2150.00',
    differenceValue: '0.00',
  },
  {
    id: 'l6',
    location: 'B-01',
    item: 'Hidroizolaciona traka, rolna 10 m',
    code: '8600981000132',
    unit: 'roll',
    book: '3',
    counted: '3',
    difference: '0',
    cost: '1320.00',
    differenceValue: '0.00',
  },
  {
    id: 'l7',
    location: 'B-01',
    item: 'Silikon građevinski, beli, 300 ml',
    code: '8600981000194',
    unit: 'pc',
    book: '48',
    counted: '45',
    difference: '-3',
    cost: '410.00',
    differenceValue: '-1230.00',
    note: 'Three tubes dried out; kept aside for the write-off.',
  },
  {
    id: 'l8',
    location: 'C-01',
    item: 'UW profil 50 mm, 3 m',
    code: '8600981000170',
    unit: 'pc',
    book: '140',
    counted: '140',
    difference: '0',
    cost: '265.00',
    differenceValue: '0.00',
  },
]

/** The application's totals of the lines above. */
export const STOCKTAKING_TOTALS = {
  lines: 8,
  withDifference: 4,
  bookValue: '595010.00',
  countedValue: '591520.00',
  surplus: '2900.00',
  shortage: '-6390.00',
  difference: '-3490.00',
  surplusItems: 1,
  shortageItems: 3,
}

/** The commission, in the order they sign; Milica is the one using the application. */
export const COMMISSION: readonly Signer[] = [
  {
    id: 'ilic',
    name: 'Dragan Ilić',
    role: 'Chair of the commission',
    state: 'signed',
    at: '2026-10-13T16:10:00+02:00',
  },
  {
    id: 'djuric',
    name: 'Marija Đurić',
    role: 'Member',
    state: 'signed',
    at: '2026-10-13T16:25:00+02:00',
  },
  {
    id: 'petrovic',
    name: 'Milica Petrović',
    role: 'Member',
    state: 'waiting',
    current: true,
  },
]

/** Milica's signature as the signing service records it. */
export const MILICA_SIGNED_AT = '2026-10-14T09:40:00+02:00'

// ── The count on the handheld (location A-02) ─────────────────────────────────────────────────

export const COUNT_AT_A02 = {
  title: STOCKTAKING.title,
  subtitle: 'Central warehouse · counted by Dragan Ilić and Marija Đurić',
  location: 'A-02',
  locationName: 'Rack A2, reinforcement',
}

/** A blind count: the books' quantities are not shown while counting. */
export interface BlindCount {
  id: string
  item: string
  itemCode: string
  unit: string
  counted: string | null
}

export const A02_COUNTS: readonly BlindCount[] = [
  {
    id: 'l3',
    item: 'Armaturna mreža Q188, 2,15 × 6 m',
    itemCode: '8600981000231',
    unit: 'pc',
    counted: '88',
  },
  {
    id: 'l4',
    item: 'Armaturna mreža Q131, 2,15 × 6 m',
    itemCode: '8600981000125',
    unit: 'pc',
    counted: '0',
  },
  {
    id: 'l5',
    item: 'Vezivna žica 1,2 mm, 25 kg',
    itemCode: '8600981000248',
    unit: 'roll',
    counted: null,
  },
]

/** The item in front: the Q188 sheets just counted. */
export const A02_CURRENT = 'l3'

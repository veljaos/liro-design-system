import type { ConfirmReason } from './confirm-dialog'
import type { CountItem } from '../templates/stock-count'
import type { PickLine } from '../templates/pick-list'

/*
 * Story data of the warehouse (P5.11): Magacin Novi Sad picking an order for Kvadrat Gradnja,
 * and counting a zone (fictitious). English interface text, Serbian data; quantities are decimal
 * strings and every difference is the application's. Not part of the package: nothing in
 * src/index.ts imports this file. No classes here.
 */

export const PICK_TITLE = 'Pick list PL-2026-0412'
export const PICK_SUBTITLE = 'Kvadrat Gradnja · Magacin Novi Sad'

export const PICK_LINES: readonly PickLine[] = [
  {
    id: 'l1',
    location: 'A-01-02',
    item: 'Cement CEM II/B-M 42,5R, 25 kg',
    itemCode: '3870012500018',
    quantity: '40',
    picked: '40',
    unit: 'bag',
    state: 'picked',
  },
  {
    id: 'l2',
    location: 'A-01-05',
    item: 'Građevinski lepak CM 11, 25 kg',
    itemCode: '3870012500025',
    quantity: '12',
    picked: '12',
    unit: 'bag',
    state: 'picked',
  },
  {
    id: 'l3',
    location: 'A-03-01',
    item: 'Armaturna mreža Q188, 2,15 × 6 m',
    itemCode: '3870012500032',
    quantity: '10',
    picked: '8',
    unit: 'pc',
    state: 'short',
    note: 'Only 8 on the shelf',
  },
  {
    id: 'l4',
    location: 'B-02-04',
    item: 'Hidroizolacija bitumenska, 18 kg',
    itemCode: '3870012500049',
    quantity: '3',
    picked: null,
    unit: 'pc',
    state: 'skipped',
    note: 'Damaged packaging',
  },
  {
    id: 'l5',
    location: 'B-04-02',
    item: 'Fasadna mrežica 160 g/m², rolna 50 m',
    itemCode: '3870012500056',
    quantity: '6',
    picked: null,
    unit: 'roll',
    state: 'open',
  },
  {
    id: 'l6',
    location: 'C-01-01',
    item: 'Gips ploča 12,5 mm, 1200 × 2000',
    itemCode: '3870012500063',
    quantity: '24',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
  {
    id: 'l7',
    location: 'C-01-03',
    item: 'CW profil 50 mm, 3 m',
    itemCode: '3870012500070',
    quantity: '30',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
  {
    id: 'l8',
    location: 'C-02-02',
    item: 'Šrafovi za gips 3,5 × 25 mm',
    itemCode: '3870012500087',
    quantity: '5',
    picked: null,
    unit: 'box',
    state: 'open',
  },
  {
    id: 'l9',
    location: 'D-01-01',
    item: 'Silikon sanitarni, providni',
    itemCode: '3870012500094',
    quantity: '12',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
  {
    id: 'l10',
    location: 'D-03-05',
    item: 'Bitumenska traka 4 mm',
    itemCode: '3870012500100',
    quantity: '8',
    picked: null,
    unit: 'roll',
    state: 'open',
  },
  {
    id: 'l11',
    location: 'E-01-02',
    item: 'Pesak 0–4 mm, rinfuz',
    itemCode: '3870012500117',
    quantity: '1.5',
    picked: null,
    unit: 't',
    state: 'open',
  },
  {
    id: 'l12',
    location: 'E-02-01',
    item: 'Kolica građevinska 80 l',
    itemCode: '3870012500124',
    quantity: '1',
    picked: null,
    unit: 'pc',
    state: 'open',
  },
]

/** Every line done: the end of the route. */
export const PICK_LINES_DONE: readonly PickLine[] = PICK_LINES.map((line) =>
  line.state === 'open' ? { ...line, picked: line.quantity, state: 'picked' } : line,
)

export const SKIP_REASONS: readonly ConfirmReason[] = [
  { value: 'missing', label: 'Not on the shelf' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong', label: 'A different item at the location' },
  { value: 'other', label: 'Other' },
]

export const COUNT_TITLE = 'Inventory 2026 · Zone B'
export const COUNT_SUBTITLE = 'Magacin Novi Sad'

export const COUNT_ITEMS: readonly CountItem[] = [
  {
    id: 'i1',
    item: 'Fasadna mrežica 160 g/m², rolna 50 m',
    itemCode: '3870012500056',
    unit: 'roll',
    counted: '5',
    expected: '6',
    difference: '-1',
    differenceTone: 'warning',
  },
  {
    id: 'i2',
    item: 'Silikon sanitarni, providni',
    itemCode: '3870012500094',
    unit: 'pc',
    counted: '12',
    expected: '12',
    difference: '0',
  },
  {
    id: 'i3',
    item: 'Gips ploča 12,5 mm, 1200 × 2000',
    itemCode: '3870012500063',
    unit: 'pc',
    counted: '26',
    expected: '24',
    difference: '2',
    differenceTone: 'warning',
  },
  {
    id: 'i4',
    item: 'Hidroizolacija bitumenska, 18 kg',
    itemCode: '3870012500049',
    unit: 'pc',
    counted: '0',
    expected: '3',
    difference: '-3',
    differenceTone: 'danger',
    note: 'Three damaged packages were moved to the returns area.',
  },
]

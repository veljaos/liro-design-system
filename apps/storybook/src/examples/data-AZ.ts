/*
 * Group AZ's example data (P5.52, production): Pekara Zlatni klas (the bakery of group I's till)
 * on 14.10.2026 at 09:40. The bill of materials of its rye bread (Raženi hleb, 400 g; a batch of
 * 200 loaves) with the rye sourdough starter — a semi-finished good with its own bill —, the work
 * order RN-2026-0158 baked last night (planned against used material, good loaves and scrap), and
 * the production plan of the two weeks on its three lines (bread, pastry, cakes). Quantities and
 * costs are the application's, written as decimal strings: the bills' costs, the planned and used
 * figures, their differences and values, the cost per piece. The screens compute nothing.
 * English interface text, Serbian data; invented throughout. Not part of the package. No classes
 * here.
 */
import type { ShellCompany } from '@veljaos/ui'
import { BAKERY } from './data-I'

/** The bakery as the back office's company switcher shows it (groups AZ and BA). */
export const BAKERY_COMPANY: ShellCompany = {
  id: 'zlatni-klas',
  name: BAKERY.name,
  description: BAKERY.address,
}

/** Jovana Marković runs the bakery (the contact of helpdesk ticket #4822, group S). */
export const BAKERY_OWNER = {
  name: 'Jovana Marković',
  email: 'jovana@zlatniklas.example',
}

// ── Bills of materials ────────────────────────────────────────────────────────────────────────

// ── Work order RN-2026-0158 ───────────────────────────────────────────────────────────────────

export interface MaterialLine {
  id: string
  item: string
  code: string
  unit: string
  planned: string
  /** Used − planned, signed. */
  difference: string
  used: string
  /** The difference's value at cost, signed. */
  differenceValue: string
  note?: string
}

export const MATERIALS: readonly MaterialLine[] = [
  {
    id: 'rye',
    item: 'Raženo brašno T-1150',
    code: 'M-101',
    unit: 'kg',
    planned: '88',
    difference: '2.5',
    used: '90.5',
    differenceValue: '195.00',
    note: 'The first dough was too soft; flour added.',
  },
  {
    id: 'wheat',
    item: 'Pšenično brašno T-500',
    code: 'M-102',
    unit: 'kg',
    planned: '40',
    difference: '0',
    used: '40',
    differenceValue: '0.00',
  },
  {
    id: 's1',
    item: 'Kiselo testo, raženo',
    code: 'P-004',
    unit: 'kg',
    planned: '48',
    difference: '0',
    used: '48',
    differenceValue: '0.00',
    note: 'From work order RN-2026-0157.',
  },
  {
    id: 'water',
    item: 'Voda',
    code: 'M-109',
    unit: 'l',
    planned: '76',
    difference: '2',
    used: '78',
    differenceValue: '1.00',
  },
  {
    id: 'salt',
    item: 'So, sitna',
    code: 'M-110',
    unit: 'kg',
    planned: '3.2',
    difference: '0',
    used: '3.2',
    differenceValue: '0.00',
  },
  {
    id: 'yeast',
    item: 'Kvasac, sveži',
    code: 'M-111',
    unit: 'kg',
    planned: '0.8',
    difference: '0.05',
    used: '0.85',
    differenceValue: '19.00',
  },
  {
    id: 'caraway',
    item: 'Kim',
    code: 'M-118',
    unit: 'kg',
    planned: '0.4',
    difference: '0',
    used: '0.4',
    differenceValue: '0.00',
  },
  {
    id: 'bag',
    item: 'Kesa za hleb, 400 g',
    code: 'A-012',
    unit: 'pc',
    planned: '400',
    difference: '-14',
    used: '386',
    differenceValue: '-63.00',
    note: 'One bag a good loaf.',
  },
]

// ── The production plan ───────────────────────────────────────────────────────────────────────

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
import type { GanttDependency, GanttTask } from '../../../../packages/ui/src/gantt'
import { BAKERY } from './data-I'

export const AZ_TODAY = '2026-10-14'
export const AZ_NOW = '09:40'

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

export const AZ_ROUTES = {
  bom: '/production/boms/SAS-0012',
  /** The starter's own bill. */
  starter: '/production/boms/SAS-0004',
  workOrder: '/production/work-orders/RN-2026-0158',
  plan: '/production/plan',
}

// ── Bills of materials ────────────────────────────────────────────────────────────────────────

export interface Component {
  quantity: string
  unit: string
  kind: 'Material' | 'Semi-finished' | 'Packaging'
  /** The component's cost for the batch, the application's. */
  cost: string
}

export interface BomNode {
  id: string
  label: string
  code: string
  description?: string
  data: Component
  children?: readonly BomNode[]
}

export interface Bom {
  number: string
  product: string
  code: string
  version: string
  validFrom: string
  batch: { quantity: string; unit: string }
  cost: string
  costPerUnit: string
  /** The unit the cost per unit is for ("loaf", "kg"). */
  per: string
  nodes: readonly BomNode[]
  /** The bills it is part of (a semi-finished good's). */
  usedIn?: readonly { number: string; product: string }[]
}

const STARTER_NODES: readonly BomNode[] = [
  {
    id: 's1-flour',
    label: 'Raženo brašno T-1150',
    code: 'M-101',
    data: { quantity: '12', unit: 'kg', kind: 'Material', cost: '936.00' },
  },
  {
    id: 's1-water',
    label: 'Voda',
    code: 'M-109',
    data: { quantity: '12', unit: 'l', kind: 'Material', cost: '6.00' },
  },
]

export const BOMS: readonly Bom[] = [
  {
    number: 'SAS-0012',
    product: 'Raženi hleb, 400 g',
    code: 'P-012',
    version: '3',
    validFrom: '2026-09-01',
    batch: { quantity: '200', unit: 'pc' },
    cost: '7007.00',
    costPerUnit: '35.04',
    per: 'loaf',
    nodes: [
      {
        id: 'rye',
        label: 'Raženo brašno T-1150',
        code: 'M-101',
        data: { quantity: '44', unit: 'kg', kind: 'Material', cost: '3432.00' },
      },
      {
        id: 'wheat',
        label: 'Pšenično brašno T-500',
        code: 'M-102',
        data: { quantity: '20', unit: 'kg', kind: 'Material', cost: '1240.00' },
      },
      {
        id: 's1',
        label: 'Kiselo testo, raženo',
        code: 'P-004',
        description: 'Semi-finished, its own bill SAS-0004',
        data: { quantity: '24', unit: 'kg', kind: 'Semi-finished', cost: '942.00' },
        children: STARTER_NODES,
      },
      {
        id: 'water',
        label: 'Voda',
        code: 'M-109',
        data: { quantity: '38', unit: 'l', kind: 'Material', cost: '19.00' },
      },
      {
        id: 'salt',
        label: 'So, sitna',
        code: 'M-110',
        data: { quantity: '1.6', unit: 'kg', kind: 'Material', cost: '72.00' },
      },
      {
        id: 'yeast',
        label: 'Kvasac, sveži',
        code: 'M-111',
        data: { quantity: '0.4', unit: 'kg', kind: 'Material', cost: '152.00' },
      },
      {
        id: 'caraway',
        label: 'Kim',
        code: 'M-118',
        data: { quantity: '0.2', unit: 'kg', kind: 'Material', cost: '250.00' },
      },
      {
        id: 'bag',
        label: 'Kesa za hleb, 400 g',
        code: 'A-012',
        data: { quantity: '200', unit: 'pc', kind: 'Packaging', cost: '900.00' },
      },
    ],
  },
  {
    number: 'SAS-0004',
    product: 'Kiselo testo, raženo',
    code: 'P-004',
    version: '1',
    validFrom: '2025-03-01',
    batch: { quantity: '24', unit: 'kg' },
    cost: '942.00',
    costPerUnit: '39.25',
    per: 'kg',
    nodes: STARTER_NODES,
    usedIn: [{ number: 'SAS-0012', product: 'Raženi hleb, 400 g' }],
  },
]

/** The steps of the rye bread, as the bakery's routing has them. */
export const ROUTING: readonly { id: string; step: string; place: string; minutes: string }[] = [
  { id: 'o1', step: 'Mixing', place: 'Spiral mixer 1', minutes: '20' },
  { id: 'o2', step: 'Bulk proofing', place: 'Proofing room', minutes: '60' },
  { id: 'o3', step: 'Dividing and shaping', place: 'Bread line', minutes: '30' },
  { id: 'o4', step: 'Final proofing', place: 'Proofing room', minutes: '90' },
  { id: 'o5', step: 'Baking at 230 °C', place: 'Oven 1', minutes: '45' },
  { id: 'o6', step: 'Cooling and packing', place: 'Packing table', minutes: '60' },
]

// ── Work order RN-2026-0158 ───────────────────────────────────────────────────────────────────

export const WORK_ORDER_STATES = [
  'Planned',
  'Released',
  'In production',
  'Completed',
  'Posted',
] as const
export type WorkOrderState = (typeof WORK_ORDER_STATES)[number]

export const WORK_ORDER = {
  number: 'RN-2026-0158',
  product: 'Raženi hleb, 400 g',
  bom: 'SAS-0012',
  batches: '2',
  line: 'Bread line · Oven 1',
  shift: 'Night shift, Petar Nikolić',
  date: '2026-10-14',
  started: '02:00',
  finished: '07:10',
  state: 'Completed' as WorkOrderState,
  planned: '400',
  good: '386',
  scrap: '14',
  unit: 'pc',
  /** Scrap as a share of the planned quantity, the application's. */
  scrapShare: '3.5',
  plannedCostPerPiece: '35.04',
  actualCostPerPiece: '36.70',
  /** Where the good loaves went. */
  receivedInto: 'Finished goods, shop Bulevar oslobođenja 46',
}

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

/** The application's totals of the materials' value. */
export const MATERIAL_TOTALS = {
  planned: '14014.00',
  difference: '152.00',
  used: '14166.00',
}

export interface OutputLine {
  id: string
  kind: 'Good' | 'Scrap'
  text: string
  quantity: string
  unit: string
  /** Where it went, or why it is scrap. */
  note: string
}

export const OUTPUT: readonly OutputLine[] = [
  {
    id: 'good',
    kind: 'Good',
    text: 'Raženi hleb, 400 g',
    quantity: '386',
    unit: 'pc',
    note: WORK_ORDER.receivedInto,
  },
  {
    id: 'burnt',
    kind: 'Scrap',
    text: 'Burnt',
    quantity: '9',
    unit: 'pc',
    note: 'Oven 1, tray 6: the top heater ran hot. Reported to maintenance.',
  },
  {
    id: 'shape',
    kind: 'Scrap',
    text: 'Misshapen',
    quantity: '5',
    unit: 'pc',
    note: 'Torn in the final proofing; sold as crumbs.',
  },
]

// ── The production plan ───────────────────────────────────────────────────────────────────────

const line = (id: string, label: string, start: string, end: string): GanttTask => ({
  id,
  label,
  kind: 'phase',
  start,
  end,
})

const order = (
  id: string,
  parent: string,
  label: string,
  start: string,
  end: string,
  progress: string,
  assignee: string,
  extra: Partial<GanttTask> = {},
): GanttTask => ({ id, parent, label, start, end, progress, assignee, ...extra })

export const PLAN_LABEL = 'Production plan, 12.–25.10.2026.'

export const PLAN_TASKS: GanttTask[] = [
  line('bread', 'Bread line · Oven 1', '2026-10-12', '2026-10-20'),
  order(
    'rn-0151',
    'bread',
    'RN-2026-0151 Beli hleb 500 g, 1.200 pc',
    '2026-10-12',
    '2026-10-13',
    '100',
    'Night shift',
  ),
  order(
    'rn-0157',
    'bread',
    'RN-2026-0157 Kiselo testo, raženo, 48 kg',
    '2026-10-13',
    '2026-10-13',
    '100',
    'Day shift',
  ),
  order(
    'rn-0158',
    'bread',
    'RN-2026-0158 Raženi hleb 400 g, 400 pc',
    '2026-10-14',
    '2026-10-14',
    '100',
    'Night shift',
  ),
  order(
    'rn-0162',
    'bread',
    'RN-2026-0162 Integralni hleb 400 g, 600 pc',
    '2026-10-15',
    '2026-10-16',
    '0',
    'Night shift',
  ),
  order(
    'rn-0166',
    'bread',
    'RN-2026-0166 Kukuruzni hleb 450 g, 500 pc',
    '2026-10-19',
    '2026-10-20',
    '0',
    'Night shift',
  ),
  line('pastry', 'Pastry line · Oven 2', '2026-10-12', '2026-10-22'),
  order(
    'rn-0152',
    'pastry',
    'RN-2026-0152 Kifla, 3.000 pc',
    '2026-10-12',
    '2026-10-14',
    '70',
    'Night shift',
  ),
  order(
    'rn-0159',
    'pastry',
    'RN-2026-0159 Kroasan sa čokoladom, 800 pc',
    '2026-10-14',
    '2026-10-15',
    '20',
    'Day shift',
    { state: { label: 'Waiting for chocolate', tone: 'warning' } },
  ),
  order(
    'rn-0163',
    'pastry',
    'RN-2026-0163 Perec sa susamom, 1.000 pc',
    '2026-10-16',
    '2026-10-17',
    '0',
    'Day shift',
  ),
  order(
    'rn-0167',
    'pastry',
    'RN-2026-0167 Burek sa sirom, 600 pc',
    '2026-10-21',
    '2026-10-22',
    '0',
    'Night shift',
  ),
  line('cakes', 'Cakes · Oven 3', '2026-10-13', '2026-10-23'),
  order(
    'rn-0154',
    'cakes',
    'RN-2026-0154 Krempita, 240 pc',
    '2026-10-13',
    '2026-10-14',
    '50',
    'Ivana Lukić, pastry chef',
  ),
  order(
    'rn-0164',
    'cakes',
    'RN-2026-0164 Reforma torta, 12 cakes',
    '2026-10-16',
    '2026-10-16',
    '0',
    'Ivana Lukić, pastry chef',
  ),
  order(
    'rn-0168',
    'cakes',
    'RN-2026-0168 Reforma torta, 40 cakes',
    '2026-10-21',
    '2026-10-22',
    '0',
    'Ivana Lukić, pastry chef',
  ),
  {
    id: 'fruska',
    parent: 'cakes',
    label: 'Delivery to Hotel Fruška',
    kind: 'milestone',
    start: '2026-10-23',
    end: '2026-10-23',
  },
]

export const PLAN_DEPENDENCIES: GanttDependency[] = [
  { id: 'd1', from: 'rn-0157', to: 'rn-0158' },
  { id: 'd2', from: 'rn-0168', to: 'fruska' },
]

/** The application's figures above the plan. */
export const PLAN_FIGURES = {
  orders: '12',
  done: '3',
  waiting: '1',
}

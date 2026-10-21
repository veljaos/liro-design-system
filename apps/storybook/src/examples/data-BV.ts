/*
 * Group BV's dataset (P5.81, the customizable dashboard): Nenad Kovačević's overview of Kvadrat
 * Gradnja d.o.o. on 14 October 2026 at 09:40. The cards are the application's catalogue; each
 * card's figures are the ones the other groups already show — receivables (group X), the main
 * cash desk (group AM), the budget 2026 (group AR), Residential building Liman 4 (group AA) — so
 * the same figure reads the same everywhere. The layouts (which cards, their order and size) are
 * the user's, saved by the application; nothing here adds up or compares a figure.
 */

export const BV_TODAY = '2026-10-14'

export const BV_ROUTES = {
  overview: '/analytics/overview',
  /** The second saved layout chosen. */
  monthEnd: '/analytics/overview?layout=month-end',
  /** "Customize": the editing mode, as the application restores it. */
  editing: '/analytics/overview?edit=1',
  /** "Add card" open in the editing mode. */
  adding: '/analytics/overview?edit=1&add=1',
  /** "Save as…" asked for a name. */
  saveAs: '/analytics/overview?save-as=1',
  /** "Delete…" asked on Month end. */
  deleting: '/analytics/overview?layout=month-end&delete=1',
} as const

/** The sizes the application offers: how many of the four columns a card takes. */
export const SIZES = [
  { id: 'small', label: 'Small', columns: 1 },
  { id: 'medium', label: 'Medium', columns: 2 },
  { id: 'large', label: 'Large', columns: 3 },
  { id: 'full', label: 'Full width', columns: 4 },
] as const

export type CardKind = 'Figure' | 'Chart' | 'Table' | 'Progress'

/** A card of the application's catalogue. */
export interface CatalogueCard {
  id: string
  name: string
  description: string
  kind: CardKind
  /** The size it is added at. */
  size: string
  /** The sizes it may take; all when absent. */
  sizes?: readonly string[]
}

export const CATALOGUE: readonly CatalogueCard[] = [
  {
    id: 'receivables',
    name: 'Open receivables',
    description: 'What customers owe today, and how many invoices.',
    kind: 'Figure',
    size: 'small',
    sizes: ['small', 'medium'],
  },
  {
    id: 'overdue',
    name: 'Overdue more than 30 days',
    description: 'Receivables more than 30 days late.',
    kind: 'Figure',
    size: 'small',
    sizes: ['small', 'medium'],
  },
  {
    id: 'cash',
    name: 'Main cash desk',
    description: 'The cash today against the desk’s limit.',
    kind: 'Figure',
    size: 'small',
    sizes: ['small', 'medium'],
  },
  {
    id: 'budget-used',
    name: 'Budget used',
    description: 'Budget 2026, January–September: actual against plan.',
    kind: 'Figure',
    size: 'small',
    sizes: ['small', 'medium'],
  },
  {
    id: 'revenue',
    name: 'Revenue by month',
    description: 'This quarter against the same months last year.',
    kind: 'Chart',
    size: 'medium',
    sizes: ['medium', 'large', 'full'],
  },
  {
    id: 'budget',
    name: 'Plan and actual by cost centre',
    description: 'Budget 2026, January–September, by cost centre.',
    kind: 'Chart',
    size: 'medium',
    sizes: ['medium', 'large', 'full'],
  },
  {
    id: 'liman',
    name: 'Residential building Liman 4',
    description: 'Done, spent against planned, the handover.',
    kind: 'Progress',
    size: 'medium',
    sizes: ['medium', 'large', 'full'],
  },
  {
    id: 'overdue-list',
    name: 'Invoices overdue more than 30 days',
    description: 'Each invoice, its customer, due date and amount.',
    kind: 'Table',
    size: 'full',
    sizes: ['large', 'full'],
  },
  {
    id: 'liman-costs',
    name: 'Liman 4 by cost type',
    description: 'Material, labour, subcontractors, machinery: plan and actual.',
    kind: 'Chart',
    size: 'medium',
    sizes: ['medium', 'large', 'full'],
  },
  {
    id: 'revenue-quarter',
    name: 'Revenue, third quarter',
    description: 'July–September without VAT, against last year.',
    kind: 'Figure',
    size: 'small',
    sizes: ['small', 'medium'],
  },
]

export interface SavedLayout {
  id: string
  name: string
  /** The layout the overview opens with. */
  isDefault: boolean
  cards: readonly { id: string; size: string }[]
}

export const LAYOUTS: readonly SavedLayout[] = [
  {
    id: 'my',
    name: 'My overview',
    isDefault: true,
    cards: [
      { id: 'receivables', size: 'small' },
      { id: 'overdue', size: 'small' },
      { id: 'cash', size: 'small' },
      { id: 'budget-used', size: 'small' },
      { id: 'revenue', size: 'medium' },
      { id: 'budget', size: 'medium' },
      { id: 'liman', size: 'full' },
    ],
  },
  {
    id: 'month-end',
    name: 'Month end',
    isDefault: false,
    cards: [
      { id: 'budget-used', size: 'small' },
      { id: 'receivables', size: 'small' },
      { id: 'budget', size: 'medium' },
      { id: 'overdue-list', size: 'full' },
    ],
  },
]

/** The application's answer when a name is taken or empty, in its words. */
export function layoutNameProblem(
  name: string,
  layouts: readonly SavedLayout[],
  except?: string,
): string | undefined {
  const value = name.trim()
  if (value === '') return 'Enter a name for the layout.'
  const taken = layouts.some(
    (layout) => layout.id !== except && layout.name.toLowerCase() === value.toLowerCase(),
  )
  return taken ? 'A layout with this name exists. Choose another name.' : undefined
}

/** The main cash desk's limit, as group AM writes it. */
export const CASH_LIMIT = '150000.00'

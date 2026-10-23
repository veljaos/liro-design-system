/*
 * Story data of CatalogPicker (P5.90 item 14), fictitious: the services of Auto centar Liman, a
 * car service in Novi Sad — maintenance, brakes, tyres, diagnostics and bodywork in levels, who
 * does each, the price and the discounts; the sections the application shows first; and a
 * generated catalogue of 1,500 items for paging. The prices, discounts and what combines are the
 * application's data. Not part of the package: nothing in src/index.ts imports this file. No
 * classes here: Storybook compiles classes only from *.stories.tsx files.
 */
import type {
  CatalogCategory,
  CatalogFilter,
  CatalogItem,
  CatalogSection,
} from './catalog-picker-logic'

export const SERVICE_CATEGORIES: CatalogCategory[] = [
  { id: 'maintenance', label: 'Maintenance', description: 'Oil, filters, belts' },
  { id: 'oil', label: 'Oil and filters', parentId: 'maintenance' },
  { id: 'belts', label: 'Belts and chains', parentId: 'maintenance' },
  { id: 'brakes', label: 'Brakes', description: 'Pads, discs, fluid' },
  { id: 'tyres', label: 'Tyres', description: 'Changing, storing, balancing' },
  { id: 'tyres-change', label: 'Changing tyres', parentId: 'tyres' },
  { id: 'tyres-store', label: 'Storing tyres', parentId: 'tyres' },
  { id: 'diagnostics', label: 'Diagnostics', description: 'Computer check, inspection' },
  { id: 'body', label: 'Bodywork', description: 'Dents, paint, glass' },
]

function item(
  id: string,
  name: string,
  categoryId: string,
  detail: string,
  provider: string,
  price: string,
  extra: Partial<CatalogItem> = {},
): CatalogItem {
  return { id, name, categoryId, detail, provider, price, ...extra }
}

export const SERVICE_ITEMS: CatalogItem[] = [
  item('oil-small', 'Oil change, small service', 'oil', '45 min', 'Bay 1 · Marko', '6900.00', {
    originalPrice: '8600.00',
    discount: '−20% until 31.10.',
  }),
  item(
    'oil-big',
    'Big service: oil, all filters, plugs',
    'oil',
    '2 h',
    'Bay 1 · Marko',
    '18400.00',
  ),
  item('cabin-filter', 'Cabin air filter', 'oil', '15 min', 'Bay 2 · Ivan', '2400.00'),
  item('timing-belt', 'Timing belt and water pump', 'belts', '4 h', 'Bay 3 · Dejan', '32500.00'),
  item('aux-belt', 'Auxiliary belt', 'belts', '1 h', 'Bay 3 · Dejan', '5200.00'),
  item('pads-front', 'Front brake pads', 'brakes', '1 h', 'Bay 2 · Ivan', '7800.00'),
  item('discs-front', 'Front discs and pads', 'brakes', '2 h', 'Bay 2 · Ivan', '19600.00'),
  item('brake-fluid', 'Brake fluid change', 'brakes', '40 min', 'Bay 2 · Ivan', '3900.00'),
  item(
    'tyres-swap',
    'Seasonal tyre change, 4 wheels',
    'tyres-change',
    '40 min',
    'Tyre bay',
    '4800.00',
  ),
  item('tyres-balance', 'Balancing, 4 wheels', 'tyres-change', '30 min', 'Tyre bay', '2800.00'),
  item(
    'tyres-hotel',
    'Tyre storage, one season',
    'tyres-store',
    'Until spring',
    'Warehouse',
    '4000.00',
    {
      unavailableReason: 'The warehouse is full until 15.11.',
    },
  ),
  item(
    'computer-check',
    'Computer diagnostics',
    'diagnostics',
    '30 min',
    'Bay 4 · Nenad',
    '3000.00',
  ),
  item(
    'pre-purchase',
    'Pre-purchase inspection',
    'diagnostics',
    '1 h 30 min',
    'Bay 4 · Nenad',
    '7500.00',
  ),
  item('dent', 'Paintless dent repair, per dent', 'body', '1 h', 'Body shop', '4500.00'),
  item('windscreen', 'Windscreen replacement', 'body', '2 h', 'Body shop', '28000.00'),
  {
    id: 'wash',
    name: 'Hand wash',
    detail: '30 min',
    provider: 'Wash bay',
    priceText: 'Free with a service',
  },
]

export const SERVICE_SECTIONS: CatalogSection[] = [
  { id: 'top', label: 'Most chosen', itemIds: ['oil-small', 'tyres-swap', 'computer-check'] },
  { id: 'recent', label: 'Your recent', itemIds: ['pads-front', 'tyres-swap'] },
  { id: 'discount', label: 'On discount', itemIds: ['oil-small'] },
]

export const SERVICE_FILTERS: CatalogFilter[] = [
  {
    id: 'today',
    label: 'Done within an hour',
    matches: (each) => each.detail !== undefined && /^(\d+ min|1 h)$/.test(each.detail),
  },
  { id: 'discount', label: 'On discount', matches: (each) => each.discount !== undefined },
]

/** What does not combine (the application's rule): a small and a big service. */
export function withCombinations(items: readonly CatalogItem[], chosen: readonly string[]) {
  return items.map((each) => {
    const clash =
      (each.id === 'oil-big' && chosen.includes('oil-small')) ||
      (each.id === 'oil-small' && chosen.includes('oil-big'))
    return clash
      ? { ...each, unavailableReason: 'The big service already includes the small one.' }
      : each
  })
}

/** 1,500 parts in 30 groups of 50, for paging. */
export const MANY_CATEGORIES: CatalogCategory[] = Array.from({ length: 30 }, (_, index) => ({
  id: `g${String(index + 1)}`,
  label: `Parts group ${String(index + 1)}`,
}))

export const MANY_ITEMS: CatalogItem[] = Array.from({ length: 1500 }, (_, index) => {
  const group = Math.floor(index / 50) + 1
  return {
    id: `p${String(index + 1)}`,
    name: `Part ${String(index + 1).padStart(4, '0')}`,
    categoryId: `g${String(group)}`,
    detail: `Code ${String(100000 + index * 7)}`,
    price: `${String(500 + ((index * 37) % 9000))}.00`,
  }
})

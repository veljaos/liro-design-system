import { describe, expect, it } from 'vitest'
import {
  applyCatalogFilters,
  CATALOG_PAGE,
  categoryAndBelow,
  categoryTrail,
  childCategories,
  countBelow,
  itemsDirectlyIn,
  searchCatalog,
  sectionItems,
  shownCount,
  toggleCatalogItem,
  toggleFilter,
  type CatalogCategory,
  type CatalogItem,
} from './catalog-picker-logic'

/* P5.90 item 14: CatalogPicker's levels, search, filters and choice. */

const CATEGORIES: CatalogCategory[] = [
  { id: 'specialist', label: 'Specialist exam' },
  { id: 'cardio', label: 'Cardiology', parentId: 'specialist' },
  { id: 'cardio-echo', label: 'Echo', parentId: 'cardio' },
  { id: 'lab', label: 'Laboratory' },
]

const ITEMS: CatalogItem[] = [
  { id: 'gp', name: 'Check-up', price: '0' },
  { id: 'ecg', name: 'ECG', categoryId: 'cardio', provider: 'dr Ana Jović' },
  { id: 'echo', name: 'Heart ultrasound', categoryId: 'cardio-echo', keywords: 'echocardiography' },
  { id: 'blood', name: 'Krvna slika', categoryId: 'lab', detail: 'Fasting' },
  { id: 'glucose', name: 'Glucose', categoryId: 'lab', unavailableReason: 'Not with fasting' },
]

describe('levels', () => {
  it('lists the levels under a level, the top ones first', () => {
    expect(childCategories(CATEGORIES, null).map((each) => each.id)).toEqual(['specialist', 'lab'])
    expect(childCategories(CATEGORIES, 'specialist').map((each) => each.id)).toEqual(['cardio'])
  })

  it('counts the items in a level and below it', () => {
    expect([...categoryAndBelow(CATEGORIES, 'specialist')].sort()).toEqual([
      'cardio',
      'cardio-echo',
      'specialist',
    ])
    expect(countBelow(CATEGORIES, ITEMS, 'specialist')).toBe(2)
    expect(countBelow(CATEGORIES, ITEMS, 'lab')).toBe(2)
  })

  it('shows the items standing directly in a level, or at the top', () => {
    expect(itemsDirectlyIn(ITEMS, null).map((each) => each.id)).toEqual(['gp'])
    expect(itemsDirectlyIn(ITEMS, 'cardio').map((each) => each.id)).toEqual(['ecg'])
  })

  it('writes the trail from the top, and stops at a loop', () => {
    expect(categoryTrail(CATEGORIES, 'cardio-echo').map((each) => each.label)).toEqual([
      'Specialist exam',
      'Cardiology',
      'Echo',
    ])
    expect(categoryTrail(CATEGORIES, null)).toEqual([])
    const loop: CatalogCategory[] = [
      { id: 'a', label: 'A', parentId: 'b' },
      { id: 'b', label: 'B', parentId: 'a' },
    ]
    expect(categoryTrail(loop, 'a').map((each) => each.id)).toEqual(['b', 'a'])
  })
})

describe('searchCatalog', () => {
  it('finds by every word in the name, provider, keywords or levels, without accents', () => {
    expect(searchCatalog(ITEMS, CATEGORIES, 'jovic', 'en').map((each) => each.id)).toEqual(['ecg'])
    expect(searchCatalog(ITEMS, CATEGORIES, 'cardiology', 'en').map((each) => each.id)).toEqual([
      'ecg',
      'echo',
    ])
    expect(searchCatalog(ITEMS, CATEGORIES, 'echo cardio', 'en').map((each) => each.id)).toEqual([
      'echo',
    ])
    expect(searchCatalog(ITEMS, CATEGORIES, 'KRVNA fasting', 'sr-Latn')).toHaveLength(1)
  })

  it('finds nothing for an empty query', () => {
    expect(searchCatalog(ITEMS, CATEGORIES, '   ', 'en')).toEqual([])
  })
})

describe('filters and choice', () => {
  const filters = [
    { id: 'lab', label: 'Laboratory', matches: (item: CatalogItem) => item.categoryId === 'lab' },
    {
      id: 'free',
      label: 'Free',
      matches: (item: CatalogItem) => item.unavailableReason === undefined,
    },
  ]

  it('keeps what every pressed filter keeps', () => {
    expect(applyCatalogFilters(ITEMS, filters, [])).toHaveLength(ITEMS.length)
    expect(applyCatalogFilters(ITEMS, filters, ['lab']).map((each) => each.id)).toEqual([
      'blood',
      'glucose',
    ])
    expect(applyCatalogFilters(ITEMS, filters, ['lab', 'free']).map((each) => each.id)).toEqual([
      'blood',
    ])
    expect(toggleFilter(['lab'], 'free')).toEqual(['lab', 'free'])
    expect(toggleFilter(['lab', 'free'], 'lab')).toEqual(['free'])
  })

  it('chooses one, or toggles several; an unavailable item is not chosen but can be let go', () => {
    const [gp, ecg, , , glucose] = ITEMS
    if (gp === undefined || ecg === undefined || glucose === undefined) throw new Error('items')
    expect(toggleCatalogItem(['gp'], ecg, false)).toEqual(['ecg'])
    expect(toggleCatalogItem(['gp'], ecg, true)).toEqual(['gp', 'ecg'])
    expect(toggleCatalogItem(['gp', 'ecg'], ecg, true)).toEqual(['gp'])
    expect(toggleCatalogItem(['gp'], glucose, true)).toEqual(['gp'])
    expect(toggleCatalogItem(['glucose'], glucose, true)).toEqual([])
  })

  it("keeps a section's order and drops what is not in the catalogue", () => {
    expect(
      sectionItems(ITEMS, { id: 'top', label: 'Most chosen', itemIds: ['blood', 'x', 'gp'] }).map(
        (each) => each.id,
      ),
    ).toEqual(['blood', 'gp'])
  })

  it('pages a long list', () => {
    expect(shownCount(1500, 1)).toBe(CATALOG_PAGE)
    expect(shownCount(1500, 2)).toBe(CATALOG_PAGE * 2)
    expect(shownCount(10, 3)).toBe(10)
  })
})

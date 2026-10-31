/*
 * The logic of CatalogPicker: where an item stands in the application's levels,
 * what a level shows, the search and the filters over the items given, the chosen items and the
 * paging of a long list. Pure functions, unit-tested in `catalog-picker-logic.test.ts`. Nothing
 * here ranks, prices or decides which items combine: that is the application's data.
 */

/** One level of the catalogue ("Specialist exam", "Cardiology"). */
export interface CatalogCategory {
  id: string
  label: string
  /** The level above; none for a top level. */
  parentId?: string
  /** A line under the label, the application's words ("Blood and urine"). */
  description?: string
}

/** One item to choose: a service, a product, a course. Every word and figure the application's. */
export interface CatalogItem {
  id: string
  name: string
  /** The category it stands in (the deepest level); none for an item at the top. */
  categoryId?: string
  /** A short fact after the name ("30 min", "Fasting"). */
  detail?: string
  /** Who performs or provides it ("dr Ana Jović", "Laboratory"). */
  provider?: string
  /** The price, a decimal string; none when it has no price (covered by insurance). */
  price?: string
  /** The price before a discount, a decimal string: shown struck through. */
  originalPrice?: string
  /** The discount in the application's words ("−20% until 31.10."). */
  discount?: string
  /** The application's words instead of a price ("Covered by insurance"). */
  priceText?: string
  /** More words it is found by (codes, other names). */
  keywords?: string
  /** It cannot be chosen now: the application's reason (with what is chosen, does not combine). */
  unavailableReason?: string
}

/** A group shown first, before the levels: "Most chosen", "Your recent", "On discount". */
export interface CatalogSection {
  id: string
  label: string
  /** The items in the application's order. */
  itemIds: readonly string[]
}

/** A filter chip: the items it keeps, the application's rule. Several pressed chips all apply. */
export interface CatalogFilter {
  id: string
  label: string
  matches: (item: CatalogItem) => boolean
}

/** How many items a long list shows at first and adds with each "Show more". */
export const CATALOG_PAGE = 40

/** The levels directly under `parentId` (null: the top levels), in the application's order. */
export function childCategories(
  categories: readonly CatalogCategory[],
  parentId: string | null,
): CatalogCategory[] {
  return categories.filter((each) => (each.parentId ?? null) === parentId)
}

/** The ids of a level and every level under it. */
export function categoryAndBelow(
  categories: readonly CatalogCategory[],
  categoryId: string,
): Set<string> {
  const ids = new Set([categoryId])
  let grew = true
  while (grew) {
    grew = false
    for (const each of categories) {
      if (each.parentId !== undefined && ids.has(each.parentId) && !ids.has(each.id)) {
        ids.add(each.id)
        grew = true
      }
    }
  }
  return ids
}

/** The items standing directly in a level (null: at the top, outside every level). */
export function itemsDirectlyIn(
  items: readonly CatalogItem[],
  categoryId: string | null,
): CatalogItem[] {
  return items.filter((item) => (item.categoryId ?? null) === categoryId)
}

/** How many items stand in a level or below it. */
export function countBelow(
  categories: readonly CatalogCategory[],
  items: readonly CatalogItem[],
  categoryId: string,
): number {
  const ids = categoryAndBelow(categories, categoryId)
  return items.filter((item) => item.categoryId !== undefined && ids.has(item.categoryId)).length
}

/** The levels from the top down to `categoryId` (empty for the top, or an unknown id). */
export function categoryTrail(
  categories: readonly CatalogCategory[],
  categoryId: string | null,
): CatalogCategory[] {
  const trail: CatalogCategory[] = []
  const seen = new Set<string>()
  let current = categoryId === null ? undefined : categories.find((each) => each.id === categoryId)
  while (current !== undefined && !seen.has(current.id)) {
    seen.add(current.id)
    trail.unshift(current)
    const parent: string | undefined = current.parentId
    current = parent === undefined ? undefined : categories.find((each) => each.id === parent)
  }
  return trail
}

/** Text folded for matching: lower case, accents dropped ("Čačak" is found by "cacak"). */
export function foldCatalogText(text: string, locale: string): string {
  return text
    .toLocaleLowerCase(locale)
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
}

/**
 * The items found by the words typed: every word must appear in the item's name, detail,
 * provider, keywords or the labels of its levels; in the items' order. An empty query finds
 * nothing (the levels are shown instead).
 */
export function searchCatalog(
  items: readonly CatalogItem[],
  categories: readonly CatalogCategory[],
  query: string,
  locale: string,
): CatalogItem[] {
  const words = foldCatalogText(query, locale)
    .split(/\s+/u)
    .filter((word) => word !== '')
  if (words.length === 0) return []
  return items.filter((item) => {
    const levels = categoryTrail(categories, item.categoryId ?? null).map((each) => each.label)
    const text = foldCatalogText(
      [item.name, item.detail, item.provider, item.keywords, ...levels]
        .filter((part) => part !== undefined)
        .join(' '),
      locale,
    )
    return words.every((word) => text.includes(word))
  })
}

/** The items every pressed filter keeps. */
export function applyCatalogFilters(
  items: readonly CatalogItem[],
  filters: readonly CatalogFilter[],
  pressed: readonly string[],
): CatalogItem[] {
  const active = filters.filter((each) => pressed.includes(each.id))
  if (active.length === 0) return [...items]
  return items.filter((item) => active.every((filter) => filter.matches(item)))
}

/** A filter pressed or released. */
export function toggleFilter(pressed: readonly string[], id: string): string[] {
  return pressed.includes(id) ? pressed.filter((each) => each !== id) : [...pressed, id]
}

/**
 * The chosen ids after pressing an item: one choice replaces the other; several toggle it. An
 * item that cannot be chosen changes nothing, but can always be let go of.
 */
export function toggleCatalogItem(
  selected: readonly string[],
  item: CatalogItem,
  multiple: boolean,
): string[] {
  if (selected.includes(item.id)) return selected.filter((each) => each !== item.id)
  if (item.unavailableReason !== undefined) return [...selected]
  return multiple ? [...selected, item.id] : [item.id]
}

/** A section's items, in its order, those that exist. */
export function sectionItems(
  items: readonly CatalogItem[],
  section: CatalogSection,
): CatalogItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return section.itemIds.flatMap((id) => {
    const item = byId.get(id)
    return item === undefined ? [] : [item]
  })
}

/** How many of a long list to show: the first pages, at most all. */
export function shownCount(total: number, pages: number): number {
  return Math.min(total, Math.max(1, pages) * CATALOG_PAGE)
}

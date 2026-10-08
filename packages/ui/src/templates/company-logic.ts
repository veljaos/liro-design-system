import { fold, words } from '../components/command-logic'
import type { Tone } from '../components/status-badge'

/*
 * The logic of the company switcher (P4.1, scaled in P4.9 for an accountant's thousands of
 * companies), kept apart from the markup so it can be unit-tested (AGENTS.md C7): which companies
 * match the search, and in which sections they stand — pinned first, then recent, then all.
 */

/** One company of the company switcher. */
export interface ShellCompany {
  id: string
  /** The company's name, from the application. */
  name: string
  /** A second line, e.g. its tax number ("PIB 108452317"), from the application. Searched too. */
  description?: string
  /**
   * A state the user must see before switching (suspended, inactive), from the application: a
   * small badge after the name. Such a company can still be chosen; the Core decides what opens.
   */
  status?: { label: string; tone: Tone }
  /**
   * A short note at the end of the row, written by the application with its own count and words
   * ("5 tasks"). A bare number is never shown: it did not say what it counts (P4.9).
   */
  note?: string
}

export interface ShellCompanies {
  /**
   * Every company the user may open, in the application's order for the "All companies" section
   * (alphabetical is usual). Thousands are fine: the list is virtualised and the search is local.
   */
  items: readonly ShellCompany[]
  /** The id of the current company. */
  current: string
  onSelect: (id: string) => void
  /** Ids of the user's pinned (favourite) companies, listed first, in this order. */
  pinned?: readonly string[]
  /** Ids of recently used companies, listed after the pinned ones, most recent first. */
  recent?: readonly string[]
}

/** The sections of the list, in order. */
export type CompanySectionKey = 'pinned' | 'recent' | 'all'

export interface CompanySection {
  key: CompanySectionKey
  companies: ShellCompany[]
}

/**
 * A search over many companies: each name and description is folded (lower case, no accents)
 * once, so typing searches 5,000 companies without folding them again on every key.
 */
export function companyMatcher(
  companies: readonly ShellCompany[],
  locale: string,
): (query: string) => ShellCompany[] {
  const haystacks = companies.map((company) =>
    fold(`${company.name} ${company.description ?? ''}`, locale),
  )
  return (query) => {
    const wanted = words(query).map((word) => fold(word, locale))
    if (wanted.length === 0) return [...companies]
    return companies.filter((_, index) =>
      wanted.every((word) => haystacks[index]?.includes(word) === true),
    )
  }
}

/** The companies that match the search: by name or description, ignoring case and accents. */
export function matchingCompanies(
  companies: readonly ShellCompany[],
  query: string,
  locale: string,
): ShellCompany[] {
  return companyMatcher(companies, locale)(query)
}

/**
 * The sections of the list for the companies shown (all, or those matching the search): the
 * pinned ones in the user's order, then the recent ones not pinned, then every other company in
 * the application's order. Empty sections are left out; a company stands in one section only.
 */
export function companySections(
  shown: readonly ShellCompany[],
  pinned: readonly string[] = [],
  recent: readonly string[] = [],
): CompanySection[] {
  const byId = new Map(shown.map((company) => [company.id, company]))
  const taken = new Set<string>()
  const pick = (ids: readonly string[]) =>
    ids.flatMap((id) => {
      const company = byId.get(id)
      if (company === undefined || taken.has(id)) return []
      taken.add(id)
      return [company]
    })
  const sections: CompanySection[] = [
    { key: 'pinned', companies: pick(pinned) },
    { key: 'recent', companies: pick(recent) },
    { key: 'all', companies: shown.filter((company) => !taken.has(company.id)) },
  ]
  return sections.filter((section) => section.companies.length > 0)
}

/** A row of the list: a section heading or a company. */
export type CompanyRow =
  | { kind: 'heading'; key: CompanySectionKey }
  | { kind: 'company'; company: ShellCompany; position: number }

/**
 * The rows of the list: headings only when there is more than one section; `position` counts
 * the companies (from 1) for aria-posinset, since a virtualised list keeps few rows in the page.
 */
export function companyRows(sections: readonly CompanySection[]): CompanyRow[] {
  const headed = sections.length > 1
  let position = 0
  return sections.flatMap((section) => [
    ...(headed ? [{ kind: 'heading' as const, key: section.key }] : []),
    ...section.companies.map((company) => {
      position += 1
      return { kind: 'company' as const, company, position }
    }),
  ])
}

/**
 * The company row a key moves to from `active` (an index into `rows`): ArrowDown and ArrowUp by
 * one company, PageDown and PageUp by ten, Home and End to the first and last; headings are
 * skipped. Returns undefined for any other key.
 */
export function companyKeyTarget(
  rows: readonly CompanyRow[],
  active: number,
  key: string,
): number | undefined {
  const companies = rows.flatMap((row, index) => (row.kind === 'company' ? [index] : []))
  if (companies.length === 0) return undefined
  const at = companies.indexOf(active)
  const last = companies.length - 1
  const to = (position: number) => companies[Math.min(last, Math.max(0, position))]
  switch (key) {
    case 'ArrowDown':
      return to(at === -1 ? 0 : at + 1)
    case 'ArrowUp':
      return to(at === -1 ? last : at - 1)
    case 'PageDown':
      return to(at === -1 ? 0 : at + 10)
    case 'PageUp':
      return to(at === -1 ? 0 : at - 10)
    case 'Home':
      return to(0)
    case 'End':
      return to(last)
    default:
      return undefined
  }
}

/** The tops of rows of known heights, and the height of them all. */
export function rowOffsets(heights: readonly number[]): { tops: number[]; total: number } {
  let total = 0
  const tops = heights.map((height) => {
    const top = total
    total += height
    return top
  })
  return { tops, total }
}

/**
 * The rows to draw for a scroll position: those in view and `overscan` pixels around it (from
 * `first` up to but not including `last`). The list's own small virtualiser: rows have known
 * heights, so nothing is measured.
 */
export function visibleRows(
  tops: readonly number[],
  total: number,
  scrollTop: number,
  height: number,
  overscan = 240,
): { first: number; last: number } {
  const from = scrollTop - overscan
  const to = scrollTop + height + overscan
  // The first row whose bottom is below `from` (binary search over the tops).
  let low = 0
  let high = tops.length
  while (low < high) {
    const middle = (low + high) >> 1
    const bottom = tops[middle + 1] ?? total
    if (bottom <= from) low = middle + 1
    else high = middle
  }
  let last = low
  while (last < tops.length && (tops[last] ?? total) < to) last += 1
  return { first: low, last }
}

/** The scroll position that brings a row fully into view, or undefined when it is in view. */
export function scrollToShow(
  top: number,
  rowHeight: number,
  scrollTop: number,
  height: number,
): number | undefined {
  if (top < scrollTop) return top
  if (top + rowHeight > scrollTop + height) return top + rowHeight - height
  return undefined
}

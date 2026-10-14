/*
 * The pure rules of the reading components (BUILD-PLAN P5.39): an e-mail address's shape, a
 * byline's parts and how many columns a list of articles takes. Tested in blog-logic.test.ts.
 */

/**
 * Whether a text has the shape of an e-mail address: one "@" with something before it and a
 * domain with a dot after it, no spaces. The application checks the address itself (it sends the
 * confirmation); this only catches a typing slip before it is sent.
 */
export function looksLikeEmail(text: string): boolean {
  const value = text.trim()
  if (value === '' || /\s/.test(value)) return false
  const at = value.indexOf('@')
  if (at <= 0 || at !== value.lastIndexOf('@')) return false
  const domain = value.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  return dot > 0 && dot < domain.length - 1
}

/** What the newsletter form says about an address: nothing, missing or not an address. */
export function emailProblem(text: string): 'required' | 'invalid' | null {
  if (text.trim() === '') return 'required'
  return looksLikeEmail(text) ? null : 'invalid'
}

/** A byline's parts joined by " · ", the empty ones left out. */
export function bylineText(parts: readonly (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => part !== undefined && part !== null && part !== '')
    .join(' · ')
}

/**
 * The cards of a list in their places: with `featured`, the first spans the whole row (its cover
 * beside the text on a desktop) and the others follow in the grid.
 */
export function articlePlaces<T>(
  articles: readonly T[],
  featured: boolean,
): { featured: T | null; rest: readonly T[] } {
  const [first, ...rest] = articles
  if (!featured || first === undefined) return { featured: null, rest: articles }
  return { featured: first, rest }
}

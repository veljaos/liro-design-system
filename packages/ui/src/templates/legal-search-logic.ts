import type { GazetteReference, LegalStatus } from '../components/legal-model'

/*
 * LegalSearchPage's data and logic (BUILD-PLAN P5.27 e), without React. The application searches
 * across acts and gives each result with its snippet; the page only shows it. A snippet arrives
 * as marked segments, or as a text with the ranges that matched (`snippetFromRanges`).
 */

/** A part of a snippet: plain text, or a run that matched the search (shown in a <mark>). */
export type LegalSnippetPart = string | { match: string }

/** A result's snippet: the text around the match, in order, the matches marked. */
export type LegalSnippet = readonly LegalSnippetPart[]

/** One act found by the search, as the application gives it. */
export interface LegalSearchResult {
  id: string
  /** "Law", "Rulebook", "Decision". */
  type: string
  title: string
  /** The act's page, through the provider's `linkComponent`. */
  href: string
  /** Who issued it ("Illustrative Parliament"). */
  issuer?: string
  /** The gazette's name, before the references ("Illustrative Gazette"). */
  gazetteName?: string
  /** Every gazette reference, the original first (their `label`s: "No. 12/2016"). */
  gazette: readonly GazetteReference[]
  status: LegalStatus
  /** The text around the match, the matches marked. */
  snippet?: LegalSnippet
  /** The article the match is in ("Article 57"), linked to the article. */
  article?: { label: string; href: string }
  /** The language tag of the title and snippet, when it differs from the page's (D15). */
  lang?: string
}

/** A way to sort the results, from the application ("Relevance", "Newest first"). */
export interface LegalSearchSort {
  value: string
  label: string
}

/**
 * A snippet from a text and the ranges that matched, as a search engine reports them: each range
 * `[start, end)` in UTF-16 code units (JavaScript string offsets). Ranges are clamped to the text,
 * empty ones dropped, and overlapping or touching ones joined, so a match is never marked twice
 * or split; the parts come in the text's order. Ranges are the engine's: the library finds
 * nothing itself.
 */
export function snippetFromRanges(
  text: string,
  ranges: readonly (readonly [number, number])[],
): LegalSnippetPart[] {
  const clamped = ranges
    .map(([start, end]) => [Math.max(0, start), Math.min(text.length, end)] as const)
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])
  const joined: [number, number][] = []
  for (const [start, end] of clamped) {
    const last = joined.at(-1)
    if (last !== undefined && start <= last[1]) last[1] = Math.max(last[1], end)
    else joined.push([start, end])
  }
  const parts: LegalSnippetPart[] = []
  let at = 0
  for (const [start, end] of joined) {
    if (start > at) parts.push(text.slice(at, start))
    parts.push({ match: text.slice(start, end) })
    at = end
  }
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

/** A snippet's plain text, the marks dropped (an accessible description, a test). */
export function snippetText(snippet: LegalSnippet): string {
  return snippet.map((part) => (typeof part === 'string' ? part : part.match)).join('')
}

/** A result's gazette references as one text: "No. 12/2016, 47/2018". */
export function gazetteNumbers(references: readonly GazetteReference[]): string {
  return references.map((reference) => reference.label).join(', ')
}

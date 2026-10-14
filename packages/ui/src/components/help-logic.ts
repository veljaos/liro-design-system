import type { LiroFormat } from '../provider/format'

/*
 * The logic of the help-centre building blocks (BUILD-PLAN P5.30 d and e: SatisfactionRating,
 * HelpfulFeedback, LinkSuggestions, PageContents, SearchResultList, CategoryGrid), kept apart
 * from the markup so it can be unit-tested (AGENTS.md C7). Nothing here searches, ranks or counts
 * on the application's behalf: the matches, the counts and the order arrive from it.
 */

// ── Highlighted text ──────────────────────────────────────────────────────────────────────────

/**
 * A part of a highlighted text: plain text, or a run that matched the search (drawn in a
 * <mark>). The same shape as LegalSearchPage's snippet parts, so `snippetFromRanges` makes them
 * from a text and the ranges a search engine reports.
 */
export type HighlightPart = string | { match: string }

/** A text with its matches marked, in order. */
export type Highlight = readonly HighlightPart[]

/** A highlighted text's plain text, the marks dropped (an accessible name, a test). */
export function highlightText(parts: Highlight): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.match)).join('')
}

/** How many runs of a highlighted text matched. */
export function highlightMatches(parts: Highlight): number {
  return parts.filter((part) => typeof part !== 'string').length
}

// ── A rating scale ────────────────────────────────────────────────────────────────────────────

/** One step of a rating scale, from the application: its value and its words. */
export interface SatisfactionOption {
  /** The value the application stores ("1" … "5"); digits are written through `format.number`. */
  value: string
  /** The step in words ("Very satisfied"): every step has words, never a number or a face alone. */
  label: string
}

/** What a rating sends: the chosen value and the comment (trimmed; empty when none). */
export interface SatisfactionAnswer {
  value: string
  comment: string
}

/**
 * A scale value as the page writes it: a whole or decimal number through `format.number` (so an
 * Arabic page writes its own digits), any other text as the application gave it.
 */
export function scaleValueText(format: LiroFormat, value: string): string {
  return /^-?\d+(\.\d+)?$/.test(value) ? format.number(value) : value
}

/** The step of the scale with this value, if any. */
export function ratingOption(
  options: readonly SatisfactionOption[],
  value: string | null | undefined,
): SatisfactionOption | undefined {
  return value === null || value === undefined
    ? undefined
    : options.find((option) => option.value === value)
}

/**
 * The answer to send, or null while no step of the scale is chosen (the rating asks for one). The
 * comment is trimmed; a comment alone is not an answer.
 */
export function ratingAnswer(
  options: readonly SatisfactionOption[],
  value: string | null | undefined,
  comment: string,
): SatisfactionAnswer | null {
  const option = ratingOption(options, value)
  return option === undefined ? null : { value: option.value, comment: comment.trim() }
}

// ── "Was this helpful?" ───────────────────────────────────────────────────────────────────────

/** The reader's answer to "Was this helpful?". */
export type HelpfulAnswer = 'yes' | 'no'

/**
 * Whether to ask what was missing: only after "No", only when the application asks, and only
 * until the comment was sent.
 */
export function asksWhy(
  answer: HelpfulAnswer | null,
  askWhy: boolean,
  commentSent: boolean,
): boolean {
  return answer === 'no' && askWhy && !commentSent
}

// ── Contents of a long page ───────────────────────────────────────────────────────────────────

/** One heading of a long page that its contents list: the heading element's id and its text. */
export interface ContentsEntry {
  id: string
  label: string
  /** 2 for a section, 3 for a subsection (indented under its section). Default 2. */
  level?: 2 | 3
}

/**
 * The current entry of a page's contents: the last heading whose top has passed `line` (just
 * under the shell's sticky top), or the first while none has. `tops` are the headings' tops in
 * the viewport, in the entries' order; a heading that is not drawn is `Infinity`. -1 without
 * entries.
 */
export function currentEntry(tops: readonly number[], line: number): number {
  if (tops.length === 0) return -1
  let current = 0
  tops.forEach((top, index) => {
    if (top <= line) current = index
  })
  return current
}

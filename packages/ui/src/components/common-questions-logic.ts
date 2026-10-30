import { fold } from './command-logic'
import { snippetFromRanges, type HighlightPart } from './help-logic'

/*
 * The logic of CommonQuestions (P5.94 item 20), kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): which questions a search and a category keep, and how many are
 * shown. The questions, their answers, their order and their categories are the application's;
 * the search is local, over the words the application gave.
 */

/** What CommonQuestions searches in a question (its other content is not text). */
export interface SearchableQuestion {
  id: string
  question: string
  answer: string
  /** The documents needed, in the application's words. */
  documents?: readonly string[]
  /** The id of its category. */
  category?: string
  /** More words it is found by ("ID card, identity card, lična karta"). */
  keywords?: string
}

/** Lower case without accents, "đ" as "d": "Đorđević" is found by "djordjevic" and "dordevic". */
export function foldQuestionText(text: string, locale: string): string {
  return fold(text, locale).replace(/đ/g, 'd')
}

/** The words of a search, folded; none for an empty search. */
function searchWords(query: string, locale: string): string[] {
  return foldQuestionText(query, locale)
    .split(/\s+/u)
    .filter((word) => word !== '')
}

/**
 * Whether a question matches a search: every word typed appears in its question, its answer,
 * its documents, its keywords or its category's name, ignoring case and accents ("dj" also
 * finds "đ"). An empty search matches every question.
 */
export function questionMatches(
  question: SearchableQuestion,
  query: string,
  locale: string,
  categoryLabel?: string,
): boolean {
  const words = searchWords(query, locale)
  if (words.length === 0) return true
  const text = foldQuestionText(
    [
      question.question,
      question.answer,
      ...(question.documents ?? []),
      question.keywords,
      categoryLabel,
    ]
      .filter((part) => part !== undefined)
      .join(' '),
    locale,
  )
  // "dj" in a search finds "đ", which folds to "d".
  return words.every((word) => text.includes(word) || text.includes(word.replace(/dj/g, 'd')))
}

/**
 * The questions a search and a category keep, in the application's order. `category` null is
 * every category; `labels` names the categories, so a category's name finds its questions.
 */
export function filterQuestions<Q extends SearchableQuestion>(
  questions: readonly Q[],
  filter: { query: string; category: string | null },
  locale: string,
  labels: Readonly<Record<string, string>> = {},
): Q[] {
  return questions.filter(
    (question) =>
      (filter.category === null || question.category === filter.category) &&
      questionMatches(
        question,
        filter.query,
        locale,
        question.category === undefined ? undefined : labels[question.category],
      ),
  )
}

/** The questions shown: the first `limit` (a home page's top questions), or all of them. */
export function shownQuestions<Q>(questions: readonly Q[], limit?: number): Q[] {
  return limit === undefined || limit < 0 ? [...questions] : questions.slice(0, limit)
}

/** Whether a search or a category narrows the list (its count is then said). */
export function questionsFiltered(query: string, category: string | null): boolean {
  return query.trim() !== '' || category !== null
}

/** An open question closed, or a closed one opened; the others stay as they are. */
export function toggleQuestion(open: readonly string[], id: string): string[] {
  return open.includes(id) ? open.filter((each) => each !== id) : [...open, id]
}

// ── Questions and answers (P5.96 item 1) ──────────────────────────────────────────────────────

/**
 * How many entries a page of QuestionsAndAnswers shows before "Show more" (P5.96 item 1): 30
 * links, a screen and a half on a desktop. Paged, not windowed: every shown entry is a real link
 * in the page's order (the browser's find, the keyboard and assistive technology reach them all),
 * and a search narrows 300 questions to a few at once.
 */
export const QUESTIONS_PAGE = 30

/**
 * A text with the words of a search marked, for HighlightedText: every place where a typed word
 * appears, ignoring case and accents as the search does ("dj" also marks "đ"); overlapping marks
 * are joined. An empty search, or a text without a match, is the text alone.
 */
export function highlightQuestion(text: string, query: string, locale: string): HighlightPart[] {
  const words = searchWords(query, locale)
  if (words.length === 0 || text === '') return [text]
  // The folded text, and for each of its characters the original characters it comes from.
  let folded = ''
  const starts: number[] = []
  const ends: number[] = []
  let at = 0
  for (const character of text) {
    const part = foldQuestionText(character, locale)
    starts.push(...new Array<number>(part.length).fill(at))
    ends.push(...new Array<number>(part.length).fill(at + character.length))
    folded += part
    at += character.length
  }
  const ranges: [number, number][] = []
  for (const word of new Set(words.flatMap((each) => [each, each.replace(/dj/g, 'd')]))) {
    for (let found = folded.indexOf(word); found !== -1; found = folded.indexOf(word, found + 1)) {
      const start = starts[found]
      const end = ends[found + word.length - 1]
      if (start !== undefined && end !== undefined) ranges.push([start, end])
    }
  }
  return ranges.length === 0 ? [text] : snippetFromRanges(text, ranges)
}

/** How many questions a search keeps: all of them, and in each category (by id). */
export interface QuestionCounts {
  all: number
  byCategory: Readonly<Record<string, number>>
}

/**
 * The counts of the category chips: how many questions the search keeps in every category and
 * in each one (a category without a match counts 0). The questions are the application's; only
 * the shown list is counted.
 */
export function questionCounts(
  questions: readonly SearchableQuestion[],
  query: string,
  locale: string,
  labels: Readonly<Record<string, string>> = {},
): QuestionCounts {
  const byCategory: Record<string, number> = {}
  for (const id of Object.keys(labels)) byCategory[id] = 0
  let all = 0
  for (const question of filterQuestions(questions, { query, category: null }, locale, labels)) {
    all += 1
    if (question.category !== undefined) {
      byCategory[question.category] = (byCategory[question.category] ?? 0) + 1
    }
  }
  return { all, byCategory }
}

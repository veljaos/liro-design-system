import { fold } from './command-logic'

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
  const words = foldQuestionText(query, locale)
    .split(/\s+/u)
    .filter((word) => word !== '')
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

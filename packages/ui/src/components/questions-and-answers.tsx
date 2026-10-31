import { ArrowLeft, FileText } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, LINK_ITEM_HOVER, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from '../templates/page-header'
import { Button } from './button'
import {
  QuestionCategoryChips,
  type CommonQuestion,
  type QuestionCategory,
} from './common-questions'
import {
  filterQuestions,
  highlightQuestion,
  QUESTIONS_PAGE,
  questionCounts,
  questionsFiltered,
  shownQuestions,
} from './common-questions-logic'
import { EmptyState } from './empty-state'
import { Skeleton } from './progress'
import { HighlightedText } from './search-result-list'
import { TextField } from './text-field'

export { highlightQuestion, QUESTIONS_PAGE, questionCounts } from './common-questions-logic'
export type { QuestionCounts } from './common-questions-logic'

/*
 * Questions and answers: an application may have answers to 300+ questions, so the questions
 * get their own page. Two pieces for any
 * portal (an employee's, a patient's, a tenant's, a client's), on CommonQuestion's data:
 *
 * QuestionsAndAnswers — the page's content under the application's PageHeader:
 * - One search field first. It filters as you type (local, over the question, the answer, the
 *   documents, the keywords and the category's name; case and accents ignored, "dj" finds "đ"),
 *   and marks the typed words in each question and answer (HighlightedText).
 * - The categories as chips, "All" first, each with how many questions the search keeps in it;
 *   one pressed (the neutral selection).
 * - The list in one card: a row per question — its category (while "All" is chosen), the
 *   question as a link (a heading; the link covers the whole row, a big target), the short answer
 *   under it. The hover is the row's surface and the focus the link's ring; nothing underlined.
 *   Each link goes to the answer's own address (`answerHref`), through the provider's
 *   `linkComponent`.
 * - 300 questions stay fast by paging: the first 30 (`pageSize`), then "Show more (30 of 312
 *   shown)", which moves the focus to the first new question. Not windowed: every shown entry is a
 *   real link in the page's order (the browser's find, the keyboard and assistive technology reach
 *   them), and a search narrows the list to a few at once.
 * - A search or a category that narrows the list says its count politely. Nothing found: the
 *   no-results state, and the application's `askAction` ("Ask HR") with the words typed, else
 *   "Clear the search".
 * - Loading: skeleton rows under the tools. No questions at all: the application's `empty`.
 *
 * AnswerView — one answer on its own page: the question as the page's h1 with the way back
 * (`back`, PageHeader's back button), its category under it, then one card: the answer, "What to
 * do" (numbered), "What you need" (each document with an icon) and the application's request
 * that does it (`action`, the page's main action), and under the card a link back to every
 * question. On phones the card takes the page's width.
 */

export interface QuestionsAndAnswersProps {
  /** The list's name for assistive technology ("Questions and answers"). */
  label: string
  /** Every question, in the application's order (the most asked first). */
  questions: readonly CommonQuestion[]
  /** The address of a question's own answer page. */
  answerHref: (question: CommonQuestion) => string
  /** The categories, as chips after "All"; left out: no chips. */
  categories?: readonly QuestionCategory[]
  /** Controlled search text. */
  query?: string
  /** Uncontrolled initial search text. */
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  /** The search field's label. Default: `messages['questions.search']`. */
  searchLabel?: string
  /** Controlled category; null is all. */
  category?: string | null
  /** Uncontrolled initial category; null (default) is all. */
  defaultCategory?: string | null
  onCategoryChange?: (category: string | null) => void
  /**
   * Offered when nothing is found: the application's way to ask ("Ask HR"), given the words
   * typed so it can start the question with them.
   */
  askAction?: { label: string; onSelect: (query: string) => void }
  /** How many questions are shown before "Show more". Default `QUESTIONS_PAGE` (30). */
  pageSize?: number
  /** The level of each question's heading. Default 2 (under the page's h1). */
  headingLevel?: 2 | 3 | 4
  /** Skeleton rows instead of the questions. */
  loading?: boolean
  /** Shown when there are no questions at all. Default: EmptyState. */
  empty?: ReactNode
  className?: string
}

/** The card around the rows (SearchResultList's rows). */
const CARD =
  'm-0 min-w-0 list-none rounded-lg border border-solid border-default bg-surface-raised p-0'
const ROW =
  'relative flex min-w-0 flex-col gap-1 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0 first:rounded-t-lg last:rounded-b-lg'

/** Every question of a portal, searched and by category, each a link to its answer. */
export function QuestionsAndAnswers(props: QuestionsAndAnswersProps) {
  const { messages, locale, format, linkComponent: Link } = useLiro()
  const [innerQuery, setInnerQuery] = useState(props.defaultQuery ?? '')
  const query = props.query ?? innerQuery
  const [innerCategory, setInnerCategory] = useState<string | null>(props.defaultCategory ?? null)
  const category = props.category === undefined ? innerCategory : props.category
  const pageSize = Math.max(1, props.pageSize ?? QUESTIONS_PAGE)
  // The shown count belongs to one search and category: a new one starts at the first page.
  const filterKey = `${query}\u0000${category ?? ''}`
  const [page, setPage] = useState({ key: filterKey, count: pageSize })
  const count = page.key === filterKey ? page.count : pageSize
  const listRef = useRef<HTMLUListElement>(null)
  const focusIndex = useRef<number | null>(null)
  const idBase = useId()
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2' | 'h3' | 'h4'

  const categories = props.categories ?? []
  const labels = Object.fromEntries(categories.map((each) => [each.id, each.label]))
  const found = filterQuestions(props.questions, { query, category }, locale, labels)
  const shown = shownQuestions(found, count)
  const filtered = questionsFiltered(query, category)

  // After "Show more", the focus goes to the first new question (it is not lost with the button).
  useEffect(() => {
    if (focusIndex.current === null) return
    const links = listRef.current?.querySelectorAll<HTMLElement>('[data-slot="answer-link"]')
    links?.[focusIndex.current]?.focus()
    focusIndex.current = null
  })

  const setQuery = (next: string) => {
    setInnerQuery(next)
    props.onQueryChange?.(next)
  }
  const setCategory = (next: string | null) => {
    setInnerCategory(next)
    props.onCategoryChange?.(next)
  }

  const tools = (
    <div className="flex flex-col gap-3">
      <TextField
        type="search"
        label={props.searchLabel ?? messages['questions.search']}
        hideLabel
        placeholder={props.searchLabel ?? messages['questions.search']}
        value={query}
        onChange={setQuery}
      />
      {categories.length > 0 && (
        <QuestionCategoryChips
          categories={categories}
          category={category}
          onChange={setCategory}
          {...(props.loading === true
            ? {}
            : { counts: questionCounts(props.questions, query, locale, labels) })}
        />
      )}
    </div>
  )

  if (props.loading === true) {
    return (
      <div
        aria-busy="true"
        data-slot="questions-and-answers"
        className={cn('flex min-w-0 flex-col gap-4', props.className)}
      >
        {tools}
        <span className="sr-only">{messages['field.loading']}</span>
        <div aria-hidden="true" className={CARD}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className={cn(ROW, 'gap-2')}>
              <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
              <Skeleton className="h-3.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (props.questions.length === 0) {
    return <div className={props.className}>{props.empty ?? <EmptyState compact />}</div>
  }

  return (
    <div
      data-slot="questions-and-answers"
      className={cn('flex min-w-0 flex-col gap-4', props.className)}
    >
      {tools}
      {/* The count while a search or a category narrows the list, said politely. */}
      <p
        role="status"
        className={cn(
          'm-0 text-xs text-secondary empty:hidden',
          TEXT_DIRECTION,
          (!filtered || found.length === 0) && 'sr-only',
        )}
      >
        {filtered
          ? messages['questions.found'](found.length, format.number(String(found.length)))
          : ''}
      </p>
      {shown.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            variant="no-results"
            compact
            {...(props.askAction === undefined
              ? {
                  action: {
                    label: messages['questions.clear'],
                    onClick: () => {
                      setQuery('')
                      setCategory(null)
                    },
                  },
                }
              : {
                  description: messages['questions.askInstead'],
                  action: {
                    label: props.askAction.label,
                    onClick: () => {
                      props.askAction?.onSelect(query.trim())
                    },
                  },
                })}
          />
        </div>
      ) : (
        <ul ref={listRef} aria-label={props.label} className={CARD}>
          {shown.map((question) => {
            const title = highlightQuestion(question.question, query, locale)
            const answer = highlightQuestion(question.answer, query, locale)
            const categoryLabel =
              category === null && question.category !== undefined
                ? labels[question.category]
                : undefined
            const answerId = `${idBase}-${question.id}`
            return (
              <li
                key={question.id}
                {...langAttribute(question.lang, locale)}
                data-slot="answer-row"
                className={cn(ROW, LINK_ITEM_HOVER)}
              >
                {categoryLabel !== undefined && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {categoryLabel}
                  </span>
                )}
                <Heading className="m-0 text-md font-semibold">
                  <Link
                    href={props.answerHref(question)}
                    data-slot="answer-link"
                    // The marks split the question for assistive technology; the name is whole.
                    aria-label={question.question}
                    aria-describedby={answerId}
                    className={cn(
                      'rounded-sm break-words text-link no-underline visited:text-link',
                      // The link covers the whole row: the row is the target.
                      "after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
                      FOCUS_RING,
                      TEXT_DIRECTION,
                    )}
                  >
                    <HighlightedText parts={title} />
                  </Link>
                </Heading>
                <p
                  id={answerId}
                  className={cn('m-0 text-sm break-words text-secondary', TEXT_DIRECTION)}
                >
                  <HighlightedText parts={answer} />
                </p>
              </li>
            )
          })}
        </ul>
      )}
      {shown.length < found.length && (
        <div className="flex">
          <ButtonPrimitive
            family="neutral"
            emphasis="secondary"
            onClick={() => {
              focusIndex.current = shown.length
              setPage({ key: filterKey, count: count + pageSize })
            }}
          >
            <span className={TEXT_DIRECTION}>
              {messages['questions.showMore'](
                format.number(String(shown.length)),
                format.number(String(found.length)),
              )}
            </span>
          </ButtonPrimitive>
        </div>
      )}
    </div>
  )
}

export interface AnswerViewProps {
  /** The question and its answer, what to do, what is needed and the request that does it. */
  question: CommonQuestion
  /** The way back to every question ("Questions and answers"). */
  back: PageBack
  /** The categories, to name the question's own under its title. */
  categories?: readonly QuestionCategory[]
  className?: string
}

/** One answer on its own page: the question as the title, then what to do and what you need. */
export function AnswerView({ question, back, categories, className }: AnswerViewProps) {
  const { messages, locale, linkComponent: Link } = useLiro()
  const idBase = useId()
  const categoryLabel = categories?.find((each) => each.id === question.category)?.label
  const steps = question.steps ?? []
  const documents = question.documents ?? []
  return (
    <article
      data-slot="answer-view"
      {...langAttribute(question.lang, locale)}
      className={cn('flex min-w-0 flex-col gap-4 sm:gap-6', className)}
    >
      <PageHeader
        title={question.question}
        back={back}
        {...(categoryLabel === undefined ? {} : { subtitle: categoryLabel })}
      />
      <div className="flex min-w-0 flex-col gap-5 rounded-lg border border-solid border-default bg-surface-raised p-4 sm:p-6">
        <p className={cn('m-0 text-md break-words text-primary', TEXT_DIRECTION)}>
          {question.answer}
        </p>
        {steps.length > 0 && (
          <section aria-labelledby={`${idBase}-steps`} className="flex flex-col gap-2">
            <h2
              id={`${idBase}-steps`}
              className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
            >
              {messages['questions.whatToDo']}
            </h2>
            <ol className="m-0 flex flex-col gap-1.5 ps-5 text-sm text-primary">
              {steps.map((step, index) => (
                <li key={index} className={cn('break-words', TEXT_DIRECTION)}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        )}
        {documents.length > 0 && (
          <section aria-labelledby={`${idBase}-documents`} className="flex flex-col gap-2">
            <h2
              id={`${idBase}-documents`}
              className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
            >
              {messages['questions.documents']}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {documents.map((document, index) => (
                <li key={index} className="flex min-w-0 items-start gap-2 text-sm text-primary">
                  <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
                  <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>{document}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {question.action !== undefined && (
          <div className="flex">
            <Button
              intent="next"
              label={question.action.label}
              onClick={question.action.onSelect}
            />
          </div>
        )}
      </div>
      <Link
        href={back.href}
        {...(back.onClick === undefined ? {} : { onClick: back.onClick })}
        className={cn(
          'inline-flex min-h-6 items-center gap-1.5 self-start rounded-sm text-sm font-medium text-link no-underline visited:text-link hover:underline',
          FOCUS_RING,
        )}
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
        <span className={TEXT_DIRECTION}>{messages['page.backTo'](back.label)}</span>
      </Link>
    </article>
  )
}

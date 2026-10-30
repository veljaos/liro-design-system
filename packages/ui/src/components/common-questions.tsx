import { ChevronDown, FileText } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import {
  filterQuestions,
  questionsFiltered,
  shownQuestions,
  toggleQuestion,
} from './common-questions-logic'
import { EmptyState } from './empty-state'
import { Skeleton } from './progress'
import { TextField } from './text-field'

export {
  filterQuestions,
  foldQuestionText,
  questionMatches,
  questionsFiltered,
  shownQuestions,
  toggleQuestion,
} from './common-questions-logic'
export type { SearchableQuestion } from './common-questions-logic'

/*
 * CommonQuestions (BUILD-PLAN P5.94 item 20, the owner's fifth review): the questions people of a
 * portal keep asking — an employee ("I changed my ID card. Do I have to tell my employer?"), a
 * patient, a tenant, a client — each with its short answer, what to do and the documents needed,
 * and, where the application has a request for it, the button that starts that request filled in.
 * Everything is the application's data; the component searches only the words it was given.
 *
 * - A list of cards in one column (a card per question; one column also on phones, so an opened
 *   card never makes a ragged grid). A card: radius lg, a border.default line on the raised
 *   surface. Its top is one button (a big target: the whole summary): the question (sm semibold),
 *   the short answer under it (sm text.secondary) and a chevron at the end. The question is the
 *   button's name, the answer its description; the button sits in a heading (`headingLevel`, h3
 *   by default) so the questions can be skimmed by heading.
 * - Hover is the surface (surface.hover), focus the standard ring; nothing is underlined. A press
 *   opens the card under a border.subtle line: "What to do" (the steps, numbered), "What you
 *   need" (each document with a FileText icon) and the application's action (`intent` next,
 *   secondary: one primary button per screen stays the page's). A question with nothing more than
 *   its answer is not a button. Closed cards keep nothing mounted.
 * - `search`: one search field first (local: every word in the question, the answer, the
 *   documents, the keywords or the category's name; case and accents ignored). `categories`:
 *   chips beside it, "All" first, one pressed (the neutral selection, never blue). While a search
 *   or a category narrows the list, its count is said ("3 questions", polite). Nothing found:
 *   the no-results state with "Clear the search".
 * - `limit`: the first questions only (a portal's home shows its top three to five, and the
 *   application links "All questions" beside it).
 * - Loading: skeleton cards under the search and chips. No questions: the application's `empty`,
 *   or EmptyState.
 */

/** One common question, from the application. */
export interface CommonQuestion {
  id: string
  /** The situation, as people ask it ("I got married. What changes, and what do I bring?"). */
  question: string
  /** The short answer, one or two sentences. Text only: the card's top is one button. */
  answer: string
  /** What to do, in order (the application's words). */
  steps?: readonly ReactNode[]
  /** The documents needed, in the application's words ("Marriage certificate"). */
  documents?: readonly string[]
  /** The id of its category (`categories`). */
  category?: string
  /** More words it is found by ("ID card, identity card, lična karta"). */
  keywords?: string
  /**
   * The request that does it, started by the application filled in ("Report a change of
   * address" opens the change request with its proof).
   */
  action?: { label: string; onSelect: () => void }
  /** The language tag of its texts when it differs from the page's (D15). */
  lang?: string
}

/** A category of questions ("Personal data", "Leave", "Pay"). */
export interface QuestionCategory {
  id: string
  label: string
}

export interface CommonQuestionsProps {
  /** The list's name for assistive technology ("Common questions"). */
  label: string
  questions: readonly CommonQuestion[]
  /** Shows the search field first. */
  search?: boolean
  /** Controlled search text. */
  query?: string
  /** Uncontrolled initial search text. */
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  /** The search field's label. Default: `messages['questions.search']`. */
  searchLabel?: string
  /** The categories, as chips after "All"; left out: no chips. */
  categories?: readonly QuestionCategory[]
  /** Controlled category; null is all. */
  category?: string | null
  /** Uncontrolled initial category; null (default) is all. */
  defaultCategory?: string | null
  onCategoryChange?: (category: string | null) => void
  /** Shows only the first questions (a home page's top three to five). */
  limit?: number
  /** The questions open from the start (by id). */
  defaultOpen?: readonly string[]
  /** The level of each question's heading. Default 3. */
  headingLevel?: 2 | 3 | 4
  /** Skeleton cards instead of the questions. */
  loading?: boolean
  /** How many skeleton cards. Default 4. */
  skeletonCount?: number
  /** Shown when there are no questions at all. Default: EmptyState. */
  empty?: ReactNode
  className?: string
}

/** A chip of the category row (CatalogPicker's filter chips). */
const CHIP =
  'inline-flex min-h-9 max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-solid px-3 text-start text-sm font-medium'

/** Questions people keep asking, each with its answer, what to do and what they need. */
export function CommonQuestions(props: CommonQuestionsProps) {
  const { messages, locale, format } = useLiro()
  const [innerQuery, setInnerQuery] = useState(props.defaultQuery ?? '')
  const query = props.query ?? innerQuery
  const [innerCategory, setInnerCategory] = useState<string | null>(props.defaultCategory ?? null)
  const category = props.category === undefined ? innerCategory : props.category
  const [open, setOpen] = useState<string[]>(() => [...(props.defaultOpen ?? [])])
  const idBase = useId()
  const Heading = `h${String(props.headingLevel ?? 3)}` as 'h2' | 'h3' | 'h4'

  const setQuery = (next: string) => {
    setInnerQuery(next)
    props.onQueryChange?.(next)
  }
  const setCategory = (next: string | null) => {
    setInnerCategory(next)
    props.onCategoryChange?.(next)
  }

  const labels = Object.fromEntries((props.categories ?? []).map((each) => [each.id, each.label]))
  const found = filterQuestions(props.questions, { query, category }, locale, labels)
  const shown = shownQuestions(found, props.limit)
  const filtered = questionsFiltered(query, category)
  const categories = props.categories ?? []

  const tools =
    props.search === true || categories.length > 0 ? (
      <div className="flex flex-col gap-3">
        {props.search === true && (
          <TextField
            type="search"
            label={props.searchLabel ?? messages['questions.search']}
            hideLabel
            placeholder={props.searchLabel ?? messages['questions.search']}
            value={query}
            onChange={setQuery}
          />
        )}
        {categories.length > 0 && (
          <QuestionCategoryChips
            categories={categories}
            category={category}
            onChange={setCategory}
          />
        )}
      </div>
    ) : null

  if (props.loading === true) {
    return (
      <div
        aria-busy="true"
        data-slot="common-questions"
        className={cn('flex flex-col gap-4', props.className)}
      >
        {tools}
        <span className="sr-only">{messages['field.loading']}</span>
        {Array.from({ length: props.skeletonCount ?? 4 }, (_, index) => (
          <Skeleton key={index} aria-hidden="true" className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }
  if (props.questions.length === 0) {
    return <div className={props.className}>{props.empty ?? <EmptyState compact />}</div>
  }

  return (
    <div data-slot="common-questions" className={cn('flex flex-col gap-4', props.className)}>
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
        <EmptyState
          variant="no-results"
          compact
          action={{
            label: messages['questions.clear'],
            onClick: () => {
              setQuery('')
              setCategory(null)
            },
          }}
        />
      ) : (
        <ul aria-label={props.label} className="m-0 flex list-none flex-col gap-3 p-0">
          {shown.map((question) => {
            const id = `${idBase}-${question.id}`
            const more =
              (question.steps?.length ?? 0) > 0 ||
              (question.documents?.length ?? 0) > 0 ||
              question.action !== undefined
            const isOpen = more && open.includes(question.id)
            const summary = (
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  id={`${id}-question`}
                  className={cn('text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}
                >
                  {question.question}
                </span>
                <span
                  id={`${id}-answer`}
                  className={cn('text-sm font-regular break-words text-secondary', TEXT_DIRECTION)}
                >
                  {question.answer}
                </span>
              </span>
            )
            return (
              <li
                key={question.id}
                {...langAttribute(question.lang, locale)}
                data-slot="question-card"
                data-open={isOpen || undefined}
                className="min-w-0 rounded-lg border border-solid border-default bg-surface-raised"
              >
                <Heading className="m-0 text-sm font-regular">
                  {more ? (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      {...(isOpen ? { 'aria-controls': `${id}-panel` } : {})}
                      aria-labelledby={`${id}-question`}
                      aria-describedby={`${id}-answer`}
                      onClick={() => {
                        setOpen((current) => toggleQuestion(current, question.id))
                      }}
                      className={cn(
                        BUTTON_RESET,
                        FOCUS_RING,
                        'flex w-full cursor-pointer items-start gap-3 rounded-lg p-4 text-start transition-colors duration-(--liro-duration-fast) ease-standard hover:bg-surface-hover',
                        isOpen && 'rounded-b-none',
                      )}
                    >
                      {summary}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 size-4 shrink-0 text-secondary transition-transform duration-(--liro-duration-fast) ease-standard',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                  ) : (
                    <span className="flex p-4">{summary}</span>
                  )}
                </Heading>
                {isOpen && (
                  <div
                    id={`${id}-panel`}
                    role="region"
                    aria-labelledby={`${id}-question`}
                    className="flex flex-col gap-4 border-0 border-t border-solid border-subtle p-4"
                  >
                    {question.steps !== undefined && question.steps.length > 0 && (
                      <Part id={`${id}-steps`} title={messages['questions.whatToDo']}>
                        <ol
                          aria-labelledby={`${id}-steps`}
                          className="m-0 flex flex-col gap-1 ps-5 text-sm text-primary"
                        >
                          {question.steps.map((step, index) => (
                            <li key={index} className={cn('break-words', TEXT_DIRECTION)}>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </Part>
                    )}
                    {question.documents !== undefined && question.documents.length > 0 && (
                      <Part id={`${id}-documents`} title={messages['questions.documents']}>
                        <ul
                          aria-labelledby={`${id}-documents`}
                          className="m-0 flex list-none flex-col gap-1 p-0"
                        >
                          {question.documents.map((document, index) => (
                            <li
                              key={index}
                              className="flex min-w-0 items-start gap-1.5 text-sm text-primary"
                            >
                              <FileText
                                aria-hidden="true"
                                className="mt-0.5 size-3.5 shrink-0 text-secondary"
                              />
                              <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>
                                {document}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </Part>
                    )}
                    {question.action !== undefined && (
                      <div className="flex">
                        <Button
                          intent="next"
                          emphasis="secondary"
                          label={question.action.label}
                          onClick={question.action.onSelect}
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * The category chips of CommonQuestions and QuestionsAndAnswers: "All" first, then the
 * application's categories, one pressed (the neutral selection, never blue, D17); with `counts`
 * each chip says how many questions it holds (WorklistPage's chips). Internal: not exported from
 * the package.
 */
export function QuestionCategoryChips({
  categories,
  category,
  onChange,
  counts,
}: {
  categories: readonly QuestionCategory[]
  category: string | null
  onChange: (category: string | null) => void
  counts?: { all: number; byCategory: Readonly<Record<string, number>> }
}) {
  const { messages, format } = useLiro()
  return (
    <div
      role="group"
      aria-label={messages['questions.categories']}
      className="flex flex-wrap gap-2"
    >
      {[{ id: null, label: messages['questions.all'] }, ...categories].map((each) => {
        const pressed = each.id === category
        const count =
          counts === undefined
            ? undefined
            : each.id === null
              ? counts.all
              : (counts.byCategory[each.id] ?? 0)
        return (
          <button
            key={each.id ?? ''}
            type="button"
            aria-pressed={pressed}
            onClick={() => {
              onChange(each.id)
            }}
            className={cn(
              BUTTON_RESET,
              FOCUS_RING,
              CHIP,
              pressed
                ? 'border-selected bg-surface-selected text-primary'
                : 'border-default bg-surface-raised text-primary hover:bg-surface-hover',
            )}
          >
            <span className={TEXT_DIRECTION}>{each.label}</span>
            {count !== undefined && (
              <span className={cn('font-semibold text-secondary tabular-nums', TEXT_ISOLATE)}>
                {format.number(String(count))}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** A titled part of an open card: its title names the list under it. */
function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p id={id} className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {title}
      </p>
      {children}
    </div>
  )
}

import { CircleCheck, CircleX } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * QuizResult (P5.12): the outcome of a quiz taken with the general Questionnaire (P5.1). The
 * application grades the answers and decides whether the quiz is passed; this shows it.
 * - The outcome first, in words and a tone (never colour alone): "Passed" with CircleCheck in
 *   status.success, or "Not passed" with CircleX in status.danger.
 * - The score, 20px semibold with tabular digits: "8 of 10 correct" (`format.number`), then the
 *   application's requirement ("At least 8 correct answers are needed to pass").
 * - The application's actions (Retake, Continue), the main one last.
 * - An optional review: each question with the answer given, "Correct" or "Incorrect" in words
 *   with its icon, and the correct answer where the given one was wrong.
 */

/** One answered question in the review. */
export interface QuizReviewItem {
  key: string
  question: string
  /** The answer given, as the application writes it. */
  answer: string
  correct: boolean
  /** The correct answer, shown under a wrong one. */
  correctAnswer?: string
}

export interface QuizResultProps {
  /** Correct answers, counted by the application. */
  correct: number
  total: number
  /** The application's decision. */
  passed: boolean
  /** A title above the outcome ("Quiz: Hazards on site"). */
  title?: string
  /** The title's level. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** What is needed to pass, from the application. */
  requirement?: string
  /** Buttons (Retake, Continue), the main one last. */
  actions?: ReactNode
  /** The answers, question by question. */
  review?: readonly QuizReviewItem[]
}

/** The outcome of a quiz: passed or not, the score, the requirement, the actions, the review. */
export function QuizResult(props: QuizResultProps) {
  const { messages, format } = useLiro()
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'
  const ReviewHeading = `h${String((props.headingLevel ?? 2) + 1)}` as 'h3'
  const Icon = props.passed ? CircleCheck : CircleX
  return (
    <section
      data-slot="quiz-result"
      aria-label={props.title ?? messages['quiz.review']}
      className="flex flex-col gap-4 font-sans text-primary"
    >
      {props.title !== undefined && (
        <Heading className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>{props.title}</Heading>
      )}
      <div role="status" className="flex flex-col gap-1">
        <p
          data-outcome={props.passed ? 'passed' : 'failed'}
          className={cn(
            'm-0 flex items-center gap-2 text-md font-semibold',
            props.passed ? 'text-status-success-fg' : 'text-status-danger-fg',
          )}
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span className={TEXT_DIRECTION}>
            {props.passed ? messages['quiz.passed'] : messages['quiz.failed']}
          </span>
        </p>
        <p className="m-0 text-xl font-semibold tabular-nums">
          {messages['quiz.score'](
            props.correct,
            props.total,
            format.number(String(props.correct)),
            format.number(String(props.total)),
          )}
        </p>
        {props.requirement !== undefined && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.requirement}</p>
        )}
      </div>
      {props.actions !== undefined && props.actions !== null && (
        <div className="flex flex-wrap items-center justify-end gap-2">{props.actions}</div>
      )}
      {props.review !== undefined && props.review.length > 0 && (
        <div className="flex flex-col gap-2">
          <ReviewHeading className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {messages['quiz.review']}
          </ReviewHeading>
          <ol className="m-0 flex list-none flex-col p-0">
            {props.review.map((item) => {
              const ItemIcon = item.correct ? CircleCheck : CircleX
              return (
                <li
                  key={item.key}
                  data-correct={item.correct}
                  className="flex flex-col gap-0.5 border-0 border-b border-solid border-subtle py-2 last:border-b-0"
                >
                  <span className={cn('text-sm font-medium', TEXT_DIRECTION)}>{item.question}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-sm text-secondary">
                    <span className={TEXT_DIRECTION}>
                      {messages['quiz.yourAnswer'](item.answer)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        item.correct ? 'text-status-success-fg' : 'text-status-danger-fg',
                      )}
                    >
                      <ItemIcon aria-hidden="true" className="size-3.5 shrink-0" />
                      {item.correct ? messages['quiz.correct'] : messages['quiz.incorrect']}
                    </span>
                  </span>
                  {!item.correct && item.correctAnswer !== undefined && (
                    <span className={cn('text-sm text-primary', TEXT_DIRECTION)}>
                      {messages['quiz.correctAnswer'](item.correctAnswer)}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}

import { CircleCheck, Send, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { asksWhy, type HelpfulAnswer } from './help-logic'
import { Spinner } from './spinner'
import { TextAreaField } from './text-field'

/*
 * HelpfulFeedback: "Was this helpful?" under a page the reader came to for
 * help — a help article, an answer, a generated summary. Two answers and, after "No", the
 * application may ask what was missing. Generic: the texts default to the provider's messages and
 * the application may give its own; what is done with the answer is the application's.
 * - A group named by the question (sm medium), then two buttons, "Yes" with ThumbsUp and "No" with
 *   ThumbsDown — words beside each icon, never an icon or a colour alone. They are toggle buttons
 *   (`aria-pressed`): the chosen one is the neutral selection (surface.selected,
 *   border.selected), and the reader may change the answer. Each 36px high (44px in the touch density).
 * - After an answer, a polite status under the buttons: "Thank you for telling us." (or the
 *   application's `thanks`), with a success CircleCheck.
 * - After "No" with `askWhy`: "What was missing?" (TextAreaField) and Send (neutral secondary: the
 *   page's main action is elsewhere); `onComment` may return a promise ("Sending…" while it
 *   runs). Once sent, "Thank you. Your comment was sent." in its place.
 * - `counts`: the application's words under the group ("12 of 14 people found this helpful").
 * Controlled (`answer`, `commentSent`) or not (`defaultAnswer`).
 */

export interface HelpfulFeedbackProps {
  /** The question. Default `messages['helpful.question']` ("Was this helpful?"). */
  question?: ReactNode
  /** The answer (controlled). */
  answer?: HelpfulAnswer | null
  /** The answer at first (uncontrolled). */
  defaultAnswer?: HelpfulAnswer
  onAnswer?: (answer: HelpfulAnswer) => void
  /** After "No", ask what was missing. */
  askWhy?: boolean
  /** The comment field's label. Default `messages['helpful.why']`. */
  whyLabel?: string
  /** Sends what was missing; a promise keeps the field waiting until it settles. */
  onComment?: (comment: string) => void | Promise<void>
  /** The comment was sent (controlled). */
  commentSent?: boolean
  /** The thanks after an answer. Default `messages['helpful.thanks']`. */
  thanks?: ReactNode
  /** The application's words about earlier answers ("12 of 14 people found this helpful"). */
  counts?: ReactNode
  className?: string
}

/** "Was this helpful?": Yes or No, then the thanks; after No, optionally what was missing. */
export function HelpfulFeedback(props: HelpfulFeedbackProps) {
  const { messages } = useLiro()
  const questionId = useId()
  const [innerAnswer, setInnerAnswer] = useState<HelpfulAnswer | null>(props.defaultAnswer ?? null)
  const answer = props.answer === undefined ? innerAnswer : props.answer
  const [comment, setComment] = useState('')
  const [innerSent, setInnerSent] = useState(false)
  const sent = props.commentSent ?? innerSent
  const [busy, setBusy] = useState(false)

  const choose = (next: HelpfulAnswer) => {
    setInnerAnswer(next)
    props.onAnswer?.(next)
  }
  const send = () => {
    const text = comment.trim()
    if (text === '' || busy) return
    const result = props.onComment?.(text)
    if (result instanceof Promise) {
      setBusy(true)
      result.then(
        () => {
          setBusy(false)
          setInnerSent(true)
        },
        () => {
          setBusy(false)
        },
      )
    } else {
      setInnerSent(true)
    }
  }

  const choice = (value: HelpfulAnswer) => {
    const pressed = answer === value
    const Icon = value === 'yes' ? ThumbsUp : ThumbsDown
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={() => {
          choose(value)
        }}
        className={cn(
          BUTTON_RESET,
          FOCUS_RING,
          'inline-flex h-control cursor-pointer items-center gap-2 rounded-sm border border-solid px-3.5 text-sm font-medium text-primary',
          pressed
            ? 'border-selected bg-surface-selected'
            : 'border-default bg-surface-raised hover:bg-surface-hover',
        )}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <span className={TEXT_DIRECTION}>
          {value === 'yes' ? messages['helpful.yes'] : messages['helpful.no']}
        </span>
      </button>
    )
  }

  const asking = asksWhy(answer, props.askWhy === true, sent)
  return (
    <div
      data-slot="helpful-feedback"
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      <div role="group" aria-labelledby={questionId} className="flex flex-col gap-2">
        <span id={questionId} className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {props.question ?? messages['helpful.question']}
        </span>
        <div className="flex flex-wrap gap-2">
          {choice('yes')}
          {choice('no')}
        </div>
      </div>
      {props.counts !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{props.counts}</span>
      )}
      <div role="status" className="empty:hidden">
        {answer !== null && (
          <span className="flex items-start gap-2">
            <CircleCheck
              aria-hidden="true"
              className="mt-px size-4 shrink-0 text-status-success-fg"
            />
            <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
              {answer === 'no' && sent
                ? messages['helpful.commentThanks']
                : (props.thanks ?? messages['helpful.thanks'])}
            </span>
          </span>
        )}
      </div>
      {asking && (
        <div className="flex flex-col gap-2">
          <TextAreaField
            label={props.whyLabel ?? messages['helpful.why']}
            rows={3}
            value={comment}
            onChange={(next) => {
              if (!busy) setComment(next)
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              family="neutral"
              emphasis="secondary"
              icon={Send}
              label={messages['helpful.send']}
              disabled={busy || comment.trim() === ''}
              onClick={send}
            />
            {busy && (
              <Spinner size="sm">
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  {messages['message.sending']}
                </span>
              </Spinner>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

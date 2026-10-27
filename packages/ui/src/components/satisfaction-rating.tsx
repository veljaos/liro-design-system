import { CircleCheck, Send } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { RadioGroup, RadioGroupItem } from '../primitives/radio-group'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button } from './button'
import { Field } from './field'
import {
  ratingAnswer,
  ratingOption,
  scaleValueText,
  type SatisfactionAnswer,
  type SatisfactionOption,
} from './help-logic'
import { Spinner } from './spinner'
import { TextAreaField } from './text-field'
import { usePhone } from './use-phone'

/*
 * SatisfactionRating (BUILD-PLAN P5.30 d): after something was done for the user — a request
 * solved, an appointment held, a course finished — one question on a scale ("How satisfied are
 * you with how we solved #4796?"), an optional comment, Send, then the thank-you state. Generic:
 * the question, the scale's steps and their words are the application's; the library only shows
 * them and reports the answer.
 * - **The scale is a radio group** named by the question (Field `group`): Tab enters it, the
 *   arrows move and choose (they follow the page's direction), Space chooses. Each step is a
 *   tile — the radio, the value (h3 size, semibold, tabular; digits through `format.number`) and
 *   the step's words (xs text.secondary, wrapping, centred) — so a step is never told by colour
 *   or by a face alone (WCAG 1.4.1; no emoji-only labels: every step has words). The whole tile is
 *   the radio's label, at least 44px high. The chosen tile is the neutral selection (D17):
 *   surface.selected with a border.selected border; only the radio's dot is blue.
 *   Desktop: the steps side by side in equal columns; phones (`layout="phone"` or the viewport):
 *   one row per step, the radio at the start, the value and the words in a line.
 * - **The comment** is a TextAreaField ("Comment (optional)", or the application's `commentLabel`);
 *   `comment={false}` leaves it out.
 * - **Send** (the primary family, filled: the rating is the page's main action when it is shown)
 *   reports `{ value, comment }`. Without a chosen step it says "Choose one of the answers." under
 *   the question instead of sending. `onSubmit` may return a promise: while it runs the controls
 *   wait and "Sending…" stands beside Send; a rejection keeps everything as it was. `sending` says
 *   the same from the application; a failure is the application's `error` (a danger Alert above
 *   Send).
 * - **Sent:** a polite status in place of the form — a success CircleCheck, the thanks ("Thank you
 *   for your feedback." or the application's `thanks`) and the answer in words ("Your answer: 4,
 *   Satisfied") with the comment under it. Controlled with `submitted`, or kept by the component
 *   after `onSubmit` succeeds.
 * - **Unavailable** (`unavailableReason`, P5.93): the answer cannot be given now. The scale and
 *   the comment are read-only (the read-only look of every field), Send is unavailable, and the
 *   reason stands under Send in words.
 */

export interface SatisfactionRatingProps {
  /** The question, from the application: it names the radio group. */
  question: ReactNode
  /** A line under the question ("Your answer helps us improve; it is seen by the support team."). */
  description?: ReactNode
  /** The scale's steps, lowest first, each with its words (usually five). */
  options: readonly SatisfactionOption[]
  /** The chosen step's value (controlled). */
  value?: string | null
  /** The step chosen at first (uncontrolled). */
  defaultValue?: string
  onChange?: (value: string) => void
  /** Offer the comment field. Default true. */
  comment?: boolean
  /** The comment field's label. Default `messages['rating.comment']` ("Comment (optional)"). */
  commentLabel?: string
  /** The comment (controlled). */
  commentValue?: string
  /** The comment at first (uncontrolled). */
  defaultComment?: string
  onCommentChange?: (comment: string) => void
  /** Sends the answer; a promise keeps the form waiting until it settles. */
  onSubmit: (answer: SatisfactionAnswer) => void | Promise<void>
  /** The application is sending. */
  sending?: boolean
  /** Sending failed: the application's words, in a danger Alert above Send. */
  error?: ReactNode
  /** The answer as sent: shows the thank-you state (controlled). */
  submitted?: SatisfactionAnswer | null
  /** The thank-you text. Default `messages['rating.thanks']`. */
  thanks?: ReactNode
  /**
   * No answer can be given now, and why, from the application: the scale and the comment are
   * read-only and Send is unavailable, with the reason in words.
   */
  unavailableReason?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** One question on a scale, an optional comment, Send, then the thanks. */
export function SatisfactionRating(props: SatisfactionRatingProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const idBase = useId()
  const [innerValue, setInnerValue] = useState<string | null>(props.defaultValue ?? null)
  const value = props.value === undefined ? innerValue : props.value
  const [innerComment, setInnerComment] = useState(props.defaultComment ?? '')
  const comment = props.commentValue ?? innerComment
  const [innerSubmitted, setInnerSubmitted] = useState<SatisfactionAnswer | null>(null)
  const submitted = props.submitted === undefined ? innerSubmitted : props.submitted
  const [busy, setBusy] = useState(false)
  const [missing, setMissing] = useState(false)
  const sending = busy || props.sending === true
  const disabled = props.unavailableReason !== undefined && props.unavailableReason !== null
  const reasonId = `${idBase}-reason`
  const withComment = props.comment !== false

  if (submitted !== null) {
    const option = ratingOption(props.options, submitted.value)
    return (
      <div
        role="status"
        data-slot="satisfaction-rating"
        className={cn('flex min-w-0 items-start gap-3 font-sans', props.className)}
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-status-success-fg" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {props.thanks ?? messages['rating.thanks']}
          </p>
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['rating.given'](
              scaleValueText(format, submitted.value),
              option?.label ?? submitted.value,
            )}
          </p>
          {submitted.comment !== '' && (
            <p
              dir="auto"
              className={cn('m-0 text-sm break-words whitespace-pre-line text-secondary')}
            >
              {submitted.comment}
            </p>
          )}
        </div>
      </div>
    )
  }

  const choose = (next: string) => {
    if (disabled || sending) return
    setInnerValue(next)
    setMissing(false)
    props.onChange?.(next)
  }
  const writeComment = (next: string) => {
    if (sending) return
    setInnerComment(next)
    props.onCommentChange?.(next)
  }
  const send = () => {
    if (disabled || sending) return
    const answer = ratingAnswer(props.options, value, withComment ? comment : '')
    if (answer === null) {
      setMissing(true)
      return
    }
    const result = props.onSubmit(answer)
    if (result instanceof Promise) {
      setBusy(true)
      result.then(
        () => {
          setBusy(false)
          setInnerSubmitted(answer)
        },
        () => {
          setBusy(false)
        },
      )
    } else {
      setInnerSubmitted(answer)
    }
  }

  return (
    <div
      data-slot="satisfaction-rating"
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      <Field
        label={props.question}
        group
        {...(props.description === undefined ? {} : { description: props.description })}
        {...(missing ? { error: messages['rating.required'] } : {})}
        readOnly={disabled}
      >
        {(control) => (
          <RadioGroup
            value={value ?? ''}
            onValueChange={choose}
            aria-labelledby={control.labelId}
            aria-describedby={control.describedBy}
            aria-invalid={control.invalid || undefined}
            aria-readonly={disabled || sending || undefined}
            title={disabled ? messages['field.readOnly'] : undefined}
            className={cn('gap-2', phone ? 'flex flex-col' : 'grid')}
            style={
              phone
                ? undefined
                : {
                    gridTemplateColumns: `repeat(${String(Math.max(1, props.options.length))}, minmax(0, 1fr))`,
                  }
            }
          >
            {props.options.map((option, index) => {
              const id = `${idBase}-${String(index)}`
              const chosen = option.value === value
              const off = disabled || sending
              return (
                <label
                  key={option.value}
                  htmlFor={id}
                  data-slot="rating-step"
                  className={cn(
                    'box-border flex min-h-11 min-w-0 rounded-md border border-solid',
                    phone
                      ? 'items-center gap-3 px-3 py-2'
                      : 'flex-col items-center gap-1.5 px-2 pt-3 pb-2.5 text-center',
                    chosen
                      ? 'border-selected bg-surface-selected'
                      : 'border-default bg-surface-raised',
                    off
                      ? 'cursor-default'
                      : cn('cursor-pointer', !chosen && 'hover:bg-surface-hover'),
                  )}
                >
                  <RadioGroupItem
                    id={id}
                    value={option.value}
                    readOnly={off}
                    className={cn(control.invalid && 'border-status-danger-fg')}
                  />
                  <span
                    className={cn(
                      'flex min-w-0',
                      phone ? 'flex-1 items-baseline gap-2' : 'flex-col items-center gap-0.5',
                    )}
                  >
                    <span
                      className={cn(
                        'text-h3 font-semibold tabular-nums',
                        'text-primary',
                        TEXT_ISOLATE,
                      )}
                    >
                      {scaleValueText(format, option.value)}
                    </span>{' '}
                    <span
                      className={cn(
                        'min-w-0 text-xs break-words',
                        'text-secondary',
                        phone ? TEXT_DIRECTION : TEXT_ISOLATE,
                      )}
                    >
                      {option.label}
                    </span>
                  </span>
                </label>
              )
            })}
          </RadioGroup>
        )}
      </Field>
      {withComment && (
        <TextAreaField
          label={props.commentLabel ?? messages['rating.comment']}
          rows={3}
          value={comment}
          onChange={writeComment}
          readOnly={disabled}
        />
      )}
      {props.error !== undefined && props.error !== null && props.error !== false && (
        <Alert tone="danger">{props.error}</Alert>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          family="primary"
          emphasis="primary"
          icon={Send}
          label={messages['rating.send']}
          disabled={disabled || sending}
          {...(disabled ? { 'aria-describedby': reasonId } : {})}
          onClick={send}
        />
        {disabled && (
          <span id={reasonId} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
            {props.unavailableReason}
          </span>
        )}
        {sending && (
          <Spinner size="sm">
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
              {messages['message.sending']}
            </span>
          </Spinner>
        )}
      </div>
    </div>
  )
}

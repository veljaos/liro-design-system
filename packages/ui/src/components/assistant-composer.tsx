import { ArrowUp, Square } from 'lucide-react'
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { questionKey, questionReady } from './assistant-logic'
import { IconButton } from './button'
import { Field, FieldMessage, READ_ONLY_EMPTY } from './field'
import { Spinner } from './spinner'

/*
 * AssistantComposer (BUILD-PLAN P5.34): the box where the user asks an assistant in plain words.
 * - One text box with the ask button inside it, at the bottom end: a 36px IconButton (ArrowUp,
 *   the primary family, filled once there is a question; named "Ask"). Enter asks, Shift+Enter
 *   starts a new line (and Enter while an input method composes a word types), as every
 *   composer (`questionKey`, tested). Asking empties the box unless it is controlled.
 * - `size` 'panel' (default): the side panel's box, 2 lines, 14px text. 'page': the "Ask" page's
 *   large centred box — 3 lines, 16px text, more room, a soft shadow — with the keys written
 *   under it ("Enter asks, Shift+Enter starts a new line").
 * - The box grows with the text (field-sizing) up to 12 lines, then scrolls.
 * - `busy`: an answer is being written. It shows (P5.94 item 12): "Answering…" with a small ring
 *   in the bottom row, and the ask button becomes Stop (a square, named "Stop", `onStop`); without
 *   `onStop` the ask button waits, disabled and without a tooltip. The next question can be typed
 *   meanwhile but not sent: Enter only waits.
 * - `unavailableReason` (the assistant is off for this company, P5.93 item 1): nothing can be
 *   asked. The box is read-only (the one non-editable look of every field) and Ask is an
 *   unavailable action with its reason in words under the box, which describes the button.
 * - The label names the box for assistive technology (default "Your question"); the visible
 *   prompt is the placeholder.
 */

export interface AssistantComposerProps {
  /** The box's name for assistive technology. Default `messages['assistant.question']`. */
  label?: string
  /** Shown while the box is empty ("Ask about your company's data"). From the application. */
  placeholder?: string
  /** Controlled text. */
  value?: string
  /** Uncontrolled initial text. */
  defaultValue?: string
  onChange?: (text: string) => void
  /** Asks the question (trimmed). */
  onAsk: (question: string) => void
  /** An answer is being written: "Answering…", and the ask button becomes Stop (or waits). */
  busy?: boolean
  /** Stops the answer being written: the ask button becomes Stop while `busy`. */
  onStop?: () => void
  /**
   * No question can be asked, and why (from the application): the box is read-only and the
   * reason stands under it, describing the unavailable Ask button.
   */
  unavailableReason?: ReactNode
  /** 'panel' (default) or 'page' (the "Ask" page's large box). */
  size?: 'panel' | 'page'
  className?: string
}

/** The question box: Enter asks, Shift+Enter starts a new line. */
export function AssistantComposer(props: AssistantComposerProps) {
  const { messages } = useLiro()
  const [inner, setInner] = useState(props.defaultValue ?? '')
  const text = props.value ?? inner
  const page = props.size === 'page'
  const reasonId = `${useId()}-reason`
  const unavailable = props.unavailableReason !== undefined && props.unavailableReason !== null
  const ready = questionReady(text) && !unavailable && props.busy !== true

  const setText = (next: string) => {
    setInner(next)
    props.onChange?.(next)
  }
  const ask = () => {
    if (!ready) return
    props.onAsk(text.trim())
    setText('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const action = questionKey({
      key: event.key,
      shiftKey: event.shiftKey,
      isComposing: event.nativeEvent.isComposing,
    })
    if (action !== 'ask') return
    event.preventDefault()
    ask()
  }

  return (
    <Field
      label={props.label ?? messages['assistant.question']}
      hideLabel
      readOnly={unavailable}
      className={cn('font-sans', props.className)}
    >
      {(control) => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <div
            data-slot="assistant-composer"
            data-size={page ? 'page' : 'panel'}
            className={cn(
              'box-border flex min-w-0 flex-col border border-solid border-control bg-surface-raised transition-colors duration-(--liro-duration-fast) focus-within:border-focus',
              page ? 'gap-2 rounded-lg p-3 shadow-xs' : 'gap-1 rounded-md p-2',
              control.readOnly && 'border-default bg-surface-disabled focus-within:border-default',
            )}
          >
            <textarea
              id={control.id}
              aria-describedby={
                [control.describedBy, unavailable ? reasonId : undefined]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              readOnly={control.readOnly}
              value={text}
              rows={page ? 3 : 2}
              enterKeyHint="send"
              dir="auto"
              {...(control.readOnly
                ? { placeholder: READ_ONLY_EMPTY }
                : props.placeholder === undefined
                  ? {}
                  : { placeholder: props.placeholder })}
              onChange={(event) => {
                if (!control.readOnly) setText(event.target.value)
              }}
              onKeyDown={onKeyDown}
              className={cn(
                'm-0 box-border block max-h-[12lh] w-full min-w-0 resize-none border-0 bg-transparent p-1 font-sans text-primary outline-none [field-sizing:content] text-match-parent placeholder:text-tertiary read-only:cursor-text read-only:placeholder:text-secondary',
                page ? 'min-h-[3lh] text-md' : 'min-h-[2lh] text-sm',
              )}
            />
            <div className="flex items-center justify-end gap-2">
              {props.busy === true ? (
                <span className="flex min-w-0 flex-1 items-center">
                  <Spinner size="sm">
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {messages['assistant.answering']}
                    </span>
                  </Spinner>
                </span>
              ) : (
                page &&
                !control.readOnly && (
                  <span className={cn('min-w-0 flex-1 text-xs text-tertiary', TEXT_DIRECTION)}>
                    {messages['assistant.askHint']}
                  </span>
                )
              )}
              {props.busy === true && props.onStop !== undefined ? (
                <IconButton
                  family="neutral"
                  emphasis="secondary"
                  icon={Square}
                  label={messages['assistant.stop']}
                  onClick={props.onStop}
                />
              ) : (
                <IconButton
                  family="primary"
                  emphasis={ready ? 'primary' : 'secondary'}
                  icon={ArrowUp}
                  label={messages['assistant.ask']}
                  disabled={!ready}
                  {...(unavailable ? { 'aria-describedby': reasonId } : {})}
                  onClick={ask}
                />
              )}
            </div>
          </div>
          {unavailable && (
            <FieldMessage id={reasonId} tone="hint">
              {props.unavailableReason}
            </FieldMessage>
          )}
        </div>
      )}
    </Field>
  )
}

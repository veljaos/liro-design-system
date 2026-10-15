import { ArrowUp } from 'lucide-react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { questionKey, questionReady } from './assistant-logic'
import { IconButton } from './button'
import { Field } from './field'

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
 * - `busy`: an answer is being written; the box can be typed in, the ask button waits (Stop is
 *   the answer's).
 * - Disabled with a visible reason, as every field (the assistant is off for this company).
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
  /** An answer is being written: the ask button waits. */
  busy?: boolean
  /** No question can be asked. Give `disabledReason`. */
  disabled?: boolean
  /** Why, under the box. */
  disabledReason?: ReactNode
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
  const disabled = props.disabled === true
  const ready = questionReady(text) && !disabled && props.busy !== true

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
      {...(disabled ? { disabled: true } : {})}
      {...(props.disabledReason === undefined ? {} : { disabledReason: props.disabledReason })}
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
              control.disabled && 'border-default bg-surface-disabled',
            )}
          >
            <textarea
              id={control.id}
              aria-describedby={control.describedBy}
              disabled={control.disabled}
              value={text}
              rows={page ? 3 : 2}
              enterKeyHint="send"
              dir="auto"
              {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
              onChange={(event) => {
                setText(event.target.value)
              }}
              onKeyDown={onKeyDown}
              className={cn(
                'm-0 box-border block max-h-[12lh] w-full min-w-0 resize-none border-0 bg-transparent p-1 font-sans text-primary outline-none [field-sizing:content] text-match-parent placeholder:text-tertiary disabled:cursor-not-allowed disabled:text-disabled',
                page ? 'min-h-[3lh] text-md' : 'min-h-[2lh] text-sm',
              )}
            />
            <div className="flex items-center justify-end gap-2">
              {page && !control.disabled && (
                <span className={cn('min-w-0 flex-1 text-xs text-tertiary', TEXT_DIRECTION)}>
                  {messages['assistant.askHint']}
                </span>
              )}
              <IconButton
                family="primary"
                emphasis={ready ? 'primary' : 'secondary'}
                icon={ArrowUp}
                label={messages['assistant.ask']}
                disabled={!ready}
                onClick={ask}
              />
            </div>
          </div>
        </div>
      )}
    </Field>
  )
}

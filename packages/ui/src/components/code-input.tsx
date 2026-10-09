import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { INPUT, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  codeBoxes,
  codeComplete,
  codeKeyTarget,
  codeValue,
  eraseCode,
  fillCode,
  type CodeKind,
} from './code-input-logic'
import { FieldMessage, RequiredMark } from './field'

/*
 * CodeInput (BUILD-PLAN P5.6): a one-time code in separate boxes.
 * - One accessible group named by the label (`role="group"`), each box a text input named
 *   "Character 2 of 6" (`messages['code.box']`, numbers through `format.number`); the description
 *   and the error belong to the group and to every box.
 * - Pasting the whole code works in any box: a text with as many characters as there are boxes
 *   fills them all from the first (`fillCode`); a shorter one fills from the box pasted into.
 *   The first box has `autocomplete="one-time-code"`, so a phone offers the code from a message;
 *   the browser fills it there and the same rule spreads it. Numeric codes bring the numeric
 *   keyboard (`inputMode="numeric"`).
 * - Keys: a character fills the box and moves on; Backspace empties the box, or the one before
 *   when it is empty, and moves there; Delete empties the box; the arrows move between boxes,
 *   Home and End to the first and last.
 * - The code is written left to right in every language, as numbers are (P2.3a): the boxes keep
 *   that order in a right-to-left page, and the arrows follow it (B.7: the code's leading edge is
 *   its left; `codeKeyTarget` is given the boxes' direction).
 * - Boxes 40 × 44px, 8px apart (six fit a 360px phone), the field's look; centred text, tabular
 *   digits, the md size. When every box is filled, `onComplete` receives the code.
 */

export interface CodeInputProps {
  /** Names the group of boxes, from the application ("Code from the authenticator app"). */
  label: ReactNode
  /** How many characters. Default 6. */
  length?: number
  /** 'numeric' (default) or 'alphanumeric' (letters taken in upper case). */
  kind?: CodeKind
  /** Controlled value: the characters typed so far, an empty box as a space. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Every change, with the value as `value` describes it. */
  onChange?: (value: string) => void
  /** Every box is filled: the whole code. */
  onComplete?: (code: string) => void
  /** A hint under the label, from the application ("Sent to +381 64 ••• 12 34"). */
  description?: ReactNode
  /** The problem with the code, from the application ("The code has expired."). */
  error?: ReactNode
  /** Marks the code as required. */
  required?: boolean
  /** The boxes cannot be used; give `disabledReason` so the user sees why. */
  disabled?: boolean
  disabledReason?: ReactNode
  /** The form field name: the code is submitted as one value. */
  name?: string
  /** Puts the focus in the first box when shown. */
  autoFocus?: boolean
  className?: string
}

/** A one-time code typed or pasted into boxes. */
export function CodeInput(props: CodeInputProps) {
  const { messages, format, direction } = useLiro()
  const id = useId()
  const length = props.length ?? 6
  const kind = props.kind ?? 'numeric'
  const [inner, setInner] = useState(props.defaultValue ?? '')
  const boxes = codeBoxes(props.value ?? inner, length)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const disabled = props.disabled === true
  const hasError = props.error !== undefined && props.error !== null && props.error !== false
  const hasDescription = props.description !== undefined && props.description !== null
  const showReason = disabled && !hasError && props.disabledReason !== undefined
  const labelId = `${id}-label`
  const describedBy =
    [
      hasDescription ? `${id}-description` : null,
      hasError ? `${id}-error` : null,
      showReason ? `${id}-reason` : null,
    ]
      .filter((part) => part !== null)
      .join(' ') || undefined

  // The application asks for the focus (the code step of a sign-in flow): the first box.
  useEffect(() => {
    if (props.autoFocus === true) refs.current[0]?.focus()
  }, [props.autoFocus])

  const focusBox = (index: number) => {
    const box = refs.current[index]
    box?.focus()
    box?.select()
  }
  const commit = (next: string[], focus: number) => {
    const value = codeValue(next)
    setInner(value)
    props.onChange?.(value)
    focusBox(focus)
    if (codeComplete(next)) props.onComplete?.(next.join(''))
  }
  const enter = (index: number, text: string) => {
    const { boxes: next, focus } = fillCode(boxes, index, text, kind)
    if (next.join('\u0000') === boxes.join('\u0000')) {
      focusBox(index)
      return
    }
    commit(next, focus)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const { boxes: next, focus } = eraseCode(boxes, index)
      commit(next, focus)
      return
    }
    if (event.key === 'Delete') {
      event.preventDefault()
      const next = [...boxes]
      next[index] = ''
      commit(next, index)
      return
    }
    // The boxes are always laid out left to right (see above).
    const target = codeKeyTarget(event.key, index, length, 'ltr')
    if (target === null) return
    event.preventDefault()
    focusBox(target)
  }

  return (
    <div
      data-slot="code-input"
      data-invalid={hasError || undefined}
      data-disabled={disabled || undefined}
      className={cn('flex min-w-0 flex-col font-sans', props.className)}
    >
      <span id={labelId} className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {props.label}
        {props.required === true && <RequiredMark />}
      </span>
      {hasDescription && (
        <p
          id={`${id}-description`}
          className={cn('m-0 text-xs leading-tight text-secondary', TEXT_DIRECTION)}
        >
          {props.description}
        </p>
      )}
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        dir="ltr"
        // The boxes stand at the page's start: the start of a right-to-left page is its right.
        className={cn(
          'mt-1 flex gap-2',
          direction === 'rtl' && 'justify-end',
          (hasError || showReason) && 'mb-[5px]',
        )}
      >
        {boxes.map((box, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="text"
            inputMode={kind === 'numeric' ? 'numeric' : 'text'}
            pattern={kind === 'numeric' ? '[0-9]*' : undefined}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoCapitalize={kind === 'numeric' ? 'off' : 'characters'}
            autoCorrect="off"
            spellCheck={false}
            aria-label={messages['code.box'](
              index + 1,
              format.number(String(index + 1)),
              length,
              format.number(String(length)),
            )}
            aria-describedby={describedBy}
            aria-invalid={hasError || undefined}
            aria-required={props.required === true || undefined}
            disabled={disabled}
            value={box}
            onFocus={(event) => {
              event.currentTarget.select()
            }}
            onKeyDown={(event) => {
              onKeyDown(event, index)
            }}
            onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
              event.preventDefault()
              enter(index, event.clipboardData.getData('text'))
            }}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              // A typed character replaces the box's (it was selected); autofill brings the
              // whole code at once.
              const text = event.currentTarget.value
              const typed =
                box !== '' && text.length === box.length + 1 ? text.replace(box, '') : text
              enter(index, typed)
            }}
            className={cn(INPUT, 'h-11 w-10 shrink-0 px-0 text-center text-md tabular-nums')}
          />
        ))}
      </div>
      {props.name !== undefined && <input type="hidden" name={props.name} value={boxes.join('')} />}
      {hasError && (
        <FieldMessage id={`${id}-error`} tone="error">
          {props.error}
        </FieldMessage>
      )}
      {showReason && (
        <FieldMessage id={`${id}-reason`} tone="hint">
          {props.disabledReason}
        </FieldMessage>
      )}
    </div>
  )
}

import { Delete } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { buttonClassName, type ButtonLook } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, READ_ONLY, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { Emphasis } from './intents'
import { READ_ONLY_EMPTY } from './field'
import {
  decimalSeparator,
  entryFromValue,
  keypadInput,
  keypadKeyFor,
  keypadText,
  keypadValue,
  type KeypadKey,
} from './keypad-logic'
import { currencyFirst } from './number-logic'

/*
 * NumericKeypad (BUILD-PLAN P5.10; docs/decisions.md "Touch and POS"). An amount or a quantity
 * entered with fingers at a till, or with the keyboard: 0–9, the decimal separator of the
 * provider's `format`, backspace, clear and an optional Enter. It reports a decimal string or
 * null, never a JavaScript number (D4), and never rounds: `maxDecimals` stops more digits from
 * being typed instead.
 *
 * - The display and the keys are laid out left to right in every direction, as calculators and
 *   card terminals are: 7 8 9 on top; the label follows the page. Keys 56px high (at least 44px, P5.10), 8px apart, the raised surface with a 1px
 *   border.default border, 20px semibold digits; Enter is a button of the primary family.
 * - The display is a read-only input named by `label` with `inputmode="none"`, so a tablet shows
 *   no on-screen keyboard over the keypad. It is not a live region: each key is not announced
 *   (nothing noisy); a screen reader reads the value on focus.
 * - Hardware keyboard: while the focus is in the keypad, digits, "." and ",", Backspace, Delete
 *   (clear) and Enter (on the display) work; Escape is left to a dialog around it.
 */

export interface NumericKeypadProps {
  /** What is typed, the display's name ("Amount tendered"). From the application. */
  label: string
  /** Controlled value: a decimal string, or null for empty. */
  value?: string | null
  /** Uncontrolled initial value. */
  defaultValue?: string | null
  /** Called with the decimal string (or null) after each key that changes it. */
  onChange?: (value: string | null) => void
  /** Adds the Enter key; called with the value on Enter (the key or the keyboard). */
  onEnter?: (value: string | null) => void
  /** The Enter key's text. Default: `messages['keypad.enter']`. */
  enterLabel?: string
  /**
   * The Enter key's weight. Default 'primary'; 'secondary' where the screen has another main
   * action (one primary per screen, D13).
   */
  enterEmphasis?: Extract<Emphasis, 'primary' | 'secondary'>
  /** Shown beside the display, on the side `format.money` puts it. From the application. */
  currency?: string
  /**
   * The most decimals that can be typed; 0 removes the separator key. Default: the provider's
   * `format.moneyDecimals` with a `currency`, otherwise no limit.
   */
  maxDecimals?: number
  /** The most digits in all. Default 12. */
  maxDigits?: number
  /** The label for assistive technology only, where a heading beside it already names it. */
  hideLabel?: boolean
  /** False hides the display, where the screen shows the value elsewhere. Default true. */
  showDisplay?: boolean
  /** Shown in the display while it is empty. Default: zero, written by `format.number`. */
  placeholder?: string
  /**
   * The value is shown but cannot be changed (the register is locked): the display in the
   * read-only look of every field, no keys (P5.93: there is no disabled keypad).
   */
  readOnly?: boolean
  /** Layout classes (width, margins). */
  className?: string
}

const KEY_ROWS: readonly (readonly KeypadKey[])[] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['decimal', '0', 'backspace'],
]

const KEY =
  'flex h-14 min-w-0 cursor-pointer items-center justify-center rounded-md border border-solid border-default bg-surface-raised font-sans text-xl font-semibold text-primary tabular-nums select-none touch-manipulation transition-colors enabled:hover:bg-surface-hover enabled:active:bg-surface-sunken disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-disabled disabled:text-disabled'

/** The keypad's entry and the value it reports, controlled or not. */
function useKeypadEntry(props: NumericKeypadProps) {
  const [entry, setEntry] = useState(() =>
    entryFromValue(props.value ?? props.defaultValue ?? null),
  )
  // A value from the application (a quick amount) replaces what is typed; the value the keypad
  // just reported keeps the entry as typed ("12," reports "12").
  const [seen, setSeen] = useState(props.value)
  if (props.value !== seen) {
    setSeen(props.value)
    if (props.value !== undefined && props.value !== keypadValue(entry)) {
      setEntry(entryFromValue(props.value))
    }
  }
  return [entry, setEntry] as const
}

/**
 * A keypad for amounts and quantities at a till or a handheld, by finger or keyboard; it reports
 * a decimal string.
 */
export function NumericKeypad(props: NumericKeypadProps) {
  const { messages, format } = useLiro()
  const displayId = useId()
  const [entry, setEntry] = useKeypadEntry(props)
  const maxDecimals =
    props.maxDecimals ?? (props.currency === undefined ? undefined : format.moneyDecimals)
  const readOnly = props.readOnly === true
  const hasEnter = props.onEnter !== undefined
  const showDisplay = props.showDisplay ?? true

  const press = (key: KeypadKey) => {
    if (readOnly) return
    if (key === 'enter') {
      props.onEnter?.(keypadValue(entry))
      return
    }
    const next = keypadInput(entry, key, {
      ...(maxDecimals === undefined ? {} : { maxDecimals }),
      ...(props.maxDigits === undefined ? {} : { maxDigits: props.maxDigits }),
    })
    if (next === entry) return
    setEntry(next)
    const value = keypadValue(next)
    if (value !== keypadValue(entry)) props.onChange?.(value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const key = keypadKeyFor(event.key)
    if (key === null) return
    // Enter on a key button presses that button; on the display it is the keypad's Enter.
    const onDisplay = (event.target as HTMLElement).id === displayId
    if (key === 'enter' && (!onDisplay || !hasEnter)) return
    event.preventDefault()
    press(key)
  }

  const label = (key: KeypadKey): string => {
    switch (key) {
      case 'decimal':
        return decimalSeparator(format)
      case 'backspace':
        return messages['keypad.backspace']
      case 'clear':
        return messages['keypad.clear']
      case 'enter':
        return props.enterLabel ?? messages['keypad.enter']
      default:
        return format.number(key)
    }
  }

  const text = keypadText(entry, format)
  const currency = props.currency
  const first = currency !== undefined && currencyFirst(format, currency)
  const currencyText = currency !== undefined && (
    <span aria-hidden="true" className="shrink-0 text-md font-regular text-secondary">
      {currency}
    </span>
  )
  const enterLook: ButtonLook = {
    family: 'primary',
    emphasis: props.enterEmphasis ?? 'primary',
    shape: 'text',
  }

  return (
    <div
      role="group"
      aria-label={messages['keypad.label']}
      data-slot="numeric-keypad"
      className={cn('flex w-full max-w-80 flex-col gap-2 font-sans', props.className)}
    >
      {showDisplay && (
        <label
          htmlFor={displayId}
          className={cn(
            'text-sm font-semibold text-primary',
            TEXT_DIRECTION,
            props.hideLabel === true && 'sr-only',
          )}
        >
          {props.label}
          {currency !== undefined && <span className="sr-only"> {currency}</span>}
        </label>
      )}
      {showDisplay && (
        <div
          dir="ltr"
          className={cn(
            'flex h-14 items-center gap-2 rounded-md border border-solid border-control bg-surface-raised px-3 focus-within:border-focus',
            readOnly && cn(READ_ONLY, 'focus-within:border-default'),
          )}
        >
          {first && currencyText}
          <input
            id={displayId}
            readOnly
            inputMode="none"
            autoComplete="off"
            value={text}
            {...(readOnly ? { title: messages['field.readOnly'] } : {})}
            placeholder={readOnly ? READ_ONLY_EMPTY : (props.placeholder ?? format.number('0'))}
            onKeyDown={onKeyDown}
            className={cn(
              'm-0 h-full min-w-0 flex-1 cursor-default border-0 bg-transparent p-0 text-end font-sans text-h3 font-semibold text-primary tabular-nums outline-none placeholder:text-tertiary',
              readOnly &&
                'cursor-text placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            )}
          />
          {!first && currencyText}
        </div>
      )}
      {!readOnly && (
        <div dir="ltr" className="grid grid-cols-3 gap-2">
          {KEY_ROWS.flat().map((key) =>
            key === 'decimal' && maxDecimals === 0 ? (
              <span key={key} aria-hidden="true" />
            ) : (
              <button
                key={key}
                type="button"
                data-key={key}
                {...(key === 'backspace' || key === 'decimal'
                  ? { 'aria-label': key === 'decimal' ? messages['keypad.decimal'] : label(key) }
                  : {})}
                {...(key === 'backspace' ? { title: label(key) } : {})}
                className={cn(BUTTON_RESET, KEY, FOCUS_RING)}
                onKeyDown={onKeyDown}
                onClick={() => {
                  press(key)
                }}
              >
                {key === 'backspace' ? (
                  <Delete aria-hidden="true" className="size-6" />
                ) : (
                  label(key)
                )}
              </button>
            ),
          )}
          <button
            type="button"
            data-key="clear"
            className={cn(
              BUTTON_RESET,
              KEY,
              FOCUS_RING,
              'text-md',
              hasEnter ? 'col-span-1' : 'col-span-3',
            )}
            onKeyDown={onKeyDown}
            onClick={() => {
              press('clear')
            }}
          >
            <span className={TEXT_DIRECTION}>{label('clear')}</span>
          </button>
          {hasEnter && (
            <button
              type="button"
              data-key="enter"
              className={cn(buttonClassName(enterLook), 'col-span-2 h-14 text-md')}
              onKeyDown={onKeyDown}
              onClick={() => {
                press('enter')
              }}
            >
              <span className={TEXT_DIRECTION}>{label('enter')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

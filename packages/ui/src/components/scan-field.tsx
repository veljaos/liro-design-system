import { Camera, CircleCheck, CircleX, ScanBarcode } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { INPUT, READ_ONLY, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import { scanDecision, type ScanOptions } from './scan-logic'
import { Tooltip } from './popover'

/*
 * ScanField. A hardware scanner is a keyboard
 * that types the code in a burst and presses Enter. The field takes both a scan and a person
 * typing the code: on Enter it reports the code with where it came from — 'scanner' when the
 * characters arrived as a burst (`scanDecision`: at least 4, each within 50ms), 'keyboard'
 * otherwise — empties itself and keeps the focus for the next scan. Whether the code is known is
 * the application's: it answers with `feedback`, shown under the field with an icon and words
 * (never colour alone) and announced politely; `onFeedback` is called for each new feedback, so
 * the application can play a sound or vibrate. A camera button (optional) calls the
 * application's `onCameraScan`; no camera code lives here. The code is written left to right.
 */

/** The application's answer to a scan: shown under the field, announced, and passed on. */
export interface ScanFeedback {
  /** A new id for every answer, so the same words twice are still a new answer. */
  id: string | number
  tone: 'success' | 'error'
  /** What happened, from the application ("Kifla 60 g added", "Unknown code 8600123"). */
  text: string
}

export interface ScanFieldProps extends FieldBaseProps {
  /** A code was scanned or typed and Enter pressed. */
  onScan: (code: string, source: 'scanner' | 'keyboard') => void
  /** The application's answer to the last scan; null or absent shows nothing. */
  feedback?: ScanFeedback | null
  /** Called once for each new `feedback` (a new id): play a sound, vibrate. */
  onFeedback?: (feedback: ScanFeedback) => void
  /** Adds the camera button; the application opens its camera and scans. */
  onCameraScan?: () => void
  /** The camera button's name. Default: `messages['scan.camera']`. */
  cameraLabel?: string
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** Text standing typed when it appears (an application restoring a half-typed code). */
  defaultValue?: string
  /** Takes the focus when it appears: the screen's first job is to scan. */
  takeFocus?: boolean
  /**
   * 'none' keeps the on-screen keyboard closed on a handheld whose scanner is its keyboard.
   * Default 'text'.
   */
  inputMode?: 'text' | 'none'
  /** How a scan is told from typing. Default: 50ms between characters, at least 4. */
  scanOptions?: ScanOptions
}

/** The field's own props without its layout classes, which belong to the outer frame. */
function withoutClassName(props: ScanFieldProps) {
  const field = fieldProps(props)
  delete field.className
  return field
}

/** The field a scanner types into: reports each code on Enter and stays ready for the next. */
export function ScanField(props: ScanFieldProps) {
  const { messages } = useLiro()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(props.defaultValue ?? '')
  const times = useRef<number[]>([])
  const feedback = props.feedback ?? null

  // Each new answer once (not the one the field appeared with: a restored screen is silent).
  const lastFeedback = useRef(feedback?.id)
  const { onFeedback } = props
  useEffect(() => {
    if (feedback === null || feedback.id === lastFeedback.current) return
    lastFeedback.current = feedback.id
    onFeedback?.(feedback)
  }, [feedback, onFeedback])

  const takeFocus = props.takeFocus === true
  useEffect(() => {
    if (takeFocus) input.current?.focus()
  }, [takeFocus])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Read-only: nothing is scanned in now.
      if (props.readOnly === true) return
      const code = text.trim()
      const source =
        scanDecision(times.current, props.scanOptions) === 'scan' ? 'scanner' : 'keyboard'
      times.current = []
      if (code === '') return
      setText('')
      props.onScan(code, source)
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      times.current = [...times.current, event.timeStamp]
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      // Editing is a person at work.
      times.current = []
    }
  }

  return (
    <div data-slot="scan-field" className={cn('flex min-w-0 flex-col', props.className)}>
      <Field {...withoutClassName(props)}>
        {(control) => (
          <div className="flex items-center gap-2">
            <div
              dir="ltr"
              className={cn(
                INPUT,
                'flex items-center gap-2 px-3 focus-within:border-focus',
                control.invalid && 'border-status-danger-fg',
                control.readOnly &&
                  cn(
                    READ_ONLY,
                    'has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                  ),
              )}
            >
              <ScanBarcode aria-hidden="true" className="size-4 shrink-0 text-secondary" />
              <input
                {...controlAttributes(control)}
                ref={input}
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="go"
                inputMode={props.inputMode ?? 'text'}
                value={text}
                {...(props.placeholder === undefined || control.readOnly
                  ? {}
                  : { placeholder: props.placeholder })}
                onChange={(event) => {
                  if (control.readOnly) return
                  setText(event.target.value)
                  if (event.target.value === '') times.current = []
                }}
                onKeyDown={onKeyDown}
                className="m-0 h-full min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-sm text-primary tabular-nums outline-none placeholder:text-tertiary read-only:placeholder:text-secondary"
              />
            </div>
            {props.onCameraScan !== undefined && !control.readOnly && (
              <Tooltip label={props.cameraLabel ?? messages['scan.camera']}>
                <ButtonPrimitive
                  family="neutral"
                  emphasis="secondary"
                  shape="icon"
                  aria-label={props.cameraLabel ?? messages['scan.camera']}
                  onClick={() => {
                    props.onCameraScan?.()
                  }}
                >
                  <Camera aria-hidden="true" className="size-4 shrink-0" />
                </ButtonPrimitive>
              </Tooltip>
            )}
          </div>
        )}
      </Field>
      {/* Always in the page, so a new answer is announced. */}
      <div role="status">
        {feedback !== null && (
          <p
            key={feedback.id}
            data-tone={feedback.tone}
            className={cn(
              'mx-0 mt-2 mb-0 flex items-start gap-2 rounded-md border border-solid px-3 py-2 text-sm text-primary',
              feedback.tone === 'success'
                ? 'border-status-success-border bg-status-success-bg'
                : 'border-status-danger-border bg-status-danger-bg',
            )}
          >
            {feedback.tone === 'success' ? (
              <CircleCheck
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-status-success-fg"
              />
            ) : (
              <CircleX
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-status-danger-fg"
              />
            )}
            <span className={cn('min-w-0', TEXT_DIRECTION)}>
              <span className="sr-only">
                {feedback.tone === 'success'
                  ? messages['scan.success']
                  : messages['scan.error']}{' '}
              </span>
              {feedback.text}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

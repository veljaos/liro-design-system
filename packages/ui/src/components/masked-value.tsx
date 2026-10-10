import { CircleAlert, Eye, EyeOff, ScrollText } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ButtonPrimitive, LoadingButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Dialog } from './dialog'
import { RadioGroupField } from './radio-group-field'
import { Spinner } from './spinner'
import { TextAreaField } from './text-field'

/*
 * MaskedValue (BUILD-PLAN P5.14): a sensitive value — a diagnosis, a salary, a personal number —
 * shown masked until the user says why they need it. The access is the application's to record:
 * the component asks the reason, reports it, and shows the value the application then passes.
 * - Masked: "••••" (decorative) with the value's name and "hidden" for assistive technology, and
 *   a small neutral "Show" button (Eye, 24px). The real value is never in the page while masked:
 *   the application passes `value` only after `onReveal`.
 * - "Show" opens a Dialog: the reasons from the application as radio buttons, with "Other" and its
 *   own text (`allowOther`); without a list the reason is written. Under them the note that the
 *   access is logged (`logNote`, default from messages), with a ScrollText icon. The Show button
 *   enables once a reason is given; `onReveal({ reason, text })` — `reason` the chosen value, or
 *   null for "Other" and for a written reason. A returned promise keeps the dialog working (the
 *   button busy, not dismissible); it closes when the promise resolves and stays open when it
 *   rejects, with the application's `error` in a danger Alert.
 * - Revealed: the value, and "Hide" (EyeOff), which hides it at once and calls `onHide` so the
 *   application can drop it; `hideAfter` hides it by itself after that many milliseconds. The
 *   focus that was on "Hide" goes back to "Show".
 * - `loading`: the value is on its way (a small Spinner and "Showing …"). `error` outside the
 *   dialog: the refusal in danger text beside the mask. `notAllowedReason`: "Show" is unavailable
 *   (aria-disabled, focusable) and the reason stands beside it in words. `readOnly`: only the
 *   mask, no action (a printout, a summary).
 */

/** A reason the application offers for seeing the value. */
export interface MaskedValueReason {
  value: string
  label: string
}

/** The reason the user gave: the chosen reason's value (null for "Other" or a written one) and the text. */
export interface RevealRequest {
  reason: string | null
  text: string
}

export interface MaskedValueProps {
  /** What the value is, from the application ("Salary", "Diagnosis"): names the controls. */
  label: string
  /**
   * The value, passed by the application only after the reveal (D1: the component never fetches
   * it). Without it the value is masked.
   */
  value?: ReactNode
  /** The reasons to choose from, from the application. Without them the reason is written. */
  reasons?: readonly MaskedValueReason[]
  /** Adds "Other" after the reasons, with a text field for the reason in words. */
  allowOther?: boolean
  /**
   * The user gave a reason: the application records it and passes `value`. A promise keeps the
   * dialog working until it settles; a rejection keeps it open (with `error`).
   */
  onReveal?: (request: RevealRequest) => void | Promise<void>
  /** The value was hidden again (by "Hide" or `hideAfter`): the application may drop it. */
  onHide?: () => void
  /** Hides the revealed value by itself after this many milliseconds. */
  hideAfter?: number
  /** The value is on its way (the application fetches it after the reason). */
  loading?: boolean
  /** The application refused to show it, in its words: in the dialog, or beside the mask. */
  error?: ReactNode
  /** The note that the access is logged. Default: `messages['masked.logged']`. */
  logNote?: ReactNode
  /** The user may not see the value, and why (shown in words beside the unavailable "Show"). */
  notAllowedReason?: string
  /** Only the mask, without "Show" (a printout, a summary). */
  readOnly?: boolean
  /** The reason dialog is open when the value first shows (a page restored as it was left). */
  defaultAsking?: boolean
  /** Layout classes. */
  className?: string
}

/** Mantine Button 'compact-xs' (24px): small enough to stand inside a line of values. */
const SMALL_BUTTON = 'min-h-6 gap-1 px-2 text-xs'

/** The value of "Other" in the radio group (internal; reported as `reason: null`). */
const OTHER = '\u0000other'

/** Whether a reason is complete enough to ask with. */
export function revealReady(chosen: string | undefined, text: string, hasList: boolean): boolean {
  if (!hasList || chosen === OTHER) return text.trim() !== ''
  return chosen !== undefined
}

/** The request reported for a choice and its text. */
export function revealRequest(chosen: string | undefined, text: string): RevealRequest {
  return chosen === undefined || chosen === OTHER
    ? { reason: null, text: text.trim() }
    : { reason: chosen, text: text.trim() }
}

/** A sensitive value: masked until the user gives a reason, then shown, then hidden again. */
export function MaskedValue(props: MaskedValueProps) {
  const { messages } = useLiro()
  const [asking, setAsking] = useState(props.defaultAsking === true)
  const [busy, setBusy] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  const [text, setText] = useState('')
  const reasonId = useId()
  const root = useRef<HTMLSpanElement>(null)
  const showButton = useRef<HTMLButtonElement>(null)
  const refocus = useRef(false)
  const shown = props.value !== undefined && props.value !== null && !hidden
  const reasons = props.reasons ?? []
  const hasList = reasons.length > 0
  const options = [
    ...reasons,
    ...(hasList && props.allowOther === true
      ? [{ value: OTHER, label: messages['masked.other'] }]
      : []),
  ]

  const hide = () => {
    if (root.current?.contains(document.activeElement) === true) refocus.current = true
    setHidden(true)
    props.onHide?.()
  }

  // Hides by itself after `hideAfter` (every reveal starts the time again).
  const { hideAfter } = props
  const onHide = useRef(hide)
  useEffect(() => {
    onHide.current = hide
  })
  useEffect(() => {
    if (!shown || hideAfter === undefined) return
    const timer = window.setTimeout(() => {
      onHide.current()
    }, hideAfter)
    return () => {
      window.clearTimeout(timer)
    }
  }, [shown, hideAfter])

  // The focus that was on "Hide" goes back to "Show".
  useEffect(() => {
    if (!refocus.current || shown) return
    refocus.current = false
    showButton.current?.focus()
  })

  const reset = () => {
    setChosen(undefined)
    setText('')
  }
  const setOpen = (open: boolean) => {
    if (busy && !open) return
    setAsking(open)
    if (!open) reset()
  }
  const ask = () => {
    const result = props.onReveal?.(revealRequest(chosen, text))
    if (result instanceof Promise) {
      setBusy(true)
      result.then(
        () => {
          setBusy(false)
          setHidden(false)
          setAsking(false)
          reset()
        },
        () => {
          setBusy(false)
        },
      )
    } else {
      setHidden(false)
      setAsking(false)
      reset()
    }
  }

  const ready = revealReady(chosen, text, hasList)
  const otherChosen = chosen === OTHER

  const mask = (
    <>
      <span aria-hidden="true" className="tracking-widest text-secondary select-none">
        ••••
      </span>
      <span className="sr-only">{messages['masked.hidden'](props.label)}</span>
    </>
  )

  let content: ReactNode
  if (shown) {
    content = (
      <>
        <span className={cn('text-primary', TEXT_ISOLATE)}>{props.value}</span>
        {props.readOnly !== true && (
          <ButtonPrimitive
            family="neutral"
            emphasis="menu"
            className={SMALL_BUTTON}
            aria-label={messages['masked.hideLabel'](props.label)}
            onClick={hide}
          >
            <EyeOff aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{messages['masked.hide']}</span>
          </ButtonPrimitive>
        )}
      </>
    )
  } else if (props.loading === true) {
    content = (
      <>
        {mask}
        <Spinner size="sm" label={messages['masked.loading'](props.label)} />
      </>
    )
  } else {
    const notAllowed = props.notAllowedReason !== undefined
    content = (
      <>
        {mask}
        {props.readOnly !== true && (
          <ButtonPrimitive
            ref={showButton}
            family="neutral"
            emphasis="menu"
            className={cn(
              SMALL_BUTTON,
              notAllowed && 'cursor-not-allowed text-disabled hover:bg-transparent',
            )}
            aria-label={messages['masked.showLabel'](props.label)}
            {...(notAllowed ? { 'aria-disabled': true, 'aria-describedby': reasonId } : {})}
            onClick={() => {
              if (!notAllowed) setOpen(true)
            }}
          >
            <Eye aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{messages['masked.show']}</span>
          </ButtonPrimitive>
        )}
        {notAllowed && (
          <span id={reasonId} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['masked.notAllowed'](props.notAllowedReason ?? '')}
          </span>
        )}
        {props.error !== undefined && props.error !== null && !asking && (
          <span className="inline-flex items-center gap-1 text-xs text-status-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{props.error}</span>
          </span>
        )}
      </>
    )
  }

  return (
    <span
      ref={root}
      data-slot="masked-value"
      data-state={shown ? 'shown' : 'masked'}
      className={cn(
        'inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm',
        props.className,
      )}
    >
      {content}
      {props.readOnly !== true && props.notAllowedReason === undefined && (
        <Dialog
          open={asking}
          onOpenChange={setOpen}
          dismissible={!busy}
          title={messages['masked.revealTitle'](props.label)}
          actions={
            <>
              <ButtonPrimitive
                family="neutral"
                emphasis="secondary"
                disabled={busy}
                onClick={() => {
                  setOpen(false)
                }}
              >
                <span className={TEXT_DIRECTION}>{messages['dialog.cancel']}</span>
              </ButtonPrimitive>
              <LoadingButtonPrimitive
                family="primary"
                emphasis="primary"
                loading={busy}
                disabled={!ready}
                onClick={ask}
              >
                <Eye aria-hidden="true" className="size-3.75 shrink-0" />
                <span className={TEXT_DIRECTION}>{messages['masked.show']}</span>
              </LoadingButtonPrimitive>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {props.error !== undefined && props.error !== null && (
              <Alert tone="danger">{props.error}</Alert>
            )}
            {hasList ? (
              <RadioGroupField
                label={messages['masked.reason']}
                required
                options={options}
                {...(chosen === undefined ? {} : { value: chosen })}
                onChange={setChosen}
              />
            ) : null}
            {(!hasList || otherChosen) && (
              <TextAreaField
                label={hasList ? messages['masked.otherText'] : messages['masked.reason']}
                required
                rows={2}
                value={text}
                onChange={setText}
              />
            )}
            <p className="m-0 flex items-start gap-2 text-xs text-secondary">
              <ScrollText aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className={TEXT_DIRECTION}>{props.logNote ?? messages['masked.logged']}</span>
            </p>
          </div>
        </Dialog>
      )}
    </span>
  )
}

import { Check, CircleCheck, CircleSlash, Sparkles, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { actionOffers, type ProposedActionState } from './assistant-logic'
import { Button } from './button'
import { KeyValueList, type KeyValueItem } from './cards'
import { Spinner } from './spinner'

/*
 * ProposedAction: an action an assistant proposes — post a document, send a
 * reminder — as a card that always waits for the user. Nothing happens on its own: the card shows
 * what would be done (the application's title, text and facts) and offers Dismiss, then Confirm
 * (the main action last); only Confirm runs it, through the application's `onConfirm`.
 * - The card: a raised surface with a border.default line and radius lg, never a tone (a
 *   proposal is not a status). Over the title a small mark — Sparkles and "Proposed action" in
 *   text.secondary — and under the facts the note "Nothing is done until you confirm.".
 * - States: 'proposed'; 'running' (both buttons wait, "Working…" with a spinner; a promise from
 *   `onConfirm` sets it when the card is not controlled); 'done' (a polite status: a success
 *   CircleCheck and the application's `result` — "Posted as entry 2026-0884." with its link);
 *   'dismissed' ("Dismissed. Nothing was done.", text.secondary, or the application's `result`);
 *   'failed' (the application's `error` in a danger Alert; Confirm can be pressed again).
 * - Controlled with `state`, or kept by the card: Confirm → running → done (a rejected promise →
 *   failed), Dismiss → dismissed.
 * - `unavailableReason`: the user may not run it (no right, a closed period): Confirm is disabled
 *   and the reason is written over the buttons, in words.
 * Generic: the words "post", "invoice" are the application's.
 */

export interface ProposedActionProps {
  /** What would be done, from the application ("Post invoice 2026-1187 from Beton Mix d.o.o."). */
  title: ReactNode
  /** A line under it: what follows from it. */
  description?: ReactNode
  /** The facts of what would be done (account, amount, date), as KeyValueList items. */
  details?: readonly KeyValueItem[]
  /** Controlled state. */
  state?: ProposedActionState
  /** The outcome in words once done or dismissed, from the application (may hold a link). */
  result?: ReactNode
  /** Why it failed, from the application, in a danger Alert ('failed'). */
  error?: ReactNode
  /** Confirm's text. Default `messages['assistant.confirm']`. */
  confirmLabel?: string
  /** Dismiss's text. Default `messages['assistant.dismiss']`. */
  dismissLabel?: string
  /** Runs the action. A promise keeps the card running until it settles. */
  onConfirm: () => void | Promise<void>
  onDismiss: () => void
  /** The action cannot be run by this user: Confirm is disabled and this reason is shown. */
  unavailableReason?: ReactNode
  className?: string
}

/** An action an assistant proposes: it waits for Confirm or Dismiss. */
export function ProposedAction(props: ProposedActionProps) {
  const { messages } = useLiro()
  const [inner, setInner] = useState<ProposedActionState>('proposed')
  const state = props.state ?? inner
  const offers = actionOffers(state)
  const running = state === 'running'
  const unavailable = props.unavailableReason !== undefined

  const confirm = () => {
    if (running || unavailable) return
    const outcome = props.onConfirm()
    if (outcome instanceof Promise) {
      setInner('running')
      outcome.then(
        () => {
          setInner('done')
        },
        () => {
          setInner('failed')
        },
      )
    } else {
      setInner('done')
    }
  }
  const dismiss = () => {
    if (running) return
    setInner('dismissed')
    props.onDismiss()
  }

  return (
    <section
      data-slot="proposed-action"
      data-state={state}
      aria-busy={running || undefined}
      className={cn(
        'box-border flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans text-primary',
        props.className,
      )}
    >
      <p
        className={cn(
          'm-0 flex items-center gap-1.5 text-xs font-medium text-secondary',
          TEXT_DIRECTION,
        )}
      >
        <Sparkles aria-hidden="true" className="size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{messages['assistant.proposed']}</span>
      </p>
      <h3 className={cn('m-0 text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}>
        {props.title}
      </h3>
      {props.description !== undefined && (
        <p className={cn('m-0 text-sm break-words text-secondary', TEXT_DIRECTION)}>
          {props.description}
        </p>
      )}
      {props.details !== undefined && props.details.length > 0 && (
        <KeyValueList items={props.details} columns={1} />
      )}
      {state === 'done' && (
        <p role="status" className="m-0 flex items-start gap-2 text-sm text-primary">
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-status-success-fg"
          />
          <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>{props.result}</span>
        </p>
      )}
      {state === 'dismissed' && (
        <p role="status" className="m-0 flex items-start gap-2 text-sm text-secondary">
          <CircleSlash aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>
            {props.result ?? messages['assistant.dismissed']}
          </span>
        </p>
      )}
      {state === 'failed' && props.error !== undefined && (
        <Alert tone="danger">{props.error}</Alert>
      )}
      {(offers.confirm || offers.dismiss) && (
        <>
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {unavailable ? props.unavailableReason : messages['assistant.waits']}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {running && (
              <Spinner size="sm" className="me-auto">
                <span className="text-xs text-secondary">{messages['assistant.running']}</span>
              </Spinner>
            )}
            <Button
              family="neutral"
              icon={X}
              label={props.dismissLabel ?? messages['assistant.dismiss']}
              disabled={running}
              onClick={dismiss}
            />
            <Button
              family="primary"
              icon={Check}
              emphasis="primary"
              label={props.confirmLabel ?? messages['assistant.confirm']}
              disabled={running || unavailable}
              onClick={confirm}
            />
          </div>
        </>
      )}
    </section>
  )
}

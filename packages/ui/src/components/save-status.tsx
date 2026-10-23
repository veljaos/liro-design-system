import { Check, CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * SaveStatus (P5.90 item 21, the owner's review: "toasts never block"): the inline, quiet answer
 * to a routine save, placed beside the action that saved ("Saved" beside Save, in a form's bar, in
 * a row). A routine save is never confirmed by a toast; a toast is for an outcome somewhere else,
 * closes by itself and covers nothing (`notice`).
 * - 'saving': a small spinning ring (Spinner sm) and "Saving…" in the secondary colour.
 * - 'saved': a 14px check and "Saved" in status.success.fg, 12px. It stays until the application
 *   changes the state (the next edit sets 'idle').
 * - 'error': the application's words in status.danger.fg with an icon, announced at once
 *   (`role="alert"`); the user stays where they are and can save again.
 * - 'idle': nothing, and no room taken.
 * The live region is always present (`role="status"`), so "Saved" is announced politely. The
 * words are the provider's messages (`save.saving`, `save.saved`) or the application's.
 */

/** Where a routine save stands. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveStatusProps {
  state: SaveState
  /** Why the save failed, in the application's words; shown with 'error'. */
  error?: ReactNode
  /** Default: `messages['save.saved']` ("Saved"). */
  savedText?: string
  /** Default: `messages['save.saving']` ("Saving…"). */
  savingText?: string
  /** Layout classes (margins). */
  className?: string
}

/** "Saved" beside the action that saved: the inline confirmation of a routine save. */
export function SaveStatus(props: SaveStatusProps) {
  const { messages } = useLiro()
  const showError = props.state === 'error' && props.error !== undefined && props.error !== null
  return (
    <span
      data-slot="save-status"
      data-state={props.state}
      className={cn('inline-flex min-w-0 items-center font-sans text-xs', props.className)}
    >
      <span role="status" className="inline-flex min-w-0 items-center">
        {props.state === 'saving' && (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-secondary">
            {/* The Spinner's ring only: the words beside it are the status. */}
            <span
              aria-hidden="true"
              className="box-border inline-block size-3.5 shrink-0 animate-liro-spin rounded-full border-[1.75px] border-solid border-brand border-s-transparent motion-reduce:animate-none"
            />
            <span className={cn('break-words', TEXT_DIRECTION)}>
              {props.savingText ?? messages['save.saving']}
            </span>
          </span>
        )}
        {props.state === 'saved' && (
          <span className="inline-flex min-w-0 items-center gap-1 text-status-success-fg">
            <Check aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={cn('break-words', TEXT_DIRECTION)}>
              {props.savedText ?? messages['save.saved']}
            </span>
          </span>
        )}
      </span>
      {showError && (
        <span role="alert" className="inline-flex min-w-0 items-start gap-1 text-status-danger-fg">
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span className={cn('break-words', TEXT_DIRECTION)}>{props.error}</span>
        </span>
      )}
    </span>
  )
}

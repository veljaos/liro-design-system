import { Undo2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import type { IconComponent } from './intents'

/*
 * InlineUndo (P5.93 item 3, the owner's fourth review: "in POS and restaurant flows no toasts for
 * routine actions; Undo inline beside what changed"). What just happened, in the application's
 * words, and an Undo button, in the place where it happened: a removed line's place in a cart,
 * the table's panel on a floor plan, a moved booking's row. Nothing to dismiss and nothing that
 * covers the screen; the application takes it away at the next change (or after a while).
 * - One line where it fits: the words (14px, text.secondary, with the application's icon, a
 *   check by default only when given) at the start and "Undo" (a neutral secondary button with
 *   the Undo2 icon) after them; the button wraps under the words when the row is narrow.
 * - The words are a polite live region, announced as they appear; the button is described by
 *   them ("Undo", "Krempita removed").
 * - It never asks: Undo puts back what changed (the application's `onUndo`), no confirmation.
 */

export interface InlineUndoProps {
  /** What just happened, in the application's words ("Krempita removed"). */
  message: ReactNode
  /** Puts it back; the application's. */
  onUndo: () => void
  /** The button's words. Default: `messages['undo.label']` ("Undo"). */
  undoLabel?: string
  /** An icon before the words (lucide), from the application. */
  icon?: IconComponent
  /** Layout classes (margins, padding). */
  className?: string
}

/** "Krempita removed · Undo" in the place where it happened. */
export function InlineUndo(props: InlineUndoProps) {
  const { messages } = useLiro()
  const messageId = useId()
  const Icon = props.icon
  return (
    <div
      data-slot="inline-undo"
      className={cn(
        'flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2 font-sans text-sm',
        props.className,
      )}
    >
      <p
        id={messageId}
        role="status"
        className={cn('m-0 min-w-0 flex-1 basis-40 break-words text-secondary', TEXT_DIRECTION)}
      >
        {Icon !== undefined && (
          <Icon aria-hidden="true" className="me-1.5 inline size-4 align-[-0.1875em]" />
        )}
        {props.message}
      </p>
      <Button
        family="neutral"
        emphasis="secondary"
        icon={Undo2}
        label={props.undoLabel ?? messages['undo.label']}
        aria-describedby={messageId}
        onClick={props.onUndo}
      />
    </div>
  )
}

import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * The buttons of a multi-step flow (P5.23, the owner's review of the import wizard on phones; not
 * exported from the package): Back, then the step's main action last.
 * - Desktop: one row under the step's content, `start` (Cancel) at the start and the buttons at
 *   the end; it wraps only when it must.
 * - Phones: ONE row — the buttons never wrap onto rows of their own; a long label wraps inside its
 *   button (P2.7d) — stuck to the bottom of the screen while the flow is in view: above the
 *   AppShell's bottom bar (`--liro-shell-bottom`), clear of the home indicator. Only Back and the
 *   main action; Cancel is not in it (the flow's header has a close button instead). An
 *   unavailable main action's reason is one line under the row (`note`, UnavailableAction
 *   `reasonId`).
 * ImportWizard and FormWizard use it.
 */

export interface WizardFooterProps {
  phone: boolean
  /** Desktop only: at the start of the row (Cancel). */
  start?: ReactNode
  /** Back, then the main action. */
  children: ReactNode
  /** Phones: the main action's unavailable reason, under the row; its id names it. */
  note?: { id: string; text: string }
  /** The border and the padding of the flow's card. */
  className?: string
}

/** The row of Back and the main action of a multi-step flow. */
export function WizardFooter({ phone, start, children, note, className }: WizardFooterProps) {
  if (phone) {
    return (
      <div
        data-slot="wizard-footer"
        className={cn(
          'sticky bottom-[var(--liro-shell-bottom,0px)] z-(--liro-layer-sticky) flex flex-col gap-1.5 bg-surface-raised pt-3 pb-[max(12px,calc(env(safe-area-inset-bottom)-var(--liro-shell-bottom,0px)))]',
          className,
        )}
      >
        <div className="flex flex-nowrap items-center justify-end gap-2 [&>*]:min-w-0">
          {children}
        </div>
        {note !== undefined && (
          <p id={note.id} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {note.text}
          </p>
        )}
      </div>
    )
  }
  return (
    <div data-slot="wizard-footer" className={cn('flex flex-wrap items-center gap-2', className)}>
      {start}
      <div className="ms-auto flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  )
}

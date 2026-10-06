import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * PageHeader (P4.3, the owner's decision, docs/decisions.md "Page header"): the page's title (h1)
 * at the start and its main action at the end, on the page background.
 * - `titleHidden`: no redundant title — where the active module tab already names the page
 *   ("Invoices"), the h1 stays for screen readers only, and the row holds just the actions at the
 *   end. ListPage hides it by default; detail, document, settings and report pages keep it
 *   visible, because there it carries information (a record's number, a person's name) or no tab
 *   names the page. The document title ("Invoices – Liro Business Apps") is the application's.
 */

export interface PageHeaderProps {
  /** The page's title, from the application: always the page's h1. */
  title: string
  /** Shown to screen readers only (the module tab already names the page). Default false. */
  titleHidden?: boolean
  /** The page's actions at the end, the main one last (AGENTS.md D13). */
  actions?: ReactNode
  className?: string
}

/** The page's title and its main action. */
export function PageHeader({ title, titleHidden = false, actions, className }: PageHeaderProps) {
  if (titleHidden) {
    return (
      <>
        <h1 className="sr-only">{title}</h1>
        {actions !== undefined && (
          <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
            {actions}
          </div>
        )}
      </>
    )
  }
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}>
      <h1 className={cn('m-0 min-w-0 text-h1 text-primary', TEXT_DIRECTION)}>{title}</h1>
      {actions !== undefined && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

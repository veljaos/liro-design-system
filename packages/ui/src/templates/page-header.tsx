import { ArrowLeft } from 'lucide-react'
import { forwardRef, type MouseEvent, type ReactNode } from 'react'
import { Tooltip } from '../components/popover'
import { buttonClassName } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * PageHeader (P4.3, P4.4; the owner's decisions, docs/decisions.md "Page header" and "Detail and
 * record form pages"): the page's title (h1) at the start and its main action at the end, on the
 * page background.
 * - `titleHidden`: no redundant title — where the active module tab already names the page
 *   ("Invoices"), the h1 stays for screen readers only, and the row holds just the actions at the
 *   end. ListPage hides it by default; detail, document, settings and report pages keep it
 *   visible, because there it carries information (a record's number, a person's name) or no tab
 *   names the page. The document title ("Invoices – Liro Business Apps") is the application's.
 * - `back` (the old style): an icon-only subtle neutral button, 28px, radius md, ArrowLeft 18px
 *   (mirrored in right-to-left), at the start of the title in the same row; its name and tooltip
 *   "Back to <list>" (`messages['page.backTo']`); a link through the provider's linkComponent.
 * - `status` stands after the title (a StatusBadge); `subtitle` is a line under it (sm,
 *   text.secondary): the record's second identity ("Employee · Kvadrat Gradnja d.o.o.").
 */

/** Where the back button leads: the list the record belongs to. */
export interface PageBack {
  /** The list's address. */
  href: string
  /** The list's name ("Employees"): the button says "Back to Employees". */
  label: string
  /**
   * Called on a press before the link is followed; `preventDefault()` keeps the page (the
   * unsaved-changes guard of RecordFormPage).
   */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export interface PageHeaderProps {
  /** The page's title, from the application: always the page's h1. */
  title: string
  /** Shown to screen readers only (the module tab already names the page). Default false. */
  titleHidden?: boolean
  /** The back button at the start of the title. */
  back?: PageBack
  /** After the title, in the same row: a StatusBadge. */
  status?: ReactNode
  /** A line under the title. */
  subtitle?: ReactNode
  /** The page's actions at the end, the main one last (AGENTS.md D13). */
  actions?: ReactNode
  className?: string
}

/** The back button: a link drawn as the 28px subtle icon button. */
export const BackButton = forwardRef<HTMLAnchorElement, { back: PageBack }>(function BackButton(
  { back },
  ref,
) {
  const { messages, linkComponent: Link } = useLiro()
  const name = messages['page.backTo'](back.label)
  return (
    <Tooltip label={name}>
      <Link
        ref={ref}
        href={back.href}
        aria-label={name}
        {...(back.onClick === undefined ? {} : { onClick: back.onClick })}
        className={cn(
          buttonClassName({ family: 'neutral', emphasis: 'menu', shape: 'compact' }),
          'no-underline visited:text-family-neutral-fg',
        )}
      >
        <ArrowLeft aria-hidden="true" className="size-4.5 shrink-0 rtl:-scale-x-100" />
      </Link>
    </Tooltip>
  )
})

/** The page's title and its main action. */
export function PageHeader(props: PageHeaderProps) {
  const { title, titleHidden = false, back, status, subtitle, actions, className } = props
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
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {back !== undefined && <BackButton back={back} />}
          <h1 className={cn('m-0 min-w-0 text-h1 text-primary', TEXT_DIRECTION)}>{title}</h1>
          {status}
        </div>
        {subtitle !== undefined && (
          <p
            className={cn(
              'm-0 text-sm text-secondary',
              back !== undefined && 'ms-10',
              TEXT_DIRECTION,
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions !== undefined && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

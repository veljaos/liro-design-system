import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { SectionCard } from '../components/cards'
import { FormActions, FormBottomBar, useUnsavedChangesGuard } from '../components/form-layout'
import type { StickyActions } from '../components/form-logic'
import { KeyFigures, type KeyFigure } from '../components/key-figures'
import { SECTION_SCROLL_MARGIN, SectionBar } from '../components/section-bar'
import { usePhone } from '../components/use-phone'
import { cn } from '../primitives/cn'
import { PageHeader, type PageBack } from './page-header'

/*
 * DetailPage and RecordFormPage (BUILD-PLAN P4.4; the owner's values, docs/decisions.md "Detail
 * and record form pages"; view and edit mode from P4.9, "Records: one page, read and edited").
 * - The header: the back button, the title (h1, visible: it names the record), the status, a
 *   subtitle line, the actions at the end; then the key figures (KeyFigures), 16px under it.
 * - DetailPage: the sections stacked as SectionCards (the system's record group, as the forms'
 *   FormSection), 16px apart; values as plain text (KeyValueList), never disabled inputs; an
 *   optional SectionBar, sticky under the shell, for long pages. A record has no tabs and no side
 *   column (P4.9): history and files are sections too.
 * - Edit mode (SAP Fiori, P4.9): one mode for the whole record. The application's one "Edit"
 *   header action sets `mode` 'edit'; the same sections then show their `edit` content (fields)
 *   in the same order, and a section with `editable: false` keeps its read-only content; the
 *   header actions and section actions go away, and a bar sticky at the bottom (FormBottomBar:
 *   "Unsaved changes" when `dirty`, `editActions` — Cancel, then Save — at the end) stays visible
 *   while the page scrolls, on phones too; the first field takes the focus; while `dirty`, the
 *   back button and closing the page ask first (one unsaved-changes guard). No per-section Edit
 *   buttons.
 * - The side column (`side`, for pages that are not records): 300px from lg (75em), 24px from
 *   the content; below 75em and in the phone layout under the content, never hidden.
 * - RecordFormPage: a new record's form (FormSections): the actions at the top and the bottom bar
 *   only while the top ones are out of view (FormActions), the same unsaved-changes guard.
 * - Page padding 24px (lg), 16px (md) on phones, as ListPage; the content's maximum width.
 */

/** One section of a detail page. */
export interface DetailSection {
  /** The id the section bar scrolls to; unique on the page. */
  id: string
  /** The section's name: its heading and its entry in the section bar. */
  label: string
  /** A line under the heading. */
  description?: ReactNode
  /** Actions at the end of the section's header (view mode only). */
  actions?: ReactNode
  /** No padding around the content (a table). */
  flush?: boolean
  /** The section's values to read (a KeyValueList). */
  content: ReactNode
  /** The same values as fields, shown in edit mode. */
  edit?: ReactNode
  /**
   * False keeps the read-only `content` in edit mode (the user may not change this part, from
   * the application). Default: true when `edit` is given.
   */
  editable?: boolean
}

interface PageFrame {
  /** The record's name or number: the page's h1. */
  title: string
  /** The back button to the list (its address and name). */
  back?: PageBack
  /** After the title: a StatusBadge. */
  status?: ReactNode
  /** A line under the title. */
  subtitle?: ReactNode
  /** Two to four key figures under the title. */
  keyFigures?: readonly KeyFigure[]
  /** The side column: panels from the application. Not on a record (P4.9). */
  side?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

export interface DetailPageProps extends PageFrame {
  /** The page's actions at the end of the header, the main one last (view mode only). */
  actions?: ReactNode
  sections: readonly DetailSection[]
  /** The sticky section bar, for long pages. Default false. */
  sectionBar?: boolean
  /** 'view' (default) or 'edit': the whole record at once, from the application. */
  mode?: 'view' | 'edit'
  /** Edit mode: the bottom bar's actions (an ActionGroup: Cancel, then Save). */
  editActions?: ReactNode
  /** Edit mode: unsaved changes; the bar says so, and leaving asks first. */
  dirty?: boolean
}

export interface RecordFormPageProps extends PageFrame {
  /** The form's actions (an ActionGroup), at the top and in the bottom bar. */
  actions: ReactNode
  /** The form: FormSections. */
  children: ReactNode
  /** Unsaved changes: the bottom bar says so, and leaving asks first. */
  dirty?: boolean
  /** The bottom bar: 'auto' (default), 'always' or 'never'. */
  stickyActions?: StickyActions
}

/**
 * The content and the side column: side by side from 75em, the side under the content below — and
 * always under it in the phone layout, whatever the viewport (P4.8: a phone frame inside a wide
 * window drew both columns in 390px).
 */
function Columns({
  side,
  phone,
  children,
}: {
  side?: ReactNode
  phone: boolean
  children: ReactNode
}) {
  if (side === undefined) return <div className="flex min-w-0 flex-col gap-4">{children}</div>
  return (
    <div className={cn('grid grid-cols-1 gap-6', !phone && 'lg:grid-cols-[minmax(0,1fr)_300px]')}>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
      <aside className="flex min-w-0 flex-col gap-4">{side}</aside>
    </div>
  )
}

function frameClasses(phone: boolean, className?: string) {
  return cn(
    'mx-auto box-border flex w-full max-w-content flex-col',
    phone ? 'gap-4 p-4' : 'gap-6 p-6',
    className,
  )
}

function Header({
  frame,
  phone,
  actions,
}: {
  frame: PageFrame
  phone: boolean
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={frame.title}
        {...(frame.back === undefined ? {} : { back: frame.back })}
        {...(frame.status === undefined ? {} : { status: frame.status })}
        {...(frame.subtitle === undefined ? {} : { subtitle: frame.subtitle })}
        {...(actions === undefined ? {} : { actions })}
      />
      {frame.keyFigures !== undefined && frame.keyFigures.length > 0 && (
        <KeyFigures items={frame.keyFigures} layout={phone ? 'phone' : 'desktop'} />
      )}
    </div>
  )
}

/** The back button that asks first while there are unsaved changes, and the guard's dialog. */
function useGuardedBack(back: PageBack | undefined, dirty: boolean) {
  const guard = useUnsavedChangesGuard(dirty)
  const guarded: PageBack | undefined =
    back === undefined
      ? undefined
      : {
          ...back,
          onClick: (event: MouseEvent<HTMLAnchorElement>) => {
            back.onClick?.(event)
            const link = event.currentTarget
            if (event.defaultPrevented || link.dataset.leaving === 'true' || !dirty) return
            // Ask first; on "Leave", follow the same link again (through the application's
            // router), marked so this handler lets it through.
            event.preventDefault()
            guard.confirmLeave(() => {
              link.dataset.leaving = 'true'
              link.click()
              delete link.dataset.leaving
            })
          },
        }
  return { back: guarded, dialog: guard.dialog }
}

/** The fields that can take the focus when a record enters edit mode. */
const FIELD =
  'input:not([type=hidden]):not([disabled]):not([readonly]), textarea:not([disabled]), [role=combobox]:not([aria-disabled=true])'

/** One record: its header, key figures and sections, read or edited as a whole. */
export function DetailPage(props: DetailPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const editing = props.mode === 'edit'
  const { back, dialog } = useGuardedBack(props.back, editing && props.dirty === true)
  const body = useRef<HTMLDivElement>(null)

  // Entering edit mode moves the focus to the first field, where the user goes on.
  useEffect(() => {
    if (!editing) return
    body.current?.querySelector<HTMLElement>(FIELD)?.focus()
  }, [editing])

  return (
    <div
      data-slot="detail-page"
      data-mode={editing ? 'edit' : 'view'}
      className={frameClasses(phone, props.className)}
    >
      <Header
        frame={{ ...props, ...(back === undefined ? {} : { back }) }}
        phone={phone}
        {...(editing || props.actions === undefined ? {} : { actions: props.actions })}
      />
      {props.sectionBar === true && props.sections.length > 1 && (
        <SectionBar
          sections={props.sections.map((section) => ({ id: section.id, label: section.label }))}
          className={phone ? '-mx-4 px-4' : '-mx-6 px-6'}
        />
      )}
      <Columns side={props.side} phone={phone}>
        <div ref={body} className="flex min-w-0 flex-col gap-4">
          {props.sections.map((section) => {
            const editable = section.editable ?? section.edit !== undefined
            return (
              // The section bar scrolls here and moves the focus here (tabIndex -1).
              <div
                key={section.id}
                id={section.id}
                tabIndex={-1}
                className={cn('outline-none', SECTION_SCROLL_MARGIN)}
              >
                <SectionCard
                  title={section.label}
                  headingLevel={2}
                  {...(section.description === undefined
                    ? {}
                    : { description: section.description })}
                  {...(section.actions === undefined || editing
                    ? {}
                    : { actions: section.actions })}
                  {...(section.flush === true ? { flush: true } : {})}
                >
                  {editing && editable ? section.edit : section.content}
                </SectionCard>
              </div>
            )
          })}
        </div>
        {editing && props.editActions !== undefined && (
          <FormBottomBar actions={props.editActions} dirty={props.dirty === true} />
        )}
      </Columns>
      {dialog}
    </div>
  )
}

/**
 * One new record to create on a full page (more than about ten fields or attachments, AGENTS.md
 * D14): back, title, the form with its actions at the top and the bottom bar, and the
 * unsaved-changes guard. An existing record is edited on its DetailPage (`mode` 'edit').
 */
export function RecordFormPage(props: RecordFormPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const { back, dialog } = useGuardedBack(props.back, props.dirty === true)

  return (
    <div data-slot="record-form-page" className={frameClasses(phone, props.className)}>
      <Header frame={{ ...props, ...(back === undefined ? {} : { back }) }} phone={phone} />
      <Columns side={props.side} phone={phone}>
        <FormActions
          actions={props.actions}
          {...(props.dirty === undefined ? {} : { dirty: props.dirty })}
          {...(props.stickyActions === undefined ? {} : { stickyActions: props.stickyActions })}
        >
          {props.children}
        </FormActions>
      </Columns>
      {dialog}
    </div>
  )
}

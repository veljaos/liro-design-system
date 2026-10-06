import type { MouseEvent, ReactNode } from 'react'
import { SectionCard } from '../components/cards'
import { FormActions, useUnsavedChangesGuard } from '../components/form-layout'
import type { StickyActions } from '../components/form-logic'
import { KeyFigures, type KeyFigure } from '../components/key-figures'
import { SECTION_SCROLL_MARGIN, SectionBar } from '../components/section-bar'
import { usePhone } from '../components/use-phone'
import { cn } from '../primitives/cn'
import { PageHeader, type PageBack } from './page-header'

/*
 * DetailPage and RecordFormPage (BUILD-PLAN P4.4; the owner's values, docs/decisions.md "Detail
 * and record form pages").
 * - The header: the back button, the title (h1, visible: it names the record), the status, a
 *   subtitle line, the actions at the end; then the key figures (KeyFigures), 16px under it.
 * - DetailPage: the sections as SectionCards (the system's record group, as the forms' FormSection),
 *   16px apart; an optional SectionBar, sticky under the shell, for long pages.
 * - The side column (FactBox-like panels, from the application): 300px from lg (75em), the old form
 *   value, 24px (lg) from the content, for both templates; below 75em it stands under the content,
 *   never hidden.
 * - RecordFormPage: the actions at the top and the bottom bar only while the top ones are out of
 *   view (FormActions), the unsaved-changes guard: while `dirty`, the back button and closing the
 *   page ask first.
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
  /** Actions at the end of the section's header. */
  actions?: ReactNode
  /** No padding around the content (a table). */
  flush?: boolean
  content: ReactNode
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
  /** The side column: panels from the application. */
  side?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

export interface DetailPageProps extends PageFrame {
  /** The page's actions at the end of the header, the main one last. */
  actions?: ReactNode
  sections: readonly DetailSection[]
  /** The sticky section bar, for long pages. Default false. */
  sectionBar?: boolean
}

export interface RecordFormPageProps extends PageFrame {
  /** The form's actions (an ActionGroup), at the top and in the bottom bar. */
  actions: ReactNode
  /** The form: FormSections or FormTabs. */
  children: ReactNode
  /** Unsaved changes: the bottom bar says so, and leaving asks first. */
  dirty?: boolean
  /** The bottom bar: 'auto' (default), 'always' or 'never'. */
  stickyActions?: StickyActions
}

/** The content and the side column: side by side from 75em, the side under the content below. */
function Columns({ side, children }: { side?: ReactNode; children: ReactNode }) {
  if (side === undefined) return <div className="flex min-w-0 flex-col gap-4">{children}</div>
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
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

/** One record to read: its header, key figures, sections and side panels. */
export function DetailPage(props: DetailPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  return (
    <div data-slot="detail-page" className={frameClasses(phone, props.className)}>
      <Header frame={props} phone={phone} actions={props.actions} />
      {props.sectionBar === true && props.sections.length > 1 && (
        <SectionBar
          sections={props.sections.map((section) => ({ id: section.id, label: section.label }))}
          className={phone ? '-mx-4 px-4' : '-mx-6 px-6'}
        />
      )}
      <Columns side={props.side}>
        {props.sections.map((section) => (
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
              {...(section.description === undefined ? {} : { description: section.description })}
              {...(section.actions === undefined ? {} : { actions: section.actions })}
              {...(section.flush === true ? { flush: true } : {})}
            >
              {section.content}
            </SectionCard>
          </div>
        ))}
      </Columns>
    </div>
  )
}

/**
 * One record to create or edit on a full page (more than about ten fields, tabs or attachments,
 * AGENTS.md D14): back, title, the form with its actions at the top and the bottom bar, and the
 * unsaved-changes guard.
 */
export function RecordFormPage(props: RecordFormPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const guard = useUnsavedChangesGuard(props.dirty === true)

  const back: PageBack | undefined =
    props.back === undefined
      ? undefined
      : {
          ...props.back,
          onClick: (event: MouseEvent<HTMLAnchorElement>) => {
            props.back?.onClick?.(event)
            const link = event.currentTarget
            if (event.defaultPrevented || link.dataset.leaving === 'true' || props.dirty !== true) {
              return
            }
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

  return (
    <div data-slot="record-form-page" className={frameClasses(phone, props.className)}>
      <Header frame={{ ...props, ...(back === undefined ? {} : { back }) }} phone={phone} />
      <Columns side={props.side}>
        <FormActions
          actions={props.actions}
          {...(props.dirty === undefined ? {} : { dirty: props.dirty })}
          {...(props.stickyActions === undefined ? {} : { stickyActions: props.stickyActions })}
        >
          {props.children}
        </FormActions>
      </Columns>
      {guard.dialog}
    </div>
  )
}

import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../primitives/collapsible'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs'
import { useLiro } from '../provider/liro-provider'
import { ActionButton } from './actions'
import { SectionCard } from './cards'
import { ConfirmDialog } from './confirm-dialog'
import {
  bottomBarShown,
  focusFirstInvalid,
  scrollContainerOf,
  wizardStepTarget,
  type StickyActions,
} from './form-logic'
import { Stepper } from './progress'

/*
 * Form layout (BUILD-PLAN P3.5; owner's decisions, 2026-10-01, docs/decisions.md "Form layout"):
 * - FormSection: the SectionCard card (title and description at the start, actions at the end, no
 *   icon, no line) with its fields in a grid, `columns` 1–3 (default 2), 16px apart, one column on
 *   phones; FormFullWidth spans the row. `collapsible` (old behaviour, for rarely used fields):
 *   closed unless `defaultOpen`; the header is a button with a 14px chevron (pointing to the end
 *   when closed, mirrored in right-to-left; down when open) and the title in 13px, semibold,
 *   text.secondary.
 * - FormTabs: a tab with errors shows a 13px TriangleAlert in the danger colour 6px after its label,
 *   never wrapping, and is named "<label> — has errors"; `focusFirstInvalid` selects the first
 *   such tab and focuses the first invalid field. Since P3.6 (owner) FormTabs is the form's card:
 *   the tab list is its first row, start-aligned, its line across the card's width, and the
 *   FormSections in a panel are drawn flat inside it (no card of their own). Page-level Tabs keep
 *   their own rule (centred).
 * - FormActions (the old RecordFormTemplate): the actions at the top and a bar at the bottom,
 *   sticky, shown only while the top actions are out of view ('auto', P3.6: an
 *   IntersectionObserver, so both sets are never visible at once), or 'always' / 'never'; the bar
 *   on surface.page
 *   with a 1px border.default line on top, no shadow, 12px padding, "Unsaved changes" (12px,
 *   text.tertiary) at the start when `dirty`, the actions at the end.
 */

export interface FormSectionProps {
  /** The section's heading, from the application. */
  title: ReactNode
  /** A line under the title. Not shown in a collapsible section's header. */
  description?: ReactNode
  /** Actions at the end of the header. Not in a collapsible section. */
  actions?: ReactNode
  /** The heading level of the title. Default: 4. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /**
   * Columns of fields by the section's own width (container queries, P4.9): two from 36rem,
   * three from 54rem, one below — so a phone-width pane gets one column whatever the viewport.
   * Default: 2.
   */
  columns?: 1 | 2 | 3
  /** Folded away until opened: for fields that are rarely used. */
  collapsible?: boolean
  /** A collapsible section starts open. Default: false. */
  defaultOpen?: boolean
  /** The fields. */
  children: ReactNode
  className?: string
}

/** Literal classes, so Tailwind finds them: columns by the grid's own width, as KeyValueList. */
const OWN_COLUMNS: Record<1 | 2 | 3, string> = {
  1: '',
  2: '@min-[36rem]:grid-cols-2',
  3: '@min-[54rem]:grid-cols-3',
}

export interface FormGridProps {
  /** Columns by the grid's own width: two from 36rem, three from 54rem, one below. Default 2. */
  columns?: 1 | 2 | 3
  /** The fields. */
  children: ReactNode
  className?: string
}

/**
 * Fields in a grid without a card of its own, 16px apart: a DetailPage section in edit mode,
 * where the section is already the card (P4.9). Its columns follow its own width, as the
 * KeyValueList it replaces, so read and edit mode line up.
 */
export function FormGrid({ columns = 2, children, className }: FormGridProps) {
  return (
    <div className={cn('@container min-w-0', className)}>
      <div className={cn('grid grid-cols-1 gap-4', OWN_COLUMNS[columns])}>{children}</div>
    </div>
  )
}

/** A field that spans every column of its FormSection or FormGrid (an address, a note). */
export function FormFullWidth({ children }: { children: ReactNode }) {
  return <div className="col-span-full min-w-0">{children}</div>
}

function FieldGrid({ columns, children }: { columns: 1 | 2 | 3; children: ReactNode }) {
  return <FormGrid columns={columns}>{children}</FormGrid>
}

/** True inside a FormTabs panel: its sections are drawn flat in the tabs' card. */
const InTabsCard = createContext(false)

/** Takes a section's card frame off when it stands inside the FormTabs card. */
const FLAT = 'rounded-none border-0 bg-transparent'

/** A titled group of fields in a form. */
export function FormSection(props: FormSectionProps) {
  const flat = useContext(InTabsCard)
  const columns = props.columns ?? 2
  const [open, setOpen] = useState(props.defaultOpen ?? false)
  if (props.collapsible !== true) {
    return (
      <SectionCard
        title={props.title}
        {...(props.description === undefined ? {} : { description: props.description })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
        {...(props.headingLevel === undefined ? {} : { headingLevel: props.headingLevel })}
        className={cn(flat && FLAT, props.className)}
      >
        <FieldGrid columns={columns}>{props.children}</FieldGrid>
      </SectionCard>
    )
  }
  const Heading = `h${String(props.headingLevel ?? 4)}` as 'h4'
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section
        data-slot="form-section"
        className={cn(
          'overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary',
          flat && FLAT,
          props.className,
        )}
      >
        <Heading className="m-0">
          <CollapsibleTrigger
            className={cn(
              BUTTON_RESET,
              FOCUS_RING,
              'group flex w-full cursor-pointer items-center gap-2 p-4 text-start text-sm font-semibold text-secondary',
            )}
          >
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 group-data-[state=open]:hidden rtl:-scale-x-100"
            />
            <ChevronDown
              aria-hidden="true"
              className="hidden size-3.5 shrink-0 group-data-[state=open]:block"
            />
            <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>{props.title}</span>
          </CollapsibleTrigger>
        </Heading>
        {/* Mounted while closed (hidden), so a field with an error can be found and revealed. */}
        <CollapsibleContent forceMount hidden={!open}>
          <div className="px-4 pb-4">
            <FieldGrid columns={columns}>{props.children}</FieldGrid>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

/** One tab of FormTabs. */
export interface FormTab {
  value: string
  /** The tab's name, from the application. */
  label: string
  /** The panel, mounted only while its tab is active (AGENTS.md D16). */
  content: ReactNode
  /** A field in this tab has an error: the tab shows the warning icon and says so. */
  hasErrors?: boolean
  disabled?: boolean
}

export interface FormTabsProps {
  items: readonly FormTab[]
  /** Controlled active tab. */
  value?: string
  /** Uncontrolled initial tab; default: the first. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Names the list of tabs for assistive technology. From the application. */
  label?: string
  className?: string
}

/**
 * The tabs of a long form. A tab with errors says so; `focusFirstInvalid(form)` after a failed
 * save selects the first such tab and focuses its first invalid field.
 */
export function FormTabs(props: FormTabsProps) {
  const { messages } = useLiro()
  const [inner, setInner] = useState(props.defaultValue ?? props.items[0]?.value ?? '')
  const value = props.value ?? inner
  const select = (next: string) => {
    setInner(next)
    props.onValueChange?.(next)
  }

  return (
    <TabsRoot
      value={value}
      onValueChange={select}
      data-slot="form-tabs"
      className={cn(
        'overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary',
        props.className,
      )}
    >
      <TabsList
        className="justify-start px-4"
        {...(props.label === undefined ? {} : { 'aria-label': props.label })}
      >
        {props.items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled === true}
            className="whitespace-nowrap"
            {...(item.hasErrors === true
              ? { 'aria-label': messages['form.hasErrors'](item.label), 'data-has-errors': '' }
              : {})}
          >
            <span className={TEXT_DIRECTION}>{item.label}</span>
            {item.hasErrors === true && (
              <TriangleAlert
                aria-hidden="true"
                className="ms-1.5 size-3.25 shrink-0 text-status-danger-fg"
              />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {props.items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="flex flex-col">
          <InTabsCard.Provider value={true}>{item.content}</InTabsCard.Provider>
        </TabsContent>
      ))}
    </TabsRoot>
  )
}

export interface FormActionsProps {
  /**
   * The form's actions as an ActionGroup (it aligns itself to the end), the main one last. Shown
   * at the top and in the bottom bar.
   */
  actions: ReactNode
  /** The form's sections. */
  children: ReactNode
  /**
   * The bottom bar: 'auto' (default) only while the top actions are out of view, 'always' or
   * 'never'.
   */
  stickyActions?: StickyActions
  /** The form has unsaved changes: the bottom bar says so. */
  dirty?: boolean
  className?: string
}

/**
 * Whether `element` (the top actions) is out of view in its scroll container or the page, kept up
 * to date by an IntersectionObserver (P3.6, owner: the top and the bottom actions are never
 * visible at the same time).
 */
function useOutOfView(element: HTMLElement | null, active: boolean): boolean {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (element === null || !active) return
    const container = scrollContainerOf(element)
    const page = container === document.scrollingElement || container === document.documentElement
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (entry !== undefined) setHidden(!entry.isIntersecting)
      },
      { root: page ? null : container },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [element, active])
  return hidden
}

/**
 * A record's form with its actions at the top and, once they are scrolled out of view, again in a
 * bar sticky at the bottom (Appendix B.8), where the user is when they finish.
 */
export function FormActions(props: FormActionsProps) {
  const mode = props.stickyActions ?? 'auto'
  const [top, setTop] = useState<HTMLDivElement | null>(null)
  const topHidden = useOutOfView(top, mode === 'auto')
  const shown = bottomBarShown(mode, topHidden)
  return (
    <div
      data-slot="form-actions"
      className={cn('flex min-w-0 flex-col gap-4 font-sans text-primary', props.className)}
    >
      {/* The full row: an ActionGroup aligns itself to the end and measures what fits. */}
      <div ref={setTop} className="min-w-0">
        {props.actions}
      </div>
      {props.children}
      {shown && <FormBottomBar actions={props.actions} dirty={props.dirty === true} />}
    </div>
  )
}

/**
 * The bar at the bottom of a form or of a record in edit mode (not exported from the package):
 * sticky, surface.page with a 1px border.default line on top, 12px padding, "Unsaved changes"
 * (12px, text.tertiary) at the start when `dirty`, the actions at the end.
 */
export function FormBottomBar({ actions, dirty }: { actions: ReactNode; dirty: boolean }) {
  const { messages } = useLiro()
  return (
    <div
      data-slot="form-bottom-bar"
      className="sticky bottom-0 z-(--liro-layer-sticky) flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-default bg-surface-page p-3"
    >
      <span className={cn('shrink-0 text-xs text-tertiary', TEXT_DIRECTION)}>
        {dirty ? messages['form.unsaved'] : null}
      </span>
      <div className="min-w-0 flex-1">{actions}</div>
    </div>
  )
}

export interface UnsavedChangesGuard {
  /**
   * Call before leaving inside the application (a link, a back button): it leaves at once when
   * nothing is unsaved, and otherwise asks first and leaves only when the user agrees.
   */
  confirmLeave: (leave: () => void) => void
  /** The confirmation; render it once, anywhere in the form. */
  dialog: ReactNode
}

/**
 * Guards unsaved changes: while `dirty`, closing or reloading the page asks the browser's own
 * question, and `confirmLeave` asks before the application navigates away.
 */
export function useUnsavedChangesGuard(dirty: boolean): UnsavedChangesGuard {
  const { messages } = useLiro()
  const [pending, setPending] = useState<(() => void) | null>(null)
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
    }
  }, [dirty])
  return {
    confirmLeave: (leave) => {
      if (dirty) {
        setPending(() => leave)
      } else {
        leave()
      }
    },
    dialog: (
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={messages['form.leaveTitle']}
        message={messages['form.leaveMessage']}
        confirmLabel={messages['form.leave']}
        cancelLabel={messages['form.stay']}
        onConfirm={() => {
          const leave = pending
          setPending(null)
          leave?.()
        }}
      />
    ),
  }
}

/** One step of a FormWizard. */
export interface WizardStep {
  /** From the application. */
  label: string
  description?: string
  /** The step's fields; only the active step is mounted, the application keeps the values. */
  content: ReactNode
  /**
   * Checks the step before going on: return (or resolve) false to stay; the focus then moves to
   * the first invalid field. The application's own checks; no validation library.
   */
  validate?: () => boolean | Promise<boolean>
}

export interface FormWizardProps {
  steps: readonly WizardStep[]
  /** Controlled step, from 0. */
  active?: number
  onActiveChange?: (active: number) => void
  /** Runs after the last step's check passes. */
  onFinish: () => void | Promise<void>
  /** The last button's text. Default: `messages['wizard.finish']`. */
  finishLabel?: string
  className?: string
}

/**
 * A form in steps: the Stepper on top, one step at a time, Back and Next (Finish on the last).
 * Each step is checked before the next; going back keeps what was entered.
 */
export function FormWizard(props: FormWizardProps) {
  const { messages } = useLiro()
  const [inner, setInner] = useState(0)
  const active = props.active ?? inner
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const go = (next: number) => {
    setInner(next)
    props.onActiveChange?.(next)
  }
  const last = active === props.steps.length - 1
  const step = props.steps[active]

  const forward = async () => {
    if (busy || step === undefined) return
    setBusy(true)
    try {
      const ok = step.validate === undefined ? true : await step.validate()
      if (!ok) {
        requestAnimationFrame(() => {
          if (bodyRef.current !== null) focusFirstInvalid(bodyRef.current)
        })
        return
      }
      if (last) {
        await props.onFinish()
      } else {
        go(active + 1)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      data-slot="form-wizard"
      className={cn('flex min-w-0 flex-col gap-6 font-sans', props.className)}
    >
      <Stepper
        steps={props.steps.map((one) => ({
          label: one.label,
          ...(one.description === undefined ? {} : { description: one.description }),
        }))}
        active={active}
        onStepClick={(index) => {
          const target = wizardStepTarget(index, active)
          if (target === 'back') go(index)
          else if (target === 'next') void forward()
        }}
      />
      <div ref={bodyRef} key={active}>
        {step?.content}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {active > 0 && (
          <ActionButton
            action={{ intent: 'back', label: messages['wizard.back'] }}
            disabled={busy}
            onClick={() => {
              go(active - 1)
            }}
          />
        )}
        <ActionButton
          action={
            last
              ? { intent: 'confirm', label: props.finishLabel ?? messages['wizard.finish'] }
              : { intent: 'next', label: messages['wizard.next'] }
          }
          aria-busy={busy || undefined}
          onClick={() => {
            void forward()
          }}
        />
      </div>
    </div>
  )
}

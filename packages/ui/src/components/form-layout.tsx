import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../primitives/collapsible'
import { BUTTON_RESET, FOCUS_RING } from '../primitives/classes'
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
 *   such tab and focuses the first invalid field.
 * - FormActions (the old RecordFormTemplate): the actions at the top and a bar at the bottom,
 *   sticky, while the content scrolls ('auto'), or 'always' / 'never'; the bar on surface.page
 *   with a 1px border.default line on top, no shadow, 12px padding, "Unsaved changes" (12px,
 *   text.tertiary) at the start when `dirty`, the actions at the end.
 */

/** Literal classes, so Tailwind finds them. */
const COLUMNS: Record<1 | 2 | 3, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

export interface FormSectionProps {
  /** The section's heading, from the application. */
  title: ReactNode
  /** A line under the title. Not shown in a collapsible section's header. */
  description?: ReactNode
  /** Actions at the end of the header. Not in a collapsible section. */
  actions?: ReactNode
  /** The heading level of the title. Default: 4. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Columns of fields from the sm breakpoint (48em) on; one on phones. Default: 2. */
  columns?: 1 | 2 | 3
  /** Folded away until opened: for fields that are rarely used. */
  collapsible?: boolean
  /** A collapsible section starts open. Default: false. */
  defaultOpen?: boolean
  /** The fields. */
  children: ReactNode
  className?: string
}

/** A field that spans every column of its FormSection (an address, a note). */
export function FormFullWidth({ children }: { children: ReactNode }) {
  return <div className="col-span-full min-w-0">{children}</div>
}

function FieldGrid({ columns, children }: { columns: 1 | 2 | 3; children: ReactNode }) {
  return <div className={cn('grid grid-cols-1 gap-4', COLUMNS[columns])}>{children}</div>
}

/** A titled group of fields in a form. */
export function FormSection(props: FormSectionProps) {
  const columns = props.columns ?? 2
  const [open, setOpen] = useState(props.defaultOpen ?? false)
  if (props.collapsible !== true) {
    return (
      <SectionCard
        title={props.title}
        {...(props.description === undefined ? {} : { description: props.description })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
        {...(props.headingLevel === undefined ? {} : { headingLevel: props.headingLevel })}
        {...(props.className === undefined ? {} : { className: props.className })}
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
            <span className="min-w-0 break-words">{props.title}</span>
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
    <TabsRoot value={value} onValueChange={select} className={props.className}>
      <TabsList
        className="justify-center"
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
            {item.label}
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
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  )
}

export interface FormActionsProps {
  /** The form's actions (an ActionGroup or buttons), the main one last. Shown at the top and in the bottom bar. */
  actions: ReactNode
  /** The form's sections. */
  children: ReactNode
  /** The bottom bar: 'auto' (default) while the content scrolls, 'always' or 'never'. */
  stickyActions?: StickyActions
  /** The form has unsaved changes: the bottom bar says so. */
  dirty?: boolean
  className?: string
}

/** Whether the content around `element` scrolls, kept up to date as sizes change. */
function useScrolls(element: HTMLElement | null, active: boolean): boolean {
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    if (element === null || !active) return
    const container = scrollContainerOf(element)
    const measure = () => {
      setScrolls(container.scrollHeight > container.clientHeight + 1)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(container)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [element, active])
  return scrolls
}

/**
 * A record's form with its actions at the top and, while the content scrolls, again in a bar
 * sticky at the bottom (Appendix B.8), where the user is when they finish.
 */
export function FormActions(props: FormActionsProps) {
  const { messages } = useLiro()
  const mode = props.stickyActions ?? 'auto'
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const scrolls = useScrolls(root, mode === 'auto')
  const shown = bottomBarShown(mode, scrolls)
  return (
    <div
      ref={setRoot}
      data-slot="form-actions"
      className={cn('flex min-w-0 flex-col gap-4 font-sans text-primary', props.className)}
    >
      <div className="flex justify-end">{props.actions}</div>
      {props.children}
      {shown && (
        <div
          data-slot="form-bottom-bar"
          className="sticky bottom-0 z-(--liro-layer-sticky) flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-default bg-surface-page p-3"
        >
          <span className="text-xs text-tertiary">
            {props.dirty === true ? messages['form.unsaved'] : null}
          </span>
          <div className="ms-auto">{props.actions}</div>
        </div>
      )}
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
      <div className="flex flex-wrap items-center justify-end gap-3">
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

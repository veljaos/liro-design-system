import { Check, X } from 'lucide-react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Tooltip } from './popover'
import { usePhone } from './use-phone'

/*
 * LifecycleBar (P4.5, the owner's decision, docs/decisions.md "Document page"): where a document
 * stands in its life — Draft → Issued → Sent to SEF → Paid — compact, above the document's
 * header; not a big stepper.
 * - Dots and lines: each step a 16px dot and its name (13px), 1px border.default lines (24px)
 *   between them, one 32px row.
 * - Completed: a neutral dot (surface.sunken, border.strong ring) with a 10px check in
 *   text.secondary, the name text.secondary. Current: a brand.solid dot, the name semibold in
 *   text.brand (`aria-current="step"`). Future: an empty dot (border.strong ring), the name
 *   text.tertiary. Error (a step with `error`, e.g. "Rejected by SEF"): the dot status.danger.solid
 *   with a white X, the name in status.danger.fg; its short reason in a tooltip on hover and focus
 *   and in its accessible name.
 * - Neutral except the current step and errors. Steps come from the application.
 * - Phones (below 48em, or `layout`): one line, "Step 3 of 4: Sent to SEF"
 *   (`messages['lifecycle.step']`), with the current step's dot.
 */

/** One step of a document's life. */
export interface LifecycleStep {
  key: string
  /** From the application ("Sent to SEF", "Rejected by SEF"). */
  label: string
  /** The step failed: the reason, shown on hover and focus and read with the step's name. */
  error?: string
}

export interface LifecycleBarProps {
  steps: readonly LifecycleStep[]
  /** The index of the current step; earlier steps are completed. */
  current: number
  /** Names the bar for assistive technology ("Invoice status"), from the application. */
  label: string
  /** 'phone' forces the one-line form; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

export type StepState = 'completed' | 'current' | 'future' | 'error'

/** A step's state: an error wins; then before, at or after the current index. */
export function lifecycleState(step: LifecycleStep, index: number, current: number): StepState {
  if (step.error !== undefined) return 'error'
  if (index < current) return 'completed'
  return index === current ? 'current' : 'future'
}

function Dot({ state }: { state: StepState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'box-border flex size-4 shrink-0 items-center justify-center rounded-full border border-solid',
        state === 'completed' && 'border-strong bg-surface-sunken text-secondary',
        state === 'current' && 'border-transparent bg-brand-solid',
        state === 'future' && 'border-strong bg-transparent',
        state === 'error' && 'border-transparent bg-status-danger-solid text-on-accent',
      )}
    >
      {state === 'completed' && <Check className="size-2.5" strokeWidth={3} />}
      {state === 'error' && <X className="size-2.5" strokeWidth={3} />}
    </span>
  )
}

const NAME: Record<StepState, string> = {
  completed: 'text-secondary',
  current: 'font-semibold text-brand',
  future: 'text-tertiary',
  error: 'font-semibold text-status-danger-fg',
}

/** Where a document stands in its life. */
export function LifecycleBar({ steps, current, label, layout, className }: LifecycleBarProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = layout === undefined ? viewportPhone : layout === 'phone'

  if (phone) {
    const index = Math.min(Math.max(current, 0), steps.length - 1)
    const step = steps[index]
    if (step === undefined) return null
    const state = lifecycleState(step, index, current)
    return (
      <p
        data-slot="lifecycle-bar"
        className={cn('m-0 flex min-h-8 items-center gap-2 font-sans text-sm', className)}
      >
        <Dot state={state} />
        <span className={cn(NAME[state], TEXT_DIRECTION)}>
          {messages['lifecycle.step'](
            index + 1,
            format.number(String(index + 1)),
            steps.length,
            format.number(String(steps.length)),
            step.label,
          )}
          {step.error !== undefined && `: ${step.error}`}
        </span>
      </p>
    )
  }

  return (
    <ol
      data-slot="lifecycle-bar"
      aria-label={label}
      className={cn('m-0 flex min-h-8 list-none flex-wrap items-center p-0 font-sans', className)}
    >
      {steps.map((step, index) => {
        const state = lifecycleState(step, index, current)
        const name = (
          <span className={cn('text-sm whitespace-nowrap', NAME[state], TEXT_DIRECTION)}>
            {step.label}
            {state === 'completed' && (
              <span className="sr-only">, {messages['stepper.completed']}</span>
            )}
            {step.error !== undefined && <span className="sr-only">: {step.error}</span>}
          </span>
        )
        return (
          <li
            key={step.key}
            className="flex items-center gap-2"
            {...(state === 'current' || (state === 'error' && index === current)
              ? { 'aria-current': 'step' as const }
              : {})}
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="ms-2 h-0 w-6 shrink-0 border-0 border-t border-solid border-default"
              />
            )}
            <Dot state={state} />
            {step.error === undefined ? (
              name
            ) : (
              // Focusable, so the reason's tooltip opens from the keyboard too.
              <Tooltip label={step.error}>
                <button
                  type="button"
                  className={cn(BUTTON_RESET, 'cursor-default rounded-sm', FOCUS_RING)}
                >
                  {name}
                </button>
              </Tooltip>
            )}
          </li>
        )
      })}
    </ol>
  )
}

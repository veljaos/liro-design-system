import { Check } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Progress } from '../primitives/progress'
import { Skeleton as SkeletonPrimitive } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'

/*
 * ProgressBar, Skeleton and Stepper (BUILD-PLAN P2.5), the previous Design System's (owner's
 * decision, 2026-09-28, docs/decisions.md "Feedback"): ProgressBar Mantine size 'sm' with fully
 * rounded ends, filling from the start side (it flips in right-to-left); Skeleton radius md;
 * Stepper size 'sm' with 32px step icons in the primary colour.
 */

export interface ProgressBarProps {
  /** What is progressing, for assistive technology. From the application. */
  label: string
  /** Done so far, 0 … max. Omit while the amount is not known. */
  value?: number
  /** Default: 100. */
  max?: number
  /** Layout classes (width, margins). */
  className?: string
}

/**
 * How far a task has come: an import, an upload, a job. Mantine Progress 'sm': 5px high, fully
 * rounded (owner), the track surface.sunken (Mantine gray-2), the filled part brand.solid, filling
 * from the leading edge.
 */
export function ProgressBar({ label, value, max = 100, className }: ProgressBarProps) {
  return (
    <Progress
      aria-label={label}
      value={value ?? null}
      max={max}
      className={cn('h-[5px] rounded-full', className)}
    />
  )
}

export interface SkeletonProps {
  /** Size and layout classes, e.g. "h-4 w-40". */
  className?: string
}

/**
 * A placeholder shape while content loads: radius md, pulsing. Hidden from assistive technology;
 * mark the loading region `aria-busy`.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <SkeletonPrimitive {...(className === undefined ? {} : { className })} />
}

/** One step of a Stepper. */
export interface StepperStep {
  /** The step's name, from the application. */
  label: ReactNode
  /** A line under the name, from the application. */
  description?: ReactNode
}

export interface StepperProps {
  steps: readonly StepperStep[]
  /**
   * The current step, from 0. Steps before it are completed; `steps.length` means all are
   * completed.
   */
  active: number
  /** Makes each step a button that calls this with its index (going back, or on). */
  onStepClick?: (index: number) => void
  /** Layout classes. */
  className?: string
}

/** The state of step `index` when `active` is current. */
export function stepState(index: number, active: number): 'completed' | 'current' | 'upcoming' {
  if (index < active) return 'completed'
  return index === active ? 'current' : 'upcoming'
}

/**
 * The steps of a process and where the user is (a wizard, an onboarding). Mantine Stepper size
 * 'sm', horizontal, icons at the start with labels beside them, wrapping on narrow screens:
 * 32px round step icons (owner) with the step's number in bold 13px; completed steps filled with
 * brand.solid and a check (60%), the current one outlined in border.brand, upcoming ones on
 * surface.disabled with a border.subtle ring (Mantine gray-2 for both) and the number in
 * text.secondary; 2px lines between steps in border.subtle, border.brand up to the current step; labels 13px weight 600 and descriptions 12px (Mantine 11px)
 * in text.secondary, 12px after the icon.
 */
export function Stepper({ steps, active, onStepClick, className }: StepperProps) {
  const { messages } = useLiro()
  return (
    <ol
      className={cn('m-0 flex list-none flex-wrap items-center gap-y-4 p-0 font-sans', className)}
    >
      {steps.map((step, index) => {
        const state = stepState(index, active)
        const icon = (
          <span
            aria-hidden="true"
            className={cn(
              'box-border flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-solid text-sm font-bold transition-colors duration-(--liro-duration-base)',
              state === 'completed' && 'border-brand bg-brand-solid text-brand-on-solid',
              state === 'current' && 'border-brand bg-surface-disabled text-secondary',
              state === 'upcoming' && 'border-subtle bg-surface-disabled text-secondary',
            )}
          >
            {state === 'completed' ? <Check className="size-[60%]" /> : index + 1}
          </span>
        )
        const text = (
          <span className="ms-3 flex min-w-0 flex-col text-start">
            <span className="text-sm leading-none font-semibold text-primary">{step.label}</span>
            {step.description !== undefined && (
              <span className="my-1 text-xs leading-none text-secondary">{step.description}</span>
            )}
            {state === 'completed' && (
              <span className="sr-only">{messages['stepper.completed']}</span>
            )}
          </span>
        )
        return (
          <Fragment key={index}>
            <li
              aria-current={state === 'current' ? 'step' : undefined}
              className="flex min-w-0 items-center"
            >
              {onStepClick === undefined ? (
                <span className="flex items-center">
                  {icon}
                  {text}
                </span>
              ) : (
                <button
                  type="button"
                  className={cn(
                    BUTTON_RESET,
                    'flex cursor-pointer items-center rounded-md',
                    FOCUS_RING,
                  )}
                  onClick={() => {
                    onStepClick(index)
                  }}
                >
                  {icon}
                  {text}
                </button>
              )}
            </li>
            {index < steps.length - 1 && (
              <li
                aria-hidden="true"
                className={cn(
                  'mx-4 h-0 min-w-6 flex-1 border-0 border-t-2 border-solid transition-colors duration-(--liro-duration-base)',
                  index < active ? 'border-brand' : 'border-subtle',
                )}
              />
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}

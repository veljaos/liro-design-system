import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * Spinner (P3.6): shadcn/ui's spinner (a `role="status"` with an accessible label) drawn as the
 * Design System's own loader, Mantine's "oval" (Loader.css): a ring an eighth of its size thick, in
 * border.brand, one quarter open, one turn in 1.2s, linear — the loader already used by the
 * DataTable's refetch (14px), the loading button (20px) and the loading toast (28px), so the sizes
 * are those three. With reduced motion it does not turn (the ring with its gap stays).
 */

/** Literal classes, so Tailwind finds them. */
const SIZES = {
  sm: 'size-3.5 border-[1.75px]',
  md: 'size-5 border-[2.5px]',
  lg: 'size-7 border-[3.5px]',
} as const

export type SpinnerSize = keyof typeof SIZES

export interface SpinnerProps {
  /** 'sm' 14px, 'md' 20px (default), 'lg' 28px. */
  size?: SpinnerSize
  /**
   * What is loading, for assistive technology, when no text is shown beside it. Default:
   * `messages['field.loading']`.
   */
  label?: string
  /**
   * Text shown beside the spinner ("Sending 24 invoices…"), from the application; it is then the
   * status that assistive technology reads, and `label` is not used.
   */
  children?: ReactNode
  className?: string
}

/** Something is in progress and its progress is not known. With a known progress, use ProgressBar. */
export function Spinner({ size = 'md', label, children, className }: SpinnerProps) {
  const { messages } = useLiro()
  const ring = (
    <span
      aria-hidden="true"
      className={cn(
        'box-border inline-block shrink-0 animate-liro-spin rounded-full border-solid border-brand border-s-transparent motion-reduce:animate-none',
        SIZES[size],
      )}
    />
  )
  if (children === undefined) {
    return (
      <span
        role="status"
        aria-label={label ?? messages['field.loading']}
        className={cn('inline-flex', className)}
      >
        {ring}
      </span>
    )
  }
  return (
    <span
      role="status"
      className={cn('inline-flex items-center gap-4 font-sans text-sm text-primary', className)}
    >
      {ring}
      <span className={TEXT_DIRECTION}>{children}</span>
    </span>
  )
}

import { Progress as ProgressPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'

/**
 * A progress bar (shadcn/ui progress, adapted; Mantine Progress.css, size 'md'): 8px high,
 * radius md, the track surface.sunken, the filled part brand.solid, its width changing in 100ms.
 *
 * The bar fills from the leading edge: the filled part is sized with its inline size in a row,
 * so it grows from the left in left-to-right and from the right in right-to-left (Appendix B.7:
 * a bar is a metaphor for reading). shadcn/ui's version moved the fill with translateX, which
 * fills from the left in both directions (P2.1 finding).
 */
export function Progress({
  className,
  value,
  max = 100,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) {
  const share = value === null || value === undefined ? 0 : Math.min(Math.max(value / max, 0), 1)
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn('flex h-2 w-full overflow-hidden rounded-md bg-surface-sunken', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full bg-brand-solid transition-[inline-size] duration-(--liro-duration-fast) ease-standard"
        style={{ inlineSize: `${String(share * 100)}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

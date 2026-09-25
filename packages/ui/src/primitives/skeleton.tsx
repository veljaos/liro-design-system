import type { ComponentProps } from 'react'
import { cn } from './cn'

/**
 * A placeholder shape while content loads (shadcn/ui skeleton, adapted; Mantine Skeleton.css):
 * radius md, pulsing between 40% and full opacity every 1500ms, still with reduced motion. Fill:
 * surface.disabled (Mantine: gray-3 and dark-4; no surface meaning has those values, and
 * "not available yet" is what the skeleton says). Hidden from assistive technology: the region
 * that loads announces itself (aria-busy).
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-liro-skeleton rounded-md bg-surface-disabled motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}

import type { ComponentProps } from 'react'
import { cn } from './cn'

/**
 * A placeholder shape while content loads (shadcn/ui skeleton, adapted; Mantine Skeleton.css):
 * radius md, pulsing between 40% and full opacity every 1500ms, still with reduced motion. Fill:
 * text.primary at 10% over whatever it stands on (P5.93 item 2): on a raised surface it is the
 * grey of surface.disabled, and it stays visible on surface.sunken, a selected row or a dark
 * surface — a skeleton of surface.disabled vanished on the sunken surfaces (the same gray-2), and
 * a loading state looked blank. Hidden from assistive technology: the region that loads
 * announces itself (aria-busy).
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-liro-skeleton rounded-md bg-current/10 text-primary motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}

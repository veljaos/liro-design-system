import type { ComponentProps } from 'react'
import { TEXT_DIRECTION } from './classes'
import { cn } from './cn'

/*
 * Marker (shadcn/ui `marker`, registry style radix-vega, fetched 2026-10-08; adapted as the P2.1
 * primitives). A small line of meta text beside or between messages: a day separator, an
 * author's name with their kind ("Liro agent" with AgentMark), a note such as "Edited".
 *
 * Adapted:
 * - Liro meanings: the text text.secondary at xs (12px; shadcn's sm is 14px, which competes with
 *   the message itself), the separator's lines 1px border.subtle (shadcn: `bg-border`; a
 *   border colour is not a background utility here, so each line is a pseudo-element's top border).
 * - Logical sides: the separator's lines keep 4px from the text with `me-1` / `ms-1` (shadcn:
 *   `mr-1` / `ml-1`); `text-left` → `text-start`; the text takes its direction from its content
 *   (TEXT_DIRECTION, P3.6).
 * - shadcn's `asChild` and its link styles are not kept: a marker is text, links in it are the
 *   application's.
 * - Icons are 14px (the Design System's small icon beside xs text), decorative.
 */

/** default: a line of meta text; separator: centred between two lines; border: a line under it. */
export type MarkerVariant = 'default' | 'separator' | 'border'

const VARIANTS: Record<MarkerVariant, string> = {
  default: '',
  separator:
    "before:me-1 before:h-0 before:min-w-0 before:flex-1 before:border-0 before:border-t before:border-solid before:border-subtle before:content-[''] after:ms-1 after:h-0 after:min-w-0 after:flex-1 after:border-0 after:border-t after:border-solid after:border-subtle after:content-['']",
  border: 'border-0 border-b border-solid border-subtle pb-2',
}

export function Marker({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'div'> & { variant?: MarkerVariant }) {
  return (
    <div
      data-slot="marker"
      data-variant={variant}
      className={cn(
        'group/marker relative flex min-h-4 w-full min-w-0 items-center gap-2 font-sans text-xs text-secondary',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

export function MarkerIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        'flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

export function MarkerContent({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        'min-w-0 break-words group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center',
        TEXT_DIRECTION,
        className,
      )}
      {...props}
    />
  )
}

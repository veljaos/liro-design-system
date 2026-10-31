import type { ComponentProps } from 'react'
import { TEXT_DIRECTION } from './classes'
import { cn } from './cn'

/*
 * Bubble (shadcn/ui `bubble`, registry style radix-vega, adapted to the Liro tokens). A message's
 * box, placed at the start or the end of its row.
 *
 * Adapted:
 * - **No blue bubbles.** shadcn's variants (default = the primary colour, secondary, muted,
 *   tinted, outline, ghost, destructive) are replaced by four neutral surfaces: `raised` (the
 *   raised surface with a border.default line: other people's messages), `sunken`
 *   (surface.sunken: the user's own messages), `note` (surface.sunken with a dashed
 *   border.strong line: an internal note only the team sees) and `ghost` (no box: a message whose
 *   content is a larger part, such as a questionnaire). Own and others' messages differ by their
 *   side and surface, never by colour alone; the author is always named for assistive technology.
 * - Radius lg (12px, shadcn's rounded-xl is 12px too), padding 8px 12px, 13px text (sm), the
 *   text direction from its content (TEXT_DIRECTION); long words break only as a last
 *   resort (`break-words`).
 * - `text-left` → `text-start`. shadcn's `asChild` (a pressable bubble) is not kept: Liro bubbles
 *   are not buttons; actions on a message are buttons of their own.
 * - BubbleReactions is not kept: Liro messages have no reactions.
 */

export function BubbleGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="bubble-group"
      className={cn('flex min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

/** The bubble's surface: the others' raised box, the user's own sunken one, or none. */
export type BubbleSurface = 'raised' | 'sunken' | 'note' | 'ghost'

const SURFACES: Record<BubbleSurface, string> = {
  raised:
    '*:data-[slot=bubble-content]:border-default *:data-[slot=bubble-content]:bg-surface-raised',
  sunken:
    '*:data-[slot=bubble-content]:border-transparent *:data-[slot=bubble-content]:bg-surface-sunken',
  // An internal note: sunken with a dashed border.strong line, distinct from both the
  // others' and the user's own messages by its line and its "Internal" mark, never by colour.
  note: '*:data-[slot=bubble-content]:border-dashed *:data-[slot=bubble-content]:border-strong *:data-[slot=bubble-content]:bg-surface-sunken',
  ghost:
    'max-w-full *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:border-transparent *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0',
}

export function Bubble({
  surface = 'raised',
  align = 'start',
  className,
  ...props
}: ComponentProps<'div'> & { surface?: BubbleSurface; align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="bubble"
      data-surface={surface}
      data-align={align}
      className={cn(
        'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 data-[align=end]:self-end',
        SURFACES[surface],
        className,
      )}
      {...props}
    />
  )
}

export function BubbleContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="bubble-content"
      className={cn(
        'box-border w-fit max-w-full min-w-0 rounded-lg border border-solid px-3 py-2 font-sans text-sm break-words text-primary group-data-[align=end]/bubble:self-end',
        TEXT_DIRECTION,
        className,
      )}
      {...props}
    />
  )
}

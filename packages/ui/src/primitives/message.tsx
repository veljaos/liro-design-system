import type { ComponentProps } from 'react'
import { cn } from './cn'

/*
 * Message (shadcn/ui `message`, registry style radix-vega, fetched 2026-10-08; adapted as the P2.1
 * primitives). The row of one message: the author's avatar at the side, then a column with the
 * header (name, kind, time), the bubble and a footer. The user's own messages stand at the end of
 * the row (`align="end"`, `flex-row-reverse`, which follows the direction: the end is the left in
 * right-to-left).
 *
 * Adapted:
 * - Liro meanings: header and footer xs text.secondary (shadcn: muted-foreground); the avatar slot
 *   is 26px (PersonAvatar 'sm') on surface.sunken.
 * - The avatar stands at the top of the row, beside the header, not at the bubble's bottom
 *   (shadcn moved it up by 32px when a footer was present): the name it belongs to is beside it.
 * - Header and footer have no inline padding of their own (shadcn: 12px), so the name stands at
 *   the bubble's edge and a ghost bubble needs no exception.
 */

export function MessageGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-group"
      className={cn('flex min-w-0 flex-col gap-2', className)}
      {...props}
    />
  )
}

export function Message({
  className,
  align = 'start',
  ...props
}: ComponentProps<'div'> & { align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        'group/message relative flex w-full min-w-0 gap-2 font-sans text-sm data-[align=end]:flex-row-reverse',
        className,
      )}
      {...props}
    />
  )
}

export function MessageAvatar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        'flex size-6.5 shrink-0 items-center justify-center self-start overflow-hidden rounded-xl bg-surface-sunken text-secondary',
        className,
      )}
      {...props}
    />
  )
}

export function MessageContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        'flex w-full min-w-0 flex-col gap-1 group-data-[align=end]/message:items-end',
        className,
      )}
      {...props}
    />
  )
}

export function MessageHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        'flex max-w-full min-w-0 flex-wrap items-baseline gap-x-2 text-xs text-secondary',
        className,
      )}
      {...props}
    />
  )
}

export function MessageFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        'flex max-w-full min-w-0 flex-wrap items-center gap-x-2 text-xs text-secondary group-data-[align=end]/message:justify-end',
        className,
      )}
      {...props}
    />
  )
}

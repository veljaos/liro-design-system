import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
} from '@shadcn/react/message-scroller'
import { ArrowDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { ButtonPrimitive } from './button'
import { FOCUS_RING } from './classes'
import { cn } from './cn'

/*
 * Message Scroller (shadcn/ui `message-scroller`, registry style radix-vega, fetched 2026-10-08;
 * on the unstyled `@shadcn/react/message-scroller` 0.3.1, adapted as the P2.1 primitives). A
 * scrolling list of messages that keeps the latest in view while the reader is at the end
 * (`autoScroll`), opens at the end, keeps the reader's place when older messages are added above,
 * and offers a button back to the end while the reader is away from it.
 *
 * Adapted:
 * - No text of its own: the scrolling region's name (`label`, shadcn: "Messages") and the
 *   button's text (shadcn: "Scroll to end") are required props.
 * - The region is focusable (tabIndex 0, the unstyled part's default) and takes the Liro focus
 *   ring, inset, so the keyboard can scroll it (axe `scrollable-region-focusable`).
 * - shadcn's scrollbar and fade utilities (`scrollbar-thin`, `scroll-fade-b`, `scrollbar-gutter-
 *   stable`) are not Liro utilities and are left out; the browser's scrollbar stays.
 * - The content is a `log` (the unstyled part's default role), so assistive technology hears
 *   new messages politely; the gap between messages is 12px (sm), not shadcn's 32px.
 * - The button is the Liro button (neutral "default" weight, small): it shows text, not only an
 *   arrow, centred at the bottom; it fades and slides as shadcn's, in the base duration, with no
 *   motion when the user reduces motion. Its arrow points down in every direction.
 */

export const MessageScrollerProvider = MessageScrollerPrimitive.Provider

export function MessageScroller({
  className,
  ...props
}: ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn('relative flex size-full min-h-0 flex-col overflow-hidden', className)}
      {...props}
    />
  )
}

export function MessageScrollerViewport({
  className,
  label,
  ...props
}: Omit<ComponentProps<typeof MessageScrollerPrimitive.Viewport>, 'aria-label'> & {
  /** The scrolling region's name ("Comments"). From the application. */
  label: string
}) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      aria-label={label}
      className={cn(
        'box-border size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-md data-pending-scroll:invisible',
        FOCUS_RING,
        'focus-visible:-outline-offset-2',
        className,
      )}
      {...props}
    />
  )
}

export function MessageScrollerContent({
  className,
  ...props
}: ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn('flex h-max min-h-full flex-col gap-3', className)}
      {...props}
    />
  )
}

export function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn('min-w-0 shrink-0', className)}
      {...props}
    />
  )
}

/** The button back to the end of the list, shown while the reader is away from it. */
export function MessageScrollerButton({
  className,
  children,
}: {
  className?: string
  /** Its text ("Jump to latest"). From the component that uses it. */
  children: ReactNode
}) {
  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      direction="end"
      className={cn(
        'absolute start-1/2 bottom-3 h-7.5 min-h-0 -translate-x-1/2 gap-2 px-3.5 text-xs shadow-sm transition-[translate,opacity] duration-(--liro-duration-base) ease-standard rtl:translate-x-1/2 motion-reduce:transition-none data-[active=false]:pointer-events-none data-[active=false]:translate-y-2 data-[active=false]:opacity-0 data-[active=true]:translate-y-0 data-[active=true]:opacity-100',
        className,
      )}
      render={<ButtonPrimitive family="neutral" emphasis="secondary" />}
    >
      <ArrowDown aria-hidden="true" className="size-3.5 shrink-0" />
      {children}
    </MessageScrollerPrimitive.Button>
  )
}

export { useMessageScroller, useMessageScrollerScrollable }

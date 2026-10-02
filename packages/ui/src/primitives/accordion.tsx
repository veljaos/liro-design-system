import { ChevronDown } from 'lucide-react'
import { Accordion as AccordionPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from './classes'
import { cn } from './cn'

/*
 * Accordion (shadcn/ui accordion on Radix, adapted; P3.6). Mantine 9.6.2 Accordion.css, variant
 * 'default', chevron at the end: each item has a 1px border.default line under it; the control is
 * a full-width button, 16px (md) at the inline sides, surface.hover on hover; its label regular,
 * 13px (the owner's sm), text.primary, 12px (sm) above and below; a 15px chevron at the inline end
 * (the other side in right-to-left), turning 180° in 200ms when open; the panel 16px padding,
 * 5px (xs / 2) at the top. Disabled: text.disabled (no opacity, Appendix B.6). Height opens and
 * closes as the collapsible (Radix sets --radix-collapsible-content-height for its content too).
 * Keyboard (Radix, WAI-ARIA accordion): Enter and Space toggle; ArrowDown / ArrowUp move between
 * headers, Home and End go to the first and last.
 */

export const Accordion = AccordionPrimitive.Root

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-0 border-b border-solid border-default', className)}
      {...props}
    />
  )
}

export function AccordionTrigger({
  className,
  children,
  headingLevel = 3,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger> & { headingLevel?: 2 | 3 | 4 | 5 | 6 }) {
  const Heading = `h${String(headingLevel)}` as 'h3'
  return (
    <AccordionPrimitive.Header asChild>
      <Heading className="m-0 flex">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            BUTTON_RESET,
            'group flex w-full flex-1 cursor-pointer items-center gap-3 px-4 text-start text-sm font-regular text-primary',
            'enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-disabled',
            FOCUS_RING,
            'focus-visible:-outline-offset-2',
            className,
          )}
          {...props}
        >
          <span className={cn('min-w-0 flex-1 py-3 break-words', TEXT_DIRECTION)}>{children}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-[15px] shrink-0 transition-transform duration-200 ease-standard group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  )
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden data-[state=closed]:animate-liro-collapse-close data-[state=open]:animate-liro-collapse-open motion-reduce:animate-none"
      {...props}
    >
      <div
        className={cn(
          'px-4 pt-[5px] pb-4 text-sm break-words text-primary',
          TEXT_DIRECTION,
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'

/*
 * A region that opens and closes (shadcn/ui collapsible, adapted; Mantine Collapse defaults):
 * its height and opacity change over 200ms; nothing moves with reduced motion.
 */

export const Collapsible = CollapsiblePrimitive.Root
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger

export function CollapsibleContent({
  className,
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className={cn(
        'overflow-hidden data-[state=closed]:animate-liro-collapse-close data-[state=open]:animate-liro-collapse-open motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}

import { Label as LabelPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'

/** A field label (shadcn/ui label, adapted; Mantine Input.Label): 13px, weight 600. */
export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'inline-block cursor-default font-sans text-sm font-semibold break-words text-primary',
        className,
      )}
      {...props}
    />
  )
}

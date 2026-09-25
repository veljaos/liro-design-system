import { Separator as SeparatorPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'

/**
 * A dividing line (shadcn/ui separator, adapted; Mantine Divider.css, size 'xs'): 1px in
 * border.default, along the top when horizontal, along the inline start when vertical.
 * Decorative by default; pass decorative={false} when the line separates content for a reader.
 */
export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 border-0 border-solid border-default',
        'data-[orientation=horizontal]:w-full data-[orientation=horizontal]:border-t',
        'data-[orientation=vertical]:self-stretch data-[orientation=vertical]:border-s',
        className,
      )}
      {...props}
    />
  )
}

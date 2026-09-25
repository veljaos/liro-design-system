import { Check, Minus } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING } from './classes'
import { cn } from './cn'

/**
 * A checkbox (shadcn/ui checkbox, adapted; Mantine Checkbox.css, size 'sm'): 20px, radius sm (4px,
 * Checkbox defaultProps; not the theme's md),
 * 1px border.control; checked and indeterminate fill with brand.solid and a white mark 60% of the
 * box. Disabled: surface.disabled with border.default, the mark in text.disabled. An invisible
 * 2px margin makes the target 24px (WCAG 2.5.8).
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        BUTTON_RESET,
        'peer relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-solid border-control bg-surface-raised text-on-accent transition-colors duration-(--liro-duration-fast) ease-standard after:absolute after:-inset-0.5',
        'data-[state=checked]:not-disabled:border-transparent data-[state=checked]:not-disabled:bg-brand-solid data-[state=indeterminate]:not-disabled:border-transparent data-[state=indeterminate]:not-disabled:bg-brand-solid',
        'disabled:cursor-not-allowed disabled:border-default disabled:bg-surface-disabled disabled:text-disabled',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="group flex items-center justify-center"
      >
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="size-3 group-data-[state=indeterminate]:hidden"
        />
        <Minus
          aria-hidden="true"
          strokeWidth={3}
          className="hidden size-3 group-data-[state=indeterminate]:block"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

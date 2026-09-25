import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING } from './classes'
import { cn } from './cn'

/**
 * A group of radio buttons (shadcn/ui radio-group, adapted). Items stack with 16px between them
 * (Mantine Stack, gap 'md'). Arrow keys follow the provider's direction (Radix).
 */
export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

/**
 * One radio button (Mantine Radio.css, size 'sm'): a 20px circle with a 1px border.control;
 * checked fills with brand.solid and shows an 8px white dot. Disabled: surface.disabled with
 * border.default. An invisible 2px margin makes the target 24px (WCAG 2.5.8).
 */
export function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        BUTTON_RESET,
        'peer relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-solid border-control bg-surface-raised text-on-accent transition-colors duration-(--liro-duration-fast) ease-standard after:absolute after:-inset-0.5 after:rounded-full',
        'data-[state=checked]:not-disabled:border-transparent data-[state=checked]:not-disabled:bg-brand-solid',
        'disabled:cursor-not-allowed disabled:border-default disabled:bg-surface-disabled disabled:text-disabled',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-2 rounded-full bg-current"
      />
    </RadioGroupPrimitive.Item>
  )
}

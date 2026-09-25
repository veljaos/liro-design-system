import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import { createContext, useContext, useState, type ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { BUTTON_RESET, FLOATING, FLOATING_MOTION, INPUT, OPTION } from './classes'
import { cn } from './cn'

/*
 * A select (shadcn/ui select, adapted; Mantine Select and Combobox.css, size 'sm'). The trigger
 * looks like an input with an 18px chevron 8px from its end (the 34px right section of Input.css);
 * the list opens below the trigger, 8px away (Popover offset), as wide as the trigger, with 4px
 * padding (Combobox dropdown). Options mark the chosen one with a check before the text
 * (checkIconPosition 'left', 0.8em, 8px gap); at most 220px of options show at once
 * (OptionsDropdown).
 *
 * While the list is open, Radix hides everything outside it from assistive technology
 * (aria-hidden), the trigger included; the trigger then also leaves the tab order, so nothing
 * hidden can be reached with the keyboard (WCAG 4.1.2; axe aria-hidden-focus). Radix returns the
 * focus to it when the list closes.
 */

const SelectOpenContext = createContext(false)

export function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  const { open: openProp, defaultOpen = false, ...rest } = props
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  return (
    <SelectOpenContext value={open}>
      <SelectPrimitive.Root
        {...rest}
        open={open}
        onOpenChange={(next) => {
          setUncontrolledOpen(next)
          props.onOpenChange?.(next)
        }}
      />
    </SelectOpenContext>
  )
}

export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  const open = useContext(SelectOpenContext)
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      {...(open ? { tabIndex: -1 } : {})}
      className={cn(
        BUTTON_RESET,
        INPUT,
        'flex cursor-pointer items-center justify-between gap-2 pe-2 text-start data-placeholder:text-tertiary',
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" className="size-4.5 shrink-0 text-secondary" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 8,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          FLOATING,
          FLOATING_MOTION,
          'relative max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-secondary">
          <ChevronUp aria-hidden="true" className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="max-h-55 p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-secondary">
          <ChevronDown aria-hidden="true" className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/**
 * A group heading (Combobox group label): text.secondary, weight 600, the option padding; 12px
 * (Mantine: 0.85 × 13px ≈ 11px, below the smallest size of A.5).
 */
export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-2.5 py-1.5 text-xs font-semibold text-secondary', className)}
      {...props}
    />
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item data-slot="select-item" className={cn(OPTION, className)} {...props}>
      <span className="flex size-[0.8em] shrink-0 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-[0.8em]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

/** A line between groups (Combobox: 1px, 4px above and below). */
export function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    // A listbox may contain only options and groups: the line is decoration (role none).
    <SelectPrimitive.Separator
      data-slot="select-separator"
      role="none"
      className={cn('-mx-1 my-1 h-px bg-transparent border-t border-default', className)}
      {...props}
    />
  )
}

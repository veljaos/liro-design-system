import { Check, ChevronDown } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import { createContext, useContext, useState, type ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { useCollision } from '../provider/screen'
import {
  BUTTON_RESET,
  FLOATING,
  FLOATING_MOTION,
  INPUT,
  OPTION,
  TEXT_DIRECTION,
  TEXT_ISOLATE,
} from './classes'
import { cn } from './cn'

/*
 * A select (shadcn/ui select, adapted; Mantine Select and Combobox.css, size 'sm'). The trigger
 * looks like an input with an 18px chevron 8px from its end (the 34px right section of Input.css);
 * the list opens below the trigger, 8px away (Popover offset), as wide as the trigger, with 4px
 * padding (Combobox dropdown). Options mark the chosen one with a check before the text
 * (checkIconPosition 'left', 0.8em, 8px gap); at most 220px of options show at once
 * (OptionsDropdown).
 *
 * On every screen: the list keeps 8px inside the screen (the viewport, or a
 * phone frame) and is never wider than the room there — a long option wraps; it never makes the
 * page scroll sideways. The list scrolls natively (wheel, finger, keys) with a thin scrollbar;
 * Radix's scroll-up and scroll-down buttons are not used (on touch they stood in the finger's way).
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
      <span className={cn('min-w-0 truncate', TEXT_ISOLATE)}>{children}</span>
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
  const collision = useCollision()
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        {...collision}
        className={cn(
          FLOATING,
          FLOATING_MOTION,
          'relative max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) min-w-(--radix-select-trigger-width) overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Radix hides the viewport's scrollbar for its scroll buttons; the list shows a thin one
            instead. */}
        <SelectPrimitive.Viewport className="max-h-55 p-1 [scrollbar-width:thin]!">
          {children}
        </SelectPrimitive.Viewport>
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
      className={cn(
        'px-2.5 py-1.5 text-xs font-semibold text-secondary',
        TEXT_DIRECTION,
        className,
      )}
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
      {/* Radix drops ItemText's className, so the direction is on a span inside it; the span also
          travels into the trigger when the option is chosen (SelectValue). */}
      <SelectPrimitive.ItemText>
        <span className={cn('min-w-0 [overflow-wrap:anywhere]', TEXT_ISOLATE)}>{children}</span>
      </SelectPrimitive.ItemText>
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

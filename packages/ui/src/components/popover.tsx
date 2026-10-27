import { useRef, useState, type FocusEvent, type ReactElement, type ReactNode } from 'react'
import { Slot } from 'radix-ui'
import { Popover as PopoverRoot, PopoverContent, PopoverTrigger } from '../primitives/popover'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/tooltip'
import { useLiro } from '../provider/liro-provider'

/*
 * Popover and Tooltip (BUILD-PLAN P2.4), on the P2.1 primitives: Mantine Popover (8px from its
 * target, padding 12px 16px, the floating surface) and the previous Design System's inverted
 * tooltip (radius 4px, 12px text, an arrow, 300ms delay).
 */

export interface PopoverProps {
  /** The element that opens it, usually a Button. */
  trigger: ReactElement
  children: ReactNode
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Names the popover for assistive technology. From the application. */
  label?: string
  /** Where it lines up with its trigger. Default: 'center', as Mantine's position 'bottom'. */
  align?: 'start' | 'center' | 'end'
}

/**
 * Extra content next to a control: a short form, details, a choice. Not modal: the page stays
 * usable; Escape and a press outside close it, and the focus returns to the trigger.
 */
export function Popover(props: PopoverProps) {
  return (
    <PopoverRoot
      {...(props.open === undefined ? {} : { open: props.open })}
      {...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen })}
      {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
    >
      <PopoverTrigger asChild>{props.trigger}</PopoverTrigger>
      <PopoverContent
        align={props.align ?? 'center'}
        {...(props.label === undefined ? {} : { 'aria-label': props.label })}
      >
        {props.children}
      </PopoverContent>
    </PopoverRoot>
  )
}

export interface TooltipProps {
  /** The tooltip's text. From the application. */
  label: ReactNode
  /**
   * The element it describes. It must have its own accessible name: the tooltip only adds a
   * description, and is never the only place important information lives.
   */
  children: ReactElement
  /** The side it appears on. Default: 'top', as Mantine's tooltip. */
  side?: 'top' | 'bottom' | 'start' | 'end'
  /** Shown from the start, until the pointer or the focus leaves its target. Hidden by default. */
  defaultOpen?: boolean
}

/** Radix sides are physical; 'start' and 'end' follow the direction. */
export function physicalSide(
  side: NonNullable<TooltipProps['side']>,
  direction: 'ltr' | 'rtl',
): 'top' | 'bottom' | 'left' | 'right' {
  if (side === 'start') return direction === 'rtl' ? 'right' : 'left'
  if (side === 'end') return direction === 'rtl' ? 'left' : 'right'
  return side
}

/**
 * A short hint on hover and keyboard focus, after 300ms. It adds a description to its target
 * (aria-describedby); anything the user needs to act must also be visible without it. Every hover
 * hint of the library is this one, never the browser's `title` (P5.93 item 7).
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  defaultOpen,
  ...trigger
}: TooltipProps & Record<string, unknown>) {
  const { direction } = useLiro()
  const [open, setOpen] = useState(defaultOpen === true)
  const focusing = useRef(false)
  const onFocus = trigger.onFocus as ((event: FocusEvent<HTMLElement>) => void) | undefined
  // Props from an outer trigger (a menu's or a dialog's, asChild) pass on to the target, so a
  // tooltip can stand between a trigger and its button (P5.93 item 7). A focus opens the tooltip
  // only when it comes from the keyboard: a dialog that focuses its close button as it opens, or
  // a menu that gives the focus back to its button after a click, shows no tooltip.
  return (
    <TooltipProvider>
      <TooltipRoot
        open={open}
        onOpenChange={(next) => {
          if (next && focusing.current && lastInput !== 'keyboard') return
          setOpen(next)
        }}
      >
        <TooltipTrigger
          asChild
          {...trigger}
          onFocus={(event: FocusEvent<HTMLElement>) => {
            onFocus?.(event)
            focusing.current = true
            queueMicrotask(() => {
              focusing.current = false
            })
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side={physicalSide(side, direction)}>{label}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

/** How the user last acted: a focus opens a tooltip only after a key (P5.93 item 7). */
let lastInput: 'none' | 'keyboard' | 'pointer' = 'none'
if (typeof document !== 'undefined') {
  document.addEventListener(
    'keydown',
    () => {
      lastInput = 'keyboard'
    },
    true,
  )
  document.addEventListener(
    'pointerdown',
    () => {
      lastInput = 'pointer'
    },
    true,
  )
}

/**
 * The library's tooltip on a target when there is a hint, the target alone when there is none
 * (P5.93 item 7: where the browser's `title` was set only sometimes). Props from an outer trigger
 * pass on to the target either way. Internal: not exported from the package.
 */
export function HintedTarget({
  hint,
  children,
  ...trigger
}: {
  hint: ReactNode | undefined
  children: ReactElement
} & Record<string, unknown>) {
  if (hint === undefined || hint === null || hint === '') {
    return <Slot.Root {...trigger}>{children}</Slot.Root>
  }
  return (
    <Tooltip label={hint} {...trigger}>
      {children}
    </Tooltip>
  )
}

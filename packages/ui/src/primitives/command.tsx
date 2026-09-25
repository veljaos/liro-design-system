import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import type { ComponentProps } from 'react'
import { FOCUS_RING } from './classes'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog'
import { cn } from './cn'

/*
 * A searchable list of commands (shadcn/ui command on cmdk, adapted; Mantine Combobox.css,
 * size 'sm'): the search field spans the top with a line under it (Combobox.Search), the list
 * has 4px padding and is at most 220px high (OptionsDropdown), options are 13px with padding 6px
 * 10px, and the option chosen with the keyboard is filled with the brand colour. Group headings:
 * 12px, weight 600, text.secondary (Mantine: 0.85 × 13px). cmdk marks items with
 * data-selected="true" and data-disabled="true".
 */

/** `label` names the list for assistive technology; it comes from the application. */
export function Command({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive> & { label: string }) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex size-full flex-col overflow-hidden rounded-md bg-surface-overlay font-sans text-primary',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The palette in a modal dialog. `title` and `description` name it for assistive technology and
 * are not shown; both come from the application.
 */
export function CommandDialog({
  title,
  description,
  label,
  children,
  ...props
}: ComponentProps<typeof Dialog> & { title: string; description: string; label: string }) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command label={label}>{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn(
        'block h-control w-full min-w-0 border-0 border-b border-solid border-default bg-surface-overlay px-3 font-sans text-sm text-primary outline-none placeholder:text-tertiary focus:border-focus',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The list of results. `label` names it for assistive technology (cmdk would say "Suggestions"
 * in English).
 */
export function CommandList({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List> & { label: string }) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-55 scroll-py-1 overflow-x-hidden overflow-y-auto p-1',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  )
}

/** Shown when nothing matches (Combobox.Empty): 13px, text.secondary, centred, option padding. */
export function CommandEmpty({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('px-2.5 py-1.5 text-center text-sm text-secondary', className)}
      {...props}
    />
  )
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        '**:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-secondary',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A line between groups, hidden while searching unless `alwaysRender`. Drawn here rather than
 * with cmdk's separator, which is role="separator": a listbox may contain only options and
 * groups, so the line is decoration (role none).
 */
export function CommandSeparator({
  className,
  alwaysRender = false,
  ...props
}: ComponentProps<'div'> & { alwaysRender?: boolean }) {
  const searching = useCommandState((state) => state.search !== '')
  if (searching && !alwaysRender) return null
  return (
    <div
      data-slot="command-separator"
      role="none"
      className={cn('-mx-1 my-1 border-t border-solid border-default', className)}
      {...props}
    />
  )
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-primary outline-none select-none',
        'data-[selected=true]:bg-brand-solid data-[selected=true]:text-brand-on-solid',
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-disabled',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3.75',
        className,
      )}
      {...props}
    />
  )
}

/** A keyboard shortcut at the end of an item. */
export function CommandShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'ms-auto text-xs text-secondary in-data-[selected=true]:text-current',
        className,
      )}
      {...props}
    />
  )
}

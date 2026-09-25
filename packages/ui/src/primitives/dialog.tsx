import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { buttonClassName, BUTTON_SHAPES } from './button'
import { BACKDROP } from './classes'
import { cn } from './cn'

/*
 * A modal dialog (shadcn/ui dialog, adapted; Mantine Modal.css, ModalBase.css and defaults):
 * 440px wide (size 'md'), 5dvh from the top and at least 5vw from each side, radius md, shadow xl,
 * on the overlay surface over surface.backdrop; it fades down 30px in 200ms. Header: at least
 * 60px, 16px padding (11px at the inline end, beside the close button), sticky while the body
 * scrolls; title 14px regular. Body: 16px padding, none on top under a header. The close button
 * is the CompactIconButton look ("Two icon-only buttons" in docs/decisions.md); its label is
 * required, because the Design System has no text of its own.
 */

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

/** The dialog's box, in the provider's overlay container, over the backdrop. */
export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay data-slot="dialog-overlay" className={BACKDROP} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed inset-x-0 top-[5dvh] z-(--liro-layer-modal) mx-auto flex max-h-[90dvh] w-110 max-w-[90vw] flex-col overflow-y-auto rounded-md bg-surface-overlay font-sans text-primary shadow-xl outline-none',
          'data-[state=open]:animate-liro-modal-in data-[state=closed]:animate-liro-modal-out motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** The title row: the title, then the close button at the inline end. */
export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'sticky top-0 z-(--liro-layer-raised) flex min-h-15 items-center justify-between gap-4 bg-surface-overlay p-4 pe-[11px]',
        className,
      )}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('m-0 text-md leading-none font-regular', className)}
      {...props}
    />
  )
}

/** Text under the title (Mantine Text, dimmed, size 'sm'). */
export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('m-0 text-sm text-secondary', className)}
      {...props}
    />
  )
}

/** The body: 16px padding, none on top under a header; its parts stack 16px apart (Stack). */
export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('flex flex-col gap-4 p-4 not-first:pt-0', className)}
      {...props}
    />
  )
}

/** Actions at the end of the body, 16px apart, the main action last (Group, justify end). */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-wrap items-center justify-end gap-4', className)}
      {...props}
    />
  )
}

/** The close button: 28px, neutral and subtle, a 16px X. `label` is its accessible name. */
export function DialogCloseButton({
  label,
  className,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Close>, 'children'> & { label: string }) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      aria-label={label}
      title={label}
      className={cn(
        buttonClassName({ family: 'neutral', emphasis: 'menu', shape: 'compact' }),
        className,
      )}
      {...props}
    >
      <X aria-hidden="true" className={BUTTON_SHAPES.compact.icon} />
    </DialogPrimitive.Close>
  )
}

import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import type { Emphasis, Family } from '../components/intents'
import { usePortalContainer } from '../provider/portal'
import { buttonClassName } from './button'
import { BACKDROP } from './classes'
import { cn } from './cn'

/*
 * A dialog that asks before an action (shadcn/ui alert-dialog, adapted). Mantine has no alert
 * dialog; its confirm modal is a Modal with the actions in a Group at the end, 16px apart and
 * 16px under the text (modals.openConfirmModal). So it has the Dialog look, without a close
 * button: it closes only through its actions or Escape, never by a click outside.
 */

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <AlertDialogPrimitive.Portal container={container}>
      <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={BACKDROP} />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'fixed inset-x-0 top-[5dvh] z-(--liro-layer-modal) mx-auto flex max-h-[90dvh] w-110 max-w-[90vw] flex-col gap-4 overflow-y-auto rounded-md bg-surface-overlay p-4 font-sans text-primary shadow-xl outline-none',
          'data-[state=open]:animate-liro-modal-in data-[state=closed]:animate-liro-modal-out motion-reduce:animate-none',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

/** The question: 14px regular, as the Dialog title. */
export function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('m-0 text-md leading-none font-regular', className)}
      {...props}
    />
  )
}

/** What happens: 13px, text.secondary. */
export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('m-0 text-sm text-secondary', className)}
      {...props}
    />
  )
}

/** The actions, at the end, 16px apart; the main action last. */
export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-wrap items-center justify-end gap-4', className)}
      {...props}
    />
  )
}

interface ActionLook {
  /** Default: primary for the action, neutral for cancel. */
  family?: Family
  /** Default: primary (filled) for the action, secondary for cancel. */
  emphasis?: Emphasis
}

/** The action being confirmed: a button with a family (from the action's intent) and emphasis. */
export function AlertDialogAction({
  family = 'primary',
  emphasis = 'primary',
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action> & ActionLook) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      data-family={family}
      className={cn(buttonClassName({ family, emphasis, shape: 'text' }), className)}
      {...props}
    />
  )
}

/** Goes back without acting; it receives the focus when the dialog opens (Radix). */
export function AlertDialogCancel({
  family = 'neutral',
  emphasis = 'secondary',
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel> & ActionLook) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      data-family={family}
      className={cn(buttonClassName({ family, emphasis, shape: 'text' }), className)}
      {...props}
    />
  )
}

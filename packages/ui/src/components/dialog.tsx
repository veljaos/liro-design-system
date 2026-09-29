import type { ReactElement, ReactNode } from 'react'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as DialogRoot,
  DialogTrigger,
} from '../primitives/dialog'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'

/*
 * Dialog and Drawer (BUILD-PLAN P2.4). The look is the P2.1 primitives' (Mantine Modal and
 * Drawer). When to use which (Appendix B.8, AGENTS.md D14): a **dialog** for one action with one
 * outcome, or a read-only view; a **drawer** for a short edit with the list still visible; a full
 * page for anything with more than about ten fields, tabs or attachments.
 */

/** What Dialog and Drawer share. */
interface OverlayProps {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it, usually a Button. Optional when `open` is controlled. */
  trigger?: ReactElement
  /** The title, from the application. Names the dialog for assistive technology. */
  title: ReactNode
  /** A line under the title, from the application. */
  description?: ReactNode
  children?: ReactNode
  /** Buttons at the end, the main action last (AGENTS.md D13). */
  actions?: ReactNode
  /**
   * Default true. False while the dialog must stay (for example while an action runs): Escape
   * and a press outside do not close it, and the close button is hidden.
   */
  dismissible?: boolean
}

export type DialogProps = OverlayProps

/** The handlers that keep an overlay open while it is not dismissible. */
function keepOpen(dismissible: boolean) {
  if (dismissible) return {}
  const prevent = (event: Event) => {
    event.preventDefault()
  }
  return { onEscapeKeyDown: prevent, onPointerDownOutside: prevent, onInteractOutside: prevent }
}

function rootProps(props: OverlayProps) {
  return {
    ...(props.open === undefined ? {} : { open: props.open }),
    ...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen }),
    ...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange }),
  }
}

/** The title row, description, body and actions, shared by both. */
function OverlayParts(props: OverlayProps) {
  const { messages } = useLiro()
  const dismissible = props.dismissible ?? true
  return (
    <>
      <DialogHeader>
        <DialogTitle>{props.title}</DialogTitle>
        {dismissible && <DialogCloseButton label={messages['dialog.close']} />}
      </DialogHeader>
      <DialogBody>
        {props.description !== undefined && (
          <DialogDescription>{props.description}</DialogDescription>
        )}
        {props.children}
        {props.actions !== undefined && <DialogFooter>{props.actions}</DialogFooter>}
      </DialogBody>
    </>
  )
}

/**
 * A modal dialog: one action with one outcome, or a read-only view. The title names it; the
 * close button's name comes from the provider's messages; the focus stays inside while it is open
 * and returns to the trigger when it closes.
 */
export function Dialog(props: DialogProps) {
  return (
    <DialogRoot {...rootProps(props)}>
      {props.trigger !== undefined && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent
        {...keepOpen(props.dismissible ?? true)}
        {...(props.description === undefined ? { 'aria-describedby': undefined } : {})}
      >
        <OverlayParts {...props} />
      </DialogContent>
    </DialogRoot>
  )
}

export interface DrawerProps extends OverlayProps {
  /**
   * The side it slides in from. 'start' (default, as Mantine's drawer) is the left in
   * left-to-right and the right in right-to-left; 'end' the other.
   */
  side?: 'start' | 'end'
}

/** A side sheet for a short edit while the list stays visible; it follows the direction. */
export function Drawer(props: DrawerProps) {
  return (
    <Sheet {...rootProps(props)}>
      {props.trigger !== undefined && <SheetTrigger asChild>{props.trigger}</SheetTrigger>}
      <SheetContent
        side={props.side ?? 'start'}
        {...keepOpen(props.dismissible ?? true)}
        {...(props.description === undefined ? { 'aria-describedby': undefined } : {})}
      >
        <OverlayParts {...props} />
      </SheetContent>
    </Sheet>
  )
}

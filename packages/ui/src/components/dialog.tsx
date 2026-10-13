import { useRef, type ReactElement, type ReactNode } from 'react'
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
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useSteadyBottom } from '../primitives/use-steady-bottom'
import { useLiro } from '../provider/liro-provider'

/*
 * Dialog and Drawer (BUILD-PLAN P2.4). The look is the P2.1 primitives' (Mantine Modal and
 * Drawer). When to use which (Appendix B.8, AGENTS.md D14): a **dialog** for one action with one
 * outcome, or a read-only view; a **drawer** for a short edit with the list still visible; a full
 * page for anything with more than about ten fields, tabs or attachments.
 *
 * A dialog that acts on one record (P5.28 item 6, the owner's review) names the action as its
 * title ("Correct", "Reject swap request", "Show diagnosis") and the record, bold, on its own line
 * under it (`subject`: "Nenad Ilić, Wed 7"). Both are inside the title element, so the dialog's
 * accessible name says what is done to what. Components that draw their own header from the
 * primitives put `DialogHeading` inside their DialogTitle.
 */

/** Whether a subject renders anything. */
function hasSubject(subject: ReactNode): boolean {
  return subject !== undefined && subject !== null && subject !== false && subject !== ''
}

/**
 * A dialog's title and, on its own line, the record it acts on, bold (P5.28 item 6). Goes inside a
 * DialogTitle; without a subject it is the title alone. The space between the two keeps the
 * accessible name's words apart ("Correct Nenad Ilić, Wed 7").
 */
export function DialogHeading({ title, subject }: { title: ReactNode; subject?: ReactNode }) {
  if (!hasSubject(subject)) return <>{title}</>
  return (
    <span data-slot="dialog-heading" className="flex min-w-0 flex-col gap-1.5">
      <span className={TEXT_DIRECTION}>{title}</span>{' '}
      <span
        data-slot="dialog-subject"
        className={cn('font-bold leading-snug text-primary', TEXT_DIRECTION)}
      >
        {subject}
      </span>
    </span>
  )
}

/** The header row's alignment: a two-line heading keeps the close button on its first line. */
export function dialogHeaderClass(subject: ReactNode): string {
  return hasSubject(subject) ? 'items-start' : ''
}

/** What Dialog and Drawer share. */
interface OverlayProps {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it, usually a Button. Optional when `open` is controlled. */
  trigger?: ReactElement
  /**
   * The title, from the application. Names the dialog for assistive technology. On a dialog that
   * acts on one record, the action ("Correct", "Move appointment"); the record goes in `subject`.
   */
  title: ReactNode
  /**
   * The one record the dialog acts on, from the application ("Nenad Ilić, Wed 7"): bold, on its
   * own line under the title, and part of the dialog's name (P5.28 item 6).
   */
  subject?: ReactNode
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

export interface DialogProps extends OverlayProps {
  /**
   * 'wide' (720px, at most 90% of the screen) for a read-only view that needs the room: a
   * document in the viewer, a table. Default 440px.
   */
  size?: 'default' | 'wide'
}

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
  // A message that comes and goes in the body never moves what is in view (P5.23).
  const body = useRef<HTMLDivElement>(null)
  const spacer = useSteadyBottom(body, undefined)
  return (
    <>
      <DialogHeader className={dialogHeaderClass(props.subject)}>
        <DialogTitle>
          <DialogHeading title={props.title} subject={props.subject} />
        </DialogTitle>
        {dismissible && <DialogCloseButton label={messages['dialog.close']} />}
      </DialogHeader>
      <DialogBody ref={body}>
        {props.description !== undefined && (
          <DialogDescription>{props.description}</DialogDescription>
        )}
        {props.children}
        {props.actions !== undefined && <DialogFooter>{props.actions}</DialogFooter>}
      </DialogBody>
      <div ref={spacer} aria-hidden="true" className="shrink-0" />
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
        {...(props.size === 'wide' ? { className: 'w-180' } : {})}
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

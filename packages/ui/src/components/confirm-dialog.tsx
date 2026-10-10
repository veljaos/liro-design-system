import { TriangleAlert } from 'lucide-react'
import { useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ButtonPrimitive, LoadingButtonPrimitive } from '../primitives/button'
import { cn } from '../primitives/cn'
import { TEXT_DIRECTION } from '../primitives/classes'
import {
  Dialog as DialogRoot,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { INTENTS, type Family, type IconComponent, type Intent } from './intents'
import type { Tone } from './status-badge'
import { RadioGroupField } from './radio-group-field'
import { TextAreaField, TextField } from './text-field'

/*
 * ConfirmDialog (BUILD-PLAN P2.4), the previous Design System's ConfirmModal, carried over
 * exactly (owner's decision, 2026-09-28, docs/decisions.md "Overlays"):
 * - Title row: an 18px icon (default TriangleAlert, lucide's AlertTriangle) and the title, bold
 *   (700), 13px, both in the tone's fg colour.
 * - The tone comes from the action's family: primary and verify → info, document → neutral,
 *   positive → success, destructive → danger, caution → warning, neutral → neutral; warning
 *   without an intent or family; the `tone` prop overrides it.
 * - The text in text.secondary, 13px, aligned with the title's text (after the icon, P4.9). The
 *   buttons in the standard dialog footer (DialogFooter: 16px under the text, 8px apart, P4.9):
 *   Cancel in the neutral "default" weight, then the confirm button filled in the action's family
 *   colour (the main action last).
 * - Colours never mix (owner, P3.2a): the confirm button always follows the dialog's tone. Its
 *   family is the action's when that family gives the tone, otherwise the tone's own family
 *   (warning → caution, danger → destructive, info → primary, success → positive, neutral →
 *   neutral, premium → document), so a confirmation without an action, or with a `tone` that
 *   overrides the action's, never shows a warning title over a blue button.
 * - Centred on the screen, radius lg (12px).
 * - While confirming, the confirm button shows a loader, Cancel is disabled, and neither Escape
 *   nor a press outside closes it.
 */

const FAMILY_TONE: Record<Family, Tone> = {
  primary: 'info',
  verify: 'info',
  document: 'neutral',
  positive: 'success',
  destructive: 'danger',
  caution: 'warning',
  neutral: 'neutral',
}

/** The tone's text colour; literal classes, so Tailwind finds them. */
const TONE_TEXT: Record<Tone, string> = {
  success: 'text-status-success-fg',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
  info: 'text-status-info-fg',
  neutral: 'text-status-neutral-fg',
  premium: 'text-status-premium-fg',
}

/** The family that draws each tone's confirm button. */
const TONE_FAMILY: Record<Tone, Family> = {
  warning: 'caution',
  danger: 'destructive',
  info: 'primary',
  success: 'positive',
  neutral: 'neutral',
  premium: 'document',
}

/** The tone of a confirmation: the given one, else its family's, else warning. */
export function confirmTone(tone: Tone | undefined, family: Family | undefined): Tone {
  return tone ?? (family === undefined ? 'warning' : FAMILY_TONE[family])
}

/**
 * The confirm button's family: the action's when it gives the dialog's tone, otherwise the
 * tone's own, so the button never takes another colour than the title.
 */
export function confirmFamily(tone: Tone, family: Family | undefined): Family {
  return family !== undefined && FAMILY_TONE[family] === tone ? family : TONE_FAMILY[tone]
}

interface ConfirmBase {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it, usually the action's Button. */
  trigger?: ReactElement
  /**
   * Runs the action. While a returned promise is pending the dialog shows it is working and
   * cannot be closed; it closes when the promise resolves and stays open when it rejects.
   */
  onConfirm: () => void | Promise<void>
  /** The application is running the action (when it does not return a promise). */
  loading?: boolean
  /** Overrides the tone the action's family gives. */
  tone?: Tone
  /** The title's icon. Default: TriangleAlert. */
  icon?: IconComponent
  /** Default: the provider's `messages['dialog.cancel']`. */
  cancelLabel?: string
  /**
   * What the action will do, under the message, from the application: a summary of what is
   * posted, a preview of the result (a read-only table). Use `size` 'wide' for a table.
   */
  preview?: ReactNode
  /** 'wide' (720px, at most 90% of the screen) for a preview that needs the room. Default 440px. */
  size?: 'default' | 'wide'
}

/** The action: an interface intent, or a family with its icon (as Button). */
type ConfirmAction =
  | { intent: Intent; family?: never; actionIcon?: never }
  | { family: Family; actionIcon: IconComponent; intent?: never }
  | { intent?: never; family?: never; actionIcon?: never }

export type ConfirmDialogProps = ConfirmBase &
  ConfirmAction & {
    /** The question, from the application: "Delete invoice F-114?". */
    title: ReactNode
    /** What will happen, from the application. */
    message?: ReactNode
    /** The confirm button's text, from the application. */
    confirmLabel: string
  }

/** The action's family and icon. */
function actionOf(props: ConfirmAction): {
  family: Family | undefined
  icon: IconComponent | undefined
} {
  if (props.intent !== undefined) {
    const intent = INTENTS[props.intent]
    return { family: intent.family, icon: intent.icon }
  }
  return { family: props.family, icon: props.actionIcon }
}

/** The dialog every confirmation is drawn with; `extra` sits between the text and the buttons. */
function ConfirmFrame(
  props: ConfirmDialogProps & { extra?: ReactNode; confirmDisabled?: boolean },
) {
  const { messages } = useLiro()
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen ?? false)
  const open = props.open ?? innerOpen
  const [pending, setPending] = useState(false)
  const busy = pending || props.loading === true
  const { family, icon: ActionIcon } = actionOf(props)
  const tone = confirmTone(props.tone, family)
  const TitleIcon = props.icon ?? TriangleAlert
  // The safe action takes the focus when the dialog opens (P4.9d): a single Enter never confirms
  // a delete, a rejection or a discard, and the close button is not where typing starts.
  const cancelRef = useRef<HTMLButtonElement>(null)

  const setOpen = (next: boolean) => {
    if (busy && !next) return
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  const confirm = () => {
    const result = props.onConfirm()
    if (result instanceof Promise) {
      setPending(true)
      result.then(
        () => {
          setPending(false)
          setOpen(false)
        },
        () => {
          setPending(false)
        },
      )
    } else if (props.loading !== true) {
      setOpen(false)
    }
  }
  const keep = (event: Event) => {
    if (busy) event.preventDefault()
  }

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      {props.trigger !== undefined && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent
        role="alertdialog"
        className={cn('inset-y-0 my-auto h-fit rounded-lg', props.size === 'wide' && 'w-180')}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          cancelRef.current?.focus()
        }}
        onEscapeKeyDown={keep}
        onPointerDownOutside={keep}
        onInteractOutside={keep}
        {...(props.message === undefined ? { 'aria-describedby': undefined } : {})}
      >
        {/* One inset for the header, the text and the footer (P4.9d): 16px from every edge. */}
        <div className="flex items-start justify-between gap-4 p-4">
          <DialogTitle
            className={cn(
              'flex items-center gap-2 text-sm leading-tight font-bold',
              TONE_TEXT[tone],
            )}
          >
            <TitleIcon aria-hidden="true" className="size-4.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{props.title}</span>
          </DialogTitle>
          {!busy && <DialogCloseButton label={messages['dialog.close']} />}
        </div>
        <div className="flex flex-col px-4 pb-4">
          {/* The text starts at the header row's start, under the icon (one inset, P4.9d). */}
          {(props.message !== undefined ||
            props.preview !== undefined ||
            props.extra !== undefined) && (
            <div data-slot="confirm-body" className="flex flex-col">
              {props.message !== undefined && (
                <DialogDescription className="text-sm text-secondary">
                  {props.message}
                </DialogDescription>
              )}
              {props.preview !== undefined && (
                <div data-slot="confirm-preview" className="mt-4 flex min-w-0 flex-col gap-4">
                  {props.preview}
                </div>
              )}
              {props.extra}
            </div>
          )}
          <DialogFooter className="mt-4">
            <ButtonPrimitive
              ref={cancelRef}
              family="neutral"
              emphasis="secondary"
              disabled={busy}
              onClick={() => {
                setOpen(false)
              }}
            >
              <span>{props.cancelLabel ?? messages['dialog.cancel']}</span>
            </ButtonPrimitive>
            <LoadingButtonPrimitive
              family={confirmFamily(tone, family)}
              emphasis="primary"
              disabled={props.confirmDisabled === true}
              loading={busy}
              onClick={() => {
                confirm()
              }}
            >
              {ActionIcon !== undefined && (
                <ActionIcon aria-hidden="true" className="size-3.75 shrink-0" />
              )}
              <span>{props.confirmLabel}</span>
            </LoadingButtonPrimitive>
          </DialogFooter>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}

/**
 * Asks before an action that needs a second thought: delete, send, post, void. The question, the
 * text and the button's label come from the application; the colour of the title and the button
 * from the action's intent or family.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return <ConfirmFrame {...props} />
}

export type DeleteConfirmDialogProps = ConfirmBase & {
  /** Default: `messages['confirm.deleteTitle']`. */
  title?: ReactNode
  /** Default: `messages['confirm.deleteMessage']`. */
  message?: ReactNode
  /** Default: `messages['confirm.deleteLabel']`. */
  confirmLabel?: string
}

/** The confirmation of a delete: the danger tone, the delete intent, texts from the provider. */
export function DeleteConfirmDialog(props: DeleteConfirmDialogProps) {
  const { messages } = useLiro()
  return (
    <ConfirmFrame
      {...props}
      intent="delete"
      title={props.title ?? messages['confirm.deleteTitle']}
      message={props.message ?? messages['confirm.deleteMessage']}
      confirmLabel={props.confirmLabel ?? messages['confirm.deleteLabel']}
    />
  )
}

/** A reason the application offers (a rejection's reason). */
export interface ConfirmReason {
  value: string
  label: string
}

/** What the user gave: the chosen reason (with a list) and the written text, trimmed. */
export interface ConfirmAnswer {
  reason: string | undefined
  text: string
}

/**
 * The reason an irreversible action asks for (P5.18: a cancellation), as ReasonConfirmDialog
 * asks it: with `reasons` one must be chosen and the text is optional details; without them the
 * text is the reason and is required.
 */
export interface IrreversibleReason {
  reasons?: readonly ConfirmReason[]
  /** Default: `messages['confirm.reason']`. */
  label?: string
  /** The details' label beside a list. Default: `messages['confirm.reasonDetails']`. */
  detailsLabel?: string
}

export type IrreversibleConfirmDialogProps = ConfirmAction &
  Omit<ConfirmBase, 'onConfirm'> & {
    /** The question, from the application: "Cancel invoice F-2026-0407?". */
    title: ReactNode
    /** What will happen, from the application. */
    message?: ReactNode
    /** The confirm button's text, from the application. */
    confirmLabel: string
    /**
     * The word or number the user types to enable the button: the document's number, the
     * company's name. Compared exactly, ignoring spaces at either end.
     */
    confirmText: string
    /**
     * Runs the action; as ConfirmDialog's `onConfirm`. With `reason`, it receives the answer (the
     * chosen reason and the text); without it the answer is empty.
     */
    onConfirm: (answer: ConfirmAnswer) => void | Promise<void>
    /**
     * Also asks why (P5.18, owner: one dialog asks the reason AND the typed confirmation — never
     * two dialogs in a row). The button enables once both are given.
     */
    reason?: IrreversibleReason
  }

/**
 * The confirmation of an action that cannot be undone: it states the consequence (`message`) and
 * enables its button only when the user has typed `confirmText` — and, with `reason`, has given
 * the reason (a cancellation).
 */
export function IrreversibleConfirmDialog(props: IrreversibleConfirmDialogProps) {
  const { messages } = useLiro()
  const [typed, setTyped] = useState('')
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  const [text, setText] = useState('')
  const { confirmText, reason, onConfirm, ...rest } = props
  const matches = typed.trim() === confirmText
  const reasons = reason?.reasons
  const hasList = reasons !== undefined && reasons.length > 0
  const reasoned = reason === undefined || (hasList ? chosen !== undefined : text.trim() !== '')
  return (
    <ConfirmFrame
      {...rest}
      confirmDisabled={!matches || !reasoned}
      onConfirm={() =>
        onConfirm(
          reason === undefined
            ? { reason: undefined, text: '' }
            : { reason: chosen, text: text.trim() },
        )
      }
      onOpenChange={(open) => {
        if (!open) {
          setTyped('')
          setChosen(undefined)
          setText('')
        }
        props.onOpenChange?.(open)
      }}
      extra={
        <div className="mt-4 flex flex-col gap-4">
          {reason !== undefined && hasList && (
            <RadioGroupField
              label={reason.label ?? messages['confirm.reason']}
              required
              options={reasons}
              {...(chosen === undefined ? {} : { value: chosen })}
              onChange={setChosen}
            />
          )}
          {reason !== undefined && (
            <TextAreaField
              label={
                hasList
                  ? (reason.detailsLabel ?? messages['confirm.reasonDetails'])
                  : (reason.label ?? messages['confirm.reason'])
              }
              required={!hasList}
              rows={3}
              value={text}
              onChange={setText}
            />
          )}
          {/* The typed confirmation comes last: the reason is the thinking, typing the number
              the decision. */}
          <TextField
            label={messages['confirm.typeToConfirm'](confirmText)}
            value={typed}
            onChange={setTyped}
            autoComplete="off"
          />
        </div>
      }
    />
  )
}

export type ReasonConfirmDialogProps = ConfirmAction &
  Omit<ConfirmBase, 'onConfirm'> & {
    /** The question, from the application: "Reject UF-2026-1187?". */
    title: ReactNode
    /** What will happen, from the application. */
    message?: ReactNode
    /** The confirm button's text, from the application. */
    confirmLabel: string
    /** Runs the action with the answer; as ConfirmDialog's `onConfirm`. */
    onConfirm: (answer: ConfirmAnswer) => void | Promise<void>
    /**
     * The reasons to choose from (the Core's list). With them, one must be chosen and the text
     * is optional details; without them, the text is the reason and is required.
     */
    reasons?: readonly ConfirmReason[]
    /** The reason's label. Default: `messages['confirm.reason']`. */
    reasonLabel?: string
    /** The details' label beside a list. Default: `messages['confirm.reasonDetails']`. */
    detailsLabel?: string
  }

/**
 * A confirmation that asks why (P4.9, the owner's review): reject, return, cancel with a reason.
 * The confirm button enables once a reason is given — a reason chosen from `reasons`, or the
 * text written when there is no list; `onConfirm` receives both. Same frame, tone and buttons as
 * ConfirmDialog.
 */
export function ReasonConfirmDialog(props: ReasonConfirmDialogProps) {
  const { messages } = useLiro()
  const [reason, setReason] = useState<string | undefined>(undefined)
  const [text, setText] = useState('')
  const { reasons, reasonLabel, detailsLabel, onConfirm, ...rest } = props
  const hasList = reasons !== undefined && reasons.length > 0
  const ready = hasList ? reason !== undefined : text.trim() !== ''
  return (
    <ConfirmFrame
      {...rest}
      confirmDisabled={!ready}
      onConfirm={() => onConfirm({ reason, text: text.trim() })}
      onOpenChange={(open) => {
        if (!open) {
          setReason(undefined)
          setText('')
        }
        props.onOpenChange?.(open)
      }}
      extra={
        <div className="mt-4 flex flex-col gap-4">
          {hasList && (
            <RadioGroupField
              label={reasonLabel ?? messages['confirm.reason']}
              required
              options={reasons}
              {...(reason === undefined ? {} : { value: reason })}
              onChange={setReason}
            />
          )}
          <TextAreaField
            label={
              hasList
                ? (detailsLabel ?? messages['confirm.reasonDetails'])
                : (reasonLabel ?? messages['confirm.reason'])
            }
            required={!hasList}
            rows={3}
            value={text}
            onChange={setText}
          />
        </div>
      }
    />
  )
}

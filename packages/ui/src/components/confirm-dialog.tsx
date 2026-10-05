import { TriangleAlert } from 'lucide-react'
import { useState, type ReactElement, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { cn } from '../primitives/cn'
import { TEXT_DIRECTION } from '../primitives/classes'
import {
  Dialog as DialogRoot,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { INTENTS, type Family, type IconComponent, type Intent } from './intents'
import type { Tone } from './status-badge'
import { TextField } from './text-field'

/*
 * ConfirmDialog (BUILD-PLAN P2.4), the previous Design System's ConfirmModal, carried over
 * exactly (owner's decision, 2026-09-28, docs/decisions.md "Overlays"):
 * - Title row: an 18px icon (default TriangleAlert, lucide's AlertTriangle) and the title, bold
 *   (700), 13px, both in the tone's fg colour.
 * - The tone comes from the action's family: primary and verify → info, document → neutral,
 *   positive → success, destructive → danger, caution → warning, neutral → neutral; warning
 *   without an intent or family; the `tone` prop overrides it.
 * - The text in text.secondary, 13px. Buttons at the end, 12px apart, 16px under the text:
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

/** Mantine's oval loader (Loader.css): 20px (36 / 1.8), a ring with one open quarter. */
function Loader() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 m-auto box-border size-5 animate-liro-spin rounded-full border-[2.5px] border-solid border-current border-s-transparent"
    />
  )
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
        className="inset-y-0 my-auto h-fit rounded-lg"
        onEscapeKeyDown={keep}
        onPointerDownOutside={keep}
        onInteractOutside={keep}
        {...(props.message === undefined ? { 'aria-describedby': undefined } : {})}
      >
        <div className="flex items-start justify-between gap-4 p-4 pe-[11px]">
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
          {props.message !== undefined && (
            <DialogDescription className="text-sm text-secondary">
              {props.message}
            </DialogDescription>
          )}
          {props.extra}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <ButtonPrimitive
              family="neutral"
              emphasis="secondary"
              disabled={busy}
              onClick={() => {
                setOpen(false)
              }}
            >
              <span>{props.cancelLabel ?? messages['dialog.cancel']}</span>
            </ButtonPrimitive>
            <ButtonPrimitive
              family={confirmFamily(tone, family)}
              emphasis="primary"
              disabled={props.confirmDisabled === true}
              aria-disabled={busy || undefined}
              aria-busy={busy || undefined}
              data-loading={busy ? '' : undefined}
              className="relative data-loading:cursor-not-allowed"
              onClick={() => {
                if (!busy) confirm()
              }}
            >
              {/* While loading, the content keeps the button's size and its accessible name but is not seen (Mantine: opacity 0). */}
              <span className={cn('contents', busy && '[&>*]:opacity-0')}>
                {ActionIcon !== undefined && (
                  <ActionIcon aria-hidden="true" className="size-3.75 shrink-0" />
                )}
                <span>{props.confirmLabel}</span>
              </span>
              {busy && <Loader />}
            </ButtonPrimitive>
          </div>
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

export type IrreversibleConfirmDialogProps = ConfirmDialogProps & {
  /**
   * The word or number the user types to enable the button: the document's number, the
   * company's name. Compared exactly, ignoring spaces at either end.
   */
  confirmText: string
}

/**
 * The confirmation of an action that cannot be undone: it states the consequence (`message`) and
 * enables its button only when the user has typed `confirmText`.
 */
export function IrreversibleConfirmDialog(props: IrreversibleConfirmDialogProps) {
  const { messages } = useLiro()
  const [typed, setTyped] = useState('')
  const { confirmText, ...rest } = props
  const matches = typed.trim() === confirmText
  return (
    <ConfirmFrame
      {...rest}
      confirmDisabled={!matches}
      onOpenChange={(open) => {
        if (!open) setTyped('')
        props.onOpenChange?.(open)
      }}
      extra={
        <TextField
          className="mt-4"
          label={messages['confirm.typeToConfirm'](confirmText)}
          value={typed}
          onChange={setTyped}
          autoComplete="off"
        />
      }
    />
  )
}

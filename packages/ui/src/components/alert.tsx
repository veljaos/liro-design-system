import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { IconComponent } from './intents'

/*
 * Alert and Banner (BUILD-PLAN P2.5): Mantine's Alert with radius md and the "light" variant
 * (owner's decision, 2026-09-28, docs/decisions.md "Feedback"): the tone's subtle background,
 * the title and the icon in the tone's colour. Mantine 9.6.2 Alert.css: 16px padding, a 1px
 * transparent border, a 20px icon 16px before the text, the title 13px bold, the message 13px in
 * the text colour, 10px between them. The icons are the toasts': Info, CircleCheck,
 * TriangleAlert, CircleX.
 *
 * Without a tone, an alert is neutral (grey: the neutral tone's bg and fg; P3.6, owner): blue
 * is for actions, and "info" is given only when asked for.
 *
 * Mantine's close button is 16px; ours is 24px (the minimum target, Definition of done), with the
 * same 16px icon and no background.
 */

/** The tones of an alert. */
export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface ToneLook {
  icon: IconComponent
  box: string
  fg: string
}

/** Literal classes, so Tailwind finds them. */
const TONES: Record<AlertTone, ToneLook> = {
  neutral: { icon: Info, box: 'bg-status-neutral-bg', fg: 'text-status-neutral-fg' },
  info: { icon: Info, box: 'bg-status-info-bg', fg: 'text-status-info-fg' },
  success: { icon: CircleCheck, box: 'bg-status-success-bg', fg: 'text-status-success-fg' },
  warning: { icon: TriangleAlert, box: 'bg-status-warning-bg', fg: 'text-status-warning-fg' },
  danger: { icon: CircleX, box: 'bg-status-danger-bg', fg: 'text-status-danger-fg' },
}

/**
 * The role of an alert: a warning or a danger interrupts, information and success are announced
 * politely (as the toasts).
 */
export function alertRole(tone: AlertTone): 'alert' | 'status' {
  return tone === 'warning' || tone === 'danger' ? 'alert' : 'status'
}

interface AlertBaseProps {
  /** Default: 'neutral'. */
  tone?: AlertTone
  /** A heading, from the application. */
  title?: ReactNode
  /** The icon; default: the tone's. */
  icon?: IconComponent
  /** Makes it dismissible: a close button calls this. */
  onClose?: () => void
  /** Layout classes (margins, width). */
  className?: string
}

export interface AlertProps extends AlertBaseProps {
  /** The message, from the application. */
  children?: ReactNode
}

function CloseButton({ onClose, fg }: { onClose: () => void; fg: string }) {
  const { messages } = useLiro()
  return (
    <button
      type="button"
      aria-label={messages['alert.close']}
      title={messages['alert.close']}
      onClick={onClose}
      className={cn(
        BUTTON_RESET,
        'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm',
        FOCUS_RING,
        fg,
      )}
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  )
}

/**
 * A message in the page about its content: information, success, a warning or a danger. It stays
 * until the user closes it (when `onClose` is given) or the page changes.
 */
export function Alert({ tone = 'neutral', title, icon, onClose, className, children }: AlertProps) {
  const look = TONES[tone]
  const Icon = icon ?? look.icon
  return (
    <div
      role={alertRole(tone)}
      data-tone={tone}
      className={cn(
        'relative flex overflow-hidden rounded-md border border-solid border-transparent p-4 font-sans',
        look.box,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('me-4 mt-px flex size-5 shrink-0 items-center', look.fg)}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {title !== undefined && (
          <div
            className={cn(
              'flex items-center justify-between text-sm font-bold',
              look.fg,
              onClose !== undefined && 'pe-4',
            )}
          >
            <span className="min-w-0 break-words">{title}</span>
          </div>
        )}
        {children !== undefined && (
          <div className="text-sm break-words text-primary">{children}</div>
        )}
      </div>
      {onClose !== undefined && <CloseButton onClose={onClose} fg={look.fg} />}
    </div>
  )
}

export interface BannerProps extends AlertBaseProps {
  /** The message, from the application: one or two lines. */
  children: ReactNode
  /** Actions at the end, e.g. a Button ("Reconnect", "Review"). */
  actions?: ReactNode
}

/**
 * A strip across its container about the whole page or application: offline, a trial ending, a
 * closed period. The Alert's look in one row: icon, title and message, actions at the end.
 */
export function Banner({
  tone = 'neutral',
  title,
  icon,
  onClose,
  className,
  children,
  actions,
}: BannerProps) {
  const look = TONES[tone]
  const Icon = icon ?? look.icon
  return (
    <div
      role={alertRole(tone)}
      data-tone={tone}
      className={cn(
        'flex w-full flex-wrap items-center gap-x-4 gap-y-2.5 rounded-md border border-solid border-transparent p-4 font-sans',
        look.box,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('flex size-5 shrink-0 items-center', look.fg)}>
        <Icon className="size-5" />
      </span>
      <p className="m-0 min-w-0 flex-1 text-sm break-words text-primary">
        {title !== undefined && <strong className={cn('font-bold', look.fg)}>{title} </strong>}
        {children}
      </p>
      {actions !== undefined && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      {onClose !== undefined && <CloseButton onClose={onClose} fg={look.fg} />}
    </div>
  )
}

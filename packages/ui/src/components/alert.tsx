import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
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
 *
 * One line, one height (P5.23, the owner's review: "5 checks passed" was 62px for one line). An
 * Alert with only a title — no message, or a message that renders nothing (`false`, null, '') —
 * is compact: ONE_LINE padding (10px by 16px), the icon centred on the title's line, 42px high.
 * A Banner is a one-row strip and always uses ONE_LINE. An empty message never adds the 10px gap.
 */

/** The padding of every one-line alert or banner: 10px by 16px. */
const ONE_LINE = 'px-4 py-2.5'

/** Whether a message renders anything: `false`, null, undefined and '' do not. */
export function hasMessage(children: ReactNode): boolean {
  if (children === undefined || children === null || children === false || children === true) {
    return false
  }
  if (typeof children === 'string') return children !== ''
  if (Array.isArray(children)) return children.some((child: ReactNode) => hasMessage(child))
  return true
}

/** The tones of an alert. */
export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface ToneLook {
  icon: IconComponent
  box: string
  fg: string
}

/** Literal classes, so Tailwind finds them. */
const TONES: Record<AlertTone, ToneLook> = {
  // Neutral has a border (owner, P3.6): its grey is the page's own, so the box would vanish.
  neutral: {
    icon: Info,
    box: 'border-status-neutral-border bg-status-neutral-bg',
    fg: 'text-status-neutral-fg',
  },
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
  const message = hasMessage(children)
  const compact = !message
  return (
    <div
      role={alertRole(tone)}
      data-tone={tone}
      data-compact={compact ? '' : undefined}
      className={cn(
        'relative flex overflow-hidden rounded-md border border-solid border-transparent font-sans',
        compact ? cn(ONE_LINE, 'items-center') : 'p-4',
        look.box,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('me-4 flex size-5 shrink-0 items-center', !compact && 'mt-px', look.fg)}
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
            <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>{title}</span>
          </div>
        )}
        {message && (
          <div className={cn('text-sm break-words text-primary', TEXT_DIRECTION)}>{children}</div>
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
  /**
   * Default: by the tone (`alertRole`). 'status' for a banner that marks a state shown when the
   * page opens — a cancelled document — which must not interrupt even in the danger tone.
   */
  role?: 'alert' | 'status'
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
  role,
}: BannerProps) {
  const look = TONES[tone]
  const Icon = icon ?? look.icon
  return (
    <div
      role={role ?? alertRole(tone)}
      data-tone={tone}
      className={cn(
        // Border-box: full width with its padding and border, in an application without a reset
        // (P4.1: it was 34px wider than its container).
        'box-border flex w-full flex-wrap items-center gap-x-4 gap-y-2.5 rounded-md border border-solid border-transparent font-sans',
        ONE_LINE,
        look.box,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('flex size-5 shrink-0 items-center', look.fg)}>
        <Icon className="size-5" />
      </span>
      <p className={cn('m-0 min-w-0 flex-1 text-sm break-words text-primary', TEXT_DIRECTION)}>
        {title !== undefined && <strong className={cn('font-bold', look.fg)}>{title} </strong>}
        {children}
      </p>
      {actions !== undefined && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      {onClose !== undefined && <CloseButton onClose={onClose} fg={look.fg} />}
    </div>
  )
}

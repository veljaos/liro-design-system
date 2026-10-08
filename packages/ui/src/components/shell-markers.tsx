import {
  CircleAlert,
  CloudCheck,
  HardDrive,
  LogOut,
  RotateCcw,
  UserCog,
  WifiOff,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { minutesLeft, untilNextMinute, type ConnectionStatus } from './shell-markers-logic'
import { StatusBadge, type Tone } from './status-badge'
import { usePhone } from './use-phone'

export { CONNECTION_STATUSES, minutesLeft, untilNextMinute } from './shell-markers-logic'
export type { ConnectionStatus } from './shell-markers-logic'

/*
 * Connection, environment and session markers (BUILD-PLAN P5.3; docs/decisions.md "Shell
 * markers"). The shell's slots (AppShell `impersonationBar`, `environmentMarker`,
 * `offlineIndicator`) take them; ConnectionState stands beside a draft's actions.
 *
 * - The two bars are strips across the screen, aligned with the header's content: 8px by 24px
 *   (16px on phones), 13px text, one line that wraps on a narrow screen, a 1px line under them.
 *   They are not Banners: a Banner (16px padding, radius md) is a message in a page; these are
 *   part of the shell and must cost as little height as possible while they stay.
 * - ImpersonationBar: the warning tone (status.warning bg, its fg for the icon and the lead),
 *   never dismissible, above the header and sticky with it. Whose account (lead, semibold), the
 *   mode, the reason and the minutes left, then "Exit" at the end.
 * - OfflineIndicator: the neutral tone (status.neutral bg with its border, as the neutral
 *   Banner), under the header, while offline only; what is waiting is the application's text.
 *   Going offline and coming back are announced politely ("Offline", "Back online").
 * - EnvironmentMarker: a bordered StatusBadge after the brand, in a tone that is never blue
 *   (warning by default); the name is read with "Environment:" before it.
 * - ConnectionState: 12px text with a 14px icon in a `role="status"`: saved on this device, sending,
 *   sent, or not sent with "Send again".
 */

/** Strip padding: 8px top and bottom; the header's side padding (16px phones, 24px desktop). */
function stripPadding(phone: boolean): string {
  return phone
    ? 'py-2 ps-[max(16px,env(safe-area-inset-left))] pe-[max(16px,env(safe-area-inset-right))]'
    : 'px-6 py-2'
}

/** Mantine Button 'xs' (30px, 14px padding, 12px text), as the bars' other small buttons. */
const SMALL = 'min-h-control-sm gap-2 px-3.5 text-xs'

function usePhoneLayout(layout: 'desktop' | 'phone' | undefined): boolean {
  const viewportPhone = usePhone()
  return layout === undefined ? viewportPhone : layout === 'phone'
}

/** The time it is now, redrawn when the minutes left until `endsAt` change. */
function useNowUntil(endsAt: string | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt === undefined) return
    const wait = untilNextMinute(endsAt, Date.now())
    if (wait === null) return
    // A few milliseconds after the change, so the new minute is surely reached.
    const timer = window.setTimeout(() => {
      setNow(Date.now())
    }, wait + 20)
    return () => {
      window.clearTimeout(timer)
    }
  }, [endsAt, now])
  return now
}

export interface ImpersonationBarProps {
  /** Whose account is being used, from the application ("Milica Petrović"). */
  person: string
  /** How, from the application ("Read-only", "Full access"). */
  mode?: string
  /** Why, from the application ("Support request 4821"). */
  reason?: string
  /**
   * When the session ends, an instant (ISO 8601 with its offset). The bar shows the whole minutes
   * left (rounded up), redrawn as each minute passes; ending the session is the Core's.
   */
  endsAt?: string
  /** Ends the session: the "Exit" button. */
  onExit: () => void
  /** The exit button's label. Default: `messages['impersonation.exit']`. */
  exitLabel?: string
  /** 'phone' forces the phone padding; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/**
 * A session in someone else's account (support, an accountant for a client): never dismissible,
 * always above the header, with the way out at its end.
 */
export function ImpersonationBar(props: ImpersonationBarProps) {
  const { messages, format } = useLiro()
  const phone = usePhoneLayout(props.layout)
  const now = useNowUntil(props.endsAt)
  const minutes = props.endsAt === undefined ? null : minutesLeft(props.endsAt, now)
  const parts: { key: string; text: string }[] = []
  if (props.mode !== undefined) parts.push({ key: 'mode', text: props.mode })
  if (props.reason !== undefined) {
    parts.push({ key: 'reason', text: messages['impersonation.reason'](props.reason) })
  }
  if (minutes !== null) {
    parts.push({
      key: 'time',
      text:
        minutes === 0
          ? messages['impersonation.ended']
          : messages['impersonation.minutesLeft'](minutes, format.number(String(minutes))),
    })
  }
  return (
    <section
      aria-label={messages['impersonation.region']}
      data-slot="impersonation-bar"
      className={cn(
        'box-border flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-0 border-b border-solid border-status-warning-border bg-status-warning-bg font-sans text-sm text-primary',
        stripPadding(phone),
        props.className,
      )}
    >
      <p className="m-0 flex min-w-0 flex-1 items-start gap-2">
        <UserCog aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-status-warning-fg" />
        <span className="min-w-0">
          <strong className={cn('font-semibold text-status-warning-fg', TEXT_DIRECTION)}>
            {messages['impersonation.viewingAs'](props.person)}
          </strong>
          {parts.map((part) => (
            <span key={part.key} data-part={part.key}>
              <span aria-hidden="true" className="px-2 text-secondary">
                ·
              </span>
              <span className={cn('inline', TEXT_DIRECTION)}>{part.text}</span>
            </span>
          ))}
        </span>
      </p>
      <ButtonPrimitive
        family="neutral"
        emphasis="secondary"
        className={cn(SMALL, 'shrink-0')}
        onClick={props.onExit}
      >
        <LogOut aria-hidden="true" className="size-3 shrink-0 rtl:-scale-x-100" />
        <span className={TEXT_DIRECTION}>{props.exitLabel ?? messages['impersonation.exit']}</span>
      </ButtonPrimitive>
    </section>
  )
}

export interface OfflineIndicatorProps {
  /** Whether the application is offline now. While false nothing is shown. */
  offline: boolean
  /**
   * What is waiting, written by the application with its own count and words ("3 changes are kept
   * on this device and sent when the connection returns.").
   */
  waiting?: ReactNode
  /** One action at the end, from the application (a small Button: "Try now"). */
  action?: ReactNode
  /** 'phone' forces the phone padding; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** How long "Back online" stays in the live region (read, then removed from the page). */
const ONLINE_ANNOUNCEMENT = 5_000

/**
 * The connection is lost: a strip under the header for as long as it lasts, saying so and what is
 * waiting. When the connection returns the strip goes without a trace, and assistive technology
 * hears "Back online" once.
 */
export function OfflineIndicator(props: OfflineIndicatorProps) {
  const { messages } = useLiro()
  const phone = usePhoneLayout(props.layout)
  // What the live region says follows the changes of `offline` (stored from the last render, as
  // React's "storing information from previous renders"): nothing on a page that starts online.
  const [last, setLast] = useState(props.offline)
  const [announcement, setAnnouncement] = useState<'offline' | 'online' | null>(
    props.offline ? 'offline' : null,
  )
  if (last !== props.offline) {
    setLast(props.offline)
    setAnnouncement(props.offline ? 'offline' : 'online')
  }
  useEffect(() => {
    if (announcement !== 'online') return
    const timer = window.setTimeout(() => {
      setAnnouncement(null)
    }, ONLINE_ANNOUNCEMENT)
    return () => {
      window.clearTimeout(timer)
    }
  }, [announcement])
  return (
    <div data-slot="offline-indicator" className={props.offline ? undefined : 'contents'}>
      {/* Always in the page, so its changes are announced; read once, never shown. */}
      <div role="status" className="sr-only">
        {announcement === 'offline' && messages['connection.offline']}
        {announcement === 'online' && messages['connection.online']}
      </div>
      {props.offline && (
        <div
          className={cn(
            'box-border flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-0 border-b border-solid border-status-neutral-border bg-status-neutral-bg font-sans text-sm text-primary',
            stripPadding(phone),
            props.className,
          )}
        >
          <p className="m-0 flex min-w-0 flex-1 items-start gap-2">
            <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-status-neutral-fg" />
            <span className="min-w-0">
              <strong className={cn('font-semibold', TEXT_DIRECTION)}>
                {messages['connection.offline']}
              </strong>
              {props.waiting !== undefined && (
                <>
                  <span aria-hidden="true" className="px-2 text-secondary">
                    ·
                  </span>
                  <span className={TEXT_DIRECTION}>{props.waiting}</span>
                </>
              )}
            </span>
          </p>
          {props.action !== undefined && <div className="flex shrink-0">{props.action}</div>}
        </div>
      )}
    </div>
  )
}

/** The tones an environment can take: never blue (D17). */
export type EnvironmentTone = Exclude<Tone, 'info'>

export interface EnvironmentMarkerProps {
  /** The environment's name, from the application ("Sandbox", "Demo", "Test"). */
  label: string
  /** Default: 'warning' (the data are not real: take care). Never blue. */
  tone?: EnvironmentTone
}

/**
 * Which environment this is, when it is not the real one: a bordered badge after the brand in the
 * header, on phones too. Production shows no marker.
 */
export function EnvironmentMarker({ label, tone = 'warning' }: EnvironmentMarkerProps) {
  const { messages } = useLiro()
  return (
    <span data-slot="environment-marker" className="inline-flex shrink-0 whitespace-nowrap">
      <span className="sr-only">{messages['environment.prefix']} </span>
      <StatusBadge label={label} tone={tone} withBorder />
    </span>
  )
}

export interface ConnectionStateProps {
  /** Where the draft is: only on this device, being sent, sent, or sending failed. */
  status: ConnectionStatus
  /**
   * When it was saved ('local') or sent ('sent'): an instant in the tenant's offset, shown as its
   * clock time (`format.time`).
   */
  at?: string
  /** Sends again after a failure: the "Send again" button. Without it, no button. */
  onRetry?: () => void
  className?: string
}

const CONNECTION_LOOK: Record<ConnectionStatus, string> = {
  local: 'text-secondary',
  sending: 'text-secondary',
  sent: 'text-secondary',
  failed: 'text-status-danger-fg',
}

/**
 * Where a draft is, beside its actions: saved on this device, sending, sent, or not sent with a
 * way to send it again. Small and quiet; read politely when it changes.
 */
export function ConnectionState({ status, at, onRetry, className }: ConnectionStateProps) {
  const { messages, format } = useLiro()
  const time = at === undefined ? null : format.time(at)
  const text =
    status === 'local'
      ? messages['connection.local'](time)
      : status === 'sending'
        ? messages['connection.sending']
        : status === 'sent'
          ? messages['connection.sent'](time)
          : messages['connection.failed']
  return (
    <span
      data-slot="connection-state"
      data-status={status}
      className={cn('inline-flex flex-wrap items-center gap-x-3 gap-y-1 font-sans', className)}
    >
      <span
        role="status"
        className={cn('inline-flex min-w-0 items-start gap-1.5 text-xs', CONNECTION_LOOK[status])}
      >
        <span aria-hidden="true" className="flex h-[1lh] shrink-0 items-center">
          {status === 'local' && <HardDrive className="size-3.5" />}
          {status === 'sending' && (
            // The Spinner's ring at its small size (the Spinner itself is a status of its own).
            <span className="box-border inline-block size-3.5 animate-liro-spin rounded-full border-[1.75px] border-solid border-brand border-s-transparent motion-reduce:animate-none" />
          )}
          {status === 'sent' && <CloudCheck className="size-3.5 text-status-success-fg" />}
          {status === 'failed' && <CircleAlert className="size-3.5" />}
        </span>
        <span className={TEXT_DIRECTION}>{text}</span>
      </span>
      {status === 'failed' && onRetry !== undefined && (
        <ButtonPrimitive
          family="neutral"
          emphasis="secondary"
          className={cn(SMALL, 'shrink-0')}
          onClick={onRetry}
        >
          <RotateCcw aria-hidden="true" className="size-3 shrink-0" />
          <span className={TEXT_DIRECTION}>{messages['connection.retry']}</span>
        </ButtonPrimitive>
      )}
    </span>
  )
}

import { LogOut, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { instantText } from './admin-logic'
import { StatusBadge } from './status-badge'

/*
 * SessionList (BUILD-PLAN P5.6): the devices signed in to the person's account.
 * - Rows divided by lines (no cards inside the card the application puts it in, P4.9): the
 *   device kind's icon (Monitor, Smartphone, Tablet: it says which device), the device as the
 *   Core names it ("Chrome on Windows") in sm semibold, "This device" as a neutral badge on the
 *   current one; under it in xs text.secondary the place and the last activity ("Active now" for
 *   this device, else "Last active 06.10.2026. 09:42": the instant's own date and time through
 *   `format`, P4.9). Text from the Core (device, place, address) is shown as given.
 * - Each other device has "Sign out" (neutral, small, named with the device); while the Core
 *   works (`onRevoke` returns a promise) the button shows it and cannot be pressed again. The
 *   current device has none: signing out here is the user menu's.
 * - `extraAction` is a slot per row, before Sign out: the application's "This wasn't me" (a
 *   link to its security flow), or anything else it needs.
 * - "Sign out all other devices" under the list when there are any and `onRevokeOthers` is
 *   given. Loading: skeleton rows. Only this device: a line saying no other device is in.
 */

/** A signed-in device, from the Core. */
export interface SessionItem {
  id: string
  /** The browser and system as the Core names them: "Chrome on Windows". */
  device: string
  /** Which icon: a computer (default), a phone or a tablet. */
  kind?: 'desktop' | 'phone' | 'tablet'
  /** Where, as the Core resolves it: "Novi Sad, Serbia". */
  place?: string
  /** The network address, when the application shows it. Left to right. */
  address?: string
  /** The last activity: an ISO instant in the tenant's offset. */
  lastActive: string
  /** The device this page is open on. */
  current?: boolean
}

export interface SessionListProps {
  sessions: readonly SessionItem[]
  /** Names the list for assistive technology, from the application ("Signed-in devices"). */
  label: string
  /** Ends a session; a returned promise keeps its button busy until it settles. */
  onRevoke?: (session: SessionItem) => void | Promise<void>
  /** Ends every other session (the button under the list). */
  onRevokeOthers?: () => void | Promise<void>
  /** A slot per row before Sign out: the application's "This wasn't me". */
  extraAction?: (session: SessionItem) => ReactNode
  /** Skeleton rows while the sessions load. */
  loading?: boolean
  /** Every action unavailable (e.g. a read-only view by an administrator). */
  readOnly?: boolean
  className?: string
}

const ICONS = { desktop: Monitor, phone: Smartphone, tablet: Tablet } as const

/** Mantine Button 'xs' (30px), neutral "default". */
const SMALL = 'min-h-control-sm gap-2 px-3.5 text-xs'

/** The devices signed in to the account: each with its place and last activity, and Sign out. */
export function SessionList(props: SessionListProps) {
  const { messages, format } = useLiro()
  const [pending, setPending] = useState<readonly string[]>([])
  const run = (key: string, action: () => void | Promise<void>) => {
    const result = action()
    if (!(result instanceof Promise)) return
    setPending((list) => [...list, key])
    const done = () => {
      setPending((list) => list.filter((each) => each !== key))
    }
    result.then(done, done)
  }

  if (props.loading === true) {
    return (
      <ul
        aria-busy="true"
        aria-label={props.label}
        className={cn('m-0 list-none p-0', props.className)}
      >
        {[0, 1, 2].map((index) => (
          <li
            key={index}
            className="flex items-center gap-3 border-0 border-b border-solid border-subtle py-3 last:border-b-0"
          >
            <Skeleton className="size-5 rounded-sm" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-48 max-w-full" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const others = props.sessions.filter((session) => session.current !== true)
  const editable = props.readOnly !== true
  return (
    <div data-slot="session-list" className={cn('flex flex-col', props.className)}>
      <ul aria-label={props.label} className="m-0 list-none p-0">
        {props.sessions.map((session) => {
          const Icon = ICONS[session.kind ?? 'desktop']
          const current = session.current === true
          const busy = pending.includes(session.id)
          const extra = props.extraAction?.(session)
          const details = [
            session.place,
            session.address,
            current
              ? messages['session.activeNow']
              : messages['session.lastActive'](instantText(format, session.lastActive)),
          ].filter((part) => part !== undefined)
          return (
            <li
              key={session.id}
              {...(current ? { 'aria-current': 'true' as const } : {})}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-0 border-b border-solid border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0 self-start text-secondary" />
              <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                    {session.device}
                  </span>
                  {current && <StatusBadge label={messages['session.thisDevice']} tone="neutral" />}
                </span>
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  {details.map((part, index) => (
                    <span key={index}>
                      {index > 0 && ' · '}
                      {part === session.address ? <bdi dir="ltr">{part}</bdi> : part}
                    </span>
                  ))}
                </span>
              </div>
              {editable && (extra !== undefined || (!current && props.onRevoke !== undefined)) && (
                <div className="ms-auto flex flex-wrap items-center gap-2">
                  {extra}
                  {!current && props.onRevoke !== undefined && (
                    <ButtonPrimitive
                      family="neutral"
                      emphasis="secondary"
                      aria-label={messages['session.revokeNamed'](session.device)}
                      aria-disabled={busy || undefined}
                      aria-busy={busy || undefined}
                      onClick={() => {
                        if (busy) return
                        const revoke = props.onRevoke
                        if (revoke !== undefined) run(session.id, () => revoke(session))
                      }}
                      className={SMALL}
                    >
                      <LogOut aria-hidden="true" className="size-3.5 shrink-0 rtl:-scale-x-100" />
                      <span className={TEXT_DIRECTION}>{messages['session.revoke']}</span>
                    </ButtonPrimitive>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {others.length === 0 && (
        <p className={cn('m-0 mt-3 text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['session.noOthers']}
        </p>
      )}
      {editable && others.length > 0 && props.onRevokeOthers !== undefined && (
        <div className="mt-4 flex">
          <ButtonPrimitive
            family="neutral"
            emphasis="secondary"
            aria-disabled={pending.includes('*') || undefined}
            aria-busy={pending.includes('*') || undefined}
            onClick={() => {
              const revokeOthers = props.onRevokeOthers
              if (!pending.includes('*') && revokeOthers !== undefined) run('*', revokeOthers)
            }}
          >
            <LogOut aria-hidden="true" className="size-3.75 shrink-0 rtl:-scale-x-100" />
            <span className={TEXT_DIRECTION}>{messages['session.revokeOthers']}</span>
          </ButtonPrimitive>
        </div>
      )}
    </div>
  )
}

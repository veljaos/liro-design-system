import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { toast, Toaster as SonnerToaster } from 'sonner'
import { buttonClassName, BUTTON_SHAPES } from '../primitives/button'
import { cn } from '../primitives/cn'
import { TEXT_DIRECTION } from '../primitives/classes'
import { useLiro } from '../provider/liro-provider'
import type { Family, IconComponent } from './intents'

/*
 * Toasts (BUILD-PLAN P2.5): the previous Design System's `notice` API, carried over exactly
 * (owner's decision, 2026-09-28, docs/decisions.md "Feedback"), on sonner (BUILD-PLAN section 3):
 * - Kinds success, info, warning, error and loading; `update(id, …)` turns a loading toast into
 *   success, warning or error. A title is optional, the message required.
 * - Bottom right (bottom left in right-to-left), at most 4 visible.
 * - Radius md, with a border; an 18px icon, coloured by family: success positive (CircleCheck,
 *   lucide's CheckCircle2), info primary (Info), warning caution (TriangleAlert), error destructive
 *   (CircleX). Loading: the primary colour, a loader, no close button.
 * - Closes by itself after 3500ms (success), 4000ms (info), 6000ms (warning); an error and a
 *   loading toast stay until closed or updated (Appendix B.8: success disappears, errors wait).
 *
 * The rest is Mantine 9.6.2 Notification and @mantine/notifications: the raised overlay surface
 * with a 1px border.default border and shadow lg; padding 10px, 22px at the start; the icon in a
 * 28px circle of the colour, 16px before the text; title 13px weight 600, the message 13px (the
 * secondary colour under a title); a 28px close button; 440px wide, 16px from the corner and
 * 16px apart.
 */

/** The kinds of a toast. */
export type NoticeKind = 'success' | 'info' | 'warning' | 'error' | 'loading'

interface KindLook {
  family: Family
  icon: IconComponent | null
  /** Milliseconds before it closes by itself; Infinity: it waits. */
  duration: number
}

const KINDS: Record<NoticeKind, KindLook> = {
  success: { family: 'positive', icon: CircleCheck, duration: 3500 },
  info: { family: 'primary', icon: Info, duration: 4000 },
  warning: { family: 'caution', icon: TriangleAlert, duration: 6000 },
  error: { family: 'destructive', icon: CircleX, duration: Infinity },
  loading: { family: 'primary', icon: null, duration: Infinity },
}

/** The icon circle's colour; literal classes, so Tailwind finds them. */
const CIRCLE: Record<Family, string> = {
  primary: 'bg-family-primary-solid',
  verify: 'bg-family-verify-solid',
  document: 'bg-family-document-solid',
  positive: 'bg-family-positive-solid',
  destructive: 'bg-family-destructive-solid',
  caution: 'bg-family-caution-solid',
  neutral: 'bg-family-neutral-solid',
}

/** How long a kind stays; exported for its test. */
export function noticeDuration(kind: NoticeKind): number {
  return KINDS[kind].duration
}

interface NoticeViewProps {
  id: string | number
  kind: NoticeKind
  message: ReactNode
  title?: ReactNode
}

/** One toast (Mantine Notification with an icon). Exported for the stories, not from the package. */
export function NoticeView({ id, kind, message, title }: NoticeViewProps) {
  const { messages } = useLiro()
  const look = KINDS[kind]
  const Icon = look.icon
  const hasTitle = title !== undefined && title !== null
  return (
    <div
      // Errors and warnings interrupt; the others are announced politely (sonner's live region).
      role={kind === 'error' || kind === 'warning' ? 'alert' : 'status'}
      data-kind={kind}
      className="relative box-border flex w-(--width) max-w-full items-center overflow-hidden rounded-md border border-solid border-default bg-surface-overlay py-2.5 ps-[22px] pe-2.5 font-sans text-primary shadow-lg"
    >
      {Icon === null ? (
        // Mantine's oval loader, 28px, in the primary colour.
        <span
          aria-hidden="true"
          className="me-4 box-border size-7 shrink-0 animate-liro-spin rounded-full border-[3.5px] border-solid border-brand border-s-transparent"
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'me-4 flex size-7 shrink-0 items-center justify-center rounded-full text-on-accent',
            CIRCLE[look.family],
          )}
        >
          <Icon className="size-4.5" />
        </span>
      )}
      <div className="me-2.5 min-w-0 flex-1">
        {hasTitle && (
          <p className={cn('m-0 mb-0.5 text-sm font-semibold break-words', TEXT_DIRECTION)}>
            {title}
          </p>
        )}
        <p className={cn('m-0 text-sm break-words', TEXT_DIRECTION, hasTitle && 'text-secondary')}>
          {message}
        </p>
      </div>
      {kind !== 'loading' && (
        <button
          type="button"
          aria-label={messages['notice.close']}
          title={messages['notice.close']}
          className={buttonClassName({ family: 'neutral', emphasis: 'menu', shape: 'compact' })}
          onClick={() => {
            toast.dismiss(id)
          }}
        >
          <X aria-hidden="true" className={BUTTON_SHAPES.compact.icon} />
        </button>
      )}
    </div>
  )
}

export interface NoticeOptions {
  /** A title over the message. From the application. */
  title?: ReactNode
  /** The toast to replace; by default a new one. */
  id?: string | number
}

function show(kind: NoticeKind, message: ReactNode, options: NoticeOptions = {}) {
  return toast.custom(
    (id) => (
      <NoticeView
        id={id}
        kind={kind}
        message={message}
        {...(options.title === undefined ? {} : { title: options.title })}
      />
    ),
    {
      duration: KINDS[kind].duration,
      ...(options.id === undefined ? {} : { id: options.id }),
    },
  )
}

/**
 * Shows toasts in the `Toaster`. Each call returns the toast's id. `loading` stays until
 * `update(id, kind, message)` turns it into success, warning or error.
 */
export const notice = {
  success: (message: ReactNode, options?: NoticeOptions) => show('success', message, options),
  info: (message: ReactNode, options?: NoticeOptions) => show('info', message, options),
  warning: (message: ReactNode, options?: NoticeOptions) => show('warning', message, options),
  error: (message: ReactNode, options?: NoticeOptions) => show('error', message, options),
  loading: (message: ReactNode, options?: NoticeOptions) => show('loading', message, options),
  /** Turns a toast (usually a loading one) into another kind, with that kind's look and time. */
  update: (
    id: string | number,
    kind: Exclude<NoticeKind, 'loading'>,
    message: ReactNode,
    options: Omit<NoticeOptions, 'id'> = {},
  ) => show(kind, message, { ...options, id }),
  /** Closes a toast, or all of them. */
  dismiss: (id?: string | number) => toast.dismiss(id),
}

/**
 * Where toasts appear: place it once, inside LiroProvider (usually beside the application's
 * layout). Bottom right, bottom left in right-to-left; at most 4 visible.
 */
export function Toaster() {
  const { direction, messages } = useLiro()
  const style = {
    '--width': '440px',
    zIndex: 'var(--liro-layer-toast)',
  } as CSSProperties
  return (
    <SonnerToaster
      position={direction === 'rtl' ? 'bottom-left' : 'bottom-right'}
      dir={direction}
      visibleToasts={4}
      expand
      gap={16}
      offset={16}
      mobileOffset={16}
      containerAriaLabel={messages['notice.region']}
      toastOptions={{ unstyled: true }}
      style={style}
    />
  )
}

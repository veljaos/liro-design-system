import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { toast, Toaster as SonnerToaster } from 'sonner'
import { buttonClassName, BUTTON_SHAPES } from '../primitives/button'
import { cn } from '../primitives/cn'
import { TEXT_DIRECTION } from '../primitives/classes'
import { useLiro } from '../provider/liro-provider'
import { usePhone } from './use-phone'
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
 * - `action` (P4.9, the owner's review: "Approved. Undo"): one small neutral button before the
 *   close button, from the application (Undo, only when the Core allows it); pressing it runs the
 *   action and closes the toast. A toast with an action stays at least 8000ms, so there is time to
 *   reach it (sonner also pauses while the pointer or the focus is on it).
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

/** A toast with an action stays at least this long (milliseconds). */
export const NOTICE_ACTION_DURATION = 8000

/** How long a kind stays, with or without an action; exported for its test. */
export function noticeDuration(kind: NoticeKind, withAction = false): number {
  const duration = KINDS[kind].duration
  return withAction ? Math.max(duration, NOTICE_ACTION_DURATION) : duration
}

/** The one action of a toast (Undo), from the application. */
export interface NoticeAction {
  label: string
  onClick: () => void
}

interface NoticeViewProps {
  id: string | number
  kind: NoticeKind
  message: ReactNode
  title?: ReactNode
  action?: NoticeAction
}

/** One toast (Mantine Notification with an icon). Exported for the stories, not from the package. */
export function NoticeView({ id, kind, message, title, action }: NoticeViewProps) {
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
      {action !== undefined && (
        <button
          type="button"
          className={cn(
            buttonClassName({ family: 'neutral', emphasis: 'secondary', shape: 'text' }),
            'me-1 min-h-control-sm shrink-0 px-3 text-xs',
          )}
          onClick={() => {
            action.onClick()
            toast.dismiss(id)
          }}
        >
          <span className={TEXT_DIRECTION}>{action.label}</span>
        </button>
      )}
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
  /** One action before the close button (Undo), only when the application can carry it out. */
  action?: NoticeAction
}

function show(kind: NoticeKind, message: ReactNode, options: NoticeOptions = {}) {
  return toast.custom(
    (id) => (
      <NoticeView
        id={id}
        kind={kind}
        message={message}
        {...(options.title === undefined ? {} : { title: options.title })}
        {...(options.action === undefined ? {} : { action: options.action })}
      />
    ),
    {
      duration: noticeDuration(kind, options.action !== undefined),
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

export interface ToasterProps {
  /**
   * 'phone': full width with 16px (md) margins at both sides; 'desktop': 440px at the bottom end.
   * Default by the viewport (48em), as AppShell's.
   */
  layout?: 'desktop' | 'phone'
}

/**
 * Where toasts appear: place it once, inside LiroProvider (usually beside the application's
 * layout). Bottom right, bottom left in right-to-left; at most 4 visible. Toasts stand 16px above
 * the AppShell's bottom action bar on phones and WorklistPage's detail bar (`--liro-shell-bottom`),
 * never over their actions.
 */
export function Toaster({ layout }: ToasterProps = {}) {
  const { direction, messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = layout === undefined ? viewportPhone : layout === 'phone'
  // On phones the toasts span the screen less two 16px margins (P4.9d: a 440px toast in a 390px
  // frame was cut at the start side). Sonner sizes its list and each toast with --width, so the
  // screen's width is measured by an empty fixed line across it (the viewport, or a frame that
  // contains fixed elements, as a story's phone frame does).
  const [span, setSpan] = useState<HTMLSpanElement | null>(null)
  const [screenWidth, setScreenWidth] = useState<number | undefined>(undefined)
  useEffect(() => {
    if (span === null) return
    const measure = () => {
      setScreenWidth(span.offsetWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(span)
    return () => {
      observer.disconnect()
    }
  }, [span])
  const phoneWidth =
    screenWidth === undefined ? 'calc(100vw - 32px)' : `${String(screenWidth - 32)}px`
  const style = {
    '--width': phone ? phoneWidth : '440px',
    zIndex: 'var(--liro-layer-toast)',
  } as CSSProperties
  const bottom = 'calc(16px + var(--liro-shell-bottom, 0px))'
  const offset = { top: '16px', bottom, left: '16px', right: '16px' }
  return (
    <>
      {phone && (
        <span
          ref={setSpan}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 bottom-0 h-0"
        />
      )}
      <SonnerToaster
        position={direction === 'rtl' ? 'bottom-left' : 'bottom-right'}
        dir={direction}
        visibleToasts={4}
        expand
        gap={16}
        offset={offset}
        mobileOffset={offset}
        containerAriaLabel={messages['notice.region']}
        toastOptions={{ unstyled: true }}
        style={style}
      />
    </>
  )
}

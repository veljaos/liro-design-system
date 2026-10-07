import {
  Ban,
  Construction,
  CreditCard,
  FileQuestionMark,
  Lock,
  LogIn,
  ServerCrash,
  type LucideIcon,
} from 'lucide-react'
import type { MouseEventHandler, ReactNode } from 'react'
import { BrandLockup, type BrandLockupProps } from '../components/brand-lockup'
import { ButtonPrimitive, buttonClassName } from '../primitives/button'
import { TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'

/*
 * StatusPage (P4.7, the owner's values, docs/decisions.md "Status pages and AuthShell"): the
 * pages for 401, 402, 403, 404, 500, maintenance and a suspended account — the one place where
 * centring is right.
 * - Full height on the raised surface; a centred column at most 440px wide, 24px (lg) apart:
 *   the large lockup (24px), an 84 × 84px square (radius xl) filled with the tone's solid colour
 *   with a 36px icon (stroke 1.75) in text.onAccent, an optional short line above the title (sm,
 *   bold, the brand face, never upper case: by default the bare HTTP code), the title (h2 size),
 *   the description (sm, text.secondary), the case number for an error, then up to two
 *   full-width buttons in a column at most 280px wide: the main one filled, the other default.
 * - Tone and icon by kind (owner): 401 warning LogIn, 402 warning CreditCard, 403 warning Lock,
 *   404 neutral FileQuestionMark, 500 danger ServerCrash, maintenance warning Construction,
 *   suspended danger Ban. Blue never fills a large surface (D17).
 * - Titles and descriptions default to `messages` (the Core translates them); the application
 *   may pass its own. No logo inside (D18): the lockup's names come through `brand`.
 */

export type StatusKind =
  | 'unauthenticated'
  | 'planRequired'
  | 'forbidden'
  | 'notFound'
  | 'error'
  | 'maintenance'
  | 'suspended'

export const STATUS_KINDS: readonly StatusKind[] = [
  'unauthenticated',
  'planRequired',
  'forbidden',
  'notFound',
  'error',
  'maintenance',
  'suspended',
]

type Tone = 'warning' | 'neutral' | 'danger'

interface KindLook {
  tone: Tone
  icon: LucideIcon
  /** The HTTP code shown above the title by default; none for maintenance and suspension. */
  code?: string
}

const KIND_LOOK: Record<StatusKind, KindLook> = {
  unauthenticated: { tone: 'warning', icon: LogIn, code: '401' },
  planRequired: { tone: 'warning', icon: CreditCard, code: '402' },
  forbidden: { tone: 'warning', icon: Lock, code: '403' },
  notFound: { tone: 'neutral', icon: FileQuestionMark, code: '404' },
  error: { tone: 'danger', icon: ServerCrash, code: '500' },
  maintenance: { tone: 'warning', icon: Construction },
  suspended: { tone: 'danger', icon: Ban },
}

/** Every class written out, so Tailwind finds it. */
const TONE_FILL: Record<Tone, string> = {
  warning: 'bg-status-warning-solid',
  neutral: 'bg-status-neutral-solid',
  danger: 'bg-status-danger-solid',
}

/** The tone and icon of a kind, and the code shown above its title by default. */
export function statusLook(kind: StatusKind): Readonly<KindLook> {
  return KIND_LOOK[kind]
}

/** One button of a status page: a link when it has `href`, else a button. */
export interface StatusAction {
  label: string
  href?: string
  onClick?: MouseEventHandler<HTMLElement>
  icon?: LucideIcon
}

export interface StatusPageProps {
  kind: StatusKind
  /** The lockup's names and home link; always shown large (24px). */
  brand: Omit<BrandLockupProps, 'size' | 'className'>
  /** Default: the kind's title from `messages`. */
  title?: string
  /** Default: the kind's description from `messages`. */
  description?: ReactNode
  /**
   * The short line above the title. Default: the kind's HTTP code ("404"); none for maintenance
   * and suspension. `null` removes it.
   */
  eyebrow?: string | null
  /** The case number the application received for the failure, so the user can quote it. */
  caseId?: string
  /** The main action, filled ("Sign in", "Try again"). */
  primaryAction?: StatusAction
  /** A second action in the default look ("Go to home page"). */
  secondaryAction?: StatusAction
  className?: string
}

const TITLES: Record<StatusKind, [keyof LiroMessages, keyof LiroMessages]> = {
  unauthenticated: ['status.unauthenticatedTitle', 'status.unauthenticatedDescription'],
  planRequired: ['status.planRequiredTitle', 'status.planRequiredDescription'],
  forbidden: ['status.forbiddenTitle', 'status.forbiddenDescription'],
  notFound: ['status.notFoundTitle', 'status.notFoundDescription'],
  error: ['status.errorTitle', 'status.errorDescription'],
  maintenance: ['status.maintenanceTitle', 'status.maintenanceDescription'],
  suspended: ['status.suspendedTitle', 'status.suspendedDescription'],
}

/**
 * A link drawn as a button keeps its colours in every link state (P4.4): `enabled:` hovers do
 * not apply to links, so they are written for the link.
 */
const LINK_STATES = {
  primary:
    'no-underline visited:text-on-accent hover:text-on-accent hover:bg-family-primary-solid-hover active:bg-family-primary-solid-active',
  secondary:
    'no-underline visited:text-family-neutral-fg hover:bg-surface-hover hover:text-family-neutral-fg-hover',
} as const

function ActionButton({ action, main }: { action: StatusAction; main: boolean }) {
  const { linkComponent: Link } = useLiro()
  const look = main
    ? ({ family: 'primary', emphasis: 'primary' } as const)
    : ({ family: 'neutral', emphasis: 'secondary' } as const)
  const Icon = action.icon
  const content = (
    <>
      {Icon !== undefined && <Icon aria-hidden="true" className="size-3.75 shrink-0" />}
      <span className={TEXT_ISOLATE}>{action.label}</span>
    </>
  )
  if (action.href !== undefined) {
    return (
      <Link
        href={action.href}
        {...(action.onClick === undefined ? {} : { onClick: action.onClick })}
        className={cn(
          buttonClassName({ ...look, shape: 'text' }),
          'w-full',
          LINK_STATES[main ? 'primary' : 'secondary'],
        )}
      >
        {content}
      </Link>
    )
  }
  return (
    <ButtonPrimitive
      {...look}
      className="w-full"
      {...(action.onClick === undefined ? {} : { onClick: action.onClick })}
    >
      {content}
    </ButtonPrimitive>
  )
}

/** A full page that says why the application cannot be used here, and what to do. */
export function StatusPage(props: StatusPageProps) {
  const { messages } = useLiro()
  const look = KIND_LOOK[props.kind]
  const Icon = look.icon
  const [titleKey, descriptionKey] = TITLES[props.kind]
  const title = props.title ?? (messages[titleKey] as string)
  const description = props.description ?? (messages[descriptionKey] as string)
  const eyebrow = props.eyebrow === undefined ? look.code : props.eyebrow
  const hasActions = props.primaryAction !== undefined || props.secondaryAction !== undefined
  return (
    <main
      data-slot="status-page"
      data-kind={props.kind}
      className={cn(
        'box-border flex min-h-dvh w-full flex-col items-center justify-center bg-surface-raised px-4 py-12 font-sans',
        props.className,
      )}
    >
      <div className="flex w-full max-w-110 flex-col items-center gap-6 text-center">
        <BrandLockup {...props.brand} size="lg" />
        <div
          aria-hidden="true"
          className={cn(
            'flex size-21 shrink-0 items-center justify-center rounded-xl text-on-accent',
            TONE_FILL[look.tone],
          )}
        >
          <Icon className="size-9" strokeWidth={1.75} />
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          {eyebrow !== undefined && eyebrow !== null && eyebrow !== '' && (
            <p className={cn('m-0 font-brand text-sm font-bold text-secondary', TEXT_ISOLATE)}>
              {eyebrow}
            </p>
          )}
          {/* The page's only heading, so an h1, drawn in the h2 size (owner). */}
          <h1 className={cn('m-0 text-h2 text-primary', TEXT_ISOLATE)}>{title}</h1>
          <p className={cn('m-0 text-sm text-secondary', TEXT_ISOLATE)}>{description}</p>
          {props.caseId !== undefined && (
            <p className={cn('m-0 text-xs text-secondary', TEXT_ISOLATE)}>
              {messages['empty.caseId']}{' '}
              <span dir="ltr" className="font-mono text-primary select-all">
                {props.caseId}
              </span>
            </p>
          )}
        </div>
        {hasActions && (
          <div className="flex w-full max-w-70 flex-col gap-2">
            {props.primaryAction !== undefined && (
              <ActionButton action={props.primaryAction} main />
            )}
            {props.secondaryAction !== undefined && (
              <ActionButton action={props.secondaryAction} main={false} />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

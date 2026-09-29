import { CloudAlert, Inbox, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import type { IconComponent } from './intents'

/*
 * EmptyState and ErrorState (BUILD-PLAN P2.5), the previous Design System's EmptyState (built on
 * Mantine's), carried over (owner's decision, 2026-09-28, docs/decisions.md "Feedback"):
 * - Three variants with lucide icons at stroke width 1.5: 'empty' Inbox, 'no-results' SearchX,
 *   'error' CloudAlert. The error state never shares an icon with the empty one: an empty list
 *   and a failed load need different reactions.
 * - The default title and description of each variant come from the provider's messages.
 * - One optional action: a small (Mantine 'xs') button in the neutral "default" weight.
 * - `compact`: Mantine size 'sm' with a 24px icon; otherwise size 'md' with a 32px icon.
 *
 * Mantine 9.6.2 EmptyState.css, align 'center': a centred column; gaps 10px (md) or 8px (sm);
 * the icon in the dimmed colour; title weight 600, line height 1.3, 16px (md) or 14px (sm), in the
 * strong text colour; description 13px, line height 1.55, dimmed, at most 32rem wide; actions
 * 12px apart.
 */

/** Which empty state. */
export type EmptyVariant = 'empty' | 'no-results' | 'error'

/** The text keys of the variants, so each is a string. */
type EmptyMessage = Extract<
  keyof LiroMessages,
  | 'empty.emptyTitle'
  | 'empty.emptyDescription'
  | 'empty.noResultsTitle'
  | 'empty.noResultsDescription'
  | 'empty.errorTitle'
  | 'empty.errorDescription'
>

const VARIANTS: Record<
  EmptyVariant,
  { icon: IconComponent; title: EmptyMessage; description: EmptyMessage }
> = {
  empty: { icon: Inbox, title: 'empty.emptyTitle', description: 'empty.emptyDescription' },
  'no-results': {
    icon: SearchX,
    title: 'empty.noResultsTitle',
    description: 'empty.noResultsDescription',
  },
  error: { icon: CloudAlert, title: 'empty.errorTitle', description: 'empty.errorDescription' },
}

/** The icon of a variant; exported for its test (the error icon is never the empty one). */
export function emptyIcon(variant: EmptyVariant): IconComponent {
  return VARIANTS[variant].icon
}

/** An action of an empty state. */
export interface EmptyAction {
  /** From the application: "Create an invoice", "Clear the filters", "Try again". */
  label: string
  onClick: () => void
  icon?: IconComponent
}

export interface EmptyStateProps {
  /** Default: 'empty'. */
  variant?: EmptyVariant
  /** Default: the variant's title from the provider's messages. */
  title?: ReactNode
  /** Default: the variant's description from the provider's messages. */
  description?: ReactNode
  /** Default: the variant's icon. */
  icon?: IconComponent
  /** The first step: one small button. */
  action?: EmptyAction
  /** Mantine size 'sm' with a 24px icon, for a card or a table body. */
  compact?: boolean
  /** Layout classes (margins, height). */
  className?: string
  /** Extra content under the action (ErrorState's case number and report action). */
  children?: ReactNode
}

/** Mantine Button 'xs' (30px, 14px padding, 12px text), neutral "default". */
const SMALL = 'min-h-control-sm gap-2 px-3.5 text-xs'

/**
 * What a place shows when it has nothing: nothing yet ('empty', with the first step), nothing
 * that matches ('no-results', with a way to widen the search), or nothing because loading failed
 * ('error', see ErrorState).
 */
export function EmptyState(props: EmptyStateProps) {
  const { messages } = useLiro()
  const variant = props.variant ?? 'empty'
  const look = VARIANTS[variant]
  const Icon = props.icon ?? look.icon
  const compact = props.compact === true
  const ActionIcon = props.action?.icon
  return (
    <div
      data-variant={variant}
      className={cn(
        'flex flex-col items-center font-sans',
        compact ? 'gap-2' : 'gap-2.5',
        props.className,
      )}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn('shrink-0 text-secondary', compact ? 'size-6' : 'size-8')}
      />
      <div
        className={cn(
          'flex min-w-0 flex-col items-center text-center',
          compact ? 'gap-2' : 'gap-2.5',
        )}
      >
        <p
          className={cn(
            'm-0 leading-[1.3] font-semibold text-balance text-primary',
            compact ? 'text-md' : 'text-lg',
          )}
        >
          {props.title ?? messages[look.title]}
        </p>
        <p className="m-0 max-w-[32rem] text-sm leading-[1.55] text-pretty text-secondary">
          {props.description ?? messages[look.description]}
        </p>
        {props.action !== undefined && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonPrimitive
              family="neutral"
              emphasis="secondary"
              className={SMALL}
              onClick={props.action.onClick}
            >
              {ActionIcon !== undefined && (
                <ActionIcon aria-hidden="true" className="size-3.5 shrink-0" />
              )}
              <span>{props.action.label}</span>
            </ButtonPrimitive>
          </div>
        )}
        {props.children}
      </div>
    </div>
  )
}

export interface ErrorStateProps extends Omit<EmptyStateProps, 'variant' | 'children'> {
  /** The case number the application received for this failure; shown so the user can quote it. */
  caseId?: string
  /** A "report a problem" action, from the application (usually a Button). */
  reportAction?: ReactNode
}

/**
 * A place that could not be loaded: the error variant of EmptyState, with the case number to
 * quote and a place for a "report a problem" action. The retry is the `action`.
 */
export function ErrorState({ caseId, reportAction, ...props }: ErrorStateProps) {
  const { messages } = useLiro()
  return (
    <EmptyState {...props} variant="error">
      {caseId !== undefined && (
        <p className="m-0 text-xs text-secondary">
          {messages['empty.caseId']}{' '}
          <span className="font-mono text-primary select-all">{caseId}</span>
        </p>
      )}
      {reportAction !== undefined && (
        <div className="flex flex-wrap items-center justify-center gap-3">{reportAction}</div>
      )}
    </EmptyState>
  )
}

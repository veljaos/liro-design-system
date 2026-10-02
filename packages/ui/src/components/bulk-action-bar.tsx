import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ActionButton, OverflowRow, UnavailableAction, type ActionItem } from './actions'
import { CompactIconButton } from './button'
import { ConfirmDialog } from './confirm-dialog'
import { INTENTS } from './intents'

/*
 * BulkActionBar (BUILD-PLAN P2.7), the previous Design System's, carried over (owner's decision,
 * 2026-09-28, docs/decisions.md "Actions"):
 * - it appears, sliding down in 140ms, while at least one row is selected;
 * - a panel with a border.strong border, radius md, 10px (xs) padding, on surface.sunken —
 *   neutral since P3.6 (owner: blue is for actions, links and focus);
 * - at the start a clear-selection icon button (the cancel intent), then "N selected" (13px,
 *   semibold, text.primary) in an aria-live="polite" region — the only way a screen reader hears
 *   the count change — and, when the whole result is larger, "Select all N" (a neutral subtle xs
 *   button, as "Clear all" in FilterBar);
 * - at the end the actions, small (Mantine 'xs'), each can be unavailable with a reason, all
 *   disabled while loading;
 * - an action that needs confirmation opens ONE ConfirmDialog for the whole selection, with the
 *   count in its title; confirmation does not scale (Appendix B.8);
 * - the row wraps on narrow screens; when the actions still do not fit, the ones before the
 *   main action move into a "More" menu (the owner, 2026-09-29, P2.7d), and only then does a
 *   label wrap.
 */

/** An action on the selection. */
export type BulkAction = ActionItem & {
  /**
   * Asks once before running, with the count. Default: the intent's own rule (delete asks).
   */
  confirm?: boolean
}

export interface BulkActionBarProps {
  /** How many rows are selected; the bar shows only when it is at least 1. */
  count: number
  /** How many rows the whole result has; with `onSelectAll`, offers to select them all. */
  total?: number
  onSelectAll?: () => void
  /** Clears the selection. */
  onClear: () => void
  /** The actions, the main one last. `onClick` may return a promise while it runs. */
  actions: readonly BulkAction[]
  /** The application is running an action: every action is disabled. */
  loading?: boolean
  className?: string
}

/** Whether an action asks before running: its own `confirm`, else its intent's rule. */
export function asksFirst(action: BulkAction): boolean {
  if (action.confirm !== undefined) return action.confirm
  return action.intent === undefined ? false : INTENTS[action.intent].confirms
}

/**
 * The actions for the selected rows of a list: the count, a way to clear or widen the selection,
 * and actions that apply to all of them at once.
 */
export function BulkActionBar(props: BulkActionBarProps) {
  const { messages } = useLiro()
  const [asking, setAsking] = useState<BulkAction | null>(null)
  if (props.count < 1) return null
  const loading = props.loading === true
  const run = (action: BulkAction) => {
    if (asksFirst(action)) setAsking(action)
    else action.onClick?.()
  }

  return (
    <div
      className={cn(
        'flex animate-liro-slide-down flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-solid border-strong bg-surface-sunken p-2.5 font-sans motion-reduce:animate-none',
        props.className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <CompactIconButton intent="cancel" label={messages['bulk.clear']} onClick={props.onClear} />
        <span aria-live="polite" className="text-sm font-semibold text-primary">
          {messages['bulk.selected'](props.count)}
        </span>
        {props.total !== undefined &&
          props.total > props.count &&
          props.onSelectAll !== undefined && (
            <ActionButton
              small
              action={{
                family: 'neutral',
                icon: ListChecks,
                emphasis: 'menu',
                label: messages['bulk.selectAll'](props.total),
              }}
              onClick={props.onSelectAll}
            />
          )}
      </div>
      <OverflowRow
        actions={props.actions}
        render={(action) =>
          action.unavailableReason !== undefined ? (
            <UnavailableAction {...action} reason={action.unavailableReason} small />
          ) : (
            <ActionButton
              action={action}
              small
              disabled={loading}
              onClick={() => {
                run(action)
              }}
            />
          )
        }
        onMenuSelect={run}
        disabled={loading}
        small
        align="end"
        className="grow"
      />

      {asking !== null && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setAsking(null)
          }}
          {...(asking.intent === undefined
            ? { family: asking.family, actionIcon: asking.icon }
            : { intent: asking.intent })}
          title={messages['bulk.confirmTitle'](props.count)}
          confirmLabel={asking.label}
          onConfirm={() => asking.onClick?.()}
        />
      )}
    </div>
  )
}

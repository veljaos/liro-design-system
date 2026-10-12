import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { OfflineIndicator } from '../components/shell-markers'

/*
 * The parts PickList and StockCount share (internal, not exported): the handheld screen's frame —
 * the title row, the offline strip with the queue — and a big code. A handheld is 360px wide and
 * used with one hand: one column, 16px sides, 44px targets, the safe-area insets kept.
 */

export interface HandheldFrameProps {
  title: string
  subtitle?: string
  /** Buttons at the end of the title row, from the application. */
  actions?: ReactNode
  /** Under the title row (progress). */
  below?: ReactNode
  offline?: boolean
  /** Changes kept on this device, waiting to be sent (a count). */
  queued?: number
  /** The queue's words, when the application words them itself. */
  queuedText?: string
  offlineAction?: ReactNode
  /** A slot for the busy state of the whole screen. */
  busy?: boolean
  dataSlot: string
  className?: string
  children: ReactNode
}

/** The screen of a handheld: title row, offline strip, then one scrolling column. */
export function HandheldFrame(props: HandheldFrameProps) {
  const { messages, format } = useLiro()
  const queued = props.queued ?? 0
  const queueText =
    queued > 0
      ? (props.queuedText ?? messages['queue.waiting'](queued, format.number(String(queued))))
      : null
  return (
    <div
      data-slot={props.dataSlot}
      aria-busy={props.busy === true || undefined}
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-surface-page font-sans text-primary touch-manipulation',
        props.className,
      )}
    >
      <div className="flex shrink-0 flex-col gap-2 border-0 border-b border-solid border-default bg-surface-raised pt-[max(12px,env(safe-area-inset-top))] pe-[max(16px,env(safe-area-inset-right))] pb-3 ps-[max(16px,env(safe-area-inset-left))]">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className={cn('m-0 text-h4 font-semibold break-words', TEXT_DIRECTION)}>
              {props.title}
            </h1>
            {props.subtitle !== undefined && (
              <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.subtitle}</p>
            )}
          </div>
          {props.actions !== undefined && (
            <div className="flex shrink-0 items-center gap-2">{props.actions}</div>
          )}
        </div>
        {props.below}
      </div>
      <OfflineIndicator
        offline={props.offline === true}
        layout="phone"
        {...(queueText === null ? {} : { waiting: queueText })}
        {...(props.offlineAction === undefined ? {} : { action: props.offlineAction })}
      />
      {props.offline !== true && queueText !== null && (
        <p className="m-0 border-0 border-b border-solid border-default px-4 py-2 text-sm text-secondary">
          <span className={TEXT_DIRECTION}>{queueText}</span>
        </p>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {props.children}
      </div>
    </div>
  )
}

/** A location or item code, large and left to right: what the worker looks for on a shelf. */
export function BigCode({ label, code }: { label: string; code: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{label}</span>
      <bdi
        dir="ltr"
        className="text-match-parent text-h2 font-semibold break-words text-primary tabular-nums"
      >
        {code}
      </bdi>
    </div>
  )
}

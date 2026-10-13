import {
  Check,
  Circle,
  CircleCheck,
  SkipForward,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import {
  ReasonConfirmDialog,
  type ConfirmAnswer,
  type ConfirmReason,
} from '../components/confirm-dialog'
import { EmptyState } from '../components/empty-state'
import { ProgressBar } from '../components/progress'
import { QuantityStepper } from '../components/quantity-stepper'
import { ScanField, type ScanFeedback } from '../components/scan-field'
import type { ScanOptions } from '../components/scan-logic'
import {
  PICK_STEPS,
  pickProgress,
  pickStepState,
  type PickLineState,
  type PickStep,
} from '../components/warehouse-logic'
import { BigCode, HandheldFrame } from './handheld-parts'

/*
 * PickList (BUILD-PLAN P5.11; docs/decisions.md "Scanning"). Picking on a handheld at 360px: a
 * route of lines (location, item, quantity to pick, picked so far — all the application's), the
 * current line large, and its three steps in order — scan the location, scan the item, confirm the
 * quantity. **The application checks every scan** and moves the step (`step`) and the line
 * (`currentId`); the screen reports what was scanned (`onScan`) and confirmed (`onConfirm`) and
 * shows the application's answer under the scan field (`feedback`, with `onFeedback` for sound
 * and vibration). Progress "4 of 12" with a bar. A line can be skipped with a reason
 * (ReasonConfirmDialog, the reasons from the application). The route under the current line
 * shows every line's state in words with an icon (never colour alone); the current one is the
 * neutral selection (surface.selected with the border.selected bar, D17). Offline, the strip
 * and the queue (P5.3). When no line is open: "All lines are done" with Finish.
 */

export interface PickLine {
  id: string
  /** Where to pick from, the location's code ("A-03-02"). */
  location: string
  /** The item's name. */
  item: string
  /** The item's code (article number, barcode). */
  itemCode?: string
  /** To pick, a decimal string. */
  quantity: string
  /** Picked so far, a decimal string; null for none yet. */
  picked: string | null
  /** The unit ("pc", "kg", "m"). */
  unit?: string
  state: PickLineState
  /** The application's words about the line (a skip's reason, a short pick). */
  note?: string
}

export interface PickListProps {
  /** The list's name ("Pick list PL-2026-0412"). */
  title: string
  /** For whom, from where ("Kvadrat Gradnja · Magacin Novi Sad"). */
  subtitle?: string
  lines: readonly PickLine[]
  /** The line in front of the worker, from the application; null when none is open. */
  currentId: string | null
  /** The current line's step, from the application. */
  step: PickStep
  /** A location or item code was scanned (or typed) at the current step. */
  onScan: (code: string, step: 'location' | 'item', source: 'scanner' | 'keyboard') => void
  /** The application's answer to the last scan. */
  feedback?: ScanFeedback | null
  /** Called for each new feedback: sound, vibration. */
  onFeedback?: (feedback: ScanFeedback) => void
  /** Adds the camera button to the scan field. */
  onCameraScan?: () => void
  /** The scan field's on-screen keyboard: 'none' where the scanner is the keyboard. */
  inputMode?: 'text' | 'none'
  scanOptions?: ScanOptions
  /** The quantity being confirmed (controlled). Default: the line's quantity to pick. */
  quantity?: string | null
  onQuantityChange?: (quantity: string | null) => void
  /** The quantity is confirmed for the line. */
  onConfirm: (lineId: string, quantity: string | null) => void
  /** Adds Skip: the line is skipped with the answer of the reason dialog. */
  onSkip?: (lineId: string, answer: ConfirmAnswer) => void | Promise<void>
  /** The reasons to skip (the application's list); without them the reason is written. */
  skipReasons?: readonly ConfirmReason[]
  /** The skip dialog open when it appears (a picture, a restored screen). */
  defaultSkipOpen?: boolean
  /** A route line was pressed: the application may make it current. */
  onSelectLine?: (lineId: string) => void
  /** Shown when no line is open: the main action. */
  onFinish?: () => void
  offline?: boolean
  /** Changes kept on this device, waiting to be sent. */
  queued?: number
  offlineAction?: ReactNode
  /** Buttons at the end of the title row. */
  actions?: ReactNode
  /** Skeletons while the list loads. */
  loading?: boolean
  className?: string
}

const STATE_ICON: Record<PickLineState, LucideIcon> = {
  open: Circle,
  picked: Check,
  short: TriangleAlert,
  skipped: SkipForward,
}

const STATE_CLASS: Record<PickLineState, string> = {
  open: 'text-secondary',
  picked: 'text-secondary',
  short: 'text-status-warning-fg',
  skipped: 'text-secondary',
}

/** The current line in the route: the neutral selection with its bar at the start (D17). */
const CURRENT =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** Picking on a handheld: the current line large, scan location then item, confirm, the route. */
export function PickList(props: PickListProps) {
  const { messages, format } = useLiro()
  const progress = pickProgress(props.lines)
  const routeId = useId()
  const current = props.lines.find((line) => line.id === props.currentId) ?? null
  const [innerQuantity, setInnerQuantity] = useState<{ line: string; value: string | null } | null>(
    null,
  )
  const quantity =
    props.quantity !== undefined
      ? props.quantity
      : innerQuantity !== null && innerQuantity.line === current?.id
        ? innerQuantity.value
        : (current?.quantity ?? null)
  const stateWord = (state: PickLineState) =>
    ({
      open: messages['pick.open'],
      picked: messages['pick.picked'],
      short: messages['pick.short'],
      skipped: messages['pick.skipped'],
    })[state]
  const amount = (value: string | null, unit: string | undefined) =>
    value === null
      ? '—'
      : unit === undefined
        ? format.number(value)
        : `${format.number(value)} ${unit}`

  const progressRow = props.lines.length > 0 && (
    <div className="flex items-center gap-3">
      <span className={cn('shrink-0 text-sm font-semibold tabular-nums', TEXT_DIRECTION)}>
        {messages['pick.progress'](
          progress.done,
          format.number(String(progress.done)),
          progress.total,
          format.number(String(progress.total)),
        )}
      </span>
      <ProgressBar
        label={messages['pick.progressLabel']}
        value={progress.done}
        max={progress.total}
        className="flex-1"
      />
    </div>
  )

  const stepLabel = (step: PickStep) =>
    step === 'location'
      ? messages['pick.stepLocation']
      : step === 'item'
        ? messages['pick.stepItem']
        : messages['pick.stepQuantity']

  const skip = current !== null && props.onSkip !== undefined && (
    <ReasonConfirmDialog
      family="neutral"
      actionIcon={SkipForward}
      title={messages['pick.skipAction']}
      subject={current.item}
      message={messages['pick.skipMessage']}
      confirmLabel={messages['pick.skip']}
      {...(props.skipReasons === undefined ? {} : { reasons: props.skipReasons })}
      {...(props.defaultSkipOpen === undefined ? {} : { defaultOpen: props.defaultSkipOpen })}
      onConfirm={(answer) => props.onSkip?.(current.id, answer)}
      trigger={
        <ButtonPrimitive className="min-h-12 flex-1 text-md">
          <SkipForward aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
          <span className={TEXT_DIRECTION}>{messages['pick.skip']}</span>
        </ButtonPrimitive>
      }
    />
  )

  const currentCard = current !== null && (
    <section
      aria-label={messages['pick.current']}
      data-slot="pick-current"
      className="flex flex-col gap-4 rounded-lg border border-solid border-default bg-surface-raised p-4"
    >
      <BigCode label={messages['pick.location']} code={current.location} />
      <div className="flex min-w-0 flex-col">
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['pick.item']}
        </span>
        <span className={cn('text-md font-semibold break-words', TEXT_DIRECTION)}>
          {current.item}
        </span>
        {current.itemCode !== undefined && (
          <bdi dir="ltr" className="text-match-parent text-sm text-secondary tabular-nums">
            {current.itemCode}
          </bdi>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col">
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['pick.toPick']}
          </span>
          <bdi className="text-h2 font-semibold tabular-nums">
            {amount(current.quantity, current.unit)}
          </bdi>
        </div>
        <span className={cn('text-sm text-secondary tabular-nums', TEXT_DIRECTION)}>
          {messages['pick.pickedOf'](
            current.picked === null ? format.number('0') : format.number(current.picked),
            amount(current.quantity, current.unit),
          )}
        </span>
      </div>
      <ol aria-label={messages['pick.steps']} className="m-0 flex list-none flex-col gap-1 p-0">
        {PICK_STEPS.map((step) => {
          const state = pickStepState(step, props.step)
          return (
            <li
              key={step}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 text-sm',
                state === 'current' && 'font-semibold text-primary',
                state === 'done' && 'text-secondary',
                state === 'todo' && 'text-tertiary',
              )}
            >
              {state === 'done' ? (
                <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <Circle aria-hidden="true" className="size-4 shrink-0" />
              )}
              <span className={TEXT_DIRECTION}>
                {stepLabel(step)}
                {state === 'done' && (
                  <span className="sr-only"> ({messages['pick.stepDone']})</span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      {props.step === 'quantity' ? (
        <div className="flex flex-col gap-3">
          <QuantityStepper
            label={messages['pick.quantity']}
            size="large"
            min="0"
            value={quantity}
            onChange={(value) => {
              setInnerQuantity({ line: current.id, value })
              props.onQuantityChange?.(value)
            }}
            {...(current.unit === undefined ? {} : { unit: current.unit })}
          />
          <div className="flex gap-2">
            {skip}
            <ButtonPrimitive
              family="primary"
              emphasis="primary"
              className="min-h-12 flex-[2] text-md"
              onClick={() => {
                props.onConfirm(current.id, quantity)
              }}
            >
              <Check aria-hidden="true" className="size-4 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['pick.confirm']}</span>
            </ButtonPrimitive>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ScanField
            key={`${current.id}-${props.step}`}
            label={
              props.step === 'location' ? messages['pick.scanLocation'] : messages['pick.scanItem']
            }
            takeFocus
            onScan={(code, source) => {
              props.onScan(code, props.step === 'location' ? 'location' : 'item', source)
            }}
            {...(props.feedback === undefined ? {} : { feedback: props.feedback })}
            {...(props.onFeedback === undefined ? {} : { onFeedback: props.onFeedback })}
            {...(props.onCameraScan === undefined ? {} : { onCameraScan: props.onCameraScan })}
            {...(props.inputMode === undefined ? {} : { inputMode: props.inputMode })}
            {...(props.scanOptions === undefined ? {} : { scanOptions: props.scanOptions })}
          />
          {skip !== false && <div className="flex">{skip}</div>}
        </div>
      )}
    </section>
  )

  const allDone = props.lines.length > 0 && progress.done === progress.total

  return (
    <HandheldFrame
      dataSlot="pick-list"
      title={props.title}
      below={progressRow}
      busy={props.loading === true}
      {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
      {...(props.actions === undefined ? {} : { actions: props.actions })}
      {...(props.offline === undefined ? {} : { offline: props.offline })}
      {...(props.queued === undefined ? {} : { queued: props.queued })}
      {...(props.offlineAction === undefined ? {} : { offlineAction: props.offlineAction })}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      {props.loading === true ? (
        <>
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </>
      ) : props.lines.length === 0 ? (
        <EmptyState
          compact
          title={messages['pick.empty']}
          description={messages['pick.emptyDescription']}
        />
      ) : (
        <>
          {allDone ? (
            <section
              data-slot="pick-done"
              className="flex flex-col items-center gap-3 rounded-lg border border-solid border-default bg-surface-raised p-6 text-center"
            >
              <CircleCheck aria-hidden="true" className="size-10 text-status-success-fg" />
              <h2 className={cn('m-0 text-h4 font-semibold', TEXT_DIRECTION)}>
                {messages['pick.allDone']}
              </h2>
              <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
                {messages['pick.allDoneDescription']}
              </p>
              {props.onFinish !== undefined && (
                <ButtonPrimitive
                  family="primary"
                  emphasis="primary"
                  className="min-h-12 w-full text-md"
                  onClick={props.onFinish}
                >
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  <span className={TEXT_DIRECTION}>{messages['pick.finish']}</span>
                </ButtonPrimitive>
              )}
            </section>
          ) : (
            currentCard
          )}
          <section aria-labelledby={routeId} className="flex flex-col gap-2">
            <h2 id={routeId} className={cn('m-0 text-h5 font-semibold', TEXT_DIRECTION)}>
              {messages['pick.route']}
            </h2>
            <ol className="m-0 flex list-none flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised p-0">
              {props.lines.map((line) => {
                const Icon = STATE_ICON[line.state]
                const isCurrent = line.id === props.currentId
                const content = (
                  <>
                    <bdi dir="ltr" className="w-20 shrink-0 text-sm font-semibold tabular-nums">
                      {line.location}
                    </bdi>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('text-sm break-words', TEXT_DIRECTION)}>{line.item}</span>
                      {line.note !== undefined && (
                        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                          {line.note}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <bdi className="text-sm tabular-nums">
                        {line.picked === null ? format.number('0') : format.number(line.picked)} /{' '}
                        {amount(line.quantity, line.unit)}
                      </bdi>
                      <span
                        className={cn('flex items-center gap-1 text-xs', STATE_CLASS[line.state])}
                      >
                        <Icon aria-hidden="true" className="size-3 shrink-0" />
                        <span className={TEXT_DIRECTION}>{stateWord(line.state)}</span>
                      </span>
                    </span>
                  </>
                )
                const rowClass = cn(
                  'relative flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start',
                  isCurrent ? CURRENT : 'bg-transparent',
                )
                return (
                  <li
                    key={line.id}
                    aria-current={isCurrent ? 'step' : undefined}
                    className="border-0 border-b border-solid border-subtle last:border-b-0"
                  >
                    {props.onSelectLine === undefined ? (
                      <div className={rowClass}>{content}</div>
                    ) : (
                      <button
                        type="button"
                        className={cn(
                          BUTTON_RESET,
                          FOCUS_RING,
                          rowClass,
                          'cursor-pointer text-primary',
                        )}
                        onClick={() => {
                          props.onSelectLine?.(line.id)
                        }}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        </>
      )}
    </HandheldFrame>
  )
}

import { Check, CircleAlert, MapPin, TriangleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { EmptyState } from '../components/empty-state'
import { QuantityStepper } from '../components/quantity-stepper'
import { ScanField, type ScanFeedback } from '../components/scan-field'
import type { ScanOptions } from '../components/scan-logic'
import { BigCode, HandheldFrame } from './handheld-parts'

/*
 * StockCount (BUILD-PLAN P5.11; docs/decisions.md "Scanning"). Counting stock on a handheld at
 * 360px, one location at a time: scan the location, then scan items; the item last scanned is in
 * front with a large QuantityStepper for its count; the items counted here are listed under it.
 * **The application checks every scan** (`onScan`, answered by `feedback`) and owns every
 * figure: the counted quantity is reported (`onCountChange`), and the expected quantity and the
 * difference arrive from the application as decimal strings — a blind count simply passes none.
 * A difference is signed through `format` ("+2", "-3"), with an icon and its tone (never colour
 * alone). "Finish location" is the main action, last and full width. Offline, the strip and the
 * queue (P5.3).
 */

export interface CountItem {
  id: string
  /** The item's name. */
  item: string
  /** The item's code (article number, barcode). */
  itemCode?: string
  /** The unit ("pc", "kg"). */
  unit?: string
  /** Counted, a decimal string; null for not yet. */
  counted: string | null
  /** What the books expect here, a decimal string; omit for a blind count. */
  expected?: string | null
  /** Counted minus expected, from the application, a decimal string. */
  difference?: string | null
  /** How the application sees the difference. Default 'neutral'. */
  differenceTone?: 'neutral' | 'warning' | 'danger'
  /** The application's words about the item. */
  note?: string
}

export interface StockCountProps {
  /** The count's name ("Inventory 2026 · Zone A"). */
  title: string
  subtitle?: string
  /** The scanned location's code; null until one is scanned. */
  location: string | null
  /** The location's name in words ("Rack A, shelf 3"). */
  locationName?: string
  /** The items counted at this location. */
  items: readonly CountItem[]
  /** The item in front (the last scanned); its count is edited. */
  currentId?: string | null
  /** A location or item code was scanned (or typed). */
  onScan: (code: string, target: 'location' | 'item', source: 'scanner' | 'keyboard') => void
  feedback?: ScanFeedback | null
  onFeedback?: (feedback: ScanFeedback) => void
  onCameraScan?: () => void
  inputMode?: 'text' | 'none'
  scanOptions?: ScanOptions
  /** The count of an item changed. */
  onCountChange: (itemId: string, counted: string | null) => void
  /** A counted item was pressed: the application may put it in front. */
  onSelectItem?: (itemId: string) => void
  /** Leaves the location, to scan another. */
  onChangeLocation?: () => void
  /** The location is counted: the main action. */
  onFinish?: () => void
  offline?: boolean
  queued?: number
  offlineAction?: ReactNode
  actions?: ReactNode
  loading?: boolean
  className?: string
}

const TONE_CLASS = {
  neutral: 'text-secondary',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
} as const

/** Counting one location on a handheld: scan it, scan items, count each; differences from data. */
export function StockCount(props: StockCountProps) {
  const { messages, format } = useLiro()
  const listId = useId()
  const current = props.items.find((item) => item.id === props.currentId) ?? null
  const scan = (target: 'location' | 'item') => (
    <ScanField
      key={target}
      label={target === 'location' ? messages['count.scanLocation'] : messages['count.scanItem']}
      takeFocus
      onScan={(code, source) => {
        props.onScan(code, target, source)
      }}
      {...(props.feedback === undefined ? {} : { feedback: props.feedback })}
      {...(props.onFeedback === undefined ? {} : { onFeedback: props.onFeedback })}
      {...(props.onCameraScan === undefined ? {} : { onCameraScan: props.onCameraScan })}
      {...(props.inputMode === undefined ? {} : { inputMode: props.inputMode })}
      {...(props.scanOptions === undefined ? {} : { scanOptions: props.scanOptions })}
    />
  )
  const quantity = (value: string, unit: string | undefined, sign?: 'always') => {
    const text = format.number(value, sign === undefined ? {} : { sign })
    return unit === undefined ? text : `${text} ${unit}`
  }
  const difference = (item: CountItem) => {
    if (item.difference === undefined || item.difference === null) return null
    const tone = item.differenceTone ?? 'neutral'
    const Icon = tone === 'danger' ? CircleAlert : tone === 'warning' ? TriangleAlert : null
    return (
      <span className={cn('flex items-center gap-1 text-sm', TONE_CLASS[tone])}>
        {Icon !== null && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
        <span className="text-secondary">{messages['count.difference']}</span>
        <bdi className="font-semibold tabular-nums">
          {quantity(item.difference, item.unit, 'always')}
        </bdi>
      </span>
    )
  }

  const body =
    props.location === null ? (
      <section className="flex flex-col gap-4 rounded-lg border border-solid border-default bg-surface-raised p-4">
        <p className={cn('m-0 flex items-start gap-2 text-md', TEXT_DIRECTION)}>
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
          {messages['count.noLocation']}
        </p>
        {scan('location')}
      </section>
    ) : (
      <>
        <section
          data-slot="count-location"
          className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <BigCode label={messages['count.location']} code={props.location} />
              {props.locationName !== undefined && (
                <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
                  {props.locationName}
                </span>
              )}
            </div>
            {props.onChangeLocation !== undefined && (
              <ButtonPrimitive
                emphasis="menu"
                className="min-h-11 shrink-0"
                onClick={props.onChangeLocation}
              >
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span className={TEXT_DIRECTION}>{messages['count.changeLocation']}</span>
              </ButtonPrimitive>
            )}
          </div>
          {scan('item')}
        </section>
        {current !== null && (
          <section
            aria-label={messages['count.current']}
            data-slot="count-current"
            className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4"
          >
            <div className="flex min-w-0 flex-col">
              <span className={cn('text-md font-semibold break-words', TEXT_DIRECTION)}>
                {current.item}
              </span>
              {current.itemCode !== undefined && (
                <bdi dir="ltr" className="text-match-parent text-sm text-secondary tabular-nums">
                  {current.itemCode}
                </bdi>
              )}
            </div>
            <QuantityStepper
              key={current.id}
              label={messages['count.quantity']}
              size="large"
              min="0"
              value={current.counted}
              onChange={(value) => {
                props.onCountChange(current.id, value)
              }}
              {...(current.unit === undefined ? {} : { unit: current.unit })}
            />
            {(current.expected !== undefined && current.expected !== null) ||
            difference(current) !== null ? (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                {current.expected !== undefined && current.expected !== null && (
                  <span className="text-sm text-secondary">
                    {messages['count.expected']}{' '}
                    <bdi className="font-semibold text-primary tabular-nums">
                      {quantity(current.expected, current.unit)}
                    </bdi>
                  </span>
                )}
                {difference(current)}
              </div>
            ) : null}
            {current.note !== undefined && (
              <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{current.note}</p>
            )}
          </section>
        )}
        <section aria-labelledby={listId} className="flex flex-col gap-2">
          <h2 id={listId} className={cn('m-0 text-h5 font-semibold', TEXT_DIRECTION)}>
            {messages['count.items']}
          </h2>
          {props.items.length === 0 ? (
            <EmptyState
              compact
              title={messages['count.noItems']}
              description={messages['count.noItemsDescription']}
            />
          ) : (
            <ul className="m-0 flex list-none flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised p-0">
              {props.items.map((item) => {
                const isCurrent = item.id === props.currentId
                const content = (
                  <>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('text-sm break-words', TEXT_DIRECTION)}>{item.item}</span>
                      {item.itemCode !== undefined && (
                        <bdi
                          dir="ltr"
                          className="text-match-parent text-xs text-secondary tabular-nums"
                        >
                          {item.itemCode}
                        </bdi>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <bdi className="text-sm font-semibold tabular-nums">
                        {item.counted === null ? '—' : quantity(item.counted, item.unit)}
                      </bdi>
                      {difference(item)}
                    </span>
                  </>
                )
                const rowClass = cn(
                  'relative flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start',
                  isCurrent ? CURRENT : 'bg-transparent',
                )
                return (
                  <li
                    key={item.id}
                    aria-current={isCurrent || undefined}
                    className="border-0 border-b border-solid border-subtle last:border-b-0"
                  >
                    {props.onSelectItem === undefined ? (
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
                          props.onSelectItem?.(item.id)
                        }}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        {props.onFinish !== undefined && (
          <ButtonPrimitive
            family="primary"
            emphasis="primary"
            className="min-h-12 w-full shrink-0 text-md"
            onClick={props.onFinish}
          >
            <Check aria-hidden="true" className="size-4 shrink-0" />
            <span className={TEXT_DIRECTION}>{messages['count.finish']}</span>
          </ButtonPrimitive>
        )}
      </>
    )

  return (
    <HandheldFrame
      dataSlot="stock-count"
      title={props.title}
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
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </>
      ) : (
        body
      )}
    </HandheldFrame>
  )
}

/** The item in front in the list: the neutral selection with its bar at the start (D17). */
const CURRENT =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

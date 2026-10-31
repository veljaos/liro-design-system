import { ChevronUp, CloudAlert, CloudUpload } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { EMPTY_SCAN_BUFFER, scanKey, type ScanOptions } from '../components/scan-logic'
import { OfflineIndicator } from '../components/shell-markers'
import { MoneyText } from '../components/display-text'
import { FLASH_CLASS, FLASH_TRANSITION, useFlash } from '../components/pos-feedback'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'

/*
 * PosShell. The frame of a till: the whole
 * screen, no application header, no navigation (a till is one task), made for fingers.
 *
 * - **Kiosk-safe:** it fills its container (the application gives it the viewport, 100dvh);
 *   nothing scrolls the page (`overscroll-behavior: none`, so a swipe neither reloads nor goes
 *   back), double-tap zoom is off (`touch-action: manipulation`), the strip and the tiles cannot
 *   be selected by a long press, and the safe-area insets of an installed app are kept.
 * - **The strip on top** (not a header: no links): the brand (a prop), the register and the
 *   cashier (a label above each value), what is being sent (a neutral "Sending…" badge and "3
 *   sales waiting to be sent") and the application's actions at the end. Offline, the
 *   OfflineIndicator stands under it with the queue.
 * - **Landscape tablet first:** the product area at the start (scrolling), the cart panel at the
 *   end, 26rem (at most 45%), full height, its main action at the bottom within the thumb's reach.
 * - **Phone portrait (below 48em or `layout="phone"`): the products first** (a
 *   waiter taps items, not the cart) — the categories and the items in one scrolling area — and
 *   the order as a compact bar at the bottom ("Order · 3 items · 1.011,00 RSD", the
 *   application's count and total in `orderSummary`), which is highlighted at each change and
 *   expands into a bottom sheet (85% of the height) with the cart and its main action.
 * - **Scanner:** with `onScan`, a burst of keys anywhere on the screen (not in a field, which has
 *   its own ScanField) is read as a scan (`scanKey`) and reported; the Enter that ends it never
 *   presses the focused button.
 * - `banners` under the strip for a mode that must stay in view (training: a
 *   persistent warning Banner, the application's words); the queue's state (`queueState`:
 *   'sending', or 'failed' — a danger "Not sent" badge) and `queueAction` (open the journal).
 */

export interface PosShellProps {
  /** The brand at the start of the strip (BrandLockup, a logo), from the application. */
  brand: ReactNode
  /** The register's name ("Kasa 2"). */
  register?: string
  /** Who is selling ("Milica Jovanović"). */
  cashier?: string
  /** The connection is lost: the OfflineIndicator with the queue. */
  offline?: boolean
  /** Sales kept on this device, waiting to be sent (a count from the application). */
  queued?: number
  /** The queue's words, when the application words them itself. Default: `messages['pos.queued']`. */
  queuedText?: string
  /** An action at the end of the offline strip ("Try now"), from the application. */
  offlineAction?: ReactNode
  /**
   * The queue's state while online: 'sending' (default, a neutral badge) or 'failed' (a danger
   * "Not sent" badge: the processor refused or did not answer; the application says why).
   */
  queueState?: 'sending' | 'failed'
  /** An action after the queue's words ("Show receipts"), from the application. */
  queueAction?: ReactNode
  /** Banners under the strip that stay in view (a training mode), from the application. */
  banners?: ReactNode
  /** Buttons at the end of the strip (lock the register, the menu), from the application. */
  actions?: ReactNode
  /** The product area: a ProductGrid, a search, a ScanField. */
  products: ReactNode
  /** The cart: a CartPanel. */
  cart: ReactNode
  /** A code scanned outside any field (a burst of keys ending in Enter). */
  onScan?: (code: string) => void
  /** How a scan is told from typing. */
  scanOptions?: ScanOptions
  /** 'phone' forces the cart-first phone layout; default by the viewport (48em). */
  layout?: 'tablet' | 'phone'
  /**
   * Phone: what the order bar says — the number of lines and the total (a decimal string, null
   * while there is none), from the application, as its cart shows them.
   */
  orderSummary?: { count: number; total: string | null; currency: string }
  /** Phone: controlled open state of the order sheet. */
  orderOpen?: boolean
  /** Phone: the order sheet open when it appears (a picture, a restored screen). */
  defaultOrderOpen?: boolean
  onOrderOpenChange?: (open: boolean) => void
  /** The order bar's and sheet's title. Default: `messages['pos.order']`. */
  orderLabel?: string
  /** The product area's name on a phone. Default: `messages['pos.products']`. */
  productsLabel?: string
  className?: string
}

/** Whether a key went to a place where people type (a field keeps its own keys). */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/** Reports codes scanned while no field has the focus. */
function useScanListener(onScan: ((code: string) => void) | undefined, options?: ScanOptions) {
  const buffer = useRef(EMPTY_SCAN_BUFFER)
  const latest = useRef({ onScan, options })
  useEffect(() => {
    latest.current = { onScan, options }
  })
  const enabled = onScan !== undefined
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        buffer.current = EMPTY_SCAN_BUFFER
        return
      }
      const result = scanKey(buffer.current, event.key, event.timeStamp, latest.current.options)
      buffer.current = result.buffer
      if (result.code !== null) {
        // The scanner's Enter must not press the focused button.
        event.preventDefault()
        event.stopPropagation()
        latest.current.onScan?.(result.code)
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [enabled])
}

/** The full-screen frame of a till: status strip, products and cart; cart-first on phones. */
export function PosShell(props: PosShellProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [innerOpen, setInnerOpen] = useState(props.defaultOrderOpen ?? false)
  const orderOpen = props.orderOpen ?? innerOpen
  const [flashing, flash] = useFlash()
  const summary = props.orderSummary
  const summaryKey = summary === undefined ? '' : `${String(summary.count)}|${summary.total ?? ''}`
  const lastSummary = useRef(summaryKey)
  useEffect(() => {
    // Every change of the order lights the bar up: the tap counted.
    if (lastSummary.current === summaryKey) return
    lastSummary.current = summaryKey
    flash(['order'])
  }, [summaryKey, flash])
  useScanListener(props.onScan, props.scanOptions)

  const queued = props.queued ?? 0
  const queueText =
    queued > 0
      ? (props.queuedText ?? messages['pos.queued'](queued, format.number(String(queued))))
      : null
  const productsLabel = props.productsLabel ?? messages['pos.products']
  const orderLabel = props.orderLabel ?? messages['pos.order']
  const offline = props.offline === true

  const fact = (label: string, value: string | undefined) =>
    value !== undefined && (
      <div className="flex min-w-0 flex-col">
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{label}</span>
        <span className={cn('text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}>
          {value}
        </span>
      </div>
    )

  return (
    <div
      data-slot="pos-shell"
      className={cn(
        'flex h-full min-h-0 w-full flex-col overflow-hidden overscroll-none bg-surface-page font-sans text-primary touch-manipulation',
        props.className,
      )}
    >
      <section
        aria-label={messages['pos.status']}
        className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-0 border-b border-solid border-default bg-surface-raised pt-[max(8px,env(safe-area-inset-top))] pe-[max(16px,env(safe-area-inset-right))] pb-2 ps-[max(16px,env(safe-area-inset-left))] select-none"
      >
        <div className="flex shrink-0 items-center">{props.brand}</div>
        {fact(messages['pos.register'], props.register)}
        {fact(messages['pos.cashier'], props.cashier)}
        {!offline && queueText !== null && (
          <div className="flex min-w-0 flex-wrap items-center gap-2" data-slot="pos-queue">
            {props.queueState === 'failed' ? (
              <StatusBadge
                tone="danger"
                withBorder
                icon={CloudAlert}
                label={messages['pos.queueFailed']}
              />
            ) : (
              <StatusBadge
                tone="neutral"
                withBorder
                icon={CloudUpload}
                label={messages['connection.sending']}
              />
            )}
            <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{queueText}</span>
            {props.queueAction}
          </div>
        )}
        {props.actions !== undefined && (
          <div className="ms-auto flex flex-wrap items-center gap-2">{props.actions}</div>
        )}
      </section>
      <OfflineIndicator
        offline={offline}
        layout={phone ? 'phone' : 'desktop'}
        {...(queueText === null ? {} : { waiting: queueText })}
        {...(props.offlineAction === undefined ? {} : { action: props.offlineAction })}
      />
      {props.banners !== undefined && (
        <div
          data-slot="pos-banners"
          className="flex shrink-0 flex-col gap-2 bg-surface-page px-4 pt-2 ps-[max(16px,env(safe-area-inset-left))] pe-[max(16px,env(safe-area-inset-right))]"
        >
          {props.banners}
        </div>
      )}
      {phone ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <main
            aria-label={productsLabel}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 select-none"
          >
            {props.products}
          </main>
          <Sheet
            open={orderOpen}
            onOpenChange={(next) => {
              setInnerOpen(next)
              props.onOrderOpenChange?.(next)
            }}
          >
            <div className="shrink-0 border-0 border-t border-solid border-default bg-surface-raised px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
              <SheetTrigger asChild>
                <ButtonPrimitive
                  data-slot="pos-order-bar"
                  data-flash={flashing.has('order') || undefined}
                  className={cn(
                    'min-h-14 w-full justify-between text-md',
                    FLASH_TRANSITION,
                    flashing.has('order') && FLASH_CLASS,
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ChevronUp aria-hidden="true" className="size-5 shrink-0" />
                    <span className={cn('font-semibold', TEXT_DIRECTION)}>{orderLabel}</span>
                    {summary !== undefined && (
                      <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
                        {summary.count === 0
                          ? messages['cart.empty']
                          : messages['cart.count'](
                              summary.count,
                              format.number(String(summary.count)),
                            )}
                      </span>
                    )}
                  </span>
                  {summary?.total != null && (
                    <MoneyText
                      value={summary.total}
                      currency={summary.currency}
                      className="shrink-0 font-semibold"
                    />
                  )}
                </ButtonPrimitive>
              </SheetTrigger>
            </div>
            <SheetContent
              side="bottom"
              aria-describedby={undefined}
              className="h-[85%] rounded-t-lg pb-[env(safe-area-inset-bottom)]"
            >
              <DialogHeader>
                <DialogTitle>{orderLabel}</DialogTitle>
                <DialogCloseButton label={messages['dialog.close']} />
              </DialogHeader>
              <div className="flex min-h-0 flex-1 flex-col">{props.cart}</div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 ps-[max(16px,env(safe-area-inset-left))] select-none">
            {props.products}
          </main>
          <aside className="flex w-[min(26rem,45%)] shrink-0 flex-col border-0 border-s border-solid border-default pe-[env(safe-area-inset-right)]">
            {props.cart}
          </aside>
        </div>
      )}
    </div>
  )
}

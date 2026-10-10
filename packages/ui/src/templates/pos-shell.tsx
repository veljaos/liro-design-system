import { CloudUpload, LayoutGrid } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogBody, DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { EMPTY_SCAN_BUFFER, scanKey, type ScanOptions } from '../components/scan-logic'
import { OfflineIndicator } from '../components/shell-markers'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'

/*
 * PosShell (BUILD-PLAN P5.10; docs/decisions.md "Touch and POS"). The frame of a till: the whole
 * screen, no application header, no navigation (a till is one task), made for fingers.
 *
 * - **Kiosk-safe:** it fills its container (the application gives it the viewport, 100dvh);
 *   nothing scrolls the page (`overscroll-behavior: none`, so a swipe neither reloads nor goes
 *   back), double-tap zoom is off (`touch-action: manipulation`), the strip and the tiles cannot
 *   be selected by a long press, and the safe-area insets of an installed app are kept.
 * - **The strip on top** (not a header: no links): the brand (a prop, D18), the register and the
 *   cashier (a label above each value), what is being sent (a neutral "Sending…" badge and "3
 *   sales waiting to be sent") and the application's actions at the end. Offline, the
 *   OfflineIndicator stands under it with the queue (P5.3).
 * - **Landscape tablet first:** the product area at the start (scrolling), the cart panel at the
 *   end, 26rem (at most 45%), full height, its main action at the bottom within the thumb's reach.
 * - **Phone portrait (below 48em or `layout="phone"`): the cart first**, with "Products" above it
 *   opening the product area as a bottom sheet (85% of the height).
 * - **Scanner:** with `onScan`, a burst of keys anywhere on the screen (not in a field, which has
 *   its own ScanField) is read as a scan (`scanKey`) and reported; the Enter that ends it never
 *   presses the focused button.
 */

export interface PosShellProps {
  /** The brand at the start of the strip (BrandLockup, a logo), from the application (D18). */
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
  /** Phone: controlled open state of the products sheet. */
  productsOpen?: boolean
  /** Phone: the sheet open when it appears (a picture, a restored screen). */
  defaultProductsOpen?: boolean
  onProductsOpenChange?: (open: boolean) => void
  /** The products button's and sheet's title. Default: `messages['pos.products']`. */
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
  const [innerOpen, setInnerOpen] = useState(props.defaultProductsOpen ?? false)
  const productsOpen = props.productsOpen ?? innerOpen
  useScanListener(props.onScan, props.scanOptions)

  const queued = props.queued ?? 0
  const queueText =
    queued > 0
      ? (props.queuedText ?? messages['pos.queued'](queued, format.number(String(queued))))
      : null
  const productsLabel = props.productsLabel ?? messages['pos.products']
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
            <StatusBadge
              tone="neutral"
              withBorder
              icon={CloudUpload}
              label={messages['connection.sending']}
            />
            <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{queueText}</span>
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
      {phone ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <Sheet
            open={productsOpen}
            onOpenChange={(next) => {
              setInnerOpen(next)
              props.onProductsOpenChange?.(next)
            }}
          >
            <div className="shrink-0 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2">
              <SheetTrigger asChild>
                <ButtonPrimitive className="min-h-12 w-full text-md">
                  <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />
                  <span className={TEXT_DIRECTION}>{productsLabel}</span>
                </ButtonPrimitive>
              </SheetTrigger>
            </div>
            <SheetContent
              side="bottom"
              aria-describedby={undefined}
              className="h-[85%] rounded-t-lg pb-[env(safe-area-inset-bottom)]"
            >
              <DialogHeader>
                <DialogTitle>{productsLabel}</DialogTitle>
                <DialogCloseButton label={messages['dialog.close']} />
              </DialogHeader>
              <DialogBody className="select-none">{props.products}</DialogBody>
            </SheetContent>
          </Sheet>
          <main className="flex min-h-0 flex-1 flex-col">{props.cart}</main>
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

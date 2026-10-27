import { ReceiptText } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { useDebouncedCallback } from './combobox-logic'
import { DateText, MoneyText } from './display-text'
import { EmptyState } from './empty-state'
import { ScanField, type ScanFeedback } from './scan-field'
import { TextField } from './text-field'

/*
 * ReceiptFinder (P5.28 item 21d). Finding an issued receipt again — the original of a refund, the
 * receipt to copy or to cancel: **scan its code** (the QR printed on it; a scanner or the
 * camera), or **search** by its number, its date and its total. The application searches and
 * answers with the receipts found; the finder shows them and reports the one chosen. It
 * computes and matches nothing (D1, D4).
 * - The ScanField first (the fastest way: the receipt is in the customer's hand), then ONE search
 *   field, "Receipt number, date or total" (P5.93 item 14, the owner's fourth review: not three
 *   fields and a Search button). The text is reported as typed (`onSearch`, after 300ms of
 *   quiet, at once on Enter); the application reads it — a number, a day, an amount — and
 *   answers with the receipts found.
 * - The results as rows (CandidateList's look): the number (semibold, left to right), the date
 *   and time, the kind in the application's words, a detail ("2 lines refunded already"), the
 *   total at the end. A row is a button; the chosen one is the neutral selection with the 3px
 *   border.selected bar (D17). A receipt that cannot be chosen (refunded in full) stays focusable
 *   with its reason.
 * - Before a search nothing is listed; while searching, three skeleton rows; none found: the
 *   compact no-results EmptyState; the application's error in a danger Alert.
 */

/** A receipt the application found. */
export interface FoundReceipt {
  id: string
  /** Its number as printed. */
  number: string
  /** The day, YYYY-MM-DD. */
  date: string
  /** The time as the application writes it ("09:42"). */
  time?: string
  /** Its total, a decimal string. */
  total: string
  /** Its kind in the application's words ("Normal sale"). */
  kindLabel?: string
  /** A line under it ("2 lines refunded already"). */
  detail?: string
  /** Why it cannot be chosen ("Refunded in full on 06.10.2026."). */
  unavailableReason?: string
}

export interface ReceiptFinderProps {
  /** The currency of the amounts. */
  currency: string
  /** A code scanned (the receipt's QR, its number): the application finds the receipt. */
  onScan?: (code: string) => void
  /** The application's answer to a scan. */
  scanFeedback?: ScanFeedback | null
  /** Opens the camera to scan the code. */
  onCameraScan?: () => void
  /**
   * The text typed in the one search field (a receipt's number, a date or a total, as the cashier
   * writes it), trimmed; the application reads it and answers with `results`.
   */
  onSearch: (text: string) => void
  /** The search's starting text (a restored screen). */
  defaultSearch?: string
  /** Milliseconds of quiet before `onSearch` while typing. Default: 300. */
  searchDelay?: number
  /** The receipts found; undefined before a search. */
  results?: readonly FoundReceipt[]
  /** The application is searching. */
  loading?: boolean
  /** The search failed, in the application's words. */
  error?: string
  /** The chosen receipt's id. */
  chosenId?: string | null
  /** A receipt was chosen. */
  onChoose?: (id: string) => void
  className?: string
}

const ROW =
  'relative flex w-full items-start gap-3 border-0 border-b border-solid border-subtle bg-transparent p-3 text-start'
const CHOSEN =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** Scan a receipt's code or search by number, date and total; the application finds it. */
export function ReceiptFinder(props: ReceiptFinderProps) {
  const { messages } = useLiro()
  const reasonBase = useId()
  const [text, setText] = useState(props.defaultSearch ?? '')
  // The last text reported, so Enter and the pause after typing do not ask twice.
  const sent = useRef<string | null>(props.defaultSearch?.trim() ?? null)
  const search = (value: string) => {
    const query = value.trim()
    if (query === sent.current) return
    sent.current = query
    props.onSearch(query)
  }
  const searchLater = useDebouncedCallback(search, props.searchDelay ?? 300)
  const results = props.results
  return (
    <div
      data-slot="receipt-finder"
      className={cn('flex flex-col gap-4 font-sans', props.className)}
    >
      {props.onScan !== undefined && (
        <ScanField
          label={messages['receiptFinder.scan']}
          onScan={(code) => {
            props.onScan?.(code)
          }}
          feedback={props.scanFeedback ?? null}
          {...(props.onCameraScan === undefined ? {} : { onCameraScan: props.onCameraScan })}
        />
      )}
      <form
        role="search"
        aria-label={messages['receiptFinder.searchLabel']}
        onSubmit={(event) => {
          event.preventDefault()
          search(text)
        }}
      >
        <TextField
          type="search"
          direction="ltr"
          label={
            props.onScan === undefined
              ? messages['receiptFinder.searchLabel']
              : messages['receiptFinder.orSearch']
          }
          description={messages['receiptFinder.searchHint']}
          value={text}
          onChange={(value) => {
            setText(value)
            searchLater(value)
          }}
        />
      </form>
      {props.error !== undefined && <Alert tone="danger" title={props.error} />}
      {props.loading === true ? (
        <ul
          aria-busy="true"
          aria-label={messages['receiptFinder.results']}
          className="m-0 flex list-none flex-col gap-2 p-0"
        >
          {[0, 1, 2].map((index) => (
            <li key={index}>
              <Skeleton className="h-14 w-full" />
            </li>
          ))}
        </ul>
      ) : results === undefined || props.error !== undefined ? null : results.length === 0 ? (
        <EmptyState
          compact
          variant="no-results"
          title={messages['receiptFinder.none']}
          description={messages['receiptFinder.noneDescription']}
        />
      ) : (
        <ul
          aria-label={messages['receiptFinder.results']}
          className="m-0 list-none border-0 border-t border-solid border-subtle p-0"
        >
          {results.map((receipt, index) => {
            const chosen = receipt.id === props.chosenId
            const unavailable = receipt.unavailableReason !== undefined
            const reasonId = `${reasonBase}-${String(index)}`
            return (
              <li key={receipt.id}>
                <button
                  type="button"
                  aria-pressed={chosen}
                  aria-disabled={unavailable || undefined}
                  aria-describedby={unavailable ? reasonId : undefined}
                  onClick={() => {
                    if (!unavailable) props.onChoose?.(receipt.id)
                  }}
                  className={cn(
                    BUTTON_RESET,
                    FOCUS_RING,
                    ROW,
                    'cursor-pointer',
                    chosen ? CHOSEN : 'hover:bg-surface-hover',
                    unavailable && 'cursor-not-allowed hover:bg-transparent',
                  )}
                >
                  <ReceiptText
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-secondary"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <bdi
                      dir="ltr"
                      className={cn(
                        'text-sm font-semibold break-all',
                        unavailable ? 'text-secondary' : 'text-primary',
                      )}
                    >
                      {receipt.number}
                    </bdi>
                    <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
                      <DateText value={receipt.date} />
                      {receipt.time !== undefined && <bdi>{` ${receipt.time}`}</bdi>}
                      {receipt.kindLabel !== undefined && ` · ${receipt.kindLabel}`}
                    </span>
                    {receipt.detail !== undefined && (
                      <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
                        {receipt.detail}
                      </span>
                    )}
                    {unavailable && (
                      <span id={reasonId} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                        {receipt.unavailableReason}
                      </span>
                    )}
                  </span>
                  <MoneyText
                    value={receipt.total}
                    currency={props.currency}
                    className="shrink-0 text-sm font-semibold text-primary"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

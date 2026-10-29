import type { IconComponent } from './intents'
import { compareDecimal, isDecimal } from './quantity-logic'

/*
 * The pure logic of the till's sale flows (P5.28 items 21 and 22): the ways to pay as the
 * application offers them, the lines chosen with their quantities (a refund, a split bill, items
 * moved to another table), and the kind of a receipt. Nothing here adds, subtracts or rounds an
 * amount (D4); quantities are compared exactly as decimal strings (`compareDecimal`).
 */

/** The built-in ways to pay of P5.10, named by `messages['payment.<name>']`. */
export type PaymentMethod = 'cash' | 'card' | 'split'

/**
 * How a way to pay is taken:
 * - 'cash': the application's banknotes, the keypad and the change;
 * - 'card': a terminal's state (ready, waiting, declined, approved);
 * - 'qr': a code the customer scans with their own app (an instant payment), then its state;
 * - 'plain': an amount and, when the application asks, a reference (a cheque, a voucher, a wire
 *   transfer, another cashless way).
 */
export type PaymentKind = 'cash' | 'card' | 'qr' | 'plain'

/** A way to pay the application offers (P5.28): its id, words and kind. */
export interface PaymentOption {
  id: string
  /** In the application's words ("Cheque", "Voucher", "Instant payment"). */
  label: string
  kind: PaymentKind
  /** Default: the kind's icon. */
  icon?: IconComponent
  /**
   * Why it cannot be used now, in the application's words ("Needs the buyer's ID."). The method
   * can still be chosen: its panel shows the reason and the dialog's `extra` content (where the
   * application puts the field that resolves it).
   */
  unavailableReason?: string
  /** A rule under the method's panel, from the application ("Single-purpose vouchers only."). */
  note?: string
  /** Asks for a reference (a cheque number, a voucher code) under this label. */
  referenceLabel?: string
  /**
   * The most one payment of this way can take, a decimal string (a voucher's value), from the
   * application (P5.94 item 5). A part that is not cash can never be more than the remaining
   * amount either; only cash gives change.
   */
  maxAmount?: string
  /** Why `maxAmount` is the limit, in the application's words ("The voucher is worth 2.000,00 RSD."). */
  maxReason?: string
}

/** The options of the built-in methods, in the provider's words. */
export function paymentOptions(
  methods: readonly (PaymentMethod | PaymentOption)[],
  labels: Record<PaymentMethod, string>,
): PaymentOption[] {
  return methods.map((method) =>
    typeof method === 'string'
      ? {
          id: method,
          label: labels[method],
          kind: method === 'card' ? 'card' : method === 'cash' ? 'cash' : 'plain',
        }
      : method,
  )
}

/** Whether the application offers its own options (P5.28) rather than the P5.10 names only. */
export function hasOwnOptions(methods: readonly (PaymentMethod | PaymentOption)[]): boolean {
  return methods.some((method) => typeof method !== 'string')
}

// ── Lines chosen with their quantities ────────────────────────────────────────────────────

/** A quantity chosen per line id; null or absent is none. */
export type ChosenQuantities = Readonly<Record<string, string | null>>

/** Whether a chosen quantity is more than zero (exactly, as decimal strings). */
export function isChosen(quantity: string | null | undefined): boolean {
  return (
    quantity !== null &&
    quantity !== undefined &&
    isDecimal(quantity) &&
    compareDecimal(quantity, '0') > 0
  )
}

/** The ids of the lines chosen, in the lines' order. */
export function chosenLineIds(
  lines: readonly { id: string }[],
  chosen: ChosenQuantities,
): string[] {
  return lines.filter((line) => isChosen(chosen[line.id])).map((line) => line.id)
}

/** A line's quantity when its box is ticked (all of what is available) or cleared (none). */
export function toggleLine(
  chosen: ChosenQuantities,
  line: { id: string; available: string },
  on: boolean,
): Record<string, string | null> {
  return { ...chosen, [line.id]: on ? line.available : null }
}

/** Every line that can be chosen at its whole quantity, or none of them. */
export function chooseAllLines(
  lines: readonly { id: string; available: string; unavailableReason?: string }[],
  on: boolean,
): Record<string, string | null> {
  const next: Record<string, string | null> = {}
  for (const line of lines) {
    next[line.id] = on && line.unavailableReason === undefined ? line.available : null
  }
  return next
}

/** Whether every line that can be chosen is chosen at its whole quantity. */
export function allLinesChosen(
  lines: readonly { id: string; available: string; unavailableReason?: string }[],
  chosen: ChosenQuantities,
): boolean {
  const open = lines.filter((line) => line.unavailableReason === undefined)
  return (
    open.length > 0 &&
    open.every((line) => {
      const quantity = chosen[line.id]
      return (
        quantity !== null &&
        quantity !== undefined &&
        isDecimal(quantity) &&
        compareDecimal(quantity, line.available) === 0
      )
    })
  )
}

/** Whether a chosen quantity is more than the line has (kept and shown as the stepper's error). */
export function exceedsAvailable(quantity: string | null | undefined, available: string): boolean {
  return (
    quantity !== null &&
    quantity !== undefined &&
    isDecimal(quantity) &&
    compareDecimal(quantity, available) > 0
  )
}

// ── The kind of a receipt ─────────────────────────────────────────────────────────────────

/** A kind the application offers: a type of receipt or a transaction (P5.28 item 21a). */
export interface ReceiptKindOption {
  id: string
  /** In the application's words ("Normal", "Proforma", "Refund"). */
  label: string
  /** What it is for, a line under the choice. */
  description?: string
  /**
   * The words that mark a kind that is not a real sale ("Proforma — not a fiscal receipt"), shown
   * on the screen and printed on the receipt. From the application's data.
   */
  marker?: string
  /** Why it cannot be chosen now (focusable, with the reason). */
  unavailableReason?: string
}

/** The marker of the chosen type or transaction (the type's first), or undefined. */
export function kindMarker(
  types: readonly ReceiptKindOption[],
  transactions: readonly ReceiptKindOption[],
  typeId: string | undefined,
  transactionId: string | undefined,
): string | undefined {
  return (
    types.find((each) => each.id === typeId)?.marker ??
    transactions.find((each) => each.id === transactionId)?.marker
  )
}

// ── A part of a payment and its limit (P5.94 item 5) ──────────────────────────────────────

/** Why an amount cannot be one part of a way to pay: over what remains, or over the way's limit. */
export type PartOverLimit =
  { reason: 'remaining'; limit: string } | { reason: 'option'; limit: string; words?: string }

/**
 * Whether `amount` can be one part of a payment by `option`, compared exactly as decimal strings
 * (D4). Cash may be more than what remains (it gives change); every other way at most the
 * remaining amount and the way's own `maxAmount` (a voucher's value). Null when it can; an
 * unreadable amount or remaining amount is the application's to judge, so null too.
 */
export function partOverLimit(
  option: Pick<PaymentOption, 'kind' | 'maxAmount' | 'maxReason'>,
  amount: string | null,
  remaining: string | null | undefined,
): PartOverLimit | null {
  if (option.kind === 'cash' || amount === null || !isDecimal(amount)) return null
  if (
    option.maxAmount !== undefined &&
    isDecimal(option.maxAmount) &&
    compareDecimal(amount, option.maxAmount) > 0 &&
    (remaining === null ||
      remaining === undefined ||
      !isDecimal(remaining) ||
      compareDecimal(option.maxAmount, remaining) <= 0)
  ) {
    return {
      reason: 'option',
      limit: option.maxAmount,
      ...(option.maxReason === undefined ? {} : { words: option.maxReason }),
    }
  }
  if (
    remaining !== null &&
    remaining !== undefined &&
    isDecimal(remaining) &&
    compareDecimal(amount, remaining) > 0
  ) {
    return { reason: 'remaining', limit: remaining }
  }
  return null
}

/** Whether something is still to pay: the remaining amount is more than zero, exactly. */
export function stillToPay(remaining: string | null | undefined): boolean {
  return (
    remaining !== null &&
    remaining !== undefined &&
    isDecimal(remaining) &&
    compareDecimal(remaining, '0') > 0
  )
}

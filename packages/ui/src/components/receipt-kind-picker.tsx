import { useId, useState } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import type { ReceiptKindOption } from './sale-logic'

/*
 * ReceiptKindPicker. The kind of a receipt is two choices the application
 * offers: its **type** (in Serbia: Normal, Advance, Proforma, Copy, Training) and its
 * **transaction** (Sale, Refund). The ids, words, descriptions, which kinds are not a real sale
 * and the words that mark them are the application's data; the picker shows them and
 * reports the pair.
 * - Two groups of 44px pressed buttons, each named by its label above it (`typeLabel`,
 *   `transactionLabel`); the pressed one is the neutral selection (surface.selected with a
 *   border.selected border), never blue. They wrap.
 * - A kind that cannot be chosen now stays focusable (`aria-disabled`) with its reason under the
 *   group, linked by `aria-describedby` (a copy needs an original receipt; a refund is opened from
 *   the original).
 * - Under the groups: the chosen type's description, and its **marker** in a warning Alert
 *   ("Proforma — not a fiscal receipt"): a kind that is not a sale is never chosen silently.
 * The application shows the same marker on the cart (CartPanel `marker`); the printed receipt
 * (liro-folio's) carries it too; a training mode also gets PosShell's banner.
 */

export interface ReceiptKindPickerProps {
  /** The receipt's types, in the application's order. */
  types: readonly ReceiptKindOption[]
  /** The transactions, in the application's order. */
  transactions: readonly ReceiptKindOption[]
  /** Controlled type id. */
  type?: string
  /** Uncontrolled initial type. Default: the first. */
  defaultType?: string
  /** Controlled transaction id. */
  transaction?: string
  /** Uncontrolled initial transaction. Default: the first. */
  defaultTransaction?: string
  /** Reports the chosen pair. */
  onChange?: (type: string, transaction: string) => void
  /** Default: `messages['receiptKind.type']`. */
  typeLabel?: string
  /** Default: `messages['receiptKind.transaction']`. */
  transactionLabel?: string
  className?: string
}

function Group({
  label,
  options,
  value,
  onChoose,
}: {
  label: string
  options: readonly ReceiptKindOption[]
  value: string | undefined
  onChoose: (id: string) => void
}) {
  const { messages } = useLiro()
  const reasonText = messages['receiptKind.unavailable']
  const labelId = useId()
  const reasonBase = useId()
  const blocked = options.filter((option) => option.unavailableReason !== undefined)
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const pressed = option.id === value
          const unavailable = option.unavailableReason !== undefined
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={pressed}
              aria-disabled={unavailable || undefined}
              aria-describedby={unavailable ? `${reasonBase}-${String(index)}` : undefined}
              onClick={() => {
                if (!unavailable) onChoose(option.id)
              }}
              className={cn(
                BUTTON_RESET,
                FOCUS_RING,
                'inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-solid px-4 text-sm font-medium',
                pressed
                  ? 'border-selected bg-surface-selected text-primary'
                  : 'border-default bg-surface-raised text-primary hover:bg-surface-hover',
                unavailable &&
                  'cursor-not-allowed border-transparent bg-surface-disabled text-disabled hover:bg-surface-disabled',
              )}
            >
              <span className={TEXT_ISOLATE}>{option.label}</span>
            </button>
          )
        })}
      </div>
      {blocked.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {options.map((option, index) =>
            option.unavailableReason === undefined ? null : (
              <li
                key={option.id}
                id={`${reasonBase}-${String(index)}`}
                className={cn('text-xs text-secondary', TEXT_DIRECTION)}
              >
                {reasonText(option.label, option.unavailableReason)}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}

/** The receipt's type and transaction, from the application's kinds. */
export function ReceiptKindPicker(props: ReceiptKindPickerProps) {
  const liro = useLiro()
  const [innerType, setInnerType] = useState(props.defaultType ?? props.types[0]?.id ?? '')
  const [innerTransaction, setInnerTransaction] = useState(
    props.defaultTransaction ?? props.transactions[0]?.id ?? '',
  )
  const type = props.type ?? innerType
  const transaction = props.transaction ?? innerTransaction
  const chosenType = props.types.find((each) => each.id === type)
  const chosenTransaction = props.transactions.find((each) => each.id === transaction)
  const marker = chosenType?.marker ?? chosenTransaction?.marker
  return (
    <div
      data-slot="receipt-kind-picker"
      className={cn('flex flex-col gap-4 font-sans', props.className)}
    >
      <Group
        label={props.typeLabel ?? liro.messages['receiptKind.type']}
        options={props.types}
        value={type}
        onChoose={(id) => {
          setInnerType(id)
          props.onChange?.(id, transaction)
        }}
      />
      <Group
        label={props.transactionLabel ?? liro.messages['receiptKind.transaction']}
        options={props.transactions}
        value={transaction}
        onChoose={(id) => {
          setInnerTransaction(id)
          props.onChange?.(type, id)
        }}
      />
      {(chosenType?.description !== undefined || chosenTransaction?.description !== undefined) && (
        <div className="flex flex-col gap-1">
          {chosenType?.description !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {chosenType.description}
            </p>
          )}
          {chosenTransaction?.description !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {chosenTransaction.description}
            </p>
          )}
        </div>
      )}
      {marker !== undefined && <Alert tone="warning" title={marker} />}
    </div>
  )
}

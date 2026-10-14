import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLangAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'

/*
 * PaymentOrderForm (P5.40): a bank's paper payment order as its real form — the slip a payer
 * fills in, prints or hands over: in Serbia the payment order (nalog za uplatu, form 1), the
 * withdrawal order (nalog za isplatu, form 2) and the transfer order (nalog za prenos, form 3).
 * An official form is its real grid (D28), so this printout has its boxes, unlike a business
 * document (D27).
 *
 * - **Two halves:** at the start the parties, top to bottom (`parties`: payer, purpose, payee,
 *   each a box of its lines) and the lines to sign under them (`signatures`: "Stamp and signature
 *   of the payer", "Place and date of receipt", "Value date"); at the end the title, then one row
 *   of the payment code, the currency and the amount, then each account with its model and
 *   reference number (`accounts`: one on a payment or withdrawal order, the debtor's and the
 *   creditor's on a transfer order), "Urgent" where the form has it.
 * - **Every word is the application's** (labels and values; the official forms are in Serbian,
 *   `lang` says so). The amount is a decimal string written through `format` (never rounded,
 *   D4), tabular; accounts and references stay left to right in every direction.
 * - **The QR code** (`qrCode`, e.g. QrCode with `ipsQrText`'s IPS text) stands at the end under
 *   the accounts, with its caption.
 * - **Paper is always light** (as PrintPage): the slip carries the light theme, black rules on
 *   white, in both themes. It fills its container's width (a PrintPage's text area, or a preview);
 *   on paper it never splits between pages.
 *
 * When not: an invoice's payment details (PrintDocument's payment block with the QR slot); a bank
 * transfer the application sends itself (a form of fields, not a slip).
 */

/** One labelled box. */
export interface PaymentOrderField {
  label: string
  value?: string | undefined
}

/** A party's box: its lines (a name and an address, a purpose). */
export interface PaymentOrderParty extends PaymentOrderField {
  /** The box's height in lines. Default 3. */
  lines?: number
}

/** An account with its model and reference number. */
export interface PaymentOrderAccount {
  account: PaymentOrderField
  model?: PaymentOrderField
  reference?: PaymentOrderField
}

export interface PaymentOrderFormProps {
  /** The form's title ("NALOG ZA UPLATU"). */
  title: string
  /** The boxes at the start, top to bottom. */
  parties: readonly PaymentOrderParty[]
  paymentCode: PaymentOrderField
  currency: PaymentOrderField
  /** The amount: `value` a decimal string ("294000.00"). */
  amount: PaymentOrderField
  /** The accounts at the end, each with its model and reference number. */
  accounts: readonly PaymentOrderAccount[]
  /** "Urgent", where the form has it. */
  urgent?: { label: string; checked: boolean }
  /** The lines to sign or fill in under the parties. */
  signatures?: readonly string[]
  /** The QR code at the end (an IPS QR code). */
  qrCode?: ReactNode
  qrCaption?: string
  /** The language of the form's texts ("sr-Latn"). */
  lang?: string
  className?: string
}

const LABEL = 'text-[10px] leading-tight text-secondary'
const BOX = 'border border-solid border-strong px-1.5 py-1 text-sm leading-snug text-primary'

function Box({
  field,
  lines = 1,
  numeric = false,
  className,
}: {
  field: PaymentOrderField
  lines?: number
  numeric?: boolean
  className?: string | undefined
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <dt className={cn(LABEL, TEXT_DIRECTION)}>{field.label}</dt>
      <dd
        className={cn(
          BOX,
          'm-0 whitespace-pre-line',
          numeric ? cn('tabular-nums', TEXT_ISOLATE) : TEXT_DIRECTION,
        )}
        style={{ minHeight: `calc(${String(lines)}lh + 10px)` }}
        {...(numeric ? { dir: 'ltr' } : {})}
      >
        {field.value ?? ''}
      </dd>
    </div>
  )
}

/** A payment order as its paper form: parties at the start, figures and accounts at the end. */
export function PaymentOrderForm(props: PaymentOrderFormProps) {
  const { format } = useLiro()
  const lang = useLangAttribute(props.lang)
  const amount =
    props.amount.value === undefined || props.amount.value === ''
      ? ''
      : format.number(props.amount.value)
  return (
    <section
      data-slot="payment-order"
      data-liro-theme="light"
      aria-label={props.title}
      {...lang}
      className={cn(
        'box-border grid w-full grid-cols-2 gap-x-4 bg-surface-raised p-4 font-sans text-primary [color-scheme:light] break-inside-avoid',
        props.className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 border-0 border-e border-solid border-strong pe-4">
        <dl className="m-0 flex flex-col gap-2">
          {props.parties.map((party, index) => (
            <Box key={index} field={party} lines={party.lines ?? 3} />
          ))}
        </dl>
        {props.signatures !== undefined && props.signatures.length > 0 && (
          <div className="mt-auto flex flex-col gap-3 pt-2">
            {props.signatures.map((signature) => (
              <div
                key={signature}
                className={cn(
                  'border-0 border-t border-solid border-strong pt-0.5',
                  LABEL,
                  TEXT_DIRECTION,
                )}
              >
                {signature}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className={cn('m-0 text-sm font-bold tracking-wide text-primary', TEXT_DIRECTION)}>
            {props.title}
          </h2>
          {props.urgent !== undefined && (
            <span className={cn('flex items-center gap-1', LABEL)}>
              <span
                role="checkbox"
                aria-checked={props.urgent.checked}
                aria-readonly="true"
                aria-label={props.urgent.label}
                className="flex size-3.5 items-center justify-center border border-solid border-strong text-[10px] leading-none text-primary"
              >
                {props.urgent.checked && <X aria-hidden="true" className="size-3" />}
              </span>
              <span aria-hidden="true" className={TEXT_DIRECTION}>
                {props.urgent.label}
              </span>
            </span>
          )}
        </div>
        <dl className="m-0 grid grid-cols-[4.5rem_4rem_minmax(0,1fr)] gap-2">
          <Box field={props.paymentCode} numeric />
          <Box field={props.currency} numeric />
          <Box field={{ label: props.amount.label, value: amount }} numeric />
        </dl>
        {props.accounts.map((account, index) => (
          <dl key={index} className="m-0 flex flex-col gap-1">
            <Box field={account.account} numeric />
            {(account.model !== undefined || account.reference !== undefined) && (
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
                {account.model !== undefined && <Box field={account.model} numeric />}
                {account.reference !== undefined && (
                  <Box
                    field={account.reference}
                    numeric
                    className={account.model === undefined ? 'col-span-2' : undefined}
                  />
                )}
              </div>
            )}
          </dl>
        ))}
        {props.qrCode !== undefined && (
          <figure
            data-slot="payment-order-code"
            className="m-0 mt-auto flex flex-col items-end gap-1 self-end"
          >
            <div className="size-[30mm] [&>*]:size-full">{props.qrCode}</div>
            {props.qrCaption !== undefined && (
              <figcaption className={cn(LABEL, TEXT_ISOLATE)}>{props.qrCaption}</figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  )
}

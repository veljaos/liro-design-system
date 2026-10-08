import { CircleAlert, CircleCheck, CircleHelp } from 'lucide-react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { SettlingValue } from './settling-value'
import { usePhone } from './use-phone'

/*
 * BalanceBar (BUILD-PLAN P5.21, "Balanced entry"): the Debit / Credit / Difference of a journal
 * entry, always in view — in EditableGrid's `footer` (beside "Add line" on desktop; in the totals
 * card sticky at the top on phones).
 * - The three amounts come from the application (decimal strings, computed by the Core; nothing
 *   is added here) and are shown with SettlingValue, as the grid's totals: tabular, the width
 *   reserved, the confirmed value still while a new one is computed (`pending`).
 * - The state comes from the application too (`state`): whether an entry balances is the Core's
 *   rule. Balanced: a CircleCheck and "Balanced" in status.success.fg. Not balanced: the
 *   difference and the words "Not balanced" in status.danger.fg with CircleAlert — words and tone,
 *   never colour alone. Incomplete (an amount is missing or cannot be read — Appendix B.4, never
 *   counted as 0): the difference "—" and "Amounts missing" in text.secondary with CircleHelp; the
 *   grid's own message under the row says which. The state's words are a polite live region, so a
 *   change is heard once.
 * - Posting is the application's: while the entry is not balanced it shows its post action as an
 *   UnavailableAction with the Core's reason (see the stories); the bar only shows the state.
 * - Layout 'row' (desktop): one wrapping row, label and value on one baseline, 24px apart; layout
 *   'stacked' (phones): label at the start and value at the end, one line each, as the grid's phone
 *   totals, the state under them. Default by the viewport (48em).
 */

export type BalanceState = 'balanced' | 'unbalanced' | 'incomplete'

export interface BalanceBarProps {
  /** The sum of the debit amounts, from the application (a decimal string); null shows "—". */
  debit: string | null
  /** The sum of the credit amounts, from the application. */
  credit: string | null
  /** Debit less credit, from the application; null while the balance is not known. */
  difference: string | null
  /** Whether the entry balances, decided by the application (the Core's rule). */
  state: BalanceState
  /** The currency of the amounts; without it they are numbers. */
  currency?: string
  /** Decimals, as MoneyText (never rounded). */
  decimals?: number
  /** New sums are being computed: the confirmed ones stay, with SettlingValue's quiet dot. */
  pending?: boolean
  /** 'row' or 'stacked'; default by the viewport (stacked below 48em). */
  layout?: 'row' | 'stacked'
  className?: string
}

/** Literal classes, so Tailwind finds them. */
const STATE = {
  balanced: { Icon: CircleCheck, text: 'text-status-success-fg' },
  unbalanced: { Icon: CircleAlert, text: 'text-status-danger-fg' },
  incomplete: { Icon: CircleHelp, text: 'text-secondary' },
} as const

/** The debit, credit and difference of an entry, and whether it balances. */
export function BalanceBar(props: BalanceBarProps) {
  const { messages } = useLiro()
  const phone = usePhone()
  const stacked = props.layout === undefined ? phone : props.layout === 'stacked'
  const state = STATE[props.state]
  const amount = (value: string | null) => (
    <SettlingValue
      value={value}
      {...(props.pending === undefined ? {} : { pending: props.pending })}
      {...(props.currency === undefined ? {} : { currency: props.currency })}
      {...(props.decimals === undefined ? {} : { decimals: props.decimals })}
    />
  )
  const items = [
    { key: 'debit', label: messages['balance.debit'], value: props.debit, tone: '' },
    { key: 'credit', label: messages['balance.credit'], value: props.credit, tone: '' },
    {
      key: 'difference',
      label: messages['balance.difference'],
      value: props.state === 'incomplete' ? null : props.difference,
      tone: props.state === 'unbalanced' ? state.text : '',
    },
  ]
  const words =
    props.state === 'balanced'
      ? messages['balance.balanced']
      : props.state === 'unbalanced'
        ? messages['balance.unbalanced']
        : messages['balance.incomplete']
  return (
    <div
      role="group"
      aria-label={messages['balance.label']}
      data-slot="balance-bar"
      data-state={props.state}
      className={cn(
        'flex font-sans text-sm text-primary',
        stacked ? 'flex-col gap-1' : 'flex-wrap items-baseline gap-x-6 gap-y-1',
        props.className,
      )}
    >
      <dl className={cn('m-0 flex', stacked ? 'flex-col gap-1' : 'flex-wrap gap-x-6 gap-y-1')}>
        {items.map((item) => (
          <div
            key={item.key}
            className={cn('flex items-baseline gap-2', stacked && 'justify-between gap-4')}
          >
            <dt className={cn('text-secondary', TEXT_DIRECTION)}>{item.label}</dt>
            <dd className={cn('m-0 font-semibold', item.tone)}>{amount(item.value)}</dd>
          </div>
        ))}
      </dl>
      <p role="status" className={cn('m-0 flex items-center gap-1.5 font-semibold', state.text)}>
        <state.Icon aria-hidden="true" className="size-4 shrink-0" />
        <span className={TEXT_DIRECTION}>{words}</span>
      </p>
    </div>
  )
}

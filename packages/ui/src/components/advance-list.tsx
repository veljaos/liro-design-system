import { Undo2 } from 'lucide-react'
import { useId, useState } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { Checkbox } from '../primitives/checkbox'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { Tooltip } from './popover'
import { Alert } from './alert'
import { MoneyText } from './display-text'
import { SettlingValue } from './settling-value'
import { StatusBadge, type Tone } from './status-badge'

/*
 * AdvanceList: a buyer's open advance payments, to close on the final sale or
 * to refund. The advances, what was paid and what is still open, and the figure deducted from the
 * sale are the application's (the list adds nothing).
 * - A heading (h3 by default) with the count, then a row per advance (CandidateList's look): with
 *   `onSelectionChange` a checkbox at the start (chosen = deducted from this sale, the neutral
 *   selection); the number (left to right, semibold), the day it was paid, its state in
 *   words (a badge in the application's tone), the application's note; at the end what is open
 *   (semibold) and what was paid; with `onRefund` a "Refund advance <number>" button (neutral
 *   menu, 44px).
 * - Under the rows the application's figure for the chosen ones (`chosenTotal`, "Deducted",
 *   settling while `pending`).
 * - Loading: three skeleton rows; none: the application's words (`emptyText`); an error in a
 *   danger Alert.
 */

/** An advance payment the application keeps. */
export interface AdvanceItem {
  id: string
  /** The advance receipt's number as printed. */
  number: string
  /** The day it was paid, YYYY-MM-DD. */
  date: string
  /** What was paid, a decimal string. */
  paid: string
  /** What is still open, a decimal string. */
  open: string
  /** Its state in the application's words and tone ("Partly used", warning). */
  state?: { label: string; tone: Tone }
  /** The application's note ("For the order of 12 cakes"). */
  note?: string
  /** Why it cannot be used on this sale ("Another buyer's advance"). */
  unavailableReason?: string
}

export interface AdvanceListProps {
  advances: readonly AdvanceItem[]
  currency: string
  /** Default: `messages['advances.title']`. */
  title?: string
  /** The heading's level. Default 3. */
  headingLevel?: 2 | 3 | 4
  /** Controlled chosen ids. */
  selected?: readonly string[]
  /** Uncontrolled initial choice. */
  defaultSelected?: readonly string[]
  /** Makes the rows choosable: the advances deducted from this sale. */
  onSelectionChange?: (ids: string[]) => void
  /** Adds a refund button to each row. */
  onRefund?: (id: string) => void
  /** The application's figure for the chosen advances, a decimal string. */
  chosenTotal?: string | null
  /** Default: `messages['advances.chosenTotal']`. */
  chosenTotalLabel?: string
  /** The application is computing the figure. */
  pending?: boolean
  loading?: boolean
  /** The application's words when the buyer has none. Default: `messages['advances.empty']`. */
  emptyText?: string
  /** The application's error. */
  error?: string
  className?: string
}

const ROW = 'relative flex items-start gap-3 border-0 border-b border-solid border-subtle p-3'
const CHOSEN =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** A buyer's open advances: close them on this sale, or refund one. */
export function AdvanceList(props: AdvanceListProps) {
  const { messages, format } = useLiro()
  const base = useId()
  const titleId = useId()
  const [inner, setInner] = useState<readonly string[]>(props.defaultSelected ?? [])
  const selected = props.selected ?? inner
  const choosable = props.onSelectionChange !== undefined
  const Heading = `h${String(props.headingLevel ?? 3)}` as 'h2' | 'h3' | 'h4'
  const count = props.advances.length
  const choose = (id: string, on: boolean) => {
    const set = new Set(selected)
    if (on) set.add(id)
    else set.delete(id)
    const next = props.advances.map((each) => each.id).filter((each) => set.has(each))
    setInner(next)
    props.onSelectionChange?.(next)
  }
  return (
    <section
      aria-labelledby={titleId}
      data-slot="advance-list"
      className={cn('flex min-w-0 flex-col gap-2 font-sans', props.className)}
    >
      <Heading
        id={titleId}
        className={cn('m-0 flex flex-wrap items-baseline gap-2 text-sm font-semibold text-primary')}
      >
        <span className={TEXT_DIRECTION}>{props.title ?? messages['advances.title']}</span>
        {props.loading !== true && count > 0 && (
          <span className={cn('text-xs font-regular text-secondary', TEXT_ISOLATE)}>
            {messages['advances.count'](count, format.number(String(count)))}
          </span>
        )}
      </Heading>
      {props.error !== undefined ? (
        <Alert tone="danger" title={props.error} />
      ) : props.loading === true ? (
        <div aria-busy="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : count === 0 ? (
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          {props.emptyText ?? messages['advances.empty']}
        </p>
      ) : (
        <ul className="m-0 list-none border-0 border-t border-solid border-subtle p-0">
          {props.advances.map((advance, index) => {
            const id = `${base}-${String(index)}`
            const chosen = choosable && selected.includes(advance.id)
            const unavailable = advance.unavailableReason !== undefined
            const body = (
              <span className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <bdi dir="ltr" className="text-sm font-semibold break-all text-primary">
                    {advance.number}
                  </bdi>
                  <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
                    {messages['advances.paidOn'](format.date(advance.date))}
                  </span>
                  {advance.note !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {advance.note}
                    </span>
                  )}
                  {unavailable && (
                    <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
                      {advance.unavailableReason}
                    </span>
                  )}
                  {advance.state !== undefined && (
                    <span className="mt-1 flex">
                      <StatusBadge label={advance.state.label} tone={advance.state.tone} />
                    </span>
                  )}
                </span>
                <span className="ms-auto flex shrink-0 flex-col items-end gap-0.5">
                  <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
                    {messages['advances.open']}
                  </span>
                  <MoneyText
                    value={advance.open}
                    currency={props.currency}
                    className="text-sm font-semibold text-primary"
                  />
                  <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                    {messages['advances.paid'](format.money(advance.paid, props.currency))}
                  </span>
                </span>
              </span>
            )
            return (
              <li key={advance.id} className={cn(ROW, chosen && CHOSEN)}>
                {choosable ? (
                  <>
                    <Checkbox
                      id={id}
                      className="mt-0.5"
                      checked={chosen}
                      disabled={unavailable}
                      onCheckedChange={(checked) => {
                        choose(advance.id, checked === true)
                      }}
                      aria-label={messages['advances.choose'](advance.number)}
                    />
                    <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer">
                      {body}
                    </label>
                  </>
                ) : (
                  body
                )}
                {props.onRefund !== undefined && (
                  <Tooltip label={messages['advances.refund'](advance.number)}>
                    <ButtonPrimitive
                      family="neutral"
                      emphasis="menu"
                      shape="icon"
                      aria-label={messages['advances.refund'](advance.number)}
                      className="size-11 shrink-0 px-0"
                      onClick={() => {
                        props.onRefund?.(advance.id)
                      }}
                    >
                      <Undo2 aria-hidden="true" className="size-4" />
                    </ButtonPrimitive>
                  </Tooltip>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {props.chosenTotal !== undefined && count > 0 && (
        <dl className="m-0 flex items-baseline justify-between gap-4 pt-1">
          <dt className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {props.chosenTotalLabel ?? messages['advances.chosenTotal']}
          </dt>
          <dd className="m-0 text-md font-semibold text-primary">
            <SettlingValue
              value={props.chosenTotal}
              currency={props.currency}
              pending={props.pending === true}
            />
          </dd>
        </dl>
      )}
    </section>
  )
}

import { CircleCheck, CircleX, CloudUpload, ExternalLink, Send } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { IconComponent } from './intents'
import { Spinner } from './spinner'
import { TextField } from './text-field'

/*
 * ReceiptResult (P5.28 item 21g). What came back when a receipt was issued, and how it reaches
 * the customer. Every fact and word is the application's (D1, D2): the processor's number and
 * time, the counter, the receipt's code (a QR image) and its link; whether it is waiting to be
 * sent (offline, item 21h).
 * - The outcome on top: a success check with "Receipt issued" (`title`), or, with
 *   `tone="waiting"`, a neutral CloudUpload with the application's words ("Issued offline, waiting
 *   to be sent") — never blue; then the application's `text`.
 * - The facts as a list (label start, value end, tabular, left to right) and, beside them from
 *   30rem, the code (`code`) on a white tile with its caption; the link (`link`) under them, left
 *   to right, opening in a new tab.
 * - **Delivery** (`deliveries`): a row per way the application offers — print, e-mail, SMS, a link
 *   to copy — each with its own address field when it needs one (e-mail, telephone; left to
 *   right), its action (neutral) and its state in words with an icon: sending (a spinner), sent,
 *   failed (danger) with the application's words. `onDeliver(id, address)` reports it; the
 *   application sends and answers with the state.
 */

/** One fact of the issued receipt (the processor's number, its time, the counter), as given. */
export interface ReceiptFact {
  id: string
  label: string
  value: string
}

/** A way the receipt reaches the customer, from the application. */
export interface ReceiptDelivery {
  id: string
  /** Its name ("E-mail", "SMS", "Print"). */
  label: string
  icon?: IconComponent
  /** The action's words ("Send by e-mail"). Default: `label`. */
  actionLabel?: string
  /** It needs an address first: an e-mail or a telephone number. */
  address?: { label: string; type: 'email' | 'tel'; defaultValue?: string }
  /** Where it stands. Default 'idle'. */
  state?: 'idle' | 'sending' | 'sent' | 'failed'
  /** The state in the application's words ("Sent to ana@example.com", "The printer is out of paper"). */
  stateText?: string
}

export interface ReceiptResultProps {
  /** Default: `messages['receiptResult.title']` ('issued') or `['receiptResult.waiting']`. */
  title?: string
  /** 'issued' (default) or 'waiting': kept on the device until it can be sent. */
  tone?: 'issued' | 'waiting'
  /** A line under the title, from the application. */
  text?: string
  /** The issued receipt's facts (the processor's number and time, the counter), as given. */
  facts: readonly ReceiptFact[]
  /** The receipt's code (a QR image), from the application. */
  code?: ReactNode
  /** The code's caption. Default: `messages['receiptResult.code']`. */
  codeLabel?: string
  /** The receipt's link (to check it, or to see it online). */
  link?: { href: string; label: string }
  deliveries?: readonly ReceiptDelivery[]
  /** A way was chosen, with its address when it needs one. */
  onDeliver?: (id: string, address: string | null) => void
  /** The heading's level. Default 3. */
  headingLevel?: 2 | 3 | 4
  className?: string
}

const STATE_ICON = { sent: CircleCheck, failed: CircleX } as const

/** The issued receipt's facts, its code and link, and how it reaches the customer. */
export function ReceiptResult(props: ReceiptResultProps) {
  const { messages } = useLiro()
  const titleId = useId()
  const waiting = props.tone === 'waiting'
  const level = props.headingLevel ?? 3
  const Heading = `h${String(level)}` as 'h2' | 'h3' | 'h4'
  const SubHeading = `h${String(level + 1)}` as 'h3' | 'h4' | 'h5'
  const Mark = waiting ? CloudUpload : CircleCheck
  return (
    <section
      aria-labelledby={titleId}
      data-slot="receipt-result"
      className={cn('flex min-w-0 flex-col gap-4 font-sans @container', props.className)}
    >
      <div className="flex items-start gap-3">
        <Mark
          aria-hidden="true"
          className={cn(
            'mt-0.5 size-6 shrink-0',
            waiting ? 'text-status-neutral-fg' : 'text-status-success-fg',
          )}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <Heading
            id={titleId}
            className={cn('m-0 text-h4 font-semibold text-primary', TEXT_DIRECTION)}
          >
            {props.title ??
              (waiting ? messages['receiptResult.waiting'] : messages['receiptResult.title'])}
          </Heading>
          {props.text !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.text}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4 @[30rem]:flex-row @[30rem]:items-start">
        <dl className="m-0 flex min-w-0 flex-1 flex-col border-0 border-t border-solid border-subtle">
          {props.facts.map((fact) => (
            <div
              key={fact.id}
              className="flex items-baseline justify-between gap-4 border-0 border-b border-solid border-subtle py-2 text-sm"
            >
              <dt className={cn('text-secondary', TEXT_DIRECTION)}>{fact.label}</dt>
              <dd className="m-0 text-end font-medium break-all text-primary tabular-nums">
                <bdi dir="ltr">{fact.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        {props.code !== undefined && (
          <figure className="m-0 flex shrink-0 flex-col items-center gap-1 self-center">
            <div className="rounded-md border border-solid border-default bg-surface-raised p-2">
              {props.code}
            </div>
            <figcaption className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
              {props.codeLabel ?? messages['receiptResult.code']}
            </figcaption>
          </figure>
        )}
      </div>
      {props.link !== undefined && (
        <p className="m-0 flex items-center gap-2 text-sm">
          <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-secondary" />
          <a
            href={props.link.href}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 break-all text-link underline-offset-2 hover:underline"
          >
            <bdi dir="ltr">{props.link.label}</bdi>
          </a>
        </p>
      )}
      {props.deliveries !== undefined && props.deliveries.length > 0 && (
        <div className="flex flex-col gap-2">
          <SubHeading className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {messages['receiptResult.deliver']}
          </SubHeading>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {props.deliveries.map((delivery) => (
              <DeliveryRow key={delivery.id} delivery={delivery} onDeliver={props.onDeliver} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function DeliveryRow({
  delivery,
  onDeliver,
}: {
  delivery: ReceiptDelivery
  onDeliver: ((id: string, address: string | null) => void) | undefined
}) {
  const { messages } = useLiro()
  const [address, setAddress] = useState(delivery.address?.defaultValue ?? '')
  const state = delivery.state ?? 'idle'
  const Icon = delivery.icon ?? Send
  const StateIcon = state === 'sent' || state === 'failed' ? STATE_ICON[state] : null
  const sending = state === 'sending'
  return (
    <li data-slot="receipt-delivery" className="flex flex-col gap-1">
      <div className="flex flex-wrap items-end gap-2">
        {delivery.address !== undefined && (
          <TextField
            className="min-w-48 flex-1"
            label={delivery.address.label}
            type={delivery.address.type}
            autoComplete={delivery.address.type === 'email' ? 'email' : 'tel'}
            value={address}
            onChange={setAddress}
          />
        )}
        <ButtonPrimitive
          className="min-h-11"
          aria-disabled={sending || undefined}
          onClick={() => {
            if (sending) return
            onDeliver?.(delivery.id, delivery.address === undefined ? null : address.trim())
          }}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className={TEXT_DIRECTION}>{delivery.actionLabel ?? delivery.label}</span>
        </ButtonPrimitive>
      </div>
      {sending && (
        <Spinner size="sm" className="text-xs text-secondary">
          <span className={TEXT_DIRECTION}>
            {delivery.stateText ?? messages['receiptResult.sending']}
          </span>
        </Spinner>
      )}
      {StateIcon !== null && (
        <p
          role="status"
          className={cn(
            'm-0 flex items-center gap-1.5 text-xs font-medium',
            state === 'failed' ? 'text-status-danger-fg' : 'text-status-success-fg',
          )}
        >
          <StateIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <span className={TEXT_DIRECTION}>
            {delivery.stateText ??
              (state === 'sent'
                ? messages['receiptResult.sent']
                : messages['receiptResult.failed'])}
          </span>
        </p>
      )}
    </li>
  )
}

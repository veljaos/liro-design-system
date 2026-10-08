import { Check, PenLine, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { instantText, maySign, signingSummary, signerTurn, type SignerState } from './admin-logic'
import { ReasonConfirmDialog, type ConfirmAnswer, type ConfirmReason } from './confirm-dialog'
import { PersonAvatar } from './person'

/*
 * SignerList (BUILD-PLAN P5.21, signing): who signs a document, in order, and where each stands.
 * The signing itself is done by the Core or Liro Bridge: the list only reports the user's choice.
 * - The summary first: "1 of 3 signed" (`messages['signing.summary']`, numbers through
 *   `format.number`), sm semibold.
 * - The signers in order (an ordered list, rows divided by lines): the order number in a 24px
 *   ring, the avatar, the name (sm semibold; "(you)" after the current user's), the role (xs
 *   text.secondary), and the state in words — "Waiting" (text.secondary), "Signed 05.10.2026.
 *   14:12" (a check, status.success.fg), "Declined 05.10.2026. 15:02" (an X, status.danger.fg)
 *   with the reason on its own line. Never colour alone.
 * - The current user's row, when it is their turn (in order: the first signer still waiting;
 *   `sequential` false: any waiting signer), has Decline then Sign — the main action last
 *   (D13). Sign is the primary button (PenLine). Decline asks for the reason in a
 *   ReasonConfirmDialog (the Core's reasons, or a text), focused on Cancel (P4.9d). While the Core
 *   works (a returned promise) the button shows it. When it is not yet the user's turn, the row
 *   says whose turn comes first ("Nenad Kovačević signs first").
 */

/** One signer, from the Core. */
export interface Signer {
  id: string
  name: string
  /** Their role in the document: "Director", "Employee". */
  role?: string
  state: SignerState
  /** When they signed or declined: an ISO instant in the tenant's offset. */
  at?: string
  /** Why they declined, as they wrote it. */
  reason?: string
  /** The person using the application. */
  current?: boolean
  /** A photo's address for the avatar. */
  avatar?: string
}

export interface SignerListProps {
  signers: readonly Signer[]
  /** In order (default): each signs after the one before. False: in any order. */
  sequential?: boolean
  /** The current user signs (the Core / Liro Bridge does it); a promise keeps Sign busy. */
  onSign?: (signer: Signer) => void | Promise<void>
  /** The current user declines, with the reason; a promise keeps the dialog busy. */
  onDecline?: (signer: Signer, answer: ConfirmAnswer) => void | Promise<void>
  /** The Core's reasons to decline; without them the reason is written. */
  declineReasons?: readonly ConfirmReason[]
  /** The decline dialog's text, from the application ("RU-2026-017 goes back to HR."). */
  declineMessage?: ReactNode
  /** Sign's text. Default: `messages['signing.sign']`. */
  signLabel?: string
  className?: string
}

/** The signers of a document, in order, with the current user's Sign and Decline. */
export function SignerList(props: SignerListProps) {
  const { messages, format } = useLiro()
  const [signing, setSigning] = useState(false)
  const [declining, setDeclining] = useState(false)
  const sequential = props.sequential ?? true
  const summary = signingSummary(props.signers)
  const turn = signerTurn(props.signers, sequential)
  const first = props.signers.find((signer) => signer.id === turn)

  const sign = (signer: Signer) => {
    const result = props.onSign?.(signer)
    if (!(result instanceof Promise)) return
    setSigning(true)
    const done = () => {
      setSigning(false)
    }
    result.then(done, done)
  }

  return (
    <div data-slot="signer-list" className={cn('flex flex-col gap-3 font-sans', props.className)}>
      <p role="status" className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {messages['signing.summary'](
          summary.signed,
          format.number(String(summary.signed)),
          summary.total,
          format.number(String(summary.total)),
        )}
      </p>
      <ol className="m-0 list-none p-0">
        {props.signers.map((signer, index) => {
          const current = signer.current === true
          const canSign = current && maySign(props.signers, signer.id, sequential)
          const waitingForOther =
            current && signer.state === 'waiting' && !canSign && first !== undefined
          return (
            <li
              key={signer.id}
              {...(current ? { 'aria-current': 'true' as const } : {})}
              className="flex gap-3 border-0 border-b border-solid border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="box-border flex size-6 shrink-0 items-center justify-center rounded-full border border-solid border-strong text-xs font-semibold text-secondary tabular-nums"
              >
                {format.number(String(index + 1))}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start gap-2">
                  <PersonAvatar
                    name={signer.name}
                    size="sm"
                    {...(signer.avatar === undefined ? {} : { src: signer.avatar })}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                      {signer.name}
                      {current && (
                        <span className="font-normal text-secondary">
                          {' '}
                          {messages['signing.you']}
                        </span>
                      )}
                    </span>
                    {signer.role !== undefined && (
                      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                        {signer.role}
                      </span>
                    )}
                  </div>
                </div>
                <State
                  signer={signer}
                  when={signer.at === undefined ? undefined : instantText(format, signer.at)}
                />
                {waitingForOther && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {messages['signing.notYourTurn'](first.name)}
                  </span>
                )}
                {canSign && (props.onSign !== undefined || props.onDecline !== undefined) && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {props.onDecline !== undefined && (
                      <ButtonPrimitive
                        family="destructive"
                        emphasis="secondary"
                        disabled={signing}
                        onClick={() => {
                          setDeclining(true)
                        }}
                      >
                        <X aria-hidden="true" className="size-3.75 shrink-0" />
                        <span className={TEXT_DIRECTION}>{messages['signing.decline']}</span>
                      </ButtonPrimitive>
                    )}
                    {props.onSign !== undefined && (
                      <ButtonPrimitive
                        family="primary"
                        emphasis="primary"
                        aria-disabled={signing || undefined}
                        aria-busy={signing || undefined}
                        onClick={() => {
                          if (!signing) sign(signer)
                        }}
                      >
                        <PenLine aria-hidden="true" className="size-3.75 shrink-0" />
                        <span className={TEXT_DIRECTION}>
                          {props.signLabel ?? messages['signing.sign']}
                        </span>
                      </ButtonPrimitive>
                    )}
                    {props.onDecline !== undefined && (
                      <ReasonConfirmDialog
                        open={declining}
                        onOpenChange={setDeclining}
                        family="destructive"
                        actionIcon={X}
                        title={messages['signing.declineTitle']}
                        confirmLabel={messages['signing.declineConfirm']}
                        {...(props.declineMessage === undefined
                          ? {}
                          : { message: props.declineMessage })}
                        {...(props.declineReasons === undefined
                          ? {}
                          : { reasons: props.declineReasons })}
                        onConfirm={(answer) => props.onDecline?.(signer, answer)}
                      />
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** A signer's state in words, with an icon for signed and declined. */
function State({ signer, when }: { signer: Signer; when: string | undefined }) {
  const { messages } = useLiro()
  if (signer.state === 'waiting') {
    return (
      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
        {messages['signing.waiting']}
      </span>
    )
  }
  const signed = signer.state === 'signed'
  const Icon = signed ? Check : X
  const text = signed
    ? messages['signing.signedAt'](when ?? '')
    : messages['signing.declinedAt'](when ?? '')
  return (
    <span className="flex flex-col gap-0.5">
      <span
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          signed ? 'text-status-success-fg' : 'text-status-danger-fg',
        )}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{text.trim()}</span>
      </span>
      {!signed && signer.reason !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{signer.reason}</span>
      )}
    </span>
  )
}

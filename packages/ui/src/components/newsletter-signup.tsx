import { CircleCheck, Mail } from 'lucide-react'
import { useId, useState, type ReactNode, type SyntheticEvent } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { emailProblem } from './blog-logic'
import { Button } from './button'
import { FieldMessage } from './field'
import { Spinner } from './spinner'
import { TextField } from './text-field'
import { usePhone } from './use-phone'

/*
 * NewsletterSignup (BUILD-PLAN P5.39): an e-mail address to receive news — under an article, at
 * the end of a blog's list. Generic: the title, the line and the consent note are the
 * application's; the application subscribes and sends the confirmation.
 * - A sunken band (no border; radius lg; 24px, 16px on a phone) with the title (h2 by default,
 *   h4 size) and the application's line; then the address (TextField `type="email"`, left to
 *   right, autocomplete) and Subscribe (the primary family, filled where it is the page's main
 *   action — `emphasis`) in one row on a desktop, under each other on a phone; the consent note
 *   under them (xs text.secondary, may hold the privacy link).
 * - Subscribe without an address says "Enter your e-mail address."; a text that is not shaped
 *   like an address (`looksLikeEmail`) says "Enter an e-mail address such as
 *   name@example.com." — under the field, without sending.
 * - `onSubscribe` may return a promise ("Subscribing…" beside the button, the field waits; a
 *   rejection keeps the address); `error` is the application's danger Alert.
 * - Subscribed (`subscribed`, or kept after `onSubscribe` succeeds): a polite status with a
 *   success CircleCheck and "Thank you. Check your inbox to confirm." or the application's words.
 * - Unavailable (`unavailableReason`, P5.93): the address read-only, Subscribe unavailable, the
 *   reason in words under the form.
 */

export interface NewsletterSignupProps {
  /** The band's title ("Get Liro's articles by e-mail"). */
  title: ReactNode
  /** A line under it ("One e-mail a month, no advertising."). */
  description?: ReactNode
  /** The field's label. Default `messages['newsletter.email']`. */
  emailLabel?: string
  /** The button's text. Default `messages['newsletter.subscribe']`. */
  subscribeLabel?: string
  /** The consent note under the form (may hold a link). */
  consent?: ReactNode
  /** Subscribes the address (trimmed); a promise keeps the form waiting. */
  onSubscribe: (email: string) => void | Promise<void>
  /** The application is subscribing. */
  sending?: boolean
  /** It failed: the application's words. */
  error?: ReactNode
  /** Subscribed (controlled): `true` for the default thanks, or the application's words. */
  subscribed?: ReactNode
  /** The address at first. */
  defaultEmail?: string
  /**
   * No one can subscribe now, and why, from the application (P5.93): the address is read-only,
   * Subscribe is unavailable, and the reason stands under the form.
   */
  unavailableReason?: ReactNode
  /** Subscribe's weight: 'primary' where it is the page's main action. Default 'secondary'. */
  emphasis?: 'primary' | 'secondary'
  /** The title's level. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** An e-mail address to receive news, with Subscribe and the thanks. */
export function NewsletterSignup(props: NewsletterSignupProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [email, setEmail] = useState(props.defaultEmail ?? '')
  const [problem, setProblem] = useState<'required' | 'invalid' | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const sending = busy || props.sending === true
  const disabled = props.unavailableReason !== undefined && props.unavailableReason !== null
  const reasonId = `${useId()}-reason`
  const subscribed = props.subscribed ?? done
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    if (sending || disabled) return
    const found = emailProblem(email)
    setProblem(found)
    if (found !== null) return
    const outcome = props.onSubscribe(email.trim())
    if (outcome instanceof Promise) {
      setBusy(true)
      outcome.then(
        () => {
          setBusy(false)
          setDone(true)
        },
        () => {
          setBusy(false)
        },
      )
    } else {
      setDone(true)
    }
  }

  return (
    <section
      data-slot="newsletter-signup"
      className={cn(
        'box-border flex min-w-0 flex-col gap-4 rounded-lg bg-surface-sunken font-sans text-primary',
        phone ? 'p-4' : 'p-6',
        props.className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Mail aria-hidden="true" className="mt-1 size-5 shrink-0 text-secondary" />
        <div className="flex min-w-0 flex-col gap-1">
          <Heading className={cn('m-0 text-h4 font-semibold text-primary', TEXT_DIRECTION)}>
            {props.title}
          </Heading>
          {props.description !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.description}</p>
          )}
        </div>
      </div>
      {subscribed !== false ? (
        <p role="status" className="m-0 flex items-start gap-2 text-sm text-primary">
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-status-success-fg"
          />
          <span className={TEXT_DIRECTION}>
            {subscribed === true ? messages['newsletter.thanks'] : subscribed}
          </span>
        </p>
      ) : (
        <form noValidate onSubmit={submit} className="flex min-w-0 flex-col gap-3">
          <div className={cn('flex min-w-0 gap-2', phone ? 'flex-col' : 'items-start')}>
            <TextField
              label={props.emailLabel ?? messages['newsletter.email']}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(next) => {
                setEmail(next)
                if (problem !== null) setProblem(null)
              }}
              {...(problem === null
                ? {}
                : {
                    error:
                      problem === 'required'
                        ? messages['newsletter.required']
                        : messages['newsletter.invalid'],
                  })}
              readOnly={disabled}
              className="min-w-0 flex-1"
            />
            <div className="flex flex-col">
              {/* As tall as the field's label, so the button stands beside the field's box. */}
              {!phone && (
                <span aria-hidden="true" className="invisible text-sm font-semibold">
                  {'\u00a0'}
                </span>
              )}
              <div className={cn('flex items-center gap-3', !phone && 'mt-1')}>
                <Button
                  family="primary"
                  icon={Mail}
                  type="submit"
                  emphasis={props.emphasis ?? 'secondary'}
                  label={props.subscribeLabel ?? messages['newsletter.subscribe']}
                  disabled={sending || disabled}
                  {...(disabled ? { 'aria-describedby': reasonId } : {})}
                />
                {sending && (
                  <Spinner size="sm">
                    <span className="text-xs text-secondary">{messages['newsletter.sending']}</span>
                  </Spinner>
                )}
              </div>
            </div>
          </div>
          {disabled && (
            <FieldMessage id={reasonId} tone="hint">
              {props.unavailableReason}
            </FieldMessage>
          )}
          {props.error !== undefined && <Alert tone="danger">{props.error}</Alert>}
          {props.consent !== undefined && (
            <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{props.consent}</p>
          )}
        </form>
      )}
    </section>
  )
}

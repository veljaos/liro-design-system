import { ArrowRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { TextField } from './text-field'

/*
 * Sign-in building blocks (BUILD-PLAN P5.6, the owner's addition of 2026-10-08): the flows live in
 * the Core; these are the pieces inside AuthShell (which matches shadcn's login-03).
 * - EmailFirstForm: shadcn's login-05 shape — the e-mail field, a full-width Continue, then the
 *   "or" divider and the providers' buttons (or the providers first), and under them optional
 *   lines for "No account?" and the terms. The e-mail is the only field: the Core decides the
 *   next step (password, a code, the company's identity provider).
 * - ProviderSignInButtons: "Continue with Microsoft" / "Continue with Google". The providers and
 *   their labels come from the application; each provider's official mark comes in as a file
 *   (AGENTS.md D18: no component contains a logo; `@veljaos/tokens/brand/providers/` ships the
 *   marks). Neutral default buttons — never the provider's colour as a fill; the mark keeps its
 *   own colours, 18px, 12px before the label (Microsoft's spacing), full width, 8px apart.
 * - Loading: the pressed button keeps its size and name, its content hidden behind the loader
 *   (ConfirmDialog's look), `aria-busy`; it cannot be pressed twice.
 */

/** Mantine's oval loader (as ConfirmDialog's), 20px, in the button's text colour. */
function Loader() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 m-auto box-border size-5 animate-liro-spin rounded-full border-[2.5px] border-solid border-current border-s-transparent"
    />
  )
}

/** One sign-in provider, from the application. */
export interface SignInProvider {
  id: string
  /** The button's text, from the application: "Continue with Microsoft". */
  label: string
  /**
   * The address of the provider's official mark, e.g. the application's copy of
   * `@veljaos/tokens/brand/providers/microsoft.svg`. Drawn 18px, decorative (the label names it).
   */
  mark: string
  onClick: () => void
  /** The provider cannot be used now. */
  disabled?: boolean
  /** The provider's sign-in has started (the redirect is on its way). */
  loading?: boolean
}

export interface ProviderSignInButtonsProps {
  providers: readonly SignInProvider[]
  /**
   * The "or" divider (`messages['signIn.or']`) between these buttons and the e-mail form:
   * 'above' when the form comes first (login-05), 'below' when the buttons do. Default: none.
   */
  divider?: 'above' | 'below'
  /** Every button unavailable, e.g. while the e-mail step is being checked. */
  disabled?: boolean
  className?: string
}

/** The "or" between two ways of signing in: a thin line, the word, a thin line. */
function OrDivider() {
  const { messages } = useLiro()
  return (
    <div className="flex items-center gap-3 text-xs text-secondary">
      <span
        aria-hidden="true"
        className="h-0 flex-1 border-0 border-t border-solid border-default"
      />
      <span className={TEXT_ISOLATE}>{messages['signIn.or']}</span>
      <span
        aria-hidden="true"
        className="h-0 flex-1 border-0 border-t border-solid border-default"
      />
    </div>
  )
}

/** "Continue with Microsoft" and "Continue with Google": the providers' marks on neutral buttons. */
export function ProviderSignInButtons(props: ProviderSignInButtonsProps) {
  const anyLoading = props.providers.some((provider) => provider.loading === true)
  return (
    <div data-slot="provider-sign-in" className={cn('flex flex-col gap-4', props.className)}>
      {props.divider === 'above' && <OrDivider />}
      <div className="flex flex-col gap-2">
        {props.providers.map((provider) => {
          const busy = provider.loading === true
          return (
            <ButtonPrimitive
              key={provider.id}
              family="neutral"
              emphasis="secondary"
              disabled={props.disabled === true || provider.disabled === true}
              aria-disabled={busy || (anyLoading && !busy) || undefined}
              aria-busy={busy || undefined}
              data-loading={busy ? '' : undefined}
              className="relative w-full gap-3 px-4.5 data-loading:cursor-not-allowed"
              onClick={() => {
                if (!anyLoading) provider.onClick()
              }}
            >
              <span className={cn('contents', busy && '[&>*]:opacity-0')}>
                <img
                  src={provider.mark}
                  alt=""
                  width={18}
                  height={18}
                  className="size-4.5 shrink-0"
                />
                <span className={TEXT_DIRECTION}>{provider.label}</span>
              </span>
              {busy && <Loader />}
            </ButtonPrimitive>
          )
        })}
      </div>
      {props.divider === 'below' && <OrDivider />}
    </div>
  )
}

export interface EmailFirstFormProps {
  /** The address entered, trimmed; the Core decides the next step. */
  onSubmit: (email: string) => void
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  onChange?: (value: string) => void
  /** The field's label. Default: `messages['signIn.email']`. */
  label?: string
  /** A hint under the label, from the application. */
  description?: ReactNode
  /** Shown while empty, from the application ("name@company.rs"). */
  placeholder?: string
  /** The problem with the address, from the application ("No account uses this address."). */
  error?: ReactNode
  /** The button's text. Default: `messages['signIn.continue']`. */
  submitLabel?: string
  /** The address is being checked: the button shows it and cannot be pressed again. */
  loading?: boolean
  /** The form cannot be used now; give `disabledReason` so the user sees why. */
  disabled?: boolean
  disabledReason?: ReactNode
  /** Sign-in providers (ProviderSignInButtons), with the "or" divider between. */
  providers?: readonly SignInProvider[]
  /** The providers after the form (default, as login-05) or before it. */
  providersPosition?: 'after' | 'before'
  /** A line under the form: "No account? Ask your administrator." with the application's link. */
  signUp?: ReactNode
  /** The terms and privacy sentence at the bottom, with the application's links. */
  terms?: ReactNode
  className?: string
}

/** The first step of signing in: the e-mail, Continue, and the other ways in. */
export function EmailFirstForm(props: EmailFirstFormProps) {
  const { messages } = useLiro()
  const [inner, setInner] = useState(props.defaultValue ?? '')
  const value = props.value ?? inner
  const busy = props.loading === true
  const disabled = props.disabled === true
  const providers =
    props.providers === undefined || props.providers.length === 0 ? null : props.providers
  const before = props.providersPosition === 'before'
  return (
    <div data-slot="email-first-form" className={cn('flex flex-col gap-6', props.className)}>
      {providers !== null && before && (
        <ProviderSignInButtons providers={providers} divider="below" disabled={disabled || busy} />
      )}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy && !disabled) props.onSubmit(value.trim())
        }}
      >
        <TextField
          label={props.label ?? messages['signIn.email']}
          type="email"
          // "username" with an e-mail type: password managers pair it with the next step's
          // password field.
          autoComplete="username"
          value={value}
          onChange={(next) => {
            setInner(next)
            props.onChange?.(next)
          }}
          {...(props.description === undefined ? {} : { description: props.description })}
          {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
          {...(props.error === undefined ? {} : { error: props.error })}
          {...(disabled ? { disabled: true } : {})}
          {...(props.disabledReason === undefined ? {} : { disabledReason: props.disabledReason })}
        />
        <ButtonPrimitive
          type="submit"
          family="primary"
          emphasis="primary"
          disabled={disabled}
          aria-disabled={busy || undefined}
          aria-busy={busy || undefined}
          data-loading={busy ? '' : undefined}
          className="relative w-full data-loading:cursor-not-allowed"
        >
          <span className={cn('contents', busy && '[&>*]:opacity-0')}>
            <ArrowRight aria-hidden="true" className="size-3.75 shrink-0 rtl:-scale-x-100" />
            <span className={TEXT_DIRECTION}>
              {props.submitLabel ?? messages['signIn.continue']}
            </span>
          </span>
          {busy && <Loader />}
        </ButtonPrimitive>
      </form>
      {providers !== null && !before && (
        <ProviderSignInButtons providers={providers} divider="above" disabled={disabled || busy} />
      )}
      {(props.signUp !== undefined || props.terms !== undefined) && (
        <div className="flex flex-col gap-3 text-center">
          {props.signUp !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_ISOLATE)}>{props.signUp}</p>
          )}
          {props.terms !== undefined && (
            <p className={cn('m-0 text-xs text-tertiary', TEXT_ISOLATE)}>{props.terms}</p>
          )}
        </div>
      )}
    </div>
  )
}

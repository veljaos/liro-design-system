import { LogIn, Mail, Send } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  AuthShell,
  Button,
  CheckboxField,
  CodeInput,
  EmailFirstForm,
  PasswordField,
  PersonAvatar,
  TextField,
  useLiro,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { BRAND, Navigate, ROUTES } from './example-shell'
import { AuthFooter } from './screens-core'
import { Tenant } from './screens-G'
import {
  ACCOUNT,
  BD_ROUTES,
  BD_TODAY,
  LINK_VALID,
  REMEMBER_DEVICE,
  WRONG_CODE,
  WRONG_PASSWORD,
  WRONG_RECOVERY_CODE,
} from './data-BD'

/*
 * Group BD's example screens (P5.63, sign-in flows), built only from the sign-in building blocks
 * (AuthShell, EmailFirstForm, PasswordField, CodeInput, Alert) and the fields. They continue the
 * sign-in screen of P4.8 (screens-core `SignIn`, the e-mail first): its Continue opens the
 * password step, then the two-factor code (or a recovery code), then the home page. From the
 * password step: "Forgot your password?" (the e-mail, then "Check your e-mail").
 *
 * Every rule, limit and sentence about the account is the Core's (data-BD); the screens only
 * decide what the example application does next. The main button stands full width in the
 * card, as EmailFirstForm's Continue: a form column stretches its children.
 */

export { BD_ROUTES }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

/** The sign-in frame of every step: the lockup, one card, the footer of the sign-in screen. */
function AuthFrame({
  phone,
  title,
  description,
  children,
}: {
  phone: boolean
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={BD_TODAY}>
      <AuthShell
        brand={BRAND}
        layout={phone ? 'phone' : 'desktop'}
        title={title}
        {...(description === undefined ? {} : { description })}
        footer={<AuthFooter />}
      >
        {children}
      </AuthShell>
    </Tenant>
  )
}

/** A link inside the card, through the provider's link component. */
function TextLink({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link
      href={href}
      className="inline-flex min-h-6 items-center text-link underline bidi-isolate visited:text-link hover:text-link active:text-link"
    >
      {children}
    </Link>
  )
}

/** A line of links under a form, centred as EmailFirstForm's "No account?". */
function LinkLine({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-sm text-secondary bidi-isolate">
      {children}
    </p>
  )
}

/** A form whose children stack 16px apart and stretch, so the main button is full width. */
function StepForm({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {children}
    </form>
  )
}

/** Who is signing in: the avatar, the name and the e-mail, with the way to change account. */
function AccountLine({ name, email, change }: { name: string; email: string; change?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-solid border-default px-3 py-2">
      <PersonAvatar name={name} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-primary bidi-content">{name}</span>
        <span className="truncate text-xs text-secondary" dir="ltr">
          {email}
        </span>
      </span>
      {change}
    </div>
  )
}

// ── Password ──────────────────────────────────────────────────────────────────────────────────

/**
 * The step after the e-mail: the password of the account the e-mail named. A wrong password
 * gets the Core's answer with the tries left; "Forgot your password?" starts the reset.
 */
export function PasswordStep({ phone, wrong = false }: { phone: boolean; wrong?: boolean }) {
  const navigate = useContext(Navigate)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(wrong ? WRONG_PASSWORD : undefined)
  return (
    <AuthFrame phone={phone} title="Sign in">
      <StepForm
        onSubmit={() => {
          // The example's Core: any password but an empty one is right.
          if (password === '') setError(WRONG_PASSWORD)
          else navigate(BD_ROUTES.code)
        }}
      >
        <AccountLine
          name={ACCOUNT.name}
          email={ACCOUNT.email}
          change={<TextLink href={`#${ROUTES.signIn}`}>Change</TextLink>}
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setError(undefined)
          }}
          {...(error === undefined ? {} : { error })}
        />
        <Button type="submit" family="primary" emphasis="primary" icon={LogIn} label="Sign in" />
      </StepForm>
      <LinkLine>
        <TextLink href={`#${BD_ROUTES.forgot}`}>Forgot your password?</TextLink>
      </LinkLine>
    </AuthFrame>
  )
}

// ── Two-factor code ───────────────────────────────────────────────────────────────────────────

/**
 * The second step for an account with two-factor sign-in (My profile, P5.62): the code from the
 * authenticator app in CodeInput, a trusted device, and the recovery code when the phone is lost.
 */
export function CodeStep({
  phone,
  start = 'code',
}: {
  phone: boolean
  start?: 'code' | 'wrong' | 'recovery'
}) {
  const navigate = useContext(Navigate)
  const recovery = start === 'recovery'
  const [code, setCode] = useState(start === 'wrong' ? '482913' : '')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [error, setError] = useState<string | undefined>(start === 'wrong' ? WRONG_CODE : undefined)
  const complete = code.replace(/\s/g, '').length === 6
  const verify = () => {
    if (recovery) {
      // The example's Core: a recovery code has two groups of four ("7KQ2-M9XD").
      if (/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(recoveryCode.trim())) navigate(ROUTES.home)
      else setError(WRONG_RECOVERY_CODE)
      return
    }
    if (complete) navigate(ROUTES.home)
    else setError(WRONG_CODE)
  }
  return (
    <AuthFrame
      phone={phone}
      title="Two-factor sign-in"
      description={
        recovery
          ? 'Enter one of the recovery codes you saved when you turned two-factor sign-in on. Each code works once.'
          : 'Open your authenticator app and enter the 6-digit code it shows for Liro.'
      }
    >
      <StepForm onSubmit={verify}>
        {recovery ? (
          <TextField
            label="Recovery code"
            direction="ltr"
            autoComplete="off"
            placeholder="XXXX-XXXX"
            value={recoveryCode}
            onChange={(value) => {
              setRecoveryCode(value)
              setError(undefined)
            }}
            {...(error === undefined ? {} : { error })}
          />
        ) : (
          <CodeInput
            label="Code from the app"
            value={code}
            onChange={(value) => {
              setCode(value)
              setError(undefined)
            }}
            {...(error === undefined ? {} : { error })}
          />
        )}
        <CheckboxField label={REMEMBER_DEVICE} defaultChecked />
        <Button type="submit" intent="confirm" label="Verify" />
      </StepForm>
      <LinkLine>
        {recovery ? (
          <TextLink href={`#${BD_ROUTES.code}`}>Use the code from the app</TextLink>
        ) : (
          <TextLink href={`#${BD_ROUTES.recovery}`}>Use a recovery code</TextLink>
        )}
        <TextLink href={`#${ROUTES.signIn}`}>Back to sign in</TextLink>
      </LinkLine>
    </AuthFrame>
  )
}

// ── Forgotten password ────────────────────────────────────────────────────────────────────────

/**
 * "Forgot your password?": the e-mail in EmailFirstForm, then "Check your e-mail". The Core says
 * the same whether or not an account uses the address, so the page never tells who has one.
 */
export function ForgotPassword({ phone, sent = false }: { phone: boolean; sent?: boolean }) {
  const navigate = useContext(Navigate)
  const [email, setEmail] = useState(ACCOUNT.email)
  if (sent) {
    return (
      <AuthFrame
        phone={phone}
        title="Check your e-mail"
        description={
          <>
            If an account uses <bdi dir="ltr">{email}</bdi>, a link to choose a new password is on
            its way. {LINK_VALID}
          </>
        }
      >
        <Alert tone="neutral" icon={Mail}>
          Nothing in your inbox after a few minutes? Look in the spam folder, or send the link
          again.
        </Alert>
        <div className="flex flex-col gap-3">
          <Button
            family="neutral"
            icon={Send}
            label="Send the link again"
            onClick={() => undefined}
          />
        </div>
        <LinkLine>
          <TextLink href={`#${BD_ROUTES.password}`}>Back to sign in</TextLink>
        </LinkLine>
      </AuthFrame>
    )
  }
  return (
    <AuthFrame
      phone={phone}
      title="Reset your password"
      description="Enter the e-mail address you sign in with. We send you a link to choose a new password."
    >
      <EmailFirstForm
        label="Work e-mail"
        placeholder="name@company.rs"
        value={email}
        onChange={setEmail}
        submitLabel="Send the link"
        onSubmit={(address) => {
          setEmail(address)
          navigate(BD_ROUTES.forgotSent)
        }}
        signUp={<TextLink href={`#${BD_ROUTES.password}`}>Back to sign in</TextLink>}
      />
    </AuthFrame>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BD_ROUTES: ExampleRoute[] = [
  { path: BD_ROUTES.password, render: (phone) => <PasswordStep phone={phone} /> },
  { path: BD_ROUTES.passwordWrong, render: (phone) => <PasswordStep phone={phone} wrong /> },
  { path: BD_ROUTES.code, render: (phone) => <CodeStep phone={phone} /> },
  { path: BD_ROUTES.codeWrong, render: (phone) => <CodeStep phone={phone} start="wrong" /> },
  { path: BD_ROUTES.recovery, render: (phone) => <CodeStep phone={phone} start="recovery" /> },
  { path: BD_ROUTES.forgot, render: (phone) => <ForgotPassword phone={phone} /> },
  { path: BD_ROUTES.forgotSent, render: (phone) => <ForgotPassword phone={phone} sent /> },
]

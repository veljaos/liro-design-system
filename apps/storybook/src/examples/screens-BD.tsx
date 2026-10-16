import { KeyRound, LogIn, Mail, Send, UserPlus } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  AuthShell,
  Button,
  CheckboxField,
  CodeInput,
  EmailFirstForm,
  KeyValueList,
  PasswordField,
  PersonAvatar,
  ProviderSignInButtons,
  TextField,
  useLiro,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { BRAND, Navigate, ROUTES } from './example-shell'
import { AuthFooter } from './screens-core'
import { Tenant } from './screens-G'
import { signInProviders } from './data-C'
import {
  ACCOUNT,
  BD_ROUTES,
  BD_TODAY,
  EXPIRED_INVITATION,
  INVITATION,
  LINK_EXPIRED,
  LINK_VALID,
  LOCKED_UNTIL,
  PASSWORD_RULES,
  PASSWORDS_DIFFER,
  REMEMBER_DEVICE,
  RESET_LINK_UNTIL,
  RETURN_TO,
  RULE_BROKEN,
  SESSION_ENDED,
  WRONG_CODE,
  WRONG_PASSWORD,
  WRONG_RECOVERY_CODE,
} from './data-BD'

/*
 * Group BD's example screens (P5.63, sign-in flows), built only from the sign-in building blocks
 * (AuthShell, EmailFirstForm, PasswordField, CodeInput, ProviderSignInButtons, Alert) and the
 * fields. They continue the sign-in screen of P4.8 (screens-core `SignIn`, the e-mail first):
 * its Continue opens the password step, then the two-factor code, then the home page. From the
 * password step: "Forgot your password?" (the e-mail, then "Check your e-mail"), and the link in
 * that e-mail opens "Choose a new password". Beside the flow: Ivan Lukić accepting his
 * invitation to Kvadrat Gradnja d.o.o., the account locked after too many wrong passwords and the
 * session that expired on invoice F-2026-0412, which returns there after signing in again.
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
          {/* The example opens the e-mail's link at once, as the person would from the inbox. */}
          <Button
            family="neutral"
            icon={KeyRound}
            label="Open the link from the e-mail"
            onClick={() => {
              navigate(BD_ROUTES.newPassword)
            }}
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

// ── New password ──────────────────────────────────────────────────────────────────────────────

type NewPasswordStart = 'empty' | 'mismatch' | 'rules' | 'expired'

/**
 * The page the e-mail's link opens: the new password twice, the company's rules under the first
 * field (the Core's words), its answer when a rule is broken, and the second field's own error
 * when the two differ. An expired link says so and offers a new one.
 */
export function NewPassword({
  phone,
  start = 'empty',
}: {
  phone: boolean
  start?: NewPasswordStart
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const filled = start === 'mismatch' || start === 'rules'
  const [password, setPassword] = useState(filled ? 'Kvadrat-gradnja-2026' : '')
  const [repeat, setRepeat] = useState(
    start === 'mismatch' ? 'Kvadrat-gradnja-2025' : filled ? 'Kvadrat-gradnja-2026' : '',
  )
  const [ruleError, setRuleError] = useState<string | undefined>(
    start === 'rules' ? RULE_BROKEN : undefined,
  )
  const [repeatError, setRepeatError] = useState<string | undefined>(
    start === 'mismatch' ? PASSWORDS_DIFFER : undefined,
  )
  if (start === 'expired') {
    return (
      <AuthFrame phone={phone} title="Choose a new password">
        <Alert
          tone="warning"
          title={LINK_EXPIRED.title}
          actions={
            <Button
              family="neutral"
              icon={Send}
              label="Send a new link"
              onClick={() => {
                navigate(BD_ROUTES.forgot)
              }}
            />
          }
        >
          {LINK_EXPIRED.message}
        </Alert>
        <LinkLine>
          <TextLink href={`#${BD_ROUTES.password}`}>Back to sign in</TextLink>
        </LinkLine>
      </AuthFrame>
    )
  }
  return (
    <AuthFrame
      phone={phone}
      title="Choose a new password"
      description={
        <>
          For <bdi dir="ltr">{ACCOUNT.email}</bdi>. The link works until{' '}
          {format.time(RESET_LINK_UNTIL)}.
        </>
      }
    >
      <StepForm
        onSubmit={() => {
          // The example's Core: the length rule; the five last passwords are its secret.
          if (password.length < 12) {
            setRuleError('The password is too short: it needs at least 12 characters.')
            return
          }
          if (password !== repeat) {
            setRepeatError(PASSWORDS_DIFFER)
            return
          }
          navigate(BD_ROUTES.password)
        }}
      >
        <PasswordField
          label="New password"
          autoComplete="new-password"
          description={PASSWORD_RULES}
          value={password}
          onChange={(value) => {
            setPassword(value)
            setRuleError(undefined)
          }}
          {...(ruleError === undefined ? {} : { error: ruleError })}
        />
        <PasswordField
          label="Repeat the new password"
          autoComplete="new-password"
          value={repeat}
          onChange={(value) => {
            setRepeat(value)
            setRepeatError(undefined)
          }}
          {...(repeatError === undefined ? {} : { error: repeatError })}
        />
        <Button type="submit" intent="save" label="Save the password" />
      </StepForm>
    </AuthFrame>
  )
}

// ── Invitation ────────────────────────────────────────────────────────────────────────────────

/**
 * The link in an invitation e-mail: which company, who invited and with which role; the e-mail
 * is fixed (it is the invitation's); a password chosen twice, or the work account of Microsoft or
 * Google with the same address. An expired invitation says who can send a new one.
 */
export function AcceptInvitation({
  phone,
  expired = false,
}: {
  phone: boolean
  expired?: boolean
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [repeatError, setRepeatError] = useState<string | undefined>(undefined)
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined)
  if (expired) {
    return (
      <AuthFrame phone={phone} title={`Join ${EXPIRED_INVITATION.company}`}>
        <Alert tone="warning" title="This invitation has expired">
          {`The invitation for ${EXPIRED_INVITATION.email} expired on ${format.date(EXPIRED_INVITATION.expired)} Ask ${EXPIRED_INVITATION.invitedBy} to send a new one.`}
        </Alert>
        <LinkLine>
          <TextLink href={`#${ROUTES.signIn}`}>Sign in with another account</TextLink>
        </LinkLine>
      </AuthFrame>
    )
  }
  return (
    <AuthFrame
      phone={phone}
      title={`Join ${INVITATION.company}`}
      description={`${INVITATION.invitedBy} invited you to use Liro at ${INVITATION.company}. The invitation is valid until ${format.date(INVITATION.expires)}`}
    >
      <KeyValueList
        columns={1}
        items={[
          {
            label: 'Company',
            value: (
              <span className="flex flex-col">
                <span className="bidi-content">{INVITATION.company}</span>
                <span className="text-xs font-regular text-secondary bidi-content">
                  {INVITATION.companyDetail}
                </span>
              </span>
            ),
          },
          {
            label: 'Invited by',
            value: `${INVITATION.invitedBy}, ${INVITATION.invitedByRole}`,
          },
          {
            label: 'Your role',
            value: (
              <span className="flex flex-col">
                <span className="bidi-content">{INVITATION.role}</span>
                <span className="text-xs font-regular text-secondary bidi-content">
                  {INVITATION.roleDescription}
                </span>
              </span>
            ),
          },
        ]}
      />
      <StepForm
        onSubmit={() => {
          if (password.length < 12) {
            setPasswordError('The password is too short: it needs at least 12 characters.')
            return
          }
          if (password !== repeat) {
            setRepeatError(PASSWORDS_DIFFER)
            return
          }
          navigate(ROUTES.home)
        }}
      >
        <TextField
          label="E-mail"
          type="email"
          direction="ltr"
          readOnly
          value={INVITATION.email}
          description="The invitation is for this address."
        />
        <TextField label="Full name" autoComplete="name" defaultValue={INVITATION.name} />
        <PasswordField
          label="Choose a password"
          autoComplete="new-password"
          description={PASSWORD_RULES}
          value={password}
          onChange={(value) => {
            setPassword(value)
            setPasswordError(undefined)
          }}
          {...(passwordError === undefined ? {} : { error: passwordError })}
        />
        <PasswordField
          label="Repeat the password"
          autoComplete="new-password"
          value={repeat}
          onChange={(value) => {
            setRepeat(value)
            setRepeatError(undefined)
          }}
          {...(repeatError === undefined ? {} : { error: repeatError })}
        />
        <Button
          type="submit"
          family="primary"
          emphasis="primary"
          icon={UserPlus}
          label="Accept and join"
        />
      </StepForm>
      <ProviderSignInButtons
        divider="above"
        providers={signInProviders(() => {
          navigate(ROUTES.home)
        })}
      />
    </AuthFrame>
  )
}

// ── Locked account ────────────────────────────────────────────────────────────────────────────

/**
 * Too many wrong passwords: the Core locked the account until a time it names. The page says
 * until when, in the Core's words, and offers the way in that does not wait: a new password.
 */
export function AccountLocked({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  return (
    <AuthFrame phone={phone} title="Account locked">
      <Alert tone="warning" title="Too many wrong passwords">
        {`For your safety, ${ACCOUNT.email} cannot sign in until ${format.time(LOCKED_UNTIL)} today. Choose a new password to sign in sooner. If it was not you, tell your company’s administrator.`}
      </Alert>
      <div className="flex flex-col">
        <Button
          family="primary"
          emphasis="primary"
          icon={KeyRound}
          label="Choose a new password"
          onClick={() => {
            navigate(BD_ROUTES.forgot)
          }}
        />
      </div>
      <LinkLine>
        <TextLink href={`#${ROUTES.signIn}`}>Back to sign in</TextLink>
      </LinkLine>
    </AuthFrame>
  )
}

// ── Expired session ───────────────────────────────────────────────────────────────────────────

/**
 * The session ended while the page was open: the account is known, so only its password is
 * asked; after signing in the person is back on the page they were on (the invoice). This device
 * is trusted for the code (the code step's checkbox), so none is asked.
 */
export function SessionExpired({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  return (
    <AuthFrame
      phone={phone}
      title="Your session has expired"
      description={`${SESSION_ENDED} Sign in again to return to ${RETURN_TO.label}.`}
    >
      <StepForm
        onSubmit={() => {
          if (password === '') setError(WRONG_PASSWORD)
          else navigate(ROUTES.invoice(RETURN_TO.number))
        }}
      >
        <AccountLine
          name={ACCOUNT.name}
          email={ACCOUNT.email}
          change={<TextLink href={`#${ROUTES.signIn}`}>Not you?</TextLink>}
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
        <Button
          type="submit"
          family="primary"
          emphasis="primary"
          icon={LogIn}
          label="Sign in and return"
        />
      </StepForm>
      <LinkLine>
        <TextLink href={`#${BD_ROUTES.forgot}`}>Forgot your password?</TextLink>
      </LinkLine>
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
  { path: BD_ROUTES.newPassword, render: (phone) => <NewPassword phone={phone} /> },
  {
    path: BD_ROUTES.newPasswordMismatch,
    render: (phone) => <NewPassword phone={phone} start="mismatch" />,
  },
  {
    path: BD_ROUTES.newPasswordRules,
    render: (phone) => <NewPassword phone={phone} start="rules" />,
  },
  {
    path: BD_ROUTES.newPasswordExpired,
    render: (phone) => <NewPassword phone={phone} start="expired" />,
  },
  { path: BD_ROUTES.invitation, render: (phone) => <AcceptInvitation phone={phone} /> },
  {
    path: BD_ROUTES.invitationExpired,
    render: (phone) => <AcceptInvitation phone={phone} expired />,
  },
  { path: BD_ROUTES.locked, render: (phone) => <AccountLocked phone={phone} /> },
  { path: BD_ROUTES.sessionExpired, render: (phone) => <SessionExpired phone={phone} /> },
]

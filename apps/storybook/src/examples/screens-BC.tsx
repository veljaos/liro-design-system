import { KeyRound, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  CodeInput,
  ConfirmDialog,
  DeleteConfirmDialog,
  Dialog,
  instantText,
  notice,
  PasswordField,
  QrCode,
  RecoveryCodes,
  SelectField,
  Launchpad,
  SessionList,
  SettingsPage,
  StatusBadge,
  SwitchField,
  TextField,
  Toaster,
  useLiro,
  type SessionItem,
  type SettingRow,
  type SettingsGroup,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { MODULES } from './screens-core'
import { Tenant } from './screens-G'
import {
  BC_ROUTES,
  BC_TODAY,
  LANGUAGES,
  ME,
  MY_SESSIONS,
  NEW_PASSKEY,
  OTP_KEY,
  OTPAUTH,
  PASSKEY_FAILED,
  PASSKEYS,
  PASSWORD_CHANGED,
  PASSWORD_RULES,
  RECOVERY_CODES,
  RECOVERY_HEADING,
  THEMES,
  TWO_FACTOR,
  WRONG_CODE,
  type ExamplePasskey,
} from './data-BC'

/*
 * Group BC's example screens (P5.62, My profile): Milica Petrović's own profile, opened from the
 * user menu's "Profile". A SettingsPage with three tabs, each its own address:
 * - Preferences: her name and e-mail (read-only: the administrator changes them), the interface
 *   language (each language in its own name, `lang` on the option, D15) and the theme — the
 *   provider's choices as the Core offers them; a choice saves at once ("Saved").
 * - Sign-in and security: the password (changed in a Dialog), two-factor sign-in (on: new
 *   recovery codes, turn off with a confirmation; off: "Turn on" opens a Dialog with the QR code
 *   of the Core's `otpauth://` text (QrCode), the same key as text to type, CodeInput to confirm,
 *   then RecoveryCodes shown once), the passkeys (rows with created and last used, Remove with a
 *   confirmation; "Add a passkey" — the browser's step is the Core's; a failure is the row's
 *   error; a new passkey is named in a Dialog).
 * - Devices: SessionList in the section's block (SettingsSection `content`, P5.62), with the
 *   e-mail about a new device as a row.
 * Dialogs stand at page level, outside the tabs (D16). Every code, key, rule and answer is the
 * Core's (data-BC).
 */

export { BC_ROUTES }

type ProfileTab = 'preferences' | 'security' | 'devices'

/** How the security tab starts: each state the Core can render, so the pictures need no clicks. */
export type SecurityStart =
  | 'on'
  | 'off'
  | 'turnOn'
  | 'codeWrong'
  | 'recoveryCodes'
  | 'passkeyFailed'
  | 'passkeyAdded'
  | 'changePassword'

const TAB_ROUTES: Record<ProfileTab, string> = {
  preferences: BC_ROUTES.preferences,
  security: BC_ROUTES.security,
  devices: BC_ROUTES.devices,
}

/** "Added 02.03.2026. · Last used 14.10.2026. 07:58", through the provider's format. */
function usePasskeyLine() {
  const { format } = useLiro()
  return (passkey: ExamplePasskey) =>
    [
      `Added ${format.date(passkey.created)}`,
      passkey.lastUsed === null
        ? 'Not used yet'
        : `Last used ${instantText(format, passkey.lastUsed)}`,
    ].join(' · ')
}

/** The key of the authenticator app as text: left to right, monospace, selectable. */
function OtpKey() {
  return (
    <code
      dir="ltr"
      className="block rounded-md bg-surface-sunken px-3 py-2 font-mono text-md text-primary select-all"
    >
      {OTP_KEY}
    </code>
  )
}

/** A numbered step's heading inside the turn-on dialog. */
function StepHeading({ children }: { children: ReactNode }) {
  return <h3 className="m-0 text-sm font-semibold text-primary bidi-content">{children}</h3>
}

/**
 * Turning two-factor sign-in on: scan (or type the key), confirm with a code, then the recovery
 * codes, shown once; the dialog stays until they are kept.
 */
function TurnOnDialog({
  phone,
  start,
  onClose,
  onDone,
}: {
  phone: boolean
  start: 'scan' | 'codeWrong' | 'recoveryCodes'
  onClose: () => void
  onDone: () => void
}) {
  const [step, setStep] = useState<'scan' | 'recoveryCodes'>(
    start === 'recoveryCodes' ? 'recoveryCodes' : 'scan',
  )
  const [code, setCode] = useState(start === 'codeWrong' ? '271828' : '')
  const [error, setError] = useState<string | undefined>(
    start === 'codeWrong' ? WRONG_CODE : undefined,
  )
  const confirm = () => {
    // The example's Core: every complete code but the one it rejected is right.
    if (code.replace(/\s/g, '').length === 6 && code !== '271828') setStep('recoveryCodes')
    else setError(WRONG_CODE)
  }
  if (step === 'recoveryCodes') {
    return (
      <Dialog
        open
        dismissible={false}
        title="Save your recovery codes"
        description="Two-factor sign-in is on. If you lose your phone, each of these codes signs you in once."
      >
        <RecoveryCodes
          codes={RECOVERY_CODES}
          heading={RECOVERY_HEADING}
          fileName="liro-recovery-codes.txt"
          layout={phone ? 'phone' : 'desktop'}
          onContinue={onDone}
        />
      </Dialog>
    )
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Turn on two-factor sign-in"
      description="Liro will ask for a code from an app on your phone after your password."
      actions={
        <>
          <Button intent="cancel" label="Cancel" onClick={onClose} />
          <Button
            family="primary"
            emphasis="primary"
            icon={ShieldCheck}
            label="Turn on"
            onClick={confirm}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <StepHeading>1. Add Liro to your authenticator app</StepHeading>
        <p className="m-0 text-sm text-secondary bidi-content">
          Scan the code with Microsoft Authenticator, Google Authenticator or another app.
        </p>
        <QrCode value={OTPAUTH} label="QR code for your authenticator app" size={176} />
        {phone && (
          <a
            href={OTPAUTH}
            className="inline-flex min-h-6 items-center text-sm text-link underline visited:text-link"
          >
            Open in the authenticator app on this phone
          </a>
        )}
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm text-secondary bidi-content">
            Cannot scan it? Type this key in the app:
          </p>
          <OtpKey />
        </div>
        <StepHeading>2. Enter the code the app shows</StepHeading>
        <CodeInput
          label="Code from the app"
          value={code}
          onChange={(value) => {
            setCode(value)
            setError(undefined)
          }}
          {...(error === undefined ? {} : { error })}
        />
      </div>
    </Dialog>
  )
}

/** Changing the password: the current one, the new one twice; the rules are the Core's. */
function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [errors, setErrors] = useState<{ current?: string; next?: string; repeat?: string }>({})
  const save = () => {
    // The example's Core: the current password must be given, the new one long enough and twice.
    const found = {
      ...(current === '' ? { current: 'Enter your current password.' } : {}),
      ...(next.length < 12
        ? { next: 'The password is too short: it needs at least 12 characters.' }
        : {}),
      ...(next !== repeat ? { repeat: 'The two passwords are not the same.' } : {}),
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onClose()
    notice.success('Your password is changed. Other devices are signed out.')
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Change password"
      description="Other devices are signed out when the password changes."
      actions={
        <>
          <Button intent="cancel" label="Cancel" onClick={onClose} />
          <Button intent="save" label="Change password" onClick={save} />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <PasswordField
          label="Current password"
          value={current}
          onChange={setCurrent}
          {...(errors.current === undefined ? {} : { error: errors.current })}
        />
        <PasswordField
          label="New password"
          autoComplete="new-password"
          description={PASSWORD_RULES}
          value={next}
          onChange={setNext}
          {...(errors.next === undefined ? {} : { error: errors.next })}
        />
        <PasswordField
          label="Repeat the new password"
          autoComplete="new-password"
          value={repeat}
          onChange={setRepeat}
          {...(errors.repeat === undefined ? {} : { error: errors.repeat })}
        />
      </div>
    </Dialog>
  )
}

/** Naming the passkey the browser step made (the Core suggests a name from the device). */
function NamePasskeyDialog({
  onSave,
  onClose,
}: {
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(NEW_PASSKEY.name)
  const empty = name.trim() === ''
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Passkey added"
      description="Give it a name you will recognise in the list of passkeys."
      actions={
        <Button
          intent="save"
          label="Save"
          onClick={() => {
            if (!empty) onSave(name.trim())
          }}
        />
      }
    >
      <TextField
        label="Name"
        value={name}
        onChange={setName}
        {...(empty ? { error: 'Give the passkey a name.' } : {})}
      />
    </Dialog>
  )
}

export function MyProfile({
  phone,
  tab,
  start = 'on',
}: {
  phone: boolean
  tab: ProfileTab
  start?: SecurityStart
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const passkeyLine = usePasskeyLine()
  // Preferences: each change saves at once; the Core answers and the row says "Saved".
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('system')
  const [saved, setSaved] = useState<readonly string[]>([])
  const [newDevice, setNewDevice] = useState(true)
  // Security.
  const off =
    start === 'off' || start === 'turnOn' || start === 'codeWrong' || start === 'recoveryCodes'
  const [twoFactor, setTwoFactor] = useState(!off)
  const [turningOn, setTurningOn] = useState<'scan' | 'codeWrong' | 'recoveryCodes' | null>(
    start === 'turnOn'
      ? 'scan'
      : start === 'codeWrong'
        ? 'codeWrong'
        : start === 'recoveryCodes'
          ? 'recoveryCodes'
          : null,
  )
  const [newCodes, setNewCodes] = useState(false)
  const [turningOff, setTurningOff] = useState(false)
  const [changingPassword, setChangingPassword] = useState(start === 'changePassword')
  const [passkeys, setPasskeys] = useState<readonly ExamplePasskey[]>(PASSKEYS)
  const [passkeyError, setPasskeyError] = useState(start === 'passkeyFailed')
  const [naming, setNaming] = useState(start === 'passkeyAdded')
  const [removing, setRemoving] = useState<ExamplePasskey | null>(null)
  // Devices.
  const [sessions, setSessions] = useState<readonly SessionItem[]>(MY_SESSIONS)
  // The home page's tiles (P5.94 item 18): chosen, ordered and hidden here, not on the home page.
  const [tiles, setTiles] = useState(MODULES.map((module) => module.id))
  const [hiddenTiles, setHiddenTiles] = useState<string[]>([])
  const modulesOf = (ids: readonly string[]) =>
    ids.flatMap((id) => MODULES.filter((module) => module.id === id))

  const savedState = (key: string) => (saved.includes(key) ? { state: 'saved' as const } : {})
  const markSaved = (key: string) => {
    setSaved((list) => (list.includes(key) ? list : [...list, key]))
  }

  const twoFactorRow: SettingRow = twoFactor
    ? {
        key: 'two-factor',
        label: TWO_FACTOR.method,
        description: `On since ${format.date(TWO_FACTOR.since)} · ${TWO_FACTOR.codesLeft}`,
        control: (
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge label="On" tone="success" />
            <Button
              family="neutral"
              icon={RefreshCw}
              label="New recovery codes"
              onClick={() => {
                setNewCodes(true)
              }}
            />
            <Button
              family="destructive"
              icon={ShieldOff}
              label="Turn off"
              onClick={() => {
                setTurningOff(true)
              }}
            />
          </span>
        ),
      }
    : {
        key: 'two-factor',
        label: 'Two-factor sign-in',
        description:
          'With it, a stolen password is not enough: Liro also asks for a code from an app on your phone.',
        control: (
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Off" tone="neutral" />
            <Button
              family="primary"
              emphasis="primary"
              icon={ShieldCheck}
              label="Turn on"
              onClick={() => {
                setTurningOn('scan')
              }}
            />
          </span>
        ),
      }

  const groups: SettingsGroup[] = [
    {
      key: 'preferences',
      label: 'Preferences',
      sections: [
        {
          key: 'about',
          title: 'About you',
          rows: [
            {
              key: 'name',
              label: 'Name',
              description: 'Your company’s administrator changes your name.',
              control: <TextField label="Name" readOnly value={ME.name} className="w-64" />,
            },
            {
              key: 'email',
              label: 'E-mail',
              description: 'You sign in with this address.',
              control: (
                <TextField
                  label="E-mail"
                  type="email"
                  direction="ltr"
                  readOnly
                  value={ME.email}
                  className="w-64"
                />
              ),
            },
          ],
        },
        {
          key: 'look',
          title: 'Language and theme',
          rows: [
            {
              key: 'language',
              label: 'Language',
              description: 'The language of menus, buttons and messages. Documents keep theirs.',
              control: (
                <SelectField
                  label="Language"
                  options={LANGUAGES}
                  value={language}
                  onChange={(value) => {
                    if (value === '') return
                    setLanguage(value)
                    markSaved('language')
                  }}
                  className="w-56"
                />
              ),
              ...savedState('language'),
            },
            {
              key: 'theme',
              label: 'Theme',
              description: 'Light, dark, or as this device is set.',
              control: (
                <SelectField
                  label="Theme"
                  options={THEMES}
                  value={theme}
                  onChange={(value) => {
                    if (value === '') return
                    setTheme(value)
                    markSaved('theme')
                  }}
                  className="w-56"
                />
              ),
              ...savedState('theme'),
            },
          ],
        },
        {
          key: 'home',
          title: 'Home page',
          rows: [],
          content: (
            <div className="flex flex-col gap-3">
              <p className="bidi-content m-0 text-sm text-secondary">
                Choose, order and hide the modules on your home page.
              </p>
              <Launchpad
                label="Home page modules"
                editing
                modules={modulesOf(tiles)}
                hidden={modulesOf(hiddenTiles)}
                layout={phone ? 'phone' : 'desktop'}
                onReorder={setTiles}
                onHide={(id) => {
                  setTiles((list) => list.filter((each) => each !== id))
                  setHiddenTiles((list) => [...list, id])
                }}
                onShow={(id) => {
                  setHiddenTiles((list) => list.filter((each) => each !== id))
                  setTiles((list) => [...list, id])
                }}
              />
            </div>
          ),
        },
      ],
    },
    {
      key: 'security',
      label: 'Sign-in and security',
      sections: [
        {
          key: 'password',
          title: 'Password',
          rows: [
            {
              key: 'password',
              label: 'Password',
              description: `Changed on ${format.date(PASSWORD_CHANGED)}`,
              control: (
                <Button
                  family="neutral"
                  icon={KeyRound}
                  label="Change password"
                  onClick={() => {
                    setChangingPassword(true)
                  }}
                />
              ),
            },
          ],
        },
        { key: 'two-factor', title: 'Two-factor sign-in', rows: [twoFactorRow] },
        {
          key: 'passkeys',
          title: 'Passkeys',
          rows: [
            ...passkeys.map((passkey): SettingRow => ({
              key: passkey.id,
              label: passkey.name,
              description: passkeyLine(passkey),
              control: (
                <Button
                  intent="delete"
                  label="Remove"
                  onClick={() => {
                    setRemoving(passkey)
                  }}
                />
              ),
            })),
            {
              key: 'add',
              label: 'Add a passkey',
              description:
                'Sign in with your fingerprint, face or screen lock instead of a password. Your browser asks for it.',
              control: (
                <Button
                  family="neutral"
                  icon={KeyRound}
                  label="Add a passkey"
                  onClick={() => {
                    // The browser's step is the Core's (WebAuthn); the example's succeeds.
                    setPasskeyError(false)
                    setNaming(true)
                  }}
                />
              ),
              ...(passkeyError ? { state: 'error' as const, error: PASSKEY_FAILED } : {}),
            },
          ],
        },
      ],
    },
    {
      key: 'devices',
      label: 'Devices',
      sections: [
        {
          key: 'devices',
          title: 'Signed-in devices',
          rows: [
            {
              key: 'new-device',
              label: 'E-mail me about a new device',
              description: 'When your account is used on a device for the first time.',
              control: (
                <SwitchField
                  label="E-mail me about a new device"
                  checked={newDevice}
                  onChange={(value) => {
                    setNewDevice(value)
                    markSaved('new-device')
                  }}
                />
              ),
              ...savedState('new-device'),
            },
          ],
          content: (
            <SessionList
              label="Signed-in devices"
              sessions={sessions}
              onRevoke={(session) => {
                setSessions((list) => list.filter((each) => each.id !== session.id))
                notice.success(`${session.device} is signed out.`)
              }}
              onRevokeOthers={() => {
                setSessions((list) => list.filter((each) => each.current === true))
                notice.success('Every other device is signed out.')
              }}
            />
          ),
        },
      ],
    },
  ]

  return (
    <Tenant today={BC_TODAY}>
      <Shell phone={phone} crumbs={[{ label: 'My profile' }]}>
        <SettingsPage
          layout={phone ? 'phone' : 'desktop'}
          title="My profile"
          subtitle={
            <span className="bidi-content">
              {ME.name} · {ME.position}
            </span>
          }
          groups={groups}
          group={tab}
          onGroupChange={(key) => {
            navigate(TAB_ROUTES[key as ProfileTab])
          }}
        />
        {turningOn !== null && (
          <TurnOnDialog
            phone={phone}
            start={turningOn}
            onClose={() => {
              setTurningOn(null)
            }}
            onDone={() => {
              setTurningOn(null)
              setTwoFactor(true)
              notice.success('Two-factor sign-in is on.')
            }}
          />
        )}
        {newCodes && (
          <Dialog
            open
            dismissible={false}
            title="New recovery codes"
            description="The codes you saved before no longer work."
          >
            <RecoveryCodes
              codes={RECOVERY_CODES}
              heading={RECOVERY_HEADING}
              fileName="liro-recovery-codes.txt"
              layout={phone ? 'phone' : 'desktop'}
              onContinue={() => {
                setNewCodes(false)
              }}
            />
          </Dialog>
        )}
        <ConfirmDialog
          open={turningOff}
          onOpenChange={setTurningOff}
          family="destructive"
          actionIcon={ShieldOff}
          title="Turn off two-factor sign-in?"
          message="Your password alone will sign you in. Your recovery codes stop working."
          confirmLabel="Turn off"
          onConfirm={() => {
            setTwoFactor(false)
            notice.success('Two-factor sign-in is off.')
          }}
        />
        {changingPassword && (
          <ChangePasswordDialog
            onClose={() => {
              setChangingPassword(false)
            }}
          />
        )}
        {naming && (
          <NamePasskeyDialog
            onClose={() => {
              setNaming(false)
            }}
            onSave={(name) => {
              setPasskeys((list) => [...list, { ...NEW_PASSKEY, name }])
              setNaming(false)
              notice.success(`Passkey “${name}” added.`)
            }}
          />
        )}
        <DeleteConfirmDialog
          open={removing !== null}
          onOpenChange={(open) => {
            if (!open) setRemoving(null)
          }}
          title="Remove passkey"
          subject={removing?.name}
          message="You can no longer sign in with it. Remove it from the device too."
          confirmLabel="Remove"
          onConfirm={() => {
            const gone = removing
            setPasskeys((list) => list.filter((each) => each.id !== gone?.id))
            setRemoving(null)
          }}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const security = (start: SecurityStart) => (phone: boolean) => (
  <MyProfile phone={phone} tab="security" start={start} />
)

export const GROUP_BC_ROUTES: ExampleRoute[] = [
  { path: BC_ROUTES.preferences, render: (phone) => <MyProfile phone={phone} tab="preferences" /> },
  { path: BC_ROUTES.security, render: security('on') },
  { path: BC_ROUTES.devices, render: (phone) => <MyProfile phone={phone} tab="devices" /> },
  { path: BC_ROUTES.twoFactorOff, render: security('off') },
  { path: BC_ROUTES.turnOn, render: security('turnOn') },
  { path: BC_ROUTES.codeWrong, render: security('codeWrong') },
  { path: BC_ROUTES.recoveryCodes, render: security('recoveryCodes') },
  { path: BC_ROUTES.passkeyFailed, render: security('passkeyFailed') },
  { path: BC_ROUTES.passkeyAdded, render: security('passkeyAdded') },
  { path: BC_ROUTES.changePassword, render: security('changePassword') },
]

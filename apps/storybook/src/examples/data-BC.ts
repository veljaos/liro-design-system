/*
 * Group BC's example data (P5.62, My profile): Milica Petrović's own profile on 14.10.2026 at
 * 09:40 — her language and theme, two-factor sign-in with an authenticator app (on since
 * 02.03.2026; the turn-on flow starts from "off"), her passkeys and the devices signed in to her
 * account. Every choice, code, key and sentence is the Core's: the otpauth text and its key, the
 * recovery codes and the passkeys' names are illustrative. Not part of the package.
 */
import type { SelectOption, SessionItem } from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const BC_ROUTES = {
  /** The tabs of My profile. */
  preferences: '/profile',
  security: '/profile/security',
  devices: '/profile/devices',
  /** States of the security tab (each a fresh page, as the Core would render it). */
  twoFactorOff: '/profile/security/two-factor-off',
  turnOn: '/profile/security/two-factor-off/turn-on',
  codeWrong: '/profile/security/two-factor-off/turn-on/code-wrong',
  recoveryCodes: '/profile/security/two-factor-off/turn-on/recovery-codes',
  passkeyFailed: '/profile/security/passkey-failed',
  passkeyAdded: '/profile/security/passkey-added',
  changePassword: '/profile/security/change-password',
} as const

export const BC_TODAY = '2026-10-14'

export const ME = {
  name: 'Milica Petrović',
  email: 'milica.petrovic@kvadratgradnja.rs',
  position: 'Head of finance and administration, Kvadrat Gradnja d.o.o.',
}

// ── Preferences ───────────────────────────────────────────────────────────────────────────────

/**
 * The interface languages the Core offers, each in its own name; a name in another language than
 * the page carries it (`lang`, D15).
 */
export const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'sr-Latn', label: 'Srpski (latinica)', lang: 'sr-Latn' },
  { value: 'sr-Cyrl', label: 'Српски (ћирилица)', lang: 'sr-Cyrl' },
]

/** The provider's colour schemes as the Core names them (LiroProvider `colorScheme`). */
export const THEMES: SelectOption[] = [
  { value: 'system', label: 'Same as this device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

// ── Password and two-factor sign-in ───────────────────────────────────────────────────────────

export const PASSWORD_CHANGED = '2026-06-12'

export const PASSWORD_RULES =
  'At least 12 characters. Not one of your last 5 passwords, and not your e-mail address.'

/** Two-factor sign-in as the Core reports it. */
export const TWO_FACTOR = {
  since: '2026-03-02',
  method: 'Authenticator app',
  /** The Core counts the recovery codes left. */
  codesLeft: '8 of 10 recovery codes left',
}

/**
 * The text of the QR code the Core makes for the authenticator app (RFC 6238's otpauth form); the
 * key below is the same secret, grouped by four for typing. Illustrative.
 */
export const OTPAUTH =
  'otpauth://totp/Liro:milica.petrovic%40kvadratgradnja.rs?secret=JBSWY3DPEHPK3PXPKVQW4ZLTNRXW&issuer=Liro&digits=6&period=30'

export const OTP_KEY = 'JBSW Y3DP EHPK 3PXP KVQW 4ZLT NRXW'

/** The Core's answer to a wrong code while turning two-factor sign-in on. */
export const WRONG_CODE =
  'The code is wrong. Check that the time on your phone is set automatically, then enter the newest code.'

/** The recovery codes the Core made, shown once. Illustrative. */
export const RECOVERY_CODES = [
  '7KQ2-M9XD',
  'P4WN-8TRA',
  'H3ZC-QL6E',
  'B9VF-2JYK',
  'M6TD-R4NP',
  'X2GH-7SQW',
  'C8LA-5ZUE',
  'N4RB-K3FD',
  'T7YP-9GMC',
  'E5KX-W2HV',
]

export const RECOVERY_HEADING = 'Liro — milica.petrovic@kvadratgradnja.rs'

// ── Passkeys ──────────────────────────────────────────────────────────────────────────────────

export interface ExamplePasskey {
  id: string
  /** The name the person gave it (or the Core's suggestion). */
  name: string
  created: string
  /** An instant in the tenant's offset, or null when never used. */
  lastUsed: string | null
}

export const PASSKEYS: ExamplePasskey[] = [
  {
    id: 'pk1',
    name: 'YubiKey 5C NFC',
    created: '2026-03-02',
    lastUsed: '2026-10-14T07:58:00+02:00',
  },
  {
    id: 'pk2',
    name: 'iPhone (iCloud Keychain)',
    created: '2026-05-18',
    lastUsed: '2026-10-13T19:02:00+02:00',
  },
]

/** What the browser step made, with the name the Core suggests from the device. */
export const NEW_PASSKEY: ExamplePasskey = {
  id: 'pk3',
  name: 'Windows Hello on this computer',
  created: '2026-10-14',
  lastUsed: null,
}

/** The Core's words when the browser step did not give a passkey. */
export const PASSKEY_FAILED =
  'The passkey was not added: the browser step was cancelled or took too long. Try again.'

// ── Devices ───────────────────────────────────────────────────────────────────────────────────

/** The devices signed in to Milica's account; addresses from the documentation ranges. */
export const MY_SESSIONS: SessionItem[] = [
  {
    id: 's1',
    device: 'Chrome 129 on Windows 11',
    kind: 'desktop',
    place: 'Novi Sad, Serbia',
    address: '203.0.113.42',
    lastActive: '2026-10-14T09:40:00+02:00',
    current: true,
  },
  {
    id: 's2',
    device: 'Liro app on iPhone',
    kind: 'phone',
    place: 'Novi Sad, Serbia',
    address: '198.51.100.61',
    lastActive: '2026-10-13T19:02:00+02:00',
  },
  {
    id: 's3',
    device: 'Safari on iPad',
    kind: 'tablet',
    place: 'Sremska Kamenica, Serbia',
    address: '198.51.100.17',
    lastActive: '2026-10-11T21:15:00+02:00',
  },
  {
    id: 's4',
    device: 'Edge 129 on Windows 10',
    kind: 'desktop',
    place: 'Belgrade, Serbia',
    address: '192.0.2.130',
    lastActive: '2026-10-02T11:48:00+02:00',
  },
]

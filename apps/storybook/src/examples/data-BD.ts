/*
 * Group BD's example data (P5.63, sign-in flows): what the Core answers at each step of signing in
 * to Liro on 14.10.2026 at 09:40 — Milica Petrović's password and two-factor code (the e-mail step
 * is the sign-in screen of P4.8) and the forgotten password. Every sentence here is the
 * application's: the design system shows it as given. Not part of the package.
 */

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const BD_ROUTES = {
  /** The step after the e-mail (the sign-in screen's Continue). */
  password: '/sign-in/password',
  passwordWrong: '/sign-in/password/wrong',
  code: '/sign-in/code',
  codeWrong: '/sign-in/code/wrong',
  recovery: '/sign-in/recovery-code',
  forgot: '/sign-in/forgot-password',
  forgotSent: '/sign-in/forgot-password/sent',
} as const

export const BD_TODAY = '2026-10-14'

// ── The account ───────────────────────────────────────────────────────────────────────────────

/** The account signing in: the e-mail the sign-in screen is filled with. */
export const ACCOUNT = {
  name: 'Milica Petrović',
  email: 'milica.petrovic@kvadratgradnja.rs',
}

/** The Core's answer to a wrong password, with the tries left before the lock. */
export const WRONG_PASSWORD =
  'The password is wrong. After 2 more wrong tries the account is locked for 30 minutes.'

/** The Core's answer to a wrong or expired code. */
export const WRONG_CODE = 'The code is wrong or has expired. Enter the newest code from the app.'

export const WRONG_RECOVERY_CODE = 'This recovery code is wrong or was already used.'

/** How long a trusted device skips the code, in the Core's words. */
export const REMEMBER_DEVICE = 'Do not ask for a code on this device for 30 days'

// ── Forgotten password ────────────────────────────────────────────────────────────────────────

/** How long the link in the e-mail works, in the Core's words. */
export const LINK_VALID = 'The link works for 60 minutes and only once.'

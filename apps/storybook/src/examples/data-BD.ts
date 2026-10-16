/*
 * Group BD's example data (P5.63, sign-in flows): what the Core answers at each step of signing in
 * to Liro on 14.10.2026 at 09:40 — Milica Petrović's password and two-factor code (the e-mail step
 * is the sign-in screen of P4.8), the forgotten password and the new one, Ivan Lukić's invitation
 * to Kvadrat Gradnja d.o.o., the locked account and the expired session. Every sentence here is
 * the application's: the design system shows it as given. Not part of the package.
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
  newPassword: '/sign-in/new-password',
  newPasswordMismatch: '/sign-in/new-password/mismatch',
  newPasswordRules: '/sign-in/new-password/rules',
  newPasswordExpired: '/sign-in/new-password/expired',
  invitation: '/invitation/KG-7Q4M',
  invitationExpired: '/invitation/KG-2F9C',
  locked: '/sign-in/locked',
  sessionExpired: '/sign-in/session-expired',
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

// ── Forgotten and new password ────────────────────────────────────────────────────────────────

/** How long the link in the e-mail works, in the Core's words. */
export const LINK_VALID = 'The link works for 60 minutes and only once.'

/** Until when the link of the e-mail sent at 09:31 works (the Core's 60 minutes). */
export const RESET_LINK_UNTIL = '2026-10-14T10:31:00+02:00'

/** The company's password rules, as the Core states them (its own policy, P5.29). */
export const PASSWORD_RULES =
  'At least 12 characters. Not one of your last 5 passwords, and not your e-mail address.'

/** The Core's answer to a new password that breaks a rule. */
export const RULE_BROKEN =
  'This password was one of your last 5. Choose a password you have not used before.'

export const PASSWORDS_DIFFER = 'The two passwords are not the same.'

/** The reset link was opened too late (the Core's words and when it expired). */
export const LINK_EXPIRED = {
  title: 'This link has expired',
  message: 'The link was sent on 14.10.2026. at 08:12 and worked for 60 minutes.',
}

// ── Invitation ────────────────────────────────────────────────────────────────────────────────

/** Ivan Lukić, buyer in Procurement (data-AJ), is invited to use Liro. */
export const INVITATION = {
  code: 'KG-7Q4M',
  company: 'Kvadrat Gradnja d.o.o.',
  companyDetail: 'PIB 108452317 · Novi Sad',
  invitedBy: 'Milica Petrović',
  invitedByRole: 'Head of finance and administration',
  role: 'Warehouse',
  roleDescription: 'Items, receipts, deliveries and stock counts.',
  name: 'Ivan Lukić',
  email: 'ivan.lukic@kvadratgradnja.rs',
  sent: '2026-10-13',
  expires: '2026-10-20',
}

/** An invitation opened after it expired: the Core says who can send a new one. */
export const EXPIRED_INVITATION = {
  code: 'KG-2F9C',
  company: 'Kvadrat Gradnja d.o.o.',
  invitedBy: 'Milica Petrović',
  email: 'nikola.savic@kvadratgradnja.rs',
  expired: '2026-10-09',
}

// ── Locked account and expired session ───────────────────────────────────────────────────────

/** Until when the account is locked: an instant in the tenant's offset. */
export const LOCKED_UNTIL = '2026-10-14T10:10:00+02:00'

/** Where Milica was when the session ended: the page she returns to. */
export const RETURN_TO = { label: 'Invoice F-2026-0412', number: 'F-2026-0412' }

/** Why the session ended, in the Core's words. */
export const SESSION_ENDED =
  'For your safety you were signed out after 30 minutes without activity.'

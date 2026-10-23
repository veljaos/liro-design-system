/*
 * Group C's example data (P5.6, P5.7, P5.21): the users and roles of Kvadrat Gradnja d.o.o., the
 * first-run steps of Stanić Elektro STR, employment contract RU-2026-017 awaiting signatures and
 * the tasks board — all on 6 October 2026, linked to the records of the one dataset
 * (`examples-story-data.ts`). Not part of the package. No classes here.
 */
import type { SignInProvider } from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

// ── Sign-in providers ─────────────────────────────────────────────────────────────────────────

/** Microsoft's and Google's official marks are drawn by ProviderSignInButtons ('microsoft', 'google'). */
export function signInProviders(onClick: (id: string) => void): SignInProvider[] {
  return [
    {
      id: 'microsoft',
      label: 'Continue with Microsoft',
      mark: 'microsoft',
      onClick: () => {
        onClick('microsoft')
      },
    },
    {
      id: 'google',
      label: 'Continue with Google',
      mark: 'google',
      onClick: () => {
        onClick('google')
      },
    },
  ]
}

// ── Users and roles ───────────────────────────────────────────────────────────────────────────

// ── First-run setup: Stanić Elektro STR ───────────────────────────────────────────────────────

// ── Employment contract RU-2026-017 ───────────────────────────────────────────────────────────

export const DECLINE_REASONS = [
  { value: 'terms', label: 'The terms differ from what was agreed' },
  { value: 'data', label: 'My personal data are wrong' },
  { value: 'other', label: 'Another reason' },
]

// ── Tasks ─────────────────────────────────────────────────────────────────────────────────────

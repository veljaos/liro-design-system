/*
 * The official marks of the sign-in providers (P5.6, the owner: next to ProviderSignInButtons,
 * not in @veljaos/tokens, which holds tokens only). Drawn exactly as Microsoft's and Google's
 * sign-in branding rules require — their own colours, never Liro meanings — which is why this
 * one file is exempt from `liro/no-raw-colors` (eslint.config.mjs). Microsoft and Google and
 * their marks are trademarks of their owners, used here only to label a sign-in with them
 * (THIRD-PARTY-NOTICES.md). Decorative: the button's label names the provider. Internal.
 */

/** The providers whose official mark the Design System draws. */
export const PROVIDER_MARKS = ['microsoft', 'google'] as const

export type ProviderMark = (typeof PROVIDER_MARKS)[number]

export function isProviderMark(value: string): value is ProviderMark {
  return (PROVIDER_MARKS as readonly string[]).includes(value)
}

/** One provider's mark, 18px, hidden from assistive technology. */
export function ProviderMarkIcon({ mark }: { mark: ProviderMark }) {
  if (mark === 'microsoft') {
    return (
      <svg
        data-slot="provider-mark"
        aria-hidden="true"
        viewBox="0 0 21 21"
        className="size-4.5 shrink-0"
      >
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
    )
  }
  return (
    <svg
      data-slot="provider-mark"
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="size-4.5 shrink-0"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

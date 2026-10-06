import { FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * BrandLockup (P4.0, the owner's values, docs/decisions.md "Brand lockup"): the brand's icon and
 * wordmark side by side, then the product name as live text in the brand face (Space Grotesk),
 * so the product name is data and can change without a new file.
 * - md (the header): icon 28px, wordmark 20px high, 8px (xs) between them; the product name 16px
 *   (lg), regular, text.secondary, 8px after the wordmark, on the wordmark's baseline.
 * - lg (status pages, sign-in): icon 40px, wordmark 28px, 12px (sm) between; the name 20px (xl).
 * - The icon exactly as in its file, sharp corners, no rounding: the logo must look the same in
 *   the application, in PDFs, e-mail and on the website.
 * - In the dark theme the `…OnDark` files, when given.
 * - Below 48em only the icon and the wordmark; the product name is left out (`compact`).
 * - One link to the home page (the provider's `linkComponent`), named by the full product name
 *   ("Liro Business Apps"); the images inside are decorative. Without `href` it is an image with
 *   that name.
 * The component contains no logo (AGENTS.md D18): the files come through props, and the
 * application passes `@veljaos/tokens/brand/`.
 */

export type BrandLockupSize = 'md' | 'lg'

export interface BrandLockupProps {
  /** The brand's name as the wordmark writes it, e.g. "Liro". Part of the accessible name. */
  brandName: string
  /** The product's name after the wordmark, e.g. "Business Apps": live text, from the application. */
  productName?: string
  /** The icon file (URL), e.g. `@veljaos/tokens/brand/icon.svg`. */
  icon: string
  /** The icon in the dark theme. Default: `icon` (the brand tile reads on both). */
  iconOnDark?: string
  /** The wordmark file (URL) for light surfaces, e.g. `wordmark-light.svg`. */
  wordmark: string
  /**
   * The wordmark in the dark theme (the provider's `colorScheme`), e.g. `wordmark-mono-white.svg`:
   * the light-surface wordmarks cannot be read on a dark surface. Default: `wordmark`.
   */
  wordmarkOnDark?: string
  /** The home page. The lockup is then one link to it. */
  href?: string
  /** 'md' (default) in the header, 'lg' on status pages and the sign-in screen. */
  size?: BrandLockupSize
  /**
   * Leaves out the product name. Default: left out below 48em (the sm breakpoint), by CSS;
   * true or false forces it (a narrow frame at desktop width).
   */
  compact?: boolean
  /** Layout classes. */
  className?: string
}

const SIZES = {
  md: { gap: 'gap-2', icon: 'size-7', wordmark: 'h-5', name: 'text-lg' },
  lg: { gap: 'gap-3', icon: 'size-10', wordmark: 'h-7', name: 'text-xl' },
} as const

/** The full product name, the lockup's accessible name: "Liro Business Apps". */
export function lockupName(brandName: string, productName?: string): string {
  return productName === undefined || productName.trim() === ''
    ? brandName
    : `${brandName} ${productName}`
}

/** The brand's icon, wordmark and product name, as one link home. */
export function BrandLockup({
  brandName,
  productName,
  icon,
  iconOnDark,
  wordmark,
  wordmarkOnDark,
  href,
  size = 'md',
  compact,
  className,
}: BrandLockupProps) {
  const { linkComponent: Link, colorScheme } = useLiro()
  const dark = colorScheme === 'dark'
  const values = SIZES[size]
  const name = lockupName(brandName, productName)
  const showName = productName !== undefined && productName.trim() !== '' && compact !== true

  const content = (
    <>
      <img
        src={dark ? (iconOnDark ?? icon) : icon}
        alt=""
        className={cn('block shrink-0', values.icon)}
      />
      {/* The wordmark and the name share a baseline: an image's baseline is its bottom edge. */}
      <span className="flex items-baseline gap-2">
        <img
          src={dark ? (wordmarkOnDark ?? wordmark) : wordmark}
          alt=""
          className={cn('block w-auto shrink-0', values.wordmark)}
        />
        {showName && (
          <span
            className={cn(
              'font-brand font-regular whitespace-nowrap text-secondary',
              values.name,
              'leading-none',
              compact === undefined && 'max-sm:hidden',
            )}
          >
            {productName}
          </span>
        )}
      </span>
    </>
  )

  const classes = cn(
    'inline-flex shrink-0 items-center rounded-sm no-underline',
    values.gap,
    href !== undefined && FOCUS_RING,
    className,
  )

  return href === undefined ? (
    <span role="img" aria-label={name} data-slot="brand-lockup" className={classes}>
      {content}
    </span>
  ) : (
    <Link href={href} aria-label={name} data-slot="brand-lockup" className={classes}>
      {content}
    </Link>
  )
}

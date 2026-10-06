import { FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * BrandLockup (P4.0, the owner's decision, docs/decisions.md "Brand lockup"): the application's
 * name as text, without an icon — "Liro Business Apps" in the brand face (Space Grotesk), the
 * logo's colours (text.logo: #0078D4 in light, #3EACEB in dark, as the logo files), one line: the brand
 * name bold, the product name regular. Both names are data (props), so a new product name needs
 * no new file.
 * - md (the header): 20px (xl), about the height of the old wordmark.
 * - lg (status pages, sign-in): 24px (approved by the owner).
 * - Below 48em only the brand name; the product name is left out (`compact` forces either way).
 * - One link to the home page (the provider's `linkComponent`), its accessible name the full
 *   product name ("Liro Business Apps"), which contains the visible text (WCAG 2.5.3). Without
 *   `href` it is text with that name.
 * The wordmark and icon files of `@veljaos/tokens/brand/` stay for documents, e-mail, the web
 * icons and the installed app (AGENTS.md D18: no component contains a logo).
 */

export type BrandLockupSize = 'md' | 'lg'

export interface BrandLockupProps {
  /** The brand's name, e.g. "Liro": bold. */
  brandName: string
  /** The product's name after it, e.g. "Business Apps": regular, from the application. */
  productName?: string
  /** The home page. The lockup is then one link to it. */
  href?: string
  /** 'md' (default, 20px) in the header, 'lg' (24px) on status pages and the sign-in screen. */
  size?: BrandLockupSize
  /**
   * Leaves out the product name. Default: left out below 48em (the sm breakpoint), by CSS; true
   * or false forces it (a narrow frame at desktop width).
   */
  compact?: boolean
  /** Layout classes. */
  className?: string
}

/** The full product name, the lockup's accessible name: "Liro Business Apps". */
export function lockupName(brandName: string, productName?: string): string {
  return productName === undefined || productName.trim() === ''
    ? brandName
    : `${brandName} ${productName}`
}

/** The application's name as one link home. */
export function BrandLockup({
  brandName,
  productName,
  href,
  size = 'md',
  compact,
  className,
}: BrandLockupProps) {
  const { linkComponent: Link } = useLiro()
  const name = lockupName(brandName, productName)
  const showName = productName !== undefined && productName.trim() !== '' && compact !== true

  const content = (
    <>
      <span className="font-bold">{brandName}</span>
      {showName && (
        <span className={cn('font-regular', compact === undefined && 'max-sm:hidden')}>
          {' '}
          {productName}
        </span>
      )}
    </>
  )

  const classes = cn(
    // The logo's colour in every link state (P4.4, owner): never the browser's visited purple.
    'inline-block shrink-0 rounded-sm font-brand whitespace-nowrap text-logo no-underline visited:text-logo hover:text-logo active:text-logo focus:text-logo hover:no-underline',
    size === 'lg' ? 'text-h1' : 'text-xl',
    'leading-tight',
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

import type { ReactNode } from 'react'
import { BrandLockup, type BrandLockupProps } from '../components/brand-lockup'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * AuthShell (P4.7, the owner's values, docs/decisions.md "Status pages and AuthShell"): the frame
 * of the sign-in screens. The flows themselves (e-mail first, password, code, recovery) are built
 * in the Core from the building blocks of P5.6.
 * - The page on surface.sunken; the text lockup (24px, the full product name) centred above a
 *   420px card: raised, a 1px border.default border, radius lg, padding xl (32px), the subtle
 *   xs shadow. The card's title (an h1 in the h2 size) and an optional description, then the
 *   flow. Under the card, centred, the footer (language switch, terms) in xs text.tertiary.
 * - Phones: no card border or shadow; the card is the page (surface.raised), full width with md
 *   (16px) side padding; the lockup stays above. No illustration and no side image.
 */

export interface AuthShellProps {
  /** The lockup's names and home link; always shown large (24px) with the product name. */
  brand: Omit<BrandLockupProps, 'size' | 'className'>
  /** The screen's title ("Sign in"). */
  title: string
  /** A line under the title ("Use your work e-mail."). */
  description?: ReactNode
  /** The flow: fields and the main button. */
  children: ReactNode
  /** Under the card: a language switch, terms and privacy links. */
  footer?: ReactNode
  /** Default: from the viewport (below 48em 'phone'). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The sign-in frame: the lockup above one card. */
export function AuthShell(props: AuthShellProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  return (
    <div
      data-slot="auth-shell"
      data-layout={phone ? 'phone' : 'desktop'}
      className={cn(
        'box-border flex min-h-dvh w-full flex-col items-center gap-6 font-sans',
        phone ? 'bg-surface-raised px-4 py-8' : 'justify-center bg-surface-sunken px-4 py-12',
        props.className,
      )}
    >
      <BrandLockup {...props.brand} size="lg" compact={props.brand.compact ?? false} />
      <main
        className={cn(
          'box-border flex w-full max-w-105 flex-col gap-6 bg-surface-raised',
          !phone && 'rounded-lg border border-solid border-default p-8 shadow-xs',
        )}
      >
        <div className="flex flex-col gap-1">
          <h1 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>{props.title}</h1>
          {props.description !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.description}</p>
          )}
        </div>
        {props.children}
      </main>
      {props.footer !== undefined && (
        <footer
          className={cn(
            'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-tertiary',
            TEXT_ISOLATE,
          )}
        >
          {props.footer}
        </footer>
      )}
    </div>
  )
}

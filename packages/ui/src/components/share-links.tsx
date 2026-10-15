import { ExternalLink, Link2 } from 'lucide-react'
import { useId, useState } from 'react'
import { buttonClassName } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import type { IconComponent } from './intents'

/*
 * ShareLinks (BUILD-PLAN P5.39): share a page — an article, a public record — by its address.
 * - A named group: "Share" (xs medium text.secondary), then "Copy link" (a neutral button; the
 *   address goes to the clipboard and a polite "Link copied" — or "The link could not be copied"
 *   — stands beside it until the next press), then the application's places to share as neutral
 *   link buttons (its words and icons; an external one opens in a new tab with ExternalLink at
 *   its end). Never a network's colour or logo as a fill: the words carry them (as the sign-in
 *   providers' buttons, D18).
 * - `onCopy` reports the copy (the application may count it).
 */

/** A place to share the page, from the application ("E-mail", "LinkedIn"). */
export interface ShareTarget {
  key: string
  label: string
  /** The address that shares it (a mailto: or the network's share address). */
  href: string
  icon?: IconComponent
  /** Opens in a new tab. Default true for http(s) addresses. */
  external?: boolean
}

export interface ShareLinksProps {
  /** The address to copy and share. */
  url: string
  /** The places to share it, from the application. */
  targets?: readonly ShareTarget[]
  /** The group's name. Default `messages['share.label']`. */
  label?: string
  /** Reports a copy. */
  onCopy?: (url: string) => void
  className?: string
}

/** Whether a share address opens in a new tab. */
export function opensOutside(target: ShareTarget): boolean {
  return target.external ?? /^https?:\/\//i.test(target.href)
}

/** "Copy link" and the application's places to share a page. */
export function ShareLinks(props: ShareLinksProps) {
  const { messages } = useLiro()
  const labelId = useId()
  const [copied, setCopied] = useState<'copied' | 'failed' | null>(null)
  const copy = () => {
    const done = () => {
      setCopied('copied')
      props.onCopy?.(props.url)
    }
    const failed = () => {
      setCopied('failed')
    }
    try {
      void navigator.clipboard.writeText(props.url).then(done, failed)
    } catch {
      failed()
    }
  }
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      data-slot="share-links"
      className={cn('flex min-w-0 flex-wrap items-center gap-2 font-sans', props.className)}
    >
      <span id={labelId} className={cn('me-1 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
        {props.label ?? messages['share.label']}
      </span>
      <Button family="neutral" icon={Link2} label={messages['share.copy']} onClick={copy} />
      {(props.targets ?? []).map((target) => {
        const Icon = target.icon
        const outside = opensOutside(target)
        return (
          <a
            key={target.key}
            href={target.href}
            {...(outside ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={cn(
              buttonClassName({ family: 'neutral', emphasis: 'secondary', shape: 'text' }),
              'no-underline visited:text-family-neutral-fg',
            )}
          >
            {Icon !== undefined && <Icon aria-hidden="true" className="size-3.75 shrink-0" />}
            <span className={TEXT_DIRECTION}>{target.label}</span>
            {outside && (
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0 rtl:-scale-x-100" />
            )}
          </a>
        )
      })}
      <span role="status" className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
        {copied === 'copied'
          ? messages['share.copied']
          : copied === 'failed'
            ? messages['share.copyFailed']
            : ''}
      </span>
    </div>
  )
}

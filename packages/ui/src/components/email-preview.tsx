import { isValidElement, useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { usePhone } from './use-phone'

/*
 * EmailPreview: an e-mail as its reader will see it, with the sample data the
 * application filled in — at a desktop mail client's width (600px) or a phone's (360px), in a
 * light or a dark mail client. Generic: the sender, the subject, the body and the footer are the
 * application's (the body usually RichText with `fillMergeFields`).
 * - **Switches** over the preview: Width (Desktop / Phone) and Mail client (Light / Dark), two
 *   segmented groups (the arrows move, the pressed one shows); controlled (`width`, `scheme`) or
 *   not (`defaultWidth`, `defaultScheme`). `controls={false}` leaves them out.
 * - **The client**: a sunken area; the message on it at the chosen width (never wider than the
 *   room), its tokens resolved in the chosen scheme (`data-liro-theme`), as a dark mail
 *   client inverts a message whatever the page's theme.
 * - **The message**, as simple as the printouts: the header lines From, To and Subject over
 *   a thin rule; the sender's logo at the start; the body; the footer in small grey text under a
 *   thin rule. Black and grey, no boxes, frames or shaded bands; the brand colour only in links.
 * - `lang` marks the message's language when it differs from the page's (a Serbian variant
 *   previewed in an English interface).
 * - A sender or recipient given as `{ name, address }` keeps its name whole on its
 *   own line and the address, left to right, after it on the same line where it fits and under it
 *   where it does not — never "Novi Sad <accounts@" broken across two lines.
 */

/** A sender or a recipient: the name as the reader sees it and the address. */
export interface EmailAddress {
  name?: string
  address: string
}

function isAddress(value: ReactNode | EmailAddress): value is EmailAddress {
  return typeof value === 'object' && value !== null && !isValidElement(value) && 'address' in value
}

/** "Name <address>": the name whole, the address after it or under it. */
function AddressText({ value }: { value: EmailAddress }) {
  if (value.name === undefined) {
    return (
      <bdi dir="ltr" className="break-words">
        {value.address}
      </bdi>
    )
  }
  return (
    <span className="flex flex-wrap gap-x-1">
      <span className={TEXT_DIRECTION}>{value.name}</span>
      <bdi dir="ltr" className="min-w-0 break-words text-secondary">{`<${value.address}>`}</bdi>
    </span>
  )
}

export type EmailPreviewWidth = 'desktop' | 'phone'
export type EmailPreviewScheme = 'light' | 'dark'

export interface EmailPreviewProps {
  /**
   * The sender as the reader sees it: `{ name, address }` (the name whole, the address after it
   * or under it), or the application's own content.
   */
  from: ReactNode | EmailAddress
  /** The recipient, as `from`. */
  to?: ReactNode | EmailAddress
  /** The subject, with the sample data filled in. */
  subject: ReactNode
  /** The sender's logo, at the start over the body (an image or a lockup). */
  logo?: ReactNode
  /** The body, with the sample data filled in. */
  children: ReactNode
  /** Small grey text under a thin rule (address, why the reader gets it, unsubscribe). */
  footer?: ReactNode
  /** The language of the message (BCP 47, `sr-Latn`), when it differs from the page's. */
  lang?: string
  /** Controlled width. */
  width?: EmailPreviewWidth
  /** Width at first. Default 'desktop' ('phone' on a phone). */
  defaultWidth?: EmailPreviewWidth
  onWidthChange?: (width: EmailPreviewWidth) => void
  /** Controlled mail-client scheme. */
  scheme?: EmailPreviewScheme
  /** Scheme at first. Default 'light'. */
  defaultScheme?: EmailPreviewScheme
  onSchemeChange?: (scheme: EmailPreviewScheme) => void
  /** Shows the switches. Default true. */
  controls?: boolean
  /** The region's name. Default `messages['emailPreview.label']`. */
  label?: string
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The pixel width of a mail client: 600px on a desktop, 360px on a phone. */
export function emailPreviewWidth(width: EmailPreviewWidth): number {
  return width === 'phone' ? 360 : 600
}

/** An e-mail as its reader will see it, at a width and in a mail client's scheme. */
export function EmailPreview(props: EmailPreviewProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [innerWidth, setInnerWidth] = useState<EmailPreviewWidth>(
    props.defaultWidth ?? (phone ? 'phone' : 'desktop'),
  )
  const [innerScheme, setInnerScheme] = useState<EmailPreviewScheme>(props.defaultScheme ?? 'light')
  const width = props.width ?? innerWidth
  const scheme = props.scheme ?? innerScheme
  const narrow = width === 'phone'
  const party = (value: ReactNode | EmailAddress): ReactNode =>
    isAddress(value) ? <AddressText value={value} /> : value
  const header: [string, ReactNode][] = [
    [messages['emailPreview.from'], party(props.from)],
    ...(props.to === undefined
      ? []
      : ([[messages['emailPreview.to'], party(props.to)]] as [string, ReactNode][])),
    [messages['emailPreview.subject'], props.subject],
  ]
  return (
    <section
      data-slot="email-preview"
      aria-label={props.label ?? messages['emailPreview.label']}
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      {props.controls !== false && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ToggleGroup
            type="single"
            value={width}
            aria-label={messages['emailPreview.width']}
            onValueChange={(value) => {
              if (value !== 'desktop' && value !== 'phone') return
              setInnerWidth(value)
              props.onWidthChange?.(value)
            }}
          >
            <ToggleGroupItem value="desktop">{messages['emailPreview.desktop']}</ToggleGroupItem>
            <ToggleGroupItem value="phone">{messages['emailPreview.phone']}</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={scheme}
            aria-label={messages['emailPreview.client']}
            onValueChange={(value) => {
              if (value !== 'light' && value !== 'dark') return
              setInnerScheme(value)
              props.onSchemeChange?.(value)
            }}
          >
            <ToggleGroupItem value="light">{messages['emailPreview.light']}</ToggleGroupItem>
            <ToggleGroupItem value="dark">{messages['emailPreview.dark']}</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <div
        data-slot="email-client"
        className={cn('box-border min-w-0 rounded-lg bg-surface-sunken', phone ? 'p-2' : 'p-4')}
      >
        <div
          data-slot="email-message"
          data-width={width}
          data-liro-theme={scheme}
          {...(props.lang === undefined ? {} : { lang: props.lang })}
          className="mx-auto box-border w-full min-w-0 overflow-hidden rounded-md bg-surface-raised text-primary shadow-xs"
          style={{ maxWidth: emailPreviewWidth(width) }}
        >
          <dl
            className={cn(
              'm-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-0 border-b border-solid border-default text-xs',
              narrow ? 'px-4 py-3' : 'px-6 py-3',
            )}
          >
            {header.map(([label, value], index) => (
              <div key={label} className="contents">
                <dt className={cn('text-secondary', TEXT_DIRECTION)}>{label}</dt>
                <dd
                  className={cn(
                    'm-0 min-w-0 break-words',
                    index === header.length - 1
                      ? 'text-sm font-semibold text-primary'
                      : 'text-primary',
                    TEXT_DIRECTION,
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className={cn('flex flex-col gap-6', narrow ? 'px-4 py-5' : 'px-8 py-8')}>
            {props.logo !== undefined && <div className="flex">{props.logo}</div>}
            <div className="min-w-0 text-sm text-primary">{props.children}</div>
            {props.footer !== undefined && (
              <div
                className={cn(
                  'border-0 border-t border-solid border-default pt-4 text-xs text-secondary',
                  TEXT_DIRECTION,
                )}
              >
                {props.footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import { ArrowRight, Copy, Download, Printer } from 'lucide-react'
import { useId, useState } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { recoveryCodesText } from './admin-logic'
import { Alert } from './alert'
import { CheckboxField } from './checkbox-field'

/*
 * RecoveryCodes (BUILD-PLAN P5.6): the codes that sign a person in when the second factor is
 * lost. They are shown once, so the block makes sure they were kept before the flow goes on.
 * - A warning (`messages['recovery.shownOnce']`, an Alert in the warning tone) above the codes.
 * - The codes in two columns (one on phones) on surface.sunken, monospace, left to right,
 *   selectable; a list named `messages['recovery.codes']`.
 * - Copy (all codes, one per line; "Copied" is announced, or the browser's refusal with what to
 *   do), Download (a text file made in the browser: `recoveryCodesText`, nothing is fetched),
 *   Print (the codes alone, from a hidden frame, not the whole page): three small neutral
 *   buttons. `onAction` tells the application which was used (its security log).
 * - "I have saved these codes" (a checkbox) enables Continue, the main action, last.
 * - Loading: skeleton lines while the Core makes the codes.
 */

export interface RecoveryCodesProps {
  /** The codes, from the Core. Shown as they are. */
  codes: readonly string[]
  /**
   * The first line of the downloaded and printed file: the account they belong to, written by the
   * application ("Liro Business Apps — milica.petrovic@kvadratgradnja.rs").
   */
  heading: string
  /** The downloaded file's name. Default: "recovery-codes.txt". */
  fileName?: string
  /** The person confirmed and pressed Continue. */
  onContinue: () => void
  /** Which way the codes were kept, for the application's log. */
  onAction?: (action: 'copy' | 'download' | 'print') => void
  /** The codes are being made: skeleton lines. */
  loading?: boolean
  /** How many skeleton lines while loading. Default 10. */
  skeletonCount?: number
  /** Continue's text. Default: `messages['recovery.continue']`. */
  continueLabel?: string
  /** 'phone' puts the codes in one column; default by the viewport (two from 36em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Prints the codes alone, from a hidden frame that is removed afterwards. */
function printCodes(title: string, text: string) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.append(frame)
  const page = frame.contentDocument
  const view = frame.contentWindow
  if (page === null || view === null) {
    frame.remove()
    return
  }
  page.title = title
  const pre = page.createElement('pre')
  pre.textContent = text
  pre.style.font = '14px/1.6 monospace'
  page.body.append(pre)
  view.addEventListener('afterprint', () => {
    frame.remove()
  })
  view.focus()
  view.print()
}

/** Recovery codes shown once: copy, download, print, and a confirmation before going on. */
export function RecoveryCodes(props: RecoveryCodesProps) {
  const { messages } = useLiro()
  const [saved, setSaved] = useState(false)
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')
  const listId = useId()
  const loading = props.loading === true
  const text = recoveryCodesText(props.heading, props.codes)
  const columns = props.layout === 'phone' ? 'grid-cols-1' : 'grid-cols-1 xs:grid-cols-2'

  const copyCodes = () => {
    props.onAction?.('copy')
    navigator.clipboard.writeText(props.codes.join('\n')).then(
      () => {
        setCopy('copied')
      },
      () => {
        setCopy('failed')
      },
    )
  }
  const download = () => {
    props.onAction?.('download')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = props.fileName ?? 'recovery-codes.txt'
    document.body.append(link)
    link.click()
    link.remove()
    // Revoked after the browser has taken the file.
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  return (
    <div data-slot="recovery-codes" className={cn('flex flex-col gap-4', props.className)}>
      <Alert tone="warning">{messages['recovery.shownOnce']}</Alert>
      <span id={listId} className="sr-only">
        {messages['recovery.codes']}
      </span>
      {loading ? (
        <div
          aria-busy="true"
          aria-labelledby={listId}
          role="region"
          className={cn('grid gap-2 rounded-md bg-surface-sunken p-4', columns)}
        >
          {Array.from({ length: props.skeletonCount ?? 10 }, (_, index) => (
            <Skeleton key={index} className="h-5" />
          ))}
        </div>
      ) : (
        <ul
          aria-labelledby={listId}
          dir="ltr"
          className={cn(
            'm-0 grid list-none gap-x-6 gap-y-2 rounded-md bg-surface-sunken p-4 font-mono text-md text-primary tabular-nums select-all',
            columns,
          )}
        >
          {props.codes.map((code) => (
            <li key={code} className="text-start">
              {code}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <SmallButton
          icon={Copy}
          label={messages['recovery.copy']}
          disabled={loading}
          onClick={copyCodes}
        />
        <SmallButton
          icon={Download}
          label={messages['recovery.download']}
          disabled={loading}
          onClick={download}
        />
        <SmallButton
          icon={Printer}
          label={messages['recovery.print']}
          disabled={loading}
          onClick={() => {
            props.onAction?.('print')
            printCodes(props.heading, text)
          }}
        />
        <span
          role="status"
          className={cn(
            'text-xs',
            TEXT_DIRECTION,
            copy === 'failed' ? 'text-status-danger-fg' : 'text-secondary',
          )}
        >
          {copy === 'copied' && messages['recovery.copied']}
          {copy === 'failed' && messages['recovery.copyFailed']}
        </span>
      </div>
      <CheckboxField
        label={messages['recovery.saved']}
        checked={saved}
        disabled={loading}
        onChange={setSaved}
      />
      <ButtonPrimitive
        family="primary"
        emphasis="primary"
        disabled={!saved || loading}
        onClick={props.onContinue}
        className="w-full"
      >
        <ArrowRight aria-hidden="true" className="size-3.75 shrink-0 rtl:-scale-x-100" />
        <span className={TEXT_DIRECTION}>
          {props.continueLabel ?? messages['recovery.continue']}
        </span>
      </ButtonPrimitive>
    </div>
  )
}

/** Mantine Button 'xs' (30px), neutral "default": the small actions beside the codes. */
function SmallButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Copy
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <ButtonPrimitive
      family="neutral"
      emphasis="secondary"
      disabled={disabled}
      onClick={onClick}
      className="min-h-control-sm gap-2 px-3.5 text-xs"
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>{label}</span>
    </ButtonPrimitive>
  )
}

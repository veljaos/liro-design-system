import { CircleAlert, RotateCcw, ScanSearch, ShieldAlert, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'
import { attachmentOffers, type AttachmentState } from './file-logic'
import { ProgressBar, Skeleton } from './progress'
import { Spinner } from './spinner'
import { StatusBadge, type Tone } from './status-badge'

export { attachmentOffers } from './file-logic'
export type { AttachmentOffers, AttachmentState } from './file-logic'

/*
 * AttachmentList (BUILD-PLAN P5.5; docs/decisions.md "Files and document frame"): the files of a
 * record or a document, each with its state and its next step in words.
 *
 * - Rows, never cards (P4.9 rule 4): a 1px border.subtle line between rows. On its own or in a
 *   side panel the rows are 8px above and below (the panel lists' rows, `panel-row`, so a side
 *   panel's edge rule holds); `inCard` pads them 12px by 16px for a card's edges.
 * - Each row: the name (13px medium; a button in the link colour that downloads when the file is
 *   available), its size as the application writes it ("2,4 MB": the component computes no units,
 *   D4), an optional flag (a StatusBadge with the application's tone and text, "Not an archival
 *   format"), then the state line in 12px with a 14px icon:
 *   - uploading: a ProgressBar (5px) and "Uploading, 45%. It is checked for viruses next." (the
 *     percentage through `format.percent`);
 *   - scanning: "Checking for viruses. It can be opened in a moment." (text.secondary);
 *   - available: no state line; the name downloads;
 *   - quarantined: "Blocked: a threat was found, so it cannot be opened. Upload a clean copy."
 *     (status.danger.fg, ShieldAlert);
 *   - failed: "Not uploaded." and the application's reason, with "Upload again" when `onRetry`.
 *   The application's extra control for the file (a "Send with the e-invoice" checkbox) under it.
 * - Download through `onDownload(file)` at the moment of the click: the application fetches a
 *   short-lived link then (a stored link would expire). While its promise is pending the name is
 *   `aria-busy` with a small Spinner after it.
 * - Remove (a 28px Trash2, destructive family, subtle) only where `canRemove(file)` says so; asking
 *   first is the application's (a ConfirmDialog when the file cannot be restored).
 */

/** A file in the list, as the application knows it. */
export interface Attachment {
  id: string
  /** The file's name ("Ugovor 12-2026.pdf"). */
  name: string
  /** Its size, written by the application ("2,4 MB"). */
  sizeText?: string
  state: AttachmentState
  /** While uploading: 0 … 100, when known. */
  progress?: number
  /** A failed upload's reason, from the application. */
  error?: string
  /** A flag beside the name: a tone and the application's text ("Not an archival format"). */
  flag?: { label: string; tone: Tone }
  /** A line under the name, from the application ("Added by Dragan Ilić"). */
  detail?: ReactNode
}

export interface AttachmentListProps {
  /** Names the list for assistive technology ("Attachments"), from the application. */
  label: string
  files: readonly Attachment[]
  /**
   * Downloads an available file: the application fetches a short-lived link at the click and
   * opens it. A returned promise shows a spinner until it settles.
   */
  onDownload?: (file: Attachment) => void | Promise<void>
  /** Whether a file may be removed (the application's rule); without it, none can. */
  canRemove?: (file: Attachment) => boolean
  onRemove?: (file: Attachment) => void
  /** Uploads a failed file again: "Upload again". */
  onRetry?: (file: Attachment) => void
  /** A control per file, from the application (a "Send with the e-invoice" checkbox). */
  extra?: (file: Attachment) => ReactNode
  /** Rows padded for a card's edges (12px by 16px). */
  inCard?: boolean
  /** Skeleton rows while the list loads. */
  loading?: boolean
  /** Shown without files. Default: `messages['attachment.none']`. */
  empty?: ReactNode
  className?: string
}

const ROW = 'flex min-w-0 gap-3 border-0 border-b border-solid border-subtle last:border-b-0'

function StateLine({
  file,
  onRetry,
}: {
  file: Attachment
  onRetry: ((file: Attachment) => void) | undefined
}) {
  const { messages, format } = useLiro()
  if (file.state === 'available') return null
  if (file.state === 'uploading') {
    const percent = file.progress === undefined ? null : format.percent(String(file.progress))
    return (
      <div className="mt-1 flex flex-col gap-1">
        <ProgressBar
          label={file.name}
          {...(file.progress === undefined ? {} : { value: file.progress })}
          className="max-w-80"
        />
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['attachment.uploading'](percent)}
        </p>
      </div>
    )
  }
  const look =
    file.state === 'scanning'
      ? { icon: ScanSearch, colour: 'text-secondary', text: messages['attachment.scanning'] }
      : file.state === 'quarantined'
        ? {
            icon: ShieldAlert,
            colour: 'text-status-danger-fg',
            text: messages['attachment.quarantined'],
          }
        : {
            icon: CircleAlert,
            colour: 'text-status-danger-fg',
            text:
              file.error === undefined
                ? messages['attachment.failed']
                : `${messages['attachment.failed']} ${file.error}`,
          }
  const offers = attachmentOffers(file.state, {
    canDownload: false,
    canRemove: false,
    canRetry: onRetry !== undefined,
  })
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className={cn('m-0 flex min-w-0 items-start gap-1.5 text-xs', look.colour)}>
        <look.icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{look.text}</span>
      </p>
      {offers.retry && onRetry !== undefined && (
        <ButtonPrimitive
          family="neutral"
          emphasis="secondary"
          className="min-h-control-sm gap-2 px-3.5 text-xs"
          aria-label={messages['attachment.retry'](file.name)}
          onClick={() => {
            onRetry(file)
          }}
        >
          <RotateCcw aria-hidden="true" className="size-3 shrink-0" />
          <span className={TEXT_DIRECTION}>{messages['attachment.retryLabel']}</span>
        </ButtonPrimitive>
      )}
    </div>
  )
}

/** The files of a record or a document, each with its state, its next step and its actions. */
export function AttachmentList(props: AttachmentListProps) {
  const { messages } = useLiro()
  const [downloading, setDownloading] = useState<ReadonlySet<string>>(new Set())
  const inCard = props.inCard === true
  const rowPadding = inCard ? 'px-4 py-3' : 'py-2'

  const download = (file: Attachment) => {
    const result = props.onDownload?.(file)
    if (!(result instanceof Promise)) return
    setDownloading((current) => new Set(current).add(file.id))
    const done = () => {
      setDownloading((current) => {
        const next = new Set(current)
        next.delete(file.id)
        return next
      })
    }
    void result.then(done, done)
  }

  if (props.loading === true) {
    return (
      <ul
        aria-label={props.label}
        aria-busy="true"
        className={cn('m-0 flex list-none flex-col p-0 font-sans', props.className)}
      >
        {[0, 1, 2].map((index) => (
          <li key={index} className={cn(ROW, rowPadding, 'flex-col gap-1.5')}>
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </li>
        ))}
      </ul>
    )
  }
  if (props.files.length === 0) {
    return (
      <p
        data-slot="attachment-list"
        className={cn(
          'm-0 font-sans text-sm text-secondary',
          rowPadding,
          TEXT_DIRECTION,
          props.className,
        )}
      >
        {props.empty ?? messages['attachment.none']}
      </p>
    )
  }
  return (
    <ul
      aria-label={props.label}
      data-slot="attachment-list"
      className={cn('m-0 flex list-none flex-col p-0 font-sans', props.className)}
    >
      {props.files.map((file) => {
        const offers = attachmentOffers(file.state, {
          canDownload: props.onDownload !== undefined,
          canRemove: props.onRemove !== undefined && props.canRemove?.(file) === true,
          canRetry: props.onRetry !== undefined,
        })
        const busy = downloading.has(file.id)
        const name = (
          <bdi className="min-w-0 break-words" dir="auto">
            {file.name}
          </bdi>
        )
        return (
          <li
            key={file.id}
            data-state={file.state}
            {...(inCard ? {} : { 'data-slot': 'panel-row' })}
            className={cn(ROW, rowPadding, 'items-start')}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                {offers.download ? (
                  <button
                    type="button"
                    aria-busy={busy || undefined}
                    aria-label={messages['attachment.download'](file.name)}
                    onClick={() => {
                      download(file)
                    }}
                    className={cn(
                      BUTTON_RESET,
                      'min-w-0 cursor-pointer rounded-sm text-start text-sm font-medium text-link hover:underline',
                      FOCUS_RING,
                    )}
                  >
                    {name}
                  </button>
                ) : (
                  <span
                    className={cn(
                      'min-w-0 text-sm font-medium',
                      file.state === 'quarantined' ? 'text-secondary' : 'text-primary',
                    )}
                  >
                    {name}
                  </span>
                )}
                {busy && <Spinner size="sm" label={messages['attachment.download'](file.name)} />}
                {file.sizeText !== undefined && (
                  <span dir="auto" className="text-xs whitespace-nowrap text-tertiary tabular-nums">
                    {file.sizeText}
                  </span>
                )}
                {file.flag !== undefined && (
                  <StatusBadge label={file.flag.label} tone={file.flag.tone} />
                )}
              </div>
              {file.detail !== undefined && (
                <div className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{file.detail}</div>
              )}
              <StateLine file={file} onRetry={props.onRetry} />
              {props.extra !== undefined && <div className="mt-1">{props.extra(file)}</div>}
            </div>
            {offers.remove && props.onRemove !== undefined && (
              <CompactIconButton
                family="destructive"
                icon={Trash2}
                label={messages['attachment.remove'](file.name)}
                onClick={() => {
                  props.onRemove?.(file)
                }}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

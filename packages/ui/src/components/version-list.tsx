import { Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { UnavailableAction } from './actions'
import { Button, CompactIconButton } from './button'
import { momentText, sizeText } from './file-browser-logic'
import { FactsLine } from './file-entry-parts'
import { CURRENT_ROW, CURRENT_TONE, StatusBadge } from './status-badge'

/*
 * VersionList: a file's versions, newest first, in its details panel.
 * - Rows (the panel lists' rows, `panel-row`, so SidePanels' edge rule holds): the version's name
 *   (medium), then when, who and its size (through `format`), and the application's note
 *   ("Signed by both parties"). The current version stands out:
 *   its row on the subtle success background and "Current" a success badge — the one
 *   "current" look of the library (CURRENT_ROW, CURRENT_TONE).
 * - Each version: Download and, on an earlier one, Restore — 28px neutral icon buttons, each named
 *   in the library's Tooltip. Restoring is not destructive (it makes a new current version and
 *   keeps every other), so it runs at once, without asking (Undo over confirmations: restore the
 *   other version again); a promise keeps the row's buttons waiting.
 * - "Upload a new version" (neutral) under the list opens the file dialog; the file goes to
 *   `onUpload` (the application checks and uploads it). Restore and upload can be unavailable
 *   with the application's reason (`restoreUnavailable`, `uploadUnavailable`: "Signed documents
 *   keep their versions.", offline).
 */

/** One version of a file, from the application. */
export interface FileVersion {
  id: string
  /** Its name ("Version 3"). */
  label: string
  /** When it was saved: an ISO instant in the tenant's offset. */
  at: string
  /** Who saved it. */
  by: string
  size?: string
  sizeUnit?: string
  /** The application's note ("Signed by both parties"). */
  note?: string
  /** The version everyone opens now. */
  current?: boolean
}

export interface VersionListProps {
  /** Newest first. */
  versions: readonly FileVersion[]
  /** Names the list. Default `messages['files.versions']`. */
  label?: string
  /** Downloads one version; a promise is the application's to show. */
  onDownload?: (version: FileVersion) => void
  /**
   * Makes an earlier version the current one, at once (not destructive, so no question); a
   * promise keeps the row's buttons waiting.
   */
  onRestore?: (version: FileVersion) => void | Promise<void>
  /** Restore cannot be used, and why. */
  restoreUnavailable?: string
  /** A new version was chosen: the application uploads it. */
  onUpload?: (file: File) => void
  /** Uploading a new version cannot be used, and why. */
  uploadUnavailable?: string
  /** Skeleton rows while the versions load. */
  loading?: boolean
  className?: string
}

const ROW =
  'flex min-w-0 items-start gap-2 border-0 border-b border-solid border-subtle py-2 last:border-b-0'

/** A file's versions with Download, Restore and "Upload a new version". */
export function VersionList(props: VersionListProps) {
  const { messages, format } = useLiro()
  const input = useRef<HTMLInputElement>(null)
  // The version being restored, while the application's promise runs.
  const [restoring, setRestoring] = useState<string | null>(null)
  const restore = (version: FileVersion) => {
    const result = props.onRestore?.(version)
    if (!(result instanceof Promise)) return
    setRestoring(version.id)
    void result.finally(() => {
      setRestoring(null)
    })
  }
  const label = props.label ?? messages['files.versions']

  const chosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file !== undefined) props.onUpload?.(file)
  }

  let list
  if (props.loading === true) {
    list = (
      <ul aria-label={label} aria-busy="true" className="m-0 flex list-none flex-col p-0">
        {[0, 1, 2].map((index) => (
          <li key={index} data-slot="panel-row" className={cn(ROW, 'flex-col gap-1.5')}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
          </li>
        ))}
      </ul>
    )
  } else if (props.versions.length === 0) {
    list = (
      <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
        {messages['versions.empty']}
      </p>
    )
  } else {
    list = (
      <ul aria-label={label} className="m-0 flex list-none flex-col p-0">
        {props.versions.map((version) => {
          const facts = [momentText(format, version.at)]
          const size = sizeText(format, messages, version)
          if (size !== null) facts.push(size)
          return (
            <li
              key={version.id}
              data-slot="panel-row"
              data-current={version.current === true || undefined}
              className={cn(ROW, version.current === true && cn(CURRENT_ROW, '-mx-2 px-2'))}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                    {version.label}
                  </span>
                  {version.current === true && (
                    <StatusBadge label={messages['versions.current']} tone={CURRENT_TONE} />
                  )}
                </span>
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{version.by}</span>
                <FactsLine facts={facts} />
                {version.note !== undefined && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {version.note}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {props.onDownload !== undefined && (
                  <CompactIconButton
                    family="neutral"
                    icon={Download}
                    disabled={restoring !== null}
                    label={messages['versions.download'](version.label)}
                    onClick={() => props.onDownload?.(version)}
                  />
                )}
                {props.onRestore !== undefined &&
                  version.current !== true &&
                  props.restoreUnavailable === undefined && (
                    <CompactIconButton
                      family="neutral"
                      icon={RotateCcw}
                      label={messages['versions.restoreOf'](version.label)}
                      disabled={restoring !== null}
                      aria-busy={restoring === version.id || undefined}
                      onClick={() => {
                        restore(version)
                      }}
                    />
                  )}
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div
      data-slot="version-list"
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      {list}
      {props.restoreUnavailable !== undefined && props.onRestore !== undefined && (
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {props.restoreUnavailable}
        </p>
      )}
      {props.onUpload !== undefined &&
        (props.uploadUnavailable === undefined ? (
          <div>
            <Button
              family="neutral"
              icon={Upload}
              label={messages['versions.upload']}
              onClick={() => input.current?.click()}
            />
            <input ref={input} type="file" hidden tabIndex={-1} onChange={chosen} />
          </div>
        ) : (
          <UnavailableAction
            family="neutral"
            icon={Upload}
            label={messages['versions.upload']}
            reason={props.uploadUnavailable}
          />
        ))}
    </div>
  )
}

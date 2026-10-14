import { Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { UnavailableAction } from './actions'
import { Button, CompactIconButton } from './button'
import { ConfirmDialog } from './confirm-dialog'
import { momentText, sizeText } from './file-browser-logic'
import { FactsLine } from './file-entry-parts'
import { StatusBadge } from './status-badge'

/*
 * VersionList (BUILD-PLAN P5.43): a file's versions, newest first, in its details panel.
 * - Rows (the panel lists' rows, `panel-row`, so SidePanels' edge rule holds): the version's name
 *   (medium) with "Current" (a neutral badge) on the current one, then when, who and its size
 *   (through `format`), and the application's note ("Signed by both parties").
 * - Each earlier version: Download (28px, the document family) and Restore (28px, the caution
 *   family: it changes what everyone opens), Restore asking first in a ConfirmDialog with the
 *   version as its subject (D22). The current one has only Download.
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
  /** Makes an earlier version the current one, after asking; a promise keeps the dialog busy. */
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
  const [asking, setAsking] = useState<FileVersion | null>(null)
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
            <li key={version.id} data-slot="panel-row" className={ROW}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                    {version.label}
                  </span>
                  {version.current === true && (
                    <StatusBadge label={messages['versions.current']} tone="neutral" />
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
                    family="document"
                    icon={Download}
                    label={messages['versions.download'](version.label)}
                    onClick={() => props.onDownload?.(version)}
                  />
                )}
                {props.onRestore !== undefined &&
                  version.current !== true &&
                  props.restoreUnavailable === undefined && (
                    <CompactIconButton
                      family="caution"
                      icon={RotateCcw}
                      label={messages['versions.restoreOf'](version.label)}
                      onClick={() => {
                        setAsking(version)
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
      <ConfirmDialog
        open={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null)
        }}
        family="caution"
        actionIcon={RotateCcw}
        title={messages['versions.restoreTitle']}
        {...(asking === null ? {} : { subject: asking.label })}
        message={messages['versions.restoreMessage']}
        confirmLabel={messages['versions.restore']}
        onConfirm={() => {
          if (asking === null) return
          const result = props.onRestore?.(asking)
          if (result instanceof Promise) {
            return result.then(() => {
              setAsking(null)
            })
          }
          setAsking(null)
        }}
      />
    </div>
  )
}

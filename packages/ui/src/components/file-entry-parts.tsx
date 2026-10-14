import {
  CircleAlert,
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Folder,
  Lock,
  Presentation,
  ScanSearch,
  ShieldAlert,
  Star,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  fileIconKind,
  momentText,
  sizeText,
  type FileEntry,
  type FileIconKind,
} from './file-browser-logic'
import { StatusBadge } from './status-badge'

/*
 * The pieces every view of files shares (P5.43): a file's icon by its family, and its name with
 * what the application says beside it (badges in its words and tone, shared, favourite), and the
 * facts line under it. Icons are neutral (text.secondary, folders too): a file's family is said
 * by its type, never by a colour (D17).
 */

const ICONS: Record<FileIconKind, LucideIcon> = {
  folder: Folder,
  pdf: FileText,
  image: FileImage,
  document: FileType,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: FileArchive,
  video: FileVideo,
  audio: FileAudio,
  text: FileText,
  other: File,
}

/** A file's or folder's icon, decorative (the name and type say what it is). */
export function FileIcon({
  entry,
  className,
}: {
  entry: Pick<FileEntry, 'name' | 'kind' | 'icon'>
  className?: string
}) {
  const Icon = ICONS[fileIconKind(entry)]
  return (
    <Icon
      aria-hidden="true"
      data-file-icon={fileIconKind(entry)}
      className={cn('size-5 shrink-0 text-secondary', className)}
    />
  )
}

/** After the name: the application's badges, then shared, favourite and locked as icons. */
export function EntryMarks({ entry }: { entry: FileEntry }) {
  const { messages } = useLiro()
  const hasMarks =
    entry.shared === true ||
    entry.favourite === true ||
    entry.lockedReason !== undefined ||
    (entry.badges !== undefined && entry.badges.length > 0)
  if (!hasMarks) return null
  return (
    <>
      {entry.shared === true && (
        <span className="inline-flex shrink-0 items-center text-secondary">
          <Users aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{messages['files.shared']}</span>
        </span>
      )}
      {entry.favourite === true && (
        <span className="inline-flex shrink-0 items-center text-secondary">
          <Star aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{messages['files.favourite']}</span>
        </span>
      )}
      {entry.lockedReason !== undefined && (
        <Lock aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
      )}
      {entry.badges?.map((badge) => (
        <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
      ))}
    </>
  )
}

/** The facts under a name: a folder's items, or a file's size and when it was changed. */
export function useEntryFacts() {
  const { format, messages } = useLiro()
  return (entry: FileEntry): string[] => {
    const facts: string[] = []
    if (entry.kind === 'folder' && entry.itemCount !== undefined) {
      facts.push(messages['files.items'](entry.itemCount, format.number(String(entry.itemCount))))
    }
    const size = sizeText(format, messages, entry)
    if (size !== null) facts.push(size)
    if (entry.modified !== undefined) facts.push(momentText(format, entry.modified))
    return facts
  }
}

/** The facts as one line: "2,4 MB · 12.10.2026. 14:05", each part kept in its own order. */
export function FactsLine({ facts, className }: { facts: readonly string[]; className?: string }) {
  if (facts.length === 0) return null
  return (
    <span className={cn('flex min-w-0 flex-wrap gap-x-1.5 text-xs text-secondary', className)}>
      {facts.map((fact, index) => (
        // The dot stays at the end of a part, so a wrapped line never starts with it.
        <span key={index} className="inline-flex gap-x-1.5 whitespace-nowrap">
          <span className={cn('tabular-nums', TEXT_ISOLATE)}>{fact}</span>
          {index < facts.length - 1 && <span aria-hidden="true">·</span>}
        </span>
      ))}
    </span>
  )
}

/**
 * While a file is uploaded or checked (P5.5's states, AttachmentList's words): one xs line with
 * its icon; blocked and failed in status.danger.fg. Nothing once it is available.
 */
export function EntryState({ entry }: { entry: FileEntry }) {
  const { messages } = useLiro()
  const state = entry.state
  if (state === undefined || state === 'available') return null
  const look =
    state === 'uploading'
      ? { icon: Upload, colour: 'text-secondary', text: messages['attachment.uploading'](null) }
      : state === 'scanning'
        ? { icon: ScanSearch, colour: 'text-secondary', text: messages['attachment.scanning'] }
        : state === 'quarantined'
          ? {
              icon: ShieldAlert,
              colour: 'text-status-danger-fg',
              text: messages['attachment.quarantined'],
            }
          : {
              icon: CircleAlert,
              colour: 'text-status-danger-fg',
              text: messages['attachment.failed'],
            }
  return (
    <span
      data-state={state}
      className={cn('flex min-w-0 items-start gap-1.5 text-xs', look.colour)}
    >
      <look.icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>{look.text}</span>
    </span>
  )
}

/** The name with its icon and marks, and the location line (results from everywhere, Trash). */
export function EntryName({ entry, className }: { entry: FileEntry; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-start gap-2.5', className)}>
      <FileIcon entry={entry} className="mt-px" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <bdi dir="auto" className="min-w-0 font-medium break-words text-primary">
            {entry.name}
          </bdi>
          <EntryMarks entry={entry} />
        </span>
        {entry.location !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{entry.location}</span>
        )}
        {entry.lockedReason !== undefined && (
          <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{entry.lockedReason}</span>
        )}
        <EntryState entry={entry} />
      </span>
    </span>
  )
}

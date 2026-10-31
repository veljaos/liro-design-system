import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import type { AttachmentState } from './file-logic'
import type { Tone } from './status-badge'
import type { TreeNode } from './tree-logic'
import { usageAmount } from './usage-logic'

/*
 * The logic of the files and folders view, kept apart from the markup so it
 * can be unit-tested: which icon a file takes, where a dragged item may land,
 * which folders a move cannot choose, how a selection grows, how an upload's conflicts are
 * answered, and what the uploads add up to in words. Nothing here sorts, filters or sums sizes:
 * the files arrive in the order to show, and every size and total is the application's decimal
 * string.
 */

// ── Entries ───────────────────────────────────────────────────────────────────────────────────

/** The family of a file, for its icon. */
export type FileIconKind =
  | 'folder'
  | 'pdf'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'video'
  | 'audio'
  | 'text'
  | 'other'

/** A record the file is linked to, from the application ("Invoice F-2026-0412"). */
export interface FileLink {
  key: string
  label: string
  href: string
}

/** A file or a folder, as the application knows it. */
export interface FileEntry {
  id: string
  /** The file's or folder's name ("Ugovor_Stanogradnja_Liman_4.pdf"). */
  name: string
  kind: 'file' | 'folder'
  /** The family for its icon. Default: from the name's extension (`fileIconKind`). */
  icon?: FileIconKind
  /** The type in words, from the application ("PDF document"). */
  typeLabel?: string
  /** Who owns it, from the application. */
  owner?: string
  /** When it was last changed: an ISO instant in the tenant's offset, or YYYY-MM-DD. */
  modified?: string
  /** Its size, a decimal string in `sizeUnit` ("2.4"), written through `format`. */
  size?: string
  /** The size's unit, from the application ("MB"). */
  sizeUnit?: string
  /** A folder's number of items, from the application. */
  itemCount?: number
  /** The records the file is linked to (an invoice, an employee's file). */
  links?: readonly FileLink[]
  /** Where it is, for results from everywhere and for Trash ("Contracts / 2026"). */
  location?: string
  /** A small picture of the file (an image's address), for the grid. */
  thumbnail?: string
  /** A state in the application's words and tone beside the name ("Signed", "Keep until 2036"). */
  badges?: readonly { label: string; tone: Tone }[]
  /** Shared with others: a Users icon after the name, named for assistive technology. */
  shared?: boolean
  /** Marked as a favourite: a Star after the name. */
  favourite?: boolean
  /** While it is uploaded or checked (AttachmentList's states); 'available' or left out: ready. */
  state?: AttachmentState
  /** The item cannot be opened, and why, in the application's words. */
  lockedReason?: string
}

const EXTENSION_KINDS: Record<string, FileIconKind> = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  heic: 'image',
  tif: 'image',
  tiff: 'image',
  svg: 'image',
  doc: 'document',
  docx: 'document',
  odt: 'document',
  rtf: 'document',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  ods: 'spreadsheet',
  csv: 'spreadsheet',
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  txt: 'text',
  md: 'text',
  xml: 'text',
  json: 'text',
}

/** The family of an entry for its icon: its own `icon`, a folder, else by the name's extension. */
export function fileIconKind(entry: Pick<FileEntry, 'name' | 'kind' | 'icon'>): FileIconKind {
  if (entry.icon !== undefined) return entry.icon
  if (entry.kind === 'folder') return 'folder'
  const dot = entry.name.lastIndexOf('.')
  if (dot <= 0 || dot === entry.name.length - 1) return 'other'
  return EXTENSION_KINDS[entry.name.slice(dot + 1).toLowerCase()] ?? 'other'
}

/** A size in words: "2,4 MB" (the number through `format.number`, exactly as given); null without. */
export function sizeText(
  format: LiroFormat,
  messages: LiroMessages,
  entry: Pick<FileEntry, 'size' | 'sizeUnit'>,
): string | null {
  if (entry.size === undefined || entry.size === '') return null
  return usageAmount(format, messages, entry.size, entry.sizeUnit)
}

/** When something happened, as the tenant writes it: a date, or a date and a time. */
export function momentText(format: LiroFormat, value: string): string {
  const day = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0]
  if (day === undefined) return value
  if (!/T\d{2}:\d{2}/.test(value)) return format.date(day)
  return `${format.date(day)} ${format.time(value)}`
}

// ── Moving ────────────────────────────────────────────────────────────────────────────────────

/** Each node's parent's id (null at the top), over the loaded tree. */
function parents(nodes: readonly TreeNode<unknown>[]): Map<string, string | null> {
  const map = new Map<string, string | null>()
  const walk = (list: readonly TreeNode<unknown>[], parent: string | null) => {
    for (const node of list) {
      map.set(node.id, parent)
      walk(node.children ?? [], node.id)
    }
  }
  walk(nodes, null)
  return map
}

/** The folder's path from the top: the ids of its ancestors, then its own. */
export function folderPath(nodes: readonly TreeNode<unknown>[], id: string): string[] {
  const parentOf = parents(nodes)
  if (!parentOf.has(id)) return [id]
  const path = [id]
  let current = parentOf.get(id) ?? null
  while (current !== null) {
    path.unshift(current)
    current = parentOf.get(current) ?? null
  }
  return path
}

/**
 * Whether items may be dropped into a folder: never into one of the items itself or a folder
 * inside one of them (`targetPath`, the target's path from the top, `folderPath`), and never into
 * the folder they are already in (`from`). The application may still refuse (its rules).
 */
export function canDropInto(
  moving: readonly string[],
  target: string,
  targetPath: readonly string[],
  from?: string | null,
): boolean {
  if (moving.length === 0) return false
  if (from !== undefined && from !== null && target === from) return false
  if (moving.includes(target)) return false
  return !targetPath.some((id) => moving.includes(id))
}

/**
 * The folders a move cannot choose: the moved folders and every folder inside them (as far as
 * the tree is loaded).
 */
export function blockedFolders(
  nodes: readonly TreeNode<unknown>[],
  moving: readonly string[],
): Set<string> {
  const blocked = new Set<string>()
  const walk = (list: readonly TreeNode<unknown>[], inside: boolean) => {
    for (const node of list) {
      const here = inside || moving.includes(node.id)
      if (here) blocked.add(node.id)
      walk(node.children ?? [], here)
    }
  }
  walk(nodes, false)
  return blocked
}

/**
 * The tree for a folder picker: the blocked folders (`blockedFolders`) cannot be chosen and say
 * why (`reason`, from the provider's messages); a reason the application gave a node is kept.
 */
export function pickerTree<Data>(
  nodes: readonly TreeNode<Data>[],
  blocked: ReadonlySet<string>,
  reason: string,
): TreeNode<Data>[] {
  return nodes.map((node) => {
    const children =
      node.children === undefined ? {} : { children: pickerTree(node.children, blocked, reason) }
    if (!blocked.has(node.id) || node.disabledReason !== undefined) return { ...node, ...children }
    return { ...node, ...children, disabledReason: reason }
  })
}

// ── Selection ─────────────────────────────────────────────────────────────────────────────────

/** The selection with `id` added or taken away. */
export function toggleSelection(selection: readonly string[], id: string): string[] {
  return selection.includes(id) ? selection.filter((each) => each !== id) : [...selection, id]
}

/**
 * Shift+click or Shift+arrow: every item from the anchor to `id` in the order shown, added to
 * the selection (the anchor is the last item pressed; without one, only `id`).
 */
export function selectRange(
  order: readonly string[],
  selection: readonly string[],
  anchor: string | null,
  id: string,
): string[] {
  const to = order.indexOf(id)
  const from = anchor === null ? -1 : order.indexOf(anchor)
  if (to === -1) return [...selection]
  if (from === -1) return selection.includes(id) ? [...selection] : [...selection, id]
  const [start, end] = from <= to ? [from, to] : [to, from]
  const range = order.slice(start, end + 1)
  return [...selection, ...range.filter((each) => !selection.includes(each))]
}

// ── Uploads ───────────────────────────────────────────────────────────────────────────────────

/** A chosen or dropped file with its path inside a chosen folder ("Photos/2026/IMG_1.jpg"). */
export interface UploadedFile {
  file: File
  /** The file's name, or its path from the chosen folder's name down. */
  path: string
}

/** Chosen files with their paths: inside a chosen folder the browser gives each its path. */
export function withPaths(files: readonly File[]): UploadedFile[] {
  return files.map((file) => {
    // Not every browser (nor a test's File) has it.
    const relative: unknown = file.webkitRelativePath
    return { file, path: typeof relative === 'string' && relative !== '' ? relative : file.name }
  })
}

/** How the uploads stand: how many are done, still running, and could not be taken. */
export interface UploadCounts {
  total: number
  /** Available: uploaded and checked. */
  done: number
  /** Uploading or being checked. */
  running: number
  /** Failed or blocked. */
  problems: number
}

export function uploadCounts(files: readonly { state: AttachmentState }[]): UploadCounts {
  let done = 0
  let running = 0
  let problems = 0
  for (const file of files) {
    if (file.state === 'available') done += 1
    else if (file.state === 'uploading' || file.state === 'scanning') running += 1
    else problems += 1
  }
  return { total: files.length, done, running, problems }
}

// ── Name conflicts ────────────────────────────────────────────────────────────────────────────

/** What to do with a file whose name is already taken in its folder. */
export type ConflictChoice = 'replace' | 'keepBoth' | 'skip'

export interface ConflictResolution {
  id: string
  choice: ConflictChoice
}

/**
 * Answers the first waiting conflict, or with `applyToAll` every waiting one (a conflict that
 * cannot be replaced, `replaceUnavailable`, is kept for its own answer when the choice is
 * Replace). Returns the answers given and the conflicts still waiting, in order.
 */
export function resolveConflicts<C extends { id: string; replaceUnavailable?: string }>(
  waiting: readonly C[],
  choice: ConflictChoice,
  applyToAll: boolean,
): { resolved: ConflictResolution[]; remaining: C[] } {
  const [first, ...rest] = waiting
  if (first === undefined) return { resolved: [], remaining: [] }
  const resolved: ConflictResolution[] = [{ id: first.id, choice }]
  if (!applyToAll) return { resolved, remaining: rest }
  const remaining: C[] = []
  for (const conflict of rest) {
    if (choice === 'replace' && conflict.replaceUnavailable !== undefined) remaining.push(conflict)
    else resolved.push({ id: conflict.id, choice })
  }
  return { resolved, remaining }
}

// ── Sharing ───────────────────────────────────────────────────────────────────────────────────

/** Whether a link's expiry date (YYYY-MM-DD) is not after today: such a link would not open. */
export function expiresTooSoon(expires: string | null, today: string): boolean {
  if (expires === null || expires === '') return false
  return expires <= today
}

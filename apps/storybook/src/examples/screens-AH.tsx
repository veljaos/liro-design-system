import {
  Clock,
  Copy,
  Download,
  Eye,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Info,
  Pencil,
  RotateCcw,
  Share2,
  Signature,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Button,
  ConfirmDialog,
  DocumentFrame,
  FileBrowser,
  FileDetails,
  FileNameDialog,
  FilePreview,
  FolderPickerDialog,
  IrreversibleConfirmDialog,
  NameConflictDialog,
  PageViewer,
  ShareDialog,
  SignerList,
  Toaster,
  UsageMeter,
  VersionList,
  fileIconKind,
  momentText,
  notice,
  sizeText,
  useLiro,
  type Attachment,
  type ConflictResolution,
  type Crumb,
  type DataTableColumn,
  type DataTableFilters,
  type DataTableSort,
  type FileEntry,
  type FilePlace,
  type MenuEntry,
  type NameConflict,
  type ShareCandidate,
  type ShareLevel,
  type TreeNode,
  type UploadedFile,
} from '@veljaos/ui'
import { viewer } from '../../../../packages/ui/src/components/document-frame-story-data'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import {
  AH_CANDIDATES,
  AH_ITEMS,
  AH_LEVELS,
  AH_ME,
  AH_NOW,
  AH_ROUTES,
  AH_STORAGE,
  AH_TODAY,
  ahRules,
  type DriveItem,
  type FolderRules,
  type PreviewKind,
} from './data-AH'

/*
 * Group AH's example screens (P5.43, files and folders): Kvadrat Gradnja d.o.o.'s company
 * documents on 14 October 2026 at 09:40, seen by Milica Petrović. One screen, `DriveScreen`,
 * plays the application around FileBrowser for any set of folders (group AI uses it for an
 * accounting firm's client folders and the client's portal): it keeps the files above the screens
 * (`useExampleState`), decides what each folder allows (`rules`), searches, filters and sorts,
 * answers the uploads (with their conflicts), the moves, the sharing, the signing, the versions
 * and Trash; the components show and report.
 * - Every folder has its address (`route`), so the path's breadcrumbs and the tree navigate.
 * - Moving: drag onto a folder (FileBrowser), or "Move to…" in the menu and on the selection
 *   (FolderPickerDialog). Copying: "Copy to…".
 * - Upload: files and whole folders; a name already in the folder asks NameConflictDialog; the
 *   uploads go uploading → checked for viruses → available (an .exe is quarantined).
 * - Trash: Restore, "Delete for good…" (ConfirmDialog) and "Empty Trash…" (IrreversibleConfirmDialog).
 * - Phones: the list, actions in the bottom sheet, the camera in the upload dialog, the preview
 *   full screen, the details in a Drawer.
 */

export { AH_ROUTES }

// ── The drive's configuration (shared with group AI) ──────────────────────────────────────────

/** The shell around a drive's screen, with the page's own crumbs. */
export type DriveShell = (props: {
  phone: boolean
  crumbs: Crumb[]
  children: ReactNode
}) => ReactNode

export interface DriveConfig {
  /** The key the files are kept by above the screens. */
  stateKey: string
  initial: () => DriveItem[]
  /** The top's name ("Company documents"). */
  label: string
  /** A folder's address; null: the top. */
  route: (folder: string | null) => string
  /** A quick place's address; without it there are no quick places. */
  placeRoute?: (key: string) => string
  /** The top-level folders this side sees (a portal sees only its own). */
  roots?: readonly string[]
  rules: (folder: string | null, items: readonly DriveItem[]) => FolderRules
  /** Who uploads here, as the owner of what they upload. */
  me: string
  now: string
  today: string
  storage?: { used: string; limit: string; unit: string; note: string }
  levels: ShareLevel[]
  candidates: ShareCandidate[]
  Shell: DriveShell
}

/** How a screen opens: its folder or place and what the application restores. */
export interface DriveStart {
  folder: string | null
  place?: 'recent' | 'favourites' | 'shared' | 'trash'
  view?: 'list' | 'grid'
  checked?: string[]
  details?: string
  preview?: string
  ask?: 'upload' | 'conflict' | 'move' | 'share' | 'empty'
  askFor?: string
  uploading?: boolean
  search?: string
  offline?: boolean
}

// ── The application's helpers ─────────────────────────────────────────────────────────────────

const TYPE_FILTER = [
  {
    id: 'type',
    label: 'Type',
    type: 'multiSelect' as const,
    options: [
      { value: 'folder', label: 'Folders' },
      { value: 'pdf', label: 'PDF' },
      { value: 'image', label: 'Images' },
      { value: 'office', label: 'Office files' },
      { value: 'other', label: 'Other' },
    ],
  },
]

const SORT_COLUMNS = [
  { id: 'name', label: 'Name' },
  { id: 'modified', label: 'Modified' },
  { id: 'size', label: 'Size' },
]

/** The type filter's group of an item. */
function typeGroup(item: FileEntry): string {
  const kind = fileIconKind(item)
  if (kind === 'folder' || kind === 'pdf' || kind === 'image') return kind
  if (kind === 'document' || kind === 'spreadsheet' || kind === 'presentation') return 'office'
  return 'other'
}

/** Bytes of a size, for the application's sort only (never shown). */
function bytes(item: FileEntry): number {
  if (item.size === undefined) return -1
  const factor = { KB: 1e3, MB: 1e6, GB: 1e9 }[item.sizeUnit ?? ''] ?? 1
  return Number(item.size) * factor
}

/** Without accents and case, as the application's search matches. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'dj')
    .replace(/Đ/g, 'Dj')
    .toLocaleLowerCase('sr-Latn')
}

/** The folders as the tree shows them. */
function folderTree(
  items: readonly DriveItem[],
  parent: string | null,
  roots: readonly string[] | undefined,
): TreeNode[] {
  return items
    .filter(
      (item) =>
        item.kind === 'folder' &&
        item.deleted === undefined &&
        (parent === null && roots !== undefined ? roots.includes(item.id) : item.parent === parent),
    )
    .map((item) => ({ id: item.id, label: item.name, children: folderTree(items, item.id, roots) }))
}

/** The ids of a folder and its ancestors, from the top. */
function pathOf(items: readonly DriveItem[], id: string | null): DriveItem[] {
  const path: DriveItem[] = []
  let current = id
  while (current !== null) {
    const item = items.find((each) => each.id === current)
    if (item === undefined) break
    path.unshift(item)
    current = item.parent
  }
  return path
}

/** A "keep both" name: "Name (1).ext", the first free. */
function freeName(name: string, taken: readonly string[]): string {
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const extension = dot > 0 ? name.slice(dot) : ''
  for (let index = 1; ; index += 1) {
    const candidate = `${stem} (${String(index)})${extension}`
    if (!taken.includes(candidate)) return candidate
  }
}

/** A chosen file's size as the application writes it (decimal string and unit). */
function sizeOf(file: File): { size: string; sizeUnit: string } {
  if (file.size >= 1e6) return { size: (file.size / 1e6).toFixed(1), sizeUnit: 'MB' }
  return { size: String(Math.max(Math.round(file.size / 1e3), 1)), sizeUnit: 'KB' }
}

function previewKind(name: string): PreviewKind {
  const kind = fileIconKind({ name, kind: 'file' })
  if (kind === 'image') return 'image'
  if (kind === 'pdf' || kind === 'document' || kind === 'spreadsheet') return 'document'
  return 'none'
}

/** An item taken out of Trash. */
function restored(item: DriveItem): DriveItem {
  const copy = { ...item }
  delete copy.deleted
  return copy
}

/** The application's viewer page of a document (illustrative text). */
function documentViewer(item: DriveItem): string {
  return viewer({
    title: item.name,
    lang: 'sr-Latn',
    pages: [
      `<h1>${item.name}</h1><p>${item.typeLabel ?? 'Document'} · ${item.owner ?? ''}</p><p>Illustrative document. The application’s viewer shows the file here.</p>`,
    ],
  })
}

// ── The screen ────────────────────────────────────────────────────────────────────────────────

/** Uploads under way: P5.5's states, as the application reports them. */
const SAMPLE_UPLOADS: Attachment[] = [
  {
    id: 'up-1',
    name: 'IMG_2026-10-14_0931.jpg',
    sizeText: '3,4 MB',
    state: 'uploading',
    progress: 62,
  },
  { id: 'up-2', name: 'IMG_2026-10-14_0932.jpg', sizeText: '3,1 MB', state: 'scanning' },
  { id: 'up-3', name: 'IMG_2026-10-14_0930.jpg', sizeText: '3,6 MB', state: 'available' },
  {
    id: 'up-4',
    name: 'kamera_alat_setup.exe',
    sizeText: '1,2 MB',
    state: 'quarantined',
  },
]

/** Three photos from the site whose names are taken in Site photos. */
function sampleConflicts(items: readonly DriveItem[], folderName: string): NameConflict[] {
  return items
    .filter((item) => item.parent === 'liman4-photos' && item.deleted === undefined)
    .slice(0, 3)
    .map((item, index) => ({
      id: `conflict-${item.id}`,
      name: item.name,
      folder: folderName,
      keepBothName: freeName(
        item.name,
        items.map((each) => each.name),
      ),
      existing: {
        ...(item.size === undefined ? {} : { size: item.size }),
        ...(item.sizeUnit === undefined ? {} : { sizeUnit: item.sizeUnit }),
        ...(item.modified === undefined ? {} : { modified: item.modified }),
        ...(item.owner === undefined ? {} : { owner: item.owner }),
      },
      incoming: {
        size: '3.9',
        sizeUnit: 'MB',
        modified: `2026-10-14T09:3${String(index)}:00+02:00`,
      },
    }))
}

/** One drive's screen: a folder, a place or search results, with every dialog of the view. */
export function DriveScreen({
  phone,
  config,
  start,
}: {
  phone: boolean
  config: DriveConfig
  start: DriveStart
}) {
  const navigate = useContext(Navigate)
  const { format, messages } = useLiro()
  const [items, setItems] = useExampleState<DriveItem[]>(config.stateKey, config.initial)
  const [selection, setSelection] = useState<string[]>(start.checked ?? [])
  const [view, setView] = useState<'list' | 'grid'>(start.view ?? 'list')
  const [search, setSearch] = useState(start.search ?? '')
  const [scope, setScope] = useState<'folder' | 'everywhere'>(
    start.search === undefined ? 'folder' : 'everywhere',
  )
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [sort, setSort] = useState<DataTableSort>({ column: 'name', direction: 'asc' })
  const [details, setDetails] = useState<string | null>(start.details ?? null)
  const [preview, setPreview] = useState<string | null>(start.preview ?? null)
  const [uploads, setUploads] = useState<Attachment[]>(
    start.uploading === true ? SAMPLE_UPLOADS : [],
  )
  const folderName = (id: string | null) =>
    id === null ? config.label : (items.find((item) => item.id === id)?.name ?? config.label)
  const [conflicts, setConflicts] = useState<NameConflict[]>(() =>
    start.ask === 'conflict' ? sampleConflicts(items, folderName(start.folder)) : [],
  )
  const [conflictTotal, setConflictTotal] = useState(conflicts.length)
  const pending = useRef(new Map<string, UploadedFile>())
  const [moving, setMoving] = useState<{ ids: string[]; copy: boolean } | null>(
    start.ask === 'move' && start.askFor !== undefined
      ? { ids: [start.askFor], copy: false }
      : null,
  )
  const [sharing, setSharing] = useState<string | null>(
    start.ask === 'share' ? (start.askFor ?? start.folder) : null,
  )
  const [naming, setNaming] = useState<{ id: string | null } | null>(null)
  const [deleting, setDeleting] = useState<string[] | null>(null)
  const [emptying, setEmptying] = useState(start.ask === 'empty')
  const timers = useRef<number[]>([])
  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach((timer) => {
        window.clearTimeout(timer)
      })
    }
  }, [])
  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms))
  }

  const folder = start.place === undefined ? start.folder : null
  const place = start.place ?? null
  const rules = config.rules(folder, items)
  const live = items.filter((item) => item.deleted === undefined)
  const roots = config.roots
  const within = (item: DriveItem) => {
    if (roots === undefined) return true
    return pathOf(items, item.id).some((each) => roots.includes(each.id))
  }

  /** What the list shows for an item: its folder's count, its place in results. */
  const decorate = (item: DriveItem, withLocation: boolean): DriveItem => {
    const count =
      item.kind === 'folder' ? live.filter((each) => each.parent === item.id).length : undefined
    const location = withLocation
      ? pathOf(items, item.parent)
          .map((each) => each.name)
          .join(' / ') || config.label
      : undefined
    return {
      ...item,
      ...(count === undefined ? {} : { itemCount: count }),
      ...(location === undefined ? {} : { location }),
    }
  }

  // ── What the folder or place holds (the application searches, filters and sorts) ──
  const searching = search.trim() !== ''
  let shown: DriveItem[]
  if (place === 'trash') shown = items.filter((item) => item.deleted !== undefined && within(item))
  else if (place === 'recent')
    shown = live.filter(
      (item) => item.kind === 'file' && within(item) && (item.modified ?? '') >= '2026-10-12',
    )
  else if (place === 'favourites')
    shown = live.filter((item) => item.favourite === true && within(item))
  else if (place === 'shared')
    shown = live.filter((item) => item.shared === true && item.owner !== config.me && within(item))
  else if (searching && scope === 'everywhere') shown = live.filter(within)
  else
    shown = live.filter((item) =>
      folder === null && roots !== undefined ? roots.includes(item.id) : item.parent === folder,
    )
  if (searching) shown = shown.filter((item) => fold(item.name).includes(fold(search.trim())))
  const types = filters.type
  if (Array.isArray(types) && types.length > 0) {
    shown = shown.filter((item) => types.includes(typeGroup(item)))
  }
  const direction = sort?.direction === 'desc' ? -1 : 1
  shown = [...shown].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
    if (sort?.column === 'modified')
      return direction * (a.modified ?? '').localeCompare(b.modified ?? '')
    if (sort?.column === 'size') return direction * (bytes(a) - bytes(b))
    return direction * a.name.localeCompare(b.name, 'sr-Latn')
  })
  const withLocation = place !== null || (searching && scope === 'everywhere')
  const entries =
    rules.noAccess === undefined ? shown.map((item) => decorate(item, withLocation)) : []

  // ── Places, path, title ──
  const places: FilePlace[] | undefined =
    config.placeRoute === undefined
      ? undefined
      : [
          { key: 'recent', label: 'Recent', icon: Clock },
          {
            key: 'favourites',
            label: 'Favourites',
            icon: Star,
            count: live.filter((item) => item.favourite === true && within(item)).length,
          },
          { key: 'shared', label: 'Shared with me', icon: Users },
          {
            key: 'trash',
            label: 'Trash',
            icon: Trash2,
            count: items.filter((item) => item.deleted !== undefined && within(item)).length,
          },
        ]
  const placeLabel = places?.find((each) => each.key === place)?.label
  const path: Crumb[] =
    place !== null
      ? []
      : [
          { label: config.label, href: `#${config.route(null)}` },
          ...pathOf(items, folder)
            .filter((item) => roots === undefined || within(item))
            .map((item) => ({ label: item.name, href: `#${config.route(item.id)}` })),
        ]
  const title =
    placeLabel ?? (searching && scope === 'everywhere' ? 'Search results' : folderName(folder))

  // ── Actions ──
  const byId = (id: string) => items.find((item) => item.id === id)
  const update = (id: string, patch: (item: DriveItem) => DriveItem) => {
    setItems((list) => list.map((item) => (item.id === id ? patch(item) : item)))
  }
  const open = (entry: FileEntry) => {
    if (place === 'trash') return
    if (entry.kind === 'folder') navigate(config.route(entry.id))
    else setPreview(entry.id)
  }
  const download = (names: string[]) => {
    notice.info(
      names.length === 1
        ? `Downloading ${names[0] ?? ''}.`
        : `Preparing a ZIP of ${format.number(String(names.length))} items.`,
    )
  }
  const toTrash = (ids: string[]) => {
    setItems((list) =>
      list.map((item) => (ids.includes(item.id) ? { ...item, deleted: config.now } : item)),
    )
    setSelection([])
    notice.success(
      ids.length === 1
        ? `${byId(ids[0] ?? '')?.name ?? ''} moved to Trash.`
        : `${format.number(String(ids.length))} items moved to Trash.`,
    )
  }
  const move = (ids: string[], target: string, copy: boolean) => {
    const targetRules = config.rules(target, items)
    if (targetRules.noAccess !== undefined || targetRules.uploadUnavailable !== undefined) {
      notice.error(targetRules.noAccess ?? targetRules.uploadUnavailable ?? '')
      return
    }
    if (copy) {
      setItems((list) => [
        ...list,
        ...list
          .filter((item) => ids.includes(item.id))
          .map((item) => ({ ...item, id: `${item.id}-copy-${target}`, parent: target })),
      ])
    } else {
      setItems((list) =>
        list.map((item) => (ids.includes(item.id) ? { ...item, parent: target } : item)),
      )
    }
    setSelection([])
    const what =
      ids.length === 1
        ? (byId(ids[0] ?? '')?.name ?? '')
        : `${format.number(String(ids.length))} items`
    notice.success(`${copy ? 'Copied' : 'Moved'} ${what} to ${folderName(target)}.`)
  }

  const menu = (entry: FileEntry): MenuEntry[] => {
    if (place === 'trash') {
      return [
        {
          label: 'Restore',
          icon: RotateCcw,
          onSelect: () => {
            update(entry.id, restored)
            notice.success(
              `${entry.name} restored to ${folderName(byId(entry.id)?.parent ?? null)}.`,
            )
          },
        },
        { type: 'separator' },
        {
          label: 'Delete for good…',
          icon: Trash2,
          destructive: true,
          onSelect: () => {
            setDeleting([entry.id])
          },
        },
      ]
    }
    if (rules.readOnly === true) {
      return entry.kind === 'folder'
        ? [
            {
              label: 'Open',
              icon: FolderOpen,
              onSelect: () => {
                open(entry)
              },
            },
          ]
        : [
            {
              label: 'Preview',
              icon: Eye,
              onSelect: () => {
                setPreview(entry.id)
              },
            },
            {
              label: 'Download',
              icon: Download,
              onSelect: () => {
                download([entry.name])
              },
            },
            {
              label: 'Details',
              icon: Info,
              onSelect: () => {
                setDetails(entry.id)
              },
            },
          ]
    }
    const item = byId(entry.id)
    const mySignature = item?.signers?.some(
      (signer) => signer.current === true && signer.state === 'waiting',
    )
    return [
      ...(entry.kind === 'folder'
        ? [
            {
              label: 'Open',
              icon: FolderOpen,
              onSelect: () => {
                open(entry)
              },
            },
          ]
        : [
            {
              label: 'Preview',
              icon: Eye,
              onSelect: () => {
                setPreview(entry.id)
              },
            },
            {
              label: 'Download',
              icon: Download,
              onSelect: () => {
                download([entry.name])
              },
            },
          ]),
      ...(mySignature === true
        ? [
            {
              label: 'Sign…',
              icon: Signature,
              onSelect: () => {
                setDetails(entry.id)
              },
            },
          ]
        : []),
      {
        label: 'Rename…',
        icon: Pencil,
        onSelect: () => {
          setNaming({ id: entry.id })
        },
      },
      {
        label: 'Move to…',
        icon: FolderInput,
        onSelect: () => {
          setMoving({ ids: [entry.id], copy: false })
        },
      },
      ...(entry.kind === 'file'
        ? [
            {
              label: 'Copy to…',
              icon: Copy,
              onSelect: () => {
                setMoving({ ids: [entry.id], copy: true })
              },
            },
          ]
        : []),
      {
        label: 'Share…',
        icon: Share2,
        onSelect: () => {
          setSharing(entry.id)
        },
      },
      {
        label: 'Details',
        icon: Info,
        onSelect: () => {
          setDetails(entry.id)
        },
      },
      { type: 'separator' },
      {
        label: 'Move to Trash',
        icon: Trash2,
        destructive: true,
        onSelect: () => {
          toTrash([entry.id])
        },
      },
    ]
  }

  const bulk =
    place === 'trash'
      ? [
          {
            key: 'restore',
            family: 'neutral' as const,
            icon: RotateCcw,
            label: 'Restore',
            onClick: () => {
              setItems((list) =>
                list.map((item) => (selection.includes(item.id) ? restored(item) : item)),
              )
              setSelection([])
            },
          },
        ]
      : [
          {
            key: 'download',
            intent: 'download' as const,
            label: 'Download as ZIP',
            onClick: () => {
              download(selection.map((id) => byId(id)?.name ?? id))
            },
          },
          ...(rules.readOnly === true
            ? []
            : [
                {
                  key: 'move',
                  family: 'neutral' as const,
                  icon: FolderInput,
                  label: 'Move to…',
                  onClick: () => {
                    setMoving({ ids: selection, copy: false })
                  },
                },
                {
                  key: 'trash',
                  family: 'destructive' as const,
                  icon: Trash2,
                  label: 'Move to Trash',
                  onClick: () => {
                    toTrash(selection)
                  },
                },
              ]),
        ]

  // ── Upload ──
  const finishUpload = (id: string, upload: UploadedFile, target: string | null, name: string) => {
    const quarantined = upload.file.name.toLowerCase().endsWith('.exe')
    setUploads((list) =>
      list.map((each) => (each.id === id ? { ...each, state: 'scanning', progress: 100 } : each)),
    )
    later(500, () => {
      setUploads((list) =>
        list.map((each) =>
          each.id === id ? { ...each, state: quarantined ? 'quarantined' : 'available' } : each,
        ),
      )
      if (quarantined) return
      // A file inside a chosen folder lands in that folder (made when missing).
      const parts = upload.path.split('/').slice(0, -1)
      setItems((list) => {
        let next = [...list]
        let parent = target
        for (const part of parts) {
          const found = next.find(
            (item) =>
              item.kind === 'folder' &&
              item.parent === parent &&
              item.name === part &&
              item.deleted === undefined,
          )
          if (found !== undefined) {
            parent = found.id
            continue
          }
          const created: DriveItem = {
            id: `folder-${id}-${part}`,
            name: part,
            kind: 'folder',
            parent,
            owner: config.me,
            modified: config.now,
          }
          next = [...next, created]
          parent = created.id
        }
        const replaced = next.find(
          (item) => item.parent === parent && item.name === name && item.deleted === undefined,
        )
        const file: DriveItem = {
          id: replaced?.id ?? `file-${id}`,
          name,
          kind: 'file',
          parent,
          owner: config.me,
          modified: config.now,
          ...sizeOf(upload.file),
          typeLabel: upload.file.type === '' ? 'File' : upload.file.type,
          preview: previewKind(name),
          // The application's picture of a photo: the file itself, in this browser.
          ...(upload.file.type.startsWith('image/')
            ? { thumbnail: URL.createObjectURL(upload.file) }
            : {}),
        }
        return replaced === undefined
          ? [...next, file]
          : next.map((item) => (item.id === replaced.id ? { ...item, ...file } : item))
      })
    })
  }
  const startUpload = (upload: UploadedFile, name: string) => {
    const id = `${String(Date.now())}-${upload.path}`
    setUploads((list) => [
      ...list,
      {
        id,
        name,
        sizeText: sizeText(format, messages, sizeOf(upload.file)) ?? '',
        state: 'uploading',
        progress: 0,
      },
    ])
    later(400, () => {
      finishUpload(id, upload, folder, name)
    })
  }
  const onUpload = (files: UploadedFile[]) => {
    const names = live.filter((item) => item.parent === folder).map((item) => item.name)
    const waiting: NameConflict[] = []
    for (const upload of files) {
      const top = !upload.path.includes('/')
      const existing = live.find((item) => item.parent === folder && item.name === upload.file.name)
      if (top && existing !== undefined) {
        const id = `conflict-${upload.file.name}-${String(Date.now())}`
        pending.current.set(id, upload)
        waiting.push({
          id,
          name: upload.file.name,
          folder: folderName(folder),
          keepBothName: freeName(upload.file.name, names),
          existing: {
            ...(existing.size === undefined ? {} : { size: existing.size }),
            ...(existing.sizeUnit === undefined ? {} : { sizeUnit: existing.sizeUnit }),
            ...(existing.modified === undefined ? {} : { modified: existing.modified }),
            ...(existing.owner === undefined ? {} : { owner: existing.owner }),
          },
          incoming: { ...sizeOf(upload.file), modified: config.now },
          ...(existing.badges?.some((badge) => badge.label === 'Signed') === true
            ? {
                replaceUnavailable:
                  'Signed documents cannot be replaced; upload it as a new version.',
              }
            : {}),
        })
      } else {
        startUpload(upload, upload.file.name)
      }
    }
    if (waiting.length > 0) {
      setConflicts((list) => [...list, ...waiting])
      setConflictTotal((total) =>
        conflicts.length === 0 ? waiting.length : total + waiting.length,
      )
    }
  }
  const resolve = (answers: ConflictResolution[]) => {
    for (const answer of answers) {
      const conflict = conflicts.find((each) => each.id === answer.id)
      const upload = pending.current.get(answer.id)
      if (conflict !== undefined && upload !== undefined && answer.choice !== 'skip') {
        startUpload(upload, answer.choice === 'keepBoth' ? conflict.keepBothName : conflict.name)
      }
      pending.current.delete(answer.id)
    }
    setConflicts((list) => list.filter((each) => !answers.some((answer) => answer.id === each.id)))
  }

  // ── Details ──
  const detailItem = details === null ? undefined : byId(details)
  const detailsPanel =
    detailItem === undefined ? undefined : (
      <FileDetails
        entry={decorate(detailItem, true)}
        {...(detailItem.created === undefined ? {} : { created: detailItem.created })}
        {...(detailItem.retention === undefined ? {} : { retention: detailItem.retention })}
        {...(detailItem.tags === undefined ? {} : { tags: detailItem.tags })}
        defaultOpen={['details', 'links', 'signing', 'versions']}
        actions={
          <>
            {detailItem.kind === 'file' && (
              <Button
                intent="download"
                label="Download"
                onClick={() => {
                  download([detailItem.name])
                }}
              />
            )}
            <Button
              family="neutral"
              icon={Share2}
              label="Share…"
              onClick={() => {
                setSharing(detailItem.id)
              }}
            />
          </>
        }
        {...(detailItem.signers === undefined
          ? {}
          : {
              signing: (
                <SignerList
                  signers={detailItem.signers}
                  declineSubject={detailItem.name}
                  onSign={(signer) => {
                    update(detailItem.id, (item) => {
                      const signers = (item.signers ?? []).map((each) =>
                        each.id === signer.id
                          ? { ...each, state: 'signed' as const, at: config.now }
                          : each,
                      )
                      const done = signers.every((each) => each.state === 'signed')
                      return {
                        ...item,
                        signers,
                        badges: [
                          done
                            ? { label: 'Signed', tone: 'success' as const }
                            : { label: 'Awaiting signatures', tone: 'warning' as const },
                        ],
                      }
                    })
                    notice.success(`Signed through Liro Bridge: ${detailItem.name}.`)
                  }}
                  onDecline={() => {
                    notice.info(
                      `${detailItem.name} goes back to ${detailItem.owner ?? 'its owner'}.`,
                    )
                  }}
                />
              ),
            })}
        {...(detailItem.kind === 'file'
          ? {
              versions: (
                <VersionList
                  versions={
                    detailItem.versions ?? [
                      {
                        id: 'only',
                        label: 'Version 1',
                        at: detailItem.modified ?? config.now,
                        by: detailItem.owner ?? config.me,
                        ...(detailItem.size === undefined ? {} : { size: detailItem.size }),
                        ...(detailItem.sizeUnit === undefined
                          ? {}
                          : { sizeUnit: detailItem.sizeUnit }),
                        current: true,
                      },
                    ]
                  }
                  onDownload={(version) => {
                    download([`${detailItem.name} (${version.label})`])
                  }}
                  onRestore={(version) => {
                    update(detailItem.id, (item) => ({
                      ...item,
                      versions: (item.versions ?? []).map((each) => ({
                        ...each,
                        current: each.id === version.id,
                      })),
                    }))
                    notice.success(`${version.label} is the current version.`)
                  }}
                  {...(detailItem.badges?.some((badge) => badge.label === 'Signed') === true
                    ? {
                        restoreUnavailable: 'A signed document keeps its versions as they are.',
                        uploadUnavailable: 'A signed document cannot get a new version.',
                      }
                    : {})}
                  onUpload={(file) => {
                    update(detailItem.id, (item) => {
                      const list = item.versions ?? []
                      const label = `Version ${String(list.length + 1)}`
                      return {
                        ...item,
                        modified: config.now,
                        versions: [
                          {
                            id: label,
                            label,
                            at: config.now,
                            by: config.me,
                            ...sizeOf(file),
                            current: true,
                          },
                          ...list.map((each) => ({ ...each, current: false })),
                        ],
                      }
                    })
                    notice.success(`New version of ${detailItem.name} uploaded.`)
                  }}
                />
              ),
              ...(detailItem.versions === undefined
                ? {}
                : { versionCount: detailItem.versions.length }),
            }
          : {})}
        sharing={
          <div className="flex flex-col items-start gap-2">
            <p className="bidi-content m-0 text-sm text-secondary">
              {(detailItem.access ?? []).length === 0
                ? `Only the office and ${detailItem.owner ?? config.me}.`
                : (detailItem.access ?? []).map((each) => each.name).join(', ')}
            </p>
            <Button
              family="neutral"
              icon={Share2}
              label="Share…"
              onClick={() => {
                setSharing(detailItem.id)
              }}
            />
          </div>
        }
        {...(detailItem.activity === undefined ? {} : { activity: detailItem.activity })}
        {...(phone
          ? {}
          : {
              onClose: () => {
                setDetails(null)
              },
            })}
      />
    )

  // ── Preview ──
  const previewItem = preview === null ? undefined : byId(preview)
  const files = entries.filter((entry) => entry.kind === 'file')
  const previewIndex =
    previewItem === undefined ? -1 : files.findIndex((each) => each.id === previewItem.id)
  const previous = files[previewIndex - 1]
  const next = files[previewIndex + 1]

  // ── Trash's own column ──
  const deletedColumn: DataTableColumn<FileEntry> = {
    id: 'deleted',
    header: 'Deleted',
    numeric: true,
    cell: (entry) => {
      const deleted = byId(entry.id)?.deleted
      return deleted === undefined ? null : (
        <span className="bidi-isolate whitespace-nowrap">{momentText(format, deleted)}</span>
      )
    },
  }

  const sharedItem = sharing === null ? undefined : byId(sharing)
  const sharedRules = config.rules(
    sharedItem?.kind === 'folder' ? sharedItem.id : (sharedItem?.parent ?? null),
    items,
  )
  const namedItem = naming?.id === null || naming === null ? undefined : byId(naming.id)
  const movingFolder =
    moving?.ids.length === 1 ? (byId(moving.ids[0] ?? '')?.parent ?? null) : folder

  return (
    <config.Shell phone={phone} crumbs={[]}>
      <Tenant today={config.today}>
        <Frame phone={phone} wide={!phone}>
          <FileBrowser
            layout={phone ? 'phone' : 'desktop'}
            label={title}
            title={title}
            path={path}
            folders={folderTree(items, null, roots)}
            folder={folder}
            onFolderChange={(id) => {
              navigate(config.route(id))
            }}
            {...(places === undefined || config.placeRoute === undefined
              ? {}
              : {
                  places,
                  place,
                  onPlaceChange: (key: string) => {
                    navigate(config.placeRoute?.(key) ?? config.route(null))
                  },
                })}
            {...(config.storage === undefined
              ? {}
              : {
                  storage: (
                    <UsageMeter
                      label="Storage"
                      used={config.storage.used}
                      limit={config.storage.limit}
                      unit={config.storage.unit}
                      note={config.storage.note}
                    />
                  ),
                })}
            entries={entries}
            {...(place === 'trash'
              ? { columns: ['owner', 'size'] as const, extraColumns: [deletedColumn] }
              : {})}
            view={view}
            onViewChange={setView}
            search={search}
            onSearchChange={setSearch}
            searchScope={scope}
            onSearchScopeChange={setScope}
            filters={TYPE_FILTER}
            filterValues={filters}
            onFilterValuesChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            sortColumns={SORT_COLUMNS}
            selection={selection}
            onSelectionChange={setSelection}
            bulkActions={bulk}
            onOpen={open}
            actions={menu}
            {...(place === null
              ? {
                  onMove: (ids: string[], target: string) => {
                    move(ids, target, false)
                  },
                  onUpload,
                  uploadRules: {
                    acceptText: 'Any file',
                    maxSize: 100_000_000,
                    maxSizeText: '100 MB',
                  },
                  onNewFolder: () => {
                    setNaming({ id: null })
                  },
                  ...(rules.uploadUnavailable === undefined
                    ? {}
                    : { uploadUnavailable: rules.uploadUnavailable }),
                  ...(rules.newFolderUnavailable === undefined
                    ? {}
                    : { newFolderUnavailable: rules.newFolderUnavailable }),
                  defaultUploadOpen: start.ask === 'upload',
                }
              : {})}
            {...(place === 'trash'
              ? {
                  notice: 'Items in Trash are deleted for good after 30 days.',
                  toolbarActions: (
                    <Button
                      intent="delete"
                      emphasis="secondary"
                      label="Empty Trash…"
                      onClick={() => {
                        setEmptying(true)
                      }}
                    />
                  ),
                }
              : rules.notice === undefined
                ? {}
                : {
                    notice: rules.notice,
                  })}
            uploads={uploads}
            onClearUploads={() => {
              setUploads([])
            }}
            {...(rules.noAccess === undefined
              ? {}
              : {
                  noAccess: rules.noAccess,
                  noAccessAction: {
                    label: 'Ask for access',
                    onClick: () => {
                      notice.success('Your request was sent to HR.')
                    },
                  },
                })}
            offline={start.offline === true}
            {...(detailsPanel === undefined
              ? {}
              : {
                  details: detailsPanel,
                  detailsOpen: details !== null,
                  onDetailsOpenChange: (openNow: boolean) => {
                    if (!openNow) setDetails(null)
                  },
                  detailsTitle: detailItem?.name ?? 'Details',
                })}
          />
        </Frame>
        {previewItem !== undefined && (
          <FilePreview
            open
            onOpenChange={(openNow) => {
              if (!openNow) setPreview(null)
            }}
            name={previewItem.name}
            description={[
              previewItem.typeLabel,
              sizeText(format, messages, previewItem),
              previewItem.owner,
            ]
              .filter((part) => part !== undefined && part !== null)
              .join(' · ')}
            {...(previewIndex >= 0 ? { index: previewIndex + 1, total: files.length } : {})}
            {...(previous === undefined
              ? {}
              : {
                  onPrevious: () => {
                    setPreview(previous.id)
                  },
                })}
            {...(next === undefined
              ? {}
              : {
                  onNext: () => {
                    setPreview(next.id)
                  },
                })}
            onDownload={() => {
              download([previewItem.name])
            }}
            actions={
              <Button
                family="neutral"
                icon={Info}
                label="Details"
                onClick={() => {
                  setDetails(previewItem.id)
                  setPreview(null)
                }}
              />
            }
            unavailable={previewItem.preview === 'none' || previewItem.preview === undefined}
          >
            {previewItem.preview === 'image' && previewItem.thumbnail !== undefined ? (
              <PageViewer
                label={previewItem.name}
                pages={[
                  { src: previewItem.thumbnail, width: 200, height: 150, alt: previewItem.name },
                ]}
                className="h-full min-h-[24rem]"
              />
            ) : (
              <DocumentFrame
                key={previewItem.id}
                title={previewItem.name}
                srcDoc={documentViewer(previewItem)}
                allowedOrigin="null"
                className="h-full min-h-[24rem]"
              />
            )}
          </FilePreview>
        )}
        <NameConflictDialog
          conflicts={conflicts}
          total={conflictTotal}
          onResolve={resolve}
          onCancel={() => {
            pending.current.clear()
            setConflicts([])
          }}
          {...(start.ask === 'conflict' ? { defaultApplyToAll: false } : {})}
        />
        {moving !== null && (
          <FolderPickerDialog
            open
            onOpenChange={(openNow) => {
              if (!openNow) setMoving(null)
            }}
            title={moving.copy ? 'Copy to' : 'Move to'}
            subject={
              moving.ids.length === 1
                ? (byId(moving.ids[0] ?? '')?.name ?? '')
                : `${format.number(String(moving.ids.length))} items`
            }
            confirmLabel={moving.copy ? 'Copy here' : 'Move here'}
            nodes={folderTree(items, null, roots).map(function lock(node): TreeNode {
              const reason = config.rules(node.id, items)
              return {
                ...node,
                ...(node.children === undefined ? {} : { children: node.children.map(lock) }),
                ...(reason.noAccess !== undefined
                  ? { disabledReason: 'You do not have access to this folder.' }
                  : reason.uploadUnavailable !== undefined
                    ? { disabledReason: reason.uploadUnavailable }
                    : {}),
              }
            })}
            moving={moving.copy ? [] : moving.ids}
            from={moving.copy ? null : movingFolder}
            defaultValue={movingFolder === null ? null : (byId(movingFolder)?.parent ?? null)}
            onConfirm={(target) => {
              move(moving.ids, target, moving.copy)
              setMoving(null)
            }}
          />
        )}
        {sharedItem !== undefined && (
          <ShareDialog
            open
            onOpenChange={(openNow) => {
              if (!openNow) setSharing(null)
            }}
            subject={sharedItem.name}
            levels={config.levels}
            candidates={config.candidates}
            access={
              sharedItem.access ?? [
                {
                  id: 'owner',
                  name: sharedItem.owner ?? config.me,
                  kind: 'person',
                  level: 'edit',
                  owner: true,
                },
              ]
            }
            link={sharedItem.link ?? null}
            {...(sharedRules.linkUnavailable === undefined
              ? {}
              : { linkUnavailable: sharedRules.linkUnavailable })}
            {...(sharedRules.addUnavailable === undefined
              ? {}
              : { addUnavailable: sharedRules.addUnavailable })}
            onAdd={(candidateId, level) => {
              const candidate = config.candidates.find((each) => each.id === candidateId)
              if (candidate === undefined) return
              update(sharedItem.id, (item) => ({
                ...item,
                shared: true,
                access: [
                  ...(item.access ?? [
                    {
                      id: 'owner',
                      name: item.owner ?? config.me,
                      kind: 'person' as const,
                      level: 'edit',
                      owner: true,
                    },
                  ]),
                  {
                    id: candidate.id,
                    name: candidate.label.split(',')[0]?.replace(/ \(.*\)$/, '') ?? candidate.label,
                    kind: candidate.label.includes('portal')
                      ? ('portal' as const)
                      : candidate.label.includes('(role)')
                        ? ('role' as const)
                        : ('person' as const),
                    level,
                  },
                ],
              }))
            }}
            onLevelChange={(accessId, level) => {
              update(sharedItem.id, (item) => ({
                ...item,
                access: (item.access ?? []).map((each) =>
                  each.id === accessId ? { ...each, level } : each,
                ),
              }))
            }}
            onRevoke={(access) => {
              update(sharedItem.id, (item) => ({
                ...item,
                access: (item.access ?? []).filter((each) => each.id !== access.id),
              }))
            }}
            onCreateLink={() => {
              update(sharedItem.id, (item) => ({
                ...item,
                link: {
                  url: `https://files.liro.example.com/s/${item.id}`,
                  expires: '2026-10-31',
                  password: false,
                },
              }))
            }}
            onLinkChange={(change) => {
              update(sharedItem.id, (item) =>
                item.link === undefined || item.link === null
                  ? item
                  : {
                      ...item,
                      link: {
                        ...item.link,
                        ...(change.expires === undefined ? {} : { expires: change.expires }),
                        ...(change.password === undefined
                          ? {}
                          : { password: change.password !== null }),
                      },
                    },
              )
            }}
            onRevokeLink={() => {
              update(sharedItem.id, (item) => ({ ...item, link: null }))
            }}
          />
        )}
        {naming !== null && (
          <FileNameDialog
            open
            onOpenChange={(openNow) => {
              if (!openNow) setNaming(null)
            }}
            title={namedItem === undefined ? 'New folder' : 'Rename'}
            {...(namedItem === undefined
              ? {}
              : { subject: namedItem.name, defaultValue: namedItem.name })}
            confirmLabel={namedItem === undefined ? 'Create' : 'Rename'}
            confirmIcon={namedItem === undefined ? FolderPlus : Pencil}
            onSubmit={(name) => {
              const parent = namedItem?.parent ?? folder
              const taken = live.some(
                (item) => item.parent === parent && item.name === name && item.id !== namedItem?.id,
              )
              if (taken) return 'An item with this name is already in this folder.'
              if (namedItem === undefined) {
                setItems((list) => [
                  ...list,
                  {
                    id: `folder-${name}-${String(list.length)}`,
                    name,
                    kind: 'folder',
                    parent,
                    owner: config.me,
                    modified: config.now,
                  },
                ])
              } else {
                update(namedItem.id, (item) => ({ ...item, name }))
              }
              setNaming(null)
              return undefined
            }}
          />
        )}
        <ConfirmDialog
          open={deleting !== null}
          onOpenChange={(openNow) => {
            if (!openNow) setDeleting(null)
          }}
          intent="delete"
          title="Delete for good"
          subject={deleting === null ? '' : (byId(deleting[0] ?? '')?.name ?? '')}
          message="It cannot be restored afterwards."
          confirmLabel="Delete for good"
          onConfirm={() => {
            const ids = deleting ?? []
            setItems((list) => list.filter((item) => !ids.includes(item.id)))
            setDeleting(null)
          }}
        />
        <IrreversibleConfirmDialog
          open={emptying}
          onOpenChange={setEmptying}
          intent="delete"
          title="Empty Trash?"
          message={`${format.number(String(items.filter((item) => item.deleted !== undefined && within(item)).length))} items are deleted for good. They cannot be restored afterwards.`}
          confirmText="Trash"
          confirmLabel="Empty Trash"
          onConfirm={() => {
            setItems((list) => list.filter((item) => item.deleted === undefined || !within(item)))
            setEmptying(false)
            notice.success('Trash emptied.')
          }}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Tenant>
    </config.Shell>
  )
}

// ── Kvadrat Gradnja d.o.o.'s company documents ────────────────────────────────────────────────

const AH_SHELL: DriveShell = ({ phone, children }) => (
  <Shell phone={phone} crumbs={[{ label: 'Documents', href: `#${AH_ROUTES.root}` }]}>
    {children}
  </Shell>
)

export const AH_CONFIG: DriveConfig = {
  stateKey: 'AH.items',
  initial: () => AH_ITEMS,
  label: 'Company documents',
  route: (id) => (id === null ? AH_ROUTES.root : AH_ROUTES.folder(id)),
  placeRoute: AH_ROUTES.place,
  rules: ahRules,
  me: AH_ME,
  now: AH_NOW,
  today: AH_TODAY,
  storage: AH_STORAGE,
  levels: AH_LEVELS,
  candidates: AH_CANDIDATES,
  Shell: AH_SHELL,
}

/** A start from a route's query: `?view=grid`, `?details=id`, `?ask=move` … */
function startOf(folder: string | null, query: string): DriveStart {
  const params = new URLSearchParams(query)
  const ask = params.get('ask')
  return {
    folder,
    ...(params.get('view') === 'grid' ? { view: 'grid' as const } : {}),
    ...(params.has('checked') ? { checked: ['ah-delivery', 'ah-situation'] } : {}),
    ...(params.get('details') === null ? {} : { details: params.get('details') ?? '' }),
    ...(params.get('preview') === null ? {} : { preview: params.get('preview') ?? '' }),
    ...(ask === 'upload' || ask === 'conflict' || ask === 'share' || ask === 'empty'
      ? { ask }
      : ask === 'move'
        ? { ask, askFor: 'ah-plan' }
        : {}),
    ...(params.has('uploading') ? { uploading: true } : {}),
    ...(params.get('search') === null ? {} : { search: params.get('search') ?? '' }),
    ...(params.has('offline') ? { offline: true } : {}),
  }
}

const AH_VARIANTS: string[] = [
  AH_ROUTES.photosGrid,
  AH_ROUTES.liman4Checked,
  AH_ROUTES.deliveryNote,
  AH_ROUTES.preview,
  AH_ROUTES.previewDrawing,
  AH_ROUTES.upload,
  AH_ROUTES.uploading,
  AH_ROUTES.conflict,
  AH_ROUTES.move,
  AH_ROUTES.share,
  AH_ROUTES.sign,
  AH_ROUTES.search,
  AH_ROUTES.offline,
]

export const GROUP_AH_ROUTES: ExampleRoute[] = [
  {
    path: AH_ROUTES.root,
    render: (phone) => <DriveScreen phone={phone} config={AH_CONFIG} start={{ folder: null }} />,
  },
  ...AH_ITEMS.filter((item) => item.kind === 'folder').map((item) => ({
    path: AH_ROUTES.folder(item.id),
    render: (phone: boolean) => (
      <DriveScreen phone={phone} config={AH_CONFIG} start={{ folder: item.id }} />
    ),
  })),
  ...(['recent', 'favourites', 'shared', 'trash'] as const).map((key) => ({
    path: AH_ROUTES.place(key),
    render: (phone: boolean) => (
      <DriveScreen phone={phone} config={AH_CONFIG} start={{ folder: null, place: key }} />
    ),
  })),
  {
    path: AH_ROUTES.emptyTrash,
    render: (phone) => (
      <DriveScreen
        phone={phone}
        config={AH_CONFIG}
        start={{ folder: null, place: 'trash', ask: 'empty' }}
      />
    ),
  },
  ...AH_VARIANTS.map((route) => {
    const [path = '', query = ''] = route.split('?')
    const folderId = path.slice(`${AH_ROUTES.root}/`.length)
    return {
      path: route,
      render: (phone: boolean) => (
        <DriveScreen phone={phone} config={AH_CONFIG} start={startOf(folderId, query)} />
      ),
    }
  }),
]

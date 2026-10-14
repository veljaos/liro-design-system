import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FolderInput,
  FolderPlus,
  FolderUp,
  Info,
  LayoutGrid,
  List,
  Lock,
  MoreHorizontal,
  PanelLeft,
  Upload,
  WifiOff,
  X,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { Checkbox } from '../primitives/checkbox'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { UnavailableAction } from '../components/actions'
import { Alert } from '../components/alert'
import { AttachmentList, type Attachment } from '../components/attachment-list'
import { BulkActionBar, type BulkAction } from '../components/bulk-action-bar'
import { Button } from '../components/button'
import { DataTable, type DataTableColumn } from '../components/data-table'
import {
  hasActiveFilters,
  nextSort,
  type DataTableFilters,
  type DataTableSort,
} from '../components/data-table-logic'
import { Dialog, Drawer } from '../components/dialog'
import { DropdownMenu, type MenuEntry } from '../components/dropdown-menu'
import { Tooltip } from '../components/popover'
import { EmptyState, type EmptyAction } from '../components/empty-state'
import { FieldMessage } from '../components/field'
import {
  canDropInto,
  folderPath,
  momentText,
  sizeText,
  uploadCounts,
  withPaths,
  type FileEntry,
  type UploadedFile,
} from '../components/file-browser-logic'
import {
  EntryMarks,
  EntryName,
  EntryState,
  FactsLine,
  FileIcon,
  useEntryFacts,
} from '../components/file-entry-parts'
import { FileDropzone } from '../components/file-dropzone'
import { FileGrid } from '../components/file-grid'
import { checkFiles, type FileRejection } from '../components/file-logic'
import { FilterBar } from '../components/filter-bar'
import type { FilterDefinition, SortColumn } from '../components/filter-logic'
import type { IconComponent } from '../components/intents'
import { Breadcrumbs, type Crumb } from '../components/navigation'
import { findTreeNode, type TreeNode } from '../components/tree-logic'
import { SELECTED_BAR, TreeView } from '../components/tree-view'
import { usePhone } from '../components/use-phone'
import { PageHeader } from './page-header'

/*
 * FileBrowser (BUILD-PLAN P5.43): a company's files and folders — contracts, employee files, a
 * site's documentation, a client's uploads. Design system only: the folders, files, permissions,
 * storage, versions, sharing and signing are the application's, through props; the browser shows
 * them, takes the files the user chooses, and reports every action. It never sorts, filters,
 * searches or adds up sizes (D4): the entries arrive in the order to show.
 * - **Layout (desktop):** the breadcrumbs of the folder's path (links through the provider's
 *   `linkComponent`; every folder has an address, B.8), the location's name as the page's h1 and
 *   the view's buttons; at the start a column (256px, hidden and shown with "Hide folders") with
 *   the quick places (Recent, Favourites, Shared with me, Trash: the application's, a press
 *   reported; the current one neutral, D17) over the folder tree (TreeView, one choice) and the
 *   storage used against the quota (the application's UsageMeter); in the middle one card —
 *   FilterBar (search at the start, "Type" and the application's filters, the actions at the
 *   end: Hide folders, List / Grid, Details, New folder, Upload — the main one last), while
 *   searching "Search in: <folder> / Everywhere", the uploads with their progress (AttachmentList,
 *   P5.5's states, "2 of 5 uploaded"), and the content: the list (DataTable: name with its icon,
 *   marks and location, owner, modified, size, linked to; the application's own columns after
 *   them; sorted by the headers, the application sorts) or the grid (FileGrid, thumbnails); at
 *   the end the details column (320px, FileDetails) while it is open.
 * - **Upload:** "Upload" opens a dialog titled by the action with the folder bold under it (D22):
 *   FileDropzone (the accepted types and size shown before choosing; drop is its shortcut) and
 *   "Choose a folder" (a whole folder, each file with its path, `UploadedFile`). Files dropped
 *   from the computer anywhere on the card upload too (the zone takes the neutral selection
 *   while they are over it; dropped folders are read with their paths); every file is checked
 *   again (`checkFiles`) and the rejected ones are named under the toolbar.
 * - **Moving by drag:** a row or a tile dragged onto a folder (a folder row, a folder tile, a
 *   folder in the tree) is reported with `onMove(ids, folderId)`: the dragged item, or the whole
 *   selection when it is in it. The dragging rule (pointer events, never HTML5 drag and drop; a
 *   mouse after 4px, a touch after a 250ms press): a neutral chip "Moving 3 items" follows the
 *   pointer, the folder under it takes the neutral selection and is announced ("Move into
 *   Contracts"), never a folder inside a moved one or the folder they are in (`canDropInto`);
 *   Escape cancels. The keyboard's and the menu's way is the application's "Move to…" in each
 *   item's menu and on the selection (FolderPickerDialog).
 * - **States:** loading (skeleton rows or tiles), the application's error with "Try again", an
 *   empty folder ("This folder is empty", Upload), nothing found ("No files match", search
 *   everywhere), no access (Lock, "You do not have access to this folder" with the application's
 *   reason and action), offline (a neutral Alert, and Upload and New folder unavailable with
 *   "Not available while offline.").
 * - **Phones** (below 48em, or `layout`): the list only, folders as rows; the path is the way
 *   back ("Back to Contracts") beside the h1; the places a select; each row opens with a press
 *   and has a 44px "Actions: <name>" that opens its actions in a bottom sheet; Upload opens the
 *   dialog as a bottom sheet with "Take a photo" (FileDropzone `camera`) and "Choose files"; the
 *   details in a Drawer.
 */

/** A quick place: Recent, Favourites, Shared with me, Trash (the application's). */
export interface FilePlace {
  key: string
  label: string
  icon?: IconComponent
  /** A count after the name ("3"), from the application. */
  count?: number
}

/** The standard columns of the list, after the name. */
export type FileColumn = 'owner' | 'modified' | 'size' | 'links'

/** What is accepted for upload, as FileDropzone takes it. */
export interface FileUploadRules {
  accept?: readonly string[]
  acceptText?: string
  maxSize?: number
  maxSizeText?: string
}

export interface FileBrowserProps {
  /** Names the view's regions ("Company documents"). */
  label: string
  /** The location's name: the page's h1 (the folder, the place, "Search results"). */
  title: string
  /** A line under the title (the folder's owner, a place's note). */
  subtitle?: ReactNode
  /** The current folder's path from the top (the last is the current one), with addresses. */
  path?: readonly Crumb[]

  /** The folders, from the application (lazy children through `onLoadChildren`). */
  folders?: readonly TreeNode[]
  /** The current folder's id; null in a place or in search results. */
  folder?: string | null
  /** A folder was chosen in the tree. */
  onFolderChange?: (id: string) => void
  /** The folders open in the tree at first. Default: the current folder's ancestors. */
  defaultExpanded?: readonly string[]
  onLoadChildren?: (id: string) => void
  /** The quick places, above the tree. */
  places?: readonly FilePlace[]
  /** The current place's key, or null in a folder. */
  place?: string | null
  onPlaceChange?: (key: string) => void
  /** The storage used against the quota: the application's UsageMeter, under the tree. */
  storage?: ReactNode
  /** The folders' column hidden at first. */
  defaultFoldersHidden?: boolean

  /** The items to show, in order. */
  entries: readonly FileEntry[]
  /** The list's columns after the name. Default all four. */
  columns?: readonly FileColumn[]
  /** The application's own columns, after the standard ones (Trash's "Deleted"). */
  extraColumns?: readonly DataTableColumn<FileEntry>[]
  /** 'list' (default) or 'grid' (controlled). Phones always show the list. */
  view?: 'list' | 'grid'
  defaultView?: 'list' | 'grid'
  onViewChange?: (view: 'list' | 'grid') => void

  /** The search text; with `onSearchChange` the toolbar has its search field. */
  search?: string
  onSearchChange?: (text: string) => void
  /** Where the search looks: the folder or everywhere (shown while there is a search). */
  searchScope?: 'folder' | 'everywhere'
  onSearchScopeChange?: (scope: 'folder' | 'everywhere') => void
  /** The application's filters ("Type"), shown in the toolbar. */
  filters?: readonly FilterDefinition[]
  filterValues?: DataTableFilters
  onFilterValuesChange?: (values: DataTableFilters) => void
  /** How many filters stand in the row on desktop. Default all. */
  inlineFilters?: number
  /** The sort (by the list's headers, the grid's and phone's Sort menus). */
  sort?: DataTableSort
  onSortChange?: (sort: DataTableSort) => void
  /** The sortable columns ('name', 'modified', 'size', 'owner' or the application's own). */
  sortColumns?: readonly SortColumn[]

  /** The checked items; with `onSelectionChange`, items get checkboxes. */
  selection?: readonly string[]
  onSelectionChange?: (ids: string[]) => void
  /** The actions on the checked items (Download, Move to…, Delete), the main one last. */
  bulkActions?: readonly BulkAction[]
  /** A press on an item: open a folder, preview a file. */
  onOpen?: (entry: FileEntry) => void
  /** One item's actions (Preview, Download, Rename, Move to…, Copy to…, Share, Delete). */
  actions?: (entry: FileEntry) => readonly MenuEntry[]
  /** Items dragged onto a folder; without it nothing can be dragged. */
  onMove?: (ids: string[], folderId: string) => void

  /** Files chosen or dropped, each with its path in a chosen folder; without it, no upload. */
  onUpload?: (files: UploadedFile[]) => void
  /** What may be uploaded, shown before choosing and checked again. */
  uploadRules?: FileUploadRules
  /** Upload cannot be used here, and why ("Only HR adds files to employee files."). */
  uploadUnavailable?: string
  /** The upload dialog shown at first. */
  defaultUploadOpen?: boolean
  /** "New folder": the application opens its FileNameDialog. */
  onNewFolder?: () => void
  /** New folder cannot be used here, and why. */
  newFolderUnavailable?: string
  /** Further actions of the application, before New folder (Trash's "Empty Trash"). */
  toolbarActions?: ReactNode
  /** The current uploads, with P5.5's states and progress. */
  uploads?: readonly Attachment[]
  /** Clears the finished uploads from the list. */
  onClearUploads?: () => void
  /** Uploads a failed file again. */
  onRetryUpload?: (file: Attachment) => void
  /** A note above the content, from the application ("Items in Trash are deleted after 30 days."). */
  notice?: ReactNode

  /** The details of the chosen item (FileDetails), at the end, while `detailsOpen`. */
  details?: ReactNode
  detailsOpen?: boolean
  onDetailsOpenChange?: (open: boolean) => void
  /** The details Drawer's title on phones (the item's name). */
  detailsTitle?: string

  /** The folder loads: skeleton rows or tiles. */
  loading?: boolean
  /** The folder could not be loaded: the application's words. */
  error?: ReactNode
  onRetry?: () => void
  /** The user may not open this folder: the application's reason. */
  noAccess?: ReactNode
  /** The way on from no access ("Ask for access"). */
  noAccessAction?: EmptyAction
  /** The connection is lost: the files shown are the last ones loaded. */
  offline?: boolean
  /** Forces the desktop or the phone layout; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

// ── Dragging onto a folder ────────────────────────────────────────────────────────────────────

interface DragState {
  ids: string[]
  x: number
  y: number
  /** The folder under the pointer, when the items may land there. */
  over: { id: string; label: string } | null
}

/** The folder an element stands for: a folder row, a folder tile, a folder in the tree. */
function dropTargetOf(element: Element | null, root: HTMLElement) {
  if (element === null || !root.contains(element)) return null
  const tree = element.closest<HTMLElement>('[data-tree-row]')
  if (tree?.dataset.treeRow !== undefined) {
    return { id: tree.dataset.treeRow, element: tree }
  }
  const holder = element.closest<HTMLElement>('tr, [data-file-tile]')
  const target =
    holder?.matches('[data-file-drop]') === true
      ? holder
      : (holder?.querySelector<HTMLElement>('[data-file-drop]') ?? null)
  const id = target?.dataset.fileDrop
  if (holder === null || id === undefined) return null
  return { id, element: holder }
}

function useFolderDrag(
  root: RefObject<HTMLElement | null>,
  props: FileBrowserProps,
  enabled: boolean,
  announce: (text: string) => void,
) {
  const { messages, format, direction } = useLiro()
  const [drag, setDrag] = useState<DragState | null>(null)
  const latest = useRef({ props, messages, format, enabled, announce })
  useLayoutEffect(() => {
    latest.current = { props, messages, format, enabled, announce }
  })
  useEffect(() => {
    const element = root.current
    if (element === null) return
    const down = (event: PointerEvent) => {
      const { props: current, enabled: on } = latest.current
      if (!on || current.onMove === undefined || event.button !== 0) return
      const target = event.target instanceof Element ? event.target : null
      if (target === null) return
      if (
        target.closest(
          'input, textarea, select, a, [role="checkbox"], [aria-haspopup], [data-slot="tree-chevron"]',
        ) !== null
      ) {
        return
      }
      const holder = target.closest('tr, [data-file-tile]')
      const source =
        holder?.matches('[data-file-drag]') === true
          ? holder
          : (holder?.querySelector('[data-file-drag]') ?? null)
      const id = source instanceof HTMLElement ? source.dataset.fileDrag : undefined
      if (id === undefined) return
      const selection = current.selection ?? []
      const ids = selection.includes(id) ? [...selection] : [id]
      const touch = event.pointerType === 'touch'
      const startX = event.clientX
      const startY = event.clientY
      let active = false
      let marked: HTMLElement | null = null
      let state: DragState | null = null
      const mark = (next: HTMLElement | null) => {
        if (marked === next) return
        marked?.removeAttribute('data-drop-over')
        marked = next
        marked?.setAttribute('data-drop-over', '')
      }
      const activate = () => {
        active = true
        state = { ids, x: startX, y: startY, over: null }
        setDrag(state)
        const { messages: words, format: digits } = latest.current
        latest.current.announce(
          words['files.dragging'](ids.length, digits.number(String(ids.length))),
        )
      }
      const timer = touch ? window.setTimeout(activate, 250) : undefined
      const finish = (commit: boolean) => {
        window.clearTimeout(timer)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', cancel)
        window.removeEventListener('keydown', key, true)
        window.removeEventListener('touchmove', touchMove)
        mark(null)
        if (active) {
          // The click that ends a drag does not open the item under it.
          const swallow = (click: MouseEvent) => {
            click.stopPropagation()
            click.preventDefault()
          }
          window.addEventListener('click', swallow, { capture: true, once: true })
          window.setTimeout(() => {
            window.removeEventListener('click', swallow, { capture: true })
          }, 0)
          const over = state?.over ?? null
          if (commit && over !== null) latest.current.props.onMove?.(ids, over.id)
          else latest.current.announce(latest.current.messages['files.dragCancelled'])
        }
        setDrag(null)
      }
      const move = (event: PointerEvent) => {
        const distance = Math.hypot(event.clientX - startX, event.clientY - startY)
        if (!active) {
          if (touch) {
            if (distance > 8) finish(false)
            return
          }
          if (distance < 4) return
          activate()
        }
        const found = dropTargetOf(document.elementFromPoint(event.clientX, event.clientY), element)
        const { props: now, messages: words } = latest.current
        const allowed =
          found !== null &&
          canDropInto(ids, found.id, folderPath(now.folders ?? [], found.id), now.folder ?? null)
        mark(allowed ? found.element : null)
        const label = allowed
          ? (now.entries.find((entry) => entry.id === found.id)?.name ??
            findTreeNode(now.folders ?? [], found.id)?.label ??
            found.id)
          : ''
        const over = allowed ? { id: found.id, label } : null
        if (over !== null && over.id !== state?.over?.id) {
          latest.current.announce(words['files.dropInto'](over.label))
        }
        state = { ids, x: event.clientX, y: event.clientY, over }
        setDrag(state)
      }
      const up = () => {
        finish(true)
      }
      const cancel = () => {
        finish(false)
      }
      const key = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || !active) return
        event.preventDefault()
        event.stopPropagation()
        finish(false)
      }
      const touchMove = (event: TouchEvent) => {
        if (active) event.preventDefault()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', cancel)
      window.addEventListener('keydown', key, true)
      window.addEventListener('touchmove', touchMove, { passive: false })
    }
    element.addEventListener('pointerdown', down)
    return () => {
      element.removeEventListener('pointerdown', down)
    }
  }, [root])
  // The chip follows the pointer from the inline start of the screen.
  const chipStyle = (state: DragState): CSSProperties => ({
    top: state.y + 12,
    insetInlineStart: direction === 'rtl' ? window.innerWidth - state.x + 12 : state.x + 12,
  })
  return { drag, chipStyle }
}

// ── Dropping files from the computer ──────────────────────────────────────────────────────────

/** The files of a drop, with folders read through (each file with its path in them). */
async function droppedFiles(transfer: DataTransfer): Promise<UploadedFile[]> {
  // The entries must be taken while the drop event runs.
  const entries = Array.from(transfer.items).map((item) =>
    typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null,
  )
  if (entries.every((entry) => entry === null)) return withPaths(Array.from(transfer.files))
  const files: UploadedFile[] = []
  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        ;(entry as FileSystemFileEntry).file(resolve, reject)
      })
      files.push({ file, path: `${prefix}${file.name}` })
      return
    }
    if (!entry.isDirectory) return
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject)
      })
      if (batch.length === 0) break
      for (const child of batch) await walk(child, `${prefix}${entry.name}/`)
    }
  }
  for (const entry of entries) {
    if (entry !== null) await walk(entry, '')
  }
  return files
}

/** Takes dropped files on an element: the neutral selection while they are over it. */
function useFileDrop(
  zone: RefObject<HTMLElement | null>,
  enabled: boolean,
  take: (files: UploadedFile[]) => void,
) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)
  const latest = useRef({ enabled, take })
  useLayoutEffect(() => {
    latest.current = { enabled, take }
  })
  useEffect(() => {
    const element = zone.current
    if (element === null) return
    const carriesFiles = (event: DragEvent) =>
      event.dataTransfer !== null && Array.from(event.dataTransfer.types).includes('Files')
    const enter = (event: DragEvent) => {
      if (!latest.current.enabled || !carriesFiles(event)) return
      event.preventDefault()
      depth.current += 1
      setOver(true)
    }
    const dragOver = (event: DragEvent) => {
      if (!latest.current.enabled || !carriesFiles(event)) return
      event.preventDefault()
      if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'copy'
    }
    const leave = () => {
      depth.current = Math.max(depth.current - 1, 0)
      if (depth.current === 0) setOver(false)
    }
    const drop = (event: DragEvent) => {
      if (!latest.current.enabled || event.dataTransfer === null || !carriesFiles(event)) return
      event.preventDefault()
      depth.current = 0
      setOver(false)
      void droppedFiles(event.dataTransfer).then(latest.current.take)
    }
    element.addEventListener('dragenter', enter)
    element.addEventListener('dragover', dragOver)
    element.addEventListener('dragleave', leave)
    element.addEventListener('drop', drop)
    return () => {
      element.removeEventListener('dragenter', enter)
      element.removeEventListener('dragover', dragOver)
      element.removeEventListener('dragleave', leave)
      element.removeEventListener('drop', drop)
    }
  }, [zone])
  return over
}

// ── Pieces ────────────────────────────────────────────────────────────────────────────────────

/** A 36px icon button that stays pressed (List, Grid, Details): the neutral selection, D17. */
function ToolToggle(props: {
  label: string
  icon: IconComponent
  pressed?: boolean
  expanded?: boolean
  onClick: () => void
}) {
  const Icon = props.icon
  return (
    <Tooltip label={props.label}>
      <button
        type="button"
        aria-label={props.label}
        {...(props.pressed === undefined ? {} : { 'aria-pressed': props.pressed })}
        {...(props.expanded === undefined ? {} : { 'aria-expanded': props.expanded })}
        onClick={props.onClick}
        className={cn(
          BUTTON_RESET,
          'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-solid border-transparent text-secondary hover:bg-surface-hover hover:text-primary',
          'aria-pressed:border-selected aria-pressed:bg-surface-selected aria-pressed:text-primary aria-pressed:hover:bg-surface-selected',
          FOCUS_RING,
        )}
      >
        <Icon aria-hidden="true" className="size-4.5" />
      </button>
    </Tooltip>
  )
}

/** The quick places as a list of buttons, the current one neutral with the selected bar. */
function Places(props: {
  places: readonly FilePlace[]
  current: string | null
  onChange: ((key: string) => void) | undefined
}) {
  const { messages, format } = useLiro()
  return (
    <nav aria-label={messages['files.places']}>
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {props.places.map((place) => {
          const current = place.key === props.current
          const Icon = place.icon
          return (
            <li key={place.key}>
              <button
                type="button"
                aria-current={current ? 'page' : undefined}
                onClick={() => props.onChange?.(place.key)}
                className={cn(
                  BUTTON_RESET,
                  'box-border flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-start text-sm text-primary',
                  current
                    ? cn('bg-surface-selected font-medium', SELECTED_BAR)
                    : 'hover:bg-surface-hover',
                  FOCUS_RING,
                  'focus-visible:-outline-offset-2',
                )}
              >
                {Icon !== undefined && (
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-secondary" />
                )}
                <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{place.label}</span>
                {place.count !== undefined && (
                  <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                    {format.number(String(place.count))}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** One action of the phone's bottom sheet. */
function SheetEntry({ entry, close }: { entry: MenuEntry; close: () => void }) {
  if (entry.type === 'separator') {
    return <li aria-hidden="true" className="my-1 border-0 border-t border-solid border-subtle" />
  }
  if (entry.type === 'label') {
    return (
      <li className={cn('px-2 pt-2 pb-1 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
        {entry.label}
      </li>
    )
  }
  const Icon = entry.icon
  return (
    <li>
      <button
        type="button"
        disabled={entry.disabled}
        onClick={() => {
          close()
          entry.onSelect()
        }}
        className={cn(
          BUTTON_RESET,
          'box-border flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-2 text-start text-md',
          entry.destructive === true ? 'text-status-danger-fg' : 'text-primary',
          'hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-disabled',
          FOCUS_RING,
        )}
      >
        {Icon !== undefined && <Icon aria-hidden="true" className="size-4.5 shrink-0" />}
        <span className={TEXT_DIRECTION}>{entry.label}</span>
      </button>
    </li>
  )
}

/** The phone's list: folders and files as rows, each with its actions in a bottom sheet. */
function PhoneList(props: {
  label: string
  entries: readonly FileEntry[]
  selection: readonly string[]
  onSelectionChange: ((ids: string[]) => void) | undefined
  onOpen: ((entry: FileEntry) => void) | undefined
  actions: ((entry: FileEntry) => readonly MenuEntry[]) | undefined
  loading: boolean
}) {
  const { messages } = useLiro()
  const facts = useEntryFacts()
  const [sheetFor, setSheetFor] = useState<FileEntry | null>(null)
  if (props.loading) {
    return (
      <ul aria-label={props.label} aria-busy="true" className="m-0 flex list-none flex-col p-0">
        {[0, 1, 2, 3].map((index) => (
          <li
            key={index}
            className="flex items-center gap-3 border-0 border-b border-solid border-subtle px-4 py-3"
          >
            <span className="size-5 rounded-sm bg-surface-sunken" />
            <span className="h-4 w-40 rounded-sm bg-surface-sunken" />
          </li>
        ))}
      </ul>
    )
  }
  const sheetEntries = sheetFor === null ? [] : (props.actions?.(sheetFor) ?? [])
  return (
    <>
      <ul
        aria-label={props.label}
        data-slot="file-phone-list"
        className="m-0 flex list-none flex-col p-0"
      >
        {props.entries.map((entry) => {
          const checked = props.selection.includes(entry.id)
          const menu = props.actions?.(entry) ?? []
          return (
            <li
              key={entry.id}
              {...(checked ? { 'data-liro-surface': 'selected' } : {})}
              className={cn(
                'flex min-w-0 items-center gap-1 border-0 border-b border-solid border-subtle ps-2 pe-1 last:border-b-0',
                checked && cn('bg-surface-selected', SELECTED_BAR),
              )}
            >
              {props.onSelectionChange !== undefined && (
                <span className="flex size-11 shrink-0 items-center justify-center">
                  <Checkbox
                    checked={checked}
                    aria-label={messages['files.select'](entry.name)}
                    onCheckedChange={() => {
                      props.onSelectionChange?.(
                        checked
                          ? props.selection.filter((id) => id !== entry.id)
                          : [...props.selection, entry.id],
                      )
                    }}
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => props.onOpen?.(entry)}
                className={cn(
                  BUTTON_RESET,
                  'flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-2 text-start',
                  FOCUS_RING,
                  'focus-visible:-outline-offset-2',
                )}
              >
                <FileIcon entry={entry} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                    <bdi
                      dir="auto"
                      className="min-w-0 text-md font-medium break-words text-primary"
                    >
                      {entry.name}
                    </bdi>
                    <EntryMarks entry={entry} />
                  </span>
                  {entry.location !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {entry.location}
                    </span>
                  )}
                  <FactsLine facts={facts(entry)} />
                  <EntryState entry={entry} />
                </span>
              </button>
              {menu.length > 0 && (
                <ButtonPrimitive
                  family="neutral"
                  emphasis="menu"
                  className="size-11 shrink-0 px-0"
                  aria-label={messages['files.actions'](entry.name)}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setSheetFor(entry)
                  }}
                >
                  <MoreHorizontal aria-hidden="true" className="size-5" />
                </ButtonPrimitive>
              )}
            </li>
          )
        })}
      </ul>
      <Dialog
        open={sheetFor !== null}
        onOpenChange={(open) => {
          if (!open) setSheetFor(null)
        }}
        title={messages['files.actionsTitle']}
        {...(sheetFor === null ? {} : { subject: <bdi dir="auto">{sheetFor.name}</bdi> })}
      >
        <ul className="m-0 flex list-none flex-col p-0">
          {sheetEntries.map((entry, index) => (
            <SheetEntry
              key={index}
              entry={entry}
              close={() => {
                setSheetFor(null)
              }}
            />
          ))}
        </ul>
      </Dialog>
    </>
  )
}

// ── The browser ───────────────────────────────────────────────────────────────────────────────

const ALL_COLUMNS: readonly FileColumn[] = ['owner', 'modified', 'size', 'links']

/** A company's files and folders: tree, path, list or grid, uploads, details. */
export function FileBrowser(props: FileBrowserProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const root = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const rejectionsId = useId()
  const [innerView, setInnerView] = useState(props.defaultView ?? 'list')
  const view = phone ? 'list' : (props.view ?? innerView)
  const [foldersHidden, setFoldersHidden] = useState(props.defaultFoldersHidden ?? false)
  const [uploadOpen, setUploadOpen] = useState(props.defaultUploadOpen ?? false)
  const [rejections, setRejections] = useState<FileRejection[]>([])
  const [announcement, setAnnouncement] = useState('')
  const offline = props.offline === true
  const selection = props.selection ?? []
  const selectable = props.onSelectionChange !== undefined
  const rules = props.uploadRules ?? {}
  const uploadReason = offline ? messages['files.offlineReason'] : props.uploadUnavailable
  const newFolderReason = offline ? messages['files.offlineReason'] : props.newFolderUnavailable
  const canUpload = props.onUpload !== undefined && uploadReason === undefined
  const blocked = props.noAccess !== undefined || props.error !== undefined

  const { drag, chipStyle } = useFolderDrag(
    root,
    props,
    !phone && !offline && !blocked,
    setAnnouncement,
  )

  /** Checks chosen or dropped files again and passes the accepted ones on. */
  const take = (files: UploadedFile[]) => {
    if (files.length === 0) return
    const { accepted, rejected } = checkFiles(
      files.map((each) => each.file),
      {
        ...(rules.accept === undefined ? {} : { accept: rules.accept }),
        ...(rules.maxSize === undefined ? {} : { maxSize: rules.maxSize }),
      },
    )
    setRejections(rejected)
    const kept = files.filter((each) => accepted.includes(each.file))
    if (kept.length > 0) props.onUpload?.(kept)
  }
  const dropping = useFileDrop(card, canUpload && !phone, take)

  // The folder input takes whole folders (a non-standard attribute every browser knows).
  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '')
  })

  const setView = (next: 'list' | 'grid') => {
    setInnerView(next)
    props.onViewChange?.(next)
  }

  const searching = (props.search ?? '').trim() !== ''
  const filtering = searching || hasActiveFilters(props.filterValues ?? {})
  const sortable = (id: string) =>
    props.onSortChange !== undefined &&
    (props.sortColumns === undefined || props.sortColumns.some((column) => column.id === id))

  // ── The list's columns ──
  const shown = props.columns ?? ALL_COLUMNS
  const columns: DataTableColumn<FileEntry>[] = [
    {
      id: 'name',
      header: messages['files.name'],
      minWidth: 260,
      sortable: sortable('name'),
      cell: (entry) => (
        <span
          data-file-drag={entry.id}
          {...(entry.kind === 'folder' ? { 'data-file-drop': entry.id } : {})}
          className="flex min-w-0"
        >
          <EntryName entry={entry} />
        </span>
      ),
    },
    ...(shown.includes('owner')
      ? [
          {
            id: 'owner',
            header: messages['files.owner'],
            minWidth: 140,
            sortable: sortable('owner'),
            cell: (entry: FileEntry) =>
              entry.owner === undefined ? null : (
                <span className={TEXT_DIRECTION}>{entry.owner}</span>
              ),
          },
        ]
      : []),
    ...(shown.includes('modified')
      ? [
          {
            id: 'modified',
            header: messages['files.modified'],
            numeric: true,
            sortable: sortable('modified'),
            cell: (entry: FileEntry) =>
              entry.modified === undefined ? null : (
                <span className="bidi-isolate whitespace-nowrap">
                  {momentText(format, entry.modified)}
                </span>
              ),
          },
        ]
      : []),
    ...(shown.includes('size')
      ? [
          {
            id: 'size',
            header: messages['files.size'],
            align: 'end' as const,
            numeric: true,
            sortable: sortable('size'),
            cell: (entry: FileEntry) => {
              const text =
                entry.kind === 'folder'
                  ? entry.itemCount === undefined
                    ? null
                    : messages['files.items'](
                        entry.itemCount,
                        format.number(String(entry.itemCount)),
                      )
                  : sizeText(format, messages, entry)
              return text === null ? null : (
                <span className="bidi-isolate whitespace-nowrap">{text}</span>
              )
            },
          },
        ]
      : []),
    ...(shown.includes('links')
      ? [
          {
            id: 'links',
            header: messages['files.links'],
            minWidth: 180,
            cell: (entry: FileEntry) =>
              entry.links === undefined || entry.links.length === 0 ? null : (
                <span className="flex flex-col gap-0.5">
                  {entry.links.map((link) => (
                    <Link
                      key={link.key}
                      href={link.href}
                      className={cn(
                        'inline-flex min-h-6 items-center rounded-sm text-link underline visited:text-link hover:text-link',
                        FOCUS_RING,
                        TEXT_DIRECTION,
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </span>
              ),
          },
        ]
      : []),
    ...(props.extraColumns ?? []),
  ]

  // ── The toolbar ──
  const viewButtons = !phone && (
    <div role="group" aria-label={messages['files.view']} className="flex items-center gap-1">
      <ToolToggle
        icon={List}
        label={messages['files.listView']}
        pressed={view === 'list'}
        onClick={() => {
          setView('list')
        }}
      />
      <ToolToggle
        icon={LayoutGrid}
        label={messages['files.gridView']}
        pressed={view === 'grid'}
        onClick={() => {
          setView('grid')
        }}
      />
    </div>
  )
  const sortMenu =
    !phone &&
    view === 'grid' &&
    props.onSortChange !== undefined &&
    props.sortColumns !== undefined ? (
      <DropdownMenu
        align="end"
        entries={props.sortColumns.map((column) => {
          const current = props.sort?.column === column.id ? props.sort.direction : null
          return {
            label: column.label,
            ...(current === null ? {} : { icon: current === 'asc' ? ArrowUp : ArrowDown }),
            onSelect: () => props.onSortChange?.(nextSort(props.sort ?? null, column.id)),
          }
        })}
        trigger={<Button family="neutral" icon={ArrowUpDown} label={messages['files.sort']} />}
      />
    ) : null
  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {!phone && (props.folders !== undefined || props.places !== undefined) && (
        <ToolToggle
          icon={PanelLeft}
          label={foldersHidden ? messages['files.showFolders'] : messages['files.hideFolders']}
          expanded={!foldersHidden}
          onClick={() => {
            setFoldersHidden(!foldersHidden)
          }}
        />
      )}
      {viewButtons}
      {sortMenu}
      {props.details !== undefined && !phone && (
        <ToolToggle
          icon={Info}
          label={messages['files.details']}
          pressed={props.detailsOpen === true}
          onClick={() => props.onDetailsOpenChange?.(props.detailsOpen !== true)}
        />
      )}
      {props.toolbarActions}
      {props.onNewFolder !== undefined &&
        (newFolderReason === undefined ? (
          <Button
            family="neutral"
            icon={FolderPlus}
            label={messages['files.newFolder']}
            onClick={props.onNewFolder}
          />
        ) : (
          <UnavailableAction
            family="neutral"
            icon={FolderPlus}
            label={messages['files.newFolder']}
            reason={newFolderReason}
          />
        ))}
      {props.onUpload !== undefined &&
        (uploadReason === undefined ? (
          <Button
            family="primary"
            icon={Upload}
            emphasis="primary"
            label={messages['files.upload']}
            onClick={() => {
              setUploadOpen(true)
            }}
          />
        ) : (
          <UnavailableAction
            family="primary"
            icon={Upload}
            emphasis="primary"
            label={messages['files.upload']}
            reason={uploadReason}
          />
        ))}
    </div>
  )

  // ── The content ──
  let content: ReactNode
  if (props.noAccess !== undefined) {
    content = (
      <EmptyState
        icon={Lock}
        title={messages['files.noAccess']}
        description={props.noAccess}
        {...(props.noAccessAction === undefined ? {} : { action: props.noAccessAction })}
        className="py-12"
      />
    )
  } else if (props.error !== undefined) {
    content = (
      <EmptyState
        variant="error"
        title={messages['files.loadError']}
        description={props.error}
        {...(props.onRetry === undefined
          ? {}
          : { action: { label: messages['files.retry'], onClick: props.onRetry } })}
        className="py-12"
      />
    )
  } else if (props.entries.length === 0 && props.loading !== true) {
    content = filtering ? (
      <EmptyState
        variant="no-results"
        title={messages['files.noResults']}
        description={messages['files.noResultsDescription']}
        {...(searching &&
        props.searchScope !== 'everywhere' &&
        props.onSearchScopeChange !== undefined
          ? {
              action: {
                label: messages['files.searchEverywhere'],
                onClick: () => props.onSearchScopeChange?.('everywhere'),
              },
            }
          : {})}
        className="py-12"
      />
    ) : (
      <EmptyState
        title={messages['files.empty']}
        description={messages['files.emptyDescription']}
        {...(canUpload
          ? {
              action: {
                label: messages['files.upload'],
                icon: Upload,
                onClick: () => {
                  setUploadOpen(true)
                },
              },
            }
          : {})}
        className="py-12"
      />
    )
  } else if (phone) {
    content = (
      <>
        {selectable && (
          <BulkActionBar
            count={selection.length}
            onClear={() => props.onSelectionChange?.([])}
            actions={props.bulkActions ?? []}
            className="mx-4 my-3"
          />
        )}
        <PhoneList
          label={props.label}
          entries={props.entries}
          selection={selection}
          onSelectionChange={props.onSelectionChange}
          onOpen={props.onOpen}
          actions={props.actions}
          loading={props.loading === true}
        />
      </>
    )
  } else if (view === 'grid') {
    content = (
      <div className="flex flex-col gap-3 p-4 pt-0">
        {selectable && (
          <BulkActionBar
            count={selection.length}
            total={props.entries.length}
            onSelectAll={() => props.onSelectionChange?.(props.entries.map((entry) => entry.id))}
            onClear={() => props.onSelectionChange?.([])}
            actions={props.bulkActions ?? []}
          />
        )}
        <FileGrid
          label={props.label}
          entries={props.entries}
          {...(selectable ? { selection, onSelectionChange: props.onSelectionChange } : {})}
          {...(props.onOpen === undefined ? {} : { onOpen: props.onOpen })}
          {...(props.actions === undefined ? {} : { actions: props.actions })}
          loading={props.loading === true}
        />
      </div>
    )
  } else {
    content = (
      <DataTable
        label={props.label}
        layout="table"
        inCard
        columns={columns}
        rows={props.entries}
        getRowId={(entry) => entry.id}
        getRowLabel={(entry) => entry.name}
        {...(props.sort === undefined ? {} : { sort: props.sort })}
        {...(props.onSortChange === undefined ? {} : { onSortChange: props.onSortChange })}
        {...(props.onOpen === undefined ? {} : { onRowClick: props.onOpen })}
        {...(props.actions === undefined ? {} : { rowActions: props.actions })}
        {...(selectable
          ? {
              selection,
              onSelectionChange: props.onSelectionChange,
              bulkActions: props.bulkActions ?? [],
              count: props.entries.length,
              onSelectAll: () => props.onSelectionChange?.(props.entries.map((entry) => entry.id)),
            }
          : {})}
        loading={props.loading === true}
      />
    )
  }

  // ── Uploads ──
  const uploads = props.uploads ?? []
  const counts = uploadCounts(uploads)
  const uploadsPart = uploads.length > 0 && (
    <section
      aria-label={messages['files.uploads']}
      className="mx-4 mb-3 flex flex-col gap-1 rounded-md border border-solid border-default px-3 pt-2 pb-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className={cn('m-0 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {messages['files.uploadCounts'](
            counts.done,
            format.number(String(counts.done)),
            counts.total,
            format.number(String(counts.total)),
          )}
        </p>
        {props.onClearUploads !== undefined && counts.running === 0 && (
          <Button
            family="neutral"
            icon={X}
            emphasis="menu"
            label={messages['files.clearUploads']}
            onClick={props.onClearUploads}
          />
        )}
      </div>
      <AttachmentList
        label={messages['files.uploads']}
        files={uploads}
        {...(props.onRetryUpload === undefined ? {} : { onRetry: props.onRetryUpload })}
      />
    </section>
  )

  // ── The search's scope ──
  const scope =
    searching && props.onSearchScopeChange !== undefined ? (
      <div
        role="group"
        aria-label={messages['files.searchScope']}
        className="mx-4 mb-3 flex flex-wrap items-center gap-2"
      >
        <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
          {messages['files.searchScope']}
        </span>
        {(
          [
            ['folder', props.title],
            ['everywhere', messages['files.searchEverywhere']],
          ] as const
        ).map(([key, text]) => {
          const pressed = (props.searchScope ?? 'folder') === key
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pressed}
              onClick={() => props.onSearchScopeChange?.(key)}
              className={cn(
                BUTTON_RESET,
                'min-h-7 cursor-pointer rounded-full border border-solid px-3 text-xs text-primary',
                pressed
                  ? 'border-selected bg-surface-selected font-medium'
                  : 'border-default hover:bg-surface-hover',
                FOCUS_RING,
              )}
            >
              <span className={TEXT_DIRECTION}>{text}</span>
            </button>
          )
        })}
      </div>
    ) : null

  // ── The start column ──
  const startColumn = !phone &&
    !foldersHidden &&
    (props.folders !== undefined || props.places !== undefined || props.storage !== undefined) && (
      <aside
        aria-label={messages['files.folders']}
        data-slot="file-browser-folders"
        className="flex w-64 shrink-0 flex-col gap-4"
      >
        {props.places !== undefined && (
          <Places
            places={props.places}
            current={props.place ?? null}
            onChange={props.onPlaceChange}
          />
        )}
        {props.folders !== undefined && (
          <TreeView
            nodes={props.folders}
            label={messages['files.folders']}
            selectionMode="single"
            selected={props.folder === null || props.folder === undefined ? [] : [props.folder]}
            onSelectedChange={(ids) => {
              const id = ids[0]
              if (id !== undefined) props.onFolderChange?.(id)
            }}
            defaultExpanded={
              props.defaultExpanded ??
              (props.folder === null || props.folder === undefined
                ? []
                : folderPath(props.folders, props.folder).slice(0, -1))
            }
            {...(props.onLoadChildren === undefined
              ? {}
              : { onLoadChildren: props.onLoadChildren })}
            className="[&_[data-drop-over]]:bg-surface-selected [&_[data-drop-over]]:shadow-[inset_0_0_0_2px_var(--liro-border-selected)]"
          />
        )}
        {props.storage}
      </aside>
    )

  const path = props.path ?? []
  const parent = path.length >= 2 ? path[path.length - 2] : undefined
  const phonePlaces =
    phone && props.places !== undefined && props.places.length > 0 ? (
      <nav aria-label={messages['files.places']} className="flex flex-wrap gap-2">
        {props.places.map((place) => {
          const current = place.key === props.place
          const Icon = place.icon
          return (
            <button
              key={place.key}
              type="button"
              aria-current={current ? 'page' : undefined}
              onClick={() => props.onPlaceChange?.(place.key)}
              className={cn(
                BUTTON_RESET,
                'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-solid px-3 text-sm text-primary',
                current
                  ? 'border-selected bg-surface-selected font-medium'
                  : 'border-default bg-surface-raised',
                FOCUS_RING,
              )}
            >
              {Icon !== undefined && <Icon aria-hidden="true" className="size-4 text-secondary" />}
              <span className={TEXT_DIRECTION}>{place.label}</span>
            </button>
          )
        })}
      </nav>
    ) : null

  return (
    <div
      ref={root}
      data-slot="file-browser"
      className={cn(
        'flex min-w-0 flex-col gap-4 font-sans',
        drag !== null && 'cursor-grabbing select-none',
        props.className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {!phone && <Breadcrumbs items={path} />}
        <PageHeader
          title={props.title}
          {...(phone && parent?.href !== undefined
            ? {
                back: {
                  href: parent.href,
                  label: typeof parent.label === 'string' ? parent.label : props.label,
                },
              }
            : {})}
          {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
        />
      </div>
      {phonePlaces}
      {offline && (
        <Alert tone="neutral" icon={WifiOff} title={messages['files.offline']}>
          {messages['files.offlineDescription']}
        </Alert>
      )}
      {props.notice}
      <div className="flex min-w-0 items-start gap-6">
        {startColumn}
        <section
          ref={card}
          aria-label={props.label}
          data-slot="file-browser-content"
          data-dropping={dropping || undefined}
          className={cn(
            'relative min-w-0 flex-1 rounded-lg border border-solid bg-surface-raised',
            dropping ? 'border-selected' : 'border-default',
            '[&_[data-drop-over]]:bg-surface-selected [&_[data-drop-over]]:shadow-[inset_0_0_0_2px_var(--liro-border-selected)]',
          )}
        >
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={props.filters ?? []}
            values={props.filterValues ?? {}}
            onValuesChange={(values) => props.onFilterValuesChange?.(values)}
            inline={props.inlineFilters ?? (props.filters ?? []).length}
            {...(props.onSearchChange === undefined
              ? {}
              : { search: props.search ?? '', onSearchChange: props.onSearchChange })}
            {...(props.sort === undefined ? {} : { sort: props.sort })}
            {...(props.sortColumns === undefined ? {} : { sortColumns: props.sortColumns })}
            {...(props.onSortChange === undefined ? {} : { onSortChange: props.onSortChange })}
            actions={toolbar}
          />
          <div
            id={rejectionsId}
            role="alert"
            className="mx-4 mb-3 flex flex-col gap-1 empty:hidden"
          >
            {rejections.map((rejection, index) => (
              <FieldMessage
                key={`${rejection.file.name}-${String(index)}`}
                id={`${rejectionsId}-${String(index)}`}
                tone="error"
              >
                {rejection.reason === 'size'
                  ? messages['file.rejectedSize'](rejection.file.name, rules.maxSizeText ?? '')
                  : messages['file.rejectedType'](rejection.file.name, rules.acceptText ?? '')}
              </FieldMessage>
            ))}
          </div>
          {scope}
          {uploadsPart}
          {content}
          {dropping && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-selected bg-surface-selected"
            >
              <span
                className={cn(
                  'flex items-center gap-2 text-md font-medium text-primary',
                  TEXT_DIRECTION,
                )}
              >
                <Upload aria-hidden="true" className="size-5" />
                {messages['files.dropHere'](props.title)}
              </span>
            </div>
          )}
        </section>
        {!phone && props.detailsOpen === true && props.details !== undefined && (
          <aside
            aria-label={messages['files.details']}
            data-slot="file-browser-details"
            className="w-80 shrink-0"
          >
            {props.details}
          </aside>
        )}
      </div>
      {phone && props.details !== undefined && (
        <Drawer
          side="end"
          open={props.detailsOpen === true}
          onOpenChange={(open) => props.onDetailsOpenChange?.(open)}
          title={props.detailsTitle ?? messages['files.details']}
        >
          {props.details}
        </Drawer>
      )}
      {props.onUpload !== undefined && (
        <Dialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          title={messages['files.uploadTitle']}
          subject={props.title}
        >
          <div className="flex flex-col gap-3">
            <FileDropzone
              label={messages['files.uploadTitle']}
              hideLabel
              layout={phone ? 'phone' : 'desktop'}
              camera
              {...(rules.accept === undefined ? {} : { accept: rules.accept })}
              {...(rules.acceptText === undefined ? {} : { acceptText: rules.acceptText })}
              {...(rules.maxSize === undefined ? {} : { maxSize: rules.maxSize })}
              {...(rules.maxSizeText === undefined ? {} : { maxSizeText: rules.maxSizeText })}
              onFiles={(files) => {
                setUploadOpen(false)
                props.onUpload?.(withPaths(files))
              }}
            />
            {!phone && (
              <div>
                <Button
                  family="neutral"
                  icon={FolderUp}
                  label={messages['files.chooseFolder']}
                  onClick={() => folderInput.current?.click()}
                />
                <input
                  ref={folderInput}
                  type="file"
                  hidden
                  tabIndex={-1}
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    event.target.value = ''
                    setUploadOpen(false)
                    take(withPaths(files))
                  }}
                />
              </div>
            )}
          </div>
        </Dialog>
      )}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {drag !== null && (
        <div
          aria-hidden="true"
          data-slot="file-drag-chip"
          style={chipStyle(drag)}
          className="pointer-events-none fixed z-(--liro-layer-popover) flex items-center gap-2 rounded-md border border-solid border-strong bg-surface-raised px-3 py-2 text-sm font-medium text-primary shadow-lg"
        >
          <FolderInput aria-hidden="true" className="size-4 shrink-0 text-secondary" />
          <span className={TEXT_DIRECTION}>
            {drag.over === null
              ? messages['files.dragging'](drag.ids.length, format.number(String(drag.ids.length)))
              : messages['files.dropInto'](drag.over.label)}
          </span>
        </div>
      )}
    </div>
  )
}

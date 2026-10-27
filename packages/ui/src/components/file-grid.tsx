import { MoreHorizontal } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { Checkbox } from '../primitives/checkbox'
import { BUTTON_RESET, FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { launchpadArrowTarget } from '../templates/launchpad-logic'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { selectRange, toggleSelection, type FileEntry } from './file-browser-logic'
import { EntryMarks, EntryState, FactsLine, FileIcon, useEntryFacts } from './file-entry-parts'
import { Tooltip } from './popover'

/*
 * FileGrid (BUILD-PLAN P5.43): files and folders as tiles with a picture — photos from a site,
 * scans — where seeing the file helps choosing it. The list (DataTable) stays the default view.
 * - A tile: radius lg, border.default on the raised surface, 12px padding; a 4:3 picture (the
 *   application's thumbnail, decorative, or the family's 40px icon on surface.sunken), the name
 *   in two lines at most (medium), the application's marks after it, the facts under it (a
 *   folder's items; a file's size and when it changed, through `format`).
 * - Selection is neutral (D17): a checked tile on surface.selected with a border.selected border;
 *   the checkbox in the tile's top start corner is the pointer's way (blue only when checked, as
 *   every checkbox). The keyboard: the tiles are one tab stop (roving), the arrows move (forward
 *   in the reading direction, mirrored in right-to-left; up and down by the measured columns),
 *   Home / End; Space checks the tile, Shift+arrows extend from the last tile checked, Ctrl/Cmd+A
 *   checks every tile; Enter (or a press) opens it (`onOpen`). Ctrl/Cmd+click checks, Shift+click
 *   checks a range. Tab goes on to the focused tile's menu (`actions`), a 28px "Actions: <name>".
 * - Drag (a files page): each tile carries `data-file-drag`, a folder's `data-file-drop`; the
 *   tiles themselves never start a drag.
 * - `loading`: skeleton tiles.
 */

export interface FileGridProps {
  /** Names the grid for assistive technology ("Liman 4: files"). */
  label: string
  /** The items, in the order to show (the application sorts). */
  entries: readonly FileEntry[]
  /** The checked items' ids; with `onSelectionChange`, tiles get a checkbox. */
  selection?: readonly string[]
  onSelectionChange?: (ids: string[]) => void
  /** A press or Enter on a tile: open a folder, preview a file. */
  onOpen?: (entry: FileEntry) => void
  /** The actions of one item, in its menu. */
  actions?: (entry: FileEntry) => readonly MenuEntry[]
  /** Skeleton tiles while the folder loads. */
  loading?: boolean
  className?: string
}

const GRID = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3 p-0'

/** How many tiles stand in the first row (the grid's columns, as laid out). */
function columnsOf(list: HTMLElement | null): number {
  if (list === null) return 1
  const tiles = Array.from(list.children) as HTMLElement[]
  const top = tiles[0]?.offsetTop
  if (top === undefined) return 1
  return Math.max(tiles.filter((tile) => tile.offsetTop === top).length, 1)
}

/** Files and folders as tiles with pictures; checked neutrally; the keyboard of a grid. */
export function FileGrid(props: FileGridProps) {
  const { messages, direction } = useLiro()
  const facts = useEntryFacts()
  const list = useRef<HTMLUListElement>(null)
  const idBase = useId()
  const [focus, setFocus] = useState(0)
  const [anchor, setAnchor] = useState<string | null>(null)
  const selection = props.selection ?? []
  const selectable = props.onSelectionChange !== undefined
  const order = props.entries.map((entry) => entry.id)
  const current = Math.min(focus, Math.max(props.entries.length - 1, 0))

  if (props.loading === true) {
    return (
      <ul aria-label={props.label} aria-busy="true" className={cn(GRID, props.className)}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <li
            key={index}
            className="flex flex-col gap-2 rounded-lg border border-solid border-default p-3"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    )
  }

  const select = (ids: string[]) => {
    props.onSelectionChange?.(ids)
  }
  const moveFocus = (index: number) => {
    setFocus(index)
    list.current
      ?.querySelectorAll<HTMLElement>('[data-file-tile-main]')
      [index]?.focus({ preventScroll: false })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, entry: FileEntry) => {
    const modifier = event.ctrlKey || event.metaKey
    if (selectable && modifier && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      select([...order])
      return
    }
    if (selectable && event.key === ' ') {
      event.preventDefault()
      select(toggleSelection(selection, entry.id))
      setAnchor(entry.id)
      return
    }
    const target = launchpadArrowTarget(
      event.key,
      index,
      props.entries.length,
      columnsOf(list.current),
      direction,
    )
    if (target === null) return
    event.preventDefault()
    const next = props.entries[target]
    if (next === undefined) return
    if (selectable && event.shiftKey)
      select(selectRange(order, selection, anchor ?? entry.id, next.id))
    moveFocus(target)
  }

  const onClick = (event: MouseEvent<HTMLButtonElement>, entry: FileEntry) => {
    if (selectable && (event.ctrlKey || event.metaKey)) {
      select(toggleSelection(selection, entry.id))
      setAnchor(entry.id)
      return
    }
    if (selectable && event.shiftKey) {
      select(selectRange(order, selection, anchor, entry.id))
      return
    }
    props.onOpen?.(entry)
  }

  return (
    <ul
      ref={list}
      aria-label={props.label}
      data-slot="file-grid"
      className={cn(GRID, 'font-sans', props.className)}
    >
      {props.entries.map((entry, index) => {
        const checked = selection.includes(entry.id)
        const factsId = `${idBase}-${String(index)}`
        const entryFacts = facts(entry)
        const tabbable = index === current
        const menu = props.actions?.(entry) ?? []
        return (
          <li
            key={entry.id}
            data-file-tile={entry.id}
            data-file-drag={entry.id}
            {...(entry.kind === 'folder' ? { 'data-file-drop': entry.id } : {})}
            {...(checked ? { 'data-liro-surface': 'selected' } : {})}
            className={cn(
              'relative flex min-w-0 flex-col rounded-lg border border-solid',
              checked ? 'border-selected bg-surface-selected' : 'border-default bg-surface-raised',
            )}
          >
            <button
              type="button"
              data-file-tile-main=""
              tabIndex={tabbable ? 0 : -1}
              aria-describedby={entryFacts.length > 0 ? factsId : undefined}
              onFocus={() => {
                setFocus(index)
              }}
              onKeyDown={(event) => {
                onKeyDown(event, index, entry)
              }}
              onClick={(event) => {
                onClick(event, entry)
              }}
              className={cn(
                BUTTON_RESET,
                'flex min-w-0 cursor-pointer flex-col gap-2 rounded-lg p-3 pb-0 text-start',
                !checked && 'hover:bg-surface-hover',
                FOCUS_RING,
                'focus-visible:-outline-offset-2',
              )}
            >
              <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md bg-surface-sunken">
                {entry.thumbnail === undefined ? (
                  <FileIcon entry={entry} className="size-10" />
                ) : (
                  <img
                    src={entry.thumbnail}
                    alt=""
                    draggable={false}
                    className="size-full object-cover"
                  />
                )}
              </span>
              <bdi
                dir="auto"
                className="line-clamp-2 min-w-0 text-sm font-medium break-words text-primary"
              >
                {entry.name}
              </bdi>
            </button>
            <div className="flex min-w-0 flex-col gap-1 px-3 pt-1 pb-3">
              <span className="flex min-w-0 flex-wrap items-center gap-1.5 empty:hidden">
                <EntryMarks entry={entry} />
              </span>
              <span id={factsId} className="flex flex-col gap-1">
                <FactsLine facts={entryFacts} />
                <EntryState entry={entry} />
              </span>
            </div>
            {selectable && (
              <span className="absolute start-2 top-2 flex rounded-sm bg-surface-raised">
                <Checkbox
                  tabIndex={-1}
                  checked={checked}
                  aria-label={messages['files.select'](entry.name)}
                  onCheckedChange={() => {
                    select(toggleSelection(selection, entry.id))
                    setAnchor(entry.id)
                  }}
                />
              </span>
            )}
            {menu.length > 0 && (
              <span className="absolute end-2 top-2 flex rounded-md bg-surface-raised">
                <DropdownMenu
                  align="end"
                  entries={menu}
                  trigger={
                    <Tooltip label={messages['files.actions'](entry.name)}>
                      <ButtonPrimitive
                        family="neutral"
                        emphasis="menu"
                        shape="compact"
                        tabIndex={tabbable ? 0 : -1}
                        aria-label={messages['files.actions'](entry.name)}
                      >
                        <MoreHorizontal aria-hidden="true" className="size-4" />
                      </ButtonPrimitive>
                    </Tooltip>
                  }
                />
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

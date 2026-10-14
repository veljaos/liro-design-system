import {
  List,
  Map as MapIcon,
  Maximize,
  Move,
  Plus,
  RotateCw,
  Scaling,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button, IconButton } from './button'
import { Dialog } from './dialog'
import { EmptyState } from './empty-state'
import {
  addedPosition,
  areaLabelPoint,
  areaSwitchKind,
  inArea,
  labelFit,
  labelRoom,
  planFrame,
  switchableAreas,
  dragPosition,
  duplicateDraft,
  footprint,
  isArrowKey,
  isFixture,
  isPolygonArea,
  keepInside,
  levelText,
  levelWidth,
  listGroups,
  MIN_ITEM_SIZE,
  MIN_TARGET,
  minimumPlanWidth,
  nearestItem,
  nudge,
  percentBox,
  percentPoint,
  readingOrder,
  resizeFootprint,
  rotateChange,
  planZoomStep,
  PLAN_ZOOM_STEPS,
  svgPoints,
  type FloorArea,
  type FloorChange,
  type FloorItem,
  type FloorItemKind,
  type FloorListGroup,
} from './floor-plan-logic'
import type { IconComponent } from './intents'
import { NumberField } from './number-field'
import { SelectField } from './select-field'
import { ConflictIcon } from './shift-parts'
import { StatusBadge, type Tone } from './status-badge'
import { usePhone } from './use-phone'

/*
 * FloorPlan (BUILD-PLAN P5.25; docs/decisions.md "Floor plans and seating"): the plan of a place
 * — a restaurant, a café terrace, a hotel floor, a hall — with its areas, tables, rooms, seats and
 * places where the application puts them. It shows what it is given and reports what the user
 * does; it decides nothing and saves nothing.
 *
 * P5.28 (the owner's review, items 23–27): simplicity first.
 * - **No walls, doors or windows** (they confused): areas are plain labelled regions; the bar, a
 *   counter or a stage are labelled furniture; a real building plan is the `background` image.
 * - **A label is never cut:** the name (the number) and the state's icon, then `planDetail` (the
 *   guests) on a second line; what does not fit an item is left out, measured at every width
 *   (`labelFit`), never cut with "…" — the list and the item's name say everything, the time
 *   (`detail`) is in the list and the application's drawer.
 * - **One area at a time:** with two or more areas an area switcher (All + each area: a
 *   segmented control up to four, a select beyond, searched from 11) draws only that area,
 *   cropped and fitted to the width (`area` / `defaultArea` / `onAreaChange`, `areaChoices`).
 * - **Phones** open on the list: a card per item by area (state, `detail`: the guests and the
 *   time, note); the plan, when opened, fits the screen's width without scrolling sideways (the
 *   list is the equivalent control of the small targets, WCAG 2.5.8); there is no edit mode on a
 *   phone: `editing` shows "Edit the plan on a computer or tablet" instead.
 *
 * - **A physical place.** Positions and sizes are the application's plan units; x grows to the
 *   right and y downwards in every writing direction: the plan is not mirrored in a right-to-left
 *   page (the room does not turn round), the page around it is. The canvas is `dir="ltr"` and its
 *   labels take their direction from their own text.
 * - **Drawn as HTML, scaled by CSS.** Every item and area is a box placed in percentages of the
 *   plan, so the plan fits its width with no measuring and stays the same picture at every width;
 *   labels are HTML text (selectable, read in order, checked like any text), not SVG. It never
 *   draws a target under 24px: below that width it scrolls sideways in its own box.
 * - **States are data:** `states` (id, words, tone, icon) — free, occupied, reserved are the
 *   application's. An item shows its state by its tone and its icon, the legend gives the words,
 *   and the item's name says them. Never blue (D17): the tones are status tones without `info`.
 * - **Choosing:** `selectionMode` single (default), multiple or none; `selected` /
 *   `defaultSelected` / `onSelectionChange`. A chosen item has a 2px border.selected frame round
 *   its tone (D17: neutral, never blue) and `aria-pressed`.
 * - **Keyboard:** one item is in the tab order (roving focus). The arrows go to the nearest item
 *   in that direction on the plan (`nearestItem`), Home / End to the first and last; in single
 *   mode the choice follows. Enter or Space activates (`onItemActivate`: open the table); in
 *   multiple mode Space adds or removes the item and Enter activates.
 * - **List:** "Plan / List" switches to the same items grouped by area (state, capacity, detail,
 *   note) — the accessible and the phone alternative; phones open on the list.
 * - **Edit mode** (`editing` with `onChange`): a palette adds items (the application's kinds and
 *   sizes; at the plan's centre); an item is moved by dragging (pointer events; snapped to `grid`),
 *   by the keys (Space picks it up, the arrows move it 1 unit — with Shift 5 —, Space drops,
 *   Escape cancels; every step announced) or by "Move to…" (x and y); resized by its corner
 *   handle or "Size…"; turned 90°, duplicated, removed (also Delete). Every change goes to
 *   `onChange`; overlapping items are allowed and the application's `warnings` flag them.
 * - **Zoom:** in, out and fit (`PLAN_ZOOM_STEPS`, CSS widths, no measuring).
 * - **P5.25a:** `background` draws the building's own plan (an image: a drawing, an SVG, a PDF
 *   page rendered as an image) under the areas and items, placed and scaled in plan units, so it
 *   stays aligned at every zoom; decorative unless it has `alt` (the plan is read through its
 *   items and the list). In the dark theme it is `srcDark`, else the image inverted (a line
 *   drawing then shows light lines). Areas may be polygons (`points`), drawn in an SVG layer whose
 *   viewBox is the plan, their names HTML text at `labelAt` or the centroid. An item's `level`
 *   (a percentage from the application) shows as words in its name and the list, and a bar.
 */

export type {
  FloorArea,
  FloorChange,
  FloorItem,
  FloorItemDraft,
  FloorItemKind,
  FloorLevel,
  FloorPoint,
  FloorPolygonArea,
  FloorRectArea,
} from './floor-plan-logic'

/**
 * An image under the plan's areas and items (P5.25a): the building's own plan — a drawing, an
 * SVG, a PDF page rendered as an image —, placed and scaled in plan units.
 */
export interface FloorBackground {
  src: string
  /**
   * The image for the dark theme. Without it the dark theme shows `src` inverted (`invert`, hues
   * turned back), which suits a line drawing — dark lines on white become light lines on the dark
   * page; a photograph or a coloured plan needs its own dark image.
   */
  srcDark?: string
  /** Its top-left corner on the plan; default 0, 0. */
  x?: number
  y?: number
  /** Its size on the plan; default the plan's own (the image is stretched to it). */
  width?: number
  height?: number
  /** Words for the image; default '' — decorative: the plan is read through its items and list. */
  alt?: string
  /** From 0 to 1, so the items stand out; default 1. */
  opacity?: number
}

/** The tones a state may take: the status tones without info, which is blue (D17). */
export type FloorTone = Exclude<Tone, 'info'>

/** A state of the items (free, occupied, needs cleaning …): the application's map. */
export interface FloorState {
  id: string
  /** The state in words ("Occupied"). */
  label: string
  tone: FloorTone
  /** Drawn in every item of the state, so the state is never told by colour alone. */
  icon: IconComponent
}

/** A kind of item the palette adds, with its size in plan units. */
export interface FloorPaletteEntry {
  id: string
  kind: FloorItemKind
  shape?: 'round' | 'rect'
  /** The button's text and the new item's name ("Round table"). */
  label: string
  width: number
  height: number
  capacity?: number
  icon?: IconComponent
}

/** A warning about an item from the application ("Overlaps Table 6"). */
export interface FloorWarning {
  itemId: string
  text: string
  /** 'danger' for a problem; default 'warning'. */
  tone?: 'warning' | 'danger'
}

/** A group of the list view chosen by the application (SeatingChart groups seats by table). */
export interface FloorListGroupKey {
  id: string
  label: string
}

export interface FloorPlanProps {
  /** Names the plan ("Sala, ground floor"). */
  label: string
  items: readonly FloorItem[]
  /** The plan's size in plan units. */
  width: number
  height: number
  /** Areas: rectangles, or polygons (`points`, P5.25a). */
  areas?: readonly FloorArea[]
  /** The building's own plan under the areas and items (P5.25a). */
  background?: FloorBackground
  states?: readonly FloorState[]
  /** Default 'single'. */
  selectionMode?: 'none' | 'single' | 'multiple'
  selected?: readonly string[]
  defaultSelected?: readonly string[]
  onSelectionChange?: (selected: string[]) => void
  /** Enter, Space or a press on an item (outside edit mode): open it. */
  onItemActivate?: (item: FloorItem) => void
  /** 'plan' or 'list' (controlled). */
  view?: 'plan' | 'list'
  /** Default: 'list' on phones, else 'plan'. */
  defaultView?: 'plan' | 'list'
  onViewChange?: (view: 'plan' | 'list') => void
  /** The one area shown (an id of `areas`), or null for all of them (controlled; P5.28). */
  area?: string | null
  /** The area shown when it appears; default null, all areas. */
  defaultArea?: string | null
  onAreaChange?: (area: string | null) => void
  /**
   * The areas the switcher offers, by id in the application's order; default every area that
   * holds an item. An empty list hides the switcher.
   */
  areaChoices?: readonly string[]
  /**
   * Edit mode: the palette, moving, resizing, turning and removing (with `onChange`). Not on a
   * phone (P5.28 item 27): there the plan shows `messages['floorPlan.editOnLarger']` instead.
   */
  editing?: boolean
  palette?: readonly FloorPaletteEntry[]
  onChange?: (changes: FloorChange[]) => void
  /** Dragging and resizing snap to this many plan units; the grid is drawn in edit mode. Default 10. */
  grid?: number
  /** The application's warnings (overlapping items, a full table). */
  warnings?: readonly FloorWarning[]
  /** The application's buttons at the end of the toolbar ("Merge tables"). */
  toolbar?: ReactNode
  /** The zoom when it appears (a picture); default 1, fitted to the width. */
  defaultZoom?: number
  /** Edit mode: "Move to…" or "Size…" open for the chosen item when it appears (a picture). */
  defaultDialog?: 'move' | 'size'
  /** The legend of the states. Default true. */
  legend?: boolean
  /** An item marked as the place something dragged would land (SeatingChart's seat). */
  dropTargetId?: string
  /** The list view's group of an item; default its area. */
  listGroup?: (item: FloorItem) => FloorListGroupKey | null
  /** Which items the list view shows; default every place (fixtures only in edit mode). */
  listed?: (item: FloorItem) => boolean
  /** The level of the list's group headings. Default 3. */
  headingLevel?: 2 | 3 | 4
  /** Skeleton while the plan loads. */
  loading?: boolean
  /** 'phone' opens on the list; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Every tone's classes, written out. */
const TONE_ITEM: Record<FloorTone, string> = {
  success: 'border-status-success-border bg-status-success-bg text-status-success-fg',
  warning: 'border-status-warning-border bg-status-warning-bg text-status-warning-fg',
  danger: 'border-status-danger-border bg-status-danger-bg text-status-danger-fg',
  neutral: 'border-status-neutral-border bg-status-neutral-bg text-status-neutral-fg',
  premium: 'border-status-premium-border bg-status-premium-bg text-status-premium-fg',
}

/** How an item of each kind is drawn without a state. */
const KIND_LOOK: Record<FloorItemKind, string> = {
  table: 'border border-solid border-strong bg-surface-raised text-primary',
  seat: 'border border-solid border-strong bg-surface-raised text-primary',
  room: 'border border-solid border-strong bg-surface-raised text-primary',
  place: 'border border-solid border-strong bg-surface-raised text-primary',
  bar: 'border border-solid border-strong bg-surface-sunken text-primary',
  counter: 'border border-solid border-strong bg-surface-sunken text-secondary',
  stage: 'border border-solid border-strong bg-surface-sunken text-secondary',
}

/**
 * Writes on every item's label how much of it fits (`labelFit`, P5.28 item 24): measured on the
 * page after each drawing and each change of the plan's width; the CSS leaves out the rest.
 */
function fitLabels(root: HTMLElement | null) {
  if (root === null) return
  const size = (element: HTMLElement | null) =>
    element === null
      ? { width: 0, height: 0 }
      : { width: element.offsetWidth, height: element.offsetHeight }
  for (const label of root.querySelectorAll<HTMLElement>('[data-floor-label]')) {
    const item = label.parentElement
    if (item === null) continue
    label.dataset.fit = 'all'
    const detail = label.querySelector<HTMLElement>('[data-floor-line="detail"]')
    label.dataset.fit = labelFit(
      labelRoom(
        item.clientWidth,
        item.clientHeight,
        label.dataset.round !== undefined,
        label.dataset.bar !== undefined,
      ),
      size(label.querySelector<HTMLElement>('[data-floor-line="name"]')),
      size(label.querySelector<HTMLElement>('[data-floor-number]')),
      detail === null ? null : size(detail),
    )
  }
}

/** The area switcher's value for "All areas" (an area's id is the application's). */
const ALL_AREAS = 'liro:all-areas'

/** A move or resize by the pointer, shown live until it ends. */
interface PointerEdit {
  id: string
  box: { x: number; y: number; width: number; height: number }
}

/** An item picked up with the keyboard: where it was and where it is now. */
interface Lifted {
  id: string
  from: { x: number; y: number }
  x: number
  y: number
}

/** A number typed in a dialog as a whole plan unit, or null. */
function wholeUnits(value: string | null): number | null {
  if (value === null || !/^-?\d+(\.0+)?$/.test(value)) return null
  return Number.parseInt(value, 10)
}

/** The plan of a place: items in areas, their states, choosing, a list, and edit mode. */
export function FloorPlan(props: FloorPlanProps) {
  const { messages, format, colorScheme } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const baseId = useId()
  const instructionsId = `${baseId}-instructions`
  const canvas = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)

  const [innerView, setInnerView] = useState<'plan' | 'list' | undefined>(props.defaultView)
  const view = props.view ?? innerView ?? (phone ? 'list' : 'plan')
  const [innerSelected, setInnerSelected] = useState<readonly string[]>(props.defaultSelected ?? [])
  const selected = props.selected ?? innerSelected
  const [focusId, setFocusId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(props.defaultZoom ?? 1)
  const [lifted, setLifted] = useState<Lifted | null>(null)
  const [pointerEdit, setPointerEdit] = useState<PointerEdit | null>(null)
  const [dialog, setDialog] = useState<'move' | 'size' | null>(props.defaultDialog ?? null)
  const [announcement, setAnnouncement] = useState('')
  const [innerArea, setInnerArea] = useState<string | null>(props.defaultArea ?? null)
  const suppressClick = useRef(false)
  const focusAfter = useRef<string | null>(null)

  const plan = { width: props.width, height: props.height }
  const grid = props.grid ?? 10
  const mode = props.selectionMode ?? 'single'
  // No edit mode on a phone (P5.28 item 27): the plan is changed on a computer or a tablet.
  const editOnLarger = props.editing === true && props.onChange !== undefined && phone
  const editing = props.editing === true && props.onChange !== undefined && !phone
  const interactive = editing || mode !== 'none' || props.onItemActivate !== undefined
  const areas = props.areas ?? []
  // One area at a time (P5.28 item 26): the switcher's areas, the one shown and the part drawn.
  const offered =
    props.areaChoices?.length === 0 ? [] : switchableAreas(areas, props.items, props.areaChoices)
  const areaId = props.area !== undefined ? props.area : innerArea
  const currentArea =
    areaId === null
      ? undefined
      : (offered.find((area) => area.id === areaId) ?? areas.find((area) => area.id === areaId))
  const frame = planFrame(currentArea, plan)
  const inView = (item: FloorItem) => currentArea === undefined || inArea(item, currentArea, areas)
  const states = props.states ?? []
  const warnings = props.warnings ?? []
  const stateOf = (item: FloorItem) => states.find((state) => state.id === item.stateId)
  const areaOf = (item: FloorItem) => areas.find((area) => area.id === item.areaId)
  const warningsOf = (id: string) => warnings.filter((warning) => warning.itemId === id)
  const levelOf = (item: FloorItem) =>
    item.level === undefined
      ? undefined
      : levelText(item.level, (value) => format.percent(value), messages['floorPlan.level'])

  // What is shown: the area's items (or all), one picked up or dragged at its new place.
  const shown = props.items.filter(inView).map((item) => {
    if (lifted?.id === item.id) return { ...item, x: lifted.x, y: lifted.y }
    if (pointerEdit?.id === item.id) return { ...item, ...pointerEdit.box }
    return item
  })
  const targets = shown.filter((item) => editing || !isFixture(item))
  const ordered = readingOrder(targets)
  const chosen = selected.length === 1 ? shown.find((item) => item.id === selected[0]) : undefined
  const tabStop =
    targets.find((item) => item.id === focusId)?.id ??
    ordered.find((item) => selected.includes(item.id))?.id ??
    ordered[0]?.id

  // How much of each label fits, after every drawing and whenever the plan's width changes.
  useLayoutEffect(() => {
    fitLabels(canvas.current)
  })
  useEffect(() => {
    const element = canvas.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      fitLabels(element)
    })
    observer.observe(element)
    // A font that arrives after the first drawing changes every label's size, not the plan's:
    // measure again then, so the fit never depends on how fast the fonts loaded.
    let live = true
    const refit = () => {
      if (live) fitLabels(element)
    }
    const fonts = element.ownerDocument.fonts
    void fonts.ready.then(refit)
    fonts.addEventListener('loadingdone', refit)
    return () => {
      live = false
      observer.disconnect()
      fonts.removeEventListener('loadingdone', refit)
    }
  }, [view, areaId, zoom])

  // The focus follows the keyboard to the item it went to (an item may be drawn anew).
  useEffect(() => {
    const id = focusAfter.current
    if (id === null) return
    focusAfter.current = null
    root.current
      ?.querySelector<HTMLElement>(`[data-floor-focus="${CSS.escape(id)}"]`)
      ?.focus({ preventScroll: false })
  })

  const nameOf = (item: FloorItem): string => {
    const parts: string[] = []
    if (item.detail !== undefined) parts.push(item.detail)
    const state = stateOf(item)
    if (state !== undefined) parts.push(state.label)
    const level = levelOf(item)
    if (level !== undefined) parts.push(level)
    if (item.capacity !== undefined) {
      parts.push(
        messages['floorPlan.capacity'](item.capacity, format.number(String(item.capacity))),
      )
    }
    const area = areaOf(item)
    if (area !== undefined) parts.push(area.label)
    if (item.note !== undefined) parts.push(item.note)
    for (const warning of warningsOf(item.id)) {
      parts.push(
        warning.tone === 'danger'
          ? messages['floorPlan.problem'](warning.text)
          : messages['floorPlan.warning'](warning.text),
      )
    }
    return messages['floorPlan.itemName'](item.label, parts)
  }

  const setSelection = (next: string[]) => {
    setInnerSelected(next)
    props.onSelectionChange?.(next)
  }
  const choose = (id: string, toggle: boolean) => {
    if (mode === 'none') return
    if (mode === 'multiple' && toggle) {
      setSelection(
        selected.includes(id) ? selected.filter((each) => each !== id) : [...selected, id],
      )
      return
    }
    if (selected.length === 1 && selected[0] === id) return
    setSelection([id])
  }
  const activate = (item: FloorItem) => {
    if (!editing) props.onItemActivate?.(item)
  }
  const report = (changes: FloorChange[]) => {
    if (changes.length > 0) props.onChange?.(changes)
  }
  const position = (x: number, y: number) => ({
    x: format.number(String(Math.round(x))),
    y: format.number(String(Math.round(y))),
  })
  const changeView = (next: 'plan' | 'list') => {
    setInnerView(next)
    props.onViewChange?.(next)
  }
  const changeArea = (next: string | null) => {
    setInnerArea(next)
    props.onAreaChange?.(next)
  }
  const goTo = (id: string) => {
    // An item of another area: back to all areas, so it can be reached.
    const item = props.items.find((each) => each.id === id)
    if (item !== undefined && !inView(item)) changeArea(null)
    setFocusId(id)
    focusAfter.current = id
  }

  const onItemKey = (event: KeyboardEvent<HTMLElement>, item: FloorItem) => {
    const original = props.items.find((each) => each.id === item.id) ?? item
    if (lifted?.id === item.id) {
      if (isArrowKey(event.key)) {
        event.preventDefault()
        const next = nudge(
          { ...original, x: lifted.x, y: lifted.y },
          event.key,
          event.shiftKey,
          plan,
        )
        if (next === null) return
        setLifted({ ...lifted, ...next })
        const at = position(next.x, next.y)
        setAnnouncement(messages['floorPlan.moved'](item.label, at.x, at.y))
        return
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setLifted(null)
        const at = position(lifted.x, lifted.y)
        setAnnouncement(messages['floorPlan.dropped'](item.label, at.x, at.y))
        if (lifted.x !== lifted.from.x || lifted.y !== lifted.from.y) {
          report([{ type: 'move', id: item.id, x: lifted.x, y: lifted.y }])
        }
        return
      }
      if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
        }
        setLifted(null)
        setAnnouncement(messages['floorPlan.cancelled'](item.label))
      }
      return
    }
    if (isArrowKey(event.key)) {
      event.preventDefault()
      const next = nearestItem(targets, item.id, event.key)
      if (next === null) return
      goTo(next)
      if (mode === 'single') choose(next, false)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'Home' ? ordered[0] : ordered.at(-1)
      if (next === undefined) return
      goTo(next.id)
      if (mode === 'single') choose(next.id, false)
      return
    }
    if (editing && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault()
      report([{ type: 'remove', id: item.id }])
      return
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (editing) {
        if (mode !== 'none') choose(item.id, false)
        setLifted({ id: item.id, from: { x: item.x, y: item.y }, x: item.x, y: item.y })
        const at = position(item.x, item.y)
        setAnnouncement(messages['floorPlan.picked'](item.label, at.x, at.y))
        return
      }
      if (mode === 'multiple' && event.key === ' ') {
        choose(item.id, true)
        return
      }
      choose(item.id, false)
      activate(item)
    }
  }

  const onItemClick = (event: MouseEvent<HTMLElement>, item: FloorItem) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setFocusId(item.id)
    choose(item.id, mode === 'multiple' || event.ctrlKey || event.metaKey || event.shiftKey)
    activate(item)
  }

  // Live dragging on pointer events (KanbanBoard's rule: a mouse after 4px, a touch after a
  // 250ms press without moving; Escape puts it back). `resize` drags the corner handle.
  const startPointer = (event: PointerEvent<HTMLElement>, item: FloorItem, resize: boolean) => {
    if (!editing || lifted !== null || event.button !== 0) return
    const element = canvas.current
    if (element === null) return
    if (resize) event.stopPropagation()
    const scale = element.getBoundingClientRect().width / frame.width
    if (scale <= 0) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    const box = footprint(item)
    let active = false
    let current: PointerEdit | null = null
    const activate = () => {
      active = true
      if (mode !== 'none') choose(item.id, false)
    }
    const timer = touch ? window.setTimeout(activate, 250) : undefined
    const finish = (commit: boolean) => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('touchmove', onTouchMove)
      if (active) {
        // The click that may follow the release is not a press on the item.
        suppressClick.current = true
        window.setTimeout(() => {
          suppressClick.current = false
        }, 0)
      }
      if (active && commit && current !== null) {
        const next = current.box
        if (resize) {
          if (next.width !== item.width || next.height !== item.height) {
            report([{ type: 'resize', id: item.id, ...next }])
          }
        } else if (next.x !== item.x || next.y !== item.y) {
          report([{ type: 'move', id: item.id, x: next.x, y: next.y }])
        }
      }
      setPointerEdit(null)
    }
    const onMove = (move: globalThis.PointerEvent) => {
      const distance = Math.hypot(move.clientX - startX, move.clientY - startY)
      if (!active) {
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        activate()
      }
      const dx = (move.clientX - startX) / scale
      const dy = (move.clientY - startY) / scale
      if (resize) {
        const width = Math.min(box.width + dx, props.width - box.x)
        const height = Math.min(box.height + dy, props.height - box.y)
        current = { id: item.id, box: resizeFootprint(item, width, height, grid) }
      } else {
        const next = dragPosition(item, dx, dy, grid, plan)
        current = { id: item.id, box: { ...next, width: item.width, height: item.height } }
      }
      setPointerEdit(current)
    }
    const onUp = () => {
      finish(true)
    }
    const onCancel = () => {
      finish(false)
    }
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== 'Escape' || !active) return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }
    const onTouchMove = (touchMove: TouchEvent) => {
      if (active) touchMove.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  if (props.loading === true) {
    return (
      <div
        role="region"
        aria-busy="true"
        aria-label={props.label}
        data-slot="floor-plan"
        className={cn('flex flex-col gap-3 font-sans', props.className)}
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton
          className="w-full rounded-lg"
          style={{ aspectRatio: `${String(props.width)} / ${String(props.height)}` }}
        />
      </div>
    )
  }

  // ── The toolbar: view, zoom, the application's buttons ──
  const viewSwitch = (
    <ToggleGroup
      type="single"
      value={view}
      aria-label={messages['floorPlan.view']}
      onValueChange={(value) => {
        if (value === 'plan' || value === 'list') changeView(value)
      }}
    >
      <ToggleGroupItem value="plan">
        <span className="inline-flex items-center gap-1.5">
          <MapIcon aria-hidden="true" className="size-4" />
          <span className={TEXT_DIRECTION}>{messages['floorPlan.plan']}</span>
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="list">
        <span className="inline-flex items-center gap-1.5">
          <List aria-hidden="true" className="size-4" />
          <span className={TEXT_DIRECTION}>{messages['floorPlan.list']}</span>
        </span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
  const zoomButtons = view === 'plan' && (
    <div role="group" aria-label={messages['floorPlan.zoom']} className="flex items-center gap-1">
      <IconButton
        family="neutral"
        icon={ZoomOut}
        label={messages['floorPlan.zoomOut']}
        disabled={zoom <= (PLAN_ZOOM_STEPS[0] ?? 1)}
        onClick={() => {
          setZoom(planZoomStep(zoom, -1))
        }}
      />
      <IconButton
        family="neutral"
        icon={ZoomIn}
        label={messages['floorPlan.zoomIn']}
        disabled={zoom >= (PLAN_ZOOM_STEPS.at(-1) ?? 1)}
        onClick={() => {
          setZoom(planZoomStep(zoom, 1))
        }}
      />
      <IconButton
        family="neutral"
        icon={Maximize}
        label={messages['floorPlan.zoomFit']}
        disabled={zoom === 1}
        onClick={() => {
          setZoom(1)
          viewport.current?.scrollTo({ left: 0, top: 0 })
        }}
      />
    </div>
  )
  const areaSwitch =
    offered.length < 2 ? null : areaSwitchKind(offered.length, phone) === 'segmented' ? (
      <ToggleGroup
        type="single"
        value={currentArea?.id ?? ALL_AREAS}
        aria-label={messages['floorPlan.area']}
        onValueChange={(value) => {
          if (value !== '') changeArea(value === ALL_AREAS ? null : value)
        }}
      >
        <ToggleGroupItem value={ALL_AREAS}>
          <span className={TEXT_DIRECTION}>{messages['floorPlan.allAreas']}</span>
        </ToggleGroupItem>
        {offered.map((area) => (
          <ToggleGroupItem key={area.id} value={area.id}>
            <span className={TEXT_DIRECTION}>{area.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    ) : (
      <SelectField
        label={messages['floorPlan.area']}
        hideLabel
        value={currentArea?.id ?? ALL_AREAS}
        onChange={(value) => {
          if (value !== '') changeArea(value === ALL_AREAS ? null : value)
        }}
        options={[
          { value: ALL_AREAS, label: messages['floorPlan.allAreas'] },
          ...offered.map((area) => ({ value: area.id, label: area.label })),
        ]}
        className={phone ? 'w-full' : 'w-56'}
      />
    )
  const toolbar = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {viewSwitch}
      {areaSwitch}
      {zoomButtons}
      {props.toolbar !== undefined && (
        <div className="ms-auto flex flex-wrap items-center gap-2">{props.toolbar}</div>
      )}
    </div>
  )

  // ── The legend of the states ──
  const legend = props.legend !== false && states.length > 0 && (
    <ul
      aria-label={messages['floorPlan.legend']}
      className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1.5 p-0"
    >
      {states.map((state) => {
        const Icon = state.icon
        return (
          <li key={state.id} className="flex items-center gap-1.5 text-sm text-primary">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-sm border border-solid',
                TONE_ITEM[state.tone],
              )}
            >
              <Icon className="size-3" />
            </span>
            <span className={TEXT_DIRECTION}>{state.label}</span>
          </li>
        )
      })}
    </ul>
  )

  // ── Edit mode: the palette and the chosen item's actions ──
  const palette = editing && (props.palette ?? []).length > 0 && (
    <div
      role="group"
      aria-labelledby={`${baseId}-palette`}
      className="flex flex-wrap items-center gap-2"
    >
      <span
        id={`${baseId}-palette`}
        className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}
      >
        {messages['floorPlan.add']}
      </span>
      {(props.palette ?? []).map((entry) => (
        <Button
          key={entry.id}
          family="neutral"
          icon={entry.icon ?? Plus}
          label={entry.label}
          onClick={() => {
            // At the centre of what is drawn: the plan, or the area shown (and in it).
            const at = addedPosition(entry, grid, frame)
            report([
              {
                type: 'add',
                item: {
                  kind: entry.kind,
                  label: entry.label,
                  width: entry.width,
                  height: entry.height,
                  x: at.x + frame.x,
                  y: at.y + frame.y,
                  ...(currentArea === undefined ? {} : { areaId: currentArea.id }),
                  ...(entry.shape === undefined ? {} : { shape: entry.shape }),
                  ...(entry.capacity === undefined ? {} : { capacity: entry.capacity }),
                },
              },
            ])
            setAnnouncement(messages['floorPlan.added'](entry.label))
          }}
        />
      ))}
    </div>
  )

  const chosenActions =
    editing && chosen !== undefined ? (
      <div
        role="group"
        aria-label={messages['floorPlan.itemActions'](chosen.label)}
        className="flex flex-wrap items-center gap-2 rounded-md border border-solid border-default bg-surface-sunken p-2"
      >
        <span className={cn('px-1 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {chosen.label}
        </span>
        <EditDialog
          kind="move"
          item={chosen}
          plan={plan}
          open={dialog === 'move'}
          onOpenChange={(open) => {
            setDialog(open ? 'move' : null)
          }}
          onDone={(change) => {
            report([change])
            setDialog(null)
          }}
        />
        <EditDialog
          kind="size"
          item={chosen}
          plan={plan}
          open={dialog === 'size'}
          onOpenChange={(open) => {
            setDialog(open ? 'size' : null)
          }}
          onDone={(change) => {
            report([change])
            setDialog(null)
          }}
        />
        <Button
          family="neutral"
          icon={RotateCw}
          label={messages['floorPlan.rotate']}
          onClick={() => {
            report([{ type: 'rotate', id: chosen.id, ...rotateChange(chosen, plan) }])
          }}
        />
        <Button
          intent="duplicate"
          label={messages['floorPlan.duplicate']}
          onClick={() => {
            report([{ type: 'add', item: duplicateDraft(chosen, grid, plan) }])
          }}
        />
        <Button
          family="destructive"
          icon={Trash2}
          label={messages['floorPlan.remove']}
          onClick={() => {
            report([{ type: 'remove', id: chosen.id }])
            setInnerSelected([])
          }}
        />
      </div>
    ) : editing && selected.length > 1 ? (
      <div
        role="group"
        aria-label={messages['floorPlan.chosen'](
          selected.length,
          format.number(String(selected.length)),
        )}
        className="flex flex-wrap items-center gap-2 rounded-md border border-solid border-default bg-surface-sunken p-2"
      >
        <span className={cn('px-1 text-sm font-semibold text-primary', TEXT_ISOLATE)}>
          {messages['floorPlan.chosen'](selected.length, format.number(String(selected.length)))}
        </span>
        <Button
          family="destructive"
          icon={Trash2}
          label={messages['floorPlan.remove']}
          onClick={() => {
            report(selected.map((id) => ({ type: 'remove', id })))
            setInnerSelected([])
          }}
        />
      </div>
    ) : null

  // ── The application's warnings, each with "Go to" ──
  const warningList = warnings.length > 0 && (
    <section
      aria-labelledby={`${baseId}-warnings`}
      className="flex flex-col gap-2 rounded-md border border-solid border-default bg-surface-raised p-3"
    >
      <h2
        id={`${baseId}-warnings`}
        className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
      >
        {messages['floorPlan.warnings']}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {warnings.map((warning, index) => {
          const item = props.items.find((each) => each.id === warning.itemId)
          if (item === undefined) return null
          const tone = warning.tone ?? 'warning'
          return (
            <li key={index} className="flex items-start gap-2 text-sm text-primary">
              <ConflictIcon tone={tone} className="mt-0.5 size-4" />
              <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>
                <span className="font-semibold">{item.label}</span>
                {': '}
                <span className="sr-only">
                  {tone === 'danger'
                    ? messages['floorPlan.problem']('')
                    : messages['floorPlan.warning']('')}
                </span>
                {warning.text}
              </span>
              <button
                type="button"
                aria-label={messages['floorPlan.goToItem'](item.label)}
                onClick={() => {
                  goTo(item.id)
                }}
                className={cn(
                  BUTTON_RESET,
                  FOCUS_RING,
                  'min-h-6 shrink-0 cursor-pointer rounded-sm px-1 text-sm text-link underline hover:text-link',
                  TEXT_DIRECTION,
                )}
              >
                {messages['floorPlan.goTo']}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )

  const instructions = (
    <p id={instructionsId} className="sr-only">
      {editing ? messages['floorPlan.editInstructions'] : messages['floorPlan.instructions']}
    </p>
  )
  const announcer = (
    <div role="status" data-slot="floor-plan-announcer" className="sr-only">
      {announcement}
    </div>
  )

  // ── The plan ──
  // On a phone the plan fits the screen's width (the list is the equivalent of its small targets,
  // WCAG 2.5.8); elsewhere it scrolls in its own box below the width that keeps them 24px.
  const minWidth = phone
    ? 0
    : minimumPlanWidth(
        targets.filter((item) => !isFixture(item)),
        frame.width,
      )
  const ratio = `${String(frame.width)} / ${String(frame.height)}`
  const canvasStyle: CSSProperties = {
    width: `${String(zoom * 100)}%`,
    minWidth: `${String(minWidth * zoom)}px`,
    aspectRatio: ratio,
    // One area on a wide screen: no taller than the plan's box (a square hall stays in view).
    ...(currentArea !== undefined && !phone && zoom === 1
      ? { maxWidth: `calc(min(70vh, 44rem) * ${ratio})` }
      : {}),
    ...(editing && grid > 0
      ? {
          backgroundImage:
            'radial-gradient(circle, var(--liro-border-default) 1px, transparent 1.5px)',
          backgroundSize: `${String((grid / frame.width) * 100)}% ${String((grid / frame.height) * 100)}%`,
        }
      : {}),
  }

  const drawItem = (item: FloorItem) => {
    const box = percentBox(footprint(item), frame)
    const style: CSSProperties = {
      insetInlineStart: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }
    const state = stateOf(item)
    const StateIcon = state?.icon
    const round = item.kind === 'seat' || item.shape === 'round'
    const isTarget = editing || !isFixture(item)
    const isChosen = selected.includes(item.id)
    const moving = lifted?.id === item.id || pointerEdit?.id === item.id
    const itemWarnings = warningsOf(item.id)
    const barWidth = item.level === undefined ? null : levelWidth(item.level.percent)
    const worst = itemWarnings.some((warning) => warning.tone === 'danger')
      ? 'danger'
      : itemWarnings.length > 0
        ? 'warning'
        : null
    const look = cn(
      'absolute box-border flex flex-col items-center justify-center overflow-visible p-0.5 text-center font-sans leading-tight select-none',
      round ? 'rounded-full' : 'rounded-md',
      state === undefined ? KIND_LOOK[item.kind] : cn('border border-solid', TONE_ITEM[state.tone]),
      barWidth !== null && 'pb-2.5',
      moving && 'z-(--liro-layer-raised) border-strong shadow-lg',
      props.dropTargetId === item.id &&
        'outline-2 outline-offset-2 outline-(--liro-border-strong) [outline-style:dashed]',
    )
    const marks = (
      <>
        {isChosen && (
          <span
            aria-hidden="true"
            data-slot="floor-chosen"
            className="pointer-events-none absolute -inset-[3px] rounded-[inherit] border-2 border-solid border-selected"
          />
        )}
        {editing && item.id === chosen?.id && !moving && (
          <span
            aria-hidden="true"
            data-slot="floor-resize"
            onPointerDown={(event) => {
              startPointer(event, item, true)
            }}
            className="absolute -end-2 -bottom-2 size-4 cursor-se-resize touch-none rounded-sm border-2 border-solid border-selected bg-surface-raised"
          />
        )}
      </>
    )
    // The name and the state's icon, then the short second line; never cut (P5.28 item 24):
    // `fitLabels` writes how much fits ('all', 'name', 'number', 'none') and the rest is left out.
    const label = (
      <>
        <span
          aria-hidden="true"
          data-floor-label=""
          data-fit="all"
          data-round={round ? '' : undefined}
          data-bar={barWidth !== null ? '' : undefined}
          className="group/label flex flex-col items-center data-[fit=none]:invisible"
        >
          <span data-floor-line="name" className="flex items-center gap-0.5 whitespace-nowrap">
            {worst !== null && (
              <ConflictIcon
                tone={worst}
                className="size-3.5 group-data-[fit=number]/label:hidden"
              />
            )}
            {StateIcon !== undefined && item.kind !== 'seat' && (
              <StateIcon className="size-3 shrink-0 group-data-[fit=number]/label:hidden" />
            )}
            <span data-floor-number="" className={cn('text-xs font-semibold', TEXT_ISOLATE)}>
              {item.shortLabel ?? item.label}
            </span>
          </span>
          {item.planDetail !== undefined && item.kind !== 'seat' && (
            <span
              data-floor-line="detail"
              className={cn(
                'text-xs whitespace-nowrap group-data-[fit=name]/label:hidden group-data-[fit=number]/label:hidden',
                TEXT_ISOLATE,
              )}
            >
              {item.planDetail}
            </span>
          )}
        </span>
        {barWidth !== null && <LevelBar width={barWidth} onPlan />}
      </>
    )
    if (!isTarget || !interactive) {
      return (
        <div
          key={item.id}
          data-floor-item={item.id}
          {...(isTarget ? { role: 'img', 'aria-label': nameOf(item) } : { 'aria-hidden': true })}
          style={style}
          className={look}
        >
          {label}
        </div>
      )
    }
    // A fixture is often thin (a wall, a window): in edit mode it is drawn as it is and chosen
    // through a target round it, at least 24px each way (WCAG 2.5.8), centred on it.
    const thin = isFixture(item)
    const centreX = ((footprint(item).x + footprint(item).width / 2 - frame.x) / frame.width) * 100
    const centreY =
      ((footprint(item).y + footprint(item).height / 2 - frame.y) / frame.height) * 100
    const targetStyle: CSSProperties = thin
      ? {
          insetInlineStart: `calc(${String(centreX)}% - max(${String(MIN_TARGET / 2)}px, ${box.width} / 2))`,
          top: `calc(${String(centreY)}% - max(${String(MIN_TARGET / 2)}px, ${box.height} / 2))`,
          width: `max(${String(MIN_TARGET)}px, ${box.width})`,
          height: `max(${String(MIN_TARGET)}px, ${box.height})`,
        }
      : style
    return (
      <Fragment key={item.id}>
        {thin && (
          <div aria-hidden="true" style={style} className={look}>
            {label}
          </div>
        )}
        <button
          key={item.id}
          type="button"
          data-floor-item={item.id}
          data-floor-focus={item.id}
          data-chosen={isChosen ? '' : undefined}
          tabIndex={item.id === tabStop ? 0 : -1}
          aria-label={nameOf(item)}
          aria-describedby={instructionsId}
          {...(mode === 'none' ? {} : { 'aria-pressed': isChosen })}
          style={targetStyle}
          onFocus={() => {
            setFocusId(item.id)
          }}
          onKeyDown={(event) => {
            onItemKey(event, item)
          }}
          onClick={(event) => {
            onItemClick(event, item)
          }}
          onPointerDown={(event) => {
            startPointer(event, item, false)
          }}
          className={cn(
            BUTTON_RESET,
            thin ? 'absolute box-border rounded-md' : look,
            FOCUS_RING,
            'focus-visible:outline-offset-[5px]',
            editing ? 'cursor-grab touch-none' : 'cursor-pointer',
            moving && 'cursor-grabbing',
          )}
        >
          {marks}
          {!thin && label}
        </button>
      </Fragment>
    )
  }

  const fixtures = shown.filter((item) => !editing && isFixture(item))
  // The building's own plan under everything, in plan units (P5.25a).
  const background = props.background
  const hasBackground = background !== undefined
  const backgroundImage = background !== undefined && (
    <BackgroundImage
      background={background}
      plan={plan}
      frame={frame}
      dark={colorScheme === 'dark'}
    />
  )
  const planView = (
    <div
      ref={viewport}
      dir="ltr"
      data-slot="floor-plan-viewport"
      className={cn(
        'relative min-w-0 overflow-auto rounded-lg border border-solid border-default bg-surface-raised',
        zoom > 1 && 'max-h-[min(75vh,52rem)]',
      )}
    >
      <div
        ref={canvas}
        dir="ltr"
        role="group"
        aria-label={props.label}
        data-slot="floor-plan-canvas"
        style={canvasStyle}
        className="relative box-border overflow-clip"
      >
        {backgroundImage}
        {areas.map((area) => {
          if (isPolygonArea(area)) {
            const at = percentPoint(areaLabelPoint(area), frame)
            return (
              <Fragment key={area.id}>
                <svg
                  aria-hidden="true"
                  data-floor-area={area.id}
                  viewBox={`${String(frame.x)} ${String(frame.y)} ${String(frame.width)} ${String(frame.height)}`}
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 size-full overflow-visible"
                >
                  <polygon
                    points={svgPoints(area.points)}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    strokeLinejoin="round"
                    className={cn(
                      'stroke-(--liro-border-default)',
                      hasBackground ? 'fill-none' : 'fill-(--liro-surface-sunken)',
                    )}
                  />
                </svg>
                <span
                  aria-hidden="true"
                  data-floor-area-label={area.id}
                  style={{ insetInlineStart: at.left, top: at.top }}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold whitespace-nowrap text-secondary',
                    hasBackground && 'rounded-sm bg-surface-raised px-1.5 py-0.5',
                    TEXT_DIRECTION,
                  )}
                >
                  {area.label}
                </span>
              </Fragment>
            )
          }
          const box = percentBox(area, frame)
          return (
            <div
              key={area.id}
              aria-hidden="true"
              data-floor-area={area.id}
              style={{
                insetInlineStart: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              }}
              className={cn(
                'absolute box-border rounded-md border border-dashed border-default',
                hasBackground ? 'bg-transparent' : 'bg-surface-sunken',
              )}
            >
              <span
                className={cn(
                  'text-xs font-semibold text-secondary',
                  hasBackground
                    ? 'm-1 inline-block rounded-sm bg-surface-raised px-1.5 py-0.5'
                    : 'block px-2 py-1',
                  TEXT_DIRECTION,
                )}
              >
                {area.label}
              </span>
            </div>
          )
        })}
        {lifted !== null && (
          <Placeholder item={props.items.find((each) => each.id === lifted.id)} plan={frame} />
        )}
        {pointerEdit !== null && (
          <Placeholder item={props.items.find((each) => each.id === pointerEdit.id)} plan={frame} />
        )}
        {fixtures.map(drawItem)}
        {ordered.map(drawItem)}
      </div>
    </div>
  )

  // ── The list ──
  const listedItems = shown.filter((item) =>
    props.listed === undefined ? editing || !isFixture(item) : props.listed(item),
  )
  const groups: FloorListGroup<FloorItem>[] =
    props.listGroup === undefined
      ? listGroups(listedItems, areas, messages['floorPlan.noArea'])
      : groupedBy(listedItems, props.listGroup, messages['floorPlan.noArea'])
  const Heading = `h${String(props.headingLevel ?? 3)}` as 'h3'
  // On a phone every item is a card (P5.28 item 27): its state, the guests and the time.
  const listView = (
    <div data-slot="floor-plan-list" className="flex flex-col gap-4">
      {groups.map((group) => (
        <section
          key={group.id}
          aria-labelledby={`${baseId}-group-${group.id}`}
          className="flex flex-col gap-1"
        >
          <Heading
            id={`${baseId}-group-${group.id}`}
            className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
          >
            {group.label}
          </Heading>
          <ul
            className={cn(
              'm-0 flex list-none flex-col p-0',
              phone
                ? 'gap-2'
                : 'overflow-hidden rounded-md border border-solid border-default bg-surface-raised',
            )}
          >
            {group.items.map((item) => (
              <li
                key={item.id}
                className={
                  phone
                    ? 'overflow-hidden rounded-lg border border-solid border-default bg-surface-raised'
                    : 'border-0 border-b border-solid border-default last:border-b-0'
                }
              >
                <ListRow
                  item={item}
                  state={stateOf(item)}
                  capacityText={
                    item.capacity === undefined
                      ? undefined
                      : messages['floorPlan.capacity'](
                          item.capacity,
                          format.number(String(item.capacity)),
                        )
                  }
                  levelText={levelOf(item)}
                  barWidth={item.level === undefined ? null : levelWidth(item.level.percent)}
                  warnings={warningsOf(item.id)}
                  chosen={selected.includes(item.id)}
                  pressable={mode !== 'none'}
                  interactive={interactive}
                  onPress={(event) => {
                    onItemClick(event, item)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )

  const empty = props.items.length === 0 && (
    <EmptyState
      compact
      title={messages['floorPlan.empty']}
      description={
        editing ? messages['floorPlan.emptyEditing'] : messages['floorPlan.emptyDescription']
      }
      className="rounded-lg border border-solid border-default"
    />
  )

  return (
    <div
      ref={root}
      data-slot="floor-plan"
      data-view={view}
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      {toolbar}
      {editOnLarger && <Alert tone="neutral" title={messages['floorPlan.editOnLarger']} />}
      {palette}
      {chosenActions}
      {warningList}
      {view === 'plan' && legend}
      {empty !== false ? empty : view === 'plan' ? planView : listView}
      {instructions}
      {announcer}
    </div>
  )
}

/** The list view's groups by the application's key, in the order of first appearance. */
function groupedBy(
  items: readonly FloorItem[],
  key: (item: FloorItem) => FloorListGroupKey | null,
  otherLabel: string,
): FloorListGroup<FloorItem>[] {
  const groups = new Map<string, FloorListGroup<FloorItem>>()
  for (const item of items) {
    const group = key(item) ?? { id: '', label: otherLabel }
    const entry = groups.get(group.id) ?? { ...group, items: [] }
    entry.items.push(item)
    groups.set(group.id, entry)
  }
  return [...groups.values()]
}

/**
 * The building's own plan (P5.25a): an image placed in percentages of the plan, so it scales and
 * zooms with the items; never a target. The dark theme takes `srcDark`, else inverts the image.
 */
function BackgroundImage({
  background,
  plan,
  frame,
  dark,
}: {
  background: FloorBackground
  plan: { width: number; height: number }
  frame: { x: number; y: number; width: number; height: number }
  dark: boolean
}) {
  const box = percentBox(
    {
      x: background.x ?? 0,
      y: background.y ?? 0,
      width: background.width ?? plan.width,
      height: background.height ?? plan.height,
    },
    frame,
  )
  const alt = background.alt ?? ''
  const own = dark && background.srcDark !== undefined
  return (
    <img
      src={own ? background.srcDark : background.src}
      alt={alt}
      {...(alt === '' ? { 'aria-hidden': true } : {})}
      data-slot="floor-plan-background"
      draggable={false}
      decoding="sync"
      loading="eager"
      style={{
        insetInlineStart: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        ...(background.opacity === undefined ? {} : { opacity: background.opacity }),
      }}
      className={cn(
        'pointer-events-none absolute block max-w-none object-fill select-none',
        dark && !own && 'invert hue-rotate-180',
      )}
    />
  )
}

/**
 * How full an item is, as a bar (P5.25a): drawn in the current colour (the state's tone on the
 * plan, secondary text in the list); the words are in the item's name and the list.
 */
function LevelBar({ width, onPlan = false }: { width: string; onPlan?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-slot="floor-level"
      className={cn(
        'box-border block h-1.5 overflow-hidden rounded-full border border-solid border-current',
        onPlan ? 'pointer-events-none absolute inset-x-1 bottom-1' : 'w-12 shrink-0',
      )}
    >
      <span className="block h-full bg-current" style={{ width }} />
    </span>
  )
}

/** Where a moved item stood: a neutral dashed outline (KanbanBoard's placeholder). */
function Placeholder({
  item,
  plan,
}: {
  item: FloorItem | undefined
  plan: { x: number; y: number; width: number; height: number }
}) {
  if (item === undefined) return null
  const box = percentBox(footprint(item), plan)
  return (
    <div
      aria-hidden="true"
      data-slot="floor-placeholder"
      style={{ insetInlineStart: box.left, top: box.top, width: box.width, height: box.height }}
      className={cn(
        'absolute box-border border-2 border-dashed border-strong bg-surface-sunken',
        item.kind === 'seat' || item.shape === 'round' ? 'rounded-full' : 'rounded-md',
      )}
    />
  )
}

/** One row of the list view: the name, detail and note at the start, state and capacity at the end. */
function ListRow({
  item,
  state,
  capacityText,
  levelText,
  barWidth,
  warnings,
  chosen,
  pressable,
  interactive,
  onPress,
}: {
  item: FloorItem
  state: FloorState | undefined
  capacityText: string | undefined
  levelText: string | undefined
  barWidth: string | null
  warnings: readonly FloorWarning[]
  chosen: boolean
  pressable: boolean
  interactive: boolean
  onPress: (event: MouseEvent<HTMLElement>) => void
}) {
  const { messages } = useLiro()
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {item.label}
        </span>
        {item.detail !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.detail}</span>
        )}
        {item.note !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.note}</span>
        )}
        {warnings.map((warning, index) => (
          <span key={index} className="flex items-start gap-1 text-xs text-primary">
            <ConflictIcon tone={warning.tone ?? 'warning'} className="mt-px size-3.5" />
            <span className={TEXT_DIRECTION}>
              <span className="sr-only">
                {warning.tone === 'danger'
                  ? messages['floorPlan.problem']('')
                  : messages['floorPlan.warning']('')}
              </span>
              {warning.text}
            </span>
          </span>
        ))}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {state !== undefined && (
          <StatusBadge label={state.label} tone={state.tone} icon={state.icon} />
        )}
        {levelText !== undefined && (
          <span className="flex items-center gap-1.5 text-xs text-secondary">
            <span className={TEXT_ISOLATE}>{levelText}</span>
            {barWidth !== null && <LevelBar width={barWidth} />}
          </span>
        )}
        {capacityText !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>{capacityText}</span>
        )}
      </span>
    </>
  )
  const look = cn(
    'relative box-border flex w-full items-start gap-3 px-3 py-2 text-start font-sans',
    chosen &&
      "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']",
  )
  if (!interactive) return <div className={look}>{body}</div>
  return (
    <button
      type="button"
      data-floor-focus={item.id}
      {...(pressable ? { 'aria-pressed': chosen } : {})}
      onClick={onPress}
      className={cn(
        BUTTON_RESET,
        FOCUS_RING,
        'focus-visible:-outline-offset-2',
        look,
        'min-h-11 cursor-pointer',
        !chosen && 'hover:bg-surface-hover',
      )}
    >
      {body}
    </button>
  )
}

/** "Move to…" (x and y) or "Size…" (width and height) for the chosen item, in plan units. */
function EditDialog({
  kind,
  item,
  plan,
  open,
  onOpenChange,
  onDone,
}: {
  kind: 'move' | 'size'
  item: FloorItem
  plan: { width: number; height: number }
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: (change: FloorChange) => void
}) {
  const { messages, format } = useLiro()
  const box = footprint(item)
  const first = kind === 'move' ? Math.round(box.x) : box.width
  const second = kind === 'move' ? Math.round(box.y) : box.height
  const [a, setA] = useState<string | null>(String(first))
  const [b, setB] = useState<string | null>(String(second))
  const [tried, setTried] = useState(false)
  // A new item or a reopened dialog starts from the item's values.
  const [key, setKey] = useState(`${item.id}:${String(first)}:${String(second)}:${String(open)}`)
  const current = `${item.id}:${String(first)}:${String(second)}:${String(open)}`
  if (key !== current) {
    setKey(current)
    setA(String(first))
    setB(String(second))
    setTried(false)
  }
  const ranges =
    kind === 'move'
      ? [
          { min: 0, max: Math.max(0, plan.width - box.width) },
          { min: 0, max: Math.max(0, plan.height - box.height) },
        ]
      : [
          { min: MIN_ITEM_SIZE, max: plan.width - box.x },
          { min: MIN_ITEM_SIZE, max: plan.height - box.y },
        ]
  const values = [wholeUnits(a), wholeUnits(b)]
  const errors = values.map((value, index) => {
    const range = ranges[index] ?? { min: 0, max: 0 }
    if (value !== null && value >= range.min && value <= Math.floor(range.max)) return undefined
    return messages['floorPlan.outOfRange'](
      format.number(String(range.min)),
      format.number(String(Math.floor(range.max))),
    )
  })
  const submit = () => {
    setTried(true)
    const [x, y] = values
    if (errors.some((error) => error !== undefined) || x === null || y === null) return
    if (x === undefined || y === undefined) return
    if (kind === 'move') {
      const position = keepInside(item, x - (box.x - item.x), y - (box.y - item.y), plan)
      onDone({ type: 'move', id: item.id, ...position })
    } else {
      onDone({ type: 'resize', id: item.id, ...resizeFootprint(item, x, y, undefined) })
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <Button
          family="neutral"
          icon={kind === 'move' ? Move : Scaling}
          label={kind === 'move' ? messages['floorPlan.moveTo'] : messages['floorPlan.size']}
        />
      }
      // The action, then the item on its own line (P5.28 item 6).
      title={kind === 'move' ? messages['floorPlan.moveTitle'] : messages['floorPlan.sizeTitle']}
      subject={item.label}
      description={messages['floorPlan.unitsHint']}
      actions={
        <>
          <Button
            intent="cancel"
            label={messages['dialog.cancel']}
            onClick={() => {
              onOpenChange(false)
            }}
          />
          <Button
            family="primary"
            emphasis="primary"
            icon={kind === 'move' ? Move : Scaling}
            label={kind === 'move' ? messages['floorPlan.move'] : messages['floorPlan.apply']}
            onClick={submit}
          />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={kind === 'move' ? messages['floorPlan.x'] : messages['floorPlan.width']}
          value={a}
          onChange={setA}
          {...(tried && errors[0] !== undefined ? { error: errors[0] } : {})}
        />
        <NumberField
          label={kind === 'move' ? messages['floorPlan.y'] : messages['floorPlan.height']}
          value={b}
          onChange={setB}
          {...(tried && errors[1] !== undefined ? { error: errors[1] } : {})}
        />
      </div>
    </Dialog>
  )
}

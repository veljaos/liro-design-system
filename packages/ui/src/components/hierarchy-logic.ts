import type { Tone } from './status-badge'

/*
 * HierarchyChart's logic (BUILD-PLAN P5.42), pure and tested (hierarchy-logic.test.ts): the
 * nodes by their parents, the path to a node, which nodes are open at first, which are drawn and
 * in what order, which children stand as a list, the search on the data, and where the keys of
 * the WAI-ARIA tree move the focus. Nothing here knows what a node means: a person, a unit, a
 * company or a cost centre is the application's data.
 */

/** One node of the hierarchy: a person or position, a unit, a company. From the application. */
export interface HierarchyNode {
  id: string
  /** The node above it; null for a top node. A parent that is not in the data makes it a top node. */
  parentId: string | null
  /** Its name ("Milica Petrović", "Finance", "Kvadrat Beton d.o.o."). */
  title: string
  /** A second line (the position, "Head: Milica Petrović"). */
  subtitle?: string
  /** A third, quieter line (the unit, the place, the tax number). */
  detail?: string
  /** A person's name for PersonAvatar (initials); a node without it has no avatar. */
  avatar?: string
  /** A state in the application's words and tone ("On leave", "Associate"). */
  badge?: { label: string; tone: Tone }
  /** The application's count in words ("12 people", "4 companies"). */
  count?: string
  /** A position without a person: drawn dashed, marked "Vacant" (or the chart's `vacantLabel`). */
  vacant?: boolean
  /** The words on the line to its parent (an ownership share, "60%"). */
  lineLabel?: string
}

/** The nodes by id and by parent, in the application's order. */
export interface HierarchyIndex {
  byId: ReadonlyMap<string, HierarchyNode>
  children: ReadonlyMap<string | null, readonly HierarchyNode[]>
  roots: readonly HierarchyNode[]
}

export function indexHierarchy(nodes: readonly HierarchyNode[]): HierarchyIndex {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const children = new Map<string | null, HierarchyNode[]>()
  for (const node of nodes) {
    // A parent that is missing (or the node itself) makes the node a top node.
    const parent =
      node.parentId !== null && node.parentId !== node.id && byId.has(node.parentId)
        ? node.parentId
        : null
    const list = children.get(parent) ?? []
    list.push(node)
    children.set(parent, list)
  }
  return { byId, children, roots: children.get(null) ?? [] }
}

function parentOf(index: HierarchyIndex, id: string): string | null {
  const parent = index.byId.get(id)?.parentId ?? null
  return parent !== null && parent !== id && index.byId.has(parent) ? parent : null
}

/** The ids from the top node down to `id`, both included; [] when there is no such node. */
export function hierarchyPath(index: HierarchyIndex, id: string): string[] {
  if (!index.byId.has(id)) return []
  const path: string[] = []
  const seen = new Set<string>()
  let current: string | null = id
  // A cycle in the data stops the walk where it would repeat.
  while (current !== null && !seen.has(current)) {
    seen.add(current)
    path.unshift(current)
    current = parentOf(index, current)
  }
  return path
}

/** How many nodes stand under `id`, at every level. */
export function descendantCount(index: HierarchyIndex, id: string): number {
  let count = 0
  const stack = [...(index.children.get(id) ?? [])]
  const seen = new Set<string>([id])
  while (stack.length > 0) {
    const node = stack.pop()
    if (node === undefined || seen.has(node.id)) continue
    seen.add(node.id)
    count += 1
    stack.push(...(index.children.get(node.id) ?? []))
  }
  return count
}

/** Whether a node has nodes under it. */
export function hasChildren(index: HierarchyIndex, id: string): boolean {
  return (index.children.get(id)?.length ?? 0) > 0
}

/**
 * The nodes open at first, so that `depth` levels are shown from the top nodes (or from `from`,
 * the unit shown alone): every node with children above the last shown level.
 */
export function initiallyExpanded(
  index: HierarchyIndex,
  depth: number,
  from?: readonly string[],
): string[] {
  const open: string[] = []
  const walk = (nodes: readonly HierarchyNode[], level: number) => {
    if (level >= depth) return
    for (const node of nodes) {
      const children = index.children.get(node.id) ?? []
      if (children.length === 0) continue
      open.push(node.id)
      walk(children, level + 1)
    }
  }
  const tops = from?.flatMap((id) => index.byId.get(id) ?? []) ?? index.roots
  walk(tops, 1)
  return open
}

/** The open nodes with every node above `id` added, so that `id` is drawn. */
export function revealNode(
  index: HierarchyIndex,
  expanded: readonly string[],
  id: string,
): string[] {
  const above = hierarchyPath(index, id).slice(0, -1)
  return [...expanded, ...above.filter((each) => !expanded.includes(each))]
}

/** Children stand as one list under their parent when they are all leaves and at least `from`. */
export function stacksChildren(index: HierarchyIndex, id: string, from: number): boolean {
  const children = index.children.get(id) ?? []
  return children.length >= from && children.every((child) => !hasChildren(index, child.id))
}

/** The ids whose title, subtitle or detail contain the query (case and accents as typed). */
export function matchHierarchy(
  nodes: readonly HierarchyNode[],
  query: string,
  locale = 'en',
): string[] {
  const wanted = query.trim().toLocaleLowerCase(locale)
  if (wanted === '') return []
  return nodes
    .filter((node) =>
      [node.title, node.subtitle ?? '', node.detail ?? ''].some((text) =>
        text.toLocaleLowerCase(locale).includes(wanted),
      ),
    )
    .map((node) => node.id)
}

/** A node as drawn: its place for aria-level, aria-setsize and aria-posinset. */
export interface HierarchyItem {
  id: string
  parentId: string | null
  /** 1 for the nodes at the top of the view. */
  level: number
  setSize: number
  posInSet: number
  expandable: boolean
  expanded: boolean
  /** It stands in its parent's list (the children are stacked). */
  stacked: boolean
}

/** The drawn nodes in reading order (depth first), from `tops` with the open nodes' children. */
export function visibleHierarchy(
  index: HierarchyIndex,
  tops: readonly HierarchyNode[],
  expanded: readonly string[],
  stackFrom: number,
): HierarchyItem[] {
  const items: HierarchyItem[] = []
  const seen = new Set<string>()
  const walk = (
    nodes: readonly HierarchyNode[],
    level: number,
    parentId: string | null,
    stacked: boolean,
  ) => {
    nodes.forEach((node, at) => {
      if (seen.has(node.id)) return
      seen.add(node.id)
      const expandable = hasChildren(index, node.id)
      const open = expandable && expanded.includes(node.id)
      items.push({
        id: node.id,
        parentId,
        level,
        setSize: nodes.length,
        posInSet: at + 1,
        expandable,
        expanded: open,
        stacked,
      })
      if (open) {
        walk(
          index.children.get(node.id) ?? [],
          level + 1,
          node.id,
          stacksChildren(index, node.id, stackFrom),
        )
      }
    })
  }
  walk(tops, 1, null, false)
  return items
}

/** What a key does in the chart. */
export type HierarchyKeyAction =
  | { kind: 'move'; id: string }
  /** Open a node and move to its first child. */
  | { kind: 'enter'; id: string; child: string }
  | { kind: 'toggle'; id: string }
  | { kind: 'expand'; ids: string[] }
  | { kind: 'open'; id: string }
  | null

/**
 * Where a key moves the focus in the chart (top-down): ArrowDown to the first child (opening the
 * node), ArrowUp to the parent; ArrowLeft and ArrowRight to the previous and next sibling — the
 * arrow toward the reading direction's end is "next", so they are mirrored in right-to-left; in a
 * stacked list ArrowDown and ArrowUp go along the list. Home and End: the first and last node
 * drawn. Enter opens the node's card, Space opens or closes it, `*` opens every sibling.
 */
export function hierarchyKeyAction(
  index: HierarchyIndex,
  items: readonly HierarchyItem[],
  current: string,
  key: string,
  direction: 'ltr' | 'rtl',
): HierarchyKeyAction {
  const at = items.findIndex((item) => item.id === current)
  const item = items[at]
  if (item === undefined) return null
  const siblings = items.filter(
    (each) => each.parentId === item.parentId && each.level === item.level,
  )
  const place = siblings.findIndex((each) => each.id === item.id)
  const sibling = (step: number) => {
    const next = siblings[place + step]
    return next === undefined ? null : ({ kind: 'move', id: next.id } as const)
  }
  const parent = item.parentId === null ? null : ({ kind: 'move', id: item.parentId } as const)
  switch (key) {
    case 'ArrowDown': {
      if (item.stacked) return sibling(1)
      if (!item.expandable) return null
      const first = index.children.get(item.id)?.[0]
      if (first === undefined) return null
      return item.expanded
        ? { kind: 'move', id: first.id }
        : { kind: 'enter', id: item.id, child: first.id }
    }
    case 'ArrowUp':
      return item.stacked && place > 0 ? sibling(-1) : parent
    case 'ArrowRight':
      return sibling(direction === 'rtl' ? -1 : 1)
    case 'ArrowLeft':
      return sibling(direction === 'rtl' ? 1 : -1)
    case 'Home': {
      const first = items[0]
      return first === undefined ? null : { kind: 'move', id: first.id }
    }
    case 'End': {
      const last = items[items.length - 1]
      return last === undefined ? null : { kind: 'move', id: last.id }
    }
    case 'Enter':
      return { kind: 'open', id: item.id }
    case ' ':
      return item.expandable ? { kind: 'toggle', id: item.id } : null
    case '*': {
      const ids = siblings
        .filter((each) => each.expandable && !each.expanded)
        .map((each) => each.id)
      return ids.length === 0 ? null : { kind: 'expand', ids }
    }
    default:
      return null
  }
}

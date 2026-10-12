/*
 * The logic of TreeView and TreeTable (P5.9), kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): which rows are visible for an expanded state, where the keys of the
 * WAI-ARIA tree pattern move the focus, type-ahead, and the checked state of a branch shown from
 * the selected ids. Nothing here knows what a node means: the tree is the application's data.
 */

/** A node of a tree, from the application. */
export interface TreeNode<Data = undefined> {
  id: string
  /** The node's name, from the application ("Cash at bank", "Aisle A"). */
  label: string
  /** A code before the name ("2410", "A-01"), written left to right in every language. */
  code?: string
  /** A second line under the name, from the application. */
  description?: string
  /**
   * The children, in the order to show. Omit them (with `hasChildren`) when the application
   * loads them on demand; `[]` is a node without children.
   */
  children?: readonly TreeNode<Data>[]
  /**
   * The node has children that are not loaded yet: it can be expanded, and expanding it asks the
   * tree's `onLoadChildren`. Ignored once `children` is given.
   */
  hasChildren?: boolean
  /**
   * Loading the children failed: an error row with "Try again" stands under the expanded node.
   * `true` shows the provider's `messages['tree.loadError']`; a string is the application's own
   * words.
   */
  loadError?: string | true
  /**
   * The node cannot be selected, and why, shown as text under its name ("Inactive: no postings
   * after 2025"). It can still be focused, expanded and read.
   */
  disabledReason?: string
  /**
   * The checkbox's state as the application knows it, over the one computed from the selected
   * ids (`treeCheckStates`): e.g. 'mixed' for a branch whose selected children are not loaded.
   */
  checked?: boolean | 'mixed'
  /** The application's data of the node, for TreeTable's columns. */
  data?: Data
}

/** A row of the tree as drawn: a node, or the loading or error row of an expanded node. */
export type TreeRow<Data = undefined> =
  | {
      kind: 'node'
      id: string
      node: TreeNode<Data>
      /** 1 for the top level (aria-level). */
      level: number
      /** The number of siblings, itself included (aria-setsize). */
      setSize: number
      /** Its place among them, from 1 (aria-posinset). */
      posInSet: number
      parentId: string | null
      /** It has children, loaded or not. */
      expandable: boolean
      expanded: boolean
    }
  | {
      kind: 'loading'
      /** `<parent id>` with a suffix, unique among the rows. */
      id: string
      parentId: string
      level: number
    }
  | {
      kind: 'error'
      id: string
      parentId: string
      level: number
      /** The error row's text: the node's `loadError`. */
      error: string | true
    }

/** Whether a node has children, loaded or still to load. */
export function isExpandable(node: TreeNode<unknown>): boolean {
  return node.children === undefined ? node.hasChildren === true : node.children.length > 0
}

/** Whether an expanded node waits for its children (it has them, and they are not loaded). */
export function needsChildren(node: TreeNode<unknown>): boolean {
  return node.children === undefined && node.hasChildren === true
}

/**
 * The rows drawn for this expanded state, top to bottom: every node whose ancestors are all
 * expanded, each with its level and place among its siblings; under an expanded node whose
 * children are not loaded, a loading row, or an error row when loading failed.
 */
export function visibleTreeRows<Data>(
  nodes: readonly TreeNode<Data>[],
  expanded: Iterable<string>,
): TreeRow<Data>[] {
  const open = expanded instanceof Set ? (expanded as Set<string>) : new Set(expanded)
  const rows: TreeRow<Data>[] = []
  const walk = (list: readonly TreeNode<Data>[], level: number, parentId: string | null) => {
    list.forEach((node, index) => {
      const expandable = isExpandable(node)
      const isOpen = expandable && open.has(node.id)
      rows.push({
        kind: 'node',
        id: node.id,
        node,
        level,
        setSize: list.length,
        posInSet: index + 1,
        parentId,
        expandable,
        expanded: isOpen,
      })
      if (!isOpen) return
      if (node.children !== undefined) {
        walk(node.children, level + 1, node.id)
      } else if (node.loadError !== undefined) {
        rows.push({
          kind: 'error',
          id: `${node.id}\u0000error`,
          parentId: node.id,
          level: level + 1,
          error: node.loadError,
        })
      } else {
        rows.push({
          kind: 'loading',
          id: `${node.id}\u0000loading`,
          parentId: node.id,
          level: level + 1,
        })
      }
    })
  }
  walk(nodes, 1, null)
  return rows
}

/** What a key does in the tree (WAI-ARIA tree pattern). */
export type TreeKeyAction =
  | { type: 'focus'; index: number }
  | { type: 'expand'; id: string }
  | { type: 'collapse'; id: string }
  | { type: 'expandMany'; ids: string[] }

/**
 * What a key does on the row at `index` (WAI-ARIA tree pattern; Appendix B.7, from the leading
 * edge): ArrowDown and ArrowUp move to the next and previous row, Home and End to the first and
 * last. The arrow that points into the tree — toward the trailing side, ArrowRight in
 * left-to-right and ArrowLeft in right-to-left — opens a closed node, or moves to the first child
 * of an open one; the other arrow closes an open node, or moves to the parent. `*` opens every
 * closed sibling of the focused node. Null when the key does nothing here.
 */
export function treeKeyAction(
  key: string,
  rows: readonly TreeRow<unknown>[],
  index: number,
  direction: 'ltr' | 'rtl',
): TreeKeyAction | null {
  const row = rows[index]
  if (row === undefined) return null
  const into = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const out = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  const parentIndex = () => rows.findIndex((each) => each.id === row.parentId)
  switch (key) {
    case 'ArrowDown':
      return index < rows.length - 1 ? { type: 'focus', index: index + 1 } : null
    case 'ArrowUp':
      return index > 0 ? { type: 'focus', index: index - 1 } : null
    case 'Home':
      return index > 0 ? { type: 'focus', index: 0 } : null
    case 'End':
      return index < rows.length - 1 ? { type: 'focus', index: rows.length - 1 } : null
    case into: {
      if (row.kind !== 'node' || !row.expandable) return null
      if (!row.expanded) return { type: 'expand', id: row.id }
      // The first child (or the loading or error row) is the next row.
      const next = rows[index + 1]
      return next?.parentId === row.id ? { type: 'focus', index: index + 1 } : null
    }
    case out: {
      if (row.kind === 'node' && row.expanded) return { type: 'collapse', id: row.id }
      if (row.parentId === null) return null
      const parent = parentIndex()
      return parent >= 0 ? { type: 'focus', index: parent } : null
    }
    case '*': {
      if (row.kind !== 'node') return null
      const ids = rows
        .filter(
          (each) =>
            each.kind === 'node' &&
            each.parentId === row.parentId &&
            each.expandable &&
            !each.expanded,
        )
        .map((each) => each.id)
      return ids.length > 0 ? { type: 'expandMany', ids } : null
    }
    default:
      return null
  }
}

/** Milliseconds between typed characters that still make one search (type-ahead). */
export const TYPE_AHEAD_DELAY = 500

/**
 * Type-ahead: the index of the next row whose text starts with `query` (ignoring case, in the
 * page's locale), searching after the row at `from` and wrapping around. When the query is longer
 * than one character, the row at `from` itself is tried first, so typing "ca" after "c" stays on
 * "Cash" instead of jumping to the next "C…". A query of one character repeated ("ccc") cycles
 * through the rows starting with it. Null when no row matches. Each row has its texts (a node's
 * name, and its code: "24" finds account 2410), or null when it takes no part (loading and error
 * rows).
 */
export function typeAheadTarget(
  texts: readonly (readonly string[] | null)[],
  from: number,
  query: string,
  locale?: string,
): number | null {
  if (query === '' || texts.length === 0) return null
  const lower = (text: string) => text.toLocaleLowerCase(locale)
  // Typed keys are whole characters: code points are enough here.
  const chars = Array.from(lower(query))
  // "ccc": the same key pressed again moves on to the next row starting with it.
  const repeated = chars.every((char) => char === chars[0])
  const wanted = repeated ? (chars[0] ?? '') : chars.join('')
  const start = repeated ? from + 1 : from
  for (let step = 0; step < texts.length; step += 1) {
    const at = (((start + step) % texts.length) + texts.length) % texts.length
    const own = texts[at]
    if (own?.some((text) => lower(text.trim()).startsWith(wanted)) === true) return at
  }
  return null
}

/** Every node of the tree, depth first, with its loaded descendants. */
function eachNode<Data>(
  nodes: readonly TreeNode<Data>[],
  visit: (node: TreeNode<Data>, parent: TreeNode<Data> | null) => void,
  parent: TreeNode<Data> | null = null,
) {
  for (const node of nodes) {
    visit(node, parent)
    if (node.children !== undefined) eachNode(node.children, visit, node)
  }
}

/** The node with this id, or null. */
export function findTreeNode<Data>(
  nodes: readonly TreeNode<Data>[],
  id: string,
): TreeNode<Data> | null {
  let found: TreeNode<Data> | null = null
  eachNode(nodes, (node) => {
    if (found === null && node.id === id) found = node
  })
  return found
}

/** The ids of a node's loaded descendants. */
function descendantIds(node: TreeNode<unknown>): string[] {
  const ids: string[] = []
  eachNode(node.children ?? [], (each) => {
    ids.push(each.id)
  })
  return ids
}

/**
 * The checkbox state of every node, shown from the selected ids (computed from nothing else): a
 * node without loaded children is checked when its id is selected; a node with children is
 * checked when all of them are, unchecked when none is, and 'mixed' otherwise. A node's own
 * `checked` (the application's answer) overrides the computed one.
 */
export function treeCheckStates(
  nodes: readonly TreeNode<unknown>[],
  selected: Iterable<string>,
): Map<string, boolean | 'mixed'> {
  const chosen = new Set(selected)
  const states = new Map<string, boolean | 'mixed'>()
  const stateOf = (node: TreeNode<unknown>): boolean | 'mixed' => {
    let state: boolean | 'mixed'
    if (node.children === undefined || node.children.length === 0) {
      state = chosen.has(node.id)
    } else {
      const own = node.children.map(stateOf)
      state = own.every((each) => each === true)
        ? true
        : own.every((each) => each === false)
          ? false
          : 'mixed'
    }
    const shown = node.checked ?? state
    states.set(node.id, shown)
    return shown
  }
  nodes.forEach(stateOf)
  return states
}

/**
 * The selected ids after the user toggles one node in a tree with checkboxes: checking a node
 * checks it and its loaded descendants, unchecking it (or a 'mixed' one, which is checked) clears
 * them; then every ancestor is selected exactly when all its children are. Nodes with a
 * `disabledReason` keep their state. Order: the previous ids, then the added ones.
 */
export function toggleTreeSelection(
  nodes: readonly TreeNode<unknown>[],
  selected: readonly string[],
  id: string,
): string[] {
  const node = findTreeNode(nodes, id)
  if (node === null || node.disabledReason !== undefined) return [...selected]
  const states = treeCheckStates(nodes, selected)
  const checking = states.get(id) !== true
  const chosen = new Set(selected)
  const fixed = new Set<string>()
  eachNode(nodes, (each) => {
    if (each.disabledReason !== undefined) fixed.add(each.id)
  })
  for (const each of [id, ...descendantIds(node)]) {
    if (fixed.has(each)) continue
    if (checking) chosen.add(each)
    else chosen.delete(each)
  }
  // Every parent, deepest first, follows its children.
  const parents: TreeNode<unknown>[] = []
  eachNode(nodes, (each) => {
    if (each.children !== undefined && each.children.length > 0) parents.unshift(each)
  })
  for (const parent of parents) {
    if (fixed.has(parent.id)) continue
    const children = parent.children ?? []
    if (children.every((child) => chosen.has(child.id))) chosen.add(parent.id)
    else chosen.delete(parent.id)
  }
  const kept = selected.filter((each) => chosen.has(each))
  const added = [...chosen].filter((each) => !selected.includes(each))
  return [...kept, ...added]
}

/** The ids of every ancestor of a node, nearest last; empty for a top-level or unknown node. */
export function treeAncestors(nodes: readonly TreeNode<unknown>[], id: string): string[] {
  const parentOf = new Map<string, string>()
  eachNode(nodes, (node, parent) => {
    if (parent !== null) parentOf.set(node.id, parent.id)
  })
  const path: string[] = []
  let current = parentOf.get(id)
  while (current !== undefined) {
    path.unshift(current)
    current = parentOf.get(current)
  }
  return path
}

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { useLiro } from '../provider/liro-provider'
import {
  findTreeNode,
  needsChildren,
  toggleTreeSelection,
  treeAncestors,
  treeCheckStates,
  treeKeyAction,
  typeAheadTarget,
  TYPE_AHEAD_DELAY,
  visibleTreeRows,
  type TreeNode,
  type TreeRow,
} from './tree-logic'

/*
 * The state and keyboard of TreeView and TreeTable (P5.9), shared: the expanded and selected ids
 * (each controlled or not), the visible rows, the roving focus (one row in the tab order), the
 * keys of the WAI-ARIA tree pattern with type-ahead, and the requests for lazy children.
 */

/** How a tree selects: not at all, one node, or several with checkboxes. */
export type TreeSelectionMode = 'none' | 'single' | 'multiple'

/** What TreeView and TreeTable share. */
export interface TreeBaseProps<Data> {
  /** The top-level nodes, from the application. */
  nodes: readonly TreeNode<Data>[]
  /** Names the tree for assistive technology, from the application ("Chart of accounts"). */
  label: string
  /** The expanded nodes' ids (controlled). */
  expanded?: readonly string[]
  /** The nodes expanded at first (uncontrolled). */
  defaultExpanded?: readonly string[]
  /** A node was expanded or collapsed: the new list of expanded ids. */
  onExpandedChange?: (expanded: string[]) => void
  /** 'single' selects one node; 'multiple' adds checkboxes (branches tri-state). Default 'none'. */
  selectionMode?: TreeSelectionMode
  /** The selected nodes' ids (controlled). */
  selected?: readonly string[]
  /** The nodes selected at first (uncontrolled). */
  defaultSelected?: readonly string[]
  /**
   * The selection changed: the new list of ids. With checkboxes, checking a branch checks its
   * loaded descendants and a parent is in the list exactly when all its children are
   * (`toggleTreeSelection`).
   */
  onSelectedChange?: (selected: string[]) => void
  /**
   * A node with `hasChildren` and no `children` was expanded, or "Try again" was pressed under
   * it: the application loads its children and passes them in `nodes` (or sets the node's
   * `loadError`). A loading row stands under the node meanwhile.
   */
  onLoadChildren?: (id: string) => void
}

/** The state of one tree, its rows and their handlers. */
export function useTree<Data>(
  props: TreeBaseProps<Data>,
  containerRef: RefObject<HTMLElement | null>,
  revealRef: RefObject<((index: number) => void) | null>,
) {
  const { direction, locale } = useLiro()
  const mode = props.selectionMode ?? 'none'
  const [innerExpanded, setInnerExpanded] = useState<readonly string[]>(props.defaultExpanded ?? [])
  const expanded = props.expanded ?? innerExpanded
  const [innerSelected, setInnerSelected] = useState<readonly string[]>(props.defaultSelected ?? [])
  const selected = props.selected ?? innerSelected
  const rows = useMemo(() => visibleTreeRows(props.nodes, expanded), [props.nodes, expanded])
  const checks = useMemo(
    () => (mode === 'multiple' ? treeCheckStates(props.nodes, selected) : null),
    [mode, props.nodes, selected],
  )
  const selectedSet = useMemo(() => new Set(selected), [selected])

  // The roving focus: the row in the tab order. A row that is gone (its branch collapsed by the
  // application) hands it to its nearest visible ancestor, else the first selected row, else the
  // first row.
  const [focusId, setFocusId] = useState<string | null>(null)
  const focusIndex = useMemo(() => {
    if (rows.length === 0) return null
    if (focusId !== null) {
      const at = rows.findIndex((row) => row.id === focusId)
      if (at >= 0) return at
      const ancestors = treeAncestors(props.nodes, focusId).reverse()
      for (const ancestor of ancestors) {
        const index = rows.findIndex((row) => row.id === ancestor)
        if (index >= 0) return index
      }
    }
    const chosen = rows.findIndex((row) => row.kind === 'node' && selectedSet.has(row.id))
    return chosen >= 0 ? chosen : 0
  }, [rows, focusId, props.nodes, selectedSet])

  // After a key moved the focus, the row takes it once it is drawn.
  const moveFocus = useRef(false)
  useLayoutEffect(() => {
    if (!moveFocus.current || focusIndex === null) return
    const row = rows[focusIndex]
    if (row === undefined) return
    const find = () =>
      containerRef.current?.querySelector<HTMLElement>(`[data-tree-row="${CSS.escape(row.id)}"]`)
    const element = find()
    if (element !== null && element !== undefined) {
      moveFocus.current = false
      element.focus()
      return
    }
    // Not drawn yet (a long tree): scroll to it; the window draws it on the next render.
    revealRef.current?.(focusIndex)
  })

  const setExpanded = (next: string[]) => {
    setInnerExpanded(next)
    props.onExpandedChange?.(next)
  }
  const request = (id: string) => {
    const node = findTreeNode(props.nodes, id)
    if (node !== null && needsChildren(node) && node.loadError === undefined) {
      props.onLoadChildren?.(id)
    }
  }
  const expand = (ids: readonly string[]) => {
    const added = ids.filter((id) => !expanded.includes(id))
    if (added.length === 0) return
    setExpanded([...expanded, ...added])
    added.forEach(request)
  }
  const collapse = (id: string) => {
    setExpanded(expanded.filter((each) => each !== id))
    // The focus inside the closed branch moves to the branch.
    if (focusId !== null && treeAncestors(props.nodes, focusId).includes(id)) setFocusId(id)
  }
  const toggleExpanded = (id: string) => {
    if (expanded.includes(id)) collapse(id)
    else expand([id])
  }
  const setSelected = (next: string[]) => {
    setInnerSelected(next)
    props.onSelectedChange?.(next)
  }
  const select = (row: TreeRow<Data>) => {
    if (row.kind !== 'node' || row.node.disabledReason !== undefined) return
    if (mode === 'single') {
      if (selected.length !== 1 || selected[0] !== row.id) setSelected([row.id])
    } else if (mode === 'multiple') {
      setSelected(toggleTreeSelection(props.nodes, selected, row.id))
    }
  }
  const retry = (parentId: string) => {
    props.onLoadChildren?.(parentId)
  }
  /** A press on the row: selects it (or checks it); in a tree without selection, opens or closes it. */
  const activate = (row: TreeRow<Data>) => {
    if (row.kind === 'error') {
      retry(row.parentId)
      return
    }
    if (row.kind !== 'node') return
    if (mode === 'none') {
      if (row.expandable) toggleExpanded(row.id)
    } else {
      select(row)
    }
  }

  const typed = useRef({ text: '', at: 0 })
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (event.target !== event.currentTarget) return
    const row = rows[index]
    if (row === undefined) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(row)
      return
    }
    const action = treeKeyAction(event.key, rows, index, direction)
    if (action !== null) {
      event.preventDefault()
      if (action.type === 'focus') {
        const target = rows[action.index]
        if (target !== undefined) {
          moveFocus.current = true
          setFocusId(target.id)
        }
      } else if (action.type === 'expand') {
        expand([action.id])
      } else if (action.type === 'collapse') {
        collapse(action.id)
      } else {
        expand(action.ids)
      }
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now()
      const text = (now - typed.current.at < TYPE_AHEAD_DELAY ? typed.current.text : '') + event.key
      typed.current = { text, at: now }
      const target = typeAheadTarget(
        rows.map((each) =>
          each.kind === 'node'
            ? each.node.code === undefined
              ? [each.node.label]
              : [each.node.label, each.node.code]
            : null,
        ),
        index,
        text,
        locale,
      )
      const found = target === null ? undefined : rows[target]
      if (found !== undefined) {
        event.preventDefault()
        moveFocus.current = true
        setFocusId(found.id)
      }
    }
  }

  // A press moves the roving focus to the row pressed.
  const onFocusRow = (row: TreeRow<Data>) => {
    if (row.id !== focusId) setFocusId(row.id)
  }

  // Forget a stale type-ahead when the tree changes.
  useEffect(() => {
    typed.current = { text: '', at: 0 }
  }, [props.nodes])

  return {
    mode,
    rows,
    expanded,
    selectedSet,
    checks,
    focusIndex,
    onKeyDown,
    onFocusRow,
    activate,
    toggleExpanded,
    select,
    retry,
  }
}

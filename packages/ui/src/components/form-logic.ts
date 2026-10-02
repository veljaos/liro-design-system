/*
 * The logic of the form layout (BUILD-PLAN P3.5; owner's decisions, 2026-10-01, docs/decisions.md
 * "Form layout"): when the bottom action bar shows, which tab to open for the first error, where
 * a wizard may go, and finding the first invalid field in the page.
 */

/** 'auto' shows the bottom bar only while the top actions are out of view (P3.6). */
export type StickyActions = 'auto' | 'always' | 'never'

/** Whether the bottom action bar is shown. */
export function bottomBarShown(mode: StickyActions, topActionsHidden: boolean): boolean {
  if (mode === 'always') return true
  if (mode === 'never') return false
  return topActionsHidden
}

/** The first tab with errors, or null. */
export function firstErrorTab(
  items: readonly { value: string; hasErrors?: boolean; disabled?: boolean }[],
): string | null {
  return items.find((item) => item.hasErrors === true && item.disabled !== true)?.value ?? null
}

/**
 * Where a press on a wizard's step leads: back to any earlier step (its data stays), forward only
 * to the next step through its validation, never further.
 */
export function wizardStepTarget(target: number, active: number): 'back' | 'next' | 'none' {
  if (target < active) return 'back'
  if (target === active + 1) return 'next'
  return 'none'
}

/** A field marked invalid: its control, or the first control of a field frame marked invalid. */
const INVALID =
  '[aria-invalid="true"], [data-slot="field"][data-invalid] :is(input:not([type="hidden"]), textarea, button)'

function focusLater(root: ParentNode) {
  requestAnimationFrame(() => {
    root.querySelector<HTMLElement>(INVALID)?.focus()
  })
}

/**
 * Focuses the first invalid field inside `root` (the application calls it after a failed save;
 * FormWizard after a failed step). When a tab with errors (FormTabs) comes before it, that tab is
 * selected first — the panels of other tabs are not mounted — and the focus moves once it shows.
 * A field inside a closed collapsible section is revealed first in the same way. Returns whether
 * an invalid field or a tab with errors was found.
 */
export function focusFirstInvalid(root: ParentNode): boolean {
  const field = root.querySelector<HTMLElement>(INVALID)
  const tab = root.querySelector<HTMLElement>('[role="tab"][data-has-errors]')
  const tabFirst =
    tab !== null &&
    (field === null ||
      (tab.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
  if (tab !== null && tabFirst && tab.getAttribute('aria-selected') !== 'true') {
    // A Radix tab is selected when it takes the focus (or on a pointer press), not on click().
    tab.focus()
    focusLater(root)
    return true
  }
  if (field === null) return tab !== null
  const closed = field.closest('[data-slot="collapsible-content"][hidden]')
  if (closed !== null) {
    closed
      .closest('[data-slot="form-section"]')
      ?.querySelector<HTMLElement>('[aria-expanded="false"]')
      ?.click()
    focusLater(root)
    return true
  }
  field.focus()
  return true
}

/** The element whose scrolling moves `element`: the nearest scrolling ancestor, or the page. */
export function scrollContainerOf(element: Element): Element {
  let current = element.parentElement
  while (current !== null) {
    const overflow = getComputedStyle(current).overflowY
    if (
      (overflow === 'auto' || overflow === 'scroll') &&
      current.scrollHeight > current.clientHeight
    ) {
      return current
    }
    current = current.parentElement
  }
  return document.scrollingElement ?? document.documentElement
}

import { Lock } from 'lucide-react'
import type { MenuEntry } from '../components/dropdown-menu'

/*
 * The logic of RegisterPage and StatutoryFormPage (P5.20), unit-tested in
 * `register-logic.test.ts`. Nothing here computes a value of the register or the form: rules and
 * their results are the Core's; these functions only order and count what they are given.
 */

// ── RegisterPage ──────────────────────────────────────────────────────────────────────────────

/**
 * A register row's menu: the application's actions, or — for an entry in a locked period — one
 * unavailable item that says why (D3: disabled with a visible reason, never just missing).
 */
export function registerMenu(
  entry: { locked?: boolean },
  actions: readonly MenuEntry[],
  lockedText: string,
): readonly MenuEntry[] {
  if (entry.locked !== true) return actions
  return [{ label: lockedText, icon: Lock, disabled: true, onSelect: () => undefined }]
}

// ── StatutoryFormPage ─────────────────────────────────────────────────────────────────────────

/** The result of one rule check, from the Core. */
export type RuleResult = 'passed' | 'failed' | 'warning'

/** A rule of the form and its result. */
export interface StatutoryRule {
  id: string
  /** The rule as the form states it ("5.4 must equal 5.1 + 5.2 + 5.3"). */
  text: string
  /** The ids of the fields it concerns: the result is shown next to each. */
  fields: readonly string[]
  result: RuleResult
  /** What the check found, in the Core's words ("Difference: 1.200,00 RSD"). */
  detail?: string
}

const ORDER: Record<RuleResult, number> = { failed: 0, warning: 1, passed: 2 }

/**
 * The rules to show next to a field: those that concern it and did not pass, failures before
 * warnings, each group in the Core's order.
 */
export function fieldRules(rules: readonly StatutoryRule[], field: string): StatutoryRule[] {
  return rules
    .filter((rule) => rule.result !== 'passed' && rule.fields.includes(field))
    .sort((a, b) => ORDER[a.result] - ORDER[b.result])
}

/** How many rules failed, warned and passed (the summary). */
export function ruleCounts(rules: readonly StatutoryRule[]): Record<RuleResult, number> {
  const counts: Record<RuleResult, number> = { failed: 0, warning: 0, passed: 0 }
  for (const rule of rules) counts[rule.result] += 1
  return counts
}

/** The summary's tone: danger with a failure, warning with a warning, success otherwise. */
export function rulesTone(rules: readonly StatutoryRule[]): 'danger' | 'warning' | 'success' {
  const counts = ruleCounts(rules)
  if (counts.failed > 0) return 'danger'
  return counts.warning > 0 ? 'warning' : 'success'
}

/** An element id for a field ("3.2" → "statutory-field-3-2"), unique with the page's prefix. */
export function fieldElementId(prefix: string, field: string): string {
  return `${prefix}-statutory-field-${field}`.replace(/[^a-zA-Z0-9_-]/g, '-')
}

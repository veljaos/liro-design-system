import type { ReactNode } from 'react'
import type { IconComponent } from './intents'

/*
 * The data and pure rules of the assistant's work display: one Trace
 * row and the patterns built on it — Reasoning, Chain of thought, Plan, Queue, Task, Subagent and
 * Sources. Nothing here calls a model: every step, word and figure is the application's. Tested in
 * trace-logic.test.ts.
 */

/**
 * Where a piece of work is: 'done' (the default; the title in the past tense, "Read statement
 * 188"), 'running' (present tense, "Reading statement 188"), 'pending' (not started, "Read
 * statement 188") or 'error' (the failure in words, "Could not read statement 188").
 */
export type TraceStatus = 'done' | 'running' | 'pending' | 'error'

export const TRACE_STATUSES: readonly TraceStatus[] = ['done', 'running', 'pending', 'error']

/** One step of an assistant's work, from the application. */
export interface TraceStep {
  id: string
  /** One sentence in the application's words, its tense following the status. */
  title: string
  /** Secondary words after the title: a count, a duration ("2 records", "3 s"). */
  description?: ReactNode
  /** Default 'done'. */
  status?: TraceStatus
  /** The step's own icon (a tool's, a record kind's); the status gives one otherwise. */
  icon?: IconComponent
  /**
   * What the row shows when opened: text, a CodeBlock with the tool's output, a MaskedValue for a
   * sensitive value. Buttons and links go here, never in the title or description.
   */
  detail?: ReactNode
  /** Steps inside this one, shown when it is opened. */
  steps?: readonly TraceStep[]
  /** The row is a link (a record the step used) instead of opening. */
  href?: string
  /** The link leaves the application: it opens in a new tab and says so. Default: an http(s) address. */
  external?: boolean
  /** Open at first. */
  defaultOpen?: boolean
}

/** A record or page the work used, from the application. */
export interface TraceSource {
  id: string
  /** The record's name ("Invoice F-2026-0412", "Account 2040"). */
  label: ReactNode
  href: string
  /** A line under it ("Sales invoices · 14.10.2026"). */
  detail?: ReactNode
  /** The record's own icon (FileText, Landmark …). */
  icon?: IconComponent
  /** It leaves the application: opens in a new tab. Default: an http(s) address. */
  external?: boolean
}

/** One item of a queue: to do, or completed. */
export interface QueueItem {
  id: string
  title: string
  done: boolean
  description?: ReactNode
  detail?: ReactNode
}

/** A step's status, 'done' when not given. */
export function statusOf(step: { status?: TraceStatus }): TraceStatus {
  return step.status ?? 'done'
}

/** Every step, nested ones after their parent, in reading order. */
export function flattenTrace(steps: readonly TraceStep[]): TraceStep[] {
  return steps.flatMap((step) => [step, ...flattenTrace(step.steps ?? [])])
}

/** The steps' statuses by id. */
export function traceStatuses(steps: readonly TraceStep[]): Record<string, TraceStatus> {
  const statuses: Record<string, TraceStatus> = {}
  for (const step of flattenTrace(steps)) statuses[step.id] = statusOf(step)
  return statuses
}

/**
 * The step to announce after a change: the last step (in reading order) that is new or whose
 * status changed since `previous`, unless it is only waiting ('pending'). Null when nothing did.
 */
export function changedStep(
  previous: Readonly<Record<string, TraceStatus>>,
  steps: readonly TraceStep[],
): TraceStep | null {
  let found: TraceStep | null = null
  for (const step of flattenTrace(steps)) {
    const status = statusOf(step)
    if (previous[step.id] !== status && status !== 'pending') found = step
  }
  return found
}

/**
 * The status of a group of steps (a chain of thought, a task, a plan) when the application gives
 * none: failed if one failed, running if one runs or some are done and some still wait, waiting if
 * none has started, else done. No steps: done.
 */
export function summaryStatus(steps: readonly TraceStep[]): TraceStatus {
  const statuses = steps.map(statusOf)
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('running')) return 'running'
  const waiting = statuses.filter((status) => status === 'pending').length
  if (waiting === 0) return 'done'
  return waiting === statuses.length ? 'pending' : 'running'
}

/** A plan's progress: its steps done, of all its steps. */
export function planProgress(steps: readonly TraceStep[]): { done: number; total: number } {
  return { done: steps.filter((step) => statusOf(step) === 'done').length, total: steps.length }
}

/** A queue in two groups: what is left to do and what is completed, each in the given order. */
export function queueGroups(items: readonly QueueItem[]): {
  toDo: QueueItem[]
  completed: QueueItem[]
} {
  return {
    toDo: items.filter((item) => !item.done),
    completed: items.filter((item) => item.done),
  }
}

/** A link that leaves the application: marked so, or an absolute http(s) address. */
export function isExternalLink(link: { href: string; external?: boolean | undefined }): boolean {
  return link.external ?? /^https?:\/\//i.test(link.href)
}

/**
 * The sources with duplicates removed: the same id or the same address (ignoring a trailing "/"
 * and the case of the scheme and host) is kept once, at its first place.
 */
export function uniqueSources<T extends { id: string; href: string }>(items: readonly T[]): T[] {
  const ids = new Set<string>()
  const addresses = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const address = normalizeHref(item.href)
    if (ids.has(item.id) || addresses.has(address)) continue
    ids.add(item.id)
    addresses.add(address)
    out.push(item)
  }
  return out
}

function normalizeHref(href: string): string {
  const trimmed = href.trim().replace(/\/+$/, '')
  const match = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]*)(.*)$/i.exec(trimmed)
  return match === null ? trimmed : `${(match[1] ?? '').toLowerCase()}${match[2] ?? ''}`
}

/**
 * Whether a row that opens by itself while work runs (Reasoning, Task) is open: the user's own
 * choice once they toggled it, else open while running and closed when done.
 */
export function autoOpen(status: TraceStatus, toggled: boolean | null): boolean {
  return toggled ?? status === 'running'
}

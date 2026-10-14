import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import { instantText } from './admin-logic'

/*
 * HealthList's logic, without React (P5.29; AGENTS.md C7): the kinds of state a monitored thing
 * can be in, and the facts a row writes under its figures — the last success and the last error
 * with its message. The states, their names and tones, the figures and the times are the
 * application's; nothing here counts, compares or judges them.
 */

/**
 * What a state means, for its icon only (the words and the tone are the application's): working;
 * working with trouble; not working; stopped on purpose; not known (no recent report).
 */
export type HealthKind = 'up' | 'degraded' | 'down' | 'maintenance' | 'unknown'

export const HEALTH_KINDS: readonly HealthKind[] = [
  'up',
  'degraded',
  'down',
  'maintenance',
  'unknown',
]

/** A fact under a row's figures: its label and its value as text. */
export interface HealthFact {
  key: 'lastSuccess' | 'lastError' | 'errorMessage'
  label: string
  value: string
}

/** The last success and the last error of a monitored thing, as the application reports them. */
export interface HealthTimes {
  /** An ISO instant in the tenant's offset; null: never succeeded; undefined: not reported. */
  lastSuccess?: string | null
  /** The last failure: when (an ISO instant) and the application's message. */
  lastError?: { at: string; message: string }
}

/**
 * The facts a row writes: "Last success 14.10.2026. 09:35" ("Never" when null), "Last error
 * 14.10.2026. 08:12" and the error's message, each only when reported. The instants keep their own
 * date and clock (`instantText`), as every instant in the library (P4.9).
 */
export function healthFacts(
  times: HealthTimes,
  format: LiroFormat,
  messages: LiroMessages,
): HealthFact[] {
  const facts: HealthFact[] = []
  if (times.lastSuccess !== undefined) {
    facts.push({
      key: 'lastSuccess',
      label: messages['health.lastSuccess'],
      value:
        times.lastSuccess === null
          ? messages['health.never']
          : instantText(format, times.lastSuccess),
    })
  }
  if (times.lastError !== undefined) {
    facts.push({
      key: 'lastError',
      label: messages['health.lastError'],
      value: instantText(format, times.lastError.at),
    })
    facts.push({
      key: 'errorMessage',
      label: messages['health.errorMessage'],
      value: times.lastError.message,
    })
  }
  return facts
}

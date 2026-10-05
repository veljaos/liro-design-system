import { createContext, useContext, useEffect, useState } from 'react'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * SettlingValue (BUILD-PLAN P2.8): a value the server is recomputing — a total while lines are
 * typed — shown calmly.
 * - The last confirmed value stays, unchanged, while a new one is pending: never blank, never a
 *   spinner instead of the number, never an intermediate value (the application passes only
 *   confirmed values).
 * - Reserved width and tabular digits, so nothing reflows in left-to-right or right-to-left: the
 *   number keeps at least the widest width it has had (or `reserveChars`), aligned to its end.
 * - The new value is announced once, politely, when it settles (a live region of its own; the
 *   visible number is not live, so typing does not make it chatter).
 * - `unavailableText` when no value can be shown (offline, say); "—" when there is none.
 *
 * The indicator (owner's decision, 2026-09-28, docs/decisions.md "Display"): a 6px dot in
 * text.tertiary at the number's start, in a slot that is always reserved, so showing or hiding it
 * never moves the number; shown only once the value has been pending for more than 300ms, so a
 * fast answer shows no dot and nothing flickers; pulsing (the skeleton's pulse), static with
 * reduced motion; decorative (aria-hidden).
 */

/** Milliseconds a value must be pending before the dot shows. */
export const SETTLING_DELAY = 300

/**
 * Inside it, a SettlingValue keeps, under `key`, the time its value became pending (`since`) and
 * the widest width it has reserved (`widest`), so one mounted anew (EditableGrid renders its
 * totals anew when the layout changes between the table and the cards) shows the dot when the
 * first would have and keeps the number where it was (internal, not exported).
 */
export interface SettlingMemoryValue {
  since: Map<string, number>
  widest: Map<string, number>
  key: string
}
export const SettlingMemory = createContext<SettlingMemoryValue | null>(null)

export interface SettlingValueProps {
  /** The last confirmed value: a decimal string, or null when there is none. */
  value: string | null
  /** A new value is being computed; the confirmed one stays. */
  pending?: boolean
  /** Formats as an amount in this currency (`format.money`); otherwise as a number. */
  currency?: string
  /** Decimals, as NumberText and MoneyText (never rounded). */
  decimals?: number
  /** Shown instead of a value when none can be shown (offline). From the application. */
  unavailableText?: string
  /** Characters of width to reserve from the start, so even the first growth does not reflow. */
  reserveChars?: number
  className?: string
}

/** A value that settles: the confirmed number stays still while the next one is computed. */
export function SettlingValue(props: SettlingValueProps) {
  const { format } = useLiro()
  const pending = props.pending === true
  const text =
    props.value === null
      ? (props.unavailableText ?? '—')
      : props.currency === undefined
        ? format.number(
            props.value,
            props.decimals === undefined ? {} : { decimals: props.decimals },
          )
        : format.money(
            props.value,
            props.currency,
            props.decimals === undefined ? {} : { decimals: props.decimals },
          )

  // The widest text so far: the number never gets narrower, so nothing around it moves back.
  const slot = useContext(SettlingMemory)
  const [widest, setWidest] = useState(() => Math.max(text.length, slot?.widest.get(slot.key) ?? 0))
  if (text.length > widest) setWidest(text.length)
  const kept = slot?.widest
  const keptKey = slot?.key
  useEffect(() => {
    if (kept !== undefined && keptKey !== undefined) kept.set(keptKey, widest)
  }, [kept, keptKey, widest])
  const reserve = Math.max(widest, props.reserveChars ?? 0)

  // The announcement: the text of each new settled value, once (not the first one on the page).
  const [shown, setShown] = useState(text)
  const [announcement, setAnnouncement] = useState('')
  if (!pending && text !== shown) {
    setShown(text)
    setAnnouncement(text)
  }

  // The dot shows only after the value has been pending for SETTLING_DELAY.
  const [late, setLate] = useState(() => {
    const since = pending ? slot?.since.get(slot.key) : undefined
    return since !== undefined && Date.now() - since >= SETTLING_DELAY
  })
  if (!pending && late) setLate(false)
  const since = slot?.since
  const key = slot?.key
  useEffect(() => {
    if (!pending) {
      if (key !== undefined) since?.delete(key)
      return
    }
    const started = (key === undefined ? undefined : since?.get(key)) ?? Date.now()
    if (key !== undefined) since?.set(key, started)
    const timer = window.setTimeout(
      () => {
        setLate(true)
      },
      Math.max(0, SETTLING_DELAY - (Date.now() - started)),
    )
    return () => {
      window.clearTimeout(timer)
    }
  }, [pending, since, key])

  return (
    <span
      data-slot="settling-value"
      data-pending={pending || undefined}
      className={cn('inline-flex items-center gap-1.5 font-sans', props.className)}
    >
      <span aria-hidden="true" className="flex size-1.5 shrink-0 text-tertiary">
        {pending && late && (
          <span
            data-slot="settling-dot"
            className="size-1.5 animate-liro-skeleton rounded-full bg-current motion-reduce:animate-none"
          />
        )}
      </span>
      <bdi
        className={cn(
          'inline-block text-end whitespace-nowrap tabular-nums',
          props.value === null && 'text-secondary',
        )}
        style={{ minInlineSize: `${String(reserve)}ch` }}
      >
        {text}
      </bdi>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </span>
  )
}

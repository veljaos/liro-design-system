import { useEffect, useRef } from 'react'

/*
 * The logic of ComboboxField and MultiSelectField, kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): keyboard movement through the options, local filtering, and a
 * debounced search callback.
 */

/** An option as the logic sees it. */
export interface Choice {
  value: string
  label: string
  disabled?: boolean
}

export type MoveKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'

export const MOVE_KEYS: readonly MoveKey[] = ['ArrowDown', 'ArrowUp', 'Home', 'End']

/**
 * The option that becomes active after a key, skipping disabled options. ArrowDown and ArrowUp
 * wrap around, as Mantine's Combobox (loop: true); Home and End go to the first and last usable
 * option. -1 when no option can be chosen. Up and down do not depend on the text direction.
 */
export function moveActive(key: MoveKey, active: number, options: readonly Choice[]): number {
  const usable = options.flatMap((option, index) => (option.disabled === true ? [] : [index]))
  if (usable.length === 0) return -1
  const first = usable[0] ?? -1
  const last = usable[usable.length - 1] ?? -1
  switch (key) {
    case 'Home':
      return first
    case 'End':
      return last
    case 'ArrowDown':
      return usable.find((index) => index > active) ?? first
    case 'ArrowUp':
      return [...usable].reverse().find((index) => index < active && active !== -1) ?? last
  }
}

/**
 * The options whose label contains the query, ignoring case and accents, in the page's locale
 * (so the Turkish and Serbian case rules apply). An empty query keeps every option.
 */
export function filterChoices<T extends Choice>(
  options: readonly T[],
  query: string,
  locale: string,
): T[] {
  const normalize = (text: string) =>
    text
      .toLocaleLowerCase(locale)
      .normalize('NFD')
      .replace(/\p{Mn}/gu, '')
  const needle = normalize(query.trim())
  if (needle === '') return [...options]
  return options.filter((option) => normalize(option.label).includes(needle))
}

/** A function that runs `delay` milliseconds after its last call; `cancel` drops a pending run. */
export function debounce<A extends unknown[]>(run: (...args: A) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return {
    call: (...args: A) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        run(...args)
      }, delay)
    },
    cancel: () => {
      clearTimeout(timer)
    },
  }
}

/**
 * Calls `callback` once typing has paused for `delay` milliseconds; a newer call replaces a
 * pending one, and nothing is called after unmount. The latest callback is used.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: ((...args: A) => void) | undefined,
  delay: number,
): (...args: A) => void {
  const latest = useRef(callback)
  const debounced = useRef<ReturnType<typeof debounce<A>> | null>(null)
  useEffect(() => {
    latest.current = callback
  }, [callback])
  useEffect(() => {
    const current = debounce<A>((...args) => latest.current?.(...args), delay)
    debounced.current = current
    return () => {
      current.cancel()
    }
  }, [delay])
  return (...args: A) => {
    debounced.current?.call(...args)
  }
}

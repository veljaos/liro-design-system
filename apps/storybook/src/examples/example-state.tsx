import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
  type SetStateAction,
} from 'react'

/*
 * State the examples' application keeps above its screens: what must outlive a
 * screen — a table's open tab, the till's journal — as the real application keeps it on its
 * server. Each screen starts fresh (ExampleApp keys the screen by its path); a value kept here by
 * its key is still there when the user comes back. Without the provider (a screen rendered
 * alone) the value lives in the screen, as before.
 */

interface Store {
  values: Map<string, unknown>
  /** Re-renders the screens after a change. */
  bump: () => void
}

const StateContext = createContext<Store | null>(null)

/** Keeps the examples' state above the screens; ExampleApp wraps every screen in it. */
export function ExampleStateProvider({ children }: { children: ReactNode }) {
  // The same map for the provider's life; a change re-renders through `bump`.
  const [values] = useState(() => new Map<string, unknown>())
  const [, setVersion] = useState(0)
  const bump = useCallback(() => {
    setVersion((version) => version + 1)
  }, [])
  return <StateContext.Provider value={{ values, bump }}>{children}</StateContext.Provider>
}

/**
 * A value the application keeps by `key` above the screens: `initial` the first time, then what
 * was last set — also after the user leaves the screen and comes back.
 */
export function useExampleState<T>(
  key: string,
  initial: () => T,
): [T, (next: SetStateAction<T>) => void] {
  const store = useContext(StateContext)
  const [local, setLocal] = useState<T>(() => {
    if (store === null) return initial()
    if (!store.values.has(key)) store.values.set(key, initial())
    return store.values.get(key) as T
  })
  const value = store === null ? local : ((store.values.get(key) as T | undefined) ?? local)
  const set = useCallback(
    (next: SetStateAction<T>) => {
      if (store === null) {
        setLocal(next)
        return
      }
      const previous = (store.values.get(key) as T | undefined) ?? local
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
      store.values.set(key, resolved)
      setLocal(resolved)
      store.bump()
    },
    [store, key, local],
  )
  return [value, set]
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** A viewport whose width the test sets; the 48em query follows it. */
function fakeViewport(initialWidth: number) {
  let width = initialWidth
  const listeners = new Set<() => void>()
  const query = {
    get matches() {
      return width >= 768
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }
  vi.stubGlobal('window', {
    matchMedia: () => query,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  })
  return (next: number) => {
    const before = query.matches
    width = next
    if (query.matches === before) return
    listeners.forEach((listener) => {
      listener()
    })
  }
}

async function freshStore() {
  vi.resetModules()
  const module = await import('./use-phone')
  return module
}

describe('usePhone store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('ignores a viewport that crosses 48em only for an instant (a full-page screenshot)', async () => {
    const resize = fakeViewport(1280)
    const { phoneStore, LAYOUT_SETTLE } = await freshStore()
    const changed = vi.fn()
    phoneStore.subscribe(changed)
    expect(phoneStore.read()).toBe(false)
    resize(1)
    vi.advanceTimersByTime(150)
    resize(1280)
    vi.advanceTimersByTime(LAYOUT_SETTLE)
    expect(phoneStore.read()).toBe(false)
    expect(changed).not.toHaveBeenCalled()
  })

  it('switches once the viewport has stayed across 48em for LAYOUT_SETTLE', async () => {
    const resize = fakeViewport(1280)
    const { phoneStore, LAYOUT_SETTLE } = await freshStore()
    const changed = vi.fn()
    phoneStore.subscribe(changed)
    resize(390)
    vi.advanceTimersByTime(LAYOUT_SETTLE - 1)
    expect(phoneStore.read()).toBe(false)
    vi.advanceTimersByTime(1)
    expect(phoneStore.read()).toBe(true)
    expect(changed).toHaveBeenCalledTimes(1)
  })

  it('reads a phone viewport at once on the first render', async () => {
    fakeViewport(390)
    const { phoneStore } = await freshStore()
    expect(phoneStore.read()).toBe(true)
  })
})

// Changing this file is a protected change (BUILD-PLAN rule 10).
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

/** An entry of storybook-static/index.json. */
export interface Entry {
  id: string
  title: string
  name: string
  type: 'story' | 'docs'
}

/** Every story and docs page of the built Storybook. Run `pnpm build-storybook` first. */
export function readEntries(): Entry[] {
  const index = JSON.parse(
    readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
  ) as { entries: Record<string, Entry> }
  return Object.values(index.entries)
}

export interface Mode {
  theme: 'light' | 'dark'
  direction: 'ltr' | 'rtl'
}

/** Light and dark × left-to-right and right-to-left. */
export const MODES: readonly Mode[] = [
  { theme: 'light', direction: 'ltr' },
  { theme: 'light', direction: 'rtl' },
  { theme: 'dark', direction: 'ltr' },
  { theme: 'dark', direction: 'rtl' },
]

export function modeName(mode: Mode): string {
  return `${mode.theme}-${mode.direction}`
}

export interface Outcome {
  /** "success" when the story rendered, its play function passed and no report failed. */
  status: string
  errors: string[]
}

interface TestState {
  done: boolean
  status: string
  errors: string[]
}

declare global {
  interface Window {
    __liroTest?: TestState
  }
}

/**
 * Listens on the Storybook channel from the moment the preview creates it, and records how the
 * story ends: storyFinished (with the status Storybook computes from exceptions, play function and
 * reports such as the accessibility addon's), storyErrored, storyThrewException, storyMissing,
 * or docsRendered for a docs page.
 */
function listenToStorybook() {
  const state: TestState = { done: false, status: 'pending', errors: [] }
  window.__liroTest = state
  const finish = (status: string, error?: string) => {
    if (error !== undefined) state.errors.push(error)
    if (!state.done) {
      state.status = status
      state.done = true
    }
  }
  interface Channel {
    on(event: string, listener: (payload: unknown) => void): void
  }
  const describe = (payload: unknown) => {
    if (payload instanceof Error) return payload.message
    if (typeof payload === 'object' && payload !== null) return JSON.stringify(payload)
    return String(payload)
  }
  const attached = new WeakSet<object>()
  let current: unknown
  Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
    configurable: true,
    get: () => current,
    set: (channel: Channel) => {
      current = channel
      if (attached.has(channel)) return
      attached.add(channel)
      channel.on('storyFinished', (payload) => {
        const { status, reporters } = payload as {
          status: string
          reporters: { type: string; status: string }[]
        }
        const failed = reporters.filter((report) => report.status === 'failed')
        finish(status, failed.length > 0 ? `failed reports: ${describe(failed)}` : undefined)
      })
      channel.on('storyErrored', (payload) => {
        finish('error', describe(payload))
      })
      channel.on('storyThrewException', (payload) => {
        finish('error', describe(payload))
      })
      channel.on('playFunctionThrewException', (payload) => {
        finish('error', describe(payload))
      })
      channel.on('storyMissing', (payload) => {
        finish('error', `story missing: ${describe(payload)}`)
      })
      channel.on('docsRendered', () => {
        finish('success')
      })
    },
  })
}

/** Opens a story or docs page in the given mode and waits until Storybook reports how it ended. */
export async function openEntry(page: Page, entry: Entry, mode: Mode): Promise<Outcome> {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })
  await page.addInitScript(listenToStorybook)
  const globals = `theme:${mode.theme};direction:${mode.direction}`
  const viewMode = entry.type === 'docs' ? 'docs' : 'story'
  await page.goto(`/iframe.html?id=${entry.id}&viewMode=${viewMode}&globals=${globals}`)
  await page.waitForFunction(() => window.__liroTest?.done === true)
  const state = await page.evaluate(() => window.__liroTest)
  // Fonts must be ready before a screenshot.
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  return {
    status: state?.status ?? 'unknown',
    errors: [...(state?.errors ?? []), ...pageErrors],
  }
}

// Changing this file is a protected change (see AGENTS.md).
import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

/** An entry of storybook-static/index.json. */
export interface Entry {
  id: string
  title: string
  name: string
  type: 'story' | 'docs'
  tags?: string[]
}

/**
 * The tag of a story that reaches its state by clicking, typing, focusing or scrolling:
 * the story tests and the accessibility checks run it; the visual test takes no picture of it.
 * The look it reaches has a static story that renders that state directly from its args or
 * initial state.
 */
export const INTERACTION_TAG = 'interaction'

/** Whether the visual test takes a picture of the entry: a story without the interaction tag. */
export function isPictured(entry: Entry): boolean {
  return entry.type === 'story' && !(entry.tags ?? []).includes(INTERACTION_TAG)
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

/**
 * The open option lists, menus and floating contents (popovers, selects, menus, the command
 * palette's list) whose content is wider than their box (scrollWidth > clientWidth), with every
 * scrolling element inside them. Each is described by its role or data-slot and its two widths.
 */
export async function sidewaysOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const lists =
      '[role="listbox"], [role="menu"], [cmdk-list], [data-radix-popper-content-wrapper] > *'
    const found = new Set<Element>(document.querySelectorAll(lists))
    for (const element of [...found]) {
      for (const inner of element.querySelectorAll('*')) {
        const overflow = getComputedStyle(inner).overflowX
        if (overflow === 'auto' || overflow === 'scroll') found.add(inner)
      }
    }
    return [...found]
      .filter((element) => element.getClientRects().length > 0)
      .filter((element) => element.scrollWidth > element.clientWidth)
      .map((element) => {
        const name =
          element.getAttribute('role') ??
          element.getAttribute('data-slot') ??
          element.tagName.toLowerCase()
        return `${name}: content ${String(element.scrollWidth)}px in ${String(element.clientWidth)}px`
      })
  })
}

/**
 * The visible texts of a right-to-left page whose word order the page's direction would break:
 * a text without right-to-left letters that starts or ends with something
 * other than a letter ("4 items", "40 h", "Alfa Trade d.o.o.", "05.10.2026. – 11.10.2026."),
 * whose own element and inline ancestors set neither `unicode-bidi: plaintext` (TEXT_DIRECTION,
 * TEXT_ISOLATE) nor `dir="auto"` nor `bdi`, nor a left-to-right direction. A paragraph's
 * direction is its block's: `unicode-bidi` is not inherited, so a block child (a flex item
 * included) of a text-direction element starts again from the page's direction. A bare number
 * ("2026", "08:00") has nothing to reorder. Typed text (inputs, text areas) belongs to its field
 * (`dir="auto"`), and charts draw their own SVG text; both are left out.
 */
export async function textOutOfOrder(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const rightToLeft = /[\u0590-\u08ff\u200f\ufb1d-\ufdff\ufe70-\ufeff]/
    const letter = /\p{L}/u
    const found = new Set<string>()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = (node.textContent ?? '').trim()
      if (text === '' || rightToLeft.test(text) || !/[\p{L}\p{N}]/u.test(text)) continue
      if (/^\p{N}+([.,:/-]\p{N}+)*$/u.test(text)) continue
      if (letter.test(text.at(0) ?? '') && letter.test(text.at(-1) ?? '')) continue
      const parent = node.parentElement
      if (parent?.closest('textarea, input, svg, script, style') !== null) continue
      const box = parent.getBoundingClientRect()
      const style = getComputedStyle(parent)
      if (box.width <= 2 || box.height <= 2 || style.visibility !== 'visible') continue
      if (style.direction === 'ltr') continue
      let ordered = false
      for (
        let element: Element | null = parent;
        element !== null;
        element = element.parentElement
      ) {
        const own = getComputedStyle(element)
        if (
          own.unicodeBidi.includes('plaintext') ||
          element.getAttribute('dir') === 'auto' ||
          element.tagName === 'BDI'
        ) {
          ordered = true
          break
        }
        if (own.display !== 'inline' && own.display !== 'contents') break
      }
      if (!ordered) {
        const name = `${parent.tagName.toLowerCase()}${parent.getAttribute('data-slot') === null ? '' : `[${parent.getAttribute('data-slot') ?? ''}]`}`
        found.add(`"${text.slice(0, 60)}" in <${name}>`)
      }
    }
    return [...found]
  })
}

/**
 * The words of the controls and labels. A word inside a button, a tab, a menu item,
 * a legend or a label never stands on two lines (a break inside it: "Vouche r"), and a button's
 * text never runs out of its box unless it is clipped on purpose (an ellipsis, `FittedLabel`).
 * Words of scripts that break between characters (Chinese, Japanese, Korean, Thai) are not
 * words here; text for assistive technology only (`sr-only`) or hidden is not drawn.
 */
export async function brokenWords(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>()
    const characterScripts =
      /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Hangul}]/u
    const name = (element: Element) =>
      (element.getAttribute('aria-label') ?? element.textContent)
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 50)
    const clippedWithin = (node: Node, scope: Element) => {
      for (
        let element = node.parentElement;
        element !== null && element !== scope.parentElement;
        element = element.parentElement
      ) {
        const style = getComputedStyle(element)
        if (style.overflowX !== 'visible' || style.textOverflow === 'ellipsis') return true
        if (element === scope) break
      }
      return false
    }
    const scopes = document.querySelectorAll(
      'button, [role="button"], [role="tab"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], label, legend',
    )
    for (const scope of scopes) {
      const box = scope.getBoundingClientRect()
      if (box.width <= 2 || box.height <= 2) continue
      const control = scope.matches('button, [role="button"], [role="tab"]')
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const text = node.textContent ?? ''
        if (text.trim() === '' || node.parentElement?.closest('.sr-only') != null) continue
        // Text that is not drawn (a floor plan label left out with `visibility: hidden`) is skipped.
        if (node.parentElement?.checkVisibility({ visibilityProperty: true }) === false) continue
        // One measure per text: only a text on more than one line can break a word, and only a
        // text past its button's edge can run out of it.
        const whole = document.createRange()
        whole.selectNodeContents(node)
        const lines = [...whole.getClientRects()].filter(
          (rect) => rect.width > 0.5 && rect.height > 0.5,
        )
        const outside = lines.some(
          (rect) => rect.right > box.right + 1.5 || rect.left < box.left - 1.5,
        )
        if (control && outside && !clippedWithin(node, scope)) {
          found.add(
            `"${text.trim().slice(0, 30)}" runs out of <${scope.tagName.toLowerCase()}> "${name(scope)}"`,
          )
        }
        if (new Set(lines.map((rect) => Math.round(rect.bottom / 3))).size < 2) continue
        for (const match of text.matchAll(/[^\s\-–—/·,]+/gu)) {
          const word = match[0]
          if (word.length < 2 || characterScripts.test(word)) continue
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + word.length)
          const rects = [...range.getClientRects()].filter(
            (rect) => rect.width > 0.5 && rect.height > 0.5,
          )
          if (new Set(rects.map((rect) => Math.round(rect.bottom / 3))).size > 1) {
            found.add(`"${word}" broken in <${scope.tagName.toLowerCase()}> "${name(scope)}"`)
          }
        }
      }
    }
    return [...found]
  })
}

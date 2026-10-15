// Changing this file is a protected change (BUILD-PLAN rule 10).
import { expect, test, type Locator, type Page } from '@playwright/test'
import { openEntry, readEntries, type Entry, type Mode } from './support'

// Phones never scroll sideways (P5.28 item 1), and an overlay on a phone covers the whole screen
// (item 5). Every phone story — a story whose name says it is drawn on a phone ("…, phone",
// "Phone width", "handheld", "mobile") — is opened in a window of a phone's width with room for
// the story's margins (456 × 900), so the components lay themselves out as on a phone (below
// 48em) and their floating lists keep inside the window. The screen is the story's PhoneFrame
// (`data-liro-phone-frame`, 390 × 844, P5.28 item 11) when it draws one, else the window. On it:
// - the page does not scroll sideways (the frame's page, or the document);
// - every open overlay (a floating list, menu or popover, a dialog, a sheet) lies inside the
//   screen, and nothing inside it is wider than its own box (an option cut off is lost text; a
//   text cut with an ellipsis on purpose is not);
// - every backdrop covers the whole screen.
// The story is checked as drawn, then with each of its triggers opened one at a time: elements
// with `aria-haspopup` (selects, menus, popovers, dialog triggers), comboboxes (opened by a press,
// then ArrowDown), and buttons whose name ends in "…" (the library's convention for a button that
// opens a dialog: "Move to…", "Search all…"). In a dialog or sheet that opens, its own triggers
// are opened too (a select inside a dialog), one level deep. A trigger repeated down a page (an
// article's menu, a row's menu) is opened twice at most, and at most 40 per screen or dialog.
// Light theme, both directions: the geometry does not depend on the theme.

/** Stories drawn on a phone, by their names. */
const PHONE_NAME = /phone|handheld|mobile/i

/**
 * A phone's 390px with the story's 16px margin and a phone-width story's own 16px padding on each
 * side; a phone frame and its margin tall.
 */
const WINDOW = { width: 456, height: 900 }

const MODES: readonly Mode[] = [
  { theme: 'light', direction: 'ltr' },
  { theme: 'light', direction: 'rtl' },
]

/** An open overlay's outermost element. */
const OVERLAYS = [
  '[data-radix-popper-content-wrapper]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[data-slot="sheet-content"]',
  '[data-slot="dialog-content"]',
].join(', ')

const BACKDROPS = [
  '[data-slot="dialog-overlay"]',
  '[data-slot="sheet-overlay"]',
  '[data-slot="alert-dialog-overlay"]',
].join(', ')

/** The triggers opened in one screen or dialog at most (a long page repeats its kinds). */
const MAX_TRIGGERS = 40

/** One pixel of rounding. */
const SLACK = 1

/** The faults on the screen as it is now: sideways overflow, overlays outside, short backdrops. */
async function faults(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ overlays, backdrops, slack }) => {
      const found: string[] = []
      const frame = document.querySelector('[data-liro-phone-frame]')
      const screen =
        frame?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      const scope = frame ?? document.body
      const name = (element: Element) =>
        element.getAttribute('data-slot') ??
        element.getAttribute('role') ??
        element.tagName.toLowerCase()
      const shown = (element: Element) => {
        const box = element.getBoundingClientRect()
        return box.width > 2 && box.height > 2 && getComputedStyle(element).visibility === 'visible'
      }
      const size = (width: number, height: number) =>
        `${String(Math.round(width))} × ${String(Math.round(height))}`
      const scroller =
        frame === null
          ? document.scrollingElement
          : (frame.querySelector('[data-liro-phone-page]') ?? frame)
      if (scroller !== null && scroller.scrollWidth > scroller.clientWidth + slack) {
        found.push(
          `the page scrolls sideways: content ${String(scroller.scrollWidth)}px in ${String(scroller.clientWidth)}px`,
        )
      }
      const roots = [...scope.querySelectorAll(overlays)].filter(
        (element) => shown(element) && element.parentElement?.closest(overlays) == null,
      )
      for (const root of roots) {
        const what = name(root.firstElementChild ?? root)
        const box = root.getBoundingClientRect()
        if (
          box.left < screen.left - slack ||
          box.right > screen.right + slack ||
          box.top < screen.top - slack ||
          box.bottom > screen.bottom + slack
        ) {
          found.push(
            `${what} outside the screen: x ${String(Math.round(box.left - screen.left))}…${String(Math.round(box.right - screen.left))}, y ${String(Math.round(box.top - screen.top))}…${String(Math.round(box.bottom - screen.top))} on ${size(screen.width, screen.height)}`,
          )
        }
        for (const inner of [root, ...root.querySelectorAll('*')]) {
          const style = getComputedStyle(inner)
          if (style.overflowX === 'visible' || style.overflowX === 'clip') continue
          if (style.textOverflow === 'ellipsis' || !shown(inner)) continue
          if (inner.scrollWidth > inner.clientWidth + slack) {
            found.push(
              `${name(inner)} in ${what}: content ${String(inner.scrollWidth)}px in ${String(inner.clientWidth)}px`,
            )
          }
        }
      }
      for (const backdrop of scope.querySelectorAll(backdrops)) {
        if (!shown(backdrop)) continue
        const box = backdrop.getBoundingClientRect()
        if (
          box.left > screen.left + slack ||
          box.right < screen.right - slack ||
          box.top > screen.top + slack ||
          box.bottom < screen.bottom - slack
        ) {
          found.push(
            `${name(backdrop)} covers ${size(box.width, box.height)} of ${size(screen.width, screen.height)}`,
          )
        }
      }
      return found
    },
    { overlays: OVERLAYS, backdrops: BACKDROPS, slack: SLACK },
  )
}

/**
 * Marks the triggers inside the scope (the screen, or an open dialog marked
 * `data-liro-trigger-scope`) that may open an overlay, numbered from `first`, and returns their
 * locators. A trigger inside an open overlay belongs to that overlay's own pass.
 */
async function triggersIn(page: Page, inDialog: boolean, first: number): Promise<Locator[]> {
  const count = await page.evaluate(
    ({ overlays, inDialog, first, MAX_TRIGGERS }) => {
      const scope = inDialog
        ? document.querySelector('[data-liro-trigger-scope]')
        : (document.querySelector('[data-liro-phone-frame]') ??
          document.querySelector('#storybook-root'))
      if (scope === null) return 0
      let number = first
      // The same trigger repeated (an article's menu, a row's menu, a reference's preview) is
      // opened twice at most: the same name but for its numbers, and the same kind.
      const seen = new Map<string, number>()
      for (const element of scope.querySelectorAll(
        '[aria-haspopup]:not([aria-haspopup="false"]), [role="combobox"], button',
      )) {
        if (element.closest('[aria-hidden="true"], [inert]') !== null) continue
        if ((element as HTMLButtonElement).disabled) continue
        if (element.getAttribute('aria-disabled') === 'true') continue
        const box = element.getBoundingClientRect()
        if (box.width < 2 || box.height < 2) continue
        if (!inDialog && element.closest(overlays) !== null) continue
        // Of the same trigger in every row of a list or table (a row's menu), the first two.
        const row = element.closest('tr, li, [role="row"], [role="listitem"]')
        if (row?.parentElement != null) {
          const list = row.parentElement
          if ([...list.children].indexOf(row) > 1) continue
        }
        const popup = element.getAttribute('aria-haspopup')
        const label = (element.getAttribute('aria-label') ?? element.textContent).trim()
        const opens =
          element.getAttribute('role') === 'combobox' ||
          (popup !== null && popup !== 'false') ||
          label.endsWith('…')
        if (!opens) continue
        const kind = [
          element.tagName,
          element.getAttribute('role'),
          popup,
          element.getAttribute('data-slot'),
          label.replace(/\d+/g, '#'),
        ].join('|')
        const times = seen.get(kind) ?? 0
        seen.set(kind, times + 1)
        if (times >= 2 || number - first >= MAX_TRIGGERS) continue
        element.setAttribute('data-liro-trigger', String(number))
        number += 1
      }
      return number - first
    },
    { overlays: OVERLAYS, inDialog, first, MAX_TRIGGERS },
  )
  return Array.from({ length: count }, (_, index) =>
    page.locator(`[data-liro-trigger="${String(first + index)}"]`),
  )
}

/** Waits until the overlays' enter or leave animations have finished (at most 600ms). */
async function settled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
    await Promise.race([
      Promise.all(finite.map((animation) => animation.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 600)),
    ])
  })
}

/**
 * Opens a trigger: a press, and for a text field that is a combobox also ArrowDown. A trigger no
 * longer on the page (its dialog closed) is skipped at once rather than waited for.
 */
async function open(page: Page, trigger: Locator): Promise<boolean> {
  if ((await trigger.count()) === 0) return false
  try {
    await trigger.click({ timeout: 1_000 })
    if ((await trigger.evaluate((element) => element.tagName)) === 'INPUT') {
      await page.keyboard.press('ArrowDown')
    }
    await settled(page)
    return true
  } catch {
    return false
  }
}

/** Whether an overlay is open. */
async function overlayOpen(page: Page): Promise<boolean> {
  return page.evaluate(
    (overlays) =>
      [...document.querySelectorAll(overlays)].some(
        (element) => element.getBoundingClientRect().width > 2,
      ),
    OVERLAYS,
  )
}

/** Closes what is open with Escape; false when something stays open. */
async function closeAll(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await overlayOpen(page))) return true
    await page.keyboard.press('Escape')
    await settled(page)
  }
  return !(await overlayOpen(page))
}

/** Marks the topmost open dialog or sheet as the scope of a nested pass; false when none. */
async function markDialog(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    document.querySelectorAll('[data-liro-trigger-scope]').forEach((element) => {
      element.removeAttribute('data-liro-trigger-scope')
    })
    const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter(
      (element) => element.getBoundingClientRect().width > 2,
    )
    const last = dialogs.at(-1)
    if (last === undefined) return false
    last.setAttribute('data-liro-trigger-scope', '')
    return true
  })
}

/**
 * A trigger's name for the report; "(gone)" for one no longer on the page (its dialog closed), read
 * at once rather than waited for until the test's timeout.
 */
async function describe(trigger: Locator): Promise<string> {
  if ((await trigger.count()) === 0) return '(gone)'
  const text = await trigger.evaluate(
    (element) => (element.getAttribute('aria-label') ?? element.textContent).trim().slice(0, 40),
    undefined,
    { timeout: 1_000 },
  )
  return `"${text}"`
}

const entries = readEntries().filter(
  (entry: Entry) => entry.type === 'story' && PHONE_NAME.test(entry.name),
)

for (const entry of entries) {
  for (const mode of MODES) {
    test(`${entry.title} / ${entry.name} [${mode.theme}-${mode.direction}]`, async ({ page }) => {
      // An example screen has many triggers.
      test.setTimeout(120_000)
      await page.setViewportSize(WINDOW)
      const outcome = await openEntry(page, entry, mode)
      expect(outcome.status).toBe('success')
      const report: string[] = []
      // A fault of the story as drawn is reported once, not again with every trigger.
      const drawn = new Set(await faults(page))
      for (const fault of drawn) report.push(`as drawn: ${fault}`)
      const record = async (step: string) => {
        for (const fault of await faults(page)) {
          if (!drawn.has(fault)) report.push(`${step}: ${fault}`)
        }
      }
      /**
       * The triggers of the open dialog, each opened and closed again with one Escape. A trigger
       * that closes its own dialog ("Rename…" in a phone's actions sheet, which opens the rename
       * dialog in its place) ends the pass: the dialog's other triggers left the page with it.
       */
      const nested = async (step: string) => {
        if (!(await markDialog(page))) return
        const scope = page.locator('[data-liro-trigger-scope]')
        const scopeHandle = await scope.elementHandle()
        for (const trigger of await triggersIn(page, true, 10_000)) {
          const label = `${step} › ${await describe(trigger)}`
          if (!(await open(page, trigger))) continue
          await record(label)
          await page.keyboard.press('Escape')
          await settled(page)
          const closed = await scopeHandle.evaluate(
            (element) => !element.isConnected || element.getBoundingClientRect().width <= 2,
          )
          if (closed) {
            await closeAll(page)
            return
          }
          if (!(await markDialog(page))) return
        }
      }
      // A story drawn with something open is checked as drawn, with the triggers of a dialog
      // that stands open.
      if (await overlayOpen(page)) {
        await nested('as drawn')
        expect(report).toEqual([])
        return
      }
      const triggers = await triggersIn(page, false, 0)
      for (const trigger of triggers) {
        const label = await describe(trigger).catch(() => '(gone)')
        if (!(await open(page, trigger))) continue
        await record(label)
        await nested(label)
        if (!(await closeAll(page))) {
          // Something that Escape does not close (a dialog while it works): the story again,
          // with its triggers marked the same way.
          await openEntry(page, entry, mode)
          await triggersIn(page, false, 0)
        }
      }
      expect(report).toEqual([])
    })
  }
}

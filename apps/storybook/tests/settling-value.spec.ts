// Changing this file is a protected change (BUILD-PLAN rule 10).
import { expect, test } from '@playwright/test'
import { openEntry, type Mode } from './support'

// SettlingValue (BUILD-PLAN P2.8, "Done when"): while the user types and the value is recomputed
// slowly, the value never moves (no layout shift), and each settle is announced exactly once.

declare global {
  interface Window {
    __announcements?: string[]
  }
}

const STORY = {
  id: 'components-display-settlingvalue--slow-updates',
  title: 'Components/Display/SettlingValue',
  name: 'Slow updates and fast typing',
  type: 'story' as const,
}

const MODES: readonly Mode[] = [
  { theme: 'light', direction: 'ltr' },
  { theme: 'light', direction: 'rtl' },
]

for (const mode of MODES) {
  test(`SettlingValue: no layout shift, one announcement per settle [${mode.direction}]`, async ({
    page,
  }) => {
    // The page's clock is the test's (P5, the owner: deterministic, no race against the story's
    // delay). Installed before the story loads, it runs normally until it is paused below; then
    // time moves only when the test moves it, on every machine alike.
    await page.clock.install()
    const outcome = await openEntry(page, STORY, mode)
    expect(outcome.status).toBe('success')
    const value = page.locator('[data-slot="settling-value"]')
    const before = await value.boundingBox()
    expect(before).not.toBeNull()

    // Record every change of the polite live region.
    await page.evaluate(() => {
      const live = document.querySelector('[data-slot="settling-value"] [aria-live="polite"]')
      window.__announcements = []
      if (live === null) return
      new MutationObserver(() => {
        window.__announcements?.push(live.textContent)
      }).observe(live, { childList: true, characterData: true, subtree: true })
    })

    const now = await page.evaluate(() => Date.now())
    await page.clock.pauseAt(now + 1000)

    const input = page.getByRole('textbox', { name: 'Quantity' })
    for (const typed of ['12', '7']) {
      // Fast typing: every key starts a new computation; only the last one settles.
      await input.click()
      await input.press('ControlOrMeta+A')
      await input.pressSequentially(typed, { delay: 40 })
      await expect(value).toHaveAttribute('data-pending', 'true')
      // While pending (the answer comes 1.5 s after the last key, in the page's time), the value
      // does not move, and after 300ms the dot appears in its reserved slot.
      for (let sample = 0; sample < 5; sample += 1) {
        await page.clock.runFor(200)
        expect(await value.boundingBox()).toEqual(before)
        await expect(value).toHaveAttribute('data-pending', 'true')
      }
      await expect(page.locator('[data-slot="settling-dot"]')).toBeVisible()
      // Past the answer: settled, still in place.
      await page.clock.runFor(1000)
      await expect(value).not.toHaveAttribute('data-pending')
      expect(await value.boundingBox()).toEqual(before)
    }

    // One announcement per settle: 12 × 1,234.50 and 7 × 1,234.50, nothing in between.
    const announcements = await page.evaluate(() => window.__announcements ?? [])
    // format.money joins currency and amount with a no-break space.
    expect(announcements).toEqual(['EUR 14,814.00', 'EUR 8,641.50'])
  })
}

// Changing this file is a protected change (BUILD-PLAN rule 10).
import { expect, test, type Page } from '@playwright/test'
import { openEntry, type Mode } from './support'

// The map's marks follow the user's real input (P5.96a, the owner's review of P5.96): after a
// drill-down by mouse or touch no area is outlined, named or showing its tooltip until the pointer
// moves over one; leaving the map clears every mark; the focus ring and the keys' area show only
// when the focus came from the keyboard. Real input only (page.mouse, page.touchscreen,
// page.keyboard), as the owner uses it — never synthetic events.

const MODE: Mode = { theme: 'light', direction: 'ltr' }

const DRILL_DOWN = {
  id: 'charts-map-serbia--drill-down-story',
  title: 'Charts/Map/Serbia',
  name: 'Drill-down',
  type: 'story' as const,
}
const PHONE = {
  id: 'charts-map-serbia--phone-width',
  title: 'Charts/Map/Serbia',
  name: 'Phone width',
  type: 'story' as const,
}

interface Marks {
  labels: string[]
  tooltip: string | null
  outlined: number
  ring: string
}

/** What the map marks now: names shown on it, its tooltip, outlined areas and its focus ring. */
async function marks(page: Page): Promise<Marks> {
  return page.evaluate(() => {
    const map = document.querySelector('.liro-map')
    return {
      labels: [...document.querySelectorAll<HTMLElement>('[data-label-id]')]
        .filter((each) => getComputedStyle(each).visibility === 'visible')
        .map((each) => each.textContent),
      tooltip: document.querySelector('[data-slot="region-chart-tooltip"]')?.textContent ?? null,
      outlined: document.querySelectorAll('path.is-hovered, path.is-active').length,
      ring: map === null ? 'none' : getComputedStyle(map).outlineStyle,
    }
  })
}

const NO_MARKS: Marks = { labels: [], tooltip: null, outlined: 0, ring: 'none' }

/** The centre of the area whose tooltip starts with `name`, found by moving the mouse over each. */
async function areaPoint(page: Page, name: string): Promise<{ x: number; y: number }> {
  for (const path of await page.locator('path.liro-map-area').all()) {
    const box = await path.boundingBox()
    if (box === null) continue
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await page.mouse.move(point.x, point.y, { steps: 3 })
    await page.waitForTimeout(50)
    const tip = await page.evaluate(
      () => document.querySelector('[data-slot="region-chart-tooltip"]')?.textContent ?? null,
    )
    if (tip?.startsWith(name) === true) return point
  }
  throw new Error(`no area named ${name}`)
}

async function settled(page: Page) {
  await page.locator('[data-slot="region-chart"][data-ready]').waitFor()
  await page.waitForTimeout(300)
}

for (const name of ['Belgrade', 'Vojvodina']) {
  test(`Map: no mark left after a mouse drill-down into ${name}`, async ({ page }) => {
    const outcome = await openEntry(page, DRILL_DOWN, MODE)
    expect(outcome.status).toBe('success')
    await settled(page)
    const map = await page.locator('.liro-map').boundingBox()
    expect(map).not.toBeNull()
    if (map === null) return

    const at = await areaPoint(page, name)
    await page.mouse.click(at.x, at.y)
    await page.getByRole('button', { name: 'Back to regions' }).waitFor()
    await settled(page)
    // Chrome repeats a mouse move at the same point once the page changed under it: an area that
    // appears under a pointer that has not moved is not hovered.
    await page.mouse.move(at.x, at.y)
    await page.waitForTimeout(200)
    expect(await marks(page)).toEqual(NO_MARKS)

    // Off the map: nothing marked.
    await page.mouse.move(map.x + map.width + 40, map.y - 40, { steps: 6 })
    await page.waitForTimeout(200)
    expect(await marks(page)).toEqual(NO_MARKS)

    // A real move over an area marks it; leaving clears it again.
    await page.mouse.move(at.x + 3, at.y + 3, { steps: 10 })
    await expect.poll(async () => (await marks(page)).tooltip).not.toBeNull()
    await page.mouse.move(map.x + map.width + 40, map.y - 40, { steps: 6 })
    await expect.poll(() => marks(page)).toEqual(NO_MARKS)
  })
}

test.describe('on a phone', () => {
  test.use({ hasTouch: true, viewport: { width: 430, height: 900 } })

  test('Map: no mark left after a tap drill-down on a phone', async ({ page }) => {
    const outcome = await openEntry(page, PHONE, MODE)
    expect(outcome.status).toBe('success')
    await settled(page)
    const first = await page.locator('path.liro-map-area.leaflet-interactive').first().boundingBox()
    expect(first).not.toBeNull()
    if (first === null) return
    await page.touchscreen.tap(first.x + first.width / 2, first.y + first.height / 2)
    await page.getByRole('button', { name: 'Back to regions' }).waitFor()
    await settled(page)
    expect(await marks(page)).toEqual(NO_MARKS)
  })
})

test('Map: the keys show the focus ring and the area they reach', async ({ page }) => {
  const outcome = await openEntry(page, DRILL_DOWN, MODE)
  expect(outcome.status).toBe('success')
  await settled(page)
  const map = page.locator('.liro-map')
  for (let step = 0; step < 12; step += 1) {
    if (await map.evaluate((element) => element === document.activeElement)) break
    await page.keyboard.press('Tab')
  }
  await expect(map).toBeFocused()
  expect((await marks(page)).ring).toBe('solid')

  await page.keyboard.press('ArrowRight')
  await expect.poll(async () => (await marks(page)).outlined).toBe(1)
  expect((await marks(page)).tooltip).not.toBeNull()

  // Enter opens the level under it, as before; no area of the new level is marked.
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Back to regions' }).waitFor()
  await settled(page)
  expect((await marks(page)).outlined).toBe(0)
  expect((await marks(page)).tooltip).toBeNull()

  // Back in the map by the keys: the ring again, the arrows reach an area.
  await map.focus()
  expect((await marks(page)).ring).toBe('solid')
  await page.keyboard.press('ArrowRight')
  await expect.poll(async () => (await marks(page)).outlined).toBe(1)

  // A press of the pointer ends the keys' marks: no ring, no area reached.
  const box = await map.boundingBox()
  expect(box).not.toBeNull()
  if (box === null) return
  await page.mouse.click(box.x + 4, box.y + box.height - 4)
  await expect.poll(() => marks(page)).toEqual(NO_MARKS)
})

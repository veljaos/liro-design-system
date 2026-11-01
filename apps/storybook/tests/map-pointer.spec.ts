// Changing this file is a protected change (see AGENTS.md).
import { expect, test, type Page } from '@playwright/test'
import { openEntry, type Mode } from './support'

// The map's marks follow the user's real input: after a
// drill-down by mouse or touch no area is outlined, named or showing its tooltip until the pointer
// moves over one; leaving the map clears every mark; the focus ring and the keys' area show only
// when the focus came from the keyboard. Real input only (page.mouse, page.touchscreen,
// page.keyboard), never synthetic events.

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

/** A point inside the area whose tooltip starts with `name`, found by moving the mouse over each. */
async function areaPoint(page: Page, name: string): Promise<{ x: number; y: number }> {
  for (const id of await areaIds(page)) {
    const point = await insidePoint(page, id)
    if (point === null) continue
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

// One hover look for every area: every area of every
// level, hovered with the real mouse, shows the same look — its tooltip, its whole line drawn over
// its neighbours (the last area drawn), a solid line, and no name on the area.

interface AreaLook {
  id: string
  /** Why the area's look differs from every other's; null when it is the one look. */
  problem: string | null
}

/** A point inside the area's path that the pointer reaches (no neighbour drawn over it there). */
async function insidePoint(page: Page, id: string): Promise<{ x: number; y: number } | null> {
  return page.evaluate((areaId) => {
    const path = document.querySelector(`path[data-area-id="${CSS.escape(areaId)}"]`)
    if (path === null) return null
    const box = path.getBoundingClientRect()
    const steps = 24
    // The middle first, then a grid over the area's box.
    const tries: [number, number][] = [[box.x + box.width / 2, box.y + box.height / 2]]
    for (let row = 1; row < steps; row += 1) {
      for (let column = 1; column < steps; column += 1) {
        tries.push([box.x + (box.width * column) / steps, box.y + (box.height * row) / steps])
      }
    }
    // Whole pixels (a mouse event's), with the pixels round it in the area too: the pointer lands
    // on this area, never on a neighbour's edge.
    for (const [px, py] of tries) {
      const x = Math.round(px)
      const y = Math.round(py)
      const around = [
        [x, y],
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]
      if (around.every(([ax = 0, ay = 0]) => document.elementFromPoint(ax, ay) === path)) {
        return { x, y }
      }
    }
    return null
  }, id)
}

/** The look of the area under the pointer, checked against the one look. */
async function hoverLook(page: Page, id: string, tooltipSlot: string): Promise<AreaLook> {
  const at = await insidePoint(page, id)
  if (at === null) return { id, problem: 'no point of the area the pointer can reach' }
  await page.mouse.move(at.x, at.y, { steps: 8 })
  try {
    await page.locator(`[data-slot="${tooltipSlot}"]`).waitFor({ timeout: 2000 })
  } catch {
    return { id, problem: 'no tooltip' }
  }
  const problem = await page.evaluate((areaId) => {
    const path = document.querySelector(`path[data-area-id="${CSS.escape(areaId)}"]`)
    if (path === null) return 'gone'
    if (!path.classList.contains('is-hovered')) return 'not marked as hovered'
    const areas = [...(path.parentElement?.querySelectorAll(':scope > path.liro-map-area') ?? [])]
    if (areas[areas.length - 1] !== path) return 'not drawn over its neighbours'
    const line = getComputedStyle(path)
    if (line.strokeDasharray !== 'none') return `a broken line (${line.strokeDasharray})`
    if (parseFloat(line.strokeWidth) < 2) return `a thin line (${line.strokeWidth})`
    const names = [...document.querySelectorAll<HTMLElement>('[data-label-id]')].filter(
      (each) => getComputedStyle(each).visibility === 'visible',
    )
    if (names.length > 0) return `a name on the area (${names[0]?.textContent ?? ''})`
    return null
  }, id)
  return { id, problem }
}

async function areaIds(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('path.liro-map-area.leaflet-interactive')].map(
      (each) => each.getAttribute('data-area-id') ?? '',
    ),
  )
}

/** Every area on the map hovered one after another; returns the areas whose look differs. */
async function everyAreaLook(page: Page, tooltipSlot = 'region-chart-tooltip') {
  const ids = await areaIds(page)
  const looks: AreaLook[] = []
  for (const id of ids) looks.push(await hoverLook(page, id, tooltipSlot))
  return { count: ids.length, different: looks.filter((each) => each.problem !== null) }
}

const LEVELS = [
  { id: 'charts-map-serbia--by-region', name: 'By region', count: 5 },
  { id: 'charts-map-serbia--by-district', name: 'By district, with bubbles', count: 26 },
  { id: 'charts-map-serbia--by-municipality', name: 'By city and municipality', count: 146 },
]

for (const level of LEVELS) {
  test(`Map: one hover look for all ${String(level.count)} areas, ${level.name}`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    const outcome = await openEntry(
      page,
      { id: level.id, title: 'Charts/Map/Serbia', name: level.name, type: 'story' },
      MODE,
    )
    expect(outcome.status).toBe('success')
    await settled(page)
    const result = await everyAreaLook(page)
    expect(result.count).toBe(level.count)
    expect(result.different).toEqual([])
  })
}

/**
 * The city municipalities of the five divided cities, reached by real clicks down
 * the drill-down, every area of every level on the way hovered too.
 */
const CITIES = [
  { city: 'Belgrade', path: ['beograd'], count: 17 },
  { city: 'Niš', path: ['juzna-istocna-srbija', 'RS-20', 'nis'], count: 5 },
  { city: 'Požarevac', path: ['juzna-istocna-srbija', 'RS-11', 'pozarevac'], count: 2 },
  { city: 'Užice', path: ['sumadija-zapadna-srbija', 'RS-16', 'uzice'], count: 2 },
  { city: 'Vranje', path: ['juzna-istocna-srbija', 'RS-24', 'vranje'], count: 2 },
]

for (const city of CITIES) {
  test(`Map: one hover look on every level down to ${city.city}'s city municipalities`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    const outcome = await openEntry(page, DRILL_DOWN, MODE)
    expect(outcome.status).toBe('success')
    await settled(page)
    for (const id of city.path) {
      const level = await everyAreaLook(page)
      expect(level.different).toEqual([])
      const at = await insidePoint(page, id)
      expect(at).not.toBeNull()
      if (at === null) return
      await page.mouse.click(at.x, at.y)
      await expect.poll(async () => (await areaIds(page)).includes(id)).toBe(false)
      await settled(page)
    }
    const last = await everyAreaLook(page)
    expect(last.count).toBe(city.count)
    expect(last.different).toEqual([])
  })
}

test('Map: the keys show the same look as the pointer', async ({ page }) => {
  const outcome = await openEntry(
    page,
    {
      id: 'charts-map-serbia--by-region',
      title: 'Charts/Map/Serbia',
      name: 'By region',
      type: 'story',
    },
    MODE,
  )
  expect(outcome.status).toBe('success')
  await settled(page)
  const map = page.locator('.liro-map')
  await map.focus()
  for (let step = 0; step < 5; step += 1) {
    await page.keyboard.press('ArrowRight')
    const look = await page.evaluate(() => {
      const path = document.querySelector('path.liro-map-area.is-active')
      if (path === null) return 'nothing reached'
      const areas = [...(path.parentElement?.querySelectorAll(':scope > path.liro-map-area') ?? [])]
      if (areas[areas.length - 1] !== path) return 'not drawn over its neighbours'
      if (parseFloat(getComputedStyle(path).strokeWidth) < 2) return 'a thin line'
      if (document.querySelector('[data-slot="region-chart-tooltip"]') === null) return 'no tooltip'
      const names = [...document.querySelectorAll<HTMLElement>('[data-label-id]')].filter(
        (each) => getComputedStyle(each).visibility === 'visible',
      )
      return names.length > 0 ? 'a name on the area' : null
    })
    expect(look).toBeNull()
  }
})

test('AreaMap: one hover look for every area', async ({ page }) => {
  const outcome = await openEntry(
    page,
    {
      id: 'components-map-area-map--default',
      title: 'Components/Map/Area map',
      name: 'Default',
      type: 'story',
    },
    MODE,
  )
  expect(outcome.status).toBe('success')
  await page.waitForTimeout(500)
  const result = await everyAreaLook(page, 'area-map-tooltip')
  expect(result.count).toBeGreaterThan(0)
  expect(result.different).toEqual([])
})

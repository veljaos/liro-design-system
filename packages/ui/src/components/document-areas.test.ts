import { describe, expect, it } from 'vitest'
import {
  PAGE_SIZES,
  SIGNATURE_SIZE,
  boxAtPoint,
  firstFreeSpot,
  pdfBoxesOverlap,
  fitPageZoom,
  keepOnPage,
  nudgeBox,
  placementFits,
  toPdf,
  toTopLeft,
} from './document-areas'

const SIZES = [
  ['A4 portrait', PAGE_SIZES.a4],
  ['A4 landscape', PAGE_SIZES.a4Landscape],
  ['A5', PAGE_SIZES.a5],
  ['80 mm thermal roll', PAGE_SIZES.thermal80],
] as const

describe('the bottom-left convention', () => {
  it.each(SIZES)('turns a box to the top-left and back on %s', (_name, size) => {
    const box = { page: 1, x: 20, y: 30, ...SIGNATURE_SIZE }
    const shown = toTopLeft(box, size.height)
    expect(shown.y).toBeCloseTo(size.height - 30 - 48, 6)
    expect(shown.x).toBe(20)
    expect(toPdf(shown, size.height)).toEqual(box)
  })

  it.each(SIZES)(
    'places a box pressed at the page centre at the centre, in points, on %s',
    (_name, size) => {
      const box = boxAtPoint(1, { fx: 0.5, fy: 0.5 }, SIGNATURE_SIZE, size)
      expect(box.x).toBeCloseTo(size.width / 2 - 95, 2)
      expect(box.y).toBeCloseTo(size.height / 2 - 24, 2)
      expect(box.width).toBe(190)
      expect(box.height).toBe(48)
    },
  )

  it('reads a press near the top of the page as a box near the top (a large y)', () => {
    const page = PAGE_SIZES.a4
    const box = boxAtPoint(2, { fx: 0.5, fy: 0.05 }, SIGNATURE_SIZE, page)
    expect(box.page).toBe(2)
    expect(box.y + box.height).toBeGreaterThan(page.height - 70)
  })

  it('keeps a box pressed at a corner inside the page, at its edges', () => {
    const page = PAGE_SIZES.a5
    expect(boxAtPoint(1, { fx: 0, fy: 1 }, SIGNATURE_SIZE, page)).toMatchObject({ x: 0, y: 0 })
    const topRight = boxAtPoint(1, { fx: 1, fy: 0 }, SIGNATURE_SIZE, page)
    expect(topRight.x).toBeCloseTo(page.width - 190, 2)
    expect(topRight.y).toBeCloseTo(page.height - 48, 2)
  })

  it('fits a signature box on the narrow thermal roll (190 pt of 226.77)', () => {
    const roll = PAGE_SIZES.thermal80
    const box = keepOnPage({ page: 1, x: 100, y: 10, ...SIGNATURE_SIZE }, roll)
    expect(box.x).toBeCloseTo(roll.width - 190, 2)
  })
})

describe('moving by the keys', () => {
  const page = PAGE_SIZES.a4
  const box = { page: 1, x: 100, y: 100, ...SIGNATURE_SIZE }

  it('moves 5 points, 50 with Shift; up is towards the page top', () => {
    expect(nudgeBox(box, 'ArrowRight', false, page)?.x).toBe(105)
    expect(nudgeBox(box, 'ArrowLeft', true, page)?.x).toBe(50)
    expect(nudgeBox(box, 'ArrowUp', false, page)?.y).toBe(105)
    expect(nudgeBox(box, 'ArrowDown', false, page)?.y).toBe(95)
    expect(nudgeBox(box, 'Enter', false, page)).toBeNull()
  })

  it('stops at the page edge', () => {
    expect(nudgeBox({ ...box, x: 2 }, 'ArrowLeft', true, page)?.x).toBe(0)
  })
})

describe('where a box may stand', () => {
  const page = PAGE_SIZES.a4
  const area = { page: 1, x: 300, y: 80, ...SIGNATURE_SIZE }

  it('never over an area or another signer, never outside the page', () => {
    expect(placementFits({ page: 1, x: 40, y: 80, ...SIGNATURE_SIZE }, page, [area])).toBe(true)
    expect(placementFits({ page: 1, x: 200, y: 80, ...SIGNATURE_SIZE }, page, [area])).toBe(false)
    expect(placementFits({ page: 1, x: 500, y: 80, ...SIGNATURE_SIZE }, page, [])).toBe(false)
  })

  it('lets boxes on other pages and boxes that only touch stand', () => {
    expect(pdfBoxesOverlap(area, { ...area, page: 2 })).toBe(false)
    expect(pdfBoxesOverlap(area, { ...area, x: 490 })).toBe(false)
  })
})

describe('fitting a whole page', () => {
  it('keeps a wide page at the full width and shrinks a tall roll to show it whole', () => {
    expect(fitPageZoom(PAGE_SIZES.a4Landscape, { width: 800, height: 600 })).toBe(100)
    expect(fitPageZoom(PAGE_SIZES.a4, { width: 800, height: 600 })).toBe(53)
    expect(fitPageZoom(PAGE_SIZES.thermal80, { width: 800, height: 600 })).toBe(14)
  })
})

describe('placing without a pointer', () => {
  it('starts at the bottom-left margin and steps past what is taken', () => {
    const page = PAGE_SIZES.a4
    expect(firstFreeSpot(1, SIGNATURE_SIZE, page, [])).toEqual({
      page: 1,
      x: 36,
      y: 36,
      ...SIGNATURE_SIZE,
    })
    const taken = { page: 1, x: 36, y: 36, ...SIGNATURE_SIZE }
    const next = firstFreeSpot(1, SIGNATURE_SIZE, page, [taken])
    expect(next).not.toBeNull()
    expect(next !== null && placementFits(next, page, [taken])).toBe(true)
  })

  it('finds room on a thermal roll and says when a page is full', () => {
    expect(firstFreeSpot(1, SIGNATURE_SIZE, PAGE_SIZES.thermal80, [])?.x).toBeCloseTo(36, 2)
    const full = { page: 1, x: 0, y: 0, ...PAGE_SIZES.a5 }
    expect(firstFreeSpot(1, SIGNATURE_SIZE, PAGE_SIZES.a5, [full])).toBeNull()
  })
})

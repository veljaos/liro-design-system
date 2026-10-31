/*
 * PageViewer's logic, pure and tested (page-viewer.test.ts): where a region
 * stands on its page, which page holds it, the page within the document, and on which side of
 * the region its name fits. Positions are geometry in the page's own units, never amounts.
 */

/** One page of a document as an image the application made of it (a scan, a rendered PDF page). */
export interface ViewerPage {
  /** The image's address (the application's). */
  src: string
  /** The page's width and height in its own units (points, the scan's pixels): regions use them. */
  width: number
  height: number
  /** What the page shows, for assistive technology. Default: the page's number ("Page 1 of 2"). */
  alt?: string
}

/** A rectangle on a page, in the page's units from its top-left corner (never mirrored). */
export interface PageRegion {
  id: string
  /** The page it is on, from 1. */
  page: number
  x: number
  y: number
  width: number
  height: number
  /** Its name, shown beside it while it is highlighted ("Total"). From the application. */
  label?: string
}

/** A region's box as CSS percentages of its page. */
export interface RegionBox {
  left: string
  top: string
  width: string
  height: string
}

function percent(part: number, whole: number): string {
  return `${String(Math.round((part / whole) * 1_000_000) / 10_000)}%`
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value))
}

/**
 * The region's box on its page in percentages, cut to the page; null when the page has no size
 * or nothing of the region lies on it.
 */
export function regionBox(
  region: Pick<PageRegion, 'x' | 'y' | 'width' | 'height'>,
  page: Pick<ViewerPage, 'width' | 'height'>,
): RegionBox | null {
  if (!(page.width > 0) || !(page.height > 0)) return null
  const left = clamp(region.x, 0, page.width)
  const top = clamp(region.y, 0, page.height)
  const right = clamp(region.x + region.width, 0, page.width)
  const bottom = clamp(region.y + region.height, 0, page.height)
  if (right <= left || bottom <= top) return null
  return {
    left: percent(left, page.width),
    top: percent(top, page.height),
    width: percent(right - left, page.width),
    height: percent(bottom - top, page.height),
  }
}

/** The page (from 1) a region is on, or null when there is no such region. */
export function regionPage(
  regions: readonly Pick<PageRegion, 'id' | 'page'>[],
  id: string | null | undefined,
): number | null {
  if (id === null || id === undefined) return null
  return regions.find((region) => region.id === id)?.page ?? null
}

/** A page number within the document: from 1 to the page count (1 when there are no pages). */
export function clampPage(page: number, count: number): number {
  if (!Number.isFinite(page)) return 1
  return clamp(Math.trunc(page), 1, Math.max(1, count))
}

/**
 * Where a highlighted region's name stands: above it, or below it when the region starts within
 * the page's top tenth (there is no room above it inside the page).
 */
export function labelSide(
  region: Pick<PageRegion, 'y'>,
  page: Pick<ViewerPage, 'height'>,
): 'above' | 'below' {
  return region.y < page.height / 10 ? 'below' : 'above'
}

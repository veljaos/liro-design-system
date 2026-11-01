/*
 * The page conventions of a PDF renderer's output (liro-folio's, or any other source's): page
 * images with each page's size in PDF points, and the areas to sign or fill. Positions are PDF
 * points with the origin at the page's bottom-left corner and pages counted from 1. Pure and
 * tested (document-areas.test.ts); geometry only, never a document's amounts or dates.
 */

/** What an area asks for: a signature, a text, or a choice. */
export type DocumentAreaKind = 'signature' | 'text' | 'choice'

/** An area of a page, as the renderer returns it: PDF points, origin at the bottom-left. */
export interface DocumentArea {
  /** The area's name in the document ("buyer-signature"); unique within it. */
  name: string
  kind: DocumentAreaKind
  /** The page, from 1. */
  page: number
  x: number
  y: number
  width: number
  height: number
  /** What the user reads for it ("Buyer's signature"). Default: the name. */
  label?: string
}

/** A rectangle on a page in PDF points, origin at the bottom-left (what a placement returns). */
export interface PdfBox {
  page: number
  x: number
  y: number
  width: number
  height: number
}

/** A rectangle on a page from its top-left corner (how the screen draws it). */
export interface TopLeftBox {
  page: number
  x: number
  y: number
  width: number
  height: number
}

/** The default signature area: 190 × 48 points. */
export const SIGNATURE_SIZE = { width: 190, height: 48 } as const

/** A few page sizes in points, for stories and tests (the renderer always says the real size). */
export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  a4Landscape: { width: 841.89, height: 595.28 },
  a5: { width: 419.53, height: 595.28 },
  /** An 80 mm thermal roll, as long as its content. */
  thermal80: { width: 226.77, height: 1133.86 },
} as const

/** A box from the bottom-left convention to the screen's top-left one, on a page this tall. */
export function toTopLeft(box: PdfBox, pageHeight: number): TopLeftBox {
  return { ...box, y: pageHeight - box.y - box.height }
}

/** A box from the screen's top-left convention back to PDF points, origin at the bottom-left. */
export function toPdf(box: TopLeftBox, pageHeight: number): PdfBox {
  return { ...box, y: pageHeight - box.y - box.height }
}

/** Whether two boxes on the same page overlap (touching edges do not). */
export function pdfBoxesOverlap(a: PdfBox, b: PdfBox): boolean {
  return (
    a.page === b.page &&
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  )
}

/** A box moved inside its page (a box larger than the page stands at its corner). */
export function keepOnPage(box: PdfBox, page: { width: number; height: number }): PdfBox {
  const x = Math.min(Math.max(box.x, 0), Math.max(0, page.width - box.width))
  const y = Math.min(Math.max(box.y, 0), Math.max(0, page.height - box.height))
  return { ...box, x: round(x), y: round(y) }
}

/** Points rounded to two decimals, as a PDF writes them. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * A box of `size` centred on a point the user pressed, given in the screen's fractions of the
 * page (0 at the left and top, 1 at the right and bottom), kept inside the page.
 */
export function boxAtPoint(
  pageNumber: number,
  point: { fx: number; fy: number },
  size: { width: number; height: number },
  page: { width: number; height: number },
): PdfBox {
  const centreX = point.fx * page.width
  const centreFromBottom = (1 - point.fy) * page.height
  return keepOnPage(
    {
      page: pageNumber,
      x: centreX - size.width / 2,
      y: centreFromBottom - size.height / 2,
      width: size.width,
      height: size.height,
    },
    page,
  )
}

/** The arrow keys' step in points; Shift moves ten times as far. */
export const NUDGE_POINTS = 5

/** A box moved by an arrow key in the screen's directions (up is towards the page's top). */
export function nudgeBox(
  box: PdfBox,
  key: string,
  large: boolean,
  page: { width: number; height: number },
): PdfBox | null {
  const step = NUDGE_POINTS * (large ? 10 : 1)
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, step],
    ArrowDown: [0, -step],
  }
  const move = moves[key]
  if (move === undefined) return null
  return keepOnPage({ ...box, x: box.x + move[0], y: box.y + move[1] }, page)
}

/**
 * Whether a box can stand where it is: inside its page and over no other box (the page's areas
 * and the other signers' boxes). An area the box takes is not in `others`.
 */
export function placementFits(
  box: PdfBox,
  page: { width: number; height: number },
  others: readonly PdfBox[],
): boolean {
  const inside =
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= page.width + 0.005 &&
    box.y + box.height <= page.height + 0.005
  return inside && others.every((other) => !pdfBoxesOverlap(box, other))
}

/**
 * The zoom (percent of the viewer's width) at which a whole page fits the viewer: the width's
 * share for a wide page, less for a tall one (a thermal roll). Within 10–100.
 */
export function fitPageZoom(
  page: { width: number; height: number },
  viewer: { width: number; height: number },
): number {
  if (!(page.width > 0 && page.height > 0 && viewer.width > 0 && viewer.height > 0)) return 100
  const byHeight = ((viewer.height * (page.width / page.height)) / viewer.width) * 100
  return Math.max(10, Math.min(100, Math.floor(byHeight)))
}

/**
 * The first place a box of `size` fits on a page, for placing it without a pointer: from the
 * page's bottom-left margin rightwards, then upwards, in steps of the box's size. Null when the
 * page has no room.
 */
export function firstFreeSpot(
  pageNumber: number,
  size: { width: number; height: number },
  page: { width: number; height: number },
  others: readonly PdfBox[],
  margin = 36,
): PdfBox | null {
  const left = Math.min(margin, Math.max(0, page.width - size.width))
  const stepX = size.width / 2
  const stepY = size.height
  for (
    let y = Math.min(margin, Math.max(0, page.height - size.height));
    y + size.height <= page.height;
    y += stepY
  ) {
    for (let x = left; x + size.width <= page.width; x += stepX) {
      const box = { page: pageNumber, x: round(x), y: round(y), ...size }
      if (placementFits(box, page, others)) return box
    }
  }
  return null
}

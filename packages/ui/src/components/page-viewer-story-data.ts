/*
 * Story data of PageViewer and RecognizedField: neutral sample pages, grey blocks and lines on a
 * white sheet marked "Sample page", passed as `data:` URIs so a picture never waits for the network.
 * The blocks stand where the regions were read; they never draw a document's layout. Not part of
 * the package: nothing in src/index.ts imports this file.
 */
import type { PageRegion, ViewerPage } from './page-viewer-logic'

/** A4 in points, as the application's PDF pages are measured. */
export const A4 = { width: 595, height: 842 } as const

/** A grey block (x, y, width, height from the page's top-left corner, in points). */
type Block = readonly [number, number, number, number]

/** A neutral page with grey blocks; `blurred` stands for a photo out of focus. */
function neutralPageUri(blocks: readonly Block[], pageNumber: number, blurred = false): string {
  const { width, height } = A4
  const size = `width="${String(width)}" height="${String(height)}"`
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}" ${size}>`,
    blurred ? '<defs><filter id="blur"><feGaussianBlur stdDeviation="2.6"/></filter></defs>' : '',
    `<rect ${size} fill="white"/>`,
    `<g${blurred ? ' filter="url(#blur)"' : ''} fill="currentColor" fill-opacity="0.12">`,
    ...blocks.map(
      ([x, y, w, h]) =>
        `<rect x="${String(x)}" y="${String(y)}" width="${String(w)}" height="${String(h)}" rx="2"/>`,
    ),
    '</g>',
    `<text x="${String(width / 2)}" y="${String(height - 24)}" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="currentColor" fill-opacity="0.45" text-anchor="middle">Sample page ${String(pageNumber)}</text>`,
    '</svg>',
  ]
  return `data:image/svg+xml,${encodeURIComponent(parts.join(''))}`
}

/** Grey lines of text in a column: `count` lines from `y`, 12 points apart. */
function lines(x: number, y: number, width: number, count: number): Block[] {
  return Array.from({ length: count }, (_, index) => [
    x,
    y + index * 12,
    index % 3 === 2 ? width * 0.6 : width,
    6,
  ])
}

const PAGE_1_BLOCKS: Block[] = [
  [48, 60, 200, 14],
  [48, 84, 150, 6],
  [48, 98, 130, 6],
  [480, 84, 67, 8],
  [470, 100, 77, 6],
  [474, 114, 73, 6],
  ...lines(48, 160, 160, 3),
  ...lines(48, 270, 499, 5),
  ...lines(48, 400, 499, 12),
]

const PAGE_2_BLOCKS: Block[] = [
  [48, 64, 260, 6],
  [360, 114, 187, 6],
  [360, 134, 187, 6],
  [360, 160, 187, 10],
  ...lines(48, 224, 360, 2),
  ...lines(48, 300, 499, 10),
]

/** Two neutral pages; the regions below stand over their blocks. */
export const SAMPLE_PAGES: ViewerPage[] = [
  { src: neutralPageUri(PAGE_1_BLOCKS, 1), ...A4, alt: 'Sample page 1' },
  { src: neutralPageUri(PAGE_2_BLOCKS, 2), ...A4, alt: 'Sample page 2' },
]

/** Where the application read each value, in points from the page's top-left corner. */
export const SAMPLE_REGIONS: PageRegion[] = [
  { id: 'supplier', page: 1, x: 44, y: 56, width: 210, height: 54, label: 'Supplier' },
  { id: 'number', page: 1, x: 470, y: 81, width: 81, height: 15, label: 'Number' },
  { id: 'date', page: 1, x: 462, y: 96, width: 89, height: 14, label: 'Date' },
  { id: 'due', page: 1, x: 466, y: 110, width: 85, height: 14, label: 'Due date' },
  { id: 'lines', page: 1, x: 44, y: 262, width: 507, height: 70, label: 'Lines' },
  { id: 'vat', page: 2, x: 356, y: 129, width: 195, height: 15, label: 'VAT' },
  { id: 'total', page: 2, x: 356, y: 155, width: 195, height: 18, label: 'Total' },
]

/** The same page photographed out of focus: the application could not read it. */
export const BLURRED_PAGES: ViewerPage[] = [
  { src: neutralPageUri(PAGE_1_BLOCKS, 1, true), ...A4, alt: 'A photo out of focus' },
]

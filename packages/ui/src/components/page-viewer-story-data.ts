/*
 * Story data of PageViewer and RecognizedField (P5.31): fictitious. A document's pages are drawn
 * here as SVG and passed as `data:` URIs, so a picture never waits for the network and is the same
 * every time — as the application's own images of a scan or a PDF page would be. The ink is
 * `currentColor` (black in an image) on a white sheet; grey is black at a lower opacity. Not part
 * of the package: nothing in src/index.ts imports this file. The example screens (P5.31) draw
 * their invoice with `pageUri` too.
 */
import type { PageRegion, ViewerPage } from './page-viewer-logic'

/** A text on a drawn page: where its baseline starts, in page units, and how it looks. */
export interface PageText {
  x: number
  y: number
  text: string
  /** Font size in page units. Default 10. */
  size?: number
  bold?: boolean
  /** Grey (the ink at 55%). */
  grey?: boolean
  /** Where `x` is: the text's start (default), end or middle. */
  anchor?: 'start' | 'end' | 'middle'
}

/** A drawn page: its size, its texts, thin rules (x1, y1, x2, y2) and boxes (x, y, w, h). */
export interface DrawnPage {
  width: number
  height: number
  texts: readonly PageText[]
  rules?: readonly (readonly [number, number, number, number])[]
  boxes?: readonly (readonly [number, number, number, number])[]
  /** A photo out of focus: the whole page blurred, as an unreadable scan. */
  blurred?: boolean
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/** The page as an SVG `data:` URI. */
export function pageUri(page: DrawnPage): string {
  const size = `width="${String(page.width)}" height="${String(page.height)}"`
  const text = (each: PageText) =>
    `<text x="${String(each.x)}" y="${String(each.y)}" font-size="${String(each.size ?? 10)}"` +
    (each.bold === true ? ' font-weight="700"' : '') +
    (each.grey === true ? ' fill-opacity="0.55"' : '') +
    `${each.anchor === undefined || each.anchor === 'start' ? '' : ` text-anchor="${each.anchor}"`}>` +
    `${escape(each.text)}</text>`
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(page.width)} ${String(page.height)}" ${size}>`,
    page.blurred === true
      ? '<defs><filter id="blur"><feGaussianBlur stdDeviation="2.6"/></filter></defs>'
      : '',
    `<rect ${size} fill="white"/>`,
    `<g${page.blurred === true ? ' filter="url(#blur)"' : ''} font-family="Arial, Helvetica, sans-serif" fill="currentColor">`,
    ...page.texts.map(text),
    '<g stroke="currentColor" stroke-opacity="0.35" stroke-width="0.75" fill="none">',
    ...(page.rules ?? []).map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${String(x1)}" y1="${String(y1)}" x2="${String(x2)}" y2="${String(y2)}"/>`,
    ),
    ...(page.boxes ?? []).map(
      ([x, y, width, height]) =>
        `<rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="${String(height)}"/>`,
    ),
    '</g>',
    '</g>',
    '</svg>',
  ]
  return `data:image/svg+xml,${encodeURIComponent(parts.join(''))}`
}

/** A4 in points, as the application's PDF pages are measured. */
export const A4 = { width: 595, height: 842 } as const

// ── A fictitious supplier's invoice of two pages ─────────────────────────────────────────────

const PAGE_1: DrawnPage = {
  ...A4,
  texts: [
    { x: 48, y: 72, text: 'Northwind Supplies Ltd.', size: 16, bold: true },
    { x: 48, y: 90, text: '12 Harbour Road, Portsmouth', grey: true },
    { x: 48, y: 104, text: 'VAT no. GB 000 1234 56', grey: true },
    { x: 547, y: 72, text: 'INVOICE', size: 18, bold: true, anchor: 'end' },
    { x: 547, y: 92, text: 'No. INV-1001', size: 11, anchor: 'end' },
    { x: 547, y: 106, text: 'Date 06.10.2026', grey: true, anchor: 'end' },
    { x: 547, y: 120, text: 'Due 05.11.2026', grey: true, anchor: 'end' },
    { x: 48, y: 160, text: 'Bill to', grey: true },
    { x: 48, y: 176, text: 'Example Builders Ltd.', size: 11, bold: true },
    { x: 48, y: 190, text: '1 Market Street, Bristol', grey: true },
    { x: 48, y: 248, text: 'Description', grey: true },
    { x: 360, y: 248, text: 'Qty', grey: true, anchor: 'end' },
    { x: 450, y: 248, text: 'Price', grey: true, anchor: 'end' },
    { x: 547, y: 248, text: 'Amount', grey: true, anchor: 'end' },
    { x: 48, y: 276, text: 'Timber boards, 2 m' },
    { x: 360, y: 276, text: '40', anchor: 'end' },
    { x: 450, y: 276, text: '12.50', anchor: 'end' },
    { x: 547, y: 276, text: '500.00', anchor: 'end' },
    { x: 48, y: 300, text: 'Screws, box of 500' },
    { x: 360, y: 300, text: '6', anchor: 'end' },
    { x: 450, y: 300, text: '9.00', anchor: 'end' },
    { x: 547, y: 300, text: '54.00', anchor: 'end' },
    { x: 48, y: 324, text: 'Delivery' },
    { x: 360, y: 324, text: '1', anchor: 'end' },
    { x: 450, y: 324, text: '46.00', anchor: 'end' },
    { x: 547, y: 324, text: '46.00', anchor: 'end' },
    { x: 48, y: 800, text: 'Continued on page 2', grey: true },
  ],
  rules: [
    [48, 256, 547, 256],
    [48, 284, 547, 284],
    [48, 308, 547, 308],
    [48, 332, 547, 332],
  ],
}

const PAGE_2: DrawnPage = {
  ...A4,
  texts: [
    { x: 48, y: 72, text: 'Northwind Supplies Ltd. · Invoice INV-1001', grey: true },
    { x: 360, y: 120, text: 'Subtotal', grey: true },
    { x: 547, y: 120, text: '600.00', anchor: 'end' },
    { x: 360, y: 140, text: 'VAT 20%', grey: true },
    { x: 547, y: 140, text: '120.00', anchor: 'end' },
    { x: 360, y: 168, text: 'Total due', size: 12, bold: true },
    { x: 547, y: 168, text: 'GBP 720.00', size: 12, bold: true, anchor: 'end' },
    {
      x: 48,
      y: 230,
      text: 'Pay to: Northwind Supplies Ltd., account 00-00-00 12345678',
      grey: true,
    },
    { x: 48, y: 800, text: 'Page 2 of 2', grey: true },
  ],
  rules: [[360, 152, 547, 152]],
}

/** The invoice's two pages. */
export const SAMPLE_PAGES: ViewerPage[] = [
  { src: pageUri(PAGE_1), ...A4, alt: 'Invoice INV-1001, page 1: the supplier and the lines' },
  { src: pageUri(PAGE_2), ...A4, alt: 'Invoice INV-1001, page 2: the totals' },
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

/** The same invoice photographed out of focus: the application could not read it. */
export const BLURRED_PAGES: ViewerPage[] = [
  { src: pageUri({ ...PAGE_1, blurred: true }), ...A4, alt: 'A photo of an invoice, out of focus' },
]

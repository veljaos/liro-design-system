/*
 * Neutral sample pages for the stories and examples: grey blocks and lines on a white sheet, marked
 * "Sample page", in a PDF page's size in points. They stand in for a renderer's page images and
 * never draw a document's layout. Not part of the package.
 */
import type { DocumentArea } from './document-areas'
import { PAGE_SIZES } from './document-areas'
import type { ViewerPage } from './page-viewer-logic'

/** One neutral page as an SVG `data:` URI, in the page's size in points. */
export function samplePageUri(width: number, height: number, pageNumber: number): string {
  const margin = Math.min(36, width * 0.08)
  const inner = width - margin * 2
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}" width="${String(width)}" height="${String(height)}">`,
    `<rect width="${String(width)}" height="${String(height)}" fill="white"/>`,
    `<g fill="currentColor" fill-opacity="0.08">`,
    `<rect x="${String(margin)}" y="${String(margin)}" width="${String(inner * 0.45)}" height="18" rx="2"/>`,
    `<rect x="${String(margin)}" y="${String(margin + 28)}" width="${String(inner * 0.3)}" height="8" rx="2"/>`,
  ]
  // Grey lines down the page, in blocks, as text would stand.
  let y = margin + 64
  let line = 0
  while (y < height - margin - 40) {
    const short = line % 6 === 5
    parts.push(
      `<rect x="${String(margin)}" y="${String(y)}" width="${String(inner * (short ? 0.55 : 0.92 - (line % 3) * 0.05))}" height="6" rx="2"/>`,
    )
    y += short ? 22 : 12
    line += 1
  }
  parts.push('</g>')
  parts.push(
    `<text x="${String(width / 2)}" y="${String(height - margin / 2)}" font-family="Arial, Helvetica, sans-serif" font-size="${String(Math.max(7, Math.min(10, width / 40)))}" fill="currentColor" fill-opacity="0.45" text-anchor="middle">Sample page ${String(pageNumber)}</text>`,
    '</svg>',
  )
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parts.join(''))}`
}

/** Neutral pages of one size. */
export function samplePages(count: number, size: { width: number; height: number }): ViewerPage[] {
  return Array.from({ length: count }, (_, index) => ({
    src: samplePageUri(size.width, size.height, index + 1),
    width: size.width,
    height: size.height,
  }))
}

/** A two-page A4 sample with the areas a renderer returns: two signatures, a text, a choice. */
export const A4_SAMPLE = samplePages(2, PAGE_SIZES.a4)

export const A4_AREAS: DocumentArea[] = [
  { name: 'note', kind: 'text', page: 1, x: 36, y: 120, width: 300, height: 40, label: 'Note' },
  {
    name: 'delivery',
    kind: 'choice',
    page: 1,
    x: 360,
    y: 120,
    width: 160,
    height: 40,
    label: 'Delivery',
  },
  {
    name: 'seller-signature',
    kind: 'signature',
    page: 2,
    x: 56,
    y: 96,
    width: 190,
    height: 48,
    label: "Seller's signature",
  },
  {
    name: 'buyer-signature',
    kind: 'signature',
    page: 2,
    x: 349.28,
    y: 96,
    width: 190,
    height: 48,
    label: "Buyer's signature",
  },
]

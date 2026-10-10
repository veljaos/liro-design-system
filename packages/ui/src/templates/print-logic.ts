/*
 * The logic of PrintPage (P5.15), kept apart from the markup so it can be unit-tested (AGENTS.md
 * C7): the size of the sheet, the zoom that fits it to a narrow screen, and the CSS paged-media
 * rules a printed page needs (`@page` size and margins, and the page number in its bottom margin
 * box, written from the provider's message so the words and their order are the language's).
 */

/** The orientation of an A4 sheet. */
export type PrintOrientation = 'portrait' | 'landscape'

/**
 * The page margins as CSS lengths ("18mm"): `start` and `end` follow the direction (the binding
 * side of a right-to-left document is on the right).
 */
export interface PrintMargins {
  top?: string
  bottom?: string
  start?: string
  end?: string
}

/** The default margins: room at the bottom for the page number. */
export const PRINT_MARGINS: Required<PrintMargins> = {
  top: '16mm',
  bottom: '20mm',
  start: '18mm',
  end: '18mm',
}

/** A4 in millimetres. */
const A4 = { short: 210, long: 297 } as const

/** CSS pixels per millimetre (96 per inch, 25.4mm per inch). */
export const PX_PER_MM = 96 / 25.4

/** The sheet's width and height in millimetres. */
export function sheetSize(orientation: PrintOrientation): { width: number; height: number } {
  return orientation === 'portrait'
    ? { width: A4.short, height: A4.long }
    : { width: A4.long, height: A4.short }
}

/**
 * The zoom that fits the sheet into `available` CSS pixels on screen: never above 1 (a sheet is
 * never enlarged), never below 0.25, 1 while the width is not known yet.
 */
export function fitZoom(available: number, orientation: PrintOrientation): number {
  if (!Number.isFinite(available) || available <= 0) return 1
  const width = sheetSize(orientation).width * PX_PER_MM
  const zoom = Math.floor((available / width) * 1000) / 1000
  return Math.max(0.25, Math.min(1, zoom))
}

/** The margins with every side given, defaults filled in. */
export function resolvedMargins(margins: PrintMargins | undefined): Required<PrintMargins> {
  return { ...PRINT_MARGINS, ...margins }
}

/** A CSS string literal: quotes and backslashes escaped, line breaks as spaces. */
export function cssString(text: string): string {
  return `"${text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\n\r\f]+/g, ' ')}"`
}

const PAGE_MARK = '\uE000'
const PAGES_MARK = '\uE001'

/**
 * The `content` of the page-number margin box, from the provider's message: the message is
 * written with two marks for the numbers, and the text around them becomes CSS strings between
 * `counter(page)` and `counter(pages)` — "Page 1 of 3" is `"Page " counter(page) " of "
 * counter(pages)`; a language that names the total first keeps its order.
 */
export function pageNumberContent(message: (page: string, pages: string) => string): string {
  const text = message(PAGE_MARK, PAGES_MARK)
  const parts: string[] = []
  let literal = ''
  for (const character of text) {
    if (character === PAGE_MARK || character === PAGES_MARK) {
      if (literal !== '') parts.push(cssString(literal))
      literal = ''
      parts.push(character === PAGE_MARK ? 'counter(page)' : 'counter(pages)')
    } else {
      literal += character
    }
  }
  if (literal !== '') parts.push(cssString(literal))
  return parts.length === 0 ? '""' : parts.join(' ')
}

/** A name for a CSS named page, from a React id: letters, digits, underscores and hyphens only. */
export function pageName(id: string): string {
  return `liro-print-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export interface PageRulesOptions {
  /** The named page (`pageName`). */
  name: string
  orientation: PrintOrientation
  margins: Required<PrintMargins>
  direction: 'ltr' | 'rtl'
  /** The page-number content (`pageNumberContent`), or null for none. */
  pageNumber: string | null
}

/**
 * The `@page` rule of one PrintPage: A4 in its orientation, the margins (start and end turned
 * into the physical sides of the direction), and the page number at the end of the bottom margin,
 * in the secondary text colour and the extra-small size of the tokens. The page is a named page
 * (`page: <name>` on the sheet marked `data-print-page`, and on each of its ancestors), so two
 * PrintPages never share one rule.
 */
export function pageRules(options: PageRulesOptions): string {
  const { margins } = options
  const rtl = options.direction === 'rtl'
  const left = rtl ? margins.end : margins.start
  const right = rtl ? margins.start : margins.end
  const lines = [
    `@page ${options.name} {`,
    `  size: A4 ${options.orientation};`,
    `  margin: ${margins.top} ${right} ${margins.bottom} ${left};`,
  ]
  if (options.pageNumber !== null) {
    lines.push(
      `  @bottom-${rtl ? 'left' : 'right'} {`,
      `    content: ${options.pageNumber};`,
      `    direction: ${options.direction};`,
      '    font-family: var(--liro-font-sans);',
      '    font-size: var(--liro-font-size-xs);',
      '    color: var(--liro-text-secondary);',
      '    vertical-align: top;',
      '    padding-top: 4mm;',
      '  }',
    )
  }
  lines.push(
    '}',
    // Every ancestor of the sheet takes its page name too: content after the sheet (a portal, a
    // hidden wrapper) would otherwise start a page of its own, an empty last page.
    '@media print {',
    `  :has([data-print-page='${options.name}']) {`,
    `    page: ${options.name};`,
    '  }',
    '}',
  )
  return lines.join('\n')
}

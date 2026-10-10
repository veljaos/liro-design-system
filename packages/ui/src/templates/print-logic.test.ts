import { describe, expect, it } from 'vitest'
import { messagesEn } from '../provider/messages.en'
import {
  cssString,
  fitZoom,
  pageName,
  pageNumberContent,
  pageRules,
  PX_PER_MM,
  resolvedMargins,
  sheetSize,
} from './print-logic'

describe('sheetSize', () => {
  it('is A4 in either orientation', () => {
    expect(sheetSize('portrait')).toEqual({ width: 210, height: 297 })
    expect(sheetSize('landscape')).toEqual({ width: 297, height: 210 })
  })
})

describe('fitZoom', () => {
  const portrait = 210 * PX_PER_MM
  it('never enlarges the sheet', () => {
    expect(fitZoom(2000, 'portrait')).toBe(1)
    expect(fitZoom(portrait, 'portrait')).toBe(1)
  })
  it('scales the sheet down to the width, rounded down so it never overflows', () => {
    const zoom = fitZoom(358, 'portrait')
    expect(zoom).toBeLessThan(1)
    expect(zoom * portrait).toBeLessThanOrEqual(358)
    expect(fitZoom(358, 'landscape')).toBeLessThan(zoom)
  })
  it('keeps 1 while the width is unknown and never goes below a quarter', () => {
    expect(fitZoom(0, 'portrait')).toBe(1)
    expect(fitZoom(Number.NaN, 'portrait')).toBe(1)
    expect(fitZoom(40, 'portrait')).toBe(0.25)
  })
})

describe('cssString', () => {
  it('escapes quotes and backslashes and joins lines', () => {
    expect(cssString('Page')).toBe('"Page"')
    expect(cssString('a "b" \\ c')).toBe('"a \\"b\\" \\\\ c"')
    expect(cssString('one\ntwo')).toBe('"one two"')
  })
})

describe('pageNumberContent', () => {
  it('writes the English message around the counters', () => {
    expect(pageNumberContent(messagesEn['print.pageNumber'])).toBe(
      '"Page " counter(page) " of " counter(pages)',
    )
  })
  it('keeps the order of a language that names the total first', () => {
    expect(pageNumberContent((page, pages) => `${pages}ページ中${page}ページ`)).toBe(
      'counter(pages) "ページ中" counter(page) "ページ"',
    )
  })
  it('writes only the counters when the message has no words', () => {
    expect(pageNumberContent((page, pages) => `${page}/${pages}`)).toBe(
      'counter(page) "/" counter(pages)',
    )
    expect(pageNumberContent(() => '')).toBe('""')
  })
})

describe('pageName', () => {
  it('turns a React id into a CSS identifier', () => {
    expect(pageName(':r1:')).toBe('liro-print-r1')
    expect(pageName('«r2»')).toBe('liro-print-r2')
    expect(pageName('_r_3_')).toBe('liro-print-_r_3_')
  })
})

describe('pageRules', () => {
  const margins = resolvedMargins({ start: '25mm', end: '12mm' })
  it('fills in the default margins', () => {
    expect(resolvedMargins(undefined)).toEqual({
      top: '16mm',
      bottom: '20mm',
      start: '18mm',
      end: '18mm',
    })
  })
  it('names the size, the margins with start on the left, and the number at the bottom right', () => {
    const rules = pageRules({
      name: 'liro-print-r1',
      orientation: 'portrait',
      margins,
      direction: 'ltr',
      pageNumber: '"Page " counter(page)',
    })
    expect(rules).toContain('@page liro-print-r1 {')
    expect(rules).toContain('size: A4 portrait;')
    expect(rules).toContain('margin: 16mm 12mm 20mm 25mm;')
    expect(rules).toContain('@bottom-right {')
    expect(rules).toContain('content: "Page " counter(page);')
    expect(rules).toContain(":has([data-print-page='liro-print-r1']) {")
    expect(rules).toContain('page: liro-print-r1;')
  })
  it('mirrors the sides in right-to-left, and leaves the number out when asked', () => {
    const rules = pageRules({
      name: 'p',
      orientation: 'landscape',
      margins,
      direction: 'rtl',
      pageNumber: null,
    })
    expect(rules).toContain('size: A4 landscape;')
    expect(rules).toContain('margin: 16mm 25mm 20mm 12mm;')
    expect(rules).not.toContain('@bottom')
    expect(
      pageRules({
        name: 'p',
        orientation: 'portrait',
        margins,
        direction: 'rtl',
        pageNumber: '""',
      }),
    ).toContain('@bottom-left {')
  })
})

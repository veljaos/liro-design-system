import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat, deviceTimeZone, localDateTimeIn } from './format'
import { LiroProvider, useLiro } from './liro-provider'

/*
 * The provider's time zone (P5.8): instants with an offset are shown in it; local values without
 * an offset are shown as written; without a time zone everything behaves as before.
 */

const INSTANT = '2026-10-12T07:30:00Z'

describe('localDateTimeIn', () => {
  it('converts an instant into the local date and time of a zone', () => {
    expect(localDateTimeIn(INSTANT, 'Europe/Belgrade')).toBe('2026-10-12T09:30')
    expect(localDateTimeIn(INSTANT, 'Asia/Tokyo')).toBe('2026-10-12T16:30')
    expect(localDateTimeIn('2026-10-12T23:30:00+02:00', 'Asia/Tokyo')).toBe('2026-10-13T06:30')
    // Midnight is 00, never 24.
    expect(localDateTimeIn('2026-10-11T22:00:00Z', 'Europe/Belgrade')).toBe('2026-10-12T00:00')
  })

  it('keeps a local value without an offset as written', () => {
    expect(localDateTimeIn('2026-10-12T09:30', 'Asia/Tokyo')).toBe('2026-10-12T09:30')
    expect(localDateTimeIn('2026-10-12T09:30:15', 'Asia/Tokyo')).toBe('2026-10-12T09:30')
  })

  it('reads nothing else', () => {
    expect(localDateTimeIn('2026-10-12', 'Asia/Tokyo')).toBeNull()
    expect(localDateTimeIn('soon', 'Asia/Tokyo')).toBeNull()
  })
})

describe('format with a time zone', () => {
  it('shows an instant in the zone: Belgrade and Tokyo differ', () => {
    const belgrade = createFormat('sr-Latn-RS', {}, 'Europe/Belgrade')
    const tokyo = createFormat('sr-Latn-RS', {}, 'Asia/Tokyo')
    expect(belgrade.dateTime(INSTANT)).toBe('12.10.2026. 09:30')
    expect(tokyo.dateTime(INSTANT)).toBe('12.10.2026. 16:30')
    expect(belgrade.time(INSTANT)).toBe('09:30')
    expect(tokyo.time(INSTANT)).toBe('16:30')
    expect(tokyo.time('2026-10-12T09:30:00+02:00')).toBe('16:30')
  })

  it('shows a local date and time without an offset as written, in any zone', () => {
    for (const zone of ['Europe/Belgrade', 'Asia/Tokyo', undefined]) {
      const format = createFormat('sr-Latn-RS', {}, zone)
      expect(format.dateTime('2026-10-12T09:30')).toBe('12.10.2026. 09:30')
      expect(format.time('2026-10-12T09:30')).toBe('09:30')
    }
  })

  it('without a zone keeps the clock of an instant as written (backward compatible)', () => {
    expect(createFormat('sr-Latn-RS').time('2026-10-06T09:42:00+02:00')).toBe('09:42')
  })
})

function ShowZone() {
  const { timeZone, format } = useLiro()
  return (
    <span>
      {timeZone} {format.time(INSTANT)}
    </span>
  )
}

describe('LiroProvider timeZone', () => {
  it('carries the zone and formats instants in it', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="en" timeZone="Asia/Tokyo">
        <ShowZone />
      </LiroProvider>,
    )
    expect(html).toContain('Asia/Tokyo')
    expect(html).toMatch(/04:30\sPM/)
  })

  it("defaults to the browser's zone", () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="en">
        <ShowZone />
      </LiroProvider>,
    )
    expect(html).toContain(deviceTimeZone())
  })
})

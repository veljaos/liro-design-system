import { renderToStaticMarkup } from 'react-dom/server'
import decodeQR from 'qr/decode.js'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { QrCode, qrModules, qrPath } from './qr-code'

/** The modules as an RGBA image, 4px a module with a quiet zone, for the decoder. */
function image(modules: boolean[][]) {
  const scale = 4
  const border = 4
  const side = (modules.length + border * 2) * scale
  const data = new Uint8Array(side * side * 4).fill(255)
  modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (!dark) return
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const at = (((y + border) * scale + dy) * side + (x + border) * scale + dx) * 4
          data[at] = 0
          data[at + 1] = 0
          data[at + 2] = 0
        }
      }
    })
  })
  return { width: side, height: side, data }
}

describe('qrModules', () => {
  it('encodes a UTF-8 text that a decoder reads back', () => {
    const text =
      'K:PR|V:01|C:1|R:845000000040484987|N:Beton Mix d.o.o., Novi Sad — Đurđa|I:RSD294000,00|SF:221'
    const modules = qrModules(text)
    expect(modules).not.toBeNull()
    expect(decodeQR(image(modules ?? []))).toBe(text)
  })

  it('has no code for a text longer than any QR code holds', () => {
    expect(qrModules('x'.repeat(8000))).toBeNull()
  })
})

describe('qrPath', () => {
  it('joins each row’s dark runs and moves them by the quiet zone', () => {
    expect(
      qrPath(
        [
          [true, true, false, true],
          [false, false, false, false],
        ],
        4,
      ),
    ).toBe('M4 4h2v1h-2zM7 4h1v1h-1z')
  })
})

describe('QrCode', () => {
  it('is a named image on the light surface, or the message when the text cannot fit', () => {
    const shown = renderToStaticMarkup(
      <LiroProvider locale="en">
        <QrCode value="https://example.com" label="Link to the record" />
      </LiroProvider>,
    )
    expect(shown).toContain('data-liro-theme="light"')
    expect(shown).toContain('role="img" aria-label="Link to the record"')
    expect(shown).toContain('<path d="M4 4h7v1h-7z')
    const tooLong = renderToStaticMarkup(
      <LiroProvider locale="en">
        <QrCode value={'x'.repeat(8000)} label="Too long" />
      </LiroProvider>,
    )
    expect(tooLong).toContain('The text is too long for a QR code.')
  })
})

// The Liro brand files (P3.7): every expected file is there, every SVG is clean (a viewBox, no
// live text, fonts, embedded images or scripts), and the raster icons have their sizes.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { describe, it } from 'vitest'

const brand = new URL('../brand/', import.meta.url)
const read = (name: string) => readFileSync(new URL(name, brand))

const SVGS = [
  'icon.svg',
  'icon-light.svg',
  'icon-dark.svg',
  'icon-dark-white.svg',
  'icon-mono-black.svg',
  'icon-mono-white.svg',
  'wordmark-light.svg',
  'wordmark-neutral.svg',
  'wordmark-mono-black.svg',
  'wordmark-mono-white.svg',
  'web/favicon.svg',
]

/** Width and height of a PNG, from its IHDR chunk. */
function pngSize(bytes: Buffer): [number, number] {
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG')
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

/** The image sizes inside an ICO file (0 in the directory means 256). */
function icoSizes(bytes: Buffer): number[] {
  assert.equal(bytes.readUInt16LE(2), 1, 'an icon file')
  const count = bytes.readUInt16LE(4)
  return Array.from({ length: count }, (_, index) => bytes[6 + index * 16] ?? -1).map((size) =>
    size === 0 ? 256 : size,
  )
}

describe('brand', () => {
  it('has exactly the expected files', () => {
    const files = [
      ...readdirSync(brand).filter((name) => name !== 'web'),
      ...readdirSync(new URL('web/', brand)).map((name) => `web/${name}`),
    ].sort()
    assert.deepEqual(
      files,
      [
        ...SVGS,
        ...['light', 'neutral', 'mono-black', 'mono-white'].flatMap((variant) => [
          `wordmark-${variant}-64.png`,
          `wordmark-${variant}-128.png`,
        ]),
        'web/apple-touch-icon.png',
        'web/favicon.ico',
        'web/icon-192.png',
        'web/icon-512.png',
        'web/icon-maskable-512.png',
        'web/site.webmanifest',
      ].sort(),
    )
  })

  it.each(SVGS)('%s is clean: a viewBox, outlines only', (name) => {
    const svg = read(name).toString('utf8')
    assert.match(svg, /^<svg [^>]*viewBox="[-\d. ]+"/)
    for (const forbidden of [/<text/, /<image/, /<script/, /@font-face/, /font-family/, /data:/]) {
      assert.doesNotMatch(svg, forbidden)
    }
    assert.match(svg, /<title>Liro<\/title>/)
  })

  it('has a tab favicon without a tile: brand-blue dots, lighter in a dark browser (P4.0)', () => {
    const svg = read('web/favicon.svg').toString('utf8')
    assert.doesNotMatch(svg, /<rect/)
    assert.match(svg, /path\{fill:#0078D4\}/)
    assert.match(svg, /@media \(prefers-color-scheme:dark\)\{path\{fill:#3EACEB\}\}/)
    // The installed-app icons keep the full blue tile.
    assert.match(
      read('icon.svg').toString('utf8'),
      /<rect width="512" height="512" fill="#0078D4"\/>/,
    )
  })

  it('has the web icons in their sizes', () => {
    assert.deepEqual(pngSize(read('web/apple-touch-icon.png')), [180, 180])
    assert.deepEqual(pngSize(read('web/icon-192.png')), [192, 192])
    assert.deepEqual(pngSize(read('web/icon-512.png')), [512, 512])
    assert.deepEqual(pngSize(read('web/icon-maskable-512.png')), [512, 512])
    assert.deepEqual(
      icoSizes(read('web/favicon.ico')).sort((a, b) => a - b),
      [16, 32, 48],
    )
  })

  it('names the icons the manifest lists', () => {
    const manifest = JSON.parse(read('web/site.webmanifest').toString('utf8')) as {
      icons: { src: string; purpose?: string }[]
    }
    for (const icon of manifest.icons) {
      assert.ok(read(`web/${icon.src.replace(/^\//, '')}`).length > 0, icon.src)
    }
    assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'))
  })
})

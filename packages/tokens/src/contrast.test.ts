import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { contrastChecks, contrastFailures, contrastRatio, toRgb } from './contrast.ts'
import { FAMILIES, FAMILY_FILLED_SHADE, RAMPS, resolveColor } from './tokens.ts'

const WHITE = [255, 255, 255] as const
const BLACK = [0, 0, 0] as const

describe('contrast is measured', () => {
  it('computes WCAG ratios', () => {
    assert.equal(contrastRatio(WHITE, BLACK), 21)
    assert.equal(contrastRatio(WHITE, WHITE), 1)
    assert.equal(contrastRatio(toRgb('#0078D4', BLACK), WHITE).toFixed(2), '4.53')
  })

  it('composites a translucent colour over the surface under it (Appendix B.6)', () => {
    assert.deepEqual(toRgb('rgba(0,0,0,0.5)', WHITE), [128, 128, 128])
    assert.deepEqual(toRgb('rgba(255,255,255,0.05)', [27, 27, 27]), [38, 38, 38])
  })

  it('finds a pair below 4.5:1: white on orange 6 and gray 6 (why A.6 fills them with 7)', () => {
    assert.ok(contrastRatio(WHITE, toRgb(RAMPS.orange[6], BLACK)) < 4.5)
    assert.ok(contrastRatio(WHITE, toRgb(RAMPS.gray[6], BLACK)) < 4.5)
  })

  it('passes every family and tone pair, in both themes, on every surface', () => {
    const checks = contrastChecks()
    assert.ok(checks.length > 400)
    assert.deepEqual(contrastFailures(), [])
  })
})

describe('families equal Appendix A.6', () => {
  const plan = readFileSync(new URL('../../../BUILD-PLAN.md', import.meta.url), 'utf8')
  const start = plan.indexOf('### A.6')
  const table = plan
    .slice(start, plan.indexOf('Gray and orange use shade 7', start))
    .split('\n')
    .filter((line) => /^\| [a-z]+ \| [a-z]+ \| \**\d\** \|/.test(line))
    .map((line) => line.split('|').map((cell) => cell.trim().replaceAll('*', '')))

  it('fills each family with the listed colour and shade', () => {
    const expected = Object.fromEntries(
      table.map((cells): [string, string] => [
        cells[1] ?? '',
        `${cells[2] ?? ''}${cells[3] ?? ''}`,
      ]),
    )
    assert.deepEqual(FAMILY_FILLED_SHADE, expected)
    for (const [family, parts] of Object.entries(FAMILIES)) {
      assert.equal(parts.solid[0], FAMILY_FILLED_SHADE[family as keyof typeof FAMILIES])
      assert.equal(parts.solid[1], parts.solid[0], `${family} fills the same in both themes`)
    }
  })

  it('goes one and two shades darker on hover and press', () => {
    for (const parts of Object.values(FAMILIES)) {
      const step = (reference: string) => Number(reference.slice(-1))
      assert.equal(step(parts.solidHover[0]), step(parts.solid[0]) + 1)
      assert.equal(step(parts.solidActive[0]), step(parts.solid[0]) + 2)
    }
  })

  it('uses brand.subtle for the primary tint and text.brand for its text', () => {
    assert.deepEqual(FAMILIES.primary.subtle, ['blue0', 'rgba(0,120,212,0.16)'])
    assert.deepEqual(FAMILIES.primary.subtleHover, ['blue1', 'rgba(0,120,212,0.26)'])
    assert.deepEqual(FAMILIES.primary.fg, ['blue7', 'blue4'])
    assert.ok(!('subtle' in FAMILIES.neutral))
    assert.equal(resolveColor(FAMILIES.neutral.fg[0]), RAMPS.gray[9])
  })
})

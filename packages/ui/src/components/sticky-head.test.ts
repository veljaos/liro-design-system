import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { headTrack, STICKY_HEAD, startCover } from './sticky-head'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

/** The uses of `name` as code (not in a comment's backticks), less its import. */
function codeUses(text: string, name: string): number {
  const all = text.match(new RegExp(`(?<!\`)\\b${name}\\b(?!\`)`, 'g'))?.length ?? 0
  return all - 1
}

describe('headTrack (P5.90 item 8)', () => {
  it('starts inside the region’s top border and moves through its inner height less the header', () => {
    expect(headTrack(1, 800, 40)).toEqual({ start: 1, room: 760 })
    expect(headTrack(0, 800, 40)).toEqual({ start: 0, room: 760 })
  })

  it('never moves when the header fills the region, nor before anything is measured', () => {
    expect(headTrack(1, 40, 40)).toEqual({ start: 1, room: 0 })
    expect(headTrack(0, 0, 0)).toEqual({ start: 0, room: 0 })
    expect(headTrack(-1, 20, 40)).toEqual({ start: 0, room: 0 })
  })
})

describe('the sticky header is pure CSS (P5.90 item 8)', () => {
  it('moves the header group with a scroll-driven animation on the region’s view timeline', () => {
    const css = source('../styles.css')
    expect(STICKY_HEAD).toContain('liro-sticky-head')
    expect(STICKY_HEAD).toContain('sticky top-0')
    expect(css).toContain('@supports (animation-timeline: view())')
    expect(css).toContain('view-timeline-name: --liro-sticky-region')
    expect(css).toContain('view-timeline-inset: var(--liro-shell-top, 0px) 0px')
    expect(css).toContain('animation-timeline: --liro-sticky-region')
    expect(css).toContain('animation-range-start: exit-crossing var(--liro-head-start, 0px)')
    for (const name of ['--liro-head-start', '--liro-head-room'])
      expect(css).toContain(`var(${name}`)
  })

  it('runs no script on scroll: no scroll listener, no per-frame update, no shift variable', () => {
    const hook = source('./sticky-head.ts')
    expect(hook).not.toMatch(/addEventListener\(\s*['"]scroll/)
    expect(hook).not.toContain('requestAnimationFrame')
    expect(STICKY_HEAD).not.toContain('translate')
    expect(source('../gantt/gantt.css')).not.toContain('--liro-head-shift')
  })

  it('puts the sticky band on the header group of every grid, never on its cells', () => {
    for (const file of [
      './data-table.tsx',
      './editable-grid.tsx',
      './tree-table.tsx',
      './attendance-grid.tsx',
      './shift-planner.tsx',
      './resource-schedule.tsx',
      './calendar-view.tsx',
      '../pivot/pivot-grid.tsx',
      '../templates/statutory-form-page.tsx',
      '../gantt/gantt.tsx',
    ]) {
      const text = source(file)
      const uses = codeUses(text, 'STICKY_HEAD')
      const groups = text.split('data-sticky-head=""').length - 1
      expect(uses, file).toBeGreaterThan(0)
      expect(uses, file).toBe(groups)
    }
  })
})

describe('startCover (P5.28 item 4)', () => {
  it('is 0 without a sticky first column', () => {
    expect(startCover(10, [], false)).toBe(0)
  })

  it('runs from the start edge to the farthest marked cell, left to right', () => {
    expect(startCover(10, [{ left: 10, right: 58 }], false)).toBe(48)
    expect(
      startCover(
        10,
        [
          { left: 10, right: 58 },
          { left: 58, right: 250 },
        ],
        false,
      ),
    ).toBe(240)
  })

  it('runs leftwards from the right edge in right to left', () => {
    expect(
      startCover(
        800,
        [
          { left: 752, right: 800 },
          { left: 560, right: 752 },
        ],
        true,
      ),
    ).toBe(240)
  })
})

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Font weights come only from the type utilities of the theme: regular, medium,
 * semibold and bold. The theme removes Tailwind's own weight names (`--font-weight-*: initial`),
 * so a class such as `font-normal` produces no CSS at all and the element silently keeps the
 * weight it inherits (a table header stays bold).
 */

const ROOTS = [
  new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  new URL('../../../apps/storybook/src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe('font weights', () => {
  it('are only the theme’s: regular, medium, semibold, bold', () => {
    const unknown = /\bfont-(thin|extralight|light|normal|extrabold|black)\b/
    const offenders = ROOTS.flatMap((root) =>
      files(root)
        .filter((path) => unknown.test(readFileSync(path, 'utf8')))
        .map((path) => relative(root, path).replaceAll('\\', '/')),
    )
    expect(offenders).toEqual([])
  })
})

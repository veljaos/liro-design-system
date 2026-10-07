import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Where the status `solid` colours may appear (P4.7c, owner; Appendix B.6): a solid is for bars,
 * dots and icon squares, never text — so no `text-status-*-solid`. The warning solid (orange 6)
 * reaches only 2.84:1 on the light page background, so it is used only where it stands on a
 * raised surface: the status page's square (on surface.raised) and the charts' marks (in their
 * raised card). A new use must be added here, after checking its background.
 */

const SOURCE = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [path] : []
  })
}

const WARNING_SOLID_ALLOWED = ['templates/status-page.tsx', 'charts/shared.ts']

describe('status solid colours', () => {
  const sources = files(SOURCE).map((path) => ({
    path: relative(SOURCE, path).replaceAll('\\', '/'),
    text: readFileSync(path, 'utf8'),
  }))

  it('never colour text', () => {
    const offenders = sources.filter((file) => /text-status-[a-z]+-solid/.test(file.text))
    expect(offenders.map((file) => file.path)).toEqual([])
  })

  it('use the warning solid only where it stands on a raised surface', () => {
    const users = sources
      .filter((file) => file.text.includes('status-warning-solid'))
      .map((file) => file.path)
      .sort()
    expect(users).toEqual([...WARNING_SOLID_ALLOWED].sort())
  })
})

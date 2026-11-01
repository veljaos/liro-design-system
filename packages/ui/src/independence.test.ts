// @veljaos/ui stands alone: no import of liro-folio, Liro Bridge or liro-core, and no network call
// of its own (props in, callbacks out). Its own lazy imports (languages, boundaries) are packages
// and files it ships.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SOURCE = fileURLToPath(new URL('.', import.meta.url))

/** The package's shipped source files: no stories, tests or story data. */
function shippedFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return shippedFiles(path)
    const shipped =
      /\.(ts|tsx)$/.test(name) &&
      !/\.(stories|test)\.tsx?$/.test(name) &&
      !/story-data|story-helpers|story-frames|story-brand/.test(name)
    return shipped ? [path] : []
  })
}

const FORBIDDEN_IMPORT =
  /from\s+['"](?:@?liro[-/]?(?:folio|bridge|core)[^'"]*)['"]|import\(\s*['"]@?liro[-/]?(?:folio|bridge|core)/i
const NETWORK = /\b(?:fetch|sendBeacon)\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\b/

describe('independence', () => {
  const files = shippedFiles(SOURCE)

  it('reads the package source', () => {
    expect(files.length).toBeGreaterThan(200)
  })

  it('imports nothing from liro-folio, Liro Bridge or liro-core', () => {
    const found = files.filter((file) => FORBIDDEN_IMPORT.test(readFileSync(file, 'utf8')))
    expect(found.map((file) => relative(SOURCE, file))).toEqual([])
  })

  it('makes no network call of its own', () => {
    const found = files.filter((file) => NETWORK.test(readFileSync(file, 'utf8')))
    expect(found.map((file) => relative(SOURCE, file))).toEqual([])
  })

  it('would find such an import or call', () => {
    expect(FORBIDDEN_IMPORT.test("import { render } from 'liro-folio'")).toBe(true)
    expect(FORBIDDEN_IMPORT.test("import { client } from '@liro/core'")).toBe(true)
    expect(FORBIDDEN_IMPORT.test("import x from '@liro/bridge-sdk'")).toBe(true)
    expect(NETWORK.test("await fetch('/api/pdf')")).toBe(true)
    expect(NETWORK.test('new WebSocket(url)')).toBe(true)
  })
})

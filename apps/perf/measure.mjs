// The performance budget: the JavaScript and CSS each example page loads, gzipped, against
// budget.json. Run after `vite build` (`pnpm perf`); it fails when a page grows above its budget.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const dist = new URL('dist/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('.vite/manifest.json', dist), 'utf8'))
const budget = JSON.parse(readFileSync(new URL('budget.json', import.meta.url), 'utf8'))

/** The files a page loads at start: its entry and every static import, with their CSS. */
function pageFiles(key, seen = new Set()) {
  const chunk = manifest[key]
  if (chunk === undefined || seen.has(key)) return { js: [], css: [] }
  seen.add(key)
  const files = { js: [chunk.file], css: [...(chunk.css ?? [])] }
  for (const imported of chunk.imports ?? []) {
    const more = pageFiles(imported, seen)
    files.js.push(...more.js)
    files.css.push(...more.css)
  }
  return files
}

const gzipped = (files) =>
  files.reduce(
    (sum, file) => sum + gzipSync(readFileSync(new URL(file, dist)), { level: 9 }).length,
    0,
  )
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10

let failed = false
for (const [page, limits] of Object.entries(budget.pages)) {
  const files = pageFiles(`${page}.html`)
  const sizes = { js: kb(gzipped(files.js)), css: kb(gzipped([...new Set(files.css)])) }
  for (const kind of ['js', 'css']) {
    const over = sizes[kind] > limits[kind]
    failed ||= over
    console.log(
      `${page} ${kind}: ${sizes[kind]} KB gzip (budget ${limits[kind]} KB)${over ? ' — over budget' : ''}`,
    )
  }
}
if (failed) process.exit(1)

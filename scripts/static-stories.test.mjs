import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { storiesOf, violations } from './static-stories.mjs'

const folder = mkdtempSync(join(tmpdir(), 'static-stories-'))
after(() => {
  rmSync(folder, { recursive: true, force: true })
})

/**
 * Writes a story file into the temporary folder and returns its stories.
 * @param {string} name
 * @param {string} source
 */
function stories(name, source) {
  const file = join(folder, `${name}.stories.tsx`)
  writeFileSync(file, source)
  return Object.fromEntries(storiesOf(file).map((story) => [story.name, story]))
}

describe('storiesOf', () => {
  it('finds a story that clicks, types, focuses or scrolls', () => {
    const found = stories(
      'direct',
      `export default { title: 'X' }
export const Static = { play: async ({ canvasElement }) => { await expect(canvasElement).toBeVisible() } }
export const Clicks = { play: async () => { await userEvent.click(button) } }
export const Focuses = { play: async () => { input.focus() } }
export const Scrolls = { play: async () => { pane.scrollTop = 40 } }
export const Fires = { play: async () => { fireEvent.change(input, {}) } }
export const Tagged = { tags: ['interaction'], play: async () => { await userEvent.keyboard('a') } }
`,
    )
    assert.equal(found.Static?.acts, false)
    assert.equal(found.Clicks?.acts, true)
    assert.equal(found.Focuses?.acts, true)
    assert.equal(found.Scrolls?.acts, true)
    assert.equal(found.Fires?.acts, true)
    assert.equal(found.Tagged?.acts, true)
    assert.equal(found.Tagged?.tagged, true)
    assert.equal(found.Clicks?.tagged, false)
  })

  it('follows helpers, play references and spread stories', () => {
    const found = stories(
      'helpers',
      `export default { title: 'X' }
async function open(canvas) { await userEvent.click(canvas) }
const twice = async (canvas) => { await open(canvas); await open(canvas) }
async function check(canvas) { await expect(canvas).toBeVisible() }
export const ViaHelper = { play: async ({ canvasElement }) => { await twice(canvasElement) } }
export const Checks = { play: async ({ canvasElement }) => { await check(canvasElement) } }
export const Named = { play: open }
export const Borrowed = { play: ViaHelper.play }
export const Spread = { ...ViaHelper, name: 'Spread' }
export const SpreadTagged = { ...ViaHelper, tags: ['interaction'] }
`,
    )
    assert.equal(found.ViaHelper?.acts, true)
    assert.equal(found.Checks?.acts, false)
    assert.equal(found.Named?.acts, true)
    assert.equal(found.Borrowed?.acts, true)
    assert.equal(found.Spread?.acts, true)
    assert.equal(found.SpreadTagged?.tagged, true)
  })

  it('reads the tag from the meta', () => {
    const found = stories(
      'meta',
      `const meta = { title: 'X', tags: ['interaction'] } satisfies Meta
export default meta
export const Clicks = { play: async () => { await userEvent.click(button) } }
`,
    )
    assert.equal(found.Clicks?.tagged, true)
  })
})

describe('violations', () => {
  it('finds none in this repository: every pictured story is static', () => {
    assert.deepEqual(violations(fileURLToPath(new URL('..', import.meta.url))), [])
  })
})

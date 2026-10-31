import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { missingSamples, sampleStories } from './sample-text-stories.mjs'

describe('sampleStories', () => {
  it('reads the title and the Arabic and Japanese stories by export or name', () => {
    const found = sampleStories(`const meta = { title: 'Components/X' }
export const Arabic: Story = {}
export const Other = { name: 'Japanese names' }`)
    assert.deepEqual(found, { title: 'Components/X', arabic: true, japanese: true })
  })

  it('misses a file without them', () => {
    const found = sampleStories(`const meta = { title: 'Components/X' }
export const Default = {}`)
    assert.deepEqual(found, { title: 'Components/X', arabic: false, japanese: false })
  })
})

describe('missingSamples', () => {
  it('finds none in this repository: every component shows Arabic and Japanese text', () => {
    assert.deepEqual(missingSamples(fileURLToPath(new URL('..', import.meta.url))), [])
  })
})

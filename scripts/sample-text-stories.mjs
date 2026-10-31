// Every component with text has an Arabic and a Japanese story (C4): each story file under
// Components/, Templates/ or Charts/ names a story "Arabic…" and one "Japanese…", except the
// files listed in WITHOUT_SAMPLES. `pnpm test` runs it (scripts/sample-text-stories.test.mjs).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Story files without sample-text stories, each with its reason. */
export const WITHOUT_SAMPLES = {
  'Components/Diagram/Edit': 'a mode of Diagram, whose View stories carry Arabic and Japanese',
  'Components/Diagram/Run': 'a mode of Diagram, whose View stories carry Arabic and Japanese',
  'Charts/Palette': 'colours only, no text',
  'Charts/States': "the charts' states, only the provider's messages",
}

/** The sidebar groups whose components must show Arabic and Japanese text. */
const CHECKED = /^(Components|Templates|Charts)\//

/**
 * The story file's title and whether it names an Arabic and a Japanese story.
 * @param {string} text
 */
export function sampleStories(text) {
  const title = /title:\s*['"]([^'"]+)['"]/.exec(text)?.[1] ?? null
  const named = (word) =>
    new RegExp(`export const \\w*${word}\\w*\\s*[:=]|name:\\s*['"][^'"]*${word}`).test(text)
  return { title, arabic: named('Arabic'), japanese: named('Japanese') }
}

/**
 * The story files that miss a sample-text story, as "title: missing".
 * @param {string} root the repository root
 * @returns {string[]}
 */
export function missingSamples(root) {
  const files = execFileSync('git', ['ls-files', '*.stories.tsx'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  /** @type {string[]} */
  const missing = []
  for (const file of files) {
    const { title, arabic, japanese } = sampleStories(readFileSync(join(root, file), 'utf8'))
    if (title === null || !CHECKED.test(title) || title in WITHOUT_SAMPLES) continue
    const lacking = [arabic ? null : 'Arabic', japanese ? null : 'Japanese'].filter(Boolean)
    if (lacking.length > 0) missing.push(`${title}: ${lacking.join(', ')}`)
  }
  return missing
}

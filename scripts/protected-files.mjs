// Changing this file is a protected change (BUILD-PLAN rule 10).
//
// The protected-files check of BUILD-PLAN rule 10: a pull request that changes a protected file
// must contain a section "## Protected file changes" that names every such file with a reason.
// CI runs it on every pull request event, including edits of the description.
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { matchesGlob } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Rule 10's file classes, as globs over repository paths. */
export const PROTECTED = [
  // Agent permissions (added by the owner, 2026-09-24).
  '.claude/settings.json',
  // Lint configuration.
  'eslint.config.*',
  '**/eslint.config.*',
  'packages/eslint-config/**',
  // TypeScript configuration.
  'tsconfig*.json',
  '**/tsconfig*.json',
  // CI, and the checks CI runs.
  '.github/**',
  'scripts/protected-files.mjs',
  'scripts/consumer-check.mjs',
  'apps/consumer-check/check.mjs',
  // Playwright and Storybook test configuration, and the accessibility settings.
  '**/playwright.config.*',
  'apps/storybook/.storybook/**',
  'apps/storybook/tests/*.ts',
]

export const HEADING = '## Protected file changes'

/**
 * @param {string[]} files changed paths, relative to the repository root
 * @returns {string[]} the protected ones
 */
export function protectedFiles(files) {
  return files.filter((file) => PROTECTED.some((pattern) => matchesGlob(file, pattern)))
}

/**
 * The text of the "## Protected file changes" section, up to the next level-2 heading,
 * or null when the description has no such section.
 * @param {string} body pull request description
 * @returns {string | null}
 */
export function protectedSection(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => line.trim() === HEADING)
  if (start === -1) {
    return null
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^##\s/.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n')
}

/**
 * @param {string[]} files changed paths
 * @param {string} body pull request description
 * @returns {{ protected: string[], missing: string[], hasSection: boolean }}
 *   `missing`: protected files the section does not name
 */
export function checkPullRequest(files, body) {
  const changed = protectedFiles(files)
  const section = protectedSection(body)
  const missing = changed.filter((file) => section === null || !section.includes(file))
  return { protected: changed, missing, hasSection: section !== null }
}

function main() {
  const base = process.env['BASE_SHA']
  const head = process.env['HEAD_SHA']
  const eventPath = process.env['GITHUB_EVENT_PATH']
  if (base === undefined || head === undefined || eventPath === undefined) {
    throw new Error('BASE_SHA, HEAD_SHA and GITHUB_EVENT_PATH are required')
  }
  /** @type {{ pull_request?: { body?: string | null } }} */
  const event = JSON.parse(readFileSync(eventPath, 'utf8'))
  const body = event.pull_request?.body ?? ''
  const files = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter((file) => file !== '')

  const result = checkPullRequest(files, body)
  const summary = [
    '### Protected files',
    '',
    result.protected.length === 0
      ? 'No protected file is changed.'
      : result.protected.map((file) => `- \`${file}\``).join('\n'),
    '',
  ]
  if (result.missing.length > 0) {
    summary.push(
      `**Missing from "${HEADING}":**`,
      '',
      result.missing.map((file) => `- \`${file}\``).join('\n'),
      '',
    )
  }
  const summaryPath = process.env['GITHUB_STEP_SUMMARY']
  if (summaryPath !== undefined) {
    appendFileSync(summaryPath, `${summary.join('\n')}\n`)
  }
  console.log(summary.join('\n'))

  if (result.missing.length > 0) {
    console.error(
      `\nThis pull request changes protected files (BUILD-PLAN rule 10). Add a section\n` +
        `"${HEADING}" to its description that names each file above with a reason.`,
    )
    process.exitCode = 1
  }
}

const invokedPath = process.argv[1]
if (invokedPath !== undefined && import.meta.url === pathToFileURL(invokedPath).href) {
  main()
}

// Refreshes the visual baselines locally, inside the same pinned Playwright image as CI
// (BUILD-PLAN P0.4). Needs Docker. Usage, from the repository root:
//
//   node scripts/update-baselines.mjs
//
// The container gets a read-only copy of the repository without node_modules and build output
// (those are platform-specific), installs, builds, builds Storybook, runs the visual tests with
// --update-snapshots, and writes the new and changed images back to
// apps/storybook/tests/__screenshots__/. Review them with `git diff` before committing.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

// One source for the image: the digest CI uses.
const ci = readFileSync(join(root, '.github', 'workflows', 'ci.yml'), 'utf8')
const image = /^\s*image:\s*(mcr\.microsoft\.com\/playwright:\S+@sha256:[0-9a-f]{64})\s*$/m.exec(
  ci,
)?.[1]
if (image === undefined) {
  throw new Error('no Playwright image pinned by digest found in .github/workflows/ci.yml')
}
const pnpm = /"packageManager":\s*"(pnpm@[^"]+)"/.exec(
  readFileSync(join(root, 'package.json'), 'utf8'),
)?.[1]
if (pnpm === undefined) {
  throw new Error('no packageManager found in package.json')
}

const script = [
  'set -eu',
  'mkdir /work',
  'tar -C /src --exclude=./.git --exclude=node_modules --exclude=dist --exclude=storybook-static' +
    ' --exclude=playwright-report --exclude=test-results -cf - . | tar -C /work -xf -',
  'cd /work',
  `npm install --global --silent ${pnpm}`,
  'pnpm install --frozen-lockfile',
  'pnpm build',
  'pnpm build-storybook',
  // A difference is expected here, so a failing comparison does not stop the copy below.
  'pnpm --filter liro-storybook test:visual --update-snapshots=changed || true',
  'cp -R apps/storybook/tests/__screenshots__/. /out/',
].join('\n')

console.log(`Image: ${image}`)
execFileSync(
  'docker',
  [
    'run',
    '--rm',
    '--volume',
    `${root}:/src:ro`,
    '--volume',
    `${join(root, 'apps', 'storybook', 'tests', '__screenshots__')}:/out`,
    image,
    'bash',
    '-c',
    script,
  ],
  { stdio: 'inherit' },
)
console.log('\nBaselines updated in apps/storybook/tests/__screenshots__/. Review with `git diff`.')

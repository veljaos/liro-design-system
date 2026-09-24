import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkPullRequest, protectedFiles, protectedSection } from './protected-files.mjs'

describe('protectedFiles', () => {
  it('finds every class of rule 10', () => {
    const files = [
      '.claude/settings.json',
      'eslint.config.mjs',
      'packages/eslint-config/src/index.ts',
      'tsconfig.json',
      'tsconfig.base.json',
      'packages/ui/tsconfig.json',
      '.github/workflows/ci.yml',
      'scripts/protected-files.mjs',
      'scripts/consumer-check.mjs',
      'apps/consumer-check/check.mjs',
      'apps/storybook/playwright.config.ts',
      'apps/storybook/.storybook/preview.tsx',
      'apps/storybook/.storybook/a11y.ts',
      'apps/storybook/tests/accessibility.spec.ts',
    ]
    assert.deepEqual(protectedFiles(files), files)
  })

  it('leaves ordinary files alone', () => {
    const files = [
      'packages/ui/src/components/button.tsx',
      'packages/ui/src/provider/format.test.ts',
      'docs/decisions.md',
      'BUILD-PLAN.md',
      'README.md',
      '.claude/settings.local.json',
      'apps/storybook/tests/__screenshots__/visual.spec.ts/button--light-ltr.png',
      'pnpm-lock.yaml',
    ]
    assert.deepEqual(protectedFiles(files), [])
  })
})

describe('protectedSection', () => {
  it('returns the section up to the next level-2 heading', () => {
    const body = '## What\n\nx\n\n## Protected file changes\n\n- `a`: why\n\n## Merge\n\ny'
    assert.equal(protectedSection(body), '\n- `a`: why\n')
  })

  it('returns null without the section', () => {
    assert.equal(protectedSection('## What\n\nNothing protected.'), null)
  })

  it('reads Windows line endings', () => {
    assert.equal(protectedSection('## Protected file changes\r\n- `a`: why'), '- `a`: why')
  })
})

describe('checkPullRequest', () => {
  it('fails a change to eslint.config.mjs without the section', () => {
    const result = checkPullRequest(['eslint.config.mjs', 'README.md'], '## What\n\nA change.')
    assert.deepEqual(result.missing, ['eslint.config.mjs'])
    assert.equal(result.hasSection, false)
  })

  it('fails when the section does not name every protected file', () => {
    const result = checkPullRequest(
      ['eslint.config.mjs', '.claude/settings.json'],
      '## Protected file changes\n\n- `eslint.config.mjs`: a new ignore.',
    )
    assert.deepEqual(result.missing, ['.claude/settings.json'])
  })

  it('passes when every protected file has its line', () => {
    const result = checkPullRequest(
      ['eslint.config.mjs', '.claude/settings.json', 'README.md'],
      '## Protected file changes\n\n- `eslint.config.mjs`: a new ignore.\n- `.claude/settings.json`: narrower.',
    )
    assert.deepEqual(result.missing, [])
    assert.deepEqual(result.protected, ['eslint.config.mjs', '.claude/settings.json'])
  })

  it('passes a pull request without protected files and without the section', () => {
    assert.deepEqual(checkPullRequest(['README.md'], '').missing, [])
  })
})

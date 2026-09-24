// Runs inside the installed copy of consumer-check, after `vite build`.
// Proves that the packed packages work for a consumer: the button renders, the CSS files
// resolve through the exports maps and reach the bundle, the ESLint config loads and applies,
// and the license travels with every package.
import assert from 'node:assert/strict'
import { access, readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { ESLint } from 'eslint'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from '@liro/ui'
import liroEslintConfig from '@liro/eslint-config'

// 1. The button renders.
const html = renderToStaticMarkup(createElement(Button, null, 'Save'))
assert.match(html, /^<button type="button" class="[^"]*bg-brand-solid[^"]*">Save<\/button>$/)
console.log(`render: ${html}`)

// 2. Every CSS and JSON export resolves, and the built bundle contains the button's styles.
const require = createRequire(import.meta.url)
for (const specifier of [
  '@liro/tokens/tokens.css',
  '@liro/tokens/theme.css',
  '@liro/tokens/tokens.json',
  '@liro/ui/styles.css',
]) {
  console.log(`resolve: ${specifier} -> ${require.resolve(specifier)}`)
}
const assets = await readdir('dist/assets')
const cssFiles = assets.filter((file) => file.endsWith('.css'))
assert.equal(
  cssFiles.length,
  1,
  `expected one CSS file in dist/assets, found ${cssFiles.join(', ')}`,
)
const css = await readFile(`dist/assets/${cssFiles[0]}`, 'utf8')
assert.ok(
  css.includes('--liro-brand-solid:'),
  'bundle is missing the token variables of tokens.css',
)
assert.ok(css.includes('.bg-brand-solid'), 'bundle is missing the button utilities of styles.css')
console.log(`bundle: dist/assets/${cssFiles[0]} has the tokens and the button styles`)

// 3. The ESLint config loads and forbids Radix and internal paths.
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: liroEslintConfig })
const [result] = await eslint.lintText(
  "import '@liro/ui/styles.css'\nimport '@radix-ui/react-dialog'\nimport '@liro/ui/src/primitives/button'\n",
  { filePath: 'example.js' },
)
assert.deepEqual(
  result.messages.map((message) => `${message.line}:${message.ruleId}`),
  ['2:no-restricted-imports', '3:no-restricted-imports'],
)
console.log('eslint: @liro/eslint-config reports Radix and internal imports, allows styles.css')

// 4. Every package carries the license and the third-party notices.
for (const name of ['@liro/tokens', '@liro/ui', '@liro/eslint-config']) {
  const dir = dirname(require.resolve(`${name}/package.json`))
  const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  assert.equal(manifest.license, 'UNLICENSED', `${name}: license field`)
  for (const file of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) {
    await access(join(dir, 'dist', file))
  }
}
console.log(
  'legal: every package has license UNLICENSED, dist/LICENSE and dist/THIRD-PARTY-NOTICES.md',
)

console.log('consumer-check: passed')

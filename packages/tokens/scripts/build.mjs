// Builds @liro/tokens: copies the CSS and JSON sources to dist/.
// Outputs (BUILD-PLAN Appendix B.10): dist/tokens.css, dist/theme.css, dist/tokens.json.
import { copyFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const outputs = ['tokens.css', 'theme.css', 'tokens.json']

await rm(`${root}dist`, { recursive: true, force: true })
await mkdir(`${root}dist`)
for (const file of outputs) {
  await copyFile(`${root}src/${file}`, `${root}dist/${file}`)
}
console.log(`@liro/tokens: wrote ${outputs.map((file) => `dist/${file}`).join(', ')}`)

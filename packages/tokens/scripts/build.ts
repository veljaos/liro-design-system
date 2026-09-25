// Builds @veljaos/tokens from src/tokens.ts. Node runs this TypeScript file directly (type stripping).
// Outputs (BUILD-PLAN Appendix B.10): dist/tokens.css, dist/theme.css, dist/tokens.json.
// dist/LICENSE and dist/THIRD-PARTY-NOTICES.md come from scripts/copy-legal.mjs, which runs next.
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { themeCss, tokensCss, tokensJson } from '../src/generate.ts'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const outputs: Record<string, string> = {
  'tokens.css': tokensCss(),
  'theme.css': themeCss(),
  'tokens.json': tokensJson(),
}

await rm(dist, { recursive: true, force: true })
await mkdir(dist)
for (const [file, content] of Object.entries(outputs)) {
  await writeFile(`${dist}${file}`, content)
}
console.log(
  `@veljaos/tokens: wrote ${Object.keys(outputs)
    .map((file) => `dist/${file}`)
    .join(', ')}`,
)

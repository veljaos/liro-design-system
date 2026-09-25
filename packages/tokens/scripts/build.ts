// Builds @veljaos/tokens from src/tokens.ts. Node runs this TypeScript file directly (type stripping).
// Outputs (BUILD-PLAN Appendix B.10): dist/tokens.css, dist/fonts.css, dist/fonts/*.woff2 and
// dist/fonts/LICENSE-*.txt,
// dist/theme.css, dist/tokens.json. dist/LICENSE and dist/THIRD-PARTY-NOTICES.md come from
// scripts/copy-legal.mjs, which runs next.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { FONT_PACKAGES, fontsCss, themeCss, tokensCss, tokensJson } from '../src/generate.ts'

const root = new URL('../', import.meta.url)
const dist = fileURLToPath(new URL('dist/', root))

await rm(dist, { recursive: true, force: true })
await mkdir(`${dist}fonts`, { recursive: true })

// Font faces: the packages' stylesheets, and every file they refer to.
const stylesheets: string[] = []
const fileSources = new Map<string, URL>()
for (const { name, stylesheets: names } of FONT_PACKAGES) {
  const packageDir = new URL(`node_modules/${name}/`, root)
  // The SIL Open Font License travels with the fonts.
  await copyFile(
    new URL('LICENSE', packageDir),
    `${dist}fonts/LICENSE-${name.slice(name.indexOf('/') + 1)}.txt`,
  )
  for (const stylesheet of names) {
    const css = await readFile(new URL(stylesheet, packageDir), 'utf8')
    stylesheets.push(css)
    for (const match of css.matchAll(/url\(\.\/files\/([^)]+)\)/g)) {
      const file = match[1] ?? ''
      fileSources.set(file, new URL(`files/${file}`, packageDir))
    }
  }
}
const fonts = fontsCss(stylesheets)
for (const file of fonts.files) {
  const source = fileSources.get(file)
  if (source === undefined) throw new Error(`no source for font file ${file}`)
  await copyFile(source, `${dist}fonts/${file}`)
}

const outputs: Record<string, string> = {
  'tokens.css': tokensCss(),
  'fonts.css': fonts.css,
  'theme.css': themeCss(),
  'tokens.json': tokensJson(),
}
for (const [file, content] of Object.entries(outputs)) {
  await writeFile(`${dist}${file}`, content)
}
console.log(
  `@veljaos/tokens: wrote ${Object.keys(outputs)
    .map((file) => `dist/${file}`)
    .join(', ')} and ${String(fonts.files.length)} font files in dist/fonts/`,
)

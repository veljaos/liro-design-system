// Copies LICENSE and THIRD-PARTY-NOTICES.md into the folder named by the first argument
// (default: dist/) of the package it runs in, so every published tarball and the Storybook
// build carry them. Run from a package's build script.
import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const target = process.argv[2] ?? 'dist'
for (const file of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) {
  await copyFile(join(root, file), join(process.cwd(), target, file))
}

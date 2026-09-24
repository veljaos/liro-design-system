// Copies LICENSE and THIRD-PARTY-NOTICES.md into the dist/ of the package it runs in,
// so every published tarball carries them. Run from a package's build script.
import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
for (const file of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) {
  await copyFile(join(root, file), join(process.cwd(), 'dist', file))
}

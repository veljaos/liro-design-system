// Installs the packed @liro/* packages into a copy of apps/consumer-check outside the
// repository, then builds and checks it like a real consumer (BUILD-PLAN P0.2, Appendix B.10).
// Workspace links hide a missing `files` entry or a private package; tarballs do not.
// Run `pnpm build` first.
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const packages = ['tokens', 'ui', 'eslint-config']
const keep = process.argv.includes('--keep')

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function run(command, args, cwd) {
  console.log(`\n> ${command} ${args.join(' ')}  (in ${cwd})`)
  // On Windows, pnpm is a .cmd shim that only runs through a shell.
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
}

const work = await mkdtemp(join(tmpdir(), 'liro-consumer-check-'))
const tarballs = join(work, 'tarballs')
const app = join(work, 'app')

try {
  /** @type {Record<string, string>} */
  const dependencies = {}
  for (const name of packages) {
    const dir = join(root, 'packages', name)
    /** @type {{ name: string, private?: boolean }} */
    const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    if (manifest.private === true) {
      throw new Error(`${manifest.name} is private and could not be installed by a consumer`)
    }
    const before = new Set(await readdir(tarballs).catch(() => []))
    run('pnpm', ['pack', '--pack-destination', tarballs], dir)
    const created = (await readdir(tarballs)).filter((file) => !before.has(file))
    if (created.length !== 1 || created[0] === undefined) {
      throw new Error(`expected one tarball from ${manifest.name}, got: ${created.join(', ')}`)
    }
    dependencies[manifest.name] = `file:../tarballs/${created[0]}`
  }

  await cp(join(root, 'apps', 'consumer-check'), app, {
    recursive: true,
    filter: (source) => !/[\\/](node_modules|dist)$/.test(source),
  })
  const manifestPath = join(app, 'package.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  manifest.dependencies = { ...manifest.dependencies, ...dependencies }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  // pnpm warns that the peer @liro/tokens of @liro/ui is unmet: it does not count a `file:` tarball
  // as satisfying a version range. The peer is linked to the tarball all the same; from a registry
  // the range is met.
  // --ignore-workspace: the copy lives outside the repository, and must never pick up workspace links.
  run('pnpm', ['install', '--ignore-workspace', '--no-frozen-lockfile'], app)
  run('pnpm', ['run', 'build'], app)
  run('pnpm', ['run', 'check'], app)
} finally {
  if (keep) {
    console.log(`\nKept ${work}`)
  } else {
    await rm(work, { recursive: true, force: true })
  }
}

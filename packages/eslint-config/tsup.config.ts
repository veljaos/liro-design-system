import { defineConfig } from 'tsup'

// Outputs: dist/index.js and dist/index.d.ts; dist/LICENSE and
// dist/THIRD-PARTY-NOTICES.md come from scripts/copy-legal.mjs.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  // tsup 8.5.1 sets `baseUrl` for its declaration build, which TypeScript 6 reports as deprecated.
  // The option comes from tsup, not from our tsconfig.
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  clean: true,
  sourcemap: true,
  target: 'es2023',
})

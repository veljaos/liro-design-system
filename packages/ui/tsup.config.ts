import { defineConfig } from 'tsup'

// Outputs (BUILD-PLAN Appendix B.10): dist/index.js and dist/index.d.ts; dist/LICENSE and
// dist/THIRD-PARTY-NOTICES.md come from scripts/copy-legal.mjs. dist/styles.css comes from the Tailwind CLI.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  // tsup 8.5.1 sets `baseUrl` for its declaration build, which TypeScript 6 reports as deprecated.
  // The option comes from tsup, not from our tsconfig; see docs/decisions.md.
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  clean: true,
  sourcemap: true,
  target: 'es2023',
})

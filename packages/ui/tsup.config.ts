import { defineConfig } from 'tsup'

// Outputs: dist/index.js, dist/form.js, dist/charts.js, dist/rich-text.js, dist/diagram.js,
// dist/gantt.js, dist/map.js, dist/pivot.js, dist/code.js and their .d.ts, and shared chunks;
// dist/LICENSE and dist/THIRD-PARTY-NOTICES.md come from scripts/copy-legal.mjs. dist/styles.css
// comes from the Tailwind CLI.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    form: 'src/form/index.tsx',
    charts: 'src/charts/index.ts',
    'rich-text': 'src/rich-text/index.ts',
    diagram: 'src/diagram/index.ts',
    gantt: 'src/gantt/index.ts',
    map: 'src/map/index.ts',
    pivot: 'src/pivot/index.ts',
    code: 'src/code/index.ts',
  },
  format: ['esm'],
  // tsup 8.5.1 sets `baseUrl` for its declaration build, which TypeScript 6 reports as deprecated.
  // The option comes from tsup, not from our tsconfig.
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  clean: true,
  sourcemap: true,
  target: 'es2023',
})

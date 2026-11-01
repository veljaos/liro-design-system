import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const uiSource = fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url))
const brand = fileURLToPath(new URL('../../../packages/tokens/brand', import.meta.url))

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../src/**/*.mdx',
    // Foundations (tokens): pages of @veljaos/tokens, which has no components of its own.
    '../src/**/*.stories.tsx',
    '../../../packages/ui/src/**/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // The Liro brand: the web icons at the root, so the catalogue's favicon is Liro's
  // (Storybook takes favicon.svg from a static directory), and every brand file under /brand for
  // the manager's wordmark (manager.ts).
  staticDirs: [
    { from: `${brand}/web`, to: '/' },
    { from: brand, to: '/brand' },
  ],
  // No onboarding "Get started" checklist in the sidebar or the menu.
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  // The favicon: favicon.svg first, favicon.ico as the fallback, with a version (?v=2) so a
  // browser fetches a changed icon at once; raise it whenever the icon changes. With icon links in
  // managerHead Storybook adds none of its own and no status dot. The sidebar wordmark is 28px
  // high (Storybook would draw it at its own 72px), selected by its file, which manager.ts sets.
  managerHead: (head?: string) =>
    `${head ?? ''}<link rel="icon" href="./favicon.ico?v=2" sizes="48x48">` +
    `<link rel="icon" href="./favicon.svg?v=2" type="image/svg+xml">` +
    `<style>img[src$="wordmark-light.svg"] { height: 28px; width: auto; }</style>`,
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        // Stories and the preview use the @veljaos/ui source, so the provider in the decorator
        // and the components in the stories are the same module.
        alias: { '@veljaos/ui': uiSource },
        dedupe: ['react', 'react-dom'],
      },
    }),
}

export default config

import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const uiSource = fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url))
const brand = fileURLToPath(new URL('../../../packages/tokens/brand', import.meta.url))

// `favicon` is a preset Storybook reads from main.ts but leaves out of its type.
const config: StorybookConfig & { favicon: string } = {
  framework: '@storybook/react-vite',
  stories: [
    '../src/**/*.mdx',
    // Foundations (tokens): pages of @veljaos/tokens, which has no components of its own.
    '../src/**/*.stories.tsx',
    '../../../packages/ui/src/**/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // The Liro brand (P3.7): the web icons at the root, so the catalogue's favicon is Liro's
  // (Storybook takes favicon.svg from a static directory), and every brand file under /brand for
  // the manager's wordmark (manager.ts).
  staticDirs: [
    { from: `${brand}/web`, to: '/' },
    { from: brand, to: '/brand' },
  ],
  // Named explicitly (P4.0): Storybook finds a favicon in a static directory by reading
  // `from:to`, and on Windows the drive letter's colon broke that, so the local catalogue showed
  // Storybook's own icon. The status dot Storybook adds to an SVG favicon is drawn over this one.
  favicon: `${brand}/web/favicon.svg`,
  // No onboarding "Get started" checklist in the sidebar or the menu (P4.0).
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  // The sidebar wordmark at 28px high (P4.0): Storybook draws the brand image at its own size
  // (72px for this file). Selected by its file, which manager.ts sets.
  managerHead: (head?: string) =>
    `${head ?? ''}<style>img[src$="wordmark-light.svg"] { height: 28px; width: auto; }</style>`,
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

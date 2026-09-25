import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const uiSource = fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url))

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../../../packages/ui/src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
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

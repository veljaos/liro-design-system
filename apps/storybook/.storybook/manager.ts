import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

// The catalogue's own branding (P3.7): Liro's wordmark and title in the sidebar; the favicon comes
// from the static directory (main.ts). The wordmark is the blue one, for the manager's light
// background.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Liro Design System',
    brandImage: './brand/wordmark-light.svg',
    brandTarget: '_self',
  }),
})

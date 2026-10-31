import { LiroProvider } from '@veljaos/ui'
import { createElement as h, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ExampleProvider } from '../../../packages/ui/src/components/story-frames'
import { RouterLink } from '../../storybook/src/examples/example-shell'
import { ExampleStateProvider } from '../../storybook/src/examples/example-state'
import './perf.css'

/** Renders one example screen as the whole page, with the examples' providers. */
export function renderScreen(screen) {
  const root = document.getElementById('root')
  if (root === null) throw new Error('perf: #root is missing')
  createRoot(root).render(
    h(
      StrictMode,
      null,
      h(
        LiroProvider,
        { locale: 'en' },
        h(ExampleProvider, { linkComponent: RouterLink }, h(ExampleStateProvider, null, screen)),
      ),
    ),
  )
}

import '@veljaos/tokens/tokens.css'
import '@veljaos/ui/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')
if (root === null) {
  throw new Error('consumer-check: #root is missing from index.html')
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

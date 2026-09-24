import { Button } from '@liro/ui'
import { useState } from 'react'

export function App() {
  const [clicks, setClicks] = useState(0)
  return (
    <main>
      <Button
        onClick={() => {
          setClicks(clicks + 1)
        }}
      >
        Save
      </Button>
      <p aria-live="polite">Clicked {clicks} times</p>
    </main>
  )
}

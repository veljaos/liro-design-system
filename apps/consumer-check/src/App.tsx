import { Button } from '@veljaos/ui'
import { useState } from 'react'

export function App() {
  const [clicks, setClicks] = useState(0)
  return (
    <main>
      <Button
        intent="save"
        label="Save"
        onClick={() => {
          setClicks(clicks + 1)
        }}
      />
      <p aria-live="polite">Clicked {clicks} times</p>
    </main>
  )
}

import { Button } from '@veljaos/ui'
import { useState } from 'react'
import { ChartsExample } from './ChartsExample'
import { DiagramExample } from './DiagramExample'
import { FormExample } from './FormExample'
import { GanttExample } from './GanttExample'
import { MapExample } from './MapExample'
import { PivotExample } from './PivotExample'
import { RichTextExample } from './RichTextExample'

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
      <FormExample />
      <ChartsExample />
      <RichTextExample />
      <DiagramExample />
      <GanttExample />
      <MapExample />
      <PivotExample />
    </main>
  )
}

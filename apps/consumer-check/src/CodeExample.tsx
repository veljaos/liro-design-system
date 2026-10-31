import { CodeBlock, LiroProvider } from '@veljaos/ui'
import { CodeHighlighting } from '@veljaos/ui/code'

/**
 * CodeBlock from `@veljaos/ui`, highlighted through the `@veljaos/ui/code` subpath:
 * Shiki's tokenizer and JavaScript engine, the JSON grammar loaded on first use. Typed against the
 * packed declarations.
 */
export function CodeExample() {
  return (
    <LiroProvider locale="en">
      <CodeHighlighting>
        <CodeBlock code={'{\n  "status": 502\n}'} language="json" title="response.json" />
      </CodeHighlighting>
    </LiroProvider>
  )
}

import { LiroProvider } from '@veljaos/ui'
import { RichTextField } from '@veljaos/ui/rich-text'

/**
 * One rich text field through the `@veljaos/ui/rich-text` subpath, typed against the
 * packed declarations; Tiptap comes with it as a dependency of `@veljaos/ui`.
 */
export function RichTextExample() {
  return (
    <LiroProvider locale="en">
      <RichTextField
        label="Offer letter"
        mergeFields={[{ key: 'customer.name', label: 'Customer name' }]}
        defaultValue={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Dear ' },
                { type: 'mergeField', attrs: { key: 'customer.name' } },
              ],
            },
          ],
        }}
        onChange={(value) => {
          document.title = `${String(value.length)} characters`
        }}
      />
    </LiroProvider>
  )
}

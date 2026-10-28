import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { CodeBlock } from './code-block'
import { HealthList, type HealthItem } from './health-list'

function render(node: ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" direction="rtl">
      {node}
    </LiroProvider>,
  )
}

const ESC = String.fromCharCode(27)

describe('CodeBlock', () => {
  it('is a region named by its title, always left to right, with Copy in the header', () => {
    const html = render(<CodeBlock code={'{"ok": true}'} language="json" title="response.json" />)
    expect(html).toMatch(/<pre[^>]*dir="ltr"[^>]*role="region"[^>]*aria-labelledby=/)
    expect(html).toContain('response.json')
    expect(html).toContain('aria-label="Copy"')
    expect(html).toContain('role="status"')
  })

  it('is named "Code" without a title, and Copy floats', () => {
    const html = render(<CodeBlock code="x" />)
    expect(html).toContain('aria-label="Code"')
    expect(html).toContain('absolute end-1 top-1')
  })

  it('marks a diff with words and signs, and numbers the lines from startLine', () => {
    const html = render(<CodeBlock code={'-old\n+new'} diff lineNumbers startLine={7} />)
    expect(html).toContain('Removed line')
    expect(html).toContain('Added line')
    expect(html).toContain('−')
    expect(html).toMatch(/>7<\/span>/)
    expect(html).toMatch(/>8<\/span>/)
  })

  it('draws terminal colours from the Liro code theme, never raw colours', () => {
    const html = render(<CodeBlock code={`${ESC}[31mfailed${ESC}[0m ok`} language="ansi" />)
    expect(html).toContain('color:var(--liro-code-ansi-red)')
    expect(html).not.toContain(ESC)
  })

  it('offers "Wrap lines" as a pressed toggle and caps the height', () => {
    const html = render(<CodeBlock code="x" title="log" wrapToggle maxHeight={200} />)
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('Wrap lines')
    expect(html).toContain('max-height:200px')
  })

  it('is ready at once when there is nothing to highlight', () => {
    expect(render(<CodeBlock code="x" language="json" />)).toContain('data-ready="true"')
  })
})

describe('HealthList with a raw error', () => {
  it('offers the last error’s details on request', () => {
    const item: HealthItem = {
      id: 'sef',
      name: 'SEF',
      state: { kind: 'down', label: 'Down', tone: 'danger' },
      lastError: {
        at: '2026-10-14T09:31:00+02:00',
        message: 'The service answered 502.',
        detail: '{"status": 502}',
        detailLanguage: 'json',
      },
    }
    const html = render(<HealthList label="Connections" items={[item]} layout="desktop" />)
    expect(html).toContain('Show details')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('Last error details: SEF')
  })
})

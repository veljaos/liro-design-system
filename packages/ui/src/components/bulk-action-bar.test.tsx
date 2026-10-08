import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { asksFirst, BulkActionBar } from './bulk-action-bar'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const noop = () => undefined

describe('BulkActionBar', () => {
  it('shows nothing while no row is selected', () => {
    expect(render(<BulkActionBar count={0} onClear={noop} actions={[]} />)).not.toContain(
      'selected',
    )
  })

  it('announces the count politely and offers to select all', () => {
    const html = render(
      <BulkActionBar count={3} total={1234} onSelectAll={noop} onClear={noop} actions={[]} />,
    )
    expect(html).toMatch(/aria-live="polite"[^>]*>3 selected</)
    expect(html).toContain('Select all 1,234')
    expect(html).toContain('aria-label="Clear the selection"')
  })

  it('offers no "select all" when the selection is already everything', () => {
    expect(
      render(<BulkActionBar count={3} total={3} onSelectAll={noop} onClear={noop} actions={[]} />),
    ).not.toContain('Select all')
  })

  it('disables every action while loading', () => {
    const html = render(
      <BulkActionBar
        count={2}
        onClear={noop}
        loading
        actions={[
          { key: 'e', intent: 'export', label: 'Export', onClick: noop },
          { key: 'd', intent: 'delete', label: 'Delete', onClick: noop },
        ]}
      />,
    )
    // The two actions, each twice: in the row and in its invisible measuring copy (the overflow
    // into "More", P2.7d). The clear button stays usable.
    expect(html.match(/disabled=""/g)).toHaveLength(4)
  })
})

describe('asksFirst', () => {
  it("follows the action's own rule, else its intent's", () => {
    expect(asksFirst({ key: 'd', intent: 'delete', label: 'Delete' })).toBe(true)
    expect(asksFirst({ key: 'e', intent: 'export', label: 'Export' })).toBe(false)
    expect(asksFirst({ key: 'e', intent: 'export', label: 'Export', confirm: true })).toBe(true)
  })
})

describe('bulk messages', () => {
  it('put the count in the question, once for the whole selection', () => {
    expect(messagesEn['bulk.confirmTitle'](1, '1')).toBe('Apply to 1 item?')
    expect(messagesEn['bulk.confirmTitle'](24, '24')).toBe('Apply to 24 items?')
  })
})

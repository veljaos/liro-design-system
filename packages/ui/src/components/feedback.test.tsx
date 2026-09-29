import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { Alert, alertRole, Banner } from './alert'
import { EmptyState, emptyIcon, ErrorState } from './empty-state'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('Alert and Banner', () => {
  it('interrupt for a warning or a danger, and are polite otherwise', () => {
    expect(alertRole('danger')).toBe('alert')
    expect(alertRole('warning')).toBe('alert')
    expect(alertRole('info')).toBe('status')
    expect(alertRole('success')).toBe('status')
  })

  it("draw the tone's light look, the title in the tone's colour", () => {
    const html = render(
      <Alert tone="danger" title="Not saved">
        The period is closed.
      </Alert>,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain('bg-status-danger-bg')
    expect(html).toContain('text-status-danger-fg')
    expect(html).toContain('The period is closed.')
  })

  it('show a close button named by messages only when dismissible', () => {
    expect(render(<Alert tone="info">x</Alert>)).not.toContain('aria-label="Close"')
    expect(
      render(
        <Alert tone="info" onClose={() => undefined}>
          x
        </Alert>,
      ),
    ).toContain('aria-label="Close"')
    expect(
      render(
        <Banner tone="warning" actions={<button type="button">Review</button>}>
          Your trial ends in 3 days.
        </Banner>,
      ),
    ).toContain('>Review</button>')
  })
})

describe('EmptyState and ErrorState', () => {
  it('never draw the error with the empty icon', () => {
    expect(emptyIcon('error')).not.toBe(emptyIcon('empty'))
    expect(emptyIcon('error')).not.toBe(emptyIcon('no-results'))
  })

  it("take each variant's texts from the messages, and let the application replace them", () => {
    expect(render(<EmptyState />)).toContain('Nothing here yet')
    expect(render(<EmptyState variant="no-results" />)).toContain('Nothing matches')
    expect(render(<EmptyState title="No invoices yet" />)).toContain('No invoices yet')
  })

  it('offer one small neutral action, and 24px icons when compact', () => {
    const html = render(
      <EmptyState compact action={{ label: 'Create an invoice', onClick: () => undefined }} />,
    )
    expect(html).toContain('<span>Create an invoice</span>')
    expect(html).toContain('h-control-sm')
    expect(html).toContain('size-6')
    expect(html).toContain('stroke-width="1.5"')
  })

  it('show the case number to quote, and the report action', () => {
    const html = render(
      <ErrorState caseId="A1B2-C3D4" reportAction={<button type="button">Report</button>} />,
    )
    expect(html).toContain('This could not be loaded')
    expect(html).toContain('Case number:')
    expect(html).toContain('A1B2-C3D4')
    expect(html).toContain('>Report</button>')
  })
})

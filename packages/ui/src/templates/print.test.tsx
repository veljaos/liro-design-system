import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuizResult } from '../components/quiz-result'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { PrintPage } from './print-page'
import { PrintTable } from './print-parts'
import { PrintDocument } from './print-document'

function render(node: ReactNode, locale = 'en') {
  return renderToStaticMarkup(
    <LiroProvider locale={locale} format={createFormat('sr-Latn-RS')} colorScheme="dark">
      {node}
    </LiroProvider>,
  )
}

/** The text of the markup, tags removed. */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

describe('PrintPage', () => {
  it('is always light paper, with its own page rule, header and footer', () => {
    const html = render(
      <PrintPage title="Letter" header="Head" footer="Foot">
        <p>Body</p>
      </PrintPage>,
    )
    expect(html).toContain('data-liro-theme="light"')
    expect(html).toContain('aria-label="Letter"')
    expect(html).toMatch(/@page liro-print-[\w-]+ \{/)
    expect(html).toContain('content: "Page " counter(page) " of " counter(pages)')
    // The footer once visible, once as the invisible copy that keeps its room on paper.
    expect(html.match(/Foot/g)).toHaveLength(2)
    expect(html).toContain('data-slot="print-header"')
  })
  it('prints the draft and the cancellation markers', () => {
    const draft = render(
      <PrintPage title="D" status={{ kind: 'draft', note: 'Not valid' }}>
        x
      </PrintPage>,
    )
    expect(draft).toContain('data-status="draft"')
    expect(draft).toContain('data-text="Draft"')
    expect(draft).toContain('Not valid')
    const cancelled = render(
      <PrintPage
        title="C"
        status={{
          kind: 'cancelled',
          by: 'Milica Petrović',
          at: '2026-10-06T11:20:00+02:00',
          reason: 'Wrong buyer',
          document: { kind: 'Cancellation document', number: 'ST-2026-0004' },
        }}
      >
        x
      </PrintPage>,
    )
    expect(cancelled).toContain('by Milica Petrović on 06.10.2026. at 11:20.')
    expect(cancelled).toContain('Wrong buyer')
    expect(cancelled).toContain('ST-2026-0004')
    expect(cancelled).toContain('data-text="Cancelled"')
  })
  it('scrolls in a named, focusable region with fit none, and leaves out the page number', () => {
    const html = render(
      <PrintPage title="Wide" fit="none" pageNumbers={false}>
        x
      </PrintPage>,
    )
    expect(html).toContain('role="region"')
    expect(html).toContain('tabindex="0"')
    expect(html).not.toContain('counter(page)')
  })
})

describe('PrintTable', () => {
  it('repeats its header group and reads line types by typography', () => {
    const html = render(
      <PrintTable
        caption="Lines"
        columns={[
          {
            key: 'name',
            header: 'Item',
            cell: (row: { id: string; type: 'line' | 'heading' | 'subtotal' }) => row.id,
          },
          { key: 'amount', header: 'Amount', align: 'end', cell: () => '1,00' },
        ]}
        rows={[
          { id: 'Heading', type: 'heading' },
          { id: 'One', type: 'line' },
          { id: 'Sum', type: 'subtotal' },
        ]}
        rowKey={(row) => row.id}
        lineType={(row) => row.type}
        lineText={(row) => row.id}
      />,
    )
    expect(html).toContain('<thead class="[display:table-header-group]">')
    expect(html).toContain('colSpan="2"')
    expect(html).toContain('data-line-type="subtotal"')
    expect(html).toContain('class="sr-only')
  })
})

describe('PrintDocument', () => {
  it('PrintDocument: title and logo, key/values, parties, the amount due, payment, totals; no signatures', () => {
    const html = render(
      <PrintDocument
        title="Invoice"
        number="F-1"
        logo={<span>LOGO</span>}
        details={[{ key: 'n', label: 'Invoice number', value: 'F-1' }]}
        parties={[
          {
            key: 's',
            label: 'Seller',
            name: 'Kvadrat Gradnja d.o.o.',
            details: [{ key: 'pib', label: 'PIB', value: '109876543' }],
          },
        ]}
        amountDue={{ value: '1234.5', currency: 'RSD', date: '2026-10-21' }}
        payment={{
          title: 'Payment details',
          details: [{ key: 'a', label: 'Account', value: '160-1-12' }],
          code: <span>QR</span>,
          codeCaption: 'IPS QR',
        }}
        lines={{
          caption: 'Lines',
          columns: [{ key: 'i', header: 'Item', cell: (row: { id: string }) => row.id }],
          rows: [{ id: 'Beams' }],
          rowKey: (row) => row.id,
        }}
        totals={{
          label: 'Totals',
          rows: [{ key: 'n', label: 'Net', value: '1028.75', currency: 'RSD' }],
          total: { key: 't', label: 'Amount due', value: '1234.5', currency: 'RSD' },
        }}
        notes={['Pay in 15 days.']}
      />,
    )
    const words = text(html)
    expect(html).toContain('aria-label="Invoice F-1"')
    expect(html).toMatch(/<h1[^>]*>Invoice<\/h1>/)
    expect(html).toContain('data-slot="print-logo"')
    expect(words).toContain('Kvadrat Gradnja d.o.o.')
    expect(words).toContain('PIB 109876543')
    expect(words).toContain('1.234,50 RSD due 21.10.2026.')
    expect(words).toContain('Payment details Account 160-1-12')
    expect(words).toContain('QR IPS QR')
    expect(words).toContain('Pay in 15 days.')
    expect(html).not.toContain('data-signature-field')
    expect(words).toContain('Page 1 of 1')
  })
})

describe('QuizResult', () => {
  it('says the score and the outcome in words, and the correct answer under a wrong one', () => {
    const html = render(
      <QuizResult
        correct={8}
        total={10}
        passed={false}
        review={[
          {
            key: 'a',
            question: 'Q1',
            answer: 'From 5 m',
            correct: false,
            correctAnswer: 'From 2 m',
          },
          { key: 'b', question: 'Q2', answer: 'Yes', correct: true, correctAnswer: 'Yes' },
        ]}
      />,
    )
    expect(html).toContain('8 of 10 correct')
    expect(html).toContain('Not passed')
    expect(html).toContain('Correct answer: From 2 m')
    expect(html.match(/Correct answer:/g)).toHaveLength(1)
    expect(html).toContain('Incorrect')
  })
})

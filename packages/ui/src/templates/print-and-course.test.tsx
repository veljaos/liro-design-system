import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuizResult } from '../components/quiz-result'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { courseProgress, findLesson, moduleProgress, type CourseModule } from './course-logic'
import { CoursePage } from './course-page'
import { PrintPage } from './print-page'
import { PrintTable } from './print-parts'
import { PrintCertificate, PrintDocument, PrintFinding } from './print-templates'

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

const BASICS: CourseModule = {
  key: 'm1',
  title: 'Basics',
  lessons: [
    { key: 'a', title: 'Rights', href: '#a', state: 'done' },
    { key: 'b', title: 'Equipment', href: '#b', state: 'todo', detail: 'Video · 6 min' },
  ],
}
const TEST: CourseModule = {
  key: 'm2',
  title: 'Test',
  lessons: [
    { key: 'c', title: 'Final test', href: '#c', state: 'locked', lockedReason: 'finish first' },
  ],
}
const MODULES: CourseModule[] = [BASICS, TEST]

describe('course logic', () => {
  it('counts the lessons done per module and for the course', () => {
    expect(moduleProgress(BASICS)).toEqual({ done: 1, total: 2 })
    expect(moduleProgress(TEST)).toEqual({ done: 0, total: 1 })
    expect(courseProgress(MODULES)).toEqual({ done: 1, total: 3 })
    expect(courseProgress([])).toEqual({ done: 0, total: 0 })
  })
  it('finds the lesson being shown', () => {
    expect(findLesson(MODULES, 'c')?.title).toBe('Final test')
    expect(findLesson(MODULES, 'x')).toBeUndefined()
    expect(findLesson(MODULES, undefined)).toBeUndefined()
  })
})

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

describe('print templates', () => {
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
  it('PrintCertificate is landscape by default, with its logo and signature fields, no seal', () => {
    const html = render(
      <PrintCertificate
        title="Certificate"
        recipient="Nikola Marković"
        text="has completed the course"
        logo={<span>LOGO</span>}
        signatures={[{ id: 'officer', label: 'Officer' }]}
        onSign={() => undefined}
        issued={{ date: '2026-10-10' }}
      />,
    )
    expect(html).toContain('data-orientation="landscape"')
    expect(html).toContain('size: A4 landscape;')
    expect(html).not.toContain('counter(page)')
    expect(html).toContain('LOGO')
    expect(html).toContain('data-signature-field="officer"')
    expect(html).toContain('Sign here')
    expect(html).toContain('10.10.2026.')
  })
  it('PrintFinding prints the confidentiality note in the footer', () => {
    const html = render(
      <PrintFinding
        title="Finding"
        subjectTitle="Patient"
        subject={[
          { label: 'Name', value: 'Nikola' },
          { label: 'Born', value: null },
        ]}
        sections={[{ key: 'c', title: 'Conclusion', content: 'Fit for work.' }]}
        confidentiality="Confidential."
        signatures={[{ id: 'doctor', label: 'Doctor', image: <span>SIGNED</span> }]}
        onSign={() => undefined}
      />,
    )
    expect(html).toContain('data-slot="print-confidentiality"')
    expect(html.match(/Confidential\./g)).toHaveLength(2)
    expect(html).toContain('—')
    // A signed field shows the signature, not the button.
    expect(html).toContain('SIGNED')
    expect(html).not.toContain('Sign here')
  })
})

describe('CoursePage', () => {
  it('shows the progress, the states in words, the current lesson and Mark as done', () => {
    const html = render(
      <CoursePage
        title="Safety"
        modules={MODULES}
        currentKey="b"
        onMarkDone={() => undefined}
        next={{ title: 'Final test', href: '#c' }}
        layout="desktop"
      >
        Content
      </CoursePage>,
    )
    expect(html).toContain('1 of 3 lessons')
    expect(html).toContain('1 of 2 done')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('Locked: finish first')
    expect(html).toContain('Video · 6 min')
    expect(html).toContain('Mark as done')
    expect(html).toContain('rel="next"')
  })
  it('shows an empty state without lessons, and skeletons while loading', () => {
    expect(render(<CoursePage title="Safety" modules={[]} layout="desktop" />)).toContain(
      'No lessons yet',
    )
    expect(
      render(<CoursePage title="Safety" modules={MODULES} loading layout="desktop" />),
    ).toContain('aria-busy="true"')
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

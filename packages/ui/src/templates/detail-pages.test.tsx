import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { KeyFigures } from '../components/key-figures'
import { currentSection } from '../components/section-bar'
import { LiroProvider } from '../provider/liro-provider'
import { DetailPage, RecordFormPage } from './detail-page'
import { PageHeader } from './page-header'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('currentSection', () => {
  it('is the last section whose top has passed the bar, else the first', () => {
    expect(currentSection([200, 800, 1400], 100)).toBe(0)
    expect(currentSection([-300, 90, 700], 100)).toBe(1)
    expect(currentSection([-900, -300, 100], 100)).toBe(2)
    expect(currentSection([], 100)).toBe(0)
  })
})

describe('KeyFigures', () => {
  it('writes the label above the value, colour only for a state', () => {
    const html = render(
      <KeyFigures
        layout="desktop"
        items={[
          { label: 'Amount due', value: '12.345,60 RSD' },
          { label: 'Overdue', value: '3 days', tone: 'danger' },
        ]}
      />,
    )
    expect(html).toMatch(/<dt[^>]*text-xs text-secondary[^>]*>Amount due<\/dt>/)
    expect(html).toMatch(/<dd[^>]*font-semibold tabular-nums text-xl text-primary/)
    expect(html).toMatch(/<dd[^>]*text-status-danger-fg[^>]*>3 days<\/dd>/)
    expect(html).toContain('flex flex-wrap gap-x-8')
    expect(render(<KeyFigures layout="phone" items={[]} />)).toContain('grid grid-cols-2')
  })
})

describe('PageHeader back', () => {
  it('is a link named "Back to <list>", the arrow mirrored in right-to-left', () => {
    const html = render(
      <PageHeader title="Jelena Marković" back={{ href: '/hr/employees', label: 'Employees' }} />,
    )
    expect(html).toContain('href="/hr/employees"')
    expect(html).toContain('aria-label="Back to Employees"')
    expect(html).toContain('rtl:-scale-x-100')
    expect(html).toContain('size-7')
  })
})

describe('DetailPage', () => {
  it('renders each section with its id for the section bar, and the side column', () => {
    const html = render(
      <DetailPage
        layout="desktop"
        title="Jelena Marković"
        sectionBar
        sections={[
          { id: 'personal', label: 'Personal', content: <p>P</p> },
          { id: 'payroll', label: 'Payroll', content: <p>Q</p> },
        ]}
        side={<p>SIDE</p>}
      />,
    )
    expect(html).toContain('id="personal"')
    expect(html).toContain('id="payroll"')
    expect(html).toContain('aria-label="Sections"')
    expect(html).toContain('lg:grid-cols-[minmax(0,1fr)_300px]')
    expect(html).toMatch(/<aside[^>]*>.*SIDE/)
    expect(html).toMatch(/<h1[^>]*>Jelena Marković<\/h1>/)
  })
  it('has no section bar unless asked', () => {
    const html = render(
      <DetailPage
        layout="desktop"
        title="T"
        sections={[
          { id: 'a', label: 'A', content: null },
          { id: 'b', label: 'B', content: null },
        ]}
      />,
    )
    expect(html).not.toContain('aria-label="Sections"')
  })
})

describe('RecordFormPage', () => {
  it('puts the back button with the title and the actions at the top', () => {
    const html = render(
      <RecordFormPage
        layout="desktop"
        title="Jelena Marković"
        back={{ href: '/hr/employees/42', label: 'Jelena Marković' }}
        actions={<button type="button">Save</button>}
      >
        <p>FORM</p>
      </RecordFormPage>,
    )
    expect(html).toContain('aria-label="Back to Jelena Marković"')
    expect(html).toContain('Save')
    expect(html).toContain('FORM')
  })
})

describe('side column in the phone layout (P4.8)', () => {
  it('stands under the content whatever the viewport', () => {
    const page = (layout: 'phone' | 'desktop') =>
      render(
        <RecordFormPage title="Jelena Marković" actions={null} layout={layout} side={<p>Leave</p>}>
          <p>Form</p>
        </RecordFormPage>,
      )
    expect(page('desktop')).toContain('lg:grid-cols-[minmax(0,1fr)_300px]')
    expect(page('phone')).not.toContain('lg:grid-cols-[minmax(0,1fr)_300px]')
  })
})

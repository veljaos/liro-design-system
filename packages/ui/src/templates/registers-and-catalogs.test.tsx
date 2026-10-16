import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DuplicateWarning } from '../components/duplicate-warning'
import { ImportWizard, type ImportWizardProps } from '../components/import-wizard'
import { LiroProvider } from '../provider/liro-provider'
import { RegisterPage } from './register-page'
import { StatutoryFormPage, type StatutorySection } from './statutory-form-page'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={{ numberScheme: 'dot-comma' }}>
      {node}
    </LiroProvider>,
  )
}

/** The text of the markup, tags removed. */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

const WIZARD: ImportWizardProps = {
  step: 'check',
  onStepChange: () => undefined,
  accept: '.csv,.xlsx',
  acceptText: 'CSV or Excel, up to 10 MB',
  onFileChoose: () => undefined,
  sourceColumns: [
    { id: 'c1', name: 'Naziv', sample: 'Panonija Agro d.o.o.' },
    { id: 'c2', name: 'PIB', sample: '104987265' },
    { id: 'c3', name: 'Napomena' },
  ],
  fields: [
    { id: 'name', label: 'Name', required: true },
    { id: 'taxId', label: 'Tax number', required: true },
  ],
  mapping: { name: 'c1', taxId: 'c2' },
  onMappingChange: () => undefined,
  previewRows: [
    {
      id: 'r1',
      line: 14,
      values: { name: 'Panonija Agro d.o.o.', taxId: '10498726' },
      issues: [{ field: 'taxId', tone: 'danger', text: 'Tax number must have 9 digits' }],
    },
  ],
  counts: { ready: 1198, errors: 12, duplicates: 3 },
  problemsOnly: false,
  onProblemsOnlyChange: () => undefined,
  skipInvalid: false,
  onSkipInvalidChange: () => undefined,
  onImport: () => undefined,
  layout: 'desktop',
}

describe('ImportWizard', () => {
  it('writes the counts through the format, each with its noun', () => {
    const html = text(render(<ImportWizard {...WIZARD} />))
    expect(html).toContain('1.198 rows ready')
    expect(html).toContain('12 with errors')
    expect(html).toContain('3 duplicates')
    expect(html).toContain('Tax number must have 9 digits')
  })

  it('keeps Import unavailable, with its reason, while errors are not skipped', () => {
    const blocked = text(render(<ImportWizard {...WIZARD} />))
    expect(blocked).toContain('Correct the rows with errors in the file, or skip them')
    const skipped = text(render(<ImportWizard {...WIZARD} skipInvalid />))
    expect(skipped).not.toContain('Correct the rows with errors')
    expect(skipped).toContain('Import 1.198 rows')
  })

  it('names the required fields without a column, and the unused columns', () => {
    const html = text(
      render(<ImportWizard {...WIZARD} step="columns" mapping={{ name: 'c1', taxId: null }} />),
    )
    expect(html).toContain('Choose a column for Tax number')
    expect(html).toContain('Not imported: PIB, Napomena')
  })

  it('shows the accepted types before a file is chosen, and the progress while importing', () => {
    expect(text(render(<ImportWizard {...WIZARD} step="file" />))).toContain(
      'CSV or Excel, up to 10 MB',
    )
    const html = text(
      render(<ImportWizard {...WIZARD} step="import" progress={{ done: 312, total: 1284 }} />),
    )
    expect(html).toContain('312 of 1.284')
  })

  it('on phones: one line for the step, Cancel as the header X, the reason under the buttons', () => {
    const html = render(<ImportWizard {...WIZARD} layout="phone" onCancel={() => undefined} />)
    expect(text(html)).toContain('Step 3 of 4 · Check')
    expect(html).not.toContain('<ol')
    expect(html).toContain('aria-label="Cancel the import"')
    expect(html).not.toMatch(/<button[^>]*>(<[^>]+>)*\s*Cancel\s*</)
    // The reason is one line under the row, and it describes the Import button.
    const note = /<p id="([^"]+)"[^>]*>Unavailable: Correct the rows/.exec(html)
    expect(note).not.toBeNull()
    expect(html).toContain(`aria-describedby="${note?.[1] ?? ''}"`)
  })

  it('on desktop: Cancel at the start of the buttons, the steps as a row', () => {
    const html = render(<ImportWizard {...WIZARD} onCancel={() => undefined} />)
    expect(html).toContain('<ol')
    expect(text(html)).toContain(' Cancel ')
    expect(html).not.toContain('Cancel the import')
  })
})

describe('DuplicateWarning', () => {
  it('lists the existing records as links with kind and number, and offers both choices', () => {
    const html = render(
      <DuplicateWarning
        message="Same tax number: 104987265."
        matches={[
          {
            key: 'k1',
            type: 'Customer',
            number: 'Panonija Agro d.o.o.',
            href: '#/sales/customers/104987265',
          },
        ]}
        onCreateAnyway={() => undefined}
      />,
    )
    expect(html).toContain('href="#/sales/customers/104987265"')
    expect(text(html)).toContain('Open existing')
    expect(text(html)).toContain('Create anyway')
    expect(html).toContain('role="alert"')
  })
})

interface Injury {
  id: string
  no: string
  name: string
  corrects?: string
  correctedBy?: string
  locked?: boolean
}

describe('RegisterPage', () => {
  it('marks corrections both ways and locked periods with their reason', () => {
    const rows: Injury[] = [
      { id: '14', no: '14', name: 'Marko Đorđević', correctedBy: '27', locked: true },
      { id: '27', no: '27', name: 'Marko Đorđević', corrects: '14' },
    ]
    const html = text(
      render(
        <RegisterPage
          layout="desktop"
          title="Work-injury register 2026"
          locks={[
            {
              key: 'h1',
              period: 'January–June 2026',
              reason: 'Reported to the labour inspection',
            },
          ]}
          columns={[{ id: 'name', header: 'Employee', cell: (row: Injury) => row.name }]}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.no}
          entry={(row) => ({
            number: row.no,
            ...(row.corrects === undefined ? {} : { corrects: row.corrects }),
            ...(row.correctedBy === undefined ? {} : { correctedBy: row.correctedBy }),
            ...(row.locked === undefined ? {} : { locked: row.locked }),
          })}
        />,
      ),
    )
    expect(html).toContain('January–June 2026 is locked')
    expect(html).toContain('Reported to the labour inspection')
    expect(html).toContain('Corrected by no. 27')
    expect(html).toContain('Corrects no. 14')
    expect(html).toContain('Locked')
  })

  it('links both corrections to the other entry, the same way (P5.23)', () => {
    const rows: Injury[] = [
      { id: '14', no: '14', name: 'Marko Đorđević', correctedBy: '27' },
      { id: '27', no: '27', name: 'Marko Đorđević', corrects: '14' },
      { id: '30', no: '30', name: 'Ana Ilić', corrects: '3' },
    ]
    const page = (onGoToEntry?: (number: string) => void) =>
      render(
        <RegisterPage
          layout="desktop"
          title="Register"
          columns={[{ id: 'name', header: 'Employee', cell: (row: Injury) => row.name }]}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.no}
          loading={false}
          entry={(row) => ({
            number: row.no,
            ...(row.corrects === undefined ? {} : { corrects: row.corrects }),
            ...(row.correctedBy === undefined ? {} : { correctedBy: row.correctedBy }),
          })}
          {...(onGoToEntry === undefined ? {} : { onGoToEntry })}
        />,
      )
    const html = page()
    const link = (name: string) =>
      new RegExp(`<a href="#[^"]*-entry-([0-9]+)" class="([^"]*)">${name}</a>`).exec(html)
    const corrects = link('Corrects no. 14')
    const correctedBy = link('Corrected by no. 27')
    expect(corrects?.[1]).toBe('14')
    expect(correctedBy?.[1]).toBe('27')
    // The same look for both: no badge.
    expect(corrects?.[2]).toBe(correctedBy?.[2])
    expect(html).not.toContain('data-tone=')
    // Each number is the anchor the links go to.
    expect(html).toMatch(/id="[^"]*-entry-14" tabindex="-1"/)
    // An entry that is not among the rows: plain text, a link with `onGoToEntry`.
    expect(html).toContain('<span class="text-secondary bidi-isolate">Corrects no. 3</span>')
    expect(page(() => undefined)).toMatch(/<a href="#[^"]*-entry-3"/)
    // The refetch loader is in the first row; no slot between the locks and the table.
    expect(html.match(/data-slot="refetch-loader"/g)).toHaveLength(1)
    expect(html.indexOf('data-slot="refetch-loader"')).toBeLessThan(html.indexOf('<table'))
  })
})

describe('StatutoryFormPage', () => {
  const sections: StatutorySection[] = [
    {
      key: 'part3',
      title: 'Part 3. Input tax',
      columns: [
        { id: 'base20', label: 'Base', group: 'General rate 20%' },
        { id: 'vat20', label: 'VAT', group: 'General rate 20%' },
        { id: 'base10', label: 'Base', group: 'Special rate 10%' },
        { id: 'vat10', label: 'VAT', group: 'Special rate 10%' },
      ],
      items: [
        {
          key: '3.1',
          number: '3.1',
          title: 'Purchases in the Republic',
          items: [
            {
              id: '3.1.1',
              number: '3.1.1',
              label: 'Received e-invoices',
              cells: {
                base20: { kind: 'source', value: '600000.00', sources: [] },
                vat20: {
                  kind: 'source',
                  value: '121200.00',
                  previous: '98000.00',
                  override: {
                    computed: '120000.00',
                    by: 'Ivana Stojanović',
                    at: '05.10.2026. 14:12',
                  },
                },
              },
            },
            {
              id: '3.1.3',
              number: '3.1.3',
              label: 'Correction',
              cells: {
                vat20: { kind: 'entered', value: '12.00', field: <input aria-label="F" /> },
              },
            },
          ],
        },
      ],
    },
  ]
  it('draws the groups over their columns, absent cells blank, the override and the checks', () => {
    const html = render(
      <StatutoryFormPage
        layout="desktop"
        title="VAT return, September 2026"
        currency="RSD"
        currentLabel="September 2026"
        previousLabel="August 2026"
        defaultCompare
        lang="sr-Cyrl"
        sections={sections}
        rules={[
          {
            id: 'r1',
            text: '3.1.4 must equal 3.1.1 + 3.1.2 − 3.1.3',
            fields: ['3.1.1/vat20'],
            result: 'failed',
            detail: 'Difference: 1.200,00 RSD',
          },
          { id: 'r2', text: '2.3 must equal 2.1 + 2.2', fields: ['2.3'], result: 'passed' },
        ]}
        onUseComputed={() => undefined}
      />,
    )
    const words = text(html)
    expect(words).toContain('1 check failed · 1 check passed')
    expect(words).toContain(
      'Check failed: 3.1.4 must equal 3.1.1 + 3.1.2 − 3.1.3 · Difference: 1.200,00 RSD',
    )
    expect(words).toContain('Go to 3.1.1')
    expect(words).toContain('Changed manually')
    expect(words).toContain('By Ivana Stojanović on 05.10.2026. 14:12')
    expect(words).toContain('Computed: RSD 120.000,00')
    expect(words).toContain('Use computed value')
    expect(words).toContain('Compare with August 2026')
    expect(words).toContain('August 2026: RSD 98.000,00')
    expect(html).toContain('colSpan="2"')
    expect(html.match(/data-cell-kind="absent"/g)).toHaveLength(5)
    expect(html).toContain('lang="sr-Cyrl"')
    // An entered cell is the application's field.
    expect(html).toContain('aria-label="F"')
  })

  it('offers no way back and no fields on a submitted form', () => {
    const html = render(
      <StatutoryFormPage
        layout="desktop"
        title="VAT return, September 2026"
        currency="RSD"
        currentLabel="September 2026"
        sections={sections}
        onUseComputed={() => undefined}
        readOnly
      />,
    )
    expect(text(html)).toContain('Changed manually')
    expect(text(html)).not.toContain('Use computed value')
    expect(html).not.toContain('aria-label="F"')
    expect(text(html)).toContain('RSD 12,00')
    // No comparison without a previous period.
    expect(text(html)).not.toContain('Compare with')
  })

  it('labels each value with its group and column on phones', () => {
    const html = text(
      render(
        <StatutoryFormPage
          layout="phone"
          title="VAT return"
          currency="RSD"
          currentLabel="September 2026"
          sections={sections}
          defaultCollapsed={['3.1']}
        />,
      ),
    )
    // The group is collapsed: its rows are not drawn.
    expect(html).toContain('3.1 Purchases in the Republic')
    expect(html).not.toContain('Received e-invoices')
    const open = text(
      render(
        <StatutoryFormPage
          layout="phone"
          title="VAT return"
          currency="RSD"
          currentLabel="September 2026"
          sections={sections}
        />,
      ),
    )
    expect(open).toContain('General rate 20% · Base')
    expect(open).not.toContain('Special rate 10% · Base')
  })
})

// P5.45 ledger: a column without figures (a financial statement's "Note") shows the content.
describe('StatutoryFormPage content cells', () => {
  it('shows the application content in place of an amount, on desktop and on phones', () => {
    const sections: StatutorySection[] = [
      {
        key: 'assets',
        title: 'Assets',
        columns: [
          { id: 'note', label: 'Note' },
          { id: 'current', label: '30.09.2026.' },
        ],
        items: [
          {
            id: '0010',
            number: '0010',
            label: 'Property, plant and equipment',
            cells: {
              note: { kind: 'computed', value: null, content: <a href="#note-5">Note 5</a> },
              current: { kind: 'computed', value: '74390400.00' },
            },
          },
        ],
      },
    ]
    for (const layout of ['desktop', 'phone'] as const) {
      const html = render(
        <StatutoryFormPage
          layout={layout}
          title="Balance sheet"
          currency="RSD"
          currentLabel="30.09.2026."
          sections={sections}
        />,
      )
      expect(html).toContain('<a href="#note-5">Note 5</a>')
      // The content takes the amount's place: no "—" for the empty value.
      expect(text(html)).not.toContain('—')
      expect(text(html)).toContain('RSD 74.390.400,00')
    }
  })
})

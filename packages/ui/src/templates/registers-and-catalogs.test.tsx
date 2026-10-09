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
})

describe('StatutoryFormPage', () => {
  const sections: StatutorySection[] = [
    {
      key: '5',
      title: '5. Input tax',
      fields: [
        { id: '5.1', number: '5.1', label: 'Input tax, general rate', value: '120000.00' },
        {
          id: '5.4',
          number: '5.4',
          label: 'Total input tax',
          value: '121200.00',
          previous: '98000.00',
          total: true,
          override: { computed: '120000.00', by: 'Ivana Stojanović', at: '05.10.2026. 14:12' },
        },
      ],
    },
  ]
  it('shows the override with who, when and the computed value, and the checks', () => {
    const html = text(
      render(
        <StatutoryFormPage
          layout="desktop"
          title="VAT return, September 2026"
          currency="RSD"
          currentLabel="September 2026"
          previousLabel="August 2026"
          sections={sections}
          rules={[
            {
              id: 'r1',
              text: '5.4 must equal 5.1 + 5.2 + 5.3',
              fields: ['5.4'],
              result: 'failed',
              detail: 'Difference: 1.200,00 RSD',
            },
            { id: 'r2', text: '3.6 must equal 3.2 × 20%', fields: ['3.6'], result: 'passed' },
          ]}
          onUseComputed={() => undefined}
        />,
      ),
    )
    expect(html).toContain('1 check failed · 1 check passed')
    expect(html).toContain(
      'Check failed: 5.4 must equal 5.1 + 5.2 + 5.3 · Difference: 1.200,00 RSD',
    )
    expect(html).toContain('Go to 5.4')
    expect(html).toContain('Changed manually')
    expect(html).toContain('By Ivana Stojanović on 05.10.2026. 14:12')
    expect(html).toContain('Computed: RSD 120.000,00')
    expect(html).toContain('Use computed value')
    expect(html).toContain('August 2026')
  })

  it('offers no way back on a submitted form', () => {
    const html = text(
      render(
        <StatutoryFormPage
          layout="desktop"
          title="VAT return, September 2026"
          currency="RSD"
          currentLabel="September 2026"
          sections={sections}
          onUseComputed={() => undefined}
          readOnly
        />,
      ),
    )
    expect(html).toContain('Changed manually')
    expect(html).not.toContain('Use computed value')
  })
})

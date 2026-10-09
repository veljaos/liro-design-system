import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Alert } from './alert'
import {
  csvColumns,
  IMPORT_COUNTS,
  IMPORT_CSV,
  IMPORT_FIELDS,
  IMPORT_PREVIEW,
  IMPORT_SUGGESTION,
  readFileText,
} from './catalog-story-data'
import type { ImportMapping } from './catalog-logic'
import { DuplicateWarning } from './duplicate-warning'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { ImportWizard, type ImportStep } from './import-wizard'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application around the wizard: it reads the file, suggests, checks and imports. */
function Import({
  step: startStep = 'file',
  chosen = false,
  mapping: startMapping = IMPORT_SUGGESTION,
  previewLoading = false,
  progress,
  done = false,
  fileError,
  clean = false,
  layout,
  acceptText = 'CSV (separated by ; or ,) or Excel (.xlsx); the first row holds the column names',
}: {
  step?: ImportStep
  chosen?: boolean
  mapping?: ImportMapping
  previewLoading?: boolean
  progress?: { done: number; total: number }
  done?: boolean
  fileError?: string
  /** Every row passed the check. */
  clean?: boolean
  layout?: 'desktop' | 'phone'
  acceptText?: string
}) {
  const [step, setStep] = useState<ImportStep>(startStep)
  const [file, setFile] = useState(
    chosen
      ? { name: 'kupci-oktobar-2026.csv', description: '1.213 rows, 8 columns, 96 KB' }
      : undefined,
  )
  const [columns, setColumns] = useState(chosen ? csvColumns(IMPORT_CSV) : [])
  const [mapping, setMapping] = useState<ImportMapping>(chosen ? startMapping : {})
  const [problemsOnly, setProblemsOnly] = useState(clean)
  const [skipInvalid, setSkipInvalid] = useState(false)
  const all = clean ? IMPORT_PREVIEW.map((row) => ({ ...row, issues: [] })) : IMPORT_PREVIEW
  const rows = problemsOnly ? all.filter((row) => row.issues.length > 0) : all
  return (
    <ImportWizard
      step={step}
      onStepChange={setStep}
      accept=".csv,text/csv,.xlsx"
      acceptText={acceptText}
      maxSize={10 * 1024 * 1024}
      maxSizeText="10 MB"
      onFileChoose={(chosenFile) => {
        void readFileText(chosenFile).then((text) => {
          const read = csvColumns(text)
          setColumns(read)
          setMapping(IMPORT_SUGGESTION)
          setFile({
            name: chosenFile.name,
            description: `${String(text.split('\n').length - 1)} rows, ${String(read.length)} columns`,
          })
        })
      }}
      {...(file === undefined ? {} : { file })}
      {...(fileError === undefined ? {} : { fileError })}
      sourceColumns={columns}
      fields={IMPORT_FIELDS}
      mapping={mapping}
      onMappingChange={setMapping}
      suggested={Object.keys(IMPORT_SUGGESTION)}
      previewRows={rows}
      counts={clean ? { ready: 1213, errors: 0 } : IMPORT_COUNTS}
      problemsOnly={problemsOnly}
      onProblemsOnlyChange={setProblemsOnly}
      skipInvalid={skipInvalid}
      onSkipInvalidChange={setSkipInvalid}
      previewLoading={previewLoading}
      previewNotice={
        clean ? undefined : (
          <DuplicateWarning
            title="3 rows match existing customers"
            message="Line 2 has the tax number of Panonija Agro d.o.o.; they are not imported unless you choose otherwise."
            matches={[
              {
                key: 'panonija',
                type: 'Customer',
                number: 'Panonija Agro d.o.o.',
                href: '#customers/104987265',
              },
            ]}
            onCreateAnyway={() => undefined}
            createAnywayLabel="Import anyway"
          />
        )
      }
      onImport={() => {
        setStep('import')
      }}
      {...(progress === undefined ? {} : { progress })}
      {...(done
        ? {
            result: (
              <Alert tone="success" title="1.198 customers imported">
                12 rows with errors were skipped; 3 rows that match existing customers were not
                imported.
              </Alert>
            ),
          }
        : {})}
      onCancel={() => undefined}
      {...(layout === undefined ? {} : { layout })}
    />
  )
}

const meta = {
  title: 'Components/Catalogs/ImportWizard',
  component: ImportWizard,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** records from a CSV or Excel file, in four steps — **File** (the ' +
          'accepted types and the size limit shown before choosing), **Columns** (each field of ' +
          'the catalogue gets a column of the file: suggested by the application, required ' +
          'fields marked, a sample value), **Check** (a validation preview before anything is ' +
          'saved: the counts with their nouns, each row’s problems in its cells, "Only rows with ' +
          'problems", "Skip rows with errors", a DuplicateWarning) and **Import** (the progress, ' +
          'then the application’s report). The application reads and checks the file and moves ' +
          'the steps; the wizard decides nothing about the data.\n\n' +
          '**When:** bringing many records into a catalogue at once (a customer list from the old ' +
          'system).\n\n' +
          '**When not:** one record (the record form); changing a field of records already in ' +
          'the catalogue (BulkEditDrawer). The file button becomes FileDropzone (P5.5) and the ' +
          'progress JobProgress (P5.4) when those land.',
      },
    },
  },
  args: {
    step: 'file',
    onStepChange: () => undefined,
    accept: '',
    acceptText: '',
    onFileChoose: () => undefined,
    sourceColumns: [],
    fields: [],
    mapping: {},
    onMappingChange: () => undefined,
    previewRows: [],
    counts: { ready: 0, errors: 0 },
    problemsOnly: false,
    onProblemsOnlyChange: () => undefined,
    skipInvalid: false,
    onSkipInvalidChange: () => undefined,
    onImport: () => undefined,
  },
  render: () => (
    <ExampleProvider>
      <Import />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ImportWizard>

export default meta

type Story = StoryObj<typeof meta>

/** The first step: what may be chosen; choosing a file (here uploaded by the test) reads it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/up to 10 MB/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled()
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('no file input')
    await userEvent.upload(input, new File([IMPORT_CSV], 'kupci.csv', { type: 'text/csv' }))
    await expect(await canvas.findByText('kupci.csv')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(await canvas.findByRole('table', { name: 'Columns' })).toBeVisible()
  },
}

/**
 * Columns: the suggestion is in place but the tax number has no column, so Next is unavailable
 * and says why; choosing the column makes it available.
 */
export const Columns: Story = {
  render: () => (
    <ExampleProvider>
      <Import step="columns" chosen mapping={{ ...IMPORT_SUGGESTION, taxId: null }} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/Choose a column for Tax number/)).toBeVisible()
    await expect(canvas.getByText('Not imported: PIB, Napomena')).toBeVisible()
    await userEvent.click(canvas.getByRole('combobox', { name: 'Column for Tax number' }))
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole('option', { name: 'PIB' }),
    )
    await waitFor(() => expect(canvas.queryByText(/Choose a column for Tax number/)).toBeNull())
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeEnabled()
    await settle()
  },
}

/**
 * Check: the counts, the duplicate warning, the problems in their cells. Import is unavailable
 * until the rows with errors are skipped; "Only rows with problems" narrows the table.
 */
export const Check: Story = {
  render: () => (
    <ExampleProvider>
      <Import step="check" chosen />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1.198 rows ready')).toBeVisible()
    await expect(canvas.getByText('12 with errors')).toBeVisible()
    await expect(canvas.getByText('3 duplicates')).toBeVisible()
    await expect(canvas.getByText('A tax number has 9 digits')).toBeVisible()
    await expect(
      canvas.getByText('Unavailable: Correct the rows with errors in the file, or skip them'),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Skip rows with errors' }))
    await expect(canvas.getByRole('button', { name: 'Import 1.198 rows' })).toBeEnabled()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Only rows with problems' }))
    await expect(canvas.queryByRole('row', { name: /Lazić Beton/ })).toBeNull()
  },
}

/** The preview while the application is still checking the file. */
export const Checking: Story = {
  render: () => (
    <ExampleProvider>
      <Import step="check" chosen previewLoading />
    </ExampleProvider>
  ),
}

/** Importing: the progress through the format ("312 of 1.284"). */
export const Importing: Story = {
  render: () => (
    <ExampleProvider>
      <Import step="import" chosen progress={{ done: 312, total: 1198 }} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('312 of 1.198')).toBeVisible()
    await expect(within(canvasElement).getByRole('progressbar')).toBeVisible()
  },
}

/** Done: the application's report in place of the buttons. */
export const Done: Story = {
  render: () => (
    <ExampleProvider>
      <Import step="import" chosen progress={{ done: 1198, total: 1198 }} done />
    </ExampleProvider>
  ),
}

/** The file could not be read: the application's words, in the danger colour with its icon. */
export const FileError: Story = {
  name: 'File error',
  render: () => (
    <ExampleProvider>
      <Import fileError="kupci.pdf is not a CSV or Excel file." />
    </ExampleProvider>
  ),
}

/** Every row passed the check: "Only rows with problems" says that none is left. */
export const NoProblems: Story = {
  name: 'No problems',
  render: () => (
    <ExampleProvider>
      <Import step="check" chosen clean />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No row has a problem.')).toHaveAttribute('role', 'status')
    await expect(canvas.getByRole('button', { name: 'Import 1.213 rows' })).toBeEnabled()
  },
}

/** Long text wraps: the accepted types, the file's name. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Import acceptText={`${LONG.description} ${LONG.description}`} />
    </ExampleProvider>
  ),
}

/** Phone width: the mapping and the preview as flat lists; nothing scrolls sideways. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto p-4">
          <Import step="check" chosen layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const wizard = canvasElement.querySelector('[data-slot="import-wizard"]')
    await expect(wizard?.scrollWidth).toBeLessThanOrEqual(wizard?.clientWidth ?? 0)
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Import step="columns" chosen acceptText={ARABIC.description} />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Import acceptText={JAPANESE.description} />
    </StoryProvider>
  ),
}

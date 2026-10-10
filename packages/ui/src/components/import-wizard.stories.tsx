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
          '**Phones** (P5.23): "Step 3 of 4 · Check" over a thin bar, the counts as a list, ONE ' +
          'sticky row of Back and the main action (an unavailable reason on one line under it), ' +
          'and Cancel as the X in the header; leaving a chosen file asks first.\n\n' +
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
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
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
    await settle()
  },
}

export const ColumnsInteraction: Story = {
  name: 'Columns, interaction',
  tags: ['interaction'],
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
    // The option list closes with an animation; until then the rest of the page is hidden.
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Next' })).toBeEnabled())
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
    await settle()
  },
}

export const CheckInteraction: Story = {
  name: 'Check, interaction',
  tags: ['interaction'],
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

/** The wizard in a phone frame, scrolling inside it as a page does. */
function OnPhone(props: Parameters<typeof Import>[0]) {
  return (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto p-4">
          <Import {...props} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  )
}

/** Back and the main action stand in ONE row (the same top), the main action last. */
async function oneFooterRow(canvasElement: HTMLElement) {
  const footer = canvasElement.querySelector('[data-slot="wizard-footer"]')
  const buttons = [...(footer?.querySelectorAll('button') ?? [])]
  const tops = new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top)))
  await expect(tops.size).toBe(1)
}

/**
 * Phone width (P5.23): "Step 3 of 4 · Check" over a thin bar, the counts as a list, the mapping
 * and the preview as flat lists; ONE sticky row of Back and Import with the reason under it;
 * Cancel is the X in the header, and it asks before leaving a chosen file. Nothing scrolls
 * sideways.
 */
export const PhoneWidth: Story = {
  name: 'Phone width (Check)',
  render: () => <OnPhone step="check" chosen />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const wizard = canvasElement.querySelector('[data-slot="import-wizard"]')
    await expect(wizard?.scrollWidth).toBeLessThanOrEqual(wizard?.clientWidth ?? 0)
    await expect(canvasElement.querySelector('[data-slot="stepper"]')).toHaveTextContent(
      'Step 3 of 4 · Check',
    )
    await expect(canvas.queryByRole('button', { name: 'Cancel' })).toBeNull()
    await oneFooterRow(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Import 1.198 rows' }),
    ).toHaveAccessibleDescription(
      'Unavailable: Correct the rows with errors in the file, or skip them',
    )
    await settle()
  },
}

export const PhoneWidthInteraction: Story = {
  name: 'Phone width (Check), interaction',
  tags: ['interaction'],
  render: () => <OnPhone step="check" chosen />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const wizard = canvasElement.querySelector('[data-slot="import-wizard"]')
    await expect(wizard?.scrollWidth).toBeLessThanOrEqual(wizard?.clientWidth ?? 0)
    await expect(canvasElement.querySelector('[data-slot="stepper"]')).toHaveTextContent(
      'Step 3 of 4 · Check',
    )
    await expect(canvas.queryByRole('button', { name: 'Cancel' })).toBeNull()
    await oneFooterRow(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Import 1.198 rows' }),
    ).toHaveAccessibleDescription(
      'Unavailable: Correct the rows with errors in the file, or skip them',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel the import' }))
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('alertdialog', { name: 'Leave the import?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Stay' }))
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
  },
}

/** Phone, File: "Step 1 of 4 · File"; Next alone in the footer row. */
export const PhoneFile: Story = {
  name: 'Phone width (File)',
  render: () => <OnPhone />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="stepper"]')).toHaveTextContent(
      'Step 1 of 4 · File',
    )
  },
}

/** Phone, Columns: Back and the unavailable Next in one row, the reason on one line under it. */
export const PhoneColumns: Story = {
  name: 'Phone width (Columns)',
  render: () => <OnPhone step="columns" chosen mapping={{ ...IMPORT_SUGGESTION, taxId: null }} />,
  play: async ({ canvasElement }) => {
    await settle()
    await oneFooterRow(canvasElement)
    await expect(
      within(canvasElement).getByText('Unavailable: Choose a column for Tax number'),
    ).toBeVisible()
  },
}

/** Phone, Checking: the preview while the application checks the file. */
export const PhoneChecking: Story = {
  name: 'Phone width (Checking)',
  render: () => <OnPhone step="check" chosen previewLoading />,
}

/** Phone, Importing: "Step 4 of 4 · Import", the progress; no buttons and no close button. */
export const PhoneImporting: Story = {
  name: 'Phone width (Importing)',
  render: () => <OnPhone step="import" chosen progress={{ done: 312, total: 1198 }} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="wizard-footer"]')).toBeNull()
    await expect(
      within(canvasElement).queryByRole('button', { name: 'Cancel the import' }),
    ).toBeNull()
  },
}

/** Phone, Done: the application's report. */
export const PhoneDone: Story = {
  name: 'Phone width (Done)',
  render: () => <OnPhone step="import" chosen progress={{ done: 1198, total: 1198 }} done />,
}

/** Phone, File error: the application's words under the drop area. */
export const PhoneFileError: Story = {
  name: 'Phone width (File error)',
  render: () => <OnPhone fileError="kupci.pdf is not a CSV or Excel file." />,
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

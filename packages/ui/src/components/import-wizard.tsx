import { CircleCheck, CircleX, Copy, TriangleAlert, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { UnavailableAction } from './actions'
import { Button } from './button'
import {
  assignColumn,
  importBlocked,
  issuesOf,
  missingRequired,
  unusedColumns,
  type ImportCounts,
  type ImportField,
  type ImportIssue,
  type ImportMapping,
  type ImportPreviewRow,
  type ImportSourceColumn,
} from './catalog-logic'
import { CheckboxField } from './checkbox-field'
import { DataTable, type DataTableColumn } from './data-table'
import { FileDropzone } from './file-dropzone'
import { JobProgress } from './job-progress'
import { Stepper } from './progress'
import { SelectField } from './select-field'
import { Spinner } from './spinner'
import { usePhone } from './use-phone'

/*
 * ImportWizard (BUILD-PLAN P5.19, bulk work on catalogue lists): records from a CSV or Excel
 * file in four steps — File, Columns, Check, Import — with nothing saved before the last one.
 * One card: the Stepper as its first row, the step's content, and the buttons at the bottom
 * (Back, then the step's main action last; Cancel at the start when the application offers it).
 * - **File:** what the file may be (types, size, the first row as headings — the application's
 *   text) is shown BEFORE choosing; a button chooses the file (a plain file input until
 *   FileDropzone, P5.5, replaces it); the application reads it (`reading`) and reports its name
 *   and size in words, or an error.
 * - **Columns:** one row per catalogue field — the field (required ones marked), the file's
 *   column that fills it (a select; "Not imported" when none), a sample value from that column.
 *   The application suggests a mapping (`suggested` marks those fields); a column fills one field
 *   only; the file's columns no field takes are listed. Next stays unavailable, with the missing
 *   fields named, while a required field has no column.
 * - **Check (a validation preview, nothing saved):** the counts from the application ("1.198 rows
 *   ready · 12 with errors · 3 duplicates", each through `format.number` with its noun), a notice
 *   slot (DuplicateWarning), "Only rows with problems" (the application filters) and "Skip rows
 *   with errors"; the rows with their line in the file, each value in its field's column with its
 *   problems under it (icon and words in the tone's colour), and the row's own problems. Import
 *   stays unavailable while rows have errors and they are not skipped.
 * - **File:** a FileDropzone for one file (the button, or a drop), the types and the size limit
 *   said before choosing, the file checked again on the device (P5.5).
 * - **Import:** JobProgress while it runs ("312 of 1.284", P5.4), then the application's report.
 * The parsing and the checking are the application's; the wizard decides nothing about the data.
 */

export type ImportStep = 'file' | 'columns' | 'check' | 'import'

/** The steps in order. */
export const IMPORT_STEPS: readonly ImportStep[] = ['file', 'columns', 'check', 'import']

/** The chosen file, as the application describes it. */
export interface ImportFile {
  /** The file's name ("kupci-oktobar.xlsx"). */
  name: string
  /** What the application read, in its words ("1.213 rows, 9 columns, 84 KB"). */
  description?: string
}

/** The import's progress: rows done of all. */
export interface ImportProgress {
  done: number
  total: number
}

export interface ImportWizardProps {
  /** The current step: the application moves it (Next, Back, Import call `onStepChange`). */
  step: ImportStep
  onStepChange: (step: ImportStep) => void
  /** The file input's `accept` ("text/csv,.csv,.xlsx"). */
  accept: string
  /** The accepted types in words, shown before choosing ("CSV or Excel (.xlsx)"). */
  acceptText: string
  /** The largest file in bytes; a larger one is refused on the device. */
  maxSize?: number
  /** The limit in words ("10 MB"), shown before choosing. */
  maxSizeText?: string
  /** A file was chosen: the application reads it. */
  onFileChoose: (file: File) => void
  /** The file the application read. */
  file?: ImportFile
  /** The application is reading the file. */
  reading?: boolean
  /** The file could not be read, in the application's words. */
  fileError?: string
  /** The file's columns, as the application read them. */
  sourceColumns: readonly ImportSourceColumn[]
  /** The catalogue's fields a column can fill, in the form's order. */
  fields: readonly ImportField[]
  /** The field → column mapping (start with the application's suggestion). */
  mapping: ImportMapping
  onMappingChange: (mapping: Record<string, string | null>) => void
  /** The fields whose column the application suggested (marked "Suggested"). */
  suggested?: readonly string[]
  /** The rows of the validation preview (the application filters with `problemsOnly`). */
  previewRows: readonly ImportPreviewRow[]
  /** The whole file's counts, from the application. */
  counts: ImportCounts
  /** Only rows with an error or a warning are shown (the application filters). */
  problemsOnly: boolean
  onProblemsOnlyChange: (on: boolean) => void
  /** Rows with errors are left out of the import. */
  skipInvalid: boolean
  onSkipInvalidChange: (on: boolean) => void
  /** The application is checking the file. */
  previewLoading?: boolean
  /** Above the preview: a DuplicateWarning, or another Alert from the application. */
  previewNotice?: ReactNode
  /** Starts the import (the application then moves to 'import'). */
  onImport: () => void
  /** The import's progress while it runs. */
  progress?: ImportProgress
  /** The final report, from the application, when the import has ended. */
  result?: ReactNode
  /** Offers Cancel at the start of the buttons (leaving the import; nothing has been saved). */
  onCancel?: () => void
  /** 'phone' forces the phone layout (cards); default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const TONE_TEXT = { danger: 'text-status-danger-fg', warning: 'text-status-warning-fg' } as const

/** Problems as lines: an icon and the application's words in the tone's colour. */
function Issues({ issues }: { issues: readonly ImportIssue[] }) {
  if (issues.length === 0) return null
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {issues.map((issue, index) => {
        const Icon = issue.tone === 'danger' ? CircleX : TriangleAlert
        return (
          <li
            key={index}
            className={cn(
              'flex items-start gap-1 text-xs whitespace-normal',
              TONE_TEXT[issue.tone],
            )}
          >
            <Icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{issue.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** The required mark of a field: " *" for the eye, "Required" for assistive technology. */
function RequiredMark() {
  const { messages } = useLiro()
  return (
    <>
      <span aria-hidden="true" title={messages['field.required']} className="text-status-danger-fg">
        {' *'}
      </span>
      <span className="sr-only">{` (${messages['field.required']})`}</span>
    </>
  )
}

/** Records from a file, in four steps, with a validation preview before anything is saved. */
export function ImportWizard(props: ImportWizardProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const index = IMPORT_STEPS.indexOf(props.step)
  const steps = [
    { label: messages['import.stepFile'] },
    { label: messages['import.stepColumns'] },
    { label: messages['import.stepCheck'] },
    { label: messages['import.stepImport'] },
  ]
  const count = (value: number) => format.number(String(value))
  const missing = missingRequired(props.fields, props.mapping)
  const unused = unusedColumns(props.sourceColumns, props.mapping)
  const columnById = new Map(props.sourceColumns.map((column) => [column.id, column]))
  const go = (step: ImportStep) => {
    props.onStepChange(step)
  }

  // ── The steps' content ──
  const fileStep = (
    <div className="flex flex-col items-start gap-3">
      <FileDropzone
        label={messages['import.stepFile']}
        hideLabel
        className="w-full"
        accept={props.accept.split(',').map((type) => type.trim())}
        acceptText={props.acceptText}
        {...(props.maxSize === undefined ? {} : { maxSize: props.maxSize })}
        {...(props.maxSizeText === undefined ? {} : { maxSizeText: props.maxSizeText })}
        multiple={false}
        {...(props.fileError === undefined ? {} : { error: props.fileError })}
        {...(props.layout === undefined ? {} : { layout: props.layout })}
        onFiles={(files) => {
          const chosen = files[0]
          if (chosen !== undefined && props.reading !== true) props.onFileChoose(chosen)
        }}
      />
      {props.reading === true && <Spinner size="sm">{messages['field.loading']}</Spinner>}
      {props.file !== undefined && props.reading !== true && (
        <p className="m-0 flex min-w-0 flex-col gap-0.5">
          <span className={cn('text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}>
            {props.file.name}
          </span>
          {props.file.description !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
              {props.file.description}
            </span>
          )}
        </p>
      )}
    </div>
  )

  const suggested = new Set(props.suggested ?? [])
  const mappingColumns: DataTableColumn<ImportField>[] = [
    {
      id: 'field',
      header: messages['import.field'],
      cell: (field) => (
        <span className="flex flex-col gap-0.5 whitespace-normal">
          <span className="font-semibold">
            {field.label}
            {field.required === true && <RequiredMark />}
          </span>
          {field.description !== undefined && (
            <span className="text-xs text-secondary">{field.description}</span>
          )}
        </span>
      ),
    },
    {
      id: 'column',
      header: messages['import.column'],
      cell: (field) => {
        const column = props.mapping[field.id] ?? null
        return (
          <span className="flex min-w-50 flex-col gap-0.5 whitespace-normal">
            <SelectField
              label={messages['import.columnFor'](field.label)}
              hideLabel
              clearable
              placeholder={messages['import.notImported']}
              options={props.sourceColumns.map((each) => ({ value: each.id, label: each.name }))}
              value={column ?? ''}
              onChange={(value) => {
                props.onMappingChange(
                  assignColumn(props.mapping, field.id, value === '' ? null : value),
                )
              }}
            />
            {column !== null && suggested.has(field.id) && (
              <span className="text-xs text-tertiary">{messages['import.suggested']}</span>
            )}
          </span>
        )
      },
    },
    {
      id: 'sample',
      header: messages['import.sample'],
      cell: (field) => {
        const column = props.mapping[field.id] ?? null
        const sample = column === null ? undefined : columnById.get(column)?.sample
        return <span className="text-secondary">{sample ?? '—'}</span>
      },
    },
  ]
  const columnsStep = (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 border-0 border-y border-solid border-default">
        <DataTable
          label={messages['import.stepColumns']}
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={mappingColumns}
          rows={props.fields}
          getRowId={(field) => field.id}
          getRowLabel={(field) => field.label}
          mobile={{
            title: (field) => (
              <>
                {field.label}
                {field.required === true && <RequiredMark />}
              </>
            ),
            details: ['column', 'sample'],
          }}
        />
      </div>
      {unused.length > 0 && (
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['import.unusedColumns'](unused.map((column) => column.name).join(', '))}
        </p>
      )}
    </div>
  )

  const shownFields = props.fields.filter((field) => (props.mapping[field.id] ?? null) !== null)
  const previewColumns: DataTableColumn<ImportPreviewRow>[] = [
    {
      id: 'line',
      header: messages['import.line'],
      numeric: true,
      align: 'end',
      cell: (row) => count(row.line),
    },
    ...shownFields.map((field): DataTableColumn<ImportPreviewRow> => ({
      id: field.id,
      header: field.label,
      cell: (row) => (
        <span className="flex flex-col gap-0.5">
          <span>{row.values[field.id] ?? ''}</span>
          <Issues issues={issuesOf(row, field.id)} />
        </span>
      ),
    })),
    {
      id: 'problems',
      header: messages['import.problems'],
      cell: (row) => <Issues issues={issuesOf(row, undefined)} />,
    },
  ]
  const tally = [
    {
      key: 'ready',
      icon: CircleCheck,
      tone: 'text-status-success-fg',
      text: messages['import.ready'](props.counts.ready, count(props.counts.ready)),
      shown: true,
    },
    {
      key: 'errors',
      icon: CircleX,
      tone: 'text-status-danger-fg',
      text: messages['import.withErrors'](props.counts.errors, count(props.counts.errors)),
      shown: props.counts.errors > 0,
    },
    {
      key: 'warnings',
      icon: TriangleAlert,
      tone: 'text-status-warning-fg',
      text: messages['import.withWarnings'](
        props.counts.warnings ?? 0,
        count(props.counts.warnings ?? 0),
      ),
      shown: (props.counts.warnings ?? 0) > 0,
    },
    {
      key: 'duplicates',
      icon: Copy,
      tone: 'text-secondary',
      text: messages['import.duplicates'](
        props.counts.duplicates ?? 0,
        count(props.counts.duplicates ?? 0),
      ),
      shown: (props.counts.duplicates ?? 0) > 0,
    },
  ].filter((each) => each.shown)
  const checkStep = (
    <div className="flex flex-col gap-4">
      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
        {tally.map(({ key, icon: Icon, tone, text }) => (
          <li key={key} className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Icon aria-hidden="true" className={cn('size-4 shrink-0', tone)} />
            <span className={TEXT_DIRECTION}>{text}</span>
          </li>
        ))}
      </ul>
      {props.previewNotice}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <CheckboxField
          label={messages['import.problemsOnly']}
          checked={props.problemsOnly}
          onChange={props.onProblemsOnlyChange}
        />
        <CheckboxField
          label={messages['import.skipInvalid']}
          checked={props.skipInvalid}
          onChange={props.onSkipInvalidChange}
        />
      </div>
      <div className="-mx-4 border-0 border-y border-solid border-default">
        {props.problemsOnly && props.previewRows.length === 0 && props.previewLoading !== true ? (
          <p role="status" className={cn('m-0 px-4 py-6 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['import.noProblems']}
          </p>
        ) : (
          <DataTable
            label={messages['import.stepCheck']}
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={previewColumns}
            rows={props.previewRows}
            getRowId={(row) => row.id}
            getRowLabel={(row) => `${messages['import.line']} ${count(row.line)}`}
            {...(props.previewLoading === undefined ? {} : { loading: props.previewLoading })}
            {...(props.previewRows.length > 100 ? { virtualize: true, maxHeight: '480px' } : {})}
            mobile={{
              title: (row) => `${messages['import.line']} ${count(row.line)}`,
              subtitle: (row) => <Issues issues={issuesOf(row, undefined)} />,
              details: shownFields.map((field) => field.id),
            }}
          />
        )}
      </div>
    </div>
  )

  const importStep = (
    <div className="flex flex-col gap-4">
      {props.progress !== undefined && props.result === undefined && (
        <JobProgress
          label={messages['import.progress']}
          state="running"
          done={props.progress.done}
          total={props.progress.total}
        />
      )}
      {props.result}
    </div>
  )

  // ── The buttons: Back, then the step's main action last ──
  const back =
    index > 0 && props.step !== 'import' ? (
      <Button
        intent="back"
        label={messages['wizard.back']}
        onClick={() => {
          go(IMPORT_STEPS[index - 1] ?? 'file')
        }}
      />
    ) : null
  let main: ReactNode = null
  if (props.step === 'file') {
    main = (
      <Button
        intent="next"
        label={messages['wizard.next']}
        disabled={props.file === undefined || props.reading === true}
        onClick={() => {
          go('columns')
        }}
      />
    )
  } else if (props.step === 'columns') {
    main =
      missing.length > 0 ? (
        <UnavailableAction
          intent="next"
          label={messages['wizard.next']}
          reason={messages['import.missingRequired'](
            missing.map((field) => field.label).join(', '),
          )}
        />
      ) : (
        <Button
          intent="next"
          label={messages['wizard.next']}
          onClick={() => {
            go('check')
          }}
        />
      )
  } else if (props.step === 'check') {
    // The rows that will be imported: the ready ones (with errors skipped, or none).
    const label = messages['import.run'](props.counts.ready, count(props.counts.ready))
    main = importBlocked(props.counts, props.skipInvalid) ? (
      <UnavailableAction
        family="primary"
        icon={Upload}
        emphasis="primary"
        label={label}
        reason={messages['import.fixOrSkip']}
      />
    ) : (
      <Button
        family="primary"
        icon={Upload}
        emphasis="primary"
        label={label}
        disabled={props.previewLoading === true}
        onClick={props.onImport}
      />
    )
  }

  return (
    <section
      data-slot="import-wizard"
      aria-label={steps[index]?.label}
      className={cn(
        'box-border flex min-w-0 flex-col rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary',
        props.className,
      )}
    >
      <div className="border-0 border-b border-solid border-default p-4">
        <Stepper steps={steps} active={index} />
      </div>
      <div className="flex flex-col gap-4 p-4">
        {props.step === 'file' && fileStep}
        {props.step === 'columns' && columnsStep}
        {props.step === 'check' && checkStep}
        {props.step === 'import' && importStep}
      </div>
      {(back !== null || main !== null || props.onCancel !== undefined) && (
        <div className="flex flex-wrap items-center gap-2 border-0 border-t border-solid border-default p-4">
          {props.onCancel !== undefined && props.step !== 'import' && (
            <Button intent="cancel" label={messages['dialog.cancel']} onClick={props.onCancel} />
          )}
          <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
            {back}
            {main}
          </div>
        </div>
      )}
    </section>
  )
}

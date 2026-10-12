import type { Meta, StoryObj } from '@storybook/react-vite'
import { School } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { DateText } from '../components/display-text'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import type { PrintColumn } from './print-parts'
import { GRADES, type GradeRow } from './print-story-data'
import { PrintGradeReport, type PrintGradeReportProps } from './print-templates'

function Letterhead() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md border border-solid border-strong text-primary">
        <School aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col">
        <span className={cn('text-md font-semibold text-primary', TEXT_DIRECTION)}>
          OŠ „Jovan Popović“ Novi Sad
        </span>
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
          Primary school · Braće Popović 1, Novi Sad
        </span>
      </div>
    </div>
  )
}

const COLUMNS: PrintColumn<GradeRow>[] = [
  { key: 'subject', header: 'Subject', cell: (row) => row.subject },
  { key: 'grade', header: 'Grade', align: 'end', cell: (row) => row.grade, width: '18mm' },
  { key: 'words', header: 'In words', cell: (row) => row.words, width: '34mm' },
  {
    key: 'absences',
    header: 'Hours absent',
    align: 'end',
    cell: (row) => row.absences,
    width: '26mm',
  },
]

const REPORT: PrintGradeReportProps<GradeRow> = {
  title: 'Report card',
  period: 'First term, school year 2026/27',
  letterhead: <Letterhead />,
  header: 'OŠ „Jovan Popović“ Novi Sad · Report card · Luka Jovanović, 6/2',
  footer: 'OŠ „Jovan Popović“ · Braće Popović 1, 21000 Novi Sad · 021 6400 123',
  details: [
    { key: 'name', label: 'Pupil', value: 'Luka Jovanović' },
    { key: 'class', label: 'Class', value: '6/2' },
    { key: 'born', label: 'Date of birth', value: <DateText value="2014-05-21" />, numeric: true },
    { key: 'number', label: 'Register number', value: '214/2020', numeric: true },
    { key: 'teacher', label: 'Class teacher', value: 'Marija Kovačević' },
  ],
  table: {
    caption: 'Grades by subject',
    captionVisible: true,
    columns: COLUMNS,
    rows: GRADES,
    rowKey: (row) => row.id,
    lineType: (row) => row.type,
  },
  summary: [
    { key: 'success', label: 'Overall success', value: 'Excellent (4,64)' },
    { key: 'conduct', label: 'Conduct', value: 'Exemplary (5)' },
    { key: 'absences', label: 'Absences', value: '14 excused, 0 unexcused', numeric: true },
  ],
  remarks: {
    title: 'Remarks',
    content: (
      <p className={cn('m-0', TEXT_DIRECTION)}>
        Luka is diligent and works well in a group. He took part in the school mathematics
        competition and won second place at the municipal level.
      </p>
    ),
  },
  issued: { place: 'Novi Sad', date: '2026-12-23' },
  signatures: [
    { key: 'teacher', label: 'Class teacher', name: 'Marija Kovačević' },
    { key: 'principal', label: 'Principal', name: 'Zoran Stojanović' },
  ],
  seal: (
    <span
      role="img"
      aria-label="School seal"
      className="flex size-24 items-center justify-center rounded-full border-2 border-double border-strong p-2 text-center text-xs text-secondary"
    >
      <span className={TEXT_ISOLATE}>OŠ „Jovan Popović“</span>
    </span>
  ),
}

const meta = {
  title: 'Templates/Print/PrintGradeReport',
  component: PrintGradeReport,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a report of results by subject for a period — a school report, a ' +
          'course transcript: the institution’s letterhead, the title and the period, the ' +
          'person’s details, the results as a PrintTable (the average as a subtotal row, ' +
          'semibold under a rule), a summary, remarks, place and date, signatures with an ' +
          'optional seal. The grades, the average and the outcome are the application’s; ' +
          'nothing is computed.\n\n' +
          '**When:** a term’s or a year’s report, a transcript of records.\n\n' +
          '**When not:** a certificate (PrintCertificate); grades entered on screen ' +
          '(EditableGrid).',
      },
    },
  },
  args: {
    title: 'Report card',
    table: { caption: '', columns: [], rows: [], rowKey: () => '' },
  },
  render: () => (
    <ExampleProvider>
      <PrintGradeReport {...REPORT} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PrintGradeReport>

export default meta

type Story = StoryObj<typeof meta>

/** A sixth-grade pupil's report for the first term. */
export const Default: Story = {
  name: 'School report',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Grades by subject' })
    await expect(within(table).getAllByRole('row')).toHaveLength(GRADES.length + 1)
    const average = table.querySelector('[data-line-type="subtotal"]')
    await expect(average).toHaveTextContent('Average grade')
    await expect(canvas.getByText('Novi Sad, 23.12.2026.')).toBeVisible()
  },
}

/** Long remarks and a full year: the report runs onto a second page, signatures kept together. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <PrintGradeReport
        {...REPORT}
        period="School year 2026/27, second term and the final grades"
        remarks={{
          title: 'Remarks',
          content: Array.from({ length: 6 }, (_, index) => (
            <p key={index} className={cn('m-0', TEXT_DIRECTION)}>
              Luka is diligent and works well in a group; he helps classmates who missed lessons and
              prepares carefully for written tests. He took part in the school mathematics
              competition and won second place at the municipal level; his work on the class project
              about the Danube was shown at the school exhibition. In the second term he should read
              more and practise written expression in Serbian.
            </p>
          )),
        }}
      />
    </ExampleProvider>
  ),
}

/** On a phone. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintGradeReport {...REPORT} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

const ARABIC_COLUMNS: PrintColumn<GradeRow>[] = [
  { key: 'subject', header: 'المادة', cell: (row) => row.subject },
  { key: 'grade', header: 'الدرجة', align: 'end', cell: (row) => row.grade },
]

/** Arabic. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PrintGradeReport
        title="كشف الدرجات"
        period="الفصل الأول، العام الدراسي ٢٠٢٦/٢٧"
        details={[
          { key: 'n', label: 'التلميذ', value: 'يوسف أحمد' },
          { key: 'c', label: 'الصف', value: '6/2' },
        ]}
        table={{
          caption: 'الدرجات حسب المادة',
          columns: ARABIC_COLUMNS,
          rows: [
            { id: '1', type: 'line', subject: 'اللغة العربية', grade: '5' },
            { id: '2', type: 'line', subject: 'الرياضيات', grade: '4' },
            { id: '3', type: 'subtotal', subject: 'المعدل', grade: '4,5' },
          ],
          rowKey: (row) => row.id,
          lineType: (row) => row.type,
        }}
        issued={{ date: '2026-12-23' }}
        signatures={[{ key: 't', label: 'المعلمة', name: 'مريم حسن' }]}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PrintGradeReport
        title="通知表"
        period="2026年度 第1学期"
        details={[
          { key: 'n', label: '生徒', value: '佐藤 太郎' },
          { key: 'c', label: '学級', value: '6年2組' },
        ]}
        table={{
          caption: '教科別の成績',
          columns: [
            { key: 'subject', header: '教科', cell: (row: GradeRow) => row.subject },
            { key: 'grade', header: '評定', align: 'end', cell: (row: GradeRow) => row.grade },
          ],
          rows: [
            { id: '1', type: 'line', subject: '国語', grade: '5' },
            { id: '2', type: 'line', subject: '算数', grade: '4' },
          ],
          rowKey: (row) => row.id,
        }}
        signatures={[{ key: 't', label: '担任', name: '鈴木 花子' }]}
      />
    </StoryProvider>
  ),
}

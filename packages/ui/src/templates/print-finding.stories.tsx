import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stethoscope } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { DateText } from '../components/display-text'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { FINDING_PARAGRAPHS } from './print-story-data'
import { PrintFinding, type PrintFindingProps } from './print-templates'

function Letterhead() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md border border-solid border-strong text-primary">
        <Stethoscope aria-hidden="true" className="size-6" />
      </span>
      <div className="flex flex-col">
        <span className="text-md font-semibold text-primary">
          Dom zdravlja Novi Sad · Occupational medicine
        </span>
        <span className="text-xs text-secondary">Bulevar cara Lazara 75, 21000 Novi Sad</span>
      </div>
    </div>
  )
}

const FINDING: PrintFindingProps = {
  title: 'Periodic medical examination report',
  number: 'MR-2026-08812',
  letterhead: <Letterhead />,
  header: 'Dom zdravlja Novi Sad · Occupational medicine · Nikola Marković, MR-2026-08812',
  subjectTitle: 'Patient',
  subject: [
    { key: 'name', label: 'Name', value: 'Nikola Marković' },
    { key: 'born', label: 'Date of birth', value: <DateText value="1985-03-14" />, numeric: true },
    { key: 'lbo', label: 'Health insurance number', value: '10234567891', numeric: true },
    { key: 'employer', label: 'Employer', value: 'Kvadrat Gradnja d.o.o.' },
    { key: 'job', label: 'Job', value: 'Site worker (work at height)' },
  ],
  details: [
    { key: 'date', label: 'Examined on', value: <DateText value="2026-10-08" />, numeric: true },
    { key: 'referral', label: 'Referral', value: 'Periodic examination, increased-risk job' },
    { key: 'doctor', label: 'Doctor', value: 'dr Ana Lukić' },
  ],
  sections: [
    {
      key: 'history',
      title: 'History',
      content: FINDING_PARAGRAPHS.slice(0, 3).map((text) => (
        <p key={text} className="m-0">
          {text}
        </p>
      )),
    },
    {
      key: 'findings',
      title: 'Findings',
      content: FINDING_PARAGRAPHS.slice(3).map((text) => (
        <p key={text} className="m-0">
          {text}
        </p>
      )),
    },
    {
      key: 'conclusion',
      title: 'Conclusion',
      content: (
        <p className="m-0">
          Fit for work at height and for handling loads, with a recommendation to use a lumbar
          support belt. Next periodic examination in 12 months.
        </p>
      ),
    },
  ],
  confidentiality:
    'Confidential medical record. It may be shown only to the patient and to persons authorised by law.',
  footer: 'Dom zdravlja Novi Sad · Bulevar cara Lazara 75 · 021 4879 000',
  issued: { place: 'Novi Sad', date: '2026-10-08' },
  signatures: [
    {
      key: 'doctor',
      label: 'Doctor',
      name: 'dr Ana Lukić',
      detail: 'Specialist in occupational medicine',
      // A facsimile of the signature, an image from the application.
      image: (
        <span
          role="img"
          aria-label="Signature of dr Ana Lukić"
          className="pb-1 text-lg text-secondary italic"
        >
          A. Lukić
        </span>
      ),
    },
  ],
}

const meta = {
  title: 'Templates/Print/PrintFinding',
  component: PrintFinding,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a finding on paper — a medical finding, an inspection’s finding: the ' +
          'institution’s letterhead, the title and number, the person’s block in a frame, the ' +
          'finding’s details, its titled sections in order, place and date, the signature (one ' +
          'stands at the end) with an optional stamp, and a **confidentiality note** printed in ' +
          'the footer of every page. Every word comes from the application.\n\n' +
          '**When:** a report the person or another institution receives on paper.\n\n' +
          '**When not:** the record on screen (DetailPage, with MaskedValue for sensitive ' +
          'values); a certificate (PrintCertificate).',
      },
    },
  },
  args: FINDING,
  render: (args) => (
    <ExampleProvider>
      <PrintFinding {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PrintFinding>

export default meta

type Story = StoryObj<typeof meta>

/** A periodic examination of a site worker. */
export const Default: Story = {
  name: 'Medical finding',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Patient' })).toHaveTextContent(
      'Nikola Marković',
    )
    await expect(canvas.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'History',
      'Findings',
      'Conclusion',
    ])
    const footer = canvasElement.querySelector('[data-slot="print-footer"]')
    await expect(footer).toHaveTextContent('Confidential medical record.')
    await expect(footer).toHaveTextContent('Bulevar cara Lazara 75')
  },
}

/** A long finding: four pages on paper, the confidentiality note on each. */
export const Long: Story = {
  name: 'Long finding, four pages',
  args: {
    sections: [
      ...FINDING.sections,
      ...['Laboratory', 'Spirometry', 'ECG', 'Audiometry', 'Recommendations'].map((title) => ({
        key: title,
        title,
        content: FINDING_PARAGRAPHS.map((text) => (
          <p key={text} className="m-0">
            {text}
          </p>
        )),
      })),
    ],
    seal: (
      <span
        role="img"
        aria-label="Stamp of dr Ana Lukić"
        className="flex size-24 items-center justify-center rounded-full border-2 border-double border-strong p-2 text-center text-xs text-secondary"
      >
        dr Ana Lukić
      </span>
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    const sheet = canvasElement.querySelector<HTMLElement>('[data-slot="print-sheet"]')
    await expect(sheet?.offsetHeight ?? 0).toBeGreaterThan(2 * 297 * (96 / 25.4))
  },
}

/** A cancelled finding (replaced by a corrected one). */
export const Cancelled: Story = {
  args: {
    status: {
      kind: 'cancelled',
      by: 'dr Ana Lukić',
      at: '2026-10-09T08:15:00+02:00',
      reason: 'The audiometry was entered for the wrong ear.',
      document: { kind: 'Corrected report', number: 'MR-2026-08840' },
    },
  },
}

/** On a phone. */
export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintFinding {...args} />
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

/** Arabic. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PrintFinding
        title="تقرير الفحص الطبي"
        number="MR-2026-08812"
        subjectTitle="المريض"
        subject={[
          { key: 'n', label: 'الاسم', value: 'سارة أحمد' },
          { key: 'b', label: 'تاريخ الميلاد', value: <DateText value="1985-03-14" /> },
        ]}
        sections={[
          {
            key: 'f',
            title: 'النتائج',
            content: <p className="m-0">ضغط الدم ١٣٥/٨٥، النبض منتظم.</p>,
          },
          { key: 'c', title: 'الخلاصة', content: <p className="m-0">لائقة للعمل.</p> },
        ]}
        confidentiality="سجل طبي سري."
        issued={{ date: '2026-10-08' }}
        signatures={[{ key: 'd', label: 'الطبيبة', name: 'د. آنا لوكيتش' }]}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PrintFinding
        title="定期健康診断報告書"
        number="MR-2026-08812"
        subjectTitle="患者"
        subject={[
          { key: 'n', label: '氏名', value: '佐藤 太郎' },
          { key: 'b', label: '生年月日', value: <DateText value="1985-03-14" /> },
        ]}
        sections={[
          {
            key: 'f',
            title: '所見',
            content: <p className="m-0">血圧 135/85 mmHg、脈拍は規則的。</p>,
          },
          { key: 'c', title: '結論', content: <p className="m-0">就業可。</p> },
        ]}
        confidentiality="機密の医療記録です。"
        issued={{ date: '2026-10-08' }}
        signatures={[{ key: 'd', label: '医師', name: '鈴木 一郎' }]}
      />
    </StoryProvider>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { DateText } from '../components/display-text'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { FINDING_PARAGRAPHS } from './print-story-data'
import { PrintFinding, type PrintFindingProps } from './print-templates'

/** The institution's logo, an image from the application (D18). */
function Logo() {
  return (
    <svg
      role="img"
      aria-label="Dom zdravlja Novi Sad"
      viewBox="0 0 196 32"
      className="block h-8 w-auto text-logo"
      fill="currentColor"
    >
      <path d="M10 4h8v8h8v8h-8v8h-8v-8H2v-8h8z" />
      <text x="34" y="22" fontSize="16" fontWeight="700" fontFamily="var(--liro-font-brand)">
        Dom zdravlja Novi Sad
      </text>
    </svg>
  )
}

const FINDING: PrintFindingProps = {
  title: 'Periodic medical examination report',
  number: 'MR-2026-08812',
  logo: <Logo />,
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
        <p key={text} className={cn('m-0', TEXT_DIRECTION)}>
          {text}
        </p>
      )),
    },
    {
      key: 'findings',
      title: 'Findings',
      content: FINDING_PARAGRAPHS.slice(3).map((text) => (
        <p key={text} className={cn('m-0', TEXT_DIRECTION)}>
          {text}
        </p>
      )),
    },
    {
      key: 'conclusion',
      title: 'Conclusion',
      content: (
        <p className={cn('m-0', TEXT_DIRECTION)}>
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
      id: 'doctor',
      label: 'Doctor',
      name: 'dr Ana Lukić',
      detail: 'Specialist in occupational medicine',
      // A facsimile of the signature, an image from the application.
      image: (
        <span
          role="img"
          aria-label="Signature of dr Ana Lukić"
          className={cn('pb-1 text-lg text-secondary italic', TEXT_ISOLATE)}
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
          '**What for:** a finding on paper — a medical finding, an inspection’s finding — as ' +
          'simple as the other printouts (P5.28): the title and number at the start, the ' +
          'institution’s logo at the end, the person’s details (no frame), the finding’s ' +
          'details, its titled sections in order, place and date, the **electronic signature ' +
          'field** (a stable `id`, its place in the PDF reported by PrintPage; no stamp), and a ' +
          '**confidentiality note** printed in the footer of every page. Every word comes from ' +
          'the application.\n\n' +
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
          <p key={text} className={cn('m-0', TEXT_DIRECTION)}>
            {text}
          </p>
        )),
      })),
    ],
  },
  play: async ({ canvasElement }) => {
    await settle()
    const sheet = canvasElement.querySelector<HTMLElement>('[data-slot="print-sheet"]')
    await expect(sheet?.offsetHeight ?? 0).toBeGreaterThan(2 * 297 * (96 / 25.4))
    // The signature field lands on a later page; the screen's footer counts the pages.
    const field = sheet?.querySelector<HTMLElement>('[data-signature-field="doctor"]')
    await expect(Number(field?.dataset.pdfPage)).toBeGreaterThanOrEqual(3)
    const pages = sheet?.querySelector('[data-slot="print-page-number"]')?.textContent ?? ''
    await expect(pages).toMatch(/^Page (\d) of \1$/)
    await expect(Number(field?.dataset.pdfPage)).toBe(Number(/\d/.exec(pages)?.[0]))
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
            content: <p className={cn('m-0', TEXT_DIRECTION)}>ضغط الدم ١٣٥/٨٥، النبض منتظم.</p>,
          },
          {
            key: 'c',
            title: 'الخلاصة',
            content: <p className={cn('m-0', TEXT_DIRECTION)}>لائقة للعمل.</p>,
          },
        ]}
        confidentiality="سجل طبي سري."
        issued={{ date: '2026-10-08' }}
        signatures={[{ id: 'doctor', label: 'الطبيبة', name: 'د. آنا لوكيتش' }]}
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
            content: <p className={cn('m-0', TEXT_DIRECTION)}>血圧 135/85 mmHg、脈拍は規則的。</p>,
          },
          {
            key: 'c',
            title: '結論',
            content: <p className={cn('m-0', TEXT_DIRECTION)}>就業可。</p>,
          },
        ]}
        confidentiality="機密の医療記録です。"
        issued={{ date: '2026-10-08' }}
        signatures={[{ id: 'doctor', label: '医師', name: '鈴木 一郎' }]}
      />
    </StoryProvider>
  ),
}

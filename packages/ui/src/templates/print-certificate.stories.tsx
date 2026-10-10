import type { Meta, StoryObj } from '@storybook/react-vite'
import { HardHat } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { SAFETY_CERTIFICATE } from './print-story-data'
import { PrintCertificate } from './print-templates'

/** The company's emblem, an image passed through props (D18: no logo inside a component). */
function Emblem() {
  return (
    <span className="flex size-16 items-center justify-center rounded-full border-2 border-solid border-strong text-primary">
      <HardHat aria-hidden="true" className="size-8" />
    </span>
  )
}

/** A round seal, drawn by the story (an application passes its scanned seal as an image). */
function Seal({ text }: { text: string }) {
  return (
    <span
      role="img"
      aria-label={text}
      className="flex size-26 items-center justify-center rounded-full border-2 border-double border-strong p-2 text-center text-xs text-secondary"
    >
      {text}
    </span>
  )
}

const meta = {
  title: 'Templates/Print/PrintCertificate',
  component: PrintCertificate,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a certificate or a diploma on one page — landscape by default, centred ' +
          '(the convention of the paper), inside a double frame line: the emblem (an image ' +
          'from props, D18), the title, "This certifies that", the recipient’s name as the ' +
          'largest text, the text, the number, place and date, the signatures with a seal ' +
          'between them. A PrintPage: paper always light; a draft prints its marker.\n\n' +
          '**When:** the certificate of a completed course (CoursePage offers it at ' +
          'completion), a training or exam record, an award.\n\n' +
          '**When not:** a document with lines (PrintDocument); a report of results ' +
          '(PrintGradeReport).',
      },
    },
  },
  args: {
    ...SAFETY_CERTIFICATE,
    emblem: <Emblem />,
    seal: <Seal text="Kvadrat Gradnja d.o.o. · Novi Sad" />,
  },
  render: (args) => (
    <ExampleProvider>
      <PrintCertificate {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PrintCertificate>

export default meta

type Story = StoryObj<typeof meta>

/** The occupational-safety certificate of a Kvadrat Gradnja site worker. */
export const Default: Story = {
  name: 'Certificate',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const sheet = canvas.getByRole('article', { name: 'Certificate: Nikola Marković' })
    await expect(sheet).toHaveAttribute('data-orientation', 'landscape')
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Certificate')
    await expect(canvas.getByText('Novi Sad, 10.10.2026.')).toBeVisible()
    await expect(
      canvas.getByRole('img', { name: 'Kvadrat Gradnja d.o.o. · Novi Sad' }),
    ).toBeVisible()
    // One page: the certificate fills the page area and does not run onto a second.
    const certificate = sheet.querySelector<HTMLElement>('[data-slot="print-certificate"]')
    await expect(certificate?.offsetHeight ?? 0).toBeLessThan(210 * (96 / 25.4))
    // No page number on a certificate unless asked.
    const rules = canvasElement.querySelector('[data-slot="print-page"] style')?.textContent ?? ''
    await expect(rules).not.toContain('counter(page)')
  },
}

/** Portrait, without emblem and seal, one signature, with the page number. */
export const Portrait: Story = {
  args: {
    orientation: 'portrait',
    pageNumbers: true,
    emblem: undefined,
    seal: undefined,
    signatures: [{ key: 'officer', label: 'Occupational safety officer', name: 'Jelena Savić' }],
  },
}

/** A draft before it is issued. */
export const Draft: Story = {
  args: { status: { kind: 'draft', note: 'Not valid until signed.' } },
}

/** Long names and text: the frame keeps them on the page, centred. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    recipient: 'Aleksandar-Konstantin Petrović-Njegoš Radojičić',
    recipientDetail:
      'Construction site manager, Kvadrat Gradnja d.o.o., Novi Sad, sites in Bačka Palanka, Sombor and Zrenjanin',
    text: 'has completed the extended course “Bezbednost i zdravlje na radu” for site managers (occupational safety and health on construction sites, work at height, scaffolding, excavations and handling of loads, 18 lessons with practical exercises) and passed the final test with 19 of 20 correct answers and the practical assessment on the site.',
  },
}

/** On a phone: the landscape sheet scaled to the width. */
export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintCertificate {...args} />
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
      <PrintCertificate
        title="شهادة"
        subtitle="إتمام التدريب في السلامة والصحة المهنية"
        lead="نشهد بأن"
        recipient="سارة أحمد"
        text="أتمّت دورة السلامة والصحة المهنية في مواقع البناء واجتازت الاختبار النهائي."
        number="BZR-2026-0142"
        issued={{ place: 'نوفي ساد', date: '2026-10-10' }}
        signatures={[
          { key: 'o', label: 'مسؤول السلامة', name: 'يلينا سافيتش' },
          { key: 'd', label: 'المدير', name: 'دراغان إيليتش' },
        ]}
        emblem={<Emblem />}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PrintCertificate
        title="修了証"
        subtitle="労働安全衛生研修"
        lead="以下の者は"
        recipient="佐藤 太郎"
        text="建設現場における労働安全衛生講座を修了し、最終試験に合格したことを証します。"
        number="BZR-2026-0142"
        issued={{ date: '2026-10-10' }}
        signatures={[{ key: 'o', label: '安全管理者', name: '鈴木 一郎' }]}
        seal={<Seal text="印" />}
      />
    </StoryProvider>
  ),
}

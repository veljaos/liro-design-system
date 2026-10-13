import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import type { SignatureFieldPlacement } from './print-logic'
import { SAFETY_CERTIFICATE } from './print-story-data'
import { PrintCertificate, type PrintCertificateProps } from './print-templates'

/** The issuer's logo, an image passed through props (D18: no logo inside a component). */
function Logo() {
  return (
    <svg
      role="img"
      aria-label="Kvadrat Gradnja d.o.o."
      viewBox="0 0 172 32"
      className="block h-8 w-auto text-logo"
      fill="currentColor"
    >
      <rect
        x="2.5"
        y="4.5"
        width="23"
        height="23"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <text x="34" y="23" fontSize="18" fontWeight="700" fontFamily="var(--liro-font-brand)">
        Kvadrat Gradnja
      </text>
    </svg>
  )
}

/**
 * The application around the certificate: it signs in a field when the user presses "Sign here"
 * and lists where the fields land in the PDF (what Liro Bridge receives), a readout under the
 * sheet for the story.
 */
function Signing(args: PrintCertificateProps) {
  const [fields, setFields] = useState<SignatureFieldPlacement[]>([])
  const [signed, setSigned] = useState<readonly string[]>([])
  const signatures = (args.signatures ?? []).map((signature) =>
    signed.includes(signature.id)
      ? {
          ...signature,
          image: (
            <span
              role="img"
              aria-label={`Signature of ${signature.name ?? signature.label}`}
              className="pb-1 text-lg text-secondary italic"
            >
              <bdi>{signature.name ?? signature.label}</bdi>
            </span>
          ),
        }
      : signature,
  )
  return (
    <div className="flex flex-col">
      <PrintCertificate
        {...args}
        signatures={signatures}
        onSign={(id) => {
          setSigned((current) => [...current, id])
        }}
        onSignatureFields={setFields}
      />
      <ul
        data-slot="story-placements"
        className="m-0 flex list-none flex-col gap-1 bg-surface-sunken px-6 pb-6 font-sans text-sm text-secondary"
      >
        {fields.map((field) => (
          <li key={field.id} className={cn('tabular-nums', TEXT_DIRECTION)}>
            {`${field.id}: page ${String(field.page)}, x ${String(field.x)} pt, y ${String(field.y)} pt, ${String(field.width)} × ${String(field.height)} pt`}
          </li>
        ))}
      </ul>
    </div>
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
          '**What for:** a certificate or a diploma on one page, as simple as the other ' +
          'printouts (P5.28): landscape by default, start-aligned, no frame, seal or stamp — ' +
          'the title at the start and the logo (an image from props, D18) at the end, "This ' +
          'certifies that", the recipient’s name as the largest text, the text, the number, ' +
          'place and date, and the **electronic signature fields**: each with a stable `id`; ' +
          'PrintPage reports its page and rectangle in PDF points (`onSignatureFields`, and ' +
          '`data-pdf-rect` on the field), so the user signs there (`onSign`: a "Sign here" ' +
          'button on screen, left off the paper) or Liro Bridge places the visible signature. ' +
          'Paper always light; a draft prints its marker.\n\n' +
          '**When:** the certificate of a completed course (CoursePage offers it at ' +
          'completion), a training or exam record, an award.\n\n' +
          '**When not:** a document with lines (PrintDocument); a report of results ' +
          '(PrintGradeReport).',
      },
    },
  },
  args: {
    ...SAFETY_CERTIFICATE,
    logo: <Logo />,
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
    await expect(canvas.getByRole('img', { name: 'Kvadrat Gradnja d.o.o.' })).toBeVisible()
    // One page: the certificate fills the page area and does not run onto a second.
    const certificate = sheet.querySelector<HTMLElement>('[data-slot="print-certificate"]')
    await expect(certificate?.offsetHeight ?? 0).toBeLessThan(210 * (96 / 25.4))
    // Two electronic signature fields, on page 1, inside the landscape page (842 × 595pt).
    const fields = [...sheet.querySelectorAll<HTMLElement>('[data-signature-field]')]
    await expect(fields.map((field) => field.dataset.signatureField)).toEqual([
      'officer',
      'director',
    ])
    for (const field of fields) {
      await expect(field.dataset.pdfPage).toBe('1')
      const [x = -1, y = -1, width = 0, height = 0] = (field.dataset.pdfRect ?? '')
        .split(' ')
        .map(Number)
      await expect(x).toBeGreaterThan(0)
      await expect(x + width).toBeLessThan(842)
      await expect(y).toBeGreaterThan(0)
      await expect(y + height).toBeLessThan(595)
      // 64 × 18mm.
      await expect(Math.round(width)).toBe(181)
      await expect(Math.round(height)).toBe(51)
    }
    // No page number on a certificate unless asked.
    const rules = canvasElement.querySelector('[data-slot="print-page"] style')?.textContent ?? ''
    await expect(rules).not.toContain('counter(page)')
  },
}

/**
 * Ready to sign: each empty field is a "Sign here" button on screen (left off the paper); the
 * fields' places in the PDF as the application receives them, listed under the sheet.
 */
export const ReadyToSign: Story = {
  name: 'Ready to sign, field positions',
  render: (args) => (
    <ExampleProvider>
      <Signing {...args} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button', { name: 'Sign here' })).toHaveLength(2)
    const readout = canvasElement.querySelector('[data-slot="story-placements"]')
    await expect(readout).toHaveTextContent(/^officer: page 1, x \d/)
    await expect(readout?.querySelectorAll('li')).toHaveLength(2)
  },
}

export const ReadyToSignInteraction: Story = {
  name: 'Ready to sign, interaction',
  tags: ['interaction'],
  render: (args) => (
    <ExampleProvider>
      <Signing {...args} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const [first] = canvas.getAllByRole('button', { name: 'Sign here' })
    if (first === undefined) throw new Error('no field')
    await expect(first).toHaveAccessibleDescription('Occupational safety officer')
    await userEvent.click(first)
    await expect(canvas.getByRole('img', { name: 'Signature of Jelena Savić' })).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: 'Sign here' })).toHaveLength(1)
  },
}

/** Signed: the visible signatures (images from the application) stand on the lines. */
export const Signed: Story = {
  args: {
    signatures: SAFETY_CERTIFICATE.signatures.map((signature) => ({
      ...signature,
      image: (
        <span
          role="img"
          aria-label={`Signature of ${signature.name}`}
          className="pb-1 text-lg text-secondary italic"
        >
          <bdi>{signature.name}</bdi>
        </span>
      ),
    })),
  },
}

/** Portrait, without a logo, one signature, with the page number. */
export const Portrait: Story = {
  args: {
    orientation: 'portrait',
    pageNumbers: true,
    logo: undefined,
    signatures: [{ id: 'officer', label: 'Occupational safety officer', name: 'Jelena Savić' }],
  },
}

/** A draft before it is issued. */
export const Draft: Story = {
  args: { status: { kind: 'draft', note: 'Not valid until signed.' } },
}

/** Long names and text: they wrap and stay on the one page. */
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
          { id: 'officer', label: 'مسؤول السلامة', name: 'يلينا سافيتش' },
          { id: 'director', label: 'المدير', name: 'دراغان إيليتش' },
        ]}
        logo={<Logo />}
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
        signatures={[{ id: 'officer', label: '安全管理者', name: '鈴木 一郎' }]}
      />
    </StoryProvider>
  ),
}

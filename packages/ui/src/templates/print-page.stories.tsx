import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { PrintPage } from './print-page'
import { PrintSection, PrintSignatures, PrintTitle } from './print-parts'

const PARAGRAPHS = [
  'Kvadrat Gradnja d.o.o. confirms that the works on the grain silo in Bačka Palanka were carried out according to the contract 12/2026 and the approved design, and that the site was handed over to the investor on 25 September 2026.',
  'All defects listed in the record of the technical inspection of 18 September 2026 have been removed. The investor has received the as-built documentation, the certificates of the installed materials and the guarantees of the equipment suppliers.',
  'The warranty period for the steel structure and the roof panels is 24 months from the date of the handover record. Defects found in the warranty period are reported in writing to the address above.',
]

/** A letter: a title, a few paragraphs and a signature. */
function Letter({ sections = 1 }: { sections?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <PrintTitle
        title="Confirmation of completed works"
        number="KG-2026-117"
        subtitle="Grain silo, Industrijska zona bb, Bačka Palanka"
      />
      {Array.from({ length: sections }, (_, index) => (
        <PrintSection key={index} title={`${String(index + 1)}. Works and handover`}>
          {PARAGRAPHS.map((text) => (
            <p key={text} className={cn('m-0', TEXT_DIRECTION)}>
              {text}
            </p>
          ))}
        </PrintSection>
      ))}
      <PrintSignatures
        signatures={[
          {
            id: 'director',
            label: 'For Kvadrat Gradnja d.o.o.',
            name: 'Dragan Ilić',
            detail: 'Director',
          },
        ]}
      />
    </div>
  )
}

const HEADER = (
  <span className={TEXT_ISOLATE}>
    Kvadrat Gradnja d.o.o. · <span dir="ltr">KG-2026-117</span>
  </span>
)
const FOOTER =
  'Kvadrat Gradnja d.o.o. · Temerinski put 51, 21000 Novi Sad · office@kvadrat-gradnja.rs'

const meta = {
  title: 'Templates/Print/PrintPage',
  component: PrintPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the frame of every printed page: an A4 sheet (portrait or landscape) ' +
          'with its margins, a `header` and a `footer` repeated on every printed page, the page ' +
          'number ("Page 1 of 3", from messages) in the bottom margin and at the end of the ' +
          'footer on screen, no application chrome. ' +
          '**Paper is always light**: the sheet keeps the light tokens whatever the screen’s ' +
          'theme. On screen it is a sheet on surface.sunken, scaled to a narrow screen ' +
          '(`fit="width"`) or scrolling sideways at 100% (`fit="none"`). Printed, its own ' +
          '`@page` rule sets the size and margins; table rows and signatures are never split, a ' +
          'heading never ends a page, a table’s header row repeats on every page. A `status` ' +
          'prints a draft’s or a cancelled document’s marker on the first page and across every ' +
          'page.\n\n' +
          '**When:** a printout or a PDF the application makes from the browser: a document, a ' +
          'certificate, a report, a letter — the four templates are built on it, and an ' +
          'application can compose its own from the print parts (PrintTitle with the logo at ' +
          'the end, PrintDetails, PrintTable, PrintSection, PrintAmountDueLine, ' +
          'PrintPaymentDetails with the IPS QR slot, PrintSignatures and PrintSignatureField, ' +
          'PrintIssuedLine). **As simple as a Stripe invoice** (P5.28): black and grey, thin ' +
          'rules only, no frames, stamps or seals; "Page 1 of 1" ends the footer. Every ' +
          '**electronic signature field** on the sheet is measured after layout: its page and ' +
          'rectangle in PDF points (origin bottom-left) are written on it (`data-pdf-page`, ' +
          '`data-pdf-rect`) and reported through `onSignatureFields`.\n\n' +
          '**When not:** a screen (DocumentPage, DetailPage); a list to print (the browser ' +
          'prints a ReportPage’s result). Show it alone on the application’s print route, ' +
          'outside the shell.',
      },
    },
  },
  args: {
    title: 'Confirmation of completed works KG-2026-117',
    header: HEADER,
    footer: FOOTER,
    children: null,
  },
  render: (args) => (
    <ExampleProvider>
      <PrintPage {...args}>
        <Letter />
      </PrintPage>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PrintPage>

export default meta

type Story = StoryObj<typeof meta>

/** A one-page letter: header, content, footer; the page rule names the size and the number. */
export const Default: Story = {
  name: 'One page',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const sheet = canvas.getByRole('article', { name: /Confirmation of completed works/ })
    await expect(sheet).toHaveAttribute('data-orientation', 'portrait')
    await expect(sheet.querySelector('[data-slot="print-header"]')).toHaveTextContent(
      'Kvadrat Gradnja d.o.o.',
    )
    await expect(sheet.querySelector('[data-slot="print-footer"]')).toHaveTextContent(
      'Temerinski put 51',
    )
    // The sheet is A4 wide on screen.
    await expect(Math.round(sheet.getBoundingClientRect().width)).toBe(
      Math.round(210 * (96 / 25.4)),
    )
    const rules = canvasElement.querySelector('[data-slot="print-page"] style')?.textContent ?? ''
    await expect(rules).toContain('size: A4 portrait;')
    await expect(rules).toContain('margin: 16mm 18mm 20mm 18mm;')
    // The page number at the end side of the bottom margin; on screen it ends the footer.
    const rtl = getComputedStyle(sheet).direction === 'rtl'
    await expect(rules).toContain(rtl ? '@bottom-left' : '@bottom-right')
    await expect(sheet.querySelector('[data-slot="print-page-number"]')).toHaveTextContent(
      'Page 1 of 1',
    )
    // The signature field's place in the PDF: page 1, inside the A4 page (595 × 842pt).
    const field = sheet.querySelector<HTMLElement>('[data-signature-field="director"]')
    await expect(field?.dataset.pdfPage).toBe('1')
    const [x = -1, y = -1] = (field?.dataset.pdfRect ?? '').split(' ').map(Number)
    await expect(x).toBeGreaterThan(0)
    await expect(y).toBeGreaterThan(0)
    await expect(y).toBeLessThan(842)
  },
}

/** Landscape, custom margins, no page numbers. */
export const Landscape: Story = {
  name: 'Landscape, own margins, no page numbers',
  args: {
    orientation: 'landscape',
    margins: { top: '12mm', bottom: '12mm', start: '25mm', end: '12mm' },
    pageNumbers: false,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const rules = canvasElement.querySelector('[data-slot="print-page"] style')?.textContent ?? ''
    await expect(rules).toContain('size: A4 landscape;')
    // Start 25mm: the left in left-to-right, the right in right-to-left.
    const sheet = canvasElement.querySelector('[data-slot="print-sheet"]')
    const rtl = sheet !== null && getComputedStyle(sheet).direction === 'rtl'
    await expect(rules).toContain(
      rtl ? 'margin: 12mm 25mm 12mm 12mm;' : 'margin: 12mm 12mm 12mm 25mm;',
    )
    await expect(rules).not.toContain('counter(page)')
  },
}

/** Long content: three pages on paper; header and footer on each, headings kept with their text. */
export const Long: Story = {
  name: 'Long text, three pages',
  render: (args) => (
    <ExampleProvider>
      <PrintPage {...args}>
        <Letter sections={8} />
      </PrintPage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const sheet = canvasElement.querySelector<HTMLElement>('[data-slot="print-sheet"]')
    await expect(sheet?.offsetHeight ?? 0).toBeGreaterThan(297 * (96 / 25.4))
    const pages = sheet?.querySelector('[data-slot="print-page-number"]')?.textContent ?? ''
    await expect(pages).toMatch(/^Page ([2-9]) of \1$/)
    // The signature at the end lands on the last page.
    const field = sheet?.querySelector<HTMLElement>('[data-signature-field="director"]')
    await expect(field?.dataset.pdfPage).toBe(/\d/.exec(pages)?.[0])
  },
}

/** A draft, with the marker on the first page and the word across the page. */
export const Draft: Story = {
  args: { status: { kind: 'draft' } },
}

/** On a phone: the sheet scaled down to the width. */
export const Phone: Story = {
  name: 'Phone, scaled to fit',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintPage {...args}>
          <Letter />
        </PrintPage>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
    const sheet = page.querySelector<HTMLElement>('[data-slot="print-sheet"]')
    if (sheet === null) throw new Error('no sheet')
    await expect(sheet.getBoundingClientRect().width).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** On a phone at 100%: the sheet scrolls sideways in its own region; the page does not. */
export const PhoneScrolling: Story = {
  name: 'Phone, 100% scrolling',
  args: { fit: 'none' },
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintPage {...args}>
          <Letter />
        </PrintPage>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const region = within(canvasElement).getByRole('region', {
      name: /Confirmation of completed works/,
    })
    await expect(region).toHaveAttribute('tabindex', '0')
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth)
    const frame = region.parentElement?.parentElement
    if (frame) await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth + 1)
  },
}

/** Arabic, right to left: the page number moves to the left margin, the margins mirror. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PrintPage
        title="تأكيد إنجاز الأعمال"
        header="شركة كفادرات للبناء"
        footer="شركة كفادرات للبناء · نوفي ساد"
        margins={{ start: '25mm', end: '15mm' }}
      >
        <div className="flex flex-col gap-6">
          <PrintTitle title="تأكيد إنجاز الأعمال" number="KG-2026-117" />
          <PrintSection title="الأعمال والتسليم">
            <p className={cn('m-0', TEXT_DIRECTION)}>
              تؤكد الشركة أن أعمال صومعة الحبوب نُفذت وفقًا للعقد والتصميم المعتمد، وأن الموقع سُلّم
              إلى المستثمر في ٢٥ سبتمبر ٢٠٢٦.
            </p>
          </PrintSection>
          <PrintSignatures
            signatures={[{ id: 'director', label: 'عن الشركة', name: 'دراغان إيليتش' }]}
          />
        </div>
      </PrintPage>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const rules = canvasElement.querySelector('[data-slot="print-page"] style')?.textContent ?? ''
    await expect(rules).toContain('@bottom-left')
    await expect(rules).toContain('margin: 16mm 25mm 20mm 15mm;')
  },
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PrintPage
        title="工事完了確認書"
        header="クヴァドラト建設株式会社"
        footer="クヴァドラト建設株式会社 · ノヴィ・サド"
      >
        <div className="flex flex-col gap-6">
          <PrintTitle title="工事完了確認書" number="KG-2026-117" />
          <PrintSection title="工事と引き渡し">
            <p className={cn('m-0', TEXT_DIRECTION)}>
              当社は、穀物サイロの工事が契約および承認された設計に従って実施され、2026年9月25日に現場が発注者に引き渡されたことを確認します。
            </p>
          </PrintSection>
          <PrintSignatures
            signatures={[{ id: 'director', label: '会社代表', name: '佐藤 太郎' }]}
          />
        </div>
      </PrintPage>
    </StoryProvider>
  ),
}

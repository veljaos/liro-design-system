import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  ARABIC_ACT,
  GAZETTE_NAME,
  ILLUSTRATIVE_NOTE,
  JAPANESE_ACT,
  LAW,
} from '../components/legal-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { PrintLegalAct } from './print-legal-act'

const meta = {
  title: 'Templates/Print/PrintLegalAct',
  component: PrintLegalAct,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** one version of a legal act on A4 paper, from the act page’s "Print / ' +
          'PDF" — the A4 pattern of PrintPage: the title, type and issuer, the gazette line, ' +
          '"Version as of …", the application’s note, then the whole text drawn from the act’s ' +
          'nodes (parts and chapters as centred headings, each article’s label and title, its ' +
          'paragraphs, items and sub-items; a deleted article by its words; an article not yet ' +
          'in force with its day; the changes under the label) and the footnotes. The title and ' +
          'the gazette repeat at the top of every page, the page number at the bottom. Every ' +
          'article is printed (no windowing on paper).\n\n' +
          '**When not:** reading the act on screen (LegalActPage); a business document ' +
          '(PrintDocument).',
      },
    },
  },
  args: { act: LAW, gazetteName: GAZETTE_NAME, note: ILLUSTRATIVE_NOTE, asOf: '2026-10-11' },
  render: (args) => (
    <ExampleProvider>
      <PrintLegalAct {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PrintLegalAct>

export default meta

type Story = StoryObj<typeof meta>

/** The law in force on paper. */
export const Default: Story = {
  name: 'Law in force',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Law on Illustrative Building Works' }),
    ).toBeVisible()
    await expect(canvas.getByRole('heading', { name: /^Article 57/ })).toBeVisible()
    await expect(canvas.getByText('Deleted (No. 33/2021)')).toBeVisible()
    const header = canvasElement.querySelector('[data-slot="print-header"]')
    await expect(header).toHaveTextContent(
      'Illustrative Gazette No. 12/2016, 47/2018, 33/2021, 9/2024',
    )
  },
}

/** An older version: "Version as of" its first day, without page numbers. */
export const OlderVersion: Story = {
  name: 'Older version, no page numbers',
  args: { act: { ...LAW, versionId: 'v2' }, pageNumbers: false },
  render: (args) => (
    <ExampleProvider>
      <PrintLegalAct act={args.act} gazetteName={GAZETTE_NAME} pageNumbers={false} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Version as of 23.06.2018.')).toBeVisible()
  },
}

/** On a phone: the sheet scaled to the width. */
export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PrintLegalAct {...args} />
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

/** An Arabic act on paper, mirrored. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PrintLegalAct
        act={ARABIC_ACT}
        gazetteName="الجريدة التوضيحية"
        asOf="2026-10-11"
        note="توضيحي: قانون وجريدة وأرقام مخترعة."
      />
    </StoryProvider>
  ),
}

/** A Japanese act on paper. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PrintLegalAct
        act={JAPANESE_ACT}
        gazetteName="例示官報"
        asOf="2026-10-11"
        note="例示：架空の法令、官報、番号です。"
      />
    </StoryProvider>
  ),
}

/** English in a right-to-left page: the text keeps its word order. */
export const EnglishInRightToLeft: Story = {
  name: 'English in right to left',
  render: (args) => (
    <StoryProvider direction="rtl">
      <ExampleProvider>
        <PrintLegalAct {...args} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

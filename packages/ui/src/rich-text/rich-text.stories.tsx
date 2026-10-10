import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { SectionCard } from '../components/cards'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { RichText } from './rich-text'
import { richTextToHtml, sanitizeRichHtml } from './rich-text-logic'
import {
  ARABIC_FIELDS,
  ARABIC_LETTER,
  COMMENT,
  JAPANESE_FIELDS,
  JAPANESE_LETTER,
  LONG_NOTE,
  OFFER_FIELDS,
  OFFER_LETTER,
  WORD_FRAGMENT,
} from './rich-text-story-data'

const meta = {
  title: 'Components/Rich text/RichText',
  component: RichText,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** showing what a RichTextField wrote — a letter template, a note, a ' +
          'comment — on a record, in a side panel or in a read-only form. From the value’s JSON ' +
          '(`value`, preferred) or from stored HTML (`html`), which is read through the sanitizer ' +
          'into the same structure: nothing of the HTML is inserted as it is. Merge fields show ' +
          'their labels (`mergeFields`) as neutral pills; mentions are semibold; links are ' +
          'underlined and only to http(s) or mailto. Empty: "—" or `empty`.\n\n' +
          '**When:** formatted text from the application’s own editor.\n\n' +
          '**When not:** plain text (show it as text); HTML from anywhere else that must keep ' +
          'its look (a document viewer: DocumentFrame).',
      },
    },
  },
  args: { value: OFFER_LETTER, mergeFields: OFFER_FIELDS },
  render: (args) => (
    <div className="max-w-180">
      <RichText {...args} />
    </div>
  ),
  play: settle,
} satisfies Meta<typeof RichText>

export default meta

type Story = StoryObj<typeof meta>

/** An offer letter template from its JSON, the merge fields as pills with their labels. */
export const OfferLetter: Story = {
  name: 'Offer letter template',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Offer for the office fit-out' }),
    ).toBeVisible()
    await expect(canvas.getByText('Merge field: Due date')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'liro.rs/terms' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    )
  },
}

/** The same letter from its stored HTML: the pills show their keys' labels again. */
export const FromHtml: Story = {
  name: 'From stored HTML',
  args: { value: null, html: richTextToHtml(OFFER_LETTER) },
}

/** A comment with mentions, in a record's section. */
export const Comment: Story = {
  name: 'Comment with mentions',
  render: () => (
    <div className="max-w-120">
      <SectionCard title="Latest comment">
        <RichText value={COMMENT} className="max-w-100" />
      </SectionCard>
    </div>
  ),
}

/** What a word processor pasted, and the same fragment cleaned: structure only. */
export const PastedWord: Story = {
  name: 'Pasted from Word, cleaned',
  render: () => (
    <div className="flex max-w-180 flex-col gap-4">
      <RichText value={null} html={WORD_FRAGMENT} />
      <section aria-label="Cleaned HTML" className="flex flex-col gap-1 text-xs text-secondary">
        <span className="font-semibold">Cleaned HTML (sanitizeRichHtml)</span>
        <code
          data-testid="cleaned"
          dir="ltr"
          className="block rounded-md bg-surface-sunken p-3 font-mono break-all whitespace-pre-wrap text-primary"
        >
          {sanitizeRichHtml(WORD_FRAGMENT)}
        </code>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Delivery terms' })).toBeVisible()
    await expect(canvas.getByText('A link that is not kept').closest('a')).toBeNull()
    await expect(canvas.getByTestId('cleaned')).not.toHaveTextContent('style')
  },
}

/** Nothing written: "—", or the application's words. */
export const Empty: Story = {
  render: () => (
    <div className="flex max-w-120 flex-col gap-4">
      <RichText value={null} />
      <RichText html="<p> </p>" empty="No note yet" />
    </div>
  ),
}

/** Long words and addresses wrap; the column never scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  args: { value: LONG_NOTE },
  render: (args) => (
    <div className="max-w-120">
      <RichText {...args} />
    </div>
  ),
}

export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <RichText value={OFFER_LETTER} mergeFields={OFFER_FIELDS} />
      </div>
    </PhoneFrame>
  ),
}

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div lang="ar" className="max-w-140">
        <RichText value={ARABIC_LETTER} mergeFields={ARABIC_FIELDS} />
      </div>
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div lang="ja" className="max-w-140">
        <RichText value={JAPANESE_LETTER} mergeFields={JAPANESE_FIELDS} />
      </div>
    </StoryProvider>
  ),
}

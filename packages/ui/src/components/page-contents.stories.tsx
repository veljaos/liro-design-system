import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { RichText } from '../rich-text/rich-text'
import { richTextHeadings } from '../rich-text/rich-text-headings'
import type { ContentsEntry } from './help-logic'
import { ARTICLE } from './help-story-data'
import { PageContents } from './page-contents'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const ENTRIES = richTextHeadings(ARTICLE, 'article')

/** A reading page: the contents at the start, the article beside it. */
function ReadingPage({ entries = ENTRIES }: { entries?: readonly ContentsEntry[] }) {
  return (
    <div className="grid grid-cols-[14rem_minmax(0,40rem)] gap-8">
      <PageContents entries={entries} layout="desktop" sticky />
      <article className="flex flex-col gap-4">
        <h1 className="m-0 text-h2 text-primary">Why was my SEF invoice rejected?</h1>
        <RichText value={ARTICLE} headingIds="article" className="text-md" />
      </article>
    </div>
  )
}

const meta = {
  title: 'Components/Help/PageContents',
  component: PageContents,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** "On this page" for one long reading page — a help article, a policy, ' +
          'a guide: its headings as links, a subsection indented, the current one marked ' +
          'neutrally while the reader scrolls; a press scrolls to the heading and moves the ' +
          'focus there. With RichText, `headingIds` gives the headings their ids and ' +
          '`richTextHeadings(value, prefix)` lists the same ids. On phones a disclosure above ' +
          'the text.\n\n' +
          '**When to use:** a page with four or more headings that is read top to bottom. ' +
          '**When not:** a detail page’s sections (SectionBar); a structure to browse ' +
          '(TreeView); a legal act (LegalContents).',
      },
    },
  },
  args: { entries: ENTRIES },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  render: () => <ReadingPage />,
  play: settle,
} satisfies Meta<typeof PageContents>

export default meta

type Story = StoryObj<typeof meta>

/** The article's five headings, one a subsection; the first is current. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'On this page' })
    await expect(within(nav).getAllByRole('link')).toHaveLength(5)
    await expect(
      within(nav).getByRole('link', { name: 'Read the rejection message' }),
    ).toHaveAttribute('aria-current', 'location')
    await expect(
      canvas.getByRole('heading', { name: 'The buyer is not registered' }),
    ).toHaveAttribute('id', 'article-the-buyer-is-not-registered')
  },
}

/** Long headings wrap; a subsection stays indented. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <div className="max-w-60">
      <PageContents
        layout="desktop"
        title="In this article, from the first step to the last"
        entries={[
          { id: 'l1', label: 'Read the rejection message SEF sent and find the field it names' },
          {
            id: 'l2',
            label: 'A buyer that changed its legal form or merged with another company',
            level: 3,
          },
          { id: 'l3', label: 'Send the corrected invoice again without giving it a new number' },
        ]}
      />
    </div>
  ),
}

const ON_PHONE: Story['decorators'] = [
  (Story) => (
    <PhoneFrame>
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    </PhoneFrame>
  ),
]

function PhonePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="m-0 text-h2 text-primary">Why was my SEF invoice rejected?</h1>
      <PageContents entries={ENTRIES} layout="phone" />
      <RichText value={ARTICLE} headingIds="article" />
    </div>
  )
}

/** Phone width: a disclosure, closed. */
export const Phone: Story = {
  decorators: ON_PHONE,
  render: () => <PhonePage />,
}

/** Phone width, the list open. */
export const PhoneOpen: Story = {
  name: 'Phone, open',
  decorators: ON_PHONE,
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <PageContents entries={ENTRIES} layout="phone" defaultOpen />
      <RichText value={ARTICLE} headingIds="article" />
    </div>
  ),
}

/** Arabic headings. */
export const Arabic: Story = {
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
  render: () => (
    <div className="max-w-60">
      <PageContents
        layout="desktop"
        title="في هذه الصفحة"
        entries={[
          { id: 'a1', label: 'اقرأ رسالة الرفض' },
          { id: 'a2', label: 'المشتري غير مسجل' },
          { id: 'a3', label: 'مشترٍ غيّر شكله القانوني', level: 3 },
          { id: 'a4', label: 'أرسل الفاتورة مرة أخرى' },
        ]}
      />
    </div>
  ),
}

/** Japanese headings. */
export const Japanese: Story = {
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
  render: () => (
    <div className="max-w-60">
      <PageContents
        layout="desktop"
        title="このページの内容"
        entries={[
          { id: 'j1', label: '差し戻しメッセージを読む' },
          { id: 'j2', label: '取引先が登録されていない' },
          { id: 'j3', label: '法人形態が変わった取引先', level: 3 },
          { id: 'j4', label: '請求書を再送信する' },
        ]}
      />
    </div>
  ),
}

/** A press goes to the heading: it takes the focus and becomes current. */
export const NavigateInteraction: Story = {
  name: 'Navigate, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'On this page' })
    await userEvent.click(within(nav).getByRole('link', { name: 'Send the invoice again' }))
    await expect(canvas.getByRole('heading', { name: 'Send the invoice again' })).toHaveFocus()
    await waitFor(() =>
      expect(within(nav).getByRole('link', { name: 'Send the invoice again' })).toHaveAttribute(
        'aria-current',
        'location',
      ),
    )
  },
}

/** Phones: the disclosure opens with the keyboard. */
export const PhoneInteraction: Story = {
  name: 'Phone, interaction',
  tags: ['interaction'],
  decorators: ON_PHONE,
  render: () => <PhonePage />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: 'On this page' })
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('link', { name: 'Send the invoice again' })).toBeVisible()
  },
}

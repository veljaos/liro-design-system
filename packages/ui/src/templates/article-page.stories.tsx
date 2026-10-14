import type { Meta, StoryObj } from '@storybook/react-vite'
import { Mail } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { RichText } from '../rich-text/rich-text'
import { richTextHeadings } from '../rich-text/rich-text-headings'
import { ArticleList } from '../components/article-list'
import {
  ARABIC_ARTICLES,
  ARTICLE_BODY,
  ARTICLES,
  Cover,
  JAPANESE_ARTICLES,
} from '../components/blog-story-data'
import { NewsletterSignup } from '../components/newsletter-signup'
import { PageContents } from '../components/page-contents'
import { ShareLinks } from '../components/share-links'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { ArticlePage } from './article-page'

const noop = () => undefined
const TITLE = 'Why e-invoices are rejected, and how to avoid it'
const URL = 'https://blog.example.com/sef-rejected'

function parts(phone: boolean) {
  return {
    contents: (
      <PageContents
        entries={richTextHeadings(ARTICLE_BODY, 'post')}
        layout={phone ? 'phone' : 'desktop'}
        sticky={!phone}
      />
    ),
    share: (
      <ShareLinks
        url={URL}
        targets={[{ key: 'mail', label: 'E-mail', href: `mailto:?body=${URL}`, icon: Mail }]}
      />
    ),
    newsletter: (
      <NewsletterSignup
        title="Get Liro’s articles by e-mail"
        description="One e-mail a month. No advertising."
        onSubscribe={noop}
        layout={phone ? 'phone' : 'desktop'}
      />
    ),
    related: (
      <ArticleList
        label="Related articles"
        headingLevel={3}
        articles={ARTICLES.slice(1, 4)}
        layout={phone ? 'phone' : 'desktop'}
      />
    ),
  }
}

const meta = {
  title: 'Templates/ArticlePage',
  component: ArticlePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**What for:** one article to read — a blog post, a news item, a long guide — as a ' +
          'calm reading layout: back and the category, the title, the lede, the byline (author, ' +
          'date, last change, reading time), the cover, the body (the application’s RichText), ' +
          'the tags, sharing, the newsletter and the related articles. A long article’s ' +
          'contents (PageContents) stand in a column at the start, over the body on a phone.' +
          '\n\n**When to use:** a public article or a knowledge-base page. **When not:** a ' +
          'record (DetailPage); a legal act (LegalActPage); an answer of the assistant ' +
          '(AskPage).',
      },
    },
  },
  args: {
    title: TITLE,
    back: { label: 'Blog', href: '#/blog' },
    category: { label: 'E-invoicing', href: '#/blog/category/e-invoicing' },
    lede: 'Five reasons the e-invoicing system returns an invoice, and what to check before you send.',
    author: { name: 'Jelena Stanković', detail: 'Product manager, Liro' },
    date: '2026-10-12',
    updated: '2026-10-14',
    readingTime: '6 min read',
    cover: <Cover variant={0} />,
    tags: [
      { key: 'sef', label: 'SEF', href: '#/blog/tag/sef' },
      { key: 'invoices', label: 'Invoices', href: '#/blog/tag/invoices' },
    ],
    children: <RichText value={ARTICLE_BODY} headingIds="post" />,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="bg-surface-page">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof ArticlePage>

export default meta

type Story = StoryObj<typeof meta>

/** A long article with its contents at the start. */
export const Default: Story = {
  args: parts(false),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
    await expect(canvas.getByRole('navigation', { name: 'On this page' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Related articles' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('12.10.2026. · Updated 14.10.2026. · 6 min read')
  },
}

/** A short article: one centred column, no contents, no cover. */
export const Short: Story = {
  name: 'Short, without contents',
  render: (args) => {
    const short = { ...args }
    delete short.cover
    delete short.updated
    return <ArticlePage {...short} />
  },
  args: {
    children: (
      <RichText
        value={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Liro now checks the buyer before you send.' }],
            },
          ],
        }}
      />
    ),
  },
}

/** Long title and lede wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...parts(false),
    title:
      'Why e-invoices are rejected by public buyers at the end of the quarter, and the five things every small company should check before it presses Send',
    lede: 'From a wrong buyer ID to a missing order number: what each message from the e-invoicing system means, who in the buyer’s office can help, and how Liro checks each one for you before the invoice leaves.',
    author: {
      name: 'Jelena Stanković-Vukadinović',
      detail: 'Product manager for e-invoicing and the accountants’ workspace, Liro',
    },
  },
}

/** Phone: the contents as a disclosure over the body. */
export const Phone: Story = {
  args: { layout: 'phone', ...parts(true) },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    title: 'لماذا تُرفض الفواتير الإلكترونية',
    back: { label: 'المدونة', href: '#/blog' },
    category: { label: 'الفوترة الإلكترونية', href: '#/c' },
    lede: 'خمسة أسباب شائعة وكيف تتجنبها قبل الإرسال.',
    author: { name: 'يلينا' },
    readingTime: '6 دقائق',
    tags: [{ key: 't', label: 'الفواتير', href: '#/t' }],
    children: (
      <RichText
        value={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'معظم الفواتير المرفوضة تُرفض لأحد خمسة أسباب.' }],
            },
          ],
        }}
      />
    ),
    related: <ArticleList label="مقالات ذات صلة" headingLevel={3} articles={ARABIC_ARTICLES} />,
    relatedTitle: 'مقالات ذات صلة',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    title: '電子請求書が却下される理由',
    back: { label: 'ブログ', href: '#/blog' },
    category: { label: '電子請求', href: '#/c' },
    lede: '送信前に確認すべき5つのポイント。',
    author: { name: 'イェレナ' },
    readingTime: '6分',
    tags: [{ key: 't', label: '請求書', href: '#/t' }],
    children: (
      <RichText
        value={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '却下される請求書の多くは5つの理由のいずれかです。' },
              ],
            },
          ],
        }}
      />
    ),
    related: <ArticleList label="関連記事" headingLevel={3} articles={JAPANESE_ARTICLES} />,
    relatedTitle: '関連記事',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

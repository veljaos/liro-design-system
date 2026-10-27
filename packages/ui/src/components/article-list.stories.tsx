import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ArticleList, type ArticleSummary } from './article-list'
import { ARABIC_ARTICLES, ARTICLES, JAPANESE_ARTICLES } from './blog-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const noop = () => undefined

/** The article without its cover. */
function withoutCover(article: ArticleSummary): ArticleSummary {
  const copy = { ...article }
  delete copy.cover
  return copy
}

const meta = {
  title: 'Components/Reading/ArticleList',
  component: ArticleList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** articles to read — a blog’s posts, a newsroom’s notes — as cards ' +
          '(shadcn’s Card): the optional image on top (the application’s image or drawing, ' +
          'decorative), the title, a short description, the meta line (category · author · date ' +
          '· reading time) and a clear “Read article” at the foot; the whole card is the ' +
          'title’s link. Columns of at least 17rem as many as fit; one on phones. `featured` ' +
          'puts the first across the row. Loading, empty and error states.\n\n**When to ' +
          'use:** a list of articles to browse, the related articles under one. **When not:** ' +
          'search results with snippets (SearchResultList); categories (CategoryGrid); records ' +
          'to work on (DataTable).',
      },
    },
  },
  args: { label: 'Latest articles', articles: ARTICLES },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof ArticleList>

export default meta

type Story = StoryObj<typeof meta>

/** Six articles in columns. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Latest articles' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(6)
    await expect(
      canvas.getByRole('link', { name: 'Why e-invoices are rejected, and how to avoid it' }),
    ).toHaveAttribute('href', '#/blog/sef-rejected')
    await expect(canvasElement).toHaveTextContent('Jelena Stanković · 12.10.2026. · 6 min read')
  },
}

/** The lead story across the row, its cover beside the text. */
export const Featured: Story = {
  args: { featured: true },
}

/** Without covers: the text alone. */
export const WithoutCovers: Story = {
  name: 'Without covers',
  args: { articles: ARTICLES.map(withoutCover) },
}

/** Loading: skeleton cards. */
export const Loading: Story = {
  args: { loading: true, skeletonCount: 3 },
}

/** Nothing found. */
export const Empty: Story = {
  args: { articles: [] },
}

/** Loading failed: Try again. */
export const Failed: Story = {
  name: 'Error',
  args: { error: 'The articles could not be loaded.', onRetry: noop },
}

/** Long titles and excerpts wrap; the excerpt keeps three lines. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    articles: [
      {
        ...ARTICLES[0],
        id: 'long',
        title:
          'Why e-invoices are rejected by public buyers at the end of the quarter, and the five things to check before you press Send on any invoice',
        excerpt:
          'Five reasons the e-invoicing system returns an invoice, from a wrong buyer ID to a missing order number, what each message means, who in the buyer’s office can help, and how Liro checks each one for you before the invoice ever leaves, so that nothing comes back after the period is closed.',
        href: '#/blog/long',
      },
      ...ARTICLES.slice(1, 3),
    ],
  },
}

/** Phone width: one column. */
export const Phone: Story = {
  args: { layout: 'phone', featured: true },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: { label: 'أحدث المقالات', articles: ARABIC_ARTICLES },
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
  args: { label: '最新の記事', articles: JAPANESE_ARTICLES },
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

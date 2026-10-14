import type { Meta, StoryObj } from '@storybook/react-vite'
import { Landmark } from 'lucide-react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CategoryGrid } from './category-grid'
import { EmptyState } from './empty-state'
import { ARABIC_CATEGORIES, CATEGORIES, JAPANESE_CATEGORIES } from './help-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Help/CategoryGrid',
  component: CategoryGrid,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the categories of a collection to browse — a help centre’s topics, a ' +
          'catalogue’s groups — as cards with an icon, the title, a line about what each holds ' +
          'and how many things it holds (the application’s words, "5 articles"). The whole ' +
          'card is a link. The look of the Launchpad’s cards, without its keys and editing.\n\n' +
          '**When to use:** the start page of a collection. **When not:** the application’s ' +
          'home (Launchpad); a hierarchy to drill into (TreeView); a list to compare ' +
          '(DataTable).',
      },
    },
  },
  args: { label: 'Categories', categories: CATEGORIES },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-content">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof CategoryGrid>

export default meta

type Story = StoryObj<typeof meta>

/** Five topics of a help centre, each with its count. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Categories' })
    await expect(within(list).getAllByRole('link')).toHaveLength(5)
    await expect(canvas.getByRole('link', { name: 'E-invoicing' })).toHaveAccessibleDescription(
      '5 articles Send, receive, cancel and correct invoices in SEF.',
    )
  },
}

/** Skeleton cards while the categories load. */
export const Loading: Story = {
  args: { loading: true, skeletonCount: 5 },
}

/** No categories yet: the application's empty state. */
export const Empty: Story = {
  args: {
    categories: [],
    empty: (
      <EmptyState
        compact
        title="No articles published yet"
        description="Published articles appear here by their category."
      />
    ),
  },
}

/** A long title, description and count wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    categories: [
      {
        id: 'long',
        title: 'Bank statements, payment orders and matching payments to open items',
        href: '#/kb/long',
        count: '128 articles, 4 updated this week',
        icon: Landmark,
        description:
          'Import statements from every bank, read their value dates, match payments to invoices automatically or by hand, and fix a statement that was imported twice or with the wrong account.',
      },
      ...CATEGORIES.slice(0, 2),
    ],
  },
}

/** Phone width: one column. */
export const Phone: Story = {
  args: { layout: 'phone' },
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
  args: { label: 'الفئات', categories: ARABIC_CATEGORIES },
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
  args: { label: 'カテゴリー', categories: JAPANESE_CATEGORIES },
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

/** Tab reaches each card in order. */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: 'E-invoicing' })).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: 'Accounts' })).toHaveFocus()
  },
}

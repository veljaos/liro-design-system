import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { EmptyState } from './empty-state'
import { ARABIC_RESULTS, JAPANESE_RESULTS, RESULTS } from './help-story-data'
import { SearchResultList } from './search-result-list'
import { StatusBadge } from './status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Help/SearchResultList',
  component: SearchResultList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what a search across pages found — help articles, pages of a guide, ' +
          'saved answers: the count (or the application’s words), then each result with its ' +
          'context line, the title as a link and a snippet, every match marked (semibold on ' +
          'the warning background, so the weight tells it without the colour). A list, not a ' +
          'table: a snippet needs the width. The application searches, ranks and cuts the ' +
          'snippets (`snippetFromRanges` makes the marked parts from a text and the ranges ' +
          'its engine reports).\n\n' +
          '**When to use:** a search page over texts. **When not:** records with columns ' +
          '(ListPage with DataTable); legal acts (a legal search page); suggestions while the user ' +
          'types (LinkSuggestions).',
      },
    },
  },
  args: { label: 'Search results', results: RESULTS, count: 3 },
  decorators: [
    // A phone story draws its own frame and card; the desktop card would only wrap it.
    (Story, { parameters }) =>
      parameters.phoneFrame === true ? (
        <Story />
      ) : (
        <ExampleProvider>
          <div className="max-w-180 rounded-lg border border-solid border-default bg-surface-raised">
            <Story />
          </div>
        </ExampleProvider>
      ),
  ],
  play: settle,
} satisfies Meta<typeof SearchResultList>

export default meta

type Story = StoryObj<typeof meta>

/** "rejected" in the help articles: three results, the matches marked. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('3 results')
    const list = canvas.getByRole('list', { name: 'Search results' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    await expect(
      canvas.getByRole('link', { name: 'Why was my SEF invoice rejected?' }),
    ).toBeVisible()
    await expect(canvasElement.querySelectorAll('mark').length).toBeGreaterThanOrEqual(5)
  },
}

/** The application's words over the list, and a badge on a result. */
export const WithSummary: Story = {
  name: 'Summary and badge',
  args: {
    summary: '3 results for “rejected” in E-invoicing',
    results: RESULTS.map((result, index) =>
      index === 1 ? { ...result, badge: <StatusBadge label="Updated" tone="neutral" /> } : result,
    ),
  },
}

/** Searching again: the results stay, "Updating…" beside the count. */
export const Updating: Story = {
  args: { loading: true },
}

/** The first search: skeleton rows. */
export const Loading: Story = {
  args: { loading: true, results: [] },
}

/** Nothing found: the application's empty state with a way on. */
export const Empty: Story = {
  args: {
    results: [],
    count: 0,
    empty: (
      <EmptyState
        compact
        variant="no-results"
        className="py-8"
        title="No articles match “sefinvoice”"
        description="Check the spelling, or ask the support team."
        action={{ label: 'Submit a ticket', onClick: () => undefined }}
      />
    ),
  },
}

/** The search failed: Try again. */
export const Failed: Story = {
  name: 'Error',
  args: { results: [], error: true, onRetry: () => undefined },
}

/** A long title and snippet wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    count: 1,
    results: [
      {
        id: 'long',
        title: [
          'Why an electronic invoice sent to a buyer registered under a different tax number can be ',
          { match: 'rejected' },
          ', and how to send it again without a new number',
        ],
        href: '#/kb/long',
        meta: 'E-invoicing · Sending and receiving · Problems with buyers · Updated 08.10.2026.',
        snippet: [
          '…the register keeps the tax number the buyer had on the invoice date; if the buyer changed its form or merged with another company, the invoice is ',
          { match: 'rejected' },
          ' with the message “Buyer not registered” and must name the new number before it is sent again…',
        ],
      },
    ],
  },
}

/** Phone width. */
export const Phone: Story = {
  parameters: { phoneFrame: true },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <div className="rounded-lg border border-solid border-default bg-surface-raised">
              <Story />
            </div>
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: { label: 'نتائج البحث', results: ARABIC_RESULTS, count: 1 },
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
  args: { label: '検索結果', results: JAPANESE_RESULTS, count: 1 },
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

/** The application answers Try again with the results. */
function Retrying() {
  const [failed, setFailed] = useState(true)
  return (
    <SearchResultList
      label="Search results"
      results={failed ? [] : RESULTS}
      count={3}
      error={failed}
      onRetry={() => {
        setFailed(false)
      }}
      onOpen={(_, event) => {
        event.preventDefault()
      }}
    />
  )
}

/** Try again after a failure brings the results; Tab reaches each title. */
export const RetryInteraction: Story = {
  name: 'Try again, interaction',
  tags: ['interaction'],
  render: () => <Retrying />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('3 results')
    await userEvent.tab()
    await expect(
      canvas.getByRole('link', { name: 'Why was my SEF invoice rejected?' }),
    ).toHaveFocus()
  },
}

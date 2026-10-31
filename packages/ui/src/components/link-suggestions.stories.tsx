import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import {
  ARABIC_SUGGESTIONS,
  JAPANESE_SUGGESTIONS,
  LONG_SUGGESTIONS,
  SUGGESTIONS,
} from './help-story-data'
import { LinkSuggestions, type LinkSuggestion } from './link-suggestions'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const TITLE = 'These articles may help'

const meta = {
  title: 'Components/Help/LinkSuggestions',
  component: LinkSuggestions,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** pages the application proposes while the user writes — help articles ' +
          'while a customer describes a problem in a new support request, similar answers ' +
          'while an agent writes one: each a link with a line of context and a short summary. ' +
          'The application searches (after a pause in typing) and gives the suggestions; the ' +
          'box only shows them, announces the count politely, and never takes the focus or ' +
          'blocks the form beside it.\n\n' +
          '**When to use:** beside or under the fields being typed. **When not:** a search the ' +
          'user starts (SearchResultList); a choice that fills the field (ComboboxField, ' +
          'LookupField); records the new one may duplicate (DuplicateWarning).',
      },
    },
  },
  args: { title: TITLE, suggestions: SUGGESTIONS },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof LinkSuggestions>

export default meta

type Story = StoryObj<typeof meta>

/** Three articles proposed for "SEF rejected my invoice". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: TITLE })).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'Why was my SEF invoice rejected?' }),
    ).toHaveAccessibleDescription(
      'Read the rejection message, fix the buyer, the dates or the amounts, and send the invoice again.',
    )
    await expect(canvas.getByRole('status')).toHaveTextContent('3 suggestions')
  },
}

/** The application searches again: the earlier suggestions stay, with a spinner. */
export const Loading: Story = {
  args: { loading: true },
}

/** The first search: nothing yet, only the spinner. */
export const FirstSearch: Story = {
  name: 'First search',
  args: { loading: true, suggestions: [] },
}

/** Nothing found: the box says what it is for; "No suggestions" is announced. */
export const Empty: Story = {
  args: { suggestions: [] },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading')).toBeVisible()
    await expect(canvas.getByText(/They appear here as you write/)).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('No suggestions')
  },
}

/** A long title, context and summary (the summary shows two lines). */
export const LongText: Story = {
  name: 'Long text',
  args: { suggestions: LONG_SUGGESTIONS },
}

/** Phone width, under the field. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="flex flex-col gap-3 p-4">
            <TextField label="Subject" defaultValue="SEF rejected my invoice" />
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: { title: 'قد تساعدك هذه المقالات', suggestions: ARABIC_SUGGESTIONS },
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
  args: { title: 'こちらの記事が役立つかもしれません', suggestions: JAPANESE_SUGGESTIONS },
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

/** The application: searches 300ms after the last key, on the subject's words. */
function WhileTyping() {
  const [subject, setSubject] = useState('')
  const [answer, setAnswer] = useState<{ words: string; found: LinkSuggestion[] }>({
    words: '',
    found: [],
  })
  const words = subject.trim().toLowerCase()
  const searching = words.length >= 3
  useEffect(() => {
    if (!searching) return
    const timer = window.setTimeout(() => {
      setAnswer({
        words,
        found: SUGGESTIONS.filter((each) =>
          words.split(/\s+/).some((word) => each.title.toLowerCase().includes(word)),
        ),
      })
    }, 300)
    return () => {
      window.clearTimeout(timer)
    }
  }, [words, searching])
  const found = searching ? answer.found : []
  const loading = searching && answer.words !== words
  return (
    <div className="flex flex-col gap-3">
      <TextField label="Subject" value={subject} onChange={setSubject} />
      <LinkSuggestions title={TITLE} suggestions={found} loading={loading} />
    </div>
  )
}

/** Typing the subject: the suggestions arrive; the field keeps the focus. */
export const WhileTypingInteraction: Story = {
  name: 'While typing, interaction',
  tags: ['interaction'],
  render: () => <WhileTyping />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Subject' })
    await userEvent.type(field, 'cancel')
    await waitFor(() =>
      expect(
        canvas.getByRole('link', { name: 'Cancel or correct an invoice in SEF' }),
      ).toBeVisible(),
    )
    await expect(field).toHaveFocus()
    await expect(canvas.getByRole('status')).toHaveTextContent('1 suggestion')
  },
}

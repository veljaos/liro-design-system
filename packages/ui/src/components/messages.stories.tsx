import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageSquarePlus, Paperclip } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button, CompactIconButton } from './button'
import { SectionCard } from './cards'
import { at, COMMENTS, LONG_THREAD, PEOPLE, TODAY } from './collaboration-story-data'
import { MentionCombobox, type MentionCandidate } from './mention-combobox'
import type { Mention } from './message-logic'
import {
  MessageBubble,
  MessageComposer,
  MessageList,
  MessageThread,
  type ComposedMessage,
  type ThreadMessage,
} from './messages'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/**
 * A thread whose sent messages are added as the user's own, as the application would after its
 * server confirms them (`delay` milliseconds).
 */
function LiveThread({
  initial = COMMENTS,
  delay = 0,
  className = 'h-[30rem]',
}: {
  initial?: ThreadMessage[]
  delay?: number
  className?: string
}) {
  const [items, setItems] = useState(initial)
  const [count, setCount] = useState(0)
  const send = ({ text, mentions }: ComposedMessage) => {
    const add = () => {
      setCount(count + 1)
      setItems((list) => [
        ...list,
        {
          id: `new-${String(count + 1)}`,
          author: { id: 'u-milica', name: 'Milica Petrović' },
          own: true,
          at: at(TODAY, `10:${String(10 + count).padStart(2, '0')}`),
          text,
          mentions,
        },
      ])
    }
    if (delay === 0) {
      add()
      return
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        add()
        resolve()
      }, delay)
    })
  }
  return (
    <MessageThread
      className={className}
      label="Comments on F-2026-0410"
      messages={items}
      composer={{
        label: 'Comment',
        placeholder: 'Write a comment',
        candidates: PEOPLE,
        onSend: send,
      }}
    />
  )
}

const meta = {
  title: 'Components/Collaboration/Messages',
  component: MessageThread,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** conversations — comments on a record, the discussion of a task. ' +
          '**MessageThread** is a **MessageList** (oldest first, opening at the latest, a day ' +
          'separator, runs of one author under one header, "Jump to latest" when the reader has ' +
          'scrolled up, new messages announced politely) with a **MessageComposer** under it ' +
          '(Enter sends, Shift+Enter breaks the line, "@" mentions people through ' +
          "**MentionCombobox**). **MessageBubble** is one message: others' at the start on the " +
          "raised surface, the user's own at the end on the sunken one — no blue bubbles, the " +
          'side and the surface tell them apart, the author is always named for assistive ' +
          "technology; an agent's carries AgentMark; a message being sent or not sent says so.\n\n" +
          '**When:** comments and conversations on a page (a section, a task drawer). **When ' +
          'not:** the latest two comments in a side panel (ActivityList); the history of changes ' +
          '(HistoryList); a one-off question of an agent outside a conversation (AgentQuestion).',
      },
    },
  },
  args: {
    messages: COMMENTS,
    label: 'Comments on F-2026-0410',
    composer: { label: 'Comment', onSend: () => undefined },
  },
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <SectionCard title="Comments">
          <LiveThread />
        </SectionCard>
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof MessageThread>

export default meta

type Story = StoryObj<typeof meta>

/** The comments on F-2026-0410: runs, a day separator, mentions; Enter sends, Shift+Enter breaks. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const log = canvas.getByRole('log')
    await expect(within(log).getByText('Yesterday')).toBeVisible()
    await expect(within(log).getByText('Today')).toBeVisible()
    // Ivana's two messages within a minute form one run: one name shown, one for screen readers.
    await expect(within(log).getAllByText('Ivana Stojanović')).toHaveLength(2)
    await expect(within(log).getAllByText('You')[0]).toHaveClass('sr-only')
    const field = canvas.getByRole('textbox', { name: 'Comment' })
    await userEvent.click(field)
    await userEvent.type(field, 'First line{Shift>}{Enter}{/Shift}second line')
    await expect(field).toHaveValue('First line\nsecond line')
    await userEvent.keyboard('{Enter}')
    await expect(field).toHaveValue('')
    await waitFor(() => expect(within(log).getByText(/second line/)).toBeVisible())
    await settle()
  },
}

/** "@" offers people; arrows and Enter choose; the name is one token; Backspace removes it whole. */
export const Mentions: Story = {
  render: function Render() {
    const [mentions, setMentions] = useState<Mention[]>([])
    return (
      <ExampleProvider>
        <div className="flex max-w-120 flex-col gap-3">
          <MentionCombobox
            label="Task description"
            candidates={PEOPLE}
            onMentionsChange={setMentions}
            placeholder="Describe the task"
          />
          <output className="text-xs text-secondary">
            Mentioned: {mentions.map((mention) => mention.id).join(', ') || 'nobody'}
          </output>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Task description' })
    await userEvent.click(field)
    await userEvent.type(field, 'Check with @sto')
    const list = await within(document.body).findByRole('listbox', { name: 'People to mention' })
    await expect(within(list).getAllByRole('option')).toHaveLength(1)
    await expect(field).toHaveAttribute('aria-activedescendant')
    await userEvent.keyboard('{Enter}')
    await expect(field).toHaveValue('Check with @Ivana Stojanović ')
    await expect(canvas.getByText('Mentioned: u-ivana')).toBeVisible()
    await userEvent.keyboard('{Backspace}{Backspace}')
    await expect(field).toHaveValue('Check with ')
    await expect(canvas.getByText('Mentioned: nobody')).toBeVisible()
    // Arrow keys move through the list; Escape closes it until the next "@".
    await userEvent.type(field, '@')
    await within(document.body).findByRole('listbox')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect(within(document.body).getAllByRole('option')[2]).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull())
    await settle()
  },
}

/** The application searches people (after 300ms, `loading` while it works). */
export const MentionSearch: Story = {
  name: 'Mention search',
  render: function Render() {
    const [candidates, setCandidates] = useState<MentionCandidate[]>([])
    const [loading, setLoading] = useState(false)
    return (
      <ExampleProvider>
        <div className="max-w-120">
          <MentionCombobox
            label="Comment"
            candidates={candidates}
            loading={loading}
            onSearch={(query) => {
              setLoading(true)
              setTimeout(() => {
                const needle = query.toLocaleLowerCase('sr-Latn')
                setCandidates(
                  PEOPLE.filter((person) =>
                    person.name.toLocaleLowerCase('sr-Latn').includes(needle),
                  ),
                )
                setLoading(false)
              }, 400)
            }}
          />
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Comment' })
    await userEvent.click(field)
    await userEvent.type(field, '@mar')
    await within(document.body).findByText('Loading…')
    const list = await within(document.body).findByRole('listbox')
    await expect(within(list).getAllByRole('option')).toHaveLength(2)
    await expect(within(list).getByText('Jelena Marković')).toBeVisible()
    await expect(within(list).getByText('Marko Đorđević')).toBeVisible()
    await settle()
  },
}

/** Scrolled up while two messages arrive: "2 new messages"; pressing it goes to the latest. */
export const JumpToLatest: Story = {
  name: 'Jump to latest',
  render: function Render() {
    const [items, setItems] = useState(LONG_THREAD)
    return (
      <ExampleProvider>
        <div className="flex max-w-180 flex-col gap-3">
          <MessageList className="h-80" label="Site diary, hall B" messages={items} />
          <Button
            family="neutral"
            icon={MessageSquarePlus}
            label="Add a message"
            onClick={() => {
              const index = items.length
              setItems([
                ...items,
                {
                  id: `n${String(index)}`,
                  author: { id: 'u-snezana', name: 'Snežana Popović' },
                  at: at(TODAY, `14:${String(index).padStart(2, '0')}`),
                  text: 'The pump is here.',
                },
              ])
            }}
          />
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewport = canvas.getByRole('region', { name: 'Site diary, hall B' })
    // Opens at the latest message.
    await waitFor(() =>
      expect(viewport.scrollTop + viewport.clientHeight).toBeGreaterThanOrEqual(
        viewport.scrollHeight - 2,
      ),
    )
    // The reader scrolls up (a wheel turn tells the list it is the reader, not the list itself).
    await new Promise((resolve) => setTimeout(resolve, 300))
    viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }))
    viewport.scrollTop = 0
    viewport.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const add = canvas.getByRole('button', { name: 'Add a message' })
    await userEvent.click(add)
    await userEvent.click(add)
    const jump = await canvas.findByRole('button', { name: '2 new messages' })
    await waitFor(() => expect(jump).toHaveAttribute('data-active', 'true'))
    await userEvent.click(jump)
    await waitFor(() =>
      expect(viewport.scrollTop + viewport.clientHeight).toBeGreaterThanOrEqual(
        viewport.scrollHeight - 2,
      ),
    )
    await settle()
  },
}

/** Bubbles: an agent's with a part under its text, the user's being sent, one not sent. */
export const BubbleStates: Story = {
  name: 'Bubble states',
  render: function Render() {
    const [retried, setRetried] = useState(false)
    return (
      <ExampleProvider>
        <div className="flex max-w-180 flex-col gap-4">
          <MessageBubble
            author={{ name: 'Liro agent', agent: true }}
            at={at(TODAY, '08:15')}
            extra={
              <p className="m-0 text-xs text-secondary">
                Reminder draft: 86.420,35 RSD by 25.10.2026.
              </p>
            }
          >
            Medic Lab Niš d.o.o. has paid 100.000,00 RSD of F-2026-0410. Shall I send the reminder?
          </MessageBubble>
          <MessageBubble
            author={{ name: 'Milica Petrović' }}
            own
            at={at(TODAY, '08:20')}
            status="sending"
          >
            Not yet, wait until Friday.
          </MessageBubble>
          <MessageBubble
            author={{ name: 'Milica Petrović' }}
            own
            at={at(TODAY, '08:21')}
            {...(retried ? { status: 'sending' as const } : { status: 'failed' as const })}
            onRetry={() => {
              setRetried(true)
            }}
          >
            @Dragan Ilić please call them.
          </MessageBubble>
          <MessageBubble author={{ name: 'Dragan Ilić' }} time="yesterday, 16:40">
            The application may write the time itself.
          </MessageBubble>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Not sent')
    await expect(canvas.getAllByText('Agent').length).toBeGreaterThan(0)
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(canvas.queryByRole('alert')).toBeNull()
    await expect(canvas.getAllByText('Sending…')).toHaveLength(2)
  },
}

/** Sending takes a moment: the text stays with a spinner, then clears. */
export const Sending: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <LiveThread delay={800} className="h-96" />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Comment' })
    await userEvent.click(field)
    await userEvent.type(field, 'Confirmed by phone.{Enter}')
    await expect(field).toHaveValue('Confirmed by phone.')
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled()
    await waitFor(() => expect(field).toHaveValue(''), { timeout: 3000 })
    await expect(field).toHaveFocus()
    await settle()
  },
}

/** No comments can be written: the reason under the field; the attach tool in the toolbar. */
export const DisabledWithReason: Story = {
  name: 'Disabled with reason',
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <MessageComposer
          label="Comment"
          placeholder="Write a comment"
          disabled
          disabledReason="Comments are closed: the invoice was archived on 05.10.2026."
          tools={<CompactIconButton icon={Paperclip} label="Attach a file" disabled />}
          onSend={() => undefined}
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Comment' })).toBeDisabled()
    await expect(
      canvas.getByText('Comments are closed: the invoice was archived on 05.10.2026.'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled()
  },
}

/** An error from the application, and files added to the message (the attachments slot). */
export const ErrorAndAttachments: Story = {
  name: 'Error and attachments',
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <MessageComposer
          label="Comment"
          defaultValue="Signed delivery note attached."
          error="The file is larger than 10 MB."
          attachments={<p className="m-0 text-xs text-secondary">otpremnica-0311.pdf · 12,4 MB</p>}
          tools={<CompactIconButton icon={Paperclip} label="Attach a file" />}
          onSend={() => undefined}
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Comment' })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
  },
}

/** No messages yet; and the first messages loading. */
export const EmptyAndLoading: Story = {
  name: 'Empty and loading',
  render: () => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-6">
        <MessageList label="Comments" messages={[]} className="h-40" />
        <MessageList label="Comments" messages={[]} loading className="h-40" />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No messages yet')).toBeVisible()
  },
}

/** Long words and long messages in a phone frame: they wrap, nothing overflows sideways. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border flex h-full flex-col p-4">
          <LiveThread
            className="min-h-0 flex-1"
            initial={[
              ...COMMENTS,
              {
                id: 'long',
                author: { id: 'u-aleksandra', name: 'Aleksandra Katarina Milošević-Vukadinović' },
                at: at(TODAY, '09:40'),
                text: 'Please send the signed copy to racunovodstvo.medic-lab-nis@primer-adresa.rs and keep the original for the archive until the end of the business year.',
              },
            ]}
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const log = within(canvasElement).getByRole('log')
    await expect(log.scrollWidth).toBeLessThanOrEqual(log.clientWidth)
    await settle()
  },
}

/** Arabic messages, right to left: others at the right (start), the user's at the left (end). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-180">
        <MessageThread
          className="h-96"
          label="التعليقات"
          messages={[
            {
              id: 'a1',
              author: { name: 'ليلى حسن' },
              at: at(TODAY, '09:00'),
              text: 'هل وصل الدفع من العميل؟',
            },
            {
              id: 'a2',
              author: { name: 'أنا' },
              own: true,
              at: at(TODAY, '09:05'),
              text: 'نعم، وصل الجزء الأول.',
            },
          ]}
          composer={{ label: 'تعليق', placeholder: 'اكتب تعليقًا', onSend: () => undefined }}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese messages. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-180">
        <MessageThread
          className="h-96"
          label="コメント"
          messages={[
            {
              id: 'j1',
              author: { name: '山田 花子' },
              at: at(TODAY, '09:00'),
              text: '入金は確認できましたか？',
            },
            {
              id: 'j2',
              author: { name: '佐藤 健' },
              own: true,
              at: at(TODAY, '09:05'),
              text: 'はい、一部入金済みです。',
            },
          ]}
          composer={{ label: 'コメント', placeholder: 'コメントを書く', onSend: () => undefined }}
        />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page: names, messages and the hint keep their word order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-180">
        <MessageThread
          className="h-96"
          label="Comments"
          messages={COMMENTS}
          composer={{ label: 'Comment', onSend: () => undefined }}
        />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [name] = canvas.getAllByText('Dragan Ilić')
    if (name === undefined) throw new Error('No author name')
    await expectContentDirection(
      canvas.getByText('Enter sends, Shift+Enter starts a new line'),
      name,
    )
  },
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AttachmentList, type Attachment } from '../components/attachment-list'
import { ARABIC, JAPANESE, LONG } from '../components/field-story-data'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { ReplyComposer, type ComposedReply, type ReplyComposerProps } from './reply-composer'
import {
  ARABIC_REPLY,
  ARABIC_SAVED,
  ARTICLE,
  CALL_REPLY,
  DRAFT,
  JAPANESE_REPLY,
  JAPANESE_SAVED,
  LONG_DRAFT,
  MANY_SAVED_REPLIES,
  SAVED_REPLIES,
  TEAM,
  TICKET_FIELDS,
  TICKET_VALUES,
  VALUE_REPLIES,
} from './reply-composer-story-data'

const FILE: Attachment = {
  id: 'f1',
  name: 'SEF rejection notice.pdf',
  sizeText: '84 KB',
  state: 'available',
}

/**
 * The composer as an application uses it: files it is given are listed under the text, a link is
 * found by "Insert article", and what is sent is shown under it (mode, HTML, mentions).
 */
function Composer({
  files: initialFiles = [],
  ...props
}: Partial<ReplyComposerProps> & { files?: Attachment[] }) {
  const [files, setFiles] = useState<Attachment[]>(initialFiles)
  const [sent, setSent] = useState<ComposedReply[]>([])
  return (
    <div className="flex max-w-180 flex-col gap-4">
      <ReplyComposer
        placeholder="Write a reply to the customer"
        notePlaceholder="Write a note for the team; @ mentions a colleague"
        mentionCandidates={TEAM}
        savedReplies={SAVED_REPLIES}
        insertLinkLabel="Insert article"
        onInsertLink={() => Promise.resolve(ARTICLE)}
        onAttach={(added) => {
          setFiles((list) => [
            ...list,
            ...added.map((file, index) => ({
              id: `added-${String(list.length + index)}`,
              name: file.name,
              sizeText: `${String(Math.max(1, Math.round(file.size / 1024)))} KB`,
              state: 'available' as const,
            })),
          ])
        }}
        attachments={
          files.length === 0 ? undefined : (
            <AttachmentList
              label="Files of this reply"
              files={files}
              canRemove={() => true}
              onRemove={(file) => {
                setFiles((list) => list.filter((each) => each.id !== file.id))
              }}
            />
          )
        }
        onSend={(reply) => {
          setSent((list) => [...list, reply])
          setFiles([])
        }}
        {...props}
      />
      {sent.length > 0 && (
        <section aria-label="Sent" className="flex flex-col gap-1 text-xs text-secondary">
          {sent.map((reply, index) => (
            <code
              key={index}
              data-testid="sent"
              dir="ltr"
              className={cn(
                'block rounded-md bg-surface-sunken p-3 font-mono break-all whitespace-pre-wrap text-primary',
                TEXT_DIRECTION,
              )}
            >
              {reply.mode}: {reply.value.html} · mentions:{' '}
              {reply.value.mentions.map((mention) => mention.id).join(', ') || '—'}
            </code>
          ))}
        </section>
      )}
    </div>
  )
}

/** Waits until the editor has replaced its first drawing, then for overlays. */
async function editorReady(canvasElement: HTMLElement) {
  await waitFor(async () => {
    await expect(canvasElement.querySelector('.ProseMirror')).not.toBeNull()
  })
  await settle()
}

const meta = {
  title: 'Components/Rich text/ReplyComposer',
  component: ReplyComposer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** writing a reply to a conversation — a support request, a customer’s ' +
          'question, a case — or a note only the team sees, in formatted text (RichTextField’s ' +
          'toolbar, shortcuts, paste rules and merge fields). From the `@veljaos/ui/rich-text` ' +
          'subpath.\n\n' +
          '**Two modes** (`modes`): Reply and Internal note, a compact segmented control on one ' +
          'line (neutral, never blue); the text is kept when the mode changes. A note’s text box is sunken and a line ' +
          'says who sees it; "@" mentions the team only in a note. Labels from messages or from ' +
          '`replyLabel` / `noteLabel` / `noteHint`; one mode shows no switch.\n\n' +
          '**Tools:** saved replies (`savedReplies`, the application’s texts, grouped, searched ' +
          'from 11) inserted at the caret; the paperclip (`onAttach`, `accept`; dropping files on ' +
          'the composer is the shortcut) with the files in `attachments` (an AttachmentList); ' +
          '`onInsertLink`: the application opens its own search (a knowledge base in ' +
          'LookupDialog) and resolves with `{ text, href }`, inserted as a link at the caret. ' +
          '**Merge values** (P5.31): a saved reply may use merge fields ("Dear ' +
          '{{contact.firstName}}, … today, {{date_now}}"); with `mergeValues` (this ' +
          'conversation’s values) they are written in as it is inserted — dates and amounts ' +
          "through `format`, fields `computed` from 'today' or 'now' from the provider’s day " +
          'and the application’s `now` — and a field without a value stays a pill marked "No ' +
          'value", named under the text. ' +
          '**Send** (or Ctrl/Cmd+Enter), filled once there is something to send: ' +
          '`onSend({ mode, value })`; a promise keeps the text ' +
          'with a spinner until it resolves.\n\n' +
          '**When not:** a chat message or comment without formatting (MessageComposer); a long ' +
          'document (RichTextField).',
      },
    },
  },
  args: { onSend: () => undefined },
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
  },
} satisfies Meta<typeof ReplyComposer>

export default meta

type Story = StoryObj<typeof meta>

/** A reply being written, with a file; the tools under the text. */
export const Default: Story = {
  render: () => <Composer defaultValue={DRAFT} files={[FILE]} />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radiogroup', { name: 'Message type' })).toBeVisible()
    await expect(canvas.getByRole('radio', { name: 'Reply' })).toBeChecked()
    await expect(canvas.getByRole('textbox', { name: 'Reply' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Attach files' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Insert article' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Saved replies/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeEnabled()
  },
}

/** Nothing written yet: the placeholder, Send disabled. */
export const Empty: Story = {
  render: () => <Composer />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    await expect(within(canvasElement).getByRole('button', { name: 'Send' })).toBeDisabled()
  },
}

/** An internal note: sunken, who sees it, "Add note"; "@" offers the team. */
export const InternalNote: Story = {
  name: 'Internal note',
  render: () => (
    <Composer
      defaultMode="note"
      defaultValue={{
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'mention', attrs: { id: 'u-ana', label: 'Ana Kovač' } },
              { type: 'text', text: ' can you check the buyer’s tax number in the register?' },
            ],
          },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Internal note' })).toBeChecked()
    await expect(canvas.getByText('Only your team sees internal notes.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Add note' })).toBeEnabled()
  },
}

/** Replies only (a customer's own reply): no switch. */
export const ReplyOnly: Story = {
  name: 'Reply only',
  render: () => (
    <Composer modes={['reply']} replyLabel="Your reply" placeholder="Write your reply" />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('group', { name: 'Message type' })).toBeNull()
    await expect(canvas.getByRole('textbox', { name: 'Your reply' })).toBeVisible()
  },
}

/** The application is sending: a spinner, Send disabled. */
export const Sending: Story = {
  render: () => <Composer defaultValue={DRAFT} sending />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Sending…')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled()
  },
}

/** Nothing can be written (P5.93): the text read-only, the tools and Send unavailable, why in words. */
export const UnavailableWithReason: Story = {
  name: 'Unavailable with reason',
  render: () => (
    <Composer unavailableReason="The request is closed. Reopen it to reply." defaultValue={DRAFT} />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('The request is closed. Reopen it to reply.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled()
    await expect(canvas.getByRole('radio', { name: 'Reply' })).toBeDisabled()
  },
}

/** A problem with the message, under the text. */
export const WithError: Story = {
  name: 'Error',
  render: () => (
    <Composer
      defaultValue={DRAFT}
      error="The reply was not sent: the customer’s e-mail address bounced. Check the contact."
    />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    await expect(within(canvasElement).getByRole('textbox', { name: 'Reply' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  },
}

/** A long draft and long names wrap; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <div className="w-[26rem] max-w-full">
      <Composer
        defaultValue={LONG_DRAFT}
        replyLabel={LONG.label}
        files={[{ ...FILE, name: `${LONG.value}.pdf` }]}
      />
    </div>
  ),
}

/** On a phone: the tools wrap under the text. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <Composer defaultValue={DRAFT} files={[FILE]} />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div lang="ar">
        <Composer
          defaultValue={ARABIC_REPLY}
          savedReplies={ARABIC_SAVED}
          replyLabel={ARABIC.label}
          placeholder={ARABIC.placeholder}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div lang="ja">
        <Composer
          defaultValue={JAPANESE_REPLY}
          savedReplies={JAPANESE_SAVED}
          replyLabel={JAPANESE.label}
          placeholder={JAPANESE.placeholder}
        />
      </div>
    </StoryProvider>
  ),
}

/**
 * Writing a reply: a saved reply inserted at the caret, then Ctrl+Enter sends it and the text is
 * emptied.
 */
export const WritingInteraction: Story = {
  name: 'Writing a reply, interaction',
  tags: ['interaction'],
  render: () => <Composer />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Reply' })
    await userEvent.click(box)
    await userEvent.keyboard('Hello Milica. ')
    await userEvent.click(canvas.getByRole('button', { name: /Saved replies/ }))
    const list = await within(document.body).findByRole('listbox', { name: 'Saved replies' })
    await userEvent.click(within(list).getByRole('option', { name: 'Thank you for writing' }))
    await waitFor(async () => {
      await expect(box).toHaveTextContent('Hello Milica. Thank you for writing to us.')
    })
    box.focus()
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    const sent = await canvas.findByTestId('sent')
    await expect(sent).toHaveTextContent(
      /^reply: <p[^>]*>Hello Milica\. Thank you for writing to us\./,
    )
    await waitFor(async () => {
      await expect(box).toHaveTextContent('')
    })
  },
}

/** A note: switch to Internal note, mention a colleague with "@", "Add note". */
export const NoteInteraction: Story = {
  name: 'Internal note with a mention, interaction',
  tags: ['interaction'],
  render: () => <Composer />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Internal note' }))
    await expect(canvas.getByText('Only your team sees internal notes.')).toBeVisible()
    const box = canvas.getByRole('textbox', { name: 'Internal note' })
    await userEvent.click(box)
    await userEvent.keyboard('@Ana')
    const list = await within(document.body).findByRole('listbox', { name: 'People to mention' })
    await userEvent.click(within(list).getByRole('option', { name: /Ana Kovač/ }))
    await userEvent.keyboard('please check.')
    await userEvent.click(canvas.getByRole('button', { name: 'Add note' }))
    await expect(await canvas.findByTestId('sent')).toHaveTextContent('note: ')
    await expect(canvas.getByTestId('sent')).toHaveTextContent('mentions: u-ana')
  },
}

/** "Insert article": the application's search resolves a link, inserted at the caret. */
export const InsertLinkInteraction: Story = {
  name: 'Insert an article, interaction',
  tags: ['interaction'],
  render: () => <Composer />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Reply' })
    await userEvent.click(box)
    await userEvent.keyboard('Please read ')
    await userEvent.click(canvas.getByRole('button', { name: 'Insert article' }))
    const link = await within(box).findByRole('link', { name: ARTICLE.text })
    await expect(link).toHaveAttribute('href', ARTICLE.href)
  },
}

/** Twelve saved replies: the list is searched by typing. */
export const ManySavedRepliesInteraction: Story = {
  name: 'Many saved replies, interaction',
  tags: ['interaction'],
  render: () => <Composer savedReplies={MANY_SAVED_REPLIES} />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Saved replies/ }))
    const search = await within(document.body).findByPlaceholderText('Find a saved reply')
    await userEvent.type(search, 'payroll')
    const list = within(document.body).getByRole('listbox', { name: 'Saved replies' })
    await waitFor(async () => {
      await expect(within(list).getAllByRole('option')).toHaveLength(2)
    })
    await userEvent.keyboard('{Enter}')
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Reply' })).toHaveTextContent(
        'Payroll export: bank format.',
      )
    })
  },
}

/** Attaching: the chosen file is listed under the text. */
export const AttachInteraction: Story = {
  name: 'Attaching a file, interaction',
  tags: ['interaction'],
  render: () => <Composer />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('No file input')
    await userEvent.upload(input, new File(['%PDF'], 'Screenshot.pdf', { type: 'application/pdf' }))
    await expect(
      await canvas.findByRole('list', { name: 'Files of this reply' }),
    ).toHaveTextContent('Screenshot.pdf')
  },
}

/**
 * A reply started from a saved reply with merge fields (P5.31): the contact's name, the ticket,
 * the incident date (through `format`) and today and today + 7 (computed from the provider's
 * `today`) are written in; the invoice number has no value yet — a pill marked "No value",
 * named under the text.
 */
export const WithValues: Story = {
  name: 'Merge values, one missing',
  // Today and today + 7 are written into the text: a fixed day keeps the picture from changing
  // with the date (C6).
  render: () => (
    <StoryProvider today="2026-10-15">
      <Composer
        savedReplies={VALUE_REPLIES}
        mergeFields={TICKET_FIELDS}
        mergeValues={TICKET_VALUES}
        defaultValue={CALL_REPLY.content}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Reply' })
    await expect(box).toHaveTextContent('Dear Milica,')
    await expect(box).toHaveTextContent('ticket 4821.')
    await expect(box).not.toHaveTextContent('{{')
    await expect(canvas.getByText('No value: Invoice number')).toBeInTheDocument()
    await expect(
      canvas.getByText('No value yet for Invoice number. Fill it in or remove it.'),
    ).toBeVisible()
  },
}

/** Choosing a saved reply with merge fields: it goes in with this conversation's values. */
export const SavedReplyValuesInteraction: Story = {
  name: 'Saved reply with values, interaction',
  tags: ['interaction'],
  render: () => (
    <Composer
      savedReplies={VALUE_REPLIES}
      mergeFields={TICKET_FIELDS}
      mergeValues={{ ...TICKET_VALUES, 'invoice.number': 'F-2026-0412' }}
    />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Saved replies/ }))
    const list = await within(document.body).findByRole('listbox', { name: 'Saved replies' })
    await userEvent.click(within(list).getByRole('option', { name: /After a phone call/ }))
    const box = canvas.getByRole('textbox', { name: 'Reply' })
    await waitFor(async () => {
      await expect(box).toHaveTextContent('Dear Milica,')
    })
    await expect(box).toHaveTextContent('invoice F-2026-0412 was rejected')
    await expect(box.querySelector('[data-merge-field]')).toBeNull()
    await expect(canvasElement.querySelector('[data-slot="merge-missing"]')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }))
    await waitFor(async () => {
      await expect(canvas.getByTestId('sent')).toHaveTextContent('Dear Milica')
    })
  },
}

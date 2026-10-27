import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MessageBubble } from '../components/messages'
import { SlaTimer } from '../components/sla-timer'
import { LiroProvider } from '../provider/liro-provider'
import {
  groupSavedReplies,
  isSendKey,
  linkNodes,
  ReplyComposer,
  type SavedReply,
} from './reply-composer'
import { insertable } from './rich-text-field'
import type { RichTextNode } from './rich-text-logic'

const render = (node: ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const paragraph = (text: string): RichTextNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

describe('insertable', () => {
  it('inserts plain text as one text node, nothing for an empty text', () => {
    expect(insertable('Hello')).toEqual({ type: 'text', text: 'Hello' })
    expect(insertable('')).toEqual([])
  })
  it('joins a one-paragraph document to the line at the caret', () => {
    expect(insertable({ type: 'doc', content: [paragraph('Thanks!')] })).toEqual([
      { type: 'text', text: 'Thanks!' },
    ])
  })
  it('inserts the blocks of a longer document, and nodes as they are', () => {
    const doc: RichTextNode = { type: 'doc', content: [paragraph('One'), paragraph('Two')] }
    expect(insertable(doc)).toEqual([paragraph('One'), paragraph('Two')])
    expect(insertable([paragraph('One')])).toEqual([paragraph('One')])
    expect(insertable(paragraph('One'))).toEqual(paragraph('One'))
  })
})

describe('linkNodes', () => {
  it('makes a link and a space after it', () => {
    expect(
      linkNodes({ text: ' Reset two-factor sign-in ', href: 'https://example.com/kb/2' }),
    ).toEqual([
      {
        type: 'text',
        text: 'Reset two-factor sign-in',
        marks: [{ type: 'link', attrs: { href: 'https://example.com/kb/2' } }],
      },
      { type: 'text', text: ' ' },
    ])
  })
  it('refuses addresses a link may not have and empty texts', () => {
    expect(linkNodes({ text: 'Run', href: 'javascript:alert(1)' })).toBeNull()
    expect(linkNodes({ text: '   ', href: 'https://example.com' })).toBeNull()
  })
})

describe('isSendKey', () => {
  it('sends on Ctrl+Enter and Cmd+Enter only', () => {
    expect(isSendKey({ key: 'Enter', ctrlKey: true, metaKey: false })).toBe(true)
    expect(isSendKey({ key: 'Enter', ctrlKey: false, metaKey: true })).toBe(true)
    expect(isSendKey({ key: 'Enter', ctrlKey: false, metaKey: false })).toBe(false)
    expect(isSendKey({ key: 'Enter', ctrlKey: true, metaKey: false, isComposing: true })).toBe(
      false,
    )
    expect(isSendKey({ key: 'k', ctrlKey: true, metaKey: false })).toBe(false)
  })
})

describe('groupSavedReplies', () => {
  it('keeps ungrouped replies first, then groups in order of first appearance', () => {
    const reply = (id: string, group?: string): SavedReply => ({
      id,
      label: id,
      content: { type: 'doc', content: [paragraph(id)] },
      ...(group === undefined ? {} : { group }),
    })
    const grouped = groupSavedReplies([
      reply('a', 'Access'),
      reply('b'),
      reply('c', 'Billing'),
      reply('d', 'Access'),
    ])
    expect(grouped.map((group) => [group.group, group.replies.map((each) => each.id)])).toEqual([
      [undefined, ['b']],
      ['Access', ['a', 'd']],
      ['Billing', ['c']],
    ])
  })
})

describe('ReplyComposer', () => {
  it('offers both modes, the reply pressed first, the send button disabled while empty', () => {
    const html = render(<ReplyComposer onSend={() => undefined} placeholder="Write a reply" />)
    expect(html).toContain('aria-label="Message type"')
    expect(html).toMatch(/role="radio" aria-checked="true"[^>]*>(<[^>]+>)*Reply/)
    expect(html).toContain('Internal note')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*?Send<\/span>/)
    expect(html).not.toContain('Only your team sees internal notes.')
  })
  it('shows who sees a note, on the sunken surface, with "Add note"', () => {
    const html = render(<ReplyComposer defaultMode="note" onSend={() => undefined} />)
    expect(html).toContain('Only your team sees internal notes.')
    expect(html).toContain('bg-surface-sunken')
    expect(html).toContain('Add note')
  })
  it('shows no switch with one mode, and the tools it is given', () => {
    const html = render(
      <ReplyComposer
        modes={['reply']}
        onSend={() => undefined}
        onAttach={() => undefined}
        onInsertLink={() => Promise.resolve(null)}
        insertLinkLabel="Insert article"
        savedReplies={[
          { id: 'r1', label: 'Thanks', content: { type: 'doc', content: [paragraph('Thanks')] } },
        ]}
      />,
    )
    expect(html).not.toContain('Message type')
    expect(html).toContain('aria-label="Attach files"')
    expect(html).toContain('aria-label="Insert article"')
    expect(html).toContain('Saved replies')
  })
  it('can send a draft it starts with', () => {
    const html = render(
      <ReplyComposer
        defaultValue={{ type: 'doc', content: [paragraph('Draft')] }}
        onSend={() => undefined}
      />,
    )
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>.*?Send<\/span>/)
  })
})

describe('MessageBubble internal', () => {
  it('marks an internal note with words and its own surface', () => {
    const html = render(
      <MessageBubble author={{ name: 'Ana Kovač' }} internal>
        Checked the certificate.
      </MessageBubble>,
    )
    expect(html).toContain('data-internal="true"')
    expect(html).toContain('data-surface="note"')
    expect(html).toContain('>Internal</span>')
  })
})

describe('SlaTimer', () => {
  const NOW = '2026-10-14T09:40:00+02:00'
  it('says overdue in words', () => {
    const html = render(<SlaTimer due="2026-10-14T09:00:00+02:00" now={NOW} />)
    expect(html).toContain('data-state="overdue"')
    expect(html).toContain('Overdue by 40 min')
  })
  it('names the deadline and shows its instant', () => {
    const html = render(
      <SlaTimer label="First response" due="2026-10-14T11:55:00+02:00" now={NOW} showDue />,
    )
    expect(html).toContain('First response:')
    expect(html).toContain('Due in 2 h 15 min')
    expect(html).toContain('Due 10/14/2026')
  })
  it('shows paused, met and an unreadable deadline', () => {
    expect(render(<SlaTimer due="2026-10-14T09:00:00+02:00" now={NOW} paused />)).toContain(
      'Paused',
    )
    expect(
      render(
        <SlaTimer
          due="2026-10-14T09:00:00+02:00"
          now={NOW}
          completedAt="2026-10-14T08:00:00+02:00"
        />,
      ),
    ).toContain('Met')
    expect(render(<SlaTimer due="soon" now={NOW} />)).toContain('—')
  })
})

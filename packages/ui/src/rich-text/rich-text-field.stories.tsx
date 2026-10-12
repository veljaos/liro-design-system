import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { FileText } from 'lucide-react'
import { Button } from '../components/button'
import { LONG } from '../components/field-story-data'
import type { MentionCandidate } from '../components/mention-combobox'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { RichTextField, type RichTextFieldProps } from './rich-text-field'
import {
  EMPTY_RICH_TEXT,
  normalizeRichText,
  richTextFromHtml,
  richTextValue,
  type RichTextNode,
  type RichTextValue,
} from './rich-text-logic'
import {
  ARABIC_FIELDS,
  ARABIC_LETTER,
  COMMENT,
  JAPANESE_FIELDS,
  JAPANESE_LETTER,
  LONG_NOTE,
  OFFER_FIELDS,
  OFFER_LETTER,
  PEOPLE,
  WORD_FRAGMENT,
} from './rich-text-story-data'

/** The field, and under it what it reports: the stored HTML, mentions and merge fields. */
function Recorded(props: RichTextFieldProps) {
  const [value, setValue] = useState<RichTextValue>(() =>
    richTextValue(normalizeRichText(props.defaultValue ?? EMPTY_RICH_TEXT)),
  )
  return (
    <div className="flex max-w-180 flex-col gap-4">
      <RichTextField
        {...props}
        onChange={(next) => {
          setValue(next)
          props.onChange?.(next)
        }}
      />
      <section aria-label="Reported value" className="flex flex-col gap-1 text-xs text-secondary">
        <span className={cn('font-semibold', TEXT_DIRECTION)}>Stored HTML</span>
        <code
          data-testid="stored-html"
          dir="ltr"
          className="block rounded-md bg-surface-sunken p-3 font-mono break-all whitespace-pre-wrap text-primary"
        >
          {value.html}
        </code>
        <span data-testid="reported" className={TEXT_DIRECTION}>
          Mentions: {value.mentions.map((mention) => mention.id).join(', ') || '—'} · Merge fields:{' '}
          {value.mergeFields.join(', ') || '—'} · Length: {value.length}
        </span>
      </section>
    </div>
  )
}

/** Waits until the editor has replaced the first drawing, then for overlays. */
async function editorReady(canvasElement: HTMLElement) {
  await waitFor(async () => {
    await expect(canvasElement.querySelector('.ProseMirror')).not.toBeNull()
  })
  await settle()
}

const meta = {
  title: 'Components/Rich text/RichTextField',
  component: RichTextField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** formatted text that keeps its formatting — a letter or e-mail template, ' +
          'a note on a record, a comment. Paragraphs, a heading and a subheading, bulleted and ' +
          'numbered lists, bold, italic, underline and links, from a small toolbar (one tab stop; ' +
          'the arrows move between its controls) or the shortcuts Ctrl/Cmd+B, I, U and K. ' +
          'Built on Tiptap’s MIT packages only, from the `@veljaos/ui/rich-text` subpath, so an ' +
          'application without rich text never loads the editor.\n\n' +
          '**Merge fields** (`mergeFields`: key, label, group) are inserted from the toolbar’s ' +
          'menu or by typing "{{"; each is one neutral pill with its label, stored as ' +
          '`<span data-merge-field="key">{{key}}</span>`. The Core fills them in. **Mentions** ' +
          '(`mentionCandidates`, or `onMentionSearch` with `mentionsLoading`) work as in ' +
          'MentionCombobox; a mention is one node with the person’s id.\n\n' +
          '**The value** is Tiptap’s JSON (`value` / `defaultValue`); `onChange` reports ' +
          '`{ json, html, mentions, mergeFields, length }`, the HTML sanitized (`sanitizeRichHtml`). ' +
          'Paste keeps structure only. `maxLength` shows a counter and, beyond it, how many ' +
          'characters are too many. Read-only shows RichText.\n\n' +
          '**When not:** plain text (TextAreaField); a chat message (MessageComposer); text the ' +
          'user must not format.',
      },
    },
  },
  args: { label: 'Letter' },
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
  },
} satisfies Meta<typeof RichTextField>

export default meta

type Story = StoryObj<typeof meta>

/** An offer letter template with merge fields, and the value it reports. */
export const OfferLetter: Story = {
  name: 'Offer letter template',
  render: () => (
    <Recorded
      label="Offer letter"
      description="Sent with every offer. Merge fields are filled in when the offer is sent."
      defaultValue={OFFER_LETTER}
      mergeFields={OFFER_FIELDS}
      maxLength={4000}
      minRows={8}
    />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Offer letter' })
    await expect(box).toHaveAttribute('aria-multiline', 'true')
    await expect(within(box).getByText('Merge field: Customer name')).toBeInTheDocument()
    await expect(canvas.getByRole('toolbar', { name: 'Formatting' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Text style: / })).toBeVisible()
    await expect(canvas.getByTestId('stored-html')).toHaveTextContent(
      '<span data-merge-field="invoice.number">{{invoice.number}}</span>',
    )
  },
}

/** A comment with mentions; "@" offers the people. */
export const Comment: Story = {
  name: 'Comment with mentions',
  render: () => (
    <Recorded
      label="Comment"
      hideLabel
      defaultValue={COMMENT}
      mentionCandidates={PEOPLE}
      placeholder="Write a comment; @ mentions a colleague"
      maxLength={1000}
      minRows={3}
    />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('reported')).toHaveTextContent('Mentions: u-milica, u-stefan')
  },
}

/** Nothing written yet: the placeholder. */
export const Empty: Story = {
  render: () => (
    <div className="max-w-140">
      <RichTextField
        label="Note"
        description="Visible to everyone working on this project."
        placeholder="Write a note"
        mergeFields={OFFER_FIELDS}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    await expect(within(canvasElement).getByRole('textbox', { name: 'Note' })).toHaveAttribute(
      'aria-placeholder',
      'Write a note',
    )
  },
}

/** Read-only: the text as RichText, selectable, no toolbar. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <div className="max-w-180">
      <RichTextField
        label="Offer letter"
        readOnly
        defaultValue={OFFER_LETTER}
        mergeFields={OFFER_FIELDS}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const value = canvas.getByRole('group', { name: 'Offer letter' })
    await expect(within(value).getByText('Merge field: Customer name')).toBeInTheDocument()
    await expect(canvas.queryByRole('toolbar')).toBeNull()
    await expect(canvas.queryByRole('textbox')).toBeNull()
  },
}

/** Disabled, with its reason under it; the toolbar is disabled too. */
export const Disabled: Story = {
  name: 'Disabled with reason',
  render: () => (
    <div className="max-w-180">
      <RichTextField
        label="Offer letter"
        disabled
        disabledReason="The offer was sent on 6 October 2026; its letter can no longer change."
        defaultValue={OFFER_LETTER}
        mergeFields={OFFER_FIELDS}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Offer letter' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Bold' })).toBeDisabled()
  },
}

/** Required, with an error under it. */
export const WithError: Story = {
  name: 'Error',
  render: () => (
    <div className="max-w-140">
      <RichTextField
        label="Reason for the rejection"
        required
        error="Say why the offer is rejected; the customer reads this text."
        placeholder="Write the reason"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    await expect(
      within(canvasElement).getByRole('textbox', { name: 'Reason for the rejection' }),
    ).toHaveAttribute('aria-invalid', 'true')
  },
}

/** Over `maxLength`: the counter says how many characters are too many. Nothing is cut. */
export const TooLong: Story = {
  name: 'Over the limit',
  render: () => (
    <div className="max-w-140">
      <RichTextField
        label="Comment"
        defaultValue={COMMENT}
        mentionCandidates={PEOPLE}
        maxLength={80}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByText('37 characters too many')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Comment' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  },
}

/** The value is still loading. */
export const Loading: Story = {
  render: () => (
    <div className="max-w-140">
      <RichTextField label="Offer letter" loading mergeFields={OFFER_FIELDS} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Loading…')).toBeInTheDocument()
  },
}

/** Long label, description, error and text: everything wraps, the box grows. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <div className="max-w-140">
      <RichTextField
        label={LONG.label}
        description={LONG.description}
        error={LONG.error}
        defaultValue={LONG_NOTE}
        mentionCandidates={PEOPLE}
        maxLength={2000}
      />
    </div>
  ),
}

/** Phone width: the toolbar wraps onto a second line when it must. */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <RichTextField
          label="Offer letter"
          defaultValue={OFFER_LETTER}
          mergeFields={OFFER_FIELDS}
          maxLength={4000}
        />
      </div>
    </PhoneFrame>
  ),
}

/** A text pasted from a word processor, kept as structure: no styles, colours or fonts. */
export const PastedWord: Story = {
  name: 'Pasted from Word, cleaned',
  render: () => (
    <Recorded
      label="Delivery terms"
      description="Pasted from a Word document: the headings, bold, italic, underline, lists and links stay; styles, colours, fonts and the unsafe link go."
      defaultValue={richTextFromHtml(WORD_FRAGMENT)}
    />
  ),
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const html = within(canvasElement).getByTestId('stored-html')
    await expect(html).toHaveTextContent('<h2 dir="auto">Delivery terms</h2>')
    await expect(html).not.toHaveTextContent('color')
    await expect(html).not.toHaveTextContent('javascript')
  },
}

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div lang="ar" className="max-w-140">
        <RichTextField
          label="نص العرض"
          description="يرسل مع كل عرض"
          defaultValue={ARABIC_LETTER}
          mergeFields={ARABIC_FIELDS}
          maxLength={2000}
        />
      </div>
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div lang="ja" className="max-w-140">
        <RichTextField
          label="見積書の本文"
          description="見積りと一緒に送信されます"
          defaultValue={JAPANESE_LETTER}
          mergeFields={JAPANESE_FIELDS}
          maxLength={2000}
        />
      </div>
    </StoryProvider>
  ),
}

// ── Interaction stories (not pictured) ─────────────────────────────────────────────────────────

/** Typing, the shortcuts and the stored HTML. */
export const TypingAndShortcuts: Story = {
  name: 'Typing and shortcuts, interaction',
  tags: ['interaction'],
  args: { onChange: fn(), onBlur: fn() },
  render: (args) => (
    <Recorded
      label="Note"
      placeholder="Write a note"
      {...(args.onChange === undefined ? {} : { onChange: args.onChange })}
      {...(args.onBlur === undefined ? {} : { onBlur: args.onBlur })}
    />
  ),
  play: async ({ canvasElement, args }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Note' })
    await userEvent.click(box)
    await userEvent.keyboard('Plain, ')
    await userEvent.keyboard('{Control>}b{/Control}bold')
    await userEvent.keyboard('{Control>}b{/Control}, {Control>}i{/Control}italic')
    await userEvent.keyboard('{Control>}i{/Control} and {Control>}u{/Control}underlined')
    await waitFor(async () => {
      await expect(canvas.getByTestId('stored-html')).toHaveTextContent(
        '<p dir="auto">Plain, <strong>bold</strong>, <em>italic</em> and <u>underlined</u></p>',
      )
    })
    await expect(canvas.getByRole('button', { name: 'Underline' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(args.onChange).toHaveBeenCalled()
    // Undo takes back the last word.
    await userEvent.keyboard('{Control>}z{/Control}')
    await waitFor(async () => {
      await expect(canvas.getByTestId('stored-html')).not.toHaveTextContent('underlined')
    })
    // Leaving the text reports the blur.
    await userEvent.tab()
    await expect(args.onBlur).toHaveBeenCalled()
  },
}

/** A controlled value: the application replaces the text ("Use the standard letter"). */
function ControlledLetter() {
  const [value, setValue] = useState<RichTextNode>(EMPTY_RICH_TEXT)
  return (
    <div className="flex max-w-180 flex-col items-start gap-3">
      <RichTextField
        label="Letter"
        value={value}
        mergeFields={OFFER_FIELDS}
        onChange={(next) => {
          setValue(next.json)
        }}
        className="self-stretch"
      />
      <Button
        family="neutral"
        icon={FileText}
        label="Use the standard letter"
        onClick={() => {
          setValue(OFFER_LETTER)
        }}
      />
    </div>
  )
}

export const Controlled: Story = {
  name: 'Controlled value, interaction',
  tags: ['interaction'],
  render: () => <ControlledLetter />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Letter' })
    await userEvent.click(box)
    await userEvent.keyboard('Draft')
    await waitFor(async () => {
      await expect(box).toHaveTextContent('Draft')
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Use the standard letter' }))
    await waitFor(async () => {
      await expect(within(box).getByText('Merge field: Customer name')).toBeInTheDocument()
    })
    await expect(box).not.toHaveTextContent('Draft')
  },
}

/** "{{" offers the merge fields; Enter inserts one as a pill. */
export const MergeFieldSuggestions: Story = {
  name: 'Merge field from "{{", interaction',
  tags: ['interaction'],
  render: () => <Recorded label="Letter" mergeFields={OFFER_FIELDS} />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Letter' })
    await userEvent.click(box)
    // "{{" is typed as "{{{{": user-event reads "{" as the start of a key name.
    await userEvent.keyboard('Dear {{{{due')
    const list = await within(document.body).findByRole('listbox', { name: 'Merge fields' })
    await expect(within(list).getAllByRole('option')).toHaveLength(1)
    await expect(box).toHaveAttribute('aria-activedescendant')
    await userEvent.keyboard('{Enter}')
    await waitFor(async () => {
      await expect(within(box).getByText('Merge field: Due date')).toBeInTheDocument()
    })
    await expect(canvas.getByTestId('stored-html')).toHaveTextContent(
      'Dear <span data-merge-field="invoice.dueDate">{{invoice.dueDate}}</span>',
    )
    // Escape closes the list until the next "{{".
    await userEvent.keyboard(' {{{{')
    await within(document.body).findByRole('listbox', { name: 'Merge fields' })
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('listbox')).toBeNull()
    })
  },
}

/** The toolbar's menu inserts a merge field at the caret. */
export const MergeFieldMenu: Story = {
  name: 'Merge field from the menu, interaction',
  tags: ['interaction'],
  render: () => <Recorded label="Letter" mergeFields={OFFER_FIELDS} />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Letter' }))
    await userEvent.keyboard('Total: ')
    await userEvent.click(canvas.getByRole('button', { name: 'Insert merge field' }))
    const menu = await within(document.body).findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Total' }))
    await waitFor(async () => {
      await expect(canvas.getByTestId('stored-html')).toHaveTextContent(
        'Total: <span data-merge-field="invoice.total">{{invoice.total}}</span>',
      )
    })
    await expect(canvas.getByRole('textbox', { name: 'Letter' })).toHaveFocus()
  },
}

/** "@" offers people; the mention is reported with its id. */
export const Mentions: Story = {
  name: 'Mention with "@", interaction',
  tags: ['interaction'],
  render: () => <Recorded label="Comment" mentionCandidates={PEOPLE} />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Comment' }))
    await userEvent.keyboard('Please check @sTe')
    const list = await within(document.body).findByRole('listbox', { name: 'People to mention' })
    await waitFor(async () => {
      await expect(within(list).getByRole('option', { name: /Stefan Nikolić/u })).toBeVisible()
    })
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('today.')
    await waitFor(async () => {
      await expect(canvas.getByTestId('stored-html')).toHaveTextContent(
        'Please check <span data-mention="u-stefan">@Stefan Nikolić</span> today.',
      )
    })
    await expect(canvas.getByTestId('reported')).toHaveTextContent('Mentions: u-stefan')
  },
}

/** The application searches for people; the list says it is loading meanwhile. */
function SearchingPeople() {
  const [found, setFound] = useState<MentionCandidate[]>([])
  const [loading, setLoading] = useState(false)
  return (
    <Recorded
      label="Comment"
      mentionCandidates={found}
      mentionsLoading={loading}
      mentionSearchDelay={200}
      onMentionSearch={(query) => {
        setLoading(true)
        window.setTimeout(() => {
          setFound(
            PEOPLE.filter((person) => person.name.toLowerCase().includes(query.toLowerCase())),
          )
          setLoading(false)
        }, 300)
      }}
    />
  )
}

export const MentionSearch: Story = {
  name: 'Mention search by the application, interaction',
  tags: ['interaction'],
  render: () => <SearchingPeople />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Comment' }))
    await userEvent.keyboard('@ana')
    await within(document.body).findByText('Loading…')
    const option = await within(document.body).findByRole('option', { name: /Ana Jovanović/u })
    await userEvent.click(option)
    await waitFor(async () => {
      await expect(canvas.getByTestId('reported')).toHaveTextContent('Mentions: u-ana')
    })
  },
}

/** Ctrl/Cmd+K opens the link dialog; the address is completed and checked. */
export const LinkDialog: Story = {
  name: 'Link dialog, interaction',
  tags: ['interaction'],
  render: () => <Recorded label="Note" />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Note' }))
    await userEvent.keyboard('Terms: ')
    await userEvent.keyboard('{Control>}k{/Control}')
    const dialog = await body.findByRole('dialog', { name: 'Link' })
    const address = within(dialog).getByRole('textbox', { name: 'Address' })
    await waitFor(async () => {
      await expect(address).toHaveFocus()
    })
    await userEvent.keyboard('javascript:alert(1){Enter}')
    await expect(
      await within(dialog).findByText('Enter a web address (https://…) or an e-mail address'),
    ).toBeVisible()
    await userEvent.clear(address)
    await userEvent.type(address, 'liro.rs/terms{Enter}')
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await waitFor(async () => {
      await expect(canvas.getByTestId('stored-html')).toHaveTextContent(
        'Terms: <a href="https://liro.rs/terms" rel="noopener noreferrer">liro.rs/terms</a>',
      )
    })
  },
}

/** The toolbar is one tab stop; the arrows, Home and End move inside it. */
export const ToolbarKeyboard: Story = {
  name: 'Toolbar keyboard, interaction',
  tags: ['interaction'],
  render: () => <Recorded label="Letter" mergeFields={OFFER_FIELDS} />,
  play: async ({ canvasElement }) => {
    await editorReady(canvasElement)
    const canvas = within(canvasElement)
    const style = canvas.getByRole('button', { name: 'Text style: Normal text' })
    // The arrows follow the screen: in right-to-left ArrowLeft moves to the next control.
    const rtl = getComputedStyle(style).direction === 'rtl'
    const next = rtl ? '{ArrowLeft}' : '{ArrowRight}'
    const previous = rtl ? '{ArrowRight}' : '{ArrowLeft}'
    style.focus()
    await userEvent.keyboard(next)
    const bold = canvas.getByRole('button', { name: 'Bold' })
    await expect(bold).toHaveFocus()
    await expect(style).toHaveAttribute('tabindex', '-1')
    await expect(bold).toHaveAttribute('tabindex', '0')
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('button', { name: 'Clear formatting' })).toHaveFocus()
    await userEvent.keyboard(next)
    await expect(style).toHaveFocus()
    await userEvent.keyboard(`${previous}${previous}`)
    await expect(canvas.getByRole('button', { name: 'Insert merge field' })).toHaveFocus()
    await userEvent.keyboard(`{Home}${next}{Enter}`)
    await expect(bold).toHaveAttribute('aria-pressed', 'true')
    // Tab leaves the toolbar for the text.
    await userEvent.tab()
    await expect(canvas.getByRole('textbox', { name: 'Letter' })).toHaveFocus()
  },
}

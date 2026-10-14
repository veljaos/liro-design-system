/*
 * Sample values for the ReplyComposer stories (fictitious data). Not part of the package: nothing
 * in src/rich-text/index.ts imports this file.
 */
import type { MentionCandidate } from '../components/mention-combobox'
import type { ComposerLink, SavedReply } from './reply-composer'
import type { RichTextNode } from './rich-text-logic'

const text = (value: string): RichTextNode => ({ type: 'text', text: value })
const p = (...content: RichTextNode[]): RichTextNode => ({ type: 'paragraph', content })
const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })
const bullets = (...items: string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [p(text(item))] })),
})

/** The team "@" offers in a note. */
export const TEAM: MentionCandidate[] = [
  { id: 'u-nikola', name: 'Nikola Ilić', description: 'E-invoicing team' },
  { id: 'u-ana', name: 'Ana Kovač', description: 'Accounts team' },
  { id: 'u-stefan', name: 'Stefan Đorđević', description: 'Payroll team' },
]

/** A few saved replies, grouped. */
export const SAVED_REPLIES: SavedReply[] = [
  {
    id: 'greeting',
    label: 'Thank you for writing',
    content: doc(p(text('Thank you for writing to us. '))),
  },
  {
    id: 'rejected-vat',
    label: 'Rejected: the buyer’s tax number',
    group: 'E-invoicing',
    content: doc(
      p(
        text(
          'The invoice was rejected because the buyer’s tax number does not match the register.',
        ),
      ),
      bullets(
        'Open the invoice and choose Correct.',
        'Enter the buyer’s tax number from the register.',
        'Send the invoice again.',
      ),
    ),
  },
  {
    id: 'resent',
    label: 'Sent again, waiting for the buyer',
    group: 'E-invoicing',
    content: doc(p(text('The corrected invoice is sent. The buyer has 15 days to accept it.'))),
  },
  {
    id: 'reset-2fa',
    label: 'Two-factor sign-in reset',
    group: 'Access',
    content: doc(
      p(
        text('We have reset your two-factor sign-in. Sign in again and set it up with your phone.'),
      ),
    ),
  },
]

/** Twelve saved replies: the list is searched by typing (from 11). */
export const MANY_SAVED_REPLIES: SavedReply[] = [
  ...SAVED_REPLIES,
  ...[
    'Payroll export: bank format',
    'Payroll export: file name',
    'Closing the request',
    'We need more details',
    'Waiting for your answer',
    'Known issue, a fix is coming',
    'Planned maintenance tonight',
    'Your licence was renewed',
  ].map((label, index) => ({
    id: `more-${String(index)}`,
    label,
    group: index < 2 ? 'Payroll' : 'General',
    content: doc(p(text(`${label}.`))),
  })),
]

/** The link "Insert article" finds in the stories. */
export const ARTICLE: ComposerLink = {
  text: 'Why was my SEF invoice rejected?',
  href: 'https://support.example.com/kb/sef-invoice-rejected',
}

/** A draft of a reply. */
export const DRAFT = doc(
  p(text('Dear Milica,')),
  p(text('The invoice was rejected because the buyer’s tax number does not match the register.')),
)

/** A long draft with a long word. */
export const LONG_DRAFT = doc(
  p(
    text(
      'The rejection notice lists every field the e-invoicing system checked, and the one that did not pass is the buyer’s tax number, which changed when the buyer merged with its parent company on the first of the month; the register already has the new number, and the reference ' +
        'SEF-REJ-2026-10-14-0000000412-BUYER-TAX-NUMBER-MISMATCH names it.',
    ),
  ),
)

/** Arabic samples. */
export const ARABIC_REPLY = doc(p(text('شكرًا لتواصلكم معنا. تم رفض الفاتورة بسبب الرقم الضريبي.')))
export const ARABIC_SAVED: SavedReply[] = [
  { id: 'ar-1', label: 'شكرًا لتواصلكم', content: doc(p(text('شكرًا لتواصلكم معنا.'))) },
]

/** Japanese samples. */
export const JAPANESE_REPLY = doc(
  p(text('お問い合わせありがとうございます。請求書は購入者の税番号の不一致により却下されました。')),
)
export const JAPANESE_SAVED: SavedReply[] = [
  {
    id: 'ja-1',
    label: 'お問い合わせのお礼',
    content: doc(p(text('お問い合わせありがとうございます。'))),
  },
]

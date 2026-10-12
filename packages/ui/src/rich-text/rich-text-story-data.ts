/*
 * Sample values for the rich text stories (fictitious data). Not part of the package: nothing in
 * src/rich-text/index.ts imports this file.
 */
import type { MentionCandidate } from '../components/mention-combobox'
import type { RichTextMergeField } from './rich-text'
import type { RichTextNode } from './rich-text-logic'

const text = (value: string, ...marks: string[]): RichTextNode =>
  marks.length === 0
    ? { type: 'text', text: value }
    : { type: 'text', text: value, marks: marks.map((type) => ({ type })) }
const merge = (key: string): RichTextNode => ({ type: 'mergeField', attrs: { key } })
const mention = (id: string, label: string): RichTextNode => ({
  type: 'mention',
  attrs: { id, label },
})
const p = (...content: RichTextNode[]): RichTextNode =>
  content.length === 0 ? { type: 'paragraph' } : { type: 'paragraph', content }
const heading = (level: 2 | 3, value: string): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
})
const bullets = (...items: RichTextNode[][]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((content) => ({ type: 'listItem', content: [p(...content)] })),
})
const numbered = (...items: RichTextNode[][]): RichTextNode => ({
  type: 'orderedList',
  content: items.map((content) => ({ type: 'listItem', content: [p(...content)] })),
})
const link = (value: string, href: string): RichTextNode => ({
  type: 'text',
  text: value,
  marks: [{ type: 'link', attrs: { href } }],
})
const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })

/** The fields an offer letter can use; the Core fills them in when it sends the letter. */
export const OFFER_FIELDS: RichTextMergeField[] = [
  { key: 'customer.name', label: 'Customer name', group: 'Customer' },
  { key: 'customer.contact', label: 'Contact person', group: 'Customer' },
  { key: 'invoice.number', label: 'Invoice number', group: 'Invoice' },
  { key: 'invoice.dueDate', label: 'Due date', group: 'Invoice' },
  { key: 'invoice.total', label: 'Total', group: 'Invoice' },
  { key: 'company.name', label: 'Our company', group: 'Company' },
]

/** An offer letter template with merge fields. */
export const OFFER_LETTER = doc(
  heading(2, 'Offer for the office fit-out'),
  p(text('Dear '), merge('customer.contact'), text(',')),
  p(
    text('Thank you for your enquiry. We are pleased to send you invoice '),
    { ...merge('invoice.number'), marks: [{ type: 'bold' }] },
    text(' for '),
    merge('customer.name'),
    text('. The total of '),
    merge('invoice.total'),
    text(' is due on '),
    merge('invoice.dueDate'),
    text('.'),
  ),
  heading(3, 'What is included'),
  bullets(
    [text('Design and measurements on site')],
    [text('Furniture, delivery and assembly')],
    [text('Two years of '), text('free', 'bold'), text(' service')],
  ),
  p(
    text('The full terms are on '),
    link('liro.rs/terms', 'https://liro.rs/terms'),
    text('. The offer is valid for '),
    text('30 days', 'underline'),
    text('.'),
  ),
  p(text('Kind regards,'), { type: 'hardBreak' }, merge('company.name')),
)

/** People who can be mentioned in a comment. */
export const PEOPLE: MentionCandidate[] = [
  { id: 'u-milica', name: 'Milica Petrović', description: 'Accountant' },
  { id: 'u-stefan', name: 'Stefan Nikolić', description: 'Sales manager' },
  { id: 'u-ana', name: 'Ana Jovanović', description: 'Project lead' },
  { id: 'u-marko', name: 'Marko Ilić', description: 'Warehouse' },
  { id: 'a-liro', name: 'Liro assistant', description: 'Agent', agent: true },
]

/** A comment on a record, with mentions. */
export const COMMENT = doc(
  p(
    mention('u-milica', 'Milica Petrović'),
    text(' the customer asked for '),
    text('two', 'bold'),
    text(' instalments. Can you check the terms with '),
    mention('u-stefan', 'Stefan Nikolić'),
    text('?'),
  ),
  numbered([text('First half on signing')], [text('Second half on delivery')]),
)

/** A long note, to show the text box growing and wrapping. */
export const LONG_NOTE = doc(
  heading(2, 'Handover notes for the Kvadrat Gradnja site office, phase two, north wing'),
  p(
    text(
      'The site office moves to the north wing on Monday. Every delivery from then on goes to the new gate on Bulevar Mihajla Pupina 10a, fourth floor, office 412, entrance from the courtyard, 11070 Novi Beograd, and the old gate stays closed except for the crane.',
    ),
  ),
  p(
    text('Thisisaverylongwordwithoutanyspacesthatmustwrapinsteadofstretchingthefield_'),
    text('and a link to '),
    link(
      'https://liro.rs/help/projects/site-office/handover-checklist-for-phase-two',
      'https://liro.rs/help/projects/site-office/handover-checklist-for-phase-two',
    ),
  ),
  bullets(
    [text('Keys: two sets at the reception, one with the site manager, one in the safe.')],
    [
      text(
        'Meters: read the water and electricity meters before the move and attach the photos to the record.',
      ),
    ],
    [text('Waste: the container is emptied every Thursday; call the day before when it is full.')],
  ),
  p(text('Questions to '), mention('u-ana', 'Ana Jovanović'), text('.')),
)

/** Arabic: an offer letter written right to left. */
export const ARABIC_FIELDS: RichTextMergeField[] = [
  { key: 'customer.name', label: 'اسم العميل' },
  { key: 'invoice.number', label: 'رقم الفاتورة' },
  { key: 'invoice.total', label: 'المبلغ الإجمالي' },
]
export const ARABIC_LETTER = doc(
  heading(2, 'عرض سعر'),
  p(text('السيد '), merge('customer.name'), text('،')),
  p(
    text('نرسل إليكم الفاتورة رقم '),
    merge('invoice.number'),
    text(' بمبلغ '),
    merge('invoice.total'),
    text('.'),
  ),
  bullets([text('التصميم والقياس')], [text('التوصيل والتركيب')]),
  p(text('Liro Business Core', 'bold'), text(' — نسخة إنجليزية داخل نص عربي.')),
)

/** Japanese: an offer letter. */
export const JAPANESE_FIELDS: RichTextMergeField[] = [
  { key: 'customer.name', label: '顧客名' },
  { key: 'invoice.number', label: '請求書番号' },
  { key: 'invoice.total', label: '合計' },
]
export const JAPANESE_LETTER = doc(
  heading(2, 'お見積りのご案内'),
  p(merge('customer.name'), text(' 様')),
  p(
    text('請求書 '),
    merge('invoice.number'),
    text(' をお送りします。合計金額は '),
    merge('invoice.total'),
    text(' です。'),
  ),
  numbered([text('設計と採寸')], [text('配送と組み立て')]),
)

/**
 * What a word processor puts on the clipboard: its own styles, classes, colours, fonts,
 * conditional comments and empty elements around a heading, a paragraph and a list.
 */
export const WORD_FRAGMENT =
  '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
  '<head><meta name=Generator content="Microsoft Word 15"><style>p.MsoNormal{margin:0cm;font-size:11pt;font-family:Calibri}</style></head>' +
  '<body lang=EN-GB style="tab-interval:36pt"><!--StartFragment-->' +
  '<h1 style="margin-top:12pt"><span style="font-size:16pt;font-family:Cambria;color:red">Delivery terms</span><o:p></o:p></h1>' +
  '<p class=MsoNormal style="line-height:115%"><span style="font-family:Arial;mso-highlight:yellow;background:yellow">Goods are delivered within </span>' +
  '<b><span style="font-size:14pt;color:blue">ten working days</span></b><span style="font-family:Arial"> of the order.</span><o:p></o:p></p>' +
  '<p class=MsoListParagraphCxSpFirst style="text-indent:-18pt;mso-list:l0 level1 lfo1"><![if !supportLists]><span style="font-family:Symbol">·<span style="font:7pt Times">&nbsp;&nbsp;&nbsp; </span></span><![endif]>' +
  '<span style="font-family:Arial">Delivery is free above 50,000 RSD.</span></p>' +
  '<ul style="margin-top:0cm"><li class=MsoNormal style="color:red"><i>Assembly</i> <font face=Wingdings color=blue size=4>is</font> <u>included</u>.</li>' +
  '<li class=MsoNormal><a href="https://liro.rs/delivery" style="color:blue;text-decoration:underline" target=_blank>Delivery calendar</a></li></ul>' +
  '<p class=MsoNormal><a href="javascript:alert(1)">A link that is not kept</a><img src="file:///C:/image001.png" width=20 height=20></p>' +
  '<!--EndFragment--></body></html>'

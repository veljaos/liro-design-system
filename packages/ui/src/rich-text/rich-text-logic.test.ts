import { describe, expect, it } from 'vitest'
import {
  isRichTextEmpty,
  linkFromInput,
  normalizeRichText,
  richTextFromHtml,
  richTextLength,
  richTextMentions,
  richTextMergeFields,
  richTextToHtml,
  richTextValue,
  safeHref,
  sanitizeRichHtml,
  suggestionAt,
  toolbarKeyTarget,
  type RichTextNode,
} from './rich-text-logic'

const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })
const p = (...content: RichTextNode[]): RichTextNode =>
  content.length === 0 ? { type: 'paragraph' } : { type: 'paragraph', content }
const text = (value: string, ...marks: string[]): RichTextNode =>
  marks.length === 0
    ? { type: 'text', text: value }
    : { type: 'text', text: value, marks: marks.map((type) => ({ type })) }
const merge = (key: string): RichTextNode => ({ type: 'mergeField', attrs: { key } })
const mention = (id: string, label: string): RichTextNode => ({
  type: 'mention',
  attrs: { id, label },
})

/** An offer letter as the editor stores it. */
const OFFER = doc(
  { type: 'heading', attrs: { level: 2 }, content: [text('Offer')] },
  p(text('Dear '), merge('customer.name'), text(',')),
  p(
    text('Invoice '),
    { ...merge('invoice.number'), marks: [{ type: 'bold' }] },
    text(' is due on '),
    merge('invoice.dueDate'),
    { type: 'hardBreak' },
    text('Total: ', 'italic'),
    merge('invoice.total'),
  ),
  {
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [p(text('First'))] },
      { type: 'listItem', content: [p(text('Second', 'underline'))] },
    ],
  },
  {
    type: 'orderedList',
    attrs: { start: 3 },
    content: [{ type: 'listItem', content: [p(text('Third'))] }],
  },
  p(
    text('See '),
    {
      type: 'text',
      text: 'the terms',
      marks: [{ type: 'link', attrs: { href: 'https://liro.rs/terms?a=1&b=2' } }, { type: 'bold' }],
    },
    text(' and ask '),
    mention('u-7', 'Milica Petrović'),
  ),
  p(),
)

describe('richTextToHtml', () => {
  it('writes the stored format: merge fields with their key, mentions with their id', () => {
    expect(richTextToHtml(OFFER)).toBe(
      '<h2 dir="auto">Offer</h2>' +
        '<p dir="auto">Dear <span data-merge-field="customer.name">{{customer.name}}</span>,</p>' +
        '<p dir="auto">Invoice <strong><span data-merge-field="invoice.number">{{invoice.number}}</span></strong>' +
        ' is due on <span data-merge-field="invoice.dueDate">{{invoice.dueDate}}</span><br>' +
        '<em>Total: </em><span data-merge-field="invoice.total">{{invoice.total}}</span></p>' +
        '<ul><li><p dir="auto">First</p></li><li><p dir="auto"><u>Second</u></p></li></ul>' +
        '<ol start="3"><li><p dir="auto">Third</p></li></ol>' +
        '<p dir="auto">See <a href="https://liro.rs/terms?a=1&amp;b=2" rel="noopener noreferrer">' +
        '<strong>the terms</strong></a> and ask <span data-mention="u-7">@Milica Petrović</span></p>' +
        '<p dir="auto"></p>',
    )
  })

  it('escapes text and attributes', () => {
    const html = richTextToHtml(
      doc(p(text('<img src=x onerror=alert(1)> & "q"'), mention('a"><script>', '<b>'))),
    )
    expect(html).toBe(
      '<p dir="auto">&lt;img src=x onerror=alert(1)&gt; &amp; "q"' +
        '<span data-mention="a&quot;&gt;&lt;script&gt;">@&lt;b&gt;</span></p>',
    )
  })

  it('drops unsafe links, bad merge-field keys and unknown nodes but keeps their text', () => {
    const html = richTextToHtml(
      doc(
        p({
          type: 'text',
          text: 'click',
          marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
        }),
        p(merge('a b'), merge('"><x')),
        { type: 'blockquote', content: [p(text('quoted'))] },
        { type: 'image', attrs: { src: 'x' } },
        p({ type: 'emoji', content: [text('☺')] }),
      ),
    )
    expect(html).toBe(
      '<p dir="auto">click</p><p dir="auto"></p><p dir="auto">quoted</p><p dir="auto">☺</p>',
    )
  })

  it('writes h1 as h2 and lower headings as h3', () => {
    expect(
      richTextToHtml(
        doc(
          { type: 'heading', attrs: { level: 1 }, content: [text('A')] },
          { type: 'heading', attrs: { level: 5 }, content: [text('B')] },
        ),
      ),
    ).toBe('<h2 dir="auto">A</h2><h3 dir="auto">B</h3>')
  })
})

describe('richTextFromHtml', () => {
  it('reads its own format back to the same JSON', () => {
    expect(richTextFromHtml(richTextToHtml(OFFER))).toEqual(OFFER)
    expect(normalizeRichText(OFFER)).toEqual(OFFER)
  })

  it('reads an empty input as one empty paragraph', () => {
    expect(richTextFromHtml('')).toEqual(doc(p()))
    expect(richTextFromHtml('   \n ')).toEqual(doc(p()))
  })

  it('keeps the structure of a Word fragment and nothing of its styles', () => {
    const word =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><style>p.MsoNormal{color:red}</style></head>' +
      '<body lang=SR-LATN style="tab-interval:35.4pt"><!--StartFragment-->' +
      '<p class=MsoNormal style="margin:0cm;font-family:Calibri"><b><span style="color:red;font-size:14pt;mso-highlight:yellow">Ponuda</span></b><o:p></o:p></p>\n' +
      '<p class=MsoListParagraphCxSpFirst style="mso-list:l0 level1 lfo1"><![if !supportLists]><span>·<span>&nbsp;&nbsp; </span></span><![endif]>' +
      '<span style="font-family:Arial">Prva&nbsp;stavka</span></p>\n' +
      '<ul><li style="color:blue"><i>Druga</i> <font color=red>stavka</font></li></ul>' +
      '<p><a href="https://liro.rs" style="color:blue;text-decoration:underline" target=_blank onclick="steal()">liro.rs</a></p>' +
      '<!--EndFragment--></body></html>'
    expect(sanitizeRichHtml(word)).toBe(
      '<p dir="auto"><strong>Ponuda</strong></p>' +
        '<p dir="auto">Prva\u00a0stavka</p>' +
        '<ul><li><p dir="auto"><em>Druga</em> stavka</p></li></ul>' +
        '<p dir="auto"><a href="https://liro.rs" rel="noopener noreferrer">liro.rs</a></p>',
    )
  })

  it('reads blocks of other kinds as paragraphs and line breaks as line breaks', () => {
    expect(
      richTextFromHtml(
        '<div>One</div><div>Two<br>three</div><table><tr><td>Cell</td></tr></table>',
      ),
    ).toEqual(
      doc(p(text('One')), p(text('Two'), { type: 'hardBreak' }, text('three')), p(text('Cell'))),
    )
  })

  it('closes an open paragraph at the next one, as HTML does', () => {
    expect(richTextFromHtml('<p>One<p>Two')).toEqual(doc(p(text('One')), p(text('Two'))))
    expect(richTextFromHtml('<ul><li>A<li>B</ul>')).toEqual(
      doc({
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [p(text('A'))] },
          { type: 'listItem', content: [p(text('B'))] },
        ],
      }),
    )
  })

  it('reads merge fields from their key and mentions from their id, whatever their text', () => {
    expect(
      richTextFromHtml(
        '<p><span data-merge-field="customer.name">Alfa</span> <span data-mention="u-1">@Ana</span>' +
          '<span data-merge-field="bad key">{{bad key}}</span></p>',
      ),
    ).toEqual(doc(p(merge('customer.name'), text(' '), mention('u-1', 'Ana'))))
  })

  it('collapses whitespace as HTML shows it', () => {
    expect(richTextFromHtml('<p>\n  Two   words \n</p>')).toEqual(doc(p(text('Two words'))))
    expect(richTextFromHtml('<p><b>Bold</b> <i>italic</i></p>')).toEqual(
      doc(p(text('Bold', 'bold'), text(' '), text('italic', 'italic'))),
    )
  })
})

describe('sanitizeRichHtml', () => {
  const vectors: [string, string][] = [
    ['<script>alert(1)</script>Hi', '<p dir="auto">Hi</p>'],
    ['<img src=x onerror="alert(1)">Hi', '<p dir="auto">Hi</p>'],
    ['<svg><script>alert(1)</script><p>x</p></svg>Hi', '<p dir="auto">Hi</p>'],
    ['<a href="javascript:alert(1)">x</a>', '<p dir="auto">x</p>'],
    ['<a href=" JaVaScRiPt:alert(1)">x</a>', '<p dir="auto">x</p>'],
    ['<a href="java&#x09;script:alert(1)">x</a>', '<p dir="auto">x</p>'],
    ['<a href="jav&#97;script:alert(1)">x</a>', '<p dir="auto">x</p>'],
    ['<a href="data:text/html,<script>alert(1)</script>">x</a>', '<p dir="auto">x</p>'],
    ['<a href="//evil.example">x</a>', '<p dir="auto">x</p>'],
    ['<a href="/relative">x</a>', '<p dir="auto">x</p>'],
    ['<a href="vbscript:x">x</a>', '<p dir="auto">x</p>'],
    [
      '<a href="mailto:ana@firma.rs" title="t" class="c">Ana</a>',
      '<p dir="auto"><a href="mailto:ana@firma.rs" rel="noopener noreferrer">Ana</a></p>',
    ],
    [
      '<p style="background:url(javascript:alert(1))" onmouseover="x()">x</p>',
      '<p dir="auto">x</p>',
    ],
    ['<style>p{}</style><p>x</p>', '<p dir="auto">x</p>'],
    ['<textarea><p onclick=x>y</p></textarea>z', '<p dir="auto">z</p>'],
    [
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>">x</p></noscript>',
      '<p dir="auto">"&gt;x</p>',
    ],
    ['<!--<img src=x onerror=alert(1)>-->ok', '<p dir="auto">ok</p>'],
    ['<p>a < b &amp; c > d</p>', '<p dir="auto">a &lt; b &amp; c &gt; d</p>'],
    ['<iframe src="x"></iframe><object data="x"></object>ok', '<p dir="auto">ok</p>'],
    ['<math><mi xlink:href="javascript:alert(1)">x</mi></math>ok', '<p dir="auto">ok</p>'],
    ['<p>unclosed <b>bold', '<p dir="auto">unclosed <strong>bold</strong></p>'],
    ['<p>cut <a href="https://x.rs', '<p dir="auto">cut</p>'],
    [
      '<span data-mention="x" onclick="y">@Ana</span>',
      '<p dir="auto"><span data-mention="x">@Ana</span></p>',
    ],
    [
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '<p dir="auto">&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    ],
  ]
  it.each(vectors)('cleans %s', (input, output) => {
    expect(sanitizeRichHtml(input)).toBe(output)
  })

  it('is a fixed point: sanitizing its own output changes nothing', () => {
    for (const [input] of vectors) {
      const once = sanitizeRichHtml(input)
      expect(sanitizeRichHtml(once)).toBe(once)
    }
    const offer = richTextToHtml(OFFER)
    expect(sanitizeRichHtml(offer)).toBe(offer)
  })

  it('reads character references', () => {
    expect(sanitizeRichHtml('&euro;&nbsp;5 &#8364; &#x20AC; &unknown; &#0;')).toBe(
      '<p dir="auto">€ 5 € € &amp;unknown; �</p>',
    )
    // A named reference without ";" in an address stays as it is (as browsers read it).
    expect(sanitizeRichHtml('<a href="https://x.rs/?a=1&copy=2">x</a>')).toBe(
      '<p dir="auto"><a href="https://x.rs/?a=1&amp;copy=2" rel="noopener noreferrer">x</a></p>',
    )
  })
})

describe('links', () => {
  it('keeps only http, https and mailto addresses', () => {
    expect(safeHref('https://liro.rs/a b')).toBeNull()
    expect(safeHref(' https://liro.rs ')).toBe('https://liro.rs')
    expect(safeHref('HTTP://liro.rs')).toBe('HTTP://liro.rs')
    expect(safeHref('https://')).toBeNull()
    expect(safeHref('mailto:ana@firma.rs')).toBe('mailto:ana@firma.rs')
    expect(safeHref('mailto:')).toBeNull()
    expect(safeHref('ftp://liro.rs')).toBeNull()
    expect(safeHref(42)).toBeNull()
  })

  it('completes what is typed in the link dialog', () => {
    expect(linkFromInput('liro.rs/pomoc')).toBe('https://liro.rs/pomoc')
    expect(linkFromInput('ana@firma.rs')).toBe('mailto:ana@firma.rs')
    expect(linkFromInput('https://liro.rs')).toBe('https://liro.rs')
    expect(linkFromInput('javascript:alert(1)')).toBeNull()
    expect(linkFromInput('not a link')).toBeNull()
    expect(linkFromInput('   ')).toBeNull()
  })
})

describe('reading the value', () => {
  it('counts characters, one for each merge field, mention and line break', () => {
    expect(
      richTextLength(
        doc(p(text('Zdravo 👋🏽')), p(merge('a'), { type: 'hardBreak' }, mention('1', 'Ana'))),
      ),
    ).toBe(
      // "Zdravo " 7 + 👋 1 + skin tone 1, then 3 atoms.
      12,
    )
    expect(richTextLength(OFFER)).toBeGreaterThan(0)
  })

  it('reports each mention and merge field once, in order', () => {
    const value = doc(
      p(
        mention('2', 'Bo'),
        merge('b'),
        mention('1', 'Ana'),
        merge('a'),
        mention('2', 'Bo'),
        merge('b'),
      ),
    )
    expect(richTextMentions(value)).toEqual([
      { id: '2', name: 'Bo' },
      { id: '1', name: 'Ana' },
    ])
    expect(richTextMergeFields(value)).toEqual(['b', 'a'])
  })

  it('knows an empty value', () => {
    expect(isRichTextEmpty(undefined)).toBe(true)
    expect(isRichTextEmpty(doc(p(), p(text('  '))))).toBe(true)
    expect(isRichTextEmpty(doc(p(merge('a'))))).toBe(false)
    expect(isRichTextEmpty(doc(p(text('x'))))).toBe(false)
  })

  it('reports JSON, sanitized HTML, mentions, merge fields and length together', () => {
    const value = richTextValue(OFFER)
    expect(value.json).toBe(OFFER)
    expect(value.html).toBe(richTextToHtml(OFFER))
    expect(value.mentions).toEqual([{ id: 'u-7', name: 'Milica Petrović' }])
    expect(value.mergeFields).toEqual([
      'customer.name',
      'invoice.number',
      'invoice.dueDate',
      'invoice.total',
    ])
    expect(value.length).toBe(richTextLength(OFFER))
  })
})

describe('suggestionAt', () => {
  it('starts a merge field at "{{"', () => {
    expect(suggestionAt('Dear {{cus')).toEqual({ kind: 'mergeField', start: 5, query: 'cus' })
    expect(suggestionAt('{{')).toEqual({ kind: 'mergeField', start: 0, query: '' })
    expect(suggestionAt('x{{a}b')).toBeNull()
    expect(suggestionAt('{{a￼b')).toBeNull()
  })

  it('starts a mention at "@" after a space or at the line start', () => {
    expect(suggestionAt('Ask @mil')).toEqual({ kind: 'mention', start: 4, query: 'mil' })
    expect(suggestionAt('@')).toEqual({ kind: 'mention', start: 0, query: '' })
    expect(suggestionAt('ana@firma')).toBeNull()
    expect(suggestionAt('@ x')).toBeNull()
    expect(suggestionAt('@a b c d')).toBeNull()
    expect(suggestionAt('￼@a')).toBeNull()
  })

  it('prefers the trigger nearest the caret', () => {
    expect(suggestionAt('{{a}} @bo')).toEqual({ kind: 'mention', start: 6, query: 'bo' })
    expect(suggestionAt('@ana {{in')).toEqual({ kind: 'mergeField', start: 5, query: 'in' })
  })
})

describe('toolbarKeyTarget', () => {
  it('moves with the arrows, wrapping, and to the ends with Home and End', () => {
    expect(toolbarKeyTarget('ArrowRight', 0, 4, 'ltr')).toBe(1)
    expect(toolbarKeyTarget('ArrowRight', 3, 4, 'ltr')).toBe(0)
    expect(toolbarKeyTarget('ArrowLeft', 0, 4, 'ltr')).toBe(3)
    expect(toolbarKeyTarget('Home', 2, 4, 'ltr')).toBe(0)
    expect(toolbarKeyTarget('End', 0, 4, 'ltr')).toBe(3)
  })

  it('follows the screen in right-to-left', () => {
    expect(toolbarKeyTarget('ArrowLeft', 0, 4, 'rtl')).toBe(1)
    expect(toolbarKeyTarget('ArrowRight', 0, 4, 'rtl')).toBe(3)
  })

  it('ignores other keys and an empty toolbar', () => {
    expect(toolbarKeyTarget('ArrowDown', 0, 4, 'ltr')).toBeNull()
    expect(toolbarKeyTarget('ArrowRight', 0, 0, 'ltr')).toBeNull()
  })
})

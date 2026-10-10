/*
 * The pure logic of the rich text (P5.22): the value's shape, the HTML it is stored as, the
 * sanitizer, the counts, and the keys of the toolbar and of the suggestion lists. No DOM and no
 * Tiptap: it runs alike on a server, in the unit tests and in the browser.
 *
 * **The value** is Tiptap's JSON (`RichTextNode`, a document of paragraphs, headings and lists of
 * text with bold, italic, underline and links, line breaks, merge fields and mentions) plus the
 * same content as HTML. **The HTML is always written by `richTextToHtml`**, which knows only the
 * allowed nodes and marks, escapes every text and attribute, and keeps a link only for http(s) and
 * mailto addresses: it cannot produce anything else. `sanitizeRichHtml` reads any HTML (pasted
 * from Word, stored by an older version, sent by another system) into that document and writes it
 * again, so its result is the same canonical HTML; nothing of the input is copied through.
 *
 * The stored HTML (docs/notes P5.22, "Stored format"):
 *   <p dir="auto">…</p>, <h2 dir="auto">…</h2>, <h3 dir="auto">…</h3>, <ul>, <ol start="N">, <li>,
 *   <br>, <strong>, <em>, <u>, <a href="…" rel="noopener noreferrer">,
 *   <span data-merge-field="key">{{key}}</span>, <span data-mention="id">@Name</span>.
 */

/** A mark on text (bold, italic, underline, link), as Tiptap's JSON. */
export interface RichTextMark {
  type: string
  attrs?: Record<string, unknown>
}

/** A node of the value, as Tiptap's JSON (`JSONContent`). The root is `{ type: 'doc' }`. */
export interface RichTextNode {
  type: string
  attrs?: Record<string, unknown>
  content?: RichTextNode[]
  marks?: RichTextMark[]
  text?: string
}

/** A person mentioned in the text, with the application's id. */
export interface RichTextMention {
  id: string
  name: string
}

/** What `onChange` reports: the JSON, the sanitized HTML and what the text refers to. */
export interface RichTextValue {
  /** Tiptap's JSON: the value to store and to pass back as `value`. */
  json: RichTextNode
  /** The same content as sanitized HTML (`richTextToHtml`). */
  html: string
  /** The people mentioned, each once, in the order of the text. */
  mentions: RichTextMention[]
  /** The keys of the merge fields used, each once, in the order of the text. */
  mergeFields: string[]
  /** Characters, as `maxLength` counts them (`richTextLength`). */
  length: number
}

/** An empty document: one empty paragraph. */
export const EMPTY_RICH_TEXT: RichTextNode = { type: 'doc', content: [{ type: 'paragraph' }] }

/** A merge field's key: letters, digits, ".", "_" and "-", at most 64 characters. */
export const MERGE_FIELD_KEY = /^[A-Za-z0-9_.-]{1,64}$/

/** The heading levels the editor offers: a heading and a subheading under the page's h1. */
export const HEADING_LEVELS = [2, 3] as const
export type HeadingLevel = (typeof HEADING_LEVELS)[number]

/** The heading level kept for any level read (h1 → 2, h4–h6 → 3). */
export function headingLevel(level: unknown): HeadingLevel {
  return typeof level === 'number' && level >= 3 ? 3 : 2
}

// ── Links ──────────────────────────────────────────────────────────────────────────────────────

/**
 * The address a link may keep: http, https or mailto, nothing else (no javascript:, data:,
 * relative or protocol-relative addresses), without spaces or control characters. Null otherwise.
 */
export function safeHref(href: unknown): string | null {
  if (typeof href !== 'string') return null
  const trimmed = href.trim()
  // Spaces and control characters inside an address are refused, not cleaned.
  if (/[\s\p{Cc}]/u.test(trimmed)) return null
  if (/^https?:\/\/[^/?#]+/iu.test(trimmed)) return trimmed
  if (/^mailto:[^@]+@[^@]+$/iu.test(trimmed)) return trimmed
  return null
}

/**
 * The address typed into the link dialog, completed: "liro.rs/pomoc" → "https://liro.rs/pomoc",
 * "ana@firma.rs" → "mailto:ana@firma.rs"; an address with its own scheme is kept when allowed.
 * Null when it cannot be a link.
 */
export function linkFromInput(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  if (/^[a-z][a-z0-9+.-]*:/iu.test(trimmed)) return safeHref(trimmed)
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/u.test(trimmed)) return safeHref(`mailto:${trimmed}`)
  if (/^[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/u.test(trimmed)) return safeHref(`https://${trimmed}`)
  return null
}

// ── Writing HTML ───────────────────────────────────────────────────────────────────────────────

function escapeText(text: string): string {
  return text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;')
}

function escapeAttribute(text: string): string {
  return escapeText(text).replace(/"/gu, '&quot;')
}

function stringAttr(node: { attrs?: Record<string, unknown> }, name: string): string | null {
  const value = node.attrs?.[name]
  return typeof value === 'string' ? value : null
}

/** The marks of an inline node, outermost first: link, bold, italic, underline. */
function wrapMarks(html: string, marks: readonly RichTextMark[] | undefined): string {
  const has = (type: string) => marks?.some((mark) => mark.type === type) === true
  let out = html
  if (has('underline')) out = `<u>${out}</u>`
  if (has('italic')) out = `<em>${out}</em>`
  if (has('bold')) out = `<strong>${out}</strong>`
  const link = marks?.find((mark) => mark.type === 'link')
  const href = link === undefined ? null : safeHref(stringAttr(link, 'href'))
  if (href !== null) out = `<a href="${escapeAttribute(href)}" rel="noopener noreferrer">${out}</a>`
  return out
}

function inlineHtml(node: RichTextNode): string {
  switch (node.type) {
    case 'text':
      return typeof node.text === 'string' && node.text !== ''
        ? wrapMarks(escapeText(node.text), node.marks)
        : ''
    case 'hardBreak':
      return '<br>'
    case 'mergeField': {
      const key = stringAttr(node, 'key')
      if (key === null || !MERGE_FIELD_KEY.test(key)) return ''
      return wrapMarks(`<span data-merge-field="${key}">{{${key}}}</span>`, node.marks)
    }
    case 'mention': {
      const id = stringAttr(node, 'id')
      if (id === null || id === '') return ''
      const label = stringAttr(node, 'label') ?? id
      return wrapMarks(
        `<span data-mention="${escapeAttribute(id)}">@${escapeText(label)}</span>`,
        node.marks,
      )
    }
    default:
      return (node.content ?? []).map(inlineHtml).join('')
  }
}

function blockHtml(node: RichTextNode): string {
  const inner = () => (node.content ?? []).map(inlineHtml).join('')
  const blocks = () => (node.content ?? []).map(blockHtml).join('')
  switch (node.type) {
    case 'doc':
      return blocks()
    case 'paragraph':
      return `<p dir="auto">${inner()}</p>`
    case 'heading': {
      const tag = `h${String(headingLevel(node.attrs?.level))}`
      return `<${tag} dir="auto">${inner()}</${tag}>`
    }
    case 'bulletList':
      return `<ul>${blocks()}</ul>`
    case 'orderedList': {
      const start = node.attrs?.start
      const attribute =
        typeof start === 'number' && Number.isInteger(start) && start > 1
          ? ` start="${String(start)}"`
          : ''
      return `<ol${attribute}>${blocks()}</ol>`
    }
    case 'listItem':
      return `<li>${blocks()}</li>`
    default:
      // An inline node where a block belongs, or a node of another editor: its text in a paragraph.
      return node.content === undefined && node.text === undefined
        ? ''
        : `<p dir="auto">${inlineHtml(node)}</p>`
  }
}

/**
 * The HTML of a value. Only the allowed nodes and marks are written (an unknown node gives its
 * text), every text and attribute is escaped, and a link keeps only an http(s) or mailto address.
 */
export function richTextToHtml(doc: RichTextNode): string {
  return blockHtml(doc.type === 'doc' ? doc : { type: 'doc', content: [doc] })
}

// ── Reading HTML ───────────────────────────────────────────────────────────────────────────────

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'start'; name: string; attrs: Record<string, string> }
  | { kind: 'end'; name: string }

/** Elements whose content is not markup: skipped whole, with their content. */
const RAW_TEXT = new Set([
  'script',
  'style',
  'xmp',
  'iframe',
  'noembed',
  'noframes',
  'noscript',
  'textarea',
  'title',
])

/** Elements dropped with everything inside them. */
const DROPPED = new Set([
  'head',
  'template',
  'svg',
  'math',
  'object',
  'applet',
  'select',
  'canvas',
  'audio',
  'video',
  'frameset',
])

/** Elements without content (<img>, <hr> …): dropped, except <br>. */
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

/** Elements that end a line of text where they start and end: read as paragraphs. */
const BLOCKS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
  'center',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'header',
  'hgroup',
  'html',
  'main',
  'nav',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'caption',
])

/** The characters HTML entities most often stand for; numeric references are read as well. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  shy: '­',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  laquo: '«',
  raquo: '»',
  euro: '€',
  bull: '•',
  middot: '·',
  times: '×',
  divide: '÷',
  deg: '°',
  sect: '§',
  para: '¶',
  zwj: '‍',
  zwnj: '‌',
  lrm: '‎',
  rlm: '‏',
}

/** Text with its character references read. In attributes a named one needs its ";". */
function decodeEntities(text: string, inAttribute: boolean): string {
  return text.replace(
    /&(#[0-9]{1,8}|#[xX][0-9a-fA-F]{1,7}|[A-Za-z][A-Za-z0-9]{0,31})(;?)/gu,
    (match, body: string, semicolon: string) => {
      if (body.startsWith('#')) {
        const code =
          body[1] === 'x' || body[1] === 'X'
            ? Number.parseInt(body.slice(2), 16)
            : Number.parseInt(body.slice(1), 10)
        const valid =
          code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) && code !== 0x0d
        return valid ? String.fromCodePoint(code) : '�'
      }
      const character = ENTITIES[body]
      if (character === undefined) return match
      if (semicolon === '' && inAttribute) return match
      return character
    },
  )
}

const WHITESPACE = /[\t\n\f\r ]/u

/** The tokens of an HTML fragment: texts, start tags with their attributes, end tags. */
function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  let text = ''
  const flush = () => {
    if (text !== '') tokens.push({ kind: 'text', text: decodeEntities(text, false) })
    text = ''
  }
  const skipPast = (from: number, needle: string) => {
    const end = html.indexOf(needle, from)
    return end === -1 ? html.length : end + needle.length
  }
  let index = 0
  while (index < html.length) {
    const lt = html.indexOf('<', index)
    if (lt === -1) {
      text += html.slice(index)
      break
    }
    text += html.slice(index, lt)
    index = lt
    const next = html.charAt(index + 1)
    if (html.startsWith('<!--', index)) {
      index = skipPast(index + 4, '-->')
      continue
    }
    // Word's list bullets and numbers drawn as text (`<![if !supportLists]>·<![endif]>`): dropped.
    if (html.startsWith('<![if', index)) {
      index = skipPast(index, '<![endif]>')
      continue
    }
    if (next === '!' || next === '?') {
      index = skipPast(index, '>')
      continue
    }
    if (next === '/') {
      const end = /^<\/([A-Za-z][^\t\n\f\r />]*)/u.exec(html.slice(index, index + 80))
      index = skipPast(index, '>')
      if (end?.[1] !== undefined) {
        flush()
        tokens.push({ kind: 'end', name: end[1].toLowerCase() })
      }
      continue
    }
    if (!/[A-Za-z]/u.test(next)) {
      text += '<'
      index += 1
      continue
    }
    // A start tag: its name, then its attributes up to ">".
    let cursor = index + 1
    while (
      cursor < html.length &&
      !WHITESPACE.test(html.charAt(cursor)) &&
      !'/>'.includes(html.charAt(cursor))
    ) {
      cursor += 1
    }
    const name = html.slice(index + 1, cursor).toLowerCase()
    const attrs: Record<string, string> = {}
    let closed = false
    while (cursor < html.length) {
      const character = html.charAt(cursor)
      if (WHITESPACE.test(character) || character === '/') {
        cursor += 1
        continue
      }
      if (character === '>') {
        closed = true
        cursor += 1
        break
      }
      const nameStart = cursor
      cursor += 1
      while (
        cursor < html.length &&
        !WHITESPACE.test(html.charAt(cursor)) &&
        !'/>='.includes(html.charAt(cursor))
      ) {
        cursor += 1
      }
      const attributeName = html.slice(nameStart, cursor).toLowerCase()
      while (cursor < html.length && WHITESPACE.test(html.charAt(cursor))) cursor += 1
      let value = ''
      if (html.charAt(cursor) === '=') {
        cursor += 1
        while (cursor < html.length && WHITESPACE.test(html.charAt(cursor))) cursor += 1
        const quote = html.charAt(cursor)
        if (quote === '"' || quote === "'") {
          const end = html.indexOf(quote, cursor + 1)
          value = html.slice(cursor + 1, end === -1 ? html.length : end)
          cursor = end === -1 ? html.length : end + 1
        } else {
          const valueStart = cursor
          while (
            cursor < html.length &&
            !WHITESPACE.test(html.charAt(cursor)) &&
            html.charAt(cursor) !== '>'
          ) {
            cursor += 1
          }
          value = html.slice(valueStart, cursor)
        }
      }
      if (!(attributeName in attrs)) attrs[attributeName] = decodeEntities(value, true)
    }
    index = cursor
    // A tag cut off by the end of the input is not a tag.
    if (!closed) break
    flush()
    if (name === 'plaintext') break
    if (RAW_TEXT.has(name)) {
      const close = new RegExp(`</${name}[\\t\\n\\f\\r />]`, 'iu').exec(html.slice(index))
      index = close === null ? html.length : skipPast(index + close.index, '>')
      continue
    }
    tokens.push({ kind: 'start', name, attrs })
  }
  flush()
  return tokens
}

/** An element kept while reading: a block, a list, an item, a mark, an atom or a line break. */
interface Element {
  tag: string
  attrs: Record<string, string>
  children: Child[]
}
type Child = Element | string

/** What an element becomes while reading; undefined: its tags are dropped, its content kept. */
function keptTag(name: string, attrs: Record<string, string>): string | undefined {
  switch (name) {
    case 'p':
    case 'ul':
    case 'ol':
    case 'li':
    case 'u':
      return name
    case 'h1':
    case 'h2':
      return 'h2'
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return 'h3'
    case 'strong':
    case 'b':
      return 'strong'
    case 'em':
    case 'i':
      return 'em'
    case 'a':
      return 'a'
    case 'span':
      if (attrs['data-merge-field'] !== undefined) return 'merge'
      if (attrs['data-mention'] !== undefined) return 'mention'
      return undefined
    default:
      return BLOCKS.has(name) ? 'block' : undefined
  }
}

/** The tree of an HTML fragment, with only the kept elements. */
function readTree(html: string): Element {
  const root: Element = { tag: 'root', attrs: {}, children: [] }
  // Open elements by their source name (an unwrapped element is open, without a node of its own).
  const open: { name: string; element: Element | null }[] = []
  const parent = () => {
    for (let index = open.length - 1; index >= 0; index -= 1) {
      const element = open[index]?.element
      if (element !== null && element !== undefined) return element
    }
    return root
  }
  let dropping: { name: string; depth: number } | null = null
  for (const token of tokenize(html)) {
    if (dropping !== null) {
      if (token.kind === 'start' && token.name === dropping.name) dropping.depth += 1
      if (token.kind === 'end' && token.name === dropping.name) {
        dropping.depth -= 1
        if (dropping.depth === 0) dropping = null
      }
      continue
    }
    if (token.kind === 'text') {
      parent().children.push(token.text)
      continue
    }
    if (token.kind === 'start') {
      if (DROPPED.has(token.name)) {
        dropping = { name: token.name, depth: 1 }
        continue
      }
      if (token.name === 'br') {
        parent().children.push({ tag: 'br', attrs: {}, children: [] })
        continue
      }
      if (VOID.has(token.name)) continue
      // A paragraph or heading never holds another: a new one closes the open one, as in HTML.
      if (/^(p|h[1-6])$/u.test(token.name)) {
        const at = open.findLastIndex((entry) => /^(p|h[1-6])$/u.test(entry.name))
        if (at >= 0 && open.slice(at + 1).every((entry) => entry.element?.tag !== 'li')) {
          open.length = at
        }
      }
      // An item closes the open item of the same list.
      if (token.name === 'li') {
        const at = open.findLastIndex(
          (entry) => entry.name === 'li' || entry.name === 'ul' || entry.name === 'ol',
        )
        if (at >= 0 && open[at]?.name === 'li') open.length = at
      }
      const tag = keptTag(token.name, token.attrs)
      const element = tag === undefined ? null : { tag, attrs: token.attrs, children: [] }
      if (element !== null) parent().children.push(element)
      open.push({ name: token.name, element })
      continue
    }
    const at = open.findLastIndex((entry) => entry.name === token.name)
    if (at >= 0) open.length = at
  }
  return root
}

interface Reading {
  blocks: RichTextNode[]
  run: RichTextNode[]
}

function sameMarks(a: readonly RichTextMark[] = [], b: readonly RichTextMark[] = []): boolean {
  return (
    a.length === b.length &&
    a.every(
      (mark, index) =>
        mark.type === b[index]?.type &&
        stringAttr(mark, 'href') === stringAttr(b[index] ?? mark, 'href'),
    )
  )
}

function withMark(marks: readonly RichTextMark[], mark: RichTextMark): RichTextMark[] {
  return marks.some((each) => each.type === mark.type) ? [...marks] : [...marks, mark]
}

function inlineNode(node: RichTextNode, marks: readonly RichTextMark[]): RichTextNode {
  return marks.length === 0 ? node : { ...node, marks: [...marks] }
}

/** The inline content of a line: whitespace collapsed and trimmed, neighbouring texts joined. */
function tidyRun(run: readonly RichTextNode[]): RichTextNode[] {
  const out: RichTextNode[] = []
  for (const node of run) {
    if (node.type !== 'text') {
      out.push(node)
      continue
    }
    let text = (node.text ?? '').replace(/[\t\n\f\r ]+/gu, ' ')
    const previous = out[out.length - 1]
    const afterSpace =
      previous === undefined ||
      previous.type === 'hardBreak' ||
      (previous.type === 'text' && (previous.text ?? '').endsWith(' '))
    if (afterSpace) text = text.replace(/^ /u, '')
    if (text === '') continue
    if (previous?.type === 'text' && sameMarks(previous.marks, node.marks)) {
      previous.text = (previous.text ?? '') + text
    } else {
      out.push({ ...node, text })
    }
  }
  // Trailing spaces of the line, also before a line break.
  for (let index = out.length - 1; index >= 0; index -= 1) {
    const node = out[index]
    const next = out[index + 1]
    if (node?.type === 'text' && (next === undefined || next.type === 'hardBreak')) {
      node.text = (node.text ?? '').replace(/ $/u, '')
      if (node.text === '') out.splice(index, 1)
    }
  }
  while (out[out.length - 1]?.type === 'hardBreak') out.pop()
  return out
}

/** Ends the line being read: its content becomes a paragraph (or the given text block). */
function endLine(reading: Reading, block: RichTextNode = { type: 'paragraph' }, always = false) {
  const content = tidyRun(reading.run)
  reading.run = []
  if (content.length === 0 && !always) return
  reading.blocks.push(content.length === 0 ? block : { ...block, content })
}

function listItems(element: Element, marks: readonly RichTextMark[]): RichTextNode[] {
  const items: RichTextNode[] = []
  let loose: Reading | null = null
  const endLoose = () => {
    if (loose === null) return
    endLine(loose)
    if (loose.blocks.length > 0) items.push(listItem(loose.blocks))
    loose = null
  }
  for (const child of element.children) {
    if (typeof child !== 'string' && child.tag === 'li') {
      endLoose()
      const reading: Reading = { blocks: [], run: [] }
      readChildren(child.children, marks, reading)
      endLine(reading)
      items.push(listItem(reading.blocks))
    } else {
      loose ??= { blocks: [], run: [] }
      readChildren([child], marks, loose)
    }
  }
  endLoose()
  return items
}

/** A list item starts with a paragraph (Tiptap's `paragraph block*`). */
function listItem(blocks: RichTextNode[]): RichTextNode {
  const first = blocks[0]
  if (first === undefined) return { type: 'listItem', content: [{ type: 'paragraph' }] }
  if (first.type === 'heading') {
    const paragraph: RichTextNode =
      first.content === undefined
        ? { type: 'paragraph' }
        : { type: 'paragraph', content: first.content }
    return { type: 'listItem', content: [paragraph, ...blocks.slice(1)] }
  }
  if (first.type !== 'paragraph') {
    return { type: 'listItem', content: [{ type: 'paragraph' }, ...blocks] }
  }
  return { type: 'listItem', content: blocks }
}

function readChildren(
  children: readonly Child[],
  marks: readonly RichTextMark[],
  reading: Reading,
) {
  for (const child of children) {
    if (typeof child === 'string') {
      reading.run.push(inlineNode({ type: 'text', text: child }, marks))
      continue
    }
    switch (child.tag) {
      case 'br':
        reading.run.push({ type: 'hardBreak' })
        break
      case 'strong':
        readChildren(child.children, withMark(marks, { type: 'bold' }), reading)
        break
      case 'em':
        readChildren(child.children, withMark(marks, { type: 'italic' }), reading)
        break
      case 'u':
        readChildren(child.children, withMark(marks, { type: 'underline' }), reading)
        break
      case 'a': {
        const href = safeHref(child.attrs.href)
        readChildren(
          child.children,
          href === null ? marks : withMark(marks, { type: 'link', attrs: { href } }),
          reading,
        )
        break
      }
      case 'merge': {
        const key = (child.attrs['data-merge-field'] ?? '').trim()
        if (MERGE_FIELD_KEY.test(key)) {
          reading.run.push(inlineNode({ type: 'mergeField', attrs: { key } }, marks))
        }
        break
      }
      case 'mention': {
        const id = child.attrs['data-mention'] ?? ''
        const label = textOf(child).trim().replace(/^@/u, '')
        if (id !== '') {
          reading.run.push(
            inlineNode({ type: 'mention', attrs: { id, label: label === '' ? id : label } }, marks),
          )
        }
        break
      }
      case 'ul':
      case 'ol': {
        endLine(reading)
        const items = listItems(child, marks)
        if (items.length === 0) break
        const start = Number.parseInt(child.attrs.start ?? '', 10)
        reading.blocks.push(
          child.tag === 'ol'
            ? {
                type: 'orderedList',
                ...(Number.isInteger(start) && start > 1 ? { attrs: { start } } : {}),
                content: items,
              }
            : { type: 'bulletList', content: items },
        )
        break
      }
      case 'h2':
      case 'h3':
      case 'p': {
        endLine(reading)
        const inner: Reading = { blocks: [], run: [] }
        readChildren(child.children, marks, inner)
        const block: RichTextNode =
          child.tag === 'p'
            ? { type: 'paragraph' }
            : { type: 'heading', attrs: { level: child.tag === 'h2' ? 2 : 3 } }
        // A paragraph that only held blocks (a list inside <p>) leaves no empty line behind.
        endLine(inner, block, inner.blocks.length === 0)
        reading.blocks.push(...inner.blocks)
        break
      }
      default: {
        // A block of another kind (<div>, <td>, <blockquote> …) or a list item outside a list.
        endLine(reading)
        readChildren(child.children, marks, reading)
        endLine(reading)
      }
    }
  }
}

function textOf(element: Element): string {
  return element.children
    .map((child) => (typeof child === 'string' ? child : textOf(child)))
    .join('')
}

/**
 * The value of an HTML fragment: only what the editor knows is kept — paragraphs, two heading
 * levels, lists, bold, italic, underline, safe links, line breaks, merge fields and mentions.
 * Styles, classes, colours, fonts, comments, scripts and unknown elements are dropped (their text
 * kept, except of scripts, styles and the like).
 */
export function richTextFromHtml(html: string): RichTextNode {
  const reading: Reading = { blocks: [], run: [] }
  readChildren(readTree(html).children, [], reading)
  endLine(reading)
  return {
    type: 'doc',
    content: reading.blocks.length === 0 ? [{ type: 'paragraph' }] : reading.blocks,
  }
}

/**
 * Sanitized HTML: the fragment read into the editor's structure (`richTextFromHtml`) and written
 * again (`richTextToHtml`), so only the allowed tags and attributes remain, links only to http(s)
 * and mailto with `rel="noopener noreferrer"`. Pure: it needs no DOM.
 */
export function sanitizeRichHtml(html: string): string {
  return richTextToHtml(richTextFromHtml(html))
}

/** A value with only what the editor knows (unknown nodes give their text; unsafe links go). */
export function normalizeRichText(doc: RichTextNode): RichTextNode {
  return richTextFromHtml(richTextToHtml(doc))
}

// ── Reading the value ──────────────────────────────────────────────────────────────────────────

function visit(node: RichTextNode, each: (node: RichTextNode) => void) {
  each(node)
  for (const child of node.content ?? []) visit(child, each)
}

/**
 * The length `maxLength` limits: the characters of the text (as the reader counts them: an emoji
 * or an accented letter is one), and one for each merge field, mention and line break.
 */
export function richTextLength(doc: RichTextNode): number {
  let length = 0
  visit(doc, (node) => {
    if (node.type === 'text') length += Array.from(node.text ?? '').length
    else if (node.type === 'mergeField' || node.type === 'mention' || node.type === 'hardBreak') {
      length += 1
    }
  })
  return length
}

/** The people mentioned, each once, in the order of the text. */
export function richTextMentions(doc: RichTextNode): RichTextMention[] {
  const mentions: RichTextMention[] = []
  visit(doc, (node) => {
    const id = node.type === 'mention' ? stringAttr(node, 'id') : null
    if (id !== null && id !== '' && !mentions.some((mention) => mention.id === id)) {
      mentions.push({ id, name: stringAttr(node, 'label') ?? id })
    }
  })
  return mentions
}

/** The keys of the merge fields used, each once, in the order of the text. */
export function richTextMergeFields(doc: RichTextNode): string[] {
  const keys: string[] = []
  visit(doc, (node) => {
    const key = node.type === 'mergeField' ? stringAttr(node, 'key') : null
    if (key !== null && MERGE_FIELD_KEY.test(key) && !keys.includes(key)) keys.push(key)
  })
  return keys
}

/** True when there is nothing to read: no text but spaces, no merge field, no mention. */
export function isRichTextEmpty(doc: RichTextNode | null | undefined): boolean {
  if (doc === null || doc === undefined) return true
  let empty = true
  visit(doc, (node) => {
    if (node.type === 'text' && (node.text ?? '').trim() !== '') empty = false
    if (node.type === 'mergeField' || node.type === 'mention') empty = false
  })
  return empty
}

/** Everything `onChange` reports, from the JSON. */
export function richTextValue(json: RichTextNode): RichTextValue {
  return {
    json,
    html: sanitizeRichHtml(richTextToHtml(json)),
    mentions: richTextMentions(json),
    mergeFields: richTextMergeFields(json),
    length: richTextLength(json),
  }
}

// ── Keys ───────────────────────────────────────────────────────────────────────────────────────

/** What is being typed before the caret: "{{" asks for a merge field, "@" for a person. */
export interface RichTextSuggestion {
  kind: 'mergeField' | 'mention'
  /** Where the trigger ("{{" or "@") starts, in the text before the caret. */
  start: number
  /** The text typed after it. */
  query: string
}

/** The longest text read after a trigger. */
export const SUGGESTION_QUERY_MAX = 40

/**
 * The suggestion asked for by the text of the line before the caret (merge fields, mentions and
 * line breaks in it are "￼"). "{{" anywhere starts a merge field (up to "}" or a line end);
 * "@" at the line's start or after a space starts a mention, with at most two spaces in the name
 * (as MentionCombobox).
 */
export function suggestionAt(textBefore: string): RichTextSuggestion | null {
  const merge = textBefore.lastIndexOf('{{')
  if (merge >= 0) {
    const query = textBefore.slice(merge + 2)
    if (query.length <= SUGGESTION_QUERY_MAX && !/[{}\n￼]/u.test(query)) {
      return { kind: 'mergeField', start: merge, query }
    }
  }
  const at = textBefore.lastIndexOf('@')
  if (at < 0) return null
  const previous = at === 0 ? '' : textBefore.charAt(at - 1)
  if (previous !== '' && !/\s/u.test(previous)) return null
  const query = textBefore.slice(at + 1)
  if (query.length > SUGGESTION_QUERY_MAX || /[\n@￼]/u.test(query)) return null
  if (query.startsWith(' ') || (query.match(/ /gu) ?? []).length > 2) return null
  return { kind: 'mention', start: at, query }
}

/**
 * The toolbar control that takes the focus after a key (WAI-ARIA toolbar: one control in the tab
 * order, the arrows move between them and wrap, Home and End go to the ends). The arrows follow
 * the screen: in right-to-left ArrowLeft goes to the next control. Null: not a toolbar key.
 */
export function toolbarKeyTarget(
  key: string,
  index: number,
  count: number,
  direction: 'ltr' | 'rtl',
): number | null {
  if (count <= 0) return null
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  switch (key) {
    case forward:
      return (index + 1) % count
    case backward:
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

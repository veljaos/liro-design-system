import type {
  LegalArticle,
  LegalFootnote,
  LegalHeading,
  LegalInline,
  LegalNode,
  LegalParagraph,
  LegalPoint,
} from './legal-model'
import type { TreeNode } from './tree-logic'

/*
 * The logic of LegalText, LegalContents and LegalCompare (BUILD-PLAN P5.27), kept apart from the
 * markup so it can be unit-tested (AGENTS.md C7). Nothing here decides anything legal: it reads
 * the application's act as text.
 * - The act as a sequence of headings and articles, for the window of a long act.
 * - The plain text of every part, and the in-act search over the data (not over the page), so it
 *   finds articles that are not drawn.
 * - Serbian Cyrillic to Latin, one letter to one (Latin to Cyrillic is the application's).
 * - A word diff between two texts and the articles that changed between two versions.
 * - The table of contents as a tree.
 */

// ── The act as a sequence ──

/** A heading or an article of the act, in reading order, with the headings above it. */
export type LegalEntry =
  | { kind: 'heading'; node: LegalHeading; depth: number; parentId: string | null }
  | { kind: 'article'; node: LegalArticle; depth: number; parentId: string | null }

/**
 * Every heading and article in reading order, each with its depth (the number of headings above
 * it) and its parent heading: the rows of the window of a long act.
 */
export function flattenLegalNodes(nodes: readonly LegalNode[]): LegalEntry[] {
  const entries: LegalEntry[] = []
  const walk = (list: readonly LegalNode[], depth: number, parentId: string | null) => {
    for (const node of list) {
      if (node.kind === 'heading') {
        entries.push({ kind: 'heading', node, depth, parentId })
        walk(node.children, depth + 1, node.id)
      } else {
        entries.push({ kind: 'article', node, depth, parentId })
      }
    }
  }
  walk(nodes, 0, null)
  return entries
}

/** Every article of the act, in reading order. */
export function legalArticles(nodes: readonly LegalNode[]): LegalArticle[] {
  return flattenLegalNodes(nodes).flatMap((entry) => (entry.kind === 'article' ? [entry.node] : []))
}

/** The article with this id, anywhere in the act. */
export function findLegalArticle(
  nodes: readonly LegalNode[],
  id: string,
): LegalArticle | undefined {
  return legalArticles(nodes).find((article) => article.id === id)
}

/** The ids of the headings above a node, outermost first (empty for a top-level node). */
export function legalAncestors(nodes: readonly LegalNode[], id: string): string[] {
  const path: string[] = []
  const walk = (list: readonly LegalNode[]): boolean => {
    for (const node of list) {
      if (node.id === id) return true
      if (node.kind === 'heading') {
        path.push(node.id)
        if (walk(node.children)) return true
        path.pop()
      }
    }
    return false
  }
  return walk(nodes) ? path : []
}

// ── Plain text ──

/** The text of one inline run as drawn; a footnote mark is not part of the text. */
export function inlineRunText(inline: LegalInline): string {
  if (typeof inline === 'string') return inline
  if (inline.kind === 'footnote') return ''
  return inline.text
}

/** The plain text of a paragraph's or an item's own content (without its label or items). */
export function inlineText(content: readonly LegalInline[]): string {
  return content.map(inlineRunText).join('')
}

/** A paragraph or an item with its label and its items, one line each, indented by level. */
function pointLines(point: LegalParagraph | LegalPoint, depth: number): string[] {
  const own = [point.label, inlineText(point.content)].filter((part) => part !== undefined)
  return [
    `${'  '.repeat(depth)}${own.join(' ')}`,
    ...(point.points ?? []).flatMap((child) => pointLines(child, depth + 1)),
  ]
}

/** The plain text of a paragraph: its label, its text, and its items under it. */
export function paragraphText(paragraph: LegalParagraph): string {
  return pointLines(paragraph, 0).join('\n')
}

/**
 * The plain text of an article, as copied or compared: label, title, the deletion's words and
 * the paragraphs, one per line.
 */
export function articleText(article: LegalArticle): string {
  return [
    article.label,
    ...(article.title === undefined ? [] : [article.title]),
    ...(article.deleted === undefined ? [] : [article.deleted]),
    ...article.paragraphs.map(paragraphText),
  ].join('\n')
}

// ── Search ──

/** Search starts at this many characters (one letter would mark half the act). */
export const LEGAL_SEARCH_MIN_LENGTH = 2

/** The part ids of an article's or a heading's label, title and deletion words. */
export const labelPart = (nodeId: string) => `${nodeId}#label`
export const titlePart = (nodeId: string) => `${nodeId}#title`
export const deletedPart = (nodeId: string) => `${nodeId}#deleted`

/**
 * A searchable part of the act: a heading's or an article's label or title, a deletion's words,
 * a paragraph's or an item's text. `partId` is the paragraph's or item's own id, or
 * `labelPart(id)`, `titlePart(id)`, `deletedPart(id)`.
 */
export interface LegalTextPart {
  nodeId: string
  partId: string
  text: string
}

/** Every searchable part, in reading order. Footnotes are not searched. */
export function legalTextParts(nodes: readonly LegalNode[]): LegalTextPart[] {
  const parts: LegalTextPart[] = []
  const points = (nodeId: string, list: readonly LegalPoint[] | undefined) => {
    for (const point of list ?? []) {
      parts.push({ nodeId, partId: point.id, text: inlineText(point.content) })
      points(nodeId, point.points)
    }
  }
  for (const entry of flattenLegalNodes(nodes)) {
    const node = entry.node
    parts.push({ nodeId: node.id, partId: labelPart(node.id), text: node.label })
    if (node.title !== undefined) {
      parts.push({ nodeId: node.id, partId: titlePart(node.id), text: node.title })
    }
    if (entry.kind === 'article') {
      const article = entry.node
      if (article.deleted !== undefined) {
        parts.push({ nodeId: node.id, partId: deletedPart(node.id), text: article.deleted })
      }
      for (const paragraph of article.paragraphs) {
        parts.push({ nodeId: node.id, partId: paragraph.id, text: inlineText(paragraph.content) })
        points(node.id, paragraph.points)
      }
    }
  }
  return parts
}

/**
 * A text folded for search, with the index in the original text of every folded character:
 * lower case; Serbian Cyrillic as Latin (so "zakon" finds "закон"); the accents of Latin letters
 * removed (so "clan" finds "član"); đ as d. Other scripts keep their marks: Japanese voiced kana
 * and Arabic vowel signs are letters of their own.
 */
export function foldForSearch(text: string): { folded: string; map: number[] } {
  let folded = ''
  const map: number[] = []
  let index = 0
  for (const char of text) {
    let out = char.toLowerCase()
    out = CYRILLIC_TO_LATIN[out] ?? out
    if (out === 'đ') out = 'd'
    const decomposed = out.normalize('NFD')
    if (/^\p{Script=Latin}/u.test(decomposed)) out = decomposed.replace(/\p{M}/gu, '')
    for (const piece of out) {
      folded += piece
      // A character outside the basic plane is two UTF-16 units, both from the same source.
      map.push(index)
      if (piece.length === 2) map.push(index)
    }
    index += char.length
  }
  return { folded, map }
}

/** A match of the in-act search: the node and part it is in, and its place in the part's text. */
export interface LegalSearchHit {
  nodeId: string
  partId: string
  /** The first character, in the part's text as drawn. */
  start: number
  /** After the last character. */
  end: number
}

/** The parts of an act prepared once for searching (`searchLegalIndex`). */
export interface LegalSearchIndex {
  parts: readonly (LegalTextPart & { folded: string; map: number[] })[]
}

/** Folds every part of the act once; searching then only scans. */
export function legalSearchIndex(nodes: readonly LegalNode[]): LegalSearchIndex {
  return {
    parts: legalTextParts(nodes).map((part) => ({ ...part, ...foldForSearch(part.text) })),
  }
}

/**
 * Every match of `query` in the act, in reading order, case-, accent- and script-insensitive
 * (`foldForSearch`); none for a query shorter than LEGAL_SEARCH_MIN_LENGTH. Matches do not
 * overlap. It runs on the data, so it finds articles that are not drawn.
 */
export function searchLegalIndex(index: LegalSearchIndex, query: string): LegalSearchHit[] {
  const wanted = foldForSearch(query.trim()).folded
  if (Array.from(wanted).length < LEGAL_SEARCH_MIN_LENGTH) return []
  const hits: LegalSearchHit[] = []
  for (const part of index.parts) {
    let from = part.folded.indexOf(wanted)
    while (from >= 0) {
      const last = from + wanted.length - 1
      const start = part.map[from] ?? 0
      const lastSource = part.map[last] ?? start
      // The end is after the whole source character the last folded character came from.
      const end = lastSource + ((part.text.codePointAt(lastSource) ?? 0) > 0xffff ? 2 : 1)
      hits.push({ nodeId: part.nodeId, partId: part.partId, start, end })
      from = part.folded.indexOf(wanted, from + wanted.length)
    }
  }
  return hits
}

/** `searchLegalIndex` over nodes, for one search. */
export function searchLegalText(nodes: readonly LegalNode[], query: string): LegalSearchHit[] {
  return searchLegalIndex(legalSearchIndex(nodes), query)
}

/** The hit after (`step` 1) or before (-1) `current`, going round; -1 when there are none. */
export function stepHit(current: number, total: number, step: 1 | -1): number {
  if (total <= 0) return -1
  if (current < 0 || current >= total) return step === 1 ? 0 : total - 1
  return (current + step + total) % total
}

/** A run of a text, marked as the hit with that index, or not a hit. */
export interface MarkedRun {
  text: string
  /** The index of the hit in the whole search, or null. */
  hit: number | null
}

/**
 * Splits `text`, which starts at `offset` of its part, by the hits of that part (ranges of the
 * part's text with their index in the search): the runs to draw, plain or marked.
 */
export function markRuns(
  text: string,
  offset: number,
  ranges: readonly { start: number; end: number; index: number }[],
): MarkedRun[] {
  const runs: MarkedRun[] = []
  let at = 0
  for (const range of ranges) {
    const start = Math.max(range.start - offset, at)
    const end = Math.min(range.end - offset, text.length)
    if (end <= start) continue
    if (start > at) runs.push({ text: text.slice(at, start), hit: null })
    runs.push({ text: text.slice(start, end), hit: range.index })
    at = end
  }
  if (at < text.length || runs.length === 0) runs.push({ text: text.slice(at), hit: null })
  return runs
}

// ── Serbian Cyrillic to Latin ──

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  ђ: 'đ',
  е: 'e',
  ж: 'ž',
  з: 'z',
  и: 'i',
  ј: 'j',
  к: 'k',
  л: 'l',
  љ: 'lj',
  м: 'm',
  н: 'n',
  њ: 'nj',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  ћ: 'ć',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'č',
  џ: 'dž',
  ш: 'š',
}

/** Upper case without the locale: the Cyrillic letters' own capitals. */
const isUpper = (char: string | undefined) =>
  char !== undefined && char !== char.toLowerCase() && char === char.toUpperCase()
const isLetter = (char: string | undefined) => char !== undefined && /\p{L}/u.test(char)

/**
 * Serbian Cyrillic to Latin, one letter to one (Љ Lj, Њ Nj, Џ Dž, Ђ Đ, Ћ Ć, Ж Ž, Ч Č, Ш Š).
 * A capital digraph is written as a title ("Љубав" → "Ljubav") unless it stands in a word of
 * capitals ("ЉУБАВ" → "LJUBAV", "ПЉ" → "PLJ"). Every other character stays as it is.
 */
export function transliterateCyrillicToLatin(text: string): string {
  const chars = Array.from(text)
  return chars
    .map((char, index) => {
      const lower = char.toLowerCase()
      const latin = CYRILLIC_TO_LATIN[lower]
      if (latin === undefined) return char
      if (lower === char) return latin
      if (latin.length === 1) return latin.toUpperCase()
      const next = chars[index + 1]
      const previous = chars[index - 1]
      const capitals = isUpper(next) || (isUpper(previous) && !isLetter(next))
      return capitals
        ? latin.toUpperCase()
        : latin.charAt(0).toUpperCase() + latin.slice(1).toLowerCase()
    })
    .join('')
}

/** The script of a Serbian language tag, or null for another language. */
export function serbianScript(lang: string | undefined): 'latin' | 'cyrillic' | null {
  if (lang === undefined) return null
  const parts = lang.toLowerCase().split('-')
  if (parts[0] !== 'sr') return null
  if (parts.includes('cyrl')) return 'cyrillic'
  // Serbian without a script is Latin (AGENTS.md D12 never writes it; intlLocale reads it so).
  return 'latin'
}

/** The language tag of a Serbian Cyrillic text shown in Latin. */
export function latinTag(lang: string): string {
  return lang.replace(/-cyrl\b/i, '-Latn')
}

function mapInlines(content: readonly LegalInline[], map: (text: string) => string): LegalInline[] {
  return content.map((inline) => {
    if (typeof inline === 'string') return map(inline)
    if (inline.kind === 'footnote') return inline
    return { ...inline, text: map(inline.text) }
  })
}

function mapPoint<P extends LegalParagraph | LegalPoint>(
  point: P,
  map: (text: string) => string,
): P {
  return {
    ...point,
    ...(point.label === undefined ? {} : { label: map(point.label) }),
    content: mapInlines(point.content, map),
    ...(point.points === undefined
      ? {}
      : { points: point.points.map((child) => mapPoint(child, map)) }),
  }
}

/** Every text of an article through `map` (ids, addresses and dates as they are). */
export function mapArticleText(article: LegalArticle, map: (text: string) => string): LegalArticle {
  return {
    ...article,
    label: map(article.label),
    ...(article.title === undefined ? {} : { title: map(article.title) }),
    ...(article.deleted === undefined ? {} : { deleted: map(article.deleted) }),
    ...(article.changes === undefined
      ? {}
      : { changes: article.changes.map((change) => ({ ...change, label: map(change.label) })) }),
    paragraphs: article.paragraphs.map((paragraph) => mapPoint(paragraph, map)),
  }
}

/** Every text of the act through `map`. */
export function mapLegalText(
  nodes: readonly LegalNode[],
  map: (text: string) => string,
): LegalNode[] {
  return nodes.map((node) =>
    node.kind === 'article'
      ? mapArticleText(node, map)
      : {
          ...node,
          label: map(node.label),
          ...(node.title === undefined ? {} : { title: map(node.title) }),
          children: mapLegalText(node.children, map),
        },
  )
}

/** Every text of the footnotes through `map`. */
export function mapFootnotesText(
  footnotes: readonly LegalFootnote[],
  map: (text: string) => string,
): LegalFootnote[] {
  return footnotes.map((footnote) => ({ ...footnote, content: mapInlines(footnote.content, map) }))
}

/**
 * Whether the act is shown transliterated: a Serbian Cyrillic text (`lang` sr-Cyrl…) asked for in
 * Latin. A Latin text asked for in Cyrillic is the application's to give.
 */
export function transliterates(lang: string | undefined, script: 'latin' | 'cyrillic'): boolean {
  return serbianScript(lang) === 'cyrillic' && script === 'latin'
}

// ── Word diff ──

/** A run of a compared text: the same in both, only in the newer (added), only in the older. */
export interface DiffSegment {
  kind: 'same' | 'added' | 'removed'
  text: string
}

/** Words and the spaces between them; punctuation stays with its word. */
function words(text: string): string[] {
  return text.match(/\s+|\S+/gu) ?? []
}

/** Above this many word pairs the diff marks the changed middle as removed and added whole. */
export const DIFF_LIMIT = 1_000_000

/** Joins neighbouring runs of one kind. */
function joined(segments: readonly DiffSegment[]): DiffSegment[] {
  const out: DiffSegment[] = []
  for (const segment of segments) {
    if (segment.text === '') continue
    const last = out.at(-1)
    if (last?.kind === segment.kind) last.text += segment.text
    else out.push({ ...segment })
  }
  return out
}

/**
 * A change of several words in a row reads as one: spaces left "same" between removed and added
 * words join the change, so "the old three words" → "the new three words" shows one deletion and
 * one insertion instead of a deletion and an insertion per word.
 */
function wholeChanges(segments: readonly DiffSegment[]): DiffSegment[] {
  const out: DiffSegment[] = []
  let removed = ''
  let added = ''
  const flush = () => {
    if (removed !== '') out.push({ kind: 'removed', text: removed })
    if (added !== '') out.push({ kind: 'added', text: added })
    removed = ''
    added = ''
  }
  segments.forEach((segment, index) => {
    if (segment.kind === 'removed') removed += segment.text
    else if (segment.kind === 'added') added += segment.text
    else {
      const inChange = removed !== '' || added !== ''
      const nextChanges = segments[index + 1] !== undefined
      if (inChange && nextChanges && /^\s+$/u.test(segment.text)) {
        removed += segment.text
        added += segment.text
      } else {
        flush()
        out.push(segment)
      }
    }
  })
  flush()
  return wordsFirst(joined(out))
}

/**
 * An insertion or deletion alone between two unchanged runs that starts with a space also ends
 * where one could stand: " complete" between "of a" and " request." is moved to "complete "
 * between "of a " and "request.", so the mark starts at the word.
 */
function wordsFirst(segments: DiffSegment[]): DiffSegment[] {
  return segments.map((segment, index, all) => {
    const previous = all[index - 1]
    const next = all[index + 1]
    if (segment.kind === 'same' || previous?.kind !== 'same' || next?.kind !== 'same') {
      return segment
    }
    const space = /^\s+/u.exec(segment.text)?.[0]
    if (space === undefined || !next.text.startsWith(space) || space === segment.text) {
      return segment
    }
    previous.text += space
    next.text = next.text.slice(space.length)
    return { kind: segment.kind, text: segment.text.slice(space.length) + space }
  })
}

/**
 * The word diff of two texts (longest common subsequence of words; whitespace kept): runs that
 * are the same, removed (only in `before`) and added (only in `after`), a removal before the
 * addition that replaces it. Joining the `same` and `removed` runs gives `before`; the `same` and
 * `added` runs give `after`.
 */
export function wordDiff(before: string, after: string): DiffSegment[] {
  const a = words(before)
  const b = words(after)
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1
  let tail = 0
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail += 1
  }
  const midA = a.slice(head, a.length - tail)
  const midB = b.slice(head, b.length - tail)
  const middle: DiffSegment[] = []
  if (midA.length * midB.length > DIFF_LIMIT) {
    middle.push({ kind: 'removed', text: midA.join('') }, { kind: 'added', text: midB.join('') })
  } else {
    // lengths[i][j]: the longest common run of midA from i and midB from j.
    const width = midB.length + 1
    const lengths = new Uint32Array((midA.length + 1) * width)
    for (let i = midA.length - 1; i >= 0; i -= 1) {
      for (let j = midB.length - 1; j >= 0; j -= 1) {
        lengths[i * width + j] =
          midA[i] === midB[j]
            ? (lengths[(i + 1) * width + j + 1] ?? 0) + 1
            : Math.max(lengths[(i + 1) * width + j] ?? 0, lengths[i * width + j + 1] ?? 0)
      }
    }
    let i = 0
    let j = 0
    while (i < midA.length && j < midB.length) {
      if (midA[i] === midB[j]) {
        middle.push({ kind: 'same', text: midA[i] ?? '' })
        i += 1
        j += 1
      } else if ((lengths[(i + 1) * width + j] ?? 0) >= (lengths[i * width + j + 1] ?? 0)) {
        middle.push({ kind: 'removed', text: midA[i] ?? '' })
        i += 1
      } else {
        middle.push({ kind: 'added', text: midB[j] ?? '' })
        j += 1
      }
    }
    for (; i < midA.length; i += 1) middle.push({ kind: 'removed', text: midA[i] ?? '' })
    for (; j < midB.length; j += 1) middle.push({ kind: 'added', text: midB[j] ?? '' })
  }
  return wholeChanges(
    joined([
      { kind: 'same', text: a.slice(0, head).join('') },
      ...joined(middle),
      { kind: 'same', text: a.slice(a.length - tail).join('') },
    ]),
  )
}

// ── Comparing two versions ──

/**
 * Two lists of things with ids, joined in reading order: the newer list's order, with each thing
 * only in the older list placed after the one it followed there (or first).
 */
export function mergeById<T extends { id: string }>(
  before: readonly T[],
  after: readonly T[],
): { id: string; before?: T; after?: T }[] {
  const afterIds = new Set(after.map((each) => each.id))
  const beforeById = new Map(before.map((each) => [each.id, each]))
  // Each thing only in `before`, under the nearest earlier thing that is also in `after`.
  const orphans = new Map<string | null, T[]>()
  let anchor: string | null = null
  for (const each of before) {
    if (afterIds.has(each.id)) {
      anchor = each.id
    } else {
      const list = orphans.get(anchor) ?? []
      list.push(each)
      orphans.set(anchor, list)
    }
  }
  const out: { id: string; before?: T; after?: T }[] = (orphans.get(null) ?? []).map((each) => ({
    id: each.id,
    before: each,
  }))
  for (const each of after) {
    const old = beforeById.get(each.id)
    out.push(
      old === undefined ? { id: each.id, after: each } : { id: each.id, before: old, after: each },
    )
    for (const orphan of orphans.get(each.id) ?? []) out.push({ id: orphan.id, before: orphan })
  }
  return out
}

/** What happened to an article between two versions. */
export type ArticleChangeKind = 'added' | 'removed' | 'changed' | 'same'

export interface ArticleComparison {
  id: string
  kind: ArticleChangeKind
  /** The article in the older version (none when added). */
  before?: LegalArticle
  /** The article in the newer version (none when removed). */
  after?: LegalArticle
}

/**
 * The articles of two versions by id, in reading order (`mergeById`): added, removed, changed
 * (their text differs: `articleText`) or the same.
 */
export function compareArticles(
  before: readonly LegalNode[],
  after: readonly LegalNode[],
): ArticleComparison[] {
  return mergeById(legalArticles(before), legalArticles(after)).map((pair) => {
    if (pair.before === undefined) {
      return {
        id: pair.id,
        kind: 'added',
        ...(pair.after === undefined ? {} : { after: pair.after }),
      }
    }
    if (pair.after === undefined) return { id: pair.id, kind: 'removed', before: pair.before }
    const kind = articleText(pair.before) === articleText(pair.after) ? 'same' : 'changed'
    return { id: pair.id, kind, before: pair.before, after: pair.after }
  })
}

/** A block of an article as compared: a paragraph's or an item's label and text, by its depth. */
export interface ArticleBlock {
  id: string
  label?: string
  text: string
  /** 0 for a paragraph, 1 for its items, 2 for sub-items. */
  depth: number
}

/** An article's paragraphs and items as one list of blocks, in reading order. */
export function articleBlocks(article: LegalArticle): ArticleBlock[] {
  const blocks: ArticleBlock[] = []
  const add = (point: LegalParagraph | LegalPoint, depth: number) => {
    blocks.push({
      id: point.id,
      ...(point.label === undefined ? {} : { label: point.label }),
      text: inlineText(point.content),
      depth,
    })
    for (const child of point.points ?? []) add(child, depth + 1)
  }
  for (const paragraph of article.paragraphs) add(paragraph, 0)
  return blocks
}

/** A compared block: its diff, or wholly added or removed. */
export interface BlockComparison {
  id: string
  kind: ArticleChangeKind
  label?: string
  depth: number
  segments: DiffSegment[]
}

/** The blocks of an article in two versions, each with its word diff. */
export function compareBlocks(
  before: LegalArticle | undefined,
  after: LegalArticle | undefined,
): BlockComparison[] {
  const pairs = mergeById(
    before === undefined ? [] : articleBlocks(before),
    after === undefined ? [] : articleBlocks(after),
  )
  return pairs.map((pair) => {
    const block = pair.after ?? pair.before
    const base = {
      id: pair.id,
      ...(block?.label === undefined ? {} : { label: block.label }),
      depth: block?.depth ?? 0,
    }
    if (pair.before === undefined) {
      return { ...base, kind: 'added', segments: [{ kind: 'added', text: block?.text ?? '' }] }
    }
    if (pair.after === undefined) {
      return { ...base, kind: 'removed', segments: [{ kind: 'removed', text: pair.before.text }] }
    }
    const segments = wordDiff(pair.before.text, pair.after.text)
    const same = segments.every((segment) => segment.kind === 'same')
    return { ...base, kind: same ? 'same' : 'changed', segments }
  })
}

/** How many articles of each kind a comparison holds. */
export function comparisonCounts(
  comparison: readonly ArticleComparison[],
): Record<ArticleChangeKind, number> {
  const counts = { added: 0, removed: 0, changed: 0, same: 0 }
  for (const each of comparison) counts[each.kind] += 1
  return counts
}

// ── Contents ──

/**
 * The table of contents as TreeView's nodes: headings with their headings and articles under
 * them; the label as the row's name, the title (or a deleted article's words) as its second line.
 */
export function legalContentsTree(nodes: readonly LegalNode[]): TreeNode[] {
  return nodes.map((node) => {
    const description = node.title ?? (node.kind === 'article' ? node.deleted : undefined)
    return {
      id: node.id,
      label: node.label,
      ...(description === undefined ? {} : { description }),
      ...(node.kind === 'heading' ? { children: legalContentsTree(node.children) } : {}),
    }
  })
}

/** The ids of every heading of the act: the contents open whole. */
export function legalHeadingIds(nodes: readonly LegalNode[]): string[] {
  return flattenLegalNodes(nodes).flatMap((entry) =>
    entry.kind === 'heading' ? [entry.node.id] : [],
  )
}

// ── Layout ──

/** The room a reference's preview needs below its link before it opens above instead. */
export const PREVIEW_ROOM = 320

/**
 * The side a reference's preview opens on, chosen once from where its link stands (a popover
 * that flips by its own height makes an unstable picture): below, unless the room below is short
 * and there is more above.
 */
export function previewSide(
  linkTop: number,
  linkBottom: number,
  viewportHeight: number,
): 'top' | 'bottom' {
  const below = viewportHeight - linkBottom
  return below >= PREVIEW_ROOM || below >= linkTop ? 'bottom' : 'top'
}

/**
 * The estimated height of a heading or an article of a long act before it is drawn: an article
 * of two short paragraphs. Each is measured once drawn.
 */
export const LEGAL_ENTRY_ESTIMATE = 160

/**
 * The first reference to `href` in the act, in reading order: its part and its place among the
 * part's runs (the reference whose preview a restored state opens). Null when there is none.
 */
export function firstReference(
  nodes: readonly LegalNode[],
  href: string,
): { partId: string; index: number } | null {
  const inPoint = (
    point: LegalParagraph | LegalPoint,
  ): { partId: string; index: number } | null => {
    const index = point.content.findIndex(
      (inline) =>
        typeof inline !== 'string' && inline.kind === 'ref' && inline.target.href === href,
    )
    if (index >= 0) return { partId: point.id, index }
    for (const child of point.points ?? []) {
      const found = inPoint(child)
      if (found !== null) return found
    }
    return null
  }
  for (const article of legalArticles(nodes)) {
    for (const paragraph of article.paragraphs) {
      const found = inPoint(paragraph)
      if (found !== null) return found
    }
  }
  return null
}

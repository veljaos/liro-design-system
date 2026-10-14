import {
  headingLevel,
  normalizeRichText,
  type HeadingLevel,
  type RichTextNode,
} from './rich-text-logic'

/*
 * The headings of a rich text value with stable ids (P5.30 e): RichText's `headingIds` gives its
 * h2 and h3 these ids, and a long reading page lists the same headings in its contents
 * (PageContents). Both read the value through `normalizeRichText`, so they always agree. Pure: no
 * DOM, no Tiptap.
 */

/** One heading of a value: its element's id, its words and its level. */
export interface RichTextHeading {
  id: string
  label: string
  level: HeadingLevel
}

/** The words of a heading: its text, a merge field's key, a mention's name. */
function inlineText(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return ' '
  if (node.type === 'mergeField' || node.type === 'mention') {
    const value = node.attrs?.[node.type === 'mention' ? 'label' : 'key']
    return typeof value === 'string' ? value : ''
  }
  return (node.content ?? []).map(inlineText).join('')
}

/**
 * A heading's words as an id's part: lower case, every run of anything but letters and digits
 * (in any script) one "-", none at the ends; "section" when nothing is left.
 */
export function headingSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug === '' ? 'section' : slug
}

/**
 * The value's headings (the document's top-level h2 and h3, as the editor makes them), in order:
 * each id is `prefix`, "-" and the heading's words (`headingSlug`), with "-2", "-3" … when two
 * headings have the same words. Empty headings are left out.
 */
export function richTextHeadings(doc: RichTextNode, prefix: string): RichTextHeading[] {
  return [...headingIdsByBlock(doc, prefix).values()]
}

/** The same headings by their top-level block's index in the normalized document. */
export function headingIdsByBlock(doc: RichTextNode, prefix: string): Map<number, RichTextHeading> {
  const out = new Map<number, RichTextHeading>()
  const used = new Map<string, number>()
  ;(normalizeRichText(doc).content ?? []).forEach((block, index) => {
    if (block.type !== 'heading') return
    const label = inlineText(block).replace(/\s+/g, ' ').trim()
    if (label === '') return
    const base = `${prefix}-${headingSlug(label)}`
    const seen = (used.get(base) ?? 0) + 1
    used.set(base, seen)
    out.set(index, {
      id: seen === 1 ? base : `${base}-${String(seen)}`,
      label,
      level: headingLevel(block.attrs?.level),
    })
  })
  return out
}

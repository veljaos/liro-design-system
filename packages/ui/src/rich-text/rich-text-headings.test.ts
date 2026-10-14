import { describe, expect, it } from 'vitest'
import { headingSlug, richTextHeadings } from './rich-text-headings'
import type { RichTextNode } from './rich-text-logic'

const heading = (level: number, text: string): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})
const paragraph = (text: string): RichTextNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

describe('headingSlug', () => {
  it('keeps letters and digits of any script, joined by "-"', () => {
    expect(headingSlug('Read the rejection message')).toBe('read-the-rejection-message')
    expect(headingSlug('  The buyer’s PIB (step 2)!  ')).toBe('the-buyer-s-pib-step-2')
    expect(headingSlug('Ђорђевић и Ђурђевак')).toBe('ђорђевић-и-ђурђевак')
    expect(headingSlug('…')).toBe('section')
  })
})

describe('richTextHeadings', () => {
  it('lists the h2 and h3 in order with stable, unique ids', () => {
    const doc: RichTextNode = {
      type: 'doc',
      content: [
        paragraph('Intro'),
        heading(2, 'Read the message'),
        paragraph('…'),
        heading(3, 'Examples'),
        heading(2, 'Send it again'),
        heading(3, 'Examples'),
        heading(2, '   '),
      ],
    }
    expect(richTextHeadings(doc, 'article')).toEqual([
      { id: 'article-read-the-message', label: 'Read the message', level: 2 },
      { id: 'article-examples', label: 'Examples', level: 3 },
      { id: 'article-send-it-again', label: 'Send it again', level: 2 },
      { id: 'article-examples-2', label: 'Examples', level: 3 },
    ])
  })

  it('has none without headings', () => {
    expect(richTextHeadings({ type: 'doc', content: [paragraph('Only text')] }, 'a')).toEqual([])
  })
})

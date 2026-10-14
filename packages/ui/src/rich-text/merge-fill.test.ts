import { describe, expect, it } from 'vitest'
import { fillMergeFields, fillMergeText, mergeTextKeys } from './merge-fill'
import type { RichTextNode } from './rich-text-logic'

const DOC: RichTextNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Dear ' },
        { type: 'mergeField', attrs: { key: 'customer.name' } },
        { type: 'text', text: ', invoice ' },
        { type: 'mergeField', attrs: { key: 'invoice.number' }, marks: [{ type: 'bold' }] },
        { type: 'text', text: ' is due on ' },
        { type: 'mergeField', attrs: { key: 'invoice.due' } },
        { type: 'text', text: '.' },
      ],
    },
  ],
}

describe('merge fields filled for a preview', () => {
  it('replaces the fields that have a value, keeping their marks', () => {
    const filled = fillMergeFields(DOC, {
      'customer.name': 'Gradska toplana Novi Sad',
      'invoice.number': 'F-2026-0431',
    })
    const parts = filled.content?.[0]?.content ?? []
    expect(parts.map((part) => part.text ?? part.type)).toEqual([
      'Dear ',
      'Gradska toplana Novi Sad',
      ', invoice ',
      'F-2026-0431',
      ' is due on ',
      'mergeField',
      '.',
    ])
    expect(parts[3]?.marks).toEqual([{ type: 'bold' }])
    // The original is left as it was.
    expect(DOC.content?.[0]?.content?.[1]?.type).toBe('mergeField')
  })

  it('leaves no empty text behind for an empty value', () => {
    const filled = fillMergeFields(DOC, { 'customer.name': '' })
    expect(filled.content?.[0]?.content?.some((part) => part.text === '')).toBe(false)
  })

  it('fills a plain text and keeps the fields without a value', () => {
    expect(
      fillMergeText('Invoice {{invoice.number}} from {{ company.name }}, {{other}}', {
        'invoice.number': 'F-2026-0431',
        'company.name': 'Kvadrat Gradnja d.o.o.',
      }),
    ).toBe('Invoice F-2026-0431 from Kvadrat Gradnja d.o.o., {{other}}')
    expect(fillMergeText('No fields', {})).toBe('No fields')
  })

  it('lists the keys of a plain text once each', () => {
    expect(mergeTextKeys('{{a}} and {{ b }} and {{a}}')).toEqual(['a', 'b'])
    expect(mergeTextKeys('{{not a key}}')).toEqual([])
  })
})

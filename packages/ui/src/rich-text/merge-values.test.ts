import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import {
  mergeFieldText,
  missingMergeFields,
  resolveMergeFields,
  resolveMergeText,
  type MergeContext,
} from './merge-values'
import type { RichTextMergeField } from './rich-text'
import type { RichTextNode } from './rich-text-logic'

const FIELDS: RichTextMergeField[] = [
  { key: 'name', label: 'First name' },
  { key: 'incident_date', label: 'Incident date', kind: 'date' },
  { key: 'date_now', label: 'Today', computed: 'today' },
  { key: 'reply_by', label: 'Reply by', computed: 'today', offsetDays: 7 },
  { key: 'time_now', label: 'Time', computed: 'now', kind: 'time' },
  { key: 'balance', label: 'Balance', kind: 'money', currency: 'RSD' },
  { key: 'ticket', label: 'Ticket number' },
]

const context = (values: MergeContext['values'], now?: string): MergeContext => ({
  fields: FIELDS,
  values,
  format: createFormat('sr-Latn-RS', {}, 'Europe/Belgrade'),
  today: '2026-10-14',
  now,
})

const merge = (key: string): RichTextNode => ({ type: 'mergeField', attrs: { key } })

describe('mergeFieldText', () => {
  it('writes plain text as given and typed values through format', () => {
    const ctx = context({
      name: 'Milica',
      incident_date: '2026-10-12',
      balance: '294000.5',
      ticket: { kind: 'text', value: '4821' },
    })
    expect(mergeFieldText('name', ctx)).toBe('Milica')
    expect(mergeFieldText('incident_date', ctx)).toBe(createFormat('sr-Latn-RS').date('2026-10-12'))
    expect(mergeFieldText('balance', ctx)).toBe(createFormat('sr-Latn-RS').money('294000.5', 'RSD'))
    expect(mergeFieldText('ticket', ctx)).toBe('4821')
  })

  it('computes today (moved by whole days) and now from the context, never the clock', () => {
    const format = createFormat('sr-Latn-RS', {}, 'Europe/Belgrade')
    expect(mergeFieldText('date_now', context({}))).toBe(format.date('2026-10-14'))
    expect(mergeFieldText('reply_by', context({}))).toBe(format.date('2026-10-21'))
    expect(mergeFieldText('time_now', context({}, '2026-10-14T07:40:00Z'))).toBe('09:40')
    expect(mergeFieldText('time_now', context({}))).toBeNull()
  })

  it('keeps every decimal of an amount', () => {
    const text = mergeFieldText('balance', context({ balance: '0.125' }))
    expect(text).toContain('125')
  })

  it('has no value for a missing, null or empty one', () => {
    const ctx = context({ name: '', ticket: null })
    expect(mergeFieldText('name', ctx)).toBeNull()
    expect(mergeFieldText('ticket', ctx)).toBeNull()
    expect(mergeFieldText('incident_date', ctx)).toBeNull()
    expect(mergeFieldText('unknown', ctx)).toBeNull()
  })
})

describe('resolveMergeFields', () => {
  const doc: RichTextNode = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Dear ' },
          { ...merge('name'), marks: [{ type: 'bold' }] },
          { type: 'text', text: ', on ' },
          merge('incident_date'),
          { type: 'text', text: ' we start on ' },
          merge('date_now'),
          { type: 'text', text: ' (' },
          merge('ticket'),
          { type: 'text', text: ', ' },
          merge('ticket'),
          { type: 'text', text: ').' },
        ],
      },
    ],
  }

  it('writes values in, keeps their marks and leaves fields without one', () => {
    const { doc: out, missing } = resolveMergeFields(
      doc,
      context({ name: 'Milica', incident_date: '2026-10-12' }),
    )
    const inline = out.content?.[0]?.content ?? []
    expect(inline[1]).toEqual({ type: 'text', text: 'Milica', marks: [{ type: 'bold' }] })
    expect(inline[3]?.type).toBe('text')
    expect(inline[5]?.type).toBe('text')
    expect(inline[7]).toEqual(merge('ticket'))
    expect(missing).toEqual(['ticket'])
  })

  it('does not change its input', () => {
    const before = JSON.stringify(doc)
    resolveMergeFields(doc, context({ name: 'Milica' }))
    expect(JSON.stringify(doc)).toBe(before)
  })
})

describe('resolveMergeText', () => {
  it('fills {{key}} in plain text and leaves the rest', () => {
    const { text, missing } = resolveMergeText(
      'Ticket {{ticket}}: {{name}}, see you {{reply_by}}. {{ nope }}',
      context({ name: 'Milica' }),
    )
    expect(text).toBe(
      `Ticket {{ticket}}: Milica, see you ${createFormat('sr-Latn-RS').date('2026-10-21')}. {{ nope }}`,
    )
    expect(missing).toEqual(['ticket'])
  })
})

describe('missingMergeFields', () => {
  it('lists each key without a value once, in order', () => {
    expect(
      missingMergeFields(
        ['ticket', 'name', 'date_now', 'ticket', 'incident_date'],
        context({ name: 'M' }),
      ),
    ).toEqual(['ticket', 'incident_date'])
  })
})

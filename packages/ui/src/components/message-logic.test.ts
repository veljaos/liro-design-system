import { describe, expect, it } from 'vitest'
import { dayOf, groupByDayOf, previousDay } from './day-groups'
import {
  insertMention,
  mentionQueryAt,
  mentionsInText,
  splitMentions,
  startsRun,
  tokenBefore,
} from './message-logic'

const IVANA = { id: 'u-ivana', name: 'Ivana Stojanović' }
const DRAGAN = { id: 'u-dragan', name: 'Dragan Ilić' }

describe('mentionQueryAt', () => {
  it('finds the "@" being typed at the start or after a space or line break', () => {
    expect(mentionQueryAt('@', 1)).toEqual({ start: 0, query: '' })
    expect(mentionQueryAt('Ask @Iva', 8)).toEqual({ start: 4, query: 'Iva' })
    expect(mentionQueryAt('Thanks\n@Ivana Sto', 17)).toEqual({ start: 7, query: 'Ivana Sto' })
  })

  it('ignores an e-mail address, a line break, a leading space and a long sentence', () => {
    expect(mentionQueryAt('milica@kvadratgradnja.rs', 24)).toBeNull()
    expect(mentionQueryAt('@Ivana\nnext', 11)).toBeNull()
    expect(mentionQueryAt('@ Ivana', 7)).toBeNull()
    expect(mentionQueryAt('@Ana Marija Jovanović Petrović', 30)).toBeNull()
    expect(mentionQueryAt('no mention here', 15)).toBeNull()
  })

  it('reads only up to the caret', () => {
    expect(mentionQueryAt('@Ivana, please check', 6)).toEqual({ start: 0, query: 'Ivana' })
  })
})

describe('inserting and removing a mention', () => {
  it('replaces the query by "@Name " and puts the caret after it', () => {
    const text = 'Please @iv check'
    const result = insertMention(text, { start: 7, query: 'iv' }, 10, IVANA.name)
    expect(result.text).toBe('Please @Ivana Stojanović  check')
    expect(result.caret).toBe('Please @Ivana Stojanović '.length)
  })

  it('finds the whole token right before the caret for Backspace', () => {
    const text = 'Please @Ivana Stojanović'
    expect(tokenBefore(text, text.length, [IVANA])).toEqual({ start: 7, end: text.length })
    expect(tokenBefore(text, text.length - 1, [IVANA])).toBeNull()
    expect(tokenBefore('x@Ivana Stojanović', 18, [IVANA])).toBeNull()
  })
})

describe('mentions in a text', () => {
  it('reports the mentions still in the text, once each, in their order', () => {
    const text = '@Dragan Ilić and @Ivana Stojanović, then @Dragan Ilić again'
    expect(mentionsInText(text, [IVANA, DRAGAN])).toEqual([DRAGAN, IVANA])
    expect(mentionsInText('@Ivana Stojanovića', [IVANA])).toEqual([])
    expect(mentionsInText('nobody', [IVANA])).toEqual([])
  })

  it('cuts a text into text and mention parts, longer names first', () => {
    const ana = { id: 'a1', name: 'Ana' }
    const anaMarija = { id: 'a2', name: 'Ana Marija' }
    expect(splitMentions('Hi @Ana Marija and @Ana.', [ana, anaMarija])).toEqual([
      { kind: 'text', text: 'Hi ' },
      { kind: 'mention', mention: anaMarija },
      { kind: 'text', text: ' and ' },
      { kind: 'mention', mention: ana },
      { kind: 'text', text: '.' },
    ])
    expect(splitMentions('plain', [ana])).toEqual([{ kind: 'text', text: 'plain' }])
  })
})

describe('runs of messages', () => {
  const at = (time: string) => `2026-10-06T${time}:00+02:00`
  it('starts a run on a new author, a new day or a pause over five minutes', () => {
    const first = { authorKey: 'dragan', at: at('09:00') }
    expect(startsRun(undefined, first)).toBe(true)
    expect(startsRun(first, { authorKey: 'dragan', at: at('09:04') })).toBe(false)
    expect(startsRun(first, { authorKey: 'dragan', at: at('09:06') })).toBe(true)
    expect(startsRun(first, { authorKey: 'ivana', at: at('09:01') })).toBe(true)
    expect(startsRun(first, { authorKey: 'dragan', at: '2026-10-07T09:01:00+02:00' })).toBe(true)
  })
})

describe('day groups', () => {
  const items = [
    { id: 'a', at: '2026-10-05T15:20:00+02:00' },
    { id: 'b', at: '2026-10-06T09:42:00+02:00' },
    { id: 'c', at: '2026-10-06T07:00:00+02:00' },
    { id: 'd', at: '2026-09-28T10:40:00+02:00' },
  ]

  it('groups newest first (a history) with today and yesterday named', () => {
    const groups = groupByDayOf(items, (item) => item.at, '2026-10-06', 'newest')
    expect(groups.map((group) => [group.day, group.kind, group.items.map((i) => i.id)])).toEqual([
      ['2026-10-06', 'today', ['b', 'c']],
      ['2026-10-05', 'yesterday', ['a']],
      ['2026-09-28', 'date', ['d']],
    ])
  })

  it('groups oldest first (a conversation)', () => {
    const groups = groupByDayOf(items, (item) => item.at, '2026-10-06', 'oldest')
    expect(groups.map((group) => group.items.map((i) => i.id))).toEqual([['d'], ['a'], ['c', 'b']])
  })

  it('reads the day as written and crosses months and years', () => {
    expect(dayOf('2026-10-06T23:30:00+02:00')).toBe('2026-10-06')
    expect(previousDay('2026-10-01')).toBe('2026-09-30')
    expect(previousDay('2026-01-01')).toBe('2025-12-31')
    expect(previousDay('2028-03-01')).toBe('2028-02-29')
  })
})

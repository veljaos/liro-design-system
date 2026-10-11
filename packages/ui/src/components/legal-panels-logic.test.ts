import { describe, expect, it } from 'vitest'
import {
  amendmentsFor,
  articleCounts,
  articlesOf,
  findArticle,
  groupRelatedByType,
  itemsForArticle,
  notesFor,
  otherVersions,
  practiceArticles,
  shownVersion,
  versionAsOf,
  versionsNewestFirst,
} from './legal-panels-logic'
import {
  HIGHER,
  LAW,
  LOWER,
  NOTES,
  PRACTICE,
  REFERS_TO,
  REFERRED_BY,
} from './legal-page-story-data'

describe('articlesOf and findArticle', () => {
  it('walks parts and chapters in the text’s order', () => {
    expect(articlesOf(LAW.nodes).map((article) => article.id)).toEqual([
      'a1',
      'a2',
      'a12',
      'a20',
      'a57',
      'a63',
      'a90',
    ])
  })

  it('finds an article inside a chapter, and nothing for an unknown id', () => {
    expect(findArticle(LAW.nodes, 'a57')?.label).toBe('Article 57')
    expect(findArticle(LAW.nodes, 'nope')).toBeUndefined()
  })
})

describe('narrowing to an article', () => {
  it('keeps every item for the whole act', () => {
    expect(itemsForArticle(PRACTICE, undefined)).toHaveLength(3)
    expect(itemsForArticle(HIGHER, undefined)).toEqual(HIGHER)
  })

  it('keeps only the items that name the article; items about the whole act go', () => {
    expect(itemsForArticle(PRACTICE, 'a12').map((item) => item.id)).toEqual(['d2', 'o1'])
    expect(itemsForArticle(HIGHER, 'a57')).toEqual([])
    expect(itemsForArticle(LOWER, 'a57').map((item) => item.id)).toEqual(['site-records'])
    expect(itemsForArticle(REFERS_TO, 'a57')).toEqual([])
    expect(itemsForArticle(REFERRED_BY, 'a57')).toHaveLength(2)
  })

  it('keeps the notes on the article; a note on the whole act only for the whole act', () => {
    expect(notesFor(NOTES, undefined)).toHaveLength(3)
    expect(notesFor(NOTES, 'a57').map((note) => note.id)).toEqual(['n1'])
    expect(notesFor(NOTES, 'a1')).toEqual([])
  })

  it('lists the amending acts that changed the article, oldest first', () => {
    expect(amendmentsFor(LAW.amendments, 'a57').map((each) => each.id)).toEqual(['am1', 'am2'])
    expect(amendmentsFor(LAW.amendments, 'a1')).toEqual([])
    expect(amendmentsFor(LAW.amendments, undefined)).toHaveLength(3)
  })
})

describe('articleCounts', () => {
  it('counts the changes, decisions and opinions that concern the article', () => {
    expect(articleCounts(LAW, PRACTICE, 'a57')).toEqual({ changes: 2, decisions: 2, opinions: 1 })
    expect(articleCounts(LAW, PRACTICE, 'a12')).toEqual({ changes: 1, decisions: 1, opinions: 1 })
    expect(articleCounts(LAW, [], 'a1')).toEqual({ changes: 0, decisions: 0, opinions: 0 })
  })

  it('agrees with the lists the narrowed panels show', () => {
    const counts = articleCounts(LAW, PRACTICE, 'a57')
    expect(counts.changes).toBe(amendmentsFor(LAW.amendments, 'a57').length)
    expect(counts.decisions + counts.opinions).toBe(itemsForArticle(PRACTICE, 'a57').length)
  })
})

describe('groupRelatedByType', () => {
  it('groups by type in the order of first appearance', () => {
    const groups = groupRelatedByType([...REFERS_TO, ...REFERRED_BY])
    expect(groups.map((group) => group.type)).toEqual(['Law', 'Decree', 'Rulebook', 'Internal act'])
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['planning', 'procedure'])
  })

  it('is empty for no items', () => {
    expect(groupRelatedByType([])).toEqual([])
  })
})

describe('practiceArticles', () => {
  it('offers the articles some item concerns, in the act’s order, and only known ones', () => {
    expect(practiceArticles(LAW.nodes, PRACTICE).map((article) => article.id)).toEqual([
      'a12',
      'a57',
    ])
    const unknown = PRACTICE.map((item) => ({ ...item, articleIds: ['missing'] }))
    expect(practiceArticles(LAW.nodes, unknown)).toEqual([])
  })
})

describe('versions', () => {
  it('finds the version shown, or the first one for an unknown id', () => {
    expect(shownVersion(LAW)?.id).toBe('v4')
    expect(shownVersion({ ...LAW, versionId: 'nope' })?.id).toBe('v1')
    expect(shownVersion({ ...LAW, versions: [] })).toBeUndefined()
  })

  it('names the day of "Version as of": asOf, today for the current one, else its first day', () => {
    const current = LAW.versions[3]
    const older = LAW.versions[1]
    expect(versionAsOf(current, '2026-10-11')).toBe('2026-10-11')
    expect(versionAsOf(older, '2026-10-11')).toBe('2018-06-23')
    expect(versionAsOf(older, '2026-10-11', '2020-01-01')).toBe('2020-01-01')
    expect(versionAsOf(undefined, '2026-10-11')).toBe('2026-10-11')
  })

  it('orders versions newest first, and offers the others to compare with', () => {
    expect(versionsNewestFirst(LAW.versions).map((version) => version.id)).toEqual([
      'v4',
      'v3',
      'v2',
      'v1',
    ])
    expect(otherVersions(LAW.versions, 'v3').map((version) => version.id)).toEqual([
      'v4',
      'v2',
      'v1',
    ])
    // The given list is not reordered.
    expect(LAW.versions[0]?.id).toBe('v1')
  })
})

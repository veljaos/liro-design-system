import { describe, expect, it } from 'vitest'
import {
  articleBlocks,
  articleText,
  compareArticles,
  compareBlocks,
  comparisonCounts,
  deletedPart,
  DIFF_LIMIT,
  findLegalArticle,
  firstReference,
  flattenLegalNodes,
  foldForSearch,
  inlineText,
  labelPart,
  latinTag,
  legalAncestors,
  legalArticles,
  legalContentsTree,
  legalHeadingIds,
  legalTextParts,
  mapFootnotesText,
  mapLegalText,
  markRuns,
  mergeById,
  paragraphText,
  previewSide,
  PREVIEW_ROOM,
  searchLegalText,
  serbianScript,
  stepHit,
  titlePart,
  transliterateCyrillicToLatin,
  transliterates,
  wordDiff,
  type DiffSegment,
} from './legal-logic'
import type { LegalNode } from './legal-model'
import {
  COMPANY_2022_NODES,
  COMPANY_2025_NODES,
  LAW_2018_NODES,
  LAW_FOOTNOTES,
  LAW_NODES,
  longIllustrativeAct,
  SERBIAN_CYRILLIC_NODES,
} from './legal-story-data'

const text = (segments: readonly DiffSegment[], without: 'added' | 'removed') =>
  segments
    .filter((segment) => segment.kind !== without)
    .map((segment) => segment.text)
    .join('')

describe('the act as a sequence', () => {
  it('flattens headings and articles in reading order with their depth and parent', () => {
    const entries = flattenLegalNodes(LAW_NODES)
    expect(entries.map((entry) => entry.node.id)).toEqual([
      'part-1',
      'a1',
      'a2',
      'a3',
      'part-2',
      'chapter-1',
      'a4',
      'a5',
      'a6',
      'chapter-2',
      'a7',
      'a8',
      'part-3',
      'a9',
      'a10',
      'a11',
    ])
    const a5 = entries.find((entry) => entry.node.id === 'a5')
    expect(a5).toMatchObject({ kind: 'article', depth: 2, parentId: 'chapter-1' })
    expect(entries[0]).toMatchObject({ kind: 'heading', depth: 0, parentId: null })
  })

  it('finds articles and the headings above a node', () => {
    expect(legalArticles(LAW_NODES)).toHaveLength(11)
    expect(findLegalArticle(LAW_NODES, 'a7')?.title).toBe('Site diary')
    expect(findLegalArticle(LAW_NODES, 'nope')).toBeUndefined()
    expect(legalAncestors(LAW_NODES, 'a5')).toEqual(['part-2', 'chapter-1'])
    expect(legalAncestors(LAW_NODES, 'part-1')).toEqual([])
    expect(legalAncestors(LAW_NODES, 'nope')).toEqual([])
  })
})

describe('plain text', () => {
  it('joins runs and leaves footnote marks out', () => {
    expect(
      inlineText([
        'See ',
        { kind: 'ref', text: 'Article 5', target: { href: '#5' } },
        ' and ',
        { kind: 'emphasis', text: 'only that' },
        { kind: 'footnote', id: 'f', mark: '1' },
        '.',
      ]),
    ).toBe('See Article 5 and only that.')
  })

  it('writes a paragraph with its items, indented, and an article line by line', () => {
    const a2 = findLegalArticle(LAW_NODES, 'a2')
    expect(a2).toBeDefined()
    if (a2 === undefined) return
    const paragraph = a2.paragraphs[0]
    expect(paragraph).toBeDefined()
    if (paragraph === undefined) return
    expect(paragraphText(paragraph).split('\n')).toEqual([
      'In this Law:',
      '  1) “works” means building, extending or repairing a structure;',
      '  2) “site” means the land on which works are carried out;',
      '  3) “contractor” means the person who carries out the works, namely:',
      '    a) the main contractor;',
      '    b) a subcontractor named in the site diary.',
    ])
    const a6 = findLegalArticle(LAW_NODES, 'a6')
    expect(a6 === undefined ? '' : articleText(a6)).toBe(
      'Article 6\nDeleted (No. 33/2021)\nA temporary permit could be issued for works lasting less than one year.',
    )
  })
})

describe('in-act search', () => {
  it('lists every part in reading order', () => {
    const parts = legalTextParts(LAW_NODES)
    expect(parts[0]).toEqual({ nodeId: 'part-1', partId: labelPart('part-1'), text: 'Part One' })
    expect(parts[1]?.partId).toBe(titlePart('part-1'))
    expect(parts.some((part) => part.partId === deletedPart('a6'))).toBe(true)
    expect(parts.some((part) => part.partId === 'a2p1i3b')).toBe(true)
  })

  it('folds case, Latin accents and Serbian Cyrillic, keeping the original places', () => {
    expect(foldForSearch('Član').folded).toBe('clan')
    expect(foldForSearch('ĐAK').folded).toBe('dak')
    expect(foldForSearch('Закон').folded).toBe('zakon')
    const { folded, map } = foldForSearch('Љубав')
    expect(folded).toBe('ljubav')
    expect(map).toEqual([0, 0, 1, 2, 3, 4])
    // Japanese voiced kana keep their mark.
    expect(foldForSearch('が').folded).not.toBe(foldForSearch('か').folded)
  })

  it('finds every match in reading order, case-insensitive, with places in the drawn text', () => {
    const hits = searchLegalText(LAW_NODES, 'SITE DIARY')
    expect(hits.length).toBeGreaterThan(2)
    expect(hits[0]).toEqual({
      nodeId: 'a2',
      partId: 'a2p1i3b',
      start: 'a subcontractor named in the '.length,
      end: 'a subcontractor named in the site diary'.length,
    })
    const order = flattenLegalNodes(LAW_NODES).map((entry) => entry.node.id)
    const places = hits.map((hit) => order.indexOf(hit.nodeId))
    expect([...places].sort((a, b) => a - b)).toEqual(places)
  })

  it('needs two characters and finds nothing for spaces', () => {
    expect(searchLegalText(LAW_NODES, 'a')).toEqual([])
    expect(searchLegalText(LAW_NODES, '   ')).toEqual([])
  })

  it('finds Cyrillic text by a Latin query, and the reverse', () => {
    const hits = searchLegalText(SERBIAN_CYRILLIC_NODES, 'dnevnik')
    expect(hits.map((hit) => hit.partId)).toEqual([titlePart('s2'), 's2p1', 's2p2'])
    expect(searchLegalText(SERBIAN_CYRILLIC_NODES, 'ДНЕВНИК')).toEqual(hits)
    const part = legalTextParts(SERBIAN_CYRILLIC_NODES).find((each) => each.partId === 's2p2')
    const hit = hits[2]
    expect(part?.text.slice(hit?.start, hit?.end)).toBe('Дневник')
  })

  it('finds articles anywhere in a long act, drawn or not', () => {
    const act = longIllustrativeAct(320)
    expect(legalArticles(act)).toHaveLength(320)
    const hits = searchLegalText(act, 'Rules on the site store (318)')
    expect(hits).toEqual([
      {
        nodeId: 'l318',
        partId: titlePart('l318'),
        start: 0,
        end: 'Rules on the site store (318)'.length,
      },
    ])
  })

  it('steps through hits round the ends', () => {
    expect(stepHit(0, 12, 1)).toBe(1)
    expect(stepHit(11, 12, 1)).toBe(0)
    expect(stepHit(0, 12, -1)).toBe(11)
    expect(stepHit(-1, 12, 1)).toBe(0)
    expect(stepHit(-1, 12, -1)).toBe(11)
    expect(stepHit(3, 0, 1)).toBe(-1)
  })

  it('splits a run of text by the hits of its part', () => {
    const ranges = [
      { start: 2, end: 4, index: 0 },
      { start: 8, end: 12, index: 1 },
    ]
    expect(markRuns('abcdef', 0, ranges)).toEqual([
      { text: 'ab', hit: null },
      { text: 'cd', hit: 0 },
      { text: 'ef', hit: null },
    ])
    // The run "ghij" starts at 6 of its part: the second hit covers its end.
    expect(markRuns('ghij', 6, ranges)).toEqual([
      { text: 'gh', hit: null },
      { text: 'ij', hit: 1 },
    ])
    expect(markRuns('', 0, ranges)).toEqual([{ text: '', hit: null }])
  })
})

describe('Serbian Cyrillic to Latin', () => {
  it('maps every letter one to one', () => {
    expect(transliterateCyrillicToLatin('абвгдђежзијклљмнњопрстћуфхцчџш')).toBe(
      'abvgdđežzijklljmnnjoprstćufhcčdžš',
    )
    expect(transliterateCyrillicToLatin('АБВГДЂЕЖЗИЈКЛМНОПРСТЋУФХЦЧШ')).toBe(
      'ABVGDĐEŽZIJKLMNOPRSTĆUFHCČŠ',
    )
  })

  it('writes capital digraphs as a title, or in capitals inside a word of capitals', () => {
    expect(transliterateCyrillicToLatin('Љубав')).toBe('Ljubav')
    expect(transliterateCyrillicToLatin('ЉУБАВ')).toBe('LJUBAV')
    expect(transliterateCyrillicToLatin('Његош и Џеп')).toBe('Njegoš i Džep')
    expect(transliterateCyrillicToLatin('ЊЕГОШ, ЏЕП')).toBe('NJEGOŠ, DŽEP')
    expect(transliterateCyrillicToLatin('ПЉ.')).toBe('PLJ.')
    expect(transliterateCyrillicToLatin('Љ')).toBe('Lj')
  })

  it('leaves Latin, digits, punctuation and other Cyrillic as they are', () => {
    expect(transliterateCyrillicToLatin('Član 5 (1), №, ы')).toBe('Član 5 (1), №, ы')
  })

  it('reads the script of a Serbian tag', () => {
    expect(serbianScript('sr-Cyrl')).toBe('cyrillic')
    expect(serbianScript('sr-Cyrl-RS')).toBe('cyrillic')
    expect(serbianScript('sr-Latn')).toBe('latin')
    expect(serbianScript('sr')).toBe('latin')
    expect(serbianScript('en')).toBeNull()
    expect(serbianScript(undefined)).toBeNull()
    expect(latinTag('sr-Cyrl')).toBe('sr-Latn')
    expect(latinTag('sr-Cyrl-RS')).toBe('sr-Latn-RS')
    expect(transliterates('sr-Cyrl', 'latin')).toBe(true)
    expect(transliterates('sr-Cyrl', 'cyrillic')).toBe(false)
    expect(transliterates('sr-Latn', 'cyrillic')).toBe(false)
    expect(transliterates('en', 'latin')).toBe(false)
  })

  it('maps every text of the act and keeps ids, addresses and dates', () => {
    const latin = mapLegalText(SERBIAN_CYRILLIC_NODES, transliterateCyrillicToLatin)
    const entries = flattenLegalNodes(latin)
    expect(entries.map((entry) => entry.node.label)).toEqual([
      'DEO PRVI',
      'Član 1',
      'Član 2',
      'DEO DRUGI',
      'Član 3',
      'Član 4',
    ])
    expect(entries[3]?.node.title).toBe('LJUDSTVO I NJEGOVE OBAVEZE')
    expect(entries[4]?.node.title).toBe('Džepna knjiga naloga')
    const s2 = findLegalArticle(latin, 's2')
    expect(s2?.paragraphs[0]?.points?.[0]?.content).toEqual([
      'podaci o radnicima i njihovim zadacima;',
    ])
    expect(s2?.href).toBe(findLegalArticle(SERBIAN_CYRILLIC_NODES, 's2')?.href)
    const law = mapLegalText(LAW_NODES, (each) => each.toUpperCase())
    const a3 = findLegalArticle(law, 'a3')
    expect(a3?.changes?.[0]).toEqual({
      amendmentId: 'am-2018',
      label: 'AMENDED BY NO. 47/2018',
      appliesFrom: '2018-07-01',
    })
    expect(a3?.paragraphs[0]?.content[1]).toMatchObject({ kind: 'ref', text: 'ARTICLE 12' })
    expect(findLegalArticle(law, 'a6')?.deleted).toBe('DELETED (NO. 33/2021)')
    expect(mapFootnotesText(LAW_FOOTNOTES, () => 'x')[0]?.content).toEqual(['x'])
  })
})

describe('word diff', () => {
  it('marks a changed word, keeping both texts', () => {
    const before = 'A permit is valid for two years.'
    const after = 'A permit is valid for three years.'
    const diff = wordDiff(before, after)
    expect(diff).toEqual([
      { kind: 'same', text: 'A permit is valid for ' },
      { kind: 'removed', text: 'two' },
      { kind: 'added', text: 'three' },
      { kind: 'same', text: ' years.' },
    ])
    expect(text(diff, 'added')).toBe(before)
    expect(text(diff, 'removed')).toBe(after)
  })

  it('joins a change of several words into one', () => {
    const diff = wordDiff('within 60 days of a request.', 'within 30 days of a complete request.')
    expect(diff).toEqual([
      { kind: 'same', text: 'within ' },
      { kind: 'removed', text: '60' },
      { kind: 'added', text: '30' },
      { kind: 'same', text: ' days of a ' },
      { kind: 'added', text: 'complete ' },
      { kind: 'same', text: 'request.' },
    ])
    expect(wordDiff('one two three', 'four five six')).toEqual([
      { kind: 'removed', text: 'one two three' },
      { kind: 'added', text: 'four five six' },
    ])
  })

  it('handles empty and equal texts', () => {
    expect(wordDiff('', 'new text')).toEqual([{ kind: 'added', text: 'new text' }])
    expect(wordDiff('old text', '')).toEqual([{ kind: 'removed', text: 'old text' }])
    expect(wordDiff('same', 'same')).toEqual([{ kind: 'same', text: 'same' }])
    expect(wordDiff('', '')).toEqual([])
  })

  it('keeps both texts for every pair of company rulebook paragraphs', () => {
    const before = legalArticles(COMPANY_2022_NODES).flatMap(articleBlocks)
    const after = legalArticles(COMPANY_2025_NODES).flatMap(articleBlocks)
    for (const block of before) {
      const other = after.find((each) => each.id === block.id)
      if (other === undefined) continue
      const diff = wordDiff(block.text, other.text)
      expect(text(diff, 'added')).toBe(block.text)
      expect(text(diff, 'removed')).toBe(other.text)
    }
  })

  it('falls back to a whole change above the limit', () => {
    const many = (word: string) =>
      Array.from({ length: 1100 }, (_, at) => `${word}${String(at)}`).join(' ')
    expect(1100 * 1100 * 2).toBeGreaterThan(DIFF_LIMIT)
    const diff = wordDiff(`start ${many('a')} end`, `start ${many('b')} end`)
    expect(diff.map((segment) => segment.kind)).toEqual(['same', 'removed', 'added', 'same'])
  })
})

describe('comparing two versions', () => {
  it('merges by id in the newer order, the removed after what they followed', () => {
    const merged = mergeById(
      [{ id: 'x' }, { id: 'a' }, { id: 'b' }, { id: 'c' }],
      [{ id: 'a' }, { id: 'n' }, { id: 'c' }],
    )
    expect(
      merged.map((each) => [each.id, each.before !== undefined, each.after !== undefined]),
    ).toEqual([
      ['x', true, false],
      ['a', true, true],
      ['b', true, false],
      ['n', false, true],
      ['c', true, true],
    ])
  })

  it('tells added, removed, changed and unchanged articles', () => {
    const comparison = compareArticles(LAW_2018_NODES, LAW_NODES)
    expect(
      comparison.filter((each) => each.kind !== 'same').map((each) => [each.id, each.kind]),
    ).toEqual([
      ['a5', 'changed'],
      ['a6', 'changed'],
      ['a8', 'added'],
    ])
    expect(comparisonCounts(comparison)).toEqual({ added: 1, removed: 0, changed: 2, same: 8 })
    const back = compareArticles(LAW_NODES, LAW_2018_NODES)
    expect(back.find((each) => each.id === 'a8')).toMatchObject({ kind: 'removed' })
    expect(
      compareArticles(COMPANY_2022_NODES, COMPANY_2025_NODES).map((each) => each.kind),
    ).toEqual(['same', 'changed', 'changed', 'same', 'removed', 'added'])
  })

  it('compares the blocks of an article with their diffs', () => {
    const before = findLegalArticle(LAW_2018_NODES, 'a5')
    const after = findLegalArticle(LAW_NODES, 'a5')
    const blocks = compareBlocks(before, after)
    expect(blocks.map((each) => [each.id, each.kind, each.label])).toEqual([
      ['a5p1', 'changed', '(1)'],
      ['a5p2', 'changed', '(2)'],
      ['a5p3', 'changed', '(3)'],
    ])
    expect(compareBlocks(undefined, after).every((each) => each.kind === 'added')).toBe(true)
    expect(compareBlocks(before, undefined)[0]).toMatchObject({
      kind: 'removed',
      segments: [
        {
          kind: 'removed',
          text: 'The illustrative authority issues the building permit within 60 days of a request.',
        },
      ],
    })
    const a1 = findLegalArticle(LAW_NODES, 'a1')
    expect(compareBlocks(a1, a1).every((each) => each.kind === 'same')).toBe(true)
  })

  it('lists items as blocks with their depth', () => {
    const a2 = findLegalArticle(LAW_NODES, 'a2')
    expect(a2 === undefined ? [] : articleBlocks(a2).map((each) => [each.id, each.depth])).toEqual([
      ['a2p1', 0],
      ['a2p1i1', 1],
      ['a2p1i2', 1],
      ['a2p1i3', 1],
      ['a2p1i3a', 2],
      ['a2p1i3b', 2],
    ])
  })
})

describe('contents', () => {
  it('builds the tree of headings and articles', () => {
    const tree = legalContentsTree(LAW_NODES)
    expect(tree.map((node) => node.label)).toEqual(['Part One', 'Part Two', 'Part Three'])
    expect(tree[0]?.description).toBe('General provisions')
    expect(tree[1]?.children?.[0]?.children?.map((node) => [node.label, node.description])).toEqual(
      [
        ['Article 4', 'Permit required'],
        ['Article 5', 'Issuing the permit'],
        ['Article 6', 'Deleted (No. 33/2021)'],
      ],
    )
    expect(tree[0]?.children?.[0]?.children).toBeUndefined()
    expect(legalHeadingIds(LAW_NODES)).toEqual([
      'part-1',
      'part-2',
      'chapter-1',
      'chapter-2',
      'part-3',
    ])
    const flat: LegalNode[] = [
      { kind: 'article', id: 'x', label: 'Article 1', paragraphs: [], href: '#' },
    ]
    expect(legalContentsTree(flat)).toEqual([{ id: 'x', label: 'Article 1' }])
  })
})

describe('the first reference to an address', () => {
  it('finds its part and place, items included', () => {
    expect(firstReference(LAW_NODES, '#/legal/acts/building-works/article-4')).toEqual({
      partId: 'a9p1',
      index: 1,
    })
    const nested: LegalNode[] = [
      {
        kind: 'article',
        id: 'n',
        label: 'Article 1',
        href: '#1',
        paragraphs: [
          {
            id: 'np',
            content: ['Text'],
            points: [
              {
                id: 'ni',
                label: '1)',
                content: ['See ', { kind: 'ref', text: 'x', target: { href: '#x' } }],
              },
            ],
          },
        ],
      },
    ]
    expect(firstReference(nested, '#x')).toEqual({ partId: 'ni', index: 1 })
    expect(firstReference(LAW_NODES, '#nowhere')).toBeNull()
  })
})

describe('the preview side', () => {
  it('opens below unless the room below is short and there is more above', () => {
    expect(previewSide(100, 120, 900)).toBe('bottom')
    expect(previewSide(700, 720, 900)).toBe('top')
    expect(previewSide(100, 120, 120 + PREVIEW_ROOM - 1)).toBe('bottom')
    expect(previewSide(50, 70, 200)).toBe('bottom')
  })
})

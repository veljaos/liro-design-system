import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { messagesEn } from '../provider/messages.en'
import {
  blockedFolders,
  canDropInto,
  expiresTooSoon,
  fileIconKind,
  folderPath,
  momentText,
  pickerTree,
  resolveConflicts,
  selectRange,
  sizeText,
  toggleSelection,
  uploadCounts,
  withPaths,
} from './file-browser-logic'
import type { TreeNode } from './tree-logic'

/*
 *   docs
 *     contracts
 *       2026
 *     staff
 *   archive
 */
const TREE: TreeNode[] = [
  {
    id: 'docs',
    label: 'Documents',
    children: [
      { id: 'contracts', label: 'Contracts', children: [{ id: '2026', label: '2026' }] },
      { id: 'staff', label: 'Staff', disabledReason: 'Only HR adds files here' },
    ],
  },
  { id: 'archive', label: 'Archive', hasChildren: true },
]

describe('fileIconKind', () => {
  it('takes the entry’s own icon first, then folders, then the extension in any case', () => {
    expect(fileIconKind({ name: 'a.pdf', kind: 'file', icon: 'image' })).toBe('image')
    expect(fileIconKind({ name: 'Contracts.pdf', kind: 'folder' })).toBe('folder')
    expect(fileIconKind({ name: 'Ugovor.PDF', kind: 'file' })).toBe('pdf')
    expect(fileIconKind({ name: 'IMG_2041.jpeg', kind: 'file' })).toBe('image')
    expect(fileIconKind({ name: 'plan.xlsx', kind: 'file' })).toBe('spreadsheet')
    expect(fileIconKind({ name: 'site.tar.gz', kind: 'file' })).toBe('archive')
  })

  it('is "other" without a known extension', () => {
    expect(fileIconKind({ name: 'README', kind: 'file' })).toBe('other')
    expect(fileIconKind({ name: '.env', kind: 'file' })).toBe('other')
    expect(fileIconKind({ name: 'trailing.', kind: 'file' })).toBe('other')
    expect(fileIconKind({ name: 'drawing.dwg', kind: 'file' })).toBe('other')
  })
})

describe('sizeText and momentText', () => {
  const format = createFormat('sr-Latn-RS')
  it('writes the size through format exactly as given, with its unit', () => {
    expect(sizeText(format, messagesEn, { size: '2.4', sizeUnit: 'MB' })).toBe('2,4 MB')
    expect(sizeText(format, messagesEn, { size: '1234567.89', sizeUnit: 'KB' })).toBe(
      '1.234.567,89 KB',
    )
    expect(sizeText(format, messagesEn, { size: '512' })).toBe('512')
    expect(sizeText(format, messagesEn, {})).toBeNull()
  })

  it('writes a day as a date and an instant as a date and a time', () => {
    expect(momentText(format, '2026-10-12')).toBe(format.date('2026-10-12'))
    expect(momentText(format, '2026-10-12T14:05:00+02:00')).toBe(
      `${format.date('2026-10-12')} 14:05`,
    )
    expect(momentText(format, 'yesterday')).toBe('yesterday')
  })
})

describe('moving', () => {
  it('finds a folder’s path from the top', () => {
    expect(folderPath(TREE, '2026')).toEqual(['docs', 'contracts', '2026'])
    expect(folderPath(TREE, 'archive')).toEqual(['archive'])
    expect(folderPath(TREE, 'not-loaded')).toEqual(['not-loaded'])
  })

  it('never drops into a moved folder, a folder inside it, or where the items already are', () => {
    expect(canDropInto(['a.pdf'], 'staff', folderPath(TREE, 'staff'), 'contracts')).toBe(true)
    expect(canDropInto(['a.pdf'], 'contracts', folderPath(TREE, 'contracts'), 'contracts')).toBe(
      false,
    )
    expect(canDropInto(['contracts'], 'contracts', folderPath(TREE, 'contracts'), 'docs')).toBe(
      false,
    )
    expect(canDropInto(['contracts'], '2026', folderPath(TREE, '2026'), 'docs')).toBe(false)
    expect(canDropInto(['contracts'], 'archive', folderPath(TREE, 'archive'), 'docs')).toBe(true)
    expect(canDropInto([], 'archive', ['archive'])).toBe(false)
  })

  it('blocks the moved folders and everything inside them in the picker', () => {
    expect([...blockedFolders(TREE, ['contracts'])].sort()).toEqual(['2026', 'contracts'])
    expect([...blockedFolders(TREE, ['x.pdf'])]).toEqual([])
    const tree = pickerTree(TREE, blockedFolders(TREE, ['docs']), 'Is being moved')
    expect(tree[0]?.disabledReason).toBe('Is being moved')
    expect(tree[0]?.children?.[0]?.children?.[0]?.disabledReason).toBe('Is being moved')
    // The application's own reason stays.
    expect(tree[0]?.children?.[1]?.disabledReason).toBe('Only HR adds files here')
    expect(tree[1]?.disabledReason).toBeUndefined()
    expect(tree[1]?.hasChildren).toBe(true)
  })
})

describe('selection', () => {
  const order = ['a', 'b', 'c', 'd', 'e']
  it('toggles one item', () => {
    expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('adds the range from the anchor, in either direction, without doubles', () => {
    expect(selectRange(order, [], 'b', 'd')).toEqual(['b', 'c', 'd'])
    expect(selectRange(order, ['e'], 'd', 'b')).toEqual(['e', 'b', 'c', 'd'])
    expect(selectRange(order, ['c'], 'b', 'd')).toEqual(['c', 'b', 'd'])
  })

  it('without an anchor takes the item alone', () => {
    expect(selectRange(order, ['a'], null, 'c')).toEqual(['a', 'c'])
    expect(selectRange(order, ['c'], 'gone', 'c')).toEqual(['c'])
    expect(selectRange(order, ['a'], 'b', 'unknown')).toEqual(['a'])
  })
})

describe('uploads', () => {
  it('keeps the path a chosen folder gives each file', () => {
    const plain = new File(['x'], 'a.pdf')
    const inFolder = new File(['x'], 'b.jpg')
    Object.defineProperty(inFolder, 'webkitRelativePath', { value: 'Photos/2026/b.jpg' })
    expect(withPaths([plain, inFolder]).map((each) => each.path)).toEqual([
      'a.pdf',
      'Photos/2026/b.jpg',
    ])
  })

  it('counts done, running and problems', () => {
    expect(
      uploadCounts([
        { state: 'available' },
        { state: 'uploading' },
        { state: 'scanning' },
        { state: 'quarantined' },
        { state: 'failed' },
        { state: 'available' },
      ]),
    ).toEqual({ total: 6, done: 2, running: 2, problems: 2 })
    expect(uploadCounts([])).toEqual({ total: 0, done: 0, running: 0, problems: 0 })
  })
})

describe('resolveConflicts', () => {
  const waiting = [
    { id: '1' },
    { id: '2', replaceUnavailable: 'Signed documents cannot be replaced.' },
    { id: '3' },
  ]
  it('answers the first one only', () => {
    expect(resolveConflicts(waiting, 'skip', false)).toEqual({
      resolved: [{ id: '1', choice: 'skip' }],
      remaining: [waiting[1], waiting[2]],
    })
  })

  it('answers every waiting one with "Apply to all"', () => {
    expect(resolveConflicts(waiting, 'keepBoth', true)).toEqual({
      resolved: [
        { id: '1', choice: 'keepBoth' },
        { id: '2', choice: 'keepBoth' },
        { id: '3', choice: 'keepBoth' },
      ],
      remaining: [],
    })
  })

  it('keeps a conflict that cannot be replaced for its own answer', () => {
    expect(resolveConflicts(waiting, 'replace', true)).toEqual({
      resolved: [
        { id: '1', choice: 'replace' },
        { id: '3', choice: 'replace' },
      ],
      remaining: [waiting[1]],
    })
    expect(resolveConflicts([], 'skip', true)).toEqual({ resolved: [], remaining: [] })
  })
})

describe('expiresTooSoon', () => {
  it('is true for today or a day before, compared as dates', () => {
    expect(expiresTooSoon('2026-10-14', '2026-10-14')).toBe(true)
    expect(expiresTooSoon('2026-09-30', '2026-10-14')).toBe(true)
    expect(expiresTooSoon('2026-10-15', '2026-10-14')).toBe(false)
    expect(expiresTooSoon(null, '2026-10-14')).toBe(false)
    expect(expiresTooSoon('', '2026-10-14')).toBe(false)
  })
})

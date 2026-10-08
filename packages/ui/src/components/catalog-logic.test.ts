import { describe, expect, it } from 'vitest'
import {
  assignColumn,
  changedFields,
  hasErrors,
  importBlocked,
  isProblemRow,
  isTypingKey,
  issuesOf,
  lookupDialogKeyTarget,
  missingRequired,
  toggleChanging,
  unusedColumns,
  type ImportField,
  type ImportPreviewRow,
} from './catalog-logic'

describe('lookupDialogKeyTarget', () => {
  it('ArrowDown leaves the search field for the first result; other keys stay in the field', () => {
    expect(lookupDialogKeyTarget('ArrowDown', -1, 25)).toBe(0)
    expect(lookupDialogKeyTarget('ArrowUp', -1, 25)).toBeNull()
    expect(lookupDialogKeyTarget('End', -1, 25)).toBeNull()
    expect(lookupDialogKeyTarget('Home', -1, 25)).toBeNull()
  })

  it('moves one row and stops at the ends; ArrowUp from the first row returns to the search', () => {
    expect(lookupDialogKeyTarget('ArrowDown', 3, 25)).toBe(4)
    expect(lookupDialogKeyTarget('ArrowDown', 24, 25)).toBe(24)
    expect(lookupDialogKeyTarget('ArrowUp', 3, 25)).toBe(2)
    expect(lookupDialogKeyTarget('ArrowUp', 0, 25)).toBe('search')
  })

  it('pages by ten, Home and End go to the first and last', () => {
    expect(lookupDialogKeyTarget('PageDown', 3, 25)).toBe(13)
    expect(lookupDialogKeyTarget('PageDown', 20, 25)).toBe(24)
    expect(lookupDialogKeyTarget('PageUp', 13, 25)).toBe(3)
    expect(lookupDialogKeyTarget('PageUp', 4, 25)).toBe(0)
    expect(lookupDialogKeyTarget('Home', 13, 25)).toBe(0)
    expect(lookupDialogKeyTarget('End', 2, 25)).toBe(24)
  })

  it('does nothing without results, and ignores other keys', () => {
    expect(lookupDialogKeyTarget('ArrowDown', -1, 0)).toBeNull()
    expect(lookupDialogKeyTarget('Enter', 2, 25)).toBeNull()
    expect(lookupDialogKeyTarget('a', 2, 25)).toBeNull()
  })
})

describe('isTypingKey', () => {
  const key = (
    value: string,
    modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {},
  ) => ({
    key: value,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...modifiers,
  })
  it('a character or Backspace types; named keys, Space and shortcuts do not', () => {
    expect(isTypingKey(key('a'))).toBe(true)
    expect(isTypingKey(key('Ž'))).toBe(true)
    expect(isTypingKey(key('ش'))).toBe(true)
    expect(isTypingKey(key('7'))).toBe(true)
    expect(isTypingKey(key('Backspace'))).toBe(true)
    expect(isTypingKey(key(' '))).toBe(false)
    expect(isTypingKey(key('ArrowDown'))).toBe(false)
    expect(isTypingKey(key('Enter'))).toBe(false)
    expect(isTypingKey(key('F2'))).toBe(false)
    expect(isTypingKey(key('c', { ctrlKey: true }))).toBe(false)
    expect(isTypingKey(key('k', { metaKey: true }))).toBe(false)
  })
})

const FIELDS: ImportField[] = [
  { id: 'name', label: 'Name', required: true },
  { id: 'taxId', label: 'Tax number', required: true },
  { id: 'city', label: 'City' },
  { id: 'email', label: 'E-mail' },
]

const COLUMNS = [
  { id: 'c1', name: 'Naziv kupca', sample: 'Panonija Agro d.o.o.' },
  { id: 'c2', name: 'PIB', sample: '104987265' },
  { id: 'c3', name: 'Mesto', sample: 'Kać' },
  { id: 'c4', name: 'Napomena' },
]

describe('column mapping', () => {
  it('names the required fields without a column, in the fields’ order', () => {
    expect(missingRequired(FIELDS, {}).map((field) => field.id)).toEqual(['name', 'taxId'])
    expect(missingRequired(FIELDS, { name: 'c1', taxId: null }).map((field) => field.id)).toEqual([
      'taxId',
    ])
    expect(missingRequired(FIELDS, { name: 'c1', taxId: 'c2' })).toEqual([])
  })

  it('lists the file’s columns no field takes, in the file’s order', () => {
    expect(
      unusedColumns(COLUMNS, { name: 'c1', taxId: 'c2', city: null }).map((c) => c.name),
    ).toEqual(['Mesto', 'Napomena'])
  })

  it('a column fills one field: choosing it for another field takes it from the first', () => {
    const mapping = { name: 'c1', taxId: 'c2', city: null }
    expect(assignColumn(mapping, 'city', 'c3')).toEqual({ name: 'c1', taxId: 'c2', city: 'c3' })
    expect(assignColumn(mapping, 'city', 'c1')).toEqual({ name: null, taxId: 'c2', city: 'c1' })
    expect(assignColumn(mapping, 'name', null)).toEqual({ name: null, taxId: 'c2', city: null })
    // The mapping given is not changed.
    expect(mapping).toEqual({ name: 'c1', taxId: 'c2', city: null })
  })
})

describe('validation preview', () => {
  const row: ImportPreviewRow = {
    id: 'r14',
    line: 14,
    values: { name: 'Panonija Agro', taxId: '10498726' },
    issues: [
      { field: 'taxId', tone: 'warning', text: 'Check the tax number' },
      { field: 'taxId', tone: 'danger', text: 'Tax number must have 9 digits' },
      { tone: 'warning', text: 'Same name as an existing customer' },
    ],
  }
  const clean: ImportPreviewRow = { id: 'r15', line: 15, values: {}, issues: [] }

  it('tells problem rows and rows with errors', () => {
    expect(isProblemRow(row)).toBe(true)
    expect(isProblemRow(clean)).toBe(false)
    expect(hasErrors(row)).toBe(true)
    expect(hasErrors({ ...row, issues: [{ tone: 'warning', text: 'x' }] })).toBe(false)
  })

  it('gives a cell’s issues errors first, and the row’s own issues apart', () => {
    expect(issuesOf(row, 'taxId').map((issue) => issue.tone)).toEqual(['danger', 'warning'])
    expect(issuesOf(row, undefined).map((issue) => issue.text)).toEqual([
      'Same name as an existing customer',
    ])
    expect(issuesOf(row, 'name')).toEqual([])
  })

  it('blocks the import while rows have errors that are not skipped', () => {
    expect(importBlocked({ ready: 1198, errors: 12 }, false)).toBe(true)
    expect(importBlocked({ ready: 1198, errors: 12 }, true)).toBe(false)
    expect(importBlocked({ ready: 1210, errors: 0 }, false)).toBe(false)
  })
})

describe('bulk edit', () => {
  const fields = [{ id: 'term' }, { id: 'group' }, { id: 'agent' }]
  it('keeps the changed fields in the fields’ order', () => {
    expect(toggleChanging(fields, [], 'agent', true)).toEqual(['agent'])
    expect(toggleChanging(fields, ['agent'], 'term', true)).toEqual(['term', 'agent'])
    expect(toggleChanging(fields, ['term', 'agent'], 'term', false)).toEqual(['agent'])
    expect(toggleChanging(fields, ['agent'], 'agent', true)).toEqual(['agent'])
    expect(changedFields(fields, ['agent', 'term']).map((field) => field.id)).toEqual([
      'term',
      'agent',
    ])
  })
})

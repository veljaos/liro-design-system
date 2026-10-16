import { describe, expect, it } from 'vitest'
import {
  definedConditionFields,
  definedConditionHolds,
  definedEmptyValue,
  definedFieldIds,
  definedFieldRequired,
  definedFormProblems,
  definedFormState,
  definedMissingKind,
  definedValueFilled,
  type DefinedSection,
} from './defined-form-logic'

/** A decision on leave: in parts or at once; a second part asked only when in parts. */
const SECTIONS: DefinedSection[] = [
  {
    id: 'who',
    title: 'Employee',
    fields: [
      { id: 'employee', type: 'text', label: 'Employee', required: true },
      {
        id: 'kind',
        type: 'radio',
        label: 'Leave',
        required: true,
        options: [
          { value: 'once', label: 'At once' },
          { value: 'parts', label: 'In parts' },
        ],
      },
      {
        id: 'secondFrom',
        type: 'date',
        label: 'Second part from',
        visibleWhen: { field: 'kind', equals: 'parts' },
        required: true,
      },
      { id: 'note', type: 'textarea', label: 'Note' },
      {
        id: 'reason',
        type: 'text',
        label: 'Why a note',
        requiredWhen: { field: 'note', filled: true },
      },
    ],
  },
  {
    id: 'abroad',
    title: 'Abroad',
    visibleWhen: { field: 'documentKind', equals: 'export' },
    fields: [
      { id: 'country', type: 'select', label: 'Country', required: true, options: [] },
      { id: 'agree', type: 'checkbox', label: 'Agreed', required: true },
    ],
  },
]

describe('definedValueFilled', () => {
  it('counts text, choices and ticked boxes; never blanks, empty lists or false', () => {
    expect(definedValueFilled('Nikola')).toBe(true)
    expect(definedValueFilled('0')).toBe(true)
    expect(definedValueFilled('  ')).toBe(false)
    expect(definedValueFilled(null)).toBe(false)
    expect(definedValueFilled(undefined)).toBe(false)
    expect(definedValueFilled(['a'])).toBe(true)
    expect(definedValueFilled([])).toBe(false)
    expect(definedValueFilled(true)).toBe(true)
    expect(definedValueFilled(false)).toBe(false)
  })
})

describe('definedConditionHolds', () => {
  const values = { kind: 'parts', tags: ['a', 'b'], agree: true, amount: '1200.00' }

  it('compares a value as written', () => {
    expect(definedConditionHolds({ field: 'kind', equals: 'parts' }, values)).toBe(true)
    expect(definedConditionHolds({ field: 'kind', notEquals: 'parts' }, values)).toBe(false)
    expect(definedConditionHolds({ field: 'kind', oneOf: ['once', 'parts'] }, values)).toBe(true)
    // Decimal strings are not numbers: "1200.00" is not "1200" (D4).
    expect(definedConditionHolds({ field: 'amount', equals: '1200' }, values)).toBe(false)
  })

  it('reads a multiple choice as the values chosen', () => {
    expect(definedConditionHolds({ field: 'tags', equals: 'b' }, values)).toBe(true)
    expect(definedConditionHolds({ field: 'tags', oneOf: ['c', 'a'] }, values)).toBe(true)
    expect(definedConditionHolds({ field: 'tags', notEquals: 'c' }, values)).toBe(true)
  })

  it('reads booleans and empty values', () => {
    expect(definedConditionHolds({ field: 'agree', equals: true }, values)).toBe(true)
    expect(definedConditionHolds({ field: 'agree', equals: 'true' }, values)).toBe(false)
    expect(definedConditionHolds({ field: 'missing', equals: 'x' }, values)).toBe(false)
    expect(definedConditionHolds({ field: 'missing', notEquals: 'x' }, values)).toBe(true)
    expect(definedConditionHolds({ field: 'missing', filled: false }, values)).toBe(true)
    expect(definedConditionHolds({ field: 'kind', filled: true }, values)).toBe(true)
  })

  it('combines with all, any and not', () => {
    const both = {
      all: [
        { field: 'kind', equals: 'parts' },
        { field: 'agree', equals: true },
      ],
    }
    expect(definedConditionHolds(both, values)).toBe(true)
    expect(
      definedConditionHolds(
        {
          any: [
            { field: 'kind', equals: 'once' },
            { field: 'tags', equals: 'z' },
          ],
        },
        values,
      ),
    ).toBe(false)
    expect(definedConditionHolds({ not: both }, values)).toBe(false)
    expect(definedConditionHolds({ all: [] }, values)).toBe(true)
    expect(definedConditionHolds({ any: [] }, values)).toBe(false)
  })
})

describe('definedFieldRequired', () => {
  it('is required always or while its condition holds', () => {
    const [employee, , , , reason] = SECTIONS[0]?.fields ?? []
    if (employee === undefined || reason === undefined) throw new Error('fixture')
    expect(definedFieldRequired(employee, {})).toBe(true)
    expect(definedFieldRequired(reason, {})).toBe(false)
    expect(definedFieldRequired(reason, { note: 'See the request' })).toBe(true)
  })
})

describe('definedFormState', () => {
  it('shows fields by their conditions and lists the missing ones in order', () => {
    const state = definedFormState(SECTIONS, {})
    expect(state.sections.map((each) => each.section.id)).toEqual(['who'])
    expect(state.sections[0]?.fields.map((each) => each.field.id)).toEqual([
      'employee',
      'kind',
      'note',
      'reason',
    ])
    expect(state.missing).toEqual(['employee', 'kind'])
  })

  it('reveals a field and requires it when its condition holds', () => {
    const state = definedFormState(SECTIONS, { employee: 'Nikola Marković', kind: 'parts' })
    expect(state.missing).toEqual(['secondFrom'])
    expect(definedFormState(SECTIONS, { kind: 'parts', note: 'x' }).missing).toEqual([
      'employee',
      'secondFrom',
      'reason',
    ])
  })

  it('keeps a hidden value but does not submit it', () => {
    const values = { employee: 'Nikola Marković', kind: 'once', secondFrom: '2026-12-01' }
    const state = definedFormState(SECTIONS, values)
    expect(state.missing).toEqual([])
    expect(state.submitted).toEqual({
      employee: 'Nikola Marković',
      kind: 'once',
      note: null,
      reason: null,
    })
    expect('secondFrom' in state.submitted).toBe(false)
  })

  it('reads context values the application adds, and shows a section by them', () => {
    const state = definedFormState(SECTIONS, { documentKind: 'export', agree: false })
    expect(state.sections.map((each) => each.section.id)).toEqual(['who', 'abroad'])
    expect(state.missing).toEqual(['employee', 'kind', 'country', 'agree'])
    // A context value is read, never submitted.
    expect('documentKind' in state.submitted).toBe(false)
  })

  it('reads a hidden field as empty in the conditions after it', () => {
    const sections: DefinedSection[] = [
      {
        id: 's',
        title: 'S',
        fields: [
          { id: 'a', type: 'switch', label: 'A' },
          { id: 'b', type: 'text', label: 'B', visibleWhen: { field: 'a', equals: true } },
          { id: 'c', type: 'text', label: 'C', visibleWhen: { field: 'b', filled: true } },
        ],
      },
    ]
    const shown = (values: Record<string, string | boolean>) =>
      definedFormState(sections, values).sections[0]?.fields.map((each) => each.field.id)
    expect(shown({ a: true, b: 'x' })).toEqual(['a', 'b', 'c'])
    // B is hidden, so its old value no longer shows C.
    expect(shown({ a: false, b: 'x' })).toEqual(['a'])
  })

  it('never counts a read-only or disabled field as missing', () => {
    const sections: DefinedSection[] = [
      {
        id: 's',
        title: 'S',
        fields: [
          { id: 'number', type: 'text', label: 'Number', required: true, readOnly: true },
          {
            id: 'seal',
            type: 'checkbox',
            label: 'Seal',
            required: true,
            disabledReason: 'Not used by this company.',
          },
        ],
      },
    ]
    expect(definedFormState(sections, {}).missing).toEqual([])
  })
})

describe('definedFormProblems', () => {
  it('finds ids used twice, choices without options and conditions on later fields', () => {
    expect(definedFormProblems(SECTIONS, ['documentKind'])).toEqual([
      'Field "country" is a choice without options',
    ])
    expect(definedFormProblems(SECTIONS)).toEqual([
      'Section "abroad": the condition reads "documentKind", which is not defined',
      'Field "country" is a choice without options',
    ])
    const later: DefinedSection[] = [
      {
        id: 's',
        title: 'S',
        fields: [
          { id: 'a', type: 'text', label: 'A', visibleWhen: { field: 'b', filled: true } },
          { id: 'b', type: 'text', label: 'B' },
          { id: 'b', type: 'text', label: 'B again' },
        ],
      },
    ]
    expect(definedFormProblems(later)).toEqual([
      'Field "a": the condition reads "b", defined after it',
      'Field "b" is defined twice',
    ])
  })
})

describe('helpers', () => {
  it('lists ids, condition fields, the missing words and empty values', () => {
    expect(definedFieldIds(SECTIONS)).toEqual([
      'employee',
      'kind',
      'secondFrom',
      'note',
      'reason',
      'country',
      'agree',
    ])
    expect(
      definedConditionFields({
        all: [{ field: 'a', equals: 'x' }, { not: { any: [{ field: 'b', filled: true }] } }],
      }),
    ).toEqual(['a', 'b'])
    expect(definedMissingKind('radio')).toBe('choose')
    expect(definedMissingKind('multiselect')).toBe('choose')
    expect(definedMissingKind('checkbox')).toBe('tick')
    expect(definedMissingKind('money')).toBe('fill')
    expect(definedEmptyValue('switch')).toBe(false)
    expect(definedEmptyValue('multiselect')).toEqual([])
    expect(definedEmptyValue('date')).toBeNull()
  })
})

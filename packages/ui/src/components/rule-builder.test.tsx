import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { createFormat } from '../provider/format'
import { RuleBuilder, ruleValueText } from './rule-builder'
import {
  addRuleAction,
  addRuleCondition,
  addRuleGroup,
  emptyRuleDraft,
  findRuleCondition,
  focusAfterRemove,
  moveFocusTarget,
  moveRuleItem,
  nextRuleId,
  operatorsFor,
  removeRuleItem,
  ruleConditionCount,
  rulePlace,
  ruleProblemKey,
  setConditionField,
  setConditionOperator,
  setConditionValue,
  setRuleActionParam,
  setRuleActionType,
  setRuleJoin,
  type RuleActionType,
  type RuleDraft,
  type RuleField,
  type RuleOperator,
  type RuleTrigger,
} from './rule-builder-logic'

const TRIGGERS: RuleTrigger[] = [{ id: 'posted', label: 'A bill is posted' }]

const OPERATORS: RuleOperator[] = [
  { id: 'gt', label: 'is more than' },
  { id: 'eq', label: 'is' },
  { id: 'empty', label: 'is empty', noValue: true },
]

const FIELDS: RuleField[] = [
  { id: 'amount', label: 'Amount', kind: 'money', currency: 'EUR', operators: ['gt', 'eq'] },
  { id: 'total', label: 'Total', kind: 'money', currency: 'EUR', operators: ['gt'] },
  { id: 'count', label: 'Lines', kind: 'number', operators: ['gt', 'empty'] },
  {
    id: 'kind',
    label: 'Kind',
    kind: 'choice',
    operators: ['eq'],
    options: [
      { value: 'goods', label: 'Goods' },
      { value: 'services', label: 'Services' },
    ],
  },
  {
    id: 'channel',
    label: 'Channel',
    kind: 'choice',
    operators: ['eq'],
    options: [{ value: 'post', label: 'Post' }],
  },
  { id: 'due', label: 'Due', kind: 'date', operators: ['eq', 'empty'] },
]

const ACTIONS: RuleActionType[] = [
  {
    id: 'notify',
    label: 'Notify a person',
    params: [
      {
        id: 'who',
        label: 'Who',
        kind: 'choice',
        required: true,
        options: [{ value: 'ana', label: 'Ana Ward' }],
      },
      { id: 'note', label: 'Message', kind: 'longText' },
    ],
  },
  { id: 'tag', label: 'Add a tag', params: [{ id: 'tag', label: 'Tag', kind: 'text' }] },
]

/** A rule: amount over 500, and a group (kind is goods, or lines more than 3); notify Ana. */
const RULE: RuleDraft = {
  trigger: 'posted',
  join: 'all',
  conditions: [
    { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '500' },
    {
      kind: 'group',
      id: 'g1',
      join: 'any',
      items: [
        { kind: 'condition', id: 'c2', field: 'kind', operator: 'eq', value: 'goods' },
        { kind: 'condition', id: 'c3', field: 'count', operator: 'gt', value: '3' },
      ],
    },
  ],
  actions: [
    { id: 'a1', type: 'notify', params: { who: 'ana', note: null } },
    { id: 'a2', type: 'tag', params: { tag: 'Large' } },
  ],
}

describe('rule ids and places', () => {
  it('makes new ids above the highest of their prefix', () => {
    expect(nextRuleId(RULE, 'c')).toBe('c4')
    expect(nextRuleId(RULE, 'g')).toBe('g2')
    expect(nextRuleId(RULE, 'a')).toBe('a3')
    expect(nextRuleId(emptyRuleDraft(), 'c')).toBe('c1')
  })

  it('finds where an item stands', () => {
    expect(rulePlace(RULE, 'c1')).toEqual({ list: 'conditions', index: 0, length: 2 })
    expect(rulePlace(RULE, 'g1')).toEqual({ list: 'conditions', index: 1, length: 2 })
    expect(rulePlace(RULE, 'c3')).toEqual({ list: 'group', groupId: 'g1', index: 1, length: 2 })
    expect(rulePlace(RULE, 'a2')).toEqual({ list: 'actions', index: 1, length: 2 })
    expect(rulePlace(RULE, 'x')).toBeUndefined()
    expect(findRuleCondition(RULE, 'c3')?.value).toBe('3')
    expect(findRuleCondition(RULE, 'g1')).toBeUndefined()
  })

  it('counts the conditions, those in groups included', () => {
    expect(ruleConditionCount(RULE)).toBe(3)
    expect(ruleConditionCount(emptyRuleDraft())).toBe(0)
  })

  it('keys problems by item and part', () => {
    expect(ruleProblemKey('c2', 'value')).toBe('c2.value')
  })
})

describe('adding, moving and removing', () => {
  it('adds a condition to the rule or to a group, and a group with one condition', () => {
    const top = addRuleCondition(RULE)
    expect(top.id).toBe('c4')
    expect(top.draft.conditions.at(-1)).toEqual({
      kind: 'condition',
      id: 'c4',
      field: null,
      operator: null,
      value: null,
    })
    const inside = addRuleCondition(RULE, 'g1')
    expect(rulePlace(inside.draft, inside.id)).toEqual({
      list: 'group',
      groupId: 'g1',
      index: 2,
      length: 3,
    })
    const group = addRuleGroup(RULE)
    expect(group.id).toBe('g2')
    expect(group.conditionId).toBe('c4')
    expect(group.draft.conditions.at(-1)).toMatchObject({ kind: 'group', join: 'any' })
    const action = addRuleAction(RULE)
    expect(action.id).toBe('a3')
    expect(action.draft.actions.at(-1)).toEqual({ id: 'a3', type: null, params: {} })
  })

  it('moves an item within its own list and never past its ends', () => {
    expect(moveRuleItem(RULE, 'g1', -1).conditions.map((each) => each.id)).toEqual(['g1', 'c1'])
    expect(moveRuleItem(RULE, 'c1', -1)).toEqual(RULE)
    const inGroup = moveRuleItem(RULE, 'c3', -1).conditions[1]
    expect(inGroup?.kind === 'group' ? inGroup.items.map((each) => each.id) : []).toEqual([
      'c3',
      'c2',
    ])
    expect(moveRuleItem(RULE, 'a1', 1).actions.map((each) => each.id)).toEqual(['a2', 'a1'])
    expect(moveRuleItem(RULE, 'x', 1)).toBe(RULE)
  })

  it('removes conditions, groups and actions; an emptied group goes with its last condition', () => {
    expect(removeRuleItem(RULE, 'c1').conditions.map((each) => each.id)).toEqual(['g1'])
    expect(removeRuleItem(RULE, 'g1').conditions.map((each) => each.id)).toEqual(['c1'])
    expect(removeRuleItem(RULE, 'a1').actions.map((each) => each.id)).toEqual(['a2'])
    const once = removeRuleItem(RULE, 'c2')
    expect(ruleConditionCount(once)).toBe(2)
    expect(removeRuleItem(once, 'c3').conditions.map((each) => each.id)).toEqual(['c1'])
  })

  it('says where the focus goes after a removal and a move', () => {
    expect(focusAfterRemove(0, 3)).toBe(0)
    expect(focusAfterRemove(2, 3)).toBe(1)
    expect(focusAfterRemove(0, 1)).toBeUndefined()
    // Moving up into first place: Move up is gone, Move down keeps the focus.
    expect(moveFocusTarget(1, 3, -1)).toBe('down')
    expect(moveFocusTarget(2, 3, -1)).toBe('up')
    expect(moveFocusTarget(1, 3, 1)).toBe('up')
    expect(moveFocusTarget(0, 3, 1)).toBe('down')
  })
})

describe('editing conditions and actions', () => {
  it('sets the joins', () => {
    expect(setRuleJoin(RULE, 'any').join).toBe('any')
    expect(setRuleJoin(RULE, 'all', 'g1').conditions[1]).toMatchObject({ join: 'all' })
  })

  it('keeps a test and a value only where the new field allows them', () => {
    // Same kind and currency, the test allowed: both stay.
    expect(findRuleCondition(setConditionField(RULE, 'c1', 'total', FIELDS), 'c1')).toMatchObject({
      field: 'total',
      operator: 'gt',
      value: '500',
    })
    // Another kind: the value goes; the test stays when allowed.
    expect(findRuleCondition(setConditionField(RULE, 'c1', 'count', FIELDS), 'c1')).toMatchObject({
      field: 'count',
      operator: 'gt',
      value: null,
    })
    // A choice the new field does not offer: the value goes; a test it lacks: none.
    expect(findRuleCondition(setConditionField(RULE, 'c2', 'channel', FIELDS), 'c2')).toMatchObject(
      { field: 'channel', operator: 'eq', value: null },
    )
    expect(findRuleCondition(setConditionField(RULE, 'c1', 'kind', FIELDS), 'c1')).toMatchObject({
      operator: null,
      value: null,
    })
    expect(findRuleCondition(setConditionField(RULE, 'c1', null, FIELDS), 'c1')).toMatchObject({
      field: null,
      operator: null,
      value: null,
    })
  })

  it('clears the value for a test that takes none, and sets values', () => {
    expect(
      findRuleCondition(setConditionOperator(RULE, 'c3', 'empty', OPERATORS), 'c3'),
    ).toMatchObject({ operator: 'empty', value: null })
    expect(
      findRuleCondition(setConditionOperator(RULE, 'c1', 'eq', OPERATORS), 'c1'),
    ).toMatchObject({ operator: 'eq', value: '500' })
    expect(findRuleCondition(setConditionValue(RULE, 'c3', '10'), 'c3')?.value).toBe('10')
  })

  it('starts another kind of action with no parameters', () => {
    expect(setRuleActionType(RULE, 'a1', 'tag').actions[0]).toEqual({
      id: 'a1',
      type: 'tag',
      params: {},
    })
    expect(setRuleActionType(RULE, 'a1', 'notify').actions[0]?.params).toEqual({
      who: 'ana',
      note: null,
    })
    expect(setRuleActionParam(RULE, 'a2', 'tag', 'Urgent').actions[1]?.params).toEqual({
      tag: 'Urgent',
    })
  })

  it('lists a field’s tests in its order', () => {
    expect(operatorsFor(FIELDS[2], OPERATORS).map((each) => each.id)).toEqual(['gt', 'empty'])
    expect(operatorsFor(undefined, OPERATORS)).toEqual([])
  })
})

describe('ruleValueText', () => {
  const format = createFormat('sr-Latn-RS')
  it('writes values through format by their kind, "—" when not given', () => {
    expect(ruleValueText(format, 'money', '500000', undefined, 'RSD')).toContain('500.000,00')
    expect(ruleValueText(format, 'number', '3.5')).toBe('3,5')
    expect(ruleValueText(format, 'date', '2026-10-14')).toContain('14.10.2026')
    expect(ruleValueText(format, 'choice', 'goods', FIELDS[3]?.options)).toBe('Goods')
    expect(ruleValueText(format, 'choice', 'other', FIELDS[3]?.options)).toBe('—')
    expect(ruleValueText(format, 'text', 'Large')).toBe('Large')
    expect(ruleValueText(format, 'text', null)).toBe('—')
    expect(ruleValueText(format, 'text', '')).toBe('—')
  })
})

describe('RuleBuilder', () => {
  const render = (node: React.ReactNode) =>
    renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
  const common = {
    label: 'Rule',
    triggers: TRIGGERS,
    fields: FIELDS,
    operators: OPERATORS,
    actionTypes: ACTIONS,
  }

  it('shows the rule as text when read-only, with the summary', () => {
    const html = render(
      <RuleBuilder {...common} value={RULE} readOnly summary="When a bill is posted…" />,
    )
    expect(html).toContain('In words')
    expect(html).toContain('When a bill is posted…')
    expect(html).toContain('A bill is posted')
    expect(html).toContain('Any of these')
    expect(html).toContain('Ana Ward')
    expect(html).not.toContain('Add condition')
  })

  it('shows a read-only rule as text, even with onChange', () => {
    const html = render(
      <RuleBuilder {...common} value={RULE} onChange={() => undefined} readOnly />,
    )
    expect(html).not.toContain('Add action')
  })

  it('offers the test only once the condition has a field', () => {
    const html = render(
      <RuleBuilder
        {...common}
        value={{
          ...RULE,
          conditions: [{ kind: 'condition', id: 'c9', field: null, operator: null, value: null }],
        }}
        onChange={() => undefined}
        layout="desktop"
      />,
    )
    expect(html).not.toContain('>Test<')
  })

  it('edits: the blocks, the tools named with their item, the problems under their fields', () => {
    const html = render(
      <RuleBuilder
        {...common}
        value={RULE}
        onChange={() => undefined}
        layout="desktop"
        problems={{
          trigger: 'Choose what starts the rule.',
          [ruleProblemKey('c3', 'value')]: 'Enter a number above 0.',
          actions: 'Two actions notify the same person.',
        }}
      />,
    )
    expect(html).toContain('>When<')
    expect(html).toContain('>If<')
    expect(html).toContain('>Then<')
    expect(html).toContain('Conditions to meet')
    expect(html).toContain('In this group')
    expect(html).toContain('aria-label="Move down: Condition 1"')
    expect(html).not.toContain('aria-label="Move up: Condition 1"')
    expect(html).toContain('aria-label="Remove: Group 1"')
    expect(html).toContain('aria-label="Move up: Action 2"')
    expect(html).toContain('Choose what starts the rule.')
    expect(html).toContain('Enter a number above 0.')
    expect(html).toContain('Two actions notify the same person.')
    expect(html).toContain('Add condition to the group')
  })

  it('says when there are no conditions and no actions, and shows skeletons while loading', () => {
    const empty = render(
      <RuleBuilder {...common} value={emptyRuleDraft()} onChange={() => undefined} />,
    )
    expect(empty).toContain('No conditions: the rule runs every time.')
    expect(empty).toContain('No actions yet.')
    expect(empty).not.toContain('Conditions to meet')
    const loading = render(<RuleBuilder {...common} value={RULE} loading />)
    expect(loading).toContain('aria-busy="true"')
  })
})

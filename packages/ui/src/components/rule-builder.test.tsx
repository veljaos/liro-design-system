import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { createFormat } from '../provider/format'
import { RuleBuilder, ruleValueText } from './rule-builder'
import {
  addRuleAction,
  addRuleBranch,
  addRuleCondition,
  addRuleGroup,
  addRuleOtherwise,
  emptyRuleDraft,
  findRuleCondition,
  focusAfterRemove,
  moveRuleItem,
  moveRuleItemTo,
  nextRuleId,
  operatorsFor,
  removeRuleItem,
  RULE_OTHERWISE,
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

/**
 * A rule: if amount over 500 and a group (kind is goods, or lines more than 3), notify Ana and
 * tag it; else if the due date is empty, tag it "No due date"; else nothing.
 */
const RULE: RuleDraft = {
  trigger: 'posted',
  branches: [
    {
      id: 'b1',
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
    },
    {
      id: 'b2',
      join: 'all',
      conditions: [{ kind: 'condition', id: 'c4', field: 'due', operator: 'empty', value: null }],
      actions: [{ id: 'a3', type: 'tag', params: { tag: 'No due date' } }],
    },
  ],
  otherwise: null,
}

/** The first branch ("If") of a draft. */
function first(draft: RuleDraft) {
  const branch = draft.branches[0]
  if (branch === undefined) throw new Error('no branch')
  return branch
}

describe('rule ids and places', () => {
  it('makes new ids above the highest of their prefix, in every branch', () => {
    expect(nextRuleId(RULE, 'c')).toBe('c5')
    expect(nextRuleId(RULE, 'g')).toBe('g2')
    expect(nextRuleId(RULE, 'a')).toBe('a4')
    expect(nextRuleId(RULE, 'b')).toBe('b3')
    expect(nextRuleId(emptyRuleDraft(), 'c')).toBe('c1')
    expect(emptyRuleDraft()).toEqual({
      trigger: null,
      branches: [{ id: 'b1', join: 'all', conditions: [], actions: [] }],
      otherwise: null,
    })
  })

  it('finds where an item stands', () => {
    expect(rulePlace(RULE, 'c1')).toEqual({
      list: 'conditions',
      branchId: 'b1',
      index: 0,
      length: 2,
    })
    expect(rulePlace(RULE, 'c3')).toEqual({
      list: 'group',
      branchId: 'b1',
      groupId: 'g1',
      index: 1,
      length: 2,
    })
    expect(rulePlace(RULE, 'a3')).toEqual({ list: 'actions', branchId: 'b2', index: 0, length: 1 })
    expect(rulePlace(RULE, 'b2')).toEqual({ list: 'branches', index: 1, length: 2 })
    expect(rulePlace(RULE, 'x')).toBeUndefined()
    expect(findRuleCondition(RULE, 'c4')?.field).toBe('due')
    expect(findRuleCondition(RULE, 'g1')).toBeUndefined()
  })

  it('counts the conditions of every branch, those in groups included', () => {
    expect(ruleConditionCount(RULE)).toBe(4)
    expect(ruleConditionCount(emptyRuleDraft())).toBe(0)
  })

  it('keys problems by item and part', () => {
    expect(ruleProblemKey('c2', 'value')).toBe('c2.value')
  })
})

describe('adding, moving and removing', () => {
  it('adds a condition to a branch or a group, and a group with one condition', () => {
    const top = addRuleCondition(RULE)
    expect(top.id).toBe('c5')
    expect(first(top.draft).conditions.at(-1)).toEqual({
      kind: 'condition',
      id: 'c5',
      field: null,
      operator: null,
      value: null,
    })
    expect(rulePlace(addRuleCondition(RULE, 'b2').draft, 'c5')).toMatchObject({
      branchId: 'b2',
      index: 1,
    })
    const inside = addRuleCondition(RULE, 'g1')
    expect(rulePlace(inside.draft, inside.id)).toMatchObject({ list: 'group', index: 2 })
    const group = addRuleGroup(RULE, 'b2')
    expect(group.id).toBe('g2')
    expect(group.conditionId).toBe('c5')
    expect(group.draft.branches[1]?.conditions.at(-1)).toMatchObject({ kind: 'group', join: 'any' })
    const action = addRuleAction(RULE)
    expect(action.id).toBe('a4')
    expect(first(action.draft).actions.at(-1)).toEqual({ id: 'a4', type: null, params: {} })
  })

  it('adds Else if with one condition, and Else with one action (once)', () => {
    const branch = addRuleBranch(RULE)
    expect(branch.id).toBe('b3')
    expect(branch.draft.branches.at(-1)).toMatchObject({
      id: 'b3',
      join: 'all',
      conditions: [{ id: branch.conditionId }],
      actions: [],
    })
    const otherwise = addRuleOtherwise(RULE)
    expect(otherwise.draft.otherwise).toEqual([{ id: 'a4', type: null, params: {} }])
    expect(addRuleOtherwise(otherwise.draft).draft).toBe(otherwise.draft)
    const more = addRuleAction(otherwise.draft, RULE_OTHERWISE)
    expect(more.draft.otherwise?.map((each) => each.id)).toEqual(['a4', 'a5'])
  })

  it('moves an item within its own list, never past its ends; If stays first', () => {
    expect(first(moveRuleItem(RULE, 'g1', -1)).conditions.map((each) => each.id)).toEqual([
      'g1',
      'c1',
    ])
    expect(moveRuleItem(RULE, 'c1', -1)).toEqual(RULE)
    const inGroup = first(moveRuleItem(RULE, 'c3', -1)).conditions[1]
    expect(inGroup?.kind === 'group' ? inGroup.items.map((each) => each.id) : []).toEqual([
      'c3',
      'c2',
    ])
    expect(first(moveRuleItem(RULE, 'a1', 1)).actions.map((each) => each.id)).toEqual(['a2', 'a1'])
    expect(moveRuleItem(RULE, 'x', 1)).toBe(RULE)
    expect(moveRuleItem(RULE, 'b2', -1)).toBe(RULE)
    const three = addRuleBranch(RULE).draft
    expect(moveRuleItem(three, 'b3', -1).branches.map((each) => each.id)).toEqual([
      'b1',
      'b3',
      'b2',
    ])
    // A drag lands at an index counted without the item.
    expect(first(moveRuleItemTo(RULE, 'a1', 1)).actions.map((each) => each.id)).toEqual([
      'a2',
      'a1',
    ])
    const elsewhere = addRuleAction(addRuleOtherwise(RULE).draft, RULE_OTHERWISE).draft
    expect(moveRuleItemTo(elsewhere, 'a5', 0).otherwise?.map((each) => each.id)).toEqual([
      'a5',
      'a4',
    ])
  })

  it('removes items, branches and Else; an emptied group goes with its last condition', () => {
    expect(first(removeRuleItem(RULE, 'c1')).conditions.map((each) => each.id)).toEqual(['g1'])
    expect(first(removeRuleItem(RULE, 'g1')).conditions.map((each) => each.id)).toEqual(['c1'])
    expect(first(removeRuleItem(RULE, 'a1')).actions.map((each) => each.id)).toEqual(['a2'])
    const once = removeRuleItem(RULE, 'c2')
    expect(ruleConditionCount(once)).toBe(3)
    expect(first(removeRuleItem(once, 'c3')).conditions.map((each) => each.id)).toEqual(['c1'])
    expect(removeRuleItem(RULE, 'b2').branches.map((each) => each.id)).toEqual(['b1'])
    expect(removeRuleItem(RULE, 'b1')).toBe(RULE)
    expect(removeRuleItem(addRuleOtherwise(RULE).draft, RULE_OTHERWISE).otherwise).toBeNull()
    const withElse = addRuleOtherwise(RULE).draft
    expect(removeRuleItem(withElse, 'a4').otherwise).toEqual([])
  })

  it('says where the focus goes after a removal', () => {
    expect(focusAfterRemove(0, 3)).toBe(0)
    expect(focusAfterRemove(2, 3)).toBe(1)
    expect(focusAfterRemove(0, 1)).toBeUndefined()
  })
})

describe('editing conditions and actions', () => {
  it('sets the joins of a branch and of a group', () => {
    expect(first(setRuleJoin(RULE, 'any')).join).toBe('any')
    expect(setRuleJoin(RULE, 'any', 'b2').branches[1]?.join).toBe('any')
    expect(first(setRuleJoin(RULE, 'all', 'g1')).conditions[1]).toMatchObject({ join: 'all' })
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
    expect(findRuleCondition(setConditionField(RULE, 'c4', null, FIELDS), 'c4')).toMatchObject({
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

  it('starts another kind of action with no parameters, in any branch and in Else', () => {
    expect(first(setRuleActionType(RULE, 'a1', 'tag')).actions[0]).toEqual({
      id: 'a1',
      type: 'tag',
      params: {},
    })
    expect(first(setRuleActionType(RULE, 'a1', 'notify')).actions[0]?.params).toEqual({
      who: 'ana',
      note: null,
    })
    expect(setRuleActionParam(RULE, 'a3', 'tag', 'Urgent').branches[1]?.actions[0]?.params).toEqual(
      { tag: 'Urgent' },
    )
    const withElse = addRuleOtherwise(RULE).draft
    expect(setRuleActionType(withElse, 'a4', 'tag').otherwise?.[0]?.type).toBe('tag')
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
    expect(html).toContain('>Else if<')
    expect(html).toContain('No due date')
    expect(html).not.toContain('Add condition')
    const withElse = render(
      <RuleBuilder {...common} value={addRuleOtherwise(RULE).draft} readOnly />,
    )
    expect(withElse).toContain('>Else<')
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
          branches: [
            {
              ...first(RULE),
              conditions: [
                { kind: 'condition', id: 'c9', field: null, operator: null, value: null },
              ],
            },
          ],
        }}
        onChange={() => undefined}
        layout="desktop"
      />,
    )
    expect(html).toContain('Condition 1: field')
    expect(html).toContain('Choose a field')
    expect(html).not.toContain('Condition 1: test')
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
    expect(html).toContain('>Else if<')
    expect(html).toContain('Conditions to meet')
    expect(html).toContain('In this group')
    // Each pill is named in full; no "Field / Test / Value" labels on the screen.
    expect(html).toContain('Condition 1: field')
    expect(html).toContain('Condition 1: test')
    expect(html).toContain('Condition 1: value')
    expect(html).toContain('Group 1, condition 2: value')
    expect(html).toContain('Action 3: action')
    expect(html).not.toContain('>Field<')
    // One menu per item, named with it; conditions, groups and actions drag within their list.
    expect(html).toContain('aria-label="Options: Condition 1"')
    expect(html).toContain('aria-label="Options: Group 1"')
    expect(html).toContain('aria-label="Options: Action 2"')
    expect(html).toContain('aria-label="Options: Else if 1"')
    expect(html).not.toContain('aria-label="Options: If"')
    expect(html).toContain('data-drop-zone="b1:conditions"')
    expect(html).toContain('data-drop-zone="g1:group"')
    expect(html).toContain('data-drop-zone="b2:actions"')
    expect(html).toContain('data-drop-item="a1"')
    expect(html).toContain('Add Else if')
    expect(html).toContain('Add Else')
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

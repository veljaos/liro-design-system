/*
 * The pure logic of RuleBuilder (P5.78): a rule as data — "When this happens, if these
 * conditions hold, do these actions" — and the edits the builder makes to it. The library never
 * evaluates a rule: the triggers, the fields a condition can test, the tests, the values' kinds,
 * the actions and their parameters are the application's, and so is every check of the result.
 * - A condition tests one field with one test (operator) against one value. A value is a string:
 *   a decimal string for numbers and amounts, YYYY-MM-DD for dates, an option's value for a
 *   choice, or text; `null` while it is not given.
 * - The conditions stand in one list joined by "all" or "any"; a group is a list of conditions
 *   with its own join, one level deep ("all of: A, and any of: B, C").
 * - Ids of new items are made from the draft (`nextRuleId`): "c1", "g1", "a1", never reused.
 */

/** How the conditions of a list are joined: every one holds, or at least one. */
export type RuleJoin = 'all' | 'any'

/** The kinds of values a condition or an action's parameter takes. */
export type RuleValueKind = 'text' | 'longText' | 'number' | 'money' | 'date' | 'choice'

/** One choice of a field's or a parameter's list, from the application. */
export interface RuleChoice {
  value: string
  label: string
  /** Choices with the same group are listed together under it. */
  group?: string
}

/** What starts a rule ("An incoming invoice is posted"), from the application. */
export interface RuleTrigger {
  id: string
  label: string
  /** Triggers with the same group are listed together under it ("Purchasing"). */
  group?: string
}

/** A test a condition makes ("is more than", "is empty"), from the application. */
export interface RuleOperator {
  id: string
  label: string
  /** The test needs no value ("is empty"). */
  noValue?: boolean
}

/** A field a condition can test, from the application (it may differ by the trigger). */
export interface RuleField {
  id: string
  label: string
  group?: string
  kind: Exclude<RuleValueKind, 'longText'>
  /** The ids of the tests this field allows, in the application's order. */
  operators: readonly string[]
  /** The choices of a 'choice' field. */
  options?: readonly RuleChoice[]
  /** The currency of a 'money' field ("RSD"). */
  currency?: string
}

/** One parameter of an action ("Who", "Message"), from the application. */
export interface RuleActionParam {
  id: string
  label: string
  kind: RuleValueKind
  options?: readonly RuleChoice[]
  currency?: string
  required?: boolean
  /** A hint under the field. */
  description?: string
}

/** An action a rule can take ("Notify a person"), with its parameters, from the application. */
export interface RuleActionType {
  id: string
  label: string
  group?: string
  params: readonly RuleActionParam[]
}

/** One condition of a rule. */
export interface RuleCondition {
  kind: 'condition'
  id: string
  field: string | null
  operator: string | null
  value: string | null
}

/** A group of conditions with its own join. */
export interface RuleConditionGroup {
  kind: 'group'
  id: string
  join: RuleJoin
  items: readonly RuleCondition[]
}

export type RuleConditionItem = RuleCondition | RuleConditionGroup

/** One action of a rule: its kind and its parameters' values. */
export interface RuleAction {
  id: string
  type: string | null
  params: Readonly<Record<string, string | null>>
}

/** A rule as the builder edits it and reports it. */
export interface RuleDraft {
  trigger: string | null
  join: RuleJoin
  conditions: readonly RuleConditionItem[]
  actions: readonly RuleAction[]
}

/** A new rule: nothing chosen, no conditions, no actions. */
export function emptyRuleDraft(): RuleDraft {
  return { trigger: null, join: 'all', conditions: [], actions: [] }
}

/** Every id in the draft: conditions, groups and actions. */
function ruleIds(draft: RuleDraft): string[] {
  const ids: string[] = []
  for (const item of draft.conditions) {
    ids.push(item.id)
    if (item.kind === 'group') ids.push(...item.items.map((each) => each.id))
  }
  ids.push(...draft.actions.map((each) => each.id))
  return ids
}

/** A new id with the prefix ("c", "g", "a"), one above the highest of that prefix in the draft. */
export function nextRuleId(draft: RuleDraft, prefix: string): string {
  let highest = 0
  for (const id of ruleIds(draft)) {
    if (!id.startsWith(prefix)) continue
    const rest = id.slice(prefix.length)
    if (/^\d+$/.test(rest)) highest = Math.max(highest, Number(rest))
  }
  return `${prefix}${String(highest + 1)}`
}

/** The key of a problem the application reports for one part of an item ("c2.value"). */
export function ruleProblemKey(id: string, part: string): string {
  return `${id}.${part}`
}

/** How many conditions the rule has, those in groups included. */
export function ruleConditionCount(draft: RuleDraft): number {
  return draft.conditions.reduce(
    (count, item) => count + (item.kind === 'group' ? item.items.length : 1),
    0,
  )
}

function emptyCondition(id: string): RuleCondition {
  return { kind: 'condition', id, field: null, operator: null, value: null }
}

/** A new empty condition at the end of the rule, or of the group `groupId`. */
export function addRuleCondition(
  draft: RuleDraft,
  groupId?: string,
): { draft: RuleDraft; id: string } {
  const id = nextRuleId(draft, 'c')
  const condition = emptyCondition(id)
  if (groupId === undefined) {
    return { draft: { ...draft, conditions: [...draft.conditions, condition] }, id }
  }
  return {
    draft: {
      ...draft,
      conditions: draft.conditions.map((item) =>
        item.kind === 'group' && item.id === groupId
          ? { ...item, items: [...item.items, condition] }
          : item,
      ),
    },
    id,
  }
}

/** A new group, joined by "any", with one empty condition, at the end of the rule. */
export function addRuleGroup(draft: RuleDraft): {
  draft: RuleDraft
  id: string
  conditionId: string
} {
  const id = nextRuleId(draft, 'g')
  const conditionId = nextRuleId(draft, 'c')
  const group: RuleConditionGroup = {
    kind: 'group',
    id,
    join: 'any',
    items: [emptyCondition(conditionId)],
  }
  return { draft: { ...draft, conditions: [...draft.conditions, group] }, id, conditionId }
}

/** A new action, nothing chosen, at the end. */
export function addRuleAction(draft: RuleDraft): { draft: RuleDraft; id: string } {
  const id = nextRuleId(draft, 'a')
  return { draft: { ...draft, actions: [...draft.actions, { id, type: null, params: {} }] }, id }
}

/** Where an item stands: its list (the rule's conditions, a group's, the actions) and index. */
export interface RulePlace {
  list: 'conditions' | 'group' | 'actions'
  /** The group's id, for a condition inside one. */
  groupId?: string
  index: number
  length: number
}

/** Where the item with the id stands, or undefined. */
export function rulePlace(draft: RuleDraft, id: string): RulePlace | undefined {
  const top = draft.conditions.findIndex((item) => item.id === id)
  if (top >= 0) return { list: 'conditions', index: top, length: draft.conditions.length }
  for (const item of draft.conditions) {
    if (item.kind !== 'group') continue
    const index = item.items.findIndex((each) => each.id === id)
    if (index >= 0) return { list: 'group', groupId: item.id, index, length: item.items.length }
  }
  const action = draft.actions.findIndex((each) => each.id === id)
  if (action >= 0) return { list: 'actions', index: action, length: draft.actions.length }
  return undefined
}

function moveIn<T>(list: readonly T[], index: number, delta: -1 | 1): readonly T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  const [item] = next.splice(index, 1)
  if (item !== undefined) next.splice(target, 0, item)
  return next
}

/** The item moved one place earlier (−1) or later (+1) within its own list; at an end, unchanged. */
export function moveRuleItem(draft: RuleDraft, id: string, delta: -1 | 1): RuleDraft {
  const place = rulePlace(draft, id)
  if (place === undefined) return draft
  if (place.list === 'actions') {
    return { ...draft, actions: moveIn(draft.actions, place.index, delta) }
  }
  if (place.list === 'conditions') {
    return { ...draft, conditions: moveIn(draft.conditions, place.index, delta) }
  }
  return {
    ...draft,
    conditions: draft.conditions.map((item) =>
      item.kind === 'group' && item.id === place.groupId
        ? { ...item, items: moveIn(item.items, place.index, delta) }
        : item,
    ),
  }
}

/**
 * The item removed: a condition, a group with its conditions, or an action. A group whose last
 * condition is removed goes with it.
 */
export function removeRuleItem(draft: RuleDraft, id: string): RuleDraft {
  const conditions: RuleConditionItem[] = []
  for (const item of draft.conditions) {
    if (item.id === id) continue
    if (item.kind === 'group') {
      const items = item.items.filter((each) => each.id !== id)
      if (items.length === 0) continue
      conditions.push(items.length === item.items.length ? item : { ...item, items })
    } else {
      conditions.push(item)
    }
  }
  return { ...draft, conditions, actions: draft.actions.filter((each) => each.id !== id) }
}

/**
 * Which item takes the focus after the item at `index` of a list of `length` is removed: the one
 * that moves into its place, else the one before it, else none (the list is empty).
 */
export function focusAfterRemove(index: number, length: number): number | undefined {
  if (length <= 1) return undefined
  return index < length - 1 ? index : index - 1
}

/**
 * Which of an item's two move buttons keeps the focus after a move: the one pressed, unless the
 * item now stands at that end of its list (the button is gone), then the other.
 */
export function moveFocusTarget(index: number, length: number, delta: -1 | 1): 'up' | 'down' {
  const target = Math.min(Math.max(index + delta, 0), length - 1)
  if (delta === -1) return target === 0 ? 'down' : 'up'
  return target === length - 1 ? 'up' : 'down'
}

/** The join of the rule (`groupId` undefined) or of a group. */
export function setRuleJoin(draft: RuleDraft, join: RuleJoin, groupId?: string): RuleDraft {
  if (groupId === undefined) return { ...draft, join }
  return {
    ...draft,
    conditions: draft.conditions.map((item) =>
      item.kind === 'group' && item.id === groupId ? { ...item, join } : item,
    ),
  }
}

function updateCondition(
  draft: RuleDraft,
  id: string,
  change: (condition: RuleCondition) => RuleCondition,
): RuleDraft {
  return {
    ...draft,
    conditions: draft.conditions.map((item) => {
      if (item.kind === 'condition') return item.id === id ? change(item) : item
      if (!item.items.some((each) => each.id === id)) return item
      return { ...item, items: item.items.map((each) => (each.id === id ? change(each) : each)) }
    }),
  }
}

/** The condition with the id, wherever it stands. */
export function findRuleCondition(draft: RuleDraft, id: string): RuleCondition | undefined {
  for (const item of draft.conditions) {
    if (item.kind === 'condition' && item.id === id) return item
    if (item.kind === 'group') {
      const found = item.items.find((each) => each.id === id)
      if (found !== undefined) return found
    }
  }
  return undefined
}

/**
 * The condition tests another field: its test stays when the new field allows it, otherwise none
 * is chosen; its value stays only when the new field takes the same kind of value (and, for a
 * choice, still offers it).
 */
export function setConditionField(
  draft: RuleDraft,
  id: string,
  fieldId: string | null,
  fields: readonly RuleField[],
): RuleDraft {
  return updateCondition(draft, id, (condition) => {
    const before = fields.find((each) => each.id === condition.field)
    const after = fields.find((each) => each.id === fieldId)
    const operator =
      after !== undefined &&
      condition.operator !== null &&
      after.operators.includes(condition.operator)
        ? condition.operator
        : null
    const sameKind = after !== undefined && before?.kind === after.kind
    const stillOffered =
      after?.kind !== 'choice' ||
      (after.options ?? []).some((option) => option.value === condition.value)
    const sameCurrency = after?.kind !== 'money' || before?.currency === after.currency
    const value = sameKind && stillOffered && sameCurrency ? condition.value : null
    return { ...condition, field: fieldId, operator, value }
  })
}

/** The condition's test; a test without a value clears the value. */
export function setConditionOperator(
  draft: RuleDraft,
  id: string,
  operatorId: string | null,
  operators: readonly RuleOperator[],
): RuleDraft {
  const operator = operators.find((each) => each.id === operatorId)
  return updateCondition(draft, id, (condition) => ({
    ...condition,
    operator: operatorId,
    value: operator?.noValue === true ? null : condition.value,
  }))
}

/** The condition's value (null: not given). */
export function setConditionValue(draft: RuleDraft, id: string, value: string | null): RuleDraft {
  return updateCondition(draft, id, (condition) => ({ ...condition, value }))
}

/** The action's kind; another kind starts with no parameters given. */
export function setRuleActionType(draft: RuleDraft, id: string, type: string | null): RuleDraft {
  return {
    ...draft,
    actions: draft.actions.map((each) =>
      each.id === id ? { ...each, type, params: each.type === type ? each.params : {} } : each,
    ),
  }
}

/** One parameter of the action (null: not given). */
export function setRuleActionParam(
  draft: RuleDraft,
  id: string,
  param: string,
  value: string | null,
): RuleDraft {
  return {
    ...draft,
    actions: draft.actions.map((each) =>
      each.id === id ? { ...each, params: { ...each.params, [param]: value } } : each,
    ),
  }
}

/** The tests a field allows, in the field's order; none until a field is chosen. */
export function operatorsFor(
  field: RuleField | undefined,
  operators: readonly RuleOperator[],
): RuleOperator[] {
  if (field === undefined) return []
  return field.operators.flatMap((id) => operators.filter((each) => each.id === id))
}

/*
 * The pure logic of RuleBuilder: a rule as data — "When this happens, if these
 * conditions hold, do these actions" — and the edits the builder makes to it. The library never
 * evaluates a rule: the triggers, the fields a condition can test, the tests, the values' kinds,
 * the actions and their parameters are the application's, and so is every check of the result.
 * - A condition tests one field with one test (operator) against one value. A value is a string:
 *   a decimal string for numbers and amounts, YYYY-MM-DD for dates, an option's value for a
 *   choice, or text; `null` while it is not given.
 * - A rule has branches: "If" and each "Else if", tried in order, each its
 *   conditions and its actions, then optionally "Else" with actions of its own. In a branch the
 *   conditions stand in one list joined by "all" or "any"; a group is a list of conditions with
 *   its own join, one level deep ("all of: A, and any of: B, C").
 * - Ids of new items are made from the draft (`nextRuleId`): "b1", "c1", "g1", "a1", never
 *   reused.
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

/**
 * One branch of a rule: its conditions joined by "all" or "any" and the actions
 * taken when they hold. The rule's first branch is "If", the others "Else if", tried in order.
 */
export interface RuleBranch {
  id: string
  join: RuleJoin
  conditions: readonly RuleConditionItem[]
  actions: readonly RuleAction[]
}

/**
 * A rule as the builder edits it and reports it (branches): when the trigger
 * happens, the first branch whose conditions hold takes its actions; when none holds, the
 * `otherwise` ("Else") actions are taken. The application evaluates; the library never does.
 */
export interface RuleDraft {
  trigger: string | null
  /** "If", then each "Else if", in order. At least one. */
  branches: readonly RuleBranch[]
  /** "Else": the actions when no branch holds; null when the rule has no Else. */
  otherwise: readonly RuleAction[] | null
}

/** The id that names the Else block, where an action list or a removal needs one. */
export const RULE_OTHERWISE = 'else'

function emptyBranch(id: string): RuleBranch {
  return { id, join: 'all', conditions: [], actions: [] }
}

/** A new rule: nothing chosen, one "If" without conditions or actions, no Else. */
export function emptyRuleDraft(): RuleDraft {
  return { trigger: null, branches: [emptyBranch('b1')], otherwise: null }
}

/** Every id in the draft: branches, conditions, groups and actions. */
function ruleIds(draft: RuleDraft): string[] {
  const ids: string[] = []
  for (const branch of draft.branches) {
    ids.push(branch.id)
    for (const item of branch.conditions) {
      ids.push(item.id)
      if (item.kind === 'group') ids.push(...item.items.map((each) => each.id))
    }
    ids.push(...branch.actions.map((each) => each.id))
  }
  ids.push(...(draft.otherwise ?? []).map((each) => each.id))
  return ids
}

/** A new id with the prefix ("b", "c", "g", "a"), one above the highest of that prefix. */
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

/** How many conditions the rule has, in every branch, those in groups included. */
export function ruleConditionCount(draft: RuleDraft): number {
  return draft.branches.reduce(
    (count, branch) =>
      count +
      branch.conditions.reduce(
        (inner, item) => inner + (item.kind === 'group' ? item.items.length : 1),
        0,
      ),
    0,
  )
}

function emptyCondition(id: string): RuleCondition {
  return { kind: 'condition', id, field: null, operator: null, value: null }
}

function mapBranches(draft: RuleDraft, change: (branch: RuleBranch) => RuleBranch): RuleDraft {
  return { ...draft, branches: draft.branches.map(change) }
}

/**
 * A new empty condition at the end of a branch or of a group (`containerId`: a branch's or a
 * group's id; default the first branch, "If").
 */
export function addRuleCondition(
  draft: RuleDraft,
  containerId?: string,
): { draft: RuleDraft; id: string } {
  const id = nextRuleId(draft, 'c')
  const condition = emptyCondition(id)
  const target = containerId ?? draft.branches[0]?.id
  return {
    draft: mapBranches(draft, (branch) => {
      if (branch.id === target) return { ...branch, conditions: [...branch.conditions, condition] }
      if (!branch.conditions.some((item) => item.kind === 'group' && item.id === target)) {
        return branch
      }
      return {
        ...branch,
        conditions: branch.conditions.map((item) =>
          item.kind === 'group' && item.id === target
            ? { ...item, items: [...item.items, condition] }
            : item,
        ),
      }
    }),
    id,
  }
}

/** A new group, joined by "any", with one empty condition, at the end of a branch (default If). */
export function addRuleGroup(
  draft: RuleDraft,
  branchId?: string,
): { draft: RuleDraft; id: string; conditionId: string } {
  const id = nextRuleId(draft, 'g')
  const conditionId = nextRuleId(draft, 'c')
  const group: RuleConditionGroup = {
    kind: 'group',
    id,
    join: 'any',
    items: [emptyCondition(conditionId)],
  }
  const target = branchId ?? draft.branches[0]?.id
  return {
    draft: mapBranches(draft, (branch) =>
      branch.id === target ? { ...branch, conditions: [...branch.conditions, group] } : branch,
    ),
    id,
    conditionId,
  }
}

/**
 * A new action, nothing chosen, at the end of a branch's Then (default If) or of Else
 * (`RULE_OTHERWISE`, which it starts when the rule has none).
 */
export function addRuleAction(
  draft: RuleDraft,
  branchId?: string,
): { draft: RuleDraft; id: string } {
  const id = nextRuleId(draft, 'a')
  const action: RuleAction = { id, type: null, params: {} }
  if (branchId === RULE_OTHERWISE) {
    return { draft: { ...draft, otherwise: [...(draft.otherwise ?? []), action] }, id }
  }
  const target = branchId ?? draft.branches[0]?.id
  return {
    draft: mapBranches(draft, (branch) =>
      branch.id === target ? { ...branch, actions: [...branch.actions, action] } : branch,
    ),
    id,
  }
}

/** A new "Else if" after the last branch, with one empty condition. */
export function addRuleBranch(draft: RuleDraft): {
  draft: RuleDraft
  id: string
  conditionId: string
} {
  const id = nextRuleId(draft, 'b')
  const conditionId = nextRuleId(draft, 'c')
  const branch: RuleBranch = { ...emptyBranch(id), conditions: [emptyCondition(conditionId)] }
  return { draft: { ...draft, branches: [...draft.branches, branch] }, id, conditionId }
}

/** "Else" with one empty action; a rule that has one keeps it. */
export function addRuleOtherwise(draft: RuleDraft): { draft: RuleDraft; id: string } {
  const first = draft.otherwise?.[0]
  if (first !== undefined) return { draft, id: first.id }
  return addRuleAction(draft, RULE_OTHERWISE)
}

/**
 * Where an item stands: its list (a branch's conditions, a group's, a branch's or Else's
 * actions, or the branches themselves) and its index.
 */
export interface RulePlace {
  list: 'conditions' | 'group' | 'actions' | 'branches'
  /** The branch the list belongs to (RULE_OTHERWISE for Else's actions). */
  branchId?: string
  /** The group's id, for a condition inside one. */
  groupId?: string
  index: number
  length: number
}

/** Where the item with the id stands, or undefined. */
export function rulePlace(draft: RuleDraft, id: string): RulePlace | undefined {
  const branchIndex = draft.branches.findIndex((branch) => branch.id === id)
  if (branchIndex >= 0) {
    return { list: 'branches', index: branchIndex, length: draft.branches.length }
  }
  for (const branch of draft.branches) {
    const top = branch.conditions.findIndex((item) => item.id === id)
    if (top >= 0) {
      return {
        list: 'conditions',
        branchId: branch.id,
        index: top,
        length: branch.conditions.length,
      }
    }
    for (const item of branch.conditions) {
      if (item.kind !== 'group') continue
      const index = item.items.findIndex((each) => each.id === id)
      if (index >= 0) {
        return {
          list: 'group',
          branchId: branch.id,
          groupId: item.id,
          index,
          length: item.items.length,
        }
      }
    }
    const action = branch.actions.findIndex((each) => each.id === id)
    if (action >= 0) {
      return { list: 'actions', branchId: branch.id, index: action, length: branch.actions.length }
    }
  }
  const otherwise = draft.otherwise ?? []
  const action = otherwise.findIndex((each) => each.id === id)
  if (action >= 0) {
    return { list: 'actions', branchId: RULE_OTHERWISE, index: action, length: otherwise.length }
  }
  return undefined
}

function moveTo<T>(list: readonly T[], from: number, to: number): readonly T[] {
  if (from < 0 || from >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  if (item === undefined) return list
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

/**
 * The item moved to `index` within its own list (counted without the item: where a drag lands);
 * the first branch ("If") stays first.
 */
export function moveRuleItemTo(draft: RuleDraft, id: string, index: number): RuleDraft {
  const place = rulePlace(draft, id)
  if (place === undefined || place.index === index) return draft
  if (place.list === 'branches') {
    if (place.index === 0 || index === 0) return draft
    return { ...draft, branches: moveTo(draft.branches, place.index, index) }
  }
  if (place.list === 'actions' && place.branchId === RULE_OTHERWISE) {
    return { ...draft, otherwise: moveTo(draft.otherwise ?? [], place.index, index) }
  }
  return mapBranches(draft, (branch) => {
    if (branch.id !== place.branchId) return branch
    if (place.list === 'actions') {
      return { ...branch, actions: moveTo(branch.actions, place.index, index) }
    }
    if (place.list === 'conditions') {
      return { ...branch, conditions: moveTo(branch.conditions, place.index, index) }
    }
    return {
      ...branch,
      conditions: branch.conditions.map((item) =>
        item.kind === 'group' && item.id === place.groupId
          ? { ...item, items: moveTo(item.items, place.index, index) }
          : item,
      ),
    }
  })
}

/** The item moved one place earlier (−1) or later (+1) within its own list; at an end, unchanged. */
export function moveRuleItem(draft: RuleDraft, id: string, delta: -1 | 1): RuleDraft {
  const place = rulePlace(draft, id)
  if (place === undefined) return draft
  const target = place.index + delta
  if (target < 0 || target >= place.length) return draft
  return moveRuleItemTo(draft, id, target)
}

/**
 * The item removed: a condition, a group with its conditions, an action, an "Else if" branch
 * with everything in it, or Else (`RULE_OTHERWISE`). A group whose last condition is removed goes
 * with it; the first branch ("If") stays.
 */
export function removeRuleItem(draft: RuleDraft, id: string): RuleDraft {
  if (id === RULE_OTHERWISE) return { ...draft, otherwise: null }
  if (draft.branches[0]?.id === id) return draft
  const branches = draft.branches
    .filter((branch) => branch.id !== id)
    .map((branch) => {
      const conditions: RuleConditionItem[] = []
      for (const item of branch.conditions) {
        if (item.id === id) continue
        if (item.kind === 'group') {
          const items = item.items.filter((each) => each.id !== id)
          if (items.length === 0) continue
          conditions.push(items.length === item.items.length ? item : { ...item, items })
        } else {
          conditions.push(item)
        }
      }
      return { ...branch, conditions, actions: branch.actions.filter((each) => each.id !== id) }
    })
  const otherwise =
    draft.otherwise === null ? null : draft.otherwise.filter((each) => each.id !== id)
  return { ...draft, branches, otherwise }
}

/**
 * Which item takes the focus after the item at `index` of a list of `length` is removed: the one
 * that moves into its place, else the one before it, else none (the list is empty).
 */
export function focusAfterRemove(index: number, length: number): number | undefined {
  if (length <= 1) return undefined
  return index < length - 1 ? index : index - 1
}

/** The join of a branch or of a group (`containerId`; default the first branch). */
export function setRuleJoin(draft: RuleDraft, join: RuleJoin, containerId?: string): RuleDraft {
  const target = containerId ?? draft.branches[0]?.id
  return mapBranches(draft, (branch) => {
    if (branch.id === target) return { ...branch, join }
    if (!branch.conditions.some((item) => item.id === target)) return branch
    return {
      ...branch,
      conditions: branch.conditions.map((item) =>
        item.kind === 'group' && item.id === target ? { ...item, join } : item,
      ),
    }
  })
}

function updateCondition(
  draft: RuleDraft,
  id: string,
  change: (condition: RuleCondition) => RuleCondition,
): RuleDraft {
  return mapBranches(draft, (branch) => ({
    ...branch,
    conditions: branch.conditions.map((item) => {
      if (item.kind === 'condition') return item.id === id ? change(item) : item
      if (!item.items.some((each) => each.id === id)) return item
      return { ...item, items: item.items.map((each) => (each.id === id ? change(each) : each)) }
    }),
  }))
}

/** The condition with the id, wherever it stands. */
export function findRuleCondition(draft: RuleDraft, id: string): RuleCondition | undefined {
  for (const branch of draft.branches) {
    for (const item of branch.conditions) {
      if (item.kind === 'condition' && item.id === id) return item
      if (item.kind === 'group') {
        const found = item.items.find((each) => each.id === id)
        if (found !== undefined) return found
      }
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
  return updateAction(draft, id, (each) => ({
    ...each,
    type,
    params: each.type === type ? each.params : {},
  }))
}

/** The action with the id changed, in whichever branch or in Else. */
function updateAction(
  draft: RuleDraft,
  id: string,
  change: (action: RuleAction) => RuleAction,
): RuleDraft {
  const map = (list: readonly RuleAction[]) =>
    list.map((each) => (each.id === id ? change(each) : each))
  return {
    ...mapBranches(draft, (branch) => ({ ...branch, actions: map(branch.actions) })),
    otherwise: draft.otherwise === null ? null : map(draft.otherwise),
  }
}

/** One parameter of the action (null: not given). */
export function setRuleActionParam(
  draft: RuleDraft,
  id: string,
  param: string,
  value: string | null,
): RuleDraft {
  return updateAction(draft, id, (each) => ({
    ...each,
    params: { ...each.params, [param]: value },
  }))
}

/** The tests a field allows, in the field's order; none until a field is chosen. */
export function operatorsFor(
  field: RuleField | undefined,
  operators: readonly RuleOperator[],
): RuleOperator[] {
  if (field === undefined) return []
  return field.operators.flatMap((id) => operators.filter((each) => each.id === id))
}

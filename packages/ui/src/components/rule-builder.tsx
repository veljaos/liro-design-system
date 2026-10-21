import { ArrowDown, ArrowUp, ListPlus, Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroFormat } from '../provider/format'
import { Button, CompactIconButton } from './button'
import { DateField } from './date-field'
import { FieldMessage } from './field'
import { MoneyField, NumberField } from './number-field'
import { Skeleton } from './progress'
import {
  addRuleAction,
  addRuleCondition,
  addRuleGroup,
  focusAfterRemove,
  moveFocusTarget,
  moveRuleItem,
  operatorsFor,
  removeRuleItem,
  ruleProblemKey,
  rulePlace,
  setConditionField,
  setConditionOperator,
  setConditionValue,
  setRuleActionParam,
  setRuleActionType,
  setRuleJoin,
  type RuleAction,
  type RuleActionType,
  type RuleChoice,
  type RuleCondition,
  type RuleConditionGroup,
  type RuleDraft,
  type RuleField,
  type RuleJoin,
  type RuleOperator,
  type RuleTrigger,
  type RuleValueKind,
} from './rule-builder-logic'
import { SelectField } from './select-field'
import { TextAreaField, TextField } from './text-field'
import { usePhone } from './use-phone'

/*
 * RuleBuilder (BUILD-PLAN P5.78): an automation rule as three blocks — When (what starts it), If
 * (the conditions), Then (the actions) — edited with the system's fields and buttons only, from
 * the keyboard, without dragging.
 * - Everything is the application's data: the triggers, the fields a condition can test (they may
 *   differ by the trigger: the application passes the fields of the chosen one), the tests
 *   (operators), the values' kinds and choices, the actions and their parameters. The builder
 *   reports the edited rule (`onChange`, a RuleDraft) and never evaluates it; the application
 *   checks it and returns its problems (`problems`, keyed 'trigger', 'conditions', 'actions' or
 *   `ruleProblemKey(id, part)`), shown under their fields. The rule in words (`summary`) is the
 *   application's too, shown above the blocks and announced politely as it changes.
 * - If: conditions joined by "All of these" / "Any of these" (the join is chosen once there are
 *   two); a group is a sunken box with its own join, one level deep. Each condition is a field, a
 *   test and a value (the value's field follows the field's kind: text, number, amount, date or a
 *   choice; a test such as "is empty" takes none). No conditions: the rule runs every time.
 * - Then: the actions in order, each its kind and its parameters' fields.
 * - Each condition, group and action names itself ("Condition 2") with its tools at the end of
 *   that line: Move up, Move down (only where it can move) and Remove, 28px icon buttons named
 *   with the item. The focus follows: a new item's first field, the moved item's button, after a
 *   removal the item that takes its place (or the add button).
 * - Read-only (`readOnly`, or `disabledReason` — the reason shown above): the same blocks as
 *   text, values through the provider's `format`. Loading: skeleton blocks.
 * - Phones (`layout`, default below 48em): every field on its own line; on a desktop a
 *   condition's three fields stand in one row when the builder is wide enough.
 */

export interface RuleBuilderProps {
  /** Names the builder for assistive technology ("Rule"). */
  label: string
  /** The rule being edited. */
  value: RuleDraft
  /** Reports every edit. Without it the builder is read-only. */
  onChange?: (draft: RuleDraft) => void
  triggers: readonly RuleTrigger[]
  /** The fields a condition can test (those of the chosen trigger). */
  fields: readonly RuleField[]
  operators: readonly RuleOperator[]
  actionTypes: readonly RuleActionType[]
  /** The rule in the application's words ("When an invoice is posted, if …, notify …"). */
  summary?: ReactNode
  /** The application's problems: 'trigger', 'conditions', 'actions' or `ruleProblemKey(id, part)`. */
  problems?: Readonly<Record<string, ReactNode>>
  /** Shows the rule as text. */
  readOnly?: boolean
  /** The rule cannot be changed, and why ("Only administrators change rules."): shown as text. */
  disabledReason?: ReactNode
  /** The application is loading the rule: skeleton blocks. */
  loading?: boolean
  /** The blocks' heading level. Default 3. */
  headingLevel?: 2 | 3 | 4
  /** 'phone' stacks every field; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

type Messages = ReturnType<typeof useLiro>['messages']

/** A value written for reading: through `format` by its kind; "—" when not given. */
export function ruleValueText(
  format: LiroFormat,
  kind: RuleValueKind,
  value: string | null | undefined,
  options?: readonly RuleChoice[],
  currency?: string,
): string {
  if (value === null || value === undefined || value === '') return '—'
  if (kind === 'number') return format.number(value)
  if (kind === 'money') return format.money(value, currency ?? '')
  if (kind === 'date') return format.date(value)
  if (kind === 'choice') return options?.find((each) => each.value === value)?.label ?? '—'
  return value
}

function choiceOptions(choices: readonly { value: string; label: string; group?: string }[]) {
  return choices.map((each) => ({
    value: each.value,
    label: each.label,
    ...(each.group === undefined ? {} : { group: each.group }),
  }))
}

function idOptions(items: readonly { id: string; label: string; group?: string }[]) {
  return choiceOptions(items.map((each) => ({ ...each, value: each.id })))
}

const BLOCK = 'flex min-w-0 flex-col gap-3 border-0 border-t border-solid border-subtle pt-4'
const JOIN_WORD = 'text-xs font-semibold uppercase text-secondary'

/** A value's field by its kind. */
function ValueControl({
  id,
  kind,
  label,
  value,
  onChange,
  options,
  currency,
  error,
  required,
  description,
}: {
  id: string
  kind: RuleValueKind
  label: string
  value: string | null
  onChange: (value: string | null) => void
  options?: readonly RuleChoice[]
  currency?: string
  error?: ReactNode
  required?: boolean
  description?: string
}) {
  const common = {
    id,
    label,
    ...(error === undefined ? {} : { error }),
    ...(required === true ? { required: true } : {}),
    ...(description === undefined ? {} : { description }),
  }
  if (kind === 'number') return <NumberField {...common} value={value} onChange={onChange} />
  if (kind === 'money') {
    return <MoneyField {...common} currency={currency ?? ''} value={value} onChange={onChange} />
  }
  if (kind === 'date') return <DateField {...common} value={value} onChange={onChange} />
  if (kind === 'choice') {
    return (
      <SelectField
        {...common}
        options={choiceOptions(options ?? [])}
        value={value ?? ''}
        onChange={(next) => {
          onChange(next === '' ? null : next)
        }}
      />
    )
  }
  const text = (next: string) => {
    onChange(next === '' ? null : next)
  }
  if (kind === 'longText') return <TextAreaField {...common} value={value ?? ''} onChange={text} />
  return <TextField {...common} value={value ?? ''} onChange={text} />
}

/** An item's line: its join word, its name, and its tools at the end. */
function ItemHeader({
  nameId,
  join,
  name,
  tools,
}: {
  nameId: string
  join?: string
  name: string
  tools?: ReactNode
}) {
  return (
    <div className="flex min-h-7 items-center gap-2">
      {join !== undefined && <span className={cn(JOIN_WORD, TEXT_ISOLATE)}>{join}</span>}
      <span
        id={nameId}
        className={cn('min-w-0 flex-1 text-xs font-medium text-secondary', TEXT_DIRECTION)}
      >
        {name}
      </span>
      {tools}
    </div>
  )
}

function joinWord(messages: Messages, join: RuleJoin) {
  return join === 'all' ? messages['rule.and'] : messages['rule.or']
}

function joinOptions(messages: Messages) {
  return [
    { value: 'all', label: messages['rule.all'] },
    { value: 'any', label: messages['rule.any'] },
  ]
}

/** The rule as text: the read-only and disabled states. */
function RuleText(props: RuleBuilderProps & { heading: 'h2' | 'h3' | 'h4' }) {
  const { messages, format } = useLiro()
  const Heading = props.heading
  const draft = props.value
  const trigger = props.triggers.find((each) => each.id === draft.trigger)
  const conditionText = (condition: RuleCondition) => {
    const field = props.fields.find((each) => each.id === condition.field)
    const operator = props.operators.find((each) => each.id === condition.operator)
    return (
      <span className="flex flex-wrap gap-x-1.5">
        <span className={TEXT_ISOLATE}>{field?.label ?? '—'}</span>
        <span className={cn('text-secondary', TEXT_ISOLATE)}>{operator?.label ?? '—'}</span>
        {operator?.noValue !== true && field !== undefined && (
          <span
            className={cn('font-medium', TEXT_ISOLATE, field.kind !== 'text' && 'tabular-nums')}
          >
            {ruleValueText(format, field.kind, condition.value, field.options, field.currency)}
          </span>
        )}
      </span>
    )
  }
  const list = (items: readonly RuleCondition[], join: RuleJoin) => (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {items.map((condition, index) => (
        <li key={condition.id} className="flex gap-2 text-sm text-primary">
          {index > 0 && (
            <span className={cn(JOIN_WORD, 'pt-0.5', TEXT_ISOLATE)}>
              {joinWord(messages, join)}
            </span>
          )}
          {conditionText(condition)}
        </li>
      ))}
    </ul>
  )
  return (
    <>
      <div className={BLOCK}>
        <Heading className="m-0 text-sm font-semibold text-primary">
          {messages['rule.when']}
        </Heading>
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>{trigger?.label ?? '—'}</p>
      </div>
      <div className={BLOCK}>
        <Heading className="m-0 text-sm font-semibold text-primary">{messages['rule.if']}</Heading>
        {draft.conditions.length === 0 ? (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['rule.noConditions']}
          </p>
        ) : (
          <>
            {draft.conditions.length > 1 && (
              <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
                {draft.join === 'all' ? messages['rule.all'] : messages['rule.any']}
              </p>
            )}
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {draft.conditions.map((item, index) => (
                <li key={item.id} className="flex gap-2 text-sm text-primary">
                  {index > 0 && (
                    <span className={cn(JOIN_WORD, 'pt-0.5', TEXT_ISOLATE)}>
                      {joinWord(messages, draft.join)}
                    </span>
                  )}
                  {item.kind === 'condition' ? (
                    conditionText(item)
                  ) : (
                    <div className="flex min-w-0 flex-col gap-1 rounded-md bg-surface-sunken px-3 py-2">
                      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                        {item.join === 'all' ? messages['rule.all'] : messages['rule.any']}
                      </span>
                      {list(item.items, item.join)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className={BLOCK}>
        <Heading className="m-0 text-sm font-semibold text-primary">
          {messages['rule.then']}
        </Heading>
        {draft.actions.length === 0 ? (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['rule.noActions']}
          </p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {draft.actions.map((action, index) => {
              const type = props.actionTypes.find((each) => each.id === action.type)
              return (
                <li key={action.id} className="flex flex-col gap-1">
                  <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                    <span className={cn('text-secondary tabular-nums', TEXT_ISOLATE)}>
                      {`${format.number(String(index + 1))}.`}
                    </span>{' '}
                    {type?.label ?? '—'}
                  </span>
                  {type !== undefined && type.params.length > 0 && (
                    <dl className="m-0 flex flex-col gap-0.5 ps-4">
                      {type.params.map((param) => (
                        <div key={param.id} className="flex flex-wrap gap-x-1.5 text-sm">
                          <dt className={cn('text-secondary', TEXT_ISOLATE)}>{param.label}</dt>
                          <dd
                            className={cn('m-0 whitespace-pre-line text-primary', TEXT_DIRECTION)}
                          >
                            {ruleValueText(
                              format,
                              param.kind,
                              action.params[param.id],
                              param.options,
                              param.currency,
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </>
  )
}

/** A "When / If / Then" rule built from the application's triggers, fields, tests and actions. */
export function RuleBuilder(props: RuleBuilderProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const base = useId()
  const root = useRef<HTMLDivElement>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const Heading = `h${String(props.headingLevel ?? 3)}` as 'h2' | 'h3' | 'h4'
  const draft = props.value
  const problems = props.problems ?? {}
  const onChange = props.onChange

  // The focus follows an edit once the application has passed the new rule back.
  useEffect(() => {
    if (focusKey === null) return
    const element =
      root.current?.querySelector<HTMLElement>(`[data-rule-focus="${focusKey}"]`) ??
      (focusKey.endsWith(':first')
        ? document.getElementById(`${base}-${focusKey.slice(0, -':first'.length)}-first`)
        : null)
    if (element !== null) {
      element.focus()
      setFocusKey(null)
    }
  }, [focusKey, base, props.value])

  const summary =
    props.summary === undefined ? null : (
      <div role="status" className="flex flex-col gap-0.5 rounded-md bg-surface-sunken px-3 py-2">
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['rule.summary']}
        </span>
        <span className={cn('text-sm text-primary', TEXT_DIRECTION)}>{props.summary}</span>
      </div>
    )

  const frame = (children: ReactNode) => (
    <div
      ref={root}
      role="group"
      aria-label={props.label}
      data-slot="rule-builder"
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      {children}
    </div>
  )

  if (props.loading === true) {
    return (
      <div
        role="group"
        aria-label={props.label}
        aria-busy="true"
        data-slot="rule-builder"
        className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
      >
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (onChange === undefined || props.readOnly === true || props.disabledReason !== undefined) {
    return frame(
      <>
        {props.disabledReason !== undefined && (
          <FieldMessage id={`${base}-reason`} tone="hint">
            {props.disabledReason}
          </FieldMessage>
        )}
        {summary}
        <RuleText {...props} heading={Heading} />
      </>,
    )
  }

  const change = (next: RuleDraft, focus?: string) => {
    onChange(next)
    if (focus !== undefined) setFocusKey(focus)
  }

  const problem = (key: string) => problems[key]

  // Conditions and groups are numbered apart: "Condition 1", "Group 1", "Condition 2".
  const numbers = new Map<string, number>()
  let conditionCount = 0
  let groupCount = 0
  for (const item of draft.conditions) {
    if (item.kind === 'group') {
      groupCount += 1
      numbers.set(item.id, groupCount)
    } else {
      conditionCount += 1
      numbers.set(item.id, conditionCount)
    }
  }
  const numberText = (id: string) => format.number(String(numbers.get(id) ?? 0))

  const tools = (id: string, name: string) => {
    const place = rulePlace(draft, id)
    if (place === undefined) return null
    const move = (delta: -1 | 1) => {
      change(
        moveRuleItem(draft, id, delta),
        `${id}:${moveFocusTarget(place.index, place.length, delta)}`,
      )
    }
    const remove = () => {
      // A group's only condition takes its group with it: the focus then follows the group.
      const group =
        place.list === 'group' && place.length === 1 && place.groupId !== undefined
          ? rulePlace(draft, place.groupId)
          : undefined
      const removed = group ?? place
      const next = removeRuleItem(draft, id)
      const index = focusAfterRemove(removed.index, removed.length)
      let target: string | undefined
      if (index !== undefined) {
        if (removed.list === 'actions') target = next.actions[index]?.id
        else if (removed.list === 'conditions') target = next.conditions[index]?.id
        else {
          const owner = next.conditions.find((each) => each.id === removed.groupId)
          target = owner?.kind === 'group' ? owner.items[index]?.id : undefined
        }
      }
      const fallback =
        removed.list === 'actions'
          ? 'add-action'
          : removed.list === 'group'
            ? `add-to:${removed.groupId ?? ''}`
            : 'add-condition'
      change(next, target === undefined ? fallback : `${target}:first`)
    }
    return (
      <span className="flex shrink-0 items-center gap-1">
        {place.index > 0 && (
          <CompactIconButton
            icon={ArrowUp}
            label={messages['rule.moveUp'](name)}
            data-rule-focus={`${id}:up`}
            onClick={() => {
              move(-1)
            }}
          />
        )}
        {place.index < place.length - 1 && (
          <CompactIconButton
            icon={ArrowDown}
            label={messages['rule.moveDown'](name)}
            data-rule-focus={`${id}:down`}
            onClick={() => {
              move(1)
            }}
          />
        )}
        <CompactIconButton icon={X} label={messages['rule.remove'](name)} onClick={remove} />
      </span>
    )
  }

  const conditionRow = (condition: RuleCondition, name: string, join: string | undefined) => {
    const field = props.fields.find((each) => each.id === condition.field)
    const tests = operatorsFor(field, props.operators)
    const operator = tests.find((each) => each.id === condition.operator)
    const nameId = `${base}-${condition.id}-name`
    return (
      <li key={condition.id} className="min-w-0">
        <div role="group" aria-labelledby={nameId} className="flex flex-col gap-1">
          <ItemHeader
            nameId={nameId}
            {...(join === undefined ? {} : { join })}
            name={name}
            tools={tools(condition.id, name)}
          />
          <div className="@container min-w-0">
            <div
              className={cn(
                'grid grid-cols-1 items-start gap-3',
                !phone && '@2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]',
              )}
            >
              <SelectField
                id={`${base}-${condition.id}-first`}
                label={messages['rule.field']}
                options={idOptions(props.fields)}
                value={condition.field ?? ''}
                {...(problem(ruleProblemKey(condition.id, 'field')) === undefined
                  ? {}
                  : { error: problem(ruleProblemKey(condition.id, 'field')) })}
                onChange={(next) => {
                  change(
                    setConditionField(draft, condition.id, next === '' ? null : next, props.fields),
                  )
                }}
              />
              <SelectField
                label={messages['rule.operator']}
                options={idOptions(tests)}
                value={condition.operator ?? ''}
                {...(field === undefined
                  ? { disabled: true, disabledReason: messages['rule.fieldFirst'] }
                  : {})}
                {...(problem(ruleProblemKey(condition.id, 'operator')) === undefined
                  ? {}
                  : { error: problem(ruleProblemKey(condition.id, 'operator')) })}
                onChange={(next) => {
                  change(
                    setConditionOperator(
                      draft,
                      condition.id,
                      next === '' ? null : next,
                      props.operators,
                    ),
                  )
                }}
              />
              {field !== undefined && operator !== undefined && operator.noValue !== true && (
                <ValueControl
                  key={`${field.id}-${field.kind}`}
                  id={`${base}-${condition.id}-value`}
                  kind={field.kind}
                  label={messages['rule.value']}
                  value={condition.value}
                  {...(field.options === undefined ? {} : { options: field.options })}
                  {...(field.currency === undefined ? {} : { currency: field.currency })}
                  {...(problem(ruleProblemKey(condition.id, 'value')) === undefined
                    ? {}
                    : { error: problem(ruleProblemKey(condition.id, 'value')) })}
                  onChange={(next) => {
                    change(setConditionValue(draft, condition.id, next))
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </li>
    )
  }

  const groupBox = (group: RuleConditionGroup, name: string, join: string | undefined) => {
    const nameId = `${base}-${group.id}-name`
    return (
      <li key={group.id} className="min-w-0">
        <div role="group" aria-labelledby={nameId} className="flex flex-col gap-1">
          <ItemHeader
            nameId={nameId}
            {...(join === undefined ? {} : { join })}
            name={name}
            tools={tools(group.id, name)}
          />
          <div className="flex min-w-0 flex-col gap-3 rounded-md border border-solid border-default bg-surface-sunken p-3">
            <SelectField
              id={`${base}-${group.id}-first`}
              label={messages['rule.groupMatch']}
              options={joinOptions(messages)}
              value={group.join}
              onChange={(next) => {
                change(setRuleJoin(draft, next === 'any' ? 'any' : 'all', group.id))
              }}
              className="max-w-xs"
            />
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {group.items.map((condition, index) =>
                conditionRow(
                  condition,
                  messages['rule.groupCondition'](
                    numberText(group.id),
                    format.number(String(index + 1)),
                  ),
                  index === 0 ? undefined : joinWord(messages, group.join),
                ),
              )}
            </ol>
            <div>
              <Button
                family="neutral"
                icon={Plus}
                label={messages['rule.addToGroup']}
                data-rule-focus={`add-to:${group.id}`}
                onClick={() => {
                  const added = addRuleCondition(draft, group.id)
                  change(added.draft, `${added.id}:first`)
                }}
              />
            </div>
          </div>
        </div>
      </li>
    )
  }

  const trigger = problem('trigger')
  const conditionsProblem = problem('conditions')
  const actionsProblem = problem('actions')
  const whenId = `${base}-when`
  const ifId = `${base}-if`
  const thenId = `${base}-then`

  return frame(
    <>
      {summary}
      <div role="group" aria-labelledby={whenId} className={BLOCK}>
        <Heading id={whenId} className="m-0 text-sm font-semibold text-primary">
          {messages['rule.when']}
        </Heading>
        <SelectField
          label={messages['rule.trigger']}
          required
          options={idOptions(props.triggers)}
          value={draft.trigger ?? ''}
          {...(trigger === undefined ? {} : { error: trigger })}
          onChange={(next) => {
            change({ ...draft, trigger: next === '' ? null : next })
          }}
          className={phone ? '' : 'max-w-md'}
        />
      </div>
      <div role="group" aria-labelledby={ifId} className={BLOCK}>
        <Heading id={ifId} className="m-0 text-sm font-semibold text-primary">
          {messages['rule.if']}
        </Heading>
        {draft.conditions.length === 0 && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['rule.noConditions']}
          </p>
        )}
        {draft.conditions.length > 1 && (
          <SelectField
            label={messages['rule.match']}
            options={joinOptions(messages)}
            value={draft.join}
            onChange={(next) => {
              change(setRuleJoin(draft, next === 'any' ? 'any' : 'all'))
            }}
            className={phone ? '' : 'max-w-xs'}
          />
        )}
        {draft.conditions.length > 0 && (
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {draft.conditions.map((item, index) => {
              const join = index === 0 ? undefined : joinWord(messages, draft.join)
              if (item.kind === 'group') {
                return groupBox(item, messages['rule.group'](numberText(item.id)), join)
              }
              return conditionRow(item, messages['rule.condition'](numberText(item.id)), join)
            })}
          </ol>
        )}
        {conditionsProblem !== undefined && (
          <FieldMessage id={`${base}-conditions-problem`} tone="error">
            {conditionsProblem}
          </FieldMessage>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            family="neutral"
            icon={Plus}
            label={messages['rule.addCondition']}
            data-rule-focus="add-condition"
            onClick={() => {
              const added = addRuleCondition(draft)
              change(added.draft, `${added.id}:first`)
            }}
          />
          <Button
            family="neutral"
            icon={ListPlus}
            label={messages['rule.addGroup']}
            onClick={() => {
              const added = addRuleGroup(draft)
              change(added.draft, `${added.id}:first`)
            }}
          />
        </div>
      </div>
      <div role="group" aria-labelledby={thenId} className={BLOCK}>
        <Heading id={thenId} className="m-0 text-sm font-semibold text-primary">
          {messages['rule.then']}
        </Heading>
        {draft.actions.length === 0 && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['rule.noActions']}
          </p>
        )}
        {draft.actions.length > 0 && (
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {draft.actions.map((action, index) => (
              <ActionItem
                key={action.id}
                action={action}
                name={messages['rule.actionName'](format.number(String(index + 1)))}
                nameId={`${base}-${action.id}-name`}
                firstId={`${base}-${action.id}-first`}
                base={base}
                types={props.actionTypes}
                problems={problems}
                phone={phone}
                tools={tools(
                  action.id,
                  messages['rule.actionName'](format.number(String(index + 1))),
                )}
                onType={(type) => {
                  change(setRuleActionType(draft, action.id, type))
                }}
                onParam={(param, value) => {
                  change(setRuleActionParam(draft, action.id, param, value))
                }}
              />
            ))}
          </ol>
        )}
        {actionsProblem !== undefined && (
          <FieldMessage id={`${base}-actions-problem`} tone="error">
            {actionsProblem}
          </FieldMessage>
        )}
        <div>
          <Button
            family="neutral"
            icon={Plus}
            label={messages['rule.addAction']}
            data-rule-focus="add-action"
            onClick={() => {
              const added = addRuleAction(draft)
              change(added.draft, `${added.id}:first`)
            }}
          />
        </div>
      </div>
    </>,
  )
}

/** One action: its kind and its parameters' fields. */
function ActionItem({
  action,
  name,
  nameId,
  firstId,
  base,
  types,
  problems,
  phone,
  tools,
  onType,
  onParam,
}: {
  action: RuleAction
  name: string
  nameId: string
  firstId: string
  base: string
  types: readonly RuleActionType[]
  problems: Readonly<Record<string, ReactNode>>
  phone: boolean
  tools: ReactNode
  onType: (type: string | null) => void
  onParam: (param: string, value: string | null) => void
}) {
  const { messages } = useLiro()
  const type = types.find((each) => each.id === action.type)
  const typeProblem = problems[ruleProblemKey(action.id, 'type')]
  return (
    <li className="min-w-0">
      <div role="group" aria-labelledby={nameId} className="flex flex-col gap-1">
        <ItemHeader nameId={nameId} name={name} tools={tools} />
        <div className="@container min-w-0">
          <div className={cn('grid grid-cols-1 items-start gap-3', !phone && '@xl:grid-cols-2')}>
            <SelectField
              id={firstId}
              label={messages['rule.action']}
              required
              options={idOptions(types)}
              value={action.type ?? ''}
              {...(typeProblem === undefined ? {} : { error: typeProblem })}
              onChange={(next) => {
                onType(next === '' ? null : next)
              }}
            />
            {type?.params.map((param) => {
              const paramProblem = problems[ruleProblemKey(action.id, param.id)]
              return (
                <div
                  key={param.id}
                  className={cn('min-w-0', param.kind === 'longText' && 'col-span-full')}
                >
                  <ValueControl
                    id={`${base}-${action.id}-${param.id}`}
                    kind={param.kind}
                    label={param.label}
                    value={action.params[param.id] ?? null}
                    {...(param.options === undefined ? {} : { options: param.options })}
                    {...(param.currency === undefined ? {} : { currency: param.currency })}
                    {...(param.required === true ? { required: true } : {})}
                    {...(param.description === undefined ? {} : { description: param.description })}
                    {...(paramProblem === undefined ? {} : { error: paramProblem })}
                    onChange={(value) => {
                      onParam(param.id, value)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </li>
  )
}

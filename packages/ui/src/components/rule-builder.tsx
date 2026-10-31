import { GripVertical, ListPlus, Plus } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroFormat } from '../provider/format'
import { Button, CompactIconButton } from './button'
import { DateField } from './date-field'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { FieldMessage } from './field'
import { MoneyField, NumberField } from './number-field'
import { Skeleton } from './progress'
import {
  addRuleAction,
  addRuleBranch,
  addRuleCondition,
  addRuleGroup,
  addRuleOtherwise,
  focusAfterRemove,
  moveRuleItem,
  moveRuleItemTo,
  operatorsFor,
  removeRuleItem,
  RULE_OTHERWISE,
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
  type RuleBranch,
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
import { DROP_LINE, DROP_ZONE_ACTIVE, LIFTED, useListDrag } from './use-list-drag'
import { usePhone } from './use-phone'

/*
 * RuleBuilder: an automation rule, like Zapier / Make, as blocks joined by a line —
 * - "In words" first: the rule as the application writes it (`summary`), announced politely.
 * - When: what starts the rule, one pill.
 * - If: each condition one sentence of pills — [Number of lines] [is more than] [20] — with no
 *   "Field / Test / Value" labels on the screen (each pill's accessible name says it in full:
 *   "Condition 2: field"). The test appears once the field is chosen, the value once the test
 *   takes one. Conditions are joined by "All of these" / "Any of these" (a pill in the block's
 *   head once there are two); a group is a sunken box with its own join, one level deep.
 *   "Add condition" and "Add group" under them; no conditions: the rule runs every time.
 * - Then (inside each branch): the actions in order, each its action pill and its parameters'
 *   fields (labelled: they are the application's words), "Add action".
 * - Else if / Else: further branches, each with its own conditions and Then, tried in order;
 *   Else's actions run when no branch holds. "Add Else if" and "Add Else" end the rule.
 * - Every condition, group, action and Else-if block has its menu (Move up, Move down, Remove,
 *   named with the item); conditions and actions are also reordered by dragging their row (the
 *   dragging rule, `useListDrag`: within their own list, announced). The focus follows: a new
 *   item's first pill, a moved item's menu button, after a removal the item that takes its place
 *   (or the add button).
 * - Everything is the application's data: the triggers, the fields (they may differ by the
 *   trigger), the tests, the values' kinds and choices, the actions and their parameters. The
 *   builder reports the edited rule (`onChange`, a RuleDraft) and never evaluates it; the
 *   application checks it and returns its problems (`problems`, keyed 'trigger', 'conditions',
 *   'actions' or `ruleProblemKey(id, part)`), shown under their pills.
 * - Read-only (`readOnly`): the same blocks as sentences, values through the provider's
 *   `format`. Loading: skeleton blocks. Phones (`layout`, default below 48em): the blocks
 *   stacked, the pills wrapping.
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
  /** The application is loading the rule: skeleton blocks. */
  loading?: boolean
  /** The blocks' heading level. Default 3. */
  headingLevel?: 2 | 3 | 4
  /** 'phone' stacks the blocks and wraps the pills; default by the viewport (48em). */
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

/** A block: raised, border.default, radius lg, 16px (12px on phones). */
const BLOCK =
  'flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised'

/** A block's keyword ("When", "If", "Then"): a small neutral tag. */
const KEYWORD =
  'inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-sunken px-2 text-xs font-semibold text-primary'

/** The join word between conditions ("and", "or"). */
const JOIN_WORD = 'text-xs font-semibold text-secondary'

/** A field drawn as a pill: the select's trigger or the input rounded fully. */
const PILL =
  'max-w-full [&_[data-slot=input]]:rounded-full [&_[data-slot=select-trigger]]:rounded-full'

/** The line between two blocks (start-aligned under the keywords). */
function Connector() {
  return (
    <div
      aria-hidden="true"
      className="ms-6 h-4 w-0 border-0 border-s-2 border-solid border-default"
    />
  )
}

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
  hideLabel,
  className,
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
  hideLabel?: boolean
  className?: string
}) {
  const common = {
    id,
    label,
    ...(error === undefined ? {} : { error }),
    ...(required === true ? { required: true } : {}),
    ...(description === undefined ? {} : { description }),
    ...(hideLabel === true ? { hideLabel: true } : {}),
    ...(className === undefined ? {} : { className }),
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

function joinWord(messages: Messages, join: RuleJoin) {
  return join === 'all' ? messages['rule.and'] : messages['rule.or']
}

function joinOptions(messages: Messages) {
  return [
    { value: 'all', label: messages['rule.all'] },
    { value: 'any', label: messages['rule.any'] },
  ]
}

/** The names of the rule's items, numbered across the whole rule so each is unique. */
function ruleNames(draft: RuleDraft, messages: Messages, format: LiroFormat) {
  const names = new Map<string, string>()
  const number = (count: number) => format.number(String(count))
  let conditions = 0
  let groups = 0
  let actions = 0
  draft.branches.forEach((branch, index) => {
    names.set(
      branch.id,
      index === 0 ? messages['rule.if'] : messages['rule.branchName'](number(index)),
    )
    for (const item of branch.conditions) {
      if (item.kind === 'group') {
        groups += 1
        names.set(item.id, messages['rule.group'](number(groups)))
        item.items.forEach((condition, position) => {
          names.set(
            condition.id,
            messages['rule.groupCondition'](number(groups), number(position + 1)),
          )
        })
      } else {
        conditions += 1
        names.set(item.id, messages['rule.condition'](number(conditions)))
      }
    }
    for (const action of branch.actions) {
      actions += 1
      names.set(action.id, messages['rule.actionName'](number(actions)))
    }
  })
  for (const action of draft.otherwise ?? []) {
    actions += 1
    names.set(action.id, messages['rule.actionName'](number(actions)))
  }
  return (id: string) => names.get(id) ?? ''
}

/** The drop zone (list) an item stands in, for dragging within its own list. */
function zoneOf(draft: RuleDraft, id: string): string | undefined {
  const place = rulePlace(draft, id)
  if (place === undefined || place.list === 'branches') return undefined
  if (place.list === 'group') return `${place.groupId ?? ''}:group`
  return `${place.branchId ?? ''}:${place.list}`
}

/** The rule as text: the read-only state, in the same blocks. */
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
        <span className={cn('font-medium', TEXT_ISOLATE)}>{field?.label ?? '—'}</span>
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
  const actions = (items: readonly RuleAction[]) =>
    items.length === 0 ? (
      <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
        {messages['rule.noActions']}
      </p>
    ) : (
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((action, index) => {
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
                      <dd className={cn('m-0 whitespace-pre-line text-primary', TEXT_DIRECTION)}>
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
    )
  const block = (keyword: string, children: ReactNode, key: string) => (
    <div key={key} className={cn(BLOCK, 'p-4')}>
      <Heading className="m-0 flex">
        <span className={KEYWORD}>{keyword}</span>
      </Heading>
      {children}
    </div>
  )
  const parts: ReactNode[] = [
    block(
      messages['rule.when'],
      <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>{trigger?.label ?? '—'}</p>,
      'when',
    ),
  ]
  draft.branches.forEach((branch, index) => {
    parts.push(
      block(
        index === 0 ? messages['rule.if'] : messages['rule.elseIf'],
        <>
          {branch.conditions.length === 0 ? (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {messages['rule.noConditions']}
            </p>
          ) : (
            <>
              {branch.conditions.length > 1 && (
                <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
                  {branch.join === 'all' ? messages['rule.all'] : messages['rule.any']}
                </p>
              )}
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {branch.conditions.map((item, position) => (
                  <li key={item.id} className="flex gap-2 text-sm text-primary">
                    {position > 0 && (
                      <span className={cn(JOIN_WORD, 'pt-0.5', TEXT_ISOLATE)}>
                        {joinWord(messages, branch.join)}
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
          <div className="flex flex-col gap-2 border-0 border-t border-solid border-subtle pt-3">
            <span className={cn(KEYWORD, 'self-start')}>{messages['rule.then']}</span>
            {actions(branch.actions)}
          </div>
        </>,
        branch.id,
      ),
    )
  })
  if (draft.otherwise !== null) {
    parts.push(block(messages['rule.else'], actions(draft.otherwise), RULE_OTHERWISE))
  }
  return (
    <div className="flex flex-col">
      {parts.map((part, index) => (
        <div key={index} className="flex flex-col">
          {index > 0 && <Connector />}
          {part}
        </div>
      ))}
    </div>
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
  const [announcement, setAnnouncement] = useState('')
  const Heading = `h${String(props.headingLevel ?? 3)}` as 'h2' | 'h3' | 'h4'
  const draft = props.value
  const problems = props.problems ?? {}
  const onChange = props.onChange
  const nameOf = ruleNames(draft, messages, format)

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

  const { drag, startDrag } = useListDrag({
    container: root,
    accepts: (itemId, zone) => zoneOf(draft, itemId) === zone,
    onDrop: (itemId, _from, to) => {
      if (onChange === undefined) return
      const next = moveRuleItemTo(draft, itemId, to.index)
      onChange(next)
      const place = rulePlace(next, itemId)
      if (place !== undefined) {
        setAnnouncement(
          messages['rule.moved'](
            ruleNames(next, messages, format)(itemId),
            format.number(String(place.index + 1)),
            format.number(String(place.length)),
          ),
        )
      }
    },
  })

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
      className={cn('relative flex min-w-0 flex-col gap-4 font-sans', props.className)}
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
          <div key={index} className={cn(BLOCK, 'gap-2 p-4')}>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (onChange === undefined || props.readOnly === true) {
    return frame(
      <>
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
  const padding = phone ? 'p-3' : 'p-4'

  /** An item's menu: Move up, Move down (where it can move), Remove; named with the item. */
  const menu = (id: string) => {
    const place = rulePlace(draft, id)
    if (place === undefined) return null
    const name = nameOf(id)
    const move = (delta: -1 | 1) => {
      const next = moveRuleItem(draft, id, delta)
      change(next, `${id}:menu`)
      setAnnouncement(
        messages['rule.moved'](
          ruleNames(next, messages, format)(id),
          format.number(String(place.index + 1 + delta)),
          format.number(String(place.length)),
        ),
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
        if (removed.list === 'branches') target = next.branches[index]?.id
        else if (removed.list === 'actions') {
          target =
            removed.branchId === RULE_OTHERWISE
              ? next.otherwise?.[index]?.id
              : next.branches.find((each) => each.id === removed.branchId)?.actions[index]?.id
        } else if (removed.list === 'conditions') {
          target = next.branches.find((each) => each.id === removed.branchId)?.conditions[index]?.id
        } else {
          const owner = next.branches
            .find((each) => each.id === removed.branchId)
            ?.conditions.find((each) => each.id === removed.groupId)
          target = owner?.kind === 'group' ? owner.items[index]?.id : undefined
        }
      }
      const fallback =
        removed.list === 'branches'
          ? 'add-branch'
          : removed.list === 'actions'
            ? `add-action:${removed.branchId ?? ''}`
            : removed.list === 'group'
              ? `add-to:${removed.groupId ?? ''}`
              : `add-condition:${removed.branchId ?? ''}`
      change(next, target === undefined ? fallback : `${target}:menu`)
    }
    // The first branch ("If") never moves; the other branches move among themselves.
    const first = place.list === 'branches' ? 1 : 0
    const entries: MenuEntry[] = [
      {
        label: messages['rule.moveUp'](name),
        disabled: place.index <= first,
        onSelect: () => {
          move(-1)
        },
      },
      {
        label: messages['rule.moveDown'](name),
        disabled: place.index >= place.length - 1,
        onSelect: () => {
          move(1)
        },
      },
      { type: 'separator' },
      { label: messages['rule.remove'](name), destructive: true, onSelect: remove },
    ]
    return (
      <DropdownMenu
        align="end"
        entries={entries}
        trigger={
          <CompactIconButton
            intent="more"
            label={messages['rule.itemMenu'](name)}
            data-rule-focus={`${id}:menu`}
          />
        }
      />
    )
  }

  /** The drag attributes of a row that can be reordered within its list. */
  const draggable = (id: string) => ({
    'data-drop-item': id,
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (
        event.target instanceof Element &&
        event.target.closest('button, input, textarea, select, a, [role="combobox"]') !== null
      ) {
        return
      }
      // A condition inside a group: only the innermost row drags.
      event.stopPropagation()
      startDrag(event, id)
    },
    style:
      drag?.itemId === id
        ? ({
            transform: `translate(${String(drag.dx)}px, ${String(drag.dy)}px)`,
          } satisfies CSSProperties)
        : undefined,
  })

  /** A list's look while a row is dragged over it: the neutral selection. */
  const zoneLook = (id: string) =>
    drag !== null && drag.target.zone === id && drag.from.zone === id
      ? cn(DROP_ZONE_ACTIVE, 'rounded-md')
      : undefined
  const line = (id: string) =>
    drag !== null && drag.target.zone === id ? (
      <li aria-hidden="true" className={DROP_LINE} style={{ top: drag.line }} />
    ) : null

  /** The handle drawn at a row's start: the row itself drags; the menu is the keyboard's way. */
  const handle = (
    <GripVertical aria-hidden="true" className="mt-2.5 size-4 shrink-0 cursor-grab text-tertiary" />
  )

  const conditionRow = (condition: RuleCondition, join: string | undefined) => {
    const name = nameOf(condition.id)
    const field = props.fields.find((each) => each.id === condition.field)
    const tests = operatorsFor(field, props.operators)
    const operator = tests.find((each) => each.id === condition.operator)
    const nameId = `${base}-${condition.id}-name`
    const lifted = drag?.itemId === condition.id
    return (
      <li
        key={condition.id}
        {...draggable(condition.id)}
        className={cn(
          'flex min-w-0 touch-manipulation flex-col gap-1 rounded-md border border-solid select-none',
          lifted ? cn(LIFTED, 'bg-surface-raised') : 'border-transparent',
        )}
      >
        {join !== undefined && <span className={cn(JOIN_WORD, 'ps-6', TEXT_ISOLATE)}>{join}</span>}
        <div role="group" aria-labelledby={nameId} className="flex min-w-0 items-start gap-2">
          <span id={nameId} className="sr-only">
            {name}
          </span>
          {handle}
          <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
            <SelectField
              id={`${base}-${condition.id}-first`}
              label={messages['rule.fieldOf'](name)}
              hideLabel
              placeholder={messages['rule.chooseField']}
              options={idOptions(props.fields)}
              value={condition.field ?? ''}
              className={cn(PILL, phone ? 'w-full' : 'w-52')}
              {...(problem(ruleProblemKey(condition.id, 'field')) === undefined
                ? {}
                : { error: problem(ruleProblemKey(condition.id, 'field')) })}
              onChange={(next) => {
                change(
                  setConditionField(draft, condition.id, next === '' ? null : next, props.fields),
                )
              }}
            />
            {/* The test comes once the field is chosen (the minimum first). */}
            {field !== undefined && (
              <SelectField
                label={messages['rule.operatorOf'](name)}
                hideLabel
                placeholder={messages['rule.chooseTest']}
                options={idOptions(tests)}
                value={condition.operator ?? ''}
                className={cn(PILL, 'w-44')}
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
            )}
            {field !== undefined && operator !== undefined && operator.noValue !== true && (
              <ValueControl
                key={`${field.id}-${field.kind}`}
                id={`${base}-${condition.id}-value`}
                kind={field.kind}
                label={messages['rule.valueOf'](name)}
                hideLabel
                className={cn(PILL, 'w-44')}
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
          <span className="mt-1 shrink-0">{menu(condition.id)}</span>
        </div>
      </li>
    )
  }

  const groupBox = (group: RuleConditionGroup, join: string | undefined) => {
    const name = nameOf(group.id)
    const nameId = `${base}-${group.id}-name`
    const listId = `${group.id}:group`
    const lifted = drag?.itemId === group.id
    return (
      <li
        key={group.id}
        {...draggable(group.id)}
        className={cn(
          'flex min-w-0 touch-manipulation flex-col gap-1 rounded-md border border-solid select-none',
          lifted ? cn(LIFTED, 'bg-surface-raised') : 'border-transparent',
        )}
      >
        {join !== undefined && <span className={cn(JOIN_WORD, 'ps-6', TEXT_ISOLATE)}>{join}</span>}
        <div role="group" aria-labelledby={nameId} className="flex min-w-0 items-start gap-2">
          <span id={nameId} className="sr-only">
            {name}
          </span>
          {handle}
          <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-md border border-solid border-default bg-surface-sunken p-3">
            <div className="flex items-start gap-2">
              <SelectField
                id={`${base}-${group.id}-first`}
                label={messages['rule.groupMatch']}
                hideLabel
                options={joinOptions(messages)}
                value={group.join}
                className={cn(PILL, 'w-44')}
                onChange={(next) => {
                  change(setRuleJoin(draft, next === 'any' ? 'any' : 'all', group.id))
                }}
              />
              <span className="ms-auto mt-1 shrink-0">{menu(group.id)}</span>
            </div>
            <ol
              data-drop-zone={listId}
              className={cn('relative m-0 flex list-none flex-col gap-3 p-0', zoneLook(listId))}
            >
              {line(listId)}
              {group.items.map((condition, index) =>
                conditionRow(condition, index === 0 ? undefined : joinWord(messages, group.join)),
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

  const actionList = (branchId: string, actions: readonly RuleAction[]) => {
    const listId = `${branchId}:actions`
    return (
      <div className="flex flex-col gap-3">
        <span className={cn(KEYWORD, 'self-start')}>{messages['rule.then']}</span>
        {actions.length === 0 && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['rule.noActions']}
          </p>
        )}
        {actions.length > 0 && (
          <ol
            data-drop-zone={listId}
            className={cn('relative m-0 flex list-none flex-col gap-4 p-0', zoneLook(listId))}
          >
            {line(listId)}
            {actions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                name={nameOf(action.id)}
                number={format.number(String(actions.indexOf(action) + 1))}
                firstId={`${base}-${action.id}-first`}
                base={base}
                types={props.actionTypes}
                problems={problems}
                phone={phone}
                lifted={drag?.itemId === action.id}
                drag={draggable(action.id)}
                handle={handle}
                menu={menu(action.id)}
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
        <div>
          <Button
            family="neutral"
            icon={Plus}
            label={messages['rule.addAction']}
            data-rule-focus={`add-action:${branchId}`}
            onClick={() => {
              const added = addRuleAction(draft, branchId)
              change(added.draft, `${added.id}:first`)
            }}
          />
        </div>
      </div>
    )
  }

  const branchBlock = (branch: RuleBranch, index: number) => {
    const headingId = `${base}-${branch.id}-heading`
    const listId = `${branch.id}:conditions`
    const conditionsProblem = index === 0 ? problem('conditions') : undefined
    const actionsProblem = index === 0 ? problem('actions') : undefined
    return (
      <div role="group" aria-label={nameOf(branch.id)} className={cn(BLOCK, padding)}>
        <div className="flex flex-wrap items-center gap-2">
          <Heading id={headingId} className="m-0 flex">
            <span className={KEYWORD}>
              {index === 0 ? messages['rule.if'] : messages['rule.elseIf']}
            </span>
          </Heading>
          {branch.conditions.length > 1 && (
            <SelectField
              label={messages['rule.match']}
              hideLabel
              options={joinOptions(messages)}
              value={branch.join}
              className={cn(PILL, 'w-44')}
              onChange={(next) => {
                change(setRuleJoin(draft, next === 'any' ? 'any' : 'all', branch.id))
              }}
            />
          )}
          {index > 0 && <span className="ms-auto shrink-0">{menu(branch.id)}</span>}
        </div>
        {branch.conditions.length === 0 && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['rule.noConditions']}
          </p>
        )}
        {branch.conditions.length > 0 && (
          <ol
            data-drop-zone={listId}
            className={cn('relative m-0 flex list-none flex-col gap-3 p-0', zoneLook(listId))}
          >
            {line(listId)}
            {branch.conditions.map((item, position) => {
              const join = position === 0 ? undefined : joinWord(messages, branch.join)
              return item.kind === 'group' ? groupBox(item, join) : conditionRow(item, join)
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
            data-rule-focus={`add-condition:${branch.id}`}
            onClick={() => {
              const added = addRuleCondition(draft, branch.id)
              change(added.draft, `${added.id}:first`)
            }}
          />
          <Button
            family="neutral"
            icon={ListPlus}
            label={messages['rule.addGroup']}
            onClick={() => {
              const added = addRuleGroup(draft, branch.id)
              change(added.draft, `${added.id}:first`)
            }}
          />
        </div>
        <div className="flex flex-col gap-3 border-0 border-t border-solid border-subtle pt-3">
          {actionList(branch.id, branch.actions)}
          {actionsProblem !== undefined && (
            <FieldMessage id={`${base}-actions-problem`} tone="error">
              {actionsProblem}
            </FieldMessage>
          )}
        </div>
      </div>
    )
  }

  const trigger = problem('trigger')
  const whenId = `${base}-when`
  const elseId = `${base}-else`

  return frame(
    <>
      {summary}
      <div role="status" className="sr-only">
        {announcement}
      </div>
      <div className="flex flex-col">
        <div role="group" aria-labelledby={whenId} className={cn(BLOCK, padding)}>
          <Heading id={whenId} className="m-0 flex">
            <span className={KEYWORD}>{messages['rule.when']}</span>
          </Heading>
          <SelectField
            label={messages['rule.trigger']}
            hideLabel
            required
            placeholder={messages['rule.chooseTrigger']}
            options={idOptions(props.triggers)}
            value={draft.trigger ?? ''}
            {...(trigger === undefined ? {} : { error: trigger })}
            onChange={(next) => {
              change({ ...draft, trigger: next === '' ? null : next })
            }}
            className={cn(PILL, phone ? 'w-full' : 'w-96')}
          />
        </div>
        {draft.branches.map((branch, index) => (
          <div key={branch.id} className="flex flex-col">
            <Connector />
            {branchBlock(branch, index)}
          </div>
        ))}
        {draft.otherwise !== null && (
          <div className="flex flex-col">
            <Connector />
            <div role="group" aria-labelledby={elseId} className={cn(BLOCK, padding)}>
              <div className="flex items-center gap-2">
                <Heading id={elseId} className="m-0 flex">
                  <span className={KEYWORD}>{messages['rule.else']}</span>
                </Heading>
                <span className="ms-auto shrink-0">
                  <DropdownMenu
                    align="end"
                    entries={[
                      {
                        label: messages['rule.remove'](messages['rule.else']),
                        destructive: true,
                        onSelect: () => {
                          change(removeRuleItem(draft, RULE_OTHERWISE), 'add-else')
                        },
                      },
                    ]}
                    trigger={
                      <CompactIconButton
                        intent="more"
                        label={messages['rule.itemMenu'](messages['rule.else'])}
                      />
                    }
                  />
                </span>
              </div>
              {actionList(RULE_OTHERWISE, draft.otherwise)}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          family="neutral"
          icon={Plus}
          label={messages['rule.addElseIf']}
          data-rule-focus="add-branch"
          onClick={() => {
            const added = addRuleBranch(draft)
            change(added.draft, `${added.conditionId}:first`)
          }}
        />
        {draft.otherwise === null && (
          <Button
            family="neutral"
            icon={Plus}
            label={messages['rule.addElse']}
            data-rule-focus="add-else"
            onClick={() => {
              const added = addRuleOtherwise(draft)
              change(added.draft, `${added.id}:first`)
            }}
          />
        )}
      </div>
    </>,
  )
}

/** One action: its number, its action pill and its parameters' fields. */
function ActionItem({
  action,
  name,
  number,
  firstId,
  base,
  types,
  problems,
  phone,
  lifted,
  drag,
  handle,
  menu,
  onType,
  onParam,
}: {
  action: RuleAction
  name: string
  number: string
  firstId: string
  base: string
  types: readonly RuleActionType[]
  problems: Readonly<Record<string, ReactNode>>
  phone: boolean
  lifted: boolean
  drag: {
    'data-drop-item': string
    onPointerDown: (event: PointerEvent<HTMLElement>) => void
    style: CSSProperties | undefined
  }
  handle: ReactNode
  menu: ReactNode
  onType: (type: string | null) => void
  onParam: (param: string, value: string | null) => void
}) {
  const { messages } = useLiro()
  const type = types.find((each) => each.id === action.type)
  const typeProblem = problems[ruleProblemKey(action.id, 'type')]
  const nameId = `${base}-${action.id}-name`
  return (
    <li
      {...drag}
      className={cn(
        'min-w-0 touch-manipulation rounded-md border border-solid select-none',
        lifted ? cn(LIFTED, 'bg-surface-raised') : 'border-transparent',
      )}
    >
      <div role="group" aria-labelledby={nameId} className="flex min-w-0 items-start gap-2">
        <span id={nameId} className="sr-only">
          {name}
        </span>
        {handle}
        <span
          aria-hidden="true"
          className={cn('mt-2 shrink-0 text-sm text-secondary tabular-nums', TEXT_ISOLATE)}
        >
          {`${number}.`}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <SelectField
            id={firstId}
            label={messages['rule.actionOf'](name)}
            hideLabel
            required
            placeholder={messages['rule.chooseAction']}
            options={idOptions(types)}
            value={action.type ?? ''}
            className={cn(PILL, phone ? 'w-full' : 'w-72')}
            {...(typeProblem === undefined ? {} : { error: typeProblem })}
            onChange={(next) => {
              onType(next === '' ? null : next)
            }}
          />
          {type !== undefined && type.params.length > 0 && (
            <div className="@container min-w-0">
              <div
                className={cn('grid grid-cols-1 items-start gap-3', !phone && '@xl:grid-cols-2')}
              >
                {type.params.map((param) => {
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
                        {...(param.description === undefined
                          ? {}
                          : { description: param.description })}
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
          )}
        </div>
        <span className="mt-1 shrink-0">{menu}</span>
      </div>
    </li>
  )
}

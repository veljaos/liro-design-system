import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { RuleBuilder, ruleValueText, type RuleBuilderProps } from './rule-builder'
import {
  emptyRuleDraft,
  ruleProblemKey,
  type RuleAction,
  type RuleActionType,
  type RuleCondition,
  type RuleDraft,
  type RuleField,
  type RuleOperator,
  type RuleTrigger,
} from './rule-builder-logic'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/* Fictitious: a small office's rules for incoming bills. */

const TRIGGERS: RuleTrigger[] = [
  { id: 'bill-posted', label: 'A bill is posted', group: 'Purchasing' },
  { id: 'bill-received', label: 'A bill arrives in the inbox', group: 'Purchasing' },
  { id: 'contract-expires', label: 'A contract is 30 days from its end', group: 'Contracts' },
]

const OPERATORS: RuleOperator[] = [
  { id: 'gt', label: 'is more than' },
  { id: 'lt', label: 'is less than' },
  { id: 'eq', label: 'is' },
  { id: 'ne', label: 'is not' },
  { id: 'contains', label: 'contains' },
  { id: 'before', label: 'is before' },
  { id: 'empty', label: 'is empty', noValue: true },
]

const FIELDS: RuleField[] = [
  { id: 'amount', label: 'Amount', kind: 'money', currency: 'GBP', operators: ['gt', 'lt', 'eq'] },
  {
    id: 'supplier',
    label: 'Supplier',
    kind: 'choice',
    operators: ['eq', 'ne'],
    options: [
      { value: 'harbour', label: 'Harbour Timber Ltd' },
      { value: 'north', label: 'North Cement plc' },
      { value: 'office', label: 'Office Supplies Co.' },
    ],
  },
  { id: 'lines', label: 'Number of lines', kind: 'number', operators: ['gt', 'lt'] },
  { id: 'due', label: 'Due date', kind: 'date', operators: ['before', 'empty'] },
  { id: 'reference', label: 'Reference', kind: 'text', operators: ['contains', 'empty'] },
]

const PEOPLE = [
  { value: 'ana', label: 'Ana Ward' },
  { value: 'tom', label: 'Tom Hale' },
]

const ACTIONS: RuleActionType[] = [
  {
    id: 'notify',
    label: 'Notify a person',
    params: [
      { id: 'who', label: 'Who', kind: 'choice', options: PEOPLE, required: true },
      { id: 'message', label: 'Message', kind: 'longText', description: 'Sent in the app.' },
    ],
  },
  {
    id: 'assign',
    label: 'Assign for approval',
    params: [{ id: 'who', label: 'Approver', kind: 'choice', options: PEOPLE, required: true }],
  },
  {
    id: 'hold',
    label: 'Hold the payment',
    params: [{ id: 'until', label: 'Until', kind: 'date' }],
  },
]

const RULE: RuleDraft = {
  trigger: 'bill-posted',
  branches: [
    {
      id: 'b1',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '5000' },
        {
          kind: 'group',
          id: 'g1',
          join: 'any',
          items: [
            { kind: 'condition', id: 'c2', field: 'supplier', operator: 'eq', value: 'harbour' },
            { kind: 'condition', id: 'c3', field: 'lines', operator: 'gt', value: '20' },
          ],
        },
      ],
      actions: [
        { id: 'a1', type: 'notify', params: { who: 'ana', message: 'A large bill was posted.' } },
        { id: 'a2', type: 'hold', params: { until: '2026-10-30' } },
      ],
    },
    {
      id: 'b2',
      join: 'all',
      conditions: [
        { kind: 'condition', id: 'c4', field: 'supplier', operator: 'eq', value: 'office' },
      ],
      actions: [{ id: 'a3', type: 'assign', params: { who: 'tom' } }],
    },
  ],
  otherwise: [{ id: 'a4', type: 'assign', params: { who: 'ana' } }],
}

/** The application's sentence for a rule (here the story plays the application). */
function useStorySummary(draft: RuleDraft): string {
  const { format } = useLiro()
  const trigger = TRIGGERS.find((each) => each.id === draft.trigger)
  const condition = (item: RuleCondition) => {
    const field = FIELDS.find((each) => each.id === item.field)
    const operator = OPERATORS.find((each) => each.id === item.operator)
    if (field === undefined || operator === undefined) return '…'
    const value =
      operator.noValue === true
        ? ''
        : ` ${ruleValueText(format, field.kind, item.value, field.options, field.currency)}`
    return `${field.label.toLowerCase()} ${operator.label}${value}`
  }
  const actions = (list: readonly RuleAction[]) => {
    if (list.length === 0) return 'do nothing yet'
    return list
      .map((action) => {
        const type = ACTIONS.find((each) => each.id === action.type)
        if (type === undefined) return '…'
        const who = PEOPLE.find((each) => each.value === action.params.who)?.label
        return who === undefined ? type.label.toLowerCase() : `${type.label.toLowerCase()}: ${who}`
      })
      .join(', then ')
  }
  const branches = draft.branches.map((branch, index) => {
    const parts = branch.conditions.map((item) =>
      item.kind === 'condition'
        ? condition(item)
        : `(${item.items.map(condition).join(item.join === 'all' ? ' and ' : ' or ')})`,
    )
    const test =
      parts.length === 0 ? 'always' : parts.join(branch.join === 'all' ? ' and ' : ' or ')
    return `${index === 0 ? 'if' : 'else if'} ${test}, ${actions(branch.actions)}`
  })
  const when = trigger === undefined ? 'When …' : `When ${trigger.label.toLowerCase()}`
  const otherwise = draft.otherwise === null ? '' : `; else ${actions(draft.otherwise)}`
  return `${when}, ${branches.join('; ')}${otherwise}.`
}

/** The builder with the rule kept as the application keeps it. */
function Editable(props: Omit<RuleBuilderProps, 'value' | 'onChange'> & { initial: RuleDraft }) {
  const { initial, ...rest } = props
  const [draft, setDraft] = useState(initial)
  const summary = useStorySummary(draft)
  return (
    <RuleBuilder {...rest} value={draft} onChange={setDraft} summary={rest.summary ?? summary} />
  )
}

const COMMON = {
  label: 'Rule',
  triggers: TRIGGERS,
  fields: FIELDS,
  operators: OPERATORS,
  actionTypes: ACTIONS,
}

const meta = {
  title: 'Components/Administration/RuleBuilder',
  component: Editable,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an automation rule as blocks (P5.93, like Zapier or Make) — **When** ' +
          '(what starts it), **If** (each condition a sentence of pills: [Number of lines] [is ' +
          'more than] [20]; joined by "All of these" or "Any of these", groups one level deep) ' +
          'with its **Then** (the actions in order), further **Else if** blocks each with its ' +
          'own Then, and **Else**. "In words" stays at the top (`summary`, the application’s). ' +
          'No "Field / Test / Value" labels on the screen: each pill is named in full for ' +
          'assistive technology ("Condition 2: field"). The triggers, fields, tests, values’ ' +
          'kinds and actions are the application’s data; the builder reports the edited rule ' +
          '(`RuleDraft`: `branches` and `otherwise`) and never evaluates it; the application’s ' +
          '`problems` stand under their pills. Each item has its menu (Move up, Move down, ' +
          'Remove); conditions and actions are also reordered by dragging their row (announced). ' +
          'The focus follows. Read-only shows the rule as text. Phones: the blocks stacked, the ' +
          'pills wrapping.\n\n' +
          '**When to use:** "When X happens, if Y, do Z" — notifications, assignments, holds. ' +
          '**When not:** filtering a list (FilterBar); a process with steps and branches ' +
          '(Diagram); a single on/off setting (SettingsPage).',
      },
    },
  },
  args: { ...COMMON, initial: RULE, layout: 'desktop' },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-4xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof Editable>

export default meta

type Story = StoryObj<typeof meta>

/** A rule being edited: a condition, a group of two, two actions; the rule in words above. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('status')[0]).toHaveTextContent(
      'When a bill is posted, if amount is more than',
    )
    await expect(canvas.getByRole('group', { name: 'Group 1' })).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Condition 1: field' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Options: Condition 1' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Else if 1' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Else' })).toBeVisible()
  },
}

/** A new rule: nothing chosen yet. */
export const Empty: Story = {
  name: 'New rule',
  args: { initial: emptyRuleDraft() },
}

/** The application's problems under their fields. */
export const Problems: Story = {
  name: 'With problems',
  args: {
    initial: {
      ...RULE,
      branches: [
        {
          id: 'b1',
          join: 'all',
          conditions: [
            { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: null },
            ...(RULE.branches[0]?.conditions.slice(1) ?? []),
          ],
          actions: [{ id: 'a1', type: 'notify', params: { who: null, message: null } }],
        },
      ],
      otherwise: null,
    },
    problems: {
      [ruleProblemKey('c1', 'value')]: 'Enter the amount.',
      [ruleProblemKey('a1', 'who')]: 'Choose who is notified.',
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Enter the amount.')).toBeVisible()
    await expect(canvas.getByText('Choose who is notified.')).toBeVisible()
  },
}

/** The rule as text: a rule that cannot be changed here (P5.93: no disabled state). */
export const ReadOnly: Story = {
  name: 'Read only',
  args: { readOnly: true },
}

/** The application is loading the rule. */
export const Loading: Story = {
  args: { loading: true },
}

/** Long names wrap. */
export const LongText: Story = {
  tags: ['!dev'],
  name: 'Long text',
  args: {
    triggers: [
      {
        id: 'bill-posted',
        label:
          'A bill from a supplier is posted to the purchase ledger after its approval by the site manager',
      },
    ],
    fields: FIELDS.map((field) =>
      field.id === 'amount'
        ? { ...field, label: 'Amount including tax, in the currency of the bill' }
        : field,
    ),
  },
}

/** Phone width: the blocks stacked, the pills wrapping. */
export const Phone: Story = {
  args: { layout: 'phone' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/**
 * From the keyboard: add a condition (the focus goes to its field pill), choose the field and the
 * test (no value for "is empty"); move it up by its menu (the focus comes back to the menu),
 * remove it (the focus goes to the item in its place); add an action, an Else if and an Else.
 */
export const Keyboard: Story = {
  name: 'Add, move and remove, interaction',
  tags: ['interaction', '!dev'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const ifBlock = canvas.getByRole('group', { name: 'If' })
    await userEvent.click(within(ifBlock).getByRole('button', { name: 'Add condition' }))
    const field = canvas.getByRole('combobox', { name: 'Condition 2: field' })
    await waitFor(async () => {
      await expect(field).toHaveFocus()
    })
    await userEvent.click(field)
    await userEvent.click(await body.findByRole('option', { name: 'Due date' }))
    await userEvent.click(await canvas.findByRole('combobox', { name: 'Condition 2: test' }))
    await userEvent.click(await body.findByRole('option', { name: 'is empty' }))
    await expect(canvas.queryByLabelText('Condition 2: value')).toBeNull()
    // The list closes first (the page is hidden from assistive technology while it is open).
    await waitFor(async () => {
      await expect(canvas.getAllByRole('status')[0]).toHaveTextContent('due date is empty')
    })
    // Up one place, before the group, by the menu: announced, the focus back on the menu.
    await userEvent.click(canvas.getByRole('button', { name: 'Options: Condition 2' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Move up: Condition 2' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Options: Condition 2' })).toHaveFocus()
    })
    await expect(canvas.getByText('Condition 2 moved, position 2 of 3')).toBeInTheDocument()
    // Removed: the group, now in its place, takes the focus.
    await userEvent.click(canvas.getByRole('button', { name: 'Options: Condition 2' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Remove: Condition 2' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Options: Group 1' })).toHaveFocus()
    })
    await userEvent.click(within(ifBlock).getByRole('button', { name: 'Add action' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('combobox', { name: 'Action 3: action' })).toHaveFocus()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Add Else if' }))
    await expect(canvas.getByRole('group', { name: 'Else if 2' })).toBeVisible()
  },
}

/** Dragging an action's row above the other: the order is reported and announced. */
export const Drag: Story = {
  name: 'Reorder by dragging, interaction',
  tags: ['interaction', '!dev'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const second = canvasElement.querySelector<HTMLElement>('[data-drop-item="a2"]')
    const firstRow = canvasElement.querySelector<HTMLElement>('[data-drop-item="a1"]')
    const grip = second?.querySelector('svg')
    if (second === null || firstRow === null || grip === null || grip === undefined) {
      throw new Error('no rows')
    }
    const from = grip.getBoundingClientRect()
    const to = firstRow.getBoundingClientRect()
    const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 }
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: grip, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x, clientY: start.y - 6 } },
      { coords: { clientX: start.x, clientY: to.top + 4 } },
      { keys: '[/MouseLeft]', coords: { clientX: start.x, clientY: to.top + 4 } },
    ])
    await waitFor(async () => {
      await expect(canvas.getAllByRole('status')[0]).toHaveTextContent(
        'hold the payment, then notify a person: Ana Ward',
      )
    })
    await expect(canvas.getByText('Action 1 moved, position 1 of 2')).toBeInTheDocument()
  },
}

/** Arabic. */
export const Arabic: Story = {
  tags: ['!dev'],
  args: {
    triggers: [{ id: 'bill-posted', label: 'تم ترحيل فاتورة' }],
    fields: [{ id: 'amount', label: 'المبلغ', kind: 'money', currency: 'GBP', operators: ['gt'] }],
    operators: [{ id: 'gt', label: 'أكبر من' }],
    actionTypes: [
      {
        id: 'notify',
        label: 'إشعار شخص',
        params: [
          { id: 'who', label: 'من', kind: 'choice', options: [{ value: 'ana', label: 'آنا' }] },
        ],
      },
    ],
    initial: {
      trigger: 'bill-posted',
      branches: [
        {
          id: 'b1',
          join: 'all',
          conditions: [
            { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '5000' },
          ],
          actions: [{ id: 'a1', type: 'notify', params: { who: 'ana' } }],
        },
      ],
      otherwise: null,
    },
    summary: 'عند ترحيل فاتورة، إذا كان المبلغ أكبر من 5000، أبلغ آنا.',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  args: {
    triggers: [{ id: 'bill-posted', label: '請求書が計上された' }],
    fields: [{ id: 'amount', label: '金額', kind: 'money', currency: 'GBP', operators: ['gt'] }],
    operators: [{ id: 'gt', label: 'より大きい' }],
    actionTypes: [
      {
        id: 'notify',
        label: '担当者に通知',
        params: [
          {
            id: 'who',
            label: '通知先',
            kind: 'choice',
            options: [{ value: 'ana', label: '佐藤 花子' }],
          },
        ],
      },
    ],
    initial: {
      trigger: 'bill-posted',
      branches: [
        {
          id: 'b1',
          join: 'all',
          conditions: [
            { kind: 'condition', id: 'c1', field: 'amount', operator: 'gt', value: '5000' },
          ],
          actions: [{ id: 'a1', type: 'notify', params: { who: 'ana' } }],
        },
      ],
      otherwise: null,
    },
    summary: '請求書が計上され、金額が5000より大きい場合、佐藤 花子に通知します。',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

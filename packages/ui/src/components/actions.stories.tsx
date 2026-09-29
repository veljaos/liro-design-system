import type { Meta, StoryObj } from '@storybook/react-vite'
import { Send } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ActionGroup, UnavailableAction, type ActionItem } from './actions'
import { ARABIC, JAPANESE } from './field-story-data'

const meta = {
  title: 'Components/Actions/ActionGroup',
  component: ActionGroup,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the actions of a form, a page header or a dialog, in order with the ' +
          'main action last (AGENTS.md D13), at the end of the row by default (`align="start"` ' +
          'only beside text). When the row is too narrow, the actions before the main one move ' +
          'into a "More" menu and the main action stays. An action with `unavailableReason` is ' +
          '**UnavailableAction**: greyed, still reachable by keyboard, with its reason written ' +
          'beside it and in a tooltip on hover, focus and touch — never only a grey button.\n\n' +
          '**When not:** actions of a table row (a row menu, DropdownMenu); a choice between ' +
          'options (fields).',
      },
    },
  },
  args: { actions: [] },
  play: settle,
} satisfies Meta<typeof ActionGroup>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

const FORM: ActionItem[] = [
  { key: 'delete', intent: 'delete', label: 'Delete', onClick: noop },
  { key: 'pdf', intent: 'pdf', label: 'PDF', emphasis: 'secondary', onClick: noop },
  { key: 'cancel', intent: 'cancel', label: 'Cancel', onClick: noop },
  { key: 'save', intent: 'save', label: 'Save', onClick: noop },
]

/** At the end of a form: the main action (Save) last. */
export const Default: Story = {
  render: () => <ActionGroup actions={FORM} />,
}

/** Beside text: aligned to the start. */
export const Start: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-sm text-secondary">3 invoices are ready to send.</p>
      <ActionGroup
        align="start"
        actions={[
          { key: 'view', intent: 'view', label: 'Review', onClick: noop },
          {
            key: 'send',
            family: 'verify',
            icon: Send,
            emphasis: 'primary',
            label: 'Send',
            onClick: noop,
          },
        ]}
      />
    </div>
  ),
}

/** Narrow row: the first actions move into "More"; the main action stays last and visible. */
export const Overflow: Story = {
  name: 'Overflow into More',
  render: () => (
    <div className="w-[300px] max-w-full rounded-md border border-default p-2">
      <ActionGroup actions={FORM} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const more = await canvas.findByRole('button', { name: 'More actions' })
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible()
    await userEvent.click(more)
    await within(canvasElement.ownerDocument.body).findByRole('menuitem', { name: /Delete/ })
    await settle()
  },
}

/**
 * Long labels at phone width: the actions before the main one move into "More" first; only the
 * main action, alone and still too wide, wraps its label (P2.7d).
 */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full rounded-md border border-default p-2">
      <ActionGroup
        actions={[
          {
            key: 'cancel',
            intent: 'cancel',
            label: 'Cancel and return to the list',
            onClick: noop,
          },
          {
            key: 'draft',
            intent: 'save',
            emphasis: 'secondary',
            label: 'Save as a draft for later',
            onClick: noop,
          },
          {
            key: 'send',
            family: 'positive',
            icon: Send,
            emphasis: 'primary',
            label: 'Send the delivery note to the customer and to the warehouse',
            onClick: noop,
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('button', { name: 'More actions' })
    const send = canvas.getByRole('button', { name: /Send the delivery note/ })
    await expect(send).toBeVisible()
    // Wrapped: taller than one 36px line, and within the row.
    await expect(send.getBoundingClientRect().height).toBeGreaterThan(36)
    await expect(send.getBoundingClientRect().width).toBeLessThanOrEqual(390)
    await settle()
  },
}

/**
 * An unavailable action with its reason at phone width (BUILD-PLAN P2.7 "Done when"): the reason
 * is written, focusable with the keyboard, and shown in a tooltip on focus.
 */
export const UnavailablePhone: Story = {
  name: 'Unavailable, phone width',
  render: () => (
    <div className="flex min-h-40 w-[390px] max-w-full flex-col gap-4">
      <ActionGroup
        align="start"
        actions={[
          { key: 'edit', intent: 'edit', label: 'Edit', onClick: noop },
          {
            key: 'post',
            family: 'positive',
            icon: Send,
            emphasis: 'primary',
            label: 'Post',
            unavailableReason: 'The period August 2026 is closed.',
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const post = canvas.getByRole('button', { name: 'Post' })
    await expect(post).toHaveAttribute('aria-disabled', 'true')
    await expect(post).toHaveAccessibleDescription(/The period August 2026 is closed/)
    post.focus()
    await waitFor(() =>
      expect(within(canvasElement.ownerDocument.body).getByRole('tooltip')).toBeVisible(),
    )
    await settle()
  },
}

/** Arabic sample text, right to left: the actions at the end (left), the main one last. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex flex-col gap-4">
      <ActionGroup
        actions={[
          { key: 'cancel', intent: 'cancel', label: ARABIC.options[0] ?? '', onClick: noop },
          { key: 'save', intent: 'save', label: ARABIC.options[1] ?? '', onClick: noop },
        ]}
      />
      <UnavailableAction intent="delete" label={ARABIC.options[2] ?? ''} reason={ARABIC.reason} />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex flex-col gap-4">
      <ActionGroup
        actions={[
          { key: 'cancel', intent: 'cancel', label: JAPANESE.options[0] ?? '', onClick: noop },
          { key: 'save', intent: 'save', label: JAPANESE.options[1] ?? '', onClick: noop },
        ]}
      />
      <UnavailableAction
        intent="delete"
        label={JAPANESE.options[2] ?? ''}
        reason={JAPANESE.reason}
      />
    </div>
  ),
}

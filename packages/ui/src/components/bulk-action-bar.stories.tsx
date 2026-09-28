import type { Meta, StoryObj } from '@storybook/react-vite'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { BulkActionBar, type BulkAction } from './bulk-action-bar'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Actions/BulkActionBar',
  component: BulkActionBar,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** acting on the selected rows of a list at once. It slides in when a row ' +
          'is selected: a way to clear the selection, the count (announced to screen readers), ' +
          '"Select all N" when the result is larger, and the actions at the end, small. An ' +
          'action that needs confirmation asks ONCE for the whole selection, with the count ' +
          '(Appendix B.8: confirmation does not scale). While an action runs, all are disabled.' +
          '\n\n**When not:** an action on one row (its row menu); selecting itself (the table, ' +
          'P3.1).',
      },
    },
  },
  args: { count: 0, onClear: () => undefined, actions: [] },
  play: settle,
} satisfies Meta<typeof BulkActionBar>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

const ACTIONS: BulkAction[] = [
  { key: 'export', intent: 'export', label: 'Export', onClick: noop },
  { key: 'send', family: 'verify', icon: Send, label: 'Send', onClick: noop, confirm: true },
  { key: 'delete', intent: 'delete', label: 'Delete', onClick: noop },
]

/** Three of 1,234 rows selected. */
export const Default: Story = {
  render: () => (
    <BulkActionBar count={3} total={1234} onSelectAll={noop} onClear={noop} actions={ACTIONS} />
  ),
}

/** Delete asks once, with the count; the count changes are announced. */
export const ConfirmOnce: Story = {
  name: 'Confirm once for the selection',
  render: function Render() {
    const [count, setCount] = useState(3)
    const [done, setDone] = useState('nothing')
    return (
      <div className="flex min-h-60 flex-col gap-3">
        <BulkActionBar
          count={count}
          total={40}
          onSelectAll={() => {
            setCount(40)
          }}
          onClear={() => {
            setCount(0)
          }}
          actions={ACTIONS.map((action) => ({
            ...action,
            onClick: () => {
              setDone(action.label)
            },
          }))}
        />
        <p className="m-0 text-sm text-secondary">
          Done: <code>{done}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    // The bar slides in (140ms): wait until it is shown before checking.
    await settle()
    await userEvent.click(canvas.getByRole('button', { name: 'Select all 40' }))
    await waitFor(() => expect(canvas.getByText('40 selected')).toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
    const dialog = await body.findByRole('alertdialog', { name: 'Apply to 40 items?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    await expect(canvas.getByText('Delete', { selector: 'code' })).toBeVisible()
  },
}

/** While an action runs every action is disabled; one is unavailable with its reason. */
export const LoadingAndUnavailable: Story = {
  name: 'Loading, and an unavailable action',
  render: () => (
    <div className="flex flex-col gap-4">
      <BulkActionBar count={5} onClear={noop} loading actions={ACTIONS} />
      <BulkActionBar
        count={5}
        onClear={noop}
        actions={[
          { key: 'export', intent: 'export', label: 'Export', onClick: noop },
          {
            key: 'post',
            family: 'positive',
            icon: Send,
            label: 'Post',
            unavailableReason: 'Two of the rows are already posted.',
          },
        ]}
      />
    </div>
  ),
}

/** Phone width: the bar wraps; the actions move under the count. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <BulkActionBar
        count={12345}
        total={67890}
        onSelectAll={noop}
        onClear={noop}
        actions={[...ACTIONS, { key: 'long', intent: 'confirm', label: LONG.label, onClick: noop }]}
      />
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <BulkActionBar
        count={3}
        total={40}
        onSelectAll={noop}
        onClear={noop}
        actions={ARABIC.options.map((label, index) => ({
          key: label,
          intent: index === 2 ? 'delete' : 'export',
          label,
          onClick: noop,
        }))}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <BulkActionBar
        count={3}
        onClear={noop}
        actions={JAPANESE.options.map((label, index) => ({
          key: label,
          intent: index === 2 ? 'delete' : 'export',
          label,
          onClick: noop,
        }))}
      />
    </StoryProvider>
  ),
}

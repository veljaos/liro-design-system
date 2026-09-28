import type { Meta, StoryObj } from '@storybook/react-vite'
import { Info } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button, IconButton } from './button'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { Popover, Tooltip } from './popover'
import { StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a little more next to a control — details, a short choice, a small ' +
          'form — without leaving the page. Not modal: the rest of the page stays usable; ' +
          'Escape or a press outside closes it and the focus returns to the trigger. Give it a ' +
          '`label` when its content has no heading.\n\n' +
          '**When not:** a hint of a few words (Tooltip); an action with an outcome (Dialog); a ' +
          'list of actions (DropdownMenu).',
      },
    },
  },
  args: { trigger: <Button intent="view" label="Details" />, children: null },
  play: settle,
} satisfies Meta<typeof Popover>

export default meta

type Story = StoryObj<typeof meta>

const DETAILS = (
  <div className="flex max-w-64 flex-col gap-1">
    <strong className="text-sm font-semibold">Alfa Trade d.o.o.</strong>
    <span className="text-sm text-secondary">Customer since 2019, 214 invoices.</span>
  </div>
)

/** Opens under its trigger; Escape closes it and the focus returns. */
export const Default: Story = {
  render: () => (
    <div className="flex min-h-40 justify-center">
      <Popover trigger={<Button intent="view" label="Details" />} label="Customer details">
        {DETAILS}
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = body.getByRole('button', { name: 'Details' })
    await userEvent.click(trigger)
    await body.findByRole('dialog', { name: 'Customer details' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(trigger)
    await body.findByRole('dialog')
    await settle()
  },
}

/** Aligned with the start or the end of its trigger. */
export const Alignment: Story = {
  render: () => (
    <div className="flex min-h-40 justify-between gap-4">
      <Popover
        trigger={<Button intent="view" label="Start" />}
        align="start"
        label="Start"
        defaultOpen
      >
        {DETAILS}
      </Popover>
      <Popover trigger={<Button intent="view" label="End" />} align="end" label="End">
        {DETAILS}
      </Popover>
    </div>
  ),
}

/** Long text at phone width: the popover never leaves the screen and its text wraps. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="min-h-60 w-[390px] max-w-full">
      <Popover trigger={<Button intent="view" label={LONG.label} />} label="Details" defaultOpen>
        <p className="m-0 max-w-80 text-sm">{LONG.description}</p>
      </Popover>
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex min-h-40 justify-center">
        <Popover
          trigger={<Button intent="view" label={ARABIC.label} />}
          label={ARABIC.label}
          defaultOpen
        >
          <p className="m-0 text-sm">{ARABIC.description}</p>
        </Popover>
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="flex min-h-40 justify-center">
        <Popover
          trigger={<Button intent="view" label={JAPANESE.label} />}
          label={JAPANESE.label}
          defaultOpen
        >
          <p className="m-0 text-sm">{JAPANESE.description}</p>
        </Popover>
      </div>
    </StoryProvider>
  ),
}

/**
 * Tooltip: a hint of a few words on hover and on keyboard focus, after 300ms, inverted, with an
 * arrow. It only adds a description: the target keeps its own name, and nothing a user needs to
 * act lives only in a tooltip. Sides: top (default), bottom, start and end, which follow the
 * direction.
 */
export const TooltipOnFocus: Story = {
  name: 'Tooltip, on keyboard focus',
  render: () => (
    <div className="flex min-h-30 items-center justify-center gap-6">
      <Tooltip label="Shows the payment terms">
        <IconButton family="neutral" icon={Info} label="Payment terms" />
      </Tooltip>
      <Tooltip label="Bottom" side="bottom">
        <Button intent="view" label="Bottom" />
      </Tooltip>
      <Tooltip label="Start" side="start">
        <Button intent="view" label="Start" />
      </Tooltip>
      <Tooltip label="End" side="end">
        <Button intent="view" label="End" />
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const target = body.getByRole('button', { name: 'Payment terms' })
    await userEvent.tab()
    await expect(target).toHaveFocus()
    const tip = await body.findByRole('tooltip')
    await expect(tip).toHaveTextContent('Shows the payment terms')
    await expect(target).toHaveAccessibleDescription('Shows the payment terms')
    await settle()
  },
}

/** Tooltip with Arabic and Japanese sample text. */
export const TooltipScripts: Story = {
  name: 'Tooltip, Arabic and Japanese',
  render: () => (
    <div className="flex min-h-30 items-center justify-center gap-10">
      <StoryProvider locale="ar">
        <Tooltip label={ARABIC.description}>
          <Button intent="view" label={ARABIC.label} />
        </Tooltip>
      </StoryProvider>
      <StoryProvider locale="ja">
        <Tooltip label={JAPANESE.description}>
          <Button intent="view" label={JAPANESE.label} />
        </Tooltip>
      </StoryProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.tab()
    await body.findByRole('tooltip')
    await settle()
  },
}

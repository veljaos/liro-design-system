import type { Meta, StoryObj } from '@storybook/react-vite'
import { Building2, Copy, Pencil, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button, IconButton } from './button'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Overlays/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a list of actions behind one button — a row menu, "more" actions. ' +
          'Entries come as data: items (label, optional icon and shortcut, disabled, ' +
          'destructive, and a current value as a second line — "Switch company" over the company, wrapping, with a chevron), headings and separators. The arrows move through the items, Enter ' +
          'chooses, Escape closes and returns the focus to the trigger. A destructive item is ' +
          'drawn in the danger colours; its confirmation is the ConfirmDialog.\n\n' +
          '**When not:** one or two actions that fit as buttons; choosing a value (SelectField).',
      },
    },
  },
  args: { trigger: <Button intent="more" label="More" />, entries: [] },
  play: settle,
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

const ENTRIES: MenuEntry[] = [
  { type: 'label', label: 'Invoice' },
  { label: 'Edit', icon: Pencil, onSelect: noop, shortcut: 'E' },
  { label: 'Duplicate', icon: Copy, onSelect: noop, shortcut: 'Ctrl+D' },
  { label: 'Print', icon: Printer, onSelect: noop, disabled: true },
  { type: 'separator' },
  { label: 'Delete', icon: Trash2, onSelect: noop, destructive: true },
]

/** Keyboard: open with Enter, move with the arrows, choose with Enter; the focus returns. */
export const Default: Story = {
  render: function Render() {
    const [chosen, setChosen] = useState('nothing')
    const entries = ENTRIES.map((entry) =>
      entry.type === undefined || entry.type === 'item'
        ? {
            ...entry,
            onSelect: () => {
              setChosen(entry.label)
            },
          }
        : entry,
    )
    return (
      <div className="flex min-h-70 flex-col items-start gap-3">
        <DropdownMenu
          trigger={<IconButton intent="more" label="More actions" />}
          entries={entries}
        />
        <p className="m-0 text-sm text-secondary">
          Chosen: <code>{chosen}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = body.getByRole('button', { name: 'More actions' })
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    await body.findByRole('menu')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(within(canvasElement).getByText('Duplicate')).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.keyboard('{Enter}')
    await body.findByRole('menu')
    await settle()
  },
}

/** Long labels at phone width: the menu stays on screen and the labels wrap. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="min-h-60 w-[390px] max-w-full">
      <DropdownMenu
        trigger={<Button intent="more" label="More" />}
        entries={[
          { label: LONG.label, onSelect: noop, icon: Pencil },
          {
            label: 'Switch company',
            value: 'Građevinsko preduzeće Kvadrat Gradnja i partneri d.o.o. Novi Sad',
            onSelect: noop,
            icon: Building2,
          },
          { label: LONG.error, onSelect: noop, destructive: true, icon: Trash2 },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More' }))
    const menu = await within(canvasElement.ownerDocument.body).findByRole('menu')
    await settle()
    // A current value wraps onto a second line instead of ending in "…".
    const item = within(menu).getByRole('menuitem', { name: /Switch company/ })
    for (const line of item.querySelectorAll('span')) {
      await expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth)
    }
  },
}

/** Arabic sample text, right to left: the menu lines up with the trigger's start (right). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="min-h-50">
        <DropdownMenu
          trigger={<Button intent="more" label={ARABIC.label} />}
          entries={[
            { type: 'label', label: ARABIC.description },
            ...ARABIC.options.map((label) => ({ label, onSelect: noop, icon: Pencil })),
            { type: 'separator' },
            { label: ARABIC.error, onSelect: noop, destructive: true, icon: Trash2 },
          ]}
        />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    await within(canvasElement.ownerDocument.body).findByRole('menu')
    await settle()
  },
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="min-h-50">
        <DropdownMenu
          trigger={<Button intent="more" label={JAPANESE.label} />}
          entries={[
            { type: 'label', label: JAPANESE.description },
            ...JAPANESE.options.map((label) => ({ label, onSelect: noop, icon: Pencil })),
            { type: 'separator' },
            { label: JAPANESE.error, onSelect: noop, destructive: true, icon: Trash2 },
          ]}
        />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    await within(canvasElement.ownerDocument.body).findByRole('menu')
    await settle()
  },
}

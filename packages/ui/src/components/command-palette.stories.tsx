import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilePlus, FileText, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CommandPalette, type CommandItem } from './command-palette'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { ShortcutHint } from './navigation'
import { StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Navigation/CommandPalette',
  component: CommandPalette,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one place to find anything and do anything, from the keyboard: ' +
          "Ctrl/Cmd+K (or Ctrl/Cmd+P) opens it anywhere. The previous Design System's " +
          'Spotlight: a search field, actions first and places to go ("Go to") after them, the ' +
          'typed text highlighted in the results; an item matches by its label, description ' +
          'or keywords. With `onSearch` the application searches on the server (after 300ms, ' +
          'with `loading`); without it, the items are filtered here. Arrows move, Enter runs, ' +
          'Escape closes.\n\n' +
          '**When not:** choosing a value for a field (ComboboxField); the navigation itself ' +
          '(the launchpad and tabs stay visible; the palette is a shortcut).',
      },
    },
  },
  args: { items: [] },
  play: settle,
} satisfies Meta<typeof CommandPalette>

export default meta

type Story = StoryObj<typeof meta>

function items(onRun: (label: string) => void): CommandItem[] {
  const item = (
    id: string,
    label: string,
    group: CommandItem['group'],
    extra: Partial<CommandItem> = {},
  ): CommandItem => ({
    id,
    label,
    group,
    onSelect: () => {
      onRun(label)
    },
    ...extra,
  })
  return [
    item('new-invoice', 'New invoice', 'actions', { icon: FilePlus, keywords: ['bill'] }),
    item('new-customer', 'New customer', 'actions', {
      icon: Users,
      description: 'Company or person',
    }),
    item('invoices', 'Invoices', 'navigation', { icon: FileText, description: 'Sales' }),
    item('customers', 'Customers', 'navigation', { icon: Users }),
    item('settings', 'Settings', 'navigation', { icon: Settings, keywords: ['preferences'] }),
  ]
}

/** Ctrl+K opens it; typing filters and highlights; Enter runs the first result. */
export const Default: Story = {
  render: () => (
    <div className="flex min-h-110 flex-col items-start gap-3">
      <p className="m-0 flex items-center gap-2 text-sm">
        Press <ShortcutHint keys={['Ctrl', 'K']} /> to open.
      </p>
      <CommandPalette open defaultQuery="inv" items={items(() => undefined)} />
    </div>
  ),
  play: async () => {
    const body = within(document.body)
    await expect(await body.findByRole('combobox', { name: 'Search and commands' })).toHaveValue(
      'inv',
    )
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [ran, setRan] = useState('nothing')
    return (
      <div className="flex min-h-110 flex-col items-start gap-3">
        <p className="m-0 flex items-center gap-2 text-sm">
          Press <ShortcutHint keys={['Ctrl', 'K']} /> to open.
        </p>
        <p className="m-0 text-sm text-secondary">
          Ran: <code>{ran}</code>
        </p>
        <CommandPalette items={items(setRan)} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.keyboard('{Control>}k{/Control}')
    const input = await body.findByRole('combobox', { name: 'Search and commands' })
    await waitFor(() => expect(input).toHaveFocus())
    await userEvent.type(input, 'cust', { delay: 0 })
    await expect(body.getAllByRole('option')).toHaveLength(2)
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(within(canvasElement).getByText('New customer')).toBeVisible()
    await userEvent.keyboard('{Control>}p{/Control}')
    await body.findByRole('dialog')
    await userEvent.type(await body.findByRole('combobox'), 'inv', { delay: 0 })
    await settle()
  },
}

/** Nothing found. */
export const NothingFound: Story = {
  render: () => <CommandPalette open defaultQuery="xyz" items={items(() => undefined)} />,
  play: async () => {
    const body = within(document.body)
    // The palette may still be fading in (opacity counts as not visible): wait until it shows.
    await waitFor(async () => {
      await expect(body.getByText('Nothing found')).toBeVisible()
    })
    await settle()
  },
}

export const NothingFoundInteraction: Story = {
  name: 'Nothing found, interaction',
  tags: ['interaction'],
  render: () => <CommandPalette open items={items(() => undefined)} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.type(await body.findByRole('combobox'), 'xyz', { delay: 0 })
    // The palette may still be fading in (opacity counts as not visible): wait until it shows.
    await waitFor(async () => {
      await expect(body.getByText('Nothing found')).toBeVisible()
    })
    await settle()
  },
}

/** Searching on the server: `loading` while the application works. */
export const Loading: Story = {
  render: () => <CommandPalette open loading items={[]} onSearch={() => undefined} />,
}

/** Long labels and descriptions: they wrap inside the palette. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <CommandPalette
      open
      items={[
        {
          id: 'a',
          label: LONG.label,
          description: LONG.description,
          group: 'actions',
          icon: FilePlus,
          onSelect: () => undefined,
        },
        {
          id: 'b',
          label: LONG.error,
          group: 'navigation',
          icon: FileText,
          onSelect: () => undefined,
        },
      ]}
    />
  ),
}

/** Arabic sample text, right to left: the search icon at the start (right). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <CommandPalette
        open
        items={ARABIC.options.map((label, index) => ({
          id: label,
          label,
          description: ARABIC.description,
          group: index === 0 ? 'actions' : 'navigation',
          icon: FileText,
          onSelect: () => undefined,
        }))}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <CommandPalette
        open
        items={JAPANESE.options.map((label, index) => ({
          id: label,
          label,
          description: JAPANESE.description,
          group: index === 0 ? 'actions' : 'navigation',
          icon: FileText,
          onSelect: () => undefined,
        }))}
      />
    </StoryProvider>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileText, Settings, Users } from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Command',
  component: Command,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A searchable list of commands on cmdk, with the Mantine Combobox look. CommandPalette (P2.6), ComboboxField (P2.2).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Command>

export default meta

type Story = StoryObj<typeof meta>

function Items() {
  return (
    <>
      <CommandInput placeholder="Search" aria-label="Search commands" />
      <CommandList label="Results">
        <CommandEmpty>Nothing found</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem>
            <FileText aria-hidden="true" />
            Invoices
            <CommandShortcut>G I</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Users aria-hidden="true" />
            Customers
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <Settings aria-hidden="true" />
            Company settings
          </CommandItem>
          <CommandItem disabled>
            <Settings aria-hidden="true" />
            Billing (owner only)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  )
}

/** Inline, in a bordered box: search, two groups, a shortcut and a disabled item. */
export const Inline: Story = {
  args: { label: 'Commands' },
  render: (args) => (
    <div className="max-w-110 rounded-md border border-default">
      <Command {...args}>
        <Items />
      </Command>
    </div>
  ),
}

/** In a modal dialog, as the command palette. */
export const InDialog: Story = {
  args: { label: 'Commands' },
  render: (args) => (
    <CommandDialog
      defaultOpen
      title="Command palette"
      description="Search for a page or an action"
      label={args.label}
    >
      <Items />
    </CommandDialog>
  ),
}

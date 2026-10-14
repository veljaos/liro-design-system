import type { Meta, StoryObj } from '@storybook/react-vite'
import { FolderPlus, Pencil } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { FileNameDialog } from './file-name-dialog'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Files/FileNameDialog',
  component: FileNameDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one name — a new folder, or renaming a file or a folder (the item bold ' +
          'under "Rename", D22). Enter or the button saves; an empty name says so; every other ' +
          'check is the application’s, returned from `onSubmit` as its words.\n\n' +
          '**When to use:** naming a folder or a file. **When not:** a record with more fields ' +
          '(a Drawer or a full page, D14).',
      },
    },
  },
  args: {
    open: true,
    title: 'New folder',
    confirmLabel: 'Create',
    confirmIcon: FolderPlus,
    onSubmit: (): string | undefined => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof FileNameDialog>

export default meta

type Story = StoryObj<typeof meta>

/** A new folder's name. */
export const NewFolder: Story = {
  name: 'New folder',
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('dialog', { name: 'New folder' })).toBeVisible()
  },
}

/** Renaming a file: its current name to change. */
export const Rename: Story = {
  args: {
    title: 'Rename',
    subject: 'Concrete pour schedule.xlsx',
    defaultValue: 'Concrete pour schedule.xlsx',
    confirmLabel: 'Rename',
    confirmIcon: Pencil,
  },
}

/** The application's check said no: its words under the field. */
export const WithError: Story = {
  name: 'Error',
  args: { defaultValue: 'Photos', defaultError: 'A folder with this name already exists here.' },
}

/** Long names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Rename',
    subject:
      'Site handover protocol for the residential blocks C and D, signed after the second inspection round.pdf',
    defaultValue:
      'Site handover protocol for the residential blocks C and D, signed after the second inspection round.pdf',
    confirmLabel: 'Rename',
    confirmIcon: Pencil,
  },
}

/** Phone width: a bottom sheet. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: { title: 'مجلد جديد', confirmLabel: 'إنشاء', defaultValue: 'الصور' },
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
  args: { title: '新しいフォルダー', confirmLabel: '作成', defaultValue: '写真' },
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

/** An empty name says so; the application's own check comes back as its words. */
export const Errors: Story = {
  name: 'Errors, interaction',
  tags: ['interaction'],
  render: (args) => (
    <FileNameDialog
      {...args}
      onSubmit={(name) =>
        name === 'Photos' ? 'A folder with this name already exists here.' : undefined
      }
    />
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'New folder' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }))
    await expect(within(dialog).getByText('Enter a name.')).toBeVisible()
    await userEvent.type(within(dialog).getByRole('textbox', { name: /^Name/ }), 'Photos{Enter}')
    await waitFor(async () => {
      await expect(
        within(dialog).getByText('A folder with this name already exists here.'),
      ).toBeVisible()
    })
  },
}

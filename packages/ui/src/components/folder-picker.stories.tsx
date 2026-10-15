import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { FOLDERS } from './file-story-data'
import { FolderPicker, FolderPickerDialog } from './folder-picker'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import type { TreeNode } from './tree-logic'

const meta = {
  title: 'Components/Files/FolderPickerDialog',
  component: FolderPickerDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** choosing the folder to move or copy files to — the keyboard’s and the ' +
          'menu’s way for every drag onto a folder (WCAG 2.5.7). The action as the title, what ' +
          'is moved bold under it (D22), the folders as a tree with one choice (neutral), the ' +
          'destination in words, Cancel and the action. The moved folders and the folders inside ' +
          'them cannot be chosen and say why; the folder the items are in cannot be the ' +
          'destination. `FolderPicker` is the tree alone, for a form.\n\n' +
          '**When to use:** "Move to…", "Copy to…", "Save to…". **When not:** choosing a value ' +
          'in a hierarchy that is not a place for files (TreeView, FilterBar’s tree).',
      },
    },
  },
  args: {
    open: true,
    title: 'Move to',
    subject: 'Concrete pour schedule.xlsx',
    confirmLabel: 'Move here',
    nodes: FOLDERS,
    from: 'harbour',
    defaultValue: 'harbour-logs',
    onConfirm: () => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof FolderPickerDialog>

export default meta

type Story = StoryObj<typeof meta>

/** A file to move: Daily logs chosen, the destination in words. */
export const Default: Story = {
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move to Concrete pour schedule.xlsx',
    })
    await expect(
      within(dialog).getByText('Destination: Site documentation / Harbour Road site / Daily logs'),
    ).toBeVisible()
    await expect(within(dialog).getByRole('treeitem', { name: 'Daily logs' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

/** A folder moved: it and its folders cannot be chosen, and say why. */
export const MovingAFolder: Story = {
  name: 'Moving a folder',
  args: {
    subject: 'Harbour Road site',
    moving: ['harbour'],
    from: 'site',
    defaultValue: 'contracts',
    defaultExpanded: ['site', 'harbour'],
  },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getAllByText('It is one of the items being moved.')).toHaveLength(4)
  },
}

/** Still where the items are: the button says why it cannot be used. */
export const AlreadyHere: Story = {
  name: 'Already here',
  args: { defaultValue: null },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByText('The items are already in this folder.')).toBeVisible()
  },
}

/** Copying three items. */
export const Copy: Story = {
  args: { title: 'Copy to', subject: '3 items', confirmLabel: 'Copy here' },
}

const LONG: TreeNode[] = [
  {
    id: 'long',
    label: 'Site documentation for the residential blocks C and D with the underground car park',
    children: [
      {
        id: 'long-2',
        label: 'Inspections by the municipal building authority, second round',
        description: 'Read only for site managers',
        children: [],
      },
    ],
  },
]

/** Long folder names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    nodes: LONG,
    from: null,
    defaultValue: 'long-2',
    subject: 'Site handover protocol for the residential blocks C and D, second inspection.pdf',
  },
}

/** Phone width: a bottom sheet with the tree's touch rows. */
export const Phone: Story = {
  args: { layout: 'phone' },
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

/** The tree alone, for a form. */
export const PickerOnly: Story = {
  name: 'Picker only',
  render: function Render() {
    const [value, setValue] = useState<string | null>('contracts-2026')
    return (
      <div className="max-w-sm">
        <FolderPicker nodes={FOLDERS} value={value} onChange={setValue} />
      </div>
    )
  },
}

const AR: TreeNode[] = [
  {
    id: 'a',
    label: 'العقود',
    children: [{ id: 'b', label: '٢٠٢٦', children: [] }],
  },
  { id: 'c', label: 'ملفات الموظفين', children: [] },
]

/** Arabic. */
export const Arabic: Story = {
  args: {
    title: 'نقل إلى',
    subject: 'جدول الصب.xlsx',
    confirmLabel: 'نقل هنا',
    nodes: AR,
    from: 'c',
    defaultValue: 'b',
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

const JA: TreeNode[] = [
  {
    id: 'a',
    label: '契約書',
    children: [{ id: 'b', label: '2026年', children: [] }],
  },
  { id: 'c', label: '社員ファイル', children: [] },
]

/** Japanese. */
export const Japanese: Story = {
  args: {
    title: '移動先',
    subject: '打設計画.xlsx',
    confirmLabel: 'ここに移動',
    nodes: JA,
    from: 'c',
    defaultValue: 'b',
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

/** Choose a folder by the keyboard, then Move here: the folder is reported. */
export const ChooseAndMove: Story = {
  name: 'Choose and move, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [moved, setMoved] = useState('')
    return (
      <>
        <FolderPickerDialog {...args} onConfirm={setMoved} />
        <p data-testid="moved">{moved}</p>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    const logs = within(dialog).getByRole('treeitem', { name: 'Daily logs' })
    logs.focus()
    await userEvent.keyboard('{ArrowUp}{Enter}')
    await waitFor(async () => {
      await expect(within(dialog).getByRole('treeitem', { name: 'Drawings' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move here' }))
    await expect(within(canvasElement).getByTestId('moved')).toHaveTextContent('harbour-drawings')
  },
}

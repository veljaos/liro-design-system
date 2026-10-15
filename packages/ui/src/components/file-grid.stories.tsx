import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download, FolderInput, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { FileEntry } from './file-browser-logic'
import { FileGrid } from './file-grid'
import { HARBOUR, PHOTOS, photoUri } from './file-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Grid(props: Parameters<typeof FileGrid>[0] & { defaultSelection?: string[] }) {
  const { defaultSelection, ...rest } = props
  const [selection, setSelection] = useState<string[]>(defaultSelection ?? [])
  const [opened, setOpened] = useState('')
  return (
    <>
      <FileGrid
        {...rest}
        selection={selection}
        onSelectionChange={setSelection}
        onOpen={(entry) => {
          setOpened(entry.name)
        }}
      />
      <p data-testid="opened" className="sr-only">
        {opened}
      </p>
    </>
  )
}

const MENU = () => [
  { label: 'Download', icon: Download, onSelect: () => undefined },
  { label: 'Move to…', icon: FolderInput, onSelect: () => undefined },
  { label: 'Delete', icon: Trash2, destructive: true, onSelect: () => undefined },
]

const meta = {
  title: 'Components/Files/FileGrid',
  component: Grid,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** files and folders as tiles with a picture — photos from a site, scans ' +
          '— where seeing the file helps choosing it. Checked tiles are neutral (surface.selected ' +
          'with a border.selected border); the tiles are one tab stop: the arrows move, Space ' +
          'checks, Shift+arrows extend, Ctrl/Cmd+A checks all, Enter opens; Tab reaches the ' +
          'focused tile’s menu.\n\n' +
          '**When to use:** FileBrowser’s grid view, a folder of pictures. **When not:** ' +
          'documents read by their names, owners and dates (the list, DataTable); products at a ' +
          'till (ProductGrid).',
      },
    },
  },
  args: { label: 'Photos', entries: PHOTOS, actions: MENU },
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
} satisfies Meta<typeof Grid>

export default meta

type Story = StoryObj<typeof meta>

/** Eight photos with their pictures, sizes and times. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(canvasElement).getByRole('list', { name: 'Photos' })
    await expect(grid.querySelectorAll('[data-file-tile]')).toHaveLength(8)
    await expect(within(grid).getAllByRole('button', { name: /^IMG_/ })[0]).toHaveAttribute(
      'tabindex',
      '0',
    )
  },
}

/** Folders and files mixed: folders show their items, files their family's icon. */
export const Mixed: Story = {
  args: { label: 'Harbour Road site', entries: HARBOUR },
}

/** Two tiles checked. */
export const Checked: Story = {
  args: { defaultSelection: ['photo-2', 'photo-5'] },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelectorAll('[data-liro-surface="selected"]')).toHaveLength(2)
  },
}

/** The folder loads. */
export const Loading: Story = {
  args: { loading: true },
}

/** Long names wrap to two lines. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    entries: [
      {
        id: 'long',
        name: 'Progress photo of the residential block C, northern facade, after the second concrete pour.jpg',
        kind: 'file',
        modified: '2026-10-14T08:50:00+02:00',
        size: '12.4',
        sizeUnit: 'MB',
        thumbnail: photoUri(3),
        badges: [{ label: 'Used in the monthly report to Harbour Homes Ltd.', tone: 'neutral' }],
      },
      ...PHOTOS.slice(0, 3),
    ],
  },
}

/** Phone width: two tiles a row. */
export const Phone: Story = {
  args: { entries: PHOTOS.slice(0, 4) },
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

const FOREIGN = (names: string[], unit: string): FileEntry[] =>
  names.map((name, index) => ({
    id: `f-${String(index)}`,
    name,
    kind: 'file',
    size: '2.4',
    sizeUnit: unit,
    modified: '2026-10-14T08:50:00+02:00',
    thumbnail: photoUri(index),
  }))

/** Arabic. */
export const Arabic: Story = {
  args: {
    label: 'الصور',
    entries: FOREIGN(['صورة الموقع ١.jpg', 'صورة الموقع ٢.jpg', 'الرافعة.jpg'], 'ميغابايت'),
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
  args: {
    label: '写真',
    entries: FOREIGN(['現場写真 1.jpg', '現場写真 2.jpg', 'クレーン点検.jpg'], 'MB'),
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

/** The keyboard: arrows move, Space checks, Shift+arrow extends, Ctrl+A all, Enter opens. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const tiles = canvas.getAllByRole('button', { name: /^IMG_/ })
    tiles[0]?.focus()
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('checkbox', { name: /^Select IMG_20261014_812/ })).toBeChecked()
    // Forward in the reading direction: ArrowRight in left-to-right, ArrowLeft in right-to-left.
    const forward =
      getComputedStyle(tiles[0] ?? canvasElement).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    await userEvent.keyboard(`{Shift>}{${forward}}{/Shift}`)
    await expect(canvasElement.querySelectorAll('[data-liro-surface="selected"]')).toHaveLength(2)
    await expect(tiles[1]).toHaveFocus()
    await userEvent.keyboard('{Control>}a{/Control}')
    await expect(canvasElement.querySelectorAll('[data-liro-surface="selected"]')).toHaveLength(8)
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('opened')).toHaveTextContent('IMG_20261014_819.jpg')
    await userEvent.keyboard('{Tab}')
    await expect(
      canvas.getByRole('button', { name: 'Actions: IMG_20261014_819.jpg' }),
    ).toHaveFocus()
  },
}

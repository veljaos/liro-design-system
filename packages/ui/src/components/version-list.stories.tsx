import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CURRENT_VERSION, VERSIONS } from './file-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { VersionList } from './version-list'

const meta = {
  title: 'Components/Files/VersionList',
  component: VersionList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a file’s versions, newest first — when, who, its size and the ' +
          'application’s note — with Download, Restore (asks first; the caution family) and ' +
          '“Upload a new version”. Restore and upload can be unavailable with the application’s ' +
          'reason.\n\n' +
          '**When to use:** the Versions panel of a file’s details. **When not:** a record’s ' +
          'history of changes (HistoryList); versions of a legal act (LegalActPage).',
      },
    },
  },
  args: {
    versions: VERSIONS,
    onDownload: () => undefined,
    onRestore: () => undefined,
    onUpload: () => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-sm">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof VersionList>

export default meta

type Story = StoryObj<typeof meta>

/** Three versions; the current one has only Download. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Current')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Restore Version 3' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Restore Version 2' })).toBeVisible()
  },
}

/** A signed document keeps its versions: Restore and upload say why not. */
export const Unavailable: Story = {
  args: {
    restoreUnavailable: 'A signed document keeps its versions as they are.',
    uploadUnavailable: 'A signed document cannot get a new version.',
  },
}

/** The versions load. */
export const Loading: Story = {
  args: { loading: true },
}

/** Only one version. */
export const Empty: Story = {
  args: { versions: [] },
}

/** Long notes and names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    versions: [
      {
        ...CURRENT_VERSION,
        by: 'Grace Lin-Fairweather, project manager for the northern sites',
        note: 'Signed by both parties after the second inspection round, with the corrected list of defects',
      },
      ...VERSIONS.slice(1),
    ],
  },
}

/** Phone width. */
export const Phone: Story = {
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

/** Arabic. */
export const Arabic: Story = {
  args: {
    label: 'الإصدارات',
    versions: [
      {
        id: '2',
        label: 'الإصدار 2',
        at: '2026-10-12T14:05:00+02:00',
        by: 'سارة حداد',
        current: true,
      },
      { id: '1', label: 'الإصدار 1', at: '2026-10-01T09:00:00+02:00', by: 'عمر خليل' },
    ],
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
    label: 'バージョン',
    versions: [
      {
        id: '2',
        label: 'バージョン 2',
        at: '2026-10-12T14:05:00+02:00',
        by: '山田 花子',
        current: true,
      },
      { id: '1', label: 'バージョン 1', at: '2026-10-01T09:00:00+02:00', by: '佐藤 一郎' },
    ],
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

/** Restore asks first, with the version as its subject; Restore reports it. */
export const Restore: Story = {
  name: 'Restore, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [restored, setRestored] = useState('')
    return (
      <>
        <VersionList
          {...args}
          onRestore={(version) => {
            setRestored(version.label)
          }}
        />
        <p data-testid="restored" dir="auto">
          {restored}
        </p>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Restore Version 2' }))
    const dialog = await within(document.body).findByRole('alertdialog', {
      name: /^Restore this version\? Version 2/,
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Restore' }))
    await expect(canvas.getByTestId('restored')).toHaveTextContent('Version 2')
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('alertdialog')).toBeNull()
    })
  },
}

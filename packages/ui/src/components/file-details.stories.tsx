import type { Meta, StoryObj } from '@storybook/react-vite'
import { Share2 } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { FileDetails } from './file-details'
import { HANDOVER, LOGS, VERSIONS } from './file-story-data'
import { SignerList } from './signer-list'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { VersionList } from './version-list'

/** A file's full details: facts, signing, versions, activity. */
const FULL = {
  created: '2026-10-01T09:00:00+02:00',
  retention: 'Keep until 2036',
  tags: ['Handover', 'Harbour Road'],
  actions: (
    <>
      <Button intent="download" label="Download" />
      <Button family="neutral" icon={Share2} label="Share…" />
    </>
  ),
  signing: (
    <SignerList
      signers={[
        {
          id: 'lin',
          name: 'Grace Lin',
          role: 'Project manager',
          state: 'signed',
          at: '2026-10-12T13:40:00+02:00',
        },
        { id: 'grant', name: 'Oliver Grant', role: 'Harbour Homes Ltd.', state: 'waiting' },
      ]}
    />
  ),
  versions: <VersionList versions={VERSIONS} onDownload={() => undefined} />,
  versionCount: 3,
  activity: [
    { key: '1', author: 'Grace Lin', time: '12.10.2026. 13:40', text: 'Signed' },
    { key: '2', author: 'Tom Hughes', time: '08.10.2026. 10:22', text: 'Uploaded version 2' },
  ],
}

const meta = {
  title: 'Components/Files/FileDetails',
  component: FileDetails,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** everything about one file or folder, in FileBrowser’s details column: ' +
          'type, size, owner, created and modified, location, the retention label in the ' +
          'application’s words, tags; the records it is linked to; its signing (SignerList), ' +
          'versions (VersionList), who has access and its activity — each a collapsible panel ' +
          '(SidePanels).\n\n' +
          '**When to use:** the details of an item in a file view. **When not:** a record’s own ' +
          'page (DetailPage); the attachments of a record (AttachmentList).',
      },
    },
  },
  args: { entry: HANDOVER, onClose: () => undefined },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="w-80">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof FileDetails>

export default meta

type Story = StoryObj<typeof meta>

/** A signed-by-one PDF: its facts, retention, the order it belongs to, the signers. */
export const Default: Story = {
  args: FULL,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Site handover protocol.pdf',
    )
    await expect(canvas.getByText('Keep until 2036')).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Order SO-2026-118' })).toBeVisible()
    await expect(canvas.getByText('1 of 2 signed')).toBeVisible()
  },
}

/** Every panel open, versions and activity too. */
export const AllOpen: Story = {
  name: 'All panels open',
  args: {
    ...FULL,
    defaultOpen: ['details', 'links', 'signing', 'versions', 'sharing', 'activity'],
  },
}

/** A folder: its items in place of a size; no signing or versions. */
export const Folder: Story = {
  args: { entry: LOGS, activity: FULL.activity },
}

/** Long names and labels. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...FULL,
    entry: {
      ...HANDOVER,
      name: 'Site handover protocol for the residential blocks C and D, signed after the second inspection round.pdf',
      owner: 'Grace Lin-Fairweather, project manager for the northern sites',
    },
    retention:
      'Keep for ten years after the end of the warranty period, then review with the archive',
  },
}

/** Phone width (in FileBrowser it stands in a Drawer). */
export const Phone: Story = {
  args: FULL,
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
    entry: {
      id: 'a',
      name: 'محضر التسليم.pdf',
      kind: 'file',
      typeLabel: 'مستند PDF',
      owner: 'سارة حداد',
      size: '1.8',
      sizeUnit: 'ميغابايت',
      modified: '2026-10-12T14:05:00+02:00',
    },
    retention: 'يُحفظ حتى 2036',
    tags: ['التسليم'],
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="w-80">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    entry: {
      id: 'j',
      name: '引き渡し記録.pdf',
      kind: 'file',
      typeLabel: 'PDF 文書',
      owner: '山田 花子',
      size: '1.8',
      sizeUnit: 'MB',
      modified: '2026-10-12T14:05:00+02:00',
    },
    retention: '2036年まで保管',
    tags: ['引き渡し'],
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="w-80">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { DocumentFrame } from './document-frame'
import { CONTRACT_VIEWER } from './document-frame-story-data'
import { FilePreview } from './file-preview'
import { PHOTOS, photoUri } from './file-story-data'
import { PageViewer } from './page-viewer'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The third of twelve files, a PDF in DocumentFrame. */
const PDF = {
  name: 'Employment contract RU-2026-017.pdf',
  description: 'PDF · 214 KB · Grace Lin',
  index: 3,
  total: 12,
  onPrevious: () => undefined,
  onNext: () => undefined,
  actions: <Button family="neutral" icon={Share2} label="Share…" />,
  children: (
    <DocumentFrame
      title="Employment contract RU-2026-017"
      srcDoc={CONTRACT_VIEWER}
      allowedOrigin="null"
      className="h-full min-h-[24rem]"
    />
  ),
}

const meta = {
  title: 'Components/Files/FilePreview',
  component: FilePreview,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one file on the whole screen with the previous and next file of its ' +
          'folder (“3 of 12”, the arrows by the reading direction), Download and the ' +
          'application’s actions. The viewer is the application’s: a PDF or an office file in ' +
          'DocumentFrame, a photo or a scan in PageViewer; a file without a preview says so, with ' +
          'Download.\n\n' +
          '**When to use:** previewing files of a folder or a list of attachments. **When not:** ' +
          'a document beside the values read from it (PageViewer in the review); a document to ' +
          'sign (SigningPage).',
      },
    },
  },
  args: {
    open: true,
    name: 'Employment contract RU-2026-017.pdf',
    onDownload: () => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof FilePreview>

export default meta

type Story = StoryObj<typeof meta>

/** A PDF in DocumentFrame, the third of twelve files. */
export const Default: Story = {
  args: PDF,
  play: async () => {
    await settle()
    const sheet = within(document.body).getByRole('dialog', {
      name: 'Employment contract RU-2026-017.pdf',
    })
    await expect(within(sheet).getByText('3 of 12')).toBeVisible()
    await expect(within(sheet).getByRole('button', { name: 'Next file' })).toBeEnabled()
  },
}

/** A photo in PageViewer; the first file, so Previous cannot be used. */
export const Photo: Story = {
  args: {
    name: 'Crane inspection.jpg',
    description: 'JPEG image · 3,2 MB · Tom Hughes',
    index: 1,
    total: 12,
    onNext: () => undefined,
    children: (
      <PageViewer
        label="Crane inspection.jpg"
        pages={[{ src: photoUri(2), width: 200, height: 150, alt: 'The tower crane at the gate' }]}
        className="h-full min-h-[24rem]"
      />
    ),
  },
}

/** A drawing the browser cannot show: Download instead. */
export const NoPreview: Story = {
  name: 'No preview',
  args: {
    name: 'Structural drawings rev C.dwg',
    description: 'DWG drawing · 8,6 MB',
    unavailable: true,
  },
  play: async () => {
    await settle()
    await expect(within(document.body).getByText('This file cannot be previewed')).toBeVisible()
  },
}

/** Long names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...PDF,
    name: 'Site handover protocol for the residential blocks C and D, signed by both parties after the second inspection round.pdf',
    description:
      'PDF · 1,8 MB · Grace Lin-Fairweather, project manager for the northern sites · Keep until 2036',
  },
}

/** Phone width: full screen. */
export const Phone: Story = {
  args: PDF,
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
  args: {
    name: 'فحص الرافعة.jpg',
    description: 'صورة · 3,2 ميغابايت',
    children: (
      <PageViewer
        label="فحص الرافعة.jpg"
        pages={[{ src: photoUri(2), width: 200, height: 150, alt: 'الرافعة' }]}
        className="h-full min-h-[24rem]"
      />
    ),
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
    name: 'クレーン点検.jpg',
    description: '画像 · 3,2 MB',
    children: (
      <PageViewer
        label="クレーン点検.jpg"
        pages={[{ src: photoUri(2), width: 200, height: 150, alt: 'クレーン' }]}
        className="h-full min-h-[24rem]"
      />
    ),
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

/** Next and previous by the buttons and the arrows of the reading direction. */
export const Browse: Story = {
  name: 'Browse, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [index, setIndex] = useState(0)
    const photo = PHOTOS[index]
    return (
      <FilePreview
        {...args}
        name={photo?.name ?? ''}
        index={index + 1}
        total={PHOTOS.length}
        {...(index > 0
          ? {
              onPrevious: () => {
                setIndex(index - 1)
              },
            }
          : {})}
        {...(index < PHOTOS.length - 1
          ? {
              onNext: () => {
                setIndex(index + 1)
              },
            }
          : {})}
      >
        <PageViewer
          label={photo?.name ?? ''}
          pages={[{ src: photo?.thumbnail ?? '', width: 200, height: 150, alt: '' }]}
          className="h-full min-h-[24rem]"
        />
      </FilePreview>
    )
  },
  play: async () => {
    await settle()
    const body = within(document.body)
    await userEvent.click(body.getByRole('button', { name: 'Next file' }))
    await expect(body.getByText('2 of 8')).toBeVisible()
    const rtl = getComputedStyle(body.getByRole('dialog')).direction === 'rtl'
    body.getByRole('button', { name: 'Next file' }).focus()
    await userEvent.keyboard(rtl ? '{ArrowLeft}' : '{ArrowRight}')
    await waitFor(async () => {
      await expect(body.getByText('3 of 8')).toBeVisible()
    })
    await userEvent.keyboard(rtl ? '{ArrowRight}' : '{ArrowLeft}')
    await waitFor(async () => {
      await expect(body.getByText('2 of 8')).toBeVisible()
    })
  },
}
